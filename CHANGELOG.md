# Change Log

All notable changes to the Keyboard Macro Bata extension will be documented in this file.

### [v2.0] - 2017-10-09

New Feature
- #1 Color Value Picker (displays RGB value of clicked point)
- #20 3D Color Distribution (displays RGB color space in 3D)
  ![colordist3](https://user-images.githubusercontent.com/732920/31325439-23000954-acf8-11e7-930e-7f0d0c6b108a.png)
- #19 Tone Curve Estimation (compares brightness of two images)
  ![tonecurve3](https://user-images.githubusercontent.com/732920/31325490-b713b80c-acf8-11e7-9dea-a471340d565a.png)

Enhancement / Improvement
- #15 Flip single picture view by TAB key
- #13 Add offset option to Image Diff
- #22 Improvement of touch input (responsiveness of pinch zoom etc.)
- #23 Improvement of zooming behaviour of figures
- #24 Fix: Horizontal axis of Waveform doesn't reflect Exif orientation tag

リリース v2.0

新機能
- #1 カラーピッカー機能（クリックした場所のRGB値を表示）
- #20 3次元色分布（RGB色空間を立体的に表示）
  ![colordist3](https://user-images.githubusercontent.com/732920/31325439-23000954-acf8-11e7-930e-7f0d0c6b108a.png)
- #19 トーンカーブ推定（2つの画像の明るさを比較）
  ![tonecurve3](https://user-images.githubusercontent.com/732920/31325490-b713b80c-acf8-11e7-9dea-a471340d565a.png)

改良／拡張
- #15 TABキーによる画像の切り替え表示
- #13 画像のdiffにオフセットオプションを追加
- #22 タッチ入力の改善（ピンチズームの追従性など）
- #23 ヒストグラムなどの図をズームする動作の改良
- #24 波形（Waveform）の横軸がExifの回転情報を無視していた問題を修正


### [v1.0] - 2017-04-10

This is the first release.
It includes all the essential features for image comparison.

- Parallel zooming UI is for ease of visual comparison
- 'Image diff' indicates different parts between two images
- Metrics such as PSNR provides numerical measure of image quality
- Histogram, waveform and vectorscope give more detail
