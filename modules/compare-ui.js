'use strict';
const CompareUI = function({ compareUtil }) {
    const Hud = function({ viewManagement, viewZoom, crossCursor }) {
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
    const ColorHUD = function ({ crossCursor, hud }) {
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
    return {
        Hud,
        ColorHUD
    };
};
