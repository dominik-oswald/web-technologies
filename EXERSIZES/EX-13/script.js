// ============================================================
// EXERCISE: Objects
// ============================================================
//
// Open the browser console to see your results.
// (Right-click the page → Inspect → Console)
//
// ============================================================

const recipe = {
  title: "Tomato Soup",
  duration: 30,
  vegetarian: true,
  author: {
    name: "Maria",
    country: "Brasil",
  },
  ingredients: ["Tomatoes", "Onions", "Garlic", "Olive oil", "Salt"],
};

// TODO 1: log the entire object
console.log(recipe);

// TODO 2: log just the title
console.log(recipe.title);

// TODO 3: log the author's name
console.log(recipe.author.name);

// TODO 4: log how many ingredients the recipe has
console.log(recipe.ingredients.length);

// TODO 5: loop over the ingredients and log each one
for (let i = 0; i < recipe.ingredients.length; i++) {
  console.log(recipe.ingredients[i]);
}
