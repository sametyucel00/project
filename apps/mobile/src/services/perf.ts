declare global {
  var __narPerfMarks__: Map<string, number> | undefined;
  var __narPerfCounters__: Map<string, number> | undefined;
}

function isPerfEnabled() {
  return typeof __DEV__ !== "undefined" ? __DEV__ : true;
}

export function perfNow() {
  const source = globalThis.performance;
  return typeof source?.now === "function" ? source.now() : Date.now();
}

function getMarks() {
  if (!globalThis.__narPerfMarks__) globalThis.__narPerfMarks__ = new Map<string, number>();
  return globalThis.__narPerfMarks__;
}

function getCounters() {
  if (!globalThis.__narPerfCounters__) globalThis.__narPerfCounters__ = new Map<string, number>();
  return globalThis.__narPerfCounters__;
}

export function perfMark(name: string, detail?: Record<string, unknown>) {
  const timestamp = perfNow();
  getMarks().set(name, timestamp);
  if (isPerfEnabled()) {
    console.info(`[nar-perf] ${name} @${timestamp.toFixed(1)}ms${detail ? ` ${compactDetail(detail)}` : ""}`);
  }
  return timestamp;
}

export function perfMeasure(name: string, startMark: string, detail?: Record<string, unknown>) {
  const marks = getMarks();
  const start = marks.get(startMark);
  const end = perfNow();
  if (start === undefined) {
    if (isPerfEnabled()) {
      console.info(`[nar-perf] ${name} missing-start:${startMark}${detail ? ` ${compactDetail(detail)}` : ""}`);
    }
    return null;
  }

  const duration = end - start;
  marks.set(name, end);
  if (isPerfEnabled()) {
    console.info(`[nar-perf] ${name} ${duration.toFixed(1)}ms${detail ? ` ${compactDetail(detail)}` : ""}`);
  }
  return duration;
}

export function perfCount(name: string, detail?: Record<string, unknown>) {
  const counters = getCounters();
  const next = (counters.get(name) ?? 0) + 1;
  counters.set(name, next);
  if (isPerfEnabled()) {
    console.info(`[nar-perf] ${name}#${next}${detail ? ` ${compactDetail(detail)}` : ""}`);
  }
  return next;
}

export function perfFlag(flag: string) {
  if (typeof window === "undefined") return false;
  try {
    const raw = new URL(window.location.href).searchParams.get("narPerf");
    if (!raw) return false;
    return raw
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .includes(flag.toLowerCase());
  } catch {
    return false;
  }
}

function compactDetail(detail: Record<string, unknown>) {
  return Object.entries(detail)
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(" ");
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return String(value);
  if (typeof value === "number") return Number.isFinite(value) ? value.toFixed(1) : String(value);
  if (typeof value === "boolean" || typeof value === "string") return String(value);
  if (Array.isArray(value)) return `[${value.length}]`;
  return "{...}";
}

