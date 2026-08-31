// ============ RADIOHUB APP ============
const API_BASE = 'https://de1.api.radio-browser.info/json';
let allStations = [];
let currentStation = null;
let currentList = [];
let audio = new Audio();
let isPlaying = false;
let favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[]'));

const genres = [
    { name: 'Pop', tag: 'pop', icon: '🎵' },
    { name: 'Rock', tag: 'rock', icon: '🎸' },
    { name: 'Electronic', tag: 'electronic', icon: '⚡' },
    { name: 'House', tag: 'house', icon: '🏠' },
    { name: 'Techno', tag: 'techno', icon: '🔊' },
    { name: 'Jazz', tag: 'jazz', icon: '🎷' },
    { name: 'Classical', tag: 'classical', icon: '🎻' },
    { name: 'Hip Hop', tag: 'hiphop', icon: '🎤' },
    { name: 'Country', tag: 'country', icon: '🌾' },
    { name: 'News', tag: 'news', icon: '📰' },
    { name: 'Sports', tag: 'sport', icon: '⚽' },
    { name: 'Reggae', tag: 'reggae', icon: '🌴' },
    { name: 'Blues', tag: 'blues', icon: '🎸' },
    { name: 'Metal', tag: 'metal', icon: '🤘' },
    { name: 'Trance', tag: 'trance', icon: '🌀' },
    { name: 'EDM', tag: 'edm', icon: '🎆' },
    { name: 'Lo-fi', tag: 'lofi', icon: '🎧' },
    { name: 'Chill', tag: 'chillout', icon: '😌' },
    { name: 'Dance', tag: 'dance', icon: '💃' },
    { name: '80s', tag: '80s', icon: '🕺' },
    { name: '90s', tag: '90s', icon: '📼' },
    { name: 'Top 40', tag: 'top 40', icon: '🏆' },
    { name: 'Alternative', tag: 'alternative', icon: '🎵' },
    { name: 'Indie', tag: 'indie', icon: '🎸' }
];

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadStations();
    displayGenres();
    displayFeatured();
    displayAllStations();
    updateFavBadge();
    hideLoading();
}

async function loadStations() {
    try {
        const promises = genres.slice(0, 10).map(genre =>
            fetch(`${API_BASE}/stations/search?tag=${genre.tag}&limit=30&order=clickcount&reverse=true`)
                .then(res => res.json())
                .catch(() => [])
        );
        
        const results = await Promise.all(promises);
        const unique = new Map();
        
        results.flat().forEach(station => {
            if (!unique.has(station.stationuuid)) {
                unique.set(station.stationuuid, station);
            }
        });
        
        allStations = Array.from(unique.values());
    } catch (error) {
        console.error('Error loading stations:', error);
    }
}

function displayGenres() {
    const container = document.getElementById('popularGenres');
    container.innerHTML = '';
    
    genres.slice(0, 12).forEach(genre => {
        const card = document.createElement('div');
        card.className = 'genre-card';
        card.innerHTML = `
            <div class="genre-icon">${genre.icon}</div>
            <h3>${genre.name}</h3>
        `;
        card.onclick = () => showGenreStations(genre.tag);
        container.appendChild(card);
    });
}

function displayFeatured() {
    const container = document.getElementById('featuredStations');
    container.innerHTML = '';
    
    allStations.slice(0, 20).forEach(station => {
        const card = document.createElement('div');
        card.className = 'featured-card';
        card.innerHTML = `
            <div class="featured-img">${station.favicon ? `<img src="${station.favicon}" onerror="this.innerHTML='📻'">` : '📻'}</div>
            <h3>${station.name}</h3>
        `;
        card.onclick = () => playStation(station, allStations.slice(0, 20));
        container.appendChild(card);
    });
}

function displayAllStations() {
    const container = document.getElementById('allStationsList');
    container.innerHTML = '';
    
    allStations.slice(0, 50).forEach(station => {
        container.appendChild(createStationItem(station));
    });
}

function createStationItem(station) {
    const item = document.createElement('div');
    item.className = 'station-item';
    
    if (currentStation?.stationuuid === station.stationuuid) {
        item.classList.add('playing');
    }
    
    item.innerHTML = `
        <div class="station-img">${station.favicon ? `<img src="${station.favicon}" onerror="this.innerHTML='📻'">` : '📻'}</div>
        <div class="station-info">
            <h3>${station.name}</h3>
            <p>${station.country || 'Unknown'}${station.state ? ' - ' + station.state : ''}</p>
        </div>
        <button class="mini-btn" onclick="event.stopPropagation(); toggleFav('${station.stationuuid}')">
            ${favorites.has(station.stationuuid) ? '❤️' : '🤍'}
        </button>
    `;
    
    item.onclick = () => playStation(station, allStations.slice(0, 50));
    return item;
}

