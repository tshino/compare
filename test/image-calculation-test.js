(function() {
  var taskCallback = null;
  var taskQueue = compareUtil.makeTaskQueue(
      '../modules/compare-worker.js',
      function(data) {
        if (taskCallback) taskCallback(data);
      }
  );
  TEST( 'compare-worker.js invalid command', function test(done) {
    var task = { cmd: 'HelloWorld' };
    taskCallback = function(data) {
      EXPECT_EQ( 'HelloWorld', data.cmd );
      done();
    };
    taskQueue.addTask(task);
  });
  TEST( 'compare-worker.js calcHistogram', function test(done) {
    jsTestUtil.makeSequentialTest([
      function(done) {
        var task = {
          cmd: 'calcHistogram',
          type: 0, // RGB
          auxTypes: [0],
          imageData: [{
            width: 4,
            height: 4,
            data: [
              0, 0, 0, 255,  0, 0, 64, 255,  0, 0, 128, 255,  0, 0, 192, 255,
              0, 0, 0, 255,  0, 0, 64, 255,  0, 0, 128, 255,  0, 0, 192, 255,
              0, 1, 0, 255,  0, 1, 64, 255,  0, 1, 128, 255,  0, 1, 192, 255,
              0, 1, 0, 255,  0, 1, 64, 255,  0, 1, 128, 255,  0, 1, 192, 255,
            ]
          }]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcHistogram', data.cmd );
          EXPECT_EQ( 256 * 3, data.result.length );
          EXPECT_EQ( 16, data.result[0] );
          EXPECT_EQ( 0, data.result[1] );
          EXPECT_EQ( 0, data.result[255] );
          EXPECT_EQ( 8, data.result[256] );
          EXPECT_EQ( 8, data.result[256 + 1] );
          EXPECT_EQ( 0, data.result[256 + 2] );
          EXPECT_EQ( 0, data.result[256 + 255] );
          EXPECT_EQ( 4, data.result[512] );
          EXPECT_EQ( 0, data.result[512 + 1] );
          EXPECT_EQ( 4, data.result[512 + 64] );
          EXPECT_EQ( 4, data.result[512 + 128] );
          EXPECT_EQ( 4, data.result[512 + 192] );
          EXPECT_EQ( 0, data.result[512 + 255] );
          done();
        };
        taskQueue.addTask(task);
      },
      function(done) {
        var task = {
          cmd: 'calcHistogram',
          type: 1, // Grayscale
          auxTypes: [0],
          imageData: [{
            width: 4,
            height: 4,
            data: [
              0, 0, 0, 255,  0, 0, 0, 255,  0, 0, 0, 255,  0, 0, 0, 255,
              1, 1, 1, 255,  1, 1, 1, 255,  1, 1, 1, 255,  1, 1, 1, 255,
              64, 64, 64, 255,  64, 64, 64, 255,  64, 64, 64, 255,  64, 64, 64, 255,
              255, 255, 255, 255,  255, 255, 255, 255,  255, 255, 255, 255,  255, 255, 255, 255,
            ]
          }]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcHistogram', data.cmd );
          EXPECT_EQ( 256, data.result.length );
          EXPECT_EQ( 4, data.result[0] );
          EXPECT_EQ( 4, data.result[1] );
          EXPECT_EQ( 0, data.result[2] );
          EXPECT_EQ( 0, data.result[63] );
          EXPECT_EQ( 4, data.result[64] );
          EXPECT_EQ( 0, data.result[65] );
          EXPECT_EQ( 0, data.result[254] );
          EXPECT_EQ( 4, data.result[255] );
          done();
        };
        taskQueue.addTask(task);
      },
      function(done) {
        var task = {
          cmd: 'calcHistogram',
          type: 2, // YCbCr
          auxTypes: [0], // bt601
          imageData: [{
            width: 4,
            height: 4,
            data: [
              // #000000 -> (Y,Cb,Cr)=(0,128,128)
              // #808080 -> (Y,Cb,Cr)=(128,128,128)
              0, 0, 0, 255,  0, 0, 0, 255,  128, 128, 128, 255,  128, 128, 128, 255,
              0, 0, 0, 255,  0, 0, 0, 255,  128, 128, 128, 255,  128, 128, 128, 255,
              // #ff0000 -> (Y,Cb,Cr)=(76,84,255)
              255, 0, 0, 255,  255, 0, 0, 255,  255, 0, 0, 255,  255, 0, 0, 255,
              // #0000ff -> (Y,Cb,Cr)=(29,255,107)
              // #ffff00 -> (Y,Cb,Cr)=(226,0,148)
              0, 0, 255, 255,  0, 0, 255, 255,  0, 0, 255, 255,  255, 255, 0, 255,
            ]
          }]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcHistogram', data.cmd );
          EXPECT_EQ( 256 * 3, data.result.length );
          EXPECT_EQ( 4, data.result[0] );
          EXPECT_EQ( 0, data.result[1] );
          EXPECT_EQ( 3, data.result[29] );
          EXPECT_EQ( 4, data.result[76] );
          EXPECT_EQ( 4, data.result[128] );
          EXPECT_EQ( 1, data.result[226] );
          EXPECT_EQ( 1, data.result[256] );
          EXPECT_EQ( 4, data.result[256 + 84] );
          EXPECT_EQ( 8, data.result[256 + 128] );
          EXPECT_EQ( 3, data.result[256 + 255] );
          EXPECT_EQ( 0, data.result[512] );
          EXPECT_EQ( 3, data.result[512 + 107] );
          EXPECT_EQ( 8, data.result[512 + 128] );
          EXPECT_EQ( 1, data.result[512 + 148] );
          EXPECT_EQ( 4, data.result[512 + 255] );
          done();
        };
        taskQueue.addTask(task);
      },
    ])(done);
  });
  TEST( 'compare-worker.js calcWaveform', function test(done) {
    var makeAsyncTest = function(label, input, expected) {
      label = ' in case ' + label;
      return function(done) {
        var task = {
          cmd: 'calcWaveform',
          type: input.type,
          auxTypes: input.auxTypes,
          histW: input.histW,
          transposed: input.transposed,
          flipped: input.flipped,
          imageData: input.imageData
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcWaveform', data.cmd, 'cmd' + label );
          EXPECT_EQ( expected.length, data.result.length, 'result.length' + label );
          if (expected.length === data.result.length) {
            var errorCount = 0;
            for (var i = 0; i < expected.length; i++) {
              if (expected[i] !== data.result[i]) {
                errorCount += 1;
                if (3 < errorCount) {
                  ERROR('...Too many errors' + label);
                  break;
                }
                EXPECT_EQ( expected[i], data.result[i], 'result[' + i + ']' + label );
              }
            }
          }
          done();
        };
        taskQueue.addTask(task);
      };
    };
    var makeWaveform = function(w, list) {
      var waveform = new Uint32Array(256 * w);
      for (var i = 0; i < list.length; i++) {
        for (var j = 0; j < list[i].length; j++) {
          waveform[i * 256 + list[i][j][0]] = list[i][j][1];
        }
      }
      return waveform;
    };
    var tests = [];
    var imageData1 = [{
      width: 4,
      height: 4,
      data: [
        0, 0, 0, 255,  0, 0, 64, 255,  0, 0, 128, 255,  0, 0, 192, 255,
        0, 0, 0, 255,  0, 0, 64, 255,  0, 0, 128, 255,  0, 0, 192, 255,
        0, 1, 0, 255,  0, 1, 64, 255,  0, 1, 128, 255,  0, 1, 192, 255,
        0, 1, 0, 255,  0, 1, 64, 255,  0, 1, 128, 255,  0, 1, 192, 255,
      ]
    }];
    tests.push(makeAsyncTest('rgb test1', {
      type: 0, // RGB
      auxTypes: [0, 0],
      histW: 4,
      transposed: false,
      flipped: false,
      imageData: imageData1
    }, makeWaveform(3 * 4, [
      [[0,4]], [[0,4]], [[0,4]], [[0,4]], // R
      [[0,2],[1,2]], [[0,2],[1,2]], [[0,2],[1,2]], [[0,2],[1,2]], // G
      [[0,4]], [[64,4]], [[128,4]], [[192,4]] // B
    ])));
    tests.push(makeAsyncTest('rgb test2', {
      type: 0, // RGB
      auxTypes: [0, 0],
      histW: 4,
      transposed: true, // transposed!
      flipped: false,
      imageData: imageData1
    }, makeWaveform(3 * 4, [
      [[0,4]], [[0,4]], [[0,4]], [[0,4]], // R
      [[0,4]], [[0,4]], [[1,4]], [[1,4]], // G
      [[0,1],[64,1],[128,1],[192,1]], [[0,1],[64,1],[128,1],[192,1]], // B
      [[0,1],[64,1],[128,1],[192,1]], [[0,1],[64,1],[128,1],[192,1]],
    ])));
    tests.push(makeAsyncTest('luminance test1', {
      type: 1, // Luminance
      auxTypes: [0, 0],
      histW: 4,
      transposed: false,
      flipped: false,
      imageData: imageData1
    }, makeWaveform(4, [
      [[0,2],[1,2]], [[7,2],[8,2]], [[15,4]], [[22,4]]
    ])));
    tests.push(makeAsyncTest('ycbcr test1', {
      type: 2, // YCbCr
      auxTypes: [0, 0],
      histW: 4,
      transposed: false,
      flipped: false,
      imageData: imageData1
    }, makeWaveform(3 * 4, [
      [[0,2],[1,2]], [[7,2],[8,2]], [[15,4]], [[22,4]], // Y
      [[127,2],[128,2]], [[159,2],[160,2]], [[191,2],[192,2]], [[223,2],[224,2]], // Cb
      [[127,2],[128,2]], [[122,4]], [[117,4]], [[111,2],[112,2]], // Cr
    ])));
    jsTestUtil.makeSequentialTest(tests)(done);
  });
  TEST( 'compare-worker.js calc3DWaveform', function test(done) {
    var makeAsyncTest = function(label, input, expected) {
      label = ' in case ' + label;
      return function(done) {
        var task = {
          cmd: 'calc3DWaveform',
          imageData: [input.imageData]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calc3DWaveform', data.cmd, 'cmd' + label );
          EXPECT_EQ( expected.width, data.result.width, 'width' + label );
          EXPECT_EQ( expected.height, data.result.height, 'height' + label );
          EXPECT_EQ( expected.waveform.length, data.result.waveform.length, 'waveform.length' + label );
          if (expected.waveform.length === data.result.waveform.length) {
            var errorCount = 0;
            for (var i = 0; i < expected.waveform.length; i++) {
              if (expected.waveform[i] !== data.result.waveform[i]) {
                errorCount += 1;
                if (3 < errorCount) {
                  ERROR('...Too many errors' + label);
                  break;
                }
                EXPECT_EQ( expected.waveform[i], data.result.waveform[i], 'waveform[' + i + ']' + label );
              }
            }
          }
          done();
        };
        taskQueue.addTask(task);
      };
    };
    var makeImage = compareImageUtil.makeImage;
    var makeRegion = compareImageUtil.makeRegion;
    var fill = compareImageUtil.fill;
    var image40x30 = makeImage(40, 30);
    var image30x40 = makeImage(30, 40);
    var image1x999 = makeImage(1, 999);
    var image999x1 = makeImage(999,1);
    fill(image40x30, 0, 0, 0, 255);
    fill(image30x40, 0, 0, 0, 255);
    fill(image1x999, 255, 0, 0, 255);
    fill(image999x1, 0, 255, 0, 255);
    fill(makeRegion(image40x30, 0, 15, 20, 15), 0, 0, 255, 255);
    fill(makeRegion(image30x40, 15, 0, 15, 20), 0, 255, 0, 255);
    var expected40x30 = new Uint8Array(256 * 192 * 3);
    var expected30x40 = new Uint8Array(192 * 256 * 3);
    for (var y = 96; y < 192; y++) {
      for (var x = 0; x < 128; x++) {
        expected40x30[(y * 256 + x) * 3 + 2] = 255;
        expected30x40[(x * 192 + y) * 3 + 1] = 255;
      }
    }
    var expected1x999 = new Uint8Array(1 * 256 * 3);
    var expected999x1 = new Uint8Array(256 * 1 * 3);
    for (var y = 0; y < 256; y++) {
      expected1x999[y * 3] = 255;
      expected999x1[y * 3 + 1] = 255;
    }
    var tests = [];
    tests.push(makeAsyncTest('image40x30', {
      imageData: image40x30
    }, {
      width: 256,
      height: 192,
      waveform: expected40x30
    }));
    tests.push(makeAsyncTest('image30x40', {
      imageData: image30x40
    }, {
      width: 192,
      height: 256,
      waveform: expected30x40
    }));
    tests.push(makeAsyncTest('image1x999', {
      imageData: image1x999
    }, {
      width: 1,
      height: 256,
      waveform: expected1x999
    }));
    tests.push(makeAsyncTest('image999x1', {
      imageData: image999x1
    }, {
      width: 256,
      height: 1,
      waveform: expected999x1
    }));
    jsTestUtil.makeSequentialTest(tests)(done);
  });
  TEST( 'compare-worker.js calcReducedColorTable', function test(done) {
    var makeAsyncTest = function(label, input, expected) {
      return function(done) {
        var task = {
          cmd: 'calcReducedColorTable',
          imageData: [input]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcReducedColorTable', data.cmd, 'cmd of ' + label );
          EXPECT_EQ( expected.totalCount, data.result.totalCount, 'totalCount of ' + label );
          EXPECT_EQ( expected.colorList.length, data.result.colorList.length, 'colorList.length of ' + label );
          if (expected.colorList.length === data.result.colorList.length) {
            for (var i = 0; i < expected.colorList.length; i++) {
              var s0 = 'colorList[' + i + ']', s1 = ' of ' + label;
              EXPECT_EQ( expected.colorList[i][1], data.result.colorList[i][1], s0 + '[1]' + s1 );
              EXPECT_EQ( expected.colorList[i][2], data.result.colorList[i][2], s0 + '[2]' + s1 );
              EXPECT_EQ( expected.colorList[i][3], data.result.colorList[i][3], s0 + '[3]' + s1 );
              EXPECT_EQ( expected.colorList[i][4], data.result.colorList[i][4], s0 + '[4]' + s1 );
            }
          }
          done();
        };
        taskQueue.addTask(task);
      };
    };
    var tests = [];
    // single color
    tests.push(makeAsyncTest('single color', {
      width: 4,
      height: 4,
      data: [
        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255
      ]
    }, {
      totalCount: 16,
      colorList: [
        [0, 16, 0, 0, 0]
      ]
    }));
    // exactly only two colors
    tests.push(makeAsyncTest('exactly only two colors', {
      width: 4,
      height: 4,
      data: [
        0,0,0,255,     0,0,0,255,     0,0,0,255, 0,0,0,255,
        0,0,0,255, 255,0,128,255, 255,0,128,255, 0,0,0,255,
        0,0,0,255, 255,0,128,255, 255,0,128,255, 0,0,0,255,
        0,0,0,255,     0,0,0,255,     0,0,0,255, 0,0,0,255
      ]
    }, {
      totalCount: 16,
      colorList: [
        [0, 12, 0, 0, 0],
        [0, 4, 4*255, 4*0, 4*128]
      ]
    }));
    // gradation
    tests.push(makeAsyncTest('grayscaleGradation', {
      width: 4,
      height: 4,
      data: [
        0, 0, 0, 255, 2, 2, 2, 255, 4, 4, 4, 255, 6, 6, 6, 255,
        2, 2, 2, 255, 4, 4, 4, 255, 6, 6, 6, 255, 8, 8, 8, 255,
        4, 4, 4, 255, 6, 6, 6, 255, 8, 8, 8, 255, 10,10,10,255,
        6, 6, 6, 255, 8, 8, 8, 255, 10,10,10,255, 12,12,12,255
      ]
    }, {
      totalCount: 16,
      colorList: [
        [0, 16, 16*6, 16*6, 16*6]
      ]
    }));
    tests.push(makeAsyncTest('colorGradation', {
      width: 4,
      height: 4,
      data: [
        70,30,30, 255, 72,32,32, 255, 74,34,34, 255, 76,36,36, 255,
        72,32,32, 255, 74,34,34, 255, 76,36,36, 255, 78,38,38, 255,
        74,34,34, 255, 76,36,36, 255, 78,38,38, 255, 80,40,40, 255,
        76,36,36, 255, 78,38,38, 255, 80,40,40, 255, 82,42,42, 255
      ]
    }, {
      totalCount: 16,
      colorList: [
        [0, 16, 16*76, 16*36, 16*36]
      ]
    }));
    // stripe
    var makeImage = compareImageUtil.makeImage;
    var makeRegion = compareImageUtil.makeRegion;
    var fill = compareImageUtil.fill;
    var stripe = makeImage(50, 30);
    fill(stripe, 255, 255, 255, 255);
    fill(makeRegion(stripe, 10, 0, 10, 30), 0, 0, 255, 255);
    fill(makeRegion(stripe, 30, 0, 10, 30), 0, 0, 255, 255);
    tests.push(makeAsyncTest('stripe', stripe, {
      totalCount: 50 * 30,
      colorList: [
        [0, 900, 900*255, 900*255, 900*255],
        [0, 600, 600*0, 600*0, 600*255],
      ]
    }));
    jsTestUtil.makeSequentialTest(tests)(done);
  });
  TEST( 'compare-worker.js calcMetrics', function test(done) {
    Math.log10 = Math.log10 || function(x) {
      return Math.log(x) / Math.LN10;
    };
    var colorImage1 = {
      width: 4,
      height: 4,
      data: [
        0, 0, 0, 255,  0, 0, 64, 255,  0, 0, 128, 255,  0, 0, 192, 255,
        0, 1, 0, 255,  0, 1, 64, 255,  0, 1, 128, 255,  0, 1, 192, 255,
        0, 1, 0, 255,  0, 1, 64, 255,  0, 1, 128, 255,  0, 1, 192, 255,
        0, 1, 0, 255,  0, 1, 64, 255,  0, 1, 128, 255,  0, 1, 192, 255,
      ]
    };
    // different with colorImage1 in only red component of every pixel
    var colorImage2 = {
      width: 4,
      height: 4,
      data: [
        30, 0, 0, 255,  30, 0, 64, 255,  30, 0, 128, 255,  30, 0, 192, 255,
        30, 1, 0, 255,  30, 1, 64, 255,  30, 1, 128, 255,  30, 1, 192, 255,
        30, 1, 0, 255,  30, 1, 64, 255,  30, 1, 128, 255,  30, 1, 192, 255,
        30, 1, 0, 255,  30, 1, 64, 255,  30, 1, 128, 255,  30, 1, 192, 255,
      ]
    };
    var redImage = {
      width: 4,
      height: 4,
      data: [
        255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
        255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
        255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
        255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255
      ]
    };
    var greenImage = {
      width: 4,
      height: 4,
      data: [
        0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255,
        0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255,
        0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255,
        0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255
      ]
    };
    var blackImage = {
      width: 4,
      height: 4,
      data: [
        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255
      ]
    };
    var whiteImage = {
      width: 4,
      height: 4,
      data: [
        255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
        255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
        255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
        255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255
      ]
    };
    var transparent = {
      width: 4,
      height: 4,
      data: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
      ]
    };
    jsTestUtil.makeSequentialTest([
      // exactly same images
      function(done) {
        var task = {
          cmd: 'calcMetrics',
          imageData: [colorImage1, colorImage1],
          auxTypes: [0]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT_EQ( 0, data.auxTypes[0] );
          EXPECT_EQ( Infinity, data.result.psnr );
          EXPECT_EQ( 0, data.result.sad );
          EXPECT_EQ( 0, data.result.ssd );
          EXPECT_EQ( 0, data.result.mae );
          EXPECT_EQ( 0, data.result.mse );
          EXPECT_EQ( 1, data.result.ncc );
          EXPECT_EQ( Infinity, data.result.y.psnr );
          EXPECT_EQ( 0, data.result.y.sad );
          EXPECT_EQ( 0, data.result.y.ssd );
          EXPECT_EQ( 0, data.result.y.mae );
          EXPECT_EQ( 0, data.result.y.mse );
          EXPECT_EQ( 1, data.result.y.ncc );
          EXPECT_EQ( 0, data.result.ae );
          EXPECT_EQ( 0, data.result.aeRgb );
          EXPECT_EQ( 0, data.result.aeAlpha );
          done();
        };
        taskQueue.addTask(task);
      },
      // different images
      function(done) {
        var task = {
          cmd: 'calcMetrics',
          imageData: [colorImage1, colorImage2],
          auxTypes: [0]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT( 1e-14 > Math.abs(10 * Math.log10((3*255*255) / (30*30)) - data.result.psnr) );
          EXPECT_EQ( 30*16, data.result.sad );
          EXPECT_EQ( 30*30*16, data.result.ssd );
          EXPECT_EQ( 30/3, data.result.mae );
          EXPECT_EQ( (30*30)/3, data.result.mse );
          //EXPECT_EQ( ????, data.result.ncc ); // non-trivial answer
          EXPECT( 1e-14 > Math.abs(10 * Math.log10((255*255) / (9*9)) - data.result.y.psnr) );
          EXPECT_EQ( 9*16, data.result.y.sad );
          EXPECT_EQ( 9*9*16, data.result.y.ssd );
          EXPECT_EQ( 9, data.result.y.mae );
          EXPECT_EQ( 9*9, data.result.y.mse );
          //EXPECT_EQ( ????, data.result.y.ncc ); // non-trivial answer
          EXPECT_EQ( 16, data.result.ae );
          EXPECT_EQ( 16, data.result.aeRgb );
          EXPECT_EQ( 0, data.result.aeAlpha );
          done();
        };
        taskQueue.addTask(task);
      },
      function(done) {
        var task = {
          cmd: 'calcMetrics',
          imageData: [colorImage1, colorImage2],
          auxTypes: [1] // *** bt709
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT( 1e-14 > Math.abs(10 * Math.log10((255*255*16) / (6*6*12+7*7*4)) - data.result.y.psnr) );
          EXPECT_EQ( 6*12+7*4, data.result.y.sad );
          EXPECT_EQ( 6*6*12+7*7*4, data.result.y.ssd );
          EXPECT_EQ( 6.25, data.result.y.mae );
          EXPECT_EQ( 6*6*0.75+7*7*0.25, data.result.y.mse );
          //EXPECT_EQ( ????, data.result.y.ncc ); // non-trivial answer
          done();
        };
        taskQueue.addTask(task);
      },
      function(done) {
        var task = {
          cmd: 'calcMetrics',
          imageData: [redImage, greenImage],
          auxTypes: [0]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT( 1e-14 > Math.abs(10 * Math.log10(1.5) - data.result.psnr) );
          EXPECT_EQ( 255 * 2 * 16, data.result.sad );
          EXPECT_EQ( 255 * 255 * 2 * 16, data.result.ssd );
          EXPECT_EQ( 255 * 2 / 3, data.result.mae );
          EXPECT_EQ( 255 * 255 * 2 / 3, data.result.mse );
          EXPECT_EQ( -0.5, data.result.ncc );
          EXPECT( 1e-14 > Math.abs(10 * Math.log10((255*255) / (74*74)) - data.result.y.psnr) );
          EXPECT_EQ( 74 * 16, data.result.y.sad );
          EXPECT_EQ( 74 * 74 * 16, data.result.y.ssd );
          EXPECT_EQ( 74, data.result.y.mae );
          EXPECT_EQ( 74 * 74, data.result.y.mse );
          //EXPECT_EQ( xxx, data.result.y.ncc );  //FIXME
          EXPECT_EQ( 16, data.result.ae );
          EXPECT_EQ( 16, data.result.aeRgb );
          EXPECT_EQ( 0, data.result.aeAlpha );
          done();
        };
        taskQueue.addTask(task);
      },
      // exactly same flat images
      // Note: NCC between flat image and any image is always 0 (definition in this app)
      function(done) {
        var task = {
          cmd: 'calcMetrics',
          imageData: [blackImage, blackImage],
          auxTypes: [0]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT_EQ( Infinity, data.result.psnr );
          EXPECT_EQ( 0, data.result.sad );
          EXPECT_EQ( 0, data.result.ssd );
          EXPECT_EQ( 0, data.result.mae );
          EXPECT_EQ( 0, data.result.mse );
          EXPECT_EQ( 0, data.result.ncc );
          EXPECT_EQ( Infinity, data.result.y.psnr );
          EXPECT_EQ( 0, data.result.y.sad );
          EXPECT_EQ( 0, data.result.y.ssd );
          EXPECT_EQ( 0, data.result.y.mae );
          EXPECT_EQ( 0, data.result.y.mse );
          EXPECT_EQ( 0, data.result.y.ncc );
          EXPECT_EQ( 0, data.result.ae );
          EXPECT_EQ( 0, data.result.aeRgb );
          EXPECT_EQ( 0, data.result.aeAlpha );
          done();
        };
        taskQueue.addTask(task);
      },
      // exactly same flat images (both transparent)
      function(done) {
        var task = {
          cmd: 'calcMetrics',
          imageData: [transparent, transparent],
          auxTypes: [0]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT_EQ( Infinity, data.result.psnr );
          EXPECT_EQ( 0, data.result.sad );
          EXPECT_EQ( 0, data.result.ssd );
          EXPECT_EQ( 0, data.result.mae );
          EXPECT_EQ( 0, data.result.mse );
          EXPECT_EQ( 0, data.result.ncc );
          EXPECT_EQ( Infinity, data.result.y.psnr );
          EXPECT_EQ( 0, data.result.y.sad );
          EXPECT_EQ( 0, data.result.y.ssd );
          EXPECT_EQ( 0, data.result.y.mae );
          EXPECT_EQ( 0, data.result.y.mse );
          EXPECT_EQ( 0, data.result.y.ncc );
          EXPECT_EQ( 0, data.result.ae );
          EXPECT_EQ( 0, data.result.aeRgb );
          EXPECT_EQ( 0, data.result.aeAlpha );
          done();
        };
        taskQueue.addTask(task);
      },
      // different flat images
      function(done) {
        var task = {
          cmd: 'calcMetrics',
          imageData: [blackImage, whiteImage],
          auxTypes: [0]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT_EQ( 0, data.result.psnr );
          EXPECT_EQ( 255*3*16, data.result.sad );
          EXPECT_EQ( 255*255*3*16, data.result.ssd );
          EXPECT_EQ( 255, data.result.mae );
          EXPECT_EQ( 255 * 255, data.result.mse );
          EXPECT_EQ( 0, data.result.ncc );
          EXPECT_EQ( 0, data.result.y.psnr );
          EXPECT_EQ( 255*16, data.result.y.sad );
          EXPECT_EQ( 255*255*16, data.result.y.ssd );
          EXPECT_EQ( 255, data.result.y.mae );
          EXPECT_EQ( 255 * 255, data.result.y.mse );
          EXPECT_EQ( 0, data.result.y.ncc );
          EXPECT_EQ( 16, data.result.ae );
          EXPECT_EQ( 16, data.result.aeRgb );
          EXPECT_EQ( 0, data.result.aeAlpha );
          done();
        };
        taskQueue.addTask(task);
      },
      // different flat images
      function(done) {
        var task = {
          cmd: 'calcMetrics',
          imageData: [blackImage, redImage],
          auxTypes: [0]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT( 1e-14 > Math.abs(10 * Math.log10(3) - data.result.psnr) );
          EXPECT_EQ( 255 * 16, data.result.sad );
          EXPECT_EQ( 255 * 255 * 16, data.result.ssd );
          EXPECT_EQ( 255 / 3, data.result.mae );
          EXPECT_EQ( 255 * 255 / 3, data.result.mse );
          EXPECT_EQ( 0, data.result.ncc );
          EXPECT( 1e-14 > Math.abs(10 * Math.log10((255*255) / (76*76)) - data.result.y.psnr) );
          EXPECT_EQ( 76 * 16, data.result.y.sad );
          EXPECT_EQ( 76 * 76 * 16, data.result.y.ssd );
          EXPECT_EQ( 76, data.result.y.mae );
          EXPECT_EQ( 76 * 76, data.result.y.mse );
          EXPECT_EQ( 0, data.result.y.ncc );
          EXPECT_EQ( 16, data.result.ae );
          EXPECT_EQ( 16, data.result.aeRgb );
          EXPECT_EQ( 0, data.result.aeAlpha );
          done();
        };
        taskQueue.addTask(task);
      },
      // different flat images
      function(done) {
        var task = {
          cmd: 'calcMetrics',
          imageData: [blackImage, transparent],
          auxTypes: [0]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT_EQ( Infinity, data.result.psnr );
          EXPECT_EQ( 0, data.result.sad );
          EXPECT_EQ( 0, data.result.ssd );
          EXPECT_EQ( 0, data.result.mae );
          EXPECT_EQ( 0, data.result.mse );
          EXPECT_EQ( 0, data.result.ncc );
          EXPECT_EQ( Infinity, data.result.y.psnr );
          EXPECT_EQ( 0, data.result.y.sad );
          EXPECT_EQ( 0, data.result.y.ssd );
          EXPECT_EQ( 0, data.result.y.mae );
          EXPECT_EQ( 0, data.result.y.mse );
          EXPECT_EQ( 0, data.result.y.ncc );
          EXPECT_EQ( 16, data.result.ae );
          EXPECT_EQ( 0, data.result.aeRgb );
          EXPECT_EQ( 16, data.result.aeAlpha );
          done();
        };
        taskQueue.addTask(task);
      },
      // different images, one is flat
      function(done) {
        var task = {
          cmd: 'calcMetrics',
          imageData: [blackImage, colorImage1],
          auxTypes: [0]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          //EXPECT_EQ( ???, data.result.psnr );
          //EXPECT_EQ( ???, data.result.sad );
          //EXPECT_EQ( ???, data.result.ssd );
          //EXPECT_EQ( ???, data.result.mae );
          //EXPECT_EQ( ???, data.result.mse );
          EXPECT_EQ( 0, data.result.ncc );
          //EXPECT_EQ( ???, data.result.y.psnr );
          //EXPECT_EQ( ???, data.result.y.sad );
          //EXPECT_EQ( ???, data.result.y.ssd );
          //EXPECT_EQ( ???, data.result.y.mae );
          //EXPECT_EQ( ???, data.result.y.mse );
          EXPECT_EQ( 0, data.result.y.ncc );
          EXPECT_EQ( 15, data.result.ae );
          EXPECT_EQ( 15, data.result.aeRgb );
          EXPECT_EQ( 0, data.result.aeAlpha );
          done();
        };
        taskQueue.addTask(task);
      },
    ])(done);
  });
  TEST( 'compare-worker.js calcMetrics size/orientation', function test(done) {
    var image3x2 = { width: 3, height: 2, data: [
      0,0,0,0,     85,85,85,85,     170,170,170,170,
      85,85,85,85, 170,170,170,170, 255,255,255,255
    ]};
    var image2x3 = { width: 2, height: 3, data: [
      0,0,0,0,         85,85,85,85,
      85,85,85,85,     170,170,170,170,
      170,170,170,170, 255,255,255,255
    ]};
    var imageEmpty = { width: 0, height: 0, data: [] };
    jsTestUtil.makeSequentialTest([
      // different size => error
      function(done) {
        var task = { cmd: 'calcMetrics', imageData: [image3x2, image2x3] };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT( isNaN(data.result.psnr) );
          EXPECT( isNaN(data.result.sad) );
          EXPECT( isNaN(data.result.ssd) );
          EXPECT( isNaN(data.result.mae) );
          EXPECT( isNaN(data.result.mse) );
          EXPECT( isNaN(data.result.ncc) );
          EXPECT( isNaN(data.result.y.psnr) );
          EXPECT( isNaN(data.result.y.sad) );
          EXPECT( isNaN(data.result.y.ssd) );
          EXPECT( isNaN(data.result.y.mae) );
          EXPECT( isNaN(data.result.y.mse) );
          EXPECT( isNaN(data.result.y.ncc) );
          EXPECT( isNaN(data.result.ae) );
          EXPECT( isNaN(data.result.aeRgb) );
          EXPECT( isNaN(data.result.aeAlpha) );
          done();
        };
        taskQueue.addTask(task);
      },
      // invalid size => error
      function(done) {
        var task = { cmd: 'calcMetrics', imageData: [imageEmpty, image2x3] };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT( isNaN(data.result.psnr) );
          EXPECT( isNaN(data.result.sad) );
          EXPECT( isNaN(data.result.ssd) );
          EXPECT( isNaN(data.result.mae) );
          EXPECT( isNaN(data.result.mse) );
          EXPECT( isNaN(data.result.ncc) );
          EXPECT( isNaN(data.result.y.psnr) );
          EXPECT( isNaN(data.result.y.sad) );
          EXPECT( isNaN(data.result.y.ssd) );
          EXPECT( isNaN(data.result.y.mae) );
          EXPECT( isNaN(data.result.y.mse) );
          EXPECT( isNaN(data.result.y.ncc) );
          EXPECT( isNaN(data.result.ae) );
          EXPECT( isNaN(data.result.aeRgb) );
          EXPECT( isNaN(data.result.aeAlpha) );
          done();
        };
        taskQueue.addTask(task);
      },
      function(done) {
        var task = { cmd: 'calcMetrics', imageData: [image2x3, imageEmpty] };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT( isNaN(data.result.psnr) );
          EXPECT( isNaN(data.result.sad) );
          EXPECT( isNaN(data.result.ssd) );
          EXPECT( isNaN(data.result.mae) );
          EXPECT( isNaN(data.result.mse) );
          EXPECT( isNaN(data.result.ncc) );
          EXPECT( isNaN(data.result.y.psnr) );
          EXPECT( isNaN(data.result.y.sad) );
          EXPECT( isNaN(data.result.y.ssd) );
          EXPECT( isNaN(data.result.y.mae) );
          EXPECT( isNaN(data.result.y.mse) );
          EXPECT( isNaN(data.result.y.ncc) );
          EXPECT( isNaN(data.result.ae) );
          EXPECT( isNaN(data.result.aeRgb) );
          EXPECT( isNaN(data.result.aeAlpha) );
          done();
        };
        taskQueue.addTask(task);
      },
      // different orientation and resulting same image
      function(done) {
        var options = { orientationA: 1, orientationB: 5 };
        var task = { cmd: 'calcMetrics', imageData: [image3x2, image2x3], options };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT_EQ( Infinity, data.result.psnr );
          EXPECT_EQ( 0, data.result.sad );
          EXPECT_EQ( 0, data.result.ssd );
          EXPECT_EQ( 0, data.result.mae );
          EXPECT_EQ( 0, data.result.mse );
          EXPECT_EQ( 1, data.result.ncc );
          EXPECT_EQ( Infinity, data.result.y.psnr );
          EXPECT_EQ( 0, data.result.y.sad );
          EXPECT_EQ( 0, data.result.y.ssd );
          EXPECT_EQ( 0, data.result.y.mae );
          EXPECT_EQ( 0, data.result.y.mse );
          EXPECT_EQ( 1, data.result.y.ncc );
          EXPECT_EQ( 0, data.result.ae );
          EXPECT_EQ( 0, data.result.aeRgb );
          EXPECT_EQ( 0, data.result.aeAlpha );
          done();
        };
        taskQueue.addTask(task);
      }
    ])(done);
  });
  TEST( 'compare-worker.js calcToneCurve', function test(done) {
    var image1 = { width: 3, height: 2, data: [
      0,0,0,0,     85,85,85,85,     170,170,170,170,
      85,85,85,85, 170,170,170,170, 170,170,170,170
    ]};
    var image2 = { width: 3, height: 2, data: [
      10,10,10,10, 20,20,20,20, 30,30,30,30,
      30,30,30,30, 30,30,30,30, 30,30,30,30
    ]};
    var image3 = { width: 2, height: 3, data: [
      20,20,20,20, 10,10,10,10,
      30,30,30,30, 20,20,20,20,
      50,50,50,50, 30,30,30,30
    ]};
    jsTestUtil.makeSequentialTest([
      function(done) {
        var task = { cmd: 'calcToneCurve', type: 0, auxTypes: [0], imageData: [image1, image2] };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcToneCurve', data.cmd );
          EXPECT_EQ( 0, data.type );
          EXPECT_EQ( 0, data.auxTypes[0] );
          EXPECT_EQ( 3, data.result.components.length );
          EXPECT( data.result.toneMap );
          EXPECT_EQ( 256 * 256 * 3, data.result.toneMap.dist.length );
          EXPECT_EQ( 3 * 2, data.result.toneMap.max );
          EXPECT_EQ( 1, data.result.toneMap.dist[0 + (255-10)*256] );
          EXPECT_EQ( 1, data.result.toneMap.dist[0 + (255-10)*256 + 65536] );
          EXPECT_EQ( 1, data.result.toneMap.dist[0 + (255-10)*256 + 131072] );
          EXPECT_EQ( 1, data.result.toneMap.dist[85 + (255-20)*256] );
          EXPECT_EQ( 1, data.result.toneMap.dist[85 + (255-20)*256 + 65536] );
          EXPECT_EQ( 1, data.result.toneMap.dist[85 + (255-20)*256 + 131072] );
          EXPECT_EQ( 1, data.result.toneMap.dist[85 + (255-30)*256] );
          EXPECT_EQ( 1, data.result.toneMap.dist[85 + (255-30)*256 + 65536] );
          EXPECT_EQ( 1, data.result.toneMap.dist[85 + (255-30)*256 + 131072] );
          EXPECT_EQ( 3, data.result.toneMap.dist[170 + (255-30)*256] );
          EXPECT_EQ( 3, data.result.toneMap.dist[170 + (255-30)*256 + 65536] );
          EXPECT_EQ( 3, data.result.toneMap.dist[170 + (255-30)*256 + 131072] );
          done();
        };
        taskQueue.addTask(task);
      },
      function(done) {
        var options = { orientationA: 1, orientationB: 8 };
        var task = { cmd: 'calcToneCurve', type: 0, auxTypes: [0], imageData: [image1, image3], options };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcToneCurve', data.cmd );
          EXPECT_EQ( 0, data.type );
          EXPECT_EQ( 0, data.auxTypes[0] );
          EXPECT_EQ( 3, data.result.components.length );
          EXPECT( data.result.toneMap );
          EXPECT_EQ( 256 * 256 * 3, data.result.toneMap.dist.length );
          EXPECT_EQ( 3 * 2, data.result.toneMap.max );
          EXPECT_EQ( 1, data.result.toneMap.dist[0 + (255-10)*256] );
          EXPECT_EQ( 1, data.result.toneMap.dist[0 + (255-10)*256 + 65536] );
          EXPECT_EQ( 1, data.result.toneMap.dist[0 + (255-10)*256 + 131072] );
          EXPECT_EQ( 2, data.result.toneMap.dist[85 + (255-20)*256] );
          EXPECT_EQ( 2, data.result.toneMap.dist[85 + (255-20)*256 + 65536] );
          EXPECT_EQ( 2, data.result.toneMap.dist[85 + (255-20)*256 + 131072] );
          EXPECT_EQ( 2, data.result.toneMap.dist[170 + (255-30)*256] );
          EXPECT_EQ( 2, data.result.toneMap.dist[170 + (255-30)*256 + 65536] );
          EXPECT_EQ( 2, data.result.toneMap.dist[170 + (255-30)*256 + 131072] );
          EXPECT_EQ( 1, data.result.toneMap.dist[170 + (255-50)*256] );
          EXPECT_EQ( 1, data.result.toneMap.dist[170 + (255-50)*256 + 65536] );
          EXPECT_EQ( 1, data.result.toneMap.dist[170 + (255-50)*256 + 131072] );
          done();
        };
        taskQueue.addTask(task);
      }
    ])(done);
  });
  TEST( 'compare-worker.js calcDiff', function test(done) {
    var image1 = { width: 3, height: 2, data: [
      0,0,0,0,     85,85,85,85,     170,170,170,170,
      85,85,85,85, 170,170,170,170, 255,255,255,255
    ]};
    var image2 = { width: 3, height: 2, data: [
      0,0,0,0,     80,80,80,80,     160,160,160,160,
      80,80,80,80, 160,160,160,160, 255,255,255,255
    ]};
    var task = {
      cmd: 'calcDiff', imageData: [image1, image2],
      options: {
        ignoreAE: 0,
        imageType: 0,
        ignoreRemainder: false,
        resizeToLarger: true,
        resizeMethod: 'lanczos3',
        offsetX: 0,
        offsetY: 0,
        orientationA: null,
        orientationB: null,
      }
    };
    jsTestUtil.makeSequentialTest([
      function(done) {
        taskCallback = function(data) {
          EXPECT_EQ( 'calcDiff', data.cmd );
          EXPECT_EQ( 3, data.result.image.width );
          EXPECT_EQ( 2, data.result.image.height );
          EXPECT_EQ( 3 * 2 * 4, data.result.image.data.length );
          EXPECT_EQ( 4, data.result.summary.unmatch );
          EXPECT_EQ( 2, data.result.summary.match );
          EXPECT_EQ( 6, data.result.summary.total );
          EXPECT_EQ( 0, data.result.summary.countIgnoreAE );
          EXPECT_EQ( 256, data.result.summary.histogram.length );
          EXPECT_EQ( 2, data.result.summary.histogram[0] );
          EXPECT_EQ( 0, data.result.summary.histogram[1] );
          EXPECT_EQ( 2, data.result.summary.histogram[5] );
          EXPECT_EQ( 2, data.result.summary.histogram[10] );
          EXPECT_EQ( 0, data.result.summary.histogram[15] );
          EXPECT_EQ( 0, data.result.summary.histogram[255] );
          EXPECT_EQ( 10, data.result.summary.maxAE );
          EXPECT_EQ( task.options.ignoreAE, data.options.ignoreAE );
          EXPECT_EQ( task.options.imageType, data.options.imageType );
          EXPECT_EQ( task.options.ignoreRemainder, data.options.ignoreRemainder );
          EXPECT_EQ( task.options.resizeToLarger, data.options.resizeToLarger );
          EXPECT_EQ( task.options.resizeMethod, data.options.resizeMethod );
          EXPECT_EQ( task.options.offsetX, data.options.offsetX );
          EXPECT_EQ( task.options.offsetY, data.options.offsetY );
          EXPECT_EQ( task.options.orentationA, data.options.orentationA );
          EXPECT_EQ( task.options.orentationB, data.options.orentationB );
          done();
        };
        taskQueue.addTask(task);
      },
      function(done) {
        task.options.ignoreAE = 5;
        taskCallback = function(data) {
          EXPECT_EQ( 2, data.result.summary.unmatch );
          EXPECT_EQ( 4, data.result.summary.match );
          EXPECT_EQ( 6, data.result.summary.total );
          EXPECT_EQ( 2, data.result.summary.countIgnoreAE );
          EXPECT_EQ( 10, data.result.summary.maxAE );
          EXPECT_EQ( 2, data.result.summary.histogram[0] );
          EXPECT_EQ( 0, data.result.summary.histogram[1] );
          EXPECT_EQ( 2, data.result.summary.histogram[5] );
          EXPECT_EQ( 2, data.result.summary.histogram[10] );
          EXPECT_EQ( 0, data.result.summary.histogram[15] );
          EXPECT_EQ( 0, data.result.summary.histogram[255] );
          done();
        };
        taskQueue.addTask(task);
      },
      function(done) {
        task.options.ignoreAE = 1;
        taskCallback = function(data) {
          EXPECT_EQ( 4, data.result.summary.unmatch );
          EXPECT_EQ( 2, data.result.summary.match );
          EXPECT_EQ( 0, data.result.summary.countIgnoreAE );
          done();
        };
        taskQueue.addTask(task);
      },
      function(done) {
        task.options.ignoreAE = 4;
        taskCallback = function(data) {
          EXPECT_EQ( 4, data.result.summary.unmatch );
          EXPECT_EQ( 2, data.result.summary.match );
          EXPECT_EQ( 0, data.result.summary.countIgnoreAE );
          done();
        };
        taskQueue.addTask(task);
      },
      function(done) {
        task.options.ignoreAE = 6;
        taskCallback = function(data) {
          EXPECT_EQ( 2, data.result.summary.unmatch );
          EXPECT_EQ( 4, data.result.summary.match );
          EXPECT_EQ( 2, data.result.summary.countIgnoreAE );
          done();
        };
        taskQueue.addTask(task);
      },
      function(done) {
        task.options.ignoreAE = 10;
        taskCallback = function(data) {
          EXPECT_EQ( 0, data.result.summary.unmatch );
          EXPECT_EQ( 6, data.result.summary.match );
          EXPECT_EQ( 4, data.result.summary.countIgnoreAE );
          done();
        };
        taskQueue.addTask(task);
      },
      function(done) {
        task.options.ignoreAE = 11;
        taskCallback = function(data) {
          EXPECT_EQ( 0, data.result.summary.unmatch );
          EXPECT_EQ( 6, data.result.summary.match );
          EXPECT_EQ( 4, data.result.summary.countIgnoreAE );
          done();
        };
        taskQueue.addTask(task);
      },
      function(done) {
        task.options.imageType = 1;  // Grayscale
        task.options.ignoreAE = 0;
        taskCallback = function(data) {
          EXPECT_EQ( 'calcDiff', data.cmd );
          EXPECT_EQ( 1, data.options.imageType );
          EXPECT_EQ( 3, data.result.image.width );
          EXPECT_EQ( 2, data.result.image.height );
          EXPECT_EQ( 3 * 2 * 4, data.result.image.data.length );
          EXPECT_EQ( 0, data.result.image.data[0] );
          EXPECT_EQ( 0, data.result.image.data[1] );
          EXPECT_EQ( 0, data.result.image.data[2] );
          EXPECT_EQ( 255, data.result.image.data[3] );
          EXPECT_EQ( 5, data.result.image.data[4] );
          EXPECT_EQ( 5, data.result.image.data[5] );
          EXPECT_EQ( 5, data.result.image.data[6] );
          EXPECT_EQ( 255, data.result.image.data[7] );
          EXPECT_EQ( 10, data.result.image.data[8] );
          EXPECT_EQ( 5, data.result.image.data[12] );
          EXPECT_EQ( 10, data.result.image.data[16] );
          EXPECT_EQ( 0, data.result.image.data[20] );
          done();
        };
        taskQueue.addTask(task);
      }
    ])(done);
  });
})();
