import { NextResponse } from "next/server";

const H1_USER = process.env.H1_USERNAME?.trim() || "";
const H1_TOKEN = process.env.H1_TOKEN?.trim() || "";

async function h1GraphQL(query: string, variables: Record<string, unknown> = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "DeadManDash/2.0",
  };
  if (H1_USER && H1_TOKEN) {
    const auth = Buffer.from(`${H1_USER}:${H1_TOKEN}`).toString("base64");
    headers["Authorization"] = `Bearer ${auth}`;
  }
  const res = await fetch("https://hackerone.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15000),
  });
  return res.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get("handle");

  if (handle) {
    // Get specific program scope
    const query = `
      query GetTeam($handle: String!) {
        team(handle: $handle) {
          _id name handle url
          offers_bounties
          submission_state
          response_efficiency_percentage
          structured_scopes(first: 100, archived: false) {
            total_count
            edges {
              node {
                asset_identifier
                asset_type
                eligible_for_bounty
                eligible_for_submission
                max_severity
              }
            }
          }
        }
      }
    `;
    try {
      const result = await h1GraphQL(query, { handle });
      const team = result?.data?.team;
      if (!team) {
        return NextResponse.json({ error: "Program not found" }, { status: 404 });
      }

      const scopes = (team.structured_scopes?.edges || []).map(
        (e: { node: Record<string, unknown> }) => e.node
      );
      const domains = scopes
        .filter((s: Record<string, unknown>) => s.eligible_for_submission && ["URL", "WILDCARD"].includes(s.asset_type as string))
        .map((s: Record<string, unknown>) => ({
          asset: s.asset_identifier,
          type: s.asset_type,
          bounty: s.eligible_for_bounty,
          severity: s.max_severity,
        }));

      return NextResponse.json({
        program: {
          name: team.name,
          handle: team.handle,
          url: team.url,
          bounties: team.offers_bounties,
          state: team.submission_state,
          response: team.response_efficiency_percentage,
          totalScope: team.structured_scopes?.total_count || 0,
        },
        scopes,
        domains,
      });
    } catch {
      return NextResponse.json({ error: "Failed to fetch program" }, { status: 500 });
    }
  }

  // List recent programs from Notion
  const NOTION_KEY = process.env.NOTION_API_KEY?.trim();
  const DB = process.env.NOTION_DB_PROGRAMS?.trim();
  if (!NOTION_KEY || !DB) {
    return NextResponse.json({ programs: [] });
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${DB}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
        page_size: 30,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const programs = (data.results || []).map((page: any) => {
      const p = page.properties;
      const getText = (prop: Record<string, unknown>) => {
        if (!prop) return "";
        if (prop.type === "title") return (prop.title as Array<{plain_text: string}>)?.map(t => t.plain_text).join("") || "";
        if (prop.type === "rich_text") return (prop.rich_text as Array<{plain_text: string}>)?.map(t => t.plain_text).join("") || "";
        if (prop.type === "select") return (prop.select as {name: string})?.name || "";
        return "";
      };
      return {
        id: page.id,
        name: getText(p["Program"] || p["Name"]),
        platform: getText(p["Platform"]),
        status: getText(p["Status"]),
        updated: page.last_edited_time,
      };
    });
    return NextResponse.json({ programs });
  } catch {
    return NextResponse.json({ programs: [] });
  }
}
