///<reference types="svelte" />
;
import { Workspace, setWorkspace } from './lib/workspace.svelte';
import TopBar from './components/TopBar.svelte';
import Reader from './components/Reader.svelte';
import Editor from './components/Editor.svelte';
import Strip from './components/Strip.svelte';
import Shelf from './components/Shelf.svelte';
import Toasts from './components/Toasts.svelte';
function $$render() {

  
  
  
  
  
  
  

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
;
async () => {

 { svelteHTML.createElement("svelte:window", {     "onkeydown":(e) => ws.handleKey(e),ondragover,ondragleave,ondrop,});}

 { svelteHTML.createElement("div", {   "class":['app', { ready: ws.ready }],...__sveltets_2_empty({"data-mode":ws.mode}),});
   { const $$_raBpoT1C = __sveltets_2_ensureComponent(TopBar); new $$_raBpoT1C({ target: __sveltets_2_any(), props: {}});}
   { svelteHTML.createElement("main", { "class":`stage`,});
     { const $$_redaeR2C = __sveltets_2_ensureComponent(Reader); new $$_redaeR2C({ target: __sveltets_2_any(), props: {}});}
     { const $$_rotidE2C = __sveltets_2_ensureComponent(Editor); new $$_rotidE2C({ target: __sveltets_2_any(), props: {}});}
   }
   { const $$_pirtS1C = __sveltets_2_ensureComponent(Strip); new $$_pirtS1C({ target: __sveltets_2_any(), props: {}});}
   { const $$_flehS1C = __sveltets_2_ensureComponent(Shelf); new $$_flehS1C({ target: __sveltets_2_any(), props: {}});}
   { const $$_stsaoT1C = __sveltets_2_ensureComponent(Toasts); new $$_stsaoT1C({ target: __sveltets_2_any(), props: {}});}
  if(ws.dropping){
     { svelteHTML.createElement("div", { "class":`drop-hint`,}); { svelteHTML.createElement("span", {});   } }
  }
 }


};
return { props: {} as Record<string, never>, exports: {}, bindings: "", slots: {}, events: {} }}
const App__SvelteComponent_ = __sveltets_2_isomorphic_component(__sveltets_2_with_any_event($$render()));
/*Ωignore_startΩ*/type App__SvelteComponent_ = InstanceType<typeof App__SvelteComponent_>;
/*Ωignore_endΩ*/export default App__SvelteComponent_;