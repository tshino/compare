TEST( 'compareUtil clamp', function test() {
  EXPECT( compareUtil.clamp(0, 0, 0) === 0 );
  EXPECT( compareUtil.clamp(0, -1, 1) === 0 );
  EXPECT( compareUtil.clamp(5, 1, 2) === 2 );
  EXPECT( compareUtil.clamp(5, 1, 5) === 5 );
  EXPECT( compareUtil.clamp(5, 1, 10) === 5 );
  EXPECT( compareUtil.clamp(5, 5, 5) === 5 );
  EXPECT( compareUtil.clamp(5, 5, 10) === 5 );
  EXPECT( compareUtil.clamp(5, 8, 10) === 8 );
});

TEST( 'compareUtil calcGCD', function test() {
  EXPECT( compareUtil.calcGCD(1, 1) === 1 );
  EXPECT( compareUtil.calcGCD(1, 10) === 1 );
  EXPECT( compareUtil.calcGCD(1, 10) === 1 );
  EXPECT( compareUtil.calcGCD(10, 8) === 2 );
  EXPECT( compareUtil.calcGCD(60, 75) === 15 );
  EXPECT( compareUtil.calcGCD(1920, 1080) === 120 );
});

TEST( 'compareUtil addComma', function test() {
  EXPECT( compareUtil.addComma(0) === '0' );
  EXPECT( compareUtil.addComma(1) === '1' );
  EXPECT( compareUtil.addComma(100) === '100' );
  EXPECT( compareUtil.addComma(1000) === '1,000' );
  EXPECT( compareUtil.addComma(-1234) === '-1,234' );
  EXPECT( compareUtil.addComma(10000) === '10,000' );
  EXPECT( compareUtil.addComma(123456) === '123,456' );
  EXPECT( compareUtil.addComma(-876543) === '-876,543' );
  EXPECT( compareUtil.addComma(1234567890) === '1,234,567,890' );
});

TEST( 'compareUtil toPercent', function test() {
  EXPECT( compareUtil.toPercent(0)       === '0%' );
  EXPECT( compareUtil.toPercent(0.00001) === '0.00100%' );
  EXPECT( compareUtil.toPercent(0.00005) === '0.00500%' );
  EXPECT( compareUtil.toPercent(0.0001)  === '0.0100%' );
  EXPECT( compareUtil.toPercent(0.0005)  === '0.0500%' );
  EXPECT( compareUtil.toPercent(0.001)   === '0.100%' );
  EXPECT( compareUtil.toPercent(0.005)   === '0.500%' );
  EXPECT( compareUtil.toPercent(0.01)    === '1.00%' );
  EXPECT( compareUtil.toPercent(0.05)    === '5.00%' );
  EXPECT( compareUtil.toPercent(0.09)    === '9.00%' );
  EXPECT( compareUtil.toPercent(0.1)     === '10.0%' );
  EXPECT( compareUtil.toPercent(0.5)     === '50.0%' );
  EXPECT( compareUtil.toPercent(0.9)     === '90.00%' );
  EXPECT( compareUtil.toPercent(0.91)    === '91.00%' );
  EXPECT( compareUtil.toPercent(0.95)    === '95.00%' );
  EXPECT( compareUtil.toPercent(0.99)    === '99.000%' );
  EXPECT( compareUtil.toPercent(0.995)   === '99.500%' );
  EXPECT( compareUtil.toPercent(0.999)   === '99.9000%' );
  EXPECT( compareUtil.toPercent(0.9995)  === '99.9500%' );
  EXPECT( compareUtil.toPercent(0.9999)  === '99.99000%' );
  EXPECT( compareUtil.toPercent(0.99995) === '99.99500%' );
  EXPECT( compareUtil.toPercent(0.99999) === '99.999000%' );
  EXPECT( compareUtil.toPercent(1)       === '100%' );
});

TEST( 'test of async test', function test(done) {
  window.setTimeout(function() {
    EXPECT( true );
    //EXPECT( false );
    done();
  }, 0);
});

TEST( 'compareUtil binaryFromDataURI', function test() {
  // Hello, world!\n
  var datauri = 'data:;base64,SGVsbG8sIHdvcmxkIQo=';
  var binary = compareUtil.binaryFromDataURI(datauri);

  EXPECT( binary.length === 14 );
  EXPECT( binary.at(0) === 0x48 /* H */ );
  EXPECT( binary.at(1) === 0x65 /* e */ );
  EXPECT( binary.at(2) === 0x6c /* l */ );
  EXPECT( binary.at(3) === 0x6c /* l */ );
  EXPECT( binary.at(4) === 0x6f /* o */ );
  EXPECT( binary.at(5) === 0x2c /* , */ );
  EXPECT( binary.at(6) === 0x20 /*   */ );
  EXPECT( binary.at(7) === 0x77 /* w */ );
  EXPECT( binary.at(8) === 0x6f /* o */ );
  EXPECT( binary.at(9) === 0x72 /* r */ );
  EXPECT( binary.at(10) === 0x6c /* l */ );
  EXPECT( binary.at(11) === 0x64 /* d */ );
  EXPECT( binary.at(12) === 0x21 /* ! */ );
  EXPECT( binary.at(13) === 0x0a /* \n */ );

  EXPECT( binary.at(14) === null );
  // EXPECT( binary.at(-1) === null );

  EXPECT( binary.big16(0) === 0x4865 /* He */ );
  EXPECT( binary.big16(1) === 0x656c /* el */ );
  EXPECT( binary.big16(2) === 0x6c6c /* ll */ );
  EXPECT( binary.big16(3) === 0x6c6f /* lo */ );
  EXPECT( binary.little16(0) === 0x6548 /* eH */ );
  EXPECT( binary.little16(1) === 0x6c65 /* le */ );
  EXPECT( binary.little16(2) === 0x6c6c /* ll */ );
  EXPECT( binary.little16(3) === 0x6f6c /* ol */ );
  EXPECT( binary.big32(0) === 0x48656c6c /* Hell */ );
  EXPECT( binary.big32(1) === 0x656c6c6f /* ello */ );
  EXPECT( binary.big32(2) === 0x6c6c6f2c /* llo, */ );
  EXPECT( binary.little32(0) === 0x6c6c6548 /* lleH */ );
  EXPECT( binary.little32(1) === 0x6f6c6c65 /* olle */ );
  EXPECT( binary.little32(2) === 0x2c6f6c6c /* ,oll */ );
});
