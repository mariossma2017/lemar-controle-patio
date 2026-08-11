# LEMAR — Controle de Pátio

Aplicativo PWA desenvolvido para simplificar o controle operacional de carretas no pátio da Lemar, substituindo controles manuais realizados em caderno.

> **Isso não é um TMS, YMS ou Torre de Controle.** É o caderno digital do controlador de pátio: rápido, simples e feito para uso com uma mão, em pé, no meio da operação.

## Objetivo

Permitir que o controlador de pátio, em poucos segundos, consiga:

- Registrar a chegada de uma carreta.
- Registrar a saída de uma carreta.
- Alterar o status de uma carreta (disponível, na doca, aguardando, indisponível).
- Mandar uma carreta para uma doca.
- Consultar quais carretas estão disponíveis.
- Buscar uma carreta pela placa.
- Consultar o histórico de movimentações.
- Gerar e copiar uma passagem de turno para o WhatsApp.

## Funcionalidades

- **Dashboard** com indicadores em tempo real: carretas no pátio, disponíveis, na doca, aguardando, indisponíveis, chegadas e saídas do dia.
- **Busca instantânea** por placa, com resultado enquanto o usuário digita.
- **Registro de chegada** com placa, condição (vazia/carregada), localização inicial (pátio, doca ou aguardando) e observação opcional.
- **Registro de saída** com condição, destino e dados opcionais do motorista/cavalo.
- **Controle de status**: disponível, na doca, aguardando, indisponível (com motivo) e fora do pátio.
- **Painel de docas**, mostrando rapidamente quais estão ocupadas e quais estão livres.
- **Histórico de movimentações** com filtros por hoje, ontem, todas e por placa — inclusive o histórico individual de cada carreta.
- **Passagem de turno** gerada automaticamente, pronta para copiar e colar no WhatsApp.
- **Backup e restauração** dos dados em arquivo JSON.
- **Proteção contra duplicidade**: o app avisa se uma carreta já consta no pátio antes de registrar uma nova chegada.

## Como acessar

Abra a URL do GitHub Pages do projeto em qualquer navegador (celular ou computador).

## Como instalar no celular

1. Abra o link do aplicativo no Chrome (Android) ou Safari (iPhone).
2. Toque no menu do navegador e escolha **"Adicionar à tela inicial"** (ou use o botão **Instalar Aplicativo** dentro das Configurações do app, quando disponível).
3. O ícone **LEMAR Pátio** aparecerá na tela inicial do celular, abrindo em tela cheia, sem a barra do navegador.

## Como utilizar

1. Abra o aplicativo — a tela inicial mostra o resumo do pátio.
2. Carreta chegou → **REGISTRAR CHEGADA**.
3. Carreta foi para a doca → abra a carreta e toque em **MANDAR PARA DOCA**.
4. Carreta ficou disponível → **TORNAR DISPONÍVEL**.
5. Carreta saiu → **REGISTRAR SAÍDA**.
6. No fim do turno, abra **Turno** e toque em **COPIAR RESUMO** para colar no WhatsApp.

## Armazenamento local

Todos os dados operacionais (carretas, movimentações e configurações) são armazenados **localmente no dispositivo**, usando **IndexedDB**. Nenhum dado é enviado para o GitHub ou para qualquer servidor externo — o repositório hospeda apenas o código do aplicativo.

## Modo offline

O aplicativo funciona como **PWA offline-first**. Depois do primeiro acesso, um **Service Worker** guarda em cache os arquivos essenciais, permitindo que o app continue funcionando normalmente mesmo sem conexão com a internet. Os dados continuam sendo lidos e gravados no armazenamento local do dispositivo.

## Backup

Em **Configurações → Exportar Backup**, o aplicativo gera um arquivo `lemar-patio-backup-AAAA-MM-DD.json` contendo todas as carretas, movimentações e configurações.

## Restauração de backup

Em **Configurações → Restaurar Backup**, selecione um arquivo de backup exportado anteriormente. O aplicativo valida o arquivo antes de importar e avisa que os dados atuais do dispositivo serão substituídos.

## Estrutura do projeto

```
/
├── index.html            # estrutura da aplicação (telas e modais)
├── manifest.json         # configuração do PWA
├── service-worker.js     # cache offline-first
├── css/
│   └── style.css         # identidade visual Lemar
├── js/
│   ├── db.js              # camada de dados (IndexedDB)
│   ├── utils.js            # utilitários (datas, placas, etc.)
│   └── app.js               # lógica da aplicação e telas
├── icons/
│   └── icon.svg           # espaço reservado para o logotipo oficial
└── README.md
```

## Sobre o logotipo

O cabeçalho está preparado com um espaço reservado (`LOGO LEMAR`). Assim que o arquivo oficial do logotipo for fornecido, basta substituir `icons/icon.svg` e o elemento `.logo-placeholder` em `index.html`, sem alterar cores, proporções ou o design original da marca.

## Status desta versão

Primeira versão: 100% local, sem backend, sem login, sem sincronização em nuvem. A estrutura de dados foi organizada para permitir evoluções futuras (sincronização, múltiplos usuários, múltiplas unidades) sem necessidade de reescrever o aplicativo.
