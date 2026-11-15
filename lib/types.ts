export type OrderStatus =
  | "pending_verification"
  | "preparing"
  | "ready_for_pickup"
  | "completed"
  | "rejected";

export type CustomerRole = "student" | "teacher_staff";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  flavor: string;
  size: string;
  sugarLevel: "0%" | "25%" | "50%" | "75%" | "100%";
  iceLevel: "No Ice" | "Less Ice" | "Regular Ice" | "Extra Ice";
  addBoba: boolean;
  addCreamCheese?: boolean;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
  bundleName?: string;
  bundleSelections?: string[];
}

export interface CustomerVerification {
  role: CustomerRole;
  fullName: string;
  lrn?: string; // 12-digit LRN for students
  gradeSection?: string; // Grade & Section for students
  department?: string; // Faculty / Department for teachers & staff
  employeeId?: string; // Optional Faculty ID for teachers
  contactNumber: string;
  idPhotoUrl: string; // Base64 or uploaded URL
  selfiePhotoUrl: string; // Base64 or uploaded selfie photo
  privacyConsent?: boolean; // Data Privacy Act (RA 10173) consent flag
}

export interface PaymentInfo {
  method: "gcash_downpayment" | "gcash_full" | "counter_cash";
  downPaymentAmount: number;
  totalAmount: number;
  gcashReferenceNumber?: string;
  receiptScreenshotUrl?: string;
  paymentStatus: "unpaid" | "downpayment_pending_verification" | "verified_downpayment" | "paid_in_full";
}

export interface CafeOrder {
  id: string;
  orderCode: string; // e.g. HHC-4921
  createdAt: string; // ISO string
  updatedAt: string;
  status: OrderStatus;
  rejectionReason?: string;
  customer: CustomerVerification;
  items: OrderItem[];
  payment: PaymentInfo;
  pickupEstimatedMinutes: number;
  staffNotes?: string;
}

export interface CafePromo {
  id: string;
  title: string;
  badge: string;
  description: string;
  code?: string;
  discountSummary: string;
  condition: string;
}

export interface CafeEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  highlight: string;
}
