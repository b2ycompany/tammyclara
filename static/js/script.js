/**
 * TAMMY'S STORE - SISTEMA UNIFICADO V17
 * Correção: Navegação de Galeria, Fechamento de Modal e Padronização.
 */
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    
    let currentGalleryImages = [];
    let currentImageIndex = 0;

    // --- 🚀 INTERFACE E SPLASH SCREEN ---
    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');
    
    setTimeout(() => {
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
            }, 800);
        }
        if (heroCard) heroCard.classList.add('show');
    }, 2500); 

    const buildUrl = (path) => {
        if (!path) return 'https://placehold.co/400x600?text=Sem+Foto';
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return cleanPath.startsWith('media/') ? '/' + cleanPath : '/media/' + cleanPath;
    };

    // --- 🛒 CARREGAMENTO DE CATÁLOGO ---
    window.loadProducts = async () => {
        const siteContainer = document.getElementById('products-container');
        if (!siteContainer) return;

        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            allProducts = await res.json();
            siteContainer.innerHTML = allProducts.map(p => {
                availableProducts[p.id] = p;
                return `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                        <img src="${buildUrl(p.main_image)}" class="standard-img" loading="lazy">
                    </div>
                    <div class="product-info">
                        <h3 style="font-size:0.9rem; margin-bottom:5px;">${p.name}</h3>
                        <p class="price">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                        <button class="btn-buy" onclick="openGallery(${p.id})">VER DETALHES</button>
                    </div>
                </div>`;
            }).join('');
        } catch (e) { console.error("[ERRO] Catálogo offline."); }
    };

    // --- 🖼️ GALERIA CORRIGIDA ---
    window.openGallery = (id) => {
        const p = availableProducts[id];
        if (!p) return;

        currentGalleryImages = [buildUrl(p.main_image)];
        if (p.images && p.images.length > 0) {
            p.images.forEach(img => currentGalleryImages.push(buildUrl(img.image)));
        }
        
        currentImageIndex = 0;
        updateGalleryUI();
        
        const modal = document.getElementById('image-modal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    window.changeImage = (step) => {
        if (currentGalleryImages.length <= 1) return;
        currentImageIndex = (currentImageIndex + step + currentGalleryImages.length) % currentGalleryImages.length;
        updateGalleryUI();
    };

    window.jumpToImage = (idx) => {
        currentImageIndex = idx;
        updateGalleryUI();
    };

    function updateGalleryUI() {
        const main = document.getElementById('modal-main-image');
        const thumbs = document.getElementById('modal-thumbnails-container');
        
        if (main) {
            main.src = currentGalleryImages[currentImageIndex];
            main.style.transform = "scale(1)";
        }
        
        if (thumbs) {
            thumbs.innerHTML = currentGalleryImages.map((src, i) => `
                <img src="${src}" class="thumb ${i === currentImageIndex ? 'active' : ''}" onclick="jumpToImage(${i})">
            `).join('');
        }
    }

    // --- CONTROLES DO MODAL ---
    const modal = document.getElementById('image-modal');
    const closeBtn = document.getElementById('closeModalBtn');
    const pBtn = document.getElementById('prevBtn');
    const nBtn = document.getElementById('nextBtn');

    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
    }

    if (pBtn) pBtn.onclick = () => changeImage(-1);
    if (nBtn) nBtn.onclick = () => changeImage(1);

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };

    // Zoom simples
    const modalMainImg = document.getElementById('modal-main-image');
    if (modalMainImg) {
        modalMainImg.onclick = function() {
            this.style.transform = this.style.transform === "scale(1.5)" ? "scale(1)" : "scale(1.5)";
            this.style.cursor = this.style.transform === "scale(1.5)" ? "zoom-out" : "zoom-in";
        };
    }

    loadProducts();
});