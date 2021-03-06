const MSG_REMOVE_TIMEOUT_MS = 60000
const WRAPPER_HIDE_TIMEOUT_MS = 15000

let wrapper, inputBox
let messageListEl = document.querySelector("#HuddleHud > ul")

// Functions

function drawInterface() {
  wrapper = document.createElement("div")
  wrapper.id = "HuddleHUD"
  wrapper.style.display = "none"

  messageListEl = document.createElement("ul")
  wrapper.appendChild(messageListEl)

  inputBox = document.createElement("input")
  inputBox.placeholder = "Press \"𝚌𝚝𝚛𝚕-,\" to focus input box"

  inputBox.addEventListener("blur", (event) => {
    setTimeout(maybeHideWrapper, WRAPPER_HIDE_TIMEOUT_MS)
  })

  inputBox.addEventListener("keydown", (event) => {
    event.stopPropagation()

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
            command: "userMessage",
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

function getAllowedUrls() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['allowedUrls'], ({allowedUrls}) => {
      resolve(allowedUrls)
    })
  })
}

async function isUrlAllowed(url) {
  const allowedUrls = await getAllowedUrls()

  if (allowedUrls.length == 0) return true

  return allowedUrls.some((substring) =>
    substring.trim().length == 0 ||  // Empty pattern means "match all".
    url.indexOf(substring.trim()) >= 0)
}

isUrlAllowed(document.location.href).then((isAllowed) => {
  if (!isAllowed || !isRootFrame) return

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key == ",") {
      showWrapper()
      inputBox.focus()
    }
  })

  document.addEventListener("onunload", (event) => {
    chrome.runtime.sendMessage({
      command: "documentUnloaded",
      url: document.location.href,
    })
  })

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log("onMessage", msg)

    switch (msg.command) {
      case "onNewMessage": {
        drawMessage(msg.data)
      }
      break;
    }

    sendResponse({})
  })

  if (messageListEl) {
    messageListEl.innerHTML = ""
  }

  // Timeout is a hack to help extension load in all pages.
  setTimeout(() => {
    drawInterface()

    chrome.runtime.sendMessage({
      command: "contentScriptLoaded",
      url: document.location.href,
    })
  }, 1000)
})
