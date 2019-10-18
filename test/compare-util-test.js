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
  EXPECT( compareUtil.calcGCD(10, 1) === 1 );
  EXPECT( compareUtil.calcGCD(2, 3) === 1 );
  EXPECT( compareUtil.calcGCD(10, 8) === 2 );
  EXPECT( compareUtil.calcGCD(3, 15) === 3 );
  EXPECT( compareUtil.calcGCD(60, 75) === 15 );
  EXPECT( compareUtil.calcGCD(1920, 1080) === 120 );
  EXPECT( compareUtil.calcGCD(0, 0) === 0 );
  EXPECT( compareUtil.calcGCD(0, 3) === 3 );
  EXPECT( compareUtil.calcGCD(2, 0) === 2 );
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

TEST( 'compareUtil hyphenToMinus', function test() {
  EXPECT_EQ( '', compareUtil.hyphenToMinus('') );
  EXPECT_EQ( '123', compareUtil.hyphenToMinus('123') );
  EXPECT_EQ( '−123', compareUtil.hyphenToMinus('-123') );
  EXPECT_EQ( '1.2345', compareUtil.hyphenToMinus('1.2345') );
  EXPECT_EQ( '−1.2345', compareUtil.hyphenToMinus('-1.2345') );
  EXPECT_EQ( '1.0e−5', compareUtil.hyphenToMinus('1.0e-5') );
  EXPECT_EQ( '−1.0e−5', compareUtil.hyphenToMinus('-1.0e-5') );
});

