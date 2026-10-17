export function ShortcutGlyph({ style, size }) {
  const multi = style.icons.length > 1;
  return (
    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
      {style.icons.map((I, i) => (
        <I key={i} size={multi ? Math.round(size * 0.62) : size} color={style.fg} strokeWidth={1.7} fill={style.fg} fillOpacity={0.3} />
      ))}
    </span>
  );
}
