
window.requestAnimationFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
function barrage(ele) {
    console.info(ele instanceof HTMLCanvasElement);
    this.root = ele;
}

var defalutConfig = {
    bulletHeight: 50,
    displayTime: 10000,  // 弹幕显示的时长
    isDebug: false,
    fontSize: 14        // 弹幕字体大小
}

function log(isDebug, para) {
    if (isDebug) {
        console.info(para);
    }
}

barrage.prototype.initTrack = function () {
    var trackAmount = parseInt(this.root.offsetHeight / this.config.bulletHeight);
    for (var i = 0; i < trackAmount; i++) {
        this.tracks.push({
            id: i,
            top: (i + 1) * this.config.bulletHeight
        });

        this.lastFired[i] = null;
    }
    this.lastFired.length = trackAmount;
    log(this.config.isDebug, '初始化弹道数量: ' + trackAmount);
}

barrage.prototype.animate = function (time) {
    if (this.status === 'running') {
        this.ctx.clearRect(0, 0, this.root.offsetWidth, this.root.offsetHeight);
        this.fire();
        this.tweenGroup.update(time);
        requestAnimationFrame(this.animate.bind(this));
    }
}

barrage.prototype.init = function (config) {

    this.config = $.extend(defalutConfig, config || {});
    log(this.config.isDebug, '弹幕初始化');

    this.bulletId = 0;
    this.bulletPool = [];
    this.bulletRunningPool = new utils.Map();
    this.tracks = [];
    this.lastFired = {};                        // 一条弹幕中的最后一个，如果为空表示弹道是空的
    this.fireTimer = null;
    this.tweenGroup = new TWEEN.Group();
    this.status = 'init';                         // 弹幕状态：init | running | idle
    this.nextBullet = null;                     // 下一次要发射的弹幕
    this.ctx = this.root.getContext('2d');
    this.ctx.font = this.config.fontSize + 'px Microsoft YaHei';
    this.ctx.textBaseline = 'Middle';

    this.initTrack(this.config, this.tracks, this.root.offsetHeight);
}

barrage.prototype.load = function (bullets) {
    $.each(bullets, function (index, item) {
        item.id = this.bulletId;
        this.bulletId++;
    }.bind(this));
    this.bulletPool = this.bulletPool.concat(bullets);
    log(this.config.isDebug, '装载子弹，子弹数量：' + this.bulletPool.length);

    if (this.status && this.status === 'idle') {
        this.status = 'running';
        requestAnimationFrame(this.animate.bind(this));
    }
}

barrage.prototype.moveBullet = function (bullet) {
    var step = new TWEEN.Tween(bullet.steps, this.tweenGroup)
        .to({ left: this.root.offsetWidth + bullet.width }, this.config.displayTime)
        .onUpdate(function () {
            this.print(bullet);
        }.bind(this))
        .easing(TWEEN.Easing.Linear.None)
        .onComplete(function () {
            this.bulletRunningPool.delete(bullet.id);
            if (this.bulletRunningPool.size === 0) {
                this.status = 'idle';
            }
        }.bind(this));
    step.start();
    return step;
}

barrage.prototype.print = function (bullet) {
    var width = this.root.offsetWidth;
    var height = this.root.offsetHeight;

    // 半圆
    this.ctx.fillStyle = "rgba(0,0,0,0.8)";
    this.ctx.beginPath();
    this.ctx.arc(
        width - bullet.steps.left + this.config.fontSize / 2,
        this.tracks[bullet.trackId].top - this.config.fontSize / 2,
        this.config.fontSize / 2,
        -Math.PI / 2, Math.PI / 2, true);
    this.ctx.fill();
    // 矩形
    this.ctx.fillRect(
        width - bullet.steps.left + this.config.fontSize / 2,
        this.tracks[bullet.trackId].top - this.config.fontSize,
        bullet.width - this.config.fontSize,
        this.config.fontSize);
    // 半圆
    this.ctx.beginPath();
    this.ctx.arc(
        width - bullet.steps.left - this.config.fontSize / 2 + bullet.width,
        this.tracks[bullet.trackId].top - this.config.fontSize / 2,
        this.config.fontSize / 2,
        Math.PI / 2, Math.PI * 1.5, true);
    this.ctx.fill();
    // 文字
    this.ctx.fillStyle = "rgba(255,255,255,1)";
    this.ctx.fillText(bullet.msg,
        width - bullet.steps.left + this.config.fontSize / 2,
        this.tracks[bullet.trackId].top - this.config.fontSize * 0.15);
}

