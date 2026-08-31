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
var globalSimulation = JSON.parse(localStorage.getItem('m4fmGlobalSim') || '{}');
var simulationInterval = null;
var currentLanguage = 'en';

// ============ TRADUÇÕES ============
var translationsData = {
    'en': {
        'search': 'Search stations...', 'loading': 'Loading stations...',
        'all': 'All', 'mostPlayed': 'Most Played', 'favorites': 'Favorites',
        'stations': 'Stations', 'results': 'Results', 'noStations': 'No stations found',
        'noFavorites': 'No favorites yet', 'listening': 'listening now', 'plays': 'plays',
        'live': 'LIVE', 'paused': 'Paused', 'favorite': 'Favorite', 'favorited': 'Favorited',
        'share': 'Share', 'shared': 'Shared!', 'copied': 'Copied!', 'removed': 'Removed',
        'added': 'Added!', 'error': 'Error', 'stationUnavailable': 'Station unavailable',
        'stationNotResponding': 'Station not responding', 'noStationPlaying': 'No station playing',
        'alreadyFirst': 'Already at first station', 'alreadyLast': 'Already at last station',
        'searchResults': 'Search Results', 'topStations': 'Top 30 Stations',
        'globalTop': 'Global Top Live', 'cached': 'cached', 'history': 'No listening history yet'
    },
    'pt': {
        'search': 'Buscar rádios...', 'loading': 'Carregando estações...',
        'all': 'Todas', 'mostPlayed': 'Mais Ouvidas', 'favorites': 'Favoritas',
        'stations': 'Estações', 'results': 'Resultados', 'noStations': 'Nenhuma estação encontrada',
        'noFavorites': 'Nenhuma favorita ainda', 'listening': 'ouvindo agora', 'plays': 'reproduções',
        'live': 'AO VIVO', 'paused': 'Pausado', 'favorite': 'Favoritar', 'favorited': 'Favoritado',
        'share': 'Compartilhar', 'shared': 'Compartilhado!', 'copied': 'Copiado!', 'removed': 'Removido',
        'added': 'Adicionado!', 'error': 'Erro', 'stationUnavailable': 'Estação indisponível',
        'stationNotResponding': 'Estação não respondeu', 'noStationPlaying': 'Nenhuma estação tocando',
        'alreadyFirst': 'Já está na primeira estação', 'alreadyLast': 'Já está na última estação',
        'searchResults': 'Resultados da Busca', 'topStations': 'Top 30 Estações',
        'globalTop': 'Top Global Ao Vivo', 'cached': 'em cache', 'history': 'Nenhum histórico ainda'
    },
    'es': {
        'search': 'Buscar radios...', 'loading': 'Cargando estaciones...',
        'all': 'Todas', 'mostPlayed': 'Más Escuchadas', 'favorites': 'Favoritas',
        'stations': 'Estaciones', 'results': 'Resultados', 'noStations': 'No se encontraron estaciones',
        'noFavorites': 'Sin favoritas aún', 'listening': 'escuchando ahora', 'plays': 'reproducciones',
        'live': 'EN VIVO', 'paused': 'Pausado', 'favorite': 'Favorito', 'favorited': 'Favorito',
        'share': 'Compartir', 'shared': '¡Compartido!', 'copied': '¡Copiado!', 'removed': 'Eliminado',
        'added': '¡Añadido!', 'error': 'Error', 'stationUnavailable': 'Estación no disponible',
        'stationNotResponding': 'Estación no responde', 'noStationPlaying': 'Ninguna estación sonando',
        'alreadyFirst': 'Ya está en la primera', 'alreadyLast': 'Ya está en la última',
        'searchResults': 'Resultados de Búsqueda', 'topStations': 'Top 30 Estaciones',
        'globalTop': 'Top Global En Vivo', 'cached': 'en caché', 'history': 'Sin historial aún'
    },
    'fr': {
        'search': 'Rechercher des radios...', 'loading': 'Chargement...',
        'all': 'Toutes', 'mostPlayed': 'Plus Écoutées', 'favorites': 'Favorites',
        'stations': 'Stations', 'results': 'Résultats', 'noStations': 'Aucune station trouvée',
        'noFavorites': 'Pas de favoris', 'listening': 'à l\'écoute', 'plays': 'lectures',
        'live': 'EN DIRECT', 'paused': 'En pause', 'favorite': 'Favori', 'favorited': 'Favori',
        'share': 'Partager', 'shared': 'Partagé!', 'copied': 'Copié!', 'removed': 'Supprimé',
        'added': 'Ajouté!', 'error': 'Erreur', 'stationUnavailable': 'Station indisponible',
        'stationNotResponding': 'Station ne répond pas', 'noStationPlaying': 'Aucune station',
        'alreadyFirst': 'Déjà à la première', 'alreadyLast': 'Déjà à la dernière',
        'searchResults': 'Résultats', 'topStations': 'Top 30 Stations',
        'globalTop': 'Top Global Direct', 'cached': 'en cache', 'history': 'Pas d\'historique'
    }
};

