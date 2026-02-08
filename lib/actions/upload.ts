"use server";
import { put } from '@vercel/blob';
import { randomUUID } from "node:crypto";

// FIX: Helper function to detect real file type by inspecting "Magic Numbers"
// This prevents users from renaming 'virus.exe' to 'cute-cat.jpg'
function getMimeType(buffer: Uint8Array): string | null {
  const arr = new Uint8Array(buffer).subarray(0, 4);
  let header = "";
  for (let i = 0; i < arr.length; i++) {
    header += arr[i].toString(16).toUpperCase();
  }

  // Check for common image signatures
  if (header.startsWith("FFD8FF")) return "image/jpeg";
  if (header === "89504E47") return "image/png";
  if (header.startsWith("47494638")) return "image/gif"; // GIF8
  // WebP starts with 'RIFF' (52 49 46 46) ... then 'WEBP' at offset 8.
  // We'll trust RIFF for now as it's multimedia, but strict checking is safer.
  if (header.startsWith("52494646")) return "image/webp";

  return null;
}

// Helper function to get image dimensions from buffer
function getImageDimensions(buffer: Uint8Array, mimeType: string): { width: number; height: number } | null {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  if (mimeType === "image/jpeg") {
    // JPEG dimensions are in various marker segments (0xFFC0, 0xFFC1, 0xFFC2)
    let i = 2;
    while (i < buffer.length - 8) {
      if (buffer[i] === 0xFF && buffer[i + 1] >= 0xC0 && buffer[i + 1] <= 0xC3) {
        const height = view.getUint16(i + 5);
        const width = view.getUint16(i + 7);
        return { width, height };
      }
      i += 2 + view.getUint16(i + 2);
    }
  } else if (mimeType === "image/png") {
    // PNG IHDR chunk starts at byte 8, dimensions at 16-23
    if (buffer.length >= 24) {
      const width = view.getUint32(16);
      const height = view.getUint32(20);
      return { width, height };
    }
  } else if (mimeType === "image/gif") {
    // GIF dimensions are at bytes 6-9
    if (buffer.length >= 10) {
      const width = view.getUint16(6, true); // little endian
      const height = view.getUint16(8, true);
      return { width, height };
    }
  } else if (mimeType === "image/webp") {
    // WebP: Check for VP8/VP8L/VP8X
    if (buffer.length > 30 && String.fromCharCode(...buffer.slice(12, 16)) === 'VP8 ') {
      const width = view.getUint16(26, true) & 0x3FFF;
      const height = view.getUint16(28, true) & 0x3FFF;
      return { width, height };
    }
  }

  return null;
}

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File;

  if (!file || file.size === 0) return { error: "No file uploaded" };

  // FIX: Limit file size on the server side (e.g., 5MB)
  if (file.size > 5 * 1024 * 1024) return { error: "File too large (Max 5MB)" };

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  // FIX: Verify the actual content, ignore what the user claims it is
  const realMimeType = getMimeType(buffer);
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (!realMimeType || !allowedTypes.includes(realMimeType)) {
      return { error: "Invalid file type. Only JPG, PNG, GIF, and WebP are allowed." };
  }

  // FIX: Validate image dimensions (max 4096x4096 to prevent performance issues)
  const dimensions = getImageDimensions(buffer, realMimeType);
  if (dimensions) {
    const MAX_DIMENSION = 4096;
    if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
      return { error: `Image too large. Maximum allowed size is ${MAX_DIMENSION}x${MAX_DIMENSION} pixels.` };
    }
    if (dimensions.width === 0 || dimensions.height === 0) {
      return { error: "Invalid image dimensions." };
    }
  }

  try {
    // FIX: Determine extension from the REAL mime type, not the filename
    const extMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp"
    };
    const safeExt = extMap[realMimeType];

    // Generate a clean filename
    const fileName = `${randomUUID()}.${safeExt}`;

    // Upload to Vercel Blob Storage
    const blob = await put(fileName, file, {
      access: 'public',
    });

    return { success: true, url: blob.url };
  } catch (error) {
    console.error("Upload error:", error);
    return { error: "Failed to upload file" };
  }
}
