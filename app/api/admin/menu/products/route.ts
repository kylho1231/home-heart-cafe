import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  addCustomProduct,
  deleteCustomProduct,
  getCanonicalMenu,
  getCustomProducts,
  updateProductPrices,
} from "@/lib/menu";
import { z } from "zod";

const newProductSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters").max(100),
  category: z.string().trim().min(2, "Category is required").max(100),
  description: z.string().trim().max(300).optional(),
  sizes: z
    .array(
      z.object({
        label: z.string().trim().min(1, "Size label required"),
        price: z.number().int().min(1, "Price must be at least ₱1").max(5000),
      }),
    )
    .min(1, "At least one size and price variant is required"),
  image: z.string().optional(),
  allowsBoba: z.boolean().optional(),
  allowsCreamCheese: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const customOnly = searchParams.get("customOnly") === "true";

  if (customOnly) {
    const custom = await getCustomProducts();
    return NextResponse.json({ success: true, products: custom });
  }

  const all = await getCanonicalMenu();
  return NextResponse.json({ success: true, products: all });
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = newProductSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Invalid product data";
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const created = await addCustomProduct(parsed.data);

    return NextResponse.json(
      {
        success: true,
        product: created,
        message: `Product "${created.name}" successfully added to Home Cafe menu!`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/admin/menu/products error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add new product" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, prices } = body;

    if (!slug || typeof slug !== "string" || !prices || typeof prices !== "object") {
      return NextResponse.json(
        { success: false, error: "Product slug and prices map are required." },
        { status: 400 },
      );
    }

    const updated = await updateProductPrices(slug, prices);
    return NextResponse.json({
      success: true,
      slug,
      prices: updated,
      message: `Prices updated successfully for ${slug}.`,
    });
  } catch (error) {
    console.error("PATCH /api/admin/menu/products error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product prices." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Product id is required" }, { status: 400 });
    }

    const removed = await deleteCustomProduct(id);
    if (!removed) {
      return NextResponse.json(
        { success: false, error: "Product not found or cannot be deleted" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      id,
      message: "Custom product deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/menu/products error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
