const PROVIDER_DEFAULTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  openai_compatible: '',
  anthropic: 'https://api.anthropic.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
};

function safeJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return { reply: text };
  }
}

export async function resolveCustomModel(base44: any, modelValue: string | undefined): Promise<any | null> {
  if (!modelValue || modelValue === 'automatic') return null;
  try {
    const list = await base44.asServiceRole.entities.AIModel.list();
    const found = list.find((m: any) => m.value === modelValue && m.api_key);
    return found || null;
  } catch {
    return null;
  }
}

export async function callLLM({ base44, modelValue, systemPrompt, messages, temperature, jsonSchema }: any): Promise<any> {
  const custom = await resolveCustomModel(base44, modelValue);
  if (!custom) {
    const prompt = [systemPrompt, ...messages.map((m: any) => `${m.role === 'assistant' ? 'ASSISTANT' : 'USER'}: ${m.content}`)].join('\n\n');
    if (jsonSchema) {
      const r = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: jsonSchema });
      return typeof r === 'object' && r !== null ? r : safeJson(String(r));
    }
    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    return typeof r === 'string' ? r : (r && r.text ? r.text : JSON.stringify(r));
  }
  return callProviderDirect({ model: custom, systemPrompt, messages, temperature, jsonSchema });
}

async function callProviderDirect({ model, systemPrompt, messages, temperature, jsonSchema }: any): Promise<any> {
  const provider = model.provider || 'openai';
  const key = model.api_key;
  const temp = temperature ?? 0.4;
  const msgs = messages.map((m: any) => ({ role: m.role, content: m.content }));

  if (provider === 'anthropic') {
    const body: any = { model: model.value, max_tokens: 1024, system: systemPrompt, messages: msgs, temperature: temp };
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data: any = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Anthropic error ${res.status}`);
    const text = (data.content || []).map((c: any) => c.text || '').join('');
    return jsonSchema ? safeJson(text) : text;
  }

  if (provider === 'google') {
    const contents = messages.map((m: any) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const body: any = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: temp, ...(jsonSchema ? { responseMimeType: 'application/json' } : {}) },
    };
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.value}:generateContent?key=${key}`;
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const data: any = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Google error ${res.status}`);
    const text = (data.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('');
    return jsonSchema ? safeJson(text) : text;
  }

  // openai or openai_compatible
  const base = (model.base_url || PROVIDER_DEFAULTS.openai).replace(/\/$/, '');
  const body: any = {
    model: model.value,
    messages: [{ role: 'system', content: systemPrompt }, ...msgs],
    temperature: temp,
    ...(jsonSchema ? { response_format: { type: 'json_object' } } : {}),
  };
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `OpenAI-compatible error ${res.status}`);
  const text = data.choices?.[0]?.message?.content || '';
  return jsonSchema ? safeJson(text) : text;
}