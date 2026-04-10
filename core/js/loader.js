// ============================================
// LOADER.JS – Carrega dados da pasta dados/ e monta CATALOGO
// ============================================

(async function carregarCatalogo() {
  console.log('Loader: Iniciando carregamento dos dados...');
  
  const basePath = 'dados/';  // CORRIGIDO: pasta correta
  
  // Mapeamento dos ficheiros
  const arquivos = {
    loja: 'loja.json',
    categorias: 'categorias.json',
    produtos: 'produtos.json',
    cupoes: 'cupoes.json',
    depoimentos: 'depoimentos.json',
    features: 'features.json',
    vitrine: 'vitrine.json'
  };

  const catalogo = {};

  try {
    // Carregar todos os ficheiros em paralelo
    const promessas = Object.entries(arquivos).map(async ([chave, nomeFicheiro]) => {
      const url = `${basePath}${nomeFicheiro}`;
      console.log(`Loader: Carregando ${url}...`);
      
      const resposta = await fetch(url);
      if (!resposta.ok) {
        console.warn(`Loader: Aviso - ${nomeFicheiro} nao encontrado (${resposta.status}). Usando fallback.`);
        // Fallback para cada tipo de ficheiro
        if (chave === 'features') return [];  // features pode estar vazio
        if (chave === 'cupoes') return [];
        if (chave === 'depoimentos') return [];
        if (chave === 'vitrine') return { heroTitulo: 'Angophones', heroBadge: 'Tech Premium', bannerAtivo: false };
        return null;
      }
      
      const dados = await resposta.json();
      console.log(`Loader: ${nomeFicheiro} carregado com sucesso.`);
      return dados;
    });

    const resultados = await Promise.all(promessas);
    
    // Atribuir resultados ao catalogo
    let index = 0;
    for (const chave of Object.keys(arquivos)) {
      catalogo[chave] = resultados[index];
      index++;
    }

    // Estruturar o CATALOGO de forma compatível
    window.CATALOGO = {
      loja: catalogo.loja || { nome: 'Angophones', slogan: 'O teu proximo telemovel esta aqui.', whatsapp: '+244954288128' },
      categorias: catalogo.categorias || [],
      produtos: catalogo.produtos || [],
      cupoes: catalogo.cupoes || [],
      depoimentos: catalogo.depoimentos || [],
      features: catalogo.features || [
        { icone: 'fa-truck-fast', titulo: 'Entrega em 24h', descricao: 'Luanda e provincias com tracking online.' },
        { icone: 'fa-certificate', titulo: 'Garantia Oficial', descricao: 'Todos os produtos com garantia de 2 anos.' },
        { icone: 'fa-whatsapp', titulo: 'Suporte WhatsApp', descricao: 'Respostas em menos de 5 minutos.' },
        { icone: 'fa-lock', titulo: 'Pagamento Seguro', descricao: 'Transferencia bancaria ou pagamento na entrega.' }
      ],
      vitrine: catalogo.vitrine || { heroTitulo: 'Angophones', heroBadge: 'Tech Premium', bannerAtivo: false }
    };

    console.log('Loader: Catalogo montado com sucesso!', window.CATALOGO);
    
    // Disparar evento para informar que os dados estao prontos
    window.dispatchEvent(new CustomEvent('catalogoCarregado', { detail: window.CATALOGO }));
    
  } catch (erro) {
    console.error('Loader: Falha ao carregar catalogo:', erro);
    
    // Criar catalogo de fallback para nao quebrar a pagina
    window.CATALOGO = {
      loja: { nome: 'Angophones', slogan: 'O teu proximo telemovel esta aqui.', whatsapp: '+244954288128', corPrimaria: '#FF5500' },
      categorias: [],
      produtos: [],
      cupoes: [],
      depoimentos: [],
      features: [
        { icone: 'fa-truck-fast', titulo: 'Entrega em 24h', descricao: 'Luanda e provincias com tracking online.' },
        { icone: 'fa-certificate', titulo: 'Garantia Oficial', descricao: 'Todos os produtos com garantia de 2 anos.' },
        { icone: 'fa-whatsapp', titulo: 'Suporte WhatsApp', descricao: 'Respostas em menos de 5 minutos.' },
        { icone: 'fa-lock', titulo: 'Pagamento Seguro', descricao: 'Transferencia bancaria ou pagamento na entrega.' }
      ],
      vitrine: { heroTitulo: 'Angophones', heroBadge: 'Tech Premium', bannerAtivo: false }
    };
    
    window.dispatchEvent(new CustomEvent('catalogoCarregado', { detail: window.CATALOGO }));
  }
})();
