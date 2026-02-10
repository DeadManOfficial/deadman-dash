"use client";

import { useState, useEffect } from "react";

type ProgramInfo = {
  name: string;
  handle: string;
  url: string;
  bounties: boolean;
  state: string;
  response: number;
  totalScope: number;
};

type ScopeItem = {
  asset: string;
  type: string;
  bounty: boolean;
  severity: string;
};

type WorkflowRun = {
  id: number;
  status: string;
  conclusion: string | null;
  created: string;
  updated: string;
  url: string;
};

export default function BountyBrowser() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [program, setProgram] = useState<ProgramInfo | null>(null);
  const [domains, setDomains] = useState<ScopeItem[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [huntStatus, setHuntStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent hunt runs on mount
  useEffect(() => {
    fetch("/api/hunt")
      .then((r) => r.json())
      .then((d) => setRuns(d.runs || []))
      .catch(() => {});
  }, []);

  const fetchProgram = async () => {
    if (!handle.trim()) return;
    setLoading(true);
    setError(null);
    setProgram(null);
    setDomains([]);

    try {
      const res = await fetch(`/api/bounties?handle=${encodeURIComponent(handle.trim())}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProgram(data.program);
        setDomains(data.domains || []);
      }
    } catch {
      setError("Failed to fetch program");
    } finally {
      setLoading(false);
    }
  };

  const triggerHunt = async (mode: string) => {
    if (!program) return;
    setHuntStatus("triggering...");

    try {
      const res = await fetch("/api/hunt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: program.handle, mode }),
      });
      const data = await res.json();
      if (data.success) {
        setHuntStatus(`Hunt triggered (${mode})`);
        // Refresh runs after a short delay
        setTimeout(() => {
          fetch("/api/hunt")
            .then((r) => r.json())
            .then((d) => setRuns(d.runs || []))
            .catch(() => {});
        }, 3000);
      } else {
        setHuntStatus(`Failed: ${data.error}`);
      }
    } catch {
      setHuntStatus("Failed to trigger hunt");
    }
  };

  const statusColor = (status: string, conclusion: string | null) => {
    if (status === "completed" && conclusion === "success")
      return "text-[#00ff88]";
    if (status === "completed" && conclusion === "failure")
      return "text-[#ff4444]";
    if (status === "in_progress") return "text-[#ffcc00]";
    return "text-[#6b7280]";
  };

  return (
    <section className="bg-[#12121a] border border-[#1e1e2e] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#ff4488]">
          Bounty Hunter
        </h2>
        <span className="text-xs text-[#6b7280]">HackerOne Programs</span>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-[#1e1e2e] flex gap-2">
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchProgram()}
          placeholder="Enter H1 program handle (e.g. security)"
          className="flex-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded px-3 py-1.5 text-sm text-white placeholder-[#6b7280] focus:border-[#ff4488]/40 focus:outline-none"
        />
        <button
          onClick={fetchProgram}
          disabled={loading}
          className="px-4 py-1.5 bg-[#ff4488]/10 border border-[#ff4488]/30 rounded text-sm text-[#ff4488] hover:bg-[#ff4488]/20 transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Fetch"}
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 text-sm text-[#ff4444] bg-[#ff4444]/5">
          {error}
        </div>
      )}

      {/* Program Info */}
      {program && (
        <div className="px-4 py-3 border-b border-[#1e1e2e]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-base font-semibold">{program.name}</span>
              <span className="text-xs text-[#6b7280] ml-2">
                @{program.handle}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {program.bounties && (
                <span className="text-xs px-2 py-0.5 rounded bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20">
                  Bounties
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded bg-[#4488ff]/10 text-[#4488ff] border border-[#4488ff]/20">
                {program.state}
              </span>
            </div>
          </div>
          <div className="flex gap-4 text-xs text-[#6b7280]">
            <span>{program.totalScope} assets in scope</span>
            <span>{domains.length} scannable domains</span>
            {program.response > 0 && (
              <span>Response: {program.response}%</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => triggerHunt("quick")}
              className="px-3 py-1.5 bg-[#4488ff]/10 border border-[#4488ff]/30 rounded text-xs text-[#4488ff] hover:bg-[#4488ff]/20 transition-colors"
            >
              Quick Scan
            </button>
            <button
              onClick={() => triggerHunt("standard")}
              className="px-3 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded text-xs text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors"
            >
              Full Hunt
            </button>
            <button
              onClick={() => triggerHunt("deep")}
              className="px-3 py-1.5 bg-[#ff8800]/10 border border-[#ff8800]/30 rounded text-xs text-[#ff8800] hover:bg-[#ff8800]/20 transition-colors"
            >
              Deep Scan
            </button>
          </div>
          {huntStatus && (
            <div className="mt-2 text-xs text-[#ffcc00]">{huntStatus}</div>
          )}
        </div>
      )}

      {/* Scope/Domains */}
      {domains.length > 0 && (
        <div className="divide-y divide-[#1e1e2e] max-h-60 overflow-y-auto">
          {domains.map((d, i) => (
            <div
              key={i}
              className="px-4 py-1.5 flex items-center justify-between hover:bg-[#1a1a2e] transition-colors"
            >
              <div className="flex items-center gap-2">
                {d.bounty && (
                  <span className="text-[#00ff88] text-xs">$</span>
                )}
                <span className="text-sm font-mono">
                  {String(d.asset).replace(/https?:\/\//, "").slice(0, 50)}
                </span>
              </div>
              <span className="text-xs text-[#6b7280]">{d.type}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Runs */}
      {runs.length > 0 && (
        <div className="border-t border-[#1e1e2e]">
          <div className="px-4 py-2 text-xs text-[#6b7280]">
            Recent Hunts
          </div>
          <div className="divide-y divide-[#1e1e2e] max-h-40 overflow-y-auto">
            {runs.map((run) => (
              <a
                key={run.id}
                href={run.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 flex items-center justify-between hover:bg-[#1a1a2e] transition-colors"
              >
                <span
                  className={`text-xs ${statusColor(run.status, run.conclusion)}`}
                >
                  {run.conclusion || run.status}
                </span>
                <span className="text-xs text-[#6b7280]">
                  {new Date(run.created).toLocaleDateString()}{" "}
                  {new Date(run.created).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