TEST( 'compareUtil toSignedFixed', function test() {
  // Note: '−' (U+2212 MINUS SIGN) is used instead of '-' (U+002D HYPHEN-MINUS)
  EXPECT_EQ( '+1', compareUtil.toSignedFixed(1.234567, 0) );
  EXPECT_EQ( '−1', compareUtil.toSignedFixed(-1.234567, 0) );
  EXPECT_EQ( '+1.2', compareUtil.toSignedFixed(1.234567, 1) );
  EXPECT_EQ( '−1.2', compareUtil.toSignedFixed(-1.234567, 1) );
  EXPECT_EQ( '+1.23', compareUtil.toSignedFixed(1.234567, 2) );
  EXPECT_EQ( '+1.23457', compareUtil.toSignedFixed(1.234567, 5) );
  EXPECT_EQ( '−1.23457', compareUtil.toSignedFixed(-1.234567, 5) );

  EXPECT_EQ( '0', compareUtil.toSignedFixed(0, 0) );
  EXPECT_EQ( '0.0', compareUtil.toSignedFixed(0, 1) );
  EXPECT_EQ( '0.00', compareUtil.toSignedFixed(0, 2) );
  EXPECT_EQ( '0.00000', compareUtil.toSignedFixed(0, 5) );

  EXPECT_EQ( '0', compareUtil.toSignedFixed(0.01, 0) );
  EXPECT_EQ( '0', compareUtil.toSignedFixed(-0.01, 0) );
  EXPECT_EQ( '0.0', compareUtil.toSignedFixed(0.01, 1) );
  EXPECT_EQ( '0.0', compareUtil.toSignedFixed(-0.01, 1) );
  EXPECT_EQ( '+0.01', compareUtil.toSignedFixed(0.01, 2) );
  EXPECT_EQ( '−0.01', compareUtil.toSignedFixed(-0.01, 2) );
  EXPECT_EQ( '+0.010', compareUtil.toSignedFixed(0.01, 3) );
  EXPECT_EQ( '−0.010', compareUtil.toSignedFixed(-0.01, 3) );

  EXPECT_EQ( '0', compareUtil.toSignedFixed(0) );
  EXPECT_EQ( '+123', compareUtil.toSignedFixed(123) );
  EXPECT_EQ( '−123', compareUtil.toSignedFixed(-123) );
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

TEST( 'compareUtil toHexTriplet', function test() {
  EXPECT_EQ( '#000000', compareUtil.toHexTriplet(0, 0, 0) );
  EXPECT_EQ( '#010101', compareUtil.toHexTriplet(1, 1, 1) );
  EXPECT_EQ( '#FFFFFF', compareUtil.toHexTriplet(255, 255, 255) );
  EXPECT_EQ( '#0000FF', compareUtil.toHexTriplet(0, 0, 255) );
  EXPECT_EQ( '#00FF00', compareUtil.toHexTriplet(0, 255, 0) );
  EXPECT_EQ( '#FF0000', compareUtil.toHexTriplet(255, 0, 0) );
  EXPECT_EQ( '#55AAFF', compareUtil.toHexTriplet(85, 170, 255) );
  EXPECT_EQ( '#123456', compareUtil.toHexTriplet(18, 52, 86) );

  EXPECT_EQ( '#000000', compareUtil.toHexTriplet(-1, -2, -3) );
  EXPECT_EQ( '#FFFFFF', compareUtil.toHexTriplet(257, 300, 1000) );
  EXPECT_EQ( '#101010', compareUtil.toHexTriplet(15.9, 16, 16.1) );
});

TEST( 'compareUtil srgb255ToLinear255', function test() {
  EXPECT_EQ( 0.0, compareUtil.srgb255ToLinear255[0] );
  EXPECT( 1e-5 > Math.abs(0.077399385 - compareUtil.srgb255ToLinear255[1]) );
  EXPECT( 1e-5 > Math.abs(0.386996900 - compareUtil.srgb255ToLinear255[5]) );
  EXPECT( 1e-5 > Math.abs(0.773993799 - compareUtil.srgb255ToLinear255[10]) );
  EXPECT( 1e-5 > Math.abs(0.853366629 - compareUtil.srgb255ToLinear255[11]) );
  EXPECT( 1e-5 > Math.abs(1.218123143 - compareUtil.srgb255ToLinear255[15]) );
  EXPECT( 1e-5 > Math.abs(55.044427526 - compareUtil.srgb255ToLinear255[128]) );
  EXPECT( 1e-5 > Math.abs(134.414357054 - compareUtil.srgb255ToLinear255[192]) );
  EXPECT( 1e-5 > Math.abs(252.731034761 - compareUtil.srgb255ToLinear255[254]) );
  EXPECT_EQ( 255.0, compareUtil.srgb255ToLinear255[255] );
});

TEST( 'compareUtil srgb255ToLinear8', function test() {
  EXPECT_EQ( 0, compareUtil.srgb255ToLinear8[0] );
  EXPECT_EQ( 0, compareUtil.srgb255ToLinear8[1] );
  EXPECT_EQ( 0, compareUtil.srgb255ToLinear8[5] );
  EXPECT_EQ( 1, compareUtil.srgb255ToLinear8[10] );
  EXPECT_EQ( 1, compareUtil.srgb255ToLinear8[11] );
  EXPECT_EQ( 1, compareUtil.srgb255ToLinear8[15] );
  EXPECT_EQ( 55, compareUtil.srgb255ToLinear8[128] );
  EXPECT_EQ( 134, compareUtil.srgb255ToLinear8[192] );
  EXPECT_EQ( 253, compareUtil.srgb255ToLinear8[254] );
  EXPECT_EQ( 255, compareUtil.srgb255ToLinear8[255] );
});

TEST( 'compareUtil convertColorListRgbToLinear', function test() {
  var rgb = [
    0x000000, 0x808080, 0xffffff, 0xff0000, 0x00ff00, 0x0000ff,
    0x010203, 0x090a0b, 0x112233, 0x445566, 0x778899, 0xbbddff
  ];
  var linear = compareUtil.convertColorListRgbToLinear(rgb);
  EXPECT_EQ( rgb.length, linear.length );
  EXPECT_EQ( 0x000000, linear[0] );
  EXPECT_EQ( 0x373737, linear[1] );
  EXPECT_EQ( 0xffffff, linear[2] );
  EXPECT_EQ( 0xff0000, linear[3] );
  EXPECT_EQ( 0x00ff00, linear[4] );
  EXPECT_EQ( 0x0000ff, linear[5] );
  EXPECT_EQ( 0x000000, linear[6] );
  EXPECT_EQ( 0x010101, linear[7] );
  EXPECT_EQ( 0x010408, linear[8] );
  EXPECT_EQ( 0x0f1722, linear[9] );
  EXPECT_EQ( 0x2f3f51, linear[10] );
  EXPECT_EQ( 0x7fb8ff, linear[11] );
});

TEST( 'compareUtil convertColorListRgbToXyy', function test() {
  var rgb = [
    0x000000, 0x808080, 0xffffff,
    0xff0000, 0x00ff00, 0x0000ff,
    0x800000, 0x008000, 0x000080
  ];
  var xyy = compareUtil.convertColorListRgbToXyy(rgb);
  EXPECT_EQ( rgb.length, xyy.length );
  EXPECT_EQ( 0x505400, xyy[0] );    // x=79.74, y=83.90, Y = 0
  EXPECT_EQ( 0x505437, xyy[1] );    // x=79.74, y=83.90, Y = 55.04
  EXPECT_EQ( 0x5054ff, xyy[2] );    // x=79.74, y=83.90, Y = 255
  EXPECT_EQ( 0xa35436, xyy[3] );    // x=163.20, y=84.15, Y = 54.23
  EXPECT_EQ( 0x4d99b6, xyy[4] );    // x=76.50, y=153.00, Y = 182.36
  EXPECT_EQ( 0x260f12, xyy[5] );    // x=38.25, y=15.30, Y = 18.40
  EXPECT_EQ( 0xa3540c, xyy[6] );    // x=163.20, y=84.15, Y = 11.71
  EXPECT_EQ( 0x4d9927, xyy[7] );    // x=76.50, y=153.00, Y = 39.36
  EXPECT_EQ( 0x260f04, xyy[8] );    // x=38.25, y=15.30, Y = 3.97
});

TEST( 'compareUtil convertColorListRgbToHsv', function test() {
  var rgb = [
    0x000000, 0x808080, 0xffffff,
    0xff0000, 0x00ff00, 0x0000ff,
    0x800000, 0x008000, 0x000080,
    0xff8080, 0x80ff80, 0x8080ff
  ];
  var hsv = compareUtil.convertColorListRgbToHsv(rgb);
  EXPECT_EQ( rgb.length, hsv.length );
  EXPECT_EQ( 0x808000, hsv[0] );    // H=0, S=0, V=0
  EXPECT_EQ( 0x808080, hsv[1] );    // H=0, S=0, V=50.2
  EXPECT_EQ( 0x8080ff, hsv[2] );    // H=0, S=0, V=100
  EXPECT_EQ( 0xff80ff, hsv[3] );    // H=0, S=100, V=100
  EXPECT_EQ( 0x40eeff, hsv[4] );    // H=120, S=100, V=100
  EXPECT_EQ( 0x4011ff, hsv[5] );    // H=240, S=100, V=100
  EXPECT_EQ( 0xff8080, hsv[6] );    // H=0, S=100, V=50.2
  EXPECT_EQ( 0x40ee80, hsv[7] );    // H=120, S=100, V=50.2
  EXPECT_EQ( 0x401180, hsv[8] );    // H=240, S=100, V=50.2
  EXPECT_EQ( 0xbf80ff, hsv[9] );    // H=0, S=49.2, V=100
  EXPECT_EQ( 0x60b6ff, hsv[10] );   // H=120, S=49.2, V=100
  EXPECT_EQ( 0x6049ff, hsv[11] );   // H=240, S=49.2, V=100
});

TEST( 'compareUtil convertColorListRgbToHsvLinear', function test() {
  var rgb = [
    0x000000, 0x808080, 0xffffff,
    0xff0000, 0x00ff00, 0x0000ff
  ];
  var hsv = compareUtil.convertColorListRgbToHsvLinear(rgb);
  EXPECT_EQ( rgb.length, hsv.length );
  EXPECT_EQ( 0x808000, hsv[0] );    // H=0, S=0, V=0
  EXPECT_EQ( 0x808037, hsv[1] );    // H=0, S=0, V=21.6
  EXPECT_EQ( 0x8080ff, hsv[2] );    // H=0, S=0, V=100
  EXPECT_EQ( 0xff80ff, hsv[3] );    // H=0, S=100, V=100
  EXPECT_EQ( 0x40eeff, hsv[4] );    // H=120, S=100, V=100
  EXPECT_EQ( 0x4011ff, hsv[5] );    // H=240, S=100, V=100
});

TEST( 'compareUtil convertColorListRgbToHsl', function test() {
  var rgb = [
    0x000000, 0x808080, 0xffffff,
    0xff0000, 0x00ff00, 0x0000ff,
    0x800000, 0x008000, 0x000080,
    0xff8080, 0x80ff80, 0x8080ff
  ];
  var hsl = compareUtil.convertColorListRgbToHsl(rgb);
  EXPECT_EQ( rgb.length, hsl.length );
  EXPECT_EQ( 0x808000, hsl[0] );    // H=0, S=0, L=0
  EXPECT_EQ( 0x808080, hsl[1] );    // H=0, S=0, L=50.2
  EXPECT_EQ( 0x8080ff, hsl[2] );    // H=0, S=0, L=100
  EXPECT_EQ( 0xff8080, hsl[3] );    // H=0, S=100, L=50
  EXPECT_EQ( 0x40ee80, hsl[4] );    // H=120, S=100, L=50
  EXPECT_EQ( 0x401180, hsl[5] );    // H=240, S=100, L=50
  EXPECT_EQ( 0xff8040, hsl[6] );    // H=0, S=100, L=25.1
  EXPECT_EQ( 0x40ee40, hsl[7] );    // H=120, S=100, L=25.1
  EXPECT_EQ( 0x401140, hsl[8] );    // H=240, S=100, L=25.1
  EXPECT_EQ( 0xff80c0, hsl[9] );    // H=0, S=100, L=75.1
  EXPECT_EQ( 0x40eec0, hsl[10] );   // H=120, S=100, L=75.1
  EXPECT_EQ( 0x4011c0, hsl[11] );   // H=240, S=100, L=75.1
});

TEST( 'compareUtil convertColorListRgbToHslLinear', function test() {
  var rgb = [
    0x000000, 0x808080, 0xffffff,
    0xff0000, 0x00ff00, 0x0000ff
  ];
  var hsl = compareUtil.convertColorListRgbToHslLinear(rgb);
  EXPECT_EQ( rgb.length, hsl.length );
  EXPECT_EQ( 0x808000, hsl[0] );    // H=0, S=0, L=0
  EXPECT_EQ( 0x808037, hsl[1] );    // H=0, S=0, L=21.6
  EXPECT_EQ( 0x8080ff, hsl[2] );    // H=0, S=0, L=100
  EXPECT_EQ( 0xff8080, hsl[3] );    // H=0, S=100, L=50
  EXPECT_EQ( 0x40ee80, hsl[4] );    // H=120, S=100, L=50
  EXPECT_EQ( 0x401180, hsl[5] );    // H=240, S=100, L=50
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

TEST( 'compareUtil calcMinMaxMean', function test() {
  var m, calcMinMaxMean = compareUtil.calcMinMaxMean;
  EXPECT_EQ( null, calcMinMaxMean([]) );
  m = calcMinMaxMean([0, 0, 0]);
  EXPECT( m.min === 0 && m.max === 0 && m.mean === 0 );
  m = calcMinMaxMean([-1, 0, 1]);
  EXPECT( m.min === -1 && m.max === 1 && m.mean === 0 );
  m = calcMinMaxMean([-1, -2, -3]);
  EXPECT( m.min === -3 && m.max === -1 && m.mean === -2 );
  m = calcMinMaxMean([10, 20, 90]);
  EXPECT( m.min === 10 && m.max === 90 && m.mean === 40 );
});

TEST( 'compareUtil findNearlyConstantValue', function test() {
  var findNearlyConstantValue = compareUtil.findNearlyConstantValue;
  EXPECT_EQ( null, findNearlyConstantValue([], 0.01) );
  EXPECT_EQ( null, findNearlyConstantValue([0.5], 0.01) );
  EXPECT_EQ( 0.5, findNearlyConstantValue([0.5, 0.5], 0.01) );
  EXPECT_EQ( 0.5, findNearlyConstantValue([0.5, 0.5, 0.5, 0.5, 0.5, 0.5], 0.01) );

  EXPECT_EQ( null, findNearlyConstantValue([0.5, 0.75, 0.5, 0.75], 0.1) );
  EXPECT_EQ( 0.625, findNearlyConstantValue([0.5, 0.75, 0.5, 0.75], 0.2) );
  EXPECT_EQ( 0.625, findNearlyConstantValue([0.5, 0.75, 0.5, 0.75, 0.5], 0.2) );

  EXPECT_EQ( 2.5, findNearlyConstantValue([2, 3, 2, 3, 2, 3], 1) );
  EXPECT_EQ( 2.5, findNearlyConstantValue([2, 3, 2, 3, 2, 3, 2], 1) );
  EXPECT_EQ( 2.5, findNearlyConstantValue([3, 2, 3, 2, 3, 2, 3], 1) );
  EXPECT_EQ( 2.5, findNearlyConstantValue([3, 2, 2, 3, 2, 3, 3, 2, 2, 3], 1) );

  EXPECT_EQ( 12/5, findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2, 3, 2, 2, 3], 1) );
  EXPECT_EQ( 12/5, findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2, 3, 2, 2], 1) );
  EXPECT_EQ( 12/5, findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2, 3, 2], 1) );
  EXPECT_EQ( 12/5, findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2, 3], 1) );
  EXPECT_EQ( null, findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 1], 1) );
  EXPECT_EQ( 12/5, findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2], 1) );
  EXPECT_EQ( 12/5, findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 3], 1) );
  EXPECT_EQ( null, findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 4], 1) );

  EXPECT_EQ( 1/24, findNearlyConstantValue([
    0.04, 0.04, 0.05, 0.04, 0.04, 0.04,
    0.04, 0.04, 0.05, 0.04, 0.04, 0.04,
    0.04, 0.04, 0.05, 0.04, 0.04, 0.04,
    0.04, 0.04, 0.05, 0.05], 0.01 + 1e-7) );

  EXPECT_EQ( null, findNearlyConstantValue([0, 1, 2, 3, 4], 1) );
  EXPECT_EQ( 2, findNearlyConstantValue([0, 1, 2, 3, 4], 2) );
  EXPECT_EQ( null, findNearlyConstantValue([0, 3, 4, 3, 4, 3, 4, 3, 4], 2) );
});

