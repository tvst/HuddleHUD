saveButton.addEventListener('click', () => {
  const nick = nicknameInput.value.trim()
  const channel = channelInput.value.trim()

  if (nick && channel) {
    chrome.storage.sync.set({nick, channel})
  } else {
    alert("Please enter a valid nickname and channel")
  }
})

function initialize() {
  chrome.storage.sync.get(null, ({nick, channel}) => {
    nicknameInput.value = nick
    channelInput.value = channel
  })
}

initialize()
