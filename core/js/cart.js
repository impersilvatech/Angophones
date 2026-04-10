// ============================================
// CART.JS – Gestao do carrinho de compras
// ============================================

import { salvarLocal, carregarLocal, removerLocal, formatarKz } from './core.js';
import { toast } from './toast.js';

const CARRINHO_CHAVE = 'carrinho';

// Estado do carrinho
let carrinho = carregarLocal(CARRINHO_CHAVE) || [];
let observadores = [];

/**
 * Notifica todos os observadores de mudancas no carrinho
 */
function notificarObservadores() {
  observadores.forEach(callback => callback(carrinho));
}

/**
 * Regista um observador para mudancas no carrinho
 * @param {Function} callback - Funcao a chamar quando o carrinho mudar
 * @returns {Function} Funcao para remover o observador
 */
export function observarCarrinho(callback) {
  observadores.push(callback);
  callback(carrinho);
  return () => {
    observadores = observadores.filter(cb => cb !== callback);
  };
}

/**
 * Obtem o carrinho actual
 * @returns {Array} Itens do carrinho
 */
export function getCarrinho() {
  return [...carrinho];
}

/**
 * Obtem o numero total de itens no carrinho
 * @returns {number} Quantidade total
 */
export function getQuantidadeTotal() {
  return carrinho.reduce((total, item) => total + item.quantidade, 0);
}

/**
 * Obtem o subtotal (sem entrega e sem desconto)
 * @returns {number} Subtotal
 */
