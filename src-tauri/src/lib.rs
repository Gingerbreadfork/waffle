use std::path::Path;
use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_fs::FsExt;

/// Files named on a command line, held until the window takes them.
#[derive(Default)]
struct OpenedFiles(Mutex<Vec<String>>);

#[tauri::command]
fn take_opened_files(files: State<OpenedFiles>) -> Vec<String> {
    std::mem::take(&mut *files.0.lock().unwrap())
}

/// Queues the files among `args` and tells the window there are files to open.
fn queue_files(app: &AppHandle, args: &[String], cwd: &Path) {
    let paths: Vec<_> = args
        .iter()
        .filter(|arg| !arg.starts_with('-'))
        .map(|arg| cwd.join(arg))
        .filter(|path| path.is_file())
        .collect();
    if paths.is_empty() {
        return;
    }
    let scope = app.fs_scope();
    let state = app.state::<OpenedFiles>();
    let mut queue = state.0.lock().unwrap();
    for path in paths {
        // The file may sit outside the static scope, such as on another disk or in a portal.
        let _ = scope.allow_file(&path);
        queue.push(path.to_string_lossy().into_owned());
    }
    drop(queue);
    let _ = app.emit("opened-files", ());
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // A second launch, such as opening a file from the file manager, hands its files to this one.
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            queue_files(app, argv.get(1..).unwrap_or_default(), Path::new(&cwd));
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(OpenedFiles::default())
        .invoke_handler(tauri::generate_handler![take_opened_files])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            let args: Vec<String> = std::env::args_os()
                .skip(1)
                .filter_map(|arg| arg.into_string().ok())
                .collect();
            queue_files(app.handle(), &args, &std::env::current_dir()?);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Waffle");
}
