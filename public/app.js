const GROUPS = {
  A: ["Mexico", "South Korea", "Czechia", "South Africa"],
  B: ["Switzerland", "Canada", "Bosnia-Herzegovina", "Qatar"],
  C: ["Brazil", "Morocco", "Scotland", "Haiti"],
  D: ["United States", "Türkiye", "Australia", "Paraguay"],
  E: ["Germany", "Ecuador", "Ivory Coast", "Curaçao"],
  F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
  G: ["Belgium", "Egypt", "Iran", "New Zealand"],
  H: ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"],
  I: ["France", "Norway", "Senegal", "Iraq"],
  J: ["Argentina", "Austria", "Algeria", "Jordan"],
  K: ["Portugal", "Colombia", "Congo DR", "Uzbekistan"],
  L: ["England", "Croatia", "Panama", "Ghana"]
};

const PICKS = {
  Derek: {
    A: ["Mexico", "South Korea", "Czechia", "South Africa"],
    B: ["Switzerland", "Canada", "Bosnia-Herzegovina", "Qatar"],
    C: ["Brazil", "Morocco", "Scotland", "Haiti"],
    D: ["United States", "Türkiye", "Australia", "Paraguay"],
    E: ["Germany", "Ecuador", "Ivory Coast", "Curaçao"],
    F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
    G: ["Belgium", "Egypt", "Iran", "New Zealand"],
    H: ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"],
    I: ["France", "Norway", "Senegal", "Iraq"],
    J: ["Argentina", "Austria", "Algeria", "Jordan"],
    K: ["Portugal", "Colombia", "Congo DR", "Uzbekistan"],
    L: ["England", "Croatia", "Panama", "Ghana"],
    thirds: ["Senegal", "Iran", "Sweden", "Ivory Coast", "Australia", "Scotland", "Algeria", "Czechia"]
  },
  Alayna: {
    A: ["Mexico", "Czechia", "South Korea", "South Africa"],
    B: ["Switzerland", "Canada", "Bosnia-Herzegovina", "Qatar"],
    C: ["Brazil", "Morocco", "Scotland", "Haiti"],
    D: ["Paraguay", "United States", "Türkiye", "Australia"],
    E: ["Germany", "Ecuador", "Ivory Coast", "Curaçao"],
    F: ["Netherlands", "Sweden", "Japan", "Tunisia"],
    G: ["Belgium", "Iran", "Egypt", "New Zealand"],
    H: ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"],
    I: ["France", "Norway", "Senegal", "Iraq"],
    J: ["Argentina", "Austria", "Jordan", "Algeria"],
    K: ["Portugal", "Colombia", "Uzbekistan", "Congo DR"],
    L: ["England", "Croatia", "Ghana", "Panama"],
    thirds: ["South Korea", "Japan", "Türkiye", "Senegal", "Algeria", "Scotland", "Uzbekistan", "Ivory Coast"]
  }
};

const BRACKET = [
  { name: "Round of 32", games: [["Germany", "Australia", "Germany"], ["France", "Sweden", "France"], ["South Korea", "Canada", "Canada"], ["Netherlands", "Morocco", "Netherlands"], ["Colombia", "Croatia", "Croatia"], ["Spain", "Austria", "Spain"], ["United States", "Algeria", "United States"], ["Belgium", "Czechia", "Belgium"]] },
  { name: "Round of 16", games: [["Germany", "France", "France"], ["Canada", "Netherlands", "Netherlands"], ["Croatia", "Spain", "Spain"], ["United States", "Belgium", "Belgium"]] },
  { name: "Quarterfinals", games: [["France", "Netherlands", "France"], ["Spain", "Belgium", "Spain"]] },
  { name: "Semifinals", games: [["France", "Spain", "France"], ["England", "Portugal", "England"]] },
  { name: "Final", games: [["France", "England", "France"]] }
];

