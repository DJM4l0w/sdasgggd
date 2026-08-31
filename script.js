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
var hasLoadedInitial = false;

var genres = [
    {name:'All', tag:'all', emoji:'🌍'},
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
    init();
});

function init() {
    renderGenres();
    loadInitialStations();
    updateFavCount();
}

// ============ CARREGAR 30 PRIMEIRAS RÁDIOS ============
async function loadInitialStations() {
    var listElement = document.getElementById('stationList');
    listElement.innerHTML = '<div style="text-align:center;padding:60px 20px;"><div class="spinner"></div><p style="color:#606070;margin-top:15px;">Loading Dance & Electronic...</p></div>';
    
    try {
        // Buscar Dance (15)
        var danceRes = await fetch(API + '/stations/search?tag=dance&limit=15&hidebroken=true&order=clickcount&reverse=true');
        var danceData = await danceRes.json();
        
        // Buscar Electronic (15)
        var electronicRes = await fetch(API + '/stations/search?tag=electronic&limit=15&hidebroken=true&order=clickcount&reverse=true');
        var electronicData = await electronicRes.json();
        
        // Combinar (30 total)
        var unique = {};
        var initial30 = [];
        
        [...danceData, ...electronicData].forEach(function(s) {
            if (s.url_resolved && !unique[s.stationuuid]) {
                unique[s.stationuuid] = true;
                initial30.push(s);
            }
        });
        
        allStations = initial30.slice(0, 30);
        currentList = allStations;
        
        document.getElementById('listTitle').textContent = '⚡ ' + allStations.length + ' Dance & Electronic';
        document.getElementById('stationList').innerHTML = '';
        
        hasLoadedInitial = true;
        setupPagination();
        goToPage(1);
        
        // Carregar o resto em background
        setTimeout(function() {
            loadMoreInBackground();
        }, 500);
        
    } catch(e) {
        listElement.innerHTML = '<p style="text-align:center;padding:40px;color:#606070;">❌ Error loading. Check connection.</p>';
    }
}

// ============ CARREGAR MAIS EM BACKGROUND ============
async function loadMoreInBackground() {
    if (isApiLoading) return;
    isApiLoading = true;
    
    try {
        var unique = {};
        allStations.forEach(function(s) { unique[s.stationuuid] = true; });
        
        // Top 500
        var topRes = await fetch(API + '/stations/topvote/500?hidebroken=true');
        var topData = await topRes.json();
        
        topData.forEach(function(s) {
            if (s.url_resolved && !unique[s.stationuuid]) {
                unique[s.stationuuid] = true;
                allStations.push(s);
            }
        });
        
        updateTitleSilently();
        
        // Gêneros (10 principais)
        var genreTags = ['house','techno','trance','edm','pop','rock','jazz','classical','hiphop','country'];
        
        for (var i = 0; i < genreTags.length; i++) {
            try {
                var res = await fetch(API + '/stations/search?tag=' + genreTags[i] + '&limit=100&hidebroken=true&order=clickcount&reverse=true');
                var data = await res.json();
                data.forEach(function(s) {
                    if (s.url_resolved && !unique[s.stationuuid]) {
                        unique[s.stationuuid] = true;
                        allStations.push(s);
                    }
                });
                updateTitleSilently();
            } catch(e) {}
        }
        
        // Países
        var countries = ['BR','US','GB','DE','FR','ES','PT','IT','NL','CA','AU'];
        
        for (var j = 0; j < countries.length; j++) {
            try {
                var cRes = await fetch(API + '/stations/bycountrycodeexact/' + countries[j] + '?limit=100&hidebroken=true&order=clickcount&reverse=true');
                var cData = await cRes.json();
                cData.forEach(function(s) {
                    if (s.url_resolved && !unique[s.stationuuid]) {
                        unique[s.stationuuid] = true;
                        allStations.push(s);
                    }
                });
                updateTitleSilently();
            } catch(e) {}
        }
        
        // Atualizar paginação se estiver na página inicial
        if (currentGenre === 'all' && !searchQuery) {
            currentList = allStations;
            totalPages = Math.ceil(allStations.length / PAGE_SIZE);
            setupPagination();
        }
        
    } catch(e) {
        console.log('Background load error:', e);
    }
    
    isApiLoading = false;
}

function updateTitleSilently() {
    var titleElement = document.getElementById('listTitle');
    if (titleElement && hasLoadedInitial) {
        titleElement.textContent = '🌍 ' + allStations.length + ' Stations Available';
    }
}

