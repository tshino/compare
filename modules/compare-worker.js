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
  return {
    makeImage:      makeImage,
    makeRegion:     makeRegion,
    fill:           fill,
  };
})();

function calcDiff( a, b, options )
{
  var ignoreAE = options.ignoreAE;

  var makeDiff = function(a, b, out, sammary) {
    var unmatch = 0;
    var countIgnoreAE = 0;
    var w = a.width, h = a.height;
    var i = a.offset * 4, j = b.offset * 4, k = out.offset * 4;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++, i += 4, j += 4, k += 4) {
        var r0 = a.data[i + 0], g0 = a.data[i + 1], b0 = a.data[i + 2], a0 = a.data[i + 3];
        var r1 = b.data[j + 0], g1 = b.data[j + 1], b1 = b.data[j + 2], a1 = b.data[j + 3];
        var y0 = 0.299 * r0 + 0.587 * g0 + 0.114 * b0;
        var y1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
        var mean = Math.round((y0 * a0 + y1 * a1) * (0.25 / 255));
        var ae = Math.max(Math.abs(r0 - r1), Math.abs(g0 - g1), Math.abs(b0 - b1), Math.abs(a0 - a1));
        if (ae <= ignoreAE) {
          if (0 < ae) ++countIgnoreAE;
          out.data[k    ] = mean;
          out.data[k + 1] = mean;
          out.data[k + 2] = mean;
          out.data[k + 3] = 255;
        } else {
          out.data[k    ] = y0 >= y1 ? 255 : mean;
          out.data[k + 1] = mean;
          out.data[k + 2] = y0 <= y1 ? 255 : mean;
          out.data[k + 3] = 255;
          ++unmatch;
        }
      }
      i += (a.pitch - w) * 4;
      j += (b.pitch - w) * 4;
      k += (out.pitch - w) * 4;
    }
    sammary.unmatch += unmatch;
    sammary.countIgnoreAE += countIgnoreAE;
    sammary.total += w * h;
  };
  var minW = Math.min(a.width, b.width);
  var minH = Math.min(a.height, b.height);
  var maxW = Math.max(a.width, b.width);
  var maxH = Math.max(a.height, b.height);
  var diff = imageUtil.makeImage(maxW, maxH);
  a = imageUtil.makeImage(a);
  b = imageUtil.makeImage(b);
  var sammary = {
    total: 0,
    countIgnoreAE: 0,
    unmatch: 0,
  };
  makeDiff(
      imageUtil.makeRegion(a, 0, 0, minW, minH),
      imageUtil.makeRegion(b, 0, 0, minW, minH),
      imageUtil.makeRegion(diff, 0, 0, minW, minH),
      sammary);
  makeDiff(
      minW < a.width
        ? imageUtil.makeRegion(a, minW, 0, maxW - minW, minH)
        : imageUtil.makeImage(maxW - minW, minH),
      minW < b.width
        ? imageUtil.makeRegion(b, minW, 0, maxW - minW, minH)
        : imageUtil.makeImage(maxW - minW, minH),
      imageUtil.makeRegion(diff, minW, 0, maxW - minW, minH),
      sammary);
  makeDiff(
      minH < a.height
        ? imageUtil.makeRegion(a, 0, minH, minW, maxH - minH)
        : imageUtil.makeImage(minW, maxH - minH),
      minH < b.height
        ? imageUtil.makeRegion(b, 0, minH, minW, maxH - minH)
        : imageUtil.makeImage(minW, maxH - minH),
      imageUtil.makeRegion(diff, 0, minH, minW, maxH - minH),
      sammary);
  makeDiff(
      (minW < a.width && minH < a.height)
        ? imageUtil.makeRegion(a, minW, minH, maxW - minW, maxH - minH)
        : imageUtil.makeImage(maxW - minW, maxH - minH),
      (minW < b.width && minH < b.height)
        ? imageUtil.makeRegion(b, minW, minH, maxW - minW, maxH - minH)
        : imageUtil.makeImage(maxW - minW, maxH - minH),
      imageUtil.makeRegion(diff, minW, minH, maxW - minW, maxH - minH),
      sammary);
  sammary.match = sammary.total - sammary.unmatch;
  return {
    image:      diff,
    sammary:    sammary,
  };
}
