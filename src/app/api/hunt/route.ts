import { NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_PAT?.trim() || "";
const REPO_OWNER = "DeadManOfficial";
const REPO_NAME = "deadman-tools";
const WORKFLOW_FILE = "hunt.yml";

export async function POST(request: Request) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "No GitHub token configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const handle = body.handle;
    const mode = body.mode || "standard"; // quick, standard, deep

    if (!handle || typeof handle !== "string" || handle.length > 100) {
      return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
    }

    // Trigger GitHub Actions workflow
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "DeadManDash/2.0",
        },
        body: JSON.stringify({
          ref: "master",
          inputs: {
            program: handle,
            mode: mode,
          },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (res.status === 204) {
      return NextResponse.json({
        success: true,
        message: `Hunt triggered for ${handle} (${mode} mode)`,
        workflow: `https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}`,
      });
    }

    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: "Failed to trigger workflow", detail: errData },
      { status: res.status }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to trigger hunt", detail: String(e) },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ runs: [] });
  }

  try {
    // Get recent workflow runs
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=10`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "DeadManDash/2.0",
        },
        signal: AbortSignal.timeout(10000),
      }
    );
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runs = (data.workflow_runs || []).map((run: any) => ({
      id: run.id,
      status: run.status,
      conclusion: run.conclusion,
      created: run.created_at,
      updated: run.updated_at,
      url: run.html_url,
    }));
    return NextResponse.json({ runs });
  } catch {
    return NextResponse.json({ runs: [] });
  }
}
