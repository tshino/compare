'use strict';
const assert = require('assert');
const fsPromises = require('fs/promises');
const CompareUtil = require('../modules/compare-util.js');

const jsTestUtil = {
    dataURIFromArrayBuffer: function(ab) {
        const str = Array.from(ab).map(u8 => String.fromCharCode(u8)).join('');
        return 'data:application/octet-stream;base64,' + btoa(str);
    }
};

describe('CompareUtil', () => {
    const window = {
        navigator: {
            userAgent: 'ua'
        }
    };
    const compareUtil = CompareUtil(window);
    const detectImageFormat = function(content) {
        const datauri = jsTestUtil.dataURIFromArrayBuffer(content);
        const binary = compareUtil.binaryFromDataURI(datauri);
        const format = compareUtil.detectImageFormat(binary);
        return format;
    };
    const imageFormatDetectionTest = async function(samples) {
        console.log('... testing ' + samples.length + ' image files');
        for (const sample of samples) {
            const path = sample[0];
            const fileFormat = sample[1];
            const colorFormat = sample[2];
            const content = await fsPromises.readFile('test/' + path);
            const format = detectImageFormat(content);
            assert.strictEqual(format.toString(), fileFormat, 'detected file format of ' + path);
            assert.strictEqual(format.color, colorFormat, 'detected color format of ' + path);
        }
    };
    const grayscalePerfectSamples = [
        [ 'data/grayscale/perfect/grayscale_idx8.bmp', 'BMP', 'Indexed RGB 8.8.8 (8bpp)' ],
        [ 'data/grayscale/perfect/grayscale_idx8.gif', 'GIF', 'Indexed RGB 8.8.8 (8bpp)' ],
        [ 'data/grayscale/perfect/grayscale_idx8.png', 'PNG', 'Indexed RGB 8.8.8 (8bpp)' ],
        [ 'data/grayscale/perfect/grayscale_idx8.tif', 'TIFF', 'Indexed RGB 16.16.16 (8bpp)' ],
        [ 'data/grayscale/perfect/grayscale_y8.jpg', 'JPEG', 'Grayscale 8 (8bpp)' ],
        [ 'data/grayscale/perfect/grayscale_y8.png', 'PNG', 'Grayscale 8 (8bpp)' ],
        [ 'data/grayscale/perfect/grayscale_y8.tif', 'TIFF', 'Grayscale 8 (8bpp)' ],
        [ 'data/grayscale/perfect/grayscale_y16.png', 'PNG', 'Grayscale 16 (16bpp)' ],
        [ 'data/grayscale/perfect/grayscale_y16.tif', 'TIFF', 'Grayscale 16 (16bpp)' ],
        [ 'data/grayscale/perfect/grayscale_ya88.png', 'PNG', 'Grayscale+Alpha 8.8 (16bpp)' ],
        [ 'data/grayscale/perfect/grayscale_ya88.tif', 'TIFF', 'Grayscale+Alpha 8.8 (16bpp)' ],
        [ 'data/grayscale/perfect/grayscale_ya88_pma.tif', 'TIFF', 'Grayscale+Alpha (pre-multiplied) 8.8 (16bpp)' ],
        [ 'data/grayscale/perfect/grayscale_rgb888.bmp', 'BMP', 'RGB 8.8.8 (24bpp)' ],
        [ 'data/grayscale/perfect/grayscale_rgb888.png', 'PNG', 'RGB 8.8.8 (24bpp)' ],
        [ 'data/grayscale/perfect/grayscale_rgb888.tif', 'TIFF', 'RGB 8.8.8 (24bpp)' ],
        [ 'data/grayscale/perfect/grayscale_rgb888.webp', 'WebP (Lossless)', 'RGB 8.8.8 (24bpp)' ],
        [ 'data/grayscale/perfect/grayscale_rgb161616.png', 'PNG', 'RGB 16.16.16 (48bpp)' ],
        [ 'data/grayscale/perfect/grayscale_rgb161616.tif', 'TIFF', 'RGB 16.16.16 (48bpp)' ],
        [ 'data/grayscale/perfect/grayscale_rgbx8888.bmp', 'BMP', 'RGB 8.8.8 (32bpp)' ],
        [ 'data/grayscale/perfect/grayscale_rgba8888.bmp', 'BMP', 'RGBA 8.8.8.8 (32bpp)' ],
        [ 'data/grayscale/perfect/grayscale_rgba8888.png', 'PNG', 'RGBA 8.8.8.8 (32bpp)' ],
        [ 'data/grayscale/perfect/grayscale_rgba8888.tif', 'TIFF', 'RGBA 8.8.8.8 (32bpp)' ],
        [ 'data/grayscale/perfect/grayscale_rgba8888_pma.tif', 'TIFF', 'RGBA (pre-multiplied) 8.8.8.8 (32bpp)' ],
        [ 'data/grayscale/perfect/grayscale_rgba16161616.png', 'PNG', 'RGBA 16.16.16.16 (64bpp)' ],
        [ 'data/grayscale/perfect/grayscale_rgba16161616.tif', 'TIFF', 'RGBA 16.16.16.16 (64bpp)' ],
        [ 'data/grayscale/perfect/grayscale_rgba16161616_pma.tif', 'TIFF', 'RGBA (pre-multiplied) 16.16.16.16 (64bpp)' ],
        [ 'data/grayscale/perfect/grayscale_ycbcr888.jpg', 'JPEG', 'YCbCr 8.8.8 (24bpp 4:4:4)' ],
        [ 'data/grayscale/perfect/grayscale_ycbcr888_440.jpg', 'JPEG', 'YCbCr 8.8.8 (16bpp 4:4:0)' ],
        [ 'data/grayscale/perfect/grayscale_ycbcr888_422.jpg', 'JPEG', 'YCbCr 8.8.8 (16bpp 4:2:2)' ],
        [ 'data/grayscale/perfect/grayscale_ycbcr888_420.jpg', 'JPEG', 'YCbCr 8.8.8 (12bpp 4:2:0)' ],
    ];
    const grayscaleReducedSamples = [
        [ 'data/grayscale/reduced/grayscale_idx1.bmp', 'BMP', 'Indexed RGB 8.8.8 (1bpp)' ],
        [ 'data/grayscale/reduced/grayscale_idx1.gif', 'GIF', 'Indexed RGB 8.8.8 (1bpp)' ],
        [ 'data/grayscale/reduced/grayscale_idx1.png', 'PNG', 'Indexed RGB 8.8.8 (1bpp)' ],
        [ 'data/grayscale/reduced/grayscale_idx1.tif', 'TIFF', 'Indexed RGB 16.16.16 (1bpp)' ],
        [ 'data/grayscale/reduced/grayscale_idx2.gif', 'GIF', 'Indexed RGB 8.8.8 (2bpp)' ],
        [ 'data/grayscale/reduced/grayscale_idx2.png', 'PNG', 'Indexed RGB 8.8.8 (2bpp)' ],
        [ 'data/grayscale/reduced/grayscale_idx2.tif', 'TIFF', 'Indexed RGB 16.16.16 (2bpp)' ],
        [ 'data/grayscale/reduced/grayscale_idx3.gif', 'GIF', 'Indexed RGB 8.8.8 (3bpp)' ],
        [ 'data/grayscale/reduced/grayscale_idx4.bmp', 'BMP', 'Indexed RGB 8.8.8 (4bpp)' ],
        [ 'data/grayscale/reduced/grayscale_idx4.gif', 'GIF', 'Indexed RGB 8.8.8 (4bpp)' ],
        [ 'data/grayscale/reduced/grayscale_idx4.png', 'PNG', 'Indexed RGB 8.8.8 (4bpp)' ],
        [ 'data/grayscale/reduced/grayscale_idx4.tif', 'TIFF', 'Indexed RGB 16.16.16 (4bpp)' ],
        [ 'data/grayscale/reduced/grayscale_idx5.gif', 'GIF', 'Indexed RGB 8.8.8 (5bpp)' ],
        [ 'data/grayscale/reduced/grayscale_idx6.gif', 'GIF', 'Indexed RGB 8.8.8 (6bpp)' ],
        [ 'data/grayscale/reduced/grayscale_idx7.gif', 'GIF', 'Indexed RGB 8.8.8 (7bpp)' ],
        [ 'data/grayscale/reduced/grayscale_y1.png', 'PNG', 'Grayscale 1 (1bpp)' ],
        [ 'data/grayscale/reduced/grayscale_y1.tif', 'TIFF', 'Grayscale 1 (1bpp)' ],
        [ 'data/grayscale/reduced/grayscale_y2.png', 'PNG', 'Grayscale 2 (2bpp)' ],
        [ 'data/grayscale/reduced/grayscale_y2.tif', 'TIFF', 'Grayscale 2 (2bpp)' ],
        [ 'data/grayscale/reduced/grayscale_y4.png', 'PNG', 'Grayscale 4 (4bpp)' ],
        [ 'data/grayscale/reduced/grayscale_y4.tif', 'TIFF', 'Grayscale 4 (4bpp)' ],
        [ 'data/grayscale/reduced/grayscale_rgb555.bmp', 'BMP', 'RGB 5.5.5 (16bpp)' ],
        [ 'data/grayscale/reduced/grayscale_rgba5551.bmp', 'BMP', 'RGBA 5.5.5.1 (16bpp)' ],
        [ 'data/grayscale/reduced/grayscale_ycbcr888.webp', 'WebP (Lossy)', 'YCbCr 8.8.8 (12bpp 4:2:0)' ],
    ];
    const fullcolorPerfectSamples = [
        [ 'data/fullcolor/perfect/fullcolor_rgb888.bmp', 'BMP', 'RGB 8.8.8 (24bpp)' ],
        [ 'data/fullcolor/perfect/fullcolor_rgb888.png', 'PNG', 'RGB 8.8.8 (24bpp)' ],
        [ 'data/fullcolor/perfect/fullcolor_rgb888.tif', 'TIFF', 'RGB 8.8.8 (24bpp)' ],
        [ 'data/fullcolor/perfect/fullcolor_rgb888.webp', 'WebP (Lossless)', 'RGB 8.8.8 (24bpp)' ],
        [ 'data/fullcolor/perfect/fullcolor_rgb161616.png', 'PNG', 'RGB 16.16.16 (48bpp)' ],
        [ 'data/fullcolor/perfect/fullcolor_rgb161616.tif', 'TIFF', 'RGB 16.16.16 (48bpp)' ],
        [ 'data/fullcolor/perfect/fullcolor_rgbx8888.bmp', 'BMP', 'RGB 8.8.8 (32bpp)' ],
        [ 'data/fullcolor/perfect/fullcolor_rgba8888.bmp', 'BMP', 'RGBA 8.8.8.8 (32bpp)' ],
        [ 'data/fullcolor/perfect/fullcolor_rgba8888.png', 'PNG', 'RGBA 8.8.8.8 (32bpp)' ],
        [ 'data/fullcolor/perfect/fullcolor_rgba8888.tif', 'TIFF', 'RGBA 8.8.8.8 (32bpp)' ],
        [ 'data/fullcolor/perfect/fullcolor_rgba8888_pma.tif', 'TIFF', 'RGBA (pre-multiplied) 8.8.8.8 (32bpp)' ],
        [ 'data/fullcolor/perfect/fullcolor_rgba16161616.png', 'PNG', 'RGBA 16.16.16.16 (64bpp)' ],
        [ 'data/fullcolor/perfect/fullcolor_rgba16161616.tif', 'TIFF', 'RGBA 16.16.16.16 (64bpp)' ],
        [ 'data/fullcolor/perfect/fullcolor_rgba16161616_pma.tif', 'TIFF', 'RGBA (pre-multiplied) 16.16.16.16 (64bpp)' ],
    ];
    const fullcolorReducedSamples = [
        [ 'data/fullcolor/reduced/fullcolor_idx1.bmp', 'BMP', 'Indexed RGB 8.8.8 (1bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx1.gif', 'GIF', 'Indexed RGB 8.8.8 (1bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx1.png', 'PNG', 'Indexed RGB 8.8.8 (1bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx1.tif', 'TIFF', 'Indexed RGB 16.16.16 (1bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx2.gif', 'GIF', 'Indexed RGB 8.8.8 (2bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx2.png', 'PNG', 'Indexed RGB 8.8.8 (2bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx2.tif', 'TIFF', 'Indexed RGB 16.16.16 (2bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx3.gif', 'GIF', 'Indexed RGB 8.8.8 (3bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx4.bmp', 'BMP', 'Indexed RGB 8.8.8 (4bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx4.gif', 'GIF', 'Indexed RGB 8.8.8 (4bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx4.png', 'PNG', 'Indexed RGB 8.8.8 (4bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx4.tif', 'TIFF', 'Indexed RGB 16.16.16 (4bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx5.gif', 'GIF', 'Indexed RGB 8.8.8 (5bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx6.gif', 'GIF', 'Indexed RGB 8.8.8 (6bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx7.gif', 'GIF', 'Indexed RGB 8.8.8 (7bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx8.bmp', 'BMP', 'Indexed RGB 8.8.8 (8bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx8.gif', 'GIF', 'Indexed RGB 8.8.8 (8bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx8.png', 'PNG', 'Indexed RGB 8.8.8 (8bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_idx8.tif', 'TIFF', 'Indexed RGB 16.16.16 (8bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_rgb555.bmp', 'BMP', 'RGB 5.5.5 (16bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_rgb565.bmp', 'BMP', 'RGB 5.6.5 (16bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_rgba5551.bmp', 'BMP', 'RGBA 5.5.5.1 (16bpp)' ],
        [ 'data/fullcolor/reduced/fullcolor_ycbcr888.jpg', 'JPEG', 'YCbCr 8.8.8 (24bpp 4:4:4)' ],
        [ 'data/fullcolor/reduced/fullcolor_ycbcr888.webp', 'WebP (Lossy)', 'YCbCr 8.8.8 (12bpp 4:2:0)' ],
    ];
    describe('detectImageFormat (grayscale-perfect)', () => {
        it('should recognize file formats and color formats', async () => {
            await imageFormatDetectionTest(grayscalePerfectSamples);
        });
    });
    describe('detectImageFormat (grayscale-reduced)', () => {
        it('should recognize file formats and color formats', async () => {
            await imageFormatDetectionTest(grayscaleReducedSamples);
        });
    });
    describe('detectImageFormat (fullcolor-perfect)', () => {
        it('should recognize file formats and color formats', async () => {
            await imageFormatDetectionTest(fullcolorPerfectSamples);
        });
    });
    describe('detectImageFormat (fullcolor-reduced)', () => {
        it('should recognize file formats and color formats', async () => {
            await imageFormatDetectionTest(fullcolorReducedSamples);
        });
    });
});
