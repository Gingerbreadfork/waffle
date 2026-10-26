<script lang="ts">
  import { getWorkspace, BAR_INSET } from '../lib/workspace.svelte';
  import { renderMarkdown } from '../lib/markdown';
  import { openExternal } from '../lib/files';
  import Find from './Find.svelte';

  const ws = getWorkspace();

  let root = $state<HTMLElement>();
  let article = $state<HTMLElement>();
  let activeId = $state('');
  let finder = $state<ReturnType<typeof Find>>();

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
    find: () => void finder?.open(),
    findNext: (by) => finder?.step(by),
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
</script>

<section
  class={['view', 'view-read', { 'is-active': ws.mode === 'read' }]}
  bind:this={root}
  tabindex="-1"
  aria-label="Reading"
  {onscroll}
>
  <div class="grid">
    <nav class={['toc', { show: tocEntries.length > 1 }]} aria-label="Contents">
      {#each tocEntries as entry (entry.id)}
        <a
          class={['toc-link', `lvl-${entry.level}`, { active: entry.id === activeId }]}
          href="#{entry.id}"
          onclick={(e) => {
            e.preventDefault();
            scrollToId(entry.id);
          }}>{entry.text}</a
        >
      {/each}
    </nav>
    {#if empty}
      <div class="paper paper-empty">
        <p>Nothing to read yet.</p>
        <button class="btn btn-primary" onclick={() => ws.setMode('write')}>Start writing</button>
      </div>
    {:else}
      <!-- Clicks are delegated to the buttons, links and checkboxes inside, which handle keys natively. -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
      <article class="paper" bind:this={article} {onclick} {ondblclick} {onchange}>
        {@html rendered.html}
      </article>
    {/if}
  </div>
</section>

<Find bind:this={finder} {article} scroller={root} html={rendered.html} />

<style>
  .view-read {
    overflow-y: auto;
    overflow-x: hidden;
    outline: none;
    scroll-padding-top: calc(var(--bar-h) + 1rem);
  }

  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, var(--measure)) minmax(0, 1fr);
    column-gap: 2rem;
    padding: calc(var(--bar-h) + 3.5rem) 1.5rem 30vh;
  }

  .grid > :global(.paper) {
    grid-column: 2;
    min-width: 0;
  }

  .toc {
    grid-column: 1;
    justify-self: end;
    align-self: start;
    position: sticky;
    top: calc(var(--bar-h) + 3.5rem);
    width: 13.5rem;
    max-height: calc(100dvh - var(--bar-h) - 6rem);
    overflow-y: auto;
    padding-right: 0.5rem;
    font-size: 0.78rem;
    line-height: 1.35;
    display: none;
    scrollbar-width: none;
  }

  @media (min-width: 1180px) {
    .toc.show {
      display: block;
    }
  }

  .toc-link {
    display: block;
    padding: 0.32rem 0.65rem;
    color: var(--ink-soft);
    text-decoration: none;
    border-left: 2px solid transparent;
    border-radius: 0 var(--r-sm) var(--r-sm) 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition:
      color 0.15s,
      border-color 0.15s,
      background-color 0.15s;
  }

  .toc-link.lvl-2 {
    padding-left: 1.3rem;
  }

  .toc-link.lvl-3 {
    padding-left: 1.95rem;
    font-size: 0.74rem;
  }

  .toc-link:hover {
    color: var(--ink-strong);
    background: color-mix(in oklab, var(--golden) 9%, transparent);
  }

  .toc-link.active {
    color: var(--ink-strong);
    border-left-color: var(--golden);
    font-weight: 620;
  }

  @media (max-width: 640px) {
    .grid {
      padding: calc(var(--bar-h) + 2rem) 1.25rem 30vh;
    }
  }
</style>
