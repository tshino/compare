var MAX_ZOOM_LEVEL    = 6.0;
var ZOOM_STEP_KEY     = 0.25;
var ZOOM_STEP_WHEEL   = 0.0625;
var ZOOM_STEP_DBLCLK  = 2.00;
var NEEDS_IOS_EXIF_WORKAROUND = (function(){
  var ua = window.navigator.userAgent.toLowerCase();
  return 0 <= ua.indexOf('iphone') || 0 <= ua.indexOf('ipad') || 0 <= ua.indexOf('ipod');
})();

$( function()
{
  // Check for the various File API support.
  if (!(window.File && window.FileReader && window.FileList && window.Blob))
  {
    alert('The File APIs are not fully supported in this browser.');
  }

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
  $('#diffIgnoreAE').on('change', function(e) {
    diffOptions.ignoreAE = this.value;
    updateDiffTable();
    return false;
  });
  $('#diffIgnoreRemainder').on('change', function(e) {
    diffOptions.ignoreRemainder = this.checked;
    updateDiffTable();
    return false;
  });
  $('#diffResizeToLarger').on('change', function(e) {
    diffOptions.resizeToLarger = this.checked;
    updateDiffTable();
    return false;
  });
  $('#diffResizeMethod').on('change', function(e) {
    diffOptions.resizeMethod = this.options[this.selectedIndex].value;
    updateDiffTable();
    return false;
  });
  
  $(window).resize(function() { layoutMode = null; updateLayout(); });
  $(window).keydown(function(e)
    {
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return true;
      }
      // ESC (27)
      if (dialog && e.keyCode == 27 && !e.shiftKey) {
        dialog.close();
        return false;
      }
      if (e.target.localName == 'input') {
        return true;
      }
      if (dialog)
      {
        // BS (8)
        if (e.keyCode == 8 && !e.shiftKey) {
          dialog.close();
          return false;
        }
        // '1' - '9' (48-57 or 96-105 for numpad)
        if ((49 <= e.keyCode && e.keyCode <= 57 && !e.shiftKey) ||
            (97 <= e.keyCode && e.keyCode <= 105 && !e.shiftKey)) {
          var num = e.keyCode % 48;
          var sw = $(dialog.element).find('.mode-sw > button:nth-child('+num+')');
          if (sw.length == 1) {
            sw.click();
            return false;
          }
          if ($('#diff').is(':visible') &&
              entries[num - 1].ready() &&
              baseImageIndex !== null && targetImageIndex !== null &&
              targetImageIndex != num - 1) {
            baseImageIndex = targetImageIndex;
            targetImageIndex = num - 1;
            updateDiffTable();
            return false;
          }
          if ($('#metrics').is(':visible') &&
              entries[num - 1].ready() &&
              baseImageIndex !== null &&
              baseImageIndex !== num - 1) {
            baseImageIndex = num - 1;
            updateMetricsTable();
            return false;
          }
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
      // '+;' (59, 187 or 107 for numpad) / PageUp (33)
      if (e.keyCode == 59 || e.keyCode == 187 || e.keyCode == 107 ||
          (e.keyCode == 33 && !e.shiftKey))
      {
        zoomIn();
        return false;
      }
      // '-' (173, 189 or 109 for numpad) / PageDown (34)
      if (e.keyCode == 173 || e.keyCode == 189 || e.keyCode == 109 ||
          (e.keyCode == 34 && !e.shiftKey))
      {
        zoomOut();
        return false;
      }
      // cursor key
      if (37 <= e.keyCode && e.keyCode <= 40)
      {
        var x = e.keyCode == 37 ? -1 : e.keyCode == 39 ? 1 : 0;
        var y = e.keyCode == 38 ? -1 : e.keyCode == 40 ? 1 : 0;
        addViewOffset(x * 0.4 / scale, y * 0.4 / scale);
        updateTransform();
        return false;
      }
      // ESC (27)
      if (e.keyCode == 27 && !e.shiftKey)
      {
        currentImageIndex = 0;
        viewZoom = 0;
        setViewOffset(0.5, 0.5);
        overlayMode = false;
        resetMouseDrag();
        updateLayout();
        return false;
      }
      // Delete (46)
      if (e.keyCode == 46 && !e.shiftKey && 0 < images.length)
      {
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
    // 'c' (99)
    99 : { global: true, func: toggleAnalysis },
    // 'h' (104)
    104 : { global: true, func: toggleHistogram },
    // 'w' (119)
    119 : { global: true, func: toggleWaveform },
    // 'v' (118)
    118 : { global: true, func: toggleVectorscope },
    // 'm' (109)
    109 : { global: true, func: toggleMetrics },
    // 'd' (100)
    100 : { global: true, func: toggleDiff },
    // 'i' (105)
    105 : { global: true, func: toggleInfo },
    // 'a' (97)
    97 : { global: false, func: arrangeLayout },
    // 'o' (111)
    111: { global: false, func: toggleOverlay },
    // 'n' (110)
    110 : { global: false, func: toggleMap },
    // 'g' (103)
    103 : { global: false, func: toggleGrid },
  };
  $(window).keypress(function(e) {
    if (e.altKey || e.metaKey || e.target.localName == 'input') {
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
  
  $('#view').on('mousedown', 'div.imageBox', function(e) {
    var index = $('#view > div.imageBox').index(this);
    if (index >= entries.length) {
      return true;
    }
    if (e.which == 1) {
      dragLastPoint = { x : e.clientX, y : e.clientY };
      return false;
    }
  });
  $('#view').on('mousemove', 'div.imageBox', function(e) {
    if (entries.length == 0) {
      return true;
    }
    var index = Math.min(entries.length - 1, $('#view > div.imageBox').index(this));
    if (dragLastPoint && e.buttons != 1) {
      dragLastPoint = null;
    }
    if (dragLastPoint) {
      var dx = e.clientX - dragLastPoint.x;
      var dy = e.clientY - dragLastPoint.y;
      dragLastPoint = { x : e.clientX, y : e.clientY };
      moveImageByPx(index, dx, dy);
      updateTransform();
      return false;
    }
  });
  $('#view').on('mouseup', 'div.imageBox', resetMouseDrag);
  $('#view').on('dblclick', 'div.imageBox .image', function(e) {
    var index = $('#view > div.imageBox').index($(this).parent());
    if (index >= entries.length || !entries[index].ready()) {
      return true;
    }
    var img = entries[index];
    var x = (e.pageX - $(this).offset().left) / (img.baseWidth * scale);
    var y = (e.pageY - $(this).offset().top) / (img.baseHeight * scale);
    zoomWithTarget(index, x, y);
  });
  $('#view').on("wheel", function(e) {
    var event = e.originalEvent;
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
        return true;
    }
    var deltaScale = event.deltaMode == 0 ? /* PIXEL */ 0.1 : /* LINE */ 1.0;
    var steps = Math.max(-3, Math.min(3, event.deltaY * deltaScale));
    if (steps != 0) {
        zoomRelative(-steps * ZOOM_STEP_WHEEL);
        return false;
    }
  });
  $('#view').on('touchmove', 'div.imageBox', function(e) {
    if (entries.length == 0) {
      return true;
    }
    var index = Math.min(entries.length - 1, $('#view > div.imageBox').index(this));
    var event = e.originalEvent;
    if (event.targetTouches.length == 1) {
      var touch = event.targetTouches[0];
      if (!touchState || touchState.identifier != touch.identifier) {
        touchState = { x: touch.clientX, y: touch.clientY, identifier: touch.identifier };
      }
      var dx = touch.clientX - touchState.x;
      var dy = touch.clientY - touchState.y;
      touchState.x = touch.clientX;
      touchState.y = touch.clientY;
      moveImageByPx(index, dx, dy);
      updateTransform();
      return false;
    }
  });
  $('#view').on('touchend', 'div.imageBox', function(e) {
    touchState = null;
  });

  updateDOM();
});

  var loading = [];
  var entries = [];
  var images = [];
  var currentImageIndex = 0;
  var isSingleView = false;
  var viewZoom = 0;
  var scale = 1.0;
  var viewOffset = { x : 0.5, y : 0.5 };
  var layoutMode = null;
  var overlayMode = false;
  var enableMap = false;
  var enableGrid = false;
  var dragLastPoint = null;
  var touchState = null;
  var dialog = null;
  var histogramType = 0;
  var waveformType = 0;
  var vectorscopeType = 0;
  var baseImageIndex = null;
  var targetImageIndex = null;
  var diffResult = {};
  var diffOptions = {
    ignoreAE: 0,
    resizeToLarger: true,
    resizeMethod: 'lanczos3',
    ignoreRemainder: false,
  };

  var toggleLang = function() {
    var lang = $(document.body).attr('class') == 'ja' ? 'en' : 'ja';
    $('#selectLang').val(lang);
    changeLang(lang);
  };
  var setText = function(target, text) {
    for (var i = 0, lang; lang = ['en', 'ja'][i]; ++i) {
      var e = target.find('.' + lang);
      if (0 == e.length) {
        e = $('<span>').addClass(lang);
        target.append(e);
      }
      e.text(text[lang]);
    }
    return target;
  };
  function addComma(num)
  {
    return String(num).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
  }
  function toPercent(num) {
    if (num == 0) return '0%';
    if (num == 1) return '100%';
    var digits =
            num < 0.000001 ? 7 :
            num < 0.0001 ? 5 :
            num < 0.01 ? 3 :
            num < 0.99 ? 1 :
            num < 0.9999 ? 3 :
            num < 0.999999 ? 5 : 7;
    return (num * 100).toFixed(digits) + '%';
  }
  var removeEntry = function(index) {
    var ent = entries[index];
    if (ent && !ent.loading && ent.visible) {
      ent.visible = false;
      if (ent.element) {
        $(ent.view).remove('.image');
        ent.element = null;
      }
      if (baseImageIndex == index) {
        baseImageIndex = null;
      }
      if (targetImageIndex == index) {
        targetImageIndex = null;
      }
      if (diffResult.base == index || diffResult.target == index) {
        $('#diffResult *').remove();
        diffResult.result = null;
      }
      ent.asCanvas = null;
      ent.imageData = null;
      ent.histogram = null;
      ent.waveform = null;
      ent.vectorscope = null;
      currentImageIndex = 0;
      viewZoom = 0;
      setViewOffset(0.5, 0.5);
      overlayMode = false;
      discardTasksOfEntryByIndex(index);
      updateDOM();
    }
  };
  function calcAspectRatio(w, h) {
    var gcd = compareUtil.calcGCD(w, h);
    var w0 = w / gcd, h0 = h / gcd;
    var ratio = w0 / h0;  // use gcd to avoid comparison error
    var result = addComma(w0) + ':' + addComma(h0);
    if (w0 <= 50 || h0 <= 50) {
      return [ratio, result];
    } else {
      for (var i = 1; i <= 10; ++i) {
        var a = w / h * i, b = h / w * i;
        var aa = Math.round(a), bb = Math.round(b);
        if (Math.abs(aa - a) < Math.min(i, aa) * 0.004) {
          return [ratio, result + '\n(approx. ' + addComma(aa) + ':' + i + ')'];
        }
        if (Math.abs(bb - b) < Math.min(i, bb) * 0.004) {
          return [ratio, result + '\n(approx. ' + i + ':' + addComma(bb) + ')'];
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
  var makeImageNameWithIndex = function(tag, img) {
    return $(tag).
        css({ wordBreak : 'break-all' }).
        append($('<span class="imageIndex"/>').text(img.index + 1)).
        append($('<span/>').text(img.name));
  }

  var zoomRelative = function(delta) {
    if (0 < images.length) {
      viewZoom = Math.max(0, Math.min(MAX_ZOOM_LEVEL, viewZoom + delta));
      updateTransform();
    }
  };
  var zoomIn = function() {
    zoomRelative(+ZOOM_STEP_KEY);
  };
  var zoomOut = function() {
    zoomRelative(-ZOOM_STEP_KEY);
  };
  var toggleSingleView = function(targetIndex) {
    if (targetIndex == 0 ||
        targetIndex == currentImageIndex ||
        targetIndex > entries.length ||
        !entries[targetIndex - 1].visible) {
      currentImageIndex = 0;
    } else {
      currentImageIndex = targetIndex;
    }
    updateLayout();
  };
  function arrangeLayout()
  {
    if (isSingleView) {
      currentImageIndex = 0;
    } else if (layoutMode == 'x') {
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
      updateLayout();
    } else if (overlayMode) {
      currentImageIndex = 0 < images.length ? images[0].index + 1 : 0;
      overlayMode = false;
      updateLayout();
    }
  }
  function toggleMap()
  {
    if (!enableMap) {
      if (0 < images.length) {
        enableMap = true;
        updateLayout();
      }
    } else {
      enableMap = false;
      updateLayout();
    }
  }
  var addGrid = function(img) {
    if (img.element && 0 == img.view.find('.grid').length) {
      var vb = '0 0 ' + img.canvasWidth + ' ' + img.canvasHeight;
      var makeGridDesc = function(step, skip) {
        var desc = '';
        for (var k = step; k < img.canvasWidth; k += step) {
          if (skip && (k % skip) == 0) continue;
          desc += 'M ' + k + ',0 l 0,' + img.canvasHeight + ' ';
        }
        for (var k = step; k < img.canvasHeight; k += step) {
          if (skip && (k % skip) == 0) continue;
          desc += 'M 0,' + k + ' l ' + img.canvasWidth + ',0 ';
        }
        return desc;
      };
      var grid100 = makeGridDesc(100);
      var grid10 = makeGridDesc(10, 100);
      img.grid = $(
        '<svg class="imageOverlay grid" viewBox="' + vb + '">' +
          '<path stroke="white" fill="none" stroke-width="0.5" opacity="0.6" d="' + grid100 + '"></path>' +
          '<path stroke="white" fill="none" stroke-width="0.5" opacity="0.6" d="' + grid10 + '"></path>' +
        '</svg>').
        width(img.canvasWidth).
        height(img.canvasHeight);
      img.view.append(img.grid);
    }
  };
  var removeGrid = function(img) {
    if (img.grid) {
      $(img.grid).remove();
      img.grid = null;
    }
  };
  var toggleGrid = function() {
    enableGrid = 0 == images.length ? false : !enableGrid;
    enableGrid ? $('#gridbtn').addClass('current') : $('#gridbtn').removeClass('current');
    updateLayout();
  };
  var swapBaseAndTargetImage = function() {
    if (baseImageIndex !== null && targetImageIndex !== null) {
      var temp = targetImageIndex;
      targetImageIndex = baseImageIndex;
      baseImageIndex = temp;
      updateDiffTable();
    }
  };
  var hideDialog = function() {
    if (dialog) {
      dialog.element.hide();
      dialog = null;
    }
  };
  var showDialog = function(target, parent) {
    dialog = { element: target, close: parent || hideDialog };
    target.css({ display: 'block' });
    target.children().find('.dummyFocusTarget').focus();
  };
  var adjustDialogPosition = function() {
    if (dialog) {
      var target = dialog.element, dlg = dialog.element.children();
      var offset = dlg.offset();
      var border = 10;
      var left = Math.max(0, Math.min(target.width() - dlg.width() - border, offset.left));
      var top  = Math.max(0, Math.min(target.height() - dlg.height() - border, offset.top));
      if (left != offset.left || top != offset.top) {
        dlg.offset({ left: left, top: top });
      }
    }
  };
  var defineDialog = function(target, update, parent) {
    target.on('click', parent || hideDialog);
    target.children().on('click', function(e) { e.stopPropagation(); return true; });
    var dlg = target.children();
    var draggingPoint = null;
    var moveDialog = function(dx, dy) {
      var offset = dlg.offset();
      dlg.offset({ left: offset.left + dx, top: offset.top + dy });
    };
    target.on('mousedown', '.header', function(e) {
      if (e.which == 1 && !$(e.target).is('a, select')) {
        draggingPoint = { x: e.clientX, y: e.clientY };
        return false;
      }
    }).on('mousemove', function(e) {
      if (!draggingPoint || e.buttons != 1) {
        draggingPoint = null;
      } else {
        var dx = e.clientX - draggingPoint.x;
        var dy = e.clientY - draggingPoint.y;
        draggingPoint = { x: e.clientX, y: e.clientY };
        moveDialog(dx, dy);
        return false;
      }
    });
    target.children().prepend($('<div class="dummyFocusTarget" tabindex="-1">').
      css({display:'inline',margin:'0px',padding:'0px',border:'0px'}));
    return function() {
      if (dialog && target.is(':visible')) {
        hideDialog();
      } else {
        hideDialog();
        if (update) {
          update();
        }
        showDialog(target, parent);
        dlg.css({position:'',left:'',top:''});
      }
    };
  };
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
    for (var i = 0, img; img = images[i]; i++)
    {
      val[i] = [
        [null, makeImageNameWithIndex('<span>', img) ],
        [null, img.format ],
        img.sizeUnknown ? unknown : [img.width, addComma(img.width) ],
        img.sizeUnknown ? unknown : [img.height, addComma(img.height) ],
        img.sizeUnknown ? unknown : calcAspectRatio(img.width, img.height),
        [orientationToString(img.orientation), orientationToString(img.orientation)],
        [img.size, addComma(img.size) ],
        [img.lastModified, img.lastModified.toLocaleString()] ];
      for (var j = 0, v; v = val[i][j]; ++j) {
        var expr = val[i][j][1];
        var e = (typeof expr == 'string' ? $('<td>').text(expr) : $('<td>').append(expr));
        if (0 < i && val[i][j][0]) {
          e.addClass(
              val[0][j][0] < val[i][j][0] ? 'sign lt' :
              val[0][j][0] > val[i][j][0] ? 'sign gt' : 'sign eq');
        }
        rows[j].append(e);
      }
    }
    if (i == 0) {
      rows[0].append(
        $('<td>').attr('rowspan', rows.length).
            text('no data')
      );
    }
  }
  var toggleAnalysis = defineDialog($('#analysis'));
  var toggleInfo = defineDialog($('#info'), updateInfoTable, toggleAnalysis);
  var toggleNowLoading = defineDialog($('#loading'));
  function updateNowLoading()
  {
    hideDialog();
    $('#loadingList > tr').remove();
    if (0 < loading.length) {
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
        } : 0 == errors ? {
          en: 'Finished!',
          ja: '完了！'
        } : {
          en: 1 == errors ? 'An error occurred.' : 'Some errors occured.',
          ja: errors + '個のエラー'
        });
      toggleNowLoading();
      if (finished && 0 == errors) {
        window.setTimeout( function() {
          if ($('#loading').is(':visible')) {
            hideDialog();
          }
        }, 500);
      }
    }
  }
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
    ctx.font = "24px sans-serif";
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
  var updateFigureTable = function(target, propName, update, style) {
    $(target).find('td').remove();
    for (var k = 0, img; img = images[k]; k++) {
      if (!img[propName]) {
        img[propName] = makeBlankFigure(8, 8).canvas;
        update(img);
      }
      $(target).find('tr').eq(0).append(
        makeImageNameWithIndex('<td>', img)
      );
      $(target).find('tr').eq(1).append(
        $('<td>').append($(img[propName]).css(style))
      );
    }
    if (k == 0) {
      $(target).find('tr').eq(0).append(
        $('<td rowspan="2">').text('no data')
      );
    }
  };
  function changeHistogramType(type)
  {
    if (histogramType != type) {
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
  
  var worker = compareUtil.newWorker('modules/compare-worker.js');
  var taskCount = 0;
  var taskQueue = [];
  var processTaskResult = function(e) {
    var data = e.data;
    switch (data.cmd) {
    case 'calcHistogram':
      if (data.type == histogramType) {
        var img = entries[data.index[0]];
        updateHistogram(data.type, img, data.result);
      }
      break;
    case 'calcWaveform':
      if (data.type == waveformType) {
        var img = entries[data.index[0]];
        updateWaveform(data.type, img, data.histW, data.result);
      }
      break;
    case 'calcVectorscope':
      if (data.type == vectorscopeType) {
        updateVectorscope(data.type, entries[data.index[0]], data.result);
      }
      break;
    case 'calcMetrics':
      entries[data.index[0]].metrics[data.index[1]] = data.result;
      entries[data.index[1]].metrics[data.index[0]] = data.result;
      updateMetricsTable();
      break;
    case 'calcDiff':
      if (diffResult.base == data.index[0] && diffResult.target == data.index[1] &&
          diffResult.ignoreAE == data.options.ignoreAE &&
          diffResult.ignoreRemainder == data.options.ignoreRemainder &&
          diffResult.resizeToLarger == data.options.resizeToLarger &&
          diffResult.resizeMethod == data.options.resizeMethod) {
        diffResult.result = data.result;
      }
      updateDiffTable();
      break;
    }
    --taskCount;
    window.setTimeout(kickNextTask, 0);
  };
  worker.addEventListener('message', processTaskResult, false);
  function kickNextTask()
  {
    if (taskCount == 0 && 0 < taskQueue.length) {
      var task = taskQueue.shift();
      switch (task.cmd) {
      case 'calcHistogram':
      case 'calcWaveform':
      case 'calcVectorscope':
        task.imageData = getImageData(entries[task.index[0]]);
        if (!task.imageData) {
          alert('out of memory');
          return;
        }
        worker.postMessage(task);
        break;
      case 'calcMetrics':
      case 'calcDiff':
        task.imageData1 = getImageData(entries[task.index[0]]);
        task.imageData2 = getImageData(entries[task.index[1]]);
        if (!task.imageData1 || !task.imageData2) {
          alert('out of memory');
          return;
        }
        worker.postMessage(task);
        break;
      }
      ++taskCount;
    }
  }
  function addTask(task)
  {
    taskQueue.push(task);
    window.setTimeout(kickNextTask, 0);
  }
  var discardTasksOfCommand = function(cmd) {
    taskQueue = taskQueue.filter(function(task,i,a) { return task.cmd != cmd; });
  };
  var discardTasksOfEntryByIndex = function(index) {
    taskQueue = taskQueue.filter(function(task,i,a) { return task.index.indexOf(index) == -1; });
  };
  
  function updateHistogramAsync(img)
  {
    addTask({
      cmd:      'calcHistogram',
      type:     histogramType,
      index:    [img.index],
    });
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
      if (type == 0) { // RGB
        context.globalCompositeOperation = 'lighter';
        drawHistogram('#f00', 0);
        drawHistogram('#0f0', 256);
        drawHistogram('#00f', 512);
      } else { // Luminance
        drawHistogram('#fff', 0);
      }
      drawAxes(fig.context, 0, 512, 768, 0, 10, [
        { pos: (0.5 + 0  ) / 256, align: 'left',   label: '0' },
        { pos: (0.5 + 64 ) / 256, align: 'center', label: '64' },
        { pos: (0.5 + 128) / 256, align: 'center', label: '128' },
        { pos: (0.5 + 192) / 256, align: 'center', label: '192' },
        { pos: (0.5 + 255) / 256, align: 'right',  label: '255' }]);
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
  var updateHistogramTable = function() {
    var style = {
            width: '384px',
            height:'272px',
            background:'#bbb',
            padding:'8px' };
    updateFigureTable('#histoTable', 'histogram', updateHistogramAsync, style);
  };
  var toggleHistogram = defineDialog($('#histogram'), updateHistogramTable, toggleAnalysis);
  function changeWaveformType(type)
  {
    if (waveformType != type) {
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
    addTask({
      cmd:      'calcWaveform',
      type:     waveformType,
      index:    [img.index],
      histW:    Math.min(img.canvasWidth, 1024),
    });
  }
  function updateWaveform(type, img, histW, hist)
  {
    var w = img.canvasWidth;
    var h = img.canvasHeight;
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
      for (var x = 0; x < histW; ++x) {
        var max = histN[x] * h;
        if (type == 0) { // RGB
          var gOff = 256 * histW;
          var bOff = 512 * histW;
          for (var y = 0; y < 256; ++y) {
            var aR = 1 - Math.pow(1 - hist[x*256+y] / max, 200.0);
            var aG = 1 - Math.pow(1 - hist[x*256+gOff+y] / max, 200.0);
            var aB = 1 - Math.pow(1 - hist[x*256+bOff+y] / max, 200.0);
            var cR = Math.round(aR * 255);
            var cG = Math.round(aG * 255);
            var cB = Math.round(aB * 255);
            var off = ((255-y)*histW+x) * 4;
            bits.data[off + 0] = cR;
            bits.data[off + 1] = cG;
            bits.data[off + 2] = cB;
            bits.data[off + 3] = 255;
          }
        } else { // Luminance
          for (var y = 0; y < 256; ++y) {
            var a = 1 - Math.pow(1 - hist[x*256+y] / max, 200.0);
            var c = Math.round(a * 255);
            var off = ((255-y)*histW+x) * 4;
            bits.data[off + 0] = c;
            bits.data[off + 1] = c;
            bits.data[off + 2] = c;
            bits.data[off + 3] = 255;
          }
        }
      }
      context.putImageData(bits, 0, 0);
      return fig.canvas;
    }
  }
  var updateWaveformTable = function() {
    var style = {
            width: '320px',
            height:'256px',
            background:'#666',
            padding:'10px' };
    updateFigureTable('#waveTable', 'waveform', updateWaveformAsync, style);
  };
  var toggleWaveform = defineDialog($('#waveform'), updateWaveformTable, toggleAnalysis);
  var changeVectorscopeType = function(type) {
    if (vectorscopeType != type) {
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
    addTask({
      cmd:      'calcVectorscope',
      type:     vectorscopeType,
      index:    [img.index]
    });
  };
  var updateVectorscope = function(type, img, dist) {
    var w = img.canvasWidth;
    var h = img.canvasHeight;
    img.vectorscope = makeFigure(w, h, dist);
    updateVectorscopeTable();
    
    function makeFigure(w, h, dist) {
      var fig = makeBlankFigure(320, 320);
      var context = fig.context;
      var bits = context.createImageData(320, 320);
      var max = w * h;
      var i = 0, k = 0;
      for (var y = 0; y < 320; ++y) {
        for (var x = 0; x < 320; ++x, i++, k += 4) {
          var a = 1 - Math.pow(1 - dist[i] / max, 20000.0);
          var c = Math.round(a * 255);
          bits.data[k + 0] = c;
          bits.data[k + 1] = c;
          bits.data[k + 2] = c;
          bits.data[k + 3] = 255;
        }
      }
      context.putImageData(bits, 0, 0);
      var calcxy = function(r, g, b) {
        if (type == 0) { // Cb-Cr
          var cb = -0.14713 * r - 0.28886 * g + 0.436 * b;
          var cr = 0.615 * r - 0.51499 * g - 0.10001 * b;
          return { x: 159.5 + cb, y: 159.5 - cr };
        } else if (type == 1) { // G-B
          return { x: 32 + g, y: 287 - b };
        } else if (type == 2) { // G-R
          return { x: 32 + g, y: 287 - r };
        } else { // B-R
          return { x: 32 + b, y: 287 - r };
        }
      };
      var points = [
        { pos: calcxy(0,   0,   0  ) , color: '',     types: []        },
        { pos: calcxy(255, 0,   0  ) , color: '#f00', types: [0,2,3]   },
        { pos: calcxy(0,   255, 0  ) , color: '#0f0', types: [0,1,2]   },
        { pos: calcxy(0,   0,   255) , color: '#00f', types: [0,1,3]   },
        { pos: calcxy(0,   255, 255) , color: '#0ff', types: [0,1]   },
        { pos: calcxy(255, 0,   255) , color: '#f0f', types: [0,3]   },
        { pos: calcxy(255, 255, 0  ) , color: '#ff0', types: [0,2]   },
        { pos: calcxy(255, 255, 255) , color: '',     types: []      }
      ];
      var lines = [
        { indices: [0, 1, 0, 6, 0, 2, 0, 4, 0, 3, 0, 5], color: '#024', types: [0,1,2,3] },
        { indices: [1, 6, 6, 2, 2, 4, 4, 3, 3, 5, 5, 1], color: '#024', types: [0] },
        { indices: [4, 7, 5, 7, 6, 7], color: '#024', types: [1,2,3] }
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
      return fig.canvas;
    }
  };
  var updateVectorscopeTable = function() {
    var style = {
            width: '320px',
            height:'320px',
            background:'#444',
            padding:'10px' };
    updateFigureTable('#vectorscopeTable', 'vectorscope', updateVectorscopeAsync, style);
  };
  var toggleVectorscope = defineDialog($('#vectorscope'), updateVectorscopeTable, toggleAnalysis);
  var metricsToString = function(metrics, imgA) {
    if (typeof metrics == 'string') {
      return { psnr: metrics, mse: metrics, ncc: metrics, ae: metrics };
    } else {
      return {
        psnr:
            isNaN(metrics.psnr) ? '‐' :
            metrics.psnr == Infinity ? '∞ dB' :
            metrics.psnr.toFixed(2) + ' dB',
        mse:
            isNaN(metrics.mse) ? '‐' :
            metrics.mse.toPrecision(6),
        ncc:
            isNaN(metrics.ncc) ? '‐' :
            metrics.ncc.toFixed(6),
        ae:
            isNaN(metrics.ae) ? '‐' :
            addComma(metrics.ae) +
                ' (' + toPercent(metrics.ae/imgA.width/imgA.height) + ')',
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
      if (img.index == selectedIndex) {
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
    if (images.length == 0) {
      $('#metricsBaseName').append($('<td>').attr('rowspan', rowCount).text('no data'));
      return;
    }
    if (images.length == 1) {
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
      if (img.index == baseImageIndex) {
        continue;
      }
      var a = entries[baseImageIndex];
      var b = img;
      if (a.metrics[b.index] == null) {
        a.metrics[b.index] = 'calculating...';
        b.metrics[a.index] = 'calculating...';
        addTask({
          cmd:      'calcMetrics',
          index:    [a.index, b.index],
        });
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
      $('#mseValue').append($('<td>').text(values.mse));
      $('#nccValue').append($('<td>').text(values.ncc));
      $('#aeValue').append($('<td>').text(values.ae));
    }
  }
  var toggleMetrics = defineDialog($('#metrics'), updateMetricsTable, toggleAnalysis);

  var findImageIndexOtherThan = function(index) {
    for (var i = 0, img; img = images[i]; ++i) {
      if (img.index != index) {
        return img.index;
      }
    }
    return null;
  };
  var updateDiffTable = function() {
    $('#diffBaseName *').remove();
    $('#diffTargetName *').remove();
    $('#diffDimension').css({display:'none'});
    $('#diffDimensionReport *').remove();
    $('#diffDetectedMaxAE *').remove();
    $('#diffIgnoreAEResult *').remove();
    $('#diffResult *').remove();
    $('#diffSummary *').remove();
    $('#diffResizeToLarger').prop('checked', diffOptions.resizeToLarger);
    $('#diffResizeMethod').
      prop('value', diffOptions.resizeMethod).
      prop('disabled', !diffOptions.resizeToLarger).
      parent().css({opacity: !diffOptions.resizeToLarger ? '0.5' : ''});
    $('#diffIgnoreRemainder').
      prop('checked', diffOptions.ignoreRemainder).
      prop('disabled', diffOptions.resizeToLarger).
      parent().css({opacity: diffOptions.resizeToLarger ? '0.5' : ''});
    $('#diffIgnoreAE').val(diffOptions.ignoreAE);
    if (images.length < 2) {
      $('#diffBaseName').append($('<span>').text('no data'));
      $('#diffTargetName').append($('<span>').text('no data'));
      return;
    }
    baseImageIndex = baseImageIndex === null ? images[0].index : baseImageIndex;
    if (targetImageIndex === null || baseImageIndex == targetImageIndex) {
      targetImageIndex = findImageIndexOtherThan(baseImageIndex);
    }
    $('#diffBaseName').append(
      makeImageNameSelector(baseImageIndex, function(index) {
        baseImageIndex = index;
        if (baseImageIndex == targetImageIndex) {
          targetImageIndex = findImageIndexOtherThan(baseImageIndex);
        }
        updateDiffTable();
      })
    );
    $('#diffTargetName').append(
      makeImageNameSelector(targetImageIndex, function(index) {
        targetImageIndex = index;
        if (targetImageIndex == baseImageIndex) {
          baseImageIndex = findImageIndexOtherThan(targetImageIndex);
        }
        updateDiffTable();
      })
    );
    var a = entries[baseImageIndex];
    var b = entries[targetImageIndex];
    if (a.width == b.width && a.height == b.height) {
      $('#diffDimension').css({display:'none'});
    } else {
      $('#diffDimension').css({display:''});
      setText($('#diffDimensionReport'), {
        en: 'dimensions are different',
        ja: '画像サイズが異なります'
      });
    }
    if (diffResult.base != baseImageIndex || diffResult.target != targetImageIndex ||
        diffResult.ignoreAE != diffOptions.ignoreAE ||
        diffResult.ignoreRemainder != diffOptions.ignoreRemainder ||
        diffResult.resizeToLarger != diffOptions.resizeToLarger ||
        diffResult.resizeMethod != diffOptions.resizeMethod) {
      diffResult.base   = baseImageIndex;
      diffResult.target = targetImageIndex;
      diffResult.ignoreAE = diffOptions.ignoreAE;
      diffResult.ignoreRemainder = diffOptions.ignoreRemainder;
      diffResult.resizeToLarger = diffOptions.resizeToLarger;
      diffResult.resizeMethod = diffOptions.resizeMethod;
      diffResult.result  = null;
      discardTasksOfCommand('calcDiff');
      if (baseImageIndex != targetImageIndex) {
        addTask({
          cmd:      'calcDiff',
          index:    [a.index, b.index],
          options:  {
            ignoreAE:   diffOptions.ignoreAE,
            ignoreRemainder: diffOptions.ignoreRemainder,
            resizeToLarger: diffOptions.resizeToLarger,
            resizeMethod: diffOptions.resizeMethod,
          },
        });
      }
    }
    var cellStyle = {
        width: '790px',
        height: '422px',
        textAlign: 'center',
    };
    var style = {
        maxWidth: '768px',
        maxHeight: '400px',
        background:'#000',
        padding:'8px'
    };
    if (diffResult.result == null) {
      $('#diffResult').append(makeBlankFigure(8,8).canvas).css(cellStyle);
      setText($('#diffSummary'), {
        en: 'calculating...',
        ja: '計算中...'
      });
    } else {
      if (diffResult.result.summary.maxAE != 0) {
        var e = diffResult.result.summary.maxAE;
        setText($('#diffDetectedMaxAE'), {
          en: 'detected maximum error value: ' + e,
          ja: '検出した最大誤差: ' + e
        });
      }
      if (diffOptions.ignoreAE != 0) {
        var rate = diffResult.result.summary.countIgnoreAE / diffResult.result.summary.total;
        var percent = toPercent(rate);
        setText($('#diffIgnoreAEResult'), {
          en: percent + ' unmatched pixels ignored',
          ja: percent + ' の不一致を無視しました'
        });
      }
      var w = diffResult.result.image.width;
      var h = diffResult.result.image.height;
      var fig = makeBlankFigure(w, h);
      var bits = fig.context.createImageData(w, h);
      copyImageBits(diffResult.result.image, bits);
      fig.context.putImageData(bits, 0, 0);
      $('#diffResult').append($(fig.canvas).css(style)).css(cellStyle);
      if (diffResult.result.summary.unmatch == 0) {
        setText($('#diffSummary'), {
          en: 'Perfect match',
          ja: '完全に一致しました'
        });
      } else {
        var matchRate = diffResult.result.summary.match / diffResult.result.summary.total;
        var percent = toPercent(matchRate);
        setText($('#diffSummary'), {
          en: percent + ' pixels are match',
          ja: percent + ' のピクセルが一致しました'
        });
      }
    }
  };
  var toggleDiff = defineDialog($('#diff'), updateDiffTable, toggleAnalysis);

  function updateDOM()
  {
    images = entries.filter(function(ent,i,a) { return ent.ready(); });
    for (var i = 0, ent; ent = entries[i]; i++)
    {
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
        if (ent.element && 0 == ent.view.find('.image').length) {
          ent.view.prepend(ent.element);
        }
        if (ent.error) {
          ent.view.addClass('error');
          ent.visible = false;
        }
        if (!ent.button) {
          ent.button = $('<button/>').addClass('selector').
            text(i + 1).
            append(
              setText($('<span class="tooltip"/>'), {
                en: 'Select picture ',
                ja: '画像を選択 '
              })).
            click({index : i}, function(e) { toggleSingleView(e.data.index + 1); });
          if (i < 9) {
            $(ent.button).find('span.tooltip span').addClass('keys flat').
              append(
                $('<span/>').text(i + 1)
                );
          }
          $('#overlay').before(ent.button);
        }
    }
    resetMouseDrag();
    updateLayout();
  }

  function resetMouseDrag()
  {
    dragLastPoint = null;
  }
  var setViewOffset = function(x, y) {
    viewOffset.x = Math.min(1, Math.max(0, x));
    viewOffset.y = Math.min(1, Math.max(0, y));
  };
  var addViewOffset = function(dx, dy) {
    setViewOffset(viewOffset.x + dx, viewOffset.y + dy);
  };
  function moveImageByPx(index, dx, dy)
  {
    if (!entries[index].ready()) {
      return;
    }
    if (1.0 < scale) {
      var x = dx / (entries[index].baseWidth * scale);
      var y = dy / (entries[index].baseHeight * scale);
      addViewOffset(-x / (1.0 - 1.0 / scale), -y / (1.0 - 1.0 / scale));
    }
  }
  function zoomWithTarget(index, x, y)
  {
    if (viewZoom + ZOOM_STEP_DBLCLK < MAX_ZOOM_LEVEL) {
      setViewOffset(x, y);
      zoomRelative(+ZOOM_STEP_DBLCLK);
    } else {
      viewZoom = 0;
      updateTransform();
    }
  }

  function updateLayout()
  {
    isSingleView =
            currentImageIndex != 0 &&
            currentImageIndex <= entries.length;
    if (!isSingleView && overlayMode) {
      overlayMode = false;
    }
    if (layoutMode == null) {
      layoutMode = $('#view').width() < $('#view').height() ? 'y' : 'x';
    }
    $('#view').css({ flexDirection : layoutMode == 'x' ? 'row' : 'column' });
    $('#arrange img').attr('src', layoutMode == 'x' ? 'res/layout_x.svg' : 'res/layout_y.svg');
    var numVisibleEntries = entries.filter(function(ent,i,a) { return ent.visible; }).length;
    var numSlots = isSingleView ? 1 : Math.max(numVisibleEntries, 2);
    var numColumns = layoutMode == 'x' ? numSlots : 1;
    var numRows    = layoutMode != 'x' ? numSlots : 1;
    var boxW = $('#view').width() / numColumns;
    var boxH = $('#view').height() / numRows;
    var MARGIN = 6, MIN_SIZE = 32;
    boxW = Math.max(boxW - MARGIN, Math.min(boxW, MIN_SIZE));
    boxH = Math.max(boxH - MARGIN, Math.min(boxH, MIN_SIZE));
    $('#view > div.imageBox').each(function(index) {
      var hide = isSingleView && index + 1 != currentImageIndex && (!overlayMode || index != images[0].index);
      var img = entries[index];
      if (hide || !img || !img.visible) {
        $(this).css({ display : 'none' });
      } else {
        var isOverlay = isSingleView && index + 1 == currentImageIndex && overlayMode && index != images[0].index;
        if (img.element) {
          img.boxW = boxW;
          img.boxH = boxH;
          img.isLetterBox = boxW * img.height < boxH * img.width;
          img.baseWidth = img.isLetterBox ? boxW : boxH * img.width / img.height;
          img.baseHeight = img.isLetterBox ? boxW * img.height / img.width : boxH;
          var w = img.baseWidth, h = img.baseHeight;
          if (img.transposed) {
            var temp = w; w = h; h = temp;
          }
          $(img.element).css({ width: w+'px', height: h+'px' });
          if (enableGrid) {
            addGrid(img);
          } else {
            removeGrid(img);
          }
          if (img.grid) {
            $(img.grid).css({ width: w+'px', height: h+'px' });
          }
        }
        $(this).css({
          display   : '',
          position  : overlayMode ? 'absolute' : '',
          width     : overlayMode ? $('#view').width() + 'px' : '',
          opacity   : isOverlay ? '0.5' : '',
          background : overlayMode ? '#000' : '',
        });
      }
    });
    $('#view > div.emptyBox').each(function(index) {
      var hide = isSingleView || numVisibleEntries + index >= numSlots;
      $(this).css({ display : (hide ? 'none' : '') });
    });
    if (overlayMode) {
      var baseIndex = images[0].index + 1;
      var modeDesc =
          ((isSingleView && baseIndex < currentImageIndex)
            ? baseIndex + ' + ' + currentImageIndex : baseIndex + ' only');
      setText($('#mode'), {
        en: 'OVERLAY MODE : ' + modeDesc,
        ja: 'オーバーレイモード : ' + modeDesc });
      $('#mode').css({ display : 'block' });
    } else {
      $('#mode *').text('');
      $('#mode').css({ display : '' });
    }
    $('#map').css({ display : (enableMap && images.length) ? 'block' : '' });
    if (isSingleView) {
      $('.selector').removeClass('current').eq(currentImageIndex - 1).addClass('current');
      if (overlayMode) {
        $('.selector').eq(images[0].index).addClass('current');
      }
    } else {
      $('.selector').removeClass('current');
    }
    $('.selector').each(function(index) {
      if (index < entries.length && !entries[index].visible) {
        $(this).css({ display : 'none' });
      }
    });
    overlayMode ? $('#overlay').addClass('current') : $('#overlay').removeClass('current');
    updateTransform();
    adjustDialogPosition();
  }
  
  function updateTransform() {
    var scalePercent = Math.round(Math.pow(2.0, viewZoom) * 100);
    scale = scalePercent / 100;
    var commonOffsetX = (0.5 - viewOffset.x) * (1.0 - 1.0 / scale);
    var commonOffsetY = (0.5 - viewOffset.y) * (1.0 - 1.0 / scale);
    for (var i = 0, ent; ent = entries[i]; i++) {
      if (ent.element) {
        var offsetX = commonOffsetX * ent.baseWidth;
        var offsetY = commonOffsetY * ent.baseHeight;
        style = {
          left        : '50%',
          top         : '50%',
          transform   : 'translate(-50%, -50%) ' +
                        'scale(' + scale + ') ' +
                        'translate(' + offsetX + 'px, ' + offsetY + 'px)' +
                        ent.orientationAsCSS,
        };
        $(ent.element).css(style);
        if (ent.grid) {
          $(ent.grid).css(style);
          var base = 0.5 * ent.width / ent.baseWidth / scale;
          var strokeWidth = [
              (base > 0.5 ? 1 : base > 0.1 ? 3.5 - base * 5 : 3) * base,
              (base > 0.5 ? 0 : 1) * base];
          var opacity = [
              0.6,
              base > 0.5 ? 0 : base > 0.1 ? (0.6 - base) / 0.5 : 1];
          $(ent.grid).find('path').each(function(index) {
            $(this).
                attr('stroke-width', strokeWidth[index]).
                attr('opacity', opacity[index]);
          });
        }
      }
    }
    if (enableMap && images.length) {
      var index = isSingleView ? currentImageIndex - 1 : 0;
      var img = entries[index].ready() ? entries[index] : images[0];
      var roiW = img.boxW / img.baseWidth / scale;
      var roiH = img.boxH / img.baseHeight / scale;
      $('#mapROI').attr({
        x : 100 * (0.5 + (viewOffset.x - 0.5) * (1-1/scale) - 0.5 * roiW) + '%',
        y : 100 * (0.5 + (viewOffset.y - 0.5) * (1-1/scale) - 0.5 * roiH) + '%',
        width : (100 * roiW)+'%',
        height : (100 * roiH)+'%',
      });
      var s = 120 / Math.max(img.width, img.height);
      var w = img.width * s;
      var h = img.height * s;
      $('#map svg').width(w).height(h);
      $('#map').width(w).height(h);
    }
  }

  function addFile(file)
  {
      var entry = {
            index           : entries.length,
            name            : file.name,
            size            : file.size,
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
            metrics     : [],
            loading     : true,
            progress    : 0,
            error       : null,
            visible     : true,
            
            ready   : function() { return null != this.element; },
      };
      entries.push(entry);
      loading.push(entry);
      {
        var reader = new FileReader();
        reader.onprogress = (function(theEntry)
        {
          return function(e) {
            if (e.lengthComputable && 0 < e.total) {
              theEntry.progress = Math.round(e.loaded * 100 / e.total);
            }
            updateNowLoading();
          };
        })(entry);
        var onError = function(entry, message) {
          entry.loading = false;
          entry.error = message;
          
          updateDOM();
          updateNowLoading();
        };
        
        reader.onload = (function(theEntry, theFile)
        {
            return function(e)
            {
                var binary = compareUtil.binaryFromDataURI(e.target.result)
                var format = compareUtil.detectImageFormat(binary);
                var isPNG  = format && 0 <= format.indexOf('PNG');
                var isJPEG = format && 0 <= format.indexOf('JPEG');
                if (isJPEG) {
                  theEntry.orientation = compareUtil.detectExifOrientation(binary);
                }
                var img = new Image;
                $(img).on('load', function()
                  {
                    var w = img.naturalWidth;
                    var h = img.naturalHeight;
                    if (format == 'SVG' && (w == 0 && h == 0)) {
                      w = 150;
                      h = 150;
                      theEntry.sizeUnknown = true;
                    }
                    var fig = makeBlankFigure(w, h);
                    fig.context.drawImage(img, 0, 0, w, h);
                    //
                    if (NEEDS_IOS_EXIF_WORKAROUND && isJPEG) {
                      theEntry.element    = fig.canvas;
                    } else {
                      theEntry.element    = img;
                    }
                    $(theEntry.element).addClass('image');
                    theEntry.asCanvas   = fig.canvas;
                    theEntry.width      = w;
                    theEntry.height     = h;
                    theEntry.canvasWidth   = w;
                    theEntry.canvasHeight  = h;
                    theEntry.format     = format || (theFile.type ? '('+theFile.type+')' : '(unknown)');
                    theEntry.loading    = false;
                    theEntry.progress   = 100;
                    
                    applyExifOrientation(theEntry);
                    updateDOM();
                    updateNowLoading();
                  }).
                  on('error', function()
                  {
                    var message = 'Failed.';
                    if (!theFile.type || !(/^image\/.+$/.test(theFile.type))) {
                      message += ' Maybe not an image file.';
                    } else if (!isPNG && !isJPEG && format != 'GIF' && format != 'BMP') {
                      message += ' Maybe unsupported format for the browser.';
                    }
                    onError(theEntry, message);
                  });
                img.src = e.target.result;
            };
        })(entry, file);
        reader.onerror = (function(theEntry, theFile, theReader)
        {
          return function(e) {
            onError(theEntry,
                'Failed. File could not be read. (' + theReader.error.name + ')');
          };
        })(entry, file, reader);
        reader.readAsDataURL(file);
      }
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
    updateNowLoading();
  }

  function toggleFullscreen()
  {
    resetMouseDrag();
    compareUtil.toggleFullscreen($('#viewroot').get(0));
  }
