"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const A=require("@opencode/plugin/gui"),K=require("effect"),D=require("solid-js"),ae=require("solid-js/web"),vt=require("@opencode/client/solid"),se=60*1e3,me=200,De=["session.inbox.enqueued","session.execution.started","session.unarchived"],je=Symbol.for("opencode-plus.archive");function yt(e,t,n,o){const{created:r,updated:a,busy:s,idle:i,archived:p}=e.time;if(p!==void 0||e.parentID||s!==void 0&&(i===void 0||s>i))return!1;const c=Math.max(r,s??0,i??0);return(Number(e.metadata?.[o])||0)>=c||t-a<2*se?!1:t-c>=n}function $t(e,t){const n=`${e.id}.keptAt`,o=Date.now(),r=new AbortController,a=r.signal,s=b=>e.log.write("error",`${e.id}: ${b?.stack??b}`),i=async()=>{const b=[];let $=await e.client.session.list({parentID:null,archived:!1,limit:me});for(;;){if(b.push(...$.data),$.data.length<me||!$.cursor.next)return b;$=await e.client.session.list({cursor:$.cursor.next,limit:me})}};let p=!1;const c=async()=>{if(!p){p=!0;try{const b=Date.now(),$=(await i()).filter(l=>yt(l,b,t,n));for(const l of $)await e.client.session.update({sessionID:l.id,archived:!0}),e.log.write("info",`${e.id}: archived ${l.id} "${l.title??""}"`)}finally{p=!1}}},h=async b=>{if(!De.includes(b.type)||b.created<o-se||b.type==="session.inbox.enqueued"&&b.data.item.type!=="user")return;const $=await e.client.session.get({sessionID:b.data.sessionID}),l=$.time.archived;if(b.type!=="session.unarchived"){if(l===void 0||b.created<=l)return;await e.client.session.update({sessionID:$.id,archived:!1}),e.log.write("info",`${e.id}: unarchived ${$.id} on ${b.type}`);return}l!==void 0||(Number($.metadata?.[n])||0)>=b.created||await e.client.session.update({sessionID:$.id,metadata:{...$.metadata,[n]:b.created}})},f=async()=>{for(;!a.aborted;){try{const b=e.client.event.subscribe({types:De},{signal:a});for await(const $ of b)h($).catch(s)}catch(b){a.aborted||s(b)}a.aborted||await new Promise(b=>setTimeout(b,5e3))}},u=()=>{c().catch(s)},m=setTimeout(u,se),E=setInterval(u,10*se),P=()=>{a.aborted||(clearTimeout(m),clearInterval(E),r.abort())};return globalThis[je]?.(),globalThis[je]=P,e.signal.addEventListener("abort",P,{once:!0}),f(),P}const L=(e,t,n)=>{e.getAttribute(t)!==n&&e.setAttribute(t,n)},G=(e,t,n)=>n===void 0?e.removeAttribute(t):L(e,t,n),Ke='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5L8 9.5L11.5 6.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',Je='[data-slot="new-session-composer"]',wt='[data-slot="new-session-location-path"]',kt=["branch","new-branch"].map(e=>`${Je} use[href="#opencode-v2-icon-${e}"]`).join(", "),H="data-plus-branch",ne="data-plus-branch-trigger",X="data-plus-branch-menu",Ye="data-plus-branch-current",Et='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M3.53564 8.17857L6.39279 11.75L12.4642 4.25" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',At=`
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
  mask: url("data:image/svg+xml,${encodeURIComponent(Ke)}") center / 16px no-repeat;
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
[${X}] [${Ye}]::after {
  background-color: var(--menu-v2-icon);
  mask: url("data:image/svg+xml,${encodeURIComponent(Et)}") center / 14px no-repeat;
}
`,xt="git branch --all --no-color --no-column --sort=-committerdate",J=new Map;function St(e){J.forEach((t,n)=>{n.isConnected||(t(),J.delete(n))}),document.querySelectorAll(kt).forEach(t=>{const n=t.closest("svg").parentElement;if(J.has(n))return;const o=document.createElement("div");o.setAttribute(ne,""),n.setAttribute(H,""),n.append(o),J.set(n,e(o,n))})}function Ct(){document.querySelectorAll(`[${ne}] > [aria-controls]`).forEach(e=>{const t=document.getElementById(e.getAttribute("aria-controls"));if(!t)return;const n=e.closest(`[${H}]`).querySelector(":scope > span").textContent.trim();L(t,X,""),t.querySelectorAll('[data-component="menu-v2-item"]').forEach(o=>{const r=o.querySelector('[data-slot="menu-v2-item-content"] > span');G(o,Ye,o.textContent.trim()===n?"":void 0),r&&G(o,"title",r.scrollWidth>r.clientWidth?r.textContent:void 0)})})}async function Lt(e,t){const n=e.closest(Je)?.querySelector(wt)?.textContent??"";if(!n.includes("…"))return n||void 0;const[o,r]=n.split("…");return(await t()).flatMap(a=>[a.canonical,...a.sandboxes]).find(a=>a.startsWith(o)&&a.endsWith(r))}function qt(e){const t=new Set,n=[],o=new Map;let r;for(const s of e.split(/\r?\n/)){const i=s.slice(2).trim();if(!(!i||i.startsWith("(")||i.includes(" -> "))){if(i.startsWith("remotes/")){const p=i.slice(8),c=p.slice(p.indexOf("/")+1);o.has(c)||o.set(c,p);continue}t.add(i),s.startsWith("*")&&(r=i),s.startsWith("+")||n.push(i)}}const a=Array.from(o,([s,i])=>({name:s,ref:i})).filter(({name:s})=>!t.has(s));return{current:r,local:n,remote:a}}const Tt=(...e)=>["git","switch",...e.map(Xe)].join(" "),Xe=e=>/^[\w./-]+$/.test(e)?e:`'${e.replaceAll("'","'\\''")}'`;function It(){J.forEach(e=>e()),J.clear(),document.querySelectorAll(`[${ne}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${H}]`).forEach(e=>e.removeAttribute(H))}const Qe='[data-slot="composer-controls"]',Ze=`${Qe} > div > [data-component="tooltip-v2-trigger"]`,et='[data-action="composer-model"]',tt=`${Ze}:has(~ [data-component="tooltip-v2-trigger"] ${et})`,nt=`${Ze}:has(${et}) ~ [data-component="tooltip-v2-trigger"]`,ie="data-plus-hidden-agent",ce="data-plus-variant-menu";function Nt({lowercaseVariants:e}){return`
${tt}[${ie}] {
  display: none;
}
${e?`${nt} .capitalize,
[${ce}] .capitalize {
  text-transform: lowercase;
}`:""}
`}function Mt(e){document.querySelectorAll(tt).forEach(t=>{const n=e!==!1&&t.textContent.trim().toLowerCase()===e.toLowerCase();G(t,ie,n?"":void 0)}),document.querySelectorAll(`${nt} [aria-controls]`).forEach(t=>{const n=document.getElementById(t.getAttribute("aria-controls"));n&&L(n,ce,"")})}const Pe=new WeakSet;function Ot(e){document.querySelectorAll(Qe).forEach(t=>{Pe.has(t)||(Pe.add(t),e.observe(t,{subtree:!0,characterData:!0}))})}function Rt(){document.querySelectorAll(`[${ie}]`).forEach(e=>e.removeAttribute(ie)),document.querySelectorAll(`[${ce}]`).forEach(e=>e.removeAttribute(ce))}function Dt({label:e,icon:t,shortcut:n,onSelect:o}){const r=document.createElement("hr");r.setAttribute("data-slot","menu-v2-separator");const a=document.createElement("div");a.setAttribute("role","menuitem"),a.setAttribute("data-component","menu-v2-item");const s=document.createElement("span");if(s.setAttribute("data-slot","menu-v2-item-content"),t(s),s.append(e),a.append(s),n){const i=document.createElement("span");i.setAttribute("data-slot","menu-v2-item-shortcut"),i.textContent=n,a.append(i)}return a.addEventListener("pointerenter",()=>a.setAttribute("data-highlighted","")),a.addEventListener("pointerleave",()=>a.removeAttribute("data-highlighted")),a.addEventListener("click",()=>{a.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:!0})),o()}),queueMicrotask(()=>{const i=a.closest('[role="menu"]')?.querySelector("[data-appearance]")?.getAttribute("data-appearance");i&&(a.setAttribute("data-appearance",i),r.setAttribute("data-appearance",i))}),[r,a]}const C='[data-slot="sidebar-inbox"]',xe='[data-slot="sidebar-inbox-scroll"]',Z='[data-slot="sidebar-inbox-working"]',Se=`${xe} > div.pt-3`,g='[data-slot="sidebar-inbox-item"]',T="data-plus-shelf",O="data-plus-toggle",Ce="data-plus-count",I="data-plus-group",le="data-plus-gap",M="data-plus-member",F="data-plus-inline",j="data-plus-add",fe=`${C} ${g}[data-status="ready"]:not([data-state="active"], :hover:not(:has([${j}]:hover)), :focus-visible, [${T}] > *)`,jt=`
${Se} {
  order: 100000;
  margin-top: auto;
}
${C}[${F}] {
  overflow-y: auto;
  gap: 1px;
  padding-bottom: 4px;
}
[${F}] > ${xe},
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
  content: attr(${Ce});
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
  mask: url("data:image/svg+xml,${encodeURIComponent(Ke)}") center / 16px no-repeat;
}
[${T}="closed"] > [${O}]::after {
  rotate: -90deg;
}
[${T}="closed"] > [${O}]:dir(rtl)::after {
  rotate: 90deg;
}
[${T}="closed"] > ${g}:not([data-state="active"]) {
  display: none;
}
${C} ${g}[data-status="working"] {
  opacity: 1;
}
${C} ${g}[data-status="working"] > span:nth-of-type(2) {
  color: var(--color-v2-text-text-base);
}
/* T3 Code's Working colors: sky-600 text and a sky-500 pulsing dot, or sky-300 at 80% in dark mode. */
${C} {
  --plus-working: oklch(58.8% 0.158 241.966);
  --plus-working-dot: oklch(68.5% 0.169 237.323);
  --plus-working-peak: oklch(74.6% 0.16 232.661);
}
[data-color-scheme="dark"] ${C} {
  --plus-working: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-dot: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-peak: oklch(95.1% 0.026 236.824);
}
${C} ${g}[data-status="working"] > span:first-child > span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--plus-working);
}
${C} ${g}[data-status="working"] > span:first-child > span:last-child > span {
  color: inherit;
}
${C} ${g}[data-status="working"] [data-component="text-shimmer"] {
  --text-shimmer-base-color: var(--plus-working);
  --text-shimmer-peak-color: var(--plus-working-peak);
}
${C} ${g}[data-status="working"] > span:first-child > span:last-child::before {
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
  ${C} ${g}[data-status="working"] > span:first-child > span:last-child::before {
    animation: none;
  }
}
${C} ${g} > span,
${C} ${g} > span:first-child > span {
  transition: opacity 150ms;
}
${fe}:not([${M}]) > span,
${fe}[${M}] > span:not(:first-child),
${fe}[${M}] > span:first-child > span:last-child {
  opacity: 0.6;
}
/* In a project group the heading names the project, so rows drop their project line and show the time beside the
   title: the first line dissolves into the row's grid, keeping only its last part, the time or status. */
