import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Leaderboard from "./Leaderboard";
import { playCorrectSound, playIncorrectSound } from "./sfx";

/*
  --- INITIAL MAIN GAME STATE MANAGEMENT ---
  - Handles core playable state for 5-letter word game.
  - Sets up: secretWord, guesses, attempts, status.
  - Game logic for submitting guesses, win/loss, reset.
  - Modern, minimal UI stub (no grid or keyboard yet).

  --- Leaderboard INTEGRATION ---
  - Upon win, prompt user for display name; post name+attempts to external API.
  - Fetch leaderboard in Leaderboard screen, sorted by ascending attempts.
*/

/*
  SheetDB leaderboard endpoint integration (public endpoint for storing/fetching leaderboard scores)
*/
const LEADERBOARD_API = "https://sheetdb.io/api/v1/jm22e5onx3agw";

// PUBLIC_INTERFACE
/**
 * Submit a score (name, attempts) to SheetDB leaderboard via POST
 */
async function submitScoreToLeaderboard(name, attempts) {
  // SheetDB expects {"data": [{name:..., attempts:...}]}
  try {
    const resp = await fetch(LEADERBOARD_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [{ name, attempts }] })
    });
    return resp.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Fetches a random 5-letter word from random-word-api.herokuapp.com.
 * Returns uppercase string or null on failure.
 */
async function fetchRandomSolutionWord() {
  try {
    const resp = await fetch('https://random-word-api.herokuapp.com/word?length=5');
    if (!resp.ok) throw new Error("Failed to fetch");
    const data = await resp.json();
    if (Array.isArray(data) && data[0] && typeof data[0] === "string") {
      return data[0].toUpperCase();
    }
    return null;
  } catch (err) {
    return null;
  }
}

