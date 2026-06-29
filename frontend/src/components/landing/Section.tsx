import React from "react";

type Tone = "dark" | "light";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** dark = ink gradient, light = surface. */
  tone?: Tone;
  /** Soft pad-x override for tight sections. */
  padX?: "tight" | "normal" | "wide";
  /** Renders curved top edge for visual flow between sections. */
  curve?: boolean;
  /** Optional background class override. */
  bgClass?: string;
  /** Section id for in-page anchors. */
  id?: string;
  children: React.ReactNode;
}

const padMap: Record<NonNullable<SectionProps["padX"]>, string> = {
  tight: "px-4 sm:px-6",
  normal: "px-6 sm:px-10",
  wide: "px-6 sm:px-12 lg:px-20",
};

const toneBg: Record<Tone, string> = {
  dark: "bg-ink-950 text-ink-100",
  light: "bg-surface text-on-surface",
};

const Section = React.forwardRef<HTMLElement, SectionProps>(function Section(
  {
    tone = "light",
    padX = "wide",
    curve = false,
    bgClass,
    id,
    className = "",
    children,
    ...rest
  },
  ref,
) {
  return (
    <section
      ref={ref}
      id={id}
      className={[
        "relative w-full overflow-hidden",
        toneBg[tone],
        curve ? "curve-top" : "",
        padMap[padX],
        "py-20 sm:py-24 lg:py-28",
        bgClass ?? "",
        className,
      ].join(" ")}
      data-tone={tone}
      {...rest}
    >
      {children}
   </section>
  );
});

export default Section;
