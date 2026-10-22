import MarkdownIt from 'markdown-it';
import type { MarkdownIt as MarkdownItInstance, StateCore, Token } from 'markdown-it';
import footnote from 'markdown-it-footnote';
import hljs from 'highlight.js/lib/common';
import DOMPurify from 'dompurify';

export interface TocEntry {
  level: number;
  text: string;
  id: string;
  line: number;
}

export interface Rendered {
  html: string;
  toc: TocEntry[];
}

type Env = { toc?: TocEntry[] };

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
      } catch {
        /* fall through to plain text */
      }
    }
    return '';
  },
});

md.use(footnote);
md.use(taskLists);
md.use(headingIds);
md.use(sourceLines);

// Fenced code keeps its source lines on the <pre> so the reader can map it back.
const defaultFence = md.renderer.rules.fence!;
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const html = defaultFence(tokens, idx, options, env, self);
  const lang = token.info.trim().split(/\s+/)[0] ?? '';
  const attrs =
    (token.map ? ` data-line="${token.map[0]}" data-line-end="${token.map[1]}"` : '') +
    (lang ? ` data-lang="${md.utils.escapeHtml(lang)}"` : '');
  return html.replace(/^<pre/, `<pre class="code-block"${attrs}`);
};

const defaultCodeBlock = md.renderer.rules.code_block!;
md.renderer.rules.code_block = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const html = defaultCodeBlock(tokens, idx, options, env, self);
  const attrs = token.map ? ` data-line="${token.map[0]}" data-line-end="${token.map[1]}"` : '';
  return html.replace(/^<pre/, `<pre class="code-block"${attrs}`);
};

function sourceLines(m: MarkdownItInstance) {
  m.core.ruler.push('source_lines', (state: StateCore) => {
    for (const t of state.tokens) {
      if (!t.map || t.nesting === -1 || t.hidden) continue;
      if (t.type === 'inline' || t.type === 'fence' || t.type === 'code_block') continue;
      t.attrSet('data-line', String(t.map[0]));
      t.attrSet('data-line-end', String(t.map[1]));
    }
  });
}

function taskLists(m: MarkdownItInstance) {
  m.core.ruler.after('inline', 'task_lists', (state: StateCore) => {
    const tokens = state.tokens;
    for (let i = 2; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.type !== 'inline') continue;
      if (tokens[i - 1].type !== 'paragraph_open' || tokens[i - 2].type !== 'list_item_open') continue;
      const first = t.children?.[0];
      if (!first || first.type !== 'text') continue;
      const match = /^\[([ xX])\](?:\s+|$)/.exec(first.content);
      if (!match) continue;
      const checked = match[1] !== ' ';
      first.content = first.content.slice(match[0].length);
      const box = new state.Token('html_inline', '', 0);
      box.content = `<input type="checkbox" class="task-check"${checked ? ' checked' : ''}>`;
      t.children!.unshift(box);
      tokens[i - 2].attrJoin('class', checked ? 'task done' : 'task');
    }
  });
}

function headingIds(m: MarkdownItInstance) {
  m.core.ruler.push('heading_ids', (state: StateCore) => {
    const env = state.env as Env;
    const toc: TocEntry[] = (env.toc = []);
    const used = new Map<string, number>();
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.type !== 'heading_open') continue;
      const text = inlineText(tokens[i + 1]);
      let id = slugify(text) || 'section';
      const n = used.get(id) ?? 0;
      used.set(id, n + 1);
      if (n) id = `${id}-${n}`;
      t.attrSet('id', id);
      toc.push({ level: Number(t.tag[1]), text, id, line: t.map?.[0] ?? 0 });
    }
  });
}

function inlineText(t: Token | undefined): string {
  if (!t?.children) return t?.content ?? '';
  return t.children
    .filter((c) => c.type === 'text' || c.type === 'code_inline')
    .map((c) => c.content)
    .join('')
    .trim();
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    const href = node.getAttribute('href') ?? '';
    if (/^(https?:|mailto:)/i.test(href)) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  }
});

export function renderMarkdown(src: string): Rendered {
  const env: Env = {};
  const raw = md.render(src, env);
  const html = finishHtml(DOMPurify.sanitize(raw, { ADD_ATTR: ['target'] }));
  return { html, toc: env.toc ?? [] };
}

