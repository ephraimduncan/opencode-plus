"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const x=require("@opencode/plugin/gui"),$r=require("@opencode/plugin/gui/browser"),le=require("effect"),lt=require("electron"),m=require("solid-js"),t=require("solid-js/web"),ge=require("solid-js/store"),xr=require("@opencode/client/solid"),yr=require("@opencode/plugin/rpc"),Oe=60*1e3,ct=200,Gt=["session.inbox.enqueued","session.execution.started","session.unarchived"],Wt=Symbol.for("opencode-plus.archive");function kr(e,n,r,a){const{created:i,updated:o,busy:s,idle:c,archived:g}=e.time;if(g!==void 0||e.parentID||s!==void 0&&(c===void 0||s>c))return!1;const l=Math.max(i,s??0,c??0);return(Number(e.metadata?.[a])||0)>=l||n-o<2*Oe?!1:n-l>=r}function Cr(e,n){const r=`${e.id}.keptAt`,a=Date.now(),i=new AbortController,o=i.signal,s=y=>e.log.write("error",`${e.id}: ${y?.stack??y}`),c=async()=>{const y=[];let $=await e.client.session.list({parentID:null,archived:!1,limit:ct});for(;;){if(y.push(...$.data),$.data.length<ct||!$.cursor.next)return y;$=await e.client.session.list({cursor:$.cursor.next,limit:ct})}};let g=!1;const l=async()=>{if(!g){g=!0;try{const y=Date.now(),$=(await c()).filter(f=>kr(f,y,n,r));for(const f of $)await e.client.session.update({sessionID:f.id,archived:!0}),e.log.write("info",`${e.id}: archived ${f.id} "${f.title??""}"`)}finally{g=!1}}},d=async y=>{if(!Gt.includes(y.type)||y.created<a-Oe||y.type==="session.inbox.enqueued"&&y.data.item.type!=="user")return;const $=await e.client.session.get({sessionID:y.data.sessionID}),f=$.time.archived;if(y.type!=="session.unarchived"){if(f===void 0||y.created<=f)return;await e.client.session.update({sessionID:$.id,archived:!1}),e.log.write("info",`${e.id}: unarchived ${$.id} on ${y.type}`);return}f!==void 0||(Number($.metadata?.[r])||0)>=y.created||await e.client.session.update({sessionID:$.id,metadata:{...$.metadata,[r]:y.created}})},u=async()=>{for(;!o.aborted;){try{const y=e.client.event.subscribe({types:Gt},{signal:o});for await(const $ of y)d($).catch(s)}catch(y){o.aborted||s(y)}o.aborted||await new Promise(y=>setTimeout(y,5e3))}},h=()=>{l().catch(s)},p=setTimeout(h,Oe),v=setInterval(h,10*Oe),w=()=>{o.aborted||(clearTimeout(p),clearInterval(v),i.abort())};return globalThis[Wt]?.(),globalThis[Wt]=w,e.signal.addEventListener("abort",w,{once:!0}),u(),w}const B=(e,n,r)=>{e.getAttribute(n)!==r&&e.setAttribute(n,r)},he=(e,n,r)=>r===void 0?e.removeAttribute(n):B(e,n,r),vn='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M4.5 6.5L8 9.5L11.5 6.5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',wn='[data-slot="new-session-composer"]',Sr='[data-slot="new-session-location-path"]',_r=["branch","new-branch"].map(e=>`${wn} use[href="#opencode-v2-icon-${e}"]`).join(", "),ne="data-plus-branch",me="data-plus-branch-name",Te="data-plus-branch-trigger",Ae="data-plus-branch-menu",$n="data-plus-branch-current",Ar='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path d="M3.53564 8.17857L6.39279 11.75L12.4642 4.25" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>',Er=`
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
  mask: url("data:image/svg+xml,${encodeURIComponent(vn)}") center / 16px no-repeat;
}
[${ne}]:is(:hover, :has(:focus-visible), :has([data-expanded])) {
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${me}] {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
[${me}]:empty,
[${ne}] > span:has(+ [${me}]:not(:empty)) {
  display: none;
}
[${Te}] {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
[${Te}] > button {
  width: 100%;
  height: 100%;
  opacity: 0;
}
[${Ae}] {
  width: max-content;
  max-width: min(320px, 100vw - 32px);
  max-height: min(320px, var(--kb-popper-content-available-height, 320px));
  overflow-y: auto;
}
[${Ae}] [data-slot="menu-v2-item-content"] {
  flex: 0 1 auto;
  min-width: 0;
}
[${Ae}] [data-component="menu-v2-item"]::after {
  content: "";
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
}
[${Ae}] [${$n}]::after {
  background-color: var(--menu-v2-icon);
  mask: url("data:image/svg+xml,${encodeURIComponent(Ar)}") center / 14px no-repeat;
}
`,Ir="git branch --all --no-color --no-column --sort=-committerdate",we=new Map;function Mr(e){we.forEach(({update:n,dispose:r},a)=>{if(a.isConnected)return n();r(),we.delete(a)}),document.querySelectorAll(_r).forEach(n=>{const r=n.closest("svg").parentElement;if(we.has(r))return;const a=document.createElement("span"),i=document.createElement("div");a.setAttribute(me,""),a.dir="auto",i.setAttribute(Te,""),r.setAttribute(ne,""),r.append(a,i),we.set(r,e(i,r))})}function Dr(e,n){const r=e.querySelector(`[${me}]`),a=n===Et(e)?"":n??"";r.textContent!==a&&(r.textContent=a)}const ut=e=>`${xn(e)}
${Et(e)}`;function Tr(){document.querySelectorAll(`[${Te}] > [aria-controls]`).forEach(e=>{const n=document.getElementById(e.getAttribute("aria-controls"));if(!n)return;const r=e.closest(`[${ne}]`),a=r.querySelector(`[${me}]`).textContent||Et(r);B(n,Ae,""),n.querySelectorAll('[data-component="menu-v2-item"]').forEach(i=>{const o=i.querySelector('[data-slot="menu-v2-item-content"] > span');he(i,$n,i.textContent.trim()===a?"":void 0),o&&he(i,"title",o.scrollWidth>o.clientWidth?o.textContent:void 0)})})}async function Rr(e,n){const r=xn(e);if(!r.includes("…"))return r||void 0;const[a,i]=r.split("…");return(await n()).flatMap(o=>[o.canonical,...o.sandboxes]).find(o=>o.startsWith(a)&&o.endsWith(i))}function qr(e){const n=new Set,r=[],a=new Map;let i;for(const s of e.split(/\r?\n/)){const c=s.slice(2).trim();if(!(!c||c.startsWith("(")||c.includes(" -> "))){if(c.startsWith("remotes/")){const g=c.slice(8),l=g.slice(g.indexOf("/")+1);a.has(l)||a.set(l,g);continue}n.add(c),s.startsWith("*")&&(i=c),s.startsWith("+")||r.push(c)}}const o=Array.from(a,([s,c])=>({name:s,ref:c})).filter(({name:s})=>!n.has(s));return{current:i,local:r,remote:o}}const Lr=(...e)=>["git","switch",...e.map(re)].join(" "),re=e=>/^[\w./-]+$/.test(e)?e:`'${e.replaceAll("'","'\\''")}'`;function Nr(){we.forEach(({dispose:e})=>e()),we.clear(),document.querySelectorAll(`[${me}], [${Te}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${ne}]`).forEach(e=>e.removeAttribute(ne))}const xn=e=>e.closest(wn)?.querySelector(Sr)?.textContent??"",Et=e=>e.querySelector(":scope > span").textContent.trim(),yn='[data-slot="composer-controls"]',kn=`${yn} > div > [data-component="tooltip-v2-trigger"]`,Cn='[data-action="composer-model"]',Sn=`${kn}:has(~ [data-component="tooltip-v2-trigger"] ${Cn})`,_n=`${kn}:has(${Cn}) ~ [data-component="tooltip-v2-trigger"]`,Be="data-plus-hidden-agent",Fe="data-plus-variant-menu";function Pr({lowercaseVariants:e}){return`
${Sn}[${Be}] {
  display: none;
}
${e?`${_n} .capitalize,
[${Fe}] .capitalize {
  text-transform: lowercase;
}`:""}
`}function Or(e){document.querySelectorAll(Sn).forEach(n=>{const r=e!==!1&&n.textContent.trim().toLowerCase()===e.toLowerCase();he(n,Be,r?"":void 0)}),document.querySelectorAll(`${_n} [aria-controls]`).forEach(n=>{const r=document.getElementById(n.getAttribute("aria-controls"));r&&B(r,Fe,"")})}const Vt=new WeakSet;function zr(e){document.querySelectorAll(yn).forEach(n=>{Vt.has(n)||(Vt.add(n),e.observe(n,{subtree:!0,characterData:!0}))})}function Br(){document.querySelectorAll(`[${Be}]`).forEach(e=>e.removeAttribute(Be)),document.querySelectorAll(`[${Fe}]`).forEach(e=>e.removeAttribute(Fe))}const Fr="browser.cookies",Kt=1e3,Jt=Symbol.for("opencode-plus.cookies");function Ur(e,{app:n,safeStorage:r,webContents:a}){globalThis[Jt]?.();const i=$=>e.log.write("warn",`${e.id}: ${$?.stack??$}`),o=r.isEncryptionAvailable()?e.storage.store(Fr,{schema:le.Schema.String,initial:""}):void 0,s=()=>{if(!o?.value)return[];try{const $=Date.now()/Kt;return JSON.parse(r.decryptString(Buffer.from(o.value,"base64"))).filter(_=>_.expirationDate===void 0||_.expirationDate>$)}catch($){return i($),[]}},c=new Map(s().map($=>[dt($),$]));let g;const l=()=>{clearTimeout(g),g=void 0,o.set(r.encryptString(JSON.stringify([...c.values()])).toString("base64"))},d=()=>{o&&(g??=setTimeout(l,Kt))},u=new Map,h=($,f,_)=>{const q=dt(f),T=$.sent.get(q)??[];T.push(_),$.sent.set(q,T),$.session.cookies.set(_?Yt(f):{...Yt(f),expirationDate:1}).catch(S=>{const D=T.indexOf(_);D>=0&&T.splice(D,1),i(S)})},p=($,f,_,q)=>{if(q&&_==="overwrite")return;const T=dt(f),C=q?"":JSON.stringify(f),S=$.sent.get(T)??[],D=S.indexOf(C);if(D>=0){S.splice(0,D+1),S.length===0&&$.sent.delete(T);return}if(C!==(c.has(T)?JSON.stringify(c.get(T)):"")){q?c.delete(T):c.set(T,f);for(const P of u.values())P!==$&&h(P,f,C);d()}},v=$=>{if($.isPersistent()||u.has($))return;const f={session:$,sent:new Map,listener:(_,q,T,C)=>p(f,Hr(q),T,C)};u.set($,f),$.cookies.on("changed",f.listener);for(const _ of c.values())h(f,_,JSON.stringify(_))};n.on("session-created",v);const w=($,f)=>v(f.session);n.on("web-contents-created",w);for(const $ of a.getAllWebContents())v($.session);const y=()=>{n.off("session-created",v),n.off("web-contents-created",w);for(const $ of u.values())$.session.cookies.off("changed",$.listener);u.clear(),g&&l()};return globalThis[Jt]=y,y}function Hr({name:e,value:n,domain:r,path:a,secure:i,httpOnly:o,sameSite:s,expirationDate:c}){return{name:e,value:n,domain:r,path:a,secure:i,httpOnly:o,sameSite:s,...c!==void 0&&{expirationDate:c}}}function dt({domain:e,path:n,name:r}){return[e,n,r].join("	")}function Yt({domain:e,...n}){const r=e.replace(/^\./,"");return{...n,url:`${n.secure?"https":"http"}://${r}${n.path}`,...e!==r&&{domain:e}}}const Gr=/^\/([^/]+)\/([^/]+)\/(pull|issues)\/(\d+)(?:\/|$)/;function $e(e){if(!URL.canParse(e))return;const n=new URL(e),r=n.host.toLowerCase().replace(/^www\./,""),a=n.pathname.match(Gr),i=r==="github.com"||r.endsWith(".ghe.com")||r.split(/[.:]/).includes("github");if(!(!a||!i||!/^https?:$/.test(n.protocol)||r.endsWith(".github.io")))return`${n.protocol}//${r}/${a[1].toLowerCase()}/${a[2].toLowerCase()}/${a[3]}/${a[4]}`}function X(e){const n=new URL(e),[r,a,i,o]=n.pathname.slice(1).split("/");return{origin:n.origin,owner:r,repo:a,kind:i==="pull"?"pull":"issue",number:Number(o)}}const qe="GH_NO_UPDATE_NOTIFIER=1 GH_PROMPT_DISABLED=1 gh",Wr=["number","title","url","state","isDraft","author","body","baseRefName","headRefName","headRefOid","isCrossRepository","headRepositoryOwner","additions","deletions","changedFiles","createdAt","mergedAt","closedAt","mergedBy","mergeable","mergeStateStatus","reviewDecision","autoMergeRequest","labels","assignees","milestone","reviewRequests","latestReviews","reviews","comments","commits","files","statusCheckRollup"],Vr=["number","title","url","state","stateReason","author","body","createdAt","closedAt","labels","assignees","milestone","issueType","parent","subIssuesSummary","comments","closedByPullRequestsReferences"];function Kr(e){const n=X(e).kind==="pull";return`${qe} ${n?"pr":"issue"} view ${re(e)} --json ${(n?Wr:Vr).join(",")} 2>&1`}function Jr(e,n){const{origin:r,owner:a,repo:i,number:o}=X(e),s=new URL(r).host==="github.com"?"":` --hostname ${re(new URL(r).host)}`,c=`.[] | select(.filename == ${JSON.stringify(n)}) | .patch // empty`;return`${qe} api${s} ${re(`repos/${a}/${i}/pulls/${o}/files?per_page=100`)} --paginate --jq ${re(c)} 2>&1`}function Yr(e){const{origin:n,owner:r,repo:a}=X(e);return`${qe} repo view ${re(`${n}/${r}/${a}`)} --json viewerDefaultMergeMethod,squashMergeAllowed,mergeCommitAllowed,rebaseMergeAllowed,viewerPermission 2>&1`}const Qr=`${qe} pr view --json url --jq .url 2>&1`,jr={merge:e=>["pr merge",`--${e}`],auto:e=>["pr merge",`--${e} --auto`],manual:()=>["pr merge","--disable-auto"],ready:()=>["pr ready",""],draft:()=>["pr ready","--undo"],update:()=>["pr update-branch",""],close:(e,n)=>[`${n==="pull"?"pr":"issue"} close`,""],reopen:(e,n)=>[`${n==="pull"?"pr":"issue"} reopen`,""]};function Zr(e,n,r){const[a,i]=jr[n](r,X(e).kind);return[qe,a,re(e),i,"2>&1"].filter(Boolean).join(" ")}function Xr(e){return/command not found|not recognized as/i.test(e)?{reason:"cli"}:/gh auth login|GH_TOKEN|authentication/i.test(e)?{reason:"auth"}:/Could not resolve to an? (PullRequest|Issue)|HTTP 404/i.test(e)?{reason:"gone"}:{reason:"other",detail:e.trim().split(/\r?\n/).slice(-4).join(`
`)}}function ea(e,n){return X(e).kind==="pull"?ra(n):/\/pull\/\d+$/.test(n.url)?{moved:$e(n.url)}:aa(n)}function ta(e){const n=[e.squashMergeAllowed&&"squash",e.mergeCommitAllowed&&"merge",e.rebaseMergeAllowed&&"rebase"].filter(Boolean),r=e.viewerDefaultMergeMethod?.toLowerCase();return{methods:n.includes(r)?[r,...n.filter(a=>a!==r)]:n,write:["ADMIN","MAINTAIN","WRITE"].includes(e.viewerPermission)}}const na={SUCCESS:"pass",FAILURE:"fail",ERROR:"fail",TIMED_OUT:"fail",STARTUP_FAILURE:"fail",CANCELLED:"fail",ACTION_REQUIRED:"pending",PENDING:"pending",EXPECTED:"pending",SKIPPED:"skip",NEUTRAL:"skip",STALE:"skip"},Qt=["fail","pending","pass","skip"],Ue={APPROVED:"approved",CHANGES_REQUESTED:"changes",COMMENTED:"commented",DISMISSED:"dismissed"};function ra(e){const n=ua(e.statusCheckRollup??[]);return{kind:"pull",number:e.number,title:e.title,url:e.url,body:He(e.body),state:e.state==="OPEN"&&e.isDraft?"draft":e.state.toLowerCase(),gate:la(e,n),author:K(e.author),base:e.baseRefName,branch:e.headRefName,sha:e.headRefOid,fork:e.isCrossRepository?e.headRepositoryOwner?.login:void 0,sync:ca(e),commits:(e.commits??[]).length,additions:e.additions,deletions:e.deletions,changed:e.changedFiles,created:W(e.createdAt),merged:W(e.mergedAt),closed:W(e.closedAt),mergedBy:K(e.mergedBy),autoMerge:e.autoMergeRequest?.mergeMethod?.toLowerCase(),labels:En(e),assignees:(e.assignees??[]).map(K),milestone:e.milestone?.title,decision:e.reviewDecision||void 0,checks:n,reviewers:da(e),files:(e.files??[]).map(r=>({path:r.path,additions:r.additions,deletions:r.deletions,change:r.changeType.toLowerCase()})),events:An(e)}}function aa(e){return{kind:"issue",number:e.number,title:e.title,url:e.url,body:He(e.body),state:e.state==="OPEN"?"open":e.stateReason==="NOT_PLANNED"?"skipped":"done",author:K(e.author),created:W(e.createdAt),closed:W(e.closedAt),labels:En(e),assignees:(e.assignees??[]).map(K),milestone:e.milestone?.title,type:e.issueType?.name,parent:e.parent?.url&&{number:e.parent.number,title:e.parent.title,url:e.parent.url},subIssues:e.subIssuesSummary?.total>0?e.subIssuesSummary:void 0,pulls:(e.closedByPullRequestsReferences??[]).map(n=>({number:n.number,url:n.url})),events:An(e)}}function It(e){const n={pass:0,fail:0,pending:0,skip:0};for(const r of e)n[r.result]+=1;return n}function ia(e){const n=[];let r=0,a=0,i=1;for(const o of e.split(`
`)){const s=o.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,\d+)? @@ ?(.*)$/);if(s){r=Number(s[1]),a=Number(s[3]),n.push({skipped:Math.max(0,r-i),heading:s[4],lines:[]}),i=r+Number(s[2]??1);continue}const c=n.at(-1);!c||o===""||o.startsWith("\\")||(o[0]==="+"?c.lines.push({type:"add",after:a++,text:o.slice(1)}):o[0]==="-"?c.lines.push({type:"del",before:r++,text:o.slice(1)}):c.lines.push({type:"same",before:r++,after:a++,text:o.slice(1)}))}return n}function oa(e,n,r,a){const i=Math.floor((n-e)/6e4);if(i<1)return r("ui.message.time.justNow");if(i<60)return r("ui.message.time.minutesAgo",{count:String(i)});if(i<1440)return r("ui.message.time.hoursAgo",{count:String(Math.floor(i/60))});if(i<720*60)return r("ui.message.time.daysAgo",{count:String(Math.floor(i/60/24))});const o=new Date(e).getFullYear()===new Date(n).getFullYear()?void 0:"numeric";return new Intl.DateTimeFormat(a,{month:"short",day:"numeric",year:o}).format(e)}function sa(e,n,r){const{owner:a,repo:i}=X($e(e.url)),o=[`the ${e.kind==="pull"?"pull request":"issue"} ${a}/${i}#${e.number}`];return o.push(`Title: ${e.title}`,`URL: ${e.url}`),e.kind==="pull"&&o.push(`Branch: ${e.fork?`${e.fork}:`:""}${e.branch}, into ${e.base}`),n==="conflicts"&&o.push(`The branch has merge conflicts with ${e.base}.`),n==="checks"&&o.push("Checks that failed on the last commit:",...e.checks.filter(s=>s.result==="fail"&&(!r||s===r)).map(s=>`- ${[s.workflow,s.name].filter(Boolean).join(" / ")}${s.url?`: ${s.url}`:""}`)),n==="review"&&o.push("Reviews that request changes:",...e.events.filter(s=>s.kind==="review"&&s.verdict==="changes").map(s=>`@${s.user}: ${s.body?s.body.slice(0,2e3):"(no summary)"}`)),n==="issue"&&e.body&&o.push("",e.body.slice(0,6e3)),o.join(`
`)}function la(e,n){const r=It(n);return e.mergedAt?"merged":e.state==="CLOSED"?"closed":e.isDraft?"draft":e.mergeable==="CONFLICTING"||e.mergeStateStatus==="DIRTY"?"conflicts":e.reviewDecision==="CHANGES_REQUESTED"?"changes":r.fail>0?"failing":e.reviewDecision==="REVIEW_REQUIRED"?"review":r.pending>0?"pending":e.mergeStateStatus==="BEHIND"?"behind":e.mergeStateStatus==="BLOCKED"?"blocked":e.mergeStateStatus==="UNKNOWN"?"unknown":"ready"}function ca(e){if(!(e.state!=="OPEN"||e.mergeStateStatus==="UNKNOWN"))return e.mergeable==="CONFLICTING"||e.mergeStateStatus==="DIRTY"?"conflicts":e.mergeStateStatus==="BEHIND"?"behind":"current"}function ua(e){const n=new Map;for(const r of e){const a=r.__typename==="CheckRun",i={name:a?r.name:r.context,workflow:a&&r.workflowName||void 0,result:a&&r.status!=="COMPLETED"?"pending":na[a?r.conclusion:r.state]??"skip",url:(a?r.detailsUrl:r.targetUrl)||void 0,started:W(r.startedAt),ended:a?W(r.completedAt):void 0},o=`${i.workflow}
${i.name}`,s=n.get(o);(!s||s.result!=="pending"&&(i.result==="pending"||i.started>s.started))&&n.set(o,i)}return[...n.values()].sort((r,a)=>Qt.indexOf(r.result)-Qt.indexOf(a.result)||r.name.localeCompare(a.name))}function da(e){const n=K(e.author),r=new Map;for(const a of e.latestReviews??[]){const i=K(a.author);i&&i!==n&&Ue[a.state]&&r.set(i,{login:i,verdict:Ue[a.state]})}for(const a of e.reviewRequests??[]){const i=K(a)??a.slug??a.name;i&&r.set(i,{login:i,verdict:"requested"})}return[...r.values()]}function An(e){const n=W(e.createdAt),r=[{kind:"opened",user:K(e.author),time:n},...(e.comments??[]).filter(a=>!a.isMinimized).map(a=>({kind:"comment",user:K(a.author),time:W(a.createdAt),body:He(a.body),url:a.url,reactions:Zt(a.reactionGroups)})),...(e.reviews??[]).filter(a=>Ue[a.state]).map(a=>({kind:"review",user:K(a.author),time:W(a.submittedAt),verdict:Ue[a.state],body:He(a.body),reactions:Zt(a.reactionGroups)})),...(e.commits??[]).map(a=>({kind:"commit",user:K(a.authors?.[0])||a.authors?.[0]?.name,time:Math.max(W(a.committedDate),n),oid:a.oid,headline:a.messageHeadline}))];return e.mergedAt?r.push({kind:"merged",user:K(e.mergedBy),time:W(e.mergedAt)}):e.state==="CLOSED"&&r.push({kind:"closed",time:W(e.closedAt)}),r.toSorted((a,i)=>a.time-i.time)}const jt={THUMBS_UP:"👍",THUMBS_DOWN:"👎",LAUGH:"😄",HOORAY:"🎉",CONFUSED:"😕",HEART:"❤️",ROCKET:"🚀",EYES:"👀"},Zt=e=>(e??[]).filter(n=>jt[n.content]&&n.users?.totalCount>0).map(n=>({emoji:jt[n.content],count:n.users.totalCount})),En=e=>(e.labels??[]).map(({name:n,color:r})=>({name:n,color:r})),W=e=>e?Date.parse(e):void 0,K=e=>e?.login?.replace(/^app\//,""),He=e=>(e??"").replace(/<!--[\s\S]*?-->/g,"").trim(),z='[data-slot="sidebar-inbox"]',Mt='[data-slot="sidebar-inbox-scroll"]',Ie='[data-slot="sidebar-inbox-working"]',Dt=`${Mt} > div.pt-3`,M='[data-slot="sidebar-inbox-item"]',U="data-plus-shelf",j="data-plus-toggle",Tt="data-plus-count",H="data-plus-group",Ge="data-plus-gap",Q="data-plus-member",de="data-plus-inline",te="data-plus-add",gt=`${z} ${M}[data-status="ready"]:not([data-state="active"], :hover:not(:has([${te}]:hover)), :focus-visible, [${U}] > *)`,ga=`
${Dt} {
  order: 100000;
  margin-top: auto;
}
${z}[${de}] {
  overflow-y: auto;
  gap: 1px;
  padding-bottom: 4px;
}
[${de}] > ${Mt},
[${de}] > ${Ie},
[${de}] > ${Ie} > div {
  display: contents;
}
[${de}] > ${Ie} > button {
  display: none;
}
[${U}] > [${j}] {
  border-radius: 6px;
}
[${U}] > [${j}]:hover {
  color: var(--color-v2-text-text-base);
}
[${U}] > [${j}]:focus-visible {
  outline: none;
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${U}] > [${j}]::before {
  content: attr(${Tt});
  order: 1;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-faint);
}
[${U}] > [${j}]::after {
  content: "";
  order: 2;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-inline-start: auto;
  background-color: currentColor;
  mask: url("data:image/svg+xml,${encodeURIComponent(vn)}") center / 16px no-repeat;
}
[${U}="closed"] > [${j}]::after {
  rotate: -90deg;
}
[${U}="closed"] > [${j}]:dir(rtl)::after {
  rotate: 90deg;
}
[${U}="closed"] > ${M}:not([data-state="active"]) {
  display: none;
}
${z} ${M}[data-status="working"] {
  opacity: 1;
}
${z} ${M}[data-status="working"] > span:nth-of-type(2) {
  color: var(--color-v2-text-text-base);
}
/* T3 Code's Working colors: sky-600 text and a sky-500 pulsing dot, or sky-300 at 80% in dark mode. */
${z} {
  --plus-working: oklch(58.8% 0.158 241.966);
  --plus-working-dot: oklch(68.5% 0.169 237.323);
  --plus-working-peak: oklch(74.6% 0.16 232.661);
}
[data-color-scheme="dark"] ${z} {
  --plus-working: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-dot: oklch(82.8% 0.111 230.318 / 0.8);
  --plus-working-peak: oklch(95.1% 0.026 236.824);
}
${z} ${M}[data-status="working"] > span:first-child > span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--plus-working);
}
${z} ${M}[data-status="working"] > span:first-child > span:last-child > span {
  color: inherit;
}
${z} ${M}[data-status="working"] [data-component="text-shimmer"] {
  --text-shimmer-base-color: var(--plus-working);
  --text-shimmer-peak-color: var(--plus-working-peak);
}
${z} ${M}[data-status="working"] > span:first-child > span:last-child::before {
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
  ${z} ${M}[data-status="working"] > span:first-child > span:last-child::before {
    animation: none;
  }
}
${z} ${M} > span,
${z} ${M} > span:first-child > span {
  transition: opacity 150ms;
}
${gt}:not([${Q}]) > span,
${gt}[${Q}] > span:not(:first-child),
${gt}[${Q}] > span:first-child > span:last-child {
  opacity: 0.6;
}
/* In a project group the heading names the project, so rows drop their project line and show the time beside the
   title: the first line dissolves into the row's grid, keeping only its last part, the time or status. */
