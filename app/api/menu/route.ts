import { NextResponse } from "next/server";
import { getCanonicalMenu, getUnavailableSlugs } from "@/lib/menu";
import catalogSource from "@/app/menu-data.json" with { type: "json" };

export async function GET() {
  try {
    const products = await getCanonicalMenu();
    const unavailableSlugs = await getUnavailableSlugs();

    return NextResponse.json({
      success: true,
      cafeName: catalogSource.cafeName,
      currency: catalogSource.currency,
      products,
      unavailableSlugs,
      bundlesAndPromos: catalogSource.bundlesAndPromos,
      addOns: catalogSource.addOns,
    });
  } catch (error) {
    console.error("GET /api/menu error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch menu" },
      { status: 500 },
    );
  }
}
