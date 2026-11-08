/*
 * Formulaires du site (contact, commande, nouveautés), envoyés avec Resend.
 * Cloudflare Pages > Settings > Variables and Secrets :
 *   RESEND_API_KEY  obligatoire
 *   TO_EMAIL        facultatif (par défaut veroniqueelyotrisky2900@gmail.com)
 *   FROM_EMAIL      facultatif, sur un domaine vérifié dans Resend
 */
const TO = "veroniqueelyotrisky2900@gmail.com";
const FROM = "Site de Véronique Elyotrisky <hello@support.halcyonliterary.com>";
const LABELS = {
  nom: "Nom", email: "E‑mail", telephone: "Téléphone", sujet: "Sujet", message: "Message",
  livres: "Livres demandés", dedicace: "Dédicace pour", adresse: "Adresse de livraison",
  code_postal: "Code postal", ville: "Ville", pays: "Pays",
};
const SUBJECTS = { contact: "Nouveau message du site", commande: "Nouvelle demande de commande", nouveautes: "Inscription aux nouveautés" };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const out = (ok, status, message) => new Response(JSON.stringify({ ok, message }), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) return out(false, 500, "not configured");
  let f; try { f = await request.formData(); } catch (e) { return out(false, 400, "bad form"); }
  const get = (k) => String(f.get(k) || "").trim().slice(0, 5000);
  if (get("site_web")) return out(true, 200, "ok");                       // piège à robots
  const started = Number(get("started")); if (started && Date.now() - started < 2500) return out(true, 200, "ok");
  const kind = SUBJECTS[get("formulaire")] ? get("formulaire") : "contact";
  const email = get("email");
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) return out(false, 422, "email");
  const rows = Object.keys(LABELS).filter((k) => get(k)).map((k) => [LABELS[k], get(k)]);
  const name = get("nom").replace(/[\r\n]+/g, " ").slice(0, 120) || email;
  const html = `<div style="font-family:Arial,sans-serif;background:#f7f4ee;padding:24px"><div style="max-width:600px;margin:auto;background:#fff;border:1px solid #ddd3c2">
<div style="background:#1f3a44;color:#fff;padding:18px 24px;font-family:Georgia,serif;font-size:20px">${esc(SUBJECTS[kind])}</div><div style="padding:8px 24px 20px">
${rows.map(([l, v]) => `<p style="margin:14px 0 2px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#a8402e"><b>${esc(l)}</b></p><p style="margin:0;font-size:15px;white-space:pre-wrap">${esc(v)}</p>`).join("")}
<p style="margin-top:20px;font-size:13px;color:#5b6a70">Répondez simplement à cet e‑mail pour écrire à ${esc(name)}.</p></div></div></div>`;
  const text = SUBJECTS[kind] + "\n\n" + rows.map(([l, v]) => l + " :\n" + v).join("\n\n");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.FROM_EMAIL || FROM, to: [env.TO_EMAIL || TO], reply_to: email, subject: SUBJECTS[kind] + " : " + name, html, text }),
  });
  if (!r.ok) return out(false, 502, "send failed");
  return out(true, 200, "ok");
}

export async function onRequestGet({ env }) {
  return new Response("Formulaires : " + (env.RESEND_API_KEY ? "prêts" : "clé RESEND_API_KEY manquante"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
