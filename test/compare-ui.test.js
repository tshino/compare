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
                it('should assign ascending index for each entry', () => {
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

                    assert.strictEqual(registry.visible(ent0.index), true);
                    assert.strictEqual(ent0.element, null);
                    assert.strictEqual(ent0.asCanvas, null);
                    assert.strictEqual(ent0.canvasWidth, 0);
                    assert.strictEqual(ent0.canvasHeight, 0);
                    assert.strictEqual(ent0.loading, true);
                    assert.strictEqual(ent0.error, null);
                });
            });
            describe('ready', () => {
                it('should return true if specified image is active', () => {
                    const registry = compareUI.ViewModel().Registry();
                    registry.register({ name: 'loading' });
                    registry.register({ name: 'ready' });
                    registry.register({ name: 'error' });
                    registry.register({ name: 'removed' });
                    registry.setImage(1, {});
                    registry.setError(2, 'error!');
                    registry.setImage(3, {});
                    registry.removeEntry(3);

                    assert.strictEqual(registry.ready(0), false);
                    assert.strictEqual(registry.ready(1), true);
                    assert.strictEqual(registry.ready(2), false);
                    assert.strictEqual(registry.ready(3), false);
                    assert.strictEqual(registry.ready(null), false);
                });
            });
            describe('visible', () => {
                it('should return true if specified image is visible', () => {
                    const registry = compareUI.ViewModel().Registry();
                    registry.register({ name: 'loading' });
                    registry.register({ name: 'ready' });
                    registry.register({ name: 'error' });
                    registry.register({ name: 'removed' });
                    registry.setImage(1, {});
                    registry.setError(2, 'error!');
                    registry.setImage(3, {});
                    registry.removeEntry(3);

                    assert.strictEqual(registry.visible(0), true);
                    assert.strictEqual(registry.visible(1), true);
                    assert.strictEqual(registry.visible(2), false);
                    assert.strictEqual(registry.visible(3), false);
                    assert.strictEqual(registry.visible(null), false);
                });
            });
            describe('numVisibleEntries', () => {
                it('should return the number of visible entries', () => {
                    const registry = compareUI.ViewModel().Registry();
                    registry.register({ name: 'loading' });
                    registry.register({ name: 'ready' });
                    registry.register({ name: 'error' });
                    registry.register({ name: 'removed' });
                    registry.setImage(1, {});
                    registry.setError(2, 'error!');
                    registry.setImage(3, {});
                    registry.removeEntry(3);

                    assert.strictEqual(registry.numVisibleEntries(), 2);
                });
            });
            describe('setImage', () => {
                it('should set given image element and canvas as main image', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const ent0 = { name: 'hello' };
                    registry.register(ent0);
                    registry.setImage(ent0.index, {
                        image: 'main-image',
                        canvas: 'as-canvas',
                        width: 320,
                        height: 240
                    });

                    assert.strictEqual(ent0.loading, false);
                    assert.strictEqual(ent0.element, 'main-image');
                    assert.strictEqual(ent0.asCanvas, 'as-canvas');
                    assert.strictEqual(ent0.canvasWidth, 320);
                    assert.strictEqual(ent0.canvasHeight, 240);
                    assert.strictEqual(registry.ready(ent0.index), true);
                    assert.strictEqual(registry.visible(ent0.index), true);
                });
            });
            describe('setAltImage', () => {
                it('should set given element as alternative image', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const ent0 = { name: 'hello' };
                    registry.register(ent0);
                    registry.setImage(ent0.index, { image: 'main-image' });
                    registry.setAltImage(ent0.index, 'alt-image');

                    assert.strictEqual(ent0.element, 'alt-image');
                });
                it('should restore main image if null is given', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const ent0 = { name: 'hello' };
                    registry.register(ent0);
                    registry.setImage(ent0.index, { image: 'main-image' });
                    registry.setAltImage(ent0.index, 'alt-image');
                    registry.setAltImage(ent0.index, null);

                    assert.strictEqual(ent0.element, 'main-image');
                });
            });
            describe('setError', () => {
                it('should set flag on image with error', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const ent0 = { name: 'hello' };
                    registry.register(ent0);
                    registry.setError(ent0.index, 'error!');

                    assert.strictEqual(ent0.loading, false);
                    assert.strictEqual(ent0.error, 'error!');
                    assert.strictEqual(registry.ready(ent0.index), false);
                    assert.strictEqual(registry.visible(ent0.index), false);
                });
            });
            describe('update', () => {
                it('should make active image list', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const ent0 = { name: 'hello' };
                    const ent1 = { name: 'world' };
                    registry.register(ent0);
                    registry.register(ent1);
                    registry.setImage(ent1.index, {});
                    registry.update();

                    assert.strictEqual(registry.getImages().length, 1);
                    assert.strictEqual(registry.getImages()[0], ent1);
                });
            });
            describe('removeEntry', () => {
                it('should deactivate an active image', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const ent0 = { name: 'hello' };
                    registry.register(ent0);
                    registry.setImage(ent0.index, {});
                    registry.update();

                    assert.strictEqual(registry.getImages().length, 1);
                    registry.removeEntry(ent0.index);
                    registry.update();

                    assert.strictEqual(registry.getImages().length, 0);
                    assert.strictEqual(ent0.element, null);
                    assert.strictEqual(ent0.asCanvas, null);
                    assert.strictEqual(registry.visible(ent0.index), false);
                });
                it('should call onDidRemoveEntry callback', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const log = [];
                    registry.setOnDidRemoveEntry(() => { log.push('called'); });
                    const ent0 = { name: 'hello' };
                    registry.register(ent0);
                    registry.setImage(ent0.index, {});
                    registry.removeEntry(ent0.index);
                    assert.deepStrictEqual(log, ['called']);
                });
                it('should clear cache properties', () => {
                    const registry = compareUI.ViewModel().Registry();
                    registry.addCacheProperty('cacheData');
                    const ent = registry.register({ name: 'hello' });
                    registry.setImage(ent.index, {});
                    ent.cacheData = 'some-data';
                    registry.removeEntry(ent.index);

                    assert.strictEqual(ent.cacheData, null);
                });
            });
            describe('empty', () => {
                it('should return true if there are no active images', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const ent0 = { name: 'hello' };
                    const ent1 = { name: 'world' };
                    registry.register(ent0);
                    registry.register(ent1);

                    registry.setImage(ent1.index, {});
                    registry.update();
                    assert.strictEqual(registry.empty(), false);

                    registry.removeEntry(ent1.index);
                    registry.update();
                    assert.strictEqual(registry.empty(), true);
                });
            });
            describe('numberFromIndex', () => {
                it('should lookup display number for an image', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const ent0 = { name: 'hello' };
                    const ent1 = { name: 'world' };
                    const ent2 = { name: 'bye' };
                    registry.register(ent0);
                    registry.register(ent1);
                    registry.register(ent2);
                    registry.setImage(ent0.index, {}); // No.1
                    registry.setImage(ent2.index, {}); // No.2
                    registry.update();

                    assert.strictEqual(registry.numberFromIndex(0), 1);
                    assert.strictEqual(registry.numberFromIndex(1), null);
                    assert.strictEqual(registry.numberFromIndex(2), 2);

                    assert.strictEqual(registry.numberFromIndex(3), null);
                    assert.strictEqual(registry.numberFromIndex(-1), null);
                });
            });
            describe('indexFromNumber', () => {
                it('should lookup image index by display number', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const ent0 = { name: 'hello' };
                    const ent1 = { name: 'world' };
                    const ent2 = { name: 'bye' };
                    registry.register(ent0);
                    registry.register(ent1);
                    registry.register(ent2);
                    registry.setImage(ent0.index, {}); // No.1
                    registry.setImage(ent2.index, {}); // No.2
                    registry.update();

                    assert.strictEqual(registry.indexFromNumber(1), 0);
                    assert.strictEqual(registry.indexFromNumber(2), 2);

                    assert.strictEqual(registry.indexFromNumber(0), null);
                    assert.strictEqual(registry.indexFromNumber(3), null);
                    assert.strictEqual(registry.indexFromNumber(-1), null);
                });
            });
            describe('addCacheProperty', () => {
                it('should add new name to cache property list', () => {
                    const registry = compareUI.ViewModel().Registry();
                    registry.addCacheProperty('myCache');
                    const ent = registry.register({});
                    registry.setImage(ent.index, {});
                    ent.myCache = 'my-data';
                    registry.removeEntry(ent.index);

                    assert.strictEqual(ent.myCache, null);
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

    describe('CrossCursorModel', () => {
        describe('isEnabled', () => {
            it('should have initial value false', () => {
                const model = compareUI.CrossCursorModel();
                assert.strictEqual(model.isEnabled(), false);
            });
        });
        describe('enable', () => {
            it('should enable cross cursor', () => {
                const model = compareUI.CrossCursorModel();
                model.enable(5);
                assert.strictEqual(model.isEnabled(), true);
            });
            it('should initialize primary index', () => {
                const model = compareUI.CrossCursorModel();
                model.enable(5);
                assert.strictEqual(model.primaryIndex(), 5);
            });
        });
        describe('disable', () => {
            it('should disable cross cursor', () => {
                const model = compareUI.CrossCursorModel();
                model.enable();
                model.disable();
                assert.strictEqual(model.isEnabled(), false);
            });
            it('should reset primary index to null', () => {
                const model = compareUI.CrossCursorModel();
                model.enable();
                model.disable();
                assert.strictEqual(model.primaryIndex(), null);
            });
        });
        describe('primaryIndex', () => {
            it('should have initial value null', () => {
                const model = compareUI.CrossCursorModel();
                assert.strictEqual(model.primaryIndex(), null);
            });
        });
        describe('changeIndex', () => {
            it('should modify primary index', () => {
                const model = compareUI.CrossCursorModel();
                model.enable(5);
                model.changeIndex(3);
                assert.strictEqual(model.primaryIndex(), 3);
            });
        });
    });
});
