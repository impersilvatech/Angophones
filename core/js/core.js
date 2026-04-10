// ============================================
// CORE.JS – Funções globais
// ============================================

import { formatPhone } from './utils.js';

// Prefixo para localStorage baseado no nome da loja
function getStoragePrefix() {
  if (window.CATALOGO?.loja?.nome) {
    return window.CATALOGO.loja.nome.toLowerCase().replace(/\s+/g, '');
  }
  return 'angophones'; // fallback
}

/**
 * Formata um valor para Kwanza (Kz)
 * @param {number} valor - Valor a formatar
 * @returns {string} Ex: "1.500,00 Kz"
 */
export function formatarKz(valor) {
  if (valor === null || valor === undefined) return '0,00 Kz';
  return valor.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' Kz';
}

/**
 * Gera o link do WhatsApp com a mensagem formatada
 * @param {Object} pedido - Dados do pedido
 * @param {string} pedido.nome - Nome do cliente
 * @param {string} pedido.telefone - Telefone do cliente
 * @param {string} pedido.provincia - Província
 * @param {string} pedido.municipio - Município
 * @param {string} pedido.bairro - Bairro
 * @param {string} pedido.tipoEntrega - Tipo de entrega
 * @param {Array} pedido.itens - Itens do carrinho
 * @param {number} pedido.total - Total da compra
 * @param {string} pedido.notas - Notas adicionais (opcional)
 * @returns {string} URL do WhatsApp
 */
export function gerarLinkWhatsApp(pedido) {
  const loja = window.CATALOGO?.loja || { nome: 'Angophones', whatsapp: '+244954288128' };
  
  let mensagem = `*🛍️ NOVA ENCOMENDA - ${loja.nome}*\n\n`;
  mensagem += `👤 *Cliente:* ${pedido.nome}\n`;
  mensagem += `📞 *Telefone:* ${formatPhone(pedido.telefone)}\n`;
  mensagem += `📍 *Localização:* ${pedido.provincia}, ${pedido.municipio}, ${pedido.bairro}\n`;
  mensagem += `🚚 *Tipo de Entrega:* ${pedido.tipoEntrega}\n`;
  
  if (pedido.notas) {
    mensagem += `📝 *Notas:* ${pedido.notas}\n`;
  }
  
  mensagem += `\n📦 *PRODUTOS:*\n`;
  pedido.itens.forEach((item, index) => {
    const precoTotal = item.preco * item.quantidade;
    mensagem += `${index + 1}. ${item.nome}`;
    if (item.variante) mensagem += ` (${item.variante})`;
    mensagem += `\n   ${item.quantidade} x ${formatarKz(item.preco)} = ${formatarKz(precoTotal)}\n`;
  });
  
  mensagem += `\n💰 *TOTAL:* ${formatarKz(pedido.total)}`;
  
  if (pedido.cupao) {
    mensagem += `\n🎫 *Cupão aplicado:* ${pedido.cupao}`;
  }
  
  mensagem += `\n\n✅ *Aguardamos confirmação.*`;
  
  const numero = loja.whatsapp.replace(/\D/g, '');
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * Salva dados no localStorage com prefixo da loja
 * @param {string} chave - Chave do item
 * @param {any} valor - Valor a guardar
 */
export function salvarLocal(chave, valor) {
  const prefixo = getStoragePrefix();
  localStorage.setItem(`${prefixo}_${chave}`, JSON.stringify(valor));
}

/**
 * Carrega dados do localStorage
 * @param {string} chave - Chave do item
 * @returns {any} Valor guardado ou null
 */
export function carregarLocal(chave) {
  const prefixo = getStoragePrefix();
  const item = localStorage.getItem(`${prefixo}_${chave}`);
  try {
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

/**
 * Remove um item do localStorage
 * @param {string} chave - Chave do item
 */
export function removerLocal(chave) {
  const prefixo = getStoragePrefix();
  localStorage.removeItem(`${prefixo}_${chave}`);
}

/**
 * Obtém a lista de províncias de Angola
 * @returns {Array} Lista de províncias
 */
export function getProvincias() {
  return [
    'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango', 
    'Cuanza Norte', 'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla',
    'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico',
    'Namibe', 'Uíge', 'Zaire'
  ];
}

/**
 * Obtém os municípios de uma província (simplificado)
 * @param {string} provincia - Nome da província
 * @returns {Array} Lista de municípios
 */
export function getMunicipios(provincia) {
  const municipiosPorProvincia = {
    'Luanda': ['Luanda', 'Cazenga', 'Viana', 'Cacuaco', 'Belas', 'Icolo e Bengo', 'Quiçama', 'Talatona', 'Kilamba Kiaxi'],
    'Benguela': ['Benguela', 'Lobito', 'Baía Farta', 'Cubal', 'Ganda', 'Chongorói', 'Balombo', 'Bocoio', 'Caimbambo'],
    'Huambo': ['Huambo', 'Caála', 'Bailundo', 'Londuimbali', 'Chicala-Cholohanga', 'Chinjenje', 'Ekunha', 'Longonjo', 'Mungo', 'Tchindjenje', 'Ucuma'],
    // Adicionar mais conforme necessário
  };
  return municipiosPorProvincia[provincia] || ['Centro'];
}

/**
 * Verifica se a loja está em modo de manutenção
 * @returns {boolean}
 */
export function isManutencao() {
  return carregarLocal('manutencao') || false;
}

/**
 * Define o modo de manutenção
 * @param {boolean} ativo - Estado
 */
export function setManutencao(ativo) {
  salvarLocal('manutencao', ativo);
}

/**
 * Obtém a configuração da loja
 * @returns {Object} Configuração completa
 */
export function getConfigLoja() {
  return window.CATALOGO?.loja || {};
}

/**
 * Verifica se a entrega é grátis baseado no valor
 * @param {number} subtotal - Subtotal da compra
 * @returns {boolean}
 */
export function isEntregaGratis(subtotal) {
  const loja = getConfigLoja();
  const gratisAcima = loja.entregas?.gratisAcima || 50000;
  return subtotal >= gratisAcima;
}

/**
 * Calcula o valor da entrega
 * @param {number} subtotal - Subtotal da compra
 * @returns {number} Valor da entrega
 */
export function calcularEntrega(subtotal) {
  if (isEntregaGratis(subtotal)) return 0;
  const loja = getConfigLoja();
  return loja.entregas?.taxaEntregaBase || 1500;
}

// Expor funções globalmente
if (typeof window !== 'undefined') {
  window.core = {
    formatarKz,
    gerarLinkWhatsApp,
    salvarLocal,
    carregarLocal,
    removerLocal,
    getProvincias,
    getMunicipios,
    isManutencao,
    setManutencao,
    isEntregaGratis,
    calcularEntrega
  };
}
