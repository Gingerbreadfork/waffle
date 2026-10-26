import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export type { Update };

// Resolves to a newer release once it has downloaded, or null when there is none.
// Throws where the app does not update itself, as in a Flatpak or a dev build.
export async function fetchUpdate(): Promise<Update | null> {
  const update = await check();
  if (!update) return null;
  await update.download();
  return update;
}

// On Windows the installer closes Waffle and starts the new version itself.
export async function applyUpdate(update: Update): Promise<void> {
  await update.install();
  await relaunch();
}
