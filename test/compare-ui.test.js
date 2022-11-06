'use strict';
const assert = require('assert');
const CompareUI = require('../modules/compare-ui.js');
const CompareUtil = require('../modules/compare-util.js');

describe('CompareUI', () => {
    const window = { navigator: { userAgent: 'na' } };
    const compareUtil = CompareUtil(window);
    const compareUI = CompareUI({ compareUtil });

    describe('ViewModel', () => {
        it('should have proper initial state', () => {
            const model = compareUI.ViewModel();

            assert.strictEqual(model.currentSingleImageIndex(), null);
            assert.strictEqual(model.lastSingleImageIndex(), null);
            assert.strictEqual(model.isSingleView(), false);
        });
    });
});
