# Change Log

All notable changes to this application Compare.html will be documented in this file.

### [v3.0] - 2024-09-01

A lot of new features and improvements.

New Feature
- Channel View [#27](https://github.com/tshino/compare/issues/27), [#29](https://github.com/tshino/compare/issues/29), [#31](https://github.com/tshino/compare/issues/31), [#86](https://github.com/tshino/compare/issues/86)
- Color format detection [#32](https://github.com/tshino/compare/issues/32), [#33](https://github.com/tshino/compare/issues/33)
- Optical Flow [#36](https://github.com/tshino/compare/issues/36)
- Web cam support [#41](https://github.com/tshino/compare/issues/41)
- Settings Dialog [#47](https://github.com/tshino/compare/issues/47)
    - Pixelated rendering option [#38](https://github.com/tshino/compare/issues/38)
    - Background color config [#45](https://github.com/tshino/compare/issues/45)
    - Grid interval config [#48](https://github.com/tshino/compare/issues/48)
- 3D Waveform [#81](https://github.com/tshino/compare/issues/81)
- WebP format detection [#84](https://github.com/tshino/compare/issues/84)
- and more.

Enhancement / Improvement
- Image Diff:
    - Fixed a bug on zooming on Image Diff. [#26](https://github.com/tshino/compare/issues/26)
    - Made the diff image larger. [#28](https://github.com/tshino/compare/issues/28)
    - Visualization of absolute differences [#76](https://github.com/tshino/compare/issues/76)
    - Visualization of absolute difference using grayscale [#88](https://github.com/tshino/compare/issues/88)
- Unit testing:
    - Introduced unit testing. [#34](https://github.com/tshino/compare/issues/34), [#35](https://github.com/tshino/compare/issues/35)
    - Migrated unit tests from handcrafted framework to Mocha [#110](https://github.com/tshino/compare/issues/110)
        - Removed old tests that use a hand-crafted test framework. [#136](https://github.com/tshino/compare/pull/136)
    - Coverage reporting [#115](https://github.com/tshino/compare/pull/115)
- Use minus sign rather than hyphen for negative numbers. [#39](https://github.com/tshino/compare/issues/39)
- Histogram:
    - 3-Row Histogram [#89](https://github.com/tshino/compare/issues/89)
    - YCbCr Histogram [#90](https://github.com/tshino/compare/issues/90)
    - Numerical info on mouse over on histogram [#96](https://github.com/tshino/compare/issues/96)
- Waveform:
    - 3-Column Waveform [#87](https://github.com/tshino/compare/issues/87)
    - YCbCr Waveform [#91](https://github.com/tshino/compare/issues/91)
- Added grid overlay to figures like Histogram. [#40](https://github.com/tshino/compare/issues/40)
- Vectorscope:
    - Coloring option of Vectorscope. [#50](https://github.com/tshino/compare/issues/50)
    - Enlarge a bit of x-y chromaticity diagram of Vectorscope [#106](https://github.com/tshino/compare/issues/106)
- Renumbering images when an image removed. [#52](https://github.com/tshino/compare/issues/52)
- 3D Color Distribution:
    - Coloring option button of 3D Color Distribution. [#54](https://github.com/tshino/compare/issues/54)
    - Color space option for 3D Color Distribution [#66](https://github.com/tshino/compare/issues/66)
    - Improve visibility of axes on 3D Color Distribution [#104](https://github.com/tshino/compare/issues/104)
    - Enlarge a bit of CIE xyY 3D Color Distribution diagram [#108](https://github.com/tshino/compare/issues/108)
- Image Information:
    - Graphical icon for Exif orientation. [#55](https://github.com/tshino/compare/issues/55)
    - Fixed TIFF color format detection failure [#85](https://github.com/tshino/compare/issues/85)
    - Number of animation frames for GIF,APNG,WebP [#97](https://github.com/tshino/compare/issues/97)
- Grid lines on figures. [#56](https://github.com/tshino/compare/issues/56)
- Orientation support on figures/calculations:
    - Image Diff [#57](https://github.com/tshino/compare/issues/57)
    - Optical Flow [#58](https://github.com/tshino/compare/issues/58)
    - Image Quality Metrics [#59](https://github.com/tshino/compare/issues/59)
    - Tone Curve Estimation [#60](https://github.com/tshino/compare/issues/60)
- Image Quality Metrics:
    - Clarify how to treat alpha channels in Image Quality Metrics [#61](https://github.com/tshino/compare/issues/61)
    - MAE, SAD and SSD [#62](https://github.com/tshino/compare/issues/62)
    - Fixed error handling issue on quality metrics for images of different sizes [#63](https://github.com/tshino/compare/issues/63)
    - Grayscale mode for Image Quality Metrics [#65](https://github.com/tshino/compare/issues/65)
    - Explanation for value absence of Image Quality Metrics [#94](https://github.com/tshino/compare/issues/94)
- Fixed incorrect response of number key on dialogs [#64](https://github.com/tshino/compare/issues/64)
- Fixed allocation failure ignored [#68](https://github.com/tshino/compare/issues/68)
- Fixed unexpected page zoom by pinch-out on touch pad [#71](https://github.com/tshino/compare/issues/71)
- Show X,Y coordinate beside cross cursor [#72](https://github.com/tshino/compare/issues/72)
- Next/previous button [#74](https://github.com/tshino/compare/issues/74)
- Apply 'pixelated' to figures [#79](https://github.com/tshino/compare/issues/79)
- Linear RGB mode for:
    - 3D Color Distribution [#78](https://github.com/tshino/compare/issues/78)
    - Vectorscope [#80](https://github.com/tshino/compare/issues/80)
    - Waveform [#83](https://github.com/tshino/compare/issues/83)
- BT.709 option on everywhere luminance or YCbCr is used [#82](https://github.com/tshino/compare/issues/82)
- Side by side comparison of Tone Curve Estimation [#93](https://github.com/tshino/compare/issues/93)
- Improve visibility of start point of each line of Optical Flow [#98](https://github.com/tshino/compare/issues/98)
- Fixed: double application of Exif orientation [#105](https://github.com/tshino/compare/issues/105)
- CI
    - Unit test on GitHub Actions [#112](https://github.com/tshino/compare/issues/112)
    - Setup Dependabot version updates [#113](https://github.com/tshino/compare/issues/113)
    - ESLint on GitHub Actions [#114](https://github.com/tshino/compare/issues/114)
- Fixed an issue on Firefox [#159](https://github.com/tshino/compare/issues/159)
- and more.


### [v2.0] - 2017-10-09

New Feature
- [#1](https://github.com/tshino/compare/issues/1) Color Value Picker (displays RGB value of clicked point)
- [#20](https://github.com/tshino/compare/issues/20) 3D Color Distribution (displays RGB color space in 3D)
  ![colordist3](https://user-images.githubusercontent.com/732920/31325439-23000954-acf8-11e7-930e-7f0d0c6b108a.png)
- [#19](https://github.com/tshino/compare/issues/19) Tone Curve Estimation (compares brightness of two images)
  ![tonecurve3](https://user-images.githubusercontent.com/732920/31325490-b713b80c-acf8-11e7-9dea-a471340d565a.png)

Enhancement / Improvement
- [#15](https://github.com/tshino/compare/issues/15) Flip single picture view by TAB key
- [#13](https://github.com/tshino/compare/issues/13) Add offset option to Image Diff
- [#22](https://github.com/tshino/compare/issues/22) Improvement of touch input (responsiveness of pinch zoom etc.)
- [#23](https://github.com/tshino/compare/issues/23) Improvement of zooming behaviour of figures
- [#24](https://github.com/tshino/compare/issues/24) Fix: Horizontal axis of Waveform doesn't reflect Exif orientation tag

リリース v2.0

新機能
- [#1](https://github.com/tshino/compare/issues/1) カラーピッカー機能（クリックした場所のRGB値を表示）
- [#20](https://github.com/tshino/compare/issues/20) 3次元色分布（RGB色空間を立体的に表示）
  ![colordist3](https://user-images.githubusercontent.com/732920/31325439-23000954-acf8-11e7-930e-7f0d0c6b108a.png)
- [#19](https://github.com/tshino/compare/issues/19) トーンカーブ推定（2つの画像の明るさを比較）
  ![tonecurve3](https://user-images.githubusercontent.com/732920/31325490-b713b80c-acf8-11e7-9dea-a471340d565a.png)

改良／拡張
- [#15](https://github.com/tshino/compare/issues/15) TABキーによる画像の切り替え表示
- [#13](https://github.com/tshino/compare/issues/13) 画像のdiffにオフセットオプションを追加
- [#22](https://github.com/tshino/compare/issues/22) タッチ入力の改善（ピンチズームの追従性など）
- [#23](https://github.com/tshino/compare/issues/23) ヒストグラムなどの図をズームする動作の改良
- [#24](https://github.com/tshino/compare/issues/24) 波形（Waveform）の横軸がExifの回転情報を無視していた問題を修正


### [v1.0] - 2017-04-10

This is the first release.
It includes all the essential features for image comparison.

- Parallel zooming UI is for ease of visual comparison
- 'Image diff' indicates different parts between two images
- Metrics such as PSNR provides numerical measure of image quality
- Histogram, waveform and vectorscope give more detail
