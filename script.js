var API = 'https://de1.api.radio-browser.info/json';
var allStations = [];
var currentList = [];
var currentPage = 1;
var PAGE_SIZE = 30;
var totalPages = 0;
var isLoading = false;
var currentStation = null;
var audio = new Audio();
var isPlaying = false;
var favorites = new Set(JSON.parse(localStorage.getItem('m4fmfavs') || '[]'));
var favStations = JSON.parse(localStorage.getItem('m4fmfavStations') || '[]');
var currentGenre = 'all';
var searchQuery = '';
var isApiLoading = false;
var hasInitialLoaded = false;
var db = null;
var sleepTimer = null;
var playHistory = JSON.parse(localStorage.getItem('m4fmPlayHistory') || '{}');
var myIP = localStorage.getItem('m4fmUserIP') || '';

var genres = [
    {name:'All', tag:'all', emoji:'🌍'},
    {name:'Most Played', tag:'mostplayed', emoji:'📊'},
    {name:'Dance', tag:'dance', emoji:'💃'},
    {name:'Electronic', tag:'electronic', emoji:'⚡'},
    {name:'House', tag:'house', emoji:'🏠'},
    {name:'Techno', tag:'techno', emoji:'🔊'},
    {name:'Trance', tag:'trance', emoji:'🌀'},
    {name:'EDM', tag:'edm', emoji:'🎆'},
    {name:'Pop', tag:'pop', emoji:'🎵'},
    {name:'Rock', tag:'rock', emoji:'🎸'},
    {name:'Jazz', tag:'jazz', emoji:'🎷'},
    {name:'Classical', tag:'classical', emoji:'🎻'},
    {name:'Hip Hop', tag:'hiphop', emoji:'🎤'},
    {name:'Country', tag:'country', emoji:'🌾'},
    {name:'News', tag:'news', emoji:'📰'},
    {name:'Sports', tag:'sport', emoji:'⚽'},
    {name:'Reggae', tag:'reggae', emoji:'🌴'}
];

document.addEventListener('DOMContentLoaded', function() {
    initDB();
    setupSearchEvents();
    setupKeyboardShortcuts();
    setupMediaSession();
    setupAutoRefresh();
    hideSplashScreen();
    getUserIP();
});

// ============ GET USER IP ============
async function getUserIP() {
    if (myIP) return;
    try {
        var response = await fetch('https://api.ipify.org?format=json');
        var data = await response.json();
        myIP = data.ip;
        localStorage.setItem('m4fmUserIP', myIP);
    } catch(e) {
        myIP = 'local-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('m4fmUserIP', myIP);
    }
}

// ============ SPLASH SCREEN ============
function hideSplashScreen() {
    var splash = document.getElementById('splash');
    if (splash) {
        setTimeout(function() {
            splash.style.opacity = '0';
            setTimeout(function() {
                splash.style.display = 'none';
            }, 500);
        }, 1000);
    }
}

// ============ KEYBOARD SHORTCUTS ============
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
        if (e.code === 'ArrowRight') nextStation();
        if (e.code === 'ArrowLeft') prevStation();
        if (e.code === 'KeyF') toggleFavorite();
    });
}

// ============ MEDIA SESSION ============
function setupMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', function() {
            if (currentStation) { audio.play(); isPlaying = true; updatePlayerUI(); }
        });
        navigator.mediaSession.setActionHandler('pause', function() {
            audio.pause(); isPlaying = false; updatePlayerUI();
        });
        navigator.mediaSession.setActionHandler('previoustrack', function() { prevStation(); });
        navigator.mediaSession.setActionHandler('nexttrack', function() { nextStation(); });
    }
}

function updateMediaSession() {
    if (!('mediaSession' in navigator) || !currentStation) return;
    navigator.mediaSession.metadata = new MediaMetadata({
        title: currentStation.name,
        artist: 'M4FMCLUB',
        album: currentStation.country || 'Live Radio',
        artwork: currentStation.favicon ? [{ src: currentStation.favicon, sizes: '96x96', type: 'image/png' }] : []
    });
}

// ============ AUTO REFRESH ============
function setupAutoRefresh() {
    setInterval(function() {
        if (!isApiLoading && navigator.onLine && hasInitialLoaded) refreshFromAPI();
    }, 30 * 60 * 1000);
}

