"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const y=require("@opencode/plugin/gui"),hn=require("@opencode/plugin/gui/browser"),X=require("effect"),Le=require("electron"),h=require("solid-js"),r=require("solid-js/web"),gn=require("@opencode/client/solid"),we=require("solid-js/store"),vn=require("@opencode/plugin/rpc"),be=60*1e3,Oe=200,ut=["session.inbox.enqueued","session.execution.started","session.unarchived"],dt=Symbol.for("opencode-plus.archive");function wn(e,t,n,o){const{created:a,updated:i,busy:l,idle:u,archived:d}=e.time;if(d!==void 0||e.parentID||l!==void 0&&(u===void 0||l>u))return!1;const s=Math.max(a,l??0,u??0);return(Number(e.metadata?.[o])||0)>=s||t-i<2*be?!1:t-s>=n}function bn(e,t){const n=`${e.id}.keptAt`,o=Date.now(),a=new AbortController,i=a.signal,l=b=>e.log.write("error",`${e.id}: ${b?.stack??b}`),u=async()=>{const b=[];let v=await e.client.session.list({parentID:null,archived:!1,limit:Oe});for(;;){if(b.push(...v.data),v.data.length<Oe||!v.cursor.next)return b;v=await e.client.session.list({cursor:v.cursor.next,limit:Oe})}};let d=!1;const s=async()=>{if(!d){d=!0;try{const b=Date.now(),v=(await u()).filter(f=>wn(f,b,t,n));for(const f of v)await e.client.session.update({sessionID:f.id,archived:!0}),e.log.write("info",`${e.id}: archived ${f.id} "${f.title??""}"`)}finally{d=!1}}},c=async b=>{if(!ut.includes(b.type)||b.created<o-be||b.type==="session.inbox.enqueued"&&b.data.item.type!=="user")return;const v=await e.client.session.get({sessionID:b.data.sessionID}),f=v.time.archived;if(b.type!=="session.unarchived"){if(f===void 0||b.created<=f)return;await e.client.session.update({sessionID:v.id,archived:!1}),e.log.write("info",`${e.id}: unarchived ${v.id} on ${b.type}`);return}f!==void 0||(Number(v.metadata?.[n])||0)>=b.created||await e.client.session.update({sessionID:v.id,metadata:{...v.metadata,[n]:b.created}})},m=async()=>{for(;!i.aborted;){try{const b=e.client.event.subscribe({types:ut},{signal:i});for await(const v of b)c(v).catch(l)}catch(b){i.aborted||l(b)}i.aborted||await new Promise(b=>setTimeout(b,5e3))}},p=()=>{s().catch(l)},g=setTimeout(p,be),x=setInterval(p,10*be),$=()=>{i.aborted||(clearTimeout(g),clearInterval(x),a.abort())};return globalThis[dt]?.(),globalThis[dt]=$,e.signal.addEventListener("abort",$,{once:!0}),m(),$}const L=(e,t,n)=>{e.getAttribute(t)!==n&&e.setAttribute(t,n)},te=(e,t,n)=>n===void 0?e.removeAttribute(t):L(e,t,n),Mt='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5L8 9.5L11.5 6.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',Tt='[data-slot="new-session-composer"]',$n='[data-slot="new-session-location-path"]',yn=["branch","new-branch"].map(e=>`${Tt} use[href="#opencode-v2-icon-${e}"]`).join(", "),ne="data-plus-branch",fe="data-plus-branch-trigger",ce="data-plus-branch-menu",qt="data-plus-branch-current",xn='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M3.53564 8.17857L6.39279 11.75L12.4642 4.25" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',kn=`
[${ne}] {
  position: relative;
  border-radius: var(--radius-sm);
}
[${ne}]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline: -2px -4px;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(Mt)}") center / 16px no-repeat;
}
[${ne}]:is(:hover, :has(:focus-visible), :has([data-expanded])) {
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${fe}] {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
[${fe}] > button {
  width: 100%;
  height: 100%;
  opacity: 0;
}
[${ce}] {
  width: max-content;
  max-width: min(320px, 100vw - 32px);
  max-height: min(320px, var(--kb-popper-content-available-height, 320px));
  overflow-y: auto;
}
[${ce}] [data-slot="menu-v2-item-content"] {
  flex: 0 1 auto;
  min-width: 0;
}
[${ce}] [data-component="menu-v2-item"]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
}
[${ce}] [${qt}]::after {
  background-color: var(--menu-v2-icon);
  mask: url("data:image/svg+xml,${encodeURIComponent(xn)}") center / 14px no-repeat;
}
`,Cn="git branch --all --no-color --no-column --sort=-committerdate",ie=new Map;function Sn(e){ie.forEach((t,n)=>{n.isConnected||(t(),ie.delete(n))}),document.querySelectorAll(yn).forEach(t=>{const n=t.closest("svg").parentElement;if(ie.has(n))return;const o=document.createElement("div");o.setAttribute(fe,""),n.setAttribute(ne,""),n.append(o),ie.set(n,e(o,n))})}function An(){document.querySelectorAll(`[${fe}] > [aria-controls]`).forEach(e=>{const t=document.getElementById(e.getAttribute("aria-controls"));if(!t)return;const n=e.closest(`[${ne}]`).querySelector(":scope > span").textContent.trim();L(t,ce,""),t.querySelectorAll('[data-component="menu-v2-item"]').forEach(o=>{const a=o.querySelector('[data-slot="menu-v2-item-content"] > span');te(o,qt,o.textContent.trim()===n?"":void 0),a&&te(o,"title",a.scrollWidth>a.clientWidth?a.textContent:void 0)})})}async function En(e,t){const n=e.closest(Tt)?.querySelector($n)?.textContent??"";if(!n.includes("…"))return n||void 0;const[o,a]=n.split("…");return(await t()).flatMap(i=>[i.canonical,...i.sandboxes]).find(i=>i.startsWith(o)&&i.endsWith(a))}function In(e){const t=new Set,n=[],o=new Map;let a;for(const l of e.split(/\r?\n/)){const u=l.slice(2).trim();if(!(!u||u.startsWith("(")||u.includes(" -> "))){if(u.startsWith("remotes/")){const d=u.slice(8),s=d.slice(d.indexOf("/")+1);o.has(s)||o.set(s,d);continue}t.add(u),l.startsWith("*")&&(a=u),l.startsWith("+")||n.push(u)}}const i=Array.from(o,([l,u])=>({name:l,ref:u})).filter(({name:l})=>!t.has(l));return{current:a,local:n,remote:i}}const _n=(...e)=>["git","switch",...e.map(Lt)].join(" "),Lt=e=>/^[\w./-]+$/.test(e)?e:`'${e.replaceAll("'","'\\''")}'`;function Dn(){ie.forEach(e=>e()),ie.clear(),document.querySelectorAll(`[${fe}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${ne}]`).forEach(e=>e.removeAttribute(ne))}const Ot='[data-slot="composer-controls"]',Nt=`${Ot} > div > [data-component="tooltip-v2-trigger"]`,Pt='[data-action="composer-model"]',jt=`${Nt}:has(~ [data-component="tooltip-v2-trigger"] ${Pt})`,Rt=`${Nt}:has(${Pt}) ~ [data-component="tooltip-v2-trigger"]`,ye="data-plus-hidden-agent",xe="data-plus-variant-menu";function Mn({lowercaseVariants:e}){return`
${jt}[${ye}] {
  display: none;
}
${e?`${Rt} .capitalize,
[${xe}] .capitalize {
  text-transform: lowercase;
}`:""}
`}function Tn(e){document.querySelectorAll(jt).forEach(t=>{const n=e!==!1&&t.textContent.trim().toLowerCase()===e.toLowerCase();te(t,ye,n?"":void 0)}),document.querySelectorAll(`${Rt} [aria-controls]`).forEach(t=>{const n=document.getElementById(t.getAttribute("aria-controls"));n&&L(n,xe,"")})}const pt=new WeakSet;function qn(e){document.querySelectorAll(Ot).forEach(t=>{pt.has(t)||(pt.add(t),e.observe(t,{subtree:!0,characterData:!0}))})}function Ln(){document.querySelectorAll(`[${ye}]`).forEach(e=>e.removeAttribute(ye)),document.querySelectorAll(`[${xe}]`).forEach(e=>e.removeAttribute(xe))}const On="browser.cookies",mt=1e3,ft=Symbol.for("opencode-plus.cookies");function Nn(e,{app:t,safeStorage:n,webContents:o}){globalThis[ft]?.();const a=v=>e.log.write("warn",`${e.id}: ${v?.stack??v}`),i=n.isEncryptionAvailable()?e.storage.store(On,{schema:X.Schema.String,initial:""}):void 0,l=()=>{if(!i?.value)return[];try{const v=Date.now()/mt;return JSON.parse(n.decryptString(Buffer.from(i.value,"base64"))).filter(k=>k.expirationDate===void 0||k.expirationDate>v)}catch(v){return a(v),[]}},u=new Map(l().map(v=>[Ne(v),v]));let d;const s=()=>{clearTimeout(d),d=void 0,i.set(n.encryptString(JSON.stringify([...u.values()])).toString("base64"))},c=()=>{i&&(d??=setTimeout(s,mt))},m=new Map,p=(v,f,k)=>{const I=Ne(f),E=v.sent.get(I)??[];E.push(k),v.sent.set(I,E),v.session.cookies.set(k?ht(f):{...ht(f),expirationDate:1}).catch(M=>{const R=E.indexOf(k);R>=0&&E.splice(R,1),a(M)})},g=(v,f,k,I)=>{if(I&&k==="overwrite")return;const E=Ne(f),j=I?"":JSON.stringify(f),M=v.sent.get(E)??[],R=M.indexOf(j);if(R>=0){M.splice(0,R+1),M.length===0&&v.sent.delete(E);return}if(j!==(u.has(E)?JSON.stringify(u.get(E)):"")){I?u.delete(E):u.set(E,f);for(const V of m.values())V!==v&&p(V,f,j);c()}},x=v=>{if(v.isPersistent()||m.has(v))return;const f={session:v,sent:new Map,listener:(k,I,E,j)=>g(f,Pn(I),E,j)};m.set(v,f),v.cookies.on("changed",f.listener);for(const k of u.values())p(f,k,JSON.stringify(k))};t.on("session-created",x);const $=(v,f)=>x(f.session);t.on("web-contents-created",$);for(const v of o.getAllWebContents())x(v.session);const b=()=>{t.off("session-created",x),t.off("web-contents-created",$);for(const v of m.values())v.session.cookies.off("changed",v.listener);m.clear(),d&&s()};return globalThis[ft]=b,b}function Pn({name:e,value:t,domain:n,path:o,secure:a,httpOnly:i,sameSite:l,expirationDate:u}){return{name:e,value:t,domain:n,path:o,secure:a,httpOnly:i,sameSite:l,...u!==void 0&&{expirationDate:u}}}function Ne({domain:e,path:t,name:n}){return[e,t,n].join("	")}function ht({domain:e,...t}){const n=e.replace(/^\./,"");return{...t,url:`${t.secure?"https":"http"}://${n}${t.path}`,...e!==n&&{domain:e}}}function jn(e){const t=n=>{if(n.defaultPrevented||n.metaKey||n.ctrlKey||n.shiftKey||n.altKey)return;const o=n.target instanceof Element?n.target.closest("a[href]"):null;!(o instanceof HTMLAnchorElement)||!/^https?:$/.test(o.protocol)||o.closest('[role="dialog"]')||e(o.href)&&n.preventDefault()};return document.addEventListener("click",t),()=>document.removeEventListener("click",t)}function Rn({label:e,icon:t,shortcut:n,onSelect:o}){const a=document.createElement("hr");a.setAttribute("data-slot","menu-v2-separator");const i=document.createElement("div");i.setAttribute("role","menuitem"),i.setAttribute("data-component","menu-v2-item");const l=document.createElement("span");if(l.setAttribute("data-slot","menu-v2-item-content"),t(l),l.append(e),i.append(l),n){const u=document.createElement("span");u.setAttribute("data-slot","menu-v2-item-shortcut"),u.textContent=n,i.append(u)}return i.addEventListener("pointerenter",()=>i.setAttribute("data-highlighted","")),i.addEventListener("pointerleave",()=>i.removeAttribute("data-highlighted")),i.addEventListener("click",()=>{i.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:!0})),o()}),queueMicrotask(()=>{const u=i.closest('[role="menu"]')?.querySelector("[data-appearance]")?.getAttribute("data-appearance");u&&(i.setAttribute("data-appearance",u),a.setAttribute("data-appearance",u))}),[a,i]}const q='[data-slot="sidebar-inbox"]',Xe='[data-slot="sidebar-inbox-scroll"]',de='[data-slot="sidebar-inbox-working"]',Ze=`${Xe} > div.pt-3`,S='[data-slot="sidebar-inbox-item"]',N="data-plus-shelf",F="data-plus-toggle",Qe="data-plus-count",P="data-plus-group",ke="data-plus-gap",W="data-plus-member",ee="data-plus-inline",H="data-plus-add",Pe=`${q} ${S}[data-status="ready"]:not([data-state="active"], :hover:not(:has([${H}]:hover)), :focus-visible, [${N}] > *)`,Bn=`
${Ze} {
  order: 100000;
  margin-top: auto;
}
${q}[${ee}] {
  overflow-y: auto;
  gap: 1px;
  padding-bottom: 4px;
}
[${ee}] > ${Xe},
[${ee}] > ${de},
[${ee}] > ${de} > div {
  display: contents;
}
[${ee}] > ${de} > button {
  display: none;
}
[${N}] > [${F}] {
  border-radius: 6px;
}
[${N}] > [${F}]:hover {
  color: var(--color-v2-text-text-base);
}
[${N}] > [${F}]:focus-visible {
  outline: none;
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${N}] > [${F}]::before {
  content: attr(${Qe});
  order: 1;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-faint);
}
[${N}] > [${F}]::after {
  content: "";
  order: 2;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(Mt)}") center / 16px no-repeat;
}
[${N}="closed"] > [${F}]::after {
  rotate: -90deg;
}
[${N}="closed"] > [${F}]:dir(rtl)::after {
  rotate: 90deg;
}
[${N}="closed"] > ${S}:not([data-state="active"]) {
  display: none;
}
${q} ${S}[data-status="working"] {
  opacity: 1;
}
${q} ${S}[data-status="working"] > span:nth-of-type(2) {
  color: var(--color-v2-text-text-base);
}
/* T3 Code's Working colors: sky-600 text and a sky-500 pulsing dot, or sky-300 at 80% in dark mode. */
${q} {
  --plus-working: oklch(58.8% 0.158 241.966);
  --plus-working-dot: oklch(68.5% 0.169 237.323);
  --plus-working-peak: oklch(74.6% 0.16 232.661);
}
[data-color-scheme="dark"] ${q} {
  --plus-working: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-dot: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-peak: oklch(95.1% 0.026 236.824);
}
${q} ${S}[data-status="working"] > span:first-child > span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--plus-working);
}
${q} ${S}[data-status="working"] > span:first-child > span:last-child > span {
  color: inherit;
}
${q} ${S}[data-status="working"] [data-component="text-shimmer"] {
  --text-shimmer-base-color: var(--plus-working);
  --text-shimmer-peak-color: var(--plus-working-peak);
}
${q} ${S}[data-status="working"] > span:first-child > span:last-child::before {
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
  ${q} ${S}[data-status="working"] > span:first-child > span:last-child::before {
    animation: none;
  }
}
${q} ${S} > span,
${q} ${S} > span:first-child > span {
  transition: opacity 150ms;
}
${Pe}:not([${W}]) > span,
${Pe}[${W}] > span:not(:first-child),
${Pe}[${W}] > span:first-child > span:last-child {
  opacity: 0.6;
}
/* In a project group the heading names the project, so rows drop their project line and show the time beside the
   title: the first line dissolves into the row's grid, keeping only its last part, the time or status. */
