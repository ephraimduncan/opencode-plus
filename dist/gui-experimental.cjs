"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const A=require("@opencode/plugin/gui"),wt=require("@opencode/plugin/gui/browser"),_=require("effect"),R=require("solid-js"),ie=require("solid-js/web"),kt=require("@opencode/client/solid"),ce=60*1e3,ge=200,Pe=["session.inbox.enqueued","session.execution.started","session.unarchived"],Be=Symbol.for("opencode-plus.archive");function Et(e,t,n,o){const{created:r,updated:a,busy:s,idle:i,archived:p}=e.time;if(p!==void 0||e.parentID||s!==void 0&&(i===void 0||s>i))return!1;const c=Math.max(r,s??0,i??0);return(Number(e.metadata?.[o])||0)>=c||t-a<2*ce?!1:t-c>=n}function At(e,t){const n=`${e.id}.keptAt`,o=Date.now(),r=new AbortController,a=r.signal,s=v=>e.log.write("error",`${e.id}: ${v?.stack??v}`),i=async()=>{const v=[];let $=await e.client.session.list({parentID:null,archived:!1,limit:ge});for(;;){if(v.push(...$.data),$.data.length<ge||!$.cursor.next)return v;$=await e.client.session.list({cursor:$.cursor.next,limit:ge})}};let p=!1;const c=async()=>{if(!p){p=!0;try{const v=Date.now(),$=(await i()).filter(d=>Et(d,v,t,n));for(const d of $)await e.client.session.update({sessionID:d.id,archived:!0}),e.log.write("info",`${e.id}: archived ${d.id} "${d.title??""}"`)}finally{p=!1}}},h=async v=>{if(!Pe.includes(v.type)||v.created<o-ce||v.type==="session.inbox.enqueued"&&v.data.item.type!=="user")return;const $=await e.client.session.get({sessionID:v.data.sessionID}),d=$.time.archived;if(v.type!=="session.unarchived"){if(d===void 0||v.created<=d)return;await e.client.session.update({sessionID:$.id,archived:!1}),e.log.write("info",`${e.id}: unarchived ${$.id} on ${v.type}`);return}d!==void 0||(Number($.metadata?.[n])||0)>=v.created||await e.client.session.update({sessionID:$.id,metadata:{...$.metadata,[n]:v.created}})},g=async()=>{for(;!a.aborted;){try{const v=e.client.event.subscribe({types:Pe},{signal:a});for await(const $ of v)h($).catch(s)}catch(v){a.aborted||s(v)}a.aborted||await new Promise(v=>setTimeout(v,5e3))}},u=()=>{c().catch(s)},m=setTimeout(u,ce),E=setInterval(u,10*ce),P=()=>{a.aborted||(clearTimeout(m),clearInterval(E),r.abort())};return globalThis[Be]?.(),globalThis[Be]=P,e.signal.addEventListener("abort",P,{once:!0}),g(),P}const C=(e,t,n)=>{e.getAttribute(t)!==n&&e.setAttribute(t,n)},G=(e,t,n)=>n===void 0?e.removeAttribute(t):C(e,t,n),Ye='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5L8 9.5L11.5 6.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',Xe='[data-slot="new-session-composer"]',xt='[data-slot="new-session-location-path"]',St=["branch","new-branch"].map(e=>`${Xe} use[href="#opencode-v2-icon-${e}"]`).join(", "),H="data-plus-branch",ne="data-plus-branch-trigger",X="data-plus-branch-menu",Qe="data-plus-branch-current",Ct='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M3.53564 8.17857L6.39279 11.75L12.4642 4.25" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',Lt=`
[${H}] {
  position: relative;
  border-radius: var(--radius-sm);
}
[${H}]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline: -2px -4px;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(Ye)}") center / 16px no-repeat;
}
[${H}]:is(:hover, :has(:focus-visible), :has([data-expanded])) {
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${ne}] {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
[${ne}] > button {
  width: 100%;
  height: 100%;
  opacity: 0;
}
[${X}] {
  width: max-content;
  max-width: min(320px, 100vw - 32px);
  max-height: min(320px, var(--kb-popper-content-available-height, 320px));
  overflow-y: auto;
}
[${X}] [data-slot="menu-v2-item-content"] {
  flex: 0 1 auto;
  min-width: 0;
}
[${X}] [data-component="menu-v2-item"]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
}
[${X}] [${Qe}]::after {
  background-color: var(--menu-v2-icon);
  mask: url("data:image/svg+xml,${encodeURIComponent(Ct)}") center / 14px no-repeat;
}
`,qt="git branch --all --no-color --no-column --sort=-committerdate",J=new Map;function Tt(e){J.forEach((t,n)=>{n.isConnected||(t(),J.delete(n))}),document.querySelectorAll(St).forEach(t=>{const n=t.closest("svg").parentElement;if(J.has(n))return;const o=document.createElement("div");o.setAttribute(ne,""),n.setAttribute(H,""),n.append(o),J.set(n,e(o,n))})}function It(){document.querySelectorAll(`[${ne}] > [aria-controls]`).forEach(e=>{const t=document.getElementById(e.getAttribute("aria-controls"));if(!t)return;const n=e.closest(`[${H}]`).querySelector(":scope > span").textContent.trim();C(t,X,""),t.querySelectorAll('[data-component="menu-v2-item"]').forEach(o=>{const r=o.querySelector('[data-slot="menu-v2-item-content"] > span');G(o,Qe,o.textContent.trim()===n?"":void 0),r&&G(o,"title",r.scrollWidth>r.clientWidth?r.textContent:void 0)})})}async function Nt(e,t){const n=e.closest(Xe)?.querySelector(xt)?.textContent??"";if(!n.includes("…"))return n||void 0;const[o,r]=n.split("…");return(await t()).flatMap(a=>[a.canonical,...a.sandboxes]).find(a=>a.startsWith(o)&&a.endsWith(r))}function Mt(e){const t=new Set,n=[],o=new Map;let r;for(const s of e.split(/\r?\n/)){const i=s.slice(2).trim();if(!(!i||i.startsWith("(")||i.includes(" -> "))){if(i.startsWith("remotes/")){const p=i.slice(8),c=p.slice(p.indexOf("/")+1);o.has(c)||o.set(c,p);continue}t.add(i),s.startsWith("*")&&(r=i),s.startsWith("+")||n.push(i)}}const a=Array.from(o,([s,i])=>({name:s,ref:i})).filter(({name:s})=>!t.has(s));return{current:r,local:n,remote:a}}const Ot=(...e)=>["git","switch",...e.map(Ze)].join(" "),Ze=e=>/^[\w./-]+$/.test(e)?e:`'${e.replaceAll("'","'\\''")}'`;function Dt(){J.forEach(e=>e()),J.clear(),document.querySelectorAll(`[${ne}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${H}]`).forEach(e=>e.removeAttribute(H))}const et='[data-slot="composer-controls"]',tt=`${et} > div > [data-component="tooltip-v2-trigger"]`,nt='[data-action="composer-model"]',ot=`${tt}:has(~ [data-component="tooltip-v2-trigger"] ${nt})`,rt=`${tt}:has(${nt}) ~ [data-component="tooltip-v2-trigger"]`,le="data-plus-hidden-agent",de="data-plus-variant-menu";function Rt({lowercaseVariants:e}){return`
${ot}[${le}] {
  display: none;
}
${e?`${rt} .capitalize,
[${de}] .capitalize {
  text-transform: lowercase;
}`:""}
`}function jt(e){document.querySelectorAll(ot).forEach(t=>{const n=e!==!1&&t.textContent.trim().toLowerCase()===e.toLowerCase();G(t,le,n?"":void 0)}),document.querySelectorAll(`${rt} [aria-controls]`).forEach(t=>{const n=document.getElementById(t.getAttribute("aria-controls"));n&&C(n,de,"")})}const Ue=new WeakSet;function Pt(e){document.querySelectorAll(et).forEach(t=>{Ue.has(t)||(Ue.add(t),e.observe(t,{subtree:!0,characterData:!0}))})}function Bt(){document.querySelectorAll(`[${le}]`).forEach(e=>e.removeAttribute(le)),document.querySelectorAll(`[${de}]`).forEach(e=>e.removeAttribute(de))}function Ut(e){const t=n=>{if(n.defaultPrevented||n.metaKey||n.ctrlKey||n.shiftKey||n.altKey)return;const o=n.target instanceof Element?n.target.closest("a[href]"):null;!(o instanceof HTMLAnchorElement)||!/^https?:$/.test(o.protocol)||o.closest('[role="dialog"]')||e(o.href)&&n.preventDefault()};return document.addEventListener("click",t),()=>document.removeEventListener("click",t)}function Wt({label:e,icon:t,shortcut:n,onSelect:o}){const r=document.createElement("hr");r.setAttribute("data-slot","menu-v2-separator");const a=document.createElement("div");a.setAttribute("role","menuitem"),a.setAttribute("data-component","menu-v2-item");const s=document.createElement("span");if(s.setAttribute("data-slot","menu-v2-item-content"),t(s),s.append(e),a.append(s),n){const i=document.createElement("span");i.setAttribute("data-slot","menu-v2-item-shortcut"),i.textContent=n,a.append(i)}return a.addEventListener("pointerenter",()=>a.setAttribute("data-highlighted","")),a.addEventListener("pointerleave",()=>a.removeAttribute("data-highlighted")),a.addEventListener("click",()=>{a.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:!0})),o()}),queueMicrotask(()=>{const i=a.closest('[role="menu"]')?.querySelector("[data-appearance]")?.getAttribute("data-appearance");i&&(a.setAttribute("data-appearance",i),r.setAttribute("data-appearance",i))}),[r,a]}const S='[data-slot="sidebar-inbox"]',Ce='[data-slot="sidebar-inbox-scroll"]',Z='[data-slot="sidebar-inbox-working"]',Le=`${Ce} > div.pt-3`,b='[data-slot="sidebar-inbox-item"]',T="data-plus-shelf",O="data-plus-toggle",qe="data-plus-count",I="data-plus-group",ue="data-plus-gap",M="data-plus-member",F="data-plus-inline",j="data-plus-add",be=`${S} ${b}[data-status="ready"]:not([data-state="active"], :hover:not(:has([${j}]:hover)), :focus-visible, [${T}] > *)`,zt=`
${Le} {
  order: 100000;
  margin-top: auto;
}
${S}[${F}] {
  overflow-y: auto;
  gap: 1px;
  padding-bottom: 4px;
}
[${F}] > ${Ce},
[${F}] > ${Z},
[${F}] > ${Z} > div {
  display: contents;
}
[${F}] > ${Z} > button {
  display: none;
}
[${T}] > [${O}] {
  border-radius: 6px;
}
[${T}] > [${O}]:hover {
  color: var(--color-v2-text-text-base);
}
[${T}] > [${O}]:focus-visible {
  outline: none;
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${T}] > [${O}]::before {
  content: attr(${qe});
  order: 1;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-faint);
}
[${T}] > [${O}]::after {
  content: "";
  order: 2;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(Ye)}") center / 16px no-repeat;
}
[${T}="closed"] > [${O}]::after {
  rotate: -90deg;
}
[${T}="closed"] > [${O}]:dir(rtl)::after {
  rotate: 90deg;
}
[${T}="closed"] > ${b}:not([data-state="active"]) {
  display: none;
}
${S} ${b}[data-status="working"] {
  opacity: 1;
}
${S} ${b}[data-status="working"] > span:nth-of-type(2) {
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
${S} ${b}[data-status="working"] > span:first-child > span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--plus-working);
}
${S} ${b}[data-status="working"] > span:first-child > span:last-child > span {
  color: inherit;
}
${S} ${b}[data-status="working"] [data-component="text-shimmer"] {
  --text-shimmer-base-color: var(--plus-working);
  --text-shimmer-peak-color: var(--plus-working-peak);
}
${S} ${b}[data-status="working"] > span:first-child > span:last-child::before {
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
  ${S} ${b}[data-status="working"] > span:first-child > span:last-child::before {
    animation: none;
  }
}
${S} ${b} > span,
${S} ${b} > span:first-child > span {
  transition: opacity 150ms;
}
${be}:not([${M}]) > span,
${be}[${M}] > span:not(:first-child),
${be}[${M}] > span:first-child > span:last-child {
  opacity: 0.6;
}
/* In a project group the heading names the project, so rows drop their project line and show the time beside the
   title: the first line dissolves into the row's grid, keeping only its last part, the time or status. */
