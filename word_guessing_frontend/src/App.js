import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

/*
  --- INITIAL MAIN GAME STATE MANAGEMENT ---
  - Handles core playable state for 5-letter word game.
  - Sets up: secretWord, guesses, attempts, status.
  - Game logic for submitting guesses, win/loss, reset.
  - Modern, minimal UI stub (no grid or keyboard yet).
*/

// A minimal word list for secret word randomization.
// Would later be replaced by a larger local or remote word list.
const WORD_LIST = [
  'CRANE', 'SWORD', 'PLANT', 'CHART', 'SHARE', 'WORLD', 'GAMES', 'PRONE', 'ALERT', 'GLIDE'
];

// Utility: Pick a random word (always uppercase, length 5)
function pickRandomWord() {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

// PUBLIC_INTERFACE
function App() {
  // Theme state & effect
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Main game state
  const [secretWord, setSecretWord] = useState('');
  const [guesses, setGuesses] = useState([]); // array of strings, max 6
  const [currentGuess, setCurrentGuess] = useState('');
  const [attempt, setAttempt] = useState(0); // current attempt index
  // status: 'in_progress' | 'win' | 'loss'
  const [status, setStatus] = useState('in_progress');
  const [message, setMessage] = useState('');

  // On mount or reset: start a new game.
  // PUBLIC_INTERFACE
  const startNewGame = useCallback(() => {
    setSecretWord(pickRandomWord());
    setGuesses([]);
    setCurrentGuess('');
    setAttempt(0);
    setStatus('in_progress');
    setMessage('Guess the 5-letter word!');
  }, []);

  // On mount, start first game
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Handle guess submission (called on Enter key or soon via on-screen keyboard)
  // PUBLIC_INTERFACE
  const handleGuessSubmit = useCallback(() => {
    if (status !== 'in_progress') return; // Prevent after win/loss
    const guess = currentGuess.trim().toUpperCase();
    if (guess.length !== 5) {
      setMessage('Enter a 5-letter word.');
      return;
    }
    // Only allow valid alphabetic letters (simple check)
    if (!/^[A-Z]{5}$/.test(guess)) {
      setMessage('Use only letters A-Z.');
      return;
    }
    // Prevent duplicate guesses
    if (guesses.includes(guess)) {
      setMessage('You already guessed that!');
      return;
    }

    const newGuesses = [...guesses, guess];
    setGuesses(newGuesses);
    setAttempt(attempt + 1);

    // Check for win/loss
    if (guess === secretWord) {
      setStatus('win');
      setMessage('You win! 🎉');
      // Future: open name prompt for leaderboard here.
    } else if (newGuesses.length >= 6) {
      setStatus('loss');
      setMessage(`Game Over. Word was: ${secretWord}`);
    } else {
      setMessage(`${6 - newGuesses.length} attempts left.`);
    }
    setCurrentGuess('');
  }, [currentGuess, guesses, secretWord, attempt, status]);

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

  // Reset
  // PUBLIC_INTERFACE
  const handleReset = () => {
    startNewGame();
  };

  // UI: Minimal, header, theme, input, guesses, controls, message
  return (
    <div className="App">
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
              disabled={status !== 'in_progress'}
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
              disabled={currentGuess.length !== 5 || status !== 'in_progress'}
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
          >
            Reset
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;
