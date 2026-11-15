import { NextRequest, NextResponse } from "next/server";
import { getOrders, createOrder, getStats } from "@/lib/orders-db";
import { CafeOrder } from "@/lib/types";
import { isAdminAuthenticated } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createOrderSchema, recalculateOrderPrices } from "@/lib/validation";

// In-memory idempotency cache (15-minute sliding window)
const idempotencyCache = new Map<string, { order: CafeOrder; timestamp: number }>();

function cleanIdempotencyCache() {
  const now = Date.now();
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > 15 * 60 * 1000) {
      idempotencyCache.delete(key);
    }
  }
}

/**
 * GET /api/orders
 * Protected Admin Endpoint: Lists all orders & sales reports.
 * Requires valid admin session cookie.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify admin authentication
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Admin session required to access store orders.",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const withStats = searchParams.get("stats") === "true";

    const orders = await getOrders();

    if (withStats) {
      const stats = await getStats();
      return NextResponse.json({ success: true, orders, stats });
    }

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/orders
 * Public Endpoint: Submits a new customer order with server-side validation & price recalculation.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // 0. Idempotency Key check to prevent double submissions
    const idempotencyKey =
      request.headers.get("idempotency-key") ||
      request.headers.get("x-idempotency-key");

    if (idempotencyKey) {
      cleanIdempotencyCache();
      const existing = idempotencyCache.get(idempotencyKey);
      if (existing) {
        return NextResponse.json(
          {
            success: true,
            order: existing.order,
            message: `Order ${existing.order.orderCode} retrieved from session cache.`,
            isDuplicate: true,
          },
          { status: 200 },
        );
      }
    }

    // 1. Rate Limiting: Max 10 orders per IP per 10 minutes to prevent spam/abuse
    const rateCheck = checkRateLimit(`order_create:${ip}`, 10, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many orders submitted from this network. Please wait a few minutes.",
        },
        { status: 429 },
      );
    }

    const body = await request.json();

    // 2. Strict Schema Validation with Zod
    const parseResult = createOrderSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid order input.";
      return NextResponse.json(
        {
          success: false,
          error: firstError,
          issues: parseResult.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }

    const { customer, items: rawItems, payment } = parseResult.data;

    // 3. Authoritative Server-Side Price & Promo Recalculation (Never trust client prices)
    let recalculated;
    try {
      recalculated = recalculateOrderPrices(rawItems, payment.method);
    } catch (pricingError) {
      return NextResponse.json(
        {
          success: false,
          error:
            pricingError instanceof Error
              ? pricingError.message
              : "Pricing validation failed for selected items.",
        },
        { status: 400 },
      );
    }

    const isTeacher = customer.role === "teacher_staff";
    const isWalkIn = customer.role === "walk_in_customer";

    const orderData: Omit<CafeOrder, "id" | "orderCode" | "createdAt" | "updatedAt"> = {
      status: isWalkIn ? "preparing" : "pending_verification",
      pickupEstimatedMinutes: isWalkIn ? 5 : 15,
      customer: {
        role: customer.role,
        fullName: customer.fullName.trim() || (isWalkIn ? "Walk-in Counter Customer" : "Valued Customer"),
        lrn: isTeacher || isWalkIn ? undefined : (customer.lrn || "").replace(/\D/g, ""),
        gradeSection: isTeacher || isWalkIn ? undefined : customer.gradeSection?.trim(),
        department: isTeacher ? customer.department?.trim() : undefined,
        employeeId: isTeacher ? customer.employeeId?.trim() : undefined,
        contactNumber: customer.contactNumber.trim() || "Counter Pickup",
        idPhotoUrl: customer.idPhotoUrl || (isWalkIn ? "/products/chocolate-milk-tea.webp" : undefined),
        selfiePhotoUrl: customer.selfiePhotoUrl,
        privacyConsent: customer.privacyConsent ?? true,
      },
      items: recalculated.items,
      payment: {
        method: payment.method,
        downPaymentAmount: recalculated.downPaymentAmount,
        totalAmount: recalculated.totalAmount,
        gcashReferenceNumber: payment.gcashReferenceNumber?.trim() || undefined,
        receiptScreenshotUrl: payment.receiptScreenshotUrl || undefined,
        paymentStatus: isWalkIn
          ? "paid_in_full"
          : payment.method === "counter_cash"
            ? "unpaid"
            : "downpayment_pending_verification",
      },
      staffNotes: isWalkIn
        ? "Walk-in counter sale rung up at cashier terminal."
        : isTeacher
          ? "Faculty order received. Pending ID verification."
          : "Student order received. Pending ID verification.",
    };

    const created = await createOrder(orderData);

    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, {
        order: created,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json(
      {
        success: true,
        order: created,
        unlockedFreeFries: recalculated.unlockedFreeFries,
        message: `Order ${created.orderCode} successfully placed!`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to place order. Server error." },
      { status: 500 },
    );
  }
}
