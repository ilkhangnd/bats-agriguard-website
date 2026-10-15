import React from "react";

export interface EditorialHeadingProps {
  /** Optional small badge / pill label displayed above heading */
  eyebrow?: React.ReactNode;
  /** Primary statement line (DM Sans Bold, dark forest green) */
  primary: string;
  /** Accent emphasis line (Noto Serif Italic, emerald green) */
  accent?: string;
  /** Optional description text */
  description?: React.ReactNode;
  /** Alignment: "left" for hero/products, "center" for standard sections */
  align?: "left" | "center";
  /** Size scale: "hero", "section" (default), or "compact" */
  size?: "hero" | "section" | "compact";
  /** Theme: "light" (default) or "dark" (for final CTA banner) */
  theme?: "light" | "dark";
  /** Semantic HTML heading tag: "h1" (Hero only) or "h2" (Sections) */
  level?: "h1" | "h2";
  /** Optional ID for section navigation */
  id?: string;
  /** Optional container className */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
}

/**
 * EditorialHeading — Modern Editorial × Agricultural Technology heading component.
 * Renders a unified semantic H1 or H2 with a DM Sans bold primary line and a Noto Serif italic accent line.
 */
export function EditorialHeading({
  eyebrow,
  primary,
  accent,
  description,
  align = "center",
  size = "section",
  theme = "light",
  level = "h2",
  id,
  className = "",
  style
}: EditorialHeadingProps) {
  const Tag = level === "h1" ? "h1" : "h2";

  return (
    <div
      id={id}
      className={`editorialHeadingWrap editorialAlign-${align} editorialSize-${size} editorialTheme-${theme} ${className}`}
      style={style}
    >
      {eyebrow && (
        <div className="editorialEyebrow" aria-hidden="true">
          {align === "center" && <span className="editorialEyebrowLine" />}
          {typeof eyebrow === "string" ? (
            <span className="editorialEyebrowPill">{eyebrow}</span>
          ) : (
            eyebrow
          )}
          {align === "center" && <span className="editorialEyebrowLine" />}
        </div>
      )}

      <Tag className="editorialTitle">
        <span className="editorialTitlePrimary">{primary}</span>
        {accent && <span className="editorialTitleAccent">{accent}</span>}
      </Tag>

      {description && (
        <p className="editorialDescription">{description}</p>
      )}
    </div>
  );
}

export default EditorialHeading;
