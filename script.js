const API = 'https://de1.api.radio-browser.info/json';
let allStations = [];
let displayedStations = [];
let currentPage = 1;
const PAGE_SIZE = 50;
let isLoading = false;
let currentStation = null;
let currentList = [];
let audio = new Audio();
let isPlaying = false;
let favorites = new Set(JSON.parse(localStorage.getItem('radioFavs') || '[]'));
let currentGenre = 'all';
let searchQuery = '';

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
    await loadAllStations();
    applyFilter();
    updateFavCount();
    setupInfiniteScroll();
}

async function loadAllStations() {
    showLoading(true);
    
    try {
        const genrePromises = genres.slice(1).map(g =>
            fetch(`${API}/stations/search?tag=${g.tag}&limit=500&order=clickcount&reverse=true&hidebroken=true`)
                .then(r => r.json())
                .catch(() => [])
        );
        
        const results = await Promise.all(genrePromises);
        const unique = new Map();
        
        results.flat().forEach(s => {
            if (s.stationuuid && s.url_resolved && !unique.has(s.stationuuid)) {
                unique.set(s.stationuuid, s);
            }
        });
        
        allStations = Array.from(unique.values());
        console.log(`Loaded ${allStations.length} stations`);
        
    } catch(e) {
        console.error('Load error:', e);
    }
    
    showLoading(false);
}

function renderGenres() {
    const grid = document.getElementById('genresGrid');
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

function applyFilter() {
    let filtered = allStations;
    
    if (currentGenre !== 'all') {
        filtered = allStations.filter(s => s.tags?.toLowerCase().includes(currentGenre));
    }
    
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(s =>
            s.name?.toLowerCase().includes(q) ||
            s.tags?.toLowerCase().includes(q) ||
            s.country?.toLowerCase().includes(q)
        );
    }
    
    currentList = filtered;
    currentPage = 1;
    displayedStations = [];
    document.getElementById('stationList').innerHTML = '';
    document.getElementById('endMessage').style.display = 'none';
    
    loadMoreStations();
}

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
    
    setTimeout(() => {
        batch.forEach(station => {
            document.getElementById('stationList').appendChild(createCard(station));
        });
        
        currentPage++;
        isLoading = false;
        document.getElementById('loadingMore').style.display = 'none';
    }, 100);
}

function createCard(station) {
    const card = document.createElement('div');
    card.className = 'station-card';
    if (currentStation?.stationuuid === station.stationuuid) card.classList.add('playing');
    
    const img = station.favicon ?
        `<img src="${station.favicon}" loading="lazy" onerror="this.parentElement.innerHTML='📻'">` : '📻';
    
    card.innerHTML = `
        <div class="station-img">${img}</div>
        <div class="station-info">
            <h3>${station.name || 'Unknown'}</h3>
            <p>${station.country || ''}${station.state ? ' · ' + station.state : ''}${station.bitrate ? ' · ' + station.bitrate + 'kbps' : ''}</p>
        </div>
    `;
    
    card.onclick = () => playStation(station);
    return card;
}

function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            loadMoreStations();
        }
    });
}

function debounceSearch(query) {
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        searchQuery = query;
        currentPage = 1;
        document.getElementById('stationList').innerHTML = '';
        applyFilter();
    }, 300);
}

async function playStation(station) {
    if (!station.url_resolved) {
        showToast('❌ No stream available');
        return;
    }
    
    currentStation = station;
    
    try {
        audio.src = station.url_resolved;
        await audio.play();
        isPlaying = true;
        
        document.getElementById('miniPlayer').style.display = 'block';
        updatePlayerUI();
        showToast('▶️ ' + station.name);
        
        document.querySelectorAll('.station-card').forEach(c => c.classList.remove('playing'));
        document.querySelectorAll('.station-card').forEach(c => {
            if (c.querySelector('h3')?.textContent === station.name) c.classList.add('playing');
        });
        
    } catch(e) {
        showToast('❌ Error playing');
    }
}

function togglePlay() {
    if (!currentStation) return;
    if (isPlaying) audio.pause();
    else audio.play();
    isPlaying = !isPlaying;
    updatePlayerUI();
}

function updatePlayerUI() {
    if (!currentStation) return;
    
    const img = currentStation.favicon ?
        `<img src="${currentStation.favicon}" onerror="this.parentElement.innerHTML='📻'">` : '📻';
    
    document.getElementById('miniImg').innerHTML = img;
    document.getElementById('miniName').textContent = currentStation.name;
    document.getElementById('miniStatus').textContent = isPlaying ? 'Playing...' : 'Paused';
    document.getElementById('miniPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    
    document.getElementById('playerArtwork').innerHTML = img;
    document.getElementById('playerName').textContent = currentStation.name;
    document.getElementById('playerInfo').textContent = 
        `${currentStation.tags?.split(',')[0] || 'Unknown'} · ${currentStation.country || ''}`;
    document.getElementById('mainPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    document.getElementById('favBtn').textContent = 
        favorites.has(currentStation.stationuuid) ? '❤️ Favorite' : '🤍 Favorite';
}

function openPlayer() { document.getElementById('playerModal').style.display = 'flex'; }
function closePlayer() { document.getElementById('playerModal').style.display = 'none'; }

function prevStation() {
    const idx = currentList.findIndex(s => s.stationuuid === currentStation?.stationuuid);
    if (idx > 0) playStation(currentList[idx - 1]);
}

function nextStation() {
    const idx = currentList.findIndex(s => s.stationuuid === currentStation?.stationuuid);
    if (idx < currentList.length - 1) playStation(currentList[idx + 1]);
}

function toggleFavorite() {
    if (!currentStation) return;
    
    if (favorites.has(currentStation.stationuuid)) {
        favorites.delete(currentStation.stationuuid);
        showToast('Removed');
    } else {
        favorites.add(currentStation.stationuuid);
        showToast('❤️ Added!');
    }
    
    localStorage.setItem('radioFavs', JSON.stringify([...favorites]));
    updateFavCount();
    updatePlayerUI();
}

function updateFavCount() {
    document.getElementById('favCount').textContent = favorites.size;
}

function showFavorites() {
    currentList = allStations.filter(s => favorites.has(s.stationuuid));
    currentPage = 1;
    document.getElementById('stationList').innerHTML = '';
    document.getElementById('sectionTitle').textContent = '❤️ Favorites';
    loadMoreStations();
}

function setVolume(v) { audio.volume = v / 100; }

function shareStation() {
    if (!currentStation) return;
    if (navigator.share) {
        navigator.share({ title: currentStation.name, text: `Listening to ${currentStation.name}!` }).catch(() => {});
    } else {
        showToast('📋 Copied!');
    }
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

function showLoading(show) {
    if (show) {
        document.getElementById('stationList').innerHTML = 
            '<div style="text-align:center;padding:40px;"><div class="spinner"></div><p style="color:#606070;">Loading stations...</p></div>';
    }
}

audio.addEventListener('playing', () => { isPlaying = true; updatePlayerUI(); });
audio.addEventListener('pause', () => { isPlaying = false; updatePlayerUI(); });
audio.addEventListener('error', () => { isPlaying = false; showToast('❌ Stream error'); });
