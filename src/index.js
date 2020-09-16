const canvas = document.getElementById("cnvs");

const gameState = {};

const background = new Image();
background.src = 'background.jpeg';

/**
 * 	Events
 */
const onMouseMove = (event) => {
    gameState.pointer.x = event.pageX;
    gameState.pointer.y = event.pageY;
}

const onKeyDown = (event) => {
	if (event.code == 'KeyP') {
		if (gameState.partyEnabled) {
			gameState.backgroundColor = '#ffffff';
		}
		gameState.partyEnabled = !gameState.partyEnabled;
	}
}

background.onload = function() {
	gameState.backgroundImage = background;
}

/**
 *  Updates
 */

const queueUpdates = (numTicks) => {
    for (let i = 0; i < numTicks; i++) {
        gameState.lastTick = gameState.lastTick + gameState.tickLength;
        update(gameState.lastTick);
    }
}

const update = (tick) => {

	// Player
    const vx = (gameState.pointer.x - gameState.player.x) / 10
    gameState.player.x += vx

	// Ball
    const ball = gameState.ball
    ball.y += ball.vy
	ball.x += ball.vx
	
	if (gameState.lastTick - ball.lastSpeedIncrease > 30000) {
		ball.vx *= 1.1;
		ball.vy *= 1.1;
		ball.lastSpeedIncrease = gameState.lastTick;
	}

	// Party!
	if (gameState.partyEnabled && gameState.lastTick % 400 < 30) {
		gameState.backgroundColor = generateRandomColor();
	}

	// Score
	const score = gameState.score
	if (gameState.lastTick - score.lastUpdate > 1000) {
		score.value += 1;
		score.lastUpdate = gameState.lastTick;
	}

	// Bonus
	const bonus = gameState.bonus
	const shouldCreateBonus = (gameState.lastTick - bonus.lastInstance) > 5000 && !bonus.isActive;
	
	// create bonus in random place every 15 seconds
	if (shouldCreateBonus) {
		console.log('Should create bonus')
		gameState.bonus = {
			...gameState.bonus,
			...generateNewBonus(gameState.width, gameState.height),
			isActive: true,
			lastInstance: gameState.lastTick,
		}
		console.log(gameState.bonus)
	}
	
	// End of game
	checkBottomCollision(gameState.ball, () => {
		stopGame(gameState.stopCycle);
		setHighScore(gameState.score.value);
	});
	
	updateBall();
	updateBonus();
}

/**
 *  Rendering
 */

const draw = (tFrame) => {
    const context = canvas.getContext('2d');

	if (gameState.partyEnabled) {
		context.fillStyle = gameState.backgroundColor;

		context.fillRect(0, 0, canvas.width, canvas.height);
	} else if (gameState.backgroundImage) {
		context.drawImage(gameState.backgroundImage, 0, 0);
	}

    drawPlatform(context);
    drawBall(context);
    drawScore(context);
	drawBonus(context);
}

const drawPlatform = (context) => {
	const {x, y, width, height, color } = gameState.player;
    context.beginPath();
    context.rect(x - width / 2, y - height / 2, width, height);
    context.fillStyle = color;
    context.fill();
    context.closePath();
}

const drawBall = (context) => {
    const {x, y, radius, color} = gameState.ball;
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();
    context.closePath();
}

const drawScore = (context) => {
	const { value } = gameState.score;
	const highScore = getHighScore() || 0;
	
	const x = 16;
	const y = 16;
	const width = 136;
	const height = 40;

	context.font = "20px sans-serif";

    context.beginPath();
    context.rect(x, y, width, height);
    context.fillStyle = "#000000";
    context.fill();
    context.fillStyle = "#FFFFFF";
    context.textAlign = "center";
    context.fillText(`Score: ${value}`, x + width / 2, y + height / 2 + 6); 
	context.closePath();
	
	context.beginPath();
	context.rect(x, y + 50, width, height);
    context.fillStyle = "#000000";
    context.fill();
    context.fillStyle = "#FFFFFF";
    context.textAlign = "center";
    context.fillText(`High score: ${highScore}`, x + width / 2, y + 50 + height / 2 + 6); 
	context.closePath();

}

const drawBonus = (context) => {
	const {x, y, radius, width, isActive} = gameState.bonus;
	if (isActive) {
		context.beginPath();
		context.rect(x - radius, y - width / 2, 2 * radius, width);
		context.rect(x - width / 2, y - radius, width, 2 * radius);
		context.fillStyle = generateRandomColor();
		context.fill();
		context.closePath();	
	}
}

/**
 *  Collision section
 */

const whenBonusCollidesWithPlatform = (bonus, action) => {
	player = gameState.player;

	leftPlatformPart = player.x - player.width / 2;
	rightPlatformPart = player.x + player.width / 2

	if (
		bonus.y + bonus.radius >= player.y - player.height / 2 && 
		bonus.y < player.y - player.height / 2 &&
		bonus.x >= leftPlatformPart && 
		bonus.x <= rightPlatformPart
	) { 
		action();
	}
}

