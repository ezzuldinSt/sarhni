import { NextRequest } from "next/server";
import { subscribeToNewConfessions } from "@/lib/events";

/**
 * SSE (Server-Sent Events) endpoint for real-time confession updates.
 *
 * Clients (profile viewers) connect to this endpoint to receive new confessions
 * as they're submitted, without needing to refresh the page.
 *
 * Usage: new EventSource('/api/confessions/stream?userId=USER_ID')
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return new Response("Missing userId parameter", { status: 400 });
  }

  const encoder = new TextEncoder();

  /**
   * Create a ReadableStream for SSE.
   * This allows us to push events to the client as they happen.
   */
  const stream = new ReadableStream({
    start(controller) {
      // Send keep-alive comments every 15 seconds
      // This prevents reverse proxies (nginx, Vercel, etc.) from closing idle connections
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch (error) {
          // Controller already closed, stop keep-alive
          clearInterval(keepAlive);
        }
      }, 15000);

      // Subscribe to new confessions for this user
      const subscription = subscribeToNewConfessions(userId, (confession) => {
        try {
          // Format as SSE event: "data: {json}\n\n"
          const data = JSON.stringify(confession);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          // Controller closed, stop trying to send
          console.error("SSE write error:", error);
        }
      });

      // Cleanup when client disconnects
      const abortHandler = () => {
        clearInterval(keepAlive);
        subscription.unsubscribe();
        try {
          controller.close();
        } catch {
          // Controller already closed
        }
      };

      request.signal.addEventListener("abort", abortHandler);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
