var express = require('express');
var http = require('http');
const { initGame, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE } = require('./constants');
const { makeId } = require('./utils');

const state = {};
const clientRooms = {};

var globalGrab = "";

var balances = [];
var wagers = [];

var app = express();

//app.get('/', (req, res) => res.send("Hello world!"));

var server = http.Server(app);
server.listen(process.env.PORT || 3000);

var io = require('socket.io')(server, {transports: ['websocket']});

app.use(express.static('public'));

console.log("My socket server is running!");

io.on('connection', (client) => {

    //console.log(client.id);

    client.on('keydown', handleKeydown);
    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);
    client.on('rematch', handleRematch);
    client.on('signUp', handleSignUp);
    client.on('logIn', handleLogIn);
    client.on('createWager', handleCreateWager);
    client.on('joinWager', handleJoinWager);
    client.on('won', handleWon);
    client.on('refund', handleRefund);

    function handleRefund(data) {
        data = JSON.parse(data);
        var user = data.username;
        var room = data.room;
        var wagerAmount = 0;
        for (var i = 0; i < wagers.length; i++) {
            if (wagers[i].room == room) {
                wagerAmount = wagers[i].wager;
                wagers[i] = {};
                for (var j = 0; j < balances.length; j++) {
                    if (balances[j].username = user) {
                        balances[j].balance = parseFloat(balances[j].balance) + parseFloat(wagerAmount);
                        client.emit('refund', balances[j].balance);
                    }
                }
            }
        }
    }

    function handleWon(data) {
        data = JSON.parse(data);
        var user = data.username;
        var room = data.room;
        for (var i = 0; i < balances.length; i++) {
            if (balances[i].username == user) {
                balances[i].balance = data.balance;
                console.log(data.balance);
                for (var j = 0; j < wagers.length; j++) {
                    if (wagers[j].room == room) {
                        wagers[j] = {};
                    }
                }
            }
        }
    }

    function handleJoinWager(data) {
        data = JSON.parse(data);
        var code = data.code;
        var user = data.user;
        var found = false;
        for (var i = 0; i < wagers.length; i++) {
            if (wagers[i].room == code) {
                for (var j = 0; j < balances.length; j++) {
                    if (balances[j].username == user) {
                        if (balances[j].balance >= wagers[i].wager) {
                            balances[j].balance = parseFloat(balances[j].balance) - parseFloat(wagers[i].wager);
                            client.emit('acceptedWager', balances[j].balance);
                            //console.log(balances[j].balance);
                            found = true;
                        }
                    }
                }
            }
        }
        //console.log(found);
    }

    function handleCreateWager(data) {
        data = JSON.parse(data);
        var code = data.room;
        var user = data.user;
        var wagerAmount = data.wager;

        for (var i = 0; i < balances.length; i++) {
            if (balances[i].username == user) {
                if (balances[i].balance >= wagerAmount) {
                    wagers.push({ room: code, username: user, wager: wagerAmount });
                    //console.log(wagers);
                    balances[i].balance = parseFloat(balances[i].balance) - parseFloat(wagerAmount);
                    client.emit('createdWager', balances[i].balance);
                }
            }
        }
    }

    function handleLogIn(username) {
        var found = false;
        for (var i = 0; i < balances.length; i++) {
            if (balances[i].username == username) {
                found = true;
                client.emit('logIn', {username: balances[i].username, balance: balances[i].balance});
            }
        }
        if (!found) {
            client.emit('unknownUser');
        }
    }

    function handleSignUp(username) {
        balances.push({ username: username, balance: 100 });
        console.log(balances);
    }

    function handleRematch() { 
        if (globalGrab == "") {
            handleNewGame();
        } else {
            handleJoinGame(globalGrab);
        }
    }

    function handleJoinGame(gameCode) {
        
        const room = io.sockets.adapter.rooms[gameCode];

        let clients;
        if (room) {
            clients = room.sockets;
        }

        let numClients;
        if (clients) {
            numClients = Object.keys(clients).length;
        }

        if (numClients == 0) {
            client.emit('unknownGame');
            return;
        } else if (numClients > 1) {
            client.emit('tooManyPlayers');
            return;
        }

        clientRooms[client.id] = gameCode;

        client.emit('gameCode', gameCode);

        client.join(gameCode);
        client.number = 2;
        client.emit('init', 2);


        globalGrab = "";

        startGameInterval(gameCode);
    }

    function handleNewGame() {
        let roomName = makeId(5);
        globalGrab = roomName;
        clientRooms[client.id] = roomName;
        client.emit('gameCode', roomName);
        client.emit('initWager', roomName);

        state[roomName] = initGame();

        client.join(roomName);
        client.number = 1;
        client.emit('init', 1);
    }

    function handleKeydown(keyCode) {
        const roomName = clientRooms[client.id];

        if (!roomName) {
            return;
        }

        try {
            keyCode = parseInt(keyCode);
        } catch (e) {
            console.error(e);
            return;
        }

        const vel = getUpdatedVelocity(keyCode);

        if (vel) {
            if (state[roomName]) {
                // check polar change condition
                if (vel.x != (-1 * state[roomName].players[client.number - 1].vel.x) && vel.y != (-1 * state[roomName].players[client.number - 1].vel.y)) {
                    // update player's velocity
                    state[roomName].players[client.number - 1].vel = vel;
                }
            }
        }
    }

});

function startGameInterval(roomName) {
    const intervalId = setInterval(() => {
        const winner = gameLoop(state[roomName]);

        if (!winner) {
            emitGameState(roomName, state[roomName]);
        } else {
            emitGameOver(roomName, winner);
            state[roomName] = null;
            clearInterval(intervalId);   
        }
    }, 1000 / FRAME_RATE);
}

function emitGameState(roomName, state) {
    io.sockets.in(roomName).emit('gameState', JSON.stringify(state));
}

function emitGameOver(roomName, winner) {
    var wagerAmount = 0;
    for (var i = 0; i < wagers.length; i++) {
        if (wagers[i].room == roomName) {
            wagerAmount = wagers[i].wager;
            wagers[i] = {};
        }
    }
    io.sockets.in(roomName).emit('gameOver', JSON.stringify({ winner: winner, wager: wagerAmount }));
}