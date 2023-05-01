'use strict';
const isWorker = typeof importScripts !== 'undefined';

const WorkerMock = function() {
    let requestListener = null;
    let responseListener = null;
    const addEventListener = function(_event, callback) {
        requestListener = callback;
    };
    const postMessage = function(msg) {
        responseListener(msg);
    };
    return {
        addEventListener,
        postMessage,
        getRequestListener: () => requestListener,
        setResponseListener: callback => { responseListener = callback; }
    };
};

const worker = isWorker ? self : WorkerMock();

const importScript = function(relativePath) {
    const url = workerLocation || location.href;
    const baseURL = url.replace(/\\/g, '/').replace(/\/[^\/]*$/, '/');
    const path = baseURL + relativePath;
    importScripts(path);
};
if (isWorker) {
    importScript('compare-image-util.js');
} else {
    global.compareImageUtil = require('./compare-image-util.js');
}

worker.addEventListener('message', function(e) {
  const request = e.data;
  const data = request.data;
  const result = {};
  result.cmd    = data.cmd;
  result.index  = data.index;
  switch (data.cmd) {
  case 'calcHistogram':
    result.type   = data.type;
    result.auxTypes = data.auxTypes;
    result.result   = calcHistogram(data.imageData[0], data.type, data.auxTypes);
    break;
  case 'calcWaveform':
    result.type   = data.type;
    result.auxTypes = data.auxTypes;
    result.result = calcWaveform(data.imageData[0], data.histW, data.transposed, data.flipped, data.type, data.auxTypes);
    result.histW = data.histW;
    break;
  case 'calcVectorscope':
    result.type   = data.type;
    result.color  = data.color;
    result.auxTypes  = data.auxTypes;
    result.result = calcVectorscope(data.imageData[0], data.type, data.color, data.auxTypes);
    result.w = data.imageData[0].width;
    result.h = data.imageData[0].height;
    break;
  case 'calcColorTable':
    result.result = compareImageUtil.getUniqueColors(data.imageData[0]);
    break;
  case 'calc3DWaveform':
    result.result = calc3DWaveform(data.imageData[0], data.baseSize);
    break;
  case 'calcReducedColorTable':
    result.result = calcReducedColorTable(data.imageData[0]);
    break;
  case 'calcMetrics':
    result.auxTypes = data.auxTypes;
    result.result = calcMetrics(data.imageData[0], data.imageData[1], data.options, data.auxTypes);
    break;
  case 'calcToneCurve':
    result.type   = data.type;
    result.auxTypes   = data.auxTypes;
    result.result = calcToneCurve(data.imageData[0], data.imageData[1], data.type, data.auxTypes, data.options);
    break;
  case 'calcOpticalFlow':
    result.result = calcOpticalFlow(data.imageData[0], data.imageData[1], data.options);
    break;
  case 'calcDiff':
    result.result = calcDiff(data.imageData[0], data.imageData[1], data.options);
    result.options = data.options;
    break;
  }
  const response = { data: result, requestId: request.requestId }
  worker.postMessage( response );
}, false);

const srgb255ToLinear255 = (function() {
  const srgb255ToLinear255 = new Float32Array(256);
  for (let i = 0; i < 256; ++i) {
    const c = i / 255;
    const linear = c < 0.040450 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    srgb255ToLinear255[i] = linear * 255;
  }
  return srgb255ToLinear255;
})();

