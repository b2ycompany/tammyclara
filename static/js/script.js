/**
 * TAMMY'S STORE - CORE SCRIPT UNIFICADO V10
 * Foco: UX Premium, Máscaras CRM e Galeria Navegável
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let selectedPayment = 'PIX';
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];
    
    let currentGalleryImages = [];
    let currentImageIndex = 0;

    // --- 🚀 INTERFACE E SPLASH (BRILHO DOURADO) ---
    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');

    setTimeout(() => {
        if (splash) {
            splash.style.opacity = '0';
            splash.style.transform = 'translateY(-100%)';
            setTimeout(() => splash.remove(), 900);
        }
        if (heroCard) heroCard.classList.add('show');
    }, 2500);

    // ✅ TRATAMENTO DE URL DE IMAGEM
    const buildUrl = (path) => {
        if (!path) return 'https://placehold.co/600x800?text=Foto+Indisponivel';
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return cleanPath.startsWith('media/') ? '/' + cleanPath : '/media/' + cleanPath;
    };

    // --- 🛠️ MÁSCARAS CRM (MELHORES PRÁTICAS) ---
    const mask = (val, pattern) => {
        let i = 0;
        const v = val.replace(/\D/g, "");
        return pattern.replace(/#/g, () => v[i++] || "");
    };

    const setupMasks = () => {
        const cpfField = document.getElementById('client-cpf');
        const telField = document.getElementById('client-phone');
        
        if (cpfField) {
            cpfField.addEventListener('input', (e) => {
                e.target.value = mask(e.target.value, "###.###.###-##").substring(0, 14);
            });
        }
        if (telField) {
            telField.addEventListener('input', (e) => {
                const raw = e.target.value.replace(/\D/g, "");
                const pattern = raw.length <= 10 ? "(##) ####-####" : "(##) #####-####";
                e.target.value = mask(e.target.value, pattern).substring(0, 15);
            });
        }
    };

    // --- 🛒 CARREGAMENTO DO CATÁLOGO (UX OTIMIZADA) ---
    window.loadProducts = async () => {
        const container = document.getElementById('products-container') || document.getElementById('product-results');
        if (!container) return;

        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            allProducts = await res.json();
            container.innerHTML = allProducts.map(p => {
                availableProducts[p.id] = p;
                const img = buildUrl(p.main_image);
                const isPDV = !!document.getElementById('product-results');

                if (isPDV) {
                    return `
                    <div class="product-card" onclick="addToPOS(${p.id})">
                        <img src="${img}" onerror="this.src='https://placehold.co/150x150'">
                        <h4 style="font-size:0.8rem; margin:5px 0;">${p.name}</h4>
                        <p style="color:#d4af37; font-weight:700;">R$ ${parseFloat(p.price).toFixed(2)}</p>
                    </div>`;
                }

                return `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                        <img src="${img}" alt="${p.name}" onerror="this.src='https://placehold.co/600x800'">
                    </div>
                    <div class="product-info">
                        <h3 style="font-family:'Playfair Display'; margin-top:10px;">${p.name}</h3>
                        <p style="color:#d4af37; font-weight:600; margin:10px 0;">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button class="btn-gold-outline add-cart-btn" data-id="${p.id}">ADICIONAR À SACOLA</button>
                </div>`;
            }).join('');

            // Ativar botões de compra
            document.querySelectorAll('.add-cart-btn').forEach(b => b.onclick = (e) => {
                const prod = availableProducts[e.target.dataset.id];
                const exist = cart.find(i => i.id === prod.id);
                exist ? exist.quantity++ : cart.push({...prod, quantity: 1, price: parseFloat(prod.price)});
                localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                updateUI();
                alert("Peça adicionada!");
            });
        } catch (e) { console.error("Erro API:", e); }
    };

    // --- 🎞️ GALERIA NAVEGÁVEL (UX PREMIUM) ---
    window.openGallery = (id) => {
        const p = availableProducts[id];
        if (!p) return;
        currentGalleryImages = [buildUrl(p.main_image), ...(p.images || []).map(img => buildUrl(img.image))];
        currentImageIndex = 0;
        updateGalleryUI();
        document.getElementById('image-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    window.changeImage = (dir) => {
        currentImageIndex += dir;
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

    // --- PDV E CRM (BUSCA MULTICAMPO) ---
    window.searchCustomer = async () => {
        const q = document.getElementById('client-search-input')?.value.replace(/\D/g, "");
        if (!q) return alert("Digite Nome, CPF ou WhatsApp.");
        try {
            const res = await fetch(`${API_BASE_URL}/customer/search/${q}/`);
            if (res.ok) {
                const data = await res.json();
                document.getElementById('client-name').value = data.first_name || '';
                document.getElementById('client-phone').value = data.phone_number || '';
                document.getElementById('client-cpf').value = data.cpf || '';
                alert("Cliente localizado!");
            } else { alert("Cliente novo."); }
        } catch (e) { console.log(e); }
    };

    setupMasks();
    loadProducts();
});