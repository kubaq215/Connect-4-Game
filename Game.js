class Game {
    constructor(gameId, password) {
        this.gameId = gameId;
        this.password = password;
        this.players = [];
        this.firstPlayer = 0;
        this.secondPlayer = 1;
        this.isAbandoned = false;
        this.hasStarted = false;
        this.gameState = {
            turn: 0,
            board: [
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0]
            ]
        }     
        console.log('game created id: ' + this.gameId);
    }

    getNumberOfPlayers() {
        return this.players.length;
    }

    hasTwoPlayers() {
        return this.players.length === 2;
    }

    start() {
        this.players[this.firstPlayer].emit('You start');
        this.players[this.secondPlayer].emit('You dont start');
        this.players[this.firstPlayer].emit('Your turn');
    }
    
    addPlayer(player) {
        if(!(player in this.players)) {
            this.players.push(player);
        }
    }

    removePlayer(player) {
        this.players = this.players.filter(p => p!== player);
        if (this.players.length === 0) {
            this.isAbandoned = true;
            console.log('game deleted id: ' + this.gameId);
        }
    }

    getAnotherPlayer(player) {
        return this.players[(this.players.indexOf(player) + 1) % this.players.length];
    }

    getId() {
        return this.gameId;
    }

    getTurn() {
        return this.gameState.turn;
    }

    getBoard() {
        return this.gameState.board;
    }

    changeTurn() {
        this.gameState.turn = (this.gameState.turn === 0) ? 1 : 0;
    }

    newGame() {
        let tmp = this.firstPlayer;
        this.firstPlayer = this.secondPlayer;
        this.secondPlayer = tmp;
        this.gameState.turn = this.firstPlayer;
        this.gameState.board = [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0]
        ];
    }

    checkWin(playerTurn) {
        let board = this.gameState.board;
        // Check for horizontal win
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 4; j++) {
                if (board[i][j] === playerTurn &&
                    board[i][j + 1] === playerTurn &&
                    board[i][j + 2] === playerTurn &&
                    board[i][j + 3] === playerTurn) {
                    return true;
                }
            }
        }
        // Check for vertical win
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 7; j++) {
                if (board[i][j] === playerTurn &&
                    board[i + 1][j] === playerTurn &&
                    board[i + 2][j] === playerTurn &&
                    board[i + 3][j] === playerTurn) {
                    return true;
                }
            }
        }
        // Check for diagonal win (top-left to bottom-right)
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 4; j++) {
                if (board[i][j] === playerTurn &&
                    board[i + 1][j + 1] === playerTurn &&
                    board[i + 2][j + 2] === playerTurn &&
                    board[i + 3][j + 3] === playerTurn) {
                    return true;
                }
            }
        }
        // Check for diagonal win (top-right to bottom-left)
        for (let i = 0; i < 3; i++) {
            for (let j = 6; j > 2; j--) {
                if (board[i][j] === playerTurn &&
                    board[i + 1][j - 1] === playerTurn &&
                    board[i + 2][j - 2] === playerTurn &&
                    board[i + 3][j - 3] === playerTurn) {
                    return true;
                }
            }
        }
        return false;
    }
    
    checkDraw() {
        let board = this.gameState.board;
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 7; j++) {
                if (!board[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }

    handlePlacePiece(column) {
        this.hasStarted = true;
        let board = this.gameState.board;
        let turn = this.getTurn();
        for (let i = 5; i >= 0; i--) {
            if (!board[i][column]) {
                board[i][column] = turn + 1;
                break;
            }
        }

        const isWin = this.checkWin(turn + 1);
        const isDraw = this.checkDraw();
        let outcome = "";
        if (isWin) {
            outcome = "Player" + (turn+1) + " wins!";
        }
        if (isDraw) {
            outcome = "Draw!";
        }
        
        this.changeTurn()
        turn = this.getTurn();
        this.players[turn].emit('opponentMove', column);

        if (outcome) {
            this.players[0].emit('gameOver', outcome);
            this.players[1].emit('gameOver', outcome);
        }
        else {
            this.players[turn].emit('Your turn');
        }
    }
}

module.exports = Game