import Image from "next/image";

export type BrandVariant = "mark" | "lockup";
export type BrandAppearance = "on-light" | "on-dark";
export type BrandSize = "sm" | "md" | "lg";

export type BrandProps = {
  variant?: BrandVariant;
  appearance?: BrandAppearance;
  size?: BrandSize;
  /** Next.js Image priority for above-the-fold headers. */
  priority?: boolean;
  /** Decorative when true (empty alt); otherwise product name alt text. */
  decorative?: boolean;
  className?: string;
};

const ASSET: Record<
  BrandVariant,
  Record<BrandAppearance, { src: string; width: number; height: number }>
> = {
  mark: {
    "on-light": {
      src: "/brand/mark-on-light.png",
      width: 134,
      height: 128,
    },
    "on-dark": {
      src: "/brand/mark-on-dark.png",
      width: 120,
      height: 102,
    },
  },
  lockup: {
    "on-light": {
      src: "/brand/logo-on-light.png",
      width: 454,
      height: 154,
    },
    "on-dark": {
      src: "/brand/logo-on-dark.png",
      width: 369,
      height: 113,
    },
  },
};

/** Display heights in pixels; width follows intrinsic aspect ratio. */
const SIZE_HEIGHT: Record<BrandVariant, Record<BrandSize, number>> = {
  mark: { sm: 30, md: 32, lg: 36 },
  /** Header lockup ~128px wide at sm (logo-on-light 454×154). */
  lockup: { sm: 43, md: 48, lg: 56 },
};

/**
 * Single owner of Control Freak logo asset selection.
 * Use lockup in expanded navigation; mark in compact / mobile contexts.
 */
export function Brand({
  variant = "lockup",
  appearance = "on-light",
  size = "md",
  priority = false,
  decorative = false,
  className = "",
}: BrandProps) {
  const asset = ASSET[variant][appearance];
  const height = SIZE_HEIGHT[variant][size];
  const width = Math.round((asset.width / asset.height) * height);
  const alt = decorative ? "" : "Control Freak";

  return (
    <Image
      src={asset.src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={`h-auto w-auto max-w-full object-contain ${className}`}
      style={{ height, width: "auto" }}
    />
  );
}
