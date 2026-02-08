import { NextRequest, NextResponse } from "next/server";
import { put } from '@vercel/blob';
import { randomUUID } from "node:crypto";

// Helper function to detect real file type by inspecting "Magic Numbers"
function getMimeType(buffer: Uint8Array): string | null {
  const arr = new Uint8Array(buffer).subarray(0, 4);
  let header = "";
  for (let i = 0; i < arr.length; i++) {
    header += arr[i].toString(16).toUpperCase();
  }

  if (header.startsWith("FFD8FF")) return "image/jpeg";
  if (header === "89504E47") return "image/png";
  if (header.startsWith("47494638")) return "image/gif";
  if (header.startsWith("52494646")) return "image/webp";

  return null;
}

// Helper function to get image dimensions from buffer
function getImageDimensions(buffer: Uint8Array, mimeType: string): { width: number; height: number } | null {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  if (mimeType === "image/jpeg") {
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
    if (buffer.length >= 24) {
      const width = view.getUint32(16);
      const height = view.getUint32(20);
      return { width, height };
    }
  } else if (mimeType === "image/gif") {
    if (buffer.length >= 10) {
      const width = view.getUint16(6, true);
      const height = view.getUint16(8, true);
      return { width, height };
    }
  } else if (mimeType === "image/webp") {
    if (buffer.length > 30 && String.fromCharCode(...buffer.slice(12, 16)) === 'VP8 ') {
      const width = view.getUint16(26, true) & 0x3FFF;
      const height = view.getUint16(28, true) & 0x3FFF;
      return { width, height };
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Limit file size
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (Max 5MB)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Verify the actual content
    const realMimeType = getMimeType(buffer);
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (!realMimeType || !allowedTypes.includes(realMimeType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, GIF, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate image dimensions
    const dimensions = getImageDimensions(buffer, realMimeType);
    if (dimensions) {
      const MAX_DIMENSION = 4096;
      if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
        return NextResponse.json(
          { error: `Image too large. Maximum allowed size is ${MAX_DIMENSION}x${MAX_DIMENSION} pixels.` },
          { status: 400 }
        );
      }
      if (dimensions.width === 0 || dimensions.height === 0) {
        return NextResponse.json({ error: "Invalid image dimensions." }, { status: 400 });
      }
    }

    // Determine extension from the REAL mime type
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
    // FIX: Pass buffer instead of File object to avoid stream issues in serverless
    // Also explicitly set contentType since we're using buffer (not File)
    const blob = await put(fileName, buffer, {
      access: 'public',
      contentType: realMimeType,
    });

    // Return the Blob URL
    return NextResponse.json({ success: true, url: blob.url });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
