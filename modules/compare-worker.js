self.addEventListener('message', function(e) {
  var data = e.data;
  var result = {};
  result.cmd    = data.cmd;
  result.index  = data.index;
  switch (data.cmd) {
  case 'calcHistogram':
    result.type   = data.type;
    result.result   = calcHistogram(data.imageData[0], data.type);
    break;
  case 'calcWaveform':
    result.type   = data.type;
    result.result = calcWaveform(data.imageData[0], data.histW, data.type);
    result.w = data.imageData[0].width;
    result.h = data.imageData[0].height;
    result.histW = data.histW;
    break;
  case 'calcVectorscope':
    result.type   = data.type;
    result.result = calcVectorscope(data.imageData[0], data.type);
    result.w = data.imageData[0].width;
    result.h = data.imageData[0].height;
    break;
  case 'calcMetrics':
    result.result = calcMetrics(data.imageData[0], data.imageData[1]);
    result.result.ae = calcAE(data.imageData[0], data.imageData[1]);
    break;
  case 'calcDiff':
    result.result = calcDiff(data.imageData[0], data.imageData[1], data.options);
    result.options = data.options;
    break;
  }
  self.postMessage( result );
}, false);

function calcHistogram( imageData, type )
{
  var w = imageData.width;
  var h = imageData.height;
  var hist = new Uint32Array(256 * (type === 0 ? 3 : 1));
  for (var i = 0; i < hist.length; ++i) {
    hist[i] = 0;
  }
  if (type === 0) { // RGB
    for (var i = 0, n = 4 * w * h; i < n; i += 4) {
      hist[imageData.data[i + 0]] += 1;
      hist[imageData.data[i + 1] + 256] += 1;
      hist[imageData.data[i + 2] + 512] += 1;
    }
  } else { // Luminance
    for (var i = 0, n = 4 * w * h; i < n; i += 4) {
      var r = imageData.data[i + 0];
      var g = imageData.data[i + 1];
      var b = imageData.data[i + 2];
      var y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      hist[y] += 1;
    }
  }
  return hist;
}
function calcWaveform( imageData, histW, type )
{
  var w = imageData.width;
  var h = imageData.height;
  var hist = new Uint32Array(256 * histW * (type === 0 ? 3 : 1));
  var histOff = new Uint32Array(w);
  for (var i = 0; i < hist.length; ++i) {
    hist[i] = 0;
  }
  for (var i = 0; i < w; ++i) {
    var x = Math.round((i + 0.5) / w * histW - 0.5);
    histOff[i] = x * 256;
  }
  if (type === 0) { // RGB
    for (var x = 0; x < w; ++x) {
      var i = x * 4;
      var rOff = histOff[x];
      var gOff = histOff[x] + 256 * histW;
      var bOff = histOff[x] + 512 * histW;
      for (var y = 0; y < h; ++y, i += w * 4) {
        var r = imageData.data[i + 0];
        var g = imageData.data[i + 1];
        var b = imageData.data[i + 2];
        hist[rOff + r] += 1;
        hist[gOff + g] += 1;
        hist[bOff + b] += 1;
      }
    }
  } else { // Luminance
    for (var x = 0; x < w; ++x) {
      var i = x * 4;
      var off = histOff[x];
      for (var y = 0; y < h; ++y, i += w * 4) {
        var r = imageData.data[i + 0];
        var g = imageData.data[i + 1];
        var b = imageData.data[i + 2];
        var my = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        hist[off + my] += 1;
      }
    }
  }
  return hist;
}

