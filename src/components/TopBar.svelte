<script lang="ts">
  import { getWorkspace } from '../lib/workspace.svelte';
  import Menu from './Menu.svelte';

  const ws = getWorkspace();
</script>

<header class={['bar', { mac: ws.isMac && ws.native }]} data-tauri-drag-region>
  <div class="side left">
    <button
      class="icon-btn"
      aria-label="Documents"
      data-tip="Documents"
      data-key={ws.modKey + ' \\'}
      onclick={() => (ws.shelfOpen = !ws.shelfOpen)}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5.5h14M3 10h14M3 14.5h9" /></svg>
    </button>
    <span class="brand" aria-label="Waffle">
      <svg class="mark" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="6" class="base" />
        <g class="pockets">
          <rect x="5" y="5" width="4" height="4" rx="1" /><rect x="10" y="5" width="4" height="4" rx="1" /><rect x="15" y="5" width="4" height="4" rx="1" />
          <rect x="5" y="10" width="4" height="4" rx="1" /><rect x="10" y="10" width="4" height="4" rx="1" /><rect x="15" y="10" width="4" height="4" rx="1" />
          <rect x="5" y="15" width="4" height="4" rx="1" /><rect x="10" y="15" width="4" height="4" rx="1" /><rect x="15" y="15" width="4" height="4" rx="1" />
        </g>
      </svg>
      <span class="name">Waffle</span>
    </span>
    <span class="rule" aria-hidden="true"></span>
    <span class="title">{ws.current?.title ?? ''}</span>
    {#if ws.dirty}
      <span class="dirty" title="Changes not yet saved to the file"></span>
    {/if}
  </div>

  <div class="side right">
    <div class={['mode', { write: ws.mode === 'write' }]} role="group" aria-label="Mode">
      <span class="butter" aria-hidden="true"></span>
      <button class="mode-btn" aria-pressed={ws.mode === 'read'} onclick={() => ws.setMode('read')}>Read</button>
      <button class="mode-btn" aria-pressed={ws.mode === 'write'} onclick={() => ws.setMode('write')}>Write</button>
    </div>
    <button
      class="icon-btn"
      aria-label={ws.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      data-tip={ws.theme === 'dark' ? 'Light theme' : 'Dark theme'}
      data-tip-align="end"
      onclick={() => ws.toggleTheme()}
    >
      {#if ws.theme === 'dark'}
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="3.3" />
          <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" />
        </svg>
      {:else}
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M15.5 12.2A6.3 6.3 0 0 1 7.8 4.5a6.3 6.3 0 1 0 7.7 7.7z" /></svg>
      {/if}
    </button>
    <button
      class="icon-btn"
      aria-label={ws.updateVersion ? 'More, update ready' : 'More'}
      data-tip={ws.updateVersion ? 'Update ready' : 'More'}
      data-tip-align="end"
      data-menu-toggle
      aria-haspopup="menu"
      aria-expanded={ws.menuOpen}
      onclick={() => (ws.menuOpen = !ws.menuOpen)}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="4.5" r="1.4" class="dot" /><circle cx="10" cy="10" r="1.4" class="dot" /><circle cx="10" cy="15.5" r="1.4" class="dot" />
      </svg>
      {#if ws.updateVersion}
        <span class="badge" aria-hidden="true"></span>
      {/if}
    </button>
    {#if ws.menuOpen}
      <Menu />
    {/if}
  </div>

  <div class={['progress', { hidden: ws.mode !== 'read' }]} style:--p={ws.progress} aria-hidden="true"></div>
</header>

<style>
  .bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: var(--bar-h);
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0 0.75rem 0 0.5rem;
    background: var(--bg);
    border-bottom: 1px solid color-mix(in oklab, var(--line) 70%, transparent);
    user-select: none;
  }

  /* Leave room for the traffic lights when the macOS title bar is overlaid */
  .bar.mac {
    padding-left: 78px;
  }

  .side {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .left {
    flex: 1 1 auto;
  }

  .right {
    position: relative;
    flex: none;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.4rem 0.25rem 0.25rem;
    color: var(--ink-strong);
    flex: none;
  }

  .mark {
    width: 22px;
    height: 22px;
  }

  .base {
    fill: var(--golden);
  }

  .pockets rect {
    fill: var(--toasted);
  }

  .name {
    font-family: var(--font-read);
    font-variation-settings: var(--display-axes);
    font-optical-sizing: auto;
    font-weight: 640;
    font-size: 1.2rem;
    letter-spacing: -0.012em;
    line-height: 1;
    margin-top: -2px;
  }

  .rule {
    width: 1px;
    height: 18px;
    background: var(--line-strong);
    margin: 0 0.25rem;
    flex: none;
  }

  .title {
    font-size: 0.875rem;
    color: var(--ink-soft);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .badge {
    position: absolute;
    top: 6px;
    right: 7px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--golden);
    box-shadow: 0 0 0 2px var(--bg);
  }

  .dirty {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--berry);
    flex: none;
  }

  /* Mode switch: a two pocket waffle with a pat of butter in the active one */

  .mode {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: var(--bg-chrome);
    border-radius: 9px;
    padding: 3px;
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--line) 80%, transparent);
    margin-right: 0.35rem;
  }

  .butter {
    position: absolute;
    top: 3px;
    left: 3px;
    width: calc(50% - 3px);
    height: calc(100% - 6px);
    border-radius: 7px;
    background: var(--golden);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.38),
      0 1px 2px rgb(var(--shadow) / 0.28);
    transition: transform 0.34s var(--ease-spring);
  }

  .mode.write .butter {
    transform: translateX(100%);
  }

  .mode-btn {
    position: relative;
    z-index: 1;
    min-width: 66px;
    height: 28px;
    padding: 0 0.9rem;
    border-radius: 7px;
    font-size: 0.8125rem;
    font-weight: 580;
    color: var(--ink-soft);
    transition: color 0.2s;
  }

  .mode-btn[aria-pressed='true'] {
    color: #2b1a0d;
  }

  .mode-btn:hover:not([aria-pressed='true']) {
    color: var(--ink);
  }

  .progress {
    position: absolute;
    left: 0;
    bottom: -1px;
    height: 2px;
    width: 100%;
    background: var(--golden);
    transform-origin: left;
    transform: scaleX(var(--p, 0));
    transition: opacity 0.2s;
  }

  .progress.hidden {
    opacity: 0;
  }

  @media (max-width: 640px) {
    .name,
    .rule {
      display: none;
    }

    .mode-btn {
      min-width: 56px;
      padding: 0 0.6rem;
    }

    .bar {
      gap: 0.5rem;
    }
  }
</style>
