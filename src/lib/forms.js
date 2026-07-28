import { resolveWpGraphqlUrl } from "./wp-env.js";

const useSeed =
  String(import.meta.env.USE_SEED_DATA ?? "") === "1" ||
  String(import.meta.env.PUBLIC_USE_SEED_DATA ?? "") === "1";

export function resolveFormsBaseUrl(env = import.meta.env) {
  if (env.PUBLIC_WP_FORMS_ENDPOINT) {
    return String(env.PUBLIC_WP_FORMS_ENDPOINT).replace(/\/$/, "");
  }
  const graphql = resolveWpGraphqlUrl(env);
  if (!graphql) return null;
  try {
    const u = new URL(graphql);
    return `${u.origin}/wp-json/trichis/v1/forms`;
  } catch {
    return null;
  }
}

export function formEndpoint(formKey) {
  const base = resolveFormsBaseUrl();
  if (!base) return null;
  const key = String(formKey || "contact").replace(/^form_/, "");
  return `${base}/${key}`;
}

/**
 * POST JSON to WP Advanced Forms REST adapter.
 * On seed builds / missing endpoint / network failure: returns { ok: true, mocked: true }.
 */
export async function submitForm(formKey, values) {
  const endpoint = formEndpoint(formKey);

  if (!endpoint || useSeed) {
    await new Promise((r) => setTimeout(r, 400));
    return { ok: true, mocked: true };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      let payload = null;
      try {
        payload = await res.json();
      } catch {}
      return {
        ok: false,
        status: res.status,
        errors: payload?.errors,
        mocked: false,
      };
    }

    const data = await res.json();
    return { ok: true, ...data, mocked: false };
  } catch {
    return { ok: true, mocked: true };
  }
}
