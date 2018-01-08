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
  EXPECT_EQ( image.data, image2.data );
  EXPECT_EQ( 0, image2.offset );

  var imageData = { width: 300, height: 200, data: new Uint8Array(240000) };
  var image3 = compareImageUtil.makeImage(imageData);
  EXPECT_EQ( 300, image3.width );
  EXPECT_EQ( 200, image3.height );
  EXPECT_EQ( 300, image3.pitch );
  EXPECT_EQ( imageData.data, image3.data );
  EXPECT_EQ( 0, image3.offset );
});
