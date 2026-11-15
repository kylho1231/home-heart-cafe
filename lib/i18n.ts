export type Language = "kr" | "tl" | "en";

export interface Translations {
  // Navigation & Brand
  tagline: string;
  campusFavorites: string;
  menu: string;
  bundles: string;
  newsEvents: string;
  trackOrder: string;
  askHearty: string;
  viewCart: string;
  cart: string;
  emptyCart: string;

  // Hero
  heroHeadline: string;
  heroSubtext: string;
  orderNow: string;
  trackOrderArrow: string;
  promoBanner: string;
  idVerificationNote: string;
  quickPickup: string;

  // Campus Favorites
  favoritesSubtitle: string;
  startsAt: string;
  add: string;
  customize: string;
  soldOut: string;

  // Menu Section
  allMenu: string;
  searchPlaceholder: string;
  showingItems: string;
  foundItems: string;
  noMatchTitle: string;
  noMatchSubtext: string;
  clearSearch: string;
  shuffle: string;
  autoScroll: string;

  // Customization Sheet
  customizeTitle: string;
  size: string;
  sweetness: string;
  ice: string;
  addons: string;
  addBoba: string;
  addCreamCheese: string;
  cancel: string;
  addToCart: string;

  // Barkada Bundles
  bundleTitle: string;
  bundleSubtext: string;
  step1BundleType: string;
  step2ChooseDrinks: string;
  step3ChooseFries: string;
  step4Summary: string;
  drinkSelected: string;
  chooseFriesFlavor: string;
  addBundleToCart: string;

  // News & Events Carousel
  newsTitle: string;
  newsSubtitle: string;
  newsBadge: string;

  // Checkout & Student Verification
  checkoutTitle: string;
  customerDetails: string;
  fullName: string;
  phoneNumber: string;
  iamA: string;
  student: string;
  teacher: string;
  walkIn: string;
  gradeLevel: string;
  gradePlaceholder: string;
  lrnLabel: string;
  lrnHelp: string;
  grade1FriendlyTip: string;
  uploadId: string;
  uploadIdHelp: string;
  paymentMethod: string;
  gcash: string;
  cashAtCounter: string;
  placeOrder: string;
  privacyNotice: string;

