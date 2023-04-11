class Powerup {
    constructor(x = random(width), y = random(height), type = random(['speed', 'slow', 'reverse']), sendData = true) {
       this.id = frameCount;
       this.x = x;
       this.y = y;
       this.r = 10;
       this.type = type;
       this.iconlist = {
             'speed':    '⚡',
             'slow':     '🐌',
             'reverse':  '🔄',
          }
       this.icon = this.iconlist[this.type];
 
       if(sendData) {
          this.sendData();
       }
    }
 
    draw() {
       push();
       translate(this.x, this.y);
       strokeWeight(1);
       stroke(0);
       fill(0);
       textSize(20);
       text(this.icon, 0, 0);
       pop();
    }
 
    checkCollision() {
       for (var i = 0; i < players.length; i++) {
          if (dist(this.x, this.y, players[i].x, players[i].y) < this.r*2 + players[i].r*2) {
             players[i].addPowerup(this);
             this.remove();
          }
       }
    }
 
    sendData() {
       database.ref("powerups/"+this.id).set({
          x: Math.round(this.x),
          y: Math.round(this.y),
          type: this.type,
       });
    }
 
    remove() {
       powerups.splice(powerups.indexOf(this), 1);
       database.ref("powerups/"+this.id).remove();
    }
 }