"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const x=require("@opencode/plugin/gui"),_=require("effect"),K=require("solid-js"),ue=require("solid-js/web"),ht=require("@opencode/client/solid"),re=60*1e3,pe=200,Ne=["session.inbox.enqueued","session.execution.started","session.unarchived"],Me=Symbol.for("opencode-plus.archive");function mt(e,t,n,o){const{created:r,updated:a,busy:s,idle:c,archived:h}=e.time;if(h!==void 0||e.parentID||s!==void 0&&(c===void 0||s>c))return!1;const i=Math.max(r,s??0,c??0);return(Number(e.metadata?.[o])||0)>=i||t-a<2*re?!1:t-i>=n}function ft(e,t){const n=`${e.id}.keptAt`,o=Date.now(),r=new AbortController,a=r.signal,s=b=>e.log.write("error",`${e.id}: ${b?.stack??b}`),c=async()=>{const b=[];let y=await e.client.session.list({parentID:null,archived:!1,limit:pe});for(;;){if(b.push(...y.data),y.data.length<pe||!y.cursor.next)return b;y=await e.client.session.list({cursor:y.cursor.next,limit:pe})}};let h=!1;const i=async()=>{if(!h){h=!0;try{const b=Date.now(),y=(await c()).filter(l=>mt(l,b,t,n));for(const l of y)await e.client.session.update({sessionID:l.id,archived:!0}),e.log.write("info",`${e.id}: archived ${l.id} "${l.title??""}"`)}finally{h=!1}}},p=async b=>{if(!Ne.includes(b.type)||b.created<o-re||b.type==="session.inbox.enqueued"&&b.data.item.type!=="user")return;const y=await e.client.session.get({sessionID:b.data.sessionID}),l=y.time.archived;if(b.type!=="session.unarchived"){if(l===void 0||b.created<=l)return;await e.client.session.update({sessionID:y.id,archived:!1}),e.log.write("info",`${e.id}: unarchived ${y.id} on ${b.type}`);return}l!==void 0||(Number(y.metadata?.[n])||0)>=b.created||await e.client.session.update({sessionID:y.id,metadata:{...y.metadata,[n]:b.created}})},f=async()=>{for(;!a.aborted;){try{const b=e.client.event.subscribe({types:Ne},{signal:a});for await(const y of b)p(y).catch(s)}catch(b){a.aborted||s(b)}a.aborted||await new Promise(b=>setTimeout(b,5e3))}},u=()=>{i().catch(s)},m=setTimeout(u,re),E=setInterval(u,10*re),j=()=>{a.aborted||(clearTimeout(m),clearInterval(E),r.abort())};return globalThis[Me]?.(),globalThis[Me]=j,e.signal.addEventListener("abort",j,{once:!0}),f(),j}const L=(e,t,n)=>{e.getAttribute(t)!==n&&e.setAttribute(t,n)},G=(e,t,n)=>n===void 0?e.removeAttribute(t):L(e,t,n),Fe='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5L8 9.5L11.5 6.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',He='[data-slot="new-session-composer"]',gt='[data-slot="new-session-location-path"]',bt=["branch","new-branch"].map(e=>`${He} use[href="#opencode-v2-icon-${e}"]`).join(", "),F="data-plus-branch",te="data-plus-branch-trigger",X="data-plus-branch-menu",Ve="data-plus-branch-current",vt='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M3.53564 8.17857L6.39279 11.75L12.4642 4.25" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',yt=`
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
  mask: url("data:image/svg+xml,${encodeURIComponent(Fe)}") center / 16px no-repeat;
}
[${F}]:is(:hover, :has(:focus-visible), :has([data-expanded])) {
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${te}] {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
[${te}] > button {
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
[${X}] [${Ve}]::after {
  background-color: var(--menu-v2-icon);
  mask: url("data:image/svg+xml,${encodeURIComponent(vt)}") center / 14px no-repeat;
}
`,wt="git branch --all --no-color --no-column --sort=-committerdate",J=new Map;function $t(e){J.forEach((t,n)=>{n.isConnected||(t(),J.delete(n))}),document.querySelectorAll(bt).forEach(t=>{const n=t.closest("svg").parentElement;if(J.has(n))return;const o=document.createElement("div");o.setAttribute(te,""),n.setAttribute(F,""),n.append(o),J.set(n,e(o,n))})}function kt(){document.querySelectorAll(`[${te}] > [aria-controls]`).forEach(e=>{const t=document.getElementById(e.getAttribute("aria-controls"));if(!t)return;const n=e.closest(`[${F}]`).querySelector(":scope > span").textContent.trim();L(t,X,""),t.querySelectorAll('[data-component="menu-v2-item"]').forEach(o=>{const r=o.querySelector('[data-slot="menu-v2-item-content"] > span');G(o,Ve,o.textContent.trim()===n?"":void 0),r&&G(o,"title",r.scrollWidth>r.clientWidth?r.textContent:void 0)})})}async function Et(e,t){const n=e.closest(He)?.querySelector(gt)?.textContent??"";if(!n.includes("…"))return n||void 0;const[o,r]=n.split("…");return(await t()).flatMap(a=>[a.canonical,...a.sandboxes]).find(a=>a.startsWith(o)&&a.endsWith(r))}function At(e){const t=new Set,n=[],o=new Map;let r;for(const s of e.split(/\r?\n/)){const c=s.slice(2).trim();if(!(!c||c.startsWith("(")||c.includes(" -> "))){if(c.startsWith("remotes/")){const h=c.slice(8),i=h.slice(h.indexOf("/")+1);o.has(i)||o.set(i,h);continue}t.add(c),s.startsWith("*")&&(r=c),s.startsWith("+")||n.push(c)}}const a=Array.from(o,([s,c])=>({name:s,ref:c})).filter(({name:s})=>!t.has(s));return{current:r,local:n,remote:a}}const xt=(...e)=>["git","switch",...e.map(_e)].join(" "),_e=e=>/^[\w./-]+$/.test(e)?e:`'${e.replaceAll("'","'\\''")}'`;function St(){J.forEach(e=>e()),J.clear(),document.querySelectorAll(`[${te}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${F}]`).forEach(e=>e.removeAttribute(F))}const Ke='[data-slot="composer-controls"]',Je=`${Ke} > div > [data-component="tooltip-v2-trigger"]`,Ye='[data-action="composer-model"]',Xe=`${Je}:has(~ [data-component="tooltip-v2-trigger"] ${Ye})`,Qe=`${Je}:has(${Ye}) ~ [data-component="tooltip-v2-trigger"]`,ae="data-plus-hidden-agent",se="data-plus-variant-menu";function Lt({lowercaseVariants:e}){return`
${Xe}[${ae}] {
  display: none;
}
${e?`${Qe} .capitalize,
[${se}] .capitalize {
  text-transform: lowercase;
}`:""}
`}function Ct(e){document.querySelectorAll(Xe).forEach(t=>{const n=e!==!1&&t.textContent.trim().toLowerCase()===e.toLowerCase();G(t,ae,n?"":void 0)}),document.querySelectorAll(`${Qe} [aria-controls]`).forEach(t=>{const n=document.getElementById(t.getAttribute("aria-controls"));n&&L(n,se,"")})}const Re=new WeakSet;function It(e){document.querySelectorAll(Ke).forEach(t=>{Re.has(t)||(Re.add(t),e.observe(t,{subtree:!0,characterData:!0}))})}function Tt(){document.querySelectorAll(`[${ae}]`).forEach(e=>e.removeAttribute(ae)),document.querySelectorAll(`[${se}]`).forEach(e=>e.removeAttribute(se))}function qt({label:e,icon:t,shortcut:n,onSelect:o}){const r=document.createElement("hr");r.setAttribute("data-slot","menu-v2-separator");const a=document.createElement("div");a.setAttribute("role","menuitem"),a.setAttribute("data-component","menu-v2-item");const s=document.createElement("span");if(s.setAttribute("data-slot","menu-v2-item-content"),t(s),s.append(e),a.append(s),n){const c=document.createElement("span");c.setAttribute("data-slot","menu-v2-item-shortcut"),c.textContent=n,a.append(c)}return a.addEventListener("pointerenter",()=>a.setAttribute("data-highlighted","")),a.addEventListener("pointerleave",()=>a.removeAttribute("data-highlighted")),a.addEventListener("click",()=>{a.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:!0})),o()}),queueMicrotask(()=>{const c=a.closest('[role="menu"]')?.querySelector("[data-appearance]")?.getAttribute("data-appearance");c&&(a.setAttribute("data-appearance",c),r.setAttribute("data-appearance",c))}),[r,a]}const S='[data-slot="sidebar-inbox"]',Ee='[data-slot="sidebar-inbox-scroll"]',Z='[data-slot="sidebar-inbox-working"]',Ae=`${Ee} > div.pt-3`,g='[data-slot="sidebar-inbox-item"]',T="data-plus-shelf",R="data-plus-toggle",xe="data-plus-count",q="data-plus-group",ie="data-plus-gap",M="data-plus-member",z="data-plus-inline",D="data-plus-add",he=`${S} ${g}[data-status="ready"]:not([data-state="active"], :hover:not(:has([${D}]:hover)), :focus-visible, [${T}] > *)`,Nt=`
${Ae} {
  order: 100000;
  margin-top: auto;
}
${S}[${z}] {
  overflow-y: auto;
  gap: 1px;
  padding-bottom: 4px;
}
[${z}] > ${Ee},
[${z}] > ${Z},
[${z}] > ${Z} > div {
  display: contents;
}
[${z}] > ${Z} > button {
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
  content: attr(${xe});
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
  mask: url("data:image/svg+xml,${encodeURIComponent(Fe)}") center / 16px no-repeat;
}
[${T}="closed"] > [${R}]::after {
  rotate: -90deg;
}
[${T}="closed"] > [${R}]:dir(rtl)::after {
  rotate: 90deg;
}
[${T}="closed"] > ${g}:not([data-state="active"]) {
  display: none;
}
${S} ${g}[data-status="working"] {
  opacity: 1;
}
${S} ${g}[data-status="working"] > span:nth-of-type(2) {
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
${S} ${g}[data-status="working"] > span:first-child > span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--plus-working);
}
${S} ${g}[data-status="working"] > span:first-child > span:last-child > span {
  color: inherit;
}
${S} ${g}[data-status="working"] [data-component="text-shimmer"] {
  --text-shimmer-base-color: var(--plus-working);
  --text-shimmer-peak-color: var(--plus-working-peak);
}
${S} ${g}[data-status="working"] > span:first-child > span:last-child::before {
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
  ${S} ${g}[data-status="working"] > span:first-child > span:last-child::before {
    animation: none;
  }
}
${S} ${g} > span,
${S} ${g} > span:first-child > span {
  transition: opacity 150ms;
}
${he}:not([${M}]) > span,
${he}[${M}] > span:not(:first-child),
${he}[${M}] > span:first-child > span:last-child {
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
${g}[${ie}] {
  margin-top: 16px;
}
${g}[${q}] {
  position: relative;
  margin-top: 28px;
}
${g}[${q}][${ie}] {
  margin-top: 44px;
}
${g}[${q}]::before {
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
${g}[${q}] > span:first-child > span:first-child {
  display: flex;
  position: absolute;
  inset-inline-start: 6px;
  bottom: calc(100% + 8px);
  pointer-events: none;
}
/* The heading's + button, at the far end of its 24px line, its icon in line with the times of the rows below. */
${g}[${q}] > [${D}] {
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
${g}[${q}] > [${D}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
${g}[${q}]:not([data-state="active"]):has(> [${D}]:hover) {
  background-color: transparent;
}
`,Q=e=>e?Array.from(e.children).filter(t=>t.matches(g)):[],ye=e=>e.querySelector(":scope > span:first-child > span.truncate")?.textContent?.trim(),Ze=e=>{e.style.removeProperty("order"),e.style.length===0&&e.removeAttribute("style"),e.removeAttribute(q),e.removeAttribute(ie),e.removeAttribute(M)};function Mt(e){const t=e?"open":"closed";document.querySelectorAll(Ae).forEach(n=>{const o=n.firstElementChild;!o||o.matches(g)||(L(n,T,t),L(o,R,""),L(o,xe,String(Q(n).length)),L(o,"role","button"),L(o,"tabindex","0"),L(o,"aria-expanded",String(e)))})}function Rt(e){const t=r=>r.target instanceof Element?r.target.closest(`${Ae} > [${R}]`):null,n=r=>{t(r)&&e()},o=r=>{r.key!=="Enter"&&r.key!==" "||!t(r)||(r.preventDefault(),e())};return document.addEventListener("click",n),document.addEventListener("keydown",o),()=>{document.removeEventListener("click",n),document.removeEventListener("keydown",o)}}const Oe=(e,t,n=[])=>{const o=[...n,...e];if(!t&&n.length===0)return o.forEach(Ze);const r=new Map;o.forEach(s=>{const c=t&&ye(s)||s;r.set(c,[...r.get(c)??[],s])});let a=0;Array.from(r).forEach(([s,c],h)=>{const i=t&&typeof s=="string"&&c.length>1;c.forEach((p,f)=>{a+=1,p.style.order!==String(a)&&(p.style.order=String(a)),G(p,q,i&&f===0?s:void 0),G(p,M,i?"":void 0),G(p,ie,t&&h>0&&f===0?"":void 0)})})};function et(e,t){document.querySelectorAll(S).forEach(n=>{const o=n.querySelector(`:scope > ${Ee}`),r=n.querySelector(`:scope > ${Z} > div`),a=new Set;t?(L(n,z,""),n.querySelector(`:scope > ${Z} > button[aria-expanded="false"]`)?.click(),Oe(Q(o),e,Q(r)),a.add(o).add(r)):n.removeAttribute(z),new Set(Array.from(n.querySelectorAll(g),s=>s.parentElement)).forEach(s=>{if(a.has(s))return;const c=s.getAttribute(T)==="closed",h=Q(s).filter(i=>!c||i.getAttribute("data-state")==="active");Q(s).filter(i=>!h.includes(i)).forEach(Ze),Oe(h,e)})})}function Ot(e){document.querySelectorAll(`${g} > [${D}]`).forEach(t=>{t.parentElement.getAttribute(q)!==t.getAttribute(D)&&t.remove()}),document.querySelectorAll(`${g}[${q}]`).forEach(t=>{t.querySelector(`:scope > [${D}]`)||t.append(e(t.getAttribute(q)))})}function Dt({name:e,label:t,icon:n,onSelect:o}){const r=document.createElement("div");return r.setAttribute(D,e),r.setAttribute("role","button"),r.setAttribute("aria-label",t),r.setAttribute("title",t),n(r),tt(r,o),r}function tt(e,t){const n=o=>{o.preventDefault(),o.stopPropagation(),t()};e.setAttribute("tabindex","0"),e.addEventListener("pointerdown",o=>o.stopPropagation()),e.addEventListener("click",n),e.addEventListener("keydown",o=>{(o.key==="Enter"||o.key===" ")&&n(o)})}function jt(){et(!1,!1),document.querySelectorAll(`[${D}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${T}]`).forEach(e=>e.removeAttribute(T)),document.querySelectorAll(`[${R}]`).forEach(e=>{[R,xe,"role","tabindex","aria-expanded"].forEach(t=>e.removeAttribute(t))})}const Pt=`${g} > span:nth-of-type(3)`,Bt=':scope > span > span[dir="ltr"]',O="data-plus-pr",De="data-plus-pr-url",Ut=120*1e3,oe=e=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${e}</svg>`,je={open:oe('<circle cx="5" cy="6" r="3"/><path d="M5 9v12"/><circle cx="19" cy="18" r="3"/><path d="m15 9-3-3 3-3"/><path d="M12 6h5a2 2 0 0 1 2 2v7"/>'),draft:oe('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 6V5"/><path d="M18 11v-1"/><path d="M6 9v12"/>'),merged:oe('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>'),closed:oe('<circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="m21 3-6 6"/><path d="m21 9-6-6"/><path d="M18 11.5V15"/><circle cx="18" cy="18" r="3"/>')},Pe={open:["oklch(59.6% 0.145 163.225)","oklch(84.5% 0.143 164.978 / 0.9)"],draft:["oklch(55.2% 0.016 285.938)","oklch(70.5% 0.015 286.067 / 0.8)"],merged:["oklch(54.1% 0.281 293.009)","oklch(81.1% 0.111 293.571 / 0.9)"],closed:["oklch(57.7% 0.245 27.325)","oklch(80.8% 0.114 19.571 / 0.9)"]},Wt=`
[${O}] {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  margin-inline-start: auto;
  padding-inline: 2px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}
[${O}] ~ .ms-auto {
  margin-inline-start: 0;
}
[${O}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${O}]::before {
  content: "";
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  background-color: var(--plus-pr);
}
${Object.keys(je).map(e=>`[${O}="${e}"] {
  --plus-pr: ${Pe[e][0]};
}
[data-color-scheme="dark"] [${O}="${e}"] {
  --plus-pr: ${Pe[e][1]};
}
[${O}="${e}"]::before {
  mask: url("data:image/svg+xml,${encodeURIComponent(je[e])}") center / 12px no-repeat;
}`).join(`
`)}
`,zt=e=>`git remote get-url origin && GH_NO_UPDATE_NOTIFIER=1 gh pr list --state all --limit 20 --json number,title,url,state,isDraft,updatedAt,headRepositoryOwner --head ${_e(e)} 2>/dev/null`;function Gt(e){const[t,...n]=e.trim().split(/\r?\n/),o=t.match(/[:/]([^/:]+)\/[^/]+$/)?.[1].toLowerCase(),r=JSON.parse(n.join(`
`)).filter(c=>c.headRepositoryOwner?.login.toLowerCase()===o).toSorted((c,h)=>Date.parse(h.updatedAt)-Date.parse(c.updatedAt)),a=r.find(c=>c.state==="OPEN")??r[0];if(!a)return;const s=a.state==="OPEN"&&a.isDraft?"draft":a.state.toLowerCase();return{number:a.number,title:a.title,url:a.url,state:s}}const Y=new Map;let we=new Set,Be=Promise.resolve();function Ft({lookup:e,open:t,label:n}){const o=Date.now(),r=Array.from(document.querySelectorAll(Pt),s=>{const c=s.querySelector(Bt),h=c?.textContent.trim(),i=s.parentElement;return{line:s,row:i,branch:h,key:h&&`${ye(i)}
${h}`,holder:c?.parentElement}}),a=new Set(r.filter(({row:s,key:c})=>c&&s.getAttribute("data-status")==="working").map(({key:s})=>s));we.forEach(s=>{const c=Y.get(s);!a.has(s)&&c?.time!==void 0&&(c.time=0)}),we=a,r.forEach(({line:s,row:c,branch:h,key:i,holder:p})=>{const f=i&&Y.get(i);let u=s.querySelector(`:scope > [${O}]`);i&&(!f||f.time!==void 0&&o-f.time>=Ut)&&Ht(i,()=>e(ye(c),h));const m=f?.pull;if(!m)return u?.remove();u||(u=document.createElement("span"),u.setAttribute("role","link"),tt(u,()=>t(u.getAttribute(De))));const E=n(m);u.previousElementSibling!==p&&p.after(u),L(u,O,m.state),L(u,De,m.url),L(u,"title",E),L(u,"aria-label",E),u.textContent!==`#${m.number}`&&(u.textContent=`#${m.number}`)})}const Ht=(e,t)=>{const n=Be.then(t).catch(()=>{});Y.set(e,{pull:Y.get(e)?.pull}),Be=n,n.then(o=>Y.set(e,{time:Date.now(),pull:o}))};function Vt(){Y.clear(),we=new Set,document.querySelectorAll(`[${O}]`).forEach(e=>e.remove())}function nt(e={}){const t=e.archiveAfterHours;return{archiveAfterHours:typeof t=="number"&&t>=0?t:12,hideAgent:typeof e.hideAgent=="string"||e.hideAgent===!1?e.hideAgent:"build",responseLabel:typeof e.responseLabel=="string"?e.responseLabel:e.responseLabel===!1?"":"Response",lowercaseVariants:e.lowercaseVariants!==!1}}const _t="[data-timeline-virtual-content]",ot='[data-slot="session-turn-message-container"]',ne="data-plus-final",me=`[${ne}] > [data-component="session-turn"] > ${ot}`,Se="--plus-label-half";function Kt(e){return`
${me} {
  --plus-gap: calc(var(${Se}, ${e.length*3.75}px) + 12px);
  position: relative;
}
${me}::before {
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
${me}::after {
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
`}let Ue=!1;function Jt(e){const t=document.querySelector(ot);if(Ue||!e||!t||document.fonts?.status==="loading")return;const n=document.createElement("span");n.textContent=e,n.style.cssText="position: absolute; visibility: hidden; white-space: nowrap; font-size: 13px; font-weight: 440; letter-spacing: -0.04px",t.append(n);const o=n.getBoundingClientRect().width;n.remove(),o&&(document.documentElement.style.setProperty(Se,`${o/2}px`),Ue=!0)}const W=e=>e?.frame?.getAttribute("data-timeline-row"),U=e=>e?.frame?.getAttribute("data-message-id"),fe=e=>W(e)==="AssistantPart"&&!!e.frame.querySelector('[data-component="text-part"]')&&!e.frame.querySelector('[data-component="tool-part-wrapper"], [data-timeline-part-ids]');function Yt(e){document.querySelectorAll(_t).forEach(t=>{const n=Array.from(t.querySelectorAll(":scope > div > [data-timeline-key]"),i=>({wrapper:i,frame:i.querySelector(":scope > [data-index] > [data-timeline-row]"),top:parseFloat(i.style.top),height:parseFloat(i.style.height)})).sort((i,p)=>i.top-p.top),o=t.querySelector(':scope > [data-timeline-row="bottom-spacer"]'),r=i=>n[i+1]&&Math.abs(n[i+1].top-(n[i].top+n[i].height))<2?n[i+1]:void 0,a=i=>n[i-1]&&Math.abs(n[i].top-(n[i-1].top+n[i-1].height))<2?n[i-1]:void 0,s=i=>i===n.length-1&&!!o&&Math.abs(n[i].wrapper.getBoundingClientRect().bottom-o.getBoundingClientRect().top)<2,c=e?void 0:!0,h=i=>{const p=r(i);return p?p.frame?W(p)==="TurnGap"||W(p)==="UserMessage"||U(p)&&U(p)!==U(n[i])||W(p)==="TurnDiff"||W(p)==="TurnDivider"?!0:W(p)==="AssistantPart"||W(p)==="Thinking"?!1:c:c:n[i+1]||!s(i)?void 0:c};n.forEach((i,p)=>{if(!fe(i))return ge(i,!1);const f=h(p);if(f===void 0)return;if(!f){const m=r(p);fe(m)&&U(m)===U(i)||ge(i,!1);return}let u=p;for(;fe(a(u))&&U(a(u))===U(i);)u-=1;for(let m=u;m<=p;m+=1)ge(n[m],m===u&&n[m].frame.hasAttribute("data-timeline-spacing"))})})}const ee=new Map,ge=(e,t)=>{!e.frame||e.frame.hasAttribute(ne)===t||(G(e.frame,ne,t?"":void 0),ee.set(e.frame.parentElement,10))};function Xt(){ee.forEach((e,t)=>{if(!(t.isConnected&&Math.abs(t.offsetHeight-parseFloat(t.parentElement.style.height))>=1)||e===0)return ee.delete(t);ee.set(t,e-1),t.style.paddingBottom="1px",requestAnimationFrame(()=>t.style.removeProperty("padding-bottom"))})}const Qt=()=>ee.size>0;function Zt(){document.querySelectorAll(`[${ne}]`).forEach(e=>e.removeAttribute(ne)),document.documentElement.style.removeProperty(Se)}const en='[data-component="tooltip-v2-trigger"] > button:not([aria-haspopup]):has([data-component="progress-circle"])',A="data-plus-usage",We="plus-usage-card",$e="data-plus-usage-hover",tn=50,nn=100,on=4,rn=`
:root[${$e}] [data-component="tooltip-v2"]:not([data-force-open="true"]) {
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
`;function an(e){let t,n,o=0;const r=document.documentElement,a=(l,C)=>{clearTimeout(o),o=setTimeout(l,C)},s=l=>l.target instanceof Element?l.target.closest(en):null,c=l=>l instanceof Node&&!!(t?.contains(l)||n?.card.contains(l)),h=()=>{if(!t.isConnected)return;const l=document.createElement("div"),C=t.closest("[data-theme]")?.getAttribute("data-theme");l.id=We,l.setAttribute(A,""),l.setAttribute("role","tooltip"),C&&l.setAttribute("data-theme",C),n={card:l,stop:e(l)},document.body.append(l),dn(l,t),t.setAttribute("aria-describedby",We)},i=()=>{clearTimeout(o),n?.stop(),n?.card.remove(),n=void 0,t?.removeAttribute("aria-describedby")},p=l=>{if(l===t){n&&clearTimeout(o);return}f(),t=l,r.setAttribute($e,""),a(h,tn)},f=()=>{i(),t=void 0,r.removeAttribute($e)},u=l=>{if(l.pointerType==="touch")return;const C=s(l);if(C)return p(C);if(n?.card.contains(l.target))return clearTimeout(o);t&&!t.isConnected&&f()},m=l=>{!t||c(l.relatedTarget)||!c(l.target)||(n?a(f,nn):f())},E=l=>{t?.contains(l.target)&&i()},j=l=>{l.key==="Escape"&&i()},b=l=>{const C=s(l);C?.matches(":focus-visible")&&p(C)},y=l=>{t?.contains(l.target)&&!c(l.relatedTarget)&&f()};return document.addEventListener("pointerover",u),document.addEventListener("pointerout",m),document.addEventListener("pointerdown",E,!0),document.addEventListener("keydown",j),document.addEventListener("focusin",b),document.addEventListener("focusout",y),()=>{document.removeEventListener("pointerover",u),document.removeEventListener("pointerout",m),document.removeEventListener("pointerdown",E,!0),document.removeEventListener("keydown",j),document.removeEventListener("focusin",b),document.removeEventListener("focusout",y),f()}}function sn(e){const t=e.server.data,n=e.directory?{directory:e.directory}:void 0,o=t.session.get(e.id),r=t.session.message.list(e.id),a=ht.lastAssistantWithUsage(r,o?.revert?.messageID),s=a?.tokens,c=s?s.input+s.output+s.reasoning+s.cache.read+s.cache.write:0,h=a?ze(t,n,a.model)?.limit.context:void 0,i=t.session.cost(e.id),p=o?.model??r.findLast(m=>m.type==="assistant")?.model,f=p?ze(t,n,p):void 0,u=!!f&&f.cost.every(m=>!m.input&&!m.output&&!m.cache.read&&!m.cache.write);return{total:c,tokens:s,limit:h||void 0,percent:h?Math.round(c/h*100):void 0,cost:i>0||!u?i:void 0}}function cn({total:e,tokens:t,limit:n,percent:o,cost:r},a,s){const c=u=>new Intl.NumberFormat(s,{notation:"compact",maximumFractionDigits:0}).format(u).toLocaleLowerCase(s),h=t?ln.map(u=>({...u,value:u.value(t)})).filter(u=>u.value>0):[],i=Math.max(n??0,e),p=I("span",void 0,n?`${c(e)} / ${c(n)} `:c(e));n&&p.append(I("span","percent",`(${o}%)`));const f=[be([I("span",void 0,a("usage.window")),p])];if(i>0){const u=I("div","bar");u.setAttribute("aria-hidden","true"),h.forEach(m=>{const E=I("span");E.style.width=`${m.value/i*100}%`,E.style.background=m.color,u.append(E)}),f.push(u)}if(h.length){const u=I("div","legend");h.forEach(m=>{const E=I("span","dot");E.style.background=m.color,u.append(be([E,I("span",void 0,a(m.label)),I("span","value",m.value.toLocaleString(s))]))}),f.push(u)}if(r!==void 0){const u=new Intl.NumberFormat(s,{style:"currency",currency:"USD"});f.push(I("hr"),be([I("span",void 0,a("usage.cost")),I("span","value",u.format(r))]))}return f}const ln=[{label:"usage.cacheRead",color:"var(--v2-avatar-border-blue)",value:e=>e.cache.read},{label:"usage.cacheWrite",color:"var(--v2-avatar-border-purple)",value:e=>e.cache.write},{label:"usage.input",color:"var(--v2-avatar-border-pink)",value:e=>e.input},{label:"usage.reasoning",color:"var(--v2-avatar-border-yellow)",value:e=>e.reasoning},{label:"usage.output",color:"var(--v2-avatar-border-green)",value:e=>e.output}],ze=(e,t,n)=>{const o=e.location.provider.list(t),r=e.location.model.list(t);if(o?.some(a=>a.id===n.providerID))return r?.findLast(a=>a.providerID===n.providerID&&a.id===n.id&&a.status!=="deprecated")},I=(e,t,n)=>{const o=document.createElement(e);return t&&o.setAttribute("data-part",t),n!==void 0&&(o.textContent=n),o},be=e=>{const t=I("div","row");return t.append(...e),t},dn=(e,t)=>{const n=t.getBoundingClientRect(),o=e.offsetWidth,r=getComputedStyle(t).direction==="rtl"?n.left:n.right-o;e.style.top=`${n.bottom+on}px`,e.style.left=`${Math.max(8,Math.min(r,innerWidth-o-8))}px`},ke=60*1e3,un=60*ke,Ge="tab.new",ve="sidecar";function pn(e){const t=nt(e.options),{shelf:n,groups:o,working:r}=e.stores,a=(d,w)=>v=>ue.insert(v,()=>K.createComponent(e.ui.Icon,{name:d,...w})),s=()=>{const d=e.sessions.current();try{const w=d?.server.data.session;return!!d&&(w.status(d.id)==="running"||w.pending.list(d.id).some(v=>v.type!=="synthetic"))}catch{return!1}},c=()=>n.update(d=>{d.archivedOpen=!d.archivedOpen}),h=async d=>(await e.client.project.list()).filter(v=>(v.name||v.canonical.split("/").pop())===d).toSorted((v,$)=>$.time.active-v.time.active)[0],i=async d=>{const w=await h(d);if(!w)return e.layout.project(ve,e.t("session.new"));e.layout.draft({server:ve,directory:w.canonical,prompt:""})},p=d=>Dt({name:d,label:e.t("session.newIn",{project:d}),icon:a("plus",{size:"small"}),onSelect:()=>{i(d).catch(()=>e.toast.show({title:e.t("session.failed",{project:d})}))}}),f=async(d,w)=>{const v={directory:d};let{data:$}=await e.client.shell.create({location:v,command:w,timeout:ke});try{for(;$.status==="running";)await new Promise(H=>setTimeout(H,100)),$=(await e.client.shell.get({id:$.id,location:v})).data;const{data:N}=await e.client.shell.output({id:$.id,location:v});return{ok:$.exit===0,output:N.output}}finally{e.client.shell.remove({id:$.id,location:v}).catch(()=>{})}},u=async(d,w)=>{try{const v=await h(d),$=v&&await f(v.canonical,zt(w));return $?.ok?Gt($.output):void 0}finally{P()}},m=async d=>{const w=await Et(d,()=>e.client.project.list()),v=w&&await f(w,wt);return v?.ok?{directory:w,...At(v.output)}:void 0},E=async(d,w,v)=>{const $=N=>e.toast.show({variant:"error",title:v,description:N.trim()});try{const N=await f(d,xt(...w));if(!N.ok)return $(N.output);const H=e.servers.get(ve)?.data;H?.location.vcs.invalidate({directory:d}),await H?.location.vcs.sync({directory:d})}catch(N){$(String(N?.message??N))}},j=(d,w)=>K.createRoot(v=>{const[$,N]=K.createSignal(),[H,Ie]=K.createSignal(!1);let ce=!1;const le=()=>{ce||(ce=!0,m(w).catch(()=>{}).then(k=>N(k??null)).finally(()=>{ce=!1}))},Te=async(k,B)=>{Ie(!0),await E($().directory,k,B),Ie(!1),le()},it=k=>{k!==$().current&&Te([k],e.t("branch.failed",{branch:k}))},ct=async()=>{const k=$().current,V=(await e.dialogs.prompt({title:e.t("branch.create"),description:k&&e.t("branch.from",{branch:k}),placeholder:e.t("branch.name"),submit:e.t("branch.submit")}))?.trim().replace(/\s+/g,"-");V&&await Te(["-c",V],e.t("branch.uncreated",{branch:V}))},qe=(k,B=k)=>({label:B,onSelect:()=>it(k)}),lt=()=>{const k=$();if(k===void 0)return[{label:e.t("branch.loading"),disabled:!0}];if(k===null)return[{label:e.t("branch.unlisted"),disabled:!0}];const B=[{label:e.t("branch.new"),icon:"plus",onSelect:()=>{ct()}},{type:"separator"}],V=k.local.map(de=>qe(de));if(k.remote.length===0)return[...B,...V];const dt=k.remote.map(({name:de,ref:pt})=>qe(de,pt)),ut={type:"group",label:e.t("branch.remote"),items:dt};return[...B,...V,{type:"separator"},ut]};return d.addEventListener("pointerenter",le),d.addEventListener("focusin",le),ue.insert(d,()=>K.createComponent(e.ui.Menu,{label:e.t("branch.switch"),trigger:"button",placement:"bottom-start",get disabled(){return H()},get items(){return lt()}})),v}),b=()=>{Mt(n.value.archivedOpen),et(o.value.enabled,r.value.inline),Ot(p),Ft({lookup:u,open:d=>e.system.openExternal(d),label:({number:d,state:w,title:v})=>e.t("pr.label",{number:d,state:e.t(`pr.${w}`),title:v})}),$t(j),kt(),Ct(t.hideAgent),It(Ce),Jt(t.responseLabel),Xt(),Yt(s()),Qt()&&!l&&(l=setTimeout(()=>{l=0,P()},300))};let y=0,l=0,C=!1;const P=()=>{y||C||(y=requestAnimationFrame(()=>{y=0,b()}))},Le=new MutationObserver(P);Le.observe(document.body,{childList:!0,subtree:!0});const Ce=new MutationObserver(P),rt=setInterval(P,ke);document.addEventListener("scrollend",P,!0);const at=Rt(c),st=an(d=>K.createRoot(w=>(ue.insert(d,()=>{const v=e.sessions.current();return v?cn(sn(v),e.t,e.locale.locale()):[]}),w)));return x.createKeyed(()=>`${n.value.archivedOpen}:${o.value.enabled}:${r.value.inline}:${s()}`,b),e.add(x.Style,Nt),e.add(x.Style,Wt),e.add(x.Style,yt),e.add(x.Style,Lt(t)),e.add(x.Style,Kt(t.responseLabel)),e.add(x.Style,rn),e.add(x.Slot,{at:"session.location.menu",order:100,render:d=>qt({label:e.t("session.new"),icon:a("edit",{class:"shrink-0 text-v2-icon-icon-muted"}),shortcut:e.keybinds.keybind(Ge).join(""),onSelect:()=>{e.commands.run(Ge)||e.layout.draft({server:d.session.server.id,directory:d.session.directory,prompt:""})}})}),e.add(x.Command,()=>({id:"toggle-archived",title:e.t(n.value.archivedOpen?"archived.hide":"archived.show"),keywords:"archive archived settled sessions sidebar inbox",run:c})),e.add(x.Command,()=>({id:"toggle-groups",title:e.t(o.value.enabled?"groups.off":"groups.on"),keywords:"group project projects folders sessions sidebar inbox",run:()=>o.update(d=>{d.enabled=!d.enabled})})),e.add(x.Command,()=>({id:"toggle-working",title:e.t(r.value.inline?"working.section":"working.inline"),keywords:"working running busy section shelf sessions sidebar inbox",run:()=>r.update(d=>{d.inline=!d.inline})})),()=>{C=!0,Le.disconnect(),Ce.disconnect(),cancelAnimationFrame(y),clearTimeout(l),clearInterval(rt),document.removeEventListener("scrollend",P,!0),at(),st(),jt(),Vt(),St(),Tt(),Zt()}}function hn(e){const{archiveAfterHours:t}=nt(e.options);if(t>0)return ft(e,t*un)}const mn=x.Plugin.define({stores:{shelf:x.Store.global(_.Schema.Struct({archivedOpen:_.Schema.Boolean}),{archivedOpen:!1}),groups:x.Store.global(_.Schema.Struct({enabled:_.Schema.Boolean}),{enabled:!0}),working:x.Store.global(_.Schema.Struct({inline:_.Schema.Boolean}),{inline:!0})},i18n:{en:{"archived.show":"Show archived sessions","archived.hide":"Hide archived sessions","groups.on":"Group sessions by project","groups.off":"Stop grouping sessions by project","working.inline":"Show working sessions in the list","working.section":"Show working sessions in their own section","session.new":"New session","session.newIn":"New session in {{project}}","session.failed":"Could not start a session in {{project}}","usage.window":"Context window","usage.cacheRead":"Cache read","usage.cacheWrite":"Cache write","usage.input":"Input","usage.reasoning":"Reasoning","usage.output":"Output","usage.cost":"Cost","branch.switch":"Switch branch","branch.loading":"Loading…","branch.unlisted":"Could not list the branches","branch.remote":"Remote","branch.failed":"Could not switch to {{branch}}","branch.new":"New branch…","branch.create":"Create branch","branch.from":"The new branch starts from {{branch}}, with your changes.","branch.name":"Branch name","branch.submit":"Create","branch.uncreated":"Could not create {{branch}}","pr.label":"PR #{{number}}, {{state}}: {{title}}","pr.open":"open","pr.draft":"draft","pr.merged":"merged","pr.closed":"closed"}},setup:pn,main:hn});exports.default=mn;
