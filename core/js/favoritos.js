// ============================================
// FAVORITOS.JS – Gestao da lista de desejos (Wishlist)
// ============================================

import { salvarLocal, carregarLocal, removerLocal } from './core.js';
import { toast } from './toast.js';

const FAVORITOS_CHAVE = 'favoritos';

// Estado da wishlist
let favoritos = carregarLocal(FAVORITOS_CHAVE) || [];
let observadores = [];

/**
 * Notifica todos os observadores de mudancas na wishlist
 */
function notificarObservadores() {
  observadores.forEach(callback => callback(favoritos));
}

/**
 * Regista um observador para mudancas na wishlist
 * @param {Function} callback - Funcao a chamar quando a wishlist mudar
 * @returns {Function} Funcao para remover o observador
 */
export function observarFavoritos(callback) {
  observadores.push(callback);
  callback(favoritos);
  return () => {
    observadores = observadores.filter(cb => cb !== callback);
  };
}

/**
 * Obtem a lista de favoritos actual
 * @returns {Array} Itens favoritos
 */
export function getFavoritos() {
  return [...favoritos];
}

/**
 * Obtem o numero total de itens favoritos
 * @returns {number}
 */
export function getQuantidadeFavoritos() {
  return favoritos.length;
}

/**
 * Verifica se um produto esta nos favoritos
 * @param {string} produtoId - ID do produto
 * @returns {boolean}
 */
export function estaNosFavoritos(produtoId) {
  return favoritos.some(item => item.id === produtoId);
}

/**
 * Adiciona um produto aos favoritos
 * @param {Object} produto - Produto a adicionar
 */
export function adicionarAosFavoritos(produto) {
  if (!produto || !produto.id) {
    console.error('Produto invalido');
    return;
  }
  
  if (estaNosFavoritos(produto.id)) {
    toast('Produto ja esta nos favoritos', 'info');
    return;
  }
  
  const itemFavorito = {
    id: produto.id,
    nome: produto.nome,
    preco: produto.precoPromocional || produto.preco,
    imagem: produto.imagens?.[0] || 'placeholder.png',
    categoria: produto.categoria,
    dataAdicao: new Date().toISOString()
  };
  
  favoritos.push(itemFavorito);
  salvarLocal(FAVORITOS_CHAVE, favoritos);
  notificarObservadores();
  atualizarContadorUI();
  
  toast(`${produto.nome} adicionado aos favoritos`, 'sucesso');
}

/**
 * Remove um produto dos favoritos
 * @param {string} produtoId - ID do produto
 */
export function removerDosFavoritos(produtoId) {
  const produto = favoritos.find(item => item.id === produtoId);
  favoritos = favoritos.filter(item => item.id !== produtoId);
  salvarLocal(FAVORITOS_CHAVE, favoritos);
  notificarObservadores();
  atualizarContadorUI();
  
  if (produto) {
    toast(`${produto.nome} removido dos favoritos`, 'info');
  }
}

/**
 * Alterna o estado de favorito de um produto
 * @param {Object} produto - Produto
 * @returns {boolean} Novo estado (true = favorito)
 */
export function alternarFavorito(produto) {
  if (estaNosFavoritos(produto.id)) {
    removerDosFavoritos(produto.id);
    return false;
  } else {
    adicionarAosFavoritos(produto);
    return true;
  }
}

/**
 * Limpa todos os favoritos
 */
export function limparFavoritos() {
  favoritos = [];
  removerLocal(FAVORITOS_CHAVE);
  notificarObservadores();
  atualizarContadorUI();
  toast('Lista de favoritos limpa', 'info');
}

/**
 * Gera um link partilhavel da wishlist
 * @returns {string} URL com os IDs dos produtos favoritos
 */
export function gerarLinkPartilha() {
  if (favoritos.length === 0) {
    toast('Adicione produtos aos favoritos primeiro', 'aviso');
    return null;
  }
  
  const ids = favoritos.map(item => item.id).join(',');
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
  return `${baseUrl}/favoritos-partilha.html?ids=${ids}`;
}

/**
 * Copia o link de partilha para a area de transferencia
 */
export async function copiarLinkPartilha() {
  const link = gerarLinkPartilha();
  if (!link) return;
  
  try {
    await navigator.clipboard.writeText(link);
    toast('Link copiado para a area de transferencia', 'sucesso');
  } catch (err) {
    toast('Erro ao copiar link', 'erro');
  }
}

/**
 * Partilha a wishlist via WhatsApp
 */
export function partilharViaWhatsApp() {
  if (favoritos.length === 0) {
    toast('Adicione produtos aos favoritos primeiro', 'aviso');
    return;
  }
  
  const loja = window.CATALOGO?.loja || { nome: 'Angophones' };
  let mensagem = `*Minha Wishlist - ${loja.nome}*\n\n`;
  
  favoritos.forEach((item, index) => {
    mensagem += `${index + 1}. ${item.nome} - ${item.preco.toLocaleString('pt-AO')} Kz\n`;
  });
  
  mensagem += `\nVeja estes produtos em: ${window.location.origin}`;
  
  const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}

/**
 * Actualiza o contador visual no UI
 */
function atualizarContadorUI() {
  const quantidade = favoritos.length;
  
  document.querySelectorAll('[data-favoritos-contador]').forEach(el => {
    el.textContent = quantidade;
    el.style.display = quantidade > 0 ? 'flex' : 'none';
  });
  
  document.querySelectorAll('.favoritos-contador').forEach(el => {
    el.textContent = quantidade;
    el.style.display = quantidade > 0 ? 'flex' : 'none';
  });
}

/**
 * Cria o botao de favorito para um produto
 * @param {string} produtoId - ID do produto
 * @returns {HTMLElement} Botao de favorito
 */
export function criarBotaoFavorito(produtoId) {
  const button = document.createElement('button');
  button.className = 'btn-wishlist';
  button.setAttribute('data-favorito', produtoId);
  button.setAttribute('aria-label', 'Adicionar aos favoritos');
  
  const icon = document.createElement('i');
  const isFavorito = estaNosFavoritos(produtoId);
  icon.className = isFavorito ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
  button.appendChild(icon);
  
  if (isFavorito) {
    button.classList.add('ativo');
  }
  
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const produto = window.CATALOGO?.produtos?.find(p => p.id === produtoId);
    if (produto) {
      const isNowFavorito = alternarFavorito(produto);
      const newIcon = button.querySelector('i');
      newIcon.className = isNowFavorito ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
      
      if (isNowFavorito) {
        button.classList.add('ativo');
      } else {
        button.classList.remove('ativo');
      }
    }
  });
  
  return button;
}

/**
 * Inicializa a wishlist
 */
export function inicializarFavoritos() {
  const salvo = carregarLocal(FAVORITOS_CHAVE);
  if (salvo) favoritos = salvo;
  atualizarContadorUI();
  notificarObservadores();
}

// Inicializar quando o DOM estiver pronto
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarFavoritos);
}

// Expor funcoes globalmente
if (typeof window !== 'undefined') {
  window.favoritos = {
    getFavoritos,
    getQuantidadeFavoritos,
    estaNosFavoritos,
    adicionarAosFavoritos,
    removerDosFavoritos,
    alternarFavorito,
    limparFavoritos,
    gerarLinkPartilha,
    copiarLinkPartilha,
    partilharViaWhatsApp,
    criarBotaoFavorito,
    observarFavoritos
  };
}
