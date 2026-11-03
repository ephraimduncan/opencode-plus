"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const $=require("@opencode/plugin/gui"),M=require("effect"),xe=require("solid-js"),Le=require("solid-js/web"),G=60*1e3,K=200,ie=["session.inbox.enqueued","session.execution.started","session.unarchived"],ce=Symbol.for("opencode-plus.archive");function qe(e,t,n,i){const{created:o,updated:r,busy:s,idle:c,archived:f}=e.time;if(f!==void 0||e.parentID||s!==void 0&&(c===void 0||s>c))return!1;const a=Math.max(o,s??0,c??0);return(Number(e.metadata?.[i])||0)>=a||t-r<2*G?!1:t-a>=n}function Te(e,t){const n=`${e.id}.keptAt`,i=Date.now(),o=new AbortController,r=o.signal,s=u=>e.log.write("error",`${e.id}: ${u?.stack??u}`),c=async()=>{const u=[];let h=await e.client.session.list({parentID:null,archived:!1,limit:K});for(;;){if(u.push(...h.data),h.data.length<K||!h.cursor.next)return u;h=await e.client.session.list({cursor:h.cursor.next,limit:K})}};let f=!1;const a=async()=>{if(!f){f=!0;try{const u=Date.now(),h=(await c()).filter(S=>qe(S,u,t,n));for(const S of h)await e.client.session.update({sessionID:S.id,archived:!0}),e.log.write("info",`${e.id}: archived ${S.id} "${S.title??""}"`)}finally{f=!1}}},p=async u=>{if(!ie.includes(u.type)||u.created<i-G||u.type==="session.inbox.enqueued"&&u.data.item.type!=="user")return;const h=await e.client.session.get({sessionID:u.data.sessionID}),S=h.time.archived;if(u.type!=="session.unarchived"){if(S===void 0||u.created<=S)return;await e.client.session.update({sessionID:h.id,archived:!1}),e.log.write("info",`${e.id}: unarchived ${h.id} on ${u.type}`);return}S!==void 0||(Number(h.metadata?.[n])||0)>=u.created||await e.client.session.update({sessionID:h.id,metadata:{...h.metadata,[n]:u.created}})},q=async()=>{for(;!r.aborted;){try{const u=e.client.event.subscribe({types:ie},{signal:r});for await(const h of u)p(h).catch(s)}catch(u){r.aborted||s(u)}r.aborted||await new Promise(u=>setTimeout(u,5e3))}},A=()=>{a().catch(s)},E=setTimeout(A,G),F=setInterval(A,10*G),I=()=>{r.aborted||(clearTimeout(E),clearInterval(F),o.abort())};return globalThis[ce]?.(),globalThis[ce]=I,e.signal.addEventListener("abort",I,{once:!0}),q(),I}const y=(e,t,n)=>{e.getAttribute(t)!==n&&e.setAttribute(t,n)},B=(e,t,n)=>n===void 0?e.removeAttribute(t):y(e,t,n),he='[data-slot="new-session-composer"]',Ie='[data-slot="new-session-location-path"]',Ce=["branch","new-branch"].map(e=>`${he} use[href="#opencode-v2-icon-${e}"]`).join(", "),D="data-plus-branch",Ne=`
[${D}] {
  border-radius: var(--radius-sm);
}
[${D}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
`,Oe="git branch --all --no-color --no-column --sort=-committerdate";function je(e){document.querySelectorAll(Ce).forEach(t=>{const n=t.closest("svg").parentElement;y(n,D,""),y(n,"role","button"),y(n,"tabindex","0"),y(n,"aria-haspopup","dialog"),y(n,"aria-description",e)})}function Me(e){const t=o=>o.target instanceof Element?o.target.closest(`[${D}]`):null,n=o=>{const r=t(o);r&&e(r)},i=o=>{const r=t(o);o.key!=="Enter"&&o.key!==" "||!r||(o.preventDefault(),e(r))};return document.addEventListener("click",n),document.addEventListener("keydown",i),()=>{document.removeEventListener("click",n),document.removeEventListener("keydown",i)}}async function De(e,t){const n=e.closest(he)?.querySelector(Ie)?.textContent??"";if(!n.includes("…"))return n||void 0;const[i,o]=n.split("…");return(await t()).flatMap(r=>[r.canonical,...r.sandboxes]).find(r=>r.startsWith(i)&&r.endsWith(o))}function Re(e){const t=new Set,n=new Map,i=[];let o;for(const r of e.split(/\r?\n/)){const s=r.slice(2).trim();if(!(!s||s.startsWith("(")||s.includes(" -> "))){if(s.startsWith("remotes/")){const c=s.slice(8),f=c.slice(c.indexOf("/")+1);n.has(f)||n.set(f,c);continue}t.add(s),r.startsWith("*")&&(o=s),r.startsWith("+")||i.push({title:s,value:s})}}return n.forEach((r,s)=>{t.has(s)||i.push({title:s,value:s,description:r})}),{current:o,options:i}}const Pe=e=>`git switch ${/^[\w./-]+$/.test(e)?e:`'${e.replaceAll("'","'\\''")}'`}`;function Be(){document.querySelectorAll(`[${D}]`).forEach(e=>{[D,"role","tabindex","aria-haspopup","aria-description"].forEach(t=>e.removeAttribute(t))})}const fe='[data-slot="composer-controls"]',me=`${fe} > div > [data-component="tooltip-v2-trigger"]`,ge='[data-action="composer-model"]',ve=`${me}:has(~ [data-component="tooltip-v2-trigger"] ${ge})`,be=`${me}:has(${ge}) ~ [data-component="tooltip-v2-trigger"]`,U="data-plus-hidden-agent",V="data-plus-variant-menu";function He({lowercaseVariants:e}){return`
${ve}[${U}] {
  display: none;
}
${e?`${be} .capitalize,
[${V}] .capitalize {
  text-transform: lowercase;
}`:""}
`}function We(e){document.querySelectorAll(ve).forEach(t=>{const n=e!==!1&&t.textContent.trim().toLowerCase()===e.toLowerCase();B(t,U,n?"":void 0)}),document.querySelectorAll(`${be} [aria-controls]`).forEach(t=>{const n=document.getElementById(t.getAttribute("aria-controls"));n&&y(n,V,"")})}const le=new WeakSet;function ze(e){document.querySelectorAll(fe).forEach(t=>{le.has(t)||(le.add(t),e.observe(t,{subtree:!0,characterData:!0}))})}function Fe(){document.querySelectorAll(`[${U}]`).forEach(e=>e.removeAttribute(U)),document.querySelectorAll(`[${V}]`).forEach(e=>e.removeAttribute(V))}function Ge({label:e,icon:t,shortcut:n,onSelect:i}){const o=document.createElement("hr");o.setAttribute("data-slot","menu-v2-separator");const r=document.createElement("div");r.setAttribute("role","menuitem"),r.setAttribute("data-component","menu-v2-item");const s=document.createElement("span");if(s.setAttribute("data-slot","menu-v2-item-content"),t(s),s.append(e),r.append(s),n){const c=document.createElement("span");c.setAttribute("data-slot","menu-v2-item-shortcut"),c.textContent=n,r.append(c)}return r.addEventListener("pointerenter",()=>r.setAttribute("data-highlighted","")),r.addEventListener("pointerleave",()=>r.removeAttribute("data-highlighted")),r.addEventListener("click",()=>{r.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:!0})),i()}),queueMicrotask(()=>{const c=r.closest('[role="menu"]')?.querySelector("[data-appearance]")?.getAttribute("data-appearance");c&&(r.setAttribute("data-appearance",c),o.setAttribute("data-appearance",c))}),[o,r]}function ye(e={}){const t=e.archiveAfterHours;return{archiveAfterHours:typeof t=="number"&&t>=0?t:12,hideAgent:typeof e.hideAgent=="string"||e.hideAgent===!1?e.hideAgent:"build",responseLabel:typeof e.responseLabel=="string"?e.responseLabel:e.responseLabel===!1?"":"Response",lowercaseVariants:e.lowercaseVariants!==!1}}const b='[data-slot="sidebar-inbox"]',ee='[data-slot="sidebar-inbox-scroll"]',H='[data-slot="sidebar-inbox-working"]',te=`${ee} > div.pt-3`,d='[data-slot="sidebar-inbox-item"]',w="data-plus-shelf",L="data-plus-toggle",ne="data-plus-count",k="data-plus-group",_="data-plus-gap",x="data-plus-member",O="data-plus-inline",T="data-plus-add",J=`${b} ${d}[data-status="ready"]:not([data-state="active"], :hover:not(:has([${T}]:hover)), :focus-visible, [${w}] > *)`,Ue='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5L8 9.5L11.5 6.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',Ve=`
${te} {
  order: 100000;
  margin-top: auto;
}
${b}[${O}] {
  overflow-y: auto;
  gap: 1px;
  padding-bottom: 4px;
}
[${O}] > ${ee},
[${O}] > ${H},
[${O}] > ${H} > div {
  display: contents;
}
[${O}] > ${H} > button {
  display: none;
}
[${w}] > [${L}] {
  border-radius: 6px;
}
[${w}] > [${L}]:hover {
  color: var(--color-v2-text-text-base);
}
[${w}] > [${L}]:focus-visible {
  outline: none;
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${w}] > [${L}]::before {
  content: attr(${ne});
  order: 1;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-faint);
}
[${w}] > [${L}]::after {
  content: "";
  order: 2;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(Ue)}") center / 16px no-repeat;
}
[${w}="closed"] > [${L}]::after {
  rotate: -90deg;
}
[${w}="closed"] > [${L}]:dir(rtl)::after {
  rotate: 90deg;
}
[${w}="closed"] > ${d}:not([data-state="active"]) {
  display: none;
}
${b} ${d}[data-status="working"] {
  opacity: 1;
}
${b} ${d}[data-status="working"] > span:nth-of-type(2) {
  color: var(--color-v2-text-text-base);
}
/* T3 Code's Working colors: sky-600 text and a sky-500 pulsing dot, or sky-300 at 80% in dark mode. */
${b} {
  --plus-working: oklch(58.8% 0.158 241.966);
  --plus-working-dot: oklch(68.5% 0.169 237.323);
  --plus-working-peak: oklch(74.6% 0.16 232.661);
}
[data-color-scheme="dark"] ${b} {
  --plus-working: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-dot: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-peak: oklch(95.1% 0.026 236.824);
}
${b} ${d}[data-status="working"] > span:first-child > span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--plus-working);
}
${b} ${d}[data-status="working"] > span:first-child > span:last-child > span {
  color: inherit;
}
${b} ${d}[data-status="working"] [data-component="text-shimmer"] {
  --text-shimmer-base-color: var(--plus-working);
  --text-shimmer-peak-color: var(--plus-working-peak);
}
${b} ${d}[data-status="working"] > span:first-child > span:last-child::before {
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
  ${b} ${d}[data-status="working"] > span:first-child > span:last-child::before {
    animation: none;
  }
}
${b} ${d} > span,
${b} ${d} > span:first-child > span {
  transition: opacity 150ms;
}
${J}:not([${x}]) > span,
${J}[${x}] > span:not(:first-child),
${J}[${x}] > span:first-child > span:last-child {
  opacity: 0.6;
}
/* In a project group the heading names the project, so rows drop their project line and show the time beside the
   title: the first line dissolves into the row's grid, keeping only its last part, the time or status. */
