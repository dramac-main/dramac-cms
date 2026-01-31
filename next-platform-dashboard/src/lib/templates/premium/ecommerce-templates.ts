/**
 * Premium E-commerce Templates
 * PHASE-ED-07B: Template System - Premium Templates
 * 
 * 6 premium e-commerce templates with full Puck component structures.
 */

import type { PuckTemplate } from "@/types/puck-templates";

function generateId(): string {
  return `component-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================
// 1. FASHION BOUTIQUE
// ============================================

export const fashionBoutique: PuckTemplate = {
  id: "premium-fashion",
  name: "Fashion Boutique",
  slug: "fashion-boutique",
  description: "Elegant fashion e-commerce store with lookbook and collections",
  category: "ecommerce",
  subcategory: "fashion",
  tags: ["fashion", "clothing", "boutique", "style", "shop"],
  thumbnail: "/templates/premium/fashion.jpg",
  isPremium: true,
  isNew: true,
  isFeatured: true,
  isPopular: true,
  popularity: 95,
  features: [
    "Lookbook hero",
    "Collection showcase",
    "Featured products",
    "Category navigation",
    "Newsletter signup",
    "Instagram feed",
  ],
  sections: ["navbar", "hero", "collections", "featured", "lookbook", "instagram", "newsletter", "footer"],
  componentsUsed: ["Navbar", "Hero", "CategoryGrid", "ProductGrid", "Gallery", "InstagramFeed", "Newsletter", "Footer"],
  colorScheme: {
    primary: "#0f0f0f",
    secondary: "#fafafa",
    accent: "#a78bfa",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Fashion Boutique" } },
    content: [
      {
        type: "AnnouncementBar",
        props: {
          id: generateId(),
          text: "Free shipping on orders over $100 • New arrivals weekly",
          backgroundColor: "#0f0f0f",
          textColor: "#ffffff",
          dismissible: true,
        },
      },
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "ÉLÉGANCE",
          links: [
            { label: "New Arrivals", href: "#new" },
            { label: "Collections", href: "#collections" },
            { label: "Sale", href: "#sale" },
            { label: "Lookbook", href: "#lookbook" },
          ],
          showCart: true,
          showSearch: true,
          sticky: true,
          backgroundColor: "#ffffff",
          textColor: "#0f0f0f",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Spring Collection 2026",
          subtitle: "Discover the new season's most coveted pieces",
          alignment: "center",
          buttonText: "Shop Now",
          buttonLink: "#new",
          backgroundType: "image",
          backgroundImage: "/images/fashion-hero.jpg",
          overlay: true,
          overlayOpacity: 0.3,
          textColor: "#ffffff",
          padding: "xl",
        },
      },
      {
        type: "CategoryGrid",
        props: {
          id: generateId(),
          title: "Shop by Category",
          categories: [
            { name: "Dresses", image: "/categories/dresses.jpg", link: "#" },
            { name: "Tops", image: "/categories/tops.jpg", link: "#" },
            { name: "Bottoms", image: "/categories/bottoms.jpg", link: "#" },
            { name: "Accessories", image: "/categories/accessories.jpg", link: "#" },
          ],
          columns: 4,
          style: "overlay",
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "ProductGrid",
        props: {
          id: generateId(),
          title: "New Arrivals",
          subtitle: "Just landed – shop the latest styles",
          products: [
            { name: "Silk Midi Dress", price: 189, salePrice: null, image: "/products/dress1.jpg", badge: "New", link: "#" },
            { name: "Linen Blazer", price: 245, salePrice: null, image: "/products/blazer.jpg", badge: null, link: "#" },
            { name: "Wide Leg Trousers", price: 125, salePrice: null, image: "/products/trousers.jpg", badge: "New", link: "#" },
            { name: "Cashmere Sweater", price: 295, salePrice: 235, image: "/products/sweater.jpg", badge: "Sale", link: "#" },
          ],
          columns: 4,
          showPrices: true,
          showBadges: true,
          backgroundColor: "#fafafa",
          padding: "lg",
        },
      },
      {
        type: "Gallery",
        props: {
          id: generateId(),
          title: "The Lookbook",
          subtitle: "Style inspiration for the season",
          columns: 3,
          gap: "sm",
          images: [
            { src: "/lookbook/look1.jpg", alt: "Spring Look 1" },
            { src: "/lookbook/look2.jpg", alt: "Spring Look 2" },
            { src: "/lookbook/look3.jpg", alt: "Spring Look 3" },
          ],
          enableLightbox: true,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "InstagramFeed",
        props: {
          id: generateId(),
          title: "Follow Us @elegance",
          username: "elegance",
          postCount: 6,
          columns: 6,
          showFollowButton: true,
          backgroundColor: "#ffffff",
          padding: "md",
        },
      },
      {
        type: "Newsletter",
        props: {
          id: generateId(),
          title: "Join the Club",
          subtitle: "Subscribe for exclusive offers, style tips, and new arrivals",
          placeholder: "Enter your email",
          buttonText: "Subscribe",
          backgroundColor: "#0f0f0f",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "ÉLÉGANCE",
          description: "Modern fashion for the discerning woman",
          columns: [
            {
              title: "Shop",
              links: [
                { label: "New Arrivals", href: "#" },
                { label: "Dresses", href: "#" },
                { label: "Tops", href: "#" },
                { label: "Bottoms", href: "#" },
                { label: "Sale", href: "#" },
              ],
            },
            {
              title: "Help",
              links: [
                { label: "Contact Us", href: "#" },
                { label: "Shipping", href: "#" },
                { label: "Returns", href: "#" },
                { label: "Size Guide", href: "#" },
              ],
            },
            {
              title: "About",
              links: [
                { label: "Our Story", href: "#" },
                { label: "Sustainability", href: "#" },
                { label: "Careers", href: "#" },
              ],
            },
          ],
          showSocial: true,
          socialLinks: { instagram: "#", pinterest: "#", facebook: "#" },
          copyrightText: "© 2026 ÉLÉGANCE. All rights reserved.",
          backgroundColor: "#0f0f0f",
          textColor: "#ffffff",
        },
      },
    ],
    zones: {},
  },
  metadata: {
    author: "DRAMAC",
    version: "1.0.0",
    createdAt: "2026-01-31",
    lastUpdated: "2026-01-31",
    estimatedBuildTime: "35 minutes",
    difficulty: "intermediate",
    componentCount: 9,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// 2. ELECTRONICS / TECH STORE
// ============================================

export const techStore: PuckTemplate = {
  id: "premium-tech-store",
  name: "Tech / Electronics Store",
  slug: "tech-store",
  description: "Modern tech and electronics store with product showcases",
  category: "ecommerce",
  subcategory: "electronics",
  tags: ["tech", "electronics", "gadgets", "store", "modern"],
  thumbnail: "/templates/premium/tech-store.jpg",
  isPremium: true,
  isNew: false,
  isFeatured: true,
  isPopular: true,
  popularity: 92,
  features: [
    "Product hero carousel",
    "Category navigation",
    "Feature highlights",
    "Deal countdown",
    "Product comparisons",
  ],
  sections: ["navbar", "hero", "categories", "featured", "deals", "brands", "reviews", "footer"],
  componentsUsed: ["Navbar", "Carousel", "CategoryGrid", "ProductGrid", "Countdown", "LogoCloud", "Testimonials", "Footer"],
  colorScheme: {
    primary: "#2563eb",
    secondary: "#eff6ff",
    accent: "#3b82f6",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Tech Store" } },
    content: [
      {
        type: "AnnouncementBar",
        props: {
          id: generateId(),
          text: "🚀 Flash Sale! Up to 40% off select items. Limited time only!",
          link: "#deals",
          linkText: "Shop Now",
          backgroundColor: "#2563eb",
          textColor: "#ffffff",
          dismissible: true,
        },
      },
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "TECHZONE",
          links: [
            { label: "Phones", href: "#phones" },
            { label: "Laptops", href: "#laptops" },
            { label: "Audio", href: "#audio" },
            { label: "Accessories", href: "#accessories" },
            { label: "Deals", href: "#deals" },
          ],
          showCart: true,
          showSearch: true,
          sticky: true,
          backgroundColor: "#ffffff",
        },
      },
      {
        type: "Carousel",
        props: {
          id: generateId(),
          slides: [
            {
              image: "/slides/phone-new.jpg",
              title: "New Galaxy X25 Pro",
              subtitle: "Experience the future of mobile technology",
              buttonText: "Pre-order Now",
              buttonLink: "#",
            },
            {
              image: "/slides/laptop-new.jpg",
              title: "MacBook Pro 2026",
              subtitle: "Power meets perfection",
              buttonText: "Shop Now",
              buttonLink: "#",
            },
          ],
          autoplay: true,
          interval: 5000,
          showDots: true,
          showArrows: true,
        },
      },
      {
        type: "CategoryGrid",
        props: {
          id: generateId(),
          title: "Shop by Category",
          categories: [
            { name: "Smartphones", image: "/categories/phones.jpg", count: "150+ products", link: "#" },
            { name: "Laptops", image: "/categories/laptops.jpg", count: "80+ products", link: "#" },
            { name: "Audio", image: "/categories/audio.jpg", count: "200+ products", link: "#" },
            { name: "Wearables", image: "/categories/wearables.jpg", count: "60+ products", link: "#" },
            { name: "Gaming", image: "/categories/gaming.jpg", count: "100+ products", link: "#" },
            { name: "Smart Home", image: "/categories/smarthome.jpg", count: "75+ products", link: "#" },
          ],
          columns: 6,
          showCount: true,
          backgroundColor: "#f8fafc",
          padding: "lg",
        },
      },
      {
        type: "ProductGrid",
        props: {
          id: generateId(),
          title: "Best Sellers",
          products: [
            { name: "iPhone 17 Pro", price: 999, rating: 4.9, reviewCount: 2450, image: "/products/iphone.jpg", link: "#" },
            { name: "AirPods Pro 3", price: 249, rating: 4.8, reviewCount: 1890, image: "/products/airpods.jpg", link: "#" },
            { name: "Samsung Galaxy Tab", price: 649, rating: 4.7, reviewCount: 890, image: "/products/tablet.jpg", link: "#" },
            { name: "Sony WH-2000", price: 349, rating: 4.9, reviewCount: 3200, image: "/products/headphones.jpg", link: "#" },
          ],
          columns: 4,
          showPrices: true,
          showRatings: true,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Section",
        props: {
          id: generateId(),
          backgroundColor: "#2563eb",
          padding: "lg",
        },
      },
      {
        type: "Countdown",
        props: {
          id: generateId(),
          title: "Flash Deal Ends In",
          targetDate: "2026-02-01T00:00:00",
          style: "cards",
          backgroundColor: "transparent",
          textColor: "#ffffff",
        },
      },
      {
        type: "ProductGrid",
        props: {
          id: generateId(),
          title: "Deals of the Day",
          products: [
            { name: "Wireless Charger", price: 29, originalPrice: 49, image: "/products/charger.jpg", link: "#", badge: "-40%" },
            { name: "USB-C Hub", price: 45, originalPrice: 79, image: "/products/hub.jpg", link: "#", badge: "-43%" },
          ],
          columns: 2,
          showPrices: true,
          showBadges: true,
          backgroundColor: "transparent",
          padding: "md",
        },
      },
      {
        type: "LogoCloud",
        props: {
          id: generateId(),
          title: "Top Brands",
          logos: [
            { name: "Apple", src: "/brands/apple.svg" },
            { name: "Samsung", src: "/brands/samsung.svg" },
            { name: "Sony", src: "/brands/sony.svg" },
            { name: "Microsoft", src: "/brands/microsoft.svg" },
            { name: "Google", src: "/brands/google.svg" },
            { name: "Bose", src: "/brands/bose.svg" },
          ],
          backgroundColor: "#f8fafc",
          padding: "md",
        },
      },
      {
        type: "Testimonials",
        props: {
          id: generateId(),
          title: "Customer Reviews",
          testimonials: [
            {
              quote: "Fast shipping, great prices, and excellent customer service. My go-to tech store!",
              author: "Mark T.",
              rating: 5,
            },
            {
              quote: "The best deals on electronics. I've saved hundreds shopping here.",
              author: "Lisa R.",
              rating: 5,
            },
          ],
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "TECHZONE",
          description: "Your one-stop shop for all things tech",
          columns: [
            {
              title: "Shop",
              links: [
                { label: "Phones", href: "#" },
                { label: "Laptops", href: "#" },
                { label: "Audio", href: "#" },
                { label: "Gaming", href: "#" },
              ],
            },
            {
              title: "Support",
              links: [
                { label: "Contact", href: "#" },
                { label: "Returns", href: "#" },
                { label: "Warranty", href: "#" },
                { label: "Track Order", href: "#" },
              ],
            },
          ],
          showSocial: true,
          socialLinks: { twitter: "#", youtube: "#", instagram: "#" },
          copyrightText: "© 2026 TECHZONE. All rights reserved.",
          backgroundColor: "#0f172a",
          textColor: "#ffffff",
        },
      },
    ],
    zones: {},
  },
  metadata: {
    author: "DRAMAC",
    version: "1.0.0",
    createdAt: "2026-01-31",
    lastUpdated: "2026-01-31",
    estimatedBuildTime: "35 minutes",
    difficulty: "intermediate",
    componentCount: 12,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// 3. FOOD & GROCERY STORE
// ============================================

export const groceryStore: PuckTemplate = {
  id: "premium-grocery",
  name: "Food & Grocery",
  slug: "grocery-store",
  description: "Fresh and organic food store with category browsing",
  category: "ecommerce",
  subcategory: "food",
  tags: ["grocery", "food", "organic", "fresh", "delivery"],
  thumbnail: "/templates/premium/grocery.jpg",
  isPremium: true,
  isNew: true,
  isFeatured: false,
  isPopular: true,
  popularity: 87,
  features: [
    "Fresh deals banner",
    "Category carousel",
    "Featured products",
    "Delivery info",
    "Recipe inspiration",
  ],
  sections: ["navbar", "hero", "categories", "deals", "products", "delivery", "recipes", "footer"],
  componentsUsed: ["Navbar", "Hero", "CategoryCarousel", "ProductGrid", "Features", "Blog", "Footer"],
  colorScheme: {
    primary: "#16a34a",
    secondary: "#f0fdf4",
    accent: "#22c55e",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Grocery Store" } },
    content: [
      {
        type: "AnnouncementBar",
        props: {
          id: generateId(),
          text: "🥬 Free delivery on orders over $50 • Same-day delivery available",
          backgroundColor: "#16a34a",
          textColor: "#ffffff",
        },
      },
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "FreshMart",
          links: [
            { label: "Produce", href: "#produce" },
            { label: "Dairy", href: "#dairy" },
            { label: "Meat", href: "#meat" },
            { label: "Pantry", href: "#pantry" },
            { label: "Recipes", href: "#recipes" },
          ],
          showCart: true,
          showSearch: true,
          sticky: true,
          backgroundColor: "#ffffff",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Fresh. Organic. Delivered.",
          subtitle: "Shop the freshest produce, dairy, and pantry staples – delivered to your door in hours.",
          alignment: "left",
          buttonText: "Shop Now",
          buttonLink: "#products",
          backgroundType: "image",
          backgroundImage: "/images/grocery-hero.jpg",
          overlay: true,
          overlayOpacity: 0.4,
          textColor: "#ffffff",
          padding: "xl",
        },
      },
      {
        type: "CategoryCarousel",
        props: {
          id: generateId(),
          title: "Shop by Category",
          categories: [
            { name: "Fruits", image: "/categories/fruits.jpg", link: "#" },
            { name: "Vegetables", image: "/categories/vegetables.jpg", link: "#" },
            { name: "Dairy & Eggs", image: "/categories/dairy.jpg", link: "#" },
            { name: "Meat & Seafood", image: "/categories/meat.jpg", link: "#" },
            { name: "Bakery", image: "/categories/bakery.jpg", link: "#" },
            { name: "Pantry", image: "/categories/pantry.jpg", link: "#" },
            { name: "Frozen", image: "/categories/frozen.jpg", link: "#" },
            { name: "Beverages", image: "/categories/beverages.jpg", link: "#" },
          ],
          autoScroll: true,
          backgroundColor: "#f0fdf4",
          padding: "md",
        },
      },
      {
        type: "ProductGrid",
        props: {
          id: generateId(),
          title: "Today's Deals",
          subtitle: "Limited time savings on popular items",
          products: [
            { name: "Organic Avocados (6)", price: 4.99, originalPrice: 7.99, image: "/products/avocados.jpg", badge: "38% OFF", link: "#" },
            { name: "Free-Range Eggs (12)", price: 5.49, originalPrice: 6.99, image: "/products/eggs.jpg", badge: "21% OFF", link: "#" },
            { name: "Fresh Salmon Fillet", price: 12.99, originalPrice: 16.99, image: "/products/salmon.jpg", badge: "24% OFF", link: "#" },
            { name: "Almond Milk (64oz)", price: 3.99, originalPrice: 5.49, image: "/products/almondmilk.jpg", badge: "27% OFF", link: "#" },
          ],
          columns: 4,
          showPrices: true,
          showBadges: true,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Features",
        props: {
          id: generateId(),
          title: "Why Shop With Us",
          features: [
            { icon: "🚚", title: "Same-Day Delivery", description: "Order by 2pm for same-day delivery" },
            { icon: "🥬", title: "Fresh Guaranteed", description: "100% freshness or your money back" },
            { icon: "🌱", title: "Local & Organic", description: "Supporting local farms and organic producers" },
            { icon: "💰", title: "Best Prices", description: "Price match guarantee on all items" },
          ],
          columns: 4,
          backgroundColor: "#16a34a",
          textColor: "#ffffff",
          padding: "md",
        },
      },
      {
        type: "ProductGrid",
        props: {
          id: generateId(),
          title: "Bestsellers",
          products: [
            { name: "Organic Bananas", price: 0.69, unit: "/lb", image: "/products/bananas.jpg", link: "#" },
            { name: "Grass-Fed Ground Beef", price: 8.99, unit: "/lb", image: "/products/beef.jpg", link: "#" },
            { name: "Greek Yogurt", price: 4.99, image: "/products/yogurt.jpg", link: "#" },
            { name: "Whole Wheat Bread", price: 3.49, image: "/products/bread.jpg", link: "#" },
          ],
          columns: 4,
          showPrices: true,
          backgroundColor: "#f8fafc",
          padding: "lg",
        },
      },
      {
        type: "Blog",
        props: {
          id: generateId(),
          title: "Recipe Inspiration",
          subtitle: "Delicious ideas using our fresh ingredients",
          posts: [
            { title: "15-Minute Salmon Bowls", image: "/recipes/salmon-bowl.jpg", link: "#" },
            { title: "Farm-Fresh Vegetable Soup", image: "/recipes/soup.jpg", link: "#" },
            { title: "Avocado Toast Variations", image: "/recipes/avocado-toast.jpg", link: "#" },
          ],
          columns: 3,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "FreshMart",
          description: "Fresh groceries delivered to your door",
          columns: [
            {
              title: "Shop",
              links: [
                { label: "Produce", href: "#" },
                { label: "Dairy", href: "#" },
                { label: "Meat", href: "#" },
                { label: "Pantry", href: "#" },
              ],
            },
            {
              title: "Help",
              links: [
                { label: "Delivery Areas", href: "#" },
                { label: "Returns", href: "#" },
                { label: "Contact", href: "#" },
              ],
            },
          ],
          copyrightText: "© 2026 FreshMart. All rights reserved.",
          backgroundColor: "#0f172a",
          textColor: "#ffffff",
        },
      },
    ],
    zones: {},
  },
  metadata: {
    author: "DRAMAC",
    version: "1.0.0",
    createdAt: "2026-01-31",
    lastUpdated: "2026-01-31",
    estimatedBuildTime: "30 minutes",
    difficulty: "intermediate",
    componentCount: 9,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// 4. FURNITURE / HOME DECOR
// ============================================

export const furnitureStore: PuckTemplate = {
  id: "premium-furniture",
  name: "Furniture & Home Decor",
  slug: "furniture-store",
  description: "Elegant furniture and home decor store",
  category: "ecommerce",
  subcategory: "furniture",
  tags: ["furniture", "home", "decor", "interior", "living"],
  thumbnail: "/templates/premium/furniture.jpg",
  isPremium: true,
  isNew: false,
  isFeatured: true,
  isPopular: true,
  popularity: 90,
  features: [
    "Room inspiration",
    "Category navigation",
    "Featured collections",
    "Room planner CTA",
    "Customer reviews",
  ],
  sections: ["navbar", "hero", "categories", "featured", "inspiration", "services", "reviews", "footer"],
  componentsUsed: ["Navbar", "Hero", "CategoryGrid", "ProductGrid", "Gallery", "Features", "Testimonials", "Footer"],
  colorScheme: {
    primary: "#78716c",
    secondary: "#fafaf9",
    accent: "#a8a29e",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Furniture Store" } },
    content: [
      {
        type: "AnnouncementBar",
        props: {
          id: generateId(),
          text: "Winter Sale: Up to 40% off select furniture. Free delivery on orders over $999",
          backgroundColor: "#78716c",
          textColor: "#ffffff",
        },
      },
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "HABITAT",
          links: [
            { label: "Living Room", href: "#living" },
            { label: "Bedroom", href: "#bedroom" },
            { label: "Dining", href: "#dining" },
            { label: "Office", href: "#office" },
            { label: "Decor", href: "#decor" },
            { label: "Sale", href: "#sale" },
          ],
          showCart: true,
          showSearch: true,
          sticky: true,
          backgroundColor: "#ffffff",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Design Your Dream Space",
          subtitle: "Timeless furniture and decor crafted for modern living",
          alignment: "center",
          buttonText: "Shop Collection",
          buttonLink: "#featured",
          secondaryButtonText: "Room Planner",
          secondaryButtonLink: "#planner",
          backgroundType: "image",
          backgroundImage: "/images/furniture-hero.jpg",
          overlay: true,
          overlayOpacity: 0.3,
          textColor: "#ffffff",
          padding: "xl",
        },
      },
      {
        type: "CategoryGrid",
        props: {
          id: generateId(),
          title: "Shop by Room",
          categories: [
            { name: "Living Room", image: "/rooms/living.jpg", link: "#" },
            { name: "Bedroom", image: "/rooms/bedroom.jpg", link: "#" },
            { name: "Dining Room", image: "/rooms/dining.jpg", link: "#" },
            { name: "Home Office", image: "/rooms/office.jpg", link: "#" },
          ],
          columns: 4,
          style: "overlay",
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "ProductGrid",
        props: {
          id: generateId(),
          title: "New Arrivals",
          products: [
            { name: "Oslo Sectional Sofa", price: 2499, image: "/products/sofa.jpg", badge: "New", link: "#" },
            { name: "Marble Coffee Table", price: 899, image: "/products/coffee-table.jpg", link: "#" },
            { name: "Nordic Dining Chair", price: 349, image: "/products/chair.jpg", badge: "New", link: "#" },
            { name: "Brass Floor Lamp", price: 429, image: "/products/lamp.jpg", link: "#" },
          ],
          columns: 4,
          showPrices: true,
          showBadges: true,
          backgroundColor: "#fafaf9",
          padding: "lg",
        },
      },
      {
        type: "Gallery",
        props: {
          id: generateId(),
          title: "Room Inspiration",
          subtitle: "Get inspired by our styled spaces",
          columns: 3,
          images: [
            { src: "/inspiration/room1.jpg", alt: "Modern Living Room" },
            { src: "/inspiration/room2.jpg", alt: "Cozy Bedroom" },
            { src: "/inspiration/room3.jpg", alt: "Elegant Dining" },
          ],
          enableLightbox: true,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Features",
        props: {
          id: generateId(),
          title: "The HABITAT Difference",
          features: [
            { icon: "🚚", title: "Free White Glove Delivery", description: "On orders over $999" },
            { icon: "🛠️", title: "Expert Assembly", description: "Professional setup included" },
            { icon: "🔄", title: "30-Day Returns", description: "Hassle-free return policy" },
            { icon: "💎", title: "Quality Craftsmanship", description: "Built to last a lifetime" },
          ],
          columns: 4,
          backgroundColor: "#78716c",
          textColor: "#ffffff",
          padding: "md",
        },
      },
      {
        type: "Testimonials",
        props: {
          id: generateId(),
          title: "What Our Customers Say",
          testimonials: [
            {
              quote: "The quality of our new sofa exceeded all expectations. It's become the centerpiece of our living room.",
              author: "The Johnsons",
              rating: 5,
            },
            {
              quote: "Exceptional service from start to finish. The delivery team was professional and careful.",
              author: "Maria S.",
              rating: 5,
            },
          ],
          backgroundColor: "#fafaf9",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "HABITAT",
          description: "Timeless furniture for modern living",
          columns: [
            {
              title: "Shop",
              links: [
                { label: "Living Room", href: "#" },
                { label: "Bedroom", href: "#" },
                { label: "Dining", href: "#" },
                { label: "Office", href: "#" },
              ],
            },
            {
              title: "Services",
              links: [
                { label: "Design Services", href: "#" },
                { label: "Delivery", href: "#" },
                { label: "Assembly", href: "#" },
                { label: "Trade Program", href: "#" },
              ],
            },
          ],
          showSocial: true,
          socialLinks: { instagram: "#", pinterest: "#", houzz: "#" },
          copyrightText: "© 2026 HABITAT. All rights reserved.",
          backgroundColor: "#0f172a",
          textColor: "#ffffff",
        },
      },
    ],
    zones: {},
  },
  metadata: {
    author: "DRAMAC",
    version: "1.0.0",
    createdAt: "2026-01-31",
    lastUpdated: "2026-01-31",
    estimatedBuildTime: "30 minutes",
    difficulty: "intermediate",
    componentCount: 9,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// ALL ECOMMERCE TEMPLATES
// ============================================

export const ECOMMERCE_TEMPLATES: PuckTemplate[] = [
  fashionBoutique,
  techStore,
  groceryStore,
  furnitureStore,
];

export default ECOMMERCE_TEMPLATES;
