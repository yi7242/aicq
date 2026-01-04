// Volume levels mapping
const VOLUME_LEVELS = {
  'off': 0,
  'soft': 0.3,
  'balanced': 0.6,
  'loud': 1.0
};

// Load saved volume preference
async function loadVolumePreference() {
  const result = await chrome.storage.sync.get(['volumeLevel']);
  const savedVolume = result.volumeLevel || 'balanced'; // Default to balanced

  // Select the radio button
  const radio = document.querySelector(`input[value="${savedVolume}"]`);
  if (radio) {
    radio.checked = true;
    updateSelectedOption(savedVolume);
  }
}

// Update visual selection
function updateSelectedOption(volume) {
  // Remove all selected classes
  document.querySelectorAll('.volume-option').forEach(option => {
    option.classList.remove('selected');
  });

  // Add selected class to chosen option
  const selectedOption = document.querySelector(`.volume-option[data-volume="${volume}"]`);
  if (selectedOption) {
    selectedOption.classList.add('selected');
  }
}

// Save volume preference
async function saveVolumePreference(volume) {
  await chrome.storage.sync.set({ volumeLevel: volume });
  console.log('[POPUP] Volume saved:', volume);
}

// Test sound with current volume
async function testSound() {
  const selectedRadio = document.querySelector('input[name="volume"]:checked');
  const volume = selectedRadio ? selectedRadio.value : 'balanced';

  // Send message to background to play sound
  chrome.runtime.sendMessage({
    type: 'PLAY_SOUND',
    volume: volume
  });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadVolumePreference();

  // Add change listeners to radio buttons
  document.querySelectorAll('input[name="volume"]').forEach(radio => {
    radio.addEventListener('change', async (e) => {
      const volume = e.target.value;
      updateSelectedOption(volume);
      await saveVolumePreference(volume);
    });
  });

  // Add click listeners to labels for better UX
  document.querySelectorAll('.volume-option').forEach(option => {
    option.addEventListener('click', () => {
      const radio = option.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        const volume = radio.value;
        updateSelectedOption(volume);
        saveVolumePreference(volume);
      }
    });
  });

  // Test sound button
  document.getElementById('testSound').addEventListener('click', testSound);
});
