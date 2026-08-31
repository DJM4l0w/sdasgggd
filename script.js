const API = 'https://de1.api.radio-browser.info/json';
let allStations = [];
let currentPage = 1;
const PAGE_SIZE = 50;
let isLoading = false;
let currentStation = null;
let currentList = [];
let audio = new Audio();
let isPlaying = false;
let favorites = new Set(JSON.parse(localStorage.getItem('radioFavs') || '[]'));
let favoriteStations = JSON.parse(localStorage.getItem('radioFavStations') || '[]');
let currentGenre = 'all';
let searchQuery = '';
let hasLoadedAll = false;
let recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');

const genres = [
    { name: 'All', tag: 'all', emoji: '🌐' },
    { name: 'Pop', tag: 'pop', emoji: '🎵' },
    { name: 'Rock', tag: 'rock', emoji: '🎸' },
    { name: 'Electronic', tag: 'electronic', emoji: '⚡' },
    { name: 'House', tag: 'house', emoji: '🏠' },
    { name: 'Techno', tag: 'techno', emoji: '🔊' },
    { name: 'Jazz', tag: 'jazz', emoji: '🎷' },
    { name: 'Classical', tag: 'classical', emoji: '🎻' },
    { name: 'Hip Hop', tag: 'hiphop', emoji: '🎤' },
    { name: 'Country', tag: 'country', emoji: '🌾' },
    { name: 'News', tag: 'news', emoji: '📰' },
    { name: 'Sports', tag: 'sport', emoji: '⚽' },
    { name: 'Reggae', tag: 'reggae', emoji: '🌴' },
    { name: 'Blues', tag: 'blues', emoji: '🎸' },
    { name: 'Trance', tag: 'trance', emoji: '🌀' },
    { name: 'EDM', tag: 'edm', emoji: '🎆' }
];

document.addEventListener('DOMContentLoaded', init);

async function init() {
    renderGenres();
    showLoading(true);
    await loadStationsFast();
    showLoading(false);
    applyFilter();
    updateFavCount();
    setupInfiniteScroll();
    setupSmartSearch();
}

// ============ CARREGAMENTO RÁPIDO ============
async function loadStationsFast() {
    try {
        console.log('🚀 Loading stations...');
        const startTime = Date.now();
        
        const popularResponse = await fetch(`${API}/stations/topvote/500?hidebroken=true`);
        const popularStations = await popularResponse.json();
        
        const countries = ['BR', 'US', 'GB', 'DE', 'FR', 'ES', 'PT', 'IT', 'NL', 'CA'];
        const countryPromises = countries.map(code =>
            fetch(`${API}/stations/bycountrycodeexact/${code}?limit=200&hidebroken=true&order=clickcount&reverse=true`)
                .then(r => r.json())
                .catch(() => [])
        );
        
        const countryResults = await Promise.all(countryPromises);
        const countryStations = countryResults.flat();
        
        const unique = new Map();
        
        [...popularStations, ...countryStations].forEach(s => {
            if (s.stationuuid && s.url_resolved && !unique.has(s.stationuuid)) {
                unique.set(s.stationuuid, s);
            }
        });
        
        allStations = Array.from(unique.values());
        
        if (allStations.length < 8000) {
            const genrePromises = genres.slice(1, 9).map(g =>
                fetch(`${API}/stations/search?tag=${g.tag}&limit=300&hidebroken=true&order=clickcount&reverse=true`)
                    .then(r => r.json())
                    .catch(() => [])
            );
            
            const genreResults = await Promise.all(genrePromises);
            
            genreResults.flat().forEach(s => {
                if (s.stationuuid && s.url_resolved && !unique.has(s.stationuuid)) {
                    unique.set(s.stationuuid, s);
                }
            });
            
            allStations = Array.from(unique.values());
        }
        
        console.log(`🎉 Total: ${allStations.length} stations in ${Date.now() - startTime}ms`);
        
        const countElement = document.getElementById('stationCount');
        if (countElement) countElement.textContent = `${allStations.length} stations available`;
        
    } catch(e) {
        console.error('Error:', e);
        try {
            const fallbackResponse = await fetch(`${API}/stations/topvote/500?hidebroken=true`);
            allStations = await fallbackResponse.json();
        } catch(e2) {
            console.error('Fallback error:', e2);
        }
    }
}