const FLAGS = {
  Mexico: "🇲🇽", "South Korea": "🇰🇷", Czechia: "🇨🇿", "South Africa": "🇿🇦", Switzerland: "🇨🇭", Canada: "🇨🇦",
  "Bosnia-Herzegovina": "🇧🇦", Qatar: "🇶🇦", Brazil: "🇧🇷", Morocco: "🇲🇦", Scotland: "🏴", Haiti: "🇭🇹",
  "United States": "🇺🇸", Türkiye: "🇹🇷", Australia: "🇦🇺", Paraguay: "🇵🇾", Germany: "🇩🇪", Ecuador: "🇪🇨",
  "Ivory Coast": "🇨🇮", Curaçao: "🇨🇼", Netherlands: "🇳🇱", Japan: "🇯🇵", Sweden: "🇸🇪", Tunisia: "🇹🇳",
  Belgium: "🇧🇪", Egypt: "🇪🇬", Iran: "🇮🇷", "New Zealand": "🇳🇿", Spain: "🇪🇸", Uruguay: "🇺🇾",
  "Saudi Arabia": "🇸🇦", "Cape Verde": "🇨🇻", France: "🇫🇷", Norway: "🇳🇴", Senegal: "🇸🇳", Iraq: "🇮🇶",
  Argentina: "🇦🇷", Austria: "🇦🇹", Algeria: "🇩🇿", Jordan: "🇯🇴", Portugal: "🇵🇹", Colombia: "🇨🇴",
  "Congo DR": "🇨🇩", Uzbekistan: "🇺🇿", England: "🏴", Croatia: "🇭🇷", Panama: "🇵🇦", Ghana: "🇬🇭"
};

const fallbackEvents = [
  { id: "760415", date: "2026-06-11T19:00:00Z", round: "group-stage", status: "post", detail: "FT", venue: "Estadio Banorte", city: "Mexico City", home: { name: "Mexico", score: 2, winner: true }, away: { name: "South Africa", score: 0 } },
  { id: "760414", date: "2026-06-12T02:00:00Z", round: "group-stage", status: "pre", detail: "Scheduled", venue: "Estadio Akron", city: "Guadalajara", home: { name: "South Korea", score: 0 }, away: { name: "Czechia", score: 0 } }
];

const state = {
  events: fallbackEvents,
  standings: [],
  statusFilter: "all",
  filters: { player: "All players", group: "all", team: "all", round: "all", matchday: "all" },
  source: "Audited snapshot"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const groupLetters = Object.keys(GROUPS);
const clean = (name) => name?.replace("Bosnia and Herzegovina", "Bosnia-Herzegovina").replace("Côte D'Ivoire", "Ivory Coast") || "";

function officialGroups() {
  const mapped = {};
  state.standings.forEach((group) => {
    const letter = group.name?.match(/([A-L])$/)?.[1];
    if (letter) mapped[letter] = group.teams;
  });
  if (!Object.keys(mapped).length) {
    for (const [letter, teams] of Object.entries(GROUPS)) {
      mapped[letter] = teams.map((name, index) => ({
        rank: index + 1, name, played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0
      }));
    }
    mapped.A = [
      { rank: 1, name: "Mexico", played: 1, wins: 1, draws: 0, losses: 0, goalDifference: 2, points: 3 },
      { rank: 2, name: "South Korea", played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0 },
      { rank: 3, name: "Czechia", played: 0, wins: 0, draws: 0, losses: 0, goalDifference: 0, points: 0 },
      { rank: 4, name: "South Africa", played: 1, wins: 0, draws: 0, losses: 1, goalDifference: -2, points: 0 }
    ];
  }
  return mapped;
}

function calculateScores() {
  const tables = officialGroups();
  const scores = {};
  for (const player of Object.keys(PICKS)) {
    const byGroup = {};
    for (const letter of groupLetters) {
      const actual = [...(tables[letter] || [])].sort((a, b) => a.rank - b.rank);
      const isStarted = actual.some((team) => team.played > 0);
      const values = [8, 6, 4, 2];
      let points = 0;
      if (isStarted) {
        PICKS[player][letter].forEach((team, index) => {
          if (clean(actual[index]?.name) === clean(team)) points += values[index];
        });
        if (points === 20) points += 10;
      }
      byGroup[letter] = points;
    }
    const groupPoints = Object.values(byGroup).reduce((sum, points) => sum + points, 0);
    scores[player] = { byGroup, groupPoints, thirdPoints: 0, total: groupPoints };
  }
  return scores;
}

function flag(name) { return FLAGS[clean(name)] || "⚽"; }
function logo(team) {
  return team?.logo ? `<img src="${team.logo}" alt="" loading="lazy">` : `<span>${flag(team?.name)}</span>`;
}
function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(date));
}
function isMatchVisible(match) {
  const { team, round, matchday } = state.filters;
  return (team === "all" || [match.home?.name, match.away?.name].map(clean).includes(team))
    && (round === "all" || match.round === round)
    && (matchday === "all" || match.date?.slice(0, 10) === matchday)
    && (state.statusFilter === "all" || match.status === state.statusFilter || (state.statusFilter === "live" && match.status === "in"));
}

