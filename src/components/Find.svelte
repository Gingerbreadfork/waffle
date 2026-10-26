<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { getWorkspace, BAR_INSET } from '../lib/workspace.svelte';
  import { findRanges, firstBelow } from '../lib/find';

  let { article, scroller, html }: { article?: HTMLElement; scroller?: HTMLElement; html: string } = $props();

  const ws = getWorkspace();

  let bar = $state<HTMLElement>();
  let input = $state<HTMLInputElement>();
  let query = $state('');
  let ranges = $state.raw<Range[]>([]);
  let index = $state(0);
  let searched = '';

  const shown = $derived(ws.findOpen && ws.mode === 'read');

  // Searches again when the query or the page changes. A new query moves to the
  // match nearest the top of the screen; a re-rendered page keeps the current one.
  $effect(() => {
    void html;
    const found = article ? findRanges(article, query) : [];
    const fresh = ws.findOpen && query !== searched;
    searched = ws.findOpen ? query : '';
    untrack(() => {
      ranges = found;
      if (fresh) {
        const top = (scroller?.getBoundingClientRect().top ?? 0) + BAR_INSET;
        index = firstBelow(found, top);
        reveal(found[index]);
      } else {
        index = Math.min(index, Math.max(found.length - 1, 0));
      }
    });
  });

  $effect(() => {
    if (!ws.findOpen || !('highlights' in CSS)) return;
    const current = ranges[index];
    const rest = new Highlight();
    for (const range of ranges) if (range !== current) rest.add(range);
    CSS.highlights.set('find', rest);
    if (current) CSS.highlights.set('find-current', new Highlight(current));
    return () => {
      CSS.highlights.delete('find');
      CSS.highlights.delete('find-current');
    };
  });

  export async function open() {
    const selection = window.getSelection();
    const picked = selection?.toString().trim() ?? '';
    if (picked && !picked.includes('\n') && article?.contains(selection!.anchorNode)) query = picked;
    ws.findOpen = true;
    await tick();
    input?.focus();
    input?.select();
  }

  export function step(by: 1 | -1) {
    if (!ranges.length) return;
    index = (index + by + ranges.length) % ranges.length;
    reveal(ranges[index]);
  }

  function reveal(range: Range | undefined) {
    if (!range || !scroller || !bar) return;
    range.startContainer.parentElement?.closest('details:not([open])')?.setAttribute('open', '');

    // Code blocks and wide tables scroll sideways on their own.
    for (let el = range.startContainer.parentElement; el && el !== scroller; el = el.parentElement) {
      if (el.scrollWidth <= el.clientWidth || !/auto|scroll/.test(getComputedStyle(el).overflowX)) continue;
      const box = el.getBoundingClientRect();
      const r = range.getBoundingClientRect();
      if (r.left < box.left || r.right > box.right) el.scrollLeft += r.left - box.left - box.width / 3;
    }

    const view = scroller.getBoundingClientRect();
    const r = range.getBoundingClientRect();
    const cover = bar.getBoundingClientRect();
    const underBar = r.right > cover.left && r.left < cover.right;
    const top = underBar ? cover.bottom + 8 : view.top + BAR_INSET + 8;
    if (r.top < top || r.bottom > view.bottom - 24) scroller.scrollTop += r.top - (view.top + view.height / 3);
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    step(event.shiftKey ? -1 : 1);
  }
</script>

<div class={['find', { show: shown }]} role="search" aria-label="Find in document" inert={!shown} bind:this={bar}>
  <svg class="glass" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5" /><path d="M12.2 12.2l4.3 4.3" /></svg>
  <input bind:this={input} bind:value={query} {onkeydown} type="text" placeholder="Find" aria-label="Find" spellcheck="false" autocomplete="off" />
  {#if query.trim()}
    <span class="count" aria-live="polite">{ranges.length ? `${index + 1} of ${ranges.length}` : 'No matches'}</span>
  {/if}
  <span class="rule" aria-hidden="true"></span>
  <button class="icon-btn" aria-label="Previous match" data-tip="Previous" data-key="⇧ Enter" disabled={!ranges.length} onclick={() => step(-1)}>
    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 12.5L10 8l4.5 4.5" /></svg>
  </button>
  <button class="icon-btn" aria-label="Next match" data-tip="Next" data-key="Enter" disabled={!ranges.length} onclick={() => step(1)}>
    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 8L10 12.5L14.5 8" /></svg>
  </button>
  <button class="icon-btn" aria-label="Close find" data-tip="Close" data-key="Esc" data-tip-align="end" onclick={() => ws.closeFind()}>
    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" /></svg>
  </button>
</div>

<style>
  .find {
    position: absolute;
    top: calc(var(--bar-h) + 10px);
    right: 18px;
    z-index: 15;
    width: min(22rem, calc(100% - 36px));
    height: 40px;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 4px 0 10px;
    background: var(--bg-raised);
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    box-shadow:
      0 12px 32px rgb(var(--shadow) / 0.14),
      0 2px 6px rgb(var(--shadow) / 0.06);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-4px);
    transition:
      opacity 0.16s var(--ease-out),
      transform 0.16s var(--ease-out),
      border-color 0.15s,
      visibility 0s linear 0.16s;
  }

  .find.show {
    opacity: 1;
    visibility: visible;
    transform: none;
    transition-delay: 0s;
  }

  .find:focus-within {
    border-color: color-mix(in oklab, var(--golden) 55%, var(--line));
  }

  .glass {
    width: 16px;
    height: 16px;
    flex: none;
    fill: none;
    stroke: var(--ink-soft);
    stroke-width: 1.6;
    stroke-linecap: round;
  }

  input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0 6px 0 8px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: 0.8375rem;
  }

  input::placeholder {
    color: var(--ink-soft);
  }

  input:focus-visible {
    outline: none;
  }

  .count {
    flex: none;
    padding: 0 6px;
    font-size: 0.75rem;
    color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .rule {
    width: 1px;
    height: 18px;
    margin: 0 4px;
    background: var(--line);
    flex: none;
  }

  .icon-btn {
    width: 30px;
    height: 30px;
  }

  .icon-btn svg {
    width: 18px;
    height: 18px;
  }

  .icon-btn:disabled {
    opacity: 0.4;
    cursor: default;
    background: none;
    color: var(--ink-soft);
  }
</style>
