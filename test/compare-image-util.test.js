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

    describe('fill', () => {
        const at4 = function(image, x, y) {
            const address = 4 * x + 4 * image.width * y;
            return [
                image.data[address + 0],
                image.data[address + 1],
                image.data[address + 2],
                image.data[address + 3]
            ];
        };
        const at1 = function(image, x, y) {
            return [
                image.data[x + image.width * y]
            ];
        };
        const at = function(image, x, y) {
            if (image.format === compareImageUtil.FORMAT_U8x4) {
                return at4(image, x, y);
            } else {
                return at1(image, x, y);
            }
        };
        it('should fill an image with the specified pixel value', () => {
            const image1 = compareImageUtil.makeImage(300, 200);
            for (let i = 0; i < 240000; ++i) {
                image1.data[i] = 55;
            }

            compareImageUtil.fill(image1, 20, 40, 60, 80);

            assert.deepStrictEqual(at(image1, 0, 0), [20, 40, 60, 80]);
            assert.deepStrictEqual(at(image1, 1, 0), [20, 40, 60, 80]);
            assert.deepStrictEqual(at(image1, 299, 0), [20, 40, 60, 80]);
            assert.deepStrictEqual(at(image1, 299, 199), [20, 40, 60, 80]);

            const region1 = compareImageUtil.makeRegion(image1, 20, 10, 100, 50);
            for (let i = 0; i < 240000; ++i) {
                image1.data[i] = 55;
            }

            compareImageUtil.fill(region1, 20, 40, 60, 80);

            assert.deepStrictEqual(at(image1, 0, 0), [55, 55, 55, 55]);
            assert.deepStrictEqual(at(image1, 299, 199), [55, 55, 55, 55]);

            assert.deepStrictEqual(at(image1, 20, 9), [55, 55, 55, 55]);
            assert.deepStrictEqual(at(image1, 19, 10), [55, 55, 55, 55]);
            assert.deepStrictEqual(at(image1, 20, 10), [20, 40, 60, 80]);
            assert.deepStrictEqual(at(image1, 119, 10), [20, 40, 60, 80]);
            assert.deepStrictEqual(at(image1, 120, 10), [55, 55, 55, 55]);

            assert.deepStrictEqual(at(image1, 19, 59), [55, 55, 55, 55]);
            assert.deepStrictEqual(at(image1, 119, 59), [20, 40, 60, 80]);
            assert.deepStrictEqual(at(image1, 120, 59), [55, 55, 55, 55]);
            assert.deepStrictEqual(at(image1, 119, 60), [55, 55, 55, 55]);

            for (let i = 0; i < 240000; ++i) {
                image1.data[i] = 55;
            }
            const region2 = compareImageUtil.makeRegion(image1, 0, 0, 0, 0);
            compareImageUtil.fill(region2, 10, 10, 10, 10);
            const region3 = compareImageUtil.makeRegion(image1, 1, 0, 0, 0);
            compareImageUtil.fill(region3, 20, 20, 20, 20);
            const region4 = compareImageUtil.makeRegion(image1, -1, 0, 1, 1);
            compareImageUtil.fill(region4, 30, 30, 30, 30);
            const region5 = compareImageUtil.makeRegion(image1, 0, -1, 1, 1);
            compareImageUtil.fill(region5, 40, 40, 40, 40);
            const region6 = compareImageUtil.makeRegion(image1, 0, 0, 1, 0);
            compareImageUtil.fill(region6, 50, 50, 50, 50);
            const region7 = compareImageUtil.makeRegion(image1, 0, 0, 0, 1);
            compareImageUtil.fill(region7, 60, 60, 60, 60);

            assert.deepStrictEqual(at(image1, 0, 0), [55, 55, 55, 55]);
            assert.deepStrictEqual(at(image1, 1, 0), [55, 55, 55, 55]);
        });

        it('should deal with F32 format', () => {
            const image1 = compareImageUtil.makeImage(300, 200, compareImageUtil.FORMAT_F32x1);
            for (let i = 0; i < 60000; ++i) {
                image1.data[i] = 55;
            }

            compareImageUtil.fill(image1, 20);
            assert.deepStrictEqual(at(image1, 0, 0), [20]);
            assert.deepStrictEqual(at(image1, 1, 0), [20]);
            assert.deepStrictEqual(at(image1, 2, 0), [20]);
            assert.deepStrictEqual(at(image1, 3, 0), [20]);
            assert.deepStrictEqual(at(image1, 4, 0), [20]);
            assert.deepStrictEqual(at(image1, 299, 199), [20]);

            const region1 = compareImageUtil.makeRegion(image1, 5, 5, 10, 5);
            compareImageUtil.fill(region1, 70);

            assert.deepStrictEqual(at(image1, 0, 0), [20]);
            assert.deepStrictEqual(at(image1, 4, 5), [20]);
            assert.deepStrictEqual(at(image1, 5, 5), [70]);
            assert.deepStrictEqual(at(image1, 14, 5), [70]);
            assert.deepStrictEqual(at(image1, 15, 5), [20]);
            assert.deepStrictEqual(at(image1, 14, 9), [70]);
            assert.deepStrictEqual(at(image1, 15, 9), [20]);
            assert.deepStrictEqual(at(image1, 5, 10), [20]);
        });
    });

    describe('copy', () => {
        it('should copy pixels from an image to another image', () => {
            const imageData = { width: 4, height: 4, data: [] };
            for (let i = 0; i < 64; ++i) {
                imageData.data[i] = i;
            }
            const image1 = compareImageUtil.makeImage(imageData);
            const image2 = compareImageUtil.makeImage(2, 2);
            compareImageUtil.copy(image2, image1);

            assert.strictEqual(image2.width, 2);
            assert.strictEqual(image2.height, 2);
            assert.deepStrictEqual(
                Array.from(image2.data),
                [
                    0, 1, 2, 3, 4, 5, 6, 7,
                    16, 17, 18, 19, 20, 21, 22, 23
                ]
            );
        });

        it('should deal with F32 format', () => {
            const image1 = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
            for (let i = 0; i < 16; ++i) {
                image1.data[i] = i;
            }
            const image2 = compareImageUtil.makeImage(2, 2, compareImageUtil.FORMAT_F32x1);
            compareImageUtil.copy(image2, image1);

            assert.strictEqual(image2.width, 2);
            assert.strictEqual(image2.height, 2);
            assert.deepStrictEqual(
                Array.from(image2.data),
                [
                    0, 1,
                    4, 5
                ],
            );
        });
    });

    describe('rotateCW', () => {
        it('should rotate an image', () => {
            const imageData = { width: 3, height: 5, data: [] };
            for (let i = 0; i < 60; ++i) {
                imageData.data[i] = i;
            }
            const image1 = compareImageUtil.makeImage(imageData);
            const image2 = compareImageUtil.makeImage(5, 3);
            compareImageUtil.rotateCW(image2, image1);

            assert.strictEqual(image2.width, 5);
            assert.strictEqual(image2.height, 3);
            assert.deepStrictEqual(
                Array.from(image2.data),
                [
                    48, 49, 50, 51, 36, 37, 38, 39, 24, 25, 26, 27, 12, 13, 14, 15, 0, 1, 2, 3,
                    52, 53, 54, 55, 40, 41, 42, 43, 28, 29, 30, 31, 16, 17, 18, 19, 4, 5, 6, 7,
                    56, 57, 58, 59, 44, 45, 46, 47, 32, 33, 34, 35, 20, 21, 22, 23, 8, 9, 10, 11
                ]
            );
        });
    });

    describe('rotateCCW', () => {
        it('should rotate an image', () => {
            const imageData = { width: 3, height: 5, data: [] };
            for (let i = 0; i < 60; ++i) {
                imageData.data[i] = i;
            }
            const image1 = compareImageUtil.makeImage(imageData);
            const image2 = compareImageUtil.makeImage(5, 3);
            compareImageUtil.rotateCCW(image2, image1);

            assert.strictEqual(image2.width, 5);
            assert.strictEqual(image2.height, 3);
            assert.deepStrictEqual(
                Array.from(image2.data),
                [
                    8, 9, 10, 11, 20, 21, 22, 23, 32, 33, 34, 35, 44, 45, 46, 47, 56, 57, 58, 59,
                    4, 5, 6, 7, 16, 17, 18, 19, 28, 29, 30, 31, 40, 41, 42, 43, 52, 53, 54, 55,
                    0, 1, 2, 3, 12, 13, 14, 15, 24, 25, 26, 27, 36, 37, 38, 39, 48, 49, 50, 51
                ]
            );
        });
    });

    describe('flipH', () => {
        it('should flip an image horizontally', () => {
            const imageData = { width: 3, height: 5, data: [] };
            for (let i = 0; i < 60; ++i) {
                imageData.data[i] = i;
            }
            const image1 = compareImageUtil.makeImage(imageData);
            const image2 = compareImageUtil.makeImage(3, 5);
            compareImageUtil.flipH(image2, image1);

            assert.strictEqual(image2.width, 3);
            assert.strictEqual(image2.height, 5);
            assert.deepStrictEqual(
                Array.from(image2.data),
                [
                    8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3,
                    20, 21, 22, 23, 16, 17, 18, 19, 12, 13, 14, 15,
                    32, 33, 34, 35, 28, 29, 30, 31, 24, 25, 26, 27,
                    44, 45, 46, 47, 40, 41, 42, 43, 36, 37, 38, 39,
                    56, 57, 58, 59, 52, 53, 54, 55, 48, 49, 50, 51
                ]
            );
        });
    });

    describe('flipV', () => {
        it('should flip an image vertically', () => {
            const imageData = { width: 3, height: 5, data: [] };
            for (let i = 0; i < 60; ++i) {
                imageData.data[i] = i;
            }
            const image1 = compareImageUtil.makeImage(imageData);
            const image2 = compareImageUtil.makeImage(3, 5);
            compareImageUtil.flipV(image2, image1);

            assert.strictEqual(image2.width, 3);
            assert.strictEqual(image2.height, 5);
            assert.deepStrictEqual(
                Array.from(image2.data),
                [
                    48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
                    36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
                    24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
                    12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
                    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
                ]
            );
        });
    });

    describe('applyOrientation', () => {
        it('should apply orientation to an image', () => {
            const src = compareImageUtil.makeImage({
                width: 2, height: 3, data: [
                    0, 1, 2, 3, 4, 5, 6, 7,
                    8, 9, 10, 11, 12, 13, 14, 15,
                    16, 17, 18, 19, 20, 21, 22, 23
                ]
            });
            const result1 = compareImageUtil.applyOrientation(src, 1);
            assert.strictEqual(result1.width, 2);
            assert.strictEqual(result1.height, 3);
            assert.deepStrictEqual(
                Array.from(result1.data),
                [
                    0, 1, 2, 3, 4, 5, 6, 7,
                    8, 9, 10, 11, 12, 13, 14, 15,
                    16, 17, 18, 19, 20, 21, 22, 23
                ]
            );
            const result2 = compareImageUtil.applyOrientation(src, 2);
            assert.strictEqual(result2.width, 2);
            assert.strictEqual(result2.height, 3);
            assert.deepStrictEqual(
                Array.from(result2.data),
                [
                    4, 5, 6, 7, 0, 1, 2, 3,
                    12, 13, 14, 15, 8, 9, 10, 11,
                    20, 21, 22, 23, 16, 17, 18, 19
                ]
            );
            const result3 = compareImageUtil.applyOrientation(src, 3);
            assert.strictEqual(result3.width, 2);
            assert.strictEqual(result3.height, 3);
            assert.deepStrictEqual(
                Array.from(result3.data),
                [
                    20, 21, 22, 23, 16, 17, 18, 19,
                    12, 13, 14, 15, 8, 9, 10, 11,
                    4, 5, 6, 7, 0, 1, 2, 3
                ]
            );
            const result4 = compareImageUtil.applyOrientation(src, 4);
            assert.strictEqual(result4.width, 2);
            assert.strictEqual(result4.height, 3);
            assert.deepStrictEqual(
                Array.from(result4.data),
                [
                    16, 17, 18, 19, 20, 21, 22, 23,
                    8, 9, 10, 11, 12, 13, 14, 15,
                    0, 1, 2, 3, 4, 5, 6, 7
                ]
            );
            const result5 = compareImageUtil.applyOrientation(src, 5);
            assert.strictEqual(result5.width, 3);
            assert.strictEqual(result5.height, 2);
            assert.deepStrictEqual(
                Array.from(result5.data),
                [
                    0, 1, 2, 3, 8, 9, 10, 11, 16, 17, 18, 19,
                    4, 5, 6, 7, 12, 13, 14, 15, 20, 21, 22, 23
                ]
            );
            const result6 = compareImageUtil.applyOrientation(src, 6);
            assert.strictEqual(result6.width, 3);
            assert.strictEqual(result6.height, 2);
            assert.deepStrictEqual(
                Array.from(result6.data),
                [
                    16, 17, 18, 19, 8, 9, 10, 11, 0, 1, 2, 3,
                    20, 21, 22, 23, 12, 13, 14, 15, 4, 5, 6, 7
                ]
            );
            const result7 = compareImageUtil.applyOrientation(src, 7);
            assert.strictEqual(result7.width, 3);
            assert.strictEqual(result7.height, 2);
            assert.deepStrictEqual(
                Array.from(result7.data),
                [
                    20, 21, 22, 23, 12, 13, 14, 15, 4, 5, 6, 7,
                    16, 17, 18, 19, 8, 9, 10, 11, 0, 1, 2, 3
                ]
            );
            const result8 = compareImageUtil.applyOrientation(src, 8);
            assert.strictEqual(result8.width, 3);
            assert.strictEqual(result8.height, 2);
            assert.deepStrictEqual(
                Array.from(result8.data),
                [
                    4, 5, 6, 7, 12, 13, 14, 15, 20, 21, 22, 23,
                    0, 1, 2, 3, 8, 9, 10, 11, 16, 17, 18, 19
                ]
            );
        });

        it('should deal with F32 format', () => {
            const src = compareImageUtil.makeImage(2, 3, compareImageUtil.FORMAT_F32x1);
            for (let i = 0; i < 6; ++i) {
                src.data[i] = i;
            }
            const result1 = compareImageUtil.applyOrientation(src, 1);
            assert.strictEqual(result1.width, 2);
            assert.strictEqual(result1.height, 3);
            assert.strictEqual(result1.channels, 1);
            assert.deepStrictEqual(
                Array.from(result1.data),
                [0, 1, 2, 3, 4, 5]
            );
            const result2 = compareImageUtil.applyOrientation(src, 2);
            assert.strictEqual(result2.width, 2);
            assert.strictEqual(result2.height, 3);
            assert.strictEqual(result2.channels, 1);
            assert.deepStrictEqual(
                Array.from(result2.data),
                [1, 0, 3, 2, 5, 4]
            );
            const result3 = compareImageUtil.applyOrientation(src, 3);
            assert.strictEqual(result3.width, 2);
            assert.strictEqual(result3.height, 3);
            assert.strictEqual(result3.channels, 1);
            assert.deepStrictEqual(
                Array.from(result3.data),
                [5, 4, 3, 2, 1, 0]
            );
        });
    });

    describe('readSubPixel', () => {
        it('should read pixel values in a ROI with subpixel coordinate', () => {
            const checkFloatResult = function (name, result, expected) {
                assert.strictEqual(result.width, 4, 'width of ' + name);
                assert.strictEqual(result.height, 4, 'height of ' + name);
                assert.strictEqual(result.channels, 1, 'channels of ' + name);
                assert.strictEqual(result.format, compareImageUtil.FORMAT_F32x1, 'format of ' + name);
                assert.strictEqual(result.data.length, 16, 'data.length of ' + name);
                for (let i = 0; i < 16; ++i) {
                    const label = (i + 1) + 'th pixel value of ' + name;
                    assert.ok(1e-5 > Math.abs(expected[i] - result.data[i]), label);
                }
            };
            const image1 = compareImageUtil.makeImage(4, 4);
            const imageF = compareImageUtil.makeImage({
                width: 4, height: 4, data: [
                    55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55
                ], channels: 1
            });
            compareImageUtil.fill(image1, 55, 55, 55, 255);
            const expected1 = [
                55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55
            ];

            const result1 = compareImageUtil.readSubPixel(image1, 0, 0, 4, 4);
            checkFloatResult('result1', result1, expected1);
            const result2 = compareImageUtil.readSubPixel(image1, 0.3, 0.3, 4, 4);
            checkFloatResult('result2', result2, expected1);
            const result3 = compareImageUtil.readSubPixel(image1, -1.7, -1.5, 4, 4);
            checkFloatResult('result3', result3, expected1);

            const result1F = compareImageUtil.readSubPixel(imageF, 0, 0, 4, 4);
            checkFloatResult('result1F', result1F, expected1);
            const result2F = compareImageUtil.readSubPixel(imageF, 0.3, 0.3, 4, 4);
            checkFloatResult('result2F', result2F, expected1);
            const result3F = compareImageUtil.readSubPixel(imageF, -1.7, -1.5, 4, 4);
            checkFloatResult('result3F', result3F, expected1);

            image1.data[0] = 11;
            image1.data[4] = 11;
            image1.data[16] = 11;
            const result4 = compareImageUtil.readSubPixel(image1, 0, 0, 4, 4);
            checkFloatResult('result4', result4, [
                11, 11, 55, 55, 11, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55
            ]);
            const result5 = compareImageUtil.readSubPixel(image1, 0.5, 0.5, 4, 4);
            checkFloatResult('result5', result5, [
                22, 44, 55, 55, 44, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55
            ]);
            const result6 = compareImageUtil.readSubPixel(image1, -0.5, -0.5, 4, 4);
            checkFloatResult('result6', result6, [
                11, 11, 33, 55, 11, 22, 44, 55, 33, 44, 55, 55, 55, 55, 55, 55
            ]);
            const result7 = compareImageUtil.readSubPixel(image1, 0.1, 0, 4, 4);
            checkFloatResult('result7', result7, [
                11, 15.4, 55, 55, 15.4, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55
            ]);
            const result8 = compareImageUtil.readSubPixel(image1, 0, 0.2, 4, 4);
            checkFloatResult('result8', result8, [
                11, 19.8, 55, 55, 19.8, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55
            ]);

            imageF.data[0] = 11;
            imageF.data[1] = 11;
            imageF.data[4] = 11;
            const result4F = compareImageUtil.readSubPixel(imageF, 0, 0, 4, 4);
            checkFloatResult('result4F', result4F, [
                11, 11, 55, 55, 11, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55
            ]);
            const result5F = compareImageUtil.readSubPixel(imageF, 0.5, 0.5, 4, 4);
            checkFloatResult('result5F', result5F, [
                22, 44, 55, 55, 44, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55
            ]);
            const result6F = compareImageUtil.readSubPixel(imageF, -0.5, -0.5, 4, 4);
            checkFloatResult('result6F', result6F, [
                11, 11, 33, 55, 11, 22, 44, 55, 33, 44, 55, 55, 55, 55, 55, 55
            ]);
            const result7F = compareImageUtil.readSubPixel(imageF, 0.1, 0, 4, 4);
            checkFloatResult('result7F', result7F, [
                11, 15.4, 55, 55, 15.4, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55
            ]);
            const result8F = compareImageUtil.readSubPixel(imageF, 0, 0.2, 4, 4);
            checkFloatResult('result8F', result8F, [
                11, 19.8, 55, 55, 19.8, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55
            ]);
        });
    });

    describe('convertToGrayscale', () => {
        it('should convert an image to grayscale', () => {
            const checkGrayscaleResult = function (name, result, expected) {
                for (let i = 0; i < 16; ++i) {
                    const label = (i + 1) + 'th pixel of ' + name;
                    assert.strictEqual(result.data[i * 4 + 0], expected[i * 2], label);
                    assert.strictEqual(result.data[i * 4 + 1], expected[i * 2], label);
                    assert.strictEqual(result.data[i * 4 + 2], expected[i * 2], label);
                    assert.strictEqual(result.data[i * 4 + 3], expected[i * 2 + 1], label + ' (alpha)');
                }
            };
            const checkGrayscaleResultF32 = function (name, result, expected) {
                for (let i = 0; i < 16; ++i) {
                    const label = (i + 1) + 'th pixel of ' + name;
                    assert.ok(1e-4 > Math.abs(expected[i] - result.data[i]), label);
                }
            };
            const imageData = {
                width: 4, height: 4, data: [
                    0, 0, 0, 255, 85, 85, 85, 255, 170, 170, 170, 255, 255, 255, 255, 255,
                    255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 128, 128, 128, 255,
                    0, 255, 255, 255, 255, 0, 255, 255, 255, 255, 0, 255, 255, 255, 255, 255,
                    80, 80, 80, 0, 80, 80, 80, 85, 80, 80, 80, 170, 80, 80, 80, 255
                ]
            };
            const image1 = compareImageUtil.makeImage(imageData);
            // RGBA ==> RGBA
            const result1 = compareImageUtil.makeImage(4, 4);
            compareImageUtil.fill(result1, 0, 0, 0, 0);
            compareImageUtil.convertToGrayscale(result1, image1);
            checkGrayscaleResult('result1', result1, [
                0, 255, 85, 255, 170, 255, 255, 255,
                76, 255, 150, 255, 29, 255, 128, 255,
                179, 255, 105, 255, 226, 255, 255, 255,
                80, 0, 80, 85, 80, 170, 80, 255
            ]);
            // RGBA ==> Y (F32)
            const result2 = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
            //compareImageUtil.fill(result1, 0, 0, 0, 0);
            compareImageUtil.convertToGrayscale(result2, image1);
            checkGrayscaleResultF32('result2', result2, [
                0, 85, 170, 255,
                76.2450, 149.6850, 29.0700, 128,
                178.7550, 105.3150, 225.9300, 255,
                0, 26.6667, 53.3333, 80
            ]);
            // Y (F32) ==> RGBA
            const result3 = compareImageUtil.makeImage(4, 4);
            compareImageUtil.fill(result3, 0, 0, 0, 0);
            compareImageUtil.convertToGrayscale(result3, result2);
            checkGrayscaleResult('result3', result3, [
                0, 255, 85, 255, 170, 255, 255, 255,
                76, 255, 150, 255, 29, 255, 128, 255,
                179, 255, 105, 255, 226, 255, 255, 255,
                0, 255, 27, 255, 53, 255, 80, 255
            ]);
            // Y (F32) ==> Y (F32)
            const result4 = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);
            //compareImageUtil.fill(result1, 0, 0, 0, 0);
            compareImageUtil.convertToGrayscale(result4, result2);
            checkGrayscaleResultF32('result4', result4, [
                0, 85, 170, 255,
                76.2450, 149.6850, 29.0700, 128,
                178.7550, 105.3150, 225.9300, 255,
                0, 26.6667, 53.3333, 80
            ]);
        });
    });

    describe('resizeNN', () => {
        it('should resize an image with nearest neighbor filtering', () => {
            const image1 = compareImageUtil.makeImage(2, 2);
            const image2 = compareImageUtil.makeImage(4, 4);
            compareImageUtil.fill(image1, 10, 20, 30, 40);
            compareImageUtil.fill(image2, 0, 0, 0, 0);
            compareImageUtil.resizeNN(image2, image1);

            assert.deepStrictEqual(
                Array.from(image2.data),
                [
                    10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40,
                    10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40,
                    10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40,
                    10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40
                ]
            );

            image1.data[0] = 255;
            image1.data[1] = 255;
            image1.data[2] = 255;
            image1.data[3] = 255;
            compareImageUtil.fill(image2, 0, 0, 0, 0);
            compareImageUtil.resizeNN(image2, image1);

            assert.deepStrictEqual(
                Array.from(image2.data),
                [
                    255, 255, 255, 255, 255, 255, 255, 255, 10, 20, 30, 40, 10, 20, 30, 40,
                    255, 255, 255, 255, 255, 255, 255, 255, 10, 20, 30, 40, 10, 20, 30, 40,
                    10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40,
                    10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40
                ]
            );
        });

        it('should deal with F32 format', () => {
            const image1 = compareImageUtil.makeImage(2, 2, compareImageUtil.FORMAT_F32x1);
            const image2 = compareImageUtil.makeImage(4, 4, compareImageUtil.FORMAT_F32x1);

            compareImageUtil.fill(image1, 10);
            compareImageUtil.fill(image2, 0);
            compareImageUtil.resizeNN(image2, image1);
            assert.deepStrictEqual(
                Array.from(image2.data),
                [
                    10, 10, 10, 10,
                    10, 10, 10, 10,
                    10, 10, 10, 10,
                    10, 10, 10, 10
                ]
            );

            image1.data[0] = 255;
            compareImageUtil.fill(image2, 0);
            compareImageUtil.resizeNN(image2, image1);
            assert.deepStrictEqual(
                Array.from(image2.data),
                [
                    255, 255, 10, 10,
                    255, 255, 10, 10,
                    10, 10, 10, 10,
                    10, 10, 10, 10
                ]
            );
        });
    });
});
