'use strict';
const assert = require('assert');
const compareWorker = require('../modules/compare-worker.js');
const compareImageUtil = require('../modules/compare-image-util.js');

describe('compareWorker', () => {
    let responseData = null;
    const runTask = function(data) {
        const requestId = 0;
        compareWorker.getRequestListener()({
            data: { requestId, data }
        });
    };
    const reset = function() {
        responseData = null;
        compareWorker.setResponseListener(data => {
            responseData = data.data;
        });
    };

    beforeEach(reset);

    it('should do nothing but return the name if unknown command requested', () => {
        const task = { cmd: 'HelloWorld' };
        runTask(task);

        assert.ok(responseData);
        assert.strictEqual(responseData.cmd, 'HelloWorld');
    });

    describe('calcHistogram', () => {
        beforeEach(reset);
        it('should calculate histogram (1)', () => {
            const task = {
                cmd: 'calcHistogram',
                type: 0, // RGB
                auxTypes: [0],
                imageData: [{
                    width: 4,
                    height: 4,
                    data: [
                        0, 0, 0, 255, 0, 0, 64, 255, 0, 0, 128, 255, 0, 0, 192, 255,
                        0, 0, 0, 255, 0, 0, 64, 255, 0, 0, 128, 255, 0, 0, 192, 255,
                        0, 1, 0, 255, 0, 1, 64, 255, 0, 1, 128, 255, 0, 1, 192, 255,
                        0, 1, 0, 255, 0, 1, 64, 255, 0, 1, 128, 255, 0, 1, 192, 255,
                    ]
                }]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcHistogram');
            assert.strictEqual(responseData.result.length, 256 * 3);
            assert.strictEqual(responseData.result[0], 16);
            assert.strictEqual(responseData.result[1], 0);
            assert.strictEqual(responseData.result[255], 0);
            assert.strictEqual(responseData.result[256], 8);
            assert.strictEqual(responseData.result[256 + 1], 8);
            assert.strictEqual(responseData.result[256 + 2], 0);
            assert.strictEqual(responseData.result[256 + 255], 0);
            assert.strictEqual(responseData.result[512], 4);
            assert.strictEqual(responseData.result[512 + 1], 0);
            assert.strictEqual(responseData.result[512 + 64], 4);
            assert.strictEqual(responseData.result[512 + 128], 4);
            assert.strictEqual(responseData.result[512 + 192], 4);
            assert.strictEqual(responseData.result[512 + 255], 0);
        });
        it('should calculate histogram (2)', () => {
            const task = {
                cmd: 'calcHistogram',
                type: 1, // Grayscale
                auxTypes: [0],
                imageData: [{
                    width: 4,
                    height: 4,
                    data: [
                        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
                        1, 1, 1, 255, 1, 1, 1, 255, 1, 1, 1, 255, 1, 1, 1, 255,
                        64, 64, 64, 255, 64, 64, 64, 255, 64, 64, 64, 255, 64, 64, 64, 255,
                        255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
                    ]
                }]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcHistogram');
            assert.strictEqual(responseData.result.length, 256);
            assert.strictEqual(responseData.result[0], 4);
            assert.strictEqual(responseData.result[1], 4);
            assert.strictEqual(responseData.result[2], 0);
            assert.strictEqual(responseData.result[63], 0);
            assert.strictEqual(responseData.result[64], 4);
            assert.strictEqual(responseData.result[65], 0);
            assert.strictEqual(responseData.result[254], 0);
            assert.strictEqual(responseData.result[255], 4);
        });
        it('should calculate histogram (3)', () => {
            const task = {
                cmd: 'calcHistogram',
                type: 2, // YCbCr
                auxTypes: [0], // bt601
                imageData: [{
                    width: 4,
                    height: 4,
                    data: [
                        // #000000 -> (Y,Cb,Cr)=(0,128,128)
                        // #808080 -> (Y,Cb,Cr)=(128,128,128)
                        0, 0, 0, 255, 0, 0, 0, 255, 128, 128, 128, 255, 128, 128, 128, 255,
                        0, 0, 0, 255, 0, 0, 0, 255, 128, 128, 128, 255, 128, 128, 128, 255,
                        // #ff0000 -> (Y,Cb,Cr)=(76,84,255)
                        255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
                        // #0000ff -> (Y,Cb,Cr)=(29,255,107)
                        // #ffff00 -> (Y,Cb,Cr)=(226,0,148)
                        0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 255, 255, 0, 255,
                    ]
                }]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcHistogram');
            assert.strictEqual(responseData.result.length, 256 * 3);
            assert.strictEqual(responseData.result[0], 4);
            assert.strictEqual(responseData.result[1], 0);
            assert.strictEqual(responseData.result[29], 3);
            assert.strictEqual(responseData.result[76], 4);
            assert.strictEqual(responseData.result[128], 4);
            assert.strictEqual(responseData.result[226], 1);
            assert.strictEqual(responseData.result[256], 1);
            assert.strictEqual(responseData.result[256 + 84], 4);
            assert.strictEqual(responseData.result[256 + 128], 8);
            assert.strictEqual(responseData.result[256 + 255], 3);
            assert.strictEqual(responseData.result[512], 0);
            assert.strictEqual(responseData.result[512 + 107], 3);
            assert.strictEqual(responseData.result[512 + 128], 8);
            assert.strictEqual(responseData.result[512 + 148], 1);
            assert.strictEqual(responseData.result[512 + 255], 4);
        });
    });

    describe('calcWaveform', () => {
        beforeEach(reset);
        const runTest = function(label, input, expected) {
            label = ' in case ' + label;
            const task = {
                cmd: 'calcWaveform',
                type: input.type,
                auxTypes: input.auxTypes,
                histW: input.histW,
                transposed: input.transposed,
                flipped: input.flipped,
                imageData: input.imageData
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcWaveform', 'cmd' + label);
            assert.strictEqual(responseData.result.length, expected.length, 'result.length' + label);
            if (expected.length === responseData.result.length) {
                let errorCount = 0;
                for (let i = 0; i < expected.length; i++) {
                    if (expected[i] !== responseData.result[i]) {
                        errorCount += 1;
                        if (3 < errorCount) {
                            console.error('...Too many errors' + label);
                            break;
                        }
                        assert.strictEqual(responseData.result[i], expected[i], 'result[' + i + ']' + label);
                    }
                }
            }
        };
        const makeWaveform = function(w, list) {
            const waveform = new Uint32Array(256 * w);
            for (let i = 0; i < list.length; i++) {
                for (let j = 0; j < list[i].length; j++) {
                    waveform[i * 256 + list[i][j][0]] = list[i][j][1];
                }
            }
            return waveform;
        };
        const imageData1 = [{
            width: 4,
            height: 4,
            data: [
                0, 0, 0, 255,  0, 0, 64, 255,  0, 0, 128, 255,  0, 0, 192, 255,
                0, 0, 0, 255,  0, 0, 64, 255,  0, 0, 128, 255,  0, 0, 192, 255,
                0, 1, 0, 255,  0, 1, 64, 255,  0, 1, 128, 255,  0, 1, 192, 255,
                0, 1, 0, 255,  0, 1, 64, 255,  0, 1, 128, 255,  0, 1, 192, 255,
            ]
        }];
        it('should calculate waveform (1)', () => {
            runTest(
                'rgb test1',
                {
                    type: 0, // RGB
                    auxTypes: [0, 0],
                    histW: 4,
                    transposed: false,
                    flipped: false,
                    imageData: imageData1
                },
                makeWaveform(
                    3 * 4,
                    [
                        [[0,4]], [[0,4]], [[0,4]], [[0,4]], // R
                        [[0,2],[1,2]], [[0,2],[1,2]], [[0,2],[1,2]], [[0,2],[1,2]], // G
                        [[0,4]], [[64,4]], [[128,4]], [[192,4]] // B
                    ]
                )
            );
        });
        it('should calculate waveform (2)', () => {
            runTest(
                'rgb test2',
                {
                    type: 0, // RGB
                    auxTypes: [0, 0],
                    histW: 4,
                    transposed: true, // transposed!
                    flipped: false,
                    imageData: imageData1
                },
                makeWaveform(
                    3 * 4,
                    [
                        [[0,4]], [[0,4]], [[0,4]], [[0,4]], // R
                        [[0,4]], [[0,4]], [[1,4]], [[1,4]], // G
                        [[0,1],[64,1],[128,1],[192,1]], [[0,1],[64,1],[128,1],[192,1]], // B
                        [[0,1],[64,1],[128,1],[192,1]], [[0,1],[64,1],[128,1],[192,1]],
                    ]
                )
            );
        });
        it('should calculate waveform (3)', () => {
            runTest(
                'luminance test1',
                {
                    type: 1, // Luminance
                    auxTypes: [0, 0],
                    histW: 4,
                    transposed: false,
                    flipped: false,
                    imageData: imageData1
                },
                makeWaveform(
                    4,
                    [
                        [[0,2],[1,2]], [[7,2],[8,2]], [[15,4]], [[22,4]]
                    ]
                )
            );
        });
        it('should calculate waveform (4)', () => {
            runTest(
                'ycbcr test1',
                {
                    type: 2, // YCbCr
                    auxTypes: [0, 0],
                    histW: 4,
                    transposed: false,
                    flipped: false,
                    imageData: imageData1
                },
                makeWaveform(
                    3 * 4,
                    [
                        [[0,2],[1,2]], [[7,2],[8,2]], [[15,4]], [[22,4]], // Y
                        [[127,2],[128,2]], [[159,2],[160,2]], [[191,2],[192,2]], [[223,2],[224,2]], // Cb
                        [[127,2],[128,2]], [[122,4]], [[117,4]], [[111,2],[112,2]], // Cr
                    ]
                )
            );
        });
    });

    describe('calc3DWaveform', () => {
        beforeEach(reset);
        const runTest = function(label, input, expected) {
            label = ' in case ' + label;
            const task = {
                cmd: 'calc3DWaveform',
                imageData: [input.imageData]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calc3DWaveform', 'cmd' + label);
            assert.strictEqual(responseData.result.width, expected.width, 'width' + label);
            assert.strictEqual(responseData.result.height, expected.height, 'height' + label);
            assert.strictEqual(responseData.result.waveform.length, expected.waveform.length, 'waveform.length' + label);
            if (expected.waveform.length === responseData.result.waveform.length) {
                let errorCount = 0;
                for (let i = 0; i < expected.waveform.length; i++) {
                    if (expected.waveform[i] !== responseData.result.waveform[i]) {
                        errorCount += 1;
                        if (3 < errorCount) {
                            console.error('...Too many errors' + label);
                            break;
                        }
                        assert.strictEqual(responseData.result.waveform[i], expected.waveform[i], 'waveform[' + i + ']' + label);
                    }
                }
            }
        };
        const makeImage = compareImageUtil.makeImage;
        const makeRegion = compareImageUtil.makeRegion;
        const fill = compareImageUtil.fill;
        const image40x30 = makeImage(40, 30);
        const image30x40 = makeImage(30, 40);
        const image1x999 = makeImage(1, 999);
        const image999x1 = makeImage(999,1);
        fill(image40x30, 0, 0, 0, 255);
        fill(image30x40, 0, 0, 0, 255);
        fill(image1x999, 255, 0, 0, 255);
        fill(image999x1, 0, 255, 0, 255);
        fill(makeRegion(image40x30, 0, 15, 20, 15), 0, 0, 255, 255);
        fill(makeRegion(image30x40, 15, 0, 15, 20), 0, 255, 0, 255);
        const expected40x30 = new Uint8Array(256 * 192 * 3);
        const expected30x40 = new Uint8Array(192 * 256 * 3);
        for (let y = 96; y < 192; y++) {
            for (let x = 0; x < 128; x++) {
                expected40x30[(y * 256 + x) * 3 + 2] = 255;
                expected30x40[(x * 192 + y) * 3 + 1] = 255;
            }
        }
        const expected1x999 = new Uint8Array(1 * 256 * 3);
        const expected999x1 = new Uint8Array(256 * 1 * 3);
        for (let y = 0; y < 256; y++) {
            expected1x999[y * 3] = 255;
            expected999x1[y * 3 + 1] = 255;
        }
        it('should calculate 3D waveform (1)', () => {
            runTest(
                'image40x30',
                {
                    imageData: image40x30
                },
                {
                    width: 256,
                    height: 192,
                    waveform: expected40x30
                }
            );
        });
        it('should calculate 3D waveform (2)', () => {
            runTest(
                'image30x40',
                {
                    imageData: image30x40
                },
                {
                    width: 192,
                    height: 256,
                    waveform: expected30x40
                }
            );
        });
        it('should calculate 3D waveform (3)', () => {
            runTest(
                'image1x999',
                {
                    imageData: image1x999
                },
                {
                    width: 1,
                    height: 256,
                    waveform: expected1x999
                }
            );
        });
        it('should calculate 3D waveform (4)', () => {
            runTest(
                'image999x1',
                {
                    imageData: image999x1
                },
                {
                    width: 256,
                    height: 1,
                    waveform: expected999x1
                }
            );
        });
    });

    describe('calcReducedColorTable', () => {
        beforeEach(reset);
        const runTest = function(label, input, expected) {
            label = ' in case ' + label;
            const task = {
                cmd: 'calcReducedColorTable',
                imageData: [input]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcReducedColorTable', 'cmd of ' + label);
            assert.strictEqual(responseData.result.totalCount, expected.totalCount, 'totalCount of ' + label);
            assert.strictEqual(responseData.result.colorList.length, expected.colorList.length, 'colorList.length of ' + label);
            if (expected.colorList.length === responseData.result.colorList.length) {
                for (let i = 0; i < expected.colorList.length; i++) {
                    const s0 = 'colorList[' + i + ']', s1 = ' of ' + label;
                    assert.strictEqual(responseData.result.colorList[i][1], expected.colorList[i][1], s0 + '[1]' + s1);
                    assert.strictEqual(responseData.result.colorList[i][2], expected.colorList[i][2], s0 + '[2]' + s1);
                    assert.strictEqual(responseData.result.colorList[i][3], expected.colorList[i][3], s0 + '[3]' + s1);
                    assert.strictEqual(responseData.result.colorList[i][4], expected.colorList[i][4], s0 + '[4]' + s1);
                }
            }
        };

        it('should calculate reduced color table: single color', () => {
            runTest(
                'single color',
                {
                    width: 4,
                    height: 4,
                    data: [
                        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
                        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
                        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
                        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255
                    ]
                },
                {
                    totalCount: 16,
                    colorList: [
                        [0, 16, 0, 0, 0]
                    ]
                }
            );
        });
        it('should calculate reduced color table: exactly only two colors', () => {
            runTest(
                'exactly only two colors',
                {
                    width: 4,
                    height: 4,
                    data: [
                        0,0,0,255,     0,0,0,255,     0,0,0,255, 0,0,0,255,
                        0,0,0,255, 255,0,128,255, 255,0,128,255, 0,0,0,255,
                        0,0,0,255, 255,0,128,255, 255,0,128,255, 0,0,0,255,
                        0,0,0,255,     0,0,0,255,     0,0,0,255, 0,0,0,255
                    ]
                },
                {
                    totalCount: 16,
                    colorList: [
                        [0, 12, 0, 0, 0],
                        [0, 4, 4*255, 4*0, 4*128]
                    ]
                }
            );
        });
    });
});
