"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const S=require("@opencode/plugin/gui"),B=require("effect"),ue=require("solid-js"),pe=require("solid-js/web"),Me=require("@opencode/client/solid"),K=60*1e3,X=200,he=["session.inbox.enqueued","session.execution.started","session.unarchived"],fe=Symbol.for("opencode-plus.archive");function Re(e,t,n,s){const{created:o,updated:r,busy:a,idle:l,archived:g}=e.time;if(g!==void 0||e.parentID||a!==void 0&&(l===void 0||a>l))return!1;const i=Math.max(o,a??0,l??0);return(Number(e.metadata?.[s])||0)>=i||t-r<2*K?!1:t-i>=n}function je(e,t){const n=`${e.id}.keptAt`,s=Date.now(),o=new AbortController,r=o.signal,a=h=>e.log.write("error",`${e.id}: ${h?.stack??h}`),l=async()=>{const h=[];let v=await e.client.session.list({parentID:null,archived:!1,limit:X});for(;;){if(h.push(...v.data),v.data.length<X||!v.cursor.next)return h;v=await e.client.session.list({cursor:v.cursor.next,limit:X})}};let g=!1;const i=async()=>{if(!g){g=!0;try{const h=Date.now(),v=(await l()).filter(c=>Re(c,h,t,n));for(const c of v)await e.client.session.update({sessionID:c.id,archived:!0}),e.log.write("info",`${e.id}: archived ${c.id} "${c.title??""}"`)}finally{g=!1}}},d=async h=>{if(!he.includes(h.type)||h.created<s-K||h.type==="session.inbox.enqueued"&&h.data.item.type!=="user")return;const v=await e.client.session.get({sessionID:h.data.sessionID}),c=v.time.archived;if(h.type!=="session.unarchived"){if(c===void 0||h.created<=c)return;await e.client.session.update({sessionID:v.id,archived:!1}),e.log.write("info",`${e.id}: unarchived ${v.id} on ${h.type}`);return}c!==void 0||(Number(v.metadata?.[n])||0)>=h.created||await e.client.session.update({sessionID:v.id,metadata:{...v.metadata,[n]:h.created}})},b=async()=>{for(;!r.aborted;){try{const h=e.client.event.subscribe({types:he},{signal:r});for await(const v of h)d(v).catch(a)}catch(h){r.aborted||a(h)}r.aborted||await new Promise(h=>setTimeout(h,5e3))}},u=()=>{i().catch(a)},m=setTimeout(u,K),k=setInterval(u,10*K),q=()=>{r.aborted||(clearTimeout(m),clearInterval(k),o.abort())};return globalThis[fe]?.(),globalThis[fe]=q,e.signal.addEventListener("abort",q,{once:!0}),b(),q}const x=(e,t,n)=>{e.getAttribute(t)!==n&&e.setAttribute(t,n)},F=(e,t,n)=>n===void 0?e.removeAttribute(t):x(e,t,n),we='[data-slot="new-session-composer"]',Pe='[data-slot="new-session-location-path"]',Be=["branch","new-branch"].map(e=>`${we} use[href="#opencode-v2-icon-${e}"]`).join(", "),W="data-plus-branch",We=`
[${W}] {
  border-radius: var(--radius-sm);
}
[${W}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
`,ze="git branch --all --no-color --no-column --sort=-committerdate";function Ue(e){document.querySelectorAll(Be).forEach(t=>{const n=t.closest("svg").parentElement;x(n,W,""),x(n,"role","button"),x(n,"tabindex","0"),x(n,"aria-haspopup","dialog"),x(n,"aria-description",e)})}function Fe(e){const t=o=>o.target instanceof Element?o.target.closest(`[${W}]`):null,n=o=>{const r=t(o);r&&e(r)},s=o=>{const r=t(o);o.key!=="Enter"&&o.key!==" "||!r||(o.preventDefault(),e(r))};return document.addEventListener("click",n),document.addEventListener("keydown",s),()=>{document.removeEventListener("click",n),document.removeEventListener("keydown",s)}}async function He(e,t){const n=e.closest(we)?.querySelector(Pe)?.textContent??"";if(!n.includes("…"))return n||void 0;const[s,o]=n.split("…");return(await t()).flatMap(r=>[r.canonical,...r.sandboxes]).find(r=>r.startsWith(s)&&r.endsWith(o))}function Ge(e){const t=new Set,n=new Map,s=[];let o;for(const r of e.split(/\r?\n/)){const a=r.slice(2).trim();if(!(!a||a.startsWith("(")||a.includes(" -> "))){if(a.startsWith("remotes/")){const l=a.slice(8),g=l.slice(l.indexOf("/")+1);n.has(g)||n.set(g,l);continue}t.add(a),r.startsWith("*")&&(o=a),r.startsWith("+")||s.push({title:a,value:a})}}return n.forEach((r,a)=>{t.has(a)||s.push({title:a,value:a,description:r})}),{current:o,options:s}}const Ve=e=>`git switch ${/^[\w./-]+$/.test(e)?e:`'${e.replaceAll("'","'\\''")}'`}`;function Ke(){document.querySelectorAll(`[${W}]`).forEach(e=>{[W,"role","tabindex","aria-haspopup","aria-description"].forEach(t=>e.removeAttribute(t))})}const ke='[data-slot="composer-controls"]',Ee=`${ke} > div > [data-component="tooltip-v2-trigger"]`,Ae='[data-action="composer-model"]',Se=`${Ee}:has(~ [data-component="tooltip-v2-trigger"] ${Ae})`,xe=`${Ee}:has(${Ae}) ~ [data-component="tooltip-v2-trigger"]`,_="data-plus-hidden-agent",J="data-plus-variant-menu";function _e({lowercaseVariants:e}){return`
${Se}[${_}] {
  display: none;
}
${e?`${xe} .capitalize,
[${J}] .capitalize {
  text-transform: lowercase;
}`:""}
`}function Je(e){document.querySelectorAll(Se).forEach(t=>{const n=e!==!1&&t.textContent.trim().toLowerCase()===e.toLowerCase();F(t,_,n?"":void 0)}),document.querySelectorAll(`${xe} [aria-controls]`).forEach(t=>{const n=document.getElementById(t.getAttribute("aria-controls"));n&&x(n,J,"")})}const me=new WeakSet;function Ye(e){document.querySelectorAll(ke).forEach(t=>{me.has(t)||(me.add(t),e.observe(t,{subtree:!0,characterData:!0}))})}function Xe(){document.querySelectorAll(`[${_}]`).forEach(e=>e.removeAttribute(_)),document.querySelectorAll(`[${J}]`).forEach(e=>e.removeAttribute(J))}function Qe({label:e,icon:t,shortcut:n,onSelect:s}){const o=document.createElement("hr");o.setAttribute("data-slot","menu-v2-separator");const r=document.createElement("div");r.setAttribute("role","menuitem"),r.setAttribute("data-component","menu-v2-item");const a=document.createElement("span");if(a.setAttribute("data-slot","menu-v2-item-content"),t(a),a.append(e),r.append(a),n){const l=document.createElement("span");l.setAttribute("data-slot","menu-v2-item-shortcut"),l.textContent=n,r.append(l)}return r.addEventListener("pointerenter",()=>r.setAttribute("data-highlighted","")),r.addEventListener("pointerleave",()=>r.removeAttribute("data-highlighted")),r.addEventListener("click",()=>{r.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:!0})),s()}),queueMicrotask(()=>{const l=r.closest('[role="menu"]')?.querySelector("[data-appearance]")?.getAttribute("data-appearance");l&&(r.setAttribute("data-appearance",l),o.setAttribute("data-appearance",l))}),[o,r]}function Le(e={}){const t=e.archiveAfterHours;return{archiveAfterHours:typeof t=="number"&&t>=0?t:12,hideAgent:typeof e.hideAgent=="string"||e.hideAgent===!1?e.hideAgent:"build",responseLabel:typeof e.responseLabel=="string"?e.responseLabel:e.responseLabel===!1?"":"Response",lowercaseVariants:e.lowercaseVariants!==!1}}const A='[data-slot="sidebar-inbox"]',ae='[data-slot="sidebar-inbox-scroll"]',H='[data-slot="sidebar-inbox-working"]',se=`${ae} > div.pt-3`,f='[data-slot="sidebar-inbox-item"]',T="data-plus-shelf",D="data-plus-toggle",ie="data-plus-count",I="data-plus-group",Y="data-plus-gap",N="data-plus-member",j="data-plus-inline",O="data-plus-add",Q=`${A} ${f}[data-status="ready"]:not([data-state="active"], :hover:not(:has([${O}]:hover)), :focus-visible, [${T}] > *)`,Ze='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5L8 9.5L11.5 6.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',et=`
${se} {
  order: 100000;
  margin-top: auto;
}
${A}[${j}] {
  overflow-y: auto;
  gap: 1px;
  padding-bottom: 4px;
}
[${j}] > ${ae},
[${j}] > ${H},
[${j}] > ${H} > div {
  display: contents;
}
[${j}] > ${H} > button {
  display: none;
}
[${T}] > [${D}] {
  border-radius: 6px;
}
[${T}] > [${D}]:hover {
  color: var(--color-v2-text-text-base);
}
[${T}] > [${D}]:focus-visible {
  outline: none;
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${T}] > [${D}]::before {
  content: attr(${ie});
  order: 1;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-faint);
}
[${T}] > [${D}]::after {
  content: "";
  order: 2;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(Ze)}") center / 16px no-repeat;
}
[${T}="closed"] > [${D}]::after {
  rotate: -90deg;
}
[${T}="closed"] > [${D}]:dir(rtl)::after {
  rotate: 90deg;
}
[${T}="closed"] > ${f}:not([data-state="active"]) {
  display: none;
}
${A} ${f}[data-status="working"] {
  opacity: 1;
}
${A} ${f}[data-status="working"] > span:nth-of-type(2) {
  color: var(--color-v2-text-text-base);
}
/* T3 Code's Working colors: sky-600 text and a sky-500 pulsing dot, or sky-300 at 80% in dark mode. */
${A} {
  --plus-working: oklch(58.8% 0.158 241.966);
  --plus-working-dot: oklch(68.5% 0.169 237.323);
  --plus-working-peak: oklch(74.6% 0.16 232.661);
}
[data-color-scheme="dark"] ${A} {
  --plus-working: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-dot: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-peak: oklch(95.1% 0.026 236.824);
}
${A} ${f}[data-status="working"] > span:first-child > span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--plus-working);
}
${A} ${f}[data-status="working"] > span:first-child > span:last-child > span {
  color: inherit;
}
${A} ${f}[data-status="working"] [data-component="text-shimmer"] {
  --text-shimmer-base-color: var(--plus-working);
  --text-shimmer-peak-color: var(--plus-working-peak);
}
${A} ${f}[data-status="working"] > span:first-child > span:last-child::before {
  content: "";
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background-color: var(--plus-working-dot);
  animation: plus-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes plus-pulse {
  50% {
    opacity: 0.5;
  }
}
@media (prefers-reduced-motion: reduce) {
  ${A} ${f}[data-status="working"] > span:first-child > span:last-child::before {
    animation: none;
  }
}
${A} ${f} > span,
${A} ${f} > span:first-child > span {
  transition: opacity 150ms;
}
${Q}:not([${N}]) > span,
${Q}[${N}] > span:not(:first-child),
${Q}[${N}] > span:first-child > span:last-child {
  opacity: 0.6;
}
/* In a project group the heading names the project, so rows drop their project line and show the time beside the
   title: the first line dissolves into the row's grid, keeping only its last part, the time or status. */
${f}[${N}] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "title status";
  column-gap: 8px;
}
${f}[${N}] > span:first-child {
  display: contents;
}
${f}[${N}] > span:first-child > span:not(:last-child) {
  display: none;
}
${f}[${N}] > span:first-child > span:last-child {
  grid-area: status;
}
${f}[${N}] > span:nth-of-type(2) {
  grid-area: title;
}
${f}[${N}] > span:nth-of-type(3) {
  grid-column: 1 / -1;
}
/* The same space before every project; a group's heading takes its own 28px on top of it. */
${f}[${Y}] {
  margin-top: 16px;
}
${f}[${I}] {
  position: relative;
  margin-top: 28px;
}
${f}[${I}][${Y}] {
  margin-top: 44px;
}
${f}[${I}]::before {
  content: attr(${I});
  position: absolute;
  inset-inline: 0;
  bottom: 100%;
  margin-bottom: 4px;
  padding-inline: 28px;
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  line-height: 24px;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--color-v2-text-text-muted);
  pointer-events: none;
}
/* The heading's project badge is the group's first row's own, moved up before the name. It lines up with the badges
   of single-session rows: 6px in, centered on the heading's 24px line. */
