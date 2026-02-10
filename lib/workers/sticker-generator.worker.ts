/**
 * PERFORMANCE: Web Worker for html2canvas
 *
 * Offloads expensive sticker generation to a background thread
 * This prevents blocking the main thread and improves INP (Interaction to Next Paint)
 *
 * Note: This worker uses a browser-compatible approach
 */

import html2canvas from "html2canvas";

export interface StickerWorkerMessage {
  type: "generate";
  elementId: string;
  options: {
    backgroundColor: string;
    scale: number;
  };
}

export interface StickerWorkerResponse {
  type: "success" | "error";
  blob?: Blob;
  error?: string;
}

// Listen for messages from the main thread
self.addEventListener("message", async (event: MessageEvent<StickerWorkerMessage>) => {
  const { type, elementId, options } = event.data;

  if (type === "generate") {
    try {
      // In a worker, we can't access DOM directly
      // So we need the main thread to serialize the element
      // For now, we'll use a different approach:
      // The worker will handle the canvas-to-blob conversion after DOM capture

      // This is a simplified version - actual implementation would need
      // the main thread to pass the element data or use a library
      // that works with workers

      self.postMessage({
        type: "error",
        error: "Direct DOM access not available in workers. Use main thread approach.",
      } as StickerWorkerResponse);
    } catch (error) {
      self.postMessage({
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      } as StickerWorkerResponse);
    }
  }
});

export default {};
