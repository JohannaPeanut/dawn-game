const clamp = (value, min, max) => Math.max(Math.min(value, max), min);

const fps = 60;
class Ball {
  constructor(gameInstance, x, y) {
    this.game = gameInstance;
    this.player = this.game.player;
    this.radius = 20;
    this.x = x;
    this.y = y; //this.game.canvas.height - this.radius - 200;
    this.speedY = 100; // pixels per second
    this.speedX = 50; // pixels per second
    this.gravity = 4000; // pixels per second squared, accelerationY
    this.accelerationX = 0; // pixels per second squared
    this.connection = false;
  }

  runLogic() {
    //problem wenn player mit obstacle kollidiert und gleichzeitig mit ball (diesen also aufnehmen will)
    // problem solved maybe if player cant pick up ball when it is intersecting with obstacles
    //tried avoid that buggy behavior with this.game.canvas.height - 1.5 * this.radius but then player cannot pick up ball when it is jumping....
    this.y = clamp(this.y, this.radius, this.game.canvas.height - this.radius);
    this.x = clamp(this.x, this.radius, this.game.canvas.width - this.radius);

    if (
      this.checkCollision(this.player) &&
      this.player.y > this.game.canvas.height - 1.5 * this.radius &&
      !this.connection
    ) {
      this.connection = true;
    }

    if (
      this.connection &&
      !this.game.goal.hit &&
      !this.game.mousePlayer.isDraggingBall
    ) {
      this.runLogicConnected();
    } else if (
      !this.connection &&
      !this.game.goal.hit &&
      !this.game.mousePlayer.isDraggingBall
    ) {
      this.runLogicDisconnected();
    } else if (
      !this.connection &&
      !this.game.goal.hit &&
      this.game.mousePlayer.isDraggingBall
    ) {
      this.runLogicMouse();
    } else {
      this.runLogicHitGoal();
    }
  }

  runLogicConnected() {
    this.x = this.player.x;
    this.y = this.player.y - this.player.radius - this.radius;
    for (let obstacle of this.game.obstacles) {
      if (obstacle.checkCollision(this)) this.loseConnection();
    }
  }

  runLogicDisconnected() {
    this.speedY += this.gravity / fps;
    this.speedX += this.accelerationX / fps;

    this.y += this.speedY / fps;
    this.x += this.speedX / fps;

    if (
      this.y + this.radius > this.game.canvas.height ||
      this.y - this.radius < 0
    ) {
      this.speedY = this.speedY * -0.94;
    }
    if (
      this.x + this.radius > this.game.canvas.width ||
      this.x - this.radius < 0
    ) {
      this.speedX = this.speedX * -0.94;
    }
    for (let obstacle of this.game.obstacles) {
      if (obstacle.checkCollision(this)) {
        const intersectingObstacle = this.whichObstale();
        if (intersectingObstacle.x < this.x) {
          //if intersecting obstacle is left from ball --> new clamp for right side of obstacle
          this.x = clamp(
            this.x,
            this.radius + intersectingObstacle.x + intersectingObstacle.width,
            this.game.canvas.width - this.radius
          );
          this.speedX = this.speedX * -0.5;
        } else {
          //if intersecting obstacle is right from ball --> new clamp for left side of obstacle
          this.x = clamp(
            this.x,
            this.radius,
            intersectingObstacle.x - this.radius
          );
          this.speedX = this.speedX * -0.5;
        }
        /* if (intersectingObstacle.y < this.y) {
          //if intersecting obstacle is on top of ball --> new clamp on top of iobstacle
          console.log('obstacle top');
          
          this.speedY = this.speedY * -0.1;
        } else {
          console.log('obstacle bottom');
          //if intersecting obstacle is underneath ball --> new clamp for underneath obstacle
          
          this.speedY = this.speedY * -0.1;
        } */
      }
    }
  }

  runLogicHitGoal() {
    
      this.x = this.game.goal.x;
      this.y = this.game.goal.y;
      this.connection = false;
      this.game.mousePlayer.isDraggingBall = false;
  }

  runLogicMouse() {
    let deltaY = this.game.mousePlayer.y - this.y;
    let deltaX = this.game.mousePlayer.x - this.x;

    if (deltaX > 200 || deltaX < -200) {
      this.game.ball.isDraggingBall = false;
    } else {
      this.speedX = deltaX * 10;
      this.speedY = deltaY * 10;

      this.y += this.speedY / fps ;
      this.y -= this.radius/5;
      this.x += this.speedX / fps;

      for (let obstacle of this.game.obstacles) {
        if (obstacle.checkCollision(this)) {
          this.loseConnection();
        }
      }
    }
  }

  loseConnection() {
    if (this.connection || this.game.mousePlayer.isDraggingBall) {
      this.game.mousePlayer.isDraggingBall = false;
      this.connection = false;
      const intersectingObstacle = this.whichObstale();
      if (intersectingObstacle.x < this.x) {
        this.x += 2 * this.radius + 2; // if obstacle is left from ball --> ball falls to the right
      } else {
        this.x -= 2 * this.radius + 2; // if obstacle is right from ball --> ball falls to the left
      }
    }
  }

  draw() {
    this.game.context.save();
    this.game.context.fillStyle = 'red';
    this.game.context.beginPath();
    game.context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    this.game.context.closePath();
    this.game.context.fill();
    this.game.context.restore();
  }

  checkCollision(element) {
    // check for intersections between player and ball
    return (
      // is right edge of element in front of left edge of ball
      element.x + element.radius > this.x - this.radius &&
      // is left edge of element before of right edge of ball
      element.x - element.radius < this.x + this.radius &&
      // is bottom edge of element below top edge of ball
      element.y + element.radius > this.y - this.radius &&
      // is top edge of element above bottom edge of ball
      element.y - element.radius < this.y + this.radius
    );
  }

  whichObstale() {
    for (let obstacle of this.game.obstacles) {
      if (obstacle.checkCollision(this)) return obstacle; //returns intersecting obstacle instance
    }
  }
}
