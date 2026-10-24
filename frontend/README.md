# Junction Community Matchmaker -- Frontend

React 19 + TypeScript + Vite + Tailwind CSS

## What we built

A real-time hackathon companion app for Junction at Tampere University. Participants find teams, teams find members, and everyone finds mentors -- all on a live campus map.

### Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/login` | LoginPage | Hero landing with feature cards + sign-in form |
| `/register` | RegisterPage | Account creation (participant or mentor) |
| `/onboarding` | OnboardingPage | AI profile extraction from free-text prompt |
| `/map/teams` | TeamMatchingMapPage | Canvas map with team + participant sprites |
| `/map/mentors` | MentorDiscoveryMapPage | Canvas map with mentor sprites, expertise filter |
| `/profile` | ProfilePage | Edit skills, roles, interests, location |
| `/team/:id` | TeamPage | Create/manage team, toggle recruitment |
| `/matches` | MatchesPage | Pending invitations, accept/decline |

---

## The Canvas Map

The centrepiece of the app. Instead of dropping pins on a tile-based map library, we render the entire Hervanta Campus as a **canvas-drawn map** with traced building geometry and pixel-art characters.

### Why canvas instead of Leaflet/Google Maps

1. **No tiles, no network** -- the map works offline and loads instantly. There are no tile requests, no API keys, no rate limits.
2. **Pixel-art style** -- the retro aesthetic is impossible with standard map libraries. Every building, road, and person is drawn pixel-by-pixel in the same visual language.
3. **Full control** -- selection indicators, name tags, zone labels, and sprite animations are all part of one draw call. No DOM overlay juggling.

### How the map is drawn

The map component lives in `src/components/CanvasMap.tsx`. Every frame, it draws these layers in order:

```
1. Background        #161210 solid fill
2. Grid              20px lines in #1c1813
3. Roads & parking   Traced polygons (GEO_G), filled #221d17, evenodd rule
4. Building shadows  Same polygons as buildings, offset 3px right+down, filled #0a0908
5. Buildings         Traced polygons (GEO_B), filled #2a241c, stroked #8a7a5a
6. Street labels     "IBM Plex Sans" 10px in #5a4c3a (hidden when zoomed out)
7. Building names    "Press Start 2P" 7px in #c8b890 at 60% opacity
8. Zone tags         Pixel-font labels with hard-shadow borders
9. People sprites    8x14 pixel characters, sorted by Y for depth
10. Name tags        Labels above selected/visible sprites
```

### Building geometry

The campus buildings and roads were **traced from the real Tampere University Hervanta Campus map** as polygon coordinate arrays:

- **`GEO_B`** -- 11 building polygons (Tietotalo, Noodi, Sahkotalo, Rakennustalo, Konetalo, Kampusareena, Main building, Festia, Tamppi Areena, Parking garage, Research facilities, Student sauna). Each polygon is an array of `[x, y]` coordinate pairs in a 1215x862 coordinate space.
- **`GEO_G`** -- Road and parking area polygons. Filled with the `evenodd` fill rule to handle holes.

Buildings are rendered with a three-pass technique:
1. Shadow pass -- the same polygon translated 3px right and down, filled solid black
2. Fill pass -- the polygon filled with the building color
3. Stroke pass -- the polygon outlined

### Zone system

Seven named zones are placed at key campus locations:

| Zone | Building | Purpose |
|------|----------|---------|
| Hacking hall | Kampusareena | Main hacking area |
| Mentor corner | Main building | Where mentors sit |
| Food | Festia | Cafeteria |
| Main stage | Tamppi Areena | Presentations |
| Hardware lab | Konetalo | Electronics/drones |
| Quiet room | Tietotalo | Focus work |
| Entrance | Outside | Arrival point |

Each zone renders as a pixel-font label with a hard shadow, 2px border, and role-colored text. The label is always visible regardless of zoom level.

---

## Pixel-Art Character Sprites

Every person on the map is drawn as an **8x14 pixel sprite** with 8 body parts:

```
..CCCC..    C = cap (role color)
.CCCCCC.    c = cap brim (darker shade of role color)
.cccccc.    H = hair (#3a2416)
.HSSSSH.    S = skin (5 tones)
.SESSES.    E = eyes (#15121a)
..SSSS..    T = shirt (8 colors)
..TTTT..    P = pants (6 colors)
.TTTTTT.    B = shoes (#2a1b12)
.STTTTS.
..TTTT..
..PPPP..
..P..P..
..P..P..
.BB..BB.
```

