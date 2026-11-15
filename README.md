# Leal Craft — catálogo V2 | 40 peças

Catálogo artesanal de peças em MDF e corte a laser, adaptado do antigo site Leal D’Coração.

## O que esta versão já faz

- Página Leal Craft, com identidade artesanal em cores de madeira, verde sálvia e off-white.
- Abertura animada em CSS: placa MDF, nome Leal gravado e efeito de gravação/corte em CRAFT (~3 s). Aparece uma vez por sessão, tem botão para pular e respeita redução de movimento.
- Catálogo de 40 conceitos de produto, distribuídos em 8 categorias com 5 propostas cada (imagens vetoriais **ilustrativas**, não fotos reais).
- Filtros por categoria, busca, favoritos, detalhes do produto e carrinho com quantidades.
- Solicitação de orçamento pelo WhatsApp, sem preços no site nem na mensagem.
- Painel de administração em `/admin/` para gerenciar produtos e converter fotografias para WebP.

## Testar no PC sem publicar

1. Extraia o ZIP completo.
2. No Windows, execute `abrir-preview.bat` (requer Python instalado).
3. Abra o endereço exibido (`http://localhost:5500`).
4. Painel de produtos: `http://localhost:5500/admin/`.
5. Para visualizar a introdução novamente, feche a aba e abra em uma nova sessão privada, ou use outra janela anônima. Para pular a introdução, abra `/?skipIntro=1`.

## Antes de publicar

- **WhatsApp:** confira o número em `js/config.js`; ele foi preservado do site anterior.
- **Instagram/e-mail:** deixados ocultos até você configurar contas/endereços da Leal Craft em `js/config.js`.
- **Produtos:** os 40 conceitos estão ilustrados com imagens geradas digitalmente ou composições vetoriais próprias. **Não são fotos reais nem arquivos de corte prontos**. Avalie a viabilidade de cada modelo na SCULPFUN antes de prometer execução.
- **Hospedagem:** ainda não foi feito deploy. O ZIP é um projeto de site estático, pronto para envio ao GitHub e à hospedagem que você usar.

## Publicar no GitHub

Faça backup do repositório antigo, se desejar preservar seu histórico. Extraia todos os arquivos desta versão na pasta raiz do repositório que irá hospedar a Leal Craft, faça commit e push. Se o Render estiver ligado a esse repositório e branch, ele publicará o novo site automaticamente.

## Cadastrar peças pelo painel

1. Abra `/admin/`.
2. Escolha uma peça para editar ou clique em `+` para cadastrar.
3. Preencha nome, categoria, descrição, material, dimensão, personalização e detalhes.
4. Marque se a imagem é *ilustrativa* ou uma *fotografia real*.
5. Selecione todas as fotos do produto (se houver). As fotos selecionadas substituem a galeria da peça no pacote.
6. Clique em **Baixar atualização completa**.
7. Extraia o ZIP baixado sobre a pasta raiz do seu repositório, aceitando a substituição de `data/catalogo.js` e a inclusão das imagens. Faça commit e push no GitHub.

**Atenção:** o painel salva textos temporariamente no navegador, mas não publica diretamente no GitHub. As novas fotos selecionadas ainda precisam ser exportadas antes de fechar a aba. O painel é estático e não tem login; usuários visitantes não conseguem alterar o site publicado só por abrir `/admin/`, mas você não deve inserir dados privados nele.

## Principais arquivos

- `index.html` — estrutura do site e da introdução.
- `css/craft.css` — nova identidade visual (as regras antigas continuam em `css/styles.css`).
- `js/app.js` — filtros, carrinho, favoritos, introdução, WhatsApp.
- `data/catalogo.js` — produtos publicados.
- `js/config.js` — WhatsApp e contatos.
- `admin/index.html` e `admin/admin.js` — painel de edição e exportação.
- `public/images/demo/` — exemplos ilustrativos substituíveis.

### Importante sobre preços

Os preços foram retirados do catálogo público, do formulário do administrador e da mensagem enviada ao WhatsApp. A negociação é feita no atendimento.

## Revisar as 40 propostas

No painel `/admin/`, cada produto começa com **🕒 pendente de revisão**.
Marque **Revisado / aprovado** após analisar a peça; mantenha **Publicado** para exibi-la no catálogo ou desmarque para ocultar uma ideia. Você também pode editar nome, texto, imagem ou excluir o item.
As alterações são rascunhos locais até você clicar em **Baixar atualização completa** e publicar `data/catalogo.js` no GitHub. Os novos thumbnails conceituais já vêm incluídos neste pacote de projeto inicial.

As imagens foram **geradas para a Leal Craft** (não copiadas de catálogos de terceiros). Alguns modelos ilustram detalhes complexos que podem exigir revisão de geometria, encaixes, resistência e dimensões; portanto, o catálogo deixa explícito que são imagens ilustrativas e não peças já fabricadas.

### Categorias (5 itens cada)

Lembrancinhas · Decoração · Presentes personalizados · Datas comemorativas · Peças infantis · Peças 3D · Topos, nomes e placas · Temas especiais.