${b}[${M}] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "title status";
  column-gap: 8px;
}
${b}[${M}] > span:first-child {
  display: contents;
}
${b}[${M}] > span:first-child > span:not(:last-child) {
  display: none;
}
${b}[${M}] > span:first-child > span:last-child {
  grid-area: status;
}
${b}[${M}] > span:nth-of-type(2) {
  grid-area: title;
}
${b}[${M}] > span:nth-of-type(3) {
  grid-column: 1 / -1;
}
/* The same space before every project; a group's heading takes its own 28px on top of it. */
${b}[${ue}] {
  margin-top: 16px;
}
${b}[${I}] {
  position: relative;
  margin-top: 28px;
}
${b}[${I}][${ue}] {
  margin-top: 44px;
}
${b}[${I}]::before {
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
${b}[${I}] > span:first-child > span:first-child {
  display: flex;
  position: absolute;
  inset-inline-start: 6px;
  bottom: calc(100% + 8px);
  pointer-events: none;
}
/* The heading's + button, at the far end of its 24px line, its icon in line with the times of the rows below. */
${b}[${I}] > [${j}] {
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
${b}[${I}] > [${j}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
${b}[${I}]:not([data-state="active"]):has(> [${j}]:hover) {
  background-color: transparent;
}
`,Q=e=>e?Array.from(e.children).filter(t=>t.matches(b)):[],Ee=e=>e.querySelector(":scope > span:first-child > span.truncate")?.textContent?.trim(),at=e=>{e.style.removeProperty("order"),e.style.length===0&&e.removeAttribute("style"),e.removeAttribute(I),e.removeAttribute(ue),e.removeAttribute(M)};function Ft(e){const t=e?"open":"closed";document.querySelectorAll(Le).forEach(n=>{const o=n.firstElementChild;!o||o.matches(b)||(C(n,T,t),C(o,O,""),C(o,qe,String(Q(n).length)),C(o,"role","button"),C(o,"tabindex","0"),C(o,"aria-expanded",String(e)))})}function Gt(e){const t=r=>r.target instanceof Element?r.target.closest(`${Le} > [${O}]`):null,n=r=>{t(r)&&e()},o=r=>{r.key!=="Enter"&&r.key!==" "||!t(r)||(r.preventDefault(),e())};return document.addEventListener("click",n),document.addEventListener("keydown",o),()=>{document.removeEventListener("click",n),document.removeEventListener("keydown",o)}}const We=(e,t,n=[])=>{const o=[...n,...e];if(!t&&n.length===0)return o.forEach(at);const r=new Map;o.forEach(s=>{const i=t&&Ee(s)||s;r.set(i,[...r.get(i)??[],s])});let a=0;Array.from(r).forEach(([s,i],p)=>{const c=t&&typeof s=="string"&&i.length>1;i.forEach((h,g)=>{a+=1,h.style.order!==String(a)&&(h.style.order=String(a)),G(h,I,c&&g===0?s:void 0),G(h,M,c?"":void 0),G(h,ue,t&&p>0&&g===0?"":void 0)})})};function st(e,t){document.querySelectorAll(S).forEach(n=>{const o=n.querySelector(`:scope > ${Ce}`),r=n.querySelector(`:scope > ${Z} > div`),a=new Set;t?(C(n,F,""),n.querySelector(`:scope > ${Z} > button[aria-expanded="false"]`)?.click(),We(Q(o),e,Q(r)),a.add(o).add(r)):n.removeAttribute(F),new Set(Array.from(n.querySelectorAll(b),s=>s.parentElement)).forEach(s=>{if(a.has(s))return;const i=s.getAttribute(T)==="closed",p=Q(s).filter(c=>!i||c.getAttribute("data-state")==="active");Q(s).filter(c=>!p.includes(c)).forEach(at),We(p,e)})})}function Ht(e){document.querySelectorAll(`${b} > [${j}]`).forEach(t=>{t.parentElement.getAttribute(I)!==t.getAttribute(j)&&t.remove()}),document.querySelectorAll(`${b}[${I}]`).forEach(t=>{t.querySelector(`:scope > [${j}]`)||t.append(e(t.getAttribute(I)))})}function Kt({name:e,label:t,icon:n,onSelect:o}){const r=document.createElement("div");return r.setAttribute(j,e),r.setAttribute("role","button"),r.setAttribute("aria-label",t),r.setAttribute("title",t),n(r),it(r,o),r}function it(e,t){const n=o=>{o.preventDefault(),o.stopPropagation(),t()};e.setAttribute("tabindex","0"),e.addEventListener("pointerdown",o=>o.stopPropagation()),e.addEventListener("click",n),e.addEventListener("keydown",o=>{(o.key==="Enter"||o.key===" ")&&n(o)})}function Vt(){st(!1,!1),document.querySelectorAll(`[${j}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${T}]`).forEach(e=>e.removeAttribute(T)),document.querySelectorAll(`[${O}]`).forEach(e=>{[O,qe,"role","tabindex","aria-expanded"].forEach(t=>e.removeAttribute(t))})}const _t=`${b} > span:nth-of-type(3)`,Jt=':scope > span > span[dir="ltr"]',D="data-plus-pr",ze="data-plus-pr-url",Yt=120*1e3,se=e=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${e}</svg>`,Fe={open:se('<circle cx="5" cy="6" r="3"/><path d="M5 9v12"/><circle cx="19" cy="18" r="3"/><path d="m15 9-3-3 3-3"/><path d="M12 6h5a2 2 0 0 1 2 2v7"/>'),draft:se('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 6V5"/><path d="M18 11v-1"/><path d="M6 9v12"/>'),merged:se('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>'),closed:se('<circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="m21 3-6 6"/><path d="m21 9-6-6"/><path d="M18 11.5V15"/><circle cx="18" cy="18" r="3"/>')},Ge={open:["oklch(59.6% 0.145 163.225)","oklch(84.5% 0.143 164.978 / 0.9)"],draft:["oklch(55.2% 0.016 285.938)","oklch(70.5% 0.015 286.067 / 0.8)"],merged:["oklch(54.1% 0.281 293.009)","oklch(81.1% 0.111 293.571 / 0.9)"],closed:["oklch(57.7% 0.245 27.325)","oklch(80.8% 0.114 19.571 / 0.9)"]},Xt=`
[${D}] {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  margin-inline-start: auto;
  padding-inline: 2px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}
[${D}] ~ .ms-auto {
  margin-inline-start: 0;
}
[${D}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${D}]::before {
  content: "";
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  background-color: var(--plus-pr);
}
${Object.keys(Fe).map(e=>`[${D}="${e}"] {
  --plus-pr: ${Ge[e][0]};
}
[data-color-scheme="dark"] [${D}="${e}"] {
  --plus-pr: ${Ge[e][1]};
}
[${D}="${e}"]::before {
  mask: url("data:image/svg+xml,${encodeURIComponent(Fe[e])}") center / 12px no-repeat;
}`).join(`
`)}
`,Qt=e=>`git remote get-url origin && GH_NO_UPDATE_NOTIFIER=1 gh pr list --state all --limit 20 --json number,title,url,state,isDraft,updatedAt,headRepositoryOwner --head ${Ze(e)} 2>/dev/null`;function Zt(e){const[t,...n]=e.trim().split(/\r?\n/),o=t.match(/[:/]([^/:]+)\/[^/]+$/)?.[1].toLowerCase(),r=JSON.parse(n.join(`
`)).filter(i=>i.headRepositoryOwner?.login.toLowerCase()===o).toSorted((i,p)=>Date.parse(p.updatedAt)-Date.parse(i.updatedAt)),a=r.find(i=>i.state==="OPEN")??r[0];if(!a)return;const s=a.state==="OPEN"&&a.isDraft?"draft":a.state.toLowerCase();return{number:a.number,title:a.title,url:a.url,state:s}}const Y=new Map;let Ae=new Set,He=Promise.resolve();function en({lookup:e,open:t,label:n}){const o=Date.now(),r=Array.from(document.querySelectorAll(_t),s=>{const i=s.querySelector(Jt),p=i?.textContent.trim(),c=s.parentElement;return{line:s,row:c,branch:p,key:p&&`${Ee(c)}
${p}`,holder:i?.parentElement}}),a=new Set(r.filter(({row:s,key:i})=>i&&s.getAttribute("data-status")==="working").map(({key:s})=>s));Ae.forEach(s=>{const i=Y.get(s);!a.has(s)&&i?.time!==void 0&&(i.time=0)}),Ae=a,r.forEach(({line:s,row:i,branch:p,key:c,holder:h})=>{const g=c&&Y.get(c);let u=s.querySelector(`:scope > [${D}]`);c&&(!g||g.time!==void 0&&o-g.time>=Yt)&&tn(c,()=>e(Ee(i),p));const m=g?.pull;if(!m)return u?.remove();u||(u=document.createElement("span"),u.setAttribute("role","link"),it(u,()=>t(u.getAttribute(ze))));const E=n(m);u.previousElementSibling!==h&&h.after(u),C(u,D,m.state),C(u,ze,m.url),C(u,"title",E),C(u,"aria-label",E),u.textContent!==`#${m.number}`&&(u.textContent=`#${m.number}`)})}const tn=(e,t)=>{const n=He.then(t).catch(()=>{});Y.set(e,{pull:Y.get(e)?.pull}),He=n,n.then(o=>Y.set(e,{time:Date.now(),pull:o}))};function nn(){Y.clear(),Ae=new Set,document.querySelectorAll(`[${D}]`).forEach(e=>e.remove())}function ct(e={}){const t=e.archiveAfterHours;return{archiveAfterHours:typeof t=="number"&&t>=0?t:12,hideAgent:typeof e.hideAgent=="string"||e.hideAgent===!1?e.hideAgent:"build",responseLabel:typeof e.responseLabel=="string"?e.responseLabel:e.responseLabel===!1?"":"Response",lowercaseVariants:e.lowercaseVariants!==!1}}const on="[data-timeline-virtual-content]",lt='[data-slot="session-turn-message-container"]',oe="data-plus-final",ve=`[${oe}] > [data-component="session-turn"] > ${lt}`,Te="--plus-label-half";function rn(e){return`
${ve} {
  --plus-gap: calc(var(${Te}, ${e.length*3.75}px) + 12px);
  position: relative;
}
${ve}::before {
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
${ve}::after {
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
`}let Ke=!1;function an(e){const t=document.querySelector(lt);if(Ke||!e||!t||document.fonts?.status==="loading")return;const n=document.createElement("span");n.textContent=e,n.style.cssText="position: absolute; visibility: hidden; white-space: nowrap; font-size: 13px; font-weight: 440; letter-spacing: -0.04px",t.append(n);const o=n.getBoundingClientRect().width;n.remove(),o&&(document.documentElement.style.setProperty(Te,`${o/2}px`),Ke=!0)}const z=e=>e?.frame?.getAttribute("data-timeline-row"),W=e=>e?.frame?.getAttribute("data-message-id"),ye=e=>z(e)==="AssistantPart"&&!!e.frame.querySelector('[data-component="text-part"]')&&!e.frame.querySelector('[data-component="tool-part-wrapper"], [data-timeline-part-ids]');function sn(e){document.querySelectorAll(on).forEach(t=>{const n=Array.from(t.querySelectorAll(":scope > div > [data-timeline-key]"),c=>({wrapper:c,frame:c.querySelector(":scope > [data-index] > [data-timeline-row]"),top:parseFloat(c.style.top),height:parseFloat(c.style.height)})).sort((c,h)=>c.top-h.top),o=t.querySelector(':scope > [data-timeline-row="bottom-spacer"]'),r=c=>n[c+1]&&Math.abs(n[c+1].top-(n[c].top+n[c].height))<2?n[c+1]:void 0,a=c=>n[c-1]&&Math.abs(n[c].top-(n[c-1].top+n[c-1].height))<2?n[c-1]:void 0,s=c=>c===n.length-1&&!!o&&Math.abs(n[c].wrapper.getBoundingClientRect().bottom-o.getBoundingClientRect().top)<2,i=e?void 0:!0,p=c=>{const h=r(c);return h?h.frame?z(h)==="TurnGap"||z(h)==="UserMessage"||W(h)&&W(h)!==W(n[c])||z(h)==="TurnDiff"||z(h)==="TurnDivider"?!0:z(h)==="AssistantPart"||z(h)==="Thinking"?!1:i:i:n[c+1]||!s(c)?void 0:i};n.forEach((c,h)=>{if(!ye(c))return $e(c,!1);const g=p(h);if(g===void 0)return;if(!g){const m=r(h);ye(m)&&W(m)===W(c)||$e(c,!1);return}let u=h;for(;ye(a(u))&&W(a(u))===W(c);)u-=1;for(let m=u;m<=h;m+=1)$e(n[m],m===u&&n[m].frame.hasAttribute("data-timeline-spacing"))})})}const ee=new Map,$e=(e,t)=>{!e.frame||e.frame.hasAttribute(oe)===t||(G(e.frame,oe,t?"":void 0),ee.set(e.frame.parentElement,10))};function cn(){ee.forEach((e,t)=>{if(!(t.isConnected&&Math.abs(t.offsetHeight-parseFloat(t.parentElement.style.height))>=1)||e===0)return ee.delete(t);ee.set(t,e-1),t.style.paddingBottom="1px",requestAnimationFrame(()=>t.style.removeProperty("padding-bottom"))})}const ln=()=>ee.size>0;function dn(){document.querySelectorAll(`[${oe}]`).forEach(e=>e.removeAttribute(oe)),document.documentElement.style.removeProperty(Te)}const un='[data-component="tooltip-v2-trigger"] > button:not([aria-haspopup]):has([data-component="progress-circle"])',x="data-plus-usage",Ve="plus-usage-card",xe="data-plus-usage-hover",pn=50,hn=100,mn=4,fn=`
:root[${xe}] [data-component="tooltip-v2"]:not([data-force-open="true"]) {
  display: none;
}
[${x}] {
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
[${x}]:dir(rtl) {
  transform-origin: top left;
}
[${x}] [data-part="row"] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
  white-space: nowrap;
}
[${x}] [data-part="row"] > :last-child {
  margin-inline-start: auto;
}
[${x}] :is([data-part="value"], [data-part="percent"]) {
  color: var(--v2-text-text-base);
}
[${x}] [data-part="percent"] {
  font-weight: 530;
}
[${x}] [data-part="bar"] {
  display: flex;
  height: 8px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--v2-background-bg-layer-03);
}
[${x}] [data-part="bar"] > span {
  box-sizing: border-box;
  min-width: 3px;
}
/* A line in the card's color between kinds, as in Cursor's bar. */
[${x}] [data-part="bar"] > span + span {
  border-inline-start: 1px solid var(--v2-background-bg-layer-01);
}
[${x}] [data-part="legend"] {
  display: flex;
  flex-direction: column;
}
[${x}] [data-part="dot"] {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
[${x}] hr {
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
  [${x}] {
    animation: none;
  }
}
:root[data-motion="reduce"] [${x}] {
  animation: none;
}
`;function gn(e){let t,n,o=0;const r=document.documentElement,a=(d,L)=>{clearTimeout(o),o=setTimeout(d,L)},s=d=>d.target instanceof Element?d.target.closest(un):null,i=d=>d instanceof Node&&!!(t?.contains(d)||n?.card.contains(d)),p=()=>{if(!t.isConnected)return;const d=document.createElement("div"),L=t.closest("[data-theme]")?.getAttribute("data-theme");d.id=Ve,d.setAttribute(x,""),d.setAttribute("role","tooltip"),L&&d.setAttribute("data-theme",L),n={card:d,stop:e(d)},document.body.append(d),$n(d,t),t.setAttribute("aria-describedby",Ve)},c=()=>{clearTimeout(o),n?.stop(),n?.card.remove(),n=void 0,t?.removeAttribute("aria-describedby")},h=d=>{if(d===t){n&&clearTimeout(o);return}g(),t=d,r.setAttribute(xe,""),a(p,pn)},g=()=>{c(),t=void 0,r.removeAttribute(xe)},u=d=>{if(d.pointerType==="touch")return;const L=s(d);if(L)return h(L);if(n?.card.contains(d.target))return clearTimeout(o);t&&!t.isConnected&&g()},m=d=>{!t||i(d.relatedTarget)||!i(d.target)||(n?a(g,hn):g())},E=d=>{t?.contains(d.target)&&c()},P=d=>{d.key==="Escape"&&c()},v=d=>{const L=s(d);L?.matches(":focus-visible")&&h(L)},$=d=>{t?.contains(d.target)&&!i(d.relatedTarget)&&g()};return document.addEventListener("pointerover",u),document.addEventListener("pointerout",m),document.addEventListener("pointerdown",E,!0),document.addEventListener("keydown",P),document.addEventListener("focusin",v),document.addEventListener("focusout",$),()=>{document.removeEventListener("pointerover",u),document.removeEventListener("pointerout",m),document.removeEventListener("pointerdown",E,!0),document.removeEventListener("keydown",P),document.removeEventListener("focusin",v),document.removeEventListener("focusout",$),g()}}function bn(e){const t=e.server.data,n=e.directory?{directory:e.directory}:void 0,o=t.session.get(e.id),r=t.session.message.list(e.id),a=kt.lastAssistantWithUsage(r,o?.revert?.messageID),s=a?.tokens,i=s?s.input+s.output+s.reasoning+s.cache.read+s.cache.write:0,p=a?_e(t,n,a.model)?.limit.context:void 0,c=t.session.cost(e.id),h=o?.model??r.findLast(m=>m.type==="assistant")?.model,g=h?_e(t,n,h):void 0,u=!!g&&g.cost.every(m=>!m.input&&!m.output&&!m.cache.read&&!m.cache.write);return{total:i,tokens:s,limit:p||void 0,percent:p?Math.round(i/p*100):void 0,cost:c>0||!u?c:void 0}}function vn({total:e,tokens:t,limit:n,percent:o,cost:r},a,s){const i=u=>new Intl.NumberFormat(s,{notation:"compact",maximumFractionDigits:0}).format(u).toLocaleLowerCase(s),p=t?yn.map(u=>({...u,value:u.value(t)})).filter(u=>u.value>0):[],c=Math.max(n??0,e),h=q("span",void 0,n?`${i(e)} / ${i(n)} `:i(e));n&&h.append(q("span","percent",`(${o}%)`));const g=[we([q("span",void 0,a("usage.window")),h])];if(c>0){const u=q("div","bar");u.setAttribute("aria-hidden","true"),p.forEach(m=>{const E=q("span");E.style.width=`${m.value/c*100}%`,E.style.background=m.color,u.append(E)}),g.push(u)}if(p.length){const u=q("div","legend");p.forEach(m=>{const E=q("span","dot");E.style.background=m.color,u.append(we([E,q("span",void 0,a(m.label)),q("span","value",m.value.toLocaleString(s))]))}),g.push(u)}if(r!==void 0){const u=new Intl.NumberFormat(s,{style:"currency",currency:"USD"});g.push(q("hr"),we([q("span",void 0,a("usage.cost")),q("span","value",u.format(r))]))}return g}const yn=[{label:"usage.cacheRead",color:"var(--v2-avatar-border-blue)",value:e=>e.cache.read},{label:"usage.cacheWrite",color:"var(--v2-avatar-border-purple)",value:e=>e.cache.write},{label:"usage.input",color:"var(--v2-avatar-border-pink)",value:e=>e.input},{label:"usage.reasoning",color:"var(--v2-avatar-border-yellow)",value:e=>e.reasoning},{label:"usage.output",color:"var(--v2-avatar-border-green)",value:e=>e.output}],_e=(e,t,n)=>{const o=e.location.provider.list(t),r=e.location.model.list(t);if(o?.some(a=>a.id===n.providerID))return r?.findLast(a=>a.providerID===n.providerID&&a.id===n.id&&a.status!=="deprecated")},q=(e,t,n)=>{const o=document.createElement(e);return t&&o.setAttribute("data-part",t),n!==void 0&&(o.textContent=n),o},we=e=>{const t=q("div","row");return t.append(...e),t},$n=(e,t)=>{const n=t.getBoundingClientRect(),o=e.offsetWidth,r=getComputedStyle(t).direction==="rtl"?n.left:n.right-o;e.style.top=`${n.bottom+mn}px`,e.style.left=`${Math.max(8,Math.min(r,innerWidth-o-8))}px`},Ie='[data-component="user-message"]',wn=`${Ie} [data-slot="user-message-actions"]`,dt='[data-slot="user-message-text"]',kn='[data-component="tooltip-v2-trigger"]',pe="data-plus-copy",En=`
[${pe}] {
  display: contents;
}
[${pe}] [data-slot="icon-svg"] {
  width: 14px;
  height: 14px;
}
`,te=new Map;function An(e){te.forEach((t,n)=>{n.isConnected||(t(),n.remove(),te.delete(n))}),document.querySelectorAll(wn).forEach(t=>{const n=t.querySelector(`:scope > ${kn}`);if(!n||t.querySelector(`:scope > [${pe}]`)||!t.closest(Ie).querySelector(dt))return;const o=document.createElement("span");o.setAttribute(pe,""),o.addEventListener("mousedown",r=>r.preventDefault()),te.set(o,e(o)),t.insertBefore(o,n)})}const xn=({ui:e,label:t,copied:n,write:o})=>r=>ie.render(()=>{const[a,s]=R.createSignal(!1),i=()=>a()?n:t,p=async c=>{c.stopPropagation(),await o(Sn(r.closest(Ie)))&&(s(!0),setTimeout(()=>s(!1),2e3))};return R.createComponent(e.Tooltip,{get value(){return i()},get children(){return R.createComponent(e.IconButton,{get icon(){return a()?"check":"outline-copy"},get label(){return i()},size:"small",onClick:p})}})},r),Sn=e=>{const t=e.querySelector(dt).cloneNode(!0);return t.querySelectorAll('[data-slot="user-message-comments"], [data-slot="user-message-fold-toggle"]').forEach(n=>n.remove()),t.querySelectorAll("[data-session-reference]").forEach(n=>n.replaceWith(n.dataset.sessionReference)),t.textContent};function Cn(){te.forEach((e,t)=>{e(),t.remove()}),te.clear()}const Se=60*1e3,Ln=60*Se,Je="tab.new",ke="sidecar";function qn(e){const t=ct(e.options),{shelf:n,groups:o,working:r}=e.stores,a=(l,y)=>f=>ie.insert(f,()=>R.createComponent(e.ui.Icon,{name:l,...y})),s=()=>{const l=e.sessions.current();try{const y=l?.server.data.session;return!!l&&(y.status(l.id)==="running"||y.pending.list(l.id).some(f=>f.type!=="synthetic"))}catch{return!1}},i=()=>n.update(l=>{l.archivedOpen=!l.archivedOpen}),p=async l=>(await e.client.project.list()).filter(f=>(f.name||f.canonical.split("/").pop())===l).toSorted((f,w)=>w.time.active-f.time.active)[0],c=async l=>{const y=await p(l);if(!y)return e.layout.project(ke,e.t("session.new"));e.layout.draft({server:ke,directory:y.canonical,prompt:""})},h=l=>Kt({name:l,label:e.t("session.newIn",{project:l}),icon:a("plus",{size:"small"}),onSelect:()=>{c(l).catch(()=>e.toast.show({title:e.t("session.failed",{project:l})}))}}),g=async(l,y)=>{const f={directory:l};let{data:w}=await e.client.shell.create({location:f,command:y,timeout:Se});try{for(;w.status==="running";)await new Promise(K=>setTimeout(K,100)),w=(await e.client.shell.get({id:w.id,location:f})).data;const{data:N}=await e.client.shell.output({id:w.id,location:f});return{ok:w.exit===0,output:N.output}}finally{e.client.shell.remove({id:w.id,location:f}).catch(()=>{})}},u=async(l,y)=>{try{const f=await p(l),w=f&&await g(f.canonical,Qt(y));return w?.ok?Zt(w.output):void 0}finally{B()}},m=async l=>{const y=await Nt(l,()=>e.client.project.list()),f=y&&await g(y,qt);return f?.ok?{directory:y,...Mt(f.output)}:void 0},E=async(l,y,f)=>{const w=N=>e.toast.show({variant:"error",title:f,description:N.trim()});try{const N=await g(l,Ot(...y));if(!N.ok)return w(N.output);const K=e.servers.get(ke)?.data;K?.location.vcs.invalidate({directory:l}),await K?.location.vcs.sync({directory:l})}catch(N){w(String(N?.message??N))}},P=(l,y)=>R.createRoot(f=>{const[w,N]=R.createSignal(),[K,De]=R.createSignal(!1);let he=!1;const me=()=>{he||(he=!0,m(y).catch(()=>{}).then(k=>N(k??null)).finally(()=>{he=!1}))},Re=async(k,U)=>{De(!0),await E(w().directory,k,U),De(!1),me()},ft=k=>{k!==w().current&&Re([k],e.t("branch.failed",{branch:k}))},gt=async()=>{const k=w().current,V=(await e.dialogs.prompt({title:e.t("branch.create"),description:k&&e.t("branch.from",{branch:k}),placeholder:e.t("branch.name"),submit:e.t("branch.submit")}))?.trim().replace(/\s+/g,"-");V&&await Re(["-c",V],e.t("branch.uncreated",{branch:V}))},je=(k,U=k)=>({label:U,onSelect:()=>ft(k)}),bt=()=>{const k=w();if(k===void 0)return[{label:e.t("branch.loading"),disabled:!0}];if(k===null)return[{label:e.t("branch.unlisted"),disabled:!0}];const U=[{label:e.t("branch.new"),icon:"plus",onSelect:()=>{gt()}},{type:"separator"}],V=k.local.map(fe=>je(fe));if(k.remote.length===0)return[...U,...V];const vt=k.remote.map(({name:fe,ref:$t})=>je(fe,$t)),yt={type:"group",label:e.t("branch.remote"),items:vt};return[...U,...V,{type:"separator"},yt]};return l.addEventListener("pointerenter",me),l.addEventListener("focusin",me),ie.insert(l,()=>R.createComponent(e.ui.Menu,{label:e.t("branch.switch"),trigger:"button",placement:"bottom-start",get disabled(){return K()},get items(){return bt()}})),f}),v=xn({ui:e.ui,label:e.t("message.copy"),copied:e.t("message.copied"),write:l=>e.system.copy(l).then(()=>!0,()=>(e.toast.show({title:e.t("message.copyFailed")}),!1))}),$=e.use(wt.Browser),d=l=>{const y=$(),f=e.sessions.current();return y.status!=="active"||!f||!y.value.canOpen(f)?!1:(y.value.open(f,l),!0)},L=()=>{Ft(n.value.archivedOpen),st(o.value.enabled,r.value.inline),Ht(h),en({lookup:u,open:l=>e.system.openExternal(l),label:({number:l,state:y,title:f})=>e.t("pr.label",{number:l,state:e.t(`pr.${y}`),title:f})}),Tt(P),It(),jt(t.hideAgent),Pt(Oe),An(v),an(t.responseLabel),cn(),sn(s()),ln()&&!ae&&(ae=setTimeout(()=>{ae=0,B()},300))};let re=0,ae=0,Ne=!1;const B=()=>{re||Ne||(re=requestAnimationFrame(()=>{re=0,L()}))},Me=new MutationObserver(B);Me.observe(document.body,{childList:!0,subtree:!0});const Oe=new MutationObserver(B),ut=setInterval(B,Se);document.addEventListener("scrollend",B,!0);const pt=Gt(i),ht=gn(l=>R.createRoot(y=>(ie.insert(l,()=>{const f=e.sessions.current();return f?vn(bn(f),e.t,e.locale.locale()):[]}),y))),mt=Ut(d);return A.createKeyed(()=>`${n.value.archivedOpen}:${o.value.enabled}:${r.value.inline}:${s()}`,L),e.add(A.Style,zt),e.add(A.Style,Xt),e.add(A.Style,Lt),e.add(A.Style,Rt(t)),e.add(A.Style,rn(t.responseLabel)),e.add(A.Style,fn),e.add(A.Style,En),e.add(A.Slot,{at:"session.location.menu",order:100,render:l=>Wt({label:e.t("session.new"),icon:a("edit",{class:"shrink-0 text-v2-icon-icon-muted"}),shortcut:e.keybinds.keybind(Je).join(""),onSelect:()=>{e.commands.run(Je)||e.layout.draft({server:l.session.server.id,directory:l.session.directory,prompt:""})}})}),e.add(A.Command,()=>({id:"toggle-archived",title:e.t(n.value.archivedOpen?"archived.hide":"archived.show"),keywords:"archive archived settled sessions sidebar inbox",run:i})),e.add(A.Command,()=>({id:"toggle-groups",title:e.t(o.value.enabled?"groups.off":"groups.on"),keywords:"group project projects folders sessions sidebar inbox",run:()=>o.update(l=>{l.enabled=!l.enabled})})),e.add(A.Command,()=>({id:"toggle-working",title:e.t(r.value.inline?"working.section":"working.inline"),keywords:"working running busy section shelf sessions sidebar inbox",run:()=>r.update(l=>{l.inline=!l.inline})})),()=>{Ne=!0,Me.disconnect(),Oe.disconnect(),cancelAnimationFrame(re),clearTimeout(ae),clearInterval(ut),document.removeEventListener("scrollend",B,!0),pt(),ht(),mt(),Vt(),nn(),Dt(),Bt(),dn(),Cn()}}function Tn(e){const{archiveAfterHours:t}=ct(e.options);if(t>0)return At(e,t*Ln)}const In=A.Plugin.define({stores:{shelf:A.Store.global(_.Schema.Struct({archivedOpen:_.Schema.Boolean}),{archivedOpen:!1}),groups:A.Store.global(_.Schema.Struct({enabled:_.Schema.Boolean}),{enabled:!0}),working:A.Store.global(_.Schema.Struct({inline:_.Schema.Boolean}),{inline:!0})},i18n:{en:{"archived.show":"Show archived sessions","archived.hide":"Hide archived sessions","groups.on":"Group sessions by project","groups.off":"Stop grouping sessions by project","working.inline":"Show working sessions in the list","working.section":"Show working sessions in their own section","session.new":"New session","session.newIn":"New session in {{project}}","session.failed":"Could not start a session in {{project}}","usage.window":"Context window","usage.cacheRead":"Cache read","usage.cacheWrite":"Cache write","usage.input":"Input","usage.reasoning":"Reasoning","usage.output":"Output","usage.cost":"Cost","branch.switch":"Switch branch","branch.loading":"Loading…","branch.unlisted":"Could not list the branches","branch.remote":"Remote","branch.failed":"Could not switch to {{branch}}","branch.new":"New branch…","branch.create":"Create branch","branch.from":"The new branch starts from {{branch}}, with your changes.","branch.name":"Branch name","branch.submit":"Create","branch.uncreated":"Could not create {{branch}}","pr.label":"PR #{{number}}, {{state}}: {{title}}","pr.open":"open","pr.draft":"draft","pr.merged":"merged","pr.closed":"closed","message.copy":"Copy message","message.copied":"Copied","message.copyFailed":"Could not copy the message"}},setup:qn,main:Tn});exports.default=In;
