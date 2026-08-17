// Fetches the editable UI strings from WordPress (Site Settings → UI Strings)
// and writes them to src/lib/i18n.overrides.json, which i18n.js reads at build
// time. Single language (NL), so the file is a flat key → text map.
//
// Runs automatically before `npm run dev` / `npm run build`. In seed mode, or
// whenever WordPress is unreachable, it falls back to the seed export so the
// site still builds with the right copy.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveWpGraphqlUrl } from "../src/lib/wp-env.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = resolve(root, "src/lib/i18n.overrides.json");
const seedFile = resolve(root, "scripts/seed/data/site.json");

function parseEnvFile(contents) {
  const env = {};
  for (const line of contents.split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, "").trim();
  }
  return env;
}

function readEnv() {
  let fromFile = {};
  try {
    fromFile = parseEnvFile(readFileSync(resolve(root, ".env"), "utf8"));
  } catch {
    // no .env — fall through to process.env only
  }
  const fromProcess = Object.fromEntries(
    Object.entries({
      PUBLIC_WP_SOURCE: process.env.PUBLIC_WP_SOURCE,
      PUBLIC_WP_GRAPHQL_URL_LOCAL: process.env.PUBLIC_WP_GRAPHQL_URL_LOCAL,
      PUBLIC_WP_GRAPHQL_URL_FLYWHEEL: process.env.PUBLIC_WP_GRAPHQL_URL_FLYWHEEL,
      USE_SEED_DATA: process.env.USE_SEED_DATA,
    }).filter(([, v]) => v != null && v !== ""),
  );
  return { ...fromFile, ...fromProcess };
}

function write(strings, source) {
  const keys = Object.keys(strings).length;
  if (!keys) {
    console.warn("[ui-strings] nothing to write — keeping existing overrides.");
    return;
  }
  writeFileSync(outFile, JSON.stringify(strings, null, 2) + "\n");
  console.log(
    `[ui-strings] wrote ${keys} strings to src/lib/i18n.overrides.json (from ${source})`,
  );
}

function fromSeed() {
  const site = JSON.parse(readFileSync(seedFile, "utf8"));
  const rows = site.uiStrings?.ui_strings ?? [];
  return Object.fromEntries(
    rows.filter((r) => r?.string_key && r.text).map((r) => [r.string_key, r.text]),
  );
}

const env = readEnv();

if (String(env.USE_SEED_DATA ?? "") === "1") {
  write(fromSeed(), "seed data");
  process.exit(0);
}

const endpoint = resolveWpGraphqlUrl(env);
if (!endpoint) {
  console.warn("[ui-strings] WP GraphQL URL not set — falling back to seed data.");
  write(fromSeed(), "seed data");
  process.exit(0);
}

const QUERY = /* GraphQL */ `
  query GetUiStrings {
    siteSettings {
      uiStrings {
        uiStrings {
          stringKey
          text
        }
      }
    }
  }
`;

try {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join("; "));

  const rows = json.data?.siteSettings?.uiStrings?.uiStrings ?? [];
  const strings = Object.fromEntries(
    rows.filter((r) => r?.stringKey && r.text).map((r) => [r.stringKey, r.text]),
  );
  if (!Object.keys(strings).length) throw new Error("no UI strings returned");

  write(strings, endpoint);
} catch (err) {
  console.warn(
    `[ui-strings] fetch failed (${err.message}) — falling back to seed data.`,
  );
  write(fromSeed(), "seed data");
}
