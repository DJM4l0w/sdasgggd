// ============ RADIOHUB APP ============

const API_BASE = 'https://de1.api.radio-browser.info/json';
let allStations = [];
let currentStation = null;
let currentStationList = [];
let audio = new Audio();
let isPlaying = false;
let favorites = new Set(JSON.parse(localStorage.getItem('radioFavorites') || '[]'));

// ============ GENRES ============
const genres = [
    { name: 'Pop', tag: 'pop', icon: '🎵' },
    { name: 'Rock', tag: 'rock', icon: '🎸' },
    { name: 'Eletrônica', tag: 'electronic', icon: '⚡' },
    { name: 'House', tag: 'house', icon: '🏠' },
    { name: 'Techno', tag: 'techno', icon: '🔊' },
    { name: 'Jazz', tag: 'jazz', icon: '🎷' },
    { name: 'Clássica', tag: 'classical', icon: '🎻' },
    { name: 'Hip Hop', tag: 'hiphop', icon: '🎤' },
    { name: 'Country', tag: 'country', icon: '🌾' },
    { name: 'Notícias', tag: 'news', icon: '📰' },
    { name: 'Esportes', tag: 'sport', icon: '⚽' },
    { name: 'Religiosa', tag: 'religious', icon: '🙏' },
    { name: 'Reggae', tag: 'reggae', icon: '🌴' },
    { name: 'Blues', tag: 'blues', icon: '🎸' },
    { name: 'Metal', tag: 'metal', icon: '🤘' },
    { name: 'Folk', tag: 'folk', icon: '🎻' },
    { name: 'Samba', tag: 'samba', icon: '🥁' },
    { name: 'Bossa Nova', tag: 'bossa nova', icon: '🎶' },
    { name: 'Sertanejo', tag: 'sertanejo', icon: '🎵' },
    { name: 'Funk', tag: 'funk', icon: '🕺' },
    { name: 'Trance', tag: 'trance', icon: '🌀' },
    { name: 'EDM', tag: 'edm', icon: '🎆' },
    { name: 'Lo-fi', tag: 'lofi', icon: '🎧' },
    { name: 'Chillout', tag: 'chillout', icon: '😌' },
    { name: 'Dance', tag: 'dance', icon: '💃' },
    { name: 'Indie', tag: 'indie', icon: '🎸' },
    { name: 'Anos 80', tag: '80s', icon: '🕺' },
    { name: 'Anos 90', tag: '90s', icon: '📼' },
    { name: 'Top 40', tag: 'top 40', icon: '🏆' },
    { name: 'Alternativa', tag: 'alternative', icon: '🎵' }
];

// ============ INIT ============
document.addEventListener('DOMContentLoaded', init);

async function init() {
    showLoading();
    await loadStations();
    displayGenres();
    displayFeatured();
    displayAllStations();
    updateFavoritesUI();
    hideLoading();
}

// ============ LOAD STATIONS ============
async function loadStations() {
    try {
        const promises = genres.map(genre => 
            fetch(`${API_BASE}/stations/search?tag=${genre.tag}&limit=20&order=clickcount&reverse=true`)
                .then(res => res.json())
                .catch(() => [])
        );
        
        const results = await Promise.all(promises);
        allStations = results.flat();
        
        // Remove duplicates
        const unique = new Map();
        allStations.forEach(station => {
            if (!unique.has(station.stationuuid)) {
                unique.set(station.stationuuid, station);
            }
        });
        allStations = Array.from(unique.values());
        
    } catch (error) {
        console.error('Error loading stations:', error);
    }
}

