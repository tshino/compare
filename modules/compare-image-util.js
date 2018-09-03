var compareImageUtil = (function() {

  var FORMAT_U8x4  = 0x0104;
  var FORMAT_F32x1 = 0x0401;

  var channelsOf = function(format) {
    return format ? (format & 0x00ff) : 0x0004;
  };
  var newArrayOf = function(format, size) {
    var elementType = format ? (format & 0xff00) : 0x0100;
    if (elementType === 0x0400) {
      return new Float32Array(size);
    } else { // 0x0100
      return new Uint8Array(size);
    }
  };

  var makeImage = function(a, b, format) {
    if (b === undefined) {
      var ch = a.channels !== undefined ? a.channels : 4;
      return {
        width:  a.width,
        height: a.height,
        data:   a.data,
        pitch:  (a.pitch !== undefined ? a.pitch : a.width),
        offset: (a.offset !== undefined ? a.offset : 0),
        channels: ch,
        format: (ch === 4 ? FORMAT_U8x4 : FORMAT_F32x1)
      };
    } else {
      var ch = channelsOf(format);
      return {
        width:    a,
        height:   b,
        data:     newArrayOf(format, a * b * ch),
        pitch:    a,
        offset:   0,
        channels: ch,
        format: (ch === 4 ? FORMAT_U8x4 : FORMAT_F32x1)
      };
    }
  };
  var makeRegion = function(image, left, top, width, height) {
    image = makeImage(image);
    left   = left   !== undefined ? left   : 0;
    top    = top    !== undefined ? top    : 0;
    var right  = width  !== undefined ? left + width : image.width;
    var bottom = height !== undefined ? top + height : image.height;
    left   = Math.max(0,    Math.min(image.width, left));
    top    = Math.max(0,    Math.min(image.height, top));
    right  = Math.max(left, Math.min(image.width, right));
    bottom = Math.max(top,  Math.min(image.height, bottom));
    return {
      width: right - left,
      height: bottom - top,
      data: image.data,
      pitch: image.pitch,
      offset: image.offset + left + image.pitch * top,
      channels: image.channels,
      format: image.format
    };
  };
  var fill = function(image, r, g, b, a) {
    image = makeImage(image);
    var w = image.width, h = image.height;
    var ch = image.channels;
    var i = image.offset * ch;
    var v = [r, g, b, a];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var k = 0; k < ch; k++, i++) {
          image.data[i] = v[k];
        }
      }
      i += (image.pitch - w) * ch;
    }
  };
  var copy = function(dest, src) {
    dest = makeImage(dest);
    src = makeImage(src);
    if (dest.channels !== src.channels) {
      return;
    }
    var w = Math.min(dest.width, src.width), h = Math.min(dest.height, src.height);
    var ch = src.channels;
    var i = dest.offset * ch, j = src.offset * ch;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w * ch; x++, i++, j++) {
        dest.data[i] = src.data[j];
      }
      i += (dest.pitch - w) * ch;
      j += (src.pitch - w) * ch;
    }
  };
  var rotate = function(dest, src) {
    dest = makeImage(dest);
    src = makeImage(src);
    if (dest.channels !== src.channels) {
      return;
    }
    var dw = Math.min(dest.width, src.height), dh = Math.min(dest.height, src.width);
    var ch = src.channels;
    var i = dest.offset * ch, j = (src.offset + src.pitch * (dw - 1)) * ch;
    for (var y = 0; y < dh; y++) {
      for (var x = 0; x < dw; x++, i += ch, j -= src.pitch * ch) {
        dest.data[i] = src.data[j];
        dest.data[i+1] = src.data[j+1];
        dest.data[i+2] = src.data[j+2];
        dest.data[i+3] = src.data[j+3];
      }
      i += (dest.pitch - dw) * ch;
      j += (src.pitch * dw + 1) * ch;
    }
  };
  var flipH = function(dest, src) {
    dest = makeImage(dest);
    src = makeImage(src);
    if (dest.channels !== src.channels) {
      return;
    }
    var w = Math.min(dest.width, src.width), h = Math.min(dest.height, src.height);
    var ch = src.channels;
    var i = dest.offset * ch, j = (src.offset + w - 1) * ch;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++, i += ch, j -= ch) {
        dest.data[i] = src.data[j];
        dest.data[i+1] = src.data[j+1];
        dest.data[i+2] = src.data[j+2];
        dest.data[i+3] = src.data[j+3];
      }
      i += (dest.pitch - w) * ch;
      j += (src.pitch + w) * ch;
    }
  };
  var flipV = function(dest, src) {
    dest = makeImage(dest);
    src = makeImage(src);
    if (dest.channels !== src.channels) {
      return;
    }
    var w = Math.min(dest.width, src.width), h = Math.min(dest.height, src.height);
    var ch = src.channels;
    var i = dest.offset * ch, j = (src.offset + src.pitch * (h - 1)) * ch;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++, i += ch, j += ch) {
        dest.data[i] = src.data[j];
        dest.data[i+1] = src.data[j+1];
        dest.data[i+2] = src.data[j+2];
        dest.data[i+3] = src.data[j+3];
      }
      i += (dest.pitch - w) * ch;
      j -= (src.pitch + w) * ch;
    }
  };
  var readSubPixel = function(src, left, top, width, height) {
    src = makeImage(src);
    var region = makeImage(width, height, FORMAT_F32x1);
    var iLeft = Math.floor(left);
    var iTop = Math.floor(top);
    var sampleX = [], sampleY = [];
    for (var i = 0; i < width; ++i) {
      sampleX[i * 2] = Math.max(0, Math.min(src.width - 1, iLeft + i));
      sampleX[i * 2 + 1] = Math.max(0, Math.min(src.width - 1, iLeft + i + 1));
    }
    for (var i = 0; i < height; ++i) {
      sampleY[i * 2] = Math.max(0, Math.min(src.height - 1, iTop + i));
      sampleY[i * 2 + 1] = Math.max(0, Math.min(src.height - 1, iTop + i + 1));
    }
    var rx = left - iLeft;
    var ry = top - iTop;
    var a00 = (1 - rx) * (1 - ry);
    var a01 = rx * (1 - ry);
    var a10 = (1 - rx) * ry;
    var a11 = rx * ry;
    var ch = src.channels;
    var i = 0;
    for (var b = 0; b < height; ++b) {
      var y0 = sampleY[b * 2], y1 = sampleY[b * 2 + 1];
      var k0 = (src.offset + src.pitch * y0) * ch;
      var k1 = (src.offset + src.pitch * y1) * ch;
      for (var a = 0; a < width; ++a) {
        var x0 = sampleX[a * 2], x1 = sampleX[a * 2 + 1];
        var c00 = a00 * src.data[k0 + x0 * ch];
        var c01 = a01 * src.data[k0 + x1 * ch];
        var c10 = a10 * src.data[k1 + x0 * ch];
        var c11 = a11 * src.data[k1 + x1 * ch];
        region.data[i++] = c00 + c01 + c10 + c11;
      }
    }
    return region;
  };
  var convertToGrayscale = function(dest, src) {
    dest = makeImage(dest);
    src = makeImage(src);
    var w = Math.min(dest.width, src.width), h = Math.min(dest.height, src.height);
    var i = dest.offset * dest.channels, j = src.offset * src.channels;
    var read = src.channels === 4 ? function(k) {
      var r = src.data[k    ];
      var g = src.data[k + 1];
      var b = src.data[k + 2];
      var a = src.data[k + 3];
      return [a, 0.299 * r + 0.587 * g + 0.114 * b];
    } : function(k) {
      return [255, src.data[k]];
    };
    var write = dest.channels === 4 ? function(k, val) {
      var v = Math.round(val[1]);
      dest.data[k    ] = v;
      dest.data[k + 1] = v;
      dest.data[k + 2] = v;
      dest.data[k + 3] = val[0];
    } : function(k, val) {
      dest.data[k] = val[1] * val[0] * (1/255);
    };
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++, i += dest.channels, j += src.channels) {
        write(i, read(j));
      }
      i += (dest.pitch - w) * dest.channels;
      j += (src.pitch - w) * src.channels;
    }
  };
  var resizeNN = function(dest, src) {
    dest = makeImage(dest);
    src = makeImage(src);
    if (src.channels !== dest.channels) {
      return;
    }
    var w = dest.width, h = dest.height;
    var mw = src.width / w, mh = src.height / h;
    var i = dest.offset * dest.channels;
    var ddata = dest.data, sdata = src.data;
    var floor = Math.floor;
    var so = new Uint32Array(w);
    for (var x = 0; x < w; x++) {
      so[x] = src.channels * floor((x + 0.5) * mw);
    }
    for (var y = 0; y < h; y++) {
      var sy = floor((y + 0.5) * mh);
      var j0 = (src.offset + src.pitch * sy) * src.channels;
      if (src.channels === 4) {
        for (var x = 0; x < w; x++, i += 4) {
          var j = j0 + so[x];
          var r = sdata[j    ];
          var g = sdata[j + 1];
          var b = sdata[j + 2];
          var a = sdata[j + 3];
          ddata[i    ] = r;
          ddata[i + 1] = g;
          ddata[i + 2] = b;
          ddata[i + 3] = a;
        }
      } else {
        for (var x = 0; x < w; x++, i += 1) {
          ddata[i] = sdata[j0 + so[x]];
        }
      }
      i += (dest.pitch - w) * dest.channels;
    }
  };
  var resizeBilinear = function(dest, src) {
    dest = makeImage(dest);
    src = makeImage(src);
    var w = dest.width, h = dest.height;
    var sw = src.width, sh = src.height;
    var mw = sw / w, mh = sh / h;
    var ddata = dest.data, sdata = src.data;
    var round = Math.round;
    var floor = Math.floor;
    var sxo = new Uint32Array(w * 2);
    var fx = new Float32Array(w * 2);
    for (var x = 0; x < w; x++) {
      var rx = (x + 0.5) * mw - 0.5;
      var sx0 = floor(rx);
      var sx1 = sx0 + 1;
      var fx1 = rx - sx0;
      if (sx0 < 0) { sx0 = sx1 = 0; fx1 = 0; }
      if (sx1 >= sw) { sx0 = sx1 = sw - 1; fx1 = 0; }
      var fx0 = 1 - fx1;
      sxo[x * 2    ] = sx0 * 4;
      sxo[x * 2 + 1] = sx1 * 4;
      fx[x * 2    ] = fx0;
      fx[x * 2 + 1] = fx1;
    }
    var syo = new Uint32Array(h * 2);
    var fy = new Float32Array(h * 2);
    for (var y = 0; y < h; y++) {
      var ry = (y + 0.5) * mh - 0.5;
      var sy0 = floor(ry);
      var sy1 = sy0 + 1;
      var fy1 = ry - sy0;
      if (sy0 < 0) { sy0 = sy1 = 0; fy1 = 0; }
      if (sy1 >= sh) { sy0 = sy1 = sh - 1; fy1 = 0; }
      var fy0 = 1 - fy1;
      syo[y * 2    ] = w * sy0 * 4;
      syo[y * 2 + 1] = w * sy1 * 4;
      fy[y * 2    ] = fy0;
      fy[y * 2 + 1] = fy1;
    }
    var kdata = new Float32Array(w * sh * 4);
    var k = 0;
    var j = src.offset * 4;
    for (var jh = j + src.pitch * 4 * sh; j < jh; ) {
      var f = 0;
      for (var fw = w * 2; f < fw; k += 4) {
        var j0  = j + sxo[f];
        var fx0 = fx[f];
        f++;
        var j1  = j + sxo[f];
        var fx1 = fx[f];
        f++;
        var r = sdata[j0    ] * fx0 + sdata[j1    ] * fx1;
        var g = sdata[j0 + 1] * fx0 + sdata[j1 + 1] * fx1;
        var b = sdata[j0 + 2] * fx0 + sdata[j1 + 2] * fx1;
        var a = sdata[j0 + 3] * fx0 + sdata[j1 + 3] * fx1;
        kdata[k    ] = r;
        kdata[k + 1] = g;
        kdata[k + 2] = b;
        kdata[k + 3] = a;
      }
      j += src.pitch * 4;
    }
    var i = dest.offset * 4;
    var igap = (dest.pitch - w) * 4;
    f = 0;
    for (var fh = h * 2; f < fh; ) {
      var k0 = syo[f];
      var fy0 = fy[f];
      f++;
      var k1 = syo[f];
      var fy1 = fy[f];
      f++;
      for (var iw = i + w * 4; i < iw; i += 4, k0 += 4, k1 += 4) {
        var r = kdata[k0    ] * fy0 + kdata[k1    ] * fy1;
        var g = kdata[k0 + 1] * fy0 + kdata[k1 + 1] * fy1;
        var b = kdata[k0 + 2] * fy0 + kdata[k1 + 2] * fy1;
        var a = kdata[k0 + 3] * fy0 + kdata[k1 + 3] * fy1;
        ddata[i    ] = round(r);
        ddata[i + 1] = round(g);
        ddata[i + 2] = round(b);
        ddata[i + 3] = round(a);
      }
      i += igap;
    }
  };
  var resizeGeneral = function(dest, src, filterSize, filterFunc) {
    dest = makeImage(dest);
    src = makeImage(src);
    if (src.channels !== dest.channels) {
      return;
    }
    var ch = src.channels;
    var w = dest.width, h = dest.height;
    var sw = src.width, sh = src.height;
    var mw = sw / w, mh = sh / h;
    var ddata = dest.data, sdata = src.data;
    var round = Math.round;
    var floor = Math.floor;
    var sxo = new Uint32Array(w * filterSize);
    var fx = new Float32Array(w * filterSize);
    for (var x = 0; x < w; x++) {
      var rx = (x + 0.5) * mw - 0.5;
      var sx = floor(rx) - filterSize / 2 + 1;
      var sum = 0;
      for (var f = 0; f < filterSize; ++f) {
        var val = filterFunc(rx - sx);
        sum += val;
        sxo[x * filterSize + f] = ch * Math.min(sw - 1, Math.max(0, sx));
        fx[x * filterSize + f] = val;
        ++sx;
      }
      for (var f = 0; f < filterSize; ++f) {
        fx[x * filterSize + f] /= sum;
      }
    }
    var syo = new Uint32Array(h * filterSize);
    var fy = new Float32Array(h * filterSize);
    for (var y = 0; y < h; y++) {
      var ry = (y + 0.5) * mh - 0.5;
      var sy = floor(ry) - filterSize / 2 + 1;
      var sum = 0;
      for (var f = 0; f < filterSize; ++f) {
        var val = filterFunc(ry - sy);
        sum += val;
        syo[y * filterSize + f] = ch * w * Math.min(sh - 1, Math.max(0, sy));
        fy[y * filterSize + f] = val;
        ++sy;
      }
      for (var f = 0; f < filterSize; ++f) {
        fy[y * filterSize + f] /= sum;
      }
    }
    var kdata = new Float32Array(w * sh * ch);
    var k = 0;
    var j = src.offset * ch;
    for (var jh = j + src.pitch * ch * sh; j < jh; ) {
      var f = 0;
      if (ch === 4) {
        for (var fw = w * filterSize; f < fw; k += ch) {
          var r = 0, g = 0, b = 0, a = 0;
          for (var fi = f + filterSize; f < fi; f++) {
            var j0  = j + sxo[f];
            var fx0 = fx[f];
            r += sdata[j0    ] * fx0;
            g += sdata[j0 + 1] * fx0;
            b += sdata[j0 + 2] * fx0;
            a += sdata[j0 + 3] * fx0;
          }
          kdata[k    ] = r;
          kdata[k + 1] = g;
          kdata[k + 2] = b;
          kdata[k + 3] = a;
        }
      } else {
        for (var fw = w * filterSize; f < fw; k += ch) {
          var v = 0;
          for (var fi = f + filterSize; f < fi; f++) {
            v += sdata[j + sxo[f]] * fx[f];
          }
          kdata[k] = v;
        }
      }
      j += src.pitch * ch;
    }
    var i = dest.offset * ch;
    var igap = (dest.pitch - w) * ch;
    f = 0;
    for (var fh = h * filterSize; f < fh; ) {
      var k0a = [];
      var fy0a = [];
      for (var fi = 0; fi < filterSize; fi++, f++) {
        k0a[fi] = syo[f];
        fy0a[fi] = fy[f];
      }
      var k = 0;
      if (ch === 4) {
        for (var iw = i + w * ch; i < iw; i += ch, k += ch) {
          var r = 0, g = 0, b = 0, a = 0;
          for (var fi = 0; fi < filterSize; fi++) {
            var k0 = k0a[fi] + k;
            var fy0 = fy0a[fi];
            r += kdata[k0    ] * fy0;
            g += kdata[k0 + 1] * fy0;
            b += kdata[k0 + 2] * fy0;
            a += kdata[k0 + 3] * fy0;
          }
          ddata[i    ] = round(Math.min(255, Math.max(0, r)));
          ddata[i + 1] = round(Math.min(255, Math.max(0, g)));
          ddata[i + 2] = round(Math.min(255, Math.max(0, b)));
          ddata[i + 3] = round(Math.min(255, Math.max(0, a)));
        }
      } else {
        for (var iw = i + w * ch; i < iw; i += ch, k += ch) {
          var v = 0;
          for (var fi = 0; fi < filterSize; fi++) {
            v += kdata[k0a[fi] + k] * fy0a[fi];
          }
          ddata[i] = v;
        }
      }
      i += igap;
    }
  };
  var resizeLanczos2 = function(dest, src) {
    var sinc = function(x) {
      x = x * Math.PI;
      if (-0.01 < x && x < 0.01) {
        return 1 + x * x * (-1 / 6 + x * x * (1 / 120));
      } else {
        return Math.sin(x) / x;
      }
    };
    return resizeGeneral(dest, src, 4, function(x) {
      return sinc(x) * sinc(x / 2);
    });
  };
  var resizeLanczos3 = function(dest, src) {
    var sinc = function(x) {
      x = x * Math.PI;
      if (-0.01 < x && x < 0.01) {
        return 1 + x * x * (-1 / 6 + x * x * (1 / 120));
      } else {
        return Math.sin(x) / x;
      }
    };
    return resizeGeneral(dest, src, 6, function(x) {
      return sinc(x) * sinc(x / 3);
    });
  };
  var resize = function(dest, src, method) {
    method = method !== undefined ? method : 'bilinear';
    //console.time(method); for (var i = 0; i < 100; ++i) {
    if (method === 'nn') {
      resizeNN(dest, src);
    } else if (method === 'bilinear') {
      resizeBilinear(dest, src);
    } else if (method === 'lanczos2') {
      resizeLanczos2(dest, src);
    } else if (method === 'lanczos3') {
      resizeLanczos3(dest, src);
    } else {
      console.log('unexpected argument: ' + method);
    }
    //} console.timeEnd(method);
  };
  var gaussianBlur = function(dest, src, stdev) {
    //console.log('blur :' + src.width + 'x' + src.height + ' => ' +
    //            dest.width + 'x' + dest.height + ' (' + stdev + ')');
    var filterSize = Math.round(4 * stdev) * 2;
    if (filterSize === 0) {
      return resizeNN(dest, src);
    }
    var a = 1 / Math.sqrt(2 * Math.PI * stdev * stdev);
    var b = -1 / (2 * stdev * stdev);
    var gaussian = function(x) {
      return a * Math.exp(b * x * x);
    };
    return resizeGeneral(dest, src, filterSize, gaussian);
  };
  var resizeWithGaussianBlur = function(dest, src) {
    var lx = Math.log(dest.width / src.width);
    var ly = Math.log(dest.height / src.height);
    var n = Math.max(1, Math.round(Math.max(-lx, -ly) / Math.log(2)));
    for (var k = 0; k < n; ++k) {
      var sx = Math.exp(lx / n);
      var sy = Math.exp(ly / n);
      var w = Math.round(src.width * sx);
      var h = Math.round(src.height * sy);
      var temp = k + 1 < n ? makeImage(w, h) : dest;
      var stdev = 0.5 / Math.min(sx, sy);
      gaussianBlur(temp, src, stdev);
      src = temp;
    }
  };
  var convolution = function(dest, src, kernelSize, kernel) {
    dest = makeImage(dest);
    src = makeImage(src);
    var w = dest.width, h = dest.height;
    if (src.width !== w || src.height !== h || src.channels !== dest.channels) {
      return;
    }
    var kw = kernelSize.w, kh = kernelSize.h;
    var ox = Math.floor(kw / 2);
    var oy = Math.floor(kh / 2);
    var i = dest.offset * dest.channels;
    var ddata = dest.data, sdata = src.data;
    var round = Math.round;
    var sxo = new Uint32Array(w * kw);
    var syo = new Uint32Array(h * kh);
    for (var x = 0; x < w; x++) {
      for (var k = 0; k < kw; k++) {
        var kx = Math.max(0, Math.min(w - 1, x + ox - k));
        sxo[x * kw + k] = src.channels * kx;
      }
    }
    for (var y = 0; y < h; y++) {
      for (var k = 0; k < kh; k++) {
        var ky = Math.max(0, Math.min(h - 1, y + oy - k));
        syo[y * kh + k] = src.channels * src.pitch * ky;
      }
    }
    var j0 = src.offset * src.channels;
    var readWrite = src.channels === 4 ? function(x, y, write) {
      var r = 0, g = 0, b = 0, a = 0;
      for (var ky = 0, k = 0; ky < kh; ky++) {
        var jy = j0 + syo[y * kh + ky];
        for (var kx = 0; kx < kw; kx++, k++) {
          var j = jy + sxo[x * kw + kx];
          var c = kernel[k];
          r += c * sdata[j    ];
          g += c * sdata[j + 1];
          b += c * sdata[j + 2];
          a += c * sdata[j + 3];
        }
      };
      write(r, g, b, a);
    } : function(x, y, write) {
      var v = 0;
      for (var ky = 0, k = 0; ky < kh; ky++) {
        var jy = j0 + syo[y * kh + ky];
        for (var kx = 0; kx < kw; kx++, k++) {
          var j = jy + sxo[x * kw + kx];
          var c = kernel[k];
          v += c * sdata[j];
        }
      };
      write(v);
    };
    var write = dest.channels === 4 ? function(r, g, b, a) {
      ddata[i    ] = Math.max(0, Math.min(255, round(128 + r)));
      ddata[i + 1] = Math.max(0, Math.min(255, round(128 + g)));
      ddata[i + 2] = Math.max(0, Math.min(255, round(128 + b)));
      ddata[i + 3] = Math.max(0, Math.min(255, round(128 + a)));
    } : function(v) {
      ddata[i] = v;
    };
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++, i += dest.channels) {
        readWrite(x, y, write);
      }
      i += (dest.pitch - w) * dest.channels;
    }
  };
  var sobelX = function(dest, src) {
    convolution(dest, src, { w: 3, h: 3 }, [
      1, 0, -1,
      2, 0, -2,
      1, 0, -1
    ]);
  };
  var sobelY = function(dest, src) {
    convolution(dest, src, { w: 3, h: 3 }, [
       1,  2,  1,
       0,  0,  0,
      -1, -2, -1
    ]);
  };
  var scharrX = function(dest, src) {
    convolution(dest, src, { w: 3, h: 3 }, [
       3, 0,  -3,
      10, 0, -10,
       3, 0,  -3
    ]);
  };
  var scharrY = function(dest, src) {
    convolution(dest, src, { w: 3, h: 3 }, [
       3,  10,  3,
       0,   0,  0,
      -3, -10, -3
    ]);
  };
  var dilate3x1 = function(dest, src) {
    dest = makeImage(dest);
    src = makeImage(src);
    if (dest.channels !== src.channels) {
      return;
    }
    var w = Math.min(dest.width, src.width), h = Math.min(dest.height, src.height);
    var ch = dest.channels;
    if (w < 2) {
      copy(dest, src);
      return;
    }
    var i = dest.offset * ch, j = src.offset * ch;
    for (var y = 0; y < h; y++) {
      for (var k = 0; k < ch; k++, i++, j++) {
        dest.data[i] = Math.max(src.data[j], src.data[j + ch]);
      }
      j -= ch;
      for (var k = ch * (w - 2); k > 0; k--, i++, j++) {
        dest.data[i] = Math.max(src.data[j], src.data[j + ch], src.data[j + ch * 2]);
      }
      for (var k = 0; k < ch; k++, i++, j++) {
        dest.data[i] = Math.max(src.data[j], src.data[j + ch]);
      }
      i += (dest.pitch - w) * ch;
      j += (src.pitch - w + 1) * ch;
    }
  };
  var dilate1x3 = function(dest, src) {
    dest = makeImage(dest);
    src = makeImage(src);
    if (dest.channels !== src.channels) {
      return;
    }
    var w = Math.min(dest.width, src.width), h = Math.min(dest.height, src.height);
    var ch = dest.channels;
    if (h < 2) {
      copy(dest, src);
      return;
    }
    var i = dest.offset * ch;
    for (var y = 0; y < h; y++) {
      var j0 = (src.offset + src.pitch * Math.max(0, y - 1)) * ch;
      var j1 = (src.offset + src.pitch * y) * ch;
      var j2 = (src.offset + src.pitch * Math.min(h - 1, y + 1)) * ch;
      for (var k = ch * w; k > 0; k--) {
        dest.data[i++] = Math.max(src.data[j0++], src.data[j1++], src.data[j2++]);
      }
      i += (dest.pitch - w) * ch;
    }
  };
  var dilate3x3 = function(dest, src) {
    src = makeImage(src);
    var temp = makeImage(src.width, src.height, src.format);
    dilate3x1(temp, src);
    dilate1x3(dest, temp);
  };
  var estimateMotionImpl = function(a, b, offsetX, offsetY, blurStdev) {
    offsetX = offsetX === undefined ? 0 : offsetX;
    offsetY = offsetY === undefined ? 0 : offsetY;
    var offsetXi = Math.round(offsetX);
    var offsetYi = Math.round(offsetY);
    if (0 !== offsetXi || 0 !== offsetYi) {
      if (Math.abs(offsetXi) >= a.width || Math.abs(offsetYi) >= a.height) {
        return null;
      }
      a = makeRegion(a,
                     Math.max(0, offsetXi),
                     Math.max(0, offsetYi),
                     a.width - Math.abs(offsetXi),
                     a.height - Math.abs(offsetYi));
      b = makeRegion(b,
                     Math.max(0, -offsetXi),
                     Math.max(0, -offsetYi),
                     b.width - Math.abs(offsetXi),
                     b.height - Math.abs(offsetYi));
    }
    var w = 256, h = 256;
    var baseA = makeImage(w, h);
    var baseB = makeImage(w, h);
    var blurA = makeImage(w, h);
    var blurB = makeImage(w, h);
    resizeWithGaussianBlur(baseA, a);
    resizeWithGaussianBlur(baseB, b);
    gaussianBlur(blurA, baseA, blurStdev);
    gaussianBlur(blurB, baseB, blurStdev);
    var gradAX = makeImage(w, h);
    var gradBX = makeImage(w, h);
    var gradAY = makeImage(w, h);
    var gradBY = makeImage(w, h);
    sobelX(gradAX, blurA);
    sobelX(gradBX, blurB);
    sobelY(gradAY, blurA);
    sobelY(gradBY, blurB);
    var output = makeImage(w, h);
    var images = [ blurA, blurB, gradAX, gradBX, gradAY, gradBY, output ];
    var d = [];
    var i = [];
    for (var k = 0; k < images.length; k++) {
      d[k] = images[k].data;
      i[k] = images[k].offset * 4;
    }
    var weight = [];
    var deltaX = [];
    var deltaY = [];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var e = 0; e < 3; e++) {
          var valA = d[0][i[0] + e];
          var valB = d[1][i[1] + e];
          var d2 = d[2][i[2] + e];
          var d3 = d[3][i[3] + e];
          var d4 = d[4][i[4] + e];
          var d5 = d[5][i[5] + e];
          d[6][i[6] + e] = 0;
          //
          var diff = valA - valB;
          if (Math.abs(diff) < 1) {
            d[6][i[6] + e] = 64;
            continue;
          }
          if (d2 === 0 || d2 === 255 || d3 === 0 || d3 === 255 ||
              d4 === 0 || d4 === 255 || d5 === 0 || d5 === 255) {
            continue;
          }
          var dAX = (d2 - 128) / 8;
          var dBX = (d3 - 128) / 8;
          var dAY = (d4 - 128) / 8;
          var dBY = (d5 - 128) / 8;
          var dX = (dAX + dBX) / 2;
          var dY = (dAY + dBY) / 2;
          var sq = Math.sqrt(dX * dX + dY * dY);
          if (sq < 1 ||
              sq * 0.1 < Math.abs(dAX - dBX) ||
              sq * 0.1 < Math.abs(dAY - dBY)) {
            continue;
          }
          var sq2 = diff / (sq * sq);
          weight.push(Math.pow(diff, 4));
          deltaX.push(dX * sq2);
          deltaY.push(dY * sq2);
          //
          d[6][i[6] + e] = 255;
        }
        d[6][i[6] + 3] = 255;
        //
        for (var k = 0; k < images.length; k++) {
          i[k] += 4;
        }
      }
      //
      for (var k = 0; k < images.length; k++) {
        i[k] += (images[k].pitch - w) * 4;
      }
    }
    var weightedAverageDelta = function() {
      var count = deltaX.length;
      var xsum = 0, ysum = 0, wsum = 0;
      for (var k = 0; k < count; ++k) {
        xsum += deltaX[k] * weight[k];
        ysum += deltaY[k] * weight[k];
        wsum += weight[k];
      }
      console.log('weightedAverageDelta (count = ' + count + ')');
      return count === 0 ? null : {
        nx: xsum / wsum,
        ny: ysum / wsum
      };
    };
    var delta = weightedAverageDelta();
    var mx = delta === null ? null : delta.nx * a.width / w + (offsetX - offsetXi);
    var my = delta === null ? null : delta.ny * a.height / h + (offsetY - offsetYi);
    console.log('motion x --> ' + (mx === null ? 'null' : mx.toFixed(3) + 'px'));
    console.log('motion y --> ' + (my === null ? 'null' : my.toFixed(3) + 'px'));
    return { imageOut: output, motionX: mx, motionY: my };
  };
  var estimateMotionIteration = function(a, b, blurStdev) {
    var max_iteration = 8;
    var mx = 0, my = 0, imageOut = null;
    var history = [];
    for (var k = 0; k < max_iteration; ++k) {
      var mxi = Math.round(mx);
      var myi = Math.round(my);
      history.push({ mx: mxi, my: myi });
      var result = estimateMotionImpl(a, b, -mxi, -myi, blurStdev);
      if (result === null) {
        break;
      }
      if (!imageOut) {
        imageOut = result.imageOut;
      }
      if (result.motionX !== null && result.motionY !== null) {
        var nextX = mxi + result.motionX;
        var nextY = myi + result.motionY;
        var duplicate = history.filter(function(h) {
          return h.mx === Math.round(nextX) && h.my === Math.round(nextY);
        });
        if (0 < duplicate.length) {
          if (Math.round(result.motionX / 2) === 0 &&
              Math.round(result.motionY / 2) === 0) {
            mx = mxi;
            my = myi;
            break;
          } else {
            nextX = mxi + result.motionX / 2;
            nextY = myi + result.motionY / 2;
          }
        }
        mx = nextX;
        my = nextY;
      } else {
        mx = mxi;
        my = myi;
        break;
      }
    }
    console.log('total mx --> ' + mx.toFixed(3) + 'px, my --> ' + my.toFixed(3) + 'px');
    return { imageOut: imageOut, motionX: mx, motionY: my };
  };
  var estimateMotion = function(a, b) {
    var stdev = [ 3, 5, 10, 20 ];
    var results = [];
    var result;
    for (var k = 0; k < stdev.length; ++k) {
      result = estimateMotionIteration(a, b, stdev[k]);
      if (result.motionX === null || result.motionY === null) {
        continue;
      }
      var sameResult = results.filter(function(e) {
        return e.motionX === result.motionX && e.motionY === result.motionY;
      });
      if (0 < sameResult.length) {
        return result;
      }
      results.push(result);
    }
    return result;
  };
  var cornerValue = function(src) {
    var grayscale = makeImage(src);
    var w = src.width;
    var h = src.height;
    var ch = grayscale.channels;
    var dx = makeImage(w, h, grayscale.format);
    var dy = makeImage(w, h, grayscale.format);
    sobelX(dx, grayscale);
    sobelY(dy, grayscale);
    var dBias = grayscale.channels === 4 ? 128 : 0;
    var cov = makeImage(w, h);
    var i = 0, k = 0;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++, i += 4) {
        var cov0 = 0, cov1 = 0, cov2 = 0;
        if (ch === 4) {
          for (var j = 0; j < 4; j++, k++) {
            var ix = (dx.data[k] - dBias) * 0.1;
            var iy = (dy.data[k] - dBias) * 0.1;
            cov0 += ix * ix;
            cov1 += ix * iy;
            cov2 += iy * iy;
          }
        } else {
          var ix = (dx.data[k] - dBias) * 0.3;
          var iy = (dy.data[k] - dBias) * 0.3;
          cov0 += ix * ix;
          cov1 += ix * iy;
          cov2 += iy * iy;
          k++;
        }
        cov.data[i    ] = Math.max(0, Math.min(255, Math.round(cov0)));
        cov.data[i + 1] = Math.max(0, Math.min(255, Math.round(cov1)));
        cov.data[i + 2] = Math.max(0, Math.min(255, Math.round(-cov1)));
        cov.data[i + 3] = Math.max(0, Math.min(255, Math.round(cov2)));
      }
    }
    var m = makeImage(w, h);
    convolution(m, cov, { w: 3, h: 3 }, [
      0.1111, 0.1111, 0.1111,
      0.1111, 0.1111, 0.1111,
      0.1111, 0.1111, 0.1111
    ]);
    var dest = makeImage(w, h, grayscale.format);
    var i = 0, k = 0;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++, i += ch, k += 4) {
        var cov0 = m.data[k] - 128;
        var cov1 = m.data[k + 1] - m.data[k + 2];
        var cov2 = m.data[k + 3] - 128;
        var a = 0.5 * cov0, b = cov1, c = 0.5 * cov2;
        var d = (a + c) - Math.sqrt((a - c) * (a - c) + b * b);
        var val = Math.max(0, Math.min(255, Math.round(d)));
        if (ch === 1) {
          dest.data[i] = val;
        } else {
          dest.data[i    ] = val;
          dest.data[i + 1] = val;
          dest.data[i + 2] = val;
          dest.data[i + 3] = 255;
        }
      }
    }
    return dest;
  };
  var findCornerPoints = function(image) {
    var w = image.width, h = image.height;
    var corner = cornerValue(image);
    var dilate = makeImage(w, h, corner.format);
    dilate3x3(dilate, corner);
    var candidates = [];
    var ch = corner.channels;
    for (var y = 1; y + 1 < h; y++) {
      var i = (1 + y * w) * ch;
      for (var x = 1; x + 1 < w; x++, i += ch) {
        var c = corner.data[i];
        if (0 < c && c === dilate.data[i]) {
          candidates.push([c, i / ch]);
        }
      }
    }
    candidates.sort(function(a, b) {
      return (
        a[0] > b[0] ? -1 : a[0] < b[0] ? 1 :
        a[1] < b[1] ? -1 : a[1] > b[1] ? 1 :
        0
      );
    });
    var gw = (w + 7) >> 3, margin = gw + 1;
    var grid = [];
    var result = [];
    var tooNear = function(p1, p2) {
      return Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y)) < 8;
    };
    var near8 = [-gw - 1, -gw, -gw + 1, -1, 1, gw - 1, gw, gw + 1];
    for (var i = 0, n = candidates.length; i < n; ++i) {
      var o = candidates[i][1];
      var x = o % w;
      var y = (o - x) / w;
      var cx = x >> 3, cy = y >> 3, c = cx + cy * gw + margin;
      if (grid[c] === undefined) {
        var point = { x: x, y: y };
        grid[c] = point;
        for (var k = 0; k < 8; k++) {
          var p = grid[c + near8[k]];
          if (p && tooNear(point, p)) {
            break;
          }
        }
        if (k === 8) {
          result.push(point);
          if (500 <= result.length) {
            break;
          }
        }
      }
    }
    return result;
  };
  var adjustCornerPointsSubPixel = function(image, corners) {
    var maxIteration = 20;
    var maxDistance = 10;
    var size = maxDistance * 2 + 1;
    var weight1 = new Float32Array(size);
    for (var i = -maxDistance, k = 0; i <= maxDistance; i++) {
      var r = i / maxDistance;
      weight1[k++] = Math.exp(-r * r);
    }
    var weight2 = new Float32Array(size * size);
    for (var i = 0, k = 0; i < size; i++) {
      for (var j = 0; j < size; j++) {
        weight2[k++] = weight1[j] * weight1[i];
      }
    }
    var s0 = maxDistance + 1, s1 = size + 2;
    var eps = 0.03 * 0.03;
    for (var m = 0; m < corners.length; m++) {
      var x = corners[m].x;
      var y = corners[m].y;
      for (var n = 0; n < maxIteration; n++) {
        var sample = readSubPixel(image, x - s0, y - s0, s1, s1);
        var a = 0, b = 0, c = 0, bb1 = 0, bb2 = 0;
        for (var i = -maxDistance, k = 0, o = s1 + 1; i <= maxDistance; i++, o += 2) {
          for (var j = -maxDistance; j <= maxDistance; j++, o++) {
            var w = weight2[k++];
            var dx = sample.data[o + 1] - sample.data[o - 1];
            var dy = sample.data[o + s1] - sample.data[o - s1];
            var dxx = w * dx * dx;
            var dxy = w * dx * dy;
            var dyy = w * dy * dy;
            a += dxx;
            b += dxy;
            c += dyy;
            bb1 += dxx * j + dxy * i;
            bb2 += dxy * j + dyy * i;
          }
        }
        var det = a * c - b * b;
        if (Math.abs(det) <= 1e-10) {
          break;
        }
        var scale = 1 / det;
        var sbb1 = scale * bb1;
        var sbb2 = scale * bb2;
        var ax = c * sbb1 - b * sbb2;
        var ay = a * sbb2 - b * sbb1;
        var error = ax * ax + ay * ay;
        x += ax;
        y += ay;
        if (x < 0 || x >= image.width || y < 0 || y >= image.height) {
          break;
        }
        if (error <= eps) {
          break;
        }
      }
      if (maxDistance >= Math.max(Math.abs(x - corners[m].x), Math.abs(y - corners[m].y))) {
        corners[m].x = x;
        corners[m].y = y;
      }
    }
  };
  var sparseOpticalFlow = function(image1, image2, points, nextPoints) {
    image1 = makeImage(image1);
    image2 = makeImage(image2);
    if (image1.width !== image2.width || image1.height !== image2.height) {
      return [];
    }
    if (image1.channels !== 1) {
      var gray = makeImage(image1.width, image1.height, FORMAT_F32x1);
      convertToGrayscale(gray, image1);
      image1 = gray;
    }
    if (image2.channels !== 1) {
      var gray = makeImage(image2.width, image2.height, FORMAT_F32x1);
      convertToGrayscale(gray, image2);
      image2 = gray;
    }
    if (nextPoints === undefined) {
      nextPoints = [];
      for (var i = 0, p; p = points[i]; i++) {
        nextPoints[i] = { x: p.x, y: p.y };
      }
    } else {
      nextPoints = Array.prototype.slice.call(nextPoints);
    }
    if (20 < Math.min(image1.width, image1.height)) {
      var upperW = Math.ceil(image1.width / 2);
      var upperH = Math.ceil(image1.height / 2);
      var upper1 = makeImage(upperW, upperH, FORMAT_F32x1);
      var upper2 = makeImage(upperW, upperH, FORMAT_F32x1);
      var scale = function(p) {
        return p ? {
          x: (p.x + 0.5) * (upperW / image1.width) - 0.5,
          y: (p.y + 0.5) * (upperH / image1.height) - 0.5
        } : null;
      };
      var unscale = function(p) {
        return p ? {
          x: (p.x + 0.5) * (image1.width / upperW) - 0.5,
          y: (p.y + 0.5) * (image1.height / upperH) - 0.5
        } : null;
      };
      gaussianBlur(upper1, image1, 0.5);
      gaussianBlur(upper2, image2, 0.5);
      var upperPoints = [];
      for (var i = 0, p; p = points[i]; i++) {
        upperPoints[i] = scale(p);
        nextPoints[i] = scale(nextPoints[i]);
      }
      var updatedPoints = sparseOpticalFlow(upper1, upper2, upperPoints, nextPoints);
      for (var i = 0; i < points.length; i++) {
        if (!updatedPoints[i] && nextPoints[i]) {
          var np = nextPoints[i];
          var border = 7;
          if (np.x < border || image1.width - 1 - border < np.x ||
              np.y < border || image1.height - 1 - border < np.y) {
            updatedPoints[i] = np;
          }
        }
        nextPoints[i] = unscale(updatedPoints[i]);
      }
    }
    var dx1 = makeImage(image1.width, image1.height, image1.format);
    var dy1 = makeImage(image1.width, image1.height, image1.format);
    var dScale = 1 / 32;
    var dOffset = image1.channels === 4 ? -128 : 0;
    scharrX(dx1, image1);
    scharrY(dy1, image1);
    for (var i = 0, p; p = points[i]; i++) {
      var np = nextPoints[i];
      if (!np) {
        continue;
      }
      var i1w = readSubPixel(image1, p.x - 7, p.y - 7, 15, 15);
      var dxw = readSubPixel(dx1, p.x - 7, p.y - 7, 15, 15);
      var dyw = readSubPixel(dy1, p.x - 7, p.y - 7, 15, 15);
      var axx = 0, axy = 0, ayy = 0;
      for (var k = 0; k < 15 * 15; k++) {
        var dx = dxw.data[k] + dOffset;
        var dy = dyw.data[k] + dOffset;
        axx += dx * dx;
        axy += dx * dy;
        ayy += dy * dy;
      }
      axx *= dScale * dScale;
      axy *= dScale * dScale;
      ayy *= dScale * dScale;
      var d = axx * ayy - axy * axy;
      var e = (axx + ayy - Math.sqrt((axx - ayy) * (axx - ayy) + 4 * axy * axy)) / (2 * 15 * 15);
      if (e < 0.001 || d < 0.00001) {
        nextPoints[i] = null;
        continue;
      }
      var m = dScale / d;
      for (var j = 0; j < 20; j++) {
        var i2w = readSubPixel(image2, np.x - 7, np.y - 7, 15, 15);
        var bx = 0, by = 0;
        for (var k = 0; k < 15 * 15; k++) {
          var di = i2w.data[k] - i1w.data[k];
          bx += di * (dxw.data[k] + dOffset);
          by += di * (dyw.data[k] + dOffset);
        }
        np.x += (axy * by - ayy * bx) * m;
        np.y += (axy * bx - axx * by) * m;
      }
      if (np.x < 0 || image1.width - 1 < np.x || np.y < 0 || image1.height - 1 < np.y) {
        nextPoints[i] = null;
        continue;
      }
      nextPoints[i] = np;
    }
    return nextPoints;
  };
  var meanColor = function(colors) {
    var mean = [0,0,0,0];
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      mean[0] += c[0];
      mean[1] += c[1];
      mean[2] += c[2];
      mean[3] += c[3];
    }
    mean[0] /= colors.length;
    mean[1] /= colors.length;
    mean[2] /= colors.length;
    mean[3] /= colors.length;
    return mean;
  };
  var mostDistantColorIndex = function(colors) {
    var mean = meanColor(colors);
    var maxD = 0, index = 0;
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      var d = 0;
      d += Math.abs(c[0] - mean[0]);
      d += Math.abs(c[1] - mean[1]);
      d += Math.abs(c[2] - mean[2]);
      d += Math.abs(c[3] - mean[3]);
      if (maxD < d) {
        maxD = d;
        index = i;
      }
    }
    return index;
  };
  var mostFrequentColor = function(colors) {
    if (1 === colors.length) {
      return colors[0];
    }
    var list = Array.prototype.slice.call(colors);
    while (1 < list.length) {
      var index = mostDistantColorIndex(list);
      list.splice(index, 1);
    }
    return list[0];
  };
  // Predict geometric type of each pixel:
  // returns { typeMap: /see below/, colorMap: /modified image/ };
  // 'typeMap' is a WxH Uint8Array of:
  //    0 => unclassified
  //    1 => belongs to a flat region
  //    2 => border between flat regions
  // 'colorMap' is an RGBA image which is anti-anti-aliased version of input.
  var geometricTypeOfPixel = function(image) {
    var UNCLASSIFIED = 0, FLAT = 1, BORDER = 2;
    image = makeImage(image);
    if (image.channels !== 4) {
      return null;
    }
    var temp = makeImage(image.width, image.height, image.format);
    copy(temp, image);
    var pmaImage = makeImage(image.width, image.height, image.format);
    copy(pmaImage, image);
    image = temp;
    var w = image.width;
    var h = image.height;
    var ch = image.channels;
    for (var i = 0, n = ch * w * h; i < n; i += ch) {
      var a = pmaImage.data[i + 3];
      if (a < 255) {
        var s = a / 255;
        pmaImage.data[i + 0] = Math.round(s * pmaImage.data[i + 0]);
        pmaImage.data[i + 1] = Math.round(s * pmaImage.data[i + 1]);
        pmaImage.data[i + 2] = Math.round(s * pmaImage.data[i + 2]);
      }
    }
    var isSimilar = new Uint32Array(w * h);
    var typeMap = new Uint8Array(w * h);
    var colorMap = makeImage(w, h);
    var xClamp = new Uint32Array(w + 4);
    var yClamp = new Uint32Array(h + 4);
    for (var x = 0; x < w + 4; x++) {
      xClamp[x] = Math.max(0, Math.min(w - 1, x - 2));
    }
    for (var y = 0; y < h + 4; y++) {
      yClamp[y] = Math.max(0, Math.min(h - 1, y - 2));
    }
    for (var y = 0, i = 0, f = 0; y < h; y++) {
      for (var x = 0; x < w; x++, i += ch, f++) {
        var r = pmaImage.data[i];
        var g = pmaImage.data[i + 1];
        var b = pmaImage.data[i + 2];
        var a = pmaImage.data[i + 3];
        var similar = 0; // bit pattern
        for (var j = -2; j <= 2; j++) {
          var yy = yClamp[y + j + 2];
          if (y + j < -1 || h < y + j) {
            similar = similar * 32;
            continue;
          }
          var ii0 = ch * (w * yy);
          for (var k = -2; k <= 2; k++) {
            var xx = xClamp[x + k + 2];
            similar = similar * 2;
            if (x + k < -1 || w < x + k) {
              continue;
            }
            var ii = ii0 + ch * xx;
            var diff = 0;
            diff += Math.abs(pmaImage.data[ii] - r) * 2;
            diff += Math.abs(pmaImage.data[ii + 1] - g) * 5;
            diff += Math.abs(pmaImage.data[ii + 2] - b);
            diff += Math.abs(pmaImage.data[ii + 3] - a);
            if (diff <= 24) {
            //if (diff <= 12) {
              similar += 1;
            }
          }
        }
        isSimilar[f] = similar;
        colorMap.data[f * 4 + 0] = image.data[i + 0];
        colorMap.data[f * 4 + 1] = image.data[i + 1];
        colorMap.data[f * 4 + 2] = image.data[i + 2];
        colorMap.data[f * 4 + 3] = image.data[i + 3];
      }
    }
    for (var y = 0, f = 0; y < h; y++) {
      for (var x = 0; x < w; x++, f++) {
        var similar = isSimilar[f];
        var similarCount = 0;
        for (var k = 0, m = 1; k < 25; k++, m *= 2) {
          if ((similar & m) !== 0) {
            similarCount++;
          }
        }
        typeMap[f] = (8 <= similarCount) ? FLAT : UNCLASSIFIED;
      }
    }
    for (var y = 0, f = 0; y < h; y++) {
      for (var x = 0; x < w; x++, f++) {
        var similar = isSimilar[f];
        if (UNCLASSIFIED === typeMap[f]) {
          var similarAndFlatCount = 0;
          for (var dy = -2, m = 1<<24; dy <= 2; dy++) {
            var yy = yClamp[y + dy + 2];
            for (var dx = -2; dx <= 2; dx++, m = m >> 1) {
              var xx = xClamp[x + dx + 2];
              if ((similar & m) !== 0 && UNCLASSIFIED !== typeMap[xx + yy * w]) {
                similarAndFlatCount++;
              }
            }
          }
          if (2 <= similarAndFlatCount) {
            typeMap[f] = FLAT;
          }
        }
      }
    }
    var intermediateColorInfo = function(r, g, b, a, ii, jj) {
      var ri = pmaImage.data[ii];
      var gi = pmaImage.data[ii + 1];
      var bi = pmaImage.data[ii + 2];
      var ai = pmaImage.data[ii + 3];
      var rj = pmaImage.data[jj];
      var gj = pmaImage.data[jj + 1];
      var bj = pmaImage.data[jj + 2];
      var aj = pmaImage.data[jj + 3];
      var rk = rj - ri;
      var gk = gj - gi;
      var bk = bj - bi;
      var ak = aj - ai;
      var dot1 = rk * rk + gk * gk + bk * bk + ak * ak;
      var dot2 = (r - ri) * rk + (g - gi) * gk + (b - bi) * bk + (a - ai) * ak;
      if (dot2 <= 0 || dot1 <= dot2) {
        return {
          isIntermediate: false
        };
      }
      var s = dot2 / dot1;
      var diff = 0;
      diff += Math.abs(r - (ri + s * rk)) * 2;
      diff += Math.abs(g - (gi + s * gk)) * 5;
      diff += Math.abs(b - (bi + s * bk));
      diff += Math.abs(a - (ai + s * ak));
      return {
        isIntermediate: (diff <= 18),
        whichIsNear: (s < 0.5 ? 0 : 1)
      };
    };
    var checkForBorderColor = function(x, y, i, f) {
          var r = pmaImage.data[i];
          var g = pmaImage.data[i + 1];
          var b = pmaImage.data[i + 2];
          var a = pmaImage.data[i + 3];
          var nearColors = [];
          for (var dy = -2; dy <= 0; dy++) {
            var y0 = yClamp[y + 2 + dy];
            var y1 = yClamp[y + 2 - dy];
            var ii0 = ch * (w * y0);
            var jj0 = ch * (w * y1);
            for (var dx = -2; dx <= 2; dx++) {
              if (dy === 0 && dx === 0) {
                break;
              }
              var x0 = xClamp[x + 2 + dx];
              var x1 = xClamp[x + 2 - dx];
              var f0 = f + w * (y0 - y) + x0 - x;
              var f1 = f + w * (y1 - y) + x1 - x;
              if (typeMap[f0] !== FLAT || typeMap[f1] !== FLAT) {
                continue;
              }
              var ii = ii0 + ch * x0;
              var jj = jj0 + ch * x1;
              var im = intermediateColorInfo(r, g, b, a, ii, jj);
              if (im.isIntermediate) {
                typeMap[f] = BORDER;
                var near = im.whichIsNear === 0 ? ii : jj;
                nearColors.push([
                  image.data[near], image.data[near + 1], image.data[near + 2], image.data[near + 3]
                ]);
              }
            }
          }
          if (0 < nearColors.length) {
            var nearColor = mostFrequentColor(nearColors);
            colorMap.data[f * 4 + 0] = nearColor[0];
            colorMap.data[f * 4 + 1] = nearColor[1];
            colorMap.data[f * 4 + 2] = nearColor[2];
            colorMap.data[f * 4 + 3] = nearColor[3];
          }
    };
    for (var y = 0, i = 0, f = 0; y < h; y++) {
      for (var x = 0; x < w; x++, i += ch, f++) {
        if (UNCLASSIFIED === typeMap[f]) {
          checkForBorderColor(x, y, i, f);
        }
      }
    }
    for (var y = 0, i = 0, f = 0; y < h; y++) {
      for (var x = 0; x < w; x++, i += ch, f++) {
        if (typeMap[f] === FLAT &&
            (typeMap[xClamp[x + 2 - 1] * w + y] === BORDER ||
             typeMap[xClamp[x + 2 + 1] * w + y] === BORDER ||
             typeMap[x * w + yClamp[y + 2 - 1]] === BORDER ||
             typeMap[x * w + yClamp[y + 2 + 1]] === BORDER)) {
          checkForBorderColor(x, y, i, f);
        }
      }
    }
    return {
      typeMap: typeMap,
      colorMap: colorMap
    };
  };
  var growingTypedArray = function(type, initialCapacity) {
    var capacity = initialCapacity;
    var length = 0;
    var buffer = new type(capacity);
    var transfer = function(newCapacity) {
      var newBuffer = new type(newCapacity);
      for (var i = 0; i < length; i++) {
        newBuffer[i] = buffer[i];
      }
      return newBuffer;
    };
    var push = function(elem) {
      if (length >= capacity) {
        capacity *= 2;
        buffer = transfer(capacity);
      }
      buffer[length++] = elem;
    };
    var makeArray = function() {
      if (length === capacity) {
        return buffer;
      } else {
        try {
          return buffer.slice(0, length);
        } catch(e) {
          // IE11: no typedarray.slice() ?
          return transfer(length);
        }
      }
    };
    return {
      length: function() { return length; },
      capacity: function() { return capacity; },
      buffer: function() { return buffer; },
      push: push,
      makeArray: makeArray
    };
  };
  var mergeUniqueColors = function(uc1, uc2) {
    var n1 = uc1.colors.length, n2 = uc2.colors.length;
    var colors = growingTypedArray(Uint32Array, n1 + n2);
    var counts = growingTypedArray(Uint32Array, n1 + n2);
    for (var i1 = 0, i2 = 0; i1 < n1 || i2 < n2; ) {
      var k = i1 === n1 ? 2 :
              i2 === n2 ? 1 :
              uc1.colors[i1] < uc2.colors[i2] ? 1 :
              uc1.colors[i1] > uc2.colors[i2] ? 2 : 3;
      if (k === 1) {
        colors.push(uc1.colors[i1]);
        counts.push(uc1.counts[i1]);
        i1++;
      } else if (k === 2) {
        colors.push(uc2.colors[i2]);
        counts.push(uc2.counts[i2]);
        i2++;
      } else {
        colors.push(uc1.colors[i1]);
        counts.push(uc1.counts[i1] + uc2.counts[i2]);
        i1++;
        i2++;
      }
    }
    return {
      colors: colors.makeArray(),
      counts: counts.makeArray(),
      totalCount: uc1.totalCount + uc2.totalCount
    };
  };
  var getUniqueColorsImpl = function(imageData, colorBuffer) {
    imageData = makeImage(imageData);
    var w = imageData.width;
    var h = imageData.height;
    var colors = colorBuffer || new Uint32Array(w * h);
    var ch = imageData.channels;
    var i = 0;
    var k = imageData.offset * ch;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++, k += ch, i++) {
        var r = imageData.data[k + 0];
        var g = imageData.data[k + 1];
        var b = imageData.data[k + 2];
        colors[i] = (r << 16) + (g << 8) + b;
      }
      k += (imageData.pitch - w) * ch;
    }
    try {
      colors.sort();
    } catch(e) {
      // IE11: no typedarray.sort() ?
      colors = Array.prototype.slice.call(colors);
      colors.sort();
    }
    var counts = growingTypedArray(Uint32Array, 16384);
    var totalCount = 0;
    var uniqueCount = 1;
    for (var i = 1; i < colors.length; i += 1) {
      if (colors[i - 1] !== colors[i]) {
        colors[uniqueCount] = colors[i];
        counts.push(i - totalCount);
        uniqueCount += 1;
        totalCount = i;
      }
    }
    counts.push(colors.length - totalCount);
    return {
      colors: colors.slice(0, uniqueCount),
      counts: counts.makeArray(),
      totalCount: w * h
    };
  };
  var getUniqueColors = function(imageData) {
    var w = imageData.width;
    var h = imageData.height;
    var step = Math.ceil(4 * 1024 * 1024 / w);
    var buffer = [];
    var colorBuffer = [];
    for (var y = 0; y < h; y += step) {
      var r = makeRegion(imageData, 0, y, w, step);
      var colorBufferSize = r.width * r.height;
      if (colorBuffer.length !== colorBufferSize) {
        colorBuffer = null;
        colorBuffer = new Uint32Array(colorBufferSize);
      }
      var u = getUniqueColorsImpl(r, colorBuffer);
      buffer.push(u);
    }
    while (1 < buffer.length) {
      var temp = [];
      for (var i = 0; i < buffer.length; i += 2) {
        if (i + 1 < buffer.length) {
          var u = mergeUniqueColors(buffer[i], buffer[i + 1]);
          temp.push(u);
        } else {
          temp.push(buffer[i]);
        }
      }
      buffer = temp;
    }
    return buffer[0];
  };
  return {
    FORMAT_U8x4:    FORMAT_U8x4,
    FORMAT_F32x1:   FORMAT_F32x1,
    channelsOf:     channelsOf,
    newArrayOf:     newArrayOf,
    makeImage:      makeImage,
    makeRegion:     makeRegion,
    fill:           fill,
    copy:           copy,
    rotate:         rotate,
    flipH:          flipH,
    flipV:          flipV,
    readSubPixel:   readSubPixel,
    convertToGrayscale: convertToGrayscale,
    resize:         resize,
    resizeNN:       resizeNN,
    resizeBilinear: resizeBilinear,
    gaussianBlur:   gaussianBlur,
    resizeWithGaussianBlur: resizeWithGaussianBlur,
    convolution:    convolution,
    sobelX:         sobelX,
    sobelY:         sobelY,
    scharrX:        scharrX,
    scharrY:        scharrY,
    dilate3x1:      dilate3x1,
    dilate1x3:      dilate1x3,
    dilate3x3:      dilate3x3,
    estimateMotion: estimateMotion,
    cornerValue:    cornerValue,
    findCornerPoints: findCornerPoints,
    adjustCornerPointsSubPixel: adjustCornerPointsSubPixel,
    sparseOpticalFlow: sparseOpticalFlow,
    mostFrequentColor: mostFrequentColor,
    geometricTypeOfPixel: geometricTypeOfPixel,
    growingTypedArray: growingTypedArray,
    mergeUniqueColors: mergeUniqueColors,
    getUniqueColors: getUniqueColors
  };
})();
