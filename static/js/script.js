/**
 * TAMMY'S STORE - SISTEMA UNIFICADO V6
 * Foco: Dashboard CRM, Busca de Clientes e Estabilidade de Mídia
 */
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];
    
    // --- 🚀 SPLASH SCREEN & HERO ---
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

    // --- 👥 CRM: BUSCA DE CLIENTES GLOBAL ---
    window.searchCustomerByPhone = async () => {
        const phone = document.getElementById('client-phone')?.value;
        if (!phone) return alert("Digite o WhatsApp.");
        try {
            const res = await fetch(`${API_BASE_URL}/customer/search/${phone}/`);
            if (res.ok) {
                const data = await res.json();
                if(document.getElementById('client-name')) document.getElementById('client-name').value = data.first_name || '';
                if(document.getElementById('client-email')) document.getElementById('client-email').value = data.email || '';
                alert("Cliente localizado no CRM!");
            } else {
                alert("Cliente não encontrado. Preencha os dados para cadastrar.");
            }
        } catch (e) { alert("Erro ao buscar cliente."); }
    };

    // --- 🏦 FINALIZAÇÃO, CRM E IMPRESSÃO ---
    window.finalizePosSale = async () => {
        if (!posCart.length) return alert("Carrinho vazio!");
        const clientName = document.getElementById('client-name')?.value;
        const clientPhone = document.getElementById('client-phone')?.value;
        
        if (!clientName || !clientPhone) return alert("Nome e WhatsApp são obrigatórios.");

        const payload = {
            customer_info: { 
                first_name: clientName, 
                phone_number: clientPhone,
                birth_date: document.getElementById('client-birth')?.value 
            },
            items: posCart.map(i => ({ id: i.id, quantity: i.quantity })),
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
                window.print(); // Dispara o cupom térmico
                alert("Venda realizada e salva no CRM!");
                posCart = [];
                updatePOSUI();
            }
        } catch (e) { alert("Erro ao processar venda."); }
    };

    // --- 🛒 CATÁLOGO E GRID DINÂMICO ---
    window.loadProducts = async () => {
        const container = document.getElementById('products-container') || document.getElementById('product-results');
        if (!container) return;
        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            const products = await res.json();
            allProducts = products;
            container.innerHTML = products.map(p => {
                availableProducts[p.id] = p;
                // Ajuste de URL de imagem para garantir exibição
                const img = p.main_image ? (p.main_image.startsWith('http') ? p.main_image : '/media/'+p.main_image) : 'https://placehold.co/400x600';
                
                return `
                <div class="product-card" ${document.getElementById('product-results') ? `onclick="addToPOS(${p.id})"` : ''}>
                    <div class="product-img-wrapper" ${!document.getElementById('product-results') ? `onclick="openGallery(${p.id})"` : ''}>
                        <img src="${img}" onerror="this.src='https://placehold.co/400x600?text=Sincronizando...'">
                    </div>
                    <div style="flex-grow:1;">
                        <h3>${p.name}</h3>
                        <p style="color:#d4af37; font-weight:600;">R$ ${parseFloat(p.price).toFixed(2)}</p>
                    </div>
                    ${!document.getElementById('product-results') ? `<button class="btn-gold-outline add-cart-btn" data-id="${p.id}">ADICIONAR</button>` : ''}
                </div>`;
            }).join('');
        } catch (e) { console.error("Erro no carregamento:", e); }
    };

    // --- ➕ FUNÇÕES AUXILIARES DO PDV ---
    window.addToPOS = (id) => {
        const p = allProducts.find(i => i.id === id);
        if (!p) return;
        const exist = posCart.find(i => i.id === id);
        exist ? exist.quantity++ : posCart.push({...p, quantity: 1, price: parseFloat(p.price)});
        updatePOSUI();
    };

    window.updatePOSUI = () => {
        const cont = document.getElementById('pos-cart-items');
        if (cont) {
            cont.innerHTML = posCart.map(i => `
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span>${i.name} (${i.quantity}x)</span>
                    <button onclick="removeFromPOS(${i.id})" style="color:red; background:none; border:none; cursor:pointer;">&times;</button>
                </div>`).join('') || 'Vazio';
            
            const total = posCart.reduce((a, b) => a + (b.price * b.quantity), 0);
            document.getElementById('pos-total').innerText = `R$ ${total.toFixed(2)}`;
        }
    };

    window.removeFromPOS = (id) => {
        posCart = posCart.filter(i => i.id !== id);
        updatePOSUI();
    };

    // Inicialização
    loadProducts();
});