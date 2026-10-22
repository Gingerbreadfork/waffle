///<reference types="svelte" />
;
import { untrack } from 'svelte';
import { getWorkspace, BAR_INSET } from '../lib/workspace.svelte';
import { createEditor } from '../lib/editor';
function $$render() {

  
  
  

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
;
async () => {

 { svelteHTML.createElement("section", {   "class":['view', 'view-write', { 'is-active': ws.mode === 'write' }],"aria-label":`Writing`,});
   { svelteHTML.createElement("div", {  "class":`host`,[Symbol("@attach")]:attach,}); }
 }


};
return { props: {} as Record<string, never>, exports: {}, bindings: __sveltets_$$bindings(''), slots: {}, events: {} }}
const Editor__SvelteComponent_ = __sveltets_2_fn_component($$render());
/*Ωignore_startΩ*/type Editor__SvelteComponent_ = ReturnType<typeof Editor__SvelteComponent_>;
/*Ωignore_endΩ*/export default Editor__SvelteComponent_;