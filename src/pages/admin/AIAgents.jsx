import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Bot, Send, Sparkles, ShieldHalf } from "lucide-react";

export default function AIAgents() {
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    base44.entities.AgentConfig
      .list()
      .then((a) => {
        setAgents(a);
        if (a.length) setSelected(a[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const agent = agents.find((a) => a.id === selected);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || !selected) return;
    const userMsg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await base44.functions.invoke("invokeAssistant", {
        agent_id: selected,
        message: userMsg.content,
        history: messages,
      });
      let reply = res.data.reply || "(no reply)";
      const created = res.data.created;
      if (created && created.id) reply += `\n\n✓ Created ${created.type} transaction of $${created.amount} on the server.`;
      if (created && created.error) reply += `\n\n⚠ Server write failed: ${created.error}`;
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      toast({ title: "Assistant error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" /> AI Agents
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Test any configured agent. Admin-role agents with create capabilities can write data to the server.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 mb-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Agent</label>
            <Select value={selected || ""} onValueChange={setSelected}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select an agent" /></SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {agent && (
            <div className="flex flex-col justify-end gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={agent.agent_role === "admin" ? "border-amber-500/40 text-amber-400" : "border-primary/30 text-primary"}>
                  {agent.agent_role === "admin" ? (
                    <span className="inline-flex items-center gap-1"><ShieldHalf className="w-3 h-3" /> admin</span>
                  ) : "customer"}
                </Badge>
                <Badge variant="outline" className="font-mono">{agent.model}</Badge>
                {agent.enabled === false && <Badge variant="outline" className="border-destructive/40 text-destructive">disabled</Badge>}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {agent.capabilities && Object.keys(agent.capabilities).filter((k) => agent.capabilities[k]).length > 0
                  ? "Capabilities: " + Object.keys(agent.capabilities).filter((k) => agent.capabilities[k]).join(", ")
                  : "No capabilities enabled"}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Test console</span>
        </div>
        <div ref={scrollRef} className="flex-1 p-4 space-y-3 max-h-[52vh] overflow-y-auto">
          {!selected && (
            <div className="text-sm text-muted-foreground text-center py-10">
              Create an agent in the AI Agent Builder, then select it here to test.
            </div>
          )}
          {selected && messages.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-10">
              Send a message to test this agent.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={
                  "max-w-[80%] rounded-xl px-3.5 py-2 text-sm whitespace-pre-wrap " +
                  (m.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent text-foreground border border-border")
                }
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-accent border border-border rounded-xl px-3.5 py-2 text-sm">
                <span className="inline-flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 130}ms` }} />
                  ))}
                </span>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={send} className="p-3 border-t border-border flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a test message…"
            disabled={sending || !selected}
            className="flex-1 h-9 rounded-lg bg-background border border-input px-3 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim() || !selected}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}