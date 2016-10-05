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
  
  $(window).resize(updateImageView);
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
        updateImageView();
        return false;
      }
      // '+;' (59 or 187) / PageUp (33)
      if (e.keyCode == 59 || e.keyCode == 187 || (e.keyCode == 33 && !e.shiftKey))
      {
        if (viewZoom < 30)
        {
            viewZoom += 1;
        }
        updateImageView();
        return false;
      }
      // '-' (173 or 189) / PageDown (34)
      if (e.keyCode == 173 || e.keyCode == 189 || (e.keyCode == 34 && !e.shiftKey))
      {
        if (viewZoom > 0)
        {
            viewZoom -= 1;
        }
        updateImageView();
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
        updateImageView();
        return false;
      }
      // ESC (27)
      if (e.keyCode == 27 && !e.shiftKey)
      {
        currentImageIndex = 0;
        viewZoom = 0;
        viewOffset.x = 0.5;
        viewOffset.y = 0.5;
        updateImageView();
        return false;
      }
      //alert(e.keyCode);
    });
  
  updateImageView();
});

  var images = [];
  var log = [];
  var currentImageIndex = 0;
  var viewZoom = 0;
  var scale = 1.0;
  var viewOffset = { x : 0.5, y : 0.5 };

  function escapeHtml(str)
  {
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    str = str.replace(/"/g, '&quot;');
    str = str.replace(/'/g, '&#39;');
    return str;
  }

  function updateImageView()
  {
    var view = document.getElementById('view');
    var vw = $(view).width();
    var vh = $(view).height();
    
    var scalePercent = Math.round(Math.pow(1.2, viewZoom) * 100);
    scale = scalePercent / 100;
    var offsetX = (50 - 100 * viewOffset.x) * (1.0 - 1.0 / scale);
    var offsetY = (50 - 100 * viewOffset.y) * (1.0 - 1.0 / scale);
    
    var isSingleView =
            currentImageIndex != 0 &&
            currentImageIndex <= images.length;
    var numColumns =
            isSingleView ? 1 :
            2 < images.length ? images.length : 2;
    
    view.innerHTML = '';
    var html = [];
    var htmlCount = 0;
    for (var i = 0, img; img = images[i]; i++)
    {
        if (isSingleView && i + 1 != currentImageIndex)
        {
            continue;
        }
        if (vw / numColumns * img.height < vh * img.width)
        {
            $(img.element).css( { width : '100%', height : 'auto' });
        }
        else
        {
            $(img.element).css( { width : 'auto', height : '100%' });
        }
        $(view).append(
            $('<div/>').append(
                img.element,
                $('<span/>').text(''+(i + 1) + ': ' + img.name)
            )
        );
        htmlCount += 1;
    }
    while (htmlCount < numColumns)
    {
        $(view).append(
            $('<div/>').append(
                $('<div/>').addClass('dropHere').text("Drop image files here")
            )
        );
        htmlCount += 1;
    }
    
    $('#view > div').addClass('imageBox').css(
        {
            width       : ''+(100/numColumns)+'%',
        });
    $('#view .imageBox span').addClass('imageName');
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

    var files = evt.dataTransfer.files;

    // files is a FileList of File objects. List some properties.
    for (var i = 0, f; f = files[i]; i++)
    {
      if (!f.type || !(f.type == 'image/png' || f.type == 'image/jpeg'))
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
                    updateImageView();
                });
                img.src = e.target.result;
            };
        })(f);
        reader.readAsDataURL(f);
      }
    }
    currentImageIndex = 0;
    updateImageView();
    document.getElementById('log').innerHTML = log.join('');
  }

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
  }

