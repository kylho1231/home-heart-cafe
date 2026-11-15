# Home ❤️ Cafe — Campus Cafe Ordering System

> "Sips of happiness in every cup."

A modern, secure, and production-ready campus cafe web application built with **Next.js 16.4 (App Router & Turbopack)**, **React 19**, and **Tailwind CSS v4**. Deployed live on Vercel at [https://home-heart-cafe.vercel.app](https://home-heart-cafe.vercel.app).

---

## ☕ Key Features

### 1. Customer Ordering & Interactive Showcase
- **50-Item Menu across 7 Categories**: Cream Cheese Series, Milk Tea Series, Milky Bomb Tea, Fruit Soda, Yakult Fruit Soda, Coffee Series, Float Series, and Snacks (French Fries).
- **Interactive 3D Drink Cup Preview**: Real-time rendering of cup size, flavor gradients, ice levels, sugar sweetness, and boba/cream cheese layers.
- **Barkada Saver Bundles**: Interactive bundle builder (3 drinks + 1 Large French Fries) with server-enforced pricing (₱135 for Fruit Soda, ₱155 for Milk Tea).
- **Free Medium Fries Promo**: Server-enforced promotional rule unlocking 1x Free Medium Fries on ala-carte drink spend of ₱200 or more (bundles and fries excluded from threshold).
- **Campus Anti-Scam Identity Verification**: Guest checkout (no account needed). Students provide Name, Grade & Section, Contact, 12-digit DepEd LRN, and optional photo ID. Faculty/teachers can check out under the Teacher/Staff role without requiring an LRN.
- **Ask Hearty (AI Barista Concierge)**: Digital barista concierge answering customer questions about promos, campus events, top bestsellers, and ID verification rationale.
- **Audio Chimes & Sound Toggle**: Lightweight Web Audio API chimes on order events with a global mute toggle in the navigation header.
- **Mobile Sticky Cart**: Persistent mobile quick-bar showing real-time item count and subtotal for effortless thumb-first checkout.

### 2. Philippine Data Privacy Act (RA 10173) Compliance
- **Mandatory Consent Checkbox**: Clear privacy policy notice at checkout detailing why ID is collected (counter pickup verification only) and how it is secured.
- **Data Minimization**: Facial selfies are optional when school ID photo is attached.
- **Masked Credentials**: Student LRNs are masked by default (`••••••••1234`) in the Admin Portal and can only be unmasked on-demand by authorized cashiers.
- **Automated Retention Scrub**: 30-day retention rule scrubs all customer personal data (LRN, names, photos) while preserving anonymized financial totals for reporting.
- **Cashier Data Purge**: Cashiers can instantly trigger an RA 10173 data purge on any order.

### 3. Kitchen & Store Admin Operations (`/admin`)
- **Server-Side Authentication**: PIN-gated login verified via HMAC-SHA256 signed `httpOnly`, `secure`, `sameSite: lax` session cookies. Rate limited with 15-minute lockouts after 5 failed attempts.
- **Live Kitchen Queue**: Real-time status pipeline (`Pending Verification` → `Preparing` → `Ready for Pickup` → `Completed`).
- **Sound Alerts on New Orders**: Audio bell notifies staff when a student order arrives.
- **Stock & Sold-Out Toggles**: Instantly disable or re-enable any of the 50 menu items when ingredients run out.
- **Search & Filters**: Search queue by Order Code (`#HC-0042`), Student Name, or LRN.
- **Sales Reporting & CSV Export**: Real-time sales KPIs and 1-click Manila-timezone CSV export.

---

## 🛠 Tech Stack

- **Framework**: Next.js 16.4.6 (App Router, Turbopack, Server Actions & Route Handlers)
- **Frontend**: React 19.3.0, Tailwind CSS 4.3.3, Lucide React Icons
- **Validation**: Zod (strict schema validation on all API endpoints)
- **Security**: Constant-time PIN equality, HMAC-SHA256 session tokens, sliding-window rate limiters, idempotent order submissions, strict CSP security headers
- **Timezone**: `Asia/Manila` (PST / UTC+8) standard across daily sequential order numbers (`HC-0001`) and financial records

---

## ⚙️ Environment Variables

Create a `.env.local` file for local development or set these variables in the **Vercel Project Settings**:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `ADMIN_PIN` | 4–8 digit PIN used by cashiers to log in to `/admin` | `1234` |
| `SESSION_SECRET` | 32+ character random secret for signing admin session tokens | `home-heart-cafe-super-secret-key-32chars-min-prod` |
| `TZ` | System timezone (Philippine Standard Time) | `Asia/Manila` |
| `NEXT_PUBLIC_APP_URL` | Public canonical application URL | `https://home-heart-cafe.vercel.app` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18+ (Node.js 20+ recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/kylho1231/home-heart-cafe.git
cd home-heart-cafe

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Running Locally

```bash
# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the customer store, or [http://localhost:3000/admin](http://localhost:3000/admin) for the kitchen admin portal.

### Running Automated Tests

```bash
# Execute unit and integration test suite
npm test
```

### Production Build

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

---

## 📋 API Reference

- `GET /api/health` — System health check, uptime, Manila timezone, and storage readiness.
- `GET /api/menu/availability` — Returns currently unavailable/sold-out item slugs.
- `GET /api/admin/menu/availability` — (Admin only) Lists all 50 products with stock status.
- `PATCH /api/admin/menu/availability` — (Admin only) Toggle sold-out state for a product.
- `POST /api/orders` — Submits a customer order with server price recalculation and idempotency check.
- `GET /api/orders/[id]` — Customer order lookup (requires matching name or contact number).
- `PATCH /api/orders/[id]` — (Admin only) Updates order status or marks balance as paid.
- `DELETE /api/orders/[id]?action=anonymize` — (Admin only) Purges customer PII under RA 10173.
- `POST /api/chat` — Rate-limited AI Barista concierge conversational endpoint.
- `POST /api/admin/login` — PIN authentication issuing signed httpOnly session cookie.
- `POST /api/admin/logout` — Revokes session cookie.
- `GET /api/admin/me` — Checks active admin authentication status.

---

## 🔒 Security & Data Privacy

1. **Zero Client Trust**: Totals, promotions, and bundle pricing are strictly recalculated on the server.
2. **Search Engine Shielding**: `/admin` is protected by `noindex, nofollow` meta tags and blocked in `robots.txt`.
3. **No Leaked Secrets**: All sensitive secrets are kept server-side.
4. **Idempotent Order Submissions**: Client sends a unique idempotency key with every checkout request to prevent double charges on mobile network drops.

---

## 📄 License

Proprietary © 2026 Home Heart Cafe. All rights reserved.
