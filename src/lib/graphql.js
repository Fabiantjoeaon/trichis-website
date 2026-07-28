import { resolveWpGraphqlUrl } from "./wp-env.js";

const endpoint = resolveWpGraphqlUrl(import.meta.env);

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// WPGraphQL surfaces PHP exceptions/timeouts as a generic "Internal server
// error" message. During static builds these are usually transient (DB
// connection limits, memory, request bursts), so they're worth retrying.
function isTransientGraphqlError(messages) {
  return /internal server error|timeout|timed out|try again|temporarily/i.test(
    messages,
  );
}

async function runQuery(query, variables) {
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
  } catch (err) {
    const error = new Error(
      `[WPGraphQL] Could not connect to WPGraphQL at ${endpoint} — is WordPress reachable?\n` +
        `Original error: ${err.message}`,
    );
    error.retryable = true;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      `[WPGraphQL] HTTP ${response.status} from ${endpoint}. Check that WPGraphQL is activated on your WordPress site.`,
    );
    error.retryable = response.status >= 500 || response.status === 429;
    throw error;
  }

  const json = await response.json();

  if (json.errors) {
    const messages = json.errors.map((e) => e.message).join("\n");

    // WPGraphQL reports field-level resolver failures (e.g. a corrupt ACF
    // flexible-content block) as errors while still returning the rest of the
    // payload. When usable `data` is present we degrade gracefully: log the
    // error and keep the partial data instead of failing the whole build.
    if (json.data != null) {
      const paths = json.errors
        .map((e) => (e.path ? e.path.join(".") : "?"))
        .join(", ");
      console.warn(
        `[WPGraphQL] partial data returned with field errors (paths: ${paths}):\n${messages}`,
      );
      return json.data;
    }

    const error = new Error(`[WPGraphQL] GraphQL errors:\n${messages}`);
    error.retryable = isTransientGraphqlError(messages);
    throw error;
  }

  return json.data;
}

/**
 * Core GraphQL fetch helper for WPGraphQL.
 *
 * Retries transient WordPress failures (network errors, HTTP 5xx/429, and
 * "Internal server error" GraphQL responses) with exponential backoff so a
 * single flaky request during a static build doesn't abort the whole build.
 */
export async function gqlFetch(query, variables = {}) {
  if (!endpoint) {
    throw new Error(
      "[WPGraphQL] No GraphQL URL resolved. " +
        "Set PUBLIC_WP_SOURCE (local|flywheel) and PUBLIC_WP_GRAPHQL_URL_LOCAL / PUBLIC_WP_GRAPHQL_URL_FLYWHEEL in .env",
    );
  }

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await runQuery(query, variables);
    } catch (err) {
      lastError = err;
      if (!err.retryable || attempt === MAX_RETRIES) break;
      const delay = BASE_DELAY_MS * 2 ** attempt;
      console.warn(
        `[WPGraphQL] transient error (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms:\n${err.message}`,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}
