TEST( 'compareImageUtil makeImage', function test() {
  var image = compareImageUtil.makeImage(300, 200);
  EXPECT_EQ( 300, image.width );
  EXPECT_EQ( 200, image.height );
  EXPECT_EQ( 300, image.pitch );
  EXPECT_EQ( 240000, image.data.length );
  EXPECT_EQ( 0, image.offset );

  var image2 = compareImageUtil.makeImage(image);
  EXPECT_EQ( 300, image2.width );
  EXPECT_EQ( 200, image2.height );
  EXPECT_EQ( 300, image2.pitch );
  EXPECT( image.data === image2.data );
  EXPECT_EQ( 0, image2.offset );

  var imageData = { width: 300, height: 200, data: new Uint8Array(240000) };
  var image3 = compareImageUtil.makeImage(imageData);
  EXPECT_EQ( 300, image3.width );
  EXPECT_EQ( 200, image3.height );
  EXPECT_EQ( 300, image3.pitch );
  EXPECT( imageData.data === image3.data );
  EXPECT_EQ( 0, image3.offset );

  var imageData2 = {
    width: 200,
    height: 100,
    data: imageData.data,
    pitch: 300,
    offset: 15050
  };
  var image4 = compareImageUtil.makeImage(imageData2);
  EXPECT_EQ( 200, image4.width );
  EXPECT_EQ( 100, image4.height );
  EXPECT_EQ( 300, image4.pitch );
  EXPECT( imageData.data === image4.data );
  EXPECT_EQ( 15050, image4.offset );
});

TEST( 'compareImageUtil makeRegion', function test() {
  var image1 = compareImageUtil.makeImage(300, 200);

  var region0 = compareImageUtil.makeRegion(image1);
  EXPECT_EQ( 300, region0.width );
  EXPECT_EQ( 200, region0.height );
  EXPECT_EQ( 300, region0.pitch );
  EXPECT( image1.data === region0.data );
  EXPECT_EQ( 0, region0.offset );

  var region1 = compareImageUtil.makeRegion(image1, 30, 20);
  EXPECT_EQ( 270, region1.width );
  EXPECT_EQ( 180, region1.height );
  EXPECT_EQ( 300, region1.pitch );
  EXPECT( image1.data === region1.data );
  EXPECT_EQ( 300 * 20 + 30, region1.offset );

  var region2 = compareImageUtil.makeRegion(image1, 30, 20, 130, 120);
  EXPECT_EQ( 130, region2.width );
  EXPECT_EQ( 120, region2.height );
  EXPECT_EQ( 300, region2.pitch );
  EXPECT( image1.data === region2.data );
  EXPECT_EQ( 300 * 20 + 30, region2.offset );
});

