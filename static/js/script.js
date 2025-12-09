// --- LÓGICA DA SPLASH SCREEN (Executada Imediatamente) ---
console.log('--- 1. INÍCIO DA EXECUÇÃO DO SCRIPT ---');

const splashScreen = document.getElementById('splash-screen');
const mainBody = document.getElementById('main-body');

// Simula o tempo da animação
const animationDuration = 3000; // 3 segundos

function hideSplashScreen() {
    console.log('--- 4. EXECUTANDO hideSplashScreen ---');
    if (!splashScreen || !mainBody) return;
    
    // 1. Aplica a classe para animar a abertura das portas
    splashScreen.classList.add('hidden');
    console.log('4.1. Classe "hidden" adicionada à splash screen.');
    
    // 2. Remove a tela completamente após o fim da transição da porta
    setTimeout(() => {
        splashScreen.style.display = 'none';
        console.log('4.2. Splash Screen escondida (display: none).');
        
        // MOSTRA O CORPO AGORA QUE A SPLASH SUMIU
        mainBody.style.overflow = 'auto'; // Restaura o scroll
        mainBody.style.opacity = 1; // Remove a opacidade 0
        console.log('4.3. Corpo do site mostrado.');
        
    }, 1500); // 1.5s (corresponde ao tempo de transição das portas no CSS)
}

// Garante que a tela de abertura seja mostrada apenas uma vez por sessão
if (splashScreen && !sessionStorage.getItem('splashShown')) {
    console.log('--- 2. LÓGICA DE PRIMEIRA VISITA ATIVADA ---');
    
    // A VISIBILIDADE JÁ FOI CONFIGURADA PELO CSS INLINE NO HTML
    
    // Dispara a animação após 3 segundos
    setTimeout(hideSplashScreen, animationDuration);
    sessionStorage.setItem('splashShown', 'true');
    console.log('2.2. Ocultação agendada para 3 segundos. sessionStorage setado.');
} else if (splashScreen) {
    console.log('--- 3. LÓGICA DE VISITA RECORRENTE ATIVADA ---');
    // Se já foi mostrada, esconde imediatamente e mostra o corpo
    splashScreen.style.display = 'none';
    mainBody.style.opacity = 1;
    mainBody.style.overflow = 'auto';
    console.log('3.1. Splash screen ignorada. Site visível.');
} else {
     console.error('ERRO CRÍTICO: Elemento #splash-screen não existe no DOM!');
}


// --- LÓGICA DO RESTO DO SITE (ESPERA O DOM CARREGAR) ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('--- 5. DOM CONTENT LOADED: Funcionalidades prontas. ---');
    
    // URL base do seu Backend Django
    const API_BASE_URL = 'http://127.0.0.1:8000/api'; 
    
    // --- LÓGICA DA INTERATIVIDADE DE FUSÃO (Leia Mais) ---
    const toggleButton = document.getElementById('toggle-story');
    const storyDetail = document.querySelector('.story-detail');

    if (toggleButton && storyDetail) {
        toggleButton.addEventListener('click', () => {
            if (storyDetail.style.display === 'none') {
                storyDetail.style.display = 'block';
                toggleButton.textContent = 'Leia Menos';
            } else {
                storyDetail.style.display = 'none';
                toggleButton.textContent = 'Leia Mais';
            }
        });
    }

    // --- Lógica para o Carrinho de Compras (Frontend Simplificado) ---
    let cart = JSON.parse(localStorage.getItem('tammyClaraCart')) || [];

    function saveCart() {
        localStorage.setItem('tammyClaraCart', JSON.stringify(cart));
    }

    function addToCart(product) {
        const existingProduct = cart.find(item => item.id === product.id);
        if (existingProduct) {
            existingProduct.quantity++;
        } else {
            cart.push({...product, quantity: 1});
        }
        saveCart();
        alert(`${product.name} adicionado ao carrinho!`);
        updateCartDisplay(); 
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        updateCartDisplay();
    }

    function updateCartDisplay() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const cartTotalElement = document.getElementById('cart-total');
        if (!cartItemsContainer || !cartTotalElement) return;

        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
            cartTotalElement.textContent = 'R$ 0,00';
            return;
        }

        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            const itemPrice = item.price || 0; 
            itemElement.innerHTML = `
                <span>${item.name} (x${item.quantity})</span>
                <span>R$ ${(itemPrice * item.quantity).toFixed(2)}</span>
                <button data-id="${item.id}" class="remove-from-cart">Remover</button>
            `;
            cartItemsContainer.appendChild(itemElement);
            total += itemPrice * item.quantity;
        });

        cartTotalElement.textContent = `R$ ${total.toFixed(2)}`;

        document.querySelectorAll('.remove-from-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                removeFromCart(e.target.dataset.id);
            });
        });
    }

    if (document.querySelector('.cart-page')) {
        updateCartDisplay();
    }
    
    // Simulação de produtos (IDs devem corresponder ao products.html e ao backend)
    window.dummyProducts = [
        { id: '1', name: 'Vestido de Seda Elegante', price: 299.90, image: 'vestido1.png' },
        { id: '2', name: 'Calça Alfaiataria Luxo', price: 189.50, image: 'calca1.png' },
        { id: '3', name: 'Blusa Fluid Dourada', price: 129.00, image: 'blusa1.png' },
        { id: '4', name: 'Saia Plissada Minimalista', price: 160.00, image: 'placeholder-produto4.png' }
    ];

    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            const product = window.dummyProducts.find(p => p.id === productId);
            if (product) {
                addToCart(product);
            }
        });
    } );

    // --- Lógica de CHECKOUT com a API do Django ---
    const whatsappBtn = document.getElementById('checkout-whatsapp-btn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', async () => {
            if (cart.length === 0) {
                alert('Seu carrinho está vazio. Adicione itens antes de finalizar.');
                return;
            }
            
            const customerInfo = {
                first_name: prompt("Seu nome (obrigatório):"),
                email: prompt("Seu e-mail:"),
                phone_number: prompt("Seu WhatsApp (obrigatório, ex: 5511987654321):")
            };

            if (!customerInfo.first_name || !customerInfo.phone_number) {
                 alert('Nome e WhatsApp são obrigatórios para a venda personalizada.');
                 return;
            }

            const payload = {
                customer_info: customerInfo,
                items: cart.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price 
                }))
            };

            try {
                const response = await fetch(`${API_BASE_URL}/checkout/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Erro ao registrar pedido. Status: ${response.status}`);
                }

                const result = await response.json();
                
                cart = [];
                saveCart();
                updateCartDisplay();
                
                alert(`Pedido #${result.sale_id} registrado! A Tammy ou Clara entrarão em contato via WhatsApp para finalizar.`);

                window.open(result.whatsapp_link, '_blank');

            } catch (error) {
                console.error("Erro no checkout:", error);
                alert(`Erro ao processar o pedido. Detalhe: ${error.message}`);
            }
        });
    }

});