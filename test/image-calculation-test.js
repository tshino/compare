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
    ])(done);
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
          imageData: [colorImage1, colorImage1]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT_EQ( Infinity, data.result.psnr );
          EXPECT_EQ( 0, data.result.mse );
          EXPECT_EQ( 1, data.result.ncc );
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
          imageData: [colorImage1, colorImage2]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT( 1e-14 > Math.abs(10 * Math.log10((3*255*255) / (30*30)) - data.result.psnr) );
          EXPECT_EQ( (30*30)/3, data.result.mse );
          //EXPECT_EQ( ????, data.result.ncc ); // non-trivial answer
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
          imageData: [redImage, greenImage]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT( 1e-14 > Math.abs(10 * Math.log10(1.5) - data.result.psnr) );
          EXPECT_EQ( 255 * 255 * 2 / 3, data.result.mse );
          EXPECT_EQ( -0.5, data.result.ncc );
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
          imageData: [blackImage, blackImage]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT_EQ( Infinity, data.result.psnr );
          EXPECT_EQ( 0, data.result.mse );
          EXPECT_EQ( 0, data.result.ncc );
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
          imageData: [transparent, transparent]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT_EQ( Infinity, data.result.psnr );
          EXPECT_EQ( 0, data.result.mse );
          EXPECT_EQ( 0, data.result.ncc );
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
          imageData: [blackImage, whiteImage]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT_EQ( 0, data.result.psnr );
          EXPECT_EQ( 255 * 255, data.result.mse );
          EXPECT_EQ( 0, data.result.ncc );
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
          imageData: [blackImage, redImage]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT( 1e-14 > Math.abs(10 * Math.log10(3) - data.result.psnr) );
          EXPECT_EQ( 255 * 255 / 3, data.result.mse );
          EXPECT_EQ( 0, data.result.ncc );
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
          imageData: [blackImage, transparent]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          EXPECT_EQ( Infinity, data.result.psnr );
          EXPECT_EQ( 0, data.result.mse );
          EXPECT_EQ( 0, data.result.ncc );
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
          imageData: [blackImage, colorImage1]
        };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcMetrics', data.cmd );
          //EXPECT_EQ( ???, data.result.psnr );
          //EXPECT_EQ( ???, data.result.mse );
          EXPECT_EQ( 0, data.result.ncc );
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
          EXPECT( isNaN(data.result.mse) );
          EXPECT( isNaN(data.result.ncc) );
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
          EXPECT( isNaN(data.result.mse) );
          EXPECT( isNaN(data.result.ncc) );
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
          EXPECT( isNaN(data.result.mse) );
          EXPECT( isNaN(data.result.ncc) );
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
          EXPECT_EQ( 0, data.result.mse );
          EXPECT_EQ( 1, data.result.ncc );
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
        var task = { cmd: 'calcToneCurve', type: 0, imageData: [image1, image2] };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcToneCurve', data.cmd );
          EXPECT_EQ( 0, data.type );
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
        var task = { cmd: 'calcToneCurve', type: 0, imageData: [image1, image3], options };
        taskCallback = function(data) {
          EXPECT_EQ( 'calcToneCurve', data.cmd );
          EXPECT_EQ( 0, data.type );
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
})();
