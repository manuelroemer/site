const colorModeStorageKey = 'color-mode';
const toggleButton = document.querySelector('#toggle-color-mode');
const ColorMode = {
  light: 'light',
  dark: 'dark',
};

// This seems redundant, but it ensures that the page is applying the stored color mode on load.
setCurrentColorMode(getCurrentColorMode());
toggleButton?.addEventListener('click', toggleCurrentColorMode);

/**
 * Returns the current color mode preferred by the user.
 * If the color mode has been actively toggled (and stored in localStorage), returns the stored value.
 * Otherwise returns a value based on the system color scheme.
 */
function getCurrentColorMode() {
  const stored = localStorage.getItem(colorModeStorageKey);
  if (stored) {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? ColorMode.dark : ColorMode.light;
}

/**
 * Sets the page's color mode to the given value.
 * Persists that value in localStorage.
 */
function setCurrentColorMode(colorMode) {
  localStorage.setItem(colorModeStorageKey, colorMode);
  document.querySelector('html').setAttribute('data-theme', colorMode);
  toggleButton.innerHTML = colorMode === ColorMode.light ? '🌙' : '☀';
}

/**
 * Switches the current color mode.
 * Updates the page and persists the new value.
 */
function toggleCurrentColorMode() {
  const current = getCurrentColorMode();
  const next = current === ColorMode.light ? ColorMode.dark : ColorMode.light;
  setCurrentColorMode(next);
}