function calcHistogram( imageData, type, auxTypes )
{
  const w = imageData.width;
  const h = imageData.height;
  const channels = (type === 0 || type === 2) ? 3 : 1;
  const hist = new Uint32Array(256 * channels);
  if (type === 0) { // RGB
    for (let i = 0, n = 4 * w * h; i < n; i += 4) {
      hist[imageData.data[i + 0]] += 1;
      hist[imageData.data[i + 1] + 256] += 1;
      hist[imageData.data[i + 2] + 512] += 1;
    }
  } else if (type === 1) { // Luminance
    let m0,m1,m2;
    if (auxTypes[0] === 0) { // 0: bt601
      m0 = 0.2990, m1 = 0.5870, m2 = 0.1140;
    } else { // 1: bt709
      m0 = 0.2126, m1 = 0.7152, m2 = 0.0722;
    }
    for (let i = 0, n = 4 * w * h; i < n; i += 4) {
      const r = imageData.data[i + 0];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const y = Math.round(m0 * r + m1 * g + m2 * b);
      hist[y] += 1;
    }
  } else { // YCbCr
    let m0,m1,m2,m3,m4,m5,m6,m7,m8;
    if (auxTypes[0] === 0) { // 0: bt601
      m0 =  0.2990, m1 =  0.5870, m2 =  0.1140;
      m3 = -0.1687, m4 = -0.3313, m5 =  0.5000;
      m6 =  0.5000, m7 = -0.4187, m8 = -0.0813;
    } else { // 1: bt709
      m0 =  0.2126, m1 =  0.7152, m2 =  0.0722;
      m3 = -0.1146, m4 = -0.3854, m5 =  0.5000;
      m6 =  0.5000, m7 = -0.4542, m8 = -0.0458;
    }
    for (let i = 0, n = 4 * w * h; i < n; i += 4) {
      const r = imageData.data[i + 0];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const y = Math.round(m0 * r + m1 * g + m2 * b);
      const cb = Math.round(m3 * r + m4 * g + m5 * b + 127.50001); // 0.00001 for stable rounding
      const cr = Math.round(m6 * r + m7 * g + m8 * b + 127.50001);
      hist[y] += 1;
      hist[cb + 256] += 1;
      hist[cr + 512] += 1;
    }
  }
  return hist;
}
function calcWaveform( imageData, histW, transposed, flipped, type, auxTypes )
{
  const w = transposed ? imageData.height : imageData.width;
  const h = transposed ? imageData.width : imageData.height;
  const channels = (type === 0 || type === 2) ? 3 : 1;
  const hist = new Uint32Array(256 * histW * channels);
  const sx = transposed ? h * 4 : 4;
  const sy = transposed ? 4 : w * 4;
  let m0,m1,m2,m3,m4,m5,m6,m7,m8;
  if (type === 1) { // Luminance
    if (auxTypes[1] === 0) { // 0: bt601
      m0 = 0.2990, m1 = 0.5870, m2 = 0.1140;
    } else { // 1: bt709
      m0 = 0.2126, m1 = 0.7152, m2 = 0.0722;
    }
  } else if (type === 2) { // YCbCr
    if (auxTypes[1] === 0) { // 0: bt601
      m0 =  0.2990, m1 =  0.5870, m2 =  0.1140;
      m3 = -0.1687, m4 = -0.3313, m5 =  0.5000;
      m6 =  0.5000, m7 = -0.4187, m8 = -0.0813;
    } else { // 1: bt709
      m0 =  0.2126, m1 =  0.7152, m2 =  0.0722;
      m3 = -0.1146, m4 = -0.3854, m5 =  0.5000;
      m6 =  0.5000, m7 = -0.4542, m8 = -0.0458;
    }
  }
  for (let x = 0; x < w; ++x) {
    let i = x * sx;
    const off0 = 256 * Math.round(((flipped ? w - 1 - x : x) + 0.5) / w * histW - 0.5);
    if (type === 0) { // RGB
      const off1 = off0 + 256 * histW;
      const off2 = off0 + 512 * histW;
      for (let y = 0; y < h; ++y, i += sy) {
        let r = imageData.data[i + 0];
        let g = imageData.data[i + 1];
        let b = imageData.data[i + 2];
        if (auxTypes[0] === 1) {
          r = Math.round(srgb255ToLinear255[r]);
          g = Math.round(srgb255ToLinear255[g]);
          b = Math.round(srgb255ToLinear255[b]);
        }
        hist[off0 + r] += 1;
        hist[off1 + g] += 1;
        hist[off2 + b] += 1;
      }
    } else if (type === 1) { // Luminance
      for (let y = 0; y < h; ++y, i += sy) {
        const r = imageData.data[i + 0];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const my = Math.round(m0 * r + m1 * g + m2 * b);
        hist[off0 + my] += 1;
      }
    } else { // YCbCr
      const off1 = off0 + 256 * histW;
      const off2 = off0 + 512 * histW;
      for (let y = 0; y < h; ++y, i += sy) {
        const r = imageData.data[i + 0];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const my = Math.round(m0 * r + m1 * g + m2 * b);
        const cb = Math.round(m3 * r + m4 * g + m5 * b + 127.50001); // 0.00001 for stable rounding
        const cr = Math.round(m6 * r + m7 * g + m8 * b + 127.50001);
        hist[off0 + my] += 1;
        hist[off1 + cb] += 1;
        hist[off2 + cr] += 1;
      }
    }
  }
  return hist;
}

