///<reference types="svelte" />
;
import { getWorkspace } from '../lib/workspace.svelte';
function $$render() {

  

  const ws = getWorkspace();
  let root = $state<HTMLElement>();
  let confirming = $state(false);

  function run(action: () => unknown) {
    ws.menuOpen = false;
    void action();
  }

  function onpointerdown(event: PointerEvent) {
    const target = event.target as Element;
    if (root && !root.contains(target) && !target.closest('[data-menu-toggle]')) ws.menuOpen = false;
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = Array.from(root?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'ArrowDown' ? index + 1 : index - 1;
    items[(next + items.length) % items.length]?.focus();
  }

  $effect(() => {
    root?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  });
;
async () => {

 { svelteHTML.createElement("svelte:window", { onpointerdown,});}

 { const $$_div0 = svelteHTML.createElement("div", {       "class":`menu`,"role":`menu`,"tabindex":-1,onkeydown,});root = $$_div0;
   { svelteHTML.createElement("button", {   "role":`menuitem`,"onclick":() => run(() => ws.newDoc()),});  }
   { svelteHTML.createElement("button", {   "role":`menuitem`,"onclick":() => run(() => ws.openFile()),});  { svelteHTML.createElement("kbd", {});ws.modKey;  } }
   { svelteHTML.createElement("button", {   "role":`menuitem`,"onclick":() => run(() => ws.save()),});
    ws.current?.path ? `Save to ${ws.current.fileName}` : 'Save to file'; { svelteHTML.createElement("kbd", {});ws.modKey;  }
   }
   { svelteHTML.createElement("button", {   "role":`menuitem`,"onclick":() => run(() => ws.saveAs()),});  { svelteHTML.createElement("kbd", {});ws.modKey;   } }
   { svelteHTML.createElement("hr", {});}
   { svelteHTML.createElement("button", {   "role":`menuitem`,"onclick":() => run(() => ws.exportHtml()),});   }
   { svelteHTML.createElement("button", {   "role":`menuitem`,"onclick":() => run(() => ws.copyMarkdown()),});  }
   { svelteHTML.createElement("button", {   "role":`menuitem`,"onclick":() => run(() => ws.print()),});  { svelteHTML.createElement("kbd", {});ws.modKey;  } }
   { svelteHTML.createElement("hr", {});}
  if(confirming){
     { svelteHTML.createElement("div", { "class":`confirm`,});
       { svelteHTML.createElement("span", {});ws.current?.path ? 'Remove from the list? The file stays on disk.' : 'Delete for good?'; }
       { svelteHTML.createElement("div", { "class":`confirm-actions`,});
         { svelteHTML.createElement("button", {   "class":`btn btn-danger`,"onclick":() => run(() => ws.deleteDoc(ws.current!.id)),});ws.current?.path ? 'Remove' : 'Delete'; }
         { svelteHTML.createElement("button", {   "class":`btn`,"onclick":() => (confirming = false),});  }
       }
     }
  }else{
     { svelteHTML.createElement("button", {     "role":`menuitem`,"class":`danger`,"onclick":() => (confirming = true),});
      ws.current?.path ? 'Remove from list' : 'Delete document';
     }
  }
 }


};
return { props: {} as Record<string, never>, exports: {}, bindings: __sveltets_$$bindings(''), slots: {}, events: {} }}
const Menu__SvelteComponent_ = __sveltets_2_fn_component($$render());
/*Ωignore_startΩ*/type Menu__SvelteComponent_ = ReturnType<typeof Menu__SvelteComponent_>;
/*Ωignore_endΩ*/export default Menu__SvelteComponent_;