${g}[${M}] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "title status";
  column-gap: 8px;
}
${g}[${M}] > span:first-child {
  display: contents;
}
${g}[${M}] > span:first-child > span:not(:last-child) {
  display: none;
}
${g}[${M}] > span:first-child > span:last-child {
  grid-area: status;
}
${g}[${M}] > span:nth-of-type(2) {
  grid-area: title;
}
${g}[${M}] > span:nth-of-type(3) {
  grid-column: 1 / -1;
}
/* The same space before every project; a group's heading takes its own 28px on top of it. */
${g}[${le}] {
  margin-top: 16px;
}
${g}[${I}] {
  position: relative;
  margin-top: 28px;
}
${g}[${I}][${le}] {
  margin-top: 44px;
}
${g}[${I}]::before {
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
${g}[${I}] > span:first-child > span:first-child {
  display: flex;
  position: absolute;
  inset-inline-start: 6px;
  bottom: calc(100% + 8px);
  pointer-events: none;
}
/* The heading's + button, at the far end of its 24px line, its icon in line with the times of the rows below. */
${g}[${I}] > [${j}] {
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
${g}[${I}] > [${j}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
${g}[${I}]:not([data-state="active"]):has(> [${j}]:hover) {
  background-color: transparent;
}
`,Q=e=>e?Array.from(e.children).filter(t=>t.matches(g)):[],we=e=>e.querySelector(":scope > span:first-child > span.truncate")?.textContent?.trim(),ot=e=>{e.style.removeProperty("order"),e.style.length===0&&e.removeAttribute("style"),e.removeAttribute(I),e.removeAttribute(le),e.removeAttribute(M)};function Pt(e){const t=e?"open":"closed";document.querySelectorAll(Se).forEach(n=>{const o=n.firstElementChild;!o||o.matches(g)||(L(n,T,t),L(o,O,""),L(o,Ce,String(Q(n).length)),L(o,"role","button"),L(o,"tabindex","0"),L(o,"aria-expanded",String(e)))})}function Bt(e){const t=r=>r.target instanceof Element?r.target.closest(`${Se} > [${O}]`):null,n=r=>{t(r)&&e()},o=r=>{r.key!=="Enter"&&r.key!==" "||!t(r)||(r.preventDefault(),e())};return document.addEventListener("click",n),document.addEventListener("keydown",o),()=>{document.removeEventListener("click",n),document.removeEventListener("keydown",o)}}const Be=(e,t,n=[])=>{const o=[...n,...e];if(!t&&n.length===0)return o.forEach(ot);const r=new Map;o.forEach(s=>{const i=t&&we(s)||s;r.set(i,[...r.get(i)??[],s])});let a=0;Array.from(r).forEach(([s,i],p)=>{const c=t&&typeof s=="string"&&i.length>1;i.forEach((h,f)=>{a+=1,h.style.order!==String(a)&&(h.style.order=String(a)),G(h,I,c&&f===0?s:void 0),G(h,M,c?"":void 0),G(h,le,t&&p>0&&f===0?"":void 0)})})};function rt(e,t){document.querySelectorAll(C).forEach(n=>{const o=n.querySelector(`:scope > ${xe}`),r=n.querySelector(`:scope > ${Z} > div`),a=new Set;t?(L(n,F,""),n.querySelector(`:scope > ${Z} > button[aria-expanded="false"]`)?.click(),Be(Q(o),e,Q(r)),a.add(o).add(r)):n.removeAttribute(F),new Set(Array.from(n.querySelectorAll(g),s=>s.parentElement)).forEach(s=>{if(a.has(s))return;const i=s.getAttribute(T)==="closed",p=Q(s).filter(c=>!i||c.getAttribute("data-state")==="active");Q(s).filter(c=>!p.includes(c)).forEach(ot),Be(p,e)})})}function Ut(e){document.querySelectorAll(`${g} > [${j}]`).forEach(t=>{t.parentElement.getAttribute(I)!==t.getAttribute(j)&&t.remove()}),document.querySelectorAll(`${g}[${I}]`).forEach(t=>{t.querySelector(`:scope > [${j}]`)||t.append(e(t.getAttribute(I)))})}function Wt({name:e,label:t,icon:n,onSelect:o}){const r=document.createElement("div");return r.setAttribute(j,e),r.setAttribute("role","button"),r.setAttribute("aria-label",t),r.setAttribute("title",t),n(r),at(r,o),r}function at(e,t){const n=o=>{o.preventDefault(),o.stopPropagation(),t()};e.setAttribute("tabindex","0"),e.addEventListener("pointerdown",o=>o.stopPropagation()),e.addEventListener("click",n),e.addEventListener("keydown",o=>{(o.key==="Enter"||o.key===" ")&&n(o)})}function zt(){rt(!1,!1),document.querySelectorAll(`[${j}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${T}]`).forEach(e=>e.removeAttribute(T)),document.querySelectorAll(`[${O}]`).forEach(e=>{[O,Ce,"role","tabindex","aria-expanded"].forEach(t=>e.removeAttribute(t))})}const Ft=`${g} > span:nth-of-type(3)`,Gt=':scope > span > span[dir="ltr"]',R="data-plus-pr",Ue="data-plus-pr-url",Ht=120*1e3,re=e=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${e}</svg>`,We={open:re('<circle cx="5" cy="6" r="3"/><path d="M5 9v12"/><circle cx="19" cy="18" r="3"/><path d="m15 9-3-3 3-3"/><path d="M12 6h5a2 2 0 0 1 2 2v7"/>'),draft:re('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 6V5"/><path d="M18 11v-1"/><path d="M6 9v12"/>'),merged:re('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>'),closed:re('<circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="m21 3-6 6"/><path d="m21 9-6-6"/><path d="M18 11.5V15"/><circle cx="18" cy="18" r="3"/>')},ze={open:["oklch(59.6% 0.145 163.225)","oklch(84.5% 0.143 164.978 / 0.9)"],draft:["oklch(55.2% 0.016 285.938)","oklch(70.5% 0.015 286.067 / 0.8)"],merged:["oklch(54.1% 0.281 293.009)","oklch(81.1% 0.111 293.571 / 0.9)"],closed:["oklch(57.7% 0.245 27.325)","oklch(80.8% 0.114 19.571 / 0.9)"]},Vt=`
[${R}] {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  margin-inline-start: auto;
  padding-inline: 2px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}
[${R}] ~ .ms-auto {
  margin-inline-start: 0;
}
[${R}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${R}]::before {
  content: "";
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  background-color: var(--plus-pr);
}
${Object.keys(We).map(e=>`[${R}="${e}"] {
  --plus-pr: ${ze[e][0]};
}
[data-color-scheme="dark"] [${R}="${e}"] {
  --plus-pr: ${ze[e][1]};
}
[${R}="${e}"]::before {
  mask: url("data:image/svg+xml,${encodeURIComponent(We[e])}") center / 12px no-repeat;
}`).join(`
`)}
`,_t=e=>`git remote get-url origin && GH_NO_UPDATE_NOTIFIER=1 gh pr list --state all --limit 20 --json number,title,url,state,isDraft,updatedAt,headRepositoryOwner --head ${Xe(e)} 2>/dev/null`;function Kt(e){const[t,...n]=e.trim().split(/\r?\n/),o=t.match(/[:/]([^/:]+)\/[^/]+$/)?.[1].toLowerCase(),r=JSON.parse(n.join(`
`)).filter(i=>i.headRepositoryOwner?.login.toLowerCase()===o).toSorted((i,p)=>Date.parse(p.updatedAt)-Date.parse(i.updatedAt)),a=r.find(i=>i.state==="OPEN")??r[0];if(!a)return;const s=a.state==="OPEN"&&a.isDraft?"draft":a.state.toLowerCase();return{number:a.number,title:a.title,url:a.url,state:s}}const Y=new Map;let ke=new Set,Fe=Promise.resolve();function Jt({lookup:e,open:t,label:n}){const o=Date.now(),r=Array.from(document.querySelectorAll(Ft),s=>{const i=s.querySelector(Gt),p=i?.textContent.trim(),c=s.parentElement;return{line:s,row:c,branch:p,key:p&&`${we(c)}
${p}`,holder:i?.parentElement}}),a=new Set(r.filter(({row:s,key:i})=>i&&s.getAttribute("data-status")==="working").map(({key:s})=>s));ke.forEach(s=>{const i=Y.get(s);!a.has(s)&&i?.time!==void 0&&(i.time=0)}),ke=a,r.forEach(({line:s,row:i,branch:p,key:c,holder:h})=>{const f=c&&Y.get(c);let u=s.querySelector(`:scope > [${R}]`);c&&(!f||f.time!==void 0&&o-f.time>=Ht)&&Yt(c,()=>e(we(i),p));const m=f?.pull;if(!m)return u?.remove();u||(u=document.createElement("span"),u.setAttribute("role","link"),at(u,()=>t(u.getAttribute(Ue))));const E=n(m);u.previousElementSibling!==h&&h.after(u),L(u,R,m.state),L(u,Ue,m.url),L(u,"title",E),L(u,"aria-label",E),u.textContent!==`#${m.number}`&&(u.textContent=`#${m.number}`)})}const Yt=(e,t)=>{const n=Fe.then(t).catch(()=>{});Y.set(e,{pull:Y.get(e)?.pull}),Fe=n,n.then(o=>Y.set(e,{time:Date.now(),pull:o}))};function Xt(){Y.clear(),ke=new Set,document.querySelectorAll(`[${R}]`).forEach(e=>e.remove())}function st(e={}){const t=e.archiveAfterHours;return{archiveAfterHours:typeof t=="number"&&t>=0?t:12,hideAgent:typeof e.hideAgent=="string"||e.hideAgent===!1?e.hideAgent:"build",responseLabel:typeof e.responseLabel=="string"?e.responseLabel:e.responseLabel===!1?"":"Response",lowercaseVariants:e.lowercaseVariants!==!1}}const Qt="[data-timeline-virtual-content]",it='[data-slot="session-turn-message-container"]',oe="data-plus-final",ge=`[${oe}] > [data-component="session-turn"] > ${it}`,Le="--plus-label-half";function Zt(e){return`
${ge} {
  --plus-gap: calc(var(${Le}, ${e.length*3.75}px) + 12px);
  position: relative;
}
${ge}::before {
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
${ge}::after {
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
`}let Ge=!1;function en(e){const t=document.querySelector(it);if(Ge||!e||!t||document.fonts?.status==="loading")return;const n=document.createElement("span");n.textContent=e,n.style.cssText="position: absolute; visibility: hidden; white-space: nowrap; font-size: 13px; font-weight: 440; letter-spacing: -0.04px",t.append(n);const o=n.getBoundingClientRect().width;n.remove(),o&&(document.documentElement.style.setProperty(Le,`${o/2}px`),Ge=!0)}const z=e=>e?.frame?.getAttribute("data-timeline-row"),W=e=>e?.frame?.getAttribute("data-message-id"),be=e=>z(e)==="AssistantPart"&&!!e.frame.querySelector('[data-component="text-part"]')&&!e.frame.querySelector('[data-component="tool-part-wrapper"], [data-timeline-part-ids]');function tn(e){document.querySelectorAll(Qt).forEach(t=>{const n=Array.from(t.querySelectorAll(":scope > div > [data-timeline-key]"),c=>({wrapper:c,frame:c.querySelector(":scope > [data-index] > [data-timeline-row]"),top:parseFloat(c.style.top),height:parseFloat(c.style.height)})).sort((c,h)=>c.top-h.top),o=t.querySelector(':scope > [data-timeline-row="bottom-spacer"]'),r=c=>n[c+1]&&Math.abs(n[c+1].top-(n[c].top+n[c].height))<2?n[c+1]:void 0,a=c=>n[c-1]&&Math.abs(n[c].top-(n[c-1].top+n[c-1].height))<2?n[c-1]:void 0,s=c=>c===n.length-1&&!!o&&Math.abs(n[c].wrapper.getBoundingClientRect().bottom-o.getBoundingClientRect().top)<2,i=e?void 0:!0,p=c=>{const h=r(c);return h?h.frame?z(h)==="TurnGap"||z(h)==="UserMessage"||W(h)&&W(h)!==W(n[c])||z(h)==="TurnDiff"||z(h)==="TurnDivider"?!0:z(h)==="AssistantPart"||z(h)==="Thinking"?!1:i:i:n[c+1]||!s(c)?void 0:i};n.forEach((c,h)=>{if(!be(c))return ve(c,!1);const f=p(h);if(f===void 0)return;if(!f){const m=r(h);be(m)&&W(m)===W(c)||ve(c,!1);return}let u=h;for(;be(a(u))&&W(a(u))===W(c);)u-=1;for(let m=u;m<=h;m+=1)ve(n[m],m===u&&n[m].frame.hasAttribute("data-timeline-spacing"))})})}const ee=new Map,ve=(e,t)=>{!e.frame||e.frame.hasAttribute(oe)===t||(G(e.frame,oe,t?"":void 0),ee.set(e.frame.parentElement,10))};function nn(){ee.forEach((e,t)=>{if(!(t.isConnected&&Math.abs(t.offsetHeight-parseFloat(t.parentElement.style.height))>=1)||e===0)return ee.delete(t);ee.set(t,e-1),t.style.paddingBottom="1px",requestAnimationFrame(()=>t.style.removeProperty("padding-bottom"))})}const on=()=>ee.size>0;function rn(){document.querySelectorAll(`[${oe}]`).forEach(e=>e.removeAttribute(oe)),document.documentElement.style.removeProperty(Le)}const an='[data-component="tooltip-v2-trigger"] > button:not([aria-haspopup]):has([data-component="progress-circle"])',S="data-plus-usage",He="plus-usage-card",Ee="data-plus-usage-hover",sn=50,cn=100,ln=4,dn=`
:root[${Ee}] [data-component="tooltip-v2"]:not([data-force-open="true"]) {
  display: none;
}
[${S}] {
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
[${S}]:dir(rtl) {
  transform-origin: top left;
}
[${S}] [data-part="row"] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
  white-space: nowrap;
}
[${S}] [data-part="row"] > :last-child {
  margin-inline-start: auto;
}
[${S}] :is([data-part="value"], [data-part="percent"]) {
  color: var(--v2-text-text-base);
}
[${S}] [data-part="percent"] {
  font-weight: 530;
}
[${S}] [data-part="bar"] {
  display: flex;
  height: 8px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--v2-background-bg-layer-03);
}
[${S}] [data-part="bar"] > span {
  box-sizing: border-box;
  min-width: 3px;
}
/* A line in the card's color between kinds, as in Cursor's bar. */
[${S}] [data-part="bar"] > span + span {
  border-inline-start: 1px solid var(--v2-background-bg-layer-01);
}
[${S}] [data-part="legend"] {
  display: flex;
  flex-direction: column;
}
[${S}] [data-part="dot"] {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
[${S}] hr {
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
  [${S}] {
    animation: none;
  }
}
:root[data-motion="reduce"] [${S}] {
  animation: none;
}
`;function un(e){let t,n,o=0;const r=document.documentElement,a=(l,x)=>{clearTimeout(o),o=setTimeout(l,x)},s=l=>l.target instanceof Element?l.target.closest(an):null,i=l=>l instanceof Node&&!!(t?.contains(l)||n?.card.contains(l)),p=()=>{if(!t.isConnected)return;const l=document.createElement("div"),x=t.closest("[data-theme]")?.getAttribute("data-theme");l.id=He,l.setAttribute(S,""),l.setAttribute("role","tooltip"),x&&l.setAttribute("data-theme",x),n={card:l,stop:e(l)},document.body.append(l),fn(l,t),t.setAttribute("aria-describedby",He)},c=()=>{clearTimeout(o),n?.stop(),n?.card.remove(),n=void 0,t?.removeAttribute("aria-describedby")},h=l=>{if(l===t){n&&clearTimeout(o);return}f(),t=l,r.setAttribute(Ee,""),a(p,sn)},f=()=>{c(),t=void 0,r.removeAttribute(Ee)},u=l=>{if(l.pointerType==="touch")return;const x=s(l);if(x)return h(x);if(n?.card.contains(l.target))return clearTimeout(o);t&&!t.isConnected&&f()},m=l=>{!t||i(l.relatedTarget)||!i(l.target)||(n?a(f,cn):f())},E=l=>{t?.contains(l.target)&&c()},P=l=>{l.key==="Escape"&&c()},b=l=>{const x=s(l);x?.matches(":focus-visible")&&h(x)},$=l=>{t?.contains(l.target)&&!i(l.relatedTarget)&&f()};return document.addEventListener("pointerover",u),document.addEventListener("pointerout",m),document.addEventListener("pointerdown",E,!0),document.addEventListener("keydown",P),document.addEventListener("focusin",b),document.addEventListener("focusout",$),()=>{document.removeEventListener("pointerover",u),document.removeEventListener("pointerout",m),document.removeEventListener("pointerdown",E,!0),document.removeEventListener("keydown",P),document.removeEventListener("focusin",b),document.removeEventListener("focusout",$),f()}}function pn(e){const t=e.server.data,n=e.directory?{directory:e.directory}:void 0,o=t.session.get(e.id),r=t.session.message.list(e.id),a=vt.lastAssistantWithUsage(r,o?.revert?.messageID),s=a?.tokens,i=s?s.input+s.output+s.reasoning+s.cache.read+s.cache.write:0,p=a?Ve(t,n,a.model)?.limit.context:void 0,c=t.session.cost(e.id),h=o?.model??r.findLast(m=>m.type==="assistant")?.model,f=h?Ve(t,n,h):void 0,u=!!f&&f.cost.every(m=>!m.input&&!m.output&&!m.cache.read&&!m.cache.write);return{total:i,tokens:s,limit:p||void 0,percent:p?Math.round(i/p*100):void 0,cost:c>0||!u?c:void 0}}function hn({total:e,tokens:t,limit:n,percent:o,cost:r},a,s){const i=u=>new Intl.NumberFormat(s,{notation:"compact",maximumFractionDigits:0}).format(u).toLocaleLowerCase(s),p=t?mn.map(u=>({...u,value:u.value(t)})).filter(u=>u.value>0):[],c=Math.max(n??0,e),h=q("span",void 0,n?`${i(e)} / ${i(n)} `:i(e));n&&h.append(q("span","percent",`(${o}%)`));const f=[ye([q("span",void 0,a("usage.window")),h])];if(c>0){const u=q("div","bar");u.setAttribute("aria-hidden","true"),p.forEach(m=>{const E=q("span");E.style.width=`${m.value/c*100}%`,E.style.background=m.color,u.append(E)}),f.push(u)}if(p.length){const u=q("div","legend");p.forEach(m=>{const E=q("span","dot");E.style.background=m.color,u.append(ye([E,q("span",void 0,a(m.label)),q("span","value",m.value.toLocaleString(s))]))}),f.push(u)}if(r!==void 0){const u=new Intl.NumberFormat(s,{style:"currency",currency:"USD"});f.push(q("hr"),ye([q("span",void 0,a("usage.cost")),q("span","value",u.format(r))]))}return f}const mn=[{label:"usage.cacheRead",color:"var(--v2-avatar-border-blue)",value:e=>e.cache.read},{label:"usage.cacheWrite",color:"var(--v2-avatar-border-purple)",value:e=>e.cache.write},{label:"usage.input",color:"var(--v2-avatar-border-pink)",value:e=>e.input},{label:"usage.reasoning",color:"var(--v2-avatar-border-yellow)",value:e=>e.reasoning},{label:"usage.output",color:"var(--v2-avatar-border-green)",value:e=>e.output}],Ve=(e,t,n)=>{const o=e.location.provider.list(t),r=e.location.model.list(t);if(o?.some(a=>a.id===n.providerID))return r?.findLast(a=>a.providerID===n.providerID&&a.id===n.id&&a.status!=="deprecated")},q=(e,t,n)=>{const o=document.createElement(e);return t&&o.setAttribute("data-part",t),n!==void 0&&(o.textContent=n),o},ye=e=>{const t=q("div","row");return t.append(...e),t},fn=(e,t)=>{const n=t.getBoundingClientRect(),o=e.offsetWidth,r=getComputedStyle(t).direction==="rtl"?n.left:n.right-o;e.style.top=`${n.bottom+ln}px`,e.style.left=`${Math.max(8,Math.min(r,innerWidth-o-8))}px`},qe='[data-component="user-message"]',gn=`${qe} [data-slot="user-message-actions"]`,ct='[data-slot="user-message-text"]',bn='[data-component="tooltip-v2-trigger"]',de="data-plus-copy",vn=`
[${de}] {
  display: contents;
}
[${de}] [data-slot="icon-svg"] {
  width: 14px;
  height: 14px;
}
`,te=new Map;function yn(e){te.forEach((t,n)=>{n.isConnected||(t(),n.remove(),te.delete(n))}),document.querySelectorAll(gn).forEach(t=>{const n=t.querySelector(`:scope > ${bn}`);if(!n||t.querySelector(`:scope > [${de}]`)||!t.closest(qe).querySelector(ct))return;const o=document.createElement("span");o.setAttribute(de,""),o.addEventListener("mousedown",r=>r.preventDefault()),te.set(o,e(o)),t.insertBefore(o,n)})}const $n=({ui:e,label:t,copied:n,write:o})=>r=>ae.render(()=>{const[a,s]=D.createSignal(!1),i=()=>a()?n:t,p=async c=>{c.stopPropagation(),await o(wn(r.closest(qe)))&&(s(!0),setTimeout(()=>s(!1),2e3))};return D.createComponent(e.Tooltip,{get value(){return i()},get children(){return D.createComponent(e.IconButton,{get icon(){return a()?"check":"outline-copy"},get label(){return i()},size:"small",onClick:p})}})},r),wn=e=>{const t=e.querySelector(ct).cloneNode(!0);return t.querySelectorAll('[data-slot="user-message-comments"], [data-slot="user-message-fold-toggle"]').forEach(n=>n.remove()),t.querySelectorAll("[data-session-reference]").forEach(n=>n.replaceWith(n.dataset.sessionReference)),t.textContent};function kn(){te.forEach((e,t)=>{e(),t.remove()}),te.clear()}const Ae=60*1e3,En=60*Ae,_e="tab.new",$e="sidecar";function An(e){const t=st(e.options),{shelf:n,groups:o,working:r}=e.stores,a=(d,y)=>v=>ae.insert(v,()=>D.createComponent(e.ui.Icon,{name:d,...y})),s=()=>{const d=e.sessions.current();try{const y=d?.server.data.session;return!!d&&(y.status(d.id)==="running"||y.pending.list(d.id).some(v=>v.type!=="synthetic"))}catch{return!1}},i=()=>n.update(d=>{d.archivedOpen=!d.archivedOpen}),p=async d=>(await e.client.project.list()).filter(v=>(v.name||v.canonical.split("/").pop())===d).toSorted((v,w)=>w.time.active-v.time.active)[0],c=async d=>{const y=await p(d);if(!y)return e.layout.project($e,e.t("session.new"));e.layout.draft({server:$e,directory:y.canonical,prompt:""})},h=d=>Wt({name:d,label:e.t("session.newIn",{project:d}),icon:a("plus",{size:"small"}),onSelect:()=>{c(d).catch(()=>e.toast.show({title:e.t("session.failed",{project:d})}))}}),f=async(d,y)=>{const v={directory:d};let{data:w}=await e.client.shell.create({location:v,command:y,timeout:Ae});try{for(;w.status==="running";)await new Promise(V=>setTimeout(V,100)),w=(await e.client.shell.get({id:w.id,location:v})).data;const{data:N}=await e.client.shell.output({id:w.id,location:v});return{ok:w.exit===0,output:N.output}}finally{e.client.shell.remove({id:w.id,location:v}).catch(()=>{})}},u=async(d,y)=>{try{const v=await p(d),w=v&&await f(v.canonical,_t(y));return w?.ok?Kt(w.output):void 0}finally{B()}},m=async d=>{const y=await Lt(d,()=>e.client.project.list()),v=y&&await f(y,xt);return v?.ok?{directory:y,...qt(v.output)}:void 0},E=async(d,y,v)=>{const w=N=>e.toast.show({variant:"error",title:v,description:N.trim()});try{const N=await f(d,Tt(...y));if(!N.ok)return w(N.output);const V=e.servers.get($e)?.data;V?.location.vcs.invalidate({directory:d}),await V?.location.vcs.sync({directory:d})}catch(N){w(String(N?.message??N))}},P=(d,y)=>D.createRoot(v=>{const[w,N]=D.createSignal(),[V,Me]=D.createSignal(!1);let ue=!1;const pe=()=>{ue||(ue=!0,m(y).catch(()=>{}).then(k=>N(k??null)).finally(()=>{ue=!1}))},Oe=async(k,U)=>{Me(!0),await E(w().directory,k,U),Me(!1),pe()},pt=k=>{k!==w().current&&Oe([k],e.t("branch.failed",{branch:k}))},ht=async()=>{const k=w().current,_=(await e.dialogs.prompt({title:e.t("branch.create"),description:k&&e.t("branch.from",{branch:k}),placeholder:e.t("branch.name"),submit:e.t("branch.submit")}))?.trim().replace(/\s+/g,"-");_&&await Oe(["-c",_],e.t("branch.uncreated",{branch:_}))},Re=(k,U=k)=>({label:U,onSelect:()=>pt(k)}),mt=()=>{const k=w();if(k===void 0)return[{label:e.t("branch.loading"),disabled:!0}];if(k===null)return[{label:e.t("branch.unlisted"),disabled:!0}];const U=[{label:e.t("branch.new"),icon:"plus",onSelect:()=>{ht()}},{type:"separator"}],_=k.local.map(he=>Re(he));if(k.remote.length===0)return[...U,..._];const ft=k.remote.map(({name:he,ref:bt})=>Re(he,bt)),gt={type:"group",label:e.t("branch.remote"),items:ft};return[...U,..._,{type:"separator"},gt]};return d.addEventListener("pointerenter",pe),d.addEventListener("focusin",pe),ae.insert(d,()=>D.createComponent(e.ui.Menu,{label:e.t("branch.switch"),trigger:"button",placement:"bottom-start",get disabled(){return V()},get items(){return mt()}})),v}),b=$n({ui:e.ui,label:e.t("message.copy"),copied:e.t("message.copied"),write:d=>e.system.copy(d).then(()=>!0,()=>(e.toast.show({title:e.t("message.copyFailed")}),!1))}),$=()=>{Pt(n.value.archivedOpen),rt(o.value.enabled,r.value.inline),Ut(h),Jt({lookup:u,open:d=>e.system.openExternal(d),label:({number:d,state:y,title:v})=>e.t("pr.label",{number:d,state:e.t(`pr.${y}`),title:v})}),St(P),Ct(),Mt(t.hideAgent),Ot(Ne),yn(b),en(t.responseLabel),nn(),tn(s()),on()&&!x&&(x=setTimeout(()=>{x=0,B()},300))};let l=0,x=0,Te=!1;const B=()=>{l||Te||(l=requestAnimationFrame(()=>{l=0,$()}))},Ie=new MutationObserver(B);Ie.observe(document.body,{childList:!0,subtree:!0});const Ne=new MutationObserver(B),lt=setInterval(B,Ae);document.addEventListener("scrollend",B,!0);const dt=Bt(i),ut=un(d=>D.createRoot(y=>(ae.insert(d,()=>{const v=e.sessions.current();return v?hn(pn(v),e.t,e.locale.locale()):[]}),y)));return A.createKeyed(()=>`${n.value.archivedOpen}:${o.value.enabled}:${r.value.inline}:${s()}`,$),e.add(A.Style,jt),e.add(A.Style,Vt),e.add(A.Style,At),e.add(A.Style,Nt(t)),e.add(A.Style,Zt(t.responseLabel)),e.add(A.Style,dn),e.add(A.Style,vn),e.add(A.Slot,{at:"session.location.menu",order:100,render:d=>Dt({label:e.t("session.new"),icon:a("edit",{class:"shrink-0 text-v2-icon-icon-muted"}),shortcut:e.keybinds.keybind(_e).join(""),onSelect:()=>{e.commands.run(_e)||e.layout.draft({server:d.session.server.id,directory:d.session.directory,prompt:""})}})}),e.add(A.Command,()=>({id:"toggle-archived",title:e.t(n.value.archivedOpen?"archived.hide":"archived.show"),keywords:"archive archived settled sessions sidebar inbox",run:i})),e.add(A.Command,()=>({id:"toggle-groups",title:e.t(o.value.enabled?"groups.off":"groups.on"),keywords:"group project projects folders sessions sidebar inbox",run:()=>o.update(d=>{d.enabled=!d.enabled})})),e.add(A.Command,()=>({id:"toggle-working",title:e.t(r.value.inline?"working.section":"working.inline"),keywords:"working running busy section shelf sessions sidebar inbox",run:()=>r.update(d=>{d.inline=!d.inline})})),()=>{Te=!0,Ie.disconnect(),Ne.disconnect(),cancelAnimationFrame(l),clearTimeout(x),clearInterval(lt),document.removeEventListener("scrollend",B,!0),dt(),ut(),zt(),Xt(),It(),Rt(),rn(),kn()}}function xn(e){const{archiveAfterHours:t}=st(e.options);if(t>0)return $t(e,t*En)}const Sn=A.Plugin.define({stores:{shelf:A.Store.global(K.Schema.Struct({archivedOpen:K.Schema.Boolean}),{archivedOpen:!1}),groups:A.Store.global(K.Schema.Struct({enabled:K.Schema.Boolean}),{enabled:!0}),working:A.Store.global(K.Schema.Struct({inline:K.Schema.Boolean}),{inline:!0})},i18n:{en:{"archived.show":"Show archived sessions","archived.hide":"Hide archived sessions","groups.on":"Group sessions by project","groups.off":"Stop grouping sessions by project","working.inline":"Show working sessions in the list","working.section":"Show working sessions in their own section","session.new":"New session","session.newIn":"New session in {{project}}","session.failed":"Could not start a session in {{project}}","usage.window":"Context window","usage.cacheRead":"Cache read","usage.cacheWrite":"Cache write","usage.input":"Input","usage.reasoning":"Reasoning","usage.output":"Output","usage.cost":"Cost","branch.switch":"Switch branch","branch.loading":"Loading…","branch.unlisted":"Could not list the branches","branch.remote":"Remote","branch.failed":"Could not switch to {{branch}}","branch.new":"New branch…","branch.create":"Create branch","branch.from":"The new branch starts from {{branch}}, with your changes.","branch.name":"Branch name","branch.submit":"Create","branch.uncreated":"Could not create {{branch}}","pr.label":"PR #{{number}}, {{state}}: {{title}}","pr.open":"open","pr.draft":"draft","pr.merged":"merged","pr.closed":"closed","message.copy":"Copy message","message.copied":"Copied","message.copyFailed":"Could not copy the message"}},setup:An,main:xn});exports.default=Sn;
