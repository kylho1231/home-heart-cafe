import assert from "node:assert/strict";
import test from "node:test";
import {
  signAdminToken,
  verifyAdminToken,
  verifyPin,
  ADMIN_COOKIE_NAME,
} from "../lib/auth.ts";
import {
  checkLoginLockout,
  recordLoginFailure,
  resetLoginLockout,
  checkRateLimit,
} from "../lib/rate-limit.ts";
import { recalculateOrderPrices } from "../lib/validation.ts";

test("Security: Admin token generation and verification", () => {
  const token = signAdminToken();
  assert.ok(token, "Token should be generated");
  assert.equal(token.split(".").length, 2, "Token should be payload.signature format");

  const isValid = verifyAdminToken(token);
  assert.equal(isValid, true, "Generated token must be verified as valid");

  const isTamperedValid = verifyAdminToken(token + "tampered");
  assert.equal(isTamperedValid, false, "Tampered token must be rejected");

  assert.equal(verifyAdminToken(""), false, "Empty token must be rejected");
  assert.equal(verifyAdminToken("invalid.token"), false, "Forged token must be rejected");
});

test("Security: PIN verification with constant-time equality", () => {
  assert.equal(verifyPin("1234"), true, "Correct PIN must pass");
  assert.equal(verifyPin("wrong"), false, "Wrong PIN must fail");
  assert.equal(verifyPin("1235"), false, "Off-by-one PIN must fail");
  assert.equal(verifyPin(""), false, "Empty PIN must fail");
});

test("Security: Rate limiter and login lockout enforces threshold", () => {
  const testIp = "192.168.100.50";
  resetLoginLockout(testIp);

  // 1 to 4 failed attempts should not lock out
  for (let i = 1; i <= 4; i++) {
    const res = recordLoginFailure(testIp);
    assert.equal(res.attemptsLeft, 5 - i);
    const lockout = checkLoginLockout(testIp);
    assert.equal(lockout.isLocked, false);
  }

  // 5th attempt must trigger lockout
  const finalFail = recordLoginFailure(testIp);
  assert.equal(finalFail.attemptsLeft, 0);

  const lockoutState = checkLoginLockout(testIp);
  assert.equal(lockoutState.isLocked, true, "Should be locked out after 5 failures");
  assert.ok(lockoutState.remainingMinutes > 0, "Remaining lockout minutes should be positive");

  // Reset lockout
  resetLoginLockout(testIp);
  assert.equal(checkLoginLockout(testIp).isLocked, false, "Lockout reset must clear penalty");
});

test("Security: Server-side price recalculation overrides client-tampered prices", () => {
  const tamperedItems = [
    {
      id: "tampered-item-1",
      productId: "strawberry-cream-cheese",
      productName: "Strawberry Cream Cheese",
      category: "Cream Cheese Series",
      flavor: "Strawberry",
      size: "16 oz",
      sugarLevel: "75%",
      iceLevel: "Regular Ice",
      addBoba: true,
      addCreamCheese: true, // Prohibited on Cream Cheese Series! Must be ignored/zeroed out
      quantity: 2,
      unitPrice: 1, // Client claims unit price is ₱1
      subtotal: 2,  // Client claims total is ₱2
    },
  ];

  // Recalculate prices strictly from menu-data.json:
  // Strawberry Cream Cheese 16 oz = ₱59
  // Extra Boba = ₱10
  // Cream cheese add-on on Cream Cheese Series = rejected / ₱0
  // Authoritative Unit Price = ₱59 + ₱10 = ₱69
  // Authoritative Subtotal for 2 drinks = ₱138
  const recalculated = recalculateOrderPrices(tamperedItems, "gcash_full");

  assert.equal(recalculated.items[0].unitPrice, 69, "Server must override client price to ₱69");
  assert.equal(recalculated.items[0].subtotal, 138, "Server must override client subtotal to ₱138");
  assert.equal(recalculated.totalAmount, 138, "Server total must be ₱138, ignoring client ₱2");
  assert.equal(recalculated.items[0].addCreamCheese, false, "Cream Cheese add-on on Cream Cheese Series must be disabled");
});
