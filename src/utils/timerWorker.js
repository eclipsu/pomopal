// timerWorker.js
let intervalId;

self.onmessage = (event) => {
  if (event.data === "start") {
    intervalId = setInterval(() => {
      self.postMessage("tick");
    }, 1000);
  } else if (event.data === "stop") {
    clearInterval(intervalId);
  }
};
