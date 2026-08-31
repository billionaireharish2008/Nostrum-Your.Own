import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { recordEvent } from "@/lib/telemetry";
import { useMotionVars } from "@/lib/motion";
import { ArrowUpRight, ArrowDownLeft, Send, Flag, ShieldCheck } from "lucide-react";

async function ensureAccount(userId) {
  let accs = await base44.entities.Account.filter({ user_id: userId });
  if (accs.length) return accs[0];
  const acc = await base44.entities.Account.create({
    user_id: userId,
    balance: 12500,
    account_number: "•••• " + Math.floor(1000 + Math.random() * 9000),
    account_type: "checking",
    currency: "USD",
  });
  await base44.entities.Transaction.bulkCreate([
    { user_id: userId, account_id: acc.id, amount: 3200, type: "credit", description: "Payroll deposit", counterparty: "Acme Corp", category: "income", status: "completed", sender_name: "Acme Corp", receiver_name: "You", bank_name: "Acme Bank", sender_ip: "104.28.12.90", receiver_ip: "103.161.98.107" },
    { user_id: userId, account_id: acc.id, amount: 84.5, type: "debit", description: "Groceries", counterparty: "Whole Foods", category: "food", status: "completed", sender_name: "You", receiver_name: "Whole Foods", bank_name: "Whole Foods Bank", sender_ip: "103.161.98.107", receiver_ip: "72.14.201.10" },
    { user_id: userId, account_id: acc.id, amount: 49.99, type: "debit", description: "Streaming", counterparty: "Netflix", category: "entertainment", status: "completed", sender_name: "You", receiver_name: "Netflix", bank_name: "Chase", sender_ip: "103.161.98.107", receiver_ip: "54.240.166.20" },
    { user_id: userId, account_id: acc.id, amount: 1200, type: "debit", description: "Rent payment", counterparty: "Maple Apartments", category: "housing", status: "completed", sender_name: "You", receiver_name: "Maple Apartments", bank_name: "First National", sender_ip: "103.161.98.107", receiver_ip: "98.137.11.40" },
    { user_id: userId, account_id: acc.id, amount: 150, type: "credit", description: "Refund", counterparty: "Amazon", category: "other", status: "completed", sender_name: "Amazon", receiver_name: "You", bank_name: "Amazon Pay", sender_ip: "52.94.236.248", receiver_ip: "103.161.98.107" },
  ]);
  return acc;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayBalance, setDisplayBalance] = useState(0);
  const raf = useRef(null);
  const logged = useRef(false);
  const { reduce, container, item } = useMotionVars(0.08);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const acc = await ensureAccount(user.id);
        setAccount(acc);
        const txns = await base44.entities.Transaction.filter({ user_id: user.id }, "-created_date", 5);
        setTransactions(txns);
        if (!logged.current) {
          logged.current = true;
          recordEvent("page_visit", { page: "dashboard" });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    const target = account?.balance ?? 0;
    const start = displayBalance;
    const duration = 900;
    const t0 = performance.now();
    cancelAnimationFrame(raf.current);
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayBalance(start + (target - start) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.balance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const fmt = (n) =>
    (account?.currency || "USD") === "USD"
      ? "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : n.toLocaleString();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 relative">
      <motion.div variants={item}>
        <p className="text-sm text-muted-foreground">Welcome back{user?.first_name ? ", " + user.first_name : ""}</p>
        <h1 className="font-display text-2xl font-semibold mt-0.5">Dashboard</h1>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          variants={item}
          whileHover={reduce ? {} : { y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-card p-7 relative overflow-hidden group"
        >
          <motion.div
            className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-15"
            style={{ background: "radial-gradient(circle, hsl(160 84% 42%), transparent 70%)" }}
            animate={reduce ? {} : { scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Shimmer sweep */}
          {!reduce && (
            <motion.div
              className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100"
              style={{ background: "linear-gradient(120deg, transparent 30%, hsl(160 84% 42% / 0.08) 50%, transparent 70%)" }}
              initial={{ x: "-120%" }}
              whileHover={{ x: "120%" }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
            />
          )}
          <div className="relative flex items-center gap-2 text-primary text-sm">
            <ShieldCheck className="w-4 h-4" /> Available balance
          </div>
          <div className="relative mt-2 font-display text-4xl sm:text-5xl font-semibold tabular-nums">
            {fmt(displayBalance)}
          </div>
          <div className="relative mt-2 text-sm text-muted-foreground font-mono">
            {account?.account_number} · {account?.account_type}
          </div>
        </motion.div>

        <motion.div
          variants={item}
          whileHover={reduce ? {} : { y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="rounded-2xl border border-border bg-card p-6 flex flex-col"
        >
          <h2 className="font-display font-semibold mb-4">Quick actions</h2>
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
            <ActionCard to="/transfer" icon={Send} label="Send money" variants={item} reduce={reduce} />
            <ActionCard to="/transactions" icon={ArrowUpRight} label="History" variants={item} reduce={reduce} />
            <ActionCard to="/report" icon={Flag} label="Report issue" variants={item} reduce={reduce} />
            <ActionCard to="/settings" icon={ShieldCheck} label="Settings" variants={item} reduce={reduce} />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        variants={item}
        whileHover={reduce ? {} : { y: -2 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-semibold">Recent activity</h2>
          <Link to="/transactions" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border">
          {transactions.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">No transactions yet.</div>
          )}
          {transactions.map((t) => {
            const credit = t.type === "credit";
            return (
              <motion.div key={t.id} variants={item} whileHover={reduce ? {} : { x: 4 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}>
                <Link to={"/transactions/" + t.id} className="px-6 py-4 flex items-center gap-4 hover:bg-accent/40 transition-colors">
                  <div className={"w-9 h-9 rounded-full flex items-center justify-center " + (credit ? "bg-primary/10 text-primary" : "bg-accent text-muted-foreground")}>
                    {credit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{t.description || t.counterparty || "Transaction"}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.counterparty}</div>
                  </div>
                  <div className={"font-mono tabular-nums " + (credit ? "text-primary" : "text-foreground")}>
                    {credit ? "+" : "−"}{fmt(t.amount)}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function ActionCard({ to, icon: Icon, label, variants, reduce }) {
  return (
    <motion.div variants={variants} whileHover={reduce ? {} : { y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Link
        to={to}
        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-accent/40 transition-colors"
      >
        <motion.span whileHover={reduce ? {} : { scale: 1.15 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
          <Icon className="w-5 h-5 text-primary" />
        </motion.span>
        <span className="text-xs font-medium">{label}</span>
      </Link>
    </motion.div>
  );
}