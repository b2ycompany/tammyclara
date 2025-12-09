document.addEventListener('DOMContentLoaded', () => {
    
    // URL base do seu Backend Django para API calls
    const API_BASE_URL = 'http://127.0.0.1:8000/api'; 
    
    // URL base do seu servidor Django (http://127.0.0.1:8000)
    const DJANGO_BASE_URL = window.location.origin.replace(/\/$/, ''); 
    
    // Variáveis globais para o Modal
    let currentGalleryImages = [];
    let currentImageIndex = 0;
    
    // Garante que o corpo do site esteja visível por padrão
    const mainBody = document.getElementById('main-body');
    if (mainBody) {
        mainBody.style.opacity = 1; 
        mainBody.style.overflow = 'auto';
    }

    // --- FUNÇÃO AUXILIAR PARA LIMPAR E CONSTRUIR A URL DE MÍDIA ---
    function buildMediaUrl(relativePath) {
        if (!relativePath) {
            return '/static/img/placeholder-produto.png';
        }
        
        // Se a URL já for absoluta, retorna-a.
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
            return relativePath;
        }

        // Remove a barra inicial do relativePath para evitar http://...//media/...
        const cleanedPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        
        // Concatena: http://127.0.0.1:8000 + / + media/products/arquivo.png
        return DJANGO_BASE_URL + '/' + cleanedPath;
    }

    // --- FUNÇÃO AUXILIAR PARA CSRF TOKEN (CRÍTICO PARA POST) ---
    function getCsrfToken() {
        // Tenta obter o token do input oculto injetado pelo Django
        const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
        return csrfInput ? csrfInput.value : null;
    }
    
    // --- FUNÇÕES AUXILIARES DE INTERATIVIDADE (DEFINIDAS ANTES DE loadProducts) ---

    function attachAddToCartListeners() {
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                const product = availableProducts[productId]; 
                if (product) {
                    addToCart(product); 
                } else {
                    alert('Erro: Produto não encontrado no catálogo.');
                }
            });
        });
    }

    function attachGalleryListeners() {
        // 1. Liga o evento para as miniaturas no grid principal
        document.querySelectorAll('.gallery-thumb').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                const newImageUrl = e.target.dataset.fullImg;
                const productId = e.target.dataset.productId;
                
                openImageModal(productId, newImageUrl); 
            });
        });
        
        // 2. Liga o evento para a IMAGEM PRINCIPAL (para abrir o modal)
        document.querySelectorAll('.product-image-container img').forEach(mainImg => {
            const productId = mainImg.id.replace('main-image-', ''); 
            if (productId) {
                mainImg.style.cursor = 'pointer'; 
                mainImg.addEventListener('click', () => {
                    let fullUrl = mainImg.src; 
                    openImageModal(productId, fullUrl);
                });
            }
        });
    }

    // --- CÓDIGO PRINCIPAL loadProducts ---
    
    const productsGrid = document.querySelector('.products-grid');
    let availableProducts = {}; 

    if (productsGrid) {
        
        async function loadProducts() {
            try {
                // Requisição para a API de listagem de produtos
                const response = await fetch(API_BASE_URL + '/products/'); 
                if (!response.ok) {
                    throw new Error('Erro ao carregar produtos do servidor.');
                }
                const products = await response.json();

                if (!products || products.length === 0) {
                    productsGrid.innerHTML = '<p>Nenhum produto encontrado. Cadastre no Admin!</p>';
                    return;
                }

                productsGrid.innerHTML = '';
                
                products.forEach(product => {
                    if (!product || !product.id) {
                        return; 
                    }
                    
                    availableProducts[product.id] = product; 

                    let initialImageUrl = '/static/img/placeholder-produto.png';
                    
                    // --- 1. LÓGICA DE GERAÇÃO DA LISTA DE IMAGENS ---
                    let allImages = []; 
                    let mainImageUrl = product.main_image; 
                    const addedUrls = new Set();
                    
                    if (mainImageUrl) {
                        allImages.push({ url: mainImageUrl, is_main: true });
                        addedUrls.add(mainImageUrl);
                    }
                    
                    if (product.images && product.images.length > 0) {
                        product.images.forEach(img => {
                            if (!addedUrls.has(img.image)) { 
                                allImages.push({ url: img.image, is_main: img.is_cover });
                                addedUrls.add(img.image);
                            }
                        });
                    }

                    if (allImages.length > 0) {
                        initialImageUrl = buildMediaUrl(allImages[0].url);
                    }
                    
                    // --- 2. CONSTRUÇÃO DA GALERIA DE MINIATURAS (HTML) ---
                    let galleryHtml = '';
                    
                    if (allImages.length > 1) { 
                        galleryHtml = '<div class="product-gallery">';
                        allImages.forEach((img, index) => {
                            
                            const thumbUrl = buildMediaUrl(img.url);

                            galleryHtml += 
                                '<img ' + 
                                    'src="' + thumbUrl + '" ' + 
                                    'alt="' + product.name + ' miniatura ' + (index + 1) + '" ' + 
                                    'class="gallery-thumb" ' + 
                                    'data-full-img="' + thumbUrl + '"' + 
                                    'data-product-id="' + product.id + '"' +
                                '/>';
                        });
                        galleryHtml += '</div>';
                    }

                    // --- 3. CONSTRUÇÃO DO ELEMENTO PRINCIPAL ---
                    
                    const productItem = document.createElement('div');
                    productItem.classList.add('product-item');

                    productItem.innerHTML = 
                        '<div class="product-image-container">' +
                            '<img src="' + initialImageUrl + '" alt="' + product.name + '" id="main-image-' + product.id + '">' +
                        '</div>' +
                        galleryHtml + 
                        '<h3>' + product.name + '</h3>' +
                        '<p>R$ ' + parseFloat(product.price).toFixed(2) + '</p>' +
                        '<button ' + 
                            'class="btn primary-btn add-to-cart-btn" ' + 
                            'data-id="' + product.id + '">' +
                            'Adicionar ao Carrinho' +
                        '</button>';
                    
                    productsGrid.appendChild(productItem);
                });
                
                attachAddToCartListeners(); 
                attachGalleryListeners(); 
                
            } catch (error) {
                console.error('Falha ao buscar produtos:', error);
                productsGrid.innerHTML = `<p class="error-msg">Erro ao carregar produtos: ${error.message}</p>`;
            }
        }
        
        loadProducts(); 
    }
    
    // --- LÓGICA DO MODAL/LIGHTBOX (Interatividade UX/UI) ---

    function openImageModal(productId, initialUrl) {
        const product = availableProducts[productId];
        if (!product) return;

        // 1. Constrói a lista de imagens completa
        currentGalleryImages = [];
        const mainImageUrl = product.main_image;
        
        const addedUrls = new Set();
        
        if (mainImageUrl) {
            let fullUrl = buildMediaUrl(mainImageUrl);
            currentGalleryImages.push(fullUrl);
            addedUrls.add(fullUrl);
        }
        
        if (product.images) {
            product.images.forEach(img => {
                let fullUrl = buildMediaUrl(img.image);
                if (!addedUrls.has(fullUrl)) {
                    currentGalleryImages.push(fullUrl);
                }
            });
        }
        
        // 2. Define o índice inicial
        const initialIndex = currentGalleryImages.findIndex(url => url === initialUrl);
        currentImageIndex = initialIndex !== -1 ? initialIndex : 0;
        
        // 3. Injeta e abre o modal
        injectModalThumbnails(currentGalleryImages);
        updateModalDisplay(currentImageIndex);
        document.getElementById('image-modal').style.display = 'flex';
    }

    function updateModalDisplay(index) {
        if (currentGalleryImages.length === 0) return;
        
        const fullUrl = currentGalleryImages[index];

        document.getElementById('modal-main-image').src = fullUrl;
        currentImageIndex = index;

        // Marca a miniatura ativa (melhoria UX)
        document.querySelectorAll('#modal-thumbnails-container img').forEach((img, i) => {
            img.classList.remove('active');
            if (i === index) {
                img.classList.add('active');
            }
        });
    }

    function injectModalThumbnails(images) {
        const container = document.getElementById('modal-thumbnails-container');
        container.innerHTML = '';
        
        images.forEach((fullUrl, index) => {
            const thumb = document.createElement('img');
            thumb.src = fullUrl;
            thumb.classList.add('modal-thumb');
            thumb.addEventListener('click', () => updateModalDisplay(index));
            container.appendChild(thumb);
        });
    }


    // --- 5. LIGAÇÃO DE EVENTOS DO MODAL ---
    
    const modal = document.getElementById('image-modal');
    if (modal) {
        // Fechar com o 'X'
        document.querySelector('#image-modal .close-btn').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Fechar clicando fora do modal
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Navegação (Prev e Next)
        document.querySelector('#image-modal .prev-btn').addEventListener('click', () => {
            let newIndex = currentImageIndex - 1;
            if (newIndex < 0) {
                newIndex = currentGalleryImages.length - 1; // Volta para o final
            }
            updateModalDisplay(newIndex);
        });

        document.querySelector('#image-modal .next-btn').addEventListener('click', () => {
            let newIndex = currentImageIndex + 1;
            if (newIndex >= currentGalleryImages.length) {
                newIndex = 0; // Vai para o início
            }
            updateModalDisplay(newIndex);
        });
    }


    // --- LÓGICA DO CARRINHO E INTERATIVIDADE (RESTANTE DO CÓDIGO) ---
    // ... (restante do código de Carrinho e Checkout) ...
    
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
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            // Cria um objeto de item simples com os dados necessários
            cart.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: 1,
                main_image: product.main_image,
                sku: product.sku
            });
        }
        saveCart();
        updateCartDisplay();
        alert(`${product.name} adicionado ao carrinho!`);
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.id != productId);
        saveCart();
        updateCartDisplay();
    }

    function updateCartDisplay() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const cartTotalSpan = document.getElementById('cart-total');

        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '';
            let total = 0;

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart-message">Seu carrinho está vazio.</p>';
            } else {
                cart.forEach(item => {
                    const itemTotal = item.price * item.quantity;
                    total += itemTotal;
                    
                    const imageUrl = buildMediaUrl(item.main_image);

                    const itemHtml = `
                        <div class="cart-item" data-product-id="${item.id}">
                            <img src="${imageUrl}" alt="${item.name}" class="cart-item-image">
                            <div class="cart-item-details">
                                <h4>${item.name} (${item.sku})</h4>
                                <p>Preço: R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                                <div class="cart-quantity-controls">
                                    <button class="qty-btn qty-minus-btn" data-id="${item.id}" data-action="decrease">—</button>
                                    <span class="qty-count">${item.quantity}</span>
                                    <button class="qty-btn qty-plus-btn" data-id="${item.id}" data-action="increase">+</button>
                                </div>
                                <p class="cart-item-total">Subtotal: R$ ${itemTotal.toFixed(2).replace('.', ',')}</p>
                                <button class="btn-remove btn secondary-btn" data-id="${item.id}">Remover</button>
                            </div>
                        </div>
                    `;
                    cartItemsContainer.innerHTML += itemHtml;
                });
            }

            // Atualiza o total
            if (cartTotalSpan) {
                cartTotalSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
            }

            // Re-anexa os listeners para os botões do carrinho
            attachCartListeners();
        } else if (cartTotalSpan) {
             let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
             cartTotalSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        }
    }

    function attachCartListeners() {
        // Lógica para botões de Quantidade (+ e -)
        document.querySelectorAll('.qty-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                const action = e.currentTarget.getAttribute('data-action');
                
                const item = cart.find(i => i.id === id);
                if (!item) return;

                if (action === 'increase') {
                    item.quantity += 1;
                } else if (action === 'decrease') {
                    item.quantity -= 1;
                    if (item.quantity < 1) {
                        // Remove se a quantidade for zero
                        cart = cart.filter(i => i.id !== id);
                    }
                }
                
                saveCart();
                updateCartDisplay();
            });
        });

        // Lógica para botão Remover
        document.querySelectorAll('.btn-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                cart = cart.filter(i => i.id !== id);
                saveCart();
                updateCartDisplay();
            });
        });
    }

    // Inicializa a exibição do carrinho ao carregar a página
    updateCartDisplay();
    

    // --- Lógica de CHECKOUT (CRM/Venda Pendente) ---
    // 🚨 Removida menção ao WhatsApp no fluxo de checkout 🚨
    const checkoutBtn = document.getElementById('checkout-whatsapp-btn');
    if (checkoutBtn) {
        // Altera o texto do botão para melhor UX (Se o botão tiver o ID correto)
        checkoutBtn.textContent = 'FINALIZAR PEDIDO'; 
        
        checkoutBtn.addEventListener('click', async () => {
            if (cart.length === 0) {
                alert('Seu carrinho está vazio. Adicione itens antes de finalizar.');
                return;
            }
            
            // Requisita dados do cliente
            const customerInfo = {
                first_name: prompt("Seu nome (obrigatório):"),
                email: prompt("Seu e-mail:"),
                phone_number: prompt("Seu WhatsApp (obrigatório, ex: 5511987654321):") 
            };

            if (!customerInfo.first_name || !customerInfo.phone_number) {
                 alert('Nome e WhatsApp são obrigatórios para a venda ser registrada.');
                 return;
            }

            // Obtém o token CSRF
            const csrfToken = getCsrfToken();
            if (!csrfToken) {
                alert('Erro de segurança: Token CSRF não encontrado. Recarregue a página.');
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
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken 
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    // 🚨 CORREÇÃO DE ERRO 400: Exibe a mensagem amigável do backend 🚨
                    throw new Error(errorData.error || `Erro ao registrar pedido. Status: ${response.status}`);
                }

                const result = await response.json();
                
                // Limpa o carrinho e redireciona para a página de sucesso
                cart = [];
                saveCart();
                window.location.href = `/order-success/?id=${result.sale_id}`;


            } catch (error) {
                console.error("Erro no checkout:", error);
                // 🚨 CORREÇÃO DE ERRO 400: Exibe a mensagem de estoque mais amigável 🚨
                alert(`⚠️ Atenção: ${error.message}`);
            }
        });
    }

});