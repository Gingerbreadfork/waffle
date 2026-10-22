import { EditorState, EditorSelection, StateEffect, StateField, RangeSetBuilder } from '@codemirror/state';
import {
  EditorView,
  keymap,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  placeholder,
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { syntaxHighlighting, HighlightStyle, bracketMatching, indentUnit } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

export interface Anchor {
  line: number;
  offset: number;
}

export interface EditorApi {
  setContent(text: string, cursor?: number): void;
  getContent(): string;
  anchor(): Anchor;
  scrollToLine(line: number, offset: number, moveCursor: boolean): void;
  replaceLine(line: number, text: string): void;
  cursor(): number;
  focus(): void;
  blur(): void;
  setFocusMode(on: boolean): void;
}

export interface EditorOptions {
  onChange(text: string): void;
  onEscape(): void;
  topInset: number;
}

const waffleTheme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'transparent', color: 'var(--ink)' },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    fontVariationSettings: 'var(--mono-axes)',
    fontSize: 'var(--editor-size)',
    lineHeight: '1.75',
    overflow: 'auto',
  },
  '.cm-content': {
    maxWidth: 'calc(var(--measure) + 3rem)',
    margin: '0 auto',
    padding: 'calc(var(--bar-h) + 3.5rem) 1.5rem 50vh',
    caretColor: 'var(--golden)',
  },
  '.cm-line': { padding: '0' },
  '&.cm-focused': { outline: 'none' },
  '.cm-cursor, .cm-dropCursor': { borderLeft: '2px solid var(--golden)', marginLeft: '-1px' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground': {
    background: 'color-mix(in oklab, var(--golden) 30%, transparent)',
  },
  '.cm-activeLine': { backgroundColor: 'color-mix(in oklab, var(--ink) 4%, transparent)', borderRadius: '6px' },
  '.cm-selectionMatch': { background: 'color-mix(in oklab, var(--golden) 18%, transparent)', borderRadius: '3px' },
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
    background: 'color-mix(in oklab, var(--golden) 22%, transparent)',
    outline: 'none',
    borderRadius: '2px',
  },
  '.cm-searchMatch': { background: 'color-mix(in oklab, var(--golden) 30%, transparent)', borderRadius: '3px' },
  '.cm-searchMatch.cm-searchMatch-selected': { background: 'color-mix(in oklab, var(--golden) 60%, transparent)' },
  '.cm-placeholder': { color: 'var(--ink-soft)', fontStyle: 'italic' },
  '.cm-panels': {
    backgroundColor: 'var(--bg-raised)',
    color: 'var(--ink)',
    fontFamily: 'var(--font-ui)',
    fontVariationSettings: 'var(--ui-axes)',
    fontSize: '13px',
  },
  '.cm-panels.cm-panels-bottom': { borderTop: '1px solid var(--line)', paddingBottom: 'var(--strip-h)' },
  '.cm-panel.cm-search': { padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: '6px 10px', alignItems: 'center' },
  '.cm-panel.cm-search br': { display: 'none' },
  '.cm-panel.cm-search label': { display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--ink-soft)', fontSize: '12px' },
  '.cm-panel.cm-search input[type=checkbox]': { accentColor: 'var(--golden)', margin: '0' },
  '.cm-textfield': {
    background: 'var(--bg)',
    border: '1px solid var(--line)',
    borderRadius: '6px',
    padding: '5px 9px',
    color: 'var(--ink)',
    fontFamily: 'inherit',
    fontSize: '13px',
    minWidth: '180px',
  },
  '.cm-textfield:focus': { outline: 'none', borderColor: 'var(--golden)' },
  '.cm-button': {
    background: 'color-mix(in oklab, var(--ink) 7%, transparent)',
    backgroundImage: 'none',
    border: 'none',
    borderRadius: '6px',
    padding: '5px 11px',
    color: 'var(--ink)',
    fontFamily: 'inherit',
    fontSize: '12.5px',
    cursor: 'pointer',
  },
  '.cm-button:hover': { background: 'color-mix(in oklab, var(--ink) 12%, transparent)' },
  '.cm-button:active': { backgroundImage: 'none', background: 'color-mix(in oklab, var(--golden) 30%, transparent)' },
  '.cm-panel.cm-search [name=close]': { color: 'var(--ink-soft)', fontSize: '20px', top: '8px', right: '12px', cursor: 'pointer' },
});

