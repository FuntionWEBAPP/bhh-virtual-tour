/*
 * Broken Hill Hotel - virtual tour scene config.
 *
 * This is the ONLY file you should need to touch to add, rename, remove or
 * re-point a room. Nothing in tour.js needs to change for that.
 *
 * Each entry in TOUR_SCENES is one stop along the walkthrough. Real photos
 * only cover ~85-94 degrees vertically (not a full 180), so every scene sets
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
 * IMPORTANT - hotspot positions are a first pass, not final: they're
 * estimated from looking at the source photos, not measured live in the
 * viewer, so several are probably a bit off. Open the tour, and for any
 * arrow that's not sitting right on the doorway/stairs it should be -
 * hold Alt and click the spot in the panorama that IS correct, the real
 * pitch/yaw logs to the browser console, copy it in here. See tour.js.
 */

var TOUR_SCENES = {

  entrance: {
    title: 'Entrance',
    image: 'entrance.jpg',
    vaov: 93.7,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'back-entrance', pitch: -3, yaw: 144, text: 'Back Bar' },
      { type: 'scene', target: 'side-bar', pitch: -3, yaw: -122, text: 'Side Bar' },
      { type: 'scene', target: 'hallway-restaurant', pitch: -3, yaw: 20, text: 'Restaurant' }
    ]
  },

  'back-entrance': {
    title: 'Back Bar Entrance',
    image: 'back-entrance.jpg',
    vaov: 81.3,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'entrance', pitch: -3, yaw: 150, text: 'Entrance' },
      { type: 'scene', target: 'back-bar', pitch: -3, yaw: -20, text: 'Back Bar' }
    ]
  },

  'back-bar': {
    title: 'Back Bar',
    image: 'back-bar.jpg',
    vaov: 85.6,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'back-entrance', pitch: -3, yaw: -100, text: 'Entrance' },
      { type: 'scene', target: 'side-bar', pitch: -3, yaw: 60, text: 'Side Bar' },
      { type: 'scene', target: 'garden', pitch: -3, yaw: 160, text: 'Two Mile Spring / Garden Bar' }
    ]
  },

  'side-bar': {
    title: 'Side Bar',
    image: 'side-bar.jpg',
    vaov: 83.3,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'entrance', pitch: -3, yaw: 100, text: 'Entrance' },
      { type: 'scene', target: 'back-bar', pitch: -3, yaw: -140, text: 'Back Bar' },
      { type: 'scene', target: 'front-terrace', pitch: -3, yaw: -20, text: 'Front Terrace' }
    ]
  },

  'hallway-restaurant': {
    title: 'Restaurant Entrance',
    image: 'hallway-restaurant.jpg',
    vaov: 83.4,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'entrance', pitch: -3, yaw: -160, text: 'Entrance' },
      { type: 'scene', target: 'restaurant', pitch: -3, yaw: 30, text: 'Restaurant' }
    ]
  },

  restaurant: {
    title: 'Restaurant',
    image: 'restaurant.jpg',
    vaov: 82.6,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'hallway-restaurant', pitch: -3, yaw: -170, text: 'Entrance' },
      { type: 'scene', target: 'side-terrace', pitch: -3, yaw: 80, text: 'Side Terrace' },
      { type: 'info', pitch: 5, yaw: 0, text: 'A la carte dining, open 7 days' }
    ]
  },

  'side-terrace': {
    title: 'Side Terrace',
    image: 'side-terrace.jpg',
    vaov: 84.7,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'restaurant', pitch: -3, yaw: -100, text: 'Restaurant' },
      { type: 'scene', target: 'front-terrace', pitch: -3, yaw: 60, text: 'Front Terrace' },
      { type: 'scene', target: 'beer-garden-deck', pitch: -3, yaw: -20, text: 'Two Mile Spring / Garden Bar' }
    ]
  },

  'front-terrace': {
    title: 'Front Terrace',
    image: 'front-terrace.jpg',
    vaov: 83.5,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'side-bar', pitch: -3, yaw: 160, text: 'Side Bar' },
      { type: 'scene', target: 'side-terrace', pitch: -3, yaw: -60, text: 'Side Terrace' }
    ]
  },

  garden: {
    title: 'Two Mile Spring / Garden Bar',
    image: 'garden.jpg',
    vaov: 83.8,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'back-bar', pitch: -3, yaw: -20, text: 'Back Bar' },
      { type: 'scene', target: 'beer-garden-deck', pitch: -3, yaw: 130, text: 'Upper Deck' }
    ]
  },

  'beer-garden-deck': {
    title: 'Two Mile Spring - Upper Deck',
    image: 'beer-garden-deck.jpg',
    vaov: 83.3,
    northOffset: 0,
    hotspots: [
      { type: 'scene', target: 'garden', pitch: -3, yaw: -50, text: 'Garden Bar (downstairs)' },
      { type: 'scene', target: 'side-terrace', pitch: -3, yaw: 120, text: 'Side Terrace' }
    ]
  }

};

// Which scene key loads first when the tour opens.
var TOUR_START_SCENE = 'entrance';