TEST( 'compareImageUtil makeRegion empty-range', function test() {
  var image1 = compareImageUtil.makeImage(300, 200);

  var region1 = compareImageUtil.makeRegion(image1, 0, 0, 0, 0);
  EXPECT_EQ( 0, region1.width * region1.height );
  EXPECT_EQ( 300, region1.pitch );
  EXPECT( image1.data === region1.data );

  var region2 = compareImageUtil.makeRegion(image1, 50, 50, 0, 0);
  EXPECT_EQ( 0, region2.width * region2.height );
  EXPECT_EQ( 300, region2.pitch );
  EXPECT( image1.data === region2.data );

  var region3 = compareImageUtil.makeRegion(image1, 350, 250);
  EXPECT_EQ( 0, region3.width * region3.height );
  EXPECT_EQ( 300, region3.pitch );
  EXPECT( image1.data === region3.data );

  var region4 = compareImageUtil.makeRegion(image1, 350, 50);
  EXPECT_EQ( 0, region4.width * region4.height );
  EXPECT_EQ( 300, region4.pitch );
  EXPECT( image1.data === region4.data );

  var region5 = compareImageUtil.makeRegion(image1, 50, 250);
  EXPECT_EQ( 0, region5.width * region5.height );
  EXPECT_EQ( 300, region5.pitch );
  EXPECT( image1.data === region5.data );

  var region6 = compareImageUtil.makeRegion(image1, -50, 250);
  EXPECT_EQ( 0, region6.width * region6.height );
  EXPECT_EQ( 300, region6.pitch );
  EXPECT( image1.data === region6.data );

  var region7 = compareImageUtil.makeRegion(image1, 350, -50);
  EXPECT_EQ( 0, region7.width * region7.height );
  EXPECT_EQ( 300, region7.pitch );
  EXPECT( image1.data === region7.data );

  var region8 = compareImageUtil.makeRegion(image1, 350, 250, 100, 100);
  EXPECT_EQ( 0, region8.width * region8.height );
  EXPECT_EQ( 300, region8.pitch );
  EXPECT( image1.data === region8.data );

  var region9 = compareImageUtil.makeRegion(image1, -50, -50, 0, 0);
  EXPECT_EQ( 0, region9.width * region9.height );
  EXPECT_EQ( 300, region9.pitch );
  EXPECT( image1.data === region9.data );

  var region10 = compareImageUtil.makeRegion(image1, -50, -50, 10, 10);
  EXPECT_EQ( 0, region10.width * region10.height );
  EXPECT_EQ( 300, region10.pitch );
  EXPECT( image1.data === region10.data );

  var region11 = compareImageUtil.makeRegion(image1, -50, -50, 50, 50);
  EXPECT_EQ( 0, region11.width * region11.height );
  EXPECT_EQ( 300, region11.pitch );
  EXPECT( image1.data === region11.data );
});

TEST( 'compareImageUtil makeRegion too-big-range', function test() {
  var image1 = compareImageUtil.makeImage(300, 200);

  var region1 = compareImageUtil.makeRegion(image1, 0, 0, 400, 300);
  EXPECT_EQ( 300, region1.width );
  EXPECT_EQ( 200, region1.height );
  EXPECT_EQ( 300, region1.pitch );
  EXPECT_EQ( 0, region1.offset );
  EXPECT( image1.data === region1.data );

  var region2 = compareImageUtil.makeRegion(image1, -50, -50);
  EXPECT_EQ( 300, region2.width );
  EXPECT_EQ( 200, region2.height );
  EXPECT_EQ( 300, region2.pitch );
  EXPECT_EQ( 0, region2.offset );
  EXPECT( image1.data === region2.data );

  var region3 = compareImageUtil.makeRegion(image1, -50, -50, 400, 300);
  EXPECT_EQ( 300, region3.width );
  EXPECT_EQ( 200, region3.height );
  EXPECT_EQ( 300, region3.pitch );
  EXPECT_EQ( 0, region3.offset );
  EXPECT( image1.data === region3.data );

  var region4 = compareImageUtil.makeRegion(image1, -50, -50, 300, 200);
  EXPECT_EQ( 250, region4.width );
  EXPECT_EQ( 150, region4.height );
  EXPECT_EQ( 300, region4.pitch );
  EXPECT_EQ( 0, region4.offset );
  EXPECT( image1.data === region4.data );

  var region5 = compareImageUtil.makeRegion(image1, -50, -50, 100, 100);
  EXPECT_EQ( 50, region5.width );
  EXPECT_EQ( 50, region5.height );
  EXPECT_EQ( 300, region5.pitch );
  EXPECT_EQ( 0, region5.offset );
  EXPECT( image1.data === region5.data );

  var region6 = compareImageUtil.makeRegion(image1, 50, 50, 300, 200);
  EXPECT_EQ( 250, region6.width );
  EXPECT_EQ( 150, region6.height );
  EXPECT_EQ( 300, region6.pitch );
  EXPECT_EQ( 300 * 50 + 50, region6.offset );
  EXPECT( image1.data === region6.data );
});