${M}[${Q}] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "title status";
  column-gap: 8px;
}
${M}[${Q}] > span:first-child {
  display: contents;
}
${M}[${Q}] > span:first-child > span:not(:last-child) {
  display: none;
}
${M}[${Q}] > span:first-child > span:last-child {
  grid-area: status;
}
${M}[${Q}] > span:nth-of-type(2) {
  grid-area: title;
}
${M}[${Q}] > span:nth-of-type(3) {
  grid-column: 1 / -1;
}
/* The same space before every project; a group's heading takes its own 28px on top of it. */
${M}[${Ge}] {
  margin-top: 16px;
}
${M}[${H}] {
  position: relative;
  margin-top: 28px;
}
${M}[${H}][${Ge}] {
  margin-top: 44px;
}
${M}[${H}]::before {
  content: attr(${H});
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
${M}[${H}] > span:first-child > span:first-child {
  display: flex;
  position: absolute;
  inset-inline-start: 6px;
  bottom: calc(100% + 8px);
  pointer-events: none;
}
/* The heading's + button, at the far end of its 24px line, its icon in line with the times of the rows below. */
${M}[${H}] > [${te}] {
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
${M}[${H}] > [${te}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
${M}[${H}]:not([data-state="active"]):has(> [${te}]:hover) {
  background-color: transparent;
}
`,Ee=e=>e?Array.from(e.children).filter(n=>n.matches(M)):[],xt=e=>e.querySelector(":scope > span:first-child > span.truncate")?.textContent?.trim(),In=e=>{e.style.removeProperty("order"),e.style.length===0&&e.removeAttribute("style"),e.removeAttribute(H),e.removeAttribute(Ge),e.removeAttribute(Q)};function ha(e){const n=e?"open":"closed";document.querySelectorAll(Dt).forEach(r=>{const a=r.firstElementChild;!a||a.matches(M)||(B(r,U,n),B(a,j,""),B(a,Tt,String(Ee(r).length)),B(a,"role","button"),B(a,"tabindex","0"),B(a,"aria-expanded",String(e)))})}function ma(e){const n=i=>i.target instanceof Element?i.target.closest(`${Dt} > [${j}]`):null,r=i=>{n(i)&&e()},a=i=>{i.key!=="Enter"&&i.key!==" "||!n(i)||(i.preventDefault(),e())};return document.addEventListener("click",r),document.addEventListener("keydown",a),()=>{document.removeEventListener("click",r),document.removeEventListener("keydown",a)}}const Xt=(e,n,r=[])=>{const a=[...r,...e];if(!n&&r.length===0)return a.forEach(In);const i=new Map;a.forEach(s=>{const c=n&&xt(s)||s;i.set(c,[...i.get(c)??[],s])});let o=0;Array.from(i).forEach(([s,c],g)=>{const l=n&&typeof s=="string"&&c.length>1;c.forEach((d,u)=>{o+=1,d.style.order!==String(o)&&(d.style.order=String(o)),he(d,H,l&&u===0?s:void 0),he(d,Q,l?"":void 0),he(d,Ge,n&&g>0&&u===0?"":void 0)})})};function Mn(e,n){document.querySelectorAll(z).forEach(r=>{const a=r.querySelector(`:scope > ${Mt}`),i=r.querySelector(`:scope > ${Ie} > div`),o=new Set;n?(B(r,de,""),r.querySelector(`:scope > ${Ie} > button[aria-expanded="false"]`)?.click(),Xt(Ee(a),e,Ee(i)),o.add(a).add(i)):r.removeAttribute(de),new Set(Array.from(r.querySelectorAll(M),s=>s.parentElement)).forEach(s=>{if(o.has(s))return;const c=s.getAttribute(U)==="closed",g=Ee(s).filter(l=>!c||l.getAttribute("data-state")==="active");Ee(s).filter(l=>!g.includes(l)).forEach(In),Xt(g,e)})})}function pa(e){document.querySelectorAll(`${M} > [${te}]`).forEach(n=>{n.parentElement.getAttribute(H)!==n.getAttribute(te)&&n.remove()}),document.querySelectorAll(`${M}[${H}]`).forEach(n=>{n.querySelector(`:scope > [${te}]`)||n.append(e(n.getAttribute(H)))})}function fa({name:e,label:n,icon:r,onSelect:a}){const i=document.createElement("div");return i.setAttribute(te,e),i.setAttribute("role","button"),i.setAttribute("aria-label",n),i.setAttribute("title",n),r(i),Dn(i,a),i}function Dn(e,n){const r=a=>{a.preventDefault(),a.stopPropagation(),n()};e.setAttribute("tabindex","0"),e.addEventListener("pointerdown",a=>a.stopPropagation()),e.addEventListener("click",r),e.addEventListener("keydown",a=>{(a.key==="Enter"||a.key===" ")&&r(a)})}function ba(){Mn(!1,!1),document.querySelectorAll(`[${te}]`).forEach(e=>e.remove()),document.querySelectorAll(`[${U}]`).forEach(e=>e.removeAttribute(U)),document.querySelectorAll(`[${j}]`).forEach(e=>{[j,Tt,"role","tabindex","aria-expanded"].forEach(n=>e.removeAttribute(n))})}const va=`${M} > span:nth-of-type(3)`,wa=':scope > span > span[dir="ltr"]',Z="data-plus-pr",en="data-plus-pr-url",$a=120*1e3,Ne=e=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${e}</svg>`,ke={open:Ne('<circle cx="5" cy="6" r="3"/><path d="M5 9v12"/><circle cx="19" cy="18" r="3"/><path d="m15 9-3-3 3-3"/><path d="M12 6h5a2 2 0 0 1 2 2v7"/>'),draft:Ne('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 6V5"/><path d="M18 11v-1"/><path d="M6 9v12"/>'),merged:Ne('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>'),closed:Ne('<circle cx="6" cy="6" r="3"/><path d="M6 9v12"/><path d="m21 3-6 6"/><path d="m21 9-6-6"/><path d="M18 11.5V15"/><circle cx="18" cy="18" r="3"/>')},xe={open:["oklch(59.6% 0.145 163.225)","oklch(84.5% 0.143 164.978 / 0.9)"],draft:["oklch(55.2% 0.016 285.938)","oklch(70.5% 0.015 286.067 / 0.8)"],merged:["oklch(54.1% 0.281 293.009)","oklch(81.1% 0.111 293.571 / 0.9)"],closed:["oklch(57.7% 0.245 27.325)","oklch(80.8% 0.114 19.571 / 0.9)"]},xa=`
[${Z}] {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  margin-inline-start: auto;
  padding-inline: 2px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}
[${Z}] ~ .ms-auto {
  margin-inline-start: 0;
}
[${Z}]:is(:hover, :focus-visible) {
  outline: none;
  color: var(--color-v2-text-text-base);
  background-color: var(--color-v2-overlay-simple-overlay-hover);
}
[${Z}]::before {
  content: "";
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  background-color: var(--plus-pr);
}
${Object.keys(ke).map(e=>`[${Z}="${e}"] {
  --plus-pr: ${xe[e][0]};
}
[data-color-scheme="dark"] [${Z}="${e}"] {
  --plus-pr: ${xe[e][1]};
}
[${Z}="${e}"]::before {
  mask: url("data:image/svg+xml,${encodeURIComponent(ke[e])}") center / 12px no-repeat;
}`).join(`
`)}
`,ya=e=>`git remote get-url origin && GH_NO_UPDATE_NOTIFIER=1 gh pr list --state all --limit 20 --json number,title,url,state,isDraft,updatedAt,headRepositoryOwner --head ${re(e)} 2>/dev/null`;function ka(e){const[n,...r]=e.trim().split(/\r?\n/),a=n.match(/[:/]([^/:]+)\/[^/]+$/)?.[1].toLowerCase(),i=JSON.parse(r.join(`
`)).filter(c=>c.headRepositoryOwner?.login.toLowerCase()===a).toSorted((c,g)=>Date.parse(g.updatedAt)-Date.parse(c.updatedAt)),o=i.find(c=>c.state==="OPEN")??i[0];if(!o)return;const s=o.state==="OPEN"&&o.isDraft?"draft":o.state.toLowerCase();return{number:o.number,title:o.title,url:o.url,state:s}}const ye=new Map;let yt=new Set,tn=Promise.resolve();function Ca({lookup:e,open:n,label:r}){const a=Date.now(),i=Array.from(document.querySelectorAll(va),s=>{const c=s.querySelector(wa),g=c?.textContent.trim(),l=s.parentElement;return{line:s,row:l,branch:g,key:g&&`${xt(l)}
${g}`,holder:c?.parentElement}}),o=new Set(i.filter(({row:s,key:c})=>c&&s.getAttribute("data-status")==="working").map(({key:s})=>s));yt.forEach(s=>{const c=ye.get(s);!o.has(s)&&c?.time!==void 0&&(c.time=0)}),yt=o,i.forEach(({line:s,row:c,branch:g,key:l,holder:d})=>{const u=l&&ye.get(l);let h=s.querySelector(`:scope > [${Z}]`);l&&(!u||u.time!==void 0&&a-u.time>=$a)&&Sa(l,()=>e(xt(c),g));const p=u?.pull;if(!p)return h?.remove();h||(h=document.createElement("span"),h.setAttribute("role","link"),Dn(h,()=>n(h.getAttribute(en))));const v=r(p);h.previousElementSibling!==d&&d.after(h),B(h,Z,p.state),B(h,en,p.url),B(h,"title",v),B(h,"aria-label",v),h.textContent!==`#${p.number}`&&(h.textContent=`#${p.number}`)})}const Sa=(e,n)=>{const r=tn.then(n).catch(()=>{});ye.set(e,{pull:ye.get(e)?.pull}),tn=r,r.then(a=>ye.set(e,{time:Date.now(),pull:a}))};function _a(){ye.clear(),yt=new Set,document.querySelectorAll(`[${Z}]`).forEach(e=>e.remove())}const I=e=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${e}</svg>`,nn=e=>`url("data:image/svg+xml,${encodeURIComponent(e)}")`,Aa=[...Object.keys(ke).map(e=>({kind:"pull",state:e,svg:ke[e],color:xe[e]})),{kind:"issue",state:"open",svg:I('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/>'),color:xe.open},{kind:"issue",state:"done",svg:I('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'),color:xe.merged},{kind:"issue",state:"skipped",svg:I('<circle cx="12" cy="12" r="10"/><line x1="9" x2="15" y1="15" y2="9"/>'),color:xe.draft}],Ea={merge:ke.merged,pull:ke.open,warning:I('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>'),hammer:I('<path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/>'),reply:I('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="m10 7-3 3 3 3"/><path d="M17 13v-1a2 2 0 0 0-2-2H7"/>'),clock:I('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),sync:I('<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>'),reopen:I('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),eye:I('<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>'),commit:I('<circle cx="12" cy="12" r="3"/><line x1="3" x2="9" y1="12" y2="12"/><line x1="15" x2="21" y1="12" y2="12"/>'),comment:I('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),users:I('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),user:I('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),tag:I('<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5"/>'),milestone:I('<path d="M12 13v8"/><path d="M12 3v3"/><path d="M4 6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h13a2 2 0 0 0 1.152-.365l3.424-2.317a1 1 0 0 0 0-1.635l-3.424-2.318A2 2 0 0 0 17 6z"/>'),branch:I('<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>'),file:I('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M9 10h6"/><path d="M12 13V7"/><path d="M9 17h6"/>'),external:I('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),sort:I('<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>'),terminal:I('<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>'),checks:I('<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>'),zap:I('<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>'),box:I('<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'),parent:I('<polyline points="14 9 9 4 4 9"/><path d="M20 20h-7a4 4 0 0 1-4-4V4"/>'),tree:I('<path d="M21 12h-8"/><path d="M21 6H8"/><path d="M21 18h-8"/><path d="M3 6v4c0 1.1.9 2 2 2h3"/><path d="M3 10v6c0 1.1.9 2 2 2h3"/>'),check:I('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'),cross:I('<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>'),chevron:I('<path d="m9 18 6-6-6-6"/>'),unfold:I('<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>'),fold:I('<path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/>'),copy:I('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>')},b="[data-plus-github]",Ia=`
[data-plus-github-state] {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  background-color: var(--plus-state);
}
[data-plus-github-state][data-size="small"] {
  width: 14px;
  height: 14px;
}
${Aa.map(({kind:e,state:n,svg:r,color:a})=>`[data-plus-github-state="${e}:${n}"] {
  --plus-state: ${a[0]};
  mask: ${nn(r)} center / contain no-repeat;
}
[data-color-scheme="dark"] [data-plus-github-state="${e}:${n}"] {
  --plus-state: ${a[1]};
}`).join(`
`)}
[data-plus-glyph] {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  background-color: currentColor;
  mask: var(--plus-glyph) center / contain no-repeat;
}
[data-plus-glyph][data-size="small"] {
  width: 12px;
  height: 12px;
}
${Object.entries(Ea).map(([e,n])=>`[data-plus-glyph="${e}"] { --plus-glyph: ${nn(n)}; }`).join(`
`)}

/* The header: T3 Code's crumbs, title, meta line and branch line. */
${b} [data-slot="title"] {
  font-size: 16px;
  font-weight: 530;
  line-height: 22px;
  letter-spacing: -0.16px;
  color: var(--color-v2-text-text-base);
  text-wrap: pretty;
  overflow-wrap: anywhere;
}
${b} [data-slot="chip"] {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding-inline: 6px 8px;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-v2-text-text-muted);
  background: var(--color-v2-background-bg-layer-01);
  box-shadow: inset 0 0 0 0.5px var(--color-v2-border-border-base);
  transition: color 0.15s, background-color 0.15s;
}
${b} [data-slot="chip"]:hover {
  color: var(--color-v2-text-text-base);
  background: var(--color-v2-background-bg-layer-02);
}

/* The tab bar: the app's segmented control on the start, the state of the view on the end. */
${b} [data-slot="tabbar"] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding-block: 10px;
  border-block: 0.5px solid var(--color-v2-border-border-muted);
}
${b} [data-slot="segmented-control-v2"] {
  isolation: isolate;
  display: flex;
  flex: none;
  align-items: center;
  width: fit-content;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: var(--color-v2-background-bg-layer-01);
  box-shadow: 0 0 0 0.5px var(--color-v2-border-border-base);
  user-select: none;
}
${b} [data-slot="segmented-control-v2-item"] {
  display: flex;
  flex: none;
  flex-direction: row;
  white-space: nowrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  font-weight: 440;
  line-height: 100%;
  letter-spacing: -0.04px;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-muted);
  transition: color 0.15s, background-color 0.12s, box-shadow 0.12s;
}
${b} [data-slot="segmented-control-v2-item"]:hover:not([data-pressed]) {
  color: var(--color-v2-text-text-base);
}
${b} [data-slot="segmented-control-v2-item"][data-pressed] {
  color: var(--color-v2-text-text-base);
  background: var(--color-v2-background-bg-base);
  box-shadow: 0 0 0 0.5px var(--color-v2-border-border-strong);
}
${b} [data-slot="segmented-control-v2-item"]:focus-visible {
  outline: 2px solid var(--color-v2-border-border-focus);
  outline-offset: 1px;
}
${b} [data-slot="segmented-control-v2-item"] [data-slot="count"] {
  color: var(--color-v2-text-text-faint);
}

/* The meta rows of T3 Code's summary: an icon and a label, then the value. */
${b} [data-slot="meta"] {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 28px;
  font-size: 12px;
  line-height: 16px;
}
${b} [data-slot="meta"] > :first-child {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-v2-text-text-muted);
}
${b} [data-slot="meta"] > :last-child {
  min-width: 0;
  color: var(--color-v2-text-text-base);
}

/* A label in its GitHub color, tinted as T3 Code tints it. */
${b} [data-slot="label"] {
  display: inline-flex;
  align-items: center;
  max-width: 192px;
  height: 20px;
  padding-inline: 8px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 530;
  color: color-mix(in oklch, var(--plus-label) 35%, var(--color-v2-text-text-base));
  background: color-mix(in oklch, var(--plus-label) 12%, transparent);
  box-shadow: inset 0 0 0 0.5px color-mix(in oklch, var(--plus-label) 30%, transparent);
}
[data-color-scheme="dark"] ${b} [data-slot="label"] {
  color: color-mix(in oklch, var(--plus-label) 55%, var(--color-v2-text-text-base));
  background: color-mix(in oklch, var(--plus-label) 18%, transparent);
}

/* Avatars, and the ring and badge of a reviewer's verdict. */
${b} [data-slot="avatar"] {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  border-radius: 9999px;
}
${b} [data-slot="avatar"] > img,
${b} [data-slot="avatar"] > [data-slot="initial"] {
  width: var(--plus-avatar, 16px);
  height: var(--plus-avatar, 16px);
  border-radius: 9999px;
  object-fit: cover;
  background: var(--color-v2-background-bg-layer-02);
}
${b} [data-slot="avatar"] > [data-slot="initial"] {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--plus-avatar, 16px) * 0.45);
  font-weight: 530;
  text-transform: uppercase;
  color: var(--color-v2-text-text-muted);
}
${b} [data-slot="avatars"] {
  display: flex;
  align-items: center;
}
${b} [data-slot="avatars"] > * + * {
  margin-inline-start: -4px;
}
${b} [data-slot="avatars"] [data-slot="avatar"] {
  box-shadow: 0 0 0 2px var(--color-v2-background-bg-base);
}
${b} [data-slot="avatar"][data-verdict="approved"] {
  box-shadow: 0 0 0 2px var(--color-v2-state-fg-success);
}
${b} [data-slot="avatar"][data-verdict="changes"] {
  box-shadow: 0 0 0 2px var(--color-v2-state-fg-danger);
}
${b} [data-slot="avatar"] > [data-slot="badge"] {
  position: absolute;
  inset-inline-end: -3px;
  bottom: -3px;
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  background: var(--color-v2-background-bg-base);
}
${b} [data-slot="avatar"] > [data-slot="badge"] > [data-plus-glyph] {
  width: 10px;
  height: 10px;
}
${b} [data-slot="avatar"][data-verdict="approved"] > [data-slot="badge"] {
  color: var(--color-v2-state-fg-success);
}
${b} [data-slot="avatar"][data-verdict="changes"] > [data-slot="badge"] {
  color: var(--color-v2-state-fg-danger);
}

/* T3 Code's collapsible sections: the heading stays at the top while its section scrolls. */
${b} [data-slot="section"] > [data-slot="heading"] {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-v2-background-bg-base);
}
${b} [data-slot="section"] > [data-slot="heading"] > button {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 6px;
  padding-block: 12px;
  text-align: start;
  font-size: 12px;
  font-weight: 530;
  color: var(--color-v2-text-text-muted);
}
${b} [data-slot="section"] > [data-slot="heading"] > button:hover {
  color: var(--color-v2-text-text-base);
}
${b} [data-slot="section"] > [data-slot="heading"] [data-plus-glyph="chevron"] {
  color: var(--color-v2-icon-icon-faint);
  transition: transform 0.15s;
}
${b} [data-slot="section"][data-open] > [data-slot="heading"] [data-plus-glyph="chevron"] {
  transform: rotate(90deg);
}
${b} [data-slot="section"] + [data-slot="section"] {
  border-top: 0.5px solid var(--color-v2-border-border-muted);
}

/* A comment as T3 Code's card: a header with who and when, then the text. */
${b} [data-slot="comment"] {
  min-width: 0;
  overflow: hidden;
  border: 0.5px solid var(--color-v2-border-border-base);
  border-radius: 8px;
  background: var(--color-v2-background-bg-base);
}
${b} [data-slot="comment"] > header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  min-height: 36px;
  padding: 6px 6px 6px 12px;
  font-size: 12px;
  color: var(--color-v2-text-text-muted);
  background: var(--color-v2-background-bg-layer-01);
  border-bottom: 0.5px solid var(--color-v2-border-border-muted);
}
${b} [data-slot="comment"] > header:last-child {
  border-bottom: none;
}
${b} [data-slot="comment"] > [data-slot="body"] {
  padding: 10px 12px 12px;
}
${b} [data-slot="verdict"] {
  font-size: 11.5px;
  font-weight: 530;
}
${b} [data-slot="verdict"][data-verdict="approved"] {
  color: var(--color-v2-state-fg-success);
}
${b} [data-slot="verdict"][data-verdict="changes"] {
  color: var(--color-v2-state-fg-danger);
}
${b} [data-slot="reactions"] {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 12px 10px;
}
${b} [data-slot="reaction"] {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding-inline: 6px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-muted);
  box-shadow: inset 0 0 0 0.5px var(--color-v2-border-border-base);
}