export function getSubtotal() {
  return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

/**
 * Adiciona um produto ao carrinho
 * @param {Object} produto - Produto a adicionar
 * @param {number} quantidade - Quantidade (padrao 1)
 * @param {string} variante - Variante selecionada (opcional)
 * @param {string} cor - Cor selecionada (opcional)
 */
export function adicionarAoCarrinho(produto, quantidade = 1, variante = null, cor = null) {
  if (!produto || !produto.id) {
    console.error('Produto invalido');
    return;
  }
  
  // Verificar stock
  if (produto.stock !== undefined && produto.stock <= 0) {
    toast('Produto fora de stock', 'erro');
    return;
  }
  
  const preco = produto.precoPromocional || produto.preco;
  
  // Criar chave unica para o item (considera variante e cor)
  const itemKey = `${produto.id}_${variante || 'padrao'}_${cor || 'padrao'}`;
  
  const itemExistente = carrinho.find(item => item.itemKey === itemKey);
  
  if (itemExistente) {
    const novaQuantidade = itemExistente.quantidade + quantidade;
    if (produto.stock && novaQuantidade > produto.stock) {
      toast(`Stock insuficiente. Apenas ${produto.stock} disponiveis.`, 'aviso');
      return;
    }
    itemExistente.quantidade = novaQuantidade;
  } else {
    if (produto.stock && quantidade > produto.stock) {
      toast(`Stock insuficiente. Apenas ${produto.stock} disponiveis.`, 'aviso');
      return;
    }
    carrinho.push({
      itemKey,
      id: produto.id,
      nome: produto.nome,
      preco: preco,
      imagem: produto.imagens?.[0] || 'placeholder.png',
      quantidade,
      variante,
      cor,
      categoria: produto.categoria,
      stock: produto.stock
    });
  }
  
  salvarLocal(CARRINHO_CHAVE, carrinho);
  notificarObservadores();
  atualizarContadorUI();
  
  toast(`${produto.nome} adicionado ao carrinho`, 'sucesso');
}

/**
 * Remove um item do carrinho
 * @param {string} itemKey - Chave do item a remover
 */
export function removerDoCarrinho(itemKey) {
  const item = carrinho.find(i => i.itemKey === itemKey);
  carrinho = carrinho.filter(item => item.itemKey !== itemKey);
  salvarLocal(CARRINHO_CHAVE, carrinho);
  notificarObservadores();
  atualizarContadorUI();
  
  if (item) {
    toast(`${item.nome} removido do carrinho`, 'info');
  }
}

/**
 * Actualiza a quantidade de um item
 * @param {string} itemKey - Chave do item
 * @param {number} quantidade - Nova quantidade
 */
export function atualizarQuantidade(itemKey, quantidade) {
  const item = carrinho.find(item => item.itemKey === itemKey);
  if (!item) return;
  
  if (quantidade <= 0) {
    removerDoCarrinho(itemKey);
    return;
  }
  
  // Verificar stock
  if (item.stock && quantidade > item.stock) {
    toast(`Stock insuficiente. Maximo: ${item.stock}`, 'aviso');
    return;
  }
  
  item.quantidade = quantidade;
  salvarLocal(CARRINHO_CHAVE, carrinho);
  notificarObservadores();
  atualizarContadorUI();
}

/**
 * Incrementa a quantidade de um item
 * @param {string} itemKey - Chave do item
 */
export function incrementarQuantidade(itemKey) {
  const item = carrinho.find(item => item.itemKey === itemKey);
  if (item) {
    atualizarQuantidade(itemKey, item.quantidade + 1);
  }
}

/**
 * Decrementa a quantidade de um item
 * @param {string} itemKey - Chave do item
 */
export function decrementarQuantidade(itemKey) {
  const item = carrinho.find(item => item.itemKey === itemKey);
  if (item && item.quantidade > 1) {
    atualizarQuantidade(itemKey, item.quantidade - 1);
  } else if (item && item.quantidade === 1) {
    removerDoCarrinho(itemKey);
  }
}

/**
 * Limpa todo o carrinho
 */
export function limparCarrinho() {
  carrinho = [];
  removerLocal(CARRINHO_CHAVE);
  notificarObservadores();
  atualizarContadorUI();
  toast('Carrinho limpo', 'info');
}

/**
 * Verifica se um produto esta no carrinho
 * @param {string} produtoId - ID do produto
 * @returns {boolean}
 */
export function estaNoCarrinho(produtoId) {
  return carrinho.some(item => item.id === produtoId);
}

/**
 * Obtem a quantidade de um produto especifico no carrinho
 * @param {string} produtoId - ID do produto
 * @returns {number} Quantidade
 */
export function getQuantidadeProduto(produtoId) {
  return carrinho
    .filter(item => item.id === produtoId)
    .reduce((total, item) => total + item.quantidade, 0);
}

/**
 * Aplica um cupao de desconto
 * @param {string} codigo - Codigo do cupao
 * @returns {Object|null} Cupao aplicado ou null
 */
export function aplicarCupao(codigo) {
  const cupoes = window.CATALOGO?.cupoes || [];
  const cupao = cupoes.find(c => c.codigo === codigo.toUpperCase() && c.ativo);
  
  if (!cupao) {
    toast('Cupao invalido ou expirado', 'erro');
    return null;
  }
  
  // Verificar validade
  if (cupao.validoAte && new Date(cupao.validoAte) < new Date()) {
    toast('Cupao expirado', 'erro');
    return null;
  }
  
  // Verificar valor minimo
  const subtotal = getSubtotal();
  if (cupao.minimoCompra && subtotal < cupao.minimoCompra) {
    toast(`Compra minima de ${formatarKz(cupao.minimoCompra)} para usar este cupao`, 'aviso');
    return null;
  }
  
  // Verificar se ja foi usado (uso unico)
  if (cupao.usoUnico) {
    const cupoesUsados = carregarLocal('cupoes_usados') || [];
    if (cupoesUsados.includes(cupao.codigo)) {
      toast('Este cupao ja foi utilizado', 'aviso');
      return null;
    }
  }
  
  salvarLocal('cupao_aplicado', cupao);
  notificarObservadores();
  toast(`Cupao ${codigo} aplicado com sucesso!`, 'sucesso');
  return cupao;
}

/**
 * Remove o cupao aplicado
 */
export function removerCupao() {
  removerLocal('cupao_aplicado');
  notificarObservadores();
  toast('Cupao removido', 'info');
}

/**
 * Obtem o cupao aplicado actualmente
 * @returns {Object|null}
 */
export function getCupaoAplicado() {
  return carregarLocal('cupao_aplicado');
}

/**
 * Calcula o desconto do cupao
 * @returns {number} Valor do desconto
 */
export function getDescontoCupao() {
  const cupao = getCupaoAplicado();
  if (!cupao) return 0;
  
  const subtotal = getSubtotal();
  
  if (cupao.tipo === 'percentual') {
    return Math.round((subtotal * cupao.valor) / 100);
  } else if (cupao.tipo === 'fixo') {
    return Math.min(cupao.valor, subtotal);
  }
  return 0;
}

/**
 * Calcula o total final (subtotal - desconto + entrega)
 * @param {number} valorEntrega - Valor da entrega
 * @returns {number} Total final
 */
export function getTotalFinal(valorEntrega = 0) {
  const subtotal = getSubtotal();
  const desconto = getDescontoCupao();
  return Math.max(0, subtotal - desconto + valorEntrega);
}

/**
 * Marca um cupao como usado
 * @param {string} codigo - Codigo do cupao
 */
export function marcarCupaoUsado(codigo) {
  const cupoesUsados = carregarLocal('cupoes_usados') || [];
  if (!cupoesUsados.includes(codigo)) {
    cupoesUsados.push(codigo);
    salvarLocal('cupoes_usados', cupoesUsados);
  }
}

/**
 * Finaliza a compra (limpa carrinho e cupao)
 */
export function finalizarCompra() {
  const cupao = getCupaoAplicado();
  if (cupao && cupao.usoUnico) {
    marcarCupaoUsado(cupao.codigo);
  }
  
  limparCarrinho();
  removerLocal('cupao_aplicado');
}

/**
 * Actualiza o contador visual do carrinho no UI
 */
function atualizarContadorUI() {
  const quantidade = getQuantidadeTotal();
  
  document.querySelectorAll('[data-carrinho-contador]').forEach(el => {
    el.textContent = quantidade;
    el.style.display = quantidade > 0 ? 'flex' : 'none';
  });
  
  document.querySelectorAll('.carrinho-contador').forEach(el => {
    el.textContent = quantidade;
    el.style.display = quantidade > 0 ? 'flex' : 'none';
  });
}

/**
 * Renderiza o carrinho num container
 * @param {HTMLElement} container - Container onde renderizar
 * @param {boolean} mostrarControles - Se deve mostrar botoes de quantidade
 */
export function renderizarCarrinho(container, mostrarControles = true) {
  if (!container) return;
  
  if (carrinho.length === 0) {
    container.innerHTML = `
      <div class="carrinho-vazio">
        <i class="fa-solid fa-bag-shopping"></i>
        <p>O seu carrinho esta vazio</p>
        <a href="loja.html" class="btn">Explorar Produtos</a>
      </div>
    `;
    return;
  }
  
  let html = '<div class="carrinho-itens">';
  
  carrinho.forEach(item => {
    const precoTotal = item.preco * item.quantidade;
    html += `
      <div class="carrinho-item" data-item-key="${item.itemKey}">
        <div class="carrinho-item-img">
          <img src="imagens/produtos/${item.imagem}" alt="${item.nome}">
        </div>
        <div class="carrinho-item-info">
          <h4>${item.nome}</h4>
          ${item.variante ? `<span class="carrinho-item-variante">${item.variante}</span>` : ''}
          ${item.cor ? `<span class="carrinho-item-cor">${item.cor}</span>` : ''}
          <div class="carrinho-item-preco">${formatarKz(item.preco)}</div>
        </div>
        ${mostrarControles ? `
          <div class="carrinho-item-controles">
            <div class="quantidade-control">
              <button class="quantidade-btn" data-action="decrementar" data-key="${item.itemKey}">
                <i class="fa-solid fa-minus"></i>
              </button>
              <span class="quantidade-valor">${item.quantidade}</span>
              <button class="quantidade-btn" data-action="incrementar" data-key="${item.itemKey}">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
            <button class="btn-remover" data-action="remover" data-key="${item.itemKey}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        ` : `
          <div class="carrinho-item-quantidade">
            ${item.quantidade} x ${formatarKz(item.preco)} = ${formatarKz(precoTotal)}
          </div>
        `}
      </div>
    `;
  });
  
  html += '</div>';
  
  // Resumo
  const subtotal = getSubtotal();
  const desconto = getDescontoCupao();
  const cupao = getCupaoAplicado();
  
  html += `
    <div class="carrinho-resumo">
      <div class="resumo-linha">
        <span>Subtotal</span>
        <span>${formatarKz(subtotal)}</span>
      </div>
      ${desconto > 0 ? `
        <div class="resumo-linha resumo-desconto">
          <span>Desconto ${cupao ? `(${cupao.codigo})` : ''}</span>
          <span>-${formatarKz(desconto)}</span>
        </div>
      ` : ''}
      <div class="resumo-linha resumo-total">
        <span>Total</span>
        <span>${formatarKz(subtotal - desconto)}</span>
      </div>
    </div>
  `;
  
  // Cupao
  if (mostrarControles) {
    html += `
      <div class="carrinho-cupao">
        <input type="text" id="cupao-input" placeholder="Codigo do cupao">
        <button class="btn btn-outline" id="aplicar-cupao">Aplicar</button>
        ${cupao ? `<button class="btn-ghost" id="remover-cupao">Remover</button>` : ''}
      </div>
    `;
  }
  
  container.innerHTML = html;
  
  // Event listeners
  if (mostrarControles) {
    container.querySelectorAll('[data-action="incrementar"]').forEach(btn => {
      btn.addEventListener('click', () => {
        incrementarQuantidade(btn.dataset.key);
        renderizarCarrinho(container, mostrarControles);
      });
    });
    
    container.querySelectorAll('[data-action="decrementar"]').forEach(btn => {
      btn.addEventListener('click', () => {
        decrementarQuantidade(btn.dataset.key);
        renderizarCarrinho(container, mostrarControles);
      });
    });
    
    container.querySelectorAll('[data-action="remover"]').forEach(btn => {
      btn.addEventListener('click', () => {
        removerDoCarrinho(btn.dataset.key);
        renderizarCarrinho(container, mostrarControles);
      });
    });
    
    document.getElementById('aplicar-cupao')?.addEventListener('click', () => {
      const input = document.getElementById('cupao-input');
      if (input && input.value) {
        aplicarCupao(input.value);
        renderizarCarrinho(container, mostrarControles);
        input.value = '';
      }
    });
    
    document.getElementById('remover-cupao')?.addEventListener('click', () => {
      removerCupao();
      renderizarCarrinho(container, mostrarControles);
    });
  }
}

/**
 * Inicializa o carrinho
 */
export function inicializarCarrinho() {
  const salvo = carregarLocal(CARRINHO_CHAVE);
  if (salvo) carrinho = salvo;
  atualizarContadorUI();
  notificarObservadores();
}

// Inicializar quando o DOM estiver pronto
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarCarrinho);
}

// Expor funcoes globalmente
if (typeof window !== 'undefined') {
  window.cart = {
    getCarrinho,
    getQuantidadeTotal,
    getSubtotal,
    adicionarAoCarrinho,
    removerDoCarrinho,
    atualizarQuantidade,
    incrementarQuantidade,
    decrementarQuantidade,
    limparCarrinho,
    estaNoCarrinho,
    getQuantidadeProduto,
    aplicarCupao,
    removerCupao,
    getCupaoAplicado,
    getDescontoCupao,
    getTotalFinal,
    finalizarCompra,
    renderizarCarrinho,
    observarCarrinho
  };
}
