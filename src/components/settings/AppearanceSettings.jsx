import { Moon, Sun, Check } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  const options = [
    { id: "dark", label: "Dark", icon: Moon, hint: "Default SOC theme" },
    { id: "light", label: "Light", icon: Sun, hint: "Bright daylight" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="font-medium mb-1">Appearance</div>
      <p className="text-xs text-muted-foreground mb-4">
        Choose how Nostrum looks on this device. Admin console follows the same theme.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => {
          const Icon = o.icon;
          const active = theme === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setTheme(o.id)}
              className={cn(
                "relative rounded-xl border p-4 text-left transition-colors",
                active ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
              )}
            >
              <div className="flex items-center justify-between">
                <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
                {active && <Check className="w-4 h-4 text-primary" />}
              </div>
              <div className="mt-3 text-sm font-medium">{o.label}</div>
              <div className="text-xs text-muted-foreground">{o.hint}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}