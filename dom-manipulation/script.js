// Quotes array with initial sample quotes
let quotes = [
  { text: "Be yourself; everyone else is already taken.", category: "Inspiration" },
  { text: "Two things are infinite: the universe and human stupidity.", category: "Humor" },
  { text: "The only true wisdom is in knowing you know nothing.", category: "Philosophy" }
];

// Load quotes from localStorage if any
function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  if (stored) quotes = JSON.parse(stored);
}
loadQuotes();

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Show a random quote on the page
function showRandomQuote() {
  if (quotes.length === 0) {
    document.getElementById("quoteDisplay").innerHTML = "No quotes available.";
    return;
  }

  const filteredQuotes = getFilteredQuotes();
  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").innerHTML = "No quotes in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  document.getElementById("quoteDisplay").innerHTML = `<p>"${quote.text}"</p><p><em>Category: ${quote.category}</em></p>`;

  // Save last viewed quote index in sessionStorage (optional)
  sessionStorage.setItem("lastQuoteText", quote.text);
}

// Helper to get quotes filtered by category
function getFilteredQuotes() {
  const filterSelect = document.getElementById("categoryFilter");
  const selected = filterSelect ? filterSelect.value : "all";
  if (selected === "all") return quotes;
  return quotes.filter(q => q.category === selected);
}

// Create and show the form to add new quotes
function createAddQuoteForm() {
  const container = document.getElementById("addQuoteFormContainer");
  container.innerHTML = `
    <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
    <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
    <button id="addQuoteBtn">Add Quote</button>
  `;

  document.getElementById("addQuoteBtn").onclick = addQuote;
}

// Add a new quote to the array and update the DOM/storage
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (!text || !category) {
    alert("Please enter both quote text and category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();

  // Clear inputs
  textInput.value = "";
  categoryInput.value = "";

  populateCategories();
  showRandomQuote();

  // Optionally hide the form after adding
  document.getElementById("addQuoteFormContainer").innerHTML = "";
}

// Populate categories dropdown from quotes array
function populateCategories() {
  const select = document.getElementById("categoryFilter");
  const selected = select.value;

  // Get unique categories
  const categories = [...new Set(quotes.map(q => q.category))].sort();

  // Clear options except 'all'
  select.innerHTML = `<option value="all">All Categories</option>`;

  for (const cat of categories) {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  }

  // Restore previous selected category if still present
  if ([...select.options].some(o => o.value === selected)) {
    select.value = selected;
  } else {
    select.value = "all";
  }

  // Save last selected category in localStorage
  localStorage.setItem("lastCategory", select.value);
}

// Filter quotes and show one when category changes
function filterQuotes() {
  const select = document.getElementById("categoryFilter");
  localStorage.setItem("lastCategory", select.value);
  showRandomQuote();
}

// Load last selected category from storage on page load
function loadLastCategory() {
  const lastCategory = localStorage.getItem("lastCategory");
  if (lastCategory) {
    const select = document.getElementById("categoryFilter");
    if ([...select.options].some(o => o.value === lastCategory)) {
      select.value = lastCategory;
    }
  }
}

// JSON export function
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// JSON import function
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        showRandomQuote();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid JSON file format.");
      }
    } catch {
      alert("Failed to parse JSON file.");
    }
  };
  reader.readAsText(file);
}

// Sync with server simulation (task 3)
async function fetchQuotesFromServer() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
  const data = await res.json();
  // Map server data to quotes format
  const serverQuotes = data.map(item => ({
    text: item.title,
    category: "Server"
  }));

  return serverQuotes;
}

async function postQuotesToServer() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    body: JSON.stringify(quotes),
    headers: { "Content-Type": "application/json" }
  });
  return res.ok;
}

async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();

  // Simple conflict resolution: server data overwrites local
  quotes = serverQuotes;
  saveQuotes();
  populateCategories();
  showRandomQuote();

  // Show notification to user
  showNotification("Quotes synced with server");
}

// Show a temporary notification message
function showNotification(message) {
  let notif = document.getElementById("notification");
  if (!notif) {
    notif = document.createElement("div");
    notif.id = "notification";
    notif.style.position = "fixed";
    notif.style.top = "10px";
    notif.style.right = "10px";
    notif.style.backgroundColor = "#333";
    notif.style.color = "white";
    notif.style.padding = "10px";
    notif.style.borderRadius = "5px";
    document.body.appendChild(notif);
  }
  notif.textContent = message;
  setTimeout(() => (notif.textContent = ""), 3000);
}

// Event listeners setup
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
document.getElementById("showAddForm").addEventListener("click", createAddQuoteForm);
document.getElementById("exportQuotes").addEventListener("click", exportToJsonFile);
window.addEventListener("load", () => {
  populateCategories();
  loadLastCategory();
  showRandomQuote();

  // Start periodic sync every 60s
  setInterval(syncQuotes, 60000);
});