const waffleHighlight = HighlightStyle.define([
  { tag: t.heading, fontWeight: '700', color: 'var(--ink-strong)' },
  { tag: t.heading1, fontSize: '1.6em', fontWeight: '800', lineHeight: '1.3' },
  { tag: t.heading2, fontSize: '1.32em', fontWeight: '760', lineHeight: '1.35' },
  { tag: t.heading3, fontSize: '1.15em', fontWeight: '720' },
  { tag: t.strong, fontWeight: '740', color: 'var(--ink-strong)' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through', color: 'var(--ink-soft)' },
  { tag: t.link, color: 'var(--blueberry)' },
  { tag: t.url, color: 'var(--blueberry)', opacity: '0.7' },
  { tag: t.monospace, background: 'var(--bg-chrome)', borderRadius: '4px' },
  { tag: t.quote, color: 'var(--ink-soft)', fontStyle: 'italic' },
  { tag: t.contentSeparator, color: 'var(--toasted)' },
  { tag: t.labelName, color: 'var(--ink-soft)' },
  { tag: t.escape, color: 'var(--ink-soft)' },
  { tag: t.atom, color: 'var(--toasted)', fontWeight: '600' },
  { tag: t.comment, color: 'var(--ink-soft)', fontStyle: 'italic' },
  { tag: t.keyword, color: 'var(--toasted)', fontWeight: '600' },
  { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--blueberry)' },
  { tag: [t.number, t.bool, t.null], color: 'var(--berry)' },
  { tag: [t.function(t.variableName), t.definition(t.variableName), t.className, t.typeName], color: 'var(--ink-strong)' },
  { tag: [t.propertyName, t.attributeName], color: 'var(--ink)' },
  { tag: t.operator, color: 'var(--ink-soft)' },
  { tag: t.processingInstruction, color: 'var(--toasted)', fontWeight: '500', fontStyle: 'normal' },
]);

// Focus mode: every line outside the paragraph around the cursor is dimmed.

const setFocusMode = StateEffect.define<boolean>();

const focusModeField = StateField.define<boolean>({
  create: () => false,
  update(value, tr) {
    for (const e of tr.effects) if (e.is(setFocusMode)) value = e.value;
    return value;
  },
});

const dimLine = Decoration.line({ class: 'cm-dim' });

const focusModePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }

    update(update: ViewUpdate) {
      const toggled = update.transactions.some((tr) => tr.effects.some((e) => e.is(setFocusMode)));
      if (update.docChanged || update.selectionSet || update.viewportChanged || toggled) {
        this.decorations = this.build(update.view);
      }
    }

    build(view: EditorView): DecorationSet {
      if (!view.state.field(focusModeField)) return Decoration.none;
      const doc = view.state.doc;
      const current = doc.lineAt(view.state.selection.main.head);
      const blank = (n: number) => /^\s*$/.test(doc.line(n).text);
      let start = current.number;
      let end = current.number;
      if (!blank(current.number)) {
        while (start > 1 && !blank(start - 1)) start--;
        while (end < doc.lines && !blank(end + 1)) end++;
      }
      const builder = new RangeSetBuilder<Decoration>();
      for (const { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to; ) {
          const line = doc.lineAt(pos);
          if (line.number < start || line.number > end) builder.add(line.from, line.from, dimLine);
          pos = line.to + 1;
        }
      }
      return builder.finish();
    }
  },
  { decorations: (v) => v.decorations },
);

// Inline formatting commands that wrap or unwrap the selection.

function toggleWrap(marker: string) {
  return (view: EditorView): boolean => {
    const changes = view.state.changeByRange((range) => {
      let { from, to } = range;
      const state = view.state;
      const len = marker.length;
      const before = state.sliceDoc(Math.max(0, from - len), from);
      const after = state.sliceDoc(to, to + len);
      if (before === marker && after === marker) {
        return {
          changes: [
            { from: from - len, to: from },
            { from: to, to: to + len },
          ],
          range: EditorSelection.range(from - len, to - len),
        };
      }
      const text = state.sliceDoc(from, to);
      if (text.length >= 2 * len && text.startsWith(marker) && text.endsWith(marker)) {
        const inner = text.slice(len, -len);
        return { changes: { from, to, insert: inner }, range: EditorSelection.range(from, from + inner.length) };
      }
      if (from === to) {
        const word = state.wordAt(from);
        if (word) {
          from = word.from;
          to = word.to;
        }
      }
      const selected = state.sliceDoc(from, to);
      return {
        changes: { from, to, insert: marker + selected + marker },
        range: EditorSelection.range(from + len, to + len),
      };
    });
    view.dispatch(changes, { scrollIntoView: true, userEvent: 'input' });
    return true;
  };
}

