/** Empty, positioned slot until the final yellow artwork is supplied in the CMS. */
export default function HomeGlyph({ media, className = "", style }) {
  return (
    <span className={`home-glyph ${className}`} style={style} aria-hidden="true">
      {media?.url && <img src={media.url} alt="" loading="lazy" />}
    </span>
  );
}
