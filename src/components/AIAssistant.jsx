import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Bot, X, Send } from "lucide-react";
import { playOpen, playClose, playSend, playReceive } from "@/lib/sound";

export default function AIAssistant({ sideOffset = "right-5" }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const toggle = () => {
    if (open) playClose();
    else playOpen();
    setOpen((o) => !o);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const userMsg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);
    playSend();
    try {
      const res = await base44.functions.invoke("chatAssistant", {
        message: userMsg.content,
        history: messages,
      });
      setMessages([...next, { role: "assistant", content: res.data.reply }]);
      playReceive();
    } catch (err) {
      setMessages([
        ...next,
        { role: "assistant", content: "Sorry, I couldn't reach the assistant right now. Please try again later." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={"fixed " + sideOffset + " bottom-5 z-50"}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="absolute bottom-16 right-0 w-[340px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-gradient-to-r from-primary/15 to-transparent">
              <div className="relative">
                <Bot className="w-5 h-5 text-primary" />
                <span className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">Nostrum Assistant</div>
                <div className="text-[10px] text-muted-foreground font-mono">AI · online</div>
              </div>
              <button onClick={toggle} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 p-3 space-y-2.5 max-h-[50vh] overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Hi! Ask me anything about your account, transfers, or security.
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm " +
                      (m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-accent text-foreground border border-border rounded-bl-sm")
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-accent border border-border rounded-2xl rounded-bl-sm px-3 py-2.5 text-sm">
                    <span className="inline-flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                          style={{ animationDelay: `${i * 130}ms` }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={send} className="p-2.5 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 h-9 rounded-lg bg-background border border-input px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggle}
        whileTap={{ scale: 0.88 }}
        className="relative h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        aria-label="Open AI assistant"
      >
        {!open && (
          <span
            className="absolute inset-0 rounded-full bg-primary/40 animate-ping"
            style={{ animationDuration: "2.6s" }}
          />
        )}
        <span className="absolute inset-0 rounded-full bg-primary/30 blur-md animate-pulse" />
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="relative z-10"
            >
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative z-10"
            >
              <Bot className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}