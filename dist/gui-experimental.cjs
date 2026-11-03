"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const $=require("@opencode/plugin/gui"),P=require("effect"),G=require("solid-js"),be=require("solid-js/web"),K=60*1e3,re=200,ve=["session.inbox.enqueued","session.execution.started","session.unarchived"],ye=Symbol.for("opencode-plus.archive");function Ge(e,t,n,s){const{created:o,updated:i,busy:a,idle:c,archived:g}=e.time;if(g!==void 0||e.parentID||a!==void 0&&(c===void 0||a>c))return!1;const r=Math.max(o,a??0,c??0);return(Number(e.metadata?.[s])||0)>=r||t-i<2*K?!1:t-r>=n}function He(e,t){const n=`${e.id}.keptAt`,s=Date.now(),o=new AbortController,i=o.signal,a=u=>e.log.write("error",`${e.id}: ${u?.stack??u}`),c=async()=>{const u=[];let h=await e.client.session.list({parentID:null,archived:!1,limit:re});for(;;){if(u.push(...h.data),h.data.length<re||!h.cursor.next)return u;h=await e.client.session.list({cursor:h.cursor.next,limit:re})}};let g=!1;const r=async()=>{if(!g){g=!0;try{const u=Date.now(),h=(await c()).filter(E=>Ge(E,u,t,n));for(const E of h)await e.client.session.update({sessionID:E.id,archived:!0}),e.log.write("info",`${e.id}: archived ${E.id} "${E.title??""}"`)}finally{g=!1}}},p=async u=>{if(!ve.includes(u.type)||u.created<s-K||u.type==="session.inbox.enqueued"&&u.data.item.type!=="user")return;const h=await e.client.session.get({sessionID:u.data.sessionID}),E=h.time.archived;if(u.type!=="session.unarchived"){if(E===void 0||u.created<=E)return;await e.client.session.update({sessionID:h.id,archived:!1}),e.log.write("info",`${e.id}: unarchived ${h.id} on ${u.type}`);return}E!==void 0||(Number(h.metadata?.[n])||0)>=u.created||await e.client.session.update({sessionID:h.id,metadata:{...h.metadata,[n]:u.created}})},C=async()=>{for(;!i.aborted;){try{const u=e.client.event.subscribe({types:ve},{signal:i});for await(const h of u)p(h).catch(a)}catch(u){i.aborted||a(u)}i.aborted||await new Promise(u=>setTimeout(u,5e3))}},q=()=>{r().catch(a)},A=setTimeout(q,K),_=setInterval(q,10*K),T=()=>{i.aborted||(clearTimeout(A),clearInterval(_),o.abort())};return globalThis[ye]?.(),globalThis[ye]=T,e.signal.addEventListener("abort",T,{once:!0}),C(),T}const L=(e,t,n)=>{e.getAttribute(t)!==n&&e.setAttribute(t,n)},U=(e,t,n)=>n===void 0?e.removeAttribute(t):L(e,t,n),Ee='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5L8 9.5L11.5 6.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',Se='[data-slot="new-session-composer"]',We='[data-slot="new-session-location-path"]',ze=["branch","new-branch"].map(e=>`${Se} use[href="#opencode-v2-icon-${e}"]`).join(", "),j="data-plus-branch",F="data-plus-branch-trigger",J="data-plus-branch-menu",xe="data-plus-branch-current",Fe='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M3.53564 8.17857L6.39279 11.75L12.4642 4.25" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',Ve=`
[${j}] {
  position: relative;
  border-radius: var(--radius-sm);
}
[${j}]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline: -2px -4px;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(Ee)}") center / 16px no-repeat;
}
[${j}]:is(:hover, :has(:focus-visible), :has([data-expanded])) {
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${F}] {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
[${F}] > button {
  width: 100%;
  height: 100%;
  opacity: 0;
}
[${J}] {
  max-height: min(320px, var(--kb-popper-content-available-height, 320px));
  overflow-y: auto;
}
[${J}] [data-component="menu-v2-item"]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
}
[${J}] [${xe}]::after {
  background-color: var(--menu-v2-icon);
  mask: url("data:image/svg+xml,${encodeURIComponent(Fe)}") center / 14px no-repeat;
}
`,_e="git branch --all --no-color --no-column --sort=-committerdate",B=new Map;function Ke(e){B.forEach((t,n)=>{n.isConnected||(t(),B.delete(n))}),document.querySelectorAll(ze).forEach(t=>{const n=t.closest("svg").parentElement;if(B.has(n))return;const s=document.createElement("div");s.setAttribute(F,""),n.setAttribute(j,""),n.append(s),B.set(n,e(s,n))})}function Je(){document.querySelectorAll(`[${F}] > [aria-controls]`).forEach(e=>{const t=document.getElementById(e.getAttribute("aria-controls"));if(!t)return;const n=e.closest(`[${j}]`).querySelector(":scope > span").textContent.trim();L(t,J,""),t.querySelectorAll('[data-component="menu-v2-item"]').forEach(s=>{U(s,xe,s.textContent.trim()===n?"":void 0)})})}async function Ye(e,t){const n=e.closest(Se)?.querySelector(We)?.textContent??"";if(!n.includes("…"))return n||void 0;const[s,o]=n.split("…");return(await t()).flatMap(i=>[i.canonical,...i.sandboxes]).find(i=>i.startsWith(s)&&i.endsWith(o))}function Xe(e){const t=new Set,n=[],s=new Map;let o;for(const a of e.split(/\r?\n/)){const c=a.slice(2).trim();if(!(!c||c.startsWith("(")||c.includes(" -> "))){if(c.startsWith("remotes/")){const g=c.slice(8),r=g.slice(g.indexOf("/")+1);s.has(r)||s.set(r,g);continue}t.add(c),a.startsWith("*")&&(o=c),a.startsWith("+")||n.push(c)}}const i=Array.from(s,([a,c])=>({name:a,ref:c})).filter(({name:a})=>!t.has(a));return{current:o,local:n,remote:i}}const Qe=e=>`git switch ${/^[\w./-]+$/.test(e)?e:`'${e.replaceAll("'","'\\''")}'`}`;function Ze(){B.forEach(e=>e()),B.clear(),document.querySelectorAll(`[${F}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${j}]`).forEach(e=>e.removeAttribute(j))}const qe='[data-slot="composer-controls"]',Le=`${qe} > div > [data-component="tooltip-v2-trigger"]`,Ce='[data-action="composer-model"]',Ie=`${Le}:has(~ [data-component="tooltip-v2-trigger"] ${Ce})`,Te=`${Le}:has(${Ce}) ~ [data-component="tooltip-v2-trigger"]`,Y="data-plus-hidden-agent",X="data-plus-variant-menu";function et({lowercaseVariants:e}){return`
${Ie}[${Y}] {
  display: none;
}
${e?`${Te} .capitalize,
[${X}] .capitalize {
  text-transform: lowercase;
}`:""}
`}function tt(e){document.querySelectorAll(Ie).forEach(t=>{const n=e!==!1&&t.textContent.trim().toLowerCase()===e.toLowerCase();U(t,Y,n?"":void 0)}),document.querySelectorAll(`${Te} [aria-controls]`).forEach(t=>{const n=document.getElementById(t.getAttribute("aria-controls"));n&&L(n,X,"")})}const $e=new WeakSet;function nt(e){document.querySelectorAll(qe).forEach(t=>{$e.has(t)||($e.add(t),e.observe(t,{subtree:!0,characterData:!0}))})}function ot(){document.querySelectorAll(`[${Y}]`).forEach(e=>e.removeAttribute(Y)),document.querySelectorAll(`[${X}]`).forEach(e=>e.removeAttribute(X))}function rt({label:e,icon:t,shortcut:n,onSelect:s}){const o=document.createElement("hr");o.setAttribute("data-slot","menu-v2-separator");const i=document.createElement("div");i.setAttribute("role","menuitem"),i.setAttribute("data-component","menu-v2-item");const a=document.createElement("span");if(a.setAttribute("data-slot","menu-v2-item-content"),t(a),a.append(e),i.append(a),n){const c=document.createElement("span");c.setAttribute("data-slot","menu-v2-item-shortcut"),c.textContent=n,i.append(c)}return i.addEventListener("pointerenter",()=>i.setAttribute("data-highlighted","")),i.addEventListener("pointerleave",()=>i.removeAttribute("data-highlighted")),i.addEventListener("click",()=>{i.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:!0})),s()}),queueMicrotask(()=>{const c=i.closest('[role="menu"]')?.querySelector("[data-appearance]")?.getAttribute("data-appearance");c&&(i.setAttribute("data-appearance",c),o.setAttribute("data-appearance",c))}),[o,i]}function Ne(e={}){const t=e.archiveAfterHours;return{archiveAfterHours:typeof t=="number"&&t>=0?t:12,hideAgent:typeof e.hideAgent=="string"||e.hideAgent===!1?e.hideAgent:"build",responseLabel:typeof e.responseLabel=="string"?e.responseLabel:e.responseLabel===!1?"":"Response",lowercaseVariants:e.lowercaseVariants!==!1}}const v='[data-slot="sidebar-inbox"]',de='[data-slot="sidebar-inbox-scroll"]',W='[data-slot="sidebar-inbox-working"]',ue=`${de} > div.pt-3`,d='[data-slot="sidebar-inbox-item"]',w="data-plus-shelf",x="data-plus-toggle",pe="data-plus-count",k="data-plus-group",Q="data-plus-gap",S="data-plus-member",O="data-plus-inline",I="data-plus-add",se=`${v} ${d}[data-status="ready"]:not([data-state="active"], :hover:not(:has([${I}]:hover)), :focus-visible, [${w}] > *)`,st=`
${ue} {
  order: 100000;
  margin-top: auto;
}
${v}[${O}] {
  overflow-y: auto;
  gap: 1px;
  padding-bottom: 4px;
}
[${O}] > ${de},
[${O}] > ${W},
[${O}] > ${W} > div {
  display: contents;
}
[${O}] > ${W} > button {
  display: none;
}
[${w}] > [${x}] {
  border-radius: 6px;
}
[${w}] > [${x}]:hover {
  color: var(--color-v2-text-text-base);
}
[${w}] > [${x}]:focus-visible {
  outline: none;
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${w}] > [${x}]::before {
  content: attr(${pe});
  order: 1;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-faint);
}
[${w}] > [${x}]::after {
  content: "";
  order: 2;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(Ee)}") center / 16px no-repeat;
}
[${w}="closed"] > [${x}]::after {
  rotate: -90deg;
}
[${w}="closed"] > [${x}]:dir(rtl)::after {
  rotate: 90deg;
}
[${w}="closed"] > ${d}:not([data-state="active"]) {
  display: none;
}
${v} ${d}[data-status="working"] {
  opacity: 1;
}
${v} ${d}[data-status="working"] > span:nth-of-type(2) {
  color: var(--color-v2-text-text-base);
}
/* T3 Code's Working colors: sky-600 text and a sky-500 pulsing dot, or sky-300 at 80% in dark mode. */
${v} {
  --plus-working: oklch(58.8% 0.158 241.966);
  --plus-working-dot: oklch(68.5% 0.169 237.323);
  --plus-working-peak: oklch(74.6% 0.16 232.661);
}
[data-color-scheme="dark"] ${v} {
  --plus-working: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-dot: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-peak: oklch(95.1% 0.026 236.824);
}
${v} ${d}[data-status="working"] > span:first-child > span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--plus-working);
}
${v} ${d}[data-status="working"] > span:first-child > span:last-child > span {
  color: inherit;
}
${v} ${d}[data-status="working"] [data-component="text-shimmer"] {
  --text-shimmer-base-color: var(--plus-working);
  --text-shimmer-peak-color: var(--plus-working-peak);
}
${v} ${d}[data-status="working"] > span:first-child > span:last-child::before {
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
  ${v} ${d}[data-status="working"] > span:first-child > span:last-child::before {
    animation: none;
  }
}
${v} ${d} > span,
${v} ${d} > span:first-child > span {
  transition: opacity 150ms;
}
${se}:not([${S}]) > span,
${se}[${S}] > span:not(:first-child),
${se}[${S}] > span:first-child > span:last-child {
  opacity: 0.6;
}
/* In a project group the heading names the project, so rows drop their project line and show the time beside the
   title: the first line dissolves into the row's grid, keeping only its last part, the time or status. */