// ============ SEARCH INTELIGENTE ============
function setupSmartSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        smartSearch(query);
    });
    
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.length >= 2) {
            showSearchSuggestions(searchInput.value);
        }
    });
    
    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            hideSearchSuggestions();
        }, 200);
    });
}

function smartSearch(query) {
    if (!query) {
        searchQuery = '';
        hideSearchSuggestions();
        applyFilter();
        return;
    }
    
    searchQuery = query;
    
    if (query.length >= 2) {
        showSearchSuggestions(query);
    }
    
    // Debounce para busca principal
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 300);
}

function performSearch(query) {
    const q = query.toLowerCase();
    const results = allStations.filter(s => {
        const name = (s.name || '').toLowerCase();
        const tags = (s.tags || '').toLowerCase();
        const country = (s.country || '').toLowerCase();
        const state = (s.state || '').toLowerCase();
        const language = (s.language || '').toLowerCase();
        
        return name.includes(q) || 
               tags.includes(q) || 
               country.includes(q) || 
               state.includes(q) ||
               language.includes(q);
    });
    
    currentList = results;
    currentPage = 1;
    document.getElementById('stationList').innerHTML = '';
    document.getElementById('endMessage').style.display = 'none';
    
    const titleElement = document.getElementById('sectionTitle');
    if (titleElement) {
        titleElement.textContent = `🔍 Results for "${query}" (${results.length})`;
    }
    
    if (results.length === 0) {
        document.getElementById('stationList').innerHTML = `
            <div style="text-align:center;padding:60px 20px;">
                <p style="font-size:3rem;margin-bottom:15px;">🔍</p>
                <h3 style="margin-bottom:10px;">No stations found</h3>
                <p style="color:#606070;">Try different keywords or check spelling</p>
            </div>
        `;
    } else {
        loadMoreStations();
    }
    
    hideSearchSuggestions();
}

function showSearchSuggestions(query) {
    const q = query.toLowerCase();
    const suggestions = allStations.filter(s => {
        const name = (s.name || '').toLowerCase();
        return name.includes(q) || (s.tags || '').toLowerCase().includes(q);
    }).slice(0, 8);
    
    if (suggestions.length === 0) return;
    
    let suggestionBox = document.getElementById('searchSuggestions');
    
    if (!suggestionBox) {
        suggestionBox = document.createElement('div');
        suggestionBox.id = 'searchSuggestions';
        suggestionBox.className = 'search-suggestions';
        document.querySelector('.search-box').appendChild(suggestionBox);
    }
    
    suggestionBox.innerHTML = '';
    suggestionBox.style.display = 'block';
    
    suggestions.forEach(s => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        
        const img = s.favicon ? 
            `<img src="${s.favicon}" onerror="this.parentElement.innerHTML='📻'">` : '📻';
        
        item.innerHTML = `
            <div class="suggestion-img">${img}</div>
            <div class="suggestion-info">
                <h4>${highlightMatch(s.name, q)}</h4>
                <p>${s.country || ''}${s.tags ? ' · ' + s.tags.split(',')[0] : ''}</p>
            </div>
        `;
        
        item.onclick = () => {
            const input = document.getElementById('searchInput');
            input.value = s.name;
            searchQuery = s.name;
            hideSearchSuggestions();
            performSearch(s.name);
        };
        
        suggestionBox.appendChild(item);
    });
}

function highlightMatch(text, query) {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    
    return text.slice(0, index) + 
           '<span class="highlight">' + text.slice(index, index + query.length) + '</span>' + 
           text.slice(index + query.length);
}

function hideSearchSuggestions() {
    const suggestionBox = document.getElementById('searchSuggestions');
    if (suggestionBox) suggestionBox.style.display = 'none';
}

function debounceSearch(query) {
    smartSearch(query);
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    searchQuery = '';
    hideSearchSuggestions();
    currentPage = 1;
    applyFilter();
}

