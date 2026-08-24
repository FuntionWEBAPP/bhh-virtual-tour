# Virtual tour

360° walkthrough of the Broken Hill Hotel, built for one goal first: someone
planning a function can look around, understand the space, and hit
**Enquire** without anyone explaining anything to them. Ordinary visitors
checking the vibe (and people who just want to know the layout before they
arrive) are the secondary case.

Built on [Pannellum](https://pannellum.org/) (MIT-licensed, vendored in
`vendor/pannellum/`) - no CDN dependency, no build step, no paid services,
nothing that bills. See "Why Pannellum, not Photo Sphere Viewer" below for
the reasoning; the short version is a hard, self-imposed 400KB total-payload
budget that a Three.js-based viewer would blow through in library code
alone, before a single photo loads.

## Preview it

```bash
node tools/dev-server.js
```

Then open http://localhost:8080. (Any static file server works - this one's
just a zero-dependency convenience for local preview. Nothing to build; the
folder is plain static files, deployable as-is to any static host.)

## Tour Editor - the normal way to make changes

Open **`editor.html`** in Chrome or Edge (needs the File System Access API -
Safari/Firefox aren't supported) and click **Open Tour Folder**, pointing it
at this project's root folder - it'll ask for read/write access to that
folder up front. From there:

- **+ Add Room** - title + a photo straight from your camera roll; resized,
  compressed, and its vertical angle of view computed automatically.
- **Click anywhere on the photo** to drop a waypoint exactly there - link to
  another room, or a text comment. Pitch/yaw come from where you actually
  clicked, not an estimate.
- Click an **existing waypoint arrow** to edit or delete it.
- **Zone / Seated capacity / Cocktail capacity / blurb** fields per room -
  these feed the public tour's space-facts panel (the "what does this room
  actually seat, what's it good for" question every function enquiry asks).
  Leave any of them blank if you don't have the number yet - the panel just
  omits what's missing rather than showing a blank.
- **▲ / ▼** to reorder a room; **Set as Start Scene**; **Replace Photo**
  (keeps existing waypoints, recomputes angle-of-view); **Delete Room**
  (cleans up any other room's waypoints that pointed at it).
- **Save All Changes** writes straight to `data/tour-scenes.json` and
  `img/scenes/` - nothing uploaded, nothing leaves your computer. Commit and
  push afterward to make it live; the editor doesn't do that part.

The public tour reads whatever's in `data/tour-scenes.json` at load time -
editor and live site are always looking at the same data.

### Hand-editing the data instead

`data/tour-scenes.json` is plain JSON if you'd rather edit it directly. Top
level: `venue` (name/phone/address/enquiry link, shown in the persistent CTA
button) and `scenes` (array, order matters for nothing except the gallery
strip's default order). Per scene: `title`, `zone` (a label like `"Zone 03"`,
or `null`), `image` (filename in `img/scenes/`), `preview` (a tiny base64
data-URI thumbnail used for the progressive-load blur-up and the gallery
strip - the editor generates this for you), `vaov` (vertical angle of view
in degrees - compute as `360 * photo_height / photo_width` if adding a photo
outside the editor), `capacity` (`{seated, cocktail}` or `null`), `blurb`,
and `hotspots` (`type: "scene"` with a `target` room key, or `type: "info"`
for a comment - both need `pitch`/`yaw`). Alt+click anywhere in the public
tour still logs pitch/yaw to the console for this reason.

## Why Pannellum, not Photo Sphere Viewer

Both were seriously considered - PSV's plugin ecosystem (`virtual-tour` for
labelled node navigation, `plan` for a mini floor map, `gallery` for a
thumbnail strip) covers several of the features below natively, which is
real. But it's Three.js-based, and the actual measured cost settles it:

| | gzipped |
|---|---|
| Pannellum (core, everything used here) | ~20KB |
| PSV core + Three.js alone, no plugins yet | ~175KB |
| PSV core + Three.js + virtual-tour + markers + plan + gallery | ~214KB |

Numbers are real, measured from the published npm packages, not estimated -
`core@5.15.1`, `three@0.185.1`. Against a self-imposed 400KB total-payload
budget (HTML+CSS+JS+entry preview), PSV's library weight alone eats over
half of it before any photo loads. Pannellum leaves nearly the whole budget
for photos and the app itself. The map/gallery/CTA-bar/facts-panel features
PSV would have given for free are hand-built here instead (plain HTML/CSS/
JS, see below) - more code to own, but a fraction of the download weight,
and Pannellum was already integrated, debugged, and full of real photos by
the time this comparison was run, which counted for something too.

## Features

**Must-have list, all implemented:**

- Labelled floor arrows (not bare dots) - every nav hotspot shows its
  destination on hover/tap.
- Persistent header bar - current room name + zone, and an "Enquire about a
  Function" button that never disappears on scene change (unlike Pannellum's
  own title box, which is hidden in favour of this).
