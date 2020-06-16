仅需打包`./pattern.js`到`./dist/pattern.js`，然后打开pattern.html

`./patttern.js`: 示例入口html

`./pattern.js`: 示例功能代码

`./pattern.js`: 示例CSS代码

`./third/artoolkit.min.js`: 第三方标记追踪库

`./third/ARHelper.js`: AR辅助库，用于创建场景相机，处理模型

`./data/*`: 相机内参·模型·标记s·图片，markerSet.jpg是预先训练的可以用来扫描的标记图

除上面的文件/文件夹都是临时用作测试或者解码模型之类的的，不需要太关注

## 标记训练
### 单标记训练
多标记是多个单标记拼成的，需要先获取单标记图像，然后拼在一张图片上，单标记在线训练 https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html

### 多标记训练
训练需要安装artoolkitx http://www.artoolkitx.org/docs/downloads/， 标记训练参考 https://github.com/artoolkitx/artoolkitx/wiki/Creating-and-using-multi-square-marker-sets ，MAC OS需要额外文件，见issue https://github.com/artoolkitx/artoolkitx/issues/112

标记训练后将.mrk文件中所有有效数(非1的数)都缩小100倍，否则会有严重的z-Fighting问题

## 事件
特定位置的事件触发通过对比预定的变化矩阵和当前变化矩阵实现，打开pattern.html，到理想角度时按下`get current matrix`按钮，得到当前变化矩阵，用这个变化矩阵去注册事件，参考`./pattern.js`101行

## tips
1. 标记必须是完全不对称，不能有两个角度同一个形状出现。
2. 标记最好打印到纸张上，屏幕会有很多干扰。
3. 可以添加例如Tween的缓动库将矩阵变化平滑过渡，但是会有一种滞后感