// ============ MAPA DE PAÍSES ============
var countryNames = {
    'BR': 'Brazil', 'US': 'United States', 'GB': 'United Kingdom', 'DE': 'Germany',
    'FR': 'France', 'ES': 'Spain', 'PT': 'Portugal', 'IT': 'Italy', 'NL': 'Netherlands',
    'BE': 'Belgium', 'CA': 'Canada', 'AU': 'Australia', 'AR': 'Argentina', 'MX': 'Mexico',
    'CL': 'Chile', 'CO': 'Colombia', 'PE': 'Peru', 'VE': 'Venezuela', 'EC': 'Ecuador',
    'BO': 'Bolivia', 'PY': 'Paraguay', 'UY': 'Uruguay', 'JP': 'Japan', 'KR': 'South Korea',
    'CN': 'China', 'IN': 'India', 'PK': 'Pakistan', 'BD': 'Bangladesh', 'RU': 'Russia',
    'UA': 'Ukraine', 'PL': 'Poland', 'CZ': 'Czech Republic', 'SK': 'Slovakia', 'HU': 'Hungary',
    'RO': 'Romania', 'BG': 'Bulgaria', 'HR': 'Croatia', 'SI': 'Slovenia', 'RS': 'Serbia',
    'GR': 'Greece', 'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland',
    'IS': 'Iceland', 'IE': 'Ireland', 'CH': 'Switzerland', 'AT': 'Austria', 'NZ': 'New Zealand',
    'ZA': 'South Africa', 'EG': 'Egypt', 'NG': 'Nigeria', 'KE': 'Kenya', 'ET': 'Ethiopia',
    'GH': 'Ghana', 'TZ': 'Tanzania', 'UG': 'Uganda', 'MA': 'Morocco', 'DZ': 'Algeria',
    'TN': 'Tunisia', 'LY': 'Libya', 'AO': 'Angola', 'MZ': 'Mozambique', 'ZM': 'Zambia',
    'ZW': 'Zimbabwe', 'TH': 'Thailand', 'VN': 'Vietnam', 'PH': 'Philippines', 'MY': 'Malaysia',
    'SG': 'Singapore', 'ID': 'Indonesia', 'MM': 'Myanmar', 'KH': 'Cambodia', 'LA': 'Laos',
    'TW': 'Taiwan', 'HK': 'Hong Kong', 'MO': 'Macau', 'MN': 'Mongolia', 'KZ': 'Kazakhstan',
    'UZ': 'Uzbekistan', 'TM': 'Turkmenistan', 'KG': 'Kyrgyzstan', 'TJ': 'Tajikistan',
    'AF': 'Afghanistan', 'IR': 'Iran', 'IQ': 'Iraq', 'SY': 'Syria', 'LB': 'Lebanon',
    'IL': 'Israel', 'JO': 'Jordan', 'SA': 'Saudi Arabia', 'AE': 'UAE', 'QA': 'Qatar',
    'KW': 'Kuwait', 'BH': 'Bahrain', 'OM': 'Oman', 'YE': 'Yemen', 'CY': 'Cyprus',
    'MT': 'Malta', 'LU': 'Luxembourg', 'EE': 'Estonia', 'LV': 'Latvia', 'LT': 'Lithuania',
    'BY': 'Belarus', 'MD': 'Moldova', 'AL': 'Albania', 'MK': 'North Macedonia',
    'BA': 'Bosnia', 'ME': 'Montenegro', 'XK': 'Kosovo', 'GE': 'Georgia', 'AM': 'Armenia',
    'AZ': 'Azerbaijan', 'GT': 'Guatemala', 'BZ': 'Belize', 'HN': 'Honduras', 'SV': 'El Salvador',
    'NI': 'Nicaragua', 'CR': 'Costa Rica', 'PA': 'Panama', 'CU': 'Cuba', 'DO': 'Dominican Republic',
    'HT': 'Haiti', 'JM': 'Jamaica', 'TT': 'Trinidad', 'BS': 'Bahamas', 'BB': 'Barbados',
    'GY': 'Guyana', 'SR': 'Suriname', 'TL': 'Timor-Leste', 'BN': 'Brunei', 'LK': 'Sri Lanka',
    'NP': 'Nepal', 'BT': 'Bhutan', 'MV': 'Maldives', 'PS': 'Palestine', 'SD': 'Sudan',
    'CI': 'Ivory Coast', 'SN': 'Senegal', 'ML': 'Mali', 'BF': 'Burkina Faso', 'NE': 'Niger',
    'TD': 'Chad', 'CM': 'Cameroon', 'BJ': 'Benin', 'TG': 'Togo', 'GM': 'Gambia',
    'GW': 'Guinea-Bissau', 'SL': 'Sierra Leone', 'LR': 'Liberia', 'MW': 'Malawi',
    'CG': 'Congo', 'CD': 'DR Congo', 'GA': 'Gabon', 'GQ': 'Equatorial Guinea',
    'RW': 'Rwanda', 'BI': 'Burundi', 'SO': 'Somalia', 'DJ': 'Djibouti', 'ER': 'Eritrea',
    'SS': 'South Sudan', 'BW': 'Botswana', 'NA': 'Namibia', 'LS': 'Lesotho', 'SZ': 'Eswatini',
    'FJ': 'Fiji', 'PG': 'Papua New Guinea', 'NC': 'New Caledonia', 'PF': 'French Polynesia',
    'SB': 'Solomon Islands', 'VU': 'Vanuatu', 'FO': 'Faroe Islands', 'AD': 'Andorra',
    'PR': 'Puerto Rico', 'LC': 'Saint Lucia', 'VC': 'Saint Vincent', 'GD': 'Grenada',
    'AG': 'Antigua', 'DM': 'Dominica', 'KN': 'Saint Kitts'
};

