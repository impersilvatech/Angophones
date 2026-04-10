// ============================================
// QUICK-VIEW.JS – Modal de detalhe rapido do produto
// ============================================

import { formatarKz } from './core.js';
import { adicionarAoCarrinho } from './cart.js';
import { estaNosFavoritos, alternarFavorito } from './favoritos.js';
import { toast } from './toast.js';

let modalOverlay = null;
let modalContent = null;
let produtoAtual = null;
let quantidadeAtual = 1;
let varianteSelecionada = null;
let corSelecionada = null;
let imagemPrincipalIndex = 0;

/**
 * Cria o modal no DOM se nao existir
 */
function criarModal() {
  if (modalOverlay) return;
  
  // Overlay
  modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.setAttribute('data-quick-view', '');
  
  // Modal
  const modal = document.createElement('div');
  modal.className = 'modal modal-produto';
  
  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <h3 id="modal-produto-titulo">Detalhes do Produto</h3>
    <button class="modal-close" aria-label="Fechar">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  
  // Body
  const body = document.createElement('div');
  body.className = 'modal-body';
  body.id = 'modal-produto-body';
  
  // Footer
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.id = 'modal-produto-footer';
  
  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  modalOverlay.appendChild(modal);
  document.body.appendChild(modalOverlay);
  
  // Event listeners
  const closeBtn = header.querySelector('.modal-close');
  closeBtn.addEventListener('click', fecharModal);
  
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      fecharModal();
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      fecharModal();
    }
  });
}

/**
 * Abre o modal com os detalhes do produto
 * @param {string} produtoId - ID do produto
 */
export function abrirModal(produtoId) {
  const produto = window.CATALOGO?.produtos?.find(p => p.id === produtoId);
  if (!produto) {
    toast('Produto nao encontrado', 'erro');
    return;
  }
  
  criarModal();
  
  produtoAtual = produto;
  quantidadeAtual = 1;
  varianteSelecionada = produto.variantes?.[0]?.nome || null;
  corSelecionada = produto.cores?.[0] || null;
  imagemPrincipalIndex = 0;
  
  renderizarModal();
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Fecha o modal
 */
export function fecharModal() {
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    produtoAtual = null;
  }
}

/**
 * Renderiza o conteudo do modal
 */
