/**
 * TAMMY'S STORE - SISTEMA UNIFICADO
 * Versão Corrigida: Fim do Looping de Erros e Carregamento Admin
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');

    // ✅ Splash profissional de 2.5 segundos
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

    // ✅ Função de auxílio de mídia para garantir o caminho /media/
    const buildUrl = (path) => {
        if (!path) return ''; 
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        // Garante que o caminho aponte para a pasta de mídias do Django
        return cleanPath.startsWith('media/') ? '/' + cleanPath : '/media/' + cleanPath;
    };

    // --- CARREGAMENTO DO CATÁLOGO ---
    async function loadProducts() {
        const cont = document.getElementById('products-container');
        if (!cont) return;
        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            if (!res.ok) throw new Error("API Offline");
            const products = await res.json();
            
            cont.innerHTML = products.map(p => {
                availableProducts[p.id] = p;
                const imgSource = buildUrl(p.main_image);
                
                return `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                        <img src="${imgSource}" 
                             alt="${p.name}" 
                             onerror="this.onerror=null; this.src=''; this.parentNode.innerHTML='<div style=\'padding:60px 20px; color:#999; font-size:0.7rem; background:#f0f0f0;\'>IMAGEM NÃO DISPONÍVEL NO SERVIDOR</div>';">
                    </div>
                    <h3 style="font-family:'Playfair Display'; margin-top:15px; font-size: 1.2rem;">${p.name}</h3>
                    <p style="color:#d4af37; font-weight:600; margin-top:10px;">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                    <button class="btn-gold-outline add-cart" data-id="${p.id}">ADICIONAR À SACOLA</button>
                </div>`;
            }).join('');

            // Ativar botões de compra
            document.querySelectorAll('.add-cart').forEach(b => b.onclick = (e) => {
                const p = availableProducts[e.target.dataset.id];
                const exist = cart.find(i => i.id === p.id);
                exist ? exist.quantity++ : cart.push({...p, quantity: 1, price: parseFloat(p.price)});
                localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                updateCartUI();
                alert("Adicionado com sucesso!");
            });
        } catch (e) { console.error("Erro no catálogo:", e); }
    }

    // --- SACOLA / CARRINHO ---
    window.updateCartUI = () => {
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
                <button onclick="remove(${item.id})" style="color:red; background:none; border:none; cursor:pointer; font-size: 1.2rem;">&times;</button>
            </div>`;
        }).join('') || '<p style="text-align:center; opacity:0.5; padding: 20px;">Sua sacola está vazia.</p>';
        
        if (totalDisp) totalDisp.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    };

    window.remove = (id) => {
        cart = cart.filter(i => i.id !== id);
        localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
        updateCartUI();
    };

    // --- CHECKOUT ADMIN (LEADS) ---
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
                    localStorage.removeItem('tammyClaraCart');
                    window.location.href = '/order-success/';
                }
            } catch (e) { alert("Erro ao processar reserva."); }
        };
    }

    // --- GALERIA MODAL ---
    window.openGallery = (id) => {
        const p = availableProducts[id];
        if (!p) return;
        const imgs = [buildUrl(p.main_image), ...(p.images || []).map(i => buildUrl(i.image))];
        const modal = document.getElementById('image-modal');
        const modalMain = document.getElementById('modal-main-image');
        
        if (modal && modalMain) {
            modalMain.src = imgs[0];
            document.getElementById('modal-thumbnails-container').innerHTML = imgs.map((s, i) => `
                <img src="${s}" class="modal-thumb ${i===0?'active':''}" 
                     onclick="document.getElementById('modal-main-image').src='${s}';
                              document.querySelectorAll('.modal-thumb').forEach(t=>t.classList.remove('active'));
                              this.classList.add('active');"
                     onerror="this.style.display='none'">`).join('');
            modal.style.display = 'flex';
        }
    };

    const closeModal = document.querySelector('.close-modal');
    if (closeModal) closeModal.onclick = () => { document.getElementById('image-modal').style.display = 'none'; };

    loadProducts();
    updateCartUI();
});