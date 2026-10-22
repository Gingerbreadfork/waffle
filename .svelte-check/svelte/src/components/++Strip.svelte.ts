///<reference types="svelte" />
;
import { getWorkspace } from '../lib/workspace.svelte';
function $$render() {

  

  const ws = getWorkspace();
;
async () => {

 { svelteHTML.createElement("footer", { "class":['strip', { show: ws.mode === 'write' }],});
   { svelteHTML.createElement("div", { "class":`side`,});
     { svelteHTML.createElement("span", {});ws.stats.words.toLocaleString(); ws.stats.words === 1 ? 'word' : 'words'; }
    if(ws.stats.minutes > 0){
       { svelteHTML.createElement("span", {});ws.stats.minutes;   }
    }
   }
   { svelteHTML.createElement("div", { "class":`side`,});
     { svelteHTML.createElement("button", {          "class":`focus`,"aria-pressed":ws.focus,...__sveltets_2_empty({"data-tip":`Dim everything except the paragraph you're in`}),...__sveltets_2_empty({"data-tip-align":`above`}),"onclick":() => ws.toggleFocus(),});  }
     { svelteHTML.createElement("span", { "class":['save', { dirty: ws.dirty }],});ws.saveLabel; }
   }
 }


};
return { props: {} as Record<string, never>, exports: {}, bindings: "", slots: {}, events: {} }}
const Strip__SvelteComponent_ = __sveltets_2_isomorphic_component(__sveltets_2_with_any_event($$render()));
/*Ωignore_startΩ*/type Strip__SvelteComponent_ = InstanceType<typeof Strip__SvelteComponent_>;
/*Ωignore_endΩ*/export default Strip__SvelteComponent_;