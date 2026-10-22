<script lang="ts">
  import { getWorkspace } from '../lib/workspace.svelte';
  import { toasts } from '../lib/toasts.svelte';

  const ws = getWorkspace();
</script>

<div class={['host', { raised: ws.mode === 'write' }]} aria-live="polite">
  {#each toasts.items as toast (toast.id)}
    <div class={['toast', { leaving: toast.leaving }]}>{toast.text}</div>
  {/each}
</div>

<style>
  .host {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    z-index: 45;
    pointer-events: none;
    transition: bottom var(--dur) var(--ease-out);
  }

  .host.raised {
    bottom: calc(var(--strip-h) + 14px);
  }

  .toast {
    padding: 0.5rem 0.9rem;
    border-radius: 999px;
    background: var(--ink-strong);
    color: var(--bg);
    font-size: 0.8125rem;
    font-weight: 500;
    box-shadow: 0 6px 20px rgb(var(--shadow) / 0.2);
    animation: toast-in 0.22s var(--ease-out);
  }

  .toast.leaving {
    animation: toast-out 0.2s var(--ease-out) forwards;
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
  }

  @keyframes toast-out {
    to {
      opacity: 0;
      transform: translateY(6px);
    }
  }
</style>
