import type { ReactNode } from "react";

export function Section({ children, className = "", tone = "white", id }: { children: ReactNode; className?: string; tone?: "white" | "mist" | "dark"; id?: string }) {
  const bg = tone === "mist" ? "bg-mist" : tone === "dark" ? "bg-ink text-white" : "bg-white";
  return (
    <section id={id} className={`${bg} py-16 sm:py-20 lg:py-24 ${className}`}>
      <div className="container">{children}</div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, text, center = false, invert = false, as: Tag = "h2" }: { eyebrow?: string; title: string; text?: string; center?: boolean; invert?: boolean; as?: "h1" | "h2" }) {
  return (
    <div className={`mb-10 max-w-2xl sm:mb-12 ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className={`eyebrow mb-3 ${center ? "justify-center" : ""}`}>{eyebrow}</p>}
      <Tag className={`text-3xl font-extrabold sm:text-4xl ${invert ? "text-white" : "text-ink"}`}>{title}</Tag>
      {text && <p className={`mt-4 text-base leading-relaxed sm:text-lg ${invert ? "text-white/75" : "text-ink-500"}`}>{text}</p>}
    </div>
  );
}
