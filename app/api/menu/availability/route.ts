import { NextResponse } from "next/server";
import { getUnavailableSlugs } from "@/lib/menu";

export async function GET() {
  try {
    const unavailable = await getUnavailableSlugs();
    return NextResponse.json({ success: true, unavailable });
  } catch {
    return NextResponse.json({ success: false, unavailable: [] }, { status: 500 });
  }
}
