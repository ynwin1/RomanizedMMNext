(function () {
  try {
    var theme = localStorage.getItem("RomanizedMM_theme");
    // Preserve the user's fourth-theme preference after Vintage Vinyl is retired.
    if (theme === "vintage-vinyl") {
      theme = "monsoon-mist";
      localStorage.setItem("RomanizedMM_theme", theme);
    }
    if (["royal-heritage", "midnight-luxury", "cosmic", "monsoon-mist"].includes(theme)) {
      document.documentElement.dataset.theme = theme;
    }
  } catch (_) {
    // Use the Royal Heritage default when storage is unavailable.
  }
})();
