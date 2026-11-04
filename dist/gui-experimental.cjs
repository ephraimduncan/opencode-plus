"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const y=require("@opencode/plugin/gui"),yn=require("@opencode/plugin/gui/browser"),Z=require("effect"),Oe=require("electron"),h=require("solid-js"),r=require("solid-js/web"),xn=require("@opencode/client/solid"),$e=require("solid-js/store"),kn=require("@opencode/plugin/rpc"),ye=60*1e3,Pe=200,ht=["session.inbox.enqueued","session.execution.started","session.unarchived"],gt=Symbol.for("opencode-plus.archive");function Cn(e,t,n,o){const{created:a,updated:i,busy:l,idle:u,archived:d}=e.time;if(d!==void 0||e.parentID||l!==void 0&&(u===void 0||l>u))return!1;const s=Math.max(a,l??0,u??0);return(Number(e.metadata?.[o])||0)>=s||t-i<2*ye?!1:t-s>=n}function Sn(e,t){const n=`${e.id}.keptAt`,o=Date.now(),a=new AbortController,i=a.signal,l=b=>e.log.write("error",`${e.id}: ${b?.stack??b}`),u=async()=>{const b=[];let v=await e.client.session.list({parentID:null,archived:!1,limit:Pe});for(;;){if(b.push(...v.data),v.data.length<Pe||!v.cursor.next)return b;v=await e.client.session.list({cursor:v.cursor.next,limit:Pe})}};let d=!1;const s=async()=>{if(!d){d=!0;try{const b=Date.now(),v=(await u()).filter(f=>Cn(f,b,t,n));for(const f of v)await e.client.session.update({sessionID:f.id,archived:!0}),e.log.write("info",`${e.id}: archived ${f.id} "${f.title??""}"`)}finally{d=!1}}},c=async b=>{if(!ht.includes(b.type)||b.created<o-ye||b.type==="session.inbox.enqueued"&&b.data.item.type!=="user")return;const v=await e.client.session.get({sessionID:b.data.sessionID}),f=v.time.archived;if(b.type!=="session.unarchived"){if(f===void 0||b.created<=f)return;await e.client.session.update({sessionID:v.id,archived:!1}),e.log.write("info",`${e.id}: unarchived ${v.id} on ${b.type}`);return}f!==void 0||(Number(v.metadata?.[n])||0)>=b.created||await e.client.session.update({sessionID:v.id,metadata:{...v.metadata,[n]:b.created}})},m=async()=>{for(;!i.aborted;){try{const b=e.client.event.subscribe({types:ht},{signal:i});for await(const v of b)c(v).catch(l)}catch(b){i.aborted||l(b)}i.aborted||await new Promise(b=>setTimeout(b,5e3))}},p=()=>{s().catch(l)},g=setTimeout(p,ye),x=setInterval(p,10*ye),$=()=>{i.aborted||(clearTimeout(g),clearInterval(x),a.abort())};return globalThis[gt]?.(),globalThis[gt]=$,e.signal.addEventListener("abort",$,{once:!0}),m(),$}const L=(e,t,n)=>{e.getAttribute(t)!==n&&e.setAttribute(t,n)},ne=(e,t,n)=>n===void 0?e.removeAttribute(t):L(e,t,n),Ot='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5L8 9.5L11.5 6.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',Pt='[data-slot="new-session-composer"]',An='[data-slot="new-session-location-path"]',En=["branch","new-branch"].map(e=>`${Pt} use[href="#opencode-v2-icon-${e}"]`).join(", "),V="data-plus-branch",re="data-plus-branch-name",ge="data-plus-branch-trigger",de="data-plus-branch-menu",jt="data-plus-branch-current",In='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M3.53564 8.17857L6.39279 11.75L12.4642 4.25" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',_n=`
[${V}] {
  position: relative;
  border-radius: var(--radius-sm);
}
[${V}]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline: -2px -4px;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(Ot)}") center / 16px no-repeat;
}
[${V}]:is(:hover, :has(:focus-visible), :has([data-expanded])) {
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${re}] {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
[${re}]:empty,
[${V}] > span:has(+ [${re}]:not(:empty)) {
  display: none;
}
[${ge}] {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
[${ge}] > button {
  width: 100%;
  height: 100%;
  opacity: 0;
}
[${de}] {
  width: max-content;
  max-width: min(320px, 100vw - 32px);
  max-height: min(320px, var(--kb-popper-content-available-height, 320px));
  overflow-y: auto;
}
[${de}] [data-slot="menu-v2-item-content"] {
  flex: 0 1 auto;
  min-width: 0;
}
[${de}] [data-component="menu-v2-item"]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
}
[${de}] [${jt}]::after {
  background-color: var(--menu-v2-icon);
  mask: url("data:image/svg+xml,${encodeURIComponent(In)}") center / 14px no-repeat;
}
`,Dn="git branch --all --no-color --no-column --sort=-committerdate",le=new Map;function Mn(e){le.forEach(({update:t,dispose:n},o)=>{if(o.isConnected)return t();n(),le.delete(o)}),document.querySelectorAll(En).forEach(t=>{const n=t.closest("svg").parentElement;if(le.has(n))return;const o=document.createElement("span"),a=document.createElement("div");o.setAttribute(re,""),o.dir="auto",a.setAttribute(ge,""),n.setAttribute(V,""),n.append(o,a),le.set(n,e(a,n))})}function qn(e,t){const n=e.querySelector(`[${re}]`),o=t===et(e)?"":t??"";n.textContent!==o&&(n.textContent=o)}const je=e=>`${Bt(e)}
${et(e)}`;function Tn(){document.querySelectorAll(`[${ge}] > [aria-controls]`).forEach(e=>{const t=document.getElementById(e.getAttribute("aria-controls"));if(!t)return;const n=e.closest(`[${V}]`),o=n.querySelector(`[${re}]`).textContent||et(n);L(t,de,""),t.querySelectorAll('[data-component="menu-v2-item"]').forEach(a=>{const i=a.querySelector('[data-slot="menu-v2-item-content"] > span');ne(a,jt,a.textContent.trim()===o?"":void 0),i&&ne(a,"title",i.scrollWidth>i.clientWidth?i.textContent:void 0)})})}async function Ln(e,t){const n=Bt(e);if(!n.includes("…"))return n||void 0;const[o,a]=n.split("…");return(await t()).flatMap(i=>[i.canonical,...i.sandboxes]).find(i=>i.startsWith(o)&&i.endsWith(a))}function Nn(e){const t=new Set,n=[],o=new Map;let a;for(const l of e.split(/\r?\n/)){const u=l.slice(2).trim();if(!(!u||u.startsWith("(")||u.includes(" -> "))){if(u.startsWith("remotes/")){const d=u.slice(8),s=d.slice(d.indexOf("/")+1);o.has(s)||o.set(s,d);continue}t.add(u),l.startsWith("*")&&(a=u),l.startsWith("+")||n.push(u)}}const i=Array.from(o,([l,u])=>({name:l,ref:u})).filter(({name:l})=>!t.has(l));return{current:a,local:n,remote:i}}const On=(...e)=>["git","switch",...e.map(Rt)].join(" "),Rt=e=>/^[\w./-]+$/.test(e)?e:`'${e.replaceAll("'","'\\''")}'`;function Pn(){le.forEach(({dispose:e})=>e()),le.clear(),document.querySelectorAll(`[${re}], [${ge}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${V}]`).forEach(e=>e.removeAttribute(V))}const Bt=e=>e.closest(Pt)?.querySelector(An)?.textContent??"",et=e=>e.querySelector(":scope > span").textContent.trim(),zt='[data-slot="composer-controls"]',Wt=`${zt} > div > [data-component="tooltip-v2-trigger"]`,Ft='[data-action="composer-model"]',Ut=`${Wt}:has(~ [data-component="tooltip-v2-trigger"] ${Ft})`,Kt=`${Wt}:has(${Ft}) ~ [data-component="tooltip-v2-trigger"]`,ke="data-plus-hidden-agent",Ce="data-plus-variant-menu";function jn({lowercaseVariants:e}){return`
${Ut}[${ke}] {
  display: none;
}
${e?`${Kt} .capitalize,
[${Ce}] .capitalize {
  text-transform: lowercase;
}`:""}
`}function Rn(e){document.querySelectorAll(Ut).forEach(t=>{const n=e!==!1&&t.textContent.trim().toLowerCase()===e.toLowerCase();ne(t,ke,n?"":void 0)}),document.querySelectorAll(`${Kt} [aria-controls]`).forEach(t=>{const n=document.getElementById(t.getAttribute("aria-controls"));n&&L(n,Ce,"")})}const vt=new WeakSet;function Bn(e){document.querySelectorAll(zt).forEach(t=>{vt.has(t)||(vt.add(t),e.observe(t,{subtree:!0,characterData:!0}))})}function zn(){document.querySelectorAll(`[${ke}]`).forEach(e=>e.removeAttribute(ke)),document.querySelectorAll(`[${Ce}]`).forEach(e=>e.removeAttribute(Ce))}const Wn="browser.cookies",wt=1e3,bt=Symbol.for("opencode-plus.cookies");function Fn(e,{app:t,safeStorage:n,webContents:o}){globalThis[bt]?.();const a=v=>e.log.write("warn",`${e.id}: ${v?.stack??v}`),i=n.isEncryptionAvailable()?e.storage.store(Wn,{schema:Z.Schema.String,initial:""}):void 0,l=()=>{if(!i?.value)return[];try{const v=Date.now()/wt;return JSON.parse(n.decryptString(Buffer.from(i.value,"base64"))).filter(C=>C.expirationDate===void 0||C.expirationDate>v)}catch(v){return a(v),[]}},u=new Map(l().map(v=>[Re(v),v]));let d;const s=()=>{clearTimeout(d),d=void 0,i.set(n.encryptString(JSON.stringify([...u.values()])).toString("base64"))},c=()=>{i&&(d??=setTimeout(s,wt))},m=new Map,p=(v,f,C)=>{const _=Re(f),E=v.sent.get(_)??[];E.push(C),v.sent.set(_,E),v.session.cookies.set(C?$t(f):{...$t(f),expirationDate:1}).catch(M=>{const B=E.indexOf(C);B>=0&&E.splice(B,1),a(M)})},g=(v,f,C,_)=>{if(_&&C==="overwrite")return;const E=Re(f),R=_?"":JSON.stringify(f),M=v.sent.get(E)??[],B=M.indexOf(R);if(B>=0){M.splice(0,B+1),M.length===0&&v.sent.delete(E);return}if(R!==(u.has(E)?JSON.stringify(u.get(E)):"")){_?u.delete(E):u.set(E,f);for(const G of m.values())G!==v&&p(G,f,R);c()}},x=v=>{if(v.isPersistent()||m.has(v))return;const f={session:v,sent:new Map,listener:(C,_,E,R)=>g(f,Un(_),E,R)};m.set(v,f),v.cookies.on("changed",f.listener);for(const C of u.values())p(f,C,JSON.stringify(C))};t.on("session-created",x);const $=(v,f)=>x(f.session);t.on("web-contents-created",$);for(const v of o.getAllWebContents())x(v.session);const b=()=>{t.off("session-created",x),t.off("web-contents-created",$);for(const v of m.values())v.session.cookies.off("changed",v.listener);m.clear(),d&&s()};return globalThis[bt]=b,b}function Un({name:e,value:t,domain:n,path:o,secure:a,httpOnly:i,sameSite:l,expirationDate:u}){return{name:e,value:t,domain:n,path:o,secure:a,httpOnly:i,sameSite:l,...u!==void 0&&{expirationDate:u}}}function Re({domain:e,path:t,name:n}){return[e,t,n].join("	")}function $t({domain:e,...t}){const n=e.replace(/^\./,"");return{...t,url:`${t.secure?"https":"http"}://${n}${t.path}`,...e!==n&&{domain:e}}}function Kn(e){const t=n=>{if(n.defaultPrevented||n.metaKey||n.ctrlKey||n.shiftKey||n.altKey)return;const o=n.target instanceof Element?n.target.closest("a[href]"):null;!(o instanceof HTMLAnchorElement)||!/^https?:$/.test(o.protocol)||o.closest('[role="dialog"]')||e(o.href)&&n.preventDefault()};return document.addEventListener("click",t),()=>document.removeEventListener("click",t)}function Hn({label:e,icon:t,shortcut:n,onSelect:o}){const a=document.createElement("hr");a.setAttribute("data-slot","menu-v2-separator");const i=document.createElement("div");i.setAttribute("role","menuitem"),i.setAttribute("data-component","menu-v2-item");const l=document.createElement("span");if(l.setAttribute("data-slot","menu-v2-item-content"),t(l),l.append(e),i.append(l),n){const u=document.createElement("span");u.setAttribute("data-slot","menu-v2-item-shortcut"),u.textContent=n,i.append(u)}return i.addEventListener("pointerenter",()=>i.setAttribute("data-highlighted","")),i.addEventListener("pointerleave",()=>i.removeAttribute("data-highlighted")),i.addEventListener("click",()=>{i.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:!0})),o()}),queueMicrotask(()=>{const u=i.closest('[role="menu"]')?.querySelector("[data-appearance]")?.getAttribute("data-appearance");u&&(i.setAttribute("data-appearance",u),a.setAttribute("data-appearance",u))}),[a,i]}const T='[data-slot="sidebar-inbox"]',tt='[data-slot="sidebar-inbox-scroll"]',me='[data-slot="sidebar-inbox-working"]',nt=`${tt} > div.pt-3`,A='[data-slot="sidebar-inbox-item"]',O="data-plus-shelf",F="data-plus-toggle",rt="data-plus-count",P="data-plus-group",Se="data-plus-gap",W="data-plus-member",te="data-plus-inline",H="data-plus-add",Be=`${T} ${A}[data-status="ready"]:not([data-state="active"], :hover:not(:has([${H}]:hover)), :focus-visible, [${O}] > *)`,Gn=`
${nt} {
  order: 100000;
  margin-top: auto;
}
${T}[${te}] {
  overflow-y: auto;
  gap: 1px;
  padding-bottom: 4px;
}
[${te}] > ${tt},
[${te}] > ${me},
[${te}] > ${me} > div {
  display: contents;
}
[${te}] > ${me} > button {
  display: none;
}
[${O}] > [${F}] {
  border-radius: 6px;
}
[${O}] > [${F}]:hover {
  color: var(--color-v2-text-text-base);
}
[${O}] > [${F}]:focus-visible {
  outline: none;
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${O}] > [${F}]::before {
  content: attr(${rt});
  order: 1;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-faint);
}
[${O}] > [${F}]::after {
  content: "";
  order: 2;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(Ot)}") center / 16px no-repeat;
}
[${O}="closed"] > [${F}]::after {
  rotate: -90deg;
}
[${O}="closed"] > [${F}]:dir(rtl)::after {
  rotate: 90deg;
}
[${O}="closed"] > ${A}:not([data-state="active"]) {
  display: none;
}
${T} ${A}[data-status="working"] {
  opacity: 1;
}
${T} ${A}[data-status="working"] > span:nth-of-type(2) {
  color: var(--color-v2-text-text-base);
}
/* T3 Code's Working colors: sky-600 text and a sky-500 pulsing dot, or sky-300 at 80% in dark mode. */
${T} {
  --plus-working: oklch(58.8% 0.158 241.966);
  --plus-working-dot: oklch(68.5% 0.169 237.323);
  --plus-working-peak: oklch(74.6% 0.16 232.661);
}
[data-color-scheme="dark"] ${T} {
  --plus-working: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-dot: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-peak: oklch(95.1% 0.026 236.824);
}
${T} ${A}[data-status="working"] > span:first-child > span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--plus-working);
}
${T} ${A}[data-status="working"] > span:first-child > span:last-child > span {
  color: inherit;
}
${T} ${A}[data-status="working"] [data-component="text-shimmer"] {
  --text-shimmer-base-color: var(--plus-working);
  --text-shimmer-peak-color: var(--plus-working-peak);
}
${T} ${A}[data-status="working"] > span:first-child > span:last-child::before {
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
  ${T} ${A}[data-status="working"] > span:first-child > span:last-child::before {
    animation: none;
  }
}
${T} ${A} > span,
${T} ${A} > span:first-child > span {
  transition: opacity 150ms;
}
${Be}:not([${W}]) > span,
${Be}[${W}] > span:not(:first-child),
${Be}[${W}] > span:first-child > span:last-child {
  opacity: 0.6;
}
/* In a project group the heading names the project, so rows drop their project line and show the time beside the
   title: the first line dissolves into the row's grid, keeping only its last part, the time or status. */
