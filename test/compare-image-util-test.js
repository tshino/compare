TEST( 'compareImageUtil channelsOf', function test() {
  var channelsOf = compareImageUtil.channelsOf;
  EXPECT_EQ( 4, channelsOf(compareImageUtil.FORMAT_U8x4) );
  EXPECT_EQ( 1, channelsOf(compareImageUtil.FORMAT_F32x1) );
  EXPECT_EQ( 4, channelsOf() );
  EXPECT_EQ( 4, channelsOf(null) );
});

TEST( 'compareImageUtil newArrayOf', function test() {
  var newArrayOf = compareImageUtil.newArrayOf;
  var u8_0 = newArrayOf(compareImageUtil.FORMAT_U8x4, 0);
  EXPECT_EQ( 0, u8_0.length );
  var u8_1 = newArrayOf(compareImageUtil.FORMAT_U8x4, 1);
  EXPECT_EQ( 1, u8_1.length );
  EXPECT_EQ( 'number', typeof u8_1[0] );
  var u8_100 = newArrayOf(compareImageUtil.FORMAT_U8x4, 100);
  EXPECT_EQ( 100, u8_100.length );
  EXPECT_EQ( 'number', typeof u8_100[0] );
  var f8_0 = newArrayOf(compareImageUtil.FORMAT_F32x1, 0);
  EXPECT_EQ( 0, f8_0.length );
  var f8_1 = newArrayOf(compareImageUtil.FORMAT_F32x1, 1);
  EXPECT_EQ( 1, f8_1.length );
  EXPECT_EQ( 'number', typeof f8_1[0] );
  var f8_100 = newArrayOf(compareImageUtil.FORMAT_F32x1, 100);
  EXPECT_EQ( 100, f8_100.length );
  EXPECT_EQ( 'number', typeof f8_100[0] );
});

TEST( 'compareImageUtil makeImage', function test() {
  var image0x0 = compareImageUtil.makeImage(0, 0);
  EXPECT_EQ( 0, image0x0.width );
  EXPECT_EQ( 0, image0x0.height );
  EXPECT_EQ( 0, image0x0.pitch );
  EXPECT_EQ( 0, image0x0.data.length );
  EXPECT_EQ( 0, image0x0.offset );
  EXPECT_EQ( 4, image0x0.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_U8x4, image0x0.format );

  var image1x1 = compareImageUtil.makeImage(1, 1);
  EXPECT_EQ( 1, image1x1.width );
  EXPECT_EQ( 1, image1x1.height );
  EXPECT_EQ( 1, image1x1.pitch );
  EXPECT_EQ( 4, image1x1.data.length );
  EXPECT_EQ( 0, image1x1.offset );
  EXPECT_EQ( 4, image1x1.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_U8x4, image1x1.format );

  var image1 = compareImageUtil.makeImage(300, 200);
  EXPECT_EQ( 300, image1.width );
  EXPECT_EQ( 200, image1.height );
  EXPECT_EQ( 300, image1.pitch );
  EXPECT_EQ( 240000, image1.data.length );
  EXPECT_EQ( 0, image1.offset );
  EXPECT_EQ( 4, image1.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_U8x4, image1.format );

  var image2 = compareImageUtil.makeImage(image1);
  EXPECT_EQ( 300, image2.width );
  EXPECT_EQ( 200, image2.height );
  EXPECT_EQ( 300, image2.pitch );
  EXPECT( image1.data === image2.data );
  EXPECT_EQ( 0, image2.offset );
  EXPECT_EQ( 4, image2.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_U8x4, image2.format );

  var imageData = { width: 300, height: 200, data: new Uint8Array(240000) };
  var image3 = compareImageUtil.makeImage(imageData);
  EXPECT_EQ( 300, image3.width );
  EXPECT_EQ( 200, image3.height );
  EXPECT_EQ( 300, image3.pitch );
  EXPECT( imageData.data === image3.data );
  EXPECT_EQ( 0, image3.offset );
  EXPECT_EQ( 4, image3.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_U8x4, image3.format );

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
  EXPECT_EQ( 4, image4.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_U8x4, image4.format );
});

TEST( 'compareImageUtil makeImage F32', function test() {
  var image0x0 = compareImageUtil.makeImage(0, 0, compareImageUtil.FORMAT_F32x1);
  EXPECT_EQ( 0, image0x0.width );
  EXPECT_EQ( 0, image0x0.height );
  EXPECT_EQ( 0, image0x0.pitch );
  EXPECT_EQ( 0, image0x0.data.length );
  EXPECT_EQ( 0, image0x0.offset );
  EXPECT_EQ( 1, image0x0.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_F32x1, image0x0.format );

  var image1x1 = compareImageUtil.makeImage(1, 1, compareImageUtil.FORMAT_F32x1);
  EXPECT_EQ( 1, image1x1.width );
  EXPECT_EQ( 1, image1x1.height );
  EXPECT_EQ( 1, image1x1.pitch );
  EXPECT_EQ( 1, image1x1.data.length );
  EXPECT_EQ( 0, image1x1.offset );
  EXPECT_EQ( 1, image1x1.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_F32x1, image1x1.format );

  var image1 = compareImageUtil.makeImage(300, 200, compareImageUtil.FORMAT_F32x1);
  EXPECT_EQ( 300, image1.width );
  EXPECT_EQ( 200, image1.height );
  EXPECT_EQ( 300, image1.pitch );
  EXPECT_EQ( 60000, image1.data.length );
  EXPECT_EQ( 0, image1.offset );
  EXPECT_EQ( 1, image1.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_F32x1, image1.format );

  var image2 = compareImageUtil.makeImage(image1);
  EXPECT_EQ( 300, image2.width );
  EXPECT_EQ( 200, image2.height );
  EXPECT_EQ( 300, image2.pitch );
  EXPECT( image1.data === image2.data );
  EXPECT_EQ( 0, image2.offset );
  EXPECT_EQ( 1, image2.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_F32x1, image2.format );

  var imageData = { width: 300, height: 200, data: new Float32Array(60000), channels: 1 };
  var image3 = compareImageUtil.makeImage(imageData);
  EXPECT_EQ( 300, image3.width );
  EXPECT_EQ( 200, image3.height );
  EXPECT_EQ( 300, image3.pitch );
  EXPECT( imageData.data === image3.data );
  EXPECT_EQ( 0, image3.offset );
  EXPECT_EQ( 1, image3.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_F32x1, image3.format );

  var imageData2 = {
    width: 200,
    height: 100,
    data: imageData.data,
    pitch: 300,
    offset: 15050,
    channels: 1
  };
  var image4 = compareImageUtil.makeImage(imageData2);
  EXPECT_EQ( 200, image4.width );
  EXPECT_EQ( 100, image4.height );
  EXPECT_EQ( 300, image4.pitch );
  EXPECT( imageData.data === image4.data );
  EXPECT_EQ( 15050, image4.offset );
  EXPECT_EQ( 1, image4.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_F32x1, image4.format );
});

