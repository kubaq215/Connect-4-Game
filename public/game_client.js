var game_board = new Array(6).fill(0).map(() => new Array(7).fill(0));
let html_board = document.getElementById('board');
var yourColor;
var yourTurn;
var opponentColor;
var gameMakingSuccess = false;
let moveInfo = document.getElementById('move-info');

function createPiece(color) {
    const piece = document.createElement('div');
    piece.classList.add('piece');
    piece.style.backgroundColor = color;
    return piece;
}

function placePiece(column, yourColor) {
    isPlaced = false;
    for (let i = 5; i >= 0; i--) {
        if (!game_board[i][column]) {
            game_board[i][column] = 1;
            piece = createPiece(yourColor);
            html_board.rows[i].cells[column].appendChild(piece);
            isPlaced = true;
            break;
        }
    }
    return isPlaced;
}

function resetBoard() {
    yourTurn = false;
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            game_board[i][j] = 0;
            html_board.rows[i].cells[j].innerHTML = '';
        }
    }
}

function recoverBoard(board) {
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            if (board[i][j] === 2) {
                piece = createPiece(yourColor);
                html_board.rows[i].cells[j].appendChild(piece);
                game_board[i][j] = 1;
            } else if (board[i][j] === 1) {
                piece = createPiece(opponentColor);
                html_board.rows[i].cells[j].appendChild(piece);
                game_board[i][j] = 1;
            }
        }
    }
}

// ----------------------------------------------------------------
// Communication with the server --------------------------------

// const port = location.port;

var address = location.hostname + ":" + location.port;

const socket = io(address);

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('You start', () => {
    yourColor = 'red';
    opponentColor = 'greenyellow';
})

socket.on('You dont start', () => {
    yourColor = 'greenyellow';
    opponentColor = 'red';
    moveInfo.innerText = "Opponent's turn";
})

socket.on('Your turn', () => {
    yourTurn = true;
    moveInfo.innerText = 'Your turn';
})

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

socket.on('opponentMove', (column) => {
    placePiece(column, opponentColor);
});

socket.on('gameOver', (outcome) => {
    moveInfo.innerText = outcome;
});

socket.on('newGame', () => {
    resetBoard();
});

socket.on('idAlreadyExists', () => {
    alert('This ID is already taken');
});

socket.on('invalidGame', () => {
    alert('Game with this ID does not exist');
});

socket.on('invalidPassword', () => {
    alert('Invalid password');
});

socket.on('fullGame', () => {
    alert('Game already full');
});

socket.on('playerLeft', () => {
    alert('Opponent has left the game');
    resetBoard();
    socket.emit('leaveGame');
    moveInfo.innerText = '';

    // Hide game board -> Show lobby buttons
    header.style.display = 'flex';
    lobbyBtn_holder.style.display = 'flex';
    game_wrapper.style.display = 'none';
});

// ----------------------------------------------------------------
// Making a move -----------------------------------------------

html_board.addEventListener('click', function (event) {
    if (event.target.tagName !== 'TD' || !yourTurn) {
        return;
    }
    // Find the column that was clicked
    const column = event.target.cellIndex;
    // Place the piece in the first available row in the column
    if (placePiece(column, yourColor)) {
        socket.emit('placePiece', column);
        yourTurn = false;
        moveInfo.innerText = "Opponent's turn";
    }
});


// ----------------------------------------------------------------
// Handling lobby -----------------------------------------------

lobbyBtn_holder = document.getElementById('lobby-btn-holder');

joinGame_btn = document.getElementById('join-game');
createGame_btn = document.getElementById('create-game');

joinGame_container = document.getElementById('join-game-container');
createGame_container = document.getElementById('create-game-container');

joinGame_form = document.getElementById('join-game-form');
createGame_form = document.getElementById('create-game-form');

return_btns = document.getElementsByClassName('return-btn');

// Hide lobby buttons -> Show form
joinGame_btn.addEventListener('click', () => {
    lobbyBtn_holder.style.display = 'none';
    joinGame_container.style.display = 'block';
});

// Hide lobby buttons -> Show form
createGame_btn.addEventListener('click', () => {
    lobbyBtn_holder.style.display = 'none';
    createGame_container.style.display = 'block';
});

// Hide form -> Show lobby buttons
for (const btn of return_btns) {
    btn.addEventListener('click', () => {
        lobbyBtn_holder.style.display = 'flex';
        joinGame_container.style.display = 'none';
        createGame_container.style.display = 'none';
    });
}

// ----------------------------------------------------------------
// Transition to game -----------------------------------------------

lobby_wrapper = document.getElementById('lobby-wrapper');
game_wrapper = document.getElementById('game-wrapper');
header = document.getElementsByTagName('h1')
body = document.getElementsByTagName('body');

header = header[0];
body = body[0];

joinGame_form.addEventListener('submit', (event) => {
    event.preventDefault();
    const gameId = document.getElementById('join-game-id').value;
    const password = document.getElementById('join-password').value;
    data = {
        gameId: gameId,
        password: password
    }
    socket.emit('joinGame', (JSON.stringify(data)));
});

createGame_form.addEventListener('submit', (event) => {
    event.preventDefault();
    const gameId = document.getElementById('create-game-id').value;
    const password = document.getElementById('create-password').value;
    data = {
        gameId: gameId,
        password: password
    }
    socket.emit('createGame', (JSON.stringify(data)));
});

// Hide header and form -> Show game board
socket.on('gameMakingSuccess', () => {
    header.style.display = 'none';
    createGame_container.style.display = 'none';
    joinGame_container.style.display = 'none';
    game_wrapper.style.display = 'block';
    moveInfo.innerText = 'Waiting for opponent';
});

// ----------------------------------------------------------------
// Game board buttons -----------------------------------------------

newGame_btn = document.getElementById('new-game');
leaveGame_btn = document.getElementById('leave-game');

newGame_btn.addEventListener('click', () => {
    resetBoard();
    socket.emit('newGame');
});

leaveGame_btn.addEventListener('click', () => {
    resetBoard();
    socket.emit('leaveGame');
    moveInfo.innerText = '';

    // Hide game board -> Show lobby buttons
    header.style.display = 'flex';
    lobbyBtn_holder.style.display = 'flex';
    game_wrapper.style.display = 'none';
});

// ----------------------------------------------------------------
// Proccessing star reviews -----------------------------------------------

starContainer = document.getElementsByClassName('rate');
textReview = document.getElementById('review');
rating = document.getElementsByName('rate');

for (var i = 0; i < rating.length; i++) {
    rating[i].onclick = function () {
        starRating = this.value;
        socket.emit('starRating', starRating);
    };
};

socket.on('avgRating', (avgRating) => {
    starContainer[0].style.display = 'none';
    textReview.innerText = 'Thank you for feedback!\n Average rating: ' + avgRating + '/5';
});