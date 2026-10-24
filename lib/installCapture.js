export const INSTALL_CAPTURE_SCRIPT = `
window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  window.__installPrompt = e;
  window.dispatchEvent(new Event("installpromptready"));
});
window.addEventListener("appinstalled", function () {
  window.__installPrompt = null;
  window.dispatchEvent(new Event("installdone"));
});
`;
