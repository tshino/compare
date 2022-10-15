'use strict';
const assert = require('assert');
const CompareUtil = require('../modules/compare-util.js');

const jsTestUtil = {
    dataURIFromArrayBuffer: function(ab) {
        const str = Array.from(ab).map(u8 => String.fromCharCode(u8)).join('');
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

    describe('browserNameOf', () => {
        const chrome104 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36';
        const firefox104 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:104.0) Gecko/20100101 Firefox/104.0';
        const oldEdge = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.18362';
        const msie = 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko'
        const safari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.2 Safari/605.1.15';
        it('should guess the browser name of given UA string', () => {
            assert.strictEqual(compareUtil.browserNameOf(chrome104), 'chrome');
            assert.strictEqual(compareUtil.browserNameOf(firefox104), 'firefox');
            assert.strictEqual(compareUtil.browserNameOf(oldEdge), 'edge');
            assert.strictEqual(compareUtil.browserNameOf(msie), 'msie');
            assert.strictEqual(compareUtil.browserNameOf(safari), 'safari');
        });
    });
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

    describe('orientationUtil', () => {
        describe('toString', () => {
            const toString = compareUtil.orientationUtil.toString;
            it('should return string representation of given orientation value', () => {
                assert.strictEqual(toString(1), 'TopLeft');
                assert.strictEqual(toString(2), 'TopRight');
                assert.strictEqual(toString(3), 'BottomRight');
                assert.strictEqual(toString(4), 'BottomLeft');
                assert.strictEqual(toString(5), 'LeftTop');
                assert.strictEqual(toString(6), 'RightTop');
                assert.strictEqual(toString(7), 'RightBottom');
                assert.strictEqual(toString(8), 'LeftBottom');
                assert.strictEqual(toString(9), 'Invalid');
                assert.strictEqual(toString(0), 'Invalid');
                assert.strictEqual(toString(null), '‐');
            });
        });

        describe('isTransposed', () => {
            const isTransposed = compareUtil.orientationUtil.isTransposed;
            it('should return true if given orientation is transposed', () => {
                assert.strictEqual(isTransposed(1), false);
                assert.strictEqual(isTransposed(2), false);
                assert.strictEqual(isTransposed(3), false);
                assert.strictEqual(isTransposed(4), false);
                assert.strictEqual(isTransposed(5), true);
                assert.strictEqual(isTransposed(6), true);
                assert.strictEqual(isTransposed(7), true);
                assert.strictEqual(isTransposed(8), true);
                assert.strictEqual(isTransposed(9), false);
                assert.strictEqual(isTransposed(0), false);
                assert.strictEqual(isTransposed(null), false);
            });
        });

        describe('getCSSTransform', () => {
            const getCSSTransform = compareUtil.orientationUtil.getCSSTransform;
            it('should make a piece of CSS transform parameter for given orientation', () => {
                assert.strictEqual(getCSSTransform(1), '');
                assert.strictEqual(getCSSTransform(2), ' scale(-1,1)');
                assert.strictEqual(getCSSTransform(3), ' rotate(180deg)');
                assert.strictEqual(getCSSTransform(4), ' scale(-1,1) rotate(180deg)');
                assert.strictEqual(getCSSTransform(5), ' scale(-1,1) rotate(90deg)');
                assert.strictEqual(getCSSTransform(6), ' rotate(90deg)');
                assert.strictEqual(getCSSTransform(7), ' scale(-1,1) rotate(-90deg)');
                assert.strictEqual(getCSSTransform(8), ' rotate(-90deg)');
                assert.strictEqual(getCSSTransform(9), '');
                assert.strictEqual(getCSSTransform(0), '');
                assert.strictEqual(getCSSTransform(null), '');
            });
        });

        describe('interpretXY', () => {
            const interpretXY = compareUtil.orientationUtil.interpretXY;
            it('should interpret XY coordinate (pixel centered)', () => {
                assert.deepStrictEqual(interpretXY(1, 40, 30, 10, 5), {x: 10, y: 5});
                assert.deepStrictEqual(interpretXY(2, 40, 30, 10, 5), {x: 29, y: 5});
                assert.deepStrictEqual(interpretXY(3, 40, 30, 10, 5), {x: 29, y: 24});
                assert.deepStrictEqual(interpretXY(4, 40, 30, 10, 5), {x: 10, y: 24});
                assert.deepStrictEqual(interpretXY(5, 30, 40, 10, 5), {x: 5, y: 10});
                assert.deepStrictEqual(interpretXY(6, 30, 40, 10, 5), {x: 5, y: 29});
                assert.deepStrictEqual(interpretXY(7, 30, 40, 10, 5), {x: 24, y: 29});
                assert.deepStrictEqual(interpretXY(8, 30, 40, 10, 5), {x: 24, y: 10});
                assert.deepStrictEqual(interpretXY(9, 40, 30, 10, 5), {x: 10, y: 5});
                assert.deepStrictEqual(interpretXY(0, 40, 30, 10, 5), {x: 10, y: 5});
                assert.deepStrictEqual(interpretXY(null, 40, 30, 10, 5), {x: 10, y: 5});
            });
        });

        describe('interpretXY2', () => {
            const interpretXY2 = compareUtil.orientationUtil.interpretXY2;
            it('should interpret XY coordinate (geometric)', () => {
                assert.deepStrictEqual(interpretXY2(1, 40, 30, 10, 5), {x: 10, y: 5});
                assert.deepStrictEqual(interpretXY2(3, 40, 30, 10, 5), {x: 30, y: 25});
                assert.deepStrictEqual(interpretXY2(5, 30, 40, 10, 5), {x: 5, y: 10});
                assert.deepStrictEqual(interpretXY2(7, 30, 40, 10, 5), {x: 25, y: 30});
            });
        });
    });

    describe('aspectRatioUtil', () => {
        const testCases = [
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

        describe('calcAspectRatio', () => {
            it('should make a reduced fraction for given aspect ratio', () => {
                for (const t of testCases) {
                    const desc = 'calcAspectRatio(' + t.inW + ', ' + t.inH + ')';
                    const {w, h} = compareUtil.aspectRatioUtil.calcAspectRatio(t.inW, t.inH);
                    assert.deepStrictEqual({w, h}, {w: t.expectW, h: t.expectH}, desc);
                }
            });
        });

        describe('toString', () => {
            it('should make string representation of given aspect ratio', () => {
                const toString = compareUtil.aspectRatioUtil.toString;
                assert.strictEqual(toString({ w: 1, h: 1 }), '1:1');
                assert.strictEqual(toString({ w: 1, h: 2 }), '1:2');
                assert.strictEqual(toString({ w: 5, h: 2 }), '5:2');
                assert.strictEqual(toString({ w: 16, h: 9 }), '16:9');
                assert.strictEqual(toString({ w: 9, h: 16 }), '9:16');
                assert.strictEqual(toString({ w: 456, h: 257 }), '456:257');
                assert.strictEqual(toString({ w: 15578, h: 7783 }), '15,578:7,783');
            });
        });

        describe('findApproxAspectRatio', () => {
            const findApprox = function (w, h) {
                const a = compareUtil.aspectRatioUtil.calcAspectRatio(w, h);
                const approx = compareUtil.aspectRatioUtil.findApproxAspectRatio(a);
                return approx ? compareUtil.aspectRatioUtil.toString(approx) : null;
            };
            it('should make a reasonable approximation of given aspect ratio', () => {
                assert.strictEqual(findApprox(1, 1), null);
                assert.strictEqual(findApprox(100, 100), null);
                assert.strictEqual(findApprox(100, 200), null);
                assert.strictEqual(findApprox(1920, 1080), null);
                assert.strictEqual(findApprox(3648, 2056), '16:9');
                assert.strictEqual(findApprox(2056, 3648), '9:16');
                assert.strictEqual(findApprox(960, 541), '16:9');
                assert.strictEqual(findApprox(15578, 7783), '2:1');
                assert.strictEqual(findApprox(1001, 500), '2:1');
            });
        });

        describe('makeInfo', () => {
            const makeInfo = compareUtil.aspectRatioUtil.makeInfo;
            it('should make a summary of given aspect ratio', () => {
                assert.deepStrictEqual(makeInfo(1, 1), [1, '1:1']);
                assert.deepStrictEqual(makeInfo(100, 100), [1, '1:1']);
                assert.deepStrictEqual(makeInfo(100, 200), [0.5, '1:2']);
                assert.deepStrictEqual(makeInfo(1, 10), [1 / 10, '1:10']);
                assert.deepStrictEqual(makeInfo(10, 1), [10, '10:1']);
                assert.deepStrictEqual(makeInfo(1920, 1080), [16 / 9, '16:9']);
                assert.deepStrictEqual(makeInfo(1920, 1200), [8 / 5, '8:5']);
                assert.deepStrictEqual(makeInfo(960, 544), [960 / 544, '30:17']);
                assert.deepStrictEqual(makeInfo(2432, 3648), [2432 / 3648, '2:3']);
                assert.deepStrictEqual(makeInfo(2028, 1521), [2028 / 1521, '4:3']);
                assert.deepStrictEqual(makeInfo(2592, 1944), [2592 / 1944, '4:3']);
                assert.deepStrictEqual(makeInfo(400, 301), [400 / 301, '400:301', '4:3']);
                assert.deepStrictEqual(makeInfo(2056, 3648), [2056 / 3648, '257:456', '9:16']);
                assert.deepStrictEqual(makeInfo(3648, 2056), [3648 / 2056, '456:257', '16:9']);
                assert.deepStrictEqual(makeInfo(15578, 7783), [15578 / 7783, '15,578:7,783', '2:1']);
            });
        });
    });

    describe('makeDurationInfo', () => {
        const make = compareUtil.makeDurationInfo;
        it('should make a summary of given animation duration info', () => {
            assert.deepStrictEqual(make(), [null, '‐']);
            assert.deepStrictEqual(make(null), [null, '‐']);
            assert.deepStrictEqual(make({}), [null, '‐']);
            assert.deepStrictEqual(make({ anim: { durationNum: 3, durationDen: 1 } }), [3, '3.000']);
            assert.deepStrictEqual(make({ anim: { durationNum: 14, durationDen: 8 } }), [7 / 4, '1.750']);
            assert.deepStrictEqual(make({ anim: { durationNum: 40, durationDen: 25, fpsNum: 25, fpsDen: 1 } }), [8 / 5, '1.600']);
            assert.deepStrictEqual(make({ anim: { durationNum: 4, durationDen: 3 } }), [4 / 3, '4/3', '1.333']);
            assert.deepStrictEqual(make({ anim: { durationNum: 20, durationDen: 15 } }), [4 / 3, '4/3', '1.333']);
            assert.deepStrictEqual(make({ anim: { durationNum: 20, durationDen: 15, fpsNum: 30, fpsDen: 1 } }), [4 / 3, '40/30', '1.333']);
            assert.deepStrictEqual(make({ anim: { durationNum: 34, durationDen: 24, fpsNum: null, fpsDen: null } }), [34 / 24, '17/12', '1.417']);
            assert.deepStrictEqual(make({ anim: { durationNum: 34, durationDen: 24, fpsNum: 24, fpsDen: 1 } }), [34 / 24, '34/24', '1.417']);
        })
    });

    describe('makeFPSInfo', () => {
        const make = compareUtil.makeFPSInfo;
        const nu = { en: 'non-uniform' };
        it('should make a summary of given animation Frames Per Second info', () => {
            assert.deepStrictEqual(make(), [null, '‐']);
            assert.deepStrictEqual(make(null, nu), [null, '‐']);
            assert.deepStrictEqual(make({}, nu), [null, '‐']);
            assert.deepStrictEqual(make({ anim: { fpsNum: 1, fpsDen: 1, approxFPS: null } }, nu), [1, '1']);
            assert.deepStrictEqual(make({ anim: { fpsNum: 100, fpsDen: 100, approxFPS: null } }, nu), [1, '1']);
            assert.deepStrictEqual(make({ anim: { fpsNum: 1000, fpsDen: 1000, approxFPS: null } }, nu), [1, '1']);
            assert.deepStrictEqual(make({ anim: { fpsNum: 1000, fpsDen: 40, approxFPS: null } }, nu), [25, '25']);
            assert.deepStrictEqual(make({ anim: { fpsNum: 1000, fpsDen: 32, approxFPS: null } }, nu), [1000 / 32, '31.25']);
            assert.deepStrictEqual(make({ anim: { fpsNum: 1000, fpsDen: 30, approxFPS: null } }, nu), [100 / 3, '100/3', '33.33']);
            assert.deepStrictEqual(make({ anim: { fpsNum: 24, fpsDen: 1, approxFPS: null } }, nu), [24, '24']);
            assert.deepStrictEqual(make({ anim: { fpsNum: null, fpsDen: null, approxFPS: 24 } }, nu), [null, nu, '24.0']);
            assert.deepStrictEqual(make({ anim: { fpsNum: null, fpsDen: null, approxFPS: null } }, nu), [null, nu]);
        });
    });

    describe('cursorKeyCodeToXY', () => {
        const cursorKeyCodeToXY = compareUtil.cursorKeyCodeToXY;
        it('should interpret cursor key code to XY coordinate', () => {
            assert.deepStrictEqual(cursorKeyCodeToXY(99), {x: 0, y: 0});

            assert.deepStrictEqual(cursorKeyCodeToXY(37), {x: -1, y: 0});
            assert.deepStrictEqual(cursorKeyCodeToXY(38), {x: 0, y: -1});
            assert.deepStrictEqual(cursorKeyCodeToXY(39), {x: 1, y: 0});
            assert.deepStrictEqual(cursorKeyCodeToXY(40), {x: 0, y: 1});

            assert.deepStrictEqual(cursorKeyCodeToXY(99, 10), {x: 0, y: 0});

            assert.deepStrictEqual(cursorKeyCodeToXY(37, 10), {x: -10, y: 0});
            assert.deepStrictEqual(cursorKeyCodeToXY(38, 10), {x: 0, y: -10});
            assert.deepStrictEqual(cursorKeyCodeToXY(39, 10), {x: 10, y: 0});
            assert.deepStrictEqual(cursorKeyCodeToXY(40, 10), {x: 0, y: 10});
        });
    });

    describe('calcInscribedRect', () => {
        const calcInscribedRect = compareUtil.calcInscribedRect;
        it('should calculate size of inscribed rectangular', () => {
            //assert.strictEqual( calcInscribedRect(0, 0, 0, 0).width === 0 );

            assert.deepStrictEqual(calcInscribedRect(1, 1, 1, 1), {width: 1, height: 1});
            assert.deepStrictEqual(calcInscribedRect(1, 1, 10, 10), {width: 1, height: 1});
            assert.deepStrictEqual(calcInscribedRect(100, 100, 1, 1), {width: 100, height: 100});

            assert.deepStrictEqual(calcInscribedRect(100, 100, 10, 10), {width: 100, height: 100});
            assert.deepStrictEqual(calcInscribedRect(100, 100, 20, 10), {width: 100, height: 50});
            assert.deepStrictEqual(calcInscribedRect(100, 100, 10, 20), {width: 50, height: 100});

            assert.deepStrictEqual(calcInscribedRect(200, 100, 10, 10), {width: 100, height: 100});
            assert.deepStrictEqual(calcInscribedRect(200, 100, 15, 10), {width: 150, height: 100});
            assert.deepStrictEqual(calcInscribedRect(200, 100, 20, 10), {width: 200, height: 100});
            assert.deepStrictEqual(calcInscribedRect(200, 100, 25, 10), {width: 200, height: 80});
            assert.deepStrictEqual(calcInscribedRect(200, 100, 40, 10), {width: 200, height: 50});
            assert.deepStrictEqual(calcInscribedRect(200, 100, 10, 20), {width: 50, height: 100});
            assert.deepStrictEqual(calcInscribedRect(200, 100, 10, 25), {width: 40, height: 100});

            assert.deepStrictEqual(calcInscribedRect(100, 200, 10, 10), {width: 100, height: 100});
            assert.deepStrictEqual(calcInscribedRect(100, 200, 10, 15), {width: 100, height: 150});
            assert.deepStrictEqual(calcInscribedRect(100, 200, 10, 20), {width: 100, height: 200});
            assert.deepStrictEqual(calcInscribedRect(100, 200, 10, 25), {width: 80, height: 200});
            assert.deepStrictEqual(calcInscribedRect(100, 200, 10, 40), {width: 50, height: 200});
            assert.deepStrictEqual(calcInscribedRect(100, 200, 20, 10), {width: 100, height: 50});
            assert.deepStrictEqual(calcInscribedRect(100, 200, 25, 10), {width: 100, height: 40});
        });
    });

    describe('processKeyDownEvent', () => {
        const processKeyDownEvent = compareUtil.processKeyDownEvent;
        const makeEvent = function(def) {
            const event = {};
            event.keyCode = def.keyCode !== undefined ? def.keyCode : 0;
            event.ctrlKey = def.ctrlKey || false;
            event.altKey = def.altKey || false;
            event.metaKey = def.metaKey || false;
            event.shiftKey = def.shiftKey || false;
            return event;
        };
        it('should invoke callback that is corresponding to given keydown event', () => {
            const log = [];
            const callbacks = {
                zoomIn: () => { log.push('zoomIn'); },
                zoomOut: () => { log.push('zoomOut'); },
                cursor: () => { log.push('cursor'); }
            };
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 59 }), callbacks);
            assert.deepStrictEqual(log, ['zoomIn']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 59, shiftKey: true }), callbacks);
            assert.deepStrictEqual(log, ['zoomIn']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 187 }), callbacks);
            assert.deepStrictEqual(log, ['zoomIn']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 187, shiftKey: true }), callbacks);
            assert.deepStrictEqual(log, ['zoomIn']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 107 }), callbacks);
            assert.deepStrictEqual(log, ['zoomIn']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 107, shiftKey: true }), callbacks);
            assert.deepStrictEqual(log, ['zoomIn']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 33 }), callbacks);
            assert.deepStrictEqual(log, ['zoomIn']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 173 }), callbacks);
            assert.deepStrictEqual(log, ['zoomOut']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 173, shiftKey: true }), callbacks);
            assert.deepStrictEqual(log, ['zoomOut']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 189 }), callbacks);
            assert.deepStrictEqual(log, ['zoomOut']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 189, shiftKey: true }), callbacks);
            assert.deepStrictEqual(log, ['zoomOut']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 109 }), callbacks);
            assert.deepStrictEqual(log, ['zoomOut']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 109, shiftKey: true }), callbacks);
            assert.deepStrictEqual(log, ['zoomOut']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 34 }), callbacks);
            assert.deepStrictEqual(log, ['zoomOut']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 37 }), callbacks);
            assert.deepStrictEqual(log, ['cursor']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 37, shiftKey: true }), callbacks);
            assert.deepStrictEqual(log, ['cursor']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 38 }), callbacks);
            assert.deepStrictEqual(log, ['cursor']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 38, shiftKey: true }), callbacks);
            assert.deepStrictEqual(log, ['cursor']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 39 }), callbacks);
            assert.deepStrictEqual(log, ['cursor']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 39, shiftKey: true }), callbacks);
            assert.deepStrictEqual(log, ['cursor']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 40 }), callbacks);
            assert.deepStrictEqual(log, ['cursor']);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 40, shiftKey: true }), callbacks);
            assert.deepStrictEqual(log, ['cursor']);
        });
        it('should not invoke callbacks for irrelevant event', () => {
            const log = [];
            const callbacks = {
                zoomIn: () => { log.push('zoomIn'); },
                zoomOut: () => { log.push('zoomOut'); },
                cursor: () => { log.push('cursor'); }
            };
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 65 }), callbacks);
            assert.deepStrictEqual(log, []);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 33, shiftKey: true }), callbacks);
            assert.deepStrictEqual(log, []);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 34, shiftKey: true }), callbacks);
            assert.deepStrictEqual(log, []);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 37, ctrlKey: true }), callbacks);
            assert.deepStrictEqual(log, []);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 37, altKey: true }), callbacks);
            assert.deepStrictEqual(log, []);
            log.length = 0;
            processKeyDownEvent(makeEvent({ keyCode: 37, metaKey: true }), callbacks);
            assert.deepStrictEqual(log, []);
        });
        it('should return the value returned by the callback', () => {
            const callbacks = {
                zoomIn: () => { return 'a'; },
                zoomOut: () => { return 'b'; },
                cursor: () => { return 'c'; }
            };
            assert.strictEqual(processKeyDownEvent(makeEvent({ keyCode: 59 }), callbacks), 'a');
            assert.strictEqual(processKeyDownEvent(makeEvent({ keyCode: 173 }), callbacks), 'b');
            assert.strictEqual(processKeyDownEvent(makeEvent({ keyCode: 37 }), callbacks), 'c');
        });
        it('should not invoke callback if not defined', () => {
            assert.ok(processKeyDownEvent(makeEvent({ keyCode: 59 }), {}) === undefined);
            assert.ok(processKeyDownEvent(makeEvent({ keyCode: 173 }), {}) === undefined);
            assert.ok(processKeyDownEvent(makeEvent({ keyCode: 37 }), {}) === undefined);
        });
    });

    describe('processWheelEvent', () => {
        const processWheelEvent = compareUtil.processWheelEvent;
        const makeEvent = function(def) {
            const org = {};
            const event = { originalEvent: org };
            org.deltaMode = def.deltaMode !== undefined ? def.deltaMode : 0;
            org.deltaY = def.deltaY !== undefined ? def.deltaY : 0;
            org.ctrlKey = def.ctrlKey || false;
            org.altKey = def.altKey || false;
            org.metaKey = def.metaKey || false;
            org.shiftKey = def.shiftKey || false;
            return event;
        };
        const PIXEL = 0, LINE = 1, PAGE = 2;
        it('should invoke callback that is corresponding to given wheel event', () => {
            const log = [];
            const callbacks = {
                zoom: (steps) => { log.push(`zoom:${steps.toFixed(1)}`); }
            };
            log.length = 0;
            processWheelEvent(makeEvent({ deltaMode: PIXEL, deltaY: 20 }), callbacks);
            assert.deepStrictEqual(log, ['zoom:2.0']);
            log.length = 0;
            processWheelEvent(makeEvent({ deltaMode: PIXEL, deltaY: -20 }), callbacks);
            assert.deepStrictEqual(log, ['zoom:-2.0']);
            log.length = 0;
            processWheelEvent(makeEvent({ deltaMode: LINE, deltaY: 1 }), callbacks);
            assert.deepStrictEqual(log, ['zoom:1.0']);
            log.length = 0;
            processWheelEvent(makeEvent({ deltaMode: LINE, deltaY: -1 }), callbacks);
            assert.deepStrictEqual(log, ['zoom:-1.0']);
            log.length = 0;
            processWheelEvent(makeEvent({ deltaMode: PAGE, deltaY: 2 }), callbacks);
            assert.deepStrictEqual(log, ['zoom:2.0']);
        });
        it('should clamp the delta value', () => {
            const log = [];
            const callbacks = {
                zoom: (steps) => { log.push(`zoom:${steps.toFixed(1)}`); }
            };
            log.length = 0;
            processWheelEvent(makeEvent({ deltaMode: PIXEL, deltaY: 50 }), callbacks);
            assert.deepStrictEqual(log, ['zoom:3.0']);
            log.length = 0;
            processWheelEvent(makeEvent({ deltaMode: PIXEL, deltaY: -100 }), callbacks);
            assert.deepStrictEqual(log, ['zoom:-3.0']);
            log.length = 0;
            processWheelEvent(makeEvent({ deltaMode: LINE, deltaY: 10 }), callbacks);
            assert.deepStrictEqual(log, ['zoom:3.0']);
        });
        it('should not invoke callback if the delta value is zero', () => {
            const log = [];
            const callbacks = {
                zoom: (steps) => { log.push(`zoom:${steps.toFixed(1)}`); }
            };
            log.length = 0;
            processWheelEvent(makeEvent({ deltaMode: PIXEL, deltaY: 0 }), callbacks);
            assert.deepStrictEqual(log, []);
        });
        it('should not invoke callbacks for irrelevant event', () => {
            const log = [];
            const callbacks = {
                zoom: (steps) => { log.push(`zoom:${steps.toFixed(1)}`); }
            };
            log.length = 0;
            processWheelEvent(makeEvent({ ctrlKey: true, deltaMode: LINE, deltaY: 3 }), callbacks);
            assert.deepStrictEqual(log, []);
            log.length = 0;
            processWheelEvent(makeEvent({ shiftKey: true, deltaMode: LINE, deltaY: 3 }), callbacks);
            assert.deepStrictEqual(log, []);
            log.length = 0;
            processWheelEvent(makeEvent({ altKey: true, deltaMode: LINE, deltaY: 3 }), callbacks);
            assert.deepStrictEqual(log, []);
            log.length = 0;
            processWheelEvent(makeEvent({ metaKey: true, deltaMode: LINE, deltaY: 3 }), callbacks);
            assert.deepStrictEqual(log, []);
        });
        it('should not invoke callback if not defined', () => {
            assert.ok(processWheelEvent(makeEvent({ deltaMode: LINE, deltaY: 3 }), {}) === false);
        });
    });

    // TODO: add tests for makeTouchEventFilter
    // TODO: add tests for makeZoomController
    // TODO: add tests for makeRotationController
    // TODO: add tests for makeRotationInputFilter

    describe('vertexUtil', () => {
        describe('makeCube', () => {
            it('should make an array of vertices of a cube', () => {
                const cube = compareUtil.vertexUtil.makeCube(6, 4, 2);
                const expected = [
                    [-3, -2, -1],
                    [-3, -2, 1],
                    [-3, 0, -1],
                    [-3, 0, 1],
                    [-3, 2, -1],
                    [-3, 2, 1],
                    [0, -2, -1],
                    [0, -2, 1],
                    [0, 0, -1],
                    [0, 0, 1],
                    [0, 2, -1],
                    [0, 2, 1],
                    [3, -2, -1],
                    [3, -2, 1],
                    [3, 0, -1],
                    [3, 0, 1],
                    [3, 2, -1],
                    [3, 2, 1]
                ];
                assert.deepStrictEqual(cube, expected);
            });
        });

        describe('cubeFaces', () => {
            it('should be an array of arrays of indices to form six faces of a cube', () => {
                const cubeFaces = compareUtil.vertexUtil.cubeFaces;
                assert.strictEqual(cubeFaces.length, 6);
                assert.strictEqual(cubeFaces[0].length, 5);
                assert.strictEqual(cubeFaces[1].length, 5);
                assert.strictEqual(cubeFaces[5].length, 5);
                assert.strictEqual(cubeFaces[0][0], cubeFaces[0][4]);
                assert.strictEqual(cubeFaces[1][0], cubeFaces[1][4]);
                assert.strictEqual(cubeFaces[5][0], cubeFaces[5][4]);
            });
        });

        describe('make3DCylinder', () => {
            it('should make an array of vertices of a cylinder', () => {
                const cylinder = compareUtil.vertexUtil.make3DCylinder(2, 3);
                assert.strictEqual(cylinder.length, 36 * 2 + 2);
                assert.deepStrictEqual(cylinder[0], [2, 0, -1.5]);
                assert.deepStrictEqual(cylinder[1], [2, 0, 1.5]);
                assert.ok(Math.abs(cylinder[36][0] - -2) < 1e-5);
                assert.ok(Math.abs(cylinder[36][1] - 0) < 1e-5);
                assert.ok(Math.abs(cylinder[36][2] - -1.5) < 1e-5);
                assert.ok(Math.abs(cylinder[37][2] - 1.5) < 1e-5);
                assert.deepStrictEqual(cylinder[72], [0, 0, -1.5]);
                assert.deepStrictEqual(cylinder[73], [0, 0, 1.5]);
            });
        });

        // TODO: add tests for makeCylinderFaces
        // TODO: add tests for cylinderDarkLines
        // TODO: add tests for makeCylinderContour
    });

    describe('rotationUtil', () => {
        describe('isFrontFace', () => {
            const isFrontFace = compareUtil.rotationUtil.isFrontFace;
            it('should determine if the front of given triangle is facing the origin', () => {
                const vertices2D = [[0, 0], [0, 1], [1, 0]];
                const frontFace = [0, 1, 2];
                const backFace = [0, 2, 1];
                assert.strictEqual(isFrontFace(vertices2D, frontFace), true);
                assert.strictEqual(isFrontFace(vertices2D, backFace), false);
            });
        });

        describe('splitIntoFrontAndBackFaces', () => {
            const splitIntoFrontAndBackFaces = compareUtil.rotationUtil.splitIntoFrontAndBackFaces;
            it('should split given faces into front facing and back facing', () => {
                const vertices2D = [
                    [0, 0], [0, 1], [1, 0],
                    [1, 1], [1, 3], [3, 3], [3, 1]
                ];
                const faces = [
                    [0, 1, 2],
                    [0, 2, 1],
                    [3, 4, 5, 6],
                    [6, 4, 1, 2]
                ];
                assert.deepStrictEqual(
                    splitIntoFrontAndBackFaces(vertices2D, faces),
                    {
                        frontFaces: [
                            [0, 1, 2],
                            [3, 4, 5, 6]
                        ],
                        backFaces: [
                            [0, 2, 1],
                            [6, 4, 1, 2]
                        ]
                    }
                );
            });
        });
    });

    describe('makeRotationCoefs', () => {
        const mae2D = function(array1, array2, msg) {
            let sad = 0;
            let count = 0;
            assert.strictEqual(array1.length, array2.length, msg);
            for (let i = 0; i < array1.length; i++) {
                const sub1 = array1[i];
                const sub2 = array2[i];
                let subSad = 0;
                assert.strictEqual(sub1.length, sub2.length, msg);
                for (let j = 0; j < sub1.length; j++) {
                    subSad += Math.abs(sub1[j] - sub2[j]);
                    count += 1;
                }
                sad += subSad;
            }
            return sad / count;
        };

        it('should return coefficients and some utility functions', () => {
            const ret1 = compareUtil.makeRotationCoefs({x: 0, y: 0});

            assert.strictEqual(ret1.pitch, 0);
            assert.strictEqual(ret1.yaw, 0);
            assert.ok(Math.abs(ret1.xr - 0.707) <= 0.0001);
            assert.ok(Math.abs(ret1.yr - 0.000) <= 0.0001);
            assert.ok(Math.abs(ret1.xg - 0.000) <= 0.0001);
            assert.ok(Math.abs(ret1.yg - 0.000) <= 0.0001);
            assert.ok(Math.abs(ret1.yb - -0.707) <= 0.0001);

            assert.ok(Math.abs(ret1.pos3DTo2D(0, 0, 0)[0] - 160) <= 0.01);
            assert.ok(Math.abs(ret1.pos3DTo2D(0, 0, 0)[1] - 160) <= 0.01);
            assert.ok(Math.abs(ret1.pos3DTo2D(127.5, 127.5, 0)[0] - 250.14) <= 0.01);
            assert.ok(Math.abs(ret1.pos3DTo2D(127.5, 127.5, 0)[1] - 160) <= 0.01);
            assert.ok(Math.abs(ret1.pos3DTo2D(0, 127.5, 127.5)[0] - 160) <= 0.01);
            assert.ok(Math.abs(ret1.pos3DTo2D(0, 127.5, 127.5)[1] - 69.86) <= 0.01);

            assert.ok(Math.abs(ret1.vec3DTo2D(0, 0, 0)[0]) <= 0.01);
            assert.ok(Math.abs(ret1.vec3DTo2D(0, 0, 0)[1]) <= 0.01);
            assert.ok(Math.abs(ret1.vec3DTo2D(127.5, 127.5, 0)[0] - 90.14) <= 0.01);
            assert.ok(Math.abs(ret1.vec3DTo2D(127.5, 127.5, 0)[1]) <= 0.01);
            assert.ok(Math.abs(ret1.vec3DTo2D(0, 127.5, 127.5)[0]) <= 0.01);
            assert.ok(Math.abs(ret1.vec3DTo2D(0, 127.5, 127.5)[1] - -90.14) <= 0.01);

            const vertices = [
                [0, 0, 0], [127.5, 127.5, 0], [0, 127.5, 127.5]
            ];
            const expected = [
                [160, 160], [250.14, 160], [160, 69.86]
            ];
            assert.ok(mae2D(ret1.vertices3DTo2D(vertices), expected) <= 0.01);
        });
    });

    describe('TaskQueue', () => {
        const TaskQueue = compareUtil.TaskQueue;
        describe('pop', () => {
            it('should return null if the queue is empty', () => {
                const tq = TaskQueue(()=>{});
                assert.strictEqual(tq.pop(), null);
            });
            it('should return enqueued task data', () => {
                const tq = TaskQueue(()=>{});
                const data = { number: 42 };
                tq.push(data);
                assert.strictEqual(tq.pop(), data);
            });
            it('should remove returned task data from the queue', () => {
                const tq = TaskQueue(()=>{});
                const data = { number: 42 };
                tq.push(data);
                tq.pop();
                assert.strictEqual(tq.pop(), null);
            });
            it('should return null if any task is running', () => {
                const tq = TaskQueue(()=>{});
                const data1 = {};
                const data2 = {};
                tq.push(data1); // enqueue
                tq.pop(); // start running
                tq.push(data2); // enqueue
                assert.strictEqual(tq.pop(), null);
            });
            it('should run prepare function when returning a task data', () => {
                const log = [];
                const tq = TaskQueue(()=>{});
                const data = { number: 42 };
                const prepare = (data) => { log.push(`data: ${data.number}`); };
                tq.push(data, prepare);
                assert.deepStrictEqual(log, []);
                const returned = tq.pop();
                assert.strictEqual(returned, data);
                assert.deepStrictEqual(log, ['data: 42']);
            });
            it('should return null if prepare function returned false', () => {
                const tq = TaskQueue(()=>{});
                const data = { number: 42 };
                const prepare = () => { return false; };
                tq.push(data, prepare);
                assert.strictEqual(tq.pop(), null);
            })
        });
        describe('push', () => {
            const countTasks = function(tq) {
                let count = 0;
                tq.cancelIf(() => { count++; return false; });
                return count;
            };
            it('should add new task to internal queue', () => {
                const tq = TaskQueue(()=>{});
                assert.strictEqual(countTasks(tq), 0);
                tq.push({});
                assert.strictEqual(countTasks(tq), 1);
                tq.push({});
                assert.strictEqual(countTasks(tq), 2);
            });
        });
        describe('cancelIf', () => {
            it('should discard enqueued tasks that satisfy a condition', () => {
                const tq = TaskQueue(()=>{});
                tq.push({ number: 7 });
                tq.push({ number: 42 });
                tq.push({ number: 100 });
                tq.cancelIf(data => data.number === 7);
                assert.deepStrictEqual(tq.pop(), { number: 42 });
                tq.processResponse({ number: 42 });
                assert.deepStrictEqual(tq.pop(), { number: 100 });
            });
        });
        // TODO: processResponse
    });

    describe('figureUtil', () => {
        const figureUtil = compareUtil.figureUtil;
        describe('copyImageBits', () => {
            it('should copy image data', () => {
                const src = {
                    width: 3,
                    height: 2,
                    data: [
                        1, 1, 1, 255, 2, 2, 2, 255, 3, 3, 3, 255,
                        4, 4, 4, 255, 5, 5, 5, 255, 6, 6, 6, 255
                    ]
                };
                const dest = {
                    width: 3,
                    height: 2,
                    data: [
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    ]
                };
                figureUtil.copyImageBits(src, dest);
                assert.deepStrictEqual(
                    dest.data,
                    [
                        1, 1, 1, 255, 2, 2, 2, 255, 3, 3, 3, 255,
                        4, 4, 4, 255, 5, 5, 5, 255, 6, 6, 6, 255
                    ]
                );
            })
        });
    });
});