function renderScores() {
  const scores = calculateScores();
  const selected = state.filters.player;
  const leaders = Object.entries(scores)
    .filter(([name]) => selected === "All players" || selected === name)
    .sort((a, b) => b[1].total - a[1].total);
  const high = leaders[0][1].total;
  $("#scoreGrid").innerHTML = leaders.map(([name, value], index) => `
    <article class="score-card ${value.total === high ? "leader" : ""}" data-initial="${name[0]}">
      <span class="rank">#${index + 1} ${value.total === high ? "CURRENT LEADER" : "CHASING"}</span>
      <h3>${name}</h3>
      <div class="big-score">${value.total}<small>PTS</small></div>
      <div class="card-foot"><span>${value.groupPoints} group · ${value.thirdPoints} qualifier</span><span class="delta">${384 - value.total} available</span></div>
    </article>`).join("") + (selected === "All players" ? `
    <article class="score-card race-card">
      <span class="versus">Live margin</span><strong>${Math.abs(scores.Derek.total - scores.Alayna.total)} pts</strong>
      <span class="versus">${scores.Derek.total === scores.Alayna.total ? "Dead even" : `${leaders[0][0]} in front`}</span>
    </article>` : "");
}

function renderMatches() {
  const matches = state.events.filter(isMatchVisible).sort((a, b) => new Date(a.date) - new Date(b.date));
  const card = (match, compact = false) => {
    const live = match.status === "in";
    const score = match.status === "pre" ? "vs" : `${match.home.score}–${match.away.score}`;
    if (compact) return `
      <div class="match-row">
        <div class="match-time"><b class="${live ? "live-tag" : ""}">${live ? `LIVE ${match.clock || ""}` : match.detail || "MATCH"}</b>${formatDate(match.date)}</div>
        <div class="fixture-teams">
          <div class="fixture-team">${logo(match.home)} ${match.home.name}</div>
          <div class="fixture-team">${logo(match.away)} ${match.away.name}</div>
        </div>
        <div class="fixture-score">${score}</div>
      </div>`;
    return `
      <article class="match-card">
        <div class="match-meta"><span>${formatDate(match.date)}</span><span class="${live ? "live-tag" : ""}">${live ? `LIVE ${match.clock || ""}` : match.detail || "Scheduled"}</span></div>
        <div class="fixture-team">${logo(match.home)} ${match.home.name}<strong>${match.status === "pre" ? "–" : match.home.score}</strong></div>
        <div class="fixture-team">${logo(match.away)} ${match.away.name}<strong>${match.status === "pre" ? "–" : match.away.score}</strong></div>
        <div class="venue">${match.venue || "Venue TBA"}${match.city ? ` · ${match.city}` : ""}</div>
      </article>`;
  };
  $("#featuredMatches").innerHTML = matches.slice(0, 4).map((match) => card(match, true)).join("") || `<div class="empty-state">No matches match these filters.</div>`;
  $("#allMatches").innerHTML = matches.map((match) => card(match)).join("") || `<div class="empty-state">No matches match these filters.</div>`;
}

function renderGroupBars() {
  const scores = calculateScores();
  $("#groupBars").innerHTML = groupLetters.map((letter) => {
    const derek = scores.Derek.byGroup[letter];
    const alayna = scores.Alayna.byGroup[letter];
    return `<div class="bar-row"><b>${letter}</b><div class="bar-track"><i class="bar-derek" style="width:${derek / 60 * 100}%"></i><i class="bar-alayna" style="width:${alayna / 60 * 100}%"></i></div><span class="bar-value">${derek}/${alayna}</span></div>`;
  }).join("");
}

