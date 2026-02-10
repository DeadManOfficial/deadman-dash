import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DB = {
  programs: process.env.NOTION_DB_PROGRAMS!,
  findings: process.env.NOTION_DB_FINDINGS!,
  targets: process.env.NOTION_DB_TARGETS!,
  projects: process.env.NOTION_DB_PROJECTS!,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getText(prop: any): string {
  if (!prop) return "";
  if (prop.type === "title") return prop.title?.map((t: { plain_text: string }) => t.plain_text).join("") || "";
  if (prop.type === "rich_text") return prop.rich_text?.map((t: { plain_text: string }) => t.plain_text).join("") || "";
  if (prop.type === "number") return prop.number?.toString() || "0";
  if (prop.type === "select") return prop.select?.name || "";
  if (prop.type === "multi_select") return prop.multi_select?.map((s: { name: string }) => s.name).join(", ") || "";
  if (prop.type === "url") return prop.url || "";
  if (prop.type === "checkbox") return prop.checkbox ? "Yes" : "No";
  if (prop.type === "date") return prop.date?.start || "";
  if (prop.type === "status") return prop.status?.name || "";
  return "";
}

export type Program = {
  id: string;
  name: string;
  platform: string;
  bounty: string;
  scope: string;
  status: string;
  lastScanned: string;
  updated: string;
};

export type Finding = {
  id: string;
  title: string;
  severity: string;
  status: string;
  target: string;
  type: string;
  created: string;
};

export type Target = {
  id: string;
  domain: string;
  program: string;
  ips: string;
  server: string;
  status: string;
  findings: string;
  lastRecon: string;
  updated: string;
};

export type Project = {
  id: string;
  name: string;
  platform: string;
  status: string;
  url: string;
  updated: string;
};

export async function getPrograms(): Promise<Program[]> {
  try {
    const res = await notion.databases.query({
      database_id: DB.programs,
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      page_size: 50,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.results.map((page: any) => {
      const p = page.properties;
      return {
        id: page.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name: getText(p["Program"] || p["Name"] || Object.values(p).find((v: any) => v.type === "title")),
        platform: getText(p["Platform"]),
        bounty: getText(p["Bounty Range"] || p["Bounty"]),
        scope: getText(p["Scope"]),
        status: getText(p["Status"]),
        lastScanned: getText(p["Last Scanned"]),
        updated: page.last_edited_time,
      };
    });
  } catch {
    return [];
  }
}

export async function getFindings(): Promise<Finding[]> {
  try {
    const res = await notion.databases.query({
      database_id: DB.findings,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
      page_size: 50,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.results.map((page: any) => {
      const p = page.properties;
      return {
        id: page.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        title: getText(p["Name"] || p["Title"] || p["Finding"] || Object.values(p).find((v: any) => v.type === "title")),
        severity: getText(p["Severity"]),
        status: getText(p["Status"]),
        target: getText(p["Target"] || p["Domain"]),
        type: getText(p["Type"] || p["Category"]),
        created: page.created_time,
      };
    });
  } catch {
    return [];
  }
}

export async function getTargets(): Promise<Target[]> {
  try {
    const res = await notion.databases.query({
      database_id: DB.targets,
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      page_size: 100,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.results.map((page: any) => {
      const p = page.properties;
      return {
        id: page.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        domain: getText(p["Domain"] || p["Name"] || Object.values(p).find((v: any) => v.type === "title")),
        program: getText(p["Program"]),
        ips: getText(p["Open Ports"]),
        server: getText(p["Tech Stack"]),
        status: getText(p["Status"]),
        findings: getText(p["Subdomains"]),
        lastRecon: getText(p["Last Scan"]),
        updated: page.last_edited_time,
      };
    });
  } catch {
    return [];
  }
}

export async function getProjects(): Promise<Project[]> {
  try {
    const res = await notion.databases.query({
      database_id: DB.projects,
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      page_size: 50,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.results.map((page: any) => {
      const p = page.properties;
      return {
        id: page.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name: getText(p["Name"] || Object.values(p).find((v: any) => v.type === "title")),
        platform: getText(p["Platform"]),
        status: getText(p["Status"]),
        url: getText(p["Live URL"] || p["Repo URL"]),
        updated: page.last_edited_time,
      };
    });
  } catch {
    return [];
  }
}

export async function getStats() {
  const [programs, findings, targets, projects] = await Promise.all([
    getPrograms(),
    getFindings(),
    getTargets(),
    getProjects(),
  ]);

  return {
    programs: programs.length,
    findings: findings.length,
    targets: targets.length,
    projects: projects.length,
    criticalFindings: findings.filter((f) => f.severity.toLowerCase() === "critical").length,
    highFindings: findings.filter((f) => f.severity.toLowerCase() === "high").length,
  };
}
