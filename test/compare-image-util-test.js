﻿TEST( 'compareImageUtil makeImage', function test() {
  var image0x0 = compareImageUtil.makeImage(0, 0);
  EXPECT_EQ( 0, image0x0.width );
  EXPECT_EQ( 0, image0x0.height );
  EXPECT_EQ( 0, image0x0.pitch );
  EXPECT_EQ( 0, image0x0.data.length );
  EXPECT_EQ( 0, image0x0.offset );

  var image1x1 = compareImageUtil.makeImage(1, 1);
  EXPECT_EQ( 1, image1x1.width );
  EXPECT_EQ( 1, image1x1.height );
  EXPECT_EQ( 1, image1x1.pitch );
  EXPECT_EQ( 4, image1x1.data.length );
  EXPECT_EQ( 0, image1x1.offset );

  var image1 = compareImageUtil.makeImage(300, 200);
  EXPECT_EQ( 300, image1.width );
  EXPECT_EQ( 200, image1.height );
  EXPECT_EQ( 300, image1.pitch );
  EXPECT_EQ( 240000, image1.data.length );
  EXPECT_EQ( 0, image1.offset );

  var image2 = compareImageUtil.makeImage(image1);
  EXPECT_EQ( 300, image2.width );
  EXPECT_EQ( 200, image2.height );
  EXPECT_EQ( 300, image2.pitch );
  EXPECT( image1.data === image2.data );
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

  var imageData = { width: 300, height: 200, data: new Uint8Array(240000) };
  var region3 = compareImageUtil.makeRegion(imageData, 10, 20, 30, 40);
  EXPECT_EQ( 30, region3.width );
  EXPECT_EQ( 40, region3.height );
  EXPECT_EQ( 300, region3.pitch );
  EXPECT( imageData.data === region3.data );
  EXPECT_EQ( 300 * 20 + 10, region3.offset );

  var image0x0 = compareImageUtil.makeImage(0, 0);

  var region0x0 = compareImageUtil.makeRegion(image0x0);
  EXPECT_EQ( 0, region0x0.width );
  EXPECT_EQ( 0, region0x0.height );
  EXPECT_EQ( 0, region0x0.pitch );
  EXPECT_EQ( 0, region0x0.data.length );
  EXPECT_EQ( 0, region0x0.offset );

  var region0x0_2 = compareImageUtil.makeRegion(image0x0, 10, 10, 10, 10);
  EXPECT_EQ( 0, region0x0_2.width );
  EXPECT_EQ( 0, region0x0_2.height );
  EXPECT_EQ( 0, region0x0_2.pitch );
  EXPECT_EQ( 0, region0x0_2.data.length );
  EXPECT_EQ( 0, region0x0_2.offset );
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

  var region12 = compareImageUtil.makeRegion(image1, 0, 0, -50, -50);
  EXPECT_EQ( 0, region12.width * region12.height );
  EXPECT_EQ( 300, region12.pitch );
  EXPECT( image1.data === region12.data );

  var region13 = compareImageUtil.makeRegion(image1, 50, 50, -50, -50);
  EXPECT_EQ( 0, region13.width * region13.height );
  EXPECT_EQ( 300, region13.pitch );
  EXPECT( image1.data === region13.data );
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

  for (var i = 0; i < 240000; ++i) {
    image1.data[i] = 55;
  }
  var region2 = compareImageUtil.makeRegion(image1, 0, 0, 0, 0);
  compareImageUtil.fill(region2, 10, 10, 10, 10);
  var region3 = compareImageUtil.makeRegion(image1, 1, 0, 0, 0);
  compareImageUtil.fill(region3, 20, 20, 20, 20);
  var region4 = compareImageUtil.makeRegion(image1, -1, 0, 1, 1);
  compareImageUtil.fill(region4, 30, 30, 30, 30);
  var region5 = compareImageUtil.makeRegion(image1, 0, -1, 1, 1);
  compareImageUtil.fill(region5, 40, 40, 40, 40);
  var region6 = compareImageUtil.makeRegion(image1, 0, 0, 1, 0);
  compareImageUtil.fill(region6, 50, 50, 50, 50);
  var region7 = compareImageUtil.makeRegion(image1, 0, 0, 0, 1);
  compareImageUtil.fill(region7, 60, 60, 60, 60);

  EXPECT_EQ( 55, image1.data[0] );
  EXPECT_EQ( 55, image1.data[1] );
  EXPECT_EQ( 55, image1.data[2] );
  EXPECT_EQ( 55, image1.data[3] );
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
  jsTestUtil.expectEqualArray( [
    0, 1, 2, 3,  4, 5, 6, 7,
    16, 17, 18, 19,  20, 21, 22, 23
  ], image2.data );
});

