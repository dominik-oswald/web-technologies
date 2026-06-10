// ============================================================
// EXERCISE: Fetching data from an API
// ============================================================
//
// GOAL
// ----
// Build a book search using the Open Library API.
// When the user searches for a title, display the results
// (book title + author) as a list on the page.
//
// API endpoint:
// https://openlibrary.org/search.json?q=YOUR_SEARCH_TERM
// e.g.: https://openlibrary.org/search.json?q=the+lord+of+the+rings
//
// Try it in your browser first to see what the response looks like.
// The data you need is inside: response.docs[]
// Each book has: .title and .author_name[]
//
//
// ============================================================

// console.log("script loaded");
// fetch("https://openlibrary.org/")
//   .then((response) => response.json())
//   .then((data) => {
//     });

// fetch("https://openlibrary.org/")
//   .then((response) => {
//     if (response.ok) {
//       return response.json();
//     } else {
//       throw new Error("NETWORK RESPONSE ERROR");
//     }
//   })
//   .then(data => {
//     console.log(data);
//     results(data)
//   })
//   .catch((error) => console.error("FETCH ERROR:", error));



const searchInput = document.querySelector("#search-input");
const searchButton = document.querySelector("#search-button");
const resultsList = document.querySelector("#results-list");

document.querySelector('#overlayBtn')?.addEventListener('click', swapper, false);
 {
  const searchTerm = searchInput.value.trim();
  if (searchTerm) {
    fetchBooks(searchTerm);
  }

console.log("pre fetch");
Show();
console.log("post fetch");

function Show() {
    fetch("https://openlibrary.org/search.json?q=")
        .then(onResponse)
        .then(onJson);
}

function onResponse(response) {
    console.log(response);
    return response.json();
}

function onJson(data) {
    console.log(data);
}
};