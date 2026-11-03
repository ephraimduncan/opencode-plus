"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const x=require("@opencode/plugin/gui"),z=require("effect"),F=require("solid-js"),ie=require("solid-js/web"),_e=require("@opencode/client/solid"),X=60*1e3,ce=200,ke=["session.inbox.enqueued","session.execution.started","session.unarchived"],Ae=Symbol.for("opencode-plus.archive");function Je(e,t,n,o){const{created:a,updated:s,busy:r,idle:c,archived:g}=e.time;if(g!==void 0||e.parentID||r!==void 0&&(c===void 0||r>c))return!1;const i=Math.max(a,r??0,c??0);return(Number(e.metadata?.[o])||0)>=i||t-s<2*X?!1:t-i>=n}function Ye(e,t){const n=`${e.id}.keptAt`,o=Date.now(),a=new AbortController,s=a.signal,r=p=>e.log.write("error",`${e.id}: ${p?.stack??p}`),c=async()=>{const p=[];let v=await e.client.session.list({parentID:null,archived:!1,limit:ce});for(;;){if(p.push(...v.data),v.data.length<ce||!v.cursor.next)return p;v=await e.client.session.list({cursor:v.cursor.next,limit:ce})}};let g=!1;const i=async()=>{if(!g){g=!0;try{const p=Date.now(),v=(await c()).filter(l=>Je(l,p,t,n));for(const l of v)await e.client.session.update({sessionID:l.id,archived:!0}),e.log.write("info",`${e.id}: archived ${l.id} "${l.title??""}"`)}finally{g=!1}}},u=async p=>{if(!ke.includes(p.type)||p.created<o-X||p.type==="session.inbox.enqueued"&&p.data.item.type!=="user")return;const v=await e.client.session.get({sessionID:p.data.sessionID}),l=v.time.archived;if(p.type!=="session.unarchived"){if(l===void 0||p.created<=l)return;await e.client.session.update({sessionID:v.id,archived:!1}),e.log.write("info",`${e.id}: unarchived ${v.id} on ${p.type}`);return}l!==void 0||(Number(v.metadata?.[n])||0)>=p.created||await e.client.session.update({sessionID:v.id,metadata:{...v.metadata,[n]:p.created}})},b=async()=>{for(;!s.aborted;){try{const p=e.client.event.subscribe({types:ke},{signal:s});for await(const v of p)u(v).catch(r)}catch(p){s.aborted||r(p)}s.aborted||await new Promise(p=>setTimeout(p,5e3))}},h=()=>{i().catch(r)},m=setTimeout(h,X),A=setInterval(h,10*X),q=()=>{s.aborted||(clearTimeout(m),clearInterval(A),a.abort())};return globalThis[Ae]?.(),globalThis[Ae]=q,e.signal.addEventListener("abort",q,{once:!0}),b(),q}const M=(e,t,n)=>{e.getAttribute(t)!==n&&e.setAttribute(t,n)},H=(e,t,n)=>n===void 0?e.removeAttribute(t):M(e,t,n),Ie='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5L8 9.5L11.5 6.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',qe='[data-slot="new-session-composer"]',Xe='[data-slot="new-session-location-path"]',Qe=["branch","new-branch"].map(e=>`${qe} use[href="#opencode-v2-icon-${e}"]`).join(", "),U="data-plus-branch",J="data-plus-branch-trigger",Q="data-plus-branch-menu",Ne="data-plus-branch-current",Ze='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M3.53564 8.17857L6.39279 11.75L12.4642 4.25" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',et=`
[${U}] {
  position: relative;
  border-radius: var(--radius-sm);
}
[${U}]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline: -2px -4px;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(Ie)}") center / 16px no-repeat;
}
[${U}]:is(:hover, :has(:focus-visible), :has([data-expanded])) {
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${J}] {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
[${J}] > button {
  width: 100%;
  height: 100%;
  opacity: 0;
}
[${Q}] {
  max-height: min(320px, var(--kb-popper-content-available-height, 320px));
  overflow-y: auto;
}
[${Q}] [data-component="menu-v2-item"]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
}
[${Q}] [${Ne}]::after {
  background-color: var(--menu-v2-icon);
  mask: url("data:image/svg+xml,${encodeURIComponent(Ze)}") center / 14px no-repeat;
}
`,tt="git branch --all --no-color --no-column --sort=-committerdate",G=new Map;function nt(e){G.forEach((t,n)=>{n.isConnected||(t(),G.delete(n))}),document.querySelectorAll(Qe).forEach(t=>{const n=t.closest("svg").parentElement;if(G.has(n))return;const o=document.createElement("div");o.setAttribute(J,""),n.setAttribute(U,""),n.append(o),G.set(n,e(o,n))})}function ot(){document.querySelectorAll(`[${J}] > [aria-controls]`).forEach(e=>{const t=document.getElementById(e.getAttribute("aria-controls"));if(!t)return;const n=e.closest(`[${U}]`).querySelector(":scope > span").textContent.trim();M(t,Q,""),t.querySelectorAll('[data-component="menu-v2-item"]').forEach(o=>{H(o,Ne,o.textContent.trim()===n?"":void 0)})})}async function rt(e,t){const n=e.closest(qe)?.querySelector(Xe)?.textContent??"";if(!n.includes("…"))return n||void 0;const[o,a]=n.split("…");return(await t()).flatMap(s=>[s.canonical,...s.sandboxes]).find(s=>s.startsWith(o)&&s.endsWith(a))}function at(e){const t=new Set,n=[],o=new Map;let a;for(const r of e.split(/\r?\n/)){const c=r.slice(2).trim();if(!(!c||c.startsWith("(")||c.includes(" -> "))){if(c.startsWith("remotes/")){const g=c.slice(8),i=g.slice(g.indexOf("/")+1);o.has(i)||o.set(i,g);continue}t.add(c),r.startsWith("*")&&(a=c),r.startsWith("+")||n.push(c)}}const s=Array.from(o,([r,c])=>({name:r,ref:c})).filter(({name:r})=>!t.has(r));return{current:a,local:n,remote:s}}const st=e=>`git switch ${/^[\w./-]+$/.test(e)?e:`'${e.replaceAll("'","'\\''")}'`}`;function it(){G.forEach(e=>e()),G.clear(),document.querySelectorAll(`[${J}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${U}]`).forEach(e=>e.removeAttribute(U))}const Re='[data-slot="composer-controls"]',Me=`${Re} > div > [data-component="tooltip-v2-trigger"]`,Oe='[data-action="composer-model"]',De=`${Me}:has(~ [data-component="tooltip-v2-trigger"] ${Oe})`,je=`${Me}:has(${Oe}) ~ [data-component="tooltip-v2-trigger"]`,Z="data-plus-hidden-agent",ee="data-plus-variant-menu";function ct({lowercaseVariants:e}){return`
${De}[${Z}] {
  display: none;
}
${e?`${je} .capitalize,
[${ee}] .capitalize {
  text-transform: lowercase;
}`:""}
`}function lt(e){document.querySelectorAll(De).forEach(t=>{const n=e!==!1&&t.textContent.trim().toLowerCase()===e.toLowerCase();H(t,Z,n?"":void 0)}),document.querySelectorAll(`${je} [aria-controls]`).forEach(t=>{const n=document.getElementById(t.getAttribute("aria-controls"));n&&M(n,ee,"")})}const Ee=new WeakSet;function dt(e){document.querySelectorAll(Re).forEach(t=>{Ee.has(t)||(Ee.add(t),e.observe(t,{subtree:!0,characterData:!0}))})}function ut(){document.querySelectorAll(`[${Z}]`).forEach(e=>e.removeAttribute(Z)),document.querySelectorAll(`[${ee}]`).forEach(e=>e.removeAttribute(ee))}function pt({label:e,icon:t,shortcut:n,onSelect:o}){const a=document.createElement("hr");a.setAttribute("data-slot","menu-v2-separator");const s=document.createElement("div");s.setAttribute("role","menuitem"),s.setAttribute("data-component","menu-v2-item");const r=document.createElement("span");if(r.setAttribute("data-slot","menu-v2-item-content"),t(r),r.append(e),s.append(r),n){const c=document.createElement("span");c.setAttribute("data-slot","menu-v2-item-shortcut"),c.textContent=n,s.append(c)}return s.addEventListener("pointerenter",()=>s.setAttribute("data-highlighted","")),s.addEventListener("pointerleave",()=>s.removeAttribute("data-highlighted")),s.addEventListener("click",()=>{s.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:!0})),o()}),queueMicrotask(()=>{const c=s.closest('[role="menu"]')?.querySelector("[data-appearance]")?.getAttribute("data-appearance");c&&(s.setAttribute("data-appearance",c),a.setAttribute("data-appearance",c))}),[a,s]}function Pe(e={}){const t=e.archiveAfterHours;return{archiveAfterHours:typeof t=="number"&&t>=0?t:12,hideAgent:typeof e.hideAgent=="string"||e.hideAgent===!1?e.hideAgent:"build",responseLabel:typeof e.responseLabel=="string"?e.responseLabel:e.responseLabel===!1?"":"Response",lowercaseVariants:e.lowercaseVariants!==!1}}const E='[data-slot="sidebar-inbox"]',ge='[data-slot="sidebar-inbox-scroll"]',K='[data-slot="sidebar-inbox-working"]',ve=`${ge} > div.pt-3`,f='[data-slot="sidebar-inbox-item"]',T="data-plus-shelf",R="data-plus-toggle",be="data-plus-count",I="data-plus-group",te="data-plus-gap",N="data-plus-member",B="data-plus-inline",O="data-plus-add",le=`${E} ${f}[data-status="ready"]:not([data-state="active"], :hover:not(:has([${O}]:hover)), :focus-visible, [${T}] > *)`,ht=`
${ve} {
  order: 100000;
  margin-top: auto;
}
${E}[${B}] {
  overflow-y: auto;
  gap: 1px;
  padding-bottom: 4px;
}
[${B}] > ${ge},
[${B}] > ${K},
[${B}] > ${K} > div {
  display: contents;
}
[${B}] > ${K} > button {
  display: none;
}
[${T}] > [${R}] {
  border-radius: 6px;
}
[${T}] > [${R}]:hover {
  color: var(--color-v2-text-text-base);
}
[${T}] > [${R}]:focus-visible {
  outline: none;
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${T}] > [${R}]::before {
  content: attr(${be});
  order: 1;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-faint);
}
[${T}] > [${R}]::after {
  content: "";
  order: 2;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(Ie)}") center / 16px no-repeat;
}
[${T}="closed"] > [${R}]::after {
  rotate: -90deg;
}
[${T}="closed"] > [${R}]:dir(rtl)::after {
  rotate: 90deg;
}
[${T}="closed"] > ${f}:not([data-state="active"]) {
  display: none;
}
${E} ${f}[data-status="working"] {
  opacity: 1;
}
${E} ${f}[data-status="working"] > span:nth-of-type(2) {
  color: var(--color-v2-text-text-base);
}
/* T3 Code's Working colors: sky-600 text and a sky-500 pulsing dot, or sky-300 at 80% in dark mode. */
${E} {
  --plus-working: oklch(58.8% 0.158 241.966);
  --plus-working-dot: oklch(68.5% 0.169 237.323);
  --plus-working-peak: oklch(74.6% 0.16 232.661);
}
[data-color-scheme="dark"] ${E} {
  --plus-working: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-dot: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-peak: oklch(95.1% 0.026 236.824);
}
${E} ${f}[data-status="working"] > span:first-child > span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--plus-working);
}
${E} ${f}[data-status="working"] > span:first-child > span:last-child > span {
  color: inherit;
}
${E} ${f}[data-status="working"] [data-component="text-shimmer"] {
  --text-shimmer-base-color: var(--plus-working);
  --text-shimmer-peak-color: var(--plus-working-peak);
}
${E} ${f}[data-status="working"] > span:first-child > span:last-child::before {
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
  ${E} ${f}[data-status="working"] > span:first-child > span:last-child::before {
    animation: none;
  }
}
${E} ${f} > span,
${E} ${f} > span:first-child > span {
  transition: opacity 150ms;
}
${le}:not([${N}]) > span,
${le}[${N}] > span:not(:first-child),
${le}[${N}] > span:first-child > span:last-child {
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
${f}[${te}] {
  margin-top: 16px;
}
${f}[${I}] {
  position: relative;
  margin-top: 28px;
}
${f}[${I}][${te}] {
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
`,V=e=>e?Array.from(e.children).filter(t=>t.matches(f)):[],ft=e=>e.querySelector(":scope > span:first-child > span.truncate")?.textContent?.trim(),Be=e=>{e.style.removeProperty("order"),e.style.length===0&&e.removeAttribute("style"),e.removeAttribute(I),e.removeAttribute(te),e.removeAttribute(N)};function mt(e){const t=e?"open":"closed";document.querySelectorAll(ve).forEach(n=>{const o=n.firstElementChild;!o||o.matches(f)||(M(n,T,t),M(o,R,""),M(o,be,String(V(n).length)),M(o,"role","button"),M(o,"tabindex","0"),M(o,"aria-expanded",String(e)))})}function gt(e){const t=a=>a.target instanceof Element?a.target.closest(`${ve} > [${R}]`):null,n=a=>{t(a)&&e()},o=a=>{a.key!=="Enter"&&a.key!==" "||!t(a)||(a.preventDefault(),e())};return document.addEventListener("click",n),document.addEventListener("keydown",o),()=>{document.removeEventListener("click",n),document.removeEventListener("keydown",o)}}const xe=(e,t,n=[])=>{const o=[...n,...e];if(!t&&n.length===0)return o.forEach(Be);const a=new Map;o.forEach(r=>{const c=t&&ft(r)||r;a.set(c,[...a.get(c)??[],r])});let s=0;Array.from(a).forEach(([r,c],g)=>{const i=t&&typeof r=="string"&&c.length>1;c.forEach((u,b)=>{s+=1,u.style.order!==String(s)&&(u.style.order=String(s)),H(u,I,i&&b===0?r:void 0),H(u,N,i?"":void 0),H(u,te,t&&g>0&&b===0?"":void 0)})})};function Ue(e,t){document.querySelectorAll(E).forEach(n=>{const o=n.querySelector(`:scope > ${ge}`),a=n.querySelector(`:scope > ${K} > div`),s=new Set;t?(M(n,B,""),n.querySelector(`:scope > ${K} > button[aria-expanded="false"]`)?.click(),xe(V(o),e,V(a)),s.add(o).add(a)):n.removeAttribute(B),new Set(Array.from(n.querySelectorAll(f),r=>r.parentElement)).forEach(r=>{if(s.has(r))return;const c=r.getAttribute(T)==="closed",g=V(r).filter(i=>!c||i.getAttribute("data-state")==="active");V(r).filter(i=>!g.includes(i)).forEach(Be),xe(g,e)})})}function vt(e){document.querySelectorAll(`${f} > [${O}]`).forEach(t=>{t.parentElement.getAttribute(I)!==t.getAttribute(O)&&t.remove()}),document.querySelectorAll(`${f}[${I}]`).forEach(t=>{t.querySelector(`:scope > [${O}]`)||t.append(e(t.getAttribute(I)))})}function bt({name:e,label:t,icon:n,onSelect:o}){const a=document.createElement("div"),s=r=>{r.preventDefault(),r.stopPropagation(),o()};return a.setAttribute(O,e),a.setAttribute("role","button"),a.setAttribute("tabindex","0"),a.setAttribute("aria-label",t),a.setAttribute("title",t),n(a),a.addEventListener("pointerdown",r=>r.stopPropagation()),a.addEventListener("click",s),a.addEventListener("keydown",r=>{(r.key==="Enter"||r.key===" ")&&s(r)}),a}function yt(){Ue(!1,!1),document.querySelectorAll(`[${O}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${T}]`).forEach(e=>e.removeAttribute(T)),document.querySelectorAll(`[${R}]`).forEach(e=>{[R,be,"role","tabindex","aria-expanded"].forEach(t=>e.removeAttribute(t))})}const $t="[data-timeline-virtual-content]",We='[data-slot="session-turn-message-container"]',Y="data-plus-final",de=`[${Y}] > [data-component="session-turn"] > ${We}`,ye="--plus-label-half";function wt(e){return`
${de} {
  --plus-gap: calc(var(${ye}, ${e.length*3.75}px) + 12px);
  position: relative;
}
${de}::before {
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
${de}::after {
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
`}let Se=!1;function kt(e){const t=document.querySelector(We);if(Se||!e||!t||document.fonts?.status==="loading")return;const n=document.createElement("span");n.textContent=e,n.style.cssText="position: absolute; visibility: hidden; white-space: nowrap; font-size: 13px; font-weight: 440; letter-spacing: -0.04px",t.append(n);const o=n.getBoundingClientRect().width;n.remove(),o&&(document.documentElement.style.setProperty(ye,`${o/2}px`),Se=!0)}const P=e=>e?.frame?.getAttribute("data-timeline-row"),j=e=>e?.frame?.getAttribute("data-message-id"),ue=e=>P(e)==="AssistantPart"&&!!e.frame.querySelector('[data-component="text-part"]')&&!e.frame.querySelector('[data-component="tool-part-wrapper"], [data-timeline-part-ids]');function At(e){document.querySelectorAll($t).forEach(t=>{const n=Array.from(t.querySelectorAll(":scope > div > [data-timeline-key]"),i=>({wrapper:i,frame:i.querySelector(":scope > [data-index] > [data-timeline-row]"),top:parseFloat(i.style.top),height:parseFloat(i.style.height)})).sort((i,u)=>i.top-u.top),o=t.querySelector(':scope > [data-timeline-row="bottom-spacer"]'),a=i=>n[i+1]&&Math.abs(n[i+1].top-(n[i].top+n[i].height))<2?n[i+1]:void 0,s=i=>n[i-1]&&Math.abs(n[i].top-(n[i-1].top+n[i-1].height))<2?n[i-1]:void 0,r=i=>i===n.length-1&&!!o&&Math.abs(n[i].wrapper.getBoundingClientRect().bottom-o.getBoundingClientRect().top)<2,c=e?void 0:!0,g=i=>{const u=a(i);return u?u.frame?P(u)==="TurnGap"||P(u)==="UserMessage"||j(u)&&j(u)!==j(n[i])||P(u)==="TurnDiff"||P(u)==="TurnDivider"?!0:P(u)==="AssistantPart"||P(u)==="Thinking"?!1:c:c:n[i+1]||!r(i)?void 0:c};n.forEach((i,u)=>{if(!ue(i))return pe(i,!1);const b=g(u);if(b===void 0)return;if(!b){const m=a(u);ue(m)&&j(m)===j(i)||pe(i,!1);return}let h=u;for(;ue(s(h))&&j(s(h))===j(i);)h-=1;for(let m=h;m<=u;m+=1)pe(n[m],m===h&&n[m].frame.hasAttribute("data-timeline-spacing"))})})}const _=new Map,pe=(e,t)=>{!e.frame||e.frame.hasAttribute(Y)===t||(H(e.frame,Y,t?"":void 0),_.set(e.frame.parentElement,10))};function Et(){_.forEach((e,t)=>{if(!(t.isConnected&&Math.abs(t.offsetHeight-parseFloat(t.parentElement.style.height))>=1)||e===0)return _.delete(t);_.set(t,e-1),t.style.paddingBottom="1px",requestAnimationFrame(()=>t.style.removeProperty("padding-bottom"))})}const xt=()=>_.size>0;function St(){document.querySelectorAll(`[${Y}]`).forEach(e=>e.removeAttribute(Y)),document.documentElement.style.removeProperty(ye)}const Lt='[data-component="tooltip-v2-trigger"] > button:not([aria-haspopup]):has([data-component="progress-circle"])',k="data-plus-usage",Le="plus-usage-card",me="data-plus-usage-hover",Ct=50,Tt=100,It=4,qt=`
:root[${me}] [data-component="tooltip-v2"]:not([data-force-open="true"]) {
  display: none;
}
[${k}] {
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
[${k}]:dir(rtl) {
  transform-origin: top left;
}
[${k}] [data-part="row"] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
  white-space: nowrap;
}
[${k}] [data-part="row"] > :last-child {
  margin-inline-start: auto;
}
[${k}] :is([data-part="value"], [data-part="percent"]) {
  color: var(--v2-text-text-base);
}
[${k}] [data-part="percent"] {
  font-weight: 530;
}
[${k}] [data-part="bar"] {
  display: flex;
  height: 8px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--v2-background-bg-layer-03);
}
[${k}] [data-part="bar"] > span {
  box-sizing: border-box;
  min-width: 3px;
}
/* A line in the card's color between kinds, as in Cursor's bar. */
[${k}] [data-part="bar"] > span + span {
  border-inline-start: 1px solid var(--v2-background-bg-layer-01);
}
[${k}] [data-part="legend"] {
  display: flex;
  flex-direction: column;
}
[${k}] [data-part="dot"] {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
[${k}] hr {
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
  [${k}] {
    animation: none;
  }
}
:root[data-motion="reduce"] [${k}] {
  animation: none;
}
`;function Nt(e){let t,n,o=0;const a=document.documentElement,s=(l,S)=>{clearTimeout(o),o=setTimeout(l,S)},r=l=>l.target instanceof Element?l.target.closest(Lt):null,c=l=>l instanceof Node&&!!(t?.contains(l)||n?.card.contains(l)),g=()=>{if(!t.isConnected)return;const l=document.createElement("div"),S=t.closest("[data-theme]")?.getAttribute("data-theme");l.id=Le,l.setAttribute(k,""),l.setAttribute("role","tooltip"),S&&l.setAttribute("data-theme",S),n={card:l,stop:e(l)},document.body.append(l),Dt(l,t),t.setAttribute("aria-describedby",Le)},i=()=>{clearTimeout(o),n?.stop(),n?.card.remove(),n=void 0,t?.removeAttribute("aria-describedby")},u=l=>{if(l===t){n&&clearTimeout(o);return}b(),t=l,a.setAttribute(me,""),s(g,Ct)},b=()=>{i(),t=void 0,a.removeAttribute(me)},h=l=>{if(l.pointerType==="touch")return;const S=r(l);if(S)return u(S);if(n?.card.contains(l.target))return clearTimeout(o);t&&!t.isConnected&&b()},m=l=>{!t||c(l.relatedTarget)||!c(l.target)||(n?s(b,Tt):b())},A=l=>{t?.contains(l.target)&&i()},q=l=>{l.key==="Escape"&&i()},p=l=>{const S=r(l);S?.matches(":focus-visible")&&u(S)},v=l=>{t?.contains(l.target)&&!c(l.relatedTarget)&&b()};return document.addEventListener("pointerover",h),document.addEventListener("pointerout",m),document.addEventListener("pointerdown",A,!0),document.addEventListener("keydown",q),document.addEventListener("focusin",p),document.addEventListener("focusout",v),()=>{document.removeEventListener("pointerover",h),document.removeEventListener("pointerout",m),document.removeEventListener("pointerdown",A,!0),document.removeEventListener("keydown",q),document.removeEventListener("focusin",p),document.removeEventListener("focusout",v),b()}}function Rt(e){const t=e.server.data,n=e.directory?{directory:e.directory}:void 0,o=t.session.get(e.id),a=t.session.message.list(e.id),s=_e.lastAssistantWithUsage(a,o?.revert?.messageID),r=s?.tokens,c=r?r.input+r.output+r.reasoning+r.cache.read+r.cache.write:0,g=s?Ce(t,n,s.model)?.limit.context:void 0,i=t.session.cost(e.id),u=o?.model??a.findLast(m=>m.type==="assistant")?.model,b=u?Ce(t,n,u):void 0,h=!!b&&b.cost.every(m=>!m.input&&!m.output&&!m.cache.read&&!m.cache.write);return{total:c,tokens:r,limit:g||void 0,percent:g?Math.round(c/g*100):void 0,cost:i>0||!h?i:void 0}}function Mt({total:e,tokens:t,limit:n,percent:o,cost:a},s,r){const c=h=>new Intl.NumberFormat(r,{notation:"compact",maximumFractionDigits:0}).format(h).toLocaleLowerCase(r),g=t?Ot.map(h=>({...h,value:h.value(t)})).filter(h=>h.value>0):[],i=Math.max(n??0,e),u=C("span",void 0,n?`${c(e)} / ${c(n)} `:c(e));n&&u.append(C("span","percent",`(${o}%)`));const b=[he([C("span",void 0,s("usage.window")),u])];if(i>0){const h=C("div","bar");h.setAttribute("aria-hidden","true"),g.forEach(m=>{const A=C("span");A.style.width=`${m.value/i*100}%`,A.style.background=m.color,h.append(A)}),b.push(h)}if(g.length){const h=C("div","legend");g.forEach(m=>{const A=C("span","dot");A.style.background=m.color,h.append(he([A,C("span",void 0,s(m.label)),C("span","value",m.value.toLocaleString(r))]))}),b.push(h)}if(a!==void 0){const h=new Intl.NumberFormat(r,{style:"currency",currency:"USD"});b.push(C("hr"),he([C("span",void 0,s("usage.cost")),C("span","value",h.format(a))]))}return b}const Ot=[{label:"usage.cacheRead",color:"var(--v2-avatar-border-blue)",value:e=>e.cache.read},{label:"usage.cacheWrite",color:"var(--v2-avatar-border-purple)",value:e=>e.cache.write},{label:"usage.input",color:"var(--v2-avatar-border-pink)",value:e=>e.input},{label:"usage.reasoning",color:"var(--v2-avatar-border-yellow)",value:e=>e.reasoning},{label:"usage.output",color:"var(--v2-avatar-border-green)",value:e=>e.output}],Ce=(e,t,n)=>{const o=e.location.provider.list(t),a=e.location.model.list(t);if(o?.some(s=>s.id===n.providerID))return a?.findLast(s=>s.providerID===n.providerID&&s.id===n.id&&s.status!=="deprecated")},C=(e,t,n)=>{const o=document.createElement(e);return t&&o.setAttribute("data-part",t),n!==void 0&&(o.textContent=n),o},he=e=>{const t=C("div","row");return t.append(...e),t},Dt=(e,t)=>{const n=t.getBoundingClientRect(),o=e.offsetWidth,a=getComputedStyle(t).direction==="rtl"?n.left:n.right-o;e.style.top=`${n.bottom+It}px`,e.style.left=`${Math.max(8,Math.min(a,innerWidth-o-8))}px`},ze=60*1e3,jt=60*ze,Te="tab.new",fe="sidecar";function Pt(e){const t=Pe(e.options),{shelf:n,groups:o,working:a}=e.stores,s=(d,w)=>y=>ie.insert(y,()=>F.createComponent(e.ui.Icon,{name:d,...w})),r=()=>{const d=e.sessions.current();try{const w=d?.server.data.session;return!!d&&(w.status(d.id)==="running"||w.pending.list(d.id).some(y=>y.type!=="synthetic"))}catch{return!1}},c=()=>n.update(d=>{d.archivedOpen=!d.archivedOpen}),g=async d=>{const y=(await e.client.project.list()).filter($=>($.name||$.canonical.split("/").pop())===d).toSorted(($,D)=>D.time.active-$.time.active)[0];if(!y)return e.layout.project(fe,e.t("session.new"));e.layout.draft({server:fe,directory:y.canonical,prompt:""})},i=d=>bt({name:d,label:e.t("session.newIn",{project:d}),icon:s("plus",{size:"small"}),onSelect:()=>{g(d).catch(()=>e.toast.show({title:e.t("session.failed",{project:d})}))}}),u=async(d,w)=>{const y={directory:d};let{data:$}=await e.client.shell.create({location:y,command:w,timeout:ze});try{for(;$.status==="running";)await new Promise(ne=>setTimeout(ne,100)),$=(await e.client.shell.get({id:$.id,location:y})).data;const{data:D}=await e.client.shell.output({id:$.id,location:y});return{ok:$.exit===0,output:D.output}}finally{e.client.shell.remove({id:$.id,location:y}).catch(()=>{})}},b=async d=>{const w=await rt(d,()=>e.client.project.list()),y=w&&await u(w,tt);return y?.ok?{directory:w,...at(y.output)}:void 0},h=async(d,w)=>{const y=$=>e.toast.show({variant:"error",title:e.t("branch.failed",{branch:w}),description:$.trim()});try{const $=await u(d,st(w));if(!$.ok)return y($.output);const D=e.servers.get(fe)?.data;D?.location.vcs.invalidate({directory:d}),await D?.location.vcs.sync({directory:d})}catch($){y(String($?.message??$))}},m=(d,w)=>F.createRoot(y=>{const[$,D]=F.createSignal(),[ne,$e]=F.createSignal(!1);let oe=!1;const re=()=>{oe||(oe=!0,b(w).catch(()=>{}).then(L=>D(L??null)).finally(()=>{oe=!1}))},He=async L=>{const{directory:W,current:ae}=$();L!==ae&&($e(!0),await h(W,L),$e(!1),re())},we=(L,W=L)=>({label:W,onSelect:()=>{He(L)}}),Ve=()=>{const L=$();if(L===void 0)return[{label:e.t("branch.loading"),disabled:!0}];if(L===null)return[{label:e.t("branch.unlisted"),disabled:!0}];const W=L.local.map(se=>we(se));if(L.remote.length===0)return W;const ae=L.remote.map(({name:se,ref:Ke})=>we(se,Ke));return[...W,{type:"separator"},{type:"group",label:e.t("branch.remote"),items:ae}]};return d.addEventListener("pointerenter",re),d.addEventListener("focusin",re),ie.insert(d,()=>F.createComponent(e.ui.Menu,{label:e.t("branch.switch"),trigger:"button",placement:"bottom-start",get disabled(){return ne()},get items(){return Ve()}})),y}),A=()=>{mt(n.value.archivedOpen),Ue(o.value.enabled,a.value.inline),vt(i),nt(m),ot(),lt(t.hideAgent),dt(S),kt(t.responseLabel),Et(),At(r()),xt()&&!p&&(p=setTimeout(()=>{p=0,v()},300))};let q=0,p=0;const v=()=>{q||(q=requestAnimationFrame(()=>{q=0,A()}))},l=new MutationObserver(v);l.observe(document.body,{childList:!0,subtree:!0});const S=new MutationObserver(v);document.addEventListener("scrollend",v,!0);const Fe=gt(c),Ge=Nt(d=>F.createRoot(w=>(ie.insert(d,()=>{const y=e.sessions.current();return y?Mt(Rt(y),e.t,e.locale.locale()):[]}),w)));return x.createKeyed(()=>`${n.value.archivedOpen}:${o.value.enabled}:${a.value.inline}:${r()}`,A),e.add(x.Style,ht),e.add(x.Style,et),e.add(x.Style,ct(t)),e.add(x.Style,wt(t.responseLabel)),e.add(x.Style,qt),e.add(x.Slot,{at:"session.location.menu",order:100,render:d=>pt({label:e.t("session.new"),icon:s("edit",{class:"shrink-0 text-v2-icon-icon-muted"}),shortcut:e.keybinds.keybind(Te).join(""),onSelect:()=>{e.commands.run(Te)||e.layout.draft({server:d.session.server.id,directory:d.session.directory,prompt:""})}})}),e.add(x.Command,()=>({id:"toggle-archived",title:e.t(n.value.archivedOpen?"archived.hide":"archived.show"),keywords:"archive archived settled sessions sidebar inbox",run:c})),e.add(x.Command,()=>({id:"toggle-groups",title:e.t(o.value.enabled?"groups.off":"groups.on"),keywords:"group project projects folders sessions sidebar inbox",run:()=>o.update(d=>{d.enabled=!d.enabled})})),e.add(x.Command,()=>({id:"toggle-working",title:e.t(a.value.inline?"working.section":"working.inline"),keywords:"working running busy section shelf sessions sidebar inbox",run:()=>a.update(d=>{d.inline=!d.inline})})),()=>{l.disconnect(),S.disconnect(),cancelAnimationFrame(q),clearTimeout(p),document.removeEventListener("scrollend",v,!0),Fe(),Ge(),yt(),it(),ut(),St()}}function Bt(e){const{archiveAfterHours:t}=Pe(e.options);if(t>0)return Ye(e,t*jt)}const Ut=x.Plugin.define({stores:{shelf:x.Store.global(z.Schema.Struct({archivedOpen:z.Schema.Boolean}),{archivedOpen:!1}),groups:x.Store.global(z.Schema.Struct({enabled:z.Schema.Boolean}),{enabled:!0}),working:x.Store.global(z.Schema.Struct({inline:z.Schema.Boolean}),{inline:!0})},i18n:{en:{"archived.show":"Show archived sessions","archived.hide":"Hide archived sessions","groups.on":"Group sessions by project","groups.off":"Stop grouping sessions by project","working.inline":"Show working sessions in the list","working.section":"Show working sessions in their own section","session.new":"New session","session.newIn":"New session in {{project}}","session.failed":"Could not start a session in {{project}}","usage.window":"Context window","usage.cacheRead":"Cache read","usage.cacheWrite":"Cache write","usage.input":"Input","usage.reasoning":"Reasoning","usage.output":"Output","usage.cost":"Cost","branch.switch":"Switch branch","branch.loading":"Loading…","branch.unlisted":"Could not list the branches","branch.remote":"Remote","branch.failed":"Could not switch to {{branch}}"}},setup:Pt,main:Bt});exports.default=Ut;
