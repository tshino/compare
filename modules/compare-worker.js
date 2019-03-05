var workerLocation = workerLocation || location.href;
var importScript = function(relativePath) {
  var baseURL = workerLocation.replace(/\\/g, '/').replace(/\/[^\/]*$/, '/');
  var path = baseURL + relativePath;
  importScripts(path);
};

importScript('compare-image-util.js');

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
    result.auxType  = data.auxType;
    result.result = calcWaveform(data.imageData[0], data.histW, data.transposed, data.flipped, data.type, data.auxType);
    result.histW = data.histW;
    break;
  case 'calcVectorscope':
    result.type   = data.type;
    result.color  = data.color;
    result.auxType  = data.auxType;
    result.result = calcVectorscope(data.imageData[0], data.type, data.color, data.auxType);
    result.w = data.imageData[0].width;
    result.h = data.imageData[0].height;
    break;
  case 'calcColorTable':
    result.result = compareImageUtil.getUniqueColors(data.imageData[0]);
    break;
  case 'calc3DWaveform':
    result.type   = data.type;
    result.result = calc3DWaveform(data.imageData[0], data.type, data.baseSize);
    break;
  case 'calcReducedColorTable':
    result.result = calcReducedColorTable(data.imageData[0]);
    break;
  case 'calcMetrics':
    result.result = calcMetrics(data.imageData[0], data.imageData[1], data.options);
    break;
  case 'calcToneCurve':
    result.type   = data.type;
    result.result = calcToneCurve(data.imageData[0], data.imageData[1], data.type, data.options);
    break;
  case 'calcOpticalFlow':
    result.result = calcOpticalFlow(data.imageData[0], data.imageData[1], data.options);
    break;
  case 'calcDiff':
    result.result = calcDiff(data.imageData[0], data.imageData[1], data.options);
    result.options = data.options;
    break;
  }
  self.postMessage( result );
}, false);

var srgb255ToLinear255 = (function() {
  var srgb255ToLinear255 = new Float32Array(256);
  for (var i = 0; i < 256; ++i) {
    var c = i / 255;
    var linear = c < 0.040450 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    srgb255ToLinear255[i] = linear * 255;
  }
  return srgb255ToLinear255;
})();

