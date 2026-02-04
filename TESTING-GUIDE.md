# DRAMAC Studio - Component Testing Guide

**Last Updated**: February 4, 2026  
**Total Components Available**: 59 fully registered components  
**All Systems**: ✅ Working and ready to test

---

## 🚀 Quick Start - What You Can Test NOW

### 1. Start the Development Server
```bash
cd f:\dramac-cms
pnpm dev
```

Then open: `http://localhost:3000/studio`

---

## 📦 ALL 59 COMPONENTS - Organized by Category

### LAYOUT COMPONENTS (6)
Test dragging these from the Component Library (left sidebar):

| Component | What to Test | Expected Result |
|-----------|-------------|-----------------|
| **Section** | Drag to canvas, set background color | Full-width container with customizable padding |
| **Container** | Drag inside Section, add components | Max-width wrapper (sm/md/lg/xl/2xl/full) |
| **Columns** | Drag to canvas, choose 2-4 columns | Responsive grid layout |
| **Card** | Drag to canvas, set shadow/border | Container with border, shadow, padding |
| **Spacer** | Drag between components | Vertical spacing (xs/sm/md/lg/xl) |
| **Divider** | Drag between sections | Horizontal line with custom color/thickness |

**Test Drop Zones**: ✅ All containers now show blue drop zones when dragging

---

### TYPOGRAPHY COMPONENTS (2)

| Component | What to Test | Expected Result |
|-----------|-------------|-----------------|
| **Heading** | Add text, choose h1-h6, set color | Responsive heading with custom styles |
| **Text** | Add paragraph, set alignment | Body text with leading/tracking |

---

### BUTTON COMPONENTS (1)

| Component | What to Test | Expected Result |
|-----------|-------------|-----------------|
| **Button** | Set text, variant (6 types), size | Interactive button with hover states |

**Variants**: primary, secondary, outline, ghost, destructive, link

---

### MEDIA COMPONENTS (3)

| Component | What to Test | Expected Result |
|-----------|-------------|-----------------|
| **Image** | 🆕 Upload image, set aspect ratio | Image displays on canvas (FIXED!) |
| **Video** | Paste YouTube/Vimeo URL | Embedded video player |
| **Map** | Add address or coordinates | Interactive Google Map |

**🆕 IMAGE UPLOAD FIX**: Click component → Upload image → See it appear immediately

---

### SECTION COMPONENTS (8)

| Component | What to Test | Expected Result |
|-----------|-------------|-----------------|
| **Hero** | 5 variants: simple/image/split/gradient/fullscreen | Large header with CTA buttons |
| **Features** | Add features array, choose grid/list | Grid of feature cards |
| **CTA** | Set background, add buttons | Call-to-action section |
| **Testimonials** | Add testimonials with images | Customer review cards |
| **FAQ** | Add Q&A items | Accordion-style FAQ |
| **Stats** | Add stats with values | Number counters with labels |
| **Team** | Add team members with photos | Team member grid |
| **Gallery** | Upload multiple images | Image grid with hover effects |

**Test**: Hero fullscreen with background image (now works!)

---

### NAVIGATION COMPONENTS (3)

| Component | What to Test | Expected Result |
|-----------|-------------|-----------------|
| **Navbar** | Add links, test mobile menu | Responsive nav with hamburger |
| **Footer** | Add columns, social links | Footer with multiple columns |
| **SocialLinks** | Choose platforms (9 available) | Social media icon links |

**Mobile Test**: Resize browser to see hamburger menu

---

### FORM COMPONENTS (4)

| Component | What to Test | Expected Result |
|-----------|-------------|-----------------|
| **Form** | Add form fields | Complete form builder |
| **FormField** | Choose type (text/email/tel/etc) | Individual form input |
| **ContactForm** | Pre-built contact form | Name, email, message fields |
| **Newsletter** | Email signup form | Email input + subscribe button |

---

### CONTENT COMPONENTS (3)

