var compareUtil = (function() {

  var createObjectURL = function(blob) {
    if (window.URL) {
      return window.URL.createObjectURL(blob);
    } else {
      return window.webkitURL.createObjectURL(blob);
    }
  };

  var newWorker = function(relativePath) {
    try {
      return new Worker(relativePath);
    } catch (e) {
      var baseURL = window.location.href.
                        replace(/\\/g, '/').replace(/\/[^\/]*$/, '/');
      var array = ['importScripts("' + baseURL + relativePath + '");'];
      var blob = new Blob(array, {type: 'text/javascript'});
      return new Worker(createObjectURL(blob));
    }
  };

  var toggleFullscreen = function(element) {
    var fullscreen = document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement;
    if (!fullscreen) {
      var view = element;
      if (view.webkitRequestFullscreen) {
        view.webkitRequestFullscreen();
      } else if (view.mozRequestFullScreen) {
        view.mozRequestFullScreen();
      } else if (view.msRequestFullscreen) {
        view.msRequestFullscreen();
      } else {
        view.requestFullscreen();
      }
    } else {
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
  };

  var calcGCD = function(a, b) {
    var m = Math.max(a, b), n = Math.min(a, b);
    while (n > 0) {
      var r = m % n;
      m = n;
      n = r;
    }
    return m;
  };

  //
  // Make a binary view of a DataURI string
  //
  // Applying atob() to a Base64 string from a very large image file
  // such as > 10MBytes takes unnecessary long execution time.
  // This binary view object provides O(1) random access of dataURI.
  //
  var binaryFromDataURI = function(dataURI) {
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
    var readBig16 = function(addr) {
      return read(addr) * 256 + read(addr + 1);
    };
    var readLittle16 = function(addr) {
      return read(addr) + read(addr + 1) * 256;
    };
    var readBig32 = function(addr) {
      return readBig16(addr) * 65536 + readBig16(addr + 2);
    };

    return {
      length:   len,
      at:       read,
      big16:    readBig16,
      little16: readLittle16,
      big32:    readBig32
    };
  };

  var detectPNGChunk = function(binary, target, before) {
    for (var p = 8; p + 8 <= binary.length; ) {
      var len = binary.big32(p);
      var chunk = binary.big32(p + 4);
      if (chunk === target) { return p; }
      if (chunk === before) { break; }
      p += len + 12;
    }
    return null;
  };

  var detectMPFIdentifier = function(binary) {
    for (var p = 0; p + 4 <= binary.length; ) {
      var m = binary.big16(p);
      if (m === 0xffda /* SOS */) { break; }
      if (m === 0xffe2 /* APP2 */) {
        if (binary.big32(p + 4) === 0x4d504600 /* 'MPF\0' */) {
          return p;
        }
      }
      p += 2 + (m === 0xffd8 /* SOI */ ? 0 : binary.big16(p + 2));
    }
    return null;
  };

  var detectExifOrientation = function(binary) {
    for (var p = 0; p + 4 <= binary.length; ) {
      var m = binary.big16(p);
      if (m === 0xffda /* SOS */) { break; }
      if (m === 0xffe1 /* APP1 */) {
        if (p + 20 > binary.length) { break; }
        var big = binary.big16(p + 10) === 0x4d4d; /* MM */
        var read16 = big ? binary.big16 : binary.little16;
        var fields = read16(p + 18);
        if (p + 20 + fields * 12 > binary.length) { break; }
        for (var i = 0, f = p + 20; i < fields; i++, f += 12) {
          if (read16(f) === 0x0112 /* ORIENTATION */) {
            return read16(f + 8);
          }
        }
        break;
      }
      p += 2 + (m === 0xffd8 /* SOI */ ? 0 : binary.big16(p + 2));
    }
    return null;
  };

  var detectImageFormat = function(binary) {
    var magic = binary.length < 4 ? 0 : binary.big32(0);
    var magic2 = binary.length < 8 ? 0 : binary.big32(4);

    if (magic === 0x89504e47) {
      // PNG
      if (detectPNGChunk(
                binary, 0x6163544c /* acTL */, 0x49444154 /* IDAT */)) {
        return 'PNG (APNG)';
      }
      return 'PNG';
    }
    if (magic === 0x47494638) { return 'GIF'; }
    if ((magic & 0xffff0000) === 0x424d0000) { return 'BMP'; }
    if ((magic - (magic & 255)) === 0xffd8ff00) {
      if (detectMPFIdentifier(binary)) {
        return 'JPEG (MPF)';
      }
      return 'JPEG';
    }
    if (magic === 0x4d4d002a || magic === 0x49492a00) { return 'TIFF'; }
    if ((magic === 0xefbbbf3c /* BOM + '<' */ &&
            magic2 === 0x3f786d6c /* '?xml' */) ||
        (magic === 0x3c3f786d /* '<?xm' */ &&
            (magic2 & 0xff000000) === 0x6c000000 /* 'l' */)) {
        // XML
        var i = 4;
        for (var x; x = binary.at(i); ++i) {
          if (x === 0x3c /* '<' */) {
            var y = binary.at(i + 1);
            if (y !== 0x3f /* '?' */ && y !== 0x21 /* '!' */) { break; }
          }
        }
        var sig1 = binary.length < i + 4 ? 0 : binary.big32(i);
        if (sig1 === 0x3c737667 /* <svg */) {
          return 'SVG';
        }
    }
    //alert(magic);
    return null;
  };

  var makeZoomController = function(update, options) {
    options = options !== undefined ? options : {};
    var MAX_ZOOM_LEVEL    = 6.0;
    var ZOOM_STEP_KEY     = 0.25;
    var ZOOM_STEP_WHEEL   = 0.0625;
    var ZOOM_STEP_DBLCLK  = 2.00;
    var cursorMoveDelta = options.cursorMoveDelta || 0.3;
    var getBaseSize = options.getBaseSize || function(index) {};
    var zoomXOnly = false;
    var o = {
      zoom: 0,
      scale: 1,
      offset: { x: 0.5, y: 0.5 }
    };
    var enabled = true;
    var dragLastPoint = null;
    var touchState = null;
    o.enable = function(options) {
      options = options !== undefined ? options : {};
      enabled = true;
      zoomXOnly = options.zoomXOnly !== undefined ? options.zoomXOnly : zoomXOnly;
      getBaseSize = options.getBaseSize || getBaseSize;
    };
    o.disable = function() { enabled = false; };
    var setZoom = function(z) {
      o.zoom = z;
      o.scale = Math.round(Math.pow(2.0, z) * 100) / 100;
    };
    var zoomRelative = function(delta) {
      if (enabled) {
        setZoom(Math.max(0, Math.min(MAX_ZOOM_LEVEL, o.zoom + delta)));
        update();
        return true;
      }
    };
    var zoomIn = function() { return zoomRelative(+ZOOM_STEP_KEY); };
    var zoomOut = function() { return zoomRelative(-ZOOM_STEP_KEY); };
    var setOffset = function(x, y) {
      x = Math.min(1, Math.max(0, x));
      y = zoomXOnly ? 0.5 : Math.min(1, Math.max(0, y));
      if (o.offset.x !== x || o.offset.y !== y) {
        o.offset.x = x;
        o.offset.y = y;
        return true;
      }
    };
    var getCenter = function() {
      return {
        x: (o.offset.x - 0.5) * (1 - 1 / o.scale),
        y: (o.offset.y - 0.5) * (1 - 1 / o.scale)
      };
    };
    var moveRelative = function(dx, dy) {
      if (1 < o.scale && enabled) {
        var result = setOffset(
                        o.offset.x + dx / (o.scale - 1),
                        o.offset.y + dy / (o.scale - 1));
        update();
        return result;
      }
    };
    var moveRelativePx = function(index, dx, dy) {
      var base = getBaseSize(index);
      if (base) {
        moveRelative(-dx / base.w, -dy / base.h);
      }
    };
    var zoomTo = function(x, y) {
      if (!enabled) {
      } else if (o.zoom + ZOOM_STEP_DBLCLK < MAX_ZOOM_LEVEL) {
        setOffset(x, y);
        zoomRelative(+ZOOM_STEP_DBLCLK);
      } else {
        setZoom(0);
        update();
      }
    };
    var zoomToPx = function(index, x, y) {
      var base = getBaseSize(index);
      if (base) {
        zoomTo(x / (base.w * o.scale), y / (base.h * o.scale));
        return false;
      }
      return true;
    };
    var processKeyDown = function(e) {
      // '+;' (59, 187 or 107 for numpad) / PageUp (33)
      if (e.keyCode === 59 || e.keyCode === 187 || e.keyCode === 107 ||
          (e.keyCode === 33 && !e.shiftKey)) {
        if (zoomIn()) {
          return false;
        }
      }
      // '-' (173, 189 or 109 for numpad) / PageDown (34)
      if (e.keyCode === 173 || e.keyCode === 189 || e.keyCode === 109 ||
          (e.keyCode === 34 && !e.shiftKey)) {
        if (zoomOut()) {
          return false;
        }
      }
      // cursor key
      if (37 <= e.keyCode && e.keyCode <= 40) {
        var x = e.keyCode === 37 ? -1 : e.keyCode === 39 ? 1 : 0;
        var y = e.keyCode === 38 ? -1 : e.keyCode === 40 ? 1 : 0;
        if (moveRelative(x * cursorMoveDelta, y * cursorMoveDelta)) {
          return false;
        }
      }
      return true;
    };
    var resetDragState = function() { dragLastPoint = null; };
    var processMouseDown = function(e, selector, target) {
      var index = selector ? $(selector).index(target) : null;
      if (getBaseSize(index) && e.which === 1) {
        dragLastPoint = { x: e.clientX, y: e.clientY };
        return false;
      }
    };
    var processMouseMove = function(e, selector, target) {
      if (dragLastPoint) {
        if (e.buttons !== 1) {
          dragLastPoint = null;
        } else {
          var index = selector ? $(selector).index(target) : null;
          var dx = e.clientX - dragLastPoint.x;
          var dy = e.clientY - dragLastPoint.y;
          dragLastPoint = { x: e.clientX, y: e.clientY };
          moveRelativePx(index, dx, dy);
          return false;
        }
      }
    };
    var processDblclick = function(e, selector, target) {
      var index = selector ? $(selector).index($(target).parent()) : null;
      var x = e.pageX - $(target).offset().left;
      var y = e.pageY - $(target).offset().top;
      return zoomToPx(index, x, y);
    };
    var processWheel = function(e) {
      var event = e.originalEvent;
      if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
        return true;
      }
      var deltaScale = event.deltaMode === 0 ? /* PIXEL */ 0.1 : /* LINE */ 1.0;
      var steps = Math.max(-3, Math.min(3, event.deltaY * deltaScale));
      if (steps !== 0) {
        zoomRelative(-steps * ZOOM_STEP_WHEEL);
        return false;
      }
    };
    var resetTouchState = function() { touchState = null; };
    var processTouchMove = function(e, selector, target) {
      var index = selector ? $(selector).index(target) : null;
      var event = e.originalEvent;
      if (event.touches.length === 1 || event.touches.length === 2) {
        var touches = Array.prototype.slice.call(event.touches);
        touches.sort(function(a, b) {
          return (
              a.identifier < b.identifier ? -1 :
              a.identifier > b.identifier ? 1 : 0
          );
        });
        if (!touchState || touchState.length !== touches.length) {
          touchState = [];
        }
        var dx = 0, dy = 0;
        for (var i = 0; i < touches.length; ++i) {
          if (!touchState[i] ||
                touchState[i].identifier !== touches[i].identifier) {
            touchState[i] = {
              x: touches[i].clientX,
              y: touches[i].clientY,
              identifier: touches[i].identifier
            };
          }
          dx += touches[i].clientX - touchState[i].x;
          dy += touches[i].clientY - touchState[i].y;
        }
        moveRelativePx(index, dx / touches.length, dy / touches.length);
        if (touches.length === 2) {
          var x0 = touchState[0].x - touchState[1].x;
          var y0 = touchState[0].y - touchState[1].y;
          var x1 = touches[0].clientX - touches[1].clientX;
          var y1 = touches[0].clientY - touches[1].clientY;
          var s0 = Math.sqrt(x0 * x0 + y0 * y0);
          var s1 = Math.sqrt(x1 * x1 + y1 * y1);
          if (0 < s0 * s1) {
            var r = Math.log(s1 / s0) / Math.LN2;
            r = Math.max(-1, Math.min(1, r));
            zoomRelative(r);
          }
        }
        for (var i = 0; i < touches.length; ++i) {
          touchState[i].x = touches[i].clientX;
          touchState[i].y = touches[i].clientY;
        }
        return false;
      }
    };
    var enableMouse = function(root, filter, deepFilter, selector) {
      $(root).on('mousedown', filter, function(e) {
        return processMouseDown(e, selector, this);
      });
      $(root).on('mousemove', filter, function(e) {
        return processMouseMove(e, selector, this);
      });
      $(root).on('mouseup', filter, resetDragState);
      $(root).on('dblclick', deepFilter, function(e) {
        return processDblclick(e, selector, this);
      });
      $(root).on('wheel', processWheel);
    };
    var enableTouch = function(root, filter, deepFilter, selector) {
      $(root).on('touchmove', filter, function(e) {
        return processTouchMove(e, selector, this);
      });
      $(root).on('touchend', filter, resetTouchState);
    };
    var makeTransform = function(index) {
      var base = getBaseSize(index);
      var center = getCenter();
      return (
        'scale(' + o.scale + (zoomXOnly ? ', 1) ' : ') ') +
        'translate(' + (-center.x * base.w) + 'px,' + (zoomXOnly ? 0 : -center.y * base.h) + 'px)'
      );
    };
    o.setZoom = setZoom;
    o.zoomRelative = zoomRelative;
    o.zoomIn = zoomIn;
    o.zoomOut = zoomOut;
    o.setOffset = setOffset;
    o.getCenter = getCenter;
    o.moveRelative = moveRelative;
    o.moveRelativePx = moveRelativePx;
    o.zoomTo = zoomTo;
    o.zoomToPx = zoomToPx;
    o.processKeyDown = processKeyDown;
    o.resetDragState = resetDragState;
    o.processMouseDown = processMouseDown;
    o.processMouseMove = processMouseMove;
    o.processDblclick = processDblclick;
    o.processWheel = processWheel;
    o.resetTouchState = resetTouchState;
    o.processTouchMove = processTouchMove;
    o.enableMouse = enableMouse;
    o.enableTouch = enableTouch;
    o.makeTransform = makeTransform;
    return o;
  };
  return {
    createObjectURL:        createObjectURL,
    newWorker:              newWorker,
    toggleFullscreen:       toggleFullscreen,
    calcGCD:                calcGCD,
    binaryFromDataURI:      binaryFromDataURI,
    detectPNGChunk:         detectPNGChunk,
    detectMPFIdentifier:    detectMPFIdentifier,
    detectExifOrientation:  detectExifOrientation,
    detectImageFormat:      detectImageFormat,
    makeZoomController:     makeZoomController
  };
})();
