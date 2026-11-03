"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const S=require("@opencode/plugin/gui"),H=require("effect"),V=require("solid-js"),ie=require("solid-js/web"),Qe=require("@opencode/client/solid"),ee=60*1e3,ce=200,Ae=["session.inbox.enqueued","session.execution.started","session.unarchived"],Ee=Symbol.for("opencode-plus.archive");function Ze(e,t,n,o){const{created:r,updated:s,busy:a,idle:c,archived:g}=e.time;if(g!==void 0||e.parentID||a!==void 0&&(c===void 0||a>c))return!1;const i=Math.max(r,a??0,c??0);return(Number(e.metadata?.[o])||0)>=i||t-s<2*ee?!1:t-i>=n}function et(e,t){const n=`${e.id}.keptAt`,o=Date.now(),r=new AbortController,s=r.signal,a=p=>e.log.write("error",`${e.id}: ${p?.stack??p}`),c=async()=>{const p=[];let b=await e.client.session.list({parentID:null,archived:!1,limit:ce});for(;;){if(p.push(...b.data),b.data.length<ce||!b.cursor.next)return p;b=await e.client.session.list({cursor:b.cursor.next,limit:ce})}};let g=!1;const i=async()=>{if(!g){g=!0;try{const p=Date.now(),b=(await c()).filter(l=>Ze(l,p,t,n));for(const l of b)await e.client.session.update({sessionID:l.id,archived:!0}),e.log.write("info",`${e.id}: archived ${l.id} "${l.title??""}"`)}finally{g=!1}}},u=async p=>{if(!Ae.includes(p.type)||p.created<o-ee||p.type==="session.inbox.enqueued"&&p.data.item.type!=="user")return;const b=await e.client.session.get({sessionID:p.data.sessionID}),l=b.time.archived;if(p.type!=="session.unarchived"){if(l===void 0||p.created<=l)return;await e.client.session.update({sessionID:b.id,archived:!1}),e.log.write("info",`${e.id}: unarchived ${b.id} on ${p.type}`);return}l!==void 0||(Number(b.metadata?.[n])||0)>=p.created||await e.client.session.update({sessionID:b.id,metadata:{...b.metadata,[n]:p.created}})},v=async()=>{for(;!s.aborted;){try{const p=e.client.event.subscribe({types:Ae},{signal:s});for await(const b of p)u(b).catch(a)}catch(p){s.aborted||a(p)}s.aborted||await new Promise(p=>setTimeout(p,5e3))}},h=()=>{i().catch(a)},f=setTimeout(h,ee),E=setInterval(h,10*ee),N=()=>{s.aborted||(clearTimeout(f),clearInterval(E),r.abort())};return globalThis[Ee]?.(),globalThis[Ee]=N,e.signal.addEventListener("abort",N,{once:!0}),v(),N}const O=(e,t,n)=>{e.getAttribute(t)!==n&&e.setAttribute(t,n)},U=(e,t,n)=>n===void 0?e.removeAttribute(t):O(e,t,n),qe='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5L8 9.5L11.5 6.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',Ne='[data-slot="new-session-composer"]',tt='[data-slot="new-session-location-path"]',nt=["branch","new-branch"].map(e=>`${Ne} use[href="#opencode-v2-icon-${e}"]`).join(", "),z="data-plus-branch",Q="data-plus-branch-trigger",_="data-plus-branch-menu",Re="data-plus-branch-current",ot='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M3.53564 8.17857L6.39279 11.75L12.4642 4.25" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',rt=`
[${z}] {
  position: relative;
  border-radius: var(--radius-sm);
}
[${z}]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline: -2px -4px;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(qe)}") center / 16px no-repeat;
}
[${z}]:is(:hover, :has(:focus-visible), :has([data-expanded])) {
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${Q}] {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
[${Q}] > button {
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
[${_}] [${Re}]::after {
  background-color: var(--menu-v2-icon);
  mask: url("data:image/svg+xml,${encodeURIComponent(ot)}") center / 14px no-repeat;
}
`,at="git branch --all --no-color --no-column --sort=-committerdate",K=new Map;function st(e){K.forEach((t,n)=>{n.isConnected||(t(),K.delete(n))}),document.querySelectorAll(nt).forEach(t=>{const n=t.closest("svg").parentElement;if(K.has(n))return;const o=document.createElement("div");o.setAttribute(Q,""),n.setAttribute(z,""),n.append(o),K.set(n,e(o,n))})}function it(){document.querySelectorAll(`[${Q}] > [aria-controls]`).forEach(e=>{const t=document.getElementById(e.getAttribute("aria-controls"));if(!t)return;const n=e.closest(`[${z}]`).querySelector(":scope > span").textContent.trim();O(t,_,""),t.querySelectorAll('[data-component="menu-v2-item"]').forEach(o=>{const r=o.querySelector('[data-slot="menu-v2-item-content"] > span');U(o,Re,o.textContent.trim()===n?"":void 0),r&&U(o,"title",r.scrollWidth>r.clientWidth?r.textContent:void 0)})})}async function ct(e,t){const n=e.closest(Ne)?.querySelector(tt)?.textContent??"";if(!n.includes("…"))return n||void 0;const[o,r]=n.split("…");return(await t()).flatMap(s=>[s.canonical,...s.sandboxes]).find(s=>s.startsWith(o)&&s.endsWith(r))}function lt(e){const t=new Set,n=[],o=new Map;let r;for(const a of e.split(/\r?\n/)){const c=a.slice(2).trim();if(!(!c||c.startsWith("(")||c.includes(" -> "))){if(c.startsWith("remotes/")){const g=c.slice(8),i=g.slice(g.indexOf("/")+1);o.has(i)||o.set(i,g);continue}t.add(c),a.startsWith("*")&&(r=c),a.startsWith("+")||n.push(c)}}const s=Array.from(o,([a,c])=>({name:a,ref:c})).filter(({name:a})=>!t.has(a));return{current:r,local:n,remote:s}}const dt=(...e)=>["git","switch",...e.map(ut)].join(" "),ut=e=>/^[\w./-]+$/.test(e)?e:`'${e.replaceAll("'","'\\''")}'`;function pt(){K.forEach(e=>e()),K.clear(),document.querySelectorAll(`[${Q}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${z}]`).forEach(e=>e.removeAttribute(z))}const Me='[data-slot="composer-controls"]',Oe=`${Me} > div > [data-component="tooltip-v2-trigger"]`,De='[data-action="composer-model"]',je=`${Oe}:has(~ [data-component="tooltip-v2-trigger"] ${De})`,Be=`${Oe}:has(${De}) ~ [data-component="tooltip-v2-trigger"]`,te="data-plus-hidden-agent",ne="data-plus-variant-menu";function ht({lowercaseVariants:e}){return`
${je}[${te}] {
  display: none;
}
${e?`${Be} .capitalize,
[${ne}] .capitalize {
  text-transform: lowercase;
}`:""}
`}function mt(e){document.querySelectorAll(je).forEach(t=>{const n=e!==!1&&t.textContent.trim().toLowerCase()===e.toLowerCase();U(t,te,n?"":void 0)}),document.querySelectorAll(`${Be} [aria-controls]`).forEach(t=>{const n=document.getElementById(t.getAttribute("aria-controls"));n&&O(n,ne,"")})}const xe=new WeakSet;function ft(e){document.querySelectorAll(Me).forEach(t=>{xe.has(t)||(xe.add(t),e.observe(t,{subtree:!0,characterData:!0}))})}function gt(){document.querySelectorAll(`[${te}]`).forEach(e=>e.removeAttribute(te)),document.querySelectorAll(`[${ne}]`).forEach(e=>e.removeAttribute(ne))}function bt({label:e,icon:t,shortcut:n,onSelect:o}){const r=document.createElement("hr");r.setAttribute("data-slot","menu-v2-separator");const s=document.createElement("div");s.setAttribute("role","menuitem"),s.setAttribute("data-component","menu-v2-item");const a=document.createElement("span");if(a.setAttribute("data-slot","menu-v2-item-content"),t(a),a.append(e),s.append(a),n){const c=document.createElement("span");c.setAttribute("data-slot","menu-v2-item-shortcut"),c.textContent=n,s.append(c)}return s.addEventListener("pointerenter",()=>s.setAttribute("data-highlighted","")),s.addEventListener("pointerleave",()=>s.removeAttribute("data-highlighted")),s.addEventListener("click",()=>{s.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:!0})),o()}),queueMicrotask(()=>{const c=s.closest('[role="menu"]')?.querySelector("[data-appearance]")?.getAttribute("data-appearance");c&&(s.setAttribute("data-appearance",c),r.setAttribute("data-appearance",c))}),[r,s]}function Pe(e={}){const t=e.archiveAfterHours;return{archiveAfterHours:typeof t=="number"&&t>=0?t:12,hideAgent:typeof e.hideAgent=="string"||e.hideAgent===!1?e.hideAgent:"build",responseLabel:typeof e.responseLabel=="string"?e.responseLabel:e.responseLabel===!1?"":"Response",lowercaseVariants:e.lowercaseVariants!==!1}}const x='[data-slot="sidebar-inbox"]',ge='[data-slot="sidebar-inbox-scroll"]',Y='[data-slot="sidebar-inbox-working"]',be=`${ge} > div.pt-3`,m='[data-slot="sidebar-inbox-item"]',I="data-plus-shelf",M="data-plus-toggle",ve="data-plus-count",q="data-plus-group",oe="data-plus-gap",R="data-plus-member",W="data-plus-inline",D="data-plus-add",le=`${x} ${m}[data-status="ready"]:not([data-state="active"], :hover:not(:has([${D}]:hover)), :focus-visible, [${I}] > *)`,vt=`
${be} {
  order: 100000;
  margin-top: auto;
}
${x}[${W}] {
  overflow-y: auto;
  gap: 1px;
  padding-bottom: 4px;
}
[${W}] > ${ge},
[${W}] > ${Y},
[${W}] > ${Y} > div {
  display: contents;
}
[${W}] > ${Y} > button {
  display: none;
}
[${I}] > [${M}] {
  border-radius: 6px;
}
[${I}] > [${M}]:hover {
  color: var(--color-v2-text-text-base);
}
[${I}] > [${M}]:focus-visible {
  outline: none;
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${I}] > [${M}]::before {
  content: attr(${ve});
  order: 1;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-faint);
}
[${I}] > [${M}]::after {
  content: "";
  order: 2;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(qe)}") center / 16px no-repeat;
}
[${I}="closed"] > [${M}]::after {
  rotate: -90deg;
}
[${I}="closed"] > [${M}]:dir(rtl)::after {
  rotate: 90deg;
}
[${I}="closed"] > ${m}:not([data-state="active"]) {
  display: none;
}
${x} ${m}[data-status="working"] {
  opacity: 1;
}
${x} ${m}[data-status="working"] > span:nth-of-type(2) {
  color: var(--color-v2-text-text-base);
}
/* T3 Code's Working colors: sky-600 text and a sky-500 pulsing dot, or sky-300 at 80% in dark mode. */
${x} {
  --plus-working: oklch(58.8% 0.158 241.966);
  --plus-working-dot: oklch(68.5% 0.169 237.323);
  --plus-working-peak: oklch(74.6% 0.16 232.661);
}
[data-color-scheme="dark"] ${x} {
  --plus-working: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-dot: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-peak: oklch(95.1% 0.026 236.824);
}
${x} ${m}[data-status="working"] > span:first-child > span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--plus-working);
}
${x} ${m}[data-status="working"] > span:first-child > span:last-child > span {
  color: inherit;
}
${x} ${m}[data-status="working"] [data-component="text-shimmer"] {
  --text-shimmer-base-color: var(--plus-working);
  --text-shimmer-peak-color: var(--plus-working-peak);
}
${x} ${m}[data-status="working"] > span:first-child > span:last-child::before {
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
  ${x} ${m}[data-status="working"] > span:first-child > span:last-child::before {
    animation: none;
  }
}
${x} ${m} > span,
${x} ${m} > span:first-child > span {
  transition: opacity 150ms;
}
${le}:not([${R}]) > span,
${le}[${R}] > span:not(:first-child),
${le}[${R}] > span:first-child > span:last-child {
  opacity: 0.6;
}
/* In a project group the heading names the project, so rows drop their project line and show the time beside the
   title: the first line dissolves into the row's grid, keeping only its last part, the time or status. */
