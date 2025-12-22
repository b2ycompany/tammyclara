/**
 * TAMMY'S STORE - SISTEMA UNIFICADO V10
 * Foco: Limpeza rigorosa de dados (CPF/TEL) e Correção de Erro 400
 */
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api'; 
    let availableProducts = {}; 
    let allProducts = []; 
    let posCart = []; 
    let selectedPayment = 'PIX';
    
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

    // --- 🎭 MÁSCARAS DE ENTRADA (VISUAIS) ---
    const maskCPF = (value) => {
        return value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
    };

    const maskPhone = (value) => {
        return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
    };

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
                <div class="product-card" ${isPDV ? `onclick="addToPOS(${p.id})"` : ''}>
                    <div class="product-img-wrapper" ${!isPDV ? `onclick="openGallery(${p.id})"` : ''}>
                        <img src="${buildUrl(p.main_image)}" onerror="this.src='https://placehold.co/150x150'">
                    </div>
                    <div style="flex-grow:1;">
                        <h3 style="font-size:0.9rem;">${p.name}</h3>
                        <p style="color:#d4af37; font-weight:600;">R$ ${parseFloat(p.price).toFixed(2)}</p>
                    </div>
                    ${!isPDV ? `<button class="btn-gold-outline add-cart-btn" data-id="${p.id}">ADICIONAR</button>` : ''}
                </div>`;
            }).join('');
        } catch (e) { console.error("Erro ao carregar catálogo."); }
    };

    // --- 👥 CRM E BUSCA ---
    window.searchCustomer = async () => {
        const query = document.getElementById('client-search-input')?.value;
        if (!query) return alert("Digite algo para buscar.");
        try {
            const res = await fetch(`${API_BASE_URL}/customer/search/${query}/`);
            if (res.ok) {
                const data = await res.json();
                document.getElementById('client-name').value = data.first_name || '';
                document.getElementById('client-phone').value = data.phone_number ? maskPhone(data.phone_number) : '';
                document.getElementById('client-cpf').value = data.cpf ? maskCPF(data.cpf) : '';
                document.getElementById('client-birth').value = data.birth_date || '';
                alert("Cliente localizado!");
            } else { alert("Cliente não encontrado."); }
        } catch (e) { alert("Erro no CRM."); }
    };

    // --- 🏦 FINALIZAÇÃO (RESOLVE ERRO 400) ---
    window.setPayment = (method, btn) => {
        selectedPayment = method;
        document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };

    window.finalizePosSale = async () => {
        if (!posCart.length) return alert("Carrinho vazio!");
        
        const cName = document.getElementById('client-name').value.trim();
        // Limpeza absoluta: remove tudo que não for número para CPF e Telefone
        const cPhoneRaw = document.getElementById('client-phone').value.replace(/\D/g, '');
        const cCpfRaw = document.getElementById('client-cpf').value.replace(/\D/g, '');
        const cBirth = document.getElementById('client-birth').value;

        if (!cName || cPhoneRaw.length < 10) return alert("Nome e Telefone válido são obrigatórios.");

        // Construção do objeto de cliente
        const customer_info = { 
            first_name: cName, 
            phone_number: cPhoneRaw 
        };
        
        // Só adiciona se não estiver vazio, enviando apenas os números
        if (cCpfRaw) customer_info.cpf = cCpfRaw;
        if (cBirth && cBirth !== "") customer_info.birth_date = cBirth;

        const payload = {
            customer_info: customer_info,
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

            const data = await res.json();

            if (!res.ok) {
                console.error("Erro detalhado da API:", data);
                // Tenta extrair a mensagem de erro específica do Django se existir
                const errorMsg = data.message || JSON.stringify(data);
                throw new Error(errorMsg);
            }

            // Sucesso
            document.getElementById('print-client').innerText = cName;
            document.getElementById('print-total').innerText = document.getElementById('pos-total').innerText;
            window.print();
            
            alert("Venda realizada com sucesso!");
            posCart = []; 
            updatePOSUI();
            ['client-name', 'client-phone', 'client-cpf', 'client-birth', 'client-search-input'].forEach(id => {
                if(document.getElementById(id)) document.getElementById(id).value = '';
            });
        } catch (e) {
            console.error("Erro no Checkout:", e);
            alert("ERRO NO SERVIDOR: " + e.message);
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