self.addEventListener('message', function(e) {
  var data = e.data;
  var result = {};
  result.cmd    = data.cmd;
  result.index  = data.index;
  switch (data.cmd) {
  case 'calcHistogram':
    result.type   = data.type;
    result.result   = calcHistogram(data.imageData, data.type);
    break;
  case 'calcWaveform':
    result.type   = data.type;
    result.result = calcWaveform(data.imageData, data.histW, data.type);
    result.w = data.imageData.width;
    result.h = data.imageData.height;
    result.histW = data.histW;
    break;
  case 'calcMetrics':
    result.result = calcMetrics(data.imageData1, data.imageData2);
    result.result.ae = calcAE(data.imageData1, data.imageData2);
    break;
  case 'calcDiff':
    result.result = calcDiff(data.imageData1, data.imageData2, data.options);
    result.options = data.options;
    break;
  }
  self.postMessage( result );
}, false);

function calcHistogram( imageData, type )
{
  var w = imageData.width;
  var h = imageData.height;
  var hist = new Uint32Array(256 * (type == 0 ? 3 : 1));
  for (var i = 0; i < hist.length; ++i) {
    hist[i] = 0;
  }
  if (type == 0) { // RGB
    for (var i = 0, n = 4 * w * h; i < n; i+=4) {
      hist[imageData.data[i + 0]] += 1;
      hist[imageData.data[i + 1] + 256] += 1;
      hist[imageData.data[i + 2] + 512] += 1;
    }
  } else { // Luminance
    for (var i = 0, n = 4 * w * h; i < n; i+=4) {
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
  var hist = new Uint32Array(256 * histW * (type == 0 ? 3 : 1));
  var histOff = new Uint32Array(w);
  for (var i = 0; i < hist.length; ++i) {
    hist[i] = 0;
  }
  for (var i = 0; i < w; ++i) {
    var x = Math.round((i + 0.5) / w * histW - 0.5);
    histOff[i] = x * 256;
  }
  if (type == 0) { // RGB
    for (var x = 0; x < w; ++x) {
      var i = x * 4;
      var rOff = histOff[x];
      var gOff = histOff[x] + 256 * histW;
      var bOff = histOff[x] + 512 * histW;
      for (var y = 0; y < h; ++y, i += w*4) {
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
      for (var y = 0; y < h; ++y, i += w*4) {
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

function calcAE( a, b )
{
  if (a.width != b.width || a.height != b.height) {
    // error
    return NaN;
  }
  if (a.width == 0 || a.height == 0) {
    // error
    return NaN;
  }
  var count = 0;
  for (var i = 0, n = a.width * a.height * 4; i != n; i += 4) {
    if (a.data[i + 0] != b.data[i + 0] ||
        a.data[i + 1] != b.data[i + 1] ||
        a.data[i + 2] != b.data[i + 2] ||
        a.data[i + 3] != b.data[i + 3]) {
      ++count;
    }
  }
  return count;
}

function calcMetrics( a, b )
{
  if (a.width != b.width || a.height != b.height) {
    // error
    return { psnr: NaN, mse: NaN, ncc: NaN };
  }
  if (a.width == 0 || a.height == 0) {
    // error
    return { psnr: NaN, mse: NaN, ncc: NaN };
  }
  var w = a.width;
  var h = a.height;
  var average12 = function(data) {
    var sum1 = 0, sum2 = 0;
    for (var i = 0, y = 0; y < h; ++y) {
      var lineSum1 = 0, lineSum2 = 0;
      for (var x= 0; x < w; ++x, i += 4) {
        var r= data[i + 0], g = data[i + 1], b = data[i + 2];
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
      for (var x= 0; x < w; ++x, i += 4) {
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
      for (var x= 0; x < w; ++x, i += 4) {
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
  if (mse == 0) {
    // a == b;
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
      var j0 = (src.offset + src.pitch * sy) * 4
      for (var x = 0; x < w; x++, i += 4) {
        var j = j0 + so[x]
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
    for (var sy = 0; sy < sh; sy++) {
      for (var x = 0; x < w; x++, k += 4) {
        var j0 = j + sxo[x * 2    ];
        var j1 = j + sxo[x * 2 + 1];
        var fx0 = fx[x * 2    ];
        var fx1 = fx[x * 2 + 1];
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
    k = 0;
    for (var y = 0; y < h; y++, k += sw * 4) {
      var k0 = syo[y * 2    ];
      var k1 = syo[y * 2 + 1];
      var fy0 = fy[y * 2    ];
      var fy1 = fy[y * 2 + 1];
      for (var x = 0; x < w; x++, i += 4, k0 += 4, k1 += 4) {
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
  var resize = function(dest, src, method) {
    method = method !== undefined ? method : 'bilinear';
    //console.time(method); for (var i = 0; i < 100; ++i) {
    if (method == 'nn') {
      resizeNN(dest, src);
    } else if (method == 'bilinear') {
      resizeBilinear(dest, src);
    } else {
      console.log('unexpected argument: ' + method);
    }
    //} console.timeEnd(method);
  };
  return {
    makeImage:      makeImage,
    makeRegion:     makeRegion,
    fill:           fill,
    copy:           copy,
    resize:         resize,
    resizeNN:       resizeNN,
    resizeBilinear: resizeBilinear,
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
    maxAE: 0,
  };
  makeDiff(a, b, diff, summary);
  summary.match = summary.total - summary.unmatch;
  return {
    image:      diff,
    summary:    summary,
  };
}
