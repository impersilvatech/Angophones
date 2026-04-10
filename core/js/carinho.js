// ============================================
// CARRINHO.JS – Gestão do carrinho de compras
// ============================================

import { salvarLocal, carregarLocal, removerLocal } from './core.js';
import { toast } from './notificacoes.js';

const CARRINHO_CHAVE = 'carrinho';

// Estado do carrinho
let carrinho = carregarLocal(CARRINHO_CHAVE) || [];
let observadores = [];

/**
 * Notifica todos os observadores de mudanças no carrinho
 */
function notificarObservadores() {
  observadores.forEach(callback => callback(carrinho));
}

/**
 * Regista um observador para mudanças no carrinho
 * @param {Function} callback - Função a chamar quando o carrinho mudar
 * @returns {Function} Função para remover o observador
 */
export function observarCarrinho(callback) {
  observadores.push(callback);
  callback(carrinho); // Chamada inicial
  return () => {
    observadores = observadores.filter(cb => cb !== callback);
  };
}

/**
 * Obtém o carrinho actual
 * @returns {Array} Itens do carrinho
 */
export function getCarrinho() {
  return [...carrinho];
}

/**
 * Obtém o número total de itens no carrinho
 * @returns {number} Quantidade total
 */
export function getQuantidadeTotal() {
  return carrinho.reduce((total, item) => total + item.quantidade, 0);
}

/**
 * Obtém o subtotal (sem entrega)
 * @returns {number} Subtotal
 */
export function getSubtotal() {
  return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

/**
 * Adiciona um produto ao carrinho
 * @param {Object} produto - Produto a adicionar
 * @param {number} quantidade - Quantidade (padrão 1)
 * @param {string} variante - Variante selecionada (opcional)
 * @param {string} cor - Cor selecionada (opcional)
 */
export function adicionarAoCarrinho(produto, quantidade = 1, variante = null, cor = null) {
  if (!produto || !produto.id) {
    console.error('Produto inválido');
    return;
  }
  
  const preco = produto.precoPromocional || produto.preco;
  
  // Criar chave única para o item (considera variante e cor)
  const itemKey = `${produto.id}_${variante || ''}_${cor || ''}`;
  
  const itemExistente = carrinho.find(item => 
    item.itemKey === itemKey
  );
  
  if (itemExistente) {
    itemExistente.quantidade += quantidade;
  } else {
    carrinho.push({
      itemKey,
      id: produto.id,
      nome: produto.nome,
      preco: preco,
      imagem: produto.imagens?.[0] || 'placeholder.png',
      quantidade,
      variante,
      cor,
      categoria: produto.categoria
    });
  }
  
  salvarLocal(CARRINHO_CHAVE, carrinho);
  notificarObservadores();
  atualizarContadorUI();
}

/**
 * Remove um item do carrinho
 * @param {string} itemKey - Chave do item a remover
 */
export function removerDoCarrinho(itemKey) {
  carrinho = carrinho.filter(item => item.itemKey !== itemKey);
  salvarLocal(CARRINHO_CHAVE, carrinho);
  notificarObservadores();
  atualizarContadorUI();
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
  
  item.quantidade = quantidade;
  salvarLocal(CARRINHO_CHAVE, carrinho);
  notificarObservadores();
  atualizarContadorUI();
}

/**
 * Limpa todo o carrinho
 */
export function limparCarrinho() {
  carrinho = [];
  removerLocal(CARRINHO_CHAVE);
  notificarObservadores();
  atualizarContadorUI();
}

/**
 * Verifica se um produto está no carrinho
 * @param {string} produtoId - ID do produto
 * @returns {boolean}
 */
export function estaNoCarrinho(produtoId) {
  return carrinho.some(item => item.id === produtoId);
}

/**
 * Aplica um cupão de desconto
 * @param {string} codigo - Código do cupão
 * @returns {Object|null} Cupão aplicado ou null
 */
export function aplicarCupao(codigo) {
  const cupoes = window.CATALOGO?.cupoes || [];
  const cupao = cupoes.find(c => c.codigo === codigo.toUpperCase() && c.ativo);
  
  if (!cupao) {
    toast('Cupão inválido ou expirado', 'erro');
    return null;
  }
  
  // Verificar validade
  if (cupao.validoAte && new Date(cupao.validoAte) < new Date()) {
    toast('Cupão expirado', 'erro');
    return null;
  }
  
  // Verificar valor mínimo
  const subtotal = getSubtotal();
  if (cupao.minimoCompra && subtotal < cupao.minimoCompra) {
    toast(`Compra mínima de ${cupao.minimoCompra.toLocaleString()} Kz`, 'aviso');
    return null;
  }
  
  salvarLocal('cupao_aplicado', cupao);
  notificarObservadores();
  toast(`Cupão ${codigo} aplicado!`, 'sucesso');
  return cupao;
}

/**
 * Remove o cupão aplicado
 */
export function removerCupao() {
  removerLocal('cupao_aplicado');
  notificarObservadores();
  toast('Cupão removido', 'info');
}

/**
 * Obtém o cupão aplicado actualmente
 * @returns {Object|null}
 */
export function getCupaoAplicado() {
  return carregarLocal('cupao_aplicado');
}

/**
 * Calcula o desconto do cupão
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
 * Actualiza o contador visual do carrinho no UI
 */
function atualizarContadorUI() {
  const quantidade = getQuantidadeTotal();
  
  document.querySelectorAll('[data-carrinho-contador]').forEach(el => {
    el.textContent = quantidade;
    el.style.display = quantidade > 0 ? 'flex' : 'none';
  });
  
  // Actualizar também elementos com classe específica
  document.querySelectorAll('.carrinho-contador').forEach(el => {
    el.textContent = quantidade;
    el.style.display = quantidade > 0 ? 'flex' : 'none';
  });
}

/**
 * Inicializa o carrinho
 */
export function inicializarCarrinho() {
  // Carregar dados do localStorage
  const salvo = carregarLocal(CARRINHO_CHAVE);
  if (salvo) carrinho = salvo;
  
  atualizarContadorUI();
  notificarObservadores();
}

// Inicializar quando o DOM estiver pronto
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarCarrinho);
}

// Expor funções globalmente
if (typeof window !== 'undefined') {
  window.carrinho = {
    getCarrinho,
    getQuantidadeTotal,
    getSubtotal,
    adicionarAoCarrinho,
    removerDoCarrinho,
    atualizarQuantidade,
    limparCarrinho,
    estaNoCarrinho,
    aplicarCupao,
    removerCupao,
    getCupaoAplicado,
    getDescontoCupao,
    getTotalFinal,
    observarCarrinho
  };
}