(function(){
  // TextEncoder polyfill from <https://developer.mozilla.org/ja/docs/Web/API/TextEncoder>
  if (typeof TextEncoder === "undefined") {
      TextEncoder=function TextEncoder(){};
      TextEncoder.prototype.encode = function encode(str) {
          "use strict";
          var Len = str.length, resPos = -1;
          // The Uint8Array's length must be at least 3x the length of the string because an invalid UTF-16
          //  takes up the equivelent space of 3 UTF-8 characters to encode it properly. However, Array's
          //  have an auto expanding length and 1.5x should be just the right balance for most uses.
          var resArr = typeof Uint8Array === "undefined" ? new Array(Len * 1.5) : new Uint8Array(Len * 3);
          for (var point=0, nextcode=0, i = 0; i !== Len; ) {
              point = str.charCodeAt(i), i += 1;
              if (point >= 0xD800 && point <= 0xDBFF) {
                  if (i === Len) {
                      resArr[resPos += 1] = 0xef/*0b11101111*/; resArr[resPos += 1] = 0xbf/*0b10111111*/;
                      resArr[resPos += 1] = 0xbd/*0b10111101*/; break;
                  }
                  // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
                  nextcode = str.charCodeAt(i);
                  if (nextcode >= 0xDC00 && nextcode <= 0xDFFF) {
                      point = (point - 0xD800) * 0x400 + nextcode - 0xDC00 + 0x10000;
                      i += 1;
                      if (point > 0xffff) {
                          resArr[resPos += 1] = (0x1e/*0b11110*/<<3) | (point>>>18);
                          resArr[resPos += 1] = (0x2/*0b10*/<<6) | ((point>>>12)&0x3f/*0b00111111*/);
                          resArr[resPos += 1] = (0x2/*0b10*/<<6) | ((point>>>6)&0x3f/*0b00111111*/);
                          resArr[resPos += 1] = (0x2/*0b10*/<<6) | (point&0x3f/*0b00111111*/);
                          continue;
                      }
                  } else {
                      resArr[resPos += 1] = 0xef/*0b11101111*/; resArr[resPos += 1] = 0xbf/*0b10111111*/;
                      resArr[resPos += 1] = 0xbd/*0b10111101*/; continue;
                  }
              }
              if (point <= 0x007f) {
                  resArr[resPos += 1] = (0x0/*0b0*/<<7) | point;
              } else if (point <= 0x07ff) {
                  resArr[resPos += 1] = (0x6/*0b110*/<<5) | (point>>>6);
                  resArr[resPos += 1] = (0x2/*0b10*/<<6)  | (point&0x3f/*0b00111111*/);
              } else {
                  resArr[resPos += 1] = (0xe/*0b1110*/<<4) | (point>>>12);
                  resArr[resPos += 1] = (0x2/*0b10*/<<6)    | ((point>>>6)&0x3f/*0b00111111*/);
                  resArr[resPos += 1] = (0x2/*0b10*/<<6)    | (point&0x3f/*0b00111111*/);
              }
          }
          if (typeof Uint8Array !== "undefined") return resArr.subarray(0, resPos + 1);
          // else // IE 6-9
          resArr.length = resPos + 1; // trim off extra weight
          return resArr;
      };
      TextEncoder.prototype.toString = function(){return "[object TextEncoder]"};
      try { // Object.defineProperty only works on DOM prototypes in IE8
          Object.defineProperty(TextEncoder.prototype,"encoding",{
              get:function(){if(TextEncoder.prototype.isPrototypeOf(this)) return"utf-8";
                             else throw TypeError("Illegal invocation");}
          });
      } catch(e) { /*IE6-8 fallback*/ TextEncoder.prototype.encoding = "utf-8"; }
      if(typeof Symbol!=="undefined")TextEncoder.prototype[Symbol.toStringTag]="TextEncoder";
  }

  var detect = function(content) {
    if (typeof content === 'string') {
      var u8array = (new TextEncoder).encode(content);
    } else {
      var u8array = new Uint8Array(content);
    }
    var datauri = jsTestUtil.dataURIFromArrayBuffer(u8array);
    var binary = compareUtil.binaryFromDataURI(datauri);
    var format = compareUtil.detectImageFormat(binary);
    return format;
  };
  TEST( 'compareUtil detectImageFormat', function test() {
    EXPECT_EQ( null, detect([]) );
    EXPECT_EQ( null, detect([0, 1, 2, 3]) );
  });

  TEST( 'compareUtil detectImageFormat PNG', function test() {
    var f = detect([0x89, 0x50, 0x4e, 0x47]);
    EXPECT_EQ( 'PNG', f.toString() );
    EXPECT_EQ( 'unknown', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0x08, 0x61, 0x63, 0x54, 0x4C, // acTL
      0, 0, 0, 0x01, 0, 0, 0, 0
    ]);
    EXPECT_EQ( 'PNG (APNG)', f.toString() );
    EXPECT_EQ( 'unknown', f.color );
    EXPECT_EQ( 1, f.anim && f.anim.frameCount );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x01, 0x00, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'Grayscale 1 (1bpp)', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x02, 0x00, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'Grayscale 2 (2bpp)', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x04, 0x00, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'Grayscale 4 (4bpp)', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x08, 0x00, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'Grayscale 8 (8bpp)', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x10, 0x00, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'Grayscale 16 (16bpp)', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x10, 0x00, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0x00, 0x74, 0x52, 0x4e, 0x53, // tRNS
    ]);
    EXPECT_EQ( 'Grayscale 16 (16bpp) + Transparent', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x08, 0x02, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'RGB 8.8.8 (24bpp)', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x10, 0x02, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'RGB 16.16.16 (48bpp)', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x10, 0x02, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0x00, 0x74, 0x52, 0x4e, 0x53, // tRNS
    ]);
    EXPECT_EQ( 'RGB 16.16.16 (48bpp) + Transparent', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x01, 0x03, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'Indexed RGB 8.8.8 (1bpp)', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x02, 0x03, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'Indexed RGB 8.8.8 (2bpp)', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x04, 0x03, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'Indexed RGB 8.8.8 (4bpp)', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x08, 0x03, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'Indexed RGB 8.8.8 (8bpp)', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x04, 0x03, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0x00, 0x74, 0x52, 0x4e, 0x53, // tRNS
    ]);
    EXPECT_EQ( 'Indexed RGBA 8.8.8.8 (4bpp)', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x08, 0x04, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'Grayscale+Alpha 8.8 (16bpp)', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x10, 0x04, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'Grayscale+Alpha 16.16 (32bpp)', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x08, 0x06, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'RGBA 8.8.8.8 (32bpp)', f.color );

    var f = detect([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0, 0, 0, 0, 0, 0, 0, 0, 0x10, 0x06, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'RGBA 16.16.16.16 (64bpp)', f.color );
  });

  TEST( 'compareUtil detectImageFormat GIF', function test() {
    var f = detect([0x47, 0x49, 0x46, 0x38]);
    EXPECT_EQ( 'GIF', f.toString() );
    EXPECT_EQ( 'unknown', f.color );

    var f = detect([
      0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x00, 0, 0,
      0x21, 0xff, // Application Extension
      10, 0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, // NETS CAPE
      0, 0, 0,
    ]);
    EXPECT_EQ( 'GIF (Animated)', f.toString() );
    EXPECT_EQ( 'unknown', f.color );
    EXPECT_EQ( 0, f.anim && f.anim.frameCount );
    EXPECT_EQ( 0, f.anim && f.anim.durationNum );

    var f = detect([
      0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x80, 0, 0, // GCT: 1bit
      0x00, 0x00, 0x00, 0xff, 0xff, 0xff,
      0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, // no LCT
    ]);
    EXPECT_EQ( 'GIF', f.toString() );
    EXPECT_EQ( 'Indexed RGB 8.8.8 (1bpp)', f.color );

    var f = detect([
      0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x80, 0, 0, // GCT: 1bit
      0x00, 0x00, 0x00, 0xff, 0xff, 0xff,
      0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x81, // LCT: 2bit
    ]);
    EXPECT_EQ( 'GIF', f.toString() );
    EXPECT_EQ( 'Indexed RGB 8.8.8 (2bpp)', f.color );

    var f = detect([
      0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x00, 0, 0, // no GCT
      0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x82, // LCT: 3bit
    ]);
    EXPECT_EQ( 'GIF', f.toString() );
    EXPECT_EQ( 'Indexed RGB 8.8.8 (3bpp)', f.color );

    var f = detect([
      0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x83, 0, 0, // GCT: 4bit
      0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x22, 0x22, 0x22, 0x33, 0x33, 0x33,
      0x44, 0x44, 0x44, 0x55, 0x55, 0x55, 0x66, 0x66, 0x66, 0x77, 0x77, 0x77,
      0x88, 0x88, 0x88, 0x99, 0x99, 0x99, 0xaa, 0xaa, 0xaa, 0xbb, 0xbb, 0xbb,
      0xcc, 0xcc, 0xcc, 0xdd, 0xdd, 0xdd, 0xee, 0xee, 0xee, 0xff, 0xff, 0xff,
      0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, // no LCT
    ]);
    EXPECT_EQ( 'Indexed RGB 8.8.8 (4bpp)', f.color );

    var f = detect([
      0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x00, 0, 0, // no GCT
      0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x84, // LCT: 5bit
    ]);
    EXPECT_EQ( 'Indexed RGB 8.8.8 (5bpp)', f.color );

    var f = detect([
      0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x00, 0, 0, // no GCT
      0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x85, // LCT: 6bit
    ]);
    EXPECT_EQ( 'Indexed RGB 8.8.8 (6bpp)', f.color );

    var f = detect([
      0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x00, 0, 0, // no GCT
      0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x86, // LCT: 7bit
    ]);
    EXPECT_EQ( 'Indexed RGB 8.8.8 (7bpp)', f.color );

    var f = detect([
      0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x00, 0, 0, // no GCT
      0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x87, // LCT: 8bit
    ]);
    EXPECT_EQ( 'Indexed RGB 8.8.8 (8bpp)', f.color );

    var f = detect([
      0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x00, 0, 0,
      0x21, 0xf9, 4, 0x01, 4, 0, 255, 0, // Graphic Control Extension
      0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x87, // LCT: 8bit
    ]);
    EXPECT_EQ( 'GIF', f.toString() );
    EXPECT_EQ( 'Indexed RGB 8.8.8 (8bpp) + Transparent', f.color );
  });

  TEST( 'compareUtil detectImageFormat BMP', function test() {
    var f = detect([0x42, 0x4d, 0, 0]);
    EXPECT_EQ( 'BMP', f.toString() );
    EXPECT_EQ( 'unknown', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x01, 0x00, // Windows style
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'Indexed RGB 8.8.8 (1bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      12, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x01, 0x00, // OS/2 style
    ]);
    EXPECT_EQ( 'Indexed RGB 8.8.8 (1bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x04, 0x00, // Windows style
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'Indexed RGB 8.8.8 (4bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      12, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x04, 0x00, // OS/2 style
    ]);
    EXPECT_EQ( 'Indexed RGB 8.8.8 (4bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x08, 0x00, // Windows style
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'Indexed RGB 8.8.8 (8bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      12, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x08, 0x00, // OS/2 style
    ]);
    EXPECT_EQ( 'Indexed RGB 8.8.8 (8bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'RGB 5.5.5 (16bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      12, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // OS/2 style
    ]);
    EXPECT_EQ( 'RGB 5.5.5 (16bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
      40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=40
      0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
      0x00, 0x7c, 0, 0, 0xe0, 0x03, 0, 0, 0x1f, 0x00, 0, 0,
    ]);
    EXPECT_EQ( 'RGB 5.5.5 (16bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
      40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=40
      0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
      0x00, 0xf8, 0, 0, 0xe0, 0x07, 0, 0, 0x1f, 0x00, 0, 0,
    ]);
    EXPECT_EQ( 'RGB 5.6.5 (16bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
      40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=40
      0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
      0x00, 0x0e, 0, 0, 0xe0, 0x01, 0, 0, 0x1f, 0x00, 0, 0,
    ]);
    EXPECT_EQ( 'RGB 3.4.5 (16bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
      40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=40
      0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
      0x00, 0xfe, 0, 0, 0x00, 0x00, 0, 0, 0x00, 0x00, 0, 0,
    ]);
    EXPECT_EQ( 'R 7 (16bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
      40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=40
      0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
      0x00, 0x00, 0, 0, 0xff, 0xff, 0, 0, 0x00, 0x00, 0, 0,
    ]);
    EXPECT_EQ( 'G 16 (16bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
      40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=40
      0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
      0x00, 0x00, 0, 0, 0x00, 0xff, 0, 0, 0xff, 0x00, 0, 0,
    ]);
    EXPECT_EQ( 'GB 8.8 (16bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
      56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=56
      0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
      0x00, 0x0e, 0, 0, 0xe0, 0x01, 0, 0, 0x1f, 0x00, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'RGB 3.4.5 (16bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
      56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=56
      0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
      0x00, 0x0e, 0, 0, 0xe0, 0x01, 0, 0, 0x1f, 0x00, 0, 0, 0x00, 0xf0, 0, 0,
    ]);
    EXPECT_EQ( 'RGBA 3.4.5.4 (16bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
      56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=56
      0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
      0x00, 0xff, 0, 0, 0x00, 0x00, 0, 0, 0x00, 0x00, 0, 0, 0xff, 0x00, 0, 0,
    ]);
    EXPECT_EQ( 'RA 8.8 (16bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x18, 0x00, // Windows style
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'RGB 8.8.8 (24bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      12, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x18, 0x00, // OS/2 style
    ]);
    EXPECT_EQ( 'RGB 8.8.8 (24bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x20, 0x00, // Windows style
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'RGB 8.8.8 (32bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      12, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x20, 0x00, // OS/2 style
    ]);
    EXPECT_EQ( 'RGB 8.8.8 (32bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
      40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x20, 0x00, // Windows style, biSize=40
      0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
      0x00, 0x00, 0xfe, 0, 0x00, 0xfe, 0x01, 0, 0xff, 0x01, 0x00, 0,
    ]);
    EXPECT_EQ( 'RGB 7.8.9 (32bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
      40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x20, 0x00, // Windows style, biSize=40
      0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
      0, 0, 0, 0, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00,
    ]);
    EXPECT_EQ( 'GB 16.16 (32bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
      56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x20, 0x00, // Windows style, biSize=56
      0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
      0x00, 0x00, 0xf0, 0x3f, 0x00, 0xfc, 0x0f, 0x00, 0xff, 0x03, 0x00, 0x00, 0, 0, 0, 0,
    ]);
    EXPECT_EQ( 'RGB 10.10.10 (32bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
      56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x20, 0x00, // Windows style, biSize=56
      0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
      0xff, 0x00, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00, 0x00, 0xff,
    ]);
    EXPECT_EQ( 'RGBA 8.8.8.8 (32bpp)', f.color );

    var f = detect([
      0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
      56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x20, 0x00, // Windows style, biSize=56
      0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
      0xff, 0x0f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0xff, 0x00,
    ]);
    EXPECT_EQ( 'RA 12.12 (32bpp)', f.color );
  });

  TEST( 'compareUtil detectImageFormat JPEG', function test() {
    var f = detect([0xff, 0xd8, 0xff, 0xe0]);
    EXPECT_EQ( 'JPEG', f.toString() );
    EXPECT_EQ( 'unknown', f.color );

    var f = detect([
      0xff, 0xd8, // SOI
      0xff, 0xe2, 0, 6, 0x4d, 0x50, 0x46, 0x00 // APP2 'MPF\0'
    ]);
    EXPECT_EQ( 'JPEG (MPF)', f.toString() );
    EXPECT_EQ( 'unknown', f.color );

    var f = detect([
      0xff, 0xd8, // SOI
      0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 1,   // SOF0
    ]);
    EXPECT_EQ( 'Grayscale 8 (8bpp)', f.color );

    var f = detect([
      0xff, 0xd8, // SOI
      0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
    ]);
    EXPECT_EQ( 'YCbCr 8.8.8', f.color );

    var f = detect([
      0xff, 0xd8, // SOI
      0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
      0, 0x22, 0, 0, 0x21, 0, 0, 0x12, 0,   // sampling pattern
    ]);
    EXPECT_EQ( 'YCbCr 8.8.8 (uncommon sampling Y=2x2 Cb=2x1 Cr=1x2)', f.color );

    var f = detect([
      0xff, 0xd8, // SOI
      0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
      0, 0x11, 0, 0, 0x11, 0, 0, 0x11, 0,   // sampling pattern
    ]);
    EXPECT_EQ( 'YCbCr 8.8.8 (24bpp 4:4:4)', f.color );

    var f = detect([
      0xff, 0xd8, // SOI
      0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
      0, 0x22, 0, 0, 0x22, 0, 0, 0x22, 0,   // sampling pattern (redundant notation)
    ]);
    EXPECT_EQ( 'YCbCr 8.8.8 (24bpp 4:4:4-variant Y=2x2 Cb=2x2 Cr=2x2)', f.color );

    var f = detect([
      0xff, 0xd8, // SOI
      0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
      0, 0x21, 0, 0, 0x11, 0, 0, 0x11, 0,   // sampling pattern
    ]);
    EXPECT_EQ( 'YCbCr 8.8.8 (16bpp 4:2:2)', f.color );

    var f = detect([
      0xff, 0xd8, // SOI
      0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
      0, 0x12, 0, 0, 0x11, 0, 0, 0x11, 0,   // sampling pattern
    ]);
    EXPECT_EQ( 'YCbCr 8.8.8 (16bpp 4:4:0)', f.color );

    var f = detect([
      0xff, 0xd8, // SOI
      0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
      0, 0x22, 0, 0, 0x11, 0, 0, 0x11, 0,   // sampling pattern
    ]);
    EXPECT_EQ( 'YCbCr 8.8.8 (12bpp 4:2:0)', f.color );

    var f = detect([
      0xff, 0xd8, // SOI
      0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
      0, 0x41, 0, 0, 0x11, 0, 0, 0x11, 0,   // sampling pattern
    ]);
    EXPECT_EQ( 'YCbCr 8.8.8 (12bpp 4:1:1)', f.color );

    var f = detect([
      0xff, 0xd8, // SOI
      0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
      0, 0x31, 0, 0, 0x11, 0, 0, 0x11, 0,   // sampling pattern
    ]);
    EXPECT_EQ( 'YCbCr 8.8.8 (40/3 bpp 3:1:1)', f.color );

    var f = detect([
      0xff, 0xd8, // SOI
      0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
      0, 0x42, 0, 0, 0x11, 0, 0, 0x11, 0,   // sampling pattern
    ]);
    EXPECT_EQ( 'YCbCr 8.8.8 (10bpp 4:1:0)', f.color );
  });

  TEST( 'compareUtil detectImageFormat TIFF', function test() {
    var f = detect([0x4d, 0x4d, 0x00, 0x2a]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'unknown', f.color );

    var f = detect([0x49, 0x49, 0x2a, 0x00]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'unknown', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 1,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, // PhotometricInterpretation = 0
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'Grayscale 1 (1bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 2,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
      0x01, 0x02, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // BitsPerSample = [1]
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'Grayscale 1 (1bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 2,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
      0x01, 0x02, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // BitsPerSample = [2]
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'Grayscale 2 (2bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 2,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
      0x01, 0x02, 0, 3, 0, 0, 0, 1, 0, 4, 0, 0, // BitsPerSample = [4]
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'Grayscale 4 (4bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 2,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
      0x01, 0x02, 0, 3, 0, 0, 0, 1, 0, 8, 0, 0, // BitsPerSample = [8]
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'Grayscale 8 (8bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 2,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
      0x01, 0x02, 0, 3, 0, 0, 0, 1, 0, 16, 0, 0, // BitsPerSample = [16]
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'Grayscale 16 (16bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 3,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
      0x01, 0x02, 0, 3, 0, 0, 0, 2, 0, 8, 0, 8, // BitsPerSample = [8, 8]
      0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // ExtraSamples [1]
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'Grayscale+Alpha (pre-multiplied) 8.8 (16bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 3,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
      0x01, 0x02, 0, 3, 0, 0, 0, 2, 0, 8, 0, 4, // BitsPerSample = [8, 4]
      0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // ExtraSamples [1]
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'Grayscale+Alpha (pre-multiplied) 8.4 (12bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 3,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
      0x01, 0x02, 0, 3, 0, 0, 0, 2, 0, 4, 0, 8, // BitsPerSample = [4, 8]
      0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // ExtraSamples [2]
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'Grayscale+Alpha 4.8 (12bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 3,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
      0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 3, 0, 0, // SamplesPerPixel = 3
      0x01, 0x02, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0x2e, // BitsPerSample = [8, 8, 8]
      0, 8, 0, 8, 0, 8,
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'RGB 8.8.8 (24bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 3,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
      0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 3, 0, 0, // SamplesPerPixel = 3
      0x01, 0x02, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0x2e, // BitsPerSample = [16, 16, 16]
      0, 16, 0, 16, 0, 16,
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'RGB 16.16.16 (48bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 4,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
      0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 4, 0, 0, // SamplesPerPixel = 4
      0x01, 0x02, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0x3a, // BitsPerSample = [8, 8, 8, 8]
      0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // ExtraSamples [1]
      0, 8, 0, 8, 0, 8, 0, 8
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'RGBA (pre-multiplied) 8.8.8.8 (32bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 4,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
      0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 4, 0, 0, // SamplesPerPixel = 4
      0x01, 0x02, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0x3a, // BitsPerSample = [16, 16, 16, 16]
      0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // ExtraSamples [1]
      0, 16, 0, 16, 0, 16, 0, 16
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'RGBA (pre-multiplied) 16.16.16.16 (64bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 4,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
      0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 4, 0, 0, // SamplesPerPixel = 4
      0x01, 0x02, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0x3a, // BitsPerSample = [8, 8, 8, 16]
      0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // ExtraSamples [1]
      0, 8, 0, 8, 0, 8, 0, 16
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'RGBA (pre-multiplied) 8.8.8.16 (40bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 4,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
      0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 4, 0, 0, // SamplesPerPixel = 4
      0x01, 0x02, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0x3a, // BitsPerSample = [8, 8, 8, 8]
      0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // ExtraSamples [2]
      0, 8, 0, 8, 0, 8, 0, 8
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'RGBA 8.8.8.8 (32bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 4,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
      0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 4, 0, 0, // SamplesPerPixel = 4
      0x01, 0x02, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0x3a, // BitsPerSample = [16, 16, 16, 16]
      0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // ExtraSamples [2]
      0, 16, 0, 16, 0, 16, 0, 16
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'RGBA 16.16.16.16 (64bpp)', f.color );

    var f = detect([
      0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 4,
      0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
      0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 4, 0, 0, // SamplesPerPixel = 4
      0x01, 0x02, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0x3a, // BitsPerSample = [16, 16, 16, 8]
      0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // ExtraSamples [2]
      0, 16, 0, 16, 0, 16, 0, 8
    ]);
    EXPECT_EQ( 'TIFF', f.toString() );
    EXPECT_EQ( 'RGBA 16.16.16.8 (56bpp)', f.color );
  });

  TEST( 'compareUtil detectImageFormat WebP', function test() {
    var f = detect([0x52, 0x49, 0x46, 0x46, 0,0,0,0, 0x57, 0x45, 0x42, 0x50]);
    EXPECT_EQ( 'WebP', f.toString() );
    EXPECT_EQ( 'unknown', f.color );

    var f = detect([0x52, 0x49, 0x46, 0x46, 0,0,0,0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20]); // 'VP8 '
    EXPECT_EQ( 'WebP (Lossy)', f.toString() );
    EXPECT_EQ( 'unknown', f.color );

    var f = detect([0x52, 0x49, 0x46, 0x46, 0,0,0,0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4C]); // 'VP8L'
    EXPECT_EQ( 'WebP (Lossless)', f.toString() );
    EXPECT_EQ( 'unknown', f.color );

    var f = detect([
      0x52, 0x49, 0x46, 0x46, 0,0,0,0, 0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
      0x00, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
      0x56, 0x50, 0x38, 0x20, 0, 0, 0, 0 // 'VP8 '
    ]);
    EXPECT_EQ( 'WebP (Lossy)', f.toString() );
    EXPECT_EQ( 'unknown', f.color );

    var f = detect([
      0x52, 0x49, 0x46, 0x46, 0,0,0,0, 0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
      0x00, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
      0x56, 0x50, 0x38, 0x4C, 0, 0, 0, 0 // 'VP8L'
    ]);
    EXPECT_EQ( 'WebP (Lossless)', f.toString() );
    EXPECT_EQ( 'unknown', f.color );

    var f = detect([
      0x52, 0x49, 0x46, 0x46, 0,0,0,0, 0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
      0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0
    ]);
    EXPECT_EQ( 'WebP (Animated)', f.toString() );
    EXPECT_EQ( 'unknown', f.color );
    EXPECT_EQ( 0, f.anim && f.anim.frameCount );
    EXPECT_EQ( 0, f.anim && f.anim.durationNum );

    var f = detect([
      0x52, 0x49, 0x46, 0x46, 0,0,0,0, 0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
      0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
      0x41, 0x4E, 0x4D, 0x46, 0x18, 0, 0, 0, // 'ANMF'
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0,
      0x56, 0x50, 0x38, 0x20, 0, 0, 0, 0, // 'VP8 '
    ]);
    EXPECT_EQ( 'WebP (Animated Lossy)', f.toString() );
    EXPECT_EQ( 'unknown', f.color );
    EXPECT_EQ( 1, f.anim && f.anim.frameCount );
    EXPECT_EQ( 40, f.anim && f.anim.durationNum );
    EXPECT_EQ( 1000, f.anim && f.anim.durationDen );

    var f = detect([
      0x52, 0x49, 0x46, 0x46, 0,0,0,0, 0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
      0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
      0x41, 0x4E, 0x4D, 0x46, 0x18, 0, 0, 0, // 'ANMF'
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0,
      0x56, 0x50, 0x38, 0x4c, 0, 0, 0, 0, // 'VP8L'
    ]);
    EXPECT_EQ( 'WebP (Animated Lossless)', f.toString() );
    EXPECT_EQ( 'unknown', f.color );
    EXPECT_EQ( 1, f.anim && f.anim.frameCount );
    EXPECT_EQ( 40, f.anim && f.anim.durationNum );
    EXPECT_EQ( 1000, f.anim && f.anim.durationDen );

    var f = detect([
      0x52, 0x49, 0x46, 0x46, 0,0,0,0, 0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
      0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
      0x41, 0x4E, 0x4D, 0x46, 0x18, 0, 0, 0, // 'ANMF'
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0,
      0x56, 0x50, 0x38, 0x20, 0, 0, 0, 0, // 'VP8 '
      0x41, 0x4E, 0x4D, 0x46, 0x18, 0, 0, 0, // 'ANMF'
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0,
      0x56, 0x50, 0x38, 0x4c, 0, 0, 0, 0, // 'VP8L'
    ]);
    EXPECT_EQ( 'WebP (Animated Lossy+Lossless)', f.toString() );
    EXPECT_EQ( 'unknown', f.color );
    EXPECT_EQ( 2, f.anim && f.anim.frameCount );
    EXPECT_EQ( 80, f.anim && f.anim.durationNum );
    EXPECT_EQ( 1000, f.anim && f.anim.durationDen );
  });

  TEST( 'compareUtil detectImageFormat SVG', function test() {
    var f = detect('<?xml ?><svg');
    EXPECT_EQ( 'SVG', f && f.toString() );
    EXPECT_EQ( undefined, f && f.color );

    var BOM = '\ufeff';
    var f = detect(BOM + '<?xml ?><svg');
    EXPECT_EQ( 'SVG', f && f.toString() );
    EXPECT_EQ( undefined, f && f.color );
  });
})();

