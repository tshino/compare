'use strict';
const CompareUI = function({ compareUtil }) {
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

    const Hud = function({ viewManagement, crossCursor }) {
        const viewZoom = viewManagement.viewZoom;
        const hudPlacement = { right: true, bottom: true };
        let onUpdateLayoutCallback = null;
        const initialize = function () {
            $('#view').on('mousedown', 'div.hudContainer', function (e) {
                e.stopPropagation();
            });
            viewManagement.addOnUpdateImageBox(onUpdateImageBox);
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
            for (const img of viewManagement.getImages()) {
                img.view.find('div.hudContainer').css(style);
            }
        };
        const adjustPlacement = function () {
            const index = crossCursor.getIndex();
            const pos = crossCursor.getPosition(index);
            const entry = viewManagement.getEntry(index);
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

    const ColorHUD = function ({ viewManagement, crossCursor, hud }) {
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
                const images = viewManagement.getImages();
                for (let i = 0, img; img = images[i]; i++) {
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

    const RoiMap = function ({ viewManagement }) {
        const viewZoom = viewManagement.viewZoom;
        let enableMap = false;
        const toggle = function () {
            if (!enableMap) {
                if (0 < viewManagement.getImages().length) {
                    enableMap = true;
                    viewManagement.updateLayout();
                }
            } else {
                enableMap = false;
                viewManagement.updateLayout();
            }
        };
        const onUpdateLayout = function () {
            const images = viewManagement.getImages();
            $('#map').css({ display: (enableMap && images.length) ? 'block' : '' });
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
                const images = viewManagement.getImages();
                if (0 < images.length) {
                    const index = viewManagement.getCurrentIndexOr(0);
                    const entry = viewManagement.getEntry(index);
                    const img = entry.ready() ? entry : images[0];
                    updateMap(img);
                }
            }
        };
        viewManagement.addOnUpdateLayout(onUpdateLayout);
        viewManagement.addOnUpdateTransform(onUpdateTransform);
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
        setDragStateClass,
        Hud,
        ColorHUD,
        RoiMap,
        DialogUtil
    };
};