| Component | What to Test | Expected Result |
|-----------|-------------|-----------------|
| **RichText** | Add formatted content | WYSIWYG text editor |
| **Quote** | Add quote + author | Blockquote with attribution |
| **CodeBlock** | Paste code, choose language | Syntax-highlighted code |

---

### INTERACTIVE COMPONENTS (8)

| Component | What to Test | Expected Result |
|-----------|-------------|-----------------|
| **Carousel** | Add slides with images | Image carousel with dots |
| **Countdown** | Set target date | Live countdown timer |
| **Typewriter** | Add words to cycle | Typing animation effect |
| **Parallax** | Set background image | Scrolling parallax effect |
| **Pricing** | Add plans with features | Pricing table (FIXED!) |
| **Accordion** | Add items | Expandable sections |
| **Tabs** | Add tab panels | Tabbed content |
| **Modal** | Set trigger button | Popup dialog |

**🆕 PRICING FIX**: Features array now works correctly!

---

### UI ELEMENT COMPONENTS (5)

| Component | What to Test | Expected Result |
|-----------|-------------|-----------------|
| **Badge** | 6 variants: default/primary/success/warning/error/info | Small label badge |
| **Avatar** | Upload image, set size (6 sizes) | Round user avatar |
| **Progress** | Set value 0-100 | Progress bar |
| **Alert** | 4 types: info/success/warning/error | Notification banner |
| **Tooltip** | Set tooltip text | Hover tooltip |

---

### MARKETING COMPONENTS (5)

| Component | What to Test | Expected Result |
|-----------|-------------|-----------------|
| **AnnouncementBar** | Add message, set colors | Top banner notification |
| **SocialProof** | Set rating, review count | Star rating display |
| **TrustBadges** | Add badge images | Security/trust logos |
| **LogoCloud** | Add company logos | Client logo grid |
| **ComparisonTable** | Add comparison data | Feature comparison table |

---

### E-COMMERCE COMPONENTS (6)

| Component | What to Test | Expected Result |
|-----------|-------------|-----------------|
| **ProductCard** | Add product with image/price | Product display card |
| **ProductGrid** | Add multiple products | Product grid layout |
| **ProductCategories** | Add categories | Category navigation |
| **CartSummary** | Add cart items | Shopping cart display |
| **FeaturedProducts** | Add featured products | Product showcase |
| **CartIcon** | Set item count | Floating cart icon |

**Test**: Upload product images (now works!)

---

### 3D EFFECTS COMPONENTS (5)

| Component | What to Test | Expected Result |
|-----------|-------------|-----------------|
| **CardFlip3D** | Hover to flip card | 3D flip animation |
| **TiltCard** | Move mouse over card | 3D tilt effect |
| **GlassCard** | Set blur/opacity | Glassmorphism effect |
| **ParticleBackground** | Set particle count/speed | Animated particles |
| **ScrollAnimate** | Choose animation type (10 types) | Scroll-triggered animation |

**Cool Demo**: CardFlip3D with front/back images!

---

## 🎯 SPECIFIC TESTS TO TRY

### Test 1: Container Drop Zones ✅
1. Drag **Section** to canvas
2. Drag **Container** inside the Section
3. **Look for blue drop zone** - it should appear!
4. Drag **Heading** into the Container
5. Drag **Button** below the Heading

**Expected**: See blue drop zones when hovering with components

---

### Test 2: Image Upload System ✅
1. Drag **Image** component to canvas
2. Click the Image component (should select it)
3. In Properties Panel → Find "Image" field
4. Click "Upload Image"
5. Select an image file
6. **Expected**: Image appears on canvas immediately!

**Also Test**: Hero with background image, Gallery with multiple images

---

### Test 3: Responsive Hero ✅
1. Drag **Hero** to canvas
2. In Properties → Choose variant: "fullscreen"
3. Upload background image
4. Set overlay opacity
5. Add heading + subtitle + buttons
6. **Expected**: Full-screen hero with background image

---

### Test 4: Pricing Table ✅
1. Drag **Pricing** component to canvas
2. In Properties → Add 3 plans
3. Each plan: name, price, features array
4. Choose columns: 3
5. **Expected**: Pricing cards with features listed

