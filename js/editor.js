/*
 * Broken Hill Hotel - tour editor.
 *
 * Full-control editing UI: add/replace photos, reorder rooms, click on a
 * panorama to place a waypoint (link to another room, or a comment), edit
 * or delete existing waypoints. Saves straight to your real project files
 * via the File System Access API (Chrome/Edge only) - no backend, no
 * upload, nothing leaves your computer.
 *
 * DATA_URL / IMAGE_DIR below must stay in sync with what tour.js and
 * TourShared expect to read at runtime.
 */
(function () {
  'use strict';

  var DATA_PATH = ['data', 'tour-scenes.json'];
  var IMAGE_DIR_PATH = ['img', 'scenes'];
  var MAX_PHOTO_WIDTH = 4096;
  var JPEG_QUALITY = 0.85;

  var dirHandle = null;
  var tourData = { startScene: null, scenes: [] };
  var selectedIndex = -1;
  var viewer = null;
  var dirty = false;
  var pendingWaypoint = null; // { pitch, yaw, editIndex } while the modal is open

  var el = {}; // populated in init() with all the DOM refs we touch a lot

  // ---------- Directory / file helpers ----------

  function getSubDir(handle, pathParts, create) {
    var p = Promise.resolve(handle);
    pathParts.forEach(function (part) {
      p = p.then(function (h) { return h.getDirectoryHandle(part, { create: !!create }); });
    });
    return p;
  }

  function readJsonFile(handle, pathParts) {
    var dirParts = pathParts.slice(0, -1);
    var fileName = pathParts[pathParts.length - 1];
    return getSubDir(handle, dirParts, false)
      .then(function (dir) { return dir.getFileHandle(fileName, { create: false }); })
      .then(function (fh) { return fh.getFile(); })
      .then(function (file) { return file.text(); })
      .then(function (text) { return JSON.parse(text); });
  }

  function writeFile(handle, pathParts, blobOrText) {
    var dirParts = pathParts.slice(0, -1);
    var fileName = pathParts[pathParts.length - 1];
    return getSubDir(handle, dirParts, true)
      .then(function (dir) { return dir.getFileHandle(fileName, { create: true }); })
      .then(function (fh) { return fh.createWritable(); })
      .then(function (writable) {
        return writable.write(blobOrText).then(function () { return writable.close(); });
      });
  }

  // ---------- Image processing ----------

  function resizeImageToBlob(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, MAX_PHOTO_WIDTH / img.naturalWidth);
        var w = Math.round(img.naturalWidth * scale);
        var h = Math.round(img.naturalHeight * scale);
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(function (blob) {
          URL.revokeObjectURL(img.src);
          if (!blob) return reject(new Error('Could not encode photo'));
          resolve({ blob: blob, width: w, height: h, vaov: (360 * h) / w });
        }, 'image/jpeg', JPEG_QUALITY);
      };
      img.onerror = function () {
        URL.revokeObjectURL(img.src);
        reject(new Error('Could not read photo'));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // ---------- Slug / key helpers ----------

  function slugify(title) {
    var s = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s || 'room';
  }

  function uniqueKey(base) {
    var existing = tourData.scenes.map(function (s) { return s.key; });
    var key = base, n = 2;
    while (existing.indexOf(key) !== -1) {
      key = base + '-' + n;
      n++;
    }
    return key;
  }

  function sceneByKey(key) {
    for (var i = 0; i < tourData.scenes.length; i++) {
      if (tourData.scenes[i].key === key) return tourData.scenes[i];
    }
    return null;
  }

  // ---------- Dirty state ----------

  function markDirty() {
    dirty = true;
    el.status.textContent = 'Unsaved changes';
    el.status.classList.add('is-dirty');
    el.btnSave.disabled = false;
  }

  function markClean() {
    dirty = false;
    el.status.textContent = 'All changes saved';
    el.status.classList.remove('is-dirty');
    el.btnSave.disabled = true;
  }

  // ---------- Opening the project folder ----------

  function openFolder() {
    if (!window.showDirectoryPicker) {
      el.unsupported.hidden = false;
      return;
    }
    window.showDirectoryPicker().then(function (handle) {
      dirHandle = handle;
      return readJsonFile(dirHandle, DATA_PATH).catch(function () {
        // No existing data file yet - start from an empty tour rather than fail.
        return { startScene: null, scenes: [] };
      });
    }).then(function (data) {
      tourData = data;
      if (!Array.isArray(tourData.scenes)) tourData.scenes = [];
      el.picker.hidden = true;
      el.app.hidden = false;
      renderSceneList();
      if (tourData.scenes.length) selectScene(0);
      markClean();
    }).catch(function (err) {
      if (err && err.name === 'AbortError') return; // user cancelled the picker
      el.pickerError.hidden = false;
      el.pickerError.textContent = 'Could not open that folder: ' + err.message;
      console.error(err);
    });
  }

  // ---------- Scene list rendering ----------

  function renderSceneList() {
    el.sceneList.innerHTML = '';
    tourData.scenes.forEach(function (scene, index) {
      var li = document.createElement('li');
      li.className = 'scene-list-item' + (index === selectedIndex ? ' is-selected' : '');

      var title = document.createElement('span');
      title.className = 'scene-list-item__title';
      title.textContent = scene.title || scene.key;
      li.appendChild(title);

      if (scene.key === tourData.startScene) {
        var badge = document.createElement('span');
        badge.className = 'scene-list-item__start-badge';
        badge.textContent = 'Start';
        li.appendChild(badge);
      }

      var reorder = document.createElement('span');
      reorder.className = 'scene-list-item__reorder';
      var up = document.createElement('button');
      up.type = 'button';
      up.textContent = '▲';
      up.title = 'Move up';
      up.disabled = index === 0;
      up.addEventListener('click', function (e) { e.stopPropagation(); moveScene(index, -1); });
      var down = document.createElement('button');
      down.type = 'button';
      down.textContent = '▼';
      down.title = 'Move down';
      down.disabled = index === tourData.scenes.length - 1;
      down.addEventListener('click', function (e) { e.stopPropagation(); moveScene(index, 1); });
      reorder.appendChild(up);
      reorder.appendChild(down);
      li.appendChild(reorder);

      li.addEventListener('click', function () { selectScene(index); });
      el.sceneList.appendChild(li);
    });
  }

  function moveScene(index, delta) {
    var newIndex = index + delta;
    if (newIndex < 0 || newIndex >= tourData.scenes.length) return;
    var arr = tourData.scenes;
    var tmp = arr[index];
    arr[index] = arr[newIndex];
    arr[newIndex] = tmp;
    if (selectedIndex === index) selectedIndex = newIndex;
    else if (selectedIndex === newIndex) selectedIndex = index;
    renderSceneList();
    markDirty();
  }

  // ---------- Selecting / viewing a scene ----------

  function selectScene(index) {
    selectedIndex = index;
    renderSceneList();
    var scene = tourData.scenes[index];
    el.titleInput.value = scene.title || '';
    loadEditorViewer(scene);
    renderWaypointList(scene);
  }

  function currentScene() {
    return selectedIndex >= 0 ? tourData.scenes[selectedIndex] : null;
  }

  function loadEditorViewer(scene) {
    if (viewer) {
      viewer.destroy();
      viewer = null;
    }
    var config = TourShared.buildPannellumConfig(
      { startScene: scene.key, scenes: [scene] },
      { autoRotate: false, sceneFadeDuration: 0, hotSpotDebug: false }
    );
    // Edit mode never navigates on hotspot click - intercept every hotspot
    // with our own handler (open the edit modal) instead of letting
    // Pannellum treat "scene" hotspots as real navigation.
    var pannellumScene = config.scenes[scene.key];
    pannellumScene.hotSpots.forEach(function (hs, i) {
      delete hs.sceneId;
      hs.clickHandlerFunc = function (event) {
        event.stopPropagation();
        openWaypointModal(scene.hotspots[i].pitch, scene.hotspots[i].yaw, i);
      };
    });

    viewer = pannellum.viewer('editor-panorama', config);
    var container = document.getElementById('editor-panorama');
    container.addEventListener('click', function (event) {
      // Only fires for clicks that didn't land on (and get stopped by) a
      // hotspot's own clickHandlerFunc above, and native click semantics
      // already suppress this after a real drag - so this is genuinely a
      // "click empty panorama space" event.
      var coords = viewer.mouseEventToCoords(event);
      openWaypointModal(coords[0], coords[1], null);
    });
  }

  // ---------- Waypoint list ----------

  function renderWaypointList(scene) {
    el.waypointList.innerHTML = '';
    var hotspots = scene.hotspots || [];
    el.waypointEmpty.hidden = hotspots.length > 0;
    hotspots.forEach(function (hs, i) {
      var li = document.createElement('li');
      li.className = 'waypoint-list-item';

      var icon = document.createElement('span');
      icon.className = 'waypoint-list-item__icon' + (hs.type === 'info' ? ' waypoint-list-item__icon--info' : '');
      icon.textContent = hs.type === 'info' ? 'i' : '→';
      li.appendChild(icon);

      var text = document.createElement('span');
      text.className = 'waypoint-list-item__text';
      if (hs.type === 'scene') {
        var target = sceneByKey(hs.target);
        text.textContent = 'Links to: ' + (target ? target.title : hs.target + ' (missing!)');
      } else {
        text.textContent = hs.text || '(empty comment)';
      }
      li.appendChild(text);

      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'waypoint-list-item__edit';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', function () { openWaypointModal(hs.pitch, hs.yaw, i); });
      li.appendChild(editBtn);

      el.waypointList.appendChild(li);
    });
  }

  // ---------- Waypoint modal ----------

  function openWaypointModal(pitch, yaw, editIndex) {
    var scene = currentScene();
    pendingWaypoint = { pitch: pitch, yaw: yaw, editIndex: editIndex };

    populateTargetOptions(scene);

    if (editIndex !== null) {
      var hs = scene.hotspots[editIndex];
      el.waypointModalTitle.textContent = 'Edit Waypoint';
      document.querySelector('input[name="waypoint-type"][value="' + hs.type + '"]').checked = true;
      if (hs.type === 'scene') {
        el.waypointTarget.value = hs.target;
        el.waypointSceneText.value = hs.text || '';
      } else {
        el.waypointInfoText.value = hs.text || '';
      }
      el.btnWaypointDelete.hidden = false;
    } else {
      el.waypointModalTitle.textContent = 'Add Waypoint';
      document.querySelector('input[name="waypoint-type"][value="scene"]').checked = true;
      el.waypointSceneText.value = '';
      el.waypointInfoText.value = '';
      el.btnWaypointDelete.hidden = true;
    }
    toggleWaypointFields();
    el.waypointModal.hidden = false;
  }

  function populateTargetOptions(scene) {
    el.waypointTarget.innerHTML = '';
    tourData.scenes.forEach(function (s) {
      if (s.key === scene.key) return; // can't link a room to itself
      var opt = document.createElement('option');
      opt.value = s.key;
      opt.textContent = s.title || s.key;
      el.waypointTarget.appendChild(opt);
    });
  }

  function toggleWaypointFields() {
    var type = document.querySelector('input[name="waypoint-type"]:checked').value;
    el.waypointSceneFields.hidden = type !== 'scene';
    el.waypointInfoFields.hidden = type !== 'info';
  }

  function closeWaypointModal() {
    el.waypointModal.hidden = true;
    pendingWaypoint = null;
  }

  function saveWaypoint() {
    var scene = currentScene();
    var type = document.querySelector('input[name="waypoint-type"]:checked').value;
    var hotspot;
    if (type === 'scene') {
      var target = el.waypointTarget.value;
      if (!target) return;
      hotspot = {
        type: 'scene',
        target: target,
        pitch: pendingWaypoint.pitch,
        yaw: pendingWaypoint.yaw,
        text: el.waypointSceneText.value.trim() || sceneByKey(target).title
      };
    } else {
      var text = el.waypointInfoText.value.trim();
      if (!text) return;
      hotspot = { type: 'info', pitch: pendingWaypoint.pitch, yaw: pendingWaypoint.yaw, text: text };
    }

    if (!scene.hotspots) scene.hotspots = [];
    if (pendingWaypoint.editIndex !== null) {
      scene.hotspots[pendingWaypoint.editIndex] = hotspot;
    } else {
      scene.hotspots.push(hotspot);
    }

    closeWaypointModal();
    loadEditorViewer(scene);
    renderWaypointList(scene);
    markDirty();
  }

  function deleteWaypoint() {
    var scene = currentScene();
    scene.hotspots.splice(pendingWaypoint.editIndex, 1);
    closeWaypointModal();
    loadEditorViewer(scene);
    renderWaypointList(scene);
    markDirty();
  }

  // ---------- Room modal (add) ----------

  function openRoomModal() {
    el.roomTitleInput.value = '';
    el.roomPhotoInput.value = '';
    el.roomModal.hidden = false;
  }

  function closeRoomModal() {
    el.roomModal.hidden = true;
  }

  function saveNewRoom() {
    var title = el.roomTitleInput.value.trim();
    var file = el.roomPhotoInput.files[0];
    if (!title || !file) {
      window.alert('A title and a photo are both required.');
      return;
    }
    el.btnRoomSave.disabled = true;
    el.btnRoomSave.textContent = 'Adding…';

    var key = uniqueKey(slugify(title));
    resizeImageToBlob(file).then(function (result) {
      var filename = key + '.jpg';
      return writeFile(dirHandle, IMAGE_DIR_PATH.concat(filename), result.blob).then(function () {
        var scene = {
          key: key,
          title: title,
          image: filename,
          vaov: Math.round(result.vaov * 10) / 10,
          northOffset: 0,
          hotspots: []
        };
        tourData.scenes.push(scene);
        if (!tourData.startScene) tourData.startScene = key;
        renderSceneList();
        selectScene(tourData.scenes.length - 1);
        markDirty();
        closeRoomModal();
      });
    }).catch(function (err) {
      window.alert('Could not add that room: ' + err.message);
      console.error(err);
    }).then(function () {
      el.btnRoomSave.disabled = false;
      el.btnRoomSave.textContent = 'Add Room';
    });
  }

  // ---------- Scene toolbar actions ----------

  function renameScene() {
    var scene = currentScene();
    if (!scene) return;
    scene.title = el.titleInput.value;
    renderSceneList();
    markDirty();
  }

  function replacePhoto(file) {
    var scene = currentScene();
    if (!scene || !file) return;
    resizeImageToBlob(file).then(function (result) {
      return writeFile(dirHandle, IMAGE_DIR_PATH.concat(scene.image), result.blob).then(function () {
        scene.vaov = Math.round(result.vaov * 10) / 10;
        loadEditorViewer(scene);
        markDirty();
      });
    }).catch(function (err) {
      window.alert('Could not replace that photo: ' + err.message);
      console.error(err);
    });
  }

  function setAsStart() {
    var scene = currentScene();
    if (!scene) return;
    tourData.startScene = scene.key;
    renderSceneList();
    markDirty();
  }

  function deleteScene() {
    var scene = currentScene();
    if (!scene) return;
    var refs = 0;
    tourData.scenes.forEach(function (s) {
      (s.hotspots || []).forEach(function (h) {
        if (h.type === 'scene' && h.target === scene.key) refs++;
      });
    });
    var msg = 'Delete "' + (scene.title || scene.key) + '"?';
    if (refs) msg += ' ' + refs + ' waypoint(s) in other rooms link here and will be removed too.';
    if (!window.confirm(msg)) return;

    tourData.scenes.forEach(function (s) {
      if (!s.hotspots) return;
      s.hotspots = s.hotspots.filter(function (h) {
        return !(h.type === 'scene' && h.target === scene.key);
      });
    });
    tourData.scenes.splice(selectedIndex, 1);
    if (tourData.startScene === scene.key) {
      tourData.startScene = tourData.scenes.length ? tourData.scenes[0].key : null;
    }
    selectedIndex = -1;
    renderSceneList();
    if (tourData.scenes.length) {
      selectScene(0);
    } else {
      if (viewer) { viewer.destroy(); viewer = null; }
      el.titleInput.value = '';
      el.waypointList.innerHTML = '';
      el.waypointEmpty.hidden = false;
    }
    markDirty();
  }

  // ---------- Save all ----------

  function saveAll() {
    el.btnSave.disabled = true;
    el.btnSave.textContent = 'Saving…';
    var json = JSON.stringify(tourData, null, 2);
    writeFile(dirHandle, DATA_PATH, json).then(function () {
      markClean();
      el.btnSave.textContent = 'Save All Changes';
    }).catch(function (err) {
      el.btnSave.disabled = false;
      el.btnSave.textContent = 'Save All Changes';
      window.alert('Could not save: ' + err.message);
      console.error(err);
    });
  }

  // ---------- Init ----------

  function init() {
    el = {
      unsupported: document.getElementById('editor-unsupported'),
      picker: document.getElementById('editor-picker'),
      pickerError: document.getElementById('editor-picker-error'),
      btnOpenFolder: document.getElementById('btn-open-folder'),
      app: document.getElementById('editor-app'),
      status: document.getElementById('editor-status'),
      btnSave: document.getElementById('btn-save'),
      sceneList: document.getElementById('scene-list'),
      btnAddRoom: document.getElementById('btn-add-room'),
      titleInput: document.getElementById('scene-title-input'),
      btnReplacePhoto: document.getElementById('btn-replace-photo'),
      replacePhotoInput: document.getElementById('replace-photo-input'),
      btnSetStart: document.getElementById('btn-set-start'),
      btnDeleteScene: document.getElementById('btn-delete-scene'),
      waypointList: document.getElementById('waypoint-list'),
      waypointEmpty: document.getElementById('waypoint-empty'),
      waypointModal: document.getElementById('waypoint-modal'),
      waypointModalTitle: document.getElementById('waypoint-modal-title'),
      waypointSceneFields: document.getElementById('waypoint-scene-fields'),
      waypointInfoFields: document.getElementById('waypoint-info-fields'),
      waypointTarget: document.getElementById('waypoint-target'),
      waypointSceneText: document.getElementById('waypoint-scene-text'),
      waypointInfoText: document.getElementById('waypoint-info-text'),
      btnWaypointSave: document.getElementById('btn-waypoint-save'),
      btnWaypointCancel: document.getElementById('btn-waypoint-cancel'),
      btnWaypointDelete: document.getElementById('btn-waypoint-delete'),
      roomModal: document.getElementById('room-modal'),
      roomTitleInput: document.getElementById('room-title-input'),
      roomPhotoInput: document.getElementById('room-photo-input'),
      btnRoomSave: document.getElementById('btn-room-save'),
      btnRoomCancel: document.getElementById('btn-room-cancel')
    };

    if (!window.showDirectoryPicker) el.unsupported.hidden = false;

    el.btnOpenFolder.addEventListener('click', openFolder);
    el.btnSave.addEventListener('click', saveAll);
    el.btnAddRoom.addEventListener('click', openRoomModal);
    el.titleInput.addEventListener('change', renameScene);
    el.btnReplacePhoto.addEventListener('click', function () { el.replacePhotoInput.click(); });
    el.replacePhotoInput.addEventListener('change', function () {
      replacePhoto(el.replacePhotoInput.files[0]);
      el.replacePhotoInput.value = '';
    });
    el.btnSetStart.addEventListener('click', setAsStart);
    el.btnDeleteScene.addEventListener('click', deleteScene);

    document.querySelectorAll('input[name="waypoint-type"]').forEach(function (radio) {
      radio.addEventListener('change', toggleWaypointFields);
    });
    el.btnWaypointSave.addEventListener('click', saveWaypoint);
    el.btnWaypointCancel.addEventListener('click', closeWaypointModal);
    el.btnWaypointDelete.addEventListener('click', deleteWaypoint);

    el.btnRoomSave.addEventListener('click', saveNewRoom);
    el.btnRoomCancel.addEventListener('click', closeRoomModal);

    window.addEventListener('beforeunload', function (e) {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
