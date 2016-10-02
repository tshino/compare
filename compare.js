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
    var html = [];
    for (var i = 0, img; img = images[i]; i++)
    {
        if (isSingleView && i + 1 != currentImageIndex)
        {
            continue;
        }
        html.push(
            '<div>' +
                '<img src="' + img.url + '">' +
                '<span>' + (i + 1) + ': ' + escape(img.name) + '</span>' +
            '</div>');
    }
    var numColumns =
            isSingleView ? 1 :
            2 < html.length ? html.length : 2;
    while (html.length < numColumns)
    {
        html.push(
            '<div>' +
                '<div class="dropHere">Drop image files here</div>' +
            '</div>');
    }
    view.innerHTML = html.join('');
    
    $('#view > div').addClass('imageBox').css(
        {
            width       : ''+(100/numColumns)+'%',
        });
    $('#view .imageBox span').addClass('imageName');
    $('#view .imageBox img').on('load', function()
        {
            var temp = new Image;
            temp.src = $(this).attr('src');
            var w = temp.width;
            var h = temp.height;
            if (vw / numColumns * h < vh * w)
            {
                $(this).css( { width : '100%' });
            }
            else
            {
                $(this).css( { height : '100%' });
            }
            $(this).css(
                {
                    left        : '50%',
                    top         : '50%',
                    transform   : 'translate(-50%, -50%) ' +
                                  'scale(' + scale + ') ' +
                                  'translate(' + offsetX + '%, ' + offsetY + '%)',
                });
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
        log.push('Error: ', escape(f.name), ' is not an image <br>');
      }
      else
      {
        var reader = new FileReader();
        reader.onload = (function(theFile)
        {
            return function(e)
            {
                images.push(
                    {
                        url : e.target.result,
                        name : theFile.name,
                    });
                updateImageView();
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

