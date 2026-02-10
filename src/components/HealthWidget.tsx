"use client";

import { useEffect, useState } from "react";

type Service = {
  name: string;
  status: "active" | "warning" | "dead";
  latency?: number;
};

type HealthData = {
  status: string;
  active: number;
  total: number;
  services: Service[];
  checked_at: string;
};

const statusColors: Record<string, string> = {
  active: "bg-[#00ff88]",
  warning: "bg-[#ffcc00]",
  dead: "bg-[#ff4444]",
};

const statusText: Record<string, string> = {
  healthy: "All Systems Operational",
  degraded: "Partial Outage",
  down: "Major Outage",
};

export default function HealthWidget() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-[#12121a] border border-[#1e1e2e] rounded-lg overflow-hidden lg:col-span-2">
        <div className="px-4 py-3 border-b border-[#1e1e2e]">
          <h2 className="text-sm font-semibold text-[#e0e0e0]">Service Health</h2>
        </div>
        <div className="p-4 text-center text-[#6b7280] text-sm">Checking services...</div>
      </section>
    );
  }

  if (!health) {
    return (
      <section className="bg-[#12121a] border border-[#1e1e2e] rounded-lg overflow-hidden lg:col-span-2">
        <div className="px-4 py-3 border-b border-[#1e1e2e]">
          <h2 className="text-sm font-semibold text-[#e0e0e0]">Service Health</h2>
        </div>
        <div className="p-4 text-center text-[#6b7280] text-sm">Could not fetch health status</div>
      </section>
    );
  }

  return (
    <section className="bg-[#12121a] border border-[#1e1e2e] rounded-lg overflow-hidden lg:col-span-2">
      <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#e0e0e0]">Service Health</h2>
          <span className={`text-xs px-2 py-0.5 rounded border ${
            health.status === "healthy"
              ? "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20"
              : health.status === "degraded"
              ? "bg-[#ffcc00]/10 text-[#ffcc00] border-[#ffcc00]/20"
              : "bg-[#ff4444]/10 text-[#ff4444] border-[#ff4444]/20"
          }`}>
            {statusText[health.status] || health.status}
          </span>
        </div>
        <span className="text-xs text-[#6b7280]">
          {health.active}/{health.total} active
        </span>
      </div>
      <div className="px-4 py-3 flex flex-wrap gap-3">
        {health.services.map((svc) => (
          <div
            key={svc.name}
            className="flex items-center gap-2 bg-[#0a0a0f] rounded-md px-3 py-2 border border-[#1e1e2e]"
          >
            <div className={`w-2 h-2 rounded-full ${statusColors[svc.status]} ${svc.status === "active" ? "pulse-glow" : ""}`} />
            <span className="text-sm">{svc.name}</span>
            {svc.latency !== undefined && (
              <span className="text-xs text-[#6b7280]">{svc.latency}ms</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
