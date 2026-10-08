export function boundedNumber(value, fallback, min, max) {
  const number = value === "" || value == null ? NaN : Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export function projectRows(rows, projects) {
  if (rows?.length) {
    return rows.map((row) => ({ ...row, project: projects.find((p) => p.slug === row.projectSlug) }))
      .filter((row) => row.project);
  }
  const widths = [40, 66, 66, 40, 100];
  return projects.filter((p) => p.featured).sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0))
    .map((project, index) => ({ project, width: widths[index % 5],
      alignment: index % 2 ? "right" : "left", imageRatio: index % 5 === 3 ? "portrait" : "landscape",
      glyphEnabled: index % 5 === 0 || index % 5 === 2,
      glyphPosition: index % 5 === 0 ? "top-left" : "top-right" }));
}
