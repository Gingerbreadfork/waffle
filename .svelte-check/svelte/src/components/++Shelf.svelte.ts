///<reference types="svelte" />
;
import { getWorkspace } from '../lib/workspace.svelte';
import { relativeTime } from '../lib/time';
function $$render() {

  
  

  const ws = getWorkspace();
  let confirmId = $state<string | null>(null);
  // Relative times are stamped each time the drawer opens.
  const now = $derived(ws.shelfOpen ? Date.now() : 0);
;
async () => {

 { svelteHTML.createElement("button", {       "class":['scrim', { on: ws.shelfOpen }],"tabindex":-1,"aria-label":`Close documents`,"onclick":() => (ws.shelfOpen = false),}); }

 { svelteHTML.createElement("aside", {     "class":['shelf', { open: ws.shelfOpen }],"aria-label":`Documents`,"inert":!ws.shelfOpen,});
   { svelteHTML.createElement("div", { "class":`head`,});
     { svelteHTML.createElement("h2", {});  }
     { svelteHTML.createElement("button", {     "class":`icon-btn`,"aria-label":`Close`,"onclick":() => (ws.shelfOpen = false),});
       { svelteHTML.createElement("svg", {   "viewBox":`0 0 20 20`,"aria-hidden":`true`,}); { svelteHTML.createElement("path", {  "d":`M5 5l10 10M15 5L5 15`,});} }
     }
   }

   { svelteHTML.createElement("div", { "class":`actions`,});
     { svelteHTML.createElement("button", {   "class":`btn btn-primary`,"onclick":() => ws.newDoc(),});  }
     { svelteHTML.createElement("button", {   "class":`btn`,"onclick":() => ws.openFile(),});  }
   }

   { svelteHTML.createElement("div", {   "class":`list`,"role":`list`,});
       for(let doc of __sveltets_2_ensureArray(ws.sortedDocs)){doc.id;
      if(confirmId === doc.id){
         { svelteHTML.createElement("div", {   "class":`confirm`,"role":`listitem`,});
           { svelteHTML.createElement("span", {});doc.path ? `Remove “${doc.title}” from the list? The file stays on disk.` : `Delete “${doc.title}” for good?`; }
           { svelteHTML.createElement("div", { "class":`confirm-actions`,});
             { svelteHTML.createElement("button", {    "class":`btn btn-danger`,"onclick":() => {
                confirmId = null;
                void ws.deleteDoc(doc.id);
              },});doc.path ? 'Remove' : 'Delete'; }
             { svelteHTML.createElement("button", {   "class":`btn`,"onclick":() => (confirmId = null),});  }
           }
         }
      }else{
         { svelteHTML.createElement("div", {   "class":['item', { active: doc.id === ws.current?.id }],"role":`listitem`,});
           { svelteHTML.createElement("button", {   "class":`item-open`,"onclick":() => ws.openDoc(doc.id),});
             { svelteHTML.createElement("span", { "class":`item-title`,});doc.title; }
            if(doc.snippet){
               { svelteHTML.createElement("span", { "class":`snippet`,});doc.snippet; }
            }
             { svelteHTML.createElement("span", { "class":`meta`,});
               { svelteHTML.createElement("span", {});relativeTime(doc.updatedAt, now); }
              if(doc.fileName){
                 { svelteHTML.createElement("span", { "class":`file`,});
                   { svelteHTML.createElement("svg", {   "viewBox":`0 0 16 16`,"aria-hidden":`true`,}); { svelteHTML.createElement("path", {  "d":`M4 1.5h5l3 3v10H4z M9 1.5v3h3`,});} }
                  doc.fileName;
                 }
              }
             }
           }
           { svelteHTML.createElement("button", {     "class":`del`,"aria-label":`Delete ${doc.title}`,"onclick":() => (confirmId = doc.id),});
             { svelteHTML.createElement("svg", {   "viewBox":`0 0 20 20`,"aria-hidden":`true`,}); { svelteHTML.createElement("path", {  "d":`M5 5l10 10M15 5L5 15`,});} }
           }
         }
      }
    }
   }

   { svelteHTML.createElement("p", { "class":`note`,});                  }
 }


};
return { props: {} as Record<string, never>, exports: {}, bindings: __sveltets_$$bindings(''), slots: {}, events: {} }}
const Shelf__SvelteComponent_ = __sveltets_2_fn_component($$render());
/*Ωignore_startΩ*/type Shelf__SvelteComponent_ = ReturnType<typeof Shelf__SvelteComponent_>;
/*Ωignore_endΩ*/export default Shelf__SvelteComponent_;