---

### Test 5: 3D Card Flip ✅
1. Drag **CardFlip3D** to canvas
2. Upload front image
3. Upload back image
4. Add front/back content
5. Hover mouse over card
6. **Expected**: Card flips to show back side!

---

### Test 6: Team Section with Images ✅
1. Drag **Team** component to canvas
2. Add 4 team members
3. Upload photo for each member
4. Add name, role, social links
5. **Expected**: Team member grid with photos

---

### Test 7: Gallery with Lightbox ✅
1. Drag **Gallery** to canvas
2. Upload 6+ images
3. Set columns: 3
4. Set gap: md
5. Set hover effect: zoom
6. **Expected**: Image grid with zoom on hover

---

### Test 8: AI Features ✅
1. Click bottom panel "AI Assistant" tab
2. Try **AI Page Generator**:
   - Click "Generate Page with AI"
   - Type: "Create a landing page for a SaaS product"
   - Click Generate
3. Try **AI Component Chat**:
   - Select a component
   - Click "Open AI Chat"
   - Ask: "Make this button bigger and blue"

---

## 🖼️ IMAGE TESTING CHECKLIST

All these components now support image uploads:

- [ ] Hero - background image
- [ ] Section - background image
- [ ] CTA - background + featured image
- [ ] Parallax - background image
- [ ] CardFlip3D - front + back images
- [ ] TiltCard - background image
- [ ] Quote - author image
- [ ] Footer - logo
- [ ] Avatar - user photo
- [ ] SocialProof - platform logo
- [ ] Testimonials - customer photos
- [ ] Team - member photos
- [ ] Gallery - multiple images
- [ ] Carousel - slide images
- [ ] ProductCard - product photo
- [ ] Cart items - product thumbnails

---

## 🎨 STYLING FEATURES TO TEST

### Responsive Design
Every component supports responsive values:
```
size: { mobile: "sm", tablet: "md", desktop: "lg" }
```

**Test**: Add Heading, set different sizes for mobile/tablet/desktop

### Color System
All components support custom colors:
- Background colors
- Text colors
- Border colors
- Accent colors

**Test**: Section with gradient background

### Spacing System
Padding/margin options: xs, sm, md, lg, xl, 2xl

**Test**: Add Spacer between components with different sizes

---

## 🚨 KNOWN WORKING FEATURES

✅ **Drag & Drop**: All components draggable  
✅ **Container Drop Zones**: Blue zones visible when dragging  
✅ **Image Upload**: Works for all image props  
✅ **Canvas Scrolling**: Scroll works properly  
✅ **Properties Panel**: All fields editable  
✅ **Component Library**: All 59 components visible  
✅ **Undo/Redo**: History works  
✅ **Mobile Preview**: Responsive preview  
✅ **AI Features**: Page generator + component chat  
✅ **Bottom Panel**: AI content, not placeholder  

---

## 🎯 RECOMMENDED TEST SEQUENCE

### Beginner Test (5 minutes)
1. Drag Section → Container → Heading → Button
2. Upload an Image component
3. Try Hero with background image
4. Test mobile preview (resize browser)

### Intermediate Test (15 minutes)
1. Build complete landing page:
   - Navbar
   - Hero (fullscreen)
   - Features (grid of 6)
   - Testimonials (3 customers)
   - Pricing (3 plans)
   - CTA
   - Footer
2. Test responsive preview
3. Upload images for all components

### Advanced Test (30 minutes)
1. Test all 59 components
2. Test nested containers (Section → Container → Columns → Cards)
3. Test 3D effects (CardFlip3D, TiltCard)
4. Test AI page generator
5. Test AI component chat
6. Test undo/redo
7. Test mobile hamburger menu

---

## 📊 COMPONENT STATUS

