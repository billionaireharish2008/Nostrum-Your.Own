import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, ShieldHalf } from "lucide-react";

export const BUILTIN_MODELS = [
  "automatic",
  "gpt_5_mini",
  "gemini_3_flash",
  "gpt_5_4",
  "claude_sonnet_4_6",
];

export const CAPABILITIES = [
  { key: "view_balance", label: "View account balance", adminOnly: false },
  { key: "view_transactions", label: "View transactions", adminOnly: false },
  { key: "report_fraud", label: "File fraud reports", adminOnly: false },
  { key: "create_transactions", label: "Create transactions on the server", adminOnly: true },
  { key: "create_accounts", label: "Create accounts on the server", adminOnly: true },
  { key: "flag_sessions", label: "Flag / block sessions", adminOnly: true },
];

const DEFAULT_CAPS = { view_balance: true, view_transactions: true, report_fraud: true };

export default function AgentEditor({ agent, models, open, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addingModel, setAddingModel] = useState(false);
  const [newModel, setNewModel] = useState({ name: "", value: "", provider: "openai", base_url: "", api_key: "" });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setForm(
        agent
          ? {
              name: agent.name || "",
              system_prompt: agent.system_prompt || "",
              model: agent.model || "automatic",
              temperature: agent.temperature ?? 0.4,
              agent_role: agent.agent_role || "customer",
              capabilities: { ...DEFAULT_CAPS, ...(agent.capabilities || {}) },
              enabled: agent.enabled !== false,
            }
          : {
              name: "",
              system_prompt: "",
              model: "automatic",
              temperature: 0.4,
              agent_role: "customer",
              capabilities: { ...DEFAULT_CAPS },
              enabled: true,
            }
      );
      setAddingModel(false);
      setNewModel({ name: "", value: "", provider: "openai", base_url: "", api_key: "" });
    }
  }, [open, agent]);

  if (!form) return null;

  const toggleCap = (key) =>
    setForm((f) => ({ ...f, capabilities: { ...f.capabilities, [key]: !f.capabilities[key] } }));

  const onRoleChange = (r) =>
    setForm((f) => {
      const caps = { ...f.capabilities };
      if (r === "customer") {
        CAPABILITIES.filter((c) => c.adminOnly).forEach((c) => {
          caps[c.key] = false;
        });
      }
      return { ...f, agent_role: r, capabilities: caps };
    });

  const addModel = async () => {
    if (!newModel.name || !newModel.value || !newModel.api_key) {
      toast({ title: "Name, value and API key are required", variant: "destructive" });
      return;
    }
    try {
      const res = await base44.functions.invoke("manageModels", {
        action: "create",
        name: newModel.name,
        value: newModel.value,
        provider: newModel.provider || "openai",
        base_url: newModel.base_url || "",
        api_key: newModel.api_key,
      });
      const m = (res.data && res.data.model) || { value: newModel.value };
      setForm((f) => ({ ...f, model: m.value }));
      setNewModel({ name: "", value: "", provider: "openai", base_url: "", api_key: "" });
      setAddingModel(false);
      toast({ title: "Model added" });
      onSaved && onSaved("model");
    } catch (e) {
      toast({ title: "Failed to add model", description: e.message, variant: "destructive" });
    }
  };

  const save = async () => {
    if (!form.name || !form.system_prompt) {
      toast({ title: "Name and system prompt are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        system_prompt: form.system_prompt,
        model: form.model,
        temperature: Number(form.temperature),
        agent_role: form.agent_role,
        capabilities: form.capabilities,
        enabled: form.enabled,
      };
      if (agent) payload.id = agent.id;
      await base44.functions.invoke("saveAgent", payload);
      toast({ title: agent ? "Agent updated" : "Agent created" });
      onSaved && onSaved("agent");
      onClose();
    } catch (e) {
      toast({ title: "Save failed", description: e.data?.error || e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const allModels = [...BUILTIN_MODELS, ...models.map((m) => m.value)];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agent ? "Edit agent" : "New agent"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="ag-name">Agent name</Label>
            <Input
              id="ag-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="ag-prompt">System prompt — what the AI should do</Label>
            <Textarea
              id="ag-prompt"
              rows={6}
              value={form.system_prompt}
              onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
              className="mt-1.5 font-mono text-xs"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>AI model</Label>
              <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allModels.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => setAddingModel((a) => !a)}
                className="mt-1.5 text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add a new model
              </button>
              {addingModel && (
                <div className="mt-2 space-y-2 rounded-lg border border-border bg-background p-2.5">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Display name"
                      value={newModel.name}
                      onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    />
                    <Input
                      placeholder="Model value"
                      value={newModel.value}
                      onChange={(e) => setNewModel({ ...newModel, value: e.target.value })}
                    />
                  </div>
                  <Select
                    value={newModel.provider}
                    onValueChange={(v) => setNewModel({ ...newModel, provider: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Provider" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="openai_compatible">OpenAI-compatible</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      <SelectItem value="google">Google (Gemini)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Base URL (optional)"
                    value={newModel.base_url}
                    onChange={(e) => setNewModel({ ...newModel, base_url: e.target.value })}
                    className="font-mono text-xs"
                  />
                  <Input
                    type="password"
                    placeholder="API key"
                    value={newModel.api_key}
                    onChange={(e) => setNewModel({ ...newModel, api_key: e.target.value })}
                    className="font-mono text-xs"
                  />
                  <Button type="button" size="sm" onClick={addModel} disabled={!newModel.name || !newModel.value || !newModel.api_key}>
                    Add model
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="ag-temp">Temperature</Label>
              <Input
                id="ag-temp"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>Agent role</Label>
            <Select value={form.agent_role} onValueChange={onRoleChange}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer — limited, no server writes</SelectItem>
                <SelectItem value="admin">Admin — can create data on the server</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {form.agent_role === "admin"
                ? "Admin agents can create records (e.g. transactions) when the relevant capability is enabled."
                : "Customer agents assist end users only and cannot write to the server."}
            </p>
          </div>

          <div>
            <Label>Capabilities — what this agent can do</Label>
            <div className="mt-2 grid sm:grid-cols-2 gap-2">
              {CAPABILITIES.map((c) => {
                const disabled = c.adminOnly && form.agent_role !== "admin";
                return (
                  <label
                    key={c.key}
                    className={
                      "flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 " +
                      (disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-accent/40")
                    }
                  >
                    <Checkbox
                      checked={!!form.capabilities[c.key]}
                      disabled={disabled}
                      onCheckedChange={() => toggleCap(c.key)}
                    />
                    <span className="text-sm flex items-center gap-1.5">
                      {c.adminOnly && <ShieldHalf className="w-3.5 h-3.5 text-amber-400" />}
                      {c.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
            <span className="text-sm font-medium">Enabled</span>
            <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : agent ? "Save changes" : "Create agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}