// ============ 195 PAÍSES ============
var countryFactors = {
    'BR': 2800, 'US': 3500, 'GB': 3200, 'DE': 3000, 'FR': 2800,
    'ES': 2200, 'PT': 1400, 'IT': 2000, 'NL': 1600, 'BE': 1000,
    'CA': 1500, 'AU': 1600, 'AR': 1200, 'MX': 1600, 'CL': 900,
    'CO': 1100, 'PE': 800, 'VE': 700, 'EC': 600, 'BO': 500,
    'PY': 500, 'UY': 400, 'JP': 1800, 'KR': 1200, 'CN': 2500,
    'IN': 2200, 'PK': 800, 'BD': 600, 'RU': 2000, 'UA': 800,
    'PL': 1200, 'CZ': 700, 'SK': 500, 'HU': 600, 'RO': 800,
    'BG': 500, 'HR': 400, 'SI': 300, 'RS': 500, 'GR': 800,
    'SE': 900, 'NO': 700, 'DK': 700, 'FI': 600, 'IS': 100,
    'IE': 800, 'CH': 900, 'AT': 800, 'NZ': 500, 'ZA': 800,
    'EG': 900, 'NG': 1000, 'KE': 500, 'ET': 500, 'GH': 400,
    'TZ': 400, 'UG': 300, 'MA': 700, 'DZ': 600, 'TN': 500,
    'LY': 300, 'AO': 400, 'MZ': 400, 'ZM': 200, 'ZW': 200,
    'TH': 800, 'VN': 700, 'PH': 800, 'MY': 700, 'SG': 500,
    'ID': 1500, 'MM': 400, 'KH': 300, 'LA': 200, 'TW': 700,
    'HK': 400, 'MO': 100, 'MN': 200, 'KZ': 500, 'UZ': 400,
    'TM': 200, 'KG': 200, 'TJ': 200, 'AF': 300, 'IR': 600,
    'IQ': 500, 'SY': 200, 'LB': 300, 'IL': 600, 'JO': 300,
    'SA': 700, 'AE': 600, 'QA': 200, 'KW': 200, 'BH': 100,
    'OM': 200, 'YE': 200, 'CY': 200, 'MT': 100, 'LU': 200,
    'EE': 200, 'LV': 200, 'LT': 300, 'BY': 500, 'MD': 300,
    'AL': 200, 'MK': 200, 'BA': 300, 'ME': 100, 'XK': 100,
    'GE': 200, 'AM': 200, 'AZ': 300, 'GT': 500, 'BZ': 100,
    'HN': 400, 'SV': 400, 'NI': 400, 'CR': 500, 'PA': 400,
    'CU': 600, 'DO': 600, 'HT': 400, 'JM': 200, 'TT': 200,
    'BS': 100, 'BB': 100, 'GY': 100, 'SR': 100, 'TL': 100,
    'BN': 50, 'LK': 300, 'NP': 200, 'BT': 50, 'MV': 50,
    'PS': 100, 'SD': 300, 'CI': 300, 'SN': 300, 'ML': 200,
    'BF': 200, 'NE': 200, 'TD': 200, 'CM': 300, 'BJ': 100,
    'TG': 100, 'GM': 100, 'GW': 50, 'SL': 100, 'LR': 100,
    'MW': 150, 'CG': 100, 'CD': 200, 'GA': 100, 'GQ': 50,
    'RW': 200, 'BI': 100, 'SO': 100, 'DJ': 50, 'ER': 50,
    'SS': 100, 'BW': 100, 'NA': 100, 'LS': 50, 'SZ': 50,
    'FJ': 100, 'PG': 100, 'NC': 50, 'PF': 50, 'SB': 50,
    'VU': 50, 'FO': 50, 'AD': 50, 'PR': 300, 'LC': 50,
    'VC': 50, 'GD': 50, 'AG': 50, 'DM': 50, 'KN': 50
};

