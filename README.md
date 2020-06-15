仅需打包`./pattern.js`到`./dist/pattern.js`，然后打开pattern.html

`./patttern.js`: 入口html

`./third/artoolkit.min.js`: 第三方标记追踪库

`./third/ARHelper.js`: AR辅助库，用于创建场景相机，处理模型

`./pattern.js`: 主要的功能代码

`./data/*`: 标记，模型，图片

除上面的文件/文件夹都是临时用作测试或者解码模型之类的的，不需要太关注

标记训练参考 https://github.com/artoolkitx/artoolkitx/wiki/Creating-and-using-multi-square-marker-sets ，需要安装artoolkitx