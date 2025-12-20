document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

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

    const buildUrl = (p) => p ? (p.startsWith('http') ? p : `/media/${p.startsWith('/') ? p.substring(1) : p}`) : '/static/img/placeholder-produto.png';

    async function loadProducts() {
        const cont = document.getElementById('products-container');
        if (!cont) return;
        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            const products = await res.json();
            cont.innerHTML = products.map(p => {
                availableProducts[p.id] = p;
                return `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                        <img src="${buildUrl(p.main_image)}" alt="${p.name}">
                    </div>
                    <h3>${p.name}</h3>
                    <p style="color:#d4af37; font-weight:600;">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                    <button class="btn-gold-outline add-cart" data-id="${p.id}">ADICIONAR</button>
                </div>`;
            }).join('');

            document.querySelectorAll('.add-cart').forEach(b => b.onclick = (e) => {
                const p = availableProducts[e.target.dataset.id];
                const exist = cart.find(i => i.id === p.id);
                exist ? exist.quantity++ : cart.push({...p, quantity: 1, price: parseFloat(p.price)});
                localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                updateUI();
            });
        } catch (e) { console.error(e); }
    }

    window.updateUI = () => {
        const cont = document.querySelector('.cart-items');
        if (!cont) return;
        let total = 0;
        cont.innerHTML = cart.map(item => {
            total += item.price * item.quantity;
            return `<div style="display:flex; gap:15px; margin-bottom:15px; align-items:center;">
                <img src="${buildUrl(item.main_image)}" width="50">
                <div style="flex-grow:1;"><h4>${item.name}</h4><p>${item.quantity}x R$ ${item.price.toFixed(2)}</p></div>
                <button onclick="remove(${item.id})" style="color:red; background:none; border:none;">Remover</button>
            </div>`;
        }).join('') || '<p>Vazio</p>';
        document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    };

    window.remove = (id) => {
        cart = cart.filter(i => i.id !== id);
        localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
        updateUI();
    };

    const checkoutBtn = document.getElementById('checkout-admin-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            if (!cart.length) return alert("Sacola vazia.");
            const n = prompt("Nome:"), p = prompt("WhatsApp:");
            if (!n || !p) return alert("Dados obrigatórios.");
            const res = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value },
                body: JSON.stringify({
                    customer_info: { first_name: n, phone_number: p, email: "" },
                    items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
                    origin: 'SITE'
                })
            });
            if (res.ok) { localStorage.removeItem('tammyClaraCart'); window.location.href = '/order-success/'; }
        };
    }

    window.openGallery = (id) => {
        const p = availableProducts[id];
        const imgs = [buildUrl(p.main_image), ...(p.images || []).map(i => buildUrl(i.image))];
        const modal = document.getElementById('image-modal');
        document.getElementById('modal-main-image').src = imgs[0];
        document.getElementById('modal-thumbnails-container').innerHTML = imgs.map(s => `<img src="${s}" style="width:50px; cursor:pointer;" onclick="document.getElementById('modal-main-image').src='${s}'">`).join('');
        modal.style.display = 'flex';
    };

    document.querySelector('.close-modal').onclick = () => document.getElementById('image-modal').style.display = 'none';

    loadProducts();
    updateUI();
});