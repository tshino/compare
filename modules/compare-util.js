var compareUtil = (function() {

  var blobFromDataURI = function(dataURI, type) {
    var parts = dataURI.split(',');
    type = type || parts[0].match(/:(.*?);/)[1];
    var str = atob(parts[1]);
    var n = str.length;
    var buffer = new Uint8Array(n);
    while(n--) {
      buffer[n] = str.charCodeAt(n);
    }
    return new Blob([buffer], {type: type});
  };

  var createObjectURL = function(blob) {
    if (window.URL) {
      return window.URL.createObjectURL(blob);
    } else {
      return window.webkitURL.createObjectURL(blob);
    }
  };
  var revokeObjectURL = function(url) {
    if (window.URL) {
      return window.URL.revokeObjectURL(url);
    } else {
      return window.webkitURL.revokeObjectURL(blob);
    }
  };

  var newWorker = function(relativePath) {
    var newWorkerViaBlob = function(relativePath) {
      var baseURL = window.location.href.replace(/\\/g, '/').replace(/\/[^\/]*$/, '/');
      var path = baseURL + relativePath;
      var array = [
        'var workerLocation = "' + path + '";' +
        'importScripts("' + path + '");'
      ];
      var blob = new Blob(array, {type: 'text/javascript'});
      var url = createObjectURL(blob);
      return new Worker(url);
    };
    try {
      // With this special method:
      // - local MSIE throws an exception (SecurityError).
      return newWorkerViaBlob(relativePath);
    } catch (e) {
      // With this standard method:
      // - local Chrome throws an exception (Failed to construct 'Worker'),
      // - local Firefox doesn't throw but if the path includes '..' the worker doesn't work.
      return new Worker(relativePath);
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

  var clamp = function(num, lower, upper) {
    return Math.max(lower, Math.min(upper, num));
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

  var addComma = function(num) {
    return String(num).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
  };

  var toPercent = function(num) {
    if (num === 0) return '0%';
    if (num === 1) return '100%';
    var digits =
            num < 0.000001 ? 7 :
            num < 0.00001 ? 6 :
            num < 0.0001 ? 5 :
            num < 0.001 ? 4 :
            num < 0.01 ? 3 :
            num < 0.1 ? 2 :
            num < 0.9 ? 1 :
            num < 0.99 ? 2 :
            num < 0.999 ? 3 :
            num < 0.9999 ? 4 :
            num < 0.99999 ? 5 :
            num < 0.999999 ? 6 : 7;
    return (num * 100).toFixed(digits) + '%';
  };

  var HexDigits = '0123456789ABCDEF';
  var toHexTriplet = function(r, g, b) {
    r = clamp(Math.round(r), 0, 255);
    g = clamp(Math.round(g), 0, 255);
    b = clamp(Math.round(b), 0, 255);
    return '#' +
        HexDigits[r >> 4] + HexDigits[r % 16] +
        HexDigits[g >> 4] + HexDigits[g % 16] +
        HexDigits[b >> 4] + HexDigits[b % 16];
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
    var readLittle32 = function(addr) {
      return readLittle16(addr) + readLittle16(addr + 2) * 65536;
    };

    return {
      length:   len,
      at:       read,
      big16:    readBig16,
      little16: readLittle16,
      big32:    readBig32,
      little32: readLittle32
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

  var findJPEGSegment = function(binary, callback) {
    for (var p = 0; p + 4 <= binary.length; ) {
      var m = binary.big16(p);
      if (m === 0xffda /* SOS */) { break; }
      var res = callback(p, m);
      if (res !== undefined) { return res; }
      p += 2 + (m === 0xffd8 /* SOI */ ? 0 : binary.big16(p + 2));
    }
    return null;
  };
  var findAPPnSegment = function(binary, n, name, callback) {
    return findJPEGSegment(binary, function(p, marker) {
      if (marker === 0xffe0 + n && p + 4 + name.length <= binary.length) {
        var i = 0;
        for (; i < name.length; ++i) {
          if (binary.at(p + 4 + i) !== name[i]) { break; }
        }
        if (i === name.length) { return callback ? callback(p) : p; }
      }
    });
  };
  var detectSOFnSegment = function(binary) {
    return findJPEGSegment(binary, function(p, marker) {
      if (0 <= [0, 1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15].indexOf(marker - 0xffc0) &&
          p + 10 <= binary.length) {
        var nf = binary.at(p + 9);
        if (nf === 3 && p + 10 + 9 <= binary.length) {
          var c1 = binary.at(p + 11);
          var c2 = binary.at(p + 14);
          var c3 = binary.at(p + 17);
          var sampling = c1 * 65536 + c2 * 256 + c3;
          var horizontalGCD = calcGCD(c1 >> 4, calcGCD(c2 >> 4, c3 >> 4));
          var verticalGCD = calcGCD(c1 % 16, calcGCD(c2 % 16, c3 % 16));
          var coprime = 1 >= horizontalGCD && 1 >= verticalGCD;
          var samplingPattern = [
            (c1 >> 4) + 'x' + (c1 % 16),
            (c2 >> 4) + 'x' + (c2 % 16),
            (c3 >> 4) + 'x' + (c3 % 16)
          ];
          if (!coprime) {
            sampling = (sampling & 0xf0f0f0) / horizontalGCD + (sampling & 0x0f0f0f) / verticalGCD;
          }
          return { nf: nf, sampling: sampling, samplingPattern: samplingPattern, coprime: coprime };
        } else {
          return { nf: nf };
        }
      }
    });
  };
  var detectJFIFIdentifier = function(binary) {
    var name = [0x4a, 0x46, 0x49, 0x46, 0x00]; // JFIF\0
    return findAPPnSegment(binary, 0 /* APP0 */, name);
  };
  var detectExifOrientation = function(binary) {
    var name = [0x45, 0x78, 0x69, 0x66, 0x00]; // Exif\0
    return findAPPnSegment(binary, 1 /* APP1 */, name, function(p) {
      if (p + 20 > binary.length) { return null; }
      var big = binary.big16(p + 10) === 0x4d4d; /* MM */
      var read16 = big ? binary.big16 : binary.little16;
      var fields = read16(p + 18);
      if (p + 20 + fields * 12 > binary.length) { return null; }
      for (var i = 0, f = p + 20; i < fields; i++, f += 12) {
        if (read16(f) === 0x0112 /* ORIENTATION */) {
          return read16(f + 8);
        }
      }
      return null;
    });
  };
  var detectMPFIdentifier = function(binary) {
    var name = [0x4d, 0x50, 0x46, 0x00]; // MPF\0
    return findAPPnSegment(binary, 2 /* APP2 */, name);
  };
  var detectAdobeIdentifier = function(binary) {
    var name = [0x41, 0x64, 0x6f, 0x62, 0x65]; // Adobe
    return findAPPnSegment(binary, 14 /* APP14 */, name, function(p) {
      if (p + 16 <= binary.length) {
        return {
          tr: binary.at(p + 15)
        };
      }
    });
  };

  var formatReader = (function() {
     var formatInfo = function(desc, color) {
       return {
         toString: function() { return desc; },
         color: color
       };
     };
    var detectPNG = function(binary) {
      var desc = 'PNG';
      if (detectPNGChunk(
                binary, 0x6163544c /* acTL */, 0x49444154 /* IDAT */)) {
        desc += ' (APNG)';
      }
      var color = null;
      var hasTRNS = detectPNGChunk(
                binary, 0x74524e53 /* tRNS */, 0x49444154 /* IDAT */);
      var depth = binary.at(24);
      var colorMode = binary.at(25);
      switch (colorMode) {
        case 0:
          color = 'Grayscale';
          if (0 <= [1, 2, 4, 8, 16].indexOf(depth)) {
            color += ' ' + depth;
            color += ' (' + depth + 'bpp)';
          }
          color += hasTRNS ? ' + Transparent' : '';
          break;
        case 2:
          color = 'RGB';
          if (0 <= [8, 16].indexOf(depth)) {
            color += ' ' + [depth, depth, depth].join('.');
            color += ' (' + 3 * depth + 'bpp)';
          }
          color += hasTRNS ? ' + Transparent' : '';
          break;
        case 3:
          color = 'Indexed ' + (hasTRNS ? 'RGBA 8.8.8.8' : 'RGB 8.8.8');
          if (0 <= [1, 2, 4, 8].indexOf(depth)) {
            color += ' (' + depth + 'bpp)';
          }
          break;
        case 4:
          color = 'Grayscale+Alpha';
          if (0 <= [8, 16].indexOf(depth)) {
            color += ' ' + [depth, depth].join('.');
            color += ' (' + 2 * depth + 'bpp)';
          }
          break;
        case 6:
          color = 'RGBA';
          if (0 <= [8, 16].indexOf(depth)) {
            color += ' ' + [depth, depth, depth, depth].join('.');
            color += ' (' + 4 * depth + 'bpp)';
          }
          break;
        default:
          color = 'unknown';
          break;
      }
      return formatInfo(desc, color);
    };
    var detectGIF = function(binary, magic, magic2) {
      var desc = 'GIF';
      var color = null;
      if (13 <= binary.length) {
        //console.log('GIF sig', '0x' + (0x380000 + (magic2 >>> 16)).toString(16));
        var size = [binary.little16(6), binary.little16(8)];
        var bitfield = binary.at(10);
        var gctFlag = bitfield >> 7;
        var colorRes = (bitfield >> 4) & 0x07;
        var gctLength = bitfield & 0x07;
        var bgIndex = binary.at(11);
        //console.log('size', size.join('x'));
        //console.log('gct', gctFlag, colorRes, gctLength);
        //console.log('bg', bgIndex);
        var transparent, transparentIndex;
        var block = 13 + (gctFlag ? 3 * Math.pow(2, gctLength + 1) : 0);
        while (block + 3 <= binary.length) {
          var initial = binary.at(block);
          if (initial === 0x21) {
            var label = binary.at(block + 1);
            //console.log('ext', '0x' + label.toString(16));
            if (label === 0xf9 /* Graphic Control Extension */ &&
                block + 8 <= binary.length) {
              transparent = binary.at(block + 3) & 0x01;
              transparentIndex = binary.at(block + 6);
              //console.log('transparent', transparent, transparentIndex);
            } else if (label === 0xff /* Application Extension */ &&
                block + 14 <= binary.length) {
              var app0 = binary.big32(block + 3);
              var app1 = binary.big32(block + 7);
              //console.log(app0.toString(16), app1.toString(16));
              if (app0 === 0x4e455453 && app1 == 0x43415045 /* NETS CAPE */) {
                desc += ' (Animated)';
              }
            }
            for (var off = 2; block + off < binary.length; ) {
              var size = binary.at(block + off);
              if (size === 0 /* Block Terminator */) {
                block += off + 1;
                break;
              }
              off += 1 + size;
            }
            continue;
          } else if (initial === 0x2c /* Image Separator */ &&
                block + 10 <= binary.length) {
            var rect = [
              binary.little16(block + 1),
              binary.little16(block + 3),
              binary.little16(block + 5),
              binary.little16(block + 7)
            ];
            var localFlags = binary.at(block + 9);
            var lctFlag = localFlags >> 7;
            var lctLength = localFlags & 0x07;
            //console.log('rect', rect.join(' '));
            //console.log('lct', lctFlag, lctLength);
            var bpp = lctFlag ? (lctLength + 1) : (gctLength + 1);
            color = 'Indexed RGB 8.8.8 (' + bpp + 'bpp)';
            if (transparent && transparentIndex < Math.pow(2, bpp)) {
              color += ' + Transparent';
            }
          }
          break;
        }
      }
      color = color || 'unknown';
      return formatInfo(desc, color);
    };
    var detectBMP = function(binary, magic, magic2) {
      // BMP
      var color = null;
      if (26 <= binary.length) {
        var offBits = binary.little32(10);
        var biSize = binary.little32(14);
        var os2 = 12 === biSize || binary.length < 54;
        var bitCount = os2 ? binary.little16(24) : binary.little16(28);
        var compression = os2 ? 0 : binary.little32(30);
        var mask = [];
        var calcMaskBits = function(mask) {
          var nlz = 0, ntz = 0, bit = 1;
          while (bit < mask && (mask & bit) === 0) {
            ntz += 1;
            bit = bit << 1;
          }
          while (nlz < 32 && (mask >>> (31 - nlz)) === 0) {
            nlz += 1;
          }
          return 32 - nlz - ntz;
        };
        if (compression === 3 /* BI_BITFIELDS */ &&
            (bitCount === 16 || bitCount === 32)) {
          if (56 <= biSize && 70 <= binary.length) {
            mask = [
              calcMaskBits(binary.little32(54)),
              calcMaskBits(binary.little32(54 + 4)),
              calcMaskBits(binary.little32(54 + 8)),
              calcMaskBits(binary.little32(54 + 12))
            ];
            if (mask[3] === 0) {
              mask.pop();
            }
          } else if (14 + biSize + 4 * 3 <= offBits && biSize + 26 <= binary.length) {
            mask = [
              calcMaskBits(binary.little32(14 + biSize)),
              calcMaskBits(binary.little32(14 + biSize + 4)),
              calcMaskBits(binary.little32(14 + biSize + 8))
            ];
          }
        }
        //console.log(biSize);
        //console.log(bitCount);
        //console.log(compression);
        //console.log(mask);
        switch (bitCount) {
          case 1:
            color = 'Indexed RGB 8.8.8 (1bpp)';
            break;
          case 4:
            color = 'Indexed RGB 8.8.8 (4bpp)';
            break;
          case 8:
            color = 'Indexed RGB 8.8.8 (8bpp)';
            break;
          case 16:
            switch (mask.length) {
              case 0: color = 'RGB 5.5.5'; break;
              case 3: color = 'RGB ' + mask.join('.'); break;
              case 4: color = 'RGBA ' + mask.join('.'); break;
              default: color = 'RGB'; break;
            }
            color += ' (16bpp)';
            break;
          case 24:
            color = 'RGB 8.8.8 (24bpp)';
            break;
          case 32:
            switch (mask.length) {
              case 0: color = 'RGB 8.8.8'; break;
              case 3: color = 'RGB ' + mask.join('.'); break;
              case 4: color = 'RGBA ' + mask.join('.'); break;
              default: color = 'RGB'; break;
            }
            color += ' (32bpp)';
            break;
          default:
            color = 'unknown';
            break;
        }
      }
      return formatInfo('BMP', color);
    };
    var detectJPEG = function(binary, magic, magic2) {
      // JPEG
      var desc = 'JPEG';
      var color = null;
      if (detectMPFIdentifier(binary)) {
        desc += ' (MPF)';
      }
      var hasJFIF = detectJFIFIdentifier(binary);
      var hasAdobe = detectAdobeIdentifier(binary);
      var sof = detectSOFnSegment(binary);
      var nf = sof ? sof.nf : null;
      if (!hasJFIF && hasAdobe) {
        color = (hasAdobe.tr === 1 && nf === 3) ? 'YCbCr 8.8.8' : null;
      }
      if (!color) {
        color = nf === 1 ? 'Grayscale 8' : nf === 3 ? 'YCbCr 8.8.8' : 'unknown';
      }
      var samplingPattern = function(components) {
        var s = [];
        for (var i = 0; i < components.length; ++i) {
          s.push(components[i] + '=' + sof.samplingPattern[i]);
        }
        return s.join(' ');
      };
      var sampling = function(s) {
        if (!sof.coprime) {
          return s + '-variant ' + samplingPattern(['Y', 'Cb', 'Cr']);
        } else {
          return s;
        }
      };
      switch (sof.sampling) {
        case 0x111111: color += ' (24bpp ' + sampling('4:4:4') + ')'; break;
        case 0x211111: color += ' (16bpp ' + sampling('4:2:2') + ')'; break;
        case 0x121111: color += ' (16bpp ' + sampling('4:4:0') + ')'; break;
        case 0x221111: color += ' (12bpp ' + sampling('4:2:0') + ')'; break;
        case 0x411111: color += ' (12bpp ' + sampling('4:1:1') + ')'; break;
        case 0x311111: color += ' (40/3 bpp ' + sampling('3:1:1') + ')'; break;
        case 0x421111: color += ' (10bpp ' + sampling('4:1:0') + ')'; break;
        default:
         if (nf === 1) {
           color += ' (8bpp)';
         } else if (nf === 3) {
           color += ' (uncommon sampling ' + samplingPattern(['Y', 'Cb', 'Cr']) + ')';
         }
         break;
      }
      //console.log(hasJFIF);
      //console.log(hasAdobe);
      //console.log(sof);
      return formatInfo(desc, color);
    };
    var detectTIFF = function(binary, magic, magic2) {
      //console.log('TIFF');
      var color = null;
      var read16 = magic === 0x4d4d002a ? binary.big16 : binary.little16;
      var read32 = magic === 0x4d4d002a ? binary.big32 : binary.little32;
      var readIFDValue = function(type, count, offset) {
        if (type < 1 || 5 < type) {
          return [];
        }
        var bytes = [1, 1, 2, 4, 8][type - 1] * count;
        if (4 < bytes) {
          offset = read32(offset);
          if (offset + bytes > binary.length) {
            return [];
          }
        }
        var value = [];
        for (var i = 0; i < count; ++i) {
          switch (type) {
            case 1: case 2:
              value[i] = binary.at(offset + i); break;
            case 3:
              value[i] = read16(offset + i * 2); break;
            case 4:
              value[i] = read32(offset + i * 4); break;
            case 5:
              value[i] = read32(offset + i * 8) / read32(offset + i * 8 + 4); break;
          }
        }
        if (type === 2 /* ASCII */) {
          var string = '';
          for (var i = 0; i < count - 1; ++i) {
            string += String.fromCharCode(value[i]);
          }
          value = [ string ];
        }
        return value;
      };
      if (8 <= binary.length) {
        var ifd = read32(4);
        var ifdCount = ifd + 2 <= binary.length ? read16(ifd) : 0;
        if (ifd + 2 + ifdCount * 12 <= binary.length) {
          var photometricInterpretation = null;
          var bitsPerSample = [1];
          var samplesPerPixel = 1;
          var colorMap = [];
          var extraSamples = [];
          for (var i = 0; i < ifdCount; ++i) {
            var offset = ifd + 2 + i * 12;
            var tag = read16(offset);
            var type = read16(offset + 2);
            var count = read32(offset + 4);
            var value = readIFDValue(type, count, offset + 8);
            //console.log(' tag', '0x' + tag.toString(16), type, value);
            switch (tag) {
              case 262: /* 0x106 PhotometricInterpretation */
                photometricInterpretation = value[0]; break;
              case 277: /* 0x115 SamplesPerPixel */
                samplesPerPixel = value[0]; break;
              case 258: /* 0x102 BitsPerSample */
                bitsPerSample = value; break;
              case 320: /* 0x140 ColorMap */
                colorMap = value; break;
              case 338: /* 0x152 ExtraSamples */
                extraSamples = value; break;
            }
          }
          var alphaIndex = extraSamples.indexOf(1 /* Associated alpha data */);
          var maskIndex = extraSamples.indexOf(2 /* Unassociated alpha data */);
          var makeAlphaNotation = function(baseName, baseIndices, withAlphaName) {
            //console.log('extraSamples', extraSamples);
            var baseBits = baseIndices.map(function(i) { return bitsPerSample[i]; });
            var totalBaseBits = baseBits.reduce(function(a, b) { return a + b; }, 0);
            if (0 <= alphaIndex && alphaIndex < bitsPerSample.length) {
              var alphaBits = bitsPerSample[alphaIndex];
              var name = withAlphaName + ' (pre-multiplied) ' + baseBits.join('.') + '.' + alphaBits;
              return name + ' (' + (totalBaseBits + alphaBits) +  'bpp)';
            } else if (0 <= maskIndex && maskIndex < bitsPerSample.length) {
              var maskBits = bitsPerSample[maskIndex];
              var name = withAlphaName + ' ' + baseBits.join('.') + '.' + maskBits;
              return name + ' (' + (totalBaseBits + maskBits) +  'bpp)';
            } else {
              return baseName + ' ' + baseBits.join('.') + ' (' + totalBaseBits + 'bpp)';
            }
          };
          switch (photometricInterpretation) {
            case 0: case 1:
              if (0 <= [1, 2, 4, 8, 16].indexOf(bitsPerSample[0])) {
                color = makeAlphaNotation('Grayscale', [0], 'Grayscale+Alpha');
              }
              break;
            case 2:
              if (samplesPerPixel >= 3 &&
                  bitsPerSample.length === samplesPerPixel &&
                  bitsPerSample[0] === bitsPerSample[1] &&
                  bitsPerSample[0] === bitsPerSample[2] &&
                  0 <= [8, 16].indexOf(bitsPerSample[0])) {
                color = makeAlphaNotation('RGB', [0, 1, 2], 'RGBA');
              }
              break;
            case 3:
              if (0 <= [1, 2, 4, 8].indexOf(bitsPerSample[0])) {
                //console.log('colorMap', colorMap);
                color = 'Indexed RGB 16.16.16 (' + bitsPerSample[0] + 'bpp)';
              }
              break;
          }
        }
      }
      //console.log('color', color);
      return formatInfo('TIFF', color);
    };
    var detectSVG = function(binary, magic, magic2) {
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
          return formatInfo('SVG');
        }
      }
      return null;
    };
    return {
      detectPNG: detectPNG,
      detectGIF: detectGIF,
      detectBMP: detectBMP,
      detectJPEG: detectJPEG,
      detectTIFF: detectTIFF,
      detectSVG: detectSVG
    };
  })();
  var detectImageFormat = function(binary) {
    var magic = binary.length < 4 ? 0 : binary.big32(0);
    var magic2 = binary.length < 8 ? 0 : binary.big32(4);
    if (magic === 0x89504e47) { // PNG
      return formatReader.detectPNG(binary);
    }
    if (magic === 0x47494638) { // GIF
      return formatReader.detectGIF(binary, magic, magic2);
    }
    if ((magic & 0xffff0000) === 0x424d0000) { // BMP
      return formatReader.detectBMP(binary, magic, magic2);
    }
    if ((magic - (magic & 255)) === 0xffd8ff00) { // JPEG
      return formatReader.detectJPEG(binary, magic, magic2);
    }
    if (magic === 0x4d4d002a || magic === 0x49492a00) { // TIFF
      return formatReader.detectTIFF(binary, magic, magic2);
    }
    var svg = formatReader.detectSVG(binary, magic, magic2);
    if (svg != null) {
      return svg;
    }
    //alert(magic);
    return null;
  };
  var orientationUtil = (function() {
    var stringTable = [
      'Undefined',
      'TopLeft', 'TopRight', 'BottomRight', 'BottomLeft',
      'LeftTop', 'RightTop', 'RightBottom', 'LeftBottom' ];
    var cssTable = {
      2: { transposed: false, transform: ' scale(-1,1)' },
      3: { transposed: false, transform: ' rotate(180deg)' },
      4: { transposed: false, transform: ' scale(-1,1) rotate(180deg)' },
      5: { transposed: true,  transform: ' scale(-1,1) rotate(90deg)' },
      6: { transposed: true,  transform: ' rotate(90deg)' },
      7: { transposed: true,  transform: ' scale(-1,1) rotate(-90deg)' },
      8: { transposed: true,  transform: ' rotate(-90deg)' }
    };
    var toString = function(orientation) {
      return orientation ? (stringTable[orientation] || 'Invalid') : '‐';
    };
    var isTransposed = function(orientation) {
      var o = cssTable[orientation] || { transposed: false, transform: '' };
      return o.transposed;
    };
    var getCSSTransform = function(orientation) {
      var o = cssTable[orientation] || { transposed: false, transform: '' };
      return o.transform;
    };
    var interpretXY = function(orientation, canvasWidth, canvasHeight, x, y) {
      var w = canvasWidth - 1, h = canvasHeight - 1;
      if (orientation === 2) { return { x: w-x, y: y };
      } else if (orientation === 3) { return { x: w-x, y: h-y };
      } else if (orientation === 4) { return { x: x, y: h-y };
      } else if (orientation === 5) { return { x: y, y: x };
      } else if (orientation === 6) { return { x: y, y: h-x };
      } else if (orientation === 7) { return { x: w-y, y: h-x };
      } else if (orientation === 8) { return { x: w-y, y: x };
      } else { return { x: x, y: y };
      }
    };
    return {
      toString: toString,
      isTransposed: isTransposed,
      getCSSTransform: getCSSTransform,
      interpretXY: interpretXY
    };
  })();
  var aspectRatioUtil = (function() {
    var calcAspectRatio = function(w, h) {
      var gcd = calcGCD(w, h);
      w /= gcd;
      h /= gcd;
      return { w: w, h: h, ratio: w / h };
    };
    var findApproxAspectRatio = function(exact) {
      if (exact.w > 50 && exact.h > 50) {
        for (var i = 1; i <= 10; ++i) {
          var a = exact.w / exact.h * i, b = exact.h / exact.w * i;
          var aa = Math.round(a), bb = Math.round(b);
          if (Math.abs(aa - a) < Math.min(i, aa) * 0.004) {
            return { w: aa, h: i };
          }
          if (Math.abs(bb - b) < Math.min(i, bb) * 0.004) {
            return { w: i, h: bb };
          }
        }
      }
      return null;
    };
    var toString = function(ratio) {
      return addComma(ratio.w) + ':' + addComma(ratio.h);
    };
    return {
      calcAspectRatio: calcAspectRatio,
      findApproxAspectRatio: findApproxAspectRatio,
      toString: toString
    };
  })();
  var cursorKeyCodeToXY = function(keyCode, step) {
    step = step !== undefined ? step : 1;
    var x = keyCode === 37 ? -step : keyCode === 39 ? step : 0;
    var y = keyCode === 38 ? -step : keyCode === 40 ? step : 0;
    return { x: x, y: y };
  };
  var calcInscribedRect = function(outerW, outerH, innerW, innerH) {
    var rect = {};
    var isLetterBox = outerW * innerH < outerH * innerW;
    rect.width = isLetterBox ? outerW : outerH * innerW / innerH;
    rect.height = isLetterBox ? outerW * innerH / innerW : outerH;
    return rect;
  };
  var processKeyDownEvent = function(e, callback) {
    // '+;' (59, 187 or 107 for numpad) / PageUp (33)
    if (e.keyCode === 59 || e.keyCode === 187 || e.keyCode === 107 ||
        (e.keyCode === 33 && !e.shiftKey)) {
      if (callback.zoomIn) {
        return callback.zoomIn();
      }
    }
    // '-' (173, 189 or 109 for numpad) / PageDown (34)
    if (e.keyCode === 173 || e.keyCode === 189 || e.keyCode === 109 ||
        (e.keyCode === 34 && !e.shiftKey)) {
      if (callback.zoomOut) {
        return callback.zoomOut();
      }
    }
    // cursor key
    if (37 <= e.keyCode && e.keyCode <= 40) {
      if (callback.cursor) {
        return callback.cursor();
      }
    }
  };
  var processWheelEvent = function(e, callback) {
    var event = e.originalEvent;
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
      return true;
    }
    var deltaScale = event.deltaMode === 0 ? /* PIXEL */ 0.1 : /* LINE */ 1.0;
    var steps = clamp(event.deltaY * deltaScale, -3, 3);
    if (steps !== 0) {
      if (callback.zoom) {
        callback.zoom(steps);
      }
      return false;
    }
  };
  var makeTouchEventFilter = function() {
    var touchState = null;
    var tapPoint = null;
    var resetState = function() {
      touchState = null;
      tapPoint = null;
    };
    var updateState = function(e, callback) {
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
        for (var i = 0; i < touches.length; ++i) {
          if (!touchState[i] ||
                touchState[i].identifier !== touches[i].identifier) {
            touchState[i] = {
              x: touches[i].clientX,
              y: touches[i].clientY,
              identifier: touches[i].identifier
            };
          }
        }
        if (callback) {
          callback(touchState, touches);
        }
        for (var i = 0; i < touches.length; ++i) {
          touchState[i].x = touches[i].clientX;
          touchState[i].y = touches[i].clientY;
          touchState[i].pageX = touches[i].pageX;
          touchState[i].pageY = touches[i].pageY;
        }
        return false;
      }
    };
    var onTouchStart = function(e) {
      return updateState(e, function(lastTouches, touches) {
        if (touches.length === 1) {
          tapPoint = touches[0];
        }
      });
    };
    var onTouchMove = function(e, callback) {
      return updateState(e, function(lastTouches, touches) {
        if (tapPoint) {
          if (touches.length !== 1 ||
              3 <= Math.abs(touches[0].clientX - tapPoint.clientX) ||
              3 <= Math.abs(touches[0].clientY - tapPoint.clientY)) {
            tapPoint = null;
          }
        }
        var dx = 0, dy = 0;
        for (var i = 0; i < touches.length; ++i) {
          dx += touches[i].clientX - lastTouches[i].x;
          dy += touches[i].clientY - lastTouches[i].y;
        }
        dx = dx / touches.length;
        dy = dy / touches.length;
        if (touches.length === 1) {
          if (callback.move) {
            callback.move(dx, dy);
          }
        } else if (touches.length === 2) {
          var x0 = lastTouches[0].x - lastTouches[1].x;
          var y0 = lastTouches[0].y - lastTouches[1].y;
          var x1 = touches[0].clientX - touches[1].clientX;
          var y1 = touches[0].clientY - touches[1].clientY;
          var s0 = Math.sqrt(x0 * x0 + y0 * y0);
          var s1 = Math.sqrt(x1 * x1 + y1 * y1);
          if (0 < s0 * s1) {
            var r = Math.log(s1 / s0) / Math.LN2;
            r = clamp(r, -2, 2);
            var center = {
              pageX: (touches[0].pageX + touches[1].pageX) * 0.5,
              pageY: (touches[0].pageY + touches[1].pageY) * 0.5
            };
            if (callback.zoom) {
              callback.zoom(dx, dy, r, center);
            }
          }
        }
      });
    };
    var onTouchEnd = function(e, callback) {
      if (touchState) {
        updateState(e);
        if (tapPoint && e.originalEvent.touches.length === 0) {
          if (callback.pointClick) {
            callback.pointClick(tapPoint);
          }
          resetState();
        }
        return false;
      }
    };
    return {
      resetState: resetState,
      onTouchStart: onTouchStart,
      onTouchMove: onTouchMove,
      onTouchEnd: onTouchEnd
    };
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
    var pointCallback = null;
    var clickPoint = null;
    var dragStartPoint = null;
    var dragLastPoint = null;
    var touchFilter = makeTouchEventFilter();
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
        setZoom(clamp(o.zoom + delta, 0, MAX_ZOOM_LEVEL));
        update();
        return true;
      }
    };
    var zoomIn = function() { return zoomRelative(+ZOOM_STEP_KEY); };
    var zoomOut = function() { return zoomRelative(-ZOOM_STEP_KEY); };
    var setOffset = function(x, y) {
      x = clamp(x, 0, 1);
      y = zoomXOnly ? 0.5 : clamp(y, 0, 1);
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
    var moveRelativeWithoutUpdate = function(dx, dy) {
      if (1 < o.scale && enabled) {
        return setOffset(
                        o.offset.x + dx / (o.scale - 1),
                        o.offset.y + dy / (o.scale - 1));
      }
    };
    var moveRelative = function(dx, dy) {
      var result = moveRelativeWithoutUpdate(dx, dy);
      if (result) {
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
    var zoomRelativeToPoint = function(dx, dy, delta, pos) {
      if (enabled && pos) {
        if (dx !== 0 || dy !== 0) {
          moveRelativeWithoutUpdate(dx, dy);
        }
        var c1 = getCenter();
        var s1 = o.scale;
        setZoom(clamp(o.zoom + delta, 0, MAX_ZOOM_LEVEL));
        if (1 < o.scale) {
          var x = clamp(pos.x, 0, 1);
          var y = clamp(pos.y, 0, 1);
          var s2 = o.scale;
          var px = x - 0.5;
          var py = y - 0.5;
          var c2x = px - s1 * pos.baseW * (px - c1.x) / (s2 * pos.baseW);
          var c2y = py - s1 * pos.baseH * (py - c1.y) / (s2 * pos.baseH);
          var o2x = c2x / (1 - 1 / o.scale) + 0.5;
          var o2y = c2y / (1 - 1 / o.scale) + 0.5;
          setOffset(o2x, o2y);
        }
        update();
        return true;
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
    var processKeyDown = function(e) {
      return processKeyDownEvent(e, {
        zoomIn: function() { if (zoomIn()) return false; },
        zoomOut: function() { if (zoomOut()) return false; },
        cursor: function() {
          var d = cursorKeyCodeToXY(e.keyCode, cursorMoveDelta);
          if (moveRelative(d.x, d.y)) {
            return false;
          }
        }
      });
    };
    var setPointCallback = function(callback) {
      pointCallback = callback;
    };
    var resetDragState = function() {
      clickPoint = null;
      dragStartPoint = null;
      dragLastPoint = null;
    };
    var positionFromMouseEvent = function(e, target, index) {
      var base = getBaseSize(index);
      return base ? {
        index: index,
        x: (e.pageX - $(target).offset().left) / (o.scale * base.w),
        y: (e.pageY - $(target).offset().top) / (o.scale * base.h),
        baseW: base.w,
        baseH: base.h
      } : null;
    };
    var processPointMouseDown = function(e, selector, target) {
      var index = selector ? $(selector).index($(target).parent()) : null;
      if (e.which === 1) {
        clickPoint = positionFromMouseEvent(e, target, index);
      }
    };
    var processMouseDown = function(e, selector, target) {
      var index = selector ? $(selector).index(target) : null;
      if (getBaseSize(index) && e.which === 1) {
        dragStartPoint = dragLastPoint = { x: e.clientX, y: e.clientY };
        return false;
      }
    };
    var processMouseMove = function(e, selector, target) {
      if (dragLastPoint) {
        if (e.buttons !== 1) {
          clickPoint = null;
          dragStartPoint = null;
          dragLastPoint = null;
        } else {
          var index = selector ? $(selector).index(target) : null;
          if (clickPoint) {
            var ax = Math.abs(e.clientX - dragStartPoint.x);
            var ay = Math.abs(e.clientY - dragStartPoint.y);
            if (3 <= Math.max(ax, ay)) {
              clickPoint = null;
            }
          }
          var dx = e.clientX - dragLastPoint.x;
          var dy = e.clientY - dragLastPoint.y;
          dragLastPoint = { x: e.clientX, y: e.clientY };
          moveRelativePx(index, dx, dy);
          return false;
        }
      }
    };
    var processMouseUp = function(e, selector, target) {
      if (clickPoint && pointCallback) {
        pointCallback(clickPoint);
      }
      resetDragState();
    };
    var processDblclick = function(e, selector, target) {
      var index = selector ? $(selector).index($(target).parent()) : null;
      var pos = positionFromMouseEvent(e, target, index);
      if (pos) {
        zoomTo(pos.x, pos.y);
        return false;
      }
      return true;
    };
    var processWheel = function(e, selector, relSelector, target) {
      return processWheelEvent(e, {
        zoom: function(steps) {
          if (selector && relSelector) {
            var index = $(selector).index(target);
            target = $(target).find(relSelector);
            if (target.length !== 0) {
              var pos = positionFromMouseEvent(e, target, index);
              zoomRelativeToPoint(0, 0, -steps * ZOOM_STEP_WHEEL, pos);
            }
          } else {
            zoomRelative(-steps * ZOOM_STEP_WHEEL);
          }
        }
      });
    };
    var resetTouchState = function() { touchFilter.resetState(); };
    var processTouchStart = function(e) {
      return touchFilter.onTouchStart(e);
    };
    var processTouchMove = function(e, selector, relSelector, target) {
      var index = selector ? $(selector).index(target) : null;
      var ret = touchFilter.onTouchMove(e, {
        move: function(dx, dy) {
          moveRelativePx(index, dx, dy);
        },
        zoom: function(dx, dy, r, center) {
          if (center && selector && relSelector) {
            target = $(target).find(relSelector);
            var base = getBaseSize(index);
            dx = -dx / base.w;
            dy = -dy / base.h;
            var pos = positionFromMouseEvent(center, target, index);
            zoomRelativeToPoint(dx, dy, r, pos);
          } else {
            zoomRelative(r);
          }
        }
      });
    };
    var processTouchEnd = function(e, selector, relSelector, target) {
      return touchFilter.onTouchEnd(e, {
        pointClick: function(lastTouch) {
          if (pointCallback && relSelector) {
            var index = selector ? $(selector).index(target) : null;
            target = $(target).find(relSelector);
            var pos = positionFromMouseEvent(lastTouch, target, index);
            pointCallback(pos);
          }
        }
      });
    };
    var enableMouseAndTouch = function(root, filter, deepFilter, selector, relSelector) {
      $(root).on('mousedown', deepFilter, function(e) {
        return processPointMouseDown(e, selector, this);
      });
      $(root).on('mousedown', filter, function(e) {
        return processMouseDown(e, selector, this);
      });
      $(root).on('mousemove', filter, function(e) {
        return processMouseMove(e, selector, this);
      });
      $(root).on('mouseup', filter, function(e) {
        return processMouseUp(e, selector, this);
      });
      $(root).on('dblclick', deepFilter, function(e) {
        return processDblclick(e, selector, this);
      });
      $(root).on('wheel', filter, function(e) {
        return processWheel(e, selector, relSelector, this);
      });
      $(root).on('touchstart', filter, function(e) {
        return processTouchStart(e);
      });
      $(root).on('touchmove', filter, function(e) {
        return processTouchMove(e, selector, relSelector, this);
      });
      $(root).on('touchend', filter, function(e) {
        return processTouchEnd(e, selector, relSelector, this);
      });
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
    //o.moveRelativePx = moveRelativePx;
    //o.zoomTo = zoomTo;
    o.processKeyDown = processKeyDown;
    o.setPointCallback = setPointCallback;
    o.positionFromMouseEvent = positionFromMouseEvent;
    o.resetDragState = resetDragState;
    //o.processMouseDown = processMouseDown;
    //o.processMouseMove = processMouseMove;
    //o.processDblclick = processDblclick;
    //o.processWheel = processWheel;
    //o.resetTouchState = resetTouchState;
    //o.processTouchMove = processTouchMove;
    o.enableMouseAndTouch = enableMouseAndTouch;
    o.makeTransform = makeTransform;
    return o;
  };
  var makeTaskQueue = function(workerPath, processResult) {
    var worker = newWorker(workerPath);
    var taskCount = 0;
    var taskQueue = [];
    var kickNextTask = function() {
      if (taskCount === 0 && 0 < taskQueue.length) {
        var task = taskQueue.shift();
        if (task.prepare && false === task.prepare(task.data)) {
          return;
        }
        worker.postMessage(task.data);
        ++taskCount;
      }
    };
    var addTask = function(data, prepare) {
      var task = { data: data, prepare: prepare };
      taskQueue.push(task);
      window.setTimeout(kickNextTask, 0);
    };
    var discardTasksOf = function(pred) {
      taskQueue = taskQueue.filter(function(task,i,a) { return !pred(task); });
    };
    worker.addEventListener('message', function(e) {
      processResult(e.data);
      --taskCount;
      window.setTimeout(kickNextTask, 0);
    }, false);
    return {
      addTask: addTask,
      discardTasksOf: discardTasksOf
    };
  };
  return {
    blobFromDataURI:        blobFromDataURI,
    createObjectURL:        createObjectURL,
    revokeObjectURL:        revokeObjectURL,
    newWorker:              newWorker,
    toggleFullscreen:       toggleFullscreen,
    clamp:                  clamp,
    calcGCD:                calcGCD,
    addComma:               addComma,
    toPercent:              toPercent,
    toHexTriplet:           toHexTriplet,
    binaryFromDataURI:      binaryFromDataURI,
    detectPNGChunk:         detectPNGChunk,
    detectMPFIdentifier:    detectMPFIdentifier,
    detectExifOrientation:  detectExifOrientation,
    detectImageFormat:      detectImageFormat,
    orientationUtil:        orientationUtil,
    aspectRatioUtil:        aspectRatioUtil,
    cursorKeyCodeToXY:      cursorKeyCodeToXY,
    calcInscribedRect:      calcInscribedRect,
    processKeyDownEvent:    processKeyDownEvent,
    processWheelEvent:      processWheelEvent,
    makeTouchEventFilter:   makeTouchEventFilter,
    makeZoomController:     makeZoomController,
    makeTaskQueue:          makeTaskQueue
  };
})();
