'use strict';
const CompareUtil = function(window) {

  const browserNameOf = function(ua) {
    ua = ua.toLowerCase();
    return (
      (0 <= ua.indexOf('msie') || 0 <= ua.indexOf('trident')) ? 'msie' :
      0 <= ua.indexOf('edge') ? 'edge' :
      0 <= ua.indexOf('chrome') ? 'chrome' :
      0 <= ua.indexOf('safari') ? 'safari' :
      0 <= ua.indexOf('firefox') ? 'firefox' :
      0 <= ua.indexOf('opera') ? 'opera' : ''
    );
  };
  const browserName = browserNameOf(window.navigator.userAgent);

  // https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
  const storageAvailable = function(type) {
    try {
      const storage = window[type], x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch(e) {
      return e instanceof DOMException && (
        // everything except Firefox
        e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === 'QuotaExceededError' ||
        // Firefox
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      ) && (
        // acknowledge QuotaExceededError only if there's something already stored
        storage.length !== 0
      );
    }
  };

  const drawImageAwareOfOrientation = function() {
    return new Promise(function(resolve, reject) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 2;
        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);
        const imageData = context.getImageData(0, 0, 2, 2);
        resolve(imageData.data[4] == 0);
      };
      img.onerror = reject;
      // this jpeg is 2x1 with orientation=8 so it should rotate to 1x2
      img.src = 'data:image/jpeg;base64,/9j/4QAeRXhpZgAASUkqAAgAAAABABIBAwABAAAACAAAAP/bAEMA' +
                'AgEBAQEBAgEBAQICAgICBAMCAgICBQQEAwQGBQYGBgUGBgYHCQgGBwkHBgYICwgJCgoKCgoGCAs' +
                'MCwoMCQoKCv/AAAsIAAEAAgEBEQD/xAAUAAEAAAAAAAAAAAAAAAAAAAAJ/8QAFBABAAAAAAAAAA' +
                'AAAAAAAAAAAP/aAAgBAQAAPwB/H//Z';
    });
  };

  const createObjectURL = function(blob) {
    if (window.URL) {
      return window.URL.createObjectURL(blob);
    } else {
      return window.webkitURL.createObjectURL(blob);
    }
  };
  const revokeObjectURL = function(url) {
    if (window.URL) {
      return window.URL.revokeObjectURL(url);
    } else {
      return window.webkitURL.revokeObjectURL(blob);
    }
  };

  const newWorker = function(relativePath) {
    const newWorkerViaBlob = function(relativePath) {
      const baseURL = window.location.href.replace(/\\/g, '/').replace(/\/[^\/]*$/, '/');
      const path = baseURL + relativePath;
      const array = [
        'var workerLocation = "' + path + '";' +
        'importScripts("' + path + '");'
      ];
      const blob = new Blob(array, {type: 'text/javascript'});
      const url = createObjectURL(blob);
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

  const toggleFullscreen = function(element) {
    const fullscreen = document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement;
    if (!fullscreen) {
      const view = element;
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

  const clamp = function(num, lower, upper) {
    return Math.max(lower, Math.min(upper, num));
  };

  const calcGCD = function(a, b) {
    let m = Math.max(a, b), n = Math.min(a, b);
    while (n > 0) {
      const r = m % n;
      m = n;
      n = r;
    }
    return m;
  };

  const addComma = function(num) {
    return String(num).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
  };

  const hyphenToMinus = function(str) {
    return String(str).replace(/\-/g, '\u2212');
  };

  const toSignedFixed = function(num, digits) {
    digits = digits === undefined ? 0 : digits;
    const scale = Math.pow(10, digits);
    const intnum =  Math.round(num * scale);
    const sign = 0 < intnum ? '+' : 0 > intnum ? '\u2212' : '';
    return sign + (Math.abs(intnum) / scale).toFixed(digits);
  };

  const toPercent = function(num) {
    if (num === 0) return '0%';
    if (num === 1) return '100%';
    const digits =
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

  const HexDigits = '0123456789ABCDEF';
  const toHexTriplet = function(r, g, b) {
    r = clamp(Math.round(r), 0, 255);
    g = clamp(Math.round(g), 0, 255);
    b = clamp(Math.round(b), 0, 255);
    return '#' +
        HexDigits[r >> 4] + HexDigits[r % 16] +
        HexDigits[g >> 4] + HexDigits[g % 16] +
        HexDigits[b >> 4] + HexDigits[b % 16];
  };
  const srgb255ToLinear255 = (function() {
    const srgb255ToLinear255 = new Float32Array(256);
    for (let i = 0; i < 256; ++i) {
      const c = i / 255;
      const linear = c < 0.040450 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      srgb255ToLinear255[i] = linear * 255;
    }
    return srgb255ToLinear255;
  })();
  const srgb255ToLinear8 = (function() {
    const srgb255ToLinear8 = new Uint8Array(256);
    for (let i = 0; i < 256; ++i) {
      srgb255ToLinear8[i] = Math.round(srgb255ToLinear255[i]);
    }
    return srgb255ToLinear8;
  })();
  // BT.601: R'G'B' --> Y'CbCr
  const colorMatrixBT601 = [
    [  0.2990,  0.5870,  0.1140 ],
    [ -0.1687, -0.3313,  0.5000 ],
    [  0.5000, -0.4187, -0.0813 ]
  ];
  // BT.709: R'G'B' --> Y'CbCr
  const colorMatrixBT709 = [
    [  0.2126,  0.7152,  0.0722 ],
    [ -0.1146, -0.3854,  0.5000 ],
    [  0.5000, -0.4542, -0.0458 ]
  ]
  // RGB (sRGB) --> Linear RGB
  const convertColorListRgbToLinear = function(rgbColorList) {
    const colors = rgbColorList;
    const linearColors = new Uint32Array(colors.length);
    for (let k = 0; k < colors.length; k++) {
      const rgb = colors[k];
      const r = rgb >> 16;
      const g = (rgb >> 8) & 255;
      const b = rgb & 255;
      const linr = srgb255ToLinear8[r];
      const ling = srgb255ToLinear8[g];
      const linb = srgb255ToLinear8[b];
      linearColors[k] = (linr << 16) + (ling << 8) + linb;
    }
    return linearColors;
  };
  // RGB (sRGB) --> xyY
  const convertColorListRgbToXyy = function(rgbColorList) {
    const colors = rgbColorList;
    const xyyColors = new Uint32Array(colors.length);
    for (let k = 0; k < colors.length; k++) {
      const rgb = colors[k];
      const r = rgb >> 16;
      const g = (rgb >> 8) & 255;
      const b = rgb & 255;
      const linr = srgb255ToLinear255[r];
      const ling = srgb255ToLinear255[g];
      const linb = srgb255ToLinear255[b];
      const capX = 0.4124564 * linr + 0.3575761 * ling + 0.1804375 * linb;
      const capY = 0.2126729 * linr + 0.7151522 * ling + 0.0721750 * linb;
      const capZ = 0.0193339 * linr + 0.1191920 * ling + 0.9503041 * linb;
      const xyz = capX + capY + capZ;
      const x8 = Math.round((xyz === 0 ? 0.3127 : capX / xyz) * 255 * 1.5);
      const y8 = Math.round((xyz === 0 ? 0.3290 : capY / xyz) * 255 * 1.5);
      const capY8 = Math.round(capY);
      xyyColors[k] = (x8 << 16) + (y8 << 8) + capY8;
    }
    return xyyColors;
  };
  // RGB --> HSV Cylinder
  const convertRgbToHsvCylinder = function(r,g,b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const h = (
      min === max ? 0 :
      max === r ? 60 * (g - b) / (max - min) :
      max === g ? 60 * (2 + (b - r) / (max - min)) :
      60 * (4 + (r - g) / (max - min))
    );
    const s = max === 0 ? 0 : (max - min) / max;
    const v = max;
    const radH = h * (Math.PI / 180);
    const x = Math.round(127.5 * (1 + Math.cos(radH) * s));
    const y = Math.round(127.5 * (1 + Math.sin(radH) * s));
    const z = Math.round(v);
    return (x << 16) + (y << 8) + z;
  };
  // RGB --> HSV Cylinder
  const convertColorListRgbToHsv = function(rgbColorList) {
    const colors = rgbColorList;
    const hsvColors = new Uint32Array(colors.length);
    for (let k = 0; k < colors.length; k++) {
      const rgb = colors[k];
      const r = rgb >> 16;
      const g = (rgb >> 8) & 255;
      const b = rgb & 255;
      hsvColors[k] = convertRgbToHsvCylinder(r, g, b);
    }
    return hsvColors;
  };
  // RGB --> HSV Cylinder (Linear)
  const convertColorListRgbToHsvLinear = function(rgbColorList) {
    const colors = rgbColorList;
    const hsvColors = new Uint32Array(colors.length);
    for (let k = 0; k < colors.length; k++) {
      const rgb = colors[k];
      const r = rgb >> 16;
      const g = (rgb >> 8) & 255;
      const b = rgb & 255;
      const linr = srgb255ToLinear255[r];
      const ling = srgb255ToLinear255[g];
      const linb = srgb255ToLinear255[b];
      hsvColors[k] = convertRgbToHsvCylinder(linr, ling, linb);
    }
    return hsvColors;
  };
  // RGB --> HSL Cylinder
  const convertRgbToHslCylinder = function(r,g,b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const h = (
      min === max ? 0 :
      max === r ? 60 * (g - b) / (max - min) :
      max === g ? 60 * (2 + (b - r) / (max - min)) :
      60 * (4 + (r - g) / (max - min))
    );
    const l = (max + min) / 2;
    const s = (l === 0 || l === 255) ? 0 : (max - min) / (255 - Math.abs(2 * l - 255));
    const radH = h * (Math.PI / 180);
    const x = Math.round(127.5 * (1 + Math.cos(radH) * s));
    const y = Math.round(127.5 * (1 + Math.sin(radH) * s));
    const z = Math.round(l);
    return (x << 16) + (y << 8) + z;
  };
  // RGB --> HSL Cylinder
  const convertColorListRgbToHsl = function(rgbColorList) {
    const colors = rgbColorList;
    const hslColors = new Uint32Array(colors.length);
    for (let k = 0; k < colors.length; k++) {
      const rgb = colors[k];
      const r = rgb >> 16;
      const g = (rgb >> 8) & 255;
      const b = rgb & 255;
      hslColors[k] = convertRgbToHslCylinder(r, g, b);
    }
    return hslColors;
  };
  // RGB --> HSL Cylinder (Linear)
  const convertColorListRgbToHslLinear = function(rgbColorList) {
    const colors = rgbColorList;
    const hslColors = new Uint32Array(colors.length);
    for (let k = 0; k < colors.length; k++) {
      const rgb = colors[k];
      const r = rgb >> 16;
      const g = (rgb >> 8) & 255;
      const b = rgb & 255;
      const linr = srgb255ToLinear255[r];
      const ling = srgb255ToLinear255[g];
      const linb = srgb255ToLinear255[b];
      hslColors[k] = convertRgbToHslCylinder(linr, ling, linb);
    }
    return hslColors;
  };

  //
  // Make a binary view of a DataURI string
  //
  // Applying atob() to a Base64 string from a very large image file
  // such as > 10MBytes takes unnecessary long execution time.
  // This binary view object provides O(1) random access of dataURI.
  //
  const binaryFromDataURI = function(dataURI) {
    const offset = dataURI.indexOf(',') + 1;
    const isBase64 = 0 <= dataURI.slice(0, offset - 1).indexOf(';base64');
    let binary = null;
    let len;

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

    const read = function(addr) {
      if (addr >= len) {
        return null;
      }
      if (isBase64) {
        const mod = addr % 3;
        const pos = (addr - mod) / 3 * 4;
        const bytes = atob(dataURI.slice(offset + pos, offset + pos + 4));
        const ret = bytes.charCodeAt(mod);
        return ret;
      } else {
        return binary.charCodeAt(addr);
      }
    };
    const readBig16 = function(addr) {
      return read(addr) * 256 + read(addr + 1);
    };
    const readLittle16 = function(addr) {
      return read(addr) + read(addr + 1) * 256;
    };
    const readBig32 = function(addr) {
      return readBig16(addr) * 65536 + readBig16(addr + 2);
    };
    const readLittle32 = function(addr) {
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

  const findPNGChunk = function(binary, callback) {
    for (let p = 8; p + 8 <= binary.length; ) {
      const len = binary.big32(p);
      const chunk = binary.big32(p + 4);
      const res = callback(p, chunk);
      if (res !== undefined) { return res; }
      p += len + 12;
    }
    return null;
  };

  const detectPNGChunk = function(binary, target, before) {
    return findPNGChunk(binary, function(p, chunk) {
      if (chunk === target) { return p; }
      if (chunk === before) { return null; }
    });
  };

  const findJPEGSegment = function(binary, callback) {
    for (let p = 0; p + 4 <= binary.length; ) {
      const m = binary.big16(p);
      if (m === 0xffda /* SOS */) { break; }
      const res = callback(p, m);
      if (res !== undefined) { return res; }
      p += 2 + (m === 0xffd8 /* SOI */ ? 0 : binary.big16(p + 2));
    }
    return null;
  };
  const findAPPnSegment = function(binary, n, name, callback) {
    return findJPEGSegment(binary, function(p, marker) {
      if (marker === 0xffe0 + n && p + 4 + name.length <= binary.length) {
        let i = 0;
        for (; i < name.length; ++i) {
          if (binary.at(p + 4 + i) !== name[i]) { break; }
        }
        if (i === name.length) { return callback ? callback(p) : p; }
      }
    });
  };
  const detectSOFnSegment = function(binary) {
    return findJPEGSegment(binary, function(p, marker) {
      if (0 <= [0, 1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15].indexOf(marker - 0xffc0) &&
          p + 10 <= binary.length) {
        const nf = binary.at(p + 9);
        if (nf === 3 && p + 10 + 9 <= binary.length) {
          const c1 = binary.at(p + 11);
          const c2 = binary.at(p + 14);
          const c3 = binary.at(p + 17);
          let sampling = c1 * 65536 + c2 * 256 + c3;
          const horizontalGCD = calcGCD(c1 >> 4, calcGCD(c2 >> 4, c3 >> 4));
          const verticalGCD = calcGCD(c1 % 16, calcGCD(c2 % 16, c3 % 16));
          const coprime = 1 >= horizontalGCD && 1 >= verticalGCD;
          const samplingPattern = [
            (c1 >> 4) + 'x' + (c1 % 16),
            (c2 >> 4) + 'x' + (c2 % 16),
            (c3 >> 4) + 'x' + (c3 % 16)
          ];
          if (!coprime) {
            sampling = (sampling & 0xf0f0f0) / horizontalGCD + (sampling & 0x0f0f0f) / verticalGCD;
          }
          return { nf, sampling, samplingPattern, coprime };
        } else {
          return { nf };
        }
      }
    });
  };
  const detectJFIFIdentifier = function(binary) {
    const name = [0x4a, 0x46, 0x49, 0x46, 0x00]; // JFIF\0
    return findAPPnSegment(binary, 0 /* APP0 */, name);
  };
  const detectExifOrientation = function(binary) {
    const name = [0x45, 0x78, 0x69, 0x66, 0x00]; // Exif\0
    return findAPPnSegment(binary, 1 /* APP1 */, name, function(p) {
      if (p + 20 > binary.length) { return null; }
      const big = binary.big16(p + 10) === 0x4d4d; /* MM */
      const read16 = big ? binary.big16 : binary.little16;
      const fields = read16(p + 18);
      if (p + 20 + fields * 12 > binary.length) { return null; }
      for (let i = 0, f = p + 20; i < fields; i++, f += 12) {
        if (read16(f) === 0x0112 /* ORIENTATION */) {
          return read16(f + 8);
        }
      }
      return null;
    });
  };
  const detectMPFIdentifier = function(binary) {
    const name = [0x4d, 0x50, 0x46, 0x00]; // MPF\0
    return findAPPnSegment(binary, 2 /* APP2 */, name);
  };
  const detectAdobeIdentifier = function(binary) {
    const name = [0x41, 0x64, 0x6f, 0x62, 0x65]; // Adobe
    return findAPPnSegment(binary, 14 /* APP14 */, name, function(p) {
      if (p + 16 <= binary.length) {
        return {
          tr: binary.at(p + 15)
        };
      }
    });
  };

  const findWebPChunk = function(binary, target) {
    const offsets = [];
    for (let p = 12; p + 8 <= binary.length; ) {
      const chunk = binary.big32(p);
      const len = binary.little32(p + 4);
      if (chunk === target) {
        offsets.push(p);
      }
      p += 8 + len + (len % 2);
    }
    return offsets;
  };

  const calcMinMaxMean = function(list) {
    if (list.length == 0) {
      return null;
    }
    let min = list[0], max = min, sum = min;
    for (let i = 1; i < list.length; i++) {
      const x = list[i];
      sum += x;
      if (min > x) { min = x; }
      if (max < x) { max = x; }
    }
    const mean = sum / list.length;
    return { min, max, mean };
  };
  const findMeanByCadenceDetection = function(list, tolerance) {
    const maxPeriod = Math.min(60, list.length >> 1);
    let sum = 0;
    for (let i = 1; i <= maxPeriod; i++) {
      sum += list[i - 1];
      if (list[i] === list[0]) {
        let period = i;
        for (let j = i + 1; j < list.length; j++) {
          if (list[j] === list[j % period]) {
            continue;
          }
          // allow exception only at the final frame
          const error = Math.abs(list[j] - list[j % period]);
          if (j === list.length - 1 && error <= tolerance) {
            continue;
          }
          period = 0;
          break;
        }
        if (0 < period) {
          return sum / period;
        }
      }
    }
    return null;
  };
  const findNearlyConstantValue = function(list, tolerance) {
    if (list.length <= 1) {
      return null;
    }
    const m = calcMinMaxMean(list);
    if (m.min < m.mean - tolerance || m.mean + tolerance < m.max) {
      return null;
    }
    if (m.min === m.max) {
      return m.mean;
    }
    const m2 = findMeanByCadenceDetection(list, tolerance);
    if (m2 !== null) {
      return m2;
    }
    return m.mean;
  };
  const findApproxUniformFPS = function(delayList) {
    const uniformDelay = findNearlyConstantValue(delayList, 0.010 + 1e-7);
    if (uniformDelay !== null && 0 < uniformDelay) {
       return Math.round(10 / uniformDelay) / 10;
    }
    return null;
  };

  const formatReader = (function() {
    const formatInfo = function(desc, color, anim) {
      return {
        toString: function() { return desc; },
        color: color,
        anim: anim
      };
    };
    const detectPNG = function(binary) {
      let desc = 'PNG';
      let color = null;
      let anim = undefined;
      const actl = detectPNGChunk(
                binary, 0x6163544c /* acTL */, 0x49444154 /* IDAT */);
      if (actl && actl + 16 <= binary.length) {
        const frameCount = binary.big32(actl + 8);
        if (1 <= frameCount) {
          let durationNum = 0, durationDen = 1, commonDelay;
          const delayList = [];
          findPNGChunk(binary, function(p, chunk) {
            if (chunk === 0x6663544c /* fcTL */ && p + 34 <= binary.length) {
              let num = binary.big16(p + 28);
              let den = binary.big16(p + 30);
              if (den === 0) { den = 100; }
              const gcd = calcGCD(num, den);
              num /= gcd;
              den /= gcd;
              if (commonDelay === undefined) { commonDelay = [num, den]; }
              if (commonDelay && (commonDelay[0] !== num || commonDelay[1] !== den)) { commonDelay = null; }
              delayList.push(num / den);
              durationNum = durationNum * den + num * durationDen;
              durationDen = durationDen * den;
              const gcd2 = calcGCD(durationNum, durationDen);
              durationNum /= gcd2;
              durationDen /= gcd2;
            }
          });
          desc += ' (APNG)';
          anim = {
            frameCount: frameCount,
            durationNum: durationNum,
            durationDen: durationDen,
            fpsNum: commonDelay ? commonDelay[1] : null,
            fpsDen: commonDelay ? commonDelay[0] : null,
            approxFPS: findApproxUniformFPS(delayList)
          };
        }
      }
      const hasTRNS = detectPNGChunk(
                binary, 0x74524e53 /* tRNS */, 0x49444154 /* IDAT */);
      const depth = binary.at(24);
      const colorMode = binary.at(25);
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
      return formatInfo(desc, color, anim);
    };
    const detectGIF = function(binary, magic, magic2) {
      let desc = 'GIF';
      let color = null;
      let anim = undefined;
      if (13 <= binary.length) {
        //console.log('GIF sig', '0x' + (0x380000 + (magic2 >>> 16)).toString(16));
        //const size = [binary.little16(6), binary.little16(8)];
        const bitfield = binary.at(10);
        const gctFlag = bitfield >> 7;
        const gctLength = bitfield & 0x07;
        //console.log('size', size.join('x'));
        //console.log('gct', gctFlag, gctLength);
        let transparent, transparentIndex;
        let block = 13 + (gctFlag ? 3 * Math.pow(2, gctLength + 1) : 0);
        let frames = 0, commonDelay, delayList = [], duration = 0, animated = false;
        while (block + 3 <= binary.length) {
          const initial = binary.at(block);
          if (initial === 0x21) {
            const label = binary.at(block + 1);
            //console.log('ext', '0x' + label.toString(16));
            if (label === 0xf9 /* Graphic Control Extension */ &&
                block + 8 <= binary.length) {
              transparent = binary.at(block + 3) & 0x01;
              const delay = binary.little16(block + 4);
              if (commonDelay === undefined) { commonDelay = delay; }
              if (commonDelay !== delay) { commonDelay = null; }
              delayList.push(delay * 0.01);
              duration += delay; /* x10 msec */
              transparentIndex = binary.at(block + 6);
              //console.log('transparent', transparent, transparentIndex);
            } else if (label === 0xff /* Application Extension */ &&
                block + 14 <= binary.length) {
              const app0 = binary.big32(block + 3);
              const app1 = binary.big32(block + 7);
              //console.log(app0.toString(16), app1.toString(16));
              if (app0 === 0x4e455453 && app1 === 0x43415045 /* NETS CAPE */) {
                desc += ' (Animated)';
                animated = true;
              }
            }
            block += 2;
            for (let off = 0; block + off < binary.length; ) {
              const size = binary.at(block + off);
              if (size === 0 /* Block Terminator */) {
                block += off + 1;
                break;
              }
              off += 1 + size;
            }
            continue;
          } else if (initial === 0x2c /* Image Separator */ &&
                block + 10 <= binary.length) {
            // const rect = [
            //   binary.little16(block + 1),
            //   binary.little16(block + 3),
            //   binary.little16(block + 5),
            //   binary.little16(block + 7)
            // ];
            const localFlags = binary.at(block + 9);
            const lctFlag = localFlags >> 7;
            const lctLength = localFlags & 0x07;
            //console.log('rect', rect.join(' '));
            //console.log('lct', lctFlag, lctLength);
            if (frames === 0) {
              const bpp = lctFlag ? (lctLength + 1) : (gctLength + 1);
              color = 'Indexed RGB 8.8.8 (' + bpp + 'bpp)';
              if (transparent && transparentIndex < Math.pow(2, bpp)) {
                color += ' + Transparent';
              }
            }
            block += 10 + (lctFlag ? 3 * Math.pow(2, lctLength + 1) : 0);
            for (let off = 1; block + off < binary.length; ) {
              const size = binary.at(block + off);
              if (size === 0 /* Block Terminator */) {
                block += off + 1;
                break;
              }
              off += 1 + size;
            }
            frames += 1;
          } else {
            break;
          }
        }
        if (animated) {
          anim = {
            frameCount: frames,
            durationNum: duration,
            durationDen: 100,
            fpsNum: commonDelay ? 100 : null,
            fpsDen: commonDelay ? commonDelay : null,
            approxFPS: findApproxUniformFPS(delayList)
          };
        }
      }
      color = color || 'unknown';
      return formatInfo(desc, color, anim);
    };
    const detectBMP = function(binary, magic, magic2) {
      // BMP
      let color = null;
      if (26 <= binary.length) {
        const offBits = binary.little32(10);
        const biSize = binary.little32(14);
        const os2 = 12 === biSize || binary.length < 54;
        const bitCount = os2 ? binary.little16(24) : binary.little16(28);
        const compression = os2 ? 0 : binary.little32(30);
        let mask = [];
        const calcMaskBits = function(mask) {
          let nlz = 0, ntz = 0, bit = 1;
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
        const makeRGBAMaskDesc = function(mask) {
          const labels = ['R', 'G', 'B', 'A'];
          let desc = '', bits = [];
          for (let i = 0; i < mask.length; i++) {
            if (0 < mask[i]) {
              desc += labels[i];
              bits.push(mask[i]);
            }
          }
          return 0 < bits.length ? desc + ' ' + bits.join('.') : '';
        };
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
              case 3: color = makeRGBAMaskDesc(mask); break;
              case 4: color = makeRGBAMaskDesc(mask); break;
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
              case 3: color = makeRGBAMaskDesc(mask); break;
              case 4: color = makeRGBAMaskDesc(mask); break;
              default: color = 'RGB'; break;
            }
            color += ' (32bpp)';
            break;
          default:
            color = 'unknown';
            break;
        }
      }
      color = color || 'unknown';
      return formatInfo('BMP', color);
    };
    const detectJPEG = function(binary, magic, magic2) {
      // JPEG
      let desc = 'JPEG';
      let color = null;
      if (detectMPFIdentifier(binary)) {
        desc += ' (MPF)';
      }
      const hasJFIF = detectJFIFIdentifier(binary);
      const hasAdobe = detectAdobeIdentifier(binary);
      const sof = detectSOFnSegment(binary);
      const nf = sof ? sof.nf : null;
      if (!hasJFIF && hasAdobe) {
        color = (hasAdobe.tr === 1 && nf === 3) ? 'YCbCr 8.8.8' : null;
      }
      if (!color) {
        color = nf === 1 ? 'Grayscale 8' : nf === 3 ? 'YCbCr 8.8.8' : 'unknown';
      }
      const samplingPattern = function(components) {
        const s = [];
        for (let i = 0; i < components.length; ++i) {
          s.push(components[i] + '=' + sof.samplingPattern[i]);
        }
        return s.join(' ');
      };
      const sampling = function(s) {
        if (!sof.coprime) {
          return s + '-variant ' + samplingPattern(['Y', 'Cb', 'Cr']);
        } else {
          return s;
        }
      };
      if (sof) {
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
            } else if (nf === 3 && sof.samplingPattern !== undefined) {
              color += ' (uncommon sampling ' + samplingPattern(['Y', 'Cb', 'Cr']) + ')';
            }
            break;
        }
      }
      //console.log(hasJFIF);
      //console.log(hasAdobe);
      //console.log(sof);
      return formatInfo(desc, color);
    };
    const detectTIFF = function(binary, magic, magic2) {
      //console.log('TIFF');
      let color = null;
      const read16 = magic === 0x4d4d002a ? binary.big16 : binary.little16;
      const read32 = magic === 0x4d4d002a ? binary.big32 : binary.little32;
      const readIFDValue = function(type, count, offset) {
        if (type < 1 || 5 < type) {
          return [];
        }
        const bytes = [1, 1, 2, 4, 8][type - 1] * count;
        if (4 < bytes) {
          offset = read32(offset);
          if (offset + bytes > binary.length) {
            return [];
          }
        }
        let value = [];
        for (let i = 0; i < count; ++i) {
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
          let string = '';
          for (let i = 0; i < count - 1; ++i) {
            string += String.fromCharCode(value[i]);
          }
          value = [ string ];
        }
        return value;
      };
      if (8 <= binary.length) {
        const ifd = read32(4);
        const ifdCount = ifd + 2 <= binary.length ? read16(ifd) : 0;
        if (ifd + 2 + ifdCount * 12 <= binary.length) {
          let photometricInterpretation = null;
          let bitsPerSample = [1];
          let samplesPerPixel = 1;
          let colorMap = [];
          let extraSamples = [];
          for (let i = 0; i < ifdCount; ++i) {
            const offset = ifd + 2 + i * 12;
            const tag = read16(offset);
            const type = read16(offset + 2);
            const count = read32(offset + 4);
            const value = readIFDValue(type, count, offset + 8);
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
          const alphaIndex = extraSamples.indexOf(1 /* Associated alpha data */);
          let maskIndex = extraSamples.indexOf(2 /* Unassociated alpha data */);
          const makeAlphaNotation = function(baseName, baseIndices, withAlphaName) {
            //console.log('extraSamples', extraSamples);
            const numBaseSamples = baseIndices.length;
            const baseBits = baseIndices.map(function(i) { return bitsPerSample[i]; });
            const totalBaseBits = baseBits.reduce(function(a, b) { return a + b; }, 0);
            if (0 <= alphaIndex && numBaseSamples + alphaIndex < bitsPerSample.length) {
              const alphaBits = bitsPerSample[numBaseSamples + alphaIndex];
              const name = withAlphaName + ' (pre-multiplied) ' + baseBits.join('.') + '.' + alphaBits;
              return name + ' (' + (totalBaseBits + alphaBits) +  'bpp)';
            } else if (0 <= maskIndex && numBaseSamples + maskIndex < bitsPerSample.length) {
              const maskBits = bitsPerSample[numBaseSamples + maskIndex];
              const name = withAlphaName + ' ' + baseBits.join('.') + '.' + maskBits;
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
                if (samplesPerPixel === 4 &&
                    bitsPerSample[0] === bitsPerSample[3] &&
                    extraSamples.length === 0) {
                  // No ExtraSamples is illegal but may happen
                  // https://github.com/tshino/compare/issues/85
                  maskIndex = 0;
                }
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
      color = color || 'unknown';
      return formatInfo('TIFF', color);
    };
    const readVP8ColorFormat = function(binary, offset, hasAlpha) {
      offset += 3;
      // check start code '9D 01 2A'
      if (binary.length < offset + 3 ||
          binary.at(offset) !== 0x9D ||
          binary.at(offset + 1) !== 0x01 ||
          binary.at(offset + 2) !== 0x2A) {
        return 'unknown';
      }
      offset += 7;
      // check color space type bit
      if (binary.length < offset + 1 ||
          (binary.at(offset) & 0x80) !== 0) {
        return 'unknown';
      }
      if (hasAlpha) {
        return 'YCbCr 8.8.8 (12bpp 4:2:0) + Alpha 8';
      } else {
        return 'YCbCr 8.8.8 (12bpp 4:2:0)';
      }
    };
    const readWebPLosslessColorFormat = function(binary, offset, hasAlpha) {
      // check signature
      if (binary.length < offset + 5 || binary.at(offset) !== 0x2F) {
        return 'unknown';
      }
      const flags = binary.at(offset + 4) & 0xf0;
      const version = flags & 0xe0;
      if (version !== 0) {
        return 'unknown';
      }
      hasAlpha = hasAlpha || (flags & 0x10) !== 0;
      if (hasAlpha) {
        return 'RGBA 8.8.8.8 (32bpp)';
      } else {
        return 'RGB 8.8.8 (24bpp)';
      }
    };
    const detectWebP = function(binary) {
      const magic4 = binary.length < 16 ? 0 : binary.big32(12);
      let desc = 'WebP';
      let color = undefined;
      let anim = undefined;
      if (magic4 === 0x56503820 /* 'VP8 ' */) {
        desc += ' (Lossy)';
        color = readVP8ColorFormat(binary, 20, false);
      } else if (magic4 === 0x5650384C /* 'VP8L' */) {
        desc += ' (Lossless)';
        color = readWebPLosslessColorFormat(binary, 20, false);
      } else if (magic4 === 0x56503858 /* 'VP8X' */) {
        const flags = binary.length < 24 ? 0 : binary.big32(20);
        const animated = (flags & 0x02000000) !== 0;
        let hasAlpha = (flags & 0x10000000) !== 0;
        if (animated) {
          const anmf = findWebPChunk(binary, 0x414E4D46 /* 'ANMF' */);
          let lossy = 0, lossless = 0, unknown = 0;
          let duration = 0, commonDelay;
          const delayList = [];
          const colorList = [];
          for (let i = 0, p; p = anmf[i]; i++) {
            const delay = binary.length < p + 24 ? 0 : (binary.little32(p + 20) & 0xffffff);
            if (commonDelay === undefined) { commonDelay = delay; }
            if (commonDelay !== delay) { commonDelay = null; }
            delayList.push(delay * 0.001);
            duration += delay;
            p += 24;
            let f = binary.length < p + 8 ? 0 : binary.big32(p);
            let hasALPH = false;
            if (f === 0x414C5048 /* 'ALPH' */) {
              hasALPH = true;
              p += 8 + ((binary.little32(p + 4) + 1) & 0xfffffffe);
              f = binary.length < p + 8 ? 0 : binary.big32(p);
            }
            if (f === 0x56503820 /* 'VP8 ' */) {
              color = readVP8ColorFormat(binary, p + 8, hasAlpha || hasALPH);
              if (0 > colorList.indexOf(color)) {
                colorList.push(color);
              }
              lossy += 1;
            } else if (f === 0x5650384C /* 'VP8L' */) {
              color = readWebPLosslessColorFormat(binary, p + 8, hasAlpha);
              if (0 > colorList.indexOf(color)) {
                colorList.push(color);
              }
              lossless += 1;
            } else {
              unknown += 1;
            }
          }
          if (0 < colorList.length) {
            color = colorList.sort().join(', ');
          }
          if (0 < lossy && 0 === lossless && unknown === 0) {
            desc += ' (Animated Lossy)';
          } else if (0 === lossy && 0 < lossless && unknown === 0) {
            desc += ' (Animated Lossless)';
          } else if (0 < lossy && 0 < lossless && unknown === 0) {
            desc += ' (Animated Lossy+Lossless)';
          } else {
            desc += ' (Animated)';
          }
          anim = {
            frameCount: lossy + lossless,
            durationNum: duration,
            durationDen: 1000,
            fpsNum: commonDelay ? 1000 : null,
            fpsDen: commonDelay ? commonDelay : null,
            approxFPS: findApproxUniformFPS(delayList)
          };
        } else {
          const alpha = findWebPChunk(binary, 0x414C5048 /* 'ALPH' */);
          const vp8 = findWebPChunk(binary, 0x56503820 /* 'VP8 ' */);
          const vp8l = findWebPChunk(binary, 0x5650384C /* 'VP8L' */);
          if (0 < vp8.length) {
            desc += ' (Lossy)';
            hasAlpha = hasAlpha || (0 < alpha.length && alpha[0] < vp8[0]);
            color = readVP8ColorFormat(binary, vp8[0] + 8, hasAlpha);
          } else if (0 < vp8l.length) {
            desc += ' (Lossless)';
            color = readWebPLosslessColorFormat(binary, vp8l[0] + 8, hasAlpha);
          }
        }
      }
      color = color || 'unknown';
      return formatInfo(desc, color, anim);
    };
    const detectAVIF = function(binary, magic) {
      if (magic < 16) {
        return null;
      }
      const major = binary.big32(8), minor = binary.big32(12);
      let desc = null;
      if (major === 0x61766966 /* 'avif' */) {
        desc = 'AVIF';
      } else if (major == 0x6d696631 /* 'mif1'*/) {
        for (let i = 0, n = magic - 16; i + 4 <= n; i += 4) {
          const compatible = binary.big32(16 + i);
          if (compatible === 0x61766966 /* 'avif' */) {
            desc = 'AVIF';
            break;
          }
        }
      }
      if (desc) {
        return formatInfo(desc);
      }
      return null;
    };
    const detectSVG = function(binary, magic, magic2) {
      if ((magic === 0xefbbbf3c /* BOM + '<' */ &&
            magic2 === 0x3f786d6c /* '?xml' */) ||
        (magic === 0x3c3f786d /* '<?xm' */ &&
            (magic2 & 0xff000000) === 0x6c000000 /* 'l' */)) {
        // XML
        let i = 4;
        for (let x; x = binary.at(i); ++i) {
          if (x === 0x3c /* '<' */) {
            const y = binary.at(i + 1);
            if (y !== 0x3f /* '?' */ && y !== 0x21 /* '!' */) { break; }
          }
        }
        const sig1 = binary.length < i + 4 ? 0 : binary.big32(i);
        if (sig1 === 0x3c737667 /* <svg */) {
          return formatInfo('SVG');
        }
      }
      return null;
    };
    return {
      detectPNG,
      detectGIF,
      detectBMP,
      detectJPEG,
      detectTIFF,
      detectWebP,
      detectAVIF,
      detectSVG
    };
  })();
  const detectImageFormat = function(binary) {
    const magic = binary.length < 4 ? 0 : binary.big32(0);
    const magic2 = binary.length < 8 ? 0 : binary.big32(4);
    const magic3 = binary.length < 12 ? 0 : binary.big32(8);
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
    if (magic === 0x52494646 /* RIFF */ && magic3 === 0x57454250) { // WebP
      return formatReader.detectWebP(binary);
    }
    if (magic2 === 0x66747970 /* ftyp */) { // AVIF
      return formatReader.detectAVIF(binary, magic);
    }
    const svg = formatReader.detectSVG(binary, magic, magic2);
    if (svg !== null) {
      return svg;
    }
    //alert(magic);
    return null;
  };
  const orientationUtil = (function() {
    const stringTable = [
      undefined,
      'TopLeft', 'TopRight', 'BottomRight', 'BottomLeft',
      'LeftTop', 'RightTop', 'RightBottom', 'LeftBottom'
    ];
    const cssTable = {
      2: { transposed: false, transform: ' scale(-1,1)' },
      3: { transposed: false, transform: ' rotate(180deg)' },
      4: { transposed: false, transform: ' scale(-1,1) rotate(180deg)' },
      5: { transposed: true,  transform: ' scale(-1,1) rotate(90deg)' },
      6: { transposed: true,  transform: ' rotate(90deg)' },
      7: { transposed: true,  transform: ' scale(-1,1) rotate(-90deg)' },
      8: { transposed: true,  transform: ' rotate(-90deg)' }
    };
    const toString = function(orientation) {
      return orientation !== null ? (stringTable[orientation] || 'Invalid') : '‐';
    };
    const isTransposed = function(orientation) {
      const o = cssTable[orientation] || { transposed: false, transform: '' };
      return o.transposed;
    };
    const getCSSTransform = function(orientation) {
      const o = cssTable[orientation] || { transposed: false, transform: '' };
      return o.transform;
    };
    const interpretXY = function(orientation, canvasWidth, canvasHeight, x, y) {
      const w = canvasWidth - 1, h = canvasHeight - 1;
      return interpretXY2(orientation, w, h, x, y);
    };
    const interpretXY2 = function(orientation, w, h, x, y) {
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
      toString,
      isTransposed,
      getCSSTransform,
      interpretXY,
      interpretXY2
    };
  })();
  const aspectRatioUtil = (function() {
    const calcAspectRatio = function(w, h) {
      const gcd = calcGCD(w, h);
      w /= gcd;
      h /= gcd;
      return { w: w, h: h, ratio: w / h };
    };
    const findApproxAspectRatio = function(exact) {
      if (exact.w > 50 && exact.h > 50) {
        for (let i = 1; i <= 10; ++i) {
          const a = exact.w / exact.h * i, b = exact.h / exact.w * i;
          const aa = Math.round(a), bb = Math.round(b);
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
    const toString = function(ratio) {
      return addComma(ratio.w) + ':' + addComma(ratio.h);
    };
    const makeInfo = function(w, h) {
      const exact = calcAspectRatio(w, h);
      const approx = findApproxAspectRatio(exact);
      const desc = toString(exact);
      if (approx) {
        return [exact.ratio, desc, toString(approx)];
      } else {
        return [exact.ratio, desc];
      }
    };
    return {
      calcAspectRatio,
      findApproxAspectRatio,
      toString,
      makeInfo
    };
  })();
  const makeDurationInfo = function(formatInfo) {
    if (formatInfo && formatInfo.anim) {
      let num = formatInfo.anim.durationNum;
      let den = formatInfo.anim.durationDen;
      const value = num / den;
      const desc = (num / den).toFixed(3);
      if (0 !== num * 1000 % den) {
        const gcd = calcGCD(num, den);
        num /= gcd;
        den /= gcd;
        if (formatInfo.anim.fpsNum !== null &&
            formatInfo.anim.fpsDen === 1 &&
            formatInfo.anim.fpsNum % den === 0) {
          num *= formatInfo.anim.fpsNum / den;
          den = formatInfo.anim.fpsNum;
        }
        return [value, num + '/' + den, desc];
      }
      return [value, desc];
    }
    return [null, '‐'];
  };
  const makeFPSInfo = function(formatInfo, nonUniform) {
    if (formatInfo && formatInfo.anim) {
      let num = formatInfo.anim.fpsNum;
      let den = formatInfo.anim.fpsDen;
      if (num !== null && den !== null) {
        const value = num / den;
        let desc;
        if (0 === num % den) {
          desc = String(num / den);
        } else {
          desc = (num / den).toFixed(2);
        }
        if (0 !== num * 100 % den) {
          const gcd = calcGCD(num, den);
          num /= gcd;
          den /= gcd;
          return [value, num + '/' + den, desc];
        }
        return [value, desc];
      }
      if (formatInfo.anim.approxFPS !== null) {
        return [null, nonUniform, formatInfo.anim.approxFPS.toFixed(1)];
      } else {
        return [null, nonUniform];
      }
    }
    return [null, '‐'];
  };
  const cursorKeyCodeToXY = function(keyCode, step) {
    step = step !== undefined ? step : 1;
    const x = keyCode === 37 ? -step : keyCode === 39 ? step : 0;
    const y = keyCode === 38 ? -step : keyCode === 40 ? step : 0;
    return { x: x, y: y };
  };
  const calcInscribedRect = function(outerW, outerH, innerW, innerH) {
    const rect = {};
    const isLetterBox = outerW * innerH < outerH * innerW;
    rect.width = isLetterBox ? outerW : outerH * innerW / innerH;
    rect.height = isLetterBox ? outerW * innerH / innerW : outerH;
    return rect;
  };
  const processKeyDownEvent = function(e, callback) {
    if (e.ctrlKey || e.altKey || e.metaKey) {
      return true;
    }
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
  const processWheelEvent = function(e, callback) {
    const event = e.originalEvent;
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
      return true;
    }
    const deltaScale = event.deltaMode === 0 ? /* PIXEL */ 0.1 : /* LINE */ 1.0;
    const steps = clamp(event.deltaY * deltaScale, -3, 3);
    if (steps !== 0) {
      if (callback.zoom) {
        callback.zoom(steps);
      }
      return false;
    }
  };
  const makeTouchEventFilter = function() {
    let touchState = null;
    let tapPoint = null;
    const resetState = function() {
      touchState = null;
      tapPoint = null;
    };
    const updateState = function(e, callback) {
      const event = e.originalEvent;
      if (event.touches.length === 1 || event.touches.length === 2) {
        const touches = Array.prototype.slice.call(event.touches);
        touches.sort(function(a, b) {
          return (
              a.identifier < b.identifier ? -1 :
              a.identifier > b.identifier ? 1 : 0
          );
        });
        if (!touchState || touchState.length !== touches.length) {
          touchState = [];
        }
        for (let i = 0; i < touches.length; ++i) {
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
        for (let i = 0; i < touches.length; ++i) {
          touchState[i].x = touches[i].clientX;
          touchState[i].y = touches[i].clientY;
          touchState[i].pageX = touches[i].pageX;
          touchState[i].pageY = touches[i].pageY;
        }
        return false;
      }
    };
    const onTouchStart = function(e) {
      return updateState(e, function(lastTouches, touches) {
        if (touches.length === 1) {
          tapPoint = touches[0];
        }
      });
    };
    const onTouchMove = function(e, callback) {
      return updateState(e, function(lastTouches, touches) {
        if (tapPoint) {
          if (touches.length !== 1 ||
              3 <= Math.abs(touches[0].clientX - tapPoint.clientX) ||
              3 <= Math.abs(touches[0].clientY - tapPoint.clientY)) {
            tapPoint = null;
          }
        }
        let dx = 0, dy = 0;
        for (let i = 0; i < touches.length; ++i) {
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
          const x0 = lastTouches[0].x - lastTouches[1].x;
          const y0 = lastTouches[0].y - lastTouches[1].y;
          const x1 = touches[0].clientX - touches[1].clientX;
          const y1 = touches[0].clientY - touches[1].clientY;
          const s0 = Math.sqrt(x0 * x0 + y0 * y0);
          const s1 = Math.sqrt(x1 * x1 + y1 * y1);
          if (0 < s0 * s1) {
            let r = Math.log(s1 / s0) / Math.LN2;
            r = clamp(r, -2, 2);
            const center = {
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
    const onTouchEnd = function(e, callback) {
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
      resetState,
      onTouchStart,
      onTouchMove,
      onTouchEnd
    };
  };

  const makeZoomController = function(update, options) {
    options = options !== undefined ? options : {};
    const MAX_ZOOM_LEVEL    = 6.0;
    const ZOOM_STEP_KEY     = 0.25;
    const ZOOM_STEP_WHEEL   = 0.0625;
    const ZOOM_STEP_DBLCLK  = 2.00;
    const cursorMoveDelta = options.cursorMoveDelta || 0.3;
    let getBaseSize = options.getBaseSize || function(index) {};
    let zoomXOnly = false;
    const o = {
      zoom: 0,
      scale: 1,
      offset: { x: 0.5, y: 0.5 }
    };
    let enabled = true;
    let zoomOrigin = null;
    let pointCallback = null;
    let clickPoint = null;
    let dragStartPoint = null;
    let dragLastPoint = null;
    let dragStateCallback = null;
    const touchFilter = makeTouchEventFilter();
    o.enable = function(options) {
      options = options !== undefined ? options : {};
      enabled = true;
      zoomXOnly = options.zoomXOnly !== undefined ? options.zoomXOnly : zoomXOnly;
      getBaseSize = options.getBaseSize || getBaseSize;
      resetDragState();
    };
    o.disable = function() { enabled = false; };
    const setZoom = function(z) {
      o.zoom = z;
      o.scale = Math.round(Math.pow(2.0, z) * 100) / 100;
    };
    const zoomRelative = function(delta) {
      if (enabled) {
        setZoom(clamp(o.zoom + delta, 0, MAX_ZOOM_LEVEL));
        update();
        return true;
      }
    };
    const zoomIn = function() {
      if (zoomOrigin) {
        return zoomRelativeToPoint(0, 0, +ZOOM_STEP_KEY, zoomOrigin);
      } else {
        return zoomRelative(+ZOOM_STEP_KEY);
      }
    };
    const zoomOut = function() {
      if (zoomOrigin) {
        return zoomRelativeToPoint(0, 0, -ZOOM_STEP_KEY, zoomOrigin);
      } else {
        return zoomRelative(-ZOOM_STEP_KEY);
      }
    };
    const setOffset = function(x, y) {
      x = clamp(x, 0, 1);
      y = zoomXOnly ? 0.5 : clamp(y, 0, 1);
      if (o.offset.x !== x || o.offset.y !== y) {
        o.offset.x = x;
        o.offset.y = y;
        return true;
      }
    };
    const getCenter = function() {
      return {
        x: (o.offset.x - 0.5) * (1 - 1 / o.scale),
        y: (o.offset.y - 0.5) * (1 - 1 / o.scale)
      };
    };
    const moveRelativeWithoutUpdate = function(dx, dy) {
      if (1 < o.scale && enabled) {
        return setOffset(
                        o.offset.x + dx / (o.scale - 1),
                        o.offset.y + dy / (o.scale - 1));
      }
    };
    const moveRelative = function(dx, dy) {
      const result = moveRelativeWithoutUpdate(dx, dy);
      if (result) {
        update();
        return result;
      }
    };
    const moveRelativePx = function(index, dx, dy) {
      const base = getBaseSize(index);
      if (base) {
        moveRelative(-dx / base.w, -dy / base.h);
      }
    };
    const zoomRelativeToPoint = function(dx, dy, delta, pos) {
      if (enabled && pos) {
        if (dx !== 0 || dy !== 0) {
          moveRelativeWithoutUpdate(dx, dy);
        }
        const c1 = getCenter();
        const s1 = o.scale;
        setZoom(clamp(o.zoom + delta, 0, MAX_ZOOM_LEVEL)); // o.scale changes here
        if (1 < o.scale) {
          const x = clamp(pos.x, 0, 1);
          const y = clamp(pos.y, 0, 1);
          const s2 = o.scale;
          const px = x - 0.5;
          const py = y - 0.5;
          const c2x = s2 * px - s1 * (px - c1.x);
          const c2y = s2 * py - s1 * (py - c1.y);
          const o2x = c2x / (o.scale - 1) + 0.5;
          const o2y = c2y / (o.scale - 1) + 0.5;
          setOffset(o2x, o2y);
        }
        update();
        return true;
      }
    };
    const zoomTo = function(x, y) {
      if (!enabled) {
      } else if (o.zoom + ZOOM_STEP_DBLCLK < MAX_ZOOM_LEVEL) {
        setOffset(x, y);
        zoomRelative(+ZOOM_STEP_DBLCLK);
      } else {
        setZoom(0);
        update();
      }
    };
    const processKeyDown = function(e) {
      return processKeyDownEvent(e, {
        zoomIn: function() { if (zoomIn()) return false; },
        zoomOut: function() { if (zoomOut()) return false; },
        cursor: function() {
          const d = cursorKeyCodeToXY(e.keyCode, cursorMoveDelta);
          if (moveRelative(d.x, d.y)) {
            return false;
          }
        }
      });
    };
    const setZoomOrigin = function(pos) {
      zoomOrigin = pos;
    };
    const resetZoomOrigin = function() {
      zoomOrigin = null;
    };
    const setPointCallback = function(callback) {
      pointCallback = callback;
    };
    const setDragStateCallback = function(callback) {
      dragStateCallback = callback;
    };
    const resetDragState = function() {
      clickPoint = null;
      dragStartPoint = null;
      dragLastPoint = null;
      if (dragStateCallback) {
        dragStateCallback(false, zoomXOnly);
      }
    };
    const positionFromMouseEvent = function(e, target, index) {
      const base = getBaseSize(index);
      return base ? {
        index: index,
        x: (e.pageX - $(target).offset().left) / (o.scale * base.w),
        y: (e.pageY - $(target).offset().top) / (o.scale * base.h),
        baseW: base.w,
        baseH: base.h
      } : null;
    };
    const processPointMouseDown = function(e, selector, target) {
      const index = selector ? $(selector).index($(target).parent()) : null;
      if (e.which === 1) {
        clickPoint = positionFromMouseEvent(e, target, index);
      }
    };
    const processMouseDown = function(e, selector, target) {
      const index = selector ? $(selector).index(target) : null;
      if (getBaseSize(index) && e.which === 1) {
        // var last = dragLastPoint;
        dragStartPoint = dragLastPoint = { x: e.clientX, y: e.clientY };
        return false;
      }
    };
    const processMouseMove = function(e, selector, target) {
      if (dragLastPoint) {
        if (e.buttons !== 1) {
          resetDragState();
        } else {
          const index = selector ? $(selector).index(target) : null;
          if (clickPoint) {
            const ax = Math.abs(e.clientX - dragStartPoint.x);
            const ay = Math.abs(e.clientY - dragStartPoint.y);
            if (3 <= Math.max(ax, ay)) {
              clickPoint = null;
            }
          }
          if (dragLastPoint.x === dragStartPoint.x && dragLastPoint.y === dragStartPoint.y) {
            dragStateCallback(true, zoomXOnly);
          }
          const dx = e.clientX - dragLastPoint.x;
          const dy = e.clientY - dragLastPoint.y;
          dragLastPoint = { x: e.clientX, y: e.clientY };
          moveRelativePx(index, dx, dy);
          return false;
        }
      }
    };
    const processMouseUp = function(e, selector, target) {
      if (clickPoint && pointCallback) {
        pointCallback(clickPoint);
      }
      resetDragState();
    };
    const processDblclick = function(e, selector, target) {
      const index = selector ? $(selector).index($(target).parent()) : null;
      const pos = positionFromMouseEvent(e, target, index);
      if (pos) {
        zoomTo(pos.x, pos.y);
        return false;
      }
      return true;
    };
    const processWheel = function(e, selector, relSelector, target) {
      return processWheelEvent(e, {
        zoom: function(steps) {
          if (zoomOrigin) {
            zoomRelativeToPoint(0, 0, -steps * ZOOM_STEP_WHEEL, zoomOrigin);
          } else if (selector && relSelector) {
            const index = $(selector).index(target);
            target = $(target).find(relSelector);
            if (target.length !== 0) {
              const pos = positionFromMouseEvent(e, target, index);
              zoomRelativeToPoint(0, 0, -steps * ZOOM_STEP_WHEEL, pos);
            }
          } else {
            zoomRelative(-steps * ZOOM_STEP_WHEEL);
          }
        }
      });
    };
    const resetTouchState = function() { touchFilter.resetState(); };
    const processTouchStart = function(e) {
      return touchFilter.onTouchStart(e);
    };
    const processTouchMove = function(e, selector, relSelector, target) {
      const index = selector ? $(selector).index(target) : null;
      const ret = touchFilter.onTouchMove(e, {
        move: function(dx, dy) {
          moveRelativePx(index, dx, dy);
        },
        zoom: function(dx, dy, r, center) {
          if (center && selector && relSelector) {
            target = $(target).find(relSelector);
            const base = getBaseSize(index);
            dx = -dx / base.w;
            dy = -dy / base.h;
            const pos = positionFromMouseEvent(center, target, index);
            zoomRelativeToPoint(dx, dy, r, pos);
          } else {
            zoomRelative(r);
          }
        }
      });
    };
    const processTouchEnd = function(e, selector, relSelector, target) {
      return touchFilter.onTouchEnd(e, {
        pointClick: function(lastTouch) {
          if (pointCallback && relSelector) {
            const index = selector ? $(selector).index(target) : null;
            target = $(target).find(relSelector);
            const pos = positionFromMouseEvent(lastTouch, target, index);
            pointCallback(pos);
          }
        }
      });
    };
    const enableMouseAndTouch = function(root, filter, deepFilter, selector, relSelector) {
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
    const makeTransform = function(index) {
      const base = getBaseSize(index);
      const center = getCenter();
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
    o.setZoomOrigin = setZoomOrigin;
    o.resetZoomOrigin = resetZoomOrigin;
    o.setPointCallback = setPointCallback;
    o.setDragStateCallback = setDragStateCallback;
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
  const makeRotationController = function(onrotate, onzoom, initialOrientation) {
    initialOrientation = initialOrientation || { x: 30, y: -30 };
    const orientation = {
      x: initialOrientation.x,
      y: initialOrientation.y
    };
    let zoomLevel = 0.12;
    const resetZoom = function() {
      zoomLevel = 0.12;
    };
    const getScale = function() {
      return Math.round(Math.pow(2, zoomLevel) * 100) / 100;
    };
    const rotate = function(dx, dy, scale) {
      orientation.x += dy * scale;
      orientation.y += dx * scale;
      orientation.x = clamp(orientation.x, -90, 90);
      orientation.y -= Math.floor(orientation.y / 360) * 360;
      onrotate();
    };
    const zoom = function(delta) {
      const MAX_ZOOM_LEVEL = 6;
      zoomLevel = clamp(zoomLevel + delta, 0, MAX_ZOOM_LEVEL);
      onzoom();
    };
    return {
      orientation,
      getScale,
      resetZoom,
      rotate,
      zoom
    };
  };
  const makeRotationInputFilter = function(controller) {
    const processKeyDown = function(e) {
      return processKeyDownEvent(e, {
        zoomIn: function() { controller.zoom(0.25); return false; },
        zoomOut: function() { controller.zoom(-0.25); return false; },
        cursor: function() {
          const step = e.shiftKey ? 10 : 1;
          const d = cursorKeyCodeToXY(e.keyCode);
          controller.rotate(d.x, d.y, step);
          return false;
        }
      });
    };
    let dragState = null;
    let dragStateCallback = null;
    const setDragStateCallback = function(callback) {
      dragStateCallback = callback;
    };
    const processMouseDown = function(e) {
      if (e.which === 1) {
        dragState = { x: e.clientX, y: e.clientY };
        if (dragStateCallback) {
          dragStateCallback(true, false);
        }
        return false;
      }
    };
    const processMouseMove = function(e) {
      if (dragState) {
        if (e.buttons !== 1) {
          dragState = null;
          if (dragStateCallback) {
            dragStateCallback(false, false);
          }
        } else {
          const dx = e.clientX - dragState.x;
          const dy = e.clientY - dragState.y;
          dragState = { x: e.clientX, y: e.clientY };
          controller.rotate(dx, dy, 0.5);
          return false;
        }
      }
    };
    const processMouseUp = function(e) {
      if (dragState) {
        dragState = null;
        if (dragStateCallback) {
          dragStateCallback(false, false);
        }
      }
    };
    const processWheel = function(e) {
      return processWheelEvent(e, {
        zoom: function(steps) {
          const ZOOM_STEP_WHEEL = 0.0625;
          controller.zoom(-steps * ZOOM_STEP_WHEEL);
        }
      });
    };
    const touchFilter = makeTouchEventFilter();
    const processTouchMove = function(e) {
      return touchFilter.onTouchMove(e, {
        move: function(dx, dy) { controller.rotate(dx, dy, 0.3); },
        zoom: function(dx, dy, delta) { controller.zoom(delta); }
      });
    };
    const processTouchEnd = function(e) {
      touchFilter.resetState();
    };
    const enableMouseAndTouch = function(root, filter, deepFilter) {
      $(root).on('mousedown', deepFilter, processMouseDown);
      $(root).on('mousemove', filter, processMouseMove);
      $(root).on('mouseup', filter, processMouseUp);
      $(root).on('wheel', filter, processWheel);
      $(root).on('touchmove', filter, processTouchMove);
      $(root).on('touchend', filter, processTouchEnd);
    };
    return {
      processKeyDown,
      enableMouseAndTouch,
      setDragStateCallback
    };
  };
  const vertexUtil = (function() {
    const makeCube = function(sx, sy, sz) {
      const v = [];
      const cx = sx / 2, cy = sy / 2, cz = sz / 2;
      for (let i = 0; i < 18; ++i) {
        const posX = (Math.floor(i / 6) % 3) * cx - cx;
        const posY = (Math.floor(i / 2) % 3) * cy - cy;
        const posZ = (i % 2) * sz - cz;
        v[i] = [posX, posY, posZ];
      }
      return v;
    };
    const cubeFaces = [
      [0, 1, 5, 4, 0], [12, 16, 17, 13, 12],
      [0, 12, 13, 1, 0], [4, 5, 17, 16, 4],
      [0, 4, 16, 12, 0], [1, 13, 17, 5, 1]
    ];
    const make3DCylinder = function(r, sz) {
      const v = [], cz = sz / 2;
      for (let i = 0; i < 36; ++i) {
        const a = i / 18 * Math.PI;
        const posX = r * Math.cos(a);
        const posY = r * Math.sin(a);
        v[i * 2] = [posX, posY, -cz];
        v[i * 2 + 1] = [posX, posY, cz];
      }
      return v.concat([[0, 0, -cz], [0, 0, cz]]);
    };
    const cylinderTopAndBottomFaces = (function() {
      const faces = [[], []];
      for (let i = 0; i <= 36; ++i) {
        faces[0][i] = ((36 - i) % 36) * 2;
        faces[1][i] = (i % 36) * 2 + 1;
      }
      return faces;
    })();
    const getRightMostVertexOfCylinder = function(rotation) {
      const yaw10 = Math.round(rotation.yaw / 10);
      const index = 36 * Math.ceil(yaw10 / 36) - yaw10;
      return index;
    };
    const makeCylinderSideFaces = function(rotation) {
      const index = getRightMostVertexOfCylinder(rotation);
      const faces = [[], []];
      for (let i = 0; i <= 18; ++i) {
        faces[0][i] = ((i + 18 + index) % 36) * 2;
        faces[1][i] = ((36 - i + index) % 36) * 2 + 1;
      }
      return faces;
    };
    const makeCylinderFaces = function(rotation) {
      const side = makeCylinderSideFaces(rotation);
      return cylinderTopAndBottomFaces.concat(side);
    };
    const cylinderDarkLines = [
      [72, 0, 1, 73, 25, 24, 72, 48, 49, 73, 72]
    ];
    const makeCylinderContour = function(rotation) {
      const index = getRightMostVertexOfCylinder(rotation);
      return [
        [index * 2, index * 2 + 1],
        [(index + 18) % 36 * 2, (index + 18) % 36 * 2 + 1]
      ];
    };
    return {
      makeCube,
      cubeFaces,
      make3DCylinder,
      makeCylinderFaces,
      cylinderDarkLines,
      makeCylinderContour
    };
  })();
  const rotationUtil = (function() {
    const isFrontFace = function(v2d, face) {
      const a = v2d[face[0]];
      const b = v2d[face[1]];
      const c = v2d[face[2]];
      const abx = b[0] - a[0], aby = b[1] - a[1];
      const acx = c[0] - a[0], acy = c[1] - a[1];
      return abx * acy < aby * acx;
    };
    const splitIntoFrontAndBackFaces = function(vertices2D, faces) {
      const frontFaces = [], backFaces = [];
      faces.forEach(function(face) {
        if (isFrontFace(vertices2D, face)) {
          frontFaces.push(face);
        } else {
          backFaces.push(face);
        }
      });
      return {frontFaces, backFaces};
    };
    return {
      isFrontFace,
      splitIntoFrontAndBackFaces
    };
  })();
  const makeRotationCoefs = function(orientation, scale_r, scale_g, scale_b) {
    const pitch = Math.round(orientation.x);
    const yaw = Math.round(orientation.y);
    const ax = pitch * (Math.PI / 180);
    const ay = yaw * (Math.PI / 180);
    const cos_ax = Math.cos(ax), cos_ay = Math.cos(ay);
    const sin_ax = Math.sin(ax), sin_ay = Math.sin(ay);
    const scale = 0.707;
    const sr = scale * (scale_r || 1);
    const sg = scale * (scale_g || 1);
    const sb = scale * (scale_b || 1);
    const xr = sr * cos_ay, yr = -sr * sin_ay * sin_ax;
    const xg = -sg * sin_ay, yg = -sg * cos_ay * sin_ax;
    const yb = -sb * cos_ax;
    const pos3DTo2D = function(x, y, z) {
      return [ 160 + xr * x + xg * y, 160 + yr * x + yg * y + yb * z ];
    };
    const vec3DTo2D = function(x, y, z) {
      return [ xr * x + xg * y, yr * x + yg * y + yb * z ];
    };
    const vertices3DTo2D = function(v) {
      return v.map(function(pos) {
        return pos3DTo2D(pos[0], pos[1], pos[2]);
      });
    };
    return {
      pitch, yaw,
      xr, yr, xg, yg, yb,
      pos3DTo2D,
      vec3DTo2D,
      vertices3DTo2D
    };
  };
  const TaskQueue = function(processResult) {
    let runningCount = 0;
    let queue = [];
    const pop = function() {
      if (runningCount === 0 && 0 < queue.length) {
        const task = queue.shift();
        if (task.prepare && false === task.prepare(task.data)) {
          return null;
        }
        ++runningCount;
        return task.data;
      }
      return null;
    };
    const push = function(data, prepare) {
      const task = { data, prepare };
      queue.push(task);
    };
    const cancelIf = function(pred) {
      queue = queue.filter(function(task,i,a) { return !pred(task); });
    };
    const processResponse = function(data) {
      processResult(data);
      --runningCount;
    };
    return {
      pop,
      push,
      cancelIf,
      processResponse
    }
  };
  const makeTaskQueue = function(workerPath, processResult) {
    const worker = newWorker(workerPath);
    const taskQueue = TaskQueue(processResult);
    const kickNextTask = function() {
      const data = taskQueue.pop();
      if (data) {
        worker.postMessage(data);
      }
    };
    const addTask = function(data, prepare) {
      taskQueue.push(data, prepare);
      window.setTimeout(kickNextTask, 0);
    };
    const discardTasksOf = taskQueue.cancelIf;
    worker.addEventListener('message', function(e) {
      taskQueue.processResponse(e.data);
      window.setTimeout(kickNextTask, 0);
    }, false);
    return {
      addTask,
      discardTasksOf
    };
  };
  const figureUtil = (function() {
    const makeBlankFigure = function(w, h) {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const context = canvas.getContext('2d');
      return { canvas, context };
    };
    const canvasFromImage = function(image, w, h) {
      const fig = makeBlankFigure(w, h);
      fig.context.drawImage(image, 0, 0, w, h);
      return fig.canvas;
    };
    const copyImageBits = function(src, dest) {
      for (let i = 0, n = src.width * src.height * 4; i < n; ++i) {
        dest.data[i] = src.data[i];
      }
    };
    const makeLinearGradient = function(ctx, x0,y0,x1,y1,stops) {
      const grad = ctx.createLinearGradient(x0,y0,x1,y1);
      for (let i = 0; i < stops.length; i++) {
        grad.addColorStop(stops[i][0], stops[i][1]);
      }
      return grad;
    };
    const drawHistogram = function(context, color, hist, max, offset, n, x, y, h) {
      context.fillStyle = color;
      for (let i = 0; i < n; ++i) {
        const v = h * Math.pow(hist[i + offset] / max, 0.5);
        context.fillRect((x + i) * 3, y - v, 3, v);
      }
    };
    const drawAxes = function(ctx, x, y, dx, dy, lineLen, lineWidth, color, labels) {
      const dLen = Math.sqrt(dx * dx + dy * dy);
      const lineDx = -dy / dLen * lineLen, lineDy = dx / dLen * lineLen;
      ctx.font = '24px sans-serif';
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      for (let i = 0, label; label = labels[i]; ++i) {
        const pos = { x: label.pos * dx, y: label.pos * dy };
        const x1 = x + pos.x;
        const y1 = y + pos.y;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + lineDx, y1 + lineDy);
        ctx.stroke();
        ctx.textAlign = label.align;
        ctx.fillText(label.label,
          x + pos.x + lineDx,
          y + pos.y + lineDy + 20);
      }
    };
    return {
      makeBlankFigure,
      canvasFromImage,
      copyImageBits,
      makeLinearGradient,
      drawHistogram,
      drawAxes
    };
  })();
  return {
    browserNameOf,
    browserName,
    storageAvailable,
    drawImageAwareOfOrientation,
    createObjectURL,
    revokeObjectURL,
    newWorker,
    toggleFullscreen,
    clamp,
    calcGCD,
    addComma,
    hyphenToMinus,
    toSignedFixed,
    toPercent,
    toHexTriplet,
    srgb255ToLinear255,
    srgb255ToLinear8,
    colorMatrixBT601,
    colorMatrixBT709,
    convertColorListRgbToLinear,
    convertColorListRgbToXyy,
    convertColorListRgbToHsv,
    convertColorListRgbToHsvLinear,
    convertColorListRgbToHsl,
    convertColorListRgbToHslLinear,
    binaryFromDataURI,
    detectPNGChunk,
    detectMPFIdentifier,
    detectExifOrientation,
    calcMinMaxMean,
    findNearlyConstantValue,
    detectImageFormat,
    orientationUtil,
    aspectRatioUtil,
    makeDurationInfo,
    makeFPSInfo,
    cursorKeyCodeToXY,
    calcInscribedRect,
    processKeyDownEvent,
    processWheelEvent,
    makeTouchEventFilter,
    makeZoomController,
    makeRotationController,
    makeRotationInputFilter,
    vertexUtil,
    rotationUtil,
    makeRotationCoefs,
    TaskQueue,
    makeTaskQueue,
    figureUtil
  };
};

if (typeof module !== 'undefined') {
    module.exports = CompareUtil;
}
