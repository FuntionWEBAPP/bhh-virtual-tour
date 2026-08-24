/*
 * Broken Hill Hotel - virtual tour shared logic.
 *
 * Used by BOTH the public viewer (tour.js) and the editor (editor.js), so
 * there is exactly one place that turns our scene data into a Pannellum
 * config. Keeping this in one place is deliberate: the editor needs to
 * preview scenes exactly as the public site will render them, and a past
 * bug (hotspots silently losing their clickable area) came from this logic
 * being duplicated and drifting - see the cssClass comment below.
 */
var TourShared = (function () {
  'use strict';

  var IMAGE_BASE = 'img/scenes/';

  function buildHotSpots(hotspots) {
    return (hotspots || []).map(function (hotspot) {
      if (hotspot.type === 'scene') {
        return {
          type: 'scene',
          sceneId: hotspot.target,
          pitch: hotspot.pitch,
          yaw: hotspot.yaw,
          text: hotspot.text,
          // Pannellum only adds its own "pnlm-hotspot pnlm-sprite pnlm-scene"
          // classes when cssClass is NOT set - setting cssClass REPLACES
          // them rather than adding to them. Those default classes are what
          // give the hotspot a real 26x26px clickable/tappable area; without
          // them the element has no size at all, so it renders as basically
          // unclickable even though a custom arrow graphic can still show up
          // visually. Re-including them here alongside our own classes keeps
          // the real click target while still letting us restyle it.
          cssClass: 'pnlm-hotspot pnlm-sprite pnlm-scene tour-hotspot tour-hotspot--nav'
        };
      }
      return {
        type: 'info',
        pitch: hotspot.pitch,
        yaw: hotspot.yaw,
        text: hotspot.text,
        cssClass: 'pnlm-hotspot pnlm-sprite pnlm-info tour-hotspot tour-hotspot--info'
      };
    });
  }

  function buildPannellumScene(scene) {
    return {
      title: scene.title,
      type: 'equirectangular',
      panorama: IMAGE_BASE + scene.image,
      // Real phone-shot 360s rarely cover the full 180 degrees vertically -
      // haov/vaov tell Pannellum exactly how much of the sphere this photo
      // actually covers instead of assuming a full 2:1 equirectangular and
      // stretching it.
      haov: scene.haov || 360,
      vaov: scene.vaov || 180,
      vOffset: scene.vOffset || 0,
      northOffset: scene.northOffset || 0,
      pitch: scene.pitch || 0,
      yaw: scene.yaw || 0,
      hfov: 100,
      compass: false,
      hotSpots: buildHotSpots(scene.hotspots)
    };
  }

  // tourData: { startScene, scenes: [...] } as loaded from
  // data/tour-scenes.json. `overrides` optionally replaces the `default`
  // block (the editor turns off autoRotate and sceneFadeDuration, for
  // example, since they get in the way while editing).
  function buildPannellumConfig(tourData, overrides) {
    var scenes = {};
    tourData.scenes.forEach(function (scene) {
      scenes[scene.key] = buildPannellumScene(scene);
    });

    var defaults = {
      firstScene: tourData.startScene,
      sceneFadeDuration: 800,
      autoLoad: true,
      autoRotate: -2,
      compass: false,
      showZoomCtrl: true,
      showFullscreenCtrl: true,
      hotSpotDebug: false
    };
    if (overrides) {
      Object.keys(overrides).forEach(function (key) {
        defaults[key] = overrides[key];
      });
    }

    return { default: defaults, scenes: scenes };
  }

  function loadTourData(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('Failed to load ' + url + ': ' + res.status);
      return res.json();
    });
  }

  return {
    IMAGE_BASE: IMAGE_BASE,
    buildPannellumScene: buildPannellumScene,
    buildPannellumConfig: buildPannellumConfig,
    loadTourData: loadTourData
  };
})();