function App() {
  // Theme state & effect
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Main game state
  const [secretWord, setSecretWord] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [attempt, setAttempt] = useState(0);
  // status: 'in_progress' | 'win' | 'loss'
  const [status, setStatus] = useState('in_progress');
  const [message, setMessage] = useState('');
  // Loading state for solution word
  const [loadingSolution, setLoadingSolution] = useState(false);

  // Leaderboard UI and name prompt state
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingScore, setPendingScore] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(""); // err/success

  // On mount or reset: start a new game, fetching a random word.
  const startNewGame = useCallback(() => {
    setLoadingSolution(true);
    setSecretWord('');
    setGuesses([]);
    setCurrentGuess('');
    setAttempt(0);
    setStatus('in_progress');
    setMessage('Loading new word...');
    setShowNameModal(false);
    setPlayerName("");
    setPendingScore(null);
    setSubmitLoading(false);
    setSubmitStatus("");
    // Fetch the word from API
    fetchRandomSolutionWord().then(word => {
      if (word && word.length === 5 && /^[A-Z]{5}$/.test(word)) {
        setSecretWord(word);
        setMessage('Guess the 5-letter word!');
        setLoadingSolution(false);
      } else {
        setMessage("Error loading word. Check your connection & reset.");
        setLoadingSolution(false);
      }
    });
  }, []);

  // On mount, start first game
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Handle guess submission (called on Enter key or soon via on-screen keyboard)
  const handleGuessSubmit = useCallback(() => {
    if (status !== 'in_progress' || loadingSolution || !secretWord) return;
    const guess = currentGuess.trim().toUpperCase();
    if (guess.length !== 5) {
      setMessage('Enter a 5-letter word.');
      playIncorrectSound();
      return;
    }
    if (!/^[A-Z]{5}$/.test(guess)) {
      setMessage('Use only letters A-Z.');
      playIncorrectSound();
      return;
    }
    if (guesses.includes(guess)) {
      setMessage('You already guessed that!');
      playIncorrectSound();
      return;
    }
    const newGuesses = [...guesses, guess];
    setGuesses(newGuesses);
    setAttempt(attempt + 1);
    // Check for win/loss
    if (guess === secretWord) {
      setStatus('win');
      setMessage('You win! 🎉');
      playCorrectSound();
      setShowNameModal(true);
      setPendingScore({ tries: newGuesses.length }); // Save attempts for modal
    } else if (newGuesses.length >= 6) {
      setStatus('loss');
      setMessage(`Game Over. Word was: ${secretWord}`);
      playIncorrectSound();
    } else {
      setMessage(`${6 - newGuesses.length} attempts left.`);
      playIncorrectSound();
    }
    setCurrentGuess('');
  }, [currentGuess, guesses, secretWord, attempt, status, loadingSolution]);

  // Handle text/keyboard input for the current guess (for now, simple input)
  // PUBLIC_INTERFACE
  const handleInputChange = (e) => {
    if (status !== 'in_progress') return;
    let value = e.target.value.toUpperCase();
    // Only allow max 5 letters and filter non-letters
    value = value.replace(/[^A-Z]/g, '').slice(0, 5);
    setCurrentGuess(value);
  };

  // Allow Enter key in input box for guessing
  // PUBLIC_INTERFACE
  const handleInputKeyUp = (e) => {
    if (e.key === 'Enter') {
      handleGuessSubmit();
    }
  };

  // Reset button handler
  const handleReset = () => {
    startNewGame();
  };

  // Leaderboard show/hide
  const handleShowLeaderboard = () => setShowLeaderboard(true);
  const handleHideLeaderboard = () => setShowLeaderboard(false);

  // Name modal: handle the submit action
  const handleNameChange = (e) => {
    setPlayerName(e.target.value.replace(/[^a-zA-Z0-9_\- ]/g, "").slice(0, 20));
  };
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!playerName || !pendingScore) return;
    setSubmitLoading(true);
    setSubmitStatus("");
    // Submit to SheetDB/Airtable API
    const ok = await submitScoreToLeaderboard(playerName, pendingScore.tries);
    setSubmitLoading(false);
    if (ok) {
      setSubmitStatus("success");
      setTimeout(() => {
        setShowNameModal(false);
        setShowLeaderboard(true);
      }, 650);
    } else {
      setSubmitStatus("err");
    }
  };

  return (
    <div className="App">
      {showLeaderboard ? (
        <Leaderboard onBack={handleHideLeaderboard} />
      ) : (
        <header className="App-header">
          {/* Theme toggle button */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          {/* Title */}
          <h1 style={{margin: 0, letterSpacing: '2px'}}>Word Guess</h1>
          <p style={{margin: "0.5rem 0 1.5rem", fontWeight: 400, fontSize: "1rem"}}>{message}</p>
          {/* Leaderboard nav button (small) */}
          <button
            type="button"
            style={{
              position: "absolute", left: 20, top: 20,
              background: "var(--button-bg)", color: "var(--button-text)",
              border: 0, borderRadius: 8, padding: "8px 16px", fontSize: 15, fontWeight: 600, cursor: "pointer"
            }}
            onClick={handleShowLeaderboard}
            aria-label="Leaderboard"
          >Leaderboard</button>
          {/* Show loading spinner/message if solution is loading */}
          {loadingSolution ? (
            <div style={{
              margin: "2.5rem 0",
              fontWeight: 500,
              fontSize: "1.2rem",
              color: "var(--text-secondary)",
              letterSpacing: 2
            }}>
              Loading word...
              <span style={{
                marginLeft: 10, display: "inline-block",
                width: 18, height: 18,
                border: "3px solid #bbb",
                borderRadius: "50%",
                borderTopColor: "var(--button-bg)",
                animation: "spin 1s linear infinite",
                verticalAlign: "middle"
              }}/>
              <style>
                {`
                @keyframes spin {
                  0% { transform: rotate(0deg);}
                  100% {transform: rotate(360deg);}
                }
                `}
              </style>
            </div>
          ) : (
            <>
              {/* Guess Grid (6x5) */}
              <div className="guess-grid" aria-label="Guess grid">
                {
                  Array.from({ length: 6 }).map((_, rowIdx) => {
                    // For rows with a guess: compute feedback
                    const guess = guesses[rowIdx] || '';
                    const guessLetters = guess.padEnd(5, ' ').split('');
                    let feedback = Array(5).fill('empty');
                    if (guesses[rowIdx]) {
                      // Feedback logic: "green" for correct pos, "yellow" for right letter/wrong pos, "gray" if absent
                      const answerArr = secretWord.split('');
                      const guessArr = guess.split('');
                      const used = Array(5).fill(false);
                      feedback = Array(5).fill('gray');

                      // Pass 1: greens
                      for (let i = 0; i < 5; i++) {
                        if (guessArr[i] === answerArr[i]) {
                          feedback[i] = 'green';
                          used[i] = true;
                        }
                      }
                      // Pass 2: yellows
                      for (let i = 0; i < 5; i++) {
                        if (feedback[i] === 'green') continue;
                        const idx = answerArr.findIndex(
                          (ch, j) => ch === guessArr[i] && !used[j] && guessArr[j] !== answerArr[j]
                        );
                        if (idx !== -1 && guessArr[i] !== '' && guessArr[i] !== ' ') {
                          feedback[i] = 'yellow';
                          used[idx] = true;
                        }
                      }
                    } else if (rowIdx === guesses.length && status === 'in_progress') {
                      // The active row—show input so far, rest empty, no feedback coloring
                      const inputLetters = currentGuess.padEnd(5, ' ').split('');
                      for (let j = 0; j < 5; j++) {
                        guessLetters[j] = inputLetters[j];
                      }
                      feedback = Array(5).fill('empty');
                    }
                    return (
                      <div className="guess-row" key={rowIdx}>
                        {guessLetters.map((ch, colIdx) => (
                          <div
                            key={colIdx}
                            className={`guess-cell guess-cell-${feedback[colIdx]}`}
                            aria-label={ch !== ' ' ? ch : 'empty'}
                          >
                            {ch}
                          </div>
                        ))}
                      </div>
                    );
                  })
                }
              </div>
              {/* Guess input (basic text input for now) */}
              {(status === 'in_progress') && (
                <form
                  style={{marginBottom: '1.5rem'}}
                  onSubmit={e => { e.preventDefault(); handleGuessSubmit(); }}
                  aria-label="Guess input form"
                >
                  <input
                    type="text"
                    inputMode="text"
                    maxLength={5}
                    value={currentGuess}
                    onChange={handleInputChange}
                    onKeyUp={handleInputKeyUp}
                    style={{
                      padding: '8px',
                      fontSize: 20,
                      width: 120,
                      textAlign: 'center',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)'
                    }}
                    disabled={status !== 'in_progress' || loadingSolution}
                    aria-label="Enter 5-letter guess"
                    autoFocus
                  />
                  <button
                    type="submit"
                    style={{
                      marginLeft: 12,
                      padding: '10px 18px',
                      backgroundColor: 'var(--button-bg)',
                      color: 'var(--button-text)',
                      border: 0,
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: 'pointer'
                    }}
                    disabled={currentGuess.length !== 5 || status !== 'in_progress' || loadingSolution}
                  >
                    Guess
                  </button>
                </form>
              )}

              {/* Game state controls */}
              <div style={{marginTop: status === 'in_progress' ? 0 : '2rem'}}>
                {(status === 'win' || status === 'loss') && (
                  <>
                    <div style={{margin: '1rem 0'}}><strong>{status === 'win' ? '🎉 Congratulations!' : '😞 Try Again!'}</strong></div>
                  </>
                )}
                <button
                  className="theme-toggle"
                  style={{margin: 0, marginTop: '0.5rem', fontSize: 15}}
                  onClick={handleReset}
                  aria-label="Start a new game"
                  disabled={loadingSolution}
                >
                  Reset
                </button>
              </div>
            </>
          )}

          {/* Modal for entering player name & submitting win */}
          {showNameModal && (
            <div
              style={{
                position: "fixed", zIndex: 100, top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(30,30,40,0.30)", display: "flex", alignItems: "center", justifyContent: "center"
              }}
              aria-modal="true"
              role="dialog"
            >
              <div style={{
                background: "var(--bg-secondary)", color: "var(--text-primary)",
                padding: "36px 30px", borderRadius: 16, boxShadow: "0 4px 20px #0002",
                minWidth: 290, maxWidth: "97vw"
              }}>
                <h3 style={{marginTop: 0, marginBottom: 18}}>Submit Your Score</h3>
                <form onSubmit={handleSubmitScore}>
                  <label style={{fontWeight: 500, fontSize: 16}}>
                    Name:&nbsp;
                    <input
                      value={playerName}
                      onChange={handleNameChange}
                      style={{
                        fontSize: 16, padding: "7px 12px",
                        borderRadius: 6, border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)"
                      }}
                      maxLength={20}
                      disabled={submitLoading}
                      required
                      autoFocus
                      aria-label="Player name"
                    />
                  </label>
                  <div style={{margin: "12px 0 5px 0", fontSize: 14}}>
                    <span>Your attempts: <strong>{pendingScore?.tries || 0}</strong></span>
                  </div>
                  <button
                    type="submit"
                    style={{
                      marginRight: 8,
                      padding: "10px 20px",
                      background: "var(--button-bg)", color: "var(--button-text)",
                      border: 0, borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: "pointer"
                    }}
                    disabled={!playerName || submitLoading}
                  >{submitLoading ? "Submitting..." : "Submit"}</button>
                  <button
                    type="button"
                    style={{
                      padding: "10px 16px", borderRadius: 8, background: "var(--border-color)",
                      color: "var(--text-primary)", border: 0, fontSize: 15, fontWeight: 500, cursor: "pointer"
                    }}
                    onClick={() => setShowNameModal(false)}
                    disabled={submitLoading}
                  >Cancel</button>
                  {submitStatus === "success" && (
                    <div style={{color: "#2b813f", marginTop: 10}}>Score saved! Showing leaderboard...</div>
                  )}
                  {submitStatus === "err" && (
                    <div style={{color: "#b94a48", marginTop: 10}}>Error saving score. Try again!</div>
                  )}
                </form>
              </div>
            </div>
          )}
        </header>
      )}
    </div>
  );
}

export default App;