TEST( 'compareUtil orientationUtil toString', function test() {
  var toString = compareUtil.orientationUtil.toString;
  EXPECT_EQ( 'TopLeft', toString(1) );
  EXPECT_EQ( 'TopRight', toString(2) );
  EXPECT_EQ( 'BottomRight', toString(3) );
  EXPECT_EQ( 'BottomLeft', toString(4) );
  EXPECT_EQ( 'LeftTop', toString(5) );
  EXPECT_EQ( 'RightTop', toString(6) );
  EXPECT_EQ( 'RightBottom', toString(7) );
  EXPECT_EQ( 'LeftBottom', toString(8) );
  EXPECT_EQ( 'Invalid', toString(9) );
  EXPECT_EQ( 'Invalid', toString(0) );
  EXPECT_EQ( '‐', toString(null) );
});
TEST( 'compareUtil orientationUtil isTransposed', function test() {
  var isTransposed = compareUtil.orientationUtil.isTransposed;
  EXPECT_EQ( false, isTransposed(1) );
  EXPECT_EQ( false, isTransposed(2) );
  EXPECT_EQ( false, isTransposed(3) );
  EXPECT_EQ( false, isTransposed(4) );
  EXPECT_EQ( true, isTransposed(5) );
  EXPECT_EQ( true, isTransposed(6) );
  EXPECT_EQ( true, isTransposed(7) );
  EXPECT_EQ( true, isTransposed(8) );
  EXPECT_EQ( false, isTransposed(9) );
  EXPECT_EQ( false, isTransposed(0) );
  EXPECT_EQ( false, isTransposed(null) );
});
TEST( 'compareUtil orientationUtil getCSSTransform', function test() {
  var getCSSTransform = compareUtil.orientationUtil.getCSSTransform;
  EXPECT_EQ( '', getCSSTransform(1) );
  EXPECT_EQ( ' scale(-1,1)', getCSSTransform(2) );
  EXPECT_EQ( ' rotate(180deg)', getCSSTransform(3) );
  EXPECT_EQ( ' scale(-1,1) rotate(180deg)', getCSSTransform(4) );
  EXPECT_EQ( ' scale(-1,1) rotate(90deg)', getCSSTransform(5) );
  EXPECT_EQ( ' rotate(90deg)', getCSSTransform(6) );
  EXPECT_EQ( ' scale(-1,1) rotate(-90deg)', getCSSTransform(7) );
  EXPECT_EQ( ' rotate(-90deg)', getCSSTransform(8) );
  EXPECT_EQ( '', getCSSTransform(9) );
  EXPECT_EQ( '', getCSSTransform(0) );
  EXPECT_EQ( '', getCSSTransform(null) );
});
TEST( 'compareUtil orientationUtil interpretXY', function test() {
  var interpretXY = compareUtil.orientationUtil.interpretXY;
  EXPECT_EQ( 10, interpretXY(1, 40, 30, 10, 5).x );
  EXPECT_EQ( 5, interpretXY(1, 40, 30, 10, 5).y );
  EXPECT_EQ( 29, interpretXY(2, 40, 30, 10, 5).x );
  EXPECT_EQ( 5, interpretXY(2, 40, 30, 10, 5).y );
  EXPECT_EQ( 29, interpretXY(3, 40, 30, 10, 5).x );
  EXPECT_EQ( 24, interpretXY(3, 40, 30, 10, 5).y );
  EXPECT_EQ( 10, interpretXY(4, 40, 30, 10, 5).x );
  EXPECT_EQ( 24, interpretXY(4, 40, 30, 10, 5).y );
  EXPECT_EQ( 5, interpretXY(5, 30, 40, 10, 5).x );
  EXPECT_EQ( 10, interpretXY(5, 30, 40, 10, 5).y );
  EXPECT_EQ( 5, interpretXY(6, 30, 40, 10, 5).x );
  EXPECT_EQ( 29, interpretXY(6, 30, 40, 10, 5).y );
  EXPECT_EQ( 24, interpretXY(7, 30, 40, 10, 5).x );
  EXPECT_EQ( 29, interpretXY(7, 30, 40, 10, 5).y );
  EXPECT_EQ( 24, interpretXY(8, 30, 40, 10, 5).x );
  EXPECT_EQ( 10, interpretXY(8, 30, 40, 10, 5).y );
  EXPECT_EQ( 10, interpretXY(9, 40, 30, 10, 5).x );
  EXPECT_EQ( 5, interpretXY(9, 40, 30, 10, 5).y );
  EXPECT_EQ( 10, interpretXY(0, 40, 30, 10, 5).x );
  EXPECT_EQ( 5, interpretXY(0, 40, 30, 10, 5).y );
  EXPECT_EQ( 10, interpretXY(null, 40, 30, 10, 5).x );
  EXPECT_EQ( 5, interpretXY(null, 40, 30, 10, 5).y );
});
TEST( 'compareUtil orientationUtil interpretXY2', function test() {
  var interpretXY2 = compareUtil.orientationUtil.interpretXY2;
  EXPECT_EQ( 10, interpretXY2(1, 40, 30, 10, 5).x );
  EXPECT_EQ( 5, interpretXY2(1, 40, 30, 10, 5).y );
  EXPECT_EQ( 30, interpretXY2(3, 40, 30, 10, 5).x );
  EXPECT_EQ( 25, interpretXY2(3, 40, 30, 10, 5).y );
  EXPECT_EQ( 5, interpretXY2(5, 30, 40, 10, 5).x );
  EXPECT_EQ( 10, interpretXY2(5, 30, 40, 10, 5).y );
  EXPECT_EQ( 25, interpretXY2(7, 30, 40, 10, 5).x );
  EXPECT_EQ( 30, interpretXY2(7, 30, 40, 10, 5).y );
});

