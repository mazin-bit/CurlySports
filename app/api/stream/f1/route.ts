import { NextRequest } from "next/server";
import { fetchF1RaceLive } from "@/lib/external-apis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POLL_MS = 8_000; // OpenF1 updates every ~5-8 seconds during live sessions

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Initial snapshot
      const initial = await fetchF1RaceLive();
      send("snapshot", initial ?? { error: "No active F1 session" });

      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }
        try {
          const data = await fetchF1RaceLive();
          send("update", data ?? { error: "No active F1 session" });
        } catch {
          send("heartbeat", { ts: Date.now() });
        }
      }, POLL_MS);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
