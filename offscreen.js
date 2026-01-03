// Offscreen document script to play notification sound

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "PLAY_SOUND") {
    console.log("[OFFSCREEN] Received request to play sound");
    playSound();
  }
});

function playSound() {
  const audio = new Audio(chrome.runtime.getURL("sounds/icq.mp3"));
  audio.volume = 1.0;
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
