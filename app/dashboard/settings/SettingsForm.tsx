"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UploadProgress } from "@/components/ui/UploadProgress";
import { ConfirmDialogProvider, useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useImageUpload } from "@/hooks/useImageUpload";
import { updateUserProfile, deleteProfileImage } from "@/lib/actions/user";
import { toastSuccess, toastError, toastLoading, toast } from "@/lib/toast";
import { Trash2, ArrowLeft } from "lucide-react";

interface User {
  id: string;
  username: string;
  bio?: string | null;
  image?: string | null;
}

function SettingsFormContent({ user }: { user: User }) {
  // If user has no image, use placeholder
  const [preview, setPreview] = useState(user?.image || "/placeholder-avatar.png");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const router = useRouter();
  const objectUrlRef = useRef<string | null>(null);

  const { uploadProgress, isUploading, uploadSpeed, uploadImage, cancelUpload } = useImageUpload();
  const { confirm } = useConfirmDialog();

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
      setUploadError(null);
      // Revoke previous object URL if it exists
      if (objectUrlRef.current && !objectUrlRef.current.startsWith("/")) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      setPreview(objectUrl);
      setPendingFile(file);
    }
  };

  // Handle Delete
  const handleDeleteImage = async () => {
    const confirmed = await confirm({
      title: "Remove Profile Picture",
      message: "Are you sure you want to remove your profile picture? You can always add a new one later.",
      confirmText: "Remove",
      cancelText: "Cancel",
      variant: "warning"
    });

    if (!confirmed) return;

    const res = await deleteProfileImage();

    if (res?.success) {
      // Revoke object URL if it was a blob
      if (objectUrlRef.current && !objectUrlRef.current.startsWith("/")) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setPreview("/placeholder-avatar.png");
      toastSuccess("Profile picture removed");
      router.refresh();
    } else {
      toastError("Failed to remove image");
    }
  };

  const handleUploadImage = async () => {
    if (!pendingFile) return;

    setUploadError(null);
    const result = await uploadImage(pendingFile);

    if (result.success && result.url) {
      // Update profile with new image
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("imageUrl", result.url);

      // Preserve existing bio
      const bioInput = document.querySelector('textarea[name="bio"]') as HTMLTextAreaElement;
      if (bioInput) {
        formData.append("bio", bioInput.value);
      }

      const res = await updateUserProfile(formData);
      if (res?.error) {
        toastError(res.error);
        setUploadError(res.error);
      } else {
        toastSuccess("Profile picture updated!");
        setPendingFile(null);
        router.refresh();
      }
    } else {
      setUploadError(result.error || "Upload failed");
      toastError(result.error || "Upload failed");
    }
  };

  const handleSubmit = async (formData: FormData) => {
    const loadingToast = toastLoading("Updating profile...");

    try {
      const res = await updateUserProfile(formData);
      if (res?.error) {
        toastError(res.error);
        return;
      }

      toastSuccess("Profile updated successfully!");
      router.refresh();

    } catch (error) {
      console.error(error);
      toastError("Something went wrong");
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  return (
    <>
      {/* Back Navigation Breadcrumb */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-leather-500 hover:text-leather-pop transition-colors mb-6 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Dashboard</span>
      </Link>

      <Card>
        <h2 className="text-section-title text-leather-accent mb-6">Settings</h2>
        <form action={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="relative w-avatar-3xl h-avatar-3xl rounded-full border-4 border-leather-pop overflow-hidden shadow-xl">
            <Image
              src={preview}
              alt="Avatar Preview"
              fill
              sizes="128px"
              className="object-cover"
              unoptimized={!preview.startsWith("/placeholder-avatar.png")}
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
                disabled={isUploading}
                />
            </label>

            {/* Show upload button when file is pending */}
            {pendingFile && !isUploading && (
              <Button
                type="button"
                onClick={handleUploadImage}
                className="bg-leather-pop text-leather-900 hover:bg-leather-popHover px-4 py-2 rounded-lg text-sm shadow-md"
              >
                Upload Photo
              </Button>
            )}

            {/* Only show delete button if current image is NOT the placeholder */}
            {preview !== "/placeholder-avatar.png" && !pendingFile && (
                <button
                    type="button"
                    onClick={handleDeleteImage}
                    disabled={isUploading}
                    className="bg-leather-900 border border-leather-600 text-red-400 hover:bg-red-900/20 p-2 rounded-lg transition-colors shadow-md disabled:opacity-50"
                    aria-label="Remove profile picture"
                >
                    <Trash2 size={20} />
                </button>
            )}
          </div>

          {/* Upload Progress */}
          {(isUploading || uploadError) && (
            <div className="w-full">
              <UploadProgress
                percentage={uploadProgress?.percentage || 0}
                speed={uploadSpeed}
                onCancel={cancelUpload}
                error={uploadError || undefined}
              />
            </div>
          )}
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
        
        <Button type="submit" disabled={isUploading} className="w-full">
          {isUploading ? "Uploading..." : "Save Changes"}
        </Button>
      </form>
    </Card>
    </>
  );
}

// Wrapper component that provides the ConfirmDialog context
// NOTE: Since ConfirmDialogProvider is now in root layout, this wrapper is redundant
// but kept for backwards compatibility
export default function SettingsForm(props: { user: User | null }) {
  if (!props.user) return null;
  return (
    <SettingsFormContent user={props.user} />
  );
}
