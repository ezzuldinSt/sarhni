"use client";

import { useState, useCallback, useRef } from "react";

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface UseImageUploadReturn {
  uploadProgress: UploadProgress | null;
  isUploading: boolean;
  uploadSpeed: string | null;
  uploadImage: (file: File) => Promise<UploadResult>;
  cancelUpload: () => void;
}

export function useImageUpload(): UseImageUploadReturn {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSpeed, setUploadSpeed] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastLoadedRef = useRef<number>(0);
  const speedIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const uploadImage = useCallback((file: File): Promise<UploadResult> => {
    return new Promise((resolve) => {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        resolve({
          success: false,
          error: "Invalid file type. Only JPG, PNG, GIF, and WebP are allowed."
        });
        return;
      }

      // Validate file size
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        resolve({
          success: false,
          error: "File too large (Max 5MB)"
        });
        return;
      }

      // Reset state
      setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });
      setIsUploading(true);
      setUploadSpeed(null);
      startTimeRef.current = Date.now();
      lastLoadedRef.current = 0;

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      const formData = new FormData();
      formData.append("file", file);

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          setUploadProgress({
            loaded: e.loaded,
            total: e.total,
            percentage
          });
        }
      });

      // Calculate upload speed every 500ms
      speedIntervalRef.current = setInterval(() => {
        if (uploadProgress) {
          const currentTime = Date.now();
          const timeElapsed = (currentTime - startTimeRef.current) / 1000; // seconds
          const bytesPerSecond = uploadProgress.loaded / timeElapsed;

          // Format speed
          let speedText = "";
          if (bytesPerSecond < 1024) {
            speedText = `${bytesPerSecond.toFixed(1)} B/s`;
          } else if (bytesPerSecond < 1024 * 1024) {
            speedText = `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
          } else {
            speedText = `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
          }

          setUploadSpeed(speedText);
        }
      }, 500);

      // Upload completed
      xhr.addEventListener("load", () => {
        if (speedIntervalRef.current) {
          clearInterval(speedIntervalRef.current);
        }

        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              setUploadProgress({ loaded: file.size, total: file.size, percentage: 100 });
              setTimeout(() => {
                setUploadProgress(null);
                setUploadSpeed(null);
                setIsUploading(false);
              }, 500);
              resolve({ success: true, url: response.url });
            } else {
              setUploadProgress(null);
              setUploadSpeed(null);
              setIsUploading(false);
              resolve({ success: false, error: response.error || "Upload failed" });
            }
          } catch {
            setUploadProgress(null);
            setUploadSpeed(null);
            setIsUploading(false);
            resolve({ success: false, error: "Upload failed" });
          }
        } else {
          setUploadProgress(null);
          setUploadSpeed(null);
          setIsUploading(false);
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({ success: false, error: response.error || "Upload failed" });
          } catch {
            resolve({ success: false, error: "Upload failed" });
          }
        }
      });

      // Upload error
      xhr.addEventListener("error", () => {
        if (speedIntervalRef.current) {
          clearInterval(speedIntervalRef.current);
        }
        setUploadProgress(null);
        setUploadSpeed(null);
        setIsUploading(false);
        resolve({ success: false, error: "Network error during upload" });
      });

      // Upload aborted
      xhr.addEventListener("abort", () => {
        if (speedIntervalRef.current) {
          clearInterval(speedIntervalRef.current);
        }
        setUploadProgress(null);
        setUploadSpeed(null);
        setIsUploading(false);
        resolve({ success: false, error: "Upload cancelled" });
      });

      // Send request
      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    });
  }, [uploadProgress]);

  const cancelUpload = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    if (speedIntervalRef.current) {
      clearInterval(speedIntervalRef.current);
    }
    setUploadProgress(null);
    setUploadSpeed(null);
    setIsUploading(false);
  }, []);

  return {
    uploadProgress,
    isUploading,
    uploadSpeed,
    uploadImage,
    cancelUpload
  };
}