  // Order Tracker
  trackingTitle: string;
  orderNumber: string;
  checkStatus: string;
  stepReceived: string;
  stepVerified: string;
  stepPreparing: string;
  stepReady: string;
  readyBanner: string;
  pollingIndicator: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  // Kinaray-a (Western Visayas / Antique / Panay)
  kr: {
    tagline: "Kada higop may kalipay sa tagipusuon",
    campusFavorites: "Mga Paborito sa Kampus",
    menu: "Menu kang Ilimnon",
    bundles: "Barkada Bundles",
    newsEvents: "Mga Balita kag Hinimuan",
    trackOrder: "Lantawon ang Order",
    askHearty: "Pamangkuta si Hearty",
    viewCart: "Lantawon ang Cart",
    cart: "Imo Cart",
    emptyCart: "Wara pa sulod ang imo cart.",

    heroHeadline: "Ang imo masunod nga kalipay sa kada higop.",
    heroSubtext: "Handcrafted milk tea, fruit soda, kape, kag mainit nga fries nga ginhanda para sa recess kag breaks.",
    orderNow: "Mag-order Karon",
    trackOrderArrow: "Lantawon ang Order →",
    promoBanner: "Magbakal ₱200 nga ilimnon, may LIBRE nga Medium Fries! 🍟",
    idVerificationNote: "Ginasiguro ang ID kang estudyante kag manunudlo (Protektado sa RA 10173)",
    quickPickup: "Madasig nga pagkuha sa counter",

    favoritesSubtitle: "Pinakapaborito kang mga estudyante kag manunudlo",
    startsAt: "Gasugod sa",
    add: "Idugang",
    customize: "Pilion ang Timpla",
    soldOut: "Naubos Na",

    allMenu: "Kompleto nga Menu",
    searchPlaceholder: "Pangitaa ang ilimnon ukon panyapon...",
    showingItems: "Gapakita kang",
    foundItems: "Nakita nga",
    noMatchTitle: "Wara ti nakita nga ilimnon sa",
    noMatchSubtext: "Testingi pangita ang 'boba', 'cheese', ukon 'kape'!",
    clearSearch: "Kakasun ang Gin-search",
    shuffle: "Pasunod-sunod",
    autoScroll: "Auto-scroll",

    customizeTitle: "Pilion ang Gusto nga Timpla",
    size: "Kadakuon (Size)",
    sweetness: "Katamb-is (Sugar Level)",
    ice: "Kadamuon kang Yelo (Ice Level)",
    addons: "Dugang nga Panakot (Add-ons)",
    addBoba: "Dugang nga Boba Pearls (+₱10)",
    addCreamCheese: "Dugang nga Cream Cheese (+₱15)",
    cancel: "Kanselahon",
    addToCart: "Ibutang sa Cart",

    bundleTitle: "Barkada Saver Bundles",
    bundleSubtext: "Makatipid para sa mag-ulutod kag mag-abyan! 3 ka ilimnon + 1 ka Large Fries.",
    step1BundleType: "Hingpit 1: Pili-a ang Klase kang Bundle",
    step2ChooseDrinks: "Hingpit 2: Pili kang 3 ka Ilimnon (12 oz)",
    step3ChooseFries: "Hingpit 3: Pili kang Rasa kang Large Fries",
    step4Summary: "Hingpit 4: Kabilugan kag Pagdugang sa Cart",
    drinkSelected: "Napili",
    chooseFriesFlavor: "Pili-a ang rasa kang imo fries:",
    addBundleToCart: "Idugang ang Bundle sa Cart",

    newsTitle: "Mga Balita, Hitabo kag Litrato sa Kampus",
    newsSubtitle: "Tanan nga mga ginahiwat sa Home ❤️ Cafe sa isa ka lugar.",
    newsBadge: "Balita & Hitabo sa Kampus",

    checkoutTitle: "Kompirmasyon kang Order",
    customerDetails: "Impormasyon kang Manugbakal",
    fullName: "Kumpleto nga Pangaran *",
    phoneNumber: "Numero kang Cellphone *",
    iamA: "Ako isa ka:",
    student: "Estudyante",
    teacher: "Manunudlo / Staff",
    walkIn: "Bisita / Walk-in",
    gradeLevel: "Grado ukon Taon (Grade Level) *",
    gradePlaceholder: "Pinduta ang imo grado sa idalum ukon isulat",
    lrnLabel: "12-Digit LRN (Learner Reference Number) *",
    lrnHelp: "Makita sa imo School ID ukon Report Card.",
    grade1FriendlyTip: "Para sa Kinder kag Grade 1: Pinduta lang ang 'Kinder' ukon 'Grade 1' sa idalum!",
    uploadId: "Litrato kang School ID *",
    uploadIdHelp: "Ginagamit lamang agud masiguro nga taga-kampus ka. Ginapapas matapos ang 30 ka adlaw suno sa RA 10173.",
    paymentMethod: "Paagi kang Pagbayad",
    gcash: "GCash (Downpayment ukon Kabilugan)",
    cashAtCounter: "Karta / Cash sa Counter",
    placeOrder: "Ipadala ang Order",
    privacyNotice: "Nagapasugot ako sa pagsulundan kang RA 10173 para sa pagtipig kang datos.",

    trackingTitle: "Subaybayan ang Imo Order",
    orderNumber: "Numero kang Order (e.g. HC-0004)",
    checkStatus: "Lantawon ang Kahimtangan",
    stepReceived: "Nabatun",
    stepVerified: "Narekisa",
    stepPreparing: "Ginahanda",
    stepReady: "Handa Na!",
    readyBanner: "HANDA NA KUHAON! Ipakita ang numero sa counter.",
    pollingIndicator: "Gabag-o kada 12 segundos",
  },

