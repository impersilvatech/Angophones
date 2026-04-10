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
 * Limpa todo o carrin