const checkTopCollision = (ball) => {
	if (ball.y - ball.radius <= 0 &&
		ball.vy < 0){
		ball.vy *= (-1);
		ball.color = generateRandomColor();
	}
}

const checkBottomCollision = (obj, action) => {
	if (obj.y >= canvas.height + obj.radius) {
        action();		
    }
}

const checkWallCollision = (obj, callback) => {
	if (obj.x <= 0 + obj.radius ||				 
		obj.x >= canvas.width - obj.radius) {
        callback();		
    }
}

/**
 * Updates
 */

const updateBonus = () => {
	if (gameState.bonus.isActive) {
		bonus = gameState.bonus;
		
		bonus.y += bonus.vy;
		bonus.x += bonus.vx; 

		player = gameState.player;

		leftPlatformPart = player.x - player.width / 2;
		rightPlatformPart = player.x + player.width / 2

		// Collision with player
		if (
			bonus.y + bonus.radius >= player.y - player.height / 2 && 
			bonus.y < player.y - player.height / 2 &&
			bonus.x >= leftPlatformPart && 
			bonus.x <= rightPlatformPart
		) { 
			gameState.score.value += 15;
			gameState.player.color = generateRandomColor();
			bonus.isActive = false;
		}
		
		checkWallCollision(bonus, () => {
			gameState.bonus.vx *= (-1);
		});
		
		checkBottomCollision(bonus, () => {
			gameState.bonus.isActive = false;
		});
	}
}

const updateBall = () => {
	ball = gameState.ball;
	player = gameState.player;

	leftHalf = player.x - player.width / 2;
	rightHalf = player.x + player.width / 2

	// Player collision
	if (ball.y + ball.radius >= player.y - player.height / 2 && 
		ball.y < player.y - player.height / 2 &&
		ball.x >= leftHalf && 
		ball.x <= rightHalf
	) {  
		const newVx = generateRandomInt(3, 10);
		if (leftHalf <= ball.x && ball.x <= player.x && ball.vx >= 0) {
			ball.vx = newVx * (-1)
		} else if (player.x < ball.x && ball.x <= rightHalf && ball.vx >= 0) {
			ball.vx = newVx;
		} 
		ball.vy *= (-1);
		ball.color = generateRandomColor();
		player.color = generateRandomColor();
	}
	
	checkTopCollision(ball);
	checkWallCollision(ball, () => {
		ball.vx *= (-1);
		ball.color = generateRandomColor();
	});
}

/**
 *  Generators
 */

const generateRandomColor = () => `#${Math.floor(Math.random()*16777215).toString(16)}`;

const generateRandomInt = (min, max) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min; 
  }

const generateNewBonus = (gameWidth, gameHeight) => {
	const radius = generateRandomInt(15, 35);
	return {
		radius,
		x: generateRandomInt(0 + radius, gameWidth - radius),
		y: generateRandomInt(0 + radius, gameHeight / 3),
		width: generateRandomInt(5, 10),
		vx: generateRandomInt(-10, 10),
		vy: generateRandomInt(5, 10), 
	};
}

/**
 *  Highscore
 */

const setHighScore = (highscore) => window.localStorage.setItem('highscore', highscore);

const getHighScore = () => window.localStorage.getItem('highscore');


/**
 *  Game control
 */

const setup = () => {
    canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	gameState.width = canvas.width;
	gameState.height = canvas.height;

	canvas.addEventListener('mousemove', onMouseMove, false);
	window.addEventListener('keydown', onKeyDown, false);

    gameState.lastTick = performance.now();
    gameState.lastRender = gameState.lastTick;
	gameState.tickLength = 15;
	
	gameState.partyEnabled = false;
	gameState.backgroundColor = '#ffffff';

	const platform = {
		width: 300,
		height: 50
	}

    gameState.player = {
        x: 100,
        y: canvas.height - platform.height / 2,
        width: platform.width,
		height: platform.height,
		color: generateRandomColor(),
    };
    gameState.pointer = {
        x: 0,
        y: 0,
    };
    gameState.ball = {
        x: canvas.width / 2,
        y: 0,
		radius: 25,
		color: generateRandomColor(),
        vx: 0,
        vy: 8,
		lastSpeedIncrease: 0,
    };
    gameState.score = {
        x: 5,
        y: 5,
        width: 100,
        height: 36,
        value: 0,
		lastUpdate: 0,
    };
	gameState.bonus = {
		x: 0,
		y: 0,
		radius: 0,
		vx: 0,
		vy: 0,
		width: 0,
		lastInstance: 0,
		isActive: false,
	}
}

const run = (tFrame) => {
    gameState.stopCycle = window.requestAnimationFrame(run);

    const nextTick = gameState.lastTick + gameState.tickLength;
    let numTicks = 0;

    if (tFrame > nextTick) {
        const timeSinceTick = tFrame - gameState.lastTick;
        numTicks = Math.floor(timeSinceTick / gameState.tickLength);
    }
    queueUpdates(numTicks);
    draw(tFrame);
    gameState.lastRender = tFrame;
}

const stopGame = (handle) => window.cancelAnimationFrame(handle);

const newGame = () => {
	setup();
	run();
};

newGame();