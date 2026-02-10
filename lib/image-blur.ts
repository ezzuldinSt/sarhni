/**
 * PERFORMANCE: Image blur placeholder utilities
 *
 * Generates small blur data URLs for Next.js Image placeholder="blur"
 * This prevents layout shift and improves perceived performance
 */

export interface BlurImageOptions {
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Generates a tiny blur placeholder as base64 data URL
 * This creates a 1x1 PNG that acts as a placeholder
 */
export function generateBlurPlaceholder(color = "#2C1A1D"): string {
  // Create a tiny 1x1 PNG with the specified color
  const canvas = typeof document !== "undefined"
    ? document.createElement("canvas")
    : null;

  if (!canvas) {
    // Server-side fallback - return a minimal base64 PNG
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
  }

  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
  }

  return canvas.toDataURL("image/png");
}

/**
 * Generates a blurred version of an image URL
 * Uses an offscreen canvas to create a downscaled, blurred preview
 */
export async function generateImageBlur(
  imageUrl: string,
  options: BlurImageOptions = {}
): Promise<string> {
  const { width = 10, height = 10, quality = 0.1 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw image scaled down
      ctx.drawImage(img, 0, 0, width, height);

      // Apply blur effect
      ctx.filter = "blur(2px)";
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      // Fallback to solid color on error
      resolve(generateBlurPlaceholder());
    };

    img.src = imageUrl;
  });
}

/**
 * Predefined blur placeholders for common use cases
 */
export const BLUR_PLACEHOLDERS = {
  // Default avatar blur (leather-900 color)
  avatar: generateBlurPlaceholder("#2C1A1D"),

  // Light placeholder for cards
  card: generateBlurPlaceholder("#3D2723"),

  // Success/Info colors
  success: generateBlurPlaceholder("#059669"),
  info: generateBlurPlaceholder("#0284c7"),
  warning: generateBlurPlaceholder("#d97706"),
  danger: generateBlurPlaceholder("#dc2626"),
} as const;

/**
 * Gets an appropriate blur placeholder based on image type
 */
export function getBlurPlaceholder(type: keyof typeof BLUR_PLACEHOLDERS = "avatar"): string {
  return BLUR_PLACEHOLDERS[type];
}
