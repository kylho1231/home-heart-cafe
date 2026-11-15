import { NextRequest, NextResponse } from "next/server";
import { getOrders, createOrder, getStats } from "@/lib/orders-db";
import { CafeOrder } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer, items, payment } = body;

    // Validate customer name
    if (!customer?.fullName?.trim()) {
      return NextResponse.json(
        { success: false, error: "Full Name is required." },
        { status: 400 },
      );
    }

    const isTeacher = customer.role === "teacher_staff";

    let cleanLrn = "";
    if (isTeacher) {
      // Teachers & staff don't have a 12-digit student LRN
      if (!customer?.department?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: "Department or Faculty Designation is required for faculty orders.",
          },
          { status: 400 },
        );
      }
    } else {
      // Students require a 12-digit DepEd LRN
      cleanLrn = (customer?.lrn || "").replace(/\D/g, "");
      if (cleanLrn.length !== 12) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid LRN. Philippine DepEd Learner Reference Number must be exactly 12 digits.",
          },
          { status: 400 },
        );
      }
      if (!customer?.gradeSection?.trim()) {
        return NextResponse.json(
          { success: false, error: "Grade & Section is required for student orders." },
          { status: 400 },
        );
      }
    }

    if (!customer?.idPhotoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: isTeacher
            ? "Faculty / Employee ID photo is required for order verification."
            : "Student School ID photo is required for order verification.",
        },
        { status: 400 },
      );
    }

    if (!customer?.selfiePhotoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Verification selfie photo is required to ensure secure counter pickup.",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty. Please add items to order." },
        { status: 400 },
      );
    }

    // Verify GCash details if chosen
    if (
      payment?.method === "gcash_downpayment" ||
      payment?.method === "gcash_full"
    ) {
      if (!payment.gcashReferenceNumber?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error:
              "GCash Reference Number is required for online downpayment verification.",
          },
          { status: 400 },
        );
      }
    }

    // Server-side authoritative calculation
    const calculatedTotal = items.reduce(
      (sum: number, it: { subtotal: number; quantity: number }) =>
        sum + (it.subtotal || 0),
      0,
    );

    const downPayment =
      payment.method === "gcash_full"
        ? calculatedTotal
        : payment.method === "gcash_downpayment"
          ? Math.ceil(calculatedTotal * 0.5)
          : 0;

    const orderData: Omit<CafeOrder, "id" | "orderCode" | "createdAt" | "updatedAt"> = {
      status: "pending_verification",
      pickupEstimatedMinutes: 15,
      customer: {
        role: isTeacher ? "teacher_staff" : "student",
        fullName: customer.fullName.trim(),
        lrn: isTeacher ? undefined : cleanLrn,
        gradeSection: isTeacher ? undefined : customer.gradeSection?.trim(),
        department: isTeacher ? customer.department?.trim() : undefined,
        employeeId: isTeacher ? customer.employeeId?.trim() : undefined,
        contactNumber: customer.contactNumber?.trim() || "N/A",
        idPhotoUrl: customer.idPhotoUrl,
        selfiePhotoUrl: customer.selfiePhotoUrl,
      },
      items,
      payment: {
        method: payment.method || "counter_cash",
        downPaymentAmount: downPayment,
        totalAmount: calculatedTotal,
        gcashReferenceNumber: payment.gcashReferenceNumber?.trim() || undefined,
        receiptScreenshotUrl: payment.receiptScreenshotUrl || undefined,
        paymentStatus:
          payment.method === "counter_cash"
            ? "unpaid"
            : payment.method === "gcash_full"
              ? "downpayment_pending_verification"
              : "downpayment_pending_verification",
      },
      staffNotes: isTeacher
        ? "Faculty order received. Pending cashier verification."
        : "Student order received. Pending cashier verification.",
    };

    const created = await createOrder(orderData);

    return NextResponse.json(
      {
        success: true,
        order: created,
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
