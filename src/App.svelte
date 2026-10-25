<script lang="ts">
  import { Workspace, setWorkspace } from './lib/workspace.svelte';
  import TopBar from './components/TopBar.svelte';
  import Reader from './components/Reader.svelte';
  import Editor from './components/Editor.svelte';
  import Strip from './components/Strip.svelte';
  import Shelf from './components/Shelf.svelte';
  import Toasts from './components/Toasts.svelte';

  const ws = new Workspace();
  setWorkspace(ws);
  void ws.init();

  // In a browser, files arrive through HTML5 drag and drop.
  // The desktop app receives them from the window instead.
  function ondragover(event: DragEvent) {
    if (ws.native || !event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    ws.dropping = true;
  }

  function ondragleave(event: DragEvent) {
    if (!ws.native && !event.relatedTarget) ws.dropping = false;
  }

  async function ondrop(event: DragEvent) {
    if (ws.native) return;
    event.preventDefault();
    ws.dropping = false;
    const file = event.dataTransfer?.files[0];
    if (file) await ws.openDroppedFile(file.name, await file.text());
  }
</script>

<svelte:window onkeydown={(e) => ws.handleKey(e)} {ondragover} {ondragleave} {ondrop} />

<div class={['app', { ready: ws.ready }]} data-mode={ws.mode}>
  <TopBar />
  <main class="stage">
    <Reader />
    <Editor />
  </main>
  <Strip />
  <Shelf />
  <Toasts />
  {#if ws.dropping}
    <div class="drop-hint"><span>Drop to open</span></div>
  {/if}
</div>

<style>
  .app {
    position: relative;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    opacity: 0;
    transition: opacity 0.35s var(--ease-out);
  }

  .app.ready {
    opacity: 1;
  }

  .stage {
    position: relative;
    flex: 1;
    min-height: 0;
  }

  .drop-hint {
    position: absolute;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
    background: color-mix(in oklab, var(--bg) 88%, transparent);
    pointer-events: none;
  }

  .drop-hint span {
    font-family: var(--font-read);
    font-variation-settings: var(--display-axes);
    font-size: 2rem;
    font-weight: 600;
    color: var(--ink-strong);
    padding: 1.5rem 2.5rem;
    border: 2px dashed var(--golden);
    border-radius: var(--r-lg);
  }
</style>