// ============ SLEEP TIMER ============
function setSleepTimer(minutes) {
    clearTimeout(sleepTimer);
    showToast('⏰ Sleep timer: ' + minutes + ' min');
    sleepTimer = setTimeout(function() {
        audio.pause();
        isPlaying = false;
        updatePlayerUI();
        showToast('😴 Sleep timer ended');
    }, minutes * 60 * 1000);
}

function cancelSleepTimer() {
    clearTimeout(sleepTimer);
    showToast('⏰ Sleep timer cancelled');
}

// ============ SEARCH EVENTS ============
function setupSearchEvents() {
    var searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); searchInput.blur(); }
        if (e.key === 'Escape') { clearSearch(); searchInput.blur(); }
    });
    
    document.addEventListener('click', function(e) {
        if (e.target !== searchInput && !e.target.closest('.search-box')) searchInput.blur();
    });
}

// ============ INDEXEDDB ============
function initDB() {
    var request = indexedDB.open('M4FMCLUB_DB', 1);
    request.onupgradeneeded = function(e) {
        if (!e.target.result.objectStoreNames.contains('stations')) {
            e.target.result.createObjectStore('stations', { keyPath: 'stationuuid' });
        }
    };
    request.onsuccess = function(e) { db = e.target.result; loadCachedStations(); };
    request.onerror = function() { loadFromAPI(); };
}

function loadCachedStations() {
    var transaction = db.transaction(['stations'], 'readonly');
    var request = transaction.objectStore('stations').getAll();
    
    request.onsuccess = function() {
        var cached = request.result;
        if (cached && cached.length > 0) {
            allStations = cached;
            currentList = cached;
            renderGenres();
            document.getElementById('listTitle').textContent = '🌍 ' + allStations.length + ' Stations (cached)';
            document.getElementById('stationList').innerHTML = '';
            hasInitialLoaded = true;
            setupPagination();
            goToPage(1);
            updateFavCount();
            updatePlayCount();
            bindPlayerFavButton();
            setTimeout(refreshFromAPI, 1000);
        } else {
            loadFromAPI();
        }
    };
    request.onerror = loadFromAPI;
}

function loadFromAPI() {
    renderGenres();
    loadTop30First();
    updateFavCount();
    updatePlayCount();
    bindPlayerFavButton();
}

function saveToCache(stations) {
    if (!db) return;
    try {
        var transaction = db.transaction(['stations'], 'readwrite');
        var store = transaction.objectStore('stations');
        var batchSize = 500;
        for (var i = 0; i < stations.length; i += batchSize) {
            stations.slice(i, i + batchSize).forEach(function(s) { store.put(s); });
        }
    } catch(e) {}
}

// ============ API LOADING ============
async function refreshFromAPI() {
    if (isApiLoading) return;
    isApiLoading = true;
    var unique = {};
    allStations.forEach(function(s) { unique[s.stationuuid] = true; });
    try {
        var topRes = await fetch(API + '/stations/topvote/1000?hidebroken=true');
        var topData = await topRes.json();
        topData.forEach(function(s) {
            if (s.url_resolved && s.lastcheckok === 1 && !unique[s.stationuuid]) {
                unique[s.stationuuid] = true;
                allStations.push(s);
            }
        });
        updatePaginationAfterBackgroundLoad();
    } catch(e) {}
    isApiLoading = false;
    setTimeout(loadMoreStationsWithOffset, 1000);
}

async function loadTop30First() {
    var listElement = document.getElementById('stationList');
    listElement.innerHTML = '<div style="text-align:center;padding:60px 20px;"><div class="spinner"></div><p style="color:#606070;margin-top:15px;">Loading top 30 stations...</p></div>';
    try {
        var response = await fetch(API + '/stations/topvote/30?hidebroken=true');
        var top30 = await response.json();
        allStations = top30.filter(function(s) { return s.url_resolved && s.lastcheckok === 1; });
        currentList = allStations;
        document.getElementById('listTitle').textContent = '🏆 Top 30 Stations';
        document.getElementById('stationList').innerHTML = '';
        hasInitialLoaded = true;
        setupPagination();
        goToPage(1);
        setTimeout(loadAllStationsInBackground, 500);
    } catch(e) {
        listElement.innerHTML = '<p style="text-align:center;padding:40px;color:#606070;">❌ Error loading.</p>';
    }
}

