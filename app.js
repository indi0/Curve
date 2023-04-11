// curvefever clone using p5.js and firebase realtime database
var players = [];
var powerups = [];
var gamestate = 'lobby';
var playerRef;
var allPlayerRef;
var powerupRef;
var gameStateRef;
var sp = 2;

function randomHexColor() {

   //rainbow colors
   var colors = [
      'FF0000',
      'FF7F00',
      'FFFF00',
      '00FF00',
      '0000FF',
      '4B0082',
      '8B00FF',
   ]

   return '#' + random(colors);
}

function generatePlayerName() {
   // animals
   var animals = [
      'Cow',
      'Pig',
      'Chicken',
      'Sheep',
      'Horse',
      'Dog',
      'Cat',
      'Rabbit',
      'Mouse',
      'Lion',
      'Tiger',
      'Elephant',
      'Giraffe',
   ]

   // adjectives
   var adjectives = [
      'Happy',
      'Sad',
      'Angry',
      'Crazy',
      'Lazy',
      'Hungry',
      'Sleepy',
      'Silly',
      'Cute',
      'Funny',
      'Smart',
      'Strong',
      'Fast',
   ]

   return adjectives[Math.floor(Math.random() * adjectives.length)] + ' ' + animals[Math.floor(Math.random() * animals.length)];
}

function setup() {
   gameCanvas = createCanvas(800, 800);
   noStroke();
   frameRate(30);

   database = firebase.database();

   firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        uid = user.uid;
        console.log('user signed in', uid);
        playerRef = database.ref("players/"+uid);
  
        playerRef.set({
          id: uid,
          name: generatePlayerName(),
          color: randomHexColor(),
        });

         playerRef.onDisconnect().remove();

         startGame();
      }
   });

   firebase.auth().signInAnonymously().catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode, errorMessage);
  });

}

function draw() {

   //center canvas on window resize
   var x = (windowWidth - width) / 2;
   var y = (windowHeight - height) / 2;
   gameCanvas.position(x, y);

   switch(gamestate) {
      case 'lobby':
            background(0);
            fill(255);
            noStroke();
            textAlign(CENTER);
         if (players.length >= sp) {
            text('Ready to play!', width/2, height/2);
            //display start button
            fill(255, 0, 0);
            rect(width/2-50, height/2+50, 100, 50);
            fill(255);
            textAlign(CENTER);
            text('Start', width/2, height/2+80);
            if (mouseIsPressed && mouseX > width/2-50 && mouseX < width/2+50 && mouseY > height/2+50 && mouseY < height/2+100) {
               gameStateRef.set('playing');
            }
         } else {
            text('Waiting for players (' + players.length + '/' + sp + ')...', width/2, height/2);
         }
         break;

      case 'playing':

         if(players.length <= 1) {
            gameStateRef.set('lobby');
            break;
         }

         background(0);

         // if only one player is alive, restart game
         var alivePlayers = 0;
         for (var i = 0; i < players.length; i++) {
            if (!players[i].isDead) {
               alivePlayers++;
            }
         }

         if (alivePlayers == 1) {
            gameStateRef.set('restart');
         }

         updatePlayers();
         updatePowerups();
         break;
      
      case 'restart':    
         break;

      default:
         break;
      }
}

function updatePlayers() {
   for (var i = 0; i < players.length; i++) {

      p = players[i];

      if(p.id == uid && !p.isDead) {
         p.control();
         p.updateSelf();
         p.checkCollision();
      } else {
         players[i].updateOther();
      }
      players[i].draw();
   }
}

function updatePowerups() {
   for (var i = 0; i < powerups.length; i++) {
      powerups[i].draw();
      powerups[i].checkCollision();
   }

   if (frameCount % 100 == 0 && powerups.length < players.length + 2) {
      powerups.push(new Powerup());
      console.log("Powerup added " + powerups[powerups.length-1].type);
   }
}

function startGame() {
   allPlayerRef = database.ref("players");
   powerupRef = database.ref("powerups");
   gameStateRef = database.ref("gamestate");

   gameStateRef.on("value", function(snapshot) {
      gamestate = snapshot.val();
      
      if (gamestate == 'restart') {
         //3 second delay before calling restartGame()
         fill(255);
         noStroke();
         textAlign(CENTER);
         text('Restarting...', width/2, height/2);     
         setTimeout(restartGame, 3000);
      }
   });

   allPlayerRef.on("child_added", function(snapshot) {
      const addedPlayer = snapshot.val();

      players.push(new Player(addedPlayer.id, addedPlayer.name, addedPlayer.color));

      console.log("Player added " + addedPlayer.name);
   });

   allPlayerRef.on("child_removed", function(snapshot) {
      const removedPlayer = snapshot.val();

      players.splice(players.indexOf(removedPlayer), 1);

      console.log("Player removed " + removedPlayer.name);
   });

   //clear powerups
   powerupRef.remove();

   powerupRef.on("child_added", function(snapshot) {
      const addedPowerup = snapshot.val();

      powerups.push(new Powerup(addedPowerup.x, addedPowerup.y, addedPowerup.type, false));

      console.log("Powerup added " + addedPowerup.type);
   });

   powerupRef.on("child_removed", function(snapshot) {
      const removedPowerup = snapshot.val();

      powerups.splice(powerups.indexOf(removedPowerup), 1);

      console.log("Powerup removed " + removedPowerup.type);
   });
}

function restartGame() {
   //reset powerups
   for (var i = 0; i < powerups.length; i++) {
      powerups[i].remove();
   }
   //respawn all players
   for (var i = 0; i < players.length; i++) {
      players[i].respawn();
   }

   gameStateRef.set('playing');
}

