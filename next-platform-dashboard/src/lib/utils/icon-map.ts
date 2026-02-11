/**
 * Emoji → Lucide icon name mapping
 * 
 * Maps common emoji strings (stored in DB module `icon` fields, hardcoded in catalog,
 * notifications, etc.) to their Lucide icon name equivalents.
 * 
 * Used by ModuleIconContainer and other components to render proper line icons
 * instead of cheap emoji.
 */

/** Map of emoji characters to Lucide icon component names */
export const EMOJI_TO_LUCIDE: Record<string, string> = {
  // Analytics / Charts
  "📊": "ChartBar",
  "📈": "TrendingUp",
  "📉": "TrendingDown",

  // Fire / Performance
  "🔥": "Flame",

  // Target / Goals
  "🎯": "Target",
  "🏆": "Trophy",

  // Commerce / Payment
  "💳": "CreditCard",
  "🛒": "ShoppingCart",
  "🏪": "Store",
  "💰": "CircleDollarSign",
  "💵": "Banknote",

  // Communication
  "📧": "Mail",
  "✉️": "Mail",
  "📩": "MailOpen",
  "💬": "MessageCircle",
  "📢": "Megaphone",
  "📣": "Megaphone",
  "🔔": "Bell",

  // Content / Documents
  "📝": "FileText",
  "📄": "File",
  "📋": "ClipboardList",
  "📰": "Newspaper",
  "📂": "FolderOpen",

  // Media
  "📸": "Camera",
  "📷": "Camera",
  "🎬": "Clapperboard",
  "🖼️": "Image",
  "🎨": "Palette",
  "🎵": "Music",

  // People / Users
  "👤": "User",
  "👥": "Users",
  "🤝": "Handshake",
  "👋": "Hand",
  "🧠": "Brain",

  // Calendar / Time
  "📅": "Calendar",
  "🗓️": "CalendarDays",
  "⏰": "Clock",

  // Tech / Dev
  "⚡": "Zap",
  "🔧": "Wrench",
  "⚙️": "Settings",
  "🔗": "Link",
  "💾": "HardDrive",
  "🔌": "Plug",
  "📱": "Smartphone",
  "💻": "Monitor",

  // Security
  "🔒": "Lock",
  "🔓": "Unlock",
  "🛡️": "Shield",
  "🔑": "Key",

  // Navigation / Location
  "🌐": "Globe",
  "📍": "MapPin",
  "🏠": "Home",

  // Status / Indicators
  "✅": "CircleCheck",
  "✔️": "Check",
  "❌": "CircleX",
  "⚠️": "AlertTriangle",
  "ℹ️": "Info",
  "🚫": "Ban",
  "🔄": "RefreshCw",

  // Shipping / Package
  "📦": "Package",
  "🚀": "Rocket",

  // Social / Fun
  "🎉": "PartyPopper",
  "✨": "Sparkles",
  "💡": "Lightbulb",
  "🔮": "Sparkle",
  "💎": "Gem",
  "⭐": "Star",

  // Medical / Industry
  "🏥": "Hospital",
  "🏋️": "Dumbbell",
  "🍔": "UtensilsCrossed",
  "🎓": "GraduationCap",

  // Search / Discovery
  "🔍": "Search",
  "🔎": "SearchCheck",

  // Misc
  "📌": "Pin",
  "🐵": "Package",
  "🍪": "Shield",
  "↪️": "CornerDownRight",
  "@": "AtSign",
  "✏️": "Pencil",
};

/**
 * Known Lucide icon name strings that can be passed directly.
 * These match the PascalCase names exported by lucide-react.
 */
export const KNOWN_LUCIDE_NAMES = new Set([
  "Package", "FileCode", "ChartBar", "ChartLine", "ChartPie", "Mail", "Calendar",
  "CalendarCheck", "CalendarDays", "Coins", "CircleDollarSign",
  "Users", "User", "UserCog", "Globe", "Search", "SearchCheck",
  "Settings", "ShoppingCart", "FileText", "File", "Megaphone",
  "Layers", "MessageSquare", "MessageCircle", "Database", "Zap",
  "Shield", "Palette", "CreditCard", "Receipt", "Bell", "Share2",
  "Newspaper", "Image", "Video", "FolderOpen", "Monitor", "Lock",
  "Gauge", "Puzzle", "Stethoscope", "Hotel", "Building2", "GraduationCap",
  "Dumbbell", "UtensilsCrossed", "Wrench", "MapPin", "Target",
  "TrendingUp", "Flame", "Camera", "Clapperboard", "Plug", "Key",
  "Rocket", "Sparkles", "Lightbulb", "Star", "Pin", "AtSign",
  "AlertTriangle", "Info", "CircleCheck", "CircleX", "CircleAlert", "Ban",
  "RefreshCw", "Check", "Pencil", "Brain", "Hand", "Handshake",
  "Smartphone", "HardDrive", "Home", "Link", "CornerDownRight",
  "Store", "Banknote", "Gem", "Trophy", "ClipboardList", "Music",
  "Kanban", "Heart", "Sparkle", "PartyPopper", "WandSparkles", "LoaderCircle",
]);

/**
 * Resolves any icon input (emoji string, Lucide name, or null) 
 * to a Lucide icon name string.
 * 
 * @param icon - The raw icon value (emoji, Lucide name, or null)
 * @returns A valid Lucide icon name string (defaults to "Package")
 */
export function resolveIconName(icon: string | null | undefined): string {
  if (!icon) return "Package";

  // If it's already a known Lucide name, return it directly
  if (KNOWN_LUCIDE_NAMES.has(icon)) return icon;

  // Try emoji mapping
  const mapped = EMOJI_TO_LUCIDE[icon];
  if (mapped) return mapped;

  // Try lowercase matching for kebab-case inputs (e.g., "shopping-cart")
  const kebabToLucide: Record<string, string> = {
    "package": "Package",
    "file-code": "FileCode",
    "bar-chart": "ChartBar",
    "bar-chart-2": "ChartBar",
    "bar-chart-3": "ChartBar",
    "mail": "Mail",
    "calendar": "Calendar",
    "dollar-sign": "Coins",
    "users": "Users",
    "user": "User",
    "globe": "Globe",
    "search": "Search",
    "settings": "Settings",
    "shopping-cart": "ShoppingCart",
    "file-text": "FileText",
    "megaphone": "Megaphone",
    "layers": "Layers",
    "message-square": "MessageSquare",
    "message-circle": "MessageCircle",
    "database": "Database",
    "zap": "Zap",
    "shield": "Shield",
    "palette": "Palette",
    "credit-card": "CreditCard",
    "bell": "Bell",
    "newspaper": "Newspaper",
    "image": "Image",
    "lock": "Lock",
    "wrench": "Wrench",
    "target": "Target",
    "rocket": "Rocket",
    "lightbulb": "Lightbulb",
    "star": "Star",
    "pin": "Pin",
    "link": "Link",
    "plug": "Plug",
    "key": "Key",
    "home": "Home",
    "monitor": "Monitor",
    "smartphone": "Smartphone",
    "hard-drive": "HardDrive",
    "trending-up": "TrendingUp",
    "camera": "Camera",
  };

  const lower = icon.toLowerCase().trim();
  if (kebabToLucide[lower]) return kebabToLucide[lower];

  // Default fallback
  return "Package";
}