async function loadAllStationsInBackground() {
    if (isApiLoading) return;
    isApiLoading = true;
    var unique = {};
    allStations.forEach(function(s) { unique[s.stationuuid] = true; });
    try {
        var topRes = await fetch(API + '/stations/topvote/1000?hidebroken=true');
        var topData = await topRes.json();
        topData.forEach(function(s) {
            if (s.url_resolved && s.lastcheckok === 1 && !unique[s.stationuuid]) {
                unique[s.stationuuid] = true;
                allStations.push(s);
            }
        });
        updatePaginationAfterBackgroundLoad();
    } catch(e) {}
    
    var allGenres = ['dance','electronic','house','techno','trance','edm','pop','rock','jazz','classical','hiphop','country','news','sport','reggae','blues','latin','folk','metal','indie'];
    for (var i = 0; i < allGenres.length; i++) {
        try {
            var gRes = await fetch(API + '/stations/search?tag=' + allGenres[i] + '&limit=200&hidebroken=true&order=clickcount&reverse=true');
            var gData = await gRes.json();
            gData.forEach(function(s) {
                if (s.url_resolved && s.lastcheckok === 1 && !unique[s.stationuuid]) {
                    unique[s.stationuuid] = true;
                    allStations.push(s);
                }
            });
            updatePaginationAfterBackgroundLoad();
        } catch(e) {}
    }
    
    var countries = ['BR','US','GB','DE','FR','ES','PT','IT','NL','CA','AU','AR','MX','CL','CO','PE','JP','KR','IN','ZA'];
    for (var j = 0; j < countries.length; j++) {
        try {
            var cRes = await fetch(API + '/stations/bycountrycodeexact/' + countries[j] + '?limit=200&hidebroken=true&order=clickcount&reverse=true');
            var cData = await cRes.json();
            cData.forEach(function(s) {
                if (s.url_resolved && s.lastcheckok === 1 && !unique[s.stationuuid]) {
                    unique[s.stationuuid] = true;
                    allStations.push(s);
                }
            });
            updatePaginationAfterBackgroundLoad();
        } catch(e) {}
    }
    
    saveToCache(allStations);
    isApiLoading = false;
    setTimeout(loadMoreStationsWithOffset, 2000);
}

async function loadMoreStationsWithOffset() {
    if (isApiLoading) return;
    isApiLoading = true;
    var unique = {};
    allStations.forEach(function(s) { unique[s.stationuuid] = true; });
    var offset = 0;
    var maxAttempts = 50;
    var attempts = 0;
    
    while (allStations.length < 12000 && attempts < maxAttempts) {
        try {
            var response = await fetch(API + '/stations/search?limit=1000&offset=' + offset + '&hidebroken=true&order=clickcount&reverse=true');
            if (!response.ok) { await new Promise(function(r) { setTimeout(r, 3000); }); attempts++; continue; }
            var data = await response.json();
            if (data.length === 0) break;
            var added = 0;
            data.forEach(function(s) {
                if (s.url_resolved && s.lastcheckok === 1 && !unique[s.stationuuid]) {
                    unique[s.stationuuid] = true;
                    allStations.push(s);
                    added++;
                }
            });
            if (added === 0) break;
            offset += 1000;
            attempts = 0;
            updatePaginationAfterBackgroundLoad();
            await new Promise(function(r) { setTimeout(r, 1000); });
        } catch(e) {
            attempts++;
            await new Promise(function(r) { setTimeout(r, 3000); });
        }
    }
    
    saveToCache(allStations);
    isApiLoading = false;
}

// ============ PAGINATION ============
function updatePaginationAfterBackgroundLoad() {
    if (currentGenre === 'all' && !searchQuery && hasInitialLoaded) {
        currentList = allStations;
        totalPages = Math.ceil(allStations.length / PAGE_SIZE);
        var titleElement = document.getElementById('listTitle');
        if (titleElement) titleElement.textContent = '🌍 ' + allStations.length + ' Stations';
        setupPagination();
    }
}

function setupPagination() {
    totalPages = Math.ceil(currentList.length / PAGE_SIZE);
    var paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.className = 'pagination';
        document.querySelector('.main-content').appendChild(paginationContainer);
    }
    renderPagination();
}

