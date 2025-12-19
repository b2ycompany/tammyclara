document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    // --- 🚀 INTERFACE UX (SPLASH SCREEN 6 SEGUNDOS) ---
    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');

    window.addEventListener('load', () => {
        setTimeout(() => {
            if (splash) {
                splash.style.opacity = '0';
                splash.style.transform = 'translateY(-100%)';
                setTimeout(() => { splash.style.visibility = 'hidden'; }, 1500);
            }
            document.body.style.opacity = '1';
            if (heroCard) setTimeout(() => heroCard.classList.add('show'), 800);
        }, 6000); // 6 segundos de apresentação para luxo total
    });

    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        window.scrollY > 80 ? header.classList.add('scrolled') : header.classList.remove('scrolled');
    });

    // --- 🛠️ SUPORTE MÍDIA ---
    const buildUrl = (p) => p ? (p.startsWith('http') ? p : `/media/${p.startsWith('/') ? p.substring(1) : p}`) : '/static/img/placeholder-produto.png';

    // --- 🛒 CARREGAMENTO ONE PAGE ---
    async function load() {
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
                    <h3 style="font-family:'Playfair Display'; font-size: 1.4rem; margin-top: 15px;">${p.name}</h3>
                    <p style="color: #d4af37; letter-spacing: 2px; margin-top: 10px;">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                    <button class="btn-gold-outline add-cart" data-id="${p.id}">ADICIONAR À SACOLA</button>
                </div>`;
            }).join('');

            document.querySelectorAll('.add-cart').forEach(b => b.onclick = (e) => {
                const p = availableProducts[e.target.dataset.id];
                const exist = cart.find(i => i.id === p.id);
                exist ? exist.quantity++ : cart.push({...p, quantity: 1, price: parseFloat(p.price)});
                localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                updateUI();
                alert("Peça adicionada à sua sacola.");
            });
        } catch (e) { console.error(e); }
    }

    // --- 📝 CHECKOUT ADMIN ---
    window.updateUI = () => {
        const cont = document.querySelector('.cart-items');
        if (!cont) return;
        let total = 0;
        cont.innerHTML = cart.map(i => {
            total += i.price * i.quantity;
            return `
            <div class="cart-item">
                <img src="${buildUrl(i.main_image)}" width="80" height="110" style="object-fit: cover;">
                <div style="flex-grow: 1;">
                    <h4 style="font-family:'Playfair Display';">${i.name}</h4>
                    <p style="font-size: 0.8rem; opacity: 0.5;">${i.quantity} unidade(s)</p>
                </div>
                <div style="text-align: right;">
                    <p>R$ ${(i.price * i.quantity).toFixed(2)}</p>
                    <button onclick="remove(${i.id})" style="color:red; background:none; border:none; cursor:pointer; font-size: 0.7rem; margin-top: 10px;">REMOVER</button>
                </div>
            </div>`;
        }).join('') || '<p style="text-align:center; padding: 40px; opacity: 0.5;">Sua sacola está vazia.</p>';
        document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    };

    window.remove = (id) => {
        cart = cart.filter(i => i.id !== id);
        localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
        updateUI();
    };

    const checkout = document.getElementById('checkout-admin-btn');
    if (checkout) {
        checkout.onclick = async () => {
            if (!cart.length) return alert("Sua sacola está vazia.");
            const n = prompt("Nome completo:"), p = prompt("WhatsApp (DDD):");
            if (!n || !p) return alert("Nome e WhatsApp são necessários.");

            const res = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value },
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
        };
    }

    // --- 🎞️ GALERIA ---
    window.openGallery = (id) => {
        const p = availableProducts[id];
        const imgs = [buildUrl(p.main_image), ...(p.images || []).map(i => buildUrl(i.image))];
        const modal = document.getElementById('image-modal');
        document.getElementById('modal-main-image').src = imgs[0];
        document.getElementById('modal-thumbnails-container').innerHTML = imgs.map((s, i) => `<img src="${s}" class="modal-thumb ${i===0?'active':''}" onclick="document.getElementById('modal-main-image').src='${s}'; document.querySelectorAll('.modal-thumb').forEach(t=>t.classList.remove('active')); this.classList.add('active');" style="width:70px; height:90px; object-fit:cover; cursor:pointer; border:1px solid #444;">`).join('');
        modal.style.display = 'flex';
    };

    document.querySelector('.close-modal').onclick = () => document.getElementById('image-modal').style.display = 'none';

    load();
    updateUI();
});