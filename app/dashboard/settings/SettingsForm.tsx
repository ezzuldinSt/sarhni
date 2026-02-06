"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { uploadImage } from "@/lib/actions/upload";
import { updateUserProfile, deleteProfileImage } from "@/lib/actions/user"; // Import delete action
import { toast } from "sonner";
import { Trash2 } from "lucide-react"; // Import Icon

export default function SettingsForm({ user }: { user: any }) {
  // If user has no image, use placeholder
  const [preview, setPreview] = useState(user?.image || "/placeholder-avatar.png");
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const objectUrlRef = useRef<string | null>(null);

  // Cleanup object URL on unmount or when preview changes to a non-blob URL
  useEffect(() => {
    return () => {
      if (objectUrlRef.current && !objectUrlRef.current.startsWith("/")) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke previous object URL if it exists
      if (objectUrlRef.current && !objectUrlRef.current.startsWith("/")) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      setPreview(objectUrl);
    }
  };

  // NEW: Handle Delete
  const handleDeleteImage = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) return;

    setUploading(true); // Lock buttons
    const res = await deleteProfileImage();

    if (res?.success) {
      // Revoke object URL if it was a blob
      if (objectUrlRef.current && !objectUrlRef.current.startsWith("/")) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setPreview("/placeholder-avatar.png"); // Revert UI immediately
      toast.success("Profile picture removed");
      router.refresh(); // Refresh server data
    } else {
      toast.error("Failed to remove image");
    }

    setUploading(false); // Always reset uploading state
  };

  const handleSubmit = async (formData: FormData) => {
    setUploading(true);
    const loadingToast = toast.loading("Updating profile...");

    try {
      const file = formData.get("avatar") as File;

      if (file && file.size > 0) {
        const uploadData = new FormData();
        uploadData.append("file", file);

        const uploadRes = await uploadImage(uploadData);

        if ((uploadRes as any).success) {
          formData.set("imageUrl", (uploadRes as any).url);
        } else {
          toast.error("Image upload failed");
          return;
        }
      }

      const res = await updateUserProfile(formData);
      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Profile updated successfully!");
      router.refresh();

    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      toast.dismiss(loadingToast);
      setUploading(false);
    }
  };

  return (
    <Card>
      <form action={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="relative w-32 h-32 rounded-full border-4 border-leather-pop overflow-hidden shadow-xl">
            <Image
              src={preview}
              alt="Avatar Preview"
              fill
              sizes="128px"
              className="object-cover"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-leather-700 hover:bg-leather-600 text-leather-accent px-4 py-2 rounded-lg text-sm transition-colors shadow-md">
                <span>Change Photo</span>
                <input 
                type="file" 
                name="avatar" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
                />
            </label>

            {/* Only show delete button if current image is NOT the placeholder */}
            {preview !== "/placeholder-avatar.png" && (
                <button
                    type="button"
                    onClick={handleDeleteImage}
                    disabled={uploading}
                    className="bg-leather-900 border border-leather-600 text-red-400 hover:bg-red-900/20 p-2 rounded-lg transition-colors shadow-md"
                    title="Remove Photo"
                >
                    <Trash2 size={20} />
                </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-leather-accent">Bio</label>
          <textarea 
            name="bio" 
            defaultValue={user?.bio || ""} 
            className="w-full bg-leather-900 rounded-xl p-3 text-leather-accent focus:ring-2 focus:ring-leather-pop outline-none min-h-[100px]"
            placeholder="Tell the world who you are..."
          />
        </div>
        
        <input type="hidden" name="userId" value={user.id} />
        
        <Button type="submit" disabled={uploading} className="w-full">
          {uploading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Card>
  );
}
