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
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadStations();
    }

    bindEvents() {
        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchStations(e.target.value);
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

        // Player
        document.getElementById('miniPlayer').addEventListener('click', () => this.openFullPlayer());
        document.getElementById('miniPlayBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlay();
        });
        document.getElementById('closePlayer').addEventListener('click', () => this.closeFullPlayer());
        document.getElementById('playBtn').addEventListener('click', () => this.togglePlay());
        document.getElementById('favoriteBtn').addEventListener('click', () => this.toggleFavorite());

        // Volume
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.audio.volume = e.target.value / 100;
        });

        // Hero button
        document.getElementById('exploreBtn').addEventListener('click', () => {
            document.querySelector('[data-category="electronic"]').click();
            document.getElementById('featuredElectronic').scrollIntoView({ behavior: 'smooth' });
        });
    }

    async loadStations() {
        this.showLoading();
        
        try {
            // Fetch top stations (all genres)
            const topResponse = await fetch('https://de1.api.radio-browser.info/json/stations/topvote/50');
            this.topStations = await topResponse.json();
            
            // Fetch electronic stations
            const electronicResponse = await fetch('https://de1.api.radio-browser.info/json/stations/search?tag=electronic&limit=20&order=clickcount&reverse=true');
            this.electronicStations = await electronicResponse.json();
            
            // Fetch more electronic genres
            const genres = ['house', 'techno', 'trance', 'edm'];
            for (const genre of genres) {
                const response = await fetch(`https://de1.api.radio-browser.info/json/stations/search?tag=${genre}&limit=10&order=clickcount&reverse=true`);
                const stations = await response.json();
                this.electronicStations = [...this.electronicStations, ...stations];
            }
            
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

    displayFeaturedElectronic() {
        const container = document.getElementById('featuredElectronic');
        container.innerHTML = '';
        
        const featured = this.electronicStations.slice(0, 6);
        
        featured.forEach(station => {
            const card = document.createElement('div');
            card.className = 'featured-card';
            card.innerHTML = `
                <div class="featured-avatar">⚡</div>
                <h3>${station.name}</h3>
                <p>${station.tags ? station.tags.split(',')[0] : 'Electronic'}</p>
            `;
            card.addEventListener('click', () => this.playStation(station));
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
                <div class="station-avatar">📻</div>
                <div class="station-info">
                    <h3>${station.name}</h3>
                    <p>${station.country || 'Unknown'} - ${station.bitrate || 'Live'} kbps</p>
                </div>
            `;
            
            item.addEventListener('click', () => this.playStation(station));
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
    }

    createStationCard(station) {
        const card = document.createElement('div');
        card.className = 'station-card';
        
        if (this.currentStation && this.currentStation.stationuuid === station.stationuuid) {
            card.classList.add('playing');
        }
        
        card.innerHTML = `
            <div class="station-avatar">⚡</div>
            <div class="station-info">
                <h3>${station.name}</h3>
                <p>${station.country || 'Unknown'} - ${station.state || ''}</p>
                <div class="station-meta">
                    <span>🎧 ${station.bitrate || 'Live'} kbps</span>
                    ${station.votes ? `<span>❤️ ${station.votes}</span>` : ''}
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => this.playStation(station));
        return card;
    }

    searchStations(query) {
        if (!query) {
            this.displayFeaturedElectronic();
            this.displayTop50();
            this.displayTrending();
            return;
        }
        
        const searchResults = this.stations.filter(station => 
            station.name.toLowerCase().includes(query.toLowerCase()) ||
            (station.tags && station.tags.toLowerCase().includes(query.toLowerCase()))
        );
        
        const container = document.getElementById('trendingList');
        container.innerHTML = '';
        
        document.getElementById('featuredElectronic').innerHTML = '';
        document.getElementById('top50List').innerHTML = '';
        
        searchResults.slice(0, 20).forEach(station => {
            container.appendChild(this.createStationCard(station));
        });
    }

    filterByCategory() {
        if (this.currentCategory === 'all') {
            this.displayFeaturedElectronic();
            this.displayTop50();
            this.displayTrending();
            return;
        }
        
        const filtered = this.stations.filter(station => 
            station.tags && station.tags.toLowerCase().includes(this.currentCategory)
        );
        
        document.getElementById('featuredElectronic').innerHTML = '';
        document.getElementById('top50List').innerHTML = '';
        
        const container = document.getElementById('trendingList');
        container.innerHTML = '';
        
        filtered.slice(0, 20).forEach(station => {
            container.appendChild(this.createStationCard(station));
        });
    }

    async playStation(station) {
        this.currentStation = station;
        
        try {
            this.audio.src = station.url_resolved || station.url;
            this.audio.volume = document.getElementById('volumeSlider').value / 100;
            
            await this.audio.play();
            
            this.isPlaying = true;
            this.updatePlayer();
            
            document.getElementById('miniPlayer').style.display = 'block';
            
            this.showToast(`Now playing: ${station.name}`);
            
        } catch (error) {
            console.error('Error playing:', error);
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
        
        this.updatePlayer();
    }

    updatePlayer() {
        const playBtn = document.getElementById('playBtn');
        const miniPlayBtn = document.getElementById('miniPlayBtn');
        
        playBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
        miniPlayBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
        
        if (this.currentStation) {
            document.getElementById('miniName').textContent = this.currentStation.name;
            document.getElementById('miniStatus').textContent = 'Now Playing - Live';
            document.getElementById('playerName').textContent = this.currentStation.name;
            document.getElementById('playerGenre').textContent = 
                this.currentStation.tags ? this.currentStation.tags.split(',')[0] : 'Electronic Music';
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
        const btn = document.getElementById('favoriteBtn');
        btn.classList.toggle('active');
        btn.textContent = btn.classList.contains('active') ? '❤️ Added to Favorites' : '🤍 Add to Favorites';
        this.showToast(btn.classList.contains('active') ? 'Added to favorites!' : 'Removed from favorites');
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
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

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new ElectroStreamApp();
});
