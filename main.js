var player = new entity(20, 20);
var platforms = [];
var enemies = [];
var can;
var ctx;
var velocity = 100;
var acceleration = 200;
var bounce = .1;
var friction = 1;
var enemyMove = .9;
var timestamp;
var timer = 0;
var timerReset = 3;
var highScore = 0;
var playing = true;
var inputs = {
    left: false,
    up: false,
    right: false,
    down: false
};

function init() {
    platforms.push(new entity(50, 50, 200, 200));
    platforms.push(new entity(50, 50, 200, 400));
    platforms.push(new entity(50, 50, 400, 200));
    platforms.push(new entity(50, 50, 400, 400));
    can = document.getElementById('can');
    can.width = 600;
    can.height = 600;
    ctx = can.getContext('2d');
    ctx.font = 'bold 24px monospace';
    document.addEventListener('keydown', keyDown, false);
    document.addEventListener('keyup', keyUp, false);
    reset();
}

function reset() {
    playing = false;
    enemies = [];
    player.x = can.width / 2;
    player.y = can.height / 2;
    player.vx = 0;
    player.vy = 0;
    timer = timerReset;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText('SPACE to start', can.width / 2, can.height / 2);
}

function start() {
    playing = true;
    timestamp = Date.now();
    loop();
}

function loop() {
    var enemy, dx, dy, other;

    var now = Date.now();
    var delta = (now - timestamp) / 1000;
    timestamp = now;

    timer -= delta;
    if(timer <= 0) {
        timer = timerReset;
        enemy = new entity(20, 20);
        switch(enemies.length % 4) {
            case 0:
                enemy.left(0);
                enemy.y = can.height / 2;
                break;
            case 1:
                enemy.bottom(0);
                enemy.x = can.width / 2;
                break;
            case 2:
                enemy.right(can.width);
                enemy.y = can.height / 2;
                break;
            case 3:
                enemy.top(can.height);
                enemy.x = can.width / 2;
                break;
        }
        enemies.push(enemy);
        if(enemies.length > highScore) highScore = enemies.length;
    }

    if(inputs.left) {
        player.vx -= acceleration * delta;
    } else if(inputs.right) {
        player.vx += acceleration * delta;
    } else {
        player.vx -= player.vx * friction * delta;
    }

    if(inputs.up) {
        player.vy -= acceleration * delta;
    } else if(inputs.down) {
        player.vy += acceleration * delta;
    } else {
        player.vy -= player.vy * friction * delta;
    }

    if(player.vx < -velocity) {
        player.vx = -velocity;
    } else if(player.vx > velocity) {
        player.vx = velocity;
    }

    if(player.vy < -velocity) {
        player.vy = -velocity;
    } else if(player.vy > velocity) {
        player.vy = velocity;
    }

    player.x += player.vx * delta;
    player.y += player.vy * delta;

    platformCollision(player);
    canvasCollision(player);

    for(var i=0; i<enemies.length; i++) {
        enemy = enemies[i];
        dx = player.x - enemy.x;
        dy = player.y - enemy.y;
        if(Math.abs(dx) > Math.abs(dy)) {
            if(dx > 0) {
                enemy.vx += acceleration * enemyMove * delta;
                if(enemy.vx > velocity * enemyMove) enemy.vx = velocity * enemyMove;
            } else {
                enemy.vx -= acceleration * enemyMove * delta;
                if(enemy.vx < -velocity * enemyMove) enemy.vx = -velocity * enemyMove;
            }
        } else {
            if(dy > 0) {
                enemy.vy += acceleration * enemyMove * delta;
                if(enemy.vy > velocity * enemyMove) enemy.vy = velocity * enemyMove;
            } else {
                enemy.vy -= acceleration * enemyMove * delta;
                if(enemy.vy < -velocity * enemyMove) enemy.vy = -velocity * enemyMove;
            }
        }
        enemy.vx -= enemy.vx * friction * delta;
        enemy.vy -= enemy.vy * friction * delta;
        enemy.x += enemy.vx * delta;
        enemy.y += enemy.vy * delta;
        platformCollision(enemy);
        canvasCollision(enemy);

        if(collide(player, enemy)) {
            ctx.fillStyle = 'green';
            enemy.rect(ctx);
            reset();
            break;
        } else {
            for(var j=0; j<enemies.length; j++) {
                other = enemies[j];
                if(other === enemy) continue;
                if(collide(enemy, other)) {
                    resolveCollision(enemy, other);
                }
            }
        }
    }

    if(!playing) return;

    ctx.clearRect(0, 0, can.width, can.height);
    ctx.fillStyle = 'black';
    player.rect(ctx);
    ctx.fillStyle = 'red';
    for(var i=0; i<platforms.length; i++) {
        platforms[i].rect(ctx);
    }
    ctx.fillStyle = 'green';
    for(var i=0; i<enemies.length; i++) {
        enemies[i].rect(ctx);
    }

    ctx.fillStyle = 'white';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + (enemies.length * 10), 40, 40);
    ctx.textAlign = 'right';
    ctx.fillText('HIGH: ' + (highScore * 10), can.width - 40, 40);

    window.requestAnimationFrame(loop);
}

function platformCollision(obj) {
    var platform;
    for(var i=0; i<platforms.length; i++) {
        platform = platforms[i];
        if(collide(obj, platform)) {
            resolveCollision(obj, platform);
        }
    }
}

function resolveCollision(obj, platform) {
    var dx = (platform.x - obj.x) / platform.width;
    var dy = (platform.y - obj.y) / platform.height;

    if(Math.abs(dx) > Math.abs(dy)) {
        if(dx > 0) {
            obj.right(platform.left());
        } else {
            obj.left(platform.right());
        }
        obj.vx *= -bounce;
    } else {
        if(dy > 0) {
            obj.bottom(platform.top());
        } else {
            obj.top(platform.bottom());
        }
        obj.vy *= -bounce;
    }
}

function canvasCollision(obj) {
    if(obj.left() < 0) {
        obj.left(0);
        obj.vx *= -bounce;
    } else if(obj.right() > can.width) {
        obj.right(can.width);
        obj.vx *= -bounce;
    }

    if(obj.top() < 0) {
        obj.top(0);
        obj.vy *= -bounce;
    } else if(obj.bottom() > can.height) {
        obj.bottom(can.height);
        obj.vy *= -bounce;
    }
}

function keyDown(e) {
    e.preventDefault();
    switch(e.keyCode) {
        case 37:
            inputs.left = true;
            break;
        case 38:
            inputs.up = true;
            break;
        case 39:
            inputs.right = true;
            break;
        case 40:
            inputs.down = true;
            break;
        case 32:
            if(!playing) start();
            break;
    }
}

function keyUp(e) {
    e.preventDefault();
    switch(e.keyCode) {
        case 37:
            inputs.left = false;
            break;
        case 38:
            inputs.up = false;
            break;
        case 39:
            inputs.right = false;
            break;
        case 40:
            inputs.down = false;
            break;
    }
}

function collide(a, b) {
    if(a.left() > b.right()) return false;
    if(a.top() > b.bottom()) return false;
    if(a.right() < b.left()) return false;
    if(a.bottom() < b.top()) return false;
    return true;
}