- Space facts panel (the "i" button) - zone, capacity, a blurb, and its own
  enquiry link, per room.
- Mini map (the "Map" button) and a gallery thumbnail strip (bottom of
  screen, using the same tiny preview images as the progressive-load blur-up
  - free, no extra assets) - two different ways to jump to any room, so
  nobody gets lost.
- Deep links - `?scene=restaurant` loads straight into that room; the URL
  updates live as you move around, so right-clicking "Copy Link" at any
  point gives a link back to exactly that room.
- Progressive load - a blurred low-res preview (embedded per scene, ~700
  bytes) shows instantly behind the loading screen while the real photo
  streams in; neighbouring rooms' photos are prefetched in the background
  once the current one settles, so the next click already has its image
  warm.
- Attract mode - slow auto-rotate starts after ~3s of no interaction, and
  stops permanently (not just pauses) the moment anyone drags, clicks, or
  scrolls.
- Gyroscope off by default (Pannellum's own toggle button appears
  automatically on devices that support it - never auto-enabled).
- Accessible fallback - a `<noscript>` block with the same written layout
  description and enquiry details; `prefers-reduced-motion` kills both the
  attract-mode auto-rotate and the first-visit hint's animation.
- Embed mode - `?embed=1` strips the header, hint and gallery strip for
  iframe use: `<iframe src="https://funtionwebapp.github.io/bhh-virtual-tour/?embed=1" ...>`.
- First-5-seconds hint - "drag to look around / tap an arrow to move"
  fades in after a beat, dismisses itself on first interaction or ~5s.

**Deliberately not built yet, with reasons:**

- **Nadir patch** (hiding the tripod at the bottom of each photo) -
  skipped because these specific photos have such a limited vertical field
  of view they never show the floor near the camera in the first place;
  see `SHOOTING.md`.
- **Analytics** - the brief asked for hotspot-click/scene-view/CTA-click
  tracking via a free, cookieless method, and explicitly said to ask before
  wiring up anything. Not wired to any endpoint yet - needs a real decision
  on where events go (a Google Apps Script endpoint was mentioned; that
  would need its own URL and a quick look at whether it should share
  infrastructure with the separate `bhh-functions` project or stay fully
  independent, given the two are deliberately kept apart - see below).
