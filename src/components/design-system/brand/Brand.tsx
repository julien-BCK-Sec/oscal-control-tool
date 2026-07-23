import Image from "next/image";

export type BrandVariant = "mark" | "lockup";
/** Fixed appearance, or `auto` to follow `data-theme` without a hydration flash. */
export type BrandAppearance = "on-light" | "on-dark" | "auto";
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
  Exclude<BrandAppearance, "auto">,
  Record<BrandVariant, { src: string; width: number; height: number }>
> = {
  "on-light": {
    mark: {
      src: "/brand/mark-on-light.png",
      width: 134,
      height: 128,
    },
    lockup: {
      src: "/brand/logo-on-light.png",
      width: 454,
      height: 154,
    },
  },
  "on-dark": {
    mark: {
      src: "/brand/mark-on-dark.png",
      width: 120,
      height: 102,
    },
    lockup: {
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

function BrandImage({
  variant,
  appearance,
  size,
  priority,
  decorative,
  className,
}: {
  variant: BrandVariant;
  appearance: Exclude<BrandAppearance, "auto">;
  size: BrandSize;
  priority: boolean;
  decorative: boolean;
  className: string;
}) {
  const asset = ASSET[appearance][variant];
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

/**
 * Single owner of Control Freak logo asset selection.
 * Use lockup in expanded navigation; mark in compact / mobile contexts.
 * Prefer `appearance="auto"` so the logo tracks the resolved theme without a
 * hydration flash (both assets are rendered; CSS shows the matching one).
 */
export function Brand({
  variant = "lockup",
  appearance = "auto",
  size = "md",
  priority = false,
  decorative = false,
  className = "",
}: BrandProps) {
  if (appearance === "auto") {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <BrandImage
          variant={variant}
          appearance="on-light"
          size={size}
          priority={priority}
          decorative={decorative}
          className="brand-on-light"
        />
        <BrandImage
          variant={variant}
          appearance="on-dark"
          size={size}
          priority={priority}
          decorative={true}
          className="brand-on-dark"
        />
      </span>
    );
  }

  return (
    <BrandImage
      variant={variant}
      appearance={appearance}
      size={size}
      priority={priority}
      decorative={decorative}
      className={className}
    />
  );
}
