// ============ ELECTROSTREAM APP ============

class ElectroStreamApp {
    constructor() {
        this.stations = [];
        this.electronicStations = [];
        this.topStations = [];
        this.currentStation = null;
        this.audio = new Audio();
        this.isPlaying = false;
        this.currentCategory = 'electronic';
        this.favorites = new Set();
        this.currentStationList = [];
        
        this.init();
    }

    async init() {
        this.bindEvents();
        this.loadFavorites();
        await this.loadStations();
    }

    bindEvents() {
        // Search
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            document.getElementById('clearBtn').style.display = query ? 'block' : 'none';
            this.searchStations(query);
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            searchInput.value = '';
            document.getElementById('clearBtn').style.display = 'none';
            this.resetDisplay();
        });

        // Categories
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.filterByCategory();
            });
        });

        // Hero button
        document.getElementById('exploreBtn').addEventListener('click', () => {
            document.querySelector('[data-category="electronic"]').click();
            document.getElementById('featuredElectronic').scrollIntoView({ behavior: 'smooth' });
        });

        // Player controls
        document.getElementById('miniPlayer').addEventListener('click', (e) => {
            if (e.target !== document.getElementById('miniPlayBtn')) {
                this.openFullPlayer();
            }
        });

        document.getElementById('miniPlayBtn').addEventListener('click', () => {
            this.togglePlay();
        });

        document.getElementById('closePlayer').addEventListener('click', () => {
            this.closeFullPlayer();
        });

        document.getElementById('playBtn').addEventListener('click', () => {
            this.togglePlay();
        });

        document.getElementById('favoriteBtn').addEventListener('click', () => {
            this.toggleFavorite();
        });

        document.getElementById('prevBtn').addEventListener('click', () => {
            this.playPrevious();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.playNext();
        });

        // Volume
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.audio.volume = e.target.value / 100;
        });

        // Audio events
        this.audio.addEventListener('playing', () => {
            this.isPlaying = true;
            this.updatePlayerUI();
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayerUI();
        });

        this.audio.addEventListener('error', () => {
            this.showToast('Error playing station');
            this.isPlaying = false;
            this.updatePlayerUI();
        });
    }

    async loadStations() {
        this.showLoading();
        
        try {
            // Fetch top 50 stations (all genres)
            const topResponse = await fetch('https://de1.api.radio-browser.info/json/stations/topvote/50');
            this.topStations = await topResponse.json();

            // Fetch electronic stations
            const electronicResponse = await fetch(
                'https://de1.api.radio-browser.info/json/stations/search?tag=electronic&limit=20&order=clickcount&reverse=true'
            );
            this.electronicStations = await electronicResponse.json();

            // Fetch more electronic genres
            const genres = ['house', 'techno', 'trance', 'edm'];
            for (const genre of genres) {
                const response = await fetch(
                    `https://de1.api.radio-browser.info/json/stations/search?tag=${genre}&limit=10&order=clickcount&reverse=true`
                );
                const stations = await response.json();
                this.electronicStations = [...this.electronicStations, ...stations];
            }

            // Remove duplicates
            this.electronicStations = this.removeDuplicates(this.electronicStations);
            
            this.stations = [...this.electronicStations, ...this.topStations];
            
            this.displayFeaturedElectronic();
            this.displayTop50();
            this.displayTrending();
            
        } catch (error) {
            console.error('Error loading stations:', error);
            this.showToast('Failed to load stations');
        }
        
        this.hideLoading();
    }

    removeDuplicates(stations) {
        const unique = new Map();
        stations.forEach(station => {
            if (!unique.has(station.stationuuid)) {
                unique.set(station.stationuuid, station);
            }
        });
        return Array.from(unique.values());
    }

    getStationImage(station) {
        if (station.favicon && station.favicon !== '') {
            return `<img src="${station.favicon}" alt="${station.name}" loading="lazy" onerror="this.parentElement.innerHTML='📻'">`;
        }
        return '📻';
    }

    displayFeaturedElectronic() {
        const container = document.getElementById('featuredElectronic');
        container.innerHTML = '';
        
        const featured = this.electronicStations.slice(0, 6);
        
        featured.forEach(station => {
            const card = document.createElement('div');
            card.className = 'featured-card';
            
            card.innerHTML = `
                <div class="featured-avatar">
                    ${this.getStationImage(station)}
                </div>
                <h3>${station.name}</h3>
                <p>${station.tags ? station.tags.split(',')[0] : 'Electronic'}</p>
            `;
            
            card.addEventListener('click', () => this.playStation(station, featured));
            container.appendChild(card);
        });
    }

    displayTop50() {
        const container = document.getElementById('top50List');
        container.innerHTML = '';
        
        this.topStations.slice(0, 50).forEach((station, index) => {
            const item = document.createElement('div');
            item.className = 'top-item';
            
            const rankClass = index < 3 ? `top-${index + 1}` : '';
            
            item.innerHTML = `
                <div class="rank ${rankClass}">${index + 1}</div>
                <div class="station-avatar">
                    ${this.getStationImage(station)}
                </div>
                <div class="station-info">
                    <h3>${station.name}</h3>
                    <p>${station.country || 'Unknown'} - ${station.bitrate || 'Live'} kbps</p>
                </div>
            `;
            
            item.addEventListener('click', () => this.playStation(station, this.topStations));
            container.appendChild(item);
        });
    }

    displayTrending() {
        const container = document.getElementById('trendingList');
        container.innerHTML = '';
        
        const trending = this.electronicStations.slice(6, 16);
        
        trending.forEach(station => {
            const card = this.createStationCard(station);
            container.appendChild(card);
        });
        
        this.currentStationList = trending;
    }

    createStationCard(station) {
        const card = document.createElement('div');
        card.className = 'station-card';
        
        if (this.currentStation && this.currentStation.stationuuid === station.stationuuid) {
            card.classList.add('playing');
        }
        
        card.innerHTML = `
            <div class="station-avatar">
                ${this.getStationImage(station)}
            </div>
            <div class="station-info">
                <h3>${station.name}</h3>
                <p>${station.country || 'Unknown'} - ${station.state || ''}</p>
                <div class="station-meta">
                    <span>🎧 ${station.bitrate || 'Live'} kbps</span>
                    ${station.votes ? `<span>❤️ ${station.votes}</span>` : ''}
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => this.playStation(station, this.currentStationList));
        return card;
    }

    searchStations(query) {
        if (!query) {
            this.resetDisplay();
            return;
        }
        
        const searchResults = this.stations.filter(station => 
            station.name.toLowerCase().includes(query.toLowerCase()) ||
            (station.tags && station.tags.toLowerCase().includes(query.toLowerCase())) ||
            (station.country && station.country.toLowerCase().includes(query.toLowerCase()))
        );
        
        this.hideSections();
        
        const container = document.getElementById('trendingList');
        container.innerHTML = '';
        
        if (searchResults.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            return;
        }
        
        document.getElementById('emptyState').style.display = 'none';
        
        this.currentStationList = searchResults.slice(0, 30);
        
        this.currentStationList.forEach(station => {
            container.appendChild(this.createStationCard(station));
        });
        
        container.parentElement.style.display = 'block';
    }

    filterByCategory() {
        if (this.currentCategory === 'all') {
            this.resetDisplay();
            return;
        }
        
        const filtered = this.stations.filter(station => 
            station.tags && station.tags.toLowerCase().includes(this.currentCategory)
        );
        
        this.hideSections();
        
        const container = document.getElementById('trendingList');
        container.innerHTML = '';
        
        if (filtered.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            return;
        }
        
        document.getElementById('emptyState').style.display = 'none';
        
        this.currentStationList = filtered.slice(0, 30);
        
        this.currentStationList.forEach(station => {
            container.appendChild(this.createStationCard(station));
        });
        
        container.parentElement.style.display = 'block';
    }

    hideSections() {
        document.getElementById('featuredElectronic').innerHTML = '';
        document.getElementById('top50List').innerHTML = '';
        document.getElementById('trendingList').innerHTML = '';
        
        document.getElementById('featuredElectronic').parentElement.style.display = 'none';
        document.getElementById('top50List').parentElement.style.display = 'none';
        document.getElementById('trendingList').parentElement.style.display = 'none';
    }

    resetDisplay() {
        document.getElementById('featuredElectronic').parentElement.style.display = 'block';
        document.getElementById('top50List').parentElement.style.display = 'block';
        document.getElementById('trendingList').parentElement.style.display = 'block';
        
        document.getElementById('emptyState').style.display = 'none';
        
        this.displayFeaturedElectronic();
        this.displayTop50();
        this.displayTrending();
    }

    async playStation(station, stationList) {
        this.currentStation = station;
        this.currentStationList = stationList || this.currentStationList;
        
        try {
            this.audio.src = station.url_resolved || station.url;
            this.audio.volume = document.getElementById('volumeSlider').value / 100;
            
            await this.audio.play();
            
            document.getElementById('miniPlayer').style.display = 'block';
            this.updatePlayerUI();
            
            this.showToast(`Now playing: ${station.name}`);
            
            // Update all station cards
            this.refreshStationCards();
            
        } catch (error) {
            console.error('Error playing station:', error);
            this.showToast('Failed to play station');
        }
    }

    refreshStationCards() {
        // Re-display current view with updated playing state
        if (document.getElementById('featuredElectronic').parentElement.style.display !== 'none') {
            this.displayFeaturedElectronic();
        }
        
        if (document.getElementById('top50List').parentElement.style.display !== 'none') {
            this.displayTop50();
        }
        
        if (document.getElementById('trendingList').parentElement.style.display !== 'none') {
            const container = document.getElementById('trendingList');
            container.innerHTML = '';
            this.currentStationList.forEach(station => {
                container.appendChild(this.createStationCard(station));
            });
        }
    }

    togglePlay() {
        if (!this.currentStation) return;
        
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play();
        }
    }

    playPrevious() {
        if (!this.currentStationList.length) return;
        
        const currentIndex = this.currentStationList.findIndex(s => 
            s.stationuuid === this.currentStation?.stationuuid
        );
        
        if (currentIndex > 0) {
            this.playStation(this.currentStationList[currentIndex - 1], this.currentStationList);
        }
    }

    playNext() {
        if (!this.currentStationList.length) return;
        
        const currentIndex = this.currentStationList.findIndex(s => 
            s.stationuuid === this.currentStation?.stationuuid
        );
        
        if (currentIndex < this.currentStationList.length - 1) {
            this.playStation(this.currentStationList[currentIndex + 1], this.currentStationList);
        }
    }

    updatePlayerUI() {
        const playBtn = document.getElementById('playBtn');
        const miniPlayBtn = document.getElementById('miniPlayBtn');
        
        const playIcon = this.isPlaying ? '⏸️' : '▶️';
        playBtn.textContent = playIcon;
        miniPlayBtn.textContent = playIcon;
        
        if (this.currentStation) {
            document.getElementById('miniName').textContent = this.currentStation.name;
            document.getElementById('miniStatus').textContent = this.isPlaying ? 'Now Playing - Live' : 'Paused';
            document.getElementById('playerName').textContent = this.currentStation.name;
            document.getElementById('playerGenre').textContent = 
                this.currentStation.tags ? this.currentStation.tags.split(',')[0] : 'Electronic Music';
            
            // Update mini player avatar with real image
            const miniAvatar = document.getElementById('miniAvatar');
            miniAvatar.innerHTML = this.getStationImage(this.currentStation);
            
            // Update full player artwork with real image
            const playerArtwork = document.getElementById('playerArtwork');
            playerArtwork.innerHTML = this.getStationImage(this.currentStation);
            
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
            
            // Update favorite button
            const favBtn = document.getElementById('favoriteBtn');
            if (this.favorites.has(this.currentStation.stationuuid)) {
                favBtn.classList.add('active');
                favBtn.textContent = '❤️ Remove from Favorites';
            } else {
                favBtn.classList.remove('active');
                favBtn.textContent = '🤍 Add to Favorites';
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

    toggleFavorite() {
        if (!this.currentStation) return;
        
        const stationId = this.currentStation.stationuuid;
        
        if (this.favorites.has(stationId)) {
            this.favorites.delete(stationId);
            this.showToast('Removed from favorites');
        } else {
            this.favorites.add(stationId);
            this.showToast('Added to favorites');
        }
        
        this.saveFavorites();
        this.updatePlayerUI();
    }

    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify([...this.favorites]));
    }

    loadFavorites() {
        const saved = localStorage.getItem('favorites');
        if (saved) {
            this.favorites = new Set(JSON.parse(saved));
        }
    }

    showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
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
    new ElectroStreamApp();
});
