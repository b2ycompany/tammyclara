/**
 * TAMMY'S STORE - CORE SCRIPT UNIFICADO
 * Versão: Galeria Navegável e Estabilidade de Mídia
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    // Estado da Galeria
    let currentGalleryImages = [];
    let currentImageIndex = 0;

    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');

    // Splash 2.5s
    setTimeout(() => {
        if (splash) {
            splash.style.opacity = '0';
            splash.style.transform = 'translateY(-100%)';
            setTimeout(() => splash.remove(), 900);
        }
        if (heroCard) setTimeout(() => heroCard.classList.add('show'), 400);
    }, 2500); 

    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) window.scrollY > 60 ? header.classList.add('scrolled') : header.classList.remove('scrolled');
    });

    // ✅ RESOLUÇÃO DE CAMINHOS DE IMAGEM (Anti-404)
    const buildUrl = (path) => {
        if (!path) return 'https://placehold.co/400x600?text=Foto+Indisponivel';
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return cleanPath.startsWith('media/') ? '/' + cleanPath : '/media/' + cleanPath;
    };

    // --- CARREGAMENTO DO CATÁLOGO ---
    async function loadProducts() {
        const container = document.getElementById('products-container') || document.getElementById('product-results');
        if (!container) return;

        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            if (!res.ok) throw new Error("API Offline");
            const products = await res.json();
            allProducts = products;

            container.innerHTML = products.map(p => {
                availableProducts[p.id] = p;
                const imgSource = buildUrl(p.main_image);
                
                return `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                        <img src="${imgSource}" 
                             alt="${p.name}" 
                             onerror="this.onerror=null; this.src='https://placehold.co/400x600?text=Aguardando+Sincronizacao';">
                    </div>
                    <div style="flex-grow:1; display:flex; flex-direction:column; justify-content:center;">
                        <h3 style="font-family:'Playfair Display'; margin-top:10px; font-size: 1.2rem;">${p.name}</h3>
                        <p style="color:#d4af37; font-weight:600; margin:10px 0;">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button class="btn-gold-outline add-to-cart-btn" data-id="${p.id}">ADICIONAR À SACOLA</button>
                </div>`;
            }).join('');

            document.querySelectorAll('.add-to-cart-btn').forEach(b => b.onclick = (e) => {
                const prod = availableProducts[e.target.dataset.id];
                const exist = cart.find(i => i.id === prod.id);
                exist ? exist.quantity++ : cart.push({...prod, quantity: 1, price: parseFloat(prod.price)});
                localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                alert("Peça adicionada!");
            });
        } catch (e) { console.error("Erro Catálogo:", e); }
    }

    // ✅ LÓGICA DE GALERIA NAVEGÁVEL
    window.openGallery = (id) => {
        const p = availableProducts[id];
        if (!p) return;

        // Monta array: Imagem Principal + Imagens Adicionais
        currentGalleryImages = [buildUrl(p.main_image)];
        if (p.images && p.images.length > 0) {
            p.images.forEach(imgObj => currentGalleryImages.push(buildUrl(imgObj.image)));
        }

        currentImageIndex = 0;
        updateGalleryUI();
        
        const modal = document.getElementById('image-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };

    window.changeImage = (direction) => {
        currentImageIndex += direction;
        if (currentImageIndex < 0) currentImageIndex = currentGalleryImages.length - 1;
        if (currentImageIndex >= currentGalleryImages.length) currentImageIndex = 0;
        updateGalleryUI();
    };

    function updateGalleryUI() {
        const main = document.getElementById('modal-main-image');
        const thumbs = document.getElementById('modal-thumbnails-container');
        if (main) main.src = currentGalleryImages[currentImageIndex];
        if (thumbs) {
            thumbs.innerHTML = currentGalleryImages.map((src, i) => `
                <img src="${src}" class="modal-thumb ${i === currentImageIndex ? 'active' : ''}" 
                     onclick="jumpToImage(${i})">
            `).join('');
        }
    }

    window.jumpToImage = (i) => { currentImageIndex = i; updateGalleryUI(); };
    window.closeGallery = () => { 
        document.getElementById('image-modal').style.display = 'none'; 
        document.body.style.overflow = 'auto'; 
    };

    // ✅ Correção linha 104 (Verifica existência do botão)
    const checkoutBtn = document.getElementById('checkout-admin-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            // Lógica de checkout simplificada
            alert("Enviando pedido para consultoria...");
        };
    }

    loadProducts();
});