TEST( 'compareImageUtil fill', function test() {
  var image1 = compareImageUtil.makeImage(300, 200);
  for (var i = 0; i < 240000; ++i) {
    image1.data[i] = 55;
  }

  compareImageUtil.fill(image1, 20, 40, 60, 80);

  EXPECT_EQ( 20, image1.data[0] );
  EXPECT_EQ( 40, image1.data[1] );
  EXPECT_EQ( 60, image1.data[2] );
  EXPECT_EQ( 80, image1.data[3] );
  EXPECT_EQ( 20, image1.data[299 * 4] );
  EXPECT_EQ( 40, image1.data[299 * 4 + 1] );
  EXPECT_EQ( 60, image1.data[299 * 4 + 2] );
  EXPECT_EQ( 80, image1.data[299 * 4 + 3] );
  EXPECT_EQ( 20, image1.data[300 * 4 * 199 + 299 * 4] );
  EXPECT_EQ( 40, image1.data[300 * 4 * 199 + 299 * 4 + 1] );
  EXPECT_EQ( 60, image1.data[300 * 4 * 199 + 299 * 4 + 2] );
  EXPECT_EQ( 80, image1.data[300 * 4 * 199 + 299 * 4 + 3] );

  var region1 = compareImageUtil.makeRegion(image1, 20, 10, 100, 50);
  for (var i = 0; i < 240000; ++i) {
    image1.data[i] = 55;
  }

  compareImageUtil.fill(region1, 20, 40, 60, 80);

  EXPECT_EQ( 55, image1.data[0] );
  EXPECT_EQ( 55, image1.data[1] );
  EXPECT_EQ( 55, image1.data[2] );
  EXPECT_EQ( 55, image1.data[3] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 199 + 299 * 4] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 199 + 299 * 4 + 1] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 199 + 299 * 4 + 2] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 199 + 299 * 4 + 3] );

  EXPECT_EQ( 55, image1.data[300 * 4 * 9 + 20 * 4] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 9 + 20 * 4 + 1] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 9 + 20 * 4 + 2] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 9 + 20 * 4 + 3] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 10 + 19 * 4] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 10 + 19 * 4 + 1] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 10 + 19 * 4 + 2] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 10 + 19 * 4 + 3] );
  EXPECT_EQ( 20, image1.data[300 * 4 * 10 + 20 * 4] );
  EXPECT_EQ( 40, image1.data[300 * 4 * 10 + 20 * 4 + 1] );
  EXPECT_EQ( 60, image1.data[300 * 4 * 10 + 20 * 4 + 2] );
  EXPECT_EQ( 80, image1.data[300 * 4 * 10 + 20 * 4 + 3] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 10 + 120 * 4] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 10 + 120 * 4 + 1] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 10 + 120 * 4 + 2] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 10 + 120 * 4 + 3] );

  EXPECT_EQ( 55, image1.data[300 * 4 * 59 + 19 * 4] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 59 + 19 * 4 + 1] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 59 + 19 * 4 + 2] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 59 + 19 * 4 + 3] );
  EXPECT_EQ( 20, image1.data[300 * 4 * 59 + 119 * 4] );
  EXPECT_EQ( 40, image1.data[300 * 4 * 59 + 119 * 4 + 1] );
  EXPECT_EQ( 60, image1.data[300 * 4 * 59 + 119 * 4 + 2] );
  EXPECT_EQ( 80, image1.data[300 * 4 * 59 + 119 * 4 + 3] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 59 + 120 * 4] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 59 + 120 * 4 + 1] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 59 + 120 * 4 + 2] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 59 + 120 * 4 + 3] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 60 + 119 * 4] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 60 + 119 * 4 + 1] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 60 + 119 * 4 + 2] );
  EXPECT_EQ( 55, image1.data[300 * 4 * 60 + 119 * 4 + 3] );
});

