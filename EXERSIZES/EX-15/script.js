// ============================================================
// EXERCISE: Selecting Elements in the DOM
// ============================================================
//
// https://javascript.info/searching-elements-dom
//
// Open the browser console to see your results.
// (Right-click the page → Inspect → Console)
//
// ============================================================


// TODO 1: select the <h1> by its id and log it
const title = document.getElementById("page-title");
console.log(title);


// TODO 2: select the first .recipe div using querySelector and log it
const firstRecipe = document.querySelector(".recipe");
console.log(firstRecipe);


// TODO 3: select ALL .recipe divs using querySelectorAll and log them
const allRecipes = document.querySelectorAll(".recipe");
console.log(allRecipes);


// TODO 4: log how many recipes are on the page
// HINT: querySelectorAll returns a NodeList — it also has .length
console.log(allRecipes.length);


// TODO 5: loop over allRecipes and log the textContent of each .recipe-title
// HINT: inside the loop, use querySelector on the current element
// to find the .recipe-title inside it
for (let i = 0; i < allRecipes.length; i++) {
console.log(allRecipes[i].querySelector(`.recipe-title`).textContent)
}

// TODO 6: select the recipe with data-category="dessert" and log it
//
//         WHY data-attributes instead of classes?
//         ----------------------------------------
//         Classes are for styling — they tell CSS how something looks.
//         If you rename or remove a class for visual reasons, your JS breaks.
//         data-attributes are purely for JavaScript and carry no visual meaning,
//         so CSS and JS stay independent and don't step on each other.
//         This is called separation of concerns.
//
//         HINT: querySelector can target data-attributes like CSS:
//         document.querySelector('[data-category="..."]')
const dessert = document.querySelector(`[data-category=dessert]`)
console.log(dessert);