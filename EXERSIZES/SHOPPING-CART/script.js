// ============================================================
// EXERCISE: Shopping Cart
// ============================================================
//
// Open the browser console to see your results.
// (Right-click the page → Inspect → Console)
//
// ============================================================

const cart = [
  { name: 'Tomatoes',  price: 2.50, quantity: 3 },
  { name: 'Bread',     price: 4.20, quantity: 1 },
  { name: 'Olive Oil', price: 8.90, quantity: 2 },
  { name: 'Cheese',    price: 6.30, quantity: 1 },
  { name: 'Pasta',     price: 1.80, quantity: 4 },
];


// TODO 1: log the name of the first item in the cart
console.log(cart[0].name);


// TODO 2: calculate and log the total price of the entire cart
//         each item costs price * quantity
//         HINT: start with  let total = 0  then add to it in a loop
let total = 0;
for (let i = 0; i < cart.length; i++) {
  total += cart[i].price * cart[i].quantity;
}
console.log('Total:', total);


// TODO 3: find and log the most expensive item (by price per unit)
//         HINT: same pattern as the longest-word exercise —
//         start with  let mostExpensive = cart[0]  and compare in a loop
let mostExpensive = cart[0];
for (let i = 1; i < cart.length; i++) {
  if (cart[i].price > mostExpensive.price) {
    mostExpensive = cart[i];
  }
}
console.log('Most expensive item:', mostExpensive.name);


// TODO 4: define a function called applyDiscount
//         it takes two parameters: total and percent
//         it should log the discounted total as: "After 10% discount: CHF 21.30"
//         HINT: discounted = total - (total * percent / 100)
function applyDiscount(total, percent) {
  const discounted = total - (total * percent / 100);
  console.log(`After ${percent}% discount: CHF ${discounted.toFixed(2)}`);
}

// TODO 5: call applyDiscount with your total from TODO 2 and a 10% discount
applyDiscount(total, 10);