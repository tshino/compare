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
      var baseURL = window.location.href.replace(/\\/g,'/').replace(/\/[^\/]*$/, '/');
      var array = [ 'importScripts("' + baseURL + relativePath + '");' ];
      var blob = new Blob(array, {type: "text/javascript"});
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
      length    : len,
      at        : read,
      big16     : readBig16,
      little16  : readLittle16,
      big32     : readBig32,
    };
  };
  
  var detectPNGChunk = function(binary, target, before) {
    for (var p = 8; p + 8 <= binary.length; ) {
      var len   = binary.big32(p);
      var chunk = binary.big32(p + 4);
      if (chunk == target) { return p; }
      if (chunk == before) { break; }
      p += len + 12;
    }
    return null;
  };
  
  var detectMPFIdentifier = function(binary) {
    for (var p = 0; p + 4 <= binary.length; ) {
      var m = binary.big16(p);
      if (m == 0xffda /* SOS */) { break; }
      if (m == 0xffe2 /* APP2 */) {
        if (binary.big32(p + 4) == 0x4d504600 /* 'MPF\0' */) {
          return p;
        }
      }
      p += 2 + (m == 0xffd8 /* SOI */ ? 0 : binary.big16(p + 2));
    }
    return null;
  };
  
  var detectExifOrientation = function(binary) {
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
  };
  
  var detectImageFormat = function(binary) {
    var magic = binary.length < 4 ? 0 : binary.big32(0);
    var magic2 = binary.length < 8 ? 0 : binary.big32(4);
    
    if (magic == 0x89504e47) {
      // PNG
      if (detectPNGChunk(binary, 0x6163544c /* acTL */, 0x49444154 /* IDAT */)) {
        return 'PNG (APNG)';
      }
      return 'PNG';
    }
    if (magic == 0x47494638) { return 'GIF'; }
    if ((magic & 0xffff0000) == 0x424d0000) { return 'BMP'; }
    if ((magic - (magic & 255)) == 0xffd8ff00) {
      if (detectMPFIdentifier(binary)) {
        return 'JPEG (MPF)';
      }
      return 'JPEG';
    }
    if (magic == 0x4d4d002a || magic == 0x49492a00) { return 'TIFF'; }
    if ((magic  == 0xefbbbf3c /* BOM + '<' */ && magic2 == 0x3f786d6c /* '?xml' */) ||
        (magic == 0x3c3f786d /* '<?xm' */ && (magic2 & 0xff000000) == 0x6c000000 /* 'l' */)) {
        // XML
        var i = 4;
        for (var x; x = binary.at(i); ++i) {
          if (x == 0x3c /* '<' */) {
            var y = binary.at(i + 1);
            if (y != 0x3f /* '?' */ && y != 0x21 /* '!' */) { break; }
          }
        }
        var sig1 = binary.length < i + 4 ? 0 : binary.big32(i);
        if (sig1 == 0x3c737667 /* <svg */) {
          return 'SVG';
        }
    }
    //alert(magic);
    return null;
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
  };
})();