function calcVectorscope( imageData, type, colorMode, auxTypes )
{
  const w = imageData.width;
  const h = imageData.height;
  const dist = new Uint32Array(320 * 320);
  const colorMap = colorMode ? new Float32Array(320 * 320 * 3) : null;
  if (type === 0) { // Cb-Cr
    for (let k = 0, n = 4 * w * h; k < n; k += 4) {
      const r = imageData.data[k];
      const g = imageData.data[k + 1];
      const b = imageData.data[k + 2];
      let cb, cr;
      if (auxTypes[1] === 0) { // 0: bt601
        cb = -0.1687 * r - 0.3313 * g + 0.5000 * b;
        cr =  0.5000 * r - 0.4187 * g - 0.0813 * b;
      } else { // 1: bt709
        cb = -0.1146 * r - 0.3854 * g + 0.5000 * b;
        cr =  0.5000 * r - 0.4542 * g - 0.0458 * b;
      }
      const plotx = Math.round(159.5 + cb);
      const ploty = Math.round(159.5 - cr);
      const offset = ploty * 320 + plotx;
      dist[offset] += 1;
      if (colorMap) {
        colorMap[offset] += r;
        colorMap[offset + 102400] += g;
        colorMap[offset + 204800] += b;
      }
    }
  } else if (type === 1) { // x-y
    for (let k = 0, n = 4 * w * h; k < n; k += 4) {
      const r = imageData.data[k];
      const g = imageData.data[k + 1];
      const b = imageData.data[k + 2];
      const linr = srgb255ToLinear255[r];
      const ling = srgb255ToLinear255[g];
      const linb = srgb255ToLinear255[b];
      const capX = 0.4124564 * linr + 0.3575761 * ling + 0.1804375 * linb;
      const capY = 0.2126729 * linr + 0.7151522 * ling + 0.0721750 * linb;
      const capZ = 0.0193339 * linr + 0.1191920 * ling + 0.9503041 * linb;
      const xyz = capX + capY + capZ;
      const x = Math.round((xyz === 0 ? 0.3127 : capX / xyz) * 255 * 1.5);
      const y = Math.round((xyz === 0 ? 0.3290 : capY / xyz) * 255 * 1.5);
      const plotx = 32 + x;
      const ploty = 287 - y;
      const offset = ploty * 320 + plotx;
      dist[offset] += 1;
      if (colorMap) {
        colorMap[offset] += r;
        colorMap[offset + 102400] += g;
        colorMap[offset + 204800] += b;
      }
    }
  } else if (type === 2) { // G-B
    for (let k = 0, n = 4 * w * h; k < n; k += 4) {
      const g = imageData.data[k + 1];
      const b = imageData.data[k + 2];
      let plotx, ploty;
      if (auxTypes[0] === 0) { // sRGB
        plotx = 32 + g;
        ploty = 287 - b;
      } else { // Linear sRGB
        const ling = Math.round(srgb255ToLinear255[g]);
        const linb = Math.round(srgb255ToLinear255[b]);
        plotx = 32 + ling;
        ploty = 287 - linb;
      }
      const offset = ploty * 320 + plotx;
      dist[offset] += 1;
      if (colorMap) {
        colorMap[offset] += imageData.data[k];;
        colorMap[offset + 102400] += g;
        colorMap[offset + 204800] += b;
      }
    }
  } else if (type === 3) { // G-R
    for (let k = 0, n = 4 * w * h; k < n; k += 4) {
      const r = imageData.data[k];
      const g = imageData.data[k + 1];
      let plotx, ploty;
      if (auxTypes[0] === 0) { // sRGB
        plotx = 32 + g;
        ploty = 287 - r;
      } else { // Linear sRGB
        const linr = Math.round(srgb255ToLinear255[r]);
        const ling = Math.round(srgb255ToLinear255[g]);
        plotx = 32 + ling;
        ploty = 287 - linr;
      }
      const offset = ploty * 320 + plotx;
      dist[offset] += 1;
      if (colorMap) {
        colorMap[offset] += r;
        colorMap[offset + 102400] += g;
        colorMap[offset + 204800] += imageData.data[k + 2];
      }
    }
  } else { // B-R
    for (let k = 0, n = 4 * w * h; k < n; k += 4) {
      const r = imageData.data[k];
      const b = imageData.data[k + 2];
      let plotx, ploty;
      if (auxTypes[0] === 0) { // sRGB
        plotx = 32 + b;
        ploty = 287 - r;
      } else { // Linear sRGB
        const linr = Math.round(srgb255ToLinear255[r]);
        const linb = Math.round(srgb255ToLinear255[b]);
        plotx = 32 + linb;
        ploty = 287 - linr;
      }
      const offset = ploty * 320 + plotx;
      dist[offset] += 1;
      if (colorMap) {
        colorMap[offset] += r;
        colorMap[offset + 102400] += imageData.data[k + 1];
        colorMap[offset + 204800] += b;
      }
    }
  }
  return {
    dist,
    colorMap
  };
}

