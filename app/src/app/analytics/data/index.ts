// ─── DAILY CHART DATA (seeded, not random per render) ───────────────────────

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export const dailyData = Array.from({ length: 30 }, (_, i) => {
  const r = (s: number) => seededRandom(i * 100 + s);
  const visitors = Math.round(180 + Math.sin(i * 0.4) * 80 + r(1) * 60 + (i > 20 ? i * 3 : 0));
  const newV = Math.round(visitors * (0.6 + r(2) * 0.15));
  const revenue = Math.round(40 + Math.sin(i * 0.5) * 30 + r(3) * 40 + (i > 25 ? 60 : 0));
  const bounceRate = Math.round(75 + Math.sin(i * 0.3) * 12 + r(4) * 8);
  const sessionTime = Math.round(100 + Math.sin(i * 0.6) * 50 + r(5) * 40);
  const convRate = +((Math.round(visitors * (0.003 + r(6) * 0.008))) / visitors * 100).toFixed(2);
  return {
    date: `${String(i + 1).padStart(2, "0")} Jun`, day: i + 1, visitors, newV, ret: visitors - newV,
    revenue, pageviews: Math.round(visitors * (1.2 + r(7) * 0.4)),
    rpv: +(revenue / visitors).toFixed(3), bounceRate, sessionTime,
    sessionLabel: `${Math.floor(sessionTime / 60)}m ${sessionTime % 60}s`,
    convRate, conversions: Math.round(visitors * convRate / 100),
    refunds: Math.round(r(8) > 0.7 ? revenue * 0.1 : 0), newRevenue: revenue,
  };
});

// ─── SOURCES ────────────────────────────────────────────────────────────────

export const channelData = [
  { name: "Referral", visitors: 4600, revenue: 2000, color: "#3b82f6", sources: [{ n: "marclou.com", p: 37 }, { n: "trustmrr.com", p: 35 }, { n: "indiepa.ge", p: 12 }] },
  { name: "Organic social", visitors: 1700, revenue: 676, color: "#60a5fa", sources: [{ n: "X", p: 55 }, { n: "YouTube", p: 30 }, { n: "LinkedIn", p: 15 }] },
  { name: "Direct", visitors: 1400, revenue: 1195, color: "#93c5fd", sources: [] },
  { name: "Organic search", visitors: 951, revenue: 1443, color: "#bfdbfe", sources: [{ n: "Google", p: 88 }, { n: "Bing", p: 12 }] },
  { name: "Newsletter", visitors: 269, revenue: 169, color: "#dbeafe", sources: [] },
  { name: "Affiliate", visitors: 160, revenue: 598, color: "#eff6ff", sources: [] },
  { name: "A.I.", visitors: 15, revenue: 0, color: "#f0f0f0", sources: [{ n: "ChatGPT", p: 80 }, { n: "Claude", p: 20 }] },
  { name: "Email", visitors: 3, revenue: 0, color: "#fafafa", sources: [] },
];

export const referrerData = [
  { name: "google.com", visitors: 1920, revenue: 1443, icon: "🔍", rpv: "$0.75", conv: "0.34%" },
  { name: "marclou.com", visitors: 1900, revenue: 897, icon: "🟧", rpv: "$0.47", conv: "0.06%" },
  { name: "trustmrr.com", visitors: 1600, revenue: 468, icon: "⭐", rpv: "$0.29", conv: "0.12%" },
  { name: "Direct/None", visitors: 1410, revenue: 1195, icon: "⊕", rpv: "$0.85", conv: "0.42%" },
  { name: "X", visitors: 1340, revenue: 338, icon: "𝕏", rpv: "$0.25", conv: "0.18%" },
  { name: "github.com", visitors: 574, revenue: 299, icon: "🐙", rpv: "$0.52", conv: "0.29%" },
  { name: "youtube.com", visitors: 272, revenue: 338, icon: "▶", rpv: "$1.24", conv: "0.61%" },
  { name: "shipfa.st", visitors: 230, revenue: 598, icon: "⚡", rpv: "$2.60", conv: "1.12%" },
  { name: "indiepage", visitors: 106, revenue: 0, icon: "🔗", rpv: "$0", conv: "0%" },
  { name: "linkedin.com", visitors: 103, revenue: 0, icon: "in", rpv: "$0", conv: "0%" },
  { name: "newsletter.marclou.com", visitors: 92, revenue: 0, icon: "✉", rpv: "$0", conv: "0%" },
  { name: "reddit.com", visitors: 21, revenue: 0, icon: "🟠", rpv: "$0", conv: "0%" },
];

