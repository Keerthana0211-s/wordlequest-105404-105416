//
// Utility to handle sound effects and fallback voice feedback for game events (correct/wrong guess)
//
// Usage: import and call playCorrectSound() or playIncorrectSound().
//
const SFX_CORRECT_URL = process.env.PUBLIC_URL + "/sfx-correct.mp3";
const SFX_INCORRECT_URL = process.env.PUBLIC_URL + "/sfx-incorrect.mp3";

// Helper to actually play audio, with promise catch for silent error
function playAudio(url) {
  try {
    const audio = new window.Audio(url);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {
    // Possibly blocked for autoplay, fallback to voice
    return false;
  }
  return true;
}

// Helper to fallback to SpeechSynthesis if audio fails
function speakFallback(text) {
  if ('speechSynthesis' in window) {
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1.06;
    utter.pitch = 1.0;
    utter.volume = 0.7;
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    window.speechSynthesis.speak(utter);
    return true;
  }
  return false;
}

// PUBLIC_INTERFACE
export function playCorrectSound() {
  const ok = playAudio(SFX_CORRECT_URL);
  if (!ok) {
    speakFallback("Correct!");
  }
}

// PUBLIC_INTERFACE
export function playIncorrectSound() {
  const ok = playAudio(SFX_INCORRECT_URL);
  if (!ok) {
    speakFallback("Try again!");
  }
}
