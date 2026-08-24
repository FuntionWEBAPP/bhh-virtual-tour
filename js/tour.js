/*
 * Broken Hill Hotel - virtual tour viewer bootstrap.
 *
 * This file turns TOUR_SCENES / TOUR_START_SCENE (tour-config.js) into a
 * Pannellum config and starts the viewer. It should not need editing to
 * add, remove or re-point a room - do that in tour-config.js instead.
 */
(function () {
  'use strict';

  var IMAGE_BASE = 'img/scenes/';

  function buildPannellumScene(sceneConfig) {
    var hotSpots = (sceneConfig.hotspots || []).map(function (hotspot) {
      if (hotspot.type === 'scene') {
        return {
          type: 'scene',
          sceneId: hotspot.target,
          pitch: hotspot.pitch,
          yaw: hotspot.yaw,
          text: hotspot.text,
          cssClass: 'tour-hotspot tour-hotspot--nav'
        };
      }
      return {
        type: 'info',
        pitch: hotspot.pitch,
        yaw: hotspot.yaw,
        text: hotspot.text,
        cssClass: 'tour-hotspot tour-hotspot--info'
      };
    });

    return {
      title: sceneConfig.title,
      type: 'equirectangular',
      panorama: IMAGE_BASE + sceneConfig.image,
      // Real phone-shot 360s rarely cover the full 180 degrees vertically -
      // haov/vaov tell Pannellum exactly how much of the sphere this photo
      // actually covers instead of assuming a full 2:1 equirectangular and
      // stretching it. Defaults (360/180) match a full sphere for any scene
      // that doesn't set these (e.g. a placeholder).
      haov: sceneConfig.haov || 360,
      vaov: sceneConfig.vaov || 180,
      vOffset: sceneConfig.vOffset || 0,
      northOffset: sceneConfig.northOffset || 0,
      pitch: sceneConfig.pitch || 0,
      yaw: sceneConfig.yaw || 0,
      hfov: 100,
      compass: false,
      hotSpots: hotSpots
    };
  }

  function buildPannellumConfig() {
    var scenes = {};
    Object.keys(TOUR_SCENES).forEach(function (key) {
      scenes[key] = buildPannellumScene(TOUR_SCENES[key]);
    });

    return {
      default: {
        firstScene: TOUR_START_SCENE,
        sceneFadeDuration: 800,
        autoLoad: true,
        autoRotate: -2,
        compass: false,
        showZoomCtrl: true,
        showFullscreenCtrl: true,
        hotSpotDebug: false
      },
      scenes: scenes
    };
  }

  function initLoadingIndicator(viewer) {
    var indicator = document.getElementById('tour-loading');
    if (!indicator) return;

    function hide() {
      indicator.classList.add('is-hidden');
    }
    function show() {
      indicator.classList.remove('is-hidden');
    }

    // Pannellum fires "scenechange" as soon as a new scene starts loading,
    // then "load" again once that scene's image is actually ready.
    viewer.on('scenechange', show);
    viewer.on('load', hide);
  }

  // Dev helper: hold Alt and click anywhere on the panorama to log that
  // spot's pitch/yaw to the console. Handy for placing hotspots once a real
  // photo is loaded - copy the numbers straight into tour-config.js.
  function initHotspotPicker(viewer, container) {
    container.addEventListener('click', function (event) {
      if (!event.altKey) return;
      var coords = viewer.mouseEventToCoords(event);
      console.log(
        'Hotspot pick -> pitch: ' + coords[0].toFixed(1) +
        ', yaw: ' + coords[1].toFixed(1)
      );
    });
  }

  function start() {
    var container = document.getElementById('panorama');
    var viewer = pannellum.viewer('panorama', buildPannellumConfig());
    initLoadingIndicator(viewer);
    initHotspotPicker(viewer, container);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
