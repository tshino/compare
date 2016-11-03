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
  });
  $('#view .dropHere').
    text("Drop image files here").
    click(function() {
      $('#file').click();
    });
  
  $(window).resize(updateLayout);
  $(window).keydown(function(e)
    {
      if (e.ctrlKey || e.altKey)
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
      // '0' - '9'
      if (48 <= e.keyCode && e.keyCode <= 57 && !e.shiftKey)
      {
        currentImageIndex = e.keyCode - 48;
        updateLayout();
        return false;
      }
      // '+;' (59 or 187) / PageUp (33)
      if (e.keyCode == 59 || e.keyCode == 187 || (e.keyCode == 33 && !e.shiftKey))
      {
        zoomIn();
        return false;
      }
      // '-' (173 or 189) / PageDown (34)
      if (e.keyCode == 173 || e.keyCode == 189 || (e.keyCode == 34 && !e.shiftKey))
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
        resetMouseDrag();
        updateLayout();
        return false;
      }
      //alert(e.keyCode);
    });
  $(window).keypress(function(e)
  {
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
    // 'i' (105)
    if (e.which == 105) {
      toggleInfo();
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

  function showAll()
  {
    currentImageIndex = 0;
    updateLayout();
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
  function toggleHelp()
  {
    toggleDialog($('#shortcuts'));
  }
  function updateInfoTable()
  {
    $('#infoTable td:not(.prop)').remove();
    var rows = [
      $('#infoName'),
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
        off('click').on('click', function() { return false; });
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
    $('#sidebar > .selector').remove();
    $('#view > div.imageBox').remove();
    for (var i = 0, img; img = images[i]; i++)
    {
        $('#drop').before(
            $('<div/>').addClass('imageBox').append(
                img.element,
                $('<span/>').addClass('imageName'). 
                    text(''+(i + 1) + ': ' + img.name).
                    click({index : i}, function(e)
                    {
                      currentImageIndex = currentImageIndex == 0 ? e.data.index + 1 : 0;
                      updateLayout();
                    })
            )
        );
        $('#sidebar').append(
          $('<div/>').addClass('button selector').
            text(''+(i + 1)).
            click({index : i}, function(e)
            {
              currentImageIndex = e.data.index + 1;
              updateLayout();
            })
        );
    }
    makeMouseDraggable();
    makeTouchDraggable();
    makeDoubleClickable();
    resetMouseDrag();
    updateLayout();
  }

  function makeMouseDraggable()
  {
    $('#view > div').on('mousedown', function(e)
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
    $('#view > div').on('mousemove', function(e)
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
    $('#view > div').on('mouseup', function(e)
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
    $('#view > div').on('touchmove', function(e)
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
    $('#view > div').on('touchend', function(e)
    {
      touchState = null;
    });
  }
  function makeDoubleClickable()
  {
    $('#view > div.imageBox img').on('dblclick', function(e)
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
    var vw = $('#view').width();
    var vh = $('#view').height();
    var isSingleView =
            currentImageIndex != 0 &&
            currentImageIndex <= images.length;
    var numColumns =
            isSingleView ? 1 :
            2 < images.length ? images.length : 2;
    $('#view > div.imageBox').each(function(index)
    {
      var img = images[index];
      img.isLetterBox = vw / numColumns * img.height < vh * img.width;
      img.baseWidth = img.isLetterBox ? vw / numColumns : vh * img.width / img.height;
      img.baseHeight = img.isLetterBox ? vw / numColumns * img.height / img.width : vh;
      if (isSingleView && index + 1 != currentImageIndex)
      {
        $(this).css({ display : 'none' });
      }
      else
      {
        var wPercent = 100 * img.baseWidth / (vw / numColumns);
        var hPercent = 100 * img.baseHeight / vh;
        $(img.element).css( { width : wPercent+'%', height : hPercent+'%' });
        $(this).css({ display : 'inline-block' });
      }
    });
    $('#view > div.emptyBox').each(function(index)
    {
      if (index >= (isSingleView ? 0 : numColumns - images.length))
      {
        $(this).css({ display : 'none' });
      }
      else
      {
        $(this).css({ display : 'inline-block' });
      }
    });
    $('#all')[isSingleView ? 'removeClass' : 'addClass']('disabled');
    if (isSingleView) {
      $('.selector').removeClass('disabled').eq(currentImageIndex - 1).addClass('disabled');
    } else {
      $('.selector').removeClass('disabled');
    }
    updateTransform();
  }
  
  function updateTransform() {
    
    var scalePercent = Math.round(Math.pow(2.0, viewZoom) * 100);
    scale = scalePercent / 100;
    var offsetX = (50 - 100 * viewOffset.x) * (1.0 - 1.0 / scale);
    var offsetY = (50 - 100 * viewOffset.y) * (1.0 - 1.0 / scale);
    $('#view .imageBox img').css(
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
                var img = new Image;
                $(img).on('load', function()
                {
                    loading.splice(loading.indexOf(theFile.name), 1);
                    showNowLoading();
                    images.push(
                        {
                            element : img,
                            width   : img.width,
                            height  : img.height,
                            name    : theFile.name,
                            size          : theFile.size,
                            lastModified  : new Date(theFile.lastModified),
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
    updateDOM();
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
                document.mozFullScreenElement;
    if (!fullscreen)
    {
      var view = document.getElementById('viewroot');
      if (view.webkitRequestFullscreen) {
        view.webkitRequestFullscreen();
      } else if (view.mozRequestFullScreen) {
        view.mozRequestFullScreen();
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
      } else {
        document.exitFullscreen();
      }
    }
  }
