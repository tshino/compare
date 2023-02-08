'use strict';
const assert = require('assert');
const compareWorker = require('../modules/compare-worker.js');

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
});
