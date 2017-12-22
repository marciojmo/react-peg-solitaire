import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

// Game constants
var BOARD_SIZE = 7;
var WALL = 'wall', EMPTY = 'empty', PIECE = 'piece';

/** Renders a Square */
function Square(props) {
  return (
    <button className={props.classes} onClick={props.onClick}>
    </button>
  );
}

// A class that represents a game board
class Board extends React.Component {
  /** Renders the Board */
  render() {
    // creates an array with BOARD_SIZE elements, filled
    // with its indexes
    let board_indexes = Array(BOARD_SIZE);
    for (let i = 0; i < BOARD_SIZE; i++ ) {
      board_indexes[i] = i;
    }

    let sr = this.props.sR;
    let sc = this.props.sC;

    return (
      <div className="board">
      {
        board_indexes.map( (row) => {
         return <div key={row} className="board-row">
            {
              board_indexes.map( (col) => {
                return <Square key={row*BOARD_SIZE+col}
                  classes={
                    "square "
                    + this.props.squares[row][col]
                    + ' '
                    + ( row == sr && col == sc ? 'selected' : '' )
                  }
                  onClick={() => this.props.onClick(row,col)}
                />
              })
            }
            </div>
        })
      }
      </div>
    );

  }
}

// A class that represents a game
class Game extends React.Component {

  /**
 * Represents a game.
 * @constructor
 * @param {string} props - The game properties
 * State variables description:
 * history: holds the history of the board across player moves
 * stepNumber: The current "step" in history. Ex: 0 is the begining
 * of the game. 1 is the first movement and so on..
 * selectedSquares: Holds the coordinates of the selected square.
 * (-1,-1) means no selection.
 */
  constructor( props ) {
    super( props );
    this.state = {
      history: [{
        squares: makeInitialBoard( BOARD_SIZE )
      }],
      stepNumber: 0,
      selectedSquares: [-1,-1],
    };
  }

  /**
   * Click handler. Processes the logic of a click in a square.
   * @param {int} r - The row of the click.
   * @param {int} c - The column of the click.
   */
  handleClick( r, c ) {

    // Make a copy of important state data
    const history = this.state.history.slice( 0, this.state.stepNumber + 1 );
    const current = history[history.length - 1];
    // the slice method doesn't "clone" a multidimensional array =/
    const squares = current.squares.map(function(arr) {
        return arr.slice();
    });
    const selectedRow = this.state.selectedSquares[0];
    const selectedCol = this.state.selectedSquares[1];
    const hasPreviousSelection = (selectedRow != -1 && selectedCol != -1);

    // Nothing to do if the game is over
    if ( isGameOver( squares ) ) {
      return;
    }

    // If the user selects a piece, updates the state
    // of the game with the selected piece and return
    if ( squares[r][c] == PIECE ) {
      // If the user clicks on the same piece, deselects it
      if ( r == selectedRow && c == selectedCol ) {
        this.setState({
          selectedSquares: [-1,-1],
        });
      }
      else {
        this.setState({
          selectedSquares: [r,c]
        });
      }
    }

    // If the user selects an empty square and has previous selection
    // validates the movement and updates the game state
    if ( squares[r][c] == EMPTY && hasPreviousSelection ) {

      // Checks if the movement is valid
      let isAligned = false;
      let allowedPositions = [
        [selectedRow-2,selectedCol],  // up
        [selectedRow+2,selectedCol],  // down
        [selectedRow,selectedCol-2],  // left
        [selectedRow,selectedCol+2],  // right
      ];

      for ( let pos of allowedPositions ) {
        let tr = pos[0], tc = pos[1];
        if ( tr == r && tc == c ) {
          isAligned = true;
          break;
        }
      }

      let midRow = r-Math.sign(r-selectedRow);
      let midCol = c-Math.sign(c-selectedCol);

      // Checks if there is a piece to be "eaten" between the movement
      if ( isAligned && squares[ midRow ][ midCol ] == PIECE ) {
        // Update the game state with the new action
        squares[midRow][midCol] = EMPTY;
        squares[selectedRow][selectedCol] = EMPTY;
        squares[r][c] = PIECE;
        this.setState({
          history: history.concat([{
            squares: squares,
          }]),
          stepNumber: history.length,
          selectedSquares : [-1,-1],
        });
      }
    }
  }

  /**
   * Changes the state of the game to the "step" time in history.
   * @param {Number} step - The step to jump to.
   */
  jumpTo(step) {
    this.setState({
      stepNumber: step,
      selectedSquares : [-1,-1],
    });
  }

  /** Renders the game */
  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = isGameOver( current.squares );

    const moves = history.map( (step, move) => {
      const desc = move ? 'Go to move #' + move : 'Go to game start';
      return (
        <li key={move}>
          <button onClick={() => this.jumpTo(move)}>{desc}</button>
        </li>
      );
    });


    // Alert if the game is over
    if ( winner ) {
      alert("You win!");
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board squares={current.squares}
            sR={this.state.selectedSquares[0]}
            sC={this.state.selectedSquares[1]}
            onClick={(r,c)=>this.handleClick(r,c)}/>
        </div>
        <div className="game-info">
          <ol>{moves}</ol>
        </div>
      </div>
    );
  }
}

/**
 * Creates the initial peg-solitaire board configuration.
 * @param {Number} size - The size of the board
 * @return A multidimensional array size X size in a peg-solitaire configuration.
 */
function makeInitialBoard( size ) {
  let board = [];
  for ( let r = 0; r < size; r++ ) {
    let row = [];
    for ( let c = 0; c < size; c++ ) {
      let value = WALL;
      let halfBoard = Math.floor( size / 2 );
      let halfRemaining = (size-halfBoard) / 2;
      // Calculating the correct value for r,c
      if ( r == c && r == halfBoard ) {
        value = EMPTY;
      }
      else if ( r >= halfRemaining && r < size - halfRemaining ||
        c >= halfRemaining && c < size - halfRemaining ) {
        value = PIECE;
      }
      // push
      row.push( value );
    }
    board.push(row);
  }
  return board;
}

/**
 * Check if the player has won a peg-solitaire game.
 * @param {Array} squares - A multidimensional array with
 * the game configuration
 */
function isGameOver(squares) {
  let halfBoard = Math.floor( squares.length / 2 );
  let count = 0;
  for ( let r = 0; r < squares.length; r++ ) {
    for ( let c = 0; c < squares.length; c++ ) {
      if ( squares[r][c] == PIECE )
        count++;
    }
  }
  return (squares[halfBoard][halfBoard] == PIECE && count == 1 );
}

//////////////////////////////////////////////////
ReactDOM.render(
  <Game />,
  document.getElementById('root')
);
