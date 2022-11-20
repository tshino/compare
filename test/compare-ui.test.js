'use strict';
const assert = require('assert');
const CompareUI = require('../modules/compare-ui.js');
const CompareUtil = require('../modules/compare-util.js');

describe('CompareUI', () => {
    const window = { navigator: { userAgent: 'na' } };
    const compareUtil = CompareUtil(window);
    const compareUI = CompareUI({ compareUtil });

    describe('ViewModel', () => {
        describe('Registry', () => {
            describe('register', () => {
                it('should append given new entry to internal array', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const ent0 = { hello: 'world' };
                    assert.strictEqual(registry.getEntry(0), undefined);
                    registry.register(ent0);

                    assert.strictEqual(registry.getEntry(0), ent0);
                });
                it('should return given entry', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const ent0 = {};
                    const ret = registry.register(ent0);

                    assert.strictEqual(ret, ent0);
                });
                it('should define index for each entry', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const ent0 = { name: 'hello' };
                    const ent1 = { name: 'world' };
                    registry.register(ent0);
                    registry.register(ent1);

                    assert.strictEqual(ent0.index, 0);
                    assert.strictEqual(ent1.index, 1);
                });
                it('should initialize some attributes', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const ent0 = { name: 'hello' };
                    registry.register(ent0);

                    assert.strictEqual(ent0.element, null);
                    assert.strictEqual(typeof(ent0.ready), 'function');
                    assert.strictEqual(ent0.ready(), false);
                });
            });
            describe('update', () => {
                it('should make active image list', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const ent0 = { name: 'hello' };
                    const ent1 = { name: 'world' };
                    registry.register(ent0);
                    registry.register(ent1);
                    ent1.element = {};
                    registry.update();

                    assert.strictEqual(registry.getImages().length, 1);
                    assert.strictEqual(registry.getImages()[0], ent1);
                });
            });
            describe('empty', () => {
                it('should return true if there are no active images', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const ent0 = { name: 'hello' };
                    const ent1 = { name: 'world' };
                    registry.register(ent0);
                    registry.register(ent1);

                    ent1.element = {};
                    registry.update();
                    assert.strictEqual(registry.empty(), false);

                    ent1.element = null;
                    registry.update();
                    assert.strictEqual(registry.empty(), true);
                });
            });
            // TODO: add more
        });

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

        describe('layoutDirection', () => {
            describe('current', () => {
                it('should return null at initial state', () => {
                    const model = compareUI.ViewModel();
                    assert.strictEqual(model.layoutDirection.current(), null);
                });
                it('should return current state', () => {
                    const model = compareUI.ViewModel();
                    model.layoutDirection.alternate();
                    assert.strictEqual(model.layoutDirection.current(), 'x');
                });
            });
            describe('reset', () => {
                it('should set null', () => {
                    const model = compareUI.ViewModel();
                    model.layoutDirection.alternate();
                    model.layoutDirection.reset();
                    assert.strictEqual(model.layoutDirection.current(), null);
                });
            });
            describe('alternate', () => {
                it('should set valid values in rotation', () => {
                    const model = compareUI.ViewModel();
                    model.layoutDirection.alternate();
                    assert.strictEqual(model.layoutDirection.current(), 'x');
                    model.layoutDirection.alternate();
                    assert.strictEqual(model.layoutDirection.current(), 'y');
                    model.layoutDirection.alternate();
                    assert.strictEqual(model.layoutDirection.current(), 'x');
                });
            });
            describe('determineByAspect', () => {
                it('should set x if viewport is landscape-oriented', () => {
                    const model = compareUI.ViewModel();
                    model.layoutDirection.determineByAspect(1920, 1080);
                    assert.strictEqual(model.layoutDirection.current(), 'x');
                });
                it('should set y if viewport is portrait-oriented', () => {
                    const model = compareUI.ViewModel();
                    model.layoutDirection.determineByAspect(1000, 1500);
                    assert.strictEqual(model.layoutDirection.current(), 'y');
                });
            });
        });
    });
});