// ============ SISTEMA DE FAVORITOS ============
function toggleFavorite(station) {
    const targetStation = station || currentStation;
    if (!targetStation) return;
    
    const uuid = targetStation.stationuuid;
    
    if (favorites.has(uuid)) {
        favorites.delete(uuid);
        favoriteStations = favoriteStations.filter(s => s.stationuuid !== uuid);
        showToast('💔 Removed from favorites');
    } else {
        favorites.add(uuid);
        favoriteStations.push({
            stationuuid: uuid,
            name: targetStation.name,
            favicon: targetStation.favicon,
            country: targetStation.country,
            tags: targetStation.tags,
            url_resolved: targetStation.url_resolved,
            bitrate: targetStation.bitrate,
            addedAt: new Date().toISOString()
        });
        showToast('❤️ Added to favorites!');
    }
    
    localStorage.setItem('radioFavs', JSON.stringify([...favorites]));
    localStorage.setItem('radioFavStations', JSON.stringify(favoriteStations));
    
    updateFavCount();
    updatePlayerUI();
    updateAllCards();
}

function updateAllCards() {
    document.querySelectorAll('.station-card').forEach(card => {
        const uuid = card.dataset.uuid;
        const favBtn = card.querySelector('.card-fav-btn');
        if (favBtn) {
            favBtn.textContent = favorites.has(uuid) ? '❤️' : '🤍';
        }
    });
}

function showFavorites() {
    if (favoriteStations.length === 0) {
        document.getElementById('stationList').innerHTML = `
            <div style="text-align:center;padding:60px 20px;">
                <p style="font-size:3rem;margin-bottom:15px;">💔</p>
                <h3 style="margin-bottom:10px;">No favorites yet</h3>
                <p style="color:#606070;margin-bottom:20px;">Tap the heart icon on any station to add it here</p>
                <button onclick="showAllStations()" style="padding:12px 24px;background:#6c63ff;border:none;border-radius:25px;color:white;cursor:pointer;">
                    Browse Stations
                </button>
            </div>
        `;
        document.getElementById('sectionTitle').textContent = '❤️ Favorites';
        return;
    }
    
    currentList = favoriteStations;
    currentPage = 1;
    document.getElementById('stationList').innerHTML = '';
    document.getElementById('sectionTitle').textContent = `❤️ Favorites (${favoriteStations.length})`;
    document.getElementById('endMessage').style.display = 'none';
    loadMoreStations();
}

function showAllStations() {
    currentGenre = 'all';
    searchQuery = '';
    document.getElementById('searchInput').value = '';
    applyFilter();
}

// ============ SHARE COM NOME DA RÁDIO ============
async function shareStation(station) {
    const targetStation = station || currentStation;
    if (!targetStation) return;
    
    const stationName = targetStation.name;
    const stationUrl = targetStation.url_resolved || targetStation.homepage || '';
    const country = targetStation.country || '';
    const genre = targetStation.tags ? targetStation.tags.split(',')[0] : '';
    
    const shareText = `🎵 Now listening to ${stationName}${country ? ' from ' + country : ''}${genre ? ' [' + genre + ']' : ''} on RadioHub! 📻`;
    
    const shareData = {
        title: stationName,
        text: shareText,
        url: stationUrl || window.location.href
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
            showToast('✅ Shared successfully!');
        } else if (navigator.clipboard) {
            const copyText = `${stationName}\n${shareText}\n${stationUrl || 'Listen on RadioHub'}`;
            await navigator.clipboard.writeText(copyText);
            showToast('📋 Station info copied!');
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = `${stationName}\n${shareText}\n${stationUrl || ''}`;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('📋 Station info copied!');
        }
    } catch(e) {
        console.error('Share error:', e);
        showToast('❌ Could not share');
    }
}

// ============ PLAYER ============
async function playStation(station, list) {
    if (!station || !station.url_resolved) {
        showToast('❌ No stream available');
        return;
    }
    
    if (currentStation) {
        audio.pause();
    }
    
    currentStation = station;
    if (list) currentList = list;
    
    addToRecentlyPlayed(station);
    
    try {
        audio.src = station.url_resolved;
        audio.load();
        await audio.play();
        isPlaying = true;
        
        document.getElementById('miniPlayer').style.display = 'block';
        updatePlayerUI();
        updatePlayingCard();
        showToast('▶️ ' + station.name);
        
    } catch(e) {
        console.error('Play error:', e);
        showToast('❌ Error playing station');
    }
}

