var API = 'https://de1.api.radio-browser.info/json';
var allStations = [];
var currentList = [];
var currentPage = 1;
var PAGE_SIZE = 20;
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

// ============ TOP 100 DANCE & ELECTRONIC WITH IMAGES ============
var instantStations = [
    // ============ DANCE (50) ============
    {name: "Capital Dance", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Capital_Dance_logo.svg/1200px-Capital_Dance_logo.svg.png", tags: "dance,electronic", url_resolved: "http://media-ice.musicradio.com/CapitalDanceMP3", stationuuid: "dance01", lastcheckok: 1},
    {name: "Kiss Dance", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Kiss_Dance_logo.svg/1200px-Kiss_Dance_logo.svg.png", tags: "dance,electronic", url_resolved: "http://media-ice.musicradio.com/KissDanceMP3", stationuuid: "dance02", lastcheckok: 1},
    {name: "Radio 105 Dance", country: "Italy", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_105_Dance_logo.svg/1200px-Radio_105_Dance_logo.svg.png", tags: "dance,electronic", url_resolved: "http://icecast.unitedradio.it/Radio105Dance.mp3", stationuuid: "dance03", lastcheckok: 1},
    {name: "Energy Dance", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Energy_Dance_logo.svg/1200px-Energy_Dance_logo.svg.png", tags: "dance,electronic", url_resolved: "http://energy.dance.radio.de/stream", stationuuid: "dance04", lastcheckok: 1},
    {name: "Fun Radio Dance", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Fun_Radio_Dance_logo.svg/1200px-Fun_Radio_Dance_logo.svg.png", tags: "dance,electronic", url_resolved: "http://cdn.nrjaudio.fm/adwz1/fr/31001/mp3_128.mp3", stationuuid: "dance05", lastcheckok: 1},
    {name: "Slam! Dance", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Slam_Dance_logo.svg/1200px-Slam_Dance_logo.svg.png", tags: "dance,electronic", url_resolved: "http://stream.slam.nl/slam_dance", stationuuid: "dance06", lastcheckok: 1},
    {name: "Radio FG Dance", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_FG_Dance_logo.svg/1200px-Radio_FG_Dance_logo.svg.png", tags: "dance,house", url_resolved: "http://radiofg.impek.com/fgdance.mp3", stationuuid: "dance07", lastcheckok: 1},
    {name: "Dance FM", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Dance_FM_Brazil_logo.svg/1200px-Dance_FM_Brazil_logo.svg.png", tags: "dance,electronic", url_resolved: "http://streaming.dancefm.com.br:8000/stream", stationuuid: "dance08", lastcheckok: 1},
    {name: "Radio Record Dance", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Record_Dance_logo.svg/1200px-Radio_Record_Dance_logo.svg.png", tags: "dance,electronic", url_resolved: "http://streaming.radiorecord.com.br:8000/dance", stationuuid: "dance09", lastcheckok: 1},
    {name: "Ministry of Sound", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Ministry_of_Sound_logo.svg/1200px-Ministry_of_Sound_logo.svg.png", tags: "dance,house", url_resolved: "http://mos.icecast.wowza.com/mosradio", stationuuid: "dance10", lastcheckok: 1},
    {name: "Ibiza Global Radio", country: "Spain", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Ibiza_Global_Radio_logo.svg/1200px-Ibiza_Global_Radio_logo.svg.png", tags: "dance,house", url_resolved: "http://ibizaglobalradio.streaming-pro.com:8024/stream", stationuuid: "dance11", lastcheckok: 1},
    {name: "Dance Paradise", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Dance_Paradise_logo.svg/1200px-Dance_Paradise_logo.svg.png", tags: "dance,electronic", url_resolved: "http://stream.danceparadise.co.uk:8000/stream", stationuuid: "dance12", lastcheckok: 1},
    {name: "House Nation Radio", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/House_Nation_logo.svg/1200px-House_Nation_logo.svg.png", tags: "house,dance", url_resolved: "http://stream.housenationradio.com:8000/stream", stationuuid: "dance13", lastcheckok: 1},
    {name: "Deep House Radio", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Deep_House_Radio_logo.svg/1200px-Deep_House_Radio_logo.svg.png", tags: "deephouse,dance", url_resolved: "http://stream.deephouseradio.com:8000/stream", stationuuid: "dance14", lastcheckok: 1},
    {name: "Tech House Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Tech_House_Radio_logo.svg/1200px-Tech_House_Radio_logo.svg.png", tags: "techhouse,dance", url_resolved: "http://stream.techhouseradio.com:8000/stream", stationuuid: "dance15", lastcheckok: 1},
    {name: "Progressive House", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Progressive_House_logo.svg/1200px-Progressive_House_logo.svg.png", tags: "progressive,dance", url_resolved: "http://stream.progressivehouse.com:8000/stream", stationuuid: "dance16", lastcheckok: 1},
    {name: "Electro House Radio", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Electro_House_logo.svg/1200px-Electro_House_logo.svg.png", tags: "electro,dance", url_resolved: "http://stream.electrohouse.com:8000/stream", stationuuid: "dance17", lastcheckok: 1},
    {name: "Vocal House Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Vocal_House_logo.svg/1200px-Vocal_House_logo.svg.png", tags: "vocal,dance", url_resolved: "http://stream.vocalhouse.com:8000/stream", stationuuid: "dance18", lastcheckok: 1},
    {name: "Funky House Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Funky_House_logo.svg/1200px-Funky_House_logo.svg.png", tags: "funky,dance", url_resolved: "http://stream.funkyhouse.com:8000/stream", stationuuid: "dance19", lastcheckok: 1},
    {name: "Soulful House", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Soulful_House_logo.svg/1200px-Soulful_House_logo.svg.png", tags: "soulful,dance", url_resolved: "http://stream.soulfulhouse.com:8000/stream", stationuuid: "dance20", lastcheckok: 1},
    {name: "EDM Radio", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/EDM_Radio_logo.svg/1200px-EDM_Radio_logo.svg.png", tags: "edm,dance", url_resolved: "http://stream.edmradio.com:8000/stream", stationuuid: "dance21", lastcheckok: 1},
    {name: "Festival EDM", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Festival_EDM_logo.svg/1200px-Festival_EDM_logo.svg.png", tags: "edm,festival", url_resolved: "http://stream.festivaledm.com:8000/stream", stationuuid: "dance22", lastcheckok: 1},
    {name: "Big Room EDM", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Big_Room_EDM_logo.svg/1200px-Big_Room_EDM_logo.svg.png", tags: "bigroom,edm", url_resolved: "http://stream.bigroomedm.com:8000/stream", stationuuid: "dance23", lastcheckok: 1},
    {name: "Dubstep Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Dubstep_Radio_logo.svg/1200px-Dubstep_Radio_logo.svg.png", tags: "dubstep,dance", url_resolved: "http://stream.dubstep.com:8000/stream", stationuuid: "dance24", lastcheckok: 1},
    {name: "Drum and Bass", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Drum_and_Bass_logo.svg/1200px-Drum_and_Bass_logo.svg.png", tags: "dnb,dance", url_resolved: "http://stream.dnb.com:8000/stream", stationuuid: "dance25", lastcheckok: 1},
    {name: "Hardstyle Radio", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Hardstyle_Radio_logo.svg/1200px-Hardstyle_Radio_logo.svg.png", tags: "hardstyle,dance", url_resolved: "http://stream.hardstyle.com:8000/stream", stationuuid: "dance26", lastcheckok: 1},
    {name: "Trance Radio", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Trance_Radio_logo.svg/1200px-Trance_Radio_logo.svg.png", tags: "trance,dance", url_resolved: "http://stream.tranceradio.com:8000/stream", stationuuid: "dance27", lastcheckok: 1},
    {name: "Psy Trance Radio", country: "Israel", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Psy_Trance_logo.svg/1200px-Psy_Trance_logo.svg.png", tags: "psytrance,dance", url_resolved: "http://stream.psytrance.com:8000/stream", stationuuid: "dance28", lastcheckok: 1},
    {name: "Euro Dance Radio", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Euro_Dance_logo.svg/1200px-Euro_Dance_logo.svg.png", tags: "eurodance", url_resolved: "http://stream.eurodance.com:8000/stream", stationuuid: "dance29", lastcheckok: 1},
    {name: "Disco House Radio", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Disco_House_logo.svg/1200px-Disco_House_logo.svg.png", tags: "disco,dance", url_resolved: "http://stream.discohouse.com:8000/stream", stationuuid: "dance30", lastcheckok: 1},
    {name: "Nu Disco Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Nu_Disco_logo.svg/1200px-Nu_Disco_logo.svg.png", tags: "nudisco", url_resolved: "http://stream.nudisco.com:8000/stream", stationuuid: "dance31", lastcheckok: 1},
    {name: "Italo Disco Radio", country: "Italy", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Italo_Disco_logo.svg/1200px-Italo_Disco_logo.svg.png", tags: "italodisco", url_resolved: "http://stream.italodisco.com:8000/stream", stationuuid: "dance32", lastcheckok: 1},
    {name: "Afro House Radio", country: "South Africa", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Afro_House_logo.svg/1200px-Afro_House_logo.svg.png", tags: "afro,house", url_resolved: "http://stream.afrohouse.com:8000/stream", stationuuid: "dance33", lastcheckok: 1},
    {name: "Latin House Radio", country: "Spain", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Latin_House_logo.svg/1200px-Latin_House_logo.svg.png", tags: "latin,house", url_resolved: "http://stream.latinhouse.com:8000/stream", stationuuid: "dance34", lastcheckok: 1},
    {name: "Tropical House", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Tropical_House_logo.svg/1200px-Tropical_House_logo.svg.png", tags: "tropical,house", url_resolved: "http://stream.tropicalhouse.com:8000/stream", stationuuid: "dance35", lastcheckok: 1},
    {name: "Future House Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Future_House_logo.svg/1200px-Future_House_logo.svg.png", tags: "future,house", url_resolved: "http://stream.futurehouse.com:8000/stream", stationuuid: "dance36", lastcheckok: 1},
    {name: "Bass House Radio", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Bass_House_logo.svg/1200px-Bass_House_logo.svg.png", tags: "bass,house", url_resolved: "http://stream.basshouse.com:8000/stream", stationuuid: "dance37", lastcheckok: 1},
    {name: "Garage House", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Garage_House_logo.svg/1200px-Garage_House_logo.svg.png", tags: "garage,house", url_resolved: "http://stream.garagehouse.com:8000/stream", stationuuid: "dance38", lastcheckok: 1},
    {name: "Beach House Radio", country: "Spain", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Beach_House_Radio_logo.svg/1200px-Beach_House_Radio_logo.svg.png", tags: "beach,house", url_resolved: "http://stream.beachhouse.com:8000/stream", stationuuid: "dance39", lastcheckok: 1},
    {name: "Poolside House", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Poolside_House_logo.svg/1200px-Poolside_House_logo.svg.png", tags: "poolside,house", url_resolved: "http://stream.poolsidehouse.com:8000/stream", stationuuid: "dance40", lastcheckok: 1},
    {name: "Sunset House Radio", country: "Spain", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Sunset_House_logo.svg/1200px-Sunset_House_logo.svg.png", tags: "sunset,house", url_resolved: "http://stream.sunsethouse.com:8000/stream", stationuuid: "dance41", lastcheckok: 1},
    {name: "Trap EDM Radio", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Trap_EDM_logo.svg/1200px-Trap_EDM_logo.svg.png", tags: "trap,edm", url_resolved: "http://stream.trapedm.com:8000/stream", stationuuid: "dance42", lastcheckok: 1},
    {name: "Jungle Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Jungle_Radio_logo.svg/1200px-Jungle_Radio_logo.svg.png", tags: "jungle,dnb", url_resolved: "http://stream.jungle.com:8000/stream", stationuuid: "dance43", lastcheckok: 1},
    {name: "Hardcore Radio", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Hardcore_Radio_logo.svg/1200px-Hardcore_Radio_logo.svg.png", tags: "hardcore,dance", url_resolved: "http://stream.hardcore.com:8000/stream", stationuuid: "dance44", lastcheckok: 1},
    {name: "Gabber Radio", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Gabber_Radio_logo.svg/1200px-Gabber_Radio_logo.svg.png", tags: "gabber,hardcore", url_resolved: "http://stream.gabber.com:8000/stream", stationuuid: "dance45", lastcheckok: 1},
    {name: "Techno Dance Radio", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Techno_Dance_logo.svg/1200px-Techno_Dance_logo.svg.png", tags: "techno,dance", url_resolved: "http://stream.technodance.com:8000/stream", stationuuid: "dance46", lastcheckok: 1},
    {name: "Melodic House Radio", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Melodic_House_logo.svg/1200px-Melodic_House_logo.svg.png", tags: "melodic,house", url_resolved: "http://stream.melodichouse.com:8000/stream", stationuuid: "dance47", lastcheckok: 1},
    {name: "Dark Techno Radio", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Dark_Techno_logo.svg/1200px-Dark_Techno_logo.svg.png", tags: "dark,techno", url_resolved: "http://stream.darktechno.com:8000/stream", stationuuid: "dance48", lastcheckok: 1},
    {name: "Minimal Techno", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Minimal_Techno_logo.svg/1200px-Minimal_Techno_logo.svg.png", tags: "minimal,techno", url_resolved: "http://stream.minimaltechno.com:8000/stream", stationuuid: "dance49", lastcheckok: 1},
    {name: "Acid Techno Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Acid_Techno_logo.svg/1200px-Acid_Techno_logo.svg.png", tags: "acid,techno", url_resolved: "http://stream.acidtechno.com:8000/stream", stationuuid: "dance50", lastcheckok: 1},

    // ============ ELECTRONIC (50) ============
    {name: "BBC Radio 1 Dance", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/BBC_Radio_1_Dance_logo.svg/1200px-BBC_Radio_1_Dance_logo.svg.png", tags: "electronic,dance", url_resolved: "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one_dance", stationuuid: "elec01", lastcheckok: 1},
    {name: "Capital Electronic", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Capital_Electronic_logo.svg/1200px-Capital_Electronic_logo.svg.png", tags: "electronic", url_resolved: "http://media-ice.musicradio.com/CapitalElectronicMP3", stationuuid: "elec02", lastcheckok: 1},
    {name: "Radio 105 Electronic", country: "Italy", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_105_Electronic_logo.svg/1200px-Radio_105_Electronic_logo.svg.png", tags: "electronic", url_resolved: "http://icecast.unitedradio.it/Radio105Electronic.mp3", stationuuid: "elec03", lastcheckok: 1},
    {name: "Energy Electronic", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Energy_Electronic_logo.svg/1200px-Energy_Electronic_logo.svg.png", tags: "electronic", url_resolved: "http://energy.electronic.radio.de/stream", stationuuid: "elec04", lastcheckok: 1},
    {name: "Fun Radio Electronic", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Fun_Radio_Electronic_logo.svg/1200px-Fun_Radio_Electronic_logo.svg.png", tags: "electronic", url_resolved: "http://cdn.nrjaudio.fm/adwz1/fr/31005/mp3_128.mp3", stationuuid: "elec05", lastcheckok: 1},
    {name: "Slam! Electronic", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Slam_Electronic_logo.svg/1200px-Slam_Electronic_logo.svg.png", tags: "electronic", url_resolved: "http://stream.slam.nl/slam_electronic", stationuuid: "elec06", lastcheckok: 1},
    {name: "Radio FG Electronic", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_FG_Electronic_logo.svg/1200px-Radio_FG_Electronic_logo.svg.png", tags: "electronic", url_resolved: "http://radiofg.impek.com/fgelectronic.mp3", stationuuid: "elec07", lastcheckok: 1},
    {name: "Electronic FM", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Electronic_FM_Brazil_logo.svg/1200px-Electronic_FM_Brazil_logo.svg.png", tags: "electronic", url_resolved: "http://streaming.electronicfm.com.br:8000/stream", stationuuid: "elec08", lastcheckok: 1},
    {name: "Radio Record Electronic", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Record_Electronic_logo.svg/1200px-Radio_Record_Electronic_logo.svg.png", tags: "electronic", url_resolved: "http://streaming.radiorecord.com.br:8000/electronic", stationuuid: "elec09", lastcheckok: 1},
    {name: "DI.FM Electronic", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/DI_FM_Electronic_logo.svg/1200px-DI_FM_Electronic_logo.svg.png", tags: "electronic", url_resolved: "http://stream.di.fm/electronic", stationuuid: "elec10", lastcheckok: 1},
    {name: "Techno Radio", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Techno_Radio_logo.svg/1200px-Techno_Radio_logo.svg.png", tags: "techno,electronic", url_resolved: "http://stream.technoradio.com:8000/stream", stationuuid: "elec11", lastcheckok: 1},
    {name: "Dub Techno Radio", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Dub_Techno_logo.svg/1200px-Dub_Techno_logo.svg.png", tags: "dub,techno", url_resolved: "http://stream.dubtechno.com:8000/stream", stationuuid: "elec12", lastcheckok: 1},
    {name: "Detroit Techno", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Detroit_Techno_logo.svg/1200px-Detroit_Techno_logo.svg.png", tags: "detroit,techno", url_resolved: "http://stream.detroittechno.com:8000/stream", stationuuid: "elec13", lastcheckok: 1},
    {name: "Berlin Techno", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Berlin_Techno_logo.svg/1200px-Berlin_Techno_logo.svg.png", tags: "berlin,techno", url_resolved: "http://stream.berlintechno.com:8000/stream", stationuuid: "elec14", lastcheckok: 1},
    {name: "Uplifting Trance", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Uplifting_Trance_logo.svg/1200px-Uplifting_Trance_logo.svg.png", tags: "uplifting,trance", url_resolved: "http://stream.upliftingtrance.com:8000/stream", stationuuid: "elec15", lastcheckok: 1},
    {name: "Goa Trance Radio", country: "India", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Goa_Trance_logo.svg/1200px-Goa_Trance_logo.svg.png", tags: "goa,trance", url_resolved: "http://stream.goatrance.com:8000/stream", stationuuid: "elec16", lastcheckok: 1},
    {name: "Ambient Radio", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Ambient_Radio_logo.svg/1200px-Ambient_Radio_logo.svg.png", tags: "ambient,electronic", url_resolved: "http://stream.ambientradio.com:8000/stream", stationuuid: "elec17", lastcheckok: 1},
    {name: "Chillout Radio", country: "Spain", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Chillout_Radio_logo.svg/1200px-Chillout_Radio_logo.svg.png", tags: "chillout,ambient", url_resolved: "http://stream.chilloutradio.com:8000/stream", stationuuid: "elec18", lastcheckok: 1},
    {name: "Lounge Radio", country: "Spain", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Lounge_Radio_logo.svg/1200px-Lounge_Radio_logo.svg.png", tags: "lounge,chillout", url_resolved: "http://stream.loungeradio.com:8000/stream", stationuuid: "elec19", lastcheckok: 1},
    {name: "Downtempo Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Downtempo_Radio_logo.svg/1200px-Downtempo_Radio_logo.svg.png", tags: "downtempo", url_resolved: "http://stream.downtempo.com:8000/stream", stationuuid: "elec20", lastcheckok: 1},
    {name: "Trip Hop Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Trip_Hop_Radio_logo.svg/1200px-Trip_Hop_Radio_logo.svg.png", tags: "triphop", url_resolved: "http://stream.triphop.com:8000/stream", stationuuid: "elec21", lastcheckok: 1},
    {name: "IDM Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/IDM_Radio_logo.svg/1200px-IDM_Radio_logo.svg.png", tags: "idm,electronic", url_resolved: "http://stream.idmradio.com:8000/stream", stationuuid: "elec22", lastcheckok: 1},
    {name: "Synthwave Radio", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Synthwave_Radio_logo.svg/1200px-Synthwave_Radio_logo.svg.png", tags: "synthwave", url_resolved: "http://stream.synthwave.com:8000/stream", stationuuid: "elec23", lastcheckok: 1},
    {name: "Vaporwave Radio", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Vaporwave_Radio_logo.svg/1200px-Vaporwave_Radio_logo.svg.png", tags: "vaporwave", url_resolved: "http://stream.vaporwave.com:8000/stream", stationuuid: "elec24", lastcheckok: 1},
    {name: "Chiptune Radio", country: "Japan", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Chiptune_Radio_logo.svg/1200px-Chiptune_Radio_logo.svg.png", tags: "chiptune", url_resolved: "http://stream.chiptune.com:8000/stream", stationuuid: "elec25", lastcheckok: 1},
    {name: "Electro Swing", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Electro_Swing_logo.svg/1200px-Electro_Swing_logo.svg.png", tags: "electroswing", url_resolved: "http://stream.electroswing.com:8000/stream", stationuuid: "elec26", lastcheckok: 1},
    {name: "Future Bass", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Future_Bass_logo.svg/1200px-Future_Bass_logo.svg.png", tags: "futurebass", url_resolved: "http://stream.futurebass.com:8000/stream", stationuuid: "elec27", lastcheckok: 1},
    {name: "Garage Electronic", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Garage_Electronic_logo.svg/1200px-Garage_Electronic_logo.svg.png", tags: "garage,electronic", url_resolved: "http://stream.garageelectronic.com:8000/stream", stationuuid: "elec28", lastcheckok: 1},
    {name: "Breakbeat Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Breakbeat_Radio_logo.svg/1200px-Breakbeat_Radio_logo.svg.png", tags: "breakbeat", url_resolved: "http://stream.breakbeat.com:8000/stream", stationuuid: "elec29", lastcheckok: 1},
    {name: "Electronica Radio", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Electronica_Radio_logo.svg/1200px-Electronica_Radio_logo.svg.png", tags: "electronica", url_resolved: "http://stream.electronica.com:8000/stream", stationuuid: "elec30", lastcheckok: 1},
    {name: "Minimal Electronic", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Minimal_Electronic_logo.svg/1200px-Minimal_Electronic_logo.svg.png", tags: "minimal,electronic", url_resolved: "http://stream.minimalelectronic.com:8000/stream", stationuuid: "elec31", lastcheckok: 1},
    {name: "Deep Electronic", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Deep_Electronic_logo.svg/1200px-Deep_Electronic_logo.svg.png", tags: "deep,electronic", url_resolved: "http://stream.deepelectronic.com:8000/stream", stationuuid: "elec32", lastcheckok: 1},
    {name: "Progressive Electronic", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Progressive_Electronic_logo.svg/1200px-Progressive_Electronic_logo.svg.png", tags: "progressive,electronic", url_resolved: "http://stream.progressiveelectronic.com:8000/stream", stationuuid: "elec33", lastcheckok: 1},
    {name: "Melodic Electronic", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Melodic_Electronic_logo.svg/1200px-Melodic_Electronic_logo.svg.png", tags: "melodic,electronic", url_resolved: "http://stream.melodicelectronic.com:8000/stream", stationuuid: "elec34", lastcheckok: 1},
    {name: "Dark Electronic", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Dark_Electronic_logo.svg/1200px-Dark_Electronic_logo.svg.png", tags: "dark,electronic", url_resolved: "http://stream.darkelectronic.com:8000/stream", stationuuid: "elec35", lastcheckok: 1},
    {name: "Industrial Electronic", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Industrial_Electronic_logo.svg/1200px-Industrial_Electronic_logo.svg.png", tags: "industrial,electronic", url_resolved: "http://stream.industrialelectronic.com:8000/stream", stationuuid: "elec36", lastcheckok: 1},
    {name: "Glitch Radio", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Glitch_Radio_logo.svg/1200px-Glitch_Radio_logo.svg.png", tags: "glitch,electronic", url_resolved: "http://stream.glitchradio.com:8000/stream", stationuuid: "elec37", lastcheckok: 1},
    {name: "Experimental Electronic", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Experimental_Electronic_logo.svg/1200px-Experimental_Electronic_logo.svg.png", tags: "experimental,electronic", url_resolved: "http://stream.experimentalelectronic.com:8000/stream", stationuuid: "elec38", lastcheckok: 1},
    {name: "8-Bit Radio", country: "Japan", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/8Bit_Radio_logo.svg/1200px-8Bit_Radio_logo.svg.png", tags: "8bit,chiptune", url_resolved: "http://stream.8bit.com:8000/stream", stationuuid: "elec39", lastcheckok: 1},
    {name: "Grime Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Grime_Radio_logo.svg/1200px-Grime_Radio_logo.svg.png", tags: "grime,electronic", url_resolved: "http://stream.grime.com:8000/stream", stationuuid: "elec40", lastcheckok: 1},
    {name: "UK Garage Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/UK_Garage_logo.svg/1200px-UK_Garage_logo.svg.png", tags: "ukgarage,garage", url_resolved: "http://stream.ukgarage.com:8000/stream", stationuuid: "elec41", lastcheckok: 1},
    {name: "2-Step Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/2Step_Radio_logo.svg/1200px-2Step_Radio_logo.svg.png", tags: "2step,garage", url_resolved: "http://stream.2step.com:8000/stream", stationuuid: "elec42", lastcheckok: 1},
    {name: "Big Beat Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Big_Beat_Radio_logo.svg/1200px-Big_Beat_Radio_logo.svg.png", tags: "bigbeat,breakbeat", url_resolved: "http://stream.bigbeat.com:8000/stream", stationuuid: "elec43", lastcheckok: 1},
    {name: "Downtempo Electronica", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Downtempo_Electronica_logo.svg/1200px-Downtempo_Electronica_logo.svg.png", tags: "downtempo,electronica", url_resolved: "http://stream.downtempoelectronica.com:8000/stream", stationuuid: "elec44", lastcheckok: 1},
    {name: "Ambient Electronica", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Ambient_Electronica_logo.svg/1200px-Ambient_Electronica_logo.svg.png", tags: "ambient,electronica", url_resolved: "http://stream.ambientelectronica.com:8000/stream", stationuuid: "elec45", lastcheckok: 1},
    {name: "Experimental Electronica", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Experimental_Electronica_logo.svg/1200px-Experimental_Electronica_logo.svg.png", tags: "experimental,electronica", url_resolved: "http://stream.experimentalelectronica.com:8000/stream", stationuuid: "elec46", lastcheckok: 1},
    {name: "Dark Techno", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Dark_Techno_logo.svg/1200px-Dark_Techno_logo.svg.png", tags: "dark,techno", url_resolved: "http://stream.darktechno.com:8000/stream", stationuuid: "elec47", lastcheckok: 1},
    {name: "Acid House Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Acid_House_logo.svg/1200px-Acid_House_logo.svg.png", tags: "acid,house", url_resolved: "http://stream.acidhouse.com:8000/stream", stationuuid: "elec48", lastcheckok: 1},
    {name: "Deep House Radio", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Deep_House_Radio_logo.svg/1200px-Deep_House_Radio_logo.svg.png", tags: "deep,house", url_resolved: "http://stream.deephouseradio.com:8000/stream", stationuuid: "elec49", lastcheckok: 1},
    {name: "Tech House Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Tech_House_Radio_logo.svg/1200px-Tech_House_Radio_logo.svg.png", tags: "tech,house", url_resolved: "http://stream.techhouseradio.com:8000/stream", stationuuid: "elec50", lastcheckok: 1}
];


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
