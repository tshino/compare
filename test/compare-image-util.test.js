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
});
