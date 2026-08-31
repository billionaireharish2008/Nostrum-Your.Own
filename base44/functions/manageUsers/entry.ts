import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const MASTER_ADMIN_EMAIL = Deno.env.get("MASTER_ADMIN_EMAIL") || "";

function isMasterAdmin(user) {
  return !!user && (user.role === "master_admin" || (MASTER_ADMIN_EMAIL && user.email === MASTER_ADMIN_EMAIL));
}

function isStaff(user) {
  return !!user && (isMasterAdmin(user) || user.role === "admin");
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (!isStaff(user)) {
      return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === "list") {
      const users = await base44.asServiceRole.entities.User.list("-created_date", 500);
      const sessions = await base44.asServiceRole.entities.Session.filter(
        { status: { $in: ["watching", "flagged", "blocked"] } }, "-created_date", 500
      );
      const activeByUser = {};
      for (const s of sessions) {
        if (!s.user_id) continue;
        if (!activeByUser[s.user_id]) activeByUser[s.user_id] = [];
        activeByUser[s.user_id].push({
          id: s.id,
          status: s.status,
          ip: s.ip,
          started_at: s.started_at,
          risk_score: s.risk_score
        });
      }
      return Response.json({ ok: true, users, sessions: activeByUser });
    }

    if (action === "setRole") {
      const { id, role } = body;
      if (!id || !["user", "admin"].includes(role)) {
        return Response.json({ ok: false, error: "invalid" }, { status: 400 });
      }
      await base44.asServiceRole.entities.User.update(id, { role });
      return Response.json({ ok: true });
    }

    if (action === "terminateSession") {
      const { sessionId } = body;
      if (!sessionId) {
        return Response.json({ ok: false, error: "invalid" }, { status: 400 });
      }
      const session = await base44.asServiceRole.entities.Session.get(sessionId);
      if (session && session.user_id) {
        try {
          const targetUser = await base44.asServiceRole.entities.User.get(session.user_id);
          if (targetUser && (targetUser.role === "master_admin" || (MASTER_ADMIN_EMAIL && targetUser.email === MASTER_ADMIN_EMAIL))) {
            return Response.json({ ok: false, error: "cannot terminate master admin session" }, { status: 403 });
          }
        } catch {}
      }
      await base44.asServiceRole.entities.Session.update(sessionId, {
        status: "ended",
        ended_at: new Date().toISOString()
      });
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
