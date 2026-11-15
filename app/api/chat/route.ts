import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Rate Limit: Max 20 chat messages per IP per 5 minutes to prevent spam/abuse
    const rateCheck = checkRateLimit(`chat:${ip}`, 20, 5 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "You are asking questions a bit too quickly. Please pause for a moment!",
          reply: "I'm pausing to take a breath! Please wait a couple minutes before asking again.",
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const rawMessage = body?.message;

    if (!rawMessage || typeof rawMessage !== "string" || !rawMessage.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required." },
        { status: 400 },
      );
    }

    // Cap message length to 300 characters
    if (rawMessage.trim().length > 300) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is too long. Please keep questions under 300 characters.",
          reply: "Could you ask a shorter question? I want to make sure I give you the best recommendation!",
        },
        { status: 400 },
      );
    }

    const query = rawMessage.toLowerCase().trim();

    // Context knowledge for Home Heart Cafe
    let reply = "";
    let suggestedActions: { label: string; action: string }[] = [];

    // 1. Promos & Discounts
    if (
      query.includes("promo") ||
      query.includes("discount") ||
      query.includes("offer") ||
      query.includes("deal") ||
      query.includes("bundle")
    ) {
      reply =
        "🎉 **Current Promos at Home ❤️ Cafe:**\n\n" +
        "1. **Barkada Bundle (Fruit Soda) — ₱135**\n" +
        "   • Get 3x 12oz Fruit Sodas + 1 Large French Fries (Save ₱12! Perfect for sharing with classmates).\n\n" +
        "2. **Barkada Bundle (Milk Tea) — ₱155**\n" +
        "   • Get 3x 12oz Milk Teas + 1 Large French Fries (Save ₱22!).\n\n" +
        "3. **Free Medium Fries Promo**\n" +
        "   • Buy drinks worth at least ₱200 in a single order and get **1 Free Medium Fries** (Choice of Salt, Cheese, or Onion)!\n\n" +
        "4. **Student & Teacher Loyalty Perk**\n" +
        "   • Verified students with valid 12-digit LRN get priority preparation during recess/lunch breaks!";
      suggestedActions = [
        { label: "View Barkada Bundles", action: "scrollToBundles" },
        { label: "What are bestsellers?", action: "askBestsellers" },
      ];
    }
    // 2. Events & Activities
    else if (
      query.includes("event") ||
      query.includes("activity") ||
      query.includes("happening") ||
      query.includes("schedule") ||
      query.includes("acoustic")
    ) {
      reply =
        "📅 **Upcoming Events at Home ❤️ Cafe:**\n\n" +
        "• 🎸 **Campus Acoustic Friday (Every Friday, 3:00 PM – 5:30 PM)**\n" +
        "  Enjoy student acoustic performances and chill study vibes while sipping your favorite drinks!\n\n" +
        "• 📚 **Study & Chill Lounge Hours (Daily, 4:00 PM – 6:00 PM)**\n" +
        "  Quiet hours with high-speed Wi-Fi, power outlets, and 10% off on second drink refills for students reviewing for exams!\n\n" +
        "• ☕ **Teacher's Coffee Appreciation (Wednesdays)**\n" +
        "  Faculty members enjoy a complimentary extra espresso shot or boba pearls on any 16oz/22oz beverage.\n\n" +
        "• 🎮 **Board Games & Cards Corner (Daily)**\n" +
        "  Free access to Scrabble, Uno, and Jenga while waiting for your order!";
      suggestedActions = [
        { label: "Check Promos", action: "askPromos" },
        { label: "Recommend a drink", action: "askRecommend" },
      ];
    }
    // 3. Best Sellers & Recommendations
    else if (
      query.includes("best") ||
      query.includes("seller") ||
      query.includes("recommend") ||
      query.includes("popular") ||
      query.includes("favorite") ||
      query.includes("must try") ||
      query.includes("top")
    ) {
      reply =
        "⭐ **Home ❤️ Cafe Top Bestsellers:**\n\n" +
        "1. 🍓 **Strawberry Cream Cheese (₱49 / ₱59 / ₱79)**\n" +
        "   • Luscious strawberry drink swirled with rich, velvety cream cheese walling. The #1 student favorite!\n\n" +
        "2. 🧋 **Okinawa Cream Cheese (₱49 / ₱59 / ₱79)**\n" +
        "   • Deep roasted brown sugar flavor balanced with savoury cream cheese.\n\n" +
        "3. 🍫 **Chuckie Float (₱50 / ₱60)**\n" +
        "   • Nostalgic chocolate goodness topped with creamy vanilla ice cream.\n\n" +
        "4. ☕ **Spanish Latte (₱69 / ₱79)**\n" +
        "   • Espresso with condensed milk sweetness — our #1 teacher and study-session pick!\n\n" +
        "5. 🍟 **Cheese French Fries (₱40 / ₱60)**\n" +
        "   • Crispy, freshly fried potatoes generously coated with savory cheese dust.";
      suggestedActions = [
        { label: "Try Strawberry Cream Cheese", action: "selectProduct:strawberry-cream-cheese" },
        { label: "Try Chuckie Float", action: "selectProduct:chuckie-float" },
      ];
    }
    // 4. Verification / Anti-scam explanation
    else if (
      query.includes("id") ||
      query.includes("lrn") ||
      query.includes("scam") ||
      query.includes("picture") ||
      query.includes("selfie") ||
      query.includes("verify")
    ) {
      reply =
        "🛡️ **Campus Identity & Pickup Verification:**\n\n" +
        "We love serving our campus community! Because each drink and batch of fries is prepared fresh upon order, verification helps us:\n" +
        "• **Confirm Legitimate Orders**: Protects both customers and the cafe kitchen from unclaimed food waste.\n" +
        "• **Secure Downpayments**: Ensures only the rightful student or faculty member claims the order.\n" +
        "• **Streamlined Break Pickups**: Orders are prepped ahead of break time so you can grab your drink and go!\n\n" +
        "**Verification Requirements:**\n" +
        "• **Students**: School ID photo, quick claim photo, and 12-digit DepEd LRN.\n" +
        "• **Teachers & Staff**: Employee ID photo, department name, and quick claim photo (no LRN required).\n\n" +
        "🔒 *Your uploaded verification details are kept strictly confidential and used solely for counter pickup verification.*";
      suggestedActions = [
        { label: "Start Order Now", action: "openCheckout" },
        { label: "See Menu", action: "scrollToMenu" },
      ];
    }
    // 5. Payment & GCash
    else if (
      query.includes("gcash") ||
      query.includes("pay") ||
      query.includes("downpayment") ||
      query.includes("cash") ||
      query.includes("price")
    ) {
      reply =
        "💳 **Payment & GCash Instructions:**\n\n" +
        "• **GCash Down Payment (Recommended)**:\n" +
        "  - Pay 50% or 100% via GCash to **0917-889-CAFE (HOME HEART CAFE)**.\n" +
        "  - Enter your 13-digit Reference Number & upload the screenshot during checkout.\n" +
        "  - This guarantees your order is queued right away!\n\n" +
        "• **Pay at Counter (Cash)**:\n" +
        "  - Pay in cash when you pick up at the counter with verified campus ID.";
      suggestedActions = [
        { label: "Order & Pay via GCash", action: "openCheckout" },
        { label: "Ask about Promos", action: "askPromos" },
      ];
    }
    // General default friendly greeting / help
    else {
      reply =
        "👋 **Kumusta! Welcome to Home ❤️ Cafe!**\n\n" +
        "I'm **Home**, your digital barista concierge. I can help you with:\n" +
        "• 🎁 **Promos & Discounts** (Barkada Bundles, Free Fries)\n" +
        "• 📅 **Campus Cafe Events** (Acoustic Friday, Study Lounge)\n" +
        "• ☕ **Drink Recommendations** based on what flavors you crave\n" +
        "• 📋 **Campus Identity & Pickup Verification Guide**\n\n" +
        "How can I brighten your day today?";
      suggestedActions = [
        { label: "Show Promos", action: "askPromos" },
        { label: "Top Bestsellers", action: "askBestsellers" },
        { label: "Upcoming Events", action: "askEvents" },
      ];
    }

    return NextResponse.json({
      success: true,
      reply,
      suggestedActions,
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process chat query",
        reply: "Oops, something went wrong. Feel free to ask me again!",
      },
      { status: 500 },
    );
  }
}