TEST( 'compareImageUtil copy', function test() {
  var imageData = { width: 4, height: 4, data: [] };
  for (var i = 0; i < 64; ++i) {
    imageData.data[i] = i;
  }
  var image1 = compareImageUtil.makeImage(imageData);
  var image2 = compareImageUtil.makeImage(2, 2);
  compareImageUtil.copy(image2, image1);
  EXPECT_EQ( 2, image2.width );
  EXPECT_EQ( 2, image2.height );
  EXPECT_EQ( 0, image2.data[0] );
  EXPECT_EQ( 1, image2.data[1] );
  EXPECT_EQ( 2, image2.data[2] );
  EXPECT_EQ( 3, image2.data[3] );
  EXPECT_EQ( 4, image2.data[4] );
  EXPECT_EQ( 5, image2.data[5] );
  EXPECT_EQ( 6, image2.data[6] );
  EXPECT_EQ( 7, image2.data[7] );
  EXPECT_EQ( 16, image2.data[8] );
  EXPECT_EQ( 17, image2.data[9] );
  EXPECT_EQ( 18, image2.data[10] );
  EXPECT_EQ( 19, image2.data[11] );
  EXPECT_EQ( 20, image2.data[12] );
  EXPECT_EQ( 21, image2.data[13] );
  EXPECT_EQ( 22, image2.data[14] );
  EXPECT_EQ( 23, image2.data[15] );
});

TEST( 'compareImageUtil convertToGrayscale', function test() {
  var checkGrayscaleResult = function(name, result, expected) {
    for (var i = 0; i < 16; ++i) {
      var label = (i + 1) + 'th pixel of ' + name;
      EXPECT_EQ( expected[i * 2], result.data[i * 4 + 0], label );
      EXPECT_EQ( expected[i * 2], result.data[i * 4 + 1], label );
      EXPECT_EQ( expected[i * 2], result.data[i * 4 + 2], label );
      EXPECT_EQ( expected[i * 2 + 1], result.data[i * 4 + 3], label + ' (alpha)' );
    }
  };
  var imageData = { width: 4, height: 4, data: [
    0, 0, 0, 255,     85, 85, 85, 255,  170, 170, 170, 255, 255, 255, 255, 255,
    255, 0, 0, 255,   0, 255, 0, 255,   0, 0, 255, 255,     128, 128, 128, 255,
    0, 255, 255, 255, 255, 0, 255, 255, 255, 255, 0, 255,   255, 255, 255, 255,
    80, 80, 80, 0,    80, 80, 80, 85,   80, 80, 80, 170,    80, 80, 80, 255
  ] };
  var image1 = compareImageUtil.makeImage(imageData);
  var result1 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.fill(result1, 0, 0, 0, 0);
  compareImageUtil.convertToGrayscale(result1, image1);
  checkGrayscaleResult('result1', result1, [
    0, 255,     85, 255,    170, 255,   255, 255,
    76, 255,    150, 255,   29, 255,    128, 255,
    179, 255,   105, 255,   226, 255,   255, 255,
    80, 0,      80, 85,     80, 170,    80, 255
  ]);
});