function addToRecentlyPlayed(station) {
    recentlyPlayed = recentlyPlayed.filter(s => s.stationuuid !== station.stationuuid);
    recentlyPlayed.unshift({
        stationuuid: station.stationuuid,
        name: station.name,
        favicon: station.favicon,
        country: station.country,
        playedAt: new Date().toISOString()
    });
    recentlyPlayed = recentlyPlayed.slice(0, 20);
    localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
}

function updatePlayerUI() {
    if (!currentStation) return;
    
    const img = currentStation.favicon ?
        `<img src="${currentStation.favicon}" onerror="this.parentElement.innerHTML='📻'">` : '📻';
    
    document.getElementById('miniImg').innerHTML = img;
    document.getElementById('miniName').textContent = currentStation.name;
    document.getElementById('miniStatus').textContent = isPlaying ? '🔴 LIVE' : '⏸️ Paused';
    document.getElementById('miniPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    
    document.getElementById('playerArtwork').innerHTML = img;
    document.getElementById('playerName').textContent = currentStation.name;
    document.getElementById('playerInfo').textContent = 
        `${currentStation.tags ? currentStation.tags.split(',')[0] : 'Unknown'} · ${currentStation.country || 'Unknown'}`;
    document.getElementById('mainPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    document.getElementById('favBtn').textContent = 
        favorites.has(currentStation.stationuuid) ? '❤️ Favorited' : '🤍 Add to Favorites';
}

function updatePlayingCard() {
    document.querySelectorAll('.station-card').forEach(c => c.classList.remove('playing'));
    
    if (currentStation) {
        const currentCard = document.querySelector(`[data-uuid="${currentStation.stationuuid}"]`);
        if (currentCard) currentCard.classList.add('playing');
    }
}

function togglePlay() {
    if (!currentStation) return;
    
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
    } else {
        audio.play().catch(() => showToast('❌ Error playing'));
        isPlaying = true;
    }
    
    updatePlayerUI();
}

function prevStation() {
    if (!currentList.length) return;
    const idx = currentList.findIndex(s => s.stationuuid === currentStation?.stationuuid);
    if (idx > 0) playStation(currentList[idx - 1], currentList);
    else showToast('📻 Already at first station');
}

function nextStation() {
    if (!currentList.length) return;
    const idx = currentList.findIndex(s => s.stationuuid === currentStation?.stationuuid);
    if (idx < currentList.length - 1) playStation(currentList[idx + 1], currentList);
    else showToast('📻 Already at last station');
}

function setVolume(v) {
    audio.volume = v / 100;
}

// ============ CREATE CARD ============
function createCard(station) {
    const card = document.createElement('div');
    card.className = 'station-card';
    card.dataset.uuid = station.stationuuid;
    
    if (currentStation && currentStation.stationuuid === station.stationuuid) {
        card.classList.add('playing');
    }
    
    const img = station.favicon ?
        `<img src="${station.favicon}" loading="lazy" onerror="this.parentElement.innerHTML='📻'">` : '📻';
    
    const isFav = favorites.has(station.stationuuid);
    
    card.innerHTML = `
        <div class="station-img">${img}</div>
        <div class="station-info">
            <h3>${station.name || 'Unknown'}</h3>
            <p>${station.country || ''}${station.state ? ' · ' + station.state : ''}${station.bitrate ? ' · ' + station.bitrate + 'kbps' : ''}</p>
        </div>
        <button class="card-fav-btn" onclick="event.stopPropagation(); toggleFavoriteStation('${station.stationuuid}')">
            ${isFav ? '❤️' : '🤍'}
        </button>
    `;
    
    card.addEventListener('click', () => playStation(station, currentList));
    return card;
}

function toggleFavoriteStation(uuid) {
    const station = allStations.find(s => s.stationuuid === uuid) || 
                    favoriteStations.find(s => s.stationuuid === uuid);
    if (station) toggleFavorite(station);
}

// ============ RENDER GENRES ============
function renderGenres() {
    const grid = document.getElementById('genresGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    genres.forEach(g => {
        const btn = document.createElement('button');
        btn.className = 'genre-btn' + (g.tag === currentGenre ? ' active' : '');
        btn.innerHTML = `<span class="emoji">${g.emoji}</span>${g.name}`;
        btn.onclick = () => {
            currentGenre = g.tag;
            currentPage = 1;
            document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilter();
        };
        grid.appendChild(btn);
    });
}