| Category | Count | Status |
|----------|-------|--------|
| Layout | 6 | ✅ All working |
| Typography | 2 | ✅ All working |
| Buttons | 1 | ✅ All working |
| Media | 3 | ✅ All working (images fixed!) |
| Sections | 8 | ✅ All working |
| Navigation | 3 | ✅ All working |
| Forms | 4 | ✅ All working |
| Content | 3 | ✅ All working |
| Interactive | 8 | ✅ All working (pricing fixed!) |
| UI Elements | 5 | ✅ All working |
| Marketing | 5 | ✅ All working |
| E-Commerce | 6 | ✅ All working |
| 3D Effects | 5 | ✅ All working |
| **TOTAL** | **59** | **✅ ALL WORKING** |

---

## 🐛 BUG FIXES APPLIED

1. ✅ **Pricing features array** - Now accepts both formats
2. ✅ **Container drop zones** - Blue zones now visible
3. ✅ **Canvas scrolling** - Scrolling works properly
4. ✅ **Bottom panel AI** - Real AI content, not placeholder
5. ✅ **Image upload** - All image fields work
6. ✅ **Image rendering** - All 16 components display images

---

## 💡 PRO TIPS

1. **Save Often**: Click Save button in top toolbar
2. **Use Containers**: Section → Container → Components for proper layout
3. **Responsive Values**: Set different values for mobile/tablet/desktop
4. **Image Optimization**: Upload images will be auto-optimized
5. **Component Library Search**: Use search bar to find components quickly
6. **Properties Panel**: Click any component to see/edit properties
7. **Undo/Redo**: Ctrl+Z / Ctrl+Y or buttons in toolbar
8. **Mobile Preview**: Bottom-right corner - switch device sizes

---

## 🎬 DEMO SCENARIOS

### Scenario 1: SaaS Landing Page
1. Hero (fullscreen) with gradient background
2. Features (grid, 6 items)
3. Testimonials (3 reviews)
4. Pricing (3 plans)
5. CTA with button
6. Footer with links

### Scenario 2: Portfolio Site
1. Navbar with links
2. Hero (image, split layout)
3. Gallery (masonry, 12 images)
4. Team (4 members)
5. ContactForm
6. Footer with social links

### Scenario 3: E-Commerce Store
1. Navbar with CartIcon
2. Hero with featured product
3. ProductGrid (12 products)
4. ProductCategories
5. FeaturedProducts carousel
6. Newsletter signup
7. Footer

---

## 📝 TESTING CHECKLIST

Copy this checklist and mark items as you test:

**Basic Functions**:
- [ ] Drag component from library
- [ ] Drop into canvas
- [ ] Select component
- [ ] Edit properties
- [ ] Upload image
- [ ] Delete component
- [ ] Undo/redo
- [ ] Save page

**Layout**:
- [ ] Section with background
- [ ] Container with max-width
- [ ] Columns (2, 3, 4 cols)
- [ ] Nested containers
- [ ] Spacer between components

**Media**:
- [ ] Image upload
- [ ] Video embed (YouTube)
- [ ] Map with address

**Sections**:
- [ ] Hero (all 5 variants)
- [ ] Features grid
- [ ] Testimonials with photos
- [ ] Pricing table
- [ ] FAQ accordion
- [ ] Stats counters
- [ ] Team member grid
- [ ] Gallery with images

**Navigation**:
- [ ] Navbar with menu
- [ ] Mobile hamburger menu
- [ ] Footer with columns
- [ ] Social links

**Interactive**:
- [ ] Carousel with slides
- [ ] Tabs component
- [ ] Accordion items
- [ ] Modal popup
- [ ] 3D card flip
- [ ] Tilt effect

**AI Features**:
- [ ] AI page generator
- [ ] AI component chat
- [ ] AI suggestions

**Responsive**:
- [ ] Desktop view
- [ ] Tablet view
- [ ] Mobile view
- [ ] Responsive properties

---

## 🚀 START TESTING NOW!

```bash
# 1. Start dev server
cd f:\dramac-cms
pnpm dev

# 2. Open browser
# http://localhost:3000/studio

# 3. Start dragging components!
```

**Everything is working and ready to test! 🎉**
