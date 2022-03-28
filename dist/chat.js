/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!*********************!*\
  !*** ./src/chat.js ***!
  \*********************/
const MSG_REMOVE_TIMEOUT_MS = 180000
const WRAPPER_HIDE_TIMEOUT_MS = 15000

let wrapper, messageListEl, inputBox

// Functions

function drawInterface() {
  wrapper = document.createElement("div")
  wrapper.id = "HuddleHUD"
  wrapper.style.display = "none"

  messageListEl = document.createElement("ul")
  wrapper.appendChild(messageListEl)

  inputBox = document.createElement("input")

  inputBox.addEventListener("blur", (event) => {
    window.setTimeout(maybeHideWrapper, WRAPPER_HIDE_TIMEOUT_MS)
  })

  inputBox.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "Esc":
      case "Escape": {
        hideWrapper()
      }
      break

      case "Enter": {
        const msgContents = inputBox.value.trim()

        if (msgContents.length) {
          chrome.runtime.sendMessage({
            command: "say",
            msgContents,
            url: document.location.href,
          })
        }

        inputBox.value = ""
      }
      break
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

function drawMessage({nick, msgContents}) {
  console.log("Drawing:", nick, msgContents)

  const msgEl = document.createElement("li")
  msgEl.style.color = getColor(nick)
  msgEl.innerText = `${nick}: ${msgContents}`
  messageListEl.appendChild(msgEl)

  showWrapper()

  setTimeout(() => {
    msgEl.remove()
    setTimeout(maybeHideWrapper, WRAPPER_HIDE_TIMEOUT_MS)
  }, MSG_REMOVE_TIMEOUT_MS)

  setTimeout(hideWrapper, WRAPPER_HIDE_TIMEOUT_MS)
}

const COLORS = [
  "#ff4444",
  "#44ff44",
  "#4444ff",
  "#ffff44",
  "#44ffff",
  "#ff44ff",
]

const colorAssignments = new Map();

function getColor(str) {
  if (colorAssignments.has(str)) {
    return colorAssignments.get(str)
  }

  const color = COLORS[colorAssignments.size]
  colorAssignments.set(str, color)
  return color
}


// Initialization

const isRootFrame = window.parent === window

if (isRootFrame) {
  drawInterface()

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key == ",") {
      showWrapper()
      inputBox.focus()
    }
  })

  document.addEventListener("onunload", (event) => {
    chrome.runtime.sendMessage({
      command: "unsubscribe",
      url: document.location.href,
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
    url: document.location.href,
  })
}

/******/ })()
;
//# sourceMappingURL=chat.js.map