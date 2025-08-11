// script.js - Dynamic Quote Generator with storage, import/export, filtering, and simulated server sync

(() => {
  const STORAGE_KEY = 'dqg_quotes_v1';
  const FILTER_KEY = 'dqg_lastFilter';
  const LAST_VIEWED_KEY = 'dqg_lastViewed';

  let quotes = [];
  let currentFilter = 'all';

  // --- default data (used on first run) ---
  function defaultQuotes() {
    const now = Date.now();
    return [
      { id: 'local-1', text: 'Be yourself; everyone else is already taken.', category: 'inspirational', updatedAt: now, source: 'local' },
      { id: 'local-2', text: 'Simplicity is the ultimate sophistication.', category: 'design', updatedAt: now, source: 'local' },
      { id: 'local-3', text: 'The only way to do great work is to love what you do.', category: 'work', updatedAt: now, source: 'local' }
    ];
  }

  // --- storage helpers ---
  function saveQuotes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
    populateCategories();
  }

  function loadQuotes() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        quotes = JSON.parse(raw);
      } catch (err) {
        console.error('Invalid stored quotes; resetting', err);
        quotes = defaultQuotes();
        saveQuotes();
      }
    } else {
      quotes = defaultQuotes();
      saveQuotes();
    }
    currentFilter = localStorage.getItem(FILTER_KEY) || 'all';
  }

  // --- UI helpers ---
  function populateCategories() {
    const sel = document.getElementById('categoryFilter');
    if (!sel) return;
    // build categories from quotes
    const cats = Array.from(new Set(quotes.map(q => q.category || 'uncategorized'))).sort();
    sel.innerHTML = '';
    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = 'All Categories';
    sel.appendChild(allOpt);
    cats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      sel.appendChild(opt);
    });
    // restore last filter
    sel.value = currentFilter;
  }

  function getFilteredQuotes() {
    if (currentFilter === 'all') return quotes.slice();
    return quotes.filter(q => q.category === currentFilter);
  }

  // --- required function: showRandomQuote ---
  function showRandomQuote() {
    const list = getFilteredQuotes();
    const display = document.getElementById('quoteDisplay');
    if (!display) return;
    if (!list.length) {
      display.innerHTML = `<div class="text">No quotes for this category.</div>`;
      return;
    }
    const i = Math.floor(Math.random() * list.length);
    const q = list[i];
    display.innerHTML = `
      <div class="text">${escapeHtml(q.text)}</div>
      <div class="meta">— ${escapeHtml(q.category)} ${q.source ? '(' + q.source + ')' : ''}</div>
    `;
    sessionStorage.setItem(LAST_VIEWED_KEY, JSON.stringify(q));
  }

  // small helper to avoid naive HTML injection when inserting user text
  function escapeHtml(str = '') {
    return String(str).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  // --- required function: createAddQuoteForm ---
  // Creates the add-quote form dynamically and attaches event handler
  function createAddQuoteForm() {
    const container = document.getElementById('addQuoteContainer');
    if (!container) return;
    container.innerHTML = `
      <div class="add-quote-form">
        <input id="newQuoteText" type="text" placeholder="Enter a new quote" style="width:60%;" />
        <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
        <button id="addQuoteBtn">Add Quote</button>
      </div>
    `;
    document.getElementById('addQuoteBtn').addEventListener('click', addQuote);
  }

  // Add the quote from the dynamic form to the quotes array and storage
  function addQuote() {
    const textEl = document.getElementById('newQuoteText');
    const catEl = document.getElementById('newQuoteCategory');
    if (!textEl) return;
    const text = textEl.value.trim();
    const category = (catEl && catEl.value.trim()) || 'uncategorized';
    if (!text) {
      alert('Please enter quote text.');
      return;
    }
    const newQ = {
      id: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
      text,
      category,
      updatedAt: Date.now(),
      source: 'local'
    };
    quotes.push(newQ);
    saveQuotes();
    textEl.value = '';
    if (catEl) catEl.value = '';
    showRandomQuote();
    notify('Quote added.');
  }

  // Filter handler (connected to select)
  function filterQuotes() {
    const sel = document.getElementById('categoryFilter');
    currentFilter = sel ? sel.value : 'all';
    localStorage.setItem(FILTER_KEY, currentFilter);
    showRandomQuote();
  }

  // --- Import / Export JSON ---
  function exportToJsonFile() {
    const data = JSON.stringify(quotes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify('Exported quotes.json');
  }

  function importFromJsonFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!Array.isArray(parsed)) throw new Error('JSON root must be an array of quotes');
        let added = 0;
        parsed.forEach(obj => {
          if (!obj || typeof obj.text !== 'string') return;
          const cat = obj.category || 'uncategorized';
          // dedupe by text+category
          const exists = quotes.some(q => q.text === obj.text && q.category === cat);
          if (!exists) {
            quotes.push({
              id: obj.id || ('local-' + Date.now() + '-' + Math.random().toString(36).slice(2,5)),
              text: obj.text,
              category: cat,
              updatedAt: obj.updatedAt || Date.now(),
              source: 'local'
            });
            added++;
          }
        });
        if (added) {
          saveQuotes();
          notify(`Imported ${added} quotes`);
        } else {
          notify('No new quotes found in import');
        }
      } catch (err) {
        alert('Failed to import JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    // clear input so the same file can be re-imported if needed
    event.target.value = '';
  }

  // --- Simulated server sync + conflict handling ---
  // This uses jsonplaceholder.typicode.com to _simulate_ server quotes
  // Server wins strategy: if server quote differs, we replace local with server
  async function simulateServerSync() {
    notify('Checking server for updates...');
    try {
      const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
      if (!res.ok) throw new Error('Network response not ok');
      const posts = await res.json();
      // map posts to server quote objects
      const serverQuotes = posts.map(p => ({
        id: 'srv-' + p.id,
        text: p.body,
        category: 'server',
        updatedAt: Date.now(),
        source: 'server'
      }));

      const { conflicts, added } = mergeServerQuotes(serverQuotes);
      if (added.length || conflicts.length) {
        saveQuotes();
        let msg = '';
        if (added.length) msg += `Added ${added.length} server quotes. `;
        if (conflicts.length) msg += `${conflicts.length} conflict(s) resolved (server wins).`;
        notify(msg);
      } else {
        notify('No changes from server.');
      }
    } catch (err) {
      console.error(err);
      notify('Sync failed: ' + (err.message || 'unknown'));
    }
  }

  // merge server quotes into `quotes` array
  function mergeServerQuotes(serverQuotes) {
    const conflicts = [];
    const added = [];
    const localMap = new Map(quotes.map(q => [q.id, q]));

    serverQuotes.forEach(sq => {
      const local = localMap.get(sq.id);
      if (local) {
        if (local.text !== sq.text) {
          // server wins
          const idx = quotes.findIndex(q => q.id === local.id);
          quotes[idx] = sq;
          conflicts.push({ id: sq.id, local, server: sq });
        }
      } else {
        quotes.push(sq);
        added.push(sq);
      }
    });

    return { conflicts, added };
  }

  // small transient status notification
  function notify(msg) {
    const s = document.getElementById('status');
    if (!s) return;
    s.textContent = msg;
    setTimeout(() => {
      // clear only if message still current
      if (s.textContent === msg) s.textContent = '';
    }, 4000);
  }

  // --- initialize UI & behavior on load ---
  function init() {
    loadQuotes();
    populateCategories();
    createAddQuoteForm();

    const newQBtn = document.getElementById('newQuote');
    if (newQBtn) newQBtn.addEventListener('click', showRandomQuote);

    const filterSel = document.getElementById('categoryFilter');
    if (filterSel) filterSel.addEventListener('change', filterQuotes);

    const exportBtn = document.getElementById('exportJson');
    if (exportBtn) exportBtn.addEventListener('click', exportToJsonFile);

    const importInput = document.getElementById('importFile');
    if (importInput) importInput.addEventListener('change', importFromJsonFile);

    const syncBtn = document.getElementById('forceSync');
    if (syncBtn) syncBtn.addEventListener('click', simulateServerSync);

    // show initial quote
    showRandomQuote();

    // poll server every 30 seconds (simulation)
    setInterval(simulateServerSync, 30000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