// ============ DISPLAY FUNCTIONS ============
function displayGenres() {
    const container = document.getElementById('categoriesGrid');
    container.innerHTML = '';
    
    genres.forEach(genre => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <div class="category-icon">${genre.icon}</div>
            <h3>${genre.name}</h3>
        `;
        card.onclick = () => showGenreStations(genre.tag);
        container.appendChild(card);
    });
}

function displayFeatured() {
    const container = document.getElementById('featuredStations');
    container.innerHTML = '';
    
    const featured = allStations.slice(0, 15);
    
    featured.forEach(station => {
        const card = document.createElement('div');
        card.className = 'featured-card';
        card.innerHTML = `
            <div class="featured-img">${station.favicon ? `<img src="${station.favicon}" onerror="this.parentElement.innerHTML='📻'">` : '📻'}</div>
            <h3>${station.name}</h3>
            <p>${station.country || 'Desconhecido'}</p>
        `;
        card.onclick = () => playStation(station, featured);
        container.appendChild(card);
    });
}

function displayAllStations() {
    const container = document.getElementById('allStations');
    container.innerHTML = '';
    
    const stations = allStations.slice(0, 50);
    
    stations.forEach(station => {
        container.appendChild(createStationItem(station));
    });
}

function createStationItem(station) {
    const item = document.createElement('div');
    item.className = 'station-item';
    
    if (currentStation && currentStation.stationuuid === station.stationuuid) {
        item.classList.add('playing');
    }
    
    item.innerHTML = `
        <div class="station-img">${station.favicon ? `<img src="${station.favicon}" onerror="this.parentElement.innerHTML='📻'">` : '📻'}</div>
        <div class="station-info">
            <h3>${station.name}</h3>
            <p>${station.country || 'Desconhecido'}${station.state ? ' - ' + station.state : ''}</p>
            <div class="station-meta">
                <span>🎧 ${station.bitrate || 'Live'} kbps</span>
                ${station.votes ? `<span>❤️ ${station.votes}</span>` : ''}
            </div>
        </div>
        <div class="station-actions">
            <button class="station-action-btn" onclick="event.stopPropagation(); toggleStationFavorite('${station.stationuuid}')">
                ${favorites.has(station.stationuuid) ? '❤️' : '🤍'}
            </button>
        </div>
    `;
    
    item.onclick = () => playStation(station, allStations.slice(0, 50));
    return item;
}

function showGenreStations(tag) {
    const stations = allStations.filter(s => s.tags && s.tags.toLowerCase().includes(tag));
    
    const container = document.getElementById('allStations');
    container.innerHTML = '';
    
    document.querySelector('.section-title').textContent = `📻 ${tag.charAt(0).toUpperCase() + tag.slice(1)}`;
    
    if (stations.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhuma rádio encontrada</p></div>';
        return;
    }
    
    stations.slice(0, 30).forEach(station => {
        container.appendChild(createStationItem(station));
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ PLAYER FUNCTIONS ============
async function playStation(station, stationList) {
    currentStation = station;
    currentStationList = stationList || allStations;
    
    try {
        audio.src = station.url_resolved || station.url;
        audio.volume = document.getElementById('volumeSlider').value / 100;
        
        await audio.play();
        isPlaying = true;
        
        document.getElementById('miniPlayer').style.display = 'block';
        updatePlayerUI();
        showToast(`🎵 Tocando: ${station.name}`);
        
    } catch (error) {
        showToast('❌ Erro ao tocar rádio');
    }
}

function togglePlay() {
    if (!currentStation) return;
    
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
    } else {
        audio.play();
        isPlaying = true;
    }
    
    updatePlayerUI();
}

function updatePlayerUI() {
    if (!currentStation) return;
    
    const imgHtml = currentStation.favicon ? 
        `<img src="${currentStation.favicon}" onerror="this.parentElement.innerHTML='📻'">` : '📻';
    
    document.getElementById('miniStationImg').innerHTML = imgHtml;
    document.getElementById('miniStationName').textContent = currentStation.name;
    document.getElementById('miniStationStatus').textContent = isPlaying ? 'Tocando...' : 'Pausado';
    document.getElementById('miniPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    document.getElementById('miniFavBtn').textContent = favorites.has(currentStation.stationuuid) ? '❤️' : '🤍';
    
    document.getElementById('fullStationImg').innerHTML = imgHtml;
    document.getElementById('fullStationName').textContent = currentStation.name;
    document.getElementById('fullStationGenre').textContent = currentStation.tags ? currentStation.tags.split(',')[0] : 'Gênero';
    document.getElementById('fullStationCountry').textContent = currentStation.country || 'País';
    document.getElementById('fullPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    document.getElementById('fullFavBtn').textContent = favorites.has(currentStation.stationuuid) ? '❤️ Favorito' : '🤍 Favoritar';
}

function openFullPlayer() {
    document.getElementById('fullPlayer').style.display = 'block';
}

function closeFullPlayer() {
    document.getElementById('fullPlayer').style.display = 'none';
}

function changeVolume(value) {
    audio.volume = value / 100;
}

function previousStation() {
    if (!currentStationList.length) return;
    const index = currentStationList.findIndex(s => s.stationuuid === currentStation?.stationuuid);
    if (index > 0) playStation(currentStationList[index - 1], currentStationList);
}

function nextStation() {
    if (!currentStationList.length) return;
    const index = currentStationList.findIndex(s => s.stationuuid === currentStation?.stationuuid);
    if (index < currentStationList.length - 1) playStation(currentStationList[index + 1], currentStationList);
}

// ============ FAVORITES ============
function toggleFavorite() {
    if (!currentStation) return;
    toggleStationFavorite(currentStation.stationuuid);
}

function toggleStationFavorite(stationuuid) {
    if (favorites.has(stationuuid)) {
        favorites.delete(stationuuid);
        showToast('Removido dos favoritos');
    } else {
        favorites.add(stationuuid);
        showToast('❤️ Adicionado aos favoritos!');
    }
    
    localStorage.setItem('radioFavorites', JSON.stringify([...favorites]));
    updateFavoritesUI();
    updatePlayerUI();
}

function updateFavoritesUI() {
    const count = favorites.size;
    const badge = document.getElementById('favCount');
    
    if (count > 0) {
        badge.style.display = 'block';
        badge.textContent = count;
    } else {
        badge.style.display = 'none';
    }
}

function showFavorites() {
    switchTab('favorites', document.querySelectorAll('.nav-tab')[2]);
    
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

// ============ SEARCH ============
function searchStations(query) {
    if (!query) {
        displayAllStations();
        return;
    }
    
    const results = allStations.filter(station => 
        station.name.toLowerCase().includes(query.toLowerCase()) ||
        (station.tags && station.tags.toLowerCase().includes(query.toLowerCase())) ||
        (station.country && station.country.toLowerCase().includes(query.toLowerCase()))
    );
    
    const container = document.getElementById('allStations');
    container.innerHTML = '';
    
    if (results.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhuma rádio encontrada</p></div>';
        return;
    }
    
    results.slice(0, 30).forEach(station => {
        container.appendChild(createStationItem(station));
    });
}

// ============ TABS ============
function switchTab(tab, element) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
    
    document.getElementById('homeSection').style.display = tab === 'home' ? 'block' : 'none';
    document.getElementById('genresSection').style.display = tab === 'genres' ? 'block' : 'none';
    document.getElementById('favoritesSection').style.display = tab === 'favorites' ? 'block' : 'none';
    document.getElementById('contactSection').style.display = tab === 'contact' ? 'block' : 'none';
    
    if (tab === 'favorites') showFavorites();
    if (tab === 'genres') displayGenres();
}

// ============ CONTACT ============
function showContact() {
    switchTab('contact', document.querySelectorAll('.nav-tab')[3]);
}

function sendContact(event) {
    event.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;
    
    // Simulate sending
    showToast('✅ Mensagem enviada com sucesso!');
    
    // Clear form
    document.getElementById('contactName').value = '';
    document.getElementById('contactEmail').value = '';
    document.getElementById('contactMessage').value = '';
}

// ============ SHARE ============
function shareStation() {
    if (!currentStation) return;
    
    const shareData = {
        title: currentStation.name,
        text: `Ouvindo ${currentStation.name} no RadioHub!`,
        url: currentStation.homepage || window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        showToast('📋 Link copiado!');
    }
}

// ============ UI HELPERS ============
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
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
    showToast('❌ Erro ao carregar rádio');
});
