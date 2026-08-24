/*
 * Broken Hill Hotel - virtual tour viewer bootstrap.
 *
 * Loads data/tour-scenes.json and starts the Pannellum viewer. To edit
 * rooms/photos/waypoints, use editor.html - don't hand-edit the JSON
 * unless you're comfortable with the schema (see TourShared for the
 * fields it expects).
 */
(function () {
  'use strict';

  var DATA_URL = 'data/tour-scenes.json';

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
  // spot's pitch/yaw to the console. The editor does this visually now, so
  // this is mostly a fallback for anyone hand-editing the JSON.
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

  function showLoadError(err) {
    var indicator = document.getElementById('tour-loading');
    if (!indicator) return;
    var label = indicator.querySelector('.tour-loading__label');
    if (label) label.textContent = 'Could not load the tour - please refresh.';
    console.error(err);
  }

  function start() {
    var container = document.getElementById('panorama');
    TourShared.loadTourData(DATA_URL).then(function (tourData) {
      var viewer = pannellum.viewer('panorama', TourShared.buildPannellumConfig(tourData));
      initLoadingIndicator(viewer);
      initHotspotPicker(viewer, container);
    }).catch(showLoadError);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
