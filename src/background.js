import { initializeApp } from "firebase/app"
import {
  getDatabase,
  set,
  remove,
  push,
  ref,
  query,
  limitToLast,
  orderByChild,
  onChildAdded,
  serverTimestamp,
} from "firebase/database"
import md5 from "md5"


// XXX TODO replace
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

// Map of tabId to {cancelChildListener, url}
const subscriptions = new Map()


async function getNick() {
  const {nick} = await chrome.storage.sync.get(['nick'])
  return nick
}

async function getChannel() {
  const {channel} = await chrome.storage.sync.get(['channel'])
  return channel
}

initializeApp(firebaseConfig)
const db = getDatabase()


chrome.runtime.onInstalled.addListener(() => {
  const nick = makeRandomNick()
  const channel = "default"
  const allowedUrls = []
  chrome.storage.sync.set({ nick, channel, allowedUrls })
})


chrome.runtime.onMessage.addListener((msg, sender, response) => {
    console.log("onMessage", msg.command, msg, sender, response)

    switch (msg.command) {
      case "userMessage": {
        say({
          msgContents: msg.msgContents,
          url: msg.url,
        })
      }
      break

      case "contentScriptLoaded": {
        subscribeAndAnnounce(msg.url, sender.tab.id)
      }
      break

      case "documentUnloaded": {
        announceAndUnsubscribe(sender.tab.id)
      }
      break
    }

    return true
})


chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  announceAndUnsubscribe(tabId)
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!subscriptions.has(tabId)) return

  if (changeInfo.status === "complete") {
    await announceAndUnsubscribe(tabId)
    // No need to subscribe since the content
    //subscribeAndAnnounce(tab.url, tabId)
  }
})


async function subscribeAndAnnounce(url, tabId) {
  if (subscriptions.has(tabId)) return

  await subscribe(url, tabId)

  // await chrome.tabs.sendMessage(tabId, {
  //   command: "onSubscribed",
  // })

  console.log("announcing")

  say({
    msgContents: "*joined room*",
    url,
  })
}


async function subscribe(url, tabId) {
  if (subscriptions.has(tabId)) return

  console.log("Subscribing tab", tabId)

  const cancelChildListener = onChildAdded(
    query(
      await getChannelRef(url),
      limitToLast(30),
      orderByChild("timestamp"),
    ),
    (snapshot) => onNewMessage(snapshot, tabId))

  subscriptions.set(tabId, {cancelChildListener, url})
}


async function announceAndUnsubscribe(tabId) {
  if (!subscriptions.has(tabId)) return

  const {url} = subscriptions.get(tabId)

  say({
    msgContents: "*left room*",
    url,
  })

  unsubscribe(tabId)
}


function unsubscribe(tabId) {
  if (!subscriptions.has(tabId)) return

  console.log("Unsubscribing tab", tabId)

  const {cancelChildListener} = subscriptions.get(tabId)
  cancelChildListener()
  subscriptions.delete(tabId)
}


async function getChannelPath(url) {
  const urlObj = new URL(url)
  const cleanUrl = `${urlObj.hostname}/${urlObj.pathname}`
  const urlHash = md5(cleanUrl)
  const path = `messages/${urlHash}/${await getChannel()}`
  return path
}


async function getChannelRef(url) {
  return ref(db, await getChannelPath(url))
}


async function say({msgContents, url}) {
  await set(
    push(await getChannelRef(url)),
    {
      nick: await getNick(),
      msgContents,
      timestamp: serverTimestamp(),
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
      announceAndUnsubscribe(tabId)
    }

  } else {
    // Delete old messages from Firebase DB.
    remove(snapshot.ref)
  }
}


const ANIMALS = [
  "Aardvark",
  "Alligator",
  "Alpaca",
  "Anaconda",
  "Ant",
  "Anteater",
  "Antelope",
  "Aphid",
  "Armadillo",
  "Asp",
  "Ass",
  "Baboon",
  "Badger",
  "Barracuda",
  "Bass",
  "Bat",
  "Beaver",
  "Bedbug",
  "Bee",
  "Bird",
  "Bison",
  "Bobcat",
  "Buffalo",
  "Butterfly",
  "Buzzard",
  "Camel",
  "Carp",
  "Cat",
  "Caterpillar",
  "Catfish",
  "Cheetah",
  "Chicken",
  "Chimpanzee",
  "Chipmunk",
  "Cobra",
  "Cod",
  "Condor",
  "Cougar",
  "Cow",
  "Coyote",
  "Crab",
  "Cricket",
  "Crocodile",
  "Crow",
  "Cuckoo",
  "Deer",
  "Dinosaur",
  "Dog",
  "Dolphin",
  "Donkey",
  "Dove",
  "Dragon",
  "Dragonfly",
  "Duck",
  "Eagle",
  "Eel",
  "Elephant",
  "Emu",
  "Falcon",
  "Ferret",
  "Finch",
  "Fish",
  "Flamingo",
  "Flea",
  "Fly",
  "Fox",
  "Frog",
  "Goat",
  "Goose",
  "Gopher",
  "Gorilla",
  "Hamster",
  "Hare",
  "Hawk",
  "Hippopotamus",
  "Horse",
  "Hummingbird",
  "Husky",
  "Iguana",
  "Impala",
  "Kangaroo",
  "Lemur",
  "Leopard",
  "Lion",
  "Lizard",
  "Llama",
  "Lobster",
  "Margay",
  "Monkey",
  "Moose",
  "Mosquito",
  "Moth",
  "Mouse",
  "Mule",
  "Octopus",
  "Orca",
  "Ostrich",
  "Otter",
  "Owl",
  "Ox",
  "Oyster",
  "Panda",
  "Parrot",
  "Peacock",
  "Pelican",
  "Penguin",
  "Perch",
  "Pheasant",
  "Pig",
  "Pigeon",
  "Porcupine",
  "Quagga",
  "Rabbit",
  "Raccoon",
  "Rat",
  "Rattlesnake",
  "Rooster",
  "Seal",
  "Sheep",
  "Skunk",
  "Sloth",
  "Snail",
  "Snake",
  "Spider",
  "Tiger",
  "Whale",
  "Wolf",
  "Wombat",
  "Zebra",
]

function makeRandomNick() {
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return animal + Math.floor(Math.random() * 10000)
}

console.log("Running!")
