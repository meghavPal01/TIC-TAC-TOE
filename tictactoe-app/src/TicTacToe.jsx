import { useState, useCallback } from "react";
import "./TicTacToe.css";
const WIN_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getWinner(board) {
  for (const [a, b, c] of WIN_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a], combo: [a, b, c] };
    }
  }
  return null;
}

function minimax(board, isMaximizing, depth) {
  const w = getWinner(board);
  if (w) return w.player === "X" ? 10 - depth : depth - 10;
  if (board.every((c) => c)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "X";
        best = Math.max(best, minimax(board, false, depth + 1));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "O";
        best = Math.min(best, minimax(board, true, depth + 1));
        board[i] = null;
      }
    }
    return best;
  }
}

function getWinChances(board, current) {
  const empty = board.filter((c) => !c).length;
  if (empty === 9) return { x: 50, o: 50 };

  const score = minimax([...board], current === "X", 0);

  if (score > 0) {
    const x = Math.min(95, Math.round(60 + (score / 10) * 35));
    return { x, o: 100 - x };
  }
  if (score < 0) {
    const o = Math.min(95, Math.round(60 + (Math.abs(score) / 10) * 35));
    return { x: 100 - o, o };
  }
  return { x: 50, o: 50 };
}

function PlayerCard({ name, isX, score, pct, active, gameOver }) {
  return (
    <div className={`pcard${active && !gameOver ? (isX ? " ax" : " ao") : ""}`}>
      <div className={`psym ${isX ? "sx" : "so"}`}>{isX ? "✕" : "○"}</div>
      <div className="pname">{name}</div>
      <div className="pscore">{score}</div>
      <div className="wlabel">Win Chance</div>
      <div className="wbar">
        <div
          className={`wfill ${isX ? "wfx" : "wfo"}`}
          style={{ width: pct + "%" }}
        />
      </div>
      <div className={`wpct ${isX ? "wpx" : "wpo"}`}>{pct}%</div>
      <div
        className={`turn-badge ${isX ? "tbx" : "tbo"}${active && !gameOver ? " vis" : ""}`}
      >
        YOUR TURN
      </div>
    </div>
  );
}

function SetupScreen({ onStart }) {
  const [nx, setNx] = useState("");
  const [no, setNo] = useState("");

  return (
    <div className="setup">
      <div className="setup-ttl">Enter Player NickNames</div>
      <div className="inp-grp">
        <label className="inp-label lx">✕ Player X</label>
        <input
          className="name-input"
          value={nx}
          onChange={(e) => setNx(e.target.value)}
          placeholder="Player X"
          maxLength={12}
        />
      </div>
      <div className="inp-grp">
        <label className="inp-label lo">O Player O</label>
        <input
          className="name-input"
          value={no}
          onChange={(e) => setNo(e.target.value)}
          placeholder="Player O"
          maxLength={12}
        />
      </div>
      <button
        className="btn-start"
        onClick={() =>
          onStart(nx.trim() || "Player O", no.trim() || "Player X")
        }
      >
        START GAME
      </button>
    </div>
  );
}

function GameScreen({ names, onMenu }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [current, setCurrent] = useState("X");
  const [gameOver, setGameOver] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [result, setResult] = useState(null);
  const [winCombo, setWinCombo] = useState([]);

  const chances = getWinChances(board, current);

  const startRound = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrent("X");
    setGameOver(false);
    setResult(null);
    setWinCombo([]);
  }, []);

  const handleCell = useCallback(
    (idx) => {
      if (gameOver || board[idx]) return;
      const nb = [...board];
      nb[idx] = current;
      setBoard(nb);

      const w = getWinner(nb);
      if (w) {
        setWinCombo(w.combo);
        setGameOver(true);
        setScores((s) => ({ ...s, [w.player]: s[w.player] + 1 }));
        setTimeout(() => setResult({ type: "win", player: w.player }), 850);
      } else if (nb.every((c) => c)) {
        setGameOver(true);
        setTimeout(() => setResult({ type: "draw" }), 850);
      } else {
        setCurrent((p) => (p === "X" ? "O" : "X"));
      }
    },
    [board, current, gameOver],
  );

  const statusText =
    gameOver && result
      ? result.type === "draw"
        ? ""
        : `${names[result.player]} Wins!`
      : `${names[current]}'s turn`;

  return (
    <div className="game">
      <div className="players-row">
        <PlayerCard
          name={names.X}
          isX={true}
          score={scores.X}
          pct={chances.x}
          active={current === "X"}
          gameOver={gameOver}
        />
        <div className="vs-badge">VS</div>
        <PlayerCard
          name={names.O}
          isX={false}
          score={scores.O}
          pct={chances.o}
          active={current === "O"}
          gameOver={gameOver}
        />
      </div>

      <div className="status">{statusText}</div>

      <div className="board">
        {board.map((val, i) => {
          let cls = "cell";
          if (val === "X") cls += " cx";
          else if (val === "O") cls += " co";
          else if (!gameOver) cls += " empty";
          if (winCombo.includes(i)) cls += " win";
          return (
            <div key={i} className={cls} onClick={() => handleCell(i)}>
              {val === "X" ? "✕" : val === "O" ? "○" : ""}
            </div>
          );
        })}
      </div>

      <div className="btn-row">
        <button className="btn-sec" onClick={startRound}>
          NEW ROUND
        </button>
        <button className="btn-sec" onClick={onMenu}>
          MAIN MENU
        </button>
      </div>

      {result && (
        <div className="overlay">
          <div className="rcard">
            <div className="ricon">{result.type === "draw" ? "🤝" : "🏆"}</div>
            <div className="rtitle">
              {result.type === "draw"
                ? "It's a Draw!"
                : `${names[result.player]} Wins!`}
            </div>
            <div className="rsub">
              {result.type === "draw"
                ? "Play again to defeat your Opponent 🫵🏻"
                : `${names[result.player]} takes this round!`}
            </div>
            <div className="rscores">
              {names.X}: {scores.X} &nbsp;|&nbsp; {names.O}: {scores.O}
            </div>
            <button className="btn-start" onClick={startRound}>
              NEXT ROUND
            </button>
            <button
              className="btn-sec"
              style={{ marginTop: "6px" }}
              onClick={onMenu}
            >
              MAIN MENU
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TicTacToe() {
  const [names, setNames] = useState(null);

  return (
    <>
      <div className="bg-lines">
        <div className="h-line"></div>
        <div className="h-line"></div>
        <div className="h-line"></div>
        <div className="h-line"></div>
        <div className="h-line"></div>
        <div className="h-line"></div>
        <div className="h-line"></div>
        <div className="h-line"></div>
        <div className="v-line"></div>
        <div className="v-line"></div>
        <div className="v-line"></div>
        <div className="v-line"></div>
        <div className="v-line"></div>
        <div className="v-line"></div>
        <div className="v-line"></div>
        <div className="v-line"></div>
      </div>
      <div className="ttt-root">
        <div style={{ textAlign: "center" }}>
          <p className="Creator">Created by Megs</p>
          <h1 className="ttt-title">
            TIC<span>TAC</span>TOE
          </h1>
          <p className="ttt-sub">Two Player Battle</p>
        </div>
        {names ? (
          <GameScreen names={names} onMenu={() => setNames(null)} />
        ) : (
          <SetupScreen onStart={(x, o) => setNames({ X: x, O: o })} />
        )}
      </div>
    </>
  );
}
