export function getFullscreenElement() {
  if (typeof document === "undefined") return null;
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.webkitCurrentFullScreenElement ||
    null
  );
}

export async function requestElementFullscreen(element) {
  if (!element) throw new Error("No element");
  if (element.requestFullscreen) {
    await element.requestFullscreen();
    return;
  }
  if (element.webkitRequestFullscreen) {
    await element.webkitRequestFullscreen();
    return;
  }
  throw new Error("Fullscreen API unavailable");
}

export async function exitDocumentFullscreen() {
  if (typeof document === "undefined") return;
  if (document.exitFullscreen) {
    await document.exitFullscreen();
    return;
  }
  if (document.webkitExitFullscreen) {
    await document.webkitExitFullscreen();
  }
}

export function supportsElementFullscreen() {
  if (typeof document === "undefined") return false;
  const probe = document.createElement("div");
  return Boolean(probe.requestFullscreen || probe.webkitRequestFullscreen);
}
