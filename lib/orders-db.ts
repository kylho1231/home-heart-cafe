import fs from "fs/promises";
import path from "path";
import os from "os";
import type { CafeOrder, OrderStatus } from "./types.ts";

// Initial realistic seed orders to demonstrate full system in operation
const INITIAL_ORDERS: CafeOrder[] = [
  {
    id: "ord-seed-001",
    orderCode: "HHC-3104",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: "ready_for_pickup",
    pickupEstimatedMinutes: 10,
    customer: {
      role: "student",
      fullName: "Maria Clara Santos",
      lrn: "109823456712",
      gradeSection: "Grade 11 - STEM A",
      contactNumber: "09171234567",
      idPhotoUrl: "/products/straw-chees.webp",
      selfiePhotoUrl: "/products/straw-chees.webp",
    },
    items: [
      {
        id: "item-1",
        productId: "strawberry-cream-cheese",
        productName: "Strawberry Cream Cheese",
        category: "Cream Cheese Series",
        flavor: "Strawberry",
        size: "16 oz",
        sugarLevel: "75%",
        iceLevel: "Regular Ice",
        addBoba: true,
        quantity: 1,
        unitPrice: 69,
        subtotal: 69,
        notes: "Less sweet please, thank you!",
      },
      {
        id: "item-2",
        productId: "cheese-french-fries",
        productName: "Cheese French Fries",
        category: "Snacks",
        flavor: "Cheese",
        size: "Medium",
        sugarLevel: "100%",
        iceLevel: "Regular Ice",
        addBoba: false,
        quantity: 1,
        unitPrice: 40,
        subtotal: 40,
      },
    ],
    payment: {
      method: "gcash_downpayment",
      downPaymentAmount: 60,
      totalAmount: 109,
      gcashReferenceNumber: "9021839218491",
      paymentStatus: "verified_downpayment",
    },
    staffNotes: "Verified student ID and GCash downpayment ref. Drink ready on counter 1.",
  },
  {
    id: "ord-seed-002",
    orderCode: "HHC-3105",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    status: "preparing",
    pickupEstimatedMinutes: 15,
    customer: {
      role: "student",
      fullName: "Jose Rizal Mercado",
      lrn: "123456789012",
      gradeSection: "Grade 12 - HUMSS B",
      contactNumber: "09189876543",
      idPhotoUrl: "/products/okinawa-chees.webp",
      selfiePhotoUrl: "/products/okinawa-chees.webp",
    },
    items: [
      {
        id: "item-3",
        productId: "okinawa-cream-cheese",
        productName: "Okinawa Cream Cheese",
        category: "Cream Cheese Series",
        flavor: "Okinawa",
        size: "22 oz",
        sugarLevel: "50%",
        iceLevel: "Less Ice",
        addBoba: true,
        quantity: 1,
        unitPrice: 89,
        subtotal: 89,
      },
    ],
    payment: {
      method: "gcash_full",
      downPaymentAmount: 89,
      totalAmount: 89,
      gcashReferenceNumber: "1928374650192",
      paymentStatus: "paid_in_full",
    },
    staffNotes: "Full GCash received. Currently blending.",
  },
  {
    id: "ord-seed-003",
    orderCode: "HHC-3106",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    status: "pending_verification",
    pickupEstimatedMinutes: 10,
    customer: {
      role: "teacher_staff",
      fullName: "Prof. Maria Santos",
      department: "Science & Mathematics Dept",
      contactNumber: "09183334444",
      idPhotoUrl: "/products/straw-chees.webp",
      selfiePhotoUrl: "/products/straw-chees.webp",
    },
    items: [
      {
        id: "item-4",
        productId: "spanish-latte",
        productName: "Spanish Latte",
        category: "Coffee Series",
        flavor: "Spanish Latte",
        size: "16 oz",
        sugarLevel: "50%",
        iceLevel: "Regular Ice",
        addBoba: false,
        quantity: 2,
        unitPrice: 69,
        subtotal: 138,
      },
    ],
    payment: {
      method: "gcash_full",
      downPaymentAmount: 138,
      totalAmount: 138,
      gcashReferenceNumber: "9988776655443",
      paymentStatus: "downpayment_pending_verification",
    },
    staffNotes: "Faculty order awaiting ID verification.",
  },
];

// In-memory cache ensures fast retrieval and resilient fallback if filesystem is read-only (e.g. Vercel serverless)
let inMemoryOrders: CafeOrder[] = [...INITIAL_ORDERS];
let isLoaded = false;

// Determine writable data path (falls back to os.tmpdir on Vercel)
function getDataFilePath(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return path.join(os.tmpdir(), "home-heart-cafe-orders.json");
  }
  return path.join(process.cwd(), "data", "orders.json");
}

async function ensureDataFile(): Promise<string> {
  const filePath = getDataFilePath();
  try {
    await fs.access(filePath);
  } catch {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(INITIAL_ORDERS, null, 2), "utf-8");
    } catch {
      // Ignored if in read-only environment
    }
  }
  return filePath;
}