function renderAgreement() {
  let same = 0;
  $("#agreementMap").innerHTML = groupLetters.map((letter) => {
    const matches = PICKS.Derek[letter].filter((team, index) => team === PICKS.Alayna[letter][index]).length;
    same += matches;
    return `<div class="agreement-cell ${matches === 4 ? "high" : matches >= 2 ? "mid" : "low"}" title="Group ${letter}: ${matches}/4 identical">${letter}</div>`;
  }).join("");
  $("#agreementRate").textContent = `${Math.round(same / 48 * 100)}% exact overlap`;
}

function renderOutlook() {
  const scores = calculateScores();
  $("#pointsOutlook").innerHTML = ["Derek", "Alayna"].map((name) => `
    <div class="outlook-row"><b>${name}</b><div class="outlook-track"><div class="outlook-earned" style="width:${scores[name].total / 384 * 100}%"></div></div><span class="outlook-value">${scores[name].total} / 384</span></div>
  `).join("");
}

function renderGroups() {
  const tables = officialGroups();
  const selectedGroup = state.filters.group;
  $("#groupCards").innerHTML = groupLetters.filter((letter) => selectedGroup === "all" || selectedGroup === letter).map((letter) => {
    const teams = [...tables[letter]].sort((a, b) => a.rank - b.rank);
    const scores = calculateScores();
    const showDerek = state.filters.player !== "Alayna";
    const showAlayna = state.filters.player !== "Derek";
    return `<article class="group-card">
      <div class="group-card-head"><h3>Group ${letter}</h3><div class="group-total"><span>D ${scores.Derek.byGroup[letter]}</span><span>A ${scores.Alayna.byGroup[letter]}</span></div></div>
      <table class="group-table"><thead><tr><th>#</th><th>Team</th><th>PL</th><th>GD</th><th>PTS</th>${showDerek ? "<th>D</th>" : ""}${showAlayna ? "<th>A</th>" : ""}</tr></thead><tbody>
      ${teams.map((team) => {
        const name = clean(team.name);
        const d = PICKS.Derek[letter].indexOf(name) + 1;
        const a = PICKS.Alayna[letter].indexOf(name) + 1;
        return `<tr><td>${team.rank}</td><td><span class="team-cell">${logo(team)} ${name}</span></td><td>${team.played}</td><td>${team.goalDifference > 0 ? "+" : ""}${team.goalDifference}</td><td><b>${team.points}</b></td>${showDerek ? `<td><span class="pick-rank ${team.played && d === team.rank ? "correct" : ""}">${d}</span></td>` : ""}${showAlayna ? `<td><span class="pick-rank ${team.played && a === team.rank ? "correct" : ""}">${a}</span></td>` : ""}</tr>`;
      }).join("")}</tbody></table>
    </article>`;
  }).join("");
}

function renderBracket() {
  $("#bracketBoard").innerHTML = BRACKET.map((round) => `
    <section class="bracket-round"><h3>${round.name}</h3>${round.games.map(([a, b, winner]) => `
      <div class="bracket-match"><div class="bracket-team ${winner === a ? "winner" : ""}"><span>${flag(a)} ${a}</span>${winner === a ? "<b>✓</b>" : ""}</div><div class="bracket-team ${winner === b ? "winner" : ""}"><span>${flag(b)} ${b}</span>${winner === b ? "<b>✓</b>" : ""}</div></div>
    `).join("")}</section>`).join("");
}

function renderAccuracy() {
  const tables = officialGroups();
  const started = Object.values(tables).flat().filter((team) => team.played > 0).length;
  const scores = calculateScores();
  const agreements = groupLetters.reduce((sum, letter) => sum + PICKS.Derek[letter].filter((team, i) => team === PICKS.Alayna[letter][i]).length, 0);
  $("#accuracyCards").innerHTML = `
    <article class="accuracy-card"><span>Positions resolved</span><strong>${started}<small>/48</small></strong><p>Correct markers become meaningful as official group tables settle.</p></article>
    <article class="accuracy-card"><span>Derek group points</span><strong>${scores.Derek.groupPoints}</strong><p>Exact positions plus any earned perfect-group bonuses.</p></article>
    <article class="accuracy-card"><span>Shared exact picks</span><strong>${agreements}</strong><p>${Math.round(agreements / 48 * 100)}% of group finishing positions are identical between players.</p></article>`;
}