TEST( 'compareImageUtil resizeNN', function test() {
  var image1 = compareImageUtil.makeImage(2, 2);
  var image2 = compareImageUtil.makeImage(4, 4);

  compareImageUtil.fill(image1, 10, 20, 30, 40);
  compareImageUtil.fill(image2, 0, 0, 0, 0);
  compareImageUtil.resizeNN(image2, image1);
  EXPECT_EQ( 10, image2.data[0] );
  EXPECT_EQ( 20, image2.data[1] );
  EXPECT_EQ( 30, image2.data[2] );
  EXPECT_EQ( 40, image2.data[3] );
  EXPECT_EQ( 10, image2.data[20] );
  EXPECT_EQ( 20, image2.data[21] );
  EXPECT_EQ( 30, image2.data[22] );
  EXPECT_EQ( 40, image2.data[23] );
  EXPECT_EQ( 10, image2.data[36] );
  EXPECT_EQ( 20, image2.data[37] );
  EXPECT_EQ( 30, image2.data[38] );
  EXPECT_EQ( 40, image2.data[39] );
  EXPECT_EQ( 10, image2.data[60] );
  EXPECT_EQ( 20, image2.data[61] );
  EXPECT_EQ( 30, image2.data[62] );
  EXPECT_EQ( 40, image2.data[63] );

  image1.data[0] = 255;
  image1.data[1] = 255;
  image1.data[2] = 255;
  image1.data[3] = 255;
  compareImageUtil.fill(image2, 0, 0, 0, 0);
  compareImageUtil.resizeNN(image2, image1);
  EXPECT_EQ( 255, image2.data[0] );
  EXPECT_EQ( 255, image2.data[1] );
  EXPECT_EQ( 255, image2.data[2] );
  EXPECT_EQ( 255, image2.data[3] );
  EXPECT_EQ( 255, image2.data[20] );
  EXPECT_EQ( 255, image2.data[21] );
  EXPECT_EQ( 255, image2.data[22] );
  EXPECT_EQ( 255, image2.data[23] );
  EXPECT_EQ( 10, image2.data[24] );
  EXPECT_EQ( 20, image2.data[25] );
  EXPECT_EQ( 30, image2.data[26] );
  EXPECT_EQ( 40, image2.data[27] );
  EXPECT_EQ( 10, image2.data[36] );
  EXPECT_EQ( 20, image2.data[37] );
  EXPECT_EQ( 30, image2.data[38] );
  EXPECT_EQ( 40, image2.data[39] );
  EXPECT_EQ( 10, image2.data[40] );
  EXPECT_EQ( 20, image2.data[41] );
  EXPECT_EQ( 30, image2.data[42] );
  EXPECT_EQ( 40, image2.data[43] );
  EXPECT_EQ( 10, image2.data[60] );
  EXPECT_EQ( 20, image2.data[61] );
  EXPECT_EQ( 30, image2.data[62] );
  EXPECT_EQ( 40, image2.data[63] );
});

TEST( 'compareImageUtil resizeBilinear', function test() {
  var image1 = compareImageUtil.makeImage(2, 2);
  var image2 = compareImageUtil.makeImage(4, 4);

  compareImageUtil.fill(image1, 10, 20, 30, 40);
  compareImageUtil.fill(image2, 0, 0, 0, 0);
  compareImageUtil.resizeBilinear(image2, image1);
  EXPECT_EQ( 10, image2.data[0] );
  EXPECT_EQ( 20, image2.data[1] );
  EXPECT_EQ( 30, image2.data[2] );
  EXPECT_EQ( 40, image2.data[3] );
  EXPECT_EQ( 10, image2.data[20] );
  EXPECT_EQ( 20, image2.data[21] );
  EXPECT_EQ( 30, image2.data[22] );
  EXPECT_EQ( 40, image2.data[23] );
  EXPECT_EQ( 10, image2.data[36] );
  EXPECT_EQ( 20, image2.data[37] );
  EXPECT_EQ( 30, image2.data[38] );
  EXPECT_EQ( 40, image2.data[39] );
  EXPECT_EQ( 10, image2.data[60] );
  EXPECT_EQ( 20, image2.data[61] );
  EXPECT_EQ( 30, image2.data[62] );
  EXPECT_EQ( 40, image2.data[63] );

  image1.data[0] = 255;
  image1.data[1] = 255;
  image1.data[2] = 255;
  image1.data[3] = 255;
  compareImageUtil.fill(image2, 0, 0, 0, 0);
  compareImageUtil.resizeBilinear(image2, image1);
  EXPECT_EQ( 255, image2.data[0] );
  EXPECT_EQ( 255, image2.data[1] );
  EXPECT_EQ( 255, image2.data[2] );
  EXPECT_EQ( 255, image2.data[3] );
  EXPECT_EQ( 148, image2.data[20] );
  EXPECT_EQ( 152, image2.data[21] );
  EXPECT_EQ( 157, image2.data[22] );
  EXPECT_EQ( 161, image2.data[23] );
  EXPECT_EQ( 56, image2.data[24] );
  EXPECT_EQ( 64, image2.data[25] );
  EXPECT_EQ( 72, image2.data[26] );
  EXPECT_EQ( 80, image2.data[27] );
  EXPECT_EQ( 56, image2.data[36] );
  EXPECT_EQ( 64, image2.data[37] );
  EXPECT_EQ( 72, image2.data[38] );
  EXPECT_EQ( 80, image2.data[39] );
  EXPECT_EQ( 25, image2.data[40] );
  EXPECT_EQ( 35, image2.data[41] );
  EXPECT_EQ( 44, image2.data[42] );
  EXPECT_EQ( 53, image2.data[43] );
  EXPECT_EQ( 10, image2.data[60] );
  EXPECT_EQ( 20, image2.data[61] );
  EXPECT_EQ( 30, image2.data[62] );
  EXPECT_EQ( 40, image2.data[63] );
});

