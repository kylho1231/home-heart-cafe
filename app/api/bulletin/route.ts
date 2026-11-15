import { NextResponse } from "next/server";
import { getBulletinConfig } from "@/lib/bulletin";

export async function GET() {
  const config = await getBulletinConfig();
  return NextResponse.json({
    success: true,
    promoBanner: config.promoBanner,
    promoSpendThreshold: config.promoSpendThreshold,
    events: config.events,
  });
}
