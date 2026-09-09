import Link from "next/link";

export function FeaturePlaceholder({
  title,
  description,
}: Readonly<{
  title: string;
  description: string;
}>) {
  return (
    <div className="foundation-shell">
      <section className="foundation-hero" aria-labelledby="placeholder-title">
        <p className="eyebrow">Uribap · foundation</p>
        <h1 id="placeholder-title">{title}</h1>
        <p className="lede">{description}</p>
        <Link className="status status-ready" href="/">
          Volver al resumen
        </Link>
      </section>
    </div>
  );
}
