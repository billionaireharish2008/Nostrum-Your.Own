import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useMotionVars } from "@/lib/motion";

const particles = [
  { left: "18%", top: "30%", size: 6, delay: 0, dur: 9 },
  { left: "72%", top: "22%", size: 4, delay: 1.4, dur: 11 },
  { left: "40%", top: "68%", size: 5, delay: 0.8, dur: 10 },
  { left: "84%", top: "60%", size: 3, delay: 2.2, dur: 13 },
  { left: "12%", top: "72%", size: 4, delay: 1.1, dur: 12 },
];

export default function AuthShowpiece({ children, footer, variant = "customer" }) {
  const [count, setCount] = useState(1284902);
  const isStaff = variant === "staff";
  const { reduce, container, item } = useMotionVars(0.12);

  useEffect(() => {
    const t = setInterval(() => setCount((c) => c + Math.floor(Math.random() * 7) + 1), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background text-foreground">
      {/* Left animated panel */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden border-r border-border"
        style={{
          backgroundColor: "hsl(222 47% 6%)",
          backgroundImage:
            "linear-gradient(hsl(160 84% 42% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 42% / 0.06) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      >
        {/* Drifting orbs */}
        <motion.div
          className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(circle, hsl(160 84% 42%), transparent 70%)" }}
          animate={reduce ? {} : { x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, hsl(198 80% 55%), transparent 70%)" }}
          animate={reduce ? {} : { x: [0, -30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating particles */}
        {!reduce &&
          particles.map((p, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute rounded-full bg-primary/40"
              style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
              animate={{ y: [0, -18, 0], opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
            />
          ))}

        {/* Scan line */}
        {!reduce && (
          <motion.div
            className="pointer-events-none absolute left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, hsl(160 84% 42% / 0.5), transparent)" }}
            initial={{ top: "-5%" }}
            animate={{ top: ["-5%", "105%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
        )}

        <motion.div variants={container} initial="hidden" animate="show" className="relative flex flex-col justify-between h-full">
          <motion.div variants={item} className="flex items-center gap-2.5">
            <div className="relative">
              <motion.span
                className="absolute inset-0 rounded-full blur-md bg-primary/40"
                animate={reduce ? {} : { scale: [1, 1.5, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <ShieldCheck className="relative w-6 h-6 text-primary" />
            </div>
            <span className="font-display font-semibold tracking-tight text-lg">Nostrum</span>
          </motion.div>

          <motion.div variants={item} className="">
            <h2 className="font-display text-3xl font-semibold leading-tight max-w-sm">
              {isStaff ? "Security operations console" : "Banking, guarded around the clock"}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
              {isStaff
                ? "Realtime session telemetry, risk scoring, and adaptive response — for authorized staff only."
                : "Every sign-in and transfer is watched by adaptive fraud monitoring that learns what's normal for you."}
            </p>
          </motion.div>

          <motion.div variants={item} className="flex items-center gap-3">
            <motion.div
              animate={reduce ? {} : { scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_hsl(160_84%_42%)]"
            />
            <div>
              <div className="font-mono text-2xl font-semibold tabular-nums">{count.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">transactions secured</div>
            </div>
          </motion.div>

          <motion.div variants={item} className="relative text-xs text-muted-foreground font-mono">
            SOC 2 Type II · Adaptive risk response · {new Date().getFullYear()}
          </motion.div>
        </motion.div>
      </div>

      {/* Right auth card */}
      <div className="flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        <motion.div
          className="pointer-events-none absolute top-1/3 left-1/2 w-72 h-72 rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, hsl(160 84% 42%), transparent 70%)" }}
          animate={reduce ? {} : { scale: [1, 1.3, 1], opacity: [0.08, 0.16, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="w-full max-w-md relative">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/50 p-7 sm:p-8"
          >
            {children}
          </motion.div>
          {footer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-6 text-center text-xs text-muted-foreground"
            >
              {footer}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
