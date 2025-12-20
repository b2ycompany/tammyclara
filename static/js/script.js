/**
 * TAMMY'S STORE - SISTEMA ONE PAGE BOUTIQUE
 * Código Completo 100% íntegro - Splash Screen 10s
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    // --- 🚀 INTERFACE LUXO (10 SEGUNDOS) ---
    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');
    const mainBody = document.body;

    window.addEventListener('load', () => {
        // Delay estendido para 10 segundos para luxo total e carregamento mobile
        setTimeout(() => {
            if (splash) {
                splash.style.opacity = '0';
                splash.style.transform = 'translateY(-100%)';
                setTimeout(() => { splash.style.visibility = 'hidden'; }, 1800);
            }
            if (mainBody) mainBody.style.opacity = '1';
            if (heroCard) setTimeout(() => heroCard.classList.add('show'), 1000);
        }, 10000); 
    });

    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) {
            window.scrollY > 60 ? header.classList.add('scrolled') : header.classList.remove('scrolled');
        }
    });

    // --- 🛠️ SUPORTE MÍDIA ---
    const buildUrl = (p) => p ? (p.startsWith('http') ? p : `/media/${p.startsWith('/') ? p.substring(1) : p}`) : '/static/img/placeholder-produto.png';

    // --- 🛒 CARREGAMENTO DINÂMICO ---
    async function loadProducts() {
        const cont = document.getElementById('products-container');
        if (!cont) return;
        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            if (!res.ok) throw new Error("API Offline");
            const products = await res.json();
            
            cont.innerHTML = products.map(p => {
                availableProducts[p.id] = p;
                return `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                        <img src="${buildUrl(p.main_image)}" alt="${p.name}">
                    </div>
                    <h3 style="font-family:'Playfair Display'; margin-top:15px;">${p.name}</h3>
                    <p style="color:#d4af37; font-weight:600; margin:10px 0;">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                    <button class="btn-gold-outline add-cart" data-id="${p.id}">ADICIONAR À SACOLA</button>
                </div>`;
            }).join('');

            document.querySelectorAll('.add-cart').forEach(b => b.onclick = (e) => {
                const p = availableProducts[e.target.dataset.id];
                const exist = cart.find(i => i.id === p.id);
                exist ? exist.quantity++ : cart.push({...p, quantity: 1, price: parseFloat(p.price)});
                localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                updateCartUI();
                alert("Peça reservada com sucesso!");
            });
        } catch (e) { console.error(e); }
    }

    // --- 📝 CHECKOUT ADMIN (LEADS) ---
    window.updateCartUI = () => {
        const cont = document.querySelector('.cart-items');
        const totalDisp = document.getElementById('cart-total');
        if (!cont) return;

        let total = 0;
        cont.innerHTML = cart.map(item => {
            total += item.price * item.quantity;
            return `
            <div class="cart-item">
                <img src="${buildUrl(item.main_image)}" width="60" height="80" style="object-fit:cover;">
                <div style="flex-grow:1;">
                    <h4 style="font-family:'Playfair Display'; font-size:0.9rem;">${item.name}</h4>
                    <p style="font-size:0.7rem; opacity:0.5;">${item.quantity} un.</p>
                </div>
                <div style="text-align:right;">
                    <p style="font-size:0.9rem;">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                    <button onclick="remove(${item.id})" style="color:red; background:none; border:none; cursor:pointer; font-size:0.6rem; margin-top:5px;">REMOVER</button>
                </div>
            </div>`;
        }).join('') || '<p style="text-align:center; padding:30px; opacity:0.5;">Sacola vazia.</p>';
        
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
            if (!cart.length) return alert("Sua sacola está vazia.");
            const n = prompt("Nome completo:"), p = prompt("WhatsApp (DDD):");
            if (!n || !p) return alert("Dados obrigatórios.");

            try {
                const res = await fetch(`${API_BASE_URL}/checkout/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value },
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
            } catch (e) { alert("Erro ao processar lead."); }
        };
    }

    // --- 🎞️ GALERIA MODAL ---
    window.openGallery = (id) => {
        const p = availableProducts[id];
        if (!p) return;
        const imgs = [buildUrl(p.main_image), ...(p.images || []).map(i => buildUrl(i.image))];
        const modal = document.getElementById('image-modal');
        document.getElementById('modal-main-image').src = imgs[0];
        document.getElementById('modal-thumbnails-container').innerHTML = imgs.map((s, i) => `
            <img src="${s}" class="modal-thumb ${i===0?'active':''}" 
                 onclick="document.getElementById('modal-main-image').src='${s}';
                          document.querySelectorAll('.modal-thumb').forEach(t=>t.classList.remove('active'));
                          this.classList.add('active');">`).join('');
        modal.style.display = 'flex';
    };

    const closeModal = document.querySelector('.close-modal');
    if (closeModal) closeModal.onclick = () => { document.getElementById('image-modal').style.display = 'none'; };

    loadProducts();
    updateCartUI();
});