self.addEventListener('message', function(e) {
  var result = null;
  switch (e.data.cmd) {
  case 'calcHistogram':
    result = calcHistogram(e.data.imageData, e.data.type);
    break;
  case 'calcWaveform':
    result = calcWaveform(e.data.imageData, e.data.histW, e.data.type);
    break;
  }
  self.postMessage({ result: result });
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
