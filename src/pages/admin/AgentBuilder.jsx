import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { isMasterAdmin } from "@/lib/roles";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, Plus, Pencil, Trash2, Bot, ShieldHalf } from "lucide-react";
import AgentEditor from "@/components/admin/AgentEditor";
import ModelManager from "@/components/admin/ModelManager";
import { CAPABILITIES } from "@/components/admin/AgentEditor";

export default function AgentBuilder() {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { toast } = useToast();
  const master = isMasterAdmin(user);

  const load = useCallback(async () => {
    try {
      const [a, modelRes] = await Promise.all([
        base44.entities.AgentConfig.list("-created_date", 100),
        base44.functions.invoke("manageModels", { action: "list" }).catch(() => ({ data: { models: [] } })),
      ]);
      setAgents(a);
      setModels((modelRes.data && modelRes.data.models) || []);
    } catch (e) {
      toast({ title: "Failed to load", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const addNew = () => {
    if (!master && agents.length >= 10) {
      toast({
        title: "Agent limit reached",
        description: "You can add up to 10 agents. Only the master admin can add more.",
        variant: "destructive",
      });
      return;
    }
    setEditing(null);
    setEditorOpen(true);
  };

  const edit = (a) => {
    setEditing(a);
    setEditorOpen(true);
  };

  const remove = async (a) => {
    try {
      await base44.entities.AgentConfig.delete(a.id);
      toast({ title: "Agent deleted" });
      load();
    } catch (e) {
      toast({ title: "Failed to delete", description: e.message, variant: "destructive" });
    }
  };

  const toggleEnabled = async (a, enabled) => {
    try {
      await base44.functions.invoke("saveAgent", { id: a.id, enabled });
      load();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const onSaved = (what) => {
    if (what === "model") load();
    else {
      setEditorOpen(false);
      load();
    }
  };

  const capLabel = (key) => (CAPABILITIES.find((c) => c.key === key) || {}).label || key;
  const activeCaps = (a) =>
    a.capabilities ? Object.keys(a.capabilities).filter((k) => a.capabilities[k]) : [];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-xl font-semibold flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" /> AI Agent Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build agents, choose models, set capabilities, and decide if an agent acts as customer or admin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono">
            {agents.length}{master ? " / ∞" : " / 10"} agents
          </Badge>
          <Button onClick={addNew}>
            <Plus className="w-4 h-4" /> Add agent
          </Button>
        </div>
      </div>

      {loading && <div className="p-10 text-center text-sm text-muted-foreground">Loading agents…</div>}

      {!loading && agents.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground mb-6">
          No agents yet. Click “Add agent” to create your first AI agent.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {agents.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{a.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate">{a.model}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className={a.agent_role === "admin" ? "border-amber-500/40 text-amber-400" : "border-primary/30 text-primary"}>
                  {a.agent_role === "admin" ? (
                    <span className="inline-flex items-center gap-1"><ShieldHalf className="w-3 h-3" /> admin</span>
                  ) : "customer"}
                </Badge>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {activeCaps(a).length === 0 && (
                <span className="text-[11px] text-muted-foreground">No capabilities enabled</span>
              )}
              {activeCaps(a).map((k) => (
                <span key={k} className="text-[10px] font-mono rounded-md bg-accent px-2 py-0.5 text-muted-foreground">
                  {capLabel(k)}
                </span>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={a.enabled !== false}
                  onChange={(e) => toggleEnabled(a, e.target.checked)}
                />
                Enabled
              </label>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => edit(a)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(a)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ModelManager models={models} onChanged={load} />

      <AgentEditor
        agent={editing}
        models={models}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={onSaved}
      />
    </div>
  );
}