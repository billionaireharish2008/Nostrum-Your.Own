import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { callLLM } from '../../shared/llmProxy.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const message = String(body.message || '').slice(0, 2000);
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
    if (!message) return Response.json({ error: 'Message required' }, { status: 400 });

    const configs = await base44.asServiceRole.entities.AgentConfig.list();
    const cfg = configs.find((c) => c.enabled !== false);
    if (!cfg) {
      return Response.json({ error: 'No enabled assistant agent' }, { status: 403 });
    }

    const systemPrompt = (cfg && cfg.system_prompt) ||
      'You are a helpful, security-conscious banking assistant. Be concise and friendly.';
    const firstName = (user.full_name || '').split(' ')[0] || 'there';
    const caps = (cfg.capabilities && typeof cfg.capabilities === 'object') ? cfg.capabilities : {};
    const capList = Object.keys(caps).filter((k) => caps[k]).join(', ') || 'none';
    const temperature = cfg && cfg.temperature != null ? cfg.temperature : 0.4;
    const fullSystem =
      `${systemPrompt}\n\nAgent role: ${cfg.agent_role || 'customer'}. Capabilities: ${capList}. ` +
      `The customer's first name is ${firstName}. Never ask for full account numbers or passwords. ` +
      `If they describe fraud, advise using the Report Suspicious feature.`;

    const messages = [
      ...history.map((h: any) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: String(h.content || '').slice(0, 2000) })),
      { role: 'user', content: message },
    ];

    const reply: any = await callLLM({
      base44,
      modelValue: cfg && cfg.model ? cfg.model : 'automatic',
      systemPrompt: fullSystem,
      messages,
      temperature,
    });
    return Response.json({ reply: typeof reply === 'string' ? reply : (reply.reply || JSON.stringify(reply)) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}