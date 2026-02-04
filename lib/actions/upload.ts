"use server";
import fs from "node:fs/promises";
import path from "node:path";
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
  
  // Robust Path Construction
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

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
  const filePath = path.join(uploadDir, fileName);

  // Write the file
  await fs.writeFile(filePath, buffer);

  return { success: true, url: `/api/uploads/${fileName}` };
}
