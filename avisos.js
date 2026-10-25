// Avisos de cobro: corre todos los días en GitHub Actions y manda notificaciones.
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore(), fcm = admin.messaging();

const APP = process.env.APP_URL || "https://jgome701-crypto.github.io/Cobros/";
const ADMIN = "pbcPzLpAIyc2vUcsllsANp0PCSW2";
const M = n => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);
const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Bogota" }); // YYYY-MM-DD en Colombia
const dia = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const diff = (a, b) => Math.round((Date.parse(a + "T00:00:00Z") - Date.parse(b + "T00:00:00Z")) / 864e5);

async function enviar(t, title, body, url) {
  try {
    await fcm.send({ token: t.token, data: { title, body, url }, webpush: { headers: { Urgency: "high", TTL: "43200" } } });
    return true;
  } catch (e) {
    const c = e.code || "";
    if (c.includes("registration-token-not-registered") || c.includes("invalid-argument") || c.includes("invalid-registration-token")) {
      await db.collection("tokens").doc(t.id).delete().catch(() => {}); // celular que ya no existe
    } else console.log("No se pudo enviar:", c || e.message);
    return false;
  }
}

(async () => {
  const toks = (await db.collection("tokens").get()).docs.map(d => ({ id: d.id, ...d.data() }));
  console.log("Fecha:", hoy, "· celulares registrados:", toks.length);

  if (process.env.PRUEBA === "true") {
    let n = 0;
    for (const t of toks) if (await enviar(t, "🔔 Prueba de Cobros", "Si ves este mensaje, los avisos funcionan.", APP)) n++;
    console.log("Prueba enviada a", n, "celulares"); return;
  }

  const porLoan = {}, porUid = {};
  toks.forEach(t => { if (t.tipo === "cliente") (porLoan[t.loanId] = porLoan[t.loanId] || []).push(t); else if (t.tipo === "prestamista") (porUid[t.uid] = porUid[t.uid] || []).push(t); });

  const resumen = {}; // por prestamista: quién cobra hoy y quién está atrasado
  const loans = (await db.collection("prestamos").get()).docs;
  for (const d of loans) {
    const l = d.data(), p = +l.principal || 0, int = p * (+l.rate || 0) / 100;
    const w = +l.cuotas || +l.weeks || 0, per = +l.dias || 7;
    if (!w || !l.start || !p) continue;
    const cuota = (p + int) / w;
    const g = (l.gastos || []).reduce((s, x) => s + (+x.amt || 0), 0), paid = (l.pagos || []).reduce((s, x) => s + (+x.amt || 0), 0);
    if (p + int + g - paid <= 0) continue; // ya pagó todo
    const lates = []; let hoyAmt = 0;
    for (let k = 1; k <= w; k++) {
      const due = dia(l.start, per * k), cov = paid >= k * cuota - 0.5;
      if (cov) continue;
      if (due < hoy) lates.push(due);
      else if (due === hoy) hoyAmt = Math.max(0, Math.min(cuota, k * cuota - paid));
    }
    const uid = l.uid || ADMIN; resumen[uid] = resumen[uid] || { hoy: [], atr: [] };
    const url = APP + "?c=" + d.id;
    if (lates.length) {
      const dias = diff(hoy, lates[0]), monto = Math.max(0, lates.length * cuota + g - paid);
      if ((dias === 1 || dias === 3 || dias % 7 === 0) && monto > 0) {
        resumen[uid].atr.push({ name: l.name, monto, dias });
        for (const t of porLoan[d.id] || []) await enviar(t, "Pago atrasado", `Tienes un pago atrasado de ${M(monto)} (${dias} ${dias === 1 ? "día" : "días"}).`, url);
      }
    } else if (hoyAmt > 0) {
      resumen[uid].hoy.push({ name: l.name, monto: hoyAmt });
      for (const t of porLoan[d.id] || []) await enviar(t, "Hoy te toca pagar", `Tu cuota de hoy es de ${M(hoyAmt)}. Toca para ver tu préstamo.`, url);
    }
  }

  for (const [uid, r] of Object.entries(resumen)) {
    if (!r.hoy.length && !r.atr.length) continue;
    const partes = [];
    if (r.hoy.length) partes.push(`Hoy cobras a ${r.hoy.length}: ${r.hoy.slice(0, 4).map(x => x.name).join(", ")}${r.hoy.length > 4 ? "…" : ""} (${M(r.hoy.reduce((s, x) => s + x.monto, 0))})`);
    if (r.atr.length) partes.push(`${r.atr.length} atrasado${r.atr.length === 1 ? "" : "s"}: ${r.atr.slice(0, 3).map(x => x.name).join(", ")}${r.atr.length > 3 ? "…" : ""}`);
    for (const t of porUid[uid] || []) await enviar(t, "Cobros del día", partes.join(" · "), APP);
  }
  console.log("Listo.");
})().catch(e => { console.error(e); process.exit(1); });
