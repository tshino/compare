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
                it('should call onAddImage callback', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const log = [];
                    registry.addOnAddImage((img) => { log.push(`called ${img.name}`); });
                    const ent0 = { name: 'hello' };
                    registry.register(ent0);
                    registry.setImage(ent0.index, {});
                    assert.deepStrictEqual(log, ['called hello']);
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
                it('should call onRemoveEntry callback', () => {
                    const registry = compareUI.ViewModel().Registry();
                    const log = [];
                    registry.addOnRemoveEntry(() => { log.push('called'); });
                    const ent0 = { name: 'hello' };
                    registry.register(ent0);
                    registry.setImage(ent0.index, {});
                    registry.removeEntry(ent0.index);
                    assert.deepStrictEqual(log, ['called']);
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
            describe('findImageIndexOtherThan', () => {
                it('should find valid image index other than specified one', () => {
                    const registry = compareUI.ViewModel().Registry();
                    registry.register({ name: 'hello' });
                    registry.register({ name: 'world' });
                    registry.register({ name: 'bye' });
                    registry.setImage(0, {});
                    registry.setImage(2, {});
                    registry.update();

                    assert.strictEqual(registry.findImageIndexOtherThan(0), 2);
                    assert.strictEqual(registry.findImageIndexOtherThan(2), 0);
                    assert.strictEqual(registry.findImageIndexOtherThan(1), 0);
                });
                it('should return null if no valid image found other than specified one', () => {
                    const registry = compareUI.ViewModel().Registry();
                    registry.register({ name: 'hello' });
                    registry.setImage(0, {});
                    registry.update();

                    assert.strictEqual(registry.findImageIndexOtherThan(0), null);
                });
                it('should return null if no image', () => {
                    const registry = compareUI.ViewModel().Registry();
                    registry.update();

                    assert.strictEqual(registry.findImageIndexOtherThan(0), null);
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

        describe('events', () => {
            it('should provide listener registry for onUpdateViewDOM event', () => {
                const model = compareUI.ViewModel();
                const log = [];
                const l1 = () => { log.push('l1'); };
                model.events.addOnUpdateViewDOM(l1);
                model.events.notifyUpdateViewDOM();
                assert.deepStrictEqual(log, ['l1']);
            });
            it('should provide listener registry for onUpdateLayout event', () => {
                const model = compareUI.ViewModel();
                const log = [];
                const l1 = () => { log.push('l1'); };
                model.events.addOnUpdateLayout(l1);
                model.events.notifyUpdateLayout();
                assert.deepStrictEqual(log, ['l1']);
            });
            it('should provide listener registry for onUpdateImageBox event', () => {
                const model = compareUI.ViewModel();
                const log = [];
                const l1 = (img, w, h) => { log.push(`l1 ${img.index} ${w}x${h}`); };
                model.events.addOnUpdateImageBox(l1);
                model.events.notifyUpdateImageBox({index:5}, 1000, 800);
                assert.deepStrictEqual(log, ['l1 5 1000x800']);
            });
            it('should provide listener registry for onUpdateTransform event', () => {
                const model = compareUI.ViewModel();
                const log = [];
                const l1 = () => { log.push(`l1`); };
                model.events.addOnUpdateTransform(l1);
                model.events.notifyUpdateTransform();
                assert.deepStrictEqual(log, ['l1']);
            });
            it('should provide listener registry for onUpdateEntryTransform event', () => {
                const model = compareUI.ViewModel();
                const log = [];
                const l1 = (ent, style) => { log.push(`l1 ${ent.index} ${JSON.stringify(style)}`); };
                model.events.addOnUpdateEntryTransform(l1);
                model.events.notifyUpdateEntryTransform({index:5}, {style:'style'});
                assert.deepStrictEqual(log, ['l1 5 {"style":"style"}']);
            });
        });
    });

    const ViewMock = function(logs = []) {
        const entries = [
            { index: 0, width: 640, height: 480, calcROI: () =>[0,0,640,480] }
        ];
        return {
            viewZoom: { scale: 1, getCenter: () => ({ x: 0, y: 0 }) },
            addOnAddImage: () => {},
            addOnRemoveEntry: () => {},
            getCurrentIndexOr: () => 0,
            getFrontIndex: () => 0,
            getEntry: (index) => entries[index],
            getImages: () => entries,
            updateLayout: () => logs.push('view.updateLayout'),
        };
    };
    const ModelMock = function() {
        return {
            events: {
                addOnUpdateLayout: () => {},
                addOnUpdateImageBox: () => {},
                addOnUpdateEntryTransform: () => {},
                addOnUpdateTransform: () => {}
            }
        };
    };

    describe('CrossCursorState', () => {
        describe('isEnabled', () => {
            it('should have initial value false', () => {
                const state = compareUI.CrossCursorState();
                assert.strictEqual(state.isEnabled(), false);
            });
        });
        describe('enable', () => {
            it('should enable cross cursor', () => {
                const state = compareUI.CrossCursorState();
                state.enable(5);
                assert.strictEqual(state.isEnabled(), true);
            });
            it('should initialize primary index', () => {
                const state = compareUI.CrossCursorState();
                state.enable(5);
                assert.strictEqual(state.primaryIndex(), 5);
            });
        });
        describe('disable', () => {
            it('should disable cross cursor', () => {
                const state = compareUI.CrossCursorState();
                state.enable();
                state.disable();
                assert.strictEqual(state.isEnabled(), false);
            });
            it('should reset primary index to null', () => {
                const state = compareUI.CrossCursorState();
                state.enable();
                state.disable();
                assert.strictEqual(state.primaryIndex(), null);
            });
        });
        describe('primaryIndex', () => {
            it('should have initial value null', () => {
                const state = compareUI.CrossCursorState();
                assert.strictEqual(state.primaryIndex(), null);
            });
        });
        describe('changeIndex', () => {
            it('should modify primary index', () => {
                const state = compareUI.CrossCursorState();
                state.enable(5);
                state.changeIndex(3);
                assert.strictEqual(state.primaryIndex(), 3);
            });
        });
        describe('fixed', () => {
            it('should have initial value false', () => {
                const state = compareUI.CrossCursorState();
                assert.strictEqual(state.fixed(), false);
            });
            it('should be false when enabled', () => {
                const state = compareUI.CrossCursorState();
                state.setFixed(true);
                state.enable(5);
                assert.strictEqual(state.fixed(), false);
            });
        });
        describe('setFixed', () => {
            it('should turn on/off fixed mode', () => {
                const state = compareUI.CrossCursorState();
                state.setFixed(true);
                assert.strictEqual(state.fixed(), true);
                state.setFixed(false);
                assert.strictEqual(state.fixed(), false);
            });
        });
        describe('position', () => {
            it('should have default value undefined', () => {
                const state = compareUI.CrossCursorState();
                assert.strictEqual(state.position(0), undefined);
            });
            it('should use primaryIndex if index is not specified', () => {
                const state = compareUI.CrossCursorState();
                state.enable(2);
                state.setPosition(2, { x: 2, y: 2 });
                state.setPosition(3, { x: 3, y: 3 });
                assert.deepStrictEqual(state.position(), { x: 2, y: 2 });
            });
        });
        describe('setPosition', () => {
            it('should set position information of specified index', () => {
                const state = compareUI.CrossCursorState();
                state.setPosition(3, { x: 1, y: 1 });
                state.setPosition(4, { x: 2, y: 2 });
                assert.deepStrictEqual(state.position(3), { x: 1, y: 1 });
                assert.deepStrictEqual(state.position(4), { x: 2, y: 2 });
            });
        });
        describe('addObserver', () => {
            it('should add a set of callbacks', () => {
                const state = compareUI.CrossCursorState();
                const log = [];
                state.addObserver(
                    () => { log.push('onShow'); },
                    (moved) => { log.push(`onUpdate(${moved})`); },
                    () => { log.push(`onRemove`); }
                );
                state.enable(5);
                assert.deepStrictEqual(log, ['onShow']);
                state.notifyUpdate(true);
                assert.deepStrictEqual(log, ['onShow', 'onUpdate(true)']);
                state.disable();
                assert.deepStrictEqual(log, ['onShow', 'onUpdate(true)', 'onRemove']);
            });
        });
    });

    describe('CrossCursor', () => {
        const CrossCursorViewMock = () => ({
            update: () => {},
            updateImageBoxSize: () => {},
            updateTransform: () => {},
            remove: () => {}
        });
        it('should construct successfully', () => {
            const view = ViewMock();
            const model = ModelMock();
            const crossCursor = compareUI.CrossCursor({ view, model });
            assert.ok( crossCursor );
        });
        const createWithMocks = function(logs) {
            const view = ViewMock(logs), model = ModelMock(), crossCursorView = CrossCursorViewMock();
            const crossCursor = compareUI.CrossCursor({ view, model, crossCursorView });
            crossCursor.addObserver(
                () => { logs.push('add'); },
                () => { logs.push('update'); },
                () => { logs.push('remove'); }
            );
            return crossCursor;
        };
        describe('enable', () => {
            it('should activate cross cursor', () => {
                const logs = [], crossCursor = createWithMocks(logs);
                crossCursor.enable();
                assert.strictEqual(crossCursor.isEnabled(), true);
                const pos = crossCursor.getPosition(0);
                assert.strictEqual(pos.x, 320);
                assert.strictEqual(pos.y, 240);
                const npos = crossCursor.getNormalizedPosition();
                assert.strictEqual(npos.x, 320.5/640);
                assert.strictEqual(npos.y, 240.5/480);
                assert.strictEqual(crossCursor.getIndex(), 0);
                assert.deepStrictEqual(logs, [
                    'add', 'update', 'view.updateLayout'
                ]);
            });
        });
        describe('disable', () => {
            it('should deactivate cross cursor', () => {
                const logs = [], crossCursor = createWithMocks(logs);
                crossCursor.enable();
                crossCursor.disable();
                assert.strictEqual(crossCursor.isEnabled(), false);
                assert.deepStrictEqual(logs, [
                    'add', 'update', 'view.updateLayout', 'remove', 'view.updateLayout'
                ]);
            });
        });
        describe('toggle', () => {
            it('should toggle cross cursor', () => {
                const logs = [], crossCursor = createWithMocks(logs);
                crossCursor.toggle();
                crossCursor.toggle();
                assert.strictEqual(crossCursor.isEnabled(), false);
                assert.deepStrictEqual(logs, [
                    'add', 'update', 'view.updateLayout', 'remove', 'view.updateLayout'
                ]);
            });
        });
        describe('processKeyDown', () => {
            it('should move cross cursor', () => {
                const logs = [], crossCursor = createWithMocks(logs);
                crossCursor.enable();
                crossCursor.processKeyDown({ keyCode: 37 });
                const pos = crossCursor.getPosition(0);
                assert.strictEqual(pos.x, 319);
                assert.strictEqual(pos.y, 240);
                assert.deepStrictEqual(logs, [
                    'add', 'update', 'view.updateLayout', 'update'
                ]);
            });
        });
    });
    describe('Hud', () => {
        it('should construct successfully', () => {
            const view = ViewMock();
            const model = ModelMock();
            const crossCursor = compareUI.CrossCursor({ view, model });
            const hud = compareUI.Hud({ view, model, crossCursor });
            assert.ok( hud );
        });
    });
    describe('ColorHUD', () => {
        it('should construct successfully', () => {
            const view = ViewMock();
            const model = ModelMock();
            const crossCursor = compareUI.CrossCursor({ view, model });
            const hud = compareUI.Hud({ view, model, crossCursor });
            const colorHUD = compareUI.ColorHUD({ view, crossCursor, hud });
            assert.ok( colorHUD );
        });
    });
    describe('RoiMap', () => {
        it('should construct successfully', () => {
            const view = ViewMock();
            const model = ModelMock();
            const roiMap = compareUI.RoiMap({ view, model });
            assert.ok( roiMap );
        });
    });
});
