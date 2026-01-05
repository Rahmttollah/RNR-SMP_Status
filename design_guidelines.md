# Minecraft Server Monitoring Dashboard - Design Guidelines

## Design Approach
**Reference-Based:** Drawing from Minecraft's iconic visual language combined with modern gaming dashboard patterns (Discord, Steam, Riot Client). Creating a premium gamer experience that balances nostalgia with functional data visualization.

## Typography
- **Primary Font:** "Press Start 2P" (Google Fonts) for headings and key labels - authentic 8-bit pixelated aesthetic
- **Secondary Font:** "Roboto Mono" (Google Fonts) for data, metrics, and body text - maintains tech/gaming vibe while ensuring readability
- **Hierarchy:** Pixelated headings (text-xl to text-4xl), mono metrics (text-sm to text-2xl), support text (text-xs to text-sm)

## Layout System
**Spacing:** Use Tailwind units of 2, 4, 6, and 8 consistently (p-4, gap-6, m-8). Generous spacing creates premium feel while maintaining density for data-rich sections.

**Grid Structure:** Dashboard uses 12-column grid with sidebar. Main content area uses 3-4 column card layouts on desktop, stacking to single column on mobile.

## Core Components

### Navigation Sidebar (Left)
- Fixed 64px width sidebar with pixelated Minecraft block icons
- Server logo at top (creeper face or custom server icon)
- Navigation items: Overview, Players, Performance, Console, Settings, Plugins
- Active state uses glowing emerald effect
- Expandable on hover to show labels

### Top Bar
- Server status indicator (Online/Offline) with animated pulse
- Current player count with animated increment/decrement
- TPS (Ticks Per Second) meter with color-coded performance
- Quick action buttons (Start/Stop/Restart) with confirmation modals
- Time display showing server uptime

### Dashboard Cards
- Stone/dark oak texture backgrounds with subtle grain
- Glowing borders (emerald green for active, redstone red for alerts)
- Drop shadows creating depth and layering
- Card headers with pickaxe/sword icons
- Hover states lift cards with animated glow intensification

### Stats Widgets
**Player Counter:** Large pixelated numbers with player head avatars in grid below
**Memory Usage:** Progress bar styled as experience bar (green fill with notched segments)
**CPU Meter:** Circular gauge resembling compass with animated needle
**TPS Graph:** Line chart with minecraft-style grid background, diamond markers at data points

### Live Console
- Terminal-style output with monospace font
- Stone texture background
- Scrolling log entries with color-coded message types (INFO=white, WARN=gold, ERROR=red)
- Command input at bottom with glowing cursor animation

### Player List
- Card-based layout showing player skins as avatars
- Player names in pixelated font
- Online duration, location (world/coordinates), health/hunger bars
- Kick/ban action buttons (stone button texture)

## Animations

**On Load:**
- Staggered fade-up entrance for dashboard cards (100ms delays)
- Stats counter animations rolling from 0 to current values
- Graphs drawing in with smooth bezier curves

**Continuous:**
- Pulsing glow on active server status indicator
- Floating particle effects (subtle green pixels drifting upward on hover)
- Breathing effect on critical alert badges
- Rotating compass needle for CPU meter
- Scrolling texture overlay on card backgrounds (very subtle parallax)

**Interactions:**
- Button press animations (stone texture depression)
- Card hover elevations with glow intensification
- Smooth number transitions when stats update
- Ripple effects on interactive elements (spreading from click point)
- Graph data point pulse when new data arrives

**State Changes:**
- Status transitions (offline→online) with burst animation
- Alert badges pop in with bounce
- Console messages slide in from bottom with fade

## Images

**Hero Section:** No traditional hero image needed - this is a dashboard with immediate data display

**Background Elements:**
- Subtle tiled stone texture covering entire dashboard background
- Minecraft grass/dirt texture strip along top edge (decorative)
- Dark oak plank texture for sidebar

**Avatar/Icons:**
- Server icon/logo in top-left (64x64px Minecraft-style)
- Player skin renders for active players list (use Crafatar API references)
- Pixelated item icons for navigation (pickaxe, chest, redstone, etc.)

**Accent Graphics:**
- Corner decorations using Minecraft UI frame elements
- Torch icons for active/highlighted states
- Emerald gem for success indicators, redstone dust for errors

## Visual Treatments
- All containers use layered depth (background texture → border glow → content)
- Color temperature: Warm browns/greens for primary, cool grays for secondary
- Border styles: 2-3px borders with subtle inner shadows
- Blur backgrounds for modals/overlays (backdrop-blur-md)
- Pixelated edges on UI elements where appropriate (using image-rendering)

## Responsive Behavior
Desktop: Full sidebar + 3-4 column card grid
Tablet: Collapsible sidebar + 2 column grid
Mobile: Bottom navigation bar + single column stacked cards, maintaining all data visibility