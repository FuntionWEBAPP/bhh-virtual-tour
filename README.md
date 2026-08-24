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

## Adding or changing a room

Edit **`js/tour-config.js` only** - that's the one file meant to be touched
day to day. Each scene needs:

- `title` - shown in the on-screen title bar
- `image` - filename of a photo in `img/scenes/`
- `vaov` - vertical angle of view in degrees. A phone-shot 360 photo almost
  never covers the full 180 degrees vertically (ours are ~82-94 degrees) -
  this tells Pannellum exactly how much of the sphere the photo covers so it
  doesn't get stretched. Compute it as `360 * photo_height / photo_width`.
- `hotspots` - clickable markers: `type: "scene"` walks to another room
  (`target` = that scene's key), `type: "info"` just shows a text bubble

Nothing in `tour.js` or `index.html` needs to change for a normal room
add/remove/rename.

## Room map

The tour is built as a walkable graph, not a jump-to-any-room menu - every
hotspot connects two physically adjacent spots, so moving through it feels
like walking the venue (closer to Google Street View than a slideshow):

```
Entrance -- Side Bar -- Front Terrace -- Side Terrace -- Restaurant
    |                                          |             |
Back Bar Entrance                     Upper Deck --------- Restaurant
    |                                          |          Entrance
 Back Bar ---------------- Garden Bar (Two Mile Spring)
```

Source photos live at `C:\Users\Liam\Desktop\PUB PICTURES\` (not in this
repo - only the processed/resized copies in `img/scenes/` are committed).
Several rooms had 2-4 shots taken; one was picked per room for now
(generally the cleanest, most complete angle) - the rest are sitting unused
in that folder if you ever want a second angle of the same room as its own
extra stop (e.g. more Beer Garden angles, a second Restaurant view).

**First-pass hotspot placement**: positions were estimated by eye from the
source photos, not measured live in the viewer, so expect some arrows to be
sitting slightly off the doorway/stairs they're meant to mark. Walk through
it and use the Alt+click trick below to fix any that are off - this is
normal for a first pass, not a bug.

**Two known filename mix-ups in the source folder** (already accounted for
in the room map above, just flagging in case more turn up): `Back Bar.jpg`
(no number) is actually the Front Terrace window view, and `Back bar 2.jpg`
is actually the Entrance foyer - not real Back Bar photos despite the name.

## Placing hotspots accurately

Once a real photo is loaded, **hold Alt and click** anywhere in the tour -
the pitch/yaw for that exact spot is logged to the browser console. Copy
those numbers into the hotspot's `pitch`/`yaw` in `tour-config.js`.

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
- [x] Real photos in place of placeholders (10 rooms, walkable graph layout)
- [ ] Hotspot positions fine-tuned against the live viewer (first pass only)
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
