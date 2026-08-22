/*
 * Broken Hill Hotel - virtual tour scene config.
 *
 * This is the ONLY file you should need to touch to add, rename, remove or
 * re-point a room. Nothing in tour.js needs to change for that.
 *
 * Each entry in TOUR_SCENES is one room/area. To add a new room, copy an
 * existing entry, give it a unique key, and fill in its fields. To swap a
 * placeholder for a real photo, just change `image` to your new filename
 * (drop the file into virtual-tour/img/scenes/ first).
 *
 * Fields:
 *   title        Shown in the on-screen title bar and in hotspot tooltips
 *                that link to this scene.
 *   image        Filename of the equirectangular JPEG, relative to
 *                virtual-tour/img/scenes/. Must be a full 360x180 photo
 *                with a 2:1 width:height ratio (e.g. 6000x3000, 4000x2000).
 *   northOffset  Optional. Rotates the image so "north" (0 degrees, the
 *                default facing direction) points somewhere sensible - e.g.
 *                the entrance the visitor would naturally be facing when
 *                they arrive in this room. 0-359. Leave at 0 if unsure and
 *                nudge it later once you can see the real photo loaded.
 *   pitch / yaw  Optional. The initial look direction when this scene loads
 *                (pitch: up/down, yaw: left/right, both in degrees). Defaults
 *                to pitch 0 (straight ahead), yaw 0 (north) if omitted.
 *   hotspots     Array of clickable markers placed on the panorama. Two
 *                kinds:
 *                  - Navigation hotspots (type: "scene") walk the visitor to
 *                    another room. `target` must match another scene's key.
 *                  - Info hotspots (type: "info") just show a text bubble,
 *                    e.g. "Seats 80, available for functions" - they don't
 *                    move the visitor anywhere.
 *                Each hotspot needs pitch/yaw to position it on the sphere.
 *                Placeholder scenes below use round-number guesses; once a
 *                real photo is loaded, click around in the browser to find
 *                the pitch/yaw you actually want (see tour.js's debug
 *                console logging - click anywhere while holding Alt to log
 *                that spot's pitch/yaw to the console).
 *
 * Room list at time of writing: Entrance, Garden Bar, Sports Bar, Restaurant,
 * Side Bar, Side Terrace. Add/rename/remove freely - just make sure every
 * "scene" hotspot's `target` still points at a real key, and that at least
 * one scene sets `startScene: true` below.
 */

var TOUR_SCENES = {

  entrance: {
    title: 'Entrance',
    image: 'entrance.jpg',
    northOffset: 0,
    hotspots: [
      {
        type: 'scene',
        target: 'garden-bar',
        pitch: -2,
        yaw: 40,
        text: 'Garden Bar'
      },
      {
        type: 'scene',
        target: 'sports-bar',
        pitch: -2,
        yaw: -60,
        text: 'Sports Bar'
      },
      {
        type: 'info',
        pitch: 8,
        yaw: 0,
        text: 'Welcome to the Broken Hill Hotel'
      }
    ]
  },

  'garden-bar': {
    title: 'Garden Bar',
    image: 'garden-bar.jpg',
    northOffset: 0,
    hotspots: [
      {
        type: 'scene',
        target: 'entrance',
        pitch: -2,
        yaw: 180,
        text: 'Entrance'
      },
      {
        type: 'scene',
        target: 'side-terrace',
        pitch: -2,
        yaw: 100,
        text: 'Side Terrace'
      },
      {
        type: 'info',
        pitch: 5,
        yaw: 20,
        text: 'Seats 80, available for functions'
      }
    ]
  },

  'sports-bar': {
    title: 'Sports Bar',
    image: 'sports-bar.jpg',
    northOffset: 0,
    hotspots: [
      {
        type: 'scene',
        target: 'entrance',
        pitch: -2,
        yaw: 120,
        text: 'Entrance'
      },
      {
        type: 'scene',
        target: 'restaurant',
        pitch: -2,
        yaw: -30,
        text: 'Restaurant'
      },
      {
        type: 'scene',
        target: 'side-bar',
        pitch: -2,
        yaw: -110,
        text: 'Side Bar'
      }
    ]
  },

  restaurant: {
    title: 'Restaurant',
    image: 'restaurant.jpg',
    northOffset: 0,
    hotspots: [
      {
        type: 'scene',
        target: 'sports-bar',
        pitch: -2,
        yaw: 150,
        text: 'Sports Bar'
      },
      {
        type: 'info',
        pitch: 5,
        yaw: -20,
        text: 'A la carte dining, open 7 days'
      }
    ]
  },

  'side-bar': {
    title: 'Side Bar',
    image: 'side-bar.jpg',
    northOffset: 0,
    hotspots: [
      {
        type: 'scene',
        target: 'sports-bar',
        pitch: -2,
        yaw: 70,
        text: 'Sports Bar'
      },
      {
        type: 'scene',
        target: 'side-terrace',
        pitch: -2,
        yaw: -160,
        text: 'Side Terrace'
      }
    ]
  },

  'side-terrace': {
    title: 'Side Terrace',
    image: 'side-terrace.jpg',
    northOffset: 0,
    hotspots: [
      {
        type: 'scene',
        target: 'side-bar',
        pitch: -2,
        yaw: 20,
        text: 'Side Bar'
      },
      {
        type: 'scene',
        target: 'garden-bar',
        pitch: -2,
        yaw: -80,
        text: 'Garden Bar'
      },
      {
        type: 'info',
        pitch: 3,
        yaw: 160,
        text: 'Covered outdoor seating'
      }
    ]
  }

};

// Which scene key loads first when the tour opens.
var TOUR_START_SCENE = 'entrance';
