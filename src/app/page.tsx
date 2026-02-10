import { getPrograms, getFindings, getTargets, getProjects, getStats } from "@/lib/notion";
import HealthWidget from "@/components/HealthWidget";

export const dynamic = "force-dynamic";
export const revalidate = 300; // ISR: refresh every 5 minutes

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function SeverityBadge({ severity }: { severity: string }) {
  const s = severity.toLowerCase();
  const colors: Record<string, string> = {
    critical: "bg-red-500/15 text-red-400 border-red-500/30",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    info: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs border ${colors[s] || colors.info}`}>
      {severity || "—"}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-lg p-4 hover:border-[#00ff88]/20 transition-colors">
      <div className="text-[#6b7280] text-xs uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-[#00ff88]">{value}</div>
      {sub && <div className="text-xs text-[#6b7280] mt-1">{sub}</div>}
    </div>
  );
}

export default async function Dashboard() {
  const [stats, programs, findings, targets, projects] = await Promise.all([
    getStats(),
    getPrograms(),
    getFindings(),
    getTargets(),
    getProjects(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#00ff88] pulse-glow" />
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-[#00ff88]">DeadMan</span> Dashboard
          </h1>
        </div>
        <div className="text-xs text-[#6b7280]">
          Auto-refreshes every 5 min
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        <StatCard label="Programs" value={stats.programs} />
        <StatCard label="Targets" value={stats.targets} />
        <StatCard label="Findings" value={stats.findings} />
        <StatCard label="Projects" value={stats.projects} />
        <StatCard label="Critical" value={stats.criticalFindings} sub="findings" />
        <StatCard label="High" value={stats.highFindings} sub="findings" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Programs */}
        <section className="bg-[#12121a] border border-[#1e1e2e] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#00ff88]">Bug Bounty Programs</h2>
            <span className="text-xs text-[#6b7280]">{programs.length} tracked</span>
          </div>
          <div className="divide-y divide-[#1e1e2e] max-h-80 overflow-y-auto">
            {programs.length === 0 ? (
              <div className="p-4 text-center text-[#6b7280] text-sm">No programs yet</div>
            ) : (
              programs.map((p) => (
                <div key={p.id} className="px-4 py-2.5 hover:bg-[#1a1a2e] transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{p.name || "Untitled"}</span>
                    <span className="text-xs text-[#6b7280]">{p.updated ? timeAgo(p.updated) : ""}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#6b7280]">
                    {p.platform && <span>{p.platform}</span>}
                    {p.bounty && <span className="text-[#00ff88]">{p.bounty}</span>}
                    {p.scope && <span>{p.scope} assets</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Findings */}
        <section className="bg-[#12121a] border border-[#1e1e2e] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#ff8800]">Findings & Vulnerabilities</h2>
            <span className="text-xs text-[#6b7280]">{findings.length} total</span>
          </div>
          <div className="divide-y divide-[#1e1e2e] max-h-80 overflow-y-auto">
            {findings.length === 0 ? (
              <div className="p-4 text-center text-[#6b7280] text-sm">No findings yet</div>
            ) : (
              findings.map((f) => (
                <div key={f.id} className="px-4 py-2.5 hover:bg-[#1a1a2e] transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{f.title || "Untitled"}</span>
                    <SeverityBadge severity={f.severity} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#6b7280]">
                    {f.target && <span>{f.target}</span>}
                    {f.type && <span>• {f.type}</span>}
                    {f.created && <span>• {timeAgo(f.created)}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recon Targets */}
        <section className="bg-[#12121a] border border-[#1e1e2e] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#4488ff]">Recon Targets</h2>
            <span className="text-xs text-[#6b7280]">{targets.length} domains</span>
          </div>
          <div className="divide-y divide-[#1e1e2e] max-h-80 overflow-y-auto">
            {targets.length === 0 ? (
              <div className="p-4 text-center text-[#6b7280] text-sm">No targets yet</div>
            ) : (
              targets.map((t) => (
                <div key={t.id} className="px-4 py-2.5 hover:bg-[#1a1a2e] transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium font-mono">{t.domain || "?"}</span>
                    <span className="text-xs text-[#6b7280]">{t.updated ? timeAgo(t.updated) : ""}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#6b7280]">
                    {t.program && <span>{t.program}</span>}
                    {t.server && <span>• {t.server}</span>}
                    {t.lastRecon && <span>• scanned {timeAgo(t.lastRecon)}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Projects / Services */}
        <section className="bg-[#12121a] border border-[#1e1e2e] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#ffcc00]">Services & Projects</h2>
            <span className="text-xs text-[#6b7280]">{projects.length} active</span>
          </div>
          <div className="divide-y divide-[#1e1e2e] max-h-80 overflow-y-auto">
            {projects.length === 0 ? (
              <div className="p-4 text-center text-[#6b7280] text-sm">No projects yet</div>
            ) : (
              projects.map((p) => (
                <div key={p.id} className="px-4 py-2.5 hover:bg-[#1a1a2e] transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{p.name || "Untitled"}</span>
                    {p.status && (
                      <span className="text-xs px-2 py-0.5 rounded bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20">
                        {p.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#6b7280]">
                    {p.platform && <span>{p.platform}</span>}
                    {p.url && <span>• {p.url.replace(/https?:\/\//, "").slice(0, 40)}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Health Status */}
      <div className="mt-6 grid grid-cols-1 gap-6">
        <HealthWidget />
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-[#6b7280]">
        Powered by Notion API • DeadMan Toolkit • ISR {revalidate}s
      </div>
    </div>
  );
}
