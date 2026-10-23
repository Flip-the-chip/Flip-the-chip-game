// Game content: career fields, quick questions and special cards
// (the hands-on labs live in Labs.js)

const FIELDS = {
  ai: {
    name: "AI and machine learning",
    what: "You’d build software that learns from examples: apps that identify plants and insects from a photo, translate languages, or help farmers spot crop disease.",
    next: "Try it: Google’s Teachable Machine lets you train an image model in your browser in ten minutes."
  },
  games: {
    name: "Game development",
    what: "You’d write the code behind physics, characters, levels and graphics. Every game you play is thousands of small rules written by programmers.",
    next: "Try it: make a small platformer in Scratch, then move up to Godot, which is free."
  },
  security: {
    name: "Cybersecurity",
    what: "You’d protect people, banks and hospitals from attackers, and ethical hackers get paid to break into systems before the bad guys do.",
    next: "Try it: picoCTF is a free hacking competition built for high school students."
  },
  web: {
    name: "Web and app development",
    what: "You’d build the sites and apps people use every day, from what you see on the screen to the servers behind it.",
    next: "Try it: write a one-page website about yourself with HTML and CSS. It’s how most developers start."
  },
  data: {
    name: "Data science and health tech",
    what: "You’d find patterns hidden in huge amounts of data: predicting weather, tracking disease, or helping doctors read scans faster.",
    next: "Try it: explore real public datasets on Kaggle, or open Statistics Canada data in a spreadsheet."
  },
  logic: {
    name: "Software engineering",
    what: "You enjoy breaking problems into steps, which is the core skill under every other field on this list.",
    next: "Try it: solve a few beginner puzzles on Advent of Code or CodingBat in Python."
  }
};

