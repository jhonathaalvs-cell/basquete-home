# Portal público — Liga Local de Basquete

O portal público utiliza o mesmo Firebase do painel administrativo. O painel grava os documentos e as páginas públicas fazem apenas leitura dos dados publicados.

## Estrutura

- `../admin-login.html`: login administrativo com Firebase Authentication.
- `../admin.html`: painel protegido para cadastrar e editar dados.
- `assets/portal.js`: renderização das páginas e leitura pública do Firestore.
- `assets/portal.css`: identidade visual compartilhada do portal.
- `../scripts/firebase-config.js`: inicialização única do Firebase.
- `../firestore.rules`: regras de acesso do Firestore.

## Coleções utilizadas

`jogadores`, `equipes`, `campeonatos`, `jogos`, `temporadas`, `noticias` e `estatisticas`.

Quando uma coleção ainda estiver vazia, a página correspondente mostra um estado vazio. O portal não inventa resultados, equipes ou atletas.

## Execução local

Abra a pasta raiz em um servidor HTTP, como a extensão Live Server do VS Code. Não abra os HTML diretamente com `file://`, porque os módulos do Firebase precisam de um servidor.

Exemplos:

- `http://localhost:5500/admin-login.html`
- `http://localhost:5500/portal-publico-liga/index.html`
- `http://localhost:5500/portal-publico-liga/jogadores.html`

## Segurança

As escritas são permitidas somente ao UID administrativo definido em `firestore.rules`. As coleções públicas devem conter apenas informações próprias para publicação.
