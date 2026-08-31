import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { callLLM } from '../../shared/llmProxy.ts';

const MASTER_ADMIN_EMAIL = Deno.env.get('MASTER_ADMIN_EMAIL') || '';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const isAdmin = user.role === 'admin' || user.role === 'master_admin' || (MASTER_ADMIN_EMAIL && user.email === MASTER_ADMIN_EMAIL);
    if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const message = String(body.message || '').slice(0, 2000);
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
    if (!message) return Response.json({ error: 'Message required' }, { status: 400 });

    let agent = null;
    if (body.agent_id) {
      agent = await base44.entities.AgentConfig.get(String(body.agent_id)).catch(() => null);
    } else {
      const list = await base44.entities.AgentConfig.list();
      agent = list[0] || null;
    }

    const systemPrompt = (agent && agent.system_prompt) || 'You are a helpful banking assistant.';
    const modelValue = agent && agent.model ? agent.model : 'automatic';
    const role = (agent && agent.agent_role) || 'customer';
    const caps = (agent && agent.capabilities && typeof agent.capabilities === 'object') ? agent.capabilities : {};
    const capList = Object.keys(caps).filter((k) => caps[k]).join(', ') || 'none';
    const canCreate = role === 'admin' && caps.create_transactions === true;
    const temperature = agent && agent.temperature != null ? agent.temperature : 0.4;
    const fullSystem = `${systemPrompt}\n\nAgent role: ${role}. Capabilities: ${capList}.`;
    const messages = [
      ...history.map((h: any) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: String(h.content || '').slice(0, 2000) })),
      { role: 'user', content: message },
    ];

    if (canCreate) {
      const schema = {
        type: 'object',
        properties: {
          reply: { type: 'string' },
          action: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['create_transaction', 'none'] },
              amount: { type: 'number' },
              tx_type: { type: 'string', enum: ['debit', 'credit'] },
              description: { type: 'string' },
              counterparty: { type: 'string' },
            },
          },
        },
        required: ['reply'],
      };
      const data: any = await callLLM({ base44, modelValue, systemPrompt: fullSystem, messages, temperature, jsonSchema: schema });
      let created = null;
      const action = data.action;
      if (action && action.type === 'create_transaction' && typeof action.amount === 'number' && action.amount > 0) {
        try {
          const tx = await base44.entities.Transaction.create({
            user_id: user.id,
            amount: Number(action.amount),
            type: action.tx_type === 'credit' ? 'credit' : 'debit',
            description: String(action.description || 'Created by AI agent').slice(0, 200),
            counterparty: String(action.counterparty || '').slice(0, 120),
            status: 'completed',
            is_synthetic: true,
          });
          created = { id: tx.id, amount: tx.amount, type: tx.type };
        } catch (e: any) {
          created = { error: e.message };
        }
      }
      return Response.json({ reply: data.reply || '', created });
    }

    const reply: any = await callLLM({ base44, modelValue, systemPrompt: fullSystem, messages, temperature });
    return Response.json({ reply: typeof reply === 'string' ? reply : (reply.reply || JSON.stringify(reply)) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