const QUESTIONS = [
  { f: "ai", q: "You show an AI 10,000 photos of cats. Then you show it a dog wearing a cat costume. What probably happens?",
    o: ["It says “cat” with total confidence", "It bursts out laughing", "It refuses to answer", "It calls the dog’s owner"], a: 0,
    why: "AI only knows what it has seen. That’s why people who build AI collect lots of weird, varied photos to train it." },
  { f: "ai", q: "Your phone’s keyboard guesses your next word. How does it know you’ll type “lol”?",
    o: ["It reads your mind", "It learned from what you and millions of people usually type", "Your friends tell it", "It’s a lucky guess every single time"], a: 1,
    why: "It spotted a pattern in tons of messages. Finding patterns in data is exactly what machine learning does." },
  { f: "ai", q: "Snapchat puts dog ears on your head, and they follow you when you move. What is the computer doing?",
    o: ["Finding your face again many times every second", "Predicting where you’ll move next week", "A person drawing them live", "Using GPS"], a: 0,
    why: "That’s computer vision: teaching a computer to “see.” The same tech helps scientists count bees in photos." },
  { f: "ai", q: "Which of these can AI already do?",
    o: ["Name a bird from its song", "Tell bee species apart from a photo", "Find a song from you humming it", "All of these"], a: 3,
    why: "Every one of these exists, and someone had to build it. That someone could be you." },
  { f: "games", q: "In Minecraft, why don’t you fall straight through the ground?",
    o: ["The ground is solid, obviously", "Code keeps checking whether you’re touching a block", "Steve is too light", "Your controller holds you up"], a: 1,
    why: "It’s called collision detection. Without it, every game character would fall forever." },
  { f: "games", q: "A glitch lets you walk through a wall. What actually happened?",
    o: ["The wall was shy", "A programmer’s code missed one situation", "Your console is haunted", "The game got tired"], a: 1,
    why: "Speedrunners hunt for exactly these mistakes. Finding and fixing them is called debugging." },
  { f: "games", q: "In Mario Kart, why does whoever is in last place get better items?",
    o: ["Pure luck", "Designers wrote rules so races stay close and fun", "The other players donate them", "It’s a bug nobody fixed"], a: 1,
    why: "Game designers use code to make things feel fair and exciting. Fun is something you can program." },
  { f: "games", q: "How many people does it take to make a huge game like Fortnite?",
    o: ["One genius", "About 10", "Hundreds", "Exactly 42"], a: 2,
    why: "Coders, artists, sound designers, testers, writers. Big games need all kinds of people, not just programmers." },
  { f: "security", q: "Which password would take a hacker’s computer the longest to guess?",
    o: ["password123", "Fluffy2009", "purple-taco-skateboard-moon", "qwerty"], a: 2,
    why: "Long beats clever. Four random words are much harder to crack than a short word with numbers." },
  { f: "security", q: "You get a DM: “You won a FREE iPhone!! Click here 🎁” What do you do?",
    o: ["Click fast before it expires", "Send it to all your friends", "Delete it, it’s a scam", "Reply with your home address"], a: 2,
    why: "That’s phishing: tricking people instead of hacking computers. Cybersecurity experts get paid to stop it." },
  { f: "security", q: "Why do websites make you click every square with a traffic light?",
    o: ["To check you’re a human, not a bot", "To teach road safety", "Just for fun", "To test your eyesight"], a: 0,
    why: "Bots can flood sites with spam. Bonus fact: clicks like yours have also helped train AI to recognize objects." },
  { f: "web", q: "You double-tap a photo on Instagram. Where does that like actually go?",
    o: ["It stays on your phone", "To a server, maybe in another country, in under a second", "Straight to their phone by Bluetooth", "Nowhere, likes are fake"], a: 1,
    why: "Every tap is a tiny message racing across the internet. Web developers build the systems that carry it." },
  { f: "web", q: "Concert tickets go on sale and the website crashes. Why?",
    o: ["Way too many people visit at once", "The singer cancelled", "The internet ran out", "Someone tripped on the cord"], a: 0,
    why: "Servers can only handle so many visitors at once. Engineers work on making sites survive huge crowds." },
  { f: "web", q: "Why do your apps want to update all the time?",
    o: ["Just to annoy you", "Programmers fixed bugs and added new stuff", "Your phone got older", "Apps expire like milk"], a: 1,
    why: "Apps are never really finished. Teams keep improving them every week." },
  { f: "data", q: "How does TikTok decide what to show you next?",
    o: ["Totally random", "It tracks what you watch, like and rewatch, then guesses", "Your teacher picks", "Alphabetical order"], a: 1,
    why: "That’s a recommendation algorithm. Data scientists design how it learns what you like." },
  { f: "data", q: "Google Maps says there’s traffic ahead. How does it know?",
    o: ["Helicopters", "Lots of phones on that road are moving slowly", "Police text Google", "It guesses from the weather"], a: 1,
    why: "Millions of tiny data points add up to one useful answer. That’s data science." },
  { f: "data", q: "How does Spotify Wrapped know your top song of the year?",
    o: ["It counted every play, all year", "It asked your friends", "It guessed from your profile picture", "Pure magic"], a: 0,
    why: "Counting and summarizing data sounds boring, until it turns into something everyone shares." },
  { f: "logic", q: "You tell a robot “Make me a sandwich.” It just stands there. Why?",
    o: ["Robots hate sandwiches", "It needs every step: get bread, open the jar, spread…", "It’s on break", "You forgot to say please"], a: 1,
    why: "Breaking a task into tiny, exact steps is what programming is. You just did it." },
  { f: "logic", q: "Your friend picks a number from 1 to 100 and only says “higher” or “lower.” Best first guess?",
    o: ["1", "50", "99", "Your lucky number"], a: 1,
    why: "Guessing the middle cuts the options in half every time. Search engines use this trick." },
  { f: "logic", q: "Your playlist is on shuffle and the same artist plays twice in a row. What’s going on?",
    o: ["Shuffle is broken", "Real randomness sometimes repeats", "The artist paid for it", "Your phone has a favourite"], a: 1,
    why: "Random things clump. Spotify actually changed its shuffle to be less random because people thought it was broken." },
  { f: "logic", q: "A robot can only turn left. How does it end up facing right?",
    o: ["Turn left once", "Turn left twice", "Turn left three times", "It can’t, ever"], a: 2,
    why: "Three left turns make one right turn. Solving problems with limited moves is what coders do all day." },
  { f: "logic", q: "In 1947, the first recorded computer “bug” was…",
    o: ["A real moth stuck inside the computer", "A virus", "A spilled soda", "A typo"], a: 0,
    why: "Grace Hopper’s team taped the moth into their notebook. We’ve called errors bugs ever since." },
  { f: "logic", q: "Which of these had to be programmed by someone?",
    o: ["The Mars rover", "Your microwave timer", "Pokémon games", "All of these"], a: 3,
    why: "Code is hiding in almost everything with a battery or a plug." }
];

const SPECIALS = [
  { kind: "save", icon: "💾", label: "Saved +1" },
  { kind: "bug", icon: "🐛", label: "Bug −1" }
];
const QUESTIONS_PER_GAME = 4;
