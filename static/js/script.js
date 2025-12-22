/**
 * TAMMY'S STORE - CORE SCRIPT UNIFICADO
 * Versão: Full Stability & Anti-Crash (Corrigido erro linha 104)
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let selectedPayment = 'PIX';
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');

    // --- 🚀 INTERFACE E APRESENTAÇÃO (SPLASH SCREEN 2.5s) ---
    setTimeout(() => {
        if (splash) {
            splash.style.opacity = '0';
            splash.style.transform = 'translateY(-100%)';
            setTimeout(() => splash.remove(), 900);
        }
        if (heroCard) {
            setTimeout(() => heroCard.classList.add('show'), 400);
        }
    }, 2500); 

    // Header fixo ao rolar
    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) {
            window.scrollY > 60 ? header.classList.add('scrolled') : header.classList.remove('scrolled');
        }
    });

    // ✅ Função de URL Robusta: Usa placeholder externo para quebrar loops de erro 404
    const buildUrl = (path) => {
        if (!path) return 'https://placehold.co/400x600?text=Foto+Indisponivel'; 
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return cleanPath.startsWith('media/') ? '/' + cleanPath : '/media/' + cleanPath;
    };

    // --- 🛍️ CARREGAMENTO DE PRODUTOS (SITE E PDV) ---
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
                
                // Layout PDV Mobile
                if (document.getElementById('product-results')) {
                    return `
                    <div class="product-card" onclick="addToPOS(${p.id})">
                        <img src="${imgSource}" onerror="this.onerror=null; this.src='https://placehold.co/150x150?text=Sem+Foto';">
                        <h4>${p.name}</h4>
                        <p>R$ ${parseFloat(p.price).toFixed(2)}</p>
                    </div>`;
                }

                // Layout Boutique para Site
                return `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                        <img src="${imgSource}" 
                             alt="${p.name}" 
                             onerror="this.onerror=null; this.src='https://placehold.co/400x600?text=Foto+Indisponivel';">
                    </div>
                    <h3>${p.name}</h3>
                    <p style="color:#d4af37; font-weight:600;">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                    <button class="btn-gold-outline add-cart" data-id="${p.id}">ADICIONAR À SACOLA</button>
                </div>`;
            }).join('');

            // Ativa eventos para o Site
            document.querySelectorAll('.add-cart').forEach(b => b.onclick = (e) => {
                const prod = availableProducts[e.target.dataset.id];
                if (!prod) return;
                const exist = cart.find(i => i.id === prod.id);
                exist ? exist.quantity++ : cart.push({...prod, quantity: 1, price: parseFloat(prod.price)});
                localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                updateUI();
                alert("Peça reservada!");
            });
        } catch (e) { console.error("Erro de catálogo:", e); }
    }

    // --- 📝 GESTÃO DE SACOLA ---
    window.updateUI = () => {
        const cont = document.querySelector('.cart-items');
        if (!cont) return;
        let total = 0;
        cont.innerHTML = cart.map(item => {
            total += item.price * item.quantity;
            return `
            <div class="cart-item" style="display:flex; align-items:center; gap:15px; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <img src="${buildUrl(item.main_image)}" width="50" height="70" style="object-fit:cover;" onerror="this.onerror=null; this.style.display='none';">
                <div style="flex-grow:1;"><h4>${item.name}</h4><p>${item.quantity}x R$ ${item.price.toFixed(2)}</p></div>
                <button onclick="remove(${item.id})" style="color:red; background:none; border:none; cursor:pointer;">&times;</button>
            </div>`;
        }).join('') || '<p>Sua sacola está vazia.</p>';
        
        const totalDisp = document.getElementById('cart-total');
        if (totalDisp) totalDisp.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    };

    window.remove = (id) => {
        cart = cart.filter(i => i.id !== id);
        localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
        updateUI();
    };

    // ✅ CORREÇÃO CRÍTICA: Verifica se o botão existe antes de atribuir clique (Linha 104 fix)
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
                    body: JSON.stringify({
                        customer_info: { first_name: n, phone_number: p },
                        items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
                        origin: 'SITE'
                    })
                });
                if (res.ok) {
                    localStorage.removeItem('tammyClaraCart');
                    window.location.href = '/order-success/';
                }
            } catch (e) { alert("Erro ao processar pedido."); }
        };
    }

    // --- 🏦 LÓGICA DO PDV ---
    window.addToPOS = (id) => {
        const p = allProducts.find(i => i.id === id);
        if (!p) return;
        const exist = posCart.find(i => i.id === id);
        exist ? exist.quantity++ : posCart.push({...p, quantity: 1, price: parseFloat(p.price)});
        updatePOSUI();
    };

    window.updatePOSUI = () => {
        const cont = document.getElementById('pos-cart-items');
        if (!cont) return;
        cont.innerHTML = posCart.map(i => `
            <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee;">
                <span>${i.name} (${i.quantity}x)</span>
                <button onclick="removeFromPOS(${i.id})" style="color:red; background:none; border:none; cursor:pointer;">&times;</button>
            </div>`).join('') || '<p>Carrinho Vazio</p>';
        
        const sub = posCart.reduce((a, b) => a + (b.price * b.quantity), 0);
        const desc = parseFloat(document.getElementById('discount-input')?.value || 0) / 100;
        const total = sub * (1 - desc);
        
        if (document.getElementById('pos-subtotal')) document.getElementById('pos-subtotal').innerText = `R$ ${sub.toFixed(2)}`;
        if (document.getElementById('pos-total')) document.getElementById('pos-total').innerText = `R$ ${total.toFixed(2)}`;
    };

    window.removeFromPOS = (id) => {
        posCart = posCart.filter(i => i.id !== id);
        updatePOSUI();
    };

    window.finalizePosSale = async () => {
        if (!posCart.length) return alert("Carrinho vazio!");
        const payload = {
            customer_info: { 
                first_name: document.getElementById('client-name')?.value || "Cliente Balcão",
                phone_number: document.getElementById('client-phone')?.value 
            },
            items: posCart.map(i => ({ id: i.id, quantity: i.quantity })),
            payment_info: { method: selectedPayment },
            origin: 'POS'
        };
        try {
            const res = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value },
                body: JSON.stringify(payload)
            });
            if (res.ok) { alert("Venda realizada!"); posCart = []; updatePOSUI(); }
        } catch (e) { alert("Erro ao finalizar venda."); }
    };

    // --- 🎞️ GALERIA MODAL ---
    window.openGallery = (id) => {
        const p = availableProducts[id];
        if (!p) return;
        const imgs = [buildUrl(p.main_image), ...(p.images || []).map(i => buildUrl(i.image))];
        const modal = document.getElementById('image-modal');
        const mainImg = document.getElementById('modal-main-image');
        const thumbCont = document.getElementById('modal-thumbnails-container');

        if (modal && mainImg) {
            mainImg.src = imgs[0];
            if (thumbCont) {
                thumbCont.innerHTML = imgs.map((s, i) => `
                    <img src="${s}" class="modal-thumb ${i===0?'active':''}" 
                         onclick="document.getElementById('modal-main-image').src='${s}';
                                  document.querySelectorAll('.modal-thumb').forEach(t=>t.classList.remove('active'));
                                  this.classList.add('active');"
                         onerror="this.style.display='none'">`).join('');
            }
            modal.style.display = 'flex';
        }
    };

    const closeModal = document.querySelector('.close-modal');
    if (closeModal) closeModal.onclick = () => {
        const m = document.getElementById('image-modal');
        if (m) m.style.display = 'none';
    };

    loadProducts();
    updateUI();
});