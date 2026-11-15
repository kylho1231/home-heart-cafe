const startTime = Date.now();

export async function GET() {
  const now = new Date();
  const manilaTime = now.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "full",
    timeStyle: "long",
  });

  return Response.json({
    status: "ok",
    service: "Home Heart Cafe API",
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: now.toISOString(),
    manilaTime,
    timezone: "Asia/Manila",
    storage: "ready",
    version: "0.1.0",
  });
}
