"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const A=require("@opencode/plugin/gui"),V=require("effect"),D=require("solid-js"),te=require("solid-js/web"),ot=require("@opencode/client/solid"),ne=60*1e3,de=200,Ce=["session.inbox.enqueued","session.execution.started","session.unarchived"],Le=Symbol.for("opencode-plus.archive");function rt(e,t,n,o){const{created:r,updated:s,busy:a,idle:c,archived:m}=e.time;if(m!==void 0||e.parentID||a!==void 0&&(c===void 0||a>c))return!1;const i=Math.max(r,a??0,c??0);return(Number(e.metadata?.[o])||0)>=i||t-s<2*ne?!1:t-i>=n}function at(e,t){const n=`${e.id}.keptAt`,o=Date.now(),r=new AbortController,s=r.signal,a=p=>e.log.write("error",`${e.id}: ${p?.stack??p}`),c=async()=>{const p=[];let v=await e.client.session.list({parentID:null,archived:!1,limit:de});for(;;){if(p.push(...v.data),v.data.length<de||!v.cursor.next)return p;v=await e.client.session.list({cursor:v.cursor.next,limit:de})}};let m=!1;const i=async()=>{if(!m){m=!0;try{const p=Date.now(),v=(await c()).filter(l=>rt(l,p,t,n));for(const l of v)await e.client.session.update({sessionID:l.id,archived:!0}),e.log.write("info",`${e.id}: archived ${l.id} "${l.title??""}"`)}finally{m=!1}}},u=async p=>{if(!Ce.includes(p.type)||p.created<o-ne||p.type==="session.inbox.enqueued"&&p.data.item.type!=="user")return;const v=await e.client.session.get({sessionID:p.data.sessionID}),l=v.time.archived;if(p.type!=="session.unarchived"){if(l===void 0||p.created<=l)return;await e.client.session.update({sessionID:v.id,archived:!1}),e.log.write("info",`${e.id}: unarchived ${v.id} on ${p.type}`);return}l!==void 0||(Number(v.metadata?.[n])||0)>=p.created||await e.client.session.update({sessionID:v.id,metadata:{...v.metadata,[n]:p.created}})},b=async()=>{for(;!s.aborted;){try{const p=e.client.event.subscribe({types:Ce},{signal:s});for await(const v of p)u(v).catch(a)}catch(p){s.aborted||a(p)}s.aborted||await new Promise(p=>setTimeout(p,5e3))}},h=()=>{i().catch(a)},g=setTimeout(h,ne),x=setInterval(h,10*ne),O=()=>{s.aborted||(clearTimeout(g),clearInterval(x),r.abort())};return globalThis[Le]?.(),globalThis[Le]=O,e.signal.addEventListener("abort",O,{once:!0}),b(),O}const M=(e,t,n)=>{e.getAttribute(t)!==n&&e.setAttribute(t,n)},z=(e,t,n)=>n===void 0?e.removeAttribute(t):M(e,t,n),Oe='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5L8 9.5L11.5 6.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',De='[data-slot="new-session-composer"]',st='[data-slot="new-session-location-path"]',it=["branch","new-branch"].map(e=>`${De} use[href="#opencode-v2-icon-${e}"]`).join(", "),F="data-plus-branch",Z="data-plus-branch-trigger",_="data-plus-branch-menu",je="data-plus-branch-current",ct='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M3.53564 8.17857L6.39279 11.75L12.4642 4.25" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',lt=`
[${F}] {
  position: relative;
  border-radius: var(--radius-sm);
}
[${F}]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline: -2px -4px;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(Oe)}") center / 16px no-repeat;
}
[${F}]:is(:hover, :has(:focus-visible), :has([data-expanded])) {
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${Z}] {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
[${Z}] > button {
  width: 100%;
  height: 100%;
  opacity: 0;
}
[${_}] {
  width: max-content;
  max-width: min(320px, 100vw - 32px);
  max-height: min(320px, var(--kb-popper-content-available-height, 320px));
  overflow-y: auto;
}
[${_}] [data-slot="menu-v2-item-content"] {
  flex: 0 1 auto;
  min-width: 0;
}
[${_}] [data-component="menu-v2-item"]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
}
[${_}] [${je}]::after {
  background-color: var(--menu-v2-icon);
  mask: url("data:image/svg+xml,${encodeURIComponent(ct)}") center / 14px no-repeat;
}
`,dt="git branch --all --no-color --no-column --sort=-committerdate",K=new Map;function ut(e){K.forEach((t,n)=>{n.isConnected||(t(),K.delete(n))}),document.querySelectorAll(it).forEach(t=>{const n=t.closest("svg").parentElement;if(K.has(n))return;const o=document.createElement("div");o.setAttribute(Z,""),n.setAttribute(F,""),n.append(o),K.set(n,e(o,n))})}function pt(){document.querySelectorAll(`[${Z}] > [aria-controls]`).forEach(e=>{const t=document.getElementById(e.getAttribute("aria-controls"));if(!t)return;const n=e.closest(`[${F}]`).querySelector(":scope > span").textContent.trim();M(t,_,""),t.querySelectorAll('[data-component="menu-v2-item"]').forEach(o=>{const r=o.querySelector('[data-slot="menu-v2-item-content"] > span');z(o,je,o.textContent.trim()===n?"":void 0),r&&z(o,"title",r.scrollWidth>r.clientWidth?r.textContent:void 0)})})}async function ht(e,t){const n=e.closest(De)?.querySelector(st)?.textContent??"";if(!n.includes("…"))return n||void 0;const[o,r]=n.split("…");return(await t()).flatMap(s=>[s.canonical,...s.sandboxes]).find(s=>s.startsWith(o)&&s.endsWith(r))}function mt(e){const t=new Set,n=[],o=new Map;let r;for(const a of e.split(/\r?\n/)){const c=a.slice(2).trim();if(!(!c||c.startsWith("(")||c.includes(" -> "))){if(c.startsWith("remotes/")){const m=c.slice(8),i=m.slice(m.indexOf("/")+1);o.has(i)||o.set(i,m);continue}t.add(c),a.startsWith("*")&&(r=c),a.startsWith("+")||n.push(c)}}const s=Array.from(o,([a,c])=>({name:a,ref:c})).filter(({name:a})=>!t.has(a));return{current:r,local:n,remote:s}}const ft=(...e)=>["git","switch",...e.map(gt)].join(" "),gt=e=>/^[\w./-]+$/.test(e)?e:`'${e.replaceAll("'","'\\''")}'`;function bt(){K.forEach(e=>e()),K.clear(),document.querySelectorAll(`[${Z}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${F}]`).forEach(e=>e.removeAttribute(F))}const Be='[data-slot="composer-controls"]',Pe=`${Be} > div > [data-component="tooltip-v2-trigger"]`,We='[data-action="composer-model"]',Ue=`${Pe}:has(~ [data-component="tooltip-v2-trigger"] ${We})`,ze=`${Pe}:has(${We}) ~ [data-component="tooltip-v2-trigger"]`,oe="data-plus-hidden-agent",re="data-plus-variant-menu";function vt({lowercaseVariants:e}){return`
${Ue}[${oe}] {
  display: none;
}
${e?`${ze} .capitalize,
[${re}] .capitalize {
  text-transform: lowercase;
}`:""}
`}function yt(e){document.querySelectorAll(Ue).forEach(t=>{const n=e!==!1&&t.textContent.trim().toLowerCase()===e.toLowerCase();z(t,oe,n?"":void 0)}),document.querySelectorAll(`${ze} [aria-controls]`).forEach(t=>{const n=document.getElementById(t.getAttribute("aria-controls"));n&&M(n,re,"")})}const Te=new WeakSet;function $t(e){document.querySelectorAll(Be).forEach(t=>{Te.has(t)||(Te.add(t),e.observe(t,{subtree:!0,characterData:!0}))})}function wt(){document.querySelectorAll(`[${oe}]`).forEach(e=>e.removeAttribute(oe)),document.querySelectorAll(`[${re}]`).forEach(e=>e.removeAttribute(re))}function kt({label:e,icon:t,shortcut:n,onSelect:o}){const r=document.createElement("hr");r.setAttribute("data-slot","menu-v2-separator");const s=document.createElement("div");s.setAttribute("role","menuitem"),s.setAttribute("data-component","menu-v2-item");const a=document.createElement("span");if(a.setAttribute("data-slot","menu-v2-item-content"),t(a),a.append(e),s.append(a),n){const c=document.createElement("span");c.setAttribute("data-slot","menu-v2-item-shortcut"),c.textContent=n,s.append(c)}return s.addEventListener("pointerenter",()=>s.setAttribute("data-highlighted","")),s.addEventListener("pointerleave",()=>s.removeAttribute("data-highlighted")),s.addEventListener("click",()=>{s.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:!0})),o()}),queueMicrotask(()=>{const c=s.closest('[role="menu"]')?.querySelector("[data-appearance]")?.getAttribute("data-appearance");c&&(s.setAttribute("data-appearance",c),r.setAttribute("data-appearance",c))}),[r,s]}function Fe(e={}){const t=e.archiveAfterHours;return{archiveAfterHours:typeof t=="number"&&t>=0?t:12,hideAgent:typeof e.hideAgent=="string"||e.hideAgent===!1?e.hideAgent:"build",responseLabel:typeof e.responseLabel=="string"?e.responseLabel:e.responseLabel===!1?"":"Response",lowercaseVariants:e.lowercaseVariants!==!1}}const S='[data-slot="sidebar-inbox"]',ve='[data-slot="sidebar-inbox-scroll"]',J='[data-slot="sidebar-inbox-working"]',ye=`${ve} > div.pt-3`,f='[data-slot="sidebar-inbox-item"]',q="data-plus-shelf",R="data-plus-toggle",$e="data-plus-count",I="data-plus-group",ae="data-plus-gap",N="data-plus-member",U="data-plus-inline",j="data-plus-add",ue=`${S} ${f}[data-status="ready"]:not([data-state="active"], :hover:not(:has([${j}]:hover)), :focus-visible, [${q}] > *)`,Et=`
${ye} {
  order: 100000;
  margin-top: auto;
}
${S}[${U}] {
  overflow-y: auto;
  gap: 1px;
  padding-bottom: 4px;
}
[${U}] > ${ve},
[${U}] > ${J},
[${U}] > ${J} > div {
  display: contents;
}
[${U}] > ${J} > button {
  display: none;
}
[${q}] > [${R}] {
  border-radius: 6px;
}
[${q}] > [${R}]:hover {
  color: var(--color-v2-text-text-base);
}
[${q}] > [${R}]:focus-visible {
  outline: none;
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${q}] > [${R}]::before {
  content: attr(${$e});
  order: 1;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-faint);
}
[${q}] > [${R}]::after {
  content: "";
  order: 2;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(Oe)}") center / 16px no-repeat;
}
[${q}="closed"] > [${R}]::after {
  rotate: -90deg;
}
[${q}="closed"] > [${R}]:dir(rtl)::after {
  rotate: 90deg;
}
[${q}="closed"] > ${f}:not([data-state="active"]) {
  display: none;
}
${S} ${f}[data-status="working"] {
  opacity: 1;
}
${S} ${f}[data-status="working"] > span:nth-of-type(2) {
  color: var(--color-v2-text-text-base);
}
/* T3 Code's Working colors: sky-600 text and a sky-500 pulsing dot, or sky-300 at 80% in dark mode. */
${S} {
  --plus-working: oklch(58.8% 0.158 241.966);
  --plus-working-dot: oklch(68.5% 0.169 237.323);
  --plus-working-peak: oklch(74.6% 0.16 232.661);
}
[data-color-scheme="dark"] ${S} {
  --plus-working: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-dot: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-peak: oklch(95.1% 0.026 236.824);
}
${S} ${f}[data-status="working"] > span:first-child > span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--plus-working);
}
${S} ${f}[data-status="working"] > span:first-child > span:last-child > span {
  color: inherit;
}
${S} ${f}[data-status="working"] [data-component="text-shimmer"] {
  --text-shimmer-base-color: var(--plus-working);
  --text-shimmer-peak-color: var(--plus-working-peak);
}
${S} ${f}[data-status="working"] > span:first-child > span:last-child::before {
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
  ${S} ${f}[data-status="working"] > span:first-child > span:last-child::before {
    animation: none;
  }
}
${S} ${f} > span,
${S} ${f} > span:first-child > span {
  transition: opacity 150ms;
}
${ue}:not([${N}]) > span,
${ue}[${N}] > span:not(:first-child),
${ue}[${N}] > span:first-child > span:last-child {
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
${f}[${ae}] {
  margin-top: 16px;
}
${f}[${I}] {
  position: relative;
  margin-top: 28px;
}
${f}[${I}][${ae}] {
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
${f}[${I}] > [${j}] {
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
${f}[${I}] > [${j}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
${f}[${I}]:not([data-state="active"]):has(> [${j}]:hover) {
  background-color: transparent;
}
`,Y=e=>e?Array.from(e.children).filter(t=>t.matches(f)):[],At=e=>e.querySelector(":scope > span:first-child > span.truncate")?.textContent?.trim(),Ge=e=>{e.style.removeProperty("order"),e.style.length===0&&e.removeAttribute("style"),e.removeAttribute(I),e.removeAttribute(ae),e.removeAttribute(N)};function St(e){const t=e?"open":"closed";document.querySelectorAll(ye).forEach(n=>{const o=n.firstElementChild;!o||o.matches(f)||(M(n,q,t),M(o,R,""),M(o,$e,String(Y(n).length)),M(o,"role","button"),M(o,"tabindex","0"),M(o,"aria-expanded",String(e)))})}function xt(e){const t=r=>r.target instanceof Element?r.target.closest(`${ye} > [${R}]`):null,n=r=>{t(r)&&e()},o=r=>{r.key!=="Enter"&&r.key!==" "||!t(r)||(r.preventDefault(),e())};return document.addEventListener("click",n),document.addEventListener("keydown",o),()=>{document.removeEventListener("click",n),document.removeEventListener("keydown",o)}}const qe=(e,t,n=[])=>{const o=[...n,...e];if(!t&&n.length===0)return o.forEach(Ge);const r=new Map;o.forEach(a=>{const c=t&&At(a)||a;r.set(c,[...r.get(c)??[],a])});let s=0;Array.from(r).forEach(([a,c],m)=>{const i=t&&typeof a=="string"&&c.length>1;c.forEach((u,b)=>{s+=1,u.style.order!==String(s)&&(u.style.order=String(s)),z(u,I,i&&b===0?a:void 0),z(u,N,i?"":void 0),z(u,ae,t&&m>0&&b===0?"":void 0)})})};function He(e,t){document.querySelectorAll(S).forEach(n=>{const o=n.querySelector(`:scope > ${ve}`),r=n.querySelector(`:scope > ${J} > div`),s=new Set;t?(M(n,U,""),n.querySelector(`:scope > ${J} > button[aria-expanded="false"]`)?.click(),qe(Y(o),e,Y(r)),s.add(o).add(r)):n.removeAttribute(U),new Set(Array.from(n.querySelectorAll(f),a=>a.parentElement)).forEach(a=>{if(s.has(a))return;const c=a.getAttribute(q)==="closed",m=Y(a).filter(i=>!c||i.getAttribute("data-state")==="active");Y(a).filter(i=>!m.includes(i)).forEach(Ge),qe(m,e)})})}function Ct(e){document.querySelectorAll(`${f} > [${j}]`).forEach(t=>{t.parentElement.getAttribute(I)!==t.getAttribute(j)&&t.remove()}),document.querySelectorAll(`${f}[${I}]`).forEach(t=>{t.querySelector(`:scope > [${j}]`)||t.append(e(t.getAttribute(I)))})}function Lt({name:e,label:t,icon:n,onSelect:o}){const r=document.createElement("div"),s=a=>{a.preventDefault(),a.stopPropagation(),o()};return r.setAttribute(j,e),r.setAttribute("role","button"),r.setAttribute("tabindex","0"),r.setAttribute("aria-label",t),r.setAttribute("title",t),n(r),r.addEventListener("pointerdown",a=>a.stopPropagation()),r.addEventListener("click",s),r.addEventListener("keydown",a=>{(a.key==="Enter"||a.key===" ")&&s(a)}),r}function Tt(){He(!1,!1),document.querySelectorAll(`[${j}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${q}]`).forEach(e=>e.removeAttribute(q)),document.querySelectorAll(`[${R}]`).forEach(e=>{[R,$e,"role","tabindex","aria-expanded"].forEach(t=>e.removeAttribute(t))})}const qt="[data-timeline-virtual-content]",Ve='[data-slot="session-turn-message-container"]',ee="data-plus-final",pe=`[${ee}] > [data-component="session-turn"] > ${Ve}`,we="--plus-label-half";function It(e){return`
${pe} {
  --plus-gap: calc(var(${we}, ${e.length*3.75}px) + 12px);
  position: relative;
}
${pe}::before {
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
${pe}::after {
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
`}let Ie=!1;function Nt(e){const t=document.querySelector(Ve);if(Ie||!e||!t||document.fonts?.status==="loading")return;const n=document.createElement("span");n.textContent=e,n.style.cssText="position: absolute; visibility: hidden; white-space: nowrap; font-size: 13px; font-weight: 440; letter-spacing: -0.04px",t.append(n);const o=n.getBoundingClientRect().width;n.remove(),o&&(document.documentElement.style.setProperty(we,`${o/2}px`),Ie=!0)}const W=e=>e?.frame?.getAttribute("data-timeline-row"),P=e=>e?.frame?.getAttribute("data-message-id"),he=e=>W(e)==="AssistantPart"&&!!e.frame.querySelector('[data-component="text-part"]')&&!e.frame.querySelector('[data-component="tool-part-wrapper"], [data-timeline-part-ids]');function Rt(e){document.querySelectorAll(qt).forEach(t=>{const n=Array.from(t.querySelectorAll(":scope > div > [data-timeline-key]"),i=>({wrapper:i,frame:i.querySelector(":scope > [data-index] > [data-timeline-row]"),top:parseFloat(i.style.top),height:parseFloat(i.style.height)})).sort((i,u)=>i.top-u.top),o=t.querySelector(':scope > [data-timeline-row="bottom-spacer"]'),r=i=>n[i+1]&&Math.abs(n[i+1].top-(n[i].top+n[i].height))<2?n[i+1]:void 0,s=i=>n[i-1]&&Math.abs(n[i].top-(n[i-1].top+n[i-1].height))<2?n[i-1]:void 0,a=i=>i===n.length-1&&!!o&&Math.abs(n[i].wrapper.getBoundingClientRect().bottom-o.getBoundingClientRect().top)<2,c=e?void 0:!0,m=i=>{const u=r(i);return u?u.frame?W(u)==="TurnGap"||W(u)==="UserMessage"||P(u)&&P(u)!==P(n[i])||W(u)==="TurnDiff"||W(u)==="TurnDivider"?!0:W(u)==="AssistantPart"||W(u)==="Thinking"?!1:c:c:n[i+1]||!a(i)?void 0:c};n.forEach((i,u)=>{if(!he(i))return me(i,!1);const b=m(u);if(b===void 0)return;if(!b){const g=r(u);he(g)&&P(g)===P(i)||me(i,!1);return}let h=u;for(;he(s(h))&&P(s(h))===P(i);)h-=1;for(let g=h;g<=u;g+=1)me(n[g],g===h&&n[g].frame.hasAttribute("data-timeline-spacing"))})})}const X=new Map,me=(e,t)=>{!e.frame||e.frame.hasAttribute(ee)===t||(z(e.frame,ee,t?"":void 0),X.set(e.frame.parentElement,10))};function Mt(){X.forEach((e,t)=>{if(!(t.isConnected&&Math.abs(t.offsetHeight-parseFloat(t.parentElement.style.height))>=1)||e===0)return X.delete(t);X.set(t,e-1),t.style.paddingBottom="1px",requestAnimationFrame(()=>t.style.removeProperty("padding-bottom"))})}const Ot=()=>X.size>0;function Dt(){document.querySelectorAll(`[${ee}]`).forEach(e=>e.removeAttribute(ee)),document.documentElement.style.removeProperty(we)}const jt='[data-component="tooltip-v2-trigger"] > button:not([aria-haspopup]):has([data-component="progress-circle"])',E="data-plus-usage",Ne="plus-usage-card",be="data-plus-usage-hover",Bt=50,Pt=100,Wt=4,Ut=`
:root[${be}] [data-component="tooltip-v2"]:not([data-force-open="true"]) {
  display: none;
}
[${E}] {
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
[${E}]:dir(rtl) {
  transform-origin: top left;
}
[${E}] [data-part="row"] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
  white-space: nowrap;
}
[${E}] [data-part="row"] > :last-child {
  margin-inline-start: auto;
}
[${E}] :is([data-part="value"], [data-part="percent"]) {
  color: var(--v2-text-text-base);
}
[${E}] [data-part="percent"] {
  font-weight: 530;
}
[${E}] [data-part="bar"] {
  display: flex;
  height: 8px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--v2-background-bg-layer-03);
}
[${E}] [data-part="bar"] > span {
  box-sizing: border-box;
  min-width: 3px;
}
/* A line in the card's color between kinds, as in Cursor's bar. */
[${E}] [data-part="bar"] > span + span {
  border-inline-start: 1px solid var(--v2-background-bg-layer-01);
}
[${E}] [data-part="legend"] {
  display: flex;
  flex-direction: column;
}
[${E}] [data-part="dot"] {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
[${E}] hr {
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
  [${E}] {
    animation: none;
  }
}
:root[data-motion="reduce"] [${E}] {
  animation: none;
}
`;function zt(e){let t,n,o=0;const r=document.documentElement,s=(l,C)=>{clearTimeout(o),o=setTimeout(l,C)},a=l=>l.target instanceof Element?l.target.closest(jt):null,c=l=>l instanceof Node&&!!(t?.contains(l)||n?.card.contains(l)),m=()=>{if(!t.isConnected)return;const l=document.createElement("div"),C=t.closest("[data-theme]")?.getAttribute("data-theme");l.id=Ne,l.setAttribute(E,""),l.setAttribute("role","tooltip"),C&&l.setAttribute("data-theme",C),n={card:l,stop:e(l)},document.body.append(l),Vt(l,t),t.setAttribute("aria-describedby",Ne)},i=()=>{clearTimeout(o),n?.stop(),n?.card.remove(),n=void 0,t?.removeAttribute("aria-describedby")},u=l=>{if(l===t){n&&clearTimeout(o);return}b(),t=l,r.setAttribute(be,""),s(m,Bt)},b=()=>{i(),t=void 0,r.removeAttribute(be)},h=l=>{if(l.pointerType==="touch")return;const C=a(l);if(C)return u(C);if(n?.card.contains(l.target))return clearTimeout(o);t&&!t.isConnected&&b()},g=l=>{!t||c(l.relatedTarget)||!c(l.target)||(n?s(b,Pt):b())},x=l=>{t?.contains(l.target)&&i()},O=l=>{l.key==="Escape"&&i()},p=l=>{const C=a(l);C?.matches(":focus-visible")&&u(C)},v=l=>{t?.contains(l.target)&&!c(l.relatedTarget)&&b()};return document.addEventListener("pointerover",h),document.addEventListener("pointerout",g),document.addEventListener("pointerdown",x,!0),document.addEventListener("keydown",O),document.addEventListener("focusin",p),document.addEventListener("focusout",v),()=>{document.removeEventListener("pointerover",h),document.removeEventListener("pointerout",g),document.removeEventListener("pointerdown",x,!0),document.removeEventListener("keydown",O),document.removeEventListener("focusin",p),document.removeEventListener("focusout",v),b()}}function Ft(e){const t=e.server.data,n=e.directory?{directory:e.directory}:void 0,o=t.session.get(e.id),r=t.session.message.list(e.id),s=ot.lastAssistantWithUsage(r,o?.revert?.messageID),a=s?.tokens,c=a?a.input+a.output+a.reasoning+a.cache.read+a.cache.write:0,m=s?Re(t,n,s.model)?.limit.context:void 0,i=t.session.cost(e.id),u=o?.model??r.findLast(g=>g.type==="assistant")?.model,b=u?Re(t,n,u):void 0,h=!!b&&b.cost.every(g=>!g.input&&!g.output&&!g.cache.read&&!g.cache.write);return{total:c,tokens:a,limit:m||void 0,percent:m?Math.round(c/m*100):void 0,cost:i>0||!h?i:void 0}}function Gt({total:e,tokens:t,limit:n,percent:o,cost:r},s,a){const c=h=>new Intl.NumberFormat(a,{notation:"compact",maximumFractionDigits:0}).format(h).toLocaleLowerCase(a),m=t?Ht.map(h=>({...h,value:h.value(t)})).filter(h=>h.value>0):[],i=Math.max(n??0,e),u=T("span",void 0,n?`${c(e)} / ${c(n)} `:c(e));n&&u.append(T("span","percent",`(${o}%)`));const b=[fe([T("span",void 0,s("usage.window")),u])];if(i>0){const h=T("div","bar");h.setAttribute("aria-hidden","true"),m.forEach(g=>{const x=T("span");x.style.width=`${g.value/i*100}%`,x.style.background=g.color,h.append(x)}),b.push(h)}if(m.length){const h=T("div","legend");m.forEach(g=>{const x=T("span","dot");x.style.background=g.color,h.append(fe([x,T("span",void 0,s(g.label)),T("span","value",g.value.toLocaleString(a))]))}),b.push(h)}if(r!==void 0){const h=new Intl.NumberFormat(a,{style:"currency",currency:"USD"});b.push(T("hr"),fe([T("span",void 0,s("usage.cost")),T("span","value",h.format(r))]))}return b}const Ht=[{label:"usage.cacheRead",color:"var(--v2-avatar-border-blue)",value:e=>e.cache.read},{label:"usage.cacheWrite",color:"var(--v2-avatar-border-purple)",value:e=>e.cache.write},{label:"usage.input",color:"var(--v2-avatar-border-pink)",value:e=>e.input},{label:"usage.reasoning",color:"var(--v2-avatar-border-yellow)",value:e=>e.reasoning},{label:"usage.output",color:"var(--v2-avatar-border-green)",value:e=>e.output}],Re=(e,t,n)=>{const o=e.location.provider.list(t),r=e.location.model.list(t);if(o?.some(s=>s.id===n.providerID))return r?.findLast(s=>s.providerID===n.providerID&&s.id===n.id&&s.status!=="deprecated")},T=(e,t,n)=>{const o=document.createElement(e);return t&&o.setAttribute("data-part",t),n!==void 0&&(o.textContent=n),o},fe=e=>{const t=T("div","row");return t.append(...e),t},Vt=(e,t)=>{const n=t.getBoundingClientRect(),o=e.offsetWidth,r=getComputedStyle(t).direction==="rtl"?n.left:n.right-o;e.style.top=`${n.bottom+Wt}px`,e.style.left=`${Math.max(8,Math.min(r,innerWidth-o-8))}px`},ke='[data-component="user-message"]',Kt=`${ke} [data-slot="user-message-actions"]`,Ke='[data-slot="user-message-text"]',_t='[data-component="tooltip-v2-trigger"]',se="data-plus-copy",Yt=`
[${se}] {
  display: contents;
}
[${se}] [data-slot="icon-svg"] {
  width: 14px;
  height: 14px;
}
`,Q=new Map;function Jt(e){Q.forEach((t,n)=>{n.isConnected||(t(),n.remove(),Q.delete(n))}),document.querySelectorAll(Kt).forEach(t=>{const n=t.querySelector(`:scope > ${_t}`);if(!n||t.querySelector(`:scope > [${se}]`)||!t.closest(ke).querySelector(Ke))return;const o=document.createElement("span");o.setAttribute(se,""),o.addEventListener("mousedown",r=>r.preventDefault()),Q.set(o,e(o)),t.insertBefore(o,n)})}const Xt=({ui:e,label:t,copied:n,write:o})=>r=>te.render(()=>{const[s,a]=D.createSignal(!1),c=()=>s()?n:t,m=async i=>{i.stopPropagation(),await o(Qt(r.closest(ke)))&&(a(!0),setTimeout(()=>a(!1),2e3))};return D.createComponent(e.Tooltip,{get value(){return c()},get children(){return D.createComponent(e.IconButton,{get icon(){return s()?"check":"outline-copy"},get label(){return c()},size:"small",onClick:m})}})},r),Qt=e=>{const t=e.querySelector(Ke).cloneNode(!0);return t.querySelectorAll('[data-slot="user-message-comments"], [data-slot="user-message-fold-toggle"]').forEach(n=>n.remove()),t.querySelectorAll("[data-session-reference]").forEach(n=>n.replaceWith(n.dataset.sessionReference)),t.textContent};function Zt(){Q.forEach((e,t)=>{e(),t.remove()}),Q.clear()}const _e=60*1e3,en=60*_e,Me="tab.new",ge="sidecar";function tn(e){const t=Fe(e.options),{shelf:n,groups:o,working:r}=e.stores,s=(d,k)=>y=>te.insert(y,()=>D.createComponent(e.ui.Icon,{name:d,...k})),a=()=>{const d=e.sessions.current();try{const k=d?.server.data.session;return!!d&&(k.status(d.id)==="running"||k.pending.list(d.id).some(y=>y.type!=="synthetic"))}catch{return!1}},c=()=>n.update(d=>{d.archivedOpen=!d.archivedOpen}),m=async d=>{const y=(await e.client.project.list()).filter($=>($.name||$.canonical.split("/").pop())===d).toSorted(($,L)=>L.time.active-$.time.active)[0];if(!y)return e.layout.project(ge,e.t("session.new"));e.layout.draft({server:ge,directory:y.canonical,prompt:""})},i=d=>Lt({name:d,label:e.t("session.newIn",{project:d}),icon:s("plus",{size:"small"}),onSelect:()=>{m(d).catch(()=>e.toast.show({title:e.t("session.failed",{project:d})}))}}),u=async(d,k)=>{const y={directory:d};let{data:$}=await e.client.shell.create({location:y,command:k,timeout:_e});try{for(;$.status==="running";)await new Promise(G=>setTimeout(G,100)),$=(await e.client.shell.get({id:$.id,location:y})).data;const{data:L}=await e.client.shell.output({id:$.id,location:y});return{ok:$.exit===0,output:L.output}}finally{e.client.shell.remove({id:$.id,location:y}).catch(()=>{})}},b=async d=>{const k=await ht(d,()=>e.client.project.list()),y=k&&await u(k,dt);return y?.ok?{directory:k,...mt(y.output)}:void 0},h=async(d,k,y)=>{const $=L=>e.toast.show({variant:"error",title:y,description:L.trim()});try{const L=await u(d,ft(...k));if(!L.ok)return $(L.output);const G=e.servers.get(ge)?.data;G?.location.vcs.invalidate({directory:d}),await G?.location.vcs.sync({directory:d})}catch(L){$(String(L?.message??L))}},g=(d,k)=>D.createRoot(y=>{const[$,L]=D.createSignal(),[G,Ae]=D.createSignal(!1);let ie=!1;const ce=()=>{ie||(ie=!0,b(k).catch(()=>{}).then(w=>L(w??null)).finally(()=>{ie=!1}))},Se=async(w,B)=>{Ae(!0),await h($().directory,w,B),Ae(!1),ce()},Xe=w=>{w!==$().current&&Se([w],e.t("branch.failed",{branch:w}))},Qe=async()=>{const w=$().current,H=(await e.dialogs.prompt({title:e.t("branch.create"),description:w&&e.t("branch.from",{branch:w}),placeholder:e.t("branch.name"),submit:e.t("branch.submit")}))?.trim().replace(/\s+/g,"-");H&&await Se(["-c",H],e.t("branch.uncreated",{branch:H}))},xe=(w,B=w)=>({label:B,onSelect:()=>Xe(w)}),Ze=()=>{const w=$();if(w===void 0)return[{label:e.t("branch.loading"),disabled:!0}];if(w===null)return[{label:e.t("branch.unlisted"),disabled:!0}];const B=[{label:e.t("branch.new"),icon:"plus",onSelect:()=>{Qe()}},{type:"separator"}],H=w.local.map(le=>xe(le));if(w.remote.length===0)return[...B,...H];const et=w.remote.map(({name:le,ref:nt})=>xe(le,nt)),tt={type:"group",label:e.t("branch.remote"),items:et};return[...B,...H,{type:"separator"},tt]};return d.addEventListener("pointerenter",ce),d.addEventListener("focusin",ce),te.insert(d,()=>D.createComponent(e.ui.Menu,{label:e.t("branch.switch"),trigger:"button",placement:"bottom-start",get disabled(){return G()},get items(){return Ze()}})),y}),x=Xt({ui:e.ui,label:e.t("message.copy"),copied:e.t("message.copied"),write:d=>e.system.copy(d).then(()=>!0,()=>(e.toast.show({title:e.t("message.copyFailed")}),!1))}),O=()=>{St(n.value.archivedOpen),He(o.value.enabled,r.value.inline),Ct(i),ut(g),pt(),yt(t.hideAgent),$t(Ee),Jt(x),Nt(t.responseLabel),Mt(),Rt(a()),Ot()&&!v&&(v=setTimeout(()=>{v=0,l()},300))};let p=0,v=0;const l=()=>{p||(p=requestAnimationFrame(()=>{p=0,O()}))},C=new MutationObserver(l);C.observe(document.body,{childList:!0,subtree:!0});const Ee=new MutationObserver(l);document.addEventListener("scrollend",l,!0);const Ye=xt(c),Je=zt(d=>D.createRoot(k=>(te.insert(d,()=>{const y=e.sessions.current();return y?Gt(Ft(y),e.t,e.locale.locale()):[]}),k)));return A.createKeyed(()=>`${n.value.archivedOpen}:${o.value.enabled}:${r.value.inline}:${a()}`,O),e.add(A.Style,Et),e.add(A.Style,lt),e.add(A.Style,vt(t)),e.add(A.Style,It(t.responseLabel)),e.add(A.Style,Ut),e.add(A.Style,Yt),e.add(A.Slot,{at:"session.location.menu",order:100,render:d=>kt({label:e.t("session.new"),icon:s("edit",{class:"shrink-0 text-v2-icon-icon-muted"}),shortcut:e.keybinds.keybind(Me).join(""),onSelect:()=>{e.commands.run(Me)||e.layout.draft({server:d.session.server.id,directory:d.session.directory,prompt:""})}})}),e.add(A.Command,()=>({id:"toggle-archived",title:e.t(n.value.archivedOpen?"archived.hide":"archived.show"),keywords:"archive archived settled sessions sidebar inbox",run:c})),e.add(A.Command,()=>({id:"toggle-groups",title:e.t(o.value.enabled?"groups.off":"groups.on"),keywords:"group project projects folders sessions sidebar inbox",run:()=>o.update(d=>{d.enabled=!d.enabled})})),e.add(A.Command,()=>({id:"toggle-working",title:e.t(r.value.inline?"working.section":"working.inline"),keywords:"working running busy section shelf sessions sidebar inbox",run:()=>r.update(d=>{d.inline=!d.inline})})),()=>{C.disconnect(),Ee.disconnect(),cancelAnimationFrame(p),clearTimeout(v),document.removeEventListener("scrollend",l,!0),Ye(),Je(),Tt(),bt(),wt(),Dt(),Zt()}}function nn(e){const{archiveAfterHours:t}=Fe(e.options);if(t>0)return at(e,t*en)}const on=A.Plugin.define({stores:{shelf:A.Store.global(V.Schema.Struct({archivedOpen:V.Schema.Boolean}),{archivedOpen:!1}),groups:A.Store.global(V.Schema.Struct({enabled:V.Schema.Boolean}),{enabled:!0}),working:A.Store.global(V.Schema.Struct({inline:V.Schema.Boolean}),{inline:!0})},i18n:{en:{"archived.show":"Show archived sessions","archived.hide":"Hide archived sessions","groups.on":"Group sessions by project","groups.off":"Stop grouping sessions by project","working.inline":"Show working sessions in the list","working.section":"Show working sessions in their own section","session.new":"New session","session.newIn":"New session in {{project}}","session.failed":"Could not start a session in {{project}}","usage.window":"Context window","usage.cacheRead":"Cache read","usage.cacheWrite":"Cache write","usage.input":"Input","usage.reasoning":"Reasoning","usage.output":"Output","usage.cost":"Cost","branch.switch":"Switch branch","branch.loading":"Loading…","branch.unlisted":"Could not list the branches","branch.remote":"Remote","branch.failed":"Could not switch to {{branch}}","branch.new":"New branch…","branch.create":"Create branch","branch.from":"The new branch starts from {{branch}}, with your changes.","branch.name":"Branch name","branch.submit":"Create","branch.uncreated":"Could not create {{branch}}","message.copy":"Copy message","message.copied":"Copied","message.copyFailed":"Could not copy the message"}},setup:tn,main:nn});exports.default=on;