function renderPagination() {
    var container = document.getElementById('pagination');
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) return;
    
    var prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn prev' + (currentPage === 1 ? ' disabled' : '');
    prevBtn.innerHTML = '‹';
    prevBtn.onclick = function() { if (currentPage > 1) goToPage(currentPage - 1); };
    container.appendChild(prevBtn);
    
    var startPage = Math.max(1, currentPage - 2);
    var endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        container.appendChild(createPageButton(1));
        if (startPage > 2) {
            var dots = document.createElement('span');
            dots.className = 'page-dots';
            dots.textContent = '···';
            container.appendChild(dots);
        }
    }
    
    for (var i = startPage; i <= endPage; i++) container.appendChild(createPageButton(i));
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            var dots2 = document.createElement('span');
            dots2.className = 'page-dots';
            dots2.textContent = '···';
            container.appendChild(dots2);
        }
        container.appendChild(createPageButton(totalPages));
    }
    
    var nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn next' + (currentPage === totalPages ? ' disabled' : '');
    nextBtn.innerHTML = '›';
    nextBtn.onclick = function() { if (currentPage < totalPages) goToPage(currentPage + 1); };
    container.appendChild(nextBtn);
}

function createPageButton(pageNum) {
    var btn = document.createElement('button');
    btn.className = 'page-btn' + (pageNum === currentPage ? ' active' : '');
    btn.textContent = pageNum;
    btn.onclick = function() { goToPage(pageNum); };
    return btn;
}

