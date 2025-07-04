# Requirements Document: 5-Letter Word Guessing Game (Frontend)

## Overview

This document describes the **functional** and **non-functional** requirements for the React-based frontend of a 5-letter word guessing game. The application provides a modern, minimal UI for gameplay, color-coded feedback, a leaderboard, and related features. All requirements derive from the provided feature list and step-by-step implementation plan.

---

## Functional Requirements

### 1. Core Gameplay Logic
- The application must manage the state for the word guessing game, including the current word to guess, user guesses, number of attempts, and feedback for each guess.
- Each game session must randomly select a 5-letter target word (from a predefined or local list).
- The user can input guesses up to a maximum of 6 attempts per game.
- After each guess, the application provides per-letter color-coded feedback:
  - **Green** for correct letter in the correct position.
  - **Yellow** for correct letter in the wrong position.
  - **Gray** for incorrect letters.

### 2. Guess Grid
- The main area displays a 6-row by 5-column grid.
- Each row represents a guess; each cell shows a single letter.
- Past guesses remain visible with their color-coded feedback.
- The current active row is highlighted.

### 3. On-Screen Keyboard
- An on-screen keyboard must be available for letter input.
- The keyboard reflects color feedback based on previous guesses (e.g., keys already found to be correct are displayed in green, etc.).
- The user can use the on-screen keyboard or a physical keyboard to enter their guess.

### 4. Game Controls and Messaging
- A "Reset" button must be available to start a new game at any time.
- After each guess or game completion, clear status messages are shown:
  - Number of attempts left after each guess.
  - "You win!" message if the user guesses the word correctly within the allowed attempts.
  - "Game Over" message if the user fails to guess the word in 6 attempts.
- After a win, the user is prompted to enter a display name for leaderboard recording.

### 5. Leaderboard Functionality
- The application maintains a leaderboard displaying prior winners.
- The leaderboard lists, for each user:
  - Display name.
  - Rank (sorted by fewest attempts needed to win).
  - Number of attempts used for the win.
- The leaderboard data is stored and retrieved locally (e.g., using browser localStorage) unless stated otherwise.
- Users are ranked from best (fewest attempts) to worst.

### 6. UI Accessibility & Responsiveness
- The UI design must be responsive to work on both desktop and mobile browsers.
- Interactive elements (buttons, keyboard, etc.) must be navigable via keyboard and mouse/touch.
- Proper contrast and visual clarity must be ensured for accessibility.

### 7. UI Structure and Theming
- Apply a modern, minimalistic style using vanilla CSS and CSS variables for themes.
- Implement both light and dark mode toggling via a UI control.

### 8. Modularization
- Where appropriate, break out reusable UI elements and logic into modular React components to improve maintainability.

---

## Non-Functional Requirements

### 1. Performance
- The frontend must be lightweight with fast startup and minimal dependencies.
- All interactions should produce instantaneous feedback (<100ms perceptible UI response).

### 2. Reliability
- Local game state and leaderboard data must survive page reloads and browser restarts (using local storage).
- The application should gracefully handle unexpected input (such as invalid words or incomplete guesses).

### 3. Usability
- The UI must be intuitively understandable and user-friendly, requiring no tutorial for basic operation.
- The reset button and navigation to the leaderboard must be always visible and easily accessible.

### 4. Security & Privacy
- No user credentials are required; only a display name is requested after a win.
- All leaderboard and gameplay data remain on the client unless otherwise extended.

### 5. Compatibility
- Must support the latest versions of Chrome, Firefox, and Safari.

### 6. Customization and Theming
- Easy modification of theme colors and CSS via variables defined in the main CSS file.

### 7. Testability
- Codebase must be structured to allow for unit and integration testing, especially for core game logic and critical UI components.

---

## Out of Scope

- Multiplayer gameplay or online score submission.
- Word and leaderboard management beyond the local browser.
- Accessibility features extending beyond standard contrast and keyboard navigation.

---

## Traceability to Plan Steps

| Plan Step                                             | Requirement Section(s) Covered                           |
|-------------------------------------------------------|---------------------------------------------------------|
| 1. Core state logic                                  | Functional #1, #5, #8                                  |
| 2. Guess grid UI                                     | Functional #2                                           |
| 3. On-screen keyboard                                | Functional #3                                           |
| 4. Reset and messaging                               | Functional #4                                           |
| 5. Name prompt and score storage                     | Functional #4, #5; Non-functional #2, #4                |
| 6. Leaderboard screen                                | Functional #5                                           |
| 7. Modularization/organization                       | Functional #8; Non-functional #7                        |

---

## References

- Main app component and theming: [`src/App.js`](../src/App.js), [`src/App.css`](../src/App.css)
- Project structure and CSS theming details: [`README.md`](../README.md)
- General React project conventions: [`package.json`](../package.json)
