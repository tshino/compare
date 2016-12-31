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
  
  $(window).resize(updateLayout);
  $(window).keydown(function(e)
    {
      if (e.ctrlKey || e.altKey || e.metaKey)
      {
        return true;
      }
      if (dialog)
      {
        // ESC (27), BS (8)
        if ((e.keyCode == 27 || e.keyCode == 8) && !e.shiftKey) {
          dialog.close();
          return false;
        // '1'
        } else if ((e.keyCode == 48 + 1 || e.keyCode == 96 + 1) && !e.shiftKey) {
          $(dialog.element).find('.mode-sw > button:nth-child(1)').click();
          return false;
        // '2'
        } else if ((e.keyCode == 48 + 2 || e.keyCode == 96 + 2) && !e.shiftKey) {
          $(dialog.element).find('.mode-sw > button:nth-child(2)').click();
          return false;
        }
        return true;
      }
      // '0' - '9' (48-57 or 96-105 for numpad)
      if ((48 <= e.keyCode && e.keyCode <= 57 && !e.shiftKey) ||
          (96 <= e.keyCode && e.keyCode <= 105 && !e.shiftKey))
      {
        currentImageIndex = e.keyCode % 48;
        updateLayout();
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
        viewOffset.x += x * 0.4 / scale;
        viewOffset.y += y * 0.4 / scale;
        viewOffset.x = Math.min(1, Math.max(0, viewOffset.x));
        viewOffset.y = Math.min(1, Math.max(0, viewOffset.y));
        updateTransform();
        return false;
      }
      // ESC (27)
      if (e.keyCode == 27 && !e.shiftKey)
      {
        currentImageIndex = 0;
        viewZoom = 0;
        viewOffset.x = 0.5;
        viewOffset.y = 0.5;
        overlayMode = false;
        resetMouseDrag();
        updateLayout();
        return false;
      }
      //alert(e.keyCode);
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
    // 'm' (109)
    109 : { global: true, func: toggleMetrics },
    // 'i' (105)
    105 : { global: true, func: toggleInfo },
    // 'a' (97)
    97 : { global: false, func: arrangeLayout },
    // 'o' (111)
    111: { global: false, func: toggleOverlay },
    // 'n' (110)
    110 : { global: false, func: toggleMap },
  };
  $(window).keypress(function(e) {
    if (e.altKey || e.metaKey) {
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
    //alert(e.which);
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
  var viewZoom = 0;
  var scale = 1.0;
  var viewOffset = { x : 0.5, y : 0.5 };
  var layoutMode = 'x';
  var overlayMode = false;
  var enableMap = false;
  var dragLastPoint = null;
  var touchState = null;
  var dialog = null;
  var histogramType = 0;
  var waveformType = 0;
  var baseImageIndex = 0;

  var toggleLang = function() {
    var lang = $(document.body).attr('class') == 'ja' ? 'en' : 'ja';
    $('#selectLang').val(lang);
    changeLang(lang);
  };
  var setText = function(target, text) {
    $(target).find('.en').text(text.en);
    $(target).find('.ja').text(text.ja);
  };
  function addComma(num)
  {
    return String(num).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
  }
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
    viewZoom = Math.max(0, Math.min(MAX_ZOOM_LEVEL, viewZoom + delta));
    updateTransform();
  };
  var zoomIn = function() {
    zoomRelative(+ZOOM_STEP_KEY);
  };
  var zoomOut = function() {
    zoomRelative(-ZOOM_STEP_KEY);
  };
  function arrangeLayout()
  {
    var isSingleView =
            currentImageIndex != 0 &&
            currentImageIndex <= entries.length;
    if (isSingleView) {
      currentImageIndex = 0;
    } else if (layoutMode == 'x') {
      layoutMode = 'y';
    } else {
      layoutMode = 'x';
    }
    $('#view').css({ flexDirection : layoutMode == 'x' ? 'row' : 'column' });
    $('#arrange img').attr('src', layoutMode == 'x' ? 'res/layout_x.svg' : 'res/layout_y.svg');
    updateLayout();
  }
  function toggleOverlay()
  {
    if (!overlayMode && 2 <= entries.length) {
      if (currentImageIndex <= 1 || entries.length < currentImageIndex) {
        currentImageIndex = Math.min(2, entries.length);
      }
      overlayMode = true;
      updateLayout();
    } else if (overlayMode) {
      currentImageIndex = 1;
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
  var defineDialog = function(target, update, parent) {
    target.on('click', parent || hideDialog);
    target.children().on('click', function(e) { e.stopPropagation(); return true; });
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
  var toggleInfo = defineDialog($('#info'), updateInfoTable);
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
      setText('#loadingStatus',
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
      var context = img.asCanvas.getContext('2d');
      var imageData = context.getImageData(0, 0, w, h);
      // avoid huge memory consumption
      if (w * h <= 30 * 1024 * 1024) {
        img.imageData = imageData;
      }
      return imageData;
    }
    return img.imageData;
  }
  function makeBlankFigure(w, h)
  {
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var context = canvas.getContext('2d');
    return { canvas: canvas, context: context };
  }
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
  
  var worker = compareUtil.newWorker('compare-worker.js');
  var taskCount = 0;
  var taskQueue = [];
  worker.addEventListener('message', function(e) {
    var data = e.data;
    switch (data.cmd) {
    case 'calcHistogram':
      if (data.type == histogramType) {
        var img = entries[data.index];
        updateHistogram(data.type, img, data.result);
      }
      break;
    case 'calcWaveform':
      if (data.type == waveformType) {
        var img = entries[data.index];
        updateWaveform(data.type, img, data.histW, data.result);
      }
      break;
    case 'calcMetrics':
      entries[data.index[0]].metrics[data.index[1]] = data.result;
      entries[data.index[1]].metrics[data.index[0]] = data.result;
      updateMetricsTable();
      break;
    }
    --taskCount;
    window.setTimeout(kickNextTask, 0);
  }, false);
  function kickNextTask()
  {
    if (taskCount == 0 && 0 < taskQueue.length) {
      var task = taskQueue.shift();
      switch (task.cmd) {
      case 'calcHistogram':
      case 'calcWaveform':
        task.imageData = getImageData(entries[task.index]);
        worker.postMessage(task);
        break;
      case 'calcMetrics':
        task.imageData1 = getImageData(entries[task.index[0]]);
        task.imageData2 = getImageData(entries[task.index[1]]);
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
  function discardTasksOfCommand(cmd)
  {
    taskQueue = taskQueue.filter(function(task,i,a) { return task.cmd != cmd; });
  }
  
  function updateHistogramAsync(img)
  {
    addTask({
      cmd:      'calcHistogram',
      type:     histogramType,
      index:    img.index,
    });
  }
  function updateHistogram(type, img, hist)
  {
    img.histogram = makeFigure(type, hist);
    updateHistogramTable();
    
    function makeFigure(type, hist)
    {
      var fig = makeBlankFigure(1024, 512);
      var context = fig.context;
      var max = 0;
      for (var i = 0; i < hist.length; ++i) {
        max = Math.max(max, hist[i]);
      }
      context.fillStyle = '#222';
      context.fillRect(0,0,1024,512);
      if (type == 0) { // RGB
        context.globalCompositeOperation = 'lighter';
        drawHistogram('#f00', 0);
        drawHistogram('#0f0', 256);
        drawHistogram('#00f', 512);
      } else { // Luminance
        drawHistogram('#fff', 0);
      }
      return fig.canvas;
      
      function drawHistogram(color, offset) {
        context.fillStyle = color;
        for (var i = 0; i < 256; ++i) {
          var h = 512 * hist[i + offset] / max;
          context.fillRect(i*4, 512-h, 4, h);
        }
      }
    }
  }
  function updateHistogramTable()
  {
    $('#histoTable td').remove();
    for (var k = 0, img; img = images[k]; k++) {
      if (!img.histogram) {
        img.histogram = makeBlankFigure(8, 8).canvas;
        updateHistogramAsync(img);
      }
      $('#histoName').append(makeImageNameWithIndex('<td>', img));
      $('#histograms').append(
        $('<td>').append(
          $(img.histogram).css({
            width: '320px',
            height:'256px',
            background:'#aaa',
            padding:'10px'
          })
        )
      );
    }
    if (k == 0) {
      $('#histoName').append(
        $('<td rowspan="2">').text('no data')
      );
    }
  }
  var toggleAnalysis = defineDialog($('#analysis'));
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
      index:    img.index,
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
  function updateWaveformTable()
  {
    $('#waveTable td').remove();
    for (var k = 0, img; img = images[k]; k++) {
      if (!img.waveform) {
        img.waveform = makeBlankFigure(8, 8).canvas;
        updateWaveformAsync(img);
      }
      $('#waveName').append(makeImageNameWithIndex('<td>', img));
      $('#waveforms').append(
        $('<td>').append(
          $(img.waveform).css({
            width: '320px',
            height:'256px',
            background:'#666',
            padding:'10px'
          })
        )
      );
    }
    if (k == 0) {
      $('#waveName').append(
        $('<td rowspan="2">').text('no data')
      );
    }
  }
  var toggleWaveform = defineDialog($('#waveform'), updateWaveformTable, toggleAnalysis);
  var metricsToString = function(metrics) {
    if (typeof metrics == 'string') {
      return { psnr: metrics, mse: metrics, ncc: metrics };
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
      };
    }
  };
  function updateMetricsTable()
  {
    $('#metricsTable td:not(.prop)').remove();
    var select = $('<select>').on('change', function(e) {
      baseImageIndex = parseInt(this.options[this.selectedIndex].value);
      updateMetricsTable();
      return false;
    });
    if (images.length == 0) {
      $('#metricsBaseName').append($('<td rowspan="5">').text('no data'));
      return;
    }
    if (images.length == 1) {
      $('#metricsTargetName').append($('<td rowspan="4">').text('no data'));
    }
    $('#metricsBaseName').append(
      $('<td>').attr('colspan', images.length - 1).append(
        $('<span class="imageIndex"/>').text(images[baseImageIndex].index + 1),
        select
      )
    );
    for (var k = 0; k < images.length; k++) {
      var baseOption = $('<option>').text(images[k].name).attr('value', k);
      select.append(baseOption);
      if (k == baseImageIndex) {
        baseOption.attr('selected','');
        continue;
      }
      var a = images[baseImageIndex];
      var b = images[k];
      if (a.metrics[b.index] == null) {
        a.metrics[b.index] = 'calculating...';
        b.metrics[a.index] = 'calculating...';
        addTask({
          cmd:      'calcMetrics',
          index:    [a.index, b.index],
        });
      }
      $('#metricsTargetName').append(makeImageNameWithIndex('<td>', b));
      var values = metricsToString(a.metrics[b.index]);
      $('#psnrValue').append($('<td>').text(values.psnr));
      $('#mseValue').append($('<td>').text(values.mse));
      $('#nccValue').append($('<td>').text(values.ncc));
    }
  }
  var toggleMetrics = defineDialog($('#metrics'), updateMetricsTable, toggleAnalysis);

  function updateDOM()
  {
    images = entries.filter(function(ent,i,a) { return ent.ready(); });
    for (var i = 0, ent; ent = entries[i]; i++)
    {
        if (!ent.view) {
          ent.view = $('<div class="imageBox"/>').append(
            makeImageNameWithIndex('<span class="imageName">', ent).
              click({index : i}, function(e) {
                currentImageIndex = currentImageIndex == 0 ? e.data.index + 1 : 0;
                updateLayout();
              })
          );
          $('#drop').before(ent.view);
        }
        if (ent.element && 0 == ent.view.find('.image').length) {
          ent.view.prepend(ent.element);
        }
        if (ent.error) {
          ent.view.addClass('error');
        }
        if (!ent.button) {
          ent.button = $('<button/>').addClass('selector').
            text(''+(i + 1)).
            append(
              $('<span/>').addClass('tooltip en').text('Select picture ')
            ).
            append(
              $('<span/>').addClass('tooltip ja').text('画像を選択 ')
            ).
            click({index : i}, function(e)
            {
              currentImageIndex = e.data.index + 1;
              updateLayout();
            });
          if (i < 9) {
            $(ent.button).find('span.tooltip').addClass('keys').
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
  function moveImageByPx(index, dx, dy)
  {
    if (!entries[index].ready()) {
      return;
    }
    var x = dx / (entries[index].baseWidth * scale);
    var y = dy / (entries[index].baseHeight * scale);
    if (1.0 < scale)
    {
      viewOffset.x -= x / (1.0 - 1.0 / scale);
      viewOffset.y -= y / (1.0 - 1.0 / scale);
    }
    viewOffset.x = Math.min(1, Math.max(0, viewOffset.x));
    viewOffset.y = Math.min(1, Math.max(0, viewOffset.y));
  }
  function zoomWithTarget(index, x, y)
  {
    if (viewZoom + ZOOM_STEP_DBLCLK < MAX_ZOOM_LEVEL) {
      viewOffset.x = Math.min(1, Math.max(0, x));
      viewOffset.y = Math.min(1, Math.max(0, y));
      zoomRelative(+ZOOM_STEP_DBLCLK);
    } else {
      viewZoom = 0;
      updateTransform();
    }
  }

  function updateLayout()
  {
    var isSingleView =
            currentImageIndex != 0 &&
            currentImageIndex <= entries.length;
    if (!isSingleView && overlayMode) {
      overlayMode = false;
    }
    var numSlots = isSingleView ? 1 : Math.max(entries.length, 2);
    var numColumns = layoutMode == 'x' ? numSlots : 1;
    var numRows    = layoutMode != 'x' ? numSlots : 1;
    var boxW = $('#view').width() / numColumns;
    var boxH = $('#view').height() / numRows;
    $('#view > div.imageBox').each(function(index) {
      var hide = isSingleView && index + 1 != currentImageIndex && (index != 0 || !overlayMode);
      if (hide) {
        $(this).css({ display : 'none' });
      } else {
        var img = entries[index];
        var isOverlay = isSingleView && index + 1 == currentImageIndex && index != 0 && overlayMode;
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
      var hide = index >= (isSingleView ? 0 : numSlots - entries.length);
      $(this).css({ display : (hide ? 'none' : '') });
    });
    if (overlayMode) {
      var modeDesc =
          ((isSingleView && 1 < currentImageIndex)
            ? '1 + ' + currentImageIndex : '1 only');
      setText('#mode', {
        en: 'OVERLAY MODE : ' + modeDesc,
        ja: 'オーバーレイモード : ' + modeDesc });
      $('#mode').css({ display : 'block' });
    } else {
      $('#mode *').text('');
      $('#mode').css({ display : '' });
    }
    $('#map').css({ display : (enableMap && images.length) ? 'block' : '' });
    if (isSingleView) {
      $('.selector').removeClass('disabled').eq(currentImageIndex - 1).addClass('disabled');
    } else {
      $('.selector').removeClass('disabled');
    }
    $('#overlay').css({ display : 2 <= entries.length ? '' : 'none' });
    updateTransform();
  }
  
  function updateTransform() {
    var isSingleView =
            currentImageIndex != 0 &&
            currentImageIndex <= entries.length;
    var scalePercent = Math.round(Math.pow(2.0, viewZoom) * 100);
    scale = scalePercent / 100;
    var commonOffsetX = (0.5 - viewOffset.x) * (1.0 - 1.0 / scale);
    var commonOffsetY = (0.5 - viewOffset.y) * (1.0 - 1.0 / scale);
    for (var i = 0, ent; ent = entries[i]; i++) {
      if (ent.element) {
        var offsetX = commonOffsetX * ent.baseWidth;
        var offsetY = commonOffsetY * ent.baseHeight;
        $(ent.element).css({
          left        : '50%',
          top         : '50%',
          transform   : 'translate(-50%, -50%) ' +
                        'scale(' + scale + ') ' +
                        'translate(' + offsetX + 'px, ' + offsetY + 'px)' +
                        ent.orientationAsCSS,
        });
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
            metrics     : [],
            loading     : true,
            progress    : 0,
            error       : null,
            
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
                    theEntry.loading = false;
                    theEntry.error = 'Failed.';
                    if (!theFile.type || !(/^image\/.+$/.test(theFile.type))) {
                      theEntry.error += ' Maybe not an image file.';
                    } else if (!isPNG && !isJPEG && format != 'GIF' && format != 'BMP') {
                      theEntry.error += ' Maybe unsupported format for the browser.';
                    }
                    
                    updateDOM();
                    updateNowLoading();
                  });
                img.src = e.target.result;
            };
        })(entry, file);
        reader.onerror = (function(theEntry, theFile, theReader)
        {
          return function(e) {
            theEntry.loading = false;
            theEntry.error = 'Failed. File could not be read. (' + theReader.error.name + ')';
            
            updateDOM();
            updateNowLoading();
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
