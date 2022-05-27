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
});
