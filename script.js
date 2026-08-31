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
}

// ============ SISTEMA DE FAVORITOS COMPLETO ============
function toggleFavorite(station) {
    const targetStation = station || currentStation;
    if (!targetStation) return;
    
    const uuid = targetStation.stationuuid;
    
    if (favorites.has(uuid)) {
        // Remover dos favoritos
        favorites.delete(uuid);
        favoriteStations = favoriteStations.filter(s => s.stationuuid !== uuid);
        showToast('💔 Removed from favorites');
    } else {
        // Adicionar aos favoritos
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
    
    // Salvar no localStorage
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

// ============ SHARE CORRIGIDO ============
async function shareStation(station) {
    const targetStation = station || currentStation;
    if (!targetStation) return;
    
    const shareData = {
        title: targetStation.name,
        text: `🎵 Listening to ${targetStation.name}${targetStation.country ? ' from ' + targetStation.country : ''} on RadioHub!`,
        url: targetStation.homepage || window.location.href
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
            showToast('✅ Shared successfully!');
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(
                `${targetStation.name} - ${targetStation.url_resolved || targetStation.homepage || ''}`
            );
            showToast('📋 Station link copied!');
        } else {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = targetStation.url_resolved || targetStation.homepage || targetStation.name;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('📋 Link copied!');
        }
    } catch(e) {
        console.error('Share error:', e);
        showToast('❌ Could not share');
    }
}

// ============ PLAYER MODERNO ============
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
    
    // Adicionar aos recentes
    addToRecentlyPlayed(station);
    
    try {
        audio.src = station.url_resolved;
        audio.load();
        await audio.play();
        isPlaying = true;
        
        document.getElementById('miniPlayer').style.display = 'block';
        updatePlayerUI();
        updatePlayingCard();
        animatePlayerArtwork();
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

function animatePlayerArtwork() {
    const artwork = document.getElementById('playerArtwork');
    if (artwork) {
        artwork.style.animation = 'none';
        artwork.offsetHeight; // Trigger reflow
        artwork.style.animation = 'pulse 2s ease-in-out infinite';
    }
}

function updatePlayerUI() {
    if (!currentStation) return;
    
    const img = currentStation.favicon ?
        `<img src="${currentStation.favicon}" onerror="this.parentElement.innerHTML='📻'">` : '📻';
    
    // Mini Player
    document.getElementById('miniImg').innerHTML = img;
    document.getElementById('miniName').textContent = currentStation.name;
    document.getElementById('miniStatus').textContent = isPlaying ? '🔴 LIVE' : '⏸️ Paused';
    document.getElementById('miniPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    
    // Full Player
    document.getElementById('playerArtwork').innerHTML = img;
    document.getElementById('playerName').textContent = currentStation.name;
    document.getElementById('playerInfo').textContent = 
        `${currentStation.tags ? currentStation.tags.split(',')[0] : 'Unknown'} · ${currentStation.country || 'Unknown'}`;
    document.getElementById('mainPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    document.getElementById('favBtn').textContent = 
        favorites.has(currentStation.stationuuid) ? '❤️ Favorited' : '🤍 Add to Favorites';
    document.getElementById('favBtn').classList.toggle('favorited', favorites.has(currentStation.stationuuid));
}

function updatePlayingCard() {
    document.querySelectorAll('.station-card').forEach(c => c.classList.remove('playing'));
    
    if (currentStation) {
        const currentCard = document.querySelector(`[data-uuid="${currentStation.stationuuid}"]`);
        if (currentCard) {
            currentCard.classList.add('playing');
            currentCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
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

// ============ CREATE CARD COM FAVORITO ============
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
    if (station) {
        toggleFavorite(station);
    }
}

// ============ NAVEGAÇÃO ============
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

// ============ VOLUME ============
function setVolume(v) {
    audio.volume = v / 100;
    showToast(`🔊 Volume: ${v}%`);
}

// ============ TOAST MELHORADO ============
function showToast(msg, icon = '') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = icon ? `${icon} ${msg}` : msg;
    toast.classList.add('show');
    
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 2500);
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
    document.getElementById('miniStatus').textContent = '🔄 Buffering...';
});

audio.addEventListener('canplay', () => {
    if (isPlaying) {
        document.getElementById('miniStatus').textContent = '🔴 LIVE';
    }
});
