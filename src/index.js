function barrage(ele) {
    this.root = ele;
}

var defalutConfig = {
    bulletHeight: 50,
    fireInterval: 200,
    displayTime: 6000,  // 弹幕显示的时长
    isDebug: false,
    fontSize: 24        // 弹幕字体大小
}

function log(isDebug, ...para) {
    if (isDebug) {
        console.info(para);
    }
}

barrage.prototype.initTrack = function() {
    var trackAmount = parseInt(this.root.offsetHeight / this.config.bulletHeight);
    for (var i = 0; i < trackAmount; i++) {
        this.tracks.push({
            id: i,
            top: (i + 1) * this.config.bulletHeight
        });

        this.lastFired[i] = null;
    }
    this.lastFired.length = trackAmount;
    log(this.config.isDebug, `初始化弹道数量: ${trackAmount}`);
}

function createBullet(config, bulletInfo, trackInfo, rootWidth) {
    var bullet = document.createElement('div');
    bullet.innerText = bulletInfo.msg;
    bullet.style.position = 'absolute';
    bullet.style.left = `${rootWidth}px`;
    bullet.style.top = `${trackInfo.top}px`;
    bullet.id = bulletInfo.id;
    bullet.style.display = 'inline-block';
    bullet.style['white-space'] = 'nowrap';
    return bullet;
}

function mountBullet(ele, bullet) {
    ele.appendChild(bullet);
}

barrage.prototype.animate = function (time) {
    if (this.status === 'running') {
        
        requestAnimationFrame(this.animate.bind(this));
        this.tweenGroup.update(time);
        this.print();
        
        this.fire();
    }
}

barrage.prototype.init = function (config) {

    this.config = Object.assign(defalutConfig, config || {});
    log(this.config.isDebug, '弹幕初始化');

    this.bulletId = 0;
    this.bulletPool = [];
    this.bulletRunningPool = new Map();
    this.tracks = [];
    this.lastFired = {};                        // 一条弹幕中的最后一个，如果为空表示弹道是空的
    this.fireTimer = null;
    this.tweenGroup = new TWEEN.Group();
    this.status = null;                         // 弹幕状态：init | running | idle
    this.nextBullet = null;                     // 下一次要发射的弹幕
    this.ctx = this.root.getContext('2d');
    this.ctx.font = this.config.fontSize + 'px serif';
    this.ctx.textBaseline = 'bottom';

    this.initTrack(this.config, this.tracks, this.root.offsetHeight);
}

barrage.prototype.load = function (bullets) {
    $.each(bullets, function (index, item) {
        item.id = this.bulletId;
        this.bulletId++;
    }.bind(this));
    this.bulletPool = this.bulletPool.concat(bullets);
    log(this.config.isDebug, `装载子弹，子弹数量：${this.bulletPool.length}`);
    if (this.status && this.status === 'idle') {
        this.status = 'running';
        /* this.fireTimer = setInterval(function () {
            this.fire();
        }.bind(this), this.config.fireInterval); */
        requestAnimationFrame(this.animate.bind(this));
    }
}

barrage.prototype.moveBullet = function(bullet) {
    var step = new TWEEN.Tween(bullet.steps, this.tweenGroup)
        .to({ left: this.root.offsetWidth + bullet.width }, this.config.displayTime)
        .easing(TWEEN.Easing.Linear.None)
        .onComplete(function () {
            this.bulletRunningPool.delete(bullet.id);
            if (this.bulletRunningPool.size === 0) {
                this.status = 'idle';
            }
        }.bind(this));
    step.start();
}

barrage.prototype.print = function() {
    this.ctx.clearRect(0, 0, this.root.offsetWidth, this.root.offsetHeight);
    var width = this.root.offsetWidth;
    var height = this.root.offsetHeight;

    this.bulletRunningPool.forEach(function(bullet){
        // 半圆
        this.ctx.fillStyle = "rgba(0,0,0,0.5)";
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
            this.tracks[bullet.trackId].top);
    },this);
}

barrage.prototype.createBullet = function(bullet) {
    return {
        id: bullet.id,
        msg: bullet.msg,
        width: utils.getTextBulletLength(this.ctx, bullet.msg, this.config.fontSize),
        v: ( utils.getTextBulletLength(this.ctx, bullet.msg, this.config.fontSize) + this.root.offsetWidth ) / this.config.displayTime,
        trackId: null,
        steps: {left: 0}
    }
}

barrage.prototype.getIdleTrack = function() {
    for(var i = 0; i < this.lastFired.length; i++) {
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

barrage.prototype.fire = function() {
    if (this.bulletPool.length === 0) {
        log(this.config.isDebug, 'bulletPool已空，进入空闲状态');
        /* clearInterval(this.fireTimer); */
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
    this.lastFired[trackId] =  this.nextBullet;
    this.bulletRunningPool.set(this.nextBullet.id, this.nextBullet);

    this.moveBullet(this.nextBullet);
    this.nextBullet = null;
}

barrage.prototype.start = function() {
    if (this.status || this.status === 'init') {
        return;
    }

    this.status = 'running';
    /* this.fireTimer = setInterval(function(){
        this.fire();
    }.bind(this), this.config.fireInterval); */
    requestAnimationFrame(this.animate.bind(this));
}

var utils = {
    getTextBulletLength: function(ctx,msg,fontSize) {
        return ctx.measureText(msg).width + fontSize;
    },
}
