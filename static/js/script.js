/**
 * TAMMY'S STORE - CORE V12 (DEFINITIVO)
 * Funcionalidades: Splash Original, CRM Multibusca, Máscaras, Galeria e PDV
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let allProducts = [], posCart = [], selectedPayment = 'PIX';
    let availableProducts = {};
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];
    let currentGalleryImages = [];
    let currentImageIndex = 0;

    // --- 🚀 INTERFACE: SPLASH E HERO CARD ORIGINAIS ---
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            splash.style.transform = 'translateY(-100%)';
            setTimeout(() => splash.remove(), 900);
        }
        const hero = document.getElementById('heroCard');
        if (hero) hero.classList.add('show');
    }, 2500); 

    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) window.scrollY > 60 ? header.classList.add('scrolled') : header.classList.remove('scrolled');
    });

    // --- 🛠️ MÁSCARAS CRM (PADRONIZAÇÃO DE DADOS) ---
    const applyMask = (val, pattern) => {
        let i = 0, v = val.replace(/\D/g, "");
        return pattern.replace(/#/g, () => v[i++] || "");
    };

    const setupInputs = () => {
        const cpfField = document.getElementById('client-cpf');
        const telField = document.getElementById('client-phone');
        if (cpfField) {
            cpfField.oninput = (e) => {
                e.target.value = applyMask(e.target.value, "###.###.###-##").substring(0, 14);
            };
        }
        if (telField) {
            telField.oninput = (e) => {
                const r = e.target.value.replace(/\D/g, "");
                const p = r.length <= 10 ? "(##) ####-####" : "(##) #####-####";
                e.target.value = applyMask(e.target.value, p).substring(0, 15);
            };
        }
    };

    // --- 🛒 CARREGAMENTO DIFERENCIADO (BOUTIQUE VS PDV) ---
    window.loadProducts = async () => {
        const container = document.getElementById('products-container') || document.getElementById('product-results');
        if (!container) return;

        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            const products = await res.json();
            allProducts = products;
            
            container.innerHTML = products.map(p => {
                availableProducts[p.id] = p;
                const img = p.main_image ? (p.main_image.startsWith('http') ? p.main_image : '/media/'+p.main_image) : 'https://placehold.co/400x600';
                
                // LAYOUT PDV (Imagens Pequenas em Grid)
                if (document.getElementById('product-results')) {
                    return `
                    <div class="product-card-pos" onclick="addToPOS(${p.id})">
                        <img src="${img}" class="img-pos">
                        <h4 style="margin:5px 0; font-size:0.8rem;">${p.name}</h4>
                        <p style="color:#d4af37; font-weight:700;">R$ ${parseFloat(p.price).toFixed(2)}</p>
                    </div>`;
                }
                
                // LAYOUT BOUTIQUE (Imagens Grandes 3:4)
                return `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="openGallery(${p.id})">
                        <img src="${img}" alt="${p.name}">
                    </div>
                    <div class="info-content">
                        <h3 style="font-family:'Playfair Display'; margin-top:10px;">${p.name}</h3>
                        <p style="color:#d4af37; font-weight:600; margin:10px 0;">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button class="btn-gold-outline add-cart" data-id="${p.id}">ADICIONAR À SACOLA</button>
                </div>`;
            }).join('');

            // Ativar botões da Boutique
            document.querySelectorAll('.add-cart').forEach(b => b.onclick = (e) => {
                const prod = availableProducts[e.target.dataset.id];
                const exist = cart.find(i => i.id === prod.id);
                exist ? exist.quantity++ : cart.push({...prod, quantity: 1, price: parseFloat(prod.price)});
                localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
                updateUI();
                alert("Adicionado!");
            });
        } catch (e) { console.error("Erro Catálogo:", e); }
    };

    // --- 👥 CRM: BUSCA MULTI-DADOS ---
    window.searchCustomer = async () => {
        const q = document.getElementById('client-search-input')?.value.replace(/\D/g, "");
        if (!q) return alert("Informe Nome, CPF ou Telefone.");
        try {
            const res = await fetch(`${API_BASE_URL}/customer/search/${q}/`);
            if (res.ok) {
                const d = await res.json();
                document.getElementById('client-name').value = d.first_name || '';
                document.getElementById('client-phone').value = d.phone_number || '';
                document.getElementById('client-cpf').value = d.cpf || '';
                document.getElementById('client-birth').value = d.birth_date || '';
                alert("Cliente localizado no CRM!");
            } else { alert("Cliente não encontrado."); }
        } catch (e) { console.error("Erro CRM:", e); }
    };

    // --- 🎞️ GALERIA NAVEGÁVEL ---
    window.openGallery = (id) => {
        const p = availableProducts[id];
        if (!p) return;
        currentGalleryImages = [p.main_image, ...(p.images || []).map(i => i.image)].map(path => 
            path.startsWith('http') ? path : '/media/' + path
        );
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
        if (main) main.src = currentGalleryImages[currentImageIndex];
        const thumbs = document.getElementById('modal-thumbnails-container');
        if (thumbs) {
            thumbs.innerHTML = currentGalleryImages.map((src, i) => `
                <img src="${src}" class="modal-thumb ${i === currentImageIndex ? 'active' : ''}" onclick="jumpToImage(${i})">
            `).join('');
        }
    }

    window.jumpToImage = (i) => { currentImageIndex = i; updateGalleryUI(); };
    window.closeGallery = () => { 
        document.getElementById('image-modal').style.display = 'none'; 
        document.body.style.overflow = 'auto'; 
    };

    // --- 🏦 PDV: VENDAS ---
    window.setPayment = (method, btn) => {
        selectedPayment = method;
        document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };

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
            <div class="cart-row">
                <span>${i.name} (x${i.quantity})</span>
                <span>R$ ${(i.price * i.quantity).toFixed(2)}</span>
            </div>`).join('') || 'Vazio';
        const total = posCart.reduce((a, b) => a + (b.price * b.quantity), 0);
        document.getElementById('pos-total').innerText = `R$ ${total.toFixed(2)}`;
    };

    window.finalizePosSale = async () => {
        if (!posCart.length) return alert("Adicione produtos!");
        const clientName = document.getElementById('client-name').value;
        const clientPhone = document.getElementById('client-phone').value;
        if (!clientName || !clientPhone) return alert("Nome e WhatsApp são obrigatórios.");

        const payload = {
            customer_info: { 
                first_name: clientName, 
                phone_number: clientPhone.replace(/\D/g, ""), 
                cpf: document.getElementById('client-cpf').value.replace(/\D/g, ""),
                birth_date: document.getElementById('client-birth').value || null
            },
            items: posCart.map(i => ({ id: i.id, quantity: i.quantity })),
            payment_info: { method: selectedPayment },
            origin: 'POS'
        };

        try {
            const res = await fetch(`${API_BASE_URL}/checkout/`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value 
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) { 
                document.getElementById('print-client').innerText = clientName;
                document.getElementById('print-total').innerText = document.getElementById('pos-total').innerText;
                document.getElementById('print-date').innerText = new Date().toLocaleString();
                window.print(); 
                alert("Venda registrada com sucesso!"); 
                posCart = []; 
                updatePOSUI(); 
            } else {
                alert("Erro ao salvar venda no servidor.");
            }
        } catch (e) { alert("Erro na conexão com a API."); }
    };

    setupInputs();
    loadProducts();
});