import {getApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app=getApp(),auth=getAuth(app),db=getFirestore(app),R=document.getElementById("root");
const ls={get:k=>{try{return localStorage.getItem(k)}catch(x){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(x){}}};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const S=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
const USER=S('<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>');
const BELL=S('<path d="M6 17v-6a6 6 0 0 1 12 0v6M4 17h16M10 20.5h4"/>');
const EYE=S('<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');
const EYEC=S('<path d="M3 11c2.5 3.5 6 5 9 5s6.5-1.5 9-5M6 14.5 4 17M12 16v3M18 14.5l2 2.5"/>');

const st=document.createElement("style");
st.textContent=`.xtop{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 10px}.xtop b{font-size:20px;text-align:center;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.xib{width:46px;height:46px;padding:0;border-radius:99px;background:var(--card);border:1px solid var(--bd);color:var(--fg);display:grid;place-items:center;position:relative;overflow:hidden}
.xib img{width:100%;height:100%;object-fit:cover}.xib svg{width:24px;height:24px}
.xdot{position:absolute;top:9px;right:10px;width:11px;height:11px;border-radius:99px;background:#ff6b81;border:2px solid var(--card)}
.xeye{float:right;padding:2px 6px;background:transparent;color:var(--mut);border-radius:8px}.xeye svg{width:24px;height:24px;display:block}
.xsheet{position:fixed;inset:0;z-index:20;display:flex;justify-content:center;align-items:flex-start;padding:calc(env(safe-area-inset-top) + 56px) 12px 12px}.xsheet[hidden]{display:none}
.xbk{position:absolute;inset:0;background:rgba(0,0,0,.6)}
.xsc{position:relative;width:100%;max-width:536px;max-height:100%;overflow:auto;background:var(--bg);border:1px solid var(--bd);border-radius:16px;padding:12px 14px}
.xhd{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}.xhd h1{margin:0;font-size:20px}
.xav{width:92px;height:92px;border-radius:99px;overflow:hidden;border:1px solid var(--bd);background:var(--card);display:grid;place-items:center;color:var(--mut);flex:none}
.xav img{width:100%;height:100%;object-fit:cover}.xav svg{width:46px;height:46px}
.xlend{display:flex;gap:12px;align-items:center}.xlend .xav{width:56px;height:56px}.xlend .xav svg{width:28px;height:28px}`;
document.head.append(st);

let uid=null,perfil={},hide=ls.get("cobros_hide")==="1",sheet=null,foto="",lend=null,busy=false;
const lay=document.createElement("div");document.body.append(lay);
const obs=new MutationObserver(()=>enhance());

function paintEye(){
  const e=R.querySelector(".xeye"),b=R.querySelector("#rs summary b");if(!e||!b)return;
  e.innerHTML=hide?EYEC:EYE;b.textContent=hide?"••••••":(b.dataset.v||b.textContent);
}
function paintTop(){
  const a=R.querySelector('.xtop [data-x="perfil"]'),t=R.querySelector(".xtop b");
  if(a)a.innerHTML=perfil.foto?'<img src="'+esc(perfil.foto)+'" alt="">':USER;
  if(t)t.textContent=perfil.negocio||"Cobros";
}
function ownerView(){
  const h1=R.querySelector("h1"),nb=R.querySelector('[data-act="new"]');
  if(!(h1&&h1.textContent==="Mis préstamos"&&nb)){if(sheet==="notif")sheet=null;return}
  if(R.querySelector(".xtop"))return;
  const rs=R.querySelector("#rs"),sec=rs&&rs.closest("section"),pn=R.querySelector("#pn"),ps=pn&&pn.closest("section"),al=[];
  if(sec&&ps){let e=sec.nextElementSibling;while(e&&e!==ps){al.push(e);e=e.nextElementSibling}}
  const n=R.querySelectorAll(".al").length,bar=h1.parentElement,top=document.createElement("div");
  top.className="xtop";
  top.innerHTML='<button class="xib" data-x="perfil" aria-label="Mi perfil"></button><b></b><button class="xib" data-x="notif" aria-label="Notificaciones'+(n?" ("+n+")":"")+'">'+BELL+(n?'<i class="xdot"></i>':"")+"</button>";
  nb.textContent="＋ Nuevo préstamo";bar.replaceChildren(nb);bar.style.margin="0 0 8px";bar.before(top);paintTop();
  const sm=R.querySelector("#rs summary");
  if(sm){const t=sm.querySelector("b"),e=document.createElement("button");t.dataset.v=t.textContent;e.className="xeye";e.dataset.x="eye";e.setAttribute("aria-label","Mostrar u ocultar el monto");sm.prepend(e);paintEye()}
  const sh=document.createElement("div");sh.className="xsheet";sh.hidden=sheet!=="notif";
  sh.innerHTML='<div class="xbk" data-x="close"></div><div class="xsc"><div class="xhd"><h1>Notificaciones</h1><button class="ghost" data-x="close">Cerrar</button></div><div class="xal"></div></div>';
  const box=sh.querySelector(".xal");
  if(al.length)al.forEach(e=>box.append(e));else box.innerHTML='<p class="sub ok">Hoy no tienes cobros ni atrasos ✔</p>';
  R.append(sh);
}
function clientView(){
  if(!lend||R.querySelector(".xlend"))return;
  const h1=R.querySelector("h1");if(!h1||!(lend.nombre||lend.negocio))return;
  let w=String(lend.wa||"").replace(/\D/g,"");if(w.length===10)w="57"+w;
  const d=document.createElement("div");d.className="note xlend";
  d.innerHTML='<div class="xav">'+(lend.foto?'<img src="'+esc(lend.foto)+'" alt="">':USER)+'</div><div><b>'+esc(lend.nombre||lend.negocio)+"</b>"
   +(lend.nombre&&lend.negocio?"<br><small>"+esc(lend.negocio)+(lend.ciudad?" · "+esc(lend.ciudad):"")+"</small>":"")
   +(lend.pago?"<br><small>Para pagar: "+esc(lend.pago)+"</small>":"")
   +(w?'<br><a class="btn" style="margin-top:6px" target="_blank" rel="noopener" href="https://wa.me/'+w+"?text="+encodeURIComponent("Hola, te escribo por mi préstamo.")+'">Escribir por WhatsApp</a>':"")+"</div>";
  h1.before(d);
}
function enhance(){
  if(busy)return;busy=true;obs.disconnect();
  try{ownerView();clientView()}catch(x){}
  obs.observe(R,{childList:true});busy=false;
}

const f=(id,l,v,x)=>'<label>'+l+'<input id="'+id+'" '+(x||'type="text"')+' value="'+esc(v||"")+'"></label>';
function openPerfil(){
  foto=perfil.foto||"";
  lay.innerHTML='<div class="xsheet"><div class="xbk" data-x="close"></div><div class="xsc"><div class="xhd"><h1>Mi perfil</h1><button class="ghost" data-x="close">Cerrar</button></div><div class="form"><div id="xp_av" class="xav">'+(foto?'<img src="'+esc(foto)+'" alt="">':USER)+'</div><label>Foto de perfil<input id="xp_f" type="file" accept="image/*"></label>'
   +f("xp_n","Tu nombre",perfil.nombre)+f("xp_neg","Nombre de tu negocio",perfil.negocio)+f("xp_ciu","Ciudad",perfil.ciudad)+f("xp_wa","Tu WhatsApp",perfil.wa,'type="tel" inputmode="tel"')+f("xp_pago","Cómo te pagan (Nequi, Daviplata, cuenta…)",perfil.pago)
   +'<small id="xp_m" class="sub"></small><button data-x="guardar">Guardar perfil</button></div><p class="sub">Tus clientes ven esto en su link.</p><div class="bar"><button class="ghost" data-x="salir">Salir</button></div></div></div>';
}
const closePerfil=()=>{lay.innerHTML=""};
async function avatar(file){
  let bm=null,s,w,h;
  for(const o of [{resizeWidth:600,resizeQuality:"medium"},{}]){try{bm=await createImageBitmap(file,o);break}catch(x){}}
  if(bm){s=bm;w=bm.width;h=bm.height}
  else{s=await new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=no;im.src=URL.createObjectURL(file)});w=s.naturalWidth;h=s.naturalHeight}
  const m=Math.min(w,h),cv=document.createElement("canvas");cv.width=cv.height=256;
  cv.getContext("2d").drawImage(s,(w-m)/2,(h-m)/2,m,m,0,0,256,256);
  return cv.toDataURL("image/jpeg",.75);
}

