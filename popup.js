// Volume levels mapping
const VOLUME_LEVELS = {
  'off': 0,
  'soft': 0.3,
  'balanced': 0.6,
  'loud': 1.0
};

// Storage keys
const STORAGE_KEYS = {
  VOLUME_LEVEL: 'volumeLevel',
  PUSH_NOTIFICATIONS: 'pushNotificationsEnabled'
};

// Default values
const DEFAULTS = {
  VOLUME_LEVEL: 'balanced',
  PUSH_NOTIFICATIONS: true
};

// Load saved volume preference
async function loadVolumePreference() {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.VOLUME_LEVEL]);
  const savedVolume = result[STORAGE_KEYS.VOLUME_LEVEL] || DEFAULTS.VOLUME_LEVEL;

  // Select the radio button
  const radio = document.querySelector(`input[value="${savedVolume}"]`);
  if (radio) {
    radio.checked = true;
    updateSelectedOption(savedVolume);
  }
}

// Load saved push notifications preference
async function loadPushNotificationPreference() {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.PUSH_NOTIFICATIONS]);
  const enabled = result[STORAGE_KEYS.PUSH_NOTIFICATIONS] !== undefined
    ? result[STORAGE_KEYS.PUSH_NOTIFICATIONS]
    : DEFAULTS.PUSH_NOTIFICATIONS;

  const toggle = document.getElementById('pushNotificationsToggle');
  if (toggle) {
    toggle.checked = enabled;
  }

  console.log('[POPUP] Push notifications loaded:', enabled);
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
  await chrome.storage.sync.set({ [STORAGE_KEYS.VOLUME_LEVEL]: volume });
  console.log('[POPUP] Volume saved:', volume);
}

// Save push notifications preference
async function savePushNotificationPreference(enabled) {
  await chrome.storage.sync.set({ [STORAGE_KEYS.PUSH_NOTIFICATIONS]: enabled });
  console.log('[POPUP] Push notifications saved:', enabled);
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
  // Dynamically set version from manifest
  const manifest = chrome.runtime.getManifest();
  const footerVersion = document.querySelector('.footer');
  if (footerVersion && manifest.version) {
    footerVersion.textContent = `v${manifest.version}`;
  }

  await loadVolumePreference();
  await loadPushNotificationPreference();

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

  // Push notifications toggle handler
  const pushToggle = document.getElementById('pushNotificationsToggle');
  if (pushToggle) {
    pushToggle.addEventListener('change', async (e) => {
      const enabled = e.target.checked;
      await savePushNotificationPreference(enabled);
    });
  }

  // Test sound button
  document.getElementById('testSound').addEventListener('click', testSound);
});
