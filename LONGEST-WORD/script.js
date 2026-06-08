// ============================================================
// EXERCISE: Longest Word
// ============================================================
//
// Open the browser console to see your results.
// (Right-click the page → Inspect → Console)
//
// ============================================================

const words = ["cat", "elephant", "dog", "rhinoceros", "bee", "crocodile"];

// TODO 1: log the length of the first word
//         HINT: strings have a .length property, just like arrays
console.log(words[0].length);

// TODO 2: define a function called findLongest
//         it takes the words array as a parameter
//         it should loop over the array, keep track of the longest
//         word found so far, and log it at the end
//
//         HINT: start with a variable — let longest = ''
//         then inside the loop, compare words[i].length > longest.length
//         if true, update longest

function findLongest(words) {
  let longest = '';
  for (let i = 0; i < words.length; i++) {
    if (words[i].length > longest.length) {
      longest = words[i];
    }
  }
  console.log("Longest word: " + longest);
}

// TODO 3: call findLongest with the "words" array as parameter
findLongest(words);