function barrage(ele) {
    this.root = ele;
}

var defalutConfig = {
    bulletHeight: 50,
    fireInterval: 200,
    v: 50,
    isDebug: true
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
            top: i * this.config.bulletHeight
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
    }
    this.tweenGroup.update(time);
}

barrage.prototype.init = function (config) {

    this.config = Object.assign(defalutConfig, config || {});
    log(this.config.isDebug, '弹幕初始化');

    this.bulletId = 0;
    this.bulletPool = [];
    this.tracks = [];
    this.lastFired = {};
    this.fireTimer = null;
    this.tweenGroup = new TWEEN.Group();
    this.status = null;
    this.nextBullet = null;

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
        this.fireTimer = setInterval(function () {
            this.fire();
        }.bind(this), this.config.fireInterval);
        this.animate();
    }
}

barrage.prototype.fireBullet = function() {

}

barrage.prototype.createBullet = function(msg) {
    var bullet = {
        msg: msg,
        v: this.root.offsetHeight
    }
}

barrage.prototype.getIdleTrack = function() {
    for(var i = 0; i < this.lastFired.length; i++) {
        if (this.lastFired[i] === null) {
            return i;
        }


    }
}

barrage.prototype.fire = function() {
    if (this.bulletPool.length === 0) {
        log(this.config.isDebug, 'bulletPool已空，进入空闲状态');
        clearInterval(this.fireTimer);
    }
    // 批量发射弹幕
}

barrage.prototype.start = function() {
    if (this.status || this.status !== 'init') {
        return;
    }

    this.status = 'running';
    this.fireTimer = setInterval(function(){
        this.fire();
    }, this.config.fireInterval);
}

