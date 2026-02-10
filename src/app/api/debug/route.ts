import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

export async function GET() {
  const apiKey = process.env.NOTION_API_KEY;
  const dbPrograms = process.env.NOTION_DB_PROGRAMS;
  const dbTargets = process.env.NOTION_DB_TARGETS;
  const dbProjects = process.env.NOTION_DB_PROJECTS;

  const result: Record<string, unknown> = {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey?.slice(0, 10) + "...",
    dbPrograms: dbPrograms,
    dbTargets: dbTargets,
    dbProjects: dbProjects,
  };

  if (apiKey && dbPrograms) {
    try {
      const notion = new Client({ auth: apiKey });
      const res = await notion.databases.query({
        database_id: dbPrograms,
        page_size: 1,
      });
      result.programsCount = res.results.length;
      result.programsOk = true;
      if (res.results.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result.programProps = Object.keys((res.results[0] as any).properties);
      }
    } catch (e) {
      result.programsOk = false;
      result.programsError = (e as Error).message;
    }
  }

  if (apiKey && dbTargets) {
    try {
      const notion = new Client({ auth: apiKey });
      const res = await notion.databases.query({
        database_id: dbTargets,
        page_size: 1,
      });
      result.targetsCount = res.results.length;
      result.targetsOk = true;
    } catch (e) {
      result.targetsOk = false;
      result.targetsError = (e as Error).message;
    }
  }

  if (apiKey && dbProjects) {
    try {
      const notion = new Client({ auth: apiKey });
      const res = await notion.databases.query({
        database_id: dbProjects,
        page_size: 1,
      });
      result.projectsCount = res.results.length;
      result.projectsOk = true;
    } catch (e) {
      result.projectsOk = false;
      result.projectsError = (e as Error).message;
    }
  }

  return NextResponse.json(result);
}
