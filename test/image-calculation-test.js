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
  TEST( 'compare-worker.js calcMetrics', function test(done) {
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
          done();
        };
        taskQueue.addTask(task);
      },
    ])(done);
  });
})();
