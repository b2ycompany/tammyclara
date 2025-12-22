/**
 * TAMMY'S STORE - SISTEMA UNIFICADO V8
 * Correção: Erro 500 Checkout e Busca Inteligente
 */
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let selectedPayment = 'PIX';
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];
    
    // --- 🚀 INTERFACE E SPLASH (2.5s) ---
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

    // --- 🛒 CARREGAMENTO DE PRODUTOS ---
    window.loadProducts = async () => {
        const container = document.getElementById('products-container') || document.getElementById('product-results');
        if (!container) return;
        try {
            const res = await fetch(`${API_BASE_URL}/products/`);
            allProducts = await res.json();
            container.innerHTML = allProducts.map(p => {
                availableProducts[p.id] = p;
                const isPDV = !!document.getElementById('product-results');
                return `
                <div class="product-card" ${isPDV ? `onclick="addToPOS(${p.id})"` : ''}>
                    <div class="product-img-wrapper" ${!isPDV ? `onclick="openGallery(${p.id})"` : ''}>
                        <img src="${buildUrl(p.main_image)}" onerror="this.src='https://placehold.co/400x600'">
                    </div>
                    <div style="flex-grow:1;">
                        <h3 style="font-size:0.9rem;">${p.name}</h3>
                        <p style="color:#d4af37; font-weight:600;">R$ ${parseFloat(p.price).toFixed(2)}</p>
                    </div>
                    ${!isPDV ? `<button class="btn-gold-outline add-cart-btn" data-id="${p.id}">ADICIONAR</button>` : ''}
                </div>`;
            }).join('');
        } catch (e) { console.error("Falha ao carregar catálogo."); }
    };

    // --- 👥 CRM E BUSCA INTELIGENTE ---
    window.searchCustomer = async () => {
        const query = document.getElementById('client-search-input')?.value;
        if (!query) return alert("Digite algo para buscar.");
        try {
            const res = await fetch(`${API_BASE_URL}/customer/search/${query}/`);
            if (res.ok) {
                const data = await res.json();
                document.getElementById('client-name').value = data.first_name || '';
                document.getElementById('client-phone').value = data.phone_number || '';
                document.getElementById('client-cpf').value = data.cpf || '';
                document.getElementById('client-birth').value = data.birth_date || '';
                alert("Cliente localizado!");
            } else { alert("Cliente não encontrado. Cadastre os dados abaixo."); }
        } catch (e) { alert("Erro na comunicação com o CRM."); }
    };

    // --- 🏦 FINALIZAÇÃO (RESOLVE ERRO 500) ---
    window.setPayment = (method, btn) => {
        selectedPayment = method;
        document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };

    window.finalizePosSale = async () => {
        if (!posCart.length) return alert("Adicione produtos primeiro!");
        
        const cName = document.getElementById('client-name').value;
        const cPhone = document.getElementById('client-phone').value;
        if (!cName || !cPhone) return alert("Nome e WhatsApp são obrigatórios.");

        // ✅ Tratamento de dados para evitar Erro 500 no Banco de Dados
        const payload = {
            customer_info: { 
                first_name: cName, 
                phone_number: cPhone, 
                cpf: document.getElementById('client-cpf').value || "", 
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

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Erro interno do servidor");
            }

            // Sucesso: Impressão e Limpeza
            document.getElementById('print-client').innerText = cName;
            document.getElementById('print-total').innerText = document.getElementById('pos-total').innerText;
            window.print();
            
            alert("Venda registrada com sucesso!");
            posCart = []; 
            updatePOSUI();
            
            // Limpar formulário
            ['client-name', 'client-phone', 'client-cpf', 'client-birth', 'client-search-input'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.value = '';
            });
        } catch (e) {
            console.error(e);
            alert("ERRO AO FINALIZAR: " + e.message + ". Verifique o CPF ou conexão.");
        }
    };

    // --- 🛒 LÓGICA AUXILIAR ---
    window.addToPOS = (id) => {
        const p = allProducts.find(i => i.id === id);
        if (p) {
            const exist = posCart.find(i => i.id === id);
            exist ? exist.quantity++ : posCart.push({...p, quantity: 1, price: parseFloat(p.price)});
            updatePOSUI();
        }
    };

    window.updatePOSUI = () => {
        const cont = document.getElementById('pos-cart-items');
        if (cont) {
            cont.innerHTML = posCart.map(i => `
                <div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #eee;">
                    <span>${i.name} (x${i.quantity})</span>
                    <span>R$ ${(i.price * i.quantity).toFixed(2)}</span>
                </div>`).join('') || 'Vazio';
            const total = posCart.reduce((a, b) => a + (b.price * b.quantity), 0);
            document.getElementById('pos-total').innerText = `R$ ${total.toFixed(2)}`;
        }
    };

    loadProducts();
});