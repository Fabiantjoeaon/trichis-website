/**
 * Resolve which WordPress GraphQL endpoint to use.
 *
 * PUBLIC_WP_SOURCE:
 *   - local    → Local / Flywheel Local site (default)
 *   - flywheel → staging / prod CMS on Flywheel
 */
export function resolveWpGraphqlUrl(env = {}) {
  const source = String(env.PUBLIC_WP_SOURCE || "local")
    .trim()
    .toLowerCase();
  const useFlywheel = ["flywheel", "remote", "staging", "prod", "production"].includes(
    source,
  );

  if (useFlywheel) {
    return env.PUBLIC_WP_GRAPHQL_URL_FLYWHEEL || env.PUBLIC_WP_GRAPHQL_URL || null;
  }

  return env.PUBLIC_WP_GRAPHQL_URL_LOCAL || env.PUBLIC_WP_GRAPHQL_URL || null;
}

/** Origin of the active WordPress host, e.g. https://trichis.flywheelsites.com */
export function resolveWpOrigin(env = {}) {
  const graphql = resolveWpGraphqlUrl(env);
  if (!graphql) return null;
  try {
    return new URL(graphql).origin;
  } catch {
    return null;
  }
}
