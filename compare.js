$( function() {
  // Check for the various File API support.
  if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
    alert('The File APIs are not fully supported in this browser.');
  }
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
    var data = e.originalEvent.clipboardData;
    if (data && data.items) {
      var files = [];
      for (var i = 0, item; item = data.items[i]; i++) {
        var file = item.getAsFile();
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

  // Menus and dialogs
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
  $('.swapbtn').click(swapBaseAndTargetImage);

  $(window).resize(viewManagement.onResize);
  var onKeyDownOnDialogs = function(e) {
        if (e.ctrlKey || e.altKey || e.metaKey) {
          return true;
        }
        // BS (8)
        if (e.keyCode === 8 && !e.shiftKey) {
          dialog.close();
          return false;
        }
        // '1' - '9' (48-57 or 96-105 for numpad)
        if ((49 <= e.keyCode && e.keyCode <= 57 && !e.shiftKey) ||
            (97 <= e.keyCode && e.keyCode <= 105 && !e.shiftKey)) {
          var num = e.keyCode % 48;
          var sw = $(dialog.element).find('.mode-sw').eq(0).children('button:nth-child('+num+')');
          if (sw.length === 1) {
            sw.click();
            return false;
          }
          var index = viewManagement.indexFromNumber(num);
          if (($('#diff').is(':visible') || $('#opticalFlow').is(':visible') /*|| $('#toneCurve').is(':visible')*/) &&
              index !== null && changeTargetImage(index)) {
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
  var onKeyDownOnViews = function(e) {
      if (e.altKey || e.metaKey) {
        return true;
      }
      var shift = (e.shiftKey ? 's' : '') + (e.ctrlKey ? 'c' : '');
      // '0' - '9' (48-57 or 96-105 for numpad)
      if ((48 <= e.keyCode && e.keyCode <= 57 && shift === '') ||
          (96 <= e.keyCode && e.keyCode <= 105 && shift === '')) {
        var number = e.keyCode % 48;
        if (number === 0) {
          viewManagement.toAllImageView();
        } else {
          var index = viewManagement.indexFromNumber(number);
          if (index !== null) {
            viewManagement.toggleSingleView(index);
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
          if (false === viewManagement.flipSingleView(e.keyCode === 39)) {
            return false;
          }
        } else if (e.keyCode === 38 && !viewManagement.isSingleView()) { // Up
          viewManagement.toggleSingleView();
          return false;
        } else if (e.keyCode === 40 && viewManagement.isSingleView()) { // Down
          viewManagement.toAllImageView();
          return false;
        }
      }
      // View switching: TAB (9)
      if (e.keyCode === 9 && (shift === '' || shift === 's')) {
        if (false === viewManagement.flipSingleView(shift === '')) {
          return false;
        }
      }
      // ESC (27)
      if (e.keyCode === 27 && shift === '') {
        if (crossCursor.isEnabled()) {
          crossCursor.disable();
        } else if (altView.active()) {
          altView.reset();
          updateDOM();
        } else {
          viewManagement.resetLayoutState();
          resetMouseDrag();
          updateLayout();
        }
        return false;
      }
      // Delete (46)
      if (e.keyCode === 46 && shift === '' && 0 < images.length) {
        var index = viewManagement.getCurrentIndexOr(images[0].index);
        removeEntry(index);
        return false;
      }
      //alert('keydown: '+e.keyCode);
  };
  $(window).keydown(function(e) {
      if (e.altKey || e.metaKey) {
        return true;
      }
      // ESC (27)
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
  
  var keypressMap = {
    // '@' (64)
    64 : { global: true, func: textUtil.toggleLang },
    // '?' (63)
    63 : { global: true, func: toggleHelp },
    // 's' (115)
    115 : { global: true, func: settings.toggle },
    // 'f' (102)
    102 : { global: true, func: toggleFullscreen },
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
    47 : { global: false, func: viewManagement.arrangeLayout },
    // 'O' (79)
    79: { global: false, func: viewManagement.toggleOverlay },
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
    var m = keypressMap[e.which];
    if (dialog && (!m || !m.global)) {
      return true;
    }
    if (m) {
      m.func();
      return false;
    }
    //alert('keypress: '+e.which);
  });
  
  viewZoom.enableMouseAndTouch('#view', 'div.imageBox', 'div.imageBox .image', '#view > div.imageBox', '.image');
  figureZoom.enableMouseAndTouch('#histogram,#waveform,#vectorscope,#opticalFlow,#diff,#toneCurve', 'td.fig', 'td.fig > *', 'div.dialog:visible td.fig', '.figMain');
  colorDistDialog.enableMouseAndTouch('#colorDist', 'td.fig', 'td.fig > *');
  waveform3DDialog.enableMouseAndTouch('#waveform3D', 'td.fig', 'td.fig > *');

  crossCursor.addObserver(
    null,
    function(pointChanged) {
      if (pointChanged) {
        var pos = crossCursor.getNormalizedPosition();
        viewZoom.setZoomOrigin(pos);
      }
    },
    function() {
      viewZoom.resetZoomOrigin();
    }
  );
  var updateNavBox = function() {
    if (1 <= images.length && !dialog) {
      $('#navBox').show();
    } else {
      $('#navBox').hide();
    }
  };
  dialogUtil.addObserver(updateNavBox, updateNavBox);
  viewZoom.setPointCallback(function(e) {
    if (entries[e.index].ready()) {
      crossCursor.enable();
      crossCursor.processClick(e);
    }
  });
  viewZoom.setDragStateCallback(function(dragging, horizontal) {
    setDragStateClass('#view', dragging, horizontal);
  });
  $('#view').on('mousemove', 'div.imageBox .image', function(e) {
    var selector = '#view > div.imageBox';
    return crossCursor.processMouseMove(e, selector, this);
  });
  figureZoom.setPointCallback(function(e) {
    if ($('#opticalFlow').is(':visible')) {
      opticalFlowDialog.processClick(e);
    }
  });
  figureZoom.setDragStateCallback(function(dragging, horizontal) {
    setDragStateClass('div.dialog', dragging, horizontal);
  });

  hud.initialize();
  colorHUD.initialize();

  updateDOM();
});

  var entries = [];
  var images = [];
  var viewZoom = compareUtil.makeZoomController(updateTransform, {
    getBaseSize: function(index) {
      if (entries[index] && entries[index].ready()) {
        return { w: entries[index].baseWidth, h: entries[index].baseHeight };
      }
    }
  });
  var dialog = null;
  var figureZoom = compareUtil.makeZoomController(function() {
    if (dialog && dialog.update) {
      dialog.update(true /* transformOnly */);
    }
  }, {
    cursorMoveDelta: 0.125
  });
  var baseImageIndex = null;
  var targetImageIndex = null;
  var setDragStateClass = function(target, dragging, horizontal) {
    if (dragging) {
      $(target).addClass('dragging');
    } else {
      $(target).removeClass('dragging');
    }
    if (horizontal) {
      $(target).addClass('horizontal-dragging');
    } else {
      $(target).removeClass('horizontal-dragging');
    }
  };

  var textUtil = (function() {
    var toggleLang = function() {
      var lang = $(document.body).attr('class') === 'ja' ? 'en' : 'ja';
      $('#selectLang').val(lang);
      changeLang(lang);
    };
    var setText = function(target, text) {
      for (var i = 0, lang; lang = ['en', 'ja'][i]; ++i) {
        var e = target.find('.' + lang);
        if (0 === e.length) {
          e = $('<span>').addClass(lang);
          target.append(e);
        }
        e.text(text[lang]);
      }
      return target;
    };
    return {
      toggleLang: toggleLang,
      setText: setText
    };
  })();
  // View management functions
  var viewManagement = (function() {
    var IMAGEBOX_MIN_SIZE = 32;
    var IMAGEBOX_MARGIN_W = 6, IMAGEBOX_MARGIN_H = 76;
    var currentImageIndex = 0;
    var lastSingleViewImageIndex = 0;
    var singleView = false;
    var overlayMode = false;
    var overlayBaseIndex = null;
    var layoutMode = null;
    var backgroundColor = '#000000';
    var imageScaling = 'smooth';
    $('#prev').click(function() { viewManagement.flipSingleView(false); });
    $('#next').click(function() { viewManagement.flipSingleView(true); });
    var isSingleView = function() {
      return singleView;
    };
    var isOverlayMode = function() {
      return overlayMode;
    };
    var numberFromIndex = function(index) {
      for (var i = 0, img; img = images[i]; i++) {
        if (img.index === index) {
          return i + 1;
        }
      }
      return null;
    };
    var indexFromNumber = function(number) {
      if (1 <= number && number <= images.length) {
        return images[number - 1].index;
      }
      return null;
    };
    var getSelectedImageIndices = function() {
      var indices = [];
      if (singleView) {
        indices.push(currentImageIndex - 1);
        if (overlayMode && overlayBaseIndex !== currentImageIndex - 1) {
          indices.push(overlayBaseIndex);
        }
      }
      return indices;
    };
    var getLayoutMode = function() {
      return layoutMode;
    };
    var resetLayoutState = function() {
      currentImageIndex = 0;
      viewZoom.setZoom(0);
      viewZoom.setOffset(0.5, 0.5);
      overlayMode = false;
    };
    var toAllImageView = function() {
      currentImageIndex = 0;
      updateLayout();
    };
    var toSingleImageView = function(index) {
      var prevImageIndex = currentImageIndex;
      if (index === null ||
          !entries[index].visible) {
        currentImageIndex = 0;
      } else {
        currentImageIndex = index + 1;
        lastSingleViewImageIndex = currentImageIndex;
      }
      if (prevImageIndex !== currentImageIndex) {
        updateLayout();
      }
    };
    var toggleSingleView = function(index) {
      if (index === null || index === undefined) {
        if (0 === lastSingleViewImageIndex) {
          flipSingleView(true);
          return;
        }
        index = lastSingleViewImageIndex - 1;
      }
      if (index + 1 === currentImageIndex) {
        toAllImageView();
      } else {
        toSingleImageView(index);
      }
    };
    var flipSingleView = function(forward) {
      if (0 < images.length) {
        var k = forward ? 0 : images.length - 1;
        for (var i = 0, img; img = images[i]; i++) {
          if (currentImageIndex === 1 + img.index) {
            if (forward) {
              k = (i + 1) % images.length;
            } else {
              k = (i + images.length - 1) % images.length;
            }
            break;
          }
        }
        currentImageIndex = 1 + images[k].index;
        lastSingleViewImageIndex = currentImageIndex;
        updateLayout();
        return false;
      }
    };
    var onResize = function() {
      layoutMode = null;
      updateLayout();
    };
    var arrangeLayout = function() {
      if (singleView) {
        currentImageIndex = 0;
      } else if (layoutMode === 'x') {
        layoutMode = 'y';
      } else {
        layoutMode = 'x';
      }
      updateLayout();
    };
    var toggleOverlay = function() {
      if (!overlayMode && 2 <= images.length) {
        if (currentImageIndex <= images[0].index + 1 || entries.length < currentImageIndex) {
          currentImageIndex = images[1].index + 1;
          lastSingleViewImageIndex = currentImageIndex;
        }
        overlayMode = true;
        overlayBaseIndex = images[0].index;
        updateLayout();
      } else if (overlayMode) {
        currentImageIndex = overlayBaseIndex + 1;
        lastSingleViewImageIndex = currentImageIndex;
        overlayMode = false;
        updateLayout();
      }
    };
    var update = function() {
      singleView =
              currentImageIndex !== 0 &&
              currentImageIndex <= entries.length;
      if (!singleView && overlayMode) {
        overlayMode = false;
      }
      if (layoutMode === null) {
        layoutMode = $('#view').width() < $('#view').height() ? 'y' : 'x';
      }
    };
    var getCurrentIndexOr = function(defaultIndex) {
      return singleView ? currentImageIndex - 1 : defaultIndex;
    };
    var makeImageLayoutParam = function() {
      var numVisibleEntries = entries.filter(function(ent,i,a) { return ent.visible; }).length;
      var numSlots = singleView ? 1 : Math.max(numVisibleEntries, 2);
      var numColumns = layoutMode === 'x' ? numSlots : 1;
      var numRows    = layoutMode !== 'x' ? numSlots : 1;
      var viewW = $('#view').width();
      var viewH = $('#view').height();
      var boxW = viewW / numColumns;
      var boxH = viewH / numRows;
      boxW = compareUtil.clamp(boxW, IMAGEBOX_MIN_SIZE, boxW - IMAGEBOX_MARGIN_W);
      boxH = compareUtil.clamp(boxH, IMAGEBOX_MIN_SIZE, boxH - IMAGEBOX_MARGIN_H);
      return {
        numVisibleEntries: numVisibleEntries,
        numSlots: numSlots,
        viewW: viewW, viewH: viewH,
        boxW: boxW, boxH: boxH
      };
    };
    var updateImageBox = function(box, img, boxW, boxH) {
      if (img.element) {
        img.boxW = boxW;
        img.boxH = boxH;
        var rect = compareUtil.calcInscribedRect(boxW, boxH, img.width, img.height);
        img.baseWidth = rect.width;
        img.baseHeight = rect.height;
        var w = img.transposed ? rect.height : rect.width;
        var h = img.transposed ? rect.width : rect.height;
        $(img.element).css({ width: w+'px', height: h+'px' });
        altView.onUpdateImageBox(img, w, h);
        grid.onUpdateImageBox(img, w, h);
        crossCursor.onUpdateImageBox(img, w, h);
        hud.onUpdateImageBox(img);
      }
      var index = img.index;
      var isOverlay = overlayMode && index + 1 === currentImageIndex && index !== overlayBaseIndex;
      $(box).css({
        display : '',
        position : overlayMode ? 'absolute' : '',
        width : overlayMode ? $('#view').width() + 'px' : '',
        height : overlayMode ? $('#view').height() + 'px' : '',
        opacity : isOverlay ? '0.5' : '',
        background : overlayMode ? '#000' : ''
      });
    };
    var updateImageScaling = function() {
      if (imageScaling === 'pixel') {
        $('#view .imageBox .image').addClass('pixelated');
      } else {
        $('#view .imageBox .image').removeClass('pixelated');
      }
    };
    var onUpdateLayout = function() {
      var param = makeImageLayoutParam();
      var indices = getSelectedImageIndices();
      $('#view').css({ flexDirection : layoutMode === 'x' ? 'row' : 'column' });
      $('#viewHud').css('width', param.viewW);
      if (1 <= images.length && !dialog) {
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
        var hide = singleView && 0 > indices.indexOf(index);
        var img = entries[index];
        if (hide || !img || !img.visible) {
          $(this).css({ display : 'none' });
        } else {
          updateImageBox(this, img, param.boxW, param.boxH);
        }
      });
      $('#view > div.emptyBox').each(function(index) {
        var hide = singleView || param.numVisibleEntries + index >= param.numSlots;
        $(this).css({ display : (hide ? 'none' : '') });
      });
      updateImageScaling();
    };
    var updateEmptyBoxTextColor = function() {
      if ($('#view').hasClass('useChecker')) {
        var textColor = '#222';
      } else {
        var rgb = parseInt(backgroundColor.substr(1), 16);
        var y = 0.299 * (rgb>>16) + 0.587 * ((rgb>>8)&255) + 0.114 * (rgb&255);
        var textColor = (96 <= y) ? '#444' : '#888';
      }
      $('#view .dropHere').css({color: textColor, borderColor: textColor});
    };
    var setBackgroundColor = function(color) {
      backgroundColor = color;
      $('#view').css({'background-color': color});
      updateEmptyBoxTextColor();
    };
    var setCheckerPattern = function(enable) {
      enable ? $('#view').addClass('useChecker') : $('#view').removeClass('useChecker');
      updateEmptyBoxTextColor();
    };
    var setImageScaling = function(type) {
      imageScaling = type;
      updateImageScaling();
    };
    return {
      isSingleView: isSingleView,
      isOverlayMode: isOverlayMode,
      numberFromIndex: numberFromIndex,
      indexFromNumber: indexFromNumber,
      getSelectedImageIndices: getSelectedImageIndices,
      getLayoutMode: getLayoutMode,
      resetLayoutState: resetLayoutState,
      toAllImageView: toAllImageView,
      toSingleImageView: toSingleImageView,
      toggleSingleView: toggleSingleView,
      flipSingleView: flipSingleView,
      onResize: onResize,
      arrangeLayout: arrangeLayout,
      toggleOverlay: toggleOverlay,
      update: update,
      getCurrentIndexOr: getCurrentIndexOr,
      makeImageLayoutParam: makeImageLayoutParam,
      onUpdateLayout: onUpdateLayout,
      setBackgroundColor: setBackgroundColor,
      setCheckerPattern: setCheckerPattern,
      setImageScaling: setImageScaling
    };
  })();
  var removeEntry = function(index) {
    var ent = entries[index];
    if (ent && !ent.loading && ent.visible) {
      ent.visible = false;
      if (ent.element) {
        $(ent.view).remove('.image');
        ent.element = null;
      }
      if (baseImageIndex === index) {
        baseImageIndex = null;
      }
      if (targetImageIndex === index) {
        targetImageIndex = null;
      }
      crossCursor.onRemoveEntry(index);
      toneCurveDialog.onRemoveEntry(index);
      opticalFlowDialog.onRemoveEntry(index);
      diffDialog.onRemoveEntry(index);
      ent.mainImage = null;
      ent.asCanvas = null;
      ent.imageData = null;
      ent.histogram = null;
      ent.waveform = null;
      ent.vectorscope = null;
      ent.colorTable = null;
      ent.colorDist = null;
      ent.colorDistAxes = null;
      ent.waveform3D = null;
      ent.waveform3DFig = null;
      ent.waveform3DFigAxes = null;
      ent.reducedColorTable = null;
      discardTasksOfEntryByIndex(index);
      viewManagement.resetLayoutState();
      updateDOM();
    }
  };
  var findImageIndexOtherThan = function(index) {
    for (var i = 0, img; img = images[i]; ++i) {
      if (img.index !== index) {
        return img.index;
      }
    }
    return null;
  };
  var setBaseAndTargetImage = function(baseIndex, targetIndex) {
    if (baseIndex === null && targetIndex === null) {
      baseImageIndex = baseImageIndex === null ? images[0].index : baseImageIndex;
      if (targetImageIndex === null || baseImageIndex === targetImageIndex) {
        targetImageIndex = findImageIndexOtherThan(baseImageIndex);
      }
    } else {
      baseImageIndex = baseIndex !== null ? baseIndex : baseImageIndex;
      targetImageIndex = targetIndex !== null ? targetIndex : targetImageIndex;
      if (baseImageIndex === targetImageIndex) {
        if (targetIndex === null) {
          targetImageIndex = findImageIndexOtherThan(baseImageIndex);
        } else if (baseIndex === null) {
          baseImageIndex = findImageIndexOtherThan(targetImageIndex);
        }
      }
    }
  };
  var changeBaseImage = function(index) {
    if (index < entries.length &&
        entries[index].ready() &&
        baseImageIndex !== null &&
        baseImageIndex !== index) {
      setBaseAndTargetImage(index, null);
      return true;
    }
  };
  var changeTargetImage = function(index) {
    if (index < entries.length &&
        entries[index].ready() &&
        baseImageIndex !== null && targetImageIndex !== null &&
        targetImageIndex !== index) {
      setBaseAndTargetImage(targetImageIndex, index);
      return true;
    }
  };
  var makeImageNameWithIndex = function(tag, img) {
    var number = viewManagement.numberFromIndex(img.index);
    var elem = $(tag).css({ wordBreak : 'break-all' });
    if (number !== null) {
      elem.append($('<span class="imageIndex"/>').text(number));
    }
    return elem.append($('<span/>').text(img.name));
  };

  // ROI map
  var roiMap = (function() {
    var enableMap = false;
    var toggle = function() {
      if (!enableMap) {
        if (0 < images.length) {
          enableMap = true;
          updateLayout();
        }
      } else {
        enableMap = false;
        updateLayout();
      }
    };
    var onUpdateLayout = function() {
      $('#map').css({ display : (enableMap && images.length) ? 'block' : '' });
    };
    var updateMap = function(img) {
      var roiW = img.boxW / (img.baseWidth * viewZoom.scale);
      var roiH = img.boxH / (img.baseHeight * viewZoom.scale);
      var center = viewZoom.getCenter();
      $('#mapROI').attr({
        x : 100 * (0.5 + center.x - 0.5 * roiW) + '%',
        y : 100 * (0.5 + center.y - 0.5 * roiH) + '%',
        width : (100 * roiW)+'%',
        height : (100 * roiH)+'%'
      });
      var s = 120 / Math.max(img.width, img.height);
      var w = img.width * s;
      var h = img.height * s;
      $('#map svg').width(w).height(h);
      $('#map').width(w).height(h);
    };
    var onUpdateTransform = function() {
      if (enableMap && images.length) {
        var index = viewManagement.getCurrentIndexOr(0);
        var img = entries[index].ready() ? entries[index] : images[0];
        updateMap(img);
      }
    };
    return {
      toggle: toggle,
      onUpdateLayout: onUpdateLayout,
      onUpdateTransform: onUpdateTransform
    };
  })();
  var makeImageOverlayOnUpdateLayout = function(key, make) {
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
  // Grid
  var grid = (function() {
    var enableGrid = false;
    var mainGridInterval = 100;
    var auxGridInterval = 10;
    var onChangeCallback = null;
    var toggle = function() {
      enableGrid = !enableGrid;
      enableGrid ? $('#gridbtn').addClass('current') : $('#gridbtn').removeClass('current');
      updateLayout();
      if (onChangeCallback) {
        onChangeCallback();
      }
    };
    var setInterval = function(main, aux) {
      if (mainGridInterval !== main || auxGridInterval !== aux) {
        mainGridInterval = main;
        auxGridInterval = aux;
        for (var i = 0, img; img = images[i]; i++) {
          if (img.grid) {
            $(img.grid).remove();
            img.grid = null;
          }
        }
        if (updateLayout) {
          updateLayout();
        }
        if (onChangeCallback) {
          onChangeCallback();
        }
      }
    };
    var setOnChange = function(onchange) {
      onChangeCallback = onchange;
    };
    var makePathDesc = function(size, step, skip) {
      var desc = '';
      for (var k = step; k < size.w; k += step) {
        if (skip && (k % skip) === 0) continue;
        desc += 'M ' + k + ',0 l 0,' + size.h + ' ';
      }
      for (var k = step; k < size.h; k += step) {
        if (skip && (k % skip) === 0) continue;
        desc += 'M 0,' + k + ' l ' + size.w + ',0 ';
      }
      return desc;
    };
    var makeGrid = function(w, h) {
      var size = { w: w, h: h };
      var vbox = '0 0 ' + w + ' ' + h;
      var mainGrid = makePathDesc(size, mainGridInterval);
      var auxGrid = makePathDesc(size, auxGridInterval, mainGridInterval);
      return $(
        '<svg class="imageOverlay grid" viewBox="' + vbox + '">' +
          '<path stroke="white" fill="none" stroke-width="0.5" opacity="0.6" d="' + mainGrid + '"></path>' +
          '<path stroke="white" fill="none" stroke-width="0.5" opacity="0.6" d="' + auxGrid + '"></path>' +
        '</svg>'
      ).width(w).height(h);
    };
    var onUpdateLayoutImpl = makeImageOverlayOnUpdateLayout('grid', makeGrid);
    var onUpdateImageBox = function(img, w, h) {
      onUpdateLayoutImpl(enableGrid, img, w, h);
    };
    var updateGridStyle = function(grid, width, baseWidth, scale, commonStyle) {
      var base = 0.5 * width / (baseWidth * scale);
      var strokeWidth = [
          (base > 0.5 ? 1 : base > 0.1 ? 3.5 - base * 5 : 3) * base,
          (base > 0.5 ? 0 : 1) * base];
      var opacity = [
          0.6,
          base > 0.5 ? 0 : base > 0.1 ? (0.6 - base) / 0.5 : 1];
      $(grid).css(commonStyle || {}).find('path').each(function(index) {
        $(this).
            attr('stroke-width', strokeWidth[index]).
            attr('opacity', opacity[index]);
      });
    };
    var onUpdateTransform = function(ent, commonStyle) {
      if (ent.grid) {
        updateGridStyle(ent.grid, ent.width, ent.baseWidth, viewZoom.scale, commonStyle);
      }
    };
    return {
      toggle: toggle,
      isEnabled: function() { return enableGrid; },
      setInterval: setInterval,
      setOnChange: setOnChange,
      makeGrid: makeGrid,
      updateGridStyle: updateGridStyle,
      onUpdateImageBox: onUpdateImageBox,
      onUpdateTransform: onUpdateTransform
    };
  })();

  // Cross Cursor
  var crossCursor = (function() {
    var enableCrossCursor = false;
    var primaryIndex = null;
    var fixedPosition = false;
    var positions = [];
    var onShowCallback = [];
    var onUpdateCallback = [];
    var onRemoveCallback = [];
    var makeInitialPosition = function(index) {
      var img = entries[index];
      var center = viewZoom.getCenter();
      var x = (0.5 + center.x) * img.width;
      var y = (0.5 + center.y) * img.height;
      return { x: x, y: y };
    };
    var addObserver = function(onShow, onUpdate, onRemove) {
      if (onShow) {
        onShowCallback.push(onShow);
      }
      if (onUpdate) {
        onUpdateCallback.push(onUpdate);
      }
      if (onRemove) {
        onRemoveCallback.push(onRemove);
      }
    };
    var enable = function() {
      var index = viewManagement.getCurrentIndexOr(0 < images.length ? images[0].index : -1);
      if (!enableCrossCursor && 0 <= index) {
        enableCrossCursor = true;
        primaryIndex = index;
        fixedPosition = false;
        onShowCallback.forEach(function(val) { val(); });
        var pos = makeInitialPosition(index);
        setPosition(index, pos.x, pos.y);
        updateLayout();
      }
      return enableCrossCursor;
    };
    var disable = function() {
      if (enableCrossCursor) {
        enableCrossCursor = false;
        onRemoveCallback.forEach(function(val) { val(); });
        primaryIndex = null;
        updateLayout();
      }
    };
    var toggle = function() {
      if (!enableCrossCursor) {
        enable();
      } else {
        disable();
      }
    };
    var getPosition = function(index) {
      index = index !== undefined ? index : primaryIndex;
      return positions[index];
    };
    var setIndex = function(index, fixed) {
      primaryIndex = index;
      fixedPosition = fixed;
    };
    var getIndex = function() {
      return primaryIndex;
    };
    var getNormalizedPosition = function() {
      return {
        x: (0.5 + positions[primaryIndex].x) / entries[primaryIndex].width,
        y: (0.5 + positions[primaryIndex].y) / entries[primaryIndex].height
      };
    };
    var isFixed = function() {
      return fixedPosition;
    };
    var onRemoveEntry = function(index) {
      if (enableCrossCursor && primaryIndex === index) {
        primaryIndex = null;
        for (var i = 0; i < images.length; i++) {
          if (index !== images[i].index) {
            primaryIndex = images[i].index;
            break;
          }
        }
        if (primaryIndex === null) {
          enableCrossCursor = false;
          onRemoveCallback.forEach(function(val) { val(); });
        }
      }
    };
    var makePathDesc = function(img, x, y) {
      var pos = img.interpretXY(x, y);
      var desc = '';
      desc += 'M ' + pos.x + ',0 l 0,' + img.canvasHeight + ' ';
      desc += 'M ' + (pos.x + 1) + ',0 l 0,' + img.canvasHeight + ' ';
      desc += 'M 0,' + pos.y + ' l ' + img.canvasWidth + ',0 ';
      desc += 'M 0,' + (pos.y + 1) + ' l ' + img.canvasWidth + ',0 ';
      return desc;
    };
    var makeLabelAttr = function(img, x, y) {
      var attr = makeLabelAttrOnTransform(img, x, y);
      attr[0]['text-anchor'] = img.width * 0.9 < x ? 'end' : '';
      if (compareUtil.browserName === 'msie' || compareUtil.browserName === 'edge') {
        attr[0]['dy'] = '40%';
        attr[1]['dy'] = img.height * 0.9 < y ? '0%' : '40%';
      } else {
        attr[0]['dominant-baseline'] = 'hanging';
        attr[1]['dominant-baseline'] = img.height * 0.9 < y ? 'alphabetic' : 'hanging';
      }
      return attr;
    };
    var makeLabelAttrOnTransform = function(ent, x, y) {
      var baseScale = ent.width / (ent.baseWidth * viewZoom.scale);
      var roiW = ent.boxW / (ent.baseWidth * viewZoom.scale);
      var roiH = ent.boxH / (ent.baseHeight * viewZoom.scale);
      var center = viewZoom.getCenter();
      var roi = [
          ent.width * compareUtil.clamp(0.5 + center.x - 0.5 * roiW, 0, 1),
          ent.height * compareUtil.clamp(0.5 + center.y - 0.5 * roiH, 0, 1)
          //ent.width * compareUtil.clamp(0.5 + center.x + 0.5 * roiW, 0, 1),
          //ent.height * compareUtil.clamp(0.5 + center.y + 0.5 * roiH, 0, 1)
      ];
      var sx = ent.flippedX ? -1 : 1;
      var sy = ent.flippedY ? -1 : 1;
      var pos = ent.interpretXY2(x, y);
      var base = ent.interpretXY2(0, 0);
      base.x += sx * (ent.transposed ? roi[1] : roi[0]);
      base.y += sy * (ent.transposed ? roi[0] : roi[1]);
      var t0 = 'translate(' + pos.x + ' ' + base.y + ') ';
      var t1 = 'translate(' + base.x + ' ' + pos.y + ') ';
      var s = 'scale(' + baseScale * sx + ' ' + baseScale * sy + ')';
      var m = ent.transposed ? ' matrix(0 1 1 0 0 0)' : '';
      var a0 = { transform: t0 + s + m }, a1 = { transform: t1 + s + m };
      return ent.transposed ? [a1, a0] : [a0, a1];
    };
    var addCrossCursor = function(img, desc) {
      var size = { w: img.canvasWidth, h: img.canvasHeight };
      var vbox = '0 0 ' + size.w + ' ' + size.h;
      var filter_id = 'drop-shadow' + img.index;
      var textElem = '<text filter="url(#' + filter_id + ')"></text>';
      img.cursor = $(
        '<svg class="imageOverlay cursor" viewBox="' + vbox + '" style="overflow:visible">' +
          '<defs><filter id="' + filter_id + '">' +
            '<feGaussianBlur in="SourceAlpha" result="shadow" stdDeviation="1.5"></feGaussianBlur>' +
            '<feBlend in="SourceGraphic" in2="shadow" mode="normal"></feBlend>' +
          '</filter></defs>' +
          '<path stroke="black" fill="none" stroke-width="0.2" opacity="0.1" d="' + desc + '"></path>' +
          '<path stroke="white" fill="none" stroke-width="0.1" opacity="0.6" d="' + desc + '"></path>' +
          '<g class="labels" font-size="16" fill="white">' +
          textElem + textElem + '</g>' +
        '</svg>').
        width(size.w).
        height(size.h);
      img.view.append(img.cursor);
    };
    var removeCrossCursor = function(img) {
      if (img.cursor) {
        $(img.cursor).remove();
        img.cursor = null;
      }
    };
    var updateCrossCursor = function(img, x, y) {
      if (!img.element) {
        return;
      }
      x = compareUtil.clamp(x, 0, img.width - 1);
      y = compareUtil.clamp(y, 0, img.height - 1);
      positions[img.index] = { x: x, y: y, fixed: fixedPosition };
      var desc = makePathDesc(img, x, y);
      var labelsAttr = makeLabelAttr(img, x, y);
      if (0 === img.view.find('.cursor').length) {
        addCrossCursor(img, desc);
      } else {
        img.cursor.find('path').attr('d', desc);
      }
      img.cursor.find('path').attr('stroke-dasharray', fixedPosition ? 'none' : '4,1');
      img.cursor.find('g.labels text').each(function(i) {
        $(this).attr(labelsAttr[i]).text(i === 0 ? x : y);
      });
    };
    var setPosition = function(index, x, y, fixed) {
      fixed = fixed !== undefined ? fixed : fixedPosition;
      var rx = (Math.floor(x) + 0.5) / entries[index].width;
      var ry = (Math.floor(y) + 0.5) / entries[index].height;
      setIndex(index, fixed);
      for (var i = 0, img; img = images[i]; i++) {
        var ix = compareUtil.clamp(Math.floor(rx * img.width), 0, img.width - 1);
        var iy = compareUtil.clamp(Math.floor(ry * img.height), 0, img.height - 1);
        updateCrossCursor(img, ix, iy);
      }
      onUpdateCallback.forEach(function(val) { val(true); });
    };
    var adjustViewOffsetToFollowCrossCursor = function(dx, dy, x, y) {
      var img = entries[primaryIndex];
      var center = viewZoom.getCenter();
      var rx = (x - (0.5 + center.x) * img.width) / (img.width / viewZoom.scale);
      var ry = (y - (0.5 + center.y) * img.height) / (img.height / viewZoom.scale);
      if (0.45 < Math.abs(rx) && 0 < dx * rx) {
        var delta = Math.max(0.25, Math.abs(rx) - 0.45);
        viewZoom.moveRelative(0 < rx ? delta : -delta, 0);
      }
      if (0.45 < Math.abs(ry) && 0 < dy * ry) {
        var delta = Math.max(0.25, Math.abs(ry) - 0.45);
        viewZoom.moveRelative(0, 0 < ry ? delta : -delta);
      }
    };
    var processKeyDown = function(e) {
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return true;
      }
      if (enableCrossCursor) {
        // cursor key
        if (37 <= e.keyCode && e.keyCode <= 40) {
          var index = viewManagement.getCurrentIndexOr(primaryIndex);
          if (index < 0 || !positions[index]) {
            index = primaryIndex;
          }
          var step = e.shiftKey ? 10 : 1;
          var pos = getPosition(index);
          var d = compareUtil.cursorKeyCodeToXY(e.keyCode, step);
          var x = pos.x + d.x;
          var y = pos.y + d.y;
          setPosition(index, x, y);
          adjustViewOffsetToFollowCrossCursor(d.x, d.y, x, y);
          return false;
        }
      }
    };
    var processClick = function(e) {
      var pos = getPosition(e.index);
      var ent = entries[e.index];
      var x = compareUtil.clamp(Math.floor(e.x * ent.width), 0, ent.width - 1);
      var y = compareUtil.clamp(Math.floor(e.y * ent.height), 0, ent.height - 1);
      var fixed;
      if (pos && pos.x === x && pos.y === y) {
        fixed = !pos.fixed;
      } else {
        fixed = true;
      }
      setPosition(e.index, x, y, fixed);
    };
    var processMouseMove = function(e, selector, target) {
      if (enableCrossCursor && !fixedPosition) {
        var index = selector ? $(selector).index($(target).parent()) : null;
        var pos = viewZoom.positionFromMouseEvent(e, target, index);
        if (index !== null && entries[index].ready() && pos) {
          var ent = entries[index];
          var x = pos.x * ent.width;
          var y = pos.y * ent.height;
          setPosition(index, x, y);
        }
      }
    };
    var onUpdateImageBox = function(img, w, h) {
      if (enableCrossCursor) {
        var pos = positions[img.index];
        var x = pos ? (pos.x || 0) : 0;
        var y = pos ? (pos.y || 0) : 0;
        updateCrossCursor(img, x, y);
      } else {
        removeCrossCursor(img);
      }
      if (img.cursor) {
        $(img.cursor).css({ width: w+'px', height: h+'px' });
      }
    };
    var onUpdateTransformEach = function(ent, commonStyle) {
      if (ent.cursor) {
        var baseScale = ent.width / (ent.baseWidth * viewZoom.scale);
        $(ent.cursor).css(commonStyle).find('path').each(function(i) {
          $(this).attr('stroke-width', baseScale * [2, 1][i]);
        });
        var pos = positions[ent.index];
        var attr = makeLabelAttrOnTransform(ent, pos.x, pos.y);
        $(ent.cursor).find('g.labels text').each(function(i) {
          $(this).attr(attr[i]);
        });
      }
    };
    var onUpdateTransform = function() {
      if (enableCrossCursor) {
        onUpdateCallback.forEach(function(val) { val(false); });
      }
    };
    return {
      addObserver: addObserver,
      enable: enable,
      disable: disable,
      toggle: toggle,
      isEnabled: function() { return enableCrossCursor; },
      getPosition: getPosition,
      getIndex: getIndex,
      getNormalizedPosition: getNormalizedPosition,
      isFixed: isFixed,
      onRemoveEntry: onRemoveEntry,
      setPosition: setPosition,
      processKeyDown: processKeyDown,
      processClick: processClick,
      processMouseMove: processMouseMove,
      onUpdateImageBox: onUpdateImageBox,
      onUpdateTransformEach: onUpdateTransformEach,
      onUpdateTransform: onUpdateTransform
    };
  })();

  var hud = (function() {
    var hudPlacement = { right: true, bottom: true };
    var onUpdateLayoutCallback = null;
    var initialize = function() {
      $('#view').on('mousedown', 'div.hudContainer', function(e) {
        e.stopPropagation();
      });
    };
    var setObserver = function(onUpdateLayout) {
      onUpdateLayoutCallback = onUpdateLayout;
    };
    var adjustHUDPlacementToAvoidPoint = function(position) {
      var center = viewZoom.getCenter();
      var relative = {
          x: (position.x - (center.x + 0.5)) * viewZoom.scale,
          y: (position.y - (center.y + 0.5)) * viewZoom.scale
      };
      hudPlacement.right = relative.x < (hudPlacement.right ? 0.3 : -0.3);
      hudPlacement.bottom = relative.y < (hudPlacement.bottom ? 0.4 : -0.4);
      style = {};
      style['right'] = hudPlacement.right ? '0px' : 'auto';
      style['bottom'] = hudPlacement.bottom ? '0px' : 'auto';
      for (var i = 0, img; img = images[i]; i++) {
        img.view.find('div.hudContainer').css(style);
      }
    };
    var adjustPlacement = function() {
      var index = crossCursor.getIndex();
      var pos = crossCursor.getPosition(index);
      adjustHUDPlacementToAvoidPoint({
        x: pos.x / entries[index].width,
        y: pos.y / entries[index].height
      });
    };
    var append = function(img, hud) {
      if (img && img.view) {
        var container = img.view.find('div.hudContainer');
        if (0 === container.length) {
          container = $('<div class="hudContainer">');
          img.view.append(container);
        }
        container.append(hud);
      }
    };
    var onUpdateImageBox = function(img) {
      if (onUpdateLayoutCallback) {
        onUpdateLayoutCallback(img);
      }
    };
    return {
      initialize: initialize,
      setObserver: setObserver,
      adjustPlacement: adjustPlacement,
      append: append,
      onUpdateImageBox: onUpdateImageBox
    };
  })();

  var colorHUD = (function() {
    var updateColorHUD = function(img) {
      if (!img.colorHUD) {
        return;
      }
      var cursor = crossCursor.getPosition(img.index);
      var x = cursor.x, y = cursor.y;
      var pos = img.interpretXY(x, y);
      if (pos.x < 0 || pos.y < 0 || pos.x >= img.canvasWidth || pos.y >= img.canvasHeight) {
        img.colorHUD.find('.colorXY span, .colorCSS, .colorRGB span').text('');
        img.colorHUD.find('.colorSample, .colorBar').hide();
      } else {
        var context = img.asCanvas.getContext('2d');
        var imageData = context.getImageData(pos.x, pos.y, 1, 1);
        var rgb = imageData.data;
        var css = compareUtil.toHexTriplet(rgb[0], rgb[1], rgb[2]);
        img.colorHUD.find('.colorSample').show().attr('fill', css);
        img.colorHUD.find('.colorBar').show().find('rect').each(function(index) {
          $(this).attr('width', (rgb[index]*127.5/255));
        });
        img.colorHUD.find('.colorCSS').text(css);
        img.colorHUD.find('.colorRGB span').each(function(i) {
          $(this).text(rgb[i]);
        });
        img.colorHUD.find('.colorXY span').each(function(i) {
          $(this).text([x, y][i]);
        });
      }
    };
    var showHUD = function() {
      $('#pickerbtn').addClass('current');
    };
    var updateHUD = function(pointChanged) {
      if (pointChanged) {
        for (var i = 0, img; img = images[i]; i++) {
          updateColorHUD(img);
        }
      }
      hud.adjustPlacement();
    };
    var removeHUD = function() {
      $('#pickerbtn').removeClass('current');
    };
    var addColorHUD = function(img) {
      img.colorHUD = $(
        '<div class="dark hud" style="pointer-events: auto; min-width: 180px">' +
          '<span style="display: inline-block; font-size: 12px">' +
            '<svg width="142.5" height="15" viewBox="0 0 142.5 15">' +
              '<rect x="0" y="0" width="142.5" height="15" fill="#000"></rect>' +
              '<rect class="colorSample" x="0" y="0" width="15" height="15" fill="#000"></rect>' +
              '<g class="colorBar">' +
                '<rect x="15" y="0" width="0" height="5" fill="#f00"></rect>' +
                '<rect x="15" y="5" width="0" height="5" fill="#0f0"></rect>' +
                '<rect x="15" y="10" width="0" height="5" fill="#00f"></rect>' +
              '</g>' +
            '</svg>' +
            '<br>' +
            '<span class="colorCSS"></span>' +
            ' <span class="colorRGB">(<span></span>,<span></span>,<span></span>)</span>' +
            '<br>' +
            '<span class="colorXY">XY: <span></span>,<span></span></span>' +
          '</span>' +
          '<button class="close">×</button>' +
        '</div>'
      );
      img.colorHUD.find('button.close').click(crossCursor.disable);
      img.colorHUD.on('touchstart touchmove touchend', function(e) { e.stopPropagation(); });
      hud.append(img, img.colorHUD);
      img.colorHUD.show();
      updateColorHUD(img);
    };
    var onUpdateLayout = function(img) {
      if (crossCursor.isEnabled()) {
        if (!img.colorHUD) {
          addColorHUD(img);
        }
      } else if (img.colorHUD) {
        img.colorHUD.remove();
        img.colorHUD = null;
      }
    };
    var initialize = function() {
      crossCursor.addObserver(showHUD, updateHUD, removeHUD);
      hud.setObserver(onUpdateLayout);
    };
    return {
      initialize: initialize
    };
  })();
  var swapBaseAndTargetImage = function() {
    if (baseImageIndex !== null && targetImageIndex !== null) {
      setBaseAndTargetImage(targetImageIndex, baseImageIndex);
      if (dialog) {
        dialog.update();
      }
    }
  };
  var dialogUtil = (function() {
    var onShow = [], onHide = [];
    var addObserver = function(show, hide) {
      if (show) {
        onShow.push(show);
      }
      if (hide) {
        onHide.push(hide);
      }
    };
    var hideDialog = function() {
      if (dialog) {
        if (dialog.onclose) {
          dialog.onclose();
        }
        dialog.element.hide();
        dialog = null;
        figureZoom.disable();
        onHide.forEach(function(val) { val(); });
      }
    };
    var showDialog = function(target, parent, update, onclose, initialFocus) {
      dialog = {
        element: target,
        close: parent || hideDialog,
        update: update,
        onclose: onclose
      };
      target.css({ display: 'block' });
      initialFocus = initialFocus || target.children().find('.dummyFocusTarget');
      initialFocus.focus();
      onShow.forEach(function(val) { val(); });
    };
    var initFigureZoom = function(options) {
      if (options.enableZoom) {
        figureZoom.enable({
          zoomXOnly: options.zoomXOnly !== undefined ? options.zoomXOnly : false,
          getBaseSize: options.getBaseSize
        });
        figureZoom.setZoom(0);
        var initX = options.zoomInitX !== undefined ? options.zoomInitX : 0.5;
        var initY = options.zoomInitY !== undefined ? options.zoomInitY : 0.5;
        figureZoom.setOffset(initX, initY);
      } else {
        figureZoom.disable();
      }
    };
    var adjustDialogPosition = function() {
      if (dialog) {
        var target = dialog.element, dlg = dialog.element.children();
        var offset = dlg.offset();
        var border = 10;
        var left = compareUtil.clamp(offset.left, 0, target.width() - dlg.width() - border);
        var top  = compareUtil.clamp(offset.top, 0, target.height() - dlg.height() - border);
        if (left !== offset.left || top !== offset.top) {
          dlg.offset({ left: left, top: top });
        }
      }
    };
    var enableMouse = function(target) {
      var dlg = target.children();
      var draggingPoint = null;
      var moveDialog = function(dx, dy) {
        var offset = dlg.offset();
        dlg.offset({ left: offset.left + dx, top: offset.top + dy });
      };
      var header = $(target).find('.header');
      target.on('mousedown', '.header', function(e) {
        if (e.which === 1 && !$(e.target).is('a, select')) {
          draggingPoint = { x: e.clientX, y: e.clientY };
          setDragStateClass(header, true, false);
          return false;
        }
      }).on('mousemove', function(e) {
        if (draggingPoint) {
          if (e.buttons !== 1) {
            draggingPoint = null;
            setDragStateClass(header, false, false);
            return;
          }
          var dx = e.clientX - draggingPoint.x;
          var dy = e.clientY - draggingPoint.y;
          draggingPoint = { x: e.clientX, y: e.clientY };
          moveDialog(dx, dy);
          return false;
        }
      }).on('mouseup', function(e) {
        if (draggingPoint) {
          draggingPoint = null;
          setDragStateClass(header, false, false);
        }
      });
    };
    var initDialog = function(target, parent) {
      target.on('click', parent || hideDialog);
      target.children().on('click', function(e) { e.stopPropagation(); return true; });
      enableMouse(target);
      target.children().prepend($('<div class="dummyFocusTarget" tabindex="-1">').
        css({display:'inline', margin:'0px', padding:'0px', border:'0px'}));
    };
    var defineDialog = function(target, update, parent, options) {
      options = options !== undefined ? options : {};
      initDialog(target, parent);
      return function() {
        if (dialog && target.is(':visible')) {
          hideDialog();
        } else {
          hideDialog();
          initFigureZoom(options);
          if (options.onOpen) {
            options.onOpen();
          }
          if (update) {
            update();
          }
          showDialog(target, parent, update, options.onClose, options.initialFocus);
          target.children().css({ position: '', left: '', top: '' });
        }
      };
    };
    return {
      addObserver: addObserver,
      hideDialog: hideDialog,
      showDialog: showDialog,
      initFigureZoom: initFigureZoom,
      adjustDialogPosition: adjustDialogPosition,
      initDialog: initDialog,
      defineDialog: defineDialog
    };
  })();
  var openMessageBox = (function() {
    var serial = 0;
    return function(text) {
      serial += 1;
      var mySerial = serial;
      $('#messageBox').css('display', 'block');
      textUtil.setText($('#messageBoxBody'), text);
      var close = function(delay) {
        var doClose = function() {
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
      return { close: close };
    };
  })();
  var toggleHelp = dialogUtil.defineDialog($('#shortcuts'));
  var toggleAnalysis = dialogUtil.defineDialog($('#analysis'));
  // Settings
  var settings = (function() {
    var storage = null;
    if (compareUtil.storageAvailable('localStorage')) {
      storage = window.localStorage;
    }
    var openBGColor = function() {
      $('#settingsBGColor').click();
    };
    var configItem = function(key, initialValue, setter) {
      var set = function(value) {
        setter(value);
        if (storage) {
          storage.setItem(key, value);
        }
      };
      var reset = function() {
        set(initialValue);
      };
      var load = function() {
        var value = storage && storage.getItem(key);
        setter(value || initialValue);
      };
      return { key: key, set: set, reset: reset, load: load };
    };
    var bgColor = configItem('config-view-bg-color', '#444444', function(value) {
      if (!/^\#[0-9a-fA-F]{6}$/.test(value)) {
        value = '#000000';
      }
      $('#bgcolorbtn svg path').attr('fill', value);
      $('#settingsBGColor').prop('value', value);
      $('#settingsBGColorText').prop('value', value);
      viewManagement.setBackgroundColor(value);
    });
    var bgPattern = configItem('config-view-bg-pattern', '', function(value) {
      if (value === 'checker') {
        $('#settingsBGChecker').addClass('current');
      } else {
        $('#settingsBGChecker').removeClass('current');
      }
      viewManagement.setCheckerPattern(value === 'checker');
    });
    var imageScaling = configItem('config-view-image-scaling-style', 'smooth', function(value) {
      $('#settingsImageScalingButtons button').removeClass('current').filter(
        value === 'pixel' ?
          '[data-value=pixel]' :
          '[data-value=smooth]'
      ).addClass('current');
      viewManagement.setImageScaling(value);
    });
    var gridIntervalValues = function(value) {
      var num = value.split('/');
      var aux = compareUtil.clamp(parseInt(num[0]) || 4, 1, 256);
      var main = compareUtil.clamp(parseInt(num[1]) || 16, 1, 256);
      return [aux, main];
    };
    var gridInterval = configItem('config-grid-interval', '10/100', function(value) {
      var num = gridIntervalValues(value);
      var radio = $('#settings input[name=settingsGridInterval]');
      var other = true;
      for (var i = 0; i < radio.length; i++) {
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
    var configItems = [bgColor, bgPattern, imageScaling, gridInterval];
    var loadConfig = function(key) {
      configItems.forEach(function(item) {
        if (key === undefined || key === item.key) {
          item.load();
        }
      });
    };
    var supportsCSSImageRenderingPixelated = function() {
      var n = compareUtil.browserName;
      return 0 <= ['msie', 'chrome', 'safari', 'firefox', 'opera'].indexOf(n);
    };
    var startup = function() {
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
      var updateGridInterval = function(value) {
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
    startup();
    var toggle = dialogUtil.defineDialog($('#settings'));
    return {
      openBGColor: openBGColor,
      toggle: toggle
    };
  })();
  // Camera
  var cameraDialog = (function() {
    var error = false;
    var opening = false;
    var stream = null;
    var hasCameraAPI = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    var video = document.getElementById('cameravideo');
    $('#capture').on('click', function() {
      if (error) {
        error = false;
        onUpdate(); // retry
      } else if (!opening && stream) {
        var canvas = figureUtil.canvasFromImage(video, video.videoWidth, video.videoHeight);
        addCapturedImage(canvas);
      }
    });
    var onUpdate = function() {
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
        var p = navigator.mediaDevices.getUserMedia({ video: true });
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
    var onClose = function() {
      if (stream) {
        stream.getVideoTracks()[0].stop();
        stream = null;
        video.srcObject = null;
        $('#capture').prop('disabled', true);
      }
      opening = false;
      error = false;
    };
    var toggle = dialogUtil.defineDialog(
      $('#camera'),
      onUpdate,
      null,
      { onClose: onClose }
    );
    return {
      hasCameraAPI: hasCameraAPI,
      toggle: toggle
    };
  })();
  // Clipboard
  var clipboardReceiver = (function() {
    $('#pasteArea').on('paste', function(e) {
      //console.log(e);
      var data = e.originalEvent.clipboardData || window.clipboardData;
      //console.log(data.types);
      //console.log(data.items);
      if (data.files && 0 < data.files.length) {
        //console.log(data.files);
        addFiles(data.files);
      }
      return false;
    });
    var toggle = dialogUtil.defineDialog(
      $('#clipboardReceiver'),
      null,
      null,
      { initialFocus: $('#pasteArea') }
    );
    return {
      toggle: toggle
    };
  })();
  // Image Information
  var infoDialog = (function() {
    var makeAspectRatioInfo = function(w, h) {
      var exact = compareUtil.aspectRatioUtil.calcAspectRatio(w, h);
      var approx = compareUtil.aspectRatioUtil.findApproxAspectRatio(exact);
      var exactLabel = compareUtil.aspectRatioUtil.toString(exact);
      if (approx) {
        var approxLabel = compareUtil.aspectRatioUtil.toString(approx);
        return [exact.ratio, exactLabel + '\n(approx. ' + approxLabel + ')'];
      } else {
        return [exact.ratio, exactLabel];
      }
    };
    var rows = [
      $('#infoName'),
      $('#infoFormat'),
      $('#infoColor'),
      $('#infoWidth'),
      $('#infoHeight'),
      $('#infoAspect'),
      $('#infoOrientation'),
      $('#infoFileSize'),
      $('#infoLastModified') ];
    var unknown = [null, '‐'];
    var makeTableValue = function(img) {
      var orientation = compareUtil.orientationUtil.toString(img.orientation);
      var orientationExpr = img.orientation ? $('<span>').append(
        $('<img src="res/orientation.svg" width="30">').css({
          verticalAlign: '-8px',
          transform: img.orientationAsCSS
        }),
        $('<span>').text('(' + orientation + ')')
      ) : orientation;
      return [
        [null, makeImageNameWithIndex('<span>', img) ],
        [null, img.format !== '' ? img.format : '-'],
        [null, img.color !== '' ? img.color : '-'],
        img.sizeUnknown ? unknown : [img.width, compareUtil.addComma(img.width) ],
        img.sizeUnknown ? unknown : [img.height, compareUtil.addComma(img.height) ],
        img.sizeUnknown ? unknown : makeAspectRatioInfo(img.width, img.height),
        [orientation, orientationExpr],
        [img.size, img.size ? compareUtil.addComma(img.size) : '-'],
        [img.lastModified, img.lastModified ? img.lastModified.toLocaleString() : '-']
      ];
    };
    var updateTableCell = function(val, i) {
      for (var j = 0, v; v = val[i][j]; ++j) {
        var expr = val[i][j][1];
        var e = (typeof expr === 'string' ? $('<td>').text(expr) : $('<td>').append(expr));
        if (0 < i && val[i][j][0]) {
          e.addClass(
              val[0][j][0] < val[i][j][0] ? 'sign lt' :
              val[0][j][0] > val[i][j][0] ? 'sign gt' : 'sign eq');
        }
        rows[j].append(e);
      }
    };
    var updateTable = function() {
      $('#infoTable td:not(.prop)').remove();
      var val = [];
      for (var i = 0, img; img = images[i]; i++) {
        val[i] = makeTableValue(img);
        updateTableCell(val, i);
      }
      if (i === 0) {
        rows[0].append(
          $('<td>').attr('rowspan', rows.length).text('no data')
        );
      }
    };
    var toggle = dialogUtil.defineDialog($('#info'), updateTable, toggleAnalysis);
    return {
      toggle: toggle
    };
  })();
  var nowLoadingDialog = (function() {
    var loading = [];
    var toggleNowLoading = dialogUtil.defineDialog($('#loading'));
    var add = function(entry) {
      loading.push(entry);
    };
    var update = function() {
      if ($('#loading').is(':visible')) {
        dialogUtil.hideDialog();
      }
      $('#loadingList > tr').remove();
      if (0 === loading.length) {
        return;
      }
      var finished = true, errors = 0;
      for (var i = 0, ent; ent = loading[i]; i++) {
        var td = $('<td>').css({ minWidth: '400px' });
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
          $('<tr>').append(makeImageNameWithIndex('<td class="b">', ent), td)
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
      add: add,
      update: update
    };
  })();
  var getImageData = function(img) {
    if (!img.imageData) {
      var w = img.canvasWidth;
      var h = img.canvasHeight;
      try {
        var context = img.asCanvas.getContext('2d');
        var imageData = context.getImageData(0, 0, w, h);
        // avoid huge memory consumption
        if (w * h <= 30 * 1024 * 1024) {
          img.imageData = imageData;
        }
        return imageData;
      } catch (e) {
        return null;
      }
    }
    return img.imageData;
  };
  var figureUtil = (function() {
    var makeBlankFigure = function(w, h) {
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var context = canvas.getContext('2d');
      return { canvas: canvas, context: context };
    };
    var canvasFromImage = function(image, w, h) {
      var fig = makeBlankFigure(w, h);
      fig.context.drawImage(image, 0, 0, w, h);
      return fig.canvas;
    };
    var copyImageBits = function(src, dest) {
      for (var i = 0, n = src.width * src.height * 4; i < n; ++i) {
        dest.data[i] = src.data[i];
      }
    };
    var copyGrayscaleBits = function(src, dest) {
      for (var i = 0, j = 0, n = src.width * src.height; i < n; ++i, j += 4) {
        var y = src.data[i];
        dest.data[j + 0] = y;
        dest.data[j + 1] = y;
        dest.data[j + 2] = y;
        dest.data[j + 3] = 255;
      }
    };
    var makeLinearGradient = function(ctx, x0,y0,x1,y1,stops) {
      var grad = ctx.createLinearGradient(x0,y0,x1,y1);
      for (var i = 0; i < stops.length; i++) {
        grad.addColorStop(stops[i][0], stops[i][1]);
      }
      return grad;
    };
    var drawHistogram = function(context, color, hist, max, offset, n, x, y, h) {
      context.fillStyle = color;
      for (var i = 0; i < n; ++i) {
        var v = h * Math.pow(hist[i + offset] / max, 0.5);
        context.fillRect((x + i) * 3, y - v, 3, v);
      }
    };
    var drawAxes = function(ctx, x, y, dx, dy, lineLen, lineWidth, color, labels) {
      var dLen = Math.sqrt(dx * dx + dy * dy);
      var lineDx = -dy / dLen * lineLen, lineDy = dx / dLen * lineLen;
      ctx.font = '24px sans-serif';
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      for (var i = 0, label; label = labels[i]; ++i) {
        var pos = { x: label.pos * dx, y: label.pos * dy };
        var x1 = x + pos.x;
        var y1 = y + pos.y;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + lineDx, y1 + lineDy);
        ctx.stroke();
        ctx.textAlign = label.align;
        ctx.fillText(label.label,
          x + pos.x + lineDx,
          y + pos.y + lineDy + 20);
      }
    };
    return {
      makeBlankFigure: makeBlankFigure,
      canvasFromImage: canvasFromImage,
      copyImageBits: copyImageBits,
      copyGrayscaleBits: copyGrayscaleBits,
      makeLinearGradient: makeLinearGradient,
      drawHistogram: drawHistogram,
      drawAxes: drawAxes
    };
  })();
  var updateFigureTable = function(target, propName, update, styles, transformOnly) {
    if (transformOnly) {
      $(target).find('td.fig > *').css(styles.style);
      return;
    }
    $(target).find('td').remove();
    for (var k = 0, img; img = images[k]; k++) {
      if (!img[propName]) {
        img[propName] = figureUtil.makeBlankFigure(8, 8).canvas;
        update(img);
      }
      var label = makeImageNameWithIndex('<td>', img);
      $(target).find('tr').eq(0).append(label);
      var figMain = $(img[propName]).css(styles.style).addClass('figMain');
      var fig = $('<td class="fig">').css(styles.cellStyle).append(figMain);
      var axes = img[propName + 'Axes'];
      if (axes) {
        fig.append($(axes).css(styles.style));
      }
      $(target).find('tr').eq(1).append(fig);
    }
    if (k === 0) {
      var cell = $('<td rowspan="2">').text('no data');
      $(target).find('tr').eq(0).append(cell);
    }
  };
  var makeFigureStyles = function(w, h, margin, background, zoomController) {
    var styles = { figW: w, figH: h, figMargin: margin, baseW: w, baseH: h };
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
  var updateFigureStylesForActualSize = function(styles, w, h) {
    var rect = compareUtil.calcInscribedRect(styles.figW, styles.figH, w, h);
    styles.baseW = rect.width;
    styles.baseH = rect.height;
    styles.style.width = rect.width + 'px';
    styles.style.height = rect.height + 'px';
    styles.style.top = ((styles.figH - rect.height) / 2 + styles.figMargin) + 'px';
    return styles;
  };

  var processTaskResult = function(data) {
    switch (data.cmd) {
    case 'calcHistogram':
      var img = entries[data.index[0]];
      histogramDialog.updateFigure(data.type, data.auxTypes, img, data.result);
      break;
    case 'calcWaveform':
      var img = entries[data.index[0]];
      waveformDialog.updateFigure(data.type, data.auxTypes, img, data.histW, data.result);
      break;
    case 'calcVectorscope':
      vectorscopeDialog.updateFigure(data.type, data.color, data.auxTypes, entries[data.index[0]], data.result);
      break;
    case 'calcColorTable':
      entries[data.index[0]].colorTable = data.result;
      colorDistDialog.updateFigure(entries[data.index[0]]);
      break;
    case 'calc3DWaveform':
      entries[data.index[0]].waveform3D = data.result;
      waveform3DDialog.updateFigure(entries[data.index[0]]);
      break;
    case 'calcReducedColorTable':
      entries[data.index[0]].reducedColorTable = data.result;
      colorFreqDialog.updateFigure(entries[data.index[0]]);
      break;
    case 'calcMetrics':
      entries[data.index[0]].metrics[data.index[1]] = data.result;
      entries[data.index[1]].metrics[data.index[0]] = data.result;
      metricsDialog.updateTable();
      break;
    case 'calcToneCurve':
      toneCurveDialog.updateFigure(data.type, data.auxTypes, data.index[0], data.index[1], data.result);
      break;
    case 'calcOpticalFlow':
      opticalFlowDialog.updateFigure(data.index[0], data.index[1], data.result);
      break;
    case 'calcDiff':
      diffDialog.updateFigure(data.index[0], data.index[1], data.options, data.result);
      break;
    }
  };
  var attachImageDataToTask = function(data) {
    data.imageData = [];
    for (var i = 0; i < data.index.length; ++i) {
      data.imageData[i] = getImageData(entries[data.index[i]]);
      if (!data.imageData[i]) {
        alert('out of memory');
        return false;
      }
    }
  };
  var taskQueue = compareUtil.makeTaskQueue('modules/compare-worker.js', processTaskResult);
  var discardTasksOfCommand = function(cmd) {
    taskQueue.discardTasksOf(function(task) { return task.cmd === cmd; });
  };
  var discardTasksOfEntryByIndex = function(index) {
    taskQueue.discardTasksOf(function(task) { return task.index.indexOf(index) !== -1; });
  };

  var makeModeSwitch = function(parent, initialValue, onchange, toggle) {
    var currentType = initialValue;
    var set = function(type) {
      if (currentType !== type) {
        currentType = type;
        var index = toggle ? [true, false].indexOf(type) : type;
        $(parent).children().removeClass('current').eq(index).addClass('current');
        onchange(type);
      }
    };
    $(parent).children().click(function() {
      var type = toggle ? !currentType : $(parent).children().index(this);
      set(type);
    });
    return {
      current: function() { return currentType; },
      set: set
    };
  };
  var makeToggleSwitch = function(parent, initialValue, onchange) {
    return makeModeSwitch(parent, initialValue, onchange, true);
  };
  // Histogram
  var histogramDialog = (function() {
    var repaint = function() {
      discardTasksOfCommand('calcHistogram');
      for (var i = 0, img; img = images[i]; i++) {
        img.histogram = null;
      }
      updateTable();
    };
    var histogramType = makeModeSwitch('#histogramType', 0, function() {
      repaint();
      updateAuxOption();
    });
    var histogramRowLayout = makeToggleSwitch('#histogramRowLayout', true, repaint);
    var histogramAuxType2 = makeModeSwitch('#histogramAuxType2', 0, repaint);
    var updateAuxOption = function() {
      if (histogramType.current() === 0) {
        $('#histogramRowLayout').show();
        $('#histogramAuxType2').hide();
      } else {
        $('#histogramRowLayout').hide();
        $('#histogramAuxType2').show();
      }
    };
    updateAuxOption();
    var updateAsync = function(img) {
      taskQueue.addTask({
        cmd:      'calcHistogram',
        type:     histogramType.current(),
        auxTypes: [histogramAuxType2.current()],
        index:    [img.index]
      }, attachImageDataToTask);
    };
    var makeFigure = function(type, auxType2, hist) {
      var margin = 32;
      var fig = figureUtil.makeBlankFigure(768, 512 + margin);
      var context = fig.context;
      var max = 0;
      for (var i = 0; i < hist.length; ++i) {
        max = Math.max(max, hist[i]);
      }
      var drawGrid = function() {
        for (var k = 16; k < 255; k += 16) {
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
      drawGrid();
      if (type === 0) { // RGB
        context.globalCompositeOperation = 'lighter';
        if (histogramRowLayout.current()) {
          figureUtil.drawHistogram(context, '#f00', hist, max, 0, 256, 0, 170, 170);
          figureUtil.drawHistogram(context, '#0f0', hist, max, 256, 256, 0, 341, 170);
          figureUtil.drawHistogram(context, '#00f', hist, max, 512, 256, 0, 512, 170);
        } else {
          figureUtil.drawHistogram(context, '#f00', hist, max, 0, 256, 0, 512, 512);
          figureUtil.drawHistogram(context, '#0f0', hist, max, 256, 256, 0, 512, 512);
          figureUtil.drawHistogram(context, '#00f', hist, max, 512, 256, 0, 512, 512);
        }
      } else { // Luminance
        figureUtil.drawHistogram(context, '#fff', hist, max, 0, 256, 0, 512, 512);
      }
      var axes = [
        { pos: (0.5 + 0  ) / 256, align: 'left',   label: '0' },
        { pos: (0.5 + 255) / 256, align: 'right',  label: '255' }
      ];
      for (var i = 16; i < 256; i += 16) {
        axes.push({
          pos: (0.5 + i) / 256, align: 'center', label: (i%64 === 0) ? ''+i : ''
        });
      }
      figureUtil.drawAxes(fig.context, 0, 512, 768, 0, 10, 3, '#000', axes);
      return fig.canvas;
    };
    var updateFigure = function(type, auxTypes, img, hist) {
      if (type === histogramType.current() && auxTypes[0] === histogramAuxType2.current()) {
        img.histogram = makeFigure(type, auxTypes[0], hist);
        updateTable();
      }
    };
    var updateTable = function(transformOnly) {
      var w = 384, h = 272, margin = 8;
      var styles = makeFigureStyles(w, h, margin, '#bbb', figureZoom);
      updateFigureTable('#histoTable', 'histogram', updateAsync, styles, transformOnly);
    };
    var toggle = dialogUtil.defineDialog($('#histogram'), updateTable, toggleAnalysis, {
      enableZoom: true, zoomXOnly: true, zoomInitX: 0,
      getBaseSize: function() { return { w: 384, h: 272 }; }
    });
    return {
      updateFigure: updateFigure,
      toggle: toggle
    };
  })();
  // Waveform
  var waveformDialog = (function() {
    var repaint = function() {
      discardTasksOfCommand('calcWaveform');
      for (var i = 0, img; img = images[i]; i++) {
        img.waveform = null;
      }
      updateTable();
    };
    var waveformType = makeModeSwitch('#waveformType', 0, function(type) {
      repaint();
      updateAuxOption();
    });
    var waveformAuxType = makeModeSwitch('#waveformAuxType', 0, repaint);
    var waveformColumnLayout = makeToggleSwitch('#waveformColumnLayout', true, repaint);
    var waveformAuxType2 = makeModeSwitch('#waveformAuxType2', 0, repaint);
    var updateAuxOption = function() {
      if (waveformType.current() === 0) {
        $('#waveformColumnLayout').show();
        $('#waveformAuxType').show();
        $('#waveformAuxType2').hide();
      } else {
        $('#waveformColumnLayout').hide();
        $('#waveformAuxType').hide();
        $('#waveformAuxType2').show();
      }
    };
    updateAuxOption();
    var updateAsync = function(img) {
      taskQueue.addTask({
        cmd:      'calcWaveform',
        type:     waveformType.current(),
        auxTypes: [waveformAuxType.current(), waveformAuxType2.current()],
        index:    [img.index],
        histW:    Math.min(img.width, 1024),
        transposed: img.transposed,
        flipped:  img.transposed ? img.flippedY : img.flippedX
      }, attachImageDataToTask);
    };
    var makeFigure = function(type, w, h, histW, hist) {
      var histN = new Uint32Array(histW);
      for (var i = 0; i < w; ++i) {
        var x = Math.round((i + 0.5) / w * histW - 0.5);
        ++histN[x];
      }
      //
      var figW = (type === 0 && waveformColumnLayout.current()) ? histW * 3 : histW;
      var fig = figureUtil.makeBlankFigure(figW, 256);
      var context = fig.context;
      var bits = context.createImageData(figW, 256);
      var s = -4 * figW;
      for (var i = 0, n = figW * 256 * 4; i < n; i += 4) {
        bits.data[i + 0] = 0;
        bits.data[i + 1] = 0;
        bits.data[i + 2] = 0;
        bits.data[i + 3] = 255;
      }
      for (var x = 0; x < histW; ++x) {
        var invMax = 1 / (histN[x] * h);
        if (type === 0) { // RGB
          var rOff = 256 * x;
          var gOff = 256 * (x + histW);
          var bOff = 256 * (x + 2 * histW);
          var off0 = 4 * (255 * figW + x);
          var off1 = waveformColumnLayout.current() ? off0 + 4 * histW : off0;
          var off2 = waveformColumnLayout.current() ? off1 + 4 * histW : off0;
          for (var y = 0; y < 256; ++y) {
            var cR = Math.round(255 * (1 - Math.pow(1 - hist[rOff + y] * invMax, 200.0)));
            var cG = Math.round(255 * (1 - Math.pow(1 - hist[gOff + y] * invMax, 200.0)));
            var cB = Math.round(255 * (1 - Math.pow(1 - hist[bOff + y] * invMax, 200.0)));
            bits.data[off0 + 0] = cR;
            bits.data[off1 + 1] = cG;
            bits.data[off2 + 2] = cB;
            off0 += s;
            off1 += s;
            off2 += s;
          }
        } else { // Luminance
          var cOff = x * 256;
          var off = 4 * (255 * histW + x);
          for (var y = 0; y < 256; ++y) {
            var c = Math.round(255 * (1 - Math.pow(1 - hist[cOff + y] * invMax, 200.0)));
            bits.data[off + 0] = c;
            bits.data[off + 1] = c;
            bits.data[off + 2] = c;
            off += s;
          }
        }
      }
      context.putImageData(bits, 0, 0);
      context.globalAlpha = 0.2;
      context.strokeStyle = '#fff';
      context.lineWidth = 0.5;
      context.beginPath();
      for (var k = 32; k < 255; k += 32) {
        context.moveTo(0, k + 0.5);
        context.lineTo(figW, k + 0.5);
      }
      context.stroke();
      return fig.canvas;
    };
    var updateFigure = function(type, auxTypes, img, histW, hist) {
      if (type === waveformType.current() &&
          auxTypes[0] === waveformAuxType.current() &&
          auxTypes[1] === waveformAuxType2.current()) {
        var w = img.width;
        var h = img.height;
        img.waveform = makeFigure(type, w, h, histW, hist);
        updateTable();
      }
    };
    var updateTable = function(transformOnly) {
      var w = 320, h = 256, margin = 10;
      var styles = makeFigureStyles(w, h, margin, '#666', figureZoom);
      updateFigureTable('#waveTable', 'waveform', updateAsync, styles, transformOnly);
    };
    var toggle = dialogUtil.defineDialog($('#waveform'), updateTable, toggleAnalysis, {
      enableZoom: true, zoomXOnly: true, zoomInitX: 0,
      getBaseSize: function() { return { w: 320, h: 256 }; }
    });
    return {
      updateFigure: updateFigure,
      toggle: toggle
    };
  })();
  var makeDistributionImageData = function(context, w, h, dist, max, scale, mode) {
    var bits = context.createImageData(w, h);
    var i = 0, k = 0;
    if (mode === 0) { // RGB
      var offsetG = w * h;
      var offsetB = w * h * 2;
      for (var y = 0; y < h; ++y) {
        for (var x = 0; x < w; ++x, i++, k += 4) {
          var aR = 1 - Math.pow(1 - dist[i] / max, 20000.0);
          var aG = 1 - Math.pow(1 - dist[i + offsetG] / max, 20000.0);
          var aB = 1 - Math.pow(1 - dist[i + offsetB] / max, 20000.0);
          var cR = Math.round(aR * scale);
          var cG = Math.round(aG * scale);
          var cB = Math.round(aB * scale);
          bits.data[k + 0] = cR;
          bits.data[k + 1] = cG;
          bits.data[k + 2] = cB;
          bits.data[k + 3] = 255;
        }
      }
    } else { // Luminance
      for (var y = 0; y < h; ++y) {
        for (var x = 0; x < w; ++x, i++, k += 4) {
          var a = 1 - Math.pow(1 - dist[i] / max, 20000.0);
          var c = Math.round(a * scale);
          bits.data[k + 0] = c;
          bits.data[k + 1] = c;
          bits.data[k + 2] = c;
          bits.data[k + 3] = 255;
        }
      }
    }
    return bits;
  };
  var makeDistributionImageDataRGBA = function(context, w, h, dist, colorMap, max, scale) {
    var bits = context.createImageData(w, h);
    var i = 0, k = 0;
    var offsetG = w * h;
    var offsetB = w * h * 2;
    for (var y = 0; y < h; ++y) {
      for (var x = 0; x < w; ++x, i++, k += 4) {
        var d = dist[i];
        var a = 1 - Math.pow(1 - d / max, 20000.0);
        var cA = Math.round(a * scale);
        var cScale = d === 0 ? scale : scale / (255 * d);
        var cR = Math.round(colorMap[i] * cScale);
        var cG = Math.round(colorMap[i + offsetG] * cScale);
        var cB = Math.round(colorMap[i + offsetB] * cScale);
        bits.data[k + 0] = cR;
        bits.data[k + 1] = cG;
        bits.data[k + 2] = cB;
        bits.data[k + 3] = cA;
      }
    }
    return bits;
  };
  // Vectorscope
  var vectorscopeDialog = (function() {
    var repaint = function() {
      discardTasksOfCommand('calcVectorscope');
      for (var i = 0, img; img = images[i]; i++) {
        img.vectorscope = null;
      }
      updateTable();
    };
    var vectorscopeType = makeModeSwitch('#vectorscopeType', 0, function() {
      repaint();
      updateAuxOption();
    });
    var colorMode = makeToggleSwitch('#vectorscopeColor', false, repaint);
    var vectorscopeAuxType = makeModeSwitch('#vectorscopeAuxType', 0, repaint);
    var vectorscopeAuxType2 = makeModeSwitch('#vectorscopeAuxType2', 0, repaint);
    var updateAuxOption = function() {
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
    var updateAsync = function(img) {
      taskQueue.addTask({
        cmd:      'calcVectorscope',
        type:     vectorscopeType.current(),
        color:    colorMode.current(),
        auxTypes: [vectorscopeAuxType.current(), vectorscopeAuxType2.current()],
        index:    [img.index]
      }, attachImageDataToTask);
    };
    var makeFigure = function(type, auxType2, color, fig, w, h, result) {
      var context = fig.context;
      if (color) { // with color
        var bits = makeDistributionImageDataRGBA(context, 320, 320, result.dist, result.colorMap, w * h, 255);
      } else {
        var bits = makeDistributionImageData(context, 320, 320, result.dist, w * h, 255, 1);
      }
      context.putImageData(bits, 0, 0);
      var srgbToLinear = function(c) {
        return c < 0.040450 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      var mat = auxType2 === 0 ?
            compareUtil.colorMatrixBT601 :  // 0: bt601
            compareUtil.colorMatrixBT709;   // 1: bt709
      var calcxy = function(r, g, b) {
        if (type === 0) { // Cb-Cr
          var cb = mat[1][0] * r + mat[1][1] * g + mat[1][2] * b;
          var cr = mat[2][0] * r + mat[2][1] * g + mat[2][2] * b;
          return { x: 159.5 + cb, y: 159.5 - cr };
        } else if (type === 1) { // x-y
          r = srgbToLinear(r / 255);
          g = srgbToLinear(g / 255);
          b = srgbToLinear(b / 255);
          var x = 0.412391 * r + 0.357584 * g + 0.180481 * b;
          var y = 0.212639 * r + 0.715169 * g + 0.072192 * b;
          var z = 0.019331 * r + 0.119195 * g + 0.950532 * b;
          var xyz = x + y + z;
          return {
            x: 32 + (xyz === 0 ? 0 : x / xyz * 255),
            y: 287 - (xyz === 0 ? 0 : y / xyz * 255)
          };
        } else if (type === 2) { // G-B
          return { x: 32 + g, y: 287 - b };
        } else if (type === 3) { // G-R
          return { x: 32 + g, y: 287 - r };
        } else { // B-R
          return { x: 32 + b, y: 287 - r };
        }
      };
      var points = [
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
        { pos: { x: 287,   y: 159.5 } , color: '',     types: [] }
      ];
      var mainAxesColor = '#06c';
      var auxAxesColor = color ? '#555' : '#024';
      var lines = [
        { indices: [20, 21, 22, 23], color: mainAxesColor, types: [0] },
        { indices: [0, 1, 0, 2, 0, 3], color: auxAxesColor, types: [0] },
        { indices: [0, 1, 0, 2, 0, 3], color: mainAxesColor, types: [2,3,4] },
        { indices: [12, 13, 14, 15, 16, 17, 18, 19], color: auxAxesColor, types: [0,2,3,4] },
        { indices: [20, 21, 22, 23], color: auxAxesColor, types: [2,3,4] },
        { indices: [0, 4, 0, 5, 0, 6], color: auxAxesColor, types: [0] },
        { indices: [1, 6, 6, 2, 2, 4, 4, 3, 3, 5, 5, 1], color: auxAxesColor, types: [0] },
        { indices: [4, 7, 5, 7, 6, 7], color: auxAxesColor, types: [2,3,4] },
        { indices: [1, 2, 2, 3, 3, 1], color: auxAxesColor, types: [1] },
        { indices: [8, 9, 9, 10], color: mainAxesColor, types: [1] },
        { indices: [8, 10], color: auxAxesColor, types: [1] },
        { indices: [8, 9, 9, 10, 10, 11, 11, 8], color: auxAxesColor, types: [0] }
      ];
      var labels = [
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
      for (var i = 0, p; p = points[i]; ++i) {
        if (0 > p.types.indexOf(type)) {
          continue;
        }
        context.strokeStyle = p.color;
        context.beginPath();
        context.arc(p.pos.x + 0.5, p.pos.y + 0.5, 4, 0, 2 * Math.PI);
        context.stroke();
      }
      context.lineWidth = 1;
      for (var i = 0, l; l = lines[i]; ++i) {
        if (0 > l.types.indexOf(type)) {
          continue;
        }
        context.strokeStyle = l.color;
        context.beginPath();
        for (var k = 0; k < l.indices.length; k += 2) {
          var v0 = points[l.indices[k]];
          var v1 = points[l.indices[k + 1]];
          context.moveTo(v0.pos.x + 0.5, v0.pos.y + 0.5);
          context.lineTo(v1.pos.x + 0.5, v1.pos.y + 0.5);
        }
        context.stroke();
      }
      context.font = '16px sans-serif';
      for (var i = 0, l; l = labels[i]; ++i) {
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
    var updateFigure = function(type, color, auxTypes, img, result) {
      if (type !== vectorscopeType.current() || color !== colorMode.current() ||
          auxTypes[0] !== vectorscopeAuxType.current() ||
          auxTypes[1] !== vectorscopeAuxType2.current()) {
        return;
      }
      var w = img.canvasWidth;
      var h = img.canvasHeight;
      var fig = figureUtil.makeBlankFigure(320, 320);
      function notify() {
        img.vectorscope = fig.canvas;
        updateTable();
      };
      if (type === 1) { // x-y
        var bg = new Image;
        bg.onload = function() {
          makeFigure(type, auxTypes[1], color, fig, w, h, result);
          fig.context.globalAlpha = color ? 0.7 : 0.3;
          fig.context.globalCompositeOperation = color ? 'destination-over' : 'lighter';
          fig.context.drawImage(bg, 0, 0, 320, 320);
          notify();
        };
        bg.src = color ? 'res/xy-chromaticity-diagram-gray.png' : 'res/xy-chromaticity-diagram.png';
      } else {
        makeFigure(type, auxTypes[1], color, fig, w, h, result);
        notify();
      }
    };
    var updateTable = function(transformOnly) {
      var w = 320, h = 320, margin = 10;
      var styles = makeFigureStyles(w, h, margin, '#444', figureZoom);
      updateFigureTable('#vectorscopeTable', 'vectorscope', updateAsync, styles, transformOnly);
    };
    var toggle = dialogUtil.defineDialog($('#vectorscope'), updateTable, toggleAnalysis, {
      enableZoom: true, getBaseSize: function() { return { w: 320, h: 320 }; }
    });
    var processKeyDown = function(e) {
      if (e.keyCode === 81/* q */) {
        colorMode.set(!colorMode.current());
        return false;
      }
    };
    return {
      updateFigure: updateFigure,
      toggle: toggle,
      processKeyDown: processKeyDown
    };
  })();
  var vertexUtil = (function() {
    var makeCube = function(sx, sy, sz) {
      var v = [];
      var cx = sx / 2, cy = sy / 2, cz = sz / 2;
      for (var i = 0; i < 18; ++i) {
        var posX = (Math.floor(i / 6) % 3) * cx - cx;
        var posY = (Math.floor(i / 2) % 3) * cy - cy;
        var posZ = (i % 2) * sz - cz;
        v[i] = [posX, posY, posZ];
      }
      return v;
    };
    var cubeIndices = [
      [0, 1, 5, 4, 0], [12, 13, 17, 16, 12],
      [0, 12], [1, 13], [4, 16], [5, 17]
    ];
    var make3DCylinder = function(r, sz) {
      var v = [], cz = sz / 2;
      for (var i = 0; i < 36; ++i) {
        var a = i / 18 * Math.PI;
        var posX = r * Math.cos(a);
        var posY = r * Math.sin(a);
        v[i * 2] = [posX, posY, -cz];
        v[i * 2 + 1] = [posX, posY, cz];
      }
      return v;
    };
    var cylinderIndices = (function() {
      var indices = [[], []];
      for (var i = 0; i <= 36; ++i) {
        indices[0][i] = (i % 36) * 2;
        indices[1][i] = (i % 36) * 2 + 1;
      }
      return indices;
    })();
    return {
      makeCube: makeCube,
      cubeIndices: cubeIndices,
      make3DCylinder: make3DCylinder,
      cylinderIndices: cylinderIndices
    };
  }());
  var makeRotationCoefs = function(orientation, scale_r, scale_g, scale_b) {
    var ax = Math.round(orientation.x) * (Math.PI / 180);
    var ay = Math.round(orientation.y) * (Math.PI / 180);
    var cos_ax = Math.cos(ax), cos_ay = Math.cos(ay);
    var sin_ax = Math.sin(ax), sin_ay = Math.sin(ay);
    var scale = 0.707;
    var sr = scale * (scale_r || 1);
    var sg = scale * (scale_g || 1);
    var sb = scale * (scale_b || 1);
    var xr = sr * cos_ay, yr = -sr * sin_ay * sin_ax;
    var xg = -sg * sin_ay, yg = -sg * cos_ay * sin_ax;
    var yb = -sb * cos_ax;
    var pos3DTo2D = function(x, y, z) {
      return [ 160 + xr * x + xg * y, 160 + yr * x + yg * y + yb * z ];
    };
    var vertices3DTo2D = function(v) {
      return v.map(function(pos) {
        return pos3DTo2D(pos[0], pos[1], pos[2]);
      });
    };
    return {
      xr: xr, yr: yr, xg: xg, yg: yg, yb: yb,
      pos3DTo2D: pos3DTo2D,
      vertices3DTo2D: vertices3DTo2D
    };
  };
  var makeAxesDesc = function(v, lines) {
    return lines.map(function(a) {
      return (
        'M' + v[a[0]].join(',') +
        a.slice(1).map(function(i) { return 'L' + v[i].join(','); }).join('')
      );
    }).join('');
  };
  var makeAxesSVG = function(vbox, labels, axesDesc) {
    var labelsSVG = labels.map(function(label) {
      return '<text>' + label.text + '</text>';
    }).join('');
    return $(
    '<svg viewBox="' + vbox + '">' +
      '<g stroke="white" fill="none">' +
        '<path stroke-width="0.2" d="' + axesDesc + '"></path>' +
      '</g>' +
      '<g class="labels" font-size="12" text-anchor="middle" dominant-baseline="middle">' + labelsSVG + '</g>' +
    '</svg>');
  };
  var updateAxesLabels = function(svg, labels, rotation) {
    $(svg).find('g.labels text').each(function(i) {
      var label = labels[i];
      var xy = rotation.pos3DTo2D(label.pos[0], label.pos[1], label.pos[2]);
      $(this).attr({
        fill : label.hidden ? 'transparent' : label.color,
        x : xy[0],
        y : xy[1]
      });
    });
  };
  var makeRotationController = function(onrotate, onzoom, initialOrientation) {
    initialOrientation = initialOrientation || { x: 30, y: -30 };
    var orientation = {
      x: initialOrientation.x,
      y: initialOrientation.y
    };
    var zoomLevel = 0.12;
    var resetZoom = function() {
      zoomLevel = 0.12;
    };
    var getScale = function() {
      return Math.round(Math.pow(2, zoomLevel) * 100) / 100;
    };
    var rotate = function(dx, dy, scale) {
      orientation.x += dy * scale;
      orientation.y += dx * scale;
      orientation.x = compareUtil.clamp(orientation.x, -90, 90);
      orientation.y -= Math.floor(orientation.y / 360) * 360;
      onrotate();
    };
    var zoom = function(delta) {
      var MAX_ZOOM_LEVEL = 6;
      zoomLevel = compareUtil.clamp(zoomLevel + delta, 0, MAX_ZOOM_LEVEL);
      onzoom();
    };
    return {
      orientation: orientation,
      getScale: getScale,
      resetZoom: resetZoom,
      rotate: rotate,
      zoom: zoom
    };
  };
  var makeRotationInputFilter = function(target, controller) {
    var processKeyDown = function(e) {
      return compareUtil.processKeyDownEvent(e, {
        zoomIn: function() { controller.zoom(0.25); return false; },
        zoomOut: function() { controller.zoom(-0.25); return false; },
        cursor: function() {
          var step = e.shiftKey ? 10 : 1;
          var d = compareUtil.cursorKeyCodeToXY(e.keyCode);
          controller.rotate(d.x, d.y, step);
          return false;
        }
      });
    };
    var dragState = null;
    var processMouseDown = function(e) {
      if (e.which === 1) {
        dragState = { x: e.clientX, y: e.clientY };
        setDragStateClass(target, true, false);
        return false;
      }
    };
    var processMouseMove = function(e) {
      if (dragState) {
        if (e.buttons !== 1) {
          dragState = null;
          setDragStateClass(target, false, false);
        } else {
          var dx = e.clientX - dragState.x;
          var dy = e.clientY - dragState.y;
          dragState = { x: e.clientX, y: e.clientY };
          controller.rotate(dx, dy, 0.5);
          return false;
        }
      }
    };
    var processMouseUp = function(e) {
      if (dragState) {
        dragState = null;
        setDragStateClass(target, false, false);
      }
    };
    var processWheelEvent = function(e) {
      return compareUtil.processWheelEvent(e, {
        zoom: function(steps) {
          var ZOOM_STEP_WHEEL = 0.0625;
          controller.zoom(-steps * ZOOM_STEP_WHEEL);
        }
      });
    };
    var touchFilter = compareUtil.makeTouchEventFilter();
    var processTouchMove = function(e) {
      return touchFilter.onTouchMove(e, {
        move: function(dx, dy) { controller.rotate(dx, dy, 0.3); },
        zoom: function(dx, dy, delta) { controller.zoom(delta); }
      });
    };
    var processTouchEnd = function(e) {
      touchFilter.resetState();
    };
    var enableMouseAndTouch = function(root, filter, deepFilter) {
      $(root).on('mousedown', deepFilter, processMouseDown);
      $(root).on('mousemove', filter, processMouseMove);
      $(root).on('mouseup', filter, processMouseUp);
      $(root).on('wheel', filter, processWheelEvent);
      $(root).on('touchmove', filter, processTouchMove);
      $(root).on('touchend', filter, processTouchEnd);
    };
    return {
      processKeyDown: processKeyDown,
      enableMouseAndTouch: enableMouseAndTouch
    };
  };
  // 3D Color Distribution
  var colorDistDialog = (function() {
    var colorDistType = makeModeSwitch('#colorDistType', 0, function(type) {
      updateFigure();
      updateAuxOption();
    });
    var colorMode = makeToggleSwitch('#colorDistColor', true, function() {
      updateFigure();
    });
    var colorDistAuxType = makeModeSwitch('#colorDistAuxType', 0, function(type) {
      updateFigure();
    });
    var colorDistAuxType2 = makeModeSwitch('#colorDistAuxType2', 0, function(type) {
      updateFigure();
    });
    var updateAuxOption = function() {
      if (colorDistType.current() === 0 ||
          colorDistType.current() === 1 ||
          colorDistType.current() === 2) { // 0:RGB, 1:HSV, 2:HSL
        $('#colorDistAuxType').show();
        $('#colorDistAuxType2').hide();
      } else if (colorDistType.current() === 3) { // 3:YCbCr
        $('#colorDistAuxType').hide();
        $('#colorDistAuxType2').show();
      } else {
        $('#colorDistAuxType').hide();
        $('#colorDistAuxType2').hide();
      }
    };
    updateAuxOption();
    var updateAsync = function(img) {
      taskQueue.addTask({
        cmd:      'calcColorTable',
        index:    [img.index]
      }, attachImageDataToTask);
    };
    var rotationController = makeRotationController(
      function() { redrawFigureAll(); },
      function() { updateTable(/* transformOnly = */ true); },
      { x: 20, y: -60 }
    );
    var vertices3DCube = vertexUtil.makeCube(256, 256, 256);
    var vertexIndicesCube = vertexUtil.cubeIndices;
    var makeVertices3DCylinder = (function(){
      var vertices = vertexUtil.make3DCylinder(128, 256);
      return function(rotation) {
        var scale = 128 / Math.sqrt(rotation.xg * rotation.xg + rotation.xr * rotation.xr);
        var hx = rotation.xr * scale, hy = rotation.xg * scale;
        return vertices.concat([
            [-hx, -hy, -128], [-hx, -hy, 128], [hx, hy, -128], [hx, hy, 128],
            [0, 0, -128], [0, 0, 128]
        ]);
      };
    })();
    var vertexIndicesCylinder = vertexUtil.cylinderIndices.concat([
      [72, 73], [74, 75],
      [76, 0, 1, 77, 25, 24, 76, 48, 49, 77, 76]
    ]);
    var makeVertices3DYCbCr = function(mat) {
      var p3d = function(r, g, b, z) {
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
    var vertices3DYCbCr601 = makeVertices3DYCbCr(compareUtil.colorMatrixBT601);
    var vertices3DYCbCr709 = makeVertices3DYCbCr(compareUtil.colorMatrixBT709);
    var vertexIndicesYCbCr = vertexIndicesCube.concat([
      [2, 14], [6, 10], [8, 9], [3, 15], [7, 11],
      [18, 21, 19, 22, 20, 23, 18], // lower hexagon
      [24, 27, 25, 28, 26, 29, 24], // upper hexagon
      [18, 24], [21, 27], [19, 25], [22, 28], [20, 26], [23, 29]
    ]);
    var vertices3DCIEXyy = vertices3DCube.concat([
      [163.2 - 128, 84.15 - 128, -128], // lower chromaticity points
      [76.5 - 128, 153 - 128, -128],
      [38.25 - 128, 15.3 - 128, -128],
      [163.2 - 128, 84.15 - 128, 128],  // upper
      [76.5 - 128, 153 - 128, 128],
      [38.25 - 128, 15.3 - 128, 128]
    ]);
    var vertexIndicesCIEXyy = vertexIndicesCube.concat([
      [4, 12], [5, 13],
      [18, 19, 20, 18], [21, 22, 23, 21],
      [18, 21], [19, 22], [20, 23]
    ]);
    var makeFigure = function(fig, colorTable) {
      var context = fig.context;
      var distMax = colorTable.totalCount;
      var dist = new Uint32Array(320 * 320);
      if (colorMode.current() === true) { // RGB with Color
        var colorMap = new Float32Array(320 * 320 * 3);
      }
      var colors = colorTable.colors;
      var counts = colorTable.counts;
      var rotation = makeRotationCoefs(rotationController.orientation);
      var xr = rotation.xr, yr = rotation.yr;
      var xg = rotation.xg, yg = rotation.yg;
      var yb = rotation.yb;
      var rgbColors = colors;
      var convertOption = null;
      if (colorDistType.current() === 0) { // 0:RGB
        convertOption = colorDistAuxType.current() === 0 ?
            null :
            ['linearColors', compareUtil.convertColorListRgbToLinear];
      } else if (colorDistType.current() === 1) { // 1:HSV
        convertOption = colorDistAuxType.current() === 0 ?
            ['hsvColors', compareUtil.convertColorListRgbToHsv] :
            ['hsvLinearColors', compareUtil.convertColorListRgbToHsvLinear];
      } else if (colorDistType.current() === 2) { // 2:HSL
        convertOption = colorDistAuxType.current() === 0 ?
            ['hslColors', compareUtil.convertColorListRgbToHsl] :
            ['hslLinearColors', compareUtil.convertColorListRgbToHslLinear];
      } else if (colorDistType.current() === 4) { // 4:CIE xyY
        convertOption = ['xyyColors', compareUtil.convertColorListRgbToXyy];
      }
      if (convertOption) {
        if (!colorTable[convertOption[0]]) {
          colorTable[convertOption[0]] = convertOption[1](colors);
        }
        colors = colorTable[convertOption[0]];
      }
      if (colorDistType.current() === 0 ||
          colorDistType.current() === 1 ||
          colorDistType.current() === 2 ||
          colorDistType.current() === 4) { // 0:RGB, 1:HSV, 2:HSL, 4:CIE xyY
        var coef_xr = xr;
        var coef_xg = xg;
        var coef_xb = 0;
        var coef_yr = yr;
        var coef_yg = yg;
        var coef_yb = yb;
      } else { // 3:YCbCr
        var mat = colorDistAuxType2.current() === 0 ?
            compareUtil.colorMatrixBT601 :
            compareUtil.colorMatrixBT709;
        var coef_xr = mat[1][0] * xr + mat[2][0] * xg;
        var coef_xg = mat[1][1] * xr + mat[2][1] * xg;
        var coef_xb = mat[1][2] * xr + mat[2][2] * xg;
        var coef_yr = mat[1][0] * yr + mat[2][0] * yg + mat[0][0] * yb;
        var coef_yg = mat[1][1] * yr + mat[2][1] * yg + mat[0][1] * yb;
        var coef_yb = mat[1][2] * yr + mat[2][2] * yg + mat[0][2] * yb;
      }
      var orgx = 159.5 - 127.5 * (coef_xr + coef_xg + coef_xb);
      var orgy = 159.5 - 127.5 * (coef_yr + coef_yg + coef_yb);
      for (var k = 0, n = colors.length; k < n; k += 1) {
        var rgb = colors[k];
        var r = rgb >> 16;
        var g = (rgb >> 8) & 255;
        var b = rgb & 255;
        var plotx = Math.round(orgx + coef_xr * r + coef_xg * g + coef_xb * b);
        var ploty = Math.round(orgy + coef_yr * r + coef_yg * g + coef_yb * b);
        var offset = ploty * 320 + plotx;
        var count = counts[k];
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
      if (colorMap) { // RGB with Color
        var bits = makeDistributionImageDataRGBA(context, 320, 320, dist, colorMap, distMax, 255);
      } else { // RGB without Color
        var bits = makeDistributionImageData(context, 320, 320, dist, distMax, 255, 1);
      }
      context.putImageData(bits, 0, 0);
      var vbox = '0 0 320 320';
      var v = rotation.vertices3DTo2D(
        colorDistType.current() === 0 ? vertices3DCube : // 0:RGB
        (colorDistType.current() === 1 ||
         colorDistType.current() === 2) ? makeVertices3DCylinder(rotation) : // 1:HSV, 2:HSL
        colorDistType.current() === 3 ? ( // 3:YCbCr
          colorDistAuxType2.current() === 0 ? vertices3DYCbCr601 :vertices3DYCbCr709
        ) : vertices3DCIEXyy // 4:CIE xyY
      );
      var axesDesc = makeAxesDesc(v,
          colorDistType.current() === 0 ? vertexIndicesCube : // 0:RGB
          colorDistType.current() === 1 ? vertexIndicesCylinder : // 1:HSV
          colorDistType.current() === 2 ? vertexIndicesCylinder : // 2:HSL
          colorDistType.current() === 3 ? vertexIndicesYCbCr : // 3:YCbCr
          vertexIndicesCIEXyy // 4:CIE xyY
      );
      if (colorDistType.current() === 0) {
        var labels = [
          { pos: [-140, -140, -140], text: 'O', color: '#888', hidden: (xr < 0 && 0 < yr && 0 < xg) },
          { pos: [140, -140, -140], text: 'R', color: '#f00', hidden: (xr < 0 && yr < 0 && xg < 0) },
          { pos: [-140, 140, -140], text: 'G', color: '#0f0', hidden: (0 < xg && yg < 0 && 0 < yr) },
          { pos: [-140, -140, 140], text: 'B', color: '#00f', hidden: (xr < 0 && yr < 0 && 0 < xg) }
        ];
      } else if (colorDistType.current() === 1 || colorDistType.current() === 2) {
        var labels = [
          { pos: [0, 0, 140], text: (colorDistType.current() === 1 ? 'V' : 'L'), color: '#ccc', hidden: false },
          { pos: [0, 0, -140], text: 'O', color: '#888', hidden: false },
          { pos: [160, 0, -140], text: 'S H=0', color: '#f00', hidden: (xg < 0 && yb * 2 < yr && yr < -2 * Math.abs(yg)) },
          { pos: [-80, 140, -140], text: 'H=120', color: '#0f0', hidden: (-xr*1.73-xg < 0 && yb * 4 < yg*1.73-yr && yg*1.73-yr < -4 * Math.abs(-yr*1.73-yg)) },
          { pos: [-80, -140, -140], text: 'H=240', color: '#00f', hidden: (-xr*1.73+xg > 0 && yb * 4 < yg*-1.73-yr && yg*-1.73-yr < -4 * Math.abs(-yr*1.73+yg)) }
        ];
      } else if (colorDistType.current() === 3) {
        var labels = [
          { pos: [0, 0, 140], text: 'Y', color: '#ccc', hidden: false },
          { pos: [0, 0, -140], text: 'O', color: '#888', hidden: false },
          { pos: [140, 0, -140], text: 'Cb', color: '#08f', hidden: (xg < 0 && yb * 2 < yr && yr < -2 * Math.abs(yg)) },
          { pos: [0, 140, -140], text: 'Cr', color: '#08f', hidden: (0 < xr && yb * 2 < yg && yg < -2 * Math.abs(yr)) }
        ];
      } else if (colorDistType.current() === 4) {
        var labels = [
          { pos: [-140, -140, -140], text: 'O', color: '#888', hidden: (xr < 0 && 0 < yr && 0 < xg) },
          { pos: [140, -140, -140], text: 'x', color: '#08f', hidden: false },
          { pos: [-140, 140, -140], text: 'y', color: '#08f', hidden: false },
          { pos: [-140, -140, 140], text: 'Y', color: '#ccc', hidden: false }
        ];
      }
      if (!fig.axes) {
        fig.axes = makeAxesSVG(vbox, labels, axesDesc);
      } else {
        $(fig.axes).find('g path').attr('d', axesDesc);
      }
      updateAxesLabels(fig.axes, labels, rotation);
    };
    var redrawFigureAll = function() {
      for (var i = 0, img; img = images[i]; i++) {
        if (img.colorTable) {
          var fig = {
            canvas : img.colorDist,
            context : img.colorDist.getContext('2d'),
            axes : img.colorDistAxes
          };
          makeFigure(fig, img.colorTable);
        }
      }
    };
    var createFigure = function(img) {
      var fig = figureUtil.makeBlankFigure(320, 320);
      if (img.colorTable) {
        makeFigure(fig, img.colorTable);
      }
      img.colorDist = fig.canvas;
      img.colorDistAxes = fig.axes;
    };
    var updateFigure = function(img) {
      if (img === undefined) {
        for (var i = 0; img = images[i]; i++) {
          createFigure(img);
        }
      } else {
        createFigure(img);
      }
      updateTable();
    };
    var updateTable = function(transformOnly) {
      var w = 320, h = 320, margin = 10;
      var styles = makeFigureStyles(w, h, margin, '#444');
      var scale = rotationController.getScale();
      styles.style.transform += ' scale(' + scale + ')';
      updateFigureTable('#colorDistTable', 'colorDist', updateAsync, styles, transformOnly);
    };
    var toggle = dialogUtil.defineDialog($('#colorDist'), updateTable, toggleAnalysis, {
      onOpen: rotationController.resetZoom
    });
    var rotationInputFilter = makeRotationInputFilter('#colorDist', rotationController);
    var processKeyDown = function(e) {
      if (e.keyCode === 81/* q */) {
        colorMode.set(!colorMode.current());
        return false;
      }
      return rotationInputFilter.processKeyDown(e);
    };
    return {
      updateFigure: updateFigure,
      toggle: toggle,
      processKeyDown: processKeyDown,
      enableMouseAndTouch: rotationInputFilter.enableMouseAndTouch
    };
  })();
  // 3D Waveform
  var waveform3DDialog = (function() {
    var waveform3DType = makeModeSwitch('#waveform3DType', 0, function(type) {
      updateFigure();
      updateAuxOption();
    });
    var waveform3DAuxType = makeModeSwitch('#waveform3DAuxType', 0, function(type) {
      updateFigure();
    });
    var waveform3DAuxType2 = makeModeSwitch('#waveform3DAuxType2', 0, function(type) {
      updateFigure();
    });
    var updateAuxOption = function() {
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
    var updateAsync = function(img) {
      taskQueue.addTask({
        cmd:      'calc3DWaveform',
        baseSize: 512,
        index:    [img.index]
      }, attachImageDataToTask);
    };
    var rotationController = makeRotationController(
      function() { redrawFigureAll(); },
      function() { updateTable(/* transformOnly = */ true); },
      { x: 20, y: -110 }
    );
    var vertexIndicesCube = vertexUtil.cubeIndices;
    var makeColorGradientStops = function(type) {
      var color2 =
          type === 0 ? '#fff' :
          (type === 1 || type === 4) ? '#f00' :
          (type === 2 || type === 5) ? '#0f0' :
          '#00f';
      if (type <= 3) {
        var colorStops = [[0, '#000'], [1, color2]];
      } else {
        var colorStops = [[0, '#000']];
        var prefix = type === 4 ? '#' : type === 5 ? '#0' : '#00';
        var suffix = type === 4 ? '00' : type === 5 ? '0' : '';
        for (var i = 1; i < 16; i++) {
          var c = compareUtil.srgb255ToLinear255[i * 0x11] / 255;
          colorStops.push([c, prefix + i.toString(16) + suffix]);
        }
      }
      return colorStops;
    };
    var colorStopsForType = (function(){
      colorStopsForType = [];
      for (var type = 0; type < 7; type++) {
        colorStopsForType.push(makeColorGradientStops(type));
      }
      return colorStopsForType;
    })();
    var drawVerticalColorBar = function(ctx, v, colorStops) {
      var bar = (function() {
        var x = 320/2, y0, y1;
        for (var i = 0, corners = [0, 4, 12, 16]; i < 4; i++) {
          var k = corners[i];
          if (x > v[k][0]) {
            x = v[k][0];
            y0 = v[k + 1][1];
            y1 = v[k][1];
          }
        }
        return [x - 12, y0, x - 1, y1];
      })();
      ctx.fillStyle = figureUtil.makeLinearGradient(
        ctx, bar[0], bar[3], bar[0], bar[1], colorStops
      );
      ctx.fillRect(bar[0], bar[1], bar[2] - bar[0], bar[3] - bar[1]);
    };
    var makeWaveformY = function(n, waveform, mat) {
      var m0 = mat[0][0], m1 = mat[0][1], m2 = mat[0][2];
      var waveformY = new Uint8Array(n);
      for (var k = 0; k < n; k++) {
        var r = waveform[k * 3];
        var g = waveform[k * 3 + 1];
        var b = waveform[k * 3 + 2];
        waveformY[k] = Math.round(m0 * r + m1 * g + m2 * b);
      }
      return waveformY;
    };
    var makeFigure = function(fig, waveform3D) {
      var type = waveform3DType.current();
      if (waveform3DAuxType.current() === 1 && 1 <= type && type <= 3 ) {
        type += 3;
      }
      var context = fig.context;
      var w = waveform3D.width;
      var h = waveform3D.height;
      var waveform = waveform3D.waveform;
      if (type === 0) { // Y
        if (waveform3DAuxType2.current() === 0) { // 0:bt601
          if (waveform3D.Y601 === undefined) {
            waveform3D.Y601 = makeWaveformY(w * h, waveform, compareUtil.colorMatrixBT601);
          }
          var waveformY = waveform3D.Y601;
        } else { // 1:bt709
          if (waveform3D.Y709 === undefined) {
            waveform3D.Y709 = makeWaveformY(w * h, waveform, compareUtil.colorMatrixBT709);
          }
          var waveformY = waveform3D.Y709;
        }
      }
      var distMax = w * h * 1; // common for all type;
      var dist = new Uint32Array(320 * 320);
      var colorMap = new Float32Array(320 * 320 * 3);
      var vertices3DCube = vertexUtil.makeCube(h, w, 256);
      var scale = 256 / Math.max(w, h);
      var rotation = makeRotationCoefs(rotationController.orientation, scale, scale, 1);
      var xr = rotation.xr, yr = rotation.yr;
      var xg = rotation.xg, yg = rotation.yg;
      var yb = rotation.yb;
      var orgx = 159.5 - ((h - 1) / 2 * xr + (w - 1) / 2 * xg);
      var orgy = 159.5 - ((h - 1) / 2 * yr + (w - 1) / 2 * yg + 127.5 * yb);
      var toLinear = compareUtil.srgb255ToLinear8;
      for (var y = 0, k = 0; y < h; y += 1) {
        for (var x = 0; x < w; x += 1, k += 1) {
          var r = waveform[k * 3];
          var g = waveform[k * 3 + 1];
          var b = waveform[k * 3 + 2];
          var c =
              type === 0 ? waveformY[k] : // Y
              type === 1 ? r : // R
              type === 2 ? g : // G
              type === 3 ? b : // B
              type === 4 ? toLinear[r] : // Linear R
              type === 5 ? toLinear[g] : // Linear G
              toLinear[b]; // Linear B
          var plotx = Math.round(orgx + xr * y + xg * x);
          var ploty = Math.round(orgy + yr * y + yg * x + yb * c);
          var offset = ploty * 320 + plotx;
          dist[offset] += 1;
          colorMap[offset] += r;
          colorMap[offset + 102400] += g;
          colorMap[offset + 204800] += b;
        }
      }
      var bits = makeDistributionImageDataRGBA(context, 320, 320, dist, colorMap, distMax, 255);
      context.putImageData(bits, 0, 0);
      var vbox = '0 0 320 320';
      var v = rotation.vertices3DTo2D(vertices3DCube);
      drawVerticalColorBar(context, v, colorStopsForType[type]);
      var axesDesc = makeAxesDesc(v, vertexIndicesCube);
      var s = 12 / scale;
      var labels = [
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
        fig.axes = makeAxesSVG(vbox, labels, axesDesc);
      } else {
        $(fig.axes).find('g path').attr('d', axesDesc);
      }
      updateAxesLabels(fig.axes, labels, rotation);
    };
    var redrawFigureAll = function() {
      for (var i = 0, img; img = images[i]; i++) {
        if (img.waveform3D) {
          var fig = {
            canvas : img.waveform3DFig,
            context : img.waveform3DFig.getContext('2d'),
            axes : img.waveform3DFigAxes
          };
          makeFigure(fig, img.waveform3D);
        }
      }
    };
    var createFigure = function(img) {
      var fig = figureUtil.makeBlankFigure(320, 320);
      if (img.waveform3D) {
        makeFigure(fig, img.waveform3D);
      }
      img.waveform3DFig = fig.canvas;
      img.waveform3DFigAxes = fig.axes;
    };
    var updateFigure = function(img) {
      if (img === undefined) {
        for (var i = 0; img = images[i]; i++) {
          createFigure(img);
        }
      } else {
        createFigure(img);
      }
      updateTable();
    };
    var updateTable = function(transformOnly) {
      var w = 320, h = 320, margin = 10;
      var styles = makeFigureStyles(w, h, margin, '#444');
      var scale = rotationController.getScale();
      styles.style.transform += ' scale(' + scale + ')';
      updateFigureTable('#waveform3DTable', 'waveform3DFig', updateAsync, styles, transformOnly);
    };
    var toggle = dialogUtil.defineDialog($('#waveform3D'), updateTable, toggleAnalysis, {
      onOpen: rotationController.resetZoom
    });
    var rotationInputFilter = makeRotationInputFilter('#waveform3D', rotationController);
    return {
      updateFigure: updateFigure,
      toggle: toggle,
      processKeyDown: rotationInputFilter.processKeyDown,
      enableMouseAndTouch: rotationInputFilter.enableMouseAndTouch
    };
  })();
  var colorFreqDialog = (function() {
    var drawFigure = function(reducedColorTable) {
      var colorList = reducedColorTable.colorList;
      var height = 480;
      var fig = figureUtil.makeBlankFigure(256, height);
      var context = fig.context;
      context.fillStyle = '#444';
      context.fillRect(0, 0, 256, height);
      var topCount = colorList[0][1];
      var numImportant = Math.min(24, colorList.length);
      var threshold = Math.max(1, reducedColorTable.totalCount / 100000);
      for (var k = 0; k < numImportant; k++) {
        if (colorList[k][1] <= threshold) {
          numImportant = k;
          break;
        }
      }
      if (numImportant + 1 === colorList.length) {
        numImportant = colorList.length;
      }
      var numEntries = numImportant < colorList.length ? numImportant + 1 : numImportant;
      context.font = '14px sans-serif';
      var others = null;
      if (numImportant < colorList.length) {
        others = [0, 0, 0, 0, 0];
        for (var k = numImportant; k < colorList.length; k++) {
          others[1] += colorList[k][1];
          others[2] += colorList[k][2];
          others[3] += colorList[k][3];
          others[4] += colorList[k][4];
        }
      }
      for (var k = 0; k < numEntries; k++) {
        var entry = (k === numImportant) ? others : colorList[k];
        var count = entry[1];
        var r = Math.round(entry[2] / count);
        var g = Math.round(entry[3] / count);
        var b = Math.round(entry[4] / count);
        var frequency = count / topCount;
        var rgb = compareUtil.toHexTriplet(r, g, b);
        var y0 = k / numEntries * height;
        var y1 = (k + 1) / numEntries * height;
        var ratio = count / reducedColorTable.totalCount;
        var label = entry === others ? 'Others' : rgb;
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
    var updateAsync = function(img) {
      taskQueue.addTask({
        cmd:      'calcReducedColorTable',
        index:    [img.index]
      }, attachImageDataToTask);
    };
    var updateFigure = function(img) {
      updateTable();
    };
    var updateTable = function() {
      var target = $('#colorFreqTable');
      target.find('td').remove();
      for (var i = 0, img; img = images[i]; i++) {
        var label = makeImageNameWithIndex('<td>', img);
        target.find('tr').eq(0).append(label);
        var cell = $('<td>');
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
        var figure = drawFigure(img.reducedColorTable);
        cell.append(figure);
      }
      if (i === 0) {
        target.find('tr').eq(0).append(
          $('<td>').text('no data')
        );
      }
    };
    var toggle = dialogUtil.defineDialog($('#colorFreq'), updateTable, toggleAnalysis);
    return {
      updateFigure: updateFigure,
      toggle: toggle
    };
  })();
  var makeImageNameSelector = function(selectedIndex, onchange) {
    var select = $('<select>').on('change', function(e) {
      var index = parseInt(this.options[this.selectedIndex].value);
      onchange(index);
      return false;
    });
    for (var i = 0, img; img = images[i]; i++) {
      var option = $('<option>').text(img.name).attr('value', img.index);
      select.append(option);
      if (img.index === selectedIndex) {
        option.attr('selected','');
      }
    }
    var number = viewManagement.numberFromIndex(selectedIndex);
    return $('<span>').append(
      $('<span class="imageIndex"/>').text(number),
      select
    );
  };
  // Image Quality Metrics
  var metricsDialog = (function() {
    var metricsMode = makeModeSwitch('#metricsMode', 0, function(type) {
      updateTable();
    });
    var metricsToString = function(metrics, imgA) {
      if (typeof metrics === 'string') {
        return { psnr: metrics, rmse: metrics, mse: metrics, mae: metrics, ssd: metrics, sad: metrics, ncc: metrics, ae: metrics };
      }
      var m = metricsMode.current() === 0 ? metrics : metrics.y;
      return {
        psnr:
            isNaN(m.psnr) ? '‐' :
            m.psnr === Infinity ? '∞ dB' :
            m.psnr.toFixed(2) + ' dB',
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
            isNaN(m.ncc) ? '‐' :
            m.ncc.toFixed(6),
        ae:
            isNaN(metrics.ae) ? '‐' :
            compareUtil.addComma(metrics.ae) +
                ' (' + compareUtil.toPercent(metrics.ae/imgA.width/imgA.height) + ')'
      };
    };
    var updateTable = function() {
      $('#metricsTable td:not(.prop)').remove();
      textUtil.setText($('#metricsModeLabel'),
        metricsMode.current() === 0 ? { en: 'RGB', ja: 'RGB' } : { en: 'Luminance', ja: '輝度' }
      );
      var rowCount = $('#metricsTable tr').length;
      if (images.length === 0) {
        $('#metricsBaseName').append($('<td>').attr('rowspan', rowCount).text('no data'));
        return;
      }
      if (images.length === 1) {
        $('#metricsTargetName').append($('<td>').attr('rowspan', rowCount - 1).text('no data'));
      }
      setBaseAndTargetImage(null, null);
      $('#metricsBaseName').append(
        $('<td>').attr('colspan', images.length - 1).append(
          makeImageNameSelector(baseImageIndex, function(index) {
            changeBaseImage(index);
            updateTable();
          })
        )
      );
      for (var i = 0, img; img = images[i]; i++) {
        updateTableCell(img);
      }
    };
    var updateTableCell = function(img) {
      if (img.index === baseImageIndex) {
        return;
      }
      var a = entries[baseImageIndex];
      var b = img;
      if (!a.metrics[b.index] && !(a.width === b.width && a.height === b.height)) {
        var invalid = {
          psnr: NaN, sad: NaN, ssd: NaN, mae: NaN, mse: NaN, ncc: NaN,
          y: { psnr: NaN, sad: NaN, ssd: NaN, mae: NaN, mse: NaN, ncc: NaN },
          ae: NaN, aeRgb: NaN, aeAlpha: NaN
        };
        a.metrics[b.index] = invalid;
        b.metrics[a.index] = invalid;
      }
      if (!a.metrics[b.index]) {
        a.metrics[b.index] = 'calculating...';
        b.metrics[a.index] = 'calculating...';
        taskQueue.addTask({
          cmd:      'calcMetrics',
          index:    [a.index, b.index],
          options:  {
            orientationA: entries[a.index].orientation,
            orientationB: entries[b.index].orientation
          }
        }, attachImageDataToTask);
      }
      $('#metricsTargetName').append(
        $('<td>').append(
          makeImageNameWithIndex('<span>', b),
          '&nbsp;',
          $('<button>').text('↑').click(function(e) {
            changeBaseImage(b.index);
            updateTable();
          })
        )
      );
      var values = metricsToString(a.metrics[b.index], a);
      $('#psnrValue').append($('<td>').text(compareUtil.hyphenToMinus(values.psnr)));
      $('#rmseValue').append($('<td>').text(values.rmse));
      $('#mseValue').append($('<td>').text(values.mse));
      $('#maeValue').append($('<td>').text(values.mae));
      $('#ssdValue').append($('<td>').text(values.ssd));
      $('#sadValue').append($('<td>').text(values.sad));
      $('#nccValue').append($('<td>').text(compareUtil.hyphenToMinus(values.ncc)));
      $('#aeValue').append($('<td>').text(values.ae));
    };
    var toggle = dialogUtil.defineDialog($('#metrics'), updateTable, toggleAnalysis);
    return {
      updateTable: updateTable,
      toggle: toggle
    };
  })();
  var setupBaseAndTargetSelector = function(baseSelector, targetSelector, onUpdate) {
    $(baseSelector).children().remove();
    $(targetSelector).children().remove();
    if (images.length < 2) {
      $(baseSelector).append($('<span>').text('no data'));
      $(targetSelector).append($('<span>').text('no data'));
      return false;
    }
    setBaseAndTargetImage(null, null);
    $(baseSelector).append(
      makeImageNameSelector(baseImageIndex, function(index) {
        changeBaseImage(index);
        onUpdate();
      })
    );
    $(targetSelector).append(
      makeImageNameSelector(targetImageIndex, function(index) {
        setBaseAndTargetImage(null, index);
        onUpdate();
      })
    );
  };
  // Tone Curve Estimation
  var toneCurveDialog = (function() {
    var toneCurveResult = {};
    var repaint = function() {
      discardTasksOfCommand('calcToneCurve');
      toneCurveResult = {};
      updateTable();
    };
    var toneCurveType = makeModeSwitch('#toneCurveType', 1, function(type) {
      repaint();
      updateAuxOption();
    });
    var toneCurveAuxType2 = makeModeSwitch('#toneCurveAuxType2', 0, repaint);
    var updateAuxOption = function() {
      if (toneCurveType.current() === 0) {
        $('#toneCurveAuxType2').hide();
      } else {
        $('#toneCurveAuxType2').show();
      }
    };
    var onRemoveEntry = function(index) {
      if (toneCurveResult.base === index || toneCurveResult.target === index) {
        $('#toneCurveResult *').remove();
        toneCurveResult.result = null;
      }
    };
    var updateAsync = function() {
      toneCurveResult.base   = baseImageIndex;
      toneCurveResult.target = targetImageIndex;
      toneCurveResult.type   = toneCurveType.current();
      toneCurveResult.auxTypes = [toneCurveAuxType2.current()];
      toneCurveResult.result = null;
      discardTasksOfCommand('calcToneCurve');
      if (baseImageIndex !== targetImageIndex) {
        taskQueue.addTask({
          cmd:      'calcToneCurve',
          type:     toneCurveType.current(),
          auxTypes: [toneCurveAuxType2.current()],
          index:    [baseImageIndex, targetImageIndex],
          options:  {
            orientationA: entries[baseImageIndex].orientation,
            orientationB: entries[targetImageIndex].orientation
          }
        }, attachImageDataToTask);
      }
    };
    var makeToneMapFigure = function(toneMapData, type) {
      var fig = figureUtil.makeBlankFigure(320, 320);
      var dist = toneMapData.dist;
      var max = toneMapData.max;
      var bits = makeDistributionImageData(fig.context, 256, 256, dist, max, 96, type);
      fig.context.fillStyle = '#000';
      fig.context.fillRect(0, 0, 320, 320);
      fig.context.putImageData(bits, 32, 32);
      return fig;
    };
    var makeFigure = function(styles) {
      var numComponents = toneCurveResult.type === 0 ? 3 : 1;
      var components = toneCurveResult.result.components;
      var vbox = '0 0 ' + 320 + ' ' + 320;
      var curvePaths = [];
      var pointToCoord = function(p) {
        var x = 32 + p[0];
        var y = 288 - p[1];
        return x.toFixed(2) + ',' + y.toFixed(2);
      };
      var pointToPath = function(conf, p0, p1) {
        var MIN_OPACITY = 0.2;
        var opacity = Math.max(MIN_OPACITY, conf);
        return '<path opacity="' + opacity.toFixed(2) + '"' +
               ' d="M ' + pointToCoord(p0) + ' L ' + pointToCoord(p1) + '"></path>';
      };
      for (var c = 0; c < numComponents; ++c) {
        var result = components[c];
        var color = toneCurveResult.type === 0 ? ['#f00', '#0f0', '#00f'][c] : '#fff';
        curvePaths[c] = '<g stroke="' + color + '" ' +
            'style="mix-blend-mode: lighten" ' +
            'fill="none" stroke-width="1">';
        curvePaths[c] += pointToPath(0, [0, 0], result.points[0]);
        for (var i = 1, p0 = result.points[0], p1; p1 = result.points[i]; i++, p0 = p1) {
          var conf = Math.min(result.conf[i - 1], result.conf[i]);
          curvePaths[c] += pointToPath(conf, p0, p1);
        }
        curvePaths[c] += pointToPath(0, result.points[result.points.length - 1], [256, 256]);
        curvePaths[c] += '</g>';
      }
      var axesDesc = 'M 32,16 L 32,288 L 304,288';
      var scaleDesc = '';
      for (var i = 1; i <= 8; ++i) {
        var x = 32 + i / 8 * 256;
        var y = 288 - i / 8 * 256;
        scaleDesc += 'M 32,' + y + ' l 256,0 ';
        scaleDesc += 'M ' + x + ',288 l 0,-256 ';
      }
      var axes = $(
        '<svg viewBox="' + vbox + '">' +
          '<g stroke="white" fill="none">' +
            '<path stroke-width="0.1" d="' + scaleDesc + '"></path>' +
            '<path stroke-width="0.5" d="' + axesDesc + '"></path>' +
          '</g>' +
        '</svg>').
        css(styles.style);
      var dist = $(
          makeToneMapFigure(toneCurveResult.result.toneMap, toneCurveResult.type).canvas
        ).css(styles.style).addClass('figMain');
      var curve = $(
        '<svg viewBox="' + vbox + '">' +
          curvePaths.join() +
        '</svg>').
        css(styles.style);
      $('#toneCurveResult').append(dist).append(curve).append(axes).css(styles.cellStyle);
    };
    var updateTableDOM = function() {
      $('#toneCurveResult *').remove();
      if (false === setupBaseAndTargetSelector('#toneCurveBaseName', '#toneCurveTargetName', updateTable)) {
        return;
      }
      var a = entries[baseImageIndex];
      var b = entries[targetImageIndex];
      if (toneCurveResult.base !== baseImageIndex ||
          toneCurveResult.target !== targetImageIndex ||
          toneCurveResult.type !== toneCurveType.current() ||
          toneCurveResult.auxTypes[0] !== toneCurveAuxType2.current()) {
        updateAsync();
      }
      var figW = 320, figH = 320, figMargin = 8;
      var styles = makeFigureStyles(figW, figH, figMargin, '#666', figureZoom);
      if (toneCurveResult.result === null) {
        $('#toneCurveResult').append(figureUtil.makeBlankFigure(8,8).canvas).css(styles.cellStyle);
      } else {
        makeFigure(styles);
      }
    };
    var updateTable = function(transformOnly) {
      if (transformOnly) {
        if (toneCurveResult.result !== null) {
          $('#toneCurveResult > *').css({
            transform: 'translate(-50%,0%) ' + figureZoom.makeTransform()
          });
        }
      } else {
        updateTableDOM();
      }
    };
    var updateFigure = function(type, auxTypes, baseIndex, targetIndex, result) {
      if (type === toneCurveType.current() &&
          auxTypes[0] === toneCurveAuxType2.current() &&
          baseIndex === toneCurveResult.base &&
          targetIndex === toneCurveResult.target) {
        toneCurveResult.type = type;
        toneCurveResult.auxTypes = auxTypes;
        toneCurveResult.result = result;
      }
      updateTable();
    };
    var toggle = dialogUtil.defineDialog($('#toneCurve'), updateTable, toggleAnalysis, {
      enableZoom: true, getBaseSize: function() { return { w: 320, h: 320 }; }
    });
    return {
      onRemoveEntry: onRemoveEntry,
      updateTable: updateTable,
      updateFigure: updateFigure,
      toggle: toggle
    };
  })();
  // Optical Flow
  var opticalFlowDialog = (function() {
    var opticalFlowResult = {};
    var pointedVector = null;
    $('#opticalFlowGridBtn').click(grid.toggle);
    $('#opticalFlow').on('mousemove', 'td.fig > *', function(e) {
      if (opticalFlowResult.result !== null) {
        var point = figureZoom.positionFromMouseEvent(e, this, null);
        onFigurePointed(point);
      }
    });
    var findPointedVector = function(point) {
      var w = opticalFlowResult.result.image.width;
      var h = opticalFlowResult.result.image.height;
      var px = point.x * w;
      var py = point.y * h;
      var nearest = 0, distance = w + h, size = 0;
      for (var i = 0, p; p = opticalFlowResult.result.points[i]; i++) {
        var distX = px - (p.x0 + p.x1) * 0.5;
        var distY = py - (p.y0 + p.y1) * 0.5;
        var d = Math.sqrt(distX * distX + distY * distY);
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
    var arrowMarkDesc = [
      'M9,9L1,1 m0,3v-3h3',
      'M1,9L9,1 m-3,0h3v3',
      'M1,1L9,9 m0,-3v3h-3',
      'M9,1L1,9 m0,-3v3h3'
    ];
    var makeArrowMark = function(dx, dy) {
      var arrowType = dy < 0 ? (dx < 0 ? 0 : 1) : (dx < 0 ? 3 : 2);
      var desc = arrowMarkDesc[arrowType];
      return $('<svg viewBox="0 0 10 10"><path fill="none" stroke="white" stroke-width="0.8" d="' + desc + '"></path></svg>').css({
        display: 'inline-block',
        verticalAlign: '-10%',
        width: '12px',
        heigit: '12px'
      });
    };
    var updateMotionVectorPopup = function() {
      var dx = pointedVector.x1 - pointedVector.x0;
      var dy = pointedVector.y1 - pointedVector.y0;
      var dxText = compareUtil.toSignedFixed(dx, 2) + 'px';
      var dyText = compareUtil.toSignedFixed(dy, 2) + 'px';
      var w = opticalFlowResult.result.image.width;
      var h = opticalFlowResult.result.image.height;
      var popupX = (pointedVector.x1 / w) * 100 + '%';
      var popupY = (1 - (pointedVector.y1 / h)) * 100 + '%';
      var arrowMark = makeArrowMark(dx, dy);
      var text = $('<span>').text(dxText + ', ' + dyText);
      var span = $('#opticalFlowResult > div > span');
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
    var updateMotionVectorInfo = function() {
      var dx = pointedVector.x1 - pointedVector.x0;
      var dy = pointedVector.y1 - pointedVector.y0;
      var dxText = compareUtil.toSignedFixed(dx, 2) + 'px';
      var dyText = compareUtil.toSignedFixed(dy, 2) + 'px';
      $('#opticalFlowSelectedDeltaX').text(dxText);
      $('#opticalFlowSelectedDeltaY').text(dyText);
    };
    var onFigurePointed = function(point) {
      if (opticalFlowResult.result !== null) {
        var nearest = findPointedVector(point);
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
    var processClick = function(point) {
      onFigurePointed(point);
    };
    var onRemoveEntry = function(index) {
      if (opticalFlowResult.base === index || opticalFlowResult.target === index) {
        $('#opticalFlowResult > *').remove();
        opticalFlowResult.result = null;
        pointedVector = null;
      }
    };
    var updateOptionsDOM = function() {
      $('#opticalFlowResult > *').remove();
      $('#opticalFlowDeltaX,#opticalFlowDeltaY').text('--');
      $('#opticalFlowSelectedDeltaX,#opticalFlowSelectedDeltaY').text('--');
      $('#opticalFlowSummary *').remove();
      if (false === setupBaseAndTargetSelector('#opticalFlowBaseName', '#opticalFlowTargetName', updateTable)) {
        return false;
      }
      return true;
    };
    var updateAsync = function() {
      opticalFlowResult.base   = baseImageIndex;
      opticalFlowResult.target = targetImageIndex;
      opticalFlowResult.result  = null;
      pointedVector = null;
      discardTasksOfCommand('calcOpticalFlow');
      if (baseImageIndex !== targetImageIndex) {
        taskQueue.addTask({
          cmd:      'calcOpticalFlow',
          index:    [baseImageIndex, targetImageIndex],
          options:  {
            orientationA: entries[baseImageIndex].orientation,
            orientationB: entries[targetImageIndex].orientation
          }
        }, attachImageDataToTask);
      }
    };
    var makeFigure = function(styles) {
      var w = opticalFlowResult.result.image.width;
      var h = opticalFlowResult.result.image.height;
      var fig = figureUtil.makeBlankFigure(w, h);
      var bits = fig.context.createImageData(w, h);
      figureUtil.copyImageBits(opticalFlowResult.result.image, bits);
      var vectorPaths = [];
      fig.context.putImageData(bits, 0, 0);
      var pointToCoord = function(x, y) {
        return x.toFixed(2) + ',' + y.toFixed(2);
      };
      for (var i = 0, p; p = opticalFlowResult.result.points[i]; i++) {
        vectorPaths.push(
          'M ' + pointToCoord(p.x0 + 0.5, p.y0 + 0.5) +
          ' L ' + pointToCoord(p.x1 + 0.5, p.y1 + 0.5)
        );
      }
      var vectors =
          '<g stroke="white" fill="none">' +
            '<path stroke-width="0.6" d="' + vectorPaths.join(' ') + '"></path>' +
          '</g>';
      styles = updateFigureStylesForActualSize(styles, w, h);
      opticalFlowResult.baseWidth = styles.baseW;
      opticalFlowResult.baseHeight = styles.baseH;
      styles.style.transform = 'translate(-50%,0%) ' + figureZoom.makeTransform();
      var picture = $(fig.canvas).css(styles.style).addClass('figMain');
      var overlay = $('<svg viewBox="0 0 ' + w + ' ' + h + '">' + vectors + '</svg>').css(styles.style);
      opticalFlowResult.grid = grid.isEnabled() ? grid.makeGrid(w, h).css(styles.style) : null;
      var popup = $('<div>').append($('<span>')).css(styles.style);
      $('#opticalFlowResult').append(picture);
      if (opticalFlowResult.grid) {
        $('#opticalFlowResult').append(opticalFlowResult.grid);
        updateGridStyle();
      }
      $('#opticalFlowResult').append(overlay).append(popup).css(styles.cellStyle);
    };
    var updateStatistics = function() {
      if (opticalFlowResult.result.points.length === 0) {
        $('#opticalFlowDeltaX,#opticalFlowDeltaY').text('--');
      } else {
        var sumDX = 0;
        var sumDY = 0;
        for (var i = 0, p; p = opticalFlowResult.result.points[i]; i++) {
          sumDX += p.x1 - p.x0;
          sumDY += p.y1 - p.y0;
        }
        var avgDX = sumDX / opticalFlowResult.result.points.length;
        var avgDY = sumDY / opticalFlowResult.result.points.length;
        $('#opticalFlowDeltaX').text(compareUtil.toSignedFixed(avgDX, 2) + 'px');
        $('#opticalFlowDeltaY').text(compareUtil.toSignedFixed(avgDY, 2) + 'px');
      }
    };
    var updateReport = function(styles) {
      makeFigure(styles);
      updateStatistics();
      if (opticalFlowResult.result.points.length === 0) {
        textUtil.setText($('#opticalFlowSummary'), {
          en: 'Could not detect any optical flow',
          ja: 'オプティカルフローを検出できませんでした'
        });
      } else {
        var num = opticalFlowResult.result.points.length;
        textUtil.setText($('#opticalFlowSummary'), {
          en: 'Optical flow detected for ' + num + ' points',
          ja: 'オプティカルフローが ' + num + ' 点で検出されました'
        });
      }
    };
    var updateHeader = function() {
      var gridbtn = $('#opticalFlowGridBtn');
      grid.isEnabled() ? gridbtn.addClass('current') : gridbtn.removeClass('current');
    };
    var updateTableDOM = function() {
      if (false === updateOptionsDOM()) {
        return;
      }
      if (opticalFlowResult.base !== baseImageIndex || opticalFlowResult.target !== targetImageIndex) {
        updateAsync();
      }
      var figW = Math.max(600, Math.round($('#view').width() * 0.65));
      var figH = Math.max(320, Math.round($('#view').height() * 0.55)), figMargin = 8;
      var styles = makeFigureStyles(figW, figH, figMargin, '#000');
      if (opticalFlowResult.result === null) {
        $('#opticalFlowResult').append(figureUtil.makeBlankFigure(8,8).canvas).css(styles.cellStyle);
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
    var updateGridStyle = function() {
      if (opticalFlowResult.result !== null && opticalFlowResult.grid) {
        grid.updateGridStyle(
          opticalFlowResult.grid,
          opticalFlowResult.result.image.width,
          opticalFlowResult.baseWidth,
          figureZoom.scale);
      }
    };
    var updateTable = function(transformOnly) {
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
    var updateFigure = function(baseIndex, targetIndex, result) {
      if (opticalFlowResult.base === baseIndex && opticalFlowResult.target === targetIndex) {
        opticalFlowResult.result = result;
        pointedVector = null;
      }
      updateTable();
    };
    var toggle = dialogUtil.defineDialog($('#opticalFlow'), updateTable, toggleAnalysis, {
      enableZoom: true,
      getBaseSize: function() {
        return opticalFlowResult ? { w: opticalFlowResult.baseWidth, h: opticalFlowResult.baseHeight } : null;
      },
      onOpen: function() { grid.setOnChange(updateTable); },
      onClose: function() { grid.setOnChange(null); }
    });
    return {
      processClick: processClick,
      onRemoveEntry: onRemoveEntry,
      updateTable: updateTable,
      updateFigure: updateFigure,
      toggle: toggle
    };
  })();
  // Image Diff
  var diffDialog = (function() {
    var diffResult = {};
    var diffOptions = {
      ignoreAE: 0,
      imageType: 0,
      resizeToLarger: true,
      resizeMethod: 'lanczos3',
      ignoreRemainder: false,
      offsetX: 0,
      offsetY: 0
    };
    $('#diffGridBtn').click(grid.toggle);
    $('#diffIgnoreAE').on('change', function(e) {
      if (this.validity.valid) {
        diffOptions.ignoreAE = +this.value;
        updateTable();
        return false;
      }
    });
    var diffImageType = makeModeSwitch('#diffImageType', 0, function(type) {
      diffOptions.imageType = type;
      updateImageTypeFootnote();
      updateTable();
    });
    var updateImageTypeFootnote = function() {
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
      var o = this.options[this.selectedIndex].value;
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
    var onRemoveEntry = function(index) {
      if (diffResult.base === index || diffResult.target === index) {
        $('#diffResult *').remove();
        diffResult.result = null;
      }
    };
    var updateOptionsDOM = function(styles) {
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
      if (false === setupBaseAndTargetSelector('#diffBaseName', '#diffTargetName', updateTable)) {
        return false;
      }
      var a = entries[baseImageIndex];
      var b = entries[targetImageIndex];
      if (a.width === b.width && a.height === b.height) {
        $('.diffDimension').css({display:'none'});
      } else {
        $('.diffDimension').css({display:''});
      }
      return true;
    };
    var updateAsync = function() {
      diffResult.base   = baseImageIndex;
      diffResult.target = targetImageIndex;
      diffResult.ignoreAE = diffOptions.ignoreAE;
      diffResult.imageType = diffOptions.imageType;
      diffResult.ignoreRemainder = diffOptions.ignoreRemainder;
      diffResult.resizeToLarger = diffOptions.resizeToLarger;
      diffResult.resizeMethod = diffOptions.resizeMethod;
      diffResult.offsetX = diffOptions.offsetX;
      diffResult.offsetY = diffOptions.offsetY;
      diffResult.result  = null;
      discardTasksOfCommand('calcDiff');
      if (baseImageIndex !== targetImageIndex) {
        taskQueue.addTask({
          cmd:      'calcDiff',
          index:    [baseImageIndex, targetImageIndex],
          options:  {
            ignoreAE: diffOptions.ignoreAE,
            imageType: diffOptions.imageType,
            ignoreRemainder: diffOptions.ignoreRemainder,
            resizeToLarger: diffOptions.resizeToLarger,
            resizeMethod: diffOptions.resizeMethod,
            offsetX: diffOptions.offsetX,
            offsetY: diffOptions.offsetY,
            orientationA: entries[baseImageIndex].orientation,
            orientationB: entries[targetImageIndex].orientation
          }
        }, attachImageDataToTask);
      }
    };
    var makeHistogramFigure = function(hist, ignoreAE) {
      ignoreAE = compareUtil.clamp(ignoreAE, 0, 255);
      var fig = figureUtil.makeBlankFigure(256 * 3, 320);
      var context = fig.context;
      context.fillStyle = '#222';
      context.fillRect(0,0,256*3,320);
      context.fillStyle = '#66f';
      context.fillRect(0,0,(ignoreAE + 1)*3,320);
      var max = 0;
      for (var i = 0; i < hist.length; ++i) {
        max = Math.max(max, hist[i]);
      }
      figureUtil.drawHistogram(context, '#ccc', hist, max, 0, ignoreAE + 1, 0, 320, 300);
      figureUtil.drawHistogram(context, '#fff', hist, max, ignoreAE + 1, 255 - ignoreAE, ignoreAE + 1, 320, 300);
      return fig.canvas;
    };
    var updateReport = function(styles) {
      $('#diffDetectedMaxAE').text(diffResult.result.summary.maxAE);
      if (diffOptions.ignoreAE !== 0) {
        var rate = diffResult.result.summary.countIgnoreAE / diffResult.result.summary.total;
        var percent = compareUtil.toPercent(rate);
        $('#diffIgnoreAEResult').text(percent);
        $('#diffIgnoredUnmatchedRange').text('(≦' + diffOptions.ignoreAE + ')');
        $('#diffUnmatchedRange').text('(>' + diffOptions.ignoreAE + ')');
      } else {
        $('#diffIgnoredUnmatchedRange').text('');
        $('#diffUnmatchedRange').text('');
      }
      var histFig = makeHistogramFigure(diffResult.result.summary.histogram, diffOptions.ignoreAE);
      $('#diffAEHistogram').append($(histFig).css({ width: '320px', height: '160px' }));
      var w = diffResult.result.image.width;
      var h = diffResult.result.image.height;
      var fig = figureUtil.makeBlankFigure(w, h);
      var bits = fig.context.createImageData(w, h);
      figureUtil.copyImageBits(diffResult.result.image, bits);
      fig.context.putImageData(bits, 0, 0);
      styles = updateFigureStylesForActualSize(styles, w, h);
      diffResult.baseWidth = styles.baseW;
      diffResult.baseHeight = styles.baseH;
      styles.style.transform = 'translate(-50%,0%) ' + figureZoom.makeTransform();
      var figMain = $(fig.canvas).css(styles.style).addClass('figMain');
      $('#diffResult').css(styles.cellStyle).append(figMain);
      diffResult.grid = grid.isEnabled() ? grid.makeGrid(w, h).css(styles.style) : null;
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
        var matchRate = diffResult.result.summary.match / diffResult.result.summary.total;
        var percent = compareUtil.toPercent(matchRate);
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
        var msg = openMessageBox({
          en: 'Encoding the image...',
          ja: '画像をエンコード中...'
        });
        var download = function(url) {
          msg.close(300);
          $('#diffSaveFigureHelper').attr('href', url);
          jQuery('#diffSaveFigureHelper')[0].click();
        };
        if (typeof fig.canvas.toBlob === 'function') {
          fig.canvas.toBlob(function(blob) {
            var url = compareUtil.createObjectURL(blob);
            download(url);
            compareUtil.revokeObjectURL(url);
          });
        } else {
          window.setTimeout(function() {
            var url = compareUtil.createObjectURL(
                        compareUtil.blobFromDataURI(
                          fig.canvas.toDataURL(),
                          'image/png'));
            download(url);
            window.setTimeout(function() {
              compareUtil.revokeObjectURL(url);
            }, 500);
          }, 0);
        }
        return false;
      });
    };
    var updateHeader = function() {
      var gridbtn = $('#diffGridBtn');
      grid.isEnabled() ? gridbtn.addClass('current') : gridbtn.removeClass('current');
    };
    var figureStyles = function() {
      var figW = Math.max(480, Math.round($('#view').width() * 0.5));
      var figH = Math.max(320, Math.round($('#view').height() * 0.55));
      var figMargin = 8;
      return makeFigureStyles(figW, figH, figMargin, '#000');
    };
    var updateTableDOM = function() {
      var styles = figureStyles();
      if (false === updateOptionsDOM(styles)) {
        return;
      }
      if (diffResult.base !== baseImageIndex || diffResult.target !== targetImageIndex ||
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
        $('#diffAEHistogram').append($(figureUtil.makeBlankFigure(8,8).canvas).css({width:'320px',height:'160px'}));
        $('#diffResult').append(figureUtil.makeBlankFigure(8,8).canvas).css(styles.cellStyle);
        textUtil.setText($('#diffSummary'), {
          en: 'calculating...',
          ja: '計算中...'
        });
      } else {
        updateReport(styles);
      }
    };
    var updateGridStyle = function() {
      if (diffResult.result !== null && diffResult.grid) {
        grid.updateGridStyle(
          diffResult.grid,
          diffResult.result.image.width,
          diffResult.baseWidth,
          figureZoom.scale);
      }
    };
    var updateTable = function(transformOnly) {
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
    var updateFigure = function(baseIndex, targetIndex, options, result) {
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
    var toggle = dialogUtil.defineDialog($('#diff'), updateTable, toggleAnalysis, {
      enableZoom: true,
      getBaseSize: function() {
        return diffResult ? { w: diffResult.baseWidth, h: diffResult.baseHeight } : null;
      },
      onOpen: function() { grid.setOnChange(updateTable); },
      onClose: function() { grid.setOnChange(null); }
    });
    return {
      onRemoveEntry: onRemoveEntry,
      updateTable: updateTable,
      updateFigure: updateFigure,
      toggle: toggle
    };
  })();
  var resetMouseDrag = function() {
    viewZoom.resetDragState();
  };
  var toggleFullscreen = function() {
    resetMouseDrag();
    compareUtil.toggleFullscreen($('#viewroot').get(0));
  };
  // Alt View
  var altView = (function() {
    var colorSpace = $('#altViewColorSpace').val();
    var mapping = $('.altViewMapping').val();
    var component = null;
    var alphaEnabled = $('#altViewEnableAlpha').prop('checked');
    var enableContour = false;
    var colorSpaces = {
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
    var colorMaps = {
      'grayscale': (function() {
        var colorMap = new Uint8Array(3 * 256);
        for (var i = 0; i < 256; ++i) {
          colorMap[i + 0] = i;
          colorMap[i + 256] = i;
          colorMap[i + 512] = i;
        }
        return colorMap;
      })(),
      'pseudocolor': (function() {
        var colorMap = new Uint8Array(3 * 256);
        var tone = function(a) {
          return Math.round(255 * Math.pow(a, 1/2.2));
        };
        for (var i = 0; i < 256; ++i) {
          var a = (i - 40) * 5.8 / 255;
          a = a - Math.floor(a);
          a = a * a * (3 - 2 * a);
          colorMap[i + 0] = tone(i < 128 ? 0 : i < 172 ? a : i < 216 ? 1 : 1 - a);
          colorMap[i + 256] = tone(i < 40 ? 0 : i < 84 ? a : i < 172 ? 1 : i < 216 ? 1 - a : 0);
          colorMap[i + 512] = tone(i < 40 ? a : i < 84 ? 1 : i < 128 ? 1 - a : 0);
        }
        return colorMap;
      })()
    };
    var colorBars = {};
    var makeColorBar = function(colorMap) {
      var fig = figureUtil.makeBlankFigure(512 + 2, 44);
      for (var i = 0; i < 256; ++i) {
        var color = 'rgb(' + colorMap[i] + ',' +
                colorMap[i + 256] + ',' + colorMap[i + 512] + ')';
        fig.context.fillStyle = color;
        fig.context.fillRect(1 + i * 2, 0, 2, 44);
      }
      var axes = [
        { pos: 0.5,   align: 'left',   label: '0' },
        { pos: 64.5,  align: 'center', label: '64' },
        { pos: 128.5, align: 'center', label: '128' },
        { pos: 192.5, align: 'center', label: '192' },
        { pos: 255.5, align: 'right',  label: '255' }
      ];
      figureUtil.drawAxes(fig.context, 1, 0, 2, 0, 12, 1, '#fff', axes);
      return $(fig.canvas).width(256).addClass('colorbar');
    };
    $('#altViewMode .close').on('click', function(e) {
      reset();
      updateDOM();
    });
    var changeColorSpace = function(cs) {
      var lastComponent = (component === null || component === 0) ? null :
                            colorSpaces[colorSpace].components[component - 1];
      colorSpace = cs;
      if (component !== null) {
        var sameComponent = colorSpaces[colorSpace].components.indexOf(lastComponent);
        if (0 <= sameComponent) {
          component = sameComponent + 1;
        } else {
          component = 0;
        }
        updateModeIndicator();
        updateDOM();
      }
    };
    $('#altViewColorSpace').on('change', function(e) {
      changeColorSpace(this.options[this.selectedIndex].value);
      return false;
    });
    $('#altViewMode .mode-sw button').on('click', function(e) {
      component = $(this).parent().children().index(this);
      updateModeIndicator();
      updateDOM();
    });
    $('.altViewMapping').on('change', function(e) {
      mapping = this.options[this.selectedIndex].value;
      updateModeIndicator();
      updateDOM();
      return false;
    });
    $('#altViewEnableAlpha').on('click', function() {
      alphaEnabled = $(this).prop('checked');
      if (component !== null && component !== 0 &&
          colorSpaces[colorSpace].components[component - 1] === 'A') {
        component = 0;
        updateModeIndicator();
        updateDOM();
      } else {
        updateModeIndicator();
      }
    });
    var reset = function() {
      if (component !== null) {
        component = null;
        updateModeIndicator();
      }
    };
    var toggle = function() {
      component = component === null ? 0 : null;
      updateModeIndicator();
      updateDOM();
    };
    var toggleContour = function() {
      enableContour = !enableContour;
      if (component !== null && component !== 0) {
        updateDOM();
      }
    };
    var changeMode = function(reverse) {
      var numOptions = colorSpaces[colorSpace].components.length + 1;
      if (!alphaEnabled && colorSpaces[colorSpace].components[numOptions - 2] === 'A') {
        numOptions -= 1;
      }
      component =
        component === null ? 0 :
        (reverse ? component + numOptions - 1 : component + 1) % numOptions;
      updateModeIndicator();
      updateDOM();
    };
    var changeModeReverse = function() {
      changeMode(/* reverse= */ true);
    };
    var enableAlpha = function() {
      if (!alphaEnabled) {
        alphaEnabled = true;
        $('#altViewEnableAlpha').prop('checked', true);
        updateModeIndicator();
      }
    };
    var updateModeIndicator = function() {
      if (component !== null) {
        $('#altViewMode .mode-sw').css({ display: 'none' });
        var sw = $(colorSpaces[colorSpace].modeSwitch).css({ display: '' });
        var buttons = sw.find('button').removeClass('current');
        buttons.eq(component).addClass('current');
        var alpha = colorSpaces[colorSpace].components.indexOf('A');
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
    var makeContour = function(channelImage) {
      //console.time('makeConcour');
      var w = channelImage.width;
      var h = channelImage.height;
      var ch = channelImage.data;
      for (var i = 0, n = w * h; i < n; ++i) {
        ch[i] = ch[i] >> 5;
      }
      var paths = [];
      for (var y = 0, i = 0; y + 1 < h; ++y) {
        var start = null;
        for (var x = 0; x < w; ++x, ++i) {
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
      for (var x = 0; x + 1 < w; ++x) {
        var start = null;
        for (var y = 0, i = x; y < h; ++y, i += w) {
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
      var vbox = '0 0 ' + w + ' ' + h;
      var pathDesc = paths.map(function(p) {
        if (p[0] === p[2]) {
          return 'M' + p[0] + ' ' + p[1] + 'v' + (p[3] - p[1]);
        } else if (p[1] === p[3]) {
          return 'M' + p[0] + ' ' + p[1] + 'h' + (p[2] - p[0]);
        }
        return 'M' + p[0] + ' ' + p[1] + 'l' + (p[2] - p[0]) + ' ' + (p[3] - p[1]);
      });
      //console.log('pathDesc.length', pathDesc.length);
      //console.log('pathDesc.join().length', pathDesc.join('').length);
      var contour = $(
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
    var getAltImage = function(ent) {
      if (component === null || component === 0) {
        return null;
      }
      var imageData = getImageData(ent);
      if (!imageData) {
        return null;
      }
      var w = imageData.width, h = imageData.height;
      var altView = figureUtil.makeBlankFigure(w, h);
      var altImageData = altView.context.createImageData(w, h);
      var coef = colorSpaces[colorSpace].coef[component - 1];
      var r = coef[0], g = coef[1], b = coef[2], a = coef[3], c = coef[4];
      var src = imageData.data;
      var dest = altImageData.data;
      var colorMap = colorMaps[mapping];
      var contour = null;
      if (enableContour) {
        var channelImage = { data: new Uint8Array(w * h), width: w, height: h };
        var ch = channelImage.data;
        for (var i = 0, j = 0, n = 4 * w * h; i < n; i += 4, j++) {
          var x = Math.round(c + r * src[i] + g * src[i + 1] + b * src[i + 2] + a * src[i + 3]);
          ch[j] = x;
        }
        for (var i = 0, j = 0, n = w * h; j < n; i += 4, j++) {
          var x = ch[j];
          dest[i + 0] = colorMap[x];
          dest[i + 1] = colorMap[x + 256];
          dest[i + 2] = colorMap[x + 512];
          dest[i + 3] = 255;
        }
        contour = makeContour(channelImage);
      } else {
        for (var i = 0, n = 4 * w * h; i < n; i += 4) {
          var x = Math.round(c + r * src[i] + g * src[i + 1] + b * src[i + 2] + a * src[i + 3]);
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
    var onUpdateImageBox = function(img, w, h) {
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
    var onUpdateTransform = function(ent, commonStyle) {
      if (ent.contour) {
        $(ent.contour).css(commonStyle);
      }
    };
    var currentMode = function() {
      return component === null ? null : colorSpace + '/' + component + '/' + mapping + '/' + enableContour;
    };
    return {
      reset: reset,
      toggle: toggle,
      toggleContour: toggleContour,
      changeMode: changeMode,
      changeModeReverse: changeModeReverse,
      enableAlpha: enableAlpha,
      getAltImage: getAltImage,
      active: function() { return null !== component; },
      onUpdateImageBox: onUpdateImageBox,
      onUpdateTransform: onUpdateTransform,
      currentMode: currentMode
    };
  })();
  // Side Bar
  var sideBar = (function() {
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
    $('#arrange').click(viewManagement.arrangeLayout);
    $('#overlay').click(viewManagement.toggleOverlay);
    $('#gridbtn').click(grid.toggle);
    $('#pickerbtn').click(crossCursor.toggle);
    $('#channelbtn').click(altView.toggle);
    $('#fullscreen').click(toggleFullscreen);
    $('#settingsbtn').click(settings.toggle);
    $('#helpbtn').click(toggleHelp);
    var newSelectorButton = function(index) {
      var number = viewManagement.numberFromIndex(index);
      var button = $('<button/>').addClass('selector').
        text(number).
        click(function(e) { viewManagement.toSingleImageView(index); });
      if (number <= 9) {
        button.find('span.tooltip span').addClass('keys flat').
            append($('<span/>').text(number));
      }
      $('#next').before(button);
      return button;
    };
    var updateSelectorButtons = function() {
      $('.selector').remove();
      for (var i = 0, ent; ent = entries[i]; i++) {
        newSelectorButton(ent.index);
      }
    };
    var updateArrangeButton = function() {
      var layoutMode = viewManagement.getLayoutMode();
      $('#arrange img').attr('src', layoutMode === 'x' ? 'res/layout_x.svg' : 'res/layout_y.svg');
    };
    var updateSelectorButtonState = function() {
      var indices = viewManagement.getSelectedImageIndices();
      var selectors = $('.selector');
      selectors.removeClass('current');
      for (var i = 0; i < indices.length; i++) {
        selectors.eq(indices[i]).addClass('current');
      }
      selectors.each(function(index) {
        if (index < entries.length && !entries[index].visible) {
          $(this).css({ display : 'none' });
        }
      });
    };
    var updateOverlayModeIndicator = function() {
      if (viewManagement.isOverlayMode()) {
        var indices = viewManagement.getSelectedImageIndices();
        var numbers = indices.map(function(i) { return viewManagement.numberFromIndex(i); });
        numbers.sort();
        var modeDesc = numbers.join(' + ') + (numbers.length === 1 ? ' only' : '');
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
    var onUpdateLayout = function() {
      updateArrangeButton();
      updateSelectorButtonState();
      updateOverlayModeIndicator();
    };
    return {
      updateSelectorButtons: updateSelectorButtons,
      onUpdateLayout: onUpdateLayout
    };
  })();
  var updateDOM = function() {
    images = entries.filter(function(ent,i,a) { return ent.ready(); });
    if (images.length === 0) {
      viewZoom.disable();
    } else {
      viewZoom.enable();
    }
    for (var i = 0, ent; ent = entries[i]; i++) {
        if (!ent.view) {
          ent.view = $('<div class="imageBox"/>');
          $('#drop').before(ent.view);
        }
        ent.view.find('.imageName').remove();
        ent.view.append(
            makeImageNameWithIndex('<span class="imageName">', ent).
              click({index : i}, function(e) {
                viewManagement.toggleSingleView(e.data.index);
              }).append(
                $('<button>').addClass('remove').text('×').
                  click({index : i}, function(e) { removeEntry(e.data.index); }))
        );
        if (ent.element) {
          if (ent.altViewMode !== altView.currentMode()) {
            ent.view.find('.image').remove();
            var altImage = altView.getAltImage(ent);
            ent.element = altImage ? altImage.image : ent.mainImage;
            ent.contour = altImage ? altImage.contour : null;
            ent.altViewMode = altImage ? altView.currentMode() : null;
          }
          if (0 === ent.view.find('.image').length) {
            $(ent.element).addClass('image');
            ent.view.prepend(ent.element);
          }
        }
        if (ent.error) {
          ent.view.addClass('error');
          ent.visible = false;
        }
    }
    sideBar.updateSelectorButtons();
    resetMouseDrag();
    updateLayout();
  };
  var updateLayout = function() {
    viewManagement.update();
    viewManagement.onUpdateLayout();
    sideBar.onUpdateLayout();
    roiMap.onUpdateLayout();
    updateTransform();
    dialogUtil.adjustDialogPosition();
  };
  
  function updateTransform() {
    for (var i = 0, ent; ent = entries[i]; i++) {
      if (ent.element) {
        style = {
          left        : '50%',
          top         : '50%',
          transform   : 'translate(-50%, -50%) ' +
                        viewZoom.makeTransform(i) +
                        ent.orientationAsCSS
        };
        $(ent.element).css(style);
        altView.onUpdateTransform(ent, style);
        grid.onUpdateTransform(ent, style);
        crossCursor.onUpdateTransformEach(ent, style);
      }
    }
    roiMap.onUpdateTransform();
    crossCursor.onUpdateTransform();
  }

  var NEEDS_IOS_EXIF_WORKAROUND = (function() {
    var ua = window.navigator.userAgent.toLowerCase();
    return 0 <= ua.indexOf('iphone') || 0 <= ua.indexOf('ipad') || 0 <= ua.indexOf('ipod');
  })();
  var setEntryImage = function(entry, image, w, h) {
    var canvas = image.nodeName === 'CANVAS' ? image : figureUtil.canvasFromImage(image, w, h);
    entry.altViewMode = null;
    entry.mainImage  = image;
    entry.element    = entry.mainImage;
    entry.asCanvas   = canvas;
    entry.canvasWidth   = w;
    entry.canvasHeight  = h;
    entry.orientationAsCSS = compareUtil.orientationUtil.getCSSTransform(entry.orientation);
    entry.transposed = compareUtil.orientationUtil.isTransposed(entry.orientation);
    entry.width = entry.transposed ? h : w;
    entry.height = entry.transposed ? w : h;
    entry.loading    = false;
    entry.progress   = 100;
    entry.interpretXY = function(x, y) {
      return compareUtil.orientationUtil.interpretXY(entry.orientation, w, h, x, y);
    };
    entry.interpretXY2 = function(x, y) {
      return compareUtil.orientationUtil.interpretXY2(entry.orientation, w, h, x, y);
    };
    var leftTop = entry.interpretXY2(0, 0);
    entry.flippedX = leftTop.x !== 0;
    entry.flippedY = leftTop.y !== 0;
    //
    updateDOM();
    nowLoadingDialog.update();
  };
  var setEntryError = function(entry, message) {
    entry.loading = false;
    entry.error = message;
    updateDOM();
    nowLoadingDialog.update();
  };
  var setupEntryWithDataURI = function(entry, dataURI) {
    var binary = compareUtil.binaryFromDataURI(dataURI);
    var formatInfo = compareUtil.detectImageFormat(binary);
    var format = formatInfo ? formatInfo.toString() : null;
    var isPNG  = format && 0 <= format.indexOf('PNG');
    var isJPEG = format && 0 <= format.indexOf('JPEG');
    var isGIF  = format && 0 <= format.indexOf('GIF');
    var isBMP  = format && 0 <= format.indexOf('BMP');
    entry.formatInfo = formatInfo;
    entry.format = format || (entry.fileType ? '('+entry.fileType+')' : '(unknown)');
    entry.color = (formatInfo && formatInfo.color) || '';
    if (0 <= entry.color.indexOf('RGBA') ||
        0 <= entry.color.indexOf('Alpha') ||
        0 <= entry.color.indexOf('Transparent')) {
      altView.enableAlpha();
    }
    if (isJPEG) {
      entry.orientation = compareUtil.detectExifOrientation(binary);
    }
    var useCanvasToDisplay = NEEDS_IOS_EXIF_WORKAROUND && isJPEG;
    var img = new Image;
    $(img).on('load', function() {
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        if (entry.format === 'SVG' && (w === 0 && h === 0)) {
          w = 150;
          h = 150;
          entry.sizeUnknown = true;
        }
        var mainImage = useCanvasToDisplay ? figureUtil.canvasFromImage(img, w, h) : img;
        setEntryImage(entry, mainImage, w, h);
      }).
      on('error', function() {
        var message = 'Failed.';
        if (!entry.fileType || !(/^image\/.+$/.test(entry.fileType))) {
          message += ' Maybe not an image file.';
        } else if (!isPNG && !isJPEG && !isGIF && !isBMP) {
          message += ' Maybe unsupported format for the browser.';
        }
        setEntryError(entry, message);
      });
    img.src = dataURI;
  };
  var setupEntryWithCanvas = function(entry, canvas) {
    setEntryImage(entry, canvas, canvas.width, canvas.height);
  };
  var newEntry = function(file) {
      var lastModified = file.lastModified || file.lastModifiedDate;
      var entry = {
            index           : null,
            name            : file.name,
            size            : file.size,
            fileType        : file.type,
            lastModified    : lastModified ? new Date(lastModified) : null,
            formatInfo      : null,
            format          : '',
            color           : '',
            width           : 0,
            height          : 0,
            canvasWidth     : 0,
            canvasHeight    : 0,
            orientation     : null,
            transposed      : false,
            orientationAsCSS    : '',
            view        : null,
            element     : null,
            asCanvas    : null,
            imageData   : null,
            histogram   : null,
            waveform    : null,
            vectorscope : null,
            colorTable  : null,
            colorDist   : null,
            waveform3D  : null,
            waveform3DFig : null,
            reducedColorTable: null,
            metrics     : [],
            loading     : true,
            progress    : 0,
            error       : null,
            visible     : true,
            
            ready   : function() { return null !== this.element; }
      };
      return entry;
  };
  var addCapturedImage = function(canvas) {
      var file = {
        name: 'captured image',
        lastModified: Date.now()
      };
      var entry = newEntry(file);
      entry.index = entries.length;
      entries.push(entry);
      viewManagement.resetLayoutState();
      setupEntryWithCanvas(entry, canvas);
  };
  var addFile = function(file) {
      var entry = newEntry(file);
      entry.index = entries.length;
      entries.push(entry);
      nowLoadingDialog.add(entry);
      
      var reader = new FileReader();
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
  var addFiles = function(files) {
    var sorted = Array.prototype.slice.call(files);
    sorted.sort(function(a, b) {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
    for (var i = 0, f; f = sorted[i]; i++) {
      addFile(f);
    }
    viewManagement.resetLayoutState();
    updateDOM();
    nowLoadingDialog.update();
  };