(function(){
  // aspectRatioUtil
  var testCases = [
    { inW: 1, inH: 1, expectW: 1, expectH: 1 },
    { inW: 100, inH: 100, expectW: 1, expectH: 1 },
    { inW: 100, inH: 200, expectW: 1, expectH: 2 },
    { inW: 500, inH: 200, expectW: 5, expectH: 2 },
    { inW: 640, inH: 480, expectW: 4, expectH: 3 },
    { inW: 1920, inH: 1080, expectW: 16, expectH: 9 },
    { inW: 1080, inH: 1920, expectW: 9, expectH: 16 },
    { inW: 1920, inH: 1200, expectW: 8, expectH: 5 },
    { inW: 1296, inH: 972, expectW: 4, expectH: 3 },
    { inW: 2432, inH: 3648, expectW: 2, expectH: 3 },
    { inW: 3648, inH: 2056, expectW: 456, expectH: 257 },
    { inW: 15578, inH: 7783, expectW: 15578, expectH: 7783 },
  ];
  TEST( 'compareUtil aspectRatioUtil calcAspectRatio', function test() {
    for (var i = 0, t; t = testCases[i]; i++) {
      var desc = 'calcAspectRatio(' + t.inW + ', ' + t.inH + ')';
      var a = compareUtil.aspectRatioUtil.calcAspectRatio(t.inW, t.inH);
      EXPECT_EQ( t.expectW, a.w, desc + '.w' );
      EXPECT_EQ( t.expectH, a.h, desc + '.h');
    }
  });
  TEST( 'compareUtil aspectRatioUtil toString', function test() {
    var toString = compareUtil.aspectRatioUtil.toString;
    EXPECT_EQ( '1:1', toString({ w:1, h:1 }) );
    EXPECT_EQ( '1:2', toString({ w:1, h:2 }) );
    EXPECT_EQ( '5:2', toString({ w:5, h:2 }) );
    EXPECT_EQ( '16:9', toString({ w:16, h:9 }) );
    EXPECT_EQ( '9:16', toString({ w:9, h:16 }) );
    EXPECT_EQ( '456:257', toString({ w:456, h:257 }) );
    EXPECT_EQ( '15,578:7,783', toString({ w:15578, h:7783 }) );
  });
  TEST( 'compareUtil aspectRatioUtil findApproxAspectRatio', function test() {
    var findApprox = function(w, h) {
      var a = compareUtil.aspectRatioUtil.calcAspectRatio(w, h);
      var approx = compareUtil.aspectRatioUtil.findApproxAspectRatio(a);
      return approx ? compareUtil.aspectRatioUtil.toString(approx) : null;
    };
    EXPECT_EQ( null, findApprox(1, 1) );
    EXPECT_EQ( null, findApprox(100, 100) );
    EXPECT_EQ( null, findApprox(100, 200) );
    EXPECT_EQ( null, findApprox(1920, 1080) );
    EXPECT_EQ( '16:9', findApprox(3648, 2056) );
    EXPECT_EQ( '9:16', findApprox(2056, 3648) );
    EXPECT_EQ( '16:9', findApprox(960, 541) );
    EXPECT_EQ( '2:1', findApprox(15578, 7783) );
    EXPECT_EQ( '2:1', findApprox(1001, 500) );
  });
  TEST( 'compareUtil aspectRatioUtil makeInfo', function test() {
    makeInfo = compareUtil.aspectRatioUtil.makeInfo;
    EXPECT_EQ_ARRAY( [1, '1:1'], makeInfo(1, 1) );
    EXPECT_EQ_ARRAY( [1, '1:1'], makeInfo(100, 100) );
    EXPECT_EQ_ARRAY( [0.5, '1:2'], makeInfo(100, 200) );
    EXPECT_EQ_ARRAY( [1/10, '1:10'], makeInfo(1, 10) );
    EXPECT_EQ_ARRAY( [10, '10:1'], makeInfo(10, 1) );
    EXPECT_EQ_ARRAY( [16/9, '16:9'], makeInfo(1920, 1080) );
    EXPECT_EQ_ARRAY( [8/5, '8:5'], makeInfo(1920, 1200) );
    EXPECT_EQ_ARRAY( [960/544, '30:17'], makeInfo(960, 544) );
    EXPECT_EQ_ARRAY( [2432/3648, '2:3'], makeInfo(2432, 3648) );
    EXPECT_EQ_ARRAY( [2028/1521, '4:3'], makeInfo(2028, 1521) );
    EXPECT_EQ_ARRAY( [2592/1944, '4:3'], makeInfo(2592, 1944) );
    EXPECT_EQ_ARRAY( [400/301, '400:301', '4:3'], makeInfo(400, 301) );
    EXPECT_EQ_ARRAY( [2056/3648, '257:456', '9:16'], makeInfo(2056, 3648) );
    EXPECT_EQ_ARRAY( [3648/2056, '456:257', '16:9'], makeInfo(3648, 2056) );
    EXPECT_EQ_ARRAY( [15578/7783, '15,578:7,783', '2:1'], makeInfo(15578, 7783) );
  });
})();