// ============ PAGINAÇÃO COM DESIGN MELHOR ============
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
    
    // Previous button
    var prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn prev' + (currentPage === 1 ? ' disabled' : '');
    prevBtn.innerHTML = '‹';
    prevBtn.onclick = function() { if (currentPage > 1) goToPage(currentPage - 1); };
    container.appendChild(prevBtn);
    
    // Page numbers
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
    
    for (var i = startPage; i <= endPage; i++) {
        container.appendChild(createPageButton(i));
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            var dots2 = document.createElement('span');
            dots2.className = 'page-dots';
            dots2.textContent = '···';
            container.appendChild(dots2);
        }
        container.appendChild(createPageButton(totalPages));
    }
    
    // Next button
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
    var end = start + PAGE_SIZE;
    var pageStations = currentList.slice(start, end);
    
    document.getElementById('stationList').innerHTML = '';
    
    var fragment = document.createDocumentFragment();
    pageStations.forEach(function(station) {
        fragment.appendChild(createCard(station));
    });
    
    document.getElementById('stationList').appendChild(fragment);
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

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
            filterStations();
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
    
    if (searchQuery) {
        var q = searchQuery.toLowerCase();
        filtered = filtered.filter(function(s) {
            return (s.name && s.name.toLowerCase().indexOf(q) !== -1) ||
                   (s.country && s.country.toLowerCase().indexOf(q) !== -1) ||
                   (s.tags && s.tags.toLowerCase().indexOf(q) !== -1);
        });
    }
    
    currentList = filtered;
    currentPage = 1;
    totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    
    document.getElementById('stationList').innerHTML = '';
    document.getElementById('listTitle').textContent = filtered.length + ' Stations';
    
    setupPagination();
    goToPage(1);
}

function createCard(station) {
    var card = document.createElement('div');
    card.className = 'station-card';
    card.dataset.uuid = station.stationuuid;
    
    if (currentStation && currentStation.stationuuid === station.stationuuid) {
        card.classList.add('playing');
    }
    
    var img = station.favicon ? 
        '<img src="' + station.favicon + '" loading="lazy" onerror="this.parentElement.innerHTML=\'📻\'">' : '📻';
    
    var isFav = favorites.has(station.stationuuid);
    
    card.innerHTML = 
        '<div class="station-img">' + img + '</div>' +
        '<div class="station-info">' +
            '<h3>' + station.name + '</h3>' +
            '<p>' + (station.country || '') + (station.bitrate ? ' · ' + station.bitrate + 'kbps' : '') + '</p>' +
        '</div>' +
        '<button class="card-fav" onclick="event.stopPropagation();toggleFav(\'' + station.stationuuid + '\')">' + (isFav ? '❤️' : '🤍') + '</button>';
    
    card.onclick = function() { playStation(station); };
    return card;
}

function toggleFav(uuid) {
    var station = allStations.find(function(s) { return s.stationuuid === uuid; });
    if (!station) return;
    
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
}

function updateFavCount() {
    document.getElementById('favCount').textContent = favorites.size;
}

function showFavorites() {
    if (favStations.length === 0) {
        document.getElementById('stationList').innerHTML = '<p style="text-align:center;padding:40px;color:#606070;">💔 No favorites yet</p>';
        document.getElementById('listTitle').textContent = 'Favorites';
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

function playStation(station) {
    if (!station || !station.url_resolved) {
        showToast('❌ Station unavailable');
        return;
    }
    
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
        showToast('▶️ ' + station.name);
        
        document.querySelectorAll('.station-card').forEach(function(c) { c.classList.remove('playing'); });
        var card = document.querySelector('[data-uuid="' + station.stationuuid + '"]');
        if (card) card.classList.add('playing');
    }).catch(function() {
        clearTimeout(timeout);
        showToast('❌ Error playing');
    });
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
    
    var img = currentStation.favicon ? 
        '<img src="' + currentStation.favicon + '" onerror="this.parentElement.innerHTML=\'📻\'">' : '📻';
    
    document.getElementById('miniImg').innerHTML = img;
    document.getElementById('miniName').textContent = currentStation.name;
    document.getElementById('miniStatus').textContent = isPlaying ? '🔴 LIVE' : '⏸️ Paused';
    document.getElementById('miniPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    
    document.getElementById('playerArtwork').innerHTML = img;
    document.getElementById('playerName').textContent = currentStation.name;
    document.getElementById('playerInfo').textContent = 
        (currentStation.country || '') + ' · ' + (currentStation.bitrate || '') + ' kbps';
    document.getElementById('mainPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    document.getElementById('favBtn').textContent = 
        favorites.has(currentStation.stationuuid) ? '❤️ Favorited' : '🤍 Favorite';
}

function openPlayer() { document.getElementById('playerModal').style.display = 'flex'; }
function closePlayer() { document.getElementById('playerModal').style.display = 'none'; }

function prevStation() {
    var idx = currentList.findIndex(function(s) { return s.stationuuid === currentStation?.stationuuid; });
    if (idx > 0) playStation(currentList[idx - 1]);
}

function nextStation() {
    var idx = currentList.findIndex(function(s) { return s.stationuuid === currentStation?.stationuuid; });
    if (idx < currentList.length - 1) playStation(currentList[idx + 1]);
}

function setVolume(v) { audio.volume = v / 100; }

function shareStation() {
    if (!currentStation) return;
    
    var shareText = 'Listening to ' + currentStation.name + ' now on the best M4FMCLUB app! 📻🎵';
    
    if (navigator.share) {
        navigator.share({
            title: 'M4FMCLUB - ' + currentStation.name,
            text: shareText,
            url: currentStation.homepage || window.location.href
        }).catch(function() {});
    } else {
        showToast('📋 Copied!');
    }
}

function doSearch(query) {
    searchQuery = query;
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(function() {
        filterStations();
    }, 300);
}

function showToast(msg) {
    var toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function() { toast.classList.remove('show'); }, 2000);
}

audio.addEventListener('playing', function() { isPlaying = true; updatePlayerUI(); });
audio.addEventListener('pause', function() { isPlaying = false; updatePlayerUI(); });
