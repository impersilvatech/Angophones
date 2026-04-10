// loader.js - Carrega dados da pasta data/ e monta CATALOGO

(async function carregarCatalogo() {
  const basePath = 'data/';
  
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
      const resposta = await fetch(`${basePath}${nomeFicheiro}`);
      if (!resposta.ok) {
        throw new Error(`Erro ao carregar ${nomeFicheiro}: ${resposta.status}`);
      }
      const dados = await resposta.json();
      catalogo[chave] = dados;
    });

    await Promise.all(promessas);

    // Estruturar o CATALOGO de forma compatível com o restante código
    window.CATALOGO = {
      loja: catalogo.loja,
      categorias: catalogo.categorias,
      produtos: catalogo.produtos,
      cupoes: catalogo.cupoes,
      depoimentos: catalogo.depoimentos,
      features: catalogo.features,
      vitrine: catalogo.vitrine
    };

    // Disparar evento para informar que os dados estão prontos
    window.dispatchEvent(new CustomEvent('catalogoCarregado', { detail: window.CATALOGO }));
    
    console.log('Catálogo carregado com sucesso.');
  } catch (erro) {
    console.error('Falha ao carregar catálogo:', erro);
    // Opcional: exibir mensagem de erro na UI
    if (typeof toast === 'function') {
      toast('Erro ao carregar dados da loja. Recarregue a página.', 'erro');
    }
  }
})();