TEST( 'compareImageUtil makeRegion', function test() {
  var image1 = compareImageUtil.makeImage(300, 200);

  var region0 = compareImageUtil.makeRegion(image1);
  EXPECT_EQ( 300, region0.width );
  EXPECT_EQ( 200, region0.height );
  EXPECT_EQ( 300, region0.pitch );
  EXPECT( image1.data === region0.data );
  EXPECT_EQ( 0, region0.offset );
  EXPECT_EQ( 4, region0.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_U8x4, region0.format );

  var region1 = compareImageUtil.makeRegion(image1, 30, 20);
  EXPECT_EQ( 270, region1.width );
  EXPECT_EQ( 180, region1.height );
  EXPECT_EQ( 300, region1.pitch );
  EXPECT( image1.data === region1.data );
  EXPECT_EQ( 300 * 20 + 30, region1.offset );
  EXPECT_EQ( 4, region1.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_U8x4, region1.format );

  var region2 = compareImageUtil.makeRegion(image1, 30, 20, 130, 120);
  EXPECT_EQ( 130, region2.width );
  EXPECT_EQ( 120, region2.height );
  EXPECT_EQ( 300, region2.pitch );
  EXPECT( image1.data === region2.data );
  EXPECT_EQ( 300 * 20 + 30, region2.offset );
  EXPECT_EQ( 4, region2.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_U8x4, region2.format );

  var imageData = { width: 300, height: 200, data: new Uint8Array(240000) };
  var region3 = compareImageUtil.makeRegion(imageData, 10, 20, 30, 40);
  EXPECT_EQ( 30, region3.width );
  EXPECT_EQ( 40, region3.height );
  EXPECT_EQ( 300, region3.pitch );
  EXPECT( imageData.data === region3.data );
  EXPECT_EQ( 300 * 20 + 10, region3.offset );
  EXPECT_EQ( 4, region3.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_U8x4, region3.format );

  var image0x0 = compareImageUtil.makeImage(0, 0);

  var region0x0 = compareImageUtil.makeRegion(image0x0);
  EXPECT_EQ( 0, region0x0.width );
  EXPECT_EQ( 0, region0x0.height );
  EXPECT_EQ( 0, region0x0.pitch );
  EXPECT_EQ( 0, region0x0.data.length );
  EXPECT_EQ( 0, region0x0.offset );
  EXPECT_EQ( 4, region0x0.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_U8x4, region0x0.format );

  var region0x0_2 = compareImageUtil.makeRegion(image0x0, 10, 10, 10, 10);
  EXPECT_EQ( 0, region0x0_2.width );
  EXPECT_EQ( 0, region0x0_2.height );
  EXPECT_EQ( 0, region0x0_2.pitch );
  EXPECT_EQ( 0, region0x0_2.data.length );
  EXPECT_EQ( 0, region0x0_2.offset );
  EXPECT_EQ( 4, region0x0_2.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_U8x4, region0x0_2.format );
});

