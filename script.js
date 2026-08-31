var API = 'https://de1.api.radio-browser.info/json';
var allStations = [];
var currentList = [];
var currentPage = 1;
var PAGE_SIZE = 50;
var isLoading = false;
var currentStation = null;
var audio = new Audio();
var isPlaying = false;
var favorites = new Set(JSON.parse(localStorage.getItem('favs') || '[]'));
var favStations = JSON.parse(localStorage.getItem('favStations') || '[]');
var currentGenre = 'all';
var searchQuery = '';

var genres = [
    {name:'All', tag:'all', emoji:'🌍'},
    {name:'Pop', tag:'pop', emoji:'🎵'},
    {name:'Rock', tag:'rock', emoji:'🎸'},
    {name:'Electronic', tag:'electronic', emoji:'⚡'},
    {name:'Jazz', tag:'jazz', emoji:'🎷'},
    {name:'Classical', tag:'classical', emoji:'🎻'},
    {name:'Hip Hop', tag:'hiphop', emoji:'🎤'},
    {name:'Country', tag:'country', emoji:'🌾'},
    {name:'News', tag:'news', emoji:'📰'},
    {name:'Sports', tag:'sport', emoji:'⚽'},
    {name:'House', tag:'house', emoji:'🏠'},
    {name:'Techno', tag:'techno', emoji:'🔊'},
    {name:'Reggae', tag:'reggae', emoji:'🌴'},
    {name:'Trance', tag:'trance', emoji:'🌀'},
    {name:'EDM', tag:'edm', emoji:'🎆'},
    {name:'Latin', tag:'latin', emoji:'💃'}
];

document.addEventListener('DOMContentLoaded', function() {
    init();
});

function init() {
    renderGenres();
    loadWorldStations();
    updateFavCount();
}

async function loadWorldStations() {
    showLoading();
    
    try {
        var unique = {};
        var results = [];
        
        // Top 1000 world stations
        var topRes = await fetch(API + '/stations/topvote/1000?hidebroken=true');
        var topData = await topRes.json();
        
        topData.forEach(function(s) {
            if (s.url_resolved && !unique[s.stationuuid]) {
                unique[s.stationuuid] = true;
                results.push(s);
            }
        });
        
        updateLoadingText(results.length);
        
        // Countries - 300 each
        var countries = ['BR','US','GB','DE','FR','ES','PT','IT','NL','CA','AU','AR','MX','CL','CO','PE','JP','KR','IN','ZA','EG','NG','KE','MA','AE','SA','TR','PL','SE','NO','DK','FI','IE','AT','CH','BE','GR','CZ','HU','RO'];
        
        var countryPromises = countries.map(function(code) {
            return fetch(API + '/stations/bycountrycodeexact/' + code + '?limit=300&hidebroken=true&order=clickcount&reverse=true')
                .then(function(r) { return r.json(); })
                .catch(function() { return []; });
        });
        
        var countryResults = await Promise.all(countryPromises);
        
        countryResults.forEach(function(stations) {
            stations.forEach(function(s) {
                if (s.url_resolved && !unique[s.stationuuid]) {
                    unique[s.stationuuid] = true;
                    results.push(s);
                }
            });
        });
        
        updateLoadingText(results.length);
        
        // Genres - 400 each
        var genrePromises = genres.slice(1).map(function(g) {
            return fetch(API + '/stations/search?tag=' + g.tag + '&limit=400&hidebroken=true&order=clickcount&reverse=true')
                .then(function(r) { return r.json(); })
                .catch(function() { return []; });
        });
        
        var genreResults = await Promise.all(genrePromises);
        
        genreResults.forEach(function(stations) {
            stations.forEach(function(s) {
                if (s.url_resolved && !unique[s.stationuuid]) {
                    unique[s.stationuuid] = true;
                    results.push(s);
                }
            });
        });
        
        allStations = results;
        currentList = allStations;
        
        document.getElementById('listTitle').textContent = '🌍 ' + allStations.length + ' World Stations';
        document.getElementById('stationList').innerHTML = '';
        loadMore();
        
    } catch(e) {
        document.getElementById('stationList').innerHTML = '<p style="text-align:center;padding:40px;color:#606070;">❌ Error loading. Check connection.</p>';
    }
}

function updateLoadingText(count) {
    document.getElementById('stationList').innerHTML = 
        '<div style="text-align:center;padding:60px 20px;"><div class="spinner"></div><p style="color:#606070;margin-top:15px;">Loading ' + count + ' stations...</p></div>';
}

function showLoading() {
    document.getElementById('stationList').innerHTML = 
        '<div style="text-align:center;padding:60px 20px;"><div class="spinner"></div><p style="color:#606070;margin-top:15px;">Loading world stations...</p></div>';
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
    document.getElementById('stationList').innerHTML = '';
    document.getElementById('endMessage').style.display = 'none';
    document.getElementById('listTitle').textContent = filtered.length + ' Stations';
    loadMore();
}

function loadMore() {
    if (isLoading) return;
    
    var start = (currentPage - 1) * PAGE_SIZE;
    var batch = currentList.slice(start, start + PAGE_SIZE);
    
    if (batch.length === 0) {
        document.getElementById('endMessage').style.display = 'block';
        return;
    }
    
    isLoading = true;
    document.getElementById('loadingMore').style.display = 'block';
    
    var fragment = document.createDocumentFragment();
    
    batch.forEach(function(station) {
        fragment.appendChild(createCard(station));
    });
    
    document.getElementById('stationList').appendChild(fragment);
    currentPage++;
    isLoading = false;
    document.getElementById('loadingMore').style.display = 'none';
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
            '<p>' + (station.country || '') + (station.state ? ' · ' + station.state : '') + (station.bitrate ? ' · ' + station.bitrate + 'kbps' : '') + '</p>' +
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
    
    localStorage.setItem('favs', JSON.stringify(Array.from(favorites)));
    localStorage.setItem('favStations', JSON.stringify(favStations));
    updateFavCount();
    
    document.querySelectorAll('.station-card').forEach(function(c) {
        if (c.dataset.uuid === uuid) {
            var btn = c.querySelector('.card-fav');
            if (btn) btn.textContent = favorites.has(uuid) ? '❤️' : '🤍';
        }
    });
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
    document.getElementById('stationList').innerHTML = '';
    document.getElementById('listTitle').textContent = '❤️ ' + favStations.length + ' Favorites';
    loadMore();
}

function playStation(station) {
    if (!station.url_resolved) return;
    
    if (currentStation) audio.pause();
    currentStation = station;
    
    audio.src = station.url_resolved;
    audio.play().then(function() {
        isPlaying = true;
        document.getElementById('miniPlayer').style.display = 'flex';
        updatePlayerUI();
        showToast('▶️ ' + station.name);
        
        document.querySelectorAll('.station-card').forEach(function(c) { c.classList.remove('playing'); });
        var card = document.querySelector('[data-uuid="' + station.stationuuid + '"]');
        if (card) card.classList.add('playing');
    }).catch(function() {
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
    
    if (navigator.share) {
        navigator.share({
            title: currentStation.name,
            text: '🎵 Listening to ' + currentStation.name + ' on RadioHub!',
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

window.addEventListener('scroll', function() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMore();
    }
});

audio.addEventListener('playing', function() { isPlaying = true; updatePlayerUI(); });
audio.addEventListener('pause', function() { isPlaying = false; updatePlayerUI(); });
