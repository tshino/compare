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
        const makeHistogram = function(nonZeroElems) {
            const hist = new Uint32Array(256 * nonZeroElems.length);
            for (let i = 0; i < nonZeroElems.length; i++) {
                for (let j = 0; j < nonZeroElems[i].length; j++) {
                    hist[i * 256 + nonZeroElems[i][j][0]] = nonZeroElems[i][j][1];
                }
            }
            return hist;
        };
        it('should calculate histogram: RGB', () => {
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
            assert.deepStrictEqual(responseData.result, makeHistogram([
                [[0,16]],
                [[0,8], [1,8]],
                [[0,4], [64,4], [128,4], [192,4]]
            ]));
        });
        it('should calculate histogram: Grayscale', () => {
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
            assert.deepStrictEqual(responseData.result, makeHistogram([
                [[0,4], [1,4], [64,4], [255,4]]
            ]));
        });
        it('should calculate histogram: Grayscale bt709', () => {
            const task = {
                cmd: 'calcHistogram',
                type: 1, // Grayscale
                auxTypes: [1], // bt709
                imageData: [{
                    width: 4,
                    height: 4,
                    data: [
                        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
                        0, 0, 64, 255, 0, 0, 64, 255, 0, 0, 64, 255, 0, 0, 64, 255,
                        255, 64, 0, 255, 255, 64, 0, 255, 255, 64, 0, 255, 255, 64, 0, 255,
                        255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
                    ]
                }]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcHistogram');
            assert.strictEqual(responseData.result.length, 256);
            assert.deepStrictEqual(responseData.result, makeHistogram([
                [[0,4], [5,4], [100,4], [255,4]]
            ]));
        });
        it('should calculate histogram: YCbCr', () => {
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
            assert.deepStrictEqual(responseData.result, makeHistogram([
                [[0,4], [29,3], [76,4], [128,4], [226,1]],
                [[0,1], [84,4], [128,8], [255,3]],
                [[107,3], [128,8], [148,1], [255,4]]
            ]));
        });
        it('should calculate histogram: YCbCr bt709', () => {
            const task = {
                cmd: 'calcHistogram',
                type: 2, // YCbCr
                auxTypes: [1], // bt709
                imageData: [{
                    width: 4,
                    height: 4,
                    data: [
                        0, 0, 0, 255, 0, 0, 0, 255, 128, 128, 128, 255, 128, 128, 128, 255,
                        0, 0, 0, 255, 0, 0, 0, 255, 128, 128, 128, 255, 128, 128, 128, 255,
                        255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
                        0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 255, 255, 0, 255,
                    ]
                }]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcHistogram');
            assert.strictEqual(responseData.result.length, 256 * 3);
            assert.deepStrictEqual(responseData.result, makeHistogram([
                [[0,4], [18,3], [54,4], [128,4], [237,1]],
                [[0,1], [98,4], [128,8], [255,3]],
                [[116,3], [128,8], [139,1], [255,4]]
            ]));
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
        it('should calculate waveform: RGB', () => {
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
        it('should calculate waveform: RGB transposed', () => {
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
        it('should calculate waveform: RGB flipped', () => {
            runTest(
                'rgb test3',
                {
                    type: 0, // RGB
                    auxTypes: [0, 0],
                    histW: 4,
                    transposed: false,
                    flipped: true,
                    imageData: imageData1
                },
                makeWaveform(
                    3 * 4,
                    [
                        [[0,4]], [[0,4]], [[0,4]], [[0,4]], // R
                        [[0,2],[1,2]], [[0,2],[1,2]], [[0,2],[1,2]], [[0,2],[1,2]], // G
                        [[192,4]], [[128,4]], [[64,4]], [[0,4]] // B
                    ]
                )
            );
        });
        it('should calculate waveform: Linear RGB', () => {
            runTest(
                'linear rgb test',
                {
                    type: 0, // RGB
                    auxTypes: [1, 0], // linear
                    histW: 4,
                    transposed: false,
                    flipped: false,
                    imageData: imageData1
                },
                makeWaveform(
                    3 * 4,
                    [
                        [[0,4]], [[0,4]], [[0,4]], [[0,4]], // R
                        [[0,4]], [[0,4]], [[0,4]], [[0,4]], // G
                        [[0,4]], [[13,4]], [[55,4]], [[134,4]] // B
                    ]
                )
            );
        });
        it('should calculate waveform: luminance bt601', () => {
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
        it('should calculate waveform: luminance bt709', () => {
            runTest(
                'luminance test1',
                {
                    type: 1, // Luminance
                    auxTypes: [0, 1], // bt709
                    histW: 4,
                    transposed: false,
                    flipped: false,
                    imageData: imageData1
                },
                makeWaveform(
                    4,
                    [
                        [[0,2],[1,2]], [[5,4]], [[9,2],[10,2]], [[14,2],[15,2]]
                    ]
                )
            );
        });
        it('should calculate waveform: YCbCr bt601', () => {
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
        it('should calculate waveform: YCbCr bt709', () => {
            runTest(
                'ycbcr test1',
                {
                    type: 2, // YCbCr
                    auxTypes: [0, 1], // bt709
                    histW: 4,
                    transposed: false,
                    flipped: false,
                    imageData: imageData1
                },
                makeWaveform(
                    3 * 4,
                    [
                        [[0,2],[1,2]], [[5,4]], [[9,2],[10,2]], [[14,2],[15,2]], // Y
                        [[127,2],[128,2]], [[159,2],[160,2]], [[191,2],[192,2]], [[223,2],[224,2]], // Cb
                        [[127,2],[128,2]], [[124,2],[125,2]], [[121,2],[122,2]], [[118,2],[119,2]], // Cr
                    ]
                )
            );
        });
    });

    describe('calcVectorscope', () => {
        beforeEach(reset);
        const imageData1 = {
            width: 4,
            height: 4,
            data: [
                0, 0, 0, 255, 0, 0, 64, 255, 0, 0, 128, 255, 0, 0, 192, 255,
                0, 0, 0, 255, 0, 0, 64, 255, 0, 0, 128, 255, 0, 0, 192, 255,
                0, 32, 0, 255, 0, 64, 0, 255, 0, 96, 0, 255, 0, 128, 0, 255,
                85, 0, 0, 255, 85, 0, 0, 255, 85, 0, 0, 255, 85, 0, 0, 255,
            ]
        };
        const makeVectorscopeDist = function(offx, offy, list) {
            const dist = new Uint32Array(320 * 320);
            for (const e of list) {
                dist[offx+e[0] + 320*(offy+e[1])] = e[2];
            }
            return dist;
        };
        it('should create vectorscope image: G-B', () => {
            runTask({
                cmd: 'calcVectorscope',
                type: 2, // G-B
                color: false, // colorMode
                auxTypes: [0,0],
                imageData: [imageData1]
            });
            assert.strictEqual(responseData.cmd, 'calcVectorscope');
            assert.strictEqual(responseData.result.dist.length, 320*320);
            assert.deepStrictEqual(responseData.result.dist, makeVectorscopeDist(32, 287, [
                [0,0,6], [0,-64,2], [0,-128,2], [0,-192,2],
                [32,0,1], [64,0,1], [96,0,1], [128,0,1]
            ]));
        });
        it('should create vectorscope image: G-R', () => {
            runTask({
                cmd: 'calcVectorscope',
                type: 3, // G-R
                color: false, // colorMode
                auxTypes: [0,0],
                imageData: [imageData1]
            });
            assert.strictEqual(responseData.cmd, 'calcVectorscope');
            assert.strictEqual(responseData.result.dist.length, 320*320);
            assert.deepStrictEqual(responseData.result.dist, makeVectorscopeDist(32, 287, [
                [0,0,8],
                [32,0,1], [64,0,1], [96,0,1], [128,0,1],
                [0,-85,4]
            ]));
        });
        it('should create vectorscope image: B-R', () => {
            runTask({
                cmd: 'calcVectorscope',
                type: 4, // B-R
                color: false, // colorMode
                auxTypes: [0,0],
                imageData: [imageData1]
            });
            assert.strictEqual(responseData.cmd, 'calcVectorscope');
            assert.strictEqual(responseData.result.dist.length, 320*320);
            assert.deepStrictEqual(responseData.result.dist, makeVectorscopeDist(32, 287, [
                [0,0,6], [64,0,2], [128,0,2], [192,0,2],
                [0,-85,4]
            ]));
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
        it('should calculate reduced color table: grayscale gradation', () => {
            runTest(
                'grayscaleGradation',
                {
                    width: 4,
                    height: 4,
                    data: [
                        0, 0, 0, 255, 2, 2, 2, 255, 4, 4, 4, 255, 6, 6, 6, 255,
                        2, 2, 2, 255, 4, 4, 4, 255, 6, 6, 6, 255, 8, 8, 8, 255,
                        4, 4, 4, 255, 6, 6, 6, 255, 8, 8, 8, 255, 10,10,10,255,
                        6, 6, 6, 255, 8, 8, 8, 255, 10,10,10,255, 12,12,12,255
                    ]
                },
                {
                    totalCount: 16,
                    colorList: [
                        [0, 16, 16*6, 16*6, 16*6]
                    ]
                }
            );
        });
        it('should calculate reduced color table: color gradation', () => {
            runTest(
                'colorGradation',
                {
                    width: 4,
                    height: 4,
                    data: [
                        70,30,30, 255, 72,32,32, 255, 74,34,34, 255, 76,36,36, 255,
                        72,32,32, 255, 74,34,34, 255, 76,36,36, 255, 78,38,38, 255,
                        74,34,34, 255, 76,36,36, 255, 78,38,38, 255, 80,40,40, 255,
                        76,36,36, 255, 78,38,38, 255, 80,40,40, 255, 82,42,42, 255
                    ]
                },
                {
                    totalCount: 16,
                    colorList: [
                        [0, 16, 16*76, 16*36, 16*36]
                    ]
                }
            );
        });
        it('should calculate reduced color table: stripe', () => {
            const makeImage = compareImageUtil.makeImage;
            const makeRegion = compareImageUtil.makeRegion;
            const fill = compareImageUtil.fill;
            const stripe = makeImage(50, 30);
            fill(stripe, 255, 255, 255, 255);
            fill(makeRegion(stripe, 10, 0, 10, 30), 0, 0, 255, 255);
            fill(makeRegion(stripe, 30, 0, 10, 30), 0, 0, 255, 255);
            runTest(
                'stripe',
                stripe,
                {
                    totalCount: 50 * 30,
                    colorList: [
                        [0, 900, 900*255, 900*255, 900*255],
                        [0, 600, 600*0, 600*0, 600*255],
                    ]
                }
            );
        });
    });

    describe('calcMetrics', () => {
        const colorImage1 = {
            width: 4,
            height: 4,
            data: [
                0, 0, 0, 255, 0, 0, 64, 255, 0, 0, 128, 255, 0, 0, 192, 255,
                0, 1, 0, 255, 0, 1, 64, 255, 0, 1, 128, 255, 0, 1, 192, 255,
                0, 1, 0, 255, 0, 1, 64, 255, 0, 1, 128, 255, 0, 1, 192, 255,
                0, 1, 0, 255, 0, 1, 64, 255, 0, 1, 128, 255, 0, 1, 192, 255,
            ]
        };
        it('should calculate image quality metrics: exactly same images', () => {
            const task = {
                cmd: 'calcMetrics',
                imageData: [colorImage1, colorImage1],
                auxTypes: [0]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcMetrics');
            assert.strictEqual(responseData.auxTypes[0], 0);
            assert.strictEqual(responseData.result.psnr, Infinity);
            assert.strictEqual(responseData.result.sad, 0);
            assert.strictEqual(responseData.result.ssd, 0);
            assert.strictEqual(responseData.result.mae, 0);
            assert.strictEqual(responseData.result.mse, 0);
            assert.strictEqual(responseData.result.ncc, 1);
            assert.strictEqual(responseData.result.y.psnr, Infinity);
            assert.strictEqual(responseData.result.y.sad, 0);
            assert.strictEqual(responseData.result.y.ssd, 0);
            assert.strictEqual(responseData.result.y.mae, 0);
            assert.strictEqual(responseData.result.y.mse, 0);
            assert.strictEqual(responseData.result.y.ncc, 1);
            assert.strictEqual(responseData.result.ae, 0);
            assert.strictEqual(responseData.result.aeRgb, 0);
            assert.strictEqual(responseData.result.aeAlpha, 0);
        });
        // different with colorImage1 in only red component of every pixel
        const colorImage2 = {
            width: 4,
            height: 4,
            data: [
                30, 0, 0, 255,  30, 0, 64, 255,  30, 0, 128, 255,  30, 0, 192, 255,
                30, 1, 0, 255,  30, 1, 64, 255,  30, 1, 128, 255,  30, 1, 192, 255,
                30, 1, 0, 255,  30, 1, 64, 255,  30, 1, 128, 255,  30, 1, 192, 255,
                30, 1, 0, 255,  30, 1, 64, 255,  30, 1, 128, 255,  30, 1, 192, 255,
            ]
        };
        it('should calculate image quality metrics: different images (1)', () => {
            const task = {
                cmd: 'calcMetrics',
                imageData: [colorImage1, colorImage2],
                auxTypes: [0]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcMetrics');
            assert.strictEqual(1e-14 > Math.abs(10 * Math.log10((3*255*255) / (30*30)) - responseData.result.psnr), true);
            assert.strictEqual(responseData.result.sad, 30*16);
            assert.strictEqual(responseData.result.ssd, 30*30*16);
            assert.strictEqual(responseData.result.mae, 30/3);
            assert.strictEqual(responseData.result.mse, (30*30)/3);
            //assert.strictEqual(responseData.result.ncc, ????); // non-trivial answer
            assert.strictEqual(1e-14 > Math.abs(10 * Math.log10((255*255) / (9*9)) - responseData.result.y.psnr), true);
            assert.strictEqual(responseData.result.y.sad, 9*16);
            assert.strictEqual(responseData.result.y.ssd, 9*9*16);
            assert.strictEqual(responseData.result.y.mae, 9);
            assert.strictEqual(responseData.result.y.mse, 9*9);
            //assert.strictEqual(responseData.result.y.ncc, ????); // non-trivial answer
            assert.strictEqual(responseData.result.ae, 16);
            assert.strictEqual(responseData.result.aeRgb, 16);
            assert.strictEqual(responseData.result.aeAlpha, 0);
        });
        it('should calculate image quality metrics: different images (2)', () => {
            const task = {
                cmd: 'calcMetrics',
                imageData: [colorImage1, colorImage2],
                auxTypes: [1] // *** bt709
            };
            runTask(task);

            // expected luma values (bt709)
            // 0, 0, 0   --> 0   30, 0, 0  --> 6      (+6)
            // 0, 1, 0   --> 1   30, 1, 0  --> 7      (+6)
            // 0, 0, 64  --> 5   30, 0, 64 --> 11     (+6)
            // 0, 1, 64  --> 5   30, 1, 64 --> 12     (+7)
            // 0, 0, 128 --> 9   30, 0, 128 --> 16    (+7)
            // 0, 1, 128 --> 10  30, 1, 128 --> 16    (+6)
            // 0, 0, 192 --> 14  30, 0, 192 --> 20    (+6)
            // 0, 1, 192 --> 15  30, 1, 192 --> 21    (+6)
            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcMetrics');
            assert.strictEqual(responseData.auxTypes[0], 1);
            assert.strictEqual(1e-14 > Math.abs(10 * Math.log10((255*255*16) / (6*6*12+7*7*4)) - responseData.result.y.psnr), true);
            assert.strictEqual(responseData.result.y.sad, 6*12+7*4);
            assert.strictEqual(responseData.result.y.ssd, 6*6*12+7*7*4);
            assert.strictEqual(responseData.result.y.mae, 6.25);
            assert.strictEqual(responseData.result.y.mse, 6*6*0.75+7*7*0.25);
            //assert.strictEqual(responseData.result.y.ncc, ????); // non-trivial answer
        });
        const redImage = {
            width: 4,
            height: 4,
            data: [
                255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
                255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
                255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
                255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255
            ]
        };
        const greenImage = {
            width: 4,
            height: 4,
            data: [
                0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255,
                0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255,
                0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255,
                0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255
            ]
        };
        it('should calculate image quality metrics: different images (3)', () => {
            const task = {
                cmd: 'calcMetrics',
                imageData: [redImage, greenImage],
                auxTypes: [0]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcMetrics');
            assert.strictEqual(1e-14 > Math.abs(10 * Math.log10(1.5) - responseData.result.psnr), true);
            assert.strictEqual(responseData.result.sad, 255 * 2 * 16);
            assert.strictEqual(responseData.result.ssd, 255 * 255 * 2 * 16);
            assert.strictEqual(responseData.result.mae, 255 * 2 / 3);
            assert.strictEqual(responseData.result.mse, 255 * 255 * 2 / 3);
            assert.strictEqual(responseData.result.ncc, -0.5);
            assert.strictEqual(1e-14 > Math.abs(10 * Math.log10((255*255) / (74*74)) - responseData.result.y.psnr), true);
            assert.strictEqual(responseData.result.y.sad, 74 * 16);
            assert.strictEqual(responseData.result.y.ssd, 74 * 74 * 16);
            assert.strictEqual(responseData.result.y.mae, 74);
            assert.strictEqual(responseData.result.y.mse, 74 * 74);
            //assert.strictEqual(responseData.result.y.ncc, xxx);  //FIXME
            assert.strictEqual(responseData.result.ae, 16);
            assert.strictEqual(responseData.result.aeRgb, 16);
            assert.strictEqual(responseData.result.aeAlpha, 0);
        });
        // exactly same flat images
        // Note: NCC between flat image and any image is always 0 (definition in this app)
        const blackImage = {
            width: 4,
            height: 4,
            data: [
                0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
                0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
                0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
                0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255
            ]
        };
        it('should calculate image quality metrics: exactly same flat images (1)', () => {
            const task = {
                cmd: 'calcMetrics',
                imageData: [blackImage, blackImage],
                auxTypes: [0]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcMetrics');
            assert.strictEqual(responseData.result.psnr, Infinity);
            assert.strictEqual(responseData.result.sad, 0);
            assert.strictEqual(responseData.result.ssd, 0);
            assert.strictEqual(responseData.result.mae, 0);
            assert.strictEqual(responseData.result.mse, 0);
            assert.strictEqual(isNaN(responseData.result.ncc), true);
            assert.strictEqual(responseData.result.y.psnr, Infinity);
            assert.strictEqual(responseData.result.y.sad, 0);
            assert.strictEqual(responseData.result.y.ssd, 0);
            assert.strictEqual(responseData.result.y.mae, 0);
            assert.strictEqual(responseData.result.y.mse, 0);
            assert.strictEqual(isNaN(responseData.result.y.ncc), true);
            assert.strictEqual(responseData.result.ae, 0);
            assert.strictEqual(responseData.result.aeRgb, 0);
            assert.strictEqual(responseData.result.aeAlpha, 0);
        });
        // exactly same flat images (both transparent)
        const transparent = {
            width: 4,
            height: 4,
            data: [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ]
        };
        it('should calculate image quality metrics: exactly same flat images (2)', () => {
            const task = {
                cmd: 'calcMetrics',
                imageData: [transparent, transparent],
                auxTypes: [0]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcMetrics');
            assert.strictEqual(responseData.result.psnr, Infinity);
            assert.strictEqual(responseData.result.sad, 0);
            assert.strictEqual(responseData.result.ssd, 0);
            assert.strictEqual(responseData.result.mae, 0);
            assert.strictEqual(responseData.result.mse, 0);
            assert.strictEqual(isNaN(responseData.result.ncc), true);
            assert.strictEqual(responseData.result.y.psnr, Infinity);
            assert.strictEqual(responseData.result.y.sad, 0);
            assert.strictEqual(responseData.result.y.ssd, 0);
            assert.strictEqual(responseData.result.y.mae, 0);
            assert.strictEqual(responseData.result.y.mse, 0);
            assert.strictEqual(isNaN(responseData.result.y.ncc), true);
            assert.strictEqual(responseData.result.ae, 0);
            assert.strictEqual(responseData.result.aeRgb, 0);
            assert.strictEqual(responseData.result.aeAlpha, 0);
        });
        // different flat images
        const whiteImage = {
            width: 4,
            height: 4,
            data: [
                255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
                255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
                255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
                255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255
            ]
        };
        it('should calculate image quality metrics: different flat images (1)', () => {
            const task = {
                cmd: 'calcMetrics',
                imageData: [blackImage, whiteImage],
                auxTypes: [0]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcMetrics');
            assert.strictEqual(responseData.result.psnr, 0);
            assert.strictEqual(responseData.result.sad, 255*3*16);
            assert.strictEqual(responseData.result.ssd, 255*255*3*16);
            assert.strictEqual(responseData.result.mae, 255);
            assert.strictEqual(responseData.result.mse, 255 * 255);
            assert.strictEqual(isNaN(responseData.result.ncc), true);
            assert.strictEqual(responseData.result.y.psnr, 0);
            assert.strictEqual(responseData.result.y.sad, 255*16);
            assert.strictEqual(responseData.result.y.ssd, 255*255*16);
            assert.strictEqual(responseData.result.y.mae, 255);
            assert.strictEqual(responseData.result.y.mse, 255 * 255);
            assert.strictEqual(isNaN(responseData.result.y.ncc), true);
            assert.strictEqual(responseData.result.ae, 16);
            assert.strictEqual(responseData.result.aeRgb, 16);
            assert.strictEqual(responseData.result.aeAlpha, 0);
        });
        it('should calculate image quality metrics: different flat images (2)', () => {
            const task = {
                cmd: 'calcMetrics',
                imageData: [blackImage, redImage],
                auxTypes: [0]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcMetrics');
            assert.strictEqual(1e-14 > Math.abs(10 * Math.log10(3) - responseData.result.psnr), true);
            assert.strictEqual(responseData.result.sad, 255 * 16);
            assert.strictEqual(responseData.result.ssd, 255 * 255 * 16);
            assert.strictEqual(responseData.result.mae, 255 / 3);
            assert.strictEqual(responseData.result.mse, 255 * 255 / 3);
            assert.strictEqual(isNaN(responseData.result.ncc), true);
            assert.strictEqual(1e-14 > Math.abs(10 * Math.log10((255*255) / (76*76)) - responseData.result.y.psnr), true);
            assert.strictEqual(responseData.result.y.sad, 76 * 16);
            assert.strictEqual(responseData.result.y.ssd, 76 * 76 * 16);
            assert.strictEqual(responseData.result.y.mae, 76);
            assert.strictEqual(responseData.result.y.mse, 76 * 76);
            assert.strictEqual(isNaN(responseData.result.y.ncc), true);
            assert.strictEqual(responseData.result.ae, 16);
            assert.strictEqual(responseData.result.aeRgb, 16);
            assert.strictEqual(responseData.result.aeAlpha, 0);
        });
        it('should calculate image quality metrics: different flat images (3)', () => {
            const task = {
                cmd: 'calcMetrics',
                imageData: [blackImage, transparent],
                auxTypes: [0]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcMetrics');
            assert.strictEqual(responseData.result.psnr, Infinity);
            assert.strictEqual(responseData.result.sad, 0);
            assert.strictEqual(responseData.result.ssd, 0);
            assert.strictEqual(responseData.result.mae, 0);
            assert.strictEqual(responseData.result.mse, 0);
            assert.strictEqual(isNaN(responseData.result.ncc), true);
            assert.strictEqual(responseData.result.y.psnr, Infinity);
            assert.strictEqual(responseData.result.y.sad, 0);
            assert.strictEqual(responseData.result.y.ssd, 0);
            assert.strictEqual(responseData.result.y.mae, 0);
            assert.strictEqual(responseData.result.y.mse, 0);
            assert.strictEqual(isNaN(responseData.result.y.ncc), true);
            assert.strictEqual(responseData.result.ae, 16);
            assert.strictEqual(responseData.result.aeRgb, 0);
            assert.strictEqual(responseData.result.aeAlpha, 16);
        });
        // different images, one is flat
        it('should calculate image quality metrics: different images, one is flat', () => {
            const task = {
                cmd: 'calcMetrics',
                imageData: [blackImage, colorImage1],
                auxTypes: [0]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcMetrics');
            //assert.strictEqual( ???, data.result.psnr );
            //assert.strictEqual( ???, data.result.sad );
            //assert.strictEqual( ???, data.result.ssd );
            //assert.strictEqual( ???, data.result.mae );
            //assert.strictEqual( ???, data.result.mse );
            assert.strictEqual(isNaN(responseData.result.ncc), true);
            //assert.strictEqual( ???, data.result.y.psnr );
            //assert.strictEqual( ???, data.result.y.sad );
            //assert.strictEqual( ???, data.result.y.ssd );
            //assert.strictEqual( ???, data.result.y.mae );
            //assert.strictEqual( ???, data.result.y.mse );
            assert.strictEqual(isNaN(responseData.result.y.ncc), true);
            assert.strictEqual(responseData.result.ae, 15);
            assert.strictEqual(responseData.result.aeRgb, 15);
            assert.strictEqual(responseData.result.aeAlpha, 0);
        });

        // size/orientation tests
        const image3x2 = {
            width: 3,
            height: 2,
            data: [
                0,0,0,0,     85,85,85,85,     170,170,170,170,
                85,85,85,85, 170,170,170,170, 255,255,255,255
            ]
        };
        const image2x3 = {
            width: 2,
            height: 3,
            data: [
                0,0,0,0,         85,85,85,85,
                85,85,85,85,     170,170,170,170,
                170,170,170,170, 255,255,255,255
            ]
        };
        it('should calculate image quality metrics: different size => error', () => {
            const task = { cmd: 'calcMetrics', imageData: [image3x2, image2x3] };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcMetrics');
            assert.strictEqual(isNaN(responseData.result.psnr), true);
            assert.strictEqual(isNaN(responseData.result.sad), true);
            assert.strictEqual(isNaN(responseData.result.ssd), true);
            assert.strictEqual(isNaN(responseData.result.mae), true);
            assert.strictEqual(isNaN(responseData.result.mse), true);
            assert.strictEqual(isNaN(responseData.result.ncc), true);
            assert.strictEqual(isNaN(responseData.result.y.psnr), true);
            assert.strictEqual(isNaN(responseData.result.y.sad), true);
            assert.strictEqual(isNaN(responseData.result.y.ssd), true);
            assert.strictEqual(isNaN(responseData.result.y.mae), true);
            assert.strictEqual(isNaN(responseData.result.y.mse), true);
            assert.strictEqual(isNaN(responseData.result.y.ncc), true);
            assert.strictEqual(isNaN(responseData.result.ae), true);
            assert.strictEqual(isNaN(responseData.result.aeRgb), true);
            assert.strictEqual(isNaN(responseData.result.aeAlpha), true);
        });
        const imageEmpty = {
            width: 0,
            height: 0,
            data: []
        };
        it('should calculate image quality metrics: invalid size => error (1)', () => {
            const task = { cmd: 'calcMetrics', imageData: [imageEmpty, image2x3] };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcMetrics');
            assert.strictEqual(isNaN(responseData.result.psnr), true);
            assert.strictEqual(isNaN(responseData.result.sad), true);
            assert.strictEqual(isNaN(responseData.result.ssd), true);
            assert.strictEqual(isNaN(responseData.result.mae), true);
            assert.strictEqual(isNaN(responseData.result.mse), true);
            assert.strictEqual(isNaN(responseData.result.ncc), true);
            assert.strictEqual(isNaN(responseData.result.y.psnr), true);
            assert.strictEqual(isNaN(responseData.result.y.sad), true);
            assert.strictEqual(isNaN(responseData.result.y.ssd), true);
            assert.strictEqual(isNaN(responseData.result.y.mae), true);
            assert.strictEqual(isNaN(responseData.result.y.mse), true);
            assert.strictEqual(isNaN(responseData.result.y.ncc), true);
            assert.strictEqual(isNaN(responseData.result.ae), true);
            assert.strictEqual(isNaN(responseData.result.aeRgb), true);
            assert.strictEqual(isNaN(responseData.result.aeAlpha), true);
        });
        it('should calculate image quality metrics: invalid size => error (2)', () => {
            const task = { cmd: 'calcMetrics', imageData: [image2x3, imageEmpty] };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcMetrics');
            assert.strictEqual(isNaN(responseData.result.psnr), true);
            assert.strictEqual(isNaN(responseData.result.sad), true);
            assert.strictEqual(isNaN(responseData.result.ssd), true);
            assert.strictEqual(isNaN(responseData.result.mae), true);
            assert.strictEqual(isNaN(responseData.result.mse), true);
            assert.strictEqual(isNaN(responseData.result.ncc), true);
            assert.strictEqual(isNaN(responseData.result.y.psnr), true);
            assert.strictEqual(isNaN(responseData.result.y.sad), true);
            assert.strictEqual(isNaN(responseData.result.y.ssd), true);
            assert.strictEqual(isNaN(responseData.result.y.mae), true);
            assert.strictEqual(isNaN(responseData.result.y.mse), true);
            assert.strictEqual(isNaN(responseData.result.y.ncc), true);
            assert.strictEqual(isNaN(responseData.result.ae), true);
            assert.strictEqual(isNaN(responseData.result.aeRgb), true);
            assert.strictEqual(isNaN(responseData.result.aeAlpha), true);
        });

        // different orientation and resulting same image
        it('should calculate image quality metrics: different orientation and resulting same image', () => {
            const options = { orientationA: 1, orientationB: 5 };
            const task = { cmd: 'calcMetrics', imageData: [image3x2, image2x3], options: options };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcMetrics');
            assert.strictEqual(responseData.result.psnr, Infinity);
            assert.strictEqual(responseData.result.sad, 0);
            assert.strictEqual(responseData.result.ssd, 0);
            assert.strictEqual(responseData.result.mae, 0);
            assert.strictEqual(responseData.result.mse, 0);
            assert.strictEqual(responseData.result.ncc, 1);
            assert.strictEqual(responseData.result.y.psnr, Infinity);
            assert.strictEqual(responseData.result.y.sad, 0);
            assert.strictEqual(responseData.result.y.ssd, 0);
            assert.strictEqual(responseData.result.y.mae, 0);
            assert.strictEqual(responseData.result.y.mse, 0);
            assert.strictEqual(responseData.result.y.ncc, 1);
            assert.strictEqual(responseData.result.ae, 0);
            assert.strictEqual(responseData.result.aeRgb, 0);
            assert.strictEqual(responseData.result.aeAlpha, 0);
        });
    });

    describe('calcToneCurve', () => {
        const image1 = { width: 3, height: 2, data: [
            0,0,0,0,     85,85,85,85,     170,170,170,170,
            85,85,85,85, 170,170,170,170, 170,170,170,170
        ]};
        const image2 = { width: 3, height: 2, data: [
            10,10,10,10, 20,20,20,20, 30,30,30,30,
            30,30,30,30, 30,30,30,30, 30,30,30,30
        ]};
        it('should calculate tone curve data (1)', () => {
            const task = {
                cmd: 'calcToneCurve',
                type: 0,
                auxTypes: [0],
                imageData: [image1, image2]
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcToneCurve');
            assert.strictEqual(responseData.type, 0);
            assert.strictEqual(responseData.auxTypes[0], 0);
            assert.strictEqual(responseData.result.components.length, 3);
            assert.strictEqual(responseData.result.toneMap.dist.length, 256 * 256 * 3);
            assert.strictEqual(responseData.result.toneMap.max, 3 * 2);
            assert.strictEqual(responseData.result.toneMap.dist[0 + (255-10)*256], 1);
            assert.strictEqual(responseData.result.toneMap.dist[0 + (255-10)*256 + 65536], 1);
            assert.strictEqual(responseData.result.toneMap.dist[0 + (255-10)*256 + 131072], 1);
            assert.strictEqual(responseData.result.toneMap.dist[85 + (255-20)*256], 1);
            assert.strictEqual(responseData.result.toneMap.dist[85 + (255-20)*256 + 65536], 1);
            assert.strictEqual(responseData.result.toneMap.dist[85 + (255-20)*256 + 131072], 1);
            assert.strictEqual(responseData.result.toneMap.dist[85 + (255-30)*256], 1);
            assert.strictEqual(responseData.result.toneMap.dist[85 + (255-30)*256 + 65536], 1);
            assert.strictEqual(responseData.result.toneMap.dist[85 + (255-30)*256 + 131072], 1);
            assert.strictEqual(responseData.result.toneMap.dist[170 + (255-30)*256], 3);
            assert.strictEqual(responseData.result.toneMap.dist[170 + (255-30)*256 + 65536], 3);
            assert.strictEqual(responseData.result.toneMap.dist[170 + (255-30)*256 + 131072], 3);
        });
        const image3 = { width: 2, height: 3, data: [
            20,20,20,20, 10,10,10,10,
            30,30,30,30, 20,20,20,20,
            50,50,50,50, 30,30,30,30
        ]};
        it('should calculate tone curve data (2)', () => {
            const options = { orientationA: 1, orientationB: 8 };
            const task = {
                cmd: 'calcToneCurve',
                type: 0,
                auxTypes: [0],
                imageData: [image1, image3],
                options: options
            };
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcToneCurve');
            assert.strictEqual(responseData.type, 0);
            assert.strictEqual(responseData.auxTypes[0], 0);
            assert.strictEqual(responseData.result.components.length, 3);
            assert.strictEqual(responseData.result.toneMap.dist.length, 256 * 256 * 3);
            assert.strictEqual(responseData.result.toneMap.max, 3 * 2);
            assert.strictEqual(responseData.result.toneMap.dist[0 + (255-10)*256], 1);
            assert.strictEqual(responseData.result.toneMap.dist[0 + (255-10)*256 + 65536], 1);
            assert.strictEqual(responseData.result.toneMap.dist[0 + (255-10)*256 + 131072], 1);
            assert.strictEqual(responseData.result.toneMap.dist[85 + (255-20)*256], 2);
            assert.strictEqual(responseData.result.toneMap.dist[85 + (255-20)*256 + 65536], 2);
            assert.strictEqual(responseData.result.toneMap.dist[85 + (255-20)*256 + 131072], 2);
            assert.strictEqual(responseData.result.toneMap.dist[170 + (255-30)*256], 2);
            assert.strictEqual(responseData.result.toneMap.dist[170 + (255-30)*256 + 65536], 2);
            assert.strictEqual(responseData.result.toneMap.dist[170 + (255-30)*256 + 131072], 2);
            assert.strictEqual(responseData.result.toneMap.dist[170 + (255-50)*256], 1);
            assert.strictEqual(responseData.result.toneMap.dist[170 + (255-50)*256 + 65536], 1);
            assert.strictEqual(responseData.result.toneMap.dist[170 + (255-50)*256 + 131072], 1);
        });
    });

    describe('calcDiff', () => {
        const image1 = { width: 3, height: 2, data: [
            0,0,0,0,     85,85,85,85,     170,170,170,170,
            85,85,85,85, 170,170,170,170, 255,255,255,255
        ]};
        const image2 = { width: 3, height: 2, data: [
            0,0,0,0,     80,80,80,80,     160,160,160,160,
            80,80,80,80, 160,160,160,160, 255,255,255,255
        ]};
        const newTask = () => ({
            cmd: 'calcDiff', imageData: [image1, image2],
            options: {
                ignoreAE: 0,
                imageType: 0,
                ignoreRemainder: false,
                resizeToLarger: true,
                resizeMethod: 'lanczos3',
                offsetX: 0,
                offsetY: 0,
                orientationA: null,
                orientationB: null,
            }
        });
        it('should calculate image diff (1)', () => {
            const task = newTask();
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcDiff');
            assert.strictEqual(responseData.result.image.width, 3);
            assert.strictEqual(responseData.result.image.height, 2);
            assert.strictEqual(responseData.result.image.data.length, 3 * 2 * 4);
            assert.strictEqual(responseData.result.summary.unmatch, 4);
            assert.strictEqual(responseData.result.summary.match, 2);
            assert.strictEqual(responseData.result.summary.total, 6);
            assert.strictEqual(responseData.result.summary.countIgnoreAE, 0);
            assert.strictEqual(responseData.result.summary.histogram.length, 256);
            assert.strictEqual(responseData.result.summary.histogram[0], 2);
            assert.strictEqual(responseData.result.summary.histogram[1], 0);
            assert.strictEqual(responseData.result.summary.histogram[5], 2);
            assert.strictEqual(responseData.result.summary.histogram[10], 2);
            assert.strictEqual(responseData.result.summary.histogram[15], 0);
            assert.strictEqual(responseData.result.summary.histogram[255], 0);
            assert.strictEqual(responseData.result.summary.maxAE, 10);
            assert.strictEqual(responseData.options.ignoreAE, task.options.ignoreAE);
            assert.strictEqual(responseData.options.imageType, task.options.imageType);
            assert.strictEqual(responseData.options.ignoreRemainder, task.options.ignoreRemainder);
            assert.strictEqual(responseData.options.resizeToLarger, task.options.resizeToLarger);
            assert.strictEqual(responseData.options.resizeMethod, task.options.resizeMethod);
            assert.strictEqual(responseData.options.offsetX, task.options.offsetX);
            assert.strictEqual(responseData.options.offsetY, task.options.offsetY);
            assert.strictEqual(responseData.options.orentationA, task.options.orentationA);
            assert.strictEqual(responseData.options.orentationB, task.options.orentationB);
        });
        it('should calculate image diff (2)', () => {
            const task = newTask();
            task.options.ignoreAE = 5;
            runTask(task);

            assert.ok(responseData);
            assert.strictEqual(responseData.cmd, 'calcDiff');
            assert.strictEqual(responseData.result.summary.unmatch, 2);
            assert.strictEqual(responseData.result.summary.match, 4);
            assert.strictEqual(responseData.result.summary.total, 6);
            assert.strictEqual(responseData.result.summary.countIgnoreAE, 2);
            assert.strictEqual(responseData.result.summary.maxAE, 10);
            assert.strictEqual(responseData.result.summary.histogram[0], 2);
            assert.strictEqual(responseData.result.summary.histogram[1], 0);
            assert.strictEqual(responseData.result.summary.histogram[5], 2);
            assert.strictEqual(responseData.result.summary.histogram[10], 2);
            assert.strictEqual(responseData.result.summary.histogram[15], 0);
            assert.strictEqual(responseData.result.summary.histogram[255], 0);
        });
        it('should calculate image diff (3)', () => {
            const task = newTask();
            task.options.ignoreAE = 1;
            runTask(task);

            assert.strictEqual(responseData.result.summary.unmatch, 4);
            assert.strictEqual(responseData.result.summary.match, 2);
            assert.strictEqual(responseData.result.summary.countIgnoreAE, 0);
        });
        it('should calculate image diff (4)', () => {
            const task = newTask();
            task.options.ignoreAE = 4;
            runTask(task);

            assert.strictEqual(responseData.result.summary.unmatch, 4);
            assert.strictEqual(responseData.result.summary.match, 2);
            assert.strictEqual(responseData.result.summary.countIgnoreAE, 0);
        });
        it('should calculate image diff (5)', () => {
            const task = newTask();
            task.options.ignoreAE = 6;
            runTask(task);

            assert.strictEqual(responseData.result.summary.unmatch, 2);
            assert.strictEqual(responseData.result.summary.match, 4);
            assert.strictEqual(responseData.result.summary.countIgnoreAE, 2);
        });
        it('should calculate image diff (6)', () => {
            const task = newTask();
            task.options.ignoreAE = 10;
            runTask(task);

            assert.strictEqual(responseData.result.summary.unmatch, 0);
            assert.strictEqual(responseData.result.summary.match, 6);
            assert.strictEqual(responseData.result.summary.countIgnoreAE, 4);
        });
        it('should calculate image diff (7)', () => {
            const task = newTask();
            task.options.ignoreAE = 11;
            runTask(task);

            assert.strictEqual(responseData.result.summary.unmatch, 0);
            assert.strictEqual(responseData.result.summary.match, 6);
            assert.strictEqual(responseData.result.summary.countIgnoreAE, 4);
        });
        it('should calculate image diff (8)', () => {
            const task = newTask();
            task.options.imageType = 1;  // Grayscale
            task.options.ignoreAE = 0;
            runTask(task);

            assert.strictEqual(responseData.cmd, 'calcDiff');
            assert.strictEqual(responseData.options.imageType, 1);
            assert.strictEqual(responseData.result.image.width, 3);
            assert.strictEqual(responseData.result.image.height, 2);
            assert.strictEqual(responseData.result.image.data.length, 3 * 2 * 4);
            assert.strictEqual(responseData.result.image.data[0], 0);
            assert.strictEqual(responseData.result.image.data[1], 0);
            assert.strictEqual(responseData.result.image.data[2], 0);
            assert.strictEqual(responseData.result.image.data[3], 255);
            assert.strictEqual(responseData.result.image.data[4], 5);
            assert.strictEqual(responseData.result.image.data[5], 5);
            assert.strictEqual(responseData.result.image.data[6], 5);
            assert.strictEqual(responseData.result.image.data[7], 255);
            assert.strictEqual(responseData.result.image.data[8], 10);
            assert.strictEqual(responseData.result.image.data[12], 5);
            assert.strictEqual(responseData.result.image.data[16], 10);
            assert.strictEqual(responseData.result.image.data[20], 0);
        });
    });
});
