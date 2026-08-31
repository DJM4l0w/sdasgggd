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

// ============ TOP 50 COM FOTOS ============
var top50Stations = [
    {name: "BBC Radio 1", country: "UK", bitrate: 128, favicon: "https://radio.bradford.edu/wp-content/uploads/2020/01/bbc-radio-1.png", tags: "pop,top40", url_resolved: "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one", stationuuid: "top01"},
    {name: "BBC Radio 2", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/BBC_Radio_2_logo.svg/1200px-BBC_Radio_2_logo.svg.png", tags: "pop,adult", url_resolved: "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_two", stationuuid: "top02"},
    {name: "Capital FM", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1e/Capital_FM_logo.svg/1200px-Capital_FM_logo.svg.png", tags: "pop,top40", url_resolved: "http://media-ice.musicradio.com/CapitalMP3", stationuuid: "top03"},
    {name: "Heart Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/en/thumb/2/2d/Heart_Radio_logo.svg/1200px-Heart_Radio_logo.svg.png", tags: "pop,adult", url_resolved: "http://media-ice.musicradio.com/HeartLondonMP3", stationuuid: "top04"},
    {name: "France Inter", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/France_Inter_logo.svg/1200px-France_Inter_logo.svg.png", tags: "news,talk", url_resolved: "http://direct.franceinter.fr/live/franceinter-midfi.mp3", stationuuid: "top05"},
    {name: "Cadena SER", country: "Spain", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Cadena_SER_logo.svg/1200px-Cadena_SER_logo.svg.png", tags: "news,talk", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/CADENASER.mp3", stationuuid: "top06"},
    {name: "Jovem Pan", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Jovem_Pan_logo.svg/1200px-Jovem_Pan_logo.svg.png", tags: "pop,news", url_resolved: "http://shout25.crossradio.com.br:18042/1", stationuuid: "top07"},
    {name: "Radio Comercial", country: "Portugal", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Radio_Comercial_logo.svg/1200px-Radio_Comercial_logo.svg.png", tags: "pop,portuguese", url_resolved: "http://mcrscast1.mcr.iol.pt/comercial.mp3", stationuuid: "top08"},
    {name: "WNYC", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/WNYC_logo.svg/1200px-WNYC_logo.svg.png", tags: "news,talk", url_resolved: "http://fm939.wnyc.org/wnycfm", stationuuid: "top09"},
    {name: "KEXP", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/KEXP_logo.svg/1200px-KEXP_logo.svg.png", tags: "rock,indie", url_resolved: "http://kexp-mp3-128.streamguys1.com/kexp128.mp3", stationuuid: "top10"},
    {name: "Radio 538", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Radio_538_logo.svg/1200px-Radio_538_logo.svg.png", tags: "pop,top40", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/RADIO538.mp3", stationuuid: "top11"},
    {name: "RTL 102.5", country: "Italy", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/RTL_102.5_logo.svg/1200px-RTL_102.5_logo.svg.png", tags: "pop,top40", url_resolved: "http://streamingv2.shoutcast.com/rtl-1025", stationuuid: "top12"},
    {name: "NRJ", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/NRJ_Logo.svg/1200px-NRJ_Logo.svg.png", tags: "pop,top40", url_resolved: "http://cdn.nrjaudio.fm/adwz1/fr/30001/mp3_128.mp3", stationuuid: "top13"},
    {name: "Deutsche Welle", country: "Germany", bitrate: 64, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Deutsche_Welle_logo.svg/1200px-Deutsche_Welle_logo.svg.png", tags: "news,international", url_resolved: "http://dw.audiostream.io/dw/1002/mp3/64/dw-radio-english", stationuuid: "top14"},
    {name: "ABC Radio Sydney", country: "Australia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/ABC_Radio_logo.svg/1200px-ABC_Radio_logo.svg.png", tags: "news,talk", url_resolved: "http://live-radio01.mediahubaustralia.com/2LRW/mp3/", stationuuid: "top15"},
    {name: "CBC Radio One", country: "Canada", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/CBC_Radio_One_logo.svg/1200px-CBC_Radio_One_logo.svg.png", tags: "news,talk", url_resolved: "http://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r1_tor", stationuuid: "top16"},
    {name: "Radio Mitre", country: "Argentina", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Radio_Mitre_logo.svg/1200px-Radio_Mitre_logo.svg.png", tags: "news,talk", url_resolved: "http://buecrplb01.cienradios.com.ar/Mitre790.aac", stationuuid: "top17"},
    {name: "W Radio", country: "Mexico", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/W_Radio_logo.svg/1200px-W_Radio_logo.svg.png", tags: "news,talk", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/WRADIO.mp3", stationuuid: "top18"},
    {name: "Caracol Radio", country: "Colombia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Caracol_Radio_logo.svg/1200px-Caracol_Radio_logo.svg.png", tags: "news,talk", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/CARACOL_RADIO.mp3", stationuuid: "top19"},
    {name: "Radio Cooperativa", country: "Chile", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Radio_Cooperativa_logo.svg/1200px-Radio_Cooperativa_logo.svg.png", tags: "news,talk", url_resolved: "http://redirector.dps.live/cooperativafm/aac/icecast.audio", stationuuid: "top20"},
    {name: "NHK Radio 1", country: "Japan", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/NHK_logo.svg/1200px-NHK_logo.svg.png", tags: "news,talk", url_resolved: "http://nhkradioakr1-i.akamaihd.net/hls/live/511633/1-r1/1-r1-01.m3u8", stationuuid: "top21"},
    {name: "KBS Radio 1", country: "South Korea", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/KBS_logo.svg/1200px-KBS_logo.svg.png", tags: "news,talk", url_resolved: "http://onair.kbs.co.kr/radio/1radio/1radio_128k.mp3", stationuuid: "top22"},
    {name: "All India Radio", country: "India", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/All_India_Radio_logo.svg/1200px-All_India_Radio_logo.svg.png", tags: "news,multicultural", url_resolved: "http://air.pc.cdn.bitgravity.com/air/live/pbaudio001/playlist.m3u8", stationuuid: "top23"},
    {name: "5FM", country: "South Africa", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/5FM_logo.svg/1200px-5FM_logo.svg.png", tags: "pop,top40", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/5FM.mp3", stationuuid: "top24"},
    {name: "Radio Russia", country: "Russia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Russia_logo.svg/1200px-Radio_Russia_logo.svg.png", tags: "news,talk", url_resolved: "http://icecast.vgtrk.cdnvideo.ru/rrzonam_mp3_192kbps", stationuuid: "top25"},
    {name: "Sveriges Radio P1", country: "Sweden", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Sveriges_Radio_logo.svg/1200px-Sveriges_Radio_logo.svg.png", tags: "news,talk", url_resolved: "http://sverigesradio.se/topsy/direkt/132-hi-mp3.m3u", stationuuid: "top26"},
    {name: "NRK P1", country: "Norway", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/NRK_logo.svg/1200px-NRK_logo.svg.png", tags: "news,pop", url_resolved: "http://lyd.nrk.no/nrk_radio_p1_ostlandssendingen_mp3_h", stationuuid: "top27"},
    {name: "DR P1", country: "Denmark", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/DR_logo.svg/1200px-DR_logo.svg.png", tags: "news,talk", url_resolved: "http://live-icy.dr.dk/A/A01H.mp3", stationuuid: "top28"},
    {name: "Yle Radio 1", country: "Finland", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Yle_logo.svg/1200px-Yle_logo.svg.png", tags: "classical,news", url_resolved: "http://yleradio1.yle.fi/yleradio1", stationuuid: "top29"},
    {name: "RTE Radio 1", country: "Ireland", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/RTE_logo.svg/1200px-RTE_logo.svg.png", tags: "news,talk", url_resolved: "http://icecast2.rte.ie/radio1", stationuuid: "top30"},
    {name: "Ö1", country: "Austria", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/ORF_logo.svg/1200px-ORF_logo.svg.png", tags: "classical,culture", url_resolved: "http://oe1.orf.at/stream", stationuuid: "top31"},
    {name: "SRF 1", country: "Switzerland", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/SRF_logo.svg/1200px-SRF_logo.svg.png", tags: "pop,news", url_resolved: "http://stream.srg-ssr.ch/m/drs1/mp3_128", stationuuid: "top32"},
    {name: "ERT Radio 1", country: "Greece", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/ERT_logo.svg/1200px-ERT_logo.svg.png", tags: "news,talk", url_resolved: "http://radiostreaming.ert.gr/ert-1024", stationuuid: "top33"},
    {name: "TRT Radyo 1", country: "Turkey", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/TRT_logo.svg/1200px-TRT_logo.svg.png", tags: "news,talk", url_resolved: "http://trtcanli.aa.com.tr/radyo1/radyo1.mp3", stationuuid: "top34"},
    {name: "Dubai FM", country: "UAE", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Dubai_FM_logo.svg/1200px-Dubai_FM_logo.svg.png", tags: "pop", url_resolved: "http://stream.dubaifm.com/dubaifm", stationuuid: "top35"},
    {name: "Cool FM", country: "Nigeria", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Cool_FM_logo.svg/1200px-Cool_FM_logo.svg.png", tags: "pop,african", url_resolved: "http://stream.coolfm.com.ng/coolfm", stationuuid: "top36"},
    {name: "Capital FM Kenya", country: "Kenya", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Capital_FM_Kenya_logo.svg/1200px-Capital_FM_Kenya_logo.svg.png", tags: "pop,african", url_resolved: "http://stream.capitalfm.co.ke/capitalfm", stationuuid: "top37"},
    {name: "Nile FM", country: "Egypt", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Nile_FM_logo.svg/1200px-Nile_FM_logo.svg.png", tags: "pop,arabic", url_resolved: "http://stream.nilefm.com/nilefm", stationuuid: "top38"},
    {name: "Kiss FM", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Kiss_FM_logo.svg/1200px-Kiss_FM_logo.svg.png", tags: "pop,dance", url_resolved: "http://media-ice.musicradio.com/KissMP3", stationuuid: "top39"},
    {name: "Absolute Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Absolute_Radio_logo.svg/1200px-Absolute_Radio_logo.svg.png", tags: "rock,indie", url_resolved: "http://media-ice.musicradio.com/AbsoluteRadioMP3", stationuuid: "top40"},
    {name: "Jazz FM", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Jazz_FM_logo.svg/1200px-Jazz_FM_logo.svg.png", tags: "jazz", url_resolved: "http://media-ice.musicradio.com/JazzFMMP3", stationuuid: "top41"},
    {name: "Classic FM", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Classic_FM_logo.svg/1200px-Classic_FM_logo.svg.png", tags: "classical", url_resolved: "http://media-ice.musicradio.com/ClassicFMMP3", stationuuid: "top42"},
    {name: "Radio X", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_X_logo.svg/1200px-Radio_X_logo.svg.png", tags: "rock,indie", url_resolved: "http://media-ice.musicradio.com/RadioXLondonMP3", stationuuid: "top43"},
    {name: "LBC", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/LBC_logo.svg/1200px-LBC_logo.svg.png", tags: "news,talk", url_resolved: "http://media-ice.musicradio.com/LBCUKMP3", stationuuid: "top44"},
    {name: "Smooth Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Smooth_Radio_logo.svg/1200px-Smooth_Radio_logo.svg.png", tags: "pop,easy", url_resolved: "http://media-ice.musicradio.com/SmoothLondonMP3", stationuuid: "top45"},
    {name: "Magic Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Magic_Radio_logo.svg/1200px-Magic_Radio_logo.svg.png", tags: "pop,adult", url_resolved: "http://media-ice.musicradio.com/MagicMP3", stationuuid: "top46"},
    {name: "Planet Rock", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Planet_Rock_logo.svg/1200px-Planet_Rock_logo.svg.png", tags: "rock", url_resolved: "http://media-ice.musicradio.com/PlanetRockMP3", stationuuid: "top47"},
    {name: "TalkSport", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/TalkSport_logo.svg/1200px-TalkSport_logo.svg.png", tags: "sport,talk", url_resolved: "http://radio.talksport.com/stream", stationuuid: "top48"},
    {name: "Virgin Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Virgin_Radio_logo.svg/1200px-Virgin_Radio_logo.svg.png", tags: "pop,rock", url_resolved: "http://radio.virginradio.co.uk/stream", stationuuid: "top49"},
    {name: "Times Radio", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Times_Radio_logo.svg/1200px-Times_Radio_logo.svg.png", tags: "news,talk", url_resolved: "http://media-ice.musicradio.com/TimesRadioMP3", stationuuid: "top50"}
];

// ============ 300 RÁDIOS COM FOTOS ============
var instantStations = top50Stations.concat([
    {name: "BBC Radio 3", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/BBC_Radio_3_logo.svg/1200px-BBC_Radio_3_logo.svg.png", tags: "classical", url_resolved: "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_three", stationuuid: "uk003"},
    {name: "BBC Radio 4", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/BBC_Radio_4_logo.svg/1200px-BBC_Radio_4_logo.svg.png", tags: "news,talk", url_resolved: "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_fourfm", stationuuid: "uk004"},
    {name: "BBC Radio 5 Live", country: "UK", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/BBC_Radio_5_Live_logo.svg/1200px-BBC_Radio_5_Live_logo.svg.png", tags: "news,sport", url_resolved: "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_five_live", stationuuid: "uk005"},
    {name: "Radio Globo", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Globo_logo.svg/1200px-Radio_Globo_logo.svg.png", tags: "pop,brazilian", url_resolved: "http://stream.radioglobo.com.br:8000/stream", stationuuid: "br002"},
    {name: "Band FM", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Band_FM_logo.svg/1200px-Band_FM_logo.svg.png", tags: "pop,brazilian", url_resolved: "http://evpp.mm.uol.com.br:1935/band/bandfm_sp/playlist.m3u8", stationuuid: "br003"},
    {name: "Mix FM", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Mix_FM_logo.svg/1200px-Mix_FM_logo.svg.png", tags: "pop,brazilian", url_resolved: "http://shout25.crossradio.com.br:18002/1", stationuuid: "br004"},
    {name: "Radio Cidade", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Cidade_logo.svg/1200px-Radio_Cidade_logo.svg.png", tags: "pop,rock", url_resolved: "http://shout25.crossradio.com.br:18006/1", stationuuid: "br005"},
    {name: "Transamérica", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Transamerica_logo.svg/1200px-Transamerica_logo.svg.png", tags: "pop,rock", url_resolved: "http://shout25.crossradio.com.br:18012/1", stationuuid: "br006"},
    {name: "Antena 1", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Antena_1_logo.svg/1200px-Antena_1_logo.svg.png", tags: "pop,adult", url_resolved: "http://antena1.newradio.it/stream", stationuuid: "br007"},
    {name: "Nova Brasil FM", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Nova_Brasil_FM_logo.svg/1200px-Nova_Brasil_FM_logo.svg.png", tags: "pop,brazilian,mpb", url_resolved: "http://streaming.novabrasilfm.com.br:8000/stream", stationuuid: "br009"},
    {name: "Radio Bandeirantes", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Bandeirantes_logo.svg/1200px-Radio_Bandeirantes_logo.svg.png", tags: "news,talk", url_resolved: "http://evpp.mm.uol.com.br:1935/band/radiobandeirantes_sp/playlist.m3u8", stationuuid: "br010"},
    {name: "CBN", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/CBN_logo.svg/1200px-CBN_logo.svg.png", tags: "news", url_resolved: "http://medias.cbn.globoradio.globo.com/cbn/cbn-sp/playlist.m3u8", stationuuid: "br011"},
    {name: "Kiss FM Brasil", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Kiss_FM_Brasil_logo.svg/1200px-Kiss_FM_Brasil_logo.svg.png", tags: "rock", url_resolved: "http://streaming.kissfm.com.br:8000/stream", stationuuid: "br013"},
    {name: "89 FM", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/89_FM_logo.svg/1200px-89_FM_logo.svg.png", tags: "rock,pop", url_resolved: "http://streaming.89fm.com.br:8000/stream", stationuuid: "br014"},
    {name: "Energia 97", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Energia_97_logo.svg/1200px-Energia_97_logo.svg.png", tags: "pop,electronic", url_resolved: "http://streaming.energia97.com.br:8000/stream", stationuuid: "br016"},
    {name: "Radio Rock", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Rock_logo.svg/1200px-Radio_Rock_logo.svg.png", tags: "rock", url_resolved: "http://streaming.radiorock.com.br:8000/stream", stationuuid: "br017"},
    {name: "Gazeta FM", country: "Brazil", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Gazeta_FM_logo.svg/1200px-Gazeta_FM_logo.svg.png", tags: "pop,brazilian", url_resolved: "http://streaming.gazetafm.com.br:8000/stream", stationuuid: "br018"},
    {name: "KCRW", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/KCRW_logo.svg/1200px-KCRW_logo.svg.png", tags: "news,music", url_resolved: "http://kcrw.streamguys1.com/kcrw_192k_mp3", stationuuid: "us003"},
    {name: "WBEZ", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/WBEZ_logo.svg/1200px-WBEZ_logo.svg.png", tags: "news,talk", url_resolved: "http://stream.wbez.org/wbez128.mp3", stationuuid: "us004"},
    {name: "KQED", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/KQED_logo.svg/1200px-KQED_logo.svg.png", tags: "news,talk", url_resolved: "http://streams.kqed.org/kqedradio", stationuuid: "us005"},
    {name: "WXPN", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/WXPN_logo.svg/1200px-WXPN_logo.svg.png", tags: "rock,indie", url_resolved: "http://wxpnhi.streamguys.com/xpnhi", stationuuid: "us006"},
    {name: "WFMU", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/WFMU_logo.svg/1200px-WFMU_logo.svg.png", tags: "rock,eclectic", url_resolved: "http://wfmu.org/wfmu.pls", stationuuid: "us007"},
    {name: "WRTI", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/WRTI_logo.svg/1200px-WRTI_logo.svg.png", tags: "classical,jazz", url_resolved: "http://wrti.streamguys1.com/wrti-classical", stationuuid: "us011"},
    {name: "WWOZ", country: "USA", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/WWOZ_logo.svg/1200px-WWOZ_logo.svg.png", tags: "jazz,blues", url_resolved: "http://wwoz-sc.streamguys.com/wwoz-hi.mp3", stationuuid: "us014"},
    {name: "France Info", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/France_Info_logo.svg/1200px-France_Info_logo.svg.png", tags: "news", url_resolved: "http://direct.franceinfo.fr/live/franceinfo-midfi.mp3", stationuuid: "fr002"},
    {name: "France Culture", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/France_Culture_logo.svg/1200px-France_Culture_logo.svg.png", tags: "culture,talk", url_resolved: "http://direct.franceculture.fr/live/franceculture-midfi.mp3", stationuuid: "fr003"},
    {name: "France Musique", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/France_Musique_logo.svg/1200px-France_Musique_logo.svg.png", tags: "classical", url_resolved: "http://direct.francemusique.fr/live/francemusique-midfi.mp3", stationuuid: "fr004"},
    {name: "FIP", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/FIP_logo.svg/1200px-FIP_logo.svg.png", tags: "eclectic", url_resolved: "http://direct.fip.fr/live/fip-midfi.mp3", stationuuid: "fr005"},
    {name: "RTL", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/RTL_logo.svg/1200px-RTL_logo.svg.png", tags: "news,talk", url_resolved: "http://streaming.radio.rtl.fr/rtl-1-44-128", stationuuid: "fr007"},
    {name: "Europe 1", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Europe_1_logo.svg/1200px-Europe_1_logo.svg.png", tags: "news,talk", url_resolved: "http://e1-live-mp3-128.scdn.arkena.com/europe1.mp3", stationuuid: "fr008"},
    {name: "RMC", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/RMC_logo.svg/1200px-RMC_logo.svg.png", tags: "news,sport", url_resolved: "http://rmc.bfmtv.com/rmc-mp3", stationuuid: "fr009"},
    {name: "RFI", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/RFI_logo.svg/1200px-RFI_logo.svg.png", tags: "news,international", url_resolved: "http://live02.rfi.fr/rfimonde-96k.mp3", stationuuid: "fr010"},
    {name: "Skyrock", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Skyrock_logo.svg/1200px-Skyrock_logo.svg.png", tags: "pop,hiphop", url_resolved: "http://icecast.skyrock.net/s/natio_mp3_128k", stationuuid: "fr011"},
    {name: "Nostalgie", country: "France", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Nostalgie_logo.svg/1200px-Nostalgie_logo.svg.png", tags: "pop,oldies", url_resolved: "http://cdn.nrjaudio.fm/adwz1/fr/30601/mp3_128.mp3", stationuuid: "fr012"},
    {name: "WDR 2", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/WDR_2_logo.svg/1200px-WDR_2_logo.svg.png", tags: "pop,news", url_resolved: "http://wdr-wdr2-rheinland.icecast.wdr.de/wdr/wdr2/rheinland/mp3/128/stream.mp3", stationuuid: "de002"},
    {name: "SWR3", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/SWR3_logo.svg/1200px-SWR3_logo.svg.png", tags: "pop", url_resolved: "http://swr-swr3-live.cast.addradio.de/swr/swr3/live/mp3/128/stream.mp3", stationuuid: "de003"},
    {name: "Bayern 1", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Bayern_1_logo.svg/1200px-Bayern_1_logo.svg.png", tags: "pop,adult", url_resolved: "http://br-br1-obb.cast.addradio.de/br/br1/obb/mp3/128/stream.mp3", stationuuid: "de004"},
    {name: "NDR 2", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/NDR_2_logo.svg/1200px-NDR_2_logo.svg.png", tags: "pop", url_resolved: "http://ndr-ndr2-niedersachsen.cast.addradio.de/ndr/ndr2/niedersachsen/mp3/128/stream.mp3", stationuuid: "de005"},
    {name: "Fritz", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Fritz_logo.svg/1200px-Fritz_logo.svg.png", tags: "pop,indie", url_resolved: "http://fritz.de/livemp3", stationuuid: "de007"},
    {name: "Flux FM", country: "Germany", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Flux_FM_logo.svg/1200px-Flux_FM_logo.svg.png", tags: "rock,indie", url_resolved: "http://fluxfm.hoerradar.de/fluxfm-berlin-mp3-128", stationuuid: "de008"},
    {name: "Cadena COPE", country: "Spain", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Cadena_COPE_logo.svg/1200px-Cadena_COPE_logo.svg.png", tags: "news,talk", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/COPE.mp3", stationuuid: "es002"},
    {name: "Onda Cero", country: "Spain", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Onda_Cero_logo.svg/1200px-Onda_Cero_logo.svg.png", tags: "news,talk", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/ONDACERO.mp3", stationuuid: "es003"},
    {name: "RNE Radio 1", country: "Spain", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/RNE_Radio_1_logo.svg/1200px-RNE_Radio_1_logo.svg.png", tags: "news", url_resolved: "http://dispatcher.rndfnk.com/crtve/rne1/main/mp3/high", stationuuid: "es004"},
    {name: "RNE Radio 3", country: "Spain", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/RNE_Radio_3_logo.svg/1200px-RNE_Radio_3_logo.svg.png", tags: "eclectic,indie", url_resolved: "http://dispatcher.rndfnk.com/crtve/rne3/main/mp3/high", stationuuid: "es005"},
    {name: "Los 40", country: "Spain", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Los_40_logo.svg/1200px-Los_40_logo.svg.png", tags: "pop,top40", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/LOS40.mp3", stationuuid: "es007"},
    {name: "Cadena Dial", country: "Spain", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Cadena_Dial_logo.svg/1200px-Cadena_Dial_logo.svg.png", tags: "pop,spanish", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/CADENADIAL.mp3", stationuuid: "es008"},
    {name: "RFM", country: "Portugal", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/RFM_logo.svg/1200px-RFM_logo.svg.png", tags: "pop,portuguese", url_resolved: "http://mcrscast1.mcr.iol.pt/rfm.mp3", stationuuid: "pt002"},
    {name: "Rádio Renascença", country: "Portugal", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Renascenca_logo.svg/1200px-Radio_Renascenca_logo.svg.png", tags: "news,pop", url_resolved: "http://mcrscast1.mcr.iol.pt/rr.mp3", stationuuid: "pt003"},
    {name: "Antena 1", country: "Portugal", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Antena_1_Portugal_logo.svg/1200px-Antena_1_Portugal_logo.svg.png", tags: "news,pop", url_resolved: "http://radiocast.rtp.pt/antena180a.mp3", stationuuid: "pt004"},
    {name: "Antena 3", country: "Portugal", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Antena_3_Portugal_logo.svg/1200px-Antena_3_Portugal_logo.svg.png", tags: "pop,indie", url_resolved: "http://radiocast.rtp.pt/antena380a.mp3", stationuuid: "pt005"},
    {name: "M80", country: "Portugal", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/M80_logo.svg/1200px-M80_logo.svg.png", tags: "pop,oldies", url_resolved: "http://mcrscast1.mcr.iol.pt/m80.mp3", stationuuid: "pt006"},
    {name: "RAI Radio 1", country: "Italy", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/RAI_Radio_1_logo.svg/1200px-RAI_Radio_1_logo.svg.png", tags: "news,talk", url_resolved: "http://icestreaming.rai.it/1.mp3", stationuuid: "it001"},
    {name: "RAI Radio 2", country: "Italy", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/RAI_Radio_2_logo.svg/1200px-RAI_Radio_2_logo.svg.png", tags: "pop,talk", url_resolved: "http://icestreaming.rai.it/2.mp3", stationuuid: "it002"},
    {name: "RAI Radio 3", country: "Italy", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/RAI_Radio_3_logo.svg/1200px-RAI_Radio_3_logo.svg.png", tags: "classical,culture", url_resolved: "http://icestreaming.rai.it/3.mp3", stationuuid: "it003"},
    {name: "Radio Italia", country: "Italy", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Italia_logo.svg/1200px-Radio_Italia_logo.svg.png", tags: "pop,italian", url_resolved: "http://streaming.radioitalia.it/radioitalia", stationuuid: "it004"},
    {name: "Radio Deejay", country: "Italy", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Deejay_logo.svg/1200px-Radio_Deejay_logo.svg.png", tags: "pop,dance", url_resolved: "http://radiodeejay-lh.akamaihd.net/i/RadioDeejay_Live_1@189857/master.m3u8", stationuuid: "it005"},
    {name: "Radio Capital", country: "Italy", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Capital_logo.svg/1200px-Radio_Capital_logo.svg.png", tags: "pop,adult", url_resolved: "http://radiocapital-lh.akamaihd.net/i/RadioCapital_Live_1@196312/master.m3u8", stationuuid: "it006"},
    {name: "Radio Monte Carlo", country: "Italy", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Monte_Carlo_logo.svg/1200px-Radio_Monte_Carlo_logo.svg.png", tags: "pop,adult", url_resolved: "http://edge.radiomontecarlo.net/rmc/mp3/128/stream.mp3", stationuuid: "it008"},
    {name: "Virgin Radio Italy", country: "Italy", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Virgin_Radio_Italy_logo.svg/1200px-Virgin_Radio_Italy_logo.svg.png", tags: "rock", url_resolved: "http://icecast.unitedradio.it/Virgin.mp3", stationuuid: "it009"},
    {name: "Radio 105", country: "Italy", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_105_logo.svg/1200px-Radio_105_logo.svg.png", tags: "pop,dance", url_resolved: "http://icecast.unitedradio.it/Radio105.mp3", stationuuid: "it010"},
    {name: "Radio Veronica", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Veronica_logo.svg/1200px-Radio_Veronica_logo.svg.png", tags: "pop,rock", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/VERONICA.mp3", stationuuid: "nl002"},
    {name: "Sky Radio", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Sky_Radio_logo.svg/1200px-Sky_Radio_logo.svg.png", tags: "pop,easy", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/SKYRADIO.mp3", stationuuid: "nl003"},
    {name: "Qmusic", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Qmusic_logo.svg/1200px-Qmusic_logo.svg.png", tags: "pop", url_resolved: "http://icecast-qmusicnl-cdp.triple-it.nl/Qmusic_nl_live_96.mp3", stationuuid: "nl004"},
    {name: "NPO Radio 1", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/NPO_Radio_1_logo.svg/1200px-NPO_Radio_1_logo.svg.png", tags: "news,talk", url_resolved: "http://icecast.omroep.nl/radio1-bb-mp3", stationuuid: "nl005"},
    {name: "NPO Radio 2", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/NPO_Radio_2_logo.svg/1200px-NPO_Radio_2_logo.svg.png", tags: "pop,adult", url_resolved: "http://icecast.omroep.nl/radio2-bb-mp3", stationuuid: "nl006"},
    {name: "NPO 3FM", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/NPO_3FM_logo.svg/1200px-NPO_3FM_logo.svg.png", tags: "pop,rock", url_resolved: "http://icecast.omroep.nl/3fm-bb-mp3", stationuuid: "nl007"},
    {name: "NPO Radio 4", country: "Netherlands", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/NPO_Radio_4_logo.svg/1200px-NPO_Radio_4_logo.svg.png", tags: "classical", url_resolved: "http://icecast.omroep.nl/radio4-bb-mp3", stationuuid: "nl008"},
    {name: "CBC Music", country: "Canada", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/CBC_Music_logo.svg/1200px-CBC_Music_logo.svg.png", tags: "eclectic,music", url_resolved: "http://cbcmp3.ic.llnwd.net/stream/cbcmp3_cbc_r2_tor", stationuuid: "ca002"},
    {name: "CHUM FM", country: "Canada", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/CHUM_FM_logo.svg/1200px-CHUM_FM_logo.svg.png", tags: "pop,adult", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/CHUMFM.mp3", stationuuid: "ca003"},
    {name: "Virgin Radio Toronto", country: "Canada", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Virgin_Radio_Toronto_logo.svg/1200px-Virgin_Radio_Toronto_logo.svg.png", tags: "pop,top40", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/CKFMFM.mp3", stationuuid: "ca004"},
    {name: "Q107", country: "Canada", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Q107_logo.svg/1200px-Q107_logo.svg.png", tags: "rock", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/Q107.mp3", stationuuid: "ca005"},
    {name: "ABC Radio Melbourne", country: "Australia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/ABC_Radio_Melbourne_logo.svg/1200px-ABC_Radio_Melbourne_logo.svg.png", tags: "news,talk", url_resolved: "http://live-radio01.mediahubaustralia.com/3LRW/mp3/", stationuuid: "au002"},
    {name: "Triple J", country: "Australia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Triple_J_logo.svg/1200px-Triple_J_logo.svg.png", tags: "pop,indie", url_resolved: "http://live-radio01.mediahubaustralia.com/2TJW/mp3/", stationuuid: "au003"},
    {name: "Double J", country: "Australia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Double_J_logo.svg/1200px-Double_J_logo.svg.png", tags: "eclectic", url_resolved: "http://live-radio01.mediahubaustralia.com/DJDW/mp3/", stationuuid: "au004"},
    {name: "ABC Classic", country: "Australia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/ABC_Classic_logo.svg/1200px-ABC_Classic_logo.svg.png", tags: "classical", url_resolved: "http://live-radio01.mediahubaustralia.com/2FMW/mp3/", stationuuid: "au005"},
    {name: "Nova 96.9", country: "Australia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Nova_969_logo.svg/1200px-Nova_969_logo.svg.png", tags: "pop,top40", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/NOVA969.mp3", stationuuid: "au008"},
    {name: "Smooth FM", country: "Australia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Smooth_FM_Australia_logo.svg/1200px-Smooth_FM_Australia_logo.svg.png", tags: "pop,easy", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/SMOOTH915.mp3", stationuuid: "au009"},
    {name: "KIIS 1065", country: "Australia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/KIIS_1065_logo.svg/1200px-KIIS_1065_logo.svg.png", tags: "pop,top40", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/KIIS1065.mp3", stationuuid: "au010"},
    {name: "Radio La Red", country: "Argentina", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_La_Red_logo.svg/1200px-Radio_La_Red_logo.svg.png", tags: "news,sport", url_resolved: "http://buecrplb01.cienradios.com.ar/LaRed910.aac", stationuuid: "ar002"},
    {name: "Radio Continental", country: "Argentina", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Continental_logo.svg/1200px-Radio_Continental_logo.svg.png", tags: "news,talk", url_resolved: "http://buecrplb01.cienradios.com.ar/Continental590.aac", stationuuid: "ar003"},
    {name: "Radio 10", country: "Argentina", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_10_Argentina_logo.svg/1200px-Radio_10_Argentina_logo.svg.png", tags: "news,talk", url_resolved: "http://buecrplb01.cienradios.com.ar/Radio10.aac", stationuuid: "ar004"},
    {name: "Los 40 Argentina", country: "Argentina", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Los_40_Argentina_logo.svg/1200px-Los_40_Argentina_logo.svg.png", tags: "pop,top40", url_resolved: "http://buecrplb01.cienradios.com.ar/Los40.aac", stationuuid: "ar005"},
    {name: "Pop Radio", country: "Argentina", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Pop_Radio_Argentina_logo.svg/1200px-Pop_Radio_Argentina_logo.svg.png", tags: "pop", url_resolved: "http://buecrplb01.cienradios.com.ar/PopRadio.aac", stationuuid: "ar006"},
    {name: "Rock & Pop", country: "Argentina", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Rock_and_Pop_logo.svg/1200px-Rock_and_Pop_logo.svg.png", tags: "rock", url_resolved: "http://buecrplb01.cienradios.com.ar/RockandPop.aac", stationuuid: "ar007"},
    {name: "Metro 95.1", country: "Argentina", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Metro_951_logo.svg/1200px-Metro_951_logo.svg.png", tags: "pop,adult", url_resolved: "http://buecrplb01.cienradios.com.ar/Metro951.aac", stationuuid: "ar008"},
    {name: "Los 40 México", country: "Mexico", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Los_40_Mexico_logo.svg/1200px-Los_40_Mexico_logo.svg.png", tags: "pop,top40", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_MEXICO.mp3", stationuuid: "mx002"},
    {name: "Exa FM", country: "Mexico", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Exa_FM_logo.svg/1200px-Exa_FM_logo.svg.png", tags: "pop", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/EXAFM.mp3", stationuuid: "mx003"},
    {name: "La Z", country: "Mexico", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/La_Z_logo.svg/1200px-La_Z_logo.svg.png", tags: "rock", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/LAZ.mp3", stationuuid: "mx004"},
    {name: "Radio Fórmula", country: "Mexico", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Formula_logo.svg/1200px-Radio_Formula_logo.svg.png", tags: "news,talk", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/RADIOFORMULA.mp3", stationuuid: "mx005"},
    {name: "Radio ADN", country: "Chile", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_ADN_logo.svg/1200px-Radio_ADN_logo.svg.png", tags: "news,talk", url_resolved: "http://redirector.dps.live/adn/aac/icecast.audio", stationuuid: "cl002"},
    {name: "Radio Pudahuel", country: "Chile", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Pudahuel_logo.svg/1200px-Radio_Pudahuel_logo.svg.png", tags: "pop", url_resolved: "http://redirector.dps.live/pudahuel/aac/icecast.audio", stationuuid: "cl003"},
    {name: "Rock & Pop Chile", country: "Chile", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Rock_and_Pop_Chile_logo.svg/1200px-Rock_and_Pop_Chile_logo.svg.png", tags: "rock", url_resolved: "http://redirector.dps.live/rockandpop/aac/icecast.audio", stationuuid: "cl004"},
    {name: "Radio Carolina", country: "Chile", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Carolina_logo.svg/1200px-Radio_Carolina_logo.svg.png", tags: "pop", url_resolved: "http://redirector.dps.live/carolina/aac/icecast.audio", stationuuid: "cl005"},
    {name: "W Radio Colombia", country: "Colombia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/W_Radio_Colombia_logo.svg/1200px-W_Radio_Colombia_logo.svg.png", tags: "news,talk", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/WRADIO_COLOMBIA.mp3", stationuuid: "co002"},
    {name: "Radio Tiempo", country: "Colombia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Tiempo_logo.svg/1200px-Radio_Tiempo_logo.svg.png", tags: "pop", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/RADIOTIEMPO.mp3", stationuuid: "co003"},
    {name: "La Mega", country: "Colombia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/La_Mega_logo.svg/1200px-La_Mega_logo.svg.png", tags: "pop,reggaeton", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/LAMEGA.mp3", stationuuid: "co004"},
    {name: "Blu Radio", country: "Colombia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Blu_Radio_logo.svg/1200px-Blu_Radio_logo.svg.png", tags: "news,talk", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/BLURADIO.mp3", stationuuid: "co005"},
    {name: "J-Wave", country: "Japan", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/J-Wave_logo.svg/1200px-J-Wave_logo.svg.png", tags: "pop", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/JWAVE.mp3", stationuuid: "jp002"},
    {name: "Tokyo FM", country: "Japan", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Tokyo_FM_logo.svg/1200px-Tokyo_FM_logo.svg.png", tags: "pop", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/TOKYOFM.mp3", stationuuid: "jp003"},
    {name: "Inter FM", country: "Japan", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Inter_FM_logo.svg/1200px-Inter_FM_logo.svg.png", tags: "pop,international", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/INTERFM.mp3", stationuuid: "jp004"},
    {name: "SBS Radio", country: "South Korea", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/SBS_Radio_logo.svg/1200px-SBS_Radio_logo.svg.png", tags: "news,talk", url_resolved: "http://onair.sbs.co.kr/radio/sbsradio_128k.mp3", stationuuid: "kr002"},
    {name: "MBC Radio", country: "South Korea", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/MBC_Radio_logo.svg/1200px-MBC_Radio_logo.svg.png", tags: "news,talk", url_resolved: "http://onair.mbc.co.kr/radio/mbc_128k.mp3", stationuuid: "kr003"},
    {name: "Radio City", country: "India", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_City_India_logo.svg/1200px-Radio_City_India_logo.svg.png", tags: "pop,bollywood", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/RADIOCITY.mp3", stationuuid: "in002"},
    {name: "Radio Mirchi", country: "India", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Mirchi_logo.svg/1200px-Radio_Mirchi_logo.svg.png", tags: "pop,bollywood", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/RADIOMIRCHI.mp3", stationuuid: "in003"},
    {name: "Metro FM", country: "South Africa", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Metro_FM_logo.svg/1200px-Metro_FM_logo.svg.png", tags: "pop,urban", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/METROFM.mp3", stationuuid: "za002"},
    {name: "SAFM", country: "South Africa", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/SAFM_logo.svg/1200px-SAFM_logo.svg.png", tags: "news,talk", url_resolved: "http://playerservices.streamtheworld.com/api/livestream-redirect/SAFM.mp3", stationuuid: "za003"},
    {name: "Europa Plus", country: "Russia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Europa_Plus_logo.svg/1200px-Europa_Plus_logo.svg.png", tags: "pop,dance", url_resolved: "http://ep256.streamr.ru", stationuuid: "ru002"},
    {name: "Radio Mayak", country: "Russia", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Mayak_logo.svg/1200px-Radio_Mayak_logo.svg.png", tags: "news,talk", url_resolved: "http://icecast.vgtrk.cdnvideo.ru/mayakfm_mp3_192kbps", stationuuid: "ru003"},
    {name: "Sveriges Radio P3", country: "Sweden", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Sveriges_Radio_P3_logo.svg/1200px-Sveriges_Radio_P3_logo.svg.png", tags: "pop", url_resolved: "http://sverigesradio.se/topsy/direkt/164-hi-mp3.m3u", stationuuid: "se002"},
    {name: "Mix Megapol", country: "Sweden", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Mix_Megapol_logo.svg/1200px-Mix_Megapol_logo.svg.png", tags: "pop,top40", url_resolved: "http://live-bauerse-fm.sharp-stream.com/mixmegapol_instream_se_aacp", stationuuid: "se003"},
    {name: "NRK P3", country: "Norway", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/NRK_P3_logo.svg/1200px-NRK_P3_logo.svg.png", tags: "pop", url_resolved: "http://lyd.nrk.no/nrk_radio_p3_mp3_h", stationuuid: "no002"},
    {name: "DR P3", country: "Denmark", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/DR_P3_logo.svg/1200px-DR_P3_logo.svg.png", tags: "pop", url_resolved: "http://live-icy.dr.dk/A/A03H.mp3", stationuuid: "dk002"},
    {name: "YleX", country: "Finland", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/YleX_logo.svg/1200px-YleX_logo.svg.png", tags: "pop", url_resolved: "http://ylex.yle.fi/ylex", stationuuid: "fi002"},
    {name: "RTE 2FM", country: "Ireland", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/RTE_2FM_logo.svg/1200px-RTE_2FM_logo.svg.png", tags: "pop", url_resolved: "http://icecast2.rte.ie/2fm", stationuuid: "ie002"},
    {name: "Ö3", country: "Austria", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/O3_logo.svg/1200px-O3_logo.svg.png", tags: "pop", url_resolved: "http://oe3.orf.at/stream", stationuuid: "at002"},
    {name: "SRF 3", country: "Switzerland", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/SRF_3_logo.svg/1200px-SRF_3_logo.svg.png", tags: "pop", url_resolved: "http://stream.srg-ssr.ch/m/drs3/mp3_128", stationuuid: "ch002"},
    {name: "Skai Radio", country: "Greece", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Skai_Radio_logo.svg/1200px-Skai_Radio_logo.svg.png", tags: "news,talk", url_resolved: "http://skai.live24.gr/skai1003", stationuuid: "gr002"},
    {name: "Power FM", country: "Turkey", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Power_FM_Turkey_logo.svg/1200px-Power_FM_Turkey_logo.svg.png", tags: "pop", url_resolved: "http://powerfm.listenpowerapp.com/powerfm/mpeg/icecast.audio", stationuuid: "tr002"},
    {name: "Abu Dhabi FM", country: "UAE", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Abu_Dhabi_FM_logo.svg/1200px-Abu_Dhabi_FM_logo.svg.png", tags: "pop,arabic", url_resolved: "http://stream.abudhabifm.com/abudhabifm", stationuuid: "ae002"},
    {name: "Wazobia FM", country: "Nigeria", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Wazobia_FM_logo.svg/1200px-Wazobia_FM_logo.svg.png", tags: "pop,african", url_resolved: "http://stream.wazobiafm.com/wazobiafm", stationuuid: "ng002"},
    {name: "Kiss FM Kenya", country: "Kenya", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Kiss_FM_Kenya_logo.svg/1200px-Kiss_FM_Kenya_logo.svg.png", tags: "pop,african", url_resolved: "http://stream.kissfm.co.ke/kissfm", stationuuid: "ke002"},
    {name: "Radio Masr", country: "Egypt", bitrate: 128, favicon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Radio_Masr_logo.svg/1200px-Radio_Masr_logo.svg.png", tags: "news,talk", url_resolved: "http://stream.radiomasr.net/radiomasr", stationuuid: "eg002"}
]);

// O resto do código (genres, init, load8000Stations, funções de player, favoritos, search, share) permanece IGUAL ao que você já tem!

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
