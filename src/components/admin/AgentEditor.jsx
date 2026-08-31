import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export const CAPABILITIES = [
  { key: "view_balance", label: "View balance" },
  { key: "view_transactions", label: "View transactions" },
  { key: "create_transactions", label: "Create transactions" },
  { key: "report_suspicious", label: "Report suspicious activity" },
  { key: "manage_users", label: "Manage users" },
  { key: "manage_models", label: "Manage models" },
];

const emptyForm = {
  name: "",
  system_prompt: "",
  model: "automatic",
  temperature: 0.4,
  enabled: true,
  agent_role: "customer",
  capabilities: {},
};

export default function AgentEditor({ agent, models, open, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setForm(agent ? { ...emptyForm, ...agent, capabilities: agent.capabilities || {} } : emptyForm);
  }, [agent, open]);

  if (!open) return null;

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const setCapability = (key, value) =>
    setForm((current) => ({
      ...current,
      capabilities: { ...current.capabilities, [key]: value },
    }));

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.system_prompt.trim()) {
      toast({ title: "Name and system prompt are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.functions.invoke("saveAgent", {
        ...(agent?.id ? { id: agent.id } : {}),
        ...form,
        name: form.name.trim(),
        system_prompt: form.system_prompt.trim(),
        temperature: Number(form.temperature),
      });
      toast({ title: agent ? "Agent updated" : "Agent created" });
      onSaved("agent");
    } catch (error) {
      toast({ title: "Could not save agent", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center" role="dialog" aria-modal="true">
      <form onSubmit={save} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">{agent ? "Edit agent" : "Add agent"}</h2>
            <p className="text-sm text-muted-foreground mt-1">Configure the agent behavior and allowed capabilities.</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
        </div>

        <label className="block space-y-1.5 text-sm">
          <span>Name</span>
          <input className="w-full rounded-md border border-input bg-background px-3 py-2" value={form.name} onChange={(e) => setField("name", e.target.value)} maxLength={120} />
        </label>

        <label className="block space-y-1.5 text-sm">
          <span>System prompt</span>
          <textarea className="w-full min-h-32 rounded-md border border-input bg-background px-3 py-2" value={form.system_prompt} onChange={(e) => setField("system_prompt", e.target.value)} maxLength={8000} />
        </label>

        <div className="grid sm:grid-cols-3 gap-3">
          <label className="space-y-1.5 text-sm">
            <span>Model</span>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2" value={form.model} onChange={(e) => setField("model", e.target.value)}>
              <option value="automatic">Automatic</option>
              {models.map((model) => <option key={model.value} value={model.value}>{model.name}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm">
            <span>Temperature</span>
            <input className="w-full rounded-md border border-input bg-background px-3 py-2" type="number" min="0" max="2" step="0.1" value={form.temperature} onChange={(e) => setField("temperature", e.target.value)} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span>Role</span>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2" value={form.agent_role} onChange={(e) => setField("agent_role", e.target.value)}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Capabilities</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {CAPABILITIES.map((capability) => (
              <label key={capability.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={!!form.capabilities[capability.key]} onChange={(e) => setCapability(capability.key, e.target.checked)} />
                {capability.label}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.enabled} onChange={(e) => setField("enabled", e.target.checked)} />
          Enabled
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">{saving ? "Saving…" : "Save agent"}</button>
        </div>
      </form>
    </div>
  );
}
