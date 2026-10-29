# Portal público — Liga Local de Basquete

Pacote de interface estática para ser adicionado ao repositório atual. Não altera nem substitui os arquivos existentes do projeto.

## Conteúdo incluído

- Página inicial (`index.html`)
- Jogos e resultados (`jogos.html`)
- Classificação (`classificacao.html`)
- Catálogo de equipes e perfil da equipe (`equipes.html`, `equipe.html`)
- Catálogo de jogadores e perfil individual (`jogadores.html`, `jogador.html`)
- Estatísticas (`estatisticas.html`)
- Arquivo de temporadas e detalhe (`temporadas.html`, `temporada.html`)
- História da liga (`historia.html`)
- Notícias e detalhe de notícia (`noticias.html`, `noticia.html`)
- Estilos compartilhados e renderização de conteúdo em `assets/`

## Como testar sem mexer no site existente

1. Extraia a pasta `portal-publico-liga`.
2. Copie a pasta inteira para a raiz do repositório `basquete-liga-local`, preservando o nome `portal-publico-liga`.
3. Faça commit e push.
4. Acesse `https://jhonathaalvs-cell.github.io/basquete-liga-local/portal-publico-liga/`.

As imagens são referenciadas a partir dos ativos existentes em `../imagens/`. O pacote deve ser mantido dentro do repositório para esses caminhos funcionarem.

## Quando decidir tornar o portal a página inicial

O `index.html` atual da raiz é o login. Não o sobrescreva antes de adaptar o fluxo administrativo. Faça uma cópia dele para uma rota administrativa escolhida por você, revise `scripts/login.js` para conferir os redirecionamentos pós-login e remova o cadastro público da interface administrativa. Depois, migre os arquivos públicos para a raiz e ajuste `ASSET_ROOT` de `../imagens/` para `imagens/` em `assets/portal.js`; revise também os links relativos e os caminhos das folhas de estilo.

**Importante:** esconder o caminho de administração não é controle de acesso. Antes de publicar mudanças, faça a autorização real do administrador no Firebase Authentication e proteja as operações de gravação no Firestore com regras de segurança. Isso está fora do escopo deste pacote.

## Backend futuro

`assets/portal.js` centraliza os dados de demonstração no objeto `DEMO_DATA`. Substitua essa fonte por funções de leitura do Firebase ou por uma camada de serviços, mantendo as funções de renderização. A proposta de entidades é: temporadas, equipes, jogadores permanentes, participações por temporada, jogos, estatísticas, premiações e notícias.

## Aviso sobre os dados

Os nomes de algumas equipes reutilizam logotipos que já estavam presentes no repositório; placares, campanhas, estatísticas, temporadas e notícias deste pacote são exemplos de layout, não registros oficiais. A faixa de demonstração é exibida em todas as páginas. Remova-a somente quando os dados reais estiverem conectados e validados.
