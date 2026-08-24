/*
 * Broken Hill Hotel - virtual tour scene config.
 *
 * This is the ONLY file you should need to touch to add, rename, remove or
 * re-point a room. Nothing in tour.js needs to change for that.
 *
 * Each entry in TOUR_SCENES is one stop along the walkthrough. Real photos
 * only cover ~82-94 degrees vertically (not a full 180), so every scene sets
 * `vaov` (vertical angle of view) - Pannellum then only maps the photo onto
 * that band of the sphere instead of stretching it across the whole thing.
 * `haov` is 360 for all of these (full horizontal spins).
 *
 * Fields:
 *   title        Shown in the on-screen title bar and in hotspot tooltips
 *                that link to this scene.
 *   image        Filename of the photo in img/scenes/.
 *   vaov         Vertical angle of view in degrees - see note above. Leave
 *                this alone unless you reshoot with a different vertical
 *                sweep (recompute as 360 * photo_height / photo_width).
 *   northOffset  Optional. Rotates the image so "north" (0 degrees, the
 *                default facing direction) points somewhere sensible.
 *   pitch / yaw  Optional. Initial look direction when this scene loads.
 *   hotspots     Clickable markers. `type: "scene"` walks to another room
 *                (`target` = that scene's key); `type: "info"` just shows a
 *                text bubble. Each needs pitch/yaw to position it.
 *
 * IMPORTANT - hotspot positions are estimated by eye from the source photos
 * (matching doors/stairs/openings against the panorama's pixel width), not
 * measured live in the viewer, so some will need nudging once you can
 * actually walk through it on a phone. Hold Alt and click the spot in the
 * panorama that a hotspot SHOULD be on - the real pitch/yaw logs to the
 * browser console, copy it in here. See tour.js for that helper.
 *
 * REAL BUILDING LAYOUT (matched from the source photos by lining up shared
 * landmarks - signage, mural walls, staircases - across shots, since photo
 * filenames turned out not to be reliable room labels):
 *
 *   "The Park" is a mid-level covered deck that runs from the street-facing
 *   main entrance (front-of-pub) around the side of the building to a
 *   staircase down into the Two Mile Spring / Garden Bar courtyard - it is
 *   ONE continuous walkway, not two separate terraces. That single wrong
 *   assumption (treating "Front Terrace" and "Side Terrace" as unrelated
 *   rooms) was the main reason the previous version didn't flow.
 *
 *   front-of-pub (street entrance)
 *     -> side-bar (through the front door)
 *     -> the-park-junction (walking along the deck)
 *          -> garden (down the stairs)
 *          -> the-park-terrace (further along the deck)
 *               -> the-park-glass-door (further still)
 *                    -> restaurant (through the door)
 *                         -> hallway-restaurant -> rear-foyer -> back-entrance -> back-bar
 *
 * CONFIDENCE NOTE - two links are the shakiest guesses in this graph and
 * are the first place to look if something still doesn't line up:
 *   1. front-of-pub -> side-bar (which exact door from the street this is)
 *   2. garden's own hotspot back up to the-park-junction (the stairs aren't
 *      clearly visible in the specific Garden.jpg photo used for that scene)
 * Everything else was matched against a landmark visible in both photos
 * (the mural wall, a staircase, matching street shopfronts, etc.).
 */

var TOUR_SCENES = {

  'front-of-pub': {
    title: 'Front of Pub',
    image: 'front-of-pub.jpg',
    vaov: 93.9,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'side-bar', pitch: -2, yaw: -162, text: 'Side Bar' },
      { type: 'scene', target: 'the-park-junction', pitch: -3, yaw: 20, text: 'The Park' },
      { type: 'info', pitch: 6, yaw: -90, text: 'Welcome to the Broken Hill Hotel' }
    ]
  },

  'side-bar': {
    title: 'Side Bar',
    image: 'side-bar.jpg',
    vaov: 83.3,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'front-of-pub', pitch: -2, yaw: 54, text: 'Front of Pub' },
      { type: 'scene', target: 'back-bar', pitch: -2, yaw: -150, text: 'Back Bar' }
    ]
  },

  'the-park-junction': {
    title: 'The Park',
    image: 'the-park-junction.jpg',
    vaov: 83.5,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'front-of-pub', pitch: -2, yaw: -144, text: 'Front of Pub' },
      { type: 'scene', target: 'garden', pitch: -6, yaw: 130, text: 'Garden Bar (downstairs)' },
      { type: 'scene', target: 'the-park-terrace', pitch: -2, yaw: 20, text: 'The Park (continued)' }
    ]
  },

  garden: {
    title: 'Garden Bar (Two Mile Spring)',
    image: 'garden.jpg',
    vaov: 83.8,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'the-park-junction', pitch: 8, yaw: -100, text: 'The Park (upstairs)' }
    ]
  },

  'the-park-terrace': {
    title: 'The Park - Terrace',
    image: 'the-park-terrace.jpg',
    vaov: 93.2,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'the-park-junction', pitch: -2, yaw: -144, text: 'The Park' },
      { type: 'scene', target: 'the-park-glass-door', pitch: -2, yaw: 60, text: 'The Park (continued)' }
    ]
  },

  'the-park-glass-door': {
    title: 'The Park - Restaurant Door',
    image: 'the-park-glass-door.jpg',
    vaov: 84.7,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'the-park-terrace', pitch: -2, yaw: -144, text: 'The Park' },
      { type: 'scene', target: 'restaurant', pitch: -2, yaw: 50, text: 'Restaurant' }
    ]
  },

  restaurant: {
    title: 'Restaurant',
    image: 'restaurant.jpg',
    vaov: 82.6,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'the-park-glass-door', pitch: -2, yaw: 80, text: 'The Park' },
      { type: 'scene', target: 'hallway-restaurant', pitch: -2, yaw: -170, text: 'Entrance' },
      { type: 'info', pitch: 5, yaw: 0, text: 'A la carte dining, open 7 days' }
    ]
  },

  'hallway-restaurant': {
    title: 'Restaurant Entrance',
    image: 'hallway-restaurant.jpg',
    vaov: 83.4,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'restaurant', pitch: -2, yaw: 30, text: 'Restaurant' },
      { type: 'scene', target: 'rear-foyer', pitch: -2, yaw: -160, text: 'Entrance' }
    ]
  },

  'rear-foyer': {
    title: 'Rear Foyer',
    image: 'rear-foyer.jpg',
    vaov: 93.7,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'hallway-restaurant', pitch: -2, yaw: -122, text: 'Restaurant' },
      { type: 'scene', target: 'back-entrance', pitch: -2, yaw: 144, text: 'Back Bar' }
    ]
  },

  'back-entrance': {
    title: 'Back Bar Entrance',
    image: 'back-entrance.jpg',
    vaov: 81.3,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'rear-foyer', pitch: -2, yaw: 150, text: 'Entrance' },
      { type: 'scene', target: 'back-bar', pitch: -2, yaw: -20, text: 'Back Bar' }
    ]
  },

  'back-bar': {
    title: 'Back Bar',
    image: 'back-bar.jpg',
    vaov: 85.6,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'back-entrance', pitch: -2, yaw: -11, text: 'Entrance' },
      { type: 'scene', target: 'side-bar', pitch: -2, yaw: 160, text: 'Side Bar' }
    ]
  }

};

// Which scene key loads first when the tour opens.
var TOUR_START_SCENE = 'front-of-pub';