function insertLink(view: EditorView): boolean {
  const changes = view.state.changeByRange((range) => {
    const text = view.state.sliceDoc(range.from, range.to);
    if (text) {
      const insert = `[${text}]()`;
      const pos = range.from + insert.length - 1;
      return { changes: { from: range.from, to: range.to, insert }, range: EditorSelection.cursor(pos) };
    }
    return { changes: { from: range.from, insert: '[]()' }, range: EditorSelection.cursor(range.from + 1) };
  });
  view.dispatch(changes, { scrollIntoView: true, userEvent: 'input' });
  return true;
}

export function createEditor(parent: HTMLElement, options: EditorOptions): { api: EditorApi; destroy(): void } {
  let focusOn = false;

  const extensions = [
    history(),
    drawSelection(),
    dropCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    bracketMatching(),
    indentUnit.of('  '),
    EditorState.tabSize.of(2),
    EditorView.lineWrapping,
    placeholder('Start writing'),
    markdown({ base: markdownLanguage, codeLanguages: languages, addKeymap: true }),
    syntaxHighlighting(waffleHighlight),
    waffleTheme,
    focusModeField,
    focusModePlugin,
    keymap.of([
      { key: 'Mod-b', run: toggleWrap('**') },
      { key: 'Mod-i', run: toggleWrap('_') },
      { key: 'Mod-k', run: insertLink },
      {
        key: 'Escape',
        run: () => {
          options.onEscape();
          return true;
        },
      },
      ...searchKeymap,
      ...historyKeymap,
      ...defaultKeymap,
      indentWithTab,
    ]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) options.onChange(update.state.doc.toString());
    }),
  ];

  const view = new EditorView({ parent, state: EditorState.create({ doc: '', extensions }) });

  const lineNumber = (line: number) => Math.min(Math.max(line + 1, 1), view.state.doc.lines);

  const api: EditorApi = {
    // A new document gets a fresh state so undo history never crosses documents.
    setContent(text, cursor) {
      const pos = Math.min(cursor ?? 0, text.length);
      view.setState(EditorState.create({ doc: text, extensions, selection: { anchor: pos } }));
      if (focusOn) view.dispatch({ effects: setFocusMode.of(true) });
    },
    getContent: () => view.state.doc.toString(),
    anchor() {
      const rect = view.scrollDOM.getBoundingClientRect();
      const docTop = view.documentTop;
      const head = view.state.selection.main.head;
      const cursorBlock = view.lineBlockAt(head);
      const top = cursorBlock.top + docTop;
      const bottom = cursorBlock.bottom + docTop;
      if (top >= rect.top + options.topInset && bottom <= rect.bottom) {
        return { line: view.state.doc.lineAt(head).number - 1, offset: top - rect.top };
      }
      const block = view.lineBlockAtHeight(rect.top + options.topInset - docTop);
      return { line: view.state.doc.lineAt(block.from).number - 1, offset: block.top + docTop - rect.top };
    },
    scrollToLine(line, offset, moveCursor) {
      const pos = view.state.doc.line(lineNumber(line)).from;
      const yMargin = Math.max(options.topInset, offset);
      view.dispatch({
        effects: EditorView.scrollIntoView(pos, { y: 'start', yMargin }),
        ...(moveCursor ? { selection: { anchor: pos } } : {}),
      });
      if (moveCursor) return;
      // If the cursor ended up off screen, bring it to the line now in view.
      view.requestMeasure({
        read: () => {
          const rect = view.scrollDOM.getBoundingClientRect();
          const block = view.lineBlockAt(view.state.selection.main.head);
          const top = block.top + view.documentTop;
          return top < rect.top + options.topInset || top > rect.bottom - 24;
        },
        write: (offscreen) => {
          if (offscreen) view.dispatch({ selection: { anchor: pos } });
        },
      });
    },
    replaceLine(line, text) {
      const l = view.state.doc.line(lineNumber(line));
      view.dispatch({ changes: { from: l.from, to: l.to, insert: text } });
    },
    cursor: () => view.state.selection.main.head,
    focus: () => view.focus(),
    blur: () => view.contentDOM.blur(),
    setFocusMode(on) {
      focusOn = on;
      if (view.state.field(focusModeField) !== on) view.dispatch({ effects: setFocusMode.of(on) });
    },
  };

  return { api, destroy: () => view.destroy() };
}