${m}[${R}] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "title status";
  column-gap: 8px;
}
${m}[${R}] > span:first-child {
  display: contents;
}
${m}[${R}] > span:first-child > span:not(:last-child) {
  display: none;
}
${m}[${R}] > span:first-child > span:last-child {
  grid-area: status;
}
${m}[${R}] > span:nth-of-type(2) {
  grid-area: title;
}
${m}[${R}] > span:nth-of-type(3) {
  grid-column: 1 / -1;
}
/* The same space before every project; a group's heading takes its own 28px on top of it. */
${m}[${oe}] {
  margin-top: 16px;
}
${m}[${q}] {
  position: relative;
  margin-top: 28px;
}
${m}[${q}][${oe}] {
  margin-top: 44px;
}
${m}[${q}]::before {
  content: attr(${q});
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
${m}[${q}] > span:first-child > span:first-child {
  display: flex;
  position: absolute;
  inset-inline-start: 6px;
  bottom: calc(100% + 8px);
  pointer-events: none;
}
/* The heading's + button, at the far end of its 24px line, its icon in line with the times of the rows below. */
${m}[${q}] > [${D}] {
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
${m}[${q}] > [${D}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
${m}[${q}]:not([data-state="active"]):has(> [${D}]:hover) {
  background-color: transparent;
}
`,J=e=>e?Array.from(e.children).filter(t=>t.matches(m)):[],yt=e=>e.querySelector(":scope > span:first-child > span.truncate")?.textContent?.trim(),We=e=>{e.style.removeProperty("order"),e.style.length===0&&e.removeAttribute("style"),e.removeAttribute(q),e.removeAttribute(oe),e.removeAttribute(R)};function wt(e){const t=e?"open":"closed";document.querySelectorAll(be).forEach(n=>{const o=n.firstElementChild;!o||o.matches(m)||(O(n,I,t),O(o,M,""),O(o,ve,String(J(n).length)),O(o,"role","button"),O(o,"tabindex","0"),O(o,"aria-expanded",String(e)))})}function $t(e){const t=r=>r.target instanceof Element?r.target.closest(`${be} > [${M}]`):null,n=r=>{t(r)&&e()},o=r=>{r.key!=="Enter"&&r.key!==" "||!t(r)||(r.preventDefault(),e())};return document.addEventListener("click",n),document.addEventListener("keydown",o),()=>{document.removeEventListener("click",n),document.removeEventListener("keydown",o)}}const Se=(e,t,n=[])=>{const o=[...n,...e];if(!t&&n.length===0)return o.forEach(We);const r=new Map;o.forEach(a=>{const c=t&&yt(a)||a;r.set(c,[...r.get(c)??[],a])});let s=0;Array.from(r).forEach(([a,c],g)=>{const i=t&&typeof a=="string"&&c.length>1;c.forEach((u,v)=>{s+=1,u.style.order!==String(s)&&(u.style.order=String(s)),U(u,q,i&&v===0?a:void 0),U(u,R,i?"":void 0),U(u,oe,t&&g>0&&v===0?"":void 0)})})};function Ue(e,t){document.querySelectorAll(x).forEach(n=>{const o=n.querySelector(`:scope > ${ge}`),r=n.querySelector(`:scope > ${Y} > div`),s=new Set;t?(O(n,W,""),n.querySelector(`:scope > ${Y} > button[aria-expanded="false"]`)?.click(),Se(J(o),e,J(r)),s.add(o).add(r)):n.removeAttribute(W),new Set(Array.from(n.querySelectorAll(m),a=>a.parentElement)).forEach(a=>{if(s.has(a))return;const c=a.getAttribute(I)==="closed",g=J(a).filter(i=>!c||i.getAttribute("data-state")==="active");J(a).filter(i=>!g.includes(i)).forEach(We),Se(g,e)})})}function kt(e){document.querySelectorAll(`${m} > [${D}]`).forEach(t=>{t.parentElement.getAttribute(q)!==t.getAttribute(D)&&t.remove()}),document.querySelectorAll(`${m}[${q}]`).forEach(t=>{t.querySelector(`:scope > [${D}]`)||t.append(e(t.getAttribute(q)))})}function At({name:e,label:t,icon:n,onSelect:o}){const r=document.createElement("div"),s=a=>{a.preventDefault(),a.stopPropagation(),o()};return r.setAttribute(D,e),r.setAttribute("role","button"),r.setAttribute("tabindex","0"),r.setAttribute("aria-label",t),r.setAttribute("title",t),n(r),r.addEventListener("pointerdown",a=>a.stopPropagation()),r.addEventListener("click",s),r.addEventListener("keydown",a=>{(a.key==="Enter"||a.key===" ")&&s(a)}),r}function Et(){Ue(!1,!1),document.querySelectorAll(`[${D}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${I}]`).forEach(e=>e.removeAttribute(I)),document.querySelectorAll(`[${M}]`).forEach(e=>{[M,ve,"role","tabindex","aria-expanded"].forEach(t=>e.removeAttribute(t))})}const xt="[data-timeline-virtual-content]",ze='[data-slot="session-turn-message-container"]',Z="data-plus-final",de=`[${Z}] > [data-component="session-turn"] > ${ze}`,ye="--plus-label-half";function St(e){return`
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
`}let Le=!1;function Lt(e){const t=document.querySelector(ze);if(Le||!e||!t||document.fonts?.status==="loading")return;const n=document.createElement("span");n.textContent=e,n.style.cssText="position: absolute; visibility: hidden; white-space: nowrap; font-size: 13px; font-weight: 440; letter-spacing: -0.04px",t.append(n);const o=n.getBoundingClientRect().width;n.remove(),o&&(document.documentElement.style.setProperty(ye,`${o/2}px`),Le=!0)}const P=e=>e?.frame?.getAttribute("data-timeline-row"),B=e=>e?.frame?.getAttribute("data-message-id"),ue=e=>P(e)==="AssistantPart"&&!!e.frame.querySelector('[data-component="text-part"]')&&!e.frame.querySelector('[data-component="tool-part-wrapper"], [data-timeline-part-ids]');function Ct(e){document.querySelectorAll(xt).forEach(t=>{const n=Array.from(t.querySelectorAll(":scope > div > [data-timeline-key]"),i=>({wrapper:i,frame:i.querySelector(":scope > [data-index] > [data-timeline-row]"),top:parseFloat(i.style.top),height:parseFloat(i.style.height)})).sort((i,u)=>i.top-u.top),o=t.querySelector(':scope > [data-timeline-row="bottom-spacer"]'),r=i=>n[i+1]&&Math.abs(n[i+1].top-(n[i].top+n[i].height))<2?n[i+1]:void 0,s=i=>n[i-1]&&Math.abs(n[i].top-(n[i-1].top+n[i-1].height))<2?n[i-1]:void 0,a=i=>i===n.length-1&&!!o&&Math.abs(n[i].wrapper.getBoundingClientRect().bottom-o.getBoundingClientRect().top)<2,c=e?void 0:!0,g=i=>{const u=r(i);return u?u.frame?P(u)==="TurnGap"||P(u)==="UserMessage"||B(u)&&B(u)!==B(n[i])||P(u)==="TurnDiff"||P(u)==="TurnDivider"?!0:P(u)==="AssistantPart"||P(u)==="Thinking"?!1:c:c:n[i+1]||!a(i)?void 0:c};n.forEach((i,u)=>{if(!ue(i))return pe(i,!1);const v=g(u);if(v===void 0)return;if(!v){const f=r(u);ue(f)&&B(f)===B(i)||pe(i,!1);return}let h=u;for(;ue(s(h))&&B(s(h))===B(i);)h-=1;for(let f=h;f<=u;f+=1)pe(n[f],f===h&&n[f].frame.hasAttribute("data-timeline-spacing"))})})}const X=new Map,pe=(e,t)=>{!e.frame||e.frame.hasAttribute(Z)===t||(U(e.frame,Z,t?"":void 0),X.set(e.frame.parentElement,10))};function Tt(){X.forEach((e,t)=>{if(!(t.isConnected&&Math.abs(t.offsetHeight-parseFloat(t.parentElement.style.height))>=1)||e===0)return X.delete(t);X.set(t,e-1),t.style.paddingBottom="1px",requestAnimationFrame(()=>t.style.removeProperty("padding-bottom"))})}const It=()=>X.size>0;function qt(){document.querySelectorAll(`[${Z}]`).forEach(e=>e.removeAttribute(Z)),document.documentElement.style.removeProperty(ye)}const Nt='[data-component="tooltip-v2-trigger"] > button:not([aria-haspopup]):has([data-component="progress-circle"])',A="data-plus-usage",Ce="plus-usage-card",fe="data-plus-usage-hover",Rt=50,Mt=100,Ot=4,Dt=`
:root[${fe}] [data-component="tooltip-v2"]:not([data-force-open="true"]) {
  display: none;
}
[${A}] {
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
[${A}]:dir(rtl) {
  transform-origin: top left;
}
[${A}] [data-part="row"] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
  white-space: nowrap;
}
[${A}] [data-part="row"] > :last-child {
  margin-inline-start: auto;
}
[${A}] :is([data-part="value"], [data-part="percent"]) {
  color: var(--v2-text-text-base);
}
[${A}] [data-part="percent"] {
  font-weight: 530;
}
[${A}] [data-part="bar"] {
  display: flex;
  height: 8px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--v2-background-bg-layer-03);
}
[${A}] [data-part="bar"] > span {
  box-sizing: border-box;
  min-width: 3px;
}
/* A line in the card's color between kinds, as in Cursor's bar. */
[${A}] [data-part="bar"] > span + span {
  border-inline-start: 1px solid var(--v2-background-bg-layer-01);
}
[${A}] [data-part="legend"] {
  display: flex;
  flex-direction: column;
}
[${A}] [data-part="dot"] {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
[${A}] hr {
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
  [${A}] {
    animation: none;
  }
}
:root[data-motion="reduce"] [${A}] {
  animation: none;
}
`;function jt(e){let t,n,o=0;const r=document.documentElement,s=(l,L)=>{clearTimeout(o),o=setTimeout(l,L)},a=l=>l.target instanceof Element?l.target.closest(Nt):null,c=l=>l instanceof Node&&!!(t?.contains(l)||n?.card.contains(l)),g=()=>{if(!t.isConnected)return;const l=document.createElement("div"),L=t.closest("[data-theme]")?.getAttribute("data-theme");l.id=Ce,l.setAttribute(A,""),l.setAttribute("role","tooltip"),L&&l.setAttribute("data-theme",L),n={card:l,stop:e(l)},document.body.append(l),Ut(l,t),t.setAttribute("aria-describedby",Ce)},i=()=>{clearTimeout(o),n?.stop(),n?.card.remove(),n=void 0,t?.removeAttribute("aria-describedby")},u=l=>{if(l===t){n&&clearTimeout(o);return}v(),t=l,r.setAttribute(fe,""),s(g,Rt)},v=()=>{i(),t=void 0,r.removeAttribute(fe)},h=l=>{if(l.pointerType==="touch")return;const L=a(l);if(L)return u(L);if(n?.card.contains(l.target))return clearTimeout(o);t&&!t.isConnected&&v()},f=l=>{!t||c(l.relatedTarget)||!c(l.target)||(n?s(v,Mt):v())},E=l=>{t?.contains(l.target)&&i()},N=l=>{l.key==="Escape"&&i()},p=l=>{const L=a(l);L?.matches(":focus-visible")&&u(L)},b=l=>{t?.contains(l.target)&&!c(l.relatedTarget)&&v()};return document.addEventListener("pointerover",h),document.addEventListener("pointerout",f),document.addEventListener("pointerdown",E,!0),document.addEventListener("keydown",N),document.addEventListener("focusin",p),document.addEventListener("focusout",b),()=>{document.removeEventListener("pointerover",h),document.removeEventListener("pointerout",f),document.removeEventListener("pointerdown",E,!0),document.removeEventListener("keydown",N),document.removeEventListener("focusin",p),document.removeEventListener("focusout",b),v()}}function Bt(e){const t=e.server.data,n=e.directory?{directory:e.directory}:void 0,o=t.session.get(e.id),r=t.session.message.list(e.id),s=Qe.lastAssistantWithUsage(r,o?.revert?.messageID),a=s?.tokens,c=a?a.input+a.output+a.reasoning+a.cache.read+a.cache.write:0,g=s?Te(t,n,s.model)?.limit.context:void 0,i=t.session.cost(e.id),u=o?.model??r.findLast(f=>f.type==="assistant")?.model,v=u?Te(t,n,u):void 0,h=!!v&&v.cost.every(f=>!f.input&&!f.output&&!f.cache.read&&!f.cache.write);return{total:c,tokens:a,limit:g||void 0,percent:g?Math.round(c/g*100):void 0,cost:i>0||!h?i:void 0}}function Pt({total:e,tokens:t,limit:n,percent:o,cost:r},s,a){const c=h=>new Intl.NumberFormat(a,{notation:"compact",maximumFractionDigits:0}).format(h).toLocaleLowerCase(a),g=t?Wt.map(h=>({...h,value:h.value(t)})).filter(h=>h.value>0):[],i=Math.max(n??0,e),u=T("span",void 0,n?`${c(e)} / ${c(n)} `:c(e));n&&u.append(T("span","percent",`(${o}%)`));const v=[he([T("span",void 0,s("usage.window")),u])];if(i>0){const h=T("div","bar");h.setAttribute("aria-hidden","true"),g.forEach(f=>{const E=T("span");E.style.width=`${f.value/i*100}%`,E.style.background=f.color,h.append(E)}),v.push(h)}if(g.length){const h=T("div","legend");g.forEach(f=>{const E=T("span","dot");E.style.background=f.color,h.append(he([E,T("span",void 0,s(f.label)),T("span","value",f.value.toLocaleString(a))]))}),v.push(h)}if(r!==void 0){const h=new Intl.NumberFormat(a,{style:"currency",currency:"USD"});v.push(T("hr"),he([T("span",void 0,s("usage.cost")),T("span","value",h.format(r))]))}return v}const Wt=[{label:"usage.cacheRead",color:"var(--v2-avatar-border-blue)",value:e=>e.cache.read},{label:"usage.cacheWrite",color:"var(--v2-avatar-border-purple)",value:e=>e.cache.write},{label:"usage.input",color:"var(--v2-avatar-border-pink)",value:e=>e.input},{label:"usage.reasoning",color:"var(--v2-avatar-border-yellow)",value:e=>e.reasoning},{label:"usage.output",color:"var(--v2-avatar-border-green)",value:e=>e.output}],Te=(e,t,n)=>{const o=e.location.provider.list(t),r=e.location.model.list(t);if(o?.some(s=>s.id===n.providerID))return r?.findLast(s=>s.providerID===n.providerID&&s.id===n.id&&s.status!=="deprecated")},T=(e,t,n)=>{const o=document.createElement(e);return t&&o.setAttribute("data-part",t),n!==void 0&&(o.textContent=n),o},he=e=>{const t=T("div","row");return t.append(...e),t},Ut=(e,t)=>{const n=t.getBoundingClientRect(),o=e.offsetWidth,r=getComputedStyle(t).direction==="rtl"?n.left:n.right-o;e.style.top=`${n.bottom+Ot}px`,e.style.left=`${Math.max(8,Math.min(r,innerWidth-o-8))}px`},Fe=60*1e3,zt=60*Fe,Ie="tab.new",me="sidecar";function Ft(e){const t=Pe(e.options),{shelf:n,groups:o,working:r}=e.stores,s=(d,k)=>y=>ie.insert(y,()=>V.createComponent(e.ui.Icon,{name:d,...k})),a=()=>{const d=e.sessions.current();try{const k=d?.server.data.session;return!!d&&(k.status(d.id)==="running"||k.pending.list(d.id).some(y=>y.type!=="synthetic"))}catch{return!1}},c=()=>n.update(d=>{d.archivedOpen=!d.archivedOpen}),g=async d=>{const y=(await e.client.project.list()).filter(w=>(w.name||w.canonical.split("/").pop())===d).toSorted((w,C)=>C.time.active-w.time.active)[0];if(!y)return e.layout.project(me,e.t("session.new"));e.layout.draft({server:me,directory:y.canonical,prompt:""})},i=d=>At({name:d,label:e.t("session.newIn",{project:d}),icon:s("plus",{size:"small"}),onSelect:()=>{g(d).catch(()=>e.toast.show({title:e.t("session.failed",{project:d})}))}}),u=async(d,k)=>{const y={directory:d};let{data:w}=await e.client.shell.create({location:y,command:k,timeout:Fe});try{for(;w.status==="running";)await new Promise(F=>setTimeout(F,100)),w=(await e.client.shell.get({id:w.id,location:y})).data;const{data:C}=await e.client.shell.output({id:w.id,location:y});return{ok:w.exit===0,output:C.output}}finally{e.client.shell.remove({id:w.id,location:y}).catch(()=>{})}},v=async d=>{const k=await ct(d,()=>e.client.project.list()),y=k&&await u(k,at);return y?.ok?{directory:k,...lt(y.output)}:void 0},h=async(d,k,y)=>{const w=C=>e.toast.show({variant:"error",title:y,description:C.trim()});try{const C=await u(d,dt(...k));if(!C.ok)return w(C.output);const F=e.servers.get(me)?.data;F?.location.vcs.invalidate({directory:d}),await F?.location.vcs.sync({directory:d})}catch(C){w(String(C?.message??C))}},f=(d,k)=>V.createRoot(y=>{const[w,C]=V.createSignal(),[F,we]=V.createSignal(!1);let re=!1;const ae=()=>{re||(re=!0,v(k).catch(()=>{}).then($=>C($??null)).finally(()=>{re=!1}))},$e=async($,j)=>{we(!0),await h(w().directory,$,j),we(!1),ae()},Ve=$=>{$!==w().current&&$e([$],e.t("branch.failed",{branch:$}))},Ke=async()=>{const $=w().current,G=(await e.dialogs.prompt({title:e.t("branch.create"),description:$&&e.t("branch.from",{branch:$}),placeholder:e.t("branch.name"),submit:e.t("branch.submit")}))?.trim().replace(/\s+/g,"-");G&&await $e(["-c",G],e.t("branch.uncreated",{branch:G}))},ke=($,j=$)=>({label:j,onSelect:()=>Ve($)}),_e=()=>{const $=w();if($===void 0)return[{label:e.t("branch.loading"),disabled:!0}];if($===null)return[{label:e.t("branch.unlisted"),disabled:!0}];const j=[{label:e.t("branch.new"),icon:"plus",onSelect:()=>{Ke()}},{type:"separator"}],G=$.local.map(se=>ke(se));if($.remote.length===0)return[...j,...G];const Je=$.remote.map(({name:se,ref:Xe})=>ke(se,Xe)),Ye={type:"group",label:e.t("branch.remote"),items:Je};return[...j,...G,{type:"separator"},Ye]};return d.addEventListener("pointerenter",ae),d.addEventListener("focusin",ae),ie.insert(d,()=>V.createComponent(e.ui.Menu,{label:e.t("branch.switch"),trigger:"button",placement:"bottom-start",get disabled(){return F()},get items(){return _e()}})),y}),E=()=>{wt(n.value.archivedOpen),Ue(o.value.enabled,r.value.inline),kt(i),st(f),it(),mt(t.hideAgent),ft(L),Lt(t.responseLabel),Tt(),Ct(a()),It()&&!p&&(p=setTimeout(()=>{p=0,b()},300))};let N=0,p=0;const b=()=>{N||(N=requestAnimationFrame(()=>{N=0,E()}))},l=new MutationObserver(b);l.observe(document.body,{childList:!0,subtree:!0});const L=new MutationObserver(b);document.addEventListener("scrollend",b,!0);const Ge=$t(c),He=jt(d=>V.createRoot(k=>(ie.insert(d,()=>{const y=e.sessions.current();return y?Pt(Bt(y),e.t,e.locale.locale()):[]}),k)));return S.createKeyed(()=>`${n.value.archivedOpen}:${o.value.enabled}:${r.value.inline}:${a()}`,E),e.add(S.Style,vt),e.add(S.Style,rt),e.add(S.Style,ht(t)),e.add(S.Style,St(t.responseLabel)),e.add(S.Style,Dt),e.add(S.Slot,{at:"session.location.menu",order:100,render:d=>bt({label:e.t("session.new"),icon:s("edit",{class:"shrink-0 text-v2-icon-icon-muted"}),shortcut:e.keybinds.keybind(Ie).join(""),onSelect:()=>{e.commands.run(Ie)||e.layout.draft({server:d.session.server.id,directory:d.session.directory,prompt:""})}})}),e.add(S.Command,()=>({id:"toggle-archived",title:e.t(n.value.archivedOpen?"archived.hide":"archived.show"),keywords:"archive archived settled sessions sidebar inbox",run:c})),e.add(S.Command,()=>({id:"toggle-groups",title:e.t(o.value.enabled?"groups.off":"groups.on"),keywords:"group project projects folders sessions sidebar inbox",run:()=>o.update(d=>{d.enabled=!d.enabled})})),e.add(S.Command,()=>({id:"toggle-working",title:e.t(r.value.inline?"working.section":"working.inline"),keywords:"working running busy section shelf sessions sidebar inbox",run:()=>r.update(d=>{d.inline=!d.inline})})),()=>{l.disconnect(),L.disconnect(),cancelAnimationFrame(N),clearTimeout(p),document.removeEventListener("scrollend",b,!0),Ge(),He(),Et(),pt(),gt(),qt()}}function Gt(e){const{archiveAfterHours:t}=Pe(e.options);if(t>0)return et(e,t*zt)}const Ht=S.Plugin.define({stores:{shelf:S.Store.global(H.Schema.Struct({archivedOpen:H.Schema.Boolean}),{archivedOpen:!1}),groups:S.Store.global(H.Schema.Struct({enabled:H.Schema.Boolean}),{enabled:!0}),working:S.Store.global(H.Schema.Struct({inline:H.Schema.Boolean}),{inline:!0})},i18n:{en:{"archived.show":"Show archived sessions","archived.hide":"Hide archived sessions","groups.on":"Group sessions by project","groups.off":"Stop grouping sessions by project","working.inline":"Show working sessions in the list","working.section":"Show working sessions in their own section","session.new":"New session","session.newIn":"New session in {{project}}","session.failed":"Could not start a session in {{project}}","usage.window":"Context window","usage.cacheRead":"Cache read","usage.cacheWrite":"Cache write","usage.input":"Input","usage.reasoning":"Reasoning","usage.output":"Output","usage.cost":"Cost","branch.switch":"Switch branch","branch.loading":"Loading…","branch.unlisted":"Could not list the branches","branch.remote":"Remote","branch.failed":"Could not switch to {{branch}}","branch.new":"New branch…","branch.create":"Create branch","branch.from":"The new branch starts from {{branch}}, with your changes.","branch.name":"Branch name","branch.submit":"Create","branch.uncreated":"Could not create {{branch}}"}},setup:Ft,main:Gt});exports.default=Ht;
