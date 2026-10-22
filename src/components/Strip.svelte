<script lang="ts">
  import { getWorkspace } from '../lib/workspace.svelte';

  const ws = getWorkspace();
</script>

<footer class={['strip', { show: ws.mode === 'write' }]}>
  <div class="side">
    <span>{ws.stats.words.toLocaleString()} {ws.stats.words === 1 ? 'word' : 'words'}</span>
    {#if ws.stats.minutes > 0}
      <span>{ws.stats.minutes} min read</span>
    {/if}
  </div>
  <div class="side">
    <button
      class="focus"
      aria-pressed={ws.focus}
      data-tip="Dim everything except the paragraph you're in"
      data-tip-align="above"
      onclick={() => ws.toggleFocus()}>Focus</button
    >
    <span class={['save', { dirty: ws.dirty }]}>{ws.saveLabel}</span>
  </div>
</footer>

<style>
  .strip {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: var(--strip-h);
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    font-size: 0.75rem;
    color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
    background: color-mix(in oklab, var(--bg) 78%, transparent);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
    border-top: 1px solid color-mix(in oklab, var(--line) 70%, transparent);
    transform: translateY(100%);
    opacity: 0;
    transition:
      transform var(--dur) var(--ease-out),
      opacity var(--dur);
  }

  .strip.show {
    transform: none;
    opacity: 1;
  }

  .side {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .focus {
    padding: 0.2rem 0.55rem;
    border-radius: var(--r-sm);
    color: var(--ink-soft);
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    transition:
      background-color 0.15s,
      color 0.15s;
  }

  .focus::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 2px;
    border: 1.5px solid currentColor;
    transition:
      background-color 0.15s,
      border-color 0.15s;
  }

  .focus:hover {
    background: color-mix(in oklab, var(--ink) 8%, transparent);
    color: var(--ink);
  }

  .focus[aria-pressed='true'] {
    color: var(--toasted);
  }

  .focus[aria-pressed='true']::before {
    background: var(--golden);
    border-color: var(--golden);
  }

  .save {
    transition: color 0.2s;
  }

  .save.dirty {
    color: var(--berry);
  }
</style>
