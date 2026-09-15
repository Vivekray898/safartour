export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  dark?: boolean;
}) {
  return (
    <div
      className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}
    >
      {eyebrow ? (
        <p
          className={`text-sm font-semibold uppercase tracking-widest ${
            dark ? "text-secondary" : "text-secondary"
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl ${
          dark ? "text-white" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-4 text-base leading-relaxed ${
            dark ? "text-white/70" : "text-muted"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
