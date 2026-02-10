if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./pwa/service-worker.js");
    } catch (e) {
      // ignore
    }
  });
}
