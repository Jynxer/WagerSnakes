const { GRID_SIZE } = require('./constants');

module.exports = {
    initGame,
    gameLoop,
    getUpdatedVelocity
}

function initGame() {
    const state = createGameState();
    randomFood(state);
    return(state);
}

function createGameState() {
    return {
        players: [{
            pos: {
                x: 1,
                y: 3
            },
            vel: {
                x: 0,
                y: 1
            },
            snake: [
                {x: 1, y: 1},
                {x: 1, y: 2},
                {x: 1, y: 3}
            ],
        }, {
            pos: {
                x: 28,
                y: 27
            },
            vel: {
                x: 0,
                y: -1
            },
            snake: [
                {x: 28, y: 29},
                {x: 28, y: 28},
                {x: 28, y: 27}
            ],
        }],
        food: {},
        gridsize: GRID_SIZE
    };   
}

function gameLoop(state) {
    if (!state) {
        return;
    }

    // player one from state is stored in playerOne
    const playerOne = state.players[0];
    // player two from state is stored in playerTwo
    const playerTwo = state.players[1];
    // playerOne's x position updated according to x velocity
    playerOne.pos.x += playerOne.vel.x;
    // playerOne's y position updated according to y velocity
    playerOne.pos.y += playerOne.vel.y;
    // playerTwo's x position updated according to x velocity
    playerTwo.pos.x += playerTwo.vel.x;
    // playerTwo's y position updated according to y velocity
    playerTwo.pos.y += playerTwo.vel.y;

    // if playerOne snake dies
    if (playerOne.snake.length <= 0) {
        // 2 indicates that playerTwo has won
        return(2);
    }

    // if playerTwo snake dies
    if (playerTwo.snake.length <= 0) {
        // 1 indicates that playerOne has won
        return(1);
    }

    // if playerOne is out of bounds
    if (playerOne.pos.x < 0 || playerOne.pos.x > GRID_SIZE || playerOne.pos.y < 0 || playerOne.pos.y > GRID_SIZE) {
        // 2 indicates that playerTwo has won
        return(2);
    }

    // if playerTwo is out of bounds
    if (playerTwo.pos.x < 0 || playerTwo.pos.x > GRID_SIZE || playerTwo.pos.y < 0 || playerTwo.pos.y > GRID_SIZE) {
        // 1 indicates that playerOne has won
        return(1);
    }

    // if playerOne is on food
    if (state.food.x == playerOne.pos.x && state.food.y == playerOne.pos.y) {
        // add square to snake
        playerOne.snake.push({ ...playerOne.pos });
        // remove square from other player
        playerTwo.snake.pop();
        // update playerOne's position
        playerOne.pos.x += playerOne.vel.x;
        playerOne.pos.y += playerOne.vel.y;
        // spawn new food
        randomFood(state);
    }

    // if playerTwo is on food
    if (state.food.x == playerTwo.pos.x && state.food.y == playerTwo.pos.y) {
        // add square to snake
        playerTwo.snake.push({ ...playerTwo.pos });
        // remove square from other player
        playerOne.snake.pop();
        // update playerTwo's position
        playerTwo.pos.x += playerTwo.vel.x;
        playerTwo.pos.y += playerTwo.vel.y;
        // spawn new food
        randomFood(state);
    }

    // if playerOne has velocity
    if (playerOne.vel.x || playerOne.vel.y) {
        // for each part of playerOne's snake
        for (let cell of playerOne.snake) {
            // if snake crashes into itself
            if (cell.x == playerOne.pos.x && cell.y == playerOne.pos.y) {
                // playerTwo wins
                return(2);
            }
        }

        // moves snake forwards by adding new position in front of snake and removing last cell from which the snake has moved on
        playerOne.snake.push({ ...playerOne.pos });
        playerOne.snake.shift();
    }

    // if playerTwo has velocity
    if (playerTwo.vel.x || playerTwo.vel.y) {
        // for each part of playerTwo's snake
        for (let cell of playerTwo.snake) {
            // if snake crashes into itself
            if (cell.x == playerTwo.pos.x && cell.y == playerTwo.pos.y) {
                // playerOne wins
                return(1);
            }
        }

        // moves snake forwards by adding new position in front of snake and removing last cell from which the snake has moved on
        playerTwo.snake.push({ ...playerTwo.pos });
        playerTwo.snake.shift();
    }

    // no winner yet
    return(false);
}

function randomFood(state) {
    food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
    }
    
    for (let cell of state.players[0].snake) {
        if (cell.x == food.x && cell.y == food.y) {
            return(randomFood(state));
        }
    }

    for (let cell of state.players[1].snake) {
        if (cell.x == food.x && cell.y == food.y) {
            return(randomFood(state));
        }
    }

    state.food = food;
}

function getUpdatedVelocity(keyCode) {
    switch (keyCode) {
        case 37: { // left
            return({ x: -1, y: 0 });
        }
        case 38: { // down
            return({ x: 0, y: -1 });
        }
        case 39: { // right
            return({ x: 1, y: 0 });
        }
        case 40: { // up
            return({ x: 0, y: 1 });
        }
    }
}