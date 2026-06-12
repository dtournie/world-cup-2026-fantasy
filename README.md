# World Cup 2026 Fantasy Command Center

A responsive live scores, standings, and fantasy bracket dashboard backed by Derek and Alayna's Google Sheet.

## Architecture

- **UI:** dependency-free responsive HTML/CSS/JavaScript.
- **Server:** a small Node HTTP server that keeps API credentials off the browser.
- **Live tournament data:** ESPN's World Cup JSON endpoints for fixtures, scores, match status, standings, team logos, colors, venues, and broadcasts.
- **Fantasy source:** the public read-only Google Sheet CSV feed, refreshed through `/api/sheet`, with an audited snapshot in `public/app.js` as fallback.
- **Resilience:** the UI keeps an audited local snapshot when a live request fails. Server responses are cached for 45 seconds.

## Run locally

From this workspace, run:

```bash
./start.sh
```

Open `http://localhost:4173`.

The launcher uses Node.js from your normal command path or the Codex desktop bundled runtime. Standard Node deployments can also use `npm start`.

## Share with friends

### Permanent link with Render

1. Put this folder in a GitHub repository.
2. Open [Render](https://dashboard.render.com/) and choose **New → Blueprint**.
3. Connect the repository. Render will detect `render.yaml`.
4. Approve the free web service deployment.
5. Share the generated `https://...onrender.com` URL.

Future pushes to the connected branch deploy automatically. On Render's free plan, the first visit after inactivity may take a short time while the service wakes.

### Temporary link from your computer

With the dashboard running via `./start.sh`, install `cloudflared` and run:

```bash
cloudflared tunnel --url http://127.0.0.1:4173
```

Share the generated `trycloudflare.com` URL. This link only works while both the dashboard and tunnel commands remain running on your computer.

## Environment variables

Copy `.env.example` to your deployment provider's environment settings:

- `PORT`: local/server port. Defaults to `4173`.
- `GOOGLE_SHEET_ID`: defaults to the audited World Cup Tracker sheet.
- `GOOGLE_SHEETS_API_KEY`: optional. Uses the official Sheets API instead of the default public read-only CSV feed.

The live ESPN adapter does not require a key. ESPN's endpoint is unofficial and has no published SLA, so production deployments should retain the included cache and fallback. For a contracted feed, replace the adapter with Sportmonks or API-Football.

## Google Sheet refresh

The source Sheet is currently readable through Google's public read-only CSV endpoint, so no key is required. The server refreshes both players' group picks and third-place selections once per minute.

For a private deployment, enable the **Google Sheets API**, create a restricted key, and set `GOOGLE_SHEETS_API_KEY`. The official API adapter reads:

- `Derek's Group Stage!A1:P30`
- `Alayna's Group Stage!A1:P30`
- `Combined Group Tables!A1:U107`
- `Bracket!A1:V40`

## Audited scoring rules

- Exact group positions: **8 / 6 / 4 / 2** points for 1st through 4th.
- Perfect four-team group: **+10** bonus.
- Correct best third-place qualifier: **3** points each.
- Maximum currently formula-backed score: **384** points.
- Knockout picks exist in the Sheet, but knockout point values are not formula-backed. The UI therefore reports bracket accuracy separately rather than inventing scoring.

## Sheet audit notes

- `Group Table` imports ESPN's standings table using `IMPORTHTML`.
- `Combined Group Tables` contains the score formulas and Derek vs Alayna summaries.
- `Bracket` stores fantasy and actual paths, but contains aliases/typos such as `Austrailia`, `Sweeden`, `Moroco`, `Coroatia`, and `Czchia`.
- Several later `RANK.EQ` formulas reference earlier group rows. The app calculates against normalized official table ranks instead.
- `Sheet2` is an ISO/emoji country lookup.

## Cost and limits

- This implementation has no required paid API or hosting dependency.
- Google Sheets API's standard quota is normally sufficient for a two-player dashboard when requests are cached and batched.
- ESPN can change or rate-limit its unofficial endpoint without notice.
- A paid sports data provider is recommended if this becomes a public or commercial product requiring an SLA.
