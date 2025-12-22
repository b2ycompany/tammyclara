/**
 * TAMMY'S STORE - SISTEMA UNIFICADO V4
 * Versão: Galeria Navegável, Grid Alinhado e Estabilidade de Mídia
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];
    
    // Estado da Galeria
    let currentGalleryImages = [];
    let currentImageIndex = 0;

    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');

    // Splash Screen 2.5s
    setTimeout(() => {
        if (splash) {
            splash.style.opacity = '0';
            splash.style.transform = 'translateY(-100%)';
            setTimeout(() => splash.remove(), 900);
        }
        if (heroCard) setTimeout(() => heroCard.classList.add('show'), 400);
    }, 2500); 

    // ✅ FUNÇÃO DE URL DEFINITIVA (Resolve o 404 e o looping)
    const buildUrl = (path) => {
        if (!path) return 'https://placehold.co/400x600?text=Foto+Indisponivel';
        if (path.startsWith('http')) return path;
        
        // Remove barras duplicadas e garante o prefixo /media/
        let cleanPath = path.startsWith('/') ? path.substring(1) : path;
        if (cleanPath.startsWith('media/')) {
            return '/' + cleanPath;
        }
        return '/media/' + cleanPath;
    };

    // --- CARREGAMENTO DO CATÁLOGO GRID ---
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
                        <img src="${imgSource}" alt="${p.name}" 
                             onerror="this.onerror=null; this.src='https://placehold.co/400x600?text=Sincronizando...';">
                    </div>
                    <div class="product-info-content" style="flex-grow:1; display:flex; flex-direction:column; justify-content:center;">
                        <h3 style="font-family:'Playfair Display'; font-size: 1.2rem; margin-top:10px;">${p.name}</h3>
                        <p style="color:#d4af37; font-weight:600; margin:10px 0;">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button class="btn-gold-outline add-cart-btn" data-id="${p.id}">ADICIONAR À SACOLA</button>
                </div>`;
            }).join('');

            document.querySelectorAll('.add-cart-btn').forEach(b => b.onclick = (e) => {
                const prod = availableProducts[e.target.dataset.id];
                const exist = cart.find(i => i.id === prod.id);
                exist ? exist.quantity++ : cart.push({...prod, quantity: 1, price: parseFloat(prod.price)});
                localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                updateUI();
                alert("Peça adicionada!");
            });
        } catch (e) { console.error("Erro Catálogo:", e); }
    }

    // --- SACOLA / CARRINHO ---
    window.updateUI = () => {
        const cont = document.querySelector('.cart-items');
        const totalDisp = document.getElementById('cart-total');
        if (!cont) return;

        let total = 0;
        cont.innerHTML = cart.map(item => {
            total += item.price * item.quantity;
            return `
            <div class="cart-item" style="display:flex; align-items:center; gap:15px; margin-bottom:15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <img src="${buildUrl(item.main_image)}" width="60" height="80" style="object-fit:cover;">
                <div style="flex-grow:1;">
                    <h4 style="font-family:'Playfair Display'; font-size:0.9rem;">${item.name}</h4>
                    <p style="font-size:0.7rem; opacity:0.5;">${item.quantity} un.</p>
                </div>
                <button onclick="remove(${item.id})" style="color:red; background:none; border:none; cursor:pointer;">&times;</button>
            </div>`;
        }).join('') || '<p style="text-align:center; opacity:0.5;">Sua sacola está vazia.</p>';
        if (totalDisp) totalDisp.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    };

    window.remove = (id) => {
        cart = cart.filter(i => i.id !== id);
        localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
        updateUI();
    };

    // ✅ LÓGICA DE GALERIA NAVEGÁVEL (SETAS E MINIATURAS)
    window.openGallery = (id) => {
        const p = availableProducts[id];
        if (!p) return;

        currentGalleryImages = [buildUrl(p.main_image)];
        if (p.images && p.images.length > 0) {
            p.images.forEach(imgObj => currentGalleryImages.push(buildUrl(imgObj.image)));
        }

        currentImageIndex = 0;
        updateGalleryUI();
        document.getElementById('image-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
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
                     onclick="jumpToImage(${i})" style="width:60px; height:80px; object-fit:cover; cursor:pointer; opacity:${i === currentImageIndex ? '1' : '0.5'}; border:${i === currentImageIndex ? '2px solid #d4af37' : 'none'};">
            `).join('');
        }
    }

    window.jumpToImage = (i) => { currentImageIndex = i; updateGalleryUI(); };
    window.closeGallery = () => { 
        document.getElementById('image-modal').style.display = 'none'; 
        document.body.style.overflow = 'auto'; 
    };

    // ✅ SEGURANÇA PDV CONTRA ERRO NULL (LINHA 104)
    const checkoutBtn = document.getElementById('checkout-admin-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            if (!cart.length) return alert("Sacola vazia.");
            const n = prompt("Nome completo:"), p = prompt("WhatsApp:");
            if (!n || !p) return alert("Dados obrigatórios.");
            try {
                const res = await fetch(`${API_BASE_URL}/checkout/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value },
                    body: JSON.stringify({ customer_info: { first_name: n, phone_number: p }, items: cart.map(i => ({ id: i.id, quantity: i.quantity })), origin: 'SITE' })
                });
                if (res.ok) { localStorage.removeItem('tammyClaraCart'); window.location.href = '/order-success/'; }
            } catch (e) { alert("Erro ao processar."); }
        };
    }

    loadProducts();
    updateUI();
});