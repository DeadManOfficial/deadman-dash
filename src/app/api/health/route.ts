import { NextResponse } from "next/server";

type ServiceCheck = {
  name: string;
  status: "active" | "warning" | "dead";
  latency?: number;
};

async function checkService(
  name: string,
  url: string,
  headers: Record<string, string>,
  validate?: (data: any) => boolean
): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    const latency = Date.now() - start;
    if (!res.ok) return { name, status: "dead", latency };
    if (validate) {
      const data = await res.json();
      return { name, status: validate(data) ? "active" : "warning", latency };
    }
    return { name, status: "active", latency };
  } catch {
    return { name, status: "dead", latency: Date.now() - start };
  }
}

export async function GET() {
  const checks: Promise<ServiceCheck>[] = [];

  // GitHub
  if (process.env.GITHUB_PAT) {
    checks.push(
      checkService("GitHub", "https://api.github.com/user", {
        Authorization: `Bearer ${process.env.GITHUB_PAT}`,
        "User-Agent": "DeadManDash/1.0",
      })
    );
  }

  // Notion
  if (process.env.NOTION_API_KEY) {
    checks.push(
      checkService("Notion", "https://api.notion.com/v1/users/me", {
        Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
      })
    );
  }

  // Vercel
  if (process.env.VERCEL_TOKEN) {
    checks.push(
      checkService("Vercel", "https://api.vercel.com/v2/user", {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      })
    );
  }

  // Groq
  if (process.env.GROQ_API_KEY) {
    checks.push(
      checkService("Groq", "https://api.groq.com/openai/v1/models", {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "User-Agent": "DeadManDash/1.0",
      })
    );
  }

  // Shodan
  if (process.env.SHODAN_API_KEY) {
    checks.push(
      checkService(
        "Shodan",
        `https://api.shodan.io/api-info?key=${process.env.SHODAN_API_KEY}`,
        { "User-Agent": "DeadManDash/1.0" }
      )
    );
  }

  // HackerOne
  if (process.env.H1_USERNAME && process.env.H1_TOKEN) {
    const auth = Buffer.from(`${process.env.H1_USERNAME}:${process.env.H1_TOKEN}`).toString("base64");
    checks.push(
      checkService("HackerOne", "https://api.hackerone.com/v1/me/reports?page[size]=1", {
        Authorization: `Basic ${auth}`,
        "User-Agent": "DeadManDash/1.0",
      })
    );
  }

  const results = await Promise.all(checks);
  const active = results.filter((r) => r.status === "active").length;
  const total = results.length;

  return NextResponse.json({
    status: active === total ? "healthy" : active > 0 ? "degraded" : "down",
    active,
    total,
    services: results,
    checked_at: new Date().toISOString(),
  });
}
