/**
 * TAMMY'S STORE - CORE SCRIPT UNIFICADO
 * Versão: Full-Time Stability, Anti-Looping & PDV Mobile
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURAÇÕES E ESTADO GERAL ---
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let selectedPayment = 'PIX';
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');

    // --- 2. 🚀 INTERFACE E APRESENTAÇÃO (SPLASH SCREEN 2.5s) ---
    // ✅ Splash profissional que não bloqueia a renderização do site
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

    // Efeito de Header ao rolar
    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) {
            window.scrollY > 60 ? header.classList.add('scrolled') : header.classList.remove('scrolled');
        }
    });

    // ✅ Função de URL Robusta: Resolve o erro 404 e evita looping infinito
    const buildUrl = (path) => {
        if (!path) return 'https://placehold.co/400x600?text=Foto+Indisponivel'; 
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return cleanPath.startsWith('media/') ? '/' + cleanPath : '/media/' + cleanPath;
    };

    // --- 3. 🛍️ CARREGAMENTO DE PRODUTOS (SITE E PDV) ---
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
                
                // Layout Responsivo para PDV Mobile
                if (document.getElementById('product-results')) {
                    return `
                    <div class="product-card" onclick="addToPOS(${p.id})" style="padding: 10px; cursor: pointer; border: 1px solid #eee; border-radius: 8px;">
                        <img src="${imgSource}" onerror="this.onerror=null; this.src='https://placehold.co/150x150?text=Sem+Foto';" style="height: 120px; width: 100%; object-fit: cover; border-radius: 4px;">
                        <h4 style="font-size: 0.8rem; margin: 5px 0;">${p.name}</h4>
                        <p style="color:#d4af37; font-weight:700;">R$ ${parseFloat(p.price).toFixed(2)}</p>
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
                    <h3 style="font-family:'Playfair Display'; margin-top:15px; font-size: 1.2rem;">${p.name}</h3>
                    <p style="color:#d4af37; font-weight:600; margin-top:10px;">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                    <button class="btn-gold-outline add-cart" data-id="${p.id}">ADICIONAR À SACOLA</button>
                </div>`;
            }).join('');

            // Ativa eventos de clique para o Site
            document.querySelectorAll('.add-cart').forEach(b => b.onclick = (e) => {
                const prod = availableProducts[e.target.dataset.id];
                if (!prod) return;
                const exist = cart.find(i => i.id === prod.id);
                exist ? exist.quantity++ : cart.push({...prod, quantity: 1, price: parseFloat(prod.price)});
                localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                updateUI();
                alert("Peça adicionada à sua sacola!");
            });
        } catch (e) { console.error("Erro ao carregar produtos:", e); }
    }

    // --- 4. 📝 GESTÃO DE SACOLA E CHECKOUT ADMIN ---
    window.updateUI = () => {
        const cont = document.querySelector('.cart-items');
        const totalDisp = document.getElementById('cart-total');
        if (!cont) return;

        let total = 0;
        cont.innerHTML = cart.map(item => {
            total += item.price * item.quantity;
            return `
            <div class="cart-item" style="display:flex; align-items:center; gap:15px; margin-bottom:15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <img src="${buildUrl(item.main_image)}" width="60" height="80" style="object-fit:cover;" onerror="this.onerror=null; this.style.display='none';">
                <div style="flex-grow:1;">
                    <h4 style="font-family:'Playfair Display'; font-size:0.9rem;">${item.name}</h4>
                    <p style="font-size:0.7rem; opacity:0.5;">${item.quantity} un.</p>
                </div>
                <div style="text-align: right;">
                    <p style="font-size:0.9rem; font-weight:600;">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                    <button onclick="remove(${item.id})" style="color:red; background:none; border:none; cursor:pointer; font-size: 0.8rem; margin-top: 5px;">Remover</button>
                </div>
            </div>`;
        }).join('') || '<p style="text-align:center; opacity:0.5; padding: 20px;">Sua sacola está vazia.</p>';
        
        if (totalDisp) totalDisp.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    };

    window.remove = (id) => {
        cart = cart.filter(i => i.id !== id);
        localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
        updateUI();
    };

    // ✅ Segurança: Só configura checkout se o botão existir (Evita erro null no PDV)
    const checkoutBtn = document.getElementById('checkout-admin-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            if (!cart.length) return alert("Sua sacola está vazia.");
            const n = prompt("Nome completo:"), p = prompt("WhatsApp (DDD):");
            if (!n || !p) return alert("Dados obrigatórios para prosseguir.");

            checkoutBtn.disabled = true;
            checkoutBtn.innerText = "PROCESSANDO...";

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
                    const data = await res.json();
                    localStorage.removeItem('tammyClaraCart');
                    window.location.href = `/order-success/?id=${data.sale_id}`;
                } else { throw new Error("Erro servidor"); }
            } catch (e) { 
                alert("Falha na rede. Tente confirmar novamente."); 
                checkoutBtn.disabled = false;
                checkoutBtn.innerText = "CONFIRMAR PEDIDO";
            }
        };
    }

    // --- 5. 🏦 LÓGICA DO PDV (MOBILE) ---
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
                <span style="font-size:0.85rem;">${i.name} (${i.quantity}x)</span>
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
            if (res.ok) { alert("Venda Finalizada!"); posCart = []; updatePOSUI(); }
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

    // --- 6. 🎞️ GALERIA MODAL ---
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

    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            const m = document.getElementById('image-modal');
            if (m) m.style.display = 'none';
        };
    }

    // --- 7. INICIALIZAÇÃO ---
    loadProducts();
    updateUI();
    updatePOSUI();
});