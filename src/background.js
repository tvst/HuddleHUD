import { initializeApp } from "firebase/app"
import { GoogleAuthProvider } from "firebase/auth"
import {
  getDatabase,
  set,
  remove,
  push,
  ref,
  query,
  limitToLast,
  onChildAdded,
} from "firebase/database"
import md5 from "md5"


const firebaseConfig = {
  apiKey: "AIzaSyB6FtDG4DVdYMrNk-VuKzuXyt2OSzZ_2w0",
  authDomain: "nyanchat-7e87a.firebaseapp.com",
  databaseURL: "https://nyanchat-7e87a-default-rtdb.firebaseio.com",
  projectId: "nyanchat-7e87a",
  storageBucket: "nyanchat-7e87a.appspot.com",
  messagingSenderId: "43446083827",
  appId: "1:43446083827:web:e16976b96ce8af8658d786"
}

const A_WHILE_BACK = 15 * 1000  // 15 seconds

let nick, channel

// Map of tabId to {cancelChildListener}
const subscriptions = new Map()


chrome.storage.sync.get(null, (settings) => {
  nick = settings.nick
  channel = settings.channel
})


initializeApp(firebaseConfig)
const db = getDatabase()
const provider = new GoogleAuthProvider()


chrome.runtime.onInstalled.addListener(() => {
  nick = makeRandomNick(16)
  channel = "default"
  chrome.storage.sync.set({ nick, channel })
})


chrome.runtime.onMessage.addListener((msg, sender, response) => {
    console.log("onMessage", msg.command, msg, sender, response)

    switch (msg.command) {
      case "logoutAuth": {
        firebase.auth().signOut().then(function () {
          // Sign-out successful.
          response({ type: "un-auth", status: "success", message: true })
        }, function (error) {
            // An error happened.
            response({ type: "un-auth", status: "false", message: error })
          })
      }

      case "checkAuth": {
        const user = firebase.auth().currentUser
        if (user) {
          // User is signed in.
          response({ type: "auth", status: "success", message: user })
        } else {
          // No user is signed in.
          response({ type: "auth", status: "no-auth", message: false })
        }
      }

      case "loginUser": {
        firebase.auth()
          .signInWithPopup(provider)
          .then((result) => {
            user = result.user
            response({ type: "auth", status: "success", message: user })
          }).catch((error) => {
            // Handle Errors here.
            const errorMessage = error.message
            response({ type: "auth", status: "error", message: errorMessage })
          })
      }

      case "say": {
        say({
          msgContents: msg.msgContents,
          url: msg.url,
        })
      }

      case "subscribe": {
        const cancelChildListener = onChildAdded(
          query(getChannelRef(msg.url)),
          //   limitToLast(5)
          // ),
          (snapshot) => onNewMessage(snapshot, sender.tab.id))

        subscriptions.set(sender.tab.id, {cancelChildListener})
      }

      case "unsubscribe": {
        unsubscribe(sender.tab.id)
      }
    }

    return true
})


chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log("Unsubscribing tab", tabId)
  unsubscribe(tabId)
})


function unsubscribe(tabId) {
  if (subscriptions.has(tabId)) {
    const {cancelChildListener} = subscriptions.get(tabId)
    cancelChildListener()
    subscriptions.delete(tabId)
  }
}


function getChannelPath(url) {
  const urlHash = md5(url)
  return `messages/${urlHash}/${channel}`
}


function getChannelRef(url) {
  return ref(db, getChannelPath(url))
}


function say({msgContents, url}) {
  set(
    push(getChannelRef(url)),
    {
      nick,
      msgContents,
      timestamp: Date.now(),
    }
  )
}


function onNewMessage(snapshot, tabId) {
  const msg = snapshot.val()
  console.log("New message from firebase", snapshot, msg, tabId)

  if (msg.timestamp > Date.now() - A_WHILE_BACK) {
    try {
      chrome.tabs.sendMessage(tabId, {
        command: "onNewMessage",
        data: msg,
      })
    } catch (e) {
      console.log("Cannot send message to tab. See exception:", e)
      unsubscribe(tabId)
    }

  } else {
    // Delete old messages from Firebase DB.
    remove(snapshot.ref)
  }
}


const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
const charactersLength = characters.length

function makeRandomNick(length) {
  const result = []
  for (var i = 0; i < length; i++) {
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)))
  }
  return result.join("")
}


console.log("Running!")