TEST( 'compareImageUtil readSubPixel', function test() {
  var checkFloatResult = function(name, result, expected) {
    EXPECT_EQ( 4, result.width, name );
    EXPECT_EQ( 4, result.height, name );
    EXPECT_EQ( 16, result.data.length, name );
    for (var i = 0; i < 16; ++i) {
      var label = (i + 1) + 'th pixel of ' + name;
      EXPECT( 1e-5 > Math.abs(expected[i] - result.data[i]), label );
    }
  };
  var image1 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.fill(image1, 55, 55, 55, 255);
  var expected1 = [
    55, 55, 55, 55,  55, 55, 55, 55,  55, 55, 55, 55,  55, 55, 55, 55
  ];

  var result1 = compareImageUtil.readSubPixel(image1, 0, 0, 4, 4);
  checkFloatResult('result1', result1, expected1);
  var result2 = compareImageUtil.readSubPixel(image1, 0.3, 0.3, 4, 4);
  checkFloatResult('result2', result2, expected1);
  var result3 = compareImageUtil.readSubPixel(image1, -1.7, -1.5, 4, 4);
  checkFloatResult('result3', result3, expected1);

  image1.data[0] = 11;
  image1.data[4] = 11;
  image1.data[16] = 11;
  var result4 = compareImageUtil.readSubPixel(image1, 0, 0, 4, 4);
  checkFloatResult('result4', result4, [
    11, 11, 55, 55,  11, 55, 55, 55,  55, 55, 55, 55,  55, 55, 55, 55
  ]);
  var result5 = compareImageUtil.readSubPixel(image1, 0.5, 0.5, 4, 4);
  checkFloatResult('result5', result5, [
    22, 44, 55, 55,  44, 55, 55, 55,  55, 55, 55, 55,  55, 55, 55, 55
  ]);
  var result6 = compareImageUtil.readSubPixel(image1, -0.5, -0.5, 4, 4);
  checkFloatResult('result6', result6, [
    11, 11, 33, 55,  11, 22, 44, 55,  33, 44, 55, 55,  55, 55, 55, 55
  ]);
  var result7 = compareImageUtil.readSubPixel(image1, 0.1, 0, 4, 4);
  checkFloatResult('result7', result7, [
    11, 15.4, 55, 55,  15.4, 55, 55, 55,  55, 55, 55, 55,  55, 55, 55, 55
  ]);
  var result8 = compareImageUtil.readSubPixel(image1, 0, 0.2, 4, 4);
  checkFloatResult('result8', result8, [
    11, 19.8, 55, 55,  19.8, 55, 55, 55,  55, 55, 55, 55,  55, 55, 55, 55
  ]);
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
  jsTestUtil.expectEqualArray( [
    10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,
    10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,
    10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,
    10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40
  ], image2.data );

  image1.data[0] = 255;
  image1.data[1] = 255;
  image1.data[2] = 255;
  image1.data[3] = 255;
  compareImageUtil.fill(image2, 0, 0, 0, 0);
  compareImageUtil.resizeNN(image2, image1);
  jsTestUtil.expectEqualArray( [
    255, 255, 255, 255,  255, 255, 255, 255,  10, 20, 30, 40,  10, 20, 30, 40,
    255, 255, 255, 255,  255, 255, 255, 255,  10, 20, 30, 40,  10, 20, 30, 40,
    10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,
    10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40
  ], image2.data );
});

TEST( 'compareImageUtil resizeBilinear', function test() {
  var image1 = compareImageUtil.makeImage(2, 2);
  var image2 = compareImageUtil.makeImage(4, 4);

  compareImageUtil.fill(image1, 10, 20, 30, 40);
  compareImageUtil.fill(image2, 0, 0, 0, 0);
  compareImageUtil.resizeBilinear(image2, image1);
  jsTestUtil.expectEqualArray( [
    10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,
    10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,
    10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,
    10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40
  ], image2.data );

  image1.data[0] = 255;
  image1.data[1] = 255;
  image1.data[2] = 255;
  image1.data[3] = 255;
  compareImageUtil.fill(image2, 0, 0, 0, 0);
  compareImageUtil.resizeBilinear(image2, image1);
  jsTestUtil.expectEqualArray( [
    255, 255, 255, 255,  194, 196, 199, 201,  71, 79, 86, 94,  10, 20, 30, 40,
    194, 196, 199, 201,  148, 152, 157, 161,  56, 64, 72, 80,  10, 20, 30, 40,
    71, 79, 86, 94,  56, 64, 72, 80,  25, 35, 44, 53,  10, 20, 30, 40,
    10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40,  10, 20, 30, 40
  ], image2.data );
});

TEST( 'compareImageUtil convolution, sobelX, sobelY, scharrX, scharrY', function test() {
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
  var result8 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.scharrX(result8, image2);
  checkConvolutionResult('result8 (scharrX)', result8, [
     30,  0,  -30,  0,
    100,  0, -100,  0,
     30,  0,  -30,  0,
      0,  0,    0,  0
  ]);
  var result9 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.scharrY(result9, image2);
  checkConvolutionResult('result9 (scharrY)', result9, [
     30,  100,  30,   0,
      0,    0,   0,   0,
    -30, -100, -30,   0,
      0,    0,   0,   0
  ]);
});