  // Tagalog / Filipino
  tl: {
    tagline: "Sips of happiness in every cup",
    campusFavorites: "Campus Favorites",
    menu: "Buong Menu",
    bundles: "Barkada Bundles",
    newsEvents: "Balita at Kaganapan",
    trackOrder: "Track Order",
    askHearty: "Ask Hearty",
    viewCart: "Tingnan ang Cart",
    cart: "Iyong Cart",
    emptyCart: "Walang laman ang iyong cart.",

    heroHeadline: "Your next happy sip starts here.",
    heroSubtext: "Handcrafted milk tea, fruit sodas, iced coffee, at crispy golden fries na inihanda para sa campus breaks.",
    orderNow: "Order na Ngayon",
    trackOrderArrow: "Track order →",
    promoBanner: "Spend ₱200 on drinks, get free Medium Fries! 🍟",
    idVerificationNote: "Student & Faculty ID verification (RA 10173 protected)",
    quickPickup: "Mabilis na counter pickup",

    favoritesSubtitle: "Most ordered by students and teachers",
    startsAt: "Starts at",
    add: "+ Add",
    customize: "+ Customize",
    soldOut: "Sold Out",

    allMenu: "Complete Cafe Menu",
    searchPlaceholder: "Maghanap ng inumin o snacks...",
    showingItems: "Ipinapakita ang",
    foundItems: "Nahanap na",
    noMatchTitle: "Walang inumin na tumutugma sa",
    noMatchSubtext: "Subukang maghanap ng 'boba', 'cheese', o 'coffee'!",
    clearSearch: "I-clear ang Search",
    shuffle: "I-shuffle",
    autoScroll: "Auto-scroll",

    customizeTitle: "Piliin ang Timpla at Sukat",
    size: "Sukat (Size)",
    sweetness: "Tamisa (Sweetness)",
    ice: "Yelo (Ice Level)",
    addons: "Dagdag (Add-ons)",
    addBoba: "Dagdag na Boba (+₱10)",
    addCreamCheese: "Dagdag na Cream Cheese (+₱15)",
    cancel: "Kanselahin",
    addToCart: "Idagdag sa Cart",

    bundleTitle: "Barkada Saver Bundles",
    bundleSubtext: "Makatipid kasama ang barkada! 3 drinks + 1 Large French Fries.",
    step1BundleType: "Step 1: Piliin ang Uri ng Bundle",
    step2ChooseDrinks: "Step 2: Pumili ng 3 Inumin (12 oz)",
    step3ChooseFries: "Step 3: Piliin ang Flavor ng Large Fries",
    step4Summary: "Step 4: Buod at Idagdag sa Cart",
    drinkSelected: "Napili",
    chooseFriesFlavor: "Piliin ang flavor ng iyong fries:",
    addBundleToCart: "Idagdag ang Bundle sa Cart",

    newsTitle: "Balita, Kaganapan at Larawan sa Kampus",
    newsSubtitle: "Lahat ng anunsyo at aktibidad sa Home ❤️ Cafe sa iisang lugar.",
    newsBadge: "Campus News & Events",

    checkoutTitle: "Checkout & Verification",
    customerDetails: "Impormasyon ng Customer",
    fullName: "Buong Pangalan *",
    phoneNumber: "Contact Number *",
    iamA: "Ako ay isang:",
    student: "Estudyante",
    teacher: "Guro / Staff",
    walkIn: "Walk-in Customer",
    gradeLevel: "Baitang o Taon (Grade Level) *",
    gradePlaceholder: "Pindutin ang baitang sa ibaba o i-type",
    lrnLabel: "12-Digit LRN (Learner Reference No.) *",
    lrnHelp: "Makikita sa iyong School ID o Card.",
    grade1FriendlyTip: "Para sa Kinder at Grade 1: Pindutin lamang ang 'Kinder' o 'Grade 1' button sa ibaba!",
    uploadId: "Mag-upload ng School ID *",
    uploadIdHelp: "Ginagamit lamang para sa seguridad ng order at binubura matapos ang 30 araw ayon sa RA 10173.",
    paymentMethod: "Paraan ng Pagbabayad",
    gcash: "GCash (Downpayment o Full)",
    cashAtCounter: "Cash sa Counter",
    placeOrder: "Ipadala ang Order",
    privacyNotice: "Sumasang-ayon ako sa RA 10173 Data Privacy Act.",

    trackingTitle: "Subaybayan ang Iyong Order",
    orderNumber: "Order Number (hal. HC-0004)",
    checkStatus: "Tingnan ang Status",
    stepReceived: "Natanggap",
    stepVerified: "Na-verify",
    stepPreparing: "Inihahanda",
    stepReady: "Handa na!",
    readyBanner: "HANDA NA PARA SA PICKUP! Ipakita ang order number sa counter.",
    pollingIndicator: "Kusang nag-a-update kada 12s",
  },

