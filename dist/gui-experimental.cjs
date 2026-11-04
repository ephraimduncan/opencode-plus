"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const x=require("@opencode/plugin/gui"),xt=require("@opencode/plugin/gui/browser"),K=require("effect"),ye=require("electron"),W=require("solid-js"),de=require("solid-js/web"),Ct=require("@opencode/client/solid"),ue=60*1e3,we=200,Ue=["session.inbox.enqueued","session.execution.started","session.unarchived"],We=Symbol.for("opencode-plus.archive");function Lt(e,t,n,o){const{created:r,updated:s,busy:i,idle:a,archived:f}=e.time;if(f!==void 0||e.parentID||i!==void 0&&(a===void 0||i>a))return!1;const c=Math.max(r,i??0,a??0);return(Number(e.metadata?.[o])||0)>=c||t-s<2*ue?!1:t-c>=n}function Tt(e,t){const n=`${e.id}.keptAt`,o=Date.now(),r=new AbortController,s=r.signal,i=b=>e.log.write("error",`${e.id}: ${b?.stack??b}`),a=async()=>{const b=[];let d=await e.client.session.list({parentID:null,archived:!1,limit:we});for(;;){if(b.push(...d.data),d.data.length<we||!d.cursor.next)return b;d=await e.client.session.list({cursor:d.cursor.next,limit:we})}};let f=!1;const c=async()=>{if(!f){f=!0;try{const b=Date.now(),d=(await a()).filter(l=>Lt(l,b,t,n));for(const l of d)await e.client.session.update({sessionID:l.id,archived:!0}),e.log.write("info",`${e.id}: archived ${l.id} "${l.title??""}"`)}finally{f=!1}}},h=async b=>{if(!Ue.includes(b.type)||b.created<o-ue||b.type==="session.inbox.enqueued"&&b.data.item.type!=="user")return;const d=await e.client.session.get({sessionID:b.data.sessionID}),l=d.time.archived;if(b.type!=="session.unarchived"){if(l===void 0||b.created<=l)return;await e.client.session.update({sessionID:d.id,archived:!1}),e.log.write("info",`${e.id}: unarchived ${d.id} on ${b.type}`);return}l!==void 0||(Number(d.metadata?.[n])||0)>=b.created||await e.client.session.update({sessionID:d.id,metadata:{...d.metadata,[n]:b.created}})},g=async()=>{for(;!s.aborted;){try{const b=e.client.event.subscribe({types:Ue},{signal:s});for await(const d of b)h(d).catch(i)}catch(b){s.aborted||i(b)}s.aborted||await new Promise(b=>setTimeout(b,5e3))}},p=()=>{c().catch(i)},m=setTimeout(p,ue),k=setInterval(p,10*ue),D=()=>{s.aborted||(clearTimeout(m),clearInterval(k),r.abort())};return globalThis[We]?.(),globalThis[We]=D,e.signal.addEventListener("abort",D,{once:!0}),g(),D}const T=(e,t,n)=>{e.getAttribute(t)!==n&&e.setAttribute(t,n)},J=(e,t,n)=>n===void 0?e.removeAttribute(t):T(e,t,n),tt='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5L8 9.5L11.5 6.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',nt='[data-slot="new-session-composer"]',qt='[data-slot="new-session-location-path"]',It=["branch","new-branch"].map(e=>`${nt} use[href="#opencode-v2-icon-${e}"]`).join(", "),Y="data-plus-branch",ie="data-plus-branch-trigger",ne="data-plus-branch-menu",ot="data-plus-branch-current",Nt='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M3.53564 8.17857L6.39279 11.75L12.4642 4.25" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',Ot=`
[${Y}] {
  position: relative;
  border-radius: var(--radius-sm);
}
[${Y}]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline: -2px -4px;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(tt)}") center / 16px no-repeat;
}
[${Y}]:is(:hover, :has(:focus-visible), :has([data-expanded])) {
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${ie}] {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
[${ie}] > button {
  width: 100%;
  height: 100%;
  opacity: 0;
}
[${ne}] {
  width: max-content;
  max-width: min(320px, 100vw - 32px);
  max-height: min(320px, var(--kb-popper-content-available-height, 320px));
  overflow-y: auto;
}
[${ne}] [data-slot="menu-v2-item-content"] {
  flex: 0 1 auto;
  min-width: 0;
}
[${ne}] [data-component="menu-v2-item"]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
}
[${ne}] [${ot}]::after {
  background-color: var(--menu-v2-icon);
  mask: url("data:image/svg+xml,${encodeURIComponent(Nt)}") center / 14px no-repeat;
}
`,Mt="git branch --all --no-color --no-column --sort=-committerdate",Z=new Map;function Dt(e){Z.forEach((t,n)=>{n.isConnected||(t(),Z.delete(n))}),document.querySelectorAll(It).forEach(t=>{const n=t.closest("svg").parentElement;if(Z.has(n))return;const o=document.createElement("div");o.setAttribute(ie,""),n.setAttribute(Y,""),n.append(o),Z.set(n,e(o,n))})}function Rt(){document.querySelectorAll(`[${ie}] > [aria-controls]`).forEach(e=>{const t=document.getElementById(e.getAttribute("aria-controls"));if(!t)return;const n=e.closest(`[${Y}]`).querySelector(":scope > span").textContent.trim();T(t,ne,""),t.querySelectorAll('[data-component="menu-v2-item"]').forEach(o=>{const r=o.querySelector('[data-slot="menu-v2-item-content"] > span');J(o,ot,o.textContent.trim()===n?"":void 0),r&&J(o,"title",r.scrollWidth>r.clientWidth?r.textContent:void 0)})})}async function jt(e,t){const n=e.closest(nt)?.querySelector(qt)?.textContent??"";if(!n.includes("…"))return n||void 0;const[o,r]=n.split("…");return(await t()).flatMap(s=>[s.canonical,...s.sandboxes]).find(s=>s.startsWith(o)&&s.endsWith(r))}function Pt(e){const t=new Set,n=[],o=new Map;let r;for(const i of e.split(/\r?\n/)){const a=i.slice(2).trim();if(!(!a||a.startsWith("(")||a.includes(" -> "))){if(a.startsWith("remotes/")){const f=a.slice(8),c=f.slice(f.indexOf("/")+1);o.has(c)||o.set(c,f);continue}t.add(a),i.startsWith("*")&&(r=a),i.startsWith("+")||n.push(a)}}const s=Array.from(o,([i,a])=>({name:i,ref:a})).filter(({name:i})=>!t.has(i));return{current:r,local:n,remote:s}}const Bt=(...e)=>["git","switch",...e.map(rt)].join(" "),rt=e=>/^[\w./-]+$/.test(e)?e:`'${e.replaceAll("'","'\\''")}'`;function Ut(){Z.forEach(e=>e()),Z.clear(),document.querySelectorAll(`[${ie}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${Y}]`).forEach(e=>e.removeAttribute(Y))}const st='[data-slot="composer-controls"]',at=`${st} > div > [data-component="tooltip-v2-trigger"]`,it='[data-action="composer-model"]',ct=`${at}:has(~ [data-component="tooltip-v2-trigger"] ${it})`,lt=`${at}:has(${it}) ~ [data-component="tooltip-v2-trigger"]`,pe="data-plus-hidden-agent",fe="data-plus-variant-menu";function Wt({lowercaseVariants:e}){return`
${ct}[${pe}] {
  display: none;
}
${e?`${lt} .capitalize,
[${fe}] .capitalize {
  text-transform: lowercase;
}`:""}
`}function zt(e){document.querySelectorAll(ct).forEach(t=>{const n=e!==!1&&t.textContent.trim().toLowerCase()===e.toLowerCase();J(t,pe,n?"":void 0)}),document.querySelectorAll(`${lt} [aria-controls]`).forEach(t=>{const n=document.getElementById(t.getAttribute("aria-controls"));n&&T(n,fe,"")})}const ze=new WeakSet;function Ft(e){document.querySelectorAll(st).forEach(t=>{ze.has(t)||(ze.add(t),e.observe(t,{subtree:!0,characterData:!0}))})}function Gt(){document.querySelectorAll(`[${pe}]`).forEach(e=>e.removeAttribute(pe)),document.querySelectorAll(`[${fe}]`).forEach(e=>e.removeAttribute(fe))}const Ht="browser.cookies",Fe=1e3,Ge=Symbol.for("opencode-plus.cookies");function Kt(e,{app:t,safeStorage:n,webContents:o}){globalThis[Ge]?.();const r=d=>e.log.write("warn",`${e.id}: ${d?.stack??d}`),s=n.isEncryptionAvailable()?e.storage.store(Ht,{schema:K.Schema.String,initial:""}):void 0,i=()=>{if(!s?.value)return[];try{const d=Date.now()/Fe;return JSON.parse(n.decryptString(Buffer.from(s.value,"base64"))).filter($=>$.expirationDate===void 0||$.expirationDate>d)}catch(d){return r(d),[]}},a=new Map(i().map(d=>[$e(d),d]));let f;const c=()=>{clearTimeout(f),f=void 0,s.set(n.encryptString(JSON.stringify([...a.values()])).toString("base64"))},h=()=>{s&&(f??=setTimeout(c,Fe))},g=new Map,p=(d,l,$)=>{const q=$e(l),S=d.sent.get(q)??[];S.push($),d.sent.set(q,S),d.session.cookies.set($?He(l):{...He(l),expirationDate:1}).catch(I=>{const F=S.indexOf($);F>=0&&S.splice(F,1),r(I)})},m=(d,l,$,q)=>{if(q&&$==="overwrite")return;const S=$e(l),U=q?"":JSON.stringify(l),I=d.sent.get(S)??[],F=I.indexOf(U);if(F>=0){I.splice(0,F+1),I.length===0&&d.sent.delete(S);return}if(U!==(a.has(S)?JSON.stringify(a.get(S)):"")){q?a.delete(S):a.set(S,l);for(const te of g.values())te!==d&&p(te,l,U);h()}},k=d=>{if(d.isPersistent()||g.has(d))return;const l={session:d,sent:new Map,listener:($,q,S,U)=>m(l,Vt(q),S,U)};g.set(d,l),d.cookies.on("changed",l.listener);for(const $ of a.values())p(l,$,JSON.stringify($))};t.on("session-created",k);const D=(d,l)=>k(l.session);t.on("web-contents-created",D);for(const d of o.getAllWebContents())k(d.session);const b=()=>{t.off("session-created",k),t.off("web-contents-created",D);for(const d of g.values())d.session.cookies.off("changed",d.listener);g.clear(),f&&c()};return globalThis[Ge]=b,b}function Vt({name:e,value:t,domain:n,path:o,secure:r,httpOnly:s,sameSite:i,expirationDate:a}){return{name:e,value:t,domain:n,path:o,secure:r,httpOnly:s,sameSite:i,...a!==void 0&&{expirationDate:a}}}function $e({domain:e,path:t,name:n}){return[e,t,n].join("	")}function He({domain:e,...t}){const n=e.replace(/^\./,"");return{...t,url:`${t.secure?"https":"http"}://${n}${t.path}`,...e!==n&&{domain:e}}}function _t(e){const t=n=>{if(n.defaultPrevented||n.metaKey||n.ctrlKey||n.shiftKey||n.altKey)return;const o=n.target instanceof Element?n.target.closest("a[href]"):null;!(o instanceof HTMLAnchorElement)||!/^https?:$/.test(o.protocol)||o.closest('[role="dialog"]')||e(o.href)&&n.preventDefault()};return document.addEventListener("click",t),()=>document.removeEventListener("click",t)}function Jt({label:e,icon:t,shortcut:n,onSelect:o}){const r=document.createElement("hr");r.setAttribute("data-slot","menu-v2-separator");const s=document.createElement("div");s.setAttribute("role","menuitem"),s.setAttribute("data-component","menu-v2-item");const i=document.createElement("span");if(i.setAttribute("data-slot","menu-v2-item-content"),t(i),i.append(e),s.append(i),n){const a=document.createElement("span");a.setAttribute("data-slot","menu-v2-item-shortcut"),a.textContent=n,s.append(a)}return s.addEventListener("pointerenter",()=>s.setAttribute("data-highlighted","")),s.addEventListener("pointerleave",()=>s.removeAttribute("data-highlighted")),s.addEventListener("click",()=>{s.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:!0})),o()}),queueMicrotask(()=>{const a=s.closest('[role="menu"]')?.querySelector("[data-appearance]")?.getAttribute("data-appearance");a&&(s.setAttribute("data-appearance",a),r.setAttribute("data-appearance",a))}),[r,s]}const L='[data-slot="sidebar-inbox"]',Ne='[data-slot="sidebar-inbox-scroll"]',re='[data-slot="sidebar-inbox-working"]',Oe=`${Ne} > div.pt-3`,y='[data-slot="sidebar-inbox-item"]',O="data-plus-shelf",P="data-plus-toggle",Me="data-plus-count",M="data-plus-group",he="data-plus-gap",j="data-plus-member",_="data-plus-inline",z="data-plus-add",ke=`${L} ${y}[data-status="ready"]:not([data-state="active"], :hover:not(:has([${z}]:hover)), :focus-visible, [${O}] > *)`,Yt=`
${Oe} {
  order: 100000;
  margin-top: auto;
}
${L}[${_}] {
  overflow-y: auto;
  gap: 1px;
  padding-bottom: 4px;
}
[${_}] > ${Ne},
[${_}] > ${re},
[${_}] > ${re} > div {
  display: contents;
}
[${_}] > ${re} > button {
  display: none;
}
[${O}] > [${P}] {
  border-radius: 6px;
}
[${O}] > [${P}]:hover {
  color: var(--color-v2-text-text-base);
}
[${O}] > [${P}]:focus-visible {
  outline: none;
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${O}] > [${P}]::before {
  content: attr(${Me});
  order: 1;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-faint);
}
[${O}] > [${P}]::after {
  content: "";
  order: 2;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(tt)}") center / 16px no-repeat;
}
[${O}="closed"] > [${P}]::after {
  rotate: -90deg;
}
[${O}="closed"] > [${P}]:dir(rtl)::after {
  rotate: 90deg;
}
[${O}="closed"] > ${y}:not([data-state="active"]) {
  display: none;
}
${L} ${y}[data-status="working"] {
  opacity: 1;
}
${L} ${y}[data-status="working"] > span:nth-of-type(2) {
  color: var(--color-v2-text-text-base);
}
/* T3 Code's Working colors: sky-600 text and a sky-500 pulsing dot, or sky-300 at 80% in dark mode. */
${L} {
  --plus-working: oklch(58.8% 0.158 241.966);
  --plus-working-dot: oklch(68.5% 0.169 237.323);
  --plus-working-peak: oklch(74.6% 0.16 232.661);
}
[data-color-scheme="dark"] ${L} {
  --plus-working: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-dot: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-peak: oklch(95.1% 0.026 236.824);
}
${L} ${y}[data-status="working"] > span:first-child > span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--plus-working);
}
${L} ${y}[data-status="working"] > span:first-child > span:last-child > span {
  color: inherit;
}
${L} ${y}[data-status="working"] [data-component="text-shimmer"] {
  --text-shimmer-base-color: var(--plus-working);
  --text-shimmer-peak-color: var(--plus-working-peak);
}
${L} ${y}[data-status="working"] > span:first-child > span:last-child::before {
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
  ${L} ${y}[data-status="working"] > span:first-child > span:last-child::before {
    animation: none;
  }
}
${L} ${y} > span,
${L} ${y} > span:first-child > span {
  transition: opacity 150ms;
}
${ke}:not([${j}]) > span,
${ke}[${j}] > span:not(:first-child),
${ke}[${j}] > span:first-child > span:last-child {
  opacity: 0.6;
}
/* In a project group the heading names the project, so rows drop their project line and show the time beside the
   title: the first line dissolves into the row's grid, keeping only its last part, the time or status. */
