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
  case 'calcPSNR':
    result.result = calcPSNR(data.imageData1, data.imageData2);
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

function calcPSNR( a, b )
{
  if (a.width != b.width || a.height != b.height) {
    // error
    return NaN;
  }
  if (a.width == 0 || a.height == 0) {
    // error
    return NaN;
  }
  var w = a.width;
  var h = a.height;
  var sum = 0, i = 0;
  for (var y = 0; y < h; ++y) {
    var lineSum = 0;
    for (var x= 0; x < w; ++x, i += 4) {
      var d0 = a.data[i + 0] - b.data[i + 0];
      var d1 = a.data[i + 1] - b.data[i + 1];
      var d2 = a.data[i + 2] - b.data[i + 2];
      var e = d0 * d0 + d1 * d1 + d2 * d2;
      lineSum += e;
    }
    sum += lineSum;
  }
  if (sum == 0) {
    // a == b;
    return Infinity;
  }
  var mse = sum / (w * h * 3);
  var max = 255 * 255;
  var psnr = 10 * Math.log(max / mse) / Math.LN10;
  return psnr;
}