function calcVectorscope( imageData, type )
{
  var w = imageData.width;
  var h = imageData.height;
  var dist = new Uint32Array(320 * 320);
  for (var i = 0; i < dist.length; ++i) {
    dist[i] = 0;
  }
  var k = 0;
  if (type === 0) { // Cb-Cr
    for (var k = 0, n = 4 * w * h; k < n; k += 4) {
      var r = imageData.data[k + 0];
      var g = imageData.data[k + 1];
      var b = imageData.data[k + 2];
      var cb = -0.1687 * r - 0.3313 * g + 0.5000 * b;
      var cr =  0.5000 * r - 0.4187 * g - 0.0813 * b;
      var plotx = Math.round(159.5 + cb);
      var ploty = Math.round(159.5 - cr);
      dist[ploty * 320 + plotx] += 1;
    }
  } else if (type === 1) { // x-y
    var srgbToLinear = [];
    for (var i = 0; i < 256; ++i) {
      var c = i / 255;
      srgbToLinear[i] = c < 0.040450 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    for (var k = 0, n = 4 * w * h; k < n; k += 4) {
      var r = srgbToLinear[imageData.data[k]];
      var g = srgbToLinear[imageData.data[k + 1]];
      var b = srgbToLinear[imageData.data[k + 2]];
      var x = 0.412391 * r + 0.357584 * g + 0.180481 * b;
      var y = 0.212639 * r + 0.715169 * g + 0.072192 * b;
      var z = 0.019331 * r + 0.119195 * g + 0.950532 * b;
      var xyz = x + y + z;
      var plotx = 32 + (xyz === 0 ? 0 : Math.round(x / xyz * 255));
      var ploty = 287 - (xyz === 0 ? 0 : Math.round(y / xyz * 255));
      dist[ploty * 320 + plotx] += 1;
    }
  } else if (type === 2) { // G-B
    for (var k = 0, n = 4 * w * h; k < n; k += 4) {
      var g = imageData.data[k + 1];
      var b = imageData.data[k + 2];
      var plotx = 32 + g;
      var ploty = 287 - b;
      dist[ploty * 320 + plotx] += 1;
    }
  } else if (type === 3) { // G-R
    for (var k = 0, n = 4 * w * h; k < n; k += 4) {
      var r = imageData.data[k + 0];
      var g = imageData.data[k + 1];
      var plotx = 32 + g;
      var ploty = 287 - r;
      dist[ploty * 320 + plotx] += 1;
    }
  } else { // B-R
    for (var k = 0, n = 4 * w * h; k < n; k += 4) {
      var r = imageData.data[k + 0];
      var b = imageData.data[k + 2];
      var plotx = 32 + b;
      var ploty = 287 - r;
      dist[ploty * 320 + plotx] += 1;
    }
  }
  return dist;
}

function calcAE( a, b )
{
  if (a.width !== b.width || a.height !== b.height) {
    // error
    return NaN;
  }
  if (a.width === 0 || a.height === 0) {
    // error
    return NaN;
  }
  var count = 0;
  for (var i = 0, n = a.width * a.height * 4; i !== n; i += 4) {
    if (a.data[i + 0] !== b.data[i + 0] ||
        a.data[i + 1] !== b.data[i + 1] ||
        a.data[i + 2] !== b.data[i + 2] ||
        a.data[i + 3] !== b.data[i + 3]) {
      ++count;
    }
  }
  return count;
}

function calcMetrics( a, b )
{
  if (a.width !== b.width || a.height !== b.height) {
    // error
    return { psnr: NaN, mse: NaN, ncc: NaN };
  }
  if (a.width === 0 || a.height === 0) {
    // error
    return { psnr: NaN, mse: NaN, ncc: NaN };
  }
  var w = a.width;
  var h = a.height;
  var average12 = function(data) {
    var sum1 = 0, sum2 = 0;
    for (var i = 0, y = 0; y < h; ++y) {
      var lineSum1 = 0, lineSum2 = 0;
      for (var x = 0; x < w; ++x, i += 4) {
        var r = data[i + 0], g = data[i + 1], b = data[i + 2];
        lineSum1 += r + g + b;
        lineSum2 += r * r + g * g + b * b;
      }
      sum1 += lineSum1;
      sum2 += lineSum2;
    }
    return [ sum1 / (w * h * 3), sum2 / (w * h * 3) ];
  };
  var sd = function(ave12) {
    return Math.sqrt(ave12[1] - ave12[0] * ave12[0]);
  };
  var calcNCC = function(dataA, dataB) {
    var ave12A = average12(dataA), ave12B = average12(dataB);
    var sdA = sd(ave12A), sdB = sd(ave12B);
    var sum = 0;
    for (var i = 0, y = 0; y < h; ++y) {
      var lineSum = 0;
      for (var x = 0; x < w; ++x, i += 4) {
        var r = dataA[i + 0] * dataB[i + 0];
        var g = dataA[i + 1] * dataB[i + 1];
        var b = dataA[i + 2] * dataB[i + 2];
        lineSum += r + g + b;
      }
      sum += lineSum;
    }
    return (sum / (w * h * 3) - ave12A[0] * ave12B[0]) / (sdA * sdB);
  };
  var ncc = calcNCC(a.data, b.data);
  var calcMSE = function(dataA, dataB) {
    var sum = 0;
    for (var i = 0, y = 0; y < h; ++y) {
      var lineSum = 0;
      for (var x = 0; x < w; ++x, i += 4) {
        var r = dataA[i + 0] - dataB[i + 0];
        var g = dataA[i + 1] - dataB[i + 1];
        var b = dataA[i + 2] - dataB[i + 2];
        var se = r * r + g * g + b * b;
        lineSum += se;
      }
      sum += lineSum;
    }
    return sum / (w * h * 3);
  };
  var mse = calcMSE(a.data, b.data);
  if (mse === 0) {
    // a === b;
    return { psnr: Infinity, mse: 0, ncc: ncc };
  }
  var max = 255 * 255;
  var psnr = 10 * Math.log(max / mse) / Math.LN10;
  return { psnr: psnr, mse: mse, ncc: ncc };
}

var imageUtil = (function() {
  var makeImage = function(a, b) {
    if (b === undefined) {
      return {
        width:  a.width,
        height: a.height,
        data:   a.data,
        pitch:  (a.pitch !== undefined ? a.pitch : a.width),
        offset: (a.offset !== undefined ? a.offset : 0)
      };
    } else {
      return {
        width:    a,
        height:   b,
        data:     new Uint8Array(a * b * 4),
        pitch:    a,
        offset:   0
      };
    }
  };
  var makeRegion = function(image, left, top, width, height) {
    var pitch = image.pitch !== undefined ? image.pitch : image.width;
    var offset = image.offset !== undefined ? image.offset : 0;
    left   = left   !== undefined ? left   : 0;
    top    = top    !== undefined ? top    : 0;
    width  = width  !== undefined ? width  : image.width;
    height = height !== undefined ? height : image.height;
    left   = Math.min(image.width,  left);
    top    = Math.min(image.height, top);
    width  = Math.min(image.width  - left, width);
    height = Math.min(image.height - top,  height);
    return {
      width: width,
      height: height,
      data: image.data,
      pitch: pitch,
      offset: offset + left + pitch * top
    };
  };
  var fill = function(image, r, g, b, a) {
    var w = image.width, h = image.height;
    var i = image.offset * 4;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++, i += 4) {
        image.data[i    ] = r;
        image.data[i + 1] = g;
        image.data[i + 2] = b;
        image.data[i + 3] = a;
      }
      i += (image.pitch - w) * 4;
    }
  };
  var copy = function(dest, src) {
    var w = Math.min(dest.width, src.width), h = Math.min(dest.height, src.height);
    var i = dest.offset * 4, j = src.offset * 4;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++, i += 4, j += 4) {
        dest.data[i    ] = src.data[j    ];
        dest.data[i + 1] = src.data[j + 1];
        dest.data[i + 2] = src.data[j + 2];
        dest.data[i + 3] = src.data[j + 3];
      }
      i += (dest.pitch - w) * 4;
      j += (src.pitch - w) * 4;
    }
  };
  var resizeNN = function(dest, src) {
    var w = dest.width, h = dest.height;
    var mw = src.width / w, mh = src.height / h;
    var i = dest.offset * 4;
    var ddata = dest.data, sdata = src.data;
    var floor = Math.floor;
    var so = new Uint32Array(w);
    for (var x = 0; x < w; x++) {
      so[x] = 4 * floor((x + 0.5) * mw);
    }
    for (var y = 0; y < h; y++) {
      var sy = floor((y + 0.5) * mh);
      var j0 = (src.offset + src.pitch * sy) * 4;
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
      i += (dest.pitch - w) * 4;
    }
  };
  var resizeBilinear = function(dest, src) {
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
        sxo[x * filterSize + f] = 4 * Math.min(sw - 1, Math.max(0, sx));
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
        syo[y * filterSize + f] = 4 * w * Math.min(sh - 1, Math.max(0, sy));
        fy[y * filterSize + f] = val;
        ++sy;
      }
      for (var f = 0; f < filterSize; ++f) {
        fy[y * filterSize + f] /= sum;
      }
    }
    var kdata = new Float32Array(w * sh * 4);
    var k = 0;
    var j = src.offset * 4;
    for (var jh = j + src.pitch * 4 * sh; j < jh; ) {
      var f = 0;
      for (var fw = w * filterSize; f < fw; k += 4) {
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
      j += src.pitch * 4;
    }
    var i = dest.offset * 4;
    var igap = (dest.pitch - w) * 4;
    f = 0;
    for (var fh = h * filterSize; f < fh; ) {
      var k0a = [];
      var fy0a = [];
      for (var fi = 0; fi < filterSize; fi++, f++) {
        k0a[fi] = syo[f];
        fy0a[fi] = fy[f];
      }
      var k = 0;
      for (var iw = i + w * 4; i < iw; i += 4, k += 4) {
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
      var temp = k + 1 < n ? imageUtil.makeImage(w, h) : dest;
      var stdev = 0.5 / Math.min(sx, sy);
      imageUtil.gaussianBlur(temp, src, stdev);
      src = temp;
    }
  };
  var convolution = function(dest, src, kernelSize, kernel) {
    var w = dest.width, h = dest.height;
    if (src.width !== w || src.height !== h) {
      return;
    }
    var kw = kernelSize.w, kh = kernelSize.h;
    var ox = Math.floor(kw / 2);
    var oy = Math.floor(kh / 2);
    var i = dest.offset * 4;
    var ddata = dest.data, sdata = src.data;
    var round = Math.round;
    var sxo = new Uint32Array(w * kw);
    var syo = new Uint32Array(h * kh);
    for (var x = 0; x < w; x++) {
      for (var k = 0; k < kw; k++) {
        var kx = Math.max(0, Math.min(w - 1, x - ox + k));
        sxo[x * kw + k] = 4 * kx;
      }
    }
    for (var y = 0; y < h; y++) {
      for (var k = 0; k < kh; k++) {
        var ky = Math.max(0, Math.min(h - 1, y - oy + k));
        syo[y * kh + k] = 4 * src.pitch * ky;
      }
    }
    var j0 = src.offset * 4;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++, i += 4) {
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
        }
        ddata[i    ] = Math.max(0, Math.min(255, round(128 + r)));
        ddata[i + 1] = Math.max(0, Math.min(255, round(128 + g)));
        ddata[i + 2] = Math.max(0, Math.min(255, round(128 + b)));
        ddata[i + 3] = Math.max(0, Math.min(255, round(128 + a)));
      }
      i += (dest.pitch - w) * 4;
    }
  };
  var sobelX = function(dest, src) {
    convolution(dest, src, { w: 3, h: 3 }, [
      -1, 0, 1,
      -2, 0, 2,
      -1, 0, 1
    ]);
  };
  var sobelY = function(dest, src) {
    convolution(dest, src, { w: 3, h: 3 }, [
      -1, -2, -1,
       0,  0,  0,
       1,  2,  1
    ]);
  };
  var estimateMotion = function(a, b) {
    var w = 256, h = 256;
    var baseA = imageUtil.makeImage(w, h);
    var baseB = imageUtil.makeImage(w, h);
    var blurA = imageUtil.makeImage(w, h);
    var blurB = imageUtil.makeImage(w, h);
    imageUtil.resizeWithGaussianBlur(baseA, a);
    imageUtil.resizeWithGaussianBlur(baseB, b);
    imageUtil.gaussianBlur(blurA, baseA, 20);
    imageUtil.gaussianBlur(blurB, baseB, 20);
    var gradAX = imageUtil.makeImage(w, h);
    var gradBX = imageUtil.makeImage(w, h);
    var gradAY = imageUtil.makeImage(w, h);
    var gradBY = imageUtil.makeImage(w, h);
    imageUtil.sobelX(gradAX, blurA);
    imageUtil.sobelX(gradBX, blurB);
    imageUtil.sobelY(gradAY, blurA);
    imageUtil.sobelY(gradBY, blurB);
    var input = [ blurA, blurB, gradAX, gradBX, gradAY, gradBY ];
    var d = [];
    var i = [];
    for (var k = 0; k < input.length; k++) {
      d[k] = input[k].data;
      i[k] = input[k].offset * 4;
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
          var diff = valA - valB;
          if (Math.abs(diff) < 3) {
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
        }
        //
        for (var k = 0; k < input.length; k++) {
          i[k] += 4;
        }
      }
      //
      for (var k = 0; k < input.length; k++) {
        i[k] += (input[k].pitch - w) * 4;
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
      return count == 0 ? null : {
        nx: xsum / wsum,
        ny: ysum / wsum
      };
    };
    var delta = weightedAverageDelta();
    var mx = delta === null ? null : delta.nx * a.width / w;
    var my = delta === null ? null : delta.ny * a.height / h;
    console.log('motion x --> ' + (mx === null ? 'null' : mx.toFixed(3) + 'px'));
    console.log('motion y --> ' + (my === null ? 'null' : my.toFixed(3) + 'px'));
    return { motionX: mx, motionY: my };
  };
  return {
    makeImage:      makeImage,
    makeRegion:     makeRegion,
    fill:           fill,
    copy:           copy,
    resize:         resize,
    resizeNN:       resizeNN,
    resizeBilinear: resizeBilinear,
    gaussianBlur:   gaussianBlur,
    resizeWithGaussianBlur: resizeWithGaussianBlur,
    convolution:    convolution,
    sobelX:         sobelX,
    sobelY:         sobelY,
    estimateMotion: estimateMotion
  };
})();