function renderizarModal() {
  if (!produtoAtual) return;
  
  const body = document.getElementById('modal-produto-body');
  const footer = document.getElementById('modal-produto-footer');
  const titulo = document.getElementById('modal-produto-titulo');
  
  titulo.textContent = produtoAtual.nome;
  
  // Preco actual
  const precoAtual = calcularPrecoAtual();
  
  // Renderizar body
  body.innerHTML = `
    <div class="modal-produto-galeria">
      <div class="modal-produto-imagens">
        <div class="modal-produto-main">
          <img src="imagens/produtos/${produtoAtual.imagens?.[imagemPrincipalIndex] || 'placeholder.png'}" 
               alt="${produtoAtual.nome}" 
               id="modal-main-image">
        </div>
        ${renderizarThumbnails()}
      </div>
      
      <div class="modal-produto-info">
        <div class="produto-preco">
          ${formatarKz(precoAtual)}
          ${produtoAtual.emPromocao && produtoAtual.precoPromocional ? 
            `<s>${formatarKz(produtoAtual.preco)}</s>` : ''}
        </div>
        
        <p class="produto-descricao">${produtoAtual.descricao}</p>
        
        ${renderizarVariantes()}
        ${renderizarCores()}
        
        <div class="quantidade-control">
          <button class="quantidade-btn" id="modal-qtd-menos">
            <i class="fa-solid fa-minus"></i>
          </button>
          <input type="number" id="modal-qtd-input" class="quantidade-input" 
                 value="${quantidadeAtual}" min="1" max="${produtoAtual.stock || 99}">
          <button class="quantidade-btn" id="modal-qtd-mais">
            <i class="fa-solid fa-plus"></i>
          </button>
          
          ${produtoAtual.stock && produtoAtual.stock < 10 ? 
            `<span class="estoque-baixo">Apenas ${produtoAtual.stock} em stock</span>` : ''}
        </div>
        
        <a href="produto.html?id=${produtoAtual.id}" class="link-pagina-completa">
          <i class="fa-regular fa-circle-info"></i> Ver pagina completa do produto
        </a>
      </div>
    </div>
  `;
  
  // Renderizar footer
  const isFavorito = estaNosFavoritos(produtoAtual.id);
  footer.innerHTML = `
    <button class="btn btn-outline" id="modal-btn-favorito">
      <i class="${isFavorito ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
      ${isFavorito ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
    </button>
    <button class="btn" id="modal-btn-adicionar">
      <i class="fa-solid fa-cart-shopping"></i> Adicionar ao Carrinho
    </button>
  `;
  
  // Event listeners
  document.getElementById('modal-qtd-menos')?.addEventListener('click', () => {
    if (quantidadeAtual > 1) {
      quantidadeAtual--;
      document.getElementById('modal-qtd-input').value = quantidadeAtual;
    }
  });
  
  document.getElementById('modal-qtd-mais')?.addEventListener('click', () => {
    if (!produtoAtual.stock || quantidadeAtual < produtoAtual.stock) {
      quantidadeAtual++;
      document.getElementById('modal-qtd-input').value = quantidadeAtual;
    }
  });
  
  document.getElementById('modal-qtd-input')?.addEventListener('change', (e) => {
    let valor = parseInt(e.target.value);
    if (isNaN(valor) || valor < 1) valor = 1;
    if (produtoAtual.stock && valor > produtoAtual.stock) valor = produtoAtual.stock;
    quantidadeAtual = valor;
    e.target.value = valor;
  });
  
  // Thumbnails
  document.querySelectorAll('.modal-produto-thumb').forEach((thumb, index) => {
    thumb.addEventListener('click', () => {
      imagemPrincipalIndex = index;
      document.getElementById('modal-main-image').src = `imagens/produtos/${produtoAtual.imagens[index]}`;
      document.querySelectorAll('.modal-produto-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
  
  // Variantes
  document.querySelectorAll('.variante-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      varianteSelecionada = btn.dataset.variante;
      document.querySelectorAll('.variante-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      atualizarPrecoModal();
    });
  });
  
  // Cores
  document.querySelectorAll('.cor-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      corSelecionada = btn.dataset.cor;
      document.querySelectorAll('.cor-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // Botoes do footer
  document.getElementById('modal-btn-favorito')?.addEventListener('click', () => {
    const isNowFavorito = alternarFavorito(produtoAtual);
    const btn = document.getElementById('modal-btn-favorito');
    const icon = btn.querySelector('i');
    icon.className = isNowFavorito ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    btn.innerHTML = `
      <i class="${isNowFavorito ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
      ${isNowFavorito ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
    `;
  });
  
  document.getElementById('modal-btn-adicionar')?.addEventListener('click', () => {
    adicionarAoCarrinho(produtoAtual, quantidadeAtual, varianteSelecionada, corSelecionada);
    toast(`${produtoAtual.nome} adicionado ao carrinho`, 'sucesso');
    fecharModal();
  });
}

/**
 * Renderiza os thumbnails da galeria
 */
function renderizarThumbnails() {
  if (!produtoAtual.imagens || produtoAtual.imagens.length <= 1) return '';
  
  return `
    <div class="modal-produto-thumbs">
      ${produtoAtual.imagens.map((img, index) => `
        <div class="modal-produto-thumb ${index === 0 ? 'active' : ''}">
          <img src="imagens/produtos/${img}" alt="Thumbnail ${index + 1}">
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Renderiza as variantes do produto
 */
function renderizarVariantes() {
  if (!produtoAtual.variantes || produtoAtual.variantes.length === 0) return '';
  
  return `
    <div class="produto-variantes">
      <h4>Variante</h4>
      <div class="variantes-opcoes">
        ${produtoAtual.variantes.map(v => `
          <button class="variante-btn ${varianteSelecionada === v.nome ? 'active' : ''}" 
                  data-variante="${v.nome}">
            ${v.nome} - ${formatarKz(v.preco)}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Renderiza as cores do produto
 */
function renderizarCores() {
  if (!produtoAtual.cores || produtoAtual.cores.length === 0) return '';
  
  return `
    <div class="produto-cores">
      <h4>Cor</h4>
      <div class="cores-opcoes">
        ${produtoAtual.cores.map(cor => `
          <button class="cor-btn ${corSelecionada === cor ? 'active' : ''}" 
                  data-cor="${cor}" 
                  style="background-color: ${obterCorHex(cor)};"
                  title="${cor}">
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Obtem o codigo hexadecimal aproximado para nomes de cores comuns
 */
function obterCorHex(nomeCor) {
  const cores = {
    'Preto': '#000000',
    'Branco': '#FFFFFF',
    'Titanio Natural': '#C5B9A6',
    'Titanio Azul': '#3A5A7A',
    'Titanio Branco': '#F0F0F0',
    'Titanio Preto': '#2C2C2C',
    'Titanio Violeta': '#8A6E9E',
    'Titanio Cinza': '#9E9E9E',
    'Titanio Amarelo': '#E8D5A3',
    'Verde': '#4CAF50',
    'Azul': '#2196F3',
    'Vermelho': '#F44336',
    'Cinza Sideral': '#4A4A52',
    'Roxo': '#9C27B0',
    'Estelar': '#E8E4D9',
    'Bege': '#D4C4A8',
    'Grafite': '#5C5C5C',
    'Transparente': 'transparent'
  };
  return cores[nomeCor] || '#CCCCCC';
}

/**
 * Calcula o preco actual considerando a variante selecionada
 */
function calcularPrecoAtual() {
  if (!produtoAtual) return 0;
  
  let preco = produtoAtual.precoPromocional || produtoAtual.preco;
  
  if (varianteSelecionada && produtoAtual.variantes) {
    const variante = produtoAtual.variantes.find(v => v.nome === varianteSelecionada);
    if (variante) {
      preco = variante.preco;
    }
  }
  
  return preco;
}

/**
 * Actualiza o preco exibido no modal
 */
function atualizarPrecoModal() {
  const precoElement = document.querySelector('.modal-produto-info .produto-preco');
  if (precoElement) {
    const precoAtual = calcularPrecoAtual();
    precoElement.innerHTML = `
      ${formatarKz(precoAtual)}
      ${produtoAtual.emPromocao && produtoAtual.precoPromocional ? 
        `<s>${formatarKz(produtoAtual.preco)}</s>` : ''}
    `;
  }
}

/**
 * Verifica se o modal esta aberto
 */
export function isModalAberto() {
  return modalOverlay?.classList.contains('active') || false;
}

// Expor funcoes globalmente
if (typeof window !== 'undefined') {
  window.quickView = {
    abrirModal,
    fecharModal,
    isModalAberto
  };
}
