/**
 * TAMMY'S STORE - SISTEMA UNIFICADO V13
 * Foco: Padronização de Imagens, Galeria Navegável e Estabilidade CRM
 */
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let selectedPayment = 'PIX';
    
    // Controle de Galeria
    let currentGalleryImages = [];
    let currentImageIndex = 0;

    // --- 🚀 INTERFACE E SPLASH ---
    const splash = document.getElementById('splash-screen');
    const heroCard = document.getElementById('heroCard');
    setTimeout(() => {
        if (splash) {
            splash.style.opacity = '0';
            splash.style.transform = 'translateY(-100%)';
            setTimeout(() => splash.remove(), 900);
        }
        if (heroCard) heroCard.classList.add('show');
    }, 2500); 

    const buildUrl = (path) => {
        if (!path) return 'https://placehold.co/400x600?text=Sem+Foto';
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return cleanPath.startsWith('media/') ? '/' + cleanPath : '/media/' + cleanPath;
    };

    // --- 🎭 MÁSCARAS DE ENTRADA ---
    const maskCPF = (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
    const maskPhone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');

    const cpfInput = document.getElementById('client-cpf');
    const phoneInput = document.getElementById('client-phone');
    if (cpfInput) cpfInput.addEventListener('input', (e) => e.target.value = maskCPF(e.target.value));
    if (phoneInput) phoneInput.addEventListener('input', (e) => e.target.value = maskPhone(e.target.value));

    // --- 🛒 CARREGAMENTO DE PRODUTOS ---
    window.loadProducts = async () => {
        const container = document.getElementById('product-results') || document.getElementById('products-container');
        if (!container) return;
        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            allProducts = await res.json();
            container.innerHTML = allProducts.map(p => {
                availableProducts[p.id] = p;
                const isPDV = !!document.getElementById('product-results');
                return `
                <div class="product-card" onclick="${isPDV ? `addToPOS(${p.id})` : `openGallery(${p.id})`}">
                    <div class="product-img-wrapper">
                        <img src="${buildUrl(p.main_image)}" class="standard-img" onerror="this.src='https://placehold.co/400x600'">
                    </div>
                    <div class="product-info">
                        <h3>${p.name}</h3>
                        <p class="price">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</p>
                    </div>
                </div>`;
            }).join('');
        } catch (e) { console.error("Erro ao carregar catálogo."); }
    };

    // --- 🖼️ LÓGICA DE GALERIA NAVEGÁVEL ---
    window.openGallery = (id) => {
        const p = availableProducts[id];
        if (!p) return;
        
        // Coleta imagem principal + imagens adicionais
        currentGalleryImages = [buildUrl(p.main_image)];
        if (p.images) {
            p.images.forEach(imgObj => currentGalleryImages.push(buildUrl(imgObj.image)));
        }
        
        currentImageIndex = 0;
        showGalleryModal();
    };

    function showGalleryModal() {
        const modal = document.createElement('div');
        modal.id = 'gallery-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-gallery" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <button class="nav-btn prev" onclick="changeImage(-1)">&#10094;</button>
                <img id="modal-img" src="${currentGalleryImages[currentImageIndex]}">
                <button class="nav-btn next" onclick="changeImage(1)">&#10095;</button>
                <div class="image-counter">${currentImageIndex + 1} / ${currentGalleryImages.length}</div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    window.changeImage = (step) => {
        currentImageIndex += step;
        if (currentImageIndex >= currentGalleryImages.length) currentImageIndex = 0;
        if (currentImageIndex < 0) currentImageIndex = currentGalleryImages.length - 1;
        
        const modalImg = document.getElementById('modal-img');
        const counter = document.querySelector('.image-counter');
        if (modalImg) modalImg.src = currentGalleryImages[currentImageIndex];
        if (counter) counter.innerText = `${currentImageIndex + 1} / ${currentGalleryImages.length}`;
    };

    // --- 🏦 FINALIZAÇÃO PDV ---
    window.finalizePosSale = async () => {
        if (!posCart.length) return alert("Carrinho vazio!");
        const cName = document.getElementById('client-name').value.trim();
        const cPhoneRaw = document.getElementById('client-phone').value.replace(/\D/g, '');
        
        if (!cName || cPhoneRaw.length < 10) return alert("Nome e WhatsApp são obrigatórios.");

        const payload = {
            customer_info: { first_name: cName, phone_number: cPhoneRaw },
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
                window.print();
                alert("Venda realizada com sucesso!");
                posCart = []; updatePOSUI();
            } else {
                const err = await res.json();
                alert("Erro: " + (err.error || "Falha no servidor"));
            }
        } catch (e) { alert("Erro de conexão."); }
    };

    window.addToPOS = (id) => {
        const p = allProducts.find(i => i.id === id);
        if (p) {
            const exist = posCart.find(i => i.id === id);
            exist ? exist.quantity++ : posCart.push({...p, quantity: 1, price: parseFloat(p.price)});
            updatePOSUI();
        }
    };

    window.removeFromPOS = (id) => {
        posCart = posCart.filter(item => item.id !== id);
        updatePOSUI();
    };

    window.updatePOSUI = () => {
        const cont = document.getElementById('pos-cart-items');
        if (cont) {
            cont.innerHTML = posCart.map(i => `
                <div class="cart-item-row">
                    <span>${i.name} (x${i.quantity})</span>
                    <button onclick="removeFromPOS(${i.id})"><i class="fas fa-trash"></i></button>
                </div>`).join('') || '<p>Carrinho vazio</p>';
            const total = posCart.reduce((a, b) => a + (b.price * b.quantity), 0);
            document.getElementById('pos-total').innerText = `R$ ${total.toFixed(2)}`;
        }
    };

    loadProducts();
});