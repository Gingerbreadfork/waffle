<script lang="ts">
  import { untrack } from 'svelte';
  import { getWorkspace, BAR_INSET } from '../lib/workspace.svelte';
  import { createEditor } from '../lib/editor';

  const ws = getWorkspace();

  function attach(host: HTMLElement) {
    const { api, destroy } = createEditor(host, {
      onChange: (text) => ws.onEditorChange(text),
      onEscape: () => void ws.setMode('read'),
      topInset: BAR_INSET,
    });
    ws.editor = api;
    untrack(() => {
      api.setFocusMode(ws.focus);
      if (ws.current) api.setContent(ws.current.content, ws.current.cursor);
    });
    return () => {
      destroy();
      ws.editor = null;
    };
  }

  $effect(() => {
    ws.editor?.setFocusMode(ws.focus);
  });
</script>

<section class={['view', 'view-write', { 'is-active': ws.mode === 'write' }]} aria-label="Writing">
  <div class="host" {@attach attach}></div>
</section>

<style>
  .view-write {
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .host {
    flex: 1;
    min-height: 0;
  }
</style>