var genreFactors = {
    'pop': 1.5, 'rock': 1.3, 'electronic': 1.2, 'dance': 1.4,
    'jazz': 0.7, 'classical': 0.6, 'news': 1.1, 'sport': 1.0,
    'hiphop': 1.2, 'country': 0.8, 'reggae': 0.7, 'edm': 1.3,
    'house': 1.1, 'techno': 1.0, 'trance': 0.9, 'latin': 0.8,
    'folk': 0.7, 'metal': 0.9, 'indie': 0.8, 'blues': 0.6,
    'funk': 0.8, 'soul': 0.7, 'rnb': 1.0, 'rap': 1.1,
    'punk': 0.7, 'alternative': 0.8, 'christian': 0.6,
    'lounge': 0.5, 'ambient': 0.4, 'disco': 0.7
};

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

// ============ TRADUÇÃO ============
function detectLanguage() {
    var saved = localStorage.getItem('m4fmLang');
    if (saved && translationsData[saved]) return saved;
    var browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
    return translationsData[browserLang] ? browserLang : 'en';
}

function t(key) {
    return (translationsData[currentLanguage] && translationsData[currentLanguage][key]) || translationsData['en'][key] || key;
}

function applyTranslations() {
    var searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.placeholder = t('search');
    document.querySelectorAll('.chip').forEach(function(chip) {
        var text = chip.textContent.trim();
        if (text.indexOf('All') !== -1 || text.indexOf('Todas') !== -1 || text.indexOf('Toutes') !== -1) {
            chip.textContent = '🌍 ' + t('all');
        }
        if (text.indexOf('Most Played') !== -1 || text.indexOf('Mais Ouvidas') !== -1 || text.indexOf('Más') !== -1) {
            chip.textContent = '📊 ' + t('mostPlayed');
        }
    });
}

function setLanguage(lang) {
    if (!translationsData[lang]) return;
    currentLanguage = lang;
    localStorage.setItem('m4fmLang', lang);
    applyTranslations();
    showToast('🌍 ' + lang.toUpperCase());
}