- **True multi-photo blending** ("3-4 photos of the same spot merged into
  one cleaner image") - investigated and deliberately not attempted; see
  the Room Map section below for why, and what's built instead.

## Room map

18 scenes (up from an earlier 11 - every genuinely distinct angle from the
source photo folder is now in, not just one photo per named room), built as
a walkable graph rather than a jump-to-any-room menu:

```
Front of Pub -- Side Bar -- Back Bar -- Back Bar Entrance -- Rear Foyer
     |            (+2 extra Back Bar angles)                     |
The Park (junction) ------------------------------------ Restaurant Entrance
     |                                                            |
Garden Bar (+2 more angles) -- stairs -- The Park (+2 more stops) -- Restaurant (+1 more)
```

This graph replaced an earlier version where two physically-adjacent spaces
("Front Terrace" and "Side Terrace") had been treated as unrelated rooms -
built from trusting photo *filenames*, which turned out not to be a
reliable guide to what a photo actually shows (several were flat-out
mislabeled). The current graph was built by matching physical landmarks
that appear in more than one photo instead - the same mural wall, the same
staircase, the same shopfront across the street.

**On "3-4 photos of the same area should create a cleaner picture"**: real
feedback, and worth being straight about rather than silently doing
something worse - genuinely blending several photos into one needs precise
alignment data (feature-matching, exposure registration) that independent
handheld 360 sweeps don't have; naively merging them produces ghosting, not
a cleaner image. What's built instead, which is the achievable version of
the same idea: every extra angle of a room is its own close waypoint, so
walking through a bigger space (the Back Bar, the Garden Bar and its
staircase, the Restaurant) is several short hops instead of one big jump.
That's a real, working difference now, not a placeholder - e.g. the
Garden Bar's old single "walk up the stairs" jump is now four separate
photos taken along that actual walk.

**Weakest links in this graph** - lower confidence than the rest, worth
checking first if a hotspot ever lands somewhere odd: `front-of-pub`'s link
into `side-bar` (which exact street-level door this is), and `garden`'s
link back up toward The Park (the staircase isn't clearly visible in that
specific photo). Everything else was matched against a real shared
landmark, not guessed. Hotspot *positions* generally are a first pass -
estimated from the photos, not measured live - use the Tour Editor to nudge
anything that's not sitting quite right; a click-placed waypoint there is
exact by construction.

Source photos live at `C:\Users\Liam\Desktop\PUB PICTURES\` (not in this
repo - only the processed/resized copies in `img/scenes/` are committed).
A handful of near-duplicate shots (near-identical repeats of the same spot,
and two files - `HALLWAY.jpg` and one un-numbered `Back Bar.jpg` - that
turned out to be mislabeled duplicates of other rooms, not real content of
their own) were left out; everything else usable is in.

## Nadir, gyro, and other technical notes

- **`vaov`/`haov`** (in `data/tour-scenes.json`, applied in `tour.js` via
  `js/tour-shared.js`): real phone-shot 360s rarely cover the full 180°
  vertically - Pannellum needs to be told exactly how much of the sphere a
  given photo covers, or it stretches a partial photo across the whole
  thing. See `SHOOTING.md` for why these particular source photos are
  narrower than a true equirectangular in the first place.
- **Hotspots must include Pannellum's own CSS classes alongside custom
  ones** (`js/tour-shared.js`) - a real bug, found and fixed: Pannellum
  only adds its click-target-sizing classes when you *don't* supply a
  custom `cssClass`; supplying one replaces them instead of adding to
  them. Every hotspot on the very first version of this tour had ~zero
  actual clickable area because of this, despite looking fine visually.
  Fixed by including the real classes explicitly. If a future change ever
  needs to touch hotspot styling again, this is the trap to remember.

## Deploying

Plain static files - push to `master` and GitHub Pages serves it straight
from the repo root, no build step. Live URL:
`https://funtionwebapp.github.io/bhh-virtual-tour/`. Embed on the real pub
website via `<iframe>` with `?embed=1` appended, or just link to the plain
URL.

## Relationship to the Rachel booking system

Deliberately separate from the `bhh-functions` repo (Rachel, the Apps
Script booking/functions-management system) - different audience (public
visitors vs. staff), different hosting model (static files vs. Apps
Script), nothing shared. If the two ever need to link up (e.g. the "Enquire
about a Function" button pointing somewhere Rachel-adjacent, or analytics
events landing on a shared Apps Script endpoint), that's a deliberate,
separately-considered decision each time - not an assumption to build in.

## Status

- [x] Base viewer + config structure, real photos (18 scenes)
- [x] Hotspots actually clickable (see the cssClass bug note above)
- [x] Tour Editor - photos, order, waypoints, and now zone/capacity/blurb,
      all saved via the File System Access API, no backend
- [x] Persistent header/CTA, space facts panel, mini map, gallery strip
- [x] Deep links, embed mode, progressive load, attract mode, first-visit
      hint, accessible `<noscript>` fallback, reduced-motion support
- [x] `SHOOTING.md` - capture guide for reshoots and new rooms
- [ ] Real logo (loading screen currently a text wordmark)
- [ ] Analytics wiring (deliberately not done without a decision on where
      events should go - see Features above)
- [ ] Hotspot positions fine-tuned against a live walkthrough (first pass)
- [ ] Embedded into the main pub website
