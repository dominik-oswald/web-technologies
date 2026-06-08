// ============================================================
// EXERCISE: DOM Events 3 — Multiple Listeners + Counter
// ============================================================
//
// GOAL
// ----
// Each list item can be clicked to mark it as "done":
//   - strike through the text (text-decoration: line-through)
//   - clicking it again un-marks it
//
// The <p> at the bottom always shows how many items are done:
//   "2 items done"
//
// ============================================================

// TODO 3: after toggling, count how many items currently have line-through
const items = document.querySelectorAll('[data-el="item"]');
const status = document.querySelector('[data-el="status"]');

// Add a click listener to each item. Toggle the line-through style and
// then update the status paragraph showing how many items are done.
items.forEach((item) => {
    item.addEventListener("click", () => {
        if (item.style.textDecoration === "line-through") {
            item.style.textDecoration = "none";
        } else {
            item.style.textDecoration = "line-through";
        }
        updateStatus();
    });
});

function updateStatus() {
    let count = 0;
    items.forEach((it) => {
        if (it.style.textDecoration === "line-through") {
            count++;
        }
    });
    status.textContent = count + " items done";
}

updateStatus();