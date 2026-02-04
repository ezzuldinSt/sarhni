"use server";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File;
  
  if (!file || file.size === 0) return { error: "No file uploaded" };
  if (!file.type.startsWith("image/")) return { error: "Invalid file type" };

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  
  // Robust Path Construction
  // In Docker: /app/public/uploads
  // Local: [project_dir]/public/uploads
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  // Ensure directory exists
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const ext = file.name.split('.').pop();
  const fileName = `${randomUUID()}.${ext}`;
  const filePath = path.join(uploadDir, fileName);

  await fs.writeFile(filePath, buffer);

  return { success: true, url: `/api/uploads/${fileName}` };
}
