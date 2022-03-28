import { initializeApp } from "firebase/app"
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

// Map of tabId to {cancelChildListener}
const subscriptions = new Map()


async function getNick() {
  const {nick} = await chrome.storage.sync.get(['nick'])
  return nick
}

async function getChannel() {
  const {channel} = await chrome.storage.sync.get(['channel'])
  return channel
}

function getCleanUrl(url) {
  const urlObj = new URL(url)
  return `${urlObj.hostname}/${urlObj.pathname}`
}


initializeApp(firebaseConfig)
const db = getDatabase()


chrome.runtime.onInstalled.addListener(() => {
  const nick = makeRandomNick()
  const channel = "default"
  chrome.storage.sync.set({ nick, channel })
})


chrome.runtime.onMessage.addListener((msg, sender, response) => {
    console.log("onMessage", msg.command, msg, sender, response)

    switch (msg.command) {
      case "say": {
        say({
          msgContents: msg.msgContents,
          url: msg.url,
        })
      }
      break

      case "subscribe": {
        subscribe(msg.url, sender.tab.id)
        say({
          msgContents: "*joined room*",
          url: msg.url,
        })
      }
      break

      case "unsubscribe": {
        unsubscribe(sender.tab.id)
      }
      break
    }

    return true
})


chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log("Unsubscribing tab", tabId)
  unsubscribe(tabId)
})


async function subscribe(url, tabId) {
  const cancelChildListener = onChildAdded(
    query(
      await getChannelRef(url),
      limitToLast(5),
    ),
    (snapshot) => onNewMessage(snapshot, tabId))

  subscriptions.set(tabId, {cancelChildListener})
}


function unsubscribe(tabId) {
  if (subscriptions.has(tabId)) {
    const {cancelChildListener} = subscriptions.get(tabId)
    cancelChildListener()
    subscriptions.delete(tabId)
  }
}


async function getChannelPath(url) {
  const urlHash = md5(getCleanUrl(url))
  const path = `messages/${urlHash}/${await getChannel()}`
  return path
}


async function getChannelRef(url) {
  return ref(db, await getChannelPath(url))
}


async function say({msgContents, url}) {
  set(
    push(await getChannelRef(url)),
    {
      nick: await getNick(),
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
  "Bald Eagle",
  "Barracuda",
  "Bass",
  "Basset Hound",
  "Bat",
  "Bearded Dragon",
  "Beaver",
  "Bedbug",
  "Bee",
  "Bee-eater",
  "Bird",
  "Bison",
  "Black panther",
  "Black Widow Spider",
  "Blue Jay",
  "Blue Whale",
  "Bobcat",
  "Buffalo",
  "Butterfly",
  "Buzzard",
  "Camel",
  "Canada Lynx",
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
  "Crane Fly",
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
  "Guinea Pig",
  "Hamster",
  "Hare",
  "Hawk",
  "Hippopotamus",
  "Horse",
  "Hummingbird",
  "Humpback Whale",
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
  "Monitor lizard",
  "Monkey",
  "Moose",
  "Mosquito",
  "Moth",
  "Mountain Zebra",
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
  "Polar bear",
  "Porcupine",
  "Quagga",
  "Rabbit",
  "Raccoon",
  "Rat",
  "Rattlesnake",
  "Red Wolf",
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
