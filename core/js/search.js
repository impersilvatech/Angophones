// ============================================
// SEARCH.JS – Filtro de pesquisa global
// ============================================

import { debounce } from './utils.js';

let campoPesquisa = null;
let containerResultados = null;
let callbackRender = null;
let termoAtual = '';

/**
 * Configura a pesquisa
 * @param {Object} opcoes - Opcoes de configuracao
 * @param {string} opcoes.inputSelector - Seletor do campo de pesquisa
 * @param {string} opcoes.containerSelector - Seletor do container de resultados
 * @param {Function} opcoes.renderCallback - Funcao que renderiza os resultados
 * @param {number} opcoes.debounceTime - Tempo de debounce em ms (padrao 300)
 */
export function configurarPesquisa(opcoes) {
  const {
    inputSelector,
    containerSelector,
    renderCallback,
    debounceTime = 300
  } = opcoes;
  
  campoPesquisa = document.querySelector(inputSelector);
  containerResultados = document.querySelector(containerSelector);
  callbackRender = renderCallback;
  
  if (!campoPesquisa) {
    console.warn('Campo de pesquisa nao encontrado:', inputSelector);
    return;
  }
  
  if (!containerResultados) {
    console.warn('Container de resultados nao encontrado:', containerSelector);
    return;
  }
  
  if (!callbackRender) {
    console.warn('Callback de renderizacao nao fornecido');
    return;
  }
  
  // Funcao de pesquisa com debounce
  const pesquisarComDebounce = debounce((termo) => {
    termoAtual = termo;
    const resultados = filtrarProdutos(termo);
    callbackRender(resultados, termo);
    
    // Actualizar URL com termo de pesquisa (opcional)
    atualizarURL(termo);
  }, debounceTime);
  
  // Event listener
  campoPesquisa.addEventListener('input', (e) => {
    pesquisarComDebounce(e.target.value);
  });
  
  // Limpar pesquisa com Escape
  campoPesquisa.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      campoPesquisa.value = '';
      pesquisarComDebounce('');
    }
  });
  
  // Verificar se ha termo na URL
  const urlParams = new URLSearchParams(window.location.search);
  const termoURL = urlParams.get('q');
  if (termoURL) {
    campoPesquisa.value = termoURL;
    pesquisarComDebounce(termoURL);
  }
}

/**
 * Filtra os produtos baseado no termo de pesquisa
 * @param {string} termo - Termo de pesquisa
 * @returns {Array} Produtos filtrados
 */
export function filtrarProdutos(termo) {
  const produtos = window.CATALOGO?.produtos || [];
  
  if (!termo || termo.trim() === '') {
    return produtos;
  }
  
  const termoLower = termo.toLowerCase().trim();
  const palavras = termoLower.split(/\s+/);
  
  return produtos.filter(produto => {
    const textoPesquisa = [
      produto.nome,
      produto.descricao,
      produto.descricaoLonga,
      produto.categoria,
      ...(produto.cores || []),
      ...(produto.variantes?.map(v => v.nome) || [])
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Todas as palavras devem estar presentes
    return palavras.every(palavra => textoPesquisa.includes(palavra));
  });
}

/**
 * Filtra produtos por categoria
 * @param {string} categoriaId - ID da categoria
 * @returns {Array} Produtos da categoria
 */
export function filtrarPorCategoria(categoriaId) {
  const produtos = window.CATALOGO?.produtos || [];
  
  if (!categoriaId || categoriaId === 'todos') {
    return produtos;
  }
  
  return produtos.filter(produto => produto.categoria === categoriaId);
}

/**
 * Filtra produtos por faixa de preco
 * @param {Array} produtos - Lista de produtos
 * @param {number} min - Preco minimo
 * @param {number} max - Preco maximo
 * @returns {Array} Produtos filtrados
 */
export function filtrarPorPreco(produtos, min, max) {
  return produtos.filter(produto => {
    const preco = produto.precoPromocional || produto.preco;
    return preco >= min && preco <= max;
  });
}

/**
 * Ordena produtos
 * @param {Array} produtos - Lista de produtos
 * @param {string} ordenacao - Tipo de ordenacao ('nome', 'preco-asc', 'preco-desc', 'destaque')
 * @returns {Array} Produtos ordenados
 */
export function ordenarProdutos(produtos, ordenacao) {
  const copia = [...produtos];
  
  switch (ordenacao) {
    case 'nome':
      return copia.sort((a, b) => a.nome.localeCompare(b.nome));
    case 'preco-asc':
      return copia.sort((a, b) => {
        const precoA = a.precoPromocional || a.preco;
        const precoB = b.precoPromocional || b.preco;
        return precoA - precoB;
      });
    case 'preco-desc':
      return copia.sort((a, b) => {
        const precoA = a.precoPromocional || a.preco;
        const precoB = b.precoPromocional || b.preco;
        return precoB - precoA;
      });
    case 'destaque':
      return copia.sort((a, b) => {
        if (a.destaque && !b.destaque) return -1;
        if (!a.destaque && b.destaque) return 1;
        return 0;
      });
    default:
      return copia;
  }
}

/**
 * Actualiza a URL com o termo de pesquisa
 * @param {string} termo - Termo de pesquisa
 */
function atualizarURL(termo) {
  const url = new URL(window.location);
  if (termo) {
    url.searchParams.set('q', termo);
  } else {
    url.searchParams.delete('q');
  }
  window.history.replaceState({}, '', url);
}

/**
 * Obtem o termo de pesquisa actual
 * @returns {string}
 */
export function getTermoAtual() {
  return termoAtual;
}

/**
 * Limpa a pesquisa
 */
export function limparPesquisa() {
  if (campoPesquisa) {
    campoPesquisa.value = '';
    termoAtual = '';
  }
}

/**
 * Destaca o termo de pesquisa no texto
 * @param {string} texto - Texto original
 * @param {string} termo - Termo a destacar
 * @returns {string} HTML com termo destacado
 */
export function destacarTermo(texto, termo) {
  if (!termo || !texto) return texto;
  
  const palavras = termo.split(/\s+/).filter(p => p.length > 1);
  let resultado = texto;
  
  palavras.forEach(palavra => {
    const regex = new RegExp(`(${palavra})`, 'gi');
    resultado = resultado.replace(regex, '<mark class="search-highlight">$1</mark>');
  });
  
  return resultado;
}

// Expor funcoes globalmente
if (typeof window !== 'undefined') {
  window.search = {
    configurarPesquisa,
    filtrarProdutos,
    filtrarPorCategoria,
    filtrarPorPreco,
    ordenarProdutos,
    getTermoAtual,
    limparPesquisa,
    destacarTermo
  };
}
