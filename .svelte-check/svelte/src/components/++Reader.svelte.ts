///<reference types="svelte" />
;
import { getWorkspace, BAR_INSET } from '../lib/workspace.svelte';
import { renderMarkdown } from '../lib/markdown';
import { openExternal } from '../lib/files';
function $$render() {

  
  
  

  const ws = getWorkspace();

  let root = $state<HTMLElement>();
  let article = $state<HTMLElement>();
  let activeId = $state('');

  const rendered = $derived(renderMarkdown(ws.readSource));
  const tocEntries = $derived(rendered.toc.filter((entry) => entry.level <= 3));
  const empty = $derived(ws.readSource.trim() === '');

  ws.reader = {
    anchor,
    scrollToLine,
    getScrollTop: () => root?.scrollTop ?? 0,
    setScrollTop: (top) => {
      if (root) root.scrollTop = top;
    },
    focus: () => root?.focus({ preventScroll: true }),
  };

  function blocks(): HTMLElement[] {
    return article ? Array.from(article.querySelectorAll<HTMLElement>('[data-line]')) : [];
  }

  function lineRange(el: HTMLElement): [number, number] {
    const start = Number(el.dataset.line);
    const end = Number(el.dataset.lineEnd ?? start + 1);
    return [start, Math.max(end, start + 1)];
  }

  // The source line sitting at the top of the viewport, and how far down it is.
  function anchor() {
    if (!root || !article) return null;
    const rootRect = root.getBoundingClientRect();
    const topY = rootRect.top + BAR_INSET;
    let containing: HTMLElement | null = null;
    let next: HTMLElement | null = null;
    for (const el of blocks()) {
      const r = el.getBoundingClientRect();
      if (r.top <= topY && r.bottom > topY) containing = el;
      else if (!next && r.top > topY) next = el;
    }
    const el = containing ?? next;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const [start, end] = lineRange(el);
    if (r.top >= topY) return { line: start, offset: r.top - rootRect.top };
    const fraction = (topY - r.top) / r.height;
    const line = Math.min(start + Math.floor(fraction * (end - start)), end - 1);
    return { line, offset: BAR_INSET };
  }

  function scrollToLine(line: number, offset: number, highlight = false) {
    if (!root || !article) return;
    let exact: HTMLElement | null = null;
    let before: HTMLElement | null = null;
    let beforeStart = -1;
    for (const el of blocks()) {
      const [start, end] = lineRange(el);
      if (start <= line && line < end) exact = el;
      if (start <= line && start >= beforeStart) {
        before = el;
        beforeStart = start;
      }
    }
    const el = exact ?? before;
    if (!el) {
      root.scrollTop = 0;
      return;
    }
    const rootRect = root.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const [start, end] = lineRange(el);
    let y: number;
    if (exact) y = r.top + ((line - start) / (end - start)) * r.height;
    else y = line >= end ? r.bottom : r.top;
    root.scrollTop += y - (rootRect.top + offset);
    if (highlight) {
      el.classList.remove('is-here');
      void el.offsetWidth;
      el.classList.add('is-here');
      el.addEventListener('animationend', () => el.classList.remove('is-here'), { once: true });
    }
  }

  function scrollToId(id: string) {
    if (!root || !article) return;
    const el = article.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!el) return;
    const top = root.scrollTop + el.getBoundingClientRect().top - root.getBoundingClientRect().top - BAR_INSET - 20;
    root.scrollTo({ top, behavior: 'smooth' });
  }

  let pending = false;

  function onscroll() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      if (!root) return;
      const max = root.scrollHeight - root.clientHeight;
      ws.progress = max > 0 ? Math.min(1, root.scrollTop / max) : 0;
      updateActive();
    });
  }

  function updateActive() {
    if (!root || !article) return;
    const topY = root.getBoundingClientRect().top + BAR_INSET + 24;
    let id = '';
    for (const heading of article.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id]')) {
      if (heading.getBoundingClientRect().top <= topY) id = heading.id;
      else break;
    }
    activeId = id;
  }

  $effect(() => {
    void rendered;
    updateActive();
  });

  async function onclick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const copy = target.closest<HTMLButtonElement>('.code-copy');
    if (copy) {
      const code = copy.parentElement?.querySelector('code')?.textContent ?? '';
      if (await ws.copySnippet(code)) {
        copy.textContent = 'Copied';
        copy.classList.add('is-done');
        setTimeout(() => {
          copy.textContent = 'Copy';
          copy.classList.remove('is-done');
        }, 1500);
      }
      return;
    }
    const link = target.closest<HTMLAnchorElement>('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') ?? '';
    event.preventDefault();
    if (href.startsWith('#')) scrollToId(decodeURIComponent(href.slice(1)));
    else if (/^(https?:|mailto:)/i.test(href)) void openExternal(href);
  }

  // Double-click a block to edit it: the line under the pointer opens under the cursor.
  function ondblclick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('a, button, input, pre')) return;
    const block = target.closest<HTMLElement>('[data-line]');
    if (!block || !root) return;
    const r = block.getBoundingClientRect();
    const [start, end] = lineRange(block);
    const fraction = Math.min(0.999, Math.max(0, (event.clientY - r.top) / r.height));
    const line = start + Math.floor(fraction * (end - start));
    const offset = r.top + ((line - start) / (end - start)) * r.height - root.getBoundingClientRect().top;
    window.getSelection()?.removeAllRanges();
    void ws.setMode('write', { anchor: { line, offset }, moveCursor: true });
  }

  function onchange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.classList.contains('task-check')) return;
    const item = input.closest<HTMLElement>('li[data-line]');
    if (item) ws.toggleTask(Number(item.dataset.line), input.checked);
  }
;
async () => {

  { const $$_section0 = svelteHTML.createElement("section", {        "class":['view', 'view-read', { 'is-active': ws.mode === 'read' }],"tabindex":-1,"aria-label":`Reading`,onscroll,});root = $$_section0;
   { svelteHTML.createElement("div", { "class":`grid`,});
     { svelteHTML.createElement("nav", {   "class":['toc', { show: tocEntries.length > 1 }],"aria-label":`Contents`,});
         for(let entry of __sveltets_2_ensureArray(tocEntries)){entry.id;
         { svelteHTML.createElement("a", {      "class":['toc-link', `lvl-${entry.level}`, { active: entry.id === activeId }],"href":`#${entry.id}`,"onclick":(e) => {
            e.preventDefault();
            scrollToId(entry.id);
          },});entry.text; }
      }
     }
    if(empty){
       { svelteHTML.createElement("div", { "class":`paper paper-empty`,});
         { svelteHTML.createElement("p", {});    }
         { svelteHTML.createElement("button", {   "class":`btn btn-primary`,"onclick":() => ws.setMode('write'),});  }
       }
    }else{
      
      
       { const $$_article2 = svelteHTML.createElement("article", {     "class":`paper`,onclick,ondblclick,onchange,});article = $$_article2;
         rendered.html;
       }
    }
   }
 }


};
return { props: {} as Record<string, never>, exports: {}, bindings: __sveltets_$$bindings(''), slots: {}, events: {} }}
const Reader__SvelteComponent_ = __sveltets_2_fn_component($$render());
/*Ωignore_startΩ*/type Reader__SvelteComponent_ = ReturnType<typeof Reader__SvelteComponent_>;
/*Ωignore_endΩ*/export default Reader__SvelteComponent_;