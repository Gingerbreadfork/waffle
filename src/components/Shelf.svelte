<script lang="ts">
  import { getWorkspace } from '../lib/workspace.svelte';
  import { relativeTime } from '../lib/time';

  const ws = getWorkspace();
  let confirmId = $state<string | null>(null);
  // Relative times are stamped each time the drawer opens.
  const now = $derived(ws.shelfOpen ? Date.now() : 0);
</script>

<button class={['scrim', { on: ws.shelfOpen }]} tabindex="-1" aria-label="Close documents" onclick={() => (ws.shelfOpen = false)}></button>

<aside class={['shelf', { open: ws.shelfOpen }]} aria-label="Documents" inert={!ws.shelfOpen}>
  <div class="head">
    <h2>Documents</h2>
    <button class="icon-btn" aria-label="Close" onclick={() => (ws.shelfOpen = false)}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
    </button>
  </div>

  <div class="actions">
    <button class="btn btn-primary" onclick={() => ws.newDoc()}>New document</button>
    <button class="btn" onclick={() => ws.openFile()}>Open file</button>
  </div>

  <div class="list" role="list">
    {#each ws.sortedDocs as doc (doc.id)}
      {#if confirmId === doc.id}
        <div class="confirm" role="listitem">
          <span>{doc.path ? `Remove “${doc.title}” from the list? The file stays on disk.` : `Delete “${doc.title}” for good?`}</span>
          <div class="confirm-actions">
            <button
              class="btn btn-danger"
              onclick={() => {
                confirmId = null;
                void ws.deleteDoc(doc.id);
              }}>{doc.path ? 'Remove' : 'Delete'}</button
            >
            <button class="btn" onclick={() => (confirmId = null)}>Keep</button>
          </div>
        </div>
      {:else}
        <div class={['item', { active: doc.id === ws.current?.id }]} role="listitem">
          <button class="item-open" onclick={() => ws.openDoc(doc.id)}>
            <span class="item-title">{doc.title}</span>
            {#if doc.snippet}
              <span class="snippet">{doc.snippet}</span>
            {/if}
            <span class="meta">
              <span>{relativeTime(doc.updatedAt, now)}</span>
              {#if doc.fileName}
                <span class="file">
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 1.5h5l3 3v10H4z M9 1.5v3h3" /></svg>
                  {doc.fileName}
                </span>
              {/if}
            </span>
          </button>
          <button class="del" aria-label="Delete {doc.title}" onclick={() => (confirmId = doc.id)}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
          </button>
        </div>
      {/if}
    {/each}
  </div>

  <p class="note">Documents are saved as you type. Save to a file to keep a copy you can open anywhere.</p>
</aside>

<style>
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 30;
    background: rgb(var(--shadow) / 0.28);
    opacity: 0;
    pointer-events: none;
    cursor: default;
    transition: opacity 0.25s var(--ease-out);
  }

  .scrim.on {
    opacity: 1;
    pointer-events: auto;
  }

  .shelf {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: min(340px, 88vw);
    z-index: 31;
    background: var(--bg-raised);
    border-right: 1px solid var(--line);
    box-shadow: 8px 0 32px rgb(var(--shadow) / 0.12);
    display: flex;
    flex-direction: column;
    transform: translateX(-100%);
    visibility: hidden;
    transition:
      transform 0.3s var(--ease-out),
      visibility 0s linear 0.3s;
  }

  .shelf.open {
    transform: none;
    visibility: visible;
    transition-delay: 0s;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.6rem 0.4rem 1.1rem;
  }

  h2 {
    font-family: var(--font-read);
    font-variation-settings: var(--display-axes);
    font-optical-sizing: auto;
    font-weight: 600;
    font-size: 1.4rem;
    letter-spacing: -0.01em;
    margin: 0;
    color: var(--ink-strong);
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    padding: 0.25rem 1rem 0.9rem;
  }

  .list {
    flex: 1;
    overflow-y: auto;
    padding: 0 0.5rem;
  }

  .item {
    position: relative;
    border-radius: var(--r-md);
    transition: background-color 0.15s;
  }

  .item:hover {
    background: color-mix(in oklab, var(--golden) 10%, transparent);
  }

  .item.active {
    background: color-mix(in oklab, var(--golden) 18%, transparent);
  }

  .item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.9rem;
    bottom: 0.9rem;
    width: 3px;
    border-radius: 2px;
    background: var(--golden);
  }

  .item-open {
    display: block;
    width: 100%;
    text-align: left;
    padding: 0.6rem 2.2rem 0.6rem 0.85rem;
    border-radius: var(--r-md);
  }

  .item-title {
    display: block;
    font-weight: 600;
    color: var(--ink-strong);
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .snippet {
    display: block;
    color: var(--ink-soft);
    font-size: 0.78rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 0.1rem;
  }

  .meta {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    color: var(--ink-soft);
    font-size: 0.72rem;
    margin-top: 0.3rem;
  }

  .file {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file svg {
    width: 12px;
    height: 12px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linejoin: round;
    flex: none;
  }

  .del {
    position: absolute;
    top: 0.45rem;
    right: 0.45rem;
    width: 26px;
    height: 26px;
    border-radius: var(--r-sm);
    display: grid;
    place-items: center;
    color: var(--ink-soft);
    opacity: 0;
    transition:
      opacity 0.15s,
      background-color 0.15s,
      color 0.15s;
  }

  .item:hover .del,
  .del:focus-visible {
    opacity: 1;
  }

  .del:hover {
    background: color-mix(in oklab, var(--berry) 15%, transparent);
    color: var(--berry);
  }

  .del svg {
    width: 15px;
    height: 15px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
  }

  .confirm {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.6rem 0.7rem 0.6rem 0.85rem;
    border-radius: var(--r-md);
    background: color-mix(in oklab, var(--berry) 10%, transparent);
    font-size: 0.8rem;
    color: var(--ink);
    line-height: 1.4;
  }

  .confirm-actions {
    display: flex;
    gap: 0.35rem;
  }

  .confirm .btn {
    height: 28px;
    padding: 0 0.65rem;
  }

  .note {
    font-size: 0.74rem;
    color: var(--ink-soft);
    padding: 0.75rem 1.1rem 1rem;
    margin: 0;
    border-top: 1px solid var(--line);
    line-height: 1.45;
  }
</style>