TEST( 'compareUtil makeDurationInfo', function test() {
  var make = compareUtil.makeDurationInfo;
  EXPECT_EQ_ARRAY( [null, '‐'], make() );
  EXPECT_EQ_ARRAY( [null, '‐'], make(null) );
  EXPECT_EQ_ARRAY( [null, '‐'], make({}) );
  EXPECT_EQ_ARRAY( [3, '3.000'], make({ anim: { durationNum: 3, durationDen: 1 } }) );
  EXPECT_EQ_ARRAY( [7/4, '1.750'], make({ anim: { durationNum: 14, durationDen: 8 } }) );
  EXPECT_EQ_ARRAY( [8/5, '1.600'], make({ anim: { durationNum: 40, durationDen: 25, fpsNum: 25, fpsDen: 1 } }) );
  EXPECT_EQ_ARRAY( [4/3, '4/3', '1.333'], make({ anim: { durationNum: 4, durationDen: 3 } }) );
  EXPECT_EQ_ARRAY( [4/3, '4/3', '1.333'], make({ anim: { durationNum: 20, durationDen: 15 } }) );
  EXPECT_EQ_ARRAY( [4/3, '40/30', '1.333'], make({ anim: { durationNum: 20, durationDen: 15, fpsNum: 30, fpsDen: 1 } }) );
  EXPECT_EQ_ARRAY( [34/24, '17/12', '1.417'], make({ anim: { durationNum: 34, durationDen: 24, fpsNum: null, fpsDen: null } }) );
  EXPECT_EQ_ARRAY( [34/24, '34/24', '1.417'], make({ anim: { durationNum: 34, durationDen: 24, fpsNum: 24, fpsDen: 1 } }) );
});

