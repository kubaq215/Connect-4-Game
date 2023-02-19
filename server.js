const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const Game = require('./Game');
const SSHConnection = require('./DBConnection');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(require('cors')())
   .use(express.static('public'))
   .get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log('Server started on port ' + port);
});

function addNewRating(rating) {
    SSHConnection.then((connection) => {
        // Insert a new record into a table on the remote MySQL server
        const newRecord = { ID: null, starCount: rating };
        connection.query('INSERT INTO reviews SET ?', newRecord, (error, results, fields) => {
            if (error) throw error;
            console.log('New record inserted with ID', results.insertId);
        });
    }).catch((error) => {
        console.error(error);
    });
};

function getAverageRatingPromise() {
    return new Promise((resolve, reject) => {
        SSHConnection.then((connection) => {
            connection.query('SELECT AVG(starCount) FROM `reviews`', (error, results, fields) => {
                if (error) reject(error);
                else {
                    const avgRating = parseFloat(results[0]['AVG(starCount)']).toFixed(2);
                    resolve(avgRating);
                }
            });
        }).catch((error) => {
            reject(error);
        });
    });
}

async function getAverageRating() {
    try {
        const avgRating = await getAverageRatingPromise();
        return avgRating;
    } catch (error) {
        console.error(error);
    }
}

let games = [];

io.on('connection', (socket) => {
    var game;
    socket.on('createGame', (data) => {
        data = JSON.parse(data);
        // check whether gameId is already used in diffrent game
        if (!data.gameId) return;
        if (games.find(g => g.gameId === data.gameId)) {
            socket.emit('idAlreadyExists');
            return;
        }
        game = new Game(data.gameId, data.password);
        game.addPlayer(socket)
        games.push(game);
        socket.emit('gameMakingSuccess');
        console.log('New player joined game: ' + game.gameId);
    });

    socket.on('joinGame', (data) => {
        data = JSON.parse(data);
        if (!data.gameId) return;
        game = games.find(g => g.gameId === data.gameId);
        if (!game) {
            socket.emit('invalidGame');
            return;
        } else if (game.getNumberOfPlayers() >= 2) {
            socket.emit('fullGame');
            return;
        } else if (game.password !== data.password) {
            socket.emit('invalidPassword');
            return;
        } else {
            game.addPlayer(socket);
            socket.emit('gameMakingSuccess');
            game.start();
        }
        console.log('New player joined game: ' + game.gameId);
    });

    socket.on('newGame', () => {
        game.newGame();
        game.getAnotherPlayer(socket).emit('newGame');
        if (game.hasTwoPlayers()) {
            game.start();
        }
    });

    socket.on('leaveGame', () => {
        if (game.hasTwoPlayers()) {
            game.getAnotherPlayer(socket).emit('playerLeft');
        }
        game.removePlayer(socket);
        if (game.isAbandoned) {
            games = games.filter(g => g.gameId !== game.gameId);
            delete game;
        }
    });

    socket.on('placePiece', (column) => {
        game.handlePlacePiece(column);
    });

    socket.on('starRating', (starRating) => {
        addNewRating(starRating);
        getAverageRating().then((avgRating) => {
            socket.emit('avgRating', avgRating);
        });
        // socket.emit('avgRating', getAverageRating());
    });

    socket.on('disconnect', () => {
        if (game) {
            if (game.hasTwoPlayers()) {
                game.getAnotherPlayer(socket).emit('playerLeft');
            }
            game.removePlayer(socket);
            if (game.isAbandoned) {
                games = games.filter(g => g.gameId !== game.gameId);
                delete game;
            }
        }
        console.log('Player disconnected');
    });
});