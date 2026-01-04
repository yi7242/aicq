// Offscreen document script to play notification sound

// Volume levels mapping
const VOLUME_LEVELS = {
  'off': 0,
  'soft': 0.3,
  'balanced': 0.6,
  'loud': 1.0
};

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "PLAY_SOUND") {
    const volumeLevel = message.volume || 'balanced';
    console.log("[OFFSCREEN] Received request to play sound at volume:", volumeLevel);
    playSound(volumeLevel);
  }
});

function playSound(volumeLevel) {
  // Don't play if volume is off
  if (volumeLevel === 'off') {
    console.log("[OFFSCREEN] Sound disabled (volume: off)");
    return;
  }

  const audio = new Audio(chrome.runtime.getURL("sounds/icq.mp3"));
  audio.volume = VOLUME_LEVELS[volumeLevel] || VOLUME_LEVELS['balanced'];

  console.log("[OFFSCREEN] Playing sound at volume:", volumeLevel, "=", audio.volume);

  audio
    .play()
    .then(() => {
      console.log("[OFFSCREEN] Sound played successfully");
    })
    .catch((error) => {
      console.error("[OFFSCREEN] Failed to play sound:", error);
    });
}

console.log("[OFFSCREEN] Offscreen document loaded and ready");
