///<reference types="svelte" />
;
import { getWorkspace } from '../lib/workspace.svelte';
import Menu from './Menu.svelte';
function $$render() {

  
  

  const ws = getWorkspace();
;
async () => {

 { svelteHTML.createElement("header", {  "class":['bar', { mac: ws.isMac && ws.native }],...__sveltets_2_empty({"data-tauri-drag-region":true}),});
   { svelteHTML.createElement("div", { "class":`side left`,});
     { svelteHTML.createElement("button", {           "class":`icon-btn`,"aria-label":`Documents`,...__sveltets_2_empty({"data-tip":`Documents`}),...__sveltets_2_empty({"data-key":ws.modKey + ' \\'}),"onclick":() => (ws.shelfOpen = !ws.shelfOpen),});
       { svelteHTML.createElement("svg", {   "viewBox":`0 0 20 20`,"aria-hidden":`true`,}); { svelteHTML.createElement("path", {  "d":`M3 5.5h14M3 10h14M3 14.5h9`,});} }
     }
     { svelteHTML.createElement("span", {   "class":`brand`,"aria-label":`Waffle`,});
       { svelteHTML.createElement("svg", {     "class":`mark`,"viewBox":`0 0 24 24`,"aria-hidden":`true`,});
         { svelteHTML.createElement("rect", {            "x":`2`,"y":`2`,"width":`20`,"height":`20`,"rx":`6`,"class":`base`,});}
         { svelteHTML.createElement("g", { "class":`pockets`,});
           { svelteHTML.createElement("rect", {          "x":`5`,"y":`5`,"width":`4`,"height":`4`,"rx":`1`,});} { svelteHTML.createElement("rect", {          "x":`10`,"y":`5`,"width":`4`,"height":`4`,"rx":`1`,});} { svelteHTML.createElement("rect", {          "x":`15`,"y":`5`,"width":`4`,"height":`4`,"rx":`1`,});}
           { svelteHTML.createElement("rect", {          "x":`5`,"y":`10`,"width":`4`,"height":`4`,"rx":`1`,});} { svelteHTML.createElement("rect", {          "x":`10`,"y":`10`,"width":`4`,"height":`4`,"rx":`1`,});} { svelteHTML.createElement("rect", {          "x":`15`,"y":`10`,"width":`4`,"height":`4`,"rx":`1`,});}
           { svelteHTML.createElement("rect", {          "x":`5`,"y":`15`,"width":`4`,"height":`4`,"rx":`1`,});} { svelteHTML.createElement("rect", {          "x":`10`,"y":`15`,"width":`4`,"height":`4`,"rx":`1`,});} { svelteHTML.createElement("rect", {          "x":`15`,"y":`15`,"width":`4`,"height":`4`,"rx":`1`,});}
         }
       }
       { svelteHTML.createElement("span", { "class":`name`,});  }
     }
     { svelteHTML.createElement("span", {   "class":`rule`,"aria-hidden":`true`,}); }
     { svelteHTML.createElement("span", { "class":`title`,});ws.current?.title ?? ''; }
    if(ws.dirty){
       { svelteHTML.createElement("span", {   "class":`dirty`,"title":`Changes not yet saved to the file`,}); }
    }
   }

   { svelteHTML.createElement("div", { "class":`side right`,});
     { svelteHTML.createElement("div", {     "class":['mode', { write: ws.mode === 'write' }],"role":`group`,"aria-label":`Mode`,});
       { svelteHTML.createElement("span", {   "class":`butter`,"aria-hidden":`true`,}); }
       { svelteHTML.createElement("button", {     "class":`mode-btn`,"aria-pressed":ws.mode === 'read',"onclick":() => ws.setMode('read'),});  }
       { svelteHTML.createElement("button", {     "class":`mode-btn`,"aria-pressed":ws.mode === 'write',"onclick":() => ws.setMode('write'),});  }
     }
     { svelteHTML.createElement("button", {           "class":`icon-btn`,"aria-label":ws.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',...__sveltets_2_empty({"data-tip":ws.theme === 'dark' ? 'Light theme' : 'Dark theme'}),...__sveltets_2_empty({"data-tip-align":`end`}),"onclick":() => ws.toggleTheme(),});
      if(ws.theme === 'dark'){
         { svelteHTML.createElement("svg", {   "viewBox":`0 0 20 20`,"aria-hidden":`true`,});
           { svelteHTML.createElement("circle", {      "cx":`10`,"cy":`10`,"r":`3.3`,});}
           { svelteHTML.createElement("path", {  "d":`M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4`,});}
         }
      }else{
         { svelteHTML.createElement("svg", {   "viewBox":`0 0 20 20`,"aria-hidden":`true`,}); { svelteHTML.createElement("path", {  "d":`M15.5 12.2A6.3 6.3 0 0 1 7.8 4.5a6.3 6.3 0 1 0 7.7 7.7z`,});} }
      }
     }
     { svelteHTML.createElement("button", {                "class":`icon-btn`,"aria-label":`More`,...__sveltets_2_empty({"data-tip":`More`}),...__sveltets_2_empty({"data-tip-align":`end`}),...__sveltets_2_empty({"data-menu-toggle":true}),"aria-haspopup":`menu`,"aria-expanded":ws.menuOpen,"onclick":() => (ws.menuOpen = !ws.menuOpen),});
       { svelteHTML.createElement("svg", {   "viewBox":`0 0 20 20`,"aria-hidden":`true`,});
         { svelteHTML.createElement("circle", {        "cx":`10`,"cy":`4.5`,"r":`1.4`,"class":`dot`,});} { svelteHTML.createElement("circle", {        "cx":`10`,"cy":`10`,"r":`1.4`,"class":`dot`,});} { svelteHTML.createElement("circle", {        "cx":`10`,"cy":`15.5`,"r":`1.4`,"class":`dot`,});}
       }
     }
    if(ws.menuOpen){
       { const $$_uneM2C = __sveltets_2_ensureComponent(Menu); new $$_uneM2C({ target: __sveltets_2_any(), props: {}});}
    }
   }

   { svelteHTML.createElement("div", {    "class":['progress', { hidden: ws.mode !== 'read' }],"aria-hidden":`true`,});__sveltets_2_ensureType(String, Number, ws.progress); }
 }


};
return { props: {} as Record<string, never>, exports: {}, bindings: "", slots: {}, events: {} }}
const TopBar__SvelteComponent_ = __sveltets_2_isomorphic_component(__sveltets_2_with_any_event($$render()));
/*Ωignore_startΩ*/type TopBar__SvelteComponent_ = InstanceType<typeof TopBar__SvelteComponent_>;
/*Ωignore_endΩ*/export default TopBar__SvelteComponent_;