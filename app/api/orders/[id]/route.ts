import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrderStatus, anonymizeOrderCustomer, deleteOrder } from "@/lib/orders-db";
import { OrderStatus } from "@/lib/types";
import { isAdminAuthenticated } from "@/lib/auth";

/**
 * GET /api/orders/[id]
 * Retrieves order details for tracking or admin view.
 * Admins get full details.
 * Public guests must provide name or phone (?verify=...) to access status and masked details.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 },
      );
    }

    const isAdmin = isAdminAuthenticated(request);

    if (isAdmin) {
      // Full order data returned to authenticated cashier/admin
      return NextResponse.json({ success: true, order });
    }

    // Public guest tracking path: Requires customer name or phone verification to prevent enumeration
    const { searchParams } = new URL(request.url);
    const verifyQuery = (searchParams.get("verify") || "").trim().toLowerCase();

    // If query was empty, check if request is for the newly created order in current session
    const customerName = (order.customer.fullName || "").toLowerCase();
    const rawContact = order.customer.contactNumber || "";
    const contactDigits = rawContact.replace(/\D/g, "");
    const queryDigits = verifyQuery.replace(/\D/g, "");

    const isMatch =
      verifyQuery &&
      (customerName.includes(verifyQuery) ||
        (queryDigits.length >= 4 && contactDigits.length >= 4 && contactDigits.includes(queryDigits)));

    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please provide your Full Name or Phone Number used during checkout to track this order.",
          requiresVerification: true,
        },
        { status: 403 },
      );
    }

    // Return sanitized, privacy-safe tracking order (mask IDs, photos, and DepEd LRN)
    const sanitizedOrder = {
      id: order.id,
      orderCode: order.orderCode,
      createdAt: order.createdAt,
      status: order.status,
      pickupEstimatedMinutes: order.pickupEstimatedMinutes,
      customer: {
        role: order.customer.role,
        fullName: order.customer.fullName,
        gradeSection: order.customer.gradeSection,
        department: order.customer.department,
        contactNumber: rawContact ? `***-***-${rawContact.slice(-4)}` : undefined,
        lrn: order.customer.lrn ? `********${order.customer.lrn.slice(-4)}` : undefined,
        // Omit raw photos from public tracking response
        idPhotoUrl: undefined,
        selfiePhotoUrl: undefined,
      },
      items: order.items,
      payment: {
        method: order.payment.method,
        downPaymentAmount: order.payment.downPaymentAmount,
        totalAmount: order.payment.totalAmount,
        paymentStatus: order.payment.paymentStatus,
        gcashReferenceNumber: order.payment.gcashReferenceNumber
          ? `***${order.payment.gcashReferenceNumber.slice(-4)}`
          : undefined,
      },
      staffNotes: order.status === "ready_for_pickup" ? order.staffNotes : undefined,
    };

    return NextResponse.json({ success: true, order: sanitizedOrder });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order." },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/orders/[id]
 * Protected Admin Endpoint: Updates kitchen/cashier order status.
 * Requires valid admin session.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Enforce admin authentication
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Admin session required to update orders.",
        },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, rejectionReason, staffNotes, pickupEstimatedMinutes, markPaid } = body;

    const validStatuses: OrderStatus[] = [
      "pending_verification",
      "preparing",
      "ready_for_pickup",
      "completed",
      "rejected",
    ];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${status}` },
        { status: 400 },
      );
    }

    let updated;
    try {
      updated = await updateOrderStatus(
        id,
        status,
        rejectionReason,
        staffNotes,
        pickupEstimatedMinutes,
        markPaid,
      );
    } catch (transitionErr) {
      return NextResponse.json(
        {
          success: false,
          error:
            transitionErr instanceof Error
              ? transitionErr.message
              : "Invalid lifecycle transition",
        },
        { status: 400 },
      );
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      order: updated,
      message: `Order ${updated.orderCode} updated to ${updated.status}`,
    });
  } catch (error) {
    console.error("PATCH /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/orders/[id]
 * Protected Admin Endpoint: Deletes an order or purges customer PII pursuant to RA 10173.
 * Query params: ?action=anonymize (default) or ?action=delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin session required." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "anonymize";

    if (action === "delete") {
      const deleted = await deleteOrder(id);
      if (!deleted) {
        return NextResponse.json(
          { success: false, error: "Order not found." },
          { status: 404 },
        );
      }
      return NextResponse.json({
        success: true,
        message: "Order successfully deleted from records.",
      });
    }

    // Default action: anonymize PII
    const anonymized = await anonymizeOrderCustomer(id);
    if (!anonymized) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      order: anonymized,
      message: "Customer personal credentials permanently purged pursuant to RA 10173.",
    });
  } catch (error) {
    console.error("DELETE /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process data deletion request." },
      { status: 500 },
    );
  }
}
