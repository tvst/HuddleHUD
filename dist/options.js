document.getElementById("saveButton").addEventListener("click",(()=>{const e=document.getElementById("nicknameInput").value.trim(),n=document.getElementById("channelInput").value.trim(),t=document.getElementById("allowedUrlsInput").value.trim().split("\n");e&&n?chrome.storage.sync.set({nick:e,channel:n,allowedUrls:t}):alert("Please enter a valid nickname and channel")})),async function(){const{nick:e,channel:n,allowedUrls:t}=await chrome.storage.sync.get(["nick","channel","allowedUrls"]);document.getElementById("nicknameInput").value=e,document.getElementById("channelInput").value=n,document.getElementById("allowedUrlsInput").value=t.join("\n")}();