${y}[${j}] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "title status";
  column-gap: 8px;
}
${y}[${j}] > span:first-child {
  display: contents;
}
${y}[${j}] > span:first-child > span:not(:last-child) {
  display: none;
}
${y}[${j}] > span:first-child > span:last-child {
  grid-area: status;
}
${y}[${j}] > span:nth-of-type(2) {
  grid-area: title;
}
${y}[${j}] > span:nth-of-type(3) {
  grid-column: 1 / -1;
}
/* The same space before every project; a group's heading takes its own 28px on top of it. */
${y}[${he}] {
  margin-top: 16px;
}
${y}[${M}] {
  position: relative;
  margin-top: 28px;
}
${y}[${M}][${he}] {
  margin-top: 44px;
}
${y}[${M}]::before {
  content: attr(${M});
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
${y}[${M}] > span:first-child > span:first-child {
  display: flex;
  position: absolute;
  inset-inline-start: 6px;
  bottom: calc(100% + 8px);
  pointer-events: none;
}
/* The heading's + button, at the far end of its 24px line, its icon in line with the times of the rows below. */
${y}[${M}] > [${z}] {
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
${y}[${M}] > [${z}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
${y}[${M}]:not([data-state="active"]):has(> [${z}]:hover) {
  background-color: transparent;
}
`,oe=e=>e?Array.from(e.children).filter(t=>t.matches(y)):[],Le=e=>e.querySelector(":scope > span:first-child > span.truncate")?.textContent?.trim(),dt=e=>{e.style.removeProperty("order"),e.style.length===0&&e.removeAttribute("style"),e.removeAttribute(M),e.removeAttribute(he),e.removeAttribute(j)};function Xt(e){const t=e?"open":"closed";document.querySelectorAll(Oe).forEach(n=>{const o=n.firstElementChild;!o||o.matches(y)||(T(n,O,t),T(o,P,""),T(o,Me,String(oe(n).length)),T(o,"role","button"),T(o,"tabindex","0"),T(o,"aria-expanded",String(e)))})}function Qt(e){const t=r=>r.target instanceof Element?r.target.closest(`${Oe} > [${P}]`):null,n=r=>{t(r)&&e()},o=r=>{r.key!=="Enter"&&r.key!==" "||!t(r)||(r.preventDefault(),e())};return document.addEventListener("click",n),document.addEventListener("keydown",o),()=>{document.removeEventListener("click",n),document.removeEventListener("keydown",o)}}const Ke=(e,t,n=[])=>{const o=[...n,...e];if(!t&&n.length===0)return o.forEach(dt);const r=new Map;o.forEach(i=>{const a=t&&Le(i)||i;r.set(a,[...r.get(a)??[],i])});let s=0;Array.from(r).forEach(([i,a],f)=>{const c=t&&typeof i=="string"&&a.length>1;a.forEach((h,g)=>{s+=1,h.style.order!==String(s)&&(h.style.order=String(s)),J(h,M,c&&g===0?i:void 0),J(h,j,c?"":void 0),J(h,he,t&&f>0&&g===0?"":void 0)})})};function ut(e,t){document.querySelectorAll(L).forEach(n=>{const o=n.querySelector(`:scope > ${Ne}`),r=n.querySelector(`:scope > ${re} > div`),s=new Set;t?(T(n,_,""),n.querySelector(`:scope > ${re} > button[aria-expanded="false"]`)?.click(),Ke(oe(o),e,oe(r)),s.add(o).add(r)):n.removeAttribute(_),new Set(Array.from(n.querySelectorAll(y),i=>i.parentElement)).forEach(i=>{if(s.has(i))return;const a=i.getAttribute(O)==="closed",f=oe(i).filter(c=>!a||c.getAttribute("data-state")==="active");oe(i).filter(c=>!f.includes(c)).forEach(dt),Ke(f,e)})})}function Zt(e){document.querySelectorAll(`${y} > [${z}]`).forEach(t=>{t.parentElement.getAttribute(M)!==t.getAttribute(z)&&t.remove()}),document.querySelectorAll(`${y}[${M}]`).forEach(t=>{t.querySelector(`:scope > [${z}]`)||t.append(e(t.getAttribute(M)))})}function en({name:e,label:t,icon:n,onSelect:o}){const r=document.createElement("div");return r.setAttribute(z,e),r.setAttribute("role","button"),r.setAttribute("aria-label",t),r.setAttribute("title",t),n(r),pt(r,o),r}function pt(e,t){const n=o=>{o.preventDefault(),o.stopPropagation(),t()};e.setAttribute("tabindex","0"),e.addEventListener("pointerdown",o=>o.stopPropagation()),e.addEventListener("click",n),e.addEventListener("keydown",o=>{(o.key==="Enter"||o.key===" ")&&n(o)})}function tn(){ut(!1,!1),document.querySelectorAll(`[${z}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${O}]`).forEach(e=>e.removeAttribute(O)),document.querySelectorAll(`[${P}]`).forEach(e=>{[P,Me,"role","tabindex","aria-expanded"].forEach(t=>e.removeAttribute(t))})}const nn=`${y} > span:nth-of-type(3)`,on=':scope > span > span[dir="ltr"]',B="data-plus-pr",Ve="data-plus-pr-url",rn=120*1e3,le=e=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${e}</svg>`,_e={open:le('<circle cx="5" cy="6" r="3"/><path d="M5 9v12"/><circle cx="19" cy="18" r="3"/><path d="m15 9-3-3 3-3"/><path d="M12 6h5a2 2 0 0 1 2 2v7"/>'),draft:le('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 6V5"/><path d="M18 11v-1"/><path d="M6 9v12"/>'),merged:le('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>'),closed:le('<circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="m21 3-6 6"/><path d="m21 9-6-6"/><path d="M18 11.5V15"/><circle cx="18" cy="18" r="3"/>')},Je={open:["oklch(59.6% 0.145 163.225)","oklch(84.5% 0.143 164.978 / 0.9)"],draft:["oklch(55.2% 0.016 285.938)","oklch(70.5% 0.015 286.067 / 0.8)"],merged:["oklch(54.1% 0.281 293.009)","oklch(81.1% 0.111 293.571 / 0.9)"],closed:["oklch(57.7% 0.245 27.325)","oklch(80.8% 0.114 19.571 / 0.9)"]},sn=`
[${B}] {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  margin-inline-start: auto;
  padding-inline: 2px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}
[${B}] ~ .ms-auto {
  margin-inline-start: 0;
}
[${B}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${B}]::before {
  content: "";
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  background-color: var(--plus-pr);
}
${Object.keys(_e).map(e=>`[${B}="${e}"] {
  --plus-pr: ${Je[e][0]};
}
[data-color-scheme="dark"] [${B}="${e}"] {
  --plus-pr: ${Je[e][1]};
}
[${B}="${e}"]::before {
  mask: url("data:image/svg+xml,${encodeURIComponent(_e[e])}") center / 12px no-repeat;
}`).join(`
`)}
`,an=e=>`git remote get-url origin && GH_NO_UPDATE_NOTIFIER=1 gh pr list --state all --limit 20 --json number,title,url,state,isDraft,updatedAt,headRepositoryOwner --head ${rt(e)} 2>/dev/null`;function cn(e){const[t,...n]=e.trim().split(/\r?\n/),o=t.match(/[:/]([^/:]+)\/[^/]+$/)?.[1].toLowerCase(),r=JSON.parse(n.join(`
`)).filter(a=>a.headRepositoryOwner?.login.toLowerCase()===o).toSorted((a,f)=>Date.parse(f.updatedAt)-Date.parse(a.updatedAt)),s=r.find(a=>a.state==="OPEN")??r[0];if(!s)return;const i=s.state==="OPEN"&&s.isDraft?"draft":s.state.toLowerCase();return{number:s.number,title:s.title,url:s.url,state:i}}const ee=new Map;let Te=new Set,Ye=Promise.resolve();function ln({lookup:e,open:t,label:n}){const o=Date.now(),r=Array.from(document.querySelectorAll(nn),i=>{const a=i.querySelector(on),f=a?.textContent.trim(),c=i.parentElement;return{line:i,row:c,branch:f,key:f&&`${Le(c)}
${f}`,holder:a?.parentElement}}),s=new Set(r.filter(({row:i,key:a})=>a&&i.getAttribute("data-status")==="working").map(({key:i})=>i));Te.forEach(i=>{const a=ee.get(i);!s.has(i)&&a?.time!==void 0&&(a.time=0)}),Te=s,r.forEach(({line:i,row:a,branch:f,key:c,holder:h})=>{const g=c&&ee.get(c);let p=i.querySelector(`:scope > [${B}]`);c&&(!g||g.time!==void 0&&o-g.time>=rn)&&dn(c,()=>e(Le(a),f));const m=g?.pull;if(!m)return p?.remove();p||(p=document.createElement("span"),p.setAttribute("role","link"),pt(p,()=>t(p.getAttribute(Ve))));const k=n(m);p.previousElementSibling!==h&&h.after(p),T(p,B,m.state),T(p,Ve,m.url),T(p,"title",k),T(p,"aria-label",k),p.textContent!==`#${m.number}`&&(p.textContent=`#${m.number}`)})}const dn=(e,t)=>{const n=Ye.then(t).catch(()=>{});ee.set(e,{pull:ee.get(e)?.pull}),Ye=n,n.then(o=>ee.set(e,{time:Date.now(),pull:o}))};function un(){ee.clear(),Te=new Set,document.querySelectorAll(`[${B}]`).forEach(e=>e.remove())}function ft(e={}){const t=e.archiveAfterHours;return{archiveAfterHours:typeof t=="number"&&t>=0?t:12,hideAgent:typeof e.hideAgent=="string"||e.hideAgent===!1?e.hideAgent:"build",responseLabel:typeof e.responseLabel=="string"?e.responseLabel:e.responseLabel===!1?"":"Response",lowercaseVariants:e.lowercaseVariants!==!1}}const pn="[data-timeline-virtual-content]",ht='[data-slot="session-turn-message-container"]',ce="data-plus-final",Ee=`[${ce}] > [data-component="session-turn"] > ${ht}`,De="--plus-label-half";function fn(e){return`
${Ee} {
  --plus-gap: calc(var(${De}, ${e.length*3.75}px) + 12px);
  position: relative;
}
${Ee}::before {
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
${Ee}::after {
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
`}let Xe=!1;function hn(e){const t=document.querySelector(ht);if(Xe||!e||!t||document.fonts?.status==="loading")return;const n=document.createElement("span");n.textContent=e,n.style.cssText="position: absolute; visibility: hidden; white-space: nowrap; font-size: 13px; font-weight: 440; letter-spacing: -0.04px",t.append(n);const o=n.getBoundingClientRect().width;n.remove(),o&&(document.documentElement.style.setProperty(De,`${o/2}px`),Xe=!0)}const V=e=>e?.frame?.getAttribute("data-timeline-row"),H=e=>e?.frame?.getAttribute("data-message-id"),Ae=e=>V(e)==="AssistantPart"&&!!e.frame.querySelector('[data-component="text-part"]')&&!e.frame.querySelector('[data-component="tool-part-wrapper"], [data-timeline-part-ids]');function mn(e){document.querySelectorAll(pn).forEach(t=>{const n=Array.from(t.querySelectorAll(":scope > div > [data-timeline-key]"),c=>({wrapper:c,frame:c.querySelector(":scope > [data-index] > [data-timeline-row]"),top:parseFloat(c.style.top),height:parseFloat(c.style.height)})).sort((c,h)=>c.top-h.top),o=t.querySelector(':scope > [data-timeline-row="bottom-spacer"]'),r=c=>n[c+1]&&Math.abs(n[c+1].top-(n[c].top+n[c].height))<2?n[c+1]:void 0,s=c=>n[c-1]&&Math.abs(n[c].top-(n[c-1].top+n[c-1].height))<2?n[c-1]:void 0,i=c=>c===n.length-1&&!!o&&Math.abs(n[c].wrapper.getBoundingClientRect().bottom-o.getBoundingClientRect().top)<2,a=e?void 0:!0,f=c=>{const h=r(c);return h?h.frame?V(h)==="TurnGap"||V(h)==="UserMessage"||H(h)&&H(h)!==H(n[c])||V(h)==="TurnDiff"||V(h)==="TurnDivider"?!0:V(h)==="AssistantPart"||V(h)==="Thinking"?!1:a:a:n[c+1]||!i(c)?void 0:a};n.forEach((c,h)=>{if(!Ae(c))return Se(c,!1);const g=f(h);if(g===void 0)return;if(!g){const m=r(h);Ae(m)&&H(m)===H(c)||Se(c,!1);return}let p=h;for(;Ae(s(p))&&H(s(p))===H(c);)p-=1;for(let m=p;m<=h;m+=1)Se(n[m],m===p&&n[m].frame.hasAttribute("data-timeline-spacing"))})})}const se=new Map,Se=(e,t)=>{!e.frame||e.frame.hasAttribute(ce)===t||(J(e.frame,ce,t?"":void 0),se.set(e.frame.parentElement,10))};function gn(){se.forEach((e,t)=>{if(!(t.isConnected&&Math.abs(t.offsetHeight-parseFloat(t.parentElement.style.height))>=1)||e===0)return se.delete(t);se.set(t,e-1),t.style.paddingBottom="1px",requestAnimationFrame(()=>t.style.removeProperty("padding-bottom"))})}const bn=()=>se.size>0;function vn(){document.querySelectorAll(`[${ce}]`).forEach(e=>e.removeAttribute(ce)),document.documentElement.style.removeProperty(De)}const yn='[data-component="tooltip-v2-trigger"] > button:not([aria-haspopup]):has([data-component="progress-circle"])',C="data-plus-usage",Qe="plus-usage-card",qe="data-plus-usage-hover",wn=50,$n=100,kn=4,En=`
:root[${qe}] [data-component="tooltip-v2"]:not([data-force-open="true"]) {
  display: none;
}
[${C}] {
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
[${C}]:dir(rtl) {
  transform-origin: top left;
}
[${C}] [data-part="row"] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
  white-space: nowrap;
}
[${C}] [data-part="row"] > :last-child {
  margin-inline-start: auto;
}
[${C}] :is([data-part="value"], [data-part="percent"]) {
  color: var(--v2-text-text-base);
}
[${C}] [data-part="percent"] {
  font-weight: 530;
}
[${C}] [data-part="bar"] {
  display: flex;
  height: 8px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--v2-background-bg-layer-03);
}
[${C}] [data-part="bar"] > span {
  box-sizing: border-box;
  min-width: 3px;
}
/* A line in the card's color between kinds, as in Cursor's bar. */
[${C}] [data-part="bar"] > span + span {
  border-inline-start: 1px solid var(--v2-background-bg-layer-01);
}
[${C}] [data-part="legend"] {
  display: flex;
  flex-direction: column;
}
[${C}] [data-part="dot"] {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
[${C}] hr {
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
  [${C}] {
    animation: none;
  }
}
:root[data-motion="reduce"] [${C}] {
  animation: none;
}
`;function An(e){let t,n,o=0;const r=document.documentElement,s=(l,$)=>{clearTimeout(o),o=setTimeout(l,$)},i=l=>l.target instanceof Element?l.target.closest(yn):null,a=l=>l instanceof Node&&!!(t?.contains(l)||n?.card.contains(l)),f=()=>{if(!t.isConnected)return;const l=document.createElement("div"),$=t.closest("[data-theme]")?.getAttribute("data-theme");l.id=Qe,l.setAttribute(C,""),l.setAttribute("role","tooltip"),$&&l.setAttribute("data-theme",$),n={card:l,stop:e(l)},document.body.append(l),Ln(l,t),t.setAttribute("aria-describedby",Qe)},c=()=>{clearTimeout(o),n?.stop(),n?.card.remove(),n=void 0,t?.removeAttribute("aria-describedby")},h=l=>{if(l===t){n&&clearTimeout(o);return}g(),t=l,r.setAttribute(qe,""),s(f,wn)},g=()=>{c(),t=void 0,r.removeAttribute(qe)},p=l=>{if(l.pointerType==="touch")return;const $=i(l);if($)return h($);if(n?.card.contains(l.target))return clearTimeout(o);t&&!t.isConnected&&g()},m=l=>{!t||a(l.relatedTarget)||!a(l.target)||(n?s(g,$n):g())},k=l=>{t?.contains(l.target)&&c()},D=l=>{l.key==="Escape"&&c()},b=l=>{const $=i(l);$?.matches(":focus-visible")&&h($)},d=l=>{t?.contains(l.target)&&!a(l.relatedTarget)&&g()};return document.addEventListener("pointerover",p),document.addEventListener("pointerout",m),document.addEventListener("pointerdown",k,!0),document.addEventListener("keydown",D),document.addEventListener("focusin",b),document.addEventListener("focusout",d),()=>{document.removeEventListener("pointerover",p),document.removeEventListener("pointerout",m),document.removeEventListener("pointerdown",k,!0),document.removeEventListener("keydown",D),document.removeEventListener("focusin",b),document.removeEventListener("focusout",d),g()}}function Sn(e){const t=e.server.data,n=e.directory?{directory:e.directory}:void 0,o=t.session.get(e.id),r=t.session.message.list(e.id),s=Ct.lastAssistantWithUsage(r,o?.revert?.messageID),i=s?.tokens,a=i?i.input+i.output+i.reasoning+i.cache.read+i.cache.write:0,f=s?Ze(t,n,s.model)?.limit.context:void 0,c=t.session.cost(e.id),h=o?.model??r.findLast(m=>m.type==="assistant")?.model,g=h?Ze(t,n,h):void 0,p=!!g&&g.cost.every(m=>!m.input&&!m.output&&!m.cache.read&&!m.cache.write);return{total:a,tokens:i,limit:f||void 0,percent:f?Math.round(a/f*100):void 0,cost:c>0||!p?c:void 0}}function xn({total:e,tokens:t,limit:n,percent:o,cost:r},s,i){const a=p=>new Intl.NumberFormat(i,{notation:"compact",maximumFractionDigits:0}).format(p).toLocaleLowerCase(i),f=t?Cn.map(p=>({...p,value:p.value(t)})).filter(p=>p.value>0):[],c=Math.max(n??0,e),h=N("span",void 0,n?`${a(e)} / ${a(n)} `:a(e));n&&h.append(N("span","percent",`(${o}%)`));const g=[xe([N("span",void 0,s("usage.window")),h])];if(c>0){const p=N("div","bar");p.setAttribute("aria-hidden","true"),f.forEach(m=>{const k=N("span");k.style.width=`${m.value/c*100}%`,k.style.background=m.color,p.append(k)}),g.push(p)}if(f.length){const p=N("div","legend");f.forEach(m=>{const k=N("span","dot");k.style.background=m.color,p.append(xe([k,N("span",void 0,s(m.label)),N("span","value",m.value.toLocaleString(i))]))}),g.push(p)}if(r!==void 0){const p=new Intl.NumberFormat(i,{style:"currency",currency:"USD"});g.push(N("hr"),xe([N("span",void 0,s("usage.cost")),N("span","value",p.format(r))]))}return g}const Cn=[{label:"usage.cacheRead",color:"var(--v2-avatar-border-blue)",value:e=>e.cache.read},{label:"usage.cacheWrite",color:"var(--v2-avatar-border-purple)",value:e=>e.cache.write},{label:"usage.input",color:"var(--v2-avatar-border-pink)",value:e=>e.input},{label:"usage.reasoning",color:"var(--v2-avatar-border-yellow)",value:e=>e.reasoning},{label:"usage.output",color:"var(--v2-avatar-border-green)",value:e=>e.output}],Ze=(e,t,n)=>{const o=e.location.provider.list(t),r=e.location.model.list(t);if(o?.some(s=>s.id===n.providerID))return r?.findLast(s=>s.providerID===n.providerID&&s.id===n.id&&s.status!=="deprecated")},N=(e,t,n)=>{const o=document.createElement(e);return t&&o.setAttribute("data-part",t),n!==void 0&&(o.textContent=n),o},xe=e=>{const t=N("div","row");return t.append(...e),t},Ln=(e,t)=>{const n=t.getBoundingClientRect(),o=e.offsetWidth,r=getComputedStyle(t).direction==="rtl"?n.left:n.right-o;e.style.top=`${n.bottom+kn}px`,e.style.left=`${Math.max(8,Math.min(r,innerWidth-o-8))}px`},Re='[data-component="user-message"]',Tn=`${Re} [data-slot="user-message-actions"]`,mt='[data-slot="user-message-text"]',qn='[data-component="tooltip-v2-trigger"]',me="data-plus-copy",In=`
[${me}] {
  display: contents;
}
[${me}] [data-slot="icon-svg"] {
  width: 14px;
  height: 14px;
}
`,ae=new Map;function Nn(e){ae.forEach((t,n)=>{n.isConnected||(t(),n.remove(),ae.delete(n))}),document.querySelectorAll(Tn).forEach(t=>{const n=t.querySelector(`:scope > ${qn}`);if(!n||t.querySelector(`:scope > [${me}]`)||!t.closest(Re).querySelector(mt))return;const o=document.createElement("span");o.setAttribute(me,""),o.addEventListener("mousedown",r=>r.preventDefault()),ae.set(o,e(o)),t.insertBefore(o,n)})}const On=({ui:e,label:t,copied:n,write:o})=>r=>de.render(()=>{const[s,i]=W.createSignal(!1),a=()=>s()?n:t,f=async c=>{c.stopPropagation(),await o(Mn(r.closest(Re)))&&(i(!0),setTimeout(()=>i(!1),2e3))};return W.createComponent(e.Tooltip,{get value(){return a()},get children(){return W.createComponent(e.IconButton,{get icon(){return s()?"check":"outline-copy"},get label(){return a()},size:"small",onClick:f})}})},r),Mn=e=>{const t=e.querySelector(mt).cloneNode(!0);return t.querySelectorAll('[data-slot="user-message-comments"], [data-slot="user-message-fold-toggle"]').forEach(n=>n.remove()),t.querySelectorAll("[data-session-reference]").forEach(n=>n.replaceWith(n.dataset.sessionReference)),t.textContent};function Dn(){ae.forEach((e,t)=>{e(),t.remove()}),ae.clear()}const Ie=60*1e3,Rn=60*Ie,et="tab.new",Ce="sidecar";function jn(e){const t=ft(e.options),{shelf:n,groups:o,working:r}=e.stores,s=(u,w)=>v=>de.insert(v,()=>W.createComponent(e.ui.Icon,{name:u,...w})),i=()=>{const u=e.sessions.current();try{const w=u?.server.data.session;return!!u&&(w.status(u.id)==="running"||w.pending.list(u.id).some(v=>v.type!=="synthetic"))}catch{return!1}},a=()=>n.update(u=>{u.archivedOpen=!u.archivedOpen}),f=async u=>(await e.client.project.list()).filter(v=>(v.name||v.canonical.split("/").pop())===u).toSorted((v,E)=>E.time.active-v.time.active)[0],c=async u=>{const w=await f(u);if(!w)return e.layout.project(Ce,e.t("session.new"));e.layout.draft({server:Ce,directory:w.canonical,prompt:""})},h=u=>en({name:u,label:e.t("session.newIn",{project:u}),icon:s("plus",{size:"small"}),onSelect:()=>{c(u).catch(()=>e.toast.show({title:e.t("session.failed",{project:u})}))}}),g=async(u,w)=>{const v={directory:u};let{data:E}=await e.client.shell.create({location:v,command:w,timeout:Ie});try{for(;E.status==="running";)await new Promise(X=>setTimeout(X,100)),E=(await e.client.shell.get({id:E.id,location:v})).data;const{data:R}=await e.client.shell.output({id:E.id,location:v});return{ok:E.exit===0,output:R.output}}finally{e.client.shell.remove({id:E.id,location:v}).catch(()=>{})}},p=async(u,w)=>{try{const v=await f(u),E=v&&await g(v.canonical,an(w));return E?.ok?cn(E.output):void 0}finally{I()}},m=async u=>{const w=await jt(u,()=>e.client.project.list()),v=w&&await g(w,Mt);return v?.ok?{directory:w,...Pt(v.output)}:void 0},k=async(u,w,v)=>{const E=R=>e.toast.show({variant:"error",title:v,description:R.trim()});try{const R=await g(u,Bt(...w));if(!R.ok)return E(R.output);const X=e.servers.get(Ce)?.data;X?.location.vcs.invalidate({directory:u}),await X?.location.vcs.sync({directory:u})}catch(R){E(String(R?.message??R))}},D=(u,w)=>W.createRoot(v=>{const[E,R]=W.createSignal(),[X,je]=W.createSignal(!1);let ge=!1;const be=()=>{ge||(ge=!0,m(w).catch(()=>{}).then(A=>R(A??null)).finally(()=>{ge=!1}))},Pe=async(A,G)=>{je(!0),await k(E().directory,A,G),je(!1),be()},wt=A=>{A!==E().current&&Pe([A],e.t("branch.failed",{branch:A}))},$t=async()=>{const A=E().current,Q=(await e.dialogs.prompt({title:e.t("branch.create"),description:A&&e.t("branch.from",{branch:A}),placeholder:e.t("branch.name"),submit:e.t("branch.submit")}))?.trim().replace(/\s+/g,"-");Q&&await Pe(["-c",Q],e.t("branch.uncreated",{branch:Q}))},Be=(A,G=A)=>({label:G,onSelect:()=>wt(A)}),kt=()=>{const A=E();if(A===void 0)return[{label:e.t("branch.loading"),disabled:!0}];if(A===null)return[{label:e.t("branch.unlisted"),disabled:!0}];const G=[{label:e.t("branch.new"),icon:"plus",onSelect:()=>{$t()}},{type:"separator"}],Q=A.local.map(ve=>Be(ve));if(A.remote.length===0)return[...G,...Q];const Et=A.remote.map(({name:ve,ref:St})=>Be(ve,St)),At={type:"group",label:e.t("branch.remote"),items:Et};return[...G,...Q,{type:"separator"},At]};return u.addEventListener("pointerenter",be),u.addEventListener("focusin",be),de.insert(u,()=>W.createComponent(e.ui.Menu,{label:e.t("branch.switch"),trigger:"button",placement:"bottom-start",get disabled(){return X()},get items(){return kt()}})),v}),b=On({ui:e.ui,label:e.t("message.copy"),copied:e.t("message.copied"),write:u=>e.system.copy(u).then(()=>!0,()=>(e.toast.show({title:e.t("message.copyFailed")}),!1))}),d=e.use(xt.Browser),l=u=>{const w=d(),v=e.sessions.current();return w.status!=="active"||!v||!w.value.canOpen(v)?!1:(w.value.open(v,u),!0)},$=()=>{Xt(n.value.archivedOpen),ut(o.value.enabled,r.value.inline),Zt(h),ln({lookup:p,open:u=>e.system.openExternal(u),label:({number:u,state:w,title:v})=>e.t("pr.label",{number:u,state:e.t(`pr.${w}`),title:v})}),Dt(D),Rt(),zt(t.hideAgent),Ft(te),Nn(b),hn(t.responseLabel),gn(),mn(i()),bn()&&!S&&(S=setTimeout(()=>{S=0,I()},300))};let q=0,S=0,U=!1;const I=()=>{q||U||(q=requestAnimationFrame(()=>{q=0,$()}))},F=new MutationObserver(I);F.observe(document.body,{childList:!0,subtree:!0});const te=new MutationObserver(I),gt=setInterval(I,Ie);document.addEventListener("scrollend",I,!0);const bt=Qt(a),vt=An(u=>W.createRoot(w=>(de.insert(u,()=>{const v=e.sessions.current();return v?xn(Sn(v),e.t,e.locale.locale()):[]}),w))),yt=_t(l);return x.createKeyed(()=>`${n.value.archivedOpen}:${o.value.enabled}:${r.value.inline}:${i()}`,$),e.add(x.Style,Yt),e.add(x.Style,sn),e.add(x.Style,Ot),e.add(x.Style,Wt(t)),e.add(x.Style,fn(t.responseLabel)),e.add(x.Style,En),e.add(x.Style,In),e.add(x.Slot,{at:"session.location.menu",order:100,render:u=>Jt({label:e.t("session.new"),icon:s("edit",{class:"shrink-0 text-v2-icon-icon-muted"}),shortcut:e.keybinds.keybind(et).join(""),onSelect:()=>{e.commands.run(et)||e.layout.draft({server:u.session.server.id,directory:u.session.directory,prompt:""})}})}),e.add(x.Command,()=>({id:"toggle-archived",title:e.t(n.value.archivedOpen?"archived.hide":"archived.show"),keywords:"archive archived settled sessions sidebar inbox",run:a})),e.add(x.Command,()=>({id:"toggle-groups",title:e.t(o.value.enabled?"groups.off":"groups.on"),keywords:"group project projects folders sessions sidebar inbox",run:()=>o.update(u=>{u.enabled=!u.enabled})})),e.add(x.Command,()=>({id:"toggle-working",title:e.t(r.value.inline?"working.section":"working.inline"),keywords:"working running busy section shelf sessions sidebar inbox",run:()=>r.update(u=>{u.inline=!u.inline})})),()=>{U=!0,F.disconnect(),te.disconnect(),cancelAnimationFrame(q),clearTimeout(S),clearInterval(gt),document.removeEventListener("scrollend",I,!0),bt(),vt(),yt(),tn(),un(),Ut(),Gt(),vn(),Dn()}}function Pn(e){const{archiveAfterHours:t}=ft(e.options);if(e.onCleanup(Kt(e,{app:ye.app,safeStorage:ye.safeStorage,webContents:ye.webContents})),t>0)return Tt(e,t*Rn)}const Bn=x.Plugin.define({stores:{shelf:x.Store.global(K.Schema.Struct({archivedOpen:K.Schema.Boolean}),{archivedOpen:!1}),groups:x.Store.global(K.Schema.Struct({enabled:K.Schema.Boolean}),{enabled:!0}),working:x.Store.global(K.Schema.Struct({inline:K.Schema.Boolean}),{inline:!0})},i18n:{en:{"archived.show":"Show archived sessions","archived.hide":"Hide archived sessions","groups.on":"Group sessions by project","groups.off":"Stop grouping sessions by project","working.inline":"Show working sessions in the list","working.section":"Show working sessions in their own section","session.new":"New session","session.newIn":"New session in {{project}}","session.failed":"Could not start a session in {{project}}","usage.window":"Context window","usage.cacheRead":"Cache read","usage.cacheWrite":"Cache write","usage.input":"Input","usage.reasoning":"Reasoning","usage.output":"Output","usage.cost":"Cost","branch.switch":"Switch branch","branch.loading":"Loading…","branch.unlisted":"Could not list the branches","branch.remote":"Remote","branch.failed":"Could not switch to {{branch}}","branch.new":"New branch…","branch.create":"Create branch","branch.from":"The new branch starts from {{branch}}, with your changes.","branch.name":"Branch name","branch.submit":"Create","branch.uncreated":"Could not create {{branch}}","pr.label":"PR #{{number}}, {{state}}: {{title}}","pr.open":"open","pr.draft":"draft","pr.merged":"merged","pr.closed":"closed","message.copy":"Copy message","message.copied":"Copied","message.copyFailed":"Could not copy the message"}},setup:jn,main:Pn});exports.default=Bn;
