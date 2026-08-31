import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const MASTER_ADMIN_EMAIL = Deno.env.get('MASTER_ADMIN_EMAIL') || '';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'master_admin' && !(MASTER_ADMIN_EMAIL && user.email === MASTER_ADMIN_EMAIL)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const t0 = Date.now();
    await base44.asServiceRole.entities.Session.list('-created_date', 1);
    const dbLatencyMs = Date.now() - t0;

    const [sessions, events, users, accounts, audit] = await Promise.all([
      base44.asServiceRole.entities.Session.list('-created_date', 200),
      base44.asServiceRole.entities.SessionEvent.list('-event_time', 200),
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Account.list(),
      base44.asServiceRole.entities.AuditLog.list('-created_date', 30),
    ]);

    const activeConnections = sessions.filter((s) => s.status === 'watching').length;
    const flaggedSessions = sessions.filter((s) => s.status === 'flagged' || s.status === 'blocked').length;

    const now = Date.now();
    const buckets = Array.from({ length: 12 }, (_, i) => {
      const t = new Date(now - (11 - i) * 3600000);
      return { hour: t.getHours() + ':00', count: 0, errors: 0 };
    });
    events.forEach((e) => {
      const ts = e.event_time ? new Date(e.event_time).getTime() : 0;
      const idx = 11 - Math.floor((now - ts) / 3600000);
      if (idx >= 0 && idx < 12) {
        buckets[idx].count++;
        if (e.action_type === 'blocked_attempt' || e.action_type === 'unauthorized_admin_access') {
          buckets[idx].errors++;
        }
      }
    });

    const recentErrors = events
      .filter((e) => e.action_type === 'blocked_attempt' || e.action_type === 'unauthorized_admin_access')
      .slice(0, 20);

    return Response.json({
      dbLatencyMs,
      activeConnections,
      flaggedSessions,
      totalSessions: sessions.length,
      totalEvents: events.length,
      totalUsers: users.length,
      totalAccounts: accounts.length,
      eventBuckets: buckets,
      recentErrors,
      recentAudit: audit,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
