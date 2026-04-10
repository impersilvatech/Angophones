// ============================================
// TEMA.JS – Gestao de modo claro/escuro
// ============================================

(function() {
  'use strict';
  
  const TEMA_CHAVE = 'tema_loja';
  const TEMA_CLARO = 'claro';
  const TEMA_ESCURO = 'escuro';
  const CLASSE_TEMA_CLARO = 'tema-claro';
  
  /**
   * Obtem o tema actual
   */
  function getTema() {
    const temaSalvo = localStorage.getItem(TEMA_CHAVE);
    if (temaSalvo === TEMA_CLARO || temaSalvo === TEMA_ESCURO) {
      return temaSalvo;
    }
    
    // Verificar preferencia do sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return TEMA_CLARO;
    }
    
    return TEMA_ESCURO;
  }
  
  /**
   * Aplica o tema ao documento
   */
  function aplicarTema(tema) {
    const body = document.body;
    
    if (tema === TEMA_CLARO) {
      body.classList.add(CLASSE_TEMA_CLARO);
    } else {
      body.classList.remove(CLASSE_TEMA_CLARO);
    }
    
    // Atualizar meta tag theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', tema === TEMA_CLARO ? '#F5F5F7' : '#06060E');
    }
    
    // Disparar evento para outros componentes
    window.dispatchEvent(new CustomEvent('temaAlterado', { detail: { tema } }));
  }
  
  /**
   * Alterna entre claro e escuro
   */
  function alternarTema() {
    const temaAtual = getTema();
    const novoTema = temaAtual === TEMA_ESCURO ? TEMA_CLARO : TEMA_ESCURO;
    
    localStorage.setItem(TEMA_CHAVE, novoTema);
    aplicarTema(novoTema);
    
    console.log('Tema alterado para:', novoTema);
    return novoTema;
  }
  
  /**
   * Define o tema
   */
  function setTema(tema) {
    if (tema !== TEMA_CLARO && tema !== TEMA_ESCURO) return;
    localStorage.setItem(TEMA_CHAVE, tema);
    aplicarTema(tema);
  }
  
  /**
   * Inicializa o tema
   */
  function inicializarTema() {
    const tema = getTema();
    aplicarTema(tema);
    console.log('Tema inicializado:', tema);
  }
  
  // Expor funcoes globalmente
  window.tema = {
    getTema: getTema,
    setTema: setTema,
    alternarTema: alternarTema,
    inicializarTema: inicializarTema
  };
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarTema);
  } else {
    inicializarTema();
  }
  
})();
