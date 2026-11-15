import assert from "node:assert/strict";
import test from "node:test";
import { createOrderSchema } from "../lib/validation.ts";
import { anonymizeCustomerRecord } from "../lib/orders-db.ts";

test("Data Privacy: Privacy consent (RA 10173) is strictly required at checkout", () => {
  const baseOrder = {
    customer: {
      role: "student",
      fullName: "Juan Dela Cruz",
      lrn: "123456789012",
      gradeSection: "Grade 11 - TVL",
      contactNumber: "09171234567",
      idPhotoUrl: "data:image/png;base64,mockIdPhoto",
      privacyConsent: false, // User didn't check the consent box
    },
    items: [
      {
        id: "item-test-1",
        productId: "wintermelon-cream-cheese",
        productName: "Wintermelon Cream Cheese",
        category: "Cream Cheese Series",
        flavor: "Wintermelon",
        size: "16 oz",
        sugarLevel: "75%",
        iceLevel: "Regular Ice",
        addBoba: true,
        quantity: 1,
      },
    ],
    payment: {
      method: "counter_cash",
    },
  };

  const rejectedResult = createOrderSchema.safeParse(baseOrder);
  assert.equal(rejectedResult.success, false, "Must reject order without privacy consent");

  const acceptedResult = createOrderSchema.safeParse({
    ...baseOrder,
    customer: {
      ...baseOrder.customer,
      privacyConsent: true,
    },
  });
  assert.equal(acceptedResult.success, true, "Must accept order when privacy consent is provided");
});

test("Data Privacy: Data minimization allows optional selfie photo when ID photo is provided", () => {
  const orderWithoutSelfie = {
    customer: {
      role: "student",
      fullName: "Maria Clara",
      lrn: "109876543210",
      gradeSection: "Grade 12 - STEM",
      contactNumber: "09181234567",
      idPhotoUrl: "data:image/png;base64,mockIdPhoto",
      // selfiePhotoUrl omitted pursuant to data minimization
      privacyConsent: true,
    },
    items: [
      {
        id: "item-test-2",
        productId: "taro-cream-cheese",
        productName: "Taro Cream Cheese",
        category: "Cream Cheese Series",
        flavor: "Taro",
        size: "16 oz",
        sugarLevel: "50%",
        iceLevel: "Less Ice",
        addBoba: false,
        quantity: 1,
      },
    ],
    payment: {
      method: "counter_cash",
    },
  };

  const result = createOrderSchema.safeParse(orderWithoutSelfie);
  assert.equal(result.success, true, "Order must succeed without selfie photo (minimal necessary collection)");
});

test("Data Privacy: 30-Day retention policy scrubs all customer PII while preserving financial totals", () => {
  const orderWithPII = {
    id: "ord-test-old",
    orderCode: "HHC-9988",
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days old
    updatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
    pickupEstimatedMinutes: 10,
    customer: {
      role: "student",
      fullName: "Secret Student",
      lrn: "123456789012",
      gradeSection: "Grade 12 - GAS",
      contactNumber: "09179998888",
      idPhotoUrl: "data:image/png;base64,sensitiveSchoolIdPhotoData",
      selfiePhotoUrl: "data:image/png;base64,sensitiveSelfiePhotoData",
      privacyConsent: true,
    },
    items: [
      {
        id: "item-1",
        productId: "okinawa-cream-cheese",
        productName: "Okinawa Cream Cheese",
        category: "Cream Cheese Series",
        flavor: "Okinawa",
        size: "16 oz",
        sugarLevel: "75%",
        iceLevel: "Regular Ice",
        addBoba: false,
        quantity: 1,
        unitPrice: 69,
        subtotal: 69,
      },
    ],
    payment: {
      method: "counter_cash",
      downPaymentAmount: 0,
      totalAmount: 69,
      paymentStatus: "paid_in_full",
    },
  };

  const anonymized = anonymizeCustomerRecord(orderWithPII);

  // Assert PII is wiped
  assert.equal(anonymized.customer.anonymized, true);
  assert.ok(anonymized.customer.anonymizedAt, "Must record anonymization timestamp");
  assert.equal(anonymized.customer.fullName, "Customer #9988");
  assert.equal(anonymized.customer.lrn, undefined);
  assert.equal(anonymized.customer.gradeSection, undefined);
  assert.equal(anonymized.customer.idPhotoUrl, undefined);
  assert.equal(anonymized.customer.selfiePhotoUrl, undefined);
  assert.equal(anonymized.customer.contactNumber, "••••••••");

  // Assert financial integrity is preserved
  assert.equal(anonymized.orderCode, "HHC-9988");
  assert.equal(anonymized.payment.totalAmount, 69);
  assert.equal(anonymized.items.length, 1);
});
