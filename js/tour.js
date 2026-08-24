/*
 * Broken Hill Hotel - virtual tour viewer bootstrap.
 *
 * Loads data/tour-scenes.json and starts the Pannellum viewer, plus the
 * persistent chrome (zone label, CTA bar, facts panel, map, gallery strip,
 * first-visit hint). To edit rooms/photos/waypoints, use editor.html.
 */
(function () {
  'use strict';

  var DATA_URL = 'data/tour-scenes.json';
  var params = new URLSearchParams(window.location.search);
  var embedMode = params.get('embed') === '1';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var tourData = null;
  var viewer = null;
  var currentSceneKey = null;
  var hasInteracted = false;
  var el = {};

  // ---------- Loading indicator ----------

  function setLoadingPreview(previewDataUri) {
    var indicator = document.getElementById('tour-loading');
    if (previewDataUri) {
      indicator.style.backgroundImage =
        'linear-gradient(rgba(11,11,11,0.55), rgba(11,11,11,0.55)), url(' + previewDataUri + ')';
      indicator.style.backgroundSize = 'cover';
      indicator.style.backgroundPosition = 'center';
    } else {
      indicator.style.backgroundImage = '';
    }
  }

  function initLoadingIndicator(pViewer) {
    var indicator = document.getElementById('tour-loading');
    if (!indicator) return;
    pViewer.on('scenechange', function () {
      indicator.classList.remove('is-hidden');
    });
    pViewer.on('load', function () {
      indicator.classList.add('is-hidden');
    });
  }

  // ---------- First-visit hint (dismiss on interaction or ~5s) ----------

  function initHint(container) {
    if (reducedMotion) return; // no point animating a hint if motion is reduced
    var hint = document.getElementById('tour-hint');
    var dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      hint.classList.add('is-hidden');
    }
    setTimeout(function () {
      hint.classList.add('is-visible');
    }, 300);
    setTimeout(dismiss, 5000);
    container.addEventListener('pointerdown', dismiss, { once: true });
  }

  // ---------- "Stop autoRotate permanently on first real interaction" ----------

  function initAttractMode(pViewer, container) {
    if (reducedMotion) return; // never auto-rotate if the user asked for reduced motion
    function onFirstInteraction() {
      if (hasInteracted) return;
      hasInteracted = true;
      pViewer.stopAutoRotate();
    }
    container.addEventListener('pointerdown', onFirstInteraction);
    container.addEventListener('wheel', onFirstInteraction, { passive: true });
  }

  // ---------- Lazy-load neighbouring scenes after the current one settles ----------

  function prefetchNeighbours(scene) {
    (scene.hotspots || []).forEach(function (hs) {
      if (hs.type !== 'scene') return;
      var target = sceneByKey(hs.target);
      if (!target) return;
      var img = new Image();
      img.src = TourShared.IMAGE_BASE + target.image;
    });
  }

  function sceneByKey(key) {
    for (var i = 0; i < tourData.scenes.length; i++) {
      if (tourData.scenes[i].key === key) return tourData.scenes[i];
    }
    return null;
  }

  // ---------- Persistent header (zone label + CTA) ----------

  function updateHeader(scene) {
    el.headerTitle.textContent = scene.title;
    el.headerZone.textContent = scene.zone || '';
    el.headerZone.hidden = !scene.zone;
  }

  // ---------- Space facts panel ----------

  function openFacts(scene) {
    document.getElementById('facts-title').textContent = scene.title;
    var zoneEl = document.getElementById('facts-zone');
    zoneEl.textContent = scene.zone || '';
    zoneEl.hidden = !scene.zone;

    var capEl = document.getElementById('facts-capacity');
    var cap = scene.capacity;
    if (cap && (cap.seated || cap.cocktail)) {
      var parts = [];
      if (cap.seated) parts.push(cap.seated + ' seated');
      if (cap.cocktail) parts.push(cap.cocktail + ' cocktail');
      capEl.textContent = parts.join(' / ');
      capEl.hidden = false;
    } else {
      capEl.hidden = true;
    }

    var blurbEl = document.getElementById('facts-blurb');
    blurbEl.textContent = scene.blurb || 'Details for this space coming soon - ask us anything below.';

    el.factsPanel.hidden = false;
  }

  function closeFacts() {
    el.factsPanel.hidden = true;
  }

  // ---------- Mini map (schematic, hand-laid-out - not to scale) ----------

  // Rough relative positions for the map diagram, laid out to roughly match
  // the real building's shape (see README's Room Map). Any scene not listed
  // here just won't get a map pin - safe default, not an error.
  var MAP_POSITIONS = {
    'front-of-pub': [10, 50],
    'side-bar': [25, 50],
    'back-bar': [40, 50],
    'back-bar-2': [48, 42],
    'back-bar-window': [48, 58],
    'back-entrance': [55, 50],
    'rear-foyer': [70, 50],
    'hallway-restaurant': [85, 50],
    'restaurant': [95, 50],
    'restaurant-2': [95, 38],
    'the-park-junction': [25, 20],
    'the-park-deck-2': [45, 15],
    'the-park-terrace': [65, 15],
    'the-park-glass-door': [85, 20],
    'garden': [10, 85],
    'garden-2': [20, 90],
    'garden-stairs': [15, 70],
    'garden-deck-top': [20, 45]
  };

  function renderMap() {
    var container = document.getElementById('map-diagram');
    container.innerHTML = '';
    tourData.scenes.forEach(function (scene) {
      var pos = MAP_POSITIONS[scene.key];
      if (!pos) return;
      var pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'map-pin' + (scene.key === currentSceneKey ? ' map-pin--current' : '');
      pin.style.left = pos[0] + '%';
      pin.style.top = pos[1] + '%';
      pin.title = scene.title;
      pin.setAttribute('aria-label', scene.title);
      pin.addEventListener('click', function () {
        goToScene(scene.key);
        closeMap();
      });
      container.appendChild(pin);
    });
  }

  function openMap() {
    renderMap();
    el.mapPanel.hidden = false;
  }

  function closeMap() {
    el.mapPanel.hidden = true;
  }

  // ---------- Gallery thumbnail strip ----------

  function renderGallery() {
    el.galleryStrip.innerHTML = '';
    tourData.scenes.forEach(function (scene) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gallery-thumb' + (scene.key === currentSceneKey ? ' is-current' : '');
      if (scene.preview) btn.style.backgroundImage = 'url(' + scene.preview + ')';
      btn.title = scene.title;
      btn.setAttribute('aria-label', scene.title);
      btn.addEventListener('click', function () { goToScene(scene.key); });
      el.galleryStrip.appendChild(btn);
    });
    scrollGalleryToCurrent();
  }

  function scrollGalleryToCurrent() {
    var current = el.galleryStrip.querySelector('.is-current');
    if (current) current.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
  }

  // ---------- Navigation ----------

  function goToScene(key) {
    var scene = sceneByKey(key);
    if (!scene || !viewer) return;
    setLoadingPreview(scene.preview);
    viewer.loadScene(key);
  }

  function onSceneChange(key) {
    currentSceneKey = key;
    var scene = sceneByKey(key);
    if (!scene) return;
    updateHeader(scene);
    renderGallery();
    if (!el.factsPanel.hidden) openFacts(scene); // keep facts panel in sync if left open
    if (!el.mapPanel.hidden) renderMap();
    prefetchNeighbours(scene);
    var newUrl = window.location.pathname + '?scene=' + encodeURIComponent(key) +
      (embedMode ? '&embed=1' : '');
    window.history.replaceState(null, '', newUrl);
  }

  // ---------- Error handling ----------

  function showLoadError(err) {
    var indicator = document.getElementById('tour-loading');
    if (!indicator) return;
    var label = indicator.querySelector('.tour-loading__label');
    if (label) label.textContent = 'Could not load the tour - please refresh.';
    console.error(err);
  }

  // ---------- Init ----------

  function start() {
    el = {
      header: document.getElementById('tour-header'),
      headerTitle: document.getElementById('tour-header__title'),
      headerZone: document.getElementById('tour-header__zone'),
      headerCta: document.getElementById('tour-header__cta'),
      btnFacts: document.getElementById('btn-facts'),
      btnFactsClose: document.getElementById('btn-facts-close'),
      factsPanel: document.getElementById('facts-panel'),
      factsCta: document.getElementById('facts-cta'),
      btnMap: document.getElementById('btn-map'),
      btnMapClose: document.getElementById('btn-map-close'),
      mapPanel: document.getElementById('map-panel'),
      galleryStrip: document.getElementById('gallery-strip'),
      hint: document.getElementById('tour-hint')
    };

    if (embedMode) document.body.classList.add('is-embed');

    var container = document.getElementById('panorama');

    TourShared.loadTourData(DATA_URL).then(function (data) {
      tourData = data;

      if (tourData.venue && tourData.venue.functionsEnquiryUrl) {
        el.headerCta.href = tourData.venue.functionsEnquiryUrl;
        el.factsCta.href = tourData.venue.functionsEnquiryUrl;
      }

      var requestedScene = params.get('scene');
      var startScene = (requestedScene && sceneByKey(requestedScene))
        ? requestedScene
        : tourData.startScene;

      var firstScene = sceneByKey(startScene);
      setLoadingPreview(firstScene && firstScene.preview);

      var overrides = reducedMotion ? { autoRotate: false, autoRotateInactivityDelay: -1 } : {};
      var config = TourShared.buildPannellumConfig(tourData, Object.assign({ firstScene: startScene }, overrides));
      viewer = pannellum.viewer('panorama', config);

      currentSceneKey = startScene;
      initLoadingIndicator(viewer);
      initHint(container);
      initAttractMode(viewer, container);
      viewer.on('scenechange', onSceneChange);
      onSceneChange(startScene);
    }).catch(showLoadError);

    el.btnFacts.addEventListener('click', function () {
      var scene = sceneByKey(currentSceneKey);
      if (scene) openFacts(scene);
    });
    el.btnFactsClose.addEventListener('click', closeFacts);
    el.btnMap.addEventListener('click', openMap);
    el.btnMapClose.addEventListener('click', closeMap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
