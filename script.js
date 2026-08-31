// ============ RADIO STREAM APP ============

class RadioStreamApp {
    constructor() {
        this.stations = [];
        this.filteredStations = [];
        this.currentStation = null;
        this.audio = new Audio();
        this.isPlaying = false;
        this.favorites = new Set();
        this.recentlyPlayed = [];
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.db = null;
        
        this.init();
    }

    async init() {
        this.setupDatabase();
        this.bindEvents();
        this.loadFavorites();
        this.loadStations();
    }

    // ============ DATABASE SETUP ============
    setupDatabase() {
        const request = indexedDB.open('RadioStreamDB', 1);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('stations')) {
                const store = db.createObjectStore('stations', { keyPath: 'stationuuid' });
                store.createIndex('name', 'name', { unique: false });
                store.createIndex('tags', 'tags', { unique: false });
                store.createIndex('country', 'country', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('images')) {
                db.createObjectStore('images', { keyPath: 'stationuuid' });
            }
        };
        
        request.onsuccess = (event) => {
            this.db = event.target.result;
            this.loadStationsFromDB();
        };
    }

    // ============ EVENT BINDING ============
    bindEvents() {
        // Search
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterStations();
        });
        
        // Clear search
        document.getElementById('clearBtn').addEventListener('click', () => {
            searchInput.value = '';
            this.searchQuery = '';
            this.filterStations();
            document.getElementById('clearBtn').style.display = 'none';
        });
        
        // Categories
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.filterStations();
            });
        });
        
        // Sidebar
        document.getElementById('menuBtn').addEventListener('click', () => this.openSidebar());
        document.getElementById('closeSidebarBtn').addEventListener('click', () => this.closeSidebar());
        document.getElementById('sidebarOverlay').addEventListener('click', () => this.closeSidebar());
        
        // Sidebar items
        document.getElementById('favoritesBtn').addEventListener('click', () => {
            this.showFavorites();
            this.closeSidebar();
        });
        
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.openDownloadModal();
            this.closeSidebar();
        });
        
        // Player
        document.getElementById('miniPlayer').addEventListener('click', () => this.openFullPlayer());
        document.getElementById('miniPlayBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlay();
        });
        document.getElementById('closePlayerBtn').addEventListener('click', () => this.closeFullPlayer());
        document.getElementById('playBtn').addEventListener('click', () => this.togglePlay());
        document.getElementById('playPauseBtn')?.addEventListener('click', () => this.togglePlay());
        document.getElementById('favoriteBtn').addEventListener('click', () => this.toggleFavorite());
        
        // Volume
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.audio.volume = e.target.value / 100;
        });
        
        // Download modal
        document.getElementById('closeDownloadBtn').addEventListener('click', () => this.closeDownloadModal());
        document.getElementById('modalBackdrop').addEventListener('click', () => this.closeDownloadModal());
        
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        document.getElementById('startDownloadBtn').addEventListener('click', () => this.startDownload());
    }

    // ============ LOAD STATIONS ============
    async loadStations() {
        // First try to load from DB
        await this.loadStationsFromDB();
        
        // If empty, fetch from API
        if (this.stations.length === 0) {
            await this.fetchStationsFromAPI();
        }
    }

    async loadStationsFromDB() {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['stations'], 'readonly');
        const store = transaction.objectStore('stations');
        const request = store.getAll();
        
        request.onsuccess = () => {
            this.stations = request.result;
            this.filterStations();
        };
    }

    async fetchStationsFromAPI() {
        this.showLoading();
        
        try {
            const response = await fetch('https://de1.api.radio-browser.info/json/stations/topvote/1000');
            const stations = await response.json();
            
            this.stations = stations;
            this.saveStationsToDB(stations);
            this.filterStations();
            
        } catch (error) {
            console.error('Error fetching stations:', error);
            this.showToast('Failed to load stations');
        }
        
        this.hideLoading();
    }

    async saveStationsToDB(stations) {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['stations'], 'readwrite');
        const store = transaction.objectStore('stations');
        
        stations.forEach(station => {
            store.put(station);
        });
    }

    // ============ FILTER STATIONS ============
    filterStations() {
        this.filteredStations = this.stations.filter(station => {
            const matchesSearch = !this.searchQuery || 
                station.name.toLowerCase().includes(this.searchQuery) ||
                (station.tags && station.tags.toLowerCase().includes(this.searchQuery)) ||
                (station.country && station.country.toLowerCase().includes(this.searchQuery));
            
            const matchesCategory = this.currentCategory === 'all' || 
                (station.tags && station.tags.toLowerCase().includes(this.currentCategory));
            
            return matchesSearch && matchesCategory;
        });
        
        this.displayStations();
    }

    displayStations() {
        const list = document.getElementById('stationList');
        const emptyState = document.getElementById('emptyState');
        
        list.innerHTML = '';
        
        if (this.filteredStations.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Display only first 100 for performance
        const displayStations = this.filteredStations.slice(0, 100);
        
        displayStations.forEach(station => {
            const card = this.createStationCard(station);
            list.appendChild(card);
        });
    }

    createStationCard(station) {
        const card = document.createElement('div');
        card.className = 'station-card';
        
        if (this.currentStation && this.currentStation.stationuuid === station.stationuuid) {
            card.classList.add('playing');
        }
        
        const avatar = document.createElement('div');
        avatar.className = 'station-avatar';
        
        if (station.favicon) {
            const img = document.createElement('img');
            img.src = station.favicon;
            img.alt = station.name;
            img.loading = 'lazy';
            img.onerror = () => {
                avatar.textContent = '📻';
            };
            avatar.appendChild(img);
        } else {
            avatar.textContent = '📻';
        }
        
        const info = document.createElement('div');
        info.className = 'station-info';
        info.innerHTML = `
            <h3>${station.name}</h3>
            <p>${station.country || 'Unknown'}${station.state ? ' - ' + station.state : ''}</p>
            <div class="station-meta">
                <span>🎧 ${station.bitrate ? station.bitrate + ' kbps' : 'Live'}</span>
                ${station.votes ? `<span>❤️ ${station.votes}</span>` : ''}
            </div>
        `;
        
        card.appendChild(avatar);
        card.appendChild(info);
        
        if (this.currentStation && this.currentStation.stationuuid === station.stationuuid) {
            const indicator = document.createElement('div');
            indicator.className = 'playing-indicator';
            indicator.innerHTML = `
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
            `;
            card.appendChild(indicator);
        }
        
        card.addEventListener('click', () => this.playStation(station));
        
        return card;
    }

    // ============ PLAYER CONTROLS ============
    async playStation(station) {
        this.currentStation = station;
        
        try {
            this.audio.src = station.url_resolved || station.url;
            this.audio.volume = document.getElementById('volumeSlider').value / 100;
            
            await this.audio.play();
            
            this.isPlaying = true;
            this.updatePlayerUI();
            this.addToRecentlyPlayed(station);
            
            // Show mini player
            document.getElementById('miniPlayer').style.display = 'block';
            
            this.showToast(`Now playing: ${station.name}`);
            
        } catch (error) {
            console.error('Error playing station:', error);
            this.showToast('Failed to play station');
        }
    }

    togglePlay() {
        if (!this.currentStation) return;
        
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            this.audio.play();
            this.isPlaying = true;
        }
        
        this.updatePlayerUI();
    }

    updatePlayerUI() {
        const playBtn = document.getElementById('playBtn');
        const miniPlayBtn = document.getElementById('miniPlayBtn');
        
        if (playBtn) {
            playBtn.innerHTML = this.isPlaying 
                ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
                : '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        }
        
        if (miniPlayBtn) {
            miniPlayBtn.innerHTML = this.isPlaying 
                ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
                : '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        }
        
        // Update station info in players
        if (this.currentStation) {
            document.getElementById('miniStationName').textContent = this.currentStation.name;
            document.getElementById('playerStationName').textContent = this.currentStation.name;
            document.getElementById('playerStationInfo').textContent = 
                `${this.currentStation.country || 'Unknown'} - ${this.currentStation.bitrate || 'Live'} kbps`;
            
            // Update mini player avatar
            const miniAvatar = document.getElementById('miniStationAvatar');
            if (this.currentStation.favicon) {
                miniAvatar.innerHTML = `<img src="${this.currentStation.favicon}" alt="${this.currentStation.name}">`;
            } else {
                miniAvatar.textContent = '📻';
            }
            
            // Update full player artwork
            const artwork = document.getElementById('playerArtwork');
            const artworkInner = artwork.querySelector('.artwork-inner');
            if (this.currentStation.favicon) {
                artworkInner.innerHTML = `<img src="${this.currentStation.favicon}" alt="${this.currentStation.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            } else {
                artworkInner.textContent = '📻';
            }
            
            // Update tags
            const tagsContainer = document.getElementById('playerTags');
            tagsContainer.innerHTML = '';
            if (this.currentStation.tags) {
                const tags = this.currentStation.tags.split(',').slice(0, 4);
                tags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'tag';
                    tagElement.textContent = tag.trim();
                    tagsContainer.appendChild(tagElement);
                });
            }
        }
    }

    openFullPlayer() {
        document.getElementById('fullPlayer').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeFullPlayer() {
        document.getElementById('fullPlayer').style.display = 'none';
        document.body.style.overflow = '';
    }

    // ============ FAVORITES ============
    toggleFavorite() {
        if (!this.currentStation) return;
        
        const stationId = this.currentStation.stationuuid;
        const favoriteBtn = document.getElementById('favoriteBtn');
        
        if (this.favorites.has(stationId)) {
            this.favorites.delete(stationId);
            favoriteBtn.classList.remove('active');
            favoriteBtn.querySelector('.heart-icon').textContent = '🤍';
            favoriteBtn.querySelector('span:last-child').textContent = 'Add to Favorites';
            this.showToast('Removed from favorites');
        } else {
            this.favorites.add(stationId);
            favoriteBtn.classList.add('active');
            favoriteBtn.querySelector('.heart-icon').textContent = '❤️';
            favoriteBtn.querySelector('span:last-child').textContent = 'Added to Favorites';
            this.showToast('Added to favorites');
        }
        
        this.saveFavorites();
    }

    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify([...this.favorites]));
        document.getElementById('favoritesCount').textContent = this.favorites.size;
    }

    loadFavorites() {
        const saved = localStorage.getItem('favorites');
        if (saved) {
            this.favorites = new Set(JSON.parse(saved));
            document.getElementById('favoritesCount').textContent = this.favorites.size;
        }
    }

    showFavorites() {
        this.filteredStations = this.stations.filter(station => 
            this.favorites.has(station.stationuuid)
        );
        this.displayStations();
    }

    // ============ RECENTLY PLAYED ============
    addToRecentlyPlayed(station) {
        this.recentlyPlayed = this.recentlyPlayed.filter(s => s.stationuuid !== station.stationuuid);
        this.recentlyPlayed.unshift(station);
        this.recentlyPlayed = this.recentlyPlayed.slice(0, 20);
        
        localStorage.setItem('recentlyPlayed', JSON.stringify(this.recentlyPlayed));
    }

    // ============ SIDEBAR ============
    openSidebar() {
        document.getElementById('sidebar').classList.add('active');
        document.getElementById('sidebarOverlay').classList.add('active');
    }

    closeSidebar() {
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('sidebarOverlay').classList.remove('active');
    }

    // ============ DOWNLOAD ============
    openDownloadModal() {
        document.getElementById('downloadModal').style.display = 'flex';
    }

    closeDownloadModal() {
        document.getElementById('downloadModal').style.display = 'none';
    }

    async startDownload() {
        const downloadProgress = document.getElementById('downloadProgress');
        const progressFill = document.getElementById('downloadProgressFill');
        const downloadStatus = document.getElementById('downloadStatus');
        const startBtn = document.getElementById('startDownloadBtn');
        
        downloadProgress.style.display = 'block';
        startBtn.disabled = true;
        
        // Get selected count
        const selectedBtn = document.querySelector('.option-btn.active');
        const total = parseInt(selectedBtn.dataset.value);
        const includeImages = document.getElementById('includeImages').checked;
        
        try {
            let downloaded = 0;
            let offset = 0;
            const batchSize = 500;
            
            while (downloaded < total) {
                const response = await fetch(
                    `https://de1.api.radio-browser.info/json/stations/search?limit=${batchSize}&offset=${offset}&order=clickcount&reverse=true`
                );
                
                const stations = await response.json();
                
                if (stations.length === 0) break;
                
                // Save stations to DB
                await this.saveStationsToDB(stations);
                
                // Download images if requested
                if (includeImages) {
                    for (const station of stations) {
                        if (station.favicon) {
                            try {
                                const imgResponse = await fetch(station.favicon);
                                const blob = await imgResponse.blob();
                                
                                if (blob.size > 0 && blob.type.startsWith('image/')) {
                                    await this.saveImageToDB(station.stationuuid, blob);
                                }
                            } catch (error) {
                                // Skip failed images
                            }
                        }
                    }
                }
                
                downloaded += stations.length;
                offset += batchSize;
                
                // Update progress
                const progress = Math.min((downloaded / total) * 100, 100);
                progressFill.style.width = progress + '%';
                downloadStatus.textContent = `${Math.round(progress)}% - ${downloaded}/${total} stations`;
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            this.showToast(`✅ Downloaded ${downloaded} stations successfully!`);
            
            // Reload stations
            await this.loadStationsFromDB();
            
        } catch (error) {
            console.error('Download error:', error);
            this.showToast('❌ Download failed');
        } finally {
            downloadProgress.style.display = 'none';
            startBtn.disabled = false;
            this.closeDownloadModal();
        }
    }

    async saveImageToDB(stationuuid, blob) {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        
        store.put({
            stationuuid: stationuuid,
            blob: blob,
            timestamp: Date.now()
        });
    }

    // ============ UI HELPERS ============
    showLoading() {
        document.getElementById('loadingState').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// ============ INITIALIZE APP ============
document.addEventListener('DOMContentLoaded', () => {
    const app = new RadioStreamApp();
});