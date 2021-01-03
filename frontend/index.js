const BG_COLOUR = '#222222';
const SNAKE_COLOUR = 'blue';
const SNAKE_COLOUR_TWO = '#E600FF';
const FOOD_COLOUR = '#FFC107';

var socket = io.connect('https://intense-dawn-71103.herokuapp.com/', {transports: ['websocket']});

socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownGame', handleUnknownGame);
socket.on('tooManyPlayers', handleTooManyPlayers);
socket.on('logIn', handleLogIn);
socket.on('unknownUser', handleUnknownUser);
socket.on('createdWager', handleWager);
socket.on('initWager', handleInitWager);
socket.on('acceptedWager', handleWager);
socket.on('refunded', handleWager);

const front = document.getElementById('front');
const gameScreen = document.getElementById('gameScreen');
const menuScreen = document.getElementById('menuScreen');
const logInScreen = document.getElementById('logInScreen');
const signUpScreen = document.getElementById('signUpScreen');
const newGameButton = document.getElementById('newGameButton');
const joinGameButton = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const winner = document.getElementById('winner');
const rematchButton = document.getElementById('rematchButton');
const returnButton = document.getElementById('returnButton');
const bodyId = document.getElementById('bodyId');
const logInButton = document.getElementById('logInButton');
const signUpButton = document.getElementById('signUpButton');
const logInButtonTwo = document.getElementById('logInButtonTwo');
const signUpButtonTwo = document.getElementById('signUpButtonTwo');
const logInUsernameInput = document.getElementById('logInUsernameInput');
const signUpUsernameInput = document.getElementById('signUpUsernameInput');
const success = document.getElementById('success');
const returnToMenuButton = document.getElementById('returnToMenuButton');
const returnToMenuButtonTwo = document.getElementById('returnToMenuButtonTwo');
const stuffToHide = document.getElementById('stuffToHide');
const accountUsername = document.getElementById('accountUsername');
const accountBalance = document.getElementById('accountBalance');
const logOutButton = document.getElementById('logOutButton');
const wagerAmountInput = document.getElementById('wagerAmountInput');

newGameButton.addEventListener('click', newGame);
joinGameButton.addEventListener('click', joinGame);
rematchButton.addEventListener('click', rematch);
returnButton.addEventListener('click', returnToMenuFromGame);
logInButton.addEventListener('click', logIn);
signUpButton.addEventListener('click', signUp);
signUpButtonTwo.addEventListener('click', signUpTwo);
returnToMenuButton.addEventListener('click', returnToMenu);
returnToMenuButtonTwo.addEventListener('click', returnToMenu);
logInButtonTwo.addEventListener('click', logInTwo);
logOutButton.addEventListener('click', logOut);

let canvas, ctx;
let playerNumber, username, currRoom, balance;
let gameActive = false;

function logOut() {
    bodyId.style.backgroundColor = '#512DA8';
    front.style.display = "block";
    gameScreen.style.display = "none";
    menuScreen.style.display = "none";
    logInScreen.style.display = "none";
    signUpScreen.style.display = "none";
    accountUsername.innerText = "Not Logged In";
    accountBalance.innerText = "";
    logOutButton.style.display = "none";
    username = "";
    console.log("Logged Out!");
}

function logInTwo() {
    username = logInUsernameInput.value;
    socket.emit('logIn', username);
}

function logIn() {
    bodyId.style.backgroundColor = '#512DA8';
    front.style.display = "none";
    gameScreen.style.display = "none";
    menuScreen.style.display = "none";
    logInScreen.style.display = "block";
    signUpScreen.style.display = "none";
} 

function signUp() {
    bodyId.style.backgroundColor = '#512DA8';
    front.style.display = "none";
    gameScreen.style.display = "none";
    menuScreen.style.display = "none";
    logInScreen.style.display = "none";
    signUpScreen.style.display = "block";
    signUpUsernameInput.style.display = "block";
    signUpButtonTwo.style.display = "block";
    success.style.display = "none";
}

function signUpTwo() {
    bodyId.style.backgroundColor = '#512DA8';
    var username = signUpUsernameInput.value;
    socket.emit('signUp', username);
    signUpUsernameInput.style.display = "none";
    signUpButtonTwo.style.display = "none";
    success.style.display = "block";
    returnToMenuButton.style.display = "block";
    success.innerText = "Welcome " + username + "!";
    bodyId.style.backgroundColor = 'green';
}

function rematch() {
    bodyId.style.backgroundColor = '#512DA8';
    front.style.display = "none";
    gameScreen.style.display = "none";
    menuScreen.style.display = "none";
    logInScreen.style.display = "none";
    signUpScreen.style.display = "none";
    socket.emit('rematch');
    init();
}

