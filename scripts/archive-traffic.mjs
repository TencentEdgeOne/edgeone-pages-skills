#!/usr/bin/env node
// Archive GitHub Traffic API data (clones + views) into a private repo.
//
// Requirements:
//   - Node 20+ (uses global fetch)
//   - Env vars:
//       GH_TOKEN         PAT with `repo` scope (push to TARGET_REPO, read traffic on SOURCE_REPO)
//       SOURCE_REPO      e.g. "TencentEdgeOne/edgeone-pages-skills"
//       TARGET_REPO      e.g. "TencentEdgeOne/edgeone-pages-skills-traffic"
//       MODE             "weekly" (default) | "backfill"
//                        weekly   = append last Mon-Sun (Beijing time) window, skip existing dates
//                        backfill = append everything the API returns, skip existing dates

import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import os from "node:os";

const {
  GH_TOKEN,
  SOURCE_REPO = "TencentEdgeOne/edgeone-pages-skills",
  TARGET_REPO = "TencentEdgeOne/edgeone-pages-skills-traffic",
  MODE = "weekly",
} = process.env;

if (!GH_TOKEN) {
  console.error("GH_TOKEN is required");
  process.exit(1);
}

const API = "https://api.github.com";
const HEADERS = {
  Authorization: `Bearer ${GH_TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "traffic-archive-script",
};

// ---------------------------------------------------------------------------
// Helpers

async function apiGet(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText}\n${body}`);
  }
  return res.json();
}

// GitHub returns timestamps like "2026-04-15T00:00:00Z".
// Convert to a calendar date string YYYY-MM-DD (UTC).
function toUtcDate(iso) {
  return iso.slice(0, 10);
}

// Compute last Mon-Sun window in Beijing time (UTC+8), return array of
// YYYY-MM-DD strings representing those days in UTC (because that's how the
// Traffic API buckets data).
//
// Trade-off: clones/views are bucketed per UTC day by GitHub. We can't perfectly
// re-bucket into Beijing days without losing data, so we take the 7 UTC days
// that a Beijing-time user would call "last week".
function lastWeekDates() {
  const now = new Date();
  const bjNow = new Date(now.getTime() + 8 * 3600 * 1000);
  const dow = bjNow.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat  (in BJ time)
  const daysSinceThisMon = dow === 0 ? 6 : dow - 1;
  const daysToLastMon = daysSinceThisMon + 7;
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(bjNow);
    d.setUTCDate(bjNow.getUTCDate() - daysToLastMon + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function toCsvRow({ date, count, uniques }) {
  return `${date},${count},${uniques}`;
}

async function readCsv(file) {
  try {
    const text = await fs.readFile(file, "utf8");
    const lines = text.split("\n").filter(Boolean);
    const header = lines[0];
    const rows = lines.slice(1);
    const dates = new Set(rows.map((l) => l.split(",")[0]));
    return { header, rows, dates };
  } catch (e) {
    if (e.code === "ENOENT") {
      return { header: "date,count,uniques", rows: [], dates: new Set() };
    }
    throw e;
  }
}

async function writeCsv(file, header, rows) {
  const sorted = [...rows].sort(); // lexicographic == chronological for ISO dates
  await fs.writeFile(file, header + "\n" + sorted.join("\n") + "\n");
}

function git(args, opts = {}) {
  return execFileSync("git", args, { stdio: "inherit", ...opts });
}

// ---------------------------------------------------------------------------
// Main

async function main() {
  console.log(`Mode: ${MODE}`);
  console.log(`Source: ${SOURCE_REPO}`);
  console.log(`Target: ${TARGET_REPO}`);

  // 1. Fetch traffic data
  const clones = await apiGet(`${API}/repos/${SOURCE_REPO}/traffic/clones`);
  const views = await apiGet(`${API}/repos/${SOURCE_REPO}/traffic/views`);
  console.log(`API returned ${clones.clones.length} clone days, ${views.views.length} view days`);

  // 2. Determine which dates to keep
  let keepDates;
  if (MODE === "backfill") {
    keepDates = null;
  } else {
    keepDates = new Set(lastWeekDates());
    console.log(`Weekly window: ${[...keepDates].sort().join(", ")}`);
  }

  const filterFn = (entry) => {
    const date = toUtcDate(entry.timestamp);
    return keepDates === null || keepDates.has(date);
  };

  const cloneRows = clones.clones.filter(filterFn).map((e) => ({
    date: toUtcDate(e.timestamp),
    count: e.count,
    uniques: e.uniques,
  }));
  const viewRows = views.views.filter(filterFn).map((e) => ({
    date: toUtcDate(e.timestamp),
    count: e.count,
    uniques: e.uniques,
  }));

  console.log(`Candidate rows: ${cloneRows.length} clones, ${viewRows.length} views`);

  // 3. Clone target repo to a temp dir
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "traffic-"));
  const repoUrl = `https://x-access-token:${GH_TOKEN}@github.com/${TARGET_REPO}.git`;
  git(["clone", "--depth", "1", repoUrl, workDir]);

  const gitInDir = (args) => git(["-C", workDir, ...args]);

  gitInDir(["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
  gitInDir(["config", "user.name", "github-actions[bot]"]);

  // 4. Merge into CSVs
  const clonesPath = path.join(workDir, "clones.csv");
  const viewsPath = path.join(workDir, "views.csv");

  const clonesCsv = await readCsv(clonesPath);
  const viewsCsv = await readCsv(viewsPath);

  let clonesAdded = 0;
  for (const r of cloneRows) {
    if (!clonesCsv.dates.has(r.date)) {
      clonesCsv.rows.push(toCsvRow(r));
      clonesCsv.dates.add(r.date);
      clonesAdded++;
    }
  }

  let viewsAdded = 0;
  for (const r of viewRows) {
    if (!viewsCsv.dates.has(r.date)) {
      viewsCsv.rows.push(toCsvRow(r));
      viewsCsv.dates.add(r.date);
      viewsAdded++;
    }
  }

  console.log(`New rows: ${clonesAdded} clones, ${viewsAdded} views`);

  if (clonesAdded === 0 && viewsAdded === 0) {
    console.log("Nothing new to append. Exiting clean.");
    return;
  }

  await writeCsv(clonesPath, clonesCsv.header, clonesCsv.rows);
  await writeCsv(viewsPath, viewsCsv.header, viewsCsv.rows);

  // 5. Commit & push
  gitInDir(["add", "clones.csv", "views.csv"]);
  const msg = `archive: +${clonesAdded} clones, +${viewsAdded} views (${MODE})`;
  gitInDir(["commit", "-m", msg]);
  gitInDir(["push", "origin", "main"]);

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