function calc3DWaveform(imageData, baseSize)
{
  baseSize = baseSize || 256;
  let w = imageData.width;
  let h = imageData.height;
  if (w < h) {
    w = Math.max(1, Math.round(baseSize * w / h));
    h = baseSize;
  } else {
    h = Math.max(1, Math.round(baseSize * h / w));
    w = baseSize;
  }
  const input = compareImageUtil.makeImage(imageData);
  const resized = compareImageUtil.makeImage(w, h);
  compareImageUtil.resizeNN(resized, input);
  const waveform3d = new Uint8Array(w * h * 3);
  // RGB
  for (let i = 0, k = 0, n = 4 * w * h; i < n; i += 4, k += 3) {
    waveform3d[k + 0] = resized.data[i + 0];
    waveform3d[k + 1] = resized.data[i + 1];
    waveform3d[k + 2] = resized.data[i + 2];
  }
  return {
    width: w,
    height: h,
    waveform: waveform3d
  };
}

function calcReducedColorTable( imageData )
{
  const rgbToYcbcr = function(r, g, b) {
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = -0.1687 * r + -0.3313 * g + 0.5000 * b + 127.5;
    const cr = 0.5000 * r + -0.4187 * g + -0.0813 * b + 127.5;
    return [y, cb, cr];
  };
  const colorTable = compareImageUtil.getUniqueColors(imageData);
  const colors_org = colorTable.colors;
  const counts_org = colorTable.counts;
  const length_org = counts_org.length;
  //
  // very fast and simple clustering using quantization of color components
  //
  let colorList = [];
  for (let k = 0; k < length_org; k++) {
    const r = colors_org[k] >> 16;
    const g = (colors_org[k] >> 8) & 255;
    const b = colors_org[k] & 255;
    const ycbcr = rgbToYcbcr(r, g, b);
    const y = Math.round(Math.round((ycbcr[0] / 255) * 3) / 3 * 255);
    const div = y < 128 ? 4 : 6;
    const cb = Math.round(Math.round((ycbcr[1] / 255) * div) / div * 255);
    const cr = Math.round(Math.round((ycbcr[2] / 255) * div) / div * 255);
    const count = counts_org[k];
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
  let uniqueCount = 1;
  for (let k = 1; k < colorList.length; k++) {
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
    const DistanceThreshold = 100 * colorList.length / (8 + colorList.length);
    const IniD = 256 * 3;
    let minD = IniD, minI, minJ;
    for (let i = 0; i + 1 < colorList.length; i++) {
      let n = colorList[i][1];
      const rgbI = [
        colorList[i][2] / n,
        colorList[i][3] / n,
        colorList[i][4] / n
      ];
      for (let j = i + 1; j < colorList.length; j++) {
        n = colorList[j][1];
        const rgbJ = [
          colorList[j][2] / n,
          colorList[j][3] / n,
          colorList[j][4] / n
        ];
        const d =
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
      for (let j = minJ; j + 1 < colorList.length; j++) {
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

const applyOrientation = function(img, orientation) {
  if (orientation && orientation !== 1) {
    img = compareImageUtil.applyOrientation(img, orientation);
  }
  return img;
};
function calcMetrics( a, b, options, auxTypes )
{
  options = options || {};
  auxTypes = auxTypes || [0];
  a = applyOrientation(a, options.orientationA);
  b = applyOrientation(b, options.orientationB);
  const result = {
    psnr: NaN, sad: NaN, ssd: NaN, mae: NaN, mse: NaN, ncc: NaN,
    y: { psnr: NaN, sad: NaN, ssd: NaN, mae: NaN, mse: NaN, ncc: NaN },
    ae: NaN, aeRgb: NaN, aeAlpha: NaN
  };
  if (a.width !== b.width || a.height !== b.height ||
      a.width === 0 || a.height === 0) {
    // error
    return result;
  }
  let m0,m1,m2;
  if (auxTypes[0] === 0) { // 0: bt601
    m0 = 0.2990, m1 = 0.5870, m2 = 0.1140;
  } else { // 1: bt709
    m0 = 0.2126, m1 = 0.7152, m2 = 0.0722;
  }
  const w = a.width;
  const h = a.height;
  const sum12 = function(data) {
    let sum1 = 0, sum2 = 0, sumY1 = 0, sumY2 = 0;
    for (let i = 0, y = 0; y < h; ++y) {
      let lineSum1 = 0, lineSum2 = 0, lineSumY1 = 0, lineSumY2 = 0;
      for (let x = 0; x < w; ++x, i += 4) {
        const r = data[i + 0], g = data[i + 1], b = data[i + 2];
        const y0 = Math.round(m0 * r + m1 * g + m2 * b);
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
  const sdsum2 = function(sum12) {
    return [
      sum12[1] * (w * h * 3) - sum12[0] * sum12[0],
      sum12[3] * (w * h) - sum12[2] * sum12[2]
    ];
  };
  const calcNCC = function(dataA, dataB) {
    const sum12A = sum12(dataA), sum12B = sum12(dataB);
    const sdsumA = sdsum2(sum12A), sdsumB = sdsum2(sum12B);
    let sum = 0, sumY = 0;
    for (let i = 0, y = 0; y < h; ++y) {
      let lineSum = 0, lineSumY = 0;
      for (let x = 0; x < w; ++x, i += 4) {
        const r0 = dataA[i + 0], r1 = dataB[i + 0];
        const g0 = dataA[i + 1], g1 = dataB[i + 1];
        const b0 = dataA[i + 2], b1 = dataB[i + 2];
        const y0 = Math.round(m0 * r0 + m1 * g0 + m2 * b0);
        const y1 = Math.round(m0 * r1 + m1 * g1 + m2 * b1);
        lineSum += r0 * r1 + g0 * g1 + b0 * b1;
        lineSumY += y0 * y1;
      }
      sum += lineSum;
      sumY += lineSumY;
    }
    const den = Math.sqrt(sdsumA[0] * sdsumB[0]);
    const denY = Math.sqrt(sdsumA[1] * sdsumB[1]);
    const ncc = den === 0 ? NaN : (sum * (w * h * 3) - sum12A[0] * sum12B[0]) / den;
    const y_ncc = denY === 0 ? NaN : (sumY * (w * h) - sum12A[2] * sum12B[2]) / denY;
    return { ncc, y_ncc };
  };
  const ncc = calcNCC(a.data, b.data);
  result.ncc = ncc.ncc;
  result.y.ncc = ncc.y_ncc;
  const calcAE = function(a, b) {
    let countRgba = 0, countRgb = 0, countA = 0;
    for (let i = 0, n = a.width * a.height * 4; i !== n; i += 4) {
      const diff_rgb =
          a.data[i + 0] !== b.data[i + 0] ||
          a.data[i + 1] !== b.data[i + 1] ||
          a.data[i + 2] !== b.data[i + 2];
      const diff_a =
          a.data[i + 3] !== b.data[i + 3];
      countRgb += diff_rgb ? 1 : 0;
      countA += diff_a ? 1 : 0;
      countRgba += (diff_rgb || diff_a) ? 1 : 0;
    }
    return { rgba: countRgba, rgb: countRgb, a: countA };
  };
  const aeCounts = calcAE(a, b);
  result.ae = aeCounts.rgba;
  result.aeRgb = aeCounts.rgb;
  result.aeAlpha = aeCounts.a;
  const calcSumOfDifference = function(dataA, dataB) {
    let sumAE = 0, sumSE = 0, sumYAE = 0, sumYSE = 0;
    for (let i = 0, y = 0; y < h; ++y) {
      let lineAE = 0, lineSE = 0;
      let lineYAE = 0, lineYSE = 0;
      for (let x = 0; x < w; ++x, i += 4) {
        const r0 = dataA[i + 0], r1 = dataB[i + 0];
        const g0 = dataA[i + 1], g1 = dataB[i + 1];
        const b0 = dataA[i + 2], b1 = dataB[i + 2];
        const y0 = Math.round(m0 * r0 + m1 * g0 + m2 * b0);
        const y1 = Math.round(m0 * r1 + m1 * g1 + m2 * b1);
        const r = r0 - r1, g = g0 - g1, b = b0 - b1, dy = y0 - y1;
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
    const wh = w * h;
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
  const m = calcSumOfDifference(a.data, b.data);
  result.sad = m.sad;
  result.ssd = m.ssd;
  result.mae = m.mae;
  result.mse = m.mse;
  if (result.mse === 0) {
    // a === b;
    result.psnr = Infinity;
  } else {
    const max = 255 * 255;
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
    const max = 255 * 255;
    result.y.psnr = 10 * Math.log(max / result.y.mse) / Math.LN10;
  }
  return result;
}

const calcToneCurveByHistogram = function(hist, offset, total) {
  const result = {
      cum : [ new Float32Array(1 + 256), new Float32Array(1 + 256) ],
      min : [ 0, 0 ],
      max : [ 255, 255 ]
  };
  for (let k = 0; k < 2; ++k) {
    let sum = 0;
    result.cum[k][0] = 0;
    for (let i = 0; i < 256; ++i) {
      sum += hist[k][i + offset];
      result.cum[k][i + 1] = sum / total[k];
    }
    result.cum[k][256] = 1;
    for (let i = 0; i < 256; ++i) {
      if (0 < result.cum[k][1 + i]) {
        result.min[k] = i;
        break;
      }
    }
    for (let i = 255; i >= 0; --i) {
      if (1 > result.cum[k][i]) {
        result.max[k] = i;
        break;
      }
    }
  }
  const N = 1000;
  result.points = [];
  result.points[0] = [result.min[0], result.min[1]];
  result.points[N] = [result.max[0] + 1, result.max[1] + 1];
  const j = [1, 1];
  for (let i = 1; i < N; ++i) {
    const a = i / N;
    const point = [];
    for (let k = 0; k < 2; ++k) {
      while (result.cum[k][j[k]] < a) {
        j[k] += 1;
      }
      const step = result.cum[k][j[k]] - result.cum[k][j[k] - 1];
      const delta = a - result.cum[k][j[k] - 1];
      point[k] = (j[k] - 1) + delta / step;
    }
    result.points[i] = point;
  }
  result.conf = [];
  result.conf[0] = 0;
  result.conf[N] = 0;
  const thresh = 1.5 * (256 / N);
  for (let i = 0; i < N; ++i) {
    const conf = [];
    for (let k = 0; k < 2; ++k) {
      const d = result.points[i + 1][k] - result.points[i][k];
      conf[k] = d < thresh ? 1 : Math.pow(thresh / d, 0.3);
    }
    result.conf[i] = Math.min(conf[0], conf[1]);
  }
  return result;
};
const calcToneMap = function(a, b, type, auxTypes) {
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const adjustImageSize = function(img, w, h) {
    if (w !== img.width || h !== img.height) {
      const newImg = compareImageUtil.makeImage(w, h);
      compareImageUtil.resize(newImg, img);
      return newImg;
    } else {
      return compareImageUtil.makeImage(img);
    }
  };
  const sampleA = adjustImageSize(a, w, h);
  const sampleB = adjustImageSize(b, w, h);
  const dist = new Uint32Array(256 * 256 * (type === 0 ? 3 : 1));
  if (type === 0) { // RGB
    for (let y = 0; y < h; ++y) {
      let ka = 4 * (sampleA.offset + y * sampleA.pitch);
      let kb = 4 * (sampleB.offset + y * sampleB.pitch);
      for (const e = ka + 4 * w; ka < e; ka += 4, kb += 4) {
        const ra = sampleA.data[ka + 0];
        const ga = sampleA.data[ka + 1];
        const ba = sampleA.data[ka + 2];
        const rb = sampleB.data[kb + 0];
        const gb = sampleB.data[kb + 1];
        const bb = sampleB.data[kb + 2];
        dist[ra + 256 * (255 - rb)] += 1;
        dist[ga + 256 * (255 - gb) + 65536] += 1;
        dist[ba + 256 * (255 - bb) + 131072] += 1;
      }
    }
  } else { // Luminance
    let m0, m1, m2;
    if (auxTypes[0] === 0) { // 0: bt601
      m0 = 0.2990, m1 = 0.5870, m2 = 0.1140;
    } else { // 1: bt709
      m0 = 0.2126, m1 = 0.7152, m2 = 0.0722;
    }
    for (let y = 0; y < h; ++y) {
      let ka = 4 * (sampleA.offset + y * sampleA.pitch);
      let kb = 4 * (sampleB.offset + y * sampleB.pitch);
      for (const e = ka + 4 * w; ka < e; ka += 4, kb += 4) {
        const ra = sampleA.data[ka + 0];
        const ga = sampleA.data[ka + 1];
        const ba = sampleA.data[ka + 2];
        const ya = Math.round(m0 * ra + m1 * ga + m2 * ba);
        const rb = sampleB.data[kb + 0];
        const gb = sampleB.data[kb + 1];
        const bb = sampleB.data[kb + 2];
        const yb = Math.round(m0 * rb + m1 * gb + m2 * bb);
        dist[ya + 256 * (255 - yb)] += 1;
      }
    }
  }
  return {
    dist : dist,
    max : w * h
  };
};
const calcToneCurve = function(a, b, type, auxTypes, options) {
  options = options || {};
  const result = {
      components : []
  };
  // tone curve by Histogram
  const hist = [calcHistogram(a, type, auxTypes), calcHistogram(b, type, auxTypes)];
  const total = [a.width * a.height, b.width * b.height];
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
  a = applyOrientation(a, options.orientationA);
  b = applyOrientation(b, options.orientationB);
  result.toneMap = calcToneMap(a, b, type, auxTypes);
  return result;
};

const calcOpticalFlow = function( a, b, options ) {
  a = compareImageUtil.makeImage(a);
  b = compareImageUtil.makeImage(b);
  a = applyOrientation(a, options.orientationA);
  b = applyOrientation(b, options.orientationB);
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const adjustImageSize = function(img, w, h) {
    if (img.width !== w || img.height !== h) {
      const newImg = compareImageUtil.makeImage(w, h);
      compareImageUtil.resize(newImg, img);
      img = newImg;
    }
    return img;
  };
  a = adjustImageSize(a, w, h);
  b = adjustImageSize(b, w, h);
  const grayA = compareImageUtil.makeImage(w, h, compareImageUtil.FORMAT_F32x1);
  const grayB = compareImageUtil.makeImage(w, h, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.convertToGrayscale(grayA, a);
  compareImageUtil.convertToGrayscale(grayB, b);
  const figImage = compareImageUtil.makeImage(w, h);
  for (let y = 0, i = 0; y < h; y++) {
    for (let x = 0; x < w; x++, i++) {
      figImage.data[i * 4 + 0] = 0.5 * a.data[i * 4 + 0];
      figImage.data[i * 4 + 1] = 0.5 * b.data[i * 4 + 1];
      figImage.data[i * 4 + 2] = 0.5 * b.data[i * 4 + 2];
      figImage.data[i * 4 + 3] = 255;
    }
  }
  a = null;
  b = null;
  const pointsA = compareImageUtil.findCornerPoints(grayA);
  compareImageUtil.adjustCornerPointsSubPixel(grayA, pointsA);
  const pointsB = compareImageUtil.sparseOpticalFlow(grayA, grayB, pointsA);
  const points = [];
  for (let i = 0; i < pointsB.length; i++) {
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
};

const makeDiffImage = function(a, b, ignoreAE, imageType, summary) {
  const w = a.width, h = a.height;
  const out = compareImageUtil.makeImage(w, h);
  const histogram = summary.histogram;
  const d0 = a.data, d1 = b.data, o = out.data;
  let i = a.offset * 4, j = b.offset * 4, k = out.offset * 4;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++, i += 4, j += 4, k += 4) {
      const r0 = d0[i + 0], g0 = d0[i + 1], b0 = d0[i + 2], a0 = d0[i + 3];
      const r1 = d1[j + 0], g1 = d1[j + 1], b1 = d1[j + 2], a1 = d1[j + 3];
      let ae = Math.max(Math.abs(r0 - r1), Math.abs(g0 - g1), Math.abs(b0 - b1), Math.abs(a0 - a1));
      histogram[ae] += 1;
      if (imageType === 0) { // 0:Red-Blue
        const y0 = 0.299 * r0 + 0.587 * g0 + 0.114 * b0;
        const y1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
        const mean = Math.round((y0 * a0 + y1 * a1) * (0.30 / 255));
        if (ae === 0) {
          o[k    ] = mean;
          o[k + 2] = mean;
        } else {
          o[k    ] = ae > ignoreAE ? 255 : mean;
          o[k + 2] = ae <= ignoreAE ? 255 : mean;
        }
        o[k + 1] = mean;
        o[k + 3] = 255;
      } else { // 1:Grayscale
        ae = ae > ignoreAE ? ae : 0;
        o[k    ] = ae;
        o[k + 1] = ae;
        o[k + 2] = ae;
        o[k + 3] = 255;
      }
    }
    i += (a.pitch - w) * 4;
    j += (b.pitch - w) * 4;
    k += (out.pitch - w) * 4;
  }
  let unmatch = 0;
  let maxAE = 0;
  let countIgnoreAE = 0;
  for (let ae = 0; ae < 256; ae++) {
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
  return out;
};

function calcDiff( a, b, options ) {
  a = applyOrientation(a, options.orientationA);
  b = applyOrientation(b, options.orientationB);
  const minW = Math.min(a.width, b.width);
  const minH = Math.min(a.height, b.height);
  const maxW = Math.max(a.width, b.width);
  const maxH = Math.max(a.height, b.height);
  const useLargerSize = options.resizeToLarger || !options.ignoreRemainder;
  let regionW = useLargerSize ? maxW : minW;
  let regionH = useLargerSize ? maxH : minH;
  a = compareImageUtil.makeRegion(a, 0, 0, regionW, regionH);
  b = compareImageUtil.makeRegion(b, 0, 0, regionW, regionH);
  const adjustImageSize = function(img, commonW, commonH, options) {
    if (img.width < commonW || img.height < commonH) {
      const newImg = compareImageUtil.makeImage(commonW, commonH);
      if (options.resizeToLarger) {
        compareImageUtil.resize(newImg, img, options.resizeMethod);
      } else {
        compareImageUtil.copy(newImg, img);
      }
      img = newImg;
    }
    return img;
  };
  a = adjustImageSize(a, regionW, regionH, options);
  b = adjustImageSize(b, regionW, regionH, options);
  if (options.offsetX !== 0 || options.offsetY !== 0) {
    const ox = Math.max(-regionW, Math.min(regionW, options.offsetX));
    const oy = Math.max(-regionH, Math.min(regionH, options.offsetY));
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
  const summary = {
    total: 0,
    countIgnoreAE: 0,
    unmatch: 0,
    maxAE: 0,
    histogram: new Uint32Array(256)
  };
  const ignoreAE = options.ignoreAE;
  const imageType = options.imageType || 0;
  const image = makeDiffImage(a, b, ignoreAE, imageType, summary);
  summary.match = summary.total - summary.unmatch;
  return {
    image,
    summary
  };
}

if (typeof module !== 'undefined') {
    module.exports = worker;
}
