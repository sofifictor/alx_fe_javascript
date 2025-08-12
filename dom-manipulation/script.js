// Initial quotes array - will be loaded from localStorage if available
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "Be yourself; everyone else is already taken.", category: "Inspiration" },
  { text: "The only way to do great work is to love what you do.", category: "Motivation" },
];

let currentQuoteIndex = null;
const quoteDisplay = document.getElementById('quoteDisplay');
const categoryFilter = document.getElementById('categoryFilter');
const syncStatus = document.getElementById('syncStatus');

function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

function displayRandomQuote() {
  let filteredQuotes = getFilteredQuotes();
  if(filteredQuotes.length === 0){
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }
  currentQuoteIndex = Math.floor(Math.random() * filteredQuotes.length);
  quoteDisplay.textContent = filteredQuotes[currentQuoteIndex].text;
  // Save last viewed quote to sessionStorage
  sessionStorage.setItem('lastQuote', JSON.stringify(filteredQuotes[currentQuoteIndex]));
}

function getFilteredQuotes() {
  const selectedCategory = localStorage.getItem('selectedCategory') || 'all';
  if (selectedCategory === 'all') return quotes;
  return quotes.filter(q => q.category === selectedCategory);
}

function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const categoryInput = document.getElementById('newQuoteCategory');
  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (!text || !category) {
    alert('Please enter both quote text and category.');
    return;
  }
  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  filterQuotes();

  textInput.value = '';
  categoryInput.value = '';
}

function populateCategories() {
  // Extract unique categories
  const categories = [...new Set(quotes.map(q => q.category))];
  // Clear all options except "All Categories"
  while (categoryFilter.options.length > 1) {
    categoryFilter.remove(1);
  }
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // Restore last selected category from localStorage
  const savedCategory = localStorage.getItem('selectedCategory') || 'all';
  categoryFilter.value = savedCategory;
}

function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  localStorage.setItem('selectedCategory', selectedCategory);
  displayRandomQuote();
}

// Export quotes to JSON file
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(evt) {
    try {
      const importedQuotes = JSON.parse(evt.target.result);
      if (Array.isArray(importedQuotes)) {
        // Basic validation of quote objects
        importedQuotes.forEach(q => {
          if(q.text && q.category) {
            quotes.push(q);
          }
        });
        saveQuotes();
        populateCategories();
        filterQuotes();
        alert('Quotes imported successfully!');
      } else {
        alert('Invalid file format.');
      }
    } catch (e) {
      alert('Failed to parse JSON.');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Sync simulation with server (mock API)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
    const serverData = await response.json();
    // Transform server data into quote objects (simulate)
    const serverQuotes = serverData.map(item => ({
      text: item.title,
      category: "Server"
    }));
    return serverQuotes;
  } catch {
    return [];
  }
}

async function postQuotesToServer() {
  try {
    // Mock posting the first quote just to simulate
    if (quotes.length > 0) {
      await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        body: JSON.stringify(quotes[0]),
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    // Fail silently
  }
}

async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  let updated = false;

  // Simple conflict resolution: Server data overrides duplicates by text
  serverQuotes.forEach(sq => {
    if (!quotes.some(lq => lq.text === sq.text)) {
      quotes.push(sq);
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    populateCategories();
    filterQuotes();
    syncStatus.textContent = 'Quotes synced with server.';
    setTimeout(() => { syncStatus.textContent = ''; }, 3000);
  }
  await postQuotesToServer();
}

// Event listeners
document.getElementById('newQuote').addEventListener('click', displayRandomQuote);
document.getElementById('exportQuotes').addEventListener('click', exportToJsonFile);

// Initialization
populateCategories();
const lastCategory = localStorage.getItem('selectedCategory');
if (lastCategory) categoryFilter.value = lastCategory;

const lastQuote = sessionStorage.getItem('lastQuote');
if (lastQuote) {
  quoteDisplay.textContent = JSON.parse(lastQuote).text;
} else {
  displayRandomQuote();
}

// Periodically sync with server every 60 seconds
setInterval(syncQuotes, 60000);



