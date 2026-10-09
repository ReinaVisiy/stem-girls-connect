import type { CSSProperties, ElementType, ReactNode } from "react";
import { paperAssets } from "./paperAssets";
import { NEUTRAL_VARIANT, noteVariant } from "./paperStyle";

type Props = {
  /** Element to render, e.g. "article" for a note or "div" for a decoration. */
  as?: ElementType;
  /** "thumb" uses the small slices for wall previews. */
  size?: "full" | "thumb";
  /**
   * Which image slices to load. Defaults to "small" for thumbnails and "full"
   * otherwise; small decorative uses of the full-size layout can ask for "small".
   */
  slices?: "full" | "small";
  /**
   * Opaque public reference. When given, tilt, tape position and shade are
   * derived deterministically from it; otherwise the neutral look is used.
   */
  reference?: string;
  /** Show the masking tape (default true). */
  tape?: boolean;
  className?: string;
  /** Plain-text signature area, bottom left only. Never a label or a blank line. */
  footer?: ReactNode;
  children?: ReactNode;
};

/**
 * One shared paper look: warm ivory sheet with deckled edges, a piece of
 * masking tape and two soft natural shadows. It deliberately carries no
 * logo; the logo is drawn only into a participant's own exported PNG.
 */
export default function GirlhoodPaperFrame({
  as: Tag = "div",
  size = "full",
  slices: slicesProp,
  reference,
  tape = true,
  className,
  footer,
  children,
}: Props) {
  const v = reference ? noteVariant(reference) : NEUTRAL_VARIANT;
  const slices =
    (slicesProp ?? (size === "thumb" ? "small" : "full")) === "small"
      ? paperAssets.small
      : paperAssets.full;
  const style = {
    "--gp-rotate": `${v.rotate}deg`,
    "--gp-tape-shift": `${v.tapeShift}%`,
    "--gp-tape-tilt": `${v.tapeTilt}deg`,
    "--gp-top": `url(${slices.top})`,
    "--gp-mid": `url(${slices.mid})`,
    "--gp-bottom": `url(${slices.bottom})`,
    "--gp-tape": `url(${paperAssets.tape})`,
  } as CSSProperties;
  return (
    <Tag
      className={[
        "girlhood-paper",
        size === "thumb" ? "is-thumb" : "",
        `tone-${v.tone}`,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <div className="girlhood-paper-sheet">
        <span className="girlhood-paper-top" aria-hidden="true" />
        <span className="girlhood-paper-mid" aria-hidden="true" />
        <span className="girlhood-paper-bottom" aria-hidden="true" />
        <div className="girlhood-paper-content">{children}</div>
        {footer ? <div className="girlhood-paper-footer">{footer}</div> : null}
      </div>
      {tape ? <span className="girlhood-tape" aria-hidden="true" /> : null}
    </Tag>
  );
}
