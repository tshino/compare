'use strict';
const CompareUI = function({ compareUtil }) {
    const ViewModel = function () {
        const Registry = function () {
            const entries = [];
            let images = [];
            const cacheProperties = [];
            const onAddImageListeners = [];
            const onRemoveEntryListeners = [];
            let onDidRemoveEntry = null;

            const register = function (ent) {
                ent.index = entries.length;
                ent.element = null;
                ent.asCanvas = null;
                ent.canvasWidth = 0;
                ent.canvasHeight = 0;
                ent.loading = true;
                ent.error = null;
                ent._visible = true;
                ent.ready = function() { return null !== this.element; }
                entries.push(ent);
                return ent;
            };
            const ready = function(index) {
                const ent = entries[index];
                return (ent && ent.ready()) || false;
            };
            const visible = function(index) {
                const ent = entries[index];
                return (ent && ent._visible) || false;
            };
            const numVisibleEntries = function() {
                return entries.filter(ent => ent._visible).length;
            };
            const setImage = function(index, { image, canvas, width, height }) {
                const ent = entries[index];
                ent.loading = false;
                ent._mainImage = image;
                ent.asCanvas = canvas;
                ent.canvasWidth = width;
                ent.canvasHeight = height;
                ent.element = image;
                for (const listener of onAddImageListeners) {
                    listener(ent);
                }
            };
            const setAltImage = function(index, image) {
                const ent = entries[index];
                ent.element = image || ent._mainImage;
            };
            const setError = function(index, message) {
                const ent = entries[index];
                ent.error = message;
                ent.loading = false;
                ent._visible = false;
            };
            const update = function () {
                images = entries.filter(function (ent, i, a) { return ent.ready(); });
            };
            const removeEntry = function (index) {
                const ent = entries[index];
                if (ent && !ent.loading && ent._visible) {
                    for (const listeners of onRemoveEntryListeners) {
                        listeners(index);
                    }
                    for (const propName of cacheProperties) {
                        ent[propName] = null;
                    }
                    ent._visible = false;
                    ent._mainImage = null;
                    ent.element = null;
                    ent.asCanvas = null;
                    if (onDidRemoveEntry) {
                        onDidRemoveEntry();
                    }
                }
            };
            const numberFromIndex = function (index) {
                for (let i = 0, img; img = images[i]; i++) {
                    if (img.index === index) {
                        return i + 1;
                    }
                }
                return null;
            };
            const indexFromNumber = function (number) {
                if (1 <= number && number <= images.length) {
                    return images[number - 1].index;
                }
                return null;
            };
            const findImageIndexOtherThan = function(index) {
                for (const img of images) {
                    if (img.index !== index) {
                        return img.index;
                    }
                }
                return null;
            };
            const addCacheProperty = function (propName) {
                cacheProperties.push(propName);
            };
            const addOnAddImage = function(listener) {
                onAddImageListeners.push(listener);
            };
            const addOnRemoveEntry = function (listener) {
                onRemoveEntryListeners.push(listener);
            };
            const setOnDidRemoveEntry = function (listener) {
                onDidRemoveEntry = listener;
            };

            return {
                register,
                ready,
                visible,
                numVisibleEntries,
                setImage,
                setAltImage,
                setError,
                update,
                removeEntry,
                entries: () => entries,
                getEntry: (index) => { return entries[index]; },
                empty: () => { return images.length === 0; },
                getImages: () => { return images; },
                getFrontIndex: () => { return 0 < images.length ? images[0].index : null; },
                numberFromIndex,
                indexFromNumber,
                findImageIndexOtherThan,
                addCacheProperty,
                addOnAddImage,
                addOnRemoveEntry,
                setOnDidRemoveEntry
            };
        };

        const singleViewMode = (function() {
            let currentIndex = null;
            let lastIndex = null;

            const start = function (index) {
                currentIndex = index;
                lastIndex = index;
            };
            const stop = function () {
                currentIndex = null;
            };
            return {
                start,
                stop,
                current: () => currentIndex,
                last: () => lastIndex,
                isActive: () => currentIndex !== null
            };
        })();

        const overlayMode = (function() {
            let overlayMode = false;
            let baseIndex = null;

            const start = function (index) {
                overlayMode = true;
                baseIndex = index;
            };
            const stop = function () {
                overlayMode = false;
            };
            return {
                start,
                stop,
                isActive: () => overlayMode,
                base: () => baseIndex
            };
        })();

        const layoutDirection = (function() {
            let mode = null;

            const alternate = function() {
                mode = mode === 'x' ? 'y' : 'x';
            };
            const determineByAspect = function(width, height) {
                mode = width < height ? 'y' : 'x';
            };
            return {
                current: () => mode,
                reset: () => { mode = null; },
                alternate,
                determineByAspect
            };
        })();

        const Events = function() {
            const onUpdateViewDOMListeners = [];
            const onUpdateLayoutListeners = [];
            const onUpdateImageBoxListeners = [];
            const onUpdateTransformListeners = [];
            const onUpdateEntryTransformListeners = [];

            const addOnUpdateViewDOM = function(listener) {
                onUpdateViewDOMListeners.push(listener);
            };
            const addOnUpdateLayout = function(listener) {
                onUpdateLayoutListeners.push(listener);
            };
            const addOnUpdateImageBox = function(listener) {
                onUpdateImageBoxListeners.push(listener);
            };
            const addOnUpdateTransform = function(listener) {
                onUpdateTransformListeners.push(listener);
            };
            const addOnUpdateEntryTransform = function(listener) {
                onUpdateEntryTransformListeners.push(listener);
            };
            const notifyUpdateViewDOM = function() {
                for (const listener of onUpdateViewDOMListeners) {
                    listener();
                }
            };
            const notifyUpdateLayout = function() {
                for (const listener of onUpdateLayoutListeners) {
                    listener();
                }
            };
            const notifyUpdateImageBox = function(img, w, h) {
                for (const listener of onUpdateImageBoxListeners) {
                    listener(img, w, h);
                }
            };
            const notifyUpdateTransform = function() {
                for (const listener of onUpdateTransformListeners) {
                    listener();
                }
            };
            const notifyUpdateEntryTransform = function(img, style) {
                for (const listener of onUpdateEntryTransformListeners) {
                    listener(img, style);
                }
            };

            return {
                addOnUpdateViewDOM,
                addOnUpdateLayout,
                addOnUpdateImageBox,
                addOnUpdateTransform,
                addOnUpdateEntryTransform,
                notifyUpdateViewDOM,
                notifyUpdateLayout,
                notifyUpdateImageBox,
                notifyUpdateTransform,
                notifyUpdateEntryTransform,
            };
        };

        return {
            Registry,
            singleViewMode,
            overlayMode,
            layoutDirection,
            events: Events()
        };
    };

    const setDragStateClass = function(target, dragging, horizontal) {
        if (dragging) {
            $(target).addClass('dragging');
        } else {
            $(target).removeClass('dragging');
        }
        if (horizontal) {
            $(target).addClass('horizontal-dragging');
        } else {
            $(target).removeClass('horizontal-dragging');
        }
    };

    const TextUtil = function ({ document, changeLang }) {
        const toggleLang = function () {
            const lang = $(document.body).attr('class') === 'ja' ? 'en' : 'ja';
            $('#selectLang').val(lang);
            changeLang(lang);
        };
        const setText = function (target, text) {
            for (const lang of ['en', 'ja']) {
                let e = target.find('.' + lang);
                if (0 === e.length) {
                    e = $('<span>').addClass(lang);
                    target.append(e);
                }
                e.text(text[lang]);
            }
            return target;
        };
        return {
            toggleLang,
            setText
        };
    };

    const Grid = function ({ view, viewUtil, model }) {
        let enableGrid = false;
        let mainGridInterval = 100;
        let auxGridInterval = 10;
        let onChangeCallback = null;
        const toggle = function () {
            enableGrid = !enableGrid;
            enableGrid ? $('#gridbtn').addClass('current') : $('#gridbtn').removeClass('current');
            view.updateLayout();
            if (onChangeCallback) {
                onChangeCallback();
            }
        };
        const setInterval = function (main, aux) {
            if (mainGridInterval !== main || auxGridInterval !== aux) {
                mainGridInterval = main;
                auxGridInterval = aux;
                for (const img of view.getImages()) {
                    if (img.grid) {
                        $(img.grid).remove();
                        img.grid = null;
                    }
                }
                view.updateLayout();
                if (onChangeCallback) {
                    onChangeCallback();
                }
            }
        };
        const setOnChange = function (onchange) {
            onChangeCallback = onchange;
        };
        const makePathDesc = function (size, step, skip) {
            let desc = '';
            for (let k = step; k < size.w; k += step) {
                if (skip && (k % skip) === 0) continue;
                desc += 'M ' + k + ',0 l 0,' + size.h + ' ';
            }
            for (let k = step; k < size.h; k += step) {
                if (skip && (k % skip) === 0) continue;
                desc += 'M 0,' + k + ' l ' + size.w + ',0 ';
            }
            return desc;
        };
        const makeGrid = function (w, h, color) {
            const size = { w, h };
            const vbox = '0 0 ' + w + ' ' + h;
            color = color || 'white';
            const mainGrid = makePathDesc(size, mainGridInterval);
            const auxGrid = makePathDesc(size, auxGridInterval, mainGridInterval);
            return $(
                '<svg class="imageOverlay grid" viewBox="' + vbox + '">' +
                '<path stroke="' + color + '" fill="none" stroke-width="0.5" opacity="0.6" d="' + mainGrid + '"></path>' +
                '<path stroke="' + color + '" fill="none" stroke-width="0.5" opacity="0.6" d="' + auxGrid + '"></path>' +
                '</svg>'
            ).width(w).height(h);
        };
        const onUpdateLayoutImpl = viewUtil.makeImageOverlayOnUpdateLayout('grid', makeGrid);
        const onUpdateImageBox = function (img, w, h) {
            onUpdateLayoutImpl(enableGrid, img, w, h);
        };
        const updateGridStyle = function (grid, width, baseWidth, scale, commonStyle) {
            const base = 0.5 * width / (baseWidth * scale);
            const strokeWidth = [
                (base > 0.5 ? 1 : base > 0.1 ? 3.5 - base * 5 : 3) * base,
                (base > 0.5 ? 0 : 1) * base];
            const opacity = [
                0.6,
                base > 0.5 ? 0 : base > 0.1 ? (0.6 - base) / 0.5 : 1];
            $(grid).css(commonStyle || {}).find('path').each(function (index) {
                $(this).
                    attr('stroke-width', strokeWidth[index]).
                    attr('opacity', opacity[index]);
            });
        };
        const onUpdateEntryTransform = function (img, commonStyle) {
            if (img.grid) {
                updateGridStyle(img.grid, img.width, img.baseWidth, view.viewZoom.scale, commonStyle);
            }
        };
        model.events.addOnUpdateImageBox(onUpdateImageBox);
        model.events.addOnUpdateEntryTransform(onUpdateEntryTransform);
        return {
            toggle,
            isEnabled: function () { return enableGrid; },
            setInterval,
            setOnChange,
            makeGrid,
            updateGridStyle
        };
    };

    const CrossCursorState = function() {
        let enableCrossCursor = false;
        let primaryIndex = null;
        let fixedPosition = false;
        const positions = [];
        const onShowCallback = [];
        const onUpdateCallback = [];
        const onRemoveCallback = [];

        const enable = function(index) {
            enableCrossCursor = true;
            primaryIndex = index;
            fixedPosition = false;
            onShowCallback.forEach(function (val) { val(); });
        };
        const disable = function() {
            enableCrossCursor = false;
            primaryIndex = null;
            onRemoveCallback.forEach(function (val) { val(); });
        };
        const changeIndex = function(index) {
            primaryIndex = index;
        };
        const setFixed = function(fixed) {
            fixedPosition = fixed;
        };
        const setPosition = function(index, pos) {
            positions[index] = pos;
        };
        const position = function(index) {
            index = index !== undefined ? index : primaryIndex;
            return positions[index];
        };
        const setIsInView = function(index, isInView) {
            if (!positions[index]) {
                positions[index] = { x: 0, y: 0 };
            }
            positions[index].isInView = isInView;
        };
        const addObserver = function (onShow, onUpdate, onRemove) {
            if (onShow) {
                onShowCallback.push(onShow);
            }
            if (onUpdate) {
                onUpdateCallback.push(onUpdate);
            }
            if (onRemove) {
                onRemoveCallback.push(onRemove);
            }
        };
        const notifyUpdate = function(pointChanged) {
            onUpdateCallback.forEach(
                function (val) { val(pointChanged); }
            );
        };

        return {
            enable,
            disable,
            isEnabled: function () { return enableCrossCursor; },
            changeIndex,
            primaryIndex: function () { return primaryIndex; },
            setFixed,
            fixed: function() { return fixedPosition; },
            setPosition,
            position,
            setIsInView,
            addObserver,
            notifyUpdate,
        };
    };

    const CrossCursorView = function() {
        const makePathDesc = function (img, x, y) {
            const pos = img.interpretXY(x, y);
            let desc = '';
            desc += 'M ' + pos.x + ',0 l 0,' + img.canvasHeight + ' ';
            desc += 'M ' + (pos.x + 1) + ',0 l 0,' + img.canvasHeight + ' ';
            desc += 'M 0,' + pos.y + ' l ' + img.canvasWidth + ',0 ';
            desc += 'M 0,' + (pos.y + 1) + ' l ' + img.canvasWidth + ',0 ';
            return desc;
        };
        const makeLabelAttrOnTransform = function (ent, roi, x, y, viewScale) {
            const baseScale = ent.width / (ent.baseWidth * viewScale);
            const sx = ent.flippedX ? -1 : 1;
            const sy = ent.flippedY ? -1 : 1;
            const pos = ent.interpretXY2(x, y);
            const base = ent.interpretXY2(0, 0);
            base.x += sx * (ent.transposed ? roi[1] : roi[0]);
            base.y += sy * (ent.transposed ? roi[0] : roi[1]);
            const t0 = 'translate(' + pos.x + ' ' + base.y + ') ';
            const t1 = 'translate(' + base.x + ' ' + pos.y + ') ';
            const s = 'scale(' + baseScale * sx + ' ' + baseScale * sy + ')';
            const m = ent.transposed ? ' matrix(0 1 1 0 0 0)' : '';
            const a0 = { transform: t0 + s + m }, a1 = { transform: t1 + s + m };
            return ent.transposed ? [a1, a0] : [a0, a1];
        };
        const makeLabelAttr = function (img, roi, x, y, viewScale) {
            const attr = makeLabelAttrOnTransform(img, roi, x, y, viewScale);
            attr[0]['text-anchor'] = img.width * 0.9 < x ? 'end' : '';
            if (compareUtil.browserName === 'msie' || compareUtil.browserName === 'edge') {
                attr[0]['dy'] = '40%';
                attr[1]['dy'] = img.height * 0.9 < y ? '0%' : '40%';
            } else {
                attr[0]['dominant-baseline'] = 'hanging';
                attr[1]['dominant-baseline'] = img.height * 0.9 < y ? 'alphabetic' : 'hanging';
            }
            return attr;
        };
        const addCrossCursor = function (img, desc) {
            const size = { w: img.canvasWidth, h: img.canvasHeight };
            const vbox = '0 0 ' + size.w + ' ' + size.h;
            const filter_id = 'drop-shadow' + img.index;
            const textElem = '<text filter="url(#' + filter_id + ')"></text>';
            img._cursor = $(
                '<svg class="imageOverlay cursor" viewBox="' + vbox + '" style="overflow:visible">' +
                '<defs><filter id="' + filter_id + '">' +
                '<feGaussianBlur in="SourceAlpha" result="shadow" stdDeviation="1.5"></feGaussianBlur>' +
                '<feBlend in="SourceGraphic" in2="shadow" mode="normal"></feBlend>' +
                '</filter></defs>' +
                '<path stroke="black" fill="none" stroke-width="0.2" opacity="0.1" d="' + desc + '"></path>' +
                '<path stroke="white" fill="none" stroke-width="0.1" opacity="0.6" d="' + desc + '"></path>' +
                '<g class="labels" font-size="16" fill="white">' +
                textElem + textElem + '</g>' +
                '</svg>').
                width(size.w).
                height(size.h);
            img.view.append(img._cursor);
        };
        const update = function (img, pos, fixed, viewScale, viewCenter) {
            const roi = img.calcROI(viewScale, viewCenter);
            const desc = makePathDesc(img, pos.x, pos.y);
            const labelsAttr = makeLabelAttr(img, roi, pos.x, pos.y, viewScale);
            if (0 === img.view.find('.cursor').length) {
                addCrossCursor(img, desc);
            } else {
                img._cursor.find('path').attr('d', desc);
            }
            img._cursor.find('path').attr('stroke-dasharray', fixed ? 'none' : '4,1');
            img._cursor.find('g.labels text').each(function (i) {
                $(this).attr(labelsAttr[i]).text(i === 0 ? pos.x : pos.y);
            });
        };
        const updateImageBoxSize = function(img, w, h) {
            $(img._cursor).css({ width: w + 'px', height: h + 'px' });
        };
        const updateTransform = function(img, commonStyle, pos, viewScale, viewCenter) {
            if (img._cursor) {
                const baseScale = img.width / (img.baseWidth * viewScale);
                $(img._cursor).css(commonStyle).find('path').each(function (i) {
                    $(this).attr('stroke-width', baseScale * [2, 1][i]);
                });
                const roi = img.calcROI(viewScale, viewCenter);
                const attr = makeLabelAttrOnTransform(img, roi, pos.x, pos.y, viewScale);
                $(img._cursor).find('g.labels text').each(function (i) {
                    $(this).attr(attr[i]);
                });
            }
        };
        const remove = function (img) {
            if (img._cursor) {
                $(img._cursor).remove();
                img._cursor = null;
            }
        };

        return {
            update,
            updateImageBoxSize,
            updateTransform,
            remove,
        };
    };

    const CrossCursor = function ({ view, model, crossCursorView = CrossCursorView() }) {
        const viewZoom = view.viewZoom;
        const state = CrossCursorState();

        const makePosition = function (index) {
            const refIndex = state.primaryIndex();
            const ref = state.position(refIndex);
            if (ref) {
                const refImg = view.getEntry(refIndex);
                const rx = (Math.floor(ref.x) + 0.5) / refImg.width;
                const ry = (Math.floor(ref.y) + 0.5) / refImg.height;
                const img = view.getEntry(index);
                const x = compareUtil.clamp(Math.floor(rx * img.width), 0, img.width - 1);
                const y = compareUtil.clamp(Math.floor(ry * img.height), 0, img.height - 1);
                return { x, y };
            } else {
                const img = view.getEntry(index);
                const center = viewZoom.getCenter();
                const x = (0.5 + center.x) * img.width;
                const y = (0.5 + center.y) * img.height;
                return { x, y };
            }
        };
        const enable = function () {
            const index = view.getCurrentIndexOr(view.getFrontIndex());
            if (!state.isEnabled() && index !== null) {
                state.enable(index);
                const pos = makePosition(index);
                setPosition(index, pos.x, pos.y);
                view.updateLayout();
            }
            return state.isEnabled();
        };
        const disable = function () {
            if (state.isEnabled()) {
                state.disable();
                view.updateLayout();
            }
        };
        const toggle = function () {
            if (!state.isEnabled()) {
                enable();
            } else {
                disable();
            }
        };
        const getNormalizedPosition = function () {
            const primaryIndex = state.primaryIndex();
            const entry = view.getEntry(primaryIndex);
            const pos = state.position(primaryIndex);
            return {
                x: (0.5 + pos.x) / entry.width,
                y: (0.5 + pos.y) / entry.height,
                isInView: pos.isInView
            };
        };
        const isInsideROI = function (roi, x, y) {
            return (
                roi[0] <= x && x <= roi[2] &&
                roi[1] <= y && y <= roi[3]
            );
        };
        const updateIsInView = function(img) {
            const pos = state.position(img.index);
            const roi = img.calcROI(viewZoom.scale, viewZoom.getCenter());
            const isInView = isInsideROI(roi, pos.x, pos.y);
            state.setIsInView(img.index, isInView);
        };
        const onAddImage = function(img) {
            if (state.isEnabled()) {
                const pos = makePosition(img.index);
                state.setPosition(img.index, pos);
            }
        };
        const onRemoveEntry = function (index) {
            if (state.isEnabled() && state.primaryIndex() === index) {
                const newIndex = view.findImageIndexOtherThan(index);
                if (newIndex !== null) {
                    state.changeIndex(newIndex);
                } else {
                    state.disable();
                }
            }
        };
        const updateCrossCursor = function (img) {
            const pos = state.position(img.index);
            const fixed = state.fixed();
            const viewScale = viewZoom.scale;
            const viewCenter = viewZoom.getCenter();
            crossCursorView.update(img, pos, fixed, viewScale, viewCenter);
        };
        const setPosition = function (index, x, y) {
            const ent = view.getEntry(index);
            const rx = (Math.floor(x) + 0.5) / ent.width;
            const ry = (Math.floor(y) + 0.5) / ent.height;
            state.changeIndex(index);
            for (const img of view.getImages()) {
                const ix = compareUtil.clamp(Math.floor(rx * img.width), 0, img.width - 1);
                const iy = compareUtil.clamp(Math.floor(ry * img.height), 0, img.height - 1);
                state.setPosition(img.index, { x: ix, y: iy });
                updateIsInView(img);
                updateCrossCursor(img);
            }
            state.notifyUpdate(true);
        };
        const adjustViewOffsetToFollowCrossCursor = function (dx, dy, x, y) {
            const img = view.getEntry(state.primaryIndex());
            const center = viewZoom.getCenter();
            const rx = (x - (0.5 + center.x) * img.width) / (img.width / viewZoom.scale);
            const ry = (y - (0.5 + center.y) * img.height) / (img.height / viewZoom.scale);
            if (0.45 < Math.abs(rx) && 0 < dx * rx) {
                const delta = Math.max(0.25, Math.abs(rx) - 0.45);
                viewZoom.moveRelative(0 < rx ? delta : -delta, 0);
            }
            if (0.45 < Math.abs(ry) && 0 < dy * ry) {
                const delta = Math.max(0.25, Math.abs(ry) - 0.45);
                viewZoom.moveRelative(0, 0 < ry ? delta : -delta);
            }
        };
        const processKeyDown = function (e) {
            if (e.ctrlKey || e.altKey || e.metaKey) {
                return true;
            }
            if (state.isEnabled()) {
                // cursor key
                if (37 <= e.keyCode && e.keyCode <= 40) {
                    let index = view.getCurrentIndexOr(state.primaryIndex());
                    if (index < 0 || !state.position(index)) {
                        index = state.primaryIndex();
                    }
                    const step = e.shiftKey ? 10 : 1;
                    const pos = state.position(index);
                    const d = compareUtil.cursorKeyCodeToXY(e.keyCode, step);
                    const x = pos.x + d.x;
                    const y = pos.y + d.y;
                    setPosition(index, x, y);
                    adjustViewOffsetToFollowCrossCursor(d.x, d.y, x, y);
                    return false;
                }
            }
        };
        const processClick = function (e) {
            const pos = state.position(e.index);
            const ent = view.getEntry(e.index);
            const x = compareUtil.clamp(Math.floor(e.x * ent.width), 0, ent.width - 1);
            const y = compareUtil.clamp(Math.floor(e.y * ent.height), 0, ent.height - 1);
            if (pos && pos.x === x && pos.y === y) {
                state.setFixed(!state.fixed());
            } else {
                state.setFixed(true);
            }
            setPosition(e.index, x, y);
        };
        const processMouseMove = function (e, selector, target) {
            if (state.isEnabled() && !state.fixed()) {
                const index = selector ? $(selector).index($(target).parent()) : null;
                const pos = viewZoom.positionFromMouseEvent(e, target, index);
                if (view.ready(index) && pos) {
                    const ent = view.getEntry(index);
                    const x = pos.x * ent.width;
                    const y = pos.y * ent.height;
                    setPosition(index, x, y);
                }
            }
        };
        const onUpdateImageBox = function (img, w, h) {
            if (state.isEnabled() && img.element) {
                updateCrossCursor(img);
                crossCursorView.updateImageBoxSize(img, w, h);
            } else {
                crossCursorView.remove(img);
            }
        };
        const onUpdateEntryTransform = function (img, commonStyle) {
            if (state.isEnabled()) {
                updateIsInView(img);
                const pos = state.position(img.index);
                const viewScale = viewZoom.scale;
                const viewCenter = viewZoom.getCenter();
                crossCursorView.updateTransform(img, commonStyle, pos, viewScale, viewCenter);
            }
        };
        const onUpdateTransform = function () {
            if (state.isEnabled()) {
                state.notifyUpdate(false);
            }
        };
        view.addOnAddImage(onAddImage);
        view.addOnRemoveEntry(onRemoveEntry);
        model.events.addOnUpdateImageBox(onUpdateImageBox);
        model.events.addOnUpdateEntryTransform(onUpdateEntryTransform);
        model.events.addOnUpdateTransform(onUpdateTransform);

        return {
            addObserver: state.addObserver,
            enable,
            disable,
            toggle,
            isEnabled: state.isEnabled,
            getPosition: state.position,
            getIndex: state.primaryIndex,
            getNormalizedPosition,
            processKeyDown,
            processClick,
            processMouseMove
        };
    };

    const Hud = function({ view, model, crossCursor }) {
        const viewZoom = view.viewZoom;
        const hudPlacement = { right: true, bottom: true };
        let onUpdateLayoutCallback = null;
        const initialize = function () {
            $('#view').on('mousedown', 'div.hudContainer', function (e) {
                e.stopPropagation();
            });
            model.events.addOnUpdateImageBox(onUpdateImageBox);
        };
        const setObserver = function (onUpdateLayout) {
            onUpdateLayoutCallback = onUpdateLayout;
        };
        const adjustHUDPlacementToAvoidPoint = function (position) {
            const center = viewZoom.getCenter();
            const relative = {
                x: (position.x - (center.x + 0.5)) * viewZoom.scale,
                y: (position.y - (center.y + 0.5)) * viewZoom.scale
            };
            hudPlacement.right = relative.x < (hudPlacement.right ? 0.3 : -0.3);
            hudPlacement.bottom = relative.y < (hudPlacement.bottom ? 0.4 : -0.4);
            const style = {};
            style['right'] = hudPlacement.right ? '0px' : 'auto';
            style['bottom'] = hudPlacement.bottom ? '0px' : 'auto';
            for (const img of view.getImages()) {
                img.view.find('div.hudContainer').css(style);
            }
        };
        const adjustPlacement = function () {
            const index = crossCursor.getIndex();
            const pos = crossCursor.getPosition(index);
            const entry = view.getEntry(index);
            adjustHUDPlacementToAvoidPoint({
                x: pos.x / entry.width,
                y: pos.y / entry.height
            });
        };
        const append = function (img, hud) {
            if (img && img.view) {
                let container = img.view.find('div.hudContainer');
                if (0 === container.length) {
                    container = $('<div class="hudContainer">');
                    img.view.append(container);
                }
                container.append(hud);
            }
        };
        const onUpdateImageBox = function (img, _w, _h) {
            if (onUpdateLayoutCallback) {
                onUpdateLayoutCallback(img);
            }
        };
        return {
            initialize,
            setObserver,
            adjustPlacement,
            append
        };
    };

    const ColorHUD = function ({ view, crossCursor, hud }) {
        const updateColorHUD = function (img) {
            if (!img.colorHUD) {
                return;
            }
            const cursor = crossCursor.getPosition(img.index);
            const x = cursor.x, y = cursor.y;
            const pos = img.interpretXY(x, y);
            if (pos.x < 0 || pos.y < 0 || pos.x >= img.canvasWidth || pos.y >= img.canvasHeight) {
                img.colorHUD.find('.colorXY span, .colorCSS, .colorRGB span').text('');
                img.colorHUD.find('.colorSample, .colorBar').hide();
            } else {
                const context = img.asCanvas.getContext('2d');
                const imageData = context.getImageData(pos.x, pos.y, 1, 1);
                const rgb = imageData.data;
                const css = compareUtil.toHexTriplet(rgb[0], rgb[1], rgb[2]);
                img.colorHUD.find('.colorSample').show().attr('fill', css);
                img.colorHUD.find('.colorBar').show().find('rect').each(function (index) {
                    $(this).attr('width', (rgb[index] * 127.5 / 255));
                });
                img.colorHUD.find('.colorCSS').text(css);
                img.colorHUD.find('.colorRGB span').each(function (i) {
                    $(this).text(rgb[i]);
                });
                img.colorHUD.find('.colorXY span').each(function (i) {
                    $(this).text([x, y][i]);
                });
            }
        };
        const showHUD = function () {
            $('#pickerbtn').addClass('current');
        };
        const updateHUD = function (pointChanged) {
            if (pointChanged) {
                for (const img of view.getImages()) {
                    updateColorHUD(img);
                }
            }
            hud.adjustPlacement();
        };
        const removeHUD = function () {
            $('#pickerbtn').removeClass('current');
        };
        const addColorHUD = function (img) {
            img.colorHUD = $(
                '<div class="dark hud" style="pointer-events: auto; min-width: 180px">' +
                    '<span style="display: inline-block; font-size: 12px">' +
                        '<svg width="142.5" height="15" viewBox="0 0 142.5 15">' +
                            '<rect x="0" y="0" width="142.5" height="15" fill="#000"></rect>' +
                            '<rect class="colorSample" x="0" y="0" width="15" height="15" fill="#000"></rect>' +
                            '<g class="colorBar">' +
                                '<rect x="15" y="0" width="0" height="5" fill="#f00"></rect>' +
                                '<rect x="15" y="5" width="0" height="5" fill="#0f0"></rect>' +
                                '<rect x="15" y="10" width="0" height="5" fill="#00f"></rect>' +
                            '</g>' +
                        '</svg>' +
                        '<br>' +
                        '<span class="colorCSS"></span>' +
                        ' <span class="colorRGB">(<span></span>,<span></span>,<span></span>)</span>' +
                        '<br>' +
                        '<span class="colorXY">XY: <span></span>,<span></span></span>' +
                    '</span>' +
                    '<button class="close">×</button>' +
                '</div>'
            );
            img.colorHUD.find('button.close').click(crossCursor.disable);
            img.colorHUD.on('touchstart touchmove touchend', function (e) { e.stopPropagation(); });
            hud.append(img, img.colorHUD);
            img.colorHUD.show();
            updateColorHUD(img);
        };
        const onUpdateLayout = function (img) {
            if (crossCursor.isEnabled()) {
                if (!img.colorHUD) {
                    addColorHUD(img);
                }
            } else if (img.colorHUD) {
                img.colorHUD.remove();
                img.colorHUD = null;
            }
        };
        const initialize = function () {
            crossCursor.addObserver(showHUD, updateHUD, removeHUD);
            hud.setObserver(onUpdateLayout);
        };
        return {
            initialize
        };
    };

    const RoiMap = function ({ view, model }) {
        const viewZoom = view.viewZoom;
        let enableMap = false;
        const toggle = function () {
            if (!enableMap) {
                if (!view.empty()) {
                    enableMap = true;
                    view.updateLayout();
                }
            } else {
                enableMap = false;
                view.updateLayout();
            }
        };
        const onUpdateLayout = function () {
            $('#map').css({ display: (enableMap && !view.empty()) ? 'block' : '' });
        };
        const updateMap = function (img) {
            const roi = img.calcNormalizedROI(viewZoom.scale, viewZoom.getCenter());
            $('#mapROI').attr({
                x: 100 * roi[0] + '%',
                y: 100 * roi[1] + '%',
                width: 100 * (roi[2] - roi[0]) + '%',
                height: 100 * (roi[3] - roi[1]) + '%'
            });
            const s = 120 / Math.max(img.width, img.height);
            const w = img.width * s;
            const h = img.height * s;
            $('#map svg').width(w).height(h);
            $('#map').width(w).height(h);
        };
        const onUpdateTransform = function () {
            if (enableMap) {
                if (!view.empty()) {
                    const index = view.getCurrentIndexOr(0);
                    const img = view.getEntry(
                        view.ready(index) ? index : view.getFrontIndex()
                    );
                    updateMap(img);
                }
            }
        };
        model.events.addOnUpdateLayout(onUpdateLayout);
        model.events.addOnUpdateTransform(onUpdateTransform);
        return {
            toggle
        };
    };

    const DialogUtil = function () {
        let dialog = null;
        const onShow = [], onHide = [];
        const current = function () {
            return dialog;
        };
        const figureZoom = compareUtil.makeZoomController(function (_zoom) {
            if (dialog && dialog.update) {
                dialog.update(true /* transformOnly */);
            }
        }, {
            cursorMoveDelta: 0.125
        });
        const addObserver = function (show, hide) {
            if (show) {
                onShow.push(show);
            }
            if (hide) {
                onHide.push(hide);
            }
        };
        const hideDialog = function () {
            if (dialog) {
                if (dialog.onclose) {
                    dialog.onclose();
                }
                dialog.element.hide();
                dialog = null;
                figureZoom.disable();
                onHide.forEach(function (val) { val(); });
            }
        };
        const showDialog = function (target, parent, update, onclose, initialFocus) {
            dialog = {
                element: target,
                close: parent || hideDialog,
                update: update,
                onclose: onclose
            };
            target.css({ display: 'block' });
            initialFocus = initialFocus || target.children().find('.dummyFocusTarget');
            initialFocus.focus();
            onShow.forEach(function (val) { val(); });
        };
        const initFigureZoom = function (options) {
            if (options.enableZoom) {
                figureZoom.enable({
                    zoomXOnly: options.zoomXOnly !== undefined ? options.zoomXOnly : false,
                    getBaseSize: options.getBaseSize
                });
                figureZoom.setZoom(0);
                const initX = options.zoomInitX !== undefined ? options.zoomInitX : 0.5;
                const initY = options.zoomInitY !== undefined ? options.zoomInitY : 0.5;
                figureZoom.setOffset(initX, initY);
            } else {
                figureZoom.disable();
            }
        };
        const adjustDialogPosition = function () {
            if (dialog) {
                const target = dialog.element, dlg = dialog.element.children();
                const offset = dlg.offset();
                const border = 10;
                const left = compareUtil.clamp(offset.left, 0, target.width() - dlg.width() - border);
                const top = compareUtil.clamp(offset.top, 0, target.height() - dlg.height() - border);
                if (left !== offset.left || top !== offset.top) {
                    dlg.offset({ left, top });
                }
            }
        };
        const enableMouse = function (target) {
            const dlg = target.children();
            let draggingPoint = null;
            const moveDialog = function (dx, dy) {
                const offset = dlg.offset();
                dlg.offset({ left: offset.left + dx, top: offset.top + dy });
            };
            const header = $(target).find('.header');
            target.on('mousedown', '.header', function (e) {
                if (e.which === 1 && !$(e.target).is('a, select')) {
                    draggingPoint = { x: e.clientX, y: e.clientY };
                    setDragStateClass(header, true, false);
                    return false;
                }
            }).on('mousemove', function (e) {
                if (draggingPoint) {
                    if (e.buttons !== 1) {
                        draggingPoint = null;
                        setDragStateClass(header, false, false);
                        return;
                    }
                    const dx = e.clientX - draggingPoint.x;
                    const dy = e.clientY - draggingPoint.y;
                    draggingPoint = { x: e.clientX, y: e.clientY };
                    moveDialog(dx, dy);
                    return false;
                }
            }).on('mouseup', function (e) {
                if (draggingPoint) {
                    draggingPoint = null;
                    setDragStateClass(header, false, false);
                }
            });
        };
        const initDialog = function (target, parent) {
            target.on('click', parent || hideDialog);
            target.children().on('click', function (e) { e.stopPropagation(); return true; });
            enableMouse(target);
            target.children().prepend($('<div class="dummyFocusTarget" tabindex="-1">').
                css({ display: 'inline', margin: '0px', padding: '0px', border: '0px' }));
        };
        const defineDialog = function (target, update, parent, options) {
            options = options !== undefined ? options : {};
            initDialog(target, parent);
            return function () {
                if (dialog && target.is(':visible')) {
                    hideDialog();
                } else {
                    hideDialog();
                    initFigureZoom(options);
                    if (options.onOpen) {
                        options.onOpen();
                    }
                    if (update) {
                        update();
                    }
                    showDialog(target, parent, update, options.onClose, options.initialFocus);
                    target.children().css({ position: '', left: '', top: '' });
                }
            };
        };
        return {
            current,
            figureZoom,
            addObserver,
            hideDialog,
            adjustDialogPosition,
            defineDialog
        };
    };

    return {
        ViewModel,
        setDragStateClass,
        TextUtil,
        Grid,
        CrossCursorState,
        CrossCursor,
        Hud,
        ColorHUD,
        RoiMap,
        DialogUtil
    };
};

if (typeof module !== 'undefined') {
    module.exports = CompareUI;
}
