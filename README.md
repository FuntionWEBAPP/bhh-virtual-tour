# Virtual tour

360-degree click-and-drag walkthrough of the Broken Hill Hotel, built on
[Pannellum](https://pannellum.org/) (MIT-licensed, vendored in
`vendor/pannellum/` - no CDN dependency, no build step, no paid services).

## Preview it

```bash
node tools/dev-server.js
```

Then open http://localhost:8080. (Any static file server works too - this
one's just a zero-dependency convenience for local preview. There's nothing
to build; the folder is plain static files, deployable as-is to any static
host.)

## Tour Editor - the normal way to make changes

Open **`editor.html`** in Chrome or Edge (needs the File System Access API -
Safari/Firefox aren't supported) and click **Open Tour Folder**, pointing it
at this project's root folder. From there:

- **+ Add Room** - give it a title and pick a photo straight from your
  phone/camera roll; it's resized and compressed automatically, and its
  vertical angle of view is computed from the photo's own dimensions - no
  manual math.
- **Click anywhere on the photo** to drop a waypoint at that exact spot -
  either a link to another room (pick it from a list) or a text comment.
  The pitch/yaw are captured from where you actually clicked, not
  estimated from a static image, so placement is accurate the first time.
- Click an **existing waypoint arrow** to edit or delete it.
- **▲ / ▼** on a room in the sidebar to reorder it; **Set as Start Scene**
  to change which room the tour opens on; **Replace Photo** to swap a
  room's photo without rebuilding its waypoints; **Delete Room** removes a
  room and cleans up any other room's waypoints that pointed at it.
- **Save All Changes** writes straight to `data/tour-scenes.json` and
  `img/scenes/` in your real project folder - nothing is uploaded anywhere,
  nothing leaves your computer. Commit and push those files afterward to
  make the changes live (the editor doesn't do that part for you).

The public tour (`index.html`) reads whatever's in `data/tour-scenes.json`
at load time - the editor and the live site are always looking at the same
data, there's no separate publish step beyond your normal git push.

### Hand-editing the data instead

`data/tour-scenes.json` is plain JSON if you'd rather edit it directly -
same fields the editor writes: `title`, `image` (filename in `img/scenes/`),
`vaov` (vertical angle of view in degrees - a phone-shot 360 rarely covers
the full 180, compute this as `360 * photo_height / photo_width` if you add
a photo outside the editor), and `hotspots` (`type: "scene"` with a
`target` room key, or `type: "info"` for a comment - both need `pitch`/
`yaw`). Holding **Alt and clicking** anywhere in the *public* tour
(`index.html`) still logs pitch/yaw to the console the same way, for this
exact reason.

## Room map

The tour is built as a walkable graph, not a jump-to-any-room menu - every
hotspot connects two physically adjacent spots, so moving through it feels
like walking the venue (closer to Google Street View than a slideshow):

```
Front of Pub -- Side Bar -- Back Bar -- Back Bar Entrance -- Rear Foyer
     |                                                            |
The Park (junction) ---------------------------------- Restaurant Entrance
     |                                                            |
  Garden Bar                The Park (terrace) -- The Park (glass door) -- Restaurant
     (Two Mile Spring, downstairs)
```

**This isn't the original room list** - it went through a real correction.
Photo *filenames* turned out not to be a reliable guide to what room a
photo actually shows (several were flat-out mislabeled), so the current
graph was built by matching physical landmarks that appear in more than one
photo instead - the same mural wall, the same staircase, the same shopfront
across the street, etc. The single biggest fix: "The Park" is one
continuous mid-level deck that runs from the street entrance around the
side of the building to a staircase down into the Garden Bar courtyard -
earlier this got treated as two unrelated rooms ("Front Terrace" and "Side
Terrace"), which is why the tour didn't actually flow before.

**Two weakest links in this graph** - the first place to look if a hotspot
still doesn't land where it should:
1. `front-of-pub -> side-bar` (which exact street-level door this is)
2. `garden`'s hotspot back up to `the-park-junction` (the staircase isn't
   clearly visible in the specific photo used for the Garden Bar scene, so
   its position is a reasonable guess, not a landmark match)

Source photos live at `C:\Users\Liam\Desktop\PUB PICTURES\` (not in this
repo - only the processed/resized copies in `img/scenes/` are committed).
Several areas had multiple shots taken (Back Bar, Restaurant, the various
Beer Garden angles); one was picked per scene - the rest are sitting unused
in that folder if you ever want a second angle as its own extra stop.

**Hotspot placement was a first pass** when this graph was built (estimated
by matching a doorway/staircase's pixel position in the source photo to a
compass angle, not measured live) - use the Tour Editor above to nudge
anything that's not sitting quite right; clicking to place a waypoint there
is exact by construction, no more estimating.

**"I want it to feel like walking, not clicking"** - real feedback, and the
honest answer: a photo-sphere viewer can't blend two photos taken at
different real-world spots into smooth motion (crossfading them just looks
like a double-exposure, not movement) - that's a hard limit of static
360 photos, not a setting to tune. The path that's actually achievable for
free: more photos, spaced closer together, so each click is a short hop
instead of a big jump. The editor above is built for exactly that - add as
many rooms as you shoot, in whatever order, without touching code.

## Swapping in the real logo

The loading screen currently shows a text wordmark ("Broken Hill Hotel")
since there's no logo file yet. Once one exists: drop it in `img/logo.png`,
then in `index.html` replace the `.tour-loading__wordmark` div with the
commented-out `<img class="tour-loading__logo-img">` line right above it
(same swap noted in the CSS). No other changes needed - the loading screen's
background/colours/spinner all stay as they are.

## Brand colours

Real BHH palette (from the Function Pack), defined as CSS variables at the
top of `css/tour.css` - change them there if the brand palette is ever
updated, everything that uses them (loading screen, hotspot markers) follows:

- `--bhh-green-darkest` `#3E4038`
- `--bhh-green-dark` `#4B4D44`
- `--bhh-green` `#5B5D53`
- `--bhh-green-light` `#6D7064`
- `--bhh-cream` `#F3E5AB`
- `--bhh-white` `#FFFFFF`

## Status

- [x] Base viewer + config structure
- [x] Scene titles
- [x] Autoload start scene + branded loading/splash screen
- [x] Info hotspots (separate from navigation hotspots)
- [x] Mobile-responsive (tested iOS Safari viewport sizing, safe-area insets)
- [x] Real photos in place of placeholders (11 rooms, walkable graph layout,
      corrected against real landmarks after the first pass mislabeled two
      terraces as separate rooms)
- [x] Hotspots actually clickable (real bug: a custom `cssClass` was
      silently replacing Pannellum's own click-target sizing classes -
      every arrow had ~zero clickable area from the very first version)
- [x] Tour Editor (`editor.html`) - add/replace photos, click-to-place
      waypoints, reorder rooms, all saved straight to real project files
      via the File System Access API, no backend
- [ ] Real logo (currently a text wordmark)
- [ ] Embedded into the main site

## Deploying

Plain static files - push to `master` and GitHub Pages serves it straight
from the repo root, no build step. Once Pages is enabled (Settings > Pages >
Deploy from a branch > `master` / `/ (root)`), the live URL is
`https://funtionwebapp.github.io/bhh-virtual-tour/`. To embed on the real
pub website, link to that URL or drop it in an `<iframe>`.

## Relationship to the Rachel booking system

Deliberately separate from the `bhh-functions` repo (Rachel, the Apps
Script booking/functions-management system) - different audience (public
visitors vs. staff), different hosting model (static files vs. Apps
Script), nothing shared. If the two ever need to link up (e.g. a "Book a
Function" button here), that's a plain hyperlink, not shared code.
