// ============================================================
// EXERCISE: DOM Events 2 — Input
// ============================================================
//
// GOAL
// ----
// As the user types in the textarea, update the counter
// to show how many characters have been typed:
//   "23 / 100"
//
// When the counter reaches 100, change its colour to red.
//
// ============================================================

const input = document.querySelector('[data-el="input"]');
const counter = document.querySelector('[data-el="counter"]');

// TODO 1: add an 'input' event listener to the textarea
//         HINT: the 'input' event fires every time the content changes
//         inside it, read input.value.length and update counter.textContent
input.addEventListener("input", () => {
  const length = input.value.length;
  counter.textContent = `${length} / 100`;

  // TODO 2: inside the same listener, check if the length has reached 100
  //         if yes, set counter.style.color to 'red'
  //         if no, set it back to its original color
  if (length >= 100) {
    counter.style.color = 'red';
  } else {
    counter.style.color = 'black';
  }
});