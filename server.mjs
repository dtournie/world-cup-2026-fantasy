import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";
const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1LhbVIdnhiDgDmlxpWj6BQ4BHdrUFaB9KSBol76p_YCU";
const cache = new Map();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

async function cachedJson(key, url, ttl = 45_000) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < ttl) return hit.value;
  const response = await fetch(url, { headers: { "user-agent": "WorldCupFantasyDashboard/1.0" } });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  const value = await response.json();
  cache.set(key, { time: Date.now(), value });
  return value;
}

async function cachedText(key, url, ttl = 60_000) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < ttl) return hit.value;
  const response = await fetch(url, { headers: { "user-agent": "WorldCupFantasyDashboard/1.0" } });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  const value = await response.text();
  cache.set(key, { time: Date.now(), value });
  return value;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function stripFlag(value = "") {
  return value.replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

function parseGroupPicks(mainCsv, qualifiersCsv) {
  const rows = parseCsv(mainCsv);
  const picks = {};
  const blocks = [
    { letters: ["A", "B", "C", "D"], start: 1 },
    { letters: ["E", "F", "G", "H"], start: 7 },
    { letters: ["I", "J", "K", "L"], start: 13 }
  ];
  for (const block of blocks) {
    block.letters.forEach((letter, groupIndex) => {
      const column = 1 + groupIndex * 4;
      picks[letter] = rows.slice(block.start, block.start + 4).map((row) => stripFlag(row[column]));
    });
  }
  picks.thirds = parseCsv(qualifiersCsv).map((row) => stripFlag(row[1])).filter(Boolean);
  return picks;
}

function parseGroupStandings(rows = []) {
  const groups = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] || [];
    const groupMatch = String(row[0] || "").match(/^Group\s+([A-L])$/i);
    if (!groupMatch) continue;
    const letter = groupMatch[1].toUpperCase();
    const teams = rows.slice(rowIndex + 1, rowIndex + 5).map((teamRow, index) => {
      const rawName = teamRow?.[9] || String(teamRow?.[0] || "").replace(/^\d[A-Z]{3}/, "");
      const goalsFor = Number(teamRow?.[5] || 0);
      const goalsAgainst = Number(teamRow?.[6] || 0);
      const parsedGoalDifference = Number(String(teamRow?.[7] || "").replace("+", ""));
      return {
        rank: Number(String(teamRow?.[0] || "").match(/^\d+/)?.[0]) || index + 1,
        name: stripFlag(rawName),
        played: Number(teamRow?.[1] || 0),
        wins: Number(teamRow?.[2] || 0),
        draws: Number(teamRow?.[3] || 0),
        losses: Number(teamRow?.[4] || 0),
        goalsFor,
        goalsAgainst,
        goalDifference: Number.isFinite(parsedGoalDifference) && teamRow?.[7] !== ""
          ? parsedGoalDifference
          : goalsFor - goalsAgainst,
        points: Number(teamRow?.[8] || 0)
      };
    }).filter((team) => team.name);
    if (teams.length === 4) groups.push({ name: `Group ${letter}`, teams });
  }
  return groups;
}

function parseGroupValues(rows = []) {
  const picks = {};
  const blocks = [
    { letters: ["A", "B", "C", "D"], start: 2 },
    { letters: ["E", "F", "G", "H"], start: 9 },
    { letters: ["I", "J", "K", "L"], start: 16 }
  ];
  for (const block of blocks) {
    block.letters.forEach((letter, groupIndex) => {
      const column = 1 + groupIndex * 4;
      picks[letter] = rows.slice(block.start, block.start + 4).map((row) => stripFlag(row?.[column]));
    });
  }
  picks.thirds = rows.slice(21, 29).map((row) => stripFlag(row?.[2])).filter(Boolean);
  return picks;
}

function json(res, status, value) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(value));
}

function simplifyScoreboard(data) {
  return {
    updatedAt: new Date().toISOString(),
    source: "ESPN",
    league: data.leagues?.[0]?.name || "FIFA World Cup",
    events: (data.events || []).map((event) => {
      const competition = event.competitions?.[0] || {};
      const teams = competition.competitors || [];
      const home = teams.find((team) => team.homeAway === "home") || teams[0] || {};
      const away = teams.find((team) => team.homeAway === "away") || teams[1] || {};
      const shapeTeam = (entry) => ({
        id: entry.id,
        name: entry.team?.displayName,
        abbreviation: entry.team?.abbreviation,
        logo: entry.team?.logo,
        color: entry.team?.color,
        score: Number(entry.score || 0),
        winner: Boolean(entry.winner)
      });
      return {
        id: event.id,
        date: event.date,
        name: event.name,
        round: event.season?.slug || "group-stage",
        status: event.status?.type?.state || "pre",
        detail: event.status?.type?.shortDetail || event.status?.type?.detail,
        clock: event.status?.displayClock,
        venue: competition.venue?.fullName || event.venue?.displayName,
        city: competition.venue?.address?.city,
        broadcasts: competition.broadcasts?.flatMap((item) => item.names || []) || [],
        home: shapeTeam(home),
        away: shapeTeam(away)
      };
    })
  };
}