TEST( 'compareUtil makeFPSInfo', function test() {
  var make = compareUtil.makeFPSInfo;
  var nu = { en: 'non-uniform' };
  EXPECT_EQ_ARRAY( [null, '‐'], make() );
  EXPECT_EQ_ARRAY( [null, '‐'], make(null, nu) );
  EXPECT_EQ_ARRAY( [null, '‐'], make({}, nu) );
  EXPECT_EQ_ARRAY( [1, '1'], make({ anim: { fpsNum: 1, fpsDen: 1, approxFPS: null } }, nu) );
  EXPECT_EQ_ARRAY( [1, '1'], make({ anim: { fpsNum: 100, fpsDen: 100, approxFPS: null } }, nu) );
  EXPECT_EQ_ARRAY( [1, '1'], make({ anim: { fpsNum: 1000, fpsDen: 1000, approxFPS: null } }, nu) );
  EXPECT_EQ_ARRAY( [25, '25'], make({ anim: { fpsNum: 1000, fpsDen: 40, approxFPS: null } }, nu) );
  EXPECT_EQ_ARRAY( [1000/32, '31.25'], make({ anim: { fpsNum: 1000, fpsDen: 32, approxFPS: null } }, nu) );
  EXPECT_EQ_ARRAY( [100/3, '100/3', '33.33'], make({ anim: { fpsNum: 1000, fpsDen: 30, approxFPS: null } }, nu) );
  EXPECT_EQ_ARRAY( [24, '24'], make({ anim: { fpsNum: 24, fpsDen: 1, approxFPS: null } }, nu) );
  EXPECT_EQ_ARRAY( [null, nu, '24.0'], make({ anim: { fpsNum: null, fpsDen: null, approxFPS: 24 } }, nu) );
  EXPECT_EQ_ARRAY( [null, nu], make({ anim: { fpsNum: null, fpsDen: null, approxFPS: null } }, nu) );
});

