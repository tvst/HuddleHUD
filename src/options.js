document.getElementById("saveButton").addEventListener('click', () => {
  const nick = document.getElementById("nicknameInput").value.trim()
  const channel = document.getElementById("channelInput").value.trim()
  const allowedUrlsStr = document.getElementById("allowedUrlsInput").value.trim()

  const allowedUrls = allowedUrlsStr.split("\n")

  if (nick && channel) {
    chrome.storage.sync.set({nick, channel, allowedUrls})
  } else {
    alert("Please enter a valid nickname and channel")
  }
})

async function initialize() {
  const {nick, channel, allowedUrls} =
    await chrome.storage.sync.get(["nick", "channel", "allowedUrls"])
  document.getElementById("nicknameInput").value = nick
  document.getElementById("channelInput").value = channel
  document.getElementById("allowedUrlsInput").value = allowedUrls.join("\n")
}

initialize()
