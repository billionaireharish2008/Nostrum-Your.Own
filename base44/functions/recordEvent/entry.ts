import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : (req.headers.get("x-real-ip") || "unknown");
    const userAgent = req.headers.get("user-agent") || "unknown";

    const body = await req.json().catch(() => ({}));
    const actionType = body.action_type || "page_visit";
    const payload = body.payload || {};
    const isSynthetic = !!body.is_synthetic;

    if (!user && actionType !== "login_attempt") {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const userId = user ? user.id : null;

    let session = null;
    if (userId) {
      const existing = await base44.asServiceRole.entities.Session.filter(
        { user_id: userId, status: { $in: ["watching", "flagged"] } }, "-created_date", 1
      );
      if (existing && existing.length) session = existing[0];
    }

    let riskScore = session ? (session.risk_score || 0) : 0;
    const now = new Date();
    const hour = now.getUTCHours();
    if (actionType === "login_attempt" && payload.success === false) riskScore += 15;
    if (actionType === "unauthorized_admin_access") riskScore += 30;
    if (hour >= 1 && hour <= 5) riskScore += 5;
    if (actionType === "transfer" && payload.amount && Number(payload.amount) > 5000) riskScore += 10;
    if (payload.ip_changed) riskScore += 20;
    if (riskScore > 100) riskScore = 100;

    let status = "watching";
    if (riskScore >= 60) status = "flagged";
    if (riskScore >= 85) status = "blocked";

    if (!session && userId) {
      session = await base44.asServiceRole.entities.Session.create({
        user_id: userId, ip, user_agent: userAgent, started_at: now.toISOString(),
        ended_at: null, risk_score: riskScore, status
      });
    } else if (session) {
      session = await base44.asServiceRole.entities.Session.update(session.id, {
        risk_score: riskScore, status, ip, user_agent: userAgent
      });
    }
    const sessionId = session ? session.id : null;

    await base44.asServiceRole.entities.SessionEvent.create({
      session_id: sessionId, user_id: userId, ip, user_agent: userAgent,
      action_type: actionType, payload, is_synthetic: isSynthetic,
      event_time: now.toISOString()
    });

    return Response.json({ ok: true, session_id: sessionId, risk_score: riskScore, status });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}