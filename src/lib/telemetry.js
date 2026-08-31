import { base44 } from "@/api/base44Client";

export function recordEvent(action_type, payload = {}, is_synthetic = false) {
  try {
    return base44.functions.invoke("recordEvent", { action_type, payload, is_synthetic });
  } catch {
    return null;
  }
}