// Reader affordances added after sanitising: scrollable tables, captioned
// figures, and a copy button plus language label on code blocks.
function finishHtml(html: string): string {
  const doc = new DOMParser().parseFromString(`<!doctype html><body>${html}`, 'text/html');
  for (const table of doc.querySelectorAll('table')) {
    const wrap = doc.createElement('div');
    wrap.className = 'table-wrap';
    table.replaceWith(wrap);
    wrap.append(table);
  }
  for (const p of doc.querySelectorAll('p')) {
    const img = p.firstElementChild;
    if (!img || img.tagName !== 'IMG' || p.childElementCount !== 1 || p.textContent?.trim()) continue;
    const figure = doc.createElement('figure');
    for (const attr of ['data-line', 'data-line-end']) {
      const v = p.getAttribute(attr);
      if (v) figure.setAttribute(attr, v);
    }
    figure.append(img);
    const alt = img.getAttribute('alt');
    if (alt) {
      const caption = doc.createElement('figcaption');
      caption.textContent = alt;
      figure.append(caption);
    }
    p.replaceWith(figure);
  }
  for (const pre of doc.querySelectorAll('pre')) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.textContent = 'Copy';
    pre.append(button);
    const lang = pre.getAttribute('data-lang');
    if (lang) {
      const label = doc.createElement('span');
      label.className = 'code-lang';
      label.textContent = lang;
      pre.append(label);
    }
  }
  return doc.body.innerHTML;
}

export function docStats(src: string): { words: number; minutes: number } {
  const text = src
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ');
  const words = (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu) ?? []).length;
  const minutes = words === 0 ? 0 : Math.max(1, Math.round(words / 230));
  return { words, minutes };
}

export function deriveTitle(src: string): string {
  const lines = src.split('\n');
  for (const line of lines) {
    const h = /^\s{0,3}#\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) return cleanInline(h[1]);
  }
  for (const line of lines) {
    const s = line.trim();
    if (!s || /^(```|---|\*\*\*|___|<)/.test(s)) continue;
    const t = cleanInline(s.replace(/^#{1,6}\s+|^[-*+]\s+(\[[ xX]\]\s+)?|^\d+[.)]\s+|^>\s*/, ''));
    if (t) return t.length > 64 ? t.slice(0, 61).trimEnd() + '…' : t;
  }
  return 'Untitled';
}

export function snippet(src: string, title: string): string {
  const lines = src.split('\n');
  for (const line of lines) {
    const s = line.trim();
    if (!s || /^(#|```|---|\*\*\*|___|<|\|)/.test(s)) continue;
    const t = cleanInline(s.replace(/^[-*+]\s+(\[[ xX]\]\s+)?|^\d+[.)]\s+|^>\s*/, ''));
    if (t && t !== title) return t.length > 90 ? t.slice(0, 87).trimEnd() + '…' : t;
  }
  return '';
}

function cleanInline(s: string): string {
  return s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`]+/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function exportHtml(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${md.utils.escapeHtml(title)}</title>
<style>
  body { margin: 0; background: #faf3e0; color: #4a3118; font-family: 'Fraunces', 'Iowan Old Style', Georgia, serif; font-size: 19px; line-height: 1.62; }
  main { max-width: 42rem; margin: 0 auto; padding: 4rem 1.5rem 8rem; }
  h1, h2, h3, h4 { color: #2b1a0d; line-height: 1.15; }
  h1 { font-size: 2.6rem; margin: 0 0 1.5rem; }
  h2 { font-size: 1.8rem; margin: 3rem 0 0.9rem; }
  h3 { font-size: 1.35rem; margin: 2.2rem 0 0.7rem; }
  a { color: #4a5aa8; }
  blockquote { margin: 1.75rem 0; padding-left: 1.35rem; border-left: 3px solid #d79d36; font-style: italic; }
  code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.85em; }
  :not(pre) > code { background: #f2e7cb; padding: 0.12em 0.4em; border-radius: 5px; }
  pre { background: #f2e7cb; padding: 1.1rem 1.25rem; border-radius: 10px; overflow-x: auto; font-size: 0.82em; line-height: 1.6; }
  table { border-collapse: collapse; width: 100%; font-size: 0.9em; }
  th { text-align: left; border-bottom: 2px solid #cdb884; padding: 0.5em 0.75em; }
  td { border-bottom: 1px solid #e5d7b3; padding: 0.55em 0.75em; vertical-align: top; }
  hr { border: 0; text-align: center; margin: 3rem 0; }
  hr::after { content: '▪ ▪ ▪'; color: #d79d36; letter-spacing: 0.5em; }
  img { max-width: 100%; height: auto; border-radius: 10px; }
  li.task { list-style: none; }
  .footnotes { margin-top: 3rem; border-top: 1px solid #e5d7b3; padding-top: 1rem; font-size: 0.86em; color: #8b6d4b; }
  .footnotes-sep { display: none; }
</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;
}