export const campaignData = [
  { name: "?ref=indiepage", visitors: 520, revenue: 598, icon: "🏷", rpv: "$1.15", conv: "0.19%" },
  { name: "?ref=shipfast_pricing", visitors: 380, revenue: 468, icon: "🏷", rpv: "$1.23", conv: "0.26%" },
  { name: "?utm_source=trustmrr", visitors: 290, revenue: 299, icon: "🏷", rpv: "$1.03", conv: "0.34%" },
  { name: "?utm_source=newsletter.marclou.com&utm_medium=email&utm_campaign=weekly", visitors: 240, revenue: 299, icon: "🏷", rpv: "$1.25", conv: "0.42%" },
  { name: "?ref=datafast-realtime-map", visitors: 180, revenue: 299, icon: "🏷", rpv: "$1.66", conv: "0.56%" },
  { name: "?ref=logofast", visitors: 120, revenue: 0, icon: "🏷", rpv: "$0", conv: "0%" },
  { name: "?via=asit", visitors: 95, revenue: 0, icon: "🏷", rpv: "$0", conv: "0%" },
  { name: "?ref=trustmrr", visitors: 49, revenue: 0, icon: "🏷", rpv: "$0", conv: "0%" },
];

export const campaignFilterOptions = [
  { name: "All", count: 4900 },
  { name: "?ref=", count: 2900 },
  { name: "?utm_source=", count: 1800 },
  { name: "?utm_medium=", count: 1800 },
  { name: "?utm_campaign=", count: 1800 },
  { name: "?via=", count: 244 },
  { name: "?utm_term=", count: 1 },
  { name: "?utm_content=", count: 1 },
];

export const keywordData = [
  { name: "codefast review", visitors: 652, revenue: 649, icon: "🔍", position: "1st", impressions: 1248, clicks: 652, ctr: "52.2%", rpv: "$1.00", conv: "0.15%" },
  { name: "codefast", visitors: 652, revenue: 419, icon: "🔍", position: "1st", impressions: 1248, clicks: 652, ctr: "52.2%", rpv: "$0.64", conv: "0.10%" },
  { name: "codefast reviews", visitors: 320, revenue: 216, icon: "🔍", position: "2nd", impressions: 890, clicks: 320, ctr: "36%", rpv: "$0.68", conv: "0.09%" },
  { name: "code fast", visitors: 180, revenue: 66, icon: "🔍", position: "3rd", impressions: 620, clicks: 180, ctr: "29%", rpv: "$0.37", conv: "0.06%" },
  { name: "marc lou", visitors: 140, revenue: 29, icon: "🔍", position: "1st", impressions: 340, clicks: 140, ctr: "41%", rpv: "$0.21", conv: "0.07%" },
  { name: "codefast marc lou", visitors: 46, revenue: 10, icon: "🔍", position: "1st", impressions: 89, clicks: 46, ctr: "51.7%", rpv: "$0.22", conv: "0.07%" },
  { name: "codefast course", visitors: 88, revenue: 0, icon: "🔍", position: "2nd", impressions: 200, clicks: 88, ctr: "44%", rpv: "$0", conv: "0%" },
  { name: "fast code", visitors: 32, revenue: 0, icon: "🔍", position: "5th", impressions: 120, clicks: 32, ctr: "26.7%", rpv: "$0", conv: "0%" },
  { name: "marclou", visitors: 28, revenue: 5, icon: "🔍", position: "2nd", impressions: 65, clicks: 28, ctr: "43%", rpv: "$0.18", conv: "0.04%" },
];

