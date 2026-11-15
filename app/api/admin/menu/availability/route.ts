import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { setItemAvailability, getUnavailableSlugs, getCanonicalMenu } from "@/lib/menu";

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const menu = await getCanonicalMenu();
  return NextResponse.json({ success: true, menu });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, available } = body;

    if (typeof slug !== "string" || typeof available !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Missing slug (string) or available (boolean)" },
        { status: 400 },
      );
    }

    await setItemAvailability(slug, available);
    const unavailable = await getUnavailableSlugs();

    return NextResponse.json({
      success: true,
      slug,
      isAvailable: available,
      unavailable,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Failed to update stock availability" },
      { status: 500 },
    );
  }
}