function returnToMenu() {
    bodyId.style.backgroundColor = '#512DA8';
    front.style.display = "block";
    gameScreen.style.display = "none";
    menuScreen.style.display = "none";
    logInScreen.style.display = "none";
    signUpScreen.style.display = "none";
}

function newGame() {
    socket.emit('newGame');
    bodyId.style.backgroundColor = SNAKE_COLOUR;
    init();
}

function joinGame() {
    const code = gameCodeInput.value;
    handleGameCode({ code: code, user: username });
    socket.emit('joinWager', JSON.stringify({ code: code, user: username }));
    socket.emit('joinGame', code);
    bodyId.style.backgroundColor = SNAKE_COLOUR_TWO;
    init();
}

function init() {
    front.style.display = "none";
    gameScreen.style.display = "block";
    menuScreen.style.display = "none";
    logInScreen.style.display = "none";
    signUpScreen.style.display = "none";

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = canvas.height = 600;

    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    document.addEventListener('keydown', keydown);
    gameActive = true;
}

function keydown(e) {
    socket.emit('keydown', e.keyCode);
}

function paintGame(state) {
    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const food = state.food;
    const gridsize = state.gridsize;
    const size = canvas.width / gridsize;

    ctx.fillStyle = FOOD_COLOUR;
    ctx.fillRect(food.x * size, food.y * size, size, size);

    paintPlayer(state.players[0], size, SNAKE_COLOUR);
    paintPlayer(state.players[1], size, SNAKE_COLOUR_TWO);
}

function paintPlayer(playerState, size, colour) {
    const snake = playerState.snake;

    ctx.fillStyle = colour;
    for (let cell of snake) {
        ctx.fillRect(cell.x * size, cell.y * size, size, size);
    }
}

function handleInit(number) {
    playerNumber = number;
}

function handleGameState(gameState) {
    if (!gameActive) {
        return;
    }

    gameState = JSON.parse(gameState);

    requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
    if (!gameActive) {
        return;
    }

    data = JSON.parse(data);

    if (data.winner == playerNumber) {
        bodyId.style.backgroundColor = 'green';
        winner.innerText = "You Win!";
        var newBal = (parseFloat(balance) + parseFloat(data.wager) + parseFloat(data.wager));
        accountBalance.innerText = "Coins:  " + newBal;
        socket.emit('won', JSON.stringify({ username: username, room: currRoom, balance: newBal }));
    } else {
        bodyId.style.backgroundColor = 'red';
        winner.innerText = "You Lose!";
    }

    winner.style.display = "block";
    //rematchButton.style.display = "block";
    returnButton.style.display = "block";

    gameActive = false;
}

function handleGameCode(gameCode) {
    gameCodeDisplay.innerText = gameCode;
    currRoom = gameCode;
}

function handleUnknownGame() {
    reset();
    console.log("Unknown Game Code");
}

function handleTooManyPlayers() {
    reset();
    console.log("Game Already In Progress");
}

function reset() {
    playerNumber = null;
    gameCodeInput.value = "";
    winner.innerText = "";
    bodyId.style.backgroundColor = '#512DA8';
    menuScreen.style.display = "block";
    gameScreen.style.display = "none";
}

function handleLogIn(account) {
    bodyId.style.backgroundColor = '#512DA8';
    front.style.display = "none";
    gameScreen.style.display = "none";
    menuScreen.style.display = "block";
    logInScreen.style.display = "none";
    signUpScreen.style.display = "none";
    accountUsername.innerText = account.username;
    balance = account.balance;
    accountBalance.innerText = "Coins:  " + account.balance;
    logOutButton.style.display = "block";
    console.log("Logged In!");
}

function handleUnknownUser() {
    accountUsername.innerText = "Unknown Username";
    accountBalance.innerText = "Try Again"
}

function handleWager(newBalance) {
    balance = newBalance;
    console.log("New Balance = " + newBalance);
    accountBalance.innerText = "Coins:  " + newBalance;
    // Show wager amount during game
}

function handleInitWager(code) {
    var wagerAmount = wagerAmountInput.value;
    if (parseFloat(wagerAmount) > 0) {
        socket.emit('createWager', JSON.stringify({ room: code, user: username, wager: wagerAmount }));
    } else {
        socket.emit('createWager', JSON.stringify({ room: code, user: username, wager: 0 }));
    }
    
}

function returnToMenuFromGame() {
    if (gameActive) {
        socket.emit('refund', JSON.stringify({ username: username, room: currRoom }));
    }
    playerNumber = null;
    gameCodeInput.value = "";
    winner.innerText = "";
    bodyId.style.backgroundColor = '#512DA8';
    menuScreen.style.display = "block";
    gameScreen.style.display = "none";
}