${S}[${W}] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "title status";
  column-gap: 8px;
}
${S}[${W}] > span:first-child {
  display: contents;
}
${S}[${W}] > span:first-child > span:not(:last-child) {
  display: none;
}
${S}[${W}] > span:first-child > span:last-child {
  grid-area: status;
}
${S}[${W}] > span:nth-of-type(2) {
  grid-area: title;
}
${S}[${W}] > span:nth-of-type(3) {
  grid-column: 1 / -1;
}
/* The same space before every project; a group's heading takes its own 28px on top of it. */
${S}[${ke}] {
  margin-top: 16px;
}
${S}[${P}] {
  position: relative;
  margin-top: 28px;
}
${S}[${P}][${ke}] {
  margin-top: 44px;
}
${S}[${P}]::before {
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
${S}[${P}] > span:first-child > span:first-child {
  display: flex;
  position: absolute;
  inset-inline-start: 6px;
  bottom: calc(100% + 8px);
  pointer-events: none;
}
/* The heading's + button, at the far end of its 24px line, its icon in line with the times of the rows below. */
${S}[${P}] > [${H}] {
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
${S}[${P}] > [${H}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
${S}[${P}]:not([data-state="active"]):has(> [${H}]:hover) {
  background-color: transparent;
}
`,ue=e=>e?Array.from(e.children).filter(t=>t.matches(S)):[],Ke=e=>e.querySelector(":scope > span:first-child > span.truncate")?.textContent?.trim(),Bt=e=>{e.style.removeProperty("order"),e.style.length===0&&e.removeAttribute("style"),e.removeAttribute(P),e.removeAttribute(ke),e.removeAttribute(W)};function zn(e){const t=e?"open":"closed";document.querySelectorAll(Ze).forEach(n=>{const o=n.firstElementChild;!o||o.matches(S)||(L(n,N,t),L(o,F,""),L(o,Qe,String(ue(n).length)),L(o,"role","button"),L(o,"tabindex","0"),L(o,"aria-expanded",String(e)))})}function Wn(e){const t=a=>a.target instanceof Element?a.target.closest(`${Ze} > [${F}]`):null,n=a=>{t(a)&&e()},o=a=>{a.key!=="Enter"&&a.key!==" "||!t(a)||(a.preventDefault(),e())};return document.addEventListener("click",n),document.addEventListener("keydown",o),()=>{document.removeEventListener("click",n),document.removeEventListener("keydown",o)}}const gt=(e,t,n=[])=>{const o=[...n,...e];if(!t&&n.length===0)return o.forEach(Bt);const a=new Map;o.forEach(l=>{const u=t&&Ke(l)||l;a.set(u,[...a.get(u)??[],l])});let i=0;Array.from(a).forEach(([l,u],d)=>{const s=t&&typeof l=="string"&&u.length>1;u.forEach((c,m)=>{i+=1,c.style.order!==String(i)&&(c.style.order=String(i)),te(c,P,s&&m===0?l:void 0),te(c,W,s?"":void 0),te(c,ke,t&&d>0&&m===0?"":void 0)})})};function zt(e,t){document.querySelectorAll(q).forEach(n=>{const o=n.querySelector(`:scope > ${Xe}`),a=n.querySelector(`:scope > ${de} > div`),i=new Set;t?(L(n,ee,""),n.querySelector(`:scope > ${de} > button[aria-expanded="false"]`)?.click(),gt(ue(o),e,ue(a)),i.add(o).add(a)):n.removeAttribute(ee),new Set(Array.from(n.querySelectorAll(S),l=>l.parentElement)).forEach(l=>{if(i.has(l))return;const u=l.getAttribute(N)==="closed",d=ue(l).filter(s=>!u||s.getAttribute("data-state")==="active");ue(l).filter(s=>!d.includes(s)).forEach(Bt),gt(d,e)})})}function Fn(e){document.querySelectorAll(`${S} > [${H}]`).forEach(t=>{t.parentElement.getAttribute(P)!==t.getAttribute(H)&&t.remove()}),document.querySelectorAll(`${S}[${P}]`).forEach(t=>{t.querySelector(`:scope > [${H}]`)||t.append(e(t.getAttribute(P)))})}function Un({name:e,label:t,icon:n,onSelect:o}){const a=document.createElement("div");return a.setAttribute(H,e),a.setAttribute("role","button"),a.setAttribute("aria-label",t),a.setAttribute("title",t),n(a),Wt(a,o),a}function Wt(e,t){const n=o=>{o.preventDefault(),o.stopPropagation(),t()};e.setAttribute("tabindex","0"),e.addEventListener("pointerdown",o=>o.stopPropagation()),e.addEventListener("click",n),e.addEventListener("keydown",o=>{(o.key==="Enter"||o.key===" ")&&n(o)})}function Kn(){zt(!1,!1),document.querySelectorAll(`[${H}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${N}]`).forEach(e=>e.removeAttribute(N)),document.querySelectorAll(`[${F}]`).forEach(e=>{[F,Qe,"role","tabindex","aria-expanded"].forEach(t=>e.removeAttribute(t))})}const Hn=`${S} > span:nth-of-type(3)`,Gn=':scope > span > span[dir="ltr"]',U="data-plus-pr",vt="data-plus-pr-url",Vn=120*1e3,ge=e=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${e}</svg>`,wt={open:ge('<circle cx="5" cy="6" r="3"/><path d="M5 9v12"/><circle cx="19" cy="18" r="3"/><path d="m15 9-3-3 3-3"/><path d="M12 6h5a2 2 0 0 1 2 2v7"/>'),draft:ge('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 6V5"/><path d="M18 11v-1"/><path d="M6 9v12"/>'),merged:ge('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>'),closed:ge('<circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="m21 3-6 6"/><path d="m21 9-6-6"/><path d="M18 11.5V15"/><circle cx="18" cy="18" r="3"/>')},bt={open:["oklch(59.6% 0.145 163.225)","oklch(84.5% 0.143 164.978 / 0.9)"],draft:["oklch(55.2% 0.016 285.938)","oklch(70.5% 0.015 286.067 / 0.8)"],merged:["oklch(54.1% 0.281 293.009)","oklch(81.1% 0.111 293.571 / 0.9)"],closed:["oklch(57.7% 0.245 27.325)","oklch(80.8% 0.114 19.571 / 0.9)"]},Jn=`
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
${Object.keys(wt).map(e=>`[${U}="${e}"] {
  --plus-pr: ${bt[e][0]};
}
[data-color-scheme="dark"] [${U}="${e}"] {
  --plus-pr: ${bt[e][1]};
}
[${U}="${e}"]::before {
  mask: url("data:image/svg+xml,${encodeURIComponent(wt[e])}") center / 12px no-repeat;
}`).join(`
`)}
`,Yn=e=>`git remote get-url origin && GH_NO_UPDATE_NOTIFIER=1 gh pr list --state all --limit 20 --json number,title,url,state,isDraft,updatedAt,headRepositoryOwner --head ${Lt(e)} 2>/dev/null`;function Xn(e){const[t,...n]=e.trim().split(/\r?\n/),o=t.match(/[:/]([^/:]+)\/[^/]+$/)?.[1].toLowerCase(),a=JSON.parse(n.join(`
`)).filter(u=>u.headRepositoryOwner?.login.toLowerCase()===o).toSorted((u,d)=>Date.parse(d.updatedAt)-Date.parse(u.updatedAt)),i=a.find(u=>u.state==="OPEN")??a[0];if(!i)return;const l=i.state==="OPEN"&&i.isDraft?"draft":i.state.toLowerCase();return{number:i.number,title:i.title,url:i.url,state:l}}const le=new Map;let He=new Set,$t=Promise.resolve();function Zn({lookup:e,open:t,label:n}){const o=Date.now(),a=Array.from(document.querySelectorAll(Hn),l=>{const u=l.querySelector(Gn),d=u?.textContent.trim(),s=l.parentElement;return{line:l,row:s,branch:d,key:d&&`${Ke(s)}
${d}`,holder:u?.parentElement}}),i=new Set(a.filter(({row:l,key:u})=>u&&l.getAttribute("data-status")==="working").map(({key:l})=>l));He.forEach(l=>{const u=le.get(l);!i.has(l)&&u?.time!==void 0&&(u.time=0)}),He=i,a.forEach(({line:l,row:u,branch:d,key:s,holder:c})=>{const m=s&&le.get(s);let p=l.querySelector(`:scope > [${U}]`);s&&(!m||m.time!==void 0&&o-m.time>=Vn)&&Qn(s,()=>e(Ke(u),d));const g=m?.pull;if(!g)return p?.remove();p||(p=document.createElement("span"),p.setAttribute("role","link"),Wt(p,()=>t(p.getAttribute(vt))));const x=n(g);p.previousElementSibling!==c&&c.after(p),L(p,U,g.state),L(p,vt,g.url),L(p,"title",x),L(p,"aria-label",x),p.textContent!==`#${g.number}`&&(p.textContent=`#${g.number}`)})}const Qn=(e,t)=>{const n=$t.then(t).catch(()=>{});le.set(e,{pull:le.get(e)?.pull}),$t=n,n.then(o=>le.set(e,{time:Date.now(),pull:o}))};function er(){le.clear(),He=new Set,document.querySelectorAll(`[${U}]`).forEach(e=>e.remove())}const tr=["small","medium","large","unrestricted"];function Ft(e={}){const t=e.archiveAfterHours,n=e.workflowConcurrency;return{archiveAfterHours:typeof t=="number"&&t>=0?t:12,hideAgent:typeof e.hideAgent=="string"||e.hideAgent===!1?e.hideAgent:"build",responseLabel:typeof e.responseLabel=="string"?e.responseLabel:e.responseLabel===!1?"":"Response",lowercaseVariants:e.lowercaseVariants!==!1,workflows:e.workflows!==!1,workflowSize:tr.includes(e.workflowSize)?e.workflowSize:"medium",workflowConcurrency:Number.isInteger(n)&&n>=1?Math.min(n,256):void 0}}const nr="[data-timeline-virtual-content]",Ut='[data-slot="session-turn-message-container"]',he="data-plus-final",je=`[${he}] > [data-component="session-turn"] > ${Ut}`,et="--plus-label-half";function rr(e){return`
${je} {
  --plus-gap: calc(var(${et}, ${e.length*3.75}px) + 12px);
  position: relative;
}
${je}::before {
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
${je}::after {
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
`}let yt=!1;function or(e){const t=document.querySelector(Ut);if(yt||!e||!t||document.fonts?.status==="loading")return;const n=document.createElement("span");n.textContent=e,n.style.cssText="position: absolute; visibility: hidden; white-space: nowrap; font-size: 13px; font-weight: 440; letter-spacing: -0.04px",t.append(n);const o=n.getBoundingClientRect().width;n.remove(),o&&(document.documentElement.style.setProperty(et,`${o/2}px`),yt=!0)}const Z=e=>e?.frame?.getAttribute("data-timeline-row"),Y=e=>e?.frame?.getAttribute("data-message-id"),Re=e=>Z(e)==="AssistantPart"&&!!e.frame.querySelector('[data-component="text-part"]')&&!e.frame.querySelector('[data-component="tool-part-wrapper"], [data-timeline-part-ids]');function sr(e){document.querySelectorAll(nr).forEach(t=>{const n=Array.from(t.querySelectorAll(":scope > div > [data-timeline-key]"),s=>({wrapper:s,frame:s.querySelector(":scope > [data-index] > [data-timeline-row]"),top:parseFloat(s.style.top),height:parseFloat(s.style.height)})).sort((s,c)=>s.top-c.top),o=t.querySelector(':scope > [data-timeline-row="bottom-spacer"]'),a=s=>n[s+1]&&Math.abs(n[s+1].top-(n[s].top+n[s].height))<2?n[s+1]:void 0,i=s=>n[s-1]&&Math.abs(n[s].top-(n[s-1].top+n[s-1].height))<2?n[s-1]:void 0,l=s=>s===n.length-1&&!!o&&Math.abs(n[s].wrapper.getBoundingClientRect().bottom-o.getBoundingClientRect().top)<2,u=e?void 0:!0,d=s=>{const c=a(s);return c?c.frame?Z(c)==="TurnGap"||Z(c)==="UserMessage"||Y(c)&&Y(c)!==Y(n[s])||Z(c)==="TurnDiff"||Z(c)==="TurnDivider"?!0:Z(c)==="AssistantPart"||Z(c)==="Thinking"?!1:u:u:n[s+1]||!l(s)?void 0:u};n.forEach((s,c)=>{if(!Re(s))return Be(s,!1);const m=d(c);if(m===void 0)return;if(!m){const g=a(c);Re(g)&&Y(g)===Y(s)||Be(s,!1);return}let p=c;for(;Re(i(p))&&Y(i(p))===Y(s);)p-=1;for(let g=p;g<=c;g+=1)Be(n[g],g===p&&n[g].frame.hasAttribute("data-timeline-spacing"))})})}const pe=new Map,Be=(e,t)=>{!e.frame||e.frame.hasAttribute(he)===t||(te(e.frame,he,t?"":void 0),pe.set(e.frame.parentElement,10))};function ar(){pe.forEach((e,t)=>{if(!(t.isConnected&&Math.abs(t.offsetHeight-parseFloat(t.parentElement.style.height))>=1)||e===0)return pe.delete(t);pe.set(t,e-1),t.style.paddingBottom="1px",requestAnimationFrame(()=>t.style.removeProperty("padding-bottom"))})}const ir=()=>pe.size>0;function lr(){document.querySelectorAll(`[${he}]`).forEach(e=>e.removeAttribute(he)),document.documentElement.style.removeProperty(et)}const cr='[data-component="tooltip-v2-trigger"] > button:not([aria-haspopup]):has([data-component="progress-circle"])',T="data-plus-usage",xt="plus-usage-card",Ge="data-plus-usage-hover",ur=50,dr=100,pr=4,mr=`
:root[${Ge}] [data-component="tooltip-v2"]:not([data-force-open="true"]) {
  display: none;
}
[${T}] {
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
[${T}]:dir(rtl) {
  transform-origin: top left;
}
[${T}] [data-part="row"] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
  white-space: nowrap;
}
[${T}] [data-part="row"] > :last-child {
  margin-inline-start: auto;
}
[${T}] :is([data-part="value"], [data-part="percent"]) {
  color: var(--v2-text-text-base);
}
[${T}] [data-part="percent"] {
  font-weight: 530;
}
[${T}] [data-part="bar"] {
  display: flex;
  height: 8px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--v2-background-bg-layer-03);
}
[${T}] [data-part="bar"] > span {
  box-sizing: border-box;
  min-width: 3px;
}
/* A line in the card's color between kinds, as in Cursor's bar. */
[${T}] [data-part="bar"] > span + span {
  border-inline-start: 1px solid var(--v2-background-bg-layer-01);
}
[${T}] [data-part="legend"] {
  display: flex;
  flex-direction: column;
}
[${T}] [data-part="dot"] {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
[${T}] hr {
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
  [${T}] {
    animation: none;
  }
}
:root[data-motion="reduce"] [${T}] {
  animation: none;
}
`;function fr(e){let t,n,o=0;const a=document.documentElement,i=(f,k)=>{clearTimeout(o),o=setTimeout(f,k)},l=f=>f.target instanceof Element?f.target.closest(cr):null,u=f=>f instanceof Node&&!!(t?.contains(f)||n?.card.contains(f)),d=()=>{if(!t.isConnected)return;const f=document.createElement("div"),k=t.closest("[data-theme]")?.getAttribute("data-theme");f.id=xt,f.setAttribute(T,""),f.setAttribute("role","tooltip"),k&&f.setAttribute("data-theme",k),n={card:f,stop:e(f)},document.body.append(f),wr(f,t),t.setAttribute("aria-describedby",xt)},s=()=>{clearTimeout(o),n?.stop(),n?.card.remove(),n=void 0,t?.removeAttribute("aria-describedby")},c=f=>{if(f===t){n&&clearTimeout(o);return}m(),t=f,a.setAttribute(Ge,""),i(d,ur)},m=()=>{s(),t=void 0,a.removeAttribute(Ge)},p=f=>{if(f.pointerType==="touch")return;const k=l(f);if(k)return c(k);if(n?.card.contains(f.target))return clearTimeout(o);t&&!t.isConnected&&m()},g=f=>{!t||u(f.relatedTarget)||!u(f.target)||(n?i(m,dr):m())},x=f=>{t?.contains(f.target)&&s()},$=f=>{f.key==="Escape"&&s()},b=f=>{const k=l(f);k?.matches(":focus-visible")&&c(k)},v=f=>{t?.contains(f.target)&&!u(f.relatedTarget)&&m()};return document.addEventListener("pointerover",p),document.addEventListener("pointerout",g),document.addEventListener("pointerdown",x,!0),document.addEventListener("keydown",$),document.addEventListener("focusin",b),document.addEventListener("focusout",v),()=>{document.removeEventListener("pointerover",p),document.removeEventListener("pointerout",g),document.removeEventListener("pointerdown",x,!0),document.removeEventListener("keydown",$),document.removeEventListener("focusin",b),document.removeEventListener("focusout",v),m()}}function hr(e){const t=e.server.data,n=e.directory?{directory:e.directory}:void 0,o=t.session.get(e.id),a=t.session.message.list(e.id),i=gn.lastAssistantWithUsage(a,o?.revert?.messageID),l=i?.tokens,u=l?l.input+l.output+l.reasoning+l.cache.read+l.cache.write:0,d=i?kt(t,n,i.model)?.limit.context:void 0,s=t.session.cost(e.id),c=o?.model??a.findLast(g=>g.type==="assistant")?.model,m=c?kt(t,n,c):void 0,p=!!m&&m.cost.every(g=>!g.input&&!g.output&&!g.cache.read&&!g.cache.write);return{total:u,tokens:l,limit:d||void 0,percent:d?Math.round(u/d*100):void 0,cost:s>0||!p?s:void 0}}function gr({total:e,tokens:t,limit:n,percent:o,cost:a},i,l){const u=p=>new Intl.NumberFormat(l,{notation:"compact",maximumFractionDigits:0}).format(p).toLocaleLowerCase(l),d=t?vr.map(p=>({...p,value:p.value(t)})).filter(p=>p.value>0):[],s=Math.max(n??0,e),c=O("span",void 0,n?`${u(e)} / ${u(n)} `:u(e));n&&c.append(O("span","percent",`(${o}%)`));const m=[ze([O("span",void 0,i("usage.window")),c])];if(s>0){const p=O("div","bar");p.setAttribute("aria-hidden","true"),d.forEach(g=>{const x=O("span");x.style.width=`${g.value/s*100}%`,x.style.background=g.color,p.append(x)}),m.push(p)}if(d.length){const p=O("div","legend");d.forEach(g=>{const x=O("span","dot");x.style.background=g.color,p.append(ze([x,O("span",void 0,i(g.label)),O("span","value",g.value.toLocaleString(l))]))}),m.push(p)}if(a!==void 0){const p=new Intl.NumberFormat(l,{style:"currency",currency:"USD"});m.push(O("hr"),ze([O("span",void 0,i("usage.cost")),O("span","value",p.format(a))]))}return m}const vr=[{label:"usage.cacheRead",color:"var(--v2-avatar-border-blue)",value:e=>e.cache.read},{label:"usage.cacheWrite",color:"var(--v2-avatar-border-purple)",value:e=>e.cache.write},{label:"usage.input",color:"var(--v2-avatar-border-pink)",value:e=>e.input},{label:"usage.reasoning",color:"var(--v2-avatar-border-yellow)",value:e=>e.reasoning},{label:"usage.output",color:"var(--v2-avatar-border-green)",value:e=>e.output}],kt=(e,t,n)=>{const o=e.location.provider.list(t),a=e.location.model.list(t);if(o?.some(i=>i.id===n.providerID))return a?.findLast(i=>i.providerID===n.providerID&&i.id===n.id&&i.status!=="deprecated")},O=(e,t,n)=>{const o=document.createElement(e);return t&&o.setAttribute("data-part",t),n!==void 0&&(o.textContent=n),o},ze=e=>{const t=O("div","row");return t.append(...e),t},wr=(e,t)=>{const n=t.getBoundingClientRect(),o=e.offsetWidth,a=getComputedStyle(t).direction==="rtl"?n.left:n.right-o;e.style.top=`${n.bottom+pr}px`,e.style.left=`${Math.max(8,Math.min(a,innerWidth-o-8))}px`},tt='[data-component="user-message"]',br=`${tt} [data-slot="user-message-actions"]`,Kt='[data-slot="user-message-text"]',$r='[data-component="tooltip-v2-trigger"]',Ce="data-plus-copy",yr=`
[${Ce}] {
  display: contents;
}
[${Ce}] [data-slot="icon-svg"] {
  width: 14px;
  height: 14px;
}
`,me=new Map;function xr(e){me.forEach((t,n)=>{n.isConnected||(t(),n.remove(),me.delete(n))}),document.querySelectorAll(br).forEach(t=>{const n=t.querySelector(`:scope > ${$r}`);if(!n||t.querySelector(`:scope > [${Ce}]`)||!t.closest(tt).querySelector(Kt))return;const o=document.createElement("span");o.setAttribute(Ce,""),o.addEventListener("mousedown",a=>a.preventDefault()),me.set(o,e(o)),t.insertBefore(o,n)})}const kr=({ui:e,label:t,copied:n,write:o})=>a=>r.render(()=>{const[i,l]=h.createSignal(!1),u=()=>i()?n:t,d=async s=>{s.stopPropagation(),await o(Cr(a.closest(tt)))&&(l(!0),setTimeout(()=>l(!1),2e3))};return h.createComponent(e.Tooltip,{get value(){return u()},get children(){return h.createComponent(e.IconButton,{get icon(){return i()?"check":"outline-copy"},get label(){return u()},size:"small",onClick:d})}})},a),Cr=e=>{const t=e.querySelector(Kt).cloneNode(!0);return t.querySelectorAll('[data-slot="user-message-comments"], [data-slot="user-message-fold-toggle"]').forEach(n=>n.remove()),t.querySelectorAll("[data-session-reference]").forEach(n=>n.replaceWith(n.dataset.sessionReference)),t.textContent};function Sr(){me.forEach((e,t)=>{e(),t.remove()}),me.clear()}function Se(e){return e?e<1e3?String(e):e<1e6?`${Ct(e/1e3)}k`:`${Ct(e/1e6)}M`:"0"}const Ct=e=>e>=100?String(Math.round(e)):e.toFixed(1).replace(/\.0$/,"");function Ar(e,t){const n=Math.max(0,Math.floor(e/1e3)),o=a=>String(a).padStart(2,"0");return n<60?t("ui.message.duration.seconds",{count:String(n)}):n<3600?t("ui.message.duration.minutesSeconds",{minutes:String(Math.floor(n/60)),seconds:o(n%60)}):t("ui.message.duration.hoursMinutes",{hours:String(Math.floor(n/3600)),minutes:o(Math.floor(n/60)%60)})}const Ae=e=>(e.tokens?.output??0)+(e.tokens?.reasoning??0);function Er(e,t){const n=e.map(l=>l.title),o=new Map(n.map(l=>[l,[]])),a=[];for(const l of t)l.phase===void 0?a.push(l):(o.has(l.phase)||o.set(l.phase,[]),o.get(l.phase).push(l));const i=[...o].map(([l,u])=>({title:l,detail:e.find(d=>d.title===l)?.detail,agents:u}));return a.length?[...i,{title:void 0,agents:a}]:i}const Ir=(e,t)=>Number(e.id.slice(1))-Number(t.id.slice(1));function Ve(e){const t={total:e.length,done:0,running:0,queued:0,failed:0,stopped:0};for(const n of e)t[n.status]=(t[n.status]??0)+1;return{...t,finished:t.done+t.failed+t.stopped}}const nt=e=>e==="pending"||e==="running"||e==="paused",z={type:"object"},G={type:"string"},ve={type:"object",properties:{runID:G,sessionID:G},required:["runID"]},St={type:"object",properties:{runID:G,sessionID:G,agentID:G},required:["runID","agentID"]},We=vn.Rpc.define({id:"opencode-plus",methods:{list:{input:{type:"object",properties:{sessionID:G},required:["sessionID"]},output:z},get:{input:ve,output:z},agent:{input:St,output:z},stop:{input:ve,output:z},pause:{input:ve,output:z},resume:{input:ve,output:z},stopAgent:{input:St,output:z},save:{input:{type:"object",properties:{runID:G,sessionID:G,scope:{enum:["project","personal"]}},required:["runID","scope"]},output:z},ultracode:{input:{type:"object",properties:{sessionID:{type:"string"},on:{type:"boolean"}},required:["sessionID"]},output:z}},events:{changed:{schema:z},ultracode:{schema:z}}}),_r=60*1e3;function Dr(e,{onStart:t}){const[n,o]=we.createStore({runs:{},sessions:{},agents:{},results:{},details:{},ultracode:{}}),a=new Set,i=s=>s.server.client.rpc(We),l=s=>({location:{directory:s.directory}}),u=s=>{const c=n.runs[s.id];return h.batch(()=>{o("runs",s.id,we.reconcile(s)),n.sessions[s.sessionID]?.includes(s.id)||o("sessions",s.sessionID,(m=[])=>[s.id,...m])}),!c},d=(s,c)=>h.batch(()=>{n.agents[s]||o("agents",s,{});for(const m of c)o("agents",s,m.id,we.reconcile(m))});return y.createKeyed(()=>e.servers.get("sidecar")?.client,s=>h.onCleanup(s.rpc(We).events.on("changed",c=>{const{run:m,agents:p}=c.data,g=u(m);d(m.id,p),g&&Date.now()-m.created<_r&&t(m)}))),y.createKeyed(()=>e.servers.get("sidecar")?.client,s=>h.onCleanup(s.rpc(We).events.on("ultracode",c=>o("ultracode",c.data.sessionID,c.data.on)))),{state:n,runs:s=>(n.sessions[s]??[]).map(c=>n.runs[c]).filter(Boolean),run:s=>n.runs[s],agents:s=>Object.values(n.agents[s]??{}).toSorted(Ir),detail:(s,c)=>n.details[`${s}/${c}`],active:s=>(n.sessions[s]??[]).map(c=>n.runs[c]).filter(c=>c&&nt(c.status)),async load(s,c){if(!a.has(c)){a.add(c);try{const[{runs:m},{on:p}]=await Promise.all([i(s).list({sessionID:c},l(s)),i(s).ultracode({sessionID:c},l(s))]);h.batch(()=>{for(const g of m.toReversed())u(g);o("ultracode",c,p)})}catch{a.delete(c)}}},result:s=>n.results[s],async open(s,c){const{run:m}=await i(s).get({runID:c,sessionID:n.runs[c]?.sessionID},l(s));h.batch(()=>{d(m.id,m.agents??[]),m.result!==void 0&&o("results",m.id,m.result)})},async describe(s,c,m){const{agent:p}=await i(s).agent({runID:c,agentID:m,sessionID:n.runs[c]?.sessionID},l(s));o("details",`${c}/${m}`,p)},stop:(s,c)=>i(s).stop({runID:c},l(s)),pause:(s,c)=>i(s).pause({runID:c},l(s)),resume:(s,c)=>i(s).resume({runID:c},l(s)),stopAgent:(s,c,m)=>i(s).stopAgent({runID:c,agentID:m},l(s)),save:(s,c,m)=>i(s).save({runID:c,scope:m,sessionID:n.runs[c]?.sessionID},l(s)),ultracode:s=>n.ultracode[s]===!0,setUltracode:async(s,c,m)=>{o("ultracode",c,m),await i(s).ultracode({sessionID:c,on:m},l(s))}}}const Mr=["filePath","file","command","pattern","query","url","path","description","prompt","name"];function Tr(e,t){if(!e||typeof e!="object")return"";const n=Mr.find(a=>typeof e[a]=="string"&&e[a].trim()),o=n?e[n]:Object.values(e).find(a=>typeof a=="string"&&a.trim());return o?Lr(qr(o,t),120):""}function qr(e,t){if(!t)return e;const n=t.endsWith("/")?t:`${t}/`;return e===t?".":e.split(n).join("")}function Lr(e,t){const n=String(e).replace(/\s+/g," ").trim();return n.length>t?`${n.slice(0,t-1)}…`:n}var Or=r.template('<svg viewBox="0 0 16 16"width=16 height=16 data-component=session-progress-indicator-v2 data-slot=spinner-dots aria-hidden=true fill=currentColor>'),Nr=r.template("<svg><rect></svg>",!1,!0,!1);const se=5,Fe=2,At=3,Et=1.8,Ee=.2,Pr=[1,.987,.934,.812,.599,.384,.238,.143,.081,.041,.017,.004,0],Je=[...Pr.map((e,t)=>[t*4,K(.55*e)]),[100,0]],Ht="spinner-radar",{dots:jr,shapes:Rr}=Wr();function It(e){return Br(),(()=>{var t=Or();return r.use(n=>{e.still||zr(n)},t),r.insert(t,r.createComponent(h.For,{each:jr,children:n=>(()=>{var o=Nr();return r.effect(a=>{var i=n.x,l=n.y,u=n.size,d=n.size,s=n.size*.24,c=n.still,m=n.steady||e.still?void 0:`${Ht}-${n.shape} calc(${Et}s * var(--spinner-time, 1)) linear calc(${-Et*(1-n.at)}s * var(--spinner-time, 1)) infinite`;return i!==a.e&&r.setAttribute(o,"x",a.e=i),l!==a.t&&r.setAttribute(o,"y",a.t=l),u!==a.a&&r.setAttribute(o,"width",a.a=u),d!==a.o&&r.setAttribute(o,"height",a.o=d),s!==a.i&&r.setAttribute(o,"rx",a.i=s),c!==a.n&&r.setStyleProperty(o,"--still",a.n=c),m!==a.s&&r.setStyleProperty(o,"animation",a.s=m),a},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0}),o})()})),r.effect(()=>r.setAttribute(t,"class",e.class)),t})()}function Br(){if(document.getElementById("ocp-spinner-radar"))return;const e=document.createElement("style");e.id="ocp-spinner-radar",e.textContent=Rr.map((t,n)=>`@keyframes ${Ht}-${n}{${t.map(([o,a])=>`${K(o)}%{opacity:${K(Ee+(1-Ee)*a)};animation-timing-function:linear}`).join("")}}`).join(""),document.head.append(e)}function zr(e){const t=new ResizeObserver(()=>e.getAnimations({subtree:!0}).forEach(n=>{n.startTime!==0&&(n.startTime=0)}));t.observe(e),h.onCleanup(()=>t.disconnect())}function Wr(){const e=Array.from({length:se*se},(l,u)=>{const d={gx:u%se-(se-1)/2,gy:Math.floor(u/se)-(se-1)/2};return{cell:d,at:Ur(d),steady:d.gx===0&&d.gy===0}}),t=l=>Math.max(Math.abs(l.gx),Math.abs(l.gy)),n=e.map(l=>{if(l.steady)return"";const u=e.filter(c=>c!==l&&!c.steady&&t(c.cell)===t(l.cell)),d=Math.min(...u.map(c=>$e(l.at-c.at))),s=Math.min(...u.map(c=>$e(c.at-l.at)));return`${K(d)} ${K(s)}`}),o=[...new Set(n.filter(l=>l!==""))],a=o.map(l=>{const[u,d]=l.split(" ").map(Number);return Fr(u*100,d*100)});return{dots:e.map((l,u)=>{const d=Math.max(0,o.indexOf(n[u])),s=l.steady?Je[0][1]:Gt(a[d],$e(.22-l.at)*100);return{x:K(8+l.cell.gx*At-Fe/2),y:K(8+l.cell.gy*At-Fe/2),size:Fe,at:K(l.at),steady:l.steady,still:K(Ee+(1-Ee)*s),shape:d}}),shapes:a}}function Fr(e,t){const o=t/2+1.5,a=100-e/2;return[[0,1],[t/2,1],[o,Gt(Je,o)],...Je.filter(([i])=>i>o&&i<100&&i<a-1.5),[a-1.5,0],[a,1],[100,1]]}function Ur(e){return $e(Math.atan2(e.gx,-e.gy)/(2*Math.PI))}function Gt(e,t){const n=e.findIndex(([u])=>u>=t);if(n<=0)return e[0]?.[1]??0;const[o,a]=e[n-1],[i,l]=e[n];return a+(l-a)*(t-o)/(i-o||1)}function $e(e){return e-Math.floor(e)}function K(e){return Math.round(e*1e3)/1e3}var Kr=r.template('<div class="relative size-full min-w-0 overflow-hidden bg-v2-background-bg-base flex flex-col outline-none">'),Hr=r.template('<span class="min-w-0 flex-1 truncate text-[13px] font-[530] leading-4 tracking-[-0.04px] text-v2-text-text-base">'),Gr=r.template('<span class="flex shrink-0 items-center gap-2 text-[13px] font-[440] leading-[var(--line-height-compact)] tracking-[-0.04px] text-v2-text-text-muted">'),Vr=r.template('<div class="mx-auto flex w-full max-w-[608px] flex-col gap-3 px-6 pt-6 pb-10">'),Jr=r.template('<div class="mx-auto flex max-w-[360px] flex-col items-center gap-4 px-6 pt-20 text-center"><div class="flex flex-col gap-2"><div class="text-[13px] font-[530] leading-[var(--line-height-compact)] text-v2-text-text-base"></div><div class="text-[13px] font-[440] leading-[var(--line-height-compact)] text-v2-text-text-muted">'),Yr=r.template('<button type=button class="flex h-[41px] w-full items-center justify-between gap-4 rounded-[8px] border-[0.5px] border-v2-border-border-base bg-v2-background-bg-layer-01 px-3.5 text-start hover:bg-v2-background-bg-layer-02"><span class="flex min-w-0 items-center gap-2 text-[13px] font-[440] leading-[var(--line-height-compact)] tracking-[-0.04px]"><span class="shrink-0 text-v2-text-text-base"></span><span class="truncate text-v2-text-text-muted"></span></span><span class="text-[11px] tabular-nums whitespace-nowrap text-v2-text-text-muted">'),Vt=r.template('<span class="min-w-0 truncate text-[13px] font-[530] leading-4 tracking-[-0.04px] text-v2-text-text-base">'),Jt=r.template('<span class="min-w-0 flex-1">'),Yt=r.template('<div class="shrink-0 px-3 py-1.5 text-12-regular text-v2-state-fg-danger border-b border-v2-border-border-muted">'),Xr=r.template('<div class="flex flex-col gap-1">'),Xt=r.template('<section class="flex flex-col gap-1"><h2 class="pb-1 text-[13px] font-[440] text-v2-text-text-muted">'),Zr=r.template('<div class="mx-auto flex w-full max-w-[608px] flex-col gap-4 px-6 pt-6 pb-10"><div class="flex flex-col gap-2"><div class="text-[13px] font-[440] leading-[var(--line-height-compact)] text-v2-text-text-muted">'),Qr=r.template('<div class="text-[13px] font-[440] leading-[var(--line-height-compact)] text-v2-text-text-muted">'),eo=r.template('<section class="flex flex-col gap-1"><h2 class="flex items-center justify-between gap-4 px-2 pb-1 text-[13px] font-[440] text-v2-text-text-muted"><span class="min-w-0 truncate"></span><span class="text-[11px] tabular-nums whitespace-nowrap text-v2-text-text-muted">'),to=r.template('<button type=button class="flex h-8 w-full shrink-0 items-center gap-2 rounded-[6px] px-2 text-start text-[13px] font-[440] hover:bg-v2-background-bg-layer-02"><span class="max-w-[45%] shrink-0 truncate text-v2-text-text-base"></span><span class="min-w-0 flex-1 truncate text-v2-text-text-muted"></span><span class="text-[11px] tabular-nums whitespace-nowrap text-v2-text-text-muted">'),no=r.template('<div class="truncate text-[13px] font-[440] leading-[var(--line-height-compact)] text-v2-text-text-muted">'),ro=r.template('<div class="mx-auto flex w-full max-w-[608px] flex-col gap-4 px-6 pt-6 pb-10"><div data-component=user-message><div data-slot=user-message-body><div data-slot=user-message-text dir=auto>'),oo=r.template("<span class=capitalize>"),so=r.template("<div data-component=context-tool-group-list>"),ao=r.template("<div data-slot=context-tool-group-item>"),io=r.template("<span data-slot=basic-tool-tool-subtitle>"),lo=r.template("<span data-slot=basic-tool-tool-arg class=text-v2-state-fg-danger>"),co=r.template("<div data-component=tool-trigger><div data-slot=basic-tool-tool-trigger-content><div data-slot=basic-tool-tool-info><div data-slot=basic-tool-tool-info-structured><div data-slot=basic-tool-tool-info-main><span data-slot=basic-tool-tool-title>"),Zt=r.template("<div data-component=text-part><div data-slot=text-part-body>"),uo=r.template("<div data-slot=permission-row><span data-slot=permission-spacer aria-hidden=true></span><div data-slot=permission-patterns>"),po=r.template("<div data-component=dock-prompt data-kind=permission><div data-slot=permission-body><div data-slot=permission-header><div data-slot=permission-row data-variant=header><span data-slot=permission-icon></span><div data-slot=permission-header-title></div></div></div><div data-slot=permission-content><div data-slot=permission-row><span data-slot=permission-spacer aria-hidden=true></span><div data-slot=permission-hint></div></div></div></div><div data-slot=permission-footer><div></div><div data-slot=permission-footer-actions>"),mo=r.template('<code class="text-text-base break-all">'),fo=r.template('<div class="h-11 shrink-0 flex items-center gap-2 px-3 border-b-[0.5px] border-v2-border-border-muted">'),ho=r.template('<div class="min-h-0 flex-1 overflow-y-auto"data-scrollable>'),go=r.template('<button type=button class="flex h-8 w-fit items-center gap-1 rounded-[6px] px-2 text-[13px] font-[440] text-v2-text-text-muted hover:bg-v2-background-bg-layer-02 hover:text-v2-text-text-base">'),vo=r.template('<div class="flex min-w-0 flex-wrap items-center gap-1.5 text-[12px] font-[440] leading-4 tracking-[-0.04px] tabular-nums text-v2-text-text-faint">'),wo=r.template("<span aria-hidden=true>·"),bo=r.template("<span class=shrink-0>"),$o=r.template('<span class="flex size-4 shrink-0 items-center justify-center text-v2-icon-icon-faint">'),yo=r.template('<span class="flex items-center gap-1.5">'),xo=r.template("<span data-component=text-shimmer style=--text-shimmer-swap:220ms;--text-shimmer-index:0><span data-slot=text-shimmer-char><span data-slot=text-shimmer-char-base aria-hidden=true></span><span data-slot=text-shimmer-char-shimmer aria-hidden=true>");function ko(e){const t=()=>Q(e.session),n=()=>e.nav.get(t());return y.createKeyed(t,o=>{e.model.load(e.session,o)}),(()=>{var o=Kr();return r.insert(o,r.createComponent(h.Switch,{get fallback(){return r.createComponent(Co,r.mergeProps(e,{get sessionID(){return t()}}))},get children(){return[r.createComponent(h.Match,{get when(){return r.memo(()=>!!n().agentID)()&&e.model.run(n().runID)},get children(){return r.createComponent(Io,r.mergeProps(e,{get sessionID(){return t()},get runID(){return n().runID},get agentID(){return n().agentID}}))}}),r.createComponent(h.Match,{get when(){return r.memo(()=>!!n().runID)()&&e.model.run(n().runID)},get children(){return r.createComponent(Ao,r.mergeProps(e,{get sessionID(){return t()},get runID(){return n().runID}}))}})]}})),o})()}function Q(e){const t=e.server.data;let n=e.id;for(let o=0;o<8;o++){const a=t.session.get(n)?.parentID;if(!a)return n;n=a}return n}function Co(e){const t=y.usePlugin(),n=()=>e.model.runs(e.sessionID);return[r.createComponent(rt,{get children(){return[(()=>{var o=Hr();return r.insert(o,()=>t.t("wf.title")),o})(),r.createComponent(t.ui.Tooltip,{get value(){return t.t("wf.ultracode.hint")},placement:"top",get children(){var o=Gr();return r.insert(o,()=>t.t("wf.ultracode"),null),r.insert(o,r.createComponent(t.ui.Switch,{get label(){return t.t("wf.ultracode")},hideLabel:!0,get checked(){return e.model.ultracode(e.sessionID)},onChange:a=>{e.model.setUltracode(e.session,e.sessionID,a)}}),null),o}})]}}),r.createComponent(ot,{get children(){return r.createComponent(h.Show,{get when(){return n().length>0},get fallback(){return(()=>{var o=Jr(),a=o.firstChild,i=a.firstChild,l=i.nextSibling;return r.insert(o,r.createComponent(t.ui.Icon,{name:"fork",size:"large",class:"text-v2-icon-icon-muted"}),a),r.insert(i,()=>t.t("wf.empty.title")),r.insert(l,()=>t.t("wf.empty.body")),o})()},get children(){var o=Vr();return r.insert(o,r.createComponent(h.For,{get each(){return n()},children:a=>r.createComponent(So,{run:a,onOpen:()=>e.nav.go(e.sessionID,{runID:a.id})})})),o}})}})]}function So(e){const t=y.usePlugin(),n=at(()=>nt(e.run.status)),o=()=>Lo(e.run.counts??{});return(()=>{var a=Yr(),i=a.firstChild,l=i.firstChild,u=l.nextSibling,d=i.nextSibling;return a.$$click=()=>e.onOpen(),r.insert(i,r.createComponent(_e,{get status(){return e.run.status}}),l),r.insert(l,()=>e.run.name),r.insert(u,()=>e.run.description),r.insert(d,r.createComponent(h.Show,{get when(){return e.run.counts?.total>0},get children(){return`${o()}/${e.run.counts.total} · `}}),null),r.insert(d,()=>De(t,(e.run.ended??n())-(e.run.started??e.run.created)),null),a})()}function Ao(e){const t=y.usePlugin(),n=()=>e.model.run(e.runID),o=()=>e.model.agents(e.runID),a=()=>nt(n().status),i=at(a),l=h.createMemo(()=>Ve(o())),[u,d]=h.createSignal(!1);y.createKeyed(()=>`${e.runID}/${a()}`,()=>{e.model.open(e.session,e.runID).catch(()=>{})});const s=p=>()=>{p().catch(g=>t.toast.show({variant:"error",title:t.t("wf.error"),description:st(g)}))},c=p=>s(async()=>{const{path:g}=await e.model.save(e.session,e.runID,p);t.toast.show({variant:"success",title:t.t("wf.saved",{name:`/${n().name}`}),description:g})}),m=()=>[{label:t.t("wf.save.project"),icon:"folder",onSelect:c("project")},{label:t.t("wf.save.personal"),icon:"download",onSelect:c("personal")},{type:"separator"},{label:t.t("wf.copy.script"),icon:"outline-copy",onSelect:()=>{t.system.copy(n().scriptPath)}},{label:t.t("wf.copy.id"),icon:"outline-copy",onSelect:()=>{t.system.copy(n().id)}},...t.desktop?[{label:t.t("wf.reveal"),icon:"folder",onSelect:()=>{t.desktop.reveal(n().scriptPath)}}]:[]];return[r.createComponent(rt,{get children(){return[r.createComponent(en,{get label(){return t.t("wf.back.runs")},onClick:()=>e.nav.go(e.sessionID,{})}),(()=>{var p=Vt();return r.insert(p,()=>n().name),p})(),Jt(),r.createComponent(h.Show,{get when(){return n().status==="running"},get children(){return r.createComponent(t.ui.Button,{variant:"ghost-muted",size:"small",get onClick(){return s(()=>e.model.pause(e.session,e.runID))},get children(){return t.t("wf.pause")}})}}),r.createComponent(h.Show,{get when(){return n().status==="paused"},get children(){return r.createComponent(t.ui.Button,{variant:"ghost-muted",size:"small",get onClick(){return s(()=>e.model.resume(e.session,e.runID))},get children(){return t.t("wf.resume")}})}}),r.createComponent(h.Show,{get when(){return n().status==="running"||n().status==="paused"},get children(){return r.createComponent(Ie,{icon:"stop",get label(){return t.t("wf.stop")},get onClick(){return s(()=>e.model.stop(e.session,e.runID))}})}}),r.createComponent(t.ui.Menu,{get label(){return t.t("wf.more")},icon:"outline-dots",placement:"bottom-end",get items(){return m()}})]}}),r.createComponent(h.Show,{get when(){return n().error},get children(){var p=Yt();return r.insert(p,()=>n().error),p}}),r.createComponent(ot,{get children(){var p=Zr(),g=p.firstChild,x=g.firstChild;return r.insert(g,r.createComponent(tn,{get parts(){return[r.createComponent(nn,{get status(){return n().status}}),De(t,(n().ended??i())-(n().started??n().created)),l().total>0&&t.t("wf.agents",{done:l().finished,total:l().total}),l().running>0&&t.t("wf.running",{count:l().running}),l().queued>0&&t.t("wf.queued",{count:l().queued}),l().failed>0&&t.t("wf.failed",{count:l().failed}),n().spent>0&&t.t("wf.tokens",{count:Se(n().spent)}),n().total&&t.t("wf.budget",{count:Se(n().total)})]}}),x),r.insert(x,()=>n().description),r.insert(p,r.createComponent(h.Show,{get when(){return n().status==="pending"},get children(){return r.createComponent(Do,r.mergeProps(e,{get run(){return n()}}))}}),null),r.insert(p,r.createComponent(h.Show,{get when(){return n().logs?.length>0},get children(){var $=Xr();return r.insert($,r.createComponent(h.For,{get each(){return r.memo(()=>!!u())()?n().logs:n().logs.slice(-3)},children:b=>(()=>{var v=Qr();return r.insert(v,()=>b.message),v})()}),null),r.insert($,r.createComponent(h.Show,{get when(){return n().logs.length>3},get children(){return r.createComponent(Mo,{onClick:()=>d(!u()),get children(){return r.memo(()=>!!u())()?t.t("wf.logs.less"):t.t("wf.logs.all",{count:n().logs.length})}})}}),null),$}}),null),r.insert(p,r.createComponent(h.For,{get each(){return r.memo(()=>n().status==="pending")()?[]:Er(n().phases??[],o())},children:$=>r.createComponent(h.Show,{get when(){return $.agents.length>0},get children(){var b=eo(),v=b.firstChild,f=v.firstChild,k=f.nextSibling;return r.insert(f,()=>$.title??t.t("wf.phase.none")),r.insert(k,()=>`${Ve($.agents).finished}/${$.agents.length}`),r.insert(b,r.createComponent(h.For,{get each(){return $.agents},children:I=>r.createComponent(Eo,{agent:I,now:i,onOpen:()=>e.nav.go(e.sessionID,{runID:e.runID,agentID:I.id})})}),null),b}})}),null),r.insert(p,r.createComponent(h.Show,{get when(){return r.memo(()=>n().status==="completed")()&&e.model.result(e.runID)!==void 0},get children(){var $=Xt(),b=$.firstChild;return r.insert(b,()=>t.t("wf.result")),r.insert($,r.createComponent(Qt,{get text(){return e.model.result(e.runID)}}),null),$}}),null),p}})]}function Eo(e){const t=y.usePlugin(),n=()=>{const o=e.agent;return o.status==="queued"?t.t("wf.agent.queued"):o.error?o.error:o.status==="running"&&o.lastTool?`${rn(t,o.lastTool.name)} ${o.lastTool.summary}`:o.status==="running"?t.t("session.timeline.working"):o.result?o.result:""};return(()=>{var o=to(),a=o.firstChild,i=a.nextSibling,l=i.nextSibling;return o.$$click=()=>e.onOpen(),r.insert(o,r.createComponent(_e,{get status(){return e.agent.status}}),a),r.insert(a,()=>e.agent.label),r.insert(i,n),r.insert(l,()=>[e.agent.cached&&t.t("wf.cached"),Ae(e.agent)>0&&Se(Ae(e.agent)),e.agent.started&&De(t,(e.agent.ended??e.now())-e.agent.started)].filter(Boolean).join(" · ")),r.effect(()=>i.classList.toggle("text-v2-state-fg-danger",e.agent.status==="failed")),o})()}function Io(e){const t=y.usePlugin(),n=()=>e.model.state.agents[e.runID]?.[e.agentID],o=()=>e.model.detail(e.runID,e.agentID),a=at(()=>n()?.status==="running");y.createKeyed(()=>`${e.runID}/${e.agentID}/${n()?.status}`,()=>{e.model.describe(e.session,e.runID,e.agentID).catch(()=>{})});const i=()=>{const d=n()?.sessionID;d&&t.tabs.open({server:e.session.server.id,id:d},{focus:!0})},l=()=>{e.model.stopAgent(e.session,e.runID,e.agentID).catch(d=>t.toast.show({variant:"error",title:t.t("wf.error"),description:st(d)}))},u=()=>o()?.result??n()?.result;return r.createComponent(h.Show,{get when(){return n()},get children(){return[r.createComponent(rt,{get children(){return[r.createComponent(en,{get label(){return t.t("wf.back.run",{name:e.model.run(e.runID)?.name})},onClick:()=>e.nav.go(e.sessionID,{runID:e.runID})}),(()=>{var d=Vt();return r.insert(d,()=>n().label),d})(),Jt(),r.createComponent(h.Show,{get when(){return n().status==="running"||n().status==="queued"},get children(){return r.createComponent(Ie,{icon:"stop",get label(){return t.t("wf.agent.stop")},onClick:l})}}),r.createComponent(h.Show,{get when(){return n().sessionID},get children(){return r.createComponent(Ie,{icon:"square-arrow-top-right",get label(){return t.t("wf.agent.open")},onClick:i})}})]}}),r.createComponent(h.Show,{get when(){return n().error},get children(){var d=Yt();return r.insert(d,()=>n().error),d}}),r.createComponent(ot,{get children(){var d=ro(),s=d.firstChild,c=s.firstChild,m=c.firstChild;return r.insert(d,r.createComponent(tn,{get parts(){return[r.createComponent(nn,{get status(){return n().status}}),n().started&&De(t,(n().ended??a())-n().started),(()=>{var p=oo();return r.insert(p,()=>n().agentType??"general"),p})(),n().model&&n().model.split("/").pop(),n().phase,Ae(n())>0&&t.t("wf.tokens",{count:Se(Ae(n()))}),n().toolCalls>0&&t.plural("wf.tools",n().toolCalls),n().cached&&t.t("wf.cached")]}}),s),r.insert(d,r.createComponent(h.Show,{get when(){return n().directory},get children(){var p=no();return r.insert(p,()=>n().directory),r.effect(()=>r.setAttribute(p,"title",n().directory)),p}}),s),r.insert(m,()=>o()?.prompt??n().prompt),r.insert(d,r.createComponent(h.Show,{get when(){return n().sessionID},get children(){return r.createComponent(_o,{get session(){return e.session},get sessionID(){return n().sessionID},get directory(){return n().directory??e.session.directory}})}}),null),r.insert(d,r.createComponent(h.Show,{get when(){return u()!==void 0},get children(){var p=Xt(),g=p.firstChild;return r.insert(g,()=>t.t("wf.result")),r.insert(p,r.createComponent(Qt,{get text(){return u()}}),null),p}}),null),d}})]}})}function _o(e){const t=y.usePlugin(),n=()=>e.session.server.data;y.createKeyed(()=>e.sessionID,a=>{n().session.sync(a).catch(()=>{}),n().session.message.sync(a).catch(()=>{})});const o=h.createMemo(()=>n().session.message.list(e.sessionID).flatMap(a=>a.type!=="assistant"?[]:a.content.flatMap((i,l)=>i.type==="tool"?[{key:i.id,kind:"tool",title:rn(t,i.name),running:i.state.status==="running"||i.state.status==="streaming",subtitle:Tr(i.state.input,e.directory),error:i.state.status==="error"?i.state.error?.message:void 0}]:i.type==="text"&&i.text.trim()?[{key:`${a.id}:${l}`,kind:"text",text:i.text}]:[])));return r.createComponent(h.Show,{get when(){return o().length>0},get children(){var a=so();return r.insert(a,r.createComponent(h.For,{get each(){return o()},children:i=>(()=>{var l=ao();return r.insert(l,(()=>{var u=r.memo(()=>i.kind==="tool");return()=>u()?(()=>{var d=co(),s=d.firstChild,c=s.firstChild,m=c.firstChild,p=m.firstChild,g=p.firstChild;return r.insert(g,r.createComponent(qo,{get text(){return i.title},get active(){return i.running}})),r.insert(p,r.createComponent(h.Show,{get when(){return i.subtitle},get children(){var x=io();return r.insert(x,()=>i.subtitle),x}}),null),r.insert(p,r.createComponent(h.Show,{get when(){return i.error},get children(){var x=lo();return r.insert(x,()=>i.error),x}}),null),d})():(()=>{var d=Zt(),s=d.firstChild;return r.insert(s,r.createComponent(t.ui.Markdown,{get text(){return i.text}})),d})()})()),l})()})),a}})}function Do(e){const t=y.usePlugin(),n=()=>e.session.server.data,[o,a]=h.createSignal(!1);y.createKeyed(()=>e.run.sessionID,u=>{n().session.permission.sync(u).catch(()=>{})});const i=()=>(n().session.permission.list(e.run.sessionID)??[]).find(u=>u.source?.id===e.run.toolCall||u.action==="workflow"&&u.resources[0]===e.run.name),l=u=>{const d=i();d&&(a(!0),n().session.permission.reply({sessionID:d.sessionID,requestID:d.id,decision:u}).catch(s=>t.toast.show({variant:"error",title:t.t("wf.error"),description:st(s)})).finally(()=>a(!1)))};return(()=>{var u=po(),d=u.firstChild,s=d.firstChild,c=s.firstChild,m=c.firstChild,p=m.nextSibling,g=s.nextSibling,x=g.firstChild,$=x.firstChild,b=$.nextSibling,v=d.nextSibling,f=v.firstChild,k=f.nextSibling;return r.insert(m,r.createComponent(t.ui.Icon,{name:"warning"})),r.insert(p,()=>t.t("wf.approve.title")),r.insert(b,()=>t.t("wf.approve.note")),r.insert(g,r.createComponent(h.Show,{get when(){return e.run.phases?.length>0},get children(){var I=uo(),E=I.firstChild,j=E.nextSibling;return r.insert(j,r.createComponent(h.For,{get each(){return e.run.phases},children:M=>(()=>{var R=mo();return r.insert(R,(()=>{var V=r.memo(()=>!!M.detail);return()=>V()?`${M.title}: ${M.detail}`:M.title})()),R})()})),I}}),null),r.insert(k,r.createComponent(t.ui.Button,{variant:"ghost",get disabled(){return o()||!i()},onClick:()=>l("reject"),get children(){return t.t("ui.permission.deny")}}),null),r.insert(k,r.createComponent(t.ui.Button,{variant:"neutral",get disabled(){return o()||!i()},onClick:()=>l("always"),get children(){return t.t("ui.permission.allowAlways")}}),null),r.insert(k,r.createComponent(t.ui.Button,{variant:"submit",get disabled(){return o()||!i()},onClick:()=>l("once"),get children(){return t.t("ui.permission.allowOnce")}}),null),u})()}function Qt(e){const t=y.usePlugin(),n=h.createMemo(()=>{try{return{value:JSON.parse(e.text)}}catch{return{value:e.text}}});return r.createComponent(h.Show,{get when(){return typeof n().value=="string"},get fallback(){return r.createComponent(t.ui.Code,{get content(){return JSON.stringify(n().value,null,2)},language:"json"})},get children(){var o=Zt(),a=o.firstChild;return r.insert(a,r.createComponent(t.ui.Markdown,{get text(){return n().value}})),o}})}function rt(e){return(()=>{var t=fo();return r.insert(t,()=>e.children),t})()}function ot(e){return(()=>{var t=ho();return r.insert(t,()=>e.children),t})()}function en(e){return r.createComponent(Ie,{icon:"outline-arrow-left",get label(){return e.label},get onClick(){return e.onClick}})}function Ie(e){const t=y.usePlugin();return r.createComponent(t.ui.Tooltip,{get value(){return e.label},placement:"top",get children(){return r.createComponent(t.ui.IconButton,{variant:"ghost-muted",size:"large",get icon(){return e.icon},get label(){return e.label},get onClick(){return e.onClick}})}})}function Mo(e){return(()=>{var t=go();return t.$$click=()=>e.onClick(),r.insert(t,()=>e.children),t})()}function tn(e){const t=()=>e.parts.filter(Boolean);return(()=>{var n=vo();return r.insert(n,r.createComponent(h.For,{get each(){return t()},children:(o,a)=>[r.createComponent(h.Show,{get when(){return a()>0},get children(){return wo()}}),(()=>{var i=bo();return r.insert(i,o),i})()]})),n})()}function _e(e){const t=y.usePlugin();return(()=>{var n=$o();return r.insert(n,r.createComponent(h.Switch,{get fallback(){return r.createComponent(It,{still:!0})},get children(){return[r.createComponent(h.Match,{get when(){return e.status==="running"},get children(){return r.createComponent(It,{})}}),r.createComponent(h.Match,{get when(){return e.status==="done"||e.status==="completed"},get children(){return r.createComponent(t.ui.Icon,{name:"check",size:"small"})}}),r.createComponent(h.Match,{get when(){return e.status==="failed"},get children(){return r.createComponent(t.ui.Icon,{name:"circle-xmark",size:"small",class:"text-v2-state-fg-danger"})}}),r.createComponent(h.Match,{get when(){return e.status==="stopped"},get children(){return r.createComponent(t.ui.Icon,{name:"outline-xmark",size:"small"})}}),r.createComponent(h.Match,{get when(){return e.status==="denied"},get children(){return r.createComponent(t.ui.Icon,{name:"circle-ban-sign",size:"small"})}}),r.createComponent(h.Match,{get when(){return e.status==="pending"},get children(){return r.createComponent(t.ui.Icon,{name:"warning",size:"small"})}})]}})),n})()}function nn(e){const t=y.usePlugin();return(()=>{var n=yo();return r.insert(n,r.createComponent(_e,{get status(){return e.status}}),null),r.insert(n,()=>To(t,e.status),null),n})()}function To(e,t){switch(t){case"running":return e.t("session.child.status.running");case"done":case"completed":return e.t("session.child.status.succeeded");case"failed":return e.t("session.child.status.failed");case"stopped":return e.t("session.child.status.interrupted");default:return e.t(`wf.status.${t}`)}}const _t={read:"ui.tool.read",list:"ui.tool.list",glob:"ui.tool.glob",grep:"ui.tool.grep",webfetch:"ui.tool.webfetch",websearch:"ui.tool.websearch",shell:"ui.tool.shell",skill:"ui.tool.skill",execute:"ui.tool.execute",edit:"ui.messagePart.title.edit",write:"ui.messagePart.title.write",patch:"ui.tool.patch"};function rn(e,t){return t==="workflow_output"?e.t("wf.output"):_t[t]?e.t(_t[t]):e.t("ui.basicTool.called",{tool:t})}function qo(e){return(()=>{var t=xo(),n=t.firstChild,o=n.firstChild,a=o.nextSibling;return r.insert(o,()=>e.text),r.insert(a,()=>e.text),r.effect(i=>{var l=e.active?"true":"false",u=e.text,d=e.active?"true":"false";return l!==i.e&&r.setAttribute(t,"data-active",i.e=l),u!==i.t&&r.setAttribute(t,"aria-label",i.t=u),d!==i.a&&r.setAttribute(a,"data-run",i.a=d),i},{e:void 0,t:void 0,a:void 0}),t})()}const De=(e,t)=>Ar(t,(n,o)=>e.t(n,o)),Lo=e=>(e.done??0)+(e.failed??0)+(e.stopped??0),st=e=>e?.message??String(e);function at(e){const[t,n]=h.createSignal(Date.now()),o=setInterval(()=>{e()&&n(Date.now())},1e3);return h.onCleanup(()=>clearInterval(o)),t}r.delegateEvents(["click"]);var Oo=r.template('<div class="flex min-w-0 items-center gap-1.5"><span class=truncate>');const ae="workflows";function No(e){const t=`${e.id}:${ae}`,[n,o]=we.createStore({}),a={get:s=>n[s]??{},go:(s,c)=>o(s,{runID:void 0,agentID:void 0,...c})},i=Dr(e,{onStart:s=>{const c=e.sessions.current();!c||Q(c)!==s.sessionID||(a.go(s.sessionID,{runID:s.id}),e.layout.open(t,c,{tab:"select",background:!0}))}}),l=s=>{const c=e.sessions.current();c&&(s&&a.go(Q(c),s),e.layout.open(t,c,{tab:"select"}))},u=s=>i.active(Q(s)),d={id:ae,get title(){return e.t("wf.title")},closable:"hover",label:s=>{const c=()=>u(s.session);return(()=>{var m=Oo(),p=m.firstChild;return r.insert(m,r.createComponent(e.ui.Icon,{name:"fork",class:"shrink-0"}),p),r.insert(p,()=>e.t("wf.title")),r.insert(m,(()=>{var g=r.memo(()=>c().length>0);return()=>g()&&r.createComponent(_e,{status:"running"})})(),null),m})()}};e.add(y.Panel,{id:ae,region:"side",mobile:{get title(){return e.t("wf.title")},order:46,kind:"menu",icon:"fork"},list:s=>s.open.includes(ae)?[d]:[],render:s=>r.createComponent(ko,{get session(){return s.session},model:i,nav:a})}),e.add(y.MenuItem,()=>{const s=e.sessions.current(),c=s?u(s).length:0;return{menu:"session.panel",id:ae,title:e.t("wf.title"),icon:"fork",keybind:`${e.id}.workflows`,order:40,...c>0&&{description:e.t("wf.running",{count:c})},opened:!!s&&e.layout.state(t,s)!=="closed",run:()=>l()}}),e.add(y.ComposerPill,{id:ae,order:10,show:s=>{const c=Q(s.session),m=i.active(c),p=i.ultracode(c);if(m.length===0&&!p)return;const g=m.map($=>{const b=Ve(Object.values(i.state.agents[$.id]??{})),v=Math.max(b.total,$.counts?.total??0),f=Math.max(b.finished,($.counts?.done??0)+($.counts?.failed??0)+($.counts?.stopped??0));return{id:$.id,label:$.name,icon:"fork",tone:$.status==="pending"?"warning":$.counts?.failed?"danger":void 0,detail:$.status==="pending"||$.status==="paused"?e.t(`wf.status.${$.status}`):e.t("wf.agents",{done:f,total:v}),run:()=>l({runID:$.id})}});return p&&g.push({id:"ultracode",label:e.t("wf.ultracode.off"),icon:"close-small",run:()=>{i.setUltracode(s.session,c,!1)}}),{icon:"fork",label:m.length===1?`${m[0].name} · ${g[0].detail}`:m.length>1?e.t("wf.pill.many",{count:m.length}):e.t("wf.ultracode"),title:e.t("wf.title"),tone:m.some($=>$.status==="pending")?"warning":void 0,rows:g}}}),e.add(y.Command,()=>({id:"workflows",title:e.t("wf.command.show"),keywords:"workflow workflows ultracode agents runs fan out orchestration",enabled:!!e.sessions.current(),run:()=>{const s=e.sessions.current();s&&e.layout.toggle(t,s)}})),e.add(y.Command,()=>{const s=e.sessions.current(),c=!!s&&i.ultracode(Q(s));return{id:"ultracode",title:e.t(c?"wf.command.ultracode.off":"wf.command.ultracode.on"),keywords:"ultracode workflow workflows effort orchestration agents",enabled:!!s,run:()=>{s&&i.setUltracode(s,Q(s),!c)}}})}const Po={"wf.title":"Workflows","wf.ultracode":"Ultracode","wf.ultracode.hint":"Run each substantive task as a workflow","wf.ultracode.off":"Turn off ultracode","wf.empty.title":"No workflows in this session","wf.empty.body":"Ask for one in your own words, or put the keyword ultracode in a prompt. Agents of each run show here while they work.","wf.status.pending":"Waiting for approval","wf.status.paused":"Paused","wf.status.denied":"Denied","wf.status.queued":"Queued","wf.agents":"{{done}} of {{total}} agents","wf.running":"{{count}} running","wf.queued":"{{count}} queued","wf.failed":"{{count}} failed","wf.tokens":"{{count}} tokens","wf.budget":"budget {{count}}","wf.tools.one":"{{count}} tool call","wf.tools.other":"{{count}} tool calls","wf.cached":"cached","wf.back.runs":"All workflows","wf.back.run":"Back to {{name}}","wf.pause":"Pause","wf.resume":"Resume","wf.stop":"Stop","wf.more":"More actions","wf.save.project":"Save as a command for this project","wf.save.personal":"Save as a command for me","wf.saved":"Saved as {{name}}","wf.copy.script":"Copy the script path","wf.copy.id":"Copy the run ID","wf.reveal":"Show the script in the file manager","wf.error":"The workflow action did not complete","wf.logs.all":"Show all {{count}} messages","wf.logs.less":"Show fewer messages","wf.phase.none":"Other agents","wf.result":"Result","wf.output":"Returned output","wf.agent.queued":"Waits for a free slot","wf.agent.open":"Open session","wf.agent.stop":"Stop agent","wf.approve.title":"Run this workflow?","wf.approve.note":"A workflow can start many agents, and it can use far more tokens than a normal turn. Its agents use your permission rules.","wf.pill.many":"{{count}} workflows","wf.command.show":"Show workflows","wf.command.ultracode.on":"Turn on ultracode for this session","wf.command.ultracode.off":"Turn off ultracode for this session"},Ye=60*1e3,jo=60*Ye,Dt="tab.new",Ue="sidecar";function Ro(e){const t=Ft(e.options),{shelf:n,groups:o,working:a}=e.stores,i=(w,A)=>C=>r.insert(C,()=>h.createComponent(e.ui.Icon,{name:w,...A})),l=()=>{const w=e.sessions.current();try{const A=w?.server.data.session;return!!w&&(A.status(w.id)==="running"||A.pending.list(w.id).some(C=>C.type!=="synthetic"))}catch{return!1}},u=()=>n.update(w=>{w.archivedOpen=!w.archivedOpen}),d=async w=>(await e.client.project.list()).filter(C=>(C.name||C.canonical.split("/").pop())===w).toSorted((C,_)=>_.time.active-C.time.active)[0],s=async w=>{const A=await d(w);if(!A)return e.layout.project(Ue,e.t("session.new"));e.layout.draft({server:Ue,directory:A.canonical,prompt:""})},c=w=>Un({name:w,label:e.t("session.newIn",{project:w}),icon:i("plus",{size:"small"}),onSelect:()=>{s(w).catch(()=>e.toast.show({title:e.t("session.failed",{project:w})}))}}),m=async(w,A)=>{const C={directory:w};let{data:_}=await e.client.shell.create({location:C,command:A,timeout:Ye});try{for(;_.status==="running";)await new Promise(re=>setTimeout(re,100)),_=(await e.client.shell.get({id:_.id,location:C})).data;const{data:B}=await e.client.shell.output({id:_.id,location:C});return{ok:_.exit===0,output:B.output}}finally{e.client.shell.remove({id:_.id,location:C}).catch(()=>{})}},p=async(w,A)=>{try{const C=await d(w),_=C&&await m(C.canonical,Yn(A));return _?.ok?Xn(_.output):void 0}finally{M()}},g=async w=>{const A=await En(w,()=>e.client.project.list()),C=A&&await m(A,Cn);return C?.ok?{directory:A,...In(C.output)}:void 0},x=async(w,A,C)=>{const _=B=>e.toast.show({variant:"error",title:C,description:B.trim()});try{const B=await m(w,_n(...A));if(!B.ok)return _(B.output);const re=e.servers.get(Ue)?.data;re?.location.vcs.invalidate({directory:w}),await re?.location.vcs.sync({directory:w})}catch(B){_(String(B?.message??B))}},$=(w,A)=>h.createRoot(C=>{const[_,B]=h.createSignal(),[re,it]=h.createSignal(!1);let Me=!1;const Te=()=>{Me||(Me=!0,g(A).catch(()=>{}).then(D=>B(D??null)).finally(()=>{Me=!1}))},lt=async(D,J)=>{it(!0),await x(_().directory,D,J),it(!1),Te()},cn=D=>{D!==_().current&&lt([D],e.t("branch.failed",{branch:D}))},un=async()=>{const D=_().current,oe=(await e.dialogs.prompt({title:e.t("branch.create"),description:D&&e.t("branch.from",{branch:D}),placeholder:e.t("branch.name"),submit:e.t("branch.submit")}))?.trim().replace(/\s+/g,"-");oe&&await lt(["-c",oe],e.t("branch.uncreated",{branch:oe}))},ct=(D,J=D)=>({label:J,onSelect:()=>cn(D)}),dn=()=>{const D=_();if(D===void 0)return[{label:e.t("branch.loading"),disabled:!0}];if(D===null)return[{label:e.t("branch.unlisted"),disabled:!0}];const J=[{label:e.t("branch.new"),icon:"plus",onSelect:()=>{un()}},{type:"separator"}],oe=D.local.map(qe=>ct(qe));if(D.remote.length===0)return[...J,...oe];const pn=D.remote.map(({name:qe,ref:fn})=>ct(qe,fn)),mn={type:"group",label:e.t("branch.remote"),items:pn};return[...J,...oe,{type:"separator"},mn]};return w.addEventListener("pointerenter",Te),w.addEventListener("focusin",Te),r.insert(w,()=>h.createComponent(e.ui.Menu,{label:e.t("branch.switch"),trigger:"button",placement:"bottom-start",get disabled(){return re()},get items(){return dn()}})),C}),b=kr({ui:e.ui,label:e.t("message.copy"),copied:e.t("message.copied"),write:w=>e.system.copy(w).then(()=>!0,()=>(e.toast.show({title:e.t("message.copyFailed")}),!1))}),v=e.use(hn.Browser),f=w=>{const A=v(),C=e.sessions.current();return A.status!=="active"||!C||!A.value.canOpen(C)?!1:(A.value.open(C,w),!0)},k=()=>{zn(n.value.archivedOpen),zt(o.value.enabled,a.value.inline),Fn(c),Zn({lookup:p,open:w=>e.system.openExternal(w),label:({number:w,state:A,title:C})=>e.t("pr.label",{number:w,state:e.t(`pr.${A}`),title:C})}),Sn($),An(),Tn(t.hideAgent),qn(V),xr(b),or(t.responseLabel),ar(),sr(l()),ir()&&!E&&(E=setTimeout(()=>{E=0,M()},300))};let I=0,E=0,j=!1;const M=()=>{I||j||(I=requestAnimationFrame(()=>{I=0,k()}))},R=new MutationObserver(M);R.observe(document.body,{childList:!0,subtree:!0});const V=new MutationObserver(M),on=setInterval(M,Ye);document.addEventListener("scrollend",M,!0);const sn=Wn(u),an=fr(w=>h.createRoot(A=>(r.insert(w,()=>{const C=e.sessions.current();return C?gr(hr(C),e.t,e.locale.locale()):[]}),A))),ln=jn(f);return y.createKeyed(()=>`${n.value.archivedOpen}:${o.value.enabled}:${a.value.inline}:${l()}`,k),t.workflows&&No(e),e.add(y.Style,Bn),e.add(y.Style,Jn),e.add(y.Style,kn),e.add(y.Style,Mn(t)),e.add(y.Style,rr(t.responseLabel)),e.add(y.Style,mr),e.add(y.Style,yr),e.add(y.Slot,{at:"session.location.menu",order:100,render:w=>Rn({label:e.t("session.new"),icon:i("edit",{class:"shrink-0 text-v2-icon-icon-muted"}),shortcut:e.keybinds.keybind(Dt).join(""),onSelect:()=>{e.commands.run(Dt)||e.layout.draft({server:w.session.server.id,directory:w.session.directory,prompt:""})}})}),e.add(y.Command,()=>({id:"toggle-archived",title:e.t(n.value.archivedOpen?"archived.hide":"archived.show"),keywords:"archive archived settled sessions sidebar inbox",run:u})),e.add(y.Command,()=>({id:"toggle-groups",title:e.t(o.value.enabled?"groups.off":"groups.on"),keywords:"group project projects folders sessions sidebar inbox",run:()=>o.update(w=>{w.enabled=!w.enabled})})),e.add(y.Command,()=>({id:"toggle-working",title:e.t(a.value.inline?"working.section":"working.inline"),keywords:"working running busy section shelf sessions sidebar inbox",run:()=>a.update(w=>{w.inline=!w.inline})})),()=>{j=!0,R.disconnect(),V.disconnect(),cancelAnimationFrame(I),clearTimeout(E),clearInterval(on),document.removeEventListener("scrollend",M,!0),sn(),an(),ln(),Kn(),er(),Dn(),Ln(),lr(),Sr()}}function Bo(e){const{archiveAfterHours:t}=Ft(e.options);if(e.onCleanup(Nn(e,{app:Le.app,safeStorage:Le.safeStorage,webContents:Le.webContents})),t>0)return bn(e,t*jo)}const zo=y.Plugin.define({stores:{shelf:y.Store.global(X.Schema.Struct({archivedOpen:X.Schema.Boolean}),{archivedOpen:!1}),groups:y.Store.global(X.Schema.Struct({enabled:X.Schema.Boolean}),{enabled:!0}),working:y.Store.global(X.Schema.Struct({inline:X.Schema.Boolean}),{inline:!0})},i18n:{en:{"archived.show":"Show archived sessions","archived.hide":"Hide archived sessions","groups.on":"Group sessions by project","groups.off":"Stop grouping sessions by project","working.inline":"Show working sessions in the list","working.section":"Show working sessions in their own section","session.new":"New session","session.newIn":"New session in {{project}}","session.failed":"Could not start a session in {{project}}","usage.window":"Context window","usage.cacheRead":"Cache read","usage.cacheWrite":"Cache write","usage.input":"Input","usage.reasoning":"Reasoning","usage.output":"Output","usage.cost":"Cost","branch.switch":"Switch branch","branch.loading":"Loading…","branch.unlisted":"Could not list the branches","branch.remote":"Remote","branch.failed":"Could not switch to {{branch}}","branch.new":"New branch…","branch.create":"Create branch","branch.from":"The new branch starts from {{branch}}, with your changes.","branch.name":"Branch name","branch.submit":"Create","branch.uncreated":"Could not create {{branch}}","pr.label":"PR #{{number}}, {{state}}: {{title}}","pr.open":"open","pr.draft":"draft","pr.merged":"merged","pr.closed":"closed","message.copy":"Copy message","message.copied":"Copied","message.copyFailed":"Could not copy the message",...Po}},setup:Ro,main:Bo});exports.default=zo;
