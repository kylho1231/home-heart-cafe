import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createOrder } from "@/lib/orders-db";
import { recalculateOrderPrices, orderItemInputSchema } from "@/lib/validation";
import { CafeOrder } from "@/lib/types";
import { z } from "zod";

const adminSaleSchema = z.object({
  customerName: z.string().trim().max(100).optional().default("Walk-in Counter Customer"),
  customerRole: z.enum(["walk_in_customer", "student", "teacher_staff"]).default("walk_in_customer"),
  contactNumber: z.string().trim().max(20).optional().default("Counter Pickup"),
  items: z.array(orderItemInputSchema).min(1, "At least one item is required in the sale"),
  paymentMethod: z.enum(["counter_cash", "gcash_full"]).default("counter_cash"),
  cashTendered: z.number().min(0).optional(),
  gcashReferenceNumber: z.string().trim().max(50).optional(),
  initialStatus: z.enum(["preparing", "ready_for_pickup", "completed"]).default("preparing"),
  staffNotes: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = adminSaleSchema.safeParse(body);

    if (!parsed.success) {
      const err = parsed.error.issues[0]?.message || "Invalid sale input";
      return NextResponse.json({ success: false, error: err }, { status: 400 });
    }

    const {
      customerName,
      customerRole,
      contactNumber,
      items,
      paymentMethod,
      cashTendered,
      gcashReferenceNumber,
      initialStatus,
      staffNotes,
    } = parsed.data;

    // Recalculate price authoritatively
    const recalculated = recalculateOrderPrices(items, paymentMethod);

    const changeAmount =
      paymentMethod === "counter_cash" && typeof cashTendered === "number" && cashTendered >= recalculated.totalAmount
        ? cashTendered - recalculated.totalAmount
        : 0;

    const orderData: Omit<CafeOrder, "id" | "orderCode" | "createdAt" | "updatedAt"> = {
      status: initialStatus,
      pickupEstimatedMinutes: initialStatus === "ready_for_pickup" ? 0 : 5,
      customer: {
        role: customerRole,
        fullName: customerName || "Walk-in Counter Customer",
        contactNumber: contactNumber || "Counter Pickup",
        idPhotoUrl: "/products/chocolate-milk-tea.webp",
        privacyConsent: true,
      },
      items: recalculated.items,
      payment: {
        method: paymentMethod,
        downPaymentAmount: recalculated.totalAmount,
        totalAmount: recalculated.totalAmount,
        gcashReferenceNumber: gcashReferenceNumber?.trim() || undefined,
        paymentStatus: "paid_in_full",
      },
      staffNotes:
        staffNotes ||
        `Direct walk-in counter sale. Tendered: ₱${cashTendered ?? recalculated.totalAmount}. Change: ₱${changeAmount}.`,
    };

    const created = await createOrder(orderData);

    return NextResponse.json(
      {
        success: true,
        order: created,
        changeAmount,
        unlockedFreeFries: recalculated.unlockedFreeFries,
        message: `Sale completed! Order ${created.orderCode} dispatched to kitchen queue.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/admin/sales error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record sale" },
      { status: 500 },
    );
  }
}
