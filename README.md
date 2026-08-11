# LEMAR — Controle de Pátio

Aplicativo PWA desenvolvido para simplificar o controle operacional de carretas no pátio da Lemar, substituindo controles manuais realizados em caderno.

> **Isso não é um TMS, YMS ou Torre de Controle.** É o caderno digital do controlador de pátio: rápido, simples e feito para uso com uma mão, em pé, no meio da operação.

## Objetivo

Permitir que o controlador de pátio, em poucos segundos, saiba:

- Quais carretas estão no pátio, vazias, carregadas, carregando ou com insumos.
- Quais estão com cavalo e quais estão sem cavalo.
- Onde cada carreta está (pátio, doca, doca morta, lateral, oblíquo, lateral oblíquo, bolsão ou outro).
- Quais carretas estão em cada doca.
- Quais cavalos estão sozinhos no pátio.
- Quais veículos chegaram e quais saíram.

E que consiga gerar, em segundos, a atualização de pátio que hoje é enviada manualmente pelo WhatsApp.

## Funcionalidades

- **Dashboard** com indicadores em tempo real: total no pátio, em doca, vazias, carregadas, carregando, com insumos, com cavalo e sem cavalo.
- **Busca instantânea** por placa — de carreta ou de cavalo — com resultado enquanto o usuário digita.
- **Nova Chegada / Cadastro da Carreta**: placa, situação (vazia/carregada/carregando/insumos), se está com cavalo (com validação para não vincular o mesmo cavalo a duas carretas) e localização.
- **Ações rápidas por carreta**: alterar situação, alterar cavalo, alterar localização, registrar saída e editar — tudo em janelas simples, sem telas extras.
- **Cavalo no Pátio**: registro de cavalos sozinhos no pátio (sem carreta vinculada), removidos automaticamente da lista assim que forem associados a uma carreta.
- **Painel de docas**, mostrando rapidamente qual carreta está em cada doca e quais estão livres.
- **Histórico de hoje** com todas as movimentações, filtrável por placa.
- **Atualização Pátio**: gera automaticamente a mensagem no formato usado pela operação (carretas vazias/carregadas/carregando com e sem cavalo, com insumos, e cavalos no pátio), pronta para copiar e colar no WhatsApp.
- **Backup e restauração** dos dados em arquivo JSON.
- **Validações essenciais**: carreta duplicada, cavalo vinculado a duas carretas, doca ocupada, campos obrigatórios (placa do cavalo quando "com cavalo", número da doca quando "doca").

## Como acessar

Abra a URL do GitHub Pages do projeto em qualquer navegador (celular ou computador).

## Como instalar no celular

1. Abra o link do aplicativo no Chrome (Android) ou Safari (iPhone).
2. Toque no menu do navegador e escolha **"Adicionar à tela inicial"** (ou use o botão **Instalar Aplicativo** dentro das Configurações do app, quando disponível).
3. O ícone **LEMAR Pátio** aparecerá na tela inicial do celular, abrindo em tela cheia, sem a barra do navegador.

## Como utilizar

1. Abra o aplicativo — a tela inicial mostra o resumo do pátio.
2. Carreta chegou → **NOVA CHEGADA** → placa → situação → cavalo → localização → **SALVAR**.
3. Algo mudou (situação, cavalo ou localização) → busque a placa, toque na carreta e escolha a ação rápida correspondente.
4. Carreta saiu → toque na carreta → **REGISTRAR SAÍDA**.
5. Na hora de passar a atualização → **ATUALIZAÇÃO PÁTIO** → **COPIAR ATUALIZAÇÃO** → colar no WhatsApp.

## Armazenamento local

Todos os dados operacionais (carretas, cavalos avulsos, movimentações e configurações) são armazenados **localmente no dispositivo**, usando **IndexedDB**. Nenhum dado é enviado para o GitHub ou para qualquer servidor externo — o repositório hospeda apenas o código do aplicativo.

## Modo offline

O aplicativo funciona como **PWA offline-first**. Depois do primeiro acesso, um **Service Worker** guarda em cache os arquivos essenciais, permitindo que o app continue funcionando normalmente mesmo sem conexão com a internet. Os dados continuam sendo lidos e gravados no armazenamento local do dispositivo.

## Backup

Em **Configurações → Exportar Backup**, o aplicativo gera um arquivo `lemar-patio-backup-AAAA-MM-DD.json` contendo todas as carretas, cavalos avulsos, movimentações e configurações.

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
│   ├── utils.js            # utilitários (datas, placas, textos de localização)
│   └── app.js               # lógica da aplicação e telas
├── icons/
│   └── icon.svg           # espaço reservado para o logotipo oficial
└── README.md
```

## Sobre o logotipo

O cabeçalho está preparado com um espaço reservado (`LOGO LEMAR`). Assim que o arquivo oficial do logotipo for fornecido, basta substituir `icons/icon.svg` e o elemento `.logo-placeholder` em `index.html`, sem alterar cores, proporções ou o design original da marca.

## Status desta versão

100% local, sem backend, sem login, sem sincronização em nuvem. A estrutura de dados foi organizada para permitir evoluções futuras (sincronização, múltiplos usuários, múltiplas unidades) sem necessidade de reescrever o aplicativo.
