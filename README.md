# Apex Run

Jogo arcade 3D de direção no navegador, feito com Vite, JavaScript e Three.js. O foco desta primeira versão é iniciar rápido, dirigir uma volta completa e repetir para melhorar o recorde.

## Executar

Requer Node.js 20.19+ ou 22.12+.

### Windows (mais simples)

Use o atalho [launcher-windows.vbs](launcher-windows.vbs) ou clique em [start-game.bat](start-game.bat).

Ou no terminal:

```bash
npm install
npm start
```

### Linux (mais simples)

Use [start-game.sh](start-game.sh) ou o arquivo [launcher-linux.desktop](launcher-linux.desktop) para criar um atalho.

No terminal:

```bash
chmod +x ./start-game.sh
./start-game.sh
```

### Desktop local sem terminal

Abra [desktop-launcher.html](desktop-launcher.html) e clique em “Jogar”. Ele leva para a versão compilada em [dist/index.html](dist/index.html).

### Android / iPhone

Abra o jogo no navegador do celular e escolha a opção de instalar como app na tela inicial ou em “Adicionar à tela inicial”. Isso funciona como PWA e fica bem mais estável que abrir como arquivo simples.

Se preferir, também pode usar:

```bash
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
- AUTO: assistência automática regula acelerador e velocidade conforme curvas e árvores próximas; pode ser desligada na HUD.
- Segure Shift ou o botão ⚡ TURBO: impulso temporário com carga que recarrega ao soltar. O botão AUTO continua acelerando automaticamente durante o turbo.
- Colisão acima de 250 km/h encerra a corrida. Celular: use os controles na tela, incluindo o botão de turbo.
- Recordes e créditos ficam salvos neste navegador.

## Stack

HTML, CSS e JavaScript formam o app que carrega diretamente no navegador; Three.js desenha a pista e o carro com WebGL. Flutter, Java, Python e C# não fazem parte deste protótipo porque exigiriam runtimes/serviços extras e aumentariam o tempo de carregamento sem melhorar a condução local. Eles podem ser adicionados depois para clientes nativos, serviços de conta/leaderboard ou ferramentas de conteúdo, cada um com uma responsabilidade definida.