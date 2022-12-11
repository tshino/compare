const compareUtil = CompareUtil(window);
const compareUI = CompareUI({ compareUtil });

  const setDragStateClass = compareUI.setDragStateClass;
  let drawImageAwareOfOrientation = false;
  compareUtil.drawImageAwareOfOrientation().then(
    function(result) { drawImageAwareOfOrientation = result; }
  );

  const textUtil = compareUI.TextUtil({ document, changeLang });

  // View management functions
  const View = function({ model }) {
    const IMAGEBOX_MIN_SIZE = 32;
    const IMAGEBOX_MARGIN_W = 6, IMAGEBOX_MARGIN_H = 76;
    let baseImageIndex = null;
    let targetImageIndex = null;
    let backgroundColor = '#000000';
    let imageScaling = 'smooth';
    let dirtyTransform = false;
    let dirtyLayout = false;
    let dirtyDOM = false;
    const entryViewModifiers = [];
    const onUpdateEntryTransformListeners = [];

    const registry = model.Registry();

    const resetBaseAndTargetImage = function() {
      baseImageIndex = baseImageIndex === null ? registry.getFrontIndex() : baseImageIndex;
      if (targetImageIndex === null || baseImageIndex === targetImageIndex) {
        targetImageIndex = registry.findImageIndexOtherThan(baseImageIndex);
      }
    };
    const setBaseAndTargetImage = function(baseIndex, targetIndex) {
      baseImageIndex = baseIndex !== null ? baseIndex : baseImageIndex;
      targetImageIndex = targetIndex !== null ? targetIndex : targetImageIndex;
      if (baseImageIndex === targetImageIndex) {
        if (targetIndex === null) {
          targetImageIndex = registry.findImageIndexOtherThan(baseImageIndex);
        } else if (baseIndex === null) {
          baseImageIndex = registry.findImageIndexOtherThan(targetImageIndex);
        }
      }
    };
    const changeBaseImage = function(index) {
      if (registry.ready(index) &&
          baseImageIndex !== null &&
          baseImageIndex !== index) {
        setBaseAndTargetImage(index, null);
        return true;
      }
    };
    const changeTargetImage = function(index) {
      if (registry.ready(index) &&
          baseImageIndex !== null && targetImageIndex !== null &&
          targetImageIndex !== index) {
        setBaseAndTargetImage(targetImageIndex, index);
        return true;
      }
    };
    const baseIndex = function() {
      return baseImageIndex;
    };
    const targetIndex = function() {
      return targetImageIndex;
    };
    const onRemoveEntry = function(index) {
      const ent = registry.getEntry(index);
      if (ent.view) {
        $(ent.view).remove('.image');
      }
      if (baseImageIndex === index) {
        baseImageIndex = null;
      }
      if (targetImageIndex === index) {
        targetImageIndex = null;
      }
      resetLayoutState();
    };
    const getSelectedImageIndices = function() {
      const indices = [];
      const current = model.singleViewMode.current();
      if (current !== null) {
        indices.push(current);
        if (model.overlayMode.isActive() &&
            model.overlayMode.base() !== current) {
          indices.push(model.overlayMode.base());
        }
      }
      return indices;
    };
    const resetLayoutState = function() {
      model.singleViewMode.stop();
      viewZoom.setZoom(0);
      viewZoom.setOffset(0.5, 0.5);
      model.overlayMode.stop();
    };
    const toAllImageView = function() {
      model.singleViewMode.stop();
      updateLayout();
    };
    const toSingleImageView = function(index) {
      const prev = model.singleViewMode.current();
      if (!registry.visible(index)) {
        model.singleViewMode.stop();
      } else {
        model.singleViewMode.start(index);
      }
      if (prev !== model.singleViewMode.current()) {
        updateLayout();
      }
    };
    const toggleSingleView = function(index) {
      if (index === null || index === undefined) {
        index = model.singleViewMode.last();
        if (index === null) {
          flipSingleView(true);
          return;
        }
      }
      if (index === model.singleViewMode.current()) {
        toAllImageView();
      } else {
        toSingleImageView(index);
      }
    };
    const flipSingleView = function(forward) {
      if (!registry.empty()) {
        const current = model.singleViewMode.current();
        let next;
        if (current !== null) {
          const order = registry.numberFromIndex(current) - 1;
          next = forward ? order + 1 : order - 1;
        } else {
          next = forward ? 0 : -1;
        }
        const images = registry.getImages();
        next = (next + images.length) % images.length;
        model.singleViewMode.start(images[next].index);
        updateLayout();
        return false;
      }
    };
    const onResize = function() {
      model.layoutDirection.reset();
      updateLayout();
    };
    const arrangeLayout = function() {
      if (model.singleViewMode.isActive()) {
        model.singleViewMode.stop();
      } else {
        model.layoutDirection.alternate();
      }
      updateLayout();
    };
    const toggleOverlay = function() {
      const images = registry.getImages();
      if (!model.overlayMode.isActive() && 2 <= images.length) {
        const current = model.singleViewMode.current();
        if (current === null ||
            current === images[0].index ||
            !registry.getEntry(current)) {
          model.singleViewMode.start(images[1].index);
        }
        model.overlayMode.start(images[0].index);
        updateLayout();
      } else if (model.overlayMode.isActive()) {
        model.singleViewMode.start(model.overlayMode.base());
        model.overlayMode.stop();
        updateLayout();
      }
    };
    const updateLayoutMode = function() {
      if (!model.singleViewMode.isActive()) {
        model.overlayMode.stop();
      }
      if (model.layoutDirection.current() === null) {
        const width = $('#view').width();
        const height = $('#view').height();
        model.layoutDirection.determineByAspect(width, height);
      }
    };
    const getCurrentIndexOr = function(defaultIndex) {
      const current = model.singleViewMode.current();
      return current !== null ? current : defaultIndex;
    };
    const makeImageLayoutParam = function() {
      const numVisibleEntries = registry.numVisibleEntries();
      const numSlots = model.singleViewMode.isActive() ? 1 : Math.max(numVisibleEntries, 2);
      const layoutMode = model.layoutDirection.current();
      const numColumns = layoutMode === 'x' ? numSlots : 1;
      const numRows    = layoutMode !== 'x' ? numSlots : 1;
      const viewW = $('#view').width();
      const viewH = $('#view').height();
      let boxW = viewW / numColumns;
      let boxH = viewH / numRows;
      boxW = compareUtil.clamp(boxW, IMAGEBOX_MIN_SIZE, boxW - IMAGEBOX_MARGIN_W);
      boxH = compareUtil.clamp(boxH, IMAGEBOX_MIN_SIZE, boxH - IMAGEBOX_MARGIN_H);
      return {
        numVisibleEntries,
        numSlots,
        viewW,
        viewH,
        boxW,
        boxH
      };
    };
    const makeImageNameWithNumber = function(tag, img) {
      const number = registry.numberFromIndex(img.index);
      const elem = $(tag).css({ wordBreak : 'break-all' });
      if (number !== null) {
        elem.append($('<span class="imageIndex"/>').text(number));
      }
      return elem.append($('<span/>').text(img.name));
    };
    const doUpdateImageBox = function(box, img, boxW, boxH) {
      if (img.element) {
        img.boxW = boxW;
        img.boxH = boxH;
        const rect = compareUtil.calcInscribedRect(boxW, boxH, img.width, img.height);
        img.baseWidth = rect.width;
        img.baseHeight = rect.height;
        img.calcNormalizedROI = function(zoomScale, zoomCenter) {
          const roiW = img.boxW / (img.baseWidth * zoomScale);
          const roiH = img.boxH / (img.baseHeight * zoomScale);
          return [
            compareUtil.clamp(0.5 + zoomCenter.x - 0.5 * roiW, 0, 1),
            compareUtil.clamp(0.5 + zoomCenter.y - 0.5 * roiH, 0, 1),
            compareUtil.clamp(0.5 + zoomCenter.x + 0.5 * roiW, 0, 1),
            compareUtil.clamp(0.5 + zoomCenter.y + 0.5 * roiH, 0, 1)
          ];
        };
        img.calcROI = function(zoomScale, zoomCenter) {
          const nROI = img.calcNormalizedROI(zoomScale, zoomCenter);
          const w = img.width, h = img.height;
          return [ nROI[0] * w, nROI[1] * h, nROI[2] * w, nROI[3] * h ];
        };
        const w = img.transposed ? rect.height : rect.width;
        const h = img.transposed ? rect.width : rect.height;
        $(img.element).css({ width: w+'px', height: h+'px' });
        model.events.notifyUpdateImageBox(img, w, h);
      }
      const index = img.index;
      const isOverlay = (
        model.overlayMode.isActive() &&
        index === model.singleViewMode.current() &&
        index !== model.overlayMode.base()
      );
      const overlayMode = model.overlayMode.isActive();
      $(box).css({
        display : '',
        position : overlayMode ? 'absolute' : '',
        width : overlayMode ? $('#view').width() + 'px' : '',
        height : overlayMode ? $('#view').height() + 'px' : '',
        opacity : isOverlay ? '0.5' : '',
        background : overlayMode ? '#000' : ''
      });
    };
    const updateImageScaling = function() {
      if (imageScaling === 'pixel') {
        $('#view .imageBox .image').addClass('pixelated');
      } else {
        $('#view .imageBox .image').removeClass('pixelated');
      }
    };
    const doUpdateLayout = function() {
      const layoutMode = model.layoutDirection.current();
      const param = makeImageLayoutParam();
      const indices = getSelectedImageIndices();
      $('#view').css({ flexDirection : layoutMode === 'x' ? 'row' : 'column' });
      $('#viewHud').css('width', param.viewW);
      const images = registry.getImages();
      if (1 <= images.length && !dialogUtil.current()) {
        $('#navBox').show();
      } else {
        $('#navBox').hide();
      }
      if (2 <= images.length) {
        $('#prev,#next').show();
      } else {
        $('#prev,#next').hide();
      }
      $('#view > div.imageBox').each(function(index) {
        const hide = model.singleViewMode.isActive() && 0 > indices.indexOf(index);
        if (hide || !registry.visible(index)) {
          $(this).css({ display : 'none' });
        } else {
          const img = registry.getEntry(index);
          doUpdateImageBox(this, img, param.boxW, param.boxH);
        }
      });
      $('#view > div.emptyBox').each(function(index) {
        const hide = model.singleViewMode.isActive() || param.numVisibleEntries + index >= param.numSlots;
        $(this).css({ display : (hide ? 'none' : '') });
      });
      updateImageScaling();
      model.events.notifyUpdateLayout();
    };
    const addOnUpdateEntryTransform = function(listener) {
      onUpdateEntryTransformListeners.push(listener);
    };
    const doUpdateTransform = function(viewZoom) {
      for (const ent of registry.entries()) {
        if (ent.element) {
          const style = {
            left        : '50%',
            top         : '50%',
            transform   : 'translate(-50%, -50%) ' +
                          viewZoom.makeTransform(ent.index) +
                          ent.orientationAsCSS
          };
          $(ent.element).css(style);
          for (const listener of onUpdateEntryTransformListeners) {
            listener(ent, style);
          }
        }
      }
      model.events.notifyUpdateTransform();
    };
    const viewZoom = compareUtil.makeZoomController((_viewZoom) => {
      dirtyTransform = true;
      update();
    }, {
      getBaseSize: function(index) {
        if (registry.ready(index)) {
          const ent = registry.getEntry(index);
          return { w: ent.baseWidth, h: ent.baseHeight };
        }
      }
    });
    const updateLayout = function() {
      dirtyLayout = true;
      update();
    };
    const addEntryViewModifier = function(modifier) {
      entryViewModifiers.push(modifier);
    };
    const doUpdateDOM = function() {
      registry.update();
      if (registry.empty()) {
        viewZoom.disable();
      } else {
        viewZoom.enable();
      }
      for (const ent of registry.entries()) {
          if (!ent.view) {
            ent.view = $('<div class="imageBox"/>');
            $('#drop').before(ent.view);
          }
          ent.view.find('.imageName').remove();
          ent.view.append(
              makeImageNameWithNumber('<span class="imageName">', ent).
                click(function() {
                  toggleSingleView(ent.index);
                }).append(
                  $('<button>').addClass('remove').text('×').
                    click(function() { registry.removeEntry(ent.index); })
                )
          );
          if (ent.element) {
            for (const modifier of entryViewModifiers) {
              if (modifier(ent)) {
                ent.view.find('.image').remove();
                break;
              }
            }
            if (0 === ent.view.find('.image').length) {
              $(ent.element).addClass('image');
              ent.view.prepend(ent.element);
            }
          }
          if (ent.error) {
            ent.view.addClass('error');
          }
      }
      resetMouseDrag();
      model.events.notifyUpdateViewDOM();
    };
    const updateDOM = function() {
      dirtyDOM = true;
      update();
    };
    const update = function() {
      if (dirtyDOM) {
        dirtyDOM = false;
        doUpdateDOM();
        dirtyLayout = true;
      }
      if (dirtyLayout) {
        dirtyLayout = false;
        updateLayoutMode();
        doUpdateLayout();
        dirtyTransform = true;
      }
      if (dirtyTransform) {
        dirtyTransform = false;
        doUpdateTransform(viewZoom);
      }
    };
    const updateEmptyBoxTextColor = function() {
      let textColor;
      if ($('#view').hasClass('useChecker')) {
        textColor = '#222';
      } else {
        const rgb = parseInt(backgroundColor.substring(1), 16);
        const y = 0.299 * (rgb>>16) + 0.587 * ((rgb>>8)&255) + 0.114 * (rgb&255);
        textColor = (96 <= y) ? '#444' : '#888';
      }
      $('#view .dropHere').css({color: textColor, borderColor: textColor});
    };
    const setBackgroundColor = function(color) {
      backgroundColor = color;
      $('#view').css({'background-color': color});
      updateEmptyBoxTextColor();
    };
    const setCheckerPattern = function(enable) {
      enable ? $('#view').addClass('useChecker') : $('#view').removeClass('useChecker');
      updateEmptyBoxTextColor();
    };
    const setImageScaling = function(type) {
      imageScaling = type;
      updateImageScaling();
    };
    const resetMouseDrag = function() {
      viewZoom.resetDragState();
    };
    const toggleFullscreen = function() {
      resetMouseDrag();
      compareUtil.toggleFullscreen($('#viewroot').get(0));
    };
    $('#prev').click(function() { flipSingleView(false); });
    $('#next').click(function() { flipSingleView(true); });
    registry.addCacheProperty('imageData');
    registry.addOnRemoveEntry(onRemoveEntry);
    registry.setOnDidRemoveEntry(() => updateDOM());

    return {
      getEntry: registry.getEntry,
      empty: registry.empty,
      getImages: registry.getImages,
      getFrontIndex: registry.getFrontIndex,
      register: registry.register,
      ready: registry.ready,
      setImage: registry.setImage,
      setAltImage: registry.setAltImage,
      setError: registry.setError,
      removeEntry: registry.removeEntry,
      numberFromIndex: registry.numberFromIndex,
      indexFromNumber: registry.indexFromNumber,
      addCacheProperty: registry.addCacheProperty,
      addOnRemoveEntry: registry.addOnRemoveEntry,
      findImageIndexOtherThan: registry.findImageIndexOtherThan,
      resetBaseAndTargetImage,
      setBaseAndTargetImage,
      changeBaseImage,
      changeTargetImage,
      baseIndex,
      targetIndex,
      getSelectedImageIndices,
      resetLayoutState,
      toAllImageView,
      toSingleImageView,
      toggleSingleView,
      flipSingleView,
      onResize,
      arrangeLayout,
      toggleOverlay,
      getCurrentIndexOr,
      makeImageNameWithNumber,
      addOnUpdateEntryTransform,
      viewZoom,
      updateLayout,
      addEntryViewModifier,
      updateDOM,
      setBackgroundColor,
      setCheckerPattern,
      setImageScaling,
      resetMouseDrag,
      toggleFullscreen
    };
  };
  const model = compareUI.ViewModel();
  const view = View({ model });
  const viewZoom = view.viewZoom;

  const ViewUtil = function({ view }) {
    const makeImageNameSelector = function(selectedIndex, onchange) {
      const select = $('<select>').on('change', function(e) {
        const index = parseInt(this.options[this.selectedIndex].value);
        onchange(index);
        return false;
      });
      for (const img of view.getImages()) {
        const option = $('<option>').text(img.name).attr('value', img.index);
        select.append(option);
        if (img.index === selectedIndex) {
          option.attr('selected','');
        }
      }
      const number = view.numberFromIndex(selectedIndex);
      return $('<span>').append(
        $('<span class="imageIndex"/>').text(number),
        select
      );
    };
    const setupBaseAndTargetSelector = function(baseSelector, targetSelector, onUpdate) {
      $(baseSelector).children().remove();
      $(targetSelector).children().remove();
      if (view.getImages().length < 2) {
        $(baseSelector).append($('<span>').text('no data'));
        $(targetSelector).append($('<span>').text('no data'));
        return false;
      }
      view.resetBaseAndTargetImage();
      $(baseSelector).append(
        makeImageNameSelector(view.baseIndex(), function(index) {
          view.changeBaseImage(index);
          onUpdate();
        })
      );
      $(targetSelector).append(
        makeImageNameSelector(view.targetIndex(), function(index) {
          view.setBaseAndTargetImage(null, index);
          onUpdate();
        })
      );
    };
    const updateBaseImageSelector = function(target, baseIndex, repaint) {
      const baseCell = $(target).find('tr.basename td:not(.prop)');
      baseCell.children().remove();
      if (baseIndex === null || view.empty()) {
        baseCell.append($('<span>').text('no data'));
      } else {
        baseCell.append(
          makeImageNameSelector(baseIndex, function(index) {
            view.changeBaseImage(index);
            repaint();
          })
        );
      }
    };
    const makeImageOverlayOnUpdateLayout = function(key, make) {
      return function(enable, img, w, h) {
        if (enable) {
          if (img.element && !img[key]) {
            img[key] = make(img.canvasWidth, img.canvasHeight);
            img.view.append(img[key]);
          }
          if (img[key]) {
            $(img[key]).css({ width: w+'px', height: h+'px' });
          }
        } else {
          if (img[key]) {
            $(img[key]).remove();
            img[key] = null;
          }
        }
      };
    };
    return {
      makeImageNameSelector,
      setupBaseAndTargetSelector,
      updateBaseImageSelector,
      makeImageOverlayOnUpdateLayout
    };
  };
  const viewUtil = ViewUtil({ view });

  const grid = compareUI.Grid({ view, viewUtil, model });
  const crossCursor = compareUI.CrossCursor({ view, viewModel: model });

  const dialogUtil = compareUI.DialogUtil();
  model.events.addOnUpdateLayout(dialogUtil.adjustDialogPosition);
  const figureZoom = dialogUtil.figureZoom;
  const openMessageBox = (function() {
    let serial = 0;
    return function(text) {
      serial += 1;
      const mySerial = serial;
      $('#messageBox').css('display', 'block');
      textUtil.setText($('#messageBoxBody'), text);
      const close = function(delay) {
        const doClose = function() {
          if (serial === mySerial) {
            $('#messageBox').css('display', '');
          }
        };
        if (delay) {
          window.setTimeout(doClose, delay);
        } else {
          doClose();
        }
      };
      return { close };
    };
  })();
  const toggleHelp = dialogUtil.defineDialog($('#shortcuts'));
  const toggleAnalysis = dialogUtil.defineDialog($('#analysis'));
  // Settings
  const Settings = function() {
    let storage = null;
    if (compareUtil.storageAvailable('localStorage')) {
      storage = window.localStorage;
    }
    const openBGColor = function() {
      $('#settingsBGColor').click();
    };
    const configItem = function(key, initialValue, setter) {
      const set = function(value) {
        setter(value);
        if (storage) {
          storage.setItem(key, value);
        }
      };
      const reset = function() {
        set(initialValue);
      };
      const load = function() {
        const value = storage && storage.getItem(key);
        setter(value || initialValue);
      };
      return { key, set, reset, load };
    };
    const bgColor = configItem('config-view-bg-color', '#444444', function(value) {
      if (!/^\#[0-9a-fA-F]{6}$/.test(value)) {
        value = '#000000';
      }
      $('#bgcolorbtn svg path').attr('fill', value);
      $('#settingsBGColor').prop('value', value);
      $('#settingsBGColorText').prop('value', value);
      view.setBackgroundColor(value);
    });
    const bgPattern = configItem('config-view-bg-pattern', '', function(value) {
      if (value === 'checker') {
        $('#settingsBGChecker').addClass('current');
      } else {
        $('#settingsBGChecker').removeClass('current');
      }
      view.setCheckerPattern(value === 'checker');
    });
    const imageScaling = configItem('config-view-image-scaling-style', 'smooth', function(value) {
      $('#settingsImageScalingButtons button').removeClass('current').filter(
        value === 'pixel' ?
          '[data-value=pixel]' :
          '[data-value=smooth]'
      ).addClass('current');
      view.setImageScaling(value);
    });
    const gridIntervalValues = function(value) {
      const num = value.split('/');
      const aux = compareUtil.clamp(parseInt(num[0]) || 4, 1, 256);
      const main = compareUtil.clamp(parseInt(num[1]) || 16, 1, 256);
      return [aux, main];
    };
    const gridInterval = configItem('config-grid-interval', '10/100', function(value) {
      const num = gridIntervalValues(value);
      const radio = $('#settings input[name=settingsGridInterval]');
      let other = true;
      for (let i = 0; i < radio.length; i++) {
        if (radio[i].value === value) {
          radio.val([value]);
          other = false;
          break;
        }
      }
      if (other) {
        radio.val(['other']);
        $('#settingsGridIntervalFreeAux').prop('value', num[0]);
        $('#settingsGridIntervalFreeMain').prop('value', num[1]);
      }
      grid.setInterval(num[1], num[0]);
    });
    const configItems = [
        bgColor,
        bgPattern,
        imageScaling,
        gridInterval
    ];
    const loadConfig = function(key) {
      configItems.forEach(function(item) {
        if (key === undefined || key === item.key) {
          item.load();
        }
      });
    };
    const supportsCSSImageRenderingPixelated = function() {
      const n = compareUtil.browserName;
      return 0 <= ['msie', 'chrome', 'safari', 'firefox', 'opera'].indexOf(n);
    };
    const startup = function() {
      if (!supportsCSSImageRenderingPixelated()) {
        $('#settingsImageScalingRow').hide();
      }
      loadConfig();
      $('#settingsBGColor').on('change', function(e) {
        bgColor.set(e.target.value);
      });
      $('#bgcolorbtn').click(openBGColor);
      $('#settingsBGColorText').on('change', function(e) {
        bgColor.set(e.target.value);
      });
      $('#settingsBGChecker').on('click', function(e) {
        if ($('#settingsBGChecker').hasClass('current')) {
          bgPattern.set('');
        } else {
          bgPattern.set('checker');
        }
      });
      $('#settingsImageScalingButtons button').on('click', function(e) {
        imageScaling.set($(this).attr('data-value'));
      });
      const updateGridInterval = function(value) {
        if (value === 'other') {
          gridInterval.set(
            $('#settingsGridIntervalFreeAux').val() + '/' +
            $('#settingsGridIntervalFreeMain').val()
          );
        } else {
          gridInterval.set(value);
        }
      };
      $('#settings input[name=settingsGridInterval]').on('change', function(e) {
        updateGridInterval(e.target.value);
      });
      $('#settings input[name=settingsGridInterval]').parent().css({
        cursor: 'pointer'
      }).on('click', function(e) {
        updateGridInterval($(this).find('input[name=settingsGridInterval]').val());
      });
      $('#settingsGridIntervalFreeAux,#settingsGridIntervalFreeMain').on('change', function(e) {
        updateGridInterval('other');
      });
      $('#settingsReset').click(function(e) {
        configItems.forEach(function(item) { item.reset(); });
      });
      window.addEventListener('storage', function(e) {
        loadConfig(e.key);
      });
    };
    const toggle = dialogUtil.defineDialog($('#settings'));
    return {
      startup,
      openBGColor,
      toggle
    };
  };
  // Camera
  const CameraDialog = function() {
    let error = false;
    let opening = false;
    let stream = null;
    const hasCameraAPI = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const video = document.getElementById('cameravideo');
    $('#capture').on('click', function() {
      if (error) {
        error = false;
        onUpdate(); // retry
      } else if (!opening && stream) {
        const canvas = compareUtil.figureUtil.canvasFromImage(video, video.videoWidth, video.videoHeight);
        addCapturedImage(canvas);
      }
    });
    const onUpdate = function() {
      if (error) {
        return;
      }
      if (!opening && !stream) {
        if (!hasCameraAPI) {
          textUtil.setText($('#capturestatus'), {
            en: 'This browser does not support camera input',
            ja: 'このブラウザはカメラ入力をサポートしていません'
          });
          error = true;
          return;
        }
        textUtil.setText($('#capturestatus'), {
          en: 'Accessing the camera...',
          ja: 'カメラにアクセスしています...'
        });
        opening = true;
        const p = navigator.mediaDevices.getUserMedia({ video: true });
        p.then(function(s) {
          stream = s;
          if (!opening) {
            stream.getVideoTracks()[0].stop();
            stream = null;
            return;
          }
          $(video).on('loadedmetadata', function(e) {
            if (stream) {
              opening = false;
              $('#capturestatus span').text('');
              $('#capture').prop('disabled', false).focus();
            }
          });
          video.srcObject = stream;
          video.play();
        }, function(e) {
          if (opening) {
            error = true;
            opening = false;
            textUtil.setText($('#capturestatus'),
              e.name === 'NotFoundError' ? {
                en: 'Camera not found',
                ja: 'カメラがありません'
              } : e.name === 'NotAllowedError' ? {
                en: 'Access to the camera was blocked',
                ja: 'カメラへのアクセスはブロックされました'
              } : {
                en: 'The camera can not be used. Please make sure that no other application is using the camera',
                ja: 'カメラを使用できません. 他のアプリがカメラを利用していないか確認して下さい'
              }
            );
            $('#capture').prop('disabled', false).focus();
          }
        });
      }
    };
    const onClose = function() {
      if (stream) {
        stream.getVideoTracks()[0].stop();
        stream = null;
        video.srcObject = null;
        $('#capture').prop('disabled', true);
      }
      opening = false;
      error = false;
    };
    const toggle = dialogUtil.defineDialog(
      $('#camera'),
      onUpdate,
      null,
      { onClose }
    );
    return {
      hasCameraAPI,
      toggle
    };
  };
  // Image Information
  const InfoDialog = function() {
    const makeDescriptionWithApprox = function(exact, approx) {
      if (typeof exact === 'string') {
        exact = { en: exact, ja: exact };
      }
      return textUtil.setText($('<span>'), {
        en: exact.en + '\n(approx. ' + approx + ')',
        ja: exact.ja + '\n(約 ' + approx + ')'
      });
    };
    const makeCellValue = function(data) {
      const value = data[0], desc = data[1], approx = data[2];
      if (approx !== undefined) {
        return [value, makeDescriptionWithApprox(desc, approx)];
      } else if (typeof desc === 'string') {
        return [value, desc];
      } else {
        return [value, textUtil.setText($('<span>'), desc)];
      }
    };
    const makeOrientationInfo = function(img) {
      const orientation = compareUtil.orientationUtil.toString(img.orientationExif);
      const desc = img.orientationExif ? $('<span>').append(
        $('<img src="res/orientation.svg" width="30">').css({
          verticalAlign: '-8px',
          transform: compareUtil.orientationUtil.getCSSTransform(img.orientationExif)
        }),
        $('<span>').text('(' + orientation + ')')
      ) : orientation;
      return [img.orientationExif ? orientation : null, desc];
    };
    const nonUniform = { en: 'non-uniform', ja: '一様でない' };
    const rows = [
      $('#infoName'),
      $('#infoFormat'),
      $('#infoColor'),
      $('#infoWidth'),
      $('#infoHeight'),
      $('#infoAspect'),
      $('#infoOrientation'),
      $('#infoNumFrames'),
      $('#infoDuration'),
      $('#infoFPS'),
      $('#infoFileSize'),
      $('#infoLastModified')
    ];
    const unknown = [null, '‐'];
    const makeTableValue = function(img) {
      return [
        [null, view.makeImageNameWithNumber('<span>', img)],
        img.format === '' ? unknown : [img.format, img.format],
        img.color === '' ? unknown : [img.color, img.color],
        img.sizeUnknown ? unknown : [img.width, compareUtil.addComma(img.width) ],
        img.sizeUnknown ? unknown : [img.height, compareUtil.addComma(img.height) ],
        img.sizeUnknown ? unknown : makeCellValue(compareUtil.aspectRatioUtil.makeInfo(img.width, img.height)),
        makeOrientationInfo(img),
        !img.numFrames ? unknown : [img.numFrames, String(img.numFrames)],
        makeCellValue(compareUtil.makeDurationInfo(img.formatInfo)),
        makeCellValue(compareUtil.makeFPSInfo(img.formatInfo, nonUniform)),
        [img.size, img.size ? compareUtil.addComma(img.size) : '-'],
        [img.lastModified, img.lastModified ? img.lastModified.toLocaleString() : '-']
      ];
    };
    const updateTableCell = function(val) {
      for (let j = 0, v; v = val[j]; ++j) {
        const desc = v[1], e = $('<td>').css('max-width', '300px');
        rows[j].append(typeof desc === 'string' ? e.text(desc) : e.append(desc));
      }
    };
    const updateTableCellForComparison = function(index, val, base, isBase) {
      const name = rows[0].children().last();
      if (isBase) {
        name.append($('<br>'), textUtil.setText($('<span>').css('font-size', '0.8em'), {
          en: ' (base image)',
          ja: ' (基準画像)',
        }));
      } else {
        name.children().last().addClass('imageName').click(function(e) {
          view.changeBaseImage(index);
          updateTable();
        });
        for (let j = 0, v; v = val[j]; ++j) {
          if (base[j][0] && v[0]) {
            rows[j].children().last().addClass(
              base[j][0] < v[0] ? 'sign lt' :
              base[j][0] > v[0] ? 'sign gt' : 'sign eq'
            );
          }
        }
      }
    };
    const updateTable = function() {
      $('#infoTable td:not(.prop)').remove();
      if (!view.empty()) {
        view.resetBaseAndTargetImage();
      }
      const val = [];
      const indices = [];
      let hasAnimated = false, hasOrientation = false;
      for (const img of view.getImages()) {
        val.push(makeTableValue(img));
        indices.push(img.index);
        if (img.numFrames) {
          hasAnimated = true;
        }
        if (img.orientationExif) {
          hasOrientation = true;
        }
      }
      const enableComparison = 2 <= val.length;
      let basePos, baseVal;
      if (enableComparison) {
        basePos = Math.max(0, indices.indexOf(view.baseIndex()));
        baseVal = val[basePos] || null;
      }
      for (let i = 0; i < val.length; i++) {
        updateTableCell(val[i]);
        if (enableComparison) {
          updateTableCellForComparison(indices[i], val[i], baseVal, i === basePos);
        }
      }
      $('#infoOrientation').css('color', hasOrientation ? '' : '#888');
      $('#infoNumFrames').css('color', hasAnimated ? '' : '#888');
      $('#infoDuration').css('color', hasAnimated ? '' : '#888');
      $('#infoFPS').css('color', hasAnimated ? '' : '#888');
      if (val.length === 0) {
        rows[0].append($('<td>').text('no data'));
        rows[1].append($('<td>').attr('rowspan', rows.length - 1).text('no data'));
      }
    };
    const toggle = dialogUtil.defineDialog($('#info'), updateTable, toggleAnalysis);
    return {
      toggle
    };
  };
  const NowLoadingDialog = function() {
    let loading = [];
    const toggleNowLoading = dialogUtil.defineDialog($('#loading'));
    const add = function(entry) {
      loading.push(entry);
    };
    const update = function() {
      if ($('#loading').is(':visible')) {
        dialogUtil.hideDialog();
      }
      $('#loadingList > tr').remove();
      if (0 === loading.length) {
        return;
      }
      let finished = true, errors = 0;
      for (let i = 0, ent; ent = loading[i]; i++) {
        const td = $('<td>').css({ minWidth: '400px' });
        if (ent.loading) {
          td.addClass('loading').
            text('Loading...').
            css({
              background: 'linear-gradient(to right, '+
                '#cde, #cde '+ent.progress+'%, transparent '+ent.progress+'%, transparent)'
            });
          finished = false;
        } else if (ent.error) {
          td.addClass('error').text(ent.error);
          ++errors;
        } else {
          td.addClass('ok').text('OK!');
        }
        $('#loadingList').append(
          $('<tr>').append(view.makeImageNameWithNumber('<td class="b">', ent), td)
        );
      }
      if (finished) {
        loading = [];
      }
      textUtil.setText($('#loadingStatus'),
        !finished ? {
          en: 'Now loading...',
          ja: 'ロード中...'
        } : 0 === errors ? {
          en: 'Finished!',
          ja: '完了！'
        } : {
          en: 1 === errors ? 'An error occurred.' : 'Some errors occured.',
          ja: errors + '個のエラー'
        });
      toggleNowLoading();
      if (finished && 0 === errors) {
        window.setTimeout( function() {
          if ($('#loading').is(':visible')) {
            dialogUtil.hideDialog();
          }
        }, 500);
      }
    };
    return {
      add,
      update
    };
  };
  const getImageData = function(img) {
    if (img.imageData) {
      return img.imageData;
    } else {
      const w = img.canvasWidth;
      const h = img.canvasHeight;
      try {
        const context = img.asCanvas.getContext('2d');
        const imageData = context.getImageData(0, 0, w, h);
        // avoid huge memory consumption
        if (w * h <= 30 * 1024 * 1024) {
          img.imageData = imageData;
        }
        return imageData;
      } catch (e) {
        return null;
      }
    }
  };
  const updateFigureTable = function(target, propName, update, styles, transformOnly) {
    if (transformOnly) {
      $(target).find('td.fig > *').css(styles.style);
      return null;
    }
    const labelRow = $(target).find('tr.label');
    const figureRow = $(target).find('tr.figure');
    labelRow.find('td').remove();
    figureRow.find('td').remove();
    const figIndices = [];
    for (const img of view.getImages()) {
      if (!img[propName]) {
        img[propName] = compareUtil.figureUtil.makeBlankFigure(8, 8).canvas;
        update(img);
      }
      const label = view.makeImageNameWithNumber('<td>', img);
      labelRow.append(label);
      const figCell = $('<td class="fig">').css(styles.cellStyle);
      figCell.append($(img[propName]).css(styles.style).addClass('figMain'));
      const axes = img[propName + 'Axes'];
      if (axes) {
        figCell.append($(axes).css(styles.style));
      }
      figureRow.append(figCell);
      figIndices.push(img.index);
    }
    if (view.empty()) {
      const cell = $('<td rowspan="2">').text('no data');
      labelRow.append(cell);
    }
    return figIndices;
  };
  const makeFigureStyles = function(w, h, margin, background, zoomController) {
    const styles = { figW: w, figH: h, figMargin: margin, baseW: w, baseH: h };
    styles.cellStyle = {
      minWidth: (w + margin * 2) + 'px',
      width: (w + margin * 2) + 'px',
      height: (h + margin * 2) + 'px',
      background: background
    };
    styles.style = {
      width: w + 'px',
      height: h + 'px',
      left: '50%',
      top: margin + 'px',
      transform: 'translate(-50%,0%) ' + (zoomController ? zoomController.makeTransform() : '')
    };
    return styles;
  };
  const updateFigureStylesForActualSize = function(styles, w, h) {
    const rect = compareUtil.calcInscribedRect(styles.figW, styles.figH, w, h);
    styles.baseW = rect.width;
    styles.baseH = rect.height;
    styles.style.width = rect.width + 'px';
    styles.style.height = rect.height + 'px';
    styles.style.top = ((styles.figH - rect.height) / 2 + styles.figMargin) + 'px';
    return styles;
  };

  const taskQueue = compareUtil.makeTaskQueue('modules/compare-worker.js');
  taskQueue.addTaskWithImageData = (function() {
    const attachImageDataToTask = function(data) {
        data.imageData = [];
        for (let i = 0; i < data.index.length; ++i) {
          data.imageData[i] = getImageData(view.getEntry(data.index[i]));
          if (!data.imageData[i]) {
            alert('out of memory');
            return false;
          }
        }
    };
    return function(data, callback) {
        taskQueue.addTask(data, attachImageDataToTask, callback);
    };
  })();
  taskQueue.discardTasksOfCommand = function(cmd) {
    taskQueue.discardTasksOf(function(task) { return task.cmd === cmd; });
  };
  taskQueue.discardTasksOfEntryByIndex = function(index) {
    taskQueue.discardTasksOf(function(task) { return task.index.indexOf(index) !== -1; });
  };
  view.addOnRemoveEntry(taskQueue.discardTasksOfEntryByIndex);

  const makeModeSwitch = function(parent, initialValue, onchange, toggle) {
    let currentType = initialValue;
    const set = function(type) {
      if (currentType !== type) {
        currentType = type;
        const index = toggle ? [true, false].indexOf(type) : type;
        $(parent).children().removeClass('current').eq(index).addClass('current');
        onchange(type);
      }
    };
    $(parent).children().click(function() {
      const type = toggle ? !currentType : $(parent).children().index(this);
      set(type);
    });
    return {
      current: function() { return currentType; },
      set: set
    };
  };
  const makeToggleSwitch = function(parent, initialValue, onchange) {
    return makeModeSwitch(parent, initialValue, onchange, true);
  };
  // Histogram
  const HistogramDialog = function() {
    const figW = 768 + 40;
    const figH = 512 + 32;
    let figIndices = [];
    $('#histogram').on('mousemove', 'td.fig > *', function(e) {
      const point = figureZoom.positionFromMouseEvent(e, this, null);
      onFigurePointed(point);
    });
    const onFigurePointed = function(point) {
      const x = Math.floor(point.x * figW * 256 / 768);
      if (0 <= x && x <= 255) {
        const infoRow = $('#histoTable tr.info');
        infoRow.children().remove();
        const addInfo = function(target, label, color, hist, offset) {
          const value = hist[offset + x];
          const info = label + ' ' + String(x) + '(' + compareUtil.addComma(value) + ') ';
          const span = $('<span>').text(info).css({
            'color': color,
            'display': 'inline-block',
            'width': '120px'
          });
          if (value === 0) {
            span.css('opacity', '0.3');
          }
          target.append(span);
        };
        for (let k = 0; k < figIndices.length; k++) {
          const index = figIndices[k];
          const hist = view.getEntry(index).histogramData;
          const td = $('<td>').css('font-size','14px');
          if (histogramType.current() === 0) {
            addInfo(td, 'R', '#800', hist, 0);
            addInfo(td, 'G', '#080', hist, 256);
            addInfo(td, 'B', '#008', hist, 512);
          } else if (histogramType.current() === 1) {
            addInfo(td, 'Y', '#444', hist, 0);
          } else {
            addInfo(td, 'Y', '#444', hist, 0);
            addInfo(td, 'Cb', '#008', hist, 256);
            addInfo(td, 'Cr', '#800', hist, 512);
          }
          infoRow.append(td);
        }
      }
    };
    const processClick = function(point) {
      onFigurePointed(point);
    };
    const repaint = function() {
      taskQueue.discardTasksOfCommand('calcHistogram');
      for (const img of view.getImages()) {
        img.histogram = null;
      }
      updateTable();
    };
    const histogramType = makeModeSwitch('#histogramType', 0, function() {
      repaint();
      updateAuxOption();
    });
    const histogramRowLayout = makeToggleSwitch('#histogramRowLayout', true, repaint);
    const histogramAuxType2 = makeModeSwitch('#histogramAuxType2', 0, repaint);
    const updateAuxOption = function() {
      if (histogramType.current() === 0) {
        $('#histogramRowLayout').show();
        $('#histogramAuxType2').hide();
      } else if (histogramType.current() === 1) {
        $('#histogramRowLayout').hide();
        $('#histogramAuxType2').show();
      } else {
        $('#histogramRowLayout').show();
        $('#histogramAuxType2').show();
      }
    };
    updateAuxOption();
    const makeFigure = function(type, auxType2, hist) {
      const fig = compareUtil.figureUtil.makeBlankFigure(figW, figH);
      const context = fig.context;
      let max = 0;
      for (let i = 0; i < hist.length; ++i) {
        max = Math.max(max, hist[i]);
      }
      const drawGrid = function() {
        for (let k = 16; k < 255; k += 16) {
          context.strokeStyle = (k % 64 === 0) ? '#888' : '#444';
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(k * 3 + 1.5, 0);
          context.lineTo(k * 3 + 1.5, 512);
          context.stroke();
        }
      };
      context.fillStyle = '#222';
      context.fillRect(0,0,768,512);
      context.fillStyle = '#000';
      context.fillRect(768,0,figW - 768,512);
      drawGrid();
      let comp;
      if (type === 0) { // RGB
        if (histogramRowLayout.current()) {
          compareUtil.figureUtil.drawHistogram(context, '#f00', hist, max, 0, 256, 0, 170, 170);
          compareUtil.figureUtil.drawHistogram(context, '#0f0', hist, max, 256, 256, 0, 341, 170);
          compareUtil.figureUtil.drawHistogram(context, '#00f', hist, max, 512, 256, 0, 512, 170);
          comp = [ '#f22', 168, 'R', '#2f2', 339, 'G', '#22f', 510, 'B' ];
        } else {
          context.globalCompositeOperation = 'lighter';
          compareUtil.figureUtil.drawHistogram(context, '#f00', hist, max, 0, 256, 0, 512, 512);
          compareUtil.figureUtil.drawHistogram(context, '#0f0', hist, max, 256, 256, 0, 512, 512);
          compareUtil.figureUtil.drawHistogram(context, '#00f', hist, max, 512, 256, 0, 512, 512);
          comp = [ '#f22', 446, 'R', '#2f2', 478, 'G', '#22f', 510, 'B' ];
        }
      } else if (type === 1) { // Luminance
        compareUtil.figureUtil.drawHistogram(context, '#fff', hist, max, 0, 256, 0, 512, 512);
        comp = [ '#fff', 510, 'Y' ];
      } else { // YCbCr
        if (histogramRowLayout.current()) {
          compareUtil.figureUtil.drawHistogram(context, '#ddd', hist, max, 0, 256, 0, 170, 170);
          compareUtil.figureUtil.drawHistogram(context, '#22f', hist, max, 256, 256, 0, 341, 170);
          compareUtil.figureUtil.drawHistogram(context, '#f22', hist, max, 512, 256, 0, 512, 170);
          comp = [ '#ddd', 168, 'Y', '#44f', 339, 'Cb', '#f44', 510, 'Cr' ];
        } else {
          context.globalCompositeOperation = 'lighter';
          compareUtil.figureUtil.drawHistogram(context, '#aaa', hist, max, 0, 256, 0, 512, 512);
          compareUtil.figureUtil.drawHistogram(context, '#00f', hist, max, 256, 256, 0, 512, 512);
          compareUtil.figureUtil.drawHistogram(context, '#f00', hist, max, 512, 256, 0, 512, 512);
          comp = [ '#ddd', 446, 'Y', '#44f', 478, 'Cb', '#f44', 510, 'Cr' ];
        }
      }
      const axes = [
        { pos: (0.5 + 0  ) / 256, align: 'left',   label: '0' },
        { pos: (0.5 + 255) / 256, align: 'right',  label: '255' }
      ];
      for (let i = 16; i < 256; i += 16) {
        axes.push({
          pos: (0.5 + i) / 256, align: 'center', label: (i%64 === 0) ? ''+i : ''
        });
      }
      compareUtil.figureUtil.drawAxes(fig.context, 0, 512, 768, 0, 10, 3, '#000', axes);
      const drawAxesLabels = function(context, comp) {
        context.font = '30px sans-serif';
        context.textAlign = 'left';
        for (let i = 0; i < comp.length; i += 3) {
          context.fillStyle = comp[i];
          context.fillText(comp[i + 2], 768 + 2, comp[i + 1]);
        }
      };
      drawAxesLabels(context, comp);
      return fig.canvas;
    };
    const updateFigure = function(type, auxTypes, img, hist) {
      if (type === histogramType.current() && auxTypes[0] === histogramAuxType2.current()) {
        img.histogramData = hist;
        img.histogram = makeFigure(type, auxTypes[0], hist);
        updateTable();
      }
    };
    const updateAsync = function(img) {
      taskQueue.addTaskWithImageData({
        cmd:      'calcHistogram',
        type:     histogramType.current(),
        auxTypes: [histogramAuxType2.current()],
        index:    [img.index]
      }, (data) => {
        updateFigure(data.type, data.auxTypes, img, data.result);
      });
    };
    const updateTable = function(transformOnly) {
      const w = figW / 2, h = figH / 2, margin = 8;
      const styles = makeFigureStyles(w, h, margin, '#bbb', figureZoom);
      const indices = updateFigureTable('#histoTable', 'histogram', updateAsync, styles, transformOnly);
      if (indices) {
        figIndices = indices;
        const infoRow = $('#histoTable tr.info');
        infoRow.children().remove();
        for (let i = 0; i < indices.length; i++) {
          infoRow.append($('<td>&nbsp;</td>').css('font-size','14px'));
        }
      }
    };
    const toggle = dialogUtil.defineDialog($('#histogram'), updateTable, toggleAnalysis, {
      enableZoom: true, zoomXOnly: true, zoomInitX: 0,
      getBaseSize: function() { return { w: figW / 2, h: figH / 2 }; }
    });
    view.addCacheProperty('histogramData');
    view.addCacheProperty('histogram');
    return {
      processClick,
      toggle
    };
  };
  // Waveform
  const WaveformDialog = function() {
    const figH = 256 + 18;
    const repaint = function() {
      taskQueue.discardTasksOfCommand('calcWaveform');
      for (const img of view.getImages()) {
        img.waveform = null;
      }
      updateTable();
    };
    const waveformType = makeModeSwitch('#waveformType', 0, function(type) {
      repaint();
      updateAuxOption();
    });
    const waveformAuxType = makeModeSwitch('#waveformAuxType', 0, repaint);
    const waveformColumnLayout = makeToggleSwitch('#waveformColumnLayout', true, repaint);
    const waveformAuxType2 = makeModeSwitch('#waveformAuxType2', 0, repaint);
    const updateAuxOption = function() {
      if (waveformType.current() === 0) {
        $('#waveformColumnLayout').show();
        $('#waveformAuxType').show();
        $('#waveformAuxType2').hide();
      } else if (waveformType.current() === 1) {
        $('#waveformColumnLayout').hide();
        $('#waveformAuxType').hide();
        $('#waveformAuxType2').show();
      } else {
        $('#waveformColumnLayout').show();
        $('#waveformAuxType').hide();
        $('#waveformAuxType2').show();
      }
    };
    updateAuxOption();
    const makeFigure = function(type, w, h, histW, hist) {
      const histN = new Uint32Array(histW);
      for (let i = 0; i < w; ++i) {
        const x = Math.round((i + 0.5) / w * histW - 0.5);
        ++histN[x];
      }
      //
      const columnLayout = (type === 0 || type === 2) && waveformColumnLayout.current();
      const figW = columnLayout ? histW * 3 : histW;
      const fig = compareUtil.figureUtil.makeBlankFigure(figW, figH);
      const context = fig.context;
      const bits = context.createImageData(figW, 256);
      const s = -4 * figW;
      for (let i = 0, n = figW * 256 * 4; i < n; i += 4) {
        bits.data[i + 0] = 0;
        bits.data[i + 1] = 0;
        bits.data[i + 2] = 0;
        bits.data[i + 3] = 255;
      }
      for (let x = 0; x < histW; ++x) {
        const invMax = 1 / (histN[x] * h);
        let off0 = 4 * (255 * figW + x);
        const h0 = 256 * x;
        if (type === 0) { // RGB
          const h1 = h0 + 256 * histW;
          const h2 = h0 + 512 * histW;
          let off1 = (columnLayout ? off0 + 4 * histW : off0) + 1;
          let off2 = (columnLayout ? off0 + 8 * histW : off0) + 2;
          for (let y = 0; y < 256; ++y) {
            const cR = Math.round(255 * (1 - Math.pow(1 - hist[h0 + y] * invMax, 200.0)));
            const cG = Math.round(255 * (1 - Math.pow(1 - hist[h1 + y] * invMax, 200.0)));
            const cB = Math.round(255 * (1 - Math.pow(1 - hist[h2 + y] * invMax, 200.0)));
            bits.data[off0] = cR;
            bits.data[off1] = cG;
            bits.data[off2] = cB;
            off0 += s;
            off1 += s;
            off2 += s;
          }
        } else if (type === 1) { // Luminance
          for (let y = 0; y < 256; ++y) {
            const c = Math.round(255 * (1 - Math.pow(1 - hist[h0 + y] * invMax, 200.0)));
            bits.data[off0 + 0] = c;
            bits.data[off0 + 1] = c;
            bits.data[off0 + 2] = c;
            off0 += s;
          }
        } else { // YCbCr
          const h1 = h0 + 256 * histW;
          const h2 = h0 + 512 * histW;
          let off1 = (columnLayout ? off0 + 4 * histW : off0) + 1;
          let off2 = (columnLayout ? off0 + 8 * histW : off0) + 2;
          for (let y = 0; y < 256; ++y) {
            const my = 255 * (1 - Math.pow(1 - hist[h0 + y] * invMax, 200.0));
            const cb = 255 * (1 - Math.pow(1 - hist[h1 + y] * invMax, 200.0));
            const cr = 255 * (1 - Math.pow(1 - hist[h2 + y] * invMax, 200.0));
            if (columnLayout) {
              bits.data[off0] = Math.round(my);
              bits.data[off0 + 1] = Math.round(my);
              bits.data[off0 + 2] = Math.round(my);
              bits.data[off1 + 1] = Math.round(cb);
              bits.data[off2 - 2] = Math.round(cr);
            } else {
              bits.data[off0] = Math.round(compareUtil.clamp(cr + my * 0.85, 0, 255));
              bits.data[off1] = Math.round(my * 0.85);
              bits.data[off2] = Math.round(compareUtil.clamp(cb + my * 0.85, 0, 255));
            }
            off0 += s;
            off1 += s;
            off2 += s;
          }
        }
      }
      context.putImageData(bits, 0, 0);
      const drawGrid = function(x, w, color, alpha) {
        context.strokeStyle = color;
        context.globalAlpha = alpha;
        context.lineWidth = 0.5;
        context.beginPath();
        for (let k = 32; k < 255; k += 32) {
          context.moveTo(x, k + 0.5);
          context.lineTo(x + w, k + 0.5);
        }
        context.stroke();
        context.globalAlpha = 1.0;
      };
      if (type === 0) {
        drawGrid(0, figW, '#fff', 0.4);
      } else if (type === 1) {
        drawGrid(0, figW, '#f0f', 0.6);
      } else {
        if (columnLayout) {
          drawGrid(0, histW, '#f0f', 0.6);
          drawGrid(histW, 2*histW, '#0f0', 0.6);
        } else {
          drawGrid(0, figW, '#0f0', 0.6);
        }
      }
      context.fillStyle = '#222';
      context.fillRect(0,256,figW,figH - 256);
      let comp;
      if (type === 0) { // RGB
        if (columnLayout) {
          comp = [ '#f22', 0, 'R', '#2f2', 100, 'G', '#22f', 200, 'B' ];
        } else {
          comp = [ '#f22', 0, 'R', '#2f2', 18, 'G', '#22f', 36, 'B' ];
        }
      } else if (type === 1) { // Luminance
        comp = [ '#fff', 0, 'Y' ];
      } else { // YCbCr
        if (columnLayout) {
          comp = [ '#ddd', 0, 'Y', '#44f', 100, 'Cb', '#f44', 200, 'Cr' ];
        } else {
          comp = [ '#ddd', 0, 'Y', '#44f', 16, 'Cb', '#f44', 44, 'Cr' ];
        }
      }
      const drawAxesLabels = function(context, comp) {
        context.font = '16px sans-serif';
        context.scale(figW / 300, 1);
        context.textAlign = 'left';
        for (let i = 0; i < comp.length; i += 3) {
          context.fillStyle = comp[i];
          context.fillText(comp[i + 2], comp[i + 1], figH - 2);
        }
      };
      drawAxesLabels(context, comp);
      return fig.canvas;
    };
    const updateFigure = function(type, auxTypes, img, histW, hist) {
      if (type === waveformType.current() &&
          auxTypes[0] === waveformAuxType.current() &&
          auxTypes[1] === waveformAuxType2.current()) {
        const w = img.width;
        const h = img.height;
        img.waveform = makeFigure(type, w, h, histW, hist);
        updateTable();
      }
    };
    const updateAsync = function(img) {
      taskQueue.addTaskWithImageData({
        cmd:      'calcWaveform',
        type:     waveformType.current(),
        auxTypes: [waveformAuxType.current(), waveformAuxType2.current()],
        index:    [img.index],
        histW:    Math.min(img.width, 1024),
        transposed: img.transposed,
        flipped:  img.transposed ? img.flippedY : img.flippedX
      }, (data) => {
        updateFigure(data.type, data.auxTypes, img, data.histW, data.result);
      });
    };
    const updateTable = function(transformOnly) {
      const w = 320, h = figH, margin = 10;
      const styles = makeFigureStyles(w, h, margin, '#666', figureZoom);
      updateFigureTable('#waveTable', 'waveform', updateAsync, styles, transformOnly);
    };
    const toggle = dialogUtil.defineDialog($('#waveform'), updateTable, toggleAnalysis, {
      enableZoom: true, zoomXOnly: true, zoomInitX: 0,
      getBaseSize: function() { return { w: 320, h: figH }; }
    });
    view.addCacheProperty('waveform');
    return {
      toggle
    };
  };
  const makeDistributionImageData = function(context, w, h, dist, max, scale, mode) {
    const bits = context.createImageData(w, h);
    let i = 0, k = 0;
    if (mode === 0) { // RGB
      const offsetG = w * h;
      const offsetB = w * h * 2;
      for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x, i++, k += 4) {
          const aR = 1 - Math.pow(1 - dist[i] / max, 20000.0);
          const aG = 1 - Math.pow(1 - dist[i + offsetG] / max, 20000.0);
          const aB = 1 - Math.pow(1 - dist[i + offsetB] / max, 20000.0);
          const cR = Math.round(aR * scale);
          const cG = Math.round(aG * scale);
          const cB = Math.round(aB * scale);
          bits.data[k + 0] = cR;
          bits.data[k + 1] = cG;
          bits.data[k + 2] = cB;
          bits.data[k + 3] = 255;
        }
      }
    } else { // Luminance
      for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x, i++, k += 4) {
          const a = 1 - Math.pow(1 - dist[i] / max, 20000.0);
          const c = Math.round(a * scale);
          bits.data[k + 0] = c;
          bits.data[k + 1] = c;
          bits.data[k + 2] = c;
          bits.data[k + 3] = 255;
        }
      }
    }
    return bits;
  };
  const makeDistributionImageDataRGBA = function(context, w, h, dist, colorMap, max, scale) {
    const bits = context.createImageData(w, h);
    let i = 0, k = 0;
    const offsetG = w * h;
    const offsetB = w * h * 2;
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x, i++, k += 4) {
        const d = dist[i];
        const a = 1 - Math.pow(1 - d / max, 20000.0);
        const cA = Math.round(a * scale);
        const cScale = d === 0 ? scale : scale / (255 * d);
        const cR = Math.round(colorMap[i] * cScale);
        const cG = Math.round(colorMap[i + offsetG] * cScale);
        const cB = Math.round(colorMap[i + offsetB] * cScale);
        bits.data[k + 0] = cR;
        bits.data[k + 1] = cG;
        bits.data[k + 2] = cB;
        bits.data[k + 3] = cA;
      }
    }
    return bits;
  };
  // Vectorscope
  const VectorscopeDialog = function() {
    const repaint = function() {
      taskQueue.discardTasksOfCommand('calcVectorscope');
      for (const img of view.getImages()) {
        img.vectorscope = null;
      }
      updateTable();
    };
    const vectorscopeType = makeModeSwitch('#vectorscopeType', 0, function() {
      repaint();
      updateAuxOption();
    });
    const colorMode = makeToggleSwitch('#vectorscopeColor', false, repaint);
    const vectorscopeAuxType = makeModeSwitch('#vectorscopeAuxType', 0, repaint);
    const vectorscopeAuxType2 = makeModeSwitch('#vectorscopeAuxType2', 0, repaint);
    const updateAuxOption = function() {
      if (vectorscopeType.current() === 0) { // 0:Cb-Cr
        $('#vectorscopeAuxType').hide();
        $('#vectorscopeAuxType2').show();
      } else if (vectorscopeType.current() === 2 ||
          vectorscopeType.current() === 3 ||
          vectorscopeType.current() === 4) { // 2:G-B, 3:G-R, 4:B-R
        $('#vectorscopeAuxType').show();
        $('#vectorscopeAuxType2').hide();
      } else {
        $('#vectorscopeAuxType').hide();
        $('#vectorscopeAuxType2').hide();
      }
    };
    updateAuxOption();
    const makeFigure = function(type, auxType2, color, fig, w, h, result) {
      const context = fig.context;
      let bits;
      if (color) { // with color
        bits = makeDistributionImageDataRGBA(context, 320, 320, result.dist, result.colorMap, w * h, 255);
      } else {
        bits = makeDistributionImageData(context, 320, 320, result.dist, w * h, 255, 1);
      }
      context.putImageData(bits, 0, 0);
      const srgbToLinear = function(c) {
        return c < 0.040450 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      const mat = auxType2 === 0 ?
            compareUtil.colorMatrixBT601 :  // 0: bt601
            compareUtil.colorMatrixBT709;   // 1: bt709
      const calcxy = function(r, g, b) {
        if (type === 0) { // Cb-Cr
          const cb = mat[1][0] * r + mat[1][1] * g + mat[1][2] * b;
          const cr = mat[2][0] * r + mat[2][1] * g + mat[2][2] * b;
          return { x: 159.5 + cb, y: 159.5 - cr };
        } else if (type === 1) { // x-y
          r = srgbToLinear(r / 255);
          g = srgbToLinear(g / 255);
          b = srgbToLinear(b / 255);
          const x = 0.412391 * r + 0.357584 * g + 0.180481 * b;
          const y = 0.212639 * r + 0.715169 * g + 0.072192 * b;
          const z = 0.019331 * r + 0.119195 * g + 0.950532 * b;
          const xyz = x + y + z;
          return {
            x: 32 + (xyz === 0 ? 0 : x / xyz * 255 * 1.5),
            y: 287 - (xyz === 0 ? 0 : y / xyz * 255 * 1.5)
          };
        } else if (type === 2) { // G-B
          return { x: 32 + g, y: 287 - b };
        } else if (type === 3) { // G-R
          return { x: 32 + g, y: 287 - r };
        } else { // B-R
          return { x: 32 + b, y: 287 - r };
        }
      };
      const points = [
        { pos: calcxy(0,   0,   0  ) , color: '',     types: []        },
        { pos: calcxy(255, 0,   0  ) , color: color ? '#800' : '#f00', types: [0,1,3,4]   },
        { pos: calcxy(0,   255, 0  ) , color: color ? '#080' : '#0f0', types: [0,1,2,3]   },
        { pos: calcxy(0,   0,   255) , color: color ? '#008' : '#00f', types: [0,1,2,4]   },
        { pos: calcxy(0,   255, 255) , color: color ? '#088' : '#0ff', types: [0,2]   },
        { pos: calcxy(255, 0,   255) , color: color ? '#808' : '#f0f', types: [0,4]   },
        { pos: calcxy(255, 255, 0  ) , color: color ? '#880' : '#ff0', types: [0,3]   },
        { pos: calcxy(255, 255, 255) , color: '',     types: []      },
        { pos: { x: 32,    y: 32    } , color: '',     types: [] },
        { pos: { x: 32,    y: 287   } , color: '',     types: [] },
        { pos: { x: 287,   y: 287   } , color: '',     types: [] },
        { pos: { x: 287,   y: 32    } , color: '',     types: [] },
        { pos: { x: 96,    y: 32    } , color: '',     types: [] },
        { pos: { x: 96,    y: 287   } , color: '',     types: [] },
        { pos: { x: 32,    y: 96    } , color: '',     types: [] },
        { pos: { x: 287,   y: 96    } , color: '',     types: [] },
        { pos: { x: 223,   y: 32    } , color: '',     types: [] },
        { pos: { x: 223,   y: 287   } , color: '',     types: [] },
        { pos: { x: 32,    y: 223   } , color: '',     types: [] },
        { pos: { x: 287,   y: 223   } , color: '',     types: [] },
        { pos: { x: 159.5, y: 32    } , color: '',     types: [] },
        { pos: { x: 159.5, y: 287   } , color: '',     types: [] },
        { pos: { x: 32,    y: 159.5 } , color: '',     types: [] },
        { pos: { x: 287,   y: 159.5 } , color: '',     types: [] },
        { pos: { x: 32,    y: -96   } , color: '',     types: [] },
        { pos: { x: 416,   y: 287   } , color: '',     types: [] }
      ];
      const mainAxesColor = '#06c';
      const auxAxesColor = color ? '#555' : '#024';
      const lines = [
        { indices: [20, 21, 22, 23], color: mainAxesColor, types: [0] },
        { indices: [0, 1, 0, 2, 0, 3], color: auxAxesColor, types: [0] },
        { indices: [0, 1, 0, 2, 0, 3], color: mainAxesColor, types: [2,3,4] },
        { indices: [12, 13, 14, 15, 16, 17, 18, 19], color: auxAxesColor, types: [0,2,3,4] },
        { indices: [20, 21, 22, 23], color: auxAxesColor, types: [2,3,4] },
        { indices: [0, 4, 0, 5, 0, 6], color: auxAxesColor, types: [0] },
        { indices: [1, 6, 6, 2, 2, 4, 4, 3, 3, 5, 5, 1], color: auxAxesColor, types: [0] },
        { indices: [4, 7, 5, 7, 6, 7], color: auxAxesColor, types: [2,3,4] },
        { indices: [1, 2, 2, 3, 3, 1], color: auxAxesColor, types: [1] },
        { indices: [24, 9, 9, 25], color: mainAxesColor, types: [1] },
        { indices: [24, 25], color: auxAxesColor, types: [1] },
        { indices: [8, 9, 9, 10, 10, 11, 11, 8], color: auxAxesColor, types: [0] }
      ];
      const labels = [
        { pos: { x: 320, y: 160 }, align: ['right', 'top'], color: '#08f', label: 'Cb', types: [0] },
        { pos: { x: 160, y: 0   }, align: ['left',  'top'], color: '#08f', label: 'Cr', types: [0] },
        { pos: calcxy(255, 0, 0), align: ['left',  'bottom'], color: '#f00', label: 'R', types: [3,4] },
        { pos: calcxy(0, 255, 0), align: ['left',  'bottom'], color: '#0f0', label: 'G', types: [2,3] },
        { pos: calcxy(0, 0, 255), align: ['left',  'bottom'], color: '#00f', label: 'B', types: [2,4] },
        { pos: { x: 32,  y: 32  }, align: ['right', 'bottom'], color: '#08f', label: 'y', types: [1] },
        { pos: { x: 288, y: 288 }, align: ['left',  'top'], color: '#08f', label: 'x', types: [1] }
      ];
      context.globalCompositeOperation = color ? 'destination-over' : 'lighter';
      context.lineWidth = 2;
      for (let i = 0, p; p = points[i]; ++i) {
        if (0 > p.types.indexOf(type)) {
          continue;
        }
        context.strokeStyle = p.color;
        context.beginPath();
        context.arc(p.pos.x + 0.5, p.pos.y + 0.5, 4, 0, 2 * Math.PI);
        context.stroke();
      }
      context.lineWidth = 1;
      for (let i = 0, l; l = lines[i]; ++i) {
        if (0 > l.types.indexOf(type)) {
          continue;
        }
        context.strokeStyle = l.color;
        context.beginPath();
        for (let k = 0; k < l.indices.length; k += 2) {
          const v0 = points[l.indices[k]];
          const v1 = points[l.indices[k + 1]];
          context.moveTo(v0.pos.x + 0.5, v0.pos.y + 0.5);
          context.lineTo(v1.pos.x + 0.5, v1.pos.y + 0.5);
        }
        context.stroke();
      }
      context.font = '16px sans-serif';
      for (let i = 0, l; l = labels[i]; ++i) {
        if (0 > l.types.indexOf(type)) {
          continue;
        }
        context.textAlign = l.align[0];
        context.textBaseline = l.align[1];
        context.fillStyle = l.color;
        context.fillText(l.label, l.pos.x, l.pos.y);
      }
      return fig.canvas;
    };
    const updateFigure = function(type, color, auxTypes, img, result) {
      if (type !== vectorscopeType.current() || color !== colorMode.current() ||
          auxTypes[0] !== vectorscopeAuxType.current() ||
          auxTypes[1] !== vectorscopeAuxType2.current()) {
        return;
      }
      const w = img.canvasWidth;
      const h = img.canvasHeight;
      const fig = compareUtil.figureUtil.makeBlankFigure(320, 320);
      const notify = function() {
        img.vectorscope = fig.canvas;
        updateTable();
      };
      if (type === 1) { // x-y
        const bg = new Image;
        bg.onload = function() {
          makeFigure(type, auxTypes[1], color, fig, w, h, result);
          fig.context.globalAlpha = color ? 0.7 : 0.3;
          fig.context.globalCompositeOperation = color ? 'destination-over' : 'lighter';
          fig.context.drawImage(bg, -16, -144, 480, 480);
          notify();
        };
        bg.src = color ? 'res/xy-chromaticity-diagram-gray.png' : 'res/xy-chromaticity-diagram.png';
      } else {
        makeFigure(type, auxTypes[1], color, fig, w, h, result);
        notify();
      }
    };
    const updateAsync = function(img) {
      taskQueue.addTaskWithImageData({
        cmd:      'calcVectorscope',
        type:     vectorscopeType.current(),
        color:    colorMode.current(),
        auxTypes: [vectorscopeAuxType.current(), vectorscopeAuxType2.current()],
        index:    [img.index]
      }, (data) => {
        updateFigure(data.type, data.color, data.auxTypes, img, data.result);
      });
    };
    const updateTable = function(transformOnly) {
      const w = 320, h = 320, margin = 10;
      const styles = makeFigureStyles(w, h, margin, '#444', figureZoom);
      updateFigureTable('#vectorscopeTable', 'vectorscope', updateAsync, styles, transformOnly);
    };
    const toggle = dialogUtil.defineDialog($('#vectorscope'), updateTable, toggleAnalysis, {
      enableZoom: true, getBaseSize: function() { return { w: 320, h: 320 }; }
    });
    const processKeyDown = function(e) {
      if (e.keyCode === 81/* q */) {
        colorMode.set(!colorMode.current());
        return false;
      }
    };
    view.addCacheProperty('vectorscope');
    return {
      toggle,
      processKeyDown
    };
  };
  const makeAxesDesc = function(v, lines) {
    return lines.map(function(a) {
      return (
        'M' + v[a[0]].join(',') +
        a.slice(1).map(function(i) { return 'L' + v[i].join(','); }).join('')
      );
    }).join('');
  };
  const makeAxesSVG = function(vbox, labels, axesDesc, grayAxesDesc) {
    const labelsSVG = labels.map(function(label) {
      return '<text>' + label.text + '</text>';
    }).join('');
    return $(
    '<svg viewBox="' + vbox + '">' +
      '<g fill="none">' +
        (grayAxesDesc !== undefined ?
          '<path stroke-width="0.2" stroke="gray" d="' + grayAxesDesc + '"></path>' : '') +
        '<path stroke-width="0.3" stroke="white" d="' + axesDesc + '"></path>' +
      '</g>' +
      '<g class="labels" font-size="12" text-anchor="middle" dominant-baseline="middle">' + labelsSVG + '</g>' +
    '</svg>');
  };
  const updateAxesLabels = function(svg, labels, rotation) {
    $(svg).find('g.labels text').each(function(i) {
      const label = labels[i];
      const xy = rotation.pos3DTo2D(label.pos[0], label.pos[1], label.pos[2]);
      $(this).attr({
        fill : label.hidden ? 'transparent' : label.color,
        x : xy[0],
        y : xy[1]
      });
    });
  };
  // 3D Color Distribution
  const ColorDistDialog = function() {
    const colorDistType = makeModeSwitch('#colorDistType', 0, function(type) {
      invalidateAssets();
      updateFigure();
      updateAuxOption();
    });
    const colorMode = makeToggleSwitch('#colorDistColor', true, function() {
      invalidateAssets();
      updateFigure();
    });
    const colorDistAuxType = makeModeSwitch('#colorDistAuxType', 0, function(type) {
      invalidateAssets();
      updateFigure();
    });
    const colorDistAuxType2 = makeModeSwitch('#colorDistAuxType2', 0, function(type) {
      invalidateAssets();
      updateFigure();
    });
    const TYPE_RGB = 0;
    const TYPE_HSV = 1;
    const TYPE_HSL = 2;
    const TYPE_YCbCr = 3;
    const TYPE_CIExyY = 4;
    const updateAuxOption = function() {
      const currentType = colorDistType.current();
      if (currentType === TYPE_RGB ||
          currentType === TYPE_HSV ||
          currentType === TYPE_HSL) {
        $('#colorDistAuxType').show();
        $('#colorDistAuxType2').hide();
      } else if (currentType === TYPE_YCbCr) {
        $('#colorDistAuxType').hide();
        $('#colorDistAuxType2').show();
      } else {
        $('#colorDistAuxType').hide();
        $('#colorDistAuxType2').hide();
      }
    };
    updateAuxOption();
    const updateAsync = function(img) {
      taskQueue.addTaskWithImageData({
        cmd:      'calcColorTable',
        index:    [img.index]
      }, (data) => {
        img.colorTable = data.result;
        updateFigure(img);
      });
    };
    const rotationController = compareUtil.makeRotationController(
      function() { redrawFigureAll(); },
      function() { updateTable(/* transformOnly = */ true); },
      { x: 20, y: -60 }
    );
    const vertices3DCube = compareUtil.vertexUtil.makeCube(256, 256, 256);
    const cubeFaces = compareUtil.vertexUtil.cubeFaces;
    const verticesCylinder = compareUtil.vertexUtil.make3DCylinder(128, 256);
    const makeVertices3DYCbCr = function(mat) {
      const p3d = function(r, g, b, z) {
        return [
          mat[1][0] * (r - 128) + mat[1][1] * (g - 128) + mat[1][2] * (b - 128),
          mat[2][0] * (r - 128) + mat[2][1] * (g - 128) + mat[2][2] * (b - 128),
          z - 128
        ];
      };
      return vertices3DCube.concat([
        p3d(256, 0, 0, 0),  // lower hexagon
        p3d(0, 256, 0, 0),
        p3d(0, 0, 256, 0),
        p3d(256, 256, 0, 0),
        p3d(0, 256, 256, 0),
        p3d(256, 0, 256, 0),
        p3d(256, 0, 0, 256),  // upper hexagon
        p3d(0, 256, 0, 256),
        p3d(0, 0, 256, 256),
        p3d(256, 256, 0, 256),
        p3d(0, 256, 256, 256),
        p3d(256, 0, 256, 256)
      ]);
    };
    const vertices3DYCbCr601 = makeVertices3DYCbCr(compareUtil.colorMatrixBT601);
    const vertices3DYCbCr709 = makeVertices3DYCbCr(compareUtil.colorMatrixBT709);
    const facesYCbCr = cubeFaces.concat([
      [18, 23, 20, 22, 19, 21, 18], // lower hexagon
      [24, 27, 25, 28, 26, 29, 24] // upper hexagon
    ]);
    const darkLinesYCbCr = [
      [2, 14], [6, 10], [8, 9], [3, 15], [7, 11],
      [18, 24], [21, 27], [19, 25], [22, 28], [20, 26], [23, 29]
    ];
    const vertices3DCIEXyy = vertices3DCube.concat([
      [244.8 - 128, 126.2 - 128, -128], // lower chromaticity points
      [114.8 - 128, 229.5 - 128, -128],
      [57.4 - 128, 23 - 128, -128],
      [244.8 - 128, 126.2 - 128, 128],  // upper
      [114.8 - 128, 229.5 - 128, 128],
      [57.4 - 128, 23 - 128, 128]
    ]);
    const facesCIEXyy = cubeFaces.concat([
      [18, 20, 19, 18], [21, 22, 23, 21]
    ]);
    const darkLinesCIEXyy = [
      [10, 14], [11, 15], // diagonal
      [18, 21], [19, 22], [20, 23]
    ];
    let assets = null;
    const invalidateAssets = function() {
      assets = null;
    };
    const updateAssets = function() {
      if (assets === null) {
        const currentType = colorDistType.current();
        assets = {};
        if (currentType === TYPE_RGB) {
          assets.vertices3D = vertices3DCube;
          assets.makeFaces = function() { return cubeFaces; };
          assets.darkLines = [];
          assets.makeAdditionalWhiteLines = function() { return []; };
        } else if (currentType === TYPE_HSV || currentType === TYPE_HSL) {
          assets.vertices3D = verticesCylinder;
          assets.makeFaces = compareUtil.vertexUtil.makeCylinderFaces;
          assets.darkLines = compareUtil.vertexUtil.cylinderDarkLines;
          assets.makeAdditionalWhiteLines = compareUtil.vertexUtil.makeCylinderContour;
        } else if (currentType === TYPE_YCbCr) {
          assets.vertices3D = colorDistAuxType2.current() === 0 ? vertices3DYCbCr601 : vertices3DYCbCr709;
          assets.makeFaces = function() { return facesYCbCr; };
          assets.darkLines = darkLinesYCbCr;
          assets.makeAdditionalWhiteLines = function() { return []; };
        } else { // TYPE_CIExyY
          assets.vertices3D = vertices3DCIEXyy;
          assets.makeFaces = function() { return facesCIEXyy; };
          assets.darkLines = darkLinesCIEXyy;
          assets.makeAdditionalWhiteLines = function() { return []; };
        }
        if (currentType === TYPE_RGB) {
          assets.labels = [
            { pos: [-140, -140, -140], text: 'O', color: '#888', hidden: false },
            { pos: [140, -140, -140], text: 'R', color: '#f00', hidden: false },
            { pos: [-140, 140, -140], text: 'G', color: '#0f0', hidden: false },
            { pos: [-140, -140, 140], text: 'B', color: '#00f', hidden: false }
          ];
          assets.updateLabelsVisibility = function(labels, rotation) {
            labels[0].hidden = (rotation.xr < 0 && 0 < rotation.yr && 0 < rotation.xg);
            labels[1].hidden = (rotation.xr < 0 && rotation.yr < 0 && rotation.xg < 0);
            labels[2].hidden = (0 < rotation.xg && rotation.yg < 0 && 0 < rotation.yr);
            labels[3].hidden = (rotation.xr < 0 && rotation.yr < 0 && 0 < rotation.xg);
          };
        } else if (currentType === TYPE_HSV || currentType === TYPE_HSL) {
          assets.labels = [
            { pos: [0, 0, 140], text: (currentType === TYPE_HSV ? 'V' : 'L'), color: '#ccc', hidden: false },
            { pos: [0, 0, -140], text: 'O', color: '#888', hidden: false },
            { pos: [160, 0, -140], text: 'S H=0', color: '#f00', hidden: false },
            { pos: [-80, 140, -140], text: 'H=120', color: '#0f0', hidden: false },
            { pos: [-80, -140, -140], text: 'H=240', color: '#00f', hidden: false }
          ];
          assets.updateLabelsVisibility = function(labels, rotation) {
            const xr = rotation.xr, yr = rotation.yr, xg = rotation.xg, yg = rotation.yg, yb = rotation.yb;
            labels[2].hidden = (xg < 0 && yb * 2 < yr && yr < -2 * Math.abs(yg));
            labels[3].hidden = (-xr*1.73-xg < 0 && yb * 4 < yg*1.73-yr && yg*1.73-yr < -4 * Math.abs(-yr*1.73-yg));
            labels[4].hidden = (-xr*1.73+xg > 0 && yb * 4 < yg*-1.73-yr && yg*-1.73-yr < -4 * Math.abs(-yr*1.73+yg));
          };
        } else if (currentType === TYPE_YCbCr) {
          assets.labels = [
            { pos: [0, 0, 140], text: 'Y', color: '#ccc', hidden: false },
            { pos: [0, 0, -140], text: 'O', color: '#888', hidden: false },
            { pos: [140, 0, -140], text: 'Cb', color: '#08f', hidden: false },
            { pos: [0, 140, -140], text: 'Cr', color: '#08f', hidden: false }
          ];
          assets.updateLabelsVisibility = function(labels, rotation) {
            const xr = rotation.xr, yr = rotation.yr, xg = rotation.xg, yg = rotation.yg, yb = rotation.yb;
            labels[2].hidden = (xg < 0 && yb * 2 < yr && yr < -2 * Math.abs(yg));
            labels[3].hidden = (0 < xr && yb * 2 < yg && yg < -2 * Math.abs(yr));
          };
        } else if (currentType === TYPE_CIExyY) {
          assets.labels = [
            { pos: [-140, -140, -140], text: 'O', color: '#888', hidden: false },
            { pos: [140, -140, -140], text: 'x', color: '#08f', hidden: false },
            { pos: [-140, 140, -140], text: 'y', color: '#08f', hidden: false },
            { pos: [-140, -140, 140], text: 'Y', color: '#ccc', hidden: false }
          ];
          assets.updateLabelsVisibility = function(labels, rotation) {
            labels[0].hidden = (rotation.xr < 0 && 0 < rotation.yr && 0 < rotation.xg);
          };
        }
      }
    };
    const makeFigure = function(fig, colorTable) {
      const context = fig.context;
      const distMax = colorTable.totalCount;
      const dist = new Uint32Array(320 * 320);
      let colorMap = null;
      if (colorMode.current() === true) { // RGB with Color
        colorMap = new Float32Array(320 * 320 * 3);
      }
      let colors = colorTable.colors;
      const counts = colorTable.counts;
      const rotation = compareUtil.makeRotationCoefs(rotationController.orientation);
      const rgbColors = colors;
      let convertOption = null;
      const currentType = colorDistType.current();
      if (currentType === TYPE_RGB) {
        convertOption = colorDistAuxType.current() === 0 ?
            null :
            ['linearColors', compareUtil.convertColorListRgbToLinear];
      } else if (currentType === TYPE_HSV) {
        convertOption = colorDistAuxType.current() === 0 ?
            ['hsvColors', compareUtil.convertColorListRgbToHsv] :
            ['hsvLinearColors', compareUtil.convertColorListRgbToHsvLinear];
      } else if (currentType === TYPE_HSL) {
        convertOption = colorDistAuxType.current() === 0 ?
            ['hslColors', compareUtil.convertColorListRgbToHsl] :
            ['hslLinearColors', compareUtil.convertColorListRgbToHslLinear];
      } else if (currentType === TYPE_CIExyY) {
        convertOption = ['xyyColors', compareUtil.convertColorListRgbToXyy];
      }
      if (convertOption) {
        if (!colorTable[convertOption[0]]) {
          colorTable[convertOption[0]] = convertOption[1](colors);
        }
        colors = colorTable[convertOption[0]];
      }
      let coef_r, coef_g, coef_b;
      if (currentType === TYPE_RGB ||
          currentType === TYPE_HSV ||
          currentType === TYPE_HSL ||
          currentType === TYPE_CIExyY) {
        coef_r = rotation.vec3DTo2D(1, 0, 0);
        coef_g = rotation.vec3DTo2D(0, 1, 0);
        coef_b = rotation.vec3DTo2D(0, 0, 1);
      } else { // TYPE_YCbCr
        const mat = colorDistAuxType2.current() === 0 ?
            compareUtil.colorMatrixBT601 :
            compareUtil.colorMatrixBT709;
        coef_r = rotation.vec3DTo2D(mat[1][0], mat[2][0], mat[0][0]);
        coef_g = rotation.vec3DTo2D(mat[1][1], mat[2][1], mat[0][1]);
        coef_b = rotation.vec3DTo2D(mat[1][2], mat[2][2], mat[0][2]);
      }
      const coef_xr = coef_r[0], coef_yr = coef_r[1];
      const coef_xg = coef_g[0], coef_yg = coef_g[1];
      const coef_xb = coef_b[0], coef_yb = coef_b[1];
      const org_x = 160 - 127.5 * (coef_xr + coef_xg + coef_xb);
      const org_y = 160 - 127.5 * (coef_yr + coef_yg + coef_yb);
      const colorToOffset = function(r, g, b) {
        const plotx = Math.floor(org_x + coef_xr * r + coef_xg * g + coef_xb * b);
        const ploty = Math.floor(org_y + coef_yr * r + coef_yg * g + coef_yb * b);
        const offset = ploty * 320 + plotx;
        return offset;
      };
      for (let k = 0, n = colors.length; k < n; k += 1) {
        let rgb = colors[k];
        let r = rgb >> 16;
        let g = (rgb >> 8) & 255;
        let b = rgb & 255;
        const offset = colorToOffset(r, g, b);
        const count = counts[k];
        dist[offset] += count;
        if (colorMap) { // RGB with Color
          if (rgbColors !== colors) {
            rgb = rgbColors[k];
            r = rgb >> 16;
            g = (rgb >> 8) & 255;
            b = rgb & 255;
          }
          colorMap[offset] += count * r;
          colorMap[offset + 102400] += count * g;
          colorMap[offset + 204800] += count * b;
        }
      }
      let bits;
      if (colorMap) { // RGB with Color
        bits = makeDistributionImageDataRGBA(context, 320, 320, dist, colorMap, distMax, 255);
      } else { // RGB without Color
        bits = makeDistributionImageData(context, 320, 320, dist, distMax, 255, 1);
      }
      context.putImageData(bits, 0, 0);
      const vbox = '0 0 320 320';
      updateAssets();
      const v = rotation.vertices3DTo2D(assets.vertices3D);
      const faces = assets.makeFaces(rotation);
      const lines = compareUtil.rotationUtil.splitIntoFrontAndBackFaces(v, faces);
      const darkLines = lines.backFaces.concat(assets.darkLines);
      const whiteLines = lines.frontFaces.concat(assets.makeAdditionalWhiteLines(rotation));
      const axesDesc = makeAxesDesc(v, whiteLines);
      const grayAxesDesc = makeAxesDesc(v, darkLines);
      assets.updateLabelsVisibility(assets.labels, rotation);
      if (!fig.axes) {
        fig.axes = makeAxesSVG(vbox, assets.labels, axesDesc, grayAxesDesc);
      } else {
        $(fig.axes).find('g path[stroke=white]').attr('d', axesDesc);
        $(fig.axes).find('g path[stroke=gray]').attr('d', grayAxesDesc);
      }
      updateAxesLabels(fig.axes, assets.labels, rotation);
    };
    const redrawFigureAll = function() {
      for (const img of view.getImages()) {
        if (img.colorTable) {
          const fig = {
            canvas : img.colorDist,
            context : img.colorDist.getContext('2d'),
            axes : img.colorDistAxes
          };
          makeFigure(fig, img.colorTable);
        }
      }
    };
    const createFigure = function(img) {
      const fig = compareUtil.figureUtil.makeBlankFigure(320, 320);
      if (img.colorTable) {
        makeFigure(fig, img.colorTable);
      }
      img.colorDist = fig.canvas;
      img.colorDistAxes = fig.axes;
    };
    const updateFigure = function(img) {
      if (img === undefined) {
        for (const img of view.getImages()) {
          createFigure(img);
        }
      } else {
        createFigure(img);
      }
      updateTable();
    };
    const updateTable = function(transformOnly) {
      const w = 320, h = 320, margin = 10;
      const styles = makeFigureStyles(w, h, margin, '#444');
      const scale = rotationController.getScale();
      styles.style.transform += ' scale(' + scale + ')';
      updateFigureTable('#colorDistTable', 'colorDist', updateAsync, styles, transformOnly);
    };
    const toggle = dialogUtil.defineDialog($('#colorDist'), updateTable, toggleAnalysis, {
      onOpen: rotationController.resetZoom
    });
    const rotationInputFilter = compareUtil.makeRotationInputFilter(rotationController);
    rotationInputFilter.setDragStateCallback(function(dragging, horizontal) {
      setDragStateClass('#colorDist', dragging, horizontal);
    });
    const processKeyDown = function(e) {
      if (e.keyCode === 81/* q */) {
        colorMode.set(!colorMode.current());
        return false;
      }
      return rotationInputFilter.processKeyDown(e);
    };
    view.addCacheProperty('colorTable');
    view.addCacheProperty('colorDist');
    view.addCacheProperty('colorDistAxes');
    return {
      toggle,
      processKeyDown,
      enableMouseAndTouch: rotationInputFilter.enableMouseAndTouch
    };
  };
  // 3D Waveform
  const Waveform3DDialog = function() {
    const waveform3DType = makeModeSwitch('#waveform3DType', 0, function(type) {
      updateFigure();
      updateAuxOption();
    });
    const waveform3DAuxType = makeModeSwitch('#waveform3DAuxType', 0, function(type) {
      updateFigure();
    });
    const waveform3DAuxType2 = makeModeSwitch('#waveform3DAuxType2', 0, function(type) {
      updateFigure();
    });
    const updateAuxOption = function() {
      if (waveform3DType.current() === 1 ||
          waveform3DType.current() === 2 ||
          waveform3DType.current() === 3) { // R,G,B
        $('#waveform3DAuxType').show();
        $('#waveform3DAuxType2').hide();
      } else {
        $('#waveform3DAuxType').hide();
        $('#waveform3DAuxType2').show();
      }
    };
    updateAuxOption();
    const updateAsync = function(img) {
      taskQueue.addTaskWithImageData({
        cmd:      'calc3DWaveform',
        baseSize: 512,
        index:    [img.index]
      }, (data) => {
        img.waveform3D = data.result;
        updateFigure(img);
      });
    };
    const rotationController = compareUtil.makeRotationController(
      function() { redrawFigureAll(); },
      function() { updateTable(/* transformOnly = */ true); },
      { x: 20, y: -110 }
    );
    const makeColorGradientStops = function(type) {
      const color2 =
          type === 0 ? '#fff' :
          (type === 1 || type === 4) ? '#f00' :
          (type === 2 || type === 5) ? '#0f0' :
          '#00f';
      const colorStops = [[0, '#000']];
      if (type <= 3) {
        colorStops.push([1, color2]);
      } else {
        const prefix = type === 4 ? '#' : type === 5 ? '#0' : '#00';
        const suffix = type === 4 ? '00' : type === 5 ? '0' : '';
        for (let i = 1; i < 16; i++) {
          const c = compareUtil.srgb255ToLinear255[i * 0x11] / 255;
          colorStops.push([c, prefix + i.toString(16) + suffix]);
        }
      }
      return colorStops;
    };
    const colorStopsForType = (function(){
      const colorStopsForType = [];
      for (let type = 0; type < 7; type++) {
        colorStopsForType.push(makeColorGradientStops(type));
      }
      return colorStopsForType;
    })();
    const drawVerticalColorBar = function(ctx, v, colorStops) {
      const bar = (function() {
        let x = 320/2, y0, y1;
        for (let i = 0, corners = [0, 4, 12, 16]; i < 4; i++) {
          const k = corners[i];
          if (x > v[k][0]) {
            x = v[k][0];
            y0 = v[k + 1][1];
            y1 = v[k][1];
          }
        }
        return [x - 12, y0, x - 1, y1];
      })();
      ctx.fillStyle = compareUtil.figureUtil.makeLinearGradient(
        ctx, bar[0], bar[3], bar[0], bar[1], colorStops
      );
      ctx.fillRect(bar[0], bar[1], bar[2] - bar[0], bar[3] - bar[1]);
    };
    const makeWaveformY = function(n, waveform, mat) {
      const m0 = mat[0][0], m1 = mat[0][1], m2 = mat[0][2];
      const waveformY = new Uint8Array(n);
      for (let k = 0; k < n; k++) {
        const r = waveform[k * 3];
        const g = waveform[k * 3 + 1];
        const b = waveform[k * 3 + 2];
        waveformY[k] = Math.round(m0 * r + m1 * g + m2 * b);
      }
      return waveformY;
    };
    const makeFigure = function(fig, waveform3D) {
      let type = waveform3DType.current();
      if (waveform3DAuxType.current() === 1 && 1 <= type && type <= 3 ) {
        type += 3;
      }
      const context = fig.context;
      const w = waveform3D.width;
      const h = waveform3D.height;
      const waveform = waveform3D.waveform;
      let waveformY;
      if (type === 0) { // Y
        if (waveform3DAuxType2.current() === 0) { // 0:bt601
          if (waveform3D.Y601 === undefined) {
            waveform3D.Y601 = makeWaveformY(w * h, waveform, compareUtil.colorMatrixBT601);
          }
          waveformY = waveform3D.Y601;
        } else { // 1:bt709
          if (waveform3D.Y709 === undefined) {
            waveform3D.Y709 = makeWaveformY(w * h, waveform, compareUtil.colorMatrixBT709);
          }
          waveformY = waveform3D.Y709;
        }
      }
      const distMax = w * h * 1; // common for all type;
      const dist = new Uint32Array(320 * 320);
      const colorMap = new Float32Array(320 * 320 * 3);
      const vertices3DCube = compareUtil.vertexUtil.makeCube(h, w, 256);
      const scale = 256 / Math.max(w, h);
      const rotation = compareUtil.makeRotationCoefs(rotationController.orientation, scale, scale, 1);
      const xr = rotation.xr, yr = rotation.yr;
      const xg = rotation.xg, yg = rotation.yg;
      const yb = rotation.yb;
      const org = rotation.pos3DTo2D(-0.5 * (h - 1), -0.5 * (w - 1), -127.5);
      const toLinear = compareUtil.srgb255ToLinear8;
      let r, g, b;
      const getZValue =
          type === 0 ? function(k) { return waveformY[k]; } :
          type === 1 ? function() { return r; } :
          type === 2 ? function() { return g; } :
          type === 3 ? function() { return b; } :
          type === 4 ? function() { return toLinear[r]; } :
          type === 5 ? function() { return toLinear[g]; } :
          function() { return toLinear[b]; };
      for (let y = 0, k = 0; y < h; y += 1) {
        let plotx0 = org[0] + xr * y;
        let ploty0 = org[1] + yr * y;
        for (let x = 0; x < w; x += 1, k += 1) {
          r = waveform[k * 3];
          g = waveform[k * 3 + 1];
          b = waveform[k * 3 + 2];
          const c = getZValue(k);
          const plotx = Math.floor(plotx0);
          const ploty = Math.floor(ploty0 + yb * c);
          const offset = ploty * 320 + plotx;
          dist[offset] += 1;
          colorMap[offset] += r;
          colorMap[offset + 102400] += g;
          colorMap[offset + 204800] += b;
          plotx0 += xg;
          ploty0 += yg;
        }
      }
      const bits = makeDistributionImageDataRGBA(context, 320, 320, dist, colorMap, distMax, 255);
      context.putImageData(bits, 0, 0);
      const vbox = '0 0 320 320';
      const v = rotation.vertices3DTo2D(vertices3DCube);
      drawVerticalColorBar(context, v, colorStopsForType[type]);
      const lines = compareUtil.rotationUtil.splitIntoFrontAndBackFaces(v, compareUtil.vertexUtil.cubeFaces);
      const axesDesc = makeAxesDesc(v, lines.frontFaces);
      const grayAxesDesc = makeAxesDesc(v, lines.backFaces);
      const s = 12 / scale;
      const labels = [
          { pos: [-h/2-s, -w/2-s, -140], text: 'O', color: '#888', hidden: (xr < 0 && 0 < yr && 0 < xg) },
          { pos: [h/2+s, -w/2-s, -140], text: 'y', color: '#08f', hidden: (xr < 0 && yr < 0 && xg < 0) },
          { pos: [-h/2-s, w/2+s, -140], text: 'x', color: '#08f', hidden: (0 < xg && yg < 0 && 0 < yr) },
          { pos: [-h/2-s, -w/2-s, 140], text: 'Y', color: '#ccc', hidden: (xr < 0 && yr < 0 && 0 < xg) }
      ];
      if (type === 1 || type === 4) {
        labels[3].text = 'R';
        labels[3].color = '#f00';
      } else if (type === 2 || type === 5) {
        labels[3].text = 'G';
        labels[3].color = '#0f0';
      } else if (type === 3 || type === 6) {
        labels[3].text = 'B';
        labels[3].color = '#00f';
      }
      if (!fig.axes) {
        fig.axes = makeAxesSVG(vbox, labels, axesDesc, grayAxesDesc);
      } else {
        $(fig.axes).find('g path[stroke=white]').attr('d', axesDesc);
        $(fig.axes).find('g path[stroke=gray]').attr('d', grayAxesDesc);
      }
      updateAxesLabels(fig.axes, labels, rotation);
    };
    const redrawFigureAll = function() {
      for (const img of view.getImages()) {
        if (img.waveform3D) {
          const fig = {
            canvas : img.waveform3DFig,
            context : img.waveform3DFig.getContext('2d'),
            axes : img.waveform3DFigAxes
          };
          makeFigure(fig, img.waveform3D);
        }
      }
    };
    const createFigure = function(img) {
      const fig = compareUtil.figureUtil.makeBlankFigure(320, 320);
      if (img.waveform3D) {
        makeFigure(fig, img.waveform3D);
      }
      img.waveform3DFig = fig.canvas;
      img.waveform3DFigAxes = fig.axes;
    };
    const updateFigure = function(img) {
      if (img === undefined) {
        for (const img of view.getImages()) {
          createFigure(img);
        }
      } else {
        createFigure(img);
      }
      updateTable();
    };
    const updateTable = function(transformOnly) {
      const w = 320, h = 320, margin = 10;
      const styles = makeFigureStyles(w, h, margin, '#444');
      const scale = rotationController.getScale();
      styles.style.transform += ' scale(' + scale + ')';
      updateFigureTable('#waveform3DTable', 'waveform3DFig', updateAsync, styles, transformOnly);
    };
    const toggle = dialogUtil.defineDialog($('#waveform3D'), updateTable, toggleAnalysis, {
      onOpen: rotationController.resetZoom
    });
    const rotationInputFilter = compareUtil.makeRotationInputFilter(rotationController);
    rotationInputFilter.setDragStateCallback(function(dragging, horizontal) {
      setDragStateClass('#waveform3D', dragging, horizontal);
    });
    view.addCacheProperty('waveform3D');
    view.addCacheProperty('waveform3DFig');
    view.addCacheProperty('waveform3DFigAxes');
    return {
      toggle,
      processKeyDown: rotationInputFilter.processKeyDown,
      enableMouseAndTouch: rotationInputFilter.enableMouseAndTouch
    };
  };
  const ColorFreqDialog = function() {
    const drawFigure = function(reducedColorTable) {
      const colorList = reducedColorTable.colorList;
      const height = 480;
      const fig = compareUtil.figureUtil.makeBlankFigure(256, height);
      const context = fig.context;
      context.fillStyle = '#444';
      context.fillRect(0, 0, 256, height);
      const topCount = colorList[0][1];
      let numImportant = Math.min(24, colorList.length);
      const threshold = Math.max(1, reducedColorTable.totalCount / 100000);
      for (let k = 0; k < numImportant; k++) {
        if (colorList[k][1] <= threshold) {
          numImportant = k;
          break;
        }
      }
      if (numImportant + 1 === colorList.length) {
        numImportant = colorList.length;
      }
      const numEntries = numImportant < colorList.length ? numImportant + 1 : numImportant;
      context.font = '14px sans-serif';
      let others = null;
      if (numImportant < colorList.length) {
        others = [0, 0, 0, 0, 0];
        for (let k = numImportant; k < colorList.length; k++) {
          others[1] += colorList[k][1];
          others[2] += colorList[k][2];
          others[3] += colorList[k][3];
          others[4] += colorList[k][4];
        }
      }
      for (let k = 0; k < numEntries; k++) {
        const entry = (k === numImportant) ? others : colorList[k];
        const count = entry[1];
        const r = Math.round(entry[2] / count);
        const g = Math.round(entry[3] / count);
        const b = Math.round(entry[4] / count);
        const frequency = count / topCount;
        const rgb = compareUtil.toHexTriplet(r, g, b);
        const y0 = k / numEntries * height;
        const y1 = (k + 1) / numEntries * height;
        const ratio = count / reducedColorTable.totalCount;
        const label = entry === others ? 'Others' : rgb;
        context.fillStyle = rgb;
        context.fillRect(1, y0 + 1, 80 - 2, y1 - y0 - 2);
        context.fillStyle = '#aaa';
        context.fillRect(80, y0 + 1, (254 - 80) * frequency, y1 - y0 - 2);
        context.textAlign = 'left';
        context.fillStyle = (r * 2 + g * 5 + b > 8 * 128) ? '#000' : '#fff';
        context.fillText(label, 1, y1 - 4);
        context.textAlign = 'right';
        context.fillStyle = '#fff';
        context.fillText(compareUtil.toPercent(ratio), 256 - 4, y1 - 4);
      }
      return $(fig.canvas).width(256).height(380);
    };
    const updateAsync = function(img) {
      taskQueue.addTaskWithImageData({
        cmd:      'calcReducedColorTable',
        index:    [img.index]
      }, (data) => {
        img.reducedColorTable = data.result;
        updateFigure(img);
      });
    };
    const updateFigure = function(img) {
      updateTable();
    };
    const updateTable = function() {
      const target = $('#colorFreqTable');
      target.find('td').remove();
      for (const img of view.getImages()) {
        const label = view.makeImageNameWithNumber('<td>', img);
        target.find('tr').eq(0).append(label);
        const cell = $('<td>');
        target.find('tr').eq(1).append(cell);
        if (!img.reducedColorTable) {
          img.reducedColorTable = {};
          updateAsync(img);
          cell.text('calculating...');
          continue;
        }
        if (img.reducedColorTable.colorList === undefined) {
          cell.text('calculating...');
          continue;
        }
        const figure = drawFigure(img.reducedColorTable);
        cell.append(figure);
      }
      if (view.empty()) {
        target.find('tr').eq(0).append(
          $('<td>').text('no data')
        );
      }
    };
    const toggle = dialogUtil.defineDialog($('#colorFreq'), updateTable, toggleAnalysis);
    view.addCacheProperty('reducedColorTable');
    return {
      toggle
    };
  };
  // Image Quality Metrics
  const MetricsDialog = function() {
    const metricsMode = makeModeSwitch('#metricsMode', 0, function(type) {
      updateTable();
      updateAuxOption();
    });
    const metricsAuxType2 = makeModeSwitch('#metricsAuxType2', 0, function() {
      taskQueue.discardTasksOfCommand('calcMetrics');
      for (const img of view.getImages()) {
        img.metrics = [];
      }
      updateTable();
    });
    const updateAuxOption = function() {
      if (metricsMode.current() === 0) {
        $('#metricsAuxType2').hide();
      } else {
        $('#metricsAuxType2').show();
      }
    };
    updateAuxOption();
    const metricsToString = function(metrics, imgA) {
      if (typeof metrics === 'string' || metrics.en !== undefined) {
        return { psnr: metrics, rmse: metrics, mse: metrics, mae: metrics, ssd: metrics, sad: metrics, ncc: metrics, ae: metrics };
      }
      const m = metricsMode.current() === 0 ? metrics : metrics.y;
      return {
        psnr:
            isNaN(m.psnr) ? '‐' :
            m.psnr === Infinity ? '∞ dB' :
            compareUtil.hyphenToMinus(m.psnr.toFixed(2) + ' dB'),
        rmse:
            isNaN(m.mse) ? '‐' :
            Math.sqrt(m.mse).toPrecision(6),
        mse:
            isNaN(m.mse) ? '‐' :
            m.mse.toPrecision(6),
        mae:
            isNaN(m.mae) ? '‐' :
            m.mae.toPrecision(6),
        ssd:
            isNaN(m.ssd) ? '‐' :
            compareUtil.addComma(m.ssd),
        sad:
            isNaN(m.sad) ? '‐' :
            compareUtil.addComma(m.sad),
        ncc:
            isNaN(m.ncc) ? { en: '‐ (zero variance)', ja: '‐ (分散がゼロ)' } :
            compareUtil.hyphenToMinus(m.ncc.toFixed(6)),
        ae:
            isNaN(metrics.ae) ? '‐' :
            compareUtil.addComma(metrics.ae) +
                ' (' + compareUtil.toPercent(metrics.ae/imgA.width/imgA.height) + ')'
      };
    };
    const updateTable = function() {
      $('#metricsTable td:not(.prop)').remove();
      textUtil.setText($('#metricsModeLabel'),
        metricsMode.current() === 0 ? { en: 'RGB', ja: 'RGB' } : { en: 'Luminance', ja: '輝度' }
      );
      const rowCount = $('#metricsTable tr').length;
      if (view.empty()) {
        $('#metricsBaseName').append($('<td>').attr('rowspan', rowCount).text('no data'));
        return;
      }
      const images = view.getImages();
      if (images.length === 1) {
        $('#metricsTargetName').append($('<td>').attr('rowspan', rowCount - 1).text('no data'));
      }
      view.resetBaseAndTargetImage();
      $('#metricsBaseName').append(
        $('<td>').attr('colspan', images.length - 1).append(
          viewUtil.makeImageNameSelector(view.baseIndex(), function(index) {
            view.changeBaseImage(index);
            updateTable();
          })
        )
      );
      for (const img of images) {
        updateTableCell(img);
      }
    };
    const updateTableCell = function(img) {
      if (img.index === view.baseIndex()) {
        return;
      }
      const a = view.getEntry(view.baseIndex());
      const b = img;
      if (!a.metrics[b.index] && !(a.width === b.width && a.height === b.height)) {
        const message = { en: '‐ (different size)', ja: '‐ (サイズが不一致)' };
        a.metrics[b.index] = message;
        b.metrics[a.index] = message;
      }
      if (!a.metrics[b.index]) {
        const message = { en: 'calculating...', ja: '計算中...' };
        a.metrics[b.index] = message;
        b.metrics[a.index] = message;
        taskQueue.addTaskWithImageData({
          cmd:      'calcMetrics',
          index:    [a.index, b.index],
          options:  {
            orientationA: a.orientation,
            orientationB: b.orientation
          },
          auxTypes: [metricsAuxType2.current()],
        }, (data) => {
            updateFigure(data.index[0], data.index[1], data.auxTypes, data.result);
        });
      }
      $('#metricsTargetName').append(
        $('<td>').append(
          view.makeImageNameWithNumber('<span>', b),
          '&nbsp;',
          $('<button>').text('↑').click(function(e) {
            view.changeBaseImage(b.index);
            updateTable();
          })
        )
      );
      const values = metricsToString(a.metrics[b.index], a);
      const setMetricsValue = function(row, value) {
        if (typeof value === 'string') {
          row.append($('<td>').text(value));
        } else {
          row.append(textUtil.setText($('<td>'), value));
        }
      };
      setMetricsValue($('#psnrValue'), values.psnr);
      setMetricsValue($('#rmseValue'), values.rmse);
      setMetricsValue($('#mseValue'), values.mse);
      setMetricsValue($('#maeValue'), values.mae);
      setMetricsValue($('#ssdValue'), values.ssd);
      setMetricsValue($('#sadValue'), values.sad);
      setMetricsValue($('#nccValue'), values.ncc);
      setMetricsValue($('#aeValue'), values.ae);
    };
    const updateFigure = function(baseIndex, targetIndex, auxTypes, result) {
      if (auxTypes[0] === metricsAuxType2.current()) {
        view.getEntry(baseIndex).metrics[targetIndex] = result;
        view.getEntry(targetIndex).metrics[baseIndex] = result;
      }
      updateTable();
    };
    const toggle = dialogUtil.defineDialog($('#metrics'), updateTable, toggleAnalysis);
    return {
      updateTable,
      toggle
    };
  };
  const updatePairwiseFigureTable = function(target, propName, update, repaint, styles, transformOnly) {
    if (transformOnly) {
      $(target).find('td.fig > *').css(styles.style);
      return;
    }
    viewUtil.updateBaseImageSelector(target, view.baseIndex(), repaint);
    const baseCell = $(target).find('tr.basename td:not(.prop)');
    const labelRow = $(target).find('tr.label');
    const figureRow = $(target).find('tr.figure');
    labelRow.find('td:not(.prop)').remove();
    figureRow.find('td:not(.prop)').remove();
    let count = 0;
    for (const img of view.getImages()) {
      if (img.index === view.baseIndex()) {
        continue;
      }
      count += 1;
      if (!img[propName]) {
        img[propName] = compareUtil.figureUtil.makeBlankFigure(8,8).canvas;
        update(view.getEntry(view.baseIndex()), img);
      }
      const label = view.makeImageNameWithNumber('<span>', img);
      labelRow.append($('<td>').append(label));
      const figCell = $('<td class="fig">').css(styles.cellStyle);
      figCell.append($(img[propName]).css(styles.style).addClass('figMain'));
      const axes = img[propName + 'Axes'];
      if (axes) {
        figCell.append($(axes).css(styles.style));
      }
      figureRow.append(figCell);
    }
    baseCell.attr('colspan', Math.max(1, count));
    if (count === 0) {
      labelRow.append($('<td rowspan="2">').text('no data'));
    }
  };
  // Tone Curve Estimation
  const ToneCurveDialog = function() {
    const toneCurveParam = {};
    const repaint = function() {
      taskQueue.discardTasksOfCommand('calcToneCurve');
      for (const img of view.getImages()) {
        img.toneCurve = null;
        img.toneCurveAxes = null;
      }
      toneCurveParam.type = toneCurveType.current();
      toneCurveParam.auxTypes = [toneCurveAuxType2.current()];
      toneCurveParam.base = view.baseIndex();
      updateTable();
    };
    const toneCurveType = makeModeSwitch('#toneCurveType', 1, function(type) {
      repaint();
      updateAuxOption();
    });
    const toneCurveAuxType2 = makeModeSwitch('#toneCurveAuxType2', 0, repaint);
    const updateAuxOption = function() {
      if (toneCurveType.current() === 0) {
        $('#toneCurveAuxType2').hide();
      } else {
        $('#toneCurveAuxType2').show();
      }
    };
    const onRemoveEntry = function(index) {
      for (const img of view.getImages()) {
        img.toneCurve = null;
        img.toneCurveAxes = null;
      }
      $('#toneCurveTable tr.figure td:not(.prop)').remove();
    };
    const updateAsync = function(baseImage, targetImage) {
      taskQueue.addTaskWithImageData({
          cmd:      'calcToneCurve',
          type:     toneCurveType.current(),
          auxTypes: [toneCurveAuxType2.current()],
          index:    [baseImage.index, targetImage.index],
          options:  {
            orientationA: baseImage.orientation,
            orientationB: targetImage.orientation
          }
      }, (data) => {
        updateFigure(data.type, data.auxTypes, data.index[0], data.index[1], data.result);
      });
    };
    const makeToneMapFigure = function(toneMapData, type) {
      const fig = compareUtil.figureUtil.makeBlankFigure(320, 320);
      const dist = toneMapData.dist;
      const max = toneMapData.max;
      const bits = makeDistributionImageData(fig.context, 256, 256, dist, max, 96, type);
      fig.context.fillStyle = '#000';
      fig.context.fillRect(0, 0, 320, 320);
      fig.context.putImageData(bits, 32, 32);
      return fig;
    };
    const makeFigure = function(type, toneCurve) {
      const numComponents = type === 0 ? 3 : 1;
      const components = toneCurve.components;
      const vbox = '0 0 ' + 320 + ' ' + 320;
      const curvePaths = [];
      const pointToCoord = function(p) {
        const x = 32 + p[0];
        const y = 288 - p[1];
        return x.toFixed(2) + ',' + y.toFixed(2);
      };
      const pointToPath = function(conf, p0, p1) {
        const MIN_OPACITY = 0.2;
        const opacity = Math.max(MIN_OPACITY, conf);
        return '<path opacity="' + opacity.toFixed(2) + '"' +
               ' d="M ' + pointToCoord(p0) + ' L ' + pointToCoord(p1) + '"></path>';
      };
      for (let c = 0; c < numComponents; ++c) {
        const result = components[c];
        const color = type === 0 ? ['#f00', '#0f0', '#00f'][c] : '#fff';
        curvePaths[c] = '<g stroke="' + color + '" ' +
            'style="mix-blend-mode: lighten" ' +
            'fill="none" stroke-width="1">';
        curvePaths[c] += pointToPath(0, [0, 0], result.points[0]);
        for (let i = 1, p0 = result.points[0], p1; p1 = result.points[i]; i++, p0 = p1) {
          const conf = Math.min(result.conf[i - 1], result.conf[i]);
          curvePaths[c] += pointToPath(conf, p0, p1);
        }
        curvePaths[c] += pointToPath(0, result.points[result.points.length - 1], [256, 256]);
        curvePaths[c] += '</g>';
      }
      const axesDesc = 'M 32,16 L 32,288 L 304,288';
      let scaleDesc = '';
      for (let i = 1; i <= 8; ++i) {
        const x = 32 + i / 8 * 256;
        const y = 288 - i / 8 * 256;
        scaleDesc += 'M 32,' + y + ' l 256,0 ';
        scaleDesc += 'M ' + x + ',288 l 0,-256 ';
      }
      const fig = makeToneMapFigure(toneCurve.toneMap, type);
      const curve = (
        '<svg viewBox="' + vbox + '">' +
          curvePaths.join() +
        '</svg>');
      const axes = (
        '<svg viewBox="' + vbox + '">' +
          '<g stroke="white" fill="none">' +
            '<path stroke-width="0.1" d="' + scaleDesc + '"></path>' +
            '<path stroke-width="0.5" d="' + axesDesc + '"></path>' +
          '</g>' +
        '</svg>');
      fig.axes = $(curve + axes);
      return fig;
    };
    const updateTable = function(transformOnly) {
      if (!view.empty() && !transformOnly) {
        view.resetBaseAndTargetImage();
        if (toneCurveParam.type !== toneCurveType.current() ||
            toneCurveParam.auxTypes[0] !== toneCurveAuxType2.current() ||
            toneCurveParam.base !== view.baseIndex()) {
          return repaint();
        }
      }
      const figW = 320, figH = 320, figMargin = 8;
      const styles = makeFigureStyles(figW, figH, figMargin, '#666', figureZoom);
      updatePairwiseFigureTable('#toneCurveTable', 'toneCurve', updateAsync, repaint, styles, transformOnly);
    };
    const updateFigure = function(type, auxTypes, baseIndex, targetIndex, result) {
      if (type === toneCurveParam.type &&
          auxTypes[0] === toneCurveParam.auxTypes[0] &&
          baseIndex === toneCurveParam.base) {
        const figData = makeFigure(type, result);
        const target = view.getEntry(targetIndex);
        target.toneCurve = figData.canvas;
        target.toneCurveAxes = figData.axes;
      }
      updateTable();
    };
    const toggle = dialogUtil.defineDialog($('#toneCurve'), updateTable, toggleAnalysis, {
      enableZoom: true, getBaseSize: function() { return { w: 320, h: 320 }; }
    });
    view.addCacheProperty('toneCurve');
    view.addCacheProperty('toneCurveAxes');
    view.addOnRemoveEntry(onRemoveEntry);
    return {
      toggle
    };
  };
  // Optical Flow
  const OpticalFlowDialog = function() {
    const opticalFlowResult = {};
    let pointedVector = null;
    $('#opticalFlowGridBtn').click(grid.toggle);
    $('#opticalFlow').on('mousemove', 'td.fig > *', function(e) {
      if (opticalFlowResult.result !== null) {
        const point = figureZoom.positionFromMouseEvent(e, this, null);
        onFigurePointed(point);
      }
    });
    const findPointedVector = function(point) {
      const w = opticalFlowResult.result.image.width;
      const h = opticalFlowResult.result.image.height;
      const px = point.x * w;
      const py = point.y * h;
      let nearest = 0, distance = w + h, size = 0;
      for (let i = 0, p; p = opticalFlowResult.result.points[i]; i++) {
        const distX = px - (p.x0 + p.x1) * 0.5;
        const distY = py - (p.y0 + p.y1) * 0.5;
        const d = Math.sqrt(distX * distX + distY * distY);
        if (d < distance) {
          nearest = p;
          distance = d;
          size = Math.max(Math.abs(p.x0 - p.x1), Math.abs(p.y0 - p.y1));
        }
      }
      if (distance < Math.max(5, size * 0.8)) {
        return nearest;
      } else {
        return null;
      }
    };
    const arrowMarkDesc = [
      'M9,7L1,3 m1,3l-1,-3l3,-1',
      'M7,9L3,1 m-1,3l1,-3l3,1',
      'M1,7L9,3 m-3,-1l3,1l-1,3',
      'M3,9L7,1 m-3,1l3,-1l1,3',
      'M9,3L1,7 m1,-3l-1,3l3,1',
      'M7,1L3,9 m-1,-3l1,3l3,-1',
      'M1,3L9,7 m-1,-3l1,3l-3,1',
      'M3,1L7,9 m1,-3l-1,3l-3,-1',
    ];
    const makeArrowMark = function(dx, dy) {
      const arrowType = (dy < 0 ? 0 : 4) + (dx < 0 ? 0 : 2) + (Math.abs(dy) < Math.abs(dx) ? 0 : 1);
      const desc = arrowMarkDesc[arrowType];
      return $('<svg viewBox="0 0 10 10"><path fill="none" stroke="white" stroke-width="0.8" d="' + desc + '"></path></svg>').css({
        display: 'inline-block',
        verticalAlign: '-10%',
        width: '12px',
        heigit: '12px'
      });
    };
    const updateMotionVectorPopup = function() {
      const dx = pointedVector.x1 - pointedVector.x0;
      const dy = pointedVector.y1 - pointedVector.y0;
      const dxText = compareUtil.toSignedFixed(dx, 2) + 'px';
      const dyText = compareUtil.toSignedFixed(dy, 2) + 'px';
      const w = opticalFlowResult.result.image.width;
      const h = opticalFlowResult.result.image.height;
      const popupX = (pointedVector.x1 / w) * 100 + '%';
      const popupY = (1 - (pointedVector.y1 / h)) * 100 + '%';
      const arrowMark = makeArrowMark(dx, dy);
      const text = $('<span>').text(dxText + ', ' + dyText);
      const span = $('#opticalFlowResult > div > span');
      span.children().remove();
      span.append(arrowMark).append(text).show().css({
        position: 'absolute',
        fontSize: '12px',
        lineHeight: '16px',
        border: '0.5px solid white',
        borderRadius: '6px 6px 6px 0px',
        margin: '0.5px',
        padding: '0px 5px',
        color: 'white',
        background: 'rgba(128,128,128,0.5)',
        left: popupX,
        bottom: popupY,
        transformOrigin: 'left bottom'
      });
    };
    const updateMotionVectorInfo = function() {
      const dx = pointedVector.x1 - pointedVector.x0;
      const dy = pointedVector.y1 - pointedVector.y0;
      const dxText = compareUtil.toSignedFixed(dx, 2) + 'px';
      const dyText = compareUtil.toSignedFixed(dy, 2) + 'px';
      $('#opticalFlowSelectedDeltaX').text(dxText);
      $('#opticalFlowSelectedDeltaY').text(dyText);
    };
    const onFigurePointed = function(point) {
      if (opticalFlowResult.result !== null) {
        const nearest = findPointedVector(point);
        if (nearest) {
          if (pointedVector === null || pointedVector !== nearest) {
            pointedVector = nearest;
            updateMotionVectorPopup();
            updateMotionVectorInfo();
            updateTable(/*transformOnly=*/ true);
          }
        } else {
          pointedVector = null;
          $('#opticalFlowSelectedDeltaX,#opticalFlowSelectedDeltaY').text('--');
          $('#opticalFlowResult > div > span').hide();
        }
      }
    };
    const processClick = function(point) {
      onFigurePointed(point);
    };
    const onRemoveEntry = function(index) {
      if (opticalFlowResult.base === index || opticalFlowResult.target === index) {
        $('#opticalFlowResult > *').remove();
        opticalFlowResult.result = null;
        pointedVector = null;
      }
    };
    const updateOptionsDOM = function() {
      $('#opticalFlowResult > *').remove();
      $('#opticalFlowDeltaX,#opticalFlowDeltaY').text('--');
      $('#opticalFlowSelectedDeltaX,#opticalFlowSelectedDeltaY').text('--');
      $('#opticalFlowSummary *').remove();
      if (false === viewUtil.setupBaseAndTargetSelector('#opticalFlowBaseName', '#opticalFlowTargetName', updateTable)) {
        return false;
      }
      return true;
    };
    const updateAsync = function() {
      opticalFlowResult.base   = view.baseIndex();
      opticalFlowResult.target = view.targetIndex();
      opticalFlowResult.result  = null;
      pointedVector = null;
      taskQueue.discardTasksOfCommand('calcOpticalFlow');
      if (view.baseIndex() !== view.targetIndex()) {
        const base = view.getEntry(view.baseIndex());
        const target = view.getEntry(view.targetIndex());
        taskQueue.addTaskWithImageData({
          cmd:      'calcOpticalFlow',
          index:    [base.index, target.index],
          options:  {
            orientationA: base.orientation,
            orientationB: target.orientation
          }
        }, (data) => {
            updateFigure(data.index[0], data.index[1], data.result);
        });
      }
    };
    const makeFigure = function(styles) {
      const w = opticalFlowResult.result.image.width;
      const h = opticalFlowResult.result.image.height;
      const fig = compareUtil.figureUtil.makeBlankFigure(w, h);
      const bits = fig.context.createImageData(w, h);
      compareUtil.figureUtil.copyImageBits(opticalFlowResult.result.image, bits);
      const vectorPaths = [];
      const circles = [];
      fig.context.putImageData(bits, 0, 0);
      const pointToCoord = function(x, y) {
        return x.toFixed(2) + ',' + y.toFixed(2);
      };
      for (const p of opticalFlowResult.result.points) {
        vectorPaths.push(
          'M ' + pointToCoord(p.x0 + 0.5, p.y0 + 0.5) +
          ' L ' + pointToCoord(p.x1 + 0.5, p.y1 + 0.5)
        );
        circles.push(
          '<circle cx="' + (p.x0 + 0.5).toFixed(2) + '" cy="' + (p.y0 + 0.5).toFixed(2) + '" r="3">' +
          '</circle>'
        );
      }
      const strokes =
          '<g stroke="#ff4" stroke-width="0.3" fill="none">' + circles + '</g>' +
          '<g stroke="white" fill="none">' +
            '<path stroke-width="0.6" d="' + vectorPaths.join(' ') + '"></path>' +
          '</g>';
      styles = updateFigureStylesForActualSize(styles, w, h);
      opticalFlowResult.baseWidth = styles.baseW;
      opticalFlowResult.baseHeight = styles.baseH;
      styles.style.transform = 'translate(-50%,0%) ' + figureZoom.makeTransform();
      const picture = $(fig.canvas).css(styles.style).addClass('figMain');
      const overlay = $('<svg viewBox="0 0 ' + w + ' ' + h + '">' + strokes + '</svg>').css(styles.style);
      opticalFlowResult.grid = grid.isEnabled() ? grid.makeGrid(w, h).css(styles.style) : null;
      const popup = $('<div>').append($('<span>')).css(styles.style);
      $('#opticalFlowResult').append(picture);
      if (opticalFlowResult.grid) {
        $('#opticalFlowResult').append(opticalFlowResult.grid);
        updateGridStyle();
      }
      $('#opticalFlowResult').append(overlay).append(popup).css(styles.cellStyle);
    };
    const updateStatistics = function() {
      if (opticalFlowResult.result.points.length === 0) {
        $('#opticalFlowDeltaX,#opticalFlowDeltaY').text('--');
      } else {
        let sumDX = 0;
        let sumDY = 0;
        for (const p of opticalFlowResult.result.points) {
          sumDX += p.x1 - p.x0;
          sumDY += p.y1 - p.y0;
        }
        const avgDX = sumDX / opticalFlowResult.result.points.length;
        const avgDY = sumDY / opticalFlowResult.result.points.length;
        $('#opticalFlowDeltaX').text(compareUtil.toSignedFixed(avgDX, 2) + 'px');
        $('#opticalFlowDeltaY').text(compareUtil.toSignedFixed(avgDY, 2) + 'px');
      }
    };
    const updateReport = function(styles) {
      makeFigure(styles);
      updateStatistics();
      if (opticalFlowResult.result.points.length === 0) {
        textUtil.setText($('#opticalFlowSummary'), {
          en: 'Could not detect any optical flow',
          ja: 'オプティカルフローを検出できませんでした'
        });
      } else {
        const num = opticalFlowResult.result.points.length;
        textUtil.setText($('#opticalFlowSummary'), {
          en: 'Optical flow detected for ' + num + ' points',
          ja: 'オプティカルフローが ' + num + ' 点で検出されました'
        });
      }
    };
    const updateHeader = function() {
      const gridbtn = $('#opticalFlowGridBtn');
      grid.isEnabled() ? gridbtn.addClass('current') : gridbtn.removeClass('current');
    };
    const updateTableDOM = function() {
      if (false === updateOptionsDOM()) {
        return;
      }
      if (opticalFlowResult.base !== view.baseIndex() || opticalFlowResult.target !== view.targetIndex()) {
        updateAsync();
      }
      const figW = Math.max(600, Math.round($('#view').width() * 0.65));
      const figH = Math.max(320, Math.round($('#view').height() * 0.55)), figMargin = 8;
      const styles = makeFigureStyles(figW, figH, figMargin, '#000');
      if (opticalFlowResult.result === null) {
        $('#opticalFlowResult').append(compareUtil.figureUtil.makeBlankFigure(8,8).canvas).css(styles.cellStyle);
        $('#opticalFlowDeltaX,#opticalFlowDeltaY').text('--');
        $('#opticalFlowSelectedDeltaX,#opticalFlowSelectedDeltaY').text('--');
        textUtil.setText($('#opticalFlowSummary'), {
          en: 'calculating...',
          ja: '計算中...'
        });
      } else {
        updateReport(styles);
      }
    };
    const updateGridStyle = function() {
      if (opticalFlowResult.result !== null && opticalFlowResult.grid) {
        grid.updateGridStyle(
          opticalFlowResult.grid,
          opticalFlowResult.result.image.width,
          opticalFlowResult.baseWidth,
          figureZoom.scale);
      }
    };
    const updateTable = function(transformOnly) {
      if (transformOnly) {
        if (opticalFlowResult.result !== null) {
          $('#opticalFlowResult > *').css('transform', 'translate(-50%,0%) ' + figureZoom.makeTransform());
          $('#opticalFlowResult > div > span').css({ transform: 'scale(' + (1 / figureZoom.scale) + ')' });
          updateGridStyle();
        }
      } else {
        updateHeader();
        updateTableDOM();
      }
    };
    const updateFigure = function(baseIndex, targetIndex, result) {
      if (opticalFlowResult.base === baseIndex && opticalFlowResult.target === targetIndex) {
        opticalFlowResult.result = result;
        pointedVector = null;
      }
      updateTable();
    };
    const toggle = dialogUtil.defineDialog($('#opticalFlow'), updateTable, toggleAnalysis, {
      enableZoom: true,
      getBaseSize: function() {
        return opticalFlowResult ? { w: opticalFlowResult.baseWidth, h: opticalFlowResult.baseHeight } : null;
      },
      onOpen: function() { grid.setOnChange(updateTable); },
      onClose: function() { grid.setOnChange(null); }
    });
    view.addOnRemoveEntry(onRemoveEntry);
    return {
      processClick,
      updateTable,
      toggle
    };
  };
  // Image Diff
  const DiffDialog = function() {
    const diffResult = {};
    const diffOptions = {
      ignoreAE: 0,
      imageType: 0,
      resizeToLarger: true,
      resizeMethod: 'lanczos3',
      ignoreRemainder: false,
      offsetX: 0,
      offsetY: 0
    };
    $('#diffGridBtn').click(grid.toggle);
    let diffImageBrightness = 8;
    $('#diffImageBrightness').val(diffImageBrightness);
    const applyBrightness = function() {
      $('#diffResult .figMain').css('filter', 'brightness(' + diffImageBrightness + ')');
    };
    $('#diffImageBrightness').on('change', function(e) {
      if (this.validity.valid) {
        diffImageBrightness = +this.value;
        applyBrightness();
      }
    });
    $('#diffIgnoreAE').on('change', function(e) {
      if (this.validity.valid) {
        diffOptions.ignoreAE = +this.value;
        updateTable();
        return false;
      }
    });
    const diffImageType = makeModeSwitch('#diffImageType', 0, function(type) {
      diffOptions.imageType = type;
      updateImageTypeFootnote();
      updateTable();
    });
    const updateImageTypeFootnote = function() {
      if (diffOptions.imageType === 0) {
        $('#diffImageType0Footnote').show();
        $('#diffImageType1Footnote').hide();
      } else {
        $('#diffImageType0Footnote').hide();
        $('#diffImageType1Footnote').show();
      }
    };
    updateImageTypeFootnote();
    $('.diffDimensionOption').on('change', function(e) {
      const o = this.options[this.selectedIndex].value;
      diffOptions.resizeToLarger = o === 'resize';
      diffOptions.ignoreRemainder = o === 'min';
      updateTable();
      return false;
    });
    $('#diffResizeMethod').on('change', function(e) {
      diffOptions.resizeMethod = this.options[this.selectedIndex].value;
      updateTable();
      return false;
    });
    $('#diffOffsetX').on('change', function(e) {
      diffOptions.offsetX = +this.value;
      updateTable();
      return false;
    });
    $('#diffOffsetY').on('change', function(e) {
      diffOptions.offsetY = +this.value;
      updateTable();
      return false;
    });
    const onRemoveEntry = function(index) {
      if (diffResult.base === index || diffResult.target === index) {
        $('#diffResult *').remove();
        diffResult.result = null;
      }
    };
    const updateOptionsDOM = function(styles) {
      $('.diffDimension').css({display:'none'});
      $('#diffDetectedMaxAE').text('');
      $('#diffIgnoreAEResult').text('');
      $('#diffAEHistogram canvas').remove();
      $('#diffResult').css(styles.cellStyle).children().remove();
      $('#diffSummary *').remove();
      $('#diffSaveFigure').hide();
      $('.diffDimensionOption').
        prop('value',
          diffOptions.resizeToLarger ? 'resize' :
          diffOptions.ignoreRemainder ? 'min' : 'max');
      $('#diffResizeMethod').
        prop('value', diffOptions.resizeMethod).
        prop('disabled', !diffOptions.resizeToLarger).
        parent().css({opacity: !diffOptions.resizeToLarger ? '0.5' : ''});
      $('#diffOffsetX').val(diffOptions.offsetX);
      $('#diffOffsetY').val(diffOptions.offsetY);
      $('#diffIgnoreAE').val(diffOptions.ignoreAE);
      if (false === viewUtil.setupBaseAndTargetSelector('#diffBaseName', '#diffTargetName', updateTable)) {
        return false;
      }
      const base = view.getEntry(view.baseIndex());
      const target = view.getEntry(view.targetIndex());
      if (base.width === target.width && base.height === target.height) {
        $('.diffDimension').css({display:'none'});
      } else {
        $('.diffDimension').css({display:''});
      }
      return true;
    };
    const updateAsync = function() {
      diffResult.base   = view.baseIndex();
      diffResult.target = view.targetIndex();
      diffResult.ignoreAE = diffOptions.ignoreAE;
      diffResult.imageType = diffOptions.imageType;
      diffResult.ignoreRemainder = diffOptions.ignoreRemainder;
      diffResult.resizeToLarger = diffOptions.resizeToLarger;
      diffResult.resizeMethod = diffOptions.resizeMethod;
      diffResult.offsetX = diffOptions.offsetX;
      diffResult.offsetY = diffOptions.offsetY;
      diffResult.result  = null;
      taskQueue.discardTasksOfCommand('calcDiff');
      if (view.baseIndex() !== view.targetIndex()) {
        const base = view.getEntry(view.baseIndex());
        const target = view.getEntry(view.targetIndex());
        taskQueue.addTaskWithImageData({
          cmd:      'calcDiff',
          index:    [base.index, target.index],
          options:  {
            ignoreAE: diffOptions.ignoreAE,
            imageType: diffOptions.imageType,
            ignoreRemainder: diffOptions.ignoreRemainder,
            resizeToLarger: diffOptions.resizeToLarger,
            resizeMethod: diffOptions.resizeMethod,
            offsetX: diffOptions.offsetX,
            offsetY: diffOptions.offsetY,
            orientationA: base.orientation,
            orientationB: target.orientation
          }
        }, (data) => {
            updateFigure(data.index[0], data.index[1], data.options, data.result);
        });
      }
    };
    const makeHistogramFigure = function(hist, ignoreAE) {
      ignoreAE = compareUtil.clamp(ignoreAE, 0, 255);
      const fig = compareUtil.figureUtil.makeBlankFigure(256 * 3, 320);
      const context = fig.context;
      context.fillStyle = '#222';
      context.fillRect(0,0,256*3,320);
      context.fillStyle = '#66f';
      context.fillRect(0,0,(ignoreAE + 1)*3,320);
      let max = 0;
      for (let i = 0; i < hist.length; ++i) {
        max = Math.max(max, hist[i]);
      }
      compareUtil.figureUtil.drawHistogram(context, '#ccc', hist, max, 0, ignoreAE + 1, 0, 320, 300);
      compareUtil.figureUtil.drawHistogram(context, '#fff', hist, max, ignoreAE + 1, 255 - ignoreAE, ignoreAE + 1, 320, 300);
      return fig.canvas;
    };
    const updateReport = function(styles) {
      $('#diffDetectedMaxAE').text(diffResult.result.summary.maxAE);
      if (diffOptions.ignoreAE !== 0) {
        const rate = diffResult.result.summary.countIgnoreAE / diffResult.result.summary.total;
        const percent = compareUtil.toPercent(rate);
        $('#diffIgnoreAEResult').text(percent);
        $('#diffIgnoredUnmatchedRange').text('(≦' + diffOptions.ignoreAE + ')');
        $('#diffUnmatchedRange').text('(>' + diffOptions.ignoreAE + ')');
      } else {
        $('#diffIgnoredUnmatchedRange').text('');
        $('#diffUnmatchedRange').text('');
      }
      const histFig = makeHistogramFigure(diffResult.result.summary.histogram, diffOptions.ignoreAE);
      $('#diffAEHistogram').append($(histFig).css({ width: '320px', height: '160px' }));
      const w = diffResult.result.image.width;
      const h = diffResult.result.image.height;
      const fig = compareUtil.figureUtil.makeBlankFigure(w, h);
      const bits = fig.context.createImageData(w, h);
      compareUtil.figureUtil.copyImageBits(diffResult.result.image, bits);
      fig.context.putImageData(bits, 0, 0);
      styles = updateFigureStylesForActualSize(styles, w, h);
      diffResult.baseWidth = styles.baseW;
      diffResult.baseHeight = styles.baseH;
      styles.style.transform = 'translate(-50%,0%) ' + figureZoom.makeTransform();
      const figMain = $(fig.canvas).css(styles.style).addClass('figMain');
      $('#diffResult').css(styles.cellStyle).append(figMain);
      if (diffOptions.imageType === 1) {
        applyBrightness();
      }
      const gridColor = diffOptions.imageType === 0 ? 'white' : '#f0f';
      diffResult.grid = grid.isEnabled() ? grid.makeGrid(w, h, gridColor).css(styles.style) : null;
      if (diffResult.grid) {
        $('#diffResult').append(diffResult.grid);
        updateGridStyle();
      }
      if (diffResult.result.summary.unmatch === 0) {
        if (0 === diffResult.result.summary.countIgnoreAE) {
          textUtil.setText($('#diffSummary'), {
            en: 'Perfect match',
            ja: '完全に一致しました'
          });
        } else {
          textUtil.setText($('#diffSummary'), {
            en: 'Perfect match (including ignored unmatched)',
            ja: '完全に一致しました（無視した不一致を含む）'
          });
        }
      } else {
        const matchRate = diffResult.result.summary.match / diffResult.result.summary.total;
        const percent = compareUtil.toPercent(matchRate);
        if (0 === diffResult.result.summary.countIgnoreAE) {
          textUtil.setText($('#diffSummary'), {
            en: percent + ' pixels are matched',
            ja: percent + ' のピクセルが一致しました'
          });
        } else {
          textUtil.setText($('#diffSummary'), {
            en: percent + ' pixels are matched (including ignored unmatched)',
            ja: percent + ' のピクセルが一致しました（無視した不一致を含む）'
          });
        }
      }
      $('#diffSaveFigure').show().off('click').click(function() {
        const msg = openMessageBox({
          en: 'Encoding the image...',
          ja: '画像をエンコード中...'
        });
        const download = function(url) {
          msg.close(300);
          $('#diffSaveFigureHelper').attr('href', url);
          jQuery('#diffSaveFigureHelper')[0].click();
        };
        fig.canvas.toBlob(function(blob) {
            const url = compareUtil.createObjectURL(blob);
            download(url);
            compareUtil.revokeObjectURL(url);
        });
        return false;
      });
    };
    const updateHeader = function() {
      const gridbtn = $('#diffGridBtn');
      grid.isEnabled() ? gridbtn.addClass('current') : gridbtn.removeClass('current');
    };
    const figureStyles = function() {
      const figW = Math.max(480, Math.round($('#view').width() * 0.5));
      const figH = Math.max(320, Math.round($('#view').height() * 0.55));
      const figMargin = 8;
      return makeFigureStyles(figW, figH, figMargin, '#000');
    };
    const updateTableDOM = function() {
      const styles = figureStyles();
      if (false === updateOptionsDOM(styles)) {
        return;
      }
      if (diffResult.base !== view.baseIndex() || diffResult.target !== view.targetIndex() ||
          diffResult.ignoreAE !== diffOptions.ignoreAE ||
          diffResult.imageType !== diffOptions.imageType ||
          diffResult.ignoreRemainder !== diffOptions.ignoreRemainder ||
          diffResult.resizeToLarger !== diffOptions.resizeToLarger ||
          diffResult.resizeMethod !== diffOptions.resizeMethod ||
          diffResult.offsetX !== diffOptions.offsetX ||
          diffResult.offsetY !== diffOptions.offsetY) {
        updateAsync();
      }
      if (diffResult.result === null) {
        $('#diffAEHistogram').append($(compareUtil.figureUtil.makeBlankFigure(8,8).canvas).css({width:'320px',height:'160px'}));
        $('#diffResult').append(compareUtil.figureUtil.makeBlankFigure(8,8).canvas).css(styles.cellStyle);
        textUtil.setText($('#diffSummary'), {
          en: 'calculating...',
          ja: '計算中...'
        });
      } else {
        updateReport(styles);
      }
    };
    const updateGridStyle = function() {
      if (diffResult.result !== null && diffResult.grid) {
        grid.updateGridStyle(
          diffResult.grid,
          diffResult.result.image.width,
          diffResult.baseWidth,
          figureZoom.scale);
      }
    };
    const updateTable = function(transformOnly) {
      if (transformOnly) {
        if (diffResult.result !== null) {
          $('#diffResult > *').css('transform', 'translate(-50%,0%) ' + figureZoom.makeTransform());
          updateGridStyle();
        }
      } else {
        updateHeader();
        updateTableDOM();
      }
    };
    const updateFigure = function(baseIndex, targetIndex, options, result) {
      if (diffResult.base === baseIndex && diffResult.target === targetIndex &&
          diffResult.ignoreAE === options.ignoreAE &&
          diffResult.imageType === options.imageType &&
          diffResult.ignoreRemainder === options.ignoreRemainder &&
          diffResult.resizeToLarger === options.resizeToLarger &&
          diffResult.resizeMethod === options.resizeMethod &&
          diffResult.offsetX === options.offsetX &&
          diffResult.offsetY === options.offsetY) {
        diffResult.result = result;
      }
      updateTable();
    };
    const toggle = dialogUtil.defineDialog($('#diff'), updateTable, toggleAnalysis, {
      enableZoom: true,
      getBaseSize: function() {
        return diffResult ? { w: diffResult.baseWidth, h: diffResult.baseHeight } : null;
      },
      onOpen: function() { grid.setOnChange(updateTable); },
      onClose: function() { grid.setOnChange(null); }
    });
    view.addOnRemoveEntry(onRemoveEntry);
    return {
      updateTable,
      toggle
    };
  };
  // Alt View
  const AltView = function({ view, model }) {
    let colorSpace = $('#altViewColorSpace').val();
    let mapping = $('.altViewMapping').val();
    let component = null;
    let alphaEnabled = $('#altViewEnableAlpha').prop('checked');
    let enableContour = false;
    const colorSpaces = {
      'rgb': {
        modeSwitch: '#altViewModeSwRGB',
        components: [ 'R', 'G', 'B', 'A' ],
        coef: [
          [ 1, 0, 0, 0, 0 ],
          [ 0, 1, 0, 0, 0 ],
          [ 0, 0, 1, 0, 0 ],
          [ 0, 0, 0, 1, 0 ]
        ]
      },
      'ycbcr601': {
        modeSwitch: '#altViewModeSwYCbCr',
        components: [ 'Y', 'Cb', 'Cr', 'A' ],
        coef: [
          [ 0.299, 0.587, 0.114, 0, 0 ],
          [ -0.1687, -0.3313, 0.5000, 0, 127.5 ],
          [ 0.5000, -0.4187, -0.0813, 0, 127.5 ],
          [ 0, 0, 0, 1, 0 ]
        ]
      },
      'ycbcr709': {
        modeSwitch: '#altViewModeSwYCbCr',
        components: [ 'Y', 'Cb', 'Cr', 'A' ],
        coef: [
          [ 0.2126, 0.7152, 0.0722, 0, 0 ],
          [ -0.1146, -0.3854, 0.5000, 0, 127.5 ],
          [ 0.5000, -0.4542, -0.0458, 0, 127.5 ],
          [ 0, 0, 0, 1, 0 ]
        ]
      }
    };
    const colorMaps = {
      'grayscale': (function() {
        const colorMap = new Uint8Array(3 * 256);
        for (let i = 0; i < 256; ++i) {
          colorMap[i + 0] = i;
          colorMap[i + 256] = i;
          colorMap[i + 512] = i;
        }
        return colorMap;
      })(),
      'pseudocolor': (function() {
        const colorMap = new Uint8Array(3 * 256);
        const tone = function(a) {
          return Math.round(255 * Math.pow(a, 1/2.2));
        };
        for (let i = 0; i < 256; ++i) {
          let a = (i - 40) * 5.8 / 255;
          a = a - Math.floor(a);
          a = a * a * (3 - 2 * a);
          colorMap[i + 0] = tone(i < 128 ? 0 : i < 172 ? a : i < 216 ? 1 : 1 - a);
          colorMap[i + 256] = tone(i < 40 ? 0 : i < 84 ? a : i < 172 ? 1 : i < 216 ? 1 - a : 0);
          colorMap[i + 512] = tone(i < 40 ? a : i < 84 ? 1 : i < 128 ? 1 - a : 0);
        }
        return colorMap;
      })()
    };
    const colorBars = {};
    const makeColorBar = function(colorMap) {
      const fig = compareUtil.figureUtil.makeBlankFigure(512 + 2, 44);
      for (let i = 0; i < 256; ++i) {
        const color = 'rgb(' + colorMap[i] + ',' +
                colorMap[i + 256] + ',' + colorMap[i + 512] + ')';
        fig.context.fillStyle = color;
        fig.context.fillRect(1 + i * 2, 0, 2, 44);
      }
      const axes = [
        { pos: 0.5,   align: 'left',   label: '0' },
        { pos: 64.5,  align: 'center', label: '64' },
        { pos: 128.5, align: 'center', label: '128' },
        { pos: 192.5, align: 'center', label: '192' },
        { pos: 255.5, align: 'right',  label: '255' }
      ];
      compareUtil.figureUtil.drawAxes(fig.context, 1, 0, 2, 0, 12, 1, '#fff', axes);
      return $(fig.canvas).width(256).addClass('colorbar');
    };
    $('#altViewMode .close').on('click', function(e) {
      reset();
      view.updateDOM();
    });
    const changeColorSpace = function(cs) {
      const lastComponent = (component === null || component === 0) ? null :
                            colorSpaces[colorSpace].components[component - 1];
      colorSpace = cs;
      if (component !== null) {
        const sameComponent = colorSpaces[colorSpace].components.indexOf(lastComponent);
        if (0 <= sameComponent) {
          component = sameComponent + 1;
        } else {
          component = 0;
        }
        updateModeIndicator();
        view.updateDOM();
      }
    };
    $('#altViewColorSpace').on('change', function(e) {
      changeColorSpace(this.options[this.selectedIndex].value);
      return false;
    });
    $('#altViewMode .mode-sw button').on('click', function(e) {
      component = $(this).parent().children().index(this);
      updateModeIndicator();
      view.updateDOM();
    });
    $('.altViewMapping').on('change', function(e) {
      mapping = this.options[this.selectedIndex].value;
      updateModeIndicator();
      view.updateDOM();
      return false;
    });
    $('#altViewEnableAlpha').on('click', function() {
      alphaEnabled = $(this).prop('checked');
      if (component !== null && component !== 0 &&
          colorSpaces[colorSpace].components[component - 1] === 'A') {
        component = 0;
        updateModeIndicator();
        view.updateDOM();
      } else {
        updateModeIndicator();
      }
    });
    const reset = function() {
      if (component !== null) {
        component = null;
        updateModeIndicator();
      }
    };
    const toggle = function() {
      component = component === null ? 0 : null;
      updateModeIndicator();
      view.updateDOM();
    };
    const toggleContour = function() {
      enableContour = !enableContour;
      if (component !== null && component !== 0) {
        view.updateDOM();
      }
    };
    const changeMode = function(reverse) {
      let numOptions = colorSpaces[colorSpace].components.length + 1;
      if (!alphaEnabled && colorSpaces[colorSpace].components[numOptions - 2] === 'A') {
        numOptions -= 1;
      }
      component =
        component === null ? 0 :
        (reverse ? component + numOptions - 1 : component + 1) % numOptions;
      updateModeIndicator();
      view.updateDOM();
    };
    const changeModeReverse = function() {
      changeMode(/* reverse= */ true);
    };
    const enableAlpha = function() {
      if (!alphaEnabled) {
        alphaEnabled = true;
        $('#altViewEnableAlpha').prop('checked', true);
        updateModeIndicator();
      }
    };
    const updateModeIndicator = function() {
      if (component !== null) {
        $('#altViewMode .mode-sw').css({ display: 'none' });
        const sw = $(colorSpaces[colorSpace].modeSwitch).css({ display: '' });
        const buttons = sw.find('button').removeClass('current');
        buttons.eq(component).addClass('current');
        const alpha = colorSpaces[colorSpace].components.indexOf('A');
        if (0 <= alpha) {
          buttons.eq(alpha + 1).css({ display: alphaEnabled ? '' : 'none' });
        }
        $('#altViewColorBar *').remove();
        if (!colorBars[mapping]) {
          colorBars[mapping] = makeColorBar(colorMaps[mapping]);
        }
        $('#altViewColorBar').append(colorBars[mapping]);
        $('#altViewMode').css({ display : 'block' });
        $('.altViewMapping').val(mapping);
        $('#channelbtn').addClass('current');
        $('#altViewColorSpace').val(colorSpace);
      } else {
        $('#altViewMode').css({ display : '' });
        $('#channelbtn').removeClass('current');
        $('#view div.imageBox .contour').remove();
      }
    };
    // WIP
    const makeContour = function(channelImage) {
      //console.time('makeConcour');
      const w = channelImage.width;
      const h = channelImage.height;
      const ch = channelImage.data;
      for (let i = 0, n = w * h; i < n; ++i) {
        ch[i] = ch[i] >> 5;
      }
      const paths = [];
      for (let y = 0, i = 0; y + 1 < h; ++y) {
        let start = null;
        for (let x = 0; x < w; ++x, ++i) {
          if (ch[i] !== ch[i + w]) {
            if (start === null) {
              paths.push([x, y + 1, x + 1, y + 1]);
              start = paths.length - 1;
            } else {
              paths[start][2] = x + 1;
            }
          } else {
            start = null;
          }
        }
      }
      for (let x = 0; x + 1 < w; ++x) {
        let start = null;
        for (let y = 0, i = x; y < h; ++y, i += w) {
          if (ch[i] !== ch[i + 1]) {
            if (start === null) {
              paths.push([x + 1, y, x + 1, y + 1]);
              start = paths.length - 1;
            } else {
              paths[start][3] = y + 1;
            }
          } else {
            start = null;
          }
        }
      }
      const vbox = '0 0 ' + w + ' ' + h;
      const pathDesc = paths.map(function(p) {
        if (p[0] === p[2]) {
          return 'M' + p[0] + ' ' + p[1] + 'v' + (p[3] - p[1]);
        } else if (p[1] === p[3]) {
          return 'M' + p[0] + ' ' + p[1] + 'h' + (p[2] - p[0]);
        }
        return 'M' + p[0] + ' ' + p[1] + 'l' + (p[2] - p[0]) + ' ' + (p[3] - p[1]);
      });
      //console.log('pathDesc.length', pathDesc.length);
      //console.log('pathDesc.join().length', pathDesc.join('').length);
      const contour = $(
        '<svg class="imageOverlay contour" viewBox="' + vbox + '">' +
          '<g stroke="#ff00ff" stroke-width="0.2" fill="none">' +
            '<path d="' + pathDesc.join('') + '"></path>' +
          '</g>' +
        '</svg>').
        width(w).
        height(h);
      //console.timeEnd('makeConcour');
      return contour;
    };
    const getAltImage = function(ent) {
      if (component === null || component === 0) {
        return null;
      }
      const imageData = getImageData(ent);
      if (!imageData) {
        return null;
      }
      const w = imageData.width, h = imageData.height;
      const altView = compareUtil.figureUtil.makeBlankFigure(w, h);
      const altImageData = altView.context.createImageData(w, h);
      const coef = colorSpaces[colorSpace].coef[component - 1];
      const r = coef[0], g = coef[1], b = coef[2], a = coef[3], c = coef[4];
      const src = imageData.data;
      const dest = altImageData.data;
      const colorMap = colorMaps[mapping];
      let contour = null;
      if (enableContour) {
        const channelImage = { data: new Uint8Array(w * h), width: w, height: h };
        const ch = channelImage.data;
        for (let i = 0, j = 0, n = 4 * w * h; i < n; i += 4, j++) {
          const x = Math.round(c + r * src[i] + g * src[i + 1] + b * src[i + 2] + a * src[i + 3]);
          ch[j] = x;
        }
        for (let i = 0, j = 0, n = w * h; j < n; i += 4, j++) {
          const x = ch[j];
          dest[i + 0] = colorMap[x];
          dest[i + 1] = colorMap[x + 256];
          dest[i + 2] = colorMap[x + 512];
          dest[i + 3] = 255;
        }
        contour = makeContour(channelImage);
      } else {
        for (let i = 0, n = 4 * w * h; i < n; i += 4) {
          const x = Math.round(c + r * src[i] + g * src[i + 1] + b * src[i + 2] + a * src[i + 3]);
          dest[i + 0] = colorMap[x];
          dest[i + 1] = colorMap[x + 256];
          dest[i + 2] = colorMap[x + 512];
          dest[i + 3] = 255;
        }
      }
      altView.context.putImageData(altImageData, 0, 0);
      return {
        image: altView.canvas,
        contour: contour
      };
    };
    const onUpdateImageBox = function(img, w, h) {
      if (img.view && component !== null) {
        if (img.contour) {
          $(img.view).find('.contour').remove();
          $(img.view).append(img.contour);
          $(img.contour).css({ width: w+'px', height: h+'px' });
        } else {
          $(img.view).find('.contour').remove();
        }
      }
    };
    const onUpdateEntryTransform = function(ent, commonStyle) {
      if (ent.contour) {
        $(ent.contour).css(commonStyle);
      }
    };
    const currentMode = function() {
      return component === null ? null : colorSpace + '/' + component + '/' + mapping + '/' + enableContour;
    };
    const modifyEntryView = function(ent) {
      const mode = currentMode();
      if (ent.altViewMode !== mode) {
        const altImage = getAltImage(ent);
        view.setAltImage(ent.index, altImage ? altImage.image : null);
        ent.contour = altImage ? altImage.contour : null;
        ent.altViewMode = altImage ? mode : null;
        return true;
      }
    };
    model.events.addOnUpdateImageBox(onUpdateImageBox);
    view.addOnUpdateEntryTransform(onUpdateEntryTransform);
    view.addEntryViewModifier(modifyEntryView);
    return {
      reset,
      toggle,
      toggleContour,
      changeMode,
      changeModeReverse,
      enableAlpha,
      active: function() { return null !== component; }
    };
  };
  const roiMap = compareUI.RoiMap({ view, model });
  const altView = AltView({ view, model });
  const settings = Settings();
  const cameraDialog = CameraDialog();
  // Side Bar
  const SideBar = function({ view, model }) {
    const viewZoom = view.viewZoom;
    $('#add').click(function() {
      $('#file').click();
    });
    $('#camerabtn').click(cameraDialog.toggle);
    if (!cameraDialog.hasCameraAPI) {
      $('#camerabtn').hide();
    }
    $('#analysisbtn').click(toggleAnalysis);
    $('#zoomIn').click(viewZoom.zoomIn);
    $('#zoomOut').click(viewZoom.zoomOut);
    $('#arrange').click(view.arrangeLayout);
    $('#overlay').click(view.toggleOverlay);
    $('#gridbtn').click(grid.toggle);
    $('#pickerbtn').click(crossCursor.toggle);
    $('#channelbtn').click(altView.toggle);
    $('#fullscreen').click(view.toggleFullscreen);
    $('#settingsbtn').click(settings.toggle);
    $('#helpbtn').click(toggleHelp);
    const newSelectorButton = function(index) {
      const number = view.numberFromIndex(index);
      const button = $('<button/>').addClass('selector').
        addClass(`number${number}`).
        text(number).
        click(function(e) { view.toSingleImageView(index); });
      $('#next').before(button);
      return button;
    };
    const updateSelectorButtons = function() {
      $('.selector').remove();
      for (const img of view.getImages()) {
        newSelectorButton(img.index);
      }
    };
    const updateArrangeButton = function() {
      const layoutMode = model.layoutDirection.current();
      $('#arrange img').attr('src', layoutMode === 'x' ? 'res/layout_x.svg' : 'res/layout_y.svg');
    };
    const updateSelectorButtonState = function() {
      const indices = view.getSelectedImageIndices();
      const selectors = $('.selector');
      selectors.removeClass('current');
      for (const index of indices) {
        const number = view.numberFromIndex(index);
        selectors.filter(`.number${number}`).addClass('current');
      }
    };
    const updateOverlayModeIndicator = function() {
      if (model.overlayMode.isActive()) {
        const indices = view.getSelectedImageIndices();
        const numbers = indices.map(function(i) { return view.numberFromIndex(i); });
        numbers.sort();
        const modeDesc = numbers.join(' + ') + (numbers.length === 1 ? ' only' : '');
        textUtil.setText($('#mode h3'), {
          en: 'OVERLAY MODE : ' + modeDesc,
          ja: 'オーバーレイモード : ' + modeDesc });
        $('#mode').show();
        $('#overlay').addClass('current');
      } else {
        $('#mode h3 span').text('');
        $('#mode').hide();
        $('#overlay').removeClass('current');
      }
    };
    const onUpdateLayout = function() {
      updateArrangeButton();
      updateSelectorButtonState();
      updateOverlayModeIndicator();
    };
    model.events.addOnUpdateLayout(onUpdateLayout);
    model.events.addOnUpdateViewDOM(updateSelectorButtons);
    return {};
  };
  const sideBar = SideBar({ view, model });

  const NEEDS_IOS_EXIF_WORKAROUND = (function() {
    const ua = window.navigator.userAgent.toLowerCase();
    return 0 <= ua.indexOf('iphone') || 0 <= ua.indexOf('ipad') || 0 <= ua.indexOf('ipod');
  })();
  const nowLoadingDialog = NowLoadingDialog();
  const setEntryImage = function(entry, image, w, h) {
    const canvas = image.nodeName === 'CANVAS' ? image : compareUtil.figureUtil.canvasFromImage(image, w, h);
    view.setImage(entry.index, { image, canvas, width: w, height: h });
    entry.altViewMode = null;
    entry.orientationAsCSS = compareUtil.orientationUtil.getCSSTransform(entry.orientation);
    entry.transposed = compareUtil.orientationUtil.isTransposed(entry.orientation);
    entry.width = entry.transposed ? h : w;
    entry.height = entry.transposed ? w : h;
    entry.progress   = 100;
    entry.interpretXY = function(x, y) {
      return compareUtil.orientationUtil.interpretXY(entry.orientation, w, h, x, y);
    };
    entry.interpretXY2 = function(x, y) {
      return compareUtil.orientationUtil.interpretXY2(entry.orientation, w, h, x, y);
    };
    const leftTop = entry.interpretXY2(0, 0);
    entry.flippedX = leftTop.x !== 0;
    entry.flippedY = leftTop.y !== 0;
    //
    view.updateDOM();
    nowLoadingDialog.update();
  };
  const setEntryError = function(entry, message) {
    view.setError(entry.index, message);
    view.updateDOM();
    nowLoadingDialog.update();
  };
  const setupEntryWithDataURI = function(entry, dataURI) {
    const binary = compareUtil.binaryFromDataURI(dataURI);
    const formatInfo = compareUtil.detectImageFormat(binary);
    const format = formatInfo ? formatInfo.toString() : null;
    const isPNG  = format && 0 <= format.indexOf('PNG');
    const isJPEG = format && 0 <= format.indexOf('JPEG');
    const isGIF  = format && 0 <= format.indexOf('GIF');
    const isBMP  = format && 0 <= format.indexOf('BMP');
    entry.formatInfo = formatInfo;
    entry.format = format || (entry.fileType ? '('+entry.fileType+')' : '(unknown)');
    entry.color = (formatInfo && formatInfo.color) || '';
    if (0 <= entry.color.indexOf('RGBA') ||
        0 <= entry.color.indexOf('Alpha') ||
        0 <= entry.color.indexOf('Transparent')) {
      altView.enableAlpha();
    }
    entry.numFrames = (formatInfo && formatInfo.anim) ? formatInfo.anim.frameCount : null;
    if (isJPEG) {
      entry.orientationExif = compareUtil.detectExifOrientation(binary);
      if (!drawImageAwareOfOrientation) {
        entry.orientation = entry.orientationExif;
      }
    }
    const useCanvasToDisplay = NEEDS_IOS_EXIF_WORKAROUND && isJPEG;
    const img = new Image;
    $(img).on('load', function() {
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (entry.format === 'SVG' && (w === 0 && h === 0)) {
          w = 150;
          h = 150;
          entry.sizeUnknown = true;
        }
        const mainImage = useCanvasToDisplay ? compareUtil.figureUtil.canvasFromImage(img, w, h) : img;
        setEntryImage(entry, mainImage, w, h);
      }).
      on('error', function() {
        let message = 'Failed.';
        if (!entry.fileType || !(/^image\/.+$/.test(entry.fileType))) {
          message += ' Maybe not an image file.';
        } else if (!isPNG && !isJPEG && !isGIF && !isBMP) {
          message += ' Maybe unsupported format for the browser.';
        }
        setEntryError(entry, message);
      });
    img.src = dataURI;
  };
  const setupEntryWithCanvas = function(entry, canvas) {
    setEntryImage(entry, canvas, canvas.width, canvas.height);
  };
  const newEntry = function(file) {
      const lastModified = file.lastModified || file.lastModifiedDate;
      const entry = {
            name            : file.name,
            size            : file.size,
            fileType        : file.type,
            lastModified    : lastModified ? new Date(lastModified) : null,
            formatInfo      : null,
            format          : '',
            color           : '',
            width           : 0,
            height          : 0,
            orientationExif : null,
            orientation     : null,
            transposed      : false,
            orientationAsCSS    : '',
            view        : null,
            metrics     : [],
            progress    : 0
      };
      view.register(entry);
      return entry;
  };
  const addCapturedImage = function(canvas) {
      const file = {
        name: 'captured image',
        lastModified: Date.now()
      };
      const entry = newEntry(file);
      view.resetLayoutState();
      setupEntryWithCanvas(entry, canvas);
  };
  const addFile = function(file) {
      const entry = newEntry(file);
      nowLoadingDialog.add(entry);

      const reader = new FileReader();
      reader.onprogress = function(e) {
        if (e.lengthComputable && 0 < e.total) {
          entry.progress = Math.round(e.loaded * 100 / e.total);
        }
        nowLoadingDialog.update();
      };
      reader.onload = function(e) {
        try {
          setupEntryWithDataURI(entry, e.target.result);
        } catch (e) {
          setEntryError(entry, 'Failed. ' + (e.message || ''));
        }
      };
      reader.onerror = function(e) {
        setEntryError(entry, 'Failed. File could not be read. (' + reader.error.name + ')');
      };
      reader.readAsDataURL(file);
  };
  const addFiles = function(files) {
    const sorted = Array.from(files);
    sorted.sort(function(a, b) {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
    for (const f of sorted) {
      addFile(f);
    }
    view.resetLayoutState();
    view.updateDOM();
    nowLoadingDialog.update();
  };

  const setupDocumentLevelEventListeners = function() {
    // Drag & Drop and file selection
    $(document.body).on('dragover', function(e) {
      e.originalEvent.dataTransfer.dropEffect = 'copy';
      return false;
    });
    $(document.body).on('drop', function(e) {
      addFiles(e.originalEvent.dataTransfer.files);
      return false;
    });
    $('#file').on('change', function(e) {
      addFiles(e.target.files);
      e.target.value = null;
    });
    $('#view .dropHere').click(function() {
      $('#file').click();
    });
    // Paste clipboard image on the page (Ctrl+V)
    $(document.body).on('paste', function(e) {
      const data = e.originalEvent.clipboardData;
      if (data && data.items) {
        const files = [];
        for (let i = 0, item; item = data.items[i]; i++) {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
        if (0 < files.length) {
          addFiles(files);
          return false;
        }
      }
    });
  };

  const infoDialog = InfoDialog();
  const histogramDialog = HistogramDialog();
  const waveformDialog = WaveformDialog();
  const vectorscopeDialog = VectorscopeDialog();
  const colorDistDialog = ColorDistDialog();
  const waveform3DDialog = Waveform3DDialog();
  const colorFreqDialog = ColorFreqDialog();
  const metricsDialog = MetricsDialog();
  const toneCurveDialog = ToneCurveDialog();
  const opticalFlowDialog = OpticalFlowDialog();
  const diffDialog = DiffDialog();

  const hud = compareUI.Hud({ view, model, crossCursor });
  const colorHUD = compareUI.ColorHUD({ view, crossCursor, hud });

  const setupMenusAndDialogs = function() {
    $('#infobtn').click(infoDialog.toggle);
    $('#histogrambtn').click(histogramDialog.toggle);
    $('#waveformbtn').click(waveformDialog.toggle);
    $('#vectorscopebtn').click(vectorscopeDialog.toggle);
    $('#colordistbtn').click(colorDistDialog.toggle);
    $('#waveform3Dbtn').click(waveform3DDialog.toggle);
    $('#colorfreqbtn').click(colorFreqDialog.toggle);
    $('#metricsbtn').click(metricsDialog.toggle);
    $('#tonecurvebtn').click(toneCurveDialog.toggle);
    $('#opticalflowbtn').click(opticalFlowDialog.toggle);
    $('#diffbtn').click(diffDialog.toggle);

    viewZoom.enableMouseAndTouch('#view', 'div.imageBox', 'div.imageBox .image', '#view > div.imageBox', '.image');
    figureZoom.enableMouseAndTouch('#histogram,#waveform,#vectorscope,#opticalFlow,#diff,#toneCurve', 'td.fig', 'td.fig > *', 'div.dialog:visible td.fig', '.figMain');
    colorDistDialog.enableMouseAndTouch('#colorDist', 'td.fig', 'td.fig > *');
    waveform3DDialog.enableMouseAndTouch('#waveform3D', 'td.fig', 'td.fig > *');

    crossCursor.addObserver(
      null,
      function(pointChanged) {
        const pos = crossCursor.getNormalizedPosition();
        if (pos.isInView) {
          viewZoom.setZoomOrigin(pos);
        } else {
          viewZoom.resetZoomOrigin();
        }
      },
      function() {
        viewZoom.resetZoomOrigin();
      }
    );
    const updateNavBox = function() {
      if (!view.empty() && !dialogUtil.current()) {
        $('#navBox').show();
      } else {
        $('#navBox').hide();
      }
    };
    dialogUtil.addObserver(updateNavBox, updateNavBox);
    viewZoom.setPointCallback(function(e) {
      if (view.ready(e.index)) {
        crossCursor.enable();
        crossCursor.processClick(e);
      }
    });
    viewZoom.setDragStateCallback(function(dragging, horizontal) {
      setDragStateClass('#view', dragging, horizontal);
    });
    $('#view').on('mousemove', 'div.imageBox .image', function(e) {
      const selector = '#view > div.imageBox';
      return crossCursor.processMouseMove(e, selector, this);
    });
    figureZoom.setPointCallback(function(e) {
      if ($('#histogram').is(':visible')) {
        histogramDialog.processClick(e);
      } else if ($('#opticalFlow').is(':visible')) {
        opticalFlowDialog.processClick(e);
      }
    });
    figureZoom.setDragStateCallback(function(dragging, horizontal) {
        setDragStateClass('div.dialog', dragging, horizontal);
    });
  };

  const setupWindowLevelEventListeners = function() {
    $(window).resize(view.onResize);
    const onKeyDownOnDialogs = function(e) {
        if (e.ctrlKey || e.altKey || e.metaKey) {
          return true;
        }
        const dialog = dialogUtil.current();
        // BS (8)
        if (e.keyCode === 8 && !e.shiftKey) {
          dialog.close();
          return false;
        }
        // '1' - '9' (48-57 or 96-105 for numpad)
        if ((49 <= e.keyCode && e.keyCode <= 57 && !e.shiftKey) ||
            (97 <= e.keyCode && e.keyCode <= 105 && !e.shiftKey)) {
          const num = e.keyCode % 48;
          const sw = $(dialog.element).find('.mode-sw').eq(0).children('button:nth-child('+num+')');
          if (sw.length === 1) {
            sw.click();
            return false;
          }
          const index = view.indexFromNumber(num);
          if (($('#diff').is(':visible') || $('#opticalFlow').is(':visible') /*|| $('#toneCurve').is(':visible')*/) &&
              index !== null && view.changeTargetImage(index)) {
            dialog.update();
            return false;
          }
        }
        if ($('#vectorscope').is(':visible')) {
          if (false === vectorscopeDialog.processKeyDown(e)) {
            return false;
          }
        }
        if ($('#colorDist').is(':visible')) {
          if (false === colorDistDialog.processKeyDown(e)) {
            return false;
          }
        }
        if ($('#waveform3D').is(':visible')) {
          if (false === waveform3DDialog.processKeyDown(e)) {
            return false;
          }
        }
        // Zooming ('+'/PageUp/'-'/PageDown/cursor key)
        if (false === figureZoom.processKeyDown(e)) {
          return false;
        }
        return true;
    };
    const onKeyDownOnViews = function(e) {
      if (e.altKey || e.metaKey) {
        return true;
      }
      const shift = (e.shiftKey ? 's' : '') + (e.ctrlKey ? 'c' : '');
      // '0' - '9' (48-57 or 96-105 for numpad)
      if ((48 <= e.keyCode && e.keyCode <= 57 && shift === '') ||
          (96 <= e.keyCode && e.keyCode <= 105 && shift === '')) {
        const number = e.keyCode % 48;
        if (number === 0) {
          view.toAllImageView();
        } else {
          const index = view.indexFromNumber(number);
          if (index !== null) {
            view.toggleSingleView(index);
          }
        }
        return false;
      }
      // Cross cursor (cursor key)
      if (false === crossCursor.processKeyDown(e)) {
        return false;
      }
      // Zooming ('+'/PageUp/'-'/PageDown/cursor key)
      if (false === viewZoom.processKeyDown(e)) {
        return false;
      }
      // View switching: Cursor keys
      if ((37 <= e.keyCode || e.keyCode <= 40) &&
          ((viewZoom.scale === 1 && shift === '') || shift === 'c')) {
        if (e.keyCode === 37 || e.keyCode === 39) { // Left, Right
          if (false === view.flipSingleView(e.keyCode === 39)) {
            return false;
          }
        } else if (e.keyCode === 38 && !model.singleViewMode.isActive()) { // Up
          view.toggleSingleView();
          return false;
        } else if (e.keyCode === 40 && model.singleViewMode.isActive()) { // Down
          view.toAllImageView();
          return false;
        }
      }
      // View switching: TAB (9)
      if (e.keyCode === 9 && (shift === '' || shift === 's')) {
        if (false === view.flipSingleView(shift === '')) {
          return false;
        }
      }
      // ESC (27)
      if (e.keyCode === 27 && shift === '') {
        if (crossCursor.isEnabled()) {
          crossCursor.disable();
        } else if (altView.active()) {
          altView.reset();
          view.updateDOM();
        } else {
          view.resetLayoutState();
          view.resetMouseDrag();
          view.updateLayout();
        }
        return false;
      }
      // Delete (46)
      if (e.keyCode === 46 && shift === '' && !view.empty()) {
        const index = view.getCurrentIndexOr(view.getFrontIndex());
        view.removeEntry(index);
        return false;
      }
      //alert('keydown: '+e.keyCode);
    };
    $(window).keydown(function(e) {
      if (e.altKey || e.metaKey) {
        return true;
      }
      // ESC (27)
      const dialog = dialogUtil.current();
      if (dialog && e.keyCode === 27 && !e.shiftKey && !e.ctrlKey) {
        dialog.close();
        return false;
      }
      if (e.target.localName === 'input') {
        return true;
      }
      if (dialog) {
        return onKeyDownOnDialogs(e);
      } else {
        return onKeyDownOnViews(e);
      }
    });
    const keypressMap = {
      // '@' (64)
      64 : { global: true, func: textUtil.toggleLang },
      // '?' (63)
      63 : { global: true, func: toggleHelp },
      // 's' (115)
      115 : { global: true, func: settings.toggle },
      // 'f' (102)
      102 : { global: true, func: view.toggleFullscreen },
      // 'C' (67)
      67 : { global: true, func: cameraDialog.toggle },
      // 'a' (97)
      97 : { global: true, func: toggleAnalysis },
      // 'h' (104)
      104 : { global: true, func: histogramDialog.toggle },
      // 'w' (119)
      119 : { global: true, func: waveformDialog.toggle },
      // 'v' (118)
      118 : { global: true, func: vectorscopeDialog.toggle },
      // 'c' (99)
      99 : { global: true, func: colorDistDialog.toggle },
      // 'W' (87)
      87 : { global: true, func: waveform3DDialog.toggle },
      // 'm' (109)
      109 : { global: true, func: metricsDialog.toggle },
      // 't' (116)
      116 : { global: true, func: toneCurveDialog.toggle },
      // 'o' (111)
      111 : { global: true, func: opticalFlowDialog.toggle },
      // 'd' (100)
      100 : { global: true, func: diffDialog.toggle },
      // 'i' (105)
      105 : { global: true, func: infoDialog.toggle },
      // '/' (47)
      47 : { global: false, func: view.arrangeLayout },
      // 'O' (79)
      79: { global: false, func: view.toggleOverlay },
      // 'n' (110)
      110 : { global: false, func: roiMap.toggle },
      // 'g' (103)
      103 : { global: true, func: grid.toggle },
      // 'p' (112)
      112 : { global: false, func: crossCursor.toggle },
      // 'q' (113)
      113 : { global: false, func: altView.changeMode },
      // 'Q' (81)
      81 : { global: false, func: altView.changeModeReverse },
      // 'l' (108)
      108 : { global: false, func: altView.toggleContour },
      // 'b' (98)
      98 : { global: false, func: settings.openBGColor },
      // 'u'
      117 : { global: true, func: colorFreqDialog.toggle }
    };
    $(window).keypress(function(e) {
      if (e.altKey || e.metaKey || e.target.localName === 'input') {
        return true;
      }
      const m = keypressMap[e.which];
      if (dialogUtil.current() && (!m || !m.global)) {
        return true;
      }
      if (m) {
        m.func();
        return false;
      }
      //alert('keypress: '+e.which);
    });
  };

$(function() {
  settings.startup();

  setupDocumentLevelEventListeners();
  setupWindowLevelEventListeners();
  setupMenusAndDialogs();

  hud.initialize();
  colorHUD.initialize();

  view.updateDOM();
});
