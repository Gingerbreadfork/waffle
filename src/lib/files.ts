import { isTauri, invoke, convertFileSrc } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { openUrl } from '@tauri-apps/plugin-opener';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

export const native = isTauri();

export interface OpenedFile {
  path?: string;
  name: string;
  text: string;
}

const markdownFilters = [{ name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'txt'] }];
const htmlFilters = [{ name: 'HTML', extensions: ['html'] }];

export function isMarkdownPath(path: string): boolean {
  return /\.(md|markdown|mdown|txt)$/i.test(path);
}

export function baseName(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}

// Points a local image at the asset protocol, resolving relative paths
// against the document's folder. Web and data URLs pass through.
export function localImageSrc(src: string, docPath: string): string {
  // Markdown arrives percent-encoded, with a Windows path's backslashes as %5C.
  const windowsPath = /^[a-zA-Z]:([\\/]|%5c)/i.test(src);
  if (!windowsPath && /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(src) && !/^file:/i.test(src)) return src;
  try {
    const base = 'file://' + toUrlPath(docPath);
    const url = new URL(windowsPath ? 'file:///' + src.replace(/\\|%5c/gi, '/') : src, base);
    let path = decodeURIComponent(url.pathname);
    if (/^\/[a-zA-Z]:\//.test(path)) path = path.slice(1);
    return convertFileSrc(path);
  } catch {
    return src;
  }
}

function toUrlPath(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/');
  return parts.startsWith('/') ? parts : '/' + parts;
}

export function fileNameFor(title: string, ext = 'md'): string {
  const base = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'untitled'}.${ext}`;
}

export async function openFileDialog(): Promise<OpenedFile | null> {
  if (native) {
    const path = await open({ multiple: false, directory: false, filters: markdownFilters, title: 'Open a Markdown file' });
    if (!path) return null;
    return { path, name: baseName(path), text: await readTextFile(path) };
  }
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.mdown,.txt,text/markdown,text/plain';
    input.onchange = async () => {
      const file = input.files?.[0];
      resolve(file ? { name: file.name, text: await file.text() } : null);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

// Files the desktop asked Waffle to open, at launch or from a later launch.
export async function takeOpenedFiles(): Promise<string[]> {
  return native ? invoke<string[]>('take_opened_files') : [];
}

export function onOpenedFiles(handler: () => void): Promise<UnlistenFn> {
  return listen('opened-files', handler);
}

export function readFile(path: string): Promise<string> {
  return readTextFile(path);
}

export function writeFile(path: string, text: string): Promise<void> {
  return writeTextFile(path, text);
}

export async function saveFileDialog(suggestedName: string, kind: 'md' | 'html'): Promise<string | null> {
  if (!native) return null;
  return save({ defaultPath: suggestedName, filters: kind === 'md' ? markdownFilters : htmlFilters, title: 'Save' });
}

export function downloadText(name: string, text: string, type = 'text/markdown'): void {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function openExternal(url: string): Promise<void> {
  if (native) await openUrl(url);
  else window.open(url, '_blank', 'noopener');
}

export async function copyText(text: string): Promise<void> {
  if (native) await writeText(text);
  else await navigator.clipboard.writeText(text);
}

export async function setWindowTitle(title: string): Promise<void> {
  document.title = title;
  if (native) await getCurrentWindow().setTitle(title);
}