TEST( 'compareUtil cursorKeyCodeToXY', function test() {
  var cursorKeyCodeToXY = compareUtil.cursorKeyCodeToXY;
  EXPECT( cursorKeyCodeToXY(99).x === 0 );
  EXPECT( cursorKeyCodeToXY(99).y === 0 );

  EXPECT( cursorKeyCodeToXY(37).x === -1 );
  EXPECT( cursorKeyCodeToXY(37).y === 0 );
  EXPECT( cursorKeyCodeToXY(38).x === 0 );
  EXPECT( cursorKeyCodeToXY(38).y === -1 );
  EXPECT( cursorKeyCodeToXY(39).x === 1 );
  EXPECT( cursorKeyCodeToXY(39).y === 0 );
  EXPECT( cursorKeyCodeToXY(40).x === 0 );
  EXPECT( cursorKeyCodeToXY(40).y === 1 );

  EXPECT( cursorKeyCodeToXY(99, 10).x === 0 );
  EXPECT( cursorKeyCodeToXY(99, 10).y === 0 );

  EXPECT( cursorKeyCodeToXY(37, 10).x === -10 );
  EXPECT( cursorKeyCodeToXY(37, 10).y === 0 );
  EXPECT( cursorKeyCodeToXY(38, 10).x === 0 );
  EXPECT( cursorKeyCodeToXY(38, 10).y === -10 );
  EXPECT( cursorKeyCodeToXY(39, 10).x === 10 );
  EXPECT( cursorKeyCodeToXY(39, 10).y === 0 );
  EXPECT( cursorKeyCodeToXY(40, 10).x === 0 );
  EXPECT( cursorKeyCodeToXY(40, 10).y === 10 );
});

TEST( 'compareUtil calcInscribedRect', function test() {
  var calcInscribedRect = compareUtil.calcInscribedRect;
  //EXPECT( calcInscribedRect(0, 0, 0, 0).width === 0 );
  EXPECT( calcInscribedRect(1, 1, 1, 1).width === 1 );
  EXPECT( calcInscribedRect(1, 1, 1, 1).height === 1 );
  EXPECT( calcInscribedRect(1, 1, 10, 10).width === 1 );
  EXPECT( calcInscribedRect(1, 1, 10, 10).height === 1 );
  EXPECT( calcInscribedRect(100, 100, 1, 1).width === 100 );
  EXPECT( calcInscribedRect(100, 100, 1, 1).height === 100 );

  EXPECT( calcInscribedRect(100, 100, 10, 10).width === 100 );
  EXPECT( calcInscribedRect(100, 100, 10, 10).height === 100 );
  EXPECT( calcInscribedRect(100, 100, 20, 10).width === 100 );
  EXPECT( calcInscribedRect(100, 100, 20, 10).height === 50 );
  EXPECT( calcInscribedRect(100, 100, 10, 20).width === 50 );
  EXPECT( calcInscribedRect(100, 100, 10, 20).height === 100 );

  EXPECT( calcInscribedRect(200, 100, 10, 10).width === 100 );
  EXPECT( calcInscribedRect(200, 100, 10, 10).height === 100 );
  EXPECT( calcInscribedRect(200, 100, 15, 10).width === 150 );
  EXPECT( calcInscribedRect(200, 100, 15, 10).height === 100 );
  EXPECT( calcInscribedRect(200, 100, 20, 10).width === 200 );
  EXPECT( calcInscribedRect(200, 100, 20, 10).height === 100 );
  EXPECT( calcInscribedRect(200, 100, 25, 10).width === 200 );
  EXPECT( calcInscribedRect(200, 100, 25, 10).height === 80 );
  EXPECT( calcInscribedRect(200, 100, 40, 10).width === 200 );
  EXPECT( calcInscribedRect(200, 100, 40, 10).height === 50 );
  EXPECT( calcInscribedRect(200, 100, 10, 20).width === 50 );
  EXPECT( calcInscribedRect(200, 100, 10, 20).height === 100 );
  EXPECT( calcInscribedRect(200, 100, 10, 25).width === 40 );
  EXPECT( calcInscribedRect(200, 100, 10, 25).height === 100 );

  EXPECT( calcInscribedRect(100, 200, 10, 10).width === 100 );
  EXPECT( calcInscribedRect(100, 200, 10, 10).height === 100 );
  EXPECT( calcInscribedRect(100, 200, 10, 15).width === 100 );
  EXPECT( calcInscribedRect(100, 200, 10, 15).height === 150 );
  EXPECT( calcInscribedRect(100, 200, 10, 20).width === 100 );
  EXPECT( calcInscribedRect(100, 200, 10, 20).height === 200 );
  EXPECT( calcInscribedRect(100, 200, 10, 25).width === 80 );
  EXPECT( calcInscribedRect(100, 200, 10, 25).height === 200 );
  EXPECT( calcInscribedRect(100, 200, 10, 40).width === 50 );
  EXPECT( calcInscribedRect(100, 200, 10, 40).height === 200 );
  EXPECT( calcInscribedRect(100, 200, 20, 10).width === 100 );
  EXPECT( calcInscribedRect(100, 200, 20, 10).height === 50 );
  EXPECT( calcInscribedRect(100, 200, 25, 10).width === 100 );
  EXPECT( calcInscribedRect(100, 200, 25, 10).height === 40 );
});