### How role is communicated visually

The **cap color** encodes the person's role:

| Role | Cap color | Hex |
|------|-----------|-----|
| Developer | Blue | `#3d8bfd` |
| Designer | Coral | `#e07a5f` |
| Data / AI | Green | `#7bc67e` |
| Business | Purple | `#c084fc` |
| Mentor | Gold | `#e6b84a` |

The cap brim is a 72% darkened shade of the cap color, giving depth. Shirt, pants, and skin colors are assigned pseudo-randomly per person for visual variety, while the cap stays tied to role so you can scan the map and instantly tell who does what.

### Sprite rendering

Each sprite is drawn pixel-by-pixel using `ctx.fillRect` calls:

```typescript
function drawSprite(ctx, x, y, px, palette) {
  for (let r = 0; r < 14; r++) {
    for (let c = 0; c < 8; c++) {
      const key = SPRITE[r][c];      // "C", "S", "T", ".", etc.
      if (key === ".") continue;      // transparent
      ctx.fillStyle = palette[key];   // look up color
      ctx.fillRect(x + c * px, y + r * px, px, px);
    }
  }
}
```

The `px` parameter controls the pixel size: **2px at normal zoom, 3px when zoomed in past 2.2x**. This keeps sprites readable at all zoom levels without anti-aliasing (`imageSmoothingEnabled = false`).

A shadow rectangle is drawn under each sprite's feet for grounding.

### Name tags

When a sprite is selected or the map is zoomed in far enough, a **name tag** appears above their head:

- Background: `#1c1814` (surface color)
- Border: role color (2px when selected, 1px otherwise)
- Font: Press Start 2P at 7px
- Selected sprites show full name; others show first name only
- Selected sprites get a bouncing pixel arrow indicator above the tag

### Coordinate mapping

The backend stores locations as `lat`/`lng` (real GPS coordinates near Tampere University). The `geoToMap()` function maps these to the 1215x862 canvas coordinate space:

```typescript
function geoToMap(lat, lng) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 1215;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 862;
  return { x, y };
}
```

---

## Interaction

### Pan and zoom

- **Drag** to pan (pointer events with capture)
- **Scroll wheel** to zoom toward screen center
- **+/-/ME buttons** for zoom and re-center
- View is clamped so the map can't be dragged off-screen

### Click to select

Clicking the canvas finds the nearest marker within 30px and fires `onMarkerClick`. The parent page then shows a detail card with the person/team info and action buttons.

### Search overlay

A search box floats above the map. Typing filters the visible markers in real time. The search box uses the same pixel-art design language: square corners, 2px borders, hard shadow.

---

## Design System

The entire UI uses CSS custom properties from a single source:

```css
:root {
  --bg:      #12100e;    /* page background */
  --surface: #1c1814;    /* cards, panels */
  --tile:    #2a241c;    /* input backgrounds, tags */
  --fg:      #f3e6c8;    /* primary text */
  --muted:   #a89878;    /* secondary text */
  --primary: #e6b84a;    /* accent, active states, labels */
  --you:     #3d8bfd;    /* "you" indicator */
  --ink:     #0a0908;    /* shadows, deepest dark */
  --line:    #5a4c3a;    /* borders */
}
```

### Typography

- **Press Start 2P** -- headings, labels, nav, buttons (6-14px). Gives the retro/pixel feel.
- **IBM Plex Sans** -- body text, descriptions (12-14px). Clean and readable.

### Visual rules

- Square corners everywhere (border-radius: 0)
- 2px solid borders on all interactive elements
- Hard pixel shadows (2-3px offset, no blur)
- Active/selected state: `background: var(--primary); color: var(--ink)`
- Button press feedback: `transform: translate(1px, 1px); box-shadow: none`
- No gradients, no glass effects, no smooth shadows

---

## Running

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build
npm run lint         # ESLint
npx vitest run       # 42 tests
```

## Tests

- `src/components/HeroSection.test.tsx` -- NavBar rendering, links, stats
- `src/components/SuggestedTeams.test.tsx` -- suggestion panel rendering
- `src/lib/mapConstants.test.ts` -- coordinate mapping functions