  // English
  en: {
    tagline: "Sips of happiness in every cup",
    campusFavorites: "Campus Favorites",
    menu: "Full Menu",
    bundles: "Barkada Bundles",
    newsEvents: "News & Events",
    trackOrder: "Track Order",
    askHearty: "Ask Hearty",
    viewCart: "View Cart",
    cart: "Your Cart",
    emptyCart: "Your cart is empty.",

    heroHeadline: "Your next happy sip starts here.",
    heroSubtext: "Handcrafted milk tea, sparkling fruit sodas, iced coffee, and crispy golden fries prepared for your breaks.",
    orderNow: "Order Now",
    trackOrderArrow: "Track order →",
    promoBanner: "Spend ₱200 on drinks, get free Medium Fries! 🍟",
    idVerificationNote: "Student & Faculty ID verification (RA 10173 protected)",
    quickPickup: "Quick counter pickup",

    favoritesSubtitle: "Most ordered by students and teachers",
    startsAt: "Starts at",
    add: "+ Add",
    customize: "+ Customize",
    soldOut: "Sold Out",

    allMenu: "Complete Cafe Menu",
    searchPlaceholder: "Search drinks & snacks...",
    showingItems: "Showing",
    foundItems: "Found",
    noMatchTitle: "No drinks match",
    noMatchSubtext: "Try searching for 'boba', 'cheese', or 'coffee'!",
    clearSearch: "Clear Search",
    shuffle: "Shuffle",
    autoScroll: "Auto-scroll",

    customizeTitle: "Customize Your Drink",
    size: "Size",
    sweetness: "Sweetness",
    ice: "Ice Level",
    addons: "Add-ons",
    addBoba: "Add Boba Pearls (+₱10)",
    addCreamCheese: "Add Cream Cheese (+₱15)",
    cancel: "Cancel",
    addToCart: "Add to Cart",

    bundleTitle: "Barkada Saver Bundles",
    bundleSubtext: "Save when ordering together! 3 drinks + 1 Large French Fries.",
    step1BundleType: "Step 1: Choose Bundle Type",
    step2ChooseDrinks: "Step 2: Pick 3 Drinks (12 oz)",
    step3ChooseFries: "Step 3: Pick Large Fries Flavor",
    step4Summary: "Step 4: Summary & Add to Cart",
    drinkSelected: "Selected",
    chooseFriesFlavor: "Pick your fries flavor:",
    addBundleToCart: "Add Bundle to Cart",

    newsTitle: "Campus News, Events & Moments",
    newsSubtitle: "All campus activities and special announcements in one single place.",
    newsBadge: "Campus News & Atmosphere",

    checkoutTitle: "Checkout & Verification",
    customerDetails: "Customer Information",
    fullName: "Full Name *",
    phoneNumber: "Contact Phone Number *",
    iamA: "I am a:",
    student: "Student",
    teacher: "Teacher / Faculty",
    walkIn: "Campus Walk-in",
    gradeLevel: "Grade Level & Section *",
    gradePlaceholder: "Tap your grade level below or type section",
    lrnLabel: "12-Digit LRN (Learner Reference No.) *",
    lrnHelp: "Found on your School ID or report card.",
    grade1FriendlyTip: "For Kinder & Grade 1: Simply tap the 'Kinder' or 'Grade 1' button below!",
    uploadId: "Upload School ID Photo *",
    uploadIdHelp: "Used only to verify campus membership. Deleted after 30 days under RA 10173.",
    paymentMethod: "Payment Method",
    gcash: "GCash (Downpayment or Full)",
    cashAtCounter: "Cash at Counter",
    placeOrder: "Place Order",
    privacyNotice: "I agree to RA 10173 Data Privacy Act terms.",

    trackingTitle: "Track Your Order",
    orderNumber: "Order Number (e.g. HC-0004)",
    checkStatus: "Check Status",
    stepReceived: "Received",
    stepVerified: "Verified",
    stepPreparing: "Preparing",
    stepReady: "Ready for Pickup",
    readyBanner: "READY FOR PICKUP! Show your order code at the counter.",
    pollingIndicator: "Auto-updating every 12s",
  },
};
