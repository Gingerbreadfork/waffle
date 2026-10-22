///<reference types="svelte" />
;
import { getWorkspace } from '../lib/workspace.svelte';
import { toasts } from '../lib/toasts.svelte';
function $$render() {

  
  

  const ws = getWorkspace();
;
async () => {

 { svelteHTML.createElement("div", {   "class":['host', { raised: ws.mode === 'write' }],"aria-live":`polite`,});
     for(let toast of __sveltets_2_ensureArray(toasts.items)){toast.id;
     { svelteHTML.createElement("div", { "class":['toast', { leaving: toast.leaving }],});toast.text; }
  }
 }


};
return { props: {} as Record<string, never>, exports: {}, bindings: "", slots: {}, events: {} }}
const Toasts__SvelteComponent_ = __sveltets_2_isomorphic_component(__sveltets_2_with_any_event($$render()));
/*Ωignore_startΩ*/type Toasts__SvelteComponent_ = InstanceType<typeof Toasts__SvelteComponent_>;
/*Ωignore_endΩ*/export default Toasts__SvelteComponent_;