barrage.prototype.createBullet = function (bullet) {
    return {
        id: bullet.id,
        msg: bullet.msg,
        width: utils.getTextBulletLength(this.ctx, bullet.msg, this.config.fontSize),
        v: (utils.getTextBulletLength(this.ctx, bullet.msg, this.config.fontSize) + this.root.offsetWidth) / this.config.displayTime,
        trackId: null,
        steps: { left: 0 }
    }
}

barrage.prototype.getIdleTrack = function () {
    for (var i = 0; i < this.lastFired.length; i++) {
        if (this.lastFired[i] === null) {
            return i;
        } else {
            if (this.lastFired[i].steps.left < this.lastFired[i].width) {
                continue;
            } else if (this.lastFired[i].v >= this.nextBullet.v) {
                return i;
            } else if (this.lastFired[i].steps.left - this.lastFired[i].width >= (this.nextBullet.v - this.lastFired[i].v) * this.config.displayTime) {
                return i;
            }
        }
    }
    return null;
}

barrage.prototype.fire = function () {
    if (this.bulletPool.length === 0) {
        log(this.config.isDebug, 'bulletPool已空，进入空闲状态');
        if (this.bulletRunningPool.size === 0) {
            this.status === 'idle';
        }
        return;
    }
    if (this.nextBullet === null) {
        var next = this.bulletPool.shift();
        this.nextBullet = this.createBullet(next);
    }

    var trackId = this.getIdleTrack();
    if (trackId === null) {
        log(this.config.isDebug, '没有找到可用的弹道');
        return;
    }

    this.nextBullet.trackId = trackId;
    this.lastFired[trackId] = this.nextBullet;
    this.bulletRunningPool.set(this.nextBullet.id, this.nextBullet);

    var step = this.moveBullet(this.nextBullet);
    this.bulletRunningPool.get(this.nextBullet.id).step = step;
    this.nextBullet = null;
}

barrage.prototype.start = function () {
    if (this.status && this.status === 'init') {
        this.status = 'running';
        requestAnimationFrame(this.animate.bind(this));
    }
}

barrage.prototype.clarnAll = function () {
    if (this.status !== undefined) {
        this.nextBullet = null;
        this.bulletPool = [];
        this.bulletRunningPool.forEach(function (item) {
            if (item.step) {
                item.step.stop();
            }
        });
        this.bulletRunningPool.clear();
        this.status = 'init';
        this.ctx.clearRect(0, 0, this.root.offsetWidth, this.root.offsetHeight);
    }
}

var utils = {
    getTextBulletLength: function (ctx, msg, fontSize) {
        return ctx.measureText(msg).width + fontSize;
    },
    Map: window.Map ? window.Map : map,
}

function map() {
    this.data = [];
}

map.prototype = {
    get size() {
        return this.data.length;
    },
    clear: function () {
        this.data = [];
    },
    indexOf: function (key) {
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].key === key) {
                return i;
            }
        }
        return -1;
    },
    get: function (key) {
        var index = this.indexOf(key);
        if (index !== -1) {
            return this.data[index].value;
        }
        return undefined;
    },
    set: function (key, value) {
        var index = this.indexOf(key);
        if (index === -1) {
            this.data.push({
                key: key,
                value: value
            })
        } else {
            this.data[index].value = value;
        }
    },
    delete: function (key) {
        var index = this.indexOf(key);
        if (index === -1) {
            return false;
        } else {
            this.data.splice(index, 1);
            return true;
        }
    }
}




function ppParrage(root) {
    this.barrage = new barrage(root);
}

ppParrage.prototype = {
    'init': function (config) {
        this.barrage.init(config);
    },
    'load': function (bullets) {
        this.barrage.load(bullets);
    },
    'start': function () {
        this.barrage.start();
    },
    'clarnAll': function () {
        this.barrage.clarnAll();
    },
    'getStatus': function () {
        return this.barrage.status;
    },
}