function calcDiff( a, b, options )
{
  var ignoreAE = options.ignoreAE;

  var makeDiff = function(a, b, out, summary) {
    var unmatch = 0;
    var maxAE = 0;
    var countIgnoreAE = 0;
    var d0 = a.data, d1 = b.data, o = out.data;
    var w = a.width, h = a.height;
    var i = a.offset * 4, j = b.offset * 4, k = out.offset * 4;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++, i += 4, j += 4, k += 4) {
        var r0 = d0[i + 0], g0 = d0[i + 1], b0 = d0[i + 2], a0 = d0[i + 3];
        var r1 = d1[j + 0], g1 = d1[j + 1], b1 = d1[j + 2], a1 = d1[j + 3];
        var y0 = 0.299 * r0 + 0.587 * g0 + 0.114 * b0;
        var y1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
        var mean = Math.round((y0 * a0 + y1 * a1) * (0.25 / 255));
        var ae = Math.max(Math.abs(r0 - r1), Math.abs(g0 - g1), Math.abs(b0 - b1), Math.abs(a0 - a1));
        maxAE = Math.max(maxAE, ae);
        if (ae <= ignoreAE) {
          if (0 < ae) ++countIgnoreAE;
          o[k    ] = mean;
          o[k + 2] = mean;
        } else {
          ++unmatch;
          o[k    ] = y0 >= y1 ? 255 : mean;
          o[k + 2] = y0 <= y1 ? 255 : mean;
        }
        o[k + 1] = mean;
        o[k + 3] = 255;
      }
      i += (a.pitch - w) * 4;
      j += (b.pitch - w) * 4;
      k += (out.pitch - w) * 4;
    }
    summary.unmatch += unmatch;
    summary.maxAE = Math.max(summary.maxAE, maxAE);
    summary.countIgnoreAE += countIgnoreAE;
    summary.total += w * h;
  };
  var minW = Math.min(a.width, b.width);
  var minH = Math.min(a.height, b.height);
  var maxW = Math.max(a.width, b.width);
  var maxH = Math.max(a.height, b.height);
  var useLargerSize = options.resizeToLarger || !options.ignoreRemainder;
  var regionW = useLargerSize ? maxW : minW;
  var regionH = useLargerSize ? maxH : minH;
  var diff = imageUtil.makeImage(regionW, regionH);
  a = imageUtil.makeRegion(a, 0, 0, regionW, regionH);
  b = imageUtil.makeRegion(b, 0, 0, regionW, regionH);
  if (a.width < regionW || a.height < regionH) {
    var new_a = imageUtil.makeImage(regionW, regionH);
    if (options.resizeToLarger) {
      imageUtil.resize(new_a, a, options.resizeMethod);
    } else {
      imageUtil.copy(new_a, a);
    }
    a = new_a;
  }
  if (b.width < regionW || b.height < regionH) {
    var new_b = imageUtil.makeImage(regionW, regionH);
    if (options.resizeToLarger) {
      imageUtil.resize(new_b, b, options.resizeMethod);
    } else {
      imageUtil.copy(new_b, b);
    }
    b = new_b;
  }
  var summary = {
    total: 0,
    countIgnoreAE: 0,
    unmatch: 0,
    maxAE: 0
  };
  makeDiff(a, b, diff, summary);
  summary.match = summary.total - summary.unmatch;
  return {
    image:      diff,
    summary:    summary
  };
}