${A}[${W}] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "title status";
  column-gap: 8px;
}
${A}[${W}] > span:first-child {
  display: contents;
}
${A}[${W}] > span:first-child > span:not(:last-child) {
  display: none;
}
${A}[${W}] > span:first-child > span:last-child {
  grid-area: status;
}
${A}[${W}] > span:nth-of-type(2) {
  grid-area: title;
}
${A}[${W}] > span:nth-of-type(3) {
  grid-column: 1 / -1;
}
/* The same space before every project; a group's heading takes its own 28px on top of it. */
${A}[${Se}] {
  margin-top: 16px;
}
${A}[${P}] {
  position: relative;
  margin-top: 28px;
}
${A}[${P}][${Se}] {
  margin-top: 44px;
}
${A}[${P}]::before {
  content: attr(${P});
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
${A}[${P}] > span:first-child > span:first-child {
  display: flex;
  position: absolute;
  inset-inline-start: 6px;
  bottom: calc(100% + 8px);
  pointer-events: none;
}
/* The heading's + button, at the far end of its 24px line, its icon in line with the times of the rows below. */
${A}[${P}] > [${H}] {
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
${A}[${P}] > [${H}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
${A}[${P}]:not([data-state="active"]):has(> [${H}]:hover) {
  background-color: transparent;
}
`,pe=e=>e?Array.from(e.children).filter(t=>t.matches(A)):[],Ve=e=>e.querySelector(":scope > span:first-child > span.truncate")?.textContent?.trim(),Ht=e=>{e.style.removeProperty("order"),e.style.length===0&&e.removeAttribute("style"),e.removeAttribute(P),e.removeAttribute(Se),e.removeAttribute(W)};function Vn(e){const t=e?"open":"closed";document.querySelectorAll(nt).forEach(n=>{const o=n.firstElementChild;!o||o.matches(A)||(L(n,O,t),L(o,F,""),L(o,rt,String(pe(n).length)),L(o,"role","button"),L(o,"tabindex","0"),L(o,"aria-expanded",String(e)))})}function Jn(e){const t=a=>a.target instanceof Element?a.target.closest(`${nt} > [${F}]`):null,n=a=>{t(a)&&e()},o=a=>{a.key!=="Enter"&&a.key!==" "||!t(a)||(a.preventDefault(),e())};return document.addEventListener("click",n),document.addEventListener("keydown",o),()=>{document.removeEventListener("click",n),document.removeEventListener("keydown",o)}}const yt=(e,t,n=[])=>{const o=[...n,...e];if(!t&&n.length===0)return o.forEach(Ht);const a=new Map;o.forEach(l=>{const u=t&&Ve(l)||l;a.set(u,[...a.get(u)??[],l])});let i=0;Array.from(a).forEach(([l,u],d)=>{const s=t&&typeof l=="string"&&u.length>1;u.forEach((c,m)=>{i+=1,c.style.order!==String(i)&&(c.style.order=String(i)),ne(c,P,s&&m===0?l:void 0),ne(c,W,s?"":void 0),ne(c,Se,t&&d>0&&m===0?"":void 0)})})};function Gt(e,t){document.querySelectorAll(T).forEach(n=>{const o=n.querySelector(`:scope > ${tt}`),a=n.querySelector(`:scope > ${me} > div`),i=new Set;t?(L(n,te,""),n.querySelector(`:scope > ${me} > button[aria-expanded="false"]`)?.click(),yt(pe(o),e,pe(a)),i.add(o).add(a)):n.removeAttribute(te),new Set(Array.from(n.querySelectorAll(A),l=>l.parentElement)).forEach(l=>{if(i.has(l))return;const u=l.getAttribute(O)==="closed",d=pe(l).filter(s=>!u||s.getAttribute("data-state")==="active");pe(l).filter(s=>!d.includes(s)).forEach(Ht),yt(d,e)})})}function Yn(e){document.querySelectorAll(`${A} > [${H}]`).forEach(t=>{t.parentElement.getAttribute(P)!==t.getAttribute(H)&&t.remove()}),document.querySelectorAll(`${A}[${P}]`).forEach(t=>{t.querySelector(`:scope > [${H}]`)||t.append(e(t.getAttribute(P)))})}function Xn({name:e,label:t,icon:n,onSelect:o}){const a=document.createElement("div");return a.setAttribute(H,e),a.setAttribute("role","button"),a.setAttribute("aria-label",t),a.setAttribute("title",t),n(a),Vt(a,o),a}function Vt(e,t){const n=o=>{o.preventDefault(),o.stopPropagation(),t()};e.setAttribute("tabindex","0"),e.addEventListener("pointerdown",o=>o.stopPropagation()),e.addEventListener("click",n),e.addEventListener("keydown",o=>{(o.key==="Enter"||o.key===" ")&&n(o)})}function Zn(){Gt(!1,!1),document.querySelectorAll(`[${H}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${O}]`).forEach(e=>e.removeAttribute(O)),document.querySelectorAll(`[${F}]`).forEach(e=>{[F,rt,"role","tabindex","aria-expanded"].forEach(t=>e.removeAttribute(t))})}const Qn=`${A} > span:nth-of-type(3)`,er=':scope > span > span[dir="ltr"]',U="data-plus-pr",xt="data-plus-pr-url",tr=120*1e3,we=e=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${e}</svg>`,kt={open:we('<circle cx="5" cy="6" r="3"/><path d="M5 9v12"/><circle cx="19" cy="18" r="3"/><path d="m15 9-3-3 3-3"/><path d="M12 6h5a2 2 0 0 1 2 2v7"/>'),draft:we('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 6V5"/><path d="M18 11v-1"/><path d="M6 9v12"/>'),merged:we('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>'),closed:we('<circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="m21 3-6 6"/><path d="m21 9-6-6"/><path d="M18 11.5V15"/><circle cx="18" cy="18" r="3"/>')},Ct={open:["oklch(59.6% 0.145 163.225)","oklch(84.5% 0.143 164.978 / 0.9)"],draft:["oklch(55.2% 0.016 285.938)","oklch(70.5% 0.015 286.067 / 0.8)"],merged:["oklch(54.1% 0.281 293.009)","oklch(81.1% 0.111 293.571 / 0.9)"],closed:["oklch(57.7% 0.245 27.325)","oklch(80.8% 0.114 19.571 / 0.9)"]},nr=`
[${U}] {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  margin-inline-start: auto;
  padding-inline: 2px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}
[${U}] ~ .ms-auto {
  margin-inline-start: 0;
}
[${U}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${U}]::before {
  content: "";
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  background-color: var(--plus-pr);
}
${Object.keys(kt).map(e=>`[${U}="${e}"] {
  --plus-pr: ${Ct[e][0]};
}
[data-color-scheme="dark"] [${U}="${e}"] {
  --plus-pr: ${Ct[e][1]};
}
[${U}="${e}"]::before {
  mask: url("data:image/svg+xml,${encodeURIComponent(kt[e])}") center / 12px no-repeat;
}`).join(`
`)}
`,rr=e=>`git remote get-url origin && GH_NO_UPDATE_NOTIFIER=1 gh pr list --state all --limit 20 --json number,title,url,state,isDraft,updatedAt,headRepositoryOwner --head ${Rt(e)} 2>/dev/null`;function or(e){const[t,...n]=e.trim().split(/\r?\n/),o=t.match(/[:/]([^/:]+)\/[^/]+$/)?.[1].toLowerCase(),a=JSON.parse(n.join(`
`)).filter(u=>u.headRepositoryOwner?.login.toLowerCase()===o).toSorted((u,d)=>Date.parse(d.updatedAt)-Date.parse(u.updatedAt)),i=a.find(u=>u.state==="OPEN")??a[0];if(!i)return;const l=i.state==="OPEN"&&i.isDraft?"draft":i.state.toLowerCase();return{number:i.number,title:i.title,url:i.url,state:l}}const ce=new Map;let Je=new Set,St=Promise.resolve();function sr({lookup:e,open:t,label:n}){const o=Date.now(),a=Array.from(document.querySelectorAll(Qn),l=>{const u=l.querySelector(er),d=u?.textContent.trim(),s=l.parentElement;return{line:l,row:s,branch:d,key:d&&`${Ve(s)}
${d}`,holder:u?.parentElement}}),i=new Set(a.filter(({row:l,key:u})=>u&&l.getAttribute("data-status")==="working").map(({key:l})=>l));Je.forEach(l=>{const u=ce.get(l);!i.has(l)&&u?.time!==void 0&&(u.time=0)}),Je=i,a.forEach(({line:l,row:u,branch:d,key:s,holder:c})=>{const m=s&&ce.get(s);let p=l.querySelector(`:scope > [${U}]`);s&&(!m||m.time!==void 0&&o-m.time>=tr)&&ar(s,()=>e(Ve(u),d));const g=m?.pull;if(!g)return p?.remove();p||(p=document.createElement("span"),p.setAttribute("role","link"),Vt(p,()=>t(p.getAttribute(xt))));const x=n(g);p.previousElementSibling!==c&&c.after(p),L(p,U,g.state),L(p,xt,g.url),L(p,"title",x),L(p,"aria-label",x),p.textContent!==`#${g.number}`&&(p.textContent=`#${g.number}`)})}const ar=(e,t)=>{const n=St.then(t).catch(()=>{});ce.set(e,{pull:ce.get(e)?.pull}),St=n,n.then(o=>ce.set(e,{time:Date.now(),pull:o}))};function ir(){ce.clear(),Je=new Set,document.querySelectorAll(`[${U}]`).forEach(e=>e.remove())}const lr=["small","medium","large","unrestricted"];function Jt(e={}){const t=e.archiveAfterHours,n=e.workflowConcurrency;return{archiveAfterHours:typeof t=="number"&&t>=0?t:12,hideAgent:typeof e.hideAgent=="string"||e.hideAgent===!1?e.hideAgent:"build",responseLabel:typeof e.responseLabel=="string"?e.responseLabel:e.responseLabel===!1?"":"Response",lowercaseVariants:e.lowercaseVariants!==!1,workflows:e.workflows!==!1,workflowSize:lr.includes(e.workflowSize)?e.workflowSize:"medium",workflowConcurrency:Number.isInteger(n)&&n>=1?Math.min(n,256):void 0}}const cr="[data-timeline-virtual-content]",Yt='[data-slot="session-turn-message-container"]',ve="data-plus-final",ze=`[${ve}] > [data-component="session-turn"] > ${Yt}`,ot="--plus-label-half";function ur(e){return`
${ze} {
  --plus-gap: calc(var(${ot}, ${e.length*3.75}px) + 12px);
  position: relative;
}
${ze}::before {
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
${ze}::after {
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
`}let At=!1;function dr(e){const t=document.querySelector(Yt);if(At||!e||!t||document.fonts?.status==="loading")return;const n=document.createElement("span");n.textContent=e,n.style.cssText="position: absolute; visibility: hidden; white-space: nowrap; font-size: 13px; font-weight: 440; letter-spacing: -0.04px",t.append(n);const o=n.getBoundingClientRect().width;n.remove(),o&&(document.documentElement.style.setProperty(ot,`${o/2}px`),At=!0)}const Q=e=>e?.frame?.getAttribute("data-timeline-row"),X=e=>e?.frame?.getAttribute("data-message-id"),We=e=>Q(e)==="AssistantPart"&&!!e.frame.querySelector('[data-component="text-part"]')&&!e.frame.querySelector('[data-component="tool-part-wrapper"], [data-timeline-part-ids]');function pr(e){document.querySelectorAll(cr).forEach(t=>{const n=Array.from(t.querySelectorAll(":scope > div > [data-timeline-key]"),s=>({wrapper:s,frame:s.querySelector(":scope > [data-index] > [data-timeline-row]"),top:parseFloat(s.style.top),height:parseFloat(s.style.height)})).sort((s,c)=>s.top-c.top),o=t.querySelector(':scope > [data-timeline-row="bottom-spacer"]'),a=s=>n[s+1]&&Math.abs(n[s+1].top-(n[s].top+n[s].height))<2?n[s+1]:void 0,i=s=>n[s-1]&&Math.abs(n[s].top-(n[s-1].top+n[s-1].height))<2?n[s-1]:void 0,l=s=>s===n.length-1&&!!o&&Math.abs(n[s].wrapper.getBoundingClientRect().bottom-o.getBoundingClientRect().top)<2,u=e?void 0:!0,d=s=>{const c=a(s);return c?c.frame?Q(c)==="TurnGap"||Q(c)==="UserMessage"||X(c)&&X(c)!==X(n[s])||Q(c)==="TurnDiff"||Q(c)==="TurnDivider"?!0:Q(c)==="AssistantPart"||Q(c)==="Thinking"?!1:u:u:n[s+1]||!l(s)?void 0:u};n.forEach((s,c)=>{if(!We(s))return Fe(s,!1);const m=d(c);if(m===void 0)return;if(!m){const g=a(c);We(g)&&X(g)===X(s)||Fe(s,!1);return}let p=c;for(;We(i(p))&&X(i(p))===X(s);)p-=1;for(let g=p;g<=c;g+=1)Fe(n[g],g===p&&n[g].frame.hasAttribute("data-timeline-spacing"))})})}const fe=new Map,Fe=(e,t)=>{!e.frame||e.frame.hasAttribute(ve)===t||(ne(e.frame,ve,t?"":void 0),fe.set(e.frame.parentElement,10))};function mr(){fe.forEach((e,t)=>{if(!(t.isConnected&&Math.abs(t.offsetHeight-parseFloat(t.parentElement.style.height))>=1)||e===0)return fe.delete(t);fe.set(t,e-1),t.style.paddingBottom="1px",requestAnimationFrame(()=>t.style.removeProperty("padding-bottom"))})}const fr=()=>fe.size>0;function hr(){document.querySelectorAll(`[${ve}]`).forEach(e=>e.removeAttribute(ve)),document.documentElement.style.removeProperty(ot)}const gr='[data-component="tooltip-v2-trigger"] > button:not([aria-haspopup]):has([data-component="progress-circle"])',q="data-plus-usage",Et="plus-usage-card",Ye="data-plus-usage-hover",vr=50,wr=100,br=4,$r=`
:root[${Ye}] [data-component="tooltip-v2"]:not([data-force-open="true"]) {
  display: none;
}
[${q}] {
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
[${q}]:dir(rtl) {
  transform-origin: top left;
}
[${q}] [data-part="row"] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
  white-space: nowrap;
}
[${q}] [data-part="row"] > :last-child {
  margin-inline-start: auto;
}
[${q}] :is([data-part="value"], [data-part="percent"]) {
  color: var(--v2-text-text-base);
}
[${q}] [data-part="percent"] {
  font-weight: 530;
}
[${q}] [data-part="bar"] {
  display: flex;
  height: 8px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--v2-background-bg-layer-03);
}
[${q}] [data-part="bar"] > span {
  box-sizing: border-box;
  min-width: 3px;
}
/* A line in the card's color between kinds, as in Cursor's bar. */
[${q}] [data-part="bar"] > span + span {
  border-inline-start: 1px solid var(--v2-background-bg-layer-01);
}
[${q}] [data-part="legend"] {
  display: flex;
  flex-direction: column;
}
[${q}] [data-part="dot"] {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
[${q}] hr {
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
  [${q}] {
    animation: none;
  }
}
:root[data-motion="reduce"] [${q}] {
  animation: none;
}
`;function yr(e){let t,n,o=0;const a=document.documentElement,i=(f,C)=>{clearTimeout(o),o=setTimeout(f,C)},l=f=>f.target instanceof Element?f.target.closest(gr):null,u=f=>f instanceof Node&&!!(t?.contains(f)||n?.card.contains(f)),d=()=>{if(!t.isConnected)return;const f=document.createElement("div"),C=t.closest("[data-theme]")?.getAttribute("data-theme");f.id=Et,f.setAttribute(q,""),f.setAttribute("role","tooltip"),C&&f.setAttribute("data-theme",C),n={card:f,stop:e(f)},document.body.append(f),Sr(f,t),t.setAttribute("aria-describedby",Et)},s=()=>{clearTimeout(o),n?.stop(),n?.card.remove(),n=void 0,t?.removeAttribute("aria-describedby")},c=f=>{if(f===t){n&&clearTimeout(o);return}m(),t=f,a.setAttribute(Ye,""),i(d,vr)},m=()=>{s(),t=void 0,a.removeAttribute(Ye)},p=f=>{if(f.pointerType==="touch")return;const C=l(f);if(C)return c(C);if(n?.card.contains(f.target))return clearTimeout(o);t&&!t.isConnected&&m()},g=f=>{!t||u(f.relatedTarget)||!u(f.target)||(n?i(m,wr):m())},x=f=>{t?.contains(f.target)&&s()},$=f=>{f.key==="Escape"&&s()},b=f=>{const C=l(f);C?.matches(":focus-visible")&&c(C)},v=f=>{t?.contains(f.target)&&!u(f.relatedTarget)&&m()};return document.addEventListener("pointerover",p),document.addEventListener("pointerout",g),document.addEventListener("pointerdown",x,!0),document.addEventListener("keydown",$),document.addEventListener("focusin",b),document.addEventListener("focusout",v),()=>{document.removeEventListener("pointerover",p),document.removeEventListener("pointerout",g),document.removeEventListener("pointerdown",x,!0),document.removeEventListener("keydown",$),document.removeEventListener("focusin",b),document.removeEventListener("focusout",v),m()}}function xr(e){const t=e.server.data,n=e.directory?{directory:e.directory}:void 0,o=t.session.get(e.id),a=t.session.message.list(e.id),i=xn.lastAssistantWithUsage(a,o?.revert?.messageID),l=i?.tokens,u=l?l.input+l.output+l.reasoning+l.cache.read+l.cache.write:0,d=i?It(t,n,i.model)?.limit.context:void 0,s=t.session.cost(e.id),c=o?.model??a.findLast(g=>g.type==="assistant")?.model,m=c?It(t,n,c):void 0,p=!!m&&m.cost.every(g=>!g.input&&!g.output&&!g.cache.read&&!g.cache.write);return{total:u,tokens:l,limit:d||void 0,percent:d?Math.round(u/d*100):void 0,cost:s>0||!p?s:void 0}}function kr({total:e,tokens:t,limit:n,percent:o,cost:a},i,l){const u=p=>new Intl.NumberFormat(l,{notation:"compact",maximumFractionDigits:0}).format(p).toLocaleLowerCase(l),d=t?Cr.map(p=>({...p,value:p.value(t)})).filter(p=>p.value>0):[],s=Math.max(n??0,e),c=N("span",void 0,n?`${u(e)} / ${u(n)} `:u(e));n&&c.append(N("span","percent",`(${o}%)`));const m=[Ue([N("span",void 0,i("usage.window")),c])];if(s>0){const p=N("div","bar");p.setAttribute("aria-hidden","true"),d.forEach(g=>{const x=N("span");x.style.width=`${g.value/s*100}%`,x.style.background=g.color,p.append(x)}),m.push(p)}if(d.length){const p=N("div","legend");d.forEach(g=>{const x=N("span","dot");x.style.background=g.color,p.append(Ue([x,N("span",void 0,i(g.label)),N("span","value",g.value.toLocaleString(l))]))}),m.push(p)}if(a!==void 0){const p=new Intl.NumberFormat(l,{style:"currency",currency:"USD"});m.push(N("hr"),Ue([N("span",void 0,i("usage.cost")),N("span","value",p.format(a))]))}return m}const Cr=[{label:"usage.cacheRead",color:"var(--v2-avatar-border-blue)",value:e=>e.cache.read},{label:"usage.cacheWrite",color:"var(--v2-avatar-border-purple)",value:e=>e.cache.write},{label:"usage.input",color:"var(--v2-avatar-border-pink)",value:e=>e.input},{label:"usage.reasoning",color:"var(--v2-avatar-border-yellow)",value:e=>e.reasoning},{label:"usage.output",color:"var(--v2-avatar-border-green)",value:e=>e.output}],It=(e,t,n)=>{const o=e.location.provider.list(t),a=e.location.model.list(t);if(o?.some(i=>i.id===n.providerID))return a?.findLast(i=>i.providerID===n.providerID&&i.id===n.id&&i.status!=="deprecated")},N=(e,t,n)=>{const o=document.createElement(e);return t&&o.setAttribute("data-part",t),n!==void 0&&(o.textContent=n),o},Ue=e=>{const t=N("div","row");return t.append(...e),t},Sr=(e,t)=>{const n=t.getBoundingClientRect(),o=e.offsetWidth,a=getComputedStyle(t).direction==="rtl"?n.left:n.right-o;e.style.top=`${n.bottom+br}px`,e.style.left=`${Math.max(8,Math.min(a,innerWidth-o-8))}px`},st='[data-component="user-message"]',Ar=`${st} [data-slot="user-message-actions"]`,Xt='[data-slot="user-message-text"]',Er='[data-component="tooltip-v2-trigger"]',Ae="data-plus-copy",Ir=`
[${Ae}] {
  display: contents;
}
[${Ae}] [data-slot="icon-svg"] {
  width: 14px;
  height: 14px;
}
`,he=new Map;function _r(e){he.forEach((t,n)=>{n.isConnected||(t(),n.remove(),he.delete(n))}),document.querySelectorAll(Ar).forEach(t=>{const n=t.querySelector(`:scope > ${Er}`);if(!n||t.querySelector(`:scope > [${Ae}]`)||!t.closest(st).querySelector(Xt))return;const o=document.createElement("span");o.setAttribute(Ae,""),o.addEventListener("mousedown",a=>a.preventDefault()),he.set(o,e(o)),t.insertBefore(o,n)})}const Dr=({ui:e,label:t,copied:n,write:o})=>a=>r.render(()=>{const[i,l]=h.createSignal(!1),u=()=>i()?n:t,d=async s=>{s.stopPropagation(),await o(Mr(a.closest(st)))&&(l(!0),setTimeout(()=>l(!1),2e3))};return h.createComponent(e.Tooltip,{get value(){return u()},get children(){return h.createComponent(e.IconButton,{get icon(){return i()?"check":"outline-copy"},get label(){return u()},size:"small",onClick:d})}})},a),Mr=e=>{const t=e.querySelector(Xt).cloneNode(!0);return t.querySelectorAll('[data-slot="user-message-comments"], [data-slot="user-message-fold-toggle"]').forEach(n=>n.remove()),t.querySelectorAll("[data-session-reference]").forEach(n=>n.replaceWith(n.dataset.sessionReference)),t.textContent};function qr(){he.forEach((e,t)=>{e(),t.remove()}),he.clear()}function Ee(e){return e?e<1e3?String(e):e<1e6?`${_t(e/1e3)}k`:`${_t(e/1e6)}M`:"0"}const _t=e=>e>=100?String(Math.round(e)):e.toFixed(1).replace(/\.0$/,"");function Tr(e,t){const n=Math.max(0,Math.floor(e/1e3)),o=a=>String(a).padStart(2,"0");return n<60?t("ui.message.duration.seconds",{count:String(n)}):n<3600?t("ui.message.duration.minutesSeconds",{minutes:String(Math.floor(n/60)),seconds:o(n%60)}):t("ui.message.duration.hoursMinutes",{hours:String(Math.floor(n/3600)),minutes:o(Math.floor(n/60)%60)})}const Ie=e=>(e.tokens?.output??0)+(e.tokens?.reasoning??0);function Lr(e,t){const n=e.map(l=>l.title),o=new Map(n.map(l=>[l,[]])),a=[];for(const l of t)l.phase===void 0?a.push(l):(o.has(l.phase)||o.set(l.phase,[]),o.get(l.phase).push(l));const i=[...o].map(([l,u])=>({title:l,detail:e.find(d=>d.title===l)?.detail,agents:u}));return a.length?[...i,{title:void 0,agents:a}]:i}const Nr=(e,t)=>Number(e.id.slice(1))-Number(t.id.slice(1));function Xe(e){const t={total:e.length,done:0,running:0,queued:0,failed:0,stopped:0};for(const n of e)t[n.status]=(t[n.status]??0)+1;return{...t,finished:t.done+t.failed+t.stopped}}const at=e=>e==="pending"||e==="running"||e==="paused",z={type:"object"},J={type:"string"},be={type:"object",properties:{runID:J,sessionID:J},required:["runID"]},Dt={type:"object",properties:{runID:J,sessionID:J,agentID:J},required:["runID","agentID"]},Ke=kn.Rpc.define({id:"opencode-plus",methods:{list:{input:{type:"object",properties:{sessionID:J},required:["sessionID"]},output:z},get:{input:be,output:z},agent:{input:Dt,output:z},stop:{input:be,output:z},pause:{input:be,output:z},resume:{input:be,output:z},stopAgent:{input:Dt,output:z},save:{input:{type:"object",properties:{runID:J,sessionID:J,scope:{enum:["project","personal"]}},required:["runID","scope"]},output:z},ultracode:{input:{type:"object",properties:{sessionID:{type:"string"},on:{type:"boolean"}},required:["sessionID"]},output:z}},events:{changed:{schema:z},ultracode:{schema:z}}}),Or=60*1e3;function Pr(e,{onStart:t}){const[n,o]=$e.createStore({runs:{},sessions:{},agents:{},results:{},details:{},ultracode:{}}),a=new Set,i=s=>s.server.client.rpc(Ke),l=s=>({location:{directory:s.directory}}),u=s=>{const c=n.runs[s.id];return h.batch(()=>{o("runs",s.id,$e.reconcile(s)),n.sessions[s.sessionID]?.includes(s.id)||o("sessions",s.sessionID,(m=[])=>[s.id,...m])}),!c},d=(s,c)=>h.batch(()=>{n.agents[s]||o("agents",s,{});for(const m of c)o("agents",s,m.id,$e.reconcile(m))});return y.createKeyed(()=>e.servers.get("sidecar")?.client,s=>h.onCleanup(s.rpc(Ke).events.on("changed",c=>{const{run:m,agents:p}=c.data,g=u(m);d(m.id,p),g&&Date.now()-m.created<Or&&t(m)}))),y.createKeyed(()=>e.servers.get("sidecar")?.client,s=>h.onCleanup(s.rpc(Ke).events.on("ultracode",c=>o("ultracode",c.data.sessionID,c.data.on)))),{state:n,runs:s=>(n.sessions[s]??[]).map(c=>n.runs[c]).filter(Boolean),run:s=>n.runs[s],agents:s=>Object.values(n.agents[s]??{}).toSorted(Nr),detail:(s,c)=>n.details[`${s}/${c}`],active:s=>(n.sessions[s]??[]).map(c=>n.runs[c]).filter(c=>c&&at(c.status)),async load(s,c){if(!a.has(c)){a.add(c);try{const[{runs:m},{on:p}]=await Promise.all([i(s).list({sessionID:c},l(s)),i(s).ultracode({sessionID:c},l(s))]);h.batch(()=>{for(const g of m.toReversed())u(g);o("ultracode",c,p)})}catch{a.delete(c)}}},result:s=>n.results[s],async open(s,c){const{run:m}=await i(s).get({runID:c,sessionID:n.runs[c]?.sessionID},l(s));h.batch(()=>{d(m.id,m.agents??[]),m.result!==void 0&&o("results",m.id,m.result)})},async describe(s,c,m){const{agent:p}=await i(s).agent({runID:c,agentID:m,sessionID:n.runs[c]?.sessionID},l(s));o("details",`${c}/${m}`,p)},stop:(s,c)=>i(s).stop({runID:c},l(s)),pause:(s,c)=>i(s).pause({runID:c},l(s)),resume:(s,c)=>i(s).resume({runID:c},l(s)),stopAgent:(s,c,m)=>i(s).stopAgent({runID:c,agentID:m},l(s)),save:(s,c,m)=>i(s).save({runID:c,scope:m,sessionID:n.runs[c]?.sessionID},l(s)),ultracode:s=>n.ultracode[s]===!0,setUltracode:async(s,c,m)=>{o("ultracode",c,m),await i(s).ultracode({sessionID:c,on:m},l(s))}}}const jr=["filePath","file","command","pattern","query","url","path","description","prompt","name"];function Rr(e,t){if(!e||typeof e!="object")return"";const n=jr.find(a=>typeof e[a]=="string"&&e[a].trim()),o=n?e[n]:Object.values(e).find(a=>typeof a=="string"&&a.trim());return o?zr(Br(o,t),120):""}function Br(e,t){if(!t)return e;const n=t.endsWith("/")?t:`${t}/`;return e===t?".":e.split(n).join("")}function zr(e,t){const n=String(e).replace(/\s+/g," ").trim();return n.length>t?`${n.slice(0,t-1)}…`:n}var Wr=r.template('<svg viewBox="0 0 16 16"width=16 height=16 data-component=session-progress-indicator-v2 data-slot=spinner-dots aria-hidden=true fill=currentColor>'),Fr=r.template("<svg><rect></svg>",!1,!0,!1);const ae=5,He=2,Mt=3,qt=1.8,_e=.2,Ur=[1,.987,.934,.812,.599,.384,.238,.143,.081,.041,.017,.004,0],Ze=[...Ur.map((e,t)=>[t*4,K(.55*e)]),[100,0]],Zt="spinner-radar",{dots:Kr,shapes:Hr}=Jr();function Tt(e){return Gr(),(()=>{var t=Wr();return r.use(n=>{e.still||Vr(n)},t),r.insert(t,r.createComponent(h.For,{each:Kr,children:n=>(()=>{var o=Fr();return r.effect(a=>{var i=n.x,l=n.y,u=n.size,d=n.size,s=n.size*.24,c=n.still,m=n.steady||e.still?void 0:`${Zt}-${n.shape} calc(${qt}s * var(--spinner-time, 1)) linear calc(${-qt*(1-n.at)}s * var(--spinner-time, 1)) infinite`;return i!==a.e&&r.setAttribute(o,"x",a.e=i),l!==a.t&&r.setAttribute(o,"y",a.t=l),u!==a.a&&r.setAttribute(o,"width",a.a=u),d!==a.o&&r.setAttribute(o,"height",a.o=d),s!==a.i&&r.setAttribute(o,"rx",a.i=s),c!==a.n&&r.setStyleProperty(o,"--still",a.n=c),m!==a.s&&r.setStyleProperty(o,"animation",a.s=m),a},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0}),o})()})),r.effect(()=>r.setAttribute(t,"class",e.class)),t})()}function Gr(){if(document.getElementById("ocp-spinner-radar"))return;const e=document.createElement("style");e.id="ocp-spinner-radar",e.textContent=Hr.map((t,n)=>`@keyframes ${Zt}-${n}{${t.map(([o,a])=>`${K(o)}%{opacity:${K(_e+(1-_e)*a)};animation-timing-function:linear}`).join("")}}`).join(""),document.head.append(e)}function Vr(e){const t=new ResizeObserver(()=>e.getAnimations({subtree:!0}).forEach(n=>{n.startTime!==0&&(n.startTime=0)}));t.observe(e),h.onCleanup(()=>t.disconnect())}function Jr(){const e=Array.from({length:ae*ae},(l,u)=>{const d={gx:u%ae-(ae-1)/2,gy:Math.floor(u/ae)-(ae-1)/2};return{cell:d,at:Xr(d),steady:d.gx===0&&d.gy===0}}),t=l=>Math.max(Math.abs(l.gx),Math.abs(l.gy)),n=e.map(l=>{if(l.steady)return"";const u=e.filter(c=>c!==l&&!c.steady&&t(c.cell)===t(l.cell)),d=Math.min(...u.map(c=>xe(l.at-c.at))),s=Math.min(...u.map(c=>xe(c.at-l.at)));return`${K(d)} ${K(s)}`}),o=[...new Set(n.filter(l=>l!==""))],a=o.map(l=>{const[u,d]=l.split(" ").map(Number);return Yr(u*100,d*100)});return{dots:e.map((l,u)=>{const d=Math.max(0,o.indexOf(n[u])),s=l.steady?Ze[0][1]:Qt(a[d],xe(.22-l.at)*100);return{x:K(8+l.cell.gx*Mt-He/2),y:K(8+l.cell.gy*Mt-He/2),size:He,at:K(l.at),steady:l.steady,still:K(_e+(1-_e)*s),shape:d}}),shapes:a}}function Yr(e,t){const o=t/2+1.5,a=100-e/2;return[[0,1],[t/2,1],[o,Qt(Ze,o)],...Ze.filter(([i])=>i>o&&i<100&&i<a-1.5),[a-1.5,0],[a,1],[100,1]]}function Xr(e){return xe(Math.atan2(e.gx,-e.gy)/(2*Math.PI))}function Qt(e,t){const n=e.findIndex(([u])=>u>=t);if(n<=0)return e[0]?.[1]??0;const[o,a]=e[n-1],[i,l]=e[n];return a+(l-a)*(t-o)/(i-o||1)}function xe(e){return e-Math.floor(e)}function K(e){return Math.round(e*1e3)/1e3}var Zr=r.template('<div class="relative size-full min-w-0 overflow-hidden bg-v2-background-bg-base flex flex-col outline-none">'),Qr=r.template('<span class="min-w-0 flex-1 truncate text-[13px] font-[530] leading-4 tracking-[-0.04px] text-v2-text-text-base">'),eo=r.template('<span class="flex shrink-0 items-center gap-2 text-[13px] font-[440] leading-[var(--line-height-compact)] tracking-[-0.04px] text-v2-text-text-muted">'),to=r.template('<div class="mx-auto flex w-full max-w-[608px] flex-col gap-3 px-6 pt-6 pb-10">'),no=r.template('<div class="mx-auto flex max-w-[360px] flex-col items-center gap-4 px-6 pt-20 text-center"><div class="flex flex-col gap-2"><div class="text-[13px] font-[530] leading-[var(--line-height-compact)] text-v2-text-text-base"></div><div class="text-[13px] font-[440] leading-[var(--line-height-compact)] text-v2-text-text-muted">'),ro=r.template('<button type=button class="flex h-[41px] w-full items-center justify-between gap-4 rounded-[8px] border-[0.5px] border-v2-border-border-base bg-v2-background-bg-layer-01 px-3.5 text-start hover:bg-v2-background-bg-layer-02"><span class="flex min-w-0 items-center gap-2 text-[13px] font-[440] leading-[var(--line-height-compact)] tracking-[-0.04px]"><span class="shrink-0 text-v2-text-text-base"></span><span class="truncate text-v2-text-text-muted"></span></span><span class="text-[11px] tabular-nums whitespace-nowrap text-v2-text-text-muted">'),en=r.template('<span class="min-w-0 truncate text-[13px] font-[530] leading-4 tracking-[-0.04px] text-v2-text-text-base">'),tn=r.template('<span class="min-w-0 flex-1">'),nn=r.template('<div class="shrink-0 px-3 py-1.5 text-12-regular text-v2-state-fg-danger border-b border-v2-border-border-muted">'),oo=r.template('<button type=button class="w-fit pt-1 text-[12px] font-[440] leading-4 tracking-[-0.04px] text-v2-text-text-faint hover:text-v2-text-text-base">'),so=r.template('<div class="flex flex-col gap-1 rounded-[8px] border-[0.5px] border-v2-border-border-base bg-v2-background-bg-layer-01 px-3.5 py-2.5">'),rn=r.template('<section class="flex flex-col gap-1"><h2 class="pb-1 text-[13px] font-[440] text-v2-text-text-muted">'),ao=r.template('<div class="mx-auto flex w-full max-w-[608px] flex-col gap-4 px-6 pt-6 pb-10"><div class="flex flex-col gap-2"><div class="text-[13px] font-[440] leading-[var(--line-height-compact)] text-v2-text-text-muted">'),io=r.template('<div class="break-words text-[12px] font-[440] leading-4 tracking-[-0.04px] text-v2-text-text-muted">'),lo=r.template('<section class="flex flex-col gap-1"><h2 class="flex items-center justify-between gap-4 px-2 pb-1 text-[13px] font-[440] text-v2-text-text-muted"><span class="min-w-0 truncate"></span><span class="text-[11px] tabular-nums whitespace-nowrap text-v2-text-text-muted">'),co=r.template('<button type=button class="flex h-8 w-full shrink-0 items-center gap-2 rounded-[6px] px-2 text-start text-[13px] font-[440] hover:bg-v2-background-bg-layer-02"><span class="max-w-[45%] shrink-0 truncate text-v2-text-text-base"></span><span class="min-w-0 flex-1 truncate text-v2-text-text-muted"></span><span class="text-[11px] tabular-nums whitespace-nowrap text-v2-text-text-muted">'),uo=r.template('<div class="truncate text-[13px] font-[440] leading-[var(--line-height-compact)] text-v2-text-text-muted">'),po=r.template('<div class="mx-auto flex w-full max-w-[608px] flex-col gap-4 px-6 pt-6 pb-10"><div data-component=user-message><div data-slot=user-message-body><div data-slot=user-message-text dir=auto>'),mo=r.template("<span class=capitalize>"),fo=r.template("<div data-component=context-tool-group-list>"),ho=r.template("<div data-slot=context-tool-group-item>"),go=r.template("<span data-slot=basic-tool-tool-subtitle>"),vo=r.template("<span data-slot=basic-tool-tool-arg class=text-v2-state-fg-danger>"),wo=r.template("<div data-component=tool-trigger><div data-slot=basic-tool-tool-trigger-content><div data-slot=basic-tool-tool-info><div data-slot=basic-tool-tool-info-structured><div data-slot=basic-tool-tool-info-main><span data-slot=basic-tool-tool-title>"),on=r.template("<div data-component=text-part><div data-slot=text-part-body>"),bo=r.template("<div data-slot=permission-row><span data-slot=permission-spacer aria-hidden=true></span><div data-slot=permission-patterns>"),$o=r.template("<div data-component=dock-prompt data-kind=permission><div data-slot=permission-body><div data-slot=permission-header><div data-slot=permission-row data-variant=header><span data-slot=permission-icon></span><div data-slot=permission-header-title></div></div></div><div data-slot=permission-content><div data-slot=permission-row><span data-slot=permission-spacer aria-hidden=true></span><div data-slot=permission-hint></div></div></div></div><div data-slot=permission-footer><div></div><div data-slot=permission-footer-actions>"),yo=r.template('<code class="text-text-base break-all">'),xo=r.template('<div class="h-11 shrink-0 flex items-center gap-2 px-3 border-b-[0.5px] border-v2-border-border-muted">'),ko=r.template('<div class="min-h-0 flex-1 overflow-y-auto"data-scrollable>'),Co=r.template('<div class="flex min-w-0 flex-wrap items-center gap-1.5 text-[12px] font-[440] leading-4 tracking-[-0.04px] tabular-nums text-v2-text-text-faint">'),So=r.template("<span aria-hidden=true>·"),Ao=r.template("<span class=shrink-0>"),Eo=r.template('<span class="flex size-4 shrink-0 items-center justify-center text-v2-icon-icon-faint">'),Io=r.template('<span class="flex items-center gap-1.5">'),_o=r.template("<span data-component=text-shimmer style=--text-shimmer-swap:220ms;--text-shimmer-index:0><span data-slot=text-shimmer-char><span data-slot=text-shimmer-char-base aria-hidden=true></span><span data-slot=text-shimmer-char-shimmer aria-hidden=true>");function Do(e){const t=()=>ee(e.session),n=()=>e.nav.get(t());return y.createKeyed(t,o=>{e.model.load(e.session,o)}),(()=>{var o=Zr();return r.insert(o,r.createComponent(h.Switch,{get fallback(){return r.createComponent(Mo,r.mergeProps(e,{get sessionID(){return t()}}))},get children(){return[r.createComponent(h.Match,{get when(){return r.memo(()=>!!n().agentID)()&&e.model.run(n().runID)},get children(){return r.createComponent(No,r.mergeProps(e,{get sessionID(){return t()},get runID(){return n().runID},get agentID(){return n().agentID}}))}}),r.createComponent(h.Match,{get when(){return r.memo(()=>!!n().runID)()&&e.model.run(n().runID)},get children(){return r.createComponent(To,r.mergeProps(e,{get sessionID(){return t()},get runID(){return n().runID}}))}})]}})),o})()}function ee(e){const t=e.server.data;let n=e.id;for(let o=0;o<8;o++){const a=t.session.get(n)?.parentID;if(!a)return n;n=a}return n}function Mo(e){const t=y.usePlugin(),n=()=>e.model.runs(e.sessionID);return[r.createComponent(it,{get children(){return[(()=>{var o=Qr();return r.insert(o,()=>t.t("wf.title")),o})(),r.createComponent(t.ui.Tooltip,{get value(){return t.t("wf.ultracode.hint")},placement:"top",get children(){var o=eo();return r.insert(o,()=>t.t("wf.ultracode"),null),r.insert(o,r.createComponent(t.ui.Switch,{get label(){return t.t("wf.ultracode")},hideLabel:!0,get checked(){return e.model.ultracode(e.sessionID)},onChange:a=>{e.model.setUltracode(e.session,e.sessionID,a)}}),null),o}})]}}),r.createComponent(lt,{get children(){return r.createComponent(h.Show,{get when(){return n().length>0},get fallback(){return(()=>{var o=no(),a=o.firstChild,i=a.firstChild,l=i.nextSibling;return r.insert(o,r.createComponent(t.ui.Icon,{name:"fork",size:"large",class:"text-v2-icon-icon-muted"}),a),r.insert(i,()=>t.t("wf.empty.title")),r.insert(l,()=>t.t("wf.empty.body")),o})()},get children(){var o=to();return r.insert(o,r.createComponent(h.For,{get each(){return n()},children:a=>r.createComponent(qo,{run:a,onOpen:()=>e.nav.go(e.sessionID,{runID:a.id})})})),o}})}})]}function qo(e){const t=y.usePlugin(),n=ut(()=>at(e.run.status)),o=()=>Bo(e.run.counts??{});return(()=>{var a=ro(),i=a.firstChild,l=i.firstChild,u=l.nextSibling,d=i.nextSibling;return a.$$click=()=>e.onOpen(),r.insert(i,r.createComponent(Me,{get status(){return e.run.status}}),l),r.insert(l,()=>e.run.name),r.insert(u,()=>e.run.description),r.insert(d,r.createComponent(h.Show,{get when(){return e.run.counts?.total>0},get children(){return`${o()}/${e.run.counts.total} · `}}),null),r.insert(d,()=>qe(t,(e.run.ended??n())-(e.run.started??e.run.created)),null),a})()}function To(e){const t=y.usePlugin(),n=()=>e.model.run(e.runID),o=()=>e.model.agents(e.runID),a=()=>at(n().status),i=ut(a),l=h.createMemo(()=>Xe(o())),[u,d]=h.createSignal(!1);y.createKeyed(()=>`${e.runID}/${a()}`,()=>{e.model.open(e.session,e.runID).catch(()=>{})});const s=p=>()=>{p().catch(g=>t.toast.show({variant:"error",title:t.t("wf.error"),description:ct(g)}))},c=p=>s(async()=>{const{path:g}=await e.model.save(e.session,e.runID,p);t.toast.show({variant:"success",title:t.t("wf.saved",{name:`/${n().name}`}),description:g})}),m=()=>[{label:t.t("wf.save.project"),icon:"folder",onSelect:c("project")},{label:t.t("wf.save.personal"),icon:"download",onSelect:c("personal")},{type:"separator"},{label:t.t("wf.copy.script"),icon:"outline-copy",onSelect:()=>{t.system.copy(n().scriptPath)}},{label:t.t("wf.copy.id"),icon:"outline-copy",onSelect:()=>{t.system.copy(n().id)}},...t.desktop?[{label:t.t("wf.reveal"),icon:"folder",onSelect:()=>{t.desktop.reveal(n().scriptPath)}}]:[]];return[r.createComponent(it,{get children(){return[r.createComponent(an,{get label(){return t.t("wf.back.runs")},onClick:()=>e.nav.go(e.sessionID,{})}),(()=>{var p=en();return r.insert(p,()=>n().name),p})(),tn(),r.createComponent(h.Show,{get when(){return n().status==="running"},get children(){return r.createComponent(t.ui.Button,{variant:"ghost-muted",size:"small",get onClick(){return s(()=>e.model.pause(e.session,e.runID))},get children(){return t.t("wf.pause")}})}}),r.createComponent(h.Show,{get when(){return n().status==="paused"},get children(){return r.createComponent(t.ui.Button,{variant:"ghost-muted",size:"small",get onClick(){return s(()=>e.model.resume(e.session,e.runID))},get children(){return t.t("wf.resume")}})}}),r.createComponent(h.Show,{get when(){return n().status==="running"||n().status==="paused"},get children(){return r.createComponent(De,{icon:"stop",get label(){return t.t("wf.stop")},get onClick(){return s(()=>e.model.stop(e.session,e.runID))}})}}),r.createComponent(t.ui.Menu,{get label(){return t.t("wf.more")},icon:"outline-dots",placement:"bottom-end",get items(){return m()}})]}}),r.createComponent(h.Show,{get when(){return n().error},get children(){var p=nn();return r.insert(p,()=>n().error),p}}),r.createComponent(lt,{get children(){var p=ao(),g=p.firstChild,x=g.firstChild;return r.insert(g,r.createComponent(ln,{get parts(){return[r.createComponent(cn,{get status(){return n().status}}),qe(t,(n().ended??i())-(n().started??n().created)),l().total>0&&t.t("wf.agents",{done:l().finished,total:l().total}),l().running>0&&t.t("wf.running",{count:l().running}),l().queued>0&&t.t("wf.queued",{count:l().queued}),l().failed>0&&t.t("wf.failed",{count:l().failed}),n().spent>0&&t.t("wf.tokens",{count:Ee(n().spent)}),n().total&&t.t("wf.budget",{count:Ee(n().total)})]}}),x),r.insert(x,()=>n().description),r.insert(p,r.createComponent(h.Show,{get when(){return n().status==="pending"},get children(){return r.createComponent(Po,r.mergeProps(e,{get run(){return n()}}))}}),null),r.insert(p,r.createComponent(h.Show,{get when(){return n().logs?.length>0},get children(){var $=so();return r.insert($,r.createComponent(h.For,{get each(){return r.memo(()=>!!u())()?n().logs:n().logs.slice(-3)},children:b=>(()=>{var v=io();return r.insert(v,()=>b.message),v})()}),null),r.insert($,r.createComponent(h.Show,{get when(){return n().logs.length>3},get children(){var b=oo();return b.$$click=()=>d(!u()),r.insert(b,(()=>{var v=r.memo(()=>!!u());return()=>v()?t.t("wf.logs.less"):t.t("wf.logs.all",{count:n().logs.length})})()),b}}),null),$}}),null),r.insert(p,r.createComponent(h.For,{get each(){return r.memo(()=>n().status==="pending")()?[]:Lr(n().phases??[],o())},children:$=>r.createComponent(h.Show,{get when(){return $.agents.length>0},get children(){var b=lo(),v=b.firstChild,f=v.firstChild,C=f.nextSibling;return r.insert(f,()=>$.title??t.t("wf.phase.none")),r.insert(C,()=>`${Xe($.agents).finished}/${$.agents.length}`),r.insert(b,r.createComponent(h.For,{get each(){return $.agents},children:_=>r.createComponent(Lo,{agent:_,now:i,onOpen:()=>e.nav.go(e.sessionID,{runID:e.runID,agentID:_.id})})}),null),b}})}),null),r.insert(p,r.createComponent(h.Show,{get when(){return r.memo(()=>n().status==="completed")()&&e.model.result(e.runID)!==void 0},get children(){var $=rn(),b=$.firstChild;return r.insert(b,()=>t.t("wf.result")),r.insert($,r.createComponent(sn,{get text(){return e.model.result(e.runID)}}),null),$}}),null),p}})]}function Lo(e){const t=y.usePlugin(),n=()=>{const o=e.agent;return o.status==="queued"?t.t("wf.agent.queued"):o.error?o.error:o.status==="running"&&o.lastTool?`${un(t,o.lastTool.name)} ${o.lastTool.summary}`:o.status==="running"?t.t("session.timeline.working"):o.result?o.result:""};return(()=>{var o=co(),a=o.firstChild,i=a.nextSibling,l=i.nextSibling;return o.$$click=()=>e.onOpen(),r.insert(o,r.createComponent(Me,{get status(){return e.agent.status}}),a),r.insert(a,()=>e.agent.label),r.insert(i,n),r.insert(l,()=>[e.agent.cached&&t.t("wf.cached"),Ie(e.agent)>0&&Ee(Ie(e.agent)),e.agent.started&&qe(t,(e.agent.ended??e.now())-e.agent.started)].filter(Boolean).join(" · ")),r.effect(()=>i.classList.toggle("text-v2-state-fg-danger",e.agent.status==="failed")),o})()}function No(e){const t=y.usePlugin(),n=()=>e.model.state.agents[e.runID]?.[e.agentID],o=()=>e.model.detail(e.runID,e.agentID),a=ut(()=>n()?.status==="running");y.createKeyed(()=>`${e.runID}/${e.agentID}/${n()?.status}`,()=>{e.model.describe(e.session,e.runID,e.agentID).catch(()=>{})});const i=()=>{const d=n()?.sessionID;d&&t.tabs.open({server:e.session.server.id,id:d},{focus:!0})},l=()=>{e.model.stopAgent(e.session,e.runID,e.agentID).catch(d=>t.toast.show({variant:"error",title:t.t("wf.error"),description:ct(d)}))},u=()=>o()?.result??n()?.result;return r.createComponent(h.Show,{get when(){return n()},get children(){return[r.createComponent(it,{get children(){return[r.createComponent(an,{get label(){return t.t("wf.back.run",{name:e.model.run(e.runID)?.name})},onClick:()=>e.nav.go(e.sessionID,{runID:e.runID})}),(()=>{var d=en();return r.insert(d,()=>n().label),d})(),tn(),r.createComponent(h.Show,{get when(){return n().status==="running"||n().status==="queued"},get children(){return r.createComponent(De,{icon:"stop",get label(){return t.t("wf.agent.stop")},onClick:l})}}),r.createComponent(h.Show,{get when(){return n().sessionID},get children(){return r.createComponent(De,{icon:"square-arrow-top-right",get label(){return t.t("wf.agent.open")},onClick:i})}})]}}),r.createComponent(h.Show,{get when(){return n().error},get children(){var d=nn();return r.insert(d,()=>n().error),d}}),r.createComponent(lt,{get children(){var d=po(),s=d.firstChild,c=s.firstChild,m=c.firstChild;return r.insert(d,r.createComponent(ln,{get parts(){return[r.createComponent(cn,{get status(){return n().status}}),n().started&&qe(t,(n().ended??a())-n().started),(()=>{var p=mo();return r.insert(p,()=>n().agentType??"general"),p})(),n().model&&n().model.split("/").pop(),n().phase,Ie(n())>0&&t.t("wf.tokens",{count:Ee(Ie(n()))}),n().toolCalls>0&&t.plural("wf.tools",n().toolCalls),n().cached&&t.t("wf.cached")]}}),s),r.insert(d,r.createComponent(h.Show,{get when(){return n().directory},get children(){var p=uo();return r.insert(p,()=>n().directory),r.effect(()=>r.setAttribute(p,"title",n().directory)),p}}),s),r.insert(m,()=>o()?.prompt??n().prompt),r.insert(d,r.createComponent(h.Show,{get when(){return n().sessionID},get children(){return r.createComponent(Oo,{get session(){return e.session},get sessionID(){return n().sessionID},get directory(){return n().directory??e.session.directory}})}}),null),r.insert(d,r.createComponent(h.Show,{get when(){return u()!==void 0},get children(){var p=rn(),g=p.firstChild;return r.insert(g,()=>t.t("wf.result")),r.insert(p,r.createComponent(sn,{get text(){return u()}}),null),p}}),null),d}})]}})}function Oo(e){const t=y.usePlugin(),n=()=>e.session.server.data;y.createKeyed(()=>e.sessionID,a=>{n().session.sync(a).catch(()=>{}),n().session.message.sync(a).catch(()=>{})});const o=h.createMemo(()=>n().session.message.list(e.sessionID).flatMap(a=>a.type!=="assistant"?[]:a.content.flatMap((i,l)=>i.type==="tool"?[{key:i.id,kind:"tool",title:un(t,i.name),running:i.state.status==="running"||i.state.status==="streaming",subtitle:Rr(i.state.input,e.directory),error:i.state.status==="error"?i.state.error?.message:void 0}]:i.type==="text"&&i.text.trim()?[{key:`${a.id}:${l}`,kind:"text",text:i.text}]:[])));return r.createComponent(h.Show,{get when(){return o().length>0},get children(){var a=fo();return r.insert(a,r.createComponent(h.For,{get each(){return o()},children:i=>(()=>{var l=ho();return r.insert(l,(()=>{var u=r.memo(()=>i.kind==="tool");return()=>u()?(()=>{var d=wo(),s=d.firstChild,c=s.firstChild,m=c.firstChild,p=m.firstChild,g=p.firstChild;return r.insert(g,r.createComponent(Ro,{get text(){return i.title},get active(){return i.running}})),r.insert(p,r.createComponent(h.Show,{get when(){return i.subtitle},get children(){var x=go();return r.insert(x,()=>i.subtitle),x}}),null),r.insert(p,r.createComponent(h.Show,{get when(){return i.error},get children(){var x=vo();return r.insert(x,()=>i.error),x}}),null),d})():(()=>{var d=on(),s=d.firstChild;return r.insert(s,r.createComponent(t.ui.Markdown,{get text(){return i.text}})),d})()})()),l})()})),a}})}function Po(e){const t=y.usePlugin(),n=()=>e.session.server.data,[o,a]=h.createSignal(!1);y.createKeyed(()=>e.run.sessionID,u=>{n().session.permission.sync(u).catch(()=>{})});const i=()=>(n().session.permission.list(e.run.sessionID)??[]).find(u=>u.source?.id===e.run.toolCall||u.action==="workflow"&&u.resources[0]===e.run.name),l=u=>{const d=i();d&&(a(!0),n().session.permission.reply({sessionID:d.sessionID,requestID:d.id,decision:u}).catch(s=>t.toast.show({variant:"error",title:t.t("wf.error"),description:ct(s)})).finally(()=>a(!1)))};return(()=>{var u=$o(),d=u.firstChild,s=d.firstChild,c=s.firstChild,m=c.firstChild,p=m.nextSibling,g=s.nextSibling,x=g.firstChild,$=x.firstChild,b=$.nextSibling,v=d.nextSibling,f=v.firstChild,C=f.nextSibling;return r.insert(m,r.createComponent(t.ui.Icon,{name:"warning"})),r.insert(p,()=>t.t("wf.approve.title")),r.insert(b,()=>t.t("wf.approve.note")),r.insert(g,r.createComponent(h.Show,{get when(){return e.run.phases?.length>0},get children(){var _=bo(),E=_.firstChild,R=E.nextSibling;return r.insert(R,r.createComponent(h.For,{get each(){return e.run.phases},children:M=>(()=>{var B=yo();return r.insert(B,(()=>{var G=r.memo(()=>!!M.detail);return()=>G()?`${M.title}: ${M.detail}`:M.title})()),B})()})),_}}),null),r.insert(C,r.createComponent(t.ui.Button,{variant:"ghost",get disabled(){return o()||!i()},onClick:()=>l("reject"),get children(){return t.t("ui.permission.deny")}}),null),r.insert(C,r.createComponent(t.ui.Button,{variant:"neutral",get disabled(){return o()||!i()},onClick:()=>l("always"),get children(){return t.t("ui.permission.allowAlways")}}),null),r.insert(C,r.createComponent(t.ui.Button,{variant:"submit",get disabled(){return o()||!i()},onClick:()=>l("once"),get children(){return t.t("ui.permission.allowOnce")}}),null),u})()}function sn(e){const t=y.usePlugin(),n=h.createMemo(()=>{try{return{value:JSON.parse(e.text)}}catch{return{value:e.text}}});return r.createComponent(h.Show,{get when(){return typeof n().value=="string"},get fallback(){return r.createComponent(t.ui.Code,{get content(){return JSON.stringify(n().value,null,2)},language:"json"})},get children(){var o=on(),a=o.firstChild;return r.insert(a,r.createComponent(t.ui.Markdown,{get text(){return n().value}})),o}})}function it(e){return(()=>{var t=xo();return r.insert(t,()=>e.children),t})()}function lt(e){return(()=>{var t=ko();return r.insert(t,()=>e.children),t})()}function an(e){return r.createComponent(De,{icon:"outline-arrow-left",get label(){return e.label},get onClick(){return e.onClick}})}function De(e){const t=y.usePlugin();return r.createComponent(t.ui.Tooltip,{get value(){return e.label},placement:"top",get children(){return r.createComponent(t.ui.IconButton,{variant:"ghost-muted",size:"large",get icon(){return e.icon},get label(){return e.label},get onClick(){return e.onClick}})}})}function ln(e){const t=()=>e.parts.filter(Boolean);return(()=>{var n=Co();return r.insert(n,r.createComponent(h.For,{get each(){return t()},children:(o,a)=>[r.createComponent(h.Show,{get when(){return a()>0},get children(){return So()}}),(()=>{var i=Ao();return r.insert(i,o),i})()]})),n})()}function Me(e){const t=y.usePlugin();return(()=>{var n=Eo();return r.insert(n,r.createComponent(h.Switch,{get fallback(){return r.createComponent(Tt,{still:!0})},get children(){return[r.createComponent(h.Match,{get when(){return e.status==="running"},get children(){return r.createComponent(Tt,{})}}),r.createComponent(h.Match,{get when(){return e.status==="done"||e.status==="completed"},get children(){return r.createComponent(t.ui.Icon,{name:"check",size:"small"})}}),r.createComponent(h.Match,{get when(){return e.status==="failed"},get children(){return r.createComponent(t.ui.Icon,{name:"circle-xmark",size:"small",class:"text-v2-state-fg-danger"})}}),r.createComponent(h.Match,{get when(){return e.status==="stopped"},get children(){return r.createComponent(t.ui.Icon,{name:"outline-xmark",size:"small"})}}),r.createComponent(h.Match,{get when(){return e.status==="denied"},get children(){return r.createComponent(t.ui.Icon,{name:"circle-ban-sign",size:"small"})}}),r.createComponent(h.Match,{get when(){return e.status==="pending"},get children(){return r.createComponent(t.ui.Icon,{name:"warning",size:"small"})}})]}})),n})()}function cn(e){const t=y.usePlugin();return(()=>{var n=Io();return r.insert(n,r.createComponent(Me,{get status(){return e.status}}),null),r.insert(n,()=>jo(t,e.status),null),n})()}function jo(e,t){switch(t){case"running":return e.t("session.child.status.running");case"done":case"completed":return e.t("session.child.status.succeeded");case"failed":return e.t("session.child.status.failed");case"stopped":return e.t("session.child.status.interrupted");default:return e.t(`wf.status.${t}`)}}const Lt={read:"ui.tool.read",list:"ui.tool.list",glob:"ui.tool.glob",grep:"ui.tool.grep",webfetch:"ui.tool.webfetch",websearch:"ui.tool.websearch",shell:"ui.tool.shell",skill:"ui.tool.skill",execute:"ui.tool.execute",edit:"ui.messagePart.title.edit",write:"ui.messagePart.title.write",patch:"ui.tool.patch"};function un(e,t){return t==="workflow_output"?e.t("wf.output"):Lt[t]?e.t(Lt[t]):e.t("ui.basicTool.called",{tool:t})}function Ro(e){return(()=>{var t=_o(),n=t.firstChild,o=n.firstChild,a=o.nextSibling;return r.insert(o,()=>e.text),r.insert(a,()=>e.text),r.effect(i=>{var l=e.active?"true":"false",u=e.text,d=e.active?"true":"false";return l!==i.e&&r.setAttribute(t,"data-active",i.e=l),u!==i.t&&r.setAttribute(t,"aria-label",i.t=u),d!==i.a&&r.setAttribute(a,"data-run",i.a=d),i},{e:void 0,t:void 0,a:void 0}),t})()}const qe=(e,t)=>Tr(t,(n,o)=>e.t(n,o)),Bo=e=>(e.done??0)+(e.failed??0)+(e.stopped??0),ct=e=>e?.message??String(e);function ut(e){const[t,n]=h.createSignal(Date.now()),o=setInterval(()=>{e()&&n(Date.now())},1e3);return h.onCleanup(()=>clearInterval(o)),t}r.delegateEvents(["click"]);var zo=r.template('<div class="flex min-w-0 items-center gap-1.5"><span class=truncate>');const ie="workflows";function Wo(e){const t=`${e.id}:${ie}`,[n,o]=$e.createStore({}),a={get:s=>n[s]??{},go:(s,c)=>o(s,{runID:void 0,agentID:void 0,...c})},i=Pr(e,{onStart:s=>{const c=e.sessions.current();!c||ee(c)!==s.sessionID||(a.go(s.sessionID,{runID:s.id}),e.layout.open(t,c,{tab:"select",background:!0}))}}),l=s=>{const c=e.sessions.current();c&&(s&&a.go(ee(c),s),e.layout.open(t,c,{tab:"select"}))},u=s=>i.active(ee(s)),d={id:ie,get title(){return e.t("wf.title")},closable:"hover",label:s=>{const c=()=>u(s.session);return(()=>{var m=zo(),p=m.firstChild;return r.insert(m,r.createComponent(e.ui.Icon,{name:"fork",class:"shrink-0"}),p),r.insert(p,()=>e.t("wf.title")),r.insert(m,(()=>{var g=r.memo(()=>c().length>0);return()=>g()&&r.createComponent(Me,{status:"running"})})(),null),m})()}};e.add(y.Panel,{id:ie,region:"side",mobile:{get title(){return e.t("wf.title")},order:46,kind:"menu",icon:"fork"},list:s=>s.open.includes(ie)?[d]:[],render:s=>r.createComponent(Do,{get session(){return s.session},model:i,nav:a})}),e.add(y.MenuItem,()=>{const s=e.sessions.current(),c=s?u(s).length:0;return{menu:"session.panel",id:ie,title:e.t("wf.title"),icon:"fork",keybind:`${e.id}.workflows`,order:40,...c>0&&{description:e.t("wf.running",{count:c})},opened:!!s&&e.layout.state(t,s)!=="closed",run:()=>l()}}),e.add(y.ComposerPill,{id:ie,order:10,show:s=>{const c=ee(s.session),m=i.active(c),p=i.ultracode(c);if(m.length===0&&!p)return;const g=m.map($=>{const b=Xe(Object.values(i.state.agents[$.id]??{})),v=Math.max(b.total,$.counts?.total??0),f=Math.max(b.finished,($.counts?.done??0)+($.counts?.failed??0)+($.counts?.stopped??0));return{id:$.id,label:$.name,icon:"fork",tone:$.status==="pending"?"warning":$.counts?.failed?"danger":void 0,detail:$.status==="pending"||$.status==="paused"?e.t(`wf.status.${$.status}`):e.t("wf.agents",{done:f,total:v}),run:()=>l({runID:$.id})}});return p&&g.push({id:"ultracode",label:e.t("wf.ultracode.off"),icon:"close-small",run:()=>{i.setUltracode(s.session,c,!1)}}),{icon:"fork",label:m.length===1?`${m[0].name} · ${g[0].detail}`:m.length>1?e.t("wf.pill.many",{count:m.length}):e.t("wf.ultracode"),title:e.t("wf.title"),tone:m.some($=>$.status==="pending")?"warning":void 0,rows:g}}}),e.add(y.Command,()=>({id:"workflows",title:e.t("wf.command.show"),keywords:"workflow workflows ultracode agents runs fan out orchestration",enabled:!!e.sessions.current(),run:()=>{const s=e.sessions.current();s&&e.layout.toggle(t,s)}})),e.add(y.Command,()=>{const s=e.sessions.current(),c=!!s&&i.ultracode(ee(s));return{id:"ultracode",title:e.t(c?"wf.command.ultracode.off":"wf.command.ultracode.on"),keywords:"ultracode workflow workflows effort orchestration agents",enabled:!!s,run:()=>{s&&i.setUltracode(s,ee(s),!c)}}})}const Fo={"wf.title":"Workflows","wf.ultracode":"Ultracode","wf.ultracode.hint":"Run each substantive task as a workflow","wf.ultracode.off":"Turn off ultracode","wf.empty.title":"No workflows in this session","wf.empty.body":"Ask for one in your own words, or put the keyword ultracode in a prompt. Agents of each run show here while they work.","wf.status.pending":"Waiting for approval","wf.status.paused":"Paused","wf.status.denied":"Denied","wf.status.queued":"Queued","wf.agents":"{{done}} of {{total}} agents","wf.running":"{{count}} running","wf.queued":"{{count}} queued","wf.failed":"{{count}} failed","wf.tokens":"{{count}} tokens","wf.budget":"budget {{count}}","wf.tools.one":"{{count}} tool call","wf.tools.other":"{{count}} tool calls","wf.cached":"cached","wf.back.runs":"All workflows","wf.back.run":"Back to {{name}}","wf.pause":"Pause","wf.resume":"Resume","wf.stop":"Stop","wf.more":"More actions","wf.save.project":"Save as a command for this project","wf.save.personal":"Save as a command for me","wf.saved":"Saved as {{name}}","wf.copy.script":"Copy the script path","wf.copy.id":"Copy the run ID","wf.reveal":"Show the script in the file manager","wf.error":"The workflow action did not complete","wf.logs.all":"Show all {{count}} messages","wf.logs.less":"Show fewer messages","wf.phase.none":"Other agents","wf.result":"Result","wf.output":"Returned output","wf.agent.queued":"Waits for a free slot","wf.agent.open":"Open session","wf.agent.stop":"Stop agent","wf.approve.title":"Run this workflow?","wf.approve.note":"A workflow can start many agents, and it can use far more tokens than a normal turn. Its agents use your permission rules.","wf.pill.many":"{{count}} workflows","wf.command.show":"Show workflows","wf.command.ultracode.on":"Turn on ultracode for this session","wf.command.ultracode.off":"Turn off ultracode for this session"},Qe=60*1e3,Uo=60*Qe,Nt="tab.new",Ge="sidecar";function Ko(e){const t=Jt(e.options),{shelf:n,groups:o,working:a}=e.stores,i=(w,k)=>S=>r.insert(S,()=>h.createComponent(e.ui.Icon,{name:w,...k})),l=()=>{const w=e.sessions.current();try{const k=w?.server.data.session;return!!w&&(k.status(w.id)==="running"||k.pending.list(w.id).some(S=>S.type!=="synthetic"))}catch{return!1}},u=()=>n.update(w=>{w.archivedOpen=!w.archivedOpen}),d=async w=>(await e.client.project.list()).filter(S=>(S.name||S.canonical.split("/").pop())===w).toSorted((S,I)=>I.time.active-S.time.active)[0],s=async w=>{const k=await d(w);if(!k)return e.layout.project(Ge,e.t("session.new"));e.layout.draft({server:Ge,directory:k.canonical,prompt:""})},c=w=>Xn({name:w,label:e.t("session.newIn",{project:w}),icon:i("plus",{size:"small"}),onSelect:()=>{s(w).catch(()=>e.toast.show({title:e.t("session.failed",{project:w})}))}}),m=async(w,k)=>{const S={directory:w};let{data:I}=await e.client.shell.create({location:S,command:k,timeout:Qe});try{for(;I.status==="running";)await new Promise(oe=>setTimeout(oe,100)),I=(await e.client.shell.get({id:I.id,location:S})).data;const{data:j}=await e.client.shell.output({id:I.id,location:S});return{ok:I.exit===0,output:j.output}}finally{e.client.shell.remove({id:I.id,location:S}).catch(()=>{})}},p=async(w,k)=>{try{const S=await d(w),I=S&&await m(S.canonical,rr(k));return I?.ok?or(I.output):void 0}finally{M()}},g=async w=>{const k=await Ln(w,()=>e.client.project.list()),S=k&&await m(k,Dn);return S?.ok?{directory:k,...Nn(S.output)}:void 0},x=async(w,k,S)=>{const I=j=>e.toast.show({variant:"error",title:S,description:j.trim()});try{const j=await m(w,On(...k));if(!j.ok)return I(j.output);const oe=e.servers.get(Ge)?.data;oe?.location.vcs.invalidate({directory:w}),await oe?.location.vcs.sync({directory:w})}catch(j){I(String(j?.message??j))}},$=(w,k)=>h.createRoot(S=>{const[I,j]=h.createSignal(),[oe,dt]=h.createSignal(!1);let Te=!1,Le;const ue=()=>{Te||(Te=!0,Le=je(k),g(k).catch(()=>{}).then(D=>{if(Te=!1,je(k)!==Le)return pt();j(D??null)}))},pt=()=>{je(k)!==Le&&(j(void 0),ue())},mt=async(D,Y)=>{dt(!0),await x(I().directory,D,Y),dt(!1),ue()},hn=D=>{D!==I().current&&mt([D],e.t("branch.failed",{branch:D}))},gn=async()=>{const D=I().current,se=(await e.dialogs.prompt({title:e.t("branch.create"),description:D&&e.t("branch.from",{branch:D}),placeholder:e.t("branch.name"),submit:e.t("branch.submit")}))?.trim().replace(/\s+/g,"-");se&&await mt(["-c",se],e.t("branch.uncreated",{branch:se}))},ft=(D,Y=D)=>({label:Y,onSelect:()=>hn(D)}),vn=()=>{const D=I();if(D===void 0)return[{label:e.t("branch.loading"),disabled:!0}];if(D===null)return[{label:e.t("branch.unlisted"),disabled:!0}];const Y=[{label:e.t("branch.new"),icon:"plus",onSelect:()=>{gn()}},{type:"separator"}],se=D.local.map(Ne=>ft(Ne));if(D.remote.length===0)return[...Y,...se];const wn=D.remote.map(({name:Ne,ref:$n})=>ft(Ne,$n)),bn={type:"group",label:e.t("branch.remote"),items:wn};return[...Y,...se,{type:"separator"},bn]};return h.createEffect(()=>qn(k,I()?.current)),w.addEventListener("pointerenter",ue),w.addEventListener("focusin",ue),G.observe(k,{subtree:!0,characterData:!0}),r.insert(w,()=>h.createComponent(e.ui.Menu,{label:e.t("branch.switch"),trigger:"button",placement:"bottom-start",get disabled(){return oe()},get items(){return vn()}})),ue(),{update:pt,dispose:S}}),b=Dr({ui:e.ui,label:e.t("message.copy"),copied:e.t("message.copied"),write:w=>e.system.copy(w).then(()=>!0,()=>(e.toast.show({title:e.t("message.copyFailed")}),!1))}),v=e.use(yn.Browser),f=w=>{const k=v(),S=e.sessions.current();return k.status!=="active"||!S||!k.value.canOpen(S)?!1:(k.value.open(S,w),!0)},C=()=>{Vn(n.value.archivedOpen),Gt(o.value.enabled,a.value.inline),Yn(c),sr({lookup:p,open:w=>e.system.openExternal(w),label:({number:w,state:k,title:S})=>e.t("pr.label",{number:w,state:e.t(`pr.${k}`),title:S})}),Mn($),Tn(),Rn(t.hideAgent),Bn(G),_r(b),dr(t.responseLabel),mr(),pr(l()),fr()&&!E&&(E=setTimeout(()=>{E=0,M()},300))};let _=0,E=0,R=!1;const M=()=>{_||R||(_=requestAnimationFrame(()=>{_=0,C()}))},B=new MutationObserver(M);B.observe(document.body,{childList:!0,subtree:!0});const G=new MutationObserver(M),dn=setInterval(M,Qe);document.addEventListener("scrollend",M,!0);const pn=Jn(u),mn=yr(w=>h.createRoot(k=>(r.insert(w,()=>{const S=e.sessions.current();return S?kr(xr(S),e.t,e.locale.locale()):[]}),k))),fn=Kn(f);return y.createKeyed(()=>`${n.value.archivedOpen}:${o.value.enabled}:${a.value.inline}:${l()}`,C),t.workflows&&Wo(e),e.add(y.Style,Gn),e.add(y.Style,nr),e.add(y.Style,_n),e.add(y.Style,jn(t)),e.add(y.Style,ur(t.responseLabel)),e.add(y.Style,$r),e.add(y.Style,Ir),e.add(y.Slot,{at:"session.location.menu",order:100,render:w=>Hn({label:e.t("session.new"),icon:i("edit",{class:"shrink-0 text-v2-icon-icon-muted"}),shortcut:e.keybinds.keybind(Nt).join(""),onSelect:()=>{e.commands.run(Nt)||e.layout.draft({server:w.session.server.id,directory:w.session.directory,prompt:""})}})}),e.add(y.Command,()=>({id:"toggle-archived",title:e.t(n.value.archivedOpen?"archived.hide":"archived.show"),keywords:"archive archived settled sessions sidebar inbox",run:u})),e.add(y.Command,()=>({id:"toggle-groups",title:e.t(o.value.enabled?"groups.off":"groups.on"),keywords:"group project projects folders sessions sidebar inbox",run:()=>o.update(w=>{w.enabled=!w.enabled})})),e.add(y.Command,()=>({id:"toggle-working",title:e.t(a.value.inline?"working.section":"working.inline"),keywords:"working running busy section shelf sessions sidebar inbox",run:()=>a.update(w=>{w.inline=!w.inline})})),()=>{R=!0,B.disconnect(),G.disconnect(),cancelAnimationFrame(_),clearTimeout(E),clearInterval(dn),document.removeEventListener("scrollend",M,!0),pn(),mn(),fn(),Zn(),ir(),Pn(),zn(),hr(),qr()}}function Ho(e){const{archiveAfterHours:t}=Jt(e.options);if(e.onCleanup(Fn(e,{app:Oe.app,safeStorage:Oe.safeStorage,webContents:Oe.webContents})),t>0)return Sn(e,t*Uo)}const Go=y.Plugin.define({stores:{shelf:y.Store.global(Z.Schema.Struct({archivedOpen:Z.Schema.Boolean}),{archivedOpen:!1}),groups:y.Store.global(Z.Schema.Struct({enabled:Z.Schema.Boolean}),{enabled:!0}),working:y.Store.global(Z.Schema.Struct({inline:Z.Schema.Boolean}),{inline:!0})},i18n:{en:{"archived.show":"Show archived sessions","archived.hide":"Hide archived sessions","groups.on":"Group sessions by project","groups.off":"Stop grouping sessions by project","working.inline":"Show working sessions in the list","working.section":"Show working sessions in their own section","session.new":"New session","session.newIn":"New session in {{project}}","session.failed":"Could not start a session in {{project}}","usage.window":"Context window","usage.cacheRead":"Cache read","usage.cacheWrite":"Cache write","usage.input":"Input","usage.reasoning":"Reasoning","usage.output":"Output","usage.cost":"Cost","branch.switch":"Switch branch","branch.loading":"Loading…","branch.unlisted":"Could not list the branches","branch.remote":"Remote","branch.failed":"Could not switch to {{branch}}","branch.new":"New branch…","branch.create":"Create branch","branch.from":"The new branch starts from {{branch}}, with your changes.","branch.name":"Branch name","branch.submit":"Create","branch.uncreated":"Could not create {{branch}}","pr.label":"PR #{{number}}, {{state}}: {{title}}","pr.open":"open","pr.draft":"draft","pr.merged":"merged","pr.closed":"closed","message.copy":"Copy message","message.copied":"Copied","message.copyFailed":"Could not copy the message",...Fo}},setup:Ko,main:Ho});exports.default=Go;
