# Moreland Estate Management Insurance Claim Portal - Design Guidelines

## Design Approach
**Reference-Based:** Professional property management portal inspired by premium financial services (Stripe's restraint) + hospitality platforms (Airbnb's trust-building) with custom property-focused elements.

## Core Design Principles
- **Trust & Professionalism:** Sophisticated design that instills confidence in handling sensitive insurance claims
- **Clarity Over Cleverness:** Straightforward layouts that prioritize user task completion
- **Progressive Disclosure:** Multi-step form reveals information as needed, never overwhelming

## Layout System
**Spacing Units:** Tailwind spacing of 4, 6, 8, 12, 16, 20, 24, 32 for consistent rhythm
- Form sections: `py-12` to `py-20`
- Card padding: `p-6` to `p-8`
- Element gaps: `gap-6` to `gap-8`
- Mobile: Reduce by 25-50% (e.g., `py-6 lg:py-12`)

**Container Strategy:**
- Landing page: Full-width hero with `max-w-6xl` content sections
- Form pages: Centered `max-w-4xl` container for optimal form width
- Success page: `max-w-3xl` centered content

## Typography
**Font Stack:** Inter (modern, professional) via Google Fonts
- Headings: `font-bold`, sizes: `text-4xl` (hero), `text-3xl` (h1), `text-2xl` (h2), `text-xl` (h3)
- Body: `font-normal text-base` (16px) for readability
- Small text/labels: `text-sm` with `text-slate-600`
- Form inputs: `text-base` for accessibility

## Component Library

### Navigation
- Landing page: Moreland logo top-left (h-16 to h-20), minimal navigation
- Form header: Logo overlay on building image (h-12 to h-16, 90% opacity)

### Buttons
- Primary CTA: Large rounded buttons (`rounded-lg px-8 py-4 text-lg font-semibold`)
- Secondary: Outlined style with hover states
- Back buttons: `ChevronLeft` icon + text, bottom-left placement
- Buttons on images: Blurred background (`backdrop-blur-sm bg-white/10`)

### Forms
- Input fields: `rounded-lg border-2 border-slate-300 px-4 py-3` with focus states
- Labels: `text-sm font-medium text-slate-700 mb-2`
- Error states: Red border + error message below
- Checkbox/radio: Custom styled with Moreland brand accent

### Cards & Containers
- Primary cards: White background, `rounded-xl shadow-lg` with `border border-slate-200`
- Info boxes: Colored borders (blue for info, orange for warnings, green for success)
- Elevated sections: Subtle shadows (`shadow-md` to `shadow-xl`)

### Progress Indicators
- Step bubbles: Circular numbered indicators (1-8) with checkmarks when complete
- Progress bar: Horizontal bar showing percentage completion
- Current step: Blue fill, completed: green checkmark, upcoming: gray outline

### File Uploads
- Drag-and-drop zone: Dashed border, hover state changes to solid
- Upload icon: `Upload` from lucide-react
- File previews: Thumbnail grid with remove buttons

### Badges & Trust Signals
- Trust badges: Icon + text in horizontal layout (`flex items-center gap-2`)
- Status indicators: Colored dots or icons for claim status
- Warning banners: Orange/amber background with exclamation icon

## Images

### Hero Section (Landing Page)
**Large hero image:** Modern city buildings or luxury apartment exterior
- Dark gradient overlay (bottom-to-top) for text readability
- Full-width, 60-80vh height on desktop, 50vh mobile
- Moreland logo centered and prominent over image
- Placement: Top of landing page

### Form Header
**Building photograph:** Professional property/apartment building
- Gradient overlay for logo visibility
- Full-width, reduced height (~300px desktop, 200px mobile)
- Moreland logo overlaid top-left
- Placement: Top of each form page

### Success Page
**Hero building image:** Luxury residential building or modern property
- Gradient header with green success styling
- Logo integrated into success header
- Placement: Top of success page

### Supporting Images
- "How It Works" section: Optional small building icons or property illustrations
- Contact section footer: Subtle building background or none

**Image Treatment:**
- All images from Unsplash or similar high-quality sources
- Consistent gradient overlays: `from-slate-900/60 to-slate-900/30`
- Responsive sizing with proper aspect ratios

## Page-Specific Guidelines

### Landing Page
- Full-width hero with Moreland logo, headline, and dual CTAs
- Trust badges row: 3-4 items in horizontal layout
- "How It Works" section: 3 numbered cards explaining process
- Blue notice box: Clear messaging about Moreland's facilitator role
- Contact section: Email and phone with subtle background

### Form Pages (Steps 1-8)
- Building image header with logo
- Orange warning banner: Important 60-day deadline notice
- Progress indicators: Bubbles + percentage bar
- Form fields: Single column layout for optimal scanning
- Back button: Bottom-left, Next/Submit: Bottom-right
- Consistent padding and spacing throughout

### Success Page
- Green success header with checkmark and claim reference
- Next steps: 3 color-coded cards (blue, purple, green) with icons
- Orange reminder banner with warnings
- Contact cards for support
- Print-friendly layout

## Accessibility
- Focus states: Blue ring (`focus:ring-2 focus:ring-blue-500`)
- ARIA labels on all interactive elements
- Sufficient contrast ratios (WCAG AA minimum)
- Keyboard navigation support throughout

## Animations
**Minimal & Purposeful:**
- Page transitions: Subtle fade-in (`transition-opacity duration-300`)
- Success checkmark: Scale animation on page load
- NO scroll animations, parallax, or excessive motion