TEST( 'compareImageUtil convolution, sobelX, sobelY', function test() {
  var makeImageForConvolutionTest = function(bitmap) {
    var image = compareImageUtil.makeImage(4, 4);
    for (var i = 0; i < 16; ++i) {
      image.data[i * 4 + 0] = bitmap[i];
      image.data[i * 4 + 1] = bitmap[i];
      image.data[i * 4 + 2] = bitmap[i];
      image.data[i * 4 + 3] = 255;
    }
    return image;
  };
  var checkConvolutionResult = function(name, result, expected) {
    for (var i = 0; i < 16; ++i) {
      var label = (i + 1) + 'th pixel of ' + name;
      EXPECT_EQ( 128 + expected[i], result.data[i * 4 + 0], label );
      EXPECT_EQ( 128 + expected[i], result.data[i * 4 + 1], label );
      EXPECT_EQ( 128 + expected[i], result.data[i * 4 + 2], label );
    }
  };

  var image1 = makeImageForConvolutionTest([
      0,   0,   0,   0,
      0, 100, 100,   0,
      0,  50,   0,   0,
      0,   0,   0,  50
  ]);

  var result1 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.convolution(result1, image1, { w: 3, h: 1 }, [
    1, 0, -1
  ]);
  checkConvolutionResult('result1 (horizontal kernel)', result1, [
      0,   0,    0,    0,
    100, 100, -100, -100,
     50,   0,  -50,    0,
      0,   0,   50,   50
  ]);

  var result2 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.convolution(result2, image1, { w: 1, h: 3 }, [
    0.20,
    0.60,
    0.20
  ]);
  checkConvolutionResult('result2 (vertical kernel)', result2, [
    0,  20, 20,  0,
    0,  70, 60,  0,
    0,  50, 20, 10,
    0,  10,  0, 40
  ]);

  var result3 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.convolution(result3, image1, { w: 3, h: 3 }, [
    0.0, 0.1, 0.0,
    0.1, 0.6, 0.1,
    0.0, 0.1, 0.0
  ]);
  checkConvolutionResult('result3 (3x3 kernel)', result3, [
     0,  10, 10,  0,
    10,  75, 70, 10,
     5,  40, 15,  5,
     0,   5,  5, 40
  ]);

  var image2 = makeImageForConvolutionTest([
      0,   0,   0,   0,
      0,  10,   0,   0,
      0,   0,   0,   0,
      0,   0,   0,   0
  ]);

  var result4 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.convolution(result4, image2, { w: 3, h: 3 }, [
    1, 2, 3,
    4, 5, 6,
    7, 8, 9
  ]);
  checkConvolutionResult('result4 (3x3 kernel)', result4, [
     10, 20, 30, 0,
     40, 50, 60, 0,
     70, 80, 90, 0,
      0,  0,  0, 0
  ]);

  var result5 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.convolution(result5, image2, { w: 5, h: 5 }, [
    1,  2,  3,  4,  5,
    2,  3,  4,  5,  6,
    3,  4,  5,  6,  7,
    4,  5,  6,  7,  8,
    5,  6,  7,  8,  9
  ]);
  checkConvolutionResult('result5 (5x5 kernel)', result5, [
     30, 40, 50, 60,
     40, 50, 60, 70,
     50, 60, 70, 80,
     60, 70, 80, 90
  ]);

  var result6 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.sobelX(result6, image2);
  checkConvolutionResult('result6 (sobelX)', result6, [
     10,   0,  -10,   0,
     20,   0,  -20,   0,
     10,   0,  -10,   0,
      0,   0,    0,   0
  ]);
  var result7 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.sobelY(result7, image2);
  checkConvolutionResult('result7 (sobelY)', result7, [
     10,  20,   10,   0,
      0,   0,    0,   0,
    -10, -20,  -10,   0,
      0,   0,    0,   0
  ]);
});