// ============ FILTER ============
function applyFilter() {
    let filtered = allStations;
    
    if (currentGenre !== 'all') {
        filtered = allStations.filter(s => s.tags && s.tags.toLowerCase().includes(currentGenre));
    }
    
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(s =>
            (s.name && s.name.toLowerCase().includes(q)) ||
            (s.tags && s.tags.toLowerCase().includes(q)) ||
            (s.country && s.country.toLowerCase().includes(q))
        );
    }
    
    currentList = filtered;
    currentPage = 1;
    
    document.getElementById('stationList').innerHTML = '';
    document.getElementById('endMessage').style.display = 'none';
    
    const titleElement = document.getElementById('sectionTitle');
    if (titleElement) {
        if (searchQuery) {
            titleElement.textContent = `Search Results (${filtered.length})`;
        } else if (currentGenre !== 'all') {
            const genre = genres.find(g => g.tag === currentGenre);
            titleElement.textContent = `${genre ? genre.name : ''} Stations (${filtered.length})`;
        } else {
            titleElement.textContent = 'Popular Stations';
        }
    }
    
    loadMoreStations();
}

// ============ LOAD MORE ============
function loadMoreStations() {
    if (isLoading) return;
    
    const start = (currentPage - 1) * PAGE_SIZE;
    const batch = currentList.slice(start, start + PAGE_SIZE);
    
    if (batch.length === 0) {
        document.getElementById('endMessage').style.display = 'block';
        document.getElementById('loadingMore').style.display = 'none';
        return;
    }
    
    isLoading = true;
    document.getElementById('loadingMore').style.display = 'block';
    
    requestAnimationFrame(() => {
        const fragment = document.createDocumentFragment();
        batch.forEach(station => fragment.appendChild(createCard(station)));
        document.getElementById('stationList').appendChild(fragment);
        currentPage++;
        isLoading = false;
        document.getElementById('loadingMore').style.display = 'none';
    });
}

// ============ INFINITE SCROLL ============
function setupInfiniteScroll() {
    let scrollTimeout;
    
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const scrollPosition = window.innerHeight + window.scrollY;
            const threshold = document.body.offsetHeight - 800;
            
            if (scrollPosition >= threshold) {
                loadMoreStations();
            }
        }, 100);
    });
}

// ============ UTILIDADES ============
function updateFavCount() {
    document.getElementById('favCount').textContent = favorites.size;
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = msg;
    toast.classList.add('show');
    
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

function showLoading(show) {
    const listElement = document.getElementById('stationList');
    if (!listElement) return;
    
    if (show) {
        listElement.innerHTML = `
            <div style="text-align:center;padding:60px 20px;">
                <div class="spinner"></div>
                <p style="color:#606070;margin-top:15px;">Loading stations...</p>
            </div>
        `;
    }
}

// ============ AUDIO EVENTS ============
audio.addEventListener('playing', () => { 
    isPlaying = true; 
    updatePlayerUI(); 
});

audio.addEventListener('pause', () => { 
    isPlaying = false; 
    updatePlayerUI(); 
});

audio.addEventListener('error', () => { 
    isPlaying = false; 
    updatePlayerUI();
    showToast('❌ Stream error'); 
});

audio.addEventListener('waiting', () => {
    const miniStatus = document.getElementById('miniStatus');
    if (miniStatus) miniStatus.textContent = '🔄 Buffering...';
});

audio.addEventListener('canplay', () => {
    if (isPlaying) {
        const miniStatus = document.getElementById('miniStatus');
        if (miniStatus) miniStatus.textContent = '🔴 LIVE';
    }
});