function calcHistogram( imageData, type )
{
  var w = imageData.width;
  var h = imageData.height;
  var hist = new Uint32Array(256 * (type === 0 ? 3 : 1));
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
function calcWaveform( imageData, histW, transposed, flipped, type, auxType )
{
  var w = transposed ? imageData.height : imageData.width;
  var h = transposed ? imageData.width : imageData.height;
  var hist = new Uint32Array(256 * histW * (type === 0 ? 3 : 1));
  var histOff = new Uint32Array(w);
  for (var i = 0; i < w; ++i) {
    var x = Math.round((i + 0.5) / w * histW - 0.5);
    histOff[flipped ? w - 1 - i : i] = x * 256;
  }
  if (type === 0) { // RGB
    var sx = transposed ? h * 4 : 4;
    var sy = transposed ? 4 : w * 4;
    for (var x = 0; x < w; ++x) {
      var i = x * sx;
      var rOff = histOff[x];
      var gOff = histOff[x] + 256 * histW;
      var bOff = histOff[x] + 512 * histW;
      for (var y = 0; y < h; ++y, i += sy) {
        var r = imageData.data[i + 0];
        var g = imageData.data[i + 1];
        var b = imageData.data[i + 2];
        if (auxType === 1) {
          r = Math.round(srgb255ToLinear255[r]);
          g = Math.round(srgb255ToLinear255[g]);
          b = Math.round(srgb255ToLinear255[b]);
        }
        hist[rOff + r] += 1;
        hist[gOff + g] += 1;
        hist[bOff + b] += 1;
      }
    }
  } else { // Luminance
    var sx = transposed ? h * 4 : 4;
    var sy = transposed ? 4 : w * 4;
    for (var x = 0; x < w; ++x) {
      var i = x * sx;
      var off = histOff[x];
      for (var y = 0; y < h; ++y, i += sy) {
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

function calcVectorscope( imageData, type, colorMode, auxType )
{
  var w = imageData.width;
  var h = imageData.height;
  var dist = new Uint32Array(320 * 320);
  var colorMap = null;
  if (colorMode) {
    colorMap = new Float32Array(320 * 320 * 3);
  }
  var k = 0;
  if (type === 0) { // Cb-Cr
    for (var k = 0, n = 4 * w * h; k < n; k += 4) {
      var r = imageData.data[k];
      var g = imageData.data[k + 1];
      var b = imageData.data[k + 2];
      var cb = -0.1687 * r - 0.3313 * g + 0.5000 * b;
      var cr =  0.5000 * r - 0.4187 * g - 0.0813 * b;
      var plotx = Math.round(159.5 + cb);
      var ploty = Math.round(159.5 - cr);
      var offset = ploty * 320 + plotx;
      dist[offset] += 1;
      if (colorMap) {
        colorMap[offset] += r;
        colorMap[offset + 102400] += g;
        colorMap[offset + 204800] += b;
      }
    }
  } else if (type === 1) { // x-y
    for (var k = 0, n = 4 * w * h; k < n; k += 4) {
      var r = imageData.data[k];
      var g = imageData.data[k + 1];
      var b = imageData.data[k + 2];
      var linr = srgb255ToLinear255[r];
      var ling = srgb255ToLinear255[g];
      var linb = srgb255ToLinear255[b];
      var capX = 0.4124564 * linr + 0.3575761 * ling + 0.1804375 * linb;
      var capY = 0.2126729 * linr + 0.7151522 * ling + 0.0721750 * linb;
      var capZ = 0.0193339 * linr + 0.1191920 * ling + 0.9503041 * linb;
      var xyz = capX + capY + capZ;
      var x = Math.round((xyz === 0 ? 0.3127 : capX / xyz) * 255);
      var y = Math.round((xyz === 0 ? 0.3290 : capY / xyz) * 255);
      var plotx = 32 + x;
      var ploty = 287 - y;
      var offset = ploty * 320 + plotx;
      dist[offset] += 1;
      if (colorMap) {
        colorMap[offset] += r;
        colorMap[offset + 102400] += g;
        colorMap[offset + 204800] += b;
      }
    }
  } else if (type === 2) { // G-B
    for (var k = 0, n = 4 * w * h; k < n; k += 4) {
      var g = imageData.data[k + 1];
      var b = imageData.data[k + 2];
      if (auxType === 0) { // sRGB
        var plotx = 32 + g;
        var ploty = 287 - b;
      } else { // Linear sRGB
        var ling = Math.round(srgb255ToLinear255[g]);
        var linb = Math.round(srgb255ToLinear255[b]);
        var plotx = 32 + ling;
        var ploty = 287 - linb;
      }
      var offset = ploty * 320 + plotx;
      dist[offset] += 1;
      if (colorMap) {
        colorMap[offset] += imageData.data[k];;
        colorMap[offset + 102400] += g;
        colorMap[offset + 204800] += b;
      }
    }
  } else if (type === 3) { // G-R
    for (var k = 0, n = 4 * w * h; k < n; k += 4) {
      var r = imageData.data[k];
      var g = imageData.data[k + 1];
      if (auxType === 0) { // sRGB
        var plotx = 32 + g;
        var ploty = 287 - r;
      } else { // Linear sRGB
        var linr = Math.round(srgb255ToLinear255[r]);
        var ling = Math.round(srgb255ToLinear255[g]);
        var plotx = 32 + ling;
        var ploty = 287 - linr;
      }
      var offset = ploty * 320 + plotx;
      dist[offset] += 1;
      if (colorMap) {
        colorMap[offset] += r;
        colorMap[offset + 102400] += g;
        colorMap[offset + 204800] += imageData.data[k + 2];
      }
    }
  } else { // B-R
    for (var k = 0, n = 4 * w * h; k < n; k += 4) {
      var r = imageData.data[k];
      var b = imageData.data[k + 2];
      if (auxType === 0) { // sRGB
        var plotx = 32 + b;
        var ploty = 287 - r;
      } else { // Linear sRGB
        var linr = Math.round(srgb255ToLinear255[r]);
        var linb = Math.round(srgb255ToLinear255[b]);
        var plotx = 32 + linb;
        var ploty = 287 - linr;
      }
      var offset = ploty * 320 + plotx;
      dist[offset] += 1;
      if (colorMap) {
        colorMap[offset] += r;
        colorMap[offset + 102400] += imageData.data[k + 1];
        colorMap[offset + 204800] += b;
      }
    }
  }
  return {
    dist: dist,
    colorMap: colorMap
  };
}

function calc3DWaveform(imageData, type, baseSize)
{
  baseSize = baseSize || 256;
  var w = imageData.width;
  var h = imageData.height;
  if (w < h) {
    w = Math.max(1, Math.round(baseSize * w / h));
    h = baseSize;
  } else {
    h = Math.max(1, Math.round(baseSize * h / w));
    w = baseSize;
  }
  var input = compareImageUtil.makeImage(imageData);
  var resized = compareImageUtil.makeImage(w, h);
  compareImageUtil.resizeNN(resized, input);
  var waveform3d = new Uint8Array(w * h * (type === 0 ? 3 : 4));
  if (type === 0) { // RGB
    for (var i = 0, k = 0, n = 4 * w * h; i < n; i += 4, k += 3) {
      waveform3d[k + 0] = resized.data[i + 0];
      waveform3d[k + 1] = resized.data[i + 1];
      waveform3d[k + 2] = resized.data[i + 2];
    }
  } else { // RGB + Luminance
    for (var i = 0, k = 0, n = 4 * w * h; i < n; i += 4, k += 4) {
      var r = resized.data[i + 0];
      var g = resized.data[i + 1];
      var b = resized.data[i + 2];
      var y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      waveform3d[k + 0] = r;
      waveform3d[k + 1] = g;
      waveform3d[k + 2] = b;
      waveform3d[k + 3] = y;
    }
  }
  return {
    width: w,
    height: h,
    waveform: waveform3d
  };
}

function calcReducedColorTable( imageData )
{
  var rgbToYcbcr = function(r, g, b) {
    var y = 0.299 * r + 0.587 * g + 0.114 * b;
    var cb = -0.1687 * r + -0.3313 * g + 0.5000 * b + 127.5;
    var cr = 0.5000 * r + -0.4187 * g + -0.0813 * b + 127.5;
    return [y, cb, cr];
  };
  var colorTable = compareImageUtil.getUniqueColors(imageData);
  var colors_org = colorTable.colors;
  var counts_org = colorTable.counts;
  var length_org = counts_org.length;
  //
  // very fast and simple clustering using quantization of color components
  //
  var colorList = [];
  for (var k = 0; k < length_org; k++) {
    var r = colors_org[k] >> 16;
    var g = (colors_org[k] >> 8) & 255;
    var b = colors_org[k] & 255;
    var ycbcr = rgbToYcbcr(r, g, b);
    var y = Math.round(Math.round((ycbcr[0] / 255) * 3) / 3 * 255);
    var div = y < 128 ? 4 : 6;
    var cb = Math.round(Math.round((ycbcr[1] / 255) * div) / div * 255);
    var cr = Math.round(Math.round((ycbcr[2] / 255) * div) / div * 255);
    var count = counts_org[k];
    colorList[k] = [
        (y << 16) + (cb << 8) + cr,
        count,
        r * count,
        g * count,
        b * count
    ];
  }
  colorList.sort(function(a, b) {
    return b[0] - a[0]; // by color
  });
  var uniqueCount = 1;
  for (var k = 1; k < colorList.length; k++) {
    if (colorList[k - 1][0] !== colorList[k][0]) {
      uniqueCount += 1;
      colorList[uniqueCount - 1] = colorList[k];
    } else {
      colorList[uniqueCount - 1][1] += colorList[k][1];
      colorList[uniqueCount - 1][2] += colorList[k][2];
      colorList[uniqueCount - 1][3] += colorList[k][3];
      colorList[uniqueCount - 1][4] += colorList[k][4];
    }
  }
  colorList = colorList.slice(0, uniqueCount);
  //
  // merge nearest clusters iteratively
  //
  for (;;) {
    var DistanceThreshold = 100 * colorList.length / (8 + colorList.length);
    var IniD = 256 * 3;
    var minD = IniD, minI, minJ;
    for (var i = 0; i + 1 < colorList.length; i++) {
      var n = colorList[i][1];
      var rgbI = [
        colorList[i][2] / n,
        colorList[i][3] / n,
        colorList[i][4] / n
      ];
      for (var j = i + 1; j < colorList.length; j++) {
        n = colorList[j][1];
        var rgbJ = [
          colorList[j][2] / n,
          colorList[j][3] / n,
          colorList[j][4] / n
        ];
        var d =
            Math.abs(rgbI[0] - rgbJ[0]) +
            Math.abs(rgbI[1] - rgbJ[1]) +
            Math.abs(rgbI[2] - rgbJ[2]);
        if (minD > d) {
          minD = d;
          minI = i;
          minJ = j;
        }
      }
    }
    if (minD === IniD) {
      break;
    }
    if (minD <= DistanceThreshold) {
      colorList[minI][1] += colorList[minJ][1];
      colorList[minI][2] += colorList[minJ][2];
      colorList[minI][3] += colorList[minJ][3];
      colorList[minI][4] += colorList[minJ][4];
      for (var j = minJ; j + 1 < colorList.length; j++) {
        colorList[j][1] = colorList[j + 1][1];
        colorList[j][2] = colorList[j + 1][2];
        colorList[j][3] = colorList[j + 1][3];
        colorList[j][4] = colorList[j + 1][4];
      }
      colorList.pop();
    } else {
      break;
    }
  }
  colorList.sort(function(a, b) {
    return b[1] - a[1]; // by count
  });
  return {
    colorList: colorList,
    totalCount: colorTable.totalCount
  };
}

function calcMetrics( a, b, options )
{
  options = options || {};
  if (options.orientationA && options.orientationA !== 1) {
    a = compareImageUtil.applyOrientation(a, options.orientationA);
  }
  if (options.orientationB && options.orientationB !== 1) {
    b = compareImageUtil.applyOrientation(b, options.orientationB);
  }
  var result = {
    psnr: NaN, sad: NaN, ssd: NaN, mae: NaN, mse: NaN, ncc: NaN,
    y: { psnr: NaN, sad: NaN, ssd: NaN, mae: NaN, mse: NaN, ncc: NaN },
    ae: NaN, aeRgb: NaN, aeAlpha: NaN
  };
  if (a.width !== b.width || a.height !== b.height ||
      a.width === 0 || a.height === 0) {
    // error
    return result;
  }
  var w = a.width;
  var h = a.height;
  var sum12 = function(data) {
    var sum1 = 0, sum2 = 0, sumY1 = 0, sumY2 = 0;
    for (var i = 0, y = 0; y < h; ++y) {
      var lineSum1 = 0, lineSum2 = 0, lineSumY1 = 0, lineSumY2 = 0;
      for (var x = 0; x < w; ++x, i += 4) {
        var r = data[i + 0], g = data[i + 1], b = data[i + 2];
        var y0 = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        lineSum1 += r + g + b;
        lineSum2 += r * r + g * g + b * b;
        lineSumY1 += y0;
        lineSumY2 += y0 * y0;
      }
      sum1 += lineSum1;
      sum2 += lineSum2;
      sumY1 += lineSumY1;
      sumY2 += lineSumY2;
    }
    return [sum1, sum2, sumY1, sumY2];
  };
  var sdsum2 = function(sum12) {
    return [
      sum12[1] * (w * h * 3) - sum12[0] * sum12[0],
      sum12[3] * (w * h) - sum12[2] * sum12[2]
    ];
  };
  var calcNCC = function(dataA, dataB) {
    var sum12A = sum12(dataA), sum12B = sum12(dataB);
    var sdsumA = sdsum2(sum12A), sdsumB = sdsum2(sum12B);
    var sum = 0, sumY = 0;
    for (var i = 0, y = 0; y < h; ++y) {
      var lineSum = 0, lineSumY = 0;
      for (var x = 0; x < w; ++x, i += 4) {
        var r0 = dataA[i + 0], r1 = dataB[i + 0];
        var g0 = dataA[i + 1], g1 = dataB[i + 1];
        var b0 = dataA[i + 2], b1 = dataB[i + 2];
        var y0 = Math.round(0.299 * r0 + 0.587 * g0 + 0.114 * b0);
        var y1 = Math.round(0.299 * r1 + 0.587 * g1 + 0.114 * b1);
        lineSum += r0 * r1 + g0 * g1 + b0 * b1;
        lineSumY += y0 * y1;
      }
      sum += lineSum;
      sumY += lineSumY;
    }
    var den = Math.sqrt(sdsumA[0] * sdsumB[0]);
    var denY = Math.sqrt(sdsumA[1] * sdsumB[1]);
    var ncc = den === 0 ? 0 : (sum * (w * h * 3) - sum12A[0] * sum12B[0]) / den;
    var y_ncc = denY === 0 ? 0 : (sumY * (w * h) - sum12A[2] * sum12B[2]) / denY;
    return { ncc: ncc, y_ncc: y_ncc };
  };
  var ncc = calcNCC(a.data, b.data);
  result.ncc = ncc.ncc;
  result.y.ncc = ncc.y_ncc;
  var calcAE = function(a, b) {
    var countRgba = 0, countRgb = 0, countA = 0;
    for (var i = 0, n = a.width * a.height * 4; i !== n; i += 4) {
      var diff_rgb =
          a.data[i + 0] !== b.data[i + 0] ||
          a.data[i + 1] !== b.data[i + 1] ||
          a.data[i + 2] !== b.data[i + 2];
      var diff_a =
          a.data[i + 3] !== b.data[i + 3];
      countRgb += diff_rgb ? 1 : 0;
      countA += diff_a ? 1 : 0;
      countRgba += (diff_rgb || diff_a) ? 1 : 0;
    }
    return { rgba: countRgba, rgb: countRgb, a: countA };
  };
  var aeCounts = calcAE(a, b);
  result.ae = aeCounts.rgba;
  result.aeRgb = aeCounts.rgb;
  result.aeAlpha = aeCounts.a;
  var calcSumOfDifference = function(dataA, dataB) {
    var sumAE = 0, sumSE = 0, sumYAE = 0, sumYSE = 0;
    for (var i = 0, y = 0; y < h; ++y) {
      var lineAE = 0, lineSE = 0;
      var lineYAE = 0, lineYSE = 0;
      for (var x = 0; x < w; ++x, i += 4) {
        var r0 = dataA[i + 0], r1 = dataB[i + 0];
        var g0 = dataA[i + 1], g1 = dataB[i + 1];
        var b0 = dataA[i + 2], b1 = dataB[i + 2];
        var y0 = Math.round(0.299 * r0 + 0.587 * g0 + 0.114 * b0);
        var y1 = Math.round(0.299 * r1 + 0.587 * g1 + 0.114 * b1);
        var r = r0 - r1, g = g0 - g1, b = b0 - b1, dy = y0 - y1;
        lineAE += Math.abs(r) + Math.abs(g) + Math.abs(b);
        lineSE += r * r + g * g + b * b;
        lineYAE += Math.abs(dy);
        lineYSE += dy * dy;
      }
      sumAE += lineAE;
      sumSE += lineSE;
      sumYAE += lineYAE;
      sumYSE += lineYSE;
    }
    var wh = w * h;
    return {
      sad: sumAE,
      ssd: sumSE,
      mae: sumAE / (wh * 3),
      mse: sumSE / (wh * 3),
      y_sad: sumYAE,
      y_ssd: sumYSE,
      y_mae: sumYAE / wh,
      y_mse: sumYSE / wh
    };
  };
  var m = calcSumOfDifference(a.data, b.data);
  result.sad = m.sad;
  result.ssd = m.ssd;
  result.mae = m.mae;
  result.mse = m.mse;
  if (result.mse === 0) {
    // a === b;
    result.psnr = Infinity;
  } else {
    var max = 255 * 255;
    result.psnr = 10 * Math.log(max / result.mse) / Math.LN10;
  }
  result.y.sad = m.y_sad;
  result.y.ssd = m.y_ssd;
  result.y.mae = m.y_mae;
  result.y.mse = m.y_mse;
  if (result.y.mse === 0) {
    // a === b;
    result.y.psnr = Infinity;
  } else {
    var max = 255 * 255;
    result.y.psnr = 10 * Math.log(max / result.y.mse) / Math.LN10;
  }
  return result;
}

var calcToneCurveByHistogram = function(hist, offset, total) {
  var result = {
      cum : [ new Float32Array(1 + 256), new Float32Array(1 + 256) ],
      min : [ 0, 0 ],
      max : [ 255, 255 ]
  };
  for (var k = 0; k < 2; ++k) {
    var sum = 0;
    result.cum[k][0] = 0;
    for (var i = 0; i < 256; ++i) {
      sum += hist[k][i + offset];
      result.cum[k][i + 1] = sum / total[k];
    }
    result.cum[k][256] = 1;
    for (var i = 0; i < 256; ++i) {
      if (0 < result.cum[k][1 + i]) {
        result.min[k] = i;
        break;
      }
    }
    for (var i = 255; i >= 0; --i) {
      if (1 > result.cum[k][i]) {
        result.max[k] = i;
        break;
      }
    }
  }
  var N = 1000;
  result.points = [];
  result.points[0] = [result.min[0], result.min[1]];
  result.points[N] = [result.max[0] + 1, result.max[1] + 1];
  var j = [1, 1];
  for (var i = 1; i < N; ++i) {
    var a = i / N;
    var point = [];
    for (var k = 0; k < 2; ++k) {
      while (result.cum[k][j[k]] < a) {
        j[k] += 1;
      }
      var step = result.cum[k][j[k]] - result.cum[k][j[k] - 1];
      var delta = a - result.cum[k][j[k] - 1];
      point[k] = (j[k] - 1) + delta / step;
    }
    result.points[i] = point;
  }
  result.conf = [];
  result.conf[0] = 0;
  result.conf[N] = 0;
  var thresh = 1.5 * (256 / N);
  for (var i = 0; i < N; ++i) {
    var conf = [];
    for (var k = 0; k < 2; ++k) {
      var d = result.points[i + 1][k] - result.points[i][k];
      conf[k] = d < thresh ? 1 : Math.pow(thresh / d, 0.3);
    }
    result.conf[i] = Math.min(conf[0], conf[1]);
  }
  return result;
};
var calcToneMap = function(a, b, type) {
  var w = Math.min(a.width, b.width);
  var h = Math.min(a.height, b.height);
  var sampleA = compareImageUtil.makeImage(a);
  var sampleB = compareImageUtil.makeImage(b);
  if (w !== a.width || h !== a.height) {
    sampleA = compareImageUtil.makeImage(w, h);
    compareImageUtil.resize(sampleA, a);
  }
  if (w !== b.width || h !== b.height) {
    sampleB = compareImageUtil.makeImage(w, h);
    compareImageUtil.resize(sampleB, b);
  }
  var dist = new Uint32Array(256 * 256 * (type === 0 ? 3 : 1));
  if (type === 0) { // RGB
    for (var y = 0; y < h; ++y) {
      var ka = 4 * (sampleA.offset + y * sampleA.pitch);
      var kb = 4 * (sampleB.offset + y * sampleB.pitch);
      for (var e = ka + 4 * w; ka < e; ka += 4, kb += 4) {
        var ra = sampleA.data[ka + 0];
        var ga = sampleA.data[ka + 1];
        var ba = sampleA.data[ka + 2];
        var rb = sampleB.data[kb + 0];
        var gb = sampleB.data[kb + 1];
        var bb = sampleB.data[kb + 2];
        dist[ra + 256 * (255 - rb)] += 1;
        dist[ga + 256 * (255 - gb) + 65536] += 1;
        dist[ba + 256 * (255 - bb) + 131072] += 1;
      }
    }
  } else { // Luminance
    for (var y = 0; y < h; ++y) {
      var ka = 4 * (sampleA.offset + y * sampleA.pitch);
      var kb = 4 * (sampleB.offset + y * sampleB.pitch);
      for (var e = ka + 4 * w; ka < e; ka += 4, kb += 4) {
        var ra = sampleA.data[ka + 0];
        var ga = sampleA.data[ka + 1];
        var ba = sampleA.data[ka + 2];
        var ya = Math.round(0.299 * ra + 0.587 * ga + 0.114 * ba);
        var rb = sampleB.data[kb + 0];
        var gb = sampleB.data[kb + 1];
        var bb = sampleB.data[kb + 2];
        var yb = Math.round(0.299 * rb + 0.587 * gb + 0.114 * bb);
        dist[ya + 256 * (255 - yb)] += 1;
      }
    }
  }
  return {
    dist : dist,
    max : w * h
  };
};
var calcToneCurve = function(a, b, type, options) {
  options = options || {};
  var result = {
      components : []
  };
  // tone curve by Histogram
  var hist = [calcHistogram(a, type), calcHistogram(b, type)];
  var total = [a.width * a.height, b.width * b.height ];
  if (type === 0) { // RGB
    result.components[0] = calcToneCurveByHistogram(hist, 0, total);
    result.components[1] = calcToneCurveByHistogram(hist, 256, total);
    result.components[2] = calcToneCurveByHistogram(hist, 512, total);
  } else { // Luminance
    result.components[0] = calcToneCurveByHistogram(hist, 0, total);
  }
  // tone map
  a = compareImageUtil.makeImage(a);
  b = compareImageUtil.makeImage(b);
  if (options.orientationA && options.orientationA !== 1) {
    a = compareImageUtil.applyOrientation(a, options.orientationA);
  }
  if (options.orientationB && options.orientationB !== 1) {
    b = compareImageUtil.applyOrientation(b, options.orientationB);
  }
  result.toneMap = calcToneMap(a, b, type);
  return result;
};

function calcOpticalFlow( a, b, options ) {
  a = compareImageUtil.makeImage(a);
  b = compareImageUtil.makeImage(b);
  if (options.orientationA && options.orientationA !== 1) {
    a = compareImageUtil.applyOrientation(a, options.orientationA);
  }
  if (options.orientationB && options.orientationB !== 1) {
    b = compareImageUtil.applyOrientation(b, options.orientationB);
  }
  var w = Math.min(a.width, b.width);
  var h = Math.min(a.height, b.height);
  if (a.width !== w || a.height !== h) {
    var new_a = compareImageUtil.makeImage(w, h);
    compareImageUtil.resize(new_a, a);
    a = new_a;
  }
  if (b.width !== w || b.height !== h) {
    var new_b = compareImageUtil.makeImage(w, h);
    compareImageUtil.resize(new_b, b);
    b = new_b;
  }
  var grayA = compareImageUtil.makeImage(w, h, compareImageUtil.FORMAT_F32x1);
  var grayB = compareImageUtil.makeImage(w, h, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.convertToGrayscale(grayA, a);
  compareImageUtil.convertToGrayscale(grayB, b);
  var figImage = compareImageUtil.makeImage(w, h);
  for (var y = 0, i = 0; y < h; y++) {
    for (var x = 0; x < w; x++, i++) {
      figImage.data[i * 4 + 0] = 0.5 * a.data[i * 4 + 0];
      figImage.data[i * 4 + 1] = 0.5 * b.data[i * 4 + 1];
      figImage.data[i * 4 + 2] = 0.5 * b.data[i * 4 + 2];
      figImage.data[i * 4 + 3] = 255;
    }
  }
  a = null;
  b = null;
  var pointsA = compareImageUtil.findCornerPoints(grayA);
  compareImageUtil.adjustCornerPointsSubPixel(grayA, pointsA);
  var pointsB = compareImageUtil.sparseOpticalFlow(grayA, grayB, pointsA);
  points = [];
  for (var i = 0; i < pointsB.length; i++) {
    if (pointsB[i]) {
      points.push({
        x0: pointsA[i].x,
        y0: pointsA[i].y,
        x1: pointsB[i].x,
        y1: pointsB[i].y
      });
    }
  }
  return {
    image:      figImage,
    points:     points
  };
}

function calcDiff( a, b, options ) {
  var ignoreAE = options.ignoreAE;

  var makeDiff = function(a, b, out, summary) {
    var histogram = summary.histogram;
    var d0 = a.data, d1 = b.data, o = out.data;
    var w = a.width, h = a.height;
    var i = a.offset * 4, j = b.offset * 4, k = out.offset * 4;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++, i += 4, j += 4, k += 4) {
        var r0 = d0[i + 0], g0 = d0[i + 1], b0 = d0[i + 2], a0 = d0[i + 3];
        var r1 = d1[j + 0], g1 = d1[j + 1], b1 = d1[j + 2], a1 = d1[j + 3];
        var y0 = 0.299 * r0 + 0.587 * g0 + 0.114 * b0;
        var y1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
        var mean = Math.round((y0 * a0 + y1 * a1) * (0.30 / 255));
        var ae = Math.max(Math.abs(r0 - r1), Math.abs(g0 - g1), Math.abs(b0 - b1), Math.abs(a0 - a1));
        histogram[ae] += 1;
        if (ae === 0) {
          o[k    ] = mean;
          o[k + 2] = mean;
        } else {
          o[k    ] = ae > ignoreAE ? 255 : mean;
          o[k + 2] = ae <= ignoreAE ? 255 : mean;
        }
        o[k + 1] = mean;
        o[k + 3] = 255;
      }
      i += (a.pitch - w) * 4;
      j += (b.pitch - w) * 4;
      k += (out.pitch - w) * 4;
    }
    var unmatch = 0;
    var maxAE = 0;
    var countIgnoreAE = 0;
    for (var ae = 0; ae < 256; ae++) {
      if (0 < histogram[ae]) {
        maxAE = ae;
        if (ignoreAE < ae) {
          unmatch += histogram[ae];
        } else if (0 < ae) {
          countIgnoreAE += histogram[ae];
        }
      }
    }
    summary.unmatch += unmatch;
    summary.maxAE = Math.max(summary.maxAE, maxAE);
    summary.countIgnoreAE += countIgnoreAE;
    summary.total += w * h;
  };
  if (options.orientationA && options.orientationA !== 1) {
    a = compareImageUtil.applyOrientation(a, options.orientationA);
  }
  if (options.orientationB && options.orientationB !== 1) {
    b = compareImageUtil.applyOrientation(b, options.orientationB);
  }
  var minW = Math.min(a.width, b.width);
  var minH = Math.min(a.height, b.height);
  var maxW = Math.max(a.width, b.width);
  var maxH = Math.max(a.height, b.height);
  var useLargerSize = options.resizeToLarger || !options.ignoreRemainder;
  var regionW = useLargerSize ? maxW : minW;
  var regionH = useLargerSize ? maxH : minH;
  a = compareImageUtil.makeRegion(a, 0, 0, regionW, regionH);
  b = compareImageUtil.makeRegion(b, 0, 0, regionW, regionH);
  if (a.width < regionW || a.height < regionH) {
    var new_a = compareImageUtil.makeImage(regionW, regionH);
    if (options.resizeToLarger) {
      compareImageUtil.resize(new_a, a, options.resizeMethod);
    } else {
      compareImageUtil.copy(new_a, a);
    }
    a = new_a;
  }
  if (b.width < regionW || b.height < regionH) {
    var new_b = compareImageUtil.makeImage(regionW, regionH);
    if (options.resizeToLarger) {
      compareImageUtil.resize(new_b, b, options.resizeMethod);
    } else {
      compareImageUtil.copy(new_b, b);
    }
    b = new_b;
  }
  if (options.offsetX !== 0 || options.offsetY !== 0) {
    var ox = Math.max(-regionW, Math.min(regionW, options.offsetX));
    var oy = Math.max(-regionH, Math.min(regionH, options.offsetY));
    regionW -= Math.abs(ox);
    regionH -= Math.abs(oy);
    a = compareImageUtil.makeRegion(a,
                             Math.max(0, ox),
                             Math.max(0, oy),
                             regionW,
                             regionH);
    b = compareImageUtil.makeRegion(b,
                             Math.max(0, -ox),
                             Math.max(0, -oy),
                             regionW,
                             regionH);
  }
  var diff = compareImageUtil.makeImage(regionW, regionH);
  var summary = {
    total: 0,
    countIgnoreAE: 0,
    unmatch: 0,
    maxAE: 0,
    histogram: new Uint32Array(256)
  };
  makeDiff(a, b, diff, summary);
  summary.match = summary.total - summary.unmatch;
  return {
    image:      diff,
    summary:    summary
  };
}