function render() {
  renderScores();
  renderMatches();
  renderGroupBars();
  renderAgreement();
  renderOutlook();
  renderGroups();
  renderBracket();
  renderAccuracy();
}

function setView(view) {
  $$(".view").forEach((section) => section.classList.toggle("active", section.id === view));
  $$("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("show"), 2600);
}

async function refresh() {
  $("#refreshButton").disabled = true;
  $("#syncLabel").textContent = "Refreshing";
  try {
    const [liveResponse, sheetResponse] = await Promise.all([fetch("/api/live"), fetch("/api/sheet")]);
    if (!liveResponse.ok) throw new Error("Live feed unavailable");
    const data = await liveResponse.json();
    const sheet = sheetResponse.ok ? await sheetResponse.json() : null;
    if (sheet?.picks) {
      for (const player of ["Derek", "Alayna"]) Object.assign(PICKS[player], sheet.picks[player]);
    }
    if (data.scores?.events?.length) state.events = data.scores.events;
    if (data.standings?.length) state.standings = data.standings;
    state.source = `${data.scores ? "Live ESPN" : "Score snapshot"} · ${sheet?.connected ? "Live Google Sheet" : "Fantasy snapshot"}`;
    $("#syncLabel").textContent = data.errors?.length ? "Live with fallback" : "Live data connected";
    $(".sync-pill").classList.toggle("live", Boolean(data.scores));
    $("#updatedAt").textContent = `Updated ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date())} · ${state.source}`;
    toast(data.errors?.length ? "Some live feeds used the cached snapshot." : "Scores and standings refreshed.");
    updateMatchdayOptions();
    render();
  } catch {
    $("#syncLabel").textContent = "Snapshot mode";
    toast("Live feed unavailable. Showing the audited snapshot.");
  } finally {
    $("#refreshButton").disabled = false;
  }
}

function setupFilters() {
  $("#groupFilter").insertAdjacentHTML("beforeend", groupLetters.map((letter) => `<option value="${letter}">Group ${letter}</option>`).join(""));
  const teams = Object.values(GROUPS).flat().sort();
  $("#teamFilter").insertAdjacentHTML("beforeend", teams.map((team) => `<option value="${team}">${flag(team)} ${team}</option>`).join(""));
  const ids = { playerFilter: "player", groupFilter: "group", teamFilter: "team", roundFilter: "round", matchdayFilter: "matchday" };
  Object.entries(ids).forEach(([id, key]) => $(`#${id}`).addEventListener("change", (event) => {
    state.filters[key] = event.target.value;
    render();
  }));
  $("#clearFilters").addEventListener("click", () => {
    state.filters = { player: "All players", group: "all", team: "all", round: "all", matchday: "all" };
    Object.keys(ids).forEach((id) => $(`#${id}`).selectedIndex = 0);
    render();
  });
}

function updateMatchdayOptions() {
  const select = $("#matchdayFilter");
  const current = state.filters.matchday;
  const days = [...new Set(state.events.map((match) => match.date?.slice(0, 10)).filter(Boolean))].sort();
  select.innerHTML = `<option value="all">All matchdays</option>${days.map((day) => {
    const label = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${day}T12:00:00`));
    return `<option value="${day}">${label}</option>`;
  }).join("")}`;
  if (days.includes(current)) select.value = current;
}

$$("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
$$("[data-jump]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.jump)));
$("#refreshButton").addEventListener("click", refresh);
$("#scheduleTabs").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  $$("#scheduleTabs button").forEach((item) => item.classList.toggle("active", item === button));
  state.statusFilter = button.dataset.status;
  renderMatches();
});

setupFilters();
updateMatchdayOptions();
render();
refresh();
setInterval(refresh, 60_000);
