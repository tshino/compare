$( function() {
  var toggleLang = function() {
    var lang = $(document.body).attr('class') === 'ja' ? 'en' : 'ja';
    $('#selectLang').val(lang);
    changeLang(lang);
  };
  var toggleFullscreen = function() {
    resetMouseDrag();
    compareUtil.toggleFullscreen($('#viewroot').get(0));
  };

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
  $('#add').click(function() {
    $('#file').click();
  });
  $('#view .dropHere').click(function() {
    $('#file').click();
  });

  // Side bar buttons
  $('#analysisbtn').click(toggleAnalysis);
  $('#zoomIn').click(viewZoom.zoomIn);
  $('#zoomOut').click(viewZoom.zoomOut);
  $('#arrange').click(arrangeLayout);
  $('#overlay').click(toggleOverlay);
  $('#gridbtn').click(grid.toggle);
  $('#pickerbtn').click(crossCursor.toggle);
  $('#fullscreen').click(toggleFullscreen);
  $('#helpbtn').click(toggleHelp);

  // Menus and dialogs
  $('#infobtn').click(toggleInfo);
  $('#histogrambtn').click(toggleHistogram);
  $('#waveformbtn').click(toggleWaveform);
  $('#vectorscopebtn').click(toggleVectorscope);
  $('#colordistbtn').click(toggleColorDist);
  $('#metricsbtn').click(toggleMetrics);
  $('#tonecurvebtn').click(toggleToneCurve);
  $('#diffbtn').click(toggleDiff);
  $('.swapbtn').click(swapBaseAndTargetImage);
  $('#histogramType > *').click(function() {
    var index = $('#histogramType > *').index(this);
    changeHistogramType(index);
  });
  $('#waveformType > *').click(function() {
    var index = $('#waveformType > *').index(this);
    changeWaveformType(index);
  });
  $('#vectorscopeType > *').click(function() {
    var index = $('#vectorscopeType > *').index(this);
    changeVectorscopeType(index);
  });
  $('#colorDistType > *').click(function() {
    var index = $('#colorDistType > *').index(this);
    changeColorDistType(index);
  });
  $('#toneCurveType > *').click(function() {
    var index = $('#toneCurveType > *').index(this);
    changeToneCurveType(index);
  });
  $('#diffIgnoreAE').on('change', function(e) {
    diffOptions.ignoreAE = +this.value;
    updateDiffTable();
    return false;
  });
  $('.diffDimensionOption').on('change', function(e) {
    var o = this.options[this.selectedIndex].value;
    diffOptions.resizeToLarger = o === 'resize';
    diffOptions.ignoreRemainder = o === 'min';
    updateDiffTable();
    return false;
  });
  $('#diffResizeMethod').on('change', function(e) {
    diffOptions.resizeMethod = this.options[this.selectedIndex].value;
    updateDiffTable();
    return false;
  });
  $('#diffOffsetX').on('change', function(e) {
    diffOptions.offsetX = +this.value;
    updateDiffTable();
    return false;
  });
  $('#diffOffsetY').on('change', function(e) {
    diffOptions.offsetY = +this.value;
    updateDiffTable();
    return false;
  });

  $(window).resize(function() { layoutMode = null; updateLayout(); });
  $(window).keydown(function(e) {
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return true;
      }
      // ESC (27)
      if (dialog && e.keyCode === 27 && !e.shiftKey) {
        dialog.close();
        return false;
      }
      if (e.target.localName === 'input') {
        return true;
      }
      if (dialog) {
        // BS (8)
        if (e.keyCode === 8 && !e.shiftKey) {
          dialog.close();
          return false;
        }
        // '1' - '9' (48-57 or 96-105 for numpad)
        if ((49 <= e.keyCode && e.keyCode <= 57 && !e.shiftKey) ||
            (97 <= e.keyCode && e.keyCode <= 105 && !e.shiftKey)) {
          var num = e.keyCode % 48;
          var sw = $(dialog.element).find('.mode-sw > button:nth-child('+num+')');
          if (sw.length === 1) {
            sw.click();
            return false;
          }
          if (($('#diff').is(':visible') /*|| $('#toneCurve').is(':visible')*/) &&
              num - 1 < entries.length &&
              entries[num - 1].ready() &&
              baseImageIndex !== null && targetImageIndex !== null &&
              targetImageIndex !== num - 1) {
            baseImageIndex = targetImageIndex;
            targetImageIndex = num - 1;
            if ($('#toneCurve').is(':visible')) {
              updateToneCurveTable();
            } else if ($('#diff').is(':visible')) {
              updateDiffTable();
            }
            return false;
          }
          if ($('#metrics').is(':visible') &&
              num - 1 < entries.length &&
              entries[num - 1].ready() &&
              baseImageIndex !== null &&
              baseImageIndex !== num - 1) {
            baseImageIndex = num - 1;
            updateMetricsTable();
            return false;
          }
        }
        if ($('#colorDist').is(':visible')) {
          if (false === colorDistProcessKeyDown(e)) {
            return false;
          }
        }
        // Zooming ('+'/PageUp/'-'/PageDown/cursor key)
        if (false === figureZoom.processKeyDown(e)) {
          return false;
        }
        return true;
      }
      // '0' - '9' (48-57 or 96-105 for numpad)
      if ((48 <= e.keyCode && e.keyCode <= 57 && !e.shiftKey) ||
          (96 <= e.keyCode && e.keyCode <= 105 && !e.shiftKey))
      {
        toggleSingleView(e.keyCode % 48);
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
      // TAB (9)
      if (e.keyCode === 9) {
        if (false == flipSingleView(!e.shiftKey)) {
          return false;
        }
      }
      // ESC (27)
      if (e.keyCode === 27 && !e.shiftKey) {
        if (crossCursor.isEnabled()) {
          crossCursor.disable();
        } else {
          resetLayoutState();
          resetMouseDrag();
          updateLayout();
        }
        return false;
      }
      // Delete (46)
      if (e.keyCode === 46 && !e.shiftKey && 0 < images.length) {
        var index = isSingleView ? currentImageIndex - 1 : images[0].index;
        removeEntry(index);
        return false;
      }
      //alert('keydown: '+e.keyCode);
  });
  
  var keypressMap = {
    // '@' (64)
    64 : { global: true, func: toggleLang },
    // '?' (63)
    63 : { global: true, func: toggleHelp },
    // 'f' (102)
    102 : { global: true, func: toggleFullscreen },
    // 'a' (97)
    97 : { global: true, func: toggleAnalysis },
    // 'h' (104)
    104 : { global: true, func: toggleHistogram },
    // 'w' (119)
    119 : { global: true, func: toggleWaveform },
    // 'v' (118)
    118 : { global: true, func: toggleVectorscope },
    // 'c' (99)
    99 : { global: true, func: toggleColorDist },
    // 'm' (109)
    109 : { global: true, func: toggleMetrics },
    // 't' (116)
    116 : { global: true, func: toggleToneCurve },
    // 'd' (100)
    100 : { global: true, func: toggleDiff },
    // 'i' (105)
    105 : { global: true, func: toggleInfo },
    // '/' (47)
    47 : { global: false, func: arrangeLayout },
    // 'o' (111)
    111: { global: false, func: toggleOverlay },
    // 'n' (110)
    110 : { global: false, func: roiMap.toggle },
    // 'g' (103)
    103 : { global: false, func: grid.toggle },
    // 'p' (112)
    112 : { global: false, func: crossCursor.toggle }
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
  figureZoom.enableMouseAndTouch('#histogram,#waveform,#vectorscope,#diff,#toneCurve', 'td.fig', 'td.fig > *', 'div.dialog:visible td.fig', '.figMain');
  colorDistEnableMouseAndTouch('#colorDist', 'td.fig', 'td.fig > *');

  viewZoom.setPointCallback(function(e) {
    if (entries[e.index].ready()) {
      crossCursor.enable();
      crossCursor.processClick(e);
    }
  });
  $('#view').on('mousemove', 'div.imageBox .image', function(e) {
    var selector = '#view > div.imageBox';
    return crossCursor.processMouseMove(e, selector, this);
  });

  hud.initialize();
  colorHUD.initialize();

  updateDOM();
});

  var NEEDS_IOS_EXIF_WORKAROUND = (function() {
    var ua = window.navigator.userAgent.toLowerCase();
    return 0 <= ua.indexOf('iphone') || 0 <= ua.indexOf('ipad') || 0 <= ua.indexOf('ipod');
  })();
  var entries = [];
  var images = [];
  var currentImageIndex = 0;
  var isSingleView = false;
  var viewZoom = compareUtil.makeZoomController(updateTransform, {
    getBaseSize: function(index) {
      if (entries[index] && entries[index].ready()) {
        return { w: entries[index].baseWidth, h: entries[index].baseHeight };
      }
    }
  });
  var layoutMode = null;
  var overlayMode = false;
  var overlayBaseIndex = null;
  var dialog = null;
  var figureZoom = compareUtil.makeZoomController(function() {
    if (dialog && dialog.update) {
      dialog.update(true /* transformOnly */);
    }
  }, {
    cursorMoveDelta: 0.125
  });
  var histogramType = 0;
  var waveformType = 0;
  var vectorscopeType = 0;
  var colorDistType = 0;
  var colorDistOrientation = {
    x: 30,
    y: -30
  };
  var colorDistZoom = 0;
  var colorDistDragState = null;
  var colorDistTouchFilter = compareUtil.makeTouchEventFilter();
  var baseImageIndex = null;
  var targetImageIndex = null;
  var toneCurveType = 1;
  var toneCurveResult = {};
  var diffResult = {};
  var diffOptions = {
    ignoreAE: 0,
    resizeToLarger: true,
    resizeMethod: 'lanczos3',
    ignoreRemainder: false,
    offsetX: 0,
    offsetY: 0
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
  var resetLayoutState = function() {
    currentImageIndex = 0;
    viewZoom.setZoom(0);
    viewZoom.setOffset(0.5, 0.5);
    overlayMode = false;
  };
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
      if (toneCurveResult.base === index || toneCurveResult.target === index) {
        $('#toneCurveResult *').remove();
        toneCurveResult.result = null;
      }
      if (diffResult.base === index || diffResult.target === index) {
        $('#diffResult *').remove();
        diffResult.result = null;
      }
      ent.asCanvas = null;
      ent.imageData = null;
      ent.histogram = null;
      ent.waveform = null;
      ent.vectorscope = null;
      ent.colorTable = null;
      ent.colorDist = null;
      ent.colorDistAxes = null;
      resetLayoutState();
      discardTasksOfEntryByIndex(index);
      updateDOM();
    }
  };
  function calcAspectRatio(w, h) {
    var gcd = compareUtil.calcGCD(w, h);
    var w0 = w / gcd, h0 = h / gcd;
    var ratio = w0 / h0;  // use gcd to avoid comparison error
    var result = compareUtil.addComma(w0) + ':' + compareUtil.addComma(h0);
    if (w0 <= 50 || h0 <= 50) {
      return [ratio, result];
    } else {
      for (var i = 1; i <= 10; ++i) {
        var a = w / h * i, b = h / w * i;
        var aa = Math.round(a), bb = Math.round(b);
        if (Math.abs(aa - a) < Math.min(i, aa) * 0.004) {
          return [ratio, result + '\n(approx. ' + compareUtil.addComma(aa) + ':' + i + ')'];
        }
        if (Math.abs(bb - b) < Math.min(i, bb) * 0.004) {
          return [ratio, result + '\n(approx. ' + i + ':' + compareUtil.addComma(bb) + ')'];
        }
      }
      return [ratio, result];
    }
  }
  function orientationToString(orientation) {
    var table = [
      'Undefined',
      'TopLeft', 'TopRight', 'BottomRight', 'BottomLeft',
      'LeftTop', 'RightTop', 'RightBottom', 'LeftBottom' ];
    return orientation ? (table[orientation] || 'Invalid') : '‐';
  }
  function applyExifOrientation(entry) {
    var table = {
      2: { transposed: false, transform: ' scale(-1,1)' },
      3: { transposed: false, transform: ' rotate(180deg)' },
      4: { transposed: false, transform: ' scale(-1,1) rotate(180deg)' },
      5: { transposed: true,  transform: ' scale(-1,1) rotate(90deg)' },
      6: { transposed: true,  transform: ' rotate(90deg)' },
      7: { transposed: true,  transform: ' scale(-1,1) rotate(-90deg)' },
      8: { transposed: true,  transform: ' rotate(-90deg)' }
    };
    var o = table[entry.orientation] || { transposed: false, transform: '' };
    var w = entry.width, h = entry.height;
    entry.width = o.transposed ? h : w;
    entry.height = o.transposed ? w : h;
    entry.transposed = o.transposed;
    entry.orientationAsCSS = o.transform;
  }
  var interpretOrientation = function(ent, x, y) {
    var w = ent.canvasWidth - 1, h = ent.canvasHeight - 1;
    if (ent.orientation === 2) { return { x: w-x, y: y };
    } else if (ent.orientation === 3) { return { x: w-x, y: h-y };
    } else if (ent.orientation === 4) { return { x: x, y: h-y };
    } else if (ent.orientation === 5) { return { x: y, y: x };
    } else if (ent.orientation === 6) { return { x: y, y: h-x };
    } else if (ent.orientation === 7) { return { x: w-y, y: h-x };
    } else if (ent.orientation === 8) { return { x: w-y, y: x };
    } else { return { x: x, y: y };
    }
  };
  var makeImageNameWithIndex = function(tag, img) {
    return $(tag).
        css({ wordBreak : 'break-all' }).
        append($('<span class="imageIndex"/>').text(img.index + 1)).
        append($('<span/>').text(img.name));
  };

  var toggleSingleView = function(targetIndex) {
    if (targetIndex === 0 ||
        targetIndex === currentImageIndex ||
        targetIndex > entries.length ||
        !entries[targetIndex - 1].visible) {
      currentImageIndex = 0;
    } else {
      currentImageIndex = targetIndex;
    }
    updateLayout();
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
      updateLayout();
      return false;
    }
  };
  function arrangeLayout()
  {
    if (isSingleView) {
      currentImageIndex = 0;
    } else if (layoutMode === 'x') {
      layoutMode = 'y';
    } else {
      layoutMode = 'x';
    }
    updateLayout();
  }
  function toggleOverlay()
  {
    if (!overlayMode && 2 <= images.length) {
      if (currentImageIndex <= images[0].index + 1 || entries.length < currentImageIndex) {
        currentImageIndex = images[1].index + 1;
      }
      overlayMode = true;
      overlayBaseIndex = images[0].index;
      updateLayout();
    } else if (overlayMode) {
      currentImageIndex = overlayBaseIndex + 1;
      overlayMode = false;
      updateLayout();
    }
  }
  var updateOverlayModeIndicator = function() {
    if (overlayMode) {
      var baseIndex = overlayBaseIndex + 1;
      var modeDesc = (isSingleView && baseIndex !== currentImageIndex) ?
            baseIndex + ' + ' + currentImageIndex : baseIndex + ' only';
      setText($('#mode'), {
        en: 'OVERLAY MODE : ' + modeDesc,
        ja: 'オーバーレイモード : ' + modeDesc });
      $('#mode').css({ display : 'block' });
      $('#overlay').addClass('current');
    } else {
      $('#mode > span').text('');
      $('#mode').css({ display : '' });
      $('#overlay').removeClass('current');
    }
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
        var index = isSingleView ? currentImageIndex - 1 : 0;
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

  // Grid
  var grid = (function() {
    var enableGrid = false;
    var toggle = function() {
      enableGrid = !enableGrid;
      enableGrid ? $('#gridbtn').addClass('current') : $('#gridbtn').removeClass('current');
      updateLayout();
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
    var addGrid = function(img) {
      var size = { w: img.canvasWidth, h: img.canvasHeight };
      var vbox = '0 0 ' + size.w + ' ' + size.h;
      var grid100 = makePathDesc(size, 100);
      var grid10 = makePathDesc(size, 10, 100);
      img.grid = $(
        '<svg class="imageOverlay grid" viewBox="' + vbox + '">' +
          '<path stroke="white" fill="none" stroke-width="0.5" opacity="0.6" d="' + grid100 + '"></path>' +
          '<path stroke="white" fill="none" stroke-width="0.5" opacity="0.6" d="' + grid10 + '"></path>' +
        '</svg>').
        width(size.w).
        height(size.h);
      img.view.append(img.grid);
    };
    var removeGrid = function(img) {
      if (img.grid) {
        $(img.grid).remove();
        img.grid = null;
      }
    };
    var onUpdateLayout = function(img, w, h) {
      if (enableGrid) {
        if (img.element && 0 === img.view.find('.grid').length) {
          addGrid(img);
        }
      } else {
        removeGrid(img);
      }
      if (img.grid) {
        $(img.grid).css({ width: w+'px', height: h+'px' });
      }
    };
    var updateGridStyle = function(ent, commonStyle) {
      var base = 0.5 * ent.width / (ent.baseWidth * viewZoom.scale);
      var strokeWidth = [
          (base > 0.5 ? 1 : base > 0.1 ? 3.5 - base * 5 : 3) * base,
          (base > 0.5 ? 0 : 1) * base];
      var opacity = [
          0.6,
          base > 0.5 ? 0 : base > 0.1 ? (0.6 - base) / 0.5 : 1];
      $(ent.grid).css(commonStyle).find('path').each(function(index) {
        $(this).
            attr('stroke-width', strokeWidth[index]).
            attr('opacity', opacity[index]);
      });
    };
    var onUpdateTransform = function(ent, commonStyle) {
      if (ent.grid) {
        updateGridStyle(ent, commonStyle);
      }
    };
    return {
      toggle: toggle,
      onUpdateLayout: onUpdateLayout,
      onUpdateTransform: onUpdateTransform
    };
  })();

  // Cross Cursor
  var crossCursor = (function() {
    var enableCrossCursor = false;
    var primaryIndex = null;
    var fixedPosition = false;
    var positions = [];
    var onShowCallback = null;
    var onUpdateCallback = null;
    var onRemoveCallback = null;
    var makeInitialPosition = function(index) {
      var img = entries[index];
      var center = viewZoom.getCenter();
      var x = (0.5 + center.x) * img.width;
      var y = (0.5 + center.y) * img.height;
      return { x: x, y: y };
    };
    var setObserver = function(onShow, onUpdate, onRemove) {
      onShowCallback = onShow;
      onUpdateCallback = onUpdate;
      onRemoveCallback = onRemove;
    };
    var enable = function() {
      var index = isSingleView ? currentImageIndex - 1 : 0 < images.length ? images[0].index : -1;
      if (!enableCrossCursor && 0 <= index) {
        enableCrossCursor = true;
        primaryIndex = index;
        fixedPosition = false;
        if (onShowCallback) {
          onShowCallback();
        }
        var pos = makeInitialPosition(index);
        setPosition(index, pos.x, pos.y);
        updateLayout();
      }
      return enableCrossCursor;
    };
    var disable = function() {
      if (enableCrossCursor) {
        enableCrossCursor = false;
        if (onRemoveCallback) {
          onRemoveCallback();
        }
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
    var isFixed = function() {
      return fixedPosition;
    };
    var makePathDesc = function(img, x, y) {
      var pos = interpretOrientation(img, x, y);
      var desc = '';
      desc += 'M ' + pos.x + ',0 l 0,' + img.canvasHeight + ' ';
      desc += 'M ' + (pos.x + 1) + ',0 l 0,' + img.canvasHeight + ' ';
      desc += 'M 0,' + pos.y + ' l ' + img.canvasWidth + ',0 ';
      desc += 'M 0,' + (pos.y + 1) + ' l ' + img.canvasWidth + ',0 ';
      return desc;
    };
    var addCrossCursor = function(img, desc) {
      var size = { w: img.canvasWidth, h: img.canvasHeight };
      var vbox = '0 0 ' + size.w + ' ' + size.h;
      img.cursor = $(
        '<svg class="imageOverlay cursor" viewBox="' + vbox + '">' +
          '<path stroke="black" fill="none" stroke-width="0.2" opacity="0.1" d="' + desc + '"></path>' +
          '<path stroke="white" fill="none" stroke-width="0.1" opacity="0.6" d="' + desc + '"></path>' +
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
      if (0 === img.view.find('.cursor').length) {
        addCrossCursor(img, desc);
      } else {
        img.cursor.find('path').attr('d', desc);
      }
      img.cursor.find('path').attr('stroke-dasharray', fixedPosition ? 'none' : '4,1');
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
      if (onUpdateCallback) {
        onUpdateCallback(true);
      }
    };
    var adjustViewOffsetToFollowCrossCursor = function(dx, dy, x, y) {
      var img = entries[primaryIndex];
      var center = viewZoom.getCenter();
      var rx = (x - (0.5 + center.x) * img.width) / (img.width / viewZoom.scale);
      var ry = (y - (0.5 + center.y) * img.height) / (img.height / viewZoom.scale);
      if (0.45 < Math.abs(rx) && 0 < dx * rx) {
        viewZoom.moveRelative(0 < rx ? 0.25 : -0.25, 0);
      }
      if (0.45 < Math.abs(ry) && 0 < dy * ry) {
        viewZoom.moveRelative(0, 0 < ry ? 0.25 : -0.25);
      }
    };
    var processKeyDown = function(e) {
      if (enableCrossCursor) {
        // cursor key
        if (37 <= e.keyCode && e.keyCode <= 40) {
          var index = isSingleView ? currentImageIndex - 1 : primaryIndex;
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
    var onUpdateLayout = function(img, w, h) {
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
        var strokeWidth = ent.width / (ent.baseWidth * viewZoom.scale);
        $(ent.cursor).css(commonStyle).find('path').each(function(i) {
          $(this).attr('stroke-width', strokeWidth * [2, 1][i]);
        });
      }
    };
    var onUpdateTransform = function() {
      if (enableCrossCursor) {
        if (onUpdateCallback) {
          onUpdateCallback(false);
        }
      }
    };
    return {
      setObserver: setObserver,
      enable: enable,
      disable: disable,
      toggle: toggle,
      isEnabled: function() { return enableCrossCursor; },
      getPosition: getPosition,
      getIndex: getIndex,
      isFixed: isFixed,
      setPosition: setPosition,
      processKeyDown: processKeyDown,
      processClick: processClick,
      processMouseMove: processMouseMove,
      onUpdateLayout: onUpdateLayout,
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
    var onUpdateLayout = function(img) {
      if (onUpdateLayoutCallback) {
        onUpdateLayoutCallback(img);
      }
    };
    return {
      initialize: initialize,
      setObserver: setObserver,
      adjustPlacement: adjustPlacement,
      append: append,
      onUpdateLayout: onUpdateLayout
    };
  })();

  var colorHUD = (function() {
    var updateColorHUD = function(img) {
      if (!img.colorHUD) {
        return;
      }
      var toCSS = function(rgb) {
        var lut = '0123456789ABCDEF';
        return '#' +
            lut[rgb[0] >> 4] + lut[rgb[0] % 16] +
            lut[rgb[1] >> 4] + lut[rgb[1] % 16] +
            lut[rgb[2] >> 4] + lut[rgb[2] % 16];
      };
      var cursor = crossCursor.getPosition(img.index);
      var x = cursor.x, y = cursor.y;
      var pos = interpretOrientation(img, x, y);
      if (pos.x < 0 || pos.y < 0 || pos.x >= img.canvasWidth || pos.y >= img.canvasHeight) {
        img.colorHUD.find('.colorXY span, .colorCSS, .colorRGB span').text('');
        img.colorHUD.find('.colorSample, .colorBar').hide();
      } else {
        var context = img.asCanvas.getContext('2d');
        var imageData = context.getImageData(pos.x, pos.y, 1, 1);
        var rgb = imageData.data;
        var css = toCSS(rgb);
        img.colorHUD.find('.colorSample').show().css('background', css);
        img.colorHUD.find('.colorBar').show().find('span').each(function(index) {
          $(this).css('width', (rgb[index]*127.5/255)+'px');
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
        '<div class="dark hud" style="pointer-events: auto; min-width: 280px">' +
          '<span style="display: inline-block">' +
            '<span class="colorSample" style="' +
                'display: inline-block; ' +
                'width: 1em; height: 1em; vertical-align: middle; ' +
                '">' +
            '</span>' +
            '<span class="colorBar" style="' +
                'display: inline-block; background: #000; ' +
                'line-height: 0.1; width: 127.5px; vertical-align: middle; ' +
                '">' +
              '<span style="display: inline-block; background:#f00; height:5px;"></span>' +
              '<br>' +
              '<span style="display: inline-block; background:#0f0; height:5px;"></span>' +
              '<br>' +
              '<span style="display: inline-block; background:#00f; height:5px;"></span>' +
            '</span>' +
            '<span class="colorCSS"></span>' +
            '<br>' +
            '<span class="colorRGB">RGB: <span></span>,<span></span>,<span></span></span>' +
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
      crossCursor.setObserver(showHUD, updateHUD, removeHUD);
      hud.setObserver(onUpdateLayout);
    };
    return {
      initialize: initialize
    };
  })();
  var makeImageLayoutParam = function() {
    var numVisibleEntries = entries.filter(function(ent,i,a) { return ent.visible; }).length;
    var numSlots = isSingleView ? 1 : Math.max(numVisibleEntries, 2);
    var numColumns = layoutMode === 'x' ? numSlots : 1;
    var numRows    = layoutMode !== 'x' ? numSlots : 1;
    var boxW = $('#view').width() / numColumns;
    var boxH = $('#view').height() / numRows;
    var MARGIN = 6, MIN_SIZE = 32;
    boxW = compareUtil.clamp(boxW, MIN_SIZE, boxW - MARGIN);
    boxH = compareUtil.clamp(boxH, MIN_SIZE, boxH - MARGIN);
    return { numVisibleEntries: numVisibleEntries, numSlots: numSlots, boxW: boxW, boxH: boxH };
  };
  var updateImageBox = function(img, boxW, boxH) {
    if (img.element) {
      img.boxW = boxW;
      img.boxH = boxH;
      var rect = compareUtil.calcInscribedRect(boxW, boxH, img.width, img.height);
      img.baseWidth = rect.width;
      img.baseHeight = rect.height;
      var w = img.transposed ? rect.height : rect.width;
      var h = img.transposed ? rect.width : rect.height;
      $(img.element).css({ width: w+'px', height: h+'px' });
      grid.onUpdateLayout(img, w, h);
      crossCursor.onUpdateLayout(img, w, h);
      hud.onUpdateLayout(img);
    }
  };
  var swapBaseAndTargetImage = function() {
    if (baseImageIndex !== null && targetImageIndex !== null) {
      var temp = targetImageIndex;
      targetImageIndex = baseImageIndex;
      baseImageIndex = temp;
      if ($('#toneCurve').is(':visible')) {
        updateToneCurveTable();
      } else if ($('#diff').is(':visible')) {
        updateDiffTable();
      }
    }
  };
  var dialogUtil = (function() {
    var hideDialog = function() {
      if (dialog) {
        dialog.element.hide();
        dialog = null;
        figureZoom.disable();
      }
    };
    var showDialog = function(target, parent, update) {
      dialog = { element: target, close: parent || dialogUtil.hideDialog, update: update };
      target.css({ display: 'block' });
      target.children().find('.dummyFocusTarget').focus();
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
      target.on('mousedown', '.header', function(e) {
        if (e.which === 1 && !$(e.target).is('a, select')) {
          draggingPoint = { x: e.clientX, y: e.clientY };
          return false;
        }
      }).on('mousemove', function(e) {
        if (!draggingPoint || e.buttons !== 1) {
          draggingPoint = null;
        } else {
          var dx = e.clientX - draggingPoint.x;
          var dy = e.clientY - draggingPoint.y;
          draggingPoint = { x: e.clientX, y: e.clientY };
          moveDialog(dx, dy);
          return false;
        }
      });
    };
    return {
      hideDialog: hideDialog,
      showDialog: showDialog,
      adjustDialogPosition: adjustDialogPosition,
      enableMouse: enableMouse
    };
  })();
  var defineDialog = function(target, update, parent, options) {
    options = options !== undefined ? options : {};
    target.on('click', parent || dialogUtil.hideDialog);
    target.children().on('click', function(e) { e.stopPropagation(); return true; });
    var dlg = target.children();
    dialogUtil.enableMouse(target);
    dlg.prepend($('<div class="dummyFocusTarget" tabindex="-1">').
      css({display:'inline',margin:'0px',padding:'0px',border:'0px'}));
    return function() {
      if (dialog && target.is(':visible')) {
        dialogUtil.hideDialog();
      } else {
        dialogUtil.hideDialog();
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
        if (options.onOpen) {
          options.onOpen();
        }
        if (update) {
          update();
        }
        dialogUtil.showDialog(target, parent, update);
        dlg.css({position:'',left:'',top:''});
      }
    };
  };
  var openMessageBox = (function() {
    var serial = 0;
    return function(text) {
      serial += 1;
      var mySerial = serial;
      $('#messageBox').css('display', 'block');
      setText($('#messageBoxBody'), text);
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
  var toggleHelp = defineDialog($('#shortcuts'));
  function updateInfoTable()
  {
    $('#infoTable td:not(.prop)').remove();
    var rows = [
      $('#infoName'),
      $('#infoFormat'),
      $('#infoWidth'),
      $('#infoHeight'),
      $('#infoAspect'),
      $('#infoOrientation'),
      $('#infoFileSize'),
      $('#infoLastModified') ];
    var val = [];
    var unknown = [null, '‐'];
    for (var i = 0, img; img = images[i]; i++) {
      val[i] = [
        [null, makeImageNameWithIndex('<span>', img) ],
        [null, img.format ],
        img.sizeUnknown ? unknown : [img.width, compareUtil.addComma(img.width) ],
        img.sizeUnknown ? unknown : [img.height, compareUtil.addComma(img.height) ],
        img.sizeUnknown ? unknown : calcAspectRatio(img.width, img.height),
        [orientationToString(img.orientation), orientationToString(img.orientation)],
        [img.size, compareUtil.addComma(img.size) ],
        [img.lastModified, img.lastModified.toLocaleString()] ];
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
    }
    if (i === 0) {
      rows[0].append(
        $('<td>').attr('rowspan', rows.length).
            text('no data')
      );
    }
  }
  var toggleAnalysis = defineDialog($('#analysis'));
  var toggleInfo = defineDialog($('#info'), updateInfoTable, toggleAnalysis);
  var nowLoadingDialog = (function() {
    var loading = [];
    var toggleNowLoading = defineDialog($('#loading'));
    var add = function(entry) {
      loading.push(entry);
    };
    var update = function() {
      dialogUtil.hideDialog();
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
      setText($('#loadingStatus'),
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
  function getImageData(img)
  {
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
  }
  var makeBlankFigure = function(w, h) {
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var context = canvas.getContext('2d');
    return { canvas: canvas, context: context };
  };
  var copyImageBits = function(src, dest) {
    for (var i = 0, n = src.width * src.height * 4; i < n; ++i) {
      dest.data[i] = src.data[i];
    }
  };
  var drawAxes = function(ctx, x, y, dx, dy, lineLen, labels) {
    var dLen = Math.sqrt(dx * dx + dy * dy);
    var lineDx = -dy / dLen * lineLen, lineDy = dx / dLen * lineLen;
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
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
  var updateFigureTable = function(target, propName, update, styles, transformOnly) {
    if (transformOnly) {
      $(target).find('td.fig > *').css(styles.style);
      return;
    }
    $(target).find('td').remove();
    for (var k = 0, img; img = images[k]; k++) {
      if (!img[propName]) {
        img[propName] = makeBlankFigure(8, 8).canvas;
        update(img);
      }
      $(target).find('tr').eq(0).append(
        makeImageNameWithIndex('<td>', img)
      );
      var figMain = $(img[propName]).css(styles.style).addClass('figMain');
      var fig = $('<td class="fig">').css(styles.cellStyle).append(figMain);
      var axes = img[propName + 'Axes'];
      if (axes) {
        fig.append($(axes).css(styles.style));
      }
      $(target).find('tr').eq(1).append(fig);
    }
    if (k === 0) {
      $(target).find('tr').eq(0).append(
        $('<td rowspan="2">').text('no data')
      );
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
      if (data.type === histogramType) {
        var img = entries[data.index[0]];
        updateHistogram(data.type, img, data.result);
      }
      break;
    case 'calcWaveform':
      if (data.type === waveformType) {
        var img = entries[data.index[0]];
        updateWaveform(data.type, img, data.histW, data.result);
      }
      break;
    case 'calcVectorscope':
      if (data.type === vectorscopeType) {
        updateVectorscope(data.type, entries[data.index[0]], data.result);
      }
      break;
    case 'calcColorTable':
      entries[data.index[0]].colorTable = data.result;
      updateColorDist(entries[data.index[0]]);
      break;
    case 'calcMetrics':
      entries[data.index[0]].metrics[data.index[1]] = data.result;
      entries[data.index[1]].metrics[data.index[0]] = data.result;
      updateMetricsTable();
      break;
    case 'calcToneCurve':
      if (data.type === toneCurveType &&
          data.index[0] === toneCurveResult.base &&
          data.index[1] === toneCurveResult.target) {
        toneCurveResult.type = data.type;
        toneCurveResult.result = data.result;
      }
      updateToneCurveTable();
      break;
    case 'calcDiff':
      if (diffResult.base === data.index[0] && diffResult.target === data.index[1] &&
          diffResult.ignoreAE === data.options.ignoreAE &&
          diffResult.ignoreRemainder === data.options.ignoreRemainder &&
          diffResult.resizeToLarger === data.options.resizeToLarger &&
          diffResult.resizeMethod === data.options.resizeMethod &&
          diffResult.offsetX === data.options.offsetX &&
          diffResult.offsetY === data.options.offsetY) {
        diffResult.result = data.result;
      }
      updateDiffTable();
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
  
  function changeHistogramType(type)
  {
    if (histogramType !== type) {
      histogramType = type;
      discardTasksOfCommand('calcHistogram');
      for (var i = 0, img; img = images[i]; i++) {
        img.histogram = null;
      }
      $('#histogramType > *').
        removeClass('current').
        eq(type).addClass('current');
      updateHistogramTable();
    }
  }
  function updateHistogramAsync(img)
  {
    taskQueue.addTask({
      cmd:      'calcHistogram',
      type:     histogramType,
      index:    [img.index]
    }, attachImageDataToTask);
  }
  function updateHistogram(type, img, hist)
  {
    img.histogram = makeFigure(type, hist);
    updateHistogramTable();
    
    function makeFigure(type, hist)
    {
      var margin = 32;
      var fig = makeBlankFigure(768, 512 + margin);
      var context = fig.context;
      var max = 0;
      for (var i = 0; i < hist.length; ++i) {
        max = Math.max(max, hist[i]);
      }
      context.fillStyle = '#222';
      context.fillRect(0,0,768,512);
      if (type === 0) { // RGB
        context.globalCompositeOperation = 'lighter';
        drawHistogram('#f00', 0);
        drawHistogram('#0f0', 256);
        drawHistogram('#00f', 512);
      } else { // Luminance
        drawHistogram('#fff', 0);
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
      drawAxes(fig.context, 0, 512, 768, 0, 10, axes);
      return fig.canvas;
      
      function drawHistogram(color, offset) {
        context.fillStyle = color;
        for (var i = 0; i < 256; ++i) {
          var h = 512 * Math.pow(hist[i + offset] / max, 0.5);
          context.fillRect(i*3, 512-h, 3, h);
        }
      }
    }
  }
  var updateHistogramTable = function(transformOnly) {
    var w = 384, h = 272, margin = 8;
    var styles = makeFigureStyles(w, h, margin, '#bbb', figureZoom);
    updateFigureTable('#histoTable', 'histogram', updateHistogramAsync, styles, transformOnly);
  };
  var toggleHistogram = defineDialog($('#histogram'), updateHistogramTable, toggleAnalysis,
    { enableZoom: true, zoomXOnly: true, zoomInitX: 0,
      getBaseSize: function() { return { w: 384, h: 272 }; } });
  function changeWaveformType(type)
  {
    if (waveformType !== type) {
      waveformType = type;
      discardTasksOfCommand('calcWaveform');
      for (var i = 0, img; img = images[i]; i++) {
        img.waveform = null;
      }
      $('#waveformType > *').
        removeClass('current').
        eq(type).addClass('current');
      updateWaveformTable();
    }
  }
  function updateWaveformAsync(img)
  {
    var leftTop = interpretOrientation(img, 0, 0);
    var flipped = img.transposed ? (leftTop.y !== 0) : (leftTop.x !== 0);
    taskQueue.addTask({
      cmd:      'calcWaveform',
      type:     waveformType,
      index:    [img.index],
      histW:    Math.min(img.width, 1024),
      transposed: img.transposed,
      flipped:  flipped
    }, attachImageDataToTask);
  }
  function updateWaveform(type, img, histW, hist)
  {
    var w = img.width;
    var h = img.height;
    img.waveform = makeFigure(type, w, h, histW, hist);
    updateWaveformTable();
    
    function makeFigure(type, w, h, histW, hist)
    {
      var histN = new Uint32Array(histW);
      for (var i = 0; i < histW; ++i) {
        histN[i] = 0;
      }
      for (var i = 0; i < w; ++i) {
        var x = Math.round((i + 0.5) / w * histW - 0.5);
        ++histN[x];
      }
      //
      var fig = makeBlankFigure(histW, 256);
      var context = fig.context;
      var bits = context.createImageData(histW, 256);
      var s = -4 * histW;
      for (var x = 0; x < histW; ++x) {
        var invMax = 1 / (histN[x] * h);
        if (type === 0) { // RGB
          var rOff = 256 * x;
          var gOff = 256 * (x + histW);
          var bOff = 256 * (x + 2 * histW);
          var off = 4 * (255 * histW + x);
          for (var y = 0; y < 256; ++y) {
            var cR = Math.round(255 * (1 - Math.pow(1 - hist[rOff + y] * invMax, 200.0)));
            var cG = Math.round(255 * (1 - Math.pow(1 - hist[gOff + y] * invMax, 200.0)));
            var cB = Math.round(255 * (1 - Math.pow(1 - hist[bOff + y] * invMax, 200.0)));
            bits.data[off + 0] = cR;
            bits.data[off + 1] = cG;
            bits.data[off + 2] = cB;
            bits.data[off + 3] = 255;
            off += s;
          }
        } else { // Luminance
          var cOff = x * 256;
          var off = 4 * (255 * histW + x);
          for (var y = 0; y < 256; ++y) {
            var c = Math.round(255 * (1 - Math.pow(1 - hist[cOff + y] * invMax, 200.0)));
            bits.data[off + 0] = c;
            bits.data[off + 1] = c;
            bits.data[off + 2] = c;
            bits.data[off + 3] = 255;
            off += s;
          }
        }
      }
      context.putImageData(bits, 0, 0);
      return fig.canvas;
    }
  }
  var updateWaveformTable = function(transformOnly) {
    var w = 320, h = 256, margin = 10;
    var styles = makeFigureStyles(w, h, margin, '#666', figureZoom);
    updateFigureTable('#waveTable', 'waveform', updateWaveformAsync, styles, transformOnly);
  };
  var toggleWaveform = defineDialog($('#waveform'), updateWaveformTable, toggleAnalysis,
    { enableZoom: true, zoomXOnly: true, zoomInitX: 0,
      getBaseSize: function() { return { w: 320, h: 256 }; } });
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
  var changeVectorscopeType = function(type) {
    if (vectorscopeType !== type) {
      vectorscopeType = type;
      discardTasksOfCommand('calcVectorscope');
      for (var i = 0, img; img = images[i]; i++) {
        img.vectorscope = null;
      }
      $('#vectorscopeType > *').
        removeClass('current').
        eq(type).addClass('current');
      updateVectorscopeTable();
    }
  };
  var updateVectorscopeAsync = function(img) {
    taskQueue.addTask({
      cmd:      'calcVectorscope',
      type:     vectorscopeType,
      index:    [img.index]
    }, attachImageDataToTask);
  };
  var updateVectorscope = function(type, img, dist) {
    var w = img.canvasWidth;
    var h = img.canvasHeight;
    var fig = makeBlankFigure(320, 320);
    function notify() {
      img.vectorscope = fig.canvas;
      updateVectorscopeTable();
    };
    if (type === 1) { // x-y
      var bg = new Image;
      bg.onload = function() {
        makeFigure(fig, w, h, dist);
        fig.context.globalAlpha = 0.5;
        fig.context.globalCompositeOperation = 'lighter';
        fig.context.drawImage(bg, 0, 0, 320, 320);
        notify();
      };
      bg.src = 'res/xy-chromaticity-diagram.png';
    } else {
      makeFigure(fig, w, h, dist);
      notify();
    }
    
    function makeFigure(fig, w, h, dist) {
      var context = fig.context;
      var bits = makeDistributionImageData(context, 320, 320, dist, w * h, 255, 1);
      context.putImageData(bits, 0, 0);
      var srgbToLinear = function(c) {
        return c < 0.040450 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      var calcxy = function(r, g, b) {
        if (type === 0) { // Cb-Cr
          var cb = -0.1687 * r - 0.3313 * g + 0.5000 * b;
          var cr =  0.5000 * r - 0.4187 * g - 0.0813 * b;
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
        { pos: calcxy(255, 0,   0  ) , color: '#f00', types: [0,1,3,4]   },
        { pos: calcxy(0,   255, 0  ) , color: '#0f0', types: [0,1,2,3]   },
        { pos: calcxy(0,   0,   255) , color: '#00f', types: [0,1,2,4]   },
        { pos: calcxy(0,   255, 255) , color: '#0ff', types: [0,2]   },
        { pos: calcxy(255, 0,   255) , color: '#f0f', types: [0,4]   },
        { pos: calcxy(255, 255, 0  ) , color: '#ff0', types: [0,3]   },
        { pos: calcxy(255, 255, 255) , color: '',     types: []      },
        { pos: { x: 159.5, y: 0     } , color: '',     types: [] },
        { pos: { x: 159.5, y: 320   } , color: '',     types: [] },
        { pos: { x: 0,     y: 159.5 } , color: '',     types: [] },
        { pos: { x: 320,   y: 159.5 } , color: '',     types: [] },
        { pos: { x: 32,    y: 32    } , color: '',     types: [] },
        { pos: { x: 32,    y: 287   } , color: '',     types: [] },
        { pos: { x: 287,   y: 287   } , color: '',     types: [] }
      ];
      var lines = [
        { indices: [8, 9, 10, 11], color: '#046', types: [0] },
        { indices: [0, 1, 0, 2, 0, 3], color: '#024', types: [0,2,3,4] },
        { indices: [0, 4, 0, 5, 0, 6], color: '#024', types: [0] },
        { indices: [1, 6, 6, 2, 2, 4, 4, 3, 3, 5, 5, 1], color: '#024', types: [0] },
        { indices: [4, 7, 5, 7, 6, 7], color: '#024', types: [2,3,4] },
        { indices: [1, 2, 2, 3, 3, 1], color: '#024', types: [1] },
        { indices: [12, 13, 13, 14, 14, 12], color: '#046', types: [1] }
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
      context.globalCompositeOperation = 'lighter';
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
    }
  };
  var updateVectorscopeTable = function(transformOnly) {
    var w = 320, h = 320, margin = 10;
    var styles = makeFigureStyles(w, h, margin, '#444', figureZoom);
    updateFigureTable('#vectorscopeTable', 'vectorscope', updateVectorscopeAsync, styles, transformOnly);
  };
  var toggleVectorscope = defineDialog($('#vectorscope'), updateVectorscopeTable, toggleAnalysis,
    { enableZoom: true, getBaseSize: function() { return { w: 320, h: 320 }; } });
  var changeColorDistType = function(type) {
    if (colorDistType !== type) {
      colorDistType = type;
      for (var i = 0, img; img = images[i]; i++) {
        img.colorDist = null;
        img.colorDistAxes = null;
      }
      $('#colorDistType > *').
        removeClass('current').
        eq(type).addClass('current');
      updateColorDistAll();
    }
  };
  var updateColorDistAsync = function(img) {
    taskQueue.addTask({
      cmd:      'calcColorTable',
      index:    [img.index]
    }, attachImageDataToTask);
  };
  var rotateColorDist = function(dx, dy, scale) {
    colorDistOrientation.x += dy * scale;
    colorDistOrientation.y += dx * scale;
    colorDistOrientation.x = compareUtil.clamp(colorDistOrientation.x, -90, 90);
    colorDistOrientation.y -= Math.floor(colorDistOrientation.y / 360) * 360;
    updateColorDistAll(/* redrawOnly = */ true);
  };
  var zoomColorDist = function(delta) {
    var MAX_ZOOM_LEVEL = 6;
    colorDistZoom = compareUtil.clamp(colorDistZoom + delta, 0, MAX_ZOOM_LEVEL);
    updateColorDistTable(/* transformOnly = */ true);
  };
  var updateColorDistAll = function(redrawOnly) {
    for (var i = 0; img = images[i]; i++) {
      updateColorDist(img, redrawOnly);
    }
  };
  var updateColorDist = function(img, redrawOnly) {
    var fig = redrawOnly ? {
      canvas : img.colorDist,
      context : img.colorDist.getContext('2d'),
      axes : img.colorDistAxes
    } : makeBlankFigure(320, 320);
    makeFigure(fig, img.colorTable);
    if (!redrawOnly) {
      img.colorDist = fig.canvas;
      img.colorDistAxes = fig.axes;
      updateColorDistTable();
    }

    function makeFigure(fig, colorTable) {
      var context = fig.context;
      var distMax = colorTable.totalCount;
      var dist = new Uint32Array(320 * 320);
      for (var i = 0; i < dist.length; ++i) {
        dist[i] = 0;
      }
      var colorMap = null;
      if (colorDistType === 0) { // RGB with Color
        colorMap = new Float32Array(320 * 320 * 3);
        for (var i = 0; i < colorMap.length; ++i) {
          colorMap[i] = 0;
        }
      }
      var colors = colorTable.colors;
      var counts = colorTable.counts;
      var ax = Math.round(colorDistOrientation.x) * (Math.PI / 180);
      var ay = Math.round(colorDistOrientation.y) * (Math.PI / 180);
      var scale = 0.707;
      var xr = scale * Math.cos(ay), yr = -scale * Math.sin(ay) * Math.sin(ax);
      var xg = -scale * Math.sin(ay), yg = -scale * Math.cos(ay) * Math.sin(ax);
      var yb = -scale * Math.cos(ax);
      var orgx = 159.5 - xr * 127.5 - xg * 127.5;
      var orgy = 159.5 - yr * 127.5 - yg * 127.5 - yb * 127.5;
      for (var k = 0, n = colors.length; k < n; k += 1) {
        var rgb = colors[k];
        var r = rgb >> 16;
        var g = (rgb >> 8) & 255;
        var b = rgb & 255;
        var plotx = Math.round(orgx + xr * r + xg * g);
        var ploty = Math.round(orgy + yr * r + yg * g + yb * b);
        var offset = ploty * 320 + plotx;
        var count = counts[k];
        dist[offset] += count;
        if (colorDistType === 0) { // RGB with Color
          colorMap[offset] += count * r;
          colorMap[offset + 102400] += count * g;
          colorMap[offset + 204800] += count * b;
        }
      }
      if (colorDistType === 0) { // RGB with Color
        var bits = makeDistributionImageDataRGBA(context, 320, 320, dist, colorMap, distMax, 255);
      } else { // RGB without Color
        var bits = makeDistributionImageData(context, 320, 320, dist, distMax, 255, 1);
      }
      context.putImageData(bits, 0, 0);
      var vbox = '0 0 ' + 320 + ' ' + 320;
      var colorToXY = function(r, g, b) {
        return {
            x : 160 + xr * r + xg * g,
            y : 160 + yr * r + yg * g + yb * b
        };
      };
      var colorToDesc = function(r, g, b) {
        var xy = colorToXY(r, g, b);
        return xy.x + ',' + xy.y;
      };
      var v = [];
      for (var i = 0; i < 8; ++i) {
        v[i] = colorToDesc(-128 + (i & 4) * 64, -128 + (i & 2) * 128, -128 + (i & 1) * 256);
      }
      var axesDesc =
            'M ' + v[0] + ' L ' + v[1] + ' L ' + v[3] + ' L ' + v[2] + ' L ' + v[0] +
            ' M ' + v[0] + ' L ' + v[4] + ' M ' + v[1] + ' L ' + v[5] +
            ' M ' + v[2] + ' L ' + v[6] + ' M ' + v[3] + ' L ' + v[7] +
            ' M ' + v[4] + ' L ' + v[5] + ' L ' + v[7] + ' L ' + v[6] + ' L ' + v[4];
      var labels = [
          { r : -140, g : -140, b : -140, text : 'O', color : '#888' },
          { r : 140, g : -140, b : -140, text : 'R', color : '#f00' },
          { r : -140, g : 140, b : -140, text : 'G', color : '#0f0' },
          { r : -140, g : -140, b : 140, text : 'B', color : '#00f' }
      ];
      var axesLabels = [];
      var axesLabelsAttr = [];
      for (var i = 0, label; label = labels[i]; ++i) {
        var fillColor = label.color;
        if (i === 0 && xr < 0 && 0 < yr && 0 < xg) fillColor = 'transparent';
        if (i === 1 && xr < 0 && yr < 0 && xg < 0) fillColor = 'transparent';
        if (i === 2 && 0 < xg && yg < 0 && 0 < yr) fillColor = 'transparent';
        if (i === 3 && xr < 0 && yr < 0 && 0 < xg) fillColor = 'transparent';
        var xy = colorToXY(label.r, label.g, label.b);
        var attr = {
          fill : fillColor,
          x : xy.x,
          y : xy.y
        };
        axesLabels.push('<text>' + label.text + '</text>');
        axesLabelsAttr.push(attr);
      }
      if (!fig.axes) {
        fig.axes = $(
        '<svg viewBox="' + vbox + '">' +
          '<g stroke="white" fill="none">' +
            '<path stroke-width="0.2" d="' + axesDesc + '"></path>' +
          '</g>' +
          '<g class="labels" font-size="12" text-anchor="middle" dominant-baseline="middle">' + axesLabels.join('') + '</g>' +
        '</svg>');
      } else {
        $(fig.axes).find('g path').attr('d', axesDesc);
      }
      for (var i = 0, a; a = axesLabelsAttr[i]; ++i) {
        $(fig.axes).find('g.labels text').eq(i).attr(a);
      }
    }
  };
  var updateColorDistTable = function(transformOnly) {
    var w = 320, h = 320, margin = 10;
    var styles = makeFigureStyles(w, h, margin, '#444');
    var scale = Math.round(Math.pow(2, colorDistZoom) * 100) / 100;
    styles.style.transform += ' scale(' + scale + ')';
    updateFigureTable('#colorDistTable', 'colorDist', updateColorDistAsync, styles, transformOnly);
  };
  var toggleColorDist = defineDialog($('#colorDist'), updateColorDistTable, toggleAnalysis, {
    onOpen: function() { colorDistZoom = 0; }
  });
  var colorDistProcessKeyDown = function(e) {
    return compareUtil.processKeyDownEvent(e, {
      zoomIn: function() { zoomColorDist(0.25); return false; },
      zoomOut: function() { zoomColorDist(-0.25); return false; },
      cursor: function() {
        var step = e.shiftKey ? 10 : 1;
        var d = compareUtil.cursorKeyCodeToXY(e.keyCode);
        rotateColorDist(d.x, d.y, step);
        return false;
      }
    });
  };
  var colorDistProcessMouseDown = function(e) {
    if (e.which === 1) {
      colorDistDragState = { x: e.clientX, y: e.clientY };
      return false;
    }
  };
  var colorDistProcessMouseMove = function(e) {
    if (colorDistDragState) {
      if (e.buttons !== 1) {
        colorDistDragState = null;
      } else {
        var dx = e.clientX - colorDistDragState.x;
        var dy = e.clientY - colorDistDragState.y;
        colorDistDragState = { x: e.clientX, y: e.clientY };
        rotateColorDist(dx, dy, 0.5);
        return false;
      }
    }
  };
  var colorDistEnableMouseAndTouch = function(root, filter, deepFilter) {
    $(root).on('mousedown', deepFilter, function(e) {
      return colorDistProcessMouseDown(e);
    });
    $(root).on('mousemove', filter, function(e) {
      return colorDistProcessMouseMove(e);
    });
    $(root).on('wheel', filter, function(e) {
      return compareUtil.processWheelEvent(e, {
        zoom: function(steps) {
          var ZOOM_STEP_WHEEL = 0.0625;
          zoomColorDist(-steps * ZOOM_STEP_WHEEL);
        }
      });
    });
    $(root).on('touchmove', filter, function(e) {
      return colorDistTouchFilter.onTouchMove(e, {
        move: function(dx, dy) { rotateColorDist(dx, dy, 0.3); },
        zoom: function(dx, dy, delta) { zoomColorDist(delta); }
      });
    });
    $(root).on('touchend', filter, function(e) {
      colorDistTouchFilter.resetState();
    });
  };
  var metricsToString = function(metrics, imgA) {
    if (typeof metrics === 'string') {
      return { psnr: metrics, rmse: metrics, mse: metrics, ncc: metrics, ae: metrics };
    } else {
      return {
        psnr:
            isNaN(metrics.psnr) ? '‐' :
            metrics.psnr === Infinity ? '∞ dB' :
            metrics.psnr.toFixed(2) + ' dB',
        rmse:
            isNaN(metrics.mse) ? '‐' :
            Math.sqrt(metrics.mse).toPrecision(6),
        mse:
            isNaN(metrics.mse) ? '‐' :
            metrics.mse.toPrecision(6),
        ncc:
            isNaN(metrics.ncc) ? '‐' :
            metrics.ncc.toFixed(6),
        ae:
            isNaN(metrics.ae) ? '‐' :
            compareUtil.addComma(metrics.ae) +
                ' (' + compareUtil.toPercent(metrics.ae/imgA.width/imgA.height) + ')'
      };
    }
  };
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
    return $('<span>').append(
      $('<span class="imageIndex"/>').text(selectedIndex + 1),
      select
    );
  };
  function updateMetricsTable()
  {
    $('#metricsTable td:not(.prop)').remove();
    var rowCount = $('#metricsTable tr').length;
    if (images.length === 0) {
      $('#metricsBaseName').append($('<td>').attr('rowspan', rowCount).text('no data'));
      return;
    }
    if (images.length === 1) {
      $('#metricsTargetName').append($('<td>').attr('rowspan', rowCount - 1).text('no data'));
    }
    baseImageIndex = baseImageIndex === null ? images[0].index : baseImageIndex;
    $('#metricsBaseName').append(
      $('<td>').attr('colspan', images.length - 1).append(
        makeImageNameSelector(baseImageIndex, function(index) {
          baseImageIndex = index;
          updateMetricsTable();
        })
      )
    );
    for (var i = 0, img; img = images[i]; i++) {
      if (img.index === baseImageIndex) {
        continue;
      }
      var a = entries[baseImageIndex];
      var b = img;
      if (!a.metrics[b.index]) {
        a.metrics[b.index] = 'calculating...';
        b.metrics[a.index] = 'calculating...';
        taskQueue.addTask({
          cmd:      'calcMetrics',
          index:    [a.index, b.index]
        }, attachImageDataToTask);
      }
      $('#metricsTargetName').append(
        $('<td>').append(
          makeImageNameWithIndex('<span>', b),
          '&nbsp;',
          $('<button>').text('↑').click(b.index, function(e) {
            baseImageIndex = e.data;
            updateMetricsTable();
          })
        )
      );
      var values = metricsToString(a.metrics[b.index], a);
      $('#psnrValue').append($('<td>').text(values.psnr));
      $('#rmseValue').append($('<td>').text(values.rmse));
      $('#mseValue').append($('<td>').text(values.mse));
      $('#nccValue').append($('<td>').text(values.ncc));
      $('#aeValue').append($('<td>').text(values.ae));
    }
  }
  var toggleMetrics = defineDialog($('#metrics'), updateMetricsTable, toggleAnalysis);

  var findImageIndexOtherThan = function(index) {
    for (var i = 0, img; img = images[i]; ++i) {
      if (img.index !== index) {
        return img.index;
      }
    }
    return null;
  };
  var setupBaseAndTargetSelector = function(baseSelector, targetSelector, onUpdate) {
    $(baseSelector).children().remove();
    $(targetSelector).children().remove();
    if (images.length < 2) {
      $(baseSelector).append($('<span>').text('no data'));
      $(targetSelector).append($('<span>').text('no data'));
      return false;
    }
    baseImageIndex = baseImageIndex === null ? images[0].index : baseImageIndex;
    if (targetImageIndex === null || baseImageIndex === targetImageIndex) {
      targetImageIndex = findImageIndexOtherThan(baseImageIndex);
    }
    $(baseSelector).append(
      makeImageNameSelector(baseImageIndex, function(index) {
        baseImageIndex = index;
        if (baseImageIndex === targetImageIndex) {
          targetImageIndex = findImageIndexOtherThan(baseImageIndex);
        }
        onUpdate();
      })
    );
    $(targetSelector).append(
      makeImageNameSelector(targetImageIndex, function(index) {
        targetImageIndex = index;
        if (targetImageIndex === baseImageIndex) {
          baseImageIndex = findImageIndexOtherThan(targetImageIndex);
        }
        onUpdate();
      })
    );
  };
  var changeToneCurveType = function(type) {
    if (toneCurveType !== type) {
      toneCurveType = type;
      discardTasksOfCommand('calcToneCurve');
      toneCurveResult = {};
      $('#toneCurveType > *').
        removeClass('current').
        eq(type).addClass('current');
      updateToneCurveTable();
    }
  };
  var makeToneMapFigure = function(toneMapData, type) {
    var fig = makeBlankFigure(320, 320);
    var dist = toneMapData.dist;
    var max = toneMapData.max;
    var bits = makeDistributionImageData(fig.context, 256, 256, dist, max, 96, type);
    fig.context.fillStyle = '#000';
    fig.context.fillRect(0, 0, 320, 320);
    fig.context.putImageData(bits, 32, 32);
    return fig;
  };
  var updateToneCurveTableDOM = function() {
    $('#toneCurveResult *').remove();
    if (false === setupBaseAndTargetSelector('#toneCurveBaseName', '#toneCurveTargetName', updateToneCurveTable)) {
      return;
    }
    var a = entries[baseImageIndex];
    var b = entries[targetImageIndex];
    if (toneCurveResult.base !== baseImageIndex ||
        toneCurveResult.target !== targetImageIndex ||
        toneCurveResult.type !== toneCurveType) {
      toneCurveResult.base   = baseImageIndex;
      toneCurveResult.target = targetImageIndex;
      toneCurveResult.type   = toneCurveType;
      toneCurveResult.result = null;
      discardTasksOfCommand('calcToneCurve');
      if (baseImageIndex !== targetImageIndex) {
        taskQueue.addTask({
          cmd:      'calcToneCurve',
          type:     toneCurveType,
          index:    [a.index, b.index]
        }, attachImageDataToTask);
      }
    }
    var figW = 320, figH = 320, figMargin = 8;
    var styles = makeFigureStyles(figW, figH, figMargin, '#666', figureZoom);
    if (toneCurveResult.result === null) {
      $('#toneCurveResult').append(makeBlankFigure(8,8).canvas).css(styles.cellStyle);
    } else {
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
    }
  };
  var updateToneCurveTable = function(transformOnly) {
    if (transformOnly) {
      if (toneCurveResult.result !== null) {
        $('#toneCurveResult > *').css({
          transform: 'translate(-50%,0%) ' + figureZoom.makeTransform()
        });
      }
    } else {
      updateToneCurveTableDOM();
    }
  };
  var toggleToneCurve = defineDialog($('#toneCurve'), updateToneCurveTable, toggleAnalysis,
    { enableZoom: true, getBaseSize: function() { return { w: 320, h: 320 }; } });

  var updateDiffTableDOM = function() {
    $('.diffDimension').css({display:'none'});
    $('#diffDimensionReport *').remove();
    $('#diffDetectedMaxAE').text('');
    $('#diffIgnoreAEResult').text('');
    $('#diffResult *').remove();
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
    if (false === setupBaseAndTargetSelector('#diffBaseName', '#diffTargetName', updateDiffTable)) {
      return;
    }
    var a = entries[baseImageIndex];
    var b = entries[targetImageIndex];
    if (a.width === b.width && a.height === b.height) {
      $('.diffDimension').css({display:'none'});
    } else {
      $('.diffDimension').css({display:''});
      setText($('#diffDimensionReport'), {
        en: 'dimensions are different',
        ja: '画像サイズが異なります'
      });
    }
    if (diffResult.base !== baseImageIndex || diffResult.target !== targetImageIndex ||
        diffResult.ignoreAE !== diffOptions.ignoreAE ||
        diffResult.ignoreRemainder !== diffOptions.ignoreRemainder ||
        diffResult.resizeToLarger !== diffOptions.resizeToLarger ||
        diffResult.resizeMethod !== diffOptions.resizeMethod ||
        diffResult.offsetX !== diffOptions.offsetX ||
        diffResult.offsetY !== diffOptions.offsetY) {
      diffResult.base   = baseImageIndex;
      diffResult.target = targetImageIndex;
      diffResult.ignoreAE = diffOptions.ignoreAE;
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
          index:    [a.index, b.index],
          options:  {
            ignoreAE:   diffOptions.ignoreAE,
            ignoreRemainder: diffOptions.ignoreRemainder,
            resizeToLarger: diffOptions.resizeToLarger,
            resizeMethod: diffOptions.resizeMethod,
            offsetX: diffOptions.offsetX,
            offsetY: diffOptions.offsetY
          }
        }, attachImageDataToTask);
      }
    }
    var figW = 768, figH = 400, figMargin = 8;
    var styles = makeFigureStyles(figW, figH, figMargin, '#000');
    if (diffResult.result === null) {
      $('#diffResult').append(makeBlankFigure(8,8).canvas).css(styles.cellStyle);
      setText($('#diffSummary'), {
        en: 'calculating...',
        ja: '計算中...'
      });
    } else {
      if (diffResult.result.summary.maxAE !== 0) {
        var e = diffResult.result.summary.maxAE;
        $('#diffDetectedMaxAE').text(e);
      }
      if (diffOptions.ignoreAE !== 0) {
        var rate = diffResult.result.summary.countIgnoreAE / diffResult.result.summary.total;
        var percent = compareUtil.toPercent(rate);
        $('#diffIgnoreAEResult').text(percent);
      }
      var w = diffResult.result.image.width;
      var h = diffResult.result.image.height;
      var fig = makeBlankFigure(w, h);
      var bits = fig.context.createImageData(w, h);
      copyImageBits(diffResult.result.image, bits);
      fig.context.putImageData(bits, 0, 0);
      styles = updateFigureStylesForActualSize(styles, w, h);
      diffResult.baseWidth = styles.baseW;
      diffResult.baseHeight = styles.baseH;
      $('#diffResult').append($(fig.canvas).css(styles.style).addClass('figMain')).css(styles.cellStyle);
      if (diffResult.result.summary.unmatch === 0) {
        setText($('#diffSummary'), {
          en: 'Perfect match',
          ja: '完全に一致しました'
        });
      } else {
        var matchRate = diffResult.result.summary.match / diffResult.result.summary.total;
        var percent = compareUtil.toPercent(matchRate);
        setText($('#diffSummary'), {
          en: percent + ' pixels are match',
          ja: percent + ' のピクセルが一致しました'
        });
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
    }
  };
  var updateDiffTable = function(transformOnly) {
    if (transformOnly) {
      if (diffResult.result !== null) {
        $('#diffResult canvas').css('transform', 'translate(-50%,0%) ' + figureZoom.makeTransform());
      }
    } else {
      updateDiffTableDOM();
    }
  };
  var toggleDiff = defineDialog($('#diff'), updateDiffTable, toggleAnalysis, {
      enableZoom: true,
      getBaseSize: function() {
        return diffResult ? { w: diffResult.baseWidth, h: diffResult.baseHeight } : null;
      }
    });

  var newSelectorButton = function(index) {
    var button = $('<button/>').addClass('selector').
        text(index + 1).
        append(
          setText($('<span class="tooltip"/>'), {
            en: 'Select picture ',
            ja: '画像を選択 '
          })
        ).
        click(function(e) { toggleSingleView(index + 1); });
    if (index < 9) {
      button.find('span.tooltip span').addClass('keys flat').
          append($('<span/>').text(index + 1));
    }
    return button;
  };
  var updateSelectorButtonState = function() {
    if (isSingleView) {
      $('.selector').removeClass('current').eq(currentImageIndex - 1).addClass('current');
      if (overlayMode) {
        $('.selector').eq(overlayBaseIndex).addClass('current');
      }
    } else {
      $('.selector').removeClass('current');
    }
    $('.selector').each(function(index) {
      if (index < entries.length && !entries[index].visible) {
        $(this).css({ display : 'none' });
      }
    });
  };
  function updateDOM()
  {
    images = entries.filter(function(ent,i,a) { return ent.ready(); });
    if (images.length === 0) {
      viewZoom.disable();
    } else {
      viewZoom.enable();
    }
    for (var i = 0, ent; ent = entries[i]; i++) {
        if (!ent.view) {
          ent.view = $('<div class="imageBox"/>').append(
            makeImageNameWithIndex('<span class="imageName">', ent).
              click({index : i}, function(e) { toggleSingleView(e.data.index + 1); }).
              append(
                $('<button>').addClass('remove').text('×').
                  click({index : i}, function(e) { removeEntry(e.data.index); }))
          );
          $('#drop').before(ent.view);
        }
        if (ent.element && 0 === ent.view.find('.image').length) {
          ent.view.prepend(ent.element);
        }
        if (ent.error) {
          ent.view.addClass('error');
          ent.visible = false;
        }
        if (!ent.button) {
          ent.button = newSelectorButton(i);
          $('#overlay').before(ent.button);
        }
    }
    resetMouseDrag();
    updateLayout();
  }

  function resetMouseDrag()
  {
    viewZoom.resetDragState();
  }

  function updateLayout()
  {
    isSingleView =
            currentImageIndex !== 0 &&
            currentImageIndex <= entries.length;
    if (!isSingleView && overlayMode) {
      overlayMode = false;
    }
    if (layoutMode === null) {
      layoutMode = $('#view').width() < $('#view').height() ? 'y' : 'x';
    }
    $('#view').css({ flexDirection : layoutMode === 'x' ? 'row' : 'column' });
    $('#arrange img').attr('src', layoutMode === 'x' ? 'res/layout_x.svg' : 'res/layout_y.svg');
    var param = makeImageLayoutParam();
    $('#view > div.imageBox').each(function(index) {
      var hide = isSingleView && index + 1 !== currentImageIndex;
      if (overlayMode) {
        hide = hide && index !== overlayBaseIndex;
      }
      var img = entries[index];
      if (hide || !img || !img.visible) {
        $(this).css({ display : 'none' });
      } else {
        updateImageBox(img, param.boxW, param.boxH);
        var isOverlay = overlayMode && index + 1 === currentImageIndex && index !== overlayBaseIndex;
        $(this).css({
          display   : '',
          position  : overlayMode ? 'absolute' : '',
          width     : overlayMode ? $('#view').width() + 'px' : '',
          opacity   : isOverlay ? '0.5' : '',
          background : overlayMode ? '#000' : ''
        });
      }
    });
    $('#view > div.emptyBox').each(function(index) {
      var hide = isSingleView || param.numVisibleEntries + index >= param.numSlots;
      $(this).css({ display : (hide ? 'none' : '') });
    });
    updateOverlayModeIndicator();
    roiMap.onUpdateLayout();
    updateSelectorButtonState();
    updateTransform();
    dialogUtil.adjustDialogPosition();
  }
  
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
        grid.onUpdateTransform(ent, style);
        crossCursor.onUpdateTransformEach(ent, style);
      }
    }
    roiMap.onUpdateTransform();
    crossCursor.onUpdateTransform();
  }

  var setEntryImage = function(entry, img, useCanvasToDisplay) {
    var w = img.naturalWidth;
    var h = img.naturalHeight;
    if (entry.format === 'SVG' && (w === 0 && h === 0)) {
      w = 150;
      h = 150;
      entry.sizeUnknown = true;
    }
    var fig = makeBlankFigure(w, h);
    fig.context.drawImage(img, 0, 0, w, h);
    //
    entry.element    = useCanvasToDisplay ? fig.canvas : img;
    $(entry.element).addClass('image');
    entry.asCanvas   = fig.canvas;
    entry.width      = w;
    entry.height     = h;
    entry.canvasWidth   = w;
    entry.canvasHeight  = h;
    entry.loading    = false;
    entry.progress   = 100;
    //
    applyExifOrientation(entry);
    updateDOM();
    nowLoadingDialog.update();
  };
  var setEntryError = function(entry, message) {
    entry.loading = false;
    entry.error = message;
    updateDOM();
    nowLoadingDialog.update();
  };
  var setEntryDataURI = function(entry, dataURI) {
    var binary = compareUtil.binaryFromDataURI(dataURI);
    var format = compareUtil.detectImageFormat(binary);
    var isPNG  = format && 0 <= format.indexOf('PNG');
    var isJPEG = format && 0 <= format.indexOf('JPEG');
    entry.format = format || (entry.fileType ? '('+entry.fileType+')' : '(unknown)');
    if (isJPEG) {
      entry.orientation = compareUtil.detectExifOrientation(binary);
    }
    var useCanvasToDisplay = NEEDS_IOS_EXIF_WORKAROUND && isJPEG;
    var img = new Image;
    $(img).on('load', function() {
        setEntryImage(entry, img, useCanvasToDisplay);
      }).
      on('error', function() {
        var message = 'Failed.';
        if (!entry.fileType || !(/^image\/.+$/.test(entry.fileType))) {
          message += ' Maybe not an image file.';
        } else if (!isPNG && !isJPEG && entry.format !== 'GIF' && entry.format !== 'BMP') {
          message += ' Maybe unsupported format for the browser.';
        }
        setEntryError(entry, message);
      });
    img.src = dataURI;
  };
  var newEntry = function(file) {
      var entry = {
            index           : null,
            name            : file.name,
            size            : file.size,
            fileType        : file.type,
            lastModified    : new Date(file.lastModified || file.lastModifiedDate),
            format          : '',
            width           : 0,
            height          : 0,
            canvasWidth     : 0,
            canvasHeight    : 0,
            orientation     : null,
            transposed      : false,
            orientationAsCSS    : '',
            view        : null,
            button      : null,
            element     : null,
            asCanvas    : null,
            imageData   : null,
            histogram   : null,
            waveform    : null,
            vectorscope : null,
            colorTable  : null,
            colorDist   : null,
            metrics     : [],
            loading     : true,
            progress    : 0,
            error       : null,
            visible     : true,
            
            ready   : function() { return null !== this.element; }
      };
      return entry;
  };
  function addFile(file)
  {
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
        setEntryDataURI(entry, e.target.result);
      };
      reader.onerror = function(e) {
        setEntryError(entry, 'Failed. File could not be read. (' + reader.error.name + ')');
      };
      reader.readAsDataURL(file);
  }
  function addFiles(files)
  {
    var sorted = Array.prototype.slice.call(files);
    sorted.sort(function(a, b) {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
    for (var i = 0, f; f = sorted[i]; i++) {
      addFile(f);
    }
    currentImageIndex = 0;
    updateDOM();
    nowLoadingDialog.update();
  }