TEST( 'compareImageUtil cornerValue', function test() {
  var sum = function(image, l, t, w, h) {
    image = compareImageUtil.makeRegion(image, l, t, w, h);
    var r = 0, g = 0, b = 0, a = 0;
    for (y = 0; y < image.height; y++) {
      var i = (image.offset + image.pitch * y) * 4;
      for (x = 0; x < image.width; x++, i += 4) {
        r += image.data[i];
        g += image.data[i + 1];
        b += image.data[i + 2];
        a += image.data[i + 3];
      }
    }
    return [ r, g, b, a ];
  };

  var image1 = compareImageUtil.makeImage(50, 50);
  compareImageUtil.fill(image1, 0, 0, 0, 255);
  var region1 = compareImageUtil.makeRegion(image1, 20, 20, 20, 10);
  compareImageUtil.fill(region1, 255, 255, 255, 255);

  var result1 = compareImageUtil.cornerValue(image1);
  EXPECT_EQ( 0, sum(result1, 0, 0, 18, 50)[0] );
  EXPECT_EQ( 0, sum(result1, 22, 0, 16, 50)[0] );
  EXPECT_EQ( 0, sum(result1, 42, 0, 8, 50)[0] );
  EXPECT_EQ( 0, sum(result1, 0, 0, 50, 18)[0] );
  EXPECT_EQ( 0, sum(result1, 0, 22, 50, 6)[0] );
  EXPECT_EQ( 0, sum(result1, 0, 32, 50, 18)[0] );
  EXPECT( 0 < sum(result1, 18, 18, 4, 4)[0] );
  EXPECT( 0 < sum(result1, 38, 18, 4, 4)[0] );
  EXPECT( 0 < sum(result1, 18, 28, 4, 4)[0] );
  EXPECT( 0 < sum(result1, 38, 28, 4, 4)[0] );
});

TEST( 'compareImageUtil getUniqueColors', function test() {
  var imageData = { width: 4, height: 4, data: [
    0, 0, 0, 255,     85, 85, 85, 255,  170, 170, 170, 255, 255, 255, 255, 255,
    255, 0, 0, 255,   0, 255, 0, 255,   0, 0, 255, 255,     128, 128, 128, 255,
    0, 255, 255, 255, 255, 0, 255, 255, 255, 255, 0, 255,   255, 255, 255, 255,
    0, 0, 0, 255,     0, 0, 0, 255,     0, 0, 0, 255,       0, 0, 0, 255
  ] };
  var uniqueColors = compareImageUtil.getUniqueColors(imageData);
  EXPECT_EQ( 11, uniqueColors.colors.length );
  EXPECT_EQ( 5, uniqueColors.counts[uniqueColors.colors.indexOf(0x000000)] );
  EXPECT_EQ( 2, uniqueColors.counts[uniqueColors.colors.indexOf(0xffffff)] );
  EXPECT_EQ( 1, uniqueColors.counts[uniqueColors.colors.indexOf(0x555555)] );
  EXPECT_EQ( 1, uniqueColors.counts[uniqueColors.colors.indexOf(0xaaaaaa)] );
  EXPECT_EQ( 1, uniqueColors.counts[uniqueColors.colors.indexOf(0xff0000)] );
  EXPECT_EQ( 1, uniqueColors.counts[uniqueColors.colors.indexOf(0x00ff00)] );
  EXPECT_EQ( 1, uniqueColors.counts[uniqueColors.colors.indexOf(0x0000ff)] );
  EXPECT_EQ( 1, uniqueColors.counts[uniqueColors.colors.indexOf(0x808080)] );
  EXPECT( 0 > uniqueColors.colors.indexOf(0x010101) );
  EXPECT( 0 > uniqueColors.colors.indexOf(0x101010) );
  EXPECT_EQ( 16, uniqueColors.totalCount );
});
