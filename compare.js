﻿var MAX_ZOOM_LEVEL    = 6.0;
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
  
  // Setup the dnd listeners.
  var dropZone = document.body;
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('drop', handleFileSelect, false);
  
  $('#file').on('change', function(e) {
    addFiles(e.target.files);
    e.target.value = null;
  });
  $('#view .dropHere').
    text("Drop image files here").
    click(function() {
      $('#file').click();
    });
  $('#histogramType > *').click(function()
  {
    var index = $('#histogramType > *').index(this);
    changeHistogramType(index);
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
        // ESC (27), ENTER (13)
        if ((e.keyCode == 27 || e.keyCode == 13) && !e.shiftKey) {
          hideDialog();
          return false;
        } else {
          return true;
        }
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
  $(window).keypress(function(e)
  {
    if (e.altKey || e.metaKey) {
      return true;
    }
    // '?' (63)
    if (e.which == 63) {
      toggleHelp();
      return false;
    }
    // 'f' (102)
    if (e.which == 102) {
      resetMouseDrag();
      toggleFullscreen();
      return false;
    }
    // 'h' (104)
    if (e.which == 104) {
      toggleHistogram();
      return false;
    }
    // 'w' (119)
    if (e.which == 119) {
      toggleWaveform();
      return false;
    }
    // 'i' (105)
    if (e.which == 105) {
      toggleInfo();
      return false;
    }
    if (dialog) {
      return true;
    }
    // 'a' (97)
    if (e.which == 97) {
      arrangeLayout();
      return false;
    }
    // 'o' (111)
    if (e.which == 111) {
      toggleOverlay();
      return false;
    }
    //alert(e.which);
  });
  
  $('#view').on("wheel", function(e)
  {
    var event = e.originalEvent;
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey)
    {
        return true;
    }
    var deltaScale = event.deltaMode == 0 ? /* PIXEL */ 0.1 : /* LINE */ 1.0;
    var steps = Math.max(-3, Math.min(3, event.deltaY * deltaScale));
    if (steps != 0)
    {
        viewZoom = Math.max(0, Math.min(MAX_ZOOM_LEVEL, viewZoom - steps * ZOOM_STEP_WHEEL));
        updateTransform();
        return false;
    }
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
  var dragLastPoint = null;
  var touchState = null;
  var dialog = null;
  var histogramType = 0;

  function escapeHtml(str)
  {
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    str = str.replace(/"/g, '&quot;');
    str = str.replace(/'/g, '&#39;');
    return str;
  }
  function addComma(num)
  {
    return String(num).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
  }
  function calcAspectRatio(w, h)
  {
    var m = w > h ? w : h, n = w > h ? h : w;
    while (n > 0) {
      var r = m % n;
      m = n;
      n = r;
    }
    var gcd = m;
    var ratio = (w/gcd) / (h/gcd);  // use gcd to avoid comparison error
    var result = addComma(w / gcd) + ':' + addComma(h / gcd);
    if (w / gcd <= 50 || h / gcd <= 50) {
      return [ratio, result];
    } else {
      for (var i = 1; i <= 10; ++i) {
        var a = w / h * i;
        var b = Math.floor(a + 0.5);
        if (Math.max(b - a, a - b) < Math.min(i,b) * 0.004) {
          return [ratio, result + '\n(approx. ' + addComma(b) + ':' + i + ')'];
        }
        var c = h / w * i;
        var d = Math.floor(c + 0.5);
        if (Math.max(d - c, c - d) < Math.min(i,d) * 0.004) {
          return [ratio, result + '\n(approx. ' + i + ':' + addComma(d) + ')'];
        }
      }
      return [ratio, result];
    }
  }
  function orientationToString(orientation) {
    return (
      !orientation ? '‐' :
      orientation == 0 ? 'Undefined' :
      orientation == 1 ? 'TopLeft' :
      orientation == 2 ? 'TopRight' :
      orientation == 3 ? 'BottomRight' :
      orientation == 4 ? 'BottomLeft' :
      orientation == 5 ? 'LeftTop' :
      orientation == 6 ? 'RightTop' :
      orientation == 7 ? 'RightBottom' :
      orientation == 8 ? 'LeftBottom' : 'Invalid'
    );
  }
  function binaryFromDataURI(dataURI) {
    var offset = dataURI.indexOf(',') + 1;
    var isBase64 = 0 <= dataURI.slice(0, offset - 1).indexOf(';base64');
    var binary = null;
    var len;
    if (isBase64) {
      len = (dataURI.length - offset) / 4 * 3;
      if (3 <= len) {
        len = len - 3 +
            atob(dataURI.slice(dataURI.length - 4, dataURI.length)).length;
      }
    } else {
      binary = decodeURIComponent(dataURI.slice(offset));
      len = binary.length;
    }
    var read = function(addr) {
      if (addr >= len) {
        return null;
      }
      if (isBase64) {
        var mod = addr % 3;
        var pos = (addr - mod) / 3 * 4;
        var bytes = atob(dataURI.slice(offset + pos, offset + pos + 4));
        var ret = bytes.charCodeAt(mod);
        return ret;
      } else {
        return binary.charCodeAt(addr);
      }
    };
    var readBig16    = function (addr) { return read(addr) * 256 + read(addr + 1); };
    var readLittle16 = function (addr) { return read(addr) + read(addr + 1) * 256; };
    var readBig32    = function (addr) { return readBig16(addr) * 65536 + readBig16(addr + 2); };
    return {
      length    : len,
      at        : read,
      big16     : readBig16,
      little16  : readLittle16,
      big32     : readBig32,
    };
  }
  function detectImageFormat(binary)
  {
    var magic = binary.length < 4 ? 0 : binary.big32(0);
    var magic2 = binary.length < 8 ? 0 : binary.big32(4);
    if (magic == 0x89504e47) { return 'PNG'; }
    if (magic == 0x47494638) { return 'GIF'; }
    if ((magic & 0xffff0000) == 0x424d0000) { return 'BMP'; }
    if ((magic - (magic & 255)) == 0xffd8ff00) { return 'JPEG'; }
    if (magic == 0x4d4d002a || magic == 0x49492a00) { return 'TIFF'; }
    if ((magic  == 0xefbbbf3c /* BOM + '<' */ && magic2 == 0x3f786d6c /* '?xml' */) ||
        (magic == 0x3c3f786d /* '<?xm' */ && (magic2 & 0xff000000) == 0x6c000000 /* 'l' */)) {
        // XML
        var i = 4;
        for (var x; x = binary.at(i); ++i) {
          if (x == 0x3c /* '<' */) { break; }
        }
        var sig1 = binary.length < i + 4 ? 0 : binary.big32(i);
        if (sig1 == 0x3c737667 /* <svg */) {
          return 'SVG';
        }
    }
    //alert(magic);
    return null;
  }
  function detectExifOrientation(binary)
  {
    for (var p = 0; p + 4 <= binary.length; ) {
      var m = binary.big16(p);
      if (m == 0xffda /* SOS */) { break; }
      if (m == 0xffe1 /* APP1 */) {
        if (p + 20 > binary.length) { break; }
        var big = binary.big16(p + 10) == 0x4d4d; /* MM */
        var read16 = big ? binary.big16 : binary.little16;
        var fields = read16(p + 18);
        if (p + 20 + fields * 12 > binary.length) { break; }
        for (var i = 0, f = p + 20; i < fields; i++, f += 12) {
          if (read16(f)== 0x0112 /* ORIENTATION */) {
            return read16(f + 8);
          }
        }
        break;
      }
      p += 2 + (m == 0xffd8 /* SOI */ ? 0 : binary.big16(p + 2));
    }
    return null;
  }
  function applyExifOrientation(entry)
  {
    var o = entry.orientation;
    var w = entry.width, h = entry.height;
    var temp =
      o == 2 ? [ w, h, false, ' scale(-1,1)' ] :
      o == 3 ? [ w, h, false, ' rotate(180deg)' ] :
      o == 4 ? [ w, h, false, ' scale(-1,1) rotate(180deg)' ] :
      o == 5 ? [ h, w, true,  ' scale(-1,1) rotate(90deg)' ] :
      o == 6 ? [ h, w, true,  ' rotate(90deg)' ] :
      o == 7 ? [ h, w, true,  ' scale(-1,1) rotate(-90deg)' ] :
      o == 8 ? [ h, w, true,  ' rotate(-90deg)' ] :
               [ w, h, false, '' ];
    entry.width = temp[0];
    entry.height = temp[1];
    entry.transposed = temp[2];
    entry.orientationAsCSS = temp[3];
  }

  function zoomIn()
  {
    viewZoom = Math.min(viewZoom + ZOOM_STEP_KEY, MAX_ZOOM_LEVEL);
    updateTransform();
  }
  function zoomOut()
  {
    viewZoom = Math.max(viewZoom - ZOOM_STEP_KEY, 0);
    updateTransform();
  }
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
    if (layoutMode == 'x') {
      $('#view').css({ flexDirection : 'row' });
      $('#arrange img').get(0).src = 'res/layout_x.svg';
    } else {
      $('#view').css({ flexDirection : 'column' });
      $('#arrange img').get(0).src = 'res/layout_y.svg';
    }
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
  function toggleHelp()
  {
    toggleDialog($('#shortcuts'));
  }
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
        [null, img.name ],
        [null, img.format ],
        img.sizeUnknown ? unknown : [img.width, addComma(img.width) ],
        img.sizeUnknown ? unknown : [img.height, addComma(img.height) ],
        img.sizeUnknown ? unknown : calcAspectRatio(img.width, img.height),
        [orientationToString(img.orientation), orientationToString(img.orientation)],
        [img.size, addComma(img.size) ],
        [img.lastModified, img.lastModified.toLocaleString()] ];
      for (var j = 0, v; v = val[i][j]; ++j) {
        var e = $('<td>').text(val[i][j][1]);
        if (0 < i && val[i][j][0]) {
          e.addClass(
              val[0][j][0] < val[i][j][0] ? 'sign lt' :
              val[0][j][0] > val[i][j][0] ? 'sign gt' : 'sign eq');
        }
        rows[j].append(e);
      }
    }
  }
  function toggleInfo()
  {
    updateInfoTable();
    toggleDialog($('#info'));
  }
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
          $('<tr>').append(
            $('<td>').addClass('b').text(ent.name),
            td
          )
        );
      }
      if (finished) {
        loading = [];
        if (0 < errors) {
          $('#loadingStatus').text(
            1 == errors ? 'An error occurred.' : 'Some errors occured.');
        } else {
          $('#loadingStatus').text('Finished!');
        }
      } else {
        $('#loadingStatus').text('Now loading...');
      }
      toggleDialog($('#loading'));
      if (finished && 0 == errors) {
        window.setTimeout(
          function() {
            window.setTimeout(
              function() {
                if ($('#loading').is(':visible')) {
                  hideDialog();
                }
              },
              500
            );
          },
          0
        );
      }
    }
  }
  function changeHistogramType(type)
  {
    if (histogramType != type) {
      histogramType = type;
      for (var i = 0, img; img = images[i]; i++) {
        img.histogram = null;
      }
      $('#histogramType > *').
        removeClass('current').
        eq(type).addClass('current');
      window.setTimeout(updateHistogramTable, 0);
    }
  }
  function makeHistogram(img)
  {
      var w = img.canvasWidth;
      var h = img.canvasHeight;
      var context = img.asCanvas.getContext('2d');
      var bits = context.getImageData(0, 0, w, h);
      var hist = new Uint32Array(256 * 3);
      for (var i = 0; i < 256 * 3; ++i) {
        hist[i] = 0;
      }
      if (histogramType == 0) { // RGB
        for (var i = 0, n = 4 * w * h; i < n; i+=4) {
          ++hist[bits.data[i + 0]];
          ++hist[bits.data[i + 1] + 256];
          ++hist[bits.data[i + 2] + 512];
        }
      } else { // Luminance
        for (var i = 0, n = 4 * w * h; i < n; i+=4) {
          var r = bits.data[i + 0];
          var g = bits.data[i + 1];
          var b = bits.data[i + 2];
          var y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          ++hist[y];
        }
      }
      //
      var canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      context = canvas.getContext('2d');
      var max = 0;
      for (var i = 0; i < 256 * 3; ++i) {
        max = Math.max(max, hist[i]);
      }
      context.fillStyle = '#222';
      context.fillRect(0,0,1024,512);
      if (histogramType == 0) { // RGB
        context.globalCompositeOperation = 'lighter';
        drawHistogram('#f00', 0);
        drawHistogram('#0f0', 256);
        drawHistogram('#00f', 512);
      } else { // Luminance
        drawHistogram('#fff', 0);
      }
      return canvas;
      
      function drawHistogram(color, offset) {
        context.fillStyle = color;
        for (var i = 0; i < 256; ++i) {
          var h = 512 * hist[i + offset] / max;
          context.fillRect(i*4, 512-h, 4, h);
        }
      }
  }
  function updateHistogramTable()
  {
    $('#histoTable td').remove();
    for (var k = 0, img; img = images[k]; k++) {
      if (!img.histogram) {
        img.histogram = makeHistogram(img);
      }
      $('#histoName').append($('<td>').text(img.name));
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
  }
  function toggleHistogram()
  {
    if ($('#histogram').is(':visible')) {
      hideDialog();
      return;
    }
    hideDialog();
    window.setTimeout(updateHistogramTable, 0);
    toggleDialog($('#histogram'));
  }
  function makeWaveform(img)
  {
      var w = img.canvasWidth;
      var h = img.canvasHeight;
      var context = img.asCanvas.getContext('2d');
      var bits = context.getImageData(0, 0, w, h);
      var histW = Math.min(w, 1024);
      var hist = new Uint32Array(256 * histW);
      var histN = new Uint32Array(histW);
      var histOff = new Uint32Array(w);
      for (var i = 0; i < 256 * histW; ++i) {
        hist[i] = 0;
      }
      for (var i = 0; i < histW; ++i) {
        histN[i] = 0;
      }
      for (var i = 0; i < w; ++i) {
        var x = Math.round((i + 0.5) / w * histW - 0.5);
        histOff[i] = x * 256;
        ++histN[x];
      }
      for (var i = 0, y = 0; y < h; ++y) {
        for (var x = 0; x < w; ++x, i+=4) {
          var r = bits.data[i + 0];
          var g = bits.data[i + 1];
          var b = bits.data[i + 2];
          var my = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          ++hist[histOff[x] + my];
        }
      }
      //
      var canvas = document.createElement('canvas');
      canvas.width = histW;
      canvas.height = 256;
      context = canvas.getContext('2d');
      bits = context.createImageData(histW, 256);
      for (var x = 0; x < histW; ++x) {
        var max = histN[x] * h;
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
      context.putImageData(bits, 0, 0);
      return canvas;
  }
  function updateWaveformTable()
  {
    $('#waveTable td').remove();
    for (var k = 0, img; img = images[k]; k++) {
      if (!img.waveform) {
        img.waveform = makeWaveform(img);
      }
      $('#waveName').append($('<td>').text(img.name));
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
  }
  function toggleWaveform()
  {
    if ($('#waveform').is(':visible')) {
      hideDialog();
      return;
    }
    hideDialog();
    window.setTimeout(updateWaveformTable, 0);
    toggleDialog($('#waveform'));
  }
  function toggleDialog(target)
  {
    if (dialog) {
      if (target.is(':visible')) {
        hideDialog();
        return;
      }
      hideDialog();
    }
    dialog = target;
    dialog.css({ display: 'block' }).
        off('click').on('click', function() { hideDialog(); });
    dialog.children().
        focus().
        off('click').on('click', function(e) { e.stopPropagation(); return true; });
  }
  function hideDialog()
  {
    if (dialog) {
      dialog.hide();
      dialog = null;
    }
  }

  function updateDOM()
  {
    var view = document.getElementById('view');
    images = [];
    for (var i = 0, ent; ent = entries[i]; i++) {
        if (ent.ready()) {
          images.push(ent);
        }
    }
    for (var i = 0, ent; ent = entries[i]; i++)
    {
        if (!ent.view) {
          ent.view = $('<div/>').addClass('imageBox').
              append(
                $('<span/>').addClass('imageName').
                    text(''+(i + 1) + ': ' + ent.name).
                    click({index : i}, function(e)
                    {
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
          ent.button = $('<div/>').addClass('button selector').
            text(''+(i + 1)).
            append(
              $('<span/>').addClass('tooltip').
                text('Select picture ')
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
    makeMouseDraggable();
    makeTouchDraggable();
    makeDoubleClickable();
    resetMouseDrag();
    updateLayout();
  }

  function makeMouseDraggable()
  {
    $('#view > div').off('mousedown').on('mousedown', function(e)
    {
      var index = $('#view > div').index(this);
      if (index >= entries.length)
      {
        return true;
      }
      if (e.which == 1)
      {
        dragLastPoint = { x : e.clientX, y : e.clientY };
        return false;
      }
    });
    $('#view > div').off('mousemove').on('mousemove', function(e)
    {
      if (entries.length == 0)
      {
        return true;
      }
      var index = Math.min(entries.length - 1, $('#view > div').index(this));
      if (dragLastPoint && e.buttons != 1)
      {
        dragLastPoint = null;
      }
      if (dragLastPoint)
      {
        var dx = e.clientX - dragLastPoint.x;
        var dy = e.clientY - dragLastPoint.y;
        dragLastPoint = { x : e.clientX, y : e.clientY };
        moveImageByPx(index, dx, dy);
        updateTransform();
        return false;
      }
    });
    $('#view > div').off('mouseup').on('mouseup', function(e)
    {
      dragLastPoint = null;
    });
  }
  function resetMouseDrag()
  {
    dragLastPoint = null;
  }
  function makeTouchDraggable()
  {
    $('#view > div').off('touchmove').on('touchmove', function(e)
    {
      if (entries.length == 0) {
        return true;
      }
      var index = Math.min(entries.length - 1, $('#view > div').index(this));
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
    $('#view > div').off('touchend').on('touchend', function(e)
    {
      touchState = null;
    });
  }
  function makeDoubleClickable()
  {
    $('#view > div.imageBox .image').off('dblclick').on('dblclick', function(e)
    {
      var index = $('#view > div').index($(this).parent());
      if (index >= entries.length || !entries[index].ready()) {
        return true;
      }
      var img = entries[index];
      var x = (e.pageX - $(this).offset().left) / (img.baseWidth * scale);
      var y = (e.pageY - $(this).offset().top) / (img.baseHeight * scale);
      zoomWithTarget(index, x, y);
    });
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
      viewZoom = Math.min(viewZoom + ZOOM_STEP_DBLCLK, MAX_ZOOM_LEVEL);
      viewOffset.x = Math.min(1, Math.max(0, x));
      viewOffset.y = Math.min(1, Math.max(0, y));
    } else {
      viewZoom = 0;
    }
    updateTransform();
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
    $('#view > div.imageBox').each(function(index)
    {
      if (isSingleView && index + 1 != currentImageIndex && (index != 0 || !overlayMode))
      {
        $(this).css({ display : 'none' });
      }
      else
      {
        var img = entries[index];
        var isOverlay = isSingleView && index + 1 == currentImageIndex && index != 0 && overlayMode;
        if (img.element) {
          img.isLetterBox = boxW * img.height < boxH * img.width;
          img.baseWidth = img.isLetterBox ? boxW : boxH * img.width / img.height;
          img.baseHeight = img.isLetterBox ? boxW * img.height / img.width : boxH;
          var w = img.baseWidth, h = img.baseHeight;
          if (img.transposed) {
            var temp = w; w = h; h = temp;
          }
          $(img.element).css({ width: w+'px', height: h+'px' });
        }
        $(this).css({ display : '' });
        $(this).css({
          position  : overlayMode ? 'absolute' : '',
          width     : overlayMode ? $('#view').width() + 'px' : '',
          opacity   : isOverlay ? '0.5' : '',
          background : overlayMode ? '#000' : '',
        });
      }
    });
    $('#view > div.emptyBox').each(function(index)
    {
      if (index >= (isSingleView ? 0 : numSlots - entries.length))
      {
        $(this).css({ display : 'none' });
      }
      else
      {
        $(this).css({ display : '' });
      }
    });
    if (overlayMode) {
      $('#mode').
        text( 'OVERLAY MODE : ' +
          ((isSingleView && 1 < currentImageIndex)
            ? '1 + ' + currentImageIndex : '1 only' )).
        css({ display : 'inline-block' });
    } else {
      $('#mode').text('').css({ display : '' });
    }
    if (isSingleView) {
      $('.selector').removeClass('disabled').eq(currentImageIndex - 1).addClass('disabled');
    } else {
      $('.selector').removeClass('disabled');
    }
    $('#overlay').css({ display : 2 <= entries.length ? '' : 'none' });
    updateTransform();
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
  }

  function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    addFiles(evt.dataTransfer.files);
  }
  function addFiles(files)
  {
    // files is a FileList of File objects.
    var sorted = [];
    for (var i = 0, f; f = files[i]; i++) {
      sorted.push(f);
    }
    sorted.sort(
      function(a, b) {
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      });
    for (var i = 0, f; f = sorted[i]; i++)
    {
      var entry = {
            name            : f.name,
            size            : f.size,
            lastModified    : new Date(f.lastModified || f.lastModifiedDate),
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
            histogram   : null,
            waveform    : null,
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
                var binary = binaryFromDataURI(e.target.result)
                var format = detectImageFormat(binary);
                if (format == 'JPEG') {
                  theEntry.orientation = detectExifOrientation(binary);
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
                    var canvas = document.createElement('canvas');
                    canvas.width  = w;
                    canvas.height = h;
                    var context = canvas.getContext('2d');
                    context.drawImage(img, 0, 0, w, h);
                    //
                    if (NEEDS_IOS_EXIF_WORKAROUND && format == 'JPEG') {
                      theEntry.element    = canvas;
                    } else {
                      theEntry.element    = img;
                    }
                    $(theEntry.element).addClass('image');
                    theEntry.asCanvas   = canvas;
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
                    } else if (format != 'PNG' && format != 'JPEG' && format != 'GIF' && format != 'BMP') {
                      theEntry.error += ' Maybe unsupported format for the browser.';
                    }
                    
                    updateDOM();
                    updateNowLoading();
                  });
                img.src = e.target.result;
            };
        })(entry, f);
        reader.onerror = (function(theEntry, theFile, theReader)
        {
          return function(e) {
            theEntry.loading = false;
            theEntry.error = 'Failed. File could not be read. (' + theReader.error.name + ')';
            
            updateDOM();
            updateNowLoading();
          };
        })(entry, f, reader);
        reader.readAsDataURL(f);
      }
    }
    currentImageIndex = 0;
    updateDOM();
    updateNowLoading();
  }

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
  }

  function toggleFullscreen()
  {
    var fullscreen = document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement;
    if (!fullscreen)
    {
      var view = document.getElementById('viewroot');
      if (view.webkitRequestFullscreen) {
        view.webkitRequestFullscreen();
      } else if (view.mozRequestFullScreen) {
        view.mozRequestFullScreen();
      } else if (view.msRequestFullscreen) {
        view.msRequestFullscreen();
      } else {
        view.requestFullscreen();
      }
    }
    else
    {
      if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  }