document.addEventListener("click",async e=>{
  const b=e.target.closest("[data-x]");if(!b)return;const a=b.dataset.x;
  if(a==="eye"){e.preventDefault();hide=!hide;ls.set("cobros_hide",hide?"1":"0");return paintEye()}
  if(a==="notif"){sheet="notif";const s=R.querySelector(".xsheet");if(s)s.hidden=false;return}
  if(a==="perfil")return openPerfil();
  if(a==="close"){sheet=null;const s=R.querySelector(".xsheet");if(s)s.hidden=true;return closePerfil()}
  if(a==="salir"){closePerfil();return signOut(auth)}
  if(a==="guardar"){
    const g=id=>document.getElementById(id).value.trim(),m=document.getElementById("xp_m");
    perfil={nombre:g("xp_n"),negocio:g("xp_neg"),ciudad:g("xp_ciu"),wa:g("xp_wa"),pago:g("xp_pago"),foto};
    ls.set("cobros_perfil_"+uid,JSON.stringify(perfil));paintTop();b.disabled=true;m.textContent="Guardando…";
    try{await Promise.race([setDoc(doc(db,"perfiles",uid),perfil),new Promise((_,no)=>setTimeout(()=>no({code:"sin respuesta"}),6000))]);m.textContent="Perfil guardado ✓"}
    catch(x){m.textContent="Se guardó en este celular, pero no se pudo publicar para tus clientes ("+(x.code||"error")+"). Falta actualizar las reglas de Firestore."}
    b.disabled=false;
  }
});
document.addEventListener("change",async e=>{
  if(e.target.id!=="xp_f")return;
  const file=e.target.files[0];e.target.value="";if(!file)return;
  const av=document.getElementById("xp_av"),m=document.getElementById("xp_m");
  try{foto=await avatar(file);av.innerHTML='<img src="'+esc(foto)+'" alt="">'}
  catch(x){m.textContent="No se pudo leer la foto. Elígela desde la galería."}
});
document.addEventListener("visibilitychange",()=>{if(document.hidden)closePerfil()});

onAuthStateChanged(auth,u=>{
  uid=u?u.uid:null;perfil={};
  if(u){
    try{perfil=JSON.parse(ls.get("cobros_perfil_"+u.uid)||"{}")}catch(x){}
    getDoc(doc(db,"perfiles",u.uid)).then(d=>{if(d.exists()){perfil=d.data();ls.set("cobros_perfil_"+u.uid,JSON.stringify(perfil));paintTop()}}).catch(()=>{});
  }else closePerfil();
  paintTop();
});
const cid=new URLSearchParams(location.search).get("c");
if(cid)getDoc(doc(db,"prestamos",cid)).then(s=>s.exists()&&s.data().uid?getDoc(doc(db,"perfiles",s.data().uid)):null).then(d=>{if(d&&d.exists()){lend=d.data();enhance()}}).catch(()=>{});
obs.observe(R,{childList:true});enhance();
