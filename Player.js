class Player {
    constructor(id, name, color) {
       this.id = id;
       this.x = width/2;
       this.y = height/2;
       this.r = 5;
       this.speed = 2;
       this.angle = 0;
       this.color = color;
       this.name = name;
       this.leftkey = 37;
       this.rightkey = 39;
       this.trail = [];
       this.respawnMargin = 50;
       this.isDead = false;
       this.powerUpIcon = null;
       this.powerUpInterval = 5000;
 
       this.respawn();
    }
 
    updateOther() {
       if (frameCount % 2 == 0) {
          this.fetchData();
          this.trail.push({x: this.x, y: this.y});
       }
    }
 
 
    updateSelf() {
       this.x += cos(this.angle) * this.speed;
       this.y += sin(this.angle) * this.speed;
 
       this.trail.push({x: this.x, y: this.y});
 
       if (frameCount % 2 == 0) {
          this.sendData();
       }
    }
 
    sendData() {
       database.ref("players/"+uid).set({
          x: Math.round(this.x),
          y: Math.round(this.y),
       });
    }
 
    fetchData() {
       var playerRef = database.ref("players/"+this.id);
 
       playerRef.once("value", function(snapshot) {
          const player = snapshot.val();
          this.x = player.x;
          this.y = player.y;
       }.bind(this));
    }
 
    draw() {
       fill(this.color);
       strokeWeight(this.r*2);
       stroke(this.color);
 
       //draw trail
       for (var i = 0; i < this.trail.length; i++) {
          point(this.trail[i].x, this.trail[i].y);
       }
 
       //draw player head as circle
       push();
       translate(this.x, this.y);
       rotate(this.angle);
       strokeWeight(1);
       stroke(0);
       fill(0);
       ellipse(0, 0, this.r);
       pop();

       //draw player name in small white text below player
      push();
      translate(this.x, this.y + 20);
      strokeWeight(1);
      stroke(0);
      fill(255);
      textSize(10);
      text(this.name, 0, 0);
      pop();
       
       //draw powerup icon font awesome
       if(this.powerUpIcon) {
          push();
          translate(this.x, this.y - 20);
          strokeWeight(1);
          stroke(0);
          fill(0);
          textSize(20);
          text(this.powerUpIcon, 0, 0);
          pop();
       }
    }
 
    control(keyCode) {
       if (keyIsDown(this.leftkey)) {
          this.angle -= 0.1;
       }
       if (keyIsDown(this.rightkey)) {
          this.angle += 0.1;
       }
    }
 
    die() {
       this.isDead = true;
       console.log('player', this.name, 'died');
    }
 
    checkCollision() {
       // check if player is out of bounds
       if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          this.die();
       }
 
       //check for collisions with trail, do not chech last 20 elements
       for (var i = 0; i < this.trail.length-20; i++) {
          if (dist(this.x, this.y, this.trail[i].x, this.trail[i].y) < this.r*2) {
             this.die();
          }
       }
 
       //check for collisions with other players
       for (var i = 0; i < players.length; i++) {
          if (players[i].id == this.id)
             continue;
 
          for(var j = 0; j < players[i].trail.length; j++) {
             if (dist(this.x, this.y, players[i].trail[j].x, players[i].trail[j].y) < this.r*2) {
                this.die();
             }
          }
       }
    }
 
    respawn() {
       this.x = random(this.respawnMargin, width-this.respawnMargin);
       this.y = random(this.respawnMargin, height-this.respawnMargin);
       this.trail = [];
       this.angle = random(0, 2*PI);
       this.isDead = false;
       this.powerUpIcon = null;
    }
 
    setPos(x, y, angle) {
       this.x = x;
       this.y = y;
       this.angle = angle;
    }
 
    addPowerup(powerup) {
       this.powerUpIcon = powerup.icon;
 
       switch(powerup.type) {
          case 'speed':
             setTimeout(function() {
                this.speed -= 1;
                this.powerUpIcon = null;
             }.bind(this), this.powerUpInterval);
             this.speed += 1;
             break;
          case 'slow':
             setTimeout(function() {
                this.speed += 1;
                this.powerUpIcon = null;
             }.bind(this), this.powerUpInterval);
             this.speed -= 1;
             break;
          case 'reverse':
             let lk = this.leftkey;
             let rk = this.rightkey;
 
             setTimeout(function() {
                this.leftkey = lk;
                this.rightkey = rk;
                this.powerUpIcon = null;
             }.bind(this), this.powerUpInterval);
             this.leftkey = rk;
             this.rightkey = lk;
             break;
          default:
             break;
       }
    }
 }