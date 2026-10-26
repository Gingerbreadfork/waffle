import { createContext, tick } from 'svelte';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { confirm } from '@tauri-apps/plugin-dialog';
import type { WaffleDoc } from './types';
import { openLibrary, type Library } from './library';
import * as files from './files';
import { deriveTitle, snippet, docStats, renderMarkdown, exportHtml } from './markdown';
import { settings, storedTheme, systemTheme, saveTheme, type Theme } from './settings';
import { toasts } from './toasts.svelte';
import type { EditorApi, Anchor } from './editor';
import welcome from './welcome.md?raw';

export type Mode = 'read' | 'write';

export interface ReaderApi {
  anchor(): Anchor | null;
  scrollToLine(line: number, offset: number, highlight?: boolean): void;
  getScrollTop(): number;
  setScrollTop(top: number): void;
  focus(): void;
  find(): void;
  findNext(by: 1 | -1): void;
}

export const BAR_INSET = 52;

export class Workspace {
  docs = $state<WaffleDoc[]>([]);
  current = $state<WaffleDoc | null>(null);
  mode = $state<Mode>('read');
  theme = $state<Theme>('light');
  focus = $state(false);
  shelfOpen = $state(false);
  menuOpen = $state(false);
  findOpen = $state(false);
  dropping = $state(false);
  saving = $state(false);
  ready = $state(false);
  stats = $state({ words: 0, minutes: 0 });
  readSource = $state('');
  progress = $state(0);

  sortedDocs = $derived([...this.docs].sort((a, b) => b.updatedAt - a.updatedAt));
  dirty = $derived(!!this.current?.path && this.current.content !== this.current.diskContent);
  saveLabel = $derived.by(() => {
    const doc = this.current;
    if (!doc) return '';
    if (doc.path) return this.dirty ? `Unsaved changes in ${doc.fileName}` : `Saved to ${doc.fileName}`;
    return this.saving ? 'Saving' : 'Saved';
  });

  readonly isMac = /Mac|iPhone|iPad/i.test(navigator.userAgentData?.platform ?? navigator.userAgent);
  readonly modKey = this.isMac ? '⌘' : 'Ctrl';
  readonly native = files.native;

  reader: ReaderApi | null = null;
  editor: EditorApi | null = null;

  private library: Library | null = null;
  private readStale = false;
  private persistTimer: ReturnType<typeof setTimeout> | undefined;
  private statsTimer: ReturnType<typeof setTimeout> | undefined;
  private pendingPersist: WaffleDoc | null = null;

