'use strict';
const assert = require('assert');
const CompareUtil = require('../modules/compare-util.js');

const jsTestUtil = {
    dataURIFromArrayBuffer: function(ab) {
        var array = new Uint8Array(ab);
        var str = '';
        for (var i = 0; i < array.length; ++i) {
          str += String.fromCharCode(array[i]);
        }
        return 'data:application/octet-stream;base64,' + btoa(str);
    }
};

describe('CompareUtil', () => {
    const window = {
        navigator: {
            userAgent: 'ua'
        }
    };
    const compareUtil = CompareUtil(window);

    describe('clamp', () => {
        it('should return clipped value', () => {
            assert.strictEqual(compareUtil.clamp(0, 0, 0), 0);
            assert.strictEqual(compareUtil.clamp(0, -1, 1), 0);
            assert.strictEqual(compareUtil.clamp(5, 1, 2), 2);
            assert.strictEqual(compareUtil.clamp(5, 1, 5), 5);
            assert.strictEqual(compareUtil.clamp(5, 1, 10), 5);
            assert.strictEqual(compareUtil.clamp(5, 5, 5), 5);
            assert.strictEqual(compareUtil.clamp(5, 5, 10), 5);
            assert.strictEqual(compareUtil.clamp(5, 8, 10), 8);
        });
    });

    describe('calcGCD', () => {
        it('should calculate greatest common divisor', () => {
            assert.strictEqual(compareUtil.calcGCD(1, 1), 1);
            assert.strictEqual(compareUtil.calcGCD(1, 10), 1);
            assert.strictEqual(compareUtil.calcGCD(10, 1), 1);
            assert.strictEqual(compareUtil.calcGCD(2, 3), 1);
            assert.strictEqual(compareUtil.calcGCD(10, 8), 2);
            assert.strictEqual(compareUtil.calcGCD(3, 15), 3);
            assert.strictEqual(compareUtil.calcGCD(60, 75), 15);
            assert.strictEqual(compareUtil.calcGCD(1920, 1080), 120);
            assert.strictEqual(compareUtil.calcGCD(0, 0), 0);
            assert.strictEqual(compareUtil.calcGCD(0, 3), 3);
            assert.strictEqual(compareUtil.calcGCD(2, 0), 2);
        });
    });

    describe('addComma', () => {
        it('should insert commas as digit grouping', () => {
            assert.strictEqual(compareUtil.addComma(0), '0');
            assert.strictEqual(compareUtil.addComma(1), '1');
            assert.strictEqual(compareUtil.addComma(100), '100');
            assert.strictEqual(compareUtil.addComma(1000), '1,000');
            assert.strictEqual(compareUtil.addComma(-1234), '-1,234');
            assert.strictEqual(compareUtil.addComma(10000), '10,000');
            assert.strictEqual(compareUtil.addComma(123456), '123,456');
            assert.strictEqual(compareUtil.addComma(-876543), '-876,543');
            assert.strictEqual(compareUtil.addComma(1234567890), '1,234,567,890');
        });
    });

    describe('hyphenToMinus', () => {
        it('should replace hyphens to minus signs', () => {
            assert.strictEqual(compareUtil.hyphenToMinus(''), '');
            assert.strictEqual(compareUtil.hyphenToMinus('123'), '123');
            assert.strictEqual(compareUtil.hyphenToMinus('-123'), '−123');
            assert.strictEqual(compareUtil.hyphenToMinus('1.2345'), '1.2345');
            assert.strictEqual(compareUtil.hyphenToMinus('-1.2345'), '−1.2345');
            assert.strictEqual(compareUtil.hyphenToMinus('1.0e-5'), '1.0e−5');
            assert.strictEqual(compareUtil.hyphenToMinus('-1.0e-5'), '−1.0e−5');
        });
    });

    describe('toSignedFixed', () => {
        // Note: '−' (U+2212 MINUS SIGN) is used instead of '-' (U+002D HYPHEN-MINUS)
        it('should format given number with fixed digits in fraction and sign', () => {
            assert.strictEqual(compareUtil.toSignedFixed(1.234567, 0), '+1');
            assert.strictEqual(compareUtil.toSignedFixed(-1.234567, 0), '−1');
            assert.strictEqual(compareUtil.toSignedFixed(1.234567, 1), '+1.2');
            assert.strictEqual(compareUtil.toSignedFixed(-1.234567, 1), '−1.2');
            assert.strictEqual(compareUtil.toSignedFixed(1.234567, 2), '+1.23');
            assert.strictEqual(compareUtil.toSignedFixed(1.234567, 5), '+1.23457');
            assert.strictEqual(compareUtil.toSignedFixed(-1.234567, 5), '−1.23457');

            assert.strictEqual(compareUtil.toSignedFixed(0, 0), '0');
            assert.strictEqual(compareUtil.toSignedFixed(0, 1), '0.0');
            assert.strictEqual(compareUtil.toSignedFixed(0, 2), '0.00');
            assert.strictEqual(compareUtil.toSignedFixed(0, 5), '0.00000');

            assert.strictEqual(compareUtil.toSignedFixed(0.01, 0), '0');
            assert.strictEqual(compareUtil.toSignedFixed(-0.01, 0), '0');
            assert.strictEqual(compareUtil.toSignedFixed(0.01, 1), '0.0');
            assert.strictEqual(compareUtil.toSignedFixed(-0.01, 1), '0.0');
            assert.strictEqual(compareUtil.toSignedFixed(0.01, 2), '+0.01');
            assert.strictEqual(compareUtil.toSignedFixed(-0.01, 2), '−0.01');
            assert.strictEqual(compareUtil.toSignedFixed(0.01, 3), '+0.010');
            assert.strictEqual(compareUtil.toSignedFixed(-0.01, 3), '−0.010');

            assert.strictEqual(compareUtil.toSignedFixed(0), '0');
            assert.strictEqual(compareUtil.toSignedFixed(123), '+123');
            assert.strictEqual(compareUtil.toSignedFixed(-123), '−123');
        });
    });

    describe('toPercent', () => {
        it('should format given number as percent with appropriate number of digits', () => {
            assert.strictEqual(compareUtil.toPercent(0), '0%');
            assert.strictEqual(compareUtil.toPercent(0.00001), '0.00100%');
            assert.strictEqual(compareUtil.toPercent(0.00005), '0.00500%');
            assert.strictEqual(compareUtil.toPercent(0.0001), '0.0100%');
            assert.strictEqual(compareUtil.toPercent(0.0005), '0.0500%');
            assert.strictEqual(compareUtil.toPercent(0.001), '0.100%');
            assert.strictEqual(compareUtil.toPercent(0.005), '0.500%');
            assert.strictEqual(compareUtil.toPercent(0.01), '1.00%');
            assert.strictEqual(compareUtil.toPercent(0.05), '5.00%');
            assert.strictEqual(compareUtil.toPercent(0.09), '9.00%');
            assert.strictEqual(compareUtil.toPercent(0.1), '10.0%');
            assert.strictEqual(compareUtil.toPercent(0.5), '50.0%');
            assert.strictEqual(compareUtil.toPercent(0.9), '90.00%');
            assert.strictEqual(compareUtil.toPercent(0.91), '91.00%');
            assert.strictEqual(compareUtil.toPercent(0.95), '95.00%');
            assert.strictEqual(compareUtil.toPercent(0.99), '99.000%');
            assert.strictEqual(compareUtil.toPercent(0.995), '99.500%');
            assert.strictEqual(compareUtil.toPercent(0.999), '99.9000%');
            assert.strictEqual(compareUtil.toPercent(0.9995), '99.9500%');
            assert.strictEqual(compareUtil.toPercent(0.9999), '99.99000%');
            assert.strictEqual(compareUtil.toPercent(0.99995), '99.99500%');
            assert.strictEqual(compareUtil.toPercent(0.99999), '99.999000%');
            assert.strictEqual(compareUtil.toPercent(1), '100%');
        });
    });

    describe('toHexTriplet', () => {
        it('should format given RGB value into a hex triplet', () => {
            assert.strictEqual(compareUtil.toHexTriplet(0, 0, 0), '#000000');
            assert.strictEqual(compareUtil.toHexTriplet(1, 1, 1), '#010101');
            assert.strictEqual(compareUtil.toHexTriplet(255, 255, 255), '#FFFFFF');
            assert.strictEqual(compareUtil.toHexTriplet(0, 0, 255), '#0000FF');
            assert.strictEqual(compareUtil.toHexTriplet(0, 255, 0), '#00FF00');
            assert.strictEqual(compareUtil.toHexTriplet(255, 0, 0), '#FF0000');
            assert.strictEqual(compareUtil.toHexTriplet(85, 170, 255), '#55AAFF');
            assert.strictEqual(compareUtil.toHexTriplet(18, 52, 86), '#123456');

            assert.strictEqual(compareUtil.toHexTriplet(-1, -2, -3), '#000000');
            assert.strictEqual(compareUtil.toHexTriplet(257, 300, 1000), '#FFFFFF');
            assert.strictEqual(compareUtil.toHexTriplet(15.9, 16, 16.1), '#101010');
        });
    });

    describe('srgb255ToLinear255', () => {
        it('should convert sRGB 8bit int value to linear RGB float value [0,255]', () => {
            assert.strictEqual(compareUtil.srgb255ToLinear255[0], 0.0);
            assert.ok(1e-5 > Math.abs(0.077399385 - compareUtil.srgb255ToLinear255[1]));
            assert.ok(1e-5 > Math.abs(0.386996900 - compareUtil.srgb255ToLinear255[5]));
            assert.ok(1e-5 > Math.abs(0.773993799 - compareUtil.srgb255ToLinear255[10]));
            assert.ok(1e-5 > Math.abs(0.853366629 - compareUtil.srgb255ToLinear255[11]));
            assert.ok(1e-5 > Math.abs(1.218123143 - compareUtil.srgb255ToLinear255[15]));
            assert.ok(1e-5 > Math.abs(55.044427526 - compareUtil.srgb255ToLinear255[128]));
            assert.ok(1e-5 > Math.abs(134.414357054 - compareUtil.srgb255ToLinear255[192]));
            assert.ok(1e-5 > Math.abs(252.731034761 - compareUtil.srgb255ToLinear255[254]));
            assert.strictEqual(compareUtil.srgb255ToLinear255[255], 255.0);
        });
    });

    describe('srgb255ToLinear8', () => {
        it('should convert sRGB 8bit int value to linear RGB 8bit int value', () => {
            assert.strictEqual(compareUtil.srgb255ToLinear8[0], 0);
            assert.strictEqual(compareUtil.srgb255ToLinear8[1], 0);
            assert.strictEqual(compareUtil.srgb255ToLinear8[5], 0);
            assert.strictEqual(compareUtil.srgb255ToLinear8[10], 1);
            assert.strictEqual(compareUtil.srgb255ToLinear8[11], 1);
            assert.strictEqual(compareUtil.srgb255ToLinear8[15], 1);
            assert.strictEqual(compareUtil.srgb255ToLinear8[128], 55);
            assert.strictEqual(compareUtil.srgb255ToLinear8[192], 134);
            assert.strictEqual(compareUtil.srgb255ToLinear8[254], 253);
            assert.strictEqual(compareUtil.srgb255ToLinear8[255], 255);
        });
    });

    describe('convertColorListRgbToLinear', () => {
        const rgb = [
            0x000000, 0x808080, 0xffffff, 0xff0000, 0x00ff00, 0x0000ff,
            0x010203, 0x090a0b, 0x112233, 0x445566, 0x778899, 0xbbddff
        ];
        const expected = [
            0x000000, 0x373737, 0xffffff, 0xff0000, 0x00ff00, 0x0000ff,
            0x000000, 0x010101, 0x010408, 0x0f1722, 0x2f3f51, 0x7fb8ff
        ];
        it('should convert sRGB 888 int values to linear RGB 888 int values', () => {
            const linear = compareUtil.convertColorListRgbToLinear(rgb);
            assert.strictEqual(linear.length, rgb.length);
            assert.deepStrictEqual(Array.from(linear), expected);
        });
    });

    describe('convertColorListRgbToXyy', () => {
        const rgb = [
            0x000000, 0x808080, 0xffffff,
            0xff0000, 0x00ff00, 0x0000ff,
            0x800000, 0x008000, 0x000080
        ];
        it('should convert sRGB 888 int values to Xyy 888 int values', () => {
            const xyy = compareUtil.convertColorListRgbToXyy(rgb);
            assert.strictEqual(xyy.length, rgb.length);
            assert.strictEqual(xyy[0], 0x787e00); // x=79.74, y=83.90, Y = 0
            assert.strictEqual(xyy[1], 0x787e37); // x=79.74, y=83.90, Y = 55.04
            assert.strictEqual(xyy[2], 0x787eff); // x=79.74, y=83.90, Y = 255
            assert.strictEqual(xyy[3], 0xf57e36); // x=163.20, y=84.15, Y = 54.23
            assert.strictEqual(xyy[4], 0x73e6b6); // x=76.50, y=153.00, Y = 182.36
            assert.strictEqual(xyy[5], 0x391712); // x=38.25, y=15.30, Y = 18.40
            assert.strictEqual(xyy[6], 0xf57e0c); // x=163.20, y=84.15, Y = 11.71
            assert.strictEqual(xyy[7], 0x73e627); // x=76.50, y=153.00, Y = 39.36
            assert.strictEqual(xyy[8], 0x391704); // x=38.25, y=15.30, Y = 3.97
        });
    });

    describe('convertColorListRgbToHsv', () => {
        const rgb = [
            0x000000, 0x808080, 0xffffff,
            0xff0000, 0x00ff00, 0x0000ff,
            0x800000, 0x008000, 0x000080,
            0xff8080, 0x80ff80, 0x8080ff
        ];
        it('should convert RGB 888 int values to HSV 888 int values', () => {
            const hsv = compareUtil.convertColorListRgbToHsv(rgb);
            assert.strictEqual(hsv.length, rgb.length);
            assert.strictEqual(hsv[0], 0x808000); // H=0, S=0, V=0
            assert.strictEqual(hsv[1], 0x808080); // H=0, S=0, V=50.2
            assert.strictEqual(hsv[2], 0x8080ff); // H=0, S=0, V=100
            assert.strictEqual(hsv[3], 0xff80ff); // H=0, S=100, V=100
            assert.strictEqual(hsv[4], 0x40eeff); // H=120, S=100, V=100
            assert.strictEqual(hsv[5], 0x4011ff); // H=240, S=100, V=100
            assert.strictEqual(hsv[6], 0xff8080); // H=0, S=100, V=50.2
            assert.strictEqual(hsv[7], 0x40ee80); // H=120, S=100, V=50.2
            assert.strictEqual(hsv[8], 0x401180); // H=240, S=100, V=50.2
            assert.strictEqual(hsv[9], 0xbf80ff); // H=0, S=49.2, V=100
            assert.strictEqual(hsv[10], 0x60b6ff); // H=120, S=49.2, V=100
            assert.strictEqual(hsv[11], 0x6049ff); // H=240, S=49.2, V=100
        });
    });

    describe('convertColorListRgbToHsvLinear', () => {
        const rgb = [
            0x000000, 0x808080, 0xffffff,
            0xff0000, 0x00ff00, 0x0000ff
        ];
        it('should convert RGB 888 int values to linear HSV 888 int values', () => {
            const hsv = compareUtil.convertColorListRgbToHsvLinear(rgb);
            assert.strictEqual(rgb.length, hsv.length);
            assert.strictEqual(hsv[0], 0x808000); // H=0, S=0, V=0
            assert.strictEqual(hsv[1], 0x808037); // H=0, S=0, V=21.6
            assert.strictEqual(hsv[2], 0x8080ff); // H=0, S=0, V=100
            assert.strictEqual(hsv[3], 0xff80ff); // H=0, S=100, V=100
            assert.strictEqual(hsv[4], 0x40eeff); // H=120, S=100, V=100
            assert.strictEqual(hsv[5], 0x4011ff); // H=240, S=100, V=100
        });
    });

    describe('convertColorListRgbToHsl', () => {
        const rgb = [
            0x000000, 0x808080, 0xffffff,
            0xff0000, 0x00ff00, 0x0000ff,
            0x800000, 0x008000, 0x000080,
            0xff8080, 0x80ff80, 0x8080ff
        ];
        it('should convert RGB 888 int values to HSL 888 int values', () => {
            const hsl = compareUtil.convertColorListRgbToHsl(rgb);
            assert.strictEqual(rgb.length, hsl.length);
            assert.strictEqual(hsl[0], 0x808000); // H=0, S=0, L=0
            assert.strictEqual(hsl[1], 0x808080); // H=0, S=0, L=50.2
            assert.strictEqual(hsl[2], 0x8080ff); // H=0, S=0, L=100
            assert.strictEqual(hsl[3], 0xff8080); // H=0, S=100, L=50
            assert.strictEqual(hsl[4], 0x40ee80); // H=120, S=100, L=50
            assert.strictEqual(hsl[5], 0x401180); // H=240, S=100, L=50
            assert.strictEqual(hsl[6], 0xff8040); // H=0, S=100, L=25.1
            assert.strictEqual(hsl[7], 0x40ee40); // H=120, S=100, L=25.1
            assert.strictEqual(hsl[8], 0x401140); // H=240, S=100, L=25.1
            assert.strictEqual(hsl[9], 0xff80c0); // H=0, S=100, L=75.1
            assert.strictEqual(hsl[10], 0x40eec0); // H=120, S=100, L=75.1
            assert.strictEqual(hsl[11], 0x4011c0); // H=240, S=100, L=75.1
        });
    });

    describe('convertColorListRgbToHslLinear', () => {
        const rgb = [
            0x000000, 0x808080, 0xffffff,
            0xff0000, 0x00ff00, 0x0000ff
        ];
        it('should convert RGB 888 int values to linear HSL 888 int values', () => {
            const hsl = compareUtil.convertColorListRgbToHslLinear(rgb);
            assert.strictEqual(rgb.length, hsl.length);
            assert.strictEqual(hsl[0], 0x808000); // H=0, S=0, L=0
            assert.strictEqual(hsl[1], 0x808037); // H=0, S=0, L=21.6
            assert.strictEqual(hsl[2], 0x8080ff); // H=0, S=0, L=100
            assert.strictEqual(hsl[3], 0xff8080); // H=0, S=100, L=50
            assert.strictEqual(hsl[4], 0x40ee80); // H=120, S=100, L=50
            assert.strictEqual(hsl[5], 0x401180); // H=240, S=100, L=50
        });
    });

    describe('binaryFromDataURI', () => {
        // Hello, world!\n
        const datauri = 'data:;base64,SGVsbG8sIHdvcmxkIQo=';
        it('should make binary reader from DataURI', () => {
            const binary = compareUtil.binaryFromDataURI(datauri);

            assert.strictEqual(binary.length, 14);
            assert.strictEqual(binary.at(0), 0x48 /* H */);
            assert.strictEqual(binary.at(1), 0x65 /* e */);
            assert.strictEqual(binary.at(2), 0x6c /* l */);
            assert.strictEqual(binary.at(3), 0x6c /* l */);
            assert.strictEqual(binary.at(4), 0x6f /* o */);
            assert.strictEqual(binary.at(5), 0x2c /* , */);
            assert.strictEqual(binary.at(6), 0x20 /*   */);
            assert.strictEqual(binary.at(7), 0x77 /* w */);
            assert.strictEqual(binary.at(8), 0x6f /* o */);
            assert.strictEqual(binary.at(9), 0x72 /* r */);
            assert.strictEqual(binary.at(10), 0x6c /* l */);
            assert.strictEqual(binary.at(11), 0x64 /* d */);
            assert.strictEqual(binary.at(12), 0x21 /* ! */);
            assert.strictEqual(binary.at(13), 0x0a /* \n */);

            assert.strictEqual(binary.at(14), null);
            // assert.strictEqual( binary.at(-1), null );

            assert.strictEqual(binary.big16(0), 0x4865 /* He */);
            assert.strictEqual(binary.big16(1), 0x656c /* el */);
            assert.strictEqual(binary.big16(2), 0x6c6c /* ll */);
            assert.strictEqual(binary.big16(3), 0x6c6f /* lo */);
            assert.strictEqual(binary.little16(0), 0x6548 /* eH */);
            assert.strictEqual(binary.little16(1), 0x6c65 /* le */);
            assert.strictEqual(binary.little16(2), 0x6c6c /* ll */);
            assert.strictEqual(binary.little16(3), 0x6f6c /* ol */);
            assert.strictEqual(binary.big32(0), 0x48656c6c /* Hell */);
            assert.strictEqual(binary.big32(1), 0x656c6c6f /* ello */);
            assert.strictEqual(binary.big32(2), 0x6c6c6f2c /* llo, */);
            assert.strictEqual(binary.little32(0), 0x6c6c6548 /* lleH */);
            assert.strictEqual(binary.little32(1), 0x6f6c6c65 /* olle */);
            assert.strictEqual(binary.little32(2), 0x2c6f6c6c /* ,oll */);
        });
    });

    describe('detectExifOrientation', () => {
        const detect = function (content) {
            const u8array = new Uint8Array(content);
            const datauri = jsTestUtil.dataURIFromArrayBuffer(u8array);
            const binary = compareUtil.binaryFromDataURI(datauri);
            const format = compareUtil.detectExifOrientation(binary);
            return format;
        };
        it('should detect Exif orientation information', () => {
            assert.strictEqual(detect([]), null);
            assert.strictEqual(detect([
                0xff, 0xd8, // SOI
                0xff, 0xe0, 0, 7, 0x4a, 0x46, 0x49, 0x46, 0x00, // APP0 JFIF\0
                0xff, 0xe1, 0, 7, 0x45, 0x78, 0x69, 0x66, 0x00, // APP1 Exif\0
                0xff, 0xd9
            ]), null);
            assert.strictEqual(detect([
                0xff, 0xd8, // SOI
                0xff, 0xe0, 0, 7, 0x4a, 0x46, 0x49, 0x46, 0x00, // APP0 JFIF\0
                0xff, 0xe1, 0, 30, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // APP1 Exif\0
                0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, // II
                0x01, 0x00,
                0x12, 0x01, 3, 0, 1, 0, 0, 0, 0x05, 0x00, 0, 0, // 0x0112 (ORIENTATION)
                0xff, 0xd9
            ]), 5);
            assert.strictEqual(detect([
                0xff, 0xd8, // SOI
                0xff, 0xe0, 0, 7, 0x4a, 0x46, 0x49, 0x46, 0x00, // APP0 JFIF\0
                0xff, 0xe1, 0, 30, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // APP1 Exif\0
                0x4d, 0x4d, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, // MM
                0x00, 0x01,
                0x01, 0x12, 0, 3, 0, 0, 0, 1, 0x00, 0x03, 0, 0, // 0x0112 (ORIENTATION)
                0xff, 0xd9
            ]), 3);
        });
    });

    describe('calcMinMaxMean', () => {
        const calcMinMaxMean = compareUtil.calcMinMaxMean;
        it('should calculate min, max and mean values of given numbers', () => {
            assert.strictEqual(calcMinMaxMean([]), null);
            assert.deepStrictEqual(calcMinMaxMean([0, 0, 0]), {min: 0, max: 0, mean: 0});
            assert.deepStrictEqual(calcMinMaxMean([-1, 0, 1]), {min: -1, max: 1, mean: 0});
            assert.deepStrictEqual(calcMinMaxMean([-1, -2, -3]), {min: -3, max: -1, mean: -2});
            assert.deepStrictEqual(calcMinMaxMean([10, 20, 90]), {min: 10, max: 90, mean: 40});
        });
    });

    describe('findNearlyConstantValue', () => {
        const findNearlyConstantValue = compareUtil.findNearlyConstantValue;
        it('should try to find nearly constant value with given tolerance', () => {
            assert.strictEqual(findNearlyConstantValue([], 0.01), null);
            assert.strictEqual(findNearlyConstantValue([0.5], 0.01), null);
            assert.strictEqual(findNearlyConstantValue([0.5, 0.5], 0.01), 0.5);
            assert.strictEqual(findNearlyConstantValue([0.5, 0.5, 0.5, 0.5, 0.5, 0.5], 0.01), 0.5);

            assert.strictEqual(findNearlyConstantValue([0.5, 0.75, 0.5, 0.75], 0.1), null);
            assert.strictEqual(findNearlyConstantValue([0.5, 0.75, 0.5, 0.75], 0.2), 0.625);
            assert.strictEqual(findNearlyConstantValue([0.5, 0.75, 0.5, 0.75, 0.5], 0.2), 0.625);

            assert.strictEqual(findNearlyConstantValue([2, 3, 2, 3, 2, 3], 1), 2.5);
            assert.strictEqual(findNearlyConstantValue([2, 3, 2, 3, 2, 3, 2], 1), 2.5);
            assert.strictEqual(findNearlyConstantValue([3, 2, 3, 2, 3, 2, 3], 1), 2.5);
            assert.strictEqual(findNearlyConstantValue([3, 2, 2, 3, 2, 3, 3, 2, 2, 3], 1), 2.5);

            assert.strictEqual(findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2, 3, 2, 2, 3], 1), 12 / 5);
            assert.strictEqual(findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2, 3, 2, 2], 1), 12 / 5);
            assert.strictEqual(findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2, 3, 2], 1), 12 / 5);
            assert.strictEqual(findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2, 3], 1), 12 / 5);
            assert.strictEqual(findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 1], 1), null);
            assert.strictEqual(findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2], 1), 12 / 5);
            assert.strictEqual(findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 3], 1), 12 / 5);
            assert.strictEqual(findNearlyConstantValue([2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 4], 1), null);

            assert.strictEqual(findNearlyConstantValue([
                0.04, 0.04, 0.05, 0.04, 0.04, 0.04,
                0.04, 0.04, 0.05, 0.04, 0.04, 0.04,
                0.04, 0.04, 0.05, 0.04, 0.04, 0.04,
                0.04, 0.04, 0.05, 0.05
            ], 0.01 + 1e-7), 1 / 24);

            assert.strictEqual(findNearlyConstantValue([0, 1, 2, 3, 4], 1), null);
            assert.strictEqual(findNearlyConstantValue([0, 1, 2, 3, 4], 2), 2);
            assert.strictEqual(findNearlyConstantValue([0, 3, 4, 3, 4, 3, 4, 3, 4], 2), null);
        });
    });

    describe('detectImageFormat', () => {
        // TextEncoder polyfill from <https://developer.mozilla.org/ja/docs/Web/API/TextEncoder>
        if (typeof TextEncoder === "undefined") {
            TextEncoder = function TextEncoder() { };
            TextEncoder.prototype.encode = function encode(str) {
                "use strict";
                var Len = str.length, resPos = -1;
                // The Uint8Array's length must be at least 3x the length of the string because an invalid UTF-16
                //  takes up the equivelent space of 3 UTF-8 characters to encode it properly. However, Array's
                //  have an auto expanding length and 1.5x should be just the right balance for most uses.
                var resArr = typeof Uint8Array === "undefined" ? new Array(Len * 1.5) : new Uint8Array(Len * 3);
                for (var point = 0, nextcode = 0, i = 0; i !== Len;) {
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
                                resArr[resPos += 1] = (0x1e/*0b11110*/ << 3) | (point >>> 18);
                                resArr[resPos += 1] = (0x2/*0b10*/ << 6) | ((point >>> 12) & 0x3f/*0b00111111*/);
                                resArr[resPos += 1] = (0x2/*0b10*/ << 6) | ((point >>> 6) & 0x3f/*0b00111111*/);
                                resArr[resPos += 1] = (0x2/*0b10*/ << 6) | (point & 0x3f/*0b00111111*/);
                                continue;
                            }
                        } else {
                            resArr[resPos += 1] = 0xef/*0b11101111*/; resArr[resPos += 1] = 0xbf/*0b10111111*/;
                            resArr[resPos += 1] = 0xbd/*0b10111101*/; continue;
                        }
                    }
                    if (point <= 0x007f) {
                        resArr[resPos += 1] = (0x0/*0b0*/ << 7) | point;
                    } else if (point <= 0x07ff) {
                        resArr[resPos += 1] = (0x6/*0b110*/ << 5) | (point >>> 6);
                        resArr[resPos += 1] = (0x2/*0b10*/ << 6) | (point & 0x3f/*0b00111111*/);
                    } else {
                        resArr[resPos += 1] = (0xe/*0b1110*/ << 4) | (point >>> 12);
                        resArr[resPos += 1] = (0x2/*0b10*/ << 6) | ((point >>> 6) & 0x3f/*0b00111111*/);
                        resArr[resPos += 1] = (0x2/*0b10*/ << 6) | (point & 0x3f/*0b00111111*/);
                    }
                }
                if (typeof Uint8Array !== "undefined") return resArr.subarray(0, resPos + 1);
                // else // IE 6-9
                resArr.length = resPos + 1; // trim off extra weight
                return resArr;
            };
            TextEncoder.prototype.toString = function () { return "[object TextEncoder]" };
            try { // Object.defineProperty only works on DOM prototypes in IE8
                Object.defineProperty(TextEncoder.prototype, "encoding", {
                    get: function () {
                        if (TextEncoder.prototype.isPrototypeOf(this)) return "utf-8";
                        else throw TypeError("Illegal invocation");
                    }
                });
            } catch (e) { /*IE6-8 fallback*/ TextEncoder.prototype.encoding = "utf-8"; }
            if (typeof Symbol !== "undefined") TextEncoder.prototype[Symbol.toStringTag] = "TextEncoder";
        }

        const detect = function (content) {
            let u8array;
            if (typeof content === 'string') {
                u8array = (new TextEncoder).encode(content);
            } else {
                u8array = new Uint8Array(content);
            }
            const datauri = jsTestUtil.dataURIFromArrayBuffer(u8array);
            const binary = compareUtil.binaryFromDataURI(datauri);
            const format = compareUtil.detectImageFormat(binary);
            return format;
        };
        it('should return null on invalid input', () => {
            assert.strictEqual(detect([]), null);
            assert.strictEqual(detect([0, 1, 2, 3]), null);
        });

        it('should handle PNG', () => {
            let f;
            f = detect([0x89, 0x50, 0x4e, 0x47]);
            assert.strictEqual(f.toString(), 'PNG');
            assert.strictEqual(f.color, 'unknown');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
                0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0x08, 0x61, 0x63, 0x54, 0x4C, // acTL
                0, 0, 0, 0x01, 0, 0, 0, 0, 99, 99, 99, 99,
                0, 0, 0, 0x1a, 0x66, 0x63, 0x54, 0x4C, // fcTL
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, 0x07, 0x00, 0x64, // d=7/100
                0, 0, 99, 99, 99, 99
            ]);
            assert.strictEqual(f.toString(), 'PNG (APNG)');
            assert.strictEqual(f.color, 'unknown');
            assert.strictEqual(f.anim && f.anim.frameCount, 1);
            assert.strictEqual(f.anim && f.anim.durationNum, 7);
            assert.strictEqual(f.anim && f.anim.durationDen, 100);

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x01, 0x00, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'Grayscale 1 (1bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x02, 0x00, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'Grayscale 2 (2bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x04, 0x00, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'Grayscale 4 (4bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x08, 0x00, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'Grayscale 8 (8bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x10, 0x00, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'Grayscale 16 (16bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x10, 0x00, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0x00, 0x74, 0x52, 0x4e, 0x53, // tRNS
            ]);
            assert.strictEqual(f.color, 'Grayscale 16 (16bpp) + Transparent');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x08, 0x02, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'RGB 8.8.8 (24bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x10, 0x02, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'RGB 16.16.16 (48bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x10, 0x02, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0x00, 0x74, 0x52, 0x4e, 0x53, // tRNS
            ]);
            assert.strictEqual(f.color, 'RGB 16.16.16 (48bpp) + Transparent');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x01, 0x03, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (1bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x02, 0x03, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (2bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x04, 0x03, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (4bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x08, 0x03, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (8bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x04, 0x03, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0x00, 0x74, 0x52, 0x4e, 0x53, // tRNS
            ]);
            assert.strictEqual(f.color, 'Indexed RGBA 8.8.8.8 (4bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x08, 0x04, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'Grayscale+Alpha 8.8 (16bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x10, 0x04, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'Grayscale+Alpha 16.16 (32bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x08, 0x06, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'RGBA 8.8.8.8 (32bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x10, 0x06, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'RGBA 16.16.16.16 (64bpp)');

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
                0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x08, 0x06, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0x08, 0x61, 0x63, 0x54, 0x4C, // acTL
                0, 0, 0, 0x02, 0, 0, 0, 0, 99, 99, 99, 99,
                0, 0, 0, 0x1a, 0x66, 0x63, 0x54, 0x4C, // fcTL
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, 0x07, 0x00, 0x64, // d=7/100
                0, 0, 99, 99, 99, 99,
                0, 0, 0, 0x1a, 0x66, 0x63, 0x54, 0x4C, // fcTL
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, 0x07, 0x00, 0x64, // d=7/100
                0, 0, 99, 99, 99, 99
            ]);
            assert.strictEqual(f.toString(), 'PNG (APNG)');
            assert.strictEqual(f.color, 'RGBA 8.8.8.8 (32bpp)');
            assert.strictEqual(f.anim && f.anim.frameCount, 2);
            assert.strictEqual(f.anim && f.anim.durationNum, 7);
            assert.strictEqual(f.anim && f.anim.durationDen, 50);
            assert.strictEqual(f.anim && f.anim.fpsNum, 100);
            assert.strictEqual(f.anim && f.anim.fpsDen, 7);
            assert.ok(f.anim && f.anim.approxFPS && 0.05 >= Math.abs(100 / 7 - f.anim.approxFPS));

            f = detect([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
                0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
                0, 0, 0, 0, 0, 0, 0, 0, 0x08, 0x02, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0x08, 0x61, 0x63, 0x54, 0x4C, // acTL
                0, 0, 0, 0x04, 0, 0, 0, 0, 99, 99, 99, 99,
                0, 0, 0, 0x1a, 0x66, 0x63, 0x54, 0x4C, // fcTL
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, 0x07, 0x00, 0x64, // d=7/100
                0, 0, 99, 99, 99, 99,
                0, 0, 0, 0x1a, 0x66, 0x63, 0x54, 0x4C, // fcTL
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, 0x08, 0x00, 0x64, // d=8/100
                0, 0, 99, 99, 99, 99,
                0, 0, 0, 0x1a, 0x66, 0x63, 0x54, 0x4C, // fcTL
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, 0x07, 0x00, 0x64, // d=7/100
                0, 0, 99, 99, 99, 99,
                0, 0, 0, 0x1a, 0x66, 0x63, 0x54, 0x4C, // fcTL
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, 0x08, 0x00, 0x64, // d=8/100
                0, 0, 99, 99, 99, 99
            ]);
            assert.strictEqual(f.toString(), 'PNG (APNG)');
            assert.strictEqual(f.color, 'RGB 8.8.8 (24bpp)');
            assert.strictEqual(f.anim && f.anim.frameCount, 4);
            assert.strictEqual(f.anim && f.anim.durationNum, 3);
            assert.strictEqual(f.anim && f.anim.durationDen, 10);
            assert.strictEqual(f.anim && f.anim.fpsNum, null);
            assert.strictEqual(f.anim && f.anim.fpsDen, null);
            assert.ok(f.anim && f.anim.approxFPS && 0.05 >= Math.abs(40 / 3 - f.anim.approxFPS));
        });

        it('should handle GIF', () => {
            let f;
            f = detect([0x47, 0x49, 0x46, 0x38]);
            assert.strictEqual(f.toString(), 'GIF');
            assert.strictEqual(f.color, 'unknown');

            f = detect([
                0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x00, 0, 0,
                0x21, 0xff, // Application Extension
                10, 0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0, 0, 0 // NETS CAPE
            ]);
            assert.strictEqual(f.toString(), 'GIF (Animated)');
            assert.strictEqual(f.color, 'unknown');
            assert.strictEqual(f.anim && f.anim.frameCount, 0);
            assert.strictEqual(f.anim && f.anim.durationNum, 0);

            f = detect([
                0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x80, 0, 0, // GCT: 1bit
                0x00, 0x00, 0x00, 0xff, 0xff, 0xff,
                0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, // no LCT
            ]);
            assert.strictEqual(f.toString(), 'GIF');
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (1bpp)');

            f = detect([
                0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x80, 0, 0, // GCT: 1bit
                0x00, 0x00, 0x00, 0xff, 0xff, 0xff,
                0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x81, // LCT: 2bit
            ]);
            assert.strictEqual(f.toString(), 'GIF');
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (2bpp)');

            f = detect([
                0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x00, 0, 0, // no GCT
                0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x82, // LCT: 3bit
            ]);
            assert.strictEqual(f.toString(), 'GIF');
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (3bpp)');

            f = detect([
                0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x83, 0, 0, // GCT: 4bit
                0x00, 0x00, 0x00, 0x11, 0x11, 0x11, 0x22, 0x22, 0x22, 0x33, 0x33, 0x33,
                0x44, 0x44, 0x44, 0x55, 0x55, 0x55, 0x66, 0x66, 0x66, 0x77, 0x77, 0x77,
                0x88, 0x88, 0x88, 0x99, 0x99, 0x99, 0xaa, 0xaa, 0xaa, 0xbb, 0xbb, 0xbb,
                0xcc, 0xcc, 0xcc, 0xdd, 0xdd, 0xdd, 0xee, 0xee, 0xee, 0xff, 0xff, 0xff,
                0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, // no LCT
            ]);
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (4bpp)');

            f = detect([
                0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x00, 0, 0, // no GCT
                0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x84, // LCT: 5bit
            ]);
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (5bpp)');

            f = detect([
                0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x00, 0, 0, // no GCT
                0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x85, // LCT: 6bit
            ]);
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (6bpp)');

            f = detect([
                0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x00, 0, 0, // no GCT
                0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x86, // LCT: 7bit
            ]);
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (7bpp)');

            f = detect([
                0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x00, 0, 0, // no GCT
                0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x87, // LCT: 8bit
            ]);
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (8bpp)');

            f = detect([
                0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x00, 0, 0,
                0x21, 0xf9, 4, 0x01, 4, 0, 255, 0, // Graphic Control Extension
                0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x87, // LCT: 8bit
            ]);
            assert.strictEqual(f.toString(), 'GIF');
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (8bpp) + Transparent');

            f = detect([
                0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x81, 0, 0, // GCT: 2bit
                0x00, 0x00, 0x00, 0x55, 0x55, 0x55, 0xaa, 0xaa, 0xaa, 0xff, 0xff, 0xff,
                0x21, 0xff, // Application Extension
                10, 0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0, 0, 0, // NETS CAPE
                0x21, 0xf9, 4, 0x00, 7, 0, 255, 0, // Graphic Control Extension
                0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, // no LCT
                0x21, 0xf9, 4, 0x00, 7, 0, 255, 0, // Graphic Control Extension
                0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, // no LCT
            ]);
            assert.strictEqual(f.toString(), 'GIF (Animated)');
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (2bpp)');
            assert.strictEqual(f.anim && f.anim.frameCount, 2);
            assert.strictEqual(f.anim && f.anim.durationNum, 14);
            assert.strictEqual(f.anim && f.anim.durationDen, 100);
            assert.strictEqual(f.anim && f.anim.fpsNum, 100);
            assert.strictEqual(f.anim && f.anim.fpsDen, 7);
            assert.ok(f.anim && f.anim.approxFPS && 0.05 >= Math.abs(100 / 7 - f.anim.approxFPS));

            f = detect([
                0x47, 0x49, 0x46, 0x38, 0, 0, 0, 0, 0, 0, 0x82, 0, 0, // GCT: 3bit
                0x00, 0x00, 0x00, 0x55, 0x55, 0x55, 0xaa, 0xaa, 0xaa, 0xff, 0xff, 0xff,
                0xff, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00,
                0x21, 0xff, // Application Extension
                10, 0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0, 0, 0, // NETS CAPE
                0x21, 0xf9, 4, 0x00, 7, 0, 255, 0, // Graphic Control Extension
                0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, // no LCT
                0x21, 0xf9, 4, 0x00, 8, 0, 255, 0, // Graphic Control Extension
                0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, // no LCT
                0x21, 0xf9, 4, 0x00, 7, 0, 255, 0, // Graphic Control Extension
                0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, // no LCT
                0x21, 0xf9, 4, 0x00, 8, 0, 255, 0, // Graphic Control Extension
                0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0x00, // no LCT
            ]);
            assert.strictEqual(f.toString(), 'GIF (Animated)');
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (3bpp)');
            assert.strictEqual(f.anim && f.anim.frameCount, 4);
            assert.strictEqual(f.anim && f.anim.durationNum, 30);
            assert.strictEqual(f.anim && f.anim.durationDen, 100);
            assert.strictEqual(f.anim && f.anim.fpsNum, null);
            assert.strictEqual(f.anim && f.anim.fpsDen, null);
            assert.ok(f.anim && f.anim.approxFPS && 0.05 >= Math.abs(400 / 30 - f.anim.approxFPS));
        });

        it('should handle BMP', () => {
            let f;
            f = detect([0x42, 0x4d, 0, 0]);
            assert.strictEqual(f.toString(), 'BMP');
            assert.strictEqual(f.color, 'unknown');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x01, 0x00, // Windows style
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (1bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                12, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x01, 0x00, // OS/2 style
            ]);
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (1bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x04, 0x00, // Windows style
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (4bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                12, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x04, 0x00, // OS/2 style
            ]);
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (4bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x08, 0x00, // Windows style
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (8bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                12, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x08, 0x00, // OS/2 style
            ]);
            assert.strictEqual(f.color, 'Indexed RGB 8.8.8 (8bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'RGB 5.5.5 (16bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                12, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // OS/2 style
            ]);
            assert.strictEqual(f.color, 'RGB 5.5.5 (16bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
                40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=40
                0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
                0x00, 0x7c, 0, 0, 0xe0, 0x03, 0, 0, 0x1f, 0x00, 0, 0,
            ]);
            assert.strictEqual(f.color, 'RGB 5.5.5 (16bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
                40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=40
                0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
                0x00, 0xf8, 0, 0, 0xe0, 0x07, 0, 0, 0x1f, 0x00, 0, 0,
            ]);
            assert.strictEqual(f.color, 'RGB 5.6.5 (16bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
                40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=40
                0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
                0x00, 0x0e, 0, 0, 0xe0, 0x01, 0, 0, 0x1f, 0x00, 0, 0,
            ]);
            assert.strictEqual(f.color, 'RGB 3.4.5 (16bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
                40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=40
                0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
                0x00, 0xfe, 0, 0, 0x00, 0x00, 0, 0, 0x00, 0x00, 0, 0,
            ]);
            assert.strictEqual(f.color, 'R 7 (16bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
                40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=40
                0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
                0x00, 0x00, 0, 0, 0xff, 0xff, 0, 0, 0x00, 0x00, 0, 0,
            ]);
            assert.strictEqual(f.color, 'G 16 (16bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
                40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=40
                0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
                0x00, 0x00, 0, 0, 0x00, 0xff, 0, 0, 0xff, 0x00, 0, 0,
            ]);
            assert.strictEqual(f.color, 'GB 8.8 (16bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
                56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=56
                0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
                0x00, 0x0e, 0, 0, 0xe0, 0x01, 0, 0, 0x1f, 0x00, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'RGB 3.4.5 (16bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
                56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=56
                0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
                0x00, 0x0e, 0, 0, 0xe0, 0x01, 0, 0, 0x1f, 0x00, 0, 0, 0x00, 0xf0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'RGBA 3.4.5.4 (16bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
                56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x10, 0x00, // Windows style, biSize=56
                0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
                0x00, 0xff, 0, 0, 0x00, 0x00, 0, 0, 0x00, 0x00, 0, 0, 0xff, 0x00, 0, 0,
            ]);
            assert.strictEqual(f.color, 'RA 8.8 (16bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x18, 0x00, // Windows style
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'RGB 8.8.8 (24bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                12, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x18, 0x00, // OS/2 style
            ]);
            assert.strictEqual(f.color, 'RGB 8.8.8 (24bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x20, 0x00, // Windows style
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'RGB 8.8.8 (32bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                12, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x20, 0x00, // OS/2 style
            ]);
            assert.strictEqual(f.color, 'RGB 8.8.8 (32bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
                40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x20, 0x00, // Windows style, biSize=40
                0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
                0x00, 0x00, 0xfe, 0, 0x00, 0xfe, 0x01, 0, 0xff, 0x01, 0x00, 0,
            ]);
            assert.strictEqual(f.color, 'RGB 7.8.9 (32bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
                40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x20, 0x00, // Windows style, biSize=40
                0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
                0, 0, 0, 0, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00,
            ]);
            assert.strictEqual(f.color, 'GB 16.16 (32bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
                56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x20, 0x00, // Windows style, biSize=56
                0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
                0x00, 0x00, 0xf0, 0x3f, 0x00, 0xfc, 0x0f, 0x00, 0xff, 0x03, 0x00, 0x00, 0, 0, 0, 0,
            ]);
            assert.strictEqual(f.color, 'RGB 10.10.10 (32bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
                56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x20, 0x00, // Windows style, biSize=56
                0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
                0xff, 0x00, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00, 0x00, 0xff,
            ]);
            assert.strictEqual(f.color, 'RGBA 8.8.8.8 (32bpp)');

            f = detect([
                0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0,
                56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0x20, 0x00, // Windows style, biSize=56
                0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // compression=3
                0xff, 0x0f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0xff, 0x00,
            ]);
            assert.strictEqual(f.color, 'RA 12.12 (32bpp)');
        });

        it('should handle JPEG', () => {
            let f;
            f = detect([0xff, 0xd8, 0xff, 0xe0]);
            assert.strictEqual(f.toString(), 'JPEG');
            assert.strictEqual(f.color, 'unknown');

            f = detect([
                0xff, 0xd8, // SOI
                0xff, 0xe2, 0, 6, 0x4d, 0x50, 0x46, 0x00 // APP2 'MPF\0'
            ]);
            assert.strictEqual(f.toString(), 'JPEG (MPF)');
            assert.strictEqual(f.color, 'unknown');

            f = detect([
                0xff, 0xd8, // SOI
                0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 1,   // SOF0
            ]);
            assert.strictEqual(f.color, 'Grayscale 8 (8bpp)');

            f = detect([
                0xff, 0xd8, // SOI
                0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
            ]);
            assert.strictEqual(f.color, 'YCbCr 8.8.8');

            f = detect([
                0xff, 0xd8, // SOI
                0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
                0, 0x22, 0, 0, 0x21, 0, 0, 0x12, 0,   // sampling pattern
            ]);
            assert.strictEqual(f.color, 'YCbCr 8.8.8 (uncommon sampling Y=2x2 Cb=2x1 Cr=1x2)');

            f = detect([
                0xff, 0xd8, // SOI
                0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
                0, 0x11, 0, 0, 0x11, 0, 0, 0x11, 0,   // sampling pattern
            ]);
            assert.strictEqual(f.color, 'YCbCr 8.8.8 (24bpp 4:4:4)');

            f = detect([
                0xff, 0xd8, // SOI
                0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
                0, 0x22, 0, 0, 0x22, 0, 0, 0x22, 0,   // sampling pattern (redundant notation)
            ]);
            assert.strictEqual(f.color, 'YCbCr 8.8.8 (24bpp 4:4:4-variant Y=2x2 Cb=2x2 Cr=2x2)');

            f = detect([
                0xff, 0xd8, // SOI
                0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
                0, 0x21, 0, 0, 0x11, 0, 0, 0x11, 0,   // sampling pattern
            ]);
            assert.strictEqual(f.color, 'YCbCr 8.8.8 (16bpp 4:2:2)');

            f = detect([
                0xff, 0xd8, // SOI
                0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
                0, 0x12, 0, 0, 0x11, 0, 0, 0x11, 0,   // sampling pattern
            ]);
            assert.strictEqual(f.color, 'YCbCr 8.8.8 (16bpp 4:4:0)');

            f = detect([
                0xff, 0xd8, // SOI
                0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
                0, 0x22, 0, 0, 0x11, 0, 0, 0x11, 0,   // sampling pattern
            ]);
            assert.strictEqual(f.color, 'YCbCr 8.8.8 (12bpp 4:2:0)');

            f = detect([
                0xff, 0xd8, // SOI
                0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
                0, 0x41, 0, 0, 0x11, 0, 0, 0x11, 0,   // sampling pattern
            ]);
            assert.strictEqual(f.color, 'YCbCr 8.8.8 (12bpp 4:1:1)');

            f = detect([
                0xff, 0xd8, // SOI
                0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
                0, 0x31, 0, 0, 0x11, 0, 0, 0x11, 0,   // sampling pattern
            ]);
            assert.strictEqual(f.color, 'YCbCr 8.8.8 (40/3 bpp 3:1:1)');

            f = detect([
                0xff, 0xd8, // SOI
                0xff, 0xc0, 0, 0, 0, 0, 0, 0, 0, 3,   // SOF0
                0, 0x42, 0, 0, 0x11, 0, 0, 0x11, 0,   // sampling pattern
            ]);
            assert.strictEqual(f.color, 'YCbCr 8.8.8 (10bpp 4:1:0)');
        });

        it('should handle TIFF', () => {
            let f;
            f = detect([0x4d, 0x4d, 0x00, 0x2a]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'unknown');

            f = detect([0x49, 0x49, 0x2a, 0x00]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'unknown');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 1,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, // PhotometricInterpretation = 0
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'Grayscale 1 (1bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 2,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
                0x01, 0x02, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // BitsPerSample = [1]
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'Grayscale 1 (1bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 2,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
                0x01, 0x02, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // BitsPerSample = [2]
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'Grayscale 2 (2bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 2,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
                0x01, 0x02, 0, 3, 0, 0, 0, 1, 0, 4, 0, 0, // BitsPerSample = [4]
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'Grayscale 4 (4bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 2,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
                0x01, 0x02, 0, 3, 0, 0, 0, 1, 0, 8, 0, 0, // BitsPerSample = [8]
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'Grayscale 8 (8bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 2,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
                0x01, 0x02, 0, 3, 0, 0, 0, 1, 0, 16, 0, 0, // BitsPerSample = [16]
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'Grayscale 16 (16bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 3,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
                0x01, 0x02, 0, 3, 0, 0, 0, 2, 0, 8, 0, 8, // BitsPerSample = [8, 8]
                0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // ExtraSamples [1]
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'Grayscale+Alpha (pre-multiplied) 8.8 (16bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 3,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
                0x01, 0x02, 0, 3, 0, 0, 0, 2, 0, 8, 0, 4, // BitsPerSample = [8, 4]
                0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // ExtraSamples [1]
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'Grayscale+Alpha (pre-multiplied) 8.4 (12bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 3,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // PhotometricInterpretation = 1
                0x01, 0x02, 0, 3, 0, 0, 0, 2, 0, 4, 0, 8, // BitsPerSample = [4, 8]
                0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // ExtraSamples [2]
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'Grayscale+Alpha 4.8 (12bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 3,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
                0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 3, 0, 0, // SamplesPerPixel = 3
                0x01, 0x02, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0x2e, // BitsPerSample = [8, 8, 8]
                0, 8, 0, 8, 0, 8,
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'RGB 8.8.8 (24bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 3,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
                0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 3, 0, 0, // SamplesPerPixel = 3
                0x01, 0x02, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0x2e, // BitsPerSample = [16, 16, 16]
                0, 16, 0, 16, 0, 16,
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'RGB 16.16.16 (48bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 4,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
                0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 4, 0, 0, // SamplesPerPixel = 4
                0x01, 0x02, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0x3a, // BitsPerSample = [8, 8, 8, 8]
                0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // ExtraSamples [1]
                0, 8, 0, 8, 0, 8, 0, 8
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'RGBA (pre-multiplied) 8.8.8.8 (32bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 4,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
                0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 4, 0, 0, // SamplesPerPixel = 4
                0x01, 0x02, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0x3a, // BitsPerSample = [16, 16, 16, 16]
                0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // ExtraSamples [1]
                0, 16, 0, 16, 0, 16, 0, 16
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'RGBA (pre-multiplied) 16.16.16.16 (64bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 4,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
                0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 4, 0, 0, // SamplesPerPixel = 4
                0x01, 0x02, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0x3a, // BitsPerSample = [8, 8, 8, 16]
                0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // ExtraSamples [1]
                0, 8, 0, 8, 0, 8, 0, 16
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'RGBA (pre-multiplied) 8.8.8.16 (40bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 4,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
                0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 4, 0, 0, // SamplesPerPixel = 4
                0x01, 0x02, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0x3a, // BitsPerSample = [8, 8, 8, 8]
                0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // ExtraSamples [2]
                0, 8, 0, 8, 0, 8, 0, 8
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'RGBA 8.8.8.8 (32bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 4,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
                0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 4, 0, 0, // SamplesPerPixel = 4
                0x01, 0x02, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0x3a, // BitsPerSample = [16, 16, 16, 16]
                0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // ExtraSamples [2]
                0, 16, 0, 16, 0, 16, 0, 16
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'RGBA 16.16.16.16 (64bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 4,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // PhotometricInterpretation = 2
                0x01, 0x15, 0, 3, 0, 0, 0, 1, 0, 4, 0, 0, // SamplesPerPixel = 4
                0x01, 0x02, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0x3a, // BitsPerSample = [16, 16, 16, 8]
                0x01, 0x52, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // ExtraSamples [2]
                0, 16, 0, 16, 0, 16, 0, 8
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'RGBA 16.16.16.8 (56bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 1,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 3, 0, 0, // PhotometricInterpretation = 3
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'Indexed RGB 16.16.16 (1bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 2,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 3, 0, 0, // PhotometricInterpretation = 3
                0x01, 0x02, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, // BitsPerSample = [1]
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'Indexed RGB 16.16.16 (1bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 2,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 3, 0, 0, // PhotometricInterpretation = 3
                0x01, 0x02, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, // BitsPerSample = [2]
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'Indexed RGB 16.16.16 (2bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 2,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 3, 0, 0, // PhotometricInterpretation = 3
                0x01, 0x02, 0, 3, 0, 0, 0, 1, 0, 4, 0, 0, // BitsPerSample = [4]
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'Indexed RGB 16.16.16 (4bpp)');

            f = detect([
                0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, 0, 2,
                0x01, 0x06, 0, 3, 0, 0, 0, 1, 0, 3, 0, 0, // PhotometricInterpretation = 3
                0x01, 0x02, 0, 3, 0, 0, 0, 1, 0, 8, 0, 0, // BitsPerSample = [8]
            ]);
            assert.strictEqual(f.toString(), 'TIFF');
            assert.strictEqual(f.color, 'Indexed RGB 16.16.16 (8bpp)');
        });

        it('should handle WebP', () => {
            let f;
            f = detect([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
            assert.strictEqual(f.toString(), 'WebP');
            assert.strictEqual(f.color, 'unknown');

            f = detect([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20]); // 'VP8 '
            assert.strictEqual(f.toString(), 'WebP (Lossy)');
            assert.strictEqual(f.color, 'unknown');

            f = detect([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4C]); // 'VP8L'
            assert.strictEqual(f.toString(), 'WebP (Lossless)');
            assert.strictEqual(f.color, 'unknown');

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x00, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x56, 0x50, 0x38, 0x20, 0, 0, 0, 0 // 'VP8 '
            ]);
            assert.strictEqual(f.toString(), 'WebP (Lossy)');
            assert.strictEqual(f.color, 'unknown');

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x00, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x56, 0x50, 0x38, 0x4C, 0, 0, 0, 0 // 'VP8L'
            ]);
            assert.strictEqual(f.toString(), 'WebP (Lossless)');
            assert.strictEqual(f.color, 'unknown');

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0
            ]);
            assert.strictEqual(f.toString(), 'WebP (Animated)');
            assert.strictEqual(f.color, 'unknown');
            assert.strictEqual(f.anim && f.anim.frameCount, 0);
            assert.strictEqual(f.anim && f.anim.durationNum, 0);

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x41, 0x4E, 0x4D, 0x46, 24, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0,
                0x56, 0x50, 0x38, 0x20, 0, 0, 0, 0, // 'VP8 '
            ]);
            assert.strictEqual(f.toString(), 'WebP (Animated Lossy)');
            assert.strictEqual(f.color, 'unknown');
            assert.strictEqual(f.anim && f.anim.frameCount, 1);
            assert.strictEqual(f.anim && f.anim.durationNum, 40);
            assert.strictEqual(f.anim && f.anim.durationDen, 1000);

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x41, 0x4E, 0x4D, 0x46, 24, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0,
                0x56, 0x50, 0x38, 0x4c, 0, 0, 0, 0, // 'VP8L'
            ]);
            assert.strictEqual(f.toString(), 'WebP (Animated Lossless)');
            assert.strictEqual(f.color, 'unknown');
            assert.strictEqual(f.anim && f.anim.frameCount, 1);
            assert.strictEqual(f.anim && f.anim.durationNum, 40);
            assert.strictEqual(f.anim && f.anim.durationDen, 1000);

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x41, 0x4E, 0x4D, 0x46, 24, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0,
                0x56, 0x50, 0x38, 0x20, 0, 0, 0, 0, // 'VP8 '
                0x41, 0x4E, 0x4D, 0x46, 24, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0,
                0x56, 0x50, 0x38, 0x4c, 0, 0, 0, 0, // 'VP8L'
            ]);
            assert.strictEqual(f.toString(), 'WebP (Animated Lossy+Lossless)');
            assert.strictEqual(f.color, 'unknown');
            assert.strictEqual(f.anim && f.anim.frameCount, 2);
            assert.strictEqual(f.anim && f.anim.durationNum, 80);
            assert.strictEqual(f.anim && f.anim.durationDen, 1000);
            assert.strictEqual(f.anim && f.anim.fpsNum, 1000);
            assert.strictEqual(f.anim && f.anim.fpsDen, 40);
            assert.ok(f.anim && f.anim.approxFPS && 0.05 >= Math.abs(25 - f.anim.approxFPS));

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20, 11, 0, 0, 0, // 'VP8 '
                0, 0, 0, 0x9d, 0x01, 0x2a, 0, 0, 0, 0, 0x00,
            ]);
            assert.strictEqual(f.toString(), 'WebP (Lossy)');
            assert.strictEqual(f.color, 'YCbCr 8.8.8 (12bpp 4:2:0)');

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4C, 5, 0, 0, 0, // 'VP8L'
                0x2f, 0, 0, 0, 0x00,
            ]);
            assert.strictEqual(f.toString(), 'WebP (Lossless)');
            assert.strictEqual(f.color, 'RGB 8.8.8 (24bpp)');

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4C, 5, 0, 0, 0, // 'VP8L'
                0x2f, 0, 0, 0, 0x10,
            ]);
            assert.strictEqual(f.toString(), 'WebP (Lossless)');
            assert.strictEqual(f.color, 'RGBA 8.8.8.8 (32bpp)');

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x00, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x56, 0x50, 0x38, 0x20, 11, 0, 0, 0, // 'VP8 '
                0, 0, 0, 0x9d, 0x01, 0x2a, 0, 0, 0, 0, 0x00,
            ]);
            assert.strictEqual(f.toString(), 'WebP (Lossy)');
            assert.strictEqual(f.color, 'YCbCr 8.8.8 (12bpp 4:2:0)');

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x10, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x41, 0x4C, 0x50, 0x48, 0, 0, 0, 0, // 'ALPH'
                0x56, 0x50, 0x38, 0x20, 11, 0, 0, 0, // 'VP8 '
                0, 0, 0, 0x9d, 0x01, 0x2a, 0, 0, 0, 0, 0x00,
            ]);
            assert.strictEqual(f.toString(), 'WebP (Lossy)');
            assert.strictEqual(f.color, 'YCbCr 8.8.8 (12bpp 4:2:0) + Alpha 8');

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x00, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x56, 0x50, 0x38, 0x4C, 5, 0, 0, 0, // 'VP8L'
                0x2f, 0, 0, 0, 0x00
            ]);
            assert.strictEqual(f.toString(), 'WebP (Lossless)');
            assert.strictEqual(f.color, 'RGB 8.8.8 (24bpp)');

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x00, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x56, 0x50, 0x38, 0x4C, 5, 0, 0, 0, // 'VP8L'
                0x2f, 0, 0, 0, 0x10,
            ]);
            assert.strictEqual(f.toString(), 'WebP (Lossless)');
            assert.strictEqual(f.color, 'RGBA 8.8.8.8 (32bpp)');

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x41, 0x4E, 0x4D, 0x46, 35, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x56, 0x50, 0x38, 0x20, 11, 0, 0, 0, // 'VP8 '
                0, 0, 0, 0x9d, 0x01, 0x2a, 0, 0, 0, 0, 0x00, 99,
                0x41, 0x4E, 0x4D, 0x46, 35, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x56, 0x50, 0x38, 0x20, 11, 0, 0, 0, // 'VP8 '
                0, 0, 0, 0x9d, 0x01, 0x2a, 0, 0, 0, 0, 0x00, 99,
            ]);
            assert.strictEqual(f.toString(), 'WebP (Animated Lossy)');
            assert.strictEqual(f.color, 'YCbCr 8.8.8 (12bpp 4:2:0)');
            assert.strictEqual(f.anim && f.anim.frameCount, 2);
            assert.strictEqual(f.anim && f.anim.durationNum, 140);
            assert.strictEqual(f.anim && f.anim.durationDen, 1000);
            assert.strictEqual(f.anim && f.anim.fpsNum, 1000);
            assert.strictEqual(f.anim && f.anim.fpsDen, 70);
            assert.ok(f.anim && f.anim.approxFPS && 0.05 >= Math.abs(100 / 7 - f.anim.approxFPS));

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x41, 0x4E, 0x4D, 0x46, 35, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x56, 0x50, 0x38, 0x20, 11, 0, 0, 0, // 'VP8 '
                0, 0, 0, 0x9d, 0x01, 0x2a, 0, 0, 0, 0, 0x00, 99,
                0x41, 0x4E, 0x4D, 0x46, 35, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 80, 0, 0, 0,
                0x56, 0x50, 0x38, 0x20, 11, 0, 0, 0, // 'VP8 '
                0, 0, 0, 0x9d, 0x01, 0x2a, 0, 0, 0, 0, 0x00, 99,
                0x41, 0x4E, 0x4D, 0x46, 35, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x56, 0x50, 0x38, 0x20, 11, 0, 0, 0, // 'VP8 '
                0, 0, 0, 0x9d, 0x01, 0x2a, 0, 0, 0, 0, 0x00, 99,
                0x41, 0x4E, 0x4D, 0x46, 35, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 80, 0, 0, 0,
                0x56, 0x50, 0x38, 0x20, 11, 0, 0, 0, // 'VP8 '
                0, 0, 0, 0x9d, 0x01, 0x2a, 0, 0, 0, 0, 0x00, 99,
            ]);
            assert.strictEqual(f.toString(), 'WebP (Animated Lossy)');
            assert.strictEqual(f.color, 'YCbCr 8.8.8 (12bpp 4:2:0)');
            assert.strictEqual(f.anim && f.anim.frameCount, 4);
            assert.strictEqual(f.anim && f.anim.durationNum, 300);
            assert.strictEqual(f.anim && f.anim.durationDen, 1000);
            assert.strictEqual(f.anim && f.anim.fpsNum, null);
            assert.strictEqual(f.anim && f.anim.fpsDen, null);
            assert.ok(f.anim && f.anim.approxFPS && 0.05 >= Math.abs(1000 / 75 - f.anim.approxFPS));

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x41, 0x4E, 0x4D, 0x46, 43, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x41, 0x4C, 0x50, 0x48, 0, 0, 0, 0, // 'ALPH'
                0x56, 0x50, 0x38, 0x20, 11, 0, 0, 0, // 'VP8 '
                0, 0, 0, 0x9d, 0x01, 0x2a, 0, 0, 0, 0, 0x00, 99,
                0x41, 0x4E, 0x4D, 0x46, 43, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x41, 0x4C, 0x50, 0x48, 0, 0, 0, 0, // 'ALPH'
                0x56, 0x50, 0x38, 0x20, 11, 0, 0, 0, // 'VP8 '
                0, 0, 0, 0x9d, 0x01, 0x2a, 0, 0, 0, 0, 0x00, 99,
            ]);
            assert.strictEqual(f.toString(), 'WebP (Animated Lossy)');
            assert.strictEqual(f.color, 'YCbCr 8.8.8 (12bpp 4:2:0) + Alpha 8');
            assert.strictEqual(f.anim && f.anim.frameCount, 2);
            assert.strictEqual(f.anim && f.anim.durationNum, 140);
            assert.strictEqual(f.anim && f.anim.durationDen, 1000);
            assert.strictEqual(f.anim && f.anim.fpsNum, 1000);
            assert.strictEqual(f.anim && f.anim.fpsDen, 70);
            assert.ok(f.anim && f.anim.approxFPS && 0.05 >= Math.abs(100 / 7 - f.anim.approxFPS));

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x41, 0x4E, 0x4D, 0x46, 29, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x56, 0x50, 0x38, 0x4c, 5, 0, 0, 0, // 'VP8L'
                0x2f, 0, 0, 0, 0x00, 99,
                0x41, 0x4E, 0x4D, 0x46, 29, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x56, 0x50, 0x38, 0x4c, 5, 0, 0, 0, // 'VP8L'
                0x2f, 0, 0, 0, 0x00, 99,
            ]);
            assert.strictEqual(f.toString(), 'WebP (Animated Lossless)');
            assert.strictEqual(f.color, 'RGB 8.8.8 (24bpp)');
            assert.strictEqual(f.anim && f.anim.frameCount, 2);
            assert.strictEqual(f.anim && f.anim.durationNum, 140);
            assert.strictEqual(f.anim && f.anim.durationDen, 1000);
            assert.strictEqual(f.anim && f.anim.fpsNum, 1000);
            assert.strictEqual(f.anim && f.anim.fpsDen, 70);
            assert.ok(f.anim && f.anim.approxFPS && 0.05 >= Math.abs(100 / 7 - f.anim.approxFPS));

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x41, 0x4E, 0x4D, 0x46, 29, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x56, 0x50, 0x38, 0x4c, 5, 0, 0, 0, // 'VP8L'
                0x2f, 0, 0, 0, 0x10, 99,
                0x41, 0x4E, 0x4D, 0x46, 29, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x56, 0x50, 0x38, 0x4c, 5, 0, 0, 0, // 'VP8L'
                0x2f, 0, 0, 0, 0x10, 99,
            ]);
            assert.strictEqual(f.toString(), 'WebP (Animated Lossless)');
            assert.strictEqual(f.color, 'RGBA 8.8.8.8 (32bpp)');
            assert.strictEqual(f.anim && f.anim.frameCount, 2);
            assert.strictEqual(f.anim && f.anim.durationNum, 140);
            assert.strictEqual(f.anim && f.anim.durationDen, 1000);
            assert.strictEqual(f.anim && f.anim.fpsNum, 1000);
            assert.strictEqual(f.anim && f.anim.fpsDen, 70);
            assert.ok(f.anim && f.anim.approxFPS && 0.05 >= Math.abs(100 / 7 - f.anim.approxFPS));

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x41, 0x4E, 0x4D, 0x46, 35, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x56, 0x50, 0x38, 0x20, 11, 0, 0, 0, // 'VP8 '
                0, 0, 0, 0x9d, 0x01, 0x2a, 0, 0, 0, 0, 0x00, 99,
                0x41, 0x4E, 0x4D, 0x46, 29, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x56, 0x50, 0x38, 0x4c, 5, 0, 0, 0, // 'VP8L'
                0x2f, 0, 0, 0, 0x00, 99,
            ]);
            assert.strictEqual(f.toString(), 'WebP (Animated Lossy+Lossless)');
            assert.strictEqual(f.color, 'RGB 8.8.8 (24bpp), YCbCr 8.8.8 (12bpp 4:2:0)');
            assert.strictEqual(f.anim && f.anim.frameCount, 2);
            assert.strictEqual(f.anim && f.anim.durationNum, 140);
            assert.strictEqual(f.anim && f.anim.durationDen, 1000);
            assert.strictEqual(f.anim && f.anim.fpsNum, 1000);
            assert.strictEqual(f.anim && f.anim.fpsDen, 70);
            assert.ok(f.anim && f.anim.approxFPS && 0.05 >= Math.abs(100 / 7 - f.anim.approxFPS));

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x41, 0x4E, 0x4D, 0x46, 35, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x56, 0x50, 0x38, 0x20, 11, 0, 0, 0, // 'VP8 '
                0, 0, 0, 0x9d, 0x01, 0x2a, 0, 0, 0, 0, 0x00, 99,
                0x41, 0x4E, 0x4D, 0x46, 29, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x56, 0x50, 0x38, 0x4c, 5, 0, 0, 0, // 'VP8L'
                0x2f, 0, 0, 0, 0x10, 99,
            ]);
            assert.strictEqual(f.toString(), 'WebP (Animated Lossy+Lossless)');
            assert.strictEqual(f.color, 'RGBA 8.8.8.8 (32bpp), YCbCr 8.8.8 (12bpp 4:2:0)');
            assert.strictEqual(f.anim && f.anim.frameCount, 2);
            assert.strictEqual(f.anim && f.anim.durationNum, 140);
            assert.strictEqual(f.anim && f.anim.durationDen, 1000);
            assert.strictEqual(f.anim && f.anim.fpsNum, 1000);
            assert.strictEqual(f.anim && f.anim.fpsDen, 70);
            assert.ok(f.anim && f.anim.approxFPS && 0.05 >= Math.abs(100 / 7 - f.anim.approxFPS));

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x41, 0x4E, 0x4D, 0x46, 43, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x41, 0x4C, 0x50, 0x48, 0, 0, 0, 0, // 'ALPH'
                0x56, 0x50, 0x38, 0x20, 11, 0, 0, 0, // 'VP8 '
                0, 0, 0, 0x9d, 0x01, 0x2a, 0, 0, 0, 0, 0x00, 99,
                0x41, 0x4E, 0x4D, 0x46, 29, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x56, 0x50, 0x38, 0x4c, 5, 0, 0, 0, // 'VP8L'
                0x2f, 0, 0, 0, 0x00, 99,
            ]);
            assert.strictEqual(f.toString(), 'WebP (Animated Lossy+Lossless)');
            assert.strictEqual(f.color, 'RGB 8.8.8 (24bpp), YCbCr 8.8.8 (12bpp 4:2:0) + Alpha 8');
            assert.strictEqual(f.anim && f.anim.frameCount, 2);
            assert.strictEqual(f.anim && f.anim.durationNum, 140);
            assert.strictEqual(f.anim && f.anim.durationDen, 1000);
            assert.strictEqual(f.anim && f.anim.fpsNum, 1000);
            assert.strictEqual(f.anim && f.anim.fpsDen, 70);
            assert.ok(f.anim && f.anim.approxFPS && 0.05 >= Math.abs(100 / 7 - f.anim.approxFPS));

            f = detect([
                0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
                0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0, // 'VP8X'
                0x02, 0x00, 0x00, 0x00, 0, 0, 0, 0, 0, 0,
                0x41, 0x4E, 0x4D, 0x46, 43, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x41, 0x4C, 0x50, 0x48, 0, 0, 0, 0, // 'ALPH'
                0x56, 0x50, 0x38, 0x20, 11, 0, 0, 0, // 'VP8 '
                0, 0, 0, 0x9d, 0x01, 0x2a, 0, 0, 0, 0, 0x00, 99,
                0x41, 0x4E, 0x4D, 0x46, 29, 0, 0, 0, // 'ANMF'
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0,
                0x56, 0x50, 0x38, 0x4c, 5, 0, 0, 0, // 'VP8L'
                0x2f, 0, 0, 0, 0x10, 99,
            ]);
            assert.strictEqual(f.toString(), 'WebP (Animated Lossy+Lossless)');
            assert.strictEqual(f.color, 'RGBA 8.8.8.8 (32bpp), YCbCr 8.8.8 (12bpp 4:2:0) + Alpha 8');
            assert.strictEqual(f.anim && f.anim.frameCount, 2);
            assert.strictEqual(f.anim && f.anim.durationNum, 140);
            assert.strictEqual(f.anim && f.anim.durationDen, 1000);
            assert.strictEqual(f.anim && f.anim.fpsNum, 1000);
            assert.strictEqual(f.anim && f.anim.fpsDen, 70);
            assert.ok(f.anim && f.anim.approxFPS && 0.05 >= Math.abs(100 / 7 - f.anim.approxFPS));
        });

        it('should handle SVG', () => {
            let f;
            f = detect('<?xml ?><svg');
            assert.strictEqual(f && f.toString(), 'SVG');
            assert.strictEqual(f && f.color, undefined);

            const BOM = '\ufeff';
            f = detect(BOM + '<?xml ?><svg');
            assert.strictEqual(f && f.toString(), 'SVG');
            assert.strictEqual(f && f.color, undefined);
        });

        it('should handle AVIF', () => {
            let f;
            f = detect([
                0, 0, 0, 16,
                0x66, 0x74, 0x79, 0x70, // 'ftyp'
                0x61, 0x76, 0x69, 0x66, // 'avif'
                0x00, 0x00, 0x00, 0x00
            ]);
            assert.strictEqual(f && f.toString(), 'AVIF');
            f = detect([
                0, 0, 0, 28,
                0x66, 0x74, 0x79, 0x70, // 'ftyp'
                0x6d, 0x69, 0x66, 0x31, // 'mif1'
                0x00, 0x00, 0x00, 0x00,
                0x6d, 0x69, 0x66, 0x31, // 'mif1'
                0x61, 0x76, 0x69, 0x66, // 'avif'
                0x6d, 0x69, 0x61, 0x66  // 'miaf'
            ]);
            assert.strictEqual(f && f.toString(), 'AVIF');
            f = detect([
                0, 0, 0, 28,
                0x66, 0x74, 0x79, 0x70, // 'ftyp'
                0x6d, 0x69, 0x66, 0x31, // 'mif1'
                0x00, 0x00, 0x00, 0x00,
                0x6d, 0x69, 0x66, 0x31, // 'mif1'
                0x68, 0x65, 0x69, 0x63, // 'heic'
                0x68, 0x65, 0x76, 0x63  // 'hevc'
            ]);
            assert.notStrictEqual(f && f.toString(), 'AVIF');  // HEIC
        });
    });
});
