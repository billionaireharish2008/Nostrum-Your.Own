import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const MASTER_ADMIN_EMAIL = Deno.env.get("MASTER_ADMIN_EMAIL") || "";
function isStaff(u) {
  return !!u && (u.role === "admin" || u.role === "master_admin" || (MASTER_ADMIN_EMAIL && u.email === MASTER_ADMIN_EMAIL));
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isStaff(user)) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const description = (body.description || "").toString().slice(0, 4000);
    if (!description) return Response.json({ ok: false, error: "no description" }, { status: 400 });

    const prompt =
      "You are a fraud-detection assistant for a digital bank. A customer submitted a suspicious-activity report. " +
      "Analyze it and suggest a resolution.\n\nReport:\n\"\"\"" + description + "\"\"\"\n\n" +
      "Respond in 4 short sections:\n" +
      "1. Likely issue (1-2 sentences)\n" +
      "2. Risk level (Low / Medium / High) and why\n" +
      "3. Recommended immediate action\n" +
      "4. Follow-up / prevention tip\n" +
      "Keep it concise, professional, and actionable.";

    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const analysis = typeof r === "string" ? r : (r && r.text ? r.text : JSON.stringify(r));

    return Response.json({ ok: true, analysis });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