// ============ TOAST ============
function showToast(msg) {
    var toast = document.getElementById('toast');
    var translated = msg;
    if (msg.indexOf('Added') !== -1) translated = '❤️ ' + t('added');
    if (msg.indexOf('Removed') !== -1) translated = '💔 ' + t('removed');
    if (msg.indexOf('Error playing') !== -1) translated = '❌ ' + t('error');
    if (msg.indexOf('Station unavailable') !== -1) translated = '❌ ' + t('stationUnavailable');
    if (msg.indexOf('Station not responding') !== -1) translated = '❌ ' + t('stationNotResponding');
    if (msg.indexOf('No station playing') !== -1) translated = '❌ ' + t('noStationPlaying');
    if (msg.indexOf('Already at first') !== -1) translated = '📻 ' + t('alreadyFirst');
    if (msg.indexOf('Already at last') !== -1) translated = '📻 ' + t('alreadyLast');
    if (msg.indexOf('Shared') !== -1) translated = '✅ ' + t('shared');
    if (msg.indexOf('Copied') !== -1) translated = '📋 ' + t('copied');
    toast.textContent = translated;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function() { toast.classList.remove('show'); }, 2000);
}

// ============ SIMULAÇÃO ============
function startGlobalSimulation() {
    simulationInterval = setInterval(updateSimulation, 4000);
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            clearInterval(simulationInterval);
        } else {
            simulationInterval = setInterval(updateSimulation, 4000);
        }
    });
}

function getSimulationData(station) {
    var key = station.stationuuid;
    if (!globalSimulation[key]) {
        var base = calculateBaseListeners(station);
        globalSimulation[key] = {
            name: station.name, country: station.country || '',
            baseListeners: base, peakListeners: Math.floor(base * (1.5 + Math.random())),
            currentListeners: Math.floor(base + Math.random() * base * 0.5),
            lastUpdate: Date.now()
        };
        saveSimulation();
    }
    return globalSimulation[key];
}

function saveSimulation() {
    try { localStorage.setItem('m4fmGlobalSim', JSON.stringify(globalSimulation)); } catch(e) {}
}

function calculateBaseListeners(station) {
    var base = countryFactors[station.countrycode] || Math.floor(Math.random() * 500) + 100;
    if (station.votes) base += Math.min(station.votes, 3000);
    if (station.bitrate > 128) base *= 1.2;
    if (station.bitrate < 64) base *= 0.7;
    if (station.tags) {
        var tags = station.tags.toLowerCase().split(',');
        for (var i = 0; i < tags.length; i++) {
            if (genreFactors[tags[i].trim()]) base *= genreFactors[tags[i].trim()];
        }
    }
    return Math.max(20, Math.floor(base));
}

function updateSimulation() {
    var hourFactor = getHourFactor(new Date().getHours());
    var keys = Object.keys(globalSimulation);
    for (var i = 0; i < keys.length; i++) {
        var station = globalSimulation[keys[i]];
        var target = station.baseListeners * hourFactor + (Math.random() * 200 - 100);
        target = Math.max(20, Math.min(station.peakListeners, target));
        station.currentListeners = Math.floor(station.currentListeners + (target - station.currentListeners) * 0.2);
    }
    saveSimulation();
    updateCardsWithSimulation();
    updatePlayerWithSimulation();
}

function getHourFactor(hour) {
    if (hour >= 20 && hour <= 23) return 1.5;
    if (hour >= 0 && hour <= 5) return 0.5;
    if (hour >= 6 && hour <= 9) return 1.2;
    if (hour >= 15 && hour <= 19) return 1.3;
    return 1.0;
}

function updateCardsWithSimulation() {
    var cards = document.querySelectorAll('.station-card');
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var simData = globalSimulation[card.dataset.uuid];
        if (!simData) continue;
        var countSpan = card.querySelector('.live-count');
        if (!countSpan) {
            countSpan = document.createElement('span');
            countSpan.className = 'live-count';
            countSpan.style.cssText = 'color:#00f5d4;font-size:10px;font-weight:600;display:block;margin-top:2px;';
            card.querySelector('.station-info').appendChild(countSpan);
        }
        countSpan.textContent = '🌍 ' + formatNumber(simData.currentListeners) + ' ' + t('listening');
    }
}

