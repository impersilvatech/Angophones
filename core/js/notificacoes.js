// ============================================
// NOTIFICACOES.JS – Sistema de Toast
// ============================================

const CONFIG = {
  duracaoPadrao: 4000,
  posicao: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
  maxToasts: 5
};

let container = null;
let toastsAtivos = [];

/**
 * Cria o container de toasts
 */
function criarContainer() {
  if (container) return container;
  
  container = document.createElement('div');
  container.className = 'toast-container';
  container.setAttribute('data-position', CONFIG.posicao);
  document.body.appendChild(container);
  
  return container;
}

/**
 * Remove toasts antigos se exceder o máximo
 */
function limitarToasts() {
  while (toastsAtivos.length > CONFIG.maxToasts) {
    const toastAntigo = toastsAtivos.shift();
    if (toastAntigo && toastAntigo.parentNode) {
      toastAntigo.classList.add('toast-fechar');
      setTimeout(() => toastAntigo.remove(), 300);
    }
  }
}

/**
 * Ícones para cada tipo de toast
 */
const icones = {
  sucesso: 'fa-circle-check',
  erro: 'fa-circle-exclamation',
  info: 'fa-circle-info',
  aviso: 'fa-triangle-exclamation',
  loading: 'fa-spinner fa-spin'
};

/**
 * Cores de borda para cada tipo
 */
const cores = {
  sucesso: '#22C55E',
  erro: '#EF4444',
  info: '#3B82F6',
  aviso: '#F59E0B',
  loading: '#FF5500'
};

/**
 * Exibe um toast
 * @param {string} mensagem - Mensagem a exibir
 * @param {string} tipo - 'sucesso', 'erro', 'info', 'aviso', 'loading'
 * @param {number} duracao - Duração em ms (0 para não fechar automaticamente)
 * @returns {HTMLElement} Elemento do toast
 */
export function toast(mensagem, tipo = 'info', duracao = CONFIG.duracaoPadrao) {
  const containerEl = criarContainer();
  
  // Criar elemento
  const toastEl = document.createElement('div');
  toastEl.className = `toast toast-${tipo}`;
  toastEl.style.borderLeftColor = cores[tipo] || cores.info;
  
  // Ícone
  const iconEl = document.createElement('i');
  iconEl.className = `fa-solid ${icones[tipo] || icones.info}`;
  iconEl.style.color = cores[tipo] || cores.info;
  toastEl.appendChild(iconEl);
  
  // Mensagem
  const mensagemEl = document.createElement('span');
  mensagemEl.textContent = mensagem;
  mensagemEl.style.flex = '1';
  toastEl.appendChild(mensagemEl);
  
  // Botão de fechar (opcional)
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.color = '#A0A0A8';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.padding = '4px';
  closeBtn.style.fontSize = '14px';
  closeBtn.addEventListener('click', () => fecharToast(toastEl));
  toastEl.appendChild(closeBtn);
  
  containerEl.appendChild(toastEl);
  toastsAtivos.push(toastEl);
  limitarToasts();
  
  // Auto-fechar após duração
  let timeout;
  if (duracao > 0 && tipo !== 'loading') {
    timeout = setTimeout(() => fecharToast(toastEl), duracao);
  }
  
  // Guardar referência ao timeout
  toastEl._timeout = timeout;
  
  return toastEl;
}

/**
 * Fecha um toast específico
 * @param {HTMLElement} toastEl - Elemento do toast
 */
export function fecharToast(toastEl) {
  if (!toastEl || !toastEl.parentNode) return;
  
  // Limpar timeout
  if (toastEl._timeout) {
    clearTimeout(toastEl._timeout);
  }
  
  // Remover da lista de ativos
  const index = toastsAtivos.indexOf(toastEl);
  if (index > -1) toastsAtivos.splice(index, 1);
  
  // Animar saída
  toastEl.classList.add('toast-fechar');
  setTimeout(() => {
    if (toastEl.parentNode) {
      toastEl.remove();
    }
  }, 300);
}

/**
 * Fecha todos os toasts
 */
export function fecharTodosToasts() {
  [...toastsAtivos].forEach(toast => fecharToast(toast));
}

/**
 * Toast de sucesso
 * @param {string} mensagem - Mensagem
 * @param {number} duracao - Duração
 */
export function sucesso(mensagem, duracao) {
  return toast(mensagem, 'sucesso', duracao);
}

/**
 * Toast de erro
 * @param {string} mensagem - Mensagem
 * @param {number} duracao - Duração
 */
export function erro(mensagem, duracao) {
  return toast(mensagem, 'erro', duracao);
}

/**
 * Toast de informação
 * @param {string} mensagem - Mensagem
 * @param {number} duracao - Duração
 */
export function info(mensagem, duracao) {
  return toast(mensagem, 'info', duracao);
}

/**
 * Toast de aviso
 * @param {string} mensagem - Mensagem
 * @param {number} duracao - Duração
 */
export function aviso(mensagem, duracao) {
  return toast(mensagem, 'aviso', duracao);
}

/**
 * Toast de loading (não fecha automaticamente)
 * @param {string} mensagem - Mensagem
 * @returns {Function} Função para fechar/dismiss
 */
export function loading(mensagem = 'A processar...') {
  const toastEl = toast(mensagem, 'loading', 0);
  return {
    dismiss: () => fecharToast(toastEl),
    sucesso: (novaMensagem) => {
      fecharToast(toastEl);
      return sucesso(novaMensagem);
    },
    erro: (novaMensagem) => {
      fecharToast(toastEl);
      return erro(novaMensagem);
    }
  };
}

/**
 * Configura opções globais
 * @param {Object} opcoes - Opções de configuração
 */
export function configurar(opcoes) {
  Object.assign(CONFIG, opcoes);
}

// Expor funções globalmente
if (typeof window !== 'undefined') {
  window.notificacoes = {
    toast,
    sucesso,
    erro,
    info,
    aviso,
    loading,
    fecharToast,
    fecharTodosToasts,
    configurar
  };
}