TEST( 'compareImageUtil makeRegion F32', function test() {
  var image1F = compareImageUtil.makeImage(300, 200, compareImageUtil.FORMAT_F32x1);

  var region0F = compareImageUtil.makeRegion(image1F);
  EXPECT_EQ( 300, region0F.width );
  EXPECT_EQ( 200, region0F.height );
  EXPECT_EQ( 300, region0F.pitch );
  EXPECT( image1F.data === region0F.data );
  EXPECT_EQ( 0, region0F.offset );
  EXPECT_EQ( 1, region0F.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_F32x1, region0F.format );

  var region1F = compareImageUtil.makeRegion(image1F, 30, 20);
  EXPECT_EQ( 270, region1F.width );
  EXPECT_EQ( 180, region1F.height );
  EXPECT_EQ( 300, region1F.pitch );
  EXPECT( image1F.data === region1F.data );
  EXPECT_EQ( 300 * 20 + 30, region1F.offset );
  EXPECT_EQ( 1, region1F.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_F32x1, region1F.format );

  var region2F = compareImageUtil.makeRegion(image1F, 30, 20, 130, 120);
  EXPECT_EQ( 130, region2F.width );
  EXPECT_EQ( 120, region2F.height );
  EXPECT_EQ( 300, region2F.pitch );
  EXPECT( image1F.data === region2F.data );
  EXPECT_EQ( 300 * 20 + 30, region2F.offset );
  EXPECT_EQ( 1, region2F.channels );
  EXPECT_EQ( compareImageUtil.FORMAT_F32x1, region2F.format );
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

TEST( 'compareImageUtil fill F32', function test() {
  var image1 = compareImageUtil.makeImage(300, 200, compareImageUtil.FORMAT_F32x1);
  for (var i = 0; i < 60000; ++i) {
    image1.data[i] = 55;
  }

  compareImageUtil.fill(image1, 20);
  EXPECT_EQ( 20, image1.data[0] );
  EXPECT_EQ( 20, image1.data[1] );
  EXPECT_EQ( 20, image1.data[2] );
  EXPECT_EQ( 20, image1.data[3] );
  EXPECT_EQ( 20, image1.data[4] );
  EXPECT_EQ( 20, image1.data[59999] );

  var region1 = compareImageUtil.makeRegion(image1, 5, 5, 10, 5);
  compareImageUtil.fill(region1, 70);
  EXPECT_EQ( 20, image1.data[0] );
  EXPECT_EQ( 20, image1.data[1504] );
  EXPECT_EQ( 70, image1.data[1505] );
  EXPECT_EQ( 70, image1.data[1514] );
  EXPECT_EQ( 20, image1.data[1515] );
  EXPECT_EQ( 70, image1.data[2714] );
  EXPECT_EQ( 20, image1.data[2715] );
  EXPECT_EQ( 20, image1.data[3005] );
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

TEST( 'compareImageUtil rotate', function test() {
  var imageData = { width: 3, height: 5, data: [] };
  for (var i = 0; i < 60; ++i) {
    imageData.data[i] = i;
  }
  var image1 = compareImageUtil.makeImage(imageData);
  var image2 = compareImageUtil.makeImage(5, 3);
  compareImageUtil.rotate(image2, image1);

  EXPECT_EQ( 5, image2.width );
  EXPECT_EQ( 3, image2.height );
  jsTestUtil.expectEqualArray( [
    48,49,50,51, 36,37,38,39, 24,25,26,27, 12,13,14,15, 0,1,2,3,
    52,53,54,55, 40,41,42,43, 28,29,30,31, 16,17,18,19, 4,5,6,7,
    56,57,58,59, 44,45,46,47, 32,33,34,35, 20,21,22,23, 8,9,10,11
  ], image2.data );
});

TEST( 'compareImageUtil flipH', function test() {
  var imageData = { width: 3, height: 5, data: [] };
  for (var i = 0; i < 60; ++i) {
    imageData.data[i] = i;
  }
  var image1 = compareImageUtil.makeImage(imageData);
  var image2 = compareImageUtil.makeImage(3, 5);
  compareImageUtil.flipH(image2, image1);

  EXPECT_EQ( 3, image2.width );
  EXPECT_EQ( 5, image2.height );
  jsTestUtil.expectEqualArray( [
    8,9,10,11, 4,5,6,7, 0,1,2,3,
    20,21,22,23, 16,17,18,19, 12,13,14,15,
    32,33,34,35, 28,29,30,31, 24,25,26,27,
    44,45,46,47, 40,41,42,43, 36,37,38,39,
    56,57,58,59, 52,53,54,55, 48,49,50,51
  ], image2.data );
});

TEST( 'compareImageUtil flipV', function test() {
  var imageData = { width: 3, height: 5, data: [] };
  for (var i = 0; i < 60; ++i) {
    imageData.data[i] = i;
  }
  var image1 = compareImageUtil.makeImage(imageData);
  var image2 = compareImageUtil.makeImage(3, 5);
  compareImageUtil.flipV(image2, image1);

  EXPECT_EQ( 3, image2.width );
  EXPECT_EQ( 5, image2.height );
  jsTestUtil.expectEqualArray( [
    48,49,50,51, 52,53,54,55, 56,57,58,59,
    36,37,38,39, 40,41,42,43, 44,45,46,47,
    24,25,26,27, 28,29,30,31, 32,33,34,35,
    12,13,14,15, 16,17,18,19, 20,21,22,23,
    0,1,2,3, 4,5,6,7, 8,9,10,11
  ], image2.data );
});

TEST( 'compareImageUtil copy F32', function test() {
  var image1 = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  for (var i = 0; i < 16; ++i) {
    image1.data[i] = i;
  }
  var image2 = compareImageUtil.makeImage(2, 2, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.copy(image2, image1);

  EXPECT_EQ( 2, image2.width );
  EXPECT_EQ( 2, image2.height );
  jsTestUtil.expectEqualArray( [
    0, 1,
    4, 5
  ], image2.data );
});

TEST( 'compareImageUtil readSubPixel', function test() {
  var checkFloatResult = function(name, result, expected) {
    EXPECT_EQ( 4, result.width, 'width of ' + name );
    EXPECT_EQ( 4, result.height, 'height of ' + name );
    EXPECT_EQ( 1, result.channels, 'channels of ' + name );
    EXPECT_EQ( compareImageUtil.FORMAT_F32x1, result.format, 'format of ' + name );
    EXPECT_EQ( 16, result.data.length, 'data.length of ' + name );
    for (var i = 0; i < 16; ++i) {
      var label = (i + 1) + 'th pixel value of ' + name;
      EXPECT( 1e-5 > Math.abs(expected[i] - result.data[i]), label );
    }
  };
  var image1 = compareImageUtil.makeImage(4, 4);
  var imageF = compareImageUtil.makeImage({
    width: 4, height: 4, data: [
      55, 55, 55, 55,  55, 55, 55, 55,  55, 55, 55, 55,  55, 55, 55, 55
    ], channels: 1
  });
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

  var result1F = compareImageUtil.readSubPixel(imageF, 0, 0, 4, 4);
  checkFloatResult('result1F', result1F, expected1);
  var result2F = compareImageUtil.readSubPixel(imageF, 0.3, 0.3, 4, 4);
  checkFloatResult('result2F', result2F, expected1);
  var result3F = compareImageUtil.readSubPixel(imageF, -1.7, -1.5, 4, 4);
  checkFloatResult('result3F', result3F, expected1);

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

  imageF.data[0] = 11;
  imageF.data[1] = 11;
  imageF.data[4] = 11;
  var result4F = compareImageUtil.readSubPixel(imageF, 0, 0, 4, 4);
  checkFloatResult('result4F', result4F, [
    11, 11, 55, 55,  11, 55, 55, 55,  55, 55, 55, 55,  55, 55, 55, 55
  ]);
  var result5F = compareImageUtil.readSubPixel(imageF, 0.5, 0.5, 4, 4);
  checkFloatResult('result5F', result5F, [
    22, 44, 55, 55,  44, 55, 55, 55,  55, 55, 55, 55,  55, 55, 55, 55
  ]);
  var result6F = compareImageUtil.readSubPixel(imageF, -0.5, -0.5, 4, 4);
  checkFloatResult('result6F', result6F, [
    11, 11, 33, 55,  11, 22, 44, 55,  33, 44, 55, 55,  55, 55, 55, 55
  ]);
  var result7F = compareImageUtil.readSubPixel(imageF, 0.1, 0, 4, 4);
  checkFloatResult('result7F', result7F, [
    11, 15.4, 55, 55,  15.4, 55, 55, 55,  55, 55, 55, 55,  55, 55, 55, 55
  ]);
  var result8F = compareImageUtil.readSubPixel(imageF, 0, 0.2, 4, 4);
  checkFloatResult('result8F', result8F, [
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
  var checkGrayscaleResultF32 = function(name, result, expected) {
    for (var i = 0; i < 16; ++i) {
      var label = (i + 1) + 'th pixel of ' + name;
      EXPECT( 1e-4 > Math.abs(expected[i] - result.data[i]), label );
    }
  };
  var imageData = { width: 4, height: 4, data: [
    0, 0, 0, 255,     85, 85, 85, 255,  170, 170, 170, 255, 255, 255, 255, 255,
    255, 0, 0, 255,   0, 255, 0, 255,   0, 0, 255, 255,     128, 128, 128, 255,
    0, 255, 255, 255, 255, 0, 255, 255, 255, 255, 0, 255,   255, 255, 255, 255,
    80, 80, 80, 0,    80, 80, 80, 85,   80, 80, 80, 170,    80, 80, 80, 255
  ] };
  var image1 = compareImageUtil.makeImage(imageData);
  // RGBA ==> RGBA
  var result1 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.fill(result1, 0, 0, 0, 0);
  compareImageUtil.convertToGrayscale(result1, image1);
  checkGrayscaleResult('result1', result1, [
    0, 255,     85, 255,    170, 255,   255, 255,
    76, 255,    150, 255,   29, 255,    128, 255,
    179, 255,   105, 255,   226, 255,   255, 255,
    80, 0,      80, 85,     80, 170,    80, 255
  ]);
  // RGBA ==> Y (F32)
  var result2 = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  //compareImageUtil.fill(result1, 0, 0, 0, 0);
  compareImageUtil.convertToGrayscale(result2, image1);
  checkGrayscaleResultF32('result2', result2, [
    0,        85,       170,      255,
    76.2450,  149.6850, 29.0700,  128,
    178.7550, 105.3150, 225.9300, 255,
    0,        26.6667,  53.3333,  80
  ]);
  // Y (F32) ==> RGBA
  var result3 = compareImageUtil.makeImage(4, 4);
  compareImageUtil.fill(result3, 0, 0, 0, 0);
  compareImageUtil.convertToGrayscale(result3, result2);
  checkGrayscaleResult('result3', result3, [
    0, 255,     85, 255,    170, 255,   255, 255,
    76, 255,    150, 255,   29, 255,    128, 255,
    179, 255,   105, 255,   226, 255,   255, 255,
    0, 255,     27, 255,    53, 255,    80, 255
  ]);
  // Y (F32) ==> Y (F32)
  var result4 = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  //compareImageUtil.fill(result1, 0, 0, 0, 0);
  compareImageUtil.convertToGrayscale(result4, result2);
  checkGrayscaleResultF32('result4', result4, [
    0,        85,       170,      255,
    76.2450,  149.6850, 29.0700,  128,
    178.7550, 105.3150, 225.9300, 255,
    0,        26.6667,  53.3333,  80
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

TEST( 'compareImageUtil resizeNN F32', function test() {
  var image1 = compareImageUtil.makeImage(2, 2, compareImageUtil.FORMAT_F32x1);
  var image2 = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);

  compareImageUtil.fill(image1, 10);
  compareImageUtil.fill(image2, 0);
  compareImageUtil.resizeNN(image2, image1);
  jsTestUtil.expectEqualArray( [
    10, 10, 10, 10,
    10, 10, 10, 10,
    10, 10, 10, 10,
    10, 10, 10, 10
  ], image2.data );

  image1.data[0] = 255;
  compareImageUtil.fill(image2, 0);
  compareImageUtil.resizeNN(image2, image1);
  jsTestUtil.expectEqualArray( [
    255, 255, 10, 10,
    255, 255, 10, 10,
    10,  10,  10, 10,
    10,  10,  10, 10
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

TEST( 'compareImageUtil gaussianBlur', function test() {
  var checkGrayscaleResult = function(name, result, expected) {
    for (var i = 0; i < 64; ++i) {
      var label = (i + 1) + 'th pixel of ' + name;
      EXPECT_EQ( expected[i], result.data[i * 4 + 0], label + ' (R)' );
      EXPECT_EQ( expected[i], result.data[i * 4 + 1], label + ' (G)' );
      EXPECT_EQ( expected[i], result.data[i * 4 + 2], label + ' (B)' );
      EXPECT_EQ( 255, result.data[i * 4 + 3], label + ' (alpha)' );
    }
  };

  var image1 = compareImageUtil.makeImage(8, 8);
  compareImageUtil.fill(image1, 0, 0, 0, 255);
  var region1 = compareImageUtil.makeRegion(image1, 3, 3, 1, 1);
  compareImageUtil.fill(region1, 255, 255, 255, 255);

  var result1 = compareImageUtil.makeImage(8, 8);
  compareImageUtil.fill(result1, 0, 0, 0, 0);

  // stdev = 0
  compareImageUtil.gaussianBlur(result1, image1, 0);
  checkGrayscaleResult('gaussian stdev=0 of point', result1, [
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0, 255, 0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0
  ]);

  // stdev = 1
  compareImageUtil.gaussianBlur(result1, image1, 1);
  checkGrayscaleResult('gaussian stdev=1 of point', result1, [
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  1,  3,  5,  3,  1,  0,  0,
    0,  3, 15, 25, 15,  3,  0,  0,
    0,  5, 25, 41, 25,  5,  0,  0,
    0,  3, 15, 25, 15,  3,  0,  0,
    0,  1,  3,  5,  3,  1,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0
  ]);

  var region2 = compareImageUtil.makeRegion(image1, 0, 0, 4, 8);
  compareImageUtil.fill(region2, 255, 255, 255, 255);

  // stdev = 0
  compareImageUtil.gaussianBlur(result1, image1, 0);
  checkGrayscaleResult('gaussian stdev=0 of partition', result1, [
    255, 255, 255, 255,  0,  0,  0,  0,
    255, 255, 255, 255,  0,  0,  0,  0,
    255, 255, 255, 255,  0,  0,  0,  0,
    255, 255, 255, 255,  0,  0,  0,  0,
    255, 255, 255, 255,  0,  0,  0,  0,
    255, 255, 255, 255,  0,  0,  0,  0,
    255, 255, 255, 255,  0,  0,  0,  0,
    255, 255, 255, 255,  0,  0,  0,  0
  ]);

  // stdev = 1
  compareImageUtil.gaussianBlur(result1, image1, 1);
  checkGrayscaleResult('gaussian stdev=1 of partition', result1, [
    255, 254, 240, 178, 77,  15,  1,  0,
    255, 254, 240, 178, 77,  15,  1,  0,
    255, 254, 240, 178, 77,  15,  1,  0,
    255, 254, 240, 178, 77,  15,  1,  0,
    255, 254, 240, 178, 77,  15,  1,  0,
    255, 254, 240, 178, 77,  15,  1,  0,
    255, 254, 240, 178, 77,  15,  1,  0,
    255, 254, 240, 178, 77,  15,  1,  0
  ]);
});

TEST( 'compareImageUtil gaussianBlur F32', function test() {
  var checkGrayscaleResultF32 = function(name, result, expected) {
    for (var i = 0; i < 64; ++i) {
      var label = (i + 1) + 'th pixel of ' + name;
      var e = Math.round(expected[i] * 100) / 100;
      var a = Math.round(result.data[i] * 100) / 100;
      EXPECT_EQ( e, a, label );
    }
  };

  var image1 = compareImageUtil.makeImage(8, 8, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.fill(image1, 0);
  var region1 = compareImageUtil.makeRegion(image1, 3, 3, 1, 1);
  compareImageUtil.fill(region1, 255);

  var result1 = compareImageUtil.makeImage(8, 8, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.fill(result1, 0);

  // stdev = 0
  compareImageUtil.gaussianBlur(result1, image1, 0);
  checkGrayscaleResultF32('gaussian stdev=0 of point', result1, [
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0, 255, 0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0
  ]);

  // stdev = 1
  compareImageUtil.gaussianBlur(result1, image1, 1);
  checkGrayscaleResultF32('gaussian stdev=1 of point', result1, [
    0.01,  0.06,  0.27,  0.45,  0.27,  0.06,  0.01,  0,
    0.06,  0.74,  3.33,  5.49,  3.33,  0.74,  0.06,  0,
    0.27,  3.33, 14.93, 24.62, 14.93,  3.33,  0.27,  0,
    0.45,  5.49, 24.62, 40.60, 24.62,  5.49,  0.45,  0,
    0.27,  3.33, 14.93, 24.62, 14.93,  3.33,  0.27,  0,
    0.06,  0.74,  3.33,  5.49,  3.33,  0.74,  0.06,  0,
    0.01,  0.06,  0.27,  0.45,  0.27,  0.06,  0.01,  0,
    0,     0,     0,     0,     0,     0,     0,     0
  ]);
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
  var makeImageForConvolutionTestF32 = function(bitmap) {
    var image = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
    for (var i = 0; i < 16; ++i) {
      image.data[i] = bitmap[i];
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
  var checkConvolutionResultF32 = function(name, result, expected) {
    for (var i = 0; i < 16; ++i) {
      var label = (i + 1) + 'th pixel of ' + name;
      EXPECT( 1e-5 > Math.abs(expected[i] - result.data[i]), label );
    }
  };

  var image1Bitmap = [
      0,   0,   0,   0,
      0, 100, 100,   0,
      0,  50,   0,   0,
      0,   0,   0,  50
  ];
  var image1 = makeImageForConvolutionTest(image1Bitmap);
  var image1F = makeImageForConvolutionTestF32(image1Bitmap);

  var result1 = compareImageUtil.makeImage(4, 4);
  var result1F = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.convolution(result1, image1, { w: 3, h: 1 }, [
    1, 0, -1
  ]);
  compareImageUtil.convolution(result1F, image1F, { w: 3, h: 1 }, [
    1, 0, -1
  ]);
  var expected1 = [
      0,   0,    0,    0,
    100, 100, -100, -100,
     50,   0,  -50,    0,
      0,   0,   50,   50
  ];
  checkConvolutionResult('result1 (horizontal kernel)', result1, expected1);
  checkConvolutionResultF32('result1F (horizontal kernel)', result1F, expected1);

  var result2 = compareImageUtil.makeImage(4, 4);
  var result2F = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.convolution(result2, image1, { w: 1, h: 3 }, [
    0.20,
    0.60,
    0.20
  ]);
  compareImageUtil.convolution(result2F, image1F, { w: 1, h: 3 }, [
    0.20,
    0.60,
    0.20
  ]);
  var expected2 = [
    0,  20, 20,  0,
    0,  70, 60,  0,
    0,  50, 20, 10,
    0,  10,  0, 40
  ];
  checkConvolutionResult('result2 (vertical kernel)', result2, expected2);
  checkConvolutionResultF32('result2F (vertical kernel)', result2F, expected2);

  var result3 = compareImageUtil.makeImage(4, 4);
  var result3F = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  var kernel3 = [
    0.0, 0.1, 0.0,
    0.1, 0.6, 0.1,
    0.0, 0.1, 0.0
  ];
  compareImageUtil.convolution(result3, image1, { w: 3, h: 3 }, kernel3);
  compareImageUtil.convolution(result3F, image1F, { w: 3, h: 3 }, kernel3);
  var expected3 = [
     0,  10, 10,  0,
    10,  75, 70, 10,
     5,  40, 15,  5,
     0,   5,  5, 40
  ];
  checkConvolutionResult('result3 (3x3 kernel)', result3, expected3);
  checkConvolutionResultF32('result3F (3x3 kernel)', result3F, expected3);

  var image2Bitmap = [
      0,   0,   0,   0,
      0,  10,   0,   0,
      0,   0,   0,   0,
      0,   0,   0,   0
  ];
  var image2 = makeImageForConvolutionTest(image2Bitmap);
  var image2F = makeImageForConvolutionTestF32(image2Bitmap);

  var result4 = compareImageUtil.makeImage(4, 4);
  var result4F = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  var kernel4 = [
    1, 2, 3,
    4, 5, 6,
    7, 8, 9
  ];
  compareImageUtil.convolution(result4, image2, { w: 3, h: 3 }, kernel4);
  compareImageUtil.convolution(result4F, image2F, { w: 3, h: 3 }, kernel4);
  var expected4 = [
     10, 20, 30, 0,
     40, 50, 60, 0,
     70, 80, 90, 0,
      0,  0,  0, 0
  ];
  checkConvolutionResult('result4 (3x3 kernel)', result4, expected4);
  checkConvolutionResultF32('result4F (3x3 kernel)', result4F, expected4);

  var result5 = compareImageUtil.makeImage(4, 4);
  var result5F = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  var kernel5 = [
    1,  2,  3,  4,  5,
    2,  3,  4,  5,  6,
    3,  4,  5,  6,  7,
    4,  5,  6,  7,  8,
    5,  6,  7,  8,  9
  ];
  compareImageUtil.convolution(result5, image2, { w: 5, h: 5 }, kernel5);
  compareImageUtil.convolution(result5F, image2F, { w: 5, h: 5 }, kernel5);
  var expected5 = [
     30, 40, 50, 60,
     40, 50, 60, 70,
     50, 60, 70, 80,
     60, 70, 80, 90
  ];
  checkConvolutionResult('result5 (5x5 kernel)', result5, expected5);
  checkConvolutionResultF32('result5F (5x5 kernel)', result5F, expected5);

  var result6 = compareImageUtil.makeImage(4, 4);
  var result6F = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.sobelX(result6, image2);
  compareImageUtil.sobelX(result6F, image2F);
  var expected6 = [
     10,   0,  -10,   0,
     20,   0,  -20,   0,
     10,   0,  -10,   0,
      0,   0,    0,   0
  ];
  checkConvolutionResult('result6 (sobelX)', result6, expected6);
  checkConvolutionResultF32('result6F (sobelX)', result6F, expected6);

  var result7 = compareImageUtil.makeImage(4, 4);
  var result7F = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.sobelY(result7, image2);
  compareImageUtil.sobelY(result7F, image2F);
  var expected7 = [
     10,  20,   10,   0,
      0,   0,    0,   0,
    -10, -20,  -10,   0,
      0,   0,    0,   0
  ];
  checkConvolutionResult('result7 (sobelY)', result7, expected7);
  checkConvolutionResultF32('result7F (sobelY)', result7F, expected7);

  var result8 = compareImageUtil.makeImage(4, 4);
  var result8F = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.scharrX(result8, image2);
  compareImageUtil.scharrX(result8F, image2F);
  var expected8 = [
     30,  0,  -30,  0,
    100,  0, -100,  0,
     30,  0,  -30,  0,
      0,  0,    0,  0
  ];
  checkConvolutionResult('result8 (scharrX)', result8, expected8);
  checkConvolutionResultF32('result8F (scharrX)', result8F, expected8);

  var result9 = compareImageUtil.makeImage(4, 4);
  var result9F = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.scharrY(result9, image2);
  compareImageUtil.scharrY(result9F, image2F);
  var expected9 = [
     30,  100,  30,   0,
      0,    0,   0,   0,
    -30, -100, -30,   0,
      0,    0,   0,   0
  ];
  checkConvolutionResult('result9 (scharrY)', result9, expected9);
  checkConvolutionResultF32('result9F (scharrY)', result9F, expected9);
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

TEST( 'compareImageUtil dilate3x1 F32, dilate1x3 F32, dilate3x3 F32', function test() {
  var checkResult = function(name, result, expected) {
    EXPECT_EQ( expected.data.length, result.data.length, 'data.length of ' + name );
    EXPECT_EQ( expected.width, result.width, 'width of ' + name );
    EXPECT_EQ( expected.height, result.height, 'height of ' + name );
    for (i = 0; i < expected.data.length; ++i) {
      var label = (i + 1) + 'th pixel of ' + name;
      EXPECT_EQ( expected.data[i], result.data[i], label );
    }
  };

  var image1F = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  var d1 = image1F.data;
  d1[5] = 128; d1[6] = 60; d1[11] = 20;

  var result3x1F = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.dilate3x1(result3x1F, image1F);
  var expected3x1F = { width: 4, height: 4, data: [
    0,   0,   0,   0,
    128, 128, 128, 60,
    0,   0,   20,  20,
    0,   0,   0,   0
  ] };
  checkResult('result3x1F', result3x1F, expected3x1F);

  d1[12] = 50;

  var result1x3F = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.dilate1x3(result1x3F, image1F);
  var expected1x3F = { width: 4, height: 4, data: [
    0,   128, 60,  0,
    0,   128, 60,  20,
    50,  128, 60,  20,
    50,  0,   0,   20
  ] };
  checkResult('result1x3F', result1x3F, expected1x3F);

  var result3x3F = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.dilate3x3(result3x3F, image1F);
  var expected3x3F = { width: 4, height: 4, data: [
    128, 128, 128,  60,
    128, 128, 128,  60,
    128, 128, 128,  60,
    50,  50,  20,   20
  ] };
  checkResult('result3x3F', result3x3F, expected3x3F);
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

TEST( 'compareImageUtil cornerValue F32, findCornerPoints F32, adjustCornerPointsSubPixel F32', function test() {
  var sum = function(image, l, t, w, h) {
    image = compareImageUtil.makeRegion(image, l, t, w, h);
    var v = 0;
    for (y = 0; y < image.height; y++) {
      var i = image.offset + image.pitch * y;
      for (x = 0; x < image.width; x++, i++) {
        v += image.data[i];
      }
    }
    return v;
  };

  var image1 = compareImageUtil.makeImage(50, 50, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.fill(image1, 0);
  var region1 = compareImageUtil.makeRegion(image1, 20, 20, 20, 16);
  compareImageUtil.fill(region1, 255);

  var result1 = compareImageUtil.cornerValue(image1);
  EXPECT_EQ( 0, sum(result1, 0, 0, 18, 50) );
  EXPECT_EQ( 0, sum(result1, 22, 0, 16, 50) );
  EXPECT_EQ( 0, sum(result1, 42, 0, 8, 50) );
  EXPECT_EQ( 0, sum(result1, 0, 0, 50, 18) );
  EXPECT_EQ( 0, sum(result1, 0, 22, 50, 12) );
  EXPECT_EQ( 0, sum(result1, 0, 38, 50, 12) );
  EXPECT( 0 < sum(result1, 18, 18, 4, 4) );
  EXPECT( 0 < sum(result1, 38, 18, 4, 4) );
  EXPECT( 0 < sum(result1, 18, 34, 4, 4) );
  EXPECT( 0 < sum(result1, 38, 34, 4, 4) );

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

TEST( 'compareImageUtil sparseOpticalFlow', function test() {
  var checkOpticalFlowResult = function(label, actual, reso, expected) {
    EXPECT_EQ( expected.length, actual.length, 'count of ' + label );
    for (var i = 0; i < Math.min(expected.length, actual.length); ++i) {
      if (expected[i] === null) {
        EXPECT_EQ( null, actual[i], (i + 1) + 'th value of ' + label);
      } else if (actual[i] === null) {
        EXPECT_EQ( expected[i], actual[i], (i + 1) + 'th value of ' + label);
      } else {
        var ex = Math.round(expected[i].x * reso) / reso;
        var ax = Math.round(actual[i].x * reso) / reso;
        var ey = Math.round(expected[i].y * reso) / reso;
        var ay = Math.round(actual[i].y * reso) / reso;
        EXPECT_EQ( ex, ax, (i + 1) + 'th x value of ' + label );
        EXPECT_EQ( ey, ay, (i + 1) + 'th y value of ' + label );
      }
    }
  };

  var image1 = compareImageUtil.makeImage(50, 50);
  compareImageUtil.fill(image1, 0, 0, 0, 255);
  var region1 = compareImageUtil.makeRegion(image1, 20, 20, 20, 16);
  compareImageUtil.fill(region1, 50, 50, 50, 255);
  var corners = [
    { x: 19.5, y: 19.5 }, { x: 39.5, y: 19.5 },
    { x: 19.5, y: 35.5 }, { x: 39.5, y: 35.5 }
  ];
  compareImageUtil.adjustCornerPointsSubPixel(image1, corners);

  var result1 = compareImageUtil.sparseOpticalFlow(image1, image1, corners);
  checkOpticalFlowResult( 'result1', result1, 100, corners )

  var image2 = compareImageUtil.makeImage(50, 50);
  compareImageUtil.fill(image2, 0, 0, 0, 255);
  var region3 = compareImageUtil.makeRegion(image2, 25, 22, 20, 16);
  compareImageUtil.fill(region3, 50, 50, 50, 255);

  var result2 = compareImageUtil.sparseOpticalFlow(image1, image2, corners);
  checkOpticalFlowResult( 'result2', result2, 10, [
    { x: 24.5, y: 21.5 }, { x: 44.5, y: 21.5 },
    { x: 24.5, y: 37.5 }, { x: 44.5, y: 37.5 }
  ] );
});

TEST( 'compareImageUtil sparseOpticalFlow F32', function test() {
  var checkOpticalFlowResult = function(label, actual, reso, expected) {
    EXPECT_EQ( expected.length, actual.length, 'count of ' + label );
    for (var i = 0; i < Math.min(expected.length, actual.length); ++i) {
      if (expected[i] === null) {
        EXPECT_EQ( null, actual[i], (i + 1) + 'th value of ' + label);
      } else if (actual[i] === null) {
        EXPECT_EQ( expected[i], actual[i], (i + 1) + 'th value of ' + label);
      } else {
        var ex = Math.round(expected[i].x * reso) / reso;
        var ax = Math.round(actual[i].x * reso) / reso;
        var ey = Math.round(expected[i].y * reso) / reso;
        var ay = Math.round(actual[i].y * reso) / reso;
        EXPECT_EQ( ex, ax, (i + 1) + 'th x value of ' + label );
        EXPECT_EQ( ey, ay, (i + 1) + 'th y value of ' + label );
      }
    }
  };
  var makeImage = compareImageUtil.makeImage;
  var makeRegion = compareImageUtil.makeRegion;

  var image1 = makeImage(50, 50, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.fill(image1, 0);
  var region1 = makeRegion(image1, 20, 20, 20, 16);
  compareImageUtil.fill(region1, 255);
  var corners = [
    { x: 19.5, y: 19.5 }, { x: 39.5, y: 19.5 },
    { x: 19.5, y: 35.5 }, { x: 39.5, y: 35.5 }
  ];
  compareImageUtil.adjustCornerPointsSubPixel(image1, corners);
  var result1 = compareImageUtil.sparseOpticalFlow(image1, image1, corners);
  checkOpticalFlowResult( 'result1', result1, 100, corners )

  var image2 = makeImage(50, 50, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.fill(image2, 0);
  var region3 = makeRegion(image2, 25, 22, 20, 16);
  compareImageUtil.fill(region3, 255);
  var result2 = compareImageUtil.sparseOpticalFlow(image1, image2, corners);
  checkOpticalFlowResult( 'result2', result2, 10, [
    { x: 24.5, y: 21.5 }, { x: 44.5, y: 21.5 },
    { x: 24.5, y: 37.5 }, { x: 44.5, y: 37.5 }
  ] );

  var image3 = makeImage(50, 50, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.fill(image3, 0);
  var region4 = makeRegion(image3, 8, 10, 20, 16);
  compareImageUtil.fill(region4, 255);
  var result3 = compareImageUtil.sparseOpticalFlow(image1, image3, corners);
  checkOpticalFlowResult( 'result3', result3, 10, [
    { x: 7.5, y: 9.5 }, { x: 27.5, y: 9.5 },
    { x: 7.5, y: 25.5 }, { x: 27.5, y: 25.5 }
  ] );

  var image4 = makeImage(50, 50, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.fill(image4, 0);
  var region5 = makeRegion(image4, 35, 30, 20, 16);
  compareImageUtil.fill(region5, 255);
  var result4 = compareImageUtil.sparseOpticalFlow(image1, image4, corners);
  checkOpticalFlowResult( 'result4', result4, 10, [
    { x: 34.5, y: 29.5 }, null,
    { x: 34.5, y: 45.5 }, null
  ] );

  var image5 = makeImage(50, 50, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.fill(image5, 0);
  var region6 = makeRegion(image5, 5, 5, 40, 40);
  compareImageUtil.fill(region6, 255);
  var result5 = compareImageUtil.sparseOpticalFlow(image1, image5, corners);
  checkOpticalFlowResult( 'result5', result5, 10, [
    { x: 4.5, y: 4.5 }, { x: 44.5, y: 4.5 },
    { x: 4.5, y: 44.5 }, { x: 44.5, y: 44.5 }
  ] );

  //
  // 200 x 200
  //

  var image6 = makeImage(200, 200, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.fill(image6, 0);
  compareImageUtil.fill(makeRegion(image6, 25, 15, 20, 20), 255);
  var corners2 = [
    { x: 24.5, y: 14.5 }, { x: 44.5, y: 14.5 }, { x: 24.5, y: 34.5 }, { x: 44.5, y: 34.5 }
  ];
  compareImageUtil.adjustCornerPointsSubPixel(image6, corners2);
  var result6 = compareImageUtil.sparseOpticalFlow(image6, image6, corners2);
  checkOpticalFlowResult( 'result6', result6, 100, corners2);

  var image7 = makeImage(200, 200, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.fill(image7, 0);
  compareImageUtil.fill(makeRegion(image7, 55, 20, 20, 20), 255);
  var result7 = compareImageUtil.sparseOpticalFlow(image6, image7, corners2);
  checkOpticalFlowResult( 'result7', result7, 10, [
    { x: 54.5, y: 19.5 }, { x: 74.5, y: 19.5 }, { x: 54.5, y: 39.5 }, { x: 74.5, y: 39.5 }
  ] );

  var image8 = makeImage(200, 200, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.fill(image8, 0);
  compareImageUtil.fill(makeRegion(image8, 12, 15, 20, 20), 255);
  var result8 = compareImageUtil.sparseOpticalFlow(image6, image8, corners2);
  checkOpticalFlowResult( 'result8', result8, 10, [
    { x: 11.5, y: 14.5 }, { x: 31.5, y: 14.5 }, { x: 11.5, y: 34.5 }, { x: 31.5, y: 34.5 }
  ] );
  var result8rev = compareImageUtil.sparseOpticalFlow(image8, image6, result8);
  checkOpticalFlowResult( 'result8 reverse', result8rev, 10, [
    { x: 24.5, y: 14.5 }, { x: 44.5, y: 14.5 }, { x: 24.5, y: 34.5 }, { x: 44.5, y: 34.5 }
  ] );

  // Angle shape ('L')
  var image9 = makeImage(200, 200, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.fill(image9, 0);
  compareImageUtil.fill(makeRegion(image9, 40, 20, 20, 40), 255);
  compareImageUtil.fill(makeRegion(image9, 20, 40, 40, 20), 255);
  var corners3 = [
    { x: 39.5, y: 39.5 }
  ];
  compareImageUtil.adjustCornerPointsSubPixel(image9, corners3);
  var result9 = compareImageUtil.sparseOpticalFlow(image9, image9, corners3);
  checkOpticalFlowResult( 'result9', result9, 100, corners3);

  var image10 = makeImage(200, 200, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.fill(image10, 0);
  compareImageUtil.fill(makeRegion(image10, 70, 25, 20, 40), 255);
  compareImageUtil.fill(makeRegion(image10, 50, 45, 40, 20), 255);
  var result10 = compareImageUtil.sparseOpticalFlow(image9, image10, corners3);
  checkOpticalFlowResult( 'result10', result10, 10, [
    { x: 69.5, y: 44.5 }
  ] );

  // thin line
  var image11 = makeImage(200, 200, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.fill(image11, 0);
  compareImageUtil.fill(makeRegion(image11, 30, 30, 100, 5), 255);
  var corners4 = [
    { x: 29.1, y: 32.0 }, { x:129.9, y: 32.0 }
  ];
  compareImageUtil.adjustCornerPointsSubPixel(image11, corners4);
  var result11 = compareImageUtil.sparseOpticalFlow(image11, image11, corners4);
  checkOpticalFlowResult( 'result11', result11, 100, corners4);

  var image12 = makeImage(200, 200, compareImageUtil.FORMAT_F32x1);
  compareImageUtil.fill(image12, 0);
  compareImageUtil.fill(makeRegion(image12, 40, 40, 100, 5), 255);
  var result12 = compareImageUtil.sparseOpticalFlow(image11, image12, corners4);
  checkOpticalFlowResult( 'result12', result12, 10, [
    { x: 39.1, y: 42.0 }, { x:139.9, y: 42.0 }
  ] );
});

TEST( 'compareImageUtil mostFrequentColor', function test() {
  var colors1 = [[0,0,0,255]];
  EXPECT_EQ( [0,0,0,255].toString(), compareImageUtil.mostFrequentColor(colors1).toString() );
  var colors2 = [[0,0,0,255], [0,0,0,255]];
  EXPECT_EQ( [0,0,0,255].toString(), compareImageUtil.mostFrequentColor(colors2).toString() );
  var colors3 = [[0,0,0,255], [0,0,0,255], [0,0,255,255]];
  EXPECT_EQ( [0,0,0,255].toString(), compareImageUtil.mostFrequentColor(colors3).toString() );
  var colors4 = [[0,0,255,255], [0,0,0,255], [0,0,0,255]];
  EXPECT_EQ( [0,0,0,255].toString(), compareImageUtil.mostFrequentColor(colors4).toString() );
});

TEST( 'compareImageUtil geometricTypeOfPixel', function test() {
  var getSlice4 = function(image, index) {
    return [
      image.data[index * 4], image.data[index * 4 + 1],
      image.data[index * 4 + 2], image.data[index * 4 + 3]
    ];
  };
  var checkGeometricTypeResult = function(label, w, h, result, getExpected) {
    EXPECT_EQ( w * h, result.typeMap.length, 'typeMap.length of ' + label );
    EXPECT_EQ( w, result.colorMap.width, 'colorMap.width of ' + label );
    EXPECT_EQ( h, result.colorMap.height, 'colorMap.height of ' + label );
    EXPECT_EQ( w * h * 4, result.colorMap.data.length, 'colorMap.data.length of ' + label );
    var typeErrors = 0;
    var colorErrors = 0;
    for (var i = 0; i < w * h; i++) {
      var x = i % w;
      var y = Math.floor(i / w);
      var expected = getExpected(x, y, i);
      if (result.typeMap[i] !== expected.type) {
        if (typeErrors < 10) {
          var msg = 'type error at(' + x + ',' + y + ') of ' + label;
          EXPECT_EQ( expected.type, result.typeMap[i], msg );
        }
        typeErrors += 1;
      }
      var expectedColor = expected.color.toString();
      var actualColor = getSlice4(result.colorMap, i).toString();
      if (actualColor !== expectedColor) {
        if (colorErrors < 10) {
          var msg = 'color error at(' + x + ',' + y + ') of ' + label;
          EXPECT_EQ( expectedColor, actualColor, msg );
        }
        colorErrors += 1;
      }
    }
    if (10 < typeErrors || 10 < colorErrors) {
      WARN('... and more');
    }
    EXPECT_EQ( 0, typeErrors, 'type error count of ' + label );
    EXPECT_EQ( 0, colorErrors, 'color error count of ' + label );
  };
  var makeImage = compareImageUtil.makeImage;
  var makeRegion = compareImageUtil.makeRegion;
  var UNCLASSIFIED = 0, FLAT = 1, BORDER = 2;
  // complete flat image
  var image1 = makeImage(200, 200);
  compareImageUtil.fill(image1, 0, 0, 0, 255);
  var result1 = compareImageUtil.geometricTypeOfPixel(image1);
  checkGeometricTypeResult('result1', 200, 200, result1, function(x, y, i) {
    // every pixels are flat
    return { type: FLAT, color: getSlice4(image1, i) };
  });
  // ...with some rectangles are drawn
  compareImageUtil.fill(makeRegion(image1, 50, 50, 20, 20), 255, 255, 255, 255);
  compareImageUtil.fill(makeRegion(image1, 100, 50, 50, 50), 255, 0, 0, 255);
  compareImageUtil.fill(makeRegion(image1, 0, 100, 100, 100), 0, 255, 0, 255);
  compareImageUtil.fill(makeRegion(image1, 100, 100, 50, 50), 0, 0, 255, 255);
  var result2 = compareImageUtil.geometricTypeOfPixel(image1);
  checkGeometricTypeResult('result2', 200, 200, result2, function(x, y, i) {
    // still every pixels belong to flat region
    return { type: FLAT, color: getSlice4(image1, i) };
  });
  // ...with some thin lines with unique colors are drawn
  compareImageUtil.fill(makeRegion(image1, 20, 0, 1, 200), 128, 0, 128, 255);
  compareImageUtil.fill(makeRegion(image1, 0, 90, 200, 1), 45, 90, 135, 255);
  var result3 = compareImageUtil.geometricTypeOfPixel(image1);
  checkGeometricTypeResult('result3', 200, 200, result3, function(x, y, i) {
    // pixels on the thin lines are not in flat region
    return {
      type: (x === 20 || y === 90) ? UNCLASSIFIED : FLAT,
      color: getSlice4(image1, i)
    };
  });
  // white background and blue box with anti-aliasing-like border
  var image2 = makeImage(200, 200);
  compareImageUtil.fill(image2, 255, 255, 255, 255); // white
  compareImageUtil.fill(makeRegion(image2, 50, 50, 100, 100), 0, 0, 255, 255); // blue
  compareImageUtil.fill(makeRegion(image2, 50, 49, 100, 1), 64, 64, 255, 255); // light blue (top)
  compareImageUtil.fill(makeRegion(image2, 50, 150, 100, 1), 192, 192, 255, 255); // light blue (bottom)
  for (var i = 0; i < 100; i++) {
    var gray1 = 254 - Math.round((254-128) * i / 99);
    var gray2 = 128 + Math.round((254-128) * i / 99);
    compareImageUtil.fill(makeRegion(image2, 49, 50+i, 1, 1), gray1, gray1, 255, 255); // light blue (left)
    compareImageUtil.fill(makeRegion(image2, 150, 50+i, 1, 1), gray2, gray2, 255, 255); // light blue (right)
  }
  var result4 = compareImageUtil.geometricTypeOfPixel(image2);
  checkGeometricTypeResult('result4', 200, 200, result4, function(x, y, i) {
      // pixels on the border are classified as border
      if ((x === 49 || x === 150) && (50 <= y && y <= 149)) {
        return { type: BORDER, color: [255,255,255,255] };
      }
      if ((y === 49 || y === 150) && (50 <= x && x <= 149)) {
        return { type: BORDER, color: (y === 49 ? [0,0,255,255] : [255,255,255,255]) };
      }
      return { type: FLAT, color: getSlice4(image2, i) };
  });
  // simple border lines
  var simpleBorder = {
    width: 4,
    height: 4,
    data: [
      0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
      0, 0, 0, 255, 30,30,30,255, 50,50,50,255, 50,50,50,255,
      0, 0, 0, 255, 50,50,50,255, 90,90,90,255, 90,90,90,255,
      0, 0, 0, 255, 50,50,50,255, 90,90,90,255, 90,90,90,255
    ]
  };
  var border1 = compareImageUtil.geometricTypeOfPixel(simpleBorder);
  checkGeometricTypeResult('simpleBorder', 4, 4, border1, function(x, y, i) {
    if (x === 0 || y === 0) {
      return { type: FLAT, color: [0, 0, 0, 255] };
    } else if (x === 1 && y === 1) {
      return { type: BORDER, color: [0, 0, 0, 255] };
    } else if (x === 1 || y === 1) {
      return { type: BORDER, color: [90, 90, 90, 255] };
    } else {
      return { type: FLAT, color: [90, 90, 90, 255] };
    }
  });
  var simpleBorder2 = {
    width: 4,
    height: 4,
    data: [
      50,50,50,255, 90,90,90,255, 90,90,90,255, 90,90,90,255,
      0, 0, 0, 255, 50,50,50,255, 90,90,90,255, 90,90,90,255,
      0, 0, 0, 255, 0, 0, 0, 255, 50,50,50,255, 90,90,90,255,
      0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 50,50,50,255
    ]
  };
  var border2 = compareImageUtil.geometricTypeOfPixel(simpleBorder2);
  checkGeometricTypeResult('simpleBorder2', 4, 4, border2, function(x, y, i) {
    if (x === y) {
      return { type: BORDER, color: [90, 90, 90, 255] };
    } else {
      return { type: FLAT, color: x < y ? [0, 0, 0, 255] : [90, 90, 90, 255] };
    }
  });
  var simpleBorder3 = {
    width: 4,
    height: 4,
    data: [
      4, 4, 4, 255, 90,90,90,255, 90,90,90,255, 90,90,90,255,
      0, 0, 0, 255, 30,30,30,255, 90,90,90,255, 90,90,90,255,
      0, 0, 0, 255, 0, 0, 0, 255, 60,60,60,255, 90,90,90,255,
      0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 86,86,86,255
    ]
  };
  var border3 = compareImageUtil.geometricTypeOfPixel(simpleBorder3);
  checkGeometricTypeResult('simpleBorder3', 4, 4, border3, function(x, y, i) {
    if (x === y) {
      return { type: BORDER, color: x < 2 ? [0, 0, 0, 255] : [90, 90, 90, 255] };
    } else {
      return { type: FLAT, color: x < y ? [0, 0, 0, 255] : [90, 90, 90, 255] };
    }
  });
  // gradation
  var blueGradation = {
    width: 4,
    height: 4,
    data: [
      0, 0, 0, 255, 0, 0, 2, 255, 0, 0, 4, 255, 0, 0, 6, 255,
      0, 0, 2, 255, 0, 0, 4, 255, 0, 0, 6, 255, 0, 0, 8, 255,
      0, 0, 4, 255, 0, 0, 6, 255, 0, 0, 8, 255, 0, 0, 10,255,
      0, 0, 6, 255, 0, 0, 8, 255, 0, 0, 10,255, 0, 0, 12,255
    ]
  };
  var result5 = compareImageUtil.geometricTypeOfPixel(blueGradation);
  checkGeometricTypeResult('blueGradation', 4, 4, result5, function(x, y, i) {
    return { type: FLAT, color: [0, 0, (x + y) * 2, 255] };
  });
  var grayscaleGradation1 = {
    width: 4,
    height: 4,
    data: [
      0, 0, 0, 255, 1, 1, 1, 255, 2, 2, 2, 255, 3, 3, 3, 255,
      1, 1, 1, 255, 2, 2, 2, 255, 3, 3, 3, 255, 4, 4, 4, 255,
      2, 2, 2, 255, 3, 3, 3, 255, 4, 4, 4, 255, 5, 5, 5, 255,
      3, 3, 3, 255, 4, 4, 4, 255, 5, 5, 5, 255, 6, 6, 6, 255
    ]
  };
  var result6 = compareImageUtil.geometricTypeOfPixel(grayscaleGradation1);
  checkGeometricTypeResult('grayscaleGradation1', 4, 4, result6, function(x, y, i) {
    return { type: FLAT, color: [(x + y), (x + y), (x + y), 255] };
  });
  var grayscaleGradation2 = {
    width: 4,
    height: 4,
    data: [
      0, 0, 0, 255, 2, 2, 2, 255, 4, 4, 4, 255, 6, 6, 6, 255,
      2, 2, 2, 255, 4, 4, 4, 255, 6, 6, 6, 255, 8, 8, 8, 255,
      4, 4, 4, 255, 6, 6, 6, 255, 8, 8, 8, 255, 10,10,10,255,
      6, 6, 6, 255, 8, 8, 8, 255, 10,10,10,255, 12,12,12,255
    ]
  };
  var result7 = compareImageUtil.geometricTypeOfPixel(grayscaleGradation2);
  checkGeometricTypeResult('grayscaleGradation2', 4, 4, result7, function(x, y, i) {
    return { type: FLAT, color: [(x + y) * 2, (x + y) * 2, (x + y) * 2, 255] };
  });
});

TEST( 'compareImageUtil growingTypedArray', function test() {
  var a = compareImageUtil.growingTypedArray(Uint32Array, 4);
  EXPECT_EQ( 0, a.length() );
  EXPECT_EQ( 4, a.capacity() );
  EXPECT_EQ( 4, a.buffer().length );

  var array1 = a.makeArray();
  EXPECT_EQ( 0, array1.length );

  a.push( 1234 );
  EXPECT_EQ( 1, a.length() );
  EXPECT_EQ( 4, a.capacity() );
  EXPECT_EQ( 1234, a.buffer()[0] );

  var array2 = a.makeArray();
  EXPECT_EQ( 1, array2.length );
  EXPECT_EQ( 1234, array2[0] );

  a.push( 2222 );
  a.push( 3333 );
  a.push( 4444 );
  EXPECT_EQ( 4, a.length() );
  EXPECT_EQ( 4, a.capacity() );
  EXPECT_EQ( 2222, a.buffer()[1] );
  EXPECT_EQ( 3333, a.buffer()[2] );
  EXPECT_EQ( 4444, a.buffer()[3] );

  var array3 = a.makeArray();
  EXPECT_EQ( 4, array3.length );
  EXPECT_EQ( 2222, array3[1] );
  EXPECT_EQ( 3333, array3[2] );
  EXPECT_EQ( 4444, array3[3] );

  a.push( 5555 );
  EXPECT_EQ( 5, a.length() );
  EXPECT_EQ( 8, a.capacity() );
  EXPECT_EQ( 5555, a.buffer()[4] );

  var array4 = a.makeArray();
  EXPECT_EQ( 5, array4.length );
  EXPECT_EQ( 5555, array4[4] );
});

TEST( 'compareImageUtil mergeUniqueColors', function test() {
  var uc1 = {
    colors: [ 0x000000, 0x111122, 0x222222, 0x223344, 0x778899 ],
    counts: [ 1, 2, 3, 4, 5],
    totalCount: 15
  };
  var uc2 = {
    colors: [ 0x000000, 0x111111, 0x111122, 0x223344, 0xddeeff, 0xffeedd ],
    counts: [ 3, 2, 1, 2, 3, 4 ],
    totalCount: 15
  };
  var uc3 = compareImageUtil.mergeUniqueColors(uc1, uc2);
  EXPECT_EQ( 8, uc3.colors.length );
  EXPECT_EQ( 0x000000, uc3.colors[0] );
  EXPECT_EQ( 0x111111, uc3.colors[1] );
  EXPECT_EQ( 0x111122, uc3.colors[2] );
  EXPECT_EQ( 0x222222, uc3.colors[3] );
  EXPECT_EQ( 0x223344, uc3.colors[4] );
  EXPECT_EQ( 0x778899, uc3.colors[5] );
  EXPECT_EQ( 0xddeeff, uc3.colors[6] );
  EXPECT_EQ( 0xffeedd, uc3.colors[7] );
  EXPECT_EQ( 8, uc3.counts.length );
  EXPECT_EQ( 4, uc3.counts[0] );
  EXPECT_EQ( 2, uc3.counts[1] );
  EXPECT_EQ( 3, uc3.counts[2] );
  EXPECT_EQ( 3, uc3.counts[3] );
  EXPECT_EQ( 6, uc3.counts[4] );
  EXPECT_EQ( 5, uc3.counts[5] );
  EXPECT_EQ( 3, uc3.counts[6] );
  EXPECT_EQ( 4, uc3.counts[7] );
  EXPECT_EQ( 30, uc3.totalCount );
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
