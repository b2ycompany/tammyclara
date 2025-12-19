/**
 * TAMMY'S STORE - SISTEMA UNIFICADO (ONE PAGE + PDV)
 * Versão: Boutique Luxury Final (Sem Abreviações)
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CONFIGURAÇÕES E ESTADO GLOBAL ---
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    // --- 2. 🚀 INTERFACE E SPLASH SCREEN (8 SEGUNDOS) ---
    const handleInterface = () => {
        const splash = document.getElementById('splash-screen');
        const heroCard = document.getElementById('heroCard');
        const mainHeader = document.getElementById('main-header');

        // Apresentação lenta de 8 segundos para luxo total
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (splash) {
                    splash.style.opacity = '0';
                    splash.style.transform = 'translateY(-100%)';
                    setTimeout(() => { splash.style.visibility = 'hidden'; }, 1500);
                }
                // Mostra o corpo do site suavemente
                document.body.style.opacity = '1';
                document.body.style.overflow = 'auto';
                
                if (heroCard) {
                    setTimeout(() => heroCard.classList.add('show'), 800);
                }
            }, 8000); 
        });

        // Efeito do Menu ao rolar
        window.addEventListener('scroll', () => {
            if (mainHeader) {
                window.scrollY > 80 ? mainHeader.classList.add('scrolled') : mainHeader.classList.remove('scrolled');
            }
        });
    };

    // --- 3. 🛠️ FUNÇÕES DE APOIO ---
    function buildUrl(path) {
        if (!path) return '/static/img/placeholder-produto.png';
        if (path.startsWith('http')) return path;
        const cleaned = path.startsWith('/') ? path.substring(1) : path;
        return '/media/' + cleaned;
    }

    const getCsrf = () => document.querySelector('[name=csrfmiddlewaretoken]')?.value;

    // --- 4. 🛒 CARREGAMENTO DA COLEÇÃO ONE PAGE ---
    async function loadContent() {
        const container = document.getElementById('products-container');
        if (!container) return;

        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            if (!res.ok) throw new Error("Erro API");
            const products = await res.json();
            allProducts = products;

            container.innerHTML = products.map(p => {
                availableProducts[p.id] = p;
                return `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                        <img src="${buildUrl(p.main_image)}" alt="${p.name}">
                    </div>
                    <div class="product-info">
                        <h3 style="font-family:'Playfair Display'; font-size: 1.4rem; margin-top:15px;">${p.name}</h3>
                        <p style="color:#d4af37; letter-spacing:2px; font-weight:600; margin-top:10px;">
                            R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}
                        </p>
                        <button class="btn-gold-outline add-to-cart-btn" data-id="${p.id}" style="width:100%;">
                            ADICIONAR À SACOLA
                        </button>
                    </div>
                </div>`;
            }).join('');

            // Ativa os botões de compra
            document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
                btn.onclick = (e) => {
                    const id = e.target.dataset.id;
                    const p = availableProducts[id];
                    if (!p) return;
                    const exist = cart.find(i => i.id === p.id);
                    if (exist) {
                        exist.quantity++;
                    } else {
                        cart.push({ ...p, quantity: 1, price: parseFloat(p.price) });
                    }
                    localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                    updateCartUI();
                    alert("Peça reservada com sucesso!");
                };
            });
        } catch (e) { console.error("Erro no catálogo:", e); }
    }

    // --- 5. 🎞️ MODAL DE GALERIA ---
    window.openGallery = (id) => {
        const p = availableProducts[id];
        if (!p) return;
        const images = [buildUrl(p.main_image), ...(p.images || []).map(i => buildUrl(i.image))];
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('modal-main-image');
        const thumbs = document.getElementById('modal-thumbnails-container');

        if (modal && modalImg) {
            modalImg.src = images[0];
            if (thumbs) {
                thumbs.innerHTML = images.map((src, i) => `
                    <img src="${src}" class="modal-thumb ${i===0?'active':''}" 
                         onclick="document.getElementById('modal-main-image').src='${src}';
                                  document.querySelectorAll('.modal-thumb').forEach(t=>t.classList.remove('active'));
                                  this.classList.add('active');">
                `).join('');
            }
            modal.style.display = 'flex';
        }
    };

    // Fechar Modal
    const closeBtn = document.querySelector('.close-modal') || document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.onclick = () => { document.getElementById('image-modal').style.display = 'none'; };
    }

    // --- 6. 📝 CHECKOUT PARA O ADMIN (LEADS) ---
    window.updateCartUI = () => {
        const cont = document.querySelector('.cart-items');
        const totalDisp = document.getElementById('cart-total');
        if (!cont) return;

        let total = 0;
        cont.innerHTML = cart.map(item => {
            const sub = item.price * item.quantity;
            total += sub;
            return `
            <div class="cart-item">
                <img src="${buildUrl(item.main_image)}" width="80" height="110" style="object-fit:cover;">
                <div style="flex-grow:1; padding:0 20px;">
                    <h4 style="font-family:'Playfair Display';">${item.name}</h4>
                    <p style="font-size:0.8rem; opacity:0.5;">${item.quantity} un.</p>
                </div>
                <div style="text-align:right;">
                    <p style="font-weight:600;">R$ ${sub.toFixed(2).replace('.', ',')}</p>
                    <button onclick="remove(${item.id})" style="color:red; background:none; border:none; cursor:pointer; font-size:0.7rem;">REMOVER</button>
                </div>
            </div>`;
        }).join('') || '<p style="text-align:center; padding:40px; opacity:0.5;">Sua sacola está vazia.</p>';
        
        if (totalDisp) totalDisp.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    };

    window.remove = (id) => {
        cart = cart.filter(i => i.id !== id);
        localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
        updateCartUI();
    };

    const checkoutBtn = document.getElementById('checkout-admin-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            if (cart.length === 0) return alert("Sua sacola está vazia.");
            const n = prompt("Nome completo:"), p = prompt("WhatsApp (DDD):");
            if (!n || !p) return alert("Dados obrigatórios.");

            try {
                const res = await fetch(`${API_BASE_URL}/checkout/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrf() },
                    body: JSON.stringify({
                        customer_info: { first_name: n, phone_number: p, email: "" },
                        items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
                        origin: 'SITE'
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    localStorage.removeItem('tammyClaraCart');
                    window.location.href = `/order-success/?id=${data.sale_id}`;
                }
            } catch (e) { alert("Erro ao processar pedido."); }
        };
    }

    // --- 🔃 INICIALIZAÇÃO ---
    handleInterface();
    loadContent();
    updateCartUI();
});