${d}[${S}] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "title status";
  column-gap: 8px;
}
${d}[${S}] > span:first-child {
  display: contents;
}
${d}[${S}] > span:first-child > span:not(:last-child) {
  display: none;
}
${d}[${S}] > span:first-child > span:last-child {
  grid-area: status;
}
${d}[${S}] > span:nth-of-type(2) {
  grid-area: title;
}
${d}[${S}] > span:nth-of-type(3) {
  grid-column: 1 / -1;
}
/* The same space before every project; a group's heading takes its own 28px on top of it. */
${d}[${Q}] {
  margin-top: 16px;
}
${d}[${k}] {
  position: relative;
  margin-top: 28px;
}
${d}[${k}][${Q}] {
  margin-top: 44px;
}
${d}[${k}]::before {
  content: attr(${k});
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
${d}[${k}] > span:first-child > span:first-child {
  display: flex;
  position: absolute;
  inset-inline-start: 6px;
  bottom: calc(100% + 8px);
  pointer-events: none;
}
/* The heading's + button, at the far end of its 24px line, its icon in line with the times of the rows below. */
${d}[${k}] > [${I}] {
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
${d}[${k}] > [${I}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
${d}[${k}]:not([data-state="active"]):has(> [${I}]:hover) {
  background-color: transparent;
}
`,H=e=>e?Array.from(e.children).filter(t=>t.matches(d)):[],at=e=>e.querySelector(":scope > span:first-child > span.truncate")?.textContent?.trim(),Re=e=>{e.style.removeProperty("order"),e.style.length===0&&e.removeAttribute("style"),e.removeAttribute(k),e.removeAttribute(Q),e.removeAttribute(S)};function it(e){const t=e?"open":"closed";document.querySelectorAll(ue).forEach(n=>{const s=n.firstElementChild;!s||s.matches(d)||(L(n,w,t),L(s,x,""),L(s,pe,String(H(n).length)),L(s,"role","button"),L(s,"tabindex","0"),L(s,"aria-expanded",String(e)))})}function ct(e){const t=o=>o.target instanceof Element?o.target.closest(`${ue} > [${x}]`):null,n=o=>{t(o)&&e()},s=o=>{o.key!=="Enter"&&o.key!==" "||!t(o)||(o.preventDefault(),e())};return document.addEventListener("click",n),document.addEventListener("keydown",s),()=>{document.removeEventListener("click",n),document.removeEventListener("keydown",s)}}const we=(e,t,n=[])=>{const s=[...n,...e];if(!t&&n.length===0)return s.forEach(Re);const o=new Map;s.forEach(a=>{const c=t&&at(a)||a;o.set(c,[...o.get(c)??[],a])});let i=0;Array.from(o).forEach(([a,c],g)=>{const r=t&&typeof a=="string"&&c.length>1;c.forEach((p,C)=>{i+=1,p.style.order!==String(i)&&(p.style.order=String(i)),U(p,k,r&&C===0?a:void 0),U(p,S,r?"":void 0),U(p,Q,t&&g>0&&C===0?"":void 0)})})};function Me(e,t){document.querySelectorAll(v).forEach(n=>{const s=n.querySelector(`:scope > ${de}`),o=n.querySelector(`:scope > ${W} > div`),i=new Set;t?(L(n,O,""),n.querySelector(`:scope > ${W} > button[aria-expanded="false"]`)?.click(),we(H(s),e,H(o)),i.add(s).add(o)):n.removeAttribute(O),new Set(Array.from(n.querySelectorAll(d),a=>a.parentElement)).forEach(a=>{if(i.has(a))return;const c=a.getAttribute(w)==="closed",g=H(a).filter(r=>!c||r.getAttribute("data-state")==="active");H(a).filter(r=>!g.includes(r)).forEach(Re),we(g,e)})})}function lt(e){document.querySelectorAll(`${d} > [${I}]`).forEach(t=>{t.parentElement.getAttribute(k)!==t.getAttribute(I)&&t.remove()}),document.querySelectorAll(`${d}[${k}]`).forEach(t=>{t.querySelector(`:scope > [${I}]`)||t.append(e(t.getAttribute(k)))})}function dt({name:e,label:t,icon:n,onSelect:s}){const o=document.createElement("div"),i=a=>{a.preventDefault(),a.stopPropagation(),s()};return o.setAttribute(I,e),o.setAttribute("role","button"),o.setAttribute("tabindex","0"),o.setAttribute("aria-label",t),o.setAttribute("title",t),n(o),o.addEventListener("pointerdown",a=>a.stopPropagation()),o.addEventListener("click",i),o.addEventListener("keydown",a=>{(a.key==="Enter"||a.key===" ")&&i(a)}),o}function ut(){Me(!1,!1),document.querySelectorAll(`[${I}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${w}]`).forEach(e=>e.removeAttribute(w)),document.querySelectorAll(`[${x}]`).forEach(e=>{[x,pe,"role","tabindex","aria-expanded"].forEach(t=>e.removeAttribute(t))})}const pt="[data-timeline-virtual-content]",Oe='[data-slot="session-turn-message-container"]',V="data-plus-final",ae=`[${V}] > [data-component="session-turn"] > ${Oe}`,he="--plus-label-half";function ht(e){return`
${ae} {
  --plus-gap: calc(var(${he}, ${e.length*3.75}px) + 12px);
  position: relative;
}
${ae}::before {
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
${ae}::after {
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
`}let ke=!1;function ft(e){const t=document.querySelector(Oe);if(ke||!e||!t||document.fonts?.status==="loading")return;const n=document.createElement("span");n.textContent=e,n.style.cssText="position: absolute; visibility: hidden; white-space: nowrap; font-size: 13px; font-weight: 440; letter-spacing: -0.04px",t.append(n);const s=n.getBoundingClientRect().width;n.remove(),s&&(document.documentElement.style.setProperty(he,`${s/2}px`),ke=!0)}const M=e=>e?.frame?.getAttribute("data-timeline-row"),R=e=>e?.frame?.getAttribute("data-message-id"),ie=e=>M(e)==="AssistantPart"&&!!e.frame.querySelector('[data-component="text-part"]')&&!e.frame.querySelector('[data-component="tool-part-wrapper"], [data-timeline-part-ids]');function mt(e){document.querySelectorAll(pt).forEach(t=>{const n=Array.from(t.querySelectorAll(":scope > div > [data-timeline-key]"),r=>({wrapper:r,frame:r.querySelector(":scope > [data-index] > [data-timeline-row]"),top:parseFloat(r.style.top),height:parseFloat(r.style.height)})).sort((r,p)=>r.top-p.top),s=t.querySelector(':scope > [data-timeline-row="bottom-spacer"]'),o=r=>n[r+1]&&Math.abs(n[r+1].top-(n[r].top+n[r].height))<2?n[r+1]:void 0,i=r=>n[r-1]&&Math.abs(n[r].top-(n[r-1].top+n[r-1].height))<2?n[r-1]:void 0,a=r=>r===n.length-1&&!!s&&Math.abs(n[r].wrapper.getBoundingClientRect().bottom-s.getBoundingClientRect().top)<2,c=e?void 0:!0,g=r=>{const p=o(r);return p?p.frame?M(p)==="TurnGap"||M(p)==="UserMessage"||R(p)&&R(p)!==R(n[r])||M(p)==="TurnDiff"||M(p)==="TurnDivider"?!0:M(p)==="AssistantPart"||M(p)==="Thinking"?!1:c:c:n[r+1]||!a(r)?void 0:c};n.forEach((r,p)=>{if(!ie(r))return ce(r,!1);const C=g(p);if(C===void 0)return;if(!C){const A=o(p);ie(A)&&R(A)===R(r)||ce(r,!1);return}let q=p;for(;ie(i(q))&&R(i(q))===R(r);)q-=1;for(let A=q;A<=p;A+=1)ce(n[A],A===q&&n[A].frame.hasAttribute("data-timeline-spacing"))})})}const z=new Map,ce=(e,t)=>{!e.frame||e.frame.hasAttribute(V)===t||(U(e.frame,V,t?"":void 0),z.set(e.frame.parentElement,10))};function gt(){z.forEach((e,t)=>{if(!(t.isConnected&&Math.abs(t.offsetHeight-parseFloat(t.parentElement.style.height))>=1)||e===0)return z.delete(t);z.set(t,e-1),t.style.paddingBottom="1px",requestAnimationFrame(()=>t.style.removeProperty("padding-bottom"))})}const bt=()=>z.size>0;function vt(){document.querySelectorAll(`[${V}]`).forEach(e=>e.removeAttribute(V)),document.documentElement.style.removeProperty(he)}const je=60*1e3,yt=60*je,Ae="tab.new",le="sidecar";function $t(e){const t=Ne(e.options),{shelf:n,groups:s,working:o}=e.stores,i=(l,b)=>m=>be.insert(m,()=>G.createComponent(e.ui.Icon,{name:l,...b})),a=()=>{const l=e.sessions.current();try{const b=l?.server.data.session;return!!l&&(b.status(l.id)==="running"||b.pending.list(l.id).some(m=>m.type!=="synthetic"))}catch{return!1}},c=()=>n.update(l=>{l.archivedOpen=!l.archivedOpen}),g=async l=>{const m=(await e.client.project.list()).filter(f=>(f.name||f.canonical.split("/").pop())===l).toSorted((f,N)=>N.time.active-f.time.active)[0];if(!m)return e.layout.project(le,e.t("session.new"));e.layout.draft({server:le,directory:m.canonical,prompt:""})},r=l=>dt({name:l,label:e.t("session.newIn",{project:l}),icon:i("plus",{size:"small"}),onSelect:()=>{g(l).catch(()=>e.toast.show({title:e.t("session.failed",{project:l})}))}}),p=async(l,b)=>{const m={directory:l};let{data:f}=await e.client.shell.create({location:m,command:b,timeout:je});try{for(;f.status==="running";)await new Promise(Z=>setTimeout(Z,100)),f=(await e.client.shell.get({id:f.id,location:m})).data;const{data:N}=await e.client.shell.output({id:f.id,location:m});return{ok:f.exit===0,output:N.output}}finally{e.client.shell.remove({id:f.id,location:m}).catch(()=>{})}},C=async l=>{const b=await Ye(l,()=>e.client.project.list()),m=b&&await p(b,_e);return m?.ok?{directory:b,...Xe(m.output)}:void 0},q=async(l,b)=>{const m=f=>e.toast.show({variant:"error",title:e.t("branch.failed",{branch:b}),description:f.trim()});try{const f=await p(l,Qe(b));if(!f.ok)return m(f.output);const N=e.servers.get(le)?.data;N?.location.vcs.invalidate({directory:l}),await N?.location.vcs.sync({directory:l})}catch(f){m(String(f?.message??f))}},A=(l,b)=>G.createRoot(m=>{const[f,N]=G.createSignal(),[Z,me]=G.createSignal(!1);let ee=!1;const te=()=>{ee||(ee=!0,C(b).catch(()=>{}).then(y=>N(y??null)).finally(()=>{ee=!1}))},Pe=async y=>{const{directory:D,current:ne}=f();y!==ne&&(me(!0),await q(D,y),me(!1),te())},ge=(y,D=y)=>({label:D,onSelect:()=>{Pe(y)}}),Be=()=>{const y=f();if(y===void 0)return[{label:e.t("branch.loading"),disabled:!0}];if(y===null)return[{label:e.t("branch.unlisted"),disabled:!0}];const D=y.local.map(oe=>ge(oe));if(y.remote.length===0)return D;const ne=y.remote.map(({name:oe,ref:Ue})=>ge(oe,Ue));return[...D,{type:"separator"},{type:"group",label:e.t("branch.remote"),items:ne}]};return l.addEventListener("pointerenter",te),l.addEventListener("focusin",te),be.insert(l,()=>G.createComponent(e.ui.Menu,{label:e.t("branch.switch"),trigger:"button",placement:"bottom-start",get disabled(){return Z()},get items(){return Be()}})),m}),_=()=>{it(n.value.archivedOpen),Me(s.value.enabled,o.value.inline),lt(r),Ke(A),Je(),tt(t.hideAgent),nt(fe),ft(t.responseLabel),gt(),mt(a()),bt()&&!u&&(u=setTimeout(()=>{u=0,h()},300))};let T=0,u=0;const h=()=>{T||(T=requestAnimationFrame(()=>{T=0,_()}))},E=new MutationObserver(h);E.observe(document.body,{childList:!0,subtree:!0});const fe=new MutationObserver(h);document.addEventListener("scrollend",h,!0);const De=ct(c);return $.createKeyed(()=>`${n.value.archivedOpen}:${s.value.enabled}:${o.value.inline}:${a()}`,_),e.add($.Style,st),e.add($.Style,Ve),e.add($.Style,et(t)),e.add($.Style,ht(t.responseLabel)),e.add($.Slot,{at:"session.location.menu",order:100,render:l=>rt({label:e.t("session.new"),icon:i("edit",{class:"shrink-0 text-v2-icon-icon-muted"}),shortcut:e.keybinds.keybind(Ae).join(""),onSelect:()=>{e.commands.run(Ae)||e.layout.draft({server:l.session.server.id,directory:l.session.directory,prompt:""})}})}),e.add($.Command,()=>({id:"toggle-archived",title:e.t(n.value.archivedOpen?"archived.hide":"archived.show"),keywords:"archive archived settled sessions sidebar inbox",run:c})),e.add($.Command,()=>({id:"toggle-groups",title:e.t(s.value.enabled?"groups.off":"groups.on"),keywords:"group project projects folders sessions sidebar inbox",run:()=>s.update(l=>{l.enabled=!l.enabled})})),e.add($.Command,()=>({id:"toggle-working",title:e.t(o.value.inline?"working.section":"working.inline"),keywords:"working running busy section shelf sessions sidebar inbox",run:()=>o.update(l=>{l.inline=!l.inline})})),()=>{E.disconnect(),fe.disconnect(),cancelAnimationFrame(T),clearTimeout(u),document.removeEventListener("scrollend",h,!0),De(),ut(),Ze(),ot(),vt()}}function wt(e){const{archiveAfterHours:t}=Ne(e.options);if(t>0)return He(e,t*yt)}const kt=$.Plugin.define({stores:{shelf:$.Store.global(P.Schema.Struct({archivedOpen:P.Schema.Boolean}),{archivedOpen:!1}),groups:$.Store.global(P.Schema.Struct({enabled:P.Schema.Boolean}),{enabled:!0}),working:$.Store.global(P.Schema.Struct({inline:P.Schema.Boolean}),{inline:!0})},i18n:{en:{"archived.show":"Show archived sessions","archived.hide":"Hide archived sessions","groups.on":"Group sessions by project","groups.off":"Stop grouping sessions by project","working.inline":"Show working sessions in the list","working.section":"Show working sessions in their own section","session.new":"New session","session.newIn":"New session in {{project}}","session.failed":"Could not start a session in {{project}}","branch.switch":"Switch branch","branch.loading":"Loading…","branch.unlisted":"Could not list the branches","branch.remote":"Remote","branch.failed":"Could not switch to {{branch}}"}},setup:$t,main:wt});exports.default=kt;
