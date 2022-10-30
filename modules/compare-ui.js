'use strict';
const CompareUI = function({ compareUtil }) {
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
        ColorHUD
    };
};
