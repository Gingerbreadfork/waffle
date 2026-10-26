<script lang="ts">
  import { getWorkspace, PAGE_WIDTHS } from '../lib/workspace.svelte';

  const ws = getWorkspace();
  let root = $state<HTMLElement>();
  let confirming = $state(false);

  const widthIndex = $derived(PAGE_WIDTHS.findIndex((w) => w.id === ws.pageWidth));

  function run(action: () => unknown) {
    ws.menuOpen = false;
    void action();
  }

  function onpointerdown(event: PointerEvent) {
    const target = event.target as Element;
    if (root && !root.contains(target) && !target.closest('[data-menu-toggle]')) ws.menuOpen = false;
  }

  function onkeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    // Left and right move between page widths; up and down skip past them.
    if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && target.getAttribute('role') === 'menuitemradio') {
      event.preventDefault();
      const next = event.key === 'ArrowRight' ? target.nextElementSibling : target.previousElementSibling;
      if (next instanceof HTMLButtonElement) {
        next.focus();
        next.click();
      }
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = Array.from(root?.querySelectorAll<HTMLButtonElement>('button:not([role=menuitemradio]), [aria-checked=true]') ?? []);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'ArrowDown' ? index + 1 : index - 1;
    items[(next + items.length) % items.length]?.focus();
  }

  $effect(() => {
    root?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  });
</script>

<svelte:window {onpointerdown} />

<div class="menu" role="menu" tabindex="-1" bind:this={root} {onkeydown}>
  <button role="menuitem" onclick={() => run(() => ws.newDoc())}>New document</button>
  <button role="menuitem" onclick={() => run(() => ws.openFile())}>Open file<kbd>{ws.modKey} O</kbd></button>
  <button role="menuitem" onclick={() => run(() => ws.save())}>
    {ws.current?.path ? `Save to ${ws.current.fileName}` : 'Save to file'}<kbd>{ws.modKey} S</kbd>
  </button>
  <button role="menuitem" onclick={() => run(() => ws.saveAs())}>Save as<kbd>{ws.modKey} ⇧ S</kbd></button>
  <hr />
  <button role="menuitem" onclick={() => run(() => ws.find())}>Find<kbd>{ws.modKey} F</kbd></button>
  <button role="menuitem" onclick={() => run(() => ws.exportHtml())}>Export as HTML</button>
  <button role="menuitem" onclick={() => run(() => ws.copyMarkdown())}>Copy Markdown</button>
  <button role="menuitem" onclick={() => run(() => ws.print())}>Print<kbd>{ws.modKey} P</kbd></button>
  <hr />
  <div class="width" role="group" aria-labelledby="width-label">
    <span id="width-label">Page width</span>
    <div class="seg" style:--i={widthIndex} style:--n={PAGE_WIDTHS.length}>
      <span class="butter" aria-hidden="true"></span>
      {#each PAGE_WIDTHS as width (width.id)}
        <button role="menuitemradio" aria-checked={width.id === ws.pageWidth} onclick={() => ws.setPageWidth(width.id)}>{width.label}</button>
      {/each}
    </div>
  </div>
  <hr />
  {#if confirming}
    <div class="confirm">
      <span>{ws.current?.path ? 'Remove from the list? The file stays on disk.' : 'Delete for good?'}</span>
      <div class="confirm-actions">
        <button class="btn btn-danger" onclick={() => run(() => ws.deleteDoc(ws.current!.id))}>{ws.current?.path ? 'Remove' : 'Delete'}</button>
        <button class="btn" onclick={() => (confirming = false)}>Keep</button>
      </div>
    </div>
  {:else}
    <button role="menuitem" class="danger" onclick={() => (confirming = true)}>
      {ws.current?.path ? 'Remove from list' : 'Delete document'}
    </button>
  {/if}
</div>

<style>
  .menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 40;
    min-width: 268px;
    padding: 0.35rem;
    background: var(--bg-raised);
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    box-shadow:
      0 12px 32px rgb(var(--shadow) / 0.18),
      0 2px 6px rgb(var(--shadow) / 0.08);
    transform-origin: top right;
    animation: menu-in 0.16s var(--ease-out);
  }

  @keyframes menu-in {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(-4px);
    }
  }

  .menu > button {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 0.45rem 0.65rem;
    border-radius: var(--r-sm);
    font-size: 0.8375rem;
    color: var(--ink);
    text-align: left;
  }

  .menu > button:hover,
  .menu > button:focus-visible {
    background: color-mix(in oklab, var(--golden) 14%, transparent);
    outline: none;
  }

  .menu > button.danger {
    color: var(--berry);
  }

  .menu > button.danger:hover,
  .menu > button.danger:focus-visible {
    background: color-mix(in oklab, var(--berry) 12%, transparent);
  }

  kbd {
    font: inherit;
    font-size: 0.72rem;
    color: var(--ink-soft);
  }

  .width {
    padding: 0.4rem 0.65rem 0.5rem;
    font-size: 0.8375rem;
    color: var(--ink);
  }

  .seg {
    position: relative;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    margin-top: 0.45rem;
    padding: 3px;
    background: var(--bg-chrome);
    border-radius: 9px;
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--line) 80%, transparent);
  }

  /* The same pat of butter as the mode switch, without its bounce */
  .seg .butter {
    position: absolute;
    top: 3px;
    left: 3px;
    width: calc((100% - 6px) / var(--n));
    height: calc(100% - 6px);
    border-radius: 7px;
    background: var(--golden);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.38),
      0 1px 2px rgb(var(--shadow) / 0.28);
    transform: translateX(calc(var(--i) * 100%));
    transition: transform 0.25s var(--ease-out);
  }

  .seg button {
    position: relative;
    z-index: 1;
    height: 26px;
    border-radius: 7px;
    font-size: 0.75rem;
    font-weight: 580;
    color: var(--ink-soft);
    transition: color 0.2s;
  }

  .seg button:hover:not([aria-checked='true']) {
    color: var(--ink);
  }

  .seg button[aria-checked='true'] {
    color: #2b1a0d;
  }

  hr {
    border: 0;
    border-top: 1px solid var(--line);
    margin: 0.35rem 0.25rem;
  }

  .confirm {
    padding: 0.5rem 0.65rem 0.4rem;
    font-size: 0.8rem;
    color: var(--ink);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .confirm-actions {
    display: flex;
    gap: 0.35rem;
  }

  .confirm .btn {
    height: 28px;
    padding: 0 0.65rem;
  }
</style>