${d}[${x}] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "title status";
  column-gap: 8px;
}
${d}[${x}] > span:first-child {
  display: contents;
}
${d}[${x}] > span:first-child > span:not(:last-child) {
  display: none;
}
${d}[${x}] > span:first-child > span:last-child {
  grid-area: status;
}
${d}[${x}] > span:nth-of-type(2) {
  grid-area: title;
}
${d}[${x}] > span:nth-of-type(3) {
  grid-column: 1 / -1;
}
/* The same space before every project; a group's heading takes its own 28px on top of it. */
${d}[${_}] {
  margin-top: 16px;
}
${d}[${k}] {
  position: relative;
  margin-top: 28px;
}
${d}[${k}][${_}] {
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
${d}[${k}] > [${T}] {
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
${d}[${k}] > [${T}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
${d}[${k}]:not([data-state="active"]):has(> [${T}]:hover) {
  background-color: transparent;
}
`,P=e=>e?Array.from(e.children).filter(t=>t.matches(d)):[],_e=e=>e.querySelector(":scope > span:first-child > span.truncate")?.textContent?.trim(),$e=e=>{e.style.removeProperty("order"),e.style.length===0&&e.removeAttribute("style"),e.removeAttribute(k),e.removeAttribute(_),e.removeAttribute(x)};function Ke(e){const t=e?"open":"closed";document.querySelectorAll(te).forEach(n=>{const i=n.firstElementChild;!i||i.matches(d)||(y(n,w,t),y(i,L,""),y(i,ne,String(P(n).length)),y(i,"role","button"),y(i,"tabindex","0"),y(i,"aria-expanded",String(e)))})}function Je(e){const t=o=>o.target instanceof Element?o.target.closest(`${te} > [${L}]`):null,n=o=>{t(o)&&e()},i=o=>{o.key!=="Enter"&&o.key!==" "||!t(o)||(o.preventDefault(),e())};return document.addEventListener("click",n),document.addEventListener("keydown",i),()=>{document.removeEventListener("click",n),document.removeEventListener("keydown",i)}}const de=(e,t,n=[])=>{const i=[...n,...e];if(!t&&n.length===0)return i.forEach($e);const o=new Map;i.forEach(s=>{const c=t&&_e(s)||s;o.set(c,[...o.get(c)??[],s])});let r=0;Array.from(o).forEach(([s,c],f)=>{const a=t&&typeof s=="string"&&c.length>1;c.forEach((p,q)=>{r+=1,p.style.order!==String(r)&&(p.style.order=String(r)),B(p,k,a&&q===0?s:void 0),B(p,x,a?"":void 0),B(p,_,t&&f>0&&q===0?"":void 0)})})};function we(e,t){document.querySelectorAll(b).forEach(n=>{const i=n.querySelector(`:scope > ${ee}`),o=n.querySelector(`:scope > ${H} > div`),r=new Set;t?(y(n,O,""),n.querySelector(`:scope > ${H} > button[aria-expanded="false"]`)?.click(),de(P(i),e,P(o)),r.add(i).add(o)):n.removeAttribute(O),new Set(Array.from(n.querySelectorAll(d),s=>s.parentElement)).forEach(s=>{if(r.has(s))return;const c=s.getAttribute(w)==="closed",f=P(s).filter(a=>!c||a.getAttribute("data-state")==="active");P(s).filter(a=>!f.includes(a)).forEach($e),de(f,e)})})}function Ye(e){document.querySelectorAll(`${d} > [${T}]`).forEach(t=>{t.parentElement.getAttribute(k)!==t.getAttribute(T)&&t.remove()}),document.querySelectorAll(`${d}[${k}]`).forEach(t=>{t.querySelector(`:scope > [${T}]`)||t.append(e(t.getAttribute(k)))})}function Xe({name:e,label:t,icon:n,onSelect:i}){const o=document.createElement("div"),r=s=>{s.preventDefault(),s.stopPropagation(),i()};return o.setAttribute(T,e),o.setAttribute("role","button"),o.setAttribute("tabindex","0"),o.setAttribute("aria-label",t),o.setAttribute("title",t),n(o),o.addEventListener("pointerdown",s=>s.stopPropagation()),o.addEventListener("click",r),o.addEventListener("keydown",s=>{(s.key==="Enter"||s.key===" ")&&r(s)}),o}function Qe(){we(!1,!1),document.querySelectorAll(`[${T}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${w}]`).forEach(e=>e.removeAttribute(w)),document.querySelectorAll(`[${L}]`).forEach(e=>{[L,ne,"role","tabindex","aria-expanded"].forEach(t=>e.removeAttribute(t))})}const Ze="[data-timeline-virtual-content]",ke='[data-slot="session-turn-message-container"]',z="data-plus-final",Y=`[${z}] > [data-component="session-turn"] > ${ke}`,oe="--plus-label-half";function et(e){return`
${Y} {
  --plus-gap: calc(var(${oe}, ${e.length*3.75}px) + 12px);
  position: relative;
}
${Y}::before {
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
${Y}::after {
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
`}let ue=!1;function tt(e){const t=document.querySelector(ke);if(ue||!e||!t||document.fonts?.status==="loading")return;const n=document.createElement("span");n.textContent=e,n.style.cssText="position: absolute; visibility: hidden; white-space: nowrap; font-size: 13px; font-weight: 440; letter-spacing: -0.04px",t.append(n);const i=n.getBoundingClientRect().width;n.remove(),i&&(document.documentElement.style.setProperty(oe,`${i/2}px`),ue=!0)}const N=e=>e?.frame?.getAttribute("data-timeline-row"),C=e=>e?.frame?.getAttribute("data-message-id"),X=e=>N(e)==="AssistantPart"&&!!e.frame.querySelector('[data-component="text-part"]')&&!e.frame.querySelector('[data-component="tool-part-wrapper"], [data-timeline-part-ids]');function nt(e){document.querySelectorAll(Ze).forEach(t=>{const n=Array.from(t.querySelectorAll(":scope > div > [data-timeline-key]"),a=>({wrapper:a,frame:a.querySelector(":scope > [data-index] > [data-timeline-row]"),top:parseFloat(a.style.top),height:parseFloat(a.style.height)})).sort((a,p)=>a.top-p.top),i=t.querySelector(':scope > [data-timeline-row="bottom-spacer"]'),o=a=>n[a+1]&&Math.abs(n[a+1].top-(n[a].top+n[a].height))<2?n[a+1]:void 0,r=a=>n[a-1]&&Math.abs(n[a].top-(n[a-1].top+n[a-1].height))<2?n[a-1]:void 0,s=a=>a===n.length-1&&!!i&&Math.abs(n[a].wrapper.getBoundingClientRect().bottom-i.getBoundingClientRect().top)<2,c=e?void 0:!0,f=a=>{const p=o(a);return p?p.frame?N(p)==="TurnGap"||N(p)==="UserMessage"||C(p)&&C(p)!==C(n[a])||N(p)==="TurnDiff"||N(p)==="TurnDivider"?!0:N(p)==="AssistantPart"||N(p)==="Thinking"?!1:c:c:n[a+1]||!s(a)?void 0:c};n.forEach((a,p)=>{if(!X(a))return Q(a,!1);const q=f(p);if(q===void 0)return;if(!q){const E=o(p);X(E)&&C(E)===C(a)||Q(a,!1);return}let A=p;for(;X(r(A))&&C(r(A))===C(a);)A-=1;for(let E=A;E<=p;E+=1)Q(n[E],E===A&&n[E].frame.hasAttribute("data-timeline-spacing"))})})}const W=new Map,Q=(e,t)=>{!e.frame||e.frame.hasAttribute(z)===t||(B(e.frame,z,t?"":void 0),W.set(e.frame.parentElement,10))};function ot(){W.forEach((e,t)=>{if(!(t.isConnected&&Math.abs(t.offsetHeight-parseFloat(t.parentElement.style.height))>=1)||e===0)return W.delete(t);W.set(t,e-1),t.style.paddingBottom="1px",requestAnimationFrame(()=>t.style.removeProperty("padding-bottom"))})}const rt=()=>W.size>0;function st(){document.querySelectorAll(`[${z}]`).forEach(e=>e.removeAttribute(z)),document.documentElement.style.removeProperty(oe)}const Ae=60*1e3,at=60*Ae,pe="tab.new",Z="sidecar";function it(e){const t=ye(e.options),{shelf:n,groups:i,working:o}=e.stores,r=(l,m)=>g=>Le.insert(g,()=>xe.createComponent(e.ui.Icon,{name:l,...m})),s=()=>{const l=e.sessions.current();try{const m=l?.server.data.session;return!!l&&(m.status(l.id)==="running"||m.pending.list(l.id).some(g=>g.type!=="synthetic"))}catch{return!1}},c=()=>n.update(l=>{l.archivedOpen=!l.archivedOpen}),f=async l=>{const g=(await e.client.project.list()).filter(v=>(v.name||v.canonical.split("/").pop())===l).toSorted((v,R)=>R.time.active-v.time.active)[0];if(!g)return e.layout.project(Z,e.t("session.new"));e.layout.draft({server:Z,directory:g.canonical,prompt:""})},a=l=>Xe({name:l,label:e.t("session.newIn",{project:l}),icon:r("plus",{size:"small"}),onSelect:()=>{f(l).catch(()=>e.toast.show({title:e.t("session.failed",{project:l})}))}}),p=async(l,m)=>{const g={directory:l};let{data:v}=await e.client.shell.create({location:g,command:m,timeout:Ae});try{for(;v.status==="running";)await new Promise(j=>setTimeout(j,100)),v=(await e.client.shell.get({id:v.id,location:g})).data;const{data:R}=await e.client.shell.output({id:v.id,location:g});return{ok:v.exit===0,output:R.output}}finally{e.client.shell.remove({id:v.id,location:g}).catch(()=>{})}},q=async l=>{const m=await De(l,()=>e.client.project.list()),g=m&&await p(m,Oe);if(!g?.ok)return e.toast.show({variant:"error",title:e.t("branch.unlisted"),description:g?.output.trim()});const{current:v,options:R}=Re(g.output),j=await e.dialogs.select({title:e.t("branch.switch"),placeholder:e.t("branch.search"),options:R,current:v});if(!j||j===v)return;const se=await p(m,Pe(j));if(!se.ok)return e.toast.show({variant:"error",title:e.t("branch.failed",{branch:j}),description:se.output.trim()});const ae=e.servers.get(Z)?.data;ae?.location.vcs.invalidate({directory:m}),await ae?.location.vcs.sync({directory:m})};let A=!1;const E=l=>{A||(A=!0,q(l).catch(m=>e.toast.show({variant:"error",title:e.t("branch.error"),description:String(m?.message??m)})).finally(()=>{A=!1}))},F=()=>{Ke(n.value.archivedOpen),we(i.value.enabled,o.value.inline),Ye(a),je(e.t("branch.switch")),We(t.hideAgent),ze(re),tt(t.responseLabel),ot(),nt(s()),rt()&&!u&&(u=setTimeout(()=>{u=0,h()},300))};let I=0,u=0;const h=()=>{I||(I=requestAnimationFrame(()=>{I=0,F()}))},S=new MutationObserver(h);S.observe(document.body,{childList:!0,subtree:!0});const re=new MutationObserver(h);document.addEventListener("scrollend",h,!0);const Ee=Je(c),Se=Me(E);return $.createKeyed(()=>`${n.value.archivedOpen}:${i.value.enabled}:${o.value.inline}:${s()}`,F),e.add($.Style,Ve),e.add($.Style,Ne),e.add($.Style,He(t)),e.add($.Style,et(t.responseLabel)),e.add($.Slot,{at:"session.location.menu",order:100,render:l=>Ge({label:e.t("session.new"),icon:r("edit",{class:"shrink-0 text-v2-icon-icon-muted"}),shortcut:e.keybinds.keybind(pe).join(""),onSelect:()=>{e.commands.run(pe)||e.layout.draft({server:l.session.server.id,directory:l.session.directory,prompt:""})}})}),e.add($.Command,()=>({id:"toggle-archived",title:e.t(n.value.archivedOpen?"archived.hide":"archived.show"),keywords:"archive archived settled sessions sidebar inbox",run:c})),e.add($.Command,()=>({id:"toggle-groups",title:e.t(i.value.enabled?"groups.off":"groups.on"),keywords:"group project projects folders sessions sidebar inbox",run:()=>i.update(l=>{l.enabled=!l.enabled})})),e.add($.Command,()=>({id:"toggle-working",title:e.t(o.value.inline?"working.section":"working.inline"),keywords:"working running busy section shelf sessions sidebar inbox",run:()=>o.update(l=>{l.inline=!l.inline})})),()=>{S.disconnect(),re.disconnect(),cancelAnimationFrame(I),clearTimeout(u),document.removeEventListener("scrollend",h,!0),Ee(),Se(),Qe(),Be(),Fe(),st()}}function ct(e){const{archiveAfterHours:t}=ye(e.options);if(t>0)return Te(e,t*at)}const lt=$.Plugin.define({stores:{shelf:$.Store.global(M.Schema.Struct({archivedOpen:M.Schema.Boolean}),{archivedOpen:!1}),groups:$.Store.global(M.Schema.Struct({enabled:M.Schema.Boolean}),{enabled:!0}),working:$.Store.global(M.Schema.Struct({inline:M.Schema.Boolean}),{inline:!0})},i18n:{en:{"archived.show":"Show archived sessions","archived.hide":"Hide archived sessions","groups.on":"Group sessions by project","groups.off":"Stop grouping sessions by project","working.inline":"Show working sessions in the list","working.section":"Show working sessions in their own section","session.new":"New session","session.newIn":"New session in {{project}}","session.failed":"Could not start a session in {{project}}","branch.switch":"Switch branch","branch.search":"Search branches","branch.unlisted":"Could not list the branches","branch.failed":"Could not switch to {{branch}}","branch.error":"Could not switch the branch"}},setup:it,main:ct});exports.default=lt;
