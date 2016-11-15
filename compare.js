var MAX_ZOOM_LEVEL    = 6.0;
var ZOOM_STEP_KEY     = 0.25;
var ZOOM_STEP_WHEEL   = 0.0625;
var ZOOM_STEP_DBLCLK  = 2.00;

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
  var images = [];
  var log = [];
  var currentImageIndex = 0;
  var viewZoom = 0;
  var scale = 1.0;
  var viewOffset = { x : 0.5, y : 0.5 };
  var layoutMode = 'x';
  var overlayMode = false;
  var dragLastPoint = null;
  var touchState = null;
  var dialog = null;

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
  function detectImageFormat(dataURI)
  {
    var p = dataURI.indexOf(',');
    if (0 <= dataURI.slice(0, p).indexOf(';base64')) {
      if (dataURI.length - (p + 1) < 8) {
        return null;
      }
      var head = atob(dataURI.slice(p + 1, p + 9));
    } else {
      var head = decodeURIComponent(dataURI.slice(p + 1));
    }
    var magic = head.length < 4 ? 0 :
        ((head.charCodeAt(0) * 256 +
        head.charCodeAt(1)) * 256 +
        head.charCodeAt(2)) * 256 +
        head.charCodeAt(3);
    if (magic == 0x89504e47) { return 'PNG'; }
    if (magic == 0x47494638) { return 'GIF'; }
    if ((magic & 0xffff0000) == 0x424d0000) { return 'BMP'; }
    if ((magic - (magic & 255)) == 0xffd8ff00) { return 'JPEG'; }
    if (magic == 0x4d4d002a || magic == 0x49492a00) { return 'TIFF'; }
    //alert(magic);
    return null;
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
            currentImageIndex <= images.length;
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
    if (!overlayMode && 2 <= images.length) {
      if (currentImageIndex <= 1 || images.length < currentImageIndex) {
        currentImageIndex = Math.min(2, images.length);
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
      $('#infoFileSize'),
      $('#infoLastModified') ];
    var val = [];
    for (var i = 0, img; img = images[i]; i++)
    {
      val[i] = [
        [null, img.name ],
        [null, img.format ],
        [img.width, addComma(img.width) ],
        [img.height, addComma(img.height) ],
        calcAspectRatio(img.width, img.height),
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
  function showNowLoading()
  {
    hideDialog();
    $('#loadingList > tr').remove();
    for (var i = 0, n; n = loading[i]; i++) {
      $('#loadingList').append($('<tr>').addClass('b').append($('<td>').text(n)));
    }
    if (0 < loading.length) {
      toggleDialog($('#loading'));
    }
  }
  function makeHistogram(img)
  {
      var w = img.naturalWidth;
      var h = img.naturalHeight;
      var context = img.asCanvas.getContext('2d');
      var bits = context.getImageData(0, 0, w, h);
      var hist = new Uint32Array(256);
      for (var i = 0; i < 256; ++i) {
        hist[i] = 0;
      }
      for (var i = 0, n = 4 * w * h; i < n; i+=4) {
        var r = bits.data[i + 0];
        var g = bits.data[i + 1];
        var b = bits.data[i + 2];
        var y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        ++hist[y];
      }
      //
      var canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      context = canvas.getContext('2d');
      var max = 0;
      for (var i = 0; i < 256; ++i) {
        max = Math.max(max, hist[i]);
      }
      context.fillStyle = '#444';
      context.fillRect(0,0,1024,1024);
      context.fillStyle = '#fff';
      for (var i = 0; i < 256; ++i) {
        var h = 1024 * hist[i] / max;
        context.fillRect(i*4, 1024-h, 4, h);
      }
      return canvas;
  }
  function toggleHistogram()
  {
    if ($('#histogram').is(':visible')) {
      hideDialog();
      return;
    }
    hideDialog();
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
    toggleDialog($('#histogram'));
  }
  function makeWaveform(img)
  {
      var w = img.naturalWidth;
      var h = img.naturalHeight;
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
  function toggleWaveform()
  {
    if ($('#waveform').is(':visible')) {
      hideDialog();
      return;
    }
    hideDialog();
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
    for (var i = 0, img; img = images[i]; i++)
    {
        if (!img.view) {
          img.view = $('<div/>').addClass('imageBox').append(
                img.element,
                $('<span/>').addClass('imageName'). 
                    text(''+(i + 1) + ': ' + img.name).
                    click({index : i}, function(e)
                    {
                      currentImageIndex = currentImageIndex == 0 ? e.data.index + 1 : 0;
                      updateLayout();
                    })
            );
          $('#drop').before(img.view);
        }
        if (!img.button) {
          img.button = $('<div/>').addClass('button selector').
            attr('data-tooltip', 'Select picture').
            text(''+(i + 1)).
            click({index : i}, function(e)
            {
              currentImageIndex = e.data.index + 1;
              updateLayout();
            });
          $('#overlay').before(img.button);
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
      if (index >= images.length)
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
      if (images.length == 0)
      {
        return true;
      }
      var index = Math.min(images.length - 1, $('#view > div').index(this));
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
      if (images.length == 0) {
        return true;
      }
      var index = Math.min(images.length - 1, $('#view > div').index(this));
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
    $('#view > div.imageBox canvas').off('dblclick').on('dblclick', function(e)
    {
      var index = $('#view > div').index($(this).parent());
      if (index >= images.length) {
        return true;
      }
      var img = images[index];
      var x = (e.pageX - $(this).offset().left) / (img.baseWidth * scale);
      var y = (e.pageY - $(this).offset().top) / (img.baseHeight * scale);
      zoomWithTarget(index, x, y);
    });
  }
  function moveImageByPx(index, dx, dy)
  {
    var x = dx / (images[index].baseWidth * scale);
    var y = dy / (images[index].baseHeight * scale);
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
            currentImageIndex <= images.length;
    if (!isSingleView && overlayMode) {
      overlayMode = false;
    }
    var numSlots = isSingleView ? 1 : Math.max(images.length, 2);
    var numColumns = layoutMode == 'x' ? numSlots : 1;
    var numRows    = layoutMode != 'x' ? numSlots : 1;
    var boxW = $('#view').width() / numColumns;
    var boxH = $('#view').height() / numRows;
    $('#view > div.imageBox').each(function(index)
    {
      var img = images[index];
      img.isLetterBox = boxW * img.height < boxH * img.width;
      img.baseWidth = img.isLetterBox ? boxW : boxH * img.width / img.height;
      img.baseHeight = img.isLetterBox ? boxW * img.height / img.width : boxH;
      var isOverlay = isSingleView && index + 1 == currentImageIndex && index != 0 && overlayMode;
      if (isSingleView && index + 1 != currentImageIndex && (index != 0 || !overlayMode))
      {
        $(this).css({ display : 'none' });
      }
      else
      {
        var wPercent = 100 * img.baseWidth / boxW;
        var hPercent = 100 * img.baseHeight / boxH;
        $(img.element).css( { width : wPercent+'%', height : hPercent+'%' });
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
      if (index >= (isSingleView ? 0 : numSlots - images.length))
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
    $('#overlay').css({ display : 2 <= images.length ? '' : 'none' });
    updateTransform();
  }
  
  function updateTransform() {
    
    var scalePercent = Math.round(Math.pow(2.0, viewZoom) * 100);
    scale = scalePercent / 100;
    var offsetX = (50 - 100 * viewOffset.x) * (1.0 - 1.0 / scale);
    var offsetY = (50 - 100 * viewOffset.y) * (1.0 - 1.0 / scale);
    $('#view .imageBox canvas').css(
                {
                    left        : '50%',
                    top         : '50%',
                    transform   : 'translate(-50%, -50%) ' +
                                  'scale(' + scale + ') ' +
                                  'translate(' + offsetX + '%, ' + offsetY + '%)',
                });
  }

  function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    addFiles(evt.dataTransfer.files);
  }
  function addFiles(files)
  {
    // files is a FileList of File objects.
    for (var i = 0, f; f = files[i]; i++)
    {
      if (!f.type || !(/^image\/.+$/.test(f.type)))
      {
        log.push('Error: ', escapeHtml(f.name), ' is not an image <br>');
      }
      else
      {
        loading.push(f.name);
        var reader = new FileReader();
        reader.onload = (function(theFile)
        {
            return function(e)
            {
                var format = detectImageFormat(e.target.result);
                var img = new Image;
                $(img).on('load', function()
                {
                    var canvas = document.createElement('canvas');
                    canvas.width  = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    var context = canvas.getContext('2d');
                    context.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
                    //
                    loading.splice(loading.indexOf(theFile.name), 1);
                    showNowLoading();
                    images.push(
                        {
                            view    : null,
                            button  : null,
                            element     : canvas,
                            asCanvas    : canvas,
                            width   : img.width,
                            height  : img.height,
                            naturalWidth   : img.naturalWidth,
                            naturalHeight  : img.naturalHeight,
                            name    : theFile.name,
                            format  : format || '('+theFile.type+')' || '(unknown)',
                            size          : theFile.size,
                            lastModified  : new Date(theFile.lastModified || theFile.lastModifiedDate),
                            histogram   : null,
                            waveform    : null,
                        });
                    updateDOM();
                });
                img.src = e.target.result;
            };
        })(f);
        reader.readAsDataURL(f);
      }
    }
    currentImageIndex = 0;
    updateLayout();
    document.getElementById('log').innerHTML = log.join('');
    showNowLoading();
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
