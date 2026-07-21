# Axel — o mascote do Flux

Artes originais da designer (fundo transparente, 1080×1350; o pódio é 1920×1080).
As versões **otimizadas para o app** (recortadas e reduzidas a 720px) ficam em
`public/brand/axel/` — é de lá que o site carrega. O mapa central de uso no
código é `src/lib/axel.ts`.

| Fonte (esta pasta) | Arquivo no app | Onde aparece |
|---|---|---|
| 01-inscrever-pitch | axel-inscrever.png | Cabeçalho da tela Inscrever pitch; passo 1 do Como funciona |
| 02-em-desenvolvimento | axel-dev.png | Kanban (coluna Em desenvolvimento vazia); popup de etapa; passo 2 |
| 03-backlog | axel-backlog.png | Kanban (Backlog vazio); popup de etapa; seção Categorias do Como funciona |
| 04-concluido | axel-concluido.png | Kanban (Concluído vazio); popup de etapa; seção Critérios |
| 05-acesso-enterprise | axel-enterprise.png | Popup "acesso Claude Enterprise liberado"; seção Tangível |
| 06-acesso-basic | axel-basic.png | Popup "acesso Claude Basic liberado"; seção Intangível |
| 07-inscrito | axel-inscrito.png | Kanban (Inscrito vazio); popup de etapa; fecho do Como funciona |
| 08-aguardando-avaliacao | axel-avaliacao.png | Kanban (Aguardando Avaliação vazio); popup de etapa; passo 3 |
| 09-ciclo-ativo-home | axel-ciclo.png | Home (card do Flux, só com ciclo ativo); hero do Como funciona |
| 10-reprovado | axel-reprovado.png | Kanban (Reprovado vazio); popup de etapa; seção Regras |
| 11-ranking-podio | axel-ranking.png | Ranking global vazio; passo 4 do Como funciona |
| 12-categoria-produtividade-yoga | axel-cat-produtividade.png | Card da categoria Produtividade e Eficiência |
| 13-categoria-qualidade-cafe | axel-cat-qualidade.png | Card da categoria Qualidade e Tomada de Decisão |
| 14-categoria-experiencia-dedao1 | axel-cat-experiencia.png | Card da categoria Experiência do Cliente |
| 15-categoria-inovacao-disco-voador | axel-cat-inovacao.png | Card da categoria Inovação e Competitividade |
| 16-categoria-reducao-livro-moedas | axel-cat-reducao.png | Card da categoria Redução de Custos |
| 17-historico-lua-violao | axel-historico.png | Histórico de ciclos vazio |
| 18-login-globo | axel-login.png | Tela de login |
| 19-sem-ciclo-foguetinho | axel-semciclo.png | Flux sem ciclo ativo |
| 20-gestor-skate | axel-gestor.png | Produtividade sem projetos |

Notas:
- Nos cards de categoria, o mascote aparece grande enquanto a categoria está
  em disputa e vira uma marca pequena no canto quando há um líder.
- As artes 12–20 vieram do chat (convertidas de WebP); a 15 teve a faixa
  dourada removida digitalmente a pedido do Daniel (21/07/2026) — o "F" do
  escudo foi preservado. Se a designer tiver os PNGs originais em alta,
  vale substituí-los aqui.
- Regenerar os arquivos do app: recortar pelo alpha com ~2% de margem e
  reduzir para 720px no lado maior (pódio: 1100px).
- `prompt.txt` é o briefing original da primeira leva.
