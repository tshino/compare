$( function()
{
  var MAX_ZOOM_LEVEL    = 6.0;
  var ZOOM_STEP_KEY     = 0.25;
  var ZOOM_STEP_WHEEL   = 0.0625;
  
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
        viewZoom = Math.min(viewZoom + ZOOM_STEP_KEY, MAX_ZOOM_LEVEL);
        updateTransform();
        return false;
      }
      // '-' (173 or 189) / PageDown (34)
      if (e.keyCode == 173 || e.keyCode == 189 || (e.keyCode == 34 && !e.shiftKey))
      {
        viewZoom = Math.max(viewZoom - ZOOM_STEP_KEY, 0);
        updateTransform();
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
      // 'f' (70)
      if (e.keyCode == 70 && !e.shiftKey)
      {
        resetMouseDrag();
        toggleFullscreen();
        return false;
      }
      //alert(e.keyCode);
    });
  
  $(window).on("wheel", function(e)
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

  var images = [];
  var log = [];
  var currentImageIndex = 0;
  var viewZoom = 0;
  var scale = 1.0;
  var viewOffset = { x : 0.5, y : 0.5 };
  var dragLastPoint = null;

  function escapeHtml(str)
  {
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    str = str.replace(/"/g, '&quot;');
    str = str.replace(/'/g, '&#39;');
    return str;
  }

  function showAll()
  {
    currentImageIndex = 0;
    updateLayout();
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
        var x = dx / images[index].baseWidth;
        var y = dy / images[index].baseHeight;
        if (1.0 < scale)
        {
          viewOffset.x -= (x / scale) / (1.0 - 1.0 / scale);
          viewOffset.y -= (y / scale) / (1.0 - 1.0 / scale);
        }
        viewOffset.x = Math.min(1, Math.max(0, viewOffset.x));
        viewOffset.y = Math.min(1, Math.max(0, viewOffset.y));
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
        if (img.isLetterBox)
        {
          $(img.element).css( { width : '100%', height : 'auto' });
        }
        else
        {
          $(img.element).css( { width : 'auto', height : '100%' });
        }
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
        var reader = new FileReader();
        reader.onload = (function(theFile)
        {
            return function(e)
            {
                var img = new Image;
                $(img).on('load', function()
                {
                    images.push(
                        {
                            element : img,
                            width   : img.width,
                            height  : img.height,
                            name    : theFile.name,
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