function updatePlayerWithSimulation() {
    if (!currentStation) return;
    var simData = globalSimulation[currentStation.stationuuid];
    if (!simData) return;
    var playerCount = document.getElementById('playerLiveCount');
    var miniCount = document.getElementById('miniLiveCount');
    if (playerCount) playerCount.textContent = '🌍 ' + formatNumber(simData.currentListeners) + ' ' + t('listening');
    if (miniCount) miniCount.textContent = '🌍 ' + formatNumber(simData.currentListeners) + ' ' + t('listening');
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

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

// ============ SPLASH ============
function hideSplashScreen() {
    var splash = document.getElementById('splash');
    if (splash) {
        setTimeout(function() {
            splash.style.opacity = '0';
            setTimeout(function() { splash.style.display = 'none'; }, 500);
        }, 1000);
    }
}

// ============ KEYBOARD ============
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
    try {
        var request = indexedDB.open('M4FMCLUB_DB', 1);
        request.onupgradeneeded = function(e) {
            if (!e.target.result.objectStoreNames.contains('stations')) {
                e.target.result.createObjectStore('stations', { keyPath: 'stationuuid' });
            }
        };
        request.onsuccess = function(e) { db = e.target.result; loadCachedStations(); };
        request.onerror = function() { loadFromAPI(); };
    } catch(e) { loadFromAPI(); }
}

function loadCachedStations() {
    try {
        var transaction = db.transaction(['stations'], 'readonly');
        var request = transaction.objectStore('stations').getAll();
        request.onsuccess = function() {
            var cached = request.result;
            if (cached && cached.length > 0) {
                allStations = cached;
                currentList = cached;
                renderGenres();
                document.getElementById('listTitle').textContent = '🌍 ' + allStations.length + ' ' + t('stations');
                document.getElementById('stationList').innerHTML = '';
                hasInitialLoaded = true;
                setupPagination();
                goToPage(1);
                updateFavCount();
                updatePlayCount();
                setTimeout(refreshFromAPI, 1000);
            } else {
                loadFromAPI();
            }
        };
        request.onerror = loadFromAPI;
    } catch(e) { loadFromAPI(); }
}

