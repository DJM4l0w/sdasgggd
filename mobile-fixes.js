// ============ MOBILE FIXES - NÃO ALTERA O SCRIPT.JS ============

(function() {
    'use strict';
    
    // Detectar dispositivo móvel
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // ============ CORREÇÃO DE MEMORY LEAK ============
    function fixMemoryLeaks() {
        // Limpar intervalos quando a página for ocultada
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                // Pausar simulação quando página estiver oculta
                if (typeof simulationInterval !== 'undefined' && simulationInterval) {
                    clearInterval(simulationInterval);
                    simulationInterval = null;
                }
            } else {
                // Reiniciar simulação quando voltar
                if (typeof startGlobalSimulation === 'function' && !simulationInterval) {
                    startGlobalSimulation();
                }
            }
        });
        
        // Limpar tudo quando a página for fechada
        window.addEventListener('beforeunload', function() {
            if (typeof simulationInterval !== 'undefined' && simulationInterval) {
                clearInterval(simulationInterval);
            }
            if (typeof mostPlayedInterval !== 'undefined' && mostPlayedInterval) {
                clearInterval(mostPlayedInterval);
            }
            if (typeof sleepTimer !== 'undefined' && sleepTimer) {
                clearTimeout(sleepTimer);
            }
            if (typeof window.searchTimeout !== 'undefined') {
                clearTimeout(window.searchTimeout);
            }
        });
    }
    
    // ============ DEBOUNCE PARA BUSCA ============
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    function setupDebouncedSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;
        
        const debouncedFilter = debounce(function() {
            if (typeof filterStations === 'function') {
                filterStations();
            }
        }, 400);
        
        searchInput.addEventListener('input', debouncedFilter);
    }
    
    // ============ OTIMIZAÇÃO DA SIMULAÇÃO ============
    function optimizeSimulation() {
        if (!isMobile) return;
        
        // Reduzir frequência da simulação no mobile
        const originalStartSimulation = window.startGlobalSimulation;
        
        if (typeof originalStartSimulation === 'function') {
            window.startGlobalSimulation = function() {
                if (simulationInterval) clearInterval(simulationInterval);
                simulationInterval = setInterval(updateSimulation, 5000); // 5 segundos no mobile
                
                document.addEventListener('visibilitychange', function() {
                    if (document.hidden) {
                        clearInterval(simulationInterval);
                    } else {
                        simulationInterval = setInterval(updateSimulation, 5000);
                    }
                });
            };
        }
        
        // Limitar número de estações simuladas
        const originalUpdateSimulation = window.updateSimulation;
        
        if (typeof originalUpdateSimulation === 'function') {
            window.updateSimulation = function() {
                const now = new Date();
                const hourFactor = getHourFactor(now.getHours());
                const dayFactor = getDayFactor(now.getDay());
                const keys = Object.keys(globalSimulation);
                
                // No mobile, limitar a 100 estações simuladas
                const maxSimulations = 100;
                const limitedKeys = keys.slice(0, maxSimulations);
                
                for (let i = 0; i < limitedKeys.length; i++) {
                    const station = globalSimulation[limitedKeys[i]];
                    const baseTarget = station.baseListeners * hourFactor * dayFactor;
                    const wave = Math.sin(Date.now() / 10000 + i) * station.baseListeners * 0.05;
                    const random = Math.random() * station.baseListeners * 0.02;
                    const target = Math.max(20, Math.min(station.peakListeners, baseTarget + wave + random));
                    station.currentListeners = Math.floor(station.currentListeners + (target - station.currentListeners) * 0.03);
                    station.lastUpdate = Date.now();
                }
                
                if (typeof saveSimulation === 'function') saveSimulation();
                if (typeof updateCardsWithSimulation === 'function') updateCardsWithSimulation();
                if (typeof updatePlayerWithSimulation === 'function') updatePlayerWithSimulation();
            };
        }
    }
    
    // ============ LAZY LOADING DE IMAGENS ============
    function setupLazyLoading() {
        // Usar Intersection Observer para lazy loading
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        imageObserver.unobserve(img);
                    }
                });
            }, { rootMargin: '50px' });
            
            // Observar imagens que ainda não carregaram
            const observeImages = () => {
                document.querySelectorAll('img[data-src]').forEach(img => {
                    imageObserver.observe(img);
                });
            };
            
            // Observer para novos cards
            const listObserver = new MutationObserver(observeImages);
            const stationList = document.getElementById('stationList');
            if (stationList) {
                listObserver.observe(stationList, { childList: true, subtree: true });
            }
        }
    }
    
    // ============ MELHORAR ÁUDIO EM BACKGROUND ============
    function setupBackgroundAudio() {
        // Garantir que o áudio continue tocando
        if ('mediaSession' in navigator && typeof audio !== 'undefined') {
            // Atualizar metadata quando a estação mudar
            const originalPlayStation = window.playStation;
            
            if (typeof originalPlayStation === 'function') {
                window.playStation = function(station) {
                    originalPlayStation(station);
                    
                    if ('mediaSession' in navigator && station) {
                        navigator.mediaSession.metadata = new MediaMetadata({
                            title: station.name || 'M4FMCLUB',
                            artist: 'M4FMCLUB',
                            album: station.country || 'Live Radio',
                            artwork: station.favicon ? [{ src: station.favicon, sizes: '96x96' }] : []
                        });
                    }
                };
            }
        }
    }
    
    // ============ OTIMIZAÇÕES DE PERFORMANCE ============
    function optimizePerformance() {
        if (!isMobile) return;
        
        // Adicionar classe para CSS mobile
        document.body.classList.add('mobile-device');
        
        // Reduzir tamanho da página no mobile
        if (typeof PAGE_SIZE !== 'undefined') {
            PAGE_SIZE = 20;
        }
        
        // Usar passive event listeners
        const scrollElements = document.querySelectorAll('.genres-scroll, .station-list');
        scrollElements.forEach(el => {
            el.addEventListener('scroll', () => {}, { passive: true });
        });
        
        // Prevenir zoom em double-tap
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
    
    // ============ MONITORAMENTO DE BATERIA ============
    function setupBatteryMonitoring() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                function updateBatteryStatus() {
                    if (battery.level < 0.2 && !battery.charging) {
                        document.body.classList.add('power-saving');
                        
                        // Reduzir ainda mais a simulação
                        if (typeof simulationInterval !== 'undefined' && simulationInterval) {
                            clearInterval(simulationInterval);
                            simulationInterval = setInterval(updateSimulation, 10000);
                        }
                    } else {
                        document.body.classList.remove('power-saving');
                        
                        // Restaurar simulação normal
                        if (typeof simulationInterval !== 'undefined' && simulationInterval) {
                            clearInterval(simulationInterval);
                            simulationInterval = setInterval(updateSimulation, 5000);
                        }
                    }
                }
                
                updateBatteryStatus();
                battery.addEventListener('levelchange', updateBatteryStatus);
                battery.addEventListener('chargingchange', updateBatteryStatus);
            });
        }
    }
    
    // ============ CORREÇÕES DE TRATAMENTO DE ERROS ============
    function setupErrorHandling() {
        // Capturar erros globais
        window.addEventListener('error', function(e) {
            console.error('Erro capturado:', e.error);
            
            // Tentar recuperar
            if (typeof showToast === 'function') {
                const translations = {
                    'pt': 'Erro recuperado',
                    'en': 'Error recovered',
                    'es': 'Error recuperado',
                    'fr': 'Erreur récupérée'
                };
                const lang = typeof currentLanguage !== 'undefined' ? currentLanguage : 'en';
                showToast('⚠️ ' + (translations[lang] || translations['en']));
            }
        });
        
        // Tratar promessas rejeitadas
        window.addEventListener('unhandledrejection', function(e) {
            console.warn('Promise rejeitada:', e.reason);
            e.preventDefault();
        });
    }
    
    // ============ BLOQUEAR PULL TO REFRESH (SCROLL NORMAL FUNCIONA) ============
    function setupPullToRefreshPrevention() {
        if (!isMobile) return;
        
        // Usar CSS para bloquear (não interfere no scroll)
        document.body.style.overscrollBehaviorY = 'none';
        document.documentElement.style.overscrollBehaviorY = 'none';
        
        // Para Chrome Android - bloquear gesto de puxar
        let startY = 0;
        let isPullingDown = false;
        
        document.addEventListener('touchstart', function(e) {
            startY = e.touches[0].clientY;
            isPullingDown = false;
        }, { passive: true });
        
        document.addEventListener('touchmove', function(e) {
            const touchY = e.touches[0].clientY;
            const deltaY = touchY - startY;
            
            // Só bloqueia se estiver NO TOPO e puxando PARA BAIXO
            if (window.scrollY === 0 && deltaY > 0) {
                isPullingDown = true;
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('touchend', function() {
            isPullingDown = false;
        });
        
        console.log('🔒 Pull to refresh bloqueado (scroll normal funciona)');
    }
    
    // ============ INICIALIZAÇÃO ============
    function init() {
        console.log('🚀 M4FMCLUB Mobile Fixes carregado');
        
        // Aplicar correções
        fixMemoryLeaks();
        setupDebouncedSearch();
        optimizeSimulation();
        setupLazyLoading();
        setupBackgroundAudio();
        optimizePerformance();
        setupBatteryMonitoring();
        setupErrorHandling();
        setupPullToRefreshPrevention();
        
        // Registrar Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('📦 Service Worker registrado:', registration.scope);
                    })
                    .catch(error => {
                        console.error('Erro ao registrar Service Worker:', error);
                    });
            });
        }
    }
    
    // Iniciar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
