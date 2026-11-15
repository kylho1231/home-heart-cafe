import test from "node:test";
import assert from "node:assert/strict";
import { GET as healthGet } from "../app/api/health/route.ts";

test("Health API: returns status ok with Asia/Manila timezone and uptime", async () => {
  const response = await healthGet();
  assert.equal(response.status, 200);

  const data = await response.json();
  assert.equal(data.status, "ok");
  assert.equal(data.timezone, "Asia/Manila");
  assert.equal(data.storage, "ready");
  assert.equal(typeof data.uptimeSeconds, "number");
  assert.equal(typeof data.manilaTime, "string");
  assert.match(data.manilaTime, /GMT\+8|PST|Philippine/i);
});