  async init(): Promise<void> {
    this.applyTheme(storedTheme() ?? systemTheme(), false);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!storedTheme()) this.applyTheme(e.matches ? 'dark' : 'light', false);
    });
    this.focus = settings.get('focus', false);

    try {
      this.library = await openLibrary();
      let docs = await this.library.list();
      if (docs.length === 0) {
        const doc = this.makeDoc(welcome);
        docs = [doc];
        await this.library.put(doc);
      }
      this.docs = docs;
      await this.openHandedFiles();
      if (!this.current) {
        const last = settings.get<string | null>('lastDoc', null);
        const first = this.sortedDocs.find((d) => d.id === last) ?? this.sortedDocs[0];
        await this.openDoc(first.id);
      }
    } catch (err) {
      console.error(err);
      toasts.show("Couldn't load your documents", 4000);
      if (!this.current) await this.newDoc();
    } finally {
      this.ready = true;
    }

    if (this.native) void this.attachNative();
    window.addEventListener('pagehide', () => void this.flushPersist());
  }

  private async attachNative(): Promise<void> {
    await files.onOpenedFiles(() => void this.openHandedFiles());
    // Catches files handed over while the listener was being set up.
    void this.openHandedFiles();
    await getCurrentWebview().onDragDropEvent((event) => {
      const payload = event.payload;
      if (payload.type === 'enter' || payload.type === 'over') this.dropping = true;
      else if (payload.type === 'leave') this.dropping = false;
      else if (payload.type === 'drop') {
        this.dropping = false;
        const path = payload.paths.find(files.isMarkdownPath) ?? payload.paths[0];
        if (path) void this.openPath(path);
      }
    });
    await getCurrentWindow().onCloseRequested(async (event) => {
      await this.flushPersist();
      if (!this.dirty || !this.current) return;
      const close = await confirm(`Close without saving your changes to ${this.current.fileName}?`, {
        title: 'Unsaved changes',
        kind: 'warning',
        okLabel: 'Close anyway',
        cancelLabel: 'Keep editing',
      });
      if (!close) event.preventDefault();
    });
  }

  // Documents

  private makeDoc(content: string, extra: Partial<WaffleDoc> = {}): WaffleDoc {
    const now = Date.now();
    const title = deriveTitle(content);
    return { id: crypto.randomUUID(), title, snippet: snippet(content, title), content, createdAt: now, updatedAt: now, ...extra };
  }

  async openDoc(id: string, opts: { mode?: Mode } = {}): Promise<void> {
    const doc = this.docs.find((d) => d.id === id);
    if (!doc) return;
    const previous = this.current;
    if (previous && previous !== doc) {
      previous.readTop = this.reader?.getScrollTop() ?? previous.readTop;
      previous.cursor = this.editor?.cursor() ?? previous.cursor;
      await this.flushPersist();
      void this.persist(previous);
    }

    if (doc.path && this.native) await this.refreshFromDisk(doc);

    this.current = doc;
    this.readSource = doc.content;
    this.readStale = false;
    this.stats = docStats(doc.content);
    this.saving = false;
    this.editor?.setContent(doc.content, doc.cursor);
    this.mode = opts.mode ?? (doc.content.trim() ? 'read' : 'write');
    this.shelfOpen = false;
    settings.set('lastDoc', id);
    void files.setWindowTitle(`${doc.title} – Waffle`);

    await tick();
    if (this.mode === 'read') {
      this.reader?.setScrollTop(doc.readTop ?? 0);
      this.reader?.focus();
    } else {
      this.editor?.focus();
    }
  }

  private async refreshFromDisk(doc: WaffleDoc): Promise<void> {
    try {
      const text = await files.readFile(doc.path!);
      if (text === doc.diskContent) return;
      const clean = doc.content === doc.diskContent;
      doc.diskContent = text;
      if (clean) this.applyContent(doc, text);
    } catch {
      /* the file may have moved; keep the stored copy */
    }
  }

  private applyContent(doc: WaffleDoc, text: string): void {
    doc.content = text;
    doc.title = deriveTitle(text);
    doc.snippet = snippet(text, doc.title);
  }

  async newDoc(): Promise<void> {
    const doc = this.makeDoc('');
    this.docs.push(doc);
    await this.library?.put($state.snapshot(doc));
    await this.openDoc(doc.id, { mode: 'write' });
  }

  async openFile(): Promise<void> {
    try {
      const file = await files.openFileDialog();
      if (file) await this.adoptFile(file);
    } catch (err) {
      console.error(err);
      toasts.show("Couldn't open that file");
    }
  }

  async openPath(path: string): Promise<void> {
    try {
      const text = await files.readFile(path);
      await this.adoptFile({ path, name: files.baseName(path), text });
    } catch (err) {
      console.error(err);
      toasts.show(`Couldn't open ${files.baseName(path)}`);
    }
  }

  private async openHandedFiles(): Promise<void> {
    for (const path of await files.takeOpenedFiles()) await this.openPath(path);
  }

  async openDroppedFile(name: string, text: string): Promise<void> {
    await this.adoptFile({ name, text });
  }

  private async adoptFile(file: files.OpenedFile): Promise<void> {
    const existing = file.path ? this.docs.find((d) => d.path === file.path) : undefined;
    if (existing) {
      const clean = existing.content === existing.diskContent;
      existing.diskContent = file.text;
      if (clean) this.applyContent(existing, file.text);
      await this.openDoc(existing.id);
      return;
    }
    const doc = this.makeDoc(file.text, {
      path: file.path,
      fileName: file.name,
      diskContent: file.path ? file.text : undefined,
    });
    this.docs.push(doc);
    await this.library?.put($state.snapshot(doc));
    await this.openDoc(doc.id);
  }

  async save(): Promise<void> {
    const doc = this.current;
    if (!doc) return;
    if (doc.path && this.native) await this.writeDoc(doc, doc.path);
    else await this.saveAs();
  }

  async saveAs(): Promise<void> {
    const doc = this.current;
    if (!doc) return;
    const name = files.fileNameFor(doc.title);
    if (this.native) {
      const path = await files.saveFileDialog(name, 'md');
      if (!path) return;
      doc.path = path;
      doc.fileName = files.baseName(path);
      await this.writeDoc(doc, path);
    } else {
      files.downloadText(name, doc.content);
      toasts.show(`Downloaded ${name}`);
    }
  }

  private async writeDoc(doc: WaffleDoc, path: string): Promise<void> {
    try {
      await files.writeFile(path, doc.content);
      doc.diskContent = doc.content;
      this.schedulePersist(doc, 0);
      toasts.show(`Saved ${doc.fileName}`);
    } catch (err) {
      console.error(err);
      toasts.show(`Couldn't save ${doc.fileName}`);
    }
  }

  async deleteDoc(id: string): Promise<void> {
    const index = this.docs.findIndex((d) => d.id === id);
    if (index < 0) return;
    if (this.pendingPersist?.id === id) {
      clearTimeout(this.persistTimer);
      this.pendingPersist = null;
    }
    await this.library?.remove(id);
    this.docs.splice(index, 1);
    if (this.current?.id === id) {
      this.current = null;
      if (this.docs.length) await this.openDoc(this.sortedDocs[0].id);
      else await this.newDoc();
    }
    toasts.show('Deleted');
  }

  async exportHtml(): Promise<void> {
    const doc = this.current;
    if (!doc) return;
    const { html } = renderMarkdown(doc.content);
    const out = exportHtml(doc.title, html);
    const name = files.fileNameFor(doc.title, 'html');
    if (this.native) {
      const path = await files.saveFileDialog(name, 'html');
      if (!path) return;
      try {
        await files.writeFile(path, out);
        toasts.show(`Exported ${files.baseName(path)}`);
      } catch (err) {
        console.error(err);
        toasts.show("Couldn't export");
      }
    } else {
      files.downloadText(name, out, 'text/html');
    }
  }

  async copyMarkdown(): Promise<void> {
    if (!this.current) return;
    try {
      await files.copyText(this.current.content);
      toasts.show('Copied Markdown');
    } catch {
      toasts.show("Couldn't copy");
    }
  }

  async copySnippet(text: string): Promise<boolean> {
    try {
      await files.copyText(text);
      return true;
    } catch {
      toasts.show("Couldn't copy");
      return false;
    }
  }

  async print(): Promise<void> {
    if (this.readStale && this.current) {
      this.readSource = this.current.content;
      this.readStale = false;
      await tick();
    }
    window.print();
  }

  // Editing

  onEditorChange(text: string): void {
    const doc = this.current;
    if (!doc || text === doc.content) return;
    this.applyContent(doc, text);
    doc.updatedAt = Date.now();
    this.readStale = true;
    this.saving = true;
    clearTimeout(this.statsTimer);
    this.statsTimer = setTimeout(() => {
      this.stats = docStats(text);
    }, 150);
    this.schedulePersist(doc);
  }

  toggleTask(line: number, checked: boolean): void {
    const doc = this.current;
    if (!doc) return;
    const lines = doc.content.split('\n');
    const source = lines[line];
    if (source == null) return;
    const next = source.replace(/^(\s*(?:[-*+]|\d+[.)])\s+\[)[ xX](\])/, (_m, a: string, b: string) => `${a}${checked ? 'x' : ' '}${b}`);
    if (next === source) return;
    if (this.editor) {
      this.editor.replaceLine(line, next);
    } else {
      lines[line] = next;
      this.onEditorChange(lines.join('\n'));
    }
    this.readSource = doc.content;
    this.readStale = false;
  }

  private schedulePersist(doc: WaffleDoc, delay = 500): void {
    clearTimeout(this.persistTimer);
    this.pendingPersist = doc;
    this.persistTimer = setTimeout(() => void this.flushPersist(), delay);
  }

  private async flushPersist(): Promise<void> {
    clearTimeout(this.persistTimer);
    const doc = this.pendingPersist;
    this.pendingPersist = null;
    if (doc) await this.persist(doc);
  }

  private async persist(doc: WaffleDoc): Promise<void> {
    try {
      await this.library?.put($state.snapshot(doc));
    } catch (err) {
      console.error(err);
      toasts.show("Couldn't save your changes locally");
      return;
    }
    if (this.current === doc) {
      this.saving = false;
      void files.setWindowTitle(`${doc.title} – Waffle`);
    }
  }

  // Modes

  async setMode(mode: Mode, opts: { anchor?: Anchor; moveCursor?: boolean } = {}): Promise<void> {
    if (!this.current) return;
    if (mode === this.mode) {
      if (mode === 'write') this.editor?.focus();
      return;
    }
    if (mode === 'write') {
      const anchor = opts.anchor ?? this.reader?.anchor();
      if (anchor) this.editor?.scrollToLine(anchor.line, anchor.offset, !!opts.moveCursor);
      this.mode = 'write';
      await tick();
      this.editor?.focus();
    } else {
      const anchor = this.editor?.anchor();
      if (this.readStale) {
        this.readSource = this.current.content;
        this.readStale = false;
        await tick();
      }
      if (anchor) this.reader?.scrollToLine(anchor.line, anchor.offset, true);
      this.mode = 'read';
      await tick();
      this.reader?.focus();
    }
  }

  toggleMode(): void {
    void this.setMode(this.mode === 'read' ? 'write' : 'read');
  }

  // Find on the page while reading, or the editor's find and replace while writing.
  find(): void {
    if (this.mode === 'read') this.reader?.find();
    else this.editor?.find();
  }

  closeFind(): void {
    this.findOpen = false;
    this.reader?.focus();
  }

  toggleFocus(): void {
    this.focus = !this.focus;
    settings.set('focus', this.focus);
  }

  // Theme

  applyTheme(theme: Theme, persist: boolean): void {
    this.theme = theme;
    document.documentElement.dataset.theme = theme;
    if (persist) saveTheme(theme);
  }

  toggleTheme(): void {
    this.applyTheme(this.theme === 'dark' ? 'light' : 'dark', true);
  }

  // Keyboard

  handleKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.menuOpen) {
        this.menuOpen = false;
        return;
      }
      if (this.shelfOpen) {
        this.shelfOpen = false;
        return;
      }
      // The editor uses Escape to return to reading, which must not also close find.
      if (this.findOpen && this.mode === 'read' && !event.defaultPrevented) this.closeFind();
      return;
    }
    if (event.key === 'F3' && this.findOpen && this.mode === 'read') {
      event.preventDefault();
      this.reader?.findNext(event.shiftKey ? -1 : 1);
      return;
    }
    const mod = this.isMac ? event.metaKey : event.ctrlKey;
    if (!mod || event.altKey) return;
    switch (event.key.toLowerCase()) {
      case 'e':
        event.preventDefault();
        this.toggleMode();
        break;
      case 's':
        event.preventDefault();
        if (event.shiftKey) void this.saveAs();
        else void this.save();
        break;
      case 'o':
        event.preventDefault();
        void this.openFile();
        break;
      case '\\':
        event.preventDefault();
        this.shelfOpen = !this.shelfOpen;
        break;
      case 'p':
        event.preventDefault();
        void this.print();
        break;
      case 'f':
        // The editor opens its own search panel when it has focus.
        if (event.defaultPrevented) break;
        event.preventDefault();
        this.find();
        break;
      case 'g':
        if (!this.findOpen || this.mode !== 'read') break;
        event.preventDefault();
        this.reader?.findNext(event.shiftKey ? -1 : 1);
        break;
    }
  }
}

export const [getWorkspace, setWorkspace] = createContext<Workspace>();