${f}[${I}] > span:first-child > span:first-child {
  display: flex;
  position: absolute;
  inset-inline-start: 6px;
  bottom: calc(100% + 8px);
  pointer-events: none;
}
/* The heading's + button, at the far end of its 24px line, its icon in line with the times of the rows below. */
${f}[${I}] > [${O}] {
  position: absolute;
  inset-inline-end: 4px;
  bottom: calc(100% + 6px);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  color: var(--color-v2-text-text-faint);
}
${f}[${I}] > [${O}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
${f}[${I}]:not([data-state="active"]):has(> [${O}]:hover) {
  background-color: transparent;
}
`,U=e=>e?Array.from(e.children).filter(t=>t.matches(f)):[],tt=e=>e.querySelector(":scope > span:first-child > span.truncate")?.textContent?.trim(),Ce=e=>{e.style.removeProperty("order"),e.style.length===0&&e.removeAttribute("style"),e.removeAttribute(I),e.removeAttribute(Y),e.removeAttribute(N)};function nt(e){const t=e?"open":"closed";document.querySelectorAll(se).forEach(n=>{const s=n.firstElementChild;!s||s.matches(f)||(x(n,T,t),x(s,D,""),x(s,ie,String(U(n).length)),x(s,"role","button"),x(s,"tabindex","0"),x(s,"aria-expanded",String(e)))})}function ot(e){const t=o=>o.target instanceof Element?o.target.closest(`${se} > [${D}]`):null,n=o=>{t(o)&&e()},s=o=>{o.key!=="Enter"&&o.key!==" "||!t(o)||(o.preventDefault(),e())};return document.addEventListener("click",n),document.addEventListener("keydown",s),()=>{document.removeEventListener("click",n),document.removeEventListener("keydown",s)}}const ge=(e,t,n=[])=>{const s=[...n,...e];if(!t&&n.length===0)return s.forEach(Ce);const o=new Map;s.forEach(a=>{const l=t&&tt(a)||a;o.set(l,[...o.get(l)??[],a])});let r=0;Array.from(o).forEach(([a,l],g)=>{const i=t&&typeof a=="string"&&l.length>1;l.forEach((d,b)=>{r+=1,d.style.order!==String(r)&&(d.style.order=String(r)),F(d,I,i&&b===0?a:void 0),F(d,N,i?"":void 0),F(d,Y,t&&g>0&&b===0?"":void 0)})})};function Te(e,t){document.querySelectorAll(A).forEach(n=>{const s=n.querySelector(`:scope > ${ae}`),o=n.querySelector(`:scope > ${H} > div`),r=new Set;t?(x(n,j,""),n.querySelector(`:scope > ${H} > button[aria-expanded="false"]`)?.click(),ge(U(s),e,U(o)),r.add(s).add(o)):n.removeAttribute(j),new Set(Array.from(n.querySelectorAll(f),a=>a.parentElement)).forEach(a=>{if(r.has(a))return;const l=a.getAttribute(T)==="closed",g=U(a).filter(i=>!l||i.getAttribute("data-state")==="active");U(a).filter(i=>!g.includes(i)).forEach(Ce),ge(g,e)})})}function rt(e){document.querySelectorAll(`${f} > [${O}]`).forEach(t=>{t.parentElement.getAttribute(I)!==t.getAttribute(O)&&t.remove()}),document.querySelectorAll(`${f}[${I}]`).forEach(t=>{t.querySelector(`:scope > [${O}]`)||t.append(e(t.getAttribute(I)))})}function at({name:e,label:t,icon:n,onSelect:s}){const o=document.createElement("div"),r=a=>{a.preventDefault(),a.stopPropagation(),s()};return o.setAttribute(O,e),o.setAttribute("role","button"),o.setAttribute("tabindex","0"),o.setAttribute("aria-label",t),o.setAttribute("title",t),n(o),o.addEventListener("pointerdown",a=>a.stopPropagation()),o.addEventListener("click",r),o.addEventListener("keydown",a=>{(a.key==="Enter"||a.key===" ")&&r(a)}),o}function st(){Te(!1,!1),document.querySelectorAll(`[${O}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${T}]`).forEach(e=>e.removeAttribute(T)),document.querySelectorAll(`[${D}]`).forEach(e=>{[D,ie,"role","tabindex","aria-expanded"].forEach(t=>e.removeAttribute(t))})}const it="[data-timeline-virtual-content]",Ie='[data-slot="session-turn-message-container"]',V="data-plus-final",Z=`[${V}] > [data-component="session-turn"] > ${Ie}`,ce="--plus-label-half";function ct(e){return`
${Z} {
  --plus-gap: calc(var(${ce}, ${e.length*3.75}px) + 12px);
  position: relative;
}
${Z}::before {
  content: "";
  display: block;
  /* The reply container is a column that aligns items to the start, which would shrink an empty line to nothing. */
  align-self: stretch;
  height: 32px;
  margin-bottom: 8px;
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    var(--v2-border-border-strong) 35%,
    var(--v2-border-border-strong) 65%,
    transparent 100%
  );
  background-size: 100% 1px;
  background-position: center;
  background-repeat: no-repeat;
${e?`  mask-image: linear-gradient(
    90deg,
    #000 calc(50% - var(--plus-gap)),
    transparent calc(50% - var(--plus-gap)),
    transparent calc(50% + var(--plus-gap)),
    #000 calc(50% + var(--plus-gap))
  );
}
${Z}::after {
  content: ${JSON.stringify(e)};
  position: absolute;
  top: 0;
  left: 50%;
  translate: -50% 0;
  font-size: 13px;
  font-weight: 440;
  line-height: 32px;
  letter-spacing: -0.04px;
  white-space: nowrap;
  color: var(--color-v2-text-text-faint);
  pointer-events: none;
}`:"}"}
`}let ve=!1;function lt(e){const t=document.querySelector(Ie);if(ve||!e||!t||document.fonts?.status==="loading")return;const n=document.createElement("span");n.textContent=e,n.style.cssText="position: absolute; visibility: hidden; white-space: nowrap; font-size: 13px; font-weight: 440; letter-spacing: -0.04px",t.append(n);const s=n.getBoundingClientRect().width;n.remove(),s&&(document.documentElement.style.setProperty(ce,`${s/2}px`),ve=!0)}const R=e=>e?.frame?.getAttribute("data-timeline-row"),M=e=>e?.frame?.getAttribute("data-message-id"),ee=e=>R(e)==="AssistantPart"&&!!e.frame.querySelector('[data-component="text-part"]')&&!e.frame.querySelector('[data-component="tool-part-wrapper"], [data-timeline-part-ids]');function dt(e){document.querySelectorAll(it).forEach(t=>{const n=Array.from(t.querySelectorAll(":scope > div > [data-timeline-key]"),i=>({wrapper:i,frame:i.querySelector(":scope > [data-index] > [data-timeline-row]"),top:parseFloat(i.style.top),height:parseFloat(i.style.height)})).sort((i,d)=>i.top-d.top),s=t.querySelector(':scope > [data-timeline-row="bottom-spacer"]'),o=i=>n[i+1]&&Math.abs(n[i+1].top-(n[i].top+n[i].height))<2?n[i+1]:void 0,r=i=>n[i-1]&&Math.abs(n[i].top-(n[i-1].top+n[i-1].height))<2?n[i-1]:void 0,a=i=>i===n.length-1&&!!s&&Math.abs(n[i].wrapper.getBoundingClientRect().bottom-s.getBoundingClientRect().top)<2,l=e?void 0:!0,g=i=>{const d=o(i);return d?d.frame?R(d)==="TurnGap"||R(d)==="UserMessage"||M(d)&&M(d)!==M(n[i])||R(d)==="TurnDiff"||R(d)==="TurnDivider"?!0:R(d)==="AssistantPart"||R(d)==="Thinking"?!1:l:l:n[i+1]||!a(i)?void 0:l};n.forEach((i,d)=>{if(!ee(i))return te(i,!1);const b=g(d);if(b===void 0)return;if(!b){const m=o(d);ee(m)&&M(m)===M(i)||te(i,!1);return}let u=d;for(;ee(r(u))&&M(r(u))===M(i);)u-=1;for(let m=u;m<=d;m+=1)te(n[m],m===u&&n[m].frame.hasAttribute("data-timeline-spacing"))})})}const G=new Map,te=(e,t)=>{!e.frame||e.frame.hasAttribute(V)===t||(F(e.frame,V,t?"":void 0),G.set(e.frame.parentElement,10))};function ut(){G.forEach((e,t)=>{if(!(t.isConnected&&Math.abs(t.offsetHeight-parseFloat(t.parentElement.style.height))>=1)||e===0)return G.delete(t);G.set(t,e-1),t.style.paddingBottom="1px",requestAnimationFrame(()=>t.style.removeProperty("padding-bottom"))})}const pt=()=>G.size>0;function ht(){document.querySelectorAll(`[${V}]`).forEach(e=>e.removeAttribute(V)),document.documentElement.style.removeProperty(ce)}const ft='[data-component="tooltip-v2-trigger"] > button:not([aria-haspopup]):has([data-component="progress-circle"])',w="data-plus-usage",be="plus-usage-card",re="data-plus-usage-hover",mt=50,gt=100,vt=4,bt=`
:root[${re}] [data-component="tooltip-v2"]:not([data-force-open="true"]) {
  display: none;
}
[${w}] {
  position: fixed;
  z-index: 1000;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 280px;
  max-width: calc(100vw - 16px);
  padding: 12px;
  border-radius: 8px;
  background: var(--v2-background-bg-layer-01);
  box-shadow: var(--v2-elevation-floating);
  font-size: 13px;
  font-weight: 440;
  line-height: var(--line-height-compact);
  letter-spacing: -0.04px;
  font-variant-numeric: tabular-nums;
  color: var(--v2-text-text-muted);
  -webkit-font-smoothing: antialiased;
  transform-origin: top right;
  animation: plus-usage-in 120ms ease-out;
}
[${w}]:dir(rtl) {
  transform-origin: top left;
}
[${w}] [data-part="row"] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
  white-space: nowrap;
}
[${w}] [data-part="row"] > :last-child {
  margin-inline-start: auto;
}
[${w}] :is([data-part="value"], [data-part="percent"]) {
  color: var(--v2-text-text-base);
}
[${w}] [data-part="percent"] {
  font-weight: 530;
}
[${w}] [data-part="bar"] {
  display: flex;
  height: 8px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--v2-background-bg-layer-03);
}
[${w}] [data-part="bar"] > span {
  box-sizing: border-box;
  min-width: 3px;
}
/* A line in the card's color between kinds, as in Cursor's bar. */
[${w}] [data-part="bar"] > span + span {
  border-inline-start: 1px solid var(--v2-background-bg-layer-01);
}
[${w}] [data-part="legend"] {
  display: flex;
  flex-direction: column;
}
[${w}] [data-part="dot"] {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
[${w}] hr {
  height: 1px;
  margin: 0 -12px;
  border: none;
  background: var(--v2-border-border-muted);
}
@keyframes plus-usage-in {
  from {
    opacity: 0;
    scale: 0.96;
  }
}
@media (prefers-reduced-motion: reduce) {
  [${w}] {
    animation: none;
  }
}
:root[data-motion="reduce"] [${w}] {
  animation: none;
}
`;function yt(e){let t,n,s=0;const o=document.documentElement,r=(c,L)=>{clearTimeout(s),s=setTimeout(c,L)},a=c=>c.target instanceof Element?c.target.closest(ft):null,l=c=>c instanceof Node&&!!(t?.contains(c)||n?.card.contains(c)),g=()=>{if(!t.isConnected)return;const c=document.createElement("div"),L=t.closest("[data-theme]")?.getAttribute("data-theme");c.id=be,c.setAttribute(w,""),c.setAttribute("role","tooltip"),L&&c.setAttribute("data-theme",L),n={card:c,stop:e(c)},document.body.append(c),Et(c,t),t.setAttribute("aria-describedby",be)},i=()=>{clearTimeout(s),n?.stop(),n?.card.remove(),n=void 0,t?.removeAttribute("aria-describedby")},d=c=>{if(c===t){n&&clearTimeout(s);return}b(),t=c,o.setAttribute(re,""),r(g,mt)},b=()=>{i(),t=void 0,o.removeAttribute(re)},u=c=>{if(c.pointerType==="touch")return;const L=a(c);if(L)return d(L);if(n?.card.contains(c.target))return clearTimeout(s);t&&!t.isConnected&&b()},m=c=>{!t||l(c.relatedTarget)||!l(c.target)||(n?r(b,gt):b())},k=c=>{t?.contains(c.target)&&i()},q=c=>{c.key==="Escape"&&i()},h=c=>{const L=a(c);L?.matches(":focus-visible")&&d(L)},v=c=>{t?.contains(c.target)&&!l(c.relatedTarget)&&b()};return document.addEventListener("pointerover",u),document.addEventListener("pointerout",m),document.addEventListener("pointerdown",k,!0),document.addEventListener("keydown",q),document.addEventListener("focusin",h),document.addEventListener("focusout",v),()=>{document.removeEventListener("pointerover",u),document.removeEventListener("pointerout",m),document.removeEventListener("pointerdown",k,!0),document.removeEventListener("keydown",q),document.removeEventListener("focusin",h),document.removeEventListener("focusout",v),b()}}function $t(e){const t=e.server.data,n=e.directory?{directory:e.directory}:void 0,s=t.session.get(e.id),o=t.session.message.list(e.id),r=Me.lastAssistantWithUsage(o,s?.revert?.messageID),a=r?.tokens,l=a?a.input+a.output+a.reasoning+a.cache.read+a.cache.write:0,g=r?ye(t,n,r.model)?.limit.context:void 0,i=t.session.cost(e.id),d=s?.model??o.findLast(m=>m.type==="assistant")?.model,b=d?ye(t,n,d):void 0,u=!!b&&b.cost.every(m=>!m.input&&!m.output&&!m.cache.read&&!m.cache.write);return{total:l,tokens:a,limit:g||void 0,percent:g?Math.round(l/g*100):void 0,cost:i>0||!u?i:void 0}}function wt({total:e,tokens:t,limit:n,percent:s,cost:o},r,a){const l=u=>new Intl.NumberFormat(a,{notation:"compact",maximumFractionDigits:0}).format(u).toLocaleLowerCase(a),g=t?kt.map(u=>({...u,value:u.value(t)})).filter(u=>u.value>0):[],i=Math.max(n??0,e),d=C("span",void 0,n?`${l(e)} / ${l(n)} `:l(e));n&&d.append(C("span","percent",`(${s}%)`));const b=[ne([C("span",void 0,r("usage.window")),d])];if(i>0){const u=C("div","bar");u.setAttribute("aria-hidden","true"),g.forEach(m=>{const k=C("span");k.style.width=`${m.value/i*100}%`,k.style.background=m.color,u.append(k)}),b.push(u)}if(g.length){const u=C("div","legend");g.forEach(m=>{const k=C("span","dot");k.style.background=m.color,u.append(ne([k,C("span",void 0,r(m.label)),C("span","value",m.value.toLocaleString(a))]))}),b.push(u)}if(o!==void 0){const u=new Intl.NumberFormat(a,{style:"currency",currency:"USD"});b.push(C("hr"),ne([C("span",void 0,r("usage.cost")),C("span","value",u.format(o))]))}return b}const kt=[{label:"usage.cacheRead",color:"var(--v2-avatar-border-blue)",value:e=>e.cache.read},{label:"usage.cacheWrite",color:"var(--v2-avatar-border-purple)",value:e=>e.cache.write},{label:"usage.input",color:"var(--v2-avatar-border-pink)",value:e=>e.input},{label:"usage.reasoning",color:"var(--v2-avatar-border-yellow)",value:e=>e.reasoning},{label:"usage.output",color:"var(--v2-avatar-border-green)",value:e=>e.output}],ye=(e,t,n)=>{const s=e.location.provider.list(t),o=e.location.model.list(t);if(s?.some(r=>r.id===n.providerID))return o?.findLast(r=>r.providerID===n.providerID&&r.id===n.id&&r.status!=="deprecated")},C=(e,t,n)=>{const s=document.createElement(e);return t&&s.setAttribute("data-part",t),n!==void 0&&(s.textContent=n),s},ne=e=>{const t=C("div","row");return t.append(...e),t},Et=(e,t)=>{const n=t.getBoundingClientRect(),s=e.offsetWidth,o=getComputedStyle(t).direction==="rtl"?n.left:n.right-s;e.style.top=`${n.bottom+vt}px`,e.style.left=`${Math.max(8,Math.min(o,innerWidth-s-8))}px`},qe=60*1e3,At=60*qe,$e="tab.new",oe="sidecar";function St(e){const t=Le(e.options),{shelf:n,groups:s,working:o}=e.stores,r=(p,y)=>$=>pe.insert($,()=>ue.createComponent(e.ui.Icon,{name:p,...y})),a=()=>{const p=e.sessions.current();try{const y=p?.server.data.session;return!!p&&(y.status(p.id)==="running"||y.pending.list(p.id).some($=>$.type!=="synthetic"))}catch{return!1}},l=()=>n.update(p=>{p.archivedOpen=!p.archivedOpen}),g=async p=>{const $=(await e.client.project.list()).filter(E=>(E.name||E.canonical.split("/").pop())===p).toSorted((E,z)=>z.time.active-E.time.active)[0];if(!$)return e.layout.project(oe,e.t("session.new"));e.layout.draft({server:oe,directory:$.canonical,prompt:""})},i=p=>at({name:p,label:e.t("session.newIn",{project:p}),icon:r("plus",{size:"small"}),onSelect:()=>{g(p).catch(()=>e.toast.show({title:e.t("session.failed",{project:p})}))}}),d=async(p,y)=>{const $={directory:p};let{data:E}=await e.client.shell.create({location:$,command:y,timeout:qe});try{for(;E.status==="running";)await new Promise(P=>setTimeout(P,100)),E=(await e.client.shell.get({id:E.id,location:$})).data;const{data:z}=await e.client.shell.output({id:E.id,location:$});return{ok:E.exit===0,output:z.output}}finally{e.client.shell.remove({id:E.id,location:$}).catch(()=>{})}},b=async p=>{const y=await He(p,()=>e.client.project.list()),$=y&&await d(y,ze);if(!$?.ok)return e.toast.show({variant:"error",title:e.t("branch.unlisted"),description:$?.output.trim()});const{current:E,options:z}=Ge($.output),P=await e.dialogs.select({title:e.t("branch.switch"),placeholder:e.t("branch.search"),options:z,current:E});if(!P||P===E)return;const le=await d(y,Ve(P));if(!le.ok)return e.toast.show({variant:"error",title:e.t("branch.failed",{branch:P}),description:le.output.trim()});const de=e.servers.get(oe)?.data;de?.location.vcs.invalidate({directory:y}),await de?.location.vcs.sync({directory:y})};let u=!1;const m=p=>{u||(u=!0,b(p).catch(y=>e.toast.show({variant:"error",title:e.t("branch.error"),description:String(y?.message??y)})).finally(()=>{u=!1}))},k=()=>{nt(n.value.archivedOpen),Te(s.value.enabled,o.value.inline),rt(i),Ue(e.t("branch.switch")),Je(t.hideAgent),Ye(L),lt(t.responseLabel),ut(),dt(a()),pt()&&!h&&(h=setTimeout(()=>{h=0,v()},300))};let q=0,h=0;const v=()=>{q||(q=requestAnimationFrame(()=>{q=0,k()}))},c=new MutationObserver(v);c.observe(document.body,{childList:!0,subtree:!0});const L=new MutationObserver(v);document.addEventListener("scrollend",v,!0);const Ne=ot(l),De=yt(p=>ue.createRoot(y=>(pe.insert(p,()=>{const $=e.sessions.current();return $?wt($t($),e.t,e.locale.locale()):[]}),y))),Oe=Fe(m);return S.createKeyed(()=>`${n.value.archivedOpen}:${s.value.enabled}:${o.value.inline}:${a()}`,k),e.add(S.Style,et),e.add(S.Style,We),e.add(S.Style,_e(t)),e.add(S.Style,ct(t.responseLabel)),e.add(S.Style,bt),e.add(S.Slot,{at:"session.location.menu",order:100,render:p=>Qe({label:e.t("session.new"),icon:r("edit",{class:"shrink-0 text-v2-icon-icon-muted"}),shortcut:e.keybinds.keybind($e).join(""),onSelect:()=>{e.commands.run($e)||e.layout.draft({server:p.session.server.id,directory:p.session.directory,prompt:""})}})}),e.add(S.Command,()=>({id:"toggle-archived",title:e.t(n.value.archivedOpen?"archived.hide":"archived.show"),keywords:"archive archived settled sessions sidebar inbox",run:l})),e.add(S.Command,()=>({id:"toggle-groups",title:e.t(s.value.enabled?"groups.off":"groups.on"),keywords:"group project projects folders sessions sidebar inbox",run:()=>s.update(p=>{p.enabled=!p.enabled})})),e.add(S.Command,()=>({id:"toggle-working",title:e.t(o.value.inline?"working.section":"working.inline"),keywords:"working running busy section shelf sessions sidebar inbox",run:()=>o.update(p=>{p.inline=!p.inline})})),()=>{c.disconnect(),L.disconnect(),cancelAnimationFrame(q),clearTimeout(h),document.removeEventListener("scrollend",v,!0),Ne(),De(),Oe(),st(),Ke(),Xe(),ht()}}function xt(e){const{archiveAfterHours:t}=Le(e.options);if(t>0)return je(e,t*At)}const Lt=S.Plugin.define({stores:{shelf:S.Store.global(B.Schema.Struct({archivedOpen:B.Schema.Boolean}),{archivedOpen:!1}),groups:S.Store.global(B.Schema.Struct({enabled:B.Schema.Boolean}),{enabled:!0}),working:S.Store.global(B.Schema.Struct({inline:B.Schema.Boolean}),{inline:!0})},i18n:{en:{"archived.show":"Show archived sessions","archived.hide":"Hide archived sessions","groups.on":"Group sessions by project","groups.off":"Stop grouping sessions by project","working.inline":"Show working sessions in the list","working.section":"Show working sessions in their own section","session.new":"New session","session.newIn":"New session in {{project}}","session.failed":"Could not start a session in {{project}}","usage.window":"Context window","usage.cacheRead":"Cache read","usage.cacheWrite":"Cache write","usage.input":"Input","usage.reasoning":"Reasoning","usage.output":"Output","usage.cost":"Cost","branch.switch":"Switch branch","branch.search":"Search branches","branch.unlisted":"Could not list the branches","branch.failed":"Could not switch to {{branch}}","branch.error":"Could not switch the branch"}},setup:St,main:xt});exports.default=Lt;
