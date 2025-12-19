/**
 * TAMMY'S STORE - CORE SCRIPT
 * Versão: 2.5 (Boutique Edition)
 * Funcionalidades: Splash Screen, E-commerce, PDV, CRM Integration
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CONFIGURAÇÕES E ESTADO GLOBAL ---
    const API_BASE_URL = '/api'; 
    const DJANGO_BASE_URL = window.location.origin.replace(/\/$/, ''); 
    
    let currentGalleryImages = [];
    let currentImageIndex = 0;
    let availableProducts = {}; // Cache de produtos carregados
    let allProducts = [];       // Cache para busca rápida no PDV
    let posCart = [];           // Carrinho específico do PDV
    let selectedPayment = 'PIX'; 
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    // --- 2. 🚀 INTERFACE PROFISSIONAL (Splash & UI Effects) ---
    const handleInterface = () => {
        try {
            const splash = document.getElementById('splash-screen');
            const heroCard = document.getElementById('heroCard');
            const mainHeader = document.getElementById('main-header');
            const mainBody = document.getElementById('main-body');

            // Timer da Splash Screen
            setTimeout(() => {
                if (splash) {
                    splash.style.opacity = '0';
                    splash.style.visibility = 'hidden';
                    splash.style.transform = 'translateY(-100%)';
                }
                
                if (mainBody) {
                    mainBody.style.opacity = '1';
                    mainBody.style.overflow = 'auto';
                }
                
                if (heroCard) {
                    setTimeout(() => heroCard.classList.add('show'), 500);
                }
            }, 2500);

            // Efeito de Header no Scroll
            window.addEventListener('scroll', () => {
                if (mainHeader) {
                    window.scrollY > 50 ? mainHeader.classList.add('scrolled') : mainHeader.classList.remove('scrolled');
                }
            });
        } catch (e) {
            console.warn("Erro ao carregar elementos de interface, forçando exibição.");
            const s = document.getElementById('splash-screen');
            if (s) s.style.display = 'none';
            document.body.style.opacity = '1';
        }
    };

    // --- 3. 🛠️ FUNÇÕES AUXILIARES ---
    const buildMediaUrl = (path) => {
        if (!path) return '/static/img/placeholder-produto.png';
        if (path.startsWith('http')) return path;
        const cleaned = path.startsWith('/') ? path.substring(1) : path;
        return '/media/' + cleaned;
    };

    const getCsrfToken = () => {
        const input = document.querySelector('input[name="csrfmiddlewaretoken"]');
        return input ? input.value : null;
    };

    const saveCart = () => localStorage.setItem('tammyClaraCart', JSON.stringify(cart));

    // --- 4. 🛒 LÓGICA DO E-COMMERCE (Catálogo e Modal) ---
    async function loadProducts() {
        const grid = document.querySelector('.products-grid#products-container');
        const homeGrid = document.getElementById('featured-products-container');
        
        const target = grid || homeGrid;
        if (!target) return;

        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            if (!res.ok) throw new Error("Erro API");
            const data = await res.json();
            allProducts = data;

            target.innerHTML = '';
            const limit = homeGrid ? 4 : data.length;

            data.slice(0, limit).forEach(p => {
                availableProducts[p.id] = p;
                const img = buildMediaUrl(p.main_image);
                
                const card = document.createElement('div');
                card.className = homeGrid ? 'product-item' : 'product-card';
                card.innerHTML = `
                    <div class="product-image-container product-img-wrapper">
                        <img src="${img}" alt="${p.name}" id="main-image-${p.id}">
                    </div>
                    <div class="product-info">
                        <h3 style="font-family: 'Playfair Display';">${p.name}</h3>
                        <p class="price" style="color: #d4af37; font-weight: 600;">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                        <button class="btn-gold-outline add-to-cart-btn" data-id="${p.id}" style="width:100%; margin-top:10px;">
                            ADICIONAR AO CARRINHO
                        </button>
                    </div>
                `;
                target.appendChild(card);
            });

            attachListeners();
        } catch (e) { console.error("Falha ao carregar catálogo:", e); }
    }

    function attachListeners() {
        // Carrinho
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.onclick = (e) => {
                const p = availableProducts[e.target.dataset.id];
                if (p) {
                    const exist = cart.find(i => i.id === p.id);
                    exist ? exist.quantity++ : cart.push({...p, quantity: 1, price: parseFloat(p.price)});
                    saveCart();
                    updateCartDisplay();
                    alert(`${p.name} adicionado!`);
                }
            };
        });

        // Modal de Imagens
        document.querySelectorAll('.product-image-container img').forEach(img => {
            img.style.cursor = 'pointer';
            img.onclick = () => {
                const id = img.id.replace('main-image-', '');
                const p = availableProducts[id];
                if (!p) return;

                currentGalleryImages = [buildMediaUrl(p.main_image)];
                if (p.images) p.images.forEach(i => currentGalleryImages.push(buildMediaUrl(i.image)));
                
                currentImageIndex = 0;
                const modal = document.getElementById('image-modal');
                const mainImg = document.getElementById('modal-main-image');
                const thumbs = document.getElementById('modal-thumbnails-container');

                if (modal && mainImg) {
                    mainImg.src = currentGalleryImages[0];
                    thumbs.innerHTML = currentGalleryImages.map((src, i) => 
                        `<img src="${src}" class="modal-thumb ${i===0?'active':''}" onclick="document.getElementById('modal-main-image').src='${src}'">`
                    ).join('');
                    modal.style.display = 'flex';
                }
            };
        });
    }

    // --- 5. 🏦 LÓGICA DO PDV (PONTO DE VENDA) ---
    window.searchProducts = () => {
        const q = document.getElementById('pos-product-search').value.toLowerCase();
        const filtered = allProducts.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
        const res = document.getElementById('product-results');
        if (!res) return;
        res.innerHTML = filtered.map(p => `
            <div class="product-card" onclick="addToPOS(${p.id})">
                <img src="${buildMediaUrl(p.main_image)}" style="width:100px; height:100px; object-fit:cover;">
                <h4>${p.name}</h4>
                <p>R$ ${p.price}</p>
            </div>
        `).join('');
    };

    window.addToPOS = (id) => {
        const p = allProducts.find(i => i.id === id);
        const exist = posCart.find(i => i.id === id);
        exist ? exist.quantity++ : posCart.push({...p, quantity: 1, price: parseFloat(p.price)});
        updatePOSDisplay();
    };

    function updatePOSDisplay() {
        const container = document.getElementById('pos-cart-items');
        if (!container) return;
        container.innerHTML = posCart.map(i => `
            <div class="cart-item">
                <h4>${i.name}</h4>
                <p>${i.quantity}x - R$ ${(i.price * i.quantity).toFixed(2)}</p>
            </div>
        `).join('') || '<p>Vazio</p>';
        
        const sub = posCart.reduce((a, b) => a + (b.price * b.quantity), 0);
        const disc = parseFloat(document.getElementById('discount-input')?.value || 0) / 100;
        const total = sub * (1 - disc);
        
        if (document.getElementById('pos-subtotal')) document.getElementById('pos-subtotal').innerText = `R$ ${sub.toFixed(2)}`;
        if (document.getElementById('pos-total')) document.getElementById('pos-total').innerText = `R$ ${total.toFixed(2)}`;
    }

    window.searchCustomerByPhone = async () => {
        const phone = document.getElementById('client-phone').value;
        try {
            const res = await fetch(`${API_BASE_URL}/customer/search/${phone}/`);
            if (res.ok) {
                const data = await res.json();
                document.getElementById('client-name').value = data.first_name;
                document.getElementById('client-email').value = data.email || '';
                alert("Cliente encontrado!");
            } else { alert("Não encontrado."); }
        } catch (e) { console.error(e); }
    };

    // --- 6. 📝 FINALIZAÇÃO DE VENDA (E-commerce Lead p/ Admin) ---
    window.processCheckoutLead = async () => {
        if (cart.length === 0) return alert("Carrinho vazio.");
        const name = prompt("Nome completo:");
        const phone = prompt("WhatsApp (com DDD):");
        if (!name || !phone) return alert("Nome e WhatsApp são obrigatórios.");

        const payload = {
            customer_info: { first_name: name, phone_number: phone, email: "" },
            items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
            origin: 'SITE'
        };

        try {
            const res = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const r = await res.json();
                localStorage.removeItem('tammyClaraCart');
                window.location.href = `/order-success/?id=${r.sale_id}`;
            } else {
                const err = await res.json();
                alert(err.error || "Erro ao processar.");
            }
        } catch (e) { console.error(e); }
    };

    // --- 7. 🔃 INICIALIZAÇÃO ---
    handleInterface();
    loadProducts();
    
    // Carrinho Display
    function updateCartDisplay() {
        const cont = document.querySelector('.cart-items');
        if (!cont) return;
        cont.innerHTML = cart.map(i => `
            <div class="cart-item">
                <img src="${buildMediaUrl(i.main_image)}" style="width:60px;">
                <div class="cart-item-details">
                    <h4>${i.name}</h4>
                    <p>${i.quantity}x R$ ${i.price.toFixed(2)}</p>
                </div>
            </div>
        `).join('') || '<p>Carrinho vazio.</p>';
        const total = cart.reduce((a, b) => a + (b.price * b.quantity), 0);
        if (document.getElementById('cart-total')) document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2)}`;
    }
    updateCartDisplay();

    // Botão Checkout
    const checkoutBtn = document.getElementById('checkout-whatsapp-btn');
    if (checkoutBtn) {
        checkoutBtn.textContent = 'FINALIZAR E ENVIAR PARA ATENDIMENTO';
        checkoutBtn.onclick = window.processCheckoutLead;
    }

    // Modal Close
    const modal = document.getElementById('image-modal');
    if (modal) {
        document.querySelector('.close-btn').onclick = () => modal.style.display = 'none';
        window.onclick = (e) => { if(e.target === modal) modal.style.display = 'none'; };
    }

}); // FIM DO DOMCONTENTLOADED