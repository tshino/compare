'use strict';
const assert = require('assert');
const compareWorker = require('../modules/compare-worker.js');

describe('compareWorker', () => {
    let responseData = null;
    const addTask = function(data) {
        const requestId = 0;
        compareWorker.getRequestListener()({
            data: { requestId, data }
        });
    };
    beforeEach(() => {
        responseData = null;
        compareWorker.setResponseListener(data => {
            responseData = data.data;
        });
    });

    it('should do nothing but return the name if unknown command requested', () => {
        const task = { cmd: 'HelloWorld' };
        addTask(task);

        assert.ok(responseData);
        console.log(responseData);
        assert.strictEqual(responseData.cmd, 'HelloWorld');
    });
});
