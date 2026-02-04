import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // -----------------------------------------------------------------
  // FIX: SECURITY - Prevent Directory Traversal
  // -----------------------------------------------------------------
  // We explicitly check for directory traversal attempts ("..") or path separators.
  // Since we generate filenames as UUIDs in upload.ts, a valid filename 
  // should never contain these characters.
  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new NextResponse("Invalid filename", { status: 400 });
  }

  // Determine the path based on environment
  // In Docker/Production: /app/public/uploads
  const filePath = path.join(process.cwd(), "public", "uploads", filename);

  try {
    // Prevent access if the resolved path is somehow outside the uploads directory
    // (Extra layer of defense, though the check above usually covers it)
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!filePath.startsWith(uploadsDir)) {
         return new NextResponse("Access denied", { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "image/jpeg";

    if (ext === ".png") contentType = "image/png";
    if (ext === ".gif") contentType = "image/gif";
    if (ext === ".webp") contentType = "image/webp";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