// 30-Day Data Retention pursuant to RA 10173 (Philippine Data Privacy Act)
const RETENTION_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export function anonymizeCustomerRecord(order: CafeOrder): CafeOrder {
  return {
    ...order,
    customer: {
      role: order.customer.role,
      fullName: `Customer #${order.orderCode.slice(-4)}`,
      lrn: undefined,
      gradeSection: undefined,
      department: undefined,
      employeeId: undefined,
      contactNumber: "••••••••",
      idPhotoUrl: undefined,
      selfiePhotoUrl: undefined,
      privacyConsent: order.customer.privacyConsent,
      anonymized: true,
      anonymizedAt: order.customer.anonymizedAt || new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };
}

function applyRetentionPolicy(ordersList: CafeOrder[]): { updated: CafeOrder[]; hasChanges: boolean } {
  const now = Date.now();
  let hasChanges = false;

  const updated = ordersList.map((ord) => {
    const ageMs = now - new Date(ord.createdAt).getTime();
    if (ageMs > RETENTION_PERIOD_MS && !ord.customer.anonymized) {
      hasChanges = true;
      return anonymizeCustomerRecord(ord);
    }
    return ord;
  });

  return { updated, hasChanges };
}

export async function getOrders(): Promise<CafeOrder[]> {
  try {
    const filePath = await ensureDataFile();
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      inMemoryOrders = parsed;
      isLoaded = true;
    }
  } catch {
    // Retain in-memory copy
  }

  // Enforce automatic 30-day retention cleanup
  const { updated, hasChanges } = applyRetentionPolicy(inMemoryOrders);
  if (hasChanges) {
    inMemoryOrders = updated;
    try {
      const filePath = await ensureDataFile();
      await fs.writeFile(filePath, JSON.stringify(inMemoryOrders, null, 2), "utf-8");
    } catch {
      // Ignored in read-only environment
    }
  }

  return [...inMemoryOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getOrderById(id: string): Promise<CafeOrder | null> {
  const orders = await getOrders();
  return (
    orders.find(
      (o) => o.id === id || o.orderCode.toLowerCase() === id.toLowerCase(),
    ) || null
  );
}

export async function anonymizeOrderCustomer(id: string): Promise<CafeOrder | null> {
  const orders = await getOrders();
  const index = orders.findIndex((o) => o.id === id || o.orderCode === id);
  if (index === -1) return null;

  const anonymized = anonymizeCustomerRecord(orders[index]);
  orders[index] = anonymized;
  inMemoryOrders = orders;

  try {
    const filePath = await ensureDataFile();
    await fs.writeFile(filePath, JSON.stringify(orders, null, 2), "utf-8");
  } catch {}

  return anonymized;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const orders = await getOrders();
  const initialLen = orders.length;
  const filtered = orders.filter((o) => o.id !== id && o.orderCode !== id);
  if (filtered.length === initialLen) return false;

  inMemoryOrders = filtered;

  try {
    const filePath = await ensureDataFile();
    await fs.writeFile(filePath, JSON.stringify(filtered, null, 2), "utf-8");
  } catch {}

  return true;
}

export function getManilaDateKey(isoDate?: string): string {
  const date = isoDate ? new Date(isoDate) : new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// Strict Order Lifecycle State Machine
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_verification: ["preparing", "rejected"],
  preparing: ["ready_for_pickup", "rejected"],
  ready_for_pickup: ["completed", "rejected"],
  completed: [], // Terminal state
  rejected: [], // Terminal state
};

export async function createOrder(
  data: Omit<CafeOrder, "id" | "orderCode" | "createdAt" | "updatedAt">,
): Promise<CafeOrder> {
  const orders = await getOrders();
  const todayKey = getManilaDateKey();

  // Calculate sequential daily sequence in Asia/Manila timezone
  const todayOrders = orders.filter((o) => getManilaDateKey(o.createdAt) === todayKey);
  const sequenceNum = String(todayOrders.length + 1).padStart(4, "0");
  const orderCode = `HC-${sequenceNum}`;
  const now = new Date().toISOString();

  const newOrder: CafeOrder = {
    ...data,
    id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    orderCode,
    createdAt: now,
    updatedAt: now,
  };

  orders.unshift(newOrder);
  inMemoryOrders = orders;

  try {
    const filePath = await ensureDataFile();
    await fs.writeFile(filePath, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.warn("Notice: File write skipped or failed in serverless context, stored in memory.");
  }

  return newOrder;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  rejectionReason?: string,
  staffNotes?: string,
  pickupMinutes?: number,
  markPaid?: boolean,
): Promise<CafeOrder | null> {
  const orders = await getOrders();
  const index = orders.findIndex((o) => o.id === id || o.orderCode === id);

  if (index === -1) return null;

  const order = orders[index];

  // Validate state transition (allow same status if updating notes/payment)
  if (status !== order.status) {
    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      throw new Error(
        `Invalid status transition from '${order.status}' to '${status}'. Allowed: ${allowed.join(", ") || "none"}`,
      );
    }
  }

  const updated: CafeOrder = {
    ...order,
    status,
    updatedAt: new Date().toISOString(),
    rejectionReason: rejectionReason !== undefined ? rejectionReason : order.rejectionReason,
    staffNotes: staffNotes !== undefined ? staffNotes : order.staffNotes,
    pickupEstimatedMinutes: pickupMinutes !== undefined ? pickupMinutes : order.pickupEstimatedMinutes,
    payment: {
      ...order.payment,
      paymentStatus:
        markPaid || status === "completed"
          ? "paid_in_full"
          : order.payment.paymentStatus,
    },
  };

  orders[index] = updated;
  inMemoryOrders = orders;

  try {
    const filePath = await ensureDataFile();
    await fs.writeFile(filePath, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.warn("Notice: File write skipped or failed in serverless context, updated in memory.");
  }

  return updated;
}

export async function getStats() {
  const orders = await getOrders();
  const totalOrders = orders.length;
  const pendingCount = orders.filter((o) => o.status === "pending_verification").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;
  const readyCount = orders.filter((o) => o.status === "ready_for_pickup").length;
  const completedOrders = orders.filter((o) => o.status === "completed" || o.status === "ready_for_pickup");
  const totalSales = completedOrders.reduce((sum, o) => sum + o.payment.totalAmount, 0);

  return {
    totalOrders,
    pendingCount,
    preparingCount,
    readyCount,
    totalSales,
  };
}
