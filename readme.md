# 高性能canvas弹幕

支持同时显示200条弹幕，并维持60fps帧率
![Markdown](http://i4.eiimg.com/1949/ce509c38502be29c.png)

## 特征
- 弹幕优先显示在顶部
- 弹幕永远不会重叠
- 支持缓冲池，如果屏幕已满则推后显示
- 支持配置弹幕滑动时长，字数多的弹幕移动更快
- 支持弹幕字体大小配置
- 支持弹幕轨道高度配置

`note: 依赖jquery和tween.js`

##  Compatibility
| Browser       | Support          |
| ------------- |:----------------:|
| IE 9          | √                |
| IE 10         | √                |
| IE 11         | √                |
| chrome 59     | √                |
| FF 54         | √                |

## API
| fun           | paramName          | comment  |
| ------------- |:-------------:| -----:|
| ppParrage     | root：canvas节点          | 构造方法|
| init          | config：配置项            | 初始化方法   |
| load          | bullets：弹幕数据         | 加载弹幕数据  |
| start         | 无                       | 开始运行     |
| getStatus     | 无                       | 弹幕执行状态：init，running，idle  |


## Usage

- be sure that the jquery and tween.js is loaded

## Simple
HTML
```html
<!DOCTYPE HTML>
<html lang="en">

<head>
    <meta charset="UTF-8">
     <script src="https://cdn.bootcss.com/jquery/3.2.1/jquery.min.js"></script>
    <script src="./src/Tween.js"></script> 
    <script src="./src/index.js"></script>
    <link href="./index.css" rel="stylesheet" type="text/css" />
    <script>
        window.onload = function () {
            var test = new ppParrage.ppParrage(document.getElementById('pg'));
            $('#init').click(function () {
                test.init({
                    bulletHeight: 50,
                    displayTime: 6000,  // 弹幕显示的时长
                    isDebug: false,
                    fontSize: 28        // 弹幕字体大小
                }); 
            })
            $('#start').click(function () { test.start(); })
            $('#load').click(function () {
                test.load([
                    { msg: '我是一条弹幕' },
                ])
            })
            $('#status').click(function () {
                 $('#status').text(test.getStatus());
            })
            $('#clarnAll').click(function () {
                 test.clarnAll();
            })
        }
    </script>
</head>

<body>
    <canvas id="pg" width="1024" height="768">

    </canvas>
    <div>
        <button id="init">init</button> 
        <button id="load">load</button>
        <button id="start">start</button>
        <button id="clarnAll">clarnAll</button>
        <button id="status">status</button>
    </div>
</body>

</html>
</html>
```

## 版本更新
- 2.3.5 弹幕文字居中bug修复，最后一条弹幕无法显示bug修复
- 2.3.3 增加弹幕间距
- 2.3.2 bug修复：clearAll函数清楚lastFired集合