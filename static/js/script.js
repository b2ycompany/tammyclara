/**
 * TAMMY'S STORE - SISTEMA UNIFICADO (BOUTIQUE & PDV)
 * Versão Final: Anti-Crash e Responsiva
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let selectedPayment = 'PIX';
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    // --- 🚀 1. INTERFACE E APRESENTAÇÃO (SPLASH SCREEN) ---
    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');

    // Tempo profissional de Splash (2.5 segundos)
    setTimeout(() => {
        if (splash) {
            splash.style.opacity = '0';
            splash.style.transform = 'translateY(-100%)';
            setTimeout(() => splash.remove(), 900);
        }
        if (heroCard) setTimeout(() => heroCard.classList.add('show'), 400);
    }, 2500); 

    // Header fixo ao rolar
    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) {
            window.scrollY > 60 ? header.classList.add('scrolled') : header.classList.remove('scrolled');
        }
    });

    // Helper: Construção de URL de Mídia
    const buildUrl = (p) => p ? (p.startsWith('http') ? p : `/media/${p.startsWith('/') ? p.substring(1) : p}`) : '/static/img/placeholder-produto.png';

    // --- 🛒 2. CARREGAMENTO DE PRODUTOS (UNIFICADO) ---
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
                const imgUrl = buildUrl(p.main_image);
                
                // Layout PDV Responsivo
                if (document.getElementById('product-results')) {
                    return `
                    <div class="product-card" onclick="addToPOS(${p.id})">
                        <img src="${imgUrl}" onerror="this.src='/static/img/placeholder-produto.png'">
                        <h4>${p.name}</h4>
                        <p>R$ ${parseFloat(p.price).toFixed(2)}</p>
                    </div>`;
                }

                // Layout Boutique Site
                return `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                        <img src="${imgUrl}" onerror="this.src='/static/img/placeholder-produto.png'" alt="${p.name}">
                    </div>
                    <h3>${p.name}</h3>
                    <p style="color:#d4af37; font-weight:600;">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                    <button class="btn-gold-outline add-cart" data-id="${p.id}">ADICIONAR</button>
                </div>`;
            }).join('');

            // Ativa eventos de clique para o site
            document.querySelectorAll('.add-cart').forEach(b => b.onclick = (e) => {
                const prod = availableProducts[e.target.dataset.id];
                const exist = cart.find(i => i.id === prod.id);
                exist ? exist.quantity++ : cart.push({...prod, quantity: 1, price: parseFloat(prod.price)});
                localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                updateUI();
                alert("Peça reservada na sacola!");
            });
        } catch (e) { console.error("Falha ao carregar catálogo:", e); }
    }

    // --- 📝 3. SACOLA E CHECKOUT BOUTIQUE (ADMIN) ---
    window.updateUI = () => {
        const cont = document.querySelector('.cart-items');
        if (!cont) return;
        let total = 0;
        cont.innerHTML = cart.map(item => {
            total += item.price * item.quantity;
            return `<div style="display:flex; gap:15px; margin-bottom:15px; align-items:center;">
                <img src="${buildUrl(item.main_image)}" width="50" height="70" style="object-fit:cover;">
                <div style="flex-grow:1;"><h4>${item.name}</h4><p>${item.quantity}x R$ ${item.price.toFixed(2)}</p></div>
                <button onclick="remove(${item.id})" style="color:red; background:none; border:none; cursor:pointer;">×</button>
            </div>`;
        }).join('') || '<p>Sacola vazia.</p>';
        const totalDisp = document.getElementById('cart-total');
        if (totalDisp) totalDisp.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    };

    window.remove = (id) => {
        cart = cart.filter(i => i.id !== id);
        localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
        updateUI();
    };

    // ✅ CORREÇÃO CRÍTICA: Segurança contra null no botão de checkout
    const checkoutBtn = document.getElementById('checkout-admin-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            if (!cart.length) return alert("Sacola vazia.");
            const n = prompt("Nome:"), p = prompt("WhatsApp:");
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
                if (res.ok) { localStorage.removeItem('tammyClaraCart'); window.location.href = '/order-success/'; }
            } catch (e) { alert("Erro ao processar pedido."); }
        };
    }

    // --- 🏦 4. LÓGICA DO PDV (PONTO DE VENDA) ---
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
                <button onclick="removeFromPOS(${i.id})" style="color:red; background:none; border:none; cursor:pointer;">×</button>
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

    window.setPayment = (type, btn) => {
        selectedPayment = type;
        document.querySelectorAll('.payment-option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
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
            if (res.ok) { alert("Venda realizada e estoque atualizado!"); posCart = []; updatePOSUI(); }
        } catch (e) { alert("Erro ao finalizar venda."); }
    };

    window.searchCustomerByPhone = async () => {
        const phone = document.getElementById('client-phone')?.value;
        if(!phone) return alert("Digite um WhatsApp.");
        try {
            const res = await fetch(`${API_BASE_URL}/customer/search/${phone}/`);
            if (res.ok) {
                const data = await res.json();
                document.getElementById('client-name').value = data.first_name;
                alert("Cliente localizado!");
            } else { alert("Cliente não encontrado."); }
        } catch (e) { console.log("Erro busca cliente"); }
    };

    // --- 🎞️ 5. GALERIA DE IMAGENS ---
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
                                  this.classList.add('active');">`).join('');
            }
            modal.style.display = 'flex';
        }
    };

    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) closeBtn.onclick = () => {
        const m = document.getElementById('image-modal');
        if (m) m.style.display = 'none';
    };

    // --- 🔃 6. INICIALIZAÇÃO ---
    loadProducts();
    updateUI();
    updatePOSUI();
});