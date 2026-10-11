(function () {
  try {
    var theme = localStorage.getItem("RomanizedMM_theme");
    if (["royal-heritage", "midnight-luxury", "cosmic", "vintage-vinyl"].includes(theme)) {
      document.documentElement.dataset.theme = theme;
    }
  } catch (_) {
    // Use the Royal Heritage default when storage is unavailable.
  }
})();
