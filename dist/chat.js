/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!*********************!*\
  !*** ./src/chat.js ***!
  \*********************/
const MSG_REMOVE_TIMEOUT_MS = 60000
const WRAPPER_HIDE_TIMEOUT_MS = 15000

let wrapper, messageListEl, inputBox

// Functions

function drawInterface() {
  wrapper = document.createElement("div")
  wrapper.id = "nyanChat"
  wrapper.style.display = "none"

  messageListEl = document.createElement("ul")
  wrapper.appendChild(messageListEl)

  inputBox = document.createElement("input")
  inputBox.style.display = "none"

  inputBox.addEventListener("blur", (event) => {
    window.setTimeout(maybeHideWrapper, WRAPPER_HIDE_TIMEOUT_MS)
  })

  inputBox.addEventListener("keydown", (event) => {
    if (event.key == "Enter") {
      chrome.runtime.sendMessage({
        command: "say",
        msgContents: inputBox.value,
        url: getCleanUrl(),
      })

      inputBox.value = ""
    }
  })

  wrapper.appendChild(inputBox)

  document.body.appendChild(wrapper)
}

function showWrapper() {
  wrapper.style.display = ""
}

function hideWrapper() {
  wrapper.style.display = "none"
}

function maybeHideWrapper() {
  if (messageListEl.children.length == 0) {
    hideWrapper()
  }
}

function showInputBox() {
  inputBox.style.display = ""
  showWrapper()
  inputBox.focus()
}

function hideInputBox() {
  inputBox.style.display = "none"
  maybeHideWrapper()
}

function drawMessage({nick, msgContents}) {
  console.log("Drawing:", nick, msgContents)

  const msgEl = document.createElement("li")
  msgEl.innerText = `[${nick}] ${msgContents}`
  messageListEl.appendChild(msgEl)

  showWrapper()

  setTimeout(() => {
    msgEl.remove()
    setTimeout(maybeHideWrapper, WRAPPER_HIDE_TIMEOUT_MS)
  }, MSG_REMOVE_TIMEOUT_MS)
}

function getCleanUrl() {
  return `${document.location.hostname}/${document.location.pathname}`
}


// Initialization

const isRootFrame = window.parent === window

if (isRootFrame) {
  drawInterface()

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key == ",") {
      console.log("Ctrl-,")
      showInputBox()
    }
  })

  document.addEventListener("onunload", (event) => {
    chrome.runtime.sendMessage({
      command: "unsubscribe",
      url: getCleanUrl(),
    })
  })

  chrome.runtime.onMessage.addListener((msg, sender, response) => {
    console.log("onMessage", msg)

    switch (msg.command) {
      case "onNewMessage": {
        drawMessage(msg.data)
      }
    }

    return true
  })

  chrome.runtime.sendMessage({
    command: "subscribe",
    url: getCleanUrl(),
  })
}

/******/ })()
;
//# sourceMappingURL=chat.js.map