function loadFromAPI() {
    renderGenres();
    loadTop30First();
    updateFavCount();
    updatePlayCount();
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
            if (s.url_resolved && !unique[s.stationuuid]) {
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
    listElement.innerHTML = '<div style="text-align:center;padding:60px 20px;"><div class="spinner"></div><p style="color:#606070;margin-top:15px;">' + t('loading') + '</p></div>';
    try {
        var response = await fetch(API + '/stations/topvote/30?hidebroken=true');
        var top30 = await response.json();
        allStations = top30.filter(function(s) { return s && s.url_resolved; });
        currentList = allStations;
        document.getElementById('listTitle').textContent = '🏆 ' + t('topStations');
        document.getElementById('stationList').innerHTML = '';
        hasInitialLoaded = true;
        setupPagination();
        goToPage(1);
        setTimeout(loadAllStationsInBackground, 500);
    } catch(e) {
        listElement.innerHTML = '<p style="text-align:center;padding:40px;color:#606070;">❌ ' + t('error') + '</p>';
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
            if (s.url_resolved && !unique[s.stationuuid]) {
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
                if (s.url_resolved && !unique[s.stationuuid]) {
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
                if (s.url_resolved && !unique[s.stationuuid]) {
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
                if (s.url_resolved && !unique[s.stationuuid]) {
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
        if (titleElement) titleElement.textContent = '🌍 ' + allStations.length + ' ' + t('stations');
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
            if (g.tag === 'mostplayed') { showMostPlayed(); return; }
            if (g.tag === 'all') {
                searchQuery = '';
                var searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.value = '';
                currentList = allStations;
                currentPage = 1;
                totalPages = Math.ceil(allStations.length / PAGE_SIZE);
                document.getElementById('stationList').innerHTML = '';
                document.getElementById('listTitle').textContent = '🌍 ' + allStations.length + ' ' + t('stations');
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

// ============ FILTER (COM BUSCA POR PAÍS) ============
function filterStations() {
    var filtered = allStations;
    if (currentGenre !== 'all') {
        var genre = currentGenre;
        filtered = filtered.filter(function(s) { return s.tags && s.tags.toLowerCase().indexOf(genre) !== -1; });
    }
    if (searchQuery && searchQuery.length > 0) {
        var q = searchQuery.toLowerCase();
        var countrySearch = countryNames[q.toUpperCase()] ? countryNames[q.toUpperCase()].toLowerCase() : q;
        filtered = filtered.filter(function(s) {
            return (s.name && s.name.toLowerCase().indexOf(q) !== -1) ||
                   (s.country && s.country.toLowerCase().indexOf(q) !== -1) ||
                   (s.countrycode && s.countrycode.toLowerCase() === q) ||
                   (s.country && s.country.toLowerCase().indexOf(countrySearch) !== -1) ||
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
        listElement.innerHTML = '<p style="text-align:center;padding:40px;color:#606070;">🔍 ' + t('noStations') + '</p>';
        document.getElementById('listTitle').textContent = t('searchResults');
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    document.getElementById('listTitle').textContent = '🔍 ' + filtered.length + ' ' + t('results');
    setupPagination();
    goToPage(1);
}

// ============ MOST PLAYED ============
function showMostPlayed() {
    var playedStations = Object.values(playHistory);
    if (playedStations.length === 0) {
        document.getElementById('stationList').innerHTML = '<p style="text-align:center;padding:40px;color:#606070;">📊 ' + t('history') + '</p>';
        document.getElementById('listTitle').textContent = t('mostPlayed');
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    playedStations.sort(function(a, b) { return b.playCount - a.playCount; });
    currentList = playedStations;
    currentPage = 1;
    totalPages = Math.ceil(playedStations.length / PAGE_SIZE);
    document.getElementById('stationList').innerHTML = '';
    document.getElementById('listTitle').textContent = '📊 ' + playedStations.length + ' ' + t('mostPlayed');
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
    var simData = getSimulationData(station);
    var liveCount = simData ? simData.currentListeners : Math.floor(Math.random() * 1000) + 50;
    card.innerHTML = 
        '<div class="station-img">' + img + '</div>' +
        '<div class="station-info">' +
            '<h3>' + station.name + '</h3>' +
            '<p>' + (station.country || '') + (station.bitrate ? ' · ' + station.bitrate + 'kbps' : '') + '</p>' +
            '<span class="live-count" style="color:#00f5d4;font-size:10px;font-weight:600;display:block;margin-top:2px;">🌍 ' + formatNumber(liveCount) + ' ' + t('listening') + '</span>' +
            (playCount > 0 ? '<span class="play-count" style="color:#6c63ff;font-size:10px;">🔊 ' + playCount + ' ' + t('plays') + '</span>' : '') +
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
    if (!station) { showToast('❌ ' + t('error')); return; }
    if (favorites.has(uuid)) {
        favorites.delete(uuid);
        favStations = favStations.filter(function(s) { return s.stationuuid !== uuid; });
        showToast('💔 ' + t('removed'));
    } else {
        favorites.add(uuid);
        favStations.push(station);
        showToast('❤️ ' + t('added'));
    }
    localStorage.setItem('m4fmfavs', JSON.stringify(Array.from(favorites)));
    localStorage.setItem('m4fmfavStations', JSON.stringify(favStations));
    updateFavCount();
    document.querySelectorAll('.card-fav').forEach(function(btn) {
        if (btn.dataset.uuid === uuid) btn.textContent = favorites.has(uuid) ? '❤️' : '🤍';
    });
    var playerFavBtn = document.getElementById('favBtn');
    if (playerFavBtn && currentStation && currentStation.stationuuid === uuid) {
        playerFavBtn.textContent = favorites.has(uuid) ? '❤️ ' + t('favorited') : '🤍 ' + t('favorite');
    }
}

function updateFavCount() {
    var countElement = document.getElementById('favCount');
    if (countElement) countElement.textContent = favorites.size;
}

function showFavorites() {
    if (favStations.length === 0) {
        document.getElementById('stationList').innerHTML = '<p style="text-align:center;padding:40px;color:#606070;">💔 ' + t('noFavorites') + '</p>';
        document.getElementById('listTitle').textContent = t('favorites');
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    currentList = favStations;
    currentPage = 1;
    totalPages = Math.ceil(favStations.length / PAGE_SIZE);
    document.getElementById('stationList').innerHTML = '';
    document.getElementById('listTitle').textContent = '❤️ ' + favStations.length + ' ' + t('favorites');
    setupPagination();
    goToPage(1);
}

// ============ PLAYER ============
function playStation(station) {
    if (!station || !station.url_resolved) { showToast('❌ ' + t('stationUnavailable')); return; }
    if (currentStation) audio.pause();
    currentStation = station;
    audio.src = station.url_resolved;
    var timeout = setTimeout(function() {
        showToast('❌ ' + t('stationNotResponding'));
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
        updatePlayerWithSimulation();
        showToast('▶️ ' + station.name);
        document.querySelectorAll('.station-card').forEach(function(c) { c.classList.remove('playing'); });
        var card = document.querySelector('[data-uuid="' + station.stationuuid + '"]');
        if (card) card.classList.add('playing');
    }).catch(function() {
        clearTimeout(timeout);
        showToast('❌ ' + t('error'));
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
    document.getElementById('miniStatus').textContent = isPlaying ? '🔴 ' + t('live') : '⏸️ ' + t('paused');
    document.getElementById('miniPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    document.getElementById('playerArtwork').innerHTML = img;
    document.getElementById('playerName').textContent = currentStation.name;
    document.getElementById('playerInfo').textContent = (currentStation.country || '') + ' · ' + (currentStation.bitrate || '') + ' kbps';
    document.getElementById('mainPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    var favBtn = document.getElementById('favBtn');
    if (favBtn) favBtn.textContent = favorites.has(currentStation.stationuuid) ? '❤️ ' + t('favorited') : '🤍 ' + t('favorite');
}

function openPlayer() { document.getElementById('playerModal').style.display = 'flex'; }
function closePlayer() { document.getElementById('playerModal').style.display = 'none'; }

function prevStation() {
    var idx = currentList.findIndex(function(s) { return s.stationuuid === currentStation?.stationuuid; });
    if (idx > 0) playStation(currentList[idx - 1]);
    else showToast('📻 ' + t('alreadyFirst'));
}

function nextStation() {
    var idx = currentList.findIndex(function(s) { return s.stationuuid === currentStation?.stationuuid; });
    if (idx < currentList.length - 1) playStation(currentList[idx + 1]);
    else showToast('📻 ' + t('alreadyLast'));
}

function setVolume(v) { audio.volume = v / 100; }

function toggleFavorite() {
    if (currentStation) toggleFav(currentStation.stationuuid);
    else showToast('❌ ' + t('noStationPlaying'));
}

// ============ SHARE ============
function shareStation() {
    if (!currentStation) return;
    var shareText = '🎵 Listening to ' + currentStation.name + (currentStation.country ? ' from ' + currentStation.country : '') + ' now on the best M4FMCLUB app! 📻';
    if (navigator.share) {
        navigator.share({ title: 'M4FMCLUB', text: shareText }).then(function() {
            showToast('✅ ' + t('shared'));
        }).catch(function(err) {
            if (err.name !== 'AbortError') showToast('❌ ' + t('error'));
        });
    } else {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(function() { showToast('📋 ' + t('copied')); })
            .catch(function() { showToast('❌ ' + t('error')); });
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

// ============ INIT ============
document.addEventListener('DOMContentLoaded', function() {
    currentLanguage = detectLanguage();
    applyTranslations();
    initDB();
    setupSearchEvents();
    setupKeyboardShortcuts();
    setupMediaSession();
    setupAutoRefresh();
    hideSplashScreen();
    getUserIP();
    startGlobalSimulation();
});

// ============ AUDIO EVENTS ============
audio.addEventListener('playing', function() { isPlaying = true; updatePlayerUI(); });
audio.addEventListener('pause', function() { isPlaying = false; updatePlayerUI(); });
audio.addEventListener('error', function() { isPlaying = false; updatePlayerUI(); });
