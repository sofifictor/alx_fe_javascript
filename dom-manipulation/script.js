// quotes array - initial data or loaded from localStorage
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "Be yourself; everyone else is already taken.", category: "Inspiration" },
  { text: "Two things are infinite: the universe and human stupidity.", category: "Humor" },
];

// Load last selected category filter or default to 'all'
let selectedCategory = localStorage.getItem('selectedCategory') || 'all';

// Display a random quote based on selected category filter
function showRandomQuote() {
  let filteredQuotes = selectedCategory === 'all' ? quotes : quotes.filter(q => q.category === selectedCategory);
  if (filteredQuotes.length === 0) {
    document.getElementById('quoteDisplay').innerHTML = 'No quotes available for this category.';
    return;
  }
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];
  document.getElementById('quoteDisplay').innerHTML = `<p>${quote.text}</p><small>Category: ${quote.category}</small>`;

  // Save last viewed quote text to sessionStorage (task 1)
  sessionStorage.setItem('lastViewedQuote', quote.text);
}

// Add new quote and update UI/storage/categories
function addQuote() {
  const newText = document.getElementById('newQuoteText').value.trim();
  const newCategory = document.getElementById('newQuoteCategory').value.trim();
  if (!newText || !newCategory) {
    alert('Please enter both quote text and category.');
    return;
  }
  quotes.push({ text: newText, category: newCategory });
  saveQuotes();
  populateCategories();
  showRandomQuote();

  // Clear inputs
  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
}

// Save quotes array and selected category to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
  localStorage.setItem('selectedCategory', selectedCategory);
}

// Populate category dropdown dynamically with unique categories + 'all'
function populateCategories() {
  const categoryFilter = document.getElementById('categoryFilter');
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
  categoryFilter.value = selectedCategory;
}

// Filter quotes based on selected category and update UI
function filterQuotes() {
  const categoryFilter = document.getElementById('categoryFilter');
  selectedCategory = categoryFilter.value;
  saveQuotes();
  showRandomQuote();
}

// Export quotes as JSON file
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Import quotes from JSON file input
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert('Quotes imported successfully!');
        showRandomQuote();
      } else {
        alert('Invalid JSON format.');
      }
    } catch (err) {
      alert('Error parsing JSON.');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Simulated server URL (use JSONPlaceholder or a mock API)
const serverUrl = 'https://jsonplaceholder.typicode.com/posts';

// Fetch quotes from server (simulate)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(serverUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    const serverData = await response.json();
    // For simulation, map server data to quote format if possible
    // Here, just take first 5 posts as quotes
    const serverQuotes = serverData.slice(0, 5).map(post => ({
      text: post.title,
      category: 'Server'
    }));
    return serverQuotes;
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
}

// Post local quotes to server (simulate)
async function postQuotesToServer() {
  try {
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotes)
    });
    if (!response.ok) throw new Error('Network response was not ok');
    const result = await response.json();
    console.log('Posted quotes:', result);
  } catch (error) {
    console.error('Post error:', error);
  }
}

// Sync local quotes with server periodically
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();

  // Simple conflict resolution: server data overwrites local if different length
  if (serverQuotes.length && serverQuotes.length !== quotes.length) {
    quotes = serverQuotes;
    saveQuotes();
    populateCategories();
    showRandomQuote();
    showSyncNotification('Quotes synced with server and updated locally.');
  }
}

// Show UI notification for sync
function showSyncNotification(message) {
  let notif = document.getElementById('syncNotification');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'syncNotification';
    notif.style.position = 'fixed';
    notif.style.top = '10px';
    notif.style.right = '10px';
    notif.style.backgroundColor = '#4CAF50';
    notif.style.color = 'white';
    notif.style.padding = '10px';
    notif.style.borderRadius = '5px';
    document.body.appendChild(notif);
  }
  notif.textContent = message;
  setTimeout(() => { notif.textContent = ''; }, 5000);
}

// Event listeners
document.getElementById('newQuote').addEventListener('click', showRandomQuote);
document.getElementById('categoryFilter').addEventListener('change', filterQuotes);
document.getElementById('exportBtn').addEventListener('click', exportToJsonFile);
document.getElementById('importFile').addEventListener('change', importFromJsonFile);

// Initialize page
populateCategories();
showRandomQuote();
syncQuotes();
setInterval(syncQuotes, 30000); // sync every 30 seconds