/* The timeline of T3 Code: each event hangs on one line by its marker, an avatar or a glyph. */
${b} [data-slot="timeline"] {
  position: relative;
  display: flex;
  flex-direction: column;
}
${b} [data-slot="timeline"]::before {
  content: "";
  position: absolute;
  inset-inline-start: 15.5px;
  top: 20px;
  bottom: 20px;
  width: 1px;
  background: var(--color-v2-border-border-muted);
}
${b} [data-slot="event"] {
  position: relative;
  min-width: 0;
  padding-inline-start: 44px;
  padding-bottom: 20px;
}
${b} [data-slot="event"] > [data-slot="marker"] {
  position: absolute;
  inset-inline-start: 0;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-v2-icon-icon-muted);
  background: var(--color-v2-background-bg-base);
}
${b} [data-slot="event"] > [data-slot="marker"] > [data-slot="ring"] {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 9999px;
  background: var(--color-v2-background-bg-layer-01);
  box-shadow: inset 0 0 0 0.5px var(--color-v2-border-border-base);
}
${b} [data-slot="event"] > [data-slot="line"] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 6px;
  min-height: 32px;
  font-size: 12.5px;
  line-height: 18px;
  color: var(--color-v2-text-text-muted);
}
${b} [data-slot="event"] > [data-slot="line"] > strong {
  font-weight: 530;
  color: var(--color-v2-text-text-base);
}
${b} [data-slot="event"] > [data-slot="comment"] {
  margin-top: 4px;
}
${b} [data-slot="commit"] {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 32px;
  text-align: start;
}
${b} [data-slot="commit"]:hover [data-slot="headline"] {
  color: var(--color-v2-text-text-accent);
}

/* The rows of checks and reviewers. */
${b} [data-slot="row"] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding-inline: 8px;
  margin-inline: -8px;
  border-radius: 6px;
  font-size: 12.5px;
}
${b} button[data-slot="row"]:hover,
${b} [data-slot="row"]:has(> button:first-child:hover) {
  background: var(--color-v2-background-bg-layer-02);
}

/* Markdown starts at the top of its box: the timeline's text part keeps its space from the message above. */
${b} [data-component="text-part"],
${b} [data-component="markdown"] > :first-child > :first-child,
${b} [data-component="markdown"] > :first-child:not([data-markdown-block]) {
  margin-top: 0;
}

/* A file's diff, in the diff colors of the app's theme: line numbers, a sign, then the code. */
${b} [data-slot="diff"] {
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 20px;
}
${b} [data-slot="diff-rows"] {
  width: max-content;
  min-width: 100%;
}
${b} [data-slot="diff-hunk"] {
  position: sticky;
  inset-inline-start: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding-inline: 14px 12px;
  font-family: var(--font-family-sans);
  font-size: 12px;
  color: var(--color-v2-text-text-muted);
  background: var(--surface-diff-hidden-weak);
  border-block: 0.5px solid var(--color-v2-border-border-muted);
}
${b} [data-slot="diff-hunk"]:first-child {
  border-top: none;
}
${b} [data-slot="diff-line"] {
  display: flex;
  color: var(--color-v2-text-text-base);
}
${b} [data-slot="diff-number"] {
  flex: none;
  width: 48px;
  padding-inline: 8px;
  text-align: end;
  font-variant-numeric: tabular-nums;
  color: var(--color-v2-text-text-faint);
  user-select: none;
}
${b} [data-slot="diff-sign"] {
  flex: none;
  width: 20px;
  text-align: center;
  color: var(--color-v2-text-text-faint);
  user-select: none;
}
${b} [data-slot="diff-code"] {
  flex: 1;
  padding-inline-end: 16px;
  white-space: pre;
}
${b} [data-slot="diff-line"][data-type="add"] {
  background: var(--surface-diff-add-base);
}
${b} [data-slot="diff-line"][data-type="add"] > [data-slot="diff-number"] {
  color: var(--text-diff-add-base);
  background: var(--surface-diff-add-strong);
}
${b} [data-slot="diff-line"][data-type="add"] > [data-slot="diff-sign"] {
  color: var(--text-diff-add-base);
}
${b} [data-slot="diff-line"][data-type="del"] {
  background: var(--surface-diff-delete-base);
}
${b} [data-slot="diff-line"][data-type="del"] > [data-slot="diff-number"] {
  color: var(--text-diff-delete-base);
  background: var(--surface-diff-delete-strong);
}
${b} [data-slot="diff-line"][data-type="del"] > [data-slot="diff-sign"] {
  color: var(--text-diff-delete-base);
}

