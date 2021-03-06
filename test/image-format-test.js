﻿(function() {
  var detectImageFormat = function(content) {
    var datauri = jsTestUtil.dataURIFromArrayBuffer(content);
    var binary = compareUtil.binaryFromDataURI(datauri);
    var format = compareUtil.detectImageFormat(binary);
    return format;
  };
  var imageFormatDetectionTest = function(done, samples) {
    LOG('info', '... testing ' + samples.length + ' image files');
    var runner = jsTestUtil.makeFileBasedTestRunner();
    for (var i = 0, sample; sample = samples[i]; i++) {
      runner.readFileAndTest(sample[0], (function(sample) {
        var url = sample[0];
        var fileFormat = sample[1];
        var colorFormat = sample[2];
        return function(content, done) {
          var format = detectImageFormat(content);
          EXPECT_EQ( fileFormat, format.toString(), 'detected file format of ' + url );
          EXPECT_EQ( colorFormat, format.color, 'detected color format of ' + url );
          done();
        }
      })(sample));
    }
    runner.run(done);
  };
  var grayscalePerfectSamples = [
    [ 'data/grayscale/perfect/grayscale_idx8.bmp', 'BMP', 'Indexed RGB 8.8.8 (8bpp)' ],
    [ 'data/grayscale/perfect/grayscale_idx8.gif', 'GIF', 'Indexed RGB 8.8.8 (8bpp)' ],
    [ 'data/grayscale/perfect/grayscale_idx8.png', 'PNG', 'Indexed RGB 8.8.8 (8bpp)' ],
    [ 'data/grayscale/perfect/grayscale_idx8.tif', 'TIFF', 'Indexed RGB 16.16.16 (8bpp)' ],
    [ 'data/grayscale/perfect/grayscale_y8.jpg', 'JPEG', 'Grayscale 8 (8bpp)' ],
    [ 'data/grayscale/perfect/grayscale_y8.png', 'PNG', 'Grayscale 8 (8bpp)' ],
    [ 'data/grayscale/perfect/grayscale_y8.tif', 'TIFF', 'Grayscale 8 (8bpp)' ],
    [ 'data/grayscale/perfect/grayscale_y16.png', 'PNG', 'Grayscale 16 (16bpp)' ],
    [ 'data/grayscale/perfect/grayscale_y16.tif', 'TIFF', 'Grayscale 16 (16bpp)' ],
    [ 'data/grayscale/perfect/grayscale_ya88.png', 'PNG', 'Grayscale+Alpha 8.8 (16bpp)' ],
    [ 'data/grayscale/perfect/grayscale_ya88.tif', 'TIFF', 'Grayscale+Alpha 8.8 (16bpp)' ],
    [ 'data/grayscale/perfect/grayscale_ya88_pma.tif', 'TIFF', 'Grayscale+Alpha (pre-multiplied) 8.8 (16bpp)' ],
    [ 'data/grayscale/perfect/grayscale_rgb888.bmp', 'BMP', 'RGB 8.8.8 (24bpp)' ],
    [ 'data/grayscale/perfect/grayscale_rgb888.png', 'PNG', 'RGB 8.8.8 (24bpp)' ],
    [ 'data/grayscale/perfect/grayscale_rgb888.tif', 'TIFF', 'RGB 8.8.8 (24bpp)' ],
    [ 'data/grayscale/perfect/grayscale_rgb888.webp', 'WebP (Lossless)', 'RGB 8.8.8 (24bpp)' ],
    [ 'data/grayscale/perfect/grayscale_rgb161616.png', 'PNG', 'RGB 16.16.16 (48bpp)' ],
    [ 'data/grayscale/perfect/grayscale_rgb161616.tif', 'TIFF', 'RGB 16.16.16 (48bpp)' ],
    [ 'data/grayscale/perfect/grayscale_rgbx8888.bmp', 'BMP', 'RGB 8.8.8 (32bpp)' ],
    [ 'data/grayscale/perfect/grayscale_rgba8888.bmp', 'BMP', 'RGBA 8.8.8.8 (32bpp)' ],
    [ 'data/grayscale/perfect/grayscale_rgba8888.png', 'PNG', 'RGBA 8.8.8.8 (32bpp)' ],
    [ 'data/grayscale/perfect/grayscale_rgba8888.tif', 'TIFF', 'RGBA 8.8.8.8 (32bpp)' ],
    [ 'data/grayscale/perfect/grayscale_rgba8888_pma.tif', 'TIFF', 'RGBA (pre-multiplied) 8.8.8.8 (32bpp)' ],
    [ 'data/grayscale/perfect/grayscale_rgba16161616.png', 'PNG', 'RGBA 16.16.16.16 (64bpp)' ],
    [ 'data/grayscale/perfect/grayscale_rgba16161616.tif', 'TIFF', 'RGBA 16.16.16.16 (64bpp)' ],
    [ 'data/grayscale/perfect/grayscale_rgba16161616_pma.tif', 'TIFF', 'RGBA (pre-multiplied) 16.16.16.16 (64bpp)' ],
    [ 'data/grayscale/perfect/grayscale_ycbcr888.jpg', 'JPEG', 'YCbCr 8.8.8 (24bpp 4:4:4)' ],
    [ 'data/grayscale/perfect/grayscale_ycbcr888_440.jpg', 'JPEG', 'YCbCr 8.8.8 (16bpp 4:4:0)' ],
    [ 'data/grayscale/perfect/grayscale_ycbcr888_422.jpg', 'JPEG', 'YCbCr 8.8.8 (16bpp 4:2:2)' ],
    [ 'data/grayscale/perfect/grayscale_ycbcr888_420.jpg', 'JPEG', 'YCbCr 8.8.8 (12bpp 4:2:0)' ],
  ];
  var grayscaleReducedSamples = [
    [ 'data/grayscale/reduced/grayscale_idx1.bmp', 'BMP', 'Indexed RGB 8.8.8 (1bpp)' ],
    [ 'data/grayscale/reduced/grayscale_idx1.gif', 'GIF', 'Indexed RGB 8.8.8 (1bpp)' ],
    [ 'data/grayscale/reduced/grayscale_idx1.png', 'PNG', 'Indexed RGB 8.8.8 (1bpp)' ],
    [ 'data/grayscale/reduced/grayscale_idx1.tif', 'TIFF', 'Indexed RGB 16.16.16 (1bpp)' ],
    [ 'data/grayscale/reduced/grayscale_idx2.gif', 'GIF', 'Indexed RGB 8.8.8 (2bpp)' ],
    [ 'data/grayscale/reduced/grayscale_idx2.png', 'PNG', 'Indexed RGB 8.8.8 (2bpp)' ],
    [ 'data/grayscale/reduced/grayscale_idx2.tif', 'TIFF', 'Indexed RGB 16.16.16 (2bpp)' ],
    [ 'data/grayscale/reduced/grayscale_idx3.gif', 'GIF', 'Indexed RGB 8.8.8 (3bpp)' ],
    [ 'data/grayscale/reduced/grayscale_idx4.bmp', 'BMP', 'Indexed RGB 8.8.8 (4bpp)' ],
    [ 'data/grayscale/reduced/grayscale_idx4.gif', 'GIF', 'Indexed RGB 8.8.8 (4bpp)' ],
    [ 'data/grayscale/reduced/grayscale_idx4.png', 'PNG', 'Indexed RGB 8.8.8 (4bpp)' ],
    [ 'data/grayscale/reduced/grayscale_idx4.tif', 'TIFF', 'Indexed RGB 16.16.16 (4bpp)' ],
    [ 'data/grayscale/reduced/grayscale_idx5.gif', 'GIF', 'Indexed RGB 8.8.8 (5bpp)' ],
    [ 'data/grayscale/reduced/grayscale_idx6.gif', 'GIF', 'Indexed RGB 8.8.8 (6bpp)' ],
    [ 'data/grayscale/reduced/grayscale_idx7.gif', 'GIF', 'Indexed RGB 8.8.8 (7bpp)' ],
    [ 'data/grayscale/reduced/grayscale_y1.png', 'PNG', 'Grayscale 1 (1bpp)' ],
    [ 'data/grayscale/reduced/grayscale_y1.tif', 'TIFF', 'Grayscale 1 (1bpp)' ],
    [ 'data/grayscale/reduced/grayscale_y2.png', 'PNG', 'Grayscale 2 (2bpp)' ],
    [ 'data/grayscale/reduced/grayscale_y2.tif', 'TIFF', 'Grayscale 2 (2bpp)' ],
    [ 'data/grayscale/reduced/grayscale_y4.png', 'PNG', 'Grayscale 4 (4bpp)' ],
    [ 'data/grayscale/reduced/grayscale_y4.tif', 'TIFF', 'Grayscale 4 (4bpp)' ],
    [ 'data/grayscale/reduced/grayscale_rgb555.bmp', 'BMP', 'RGB 5.5.5 (16bpp)' ],
    [ 'data/grayscale/reduced/grayscale_rgba5551.bmp', 'BMP', 'RGBA 5.5.5.1 (16bpp)' ],
    [ 'data/grayscale/reduced/grayscale_ycbcr888.webp', 'WebP (Lossy)', 'YCbCr 8.8.8 (12bpp 4:2:0)' ],
  ];
  TEST( 'compareUtil detectImageFormat grayscale perfect', { timeout: 5000 }, function test(done) {
    imageFormatDetectionTest(done, grayscalePerfectSamples);
  });
  TEST( 'compareUtil detectImageFormat grayscale reduced', { timeout: 5000 }, function test(done) {
    imageFormatDetectionTest(done, grayscaleReducedSamples);
  });
  var fullcolorPerfectSamples = [
    [ 'data/fullcolor/perfect/fullcolor_rgb888.bmp', 'BMP', 'RGB 8.8.8 (24bpp)' ],
    [ 'data/fullcolor/perfect/fullcolor_rgb888.png', 'PNG', 'RGB 8.8.8 (24bpp)' ],
    [ 'data/fullcolor/perfect/fullcolor_rgb888.tif', 'TIFF', 'RGB 8.8.8 (24bpp)' ],
    [ 'data/fullcolor/perfect/fullcolor_rgb888.webp', 'WebP (Lossless)', 'RGB 8.8.8 (24bpp)' ],
    [ 'data/fullcolor/perfect/fullcolor_rgb161616.png', 'PNG', 'RGB 16.16.16 (48bpp)' ],
    [ 'data/fullcolor/perfect/fullcolor_rgb161616.tif', 'TIFF', 'RGB 16.16.16 (48bpp)' ],
    [ 'data/fullcolor/perfect/fullcolor_rgbx8888.bmp', 'BMP', 'RGB 8.8.8 (32bpp)' ],
    [ 'data/fullcolor/perfect/fullcolor_rgba8888.bmp', 'BMP', 'RGBA 8.8.8.8 (32bpp)' ],
    [ 'data/fullcolor/perfect/fullcolor_rgba8888.png', 'PNG', 'RGBA 8.8.8.8 (32bpp)' ],
    [ 'data/fullcolor/perfect/fullcolor_rgba8888.tif', 'TIFF', 'RGBA 8.8.8.8 (32bpp)' ],
    [ 'data/fullcolor/perfect/fullcolor_rgba8888_pma.tif', 'TIFF', 'RGBA (pre-multiplied) 8.8.8.8 (32bpp)' ],
    [ 'data/fullcolor/perfect/fullcolor_rgba16161616.png', 'PNG', 'RGBA 16.16.16.16 (64bpp)' ],
    [ 'data/fullcolor/perfect/fullcolor_rgba16161616.tif', 'TIFF', 'RGBA 16.16.16.16 (64bpp)' ],
    [ 'data/fullcolor/perfect/fullcolor_rgba16161616_pma.tif', 'TIFF', 'RGBA (pre-multiplied) 16.16.16.16 (64bpp)' ],
  ];
  var fullcolorReducedSamples = [
    [ 'data/fullcolor/reduced/fullcolor_idx1.bmp', 'BMP', 'Indexed RGB 8.8.8 (1bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx1.gif', 'GIF', 'Indexed RGB 8.8.8 (1bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx1.png', 'PNG', 'Indexed RGB 8.8.8 (1bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx1.tif', 'TIFF', 'Indexed RGB 16.16.16 (1bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx2.gif', 'GIF', 'Indexed RGB 8.8.8 (2bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx2.png', 'PNG', 'Indexed RGB 8.8.8 (2bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx2.tif', 'TIFF', 'Indexed RGB 16.16.16 (2bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx3.gif', 'GIF', 'Indexed RGB 8.8.8 (3bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx4.bmp', 'BMP', 'Indexed RGB 8.8.8 (4bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx4.gif', 'GIF', 'Indexed RGB 8.8.8 (4bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx4.png', 'PNG', 'Indexed RGB 8.8.8 (4bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx4.tif', 'TIFF', 'Indexed RGB 16.16.16 (4bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx5.gif', 'GIF', 'Indexed RGB 8.8.8 (5bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx6.gif', 'GIF', 'Indexed RGB 8.8.8 (6bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx7.gif', 'GIF', 'Indexed RGB 8.8.8 (7bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx8.bmp', 'BMP', 'Indexed RGB 8.8.8 (8bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx8.gif', 'GIF', 'Indexed RGB 8.8.8 (8bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx8.png', 'PNG', 'Indexed RGB 8.8.8 (8bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_idx8.tif', 'TIFF', 'Indexed RGB 16.16.16 (8bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_rgb555.bmp', 'BMP', 'RGB 5.5.5 (16bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_rgb565.bmp', 'BMP', 'RGB 5.6.5 (16bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_rgba5551.bmp', 'BMP', 'RGBA 5.5.5.1 (16bpp)' ],
    [ 'data/fullcolor/reduced/fullcolor_ycbcr888.jpg', 'JPEG', 'YCbCr 8.8.8 (24bpp 4:4:4)' ],
    [ 'data/fullcolor/reduced/fullcolor_ycbcr888.webp', 'WebP (Lossy)', 'YCbCr 8.8.8 (12bpp 4:2:0)' ],
  ];
  TEST( 'compareUtil detectImageFormat fullcolor perfect', { timeout: 5000 }, function test(done) {
    imageFormatDetectionTest(done, fullcolorPerfectSamples);
  });
  TEST( 'compareUtil detectImageFormat fullcolor reduced', { timeout: 5000 }, function test(done) {
    imageFormatDetectionTest(done, fullcolorReducedSamples);
  });
})();
