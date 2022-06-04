'use strict';
const assert = require('assert');
const compareImageUtil = require('../modules/compare-image-util.js');

describe('CompareImageUtil', () => {
    describe('channelsOf', () => {
        const channelsOf = compareImageUtil.channelsOf;
        it('should return the number of channels of given image format', () => {
            assert.strictEqual(channelsOf(compareImageUtil.FORMAT_U8x4), 4);
            assert.strictEqual(channelsOf(compareImageUtil.FORMAT_F32x1), 1);
            assert.strictEqual(channelsOf(), 4);
            assert.strictEqual(channelsOf(null), 4);
        });
    });

    describe('newArrayOf', () => {
        const newArrayOf = compareImageUtil.newArrayOf;
        it('should allocate a new array for an image', () => {
            const u8_0 = newArrayOf(compareImageUtil.FORMAT_U8x4, 0);
            assert.strictEqual(u8_0.length, 0)
            const u8_1 = newArrayOf(compareImageUtil.FORMAT_U8x4, 1);
            assert.strictEqual(u8_1.length, 1)
            assert.strictEqual(typeof u8_1[0], 'number')
            const u8_100 = newArrayOf(compareImageUtil.FORMAT_U8x4, 100);
            assert.strictEqual(u8_100.length, 100)
            assert.strictEqual(typeof u8_100[0], 'number')
            const f8_0 = newArrayOf(compareImageUtil.FORMAT_F32x1, 0);
            assert.strictEqual(f8_0.length, 0)
            const f8_1 = newArrayOf(compareImageUtil.FORMAT_F32x1, 1);
            assert.strictEqual(f8_1.length, 1)
            assert.strictEqual(typeof f8_1[0], 'number')
            const f8_100 = newArrayOf(compareImageUtil.FORMAT_F32x1, 100);
            assert.strictEqual(f8_100.length, 100)
            assert.strictEqual(typeof f8_100[0], 'number')
        });
    });
});