/* The loading state: bars in the shape of the header, as T3 Code's ghost. */
${b} [data-slot="ghost"] {
  height: 12px;
  border-radius: 4px;
  background: var(--color-v2-background-bg-layer-02);
  animation: plus-github-ghost 1.4s ease-in-out infinite;
}
@keyframes plus-github-ghost {
  50% {
    opacity: 0.5;
  }
}
@media (prefers-reduced-motion: reduce) {
  ${b} [data-slot="ghost"] {
    animation: none;
  }
}
`;function Ma(e){const[n,r]=ge.createStore({items:{},repos:{}}),a=new Map,i=(l,d,u=0)=>{const h=n.items[l];if(a.has(l)||Date.now()-(h?.time??-1/0)<u)return a.get(l);r("items",l,{busy:!0});const p=g(d,Kr(l),v=>({item:ea(l,JSON.parse(v.slice(v.indexOf("{"))))})).then(({item:v,error:w})=>{v&&v.sha!==n.items[l].item?.sha&&r("items",l,"patches",void 0),v&&r("items",l,"item",ge.reconcile(v)),r("items",l,{error:w,busy:!1,time:Date.now()})}).finally(()=>a.delete(l));return a.set(l,p),p},o=(l,d,u)=>{const h=n.items[l]?.patches?.[u],p=v=>r("items",l,"patches",w=>({...w,[u]:v}));h&&!h.error||(p({busy:!0}),g(d,Jr(l,u),v=>({text:v.trimEnd()})).then(v=>p({busy:!1,...v})))},s=(l,d)=>{const u=rn(l);n.repos[u]||(r("repos",u,{busy:!0}),g(d,Yr(l),h=>ta(JSON.parse(h.slice(h.indexOf("{"))))).then(h=>r("repos",u,{busy:!1,...h})))},c=async(l,d,u,h)=>{const{error:p}=await g(d,Zr(l,u,h),()=>({}));return await a.get(l),await i(l,d),p},g=(l,d,u)=>e(l,d).then(({ok:h,output:p})=>h?u(p):{error:Xr(p)}).catch(h=>({error:{reason:"other",detail:String(h?.message??h)}}));return{state:n,load:i,loadPatch:o,loadRepo:s,change:c,repo:rn}}const rn=e=>{const{origin:n,owner:r,repo:a}=X(e);return`${n}/${r}/${a}`};var Da=t.template('<div class="h-11 shrink-0 flex items-center gap-2 px-3 border-b-[0.5px] border-v2-border-border-muted">'),Ta=t.template('<div class="min-h-0 flex-1 overflow-y-auto"data-scrollable>'),Ra=t.template('<button type=button class="flex h-8 w-fit items-center gap-1 rounded-[6px] px-2 text-[13px] font-[440] text-v2-text-text-muted hover:bg-v2-background-bg-layer-02 hover:text-v2-text-text-base">');function Ze(e){return(()=>{var n=Da();return t.insert(n,()=>e.children),n})()}function Xe(e){return(()=>{var n=Ta();return t.insert(n,()=>e.children),n})()}function Ce(e){const n=x.usePlugin();return t.createComponent(n.ui.Tooltip,{get value(){return e.label},placement:"top",get children(){return t.createComponent(n.ui.IconButton,{variant:"ghost-muted",size:"large",get icon(){return e.icon},get label(){return e.label},get busy(){return e.busy},get onClick(){return e.onClick}})}})}function Tn(e){return(()=>{var n=Ra();return n.$$click=()=>e.onClick(),t.insert(n,()=>e.children),n})()}function Le(e,n=1e3){const[r,a]=m.createSignal(Date.now()),i=setInterval(()=>{e()&&a(Date.now())},n);return m.onCleanup(()=>clearInterval(i)),r}t.delegateEvents(["click"]);var Rn=t.template("<span aria-hidden=true>"),qa=t.template('<span class="flex items-center gap-1.5">'),La=t.template("<img alt>"),Na=t.template("<span data-slot=badge>"),Pa=t.template("<span data-slot=avatar>"),Oa=t.template("<span data-slot=initial>"),za=t.template('<span class="flex min-w-0 items-center gap-1.5"><span class="min-w-0 truncate text-12-medium text-v2-text-text-base">'),Ba=t.template('<span class="shrink-0 tabular-nums">'),Fa=t.template('<span data-component=diff-changes data-appearance=compact class="flex shrink-0 items-center gap-1.5 font-mono text-[11px] tabular-nums"><span data-slot=diff-changes-additions class=text-v2-state-fg-success></span><span data-slot=diff-changes-deletions class=text-v2-state-fg-danger>'),Ua=t.template("<span data-slot=label><span class=truncate>"),Ha=t.template("<div data-component=text-part class=min-w-0><div data-slot=text-part-body>"),Ga=t.template("<span data-slot=verdict>"),Wa=t.template('<button type=button class="flex size-6 items-center justify-center rounded-[6px] text-v2-icon-icon-muted hover:bg-v2-background-bg-layer-02 hover:text-v2-text-text-base">'),Va=t.template("<div data-slot=body>"),Ka=t.template("<div data-slot=reactions>"),Ja=t.template('<article data-slot=comment><header><span class="min-w-0 flex-1">'),Ya=t.template("<span data-slot=reaction><span>"),Qa=t.template('<span class="tabular-nums text-v2-text-text-faint">'),ja=t.template("<div class=pb-4>"),Za=t.template("<section data-slot=section><div data-slot=heading><button type=button><span class=truncate>"),Xa=t.template('<button type=button><span class="min-w-0 truncate">');const ei=60*1e3;function N(e){return(()=>{var n=Rn();return t.effect(r=>{var a=e.name,i=e.size,o=e.class;return a!==r.e&&t.setAttribute(n,"data-plus-glyph",r.e=a),i!==r.t&&t.setAttribute(n,"data-size",r.t=i),o!==r.a&&t.className(n,r.a=o),r},{e:void 0,t:void 0,a:void 0}),n})()}function Se(e){const n=x.usePlugin();return t.createComponent(m.Show,{get when(){return e.state},get fallback(){return t.createComponent(n.ui.Icon,{name:"github",class:"shrink-0 text-v2-icon-icon-muted"})},get children(){var r=Rn();return t.effect(a=>{var i=`${e.kind}:${e.state}`,o=e.size;return i!==a.e&&t.setAttribute(r,"data-plus-github-state",a.e=i),o!==a.t&&t.setAttribute(r,"data-size",a.t=o),a},{e:void 0,t:void 0}),r}})}function V(e){return(()=>{var n=qa();return t.insert(n,t.createComponent(N,{get name(){return e.glyph}}),null),t.insert(n,()=>e.children,null),n})()}function We(e){const[n,r]=m.createSignal(!1);return(()=>{var a=Pa();return t.insert(a,t.createComponent(m.Show,{get when(){return t.memo(()=>!!e.login)()&&!n()},get fallback(){return(()=>{var i=Oa();return t.insert(i,()=>(e.login??"?").slice(0,1)),i})()},get children(){var i=La();return i.addEventListener("error",()=>r(!0)),t.effect(()=>t.setAttribute(i,"src",`${e.origin}/${e.login}.png?size=64`)),i}}),null),t.insert(a,t.createComponent(m.Show,{get when(){return e.verdict==="approved"||e.verdict==="changes"},get children(){var i=Na();return t.insert(i,t.createComponent(N,{get name(){return e.verdict==="approved"?"check":"cross"}})),i}}),null),t.effect(i=>{var o=e.verdict,s=`${e.size??16}px`;return o!==i.e&&t.setAttribute(a,"data-verdict",i.e=o),s!==i.t&&t.setStyleProperty(a,"--plus-avatar",i.t=s),i},{e:void 0,t:void 0}),a})()}function Rt(e){return(()=>{var n=za(),r=n.firstChild;return t.insert(n,t.createComponent(We,{get login(){return e.login},get origin(){return e.origin}}),r),t.insert(r,()=>e.login??"ghost"),n})()}function Ve(e){const n=x.usePlugin(),r=Le(()=>!0,ei);return(()=>{var a=Ba();return t.insert(a,()=>oa(e.time,r(),n.t,n.locale.locale())),t.effect(()=>t.setAttribute(a,"title",new Date(e.time).toLocaleString(n.locale.locale()))),a})()}function et(e){return(()=>{var n=Fa(),r=n.firstChild,a=r.nextSibling;return t.insert(r,()=>`+${e.additions}`),t.insert(a,()=>`-${e.deletions}`),n})()}function ti(e){return(()=>{var n=Ua(),r=n.firstChild;return t.insert(r,()=>e.name),t.effect(a=>{var i=`#${e.color}`,o=e.name;return i!==a.e&&t.setStyleProperty(n,"--plus-label",a.e=i),o!==a.t&&t.setAttribute(n,"title",a.t=o),a},{e:void 0,t:void 0}),n})()}function qn(e){const n=x.usePlugin();return(()=>{var r=Ha(),a=r.firstChild;return t.insert(a,t.createComponent(n.ui.Markdown,{get text(){return e.text},class:"text-[13px]"})),r})()}function Ln(e){const n=x.usePlugin();return(()=>{var r=Ja(),a=r.firstChild,i=a.firstChild;return t.insert(a,t.createComponent(Rt,{get login(){return e.event.user},get origin(){return e.origin}}),i),t.insert(a,t.createComponent(m.Show,{get when(){return e.event.verdict},get children(){var o=Ga();return t.insert(o,()=>n.t(`github.verdict.${e.event.verdict}`)),t.effect(()=>t.setAttribute(o,"data-verdict",e.event.verdict)),o}}),i),t.insert(a,t.createComponent(Ve,{get time(){return e.event.time}}),i),t.insert(a,()=>e.action,null),t.insert(a,t.createComponent(m.Show,{get when(){return e.event.url},get children(){return t.createComponent(n.ui.Tooltip,{get value(){return n.t("github.open")},placement:"top",get children(){var o=Wa();return o.$$click=()=>e.browse(e.event.url),t.insert(o,t.createComponent(N,{name:"external",size:"small"})),t.effect(()=>t.setAttribute(o,"aria-label",n.t("github.open"))),o}})}}),null),t.insert(r,t.createComponent(m.Show,{get when(){return e.event.body},get children(){var o=Va();return t.insert(o,t.createComponent(qn,{get text(){return e.event.body}})),o}}),null),t.insert(r,t.createComponent(m.Show,{get when(){return e.event.reactions?.length>0},get children(){var o=Ka();return t.insert(o,t.createComponent(m.For,{get each(){return e.event.reactions},children:s=>(()=>{var c=Ya(),g=c.firstChild;return t.insert(g,()=>s.emoji),t.insert(c,()=>s.count,null),c})()})),o}}),null),r})()}function qt(e){const[n,r]=m.createSignal(e.open??!0);return(()=>{var a=Za(),i=a.firstChild,o=i.firstChild,s=o.firstChild;return o.$$click=()=>r(!n()),t.insert(s,()=>e.title),t.insert(o,t.createComponent(m.Show,{get when(){return e.count!==void 0},get children(){var c=Qa();return t.insert(c,()=>e.count),c}}),null),t.insert(o,t.createComponent(N,{name:"chevron",size:"small"}),null),t.insert(i,()=>e.note,null),t.insert(a,t.createComponent(m.Show,{get when(){return n()},get children(){var c=ja();return t.insert(c,()=>e.children),c}}),null),t.effect(c=>{var g=n()?"":void 0,l=n();return g!==c.e&&t.setAttribute(a,"data-open",c.e=g),l!==c.t&&t.setAttribute(o,"aria-expanded",c.t=l),c},{e:void 0,t:void 0}),a})()}function an(e){const n=x.usePlugin(),[r,a]=m.createSignal(!1);let i;m.onCleanup(()=>clearTimeout(i));const o=()=>{n.system.copy(e.value).then(()=>{a(!0),clearTimeout(i),i=setTimeout(()=>a(!1),1600)})};return(()=>{var s=Xa(),c=s.firstChild;return s.$$click=o,t.insert(s,(()=>{var g=t.memo(()=>!!e.glyph);return()=>g()&&t.createComponent(N,{get name(){return t.memo(()=>!!r())()?"check":e.glyph},size:"small"})})(),c),t.insert(c,(()=>{var g=t.memo(()=>!!r());return()=>g()?n.t("github.copied"):e.children??e.value})()),t.effect(g=>{var l=e.class,d=e.slot,u=e.title;return l!==g.e&&t.className(s,g.e=l),d!==g.t&&t.setAttribute(s,"data-slot",g.t=d),u!==g.a&&t.setAttribute(s,"title",g.a=u),g},{e:void 0,t:void 0,a:void 0}),s})()}t.delegateEvents(["click"]);var ni=t.template('<div class="flex flex-col gap-3 pt-4"><div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5"><span class="text-14-medium tabular-nums text-v2-text-text-base"></span><span class="flex items-center gap-1 text-12-regular tabular-nums text-v2-text-text-muted"></span><span class="min-w-0 flex-1"></span></div><div data-component=apply-patch-tool><div data-component=accordion data-scope=apply-patch>'),ri=t.template("<span data-slot=apply-patch-directory>"),ai=t.template("<span data-slot=apply-patch-change data-type=added>"),ii=t.template("<span data-slot=apply-patch-change data-type=removed>"),oi=t.template('<div class="px-3 py-2 text-12-regular text-v2-state-fg-danger">'),si=t.template('<div class="px-3 py-2 text-12-regular text-v2-text-text-faint">'),li=t.template('<div class="flex flex-col gap-2 px-3 py-3"><span data-slot=ghost style=width:50%></span><span data-slot=ghost style=width:33%>'),ci=t.template("<div role=region data-slot=accordion-content data-expanded>"),ui=t.template("<div data-slot=accordion-item><h3 data-slot=accordion-header data-component=sticky-accordion-header><button type=button data-slot=accordion-trigger><div data-slot=apply-patch-trigger-content><div data-slot=apply-patch-file-info><div data-slot=apply-patch-file-name-container><span data-slot=apply-patch-filename></span></div></div><div data-slot=apply-patch-trigger-actions>"),di=t.template("<div data-slot=diff data-component=apply-patch-file-diff><div data-slot=diff-rows>"),gi=t.template("<span>"),hi=t.template('<div data-slot=diff-hunk><span class="truncate font-mono">'),mi=t.template("<div data-slot=diff-line><span data-slot=diff-number></span><span data-slot=diff-number></span><span data-slot=diff-sign></span><span data-slot=diff-code>");function pi(e){const n=x.usePlugin(),[r,a]=m.createSignal(""),[i,o]=m.createSignal(new Set),s=()=>{const l=r().trim().toLowerCase();return l?e.item.files.filter(d=>d.path.toLowerCase().includes(l)):e.item.files},c=()=>s().length>0&&s().every(l=>i().has(l.path)),g=(l,d=!i().has(l))=>{const u=new Set(i());d?(u.add(l),e.load(l)):u.delete(l),o(u)};return(()=>{var l=ni(),d=l.firstChild,u=d.firstChild,h=u.nextSibling;h.nextSibling;var p=d.nextSibling,v=p.firstChild;return t.insert(u,()=>n.plural("github.changed",e.item.changed)),t.insert(d,t.createComponent(et,{get additions(){return e.item.additions},get deletions(){return e.item.deletions}}),h),t.insert(h,t.createComponent(N,{name:"commit",size:"small"}),null),t.insert(h,()=>n.plural("github.commits.count",e.item.commits),null),t.insert(d,t.createComponent(n.ui.Button,{variant:"ghost-muted",size:"small",get disabled(){return s().length===0},onClick:()=>s().forEach(w=>g(w.path,!c())),get children(){return t.createComponent(V,{get glyph(){return c()?"fold":"unfold"},get children(){return n.t(c()?"github.files.collapse":"github.files.expand")}})}}),null),t.insert(l,t.createComponent(m.Show,{get when(){return e.item.files.length>6},get children(){return t.createComponent(n.ui.TextInput,{type:"search",get label(){return n.t("github.files.filter")},get placeholder(){return n.t("github.files.filter")},get value(){return r()},onInput:a})}}),p),t.insert(v,t.createComponent(m.For,{get each(){return s()},children:w=>t.createComponent(fi,{file:w,get open(){return i().has(w.path)},get patch(){return e.patches?.[w.path]},onToggle:()=>g(w.path)})})),t.insert(l,t.createComponent(m.Show,{get when(){return e.item.changed>e.item.files.length},get children(){return t.createComponent(Tn,{onClick:()=>e.browse(`${e.item.url}/files`),get children(){return n.t("github.files.rest",{count:e.item.changed-e.item.files.length})}})}}),null),l})()}function fi(e){const n=x.usePlugin(),r=e.file.path.lastIndexOf("/"),a=()=>e.open?{"data-expanded":""}:{"data-closed":""};return(()=>{var i=ui(),o=i.firstChild,s=o.firstChild,c=s.firstChild,g=c.firstChild,l=g.firstChild,d=l.firstChild,u=g.nextSibling;return t.spread(i,t.mergeProps(a),!1,!0),t.spread(o,t.mergeProps(a),!1,!0),t.spread(s,t.mergeProps({get"aria-expanded"(){return e.open}},a,{get onClick(){return e.onToggle}}),!1,!0),t.insert(g,t.createComponent(N,{name:"file",class:"text-v2-icon-icon-muted"}),l),t.insert(l,t.createComponent(m.Show,{when:r>=0,get children(){var h=ri();return t.insert(h,()=>`‪${e.file.path.slice(0,r+1)}‬`),h}}),d),t.insert(d,()=>e.file.path.slice(r+1)),t.insert(u,t.createComponent(m.Switch,{get fallback(){return t.createComponent(et,{get additions(){return e.file.additions},get deletions(){return e.file.deletions}})},get children(){return[t.createComponent(m.Match,{get when(){return e.file.change==="added"},get children(){var h=ai();return t.insert(h,()=>n.t("ui.patch.action.created")),h}}),t.createComponent(m.Match,{get when(){return e.file.change==="deleted"},get children(){var h=ii();return t.insert(h,()=>n.t("ui.patch.action.deleted")),h}})]}}),null),t.insert(u,t.createComponent(n.ui.Icon,{name:"chevron-grabber-vertical",size:"small"}),null),t.insert(i,t.createComponent(m.Show,{get when(){return e.open},get children(){var h=ci();return t.insert(h,t.createComponent(m.Switch,{get children(){return[t.createComponent(m.Match,{get when(){return e.patch?.text},get children(){return t.createComponent(bi,{get text(){return e.patch.text}})}}),t.createComponent(m.Match,{get when(){return e.patch?.error},get children(){var p=oi();return t.insert(p,()=>n.t(`github.error.${e.patch.error.reason}`)),p}}),t.createComponent(m.Match,{get when(){return t.memo(()=>!!e.patch)()&&!e.patch.busy},get children(){var p=si();return t.insert(p,()=>n.t("github.diff.none")),p}}),t.createComponent(m.Match,{when:!0,get children(){var p=li(),v=p.firstChild;return v.nextSibling,p}})]}})),h}}),null),i})()}function bi(e){const n=x.usePlugin(),r=m.createMemo(()=>ia(e.text));return(()=>{var a=di(),i=a.firstChild;return t.insert(i,t.createComponent(m.For,{get each(){return r()},children:o=>[(()=>{var s=hi(),c=s.firstChild;return t.insert(s,t.createComponent(N,{name:"unfold",size:"small"}),c),t.insert(s,t.createComponent(m.Show,{get when(){return o.skipped>0},get children(){var g=gi();return t.insert(g,()=>n.plural("github.diff.skipped",o.skipped)),g}}),c),t.insert(c,()=>o.heading),s})(),t.createComponent(m.For,{get each(){return o.lines},children:s=>(()=>{var c=mi(),g=c.firstChild,l=g.nextSibling,d=l.nextSibling,u=d.nextSibling;return t.insert(g,()=>s.before),t.insert(l,()=>s.after),t.insert(d,()=>vi[s.type]),t.insert(u,()=>s.text),t.effect(()=>t.setAttribute(c,"data-type",s.type)),c})()})]})),a})()}const vi={add:"+",del:"-",same:" "};function Ke(e){return e?e<1e3?String(e):e<1e6?`${on(e/1e3)}k`:`${on(e/1e6)}M`:"0"}const on=e=>e>=100?String(Math.round(e)):e.toFixed(1).replace(/\.0$/,"");function Nn(e,n){const r=Math.max(0,Math.floor(e/1e3)),a=i=>String(i).padStart(2,"0");return r<60?n("ui.message.duration.seconds",{count:String(r)}):r<3600?n("ui.message.duration.minutesSeconds",{minutes:String(Math.floor(r/60)),seconds:a(r%60)}):n("ui.message.duration.hoursMinutes",{hours:String(Math.floor(r/3600)),minutes:a(Math.floor(r/60)%60)})}const Je=e=>(e.tokens?.output??0)+(e.tokens?.reasoning??0);function wi(e,n){const r=e.map(s=>s.title),a=new Map(r.map(s=>[s,[]])),i=[];for(const s of n)s.phase===void 0?i.push(s):(a.has(s.phase)||a.set(s.phase,[]),a.get(s.phase).push(s));const o=[...a].map(([s,c])=>({title:s,detail:e.find(g=>g.title===s)?.detail,agents:c}));return i.length?[...o,{title:void 0,agents:i}]:o}const $i=(e,n)=>Number(e.id.slice(1))-Number(n.id.slice(1));function kt(e){const n={total:e.length,done:0,running:0,queued:0,failed:0,stopped:0};for(const r of e)n[r.status]=(n[r.status]??0)+1;return{...n,finished:n.done+n.failed+n.stopped}}const Lt=e=>e==="pending"||e==="running"||e==="paused";var xi=t.template('<svg viewBox="0 0 16 16"width=16 height=16 data-component=session-progress-indicator-v2 data-slot=spinner-dots aria-hidden=true fill=currentColor>'),yi=t.template("<svg><rect></svg>",!1,!0,!1);const be=5,ht=2,sn=3,ln=1.8,Ye=.2,ki=[1,.987,.934,.812,.599,.384,.238,.143,.081,.041,.017,.004,0],Ct=[...ki.map((e,n)=>[n*4,ee(.55*e)]),[100,0]],Pn="spinner-radar",{dots:Ci,shapes:Si}=Ei();function Qe(e){return _i(),(()=>{var n=xi();return t.use(r=>{e.still||Ai(r)},n),t.insert(n,t.createComponent(m.For,{each:Ci,children:r=>(()=>{var a=yi();return t.effect(i=>{var o=r.x,s=r.y,c=r.size,g=r.size,l=r.size*.24,d=r.still,u=r.steady||e.still?void 0:`${Pn}-${r.shape} calc(${ln}s * var(--spinner-time, 1)) linear calc(${-ln*(1-r.at)}s * var(--spinner-time, 1)) infinite`;return o!==i.e&&t.setAttribute(a,"x",i.e=o),s!==i.t&&t.setAttribute(a,"y",i.t=s),c!==i.a&&t.setAttribute(a,"width",i.a=c),g!==i.o&&t.setAttribute(a,"height",i.o=g),l!==i.i&&t.setAttribute(a,"rx",i.i=l),d!==i.n&&t.setStyleProperty(a,"--still",i.n=d),u!==i.s&&t.setStyleProperty(a,"animation",i.s=u),i},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0}),a})()})),t.effect(()=>t.setAttribute(n,"class",e.class)),n})()}function _i(){if(document.getElementById("ocp-spinner-radar"))return;const e=document.createElement("style");e.id="ocp-spinner-radar",e.textContent=Si.map((n,r)=>`@keyframes ${Pn}-${r}{${n.map(([a,i])=>`${ee(a)}%{opacity:${ee(Ye+(1-Ye)*i)};animation-timing-function:linear}`).join("")}}`).join(""),document.head.append(e)}function Ai(e){const n=new ResizeObserver(()=>e.getAnimations({subtree:!0}).forEach(r=>{r.startTime!==0&&(r.startTime=0)}));n.observe(e),m.onCleanup(()=>n.disconnect())}function Ei(){const e=Array.from({length:be*be},(s,c)=>{const g={gx:c%be-(be-1)/2,gy:Math.floor(c/be)-(be-1)/2};return{cell:g,at:Mi(g),steady:g.gx===0&&g.gy===0}}),n=s=>Math.max(Math.abs(s.gx),Math.abs(s.gy)),r=e.map(s=>{if(s.steady)return"";const c=e.filter(d=>d!==s&&!d.steady&&n(d.cell)===n(s.cell)),g=Math.min(...c.map(d=>ze(s.at-d.at))),l=Math.min(...c.map(d=>ze(d.at-s.at)));return`${ee(g)} ${ee(l)}`}),a=[...new Set(r.filter(s=>s!==""))],i=a.map(s=>{const[c,g]=s.split(" ").map(Number);return Ii(c*100,g*100)});return{dots:e.map((s,c)=>{const g=Math.max(0,a.indexOf(r[c])),l=s.steady?Ct[0][1]:On(i[g],ze(.22-s.at)*100);return{x:ee(8+s.cell.gx*sn-ht/2),y:ee(8+s.cell.gy*sn-ht/2),size:ht,at:ee(s.at),steady:s.steady,still:ee(Ye+(1-Ye)*l),shape:g}}),shapes:i}}function Ii(e,n){const a=n/2+1.5,i=100-e/2;return[[0,1],[n/2,1],[a,On(Ct,a)],...Ct.filter(([o])=>o>a&&o<100&&o<i-1.5),[i-1.5,0],[i,1],[100,1]]}function Mi(e){return ze(Math.atan2(e.gx,-e.gy)/(2*Math.PI))}function On(e,n){const r=e.findIndex(([c])=>c>=n);if(r<=0)return e[0]?.[1]??0;const[a,i]=e[r-1],[o,s]=e[r];return i+(s-i)*(n-a)/(o-a||1)}function ze(e){return e-Math.floor(e)}function ee(e){return Math.round(e*1e3)/1e3}var Di=t.template('<span class="flex items-center">'),zn=t.template('<div class="flex flex-wrap items-center gap-2 pt-1">'),Ti=t.template('<span class="flex items-center gap-1.5"><span class=text-v2-text-text-base>'),Bn=t.template('<div class="flex flex-col py-3">'),Ri=t.template('<span class="flex min-w-0 flex-wrap gap-x-3 gap-y-1">'),qi=t.template('<span class="flex items-center gap-1">'),Li=t.template("<div data-component=card><div data-slot=card-title><span data-slot=card-title-icon></span><span class=min-w-0></span></div><div data-slot=card-description>"),Ni=t.template("<div data-slot=meta><span></span><div>"),Pi=t.template("<span class=text-v2-text-text-faint>"),Oi=t.template('<span class="flex min-w-0 flex-wrap gap-x-3 gap-y-1.5">'),zi=t.template('<span class="flex min-w-0 flex-wrap gap-1">'),Bi=t.template('<button type=button class="min-w-0 truncate text-start text-v2-text-text-accent hover:underline">'),Fi=t.template('<span class="flex min-w-0 items-center gap-2.5"><span data-slot=avatars></span><span class="min-w-0 truncate text-v2-text-text-muted">'),Fn=t.template('<div class="text-12-regular text-v2-text-text-faint">'),Ui=t.template("<div class=-mx-2>"),Hi=t.template('<div class="flex flex-col">'),Gi=t.template('<span class="flex shrink-0 items-center gap-1.5 text-12-regular text-v2-text-text-muted">'),Wi=t.template('<div data-slot=row><button type=button class="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-start"><span class="min-w-0 shrink truncate text-v2-text-text-base"></span><span class="min-w-0 flex-1 truncate text-v2-text-text-muted"></span><span class="shrink-0 text-[11px] tabular-nums text-v2-text-text-muted">'),Vi=t.template('<span class="flex size-4 shrink-0 items-center justify-center">'),Ki=t.template('<div class="flex flex-col gap-3">');const Ji={merged:{variant:"normal"},closed:{variant:"normal",reopen:!0},draft:{variant:"normal",ready:!0},conflicts:{variant:"error",hand:"conflicts",glyph:"warning"},changes:{variant:"error",hand:"review",glyph:"reply"},failing:{variant:"error",hand:"checks",glyph:"hammer"},review:{variant:"warning",auto:!0},pending:{variant:"warning",auto:!0},behind:{variant:"warning",auto:!0,update:!0},blocked:{variant:"warning",auto:!0},unknown:{variant:"normal",auto:!0},ready:{variant:"success",merge:!0}},Yi={error:"var(--v2-state-fg-danger)",warning:"var(--icon-warning-active)",success:"var(--icon-success-active)"};function Qi(e){const n=x.usePlugin(),r=()=>Ji[e.item.gate],a=()=>e.repo?.methods??[],i=()=>!!e.repo?.write&&a().length>0,o=l=>e.acting===l,s=()=>[r().merge&&i()&&"merge",r().hand&&"hand",r().ready&&"ready",r().update&&"update",r().auto&&i()&&!e.item.autoMerge&&"auto",r().reopen&&"reopen"].filter(Boolean),c=()=>["merged","closed","draft"].includes(e.item.gate)?t.createComponent(Se,{kind:"pull",get state(){return e.item.gate},size:"small"}):e.item.gate==="pending"||e.item.gate==="unknown"?t.createComponent(Qe,{class:"text-v2-state-fg-warning",get still(){return e.item.gate==="unknown"}}):t.createComponent(n.ui.Icon,{get name(){return Zi[r().variant]},size:"small"}),g=()=>{const l=e.item.gate==="merged"&&!e.item.mergedBy?"merged.anonymous":e.item.gate,d=n.t(`github.gate.${l}.detail`,{base:e.item.base,user:e.item.mergedBy??""});return e.item.autoMerge?`${d} ${n.t(`github.auto.${e.item.autoMerge}`)}`:d};return[t.createComponent(Un,{get variant(){return r().variant},get icon(){return c()},get title(){return n.t(`github.gate.${e.item.gate}`)},get description(){return g()},get children(){return t.createComponent(m.Show,{get when(){return s().length>0},get children(){var l=zn();return t.insert(l,t.createComponent(m.Show,{get when(){return s().includes("merge")},get children(){var d=Di();return t.insert(d,t.createComponent(n.ui.Button,{variant:"contrast",size:"small",get busy(){return o("merge")},onClick:()=>{e.merge(a()[0])},get children(){return t.createComponent(V,{glyph:"merge",get children(){return n.t(`github.method.${a()[0]}`)}})}}),null),t.insert(d,t.createComponent(m.Show,{get when(){return a().length>1},get children(){return t.createComponent(n.ui.Menu,{get label(){return n.t("github.merge.other")},icon:"chevron-down",placement:"bottom-start",get items(){return a().slice(1).map(u=>({label:n.t(`github.method.${u}`),onSelect:()=>{e.merge(u)}}))}})}}),null),d}}),null),t.insert(l,t.createComponent(m.Show,{get when(){return s().includes("hand")},get children(){return t.createComponent(n.ui.Button,{variant:"contrast",size:"small",onClick:()=>e.hand(r().hand),get children(){return t.createComponent(V,{get glyph(){return r().glyph},get children(){return n.t(`github.hand.${r().hand}`)}})}})}}),null),t.insert(l,t.createComponent(m.Show,{get when(){return s().includes("ready")},get children(){return t.createComponent(n.ui.Button,{variant:"contrast",size:"small",get busy(){return o("ready")},onClick:()=>{e.change("ready")},get children(){return t.createComponent(V,{glyph:"eye",get children(){return n.t("github.ready")}})}})}}),null),t.insert(l,t.createComponent(m.Show,{get when(){return s().includes("update")},get children(){return t.createComponent(n.ui.Button,{variant:"neutral",size:"small",get busy(){return o("update")},onClick:()=>{e.change("update")},get children(){return t.createComponent(V,{glyph:"sync",get children(){return n.t("github.update")}})}})}}),null),t.insert(l,t.createComponent(m.Show,{get when(){return s().includes("auto")},get children(){return t.createComponent(n.ui.Button,{variant:"neutral",size:"small",get busy(){return o("auto")},onClick:()=>{e.merge(a()[0],!0)},get children(){return t.createComponent(V,{glyph:"clock",get children(){return n.t("github.merge.auto")}})}})}}),null),t.insert(l,t.createComponent(m.Show,{get when(){return s().includes("reopen")},get children(){return t.createComponent(n.ui.Button,{variant:"neutral",size:"small",get busy(){return o("reopen")},onClick:()=>{e.change("reopen")},get children(){return t.createComponent(V,{glyph:"reopen",get children(){return n.t("github.reopen")}})}})}}),null),l}})}}),(()=>{var l=Bn();return t.insert(l,t.createComponent(Xi,{get item(){return e.item},get origin(){return e.origin}}),null),t.insert(l,t.createComponent(G,{glyph:"user",get label(){return n.t("github.assignees")},get children(){return t.createComponent(Hn,{get logins(){return e.item.assignees},get origin(){return e.origin}})}}),null),t.insert(l,t.createComponent(G,{glyph:"tag",get label(){return n.t("github.labels")},get children(){return t.createComponent(Gn,{get labels(){return e.item.labels}})}}),null),t.insert(l,t.createComponent(m.Show,{get when(){return e.item.sync},get children(){return t.createComponent(G,{glyph:"branch",get label(){return n.t("github.branch")},get children(){var d=Ti(),u=d.firstChild;return t.insert(d,t.createComponent(N,{get name(){return e.item.sync==="current"?"check":"warning"},size:"small"}),u),t.insert(u,()=>n.t(`github.sync.${e.item.sync}`,{base:e.item.base})),t.effect(h=>{var p=e.item.sync==="current",v=e.item.sync==="behind",w=e.item.sync==="conflicts";return p!==h.e&&d.classList.toggle("text-v2-state-fg-success",h.e=p),v!==h.t&&d.classList.toggle("text-v2-state-fg-warning",h.t=v),w!==h.a&&d.classList.toggle("text-v2-state-fg-danger",h.a=w),h},{e:void 0,t:void 0,a:void 0}),d}})}}),null),t.insert(l,t.createComponent(m.Show,{get when(){return e.item.milestone},get children(){return t.createComponent(G,{glyph:"milestone",get label(){return n.t("github.milestone")},get children(){return e.item.milestone}})}}),null),t.insert(l,t.createComponent(m.Show,{get when(){return e.item.autoMerge},get children(){return t.createComponent(G,{glyph:"zap",get label(){return n.t("github.autoMerge")},get children(){return n.t(`github.method.${e.item.autoMerge}`)}})}}),null),l})(),t.createComponent(Wn,{get body(){return e.item.body}}),t.createComponent(eo,{get checks(){return e.item.checks},get browse(){return e.browse},get hand(){return e.hand}}),t.createComponent(Jn,{get item(){return e.item},get origin(){return e.origin},get browse(){return e.browse},get hand(){return e.hand}})]}function ji(e){const n=x.usePlugin(),r=()=>e.item.state!=="open";return[t.createComponent(Un,{get variant(){return r()?"normal":"success"},get icon(){return t.createComponent(Se,{kind:"issue",get state(){return e.item.state},size:"small"})},get title(){return n.t(`github.issue.${e.item.state}`)},get description(){return t.memo(()=>e.item.pulls.length>0)()?n.plural("github.issue.pulls",e.item.pulls.length):n.t(`github.issue.${e.item.state}.detail`)},get children(){var a=zn();return t.insert(a,t.createComponent(m.Show,{get when(){return r()},get fallback(){return t.createComponent(n.ui.Button,{variant:"contrast",size:"small",onClick:()=>e.hand("issue"),get children(){return t.createComponent(V,{glyph:"hammer",get children(){return n.t("github.hand.issue")}})}})},get children(){return t.createComponent(n.ui.Button,{variant:"neutral",size:"small",get busy(){return e.acting==="reopen"},onClick:()=>{e.change("reopen")},get children(){return t.createComponent(V,{glyph:"reopen",get children(){return n.t("github.reopen")}})}})}})),a}}),(()=>{var a=Bn();return t.insert(a,t.createComponent(G,{glyph:"user",get label(){return n.t("github.assignees")},get children(){return t.createComponent(Hn,{get logins(){return e.item.assignees},get origin(){return e.origin}})}}),null),t.insert(a,t.createComponent(G,{glyph:"tag",get label(){return n.t("github.labels")},get children(){return t.createComponent(Gn,{get labels(){return e.item.labels}})}}),null),t.insert(a,t.createComponent(m.Show,{get when(){return e.item.type},get children(){return t.createComponent(G,{glyph:"box",get label(){return n.t("github.type")},get children(){return e.item.type}})}}),null),t.insert(a,t.createComponent(m.Show,{get when(){return e.item.milestone},get children(){return t.createComponent(G,{glyph:"milestone",get label(){return n.t("github.milestone")},get children(){return e.item.milestone}})}}),null),t.insert(a,t.createComponent(m.Show,{get when(){return e.item.parent},children:i=>t.createComponent(G,{glyph:"parent",get label(){return n.t("github.parent")},get children(){return t.createComponent(cn,{onClick:()=>e.open(i().url),get children(){return`#${i().number} ${i().title}`}})}})}),null),t.insert(a,t.createComponent(m.Show,{get when(){return e.item.subIssues},children:i=>t.createComponent(G,{glyph:"tree",get label(){return n.t("github.subIssues")},get children(){return n.t("github.subIssues.value",{done:i().completed,total:i().total})}})}),null),t.insert(a,t.createComponent(G,{glyph:"pull",get label(){return n.t("github.pulls")},get children(){return t.createComponent(m.Show,{get when(){return e.item.pulls.length>0},get fallback(){return t.createComponent(tt,{})},get children(){var i=Ri();return t.insert(i,t.createComponent(m.For,{get each(){return e.item.pulls},children:o=>t.createComponent(cn,{onClick:()=>e.open(o.url),get children(){var s=qi();return t.insert(s,t.createComponent(N,{name:"pull",size:"small"}),null),t.insert(s,()=>`#${o.number}`,null),s}})})),i}})}}),null),a})(),t.createComponent(Wn,{get body(){return e.item.body}}),t.createComponent(Jn,{get item(){return e.item},get origin(){return e.origin},get browse(){return e.browse},get hand(){return e.hand}})]}const Zi={error:"circle-x",warning:"warning",success:"circle-check",normal:"dash"};function Un(e){return(()=>{var n=Li(),r=n.firstChild,a=r.firstChild,i=a.nextSibling,o=r.nextSibling;return t.insert(a,()=>e.icon),t.insert(i,()=>e.title),t.insert(o,()=>e.description),t.insert(n,()=>e.children,null),t.effect(s=>{var c=e.variant,g=Yi[e.variant];return c!==s.e&&t.setAttribute(n,"data-variant",s.e=c),g!==s.t&&t.setStyleProperty(n,"--card-accent",s.t=g),s},{e:void 0,t:void 0}),n})()}function G(e){return(()=>{var n=Ni(),r=n.firstChild,a=r.nextSibling;return t.insert(r,t.createComponent(N,{get name(){return e.glyph}}),null),t.insert(r,()=>e.label,null),t.insert(a,()=>e.children),n})()}function tt(){const e=x.usePlugin();return(()=>{var n=Pi();return t.insert(n,()=>e.t("github.none")),n})()}function Hn(e){return t.createComponent(m.Show,{get when(){return e.logins.length>0},get fallback(){return t.createComponent(tt,{})},get children(){var n=Oi();return t.insert(n,t.createComponent(m.For,{get each(){return e.logins},children:r=>t.createComponent(Rt,{login:r,get origin(){return e.origin}})})),n}})}function Gn(e){return t.createComponent(m.Show,{get when(){return e.labels.length>0},get fallback(){return t.createComponent(tt,{})},get children(){var n=zi();return t.insert(n,t.createComponent(m.For,{get each(){return e.labels},children:r=>t.createComponent(ti,{get name(){return r.name},get color(){return r.color}})})),n}})}function cn(e){return(()=>{var n=Bi();return n.$$click=()=>e.onClick(),t.insert(n,()=>e.children),n})()}function Xi(e){const n=x.usePlugin(),r=()=>e.item.reviewers,a=o=>r().flatMap(s=>s.verdict===o?[s.login]:[]),i=()=>e.item.decision==="CHANGES_REQUESTED"?"changes":e.item.decision==="APPROVED"||!e.item.decision&&a("approved").length>0?"approved":e.item.decision==="REVIEW_REQUIRED"?"required":a("requested").length>0?"waiting":"commented";return t.createComponent(G,{glyph:"users",get label(){return n.t("github.reviewers")},get children(){return t.createComponent(m.Show,{get when(){return r().length>0},get fallback(){return t.createComponent(tt,{})},get children(){var o=Fi(),s=o.firstChild,c=s.nextSibling;return t.insert(s,t.createComponent(m.For,{get each(){return r()},children:g=>t.createComponent(n.ui.Tooltip,{get value(){return`${g.login}: ${n.t(`github.verdict.${g.verdict}`)}`},placement:"top",get children(){return t.createComponent(We,{get login(){return g.login},get origin(){return e.origin},get verdict(){return g.verdict},size:20})}})})),t.insert(c,()=>n.t(`github.reviews.${i()}`)),o}})}})}function Wn(e){const n=x.usePlugin();return t.createComponent(qt,{get title(){return n.t("github.description")},get children(){return t.createComponent(m.Show,{get when(){return e.body},get fallback(){return(()=>{var r=Fn();return t.insert(r,()=>n.t("github.description.none")),r})()},get children(){return t.createComponent(qn,{get text(){return e.body}})}})}})}function eo(e){const n=x.usePlugin(),[r,a]=m.createSignal(!1),i=()=>It(e.checks),o=()=>e.checks.filter(c=>c.result==="fail"||c.result==="pending"),s=()=>r()||o().length===0?e.checks:o();return t.createComponent(m.Show,{get when(){return e.checks.length>0},get children(){return t.createComponent(qt,{get title(){return n.t("github.checks")},get count(){return`${i().pass}/${e.checks.length}`},get open(){return o().length>0},get note(){return t.createComponent(Vn,{get checks(){return e.checks}})},get children(){var c=Hi();return t.insert(c,t.createComponent(m.For,{get each(){return s()},children:g=>t.createComponent(to,{check:g,get browse(){return e.browse},get hand(){return e.hand}})}),null),t.insert(c,t.createComponent(m.Show,{get when(){return t.memo(()=>o().length>0)()&&e.checks.length>o().length},get children(){var g=Ui();return t.insert(g,t.createComponent(Tn,{onClick:()=>a(!r()),get children(){return t.memo(()=>!!r())()?n.t("github.checks.less"):n.plural("github.checks.more",e.checks.length-o().length)}})),g}}),null),c}})}})}function Vn(e){const n=x.usePlugin(),r=()=>It(e.checks),a=()=>r().fail>0?"fail":r().pending>0?"pending":"pass",i=()=>{const{pass:o,fail:s,pending:c}=r(),g=e.checks.length;return s>0?n.t("github.checks.failing",{count:s,total:g}):c>0?n.t("github.checks.running",{count:c,total:g}):o===g?n.t("github.checks.passed"):n.t("github.checks.some",{count:o,total:g})};return t.createComponent(m.Show,{get when(){return e.checks.length>0},get children(){var o=Gi();return t.insert(o,t.createComponent(Kn,{get result(){return a()}}),null),t.insert(o,i,null),o}})}function to(e){const n=x.usePlugin(),r=Le(()=>e.check.result==="pending"),a=()=>e.check.started&&(e.check.ended||e.check.result==="pending")?Nn((e.check.ended??r())-e.check.started,(i,o)=>n.t(i,o)):"";return(()=>{var i=Wi(),o=i.firstChild,s=o.firstChild,c=s.nextSibling,g=c.nextSibling;return o.$$click=()=>e.browse(e.check.url),t.insert(o,t.createComponent(Kn,{get result(){return e.check.result}}),s),t.insert(s,()=>e.check.name),t.insert(c,()=>e.check.workflow),t.insert(g,()=>a()||n.t(`github.result.${e.check.result}`)),t.insert(i,t.createComponent(m.Show,{get when(){return e.check.result==="fail"},get children(){return t.createComponent(n.ui.Button,{variant:"ghost",size:"small",onClick:()=>e.hand("checks",e.check),get children(){return t.createComponent(V,{glyph:"hammer",get children(){return n.t("github.fix")}})}})}}),null),t.effect(()=>o.disabled=!e.check.url),i})()}function Kn(e){const n=x.usePlugin();return(()=>{var r=Vi();return t.insert(r,t.createComponent(m.Switch,{get fallback(){return t.createComponent(n.ui.Icon,{name:"circle-ban-sign",size:"small",class:"text-v2-icon-icon-faint"})},get children(){return[t.createComponent(m.Match,{get when(){return e.result==="pass"},get children(){return t.createComponent(n.ui.Icon,{name:"circle-check",size:"small",class:"text-v2-state-fg-success"})}}),t.createComponent(m.Match,{get when(){return e.result==="fail"},get children(){return t.createComponent(n.ui.Icon,{name:"circle-x",size:"small",class:"text-v2-state-fg-danger"})}}),t.createComponent(m.Match,{get when(){return e.result==="pending"},get children(){return t.createComponent(Qe,{class:"text-v2-state-fg-warning"})}})]}})),r})()}function Jn(e){const n=x.usePlugin(),r=()=>e.item.events.filter(a=>(a.kind==="comment"||a.kind==="review")&&a.body);return t.createComponent(qt,{get title(){return n.t("github.comments")},get count(){return r().length},get children(){return t.createComponent(m.Show,{get when(){return r().length>0},get fallback(){return(()=>{var a=Fn();return t.insert(a,()=>n.t("github.comments.none")),a})()},get children(){var a=Ki();return t.insert(a,t.createComponent(m.For,{get each(){return r()},children:i=>t.createComponent(Ln,{event:i,get origin(){return e.origin},get browse(){return e.browse},get action(){return t.memo(()=>i.verdict==="changes"&&e.item.state==="open")()?t.createComponent(n.ui.Button,{variant:"ghost",size:"small",onClick:()=>e.hand("review"),get children(){return t.createComponent(V,{glyph:"reply",get children(){return n.t("github.address")}})}}):void 0}})})),a}})}})}t.delegateEvents(["click"]);var no=t.template("<ol data-slot=timeline class=pt-4>"),un=t.template("<span data-slot=ring>"),ro=t.template('<button type=button data-slot=commit><span class="flex min-w-0 flex-1 flex-col gap-0.5 py-1"><span data-slot=headline class="truncate text-12-medium text-v2-text-text-base"></span><span class="flex items-center gap-1.5 text-[11px] text-v2-text-text-muted"><span class=truncate></span><span aria-hidden=true>·</span><code class=font-mono></code><span aria-hidden=true>·'),ao=t.template("<strong>"),io=t.template("<div data-slot=line><span></span><span aria-hidden=true class=text-v2-text-text-faint>·</span><span class=text-v2-text-text-faint>"),oo=t.template("<li data-slot=event><span data-slot=marker>"),so=t.template('<span class="flex items-center gap-1">'),lo=t.template('<span class="flex items-center gap-1 text-v2-state-fg-success">'),co=t.template('<span class="flex shrink-0 items-center gap-3 text-12-regular tabular-nums text-v2-text-text-muted"><span class="flex items-center gap-1"></span><button type=button class="flex h-6 items-center gap-1 rounded-[6px] px-1.5 hover:bg-v2-background-bg-layer-02 hover:text-v2-text-text-base">');function uo(e){const n=x.usePlugin(),r=()=>e.newest?e.item.events.toReversed():e.item.events;return(()=>{var a=no();return t.insert(a,t.createComponent(m.For,{get each(){return r()},children:i=>(()=>{var o=oo(),s=o.firstChild;return t.insert(s,t.createComponent(m.Switch,{get fallback(){return t.createComponent(We,{get login(){return i.user},get origin(){return e.origin},size:26,get verdict(){return i.verdict}})},get children(){return[t.createComponent(m.Match,{get when(){return i.kind==="merged"||i.kind==="closed"||i.kind==="opened"},get children(){var c=un();return t.insert(c,t.createComponent(Se,{get kind(){return e.item.kind},get state(){return ho(i,e.item)},size:"small"})),c}}),t.createComponent(m.Match,{get when(){return i.kind==="commit"},get children(){var c=un();return t.insert(c,t.createComponent(N,{name:"commit"})),c}})]}})),t.insert(o,t.createComponent(m.Switch,{get children(){return[t.createComponent(m.Match,{get when(){return i.kind==="commit"},get children(){var c=ro(),g=c.firstChild,l=g.firstChild,d=l.nextSibling,u=d.firstChild,h=u.nextSibling,p=h.nextSibling;return p.nextSibling,c.$$click=()=>e.browse(`${e.item.url}/commits/${i.oid}`),t.insert(l,()=>i.headline),t.insert(d,t.createComponent(We,{get login(){return i.user},get origin(){return e.origin},size:14}),u),t.insert(u,()=>i.user),t.insert(p,()=>i.oid.slice(0,7)),t.insert(d,t.createComponent(Ve,{get time(){return i.time}}),null),c}}),t.createComponent(m.Match,{get when(){return t.memo(()=>i.kind==="comment"||i.kind==="review")()&&i.body},get children(){return t.createComponent(Ln,{event:i,get origin(){return e.origin},get browse(){return e.browse}})}}),t.createComponent(m.Match,{when:!0,get children(){var c=io(),g=c.firstChild,l=g.nextSibling,d=l.nextSibling;return t.insert(c,t.createComponent(m.Show,{get when(){return i.user},get children(){var u=ao();return t.insert(u,()=>i.user),u}}),g),t.insert(g,()=>mo(n,i,e.item)),t.insert(d,t.createComponent(Ve,{get time(){return i.time}})),t.effect(u=>{var h=i.kind==="review"?"verdict":void 0,p=i.verdict,v=i.kind!=="review"&&!i.user;return h!==u.e&&t.setAttribute(g,"data-slot",u.e=h),p!==u.t&&t.setAttribute(g,"data-verdict",u.t=p),v!==u.a&&g.classList.toggle("font-[530]",u.a=v),u},{e:void 0,t:void 0,a:void 0}),c}})]}}),null),o})()})),a})()}function go(e){const n=x.usePlugin(),r=a=>e.item.events.filter(a).length;return(()=>{var a=co(),i=a.firstChild,o=i.nextSibling;return t.insert(i,t.createComponent(N,{name:"comment",size:"small"}),null),t.insert(i,()=>r(s=>s.kind==="comment"),null),t.insert(a,t.createComponent(m.Show,{get when(){return e.item.kind==="pull"},get children(){return[(()=>{var s=so();return t.insert(s,t.createComponent(N,{name:"commit",size:"small"}),null),t.insert(s,()=>r(c=>c.kind==="commit"),null),t.effect(()=>t.setAttribute(s,"title",n.t("github.commits"))),s})(),(()=>{var s=lo();return t.insert(s,t.createComponent(N,{name:"check",size:"small"}),null),t.insert(s,()=>e.item.reviewers.filter(c=>c.verdict==="approved").length,null),t.effect(()=>t.setAttribute(s,"title",n.t("github.approvals"))),s})()]}}),o),o.$$click=()=>e.onSort(!e.newest),t.insert(o,t.createComponent(N,{name:"sort",size:"small"}),null),t.insert(o,()=>n.t(e.newest?"github.order.newest":"github.order.oldest"),null),t.effect(()=>t.setAttribute(i,"title",n.t("github.comments"))),a})()}const ho=(e,n)=>e.kind==="opened"?"open":n.kind==="pull"?e.kind:n.state;function mo(e,n,r){return n.kind==="review"?e.t(`github.event.review.${n.verdict}`):n.kind==="merged"?e.t("github.event.merged",{base:r.base}):n.kind==="opened"?e.t(`github.event.opened.${r.kind}`):n.kind==="closed"?e.t(`github.event.closed.${r.kind==="pull"?"pull":r.state}`):e.t(`github.event.${n.kind}`)}t.delegateEvents(["click"]);var po=t.template('<span class="min-w-0 truncate text-[13px] font-[440] leading-4 tracking-[-0.04px] text-v2-text-text-muted">'),fo=t.template('<span class="shrink-0 text-[13px] font-[530] leading-4 tracking-[-0.04px] tabular-nums text-v2-text-text-base">'),Yn=t.template('<span class="min-w-0 flex-1">'),bo=t.template('<div class="shrink-0 px-3 py-1.5 text-12-regular text-v2-state-fg-danger border-b border-v2-border-border-muted">'),vo=t.template('<div class="flex flex-col pt-4">'),wo=t.template('<div class="flex w-full min-w-0 flex-col px-4 pt-4 pb-8"><div data-slot=tabbar class=mt-4><div data-slot=segmented-control-v2 role=tablist></div><span class="min-w-0 flex-1">'),$o=t.template('<div data-plus-github class="relative size-full min-w-0 overflow-hidden bg-v2-background-bg-base flex flex-col outline-none">'),xo=t.template("<span class=flex>"),yo=t.template('<div class="flex min-w-0 items-center gap-3 text-12-regular text-v2-text-text-muted"><span class="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-[12px]"><span class="max-w-[45%] shrink-0 truncate"></span></span><span class="flex shrink-0 items-center gap-1 tabular-nums">'),ko=t.template('<header class="flex flex-col gap-2.5"><h1 data-slot=title class=select-text></h1><div class="flex min-w-0 flex-wrap items-center gap-2 text-12-regular text-v2-text-text-muted"><span class="flex shrink-0 items-center gap-1.5 text-12-medium text-v2-text-text-base"></span><span aria-hidden=true class=text-v2-text-text-faint>·</span><span class="flex shrink-0 items-center gap-1">'),Co=t.template("<span data-slot=count>"),So=t.template("<button type=button role=tab data-slot=segmented-control-v2-item>"),_o=t.template('<div class="flex flex-col gap-3 px-4 pt-4"aria-busy=true><span data-slot=ghost style=width:66%;height:16px></span><span data-slot=ghost style=width:33%></span><span data-slot=ghost style=width:50%></span><span data-slot=ghost class=mt-3 style=width:224px;height:28px></span><span data-slot=ghost class=mt-3 style=width:100%;height:64px>'),Ao=t.template('<div class="mx-auto flex max-w-[360px] flex-col items-center gap-4 px-6 pt-20 text-center"><div class="flex flex-col gap-2"><div class="text-[13px] font-[530] leading-[var(--line-height-compact)] text-v2-text-text-base"></div><div class="whitespace-pre-wrap text-[13px] font-[440] leading-[var(--line-height-compact)] text-v2-text-text-muted"></div></div><div class="flex items-center gap-2">');const Nt=1e3,Eo=60*Nt,Qn=15*Nt;function Io(e){const n=x.usePlugin(),r=X(e.address),a=()=>e.model.state.items[e.address],i=()=>a()?.item,o=()=>i()?.kind==="pull",s=()=>["open","draft"].includes(i()?.state),c=()=>e.view()==="files"&&!o()?"summary":e.view()??"summary",[g,l]=m.createSignal(),[d,u]=m.createSignal(!1),h=C=>{e.model.load(e.address,e.session.directory,C)};x.createKeyed(e.visible,()=>{h(Qn);const C=setInterval(()=>{s()&&h(Eo)},10*Nt);m.onCleanup(()=>clearInterval(C))}),x.createKeyed(()=>i()?.moved,C=>e.replace(C)),x.createKeyed(()=>o()&&s(),()=>e.model.loadRepo(e.address,e.session.directory));const p=()=>i()?.url??e.address,v=`${r.owner}/${r.repo}#${r.number}`,w=C=>{n.system.copy(C).then(()=>n.toast.show({variant:"success",title:n.t("github.copied")}),()=>n.toast.show({variant:"error",title:n.t("github.copyFailed")}))},y=async(C,S)=>{l(C);const D=await e.model.change(e.address,e.session.directory,C,S);l(),D&&n.toast.show({variant:"error",title:n.t("github.action.failed"),description:St(n,D).body})},$=async(C,S)=>{await n.dialogs.confirm({title:n.t(S?"github.merge.auto.title":"github.merge.title",{number:r.number}),description:n.t(`github.method.${C}.detail`,{base:i().base}),confirm:n.t(S?"github.merge.auto":`github.method.${C}`)})&&await y(S?"auto":"merge",C)},f=async()=>{await n.dialogs.confirm({title:n.t(`github.close.${i().kind}.title`,{number:r.number}),confirm:n.t(`github.close.${i().kind}`),danger:!0})&&await y("close")},_=(C,S)=>{const D=e.screen.composer;D.attach({type:"note",origin:n.id,commentID:`${n.id}:${e.address}:${C}:${Date.now()}`,label:v,title:i().title,subtitle:S?S.name:n.t(`github.kind.${i().kind}`),icon:"github",subject:sa(i(),C,S),comment:"",href:e.address}),C!=="context"&&D.text().trim()===""&&D.setText(n.t(S?"github.ask.check":`github.ask.${C}`,{base:i().base,check:S?.name})),D.focus()},q=()=>{const C=i(),S=[{label:n.t("github.copy.link"),icon:"link",onSelect:()=>w(p())}];if(!C?.title)return[...S,{type:"separator"},T()];C.kind==="pull"&&S.push({label:n.t("github.copy.branch"),icon:"branch",onSelect:()=>w(C.branch)},{label:n.t("github.copy.checkout"),icon:"console",onSelect:()=>w(`gh pr checkout ${r.number}`)});const D=[C.state==="open"&&C.kind==="pull"&&{label:n.t("github.draft"),icon:"edit",onSelect:()=>{y("draft")}},C.state==="draft"&&{label:n.t("github.ready"),icon:"check",onSelect:()=>{y("ready")}},C.autoMerge&&{label:n.t("github.merge.manual"),icon:"close-small",onSelect:()=>{y("manual")}},s()?{label:n.t(`github.close.${C.kind}`),icon:"outline-xmark",onSelect:()=>{f()}}:C.state!=="merged"&&{label:n.t("github.reopen"),icon:"outline-undo",onSelect:()=>{y("reopen")}}].filter(Boolean);return[...S,{type:"separator"},{label:n.t("github.context"),icon:"prompt",onSelect:()=>_("context")},{type:"separator"},...D,{type:"separator"},T()]},T=()=>({label:n.t("github.external"),icon:"square-arrow-top-right",onSelect:()=>{n.system.openExternal(p())}});return(()=>{var C=$o();return t.insert(C,t.createComponent(Ze,{get children(){return[t.createComponent(Se,{get kind(){return r.kind},get state(){return i()?.state}}),(()=>{var S=po();return t.insert(S,()=>`${r.owner}/${r.repo}`),S})(),(()=>{var S=fo();return t.insert(S,()=>`#${r.number}`),S})(),Yn(),t.createComponent(Ce,{icon:"outline-rotate-clockwise",get label(){return n.t("github.refresh")},get busy(){return t.memo(()=>!!a()?.busy)()&&!!i()},onClick:()=>h(0)}),t.createComponent(Ce,{icon:"square-arrow-top-right",get label(){return n.t("github.open")},onClick:()=>e.browse(p())}),t.createComponent(n.ui.Menu,{get label(){return n.t("github.more")},icon:"outline-dots",placement:"bottom-end",get items(){return q()}})]}}),null),t.insert(C,t.createComponent(m.Show,{get when(){return t.memo(()=>!!i())()&&a().error},get children(){var S=bo();return t.insert(S,()=>St(n,a().error).title),S}}),null),t.insert(C,t.createComponent(m.Switch,{get children(){return[t.createComponent(m.Match,{get when(){return i()?.title!==void 0},get children(){return t.createComponent(Xe,{get children(){var S=wo(),D=S.firstChild,P=D.firstChild;return P.nextSibling,t.insert(S,t.createComponent(Mo,{get item(){return i()},get kind(){return r.kind},get number(){return r.number},get origin(){return r.origin}}),D),t.insert(P,t.createComponent(mt,{value:"summary",get view(){return c()},get onSelect(){return e.setView},get children(){return n.t("github.tab.summary")}}),null),t.insert(P,t.createComponent(mt,{value:"timeline",get view(){return c()},get onSelect(){return e.setView},get count(){return i().events.length},get children(){return n.t("github.tab.timeline")}}),null),t.insert(P,t.createComponent(m.Show,{get when(){return o()},get children(){return t.createComponent(mt,{value:"files",get view(){return c()},get onSelect(){return e.setView},get count(){return i().changed},get children(){return n.t("github.tab.files")}})}}),null),t.insert(D,t.createComponent(m.Switch,{get children(){return[t.createComponent(m.Match,{get when(){return t.memo(()=>c()==="summary")()&&o()},get children(){return t.createComponent(Vn,{get checks(){return i().checks}})}}),t.createComponent(m.Match,{get when(){return c()==="timeline"},get children(){return t.createComponent(go,{get item(){return i()},get newest(){return d()},onSort:u})}}),t.createComponent(m.Match,{get when(){return c()==="files"},get children(){return t.createComponent(et,{get additions(){return i().additions},get deletions(){return i().deletions}})}})]}}),null),t.insert(S,t.createComponent(m.Switch,{get children(){return[t.createComponent(m.Match,{get when(){return c()==="summary"},get children(){var ie=vo();return t.insert(ie,t.createComponent(m.Show,{get when(){return o()},get fallback(){return t.createComponent(ji,{get item(){return i()},get origin(){return r.origin},get acting(){return g()},get browse(){return e.browse},hand:_,change:y,get open(){return e.open}})},get children(){return t.createComponent(Qi,{get item(){return i()},get origin(){return r.origin},get repo(){return e.model.state.repos[e.model.repo(e.address)]},get acting(){return g()},get browse(){return e.browse},hand:_,change:y,merge:$})}})),ie}}),t.createComponent(m.Match,{get when(){return c()==="timeline"},get children(){return t.createComponent(uo,{get item(){return i()},get origin(){return r.origin},get newest(){return d()},get browse(){return e.browse}})}}),t.createComponent(m.Match,{get when(){return c()==="files"},get children(){return t.createComponent(pi,{get item(){return i()},get patches(){return a().patches},get browse(){return e.browse},load:ie=>e.model.loadPatch(e.address,e.session.directory,ie)})}})]}}),null),S}})}}),t.createComponent(m.Match,{get when(){return a()?.error},get children(){return t.createComponent(To,{get error(){return a().error},get busy(){return a().busy},retry:()=>h(0),open:()=>e.browse(p())})}}),t.createComponent(m.Match,{when:!0,get children(){return t.createComponent(Do,{})}})]}}),null),C})()}function Mo(e){const n=x.usePlugin(),r=()=>e.item.merged??e.item.closed??e.item.created,a=()=>e.item.merged?"merged":e.item.closed?"closed":"opened";return(()=>{var i=ko(),o=i.firstChild,s=o.nextSibling,c=s.firstChild,g=c.nextSibling,l=g.nextSibling;return t.insert(o,()=>e.item.title),t.insert(c,t.createComponent(Se,{get kind(){return e.kind},get state(){return e.item.state},size:"small"}),null),t.insert(c,()=>n.t(`github.state.${e.kind}.${e.item.state}`),null),t.insert(s,t.createComponent(Rt,{get login(){return e.item.author},get origin(){return e.origin}}),l),t.insert(l,()=>n.t(`github.meta.${a()}`),null),t.insert(l,t.createComponent(Ve,{get time(){return r()}}),null),t.insert(s,t.createComponent(m.Show,{get when(){return e.kind==="pull"},get children(){return[Yn(),t.createComponent(an,{slot:"chip",glyph:"terminal",get value(){return`gh pr checkout ${e.number}`},get title(){return n.t("github.copy.checkout")}})]}}),null),t.insert(i,t.createComponent(m.Show,{get when(){return e.kind==="pull"},get children(){var d=yo(),u=d.firstChild,h=u.firstChild,p=u.nextSibling;return t.insert(u,t.createComponent(N,{name:"branch",size:"small",class:"text-v2-icon-icon-faint"}),h),t.insert(h,()=>e.item.base),t.insert(u,t.createComponent(m.Show,{get when(){return e.item.sync==="behind"||e.item.sync==="conflicts"},get children(){return t.createComponent(n.ui.Tooltip,{get value(){return n.t(`github.sync.${e.item.sync}`,{base:e.item.base})},placement:"top",get children(){var v=xo();return t.insert(v,t.createComponent(N,{name:"warning",size:"small"})),t.effect(w=>{var y=e.item.sync==="behind",$=e.item.sync==="conflicts";return y!==w.e&&v.classList.toggle("text-v2-state-fg-warning",w.e=y),$!==w.t&&v.classList.toggle("text-v2-state-fg-danger",w.t=$),w},{e:void 0,t:void 0}),v}})}}),null),t.insert(u,t.createComponent(n.ui.Icon,{name:"arrow-left",size:"small",class:"shrink-0 text-v2-icon-icon-faint"}),null),t.insert(u,t.createComponent(an,{class:"min-w-0 truncate text-start hover:text-v2-text-text-base",get value(){return e.item.branch},get title(){return n.t("github.copy.branch")},get children(){return t.memo(()=>!!e.item.fork)()?`${e.item.fork}:${e.item.branch}`:e.item.branch}}),null),t.insert(p,t.createComponent(N,{name:"file",size:"small"}),null),t.insert(p,()=>n.plural("github.files",e.item.changed),null),t.insert(d,t.createComponent(et,{get additions(){return e.item.additions},get deletions(){return e.item.deletions}}),null),d}}),null),i})()}function mt(e){const n=()=>e.view===e.value;return(()=>{var r=So();return r.$$click=()=>e.onSelect(e.value),t.insert(r,()=>e.children,null),t.insert(r,t.createComponent(m.Show,{get when(){return e.count>0},get children(){var a=Co();return t.insert(a,()=>e.count),a}}),null),t.effect(a=>{var i=n()?"":void 0,o=n();return i!==a.e&&t.setAttribute(r,"data-pressed",a.e=i),o!==a.t&&t.setAttribute(r,"aria-selected",a.t=o),a},{e:void 0,t:void 0}),r})()}function Do(){return(()=>{var e=_o(),n=e.firstChild,r=n.nextSibling,a=r.nextSibling,i=a.nextSibling;return i.nextSibling,e})()}function To(e){const n=x.usePlugin(),r=()=>St(n,e.error);return(()=>{var a=Ao(),i=a.firstChild,o=i.firstChild,s=o.nextSibling,c=i.nextSibling;return t.insert(a,t.createComponent(n.ui.Icon,{name:"github",size:"large",class:"text-v2-icon-icon-muted"}),i),t.insert(o,()=>r().title),t.insert(s,()=>r().body),t.insert(c,t.createComponent(n.ui.Button,{variant:"neutral",get busy(){return e.busy},get onClick(){return e.retry},get children(){return t.createComponent(V,{glyph:"sync",get children(){return n.t("github.retry")}})}}),null),t.insert(c,t.createComponent(n.ui.Button,{variant:"ghost",get onClick(){return e.open},get children(){return t.createComponent(V,{glyph:"external",get children(){return n.t("github.open")}})}}),null),a})()}const St=(e,n)=>({title:e.t(`github.error.${n.reason}`),body:n.detail??e.t(`github.error.${n.reason}.detail`)});t.delegateEvents(["click"]);var Ro=t.template('<div class="flex min-w-0 items-center gap-1.5"><span class="truncate tabular-nums">');function qo(e,{run:n,browse:r}){const a=Ma(n),[i,o]=ge.createStore({}),s=u=>`${e.id}:${u}`,c=(u,h=e.sessions.current())=>{const p=$e(u);return!p||!h||e.layout.narrow()?!1:(dn(u)&&o(p,dn(u)),e.layout.open(s(p),h,{tab:"select"}),h.directory&&a.load(p,h.directory,Qn),!0)},g=new Map,l=u=>{if(g.has(u))return g.get(u);const{owner:h,repo:p,kind:v,number:w}=X(u),y=()=>a.state.items[u]?.item,$={id:u,get title(){return`${h}/${p}#${w}${y()?.title?`: ${y().title}`:""}`},closable:"hover",label:()=>(()=>{var f=Ro(),_=f.firstChild;return t.insert(f,t.createComponent(Se,{kind:v,get state(){return y()?.state},size:"small"}),_),t.insert(_,`#${w}`),f})()};return g.set(u,$),$};e.add(x.Style,Ia),e.add(x.Panel,{id:"github",region:"side",list:u=>{const h=u.open.filter(v=>$e(v)===v),p=u.session.directory;return queueMicrotask(()=>h.forEach(v=>{a.load(v,p,1/0)})),h.map(l)},render:u=>t.createComponent(Io,{get address(){return u.tab.id},get session(){return u.session},get screen(){return u.screen},model:a,view:()=>i[u.tab.id],setView:h=>o(u.tab.id,h),browse:r,visible:()=>e.layout.state(s(u.tab.id),u.session)==="visible",open:h=>c(h,u.session)||r(h),replace:h=>{c(h,u.session),e.layout.close(s(u.tab.id),u.session)}}),closed:u=>{const{owner:h,repo:p,number:v}=X(u.tab.id),w=a.state.items[u.tab.id]?.item?.title;return{title:w?`#${v} ${w}`:`#${v}`,icon:"github",detail:`${h}/${p}`}}}),e.add(x.LinkHandler,{priority:10,match:u=>u.origin===e.id&&!!$e(u.href),open:u=>{const h=e.sessions.current();c(u.href,h&&(!u.session||u.session.id===h.id)?h:u.session)}});const d=async()=>{const u=e.sessions.current();if(!u)return;const h=await n(u.directory,Qr).catch(()=>{}),p=h?.ok?h.output.trim():"";if(!$e(p))return e.toast.show({title:e.t("github.command.none")});c(p,u)||r(p)};return e.add(x.Command,()=>({id:"pull-request",title:e.t("github.command"),keywords:"pull request pr github branch checks reviews merge",enabled:!!e.sessions.current(),run:()=>{d()}})),c}function dn(e){const n=new URL(e);if(/\/pull\/\d+\/(files|changes)\b/.test(n.pathname))return"files";if(/\/pull\/\d+\/commits\b/.test(n.pathname)||/^#(issuecomment|discussion|pullrequestreview)/.test(n.hash))return"timeline"}const Lo={"github.command":"Show the pull request of this branch","github.command.none":"This branch has no pull request","github.refresh":"Refresh","github.open":"Open on GitHub","github.external":"Open in your browser","github.more":"More actions","github.copy.link":"Copy link","github.copy.branch":"Copy branch name","github.copy.checkout":"Copy checkout command","github.copied":"Copied","github.copyFailed":"Could not copy","github.context":"Add to the prompt","github.kind.pull":"Pull request","github.kind.issue":"Issue","github.retry":"Try again","github.state.pull.open":"Open","github.state.pull.draft":"Draft","github.state.pull.merged":"Merged","github.state.pull.closed":"Closed","github.state.issue.open":"Open","github.state.issue.done":"Closed","github.state.issue.skipped":"Not planned","github.files.one":"{{count}} file","github.files.other":"{{count}} files","github.changed.one":"{{count}} file changed","github.changed.other":"{{count}} files changed","github.files.rest":"Show the other {{count}} files on GitHub","github.tab.summary":"Summary","github.tab.timeline":"Timeline","github.tab.files":"Files","github.meta.opened":"opened","github.meta.merged":"merged","github.meta.closed":"closed","github.none":"None","github.branch":"Branch","github.sync.current":"Up to date with {{base}}","github.sync.behind":"Behind {{base}}","github.sync.conflicts":"Conflicts with {{base}}","github.result.pass":"Passed","github.result.fail":"Failed","github.result.pending":"Running","github.result.skip":"Skipped","github.fix":"Fix","github.address":"Address","github.comments":"Comments","github.comments.none":"No comments yet.","github.commits":"Commits","github.commits.count.one":"{{count}} commit","github.commits.count.other":"{{count}} commits","github.approvals":"Approvals","github.order.newest":"Newest first","github.order.oldest":"Oldest first","github.files.expand":"Expand all","github.files.collapse":"Collapse all","github.files.filter":"Filter files","github.gate.merged":"Merged","github.gate.merged.detail":"{{user}} merged it into {{base}}.","github.gate.merged.anonymous.detail":"It is merged into {{base}}.","github.gate.closed":"Closed","github.gate.closed.detail":"It was closed without a merge.","github.gate.draft":"Draft","github.gate.draft.detail":"Mark it ready for review before you merge it.","github.gate.conflicts":"Merge conflicts","github.gate.conflicts.detail":"The branch has conflicts with {{base}}. The agent can resolve them.","github.gate.changes":"Changes requested","github.gate.changes.detail":"A reviewer asked for changes. The agent can address the review.","github.gate.failing":"Checks failed","github.gate.failing.detail":"Some checks did not pass. The agent can fix them.","github.gate.review":"Review required","github.gate.review.detail":"It needs an approval before it can merge.","github.gate.pending":"Checks are running","github.gate.pending.detail":"It can merge when the required checks pass.","github.gate.behind":"Branch is out of date","github.gate.behind.detail":"Update the branch with {{base}} before you merge.","github.gate.blocked":"Merge is blocked","github.gate.blocked.detail":"A rule of the repository stops the merge.","github.gate.unknown":"Checking for conflicts","github.gate.unknown.detail":"GitHub has not finished its check of the branch.","github.gate.ready":"Ready to merge","github.gate.ready.detail":"All requirements are met.","github.auto.merge":"Auto-merge is on, with a merge commit.","github.auto.squash":"Auto-merge is on, with squash.","github.auto.rebase":"Auto-merge is on, with rebase.","github.method.merge":"Merge","github.method.squash":"Squash and merge","github.method.rebase":"Rebase and merge","github.method.merge.detail":"GitHub adds the commits to {{base}} with a merge commit.","github.method.squash.detail":"GitHub adds the changes to {{base}} as one commit.","github.method.rebase.detail":"GitHub adds each commit to {{base}} again, with no merge commit.","github.merge.title":"Merge pull request #{{number}}?","github.merge.auto.title":"Merge pull request #{{number}} when it is ready?","github.merge.auto":"Merge when ready","github.merge.manual":"Turn off auto-merge","github.merge.other":"Other merge methods","github.hand.conflicts":"Resolve conflicts","github.hand.review":"Address the review","github.hand.checks":"Fix the checks","github.hand.issue":"Fix with the agent","github.ask.conflicts":"Resolve the merge conflicts of this pull request with {{base}}, then push the branch.","github.ask.review":"Address the review feedback on this pull request, then push the branch.","github.ask.checks":"Find why the checks of this pull request failed, fix the cause, then push the branch.","github.ask.check":"Find why the check {{check}} failed, fix the cause, then push the branch.","github.ask.issue":"Fix this issue.","github.ready":"Ready for review","github.draft":"Convert to draft","github.update":"Update branch","github.reopen":"Reopen","github.close.pull":"Close pull request","github.close.pull.title":"Close pull request #{{number}}?","github.close.issue":"Close issue","github.close.issue.title":"Close issue #{{number}}?","github.action.failed":"GitHub did not make the change","github.checks":"Checks","github.checks.failing":"{{count}} of {{total}} failed","github.checks.running":"{{count}} of {{total}} running","github.checks.passed":"All passed","github.checks.some":"{{count}} of {{total}} passed","github.checks.more.one":"Show {{count}} more check","github.checks.more.other":"Show {{count}} more checks","github.checks.less":"Show fewer checks","github.reviewers":"Reviewers","github.reviews.approved":"Approved","github.reviews.changes":"Changes requested","github.reviews.required":"Review required","github.reviews.waiting":"Waiting for review","github.reviews.commented":"Reviewed","github.verdict.approved":"Approved","github.verdict.changes":"Changes requested","github.verdict.commented":"Commented","github.verdict.dismissed":"Dismissed","github.verdict.requested":"Requested","github.type":"Type","github.labels":"Labels","github.assignees":"Assignees","github.milestone":"Milestone","github.parent":"Parent issue","github.subIssues":"Sub-issues","github.subIssues.value":"{{done}} of {{total}} done","github.pulls":"Pull requests","github.issue.open":"Open","github.issue.open.detail":"No pull request closes it yet. The agent can work on it.","github.issue.done":"Closed as completed","github.issue.done.detail":"It is done.","github.issue.skipped":"Closed as not planned","github.issue.skipped.detail":"No work is planned for it.","github.issue.pulls.one":"{{count}} pull request closes it when it merges.","github.issue.pulls.other":"{{count}} pull requests close it when they merge.","github.description":"Description","github.description.none":"No description.","github.event.opened.pull":"opened this pull request","github.event.opened.issue":"opened this issue","github.event.comment":"commented","github.event.review.approved":"approved these changes","github.event.review.changes":"requested changes","github.event.review.commented":"reviewed","github.event.review.dismissed":"reviewed (dismissed)","github.event.merged":"merged into {{base}}","github.event.closed.pull":"Closed without a merge","github.event.closed.done":"Closed as completed","github.event.closed.skipped":"Closed as not planned","github.event.closed.open":"Closed","github.diff.none":"GitHub shows no diff for this file.","github.diff.skipped.one":"{{count}} unchanged line","github.diff.skipped.other":"{{count}} unchanged lines","github.error.cli":"The GitHub CLI is not installed","github.error.cli.detail":"The panel reads GitHub with the gh command. Install it from cli.github.com, then run gh auth login.","github.error.auth":"The GitHub CLI is not logged in","github.error.auth.detail":"Run gh auth login in a terminal, then try again.","github.error.gone":"Not found","github.error.gone.detail":"It does not exist, or your GitHub account cannot see it.","github.error.other":"Could not load it from GitHub","github.error.other.detail":"The gh command did not complete."};function No(e){const n=r=>{if(r.defaultPrevented||r.metaKey||r.ctrlKey||r.shiftKey||r.altKey)return;const a=r.target instanceof Element?r.target.closest("a[href]"):null;!(a instanceof HTMLAnchorElement)||!/^https?:$/.test(a.protocol)||a.closest('[role="dialog"]')||e(a.href)&&r.preventDefault()};return document.addEventListener("click",n),()=>document.removeEventListener("click",n)}function Po({label:e,icon:n,shortcut:r,onSelect:a}){const i=document.createElement("hr");i.setAttribute("data-slot","menu-v2-separator");const o=document.createElement("div");o.setAttribute("role","menuitem"),o.setAttribute("data-component","menu-v2-item");const s=document.createElement("span");if(s.setAttribute("data-slot","menu-v2-item-content"),n(s),s.append(e),o.append(s),r){const c=document.createElement("span");c.setAttribute("data-slot","menu-v2-item-shortcut"),c.textContent=r,o.append(c)}return o.addEventListener("pointerenter",()=>o.setAttribute("data-highlighted","")),o.addEventListener("pointerleave",()=>o.removeAttribute("data-highlighted")),o.addEventListener("click",()=>{o.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:!0})),a()}),queueMicrotask(()=>{const c=o.closest('[role="menu"]')?.querySelector("[data-appearance]")?.getAttribute("data-appearance");c&&(o.setAttribute("data-appearance",c),i.setAttribute("data-appearance",c))}),[i,o]}const Oo=["small","medium","large","unrestricted"];function jn(e={}){const n=e.archiveAfterHours,r=e.workflowConcurrency;return{archiveAfterHours:typeof n=="number"&&n>=0?n:12,hideAgent:typeof e.hideAgent=="string"||e.hideAgent===!1?e.hideAgent:"build",responseLabel:typeof e.responseLabel=="string"?e.responseLabel:e.responseLabel===!1?"":"Response",lowercaseVariants:e.lowercaseVariants!==!1,github:e.github!==!1,workflows:e.workflows!==!1,workflowSize:Oo.includes(e.workflowSize)?e.workflowSize:"medium",workflowConcurrency:Number.isInteger(r)&&r>=1?Math.min(r,256):void 0}}const zo="[data-timeline-virtual-content]",Zn='[data-slot="session-turn-message-container"]',Re="data-plus-final",pt=`[${Re}] > [data-component="session-turn"] > ${Zn}`,Pt="--plus-label-half";function Bo(e){return`
${pt} {
  --plus-gap: calc(var(${Pt}, ${e.length*3.75}px) + 12px);
  position: relative;
}
${pt}::before {
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
${pt}::after {
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
`}let gn=!1;function Fo(e){const n=document.querySelector(Zn);if(gn||!e||!n||document.fonts?.status==="loading")return;const r=document.createElement("span");r.textContent=e,r.style.cssText="position: absolute; visibility: hidden; white-space: nowrap; font-size: 13px; font-weight: 440; letter-spacing: -0.04px",n.append(r);const a=r.getBoundingClientRect().width;r.remove(),a&&(document.documentElement.style.setProperty(Pt,`${a/2}px`),gn=!0)}const ce=e=>e?.frame?.getAttribute("data-timeline-row"),se=e=>e?.frame?.getAttribute("data-message-id"),ft=e=>ce(e)==="AssistantPart"&&!!e.frame.querySelector('[data-component="text-part"]')&&!e.frame.querySelector('[data-component="tool-part-wrapper"], [data-timeline-part-ids]');function Uo(e){document.querySelectorAll(zo).forEach(n=>{const r=Array.from(n.querySelectorAll(":scope > div > [data-timeline-key]"),l=>({wrapper:l,frame:l.querySelector(":scope > [data-index] > [data-timeline-row]"),top:parseFloat(l.style.top),height:parseFloat(l.style.height)})).sort((l,d)=>l.top-d.top),a=n.querySelector(':scope > [data-timeline-row="bottom-spacer"]'),i=l=>r[l+1]&&Math.abs(r[l+1].top-(r[l].top+r[l].height))<2?r[l+1]:void 0,o=l=>r[l-1]&&Math.abs(r[l].top-(r[l-1].top+r[l-1].height))<2?r[l-1]:void 0,s=l=>l===r.length-1&&!!a&&Math.abs(r[l].wrapper.getBoundingClientRect().bottom-a.getBoundingClientRect().top)<2,c=e?void 0:!0,g=l=>{const d=i(l);return d?d.frame?ce(d)==="TurnGap"||ce(d)==="UserMessage"||se(d)&&se(d)!==se(r[l])||ce(d)==="TurnDiff"||ce(d)==="TurnDivider"?!0:ce(d)==="AssistantPart"||ce(d)==="Thinking"?!1:c:c:r[l+1]||!s(l)?void 0:c};r.forEach((l,d)=>{if(!ft(l))return bt(l,!1);const u=g(d);if(u===void 0)return;if(!u){const p=i(d);ft(p)&&se(p)===se(l)||bt(l,!1);return}let h=d;for(;ft(o(h))&&se(o(h))===se(l);)h-=1;for(let p=h;p<=d;p+=1)bt(r[p],p===h&&r[p].frame.hasAttribute("data-timeline-spacing"))})})}const Me=new Map,bt=(e,n)=>{!e.frame||e.frame.hasAttribute(Re)===n||(he(e.frame,Re,n?"":void 0),Me.set(e.frame.parentElement,10))};function Ho(){Me.forEach((e,n)=>{if(!(n.isConnected&&Math.abs(n.offsetHeight-parseFloat(n.parentElement.style.height))>=1)||e===0)return Me.delete(n);Me.set(n,e-1),n.style.paddingBottom="1px",requestAnimationFrame(()=>n.style.removeProperty("padding-bottom"))})}const Go=()=>Me.size>0;function Wo(){document.querySelectorAll(`[${Re}]`).forEach(e=>e.removeAttribute(Re)),document.documentElement.style.removeProperty(Pt)}const Vo='[data-component="tooltip-v2-trigger"] > button:not([aria-haspopup]):has([data-component="progress-circle"])',O="data-plus-usage",hn="plus-usage-card",_t="data-plus-usage-hover",Ko=50,Jo=100,Yo=4,Qo=`
:root[${_t}] [data-component="tooltip-v2"]:not([data-force-open="true"]) {
  display: none;
}
[${O}] {
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
[${O}]:dir(rtl) {
  transform-origin: top left;
}
[${O}] [data-part="row"] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
  white-space: nowrap;
}
[${O}] [data-part="row"] > :last-child {
  margin-inline-start: auto;
}
[${O}] :is([data-part="value"], [data-part="percent"]) {
  color: var(--v2-text-text-base);
}
[${O}] [data-part="percent"] {
  font-weight: 530;
}
[${O}] [data-part="bar"] {
  display: flex;
  height: 8px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--v2-background-bg-layer-03);
}
[${O}] [data-part="bar"] > span {
  box-sizing: border-box;
  min-width: 3px;
}
/* A line in the card's color between kinds, as in Cursor's bar. */
[${O}] [data-part="bar"] > span + span {
  border-inline-start: 1px solid var(--v2-background-bg-layer-01);
}
[${O}] [data-part="legend"] {
  display: flex;
  flex-direction: column;
}
[${O}] [data-part="dot"] {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
[${O}] hr {
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
  [${O}] {
    animation: none;
  }
}
:root[data-motion="reduce"] [${O}] {
  animation: none;
}
`;function jo(e){let n,r,a=0;const i=document.documentElement,o=(f,_)=>{clearTimeout(a),a=setTimeout(f,_)},s=f=>f.target instanceof Element?f.target.closest(Vo):null,c=f=>f instanceof Node&&!!(n?.contains(f)||r?.card.contains(f)),g=()=>{if(!n.isConnected)return;const f=document.createElement("div"),_=n.closest("[data-theme]")?.getAttribute("data-theme");f.id=hn,f.setAttribute(O,""),f.setAttribute("role","tooltip"),_&&f.setAttribute("data-theme",_),r={card:f,stop:e(f)},document.body.append(f),ts(f,n),n.setAttribute("aria-describedby",hn)},l=()=>{clearTimeout(a),r?.stop(),r?.card.remove(),r=void 0,n?.removeAttribute("aria-describedby")},d=f=>{if(f===n){r&&clearTimeout(a);return}u(),n=f,i.setAttribute(_t,""),o(g,Ko)},u=()=>{l(),n=void 0,i.removeAttribute(_t)},h=f=>{if(f.pointerType==="touch")return;const _=s(f);if(_)return d(_);if(r?.card.contains(f.target))return clearTimeout(a);n&&!n.isConnected&&u()},p=f=>{!n||c(f.relatedTarget)||!c(f.target)||(r?o(u,Jo):u())},v=f=>{n?.contains(f.target)&&l()},w=f=>{f.key==="Escape"&&l()},y=f=>{const _=s(f);_?.matches(":focus-visible")&&d(_)},$=f=>{n?.contains(f.target)&&!c(f.relatedTarget)&&u()};return document.addEventListener("pointerover",h),document.addEventListener("pointerout",p),document.addEventListener("pointerdown",v,!0),document.addEventListener("keydown",w),document.addEventListener("focusin",y),document.addEventListener("focusout",$),()=>{document.removeEventListener("pointerover",h),document.removeEventListener("pointerout",p),document.removeEventListener("pointerdown",v,!0),document.removeEventListener("keydown",w),document.removeEventListener("focusin",y),document.removeEventListener("focusout",$),u()}}function Zo(e){const n=e.server.data,r=e.directory?{directory:e.directory}:void 0,a=n.session.get(e.id),i=n.session.message.list(e.id),o=xr.lastAssistantWithUsage(i,a?.revert?.messageID),s=o?.tokens,c=s?s.input+s.output+s.reasoning+s.cache.read+s.cache.write:0,g=o?mn(n,r,o.model)?.limit.context:void 0,l=n.session.cost(e.id),d=a?.model??i.findLast(p=>p.type==="assistant")?.model,u=d?mn(n,r,d):void 0,h=!!u&&u.cost.every(p=>!p.input&&!p.output&&!p.cache.read&&!p.cache.write);return{total:c,tokens:s,limit:g||void 0,percent:g?Math.round(c/g*100):void 0,cost:l>0||!h?l:void 0}}function Xo({total:e,tokens:n,limit:r,percent:a,cost:i},o,s){const c=h=>new Intl.NumberFormat(s,{notation:"compact",maximumFractionDigits:0}).format(h).toLocaleLowerCase(s),g=n?es.map(h=>({...h,value:h.value(n)})).filter(h=>h.value>0):[],l=Math.max(r??0,e),d=F("span",void 0,r?`${c(e)} / ${c(r)} `:c(e));r&&d.append(F("span","percent",`(${a}%)`));const u=[vt([F("span",void 0,o("usage.window")),d])];if(l>0){const h=F("div","bar");h.setAttribute("aria-hidden","true"),g.forEach(p=>{const v=F("span");v.style.width=`${p.value/l*100}%`,v.style.background=p.color,h.append(v)}),u.push(h)}if(g.length){const h=F("div","legend");g.forEach(p=>{const v=F("span","dot");v.style.background=p.color,h.append(vt([v,F("span",void 0,o(p.label)),F("span","value",p.value.toLocaleString(s))]))}),u.push(h)}if(i!==void 0){const h=new Intl.NumberFormat(s,{style:"currency",currency:"USD"});u.push(F("hr"),vt([F("span",void 0,o("usage.cost")),F("span","value",h.format(i))]))}return u}const es=[{label:"usage.cacheRead",color:"var(--v2-avatar-border-blue)",value:e=>e.cache.read},{label:"usage.cacheWrite",color:"var(--v2-avatar-border-purple)",value:e=>e.cache.write},{label:"usage.input",color:"var(--v2-avatar-border-pink)",value:e=>e.input},{label:"usage.reasoning",color:"var(--v2-avatar-border-yellow)",value:e=>e.reasoning},{label:"usage.output",color:"var(--v2-avatar-border-green)",value:e=>e.output}],mn=(e,n,r)=>{const a=e.location.provider.list(n),i=e.location.model.list(n);if(a?.some(o=>o.id===r.providerID))return i?.findLast(o=>o.providerID===r.providerID&&o.id===r.id&&o.status!=="deprecated")},F=(e,n,r)=>{const a=document.createElement(e);return n&&a.setAttribute("data-part",n),r!==void 0&&(a.textContent=r),a},vt=e=>{const n=F("div","row");return n.append(...e),n},ts=(e,n)=>{const r=n.getBoundingClientRect(),a=e.offsetWidth,i=getComputedStyle(n).direction==="rtl"?r.left:r.right-a;e.style.top=`${r.bottom+Yo}px`,e.style.left=`${Math.max(8,Math.min(i,innerWidth-a-8))}px`},Ot='[data-component="user-message"]',ns=`${Ot} [data-slot="user-message-actions"]`,Xn='[data-slot="user-message-text"]',rs='[data-component="tooltip-v2-trigger"]',je="data-plus-copy",as=`
[${je}] {
  display: contents;
}
[${je}] [data-slot="icon-svg"] {
  width: 14px;
  height: 14px;
}
`,De=new Map;function is(e){De.forEach((n,r)=>{r.isConnected||(n(),r.remove(),De.delete(r))}),document.querySelectorAll(ns).forEach(n=>{const r=n.querySelector(`:scope > ${rs}`);if(!r||n.querySelector(`:scope > [${je}]`)||!n.closest(Ot).querySelector(Xn))return;const a=document.createElement("span");a.setAttribute(je,""),a.addEventListener("mousedown",i=>i.preventDefault()),De.set(a,e(a)),n.insertBefore(a,r)})}const os=({ui:e,label:n,copied:r,write:a})=>i=>t.render(()=>{const[o,s]=m.createSignal(!1),c=()=>o()?r:n,g=async l=>{l.stopPropagation(),await a(ss(i.closest(Ot)))&&(s(!0),setTimeout(()=>s(!1),2e3))};return m.createComponent(e.Tooltip,{get value(){return c()},get children(){return m.createComponent(e.IconButton,{get icon(){return o()?"check":"outline-copy"},get label(){return c()},size:"small",onClick:g})}})},i),ss=e=>{const n=e.querySelector(Xn).cloneNode(!0);return n.querySelectorAll('[data-slot="user-message-comments"], [data-slot="user-message-fold-toggle"]').forEach(r=>r.remove()),n.querySelectorAll("[data-session-reference]").forEach(r=>r.replaceWith(r.dataset.sessionReference)),n.textContent};function ls(){De.forEach((e,n)=>{e(),n.remove()}),De.clear()}const Y={type:"object"},ae={type:"string"},Pe={type:"object",properties:{runID:ae,sessionID:ae},required:["runID"]},pn={type:"object",properties:{runID:ae,sessionID:ae,agentID:ae},required:["runID","agentID"]},wt=yr.Rpc.define({id:"opencode-plus",methods:{list:{input:{type:"object",properties:{sessionID:ae},required:["sessionID"]},output:Y},get:{input:Pe,output:Y},agent:{input:pn,output:Y},stop:{input:Pe,output:Y},pause:{input:Pe,output:Y},resume:{input:Pe,output:Y},stopAgent:{input:pn,output:Y},save:{input:{type:"object",properties:{runID:ae,sessionID:ae,scope:{enum:["project","personal"]}},required:["runID","scope"]},output:Y},ultracode:{input:{type:"object",properties:{sessionID:{type:"string"},on:{type:"boolean"}},required:["sessionID"]},output:Y}},events:{changed:{schema:Y},ultracode:{schema:Y}}}),cs=60*1e3;function us(e,{onStart:n}){const[r,a]=ge.createStore({runs:{},sessions:{},agents:{},results:{},details:{},ultracode:{}}),i=new Set,o=l=>l.server.client.rpc(wt),s=l=>({location:{directory:l.directory}}),c=l=>{const d=r.runs[l.id];return m.batch(()=>{a("runs",l.id,ge.reconcile(l)),r.sessions[l.sessionID]?.includes(l.id)||a("sessions",l.sessionID,(u=[])=>[l.id,...u])}),!d},g=(l,d)=>m.batch(()=>{r.agents[l]||a("agents",l,{});for(const u of d)a("agents",l,u.id,ge.reconcile(u))});return x.createKeyed(()=>e.servers.get("sidecar")?.client,l=>m.onCleanup(l.rpc(wt).events.on("changed",d=>{const{run:u,agents:h}=d.data,p=c(u);g(u.id,h),p&&Date.now()-u.created<cs&&n(u)}))),x.createKeyed(()=>e.servers.get("sidecar")?.client,l=>m.onCleanup(l.rpc(wt).events.on("ultracode",d=>a("ultracode",d.data.sessionID,d.data.on)))),{state:r,runs:l=>(r.sessions[l]??[]).map(d=>r.runs[d]).filter(Boolean),run:l=>r.runs[l],agents:l=>Object.values(r.agents[l]??{}).toSorted($i),detail:(l,d)=>r.details[`${l}/${d}`],active:l=>(r.sessions[l]??[]).map(d=>r.runs[d]).filter(d=>d&&Lt(d.status)),async load(l,d){if(!i.has(d)){i.add(d);try{const[{runs:u},{on:h}]=await Promise.all([o(l).list({sessionID:d},s(l)),o(l).ultracode({sessionID:d},s(l))]);m.batch(()=>{for(const p of u.toReversed())c(p);a("ultracode",d,h)})}catch{i.delete(d)}}},result:l=>r.results[l],async open(l,d){const{run:u}=await o(l).get({runID:d,sessionID:r.runs[d]?.sessionID},s(l));m.batch(()=>{g(u.id,u.agents??[]),u.result!==void 0&&a("results",u.id,u.result)})},async describe(l,d,u){const{agent:h}=await o(l).agent({runID:d,agentID:u,sessionID:r.runs[d]?.sessionID},s(l));a("details",`${d}/${u}`,h)},stop:(l,d)=>o(l).stop({runID:d},s(l)),pause:(l,d)=>o(l).pause({runID:d},s(l)),resume:(l,d)=>o(l).resume({runID:d},s(l)),stopAgent:(l,d,u)=>o(l).stopAgent({runID:d,agentID:u},s(l)),save:(l,d,u)=>o(l).save({runID:d,scope:u,sessionID:r.runs[d]?.sessionID},s(l)),ultracode:l=>r.ultracode[l]===!0,setUltracode:async(l,d,u)=>{a("ultracode",d,u),await o(l).ultracode({sessionID:d,on:u},s(l))}}}const ds=["filePath","file","command","pattern","query","url","path","description","prompt","name"];function gs(e,n){if(!e||typeof e!="object")return"";const r=ds.find(i=>typeof e[i]=="string"&&e[i].trim()),a=r?e[r]:Object.values(e).find(i=>typeof i=="string"&&i.trim());return a?ms(hs(a,n),120):""}function hs(e,n){if(!n)return e;const r=n.endsWith("/")?n:`${n}/`;return e===n?".":e.split(r).join("")}function ms(e,n){const r=String(e).replace(/\s+/g," ").trim();return r.length>n?`${r.slice(0,n-1)}…`:r}var ps=t.template('<div class="relative size-full min-w-0 overflow-hidden bg-v2-background-bg-base flex flex-col outline-none">'),fs=t.template('<span class="min-w-0 flex-1 truncate text-[13px] font-[530] leading-4 tracking-[-0.04px] text-v2-text-text-base">'),bs=t.template('<span class="flex shrink-0 items-center gap-2 text-[13px] font-[440] leading-[var(--line-height-compact)] tracking-[-0.04px] text-v2-text-text-muted">'),vs=t.template('<div class="flex w-full min-w-0 flex-col gap-3 px-6 pt-6 pb-10">'),ws=t.template('<div class="mx-auto flex max-w-[360px] flex-col items-center gap-4 px-6 pt-20 text-center"><div class="flex flex-col gap-2"><div class="text-[13px] font-[530] leading-[var(--line-height-compact)] text-v2-text-text-base"></div><div class="text-[13px] font-[440] leading-[var(--line-height-compact)] text-v2-text-text-muted">'),$s=t.template('<button type=button class="flex h-[41px] w-full items-center justify-between gap-4 rounded-[8px] border-[0.5px] border-v2-border-border-base bg-v2-background-bg-layer-01 px-3.5 text-start hover:bg-v2-background-bg-layer-02"><span class="flex min-w-0 items-center gap-2 text-[13px] font-[440] leading-[var(--line-height-compact)] tracking-[-0.04px]"><span class="shrink-0 text-v2-text-text-base"></span><span class="truncate text-v2-text-text-muted"></span></span><span class="text-[11px] tabular-nums whitespace-nowrap text-v2-text-text-muted">'),er=t.template('<span class="min-w-0 truncate text-[13px] font-[530] leading-4 tracking-[-0.04px] text-v2-text-text-base">'),tr=t.template('<span class="min-w-0 flex-1">'),nr=t.template('<div class="shrink-0 px-3 py-1.5 text-12-regular text-v2-state-fg-danger border-b border-v2-border-border-muted">'),xs=t.template('<button type=button class="w-fit pt-1 text-[12px] font-[440] leading-4 tracking-[-0.04px] text-v2-text-text-faint hover:text-v2-text-text-base">'),ys=t.template('<div class="flex flex-col gap-1 rounded-[8px] border-[0.5px] border-v2-border-border-base bg-v2-background-bg-layer-01 px-3.5 py-2.5">'),rr=t.template('<section class="flex flex-col gap-1"><h2 class="pb-1 text-[13px] font-[440] text-v2-text-text-muted">'),ks=t.template('<div class="flex w-full min-w-0 flex-col gap-4 px-6 pt-6 pb-10"><div class="flex flex-col gap-2"><div class="text-[13px] font-[440] leading-[var(--line-height-compact)] text-v2-text-text-muted">'),Cs=t.template('<div class="break-words text-[12px] font-[440] leading-4 tracking-[-0.04px] text-v2-text-text-muted">'),Ss=t.template('<section class="flex flex-col gap-1"><h2 class="flex items-center justify-between gap-4 px-2 pb-1 text-[13px] font-[440] text-v2-text-text-muted"><span class="min-w-0 truncate"></span><span class="text-[11px] tabular-nums whitespace-nowrap text-v2-text-text-muted">'),_s=t.template('<button type=button class="flex h-8 w-full shrink-0 items-center gap-2 rounded-[6px] px-2 text-start text-[13px] font-[440] hover:bg-v2-background-bg-layer-02"><span class="max-w-[45%] shrink-0 truncate text-v2-text-text-base"></span><span class="min-w-0 flex-1 truncate text-v2-text-text-muted"></span><span class="text-[11px] tabular-nums whitespace-nowrap text-v2-text-text-muted">'),As=t.template('<div class="truncate text-[13px] font-[440] leading-[var(--line-height-compact)] text-v2-text-text-muted">'),Es=t.template('<div class="flex w-full min-w-0 flex-col gap-4 px-6 pt-6 pb-10"><div data-component=user-message><div data-slot=user-message-body><div data-slot=user-message-text dir=auto>'),Is=t.template("<span class=capitalize>"),Ms=t.template("<div data-component=context-tool-group-list>"),Ds=t.template("<div data-slot=context-tool-group-item>"),Ts=t.template("<span data-slot=basic-tool-tool-subtitle>"),Rs=t.template("<span data-slot=basic-tool-tool-arg class=text-v2-state-fg-danger>"),qs=t.template("<div data-component=tool-trigger><div data-slot=basic-tool-tool-trigger-content><div data-slot=basic-tool-tool-info><div data-slot=basic-tool-tool-info-structured><div data-slot=basic-tool-tool-info-main><span data-slot=basic-tool-tool-title>"),ar=t.template("<div data-component=text-part><div data-slot=text-part-body>"),Ls=t.template("<div data-slot=permission-row><span data-slot=permission-spacer aria-hidden=true></span><div data-slot=permission-patterns>"),Ns=t.template("<div data-component=dock-prompt data-kind=permission><div data-slot=permission-body><div data-slot=permission-header><div data-slot=permission-row data-variant=header><span data-slot=permission-icon></span><div data-slot=permission-header-title></div></div></div><div data-slot=permission-content><div data-slot=permission-row><span data-slot=permission-spacer aria-hidden=true></span><div data-slot=permission-hint></div></div></div></div><div data-slot=permission-footer><div></div><div data-slot=permission-footer-actions>"),Ps=t.template('<code class="text-text-base break-all">'),Os=t.template('<div class="flex min-w-0 flex-wrap items-center gap-1.5 text-[12px] font-[440] leading-4 tracking-[-0.04px] tabular-nums text-v2-text-text-faint">'),zs=t.template("<span aria-hidden=true>·"),Bs=t.template("<span class=shrink-0>"),Fs=t.template('<span class="flex size-4 shrink-0 items-center justify-center text-v2-icon-icon-faint">'),Us=t.template('<span class="flex items-center gap-1.5">'),Hs=t.template("<span data-component=text-shimmer style=--text-shimmer-swap:220ms;--text-shimmer-index:0><span data-slot=text-shimmer-char><span data-slot=text-shimmer-char-base aria-hidden=true></span><span data-slot=text-shimmer-char-shimmer aria-hidden=true>");function Gs(e){const n=()=>ue(e.session),r=()=>e.nav.get(n());return x.createKeyed(n,a=>{e.model.load(e.session,a)}),(()=>{var a=ps();return t.insert(a,t.createComponent(m.Switch,{get fallback(){return t.createComponent(Ws,t.mergeProps(e,{get sessionID(){return n()}}))},get children(){return[t.createComponent(m.Match,{get when(){return t.memo(()=>!!r().agentID)()&&e.model.run(r().runID)},get children(){return t.createComponent(Ys,t.mergeProps(e,{get sessionID(){return n()},get runID(){return r().runID},get agentID(){return r().agentID}}))}}),t.createComponent(m.Match,{get when(){return t.memo(()=>!!r().runID)()&&e.model.run(r().runID)},get children(){return t.createComponent(Ks,t.mergeProps(e,{get sessionID(){return n()},get runID(){return r().runID}}))}})]}})),a})()}function ue(e){const n=e.server.data;let r=e.id;for(let a=0;a<8;a++){const i=n.session.get(r)?.parentID;if(!i)return r;r=i}return r}function Ws(e){const n=x.usePlugin(),r=()=>e.model.runs(e.sessionID);return[t.createComponent(Ze,{get children(){return[(()=>{var a=fs();return t.insert(a,()=>n.t("wf.title")),a})(),t.createComponent(n.ui.Tooltip,{get value(){return n.t("wf.ultracode.hint")},placement:"top",get children(){var a=bs();return t.insert(a,()=>n.t("wf.ultracode"),null),t.insert(a,t.createComponent(n.ui.Switch,{get label(){return n.t("wf.ultracode")},hideLabel:!0,get checked(){return e.model.ultracode(e.sessionID)},onChange:i=>{e.model.setUltracode(e.session,e.sessionID,i)}}),null),a}})]}}),t.createComponent(Xe,{get children(){return t.createComponent(m.Show,{get when(){return r().length>0},get fallback(){return(()=>{var a=ws(),i=a.firstChild,o=i.firstChild,s=o.nextSibling;return t.insert(a,t.createComponent(n.ui.Icon,{name:"fork",size:"large",class:"text-v2-icon-icon-muted"}),i),t.insert(o,()=>n.t("wf.empty.title")),t.insert(s,()=>n.t("wf.empty.body")),a})()},get children(){var a=vs();return t.insert(a,t.createComponent(m.For,{get each(){return r()},children:i=>t.createComponent(Vs,{run:i,onOpen:()=>e.nav.go(e.sessionID,{runID:i.id})})})),a}})}})]}function Vs(e){const n=x.usePlugin(),r=Le(()=>Lt(e.run.status)),a=()=>el(e.run.counts??{});return(()=>{var i=$s(),o=i.firstChild,s=o.firstChild,c=s.nextSibling,g=o.nextSibling;return i.$$click=()=>e.onOpen(),t.insert(o,t.createComponent(nt,{get status(){return e.run.status}}),s),t.insert(s,()=>e.run.name),t.insert(c,()=>e.run.description),t.insert(g,t.createComponent(m.Show,{get when(){return e.run.counts?.total>0},get children(){return`${a()}/${e.run.counts.total} · `}}),null),t.insert(g,()=>rt(n,(e.run.ended??r())-(e.run.started??e.run.created)),null),i})()}function Ks(e){const n=x.usePlugin(),r=()=>e.model.run(e.runID),a=()=>e.model.agents(e.runID),i=()=>Lt(r().status),o=Le(i),s=m.createMemo(()=>kt(a())),[c,g]=m.createSignal(!1);x.createKeyed(()=>`${e.runID}/${i()}`,()=>{e.model.open(e.session,e.runID).catch(()=>{})});const l=h=>()=>{h().catch(p=>n.toast.show({variant:"error",title:n.t("wf.error"),description:zt(p)}))},d=h=>l(async()=>{const{path:p}=await e.model.save(e.session,e.runID,h);n.toast.show({variant:"success",title:n.t("wf.saved",{name:`/${r().name}`}),description:p})}),u=()=>[{label:n.t("wf.save.project"),icon:"folder",onSelect:d("project")},{label:n.t("wf.save.personal"),icon:"download",onSelect:d("personal")},{type:"separator"},{label:n.t("wf.copy.script"),icon:"outline-copy",onSelect:()=>{n.system.copy(r().scriptPath)}},{label:n.t("wf.copy.id"),icon:"outline-copy",onSelect:()=>{n.system.copy(r().id)}},...n.desktop?[{label:n.t("wf.reveal"),icon:"folder",onSelect:()=>{n.desktop.reveal(r().scriptPath)}}]:[]];return[t.createComponent(Ze,{get children(){return[t.createComponent(or,{get label(){return n.t("wf.back.runs")},onClick:()=>e.nav.go(e.sessionID,{})}),(()=>{var h=er();return t.insert(h,()=>r().name),h})(),tr(),t.createComponent(m.Show,{get when(){return r().status==="running"},get children(){return t.createComponent(n.ui.Button,{variant:"ghost-muted",size:"small",get onClick(){return l(()=>e.model.pause(e.session,e.runID))},get children(){return n.t("wf.pause")}})}}),t.createComponent(m.Show,{get when(){return r().status==="paused"},get children(){return t.createComponent(n.ui.Button,{variant:"ghost-muted",size:"small",get onClick(){return l(()=>e.model.resume(e.session,e.runID))},get children(){return n.t("wf.resume")}})}}),t.createComponent(m.Show,{get when(){return r().status==="running"||r().status==="paused"},get children(){return t.createComponent(Ce,{icon:"stop",get label(){return n.t("wf.stop")},get onClick(){return l(()=>e.model.stop(e.session,e.runID))}})}}),t.createComponent(n.ui.Menu,{get label(){return n.t("wf.more")},icon:"outline-dots",placement:"bottom-end",get items(){return u()}})]}}),t.createComponent(m.Show,{get when(){return r().error},get children(){var h=nr();return t.insert(h,()=>r().error),h}}),t.createComponent(Xe,{get children(){var h=ks(),p=h.firstChild,v=p.firstChild;return t.insert(p,t.createComponent(sr,{get parts(){return[t.createComponent(lr,{get status(){return r().status}}),rt(n,(r().ended??o())-(r().started??r().created)),s().total>0&&n.t("wf.agents",{done:s().finished,total:s().total}),s().running>0&&n.t("wf.running",{count:s().running}),s().queued>0&&n.t("wf.queued",{count:s().queued}),s().failed>0&&n.t("wf.failed",{count:s().failed}),r().spent>0&&n.t("wf.tokens",{count:Ke(r().spent)}),r().total&&n.t("wf.budget",{count:Ke(r().total)})]}}),v),t.insert(v,()=>r().description),t.insert(h,t.createComponent(m.Show,{get when(){return r().status==="pending"},get children(){return t.createComponent(js,t.mergeProps(e,{get run(){return r()}}))}}),null),t.insert(h,t.createComponent(m.Show,{get when(){return r().logs?.length>0},get children(){var w=ys();return t.insert(w,t.createComponent(m.For,{get each(){return t.memo(()=>!!c())()?r().logs:r().logs.slice(-3)},children:y=>(()=>{var $=Cs();return t.insert($,()=>y.message),$})()}),null),t.insert(w,t.createComponent(m.Show,{get when(){return r().logs.length>3},get children(){var y=xs();return y.$$click=()=>g(!c()),t.insert(y,(()=>{var $=t.memo(()=>!!c());return()=>$()?n.t("wf.logs.less"):n.t("wf.logs.all",{count:r().logs.length})})()),y}}),null),w}}),null),t.insert(h,t.createComponent(m.For,{get each(){return t.memo(()=>r().status==="pending")()?[]:wi(r().phases??[],a())},children:w=>t.createComponent(m.Show,{get when(){return w.agents.length>0},get children(){var y=Ss(),$=y.firstChild,f=$.firstChild,_=f.nextSibling;return t.insert(f,()=>w.title??n.t("wf.phase.none")),t.insert(_,()=>`${kt(w.agents).finished}/${w.agents.length}`),t.insert(y,t.createComponent(m.For,{get each(){return w.agents},children:q=>t.createComponent(Js,{agent:q,now:o,onOpen:()=>e.nav.go(e.sessionID,{runID:e.runID,agentID:q.id})})}),null),y}})}),null),t.insert(h,t.createComponent(m.Show,{get when(){return t.memo(()=>r().status==="completed")()&&e.model.result(e.runID)!==void 0},get children(){var w=rr(),y=w.firstChild;return t.insert(y,()=>n.t("wf.result")),t.insert(w,t.createComponent(ir,{get text(){return e.model.result(e.runID)}}),null),w}}),null),h}})]}function Js(e){const n=x.usePlugin(),r=()=>{const a=e.agent;return a.status==="queued"?n.t("wf.agent.queued"):a.error?a.error:a.status==="running"&&a.lastTool?`${cr(n,a.lastTool.name)} ${a.lastTool.summary}`:a.status==="running"?n.t("session.timeline.working"):a.result?a.result:""};return(()=>{var a=_s(),i=a.firstChild,o=i.nextSibling,s=o.nextSibling;return a.$$click=()=>e.onOpen(),t.insert(a,t.createComponent(nt,{get status(){return e.agent.status}}),i),t.insert(i,()=>e.agent.label),t.insert(o,r),t.insert(s,()=>[e.agent.cached&&n.t("wf.cached"),Je(e.agent)>0&&Ke(Je(e.agent)),e.agent.started&&rt(n,(e.agent.ended??e.now())-e.agent.started)].filter(Boolean).join(" · ")),t.effect(()=>o.classList.toggle("text-v2-state-fg-danger",e.agent.status==="failed")),a})()}function Ys(e){const n=x.usePlugin(),r=()=>e.model.state.agents[e.runID]?.[e.agentID],a=()=>e.model.detail(e.runID,e.agentID),i=Le(()=>r()?.status==="running");x.createKeyed(()=>`${e.runID}/${e.agentID}/${r()?.status}`,()=>{e.model.describe(e.session,e.runID,e.agentID).catch(()=>{})});const o=()=>{const g=r()?.sessionID;g&&n.tabs.open({server:e.session.server.id,id:g},{focus:!0})},s=()=>{e.model.stopAgent(e.session,e.runID,e.agentID).catch(g=>n.toast.show({variant:"error",title:n.t("wf.error"),description:zt(g)}))},c=()=>a()?.result??r()?.result;return t.createComponent(m.Show,{get when(){return r()},get children(){return[t.createComponent(Ze,{get children(){return[t.createComponent(or,{get label(){return n.t("wf.back.run",{name:e.model.run(e.runID)?.name})},onClick:()=>e.nav.go(e.sessionID,{runID:e.runID})}),(()=>{var g=er();return t.insert(g,()=>r().label),g})(),tr(),t.createComponent(m.Show,{get when(){return r().status==="running"||r().status==="queued"},get children(){return t.createComponent(Ce,{icon:"stop",get label(){return n.t("wf.agent.stop")},onClick:s})}}),t.createComponent(m.Show,{get when(){return r().sessionID},get children(){return t.createComponent(Ce,{icon:"square-arrow-top-right",get label(){return n.t("wf.agent.open")},onClick:o})}})]}}),t.createComponent(m.Show,{get when(){return r().error},get children(){var g=nr();return t.insert(g,()=>r().error),g}}),t.createComponent(Xe,{get children(){var g=Es(),l=g.firstChild,d=l.firstChild,u=d.firstChild;return t.insert(g,t.createComponent(sr,{get parts(){return[t.createComponent(lr,{get status(){return r().status}}),r().started&&rt(n,(r().ended??i())-r().started),(()=>{var h=Is();return t.insert(h,()=>r().agentType??"general"),h})(),r().model&&r().model.split("/").pop(),r().phase,Je(r())>0&&n.t("wf.tokens",{count:Ke(Je(r()))}),r().toolCalls>0&&n.plural("wf.tools",r().toolCalls),r().cached&&n.t("wf.cached")]}}),l),t.insert(g,t.createComponent(m.Show,{get when(){return r().directory},get children(){var h=As();return t.insert(h,()=>r().directory),t.effect(()=>t.setAttribute(h,"title",r().directory)),h}}),l),t.insert(u,()=>a()?.prompt??r().prompt),t.insert(g,t.createComponent(m.Show,{get when(){return r().sessionID},get children(){return t.createComponent(Qs,{get session(){return e.session},get sessionID(){return r().sessionID},get directory(){return r().directory??e.session.directory}})}}),null),t.insert(g,t.createComponent(m.Show,{get when(){return c()!==void 0},get children(){var h=rr(),p=h.firstChild;return t.insert(p,()=>n.t("wf.result")),t.insert(h,t.createComponent(ir,{get text(){return c()}}),null),h}}),null),g}})]}})}function Qs(e){const n=x.usePlugin(),r=()=>e.session.server.data;x.createKeyed(()=>e.sessionID,i=>{r().session.sync(i).catch(()=>{}),r().session.message.sync(i).catch(()=>{})});const a=m.createMemo(()=>r().session.message.list(e.sessionID).flatMap(i=>i.type!=="assistant"?[]:i.content.flatMap((o,s)=>o.type==="tool"?[{key:o.id,kind:"tool",title:cr(n,o.name),running:o.state.status==="running"||o.state.status==="streaming",subtitle:gs(o.state.input,e.directory),error:o.state.status==="error"?o.state.error?.message:void 0}]:o.type==="text"&&o.text.trim()?[{key:`${i.id}:${s}`,kind:"text",text:o.text}]:[])));return t.createComponent(m.Show,{get when(){return a().length>0},get children(){var i=Ms();return t.insert(i,t.createComponent(m.For,{get each(){return a()},children:o=>(()=>{var s=Ds();return t.insert(s,(()=>{var c=t.memo(()=>o.kind==="tool");return()=>c()?(()=>{var g=qs(),l=g.firstChild,d=l.firstChild,u=d.firstChild,h=u.firstChild,p=h.firstChild;return t.insert(p,t.createComponent(Xs,{get text(){return o.title},get active(){return o.running}})),t.insert(h,t.createComponent(m.Show,{get when(){return o.subtitle},get children(){var v=Ts();return t.insert(v,()=>o.subtitle),v}}),null),t.insert(h,t.createComponent(m.Show,{get when(){return o.error},get children(){var v=Rs();return t.insert(v,()=>o.error),v}}),null),g})():(()=>{var g=ar(),l=g.firstChild;return t.insert(l,t.createComponent(n.ui.Markdown,{get text(){return o.text}})),g})()})()),s})()})),i}})}function js(e){const n=x.usePlugin(),r=()=>e.session.server.data,[a,i]=m.createSignal(!1);x.createKeyed(()=>e.run.sessionID,c=>{r().session.permission.sync(c).catch(()=>{})});const o=()=>(r().session.permission.list(e.run.sessionID)??[]).find(c=>c.source?.id===e.run.toolCall||c.action==="workflow"&&c.resources[0]===e.run.name),s=c=>{const g=o();g&&(i(!0),r().session.permission.reply({sessionID:g.sessionID,requestID:g.id,decision:c}).catch(l=>n.toast.show({variant:"error",title:n.t("wf.error"),description:zt(l)})).finally(()=>i(!1)))};return(()=>{var c=Ns(),g=c.firstChild,l=g.firstChild,d=l.firstChild,u=d.firstChild,h=u.nextSibling,p=l.nextSibling,v=p.firstChild,w=v.firstChild,y=w.nextSibling,$=g.nextSibling,f=$.firstChild,_=f.nextSibling;return t.insert(u,t.createComponent(n.ui.Icon,{name:"warning"})),t.insert(h,()=>n.t("wf.approve.title")),t.insert(y,()=>n.t("wf.approve.note")),t.insert(p,t.createComponent(m.Show,{get when(){return e.run.phases?.length>0},get children(){var q=Ls(),T=q.firstChild,C=T.nextSibling;return t.insert(C,t.createComponent(m.For,{get each(){return e.run.phases},children:S=>(()=>{var D=Ps();return t.insert(D,(()=>{var P=t.memo(()=>!!S.detail);return()=>P()?`${S.title}: ${S.detail}`:S.title})()),D})()})),q}}),null),t.insert(_,t.createComponent(n.ui.Button,{variant:"ghost",get disabled(){return a()||!o()},onClick:()=>s("reject"),get children(){return n.t("ui.permission.deny")}}),null),t.insert(_,t.createComponent(n.ui.Button,{variant:"neutral",get disabled(){return a()||!o()},onClick:()=>s("always"),get children(){return n.t("ui.permission.allowAlways")}}),null),t.insert(_,t.createComponent(n.ui.Button,{variant:"submit",get disabled(){return a()||!o()},onClick:()=>s("once"),get children(){return n.t("ui.permission.allowOnce")}}),null),c})()}function ir(e){const n=x.usePlugin(),r=m.createMemo(()=>{try{return{value:JSON.parse(e.text)}}catch{return{value:e.text}}});return t.createComponent(m.Show,{get when(){return typeof r().value=="string"},get fallback(){return t.createComponent(n.ui.Code,{get content(){return JSON.stringify(r().value,null,2)},language:"json"})},get children(){var a=ar(),i=a.firstChild;return t.insert(i,t.createComponent(n.ui.Markdown,{get text(){return r().value}})),a}})}function or(e){return t.createComponent(Ce,{icon:"outline-arrow-left",get label(){return e.label},get onClick(){return e.onClick}})}function sr(e){const n=()=>e.parts.filter(Boolean);return(()=>{var r=Os();return t.insert(r,t.createComponent(m.For,{get each(){return n()},children:(a,i)=>[t.createComponent(m.Show,{get when(){return i()>0},get children(){return zs()}}),(()=>{var o=Bs();return t.insert(o,a),o})()]})),r})()}function nt(e){const n=x.usePlugin();return(()=>{var r=Fs();return t.insert(r,t.createComponent(m.Switch,{get fallback(){return t.createComponent(Qe,{still:!0})},get children(){return[t.createComponent(m.Match,{get when(){return e.status==="running"},get children(){return t.createComponent(Qe,{})}}),t.createComponent(m.Match,{get when(){return e.status==="done"||e.status==="completed"},get children(){return t.createComponent(n.ui.Icon,{name:"check",size:"small"})}}),t.createComponent(m.Match,{get when(){return e.status==="failed"},get children(){return t.createComponent(n.ui.Icon,{name:"circle-xmark",size:"small",class:"text-v2-state-fg-danger"})}}),t.createComponent(m.Match,{get when(){return e.status==="stopped"},get children(){return t.createComponent(n.ui.Icon,{name:"outline-xmark",size:"small"})}}),t.createComponent(m.Match,{get when(){return e.status==="denied"},get children(){return t.createComponent(n.ui.Icon,{name:"circle-ban-sign",size:"small"})}}),t.createComponent(m.Match,{get when(){return e.status==="pending"},get children(){return t.createComponent(n.ui.Icon,{name:"warning",size:"small"})}})]}})),r})()}function lr(e){const n=x.usePlugin();return(()=>{var r=Us();return t.insert(r,t.createComponent(nt,{get status(){return e.status}}),null),t.insert(r,()=>Zs(n,e.status),null),r})()}function Zs(e,n){switch(n){case"running":return e.t("session.child.status.running");case"done":case"completed":return e.t("session.child.status.succeeded");case"failed":return e.t("session.child.status.failed");case"stopped":return e.t("session.child.status.interrupted");default:return e.t(`wf.status.${n}`)}}const fn={read:"ui.tool.read",list:"ui.tool.list",glob:"ui.tool.glob",grep:"ui.tool.grep",webfetch:"ui.tool.webfetch",websearch:"ui.tool.websearch",shell:"ui.tool.shell",skill:"ui.tool.skill",execute:"ui.tool.execute",edit:"ui.messagePart.title.edit",write:"ui.messagePart.title.write",patch:"ui.tool.patch"};function cr(e,n){return n==="workflow_output"?e.t("wf.output"):fn[n]?e.t(fn[n]):e.t("ui.basicTool.called",{tool:n})}function Xs(e){return(()=>{var n=Hs(),r=n.firstChild,a=r.firstChild,i=a.nextSibling;return t.insert(a,()=>e.text),t.insert(i,()=>e.text),t.effect(o=>{var s=e.active?"true":"false",c=e.text,g=e.active?"true":"false";return s!==o.e&&t.setAttribute(n,"data-active",o.e=s),c!==o.t&&t.setAttribute(n,"aria-label",o.t=c),g!==o.a&&t.setAttribute(i,"data-run",o.a=g),o},{e:void 0,t:void 0,a:void 0}),n})()}const rt=(e,n)=>Nn(n,(r,a)=>e.t(r,a)),el=e=>(e.done??0)+(e.failed??0)+(e.stopped??0),zt=e=>e?.message??String(e);t.delegateEvents(["click"]);var tl=t.template('<div class="flex min-w-0 items-center gap-1.5"><span class=truncate>');const ve="workflows";function nl(e){const n=`${e.id}:${ve}`,[r,a]=ge.createStore({}),i={get:l=>r[l]??{},go:(l,d)=>a(l,{runID:void 0,agentID:void 0,...d})},o=us(e,{onStart:l=>{const d=e.sessions.current();!d||ue(d)!==l.sessionID||(i.go(l.sessionID,{runID:l.id}),e.layout.open(n,d,{tab:"select",background:!0}))}}),s=l=>{const d=e.sessions.current();d&&(l&&i.go(ue(d),l),e.layout.open(n,d,{tab:"select"}))},c=l=>o.active(ue(l)),g={id:ve,get title(){return e.t("wf.title")},closable:"hover",label:l=>{const d=()=>c(l.session);return(()=>{var u=tl(),h=u.firstChild;return t.insert(u,t.createComponent(e.ui.Icon,{name:"fork",class:"shrink-0"}),h),t.insert(h,()=>e.t("wf.title")),t.insert(u,(()=>{var p=t.memo(()=>d().length>0);return()=>p()&&t.createComponent(nt,{status:"running"})})(),null),u})()}};e.add(x.Panel,{id:ve,region:"side",mobile:{get title(){return e.t("wf.title")},order:46,kind:"menu",icon:"fork"},list:l=>l.open.includes(ve)?[g]:[],render:l=>t.createComponent(Gs,{get session(){return l.session},model:o,nav:i})}),e.add(x.MenuItem,()=>{const l=e.sessions.current(),d=l?c(l).length:0;return{menu:"session.panel",id:ve,title:e.t("wf.title"),icon:"fork",keybind:`${e.id}.workflows`,order:40,...d>0&&{description:e.t("wf.running",{count:d})},opened:!!l&&e.layout.state(n,l)!=="closed",run:()=>s()}}),e.add(x.ComposerPill,{id:ve,order:10,show:l=>{const d=ue(l.session),u=o.active(d),h=o.ultracode(d);if(u.length===0&&!h)return;const p=u.map(w=>{const y=kt(Object.values(o.state.agents[w.id]??{})),$=Math.max(y.total,w.counts?.total??0),f=Math.max(y.finished,(w.counts?.done??0)+(w.counts?.failed??0)+(w.counts?.stopped??0));return{id:w.id,label:w.name,icon:"fork",tone:w.status==="pending"?"warning":w.counts?.failed?"danger":void 0,detail:w.status==="pending"||w.status==="paused"?e.t(`wf.status.${w.status}`):e.t("wf.agents",{done:f,total:$}),run:()=>s({runID:w.id})}});return h&&p.push({id:"ultracode",label:e.t("wf.ultracode.off"),icon:"close-small",run:()=>{o.setUltracode(l.session,d,!1)}}),{icon:"fork",label:u.length===1?`${u[0].name} · ${p[0].detail}`:u.length>1?e.t("wf.pill.many",{count:u.length}):e.t("wf.ultracode"),title:e.t("wf.title"),tone:u.some(w=>w.status==="pending")?"warning":void 0,rows:p}}}),e.add(x.Command,()=>({id:"workflows",title:e.t("wf.command.show"),keywords:"workflow workflows ultracode agents runs fan out orchestration",enabled:!!e.sessions.current(),run:()=>{const l=e.sessions.current();l&&e.layout.toggle(n,l)}})),e.add(x.Command,()=>{const l=e.sessions.current(),d=!!l&&o.ultracode(ue(l));return{id:"ultracode",title:e.t(d?"wf.command.ultracode.off":"wf.command.ultracode.on"),keywords:"ultracode workflow workflows effort orchestration agents",enabled:!!l,run:()=>{l&&o.setUltracode(l,ue(l),!d)}}})}const rl={"wf.title":"Workflows","wf.ultracode":"Ultracode","wf.ultracode.hint":"Run each substantive task as a workflow","wf.ultracode.off":"Turn off ultracode","wf.empty.title":"No workflows in this session","wf.empty.body":"Ask for one in your own words, or put the keyword ultracode in a prompt. Agents of each run show here while they work.","wf.status.pending":"Waiting for approval","wf.status.paused":"Paused","wf.status.denied":"Denied","wf.status.queued":"Queued","wf.agents":"{{done}} of {{total}} agents","wf.running":"{{count}} running","wf.queued":"{{count}} queued","wf.failed":"{{count}} failed","wf.tokens":"{{count}} tokens","wf.budget":"budget {{count}}","wf.tools.one":"{{count}} tool call","wf.tools.other":"{{count}} tool calls","wf.cached":"cached","wf.back.runs":"All workflows","wf.back.run":"Back to {{name}}","wf.pause":"Pause","wf.resume":"Resume","wf.stop":"Stop","wf.more":"More actions","wf.save.project":"Save as a command for this project","wf.save.personal":"Save as a command for me","wf.saved":"Saved as {{name}}","wf.copy.script":"Copy the script path","wf.copy.id":"Copy the run ID","wf.reveal":"Show the script in the file manager","wf.error":"The workflow action did not complete","wf.logs.all":"Show all {{count}} messages","wf.logs.less":"Show fewer messages","wf.phase.none":"Other agents","wf.result":"Result","wf.output":"Returned output","wf.agent.queued":"Waits for a free slot","wf.agent.open":"Open session","wf.agent.stop":"Stop agent","wf.approve.title":"Run this workflow?","wf.approve.note":"A workflow can start many agents, and it can use far more tokens than a normal turn. Its agents use your permission rules.","wf.pill.many":"{{count}} workflows","wf.command.show":"Show workflows","wf.command.ultracode.on":"Turn on ultracode for this session","wf.command.ultracode.off":"Turn off ultracode for this session"},At=60*1e3,al=60*At,bn="tab.new",$t="sidecar";function il(e){const n=jn(e.options),{shelf:r,groups:a,working:i}=e.stores,o=(k,A)=>E=>t.insert(E,()=>m.createComponent(e.ui.Icon,{name:k,...A})),s=()=>{const k=e.sessions.current();try{const A=k?.server.data.session;return!!k&&(A.status(k.id)==="running"||A.pending.list(k.id).some(E=>E.type!=="synthetic"))}catch{return!1}},c=()=>r.update(k=>{k.archivedOpen=!k.archivedOpen}),g=async k=>(await e.client.project.list()).filter(E=>(E.name||E.canonical.split("/").pop())===k).toSorted((E,R)=>R.time.active-E.time.active)[0],l=async k=>{const A=await g(k);if(!A)return e.layout.project($t,e.t("session.new"));e.layout.draft({server:$t,directory:A.canonical,prompt:""})},d=k=>fa({name:k,label:e.t("session.newIn",{project:k}),icon:o("plus",{size:"small"}),onSelect:()=>{l(k).catch(()=>e.toast.show({title:e.t("session.failed",{project:k})}))}}),u=async(k,A)=>{const E={directory:k};let{data:R}=await e.client.shell.create({location:E,command:A,timeout:At});try{for(;R.status==="running";)await new Promise(pe=>setTimeout(pe,100)),R=(await e.client.shell.get({id:R.id,location:E})).data;const{data:J}=await e.client.shell.output({id:R.id,location:E});return{ok:R.exit===0,output:J.output}}finally{e.client.shell.remove({id:R.id,location:E}).catch(()=>{})}},h=async(k,A)=>{try{const E=await g(k),R=E&&await u(E.canonical,ya(A));return R?.ok?ka(R.output):void 0}finally{P()}},p=async k=>{const A=await Rr(k,()=>e.client.project.list()),E=A&&await u(A,Ir);return E?.ok?{directory:A,...qr(E.output)}:void 0},v=async(k,A,E)=>{const R=J=>e.toast.show({variant:"error",title:E,description:J.trim()});try{const J=await u(k,Lr(...A));if(!J.ok)return R(J.output);const pe=e.servers.get($t)?.data;pe?.location.vcs.invalidate({directory:k}),await pe?.location.vcs.sync({directory:k})}catch(J){R(String(J?.message??J))}},w=(k,A)=>m.createRoot(E=>{const[R,J]=m.createSignal(),[pe,Bt]=m.createSignal(!1);let it=!1,ot;const _e=()=>{it||(it=!0,ot=ut(A),p(A).catch(()=>{}).then(L=>{if(it=!1,ut(A)!==ot)return Ft();J(L??null)}))},Ft=()=>{ut(A)!==ot&&(J(void 0),_e())},Ut=async(L,oe)=>{Bt(!0),await v(R().directory,L,oe),Bt(!1),_e()},mr=L=>{L!==R().current&&Ut([L],e.t("branch.failed",{branch:L}))},pr=async()=>{const L=R().current,fe=(await e.dialogs.prompt({title:e.t("branch.create"),description:L&&e.t("branch.from",{branch:L}),placeholder:e.t("branch.name"),submit:e.t("branch.submit")}))?.trim().replace(/\s+/g,"-");fe&&await Ut(["-c",fe],e.t("branch.uncreated",{branch:fe}))},Ht=(L,oe=L)=>({label:oe,onSelect:()=>mr(L)}),fr=()=>{const L=R();if(L===void 0)return[{label:e.t("branch.loading"),disabled:!0}];if(L===null)return[{label:e.t("branch.unlisted"),disabled:!0}];const oe=[{label:e.t("branch.new"),icon:"plus",onSelect:()=>{pr()}},{type:"separator"}],fe=L.local.map(st=>Ht(st));if(L.remote.length===0)return[...oe,...fe];const br=L.remote.map(({name:st,ref:wr})=>Ht(st,wr)),vr={type:"group",label:e.t("branch.remote"),items:br};return[...oe,...fe,{type:"separator"},vr]};return m.createEffect(()=>Dr(A,R()?.current)),k.addEventListener("pointerenter",_e),k.addEventListener("focusin",_e),at.observe(A,{subtree:!0,characterData:!0}),t.insert(k,()=>m.createComponent(e.ui.Menu,{label:e.t("branch.switch"),trigger:"button",placement:"bottom-start",get disabled(){return pe()},get items(){return fr()}})),_e(),{update:Ft,dispose:E}}),y=os({ui:e.ui,label:e.t("message.copy"),copied:e.t("message.copied"),write:k=>e.system.copy(k).then(()=>!0,()=>(e.toast.show({title:e.t("message.copyFailed")}),!1))}),$=e.use($r.Browser),f=k=>{const A=$(),E=e.sessions.current();return A.status!=="active"||!E||!A.value.canOpen(E)?!1:(A.value.open(E,k),!0)},_=k=>f(k)||void e.system.openExternal(k),q=n.github?qo(e,{run:u,browse:_}):()=>!1,T=()=>{ha(r.value.archivedOpen),Mn(a.value.enabled,i.value.inline),pa(d),Ca({lookup:h,open:k=>q(k)||e.system.openExternal(k),label:({number:k,state:A,title:E})=>e.t("pr.label",{number:k,state:e.t(`pr.${A}`),title:E})}),Mr(w),Tr(),Or(n.hideAgent),zr(at),is(y),Fo(n.responseLabel),Ho(),Uo(s()),Go()&&!S&&(S=setTimeout(()=>{S=0,P()},300))};let C=0,S=0,D=!1;const P=()=>{C||D||(C=requestAnimationFrame(()=>{C=0,T()}))},ie=new MutationObserver(P);ie.observe(document.body,{childList:!0,subtree:!0});const at=new MutationObserver(P),ur=setInterval(P,At);document.addEventListener("scrollend",P,!0);const dr=ma(c),gr=jo(k=>m.createRoot(A=>(t.insert(k,()=>{const E=e.sessions.current();return E?Xo(Zo(E),e.t,e.locale.locale()):[]}),A))),hr=No(k=>q(k)||f(k));return x.createKeyed(()=>`${r.value.archivedOpen}:${a.value.enabled}:${i.value.inline}:${s()}`,T),n.workflows&&nl(e),e.add(x.Style,ga),e.add(x.Style,xa),e.add(x.Style,Er),e.add(x.Style,Pr(n)),e.add(x.Style,Bo(n.responseLabel)),e.add(x.Style,Qo),e.add(x.Style,as),e.add(x.Slot,{at:"session.location.menu",order:100,render:k=>Po({label:e.t("session.new"),icon:o("edit",{class:"shrink-0 text-v2-icon-icon-muted"}),shortcut:e.keybinds.keybind(bn).join(""),onSelect:()=>{e.commands.run(bn)||e.layout.draft({server:k.session.server.id,directory:k.session.directory,prompt:""})}})}),e.add(x.Command,()=>({id:"toggle-archived",title:e.t(r.value.archivedOpen?"archived.hide":"archived.show"),keywords:"archive archived settled sessions sidebar inbox",run:c})),e.add(x.Command,()=>({id:"toggle-groups",title:e.t(a.value.enabled?"groups.off":"groups.on"),keywords:"group project projects folders sessions sidebar inbox",run:()=>a.update(k=>{k.enabled=!k.enabled})})),e.add(x.Command,()=>({id:"toggle-working",title:e.t(i.value.inline?"working.section":"working.inline"),keywords:"working running busy section shelf sessions sidebar inbox",run:()=>i.update(k=>{k.inline=!k.inline})})),()=>{D=!0,ie.disconnect(),at.disconnect(),cancelAnimationFrame(C),clearTimeout(S),clearInterval(ur),document.removeEventListener("scrollend",P,!0),dr(),gr(),hr(),ba(),_a(),Nr(),Br(),Wo(),ls()}}function ol(e){const{archiveAfterHours:n}=jn(e.options);if(e.onCleanup(Ur(e,{app:lt.app,safeStorage:lt.safeStorage,webContents:lt.webContents})),n>0)return Cr(e,n*al)}const sl=x.Plugin.define({stores:{shelf:x.Store.global(le.Schema.Struct({archivedOpen:le.Schema.Boolean}),{archivedOpen:!1}),groups:x.Store.global(le.Schema.Struct({enabled:le.Schema.Boolean}),{enabled:!0}),working:x.Store.global(le.Schema.Struct({inline:le.Schema.Boolean}),{inline:!0})},i18n:{en:{"archived.show":"Show archived sessions","archived.hide":"Hide archived sessions","groups.on":"Group sessions by project","groups.off":"Stop grouping sessions by project","working.inline":"Show working sessions in the list","working.section":"Show working sessions in their own section","session.new":"New session","session.newIn":"New session in {{project}}","session.failed":"Could not start a session in {{project}}","usage.window":"Context window","usage.cacheRead":"Cache read","usage.cacheWrite":"Cache write","usage.input":"Input","usage.reasoning":"Reasoning","usage.output":"Output","usage.cost":"Cost","branch.switch":"Switch branch","branch.loading":"Loading…","branch.unlisted":"Could not list the branches","branch.remote":"Remote","branch.failed":"Could not switch to {{branch}}","branch.new":"New branch…","branch.create":"Create branch","branch.from":"The new branch starts from {{branch}}, with your changes.","branch.name":"Branch name","branch.submit":"Create","branch.uncreated":"Could not create {{branch}}","pr.label":"PR #{{number}}, {{state}}: {{title}}","pr.open":"open","pr.draft":"draft","pr.merged":"merged","pr.closed":"closed","message.copy":"Copy message","message.copied":"Copied","message.copyFailed":"Could not copy the message",...rl,...Lo}},setup:il,main:ol});exports.default=sl;
