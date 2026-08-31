import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const MASTER_ADMIN_EMAIL = 'billionaireharish2008@gmail.com';
const VALID_PROVIDERS = ['openai', 'anthropic', 'google', 'openai_compatible'];

function publicModel(m: any) {
  return {
    id: m.id,
    name: m.name,
    value: m.value,
    provider: m.provider || 'openai',
    base_url: m.base_url || '',
    has_key: !!m.api_key,
    created_date: m.created_date,
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const isAdmin = user.role === 'admin' || user.email === MASTER_ADMIN_EMAIL;
    if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    if (action === 'list') {
      const list = await base44.entities.AIModel.list();
      return Response.json({ models: list.map(publicModel) });
    }

    if (action === 'create') {
      if (!body.name || !body.value) return Response.json({ error: 'Name and model value are required' }, { status: 400 });
      const created = await base44.entities.AIModel.create({
        name: String(body.name).slice(0, 120),
        value: String(body.value).slice(0, 120),
        provider: VALID_PROVIDERS.includes(body.provider) ? body.provider : 'openai',
        base_url: body.base_url ? String(body.base_url).slice(0, 300) : '',
        api_key: body.api_key ? String(body.api_key).slice(0, 400) : '',
      });
      return Response.json({ model: publicModel(created) });
    }

    if (action === 'delete') {
      await base44.entities.AIModel.delete(String(body.id));
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}