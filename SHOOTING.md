# Shooting guide - 360° photos for the tour

This covers how to capture a photo that actually works in this tour, why
the stock iPhone Camera app's Pano mode doesn't, and how to publish the
same shots to Google Maps for free.

## The one thing that matters: get a true equirectangular photo

The tour needs a **2:1 equirectangular** image - a single photo that wraps
360° horizontally and (ideally) 180° vertically, where straight lines
curve the way they do on a world map. The iPhone's built-in **Camera app
Pano mode is not this** - it's a wide cylindrical sweep, one row, no
top/bottom coverage. Force one of those into a 360° viewer and you get
visible distortion, especially away from the horizon.

**Free ways to get a real equirectangular photo:**

1. **A dedicated 360 capture app** (e.g. Google Street View app's
   photo-sphere mode where still available, or any free "360 panorama"
   app that guides you through a grid of shots and stitches them
   on-device). Easiest option, phone-only, no desktop step.
2. **Manual bracketed grid + free desktop stitching** (more control, more
   work):
   - Tripod at eye height (~1.5m), levelled.
   - Lock exposure and white balance for the whole set *before* the first
     shot (AE/AF lock, or manual mode) - a shifting exposure between
     frames is the #1 cause of visible seams.
   - Pivot the phone around the **lens's entrance pupil**, not the phone's
     body or the tripod's centre - a cheap panoramic tripod head fixes
     this; without one, keep the phone as close to directly over the
     tripod's pivot point as you can.
   - Shoot a full grid: a row at 0° (straight ahead), a row at roughly
     +45°, a row at roughly -45°, plus one straight up (zenith) and one
     straight down (nadir, unless a tripod leg is unavoidably in shot -
     see the nadir note below).
   - ~30% overlap between adjacent frames in every direction.
   - Stitch with **Hugin** (free, open source, Windows/Mac/Linux) -
     load all frames, let it detect control points, generate the
     panorama, export as equirectangular JPEG.

The current 24 source photos in `PUB PICTURES\` were shot with the Camera
app's Pano mode - each one only covers roughly 82-94° vertically instead
of a true 180°, which the tour compensates for (`vaov` in
`data/tour-scenes.json`) rather than stretching them wrong, but they're
still cylindrical projections being treated as a cropped equirectangular,
not a true one. They work well enough to build and test the tour's flow
with, but reshooting with one of the methods above will look noticeably
better and is worth doing before this is the final version.

## Practical capture tips

- **Lights on, room dressed like a guest sees it.** A glass on a table, a
  couple of people in shot - an empty room reads as closed, even midday.
- **Best time of day per space**: outdoor/courtyard areas (Garden Bar, The
  Park) look best late afternoon with the string lights on but before
  full dark; interiors (Restaurant, Back Bar, Side Bar) after the venue's
  own lights are on for service, not under flat daytime light through the
  windows.
- **Where to stand**: doorways and thresholds, not room centres - a
  panorama shot from just inside a doorway visually connects to the next
  room's panorama shot from just past that same doorway, which is exactly
  what makes two adjacent scenes feel like one continuous space instead
  of a jump. One shot per real seating zone is the minimum; a second or
  third shot a few steps further into a larger room (as several rooms in
  this tour already have) makes the walk-through feel smoother, not just
  more thorough - closer-together shots are always better here.
- **Nadir (straight down)**: only worth capturing if your rig doesn't
  otherwise block it. This tour's current photos have such a limited
  vertical sweep they never show the floor near the camera at all, so
  there's nothing to patch/hide - if you shoot true full-180° panoramas
  in future, a simple circular logo graphic over the tripod in the nadir
  is the standard fix (not yet built - flag it if you get there and it's
  needed).

## The ~10 core scenes for v1 (shooting order)

Roughly a walking loop, so you're never backtracking further than the last
room or two:

1. Front of Pub (street entrance, the visitor's actual first view)
2. Side Bar
3. Back Bar (Zone 05)
4. Back Bar Entrance (the connecting corridor)
5. Rear Foyer
6. Restaurant Entrance (waiting area)
7. Restaurant (Zone 03) - two spots if the room's big enough
8. The Park - the mid-level deck, walking from the street end around to
   the stairs down (2-3 spots along its length work better than one)
9. Garden Bar / Two Mile Spring courtyard (Zone 06) - the stairs down from
   The Park, then the courtyard itself
10. Side Bar's Zone 02 signage / Front Terrace / any zone not yet covered

Add more as you shoot - the Tour Editor (`editor.html`) is built
specifically so adding a room later is a few clicks, not a code change.

## Publishing the same photos to Google Maps (also free)

Google's own free tool for this now is the **Google Maps app's Contribute
tab** - the standalone Street View app was discontinued in 2023, and
Street View Studio only accepts 360 *video*, not photos. To publish a
still 360 photo to your Business Profile:

1. Shoot/export a real equirectangular JPEG - minimum 2:1 aspect ratio,
   at least 7.5 megapixels (e.g. 5000x2500 or larger).
2. Confirm it carries valid **PhotoSphere XMP metadata** (the tag that
   tells Google/any viewer "this is a 360 photo, here's its projection").
   Apps built for 360 capture write this automatically; a raw Hugin
   export needs it added (Hugin can do this in its output settings, or a
   tool like `exiftool` can inject the XMP block after the fact).
3. Open the **Google Maps app** (not Maps on desktop) → Contribute tab →
   add the photo to your Business Profile/location.

The tour's own photos and the ones you publish to Google Maps can be the
exact same files - no separate shoot needed.
