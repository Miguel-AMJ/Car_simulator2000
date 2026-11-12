# Apex Run

Jogo arcade 3D de direção no navegador, feito com Vite, JavaScript e Three.js. O foco desta primeira versão é iniciar rápido, dirigir uma volta completa e repetir para melhorar o recorde.

## Executar

Requer Node.js 20.19+ ou 22.12+.

```bash
npm install
npm run dev
```

Para validar ou gerar os arquivos de produção:

```bash
npm run build
npm run preview
```

## Publicar no GitHub Pages

1. Envie o projeto para um repositório no GitHub, usando a branch `main` ou `master`.
2. Em **Settings > Pages**, selecione **GitHub Actions** como origem de publicação.
3. Cada push nessas branches executará o workflow em `.github/workflows/deploy.yml`. Quando terminar, o endereço estará em **Settings > Pages** e na execução do workflow.

O Vite gera caminhos relativos para que os arquivos também funcionem quando o site estiver dentro do subcaminho do repositório. O diretório `dist/` é gerado pelo workflow e não precisa ser enviado ao Git.

## Jogar

- Sprint: complete três voltas antes do limite de 90 segundos.
- Drift attack: acumule pontos derrapando durante 60 segundos.
- Passeio livre: dirija sem cronômetro.
- WASD ou setas: acelerar, frear e virar. Espaço: freio de mão. Esc: pausar/retomar.
- Celular: use os controles na tela. Recordes e créditos ficam salvos neste navegador.

## Stack

HTML, CSS e JavaScript formam o app que carrega diretamente no navegador; Three.js desenha a pista e o carro com WebGL. Flutter, Java, Python e C# não fazem parte deste protótipo porque exigiriam runtimes/serviços extras e aumentariam o tempo de carregamento sem melhorar a condução local. Eles podem ser adicionados depois para clientes nativos, serviços de conta/leaderboard ou ferramentas de conteúdo, cada um com uma responsabilidade definida.