/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!************************!*\
  !*** ./src/options.js ***!
  \************************/
document.getElementById("saveButton").addEventListener('click', () => {
  const nick = document.getElementById("nicknameInput").value.trim()
  const channel = document.getElementById("channelInput").value.trim()

  if (nick && channel) {
    chrome.storage.sync.set({nick, channel})
  } else {
    alert("Please enter a valid nickname and channel")
  }
})

async function initialize() {
  const {nick, channel} = await chrome.storage.sync.get(["nick", "channel"])
  document.getElementById("nicknameInput").value = nick
  document.getElementById("channelInput").value = channel
  console.log("Storage:", nick, channel)
}

initialize()

/******/ })()
;
//# sourceMappingURL=options.js.map