'use strict';
const assert = require('assert');
const CompareUtil = require('../modules/compare-util.js');

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
});
