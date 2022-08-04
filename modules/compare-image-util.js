'use strict';
const compareImageUtil = (function() {

  const FORMAT_U8x4  = 0x0104;
  const FORMAT_F32x1 = 0x0401;

  const channelsOf = function(format) {
    return format ? (format & 0x00ff) : 0x0004;
  };
  const newArrayOf = function(format, size) {
    const elementType = format ? (format & 0xff00) : 0x0100;
    if (elementType === 0x0400) {
      return new Float32Array(size);
    } else { // 0x0100
      return new Uint8Array(size);
    }
  };

  const makeImage = function(a, b, format) {
    if (b === undefined) {
      const ch = a.channels !== undefined ? a.channels : 4;
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
      const ch = channelsOf(format);
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
  const makeRegion = function(image, left, top, width, height) {
    image = makeImage(image);
    left   = left   !== undefined ? left   : 0;
    top    = top    !== undefined ? top    : 0;
    let right  = width  !== undefined ? left + width : image.width;
    let bottom = height !== undefined ? top + height : image.height;
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
  const fill = function(image, r, g, b, a) {
    image = makeImage(image);
    const w = image.width, h = image.height;
    const ch = image.channels;
    let i = image.offset * ch;
    const v = [r, g, b, a];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let k = 0; k < ch; k++, i++) {
          image.data[i] = v[k];
        }
      }
      i += (image.pitch - w) * ch;
    }
  };
  const copy = function(dest, src) {
    dest = makeImage(dest);
    src = makeImage(src);
    if (dest.channels !== src.channels) {
      return;
    }
    const w = Math.min(dest.width, src.width), h = Math.min(dest.height, src.height);
    const ch = src.channels;
    let i = dest.offset * ch, j = src.offset * ch;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w * ch; x++, i++, j++) {
        dest.data[i] = src.data[j];
      }
      i += (dest.pitch - w) * ch;
      j += (src.pitch - w) * ch;
    }
  };
  const rotateCW = function(dest, src) {
    applyOrientationImpl(dest, src, 6);
  };
  const rotateCCW = function(dest, src) {
    applyOrientationImpl(dest, src, 8);
  };
  const flipH = function(dest, src) {
    applyOrientationImpl(dest, src, 2);
  };
  const flipV = function(dest, src) {
    applyOrientationImpl(dest, src, 4);
  };
  const applyOrientation = function(src, orientation) {
    return applyOrientationImpl(null, src, orientation);
  };
  const applyOrientationImpl = function(dest, src, orientation) {
    src = makeImage(src);
    const transposed = [5,6,7,8].indexOf(orientation) >= 0;
    let w = src.width, h = src.height, format = src.format, ch = src.channels;
    if (dest) {
      dest = makeImage(dest);
      if (ch !== dest.channels) {
        return;
      }
      w = Math.min(w, transposed ? dest.height : dest.width);
      h = Math.min(h, transposed ? dest.width : dest.height);
    } else {
      dest = transposed ? makeImage(h, w, format) : makeImage(w, h, format);
    }
    orientation = [2,3,4,5,6,7,8].indexOf(orientation) >= 0 ? orientation : 1;
    const idx = ch * [1, -1, -1, 1, dest.pitch, dest.pitch, -dest.pitch, -dest.pitch][orientation - 1];
    const idy = ch * [dest.pitch, dest.pitch, -dest.pitch, -dest.pitch, 1, -1, -1, 1][orientation - 1];
    let i = ch * dest.offset + (idx < 0 ? idx * (1 - w) : 0) + (idy < 0 ? idy * (1 - h) : 0);
    let j = ch * src.offset;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++, i += idx, j += ch) {
        for (let k = 0; k < ch; k++) {
          dest.data[i + k] = src.data[j + k];
        }
      }
      i += idy - w * idx;
      j += (src.pitch - w) * ch;
    }
    return dest;
  };
  const readSubPixel = function(src, left, top, width, height) {
    src = makeImage(src);
    const region = makeImage(width, height, FORMAT_F32x1);
    const iLeft = Math.floor(left);
    const iTop = Math.floor(top);
    const sampleX = [], sampleY = [];
    for (let i = 0; i < width; ++i) {
      sampleX[i * 2] = Math.max(0, Math.min(src.width - 1, iLeft + i));
      sampleX[i * 2 + 1] = Math.max(0, Math.min(src.width - 1, iLeft + i + 1));
    }
    for (let i = 0; i < height; ++i) {
      sampleY[i * 2] = Math.max(0, Math.min(src.height - 1, iTop + i));
      sampleY[i * 2 + 1] = Math.max(0, Math.min(src.height - 1, iTop + i + 1));
    }
    const rx = left - iLeft;
    const ry = top - iTop;
    const a00 = (1 - rx) * (1 - ry);
    const a01 = rx * (1 - ry);
    const a10 = (1 - rx) * ry;
    const a11 = rx * ry;
    const ch = src.channels;
    let i = 0;
    for (let b = 0; b < height; ++b) {
      const y0 = sampleY[b * 2], y1 = sampleY[b * 2 + 1];
      const k0 = (src.offset + src.pitch * y0) * ch;
      const k1 = (src.offset + src.pitch * y1) * ch;
      for (let a = 0; a < width; ++a) {
        const x0 = sampleX[a * 2], x1 = sampleX[a * 2 + 1];
        const c00 = a00 * src.data[k0 + x0 * ch];
        const c01 = a01 * src.data[k0 + x1 * ch];
        const c10 = a10 * src.data[k1 + x0 * ch];
        const c11 = a11 * src.data[k1 + x1 * ch];
        region.data[i++] = c00 + c01 + c10 + c11;
      }
    }
    return region;
  };
  const convertToGrayscale = function(dest, src) {
    dest = makeImage(dest);
    src = makeImage(src);
    const w = Math.min(dest.width, src.width), h = Math.min(dest.height, src.height);
    let i = dest.offset * dest.channels, j = src.offset * src.channels;
    const read = src.channels === 4 ? function(k) {
      const r = src.data[k    ];
      const g = src.data[k + 1];
      const b = src.data[k + 2];
      const a = src.data[k + 3];
      return [a, 0.299 * r + 0.587 * g + 0.114 * b];
    } : function(k) {
      return [255, src.data[k]];
    };
    const write = dest.channels === 4 ? function(k, val) {
      const v = Math.round(val[1]);
      dest.data[k    ] = v;
      dest.data[k + 1] = v;
      dest.data[k + 2] = v;
      dest.data[k + 3] = val[0];
    } : function(k, val) {
      dest.data[k] = val[1] * val[0] * (1/255);
    };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++, i += dest.channels, j += src.channels) {
        write(i, read(j));
      }
      i += (dest.pitch - w) * dest.channels;
      j += (src.pitch - w) * src.channels;
    }
  };
  const resizeNN = function(dest, src) {
    dest = makeImage(dest);
    src = makeImage(src);
    if (src.channels !== dest.channels) {
      return;
    }
    const w = dest.width, h = dest.height;
    const mw = src.width / w, mh = src.height / h;
    let i = dest.offset * dest.channels;
    const ddata = dest.data, sdata = src.data;
    const floor = Math.floor;
    const so = new Uint32Array(w);
    for (let x = 0; x < w; x++) {
      so[x] = src.channels * floor((x + 0.5) * mw);
    }
    for (let y = 0; y < h; y++) {
      const sy = floor((y + 0.5) * mh);
      const j0 = (src.offset + src.pitch * sy) * src.channels;
      if (src.channels === 4) {
        for (let x = 0; x < w; x++, i += 4) {
          const j = j0 + so[x];
          const r = sdata[j    ];
          const g = sdata[j + 1];
          const b = sdata[j + 2];
          const a = sdata[j + 3];
          ddata[i    ] = r;
          ddata[i + 1] = g;
          ddata[i + 2] = b;
          ddata[i + 3] = a;
        }
      } else {
        for (let x = 0; x < w; x++, i += 1) {
          ddata[i] = sdata[j0 + so[x]];
        }
      }
      i += (dest.pitch - w) * dest.channels;
    }
  };
  const resizeBilinear = function(dest, src) {
    dest = makeImage(dest);
    src = makeImage(src);
    const w = dest.width, h = dest.height;
    const sw = src.width, sh = src.height;
    const mw = sw / w, mh = sh / h;
    const ddata = dest.data, sdata = src.data;
    const round = Math.round;
    const floor = Math.floor;
    const sxo = new Uint32Array(w * 2);
    const fx = new Float32Array(w * 2);
    for (let x = 0; x < w; x++) {
      const rx = (x + 0.5) * mw - 0.5;
      let sx0 = floor(rx);
      let sx1 = sx0 + 1;
      let fx1 = rx - sx0;
      if (sx0 < 0) { sx0 = sx1 = 0; fx1 = 0; }
      if (sx1 >= sw) { sx0 = sx1 = sw - 1; fx1 = 0; }
      const fx0 = 1 - fx1;
      sxo[x * 2    ] = sx0 * 4;
      sxo[x * 2 + 1] = sx1 * 4;
      fx[x * 2    ] = fx0;
      fx[x * 2 + 1] = fx1;
    }
    const syo = new Uint32Array(h * 2);
    const fy = new Float32Array(h * 2);
    for (let y = 0; y < h; y++) {
      const ry = (y + 0.5) * mh - 0.5;
      let sy0 = floor(ry);
      let sy1 = sy0 + 1;
      let fy1 = ry - sy0;
      if (sy0 < 0) { sy0 = sy1 = 0; fy1 = 0; }
      if (sy1 >= sh) { sy0 = sy1 = sh - 1; fy1 = 0; }
      const fy0 = 1 - fy1;
      syo[y * 2    ] = w * sy0 * 4;
      syo[y * 2 + 1] = w * sy1 * 4;
      fy[y * 2    ] = fy0;
      fy[y * 2 + 1] = fy1;
    }
    const kdata = new Float32Array(w * sh * 4);
    let k = 0;
    let j = src.offset * 4;
    for (const jh = j + src.pitch * 4 * sh; j < jh; ) {
      let f = 0;
      for (const fw = w * 2; f < fw; k += 4) {
        const j0  = j + sxo[f];
        const fx0 = fx[f];
        f++;
        const j1  = j + sxo[f];
        const fx1 = fx[f];
        f++;
        const r = sdata[j0    ] * fx0 + sdata[j1    ] * fx1;
        const g = sdata[j0 + 1] * fx0 + sdata[j1 + 1] * fx1;
        const b = sdata[j0 + 2] * fx0 + sdata[j1 + 2] * fx1;
        const a = sdata[j0 + 3] * fx0 + sdata[j1 + 3] * fx1;
        kdata[k    ] = r;
        kdata[k + 1] = g;
        kdata[k + 2] = b;
        kdata[k + 3] = a;
      }
      j += src.pitch * 4;
    }
    let i = dest.offset * 4;
    const igap = (dest.pitch - w) * 4;
    let f = 0;
    for (const fh = h * 2; f < fh; ) {
      let k0 = syo[f];
      const fy0 = fy[f];
      f++;
      let k1 = syo[f];
      const fy1 = fy[f];
      f++;
      for (const iw = i + w * 4; i < iw; i += 4, k0 += 4, k1 += 4) {
        const r = kdata[k0    ] * fy0 + kdata[k1    ] * fy1;
        const g = kdata[k0 + 1] * fy0 + kdata[k1 + 1] * fy1;
        const b = kdata[k0 + 2] * fy0 + kdata[k1 + 2] * fy1;
        const a = kdata[k0 + 3] * fy0 + kdata[k1 + 3] * fy1;
        ddata[i    ] = round(r);
        ddata[i + 1] = round(g);
        ddata[i + 2] = round(b);
        ddata[i + 3] = round(a);
      }
      i += igap;
    }
  };
  const resizeGeneral = function(dest, src, filterSize, filterFunc) {
    dest = makeImage(dest);
    src = makeImage(src);
    if (src.channels !== dest.channels) {
      return;
    }
    const ch = src.channels;
    const w = dest.width, h = dest.height;
    const sw = src.width, sh = src.height;
    const mw = sw / w, mh = sh / h;
    const ddata = dest.data, sdata = src.data;
    const round = Math.round;
    const floor = Math.floor;
    const sxo = new Uint32Array(w * filterSize);
    const fx = new Float32Array(w * filterSize);
    for (let x = 0; x < w; x++) {
      const rx = (x + 0.5) * mw - 0.5;
      let sx = floor(rx) - filterSize / 2 + 1;
      let sum = 0;
      for (let f = 0; f < filterSize; ++f) {
        const val = filterFunc(rx - sx);
        sum += val;
        sxo[x * filterSize + f] = ch * Math.min(sw - 1, Math.max(0, sx));
        fx[x * filterSize + f] = val;
        ++sx;
      }
      for (let f = 0; f < filterSize; ++f) {
        fx[x * filterSize + f] /= sum;
      }
    }
    const syo = new Uint32Array(h * filterSize);
    const fy = new Float32Array(h * filterSize);
    for (let y = 0; y < h; y++) {
      const ry = (y + 0.5) * mh - 0.5;
      let sy = floor(ry) - filterSize / 2 + 1;
      let sum = 0;
      for (let f = 0; f < filterSize; ++f) {
        const val = filterFunc(ry - sy);
        sum += val;
        syo[y * filterSize + f] = ch * w * Math.min(sh - 1, Math.max(0, sy));
        fy[y * filterSize + f] = val;
        ++sy;
      }
      for (let f = 0; f < filterSize; ++f) {
        fy[y * filterSize + f] /= sum;
      }
    }
    const kdata = new Float32Array(w * sh * ch);
    let k = 0;
    let j = src.offset * ch;
    for (const jh = j + src.pitch * ch * sh; j < jh; ) {
      let f = 0;
      if (ch === 4) {
        for (const fw = w * filterSize; f < fw; k += ch) {
          let r = 0, g = 0, b = 0, a = 0;
          for (const fi = f + filterSize; f < fi; f++) {
            const j0  = j + sxo[f];
            const fx0 = fx[f];
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
        for (const fw = w * filterSize; f < fw; k += ch) {
          let v = 0;
          for (const fi = f + filterSize; f < fi; f++) {
            v += sdata[j + sxo[f]] * fx[f];
          }
          kdata[k] = v;
        }
      }
      j += src.pitch * ch;
    }
    let i = dest.offset * ch;
    const igap = (dest.pitch - w) * ch;
    let f = 0;
    for (const fh = h * filterSize; f < fh; ) {
      const k0a = [];
      const fy0a = [];
      for (let fi = 0; fi < filterSize; fi++, f++) {
        k0a[fi] = syo[f];
        fy0a[fi] = fy[f];
      }
      let k = 0;
      if (ch === 4) {
        for (const iw = i + w * ch; i < iw; i += ch, k += ch) {
          let r = 0, g = 0, b = 0, a = 0;
          for (let fi = 0; fi < filterSize; fi++) {
            const k0 = k0a[fi] + k;
            const fy0 = fy0a[fi];
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
        for (const iw = i + w * ch; i < iw; i += ch, k += ch) {
          let v = 0;
          for (let fi = 0; fi < filterSize; fi++) {
            v += kdata[k0a[fi] + k] * fy0a[fi];
          }
          ddata[i] = v;
        }
      }
      i += igap;
    }
  };
  const resizeLanczos2 = function(dest, src) {
    const sinc = function(x) {
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
  const resizeLanczos3 = function(dest, src) {
    const sinc = function(x) {
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
  const resize = function(dest, src, method) {
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
  const gaussianBlur = function(dest, src, stdev) {
    //console.log('blur :' + src.width + 'x' + src.height + ' => ' +
    //            dest.width + 'x' + dest.height + ' (' + stdev + ')');
    const filterSize = Math.round(4 * stdev) * 2;
    if (filterSize === 0) {
      return resizeNN(dest, src);
    }
    const a = 1 / Math.sqrt(2 * Math.PI * stdev * stdev);
    const b = -1 / (2 * stdev * stdev);
    const gaussian = function(x) {
      return a * Math.exp(b * x * x);
    };
    return resizeGeneral(dest, src, filterSize, gaussian);
  };
  const resizeWithGaussianBlur = function(dest, src) {
    const lx = Math.log(dest.width / src.width);
    const ly = Math.log(dest.height / src.height);
    const n = Math.max(1, Math.round(Math.max(-lx, -ly) / Math.log(2)));
    for (let k = 0; k < n; ++k) {
      const sx = Math.exp(lx / n);
      const sy = Math.exp(ly / n);
      const w = Math.round(src.width * sx);
      const h = Math.round(src.height * sy);
      const temp = k + 1 < n ? makeImage(w, h) : dest;
      const stdev = 0.5 / Math.min(sx, sy);
      gaussianBlur(temp, src, stdev);
      src = temp;
    }
  };
  const convolution = function(dest, src, kernelSize, kernel) {
    dest = makeImage(dest);
    src = makeImage(src);
    const w = dest.width, h = dest.height;
    if (src.width !== w || src.height !== h || src.channels !== dest.channels) {
      return;
    }
    const kw = kernelSize.w, kh = kernelSize.h;
    const ox = Math.floor(kw / 2);
    const oy = Math.floor(kh / 2);
    let i = dest.offset * dest.channels;
    const ddata = dest.data, sdata = src.data;
    const round = Math.round;
    const sxo = new Uint32Array(w * kw);
    const syo = new Uint32Array(h * kh);
    for (let x = 0; x < w; x++) {
      for (let k = 0; k < kw; k++) {
        const kx = Math.max(0, Math.min(w - 1, x + ox - k));
        sxo[x * kw + k] = src.channels * kx;
      }
    }
    for (let y = 0; y < h; y++) {
      for (let k = 0; k < kh; k++) {
        const ky = Math.max(0, Math.min(h - 1, y + oy - k));
        syo[y * kh + k] = src.channels * src.pitch * ky;
      }
    }
    const j0 = src.offset * src.channels;
    const readWrite = src.channels === 4 ? function(x, y, write) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let ky = 0, k = 0; ky < kh; ky++) {
        const jy = j0 + syo[y * kh + ky];
        for (let kx = 0; kx < kw; kx++, k++) {
          const j = jy + sxo[x * kw + kx];
          const c = kernel[k];
          r += c * sdata[j    ];
          g += c * sdata[j + 1];
          b += c * sdata[j + 2];
          a += c * sdata[j + 3];
        }
      };
      write(r, g, b, a);
    } : function(x, y, write) {
      let v = 0;
      for (let ky = 0, k = 0; ky < kh; ky++) {
        const jy = j0 + syo[y * kh + ky];
        for (let kx = 0; kx < kw; kx++, k++) {
          const j = jy + sxo[x * kw + kx];
          const c = kernel[k];
          v += c * sdata[j];
        }
      };
      write(v);
    };
    const write = dest.channels === 4 ? function(r, g, b, a) {
      ddata[i    ] = Math.max(0, Math.min(255, round(128 + r)));
      ddata[i + 1] = Math.max(0, Math.min(255, round(128 + g)));
      ddata[i + 2] = Math.max(0, Math.min(255, round(128 + b)));
      ddata[i + 3] = Math.max(0, Math.min(255, round(128 + a)));
    } : function(v) {
      ddata[i] = v;
    };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++, i += dest.channels) {
        readWrite(x, y, write);
      }
      i += (dest.pitch - w) * dest.channels;
    }
  };
  const sobelX = function(dest, src) {
    convolution(dest, src, { w: 3, h: 3 }, [
      1, 0, -1,
      2, 0, -2,
      1, 0, -1
    ]);
  };
  const sobelY = function(dest, src) {
    convolution(dest, src, { w: 3, h: 3 }, [
       1,  2,  1,
       0,  0,  0,
      -1, -2, -1
    ]);
  };
  const scharrX = function(dest, src) {
    convolution(dest, src, { w: 3, h: 3 }, [
       3, 0,  -3,
      10, 0, -10,
       3, 0,  -3
    ]);
  };
  const scharrY = function(dest, src) {
    convolution(dest, src, { w: 3, h: 3 }, [
       3,  10,  3,
       0,   0,  0,
      -3, -10, -3
    ]);
  };
  const dilate3x1 = function(dest, src) {
    dest = makeImage(dest);
    src = makeImage(src);
    if (dest.channels !== src.channels) {
      return;
    }
    const w = Math.min(dest.width, src.width), h = Math.min(dest.height, src.height);
    const ch = dest.channels;
    if (w < 2) {
      copy(dest, src);
      return;
    }
    let i = dest.offset * ch, j = src.offset * ch;
    for (let y = 0; y < h; y++) {
      for (let k = 0; k < ch; k++, i++, j++) {
        dest.data[i] = Math.max(src.data[j], src.data[j + ch]);
      }
      j -= ch;
      for (let k = ch * (w - 2); k > 0; k--, i++, j++) {
        dest.data[i] = Math.max(src.data[j], src.data[j + ch], src.data[j + ch * 2]);
      }
      for (let k = 0; k < ch; k++, i++, j++) {
        dest.data[i] = Math.max(src.data[j], src.data[j + ch]);
      }
      i += (dest.pitch - w) * ch;
      j += (src.pitch - w + 1) * ch;
    }
  };
  const dilate1x3 = function(dest, src) {
    dest = makeImage(dest);
    src = makeImage(src);
    if (dest.channels !== src.channels) {
      return;
    }
    const w = Math.min(dest.width, src.width), h = Math.min(dest.height, src.height);
    const ch = dest.channels;
    if (h < 2) {
      copy(dest, src);
      return;
    }
    let i = dest.offset * ch;
    for (let y = 0; y < h; y++) {
      let j0 = (src.offset + src.pitch * Math.max(0, y - 1)) * ch;
      let j1 = (src.offset + src.pitch * y) * ch;
      let j2 = (src.offset + src.pitch * Math.min(h - 1, y + 1)) * ch;
      for (let k = ch * w; k > 0; k--) {
        dest.data[i++] = Math.max(src.data[j0++], src.data[j1++], src.data[j2++]);
      }
      i += (dest.pitch - w) * ch;
    }
  };
  const dilate3x3 = function(dest, src) {
    src = makeImage(src);
    const temp = makeImage(src.width, src.height, src.format);
    dilate3x1(temp, src);
    dilate1x3(dest, temp);
  };
  const estimateMotionImpl = function(a, b, offsetX, offsetY, blurStdev) {
    offsetX = offsetX === undefined ? 0 : offsetX;
    offsetY = offsetY === undefined ? 0 : offsetY;
    const offsetXi = Math.round(offsetX);
    const offsetYi = Math.round(offsetY);
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
    const w = 256, h = 256;
    const baseA = makeImage(w, h);
    const baseB = makeImage(w, h);
    const blurA = makeImage(w, h);
    const blurB = makeImage(w, h);
    resizeWithGaussianBlur(baseA, a);
    resizeWithGaussianBlur(baseB, b);
    gaussianBlur(blurA, baseA, blurStdev);
    gaussianBlur(blurB, baseB, blurStdev);
    const gradAX = makeImage(w, h);
    const gradBX = makeImage(w, h);
    const gradAY = makeImage(w, h);
    const gradBY = makeImage(w, h);
    sobelX(gradAX, blurA);
    sobelX(gradBX, blurB);
    sobelY(gradAY, blurA);
    sobelY(gradBY, blurB);
    const output = makeImage(w, h);
    const images = [ blurA, blurB, gradAX, gradBX, gradAY, gradBY, output ];
    const d = [];
    const i = [];
    for (let k = 0; k < images.length; k++) {
      d[k] = images[k].data;
      i[k] = images[k].offset * 4;
    }
    const weight = [];
    const deltaX = [];
    const deltaY = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let e = 0; e < 3; e++) {
          const valA = d[0][i[0] + e];
          const valB = d[1][i[1] + e];
          const d2 = d[2][i[2] + e];
          const d3 = d[3][i[3] + e];
          const d4 = d[4][i[4] + e];
          const d5 = d[5][i[5] + e];
          d[6][i[6] + e] = 0;
          //
          const diff = valA - valB;
          if (Math.abs(diff) < 1) {
            d[6][i[6] + e] = 64;
            continue;
          }
          if (d2 === 0 || d2 === 255 || d3 === 0 || d3 === 255 ||
              d4 === 0 || d4 === 255 || d5 === 0 || d5 === 255) {
            continue;
          }
          const dAX = (d2 - 128) / 8;
          const dBX = (d3 - 128) / 8;
          const dAY = (d4 - 128) / 8;
          const dBY = (d5 - 128) / 8;
          const dX = (dAX + dBX) / 2;
          const dY = (dAY + dBY) / 2;
          const sq = Math.sqrt(dX * dX + dY * dY);
          if (sq < 1 ||
              sq * 0.1 < Math.abs(dAX - dBX) ||
              sq * 0.1 < Math.abs(dAY - dBY)) {
            continue;
          }
          const sq2 = diff / (sq * sq);
          weight.push(Math.pow(diff, 4));
          deltaX.push(dX * sq2);
          deltaY.push(dY * sq2);
          //
          d[6][i[6] + e] = 255;
        }
        d[6][i[6] + 3] = 255;
        //
        for (let k = 0; k < images.length; k++) {
          i[k] += 4;
        }
      }
      //
      for (let k = 0; k < images.length; k++) {
        i[k] += (images[k].pitch - w) * 4;
      }
    }
    const weightedAverageDelta = function() {
      const count = deltaX.length;
      let xsum = 0, ysum = 0, wsum = 0;
      for (let k = 0; k < count; ++k) {
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
    const delta = weightedAverageDelta();
    const mx = delta === null ? null : delta.nx * a.width / w + (offsetX - offsetXi);
    const my = delta === null ? null : delta.ny * a.height / h + (offsetY - offsetYi);
    console.log('motion x --> ' + (mx === null ? 'null' : mx.toFixed(3) + 'px'));
    console.log('motion y --> ' + (my === null ? 'null' : my.toFixed(3) + 'px'));
    return { imageOut: output, motionX: mx, motionY: my };
  };
  const estimateMotionIteration = function(a, b, blurStdev) {
    const max_iteration = 8;
    let mx = 0, my = 0, imageOut = null;
    const history = [];
    for (let k = 0; k < max_iteration; ++k) {
      const mxi = Math.round(mx);
      const myi = Math.round(my);
      history.push({ mx: mxi, my: myi });
      const result = estimateMotionImpl(a, b, -mxi, -myi, blurStdev);
      if (result === null) {
        break;
      }
      if (!imageOut) {
        imageOut = result.imageOut;
      }
      if (result.motionX !== null && result.motionY !== null) {
        let nextX = mxi + result.motionX;
        let nextY = myi + result.motionY;
        const duplicate = history.filter(function(h) {
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
  const estimateMotion = function(a, b) {
    const stdev = [ 3, 5, 10, 20 ];
    const results = [];
    let result;
    for (let k = 0; k < stdev.length; ++k) {
      result = estimateMotionIteration(a, b, stdev[k]);
      if (result.motionX === null || result.motionY === null) {
        continue;
      }
      const sameResult = results.filter(function(e) {
        return e.motionX === result.motionX && e.motionY === result.motionY;
      });
      if (0 < sameResult.length) {
        return result;
      }
      results.push(result);
    }
    return result;
  };
  const cornerValue = function(src) {
    const grayscale = makeImage(src);
    const w = src.width;
    const h = src.height;
    const ch = grayscale.channels;
    const dx = makeImage(w, h, grayscale.format);
    const dy = makeImage(w, h, grayscale.format);
    sobelX(dx, grayscale);
    sobelY(dy, grayscale);
    const dBias = grayscale.channels === 4 ? 128 : 0;
    const cov = makeImage(w, h);
    for (let i = 0, k = 0, y = 0; y < h; y++) {
      for (let x = 0; x < w; x++, i += 4) {
        let cov0 = 0, cov1 = 0, cov2 = 0;
        if (ch === 4) {
          for (let j = 0; j < 4; j++, k++) {
            const ix = (dx.data[k] - dBias) * 0.1;
            const iy = (dy.data[k] - dBias) * 0.1;
            cov0 += ix * ix;
            cov1 += ix * iy;
            cov2 += iy * iy;
          }
        } else {
          const ix = (dx.data[k] - dBias) * 0.3;
          const iy = (dy.data[k] - dBias) * 0.3;
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
    const m = makeImage(w, h);
    convolution(m, cov, { w: 3, h: 3 }, [
      0.1111, 0.1111, 0.1111,
      0.1111, 0.1111, 0.1111,
      0.1111, 0.1111, 0.1111
    ]);
    const dest = makeImage(w, h, grayscale.format);
    for (let i = 0, k = 0, y = 0; y < h; y++) {
      for (let x = 0; x < w; x++, i += ch, k += 4) {
        const cov0 = m.data[k] - 128;
        const cov1 = m.data[k + 1] - m.data[k + 2];
        const cov2 = m.data[k + 3] - 128;
        const a = 0.5 * cov0, b = cov1, c = 0.5 * cov2;
        const d = (a + c) - Math.sqrt((a - c) * (a - c) + b * b);
        const val = Math.max(0, Math.min(255, Math.round(d)));
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
  const findCornerPoints = function(image) {
    const w = image.width, h = image.height;
    const corner = cornerValue(image);
    const dilate = makeImage(w, h, corner.format);
    dilate3x3(dilate, corner);
    const candidates = [];
    const ch = corner.channels;
    for (let y = 1; y + 1 < h; y++) {
      let i = (1 + y * w) * ch;
      for (let x = 1; x + 1 < w; x++, i += ch) {
        const c = corner.data[i];
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
    const gw = (w + 7) >> 3, margin = gw + 1;
    const grid = [];
    const result = [];
    const tooNear = function(p1, p2) {
      return Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y)) < 8;
    };
    const near8 = [-gw - 1, -gw, -gw + 1, -1, 1, gw - 1, gw, gw + 1];
    for (let i = 0, n = candidates.length; i < n; ++i) {
      const o = candidates[i][1];
      const x = o % w;
      const y = (o - x) / w;
      const cx = x >> 3, cy = y >> 3, c = cx + cy * gw + margin;
      if (grid[c] === undefined) {
        const point = { x: x, y: y };
        grid[c] = point;
        let k = 0;
        for (; k < 8; k++) {
          const p = grid[c + near8[k]];
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
  const adjustCornerPointsSubPixel = function(image, corners) {
    const maxIteration = 20;
    const maxDistance = 10;
    const size = maxDistance * 2 + 1;
    const weight1 = new Float32Array(size);
    for (let i = -maxDistance, k = 0; i <= maxDistance; i++) {
      const r = i / maxDistance;
      weight1[k++] = Math.exp(-r * r);
    }
    const weight2 = new Float32Array(size * size);
    for (let i = 0, k = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        weight2[k++] = weight1[j] * weight1[i];
      }
    }
    const s0 = maxDistance + 1, s1 = size + 2;
    const eps = 0.03 * 0.03;
    for (let m = 0; m < corners.length; m++) {
      let x = corners[m].x;
      let y = corners[m].y;
      for (let n = 0; n < maxIteration; n++) {
        const sample = readSubPixel(image, x - s0, y - s0, s1, s1);
        let a = 0, b = 0, c = 0, bb1 = 0, bb2 = 0;
        for (let i = -maxDistance, k = 0, o = s1 + 1; i <= maxDistance; i++, o += 2) {
          for (let j = -maxDistance; j <= maxDistance; j++, o++) {
            const w = weight2[k++];
            const dx = sample.data[o + 1] - sample.data[o - 1];
            const dy = sample.data[o + s1] - sample.data[o - s1];
            const dxx = w * dx * dx;
            const dxy = w * dx * dy;
            const dyy = w * dy * dy;
            a += dxx;
            b += dxy;
            c += dyy;
            bb1 += dxx * j + dxy * i;
            bb2 += dxy * j + dyy * i;
          }
        }
        const det = a * c - b * b;
        if (Math.abs(det) <= 1e-10) {
          break;
        }
        const scale = 1 / det;
        const sbb1 = scale * bb1;
        const sbb2 = scale * bb2;
        const ax = c * sbb1 - b * sbb2;
        const ay = a * sbb2 - b * sbb1;
        const error = ax * ax + ay * ay;
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
  const sparseOpticalFlow = function(image1, image2, points, nextPoints) {
    image1 = makeImage(image1);
    image2 = makeImage(image2);
    if (image1.width !== image2.width || image1.height !== image2.height) {
      return [];
    }
    if (image1.channels !== 1) {
      const gray = makeImage(image1.width, image1.height, FORMAT_F32x1);
      convertToGrayscale(gray, image1);
      image1 = gray;
    }
    if (image2.channels !== 1) {
      const gray = makeImage(image2.width, image2.height, FORMAT_F32x1);
      convertToGrayscale(gray, image2);
      image2 = gray;
    }
    if (nextPoints === undefined) {
      nextPoints = [];
      for (let i = 0, p; p = points[i]; i++) {
        nextPoints[i] = { x: p.x, y: p.y };
      }
    } else {
      nextPoints = Array.prototype.slice.call(nextPoints);
    }
    if (20 < Math.min(image1.width, image1.height)) {
      const upperW = Math.ceil(image1.width / 2);
      const upperH = Math.ceil(image1.height / 2);
      const upper1 = makeImage(upperW, upperH, FORMAT_F32x1);
      const upper2 = makeImage(upperW, upperH, FORMAT_F32x1);
      const scale = function(p) {
        return p ? {
          x: (p.x + 0.5) * (upperW / image1.width) - 0.5,
          y: (p.y + 0.5) * (upperH / image1.height) - 0.5
        } : null;
      };
      const unscale = function(p) {
        return p ? {
          x: (p.x + 0.5) * (image1.width / upperW) - 0.5,
          y: (p.y + 0.5) * (image1.height / upperH) - 0.5
        } : null;
      };
      gaussianBlur(upper1, image1, 0.5);
      gaussianBlur(upper2, image2, 0.5);
      const upperPoints = [];
      for (let i = 0, p; p = points[i]; i++) {
        upperPoints[i] = scale(p);
        nextPoints[i] = scale(nextPoints[i]);
      }
      const updatedPoints = sparseOpticalFlow(upper1, upper2, upperPoints, nextPoints);
      for (let i = 0; i < points.length; i++) {
        if (!updatedPoints[i] && nextPoints[i]) {
          const np = nextPoints[i];
          const border = 7;
          if (np.x < border || image1.width - 1 - border < np.x ||
              np.y < border || image1.height - 1 - border < np.y) {
            updatedPoints[i] = np;
          }
        }
        nextPoints[i] = unscale(updatedPoints[i]);
      }
    }
    const dx1 = makeImage(image1.width, image1.height, image1.format);
    const dy1 = makeImage(image1.width, image1.height, image1.format);
    const dScale = 1 / 32;
    const dOffset = image1.channels === 4 ? -128 : 0;
    scharrX(dx1, image1);
    scharrY(dy1, image1);
    for (let i = 0, p; p = points[i]; i++) {
      const np = nextPoints[i];
      if (!np) {
        continue;
      }
      const i1w = readSubPixel(image1, p.x - 7, p.y - 7, 15, 15);
      const dxw = readSubPixel(dx1, p.x - 7, p.y - 7, 15, 15);
      const dyw = readSubPixel(dy1, p.x - 7, p.y - 7, 15, 15);
      let axx = 0, axy = 0, ayy = 0;
      for (let k = 0; k < 15 * 15; k++) {
        const dx = dxw.data[k] + dOffset;
        const dy = dyw.data[k] + dOffset;
        axx += dx * dx;
        axy += dx * dy;
        ayy += dy * dy;
      }
      axx *= dScale * dScale;
      axy *= dScale * dScale;
      ayy *= dScale * dScale;
      const d = axx * ayy - axy * axy;
      const e = (axx + ayy - Math.sqrt((axx - ayy) * (axx - ayy) + 4 * axy * axy)) / (2 * 15 * 15);
      if (e < 0.001 || d < 0.00001) {
        nextPoints[i] = null;
        continue;
      }
      const m = dScale / d;
      for (let j = 0; j < 20; j++) {
        const i2w = readSubPixel(image2, np.x - 7, np.y - 7, 15, 15);
        let bx = 0, by = 0;
        for (let k = 0; k < 15 * 15; k++) {
          const di = i2w.data[k] - i1w.data[k];
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
  const meanColor = function(colors) {
    const mean = [0,0,0,0];
    for (let i = 0; i < colors.length; i++) {
      const c = colors[i];
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
  const mostDistantColorIndex = function(colors) {
    const mean = meanColor(colors);
    let maxD = 0, index = 0;
    for (let i = 0; i < colors.length; i++) {
      const c = colors[i];
      let d = 0;
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
  const mostFrequentColor = function(colors) {
    if (1 === colors.length) {
      return colors[0];
    }
    const list = Array.prototype.slice.call(colors);
    while (1 < list.length) {
      const index = mostDistantColorIndex(list);
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
    rotateCW:       rotateCW,
    rotateCCW:      rotateCCW,
    flipH:          flipH,
    flipV:          flipV,
    applyOrientation:   applyOrientation,
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

if (typeof module !== 'undefined') {
    module.exports = compareImageUtil;
}
