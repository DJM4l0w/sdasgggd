var API = 'https://de1.api.radio-browser.info/json';
var allStations = [];
var currentList = [];
var currentPage = 1;
var PAGE_SIZE = 50;
var isLoading = false;
var currentStation = null;
var audio = new Audio();
var isPlaying = false;
var favorites = new Set(JSON.parse(localStorage.getItem('m4fmfavs') || '[]'));
var favStations = JSON.parse(localStorage.getItem('m4fmfavStations') || '[]');
var currentGenre = 'all';
var searchQuery = '';
var isApiLoading = false;
var workingStations = []; // Nova lista de rádios funcionais

// ============ FUNÇÃO PARA VERIFICAR RÁDIOS FUNCIONAIS ============
function filterWorkingStations(stations) {
    return stations.filter(function(s) {
        return s.url_resolved && 
               s.url_resolved !== '' && 
               (s.url_resolved.indexOf('http') === 0) &&
               s.lastcheckok !== 0 &&
               s.lastcheckok !== false;
    });
}

// ============ TOP 50 COM FOTOS (APENAS FUNCIONAIS) ============
var top50Stations = filterWorkingStations([
    {name: "BBC Radio 1", country: "UK", bitrate: 128, favicon: "https://radio.bradford.edu/wp-content/uploads/2020/01/bbc-radio-1.png", tags: "pop,top40", url_resolved: "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one", stationuuid: "top01", lastcheckok: 1},
    {name: "BBC Radio 2", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/BBC_Radio_2_logo.svg/1200px-BBC_Radio_2_logo.svg.png", tags: "pop,adult", url_resolved: "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_two", stationuuid: "top02", lastcheckok: 1},
    {name: "Capital FM", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1e/Capital_FM_logo.svg/1200px-Capital_FM_logo.svg.png", tags: "pop,top40", url_resolved: "http://media-ice.musicradio.com/CapitalMP3", stationuuid: "top03", lastcheckok: 1},
    {name: "Heart Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/en/thumb/2/2d/Heart_Radio_logo.svg/1200px-Heart_Radio_logo.svg.png", tags: "pop,adult", url_resolved: "http://media-ice.musicradio.com/HeartLondonMP3", stationuuid: "top04", lastcheckok: 1},
    {name: "France Inter", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/France_Inter_logo.svg/1200px-France_Inter_logo.svg.png", tags: "news,talk", url_resolved: "http://direct.franceinter.fr/live/franceinter-midfi.mp3", stationuuid: "top05", lastcheckok: 1},
    {name: "Cadena SER", country: "Spain", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Cadena_SER_logo.svg/1200px-Cadena_SER_logo.svg.png", tags: "news,talk", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/CADENASER.mp3", stationuuid: "top06", lastcheckok: 1},
    {name: "Jovem Pan", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Jovem_Pan_logo.svg/1200px-Jovem_Pan_logo.svg.png", tags: "pop,news", url_resolved: "http://shout25.crossradio.com.br:18042/1", stationuuid: "top07", lastcheckok: 1},
    {name: "Radio Comercial", country: "Portugal", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Radio_Comercial_logo.svg/1200px-Radio_Comercial_logo.svg.png", tags: "pop,portuguese", url_resolved: "http://mcrscast1.mcr.iol.pt/comercial.mp3", stationuuid: "top08", lastcheckok: 1},
    {name: "WNYC", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/WNYC_logo.svg/1200px-WNYC_logo.svg.png", tags: "news,talk", url_resolved: "http://fm939.wnyc.org/wnycfm", stationuuid: "top09", lastcheckok: 1},
    {name: "KEXP", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/KEXP_logo.svg/1200px-KEXP_logo.svg.png", tags: "rock,indie", url_resolved: "http://kexp-mp3-128.streamguys1.com/kexp128.mp3", stationuuid: "top10", lastcheckok: 1},
    {name: "Radio 538", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Radio_538_logo.svg/1200px-Radio_538_logo.svg.png", tags: "pop,top40", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/RADIO538.mp3", stationuuid: "top11", lastcheckok: 1},
    {name: "RTL 102.5", country: "Italy", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/RTL_102.5_logo.svg/1200px-RTL_102.5_logo.svg.png", tags: "pop,top40", url_resolved: "http://streamingv2.shoutcast.com/rtl-1025", stationuuid: "top12", lastcheckok: 1},
    {name: "NRJ", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/NRJ_Logo.svg/1200px-NRJ_Logo.svg.png", tags: "pop,top40", url_resolved: "http://cdn.nrjaudio.fm/adwz1/fr/30001/mp3_128.mp3", stationuuid: "top13", lastcheckok: 1},
    {name: "Deutsche Welle", country: "Germany", bitrate: 64, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Deutsche_Welle_logo.svg/1200px-Deutsche_Welle_logo.svg.png", tags: "news,international", url_resolved: "http://dw.audiostream.io/dw/1002/mp3/64/dw-radio-english", stationuuid: "top14", lastcheckok: 1},
    {name: "ABC Radio Sydney", country: "Australia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/ABC_Radio_logo.svg/1200px-ABC_Radio_logo.svg.png", tags: "news,talk", url_resolved: "http://live-radio01.mediahubaustralia.com/2LRW/mp3/", stationuuid: "top15", lastcheckok: 1},
    {name: "CBC Radio One", country: "Canada", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/CBC_Radio_One_logo.svg/1200px-CBC_Radio_One_logo.svg.png", tags: "news,talk", url_resolved: "http://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r1_tor", stationuuid: "top16", lastcheckok: 1},
    {name: "Radio Mitre", country: "Argentina", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Radio_Mitre_logo.svg/1200px-Radio_Mitre_logo.svg.png", tags: "news,talk", url_resolved: "http://buecrplb01.cienradios.com.ar/Mitre790.aac", stationuuid: "top17", lastcheckok: 1},
    {name: "W Radio", country: "Mexico", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/W_Radio_logo.svg/1200px-W_Radio_logo.svg.png", tags: "news,talk", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/WRADIO.mp3", stationuuid: "top18", lastcheckok: 1},
    {name: "Caracol Radio", country: "Colombia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Caracol_Radio_logo.svg/1200px-Caracol_Radio_logo.svg.png", tags: "news,talk", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/CARACOL_RADIO.mp3", stationuuid: "top19", lastcheckok: 1},
    {name: "Radio Cooperativa", country: "Chile", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Radio_Cooperativa_logo.svg/1200px-Radio_Cooperativa_logo.svg.png", tags: "news,talk", url_resolved: "http://redirector.dps.live/cooperativafm/aac/icecast.audio", stationuuid: "top20", lastcheckok: 1},
    {name: "NHK Radio 1", country: "Japan", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/NHK_logo.svg/1200px-NHK_logo.svg.png", tags: "news,talk", url_resolved: "http://nhkradioakr1-i.akamaihd.net/hls/live/511633/1-r1/1-r1-01.m3u8", stationuuid: "top21", lastcheckok: 1},
    {name: "KBS Radio 1", country: "South Korea", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/KBS_logo.svg/1200px-KBS_logo.svg.png", tags: "news,talk", url_resolved: "http://onair.kbs.co.kr/radio/1radio/1radio_128k.mp3", stationuuid: "top22", lastcheckok: 1},
    {name: "All India Radio", country: "India", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/All_India_Radio_logo.svg/1200px-All_India_Radio_logo.svg.png", tags: "news,multicultural", url_resolved: "http://air.pc.cdn.bitgravity.com/air/live/pbaudio001/playlist.m3u8", stationuuid: "top23", lastcheckok: 1},
    {name: "5FM", country: "South Africa", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/5FM_logo.svg/1200px-5FM_logo.svg.png", tags: "pop,top40", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/5FM.mp3", stationuuid: "top24", lastcheckok: 1},
    {name: "Radio Russia", country: "Russia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Russia_logo.svg/1200px-Radio_Russia_logo.svg.png", tags: "news,talk", url_resolved: "http://icecast.vgtrk.cdnvideo.ru/rrzonam_mp3_192kbps", stationuuid: "top25", lastcheckok: 1},
    {name: "Sveriges Radio P1", country: "Sweden", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Sveriges_Radio_logo.svg/1200px-Sveriges_Radio_logo.svg.png", tags: "news,talk", url_resolved: "http://sverigesradio.se/topsy/direkt/132-hi-mp3.m3u", stationuuid: "top26", lastcheckok: 1},
    {name: "NRK P1", country: "Norway", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/NRK_logo.svg/1200px-NRK_logo.svg.png", tags: "news,pop", url_resolved: "http://lyd.nrk.no/nrk_radio_p1_ostlandssendingen_mp3_h", stationuuid: "top27", lastcheckok: 1},
    {name: "DR P1", country: "Denmark", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/DR_logo.svg/1200px-DR_logo.svg.png", tags: "news,talk", url_resolved: "http://live-icy.dr.dk/A/A01H.mp3", stationuuid: "top28", lastcheckok: 1},
    {name: "Yle Radio 1", country: "Finland", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Yle_logo.svg/1200px-Yle_logo.svg.png", tags: "classical,news", url_resolved: "http://yleradio1.yle.fi/yleradio1", stationuuid: "top29", lastcheckok: 1},
    {name: "RTE Radio 1", country: "Ireland", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/RTE_logo.svg/1200px-RTE_logo.svg.png", tags: "news,talk", url_resolved: "http://icecast2.rte.ie/radio1", stationuuid: "top30", lastcheckok: 1},
    {name: "Ö1", country: "Austria", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/ORF_logo.svg/1200px-ORF_logo.svg.png", tags: "classical,culture", url_resolved: "http://oe1.orf.at/stream", stationuuid: "top31", lastcheckok: 1},
    {name: "SRF 1", country: "Switzerland", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/SRF_logo.svg/1200px-SRF_logo.svg.png", tags: "pop,news", url_resolved: "http://stream.srg-ssr.ch/m/drs1/mp3_128", stationuuid: "top32", lastcheckok: 1},
    {name: "ERT Radio 1", country: "Greece", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/ERT_logo.svg/1200px-ERT_logo.svg.png", tags: "news,talk", url_resolved: "http://radiostreaming.ert.gr/ert-1024", stationuuid: "top33", lastcheckok: 1},
    {name: "TRT Radyo 1", country: "Turkey", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/TRT_logo.svg/1200px-TRT_logo.svg.png", tags: "news,talk", url_resolved: "http://trtcanli.aa.com.tr/radyo1/radyo1.mp3", stationuuid: "top34", lastcheckok: 1},
    {name: "Kiss FM", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Kiss_FM_logo.svg/1200px-Kiss_FM_logo.svg.png", tags: "pop,dance", url_resolved: "http://media-ice.musicradio.com/KissMP3", stationuuid: "top39", lastcheckok: 1},
    {name: "Absolute Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Absolute_Radio_logo.svg/1200px-Absolute_Radio_logo.svg.png", tags: "rock,indie", url_resolved: "http://media-ice.musicradio.com/AbsoluteRadioMP3", stationuuid: "top40", lastcheckok: 1},
    {name: "Jazz FM", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Jazz_FM_logo.svg/1200px-Jazz_FM_logo.svg.png", tags: "jazz", url_resolved: "http://media-ice.musicradio.com/JazzFMMP3", stationuuid: "top41", lastcheckok: 1},
    {name: "Classic FM", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Classic_FM_logo.svg/1200px-Classic_FM_logo.svg.png", tags: "classical", url_resolved: "http://media-ice.musicradio.com/ClassicFMMP3", stationuuid: "top42", lastcheckok: 1},
    {name: "Radio X", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_X_logo.svg/1200px-Radio_X_logo.svg.png", tags: "rock,indie", url_resolved: "http://media-ice.musicradio.com/RadioXLondonMP3", stationuuid: "top43", lastcheckok: 1},
    {name: "LBC", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/LBC_logo.svg/1200px-LBC_logo.svg.png", tags: "news,talk", url_resolved: "http://media-ice.musicradio.com/LBCUKMP3", stationuuid: "top44", lastcheckok: 1},
    {name: "Smooth Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Smooth_Radio_logo.svg/1200px-Smooth_Radio_logo.svg.png", tags: "pop,easy", url_resolved: "http://media-ice.musicradio.com/SmoothLondonMP3", stationuuid: "top45", lastcheckok: 1},
    {name: "Magic Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Magic_Radio_logo.svg/1200px-Magic_Radio_logo.svg.png", tags: "pop,adult", url_resolved: "http://media-ice.musicradio.com/MagicMP3", stationuuid: "top46", lastcheckok: 1},
    {name: "Planet Rock", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Planet_Rock_logo.svg/1200px-Planet_Rock_logo.svg.png", tags: "rock", url_resolved: "http://media-ice.musicradio.com/PlanetRockMP3", stationuuid: "top47", lastcheckok: 1},
    {name: "TalkSport", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/TalkSport_logo.svg/1200px-TalkSport_logo.svg.png", tags: "sport,talk", url_resolved: "http://radio.talksport.com/stream", stationuuid: "top48", lastcheckok: 1},
    {name: "Virgin Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Virgin_Radio_logo.svg/1200px-Virgin_Radio_logo.svg.png", tags: "pop,rock", url_resolved: "http://radio.virginradio.co.uk/stream", stationuuid: "top49", lastcheckok: 1},
    {name: "Times Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Times_Radio_logo.svg/1200px-Times_Radio_logo.svg.png", tags: "news,talk", url_resolved: "http://media-ice.musicradio.com/TimesRadioMP3", stationuuid: "top50", lastcheckok: 1}
]);

// ============ MODIFICAR load8000Stations PARA SÓ FUNCIONAIS ============
async function load8000Stations() {
    if (isApiLoading) return;
    isApiLoading = true;
    
    console.log('📡 Loading functional stations...');
    
    var unique = {};
    allStations.forEach(function(s) { unique[s.stationuuid] = true; });
    
    // 1. Top 1000 com hidebroken=true (apenas funcionais)
    try {
        var topRes = await fetch(API + '/stations/topvote/1000?hidebroken=true');
        var topData = await topRes.json();
        topData.forEach(function(s) {
            if (s.url_resolved && s.lastcheckok === 1 && !unique[s.stationuuid]) {
                unique[s.stationuuid] = true;
                allStations.push(s);
            }
        });
        console.log('✅ Top functional: ' + allStations.length);
        updateTitle();
    } catch(e) {}
    
    // 2. Por países com hidebroken=true
    var countries = ['BR','US','GB','DE','FR','ES','PT','IT','NL','CA','AU','AR','MX','CL','CO','PE','JP','KR','IN','ZA'];
    
    for (var i = 0; i < countries.length; i++) {
        try {
            var res = await fetch(API + '/stations/bycountrycodeexact/' + countries[i] + '?limit=200&hidebroken=true&order=clickcount&reverse=true');
            var data = await res.json();
            data.forEach(function(s) {
                if (s.url_resolved && s.lastcheckok === 1 && !unique[s.stationuuid]) {
                    unique[s.stationuuid] = true;
                    allStations.push(s);
                }
            });
            updateTitle();
        } catch(e) {}
    }
    
    // 3. Por gêneros com hidebroken=true
    var genreTags = ['pop','rock','electronic','jazz','classical','hiphop','country','news','sport','reggae','blues','trance','edm','house','techno','dance','latin','folk','metal','indie'];
    
    for (var j = 0; j < genreTags.length; j++) {
        try {
            var gRes = await fetch(API + '/stations/search?tag=' + genreTags[j] + '&limit=300&hidebroken=true&order=clickcount&reverse=true');
            var gData = await gRes.json();
            gData.forEach(function(s) {
                if (s.url_resolved && s.lastcheckok === 1 && !unique[s.stationuuid]) {
                    unique[s.stationuuid] = true;
                    allStations.push(s);
                }
            });
            updateTitle();
        } catch(e) {}
    }
    
    // 4. Buscar mais com hidebroken=true
    if (allStations.length < 8000) {
        var offset = 0;
        while (allStations.length < 8000 && offset < 20000) {
            try {
                var genRes = await fetch(API + '/stations/search?limit=1000&offset=' + offset + '&hidebroken=true&order=clickcount&reverse=true');
                var genData = await genRes.json();
                
                if (genData.length === 0) break;
                
                genData.forEach(function(s) {
                    if (s.url_resolved && s.lastcheckok === 1 && !unique[s.stationuuid]) {
                        unique[s.stationuuid] = true;
                        allStations.push(s);
                    }
                });
                
                offset += 1000;
            } catch(e) { break; }
        }
    }
    
    isApiLoading = false;
    console.log('🎉 Functional stations: ' + allStations.length);
    updateTitle();
}

// ============ MODIFICAR playStation PARA VERIFICAR FUNCIONALIDADE ============
function playStation(station) {
    if (!station || !station.url_resolved) {
        showToast('❌ Rádio indisponível');
        return;
    }
    
    if (currentStation) audio.pause();
    currentStation = station;
    
    audio.src = station.url_resolved;
    
    // Timeout de 10 segundos para verificar se funciona
    var timeout = setTimeout(function() {
        showToast('❌ Rádio não respondeu');
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
        showToast('❌ Erro ao tocar');
    });
}

// O RESTO DO CÓDIGO PERMANECE IGUAL

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
    allStations = instantStations;
    currentList = instantStations;
    
    renderGenres();
    renderStationList();
    updateFavCount();
    
    // Carregar 8000+ da API em background
    setTimeout(function() {
        load8000Stations();
    }, 500);
}

function renderStationList() {
    var listElement = document.getElementById('stationList');
    listElement.innerHTML = '';
    
    document.getElementById('listTitle').textContent = '🌍 ' + allStations.length + ' Rádios';
    
    allStations.slice(0, 50).forEach(function(station) {
        listElement.appendChild(createCard(station));
    });
    
    currentPage = 1;
}

// ============ CARREGAR 8000+ ESTAÇÕES EM BACKGROUND ============
async function load8000Stations() {
    if (isApiLoading) return;
    isApiLoading = true;
    
    console.log('📡 Loading 8000+ stations in background...');
    
    var unique = {};
    allStations.forEach(function(s) { unique[s.stationuuid] = true; });
    
    // 1. Top 1000
    try {
        var topRes = await fetch(API + '/stations/topvote/1000?hidebroken=true');
        var topData = await topRes.json();
        topData.forEach(function(s) {
            if (s.url_resolved && !unique[s.stationuuid]) {
                unique[s.stationuuid] = true;
                allStations.push(s);
            }
        });
        console.log('✅ Top 1000 loaded. Total: ' + allStations.length);
        updateTitle();
    } catch(e) {}
    
    // 2. Por países (40 países x 200 = 8000)
    var countries = ['BR','US','GB','DE','FR','ES','PT','IT','NL','CA','AU','AR','MX','CL','CO','PE','JP','KR','IN','ZA','EG','NG','KE','MA','AE','SA','TR','PL','SE','NO','DK','FI','IE','AT','CH','BE','GR','CZ','HU','RO'];
    
    for (var i = 0; i < countries.length; i++) {
        try {
            var res = await fetch(API + '/stations/bycountrycodeexact/' + countries[i] + '?limit=200&hidebroken=true&order=clickcount&reverse=true');
            var data = await res.json();
            data.forEach(function(s) {
                if (s.url_resolved && !unique[s.stationuuid]) {
                    unique[s.stationuuid] = true;
                    allStations.push(s);
                }
            });
            console.log('✅ ' + countries[i] + ': ' + allStations.length + ' total');
            updateTitle();
        } catch(e) {}
    }
    
    // 3. Por gêneros
    var genreTags = ['pop','rock','electronic','jazz','classical','hiphop','country','news','sport','reggae','blues','trance','edm','house','techno','dance','latin','folk','metal','indie','lounge','ambient','disco','funk','soul','rnb','rap','punk','alternative','christian'];
    
    for (var j = 0; j < genreTags.length; j++) {
        try {
            var gRes = await fetch(API + '/stations/search?tag=' + genreTags[j] + '&limit=300&hidebroken=true&order=clickcount&reverse=true');
            var gData = await gRes.json();
            gData.forEach(function(s) {
                if (s.url_resolved && !unique[s.stationuuid]) {
                    unique[s.stationuuid] = true;
                    allStations.push(s);
                }
            });
            console.log('✅ Genre ' + genreTags[j] + ': ' + allStations.length + ' total');
            updateTitle();
        } catch(e) {}
    }
    
    // 4. Buscar mais se ainda não tem 8000
    if (allStations.length < 8000) {
        var offset = 0;
        while (allStations.length < 8000 && offset < 20000) {
            try {
                var genRes = await fetch(API + '/stations/search?limit=1000&offset=' + offset + '&hidebroken=true&order=clickcount&reverse=true');
                var genData = await genRes.json();
                
                if (genData.length === 0) break;
                
                genData.forEach(function(s) {
                    if (s.url_resolved && !unique[s.stationuuid]) {
                        unique[s.stationuuid] = true;
                        allStations.push(s);
                    }
                });
                
                console.log('✅ Offset ' + offset + ': ' + allStations.length + ' total');
                updateTitle();
                offset += 1000;
            } catch(e) { break; }
        }
    }
    
    isApiLoading = false;
    console.log('🎉 FINAL: ' + allStations.length + ' stations loaded!');
    updateTitle();
}

function updateTitle() {
    var titleElement = document.getElementById('listTitle');
    if (titleElement) {
        titleElement.textContent = '🌍 ' + allStations.length + ' Rádios';
    }
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
    document.getElementById('listTitle').textContent = filtered.length + ' Rádios';
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
    
    var fragment = document.createDocumentFragment();
    
    batch.forEach(function(station) {
        fragment.appendChild(createCard(station));
    });
    
    document.getElementById('stationList').appendChild(fragment);
    currentPage++;
    isLoading = false;
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
        showToast('💔 Removido');
    } else {
        favorites.add(uuid);
        favStations.push(station);
        showToast('❤️ Adicionado!');
    }
    
    localStorage.setItem('m4fmfavs', JSON.stringify(Array.from(favorites)));
    localStorage.setItem('m4fmfavStations', JSON.stringify(favStations));
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
        document.getElementById('stationList').innerHTML = '<p style="text-align:center;padding:40px;color:#606070;">💔 Nenhum favorito</p>';
        document.getElementById('listTitle').textContent = 'Favoritos';
        return;
    }
    
    currentList = favStations;
    currentPage = 1;
    document.getElementById('stationList').innerHTML = '';
    document.getElementById('listTitle').textContent = '❤️ ' + favStations.length + ' Favoritos';
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
        showToast('❌ Erro ao tocar');
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
    document.getElementById('miniStatus').textContent = isPlaying ? '🔴 AO VIVO' : '⏸️ Pausado';
    document.getElementById('miniPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    
    document.getElementById('playerArtwork').innerHTML = img;
    document.getElementById('playerName').textContent = currentStation.name;
    document.getElementById('playerInfo').textContent = 
        (currentStation.country || '') + ' · ' + (currentStation.bitrate || '') + ' kbps';
    document.getElementById('mainPlayBtn').textContent = isPlaying ? '⏸️' : '▶️';
    document.getElementById('favBtn').textContent = 
        favorites.has(currentStation.stationuuid) ? '❤️ Favoritado' : '🤍 Favoritar';
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
    
    var shareText = 'Estou ouvindo a rádio ' + currentStation.name + ' agora no melhor aplicativo M4FMCLUB! 📻🎵';
    
    if (navigator.share) {
        navigator.share({
            title: 'M4FMCLUB - ' + currentStation.name,
            text: shareText,
            url: currentStation.homepage || window.location.href
        }).catch(function() {});
    } else {
        showToast('📋 Copiado!');
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
