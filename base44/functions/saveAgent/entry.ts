import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const MASTER_ADMIN_EMAIL = Deno.env.get('MASTER_ADMIN_EMAIL') || '';
const MAX_AGENTS_PER_ADMIN = 10;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const isAdmin = user.role === 'admin' || user.role === 'master_admin' || (MASTER_ADMIN_EMAIL && user.email === MASTER_ADMIN_EMAIL);
    if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const isMaster = user.role === 'master_admin' || (MASTER_ADMIN_EMAIL && user.email === MASTER_ADMIN_EMAIL);

    const sanitize = (b) => ({
      name: String(b.name || 'New Agent').slice(0, 120),
      system_prompt: String(b.system_prompt || '').slice(0, 8000),
      model: String(b.model || 'automatic'),
      temperature: Number(b.temperature ?? 0.4),
      enabled: b.enabled !== false,
      agent_role: b.agent_role === 'admin' ? 'admin' : 'customer',
      capabilities: b.capabilities && typeof b.capabilities === 'object' ? b.capabilities : {},
    });

    if (body.id) {
      const patch = {};
      if (body.name !== undefined) patch.name = String(body.name).slice(0, 120);
      if (body.system_prompt !== undefined) patch.system_prompt = String(body.system_prompt).slice(0, 8000);
      if (body.model !== undefined) patch.model = String(body.model);
      if (body.temperature !== undefined) patch.temperature = Number(body.temperature);
      if (body.enabled !== undefined) patch.enabled = !!body.enabled;
      if (body.agent_role !== undefined) patch.agent_role = body.agent_role === 'admin' ? 'admin' : 'customer';
      if (body.capabilities !== undefined && typeof body.capabilities === 'object') patch.capabilities = body.capabilities;
      const updated = await base44.entities.AgentConfig.update(String(body.id), patch);
      return Response.json({ agent: updated });
    }

    if (!isMaster) {
      const mine = await base44.entities.AgentConfig.filter({ created_by_id: user.id });
      if (mine.length >= MAX_AGENTS_PER_ADMIN) {
        return Response.json(
          { error: 'Agent limit reached (10 per admin). Only the master admin can add unlimited agents.' },
          { status: 403 }
        );
      }
    }

    const created = await base44.entities.AgentConfig.create(sanitize(body));
    return Response.json({ agent: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
