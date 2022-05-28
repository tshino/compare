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
});