function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    var start = (currentPage - 1) * PAGE_SIZE;
    var pageStations = currentList.slice(start, start + PAGE_SIZE);
    document.getElementById('stationList').innerHTML = '';
    var fragment = document.createDocumentFragment();
    pageStations.forEach(function(station) { fragment.appendChild(createCard(station)); });
    document.getElementById('stationList').appendChild(fragment);
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ GENRES ============
function renderGenres() {
    var scroll = document.getElementById('genresScroll');
    scroll.innerHTML = '';
    
    genres.forEach(function(g) {
        var chip = document.createElement('button');
        chip.className = 'chip' + (g.tag === currentGenre ? ' active' : '');
        chip.textContent = g.emoji + ' ' + g.name;
        chip.onclick = function() {
            currentGenre = g.tag;
            document.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
            chip.classList.add('active');
            
            if (g.tag === 'mostplayed') {
                showMostPlayed();
                return;
            }
            
            if (g.tag === 'all') {
                searchQuery = '';
                var searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.value = '';
                currentList = allStations;
                currentPage = 1;
                totalPages = Math.ceil(allStations.length / PAGE_SIZE);
                document.getElementById('stationList').innerHTML = '';
                document.getElementById('listTitle').textContent = '🌍 ' + allStations.length + ' Stations';
                setupPagination();
                goToPage(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                filterStations();
            }
        };
        scroll.appendChild(chip);
    });
}

function filterStations() {
    var filtered = allStations;
    if (currentGenre !== 'all') {
        filtered = allStations.filter(function(s) {
            return s.tags && s.tags.toLowerCase().indexOf(currentGenre) !== -1;
        });
    }
    if (searchQuery && searchQuery.length > 0) {
        var q = searchQuery.toLowerCase();
        filtered = filtered.filter(function(s) {
            return (s.name && s.name.toLowerCase().indexOf(q) !== -1) ||
                   (s.country && s.country.toLowerCase().indexOf(q) !== -1) ||
                   (s.tags && s.tags.toLowerCase().indexOf(q) !== -1) ||
                   (s.state && s.state.toLowerCase().indexOf(q) !== -1);
        });
    }
    
    currentList = filtered;
    currentPage = 1;
    totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    var listElement = document.getElementById('stationList');
    listElement.innerHTML = '';
    
    if (filtered.length === 0) {
        listElement.innerHTML = '<p style="text-align:center;padding:40px;color:#606070;">🔍 No stations found</p>';
        document.getElementById('listTitle').textContent = 'Search Results';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    document.getElementById('listTitle').textContent = '🔍 ' + filtered.length + ' Results';
    setupPagination();
    goToPage(1);
}

// ============ MOST PLAYED ============
function showMostPlayed() {
    var playedStations = Object.values(playHistory);
    
    if (playedStations.length === 0) {
        document.getElementById('stationList').innerHTML = '<p style="text-align:center;padding:40px;color:#606070;">📊 No listening history yet</p>';
        document.getElementById('listTitle').textContent = 'Most Played';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    playedStations.sort(function(a, b) { return b.playCount - a.playCount; });
    
    currentList = playedStations;
    currentPage = 1;
    totalPages = Math.ceil(playedStations.length / PAGE_SIZE);
    
    document.getElementById('stationList').innerHTML = '';
    document.getElementById('listTitle').textContent = '📊 ' + playedStations.length + ' Most Played';
    
    setupPagination();
    goToPage(1);
}

function updatePlayCount() {
    var count = Object.keys(playHistory).length;
    var countElement = document.getElementById('playCount');
    if (countElement) countElement.textContent = count;
}

// ============ CREATE CARD ============
function createCard(station) {
    var card = document.createElement('div');
    card.className = 'station-card';
    card.dataset.uuid = station.stationuuid;
    
    if (currentStation && currentStation.stationuuid === station.stationuuid) card.classList.add('playing');
    
    var img = station.favicon ? '<img src="' + station.favicon + '" loading="lazy" onerror="this.parentElement.innerHTML=\'📻\'">' : '📻';
    var isFav = favorites.has(station.stationuuid);
    var playCount = playHistory[station.stationuuid] ? playHistory[station.stationuuid].playCount : 0;
    
    card.innerHTML = 
        '<div class="station-img">' + img + '</div>' +
        '<div class="station-info">' +
            '<h3>' + station.name + '</h3>' +
            '<p>' + (station.country || '') + (station.bitrate ? ' · ' + station.bitrate + 'kbps' : '') + '</p>' +
            (playCount > 0 ? '<span class="play-count">🔊 ' + playCount + ' plays</span>' : '') +
        '</div>' +
        '<button class="card-fav" data-uuid="' + station.stationuuid + '">' + (isFav ? '❤️' : '🤍') + '</button>';
    
    var favBtn = card.querySelector('.card-fav');
    favBtn.addEventListener('click', function(e) { e.stopPropagation(); toggleFav(station.stationuuid); });
    card.addEventListener('click', function() { playStation(station); });
    
    return card;
}

// ============ FAVORITES ============
function toggleFav(uuid) {
    var station = allStations.find(function(s) { return s.stationuuid === uuid; });
    if (!station) station = favStations.find(function(s) { return s.stationuuid === uuid; });
    if (!station) { showToast('❌ Station not found'); return; }
    
    if (favorites.has(uuid)) {
        favorites.delete(uuid);
        favStations = favStations.filter(function(s) { return s.stationuuid !== uuid; });
        showToast('💔 Removed');
    } else {
        favorites.add(uuid);
        favStations.push(station);
        showToast('❤️ Added!');
    }
    
    localStorage.setItem('m4fmfavs', JSON.stringify(Array.from(favorites)));
    localStorage.setItem('m4fmfavStations', JSON.stringify(favStations));
    updateFavCount();
    
    document.querySelectorAll('.card-fav').forEach(function(btn) {
        if (btn.dataset.uuid === uuid) btn.textContent = favorites.has(uuid) ? '❤️' : '🤍';
    });
    
    var playerFavBtn = document.getElementById('favBtn');
    if (playerFavBtn && currentStation && currentStation.stationuuid === uuid) {
        playerFavBtn.textContent = favorites.has(uuid) ? '❤️ Favorited' : '🤍 Favorite';
    }
}

function updateFavCount() {
    var countElement = document.getElementById('favCount');
    if (countElement) countElement.textContent = favorites.size;
}

function showFavorites() {
    if (favStations.length === 0) {
        document.getElementById('stationList').innerHTML = '<p style="text-align:center;padding:40px;color:#606070;">💔 No favorites yet</p>';
        document.getElementById('listTitle').textContent = 'Favorites';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    currentList = favStations;
    currentPage = 1;
    totalPages = Math.ceil(favStations.length / PAGE_SIZE);
    document.getElementById('stationList').innerHTML = '';
    document.getElementById('listTitle').textContent = '❤️ ' + favStations.length + ' Favorites';
    setupPagination();
    goToPage(1);
}

// ============ PLAYER ============
function bindPlayerFavButton() {
    var favBtn = document.getElementById('favBtn');
    if (favBtn) {
        favBtn.addEventListener('click', function() {
            if (currentStation) toggleFav(currentStation.stationuuid);
            else showToast('❌ No station playing');
        });
    }
}

function playStation(station) {
    if (!station || !station.url_resolved) { showToast('❌ Station unavailable'); return; }
    if (currentStation) audio.pause();
    currentStation = station;
    audio.src = station.url_resolved;
    
    var timeout = setTimeout(function() {
        showToast('❌ Station not responding');
        audio.pause();
        isPlaying = false;
        updatePlayerUI();
    }, 10000);
    
    audio.play().then(function() {
        clearTimeout(timeout);
        isPlaying = true;
        document.getElementById('miniPlayer').style.display = 'flex';
        updatePlayerUI();
        updateMediaSession();
        trackPlay(station);
        showToast('▶️ ' + station.name);
        document.querySelectorAll('.station-card').forEach(function(c) { c.classList.remove('playing'); });
        var card = document.querySelector('[data-uuid="' + station.stationuuid + '"]');
        if (card) card.classList.add('playing');
    }).catch(function() {
        clearTimeout(timeout);
        showToast('❌ Error playing');
    });
}

function trackPlay(station) {
    if (!playHistory[station.stationuuid]) {
        playHistory[station.stationuuid] = {
            name: station.name,
            country: station.country,
            favicon: station.favicon,
            url_resolved: station.url_resolved,
            bitrate: station.bitrate,
            tags: station.tags,
            playCount: 0,
            lastPlayed: Date.now()
        };
    }
    playHistory[station.stationuuid].playCount++;
    playHistory[station.stationuuid].lastPlayed = Date.now();
    localStorage.setItem('m4fmPlayHistory', JSON.stringify(playHistory));
    updatePlayCount();
}

function togglePlay() {
    if (!currentStation) return;
    if (isPlaying) { audio.pause(); isPlaying = false; }
    else { audio.play(); isPlaying = true; }
    updatePlayerUI();
    updateMediaSession();
}

function updatePlayerUI() {
    if (!currentStation) return;
    var img = currentStation.favicon ? '<img src="' + currentStation.favicon + '" onerror="this.parentElement.innerHTML=\'📻\'">' : '📻';
    document.getElementById('miniImg').innerHTML = img;
    document.getElementById('miniName').textContent = currentStation.name;
    document.getElementById('miniStatus').textContent = isPlaying ? '🔴 LIVE' : '⏸️ Paused';
    document.getElementById('miniPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    document.getElementById('playerArtwork').innerHTML = img;
    document.getElementById('playerName').textContent = currentStation.name;
    document.getElementById('playerInfo').textContent = (currentStation.country || '') + ' · ' + (currentStation.bitrate || '') + ' kbps';
    document.getElementById('mainPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    var favBtn = document.getElementById('favBtn');
    if (favBtn) favBtn.textContent = favorites.has(currentStation.stationuuid) ? '❤️ Favorited' : '🤍 Favorite';
}

function openPlayer() { document.getElementById('playerModal').style.display = 'flex'; }
function closePlayer() { document.getElementById('playerModal').style.display = 'none'; }

function prevStation() {
    var idx = currentList.findIndex(function(s) { return s.stationuuid === currentStation?.stationuuid; });
    if (idx > 0) playStation(currentList[idx - 1]);
    else showToast('📻 Already at first station');
}

function nextStation() {
    var idx = currentList.findIndex(function(s) { return s.stationuuid === currentStation?.stationuuid; });
    if (idx < currentList.length - 1) playStation(currentList[idx + 1]);
    else showToast('📻 Already at last station');
}

function setVolume(v) { audio.volume = v / 100; }

function toggleFavorite() {
    if (currentStation) toggleFav(currentStation.stationuuid);
    else showToast('❌ No station playing');
}

// ============ SHARE ============
function shareStation() {
    if (!currentStation) return;
    var shareText = '🎵 Listening to ' + currentStation.name + (currentStation.country ? ' from ' + currentStation.country : '') + ' now on the best M4FMCLUB app! 📻';
    if (navigator.share) {
        navigator.share({ title: 'M4FMCLUB', text: shareText }).then(function() {
            showToast('✅ Shared!');
        }).catch(function(err) {
            if (err.name !== 'AbortError') showToast('❌ Share failed');
        });
    } else {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(function() { showToast('📋 Copied!'); })
            .catch(function() { showToast('❌ Could not copy'); });
        } else {
            showToast('📋 ' + currentStation.name);
        }
    }
}

// ============ SEARCH ============
function doSearch(query) {
    searchQuery = query.trim();
    if (!searchQuery) { clearSearch(); return; }
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(filterStations, 300);
}

function clearSearch() {
    searchQuery = '';
    var searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    currentGenre = 'all';
    document.querySelectorAll('.chip').forEach(function(c) {
        c.classList.remove('active');
        if (c.textContent.indexOf('All') !== -1) c.classList.add('active');
    });
    filterStations();
}

// ============ TOAST ============
function showToast(msg) {
    var toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function() { toast.classList.remove('show'); }, 2000);
}

// ============ AUDIO EVENTS ============
audio.addEventListener('playing', function() { isPlaying = true; updatePlayerUI(); });
audio.addEventListener('pause', function() { isPlaying = false; updatePlayerUI(); });
audio.addEventListener('error', function() { isPlaying = false; updatePlayerUI(); });
