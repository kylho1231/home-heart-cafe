import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getBulletinConfig, updateBulletinConfig } from "@/lib/bulletin";
import { z } from "zod";

const updateBulletinSchema = z.object({
  promoBanner: z.string().trim().min(5).max(200).optional(),
  promoSpendThreshold: z.number().int().min(50).max(1000).optional(),
  events: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().trim().min(2).max(100),
        schedule: z.string().trim().min(2).max(100),
        description: z.string().trim().min(2).max(300),
        icon: z.string().default("calendar"),
        badgeColor: z.string().default("blue"),
        image: z.string().default("/products/cafe-favorites-to-share.webp"),
      }),
    )
    .optional(),
});

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const config = await getBulletinConfig();
  return NextResponse.json({ success: true, ...config });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateBulletinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid bulletin payload" },
        { status: 400 },
      );
    }

    const updated = await updateBulletinConfig(parsed.data);
    return NextResponse.json({
      success: true,
      message: "Bulletin and promo settings updated successfully.",
      ...updated,
    });
  } catch (error) {
    console.error("PATCH /api/admin/bulletin error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update bulletin settings." },
      { status: 500 },
    );
  }
}
