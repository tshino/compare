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

        it('should be able to deal with F32 format', () => {
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

    describe('makeRegion', () => {
        it('should make an image struct refering a region of another image', () => {
            const image1 = compareImageUtil.makeImage(300, 200);

            const region0 = compareImageUtil.makeRegion(image1);
            assert.strictEqual(region0.width, 300);
            assert.strictEqual(region0.height, 200);
            assert.strictEqual(region0.pitch, 300);
            assert.ok(image1.data === region0.data);
            assert.strictEqual(region0.offset, 0);
            assert.strictEqual(region0.channels, 4);
            assert.strictEqual(region0.format, compareImageUtil.FORMAT_U8x4);

            const region1 = compareImageUtil.makeRegion(image1, 30, 20);
            assert.strictEqual(region1.width, 270);
            assert.strictEqual(region1.height, 180);
            assert.strictEqual(region1.pitch, 300);
            assert.ok(image1.data === region1.data);
            assert.strictEqual(region1.offset, 300 * 20 + 30);
            assert.strictEqual(region1.channels, 4);
            assert.strictEqual(region1.format, compareImageUtil.FORMAT_U8x4);

            const region2 = compareImageUtil.makeRegion(image1, 30, 20, 130, 120);
            assert.strictEqual(region2.width, 130);
            assert.strictEqual(region2.height, 120);
            assert.strictEqual(region2.pitch, 300);
            assert.ok(image1.data === region2.data);
            assert.strictEqual(region2.offset, 300 * 20 + 30);
            assert.strictEqual(region2.channels, 4);
            assert.strictEqual(region2.format, compareImageUtil.FORMAT_U8x4);

            const imageData = { width: 300, height: 200, data: new Uint8Array(240000) };
            const region3 = compareImageUtil.makeRegion(imageData, 10, 20, 30, 40);
            assert.strictEqual(region3.width, 30);
            assert.strictEqual(region3.height, 40);
            assert.strictEqual(region3.pitch, 300);
            assert.ok(imageData.data === region3.data);
            assert.strictEqual(region3.offset, 300 * 20 + 10);
            assert.strictEqual(region3.channels, 4);
            assert.strictEqual(region3.format, compareImageUtil.FORMAT_U8x4);
        });

        it('should be able to deal with images of zero size', () => {
            const image0x0 = compareImageUtil.makeImage(0, 0);

            const region0x0 = compareImageUtil.makeRegion(image0x0);
            assert.strictEqual(region0x0.width, 0);
            assert.strictEqual(region0x0.height, 0);
            assert.strictEqual(region0x0.pitch, 0);
            assert.strictEqual(region0x0.data.length, 0);
            assert.strictEqual(region0x0.offset, 0);
            assert.strictEqual(region0x0.channels, 4);
            assert.strictEqual(region0x0.format, compareImageUtil.FORMAT_U8x4);

            const region0x0_2 = compareImageUtil.makeRegion(image0x0, 10, 10, 10, 10);
            assert.strictEqual(region0x0_2.width, 0);
            assert.strictEqual(region0x0_2.height, 0);
            assert.strictEqual(region0x0_2.pitch, 0);
            assert.strictEqual(region0x0_2.data.length, 0);
            assert.strictEqual(region0x0_2.offset, 0);
            assert.strictEqual(region0x0_2.channels, 4);
            assert.strictEqual(region0x0_2.format, compareImageUtil.FORMAT_U8x4);
        });

        it('should be able to deal with F32 format', () => {
            const image1F = compareImageUtil.makeImage(300, 200, compareImageUtil.FORMAT_F32x1);

            const region0F = compareImageUtil.makeRegion(image1F);
            assert.strictEqual(region0F.width, 300);
            assert.strictEqual(region0F.height, 200);
            assert.strictEqual(region0F.pitch, 300);
            assert.ok(image1F.data === region0F.data);
            assert.strictEqual(region0F.offset, 0);
            assert.strictEqual(region0F.channels, 1);
            assert.strictEqual(region0F.format, compareImageUtil.FORMAT_F32x1);

            const region1F = compareImageUtil.makeRegion(image1F, 30, 20);
            assert.strictEqual(region1F.width, 270);
            assert.strictEqual(region1F.height, 180);
            assert.strictEqual(region1F.pitch, 300);
            assert.ok(image1F.data === region1F.data);
            assert.strictEqual(region1F.offset, 300 * 20 + 30);
            assert.strictEqual(region1F.channels, 1);
            assert.strictEqual(region1F.format, compareImageUtil.FORMAT_F32x1);

            const region2F = compareImageUtil.makeRegion(image1F, 30, 20, 130, 120);
            assert.strictEqual(region2F.width, 130);
            assert.strictEqual(region2F.height, 120);
            assert.strictEqual(region2F.pitch, 300);
            assert.ok(image1F.data === region2F.data);
            assert.strictEqual(region2F.offset, 300 * 20 + 30);
            assert.strictEqual(region2F.channels, 1);
            assert.strictEqual(region2F.format, compareImageUtil.FORMAT_F32x1);
        });

        it('should be able to make empty ranges', () => {
            const image1 = compareImageUtil.makeImage(300, 200);

            const region1 = compareImageUtil.makeRegion(image1, 0, 0, 0, 0);
            assert.strictEqual(region1.width * region1.height, 0);
            assert.strictEqual(region1.pitch, 300);
            assert.ok(image1.data === region1.data);

            const region2 = compareImageUtil.makeRegion(image1, 50, 50, 0, 0);
            assert.strictEqual(region2.width * region2.height, 0);
            assert.strictEqual(region2.pitch, 300);
            assert.ok(image1.data === region2.data);

            const region3 = compareImageUtil.makeRegion(image1, 350, 250);
            assert.strictEqual(region3.width * region3.height, 0);
            assert.strictEqual(region3.pitch, 300);
            assert.ok(image1.data === region3.data);

            const region4 = compareImageUtil.makeRegion(image1, 350, 50);
            assert.strictEqual(region4.width * region4.height, 0);
            assert.strictEqual(region4.pitch, 300);
            assert.ok(image1.data === region4.data);

            const region5 = compareImageUtil.makeRegion(image1, 50, 250);
            assert.strictEqual(region5.width * region5.height, 0);
            assert.strictEqual(region5.pitch, 300);
            assert.ok(image1.data === region5.data);

            const region6 = compareImageUtil.makeRegion(image1, -50, 250);
            assert.strictEqual(region6.width * region6.height, 0);
            assert.strictEqual(region6.pitch, 300);
            assert.ok(image1.data === region6.data);

            const region7 = compareImageUtil.makeRegion(image1, 350, -50);
            assert.strictEqual(region7.width * region7.height, 0);
            assert.strictEqual(region7.pitch, 300);
            assert.ok(image1.data === region7.data);

            const region8 = compareImageUtil.makeRegion(image1, 350, 250, 100, 100);
            assert.strictEqual(region8.width * region8.height, 0);
            assert.strictEqual(region8.pitch, 300);
            assert.ok(image1.data === region8.data);

            const region9 = compareImageUtil.makeRegion(image1, -50, -50, 0, 0);
            assert.strictEqual(region9.width * region9.height, 0);
            assert.strictEqual(region9.pitch, 300);
            assert.ok(image1.data === region9.data);

            const region10 = compareImageUtil.makeRegion(image1, -50, -50, 10, 10);
            assert.strictEqual(region10.width * region10.height, 0);
            assert.strictEqual(region10.pitch, 300);
            assert.ok(image1.data === region10.data);

            const region11 = compareImageUtil.makeRegion(image1, -50, -50, 50, 50);
            assert.strictEqual(region11.width * region11.height, 0);
            assert.strictEqual(region11.pitch, 300);
            assert.ok(image1.data === region11.data);

            const region12 = compareImageUtil.makeRegion(image1, 0, 0, -50, -50);
            assert.strictEqual(region12.width * region12.height, 0);
            assert.strictEqual(region12.pitch, 300);
            assert.ok(image1.data === region12.data);

            const region13 = compareImageUtil.makeRegion(image1, 50, 50, -50, -50);
            assert.strictEqual(region13.width * region13.height, 0);
            assert.strictEqual(region13.pitch, 300);
            assert.ok(image1.data === region13.data);
        });

        it('should be able to deal with too-big-range', () => {
            const image1 = compareImageUtil.makeImage(300, 200);

            const region1 = compareImageUtil.makeRegion(image1, 0, 0, 400, 300);
            assert.strictEqual(region1.width, 300);
            assert.strictEqual(region1.height, 200);
            assert.strictEqual(region1.pitch, 300);
            assert.strictEqual(region1.offset, 0);
            assert.ok(image1.data === region1.data);

            const region2 = compareImageUtil.makeRegion(image1, -50, -50);
            assert.strictEqual(region2.width, 300);
            assert.strictEqual(region2.height, 200);
            assert.strictEqual(region2.pitch, 300);
            assert.strictEqual(region2.offset, 0);
            assert.ok(image1.data === region2.data);

            const region3 = compareImageUtil.makeRegion(image1, -50, -50, 400, 300);
            assert.strictEqual(region3.width, 300);
            assert.strictEqual(region3.height, 200);
            assert.strictEqual(region3.pitch, 300);
            assert.strictEqual(region3.offset, 0);
            assert.ok(image1.data === region3.data);

            const region4 = compareImageUtil.makeRegion(image1, -50, -50, 300, 200);
            assert.strictEqual(region4.width, 250);
            assert.strictEqual(region4.height, 150);
            assert.strictEqual(region4.pitch, 300);
            assert.strictEqual(region4.offset, 0);
            assert.ok(image1.data === region4.data);

            const region5 = compareImageUtil.makeRegion(image1, -50, -50, 100, 100);
            assert.strictEqual(region5.width, 50);
            assert.strictEqual(region5.height, 50);
            assert.strictEqual(region5.pitch, 300);
            assert.strictEqual(region5.offset, 0);
            assert.ok(image1.data === region5.data);

            const region6 = compareImageUtil.makeRegion(image1, 50, 50, 300, 200);
            assert.strictEqual(region6.width, 250);
            assert.strictEqual(region6.height, 150);
            assert.strictEqual(region6.pitch, 300);
            assert.strictEqual(region6.offset, 300 * 50 + 50);
            assert.ok(image1.data === region6.data);
        });
    });
});
