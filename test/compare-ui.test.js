'use strict';
const assert = require('assert');
const CompareUI = require('../modules/compare-ui.js');
const CompareUtil = require('../modules/compare-util.js');

describe('CompareUI', () => {
    const window = { navigator: { userAgent: 'na' } };
    const compareUtil = CompareUtil(window);
    const compareUI = CompareUI({ compareUtil });

    describe('ViewModel', () => {
        describe('singleViewMode', () => {
            it('should be inactive at initial state', () => {
                const model = compareUI.ViewModel();

                assert.strictEqual(model.singleViewMode.current(), null);
                assert.strictEqual(model.singleViewMode.last(), null);
                assert.strictEqual(model.singleViewMode.isActive(), false);
            });
            describe('start', () => {
                it('should start single view mode', () => {
                    const model = compareUI.ViewModel();
                    model.singleViewMode.start(5);

                    assert.strictEqual(model.singleViewMode.current(), 5);
                    assert.strictEqual(model.singleViewMode.isActive(), true);
                });
            });
            describe('stop', () => {
                it('should stop single view mode', () => {
                    const model = compareUI.ViewModel();
                    model.singleViewMode.start(5);
                    model.singleViewMode.stop();

                    assert.strictEqual(model.singleViewMode.current(), null);
                    assert.strictEqual(model.singleViewMode.isActive(), false);
                });
            });
            describe('current', () => {
                it('should return current image index if single view mode is active', () => {
                    const model = compareUI.ViewModel();
                    const ret1 = model.singleViewMode.current();
                    model.singleViewMode.start(3);
                    const ret2 = model.singleViewMode.current();

                    assert.strictEqual(ret1, null);
                    assert.strictEqual(ret2, 3);
                });
            });
            describe('last', () => {
                it('should return image index used in the last single view mode', () => {
                    const model = compareUI.ViewModel();
                    model.singleViewMode.start(3);
                    const ret1 = model.singleViewMode.last();
                    model.singleViewMode.stop();
                    const ret2 = model.singleViewMode.last();
                    model.singleViewMode.start(2);
                    const ret3 = model.singleViewMode.last();

                    assert.strictEqual(ret1, 3);
                    assert.strictEqual(ret2, 3);
                    assert.strictEqual(ret3, 2);
                });
            });
        });
    });
});
