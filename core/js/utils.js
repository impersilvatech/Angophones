// ============================================
// UTILS.JS – Funções utilitárias
// ============================================

/**
 * Debounce – limita a frequência de execução de uma função
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função com debounce aplicado
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle – garante que uma função seja executada no máximo uma vez por intervalo
 * @param {Function} func - Função a ser executada
 * @param {number} limit - Intervalo mínimo em ms
 * @returns {Function} Função com throttle aplicado
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Comprime uma imagem para WebP com qualidade ajustável
 * @param {File} file - Ficheiro de imagem
 * @param {number} quality - Qualidade (0-1), padrão 0.6
 * @param {number} maxWidth - Largura máxima, padrão 1200px
 * @returns {Promise<Blob>} Blob da imagem comprimida em WebP
 */
export async function compressImage(file, quality = 0.6, maxWidth = 1200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        // Criar canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para WebP
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Falha na compressão da imagem'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Erro ao ler ficheiro'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converte um Blob para base64
 * @param {Blob} blob - Blob a converter
 * @returns {Promise<string>} String base64
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Erro na conversão para base64'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Obtém o SHA de um ficheiro no GitHub (para actualização via API)
 * @param {string} token - Token de acesso do GitHub
 * @param {string} owner - Proprietário do repositório
 * @param {string} repo - Nome do repositório
 * @param {string} path - Caminho do ficheiro
 * @returns {Promise<string|null>} SHA do ficheiro ou null se não existir
 */
export async function getGitHubFileSha(token, owner, repo, path) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
    const data = await response.json();
    return data.sha;
  } catch (error) {
    console.error('Erro ao obter SHA:', error);
    throw error;
  }
}

/**
 * Faz commit de um ficheiro via GitHub API
 * @param {string} token - Token de acesso do GitHub
 * @param {string} owner - Proprietário do repositório
 * @param {string} repo - Nome do repositório
 * @param {string} path - Caminho do ficheiro
 * @param {string} content - Conteúdo do ficheiro
 * @param {string} message - Mensagem de commit
 * @param {string|null} sha - SHA do ficheiro (null se for novo)
 * @returns {Promise<Object>} Resposta da API
 */
export async function commitToGitHub(token, owner, repo, path, content, message, sha = null) {
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(content)))
  };
  if (sha) body.sha = sha;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `GitHub API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Gera um ID único (para novos produtos, etc.)
 * @returns {string} ID único baseado em timestamp e random
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Copia texto para a área de transferência
 * @param {string} text - Texto a copiar
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback para browsers antigos
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

/**
 * Valida um número de telefone angolano
 * @param {string} phone - Número de telefone
 * @returns {boolean} Verdadeiro se válido
 */
export function validateAngolanPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return /^(244)?[92]\d{8}$/.test(cleaned);
}

/**
 * Formata um número de telefone para exibição
 * @param {string} phone - Número de telefone
 * @returns {string} Telefone formatado
 */
export function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `+244 ${cleaned.slice(0, 1)} ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('244')) {
    return `+244 ${cleaned.slice(3, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)} ${cleaned.slice(10)}`;
  }
  return phone;
}

/**
 * Calcula o preço com desconto de cupão
 * @param {number} subtotal - Subtotal da compra
 * @param {Object} cupao - Objecto do cupão
 * @returns {number} Valor do desconto
 */
export function calcularDescontoCupao(subtotal, cupao) {
  if (!cupao || !cupao.ativo) return 0;
  
  const hoje = new Date();
  if (cupao.validoAte && new Date(cupao.validoAte) < hoje) return 0;
  if (cupao.minimoCompra && subtotal < cupao.minimoCompra) return 0;
  
  if (cupao.tipo === 'percentual') {
    return Math.round((subtotal * cupao.valor) / 100);
  } else if (cupao.tipo === 'fixo') {
    return Math.min(cupao.valor, subtotal);
  }
  return 0;
}

// Tornar funções disponíveis globalmente (útil para debug)
if (typeof window !== 'undefined') {
  window.utils = {
    debounce,
    throttle,
    compressImage,
    blobToBase64,
    generateId,
    copyToClipboard,
    validateAngolanPhone,
    formatPhone,
    calcularDescontoCupao
  };
}