TEST( 'compareImageUtil dilate3x1, dilate1x3, dilate3x3', function test() {
  var checkResult = function(name, result, expected) {
    EXPECT_EQ( expected.data.length, result.data.length, 'data.length of ' + name );
    EXPECT_EQ( expected.width, result.width, 'width of ' + name );
    EXPECT_EQ( expected.height, result.height, 'height of ' + name );
    for (i = 0; i < expected.data.length; ++i) {
      var label = ((i >> 2) + 1) + 'th pixel of ' + name;
      EXPECT_EQ( expected.data[i], result.data[i], label );
    }
  };

  var image1 = compareImageUtil.makeImage(4, 4);
  var d1 = image1.data;
  d1[20] = 255; d1[21] = 128; d1[22] = 64;  d1[23] = 42;
  d1[24] = 30;  d1[25] = 60;  d1[26] = 80;  d1[27] = 90;
  d1[44] = 10;  d1[45] = 20;  d1[46] = 30;  d1[47] = 40;

  var result3x1 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.dilate3x1(result3x1, image1);
  var expected3x1 = { width: 4, height: 4, data: [
    0, 0, 0, 0,       0, 0, 0, 0,         0, 0, 0, 0,       0, 0, 0, 0,
    255, 128, 64, 42, 255, 128, 80, 90,   255, 128, 80, 90, 30, 60, 80, 90,
    0, 0, 0, 0,       0, 0, 0, 0,         10, 20, 30, 40,   10, 20, 30, 40,
    0, 0, 0, 0,       0, 0, 0, 0,         0, 0, 0, 0,       0, 0, 0, 0
  ] };
  checkResult('result3x1', result3x1, expected3x1);

  d1[48] = 50;  d1[49] = 75;  d1[50] = 85;  d1[51] = 80;

  var result1x3 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.dilate1x3(result1x3, image1);
  var expected1x3 = { width: 4, height: 4, data: [
    0, 0, 0, 0,     255, 128, 64, 42,   30, 60, 80, 90,   0, 0, 0, 0,
    0, 0, 0, 0,     255, 128, 64, 42,   30, 60, 80, 90,   10, 20, 30, 40,
    50, 75, 85, 80, 255, 128, 64, 42,   30, 60, 80, 90,   10, 20, 30, 40,
    50, 75, 85, 80, 0, 0, 0, 0,         0, 0, 0, 0,       10, 20, 30, 40
  ] };
  checkResult('result1x3', result1x3, expected1x3);

  var result3x3 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.dilate3x3(result3x3, image1);
  var expected3x3 = { width: 4, height: 4, data: [
    255, 128, 64, 42, 255, 128, 80, 90, 255, 128, 80, 90,   30, 60, 80, 90,
    255, 128, 64, 42, 255, 128, 80, 90, 255, 128, 80, 90,   30, 60, 80, 90,
    255, 128, 85, 80, 255, 128, 85, 90, 255, 128, 80, 90,   30, 60, 80, 90,
    50, 75, 85, 80,   50, 75, 85, 80,   10, 20, 30, 40,     10, 20, 30, 40
  ] };
  checkResult('result3x3', result3x3, expected3x3);
});

TEST( 'compareImageUtil cornerValue, findCornerPoints, adjustCornerPointsSubPixel', function test() {
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
  var region1 = compareImageUtil.makeRegion(image1, 20, 20, 20, 16);
  compareImageUtil.fill(region1, 255, 255, 255, 255);

  var result1 = compareImageUtil.cornerValue(image1);
  EXPECT_EQ( 0, sum(result1, 0, 0, 18, 50)[0] );
  EXPECT_EQ( 0, sum(result1, 22, 0, 16, 50)[0] );
  EXPECT_EQ( 0, sum(result1, 42, 0, 8, 50)[0] );
  EXPECT_EQ( 0, sum(result1, 0, 0, 50, 18)[0] );
  EXPECT_EQ( 0, sum(result1, 0, 22, 50, 12)[0] );
  EXPECT_EQ( 0, sum(result1, 0, 38, 50, 12)[0] );
  EXPECT( 0 < sum(result1, 18, 18, 4, 4)[0] );
  EXPECT( 0 < sum(result1, 38, 18, 4, 4)[0] );
  EXPECT( 0 < sum(result1, 18, 34, 4, 4)[0] );
  EXPECT( 0 < sum(result1, 38, 34, 4, 4)[0] );

  var distance = function(p1, p2) {
    if (!p1 || !p2) {
      return undefined;
    }
    return Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));
  };

  var corners = compareImageUtil.findCornerPoints(image1);
  EXPECT_EQ( 4, corners.length );
  var expected = [
    { x: 19.5, y: 19.5 },
    { x: 39.5, y: 19.5 },
    { x: 19.5, y: 35.5 },
    { x: 39.5, y: 35.5 }
  ];
  for (var i = 0; i < expected.length; ++i) {
    for (var j = 0; j < corners.length; ++j) {
      if (2 >= distance(corners[j], expected[j])) {
        break;
      }
    }
    EXPECT( j < corners.length );
  }

  compareImageUtil.adjustCornerPointsSubPixel(image1, corners);
  for (var i = 0; i < expected.length; ++i) {
    for (var j = 0; j < corners.length; ++j) {
      if (0.1 >= distance(corners[j], expected[j])) {
        break;
      }
    }
    EXPECT( j < corners.length );
  }
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