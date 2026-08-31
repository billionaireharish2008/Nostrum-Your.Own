import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function SecurityBackground() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 60, damping: 20, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 60, damping: 20, mass: 0.5 });

  const glowX = useTransform(sx, (v) => `${v * 100}%`);
  const glowY = useTransform(sy, (v) => `${v * 100}%`);
  const gridX = useTransform(sx, (v) => `${(v - 0.5) * -40}px`);
  const gridY = useTransform(sy, (v) => `${(v - 0.5) * -40}px`);

  useEffect(() => {
    if (reduce) return;
    const onMove = (e) => {
      mx.set(e.clientX / window.innerWidth);
      my.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, reduce]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* base wash */}
      <div className="absolute inset-0 bg-background" />

      {/* cursor-following glow */}
      {!reduce && (
        <motion.div
          className="absolute w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-[0.18]"
          style={{
            left: glowX,
            top: glowY,
            translateX: "-50%",
            translateY: "-50%",
            background: "radial-gradient(circle, hsl(160 84% 42%), transparent 65%)",
          }}
        />
      )}

      {/* parallax grid */}
      <motion.div
        className="absolute inset-[-10%] opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(160 84% 42% / 0.18) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 42% / 0.18) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          x: gridX,
          y: gridY,
          maskImage: "radial-gradient(ellipse at center, black 35%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 35%, transparent 78%)",
        }}
      />

      {/* drifting orbs */}
      {!reduce &&
        [
          { c: "hsl(160 84% 42%)", s: 320, x: "8%", y: "18%", d: 16 },
          { c: "hsl(198 80% 55%)", s: 260, x: "78%", y: "68%", d: 19 },
          { c: "hsl(280 65% 65%)", s: 220, x: "62%", y: "12%", d: 22 },
        ].map((o, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-[90px] opacity-[0.12]"
            style={{ width: o.s, height: o.s, left: o.x, top: o.y, background: `radial-gradient(circle, ${o.c}, transparent 70%)` }}
            animate={{ x: [0, 30, -20, 0], y: [0, -24, 18, 0], scale: [1, 1.12, 0.95, 1] }}
            transition={{ duration: o.d, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

      {/* scanning line */}
      {!reduce && (
        <motion.div
          className="absolute left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, hsl(160 84% 42% / 0.5), transparent)" }}
          animate={{ top: ["-5%", "105%"] }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* floating shield glyph */}
      {!reduce && (
        <motion.div
          className="absolute left-1/2 top-1/2 text-primary/10"
          animate={{ y: [0, -14, 0], rotate: [0, 4, -4, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{ translateX: "-50%", translateY: "-50%" }}
        >
          <ShieldCheck className="w-[42vw] h-[42vw] max-w-[520px] max-h-[520px]" strokeWidth={0.6} />
        </motion.div>
      )}
    </div>
  );
}