// ─── GEOGRAPHY ──────────────────────────────────────────────────────────────

export const countryData = [
  { name: "United States", code: "US", visitors: 1720, revenue: 1664, rpv: "$0.98", conv: "0.35%" },
  { name: "France", code: "FR", visitors: 624, revenue: 598, rpv: "$0.96", conv: "0.48%" },
  { name: "United Kingdom", code: "GB", visitors: 471, revenue: 299, rpv: "$0.63", conv: "0.21%" },
  { name: "Germany", code: "DE", visitors: 446, revenue: 468, rpv: "$1.05", conv: "0.45%" },
  { name: "Morocco", code: "MA", visitors: 380, revenue: 299, rpv: "$0.79", conv: "0.26%" },
  { name: "Turkey", code: "TR", visitors: 306, revenue: 169, rpv: "$0.55", conv: "0.33%" },
  { name: "Canada", code: "CA", visitors: 305, revenue: 169, rpv: "$0.55", conv: "0.33%" },
  { name: "Spain", code: "ES", visitors: 271, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Singapore", code: "SG", visitors: 251, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Netherlands", code: "NL", visitors: 248, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Poland", code: "PL", visitors: 233, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Brazil", code: "BR", visitors: 218, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Indonesia", code: "ID", visitors: 192, revenue: 169, rpv: "$0.88", conv: "0.52%" },
  { name: "Japan", code: "JP", visitors: 165, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Australia", code: "AU", visitors: 142, revenue: 0, rpv: "$0", conv: "0%" },
];

export const regionData = [
  { name: "England", code: "GB", country: "United Kingdom", visitors: 408, revenue: 299, rpv: "$0.73", conv: "0.25%" },
  { name: "California", code: "US", country: "United States", visitors: 390, revenue: 598, rpv: "$1.53", conv: "0.51%" },
  { name: "Île-de-France", code: "FR", country: "France", visitors: 262, revenue: 299, rpv: "$1.14", conv: "0.38%" },
  { name: "Texas", code: "US", country: "United States", visitors: 165, revenue: 299, rpv: "$1.81", conv: "0.61%" },
  { name: "Istanbul", code: "TR", country: "Turkey", visitors: 156, revenue: 169, rpv: "$1.08", conv: "0.64%" },
  { name: "Ontario", code: "CA", country: "Canada", visitors: 150, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "New York", code: "US", country: "United States", visitors: 127, revenue: 169, rpv: "$1.33", conv: "0.79%" },
  { name: "Pennsylvania", code: "US", country: "United States", visitors: 123, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Noord-Holland", code: "NL", country: "Netherlands", visitors: 111, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Florida", code: "US", country: "United States", visitors: 109, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Provence", code: "FR", country: "France", visitors: 120, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Auvergne-Rhône-Alpes", code: "FR", country: "France", visitors: 95, revenue: 169, rpv: "$1.78", conv: "0.53%" },
  { name: "Bavaria", code: "DE", country: "Germany", visitors: 95, revenue: 169, rpv: "$1.78", conv: "0.53%" },
  { name: "Berlin", code: "DE", country: "Germany", visitors: 82, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "North Rhine-Westphalia", code: "DE", country: "Germany", visitors: 78, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "British Columbia", code: "CA", country: "Canada", visitors: 62, revenue: 169, rpv: "$2.73", conv: "0.81%" },
  { name: "Scotland", code: "GB", country: "United Kingdom", visitors: 52, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Casablanca-Settat", code: "MA", country: "Morocco", visitors: 180, revenue: 169, rpv: "$0.94", conv: "0.56%" },
  { name: "Rabat-Salé-Kénitra", code: "MA", country: "Morocco", visitors: 95, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Catalonia", code: "ES", country: "Spain", visitors: 98, revenue: 0, rpv: "$0", conv: "0%" },
];

export const cityData = [
  { name: "New York City", code: "US", region: "New York", country: "United States", visitors: 127, revenue: 169, rpv: "$1.33", conv: "0.79%" },
  { name: "San Francisco", code: "US", region: "California", country: "United States", visitors: 98, revenue: 299, rpv: "$3.05", conv: "1.02%" },
  { name: "Los Angeles", code: "US", region: "California", country: "United States", visitors: 82, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Houston", code: "US", region: "Texas", country: "United States", visitors: 75, revenue: 169, rpv: "$2.25", conv: "0.67%" },
  { name: "Dallas", code: "US", region: "Texas", country: "United States", visitors: 52, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Austin", code: "US", region: "Texas", country: "United States", visitors: 38, revenue: 130, rpv: "$3.42", conv: "1.05%" },
  { name: "Miami", code: "US", region: "Florida", country: "United States", visitors: 62, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Philadelphia", code: "US", region: "Pennsylvania", country: "United States", visitors: 58, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Paris", code: "FR", region: "Île-de-France", country: "France", visitors: 156, revenue: 169, rpv: "$1.08", conv: "0.64%" },
  { name: "Lyon", code: "FR", region: "Auvergne-Rhône-Alpes", country: "France", visitors: 52, revenue: 169, rpv: "$3.25", conv: "0.96%" },
  { name: "Marseille", code: "FR", region: "Provence", country: "France", visitors: 48, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "London", code: "GB", region: "England", country: "United Kingdom", visitors: 210, revenue: 169, rpv: "$0.80", conv: "0.48%" },
  { name: "Manchester", code: "GB", region: "England", country: "United Kingdom", visitors: 42, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Munich", code: "DE", region: "Bavaria", country: "Germany", visitors: 52, revenue: 169, rpv: "$3.25", conv: "0.96%" },
  { name: "Berlin", code: "DE", region: "Berlin", country: "Germany", visitors: 72, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Casablanca", code: "MA", region: "Casablanca-Settat", country: "Morocco", visitors: 95, revenue: 169, rpv: "$1.78", conv: "0.56%" },
  { name: "Rabat", code: "MA", region: "Rabat-Salé-Kénitra", country: "Morocco", visitors: 48, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Istanbul", code: "TR", region: "Istanbul", country: "Turkey", visitors: 78, revenue: 169, rpv: "$2.17", conv: "0.64%" },
  { name: "Toronto", code: "CA", region: "Ontario", country: "Canada", visitors: 65, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Vancouver", code: "CA", region: "British Columbia", country: "Canada", visitors: 42, revenue: 169, rpv: "$4.02", conv: "1.19%" },
  { name: "Singapore", code: "SG", region: "Singapore", country: "Singapore", visitors: 251, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Barcelona", code: "ES", region: "Catalonia", country: "Spain", visitors: 48, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Amsterdam", code: "NL", region: "Noord-Holland", country: "Netherlands", visitors: 91, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Warsaw", code: "PL", region: "Masovia", country: "Poland", visitors: 96, revenue: 0, rpv: "$0", conv: "0%" },
  { name: "Sydney", code: "AU", region: "New South Wales", country: "Australia", visitors: 78, revenue: 0, rpv: "$0", conv: "0%" },
];

// ─── PAGES — each tab has its own data ──────────────────────────────────────

export const hostnameData = [
  { name: "app.neaven.io", visitors: 8900, revenue: 4730, icon: "🌐" },
  { name: "www.neaven.io", visitors: 1, revenue: 0, icon: "🌐" },
];

export const pageViewData = [
  { name: "/", visitors: 8500, revenue: 0, icon: "📄" },
  { name: "/roadmap", visitors: 300, revenue: 0, icon: "📄" },
  { name: "/pricing", visitors: 264, revenue: 1240, icon: "📄" },
  { name: "/course", visitors: 264, revenue: 169, icon: "📄" },
  { name: "/features", visitors: 155, revenue: 0, icon: "📄" },
  { name: "/signup", visitors: 432, revenue: 2100, icon: "📄" },
  { name: "/blog/launch-guide", visitors: 98, revenue: 0, icon: "📄" },
  { name: "/affiliates", visitors: 48, revenue: 0, icon: "📄" },
  { name: "/course/fundamentals/intro_fund/youtube", visitors: 55, revenue: 0, icon: "📄" },
  { name: "/course/fundamentals/html/html-structure", visitors: 53, revenue: 0, icon: "📄" },
];

export const entryPageData = [
  { name: "/", visitors: 8500, revenue: 0, icon: "📄" },
  { name: "/roadmap", visitors: 216, revenue: 0, icon: "📄" },
  { name: "/course", visitors: 69, revenue: 0, icon: "📄" },
  { name: "/pricing", visitors: 42, revenue: 598, icon: "📄" },
  { name: "/features", visitors: 38, revenue: 0, icon: "📄" },
  { name: "/affiliates", visitors: 12, revenue: 0, icon: "📄" },
];

export const exitLinkData = [
  { name: "shipfa.st", visitors: 79, exits: 94, revenue: 0, icon: "⚡" },
  { name: "marclou.com", visitors: 32, exits: 38, revenue: 0, icon: "🟧" },
  { name: "datafa.st", visitors: 30, exits: 35, revenue: 0, icon: "📊" },
  { name: "youtube.com/watch", visitors: 27, exits: 31, revenue: 0, icon: "▶" },
  { name: "roadmap.sh", visitors: 20, exits: 22, revenue: 0, icon: "🗺" },
  { name: "trustmrr.com", visitors: 17, exits: 19, revenue: 0, icon: "⭐" },
  { name: "codefast.getrewardful.com/signup", visitors: 15, exits: 15, revenue: 0, icon: "🏷" },
];

// ─── TECHNOLOGY ─────────────────────────────────────────────────────────────

export const browserData = [
  { name: "Chrome", visitors: 6000, revenue: 5447, icon: "🟢" },
  { name: "Safari", visitors: 1700, revenue: 428, icon: "🔵" },
  { name: "Edge", visitors: 316, revenue: 0, icon: "🔷" },
  { name: "Firefox", visitors: 245, revenue: 0, icon: "🟠" },
  { name: "LinkedIn", visitors: 133, revenue: 0, icon: "🔗" },
  { name: "Opera", visitors: 94, revenue: 0, icon: "🔴" },
  { name: "Twitter", visitors: 81, revenue: 0, icon: "🐦" },
  { name: "Instagram", visitors: 65, revenue: 0, icon: "📸" },
  { name: "WebKit", visitors: 61, revenue: 0, icon: "🕸" },
  { name: "Samsung Internet", visitors: 38, revenue: 0, icon: "🔹" },
];

export const osData = [
  { name: "Mac OS", visitors: 3400, revenue: 3200, icon: "🍎" },
  { name: "Windows", visitors: 2400, revenue: 1800, icon: "🪟" },
  { name: "iOS", visitors: 1900, revenue: 300, icon: "📱" },
  { name: "Android", visitors: 825, revenue: 100, icon: "🤖" },
  { name: "Linux", visitors: 227, revenue: 0, icon: "🐧" },
  { name: "Ubuntu", visitors: 28, revenue: 0, icon: "🐧" },
  { name: "Chromium OS", visitors: 18, revenue: 0, icon: "💻" },
];

export const deviceData = [
  { name: "Desktop", visitors: 6200, revenue: 5500, icon: "🖥" },
  { name: "Mobile", visitors: 2700, revenue: 598, icon: "📱" },
  { name: "Tablet", visitors: 45, revenue: 0, icon: "📟" },
];

// ─── GOALS ──────────────────────────────────────────────────────────────────

export const goalData = [
  { name: "Scroll > Problem", count: 7300, color: "#22c55e" },
  { name: "scroll_to_solution", count: 5200, color: "#3b82f6" },
  { name: "scroll_to_jainil_review", count: 4100, color: "#f97316" },
  { name: "scroll_to_pricing", count: 3800, color: "#ef4444" },
  { name: "scroll_to_what_you_will_get", count: 3600, color: "#8b5cf6" },
  { name: "scroll_to_adsy_review", count: 3000, color: "#06b6d4" },
  { name: "scroll_to_matthieu_review", count: 2800, color: "#ec4899" },
  { name: "scroll_to_andrei_review", count: 2300, color: "#14b8a6" },
  { name: "scroll_to_faq", count: 2100, color: "#f59e0b" },
  { name: "scroll_to_is_this_possible", count: 2000, color: "#6366f1" },
  { name: "scroll_to_story", count: 1800, color: "#84cc16" },
  { name: "scroll_to_testimonials_grid", count: 1600, color: "#a855f7" },
];

export const funnelData = {
  name: "LP Scroll",
  steps: 7,
  conversionRate: 7.3,
  data: [
    { name: "Visit landing page", visitors: 8700, dropoff: 36.1 },
    { name: "Problem", visitors: 5500, dropoff: 30.5 },
    { name: "Solution", visitors: 3800, dropoff: 32.5 },
    { name: "What You Will Get", visitors: 2600, dropoff: 50.0 },
    { name: "Is This Possible", visitors: 1300, dropoff: 38.1 },
    { name: "Story", visitors: 803, dropoff: 21.2 },
    { name: "Pricing", visitors: 632, dropoff: 0 },
  ],
};

// ─── JOURNEYS ───────────────────────────────────────────────────────────────

export const journeyData = [
  { visitor: "FEN** ******", tag: "Customer", country: "🇮🇩 Indonesia", countryCode: "ID", device: "Desktop · Windows · Chrome", source: "trustmrr.com", sourceIcon: "⭐", spent: 169, time: "2 days", completed: "Today at 11:41 AM", steps: [0,0,0,0,0,1,2] },
  { visitor: "Anq** ******", tag: "Customer", country: "🇺🇸 United States", countryCode: "US", device: "Desktop · Windows · Chrome", source: "Google", sourceIcon: "🔍", spent: 169, time: "24 min", completed: "Today at 3:54 AM", steps: [0,0,0,1,2] },
  { visitor: "Gar** ******", tag: "Customer", country: "🇨🇦 Canada", countryCode: "CA", device: "Desktop · Mac OS · Chrome", source: "YouTube", sourceIcon: "▶", spent: 169, time: "17 min", completed: "Yesterday 4:35 AM", steps: [0,0,0,0,0,1,0,2] },
  { visitor: "Ser** ******", tag: "Customer", country: "🇱🇻 Latvia", countryCode: "LV", device: "Desktop · Windows · Chrome", source: "Direct/None", sourceIcon: "⊕", spent: 169, time: "4 months", completed: "Jun 23 6:41 PM", steps: [0,0,1,0,0,1,0,0,0,0,1,2] },
  { visitor: "Wal** ******", tag: "Customer", country: "🇰🇼 Kuwait", countryCode: "KW", device: "Desktop · Mac OS · Chrome", source: "Direct/None", sourceIcon: "⊕", spent: 299, time: "8 min", completed: "Jun 23 4:23 PM", steps: [0,1,2] },
];

// ─── USERS (individual visitors) ────────────────────────────────────────────

export const userData = [
  { name: "amethyst reindeer", country: "🇵🇾 Paraguay", device: "Desktop · macOS · Chrome", referrer: "marclou.com", refIcon: "🟧", revenue: "$0", time: "Today at 8:28 PM", goalDots: [0, 1, 0, 1, 1], isCustomer: false },
  { name: "green koi", country: "🇺🇦 Ukraine", device: "Desktop · Windows · Firefox", referrer: "Direct", refIcon: "⊕", revenue: "$0", time: "Today at 8:15 PM", goalDots: [1, 1, 0, 0], isCustomer: false },
  { name: "tan whitefish", country: "🇺🇸 United States", device: "Desktop · macOS · Chrome", referrer: "google.com", refIcon: "🔍", revenue: "$169", time: "Today at 7:55 PM", goalDots: [0, 1, 1, 1, 0, 1, 2], isCustomer: true },
  { name: "coral penguin", country: "🇫🇷 France", device: "Mobile · iOS · Safari", referrer: "X", refIcon: "𝕏", revenue: "$0", time: "Today at 6:40 PM", goalDots: [0, 0, 1], isCustomer: false },
  { name: "silver fox", country: "🇩🇪 Germany", device: "Desktop · Windows · Edge", referrer: "trustmrr.com", refIcon: "⭐", revenue: "$169", time: "Today at 5:12 PM", goalDots: [1, 1, 1, 0, 1, 2], isCustomer: true },
  { name: "bronze eagle", country: "🇲🇦 Morocco", device: "Desktop · macOS · Chrome", referrer: "Direct", refIcon: "⊕", revenue: "$0", time: "Today at 4:30 PM", goalDots: [0, 1], isCustomer: false },
  { name: "jade turtle", country: "🇨🇦 Canada", device: "Desktop · macOS · Safari", referrer: "youtube.com", refIcon: "▶", revenue: "$169", time: "Yesterday", goalDots: [0, 0, 1, 1, 0, 0, 2], isCustomer: true },
  { name: "ruby sparrow", country: "🇬🇧 United Kingdom", device: "Mobile · Android · Chrome", referrer: "linkedin.com", refIcon: "in", revenue: "$0", time: "Yesterday", goalDots: [1, 0], isCustomer: false },
];

// ─── KPI METRICS CONFIG ─────────────────────────────────────────────────────

export type MetricKey = "visitors" | "revenue" | "convRate" | "rpv" | "bounceRate" | "sessionTime";

export const METRICS: Record<MetricKey, { label: string; val: string; change: string; up: boolean; color: string; yFmt?: (v: number) => string; desc: string }> = {
  visitors: { label: "Visitors", val: "8,859", change: "8%", up: false, color: "#60a5fa", desc: "Unique visitors to your site." },
  revenue: { label: "Revenue", val: "$7,318", change: "13%", up: false, color: "#f97316", desc: "Total revenue attributed." },
  convRate: { label: "Conversion rate", val: "0.36%", change: "9%", up: true, color: "#f97316", yFmt: v => `${v}%`, desc: "Visitors who converted." },
  rpv: { label: "Revenue/visitor", val: "$0.83", change: "5%", up: false, color: "#f97316", yFmt: v => `$${v}`, desc: "Revenue per visitor." },
  bounceRate: { label: "Bounce rate", val: "86%", change: "4%", up: false, color: "#60a5fa", yFmt: v => `${v}%`, desc: "Left after one page." },
  sessionTime: { label: "Session time", val: "2m 9s", change: "68%", up: false, color: "#60a5fa", yFmt: v => `${Math.floor(v / 60)}m`, desc: "Average time on site." },
};

// ─── SHARED TYPES ───────────────────────────────────────────────────────────

export type SortMode = "visitors" | "revenue";
export type FilterType = "referrer" | "country" | "region" | "city" | "page" | "browser" | "os" | "device" | "channel" | "campaign" | "keyword" | "hostname" | "entryPage" | "exitLink";
export type ActiveFilter = { type: FilterType; value: string; icon?: string };