function simplifyStandings(data) {
  const groups = data.children || data.standings?.entries ? [data] : [];
  const sourceGroups = data.children?.length ? data.children : groups;
  return sourceGroups.map((group, groupIndex) => ({
    name: group.name || group.abbreviation || `Group ${String.fromCharCode(65 + groupIndex)}`,
    teams: (group.standings?.entries || []).map((entry, index) => {
      const stat = (name) => entry.stats?.find((item) => item.name === name)?.value ?? 0;
      return {
        rank: entry.stats?.find((item) => item.name === "rank")?.value || index + 1,
        name: entry.team?.displayName,
        abbreviation: entry.team?.abbreviation,
        logo: entry.team?.logos?.[0]?.href,
        played: stat("gamesPlayed"),
        wins: stat("wins"),
        draws: stat("ties"),
        losses: stat("losses"),
        goalsFor: stat("pointsFor"),
        goalDifference: stat("pointDifferential"),
        points: stat("points")
      };
    })
  }));
}

async function liveData() {
  const dates = "20260611-20260719";
  const [scores, standings] = await Promise.allSettled([
    cachedJson("scores", `${ESPN}/scoreboard?dates=${dates}&limit=200`),
    cachedJson("standings", `${ESPN}/standings`, 120_000)
  ]);
  return {
    scores: scores.status === "fulfilled" ? simplifyScoreboard(scores.value) : null,
    standings: standings.status === "fulfilled" ? simplifyStandings(standings.value) : null,
    errors: [scores, standings]
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason.message)
  };
}

async function sheetStatus() {
  const key = process.env.GOOGLE_SHEETS_API_KEY;
  if (!key) {
    const csvUrl = (sheet, range = "") => {
      const params = new URLSearchParams({ tqx: "out:csv", sheet });
      if (range) params.set("range", range);
      return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?${params}`;
    };
    const [derek, derekThirds, alayna, alaynaThirds, groupTable] = await Promise.all([
      cachedText("sheet-derek", csvUrl("Derek's Group Stage")),
      cachedText("sheet-derek-thirds", csvUrl("Derek's Group Stage", "B22:C30")),
      cachedText("sheet-alayna", csvUrl("Alayna's Group Stage")),
      cachedText("sheet-alayna-thirds", csvUrl("Alayna's Group Stage", "B22:C30")),
      cachedText("sheet-group-table", csvUrl("Group Table", "A1:J60"))
    ]);
    return {
      connected: true,
      mode: "public-csv",
      updatedAt: new Date().toISOString(),
      picks: {
        Derek: parseGroupPicks(derek, derekThirds),
        Alayna: parseGroupPicks(alayna, alaynaThirds)
      },
      standings: parseGroupStandings(parseCsv(groupTable))
    };
  }
  const ranges = [
    "Derek's Group Stage!A1:P30",
    "Alayna's Group Stage!A1:P30",
    "Group Table!A1:J60",
    "Combined Group Tables!A1:U107",
    "Bracket!A1:V40"
  ];
  const params = new URLSearchParams({ key, majorDimension: "ROWS" });
  for (const range of ranges) params.append("ranges", range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchGet?${params}`;
  const data = await cachedJson("sheet", url, 60_000);
  const rangeMap = Object.fromEntries((data.valueRanges || []).map((range) => [range.range, range.values || []]));
  const findRows = (name) => Object.entries(rangeMap).find(([range]) => range.includes(name))?.[1] || [];
  return {
    connected: true,
    mode: "google-sheets-api",
    updatedAt: new Date().toISOString(),
    picks: {
      Derek: parseGroupValues(findRows("Derek")),
      Alayna: parseGroupValues(findRows("Alayna"))
    },
    standings: parseGroupStandings(findRows("Group Table")),
    ranges: rangeMap
  };
}

async function serveStatic(pathname, res) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const safePath = normalize(requested).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = join(publicDir, safePath);
  if (!filePath.startsWith(publicDir)) return json(res, 403, { error: "Forbidden" });
  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      "content-type": contentTypes[extname(filePath)] || "application/octet-stream",
      "cache-control": "no-cache"
    });
    res.end(body);
  } catch {
    json(res, 404, { error: "Not found" });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === "/api/live") return json(res, 200, await liveData());
    if (url.pathname === "/api/sheet") return json(res, 200, await sheetStatus());
    if (url.pathname === "/api/health") {
      return json(res, 200, { ok: true, time: new Date().toISOString(), sheetId: SHEET_ID });
    }
    return serveStatic(url.pathname, res);
  } catch (error) {
    json(res, 502, { error: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`World Cup dashboard running at http://${host}:${port}`);
});
