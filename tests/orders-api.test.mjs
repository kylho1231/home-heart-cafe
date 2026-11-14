import assert from "node:assert/strict";
import test from "node:test";
import { getOrders, getOrderById, createOrder, updateOrderStatus, getStats } from "../lib/orders-db.ts";

test("Order DB: creates and tracks an anti-scam verified student order", async () => {
  const newOrder = await createOrder({
    status: "pending_verification",
    pickupEstimatedMinutes: 15,
    customer: {
      fullName: "Test Student Juan",
      lrn: "123456789012",
      gradeSection: "Grade 11 - STEM",
      contactNumber: "09171112222",
      idPhotoUrl: "data:image/png;base64,mockId",
      selfiePhotoUrl: "data:image/png;base64,mockSelfie",
    },
    items: [
      {
        id: "item-test-1",
        productId: "okinawa-cream-cheese",
        productName: "Okinawa Cream Cheese",
        category: "Cream Cheese Series",
        flavor: "Okinawa",
        size: "16 oz",
        sugarLevel: "75%",
        iceLevel: "Regular Ice",
        addBoba: true,
        quantity: 1,
        unitPrice: 69,
        subtotal: 69,
      },
    ],
    payment: {
      method: "gcash_downpayment",
      downPaymentAmount: 35,
      totalAmount: 69,
      gcashReferenceNumber: "9021849102941",
      paymentStatus: "downpayment_pending_verification",
    },
    staffNotes: "Automated test order",
  });

  assert.ok(newOrder.id, "Order should have an ID");
  assert.match(newOrder.orderCode, /^HHC-\d{4}$/, "Order code should be HHC-XXXX");
  assert.equal(newOrder.customer.lrn, "123456789012");
  assert.equal(newOrder.status, "pending_verification");

  // Track by code
  const fetched = await getOrderById(newOrder.orderCode);
  assert.ok(fetched, "Order should be retrievable by order code");
  assert.equal(fetched.customer.fullName, "Test Student Juan");

  // Update status to preparing
  const preparingOrder = await updateOrderStatus(newOrder.id, "preparing");
  assert.equal(preparingOrder?.status, "preparing");

  // Update status to ready_for_pickup
  const readyOrder = await updateOrderStatus(newOrder.id, "ready_for_pickup");
  assert.equal(readyOrder?.status, "ready_for_pickup");

  // Check stats
  const stats = await getStats();
  assert.ok(stats.totalOrders > 0, "Stats should show orders");
  assert.ok(stats.readyCount > 0, "Stats should show ready orders");
});
