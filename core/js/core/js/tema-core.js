// ============================================
// TEMA-CORE.JS – Gestao de modo claro/escuro
// ============================================

import { salvarLocal, carregarLocal } from './core.js';

const TEMA_CHAVE = 'tema';
const TEMA_CLARO = 'claro';
const TEMA_ESCURO = 'escuro';
const CLASSE_TEMA_CLARO = 'tema-claro';

/**
 * Obtem o tema actual
 * @returns {string} 'claro' ou 'escuro'
 */
export function getTema() {
  // Verificar localStorage primeiro
  const temaSalvo = carregarLocal(TEMA_CHAVE);
  if (temaSalvo) return temaSalvo;
  
  // Verificar preferencia do sistema
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return TEMA_CLARO;
  }
  
  // Padrao: escuro (Angophones e dark por padrao)
  return TEMA_ESCURO;
}

/**
 * Aplica o tema ao documento
 * @param {string} tema - 'claro' ou 'escuro'
 */
export function aplicarTema(tema) {
  const body = document.body;
  
  if (tema === TEMA_CLARO) {
    body.classList.add(CLASSE_TEMA_CLARO);
  } else {
    body.classList.remove(CLASSE_TEMA_CLARO);
  }
  
  // Actualizar meta tag theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    const corFundo = tema === TEMA_CLARO ? '#F5F5F7' : '#06060E';
    metaThemeColor.setAttribute('content', corFundo);
  }
  
  // Actualizar icones de toggle
  atualizarIconeToggle(tema);
}

/**
 * Alterna entre claro e escuro
 */
export function alternarTema() {
  const temaAtual = getTema();
  const novoTema = temaAtual === TEMA_ESCURO ? TEMA_CLARO : TEMA_ESCURO;
  
  salvarLocal(TEMA_CHAVE, novoTema);
  aplicarTema(novoTema);
  
  return novoTema;
}

/**
 * Define o tema
 * @param {string} tema - 'claro' ou 'escuro'
 */
export function setTema(tema) {
  if (tema !== TEMA_CLARO && tema !== TEMA_ESCURO) return;
  salvarLocal(TEMA_CHAVE, tema);
  aplicarTema(tema);
}

/**
 * Actualiza o icone do botao de toggle
 * @param {string} tema - Tema actual
 */
function atualizarIconeToggle(tema) {
  const toggles = document.querySelectorAll('[data-tema-toggle]');
  toggles.forEach(toggle => {
    const icon = toggle.querySelector('i');
    if (icon) {
      if (tema === TEMA_ESCURO) {
        icon.className = icon.className.replace(/fa-sun|fa-moon/g, 'fa-sun');
      } else {
        icon.className = icon.className.replace(/fa-sun|fa-moon/g, 'fa-moon');
      }
    }
  });
}

/**
 * Cria o botao de toggle de tema
 * @returns {HTMLElement} Botao de toggle
 */
export function criarToggleTema() {
  const button = document.createElement('button');
  button.className = 'btn-icon tema-toggle';
  button.setAttribute('data-tema-toggle', '');
  button.setAttribute('aria-label', 'Alternar tema');
  
  const temaAtual = getTema();
  const icon = document.createElement('i');
  icon.className = temaAtual === TEMA_ESCURO ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
  button.appendChild(icon);
  
  button.addEventListener('click', () => {
    const novoTema = alternarTema();
    const newIcon = button.querySelector('i');
    newIcon.className = novoTema === TEMA_ESCURO ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
  });
  
  return button;
}

/**
 * Inicializa o tema ao carregar a pagina
 */
export function inicializarTema() {
  const tema = getTema();
  aplicarTema(tema);
  
  // Ouvir mudancas na preferencia do sistema
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // So actualiza se o utilizador nao tiver definido preferencia manual
      if (!carregarLocal(TEMA_CHAVE)) {
        const novoTema = e.matches ? TEMA_ESCURO : TEMA_CLARO;
        aplicarTema(novoTema);
      }
    });
  }
}

// Auto-inicializar se estiver no browser
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarTema);
}

// Expor funcoes globalmente
if (typeof window !== 'undefined') {
  window.tema = {
    getTema,
    setTema,
    alternarTema,
    criarToggleTema,
    inicializarTema
  };
}
