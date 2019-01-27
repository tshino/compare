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

TEST( 'compareUtil srgb255ToLinear', function test() {
  EXPECT_EQ( 0.0, compareUtil.srgb255ToLinear[0] );
  EXPECT( 1e-5 > Math.abs(0.0003035270 - compareUtil.srgb255ToLinear[1]) );
  EXPECT( 1e-5 > Math.abs(0.0015176349 - compareUtil.srgb255ToLinear[5]) );
  EXPECT( 1e-5 > Math.abs(0.0030352698 - compareUtil.srgb255ToLinear[10]) );
  EXPECT( 1e-5 > Math.abs(0.0033465358 - compareUtil.srgb255ToLinear[11]) );
  EXPECT( 1e-5 > Math.abs(0.0047769535 - compareUtil.srgb255ToLinear[15]) );
  EXPECT( 1e-5 > Math.abs(0.2158605001 - compareUtil.srgb255ToLinear[128]) );
  EXPECT( 1e-5 > Math.abs(0.5271151257 - compareUtil.srgb255ToLinear[192]) );
  EXPECT( 1e-5 > Math.abs(0.9911020971 - compareUtil.srgb255ToLinear[254]) );
  EXPECT_EQ( 1.0, compareUtil.srgb255ToLinear[255] );
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
})();

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
