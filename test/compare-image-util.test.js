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
            assert.strictEqual(u8_0.length, 0);
            const u8_1 = newArrayOf(compareImageUtil.FORMAT_U8x4, 1);
            assert.strictEqual(u8_1.length, 1);
            assert.strictEqual(typeof u8_1[0], 'number');
            const u8_100 = newArrayOf(compareImageUtil.FORMAT_U8x4, 100);
            assert.strictEqual(u8_100.length, 100);
            assert.strictEqual(typeof u8_100[0], 'number');
            const f8_0 = newArrayOf(compareImageUtil.FORMAT_F32x1, 0);
            assert.strictEqual(f8_0.length, 0);
            const f8_1 = newArrayOf(compareImageUtil.FORMAT_F32x1, 1);
            assert.strictEqual(f8_1.length, 1);
            assert.strictEqual(typeof f8_1[0], 'number');
            const f8_100 = newArrayOf(compareImageUtil.FORMAT_F32x1, 100);
            assert.strictEqual(f8_100.length, 100);
            assert.strictEqual(typeof f8_100[0], 'number');
        });
    });

    describe('makeImage', () => {
        it('should make an image struct with specified dimension', () => {
            const image0x0 = compareImageUtil.makeImage(0, 0);
            assert.strictEqual(image0x0.width, 0);
            assert.strictEqual(image0x0.height, 0);
            assert.strictEqual(image0x0.pitch, 0);
            assert.strictEqual(image0x0.data.length, 0);
            assert.strictEqual(image0x0.offset, 0);
            assert.strictEqual(image0x0.channels, 4);
            assert.strictEqual(image0x0.format, compareImageUtil.FORMAT_U8x4);

            const image1x1 = compareImageUtil.makeImage(1, 1);
            assert.strictEqual(image1x1.width, 1);
            assert.strictEqual(image1x1.height, 1);
            assert.strictEqual(image1x1.pitch, 1);
            assert.strictEqual(image1x1.data.length, 4);
            assert.strictEqual(image1x1.offset, 0);
            assert.strictEqual(image1x1.channels, 4);
            assert.strictEqual(image1x1.format, compareImageUtil.FORMAT_U8x4);

            const image1 = compareImageUtil.makeImage(300, 200);
            assert.strictEqual(image1.width, 300);
            assert.strictEqual(image1.height, 200);
            assert.strictEqual(image1.pitch, 300);
            assert.strictEqual(image1.data.length, 240000);
            assert.strictEqual(image1.offset, 0);
            assert.strictEqual(image1.channels, 4);
            assert.strictEqual(image1.format, compareImageUtil.FORMAT_U8x4);
        });

        it('should make a shallow copy of given image', () => {
            const image1 = compareImageUtil.makeImage(300, 200);
            const image2 = compareImageUtil.makeImage(image1);
            assert.ok(image1 !== image2);
            assert.strictEqual(image2.width, 300);
            assert.strictEqual(image2.height, 200);
            assert.strictEqual(image2.pitch, 300);
            assert.ok(image1.data === image2.data);
            assert.strictEqual(image2.offset, 0);
            assert.strictEqual(image2.channels, 4);
            assert.strictEqual(image2.format, compareImageUtil.FORMAT_U8x4);
        });

        it('should make a full image struct from partial info', () => {
            const imageData = {
                width: 300,
                height: 200,
                data: new Uint8Array(240000)
            };
            const image3 = compareImageUtil.makeImage(imageData);
            assert.ok(imageData !== image3);
            assert.strictEqual(image3.width, 300);
            assert.strictEqual(image3.height, 200);
            assert.strictEqual(image3.pitch, 300);
            assert.ok(imageData.data === image3.data);
            assert.strictEqual(image3.offset, 0);
            assert.strictEqual(image3.channels, 4);
            assert.strictEqual(image3.format, compareImageUtil.FORMAT_U8x4);

            const imageData2 = {
                width: 200,
                height: 100,
                data: imageData.data,
                pitch: 300,
                offset: 15050
            };
            const image4 = compareImageUtil.makeImage(imageData2);
            assert.ok(imageData2 !== image4);
            assert.strictEqual(image4.width, 200);
            assert.strictEqual(image4.height, 100);
            assert.strictEqual(image4.pitch, 300);
            assert.ok(imageData.data === image4.data);
            assert.strictEqual(image4.offset, 15050);
            assert.strictEqual(image4.channels, 4);
            assert.strictEqual(image4.format, compareImageUtil.FORMAT_U8x4);
        });
    });

    describe('makeImage F32', () => {
        it('should make an image struct of F32 format', () => {
            const image0x0 = compareImageUtil.makeImage(0, 0, compareImageUtil.FORMAT_F32x1);
            assert.strictEqual(image0x0.width, 0);
            assert.strictEqual(image0x0.height, 0);
            assert.strictEqual(image0x0.pitch, 0);
            assert.strictEqual(image0x0.data.length, 0);
            assert.strictEqual(image0x0.offset, 0);
            assert.strictEqual(image0x0.channels, 1);
            assert.strictEqual(image0x0.format, compareImageUtil.FORMAT_F32x1);

            const image1x1 = compareImageUtil.makeImage(1, 1, compareImageUtil.FORMAT_F32x1);
            assert.strictEqual(image1x1.width, 1);
            assert.strictEqual(image1x1.height, 1);
            assert.strictEqual(image1x1.pitch, 1);
            assert.strictEqual(image1x1.data.length, 1);
            assert.strictEqual(image1x1.offset, 0);
            assert.strictEqual(image1x1.channels, 1);
            assert.strictEqual(image1x1.format, compareImageUtil.FORMAT_F32x1);

            const image1 = compareImageUtil.makeImage(300, 200, compareImageUtil.FORMAT_F32x1);
            assert.strictEqual(image1.width, 300);
            assert.strictEqual(image1.height, 200);
            assert.strictEqual(image1.pitch, 300);
            assert.strictEqual(image1.data.length, 60000);
            assert.strictEqual(image1.offset, 0);
            assert.strictEqual(image1.channels, 1);
            assert.strictEqual(image1.format, compareImageUtil.FORMAT_F32x1);

            const image2 = compareImageUtil.makeImage(image1);
            assert.strictEqual(image2.width, 300);
            assert.strictEqual(image2.height, 200);
            assert.strictEqual(image2.pitch, 300);
            assert.ok(image1.data === image2.data);
            assert.strictEqual(image2.offset, 0);
            assert.strictEqual(image2.channels, 1);
            assert.strictEqual(image2.format, compareImageUtil.FORMAT_F32x1);

            const imageData = {
                width: 300,
                height: 200,
                data: new Float32Array(60000),
                channels: 1
            };
            const image3 = compareImageUtil.makeImage(imageData);
            assert.strictEqual(image3.width, 300);
            assert.strictEqual(image3.height, 200);
            assert.strictEqual(image3.pitch, 300);
            assert.ok(imageData.data === image3.data);
            assert.strictEqual(image3.offset, 0);
            assert.strictEqual(image3.channels, 1);
            assert.strictEqual(image3.format, compareImageUtil.FORMAT_F32x1);

            const imageData2 = {
                width: 200,
                height: 100,
                data: imageData.data,
                pitch: 300,
                offset: 15050,
                channels: 1
            };
            const image4 = compareImageUtil.makeImage(imageData2);
            assert.strictEqual(image4.width, 200);
            assert.strictEqual(image4.height, 100);
            assert.strictEqual(image4.pitch, 300);
            assert.ok(imageData.data === image4.data);
            assert.strictEqual(image4.offset, 15050);
            assert.strictEqual(image4.channels, 1);
            assert.strictEqual(image4.format, compareImageUtil.FORMAT_F32x1);
        });
    });
});