function showGenreStations(tag) {
    const stations = allStations.filter(s => s.tags?.toLowerCase().includes(tag));
    const container = document.getElementById('allStationsList');
    container.innerHTML = '';
    
    if (stations.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No stations found</p></div>';
        return;
    }
    
    stations.slice(0, 30).forEach(station => {
        container.appendChild(createStationItem(station));
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Player functions
async function playStation(station, list) {
    currentStation = station;
    currentList = list || allStations;
    
    try {
        audio.src = station.url_resolved || station.url;
        audio.volume = document.getElementById('volumeControl')?.value / 100 || 0.8;
        await audio.play();
        isPlaying = true;
        
        document.getElementById('miniPlayer').style.display = 'block';
        updatePlayerUI();
        showToast(`Playing: ${station.name}`);
    } catch (error) {
        showToast('Error playing station');
    }
}

function togglePlay() {
    if (!currentStation) return;
    
    if (isPlaying) {
        audio.pause();
    } else {
        audio.play();
    }
    isPlaying = !isPlaying;
    updatePlayerUI();
}

function updatePlayerUI() {
    if (!currentStation) return;
    
    const img = currentStation.favicon ? 
        `<img src="${currentStation.favicon}" onerror="this.innerHTML='📻'">` : '📻';
    
    document.getElementById('miniImg').innerHTML = img;
    document.getElementById('miniName').textContent = currentStation.name;
    document.getElementById('miniStatus').textContent = isPlaying ? 'Playing...' : 'Paused';
    document.getElementById('miniPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    document.getElementById('miniFavBtn').textContent = favorites.has(currentStation.stationuuid) ? '❤️' : '🤍';
    
    document.getElementById('fullPlayerImg').innerHTML = img;
    document.getElementById('fullPlayerName').textContent = currentStation.name;
    document.getElementById('fullPlayerGenre').textContent = currentStation.tags?.split(',')[0] || 'Genre';
    document.getElementById('fullPlayerCountry').textContent = currentStation.country || 'Unknown';
    document.getElementById('fullPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    document.getElementById('fullFavBtn').textContent = favorites.has(currentStation.stationuuid) ? '❤️ Favorite' : '🤍 Favorite';
}

function openFullPlayer() {
    document.getElementById('fullPlayer').style.display = 'block';
}

function closeFullPlayer() {
    document.getElementById('fullPlayer').style.display = 'none';
}

function previousStation() {
    const index = currentList.findIndex(s => s.stationuuid === currentStation?.stationuuid);
    if (index > 0) playStation(currentList[index - 1], currentList);
}

function nextStation() {
    const index = currentList.findIndex(s => s.stationuuid === currentStation?.stationuuid);
    if (index < currentList.length - 1) playStation(currentList[index + 1], currentList);
}

// Favorites
function toggleFav(uuid) {
    if (favorites.has(uuid)) {
        favorites.delete(uuid);
    } else {
        favorites.add(uuid);
    }
    localStorage.setItem('favorites', JSON.stringify([...favorites]));
    updateFavBadge();
    displayAllStations();
}

function toggleCurrentFavorite() {
    if (currentStation) toggleFav(currentStation.stationuuid);
}

function updateFavBadge() {
    const badge = document.getElementById('favBadge');
    if (favorites.size > 0) {
        badge.style.display = 'block';
        badge.textContent = favorites.size;
    } else {
        badge.style.display = 'none';
    }
}

function showFavoritesTab() {
    switchTab('favorites', document.querySelector('[data-tab="favorites"]'));
    const container = document.getElementById('favoritesList');
    container.innerHTML = '';
    
    const favStations = allStations.filter(s => favorites.has(s.stationuuid));
    
    if (favStations.length === 0) {
        document.getElementById('emptyFavorites').style.display = 'block';
        return;
    }
    
    document.getElementById('emptyFavorites').style.display = 'none';
    favStations.forEach(station => {
        container.appendChild(createStationItem(station));
    });
}

// Search
function handleSearch(query) {
    if (!query) {
        displayAllStations();
        return;
    }
    
    const results = allStations.filter(s => 
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.tags?.toLowerCase().includes(query.toLowerCase())
    );
    
    const container = document.getElementById('allStationsList');
    container.innerHTML = '';
    
    results.slice(0, 30).forEach(station => {
        container.appendChild(createStationItem(station));
    });
}

// Tabs
function switchTab(tab, element) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    element.classList.add('active');
    
    document.getElementById('homeTab').style.display = tab === 'home' ? 'block' : 'none';
    document.getElementById('genresTab').style.display = tab === 'genres' ? 'block' : 'none';
    document.getElementById('favoritesTab').style.display = tab === 'favorites' ? 'block' : 'none';
    document.getElementById('settingsTab').style.display = tab === 'settings' ? 'block' : 'none';
    
    if (tab === 'favorites') showFavoritesTab();
}

// Settings
function showContactForm() {
    document.getElementById('contactModal').style.display = 'flex';
}

function closeContactForm() {
    document.getElementById('contactModal').style.display = 'none';
}

function sendContact(e) {
    e.preventDefault();
    showToast('Message sent successfully!');
    closeContactForm();
}

function showAbout() {
    showToast('RadioHub v1.0 - Stream thousands of stations');
}

function shareCurrentStation() {
    if (!currentStation) return;
    
    if (navigator.share) {
        navigator.share({
            title: currentStation.name,
            text: `Listening to ${currentStation.name} on RadioHub!`,
        }).catch(() => {});
    } else {
        showToast('Link copied!');
    }
}

function changeVolume(value) {
    audio.volume = value / 100;
}

function updateDefaultVolume(value) {
    audio.volume = value / 100;
    showToast(`Volume: ${value}%`);
}

// Utilities
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function hideLoading() {
    document.getElementById('globalLoading').style.display = 'none';
}

// Audio events
audio.addEventListener('playing', () => { isPlaying = true; updatePlayerUI(); });
audio.addEventListener('pause', () => { isPlaying = false; updatePlayerUI(); });
audio.addEventListener('error', () => { isPlaying = false; updatePlayerUI(); });
