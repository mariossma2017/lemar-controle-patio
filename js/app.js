/* LEMAR Controle de Pátio — lógica da aplicação */

let configUnidade = '';
let configQuantidadeDocas = 10;

let selecaoChegadaCondicao = null;
let selecaoChegadaLocalizacao = null;
let selecaoSaidaCondicao = null;
let selecaoIndisponivelMotivo = null;

let contextoDocaPlaca = null;
let contextoIndisponivelPlaca = null;
let contextoEditarPlaca = null;
let contextoDetalhesPlaca = null;
let confirmCallback = null;

let filtroHistoricoAtivo = 'HOJE';
let filtroHistoricoPlaca = '';

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  await carregarConfiguracoes();
  atualizarRelogio();
  setInterval(atualizarRelogio, 30000);

  ligarNavegacao();
  ligarBusca();
  ligarAcoesPrincipais();
  ligarModalChegada();
  ligarModalSaida();
  ligarModalDetalhes();
  ligarModalDocaNumero();
  ligarModalIndisponivel();
  ligarModalEditar();
  ligarModalConfirm();
  ligarFechamentoOverlays();
  ligarHistorico();
  ligarTurno();
  ligarConfig();
  ligarInstalacaoPWA();

  await atualizarTudo();
  registrarServiceWorker();
});

async function carregarConfiguracoes() {
  configUnidade = await DB.configBuscar('unidade', '');
  configQuantidadeDocas = await DB.configBuscar('quantidadeDocas', 10);
  document.getElementById('header-unidade').textContent = configUnidade || 'LEMAR LOGÍSTICA';
  document.getElementById('config-unidade').value = configUnidade;
  document.getElementById('config-docas').value = configQuantidadeDocas;
}

function atualizarRelogio() {
  const agora = Date.now();
  document.getElementById('header-data').textContent = formatarData(agora);
  document.getElementById('header-hora').textContent = formatarHora(agora);
}

async function atualizarTudo() {
  const carretas = await DB.carretaListarTodas();
  atualizarDashboard(carretas);
  renderPatio(carretas);
  renderDocas(carretas);
  await renderHistorico();
}

/* ============================================================
   NAVEGAÇÃO
   ============================================================ */

function ligarNavegacao() {
  document.querySelectorAll('#app-nav button').forEach((btn) => {
    btn.addEventListener('click', () => trocarTela(btn.dataset.tela));
  });
}

async function trocarTela(idTela) {
  document.querySelectorAll('.tela').forEach((t) => t.classList.remove('ativa'));
  document.getElementById(idTela).classList.add('ativa');

  document.querySelectorAll('#app-nav button').forEach((b) => {
    b.classList.toggle('ativo', b.dataset.tela === idTela);
  });

  if (idTela === 'tela-patio' || idTela === 'tela-docas' || idTela === 'tela-home') {
    await atualizarTudo();
  }
  if (idTela === 'tela-historico') {
    await renderHistorico();
  }
  if (idTela === 'tela-turno') {
    await renderResumoTurno();
  }
}

/* ============================================================
   TOAST
   ============================================================ */

let toastTimeout = null;
function toast(mensagem) {
  const el = document.getElementById('toast');
  el.textContent = mensagem;
  el.classList.add('mostrar');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('mostrar'), 2200);
}

/* ============================================================
   OVERLAYS / MODAIS — GENÉRICO
   ============================================================ */

function abrirOverlay(id) {
  document.getElementById(id).classList.add('aberto');
}

function fecharOverlay(id) {
  document.getElementById(id).classList.remove('aberto');
}

function ligarFechamentoOverlays() {
  document.querySelectorAll('[data-fechar]').forEach((el) => {
    el.addEventListener('click', () => fecharOverlay(el.dataset.fechar));
  });
  document.querySelectorAll('.overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('aberto');
    });
  });
}

function abrirConfirm(titulo, texto, callback, textoBotao) {
  document.getElementById('confirm-titulo').textContent = titulo;
  document.getElementById('confirm-texto').textContent = texto;
  document.getElementById('btn-confirmar-confirm').textContent = textoBotao || 'CONFIRMAR';
  confirmCallback = callback;
  abrirOverlay('overlay-confirm');
}

function ligarModalConfirm() {
  document.getElementById('btn-confirmar-confirm').addEventListener('click', async () => {
    const cb = confirmCallback;
    confirmCallback = null;
    fecharOverlay('overlay-confirm');
    if (cb) await cb();
  });
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function atualizarDashboard(carretas) {
  const noPatio = carretas.filter((c) => c.status !== STATUS.FORA_DO_PATIO);
  const disponiveis = noPatio.filter((c) => c.status === STATUS.DISPONIVEL);
  const naDoca = noPatio.filter((c) => c.status === STATUS.NA_DOCA);
  const aguardando = noPatio.filter((c) => c.status === STATUS.AGUARDANDO);
  const indisponiveis = noPatio.filter((c) => c.status === STATUS.INDISPONIVEL);

  const chegadasHoje = carretas.filter((c) => c.chegadaTimestamp && ehHoje(c.chegadaTimestamp)).length;
  const saidasHoje = carretas.filter(
    (c) => c.status === STATUS.FORA_DO_PATIO && c.saidaTimestamp && ehHoje(c.saidaTimestamp)
  ).length;

  document.getElementById('stat-no-patio').textContent = noPatio.length;
  document.getElementById('stat-disponiveis').textContent = disponiveis.length;
  document.getElementById('stat-na-doca').textContent = naDoca.length;
  document.getElementById('stat-aguardando').textContent = aguardando.length;
  document.getElementById('stat-indisponiveis').textContent = indisponiveis.length;
  document.getElementById('stat-chegadas-hoje').textContent = chegadasHoje;
  document.getElementById('stat-saidas-hoje').textContent = saidasHoje;
}

/* ============================================================
   BUSCA
   ============================================================ */

function ligarBusca() {
  const input = document.getElementById('busca-input');
  input.addEventListener('input', async () => {
    const termo = normalizarPlaca(input.value);
    const resultadosEl = document.getElementById('busca-resultados');
    resultadosEl.innerHTML = '';
    if (!termo) return;

    const carretas = await DB.carretaListarTodas();
    const encontrados = carretas
      .filter((c) => c.placa.includes(termo))
      .sort((a, b) => a.placa.localeCompare(b.placa))
      .slice(0, 8);

    if (encontrados.length === 0) {
      resultadosEl.innerHTML = '<div class="vazio-msg">Nenhuma carreta encontrada.</div>';
      return;
    }

    encontrados.forEach((c) => {
      resultadosEl.appendChild(criarCardCarreta(c));
    });
  });
}

/* ============================================================
   CARD DE CARRETA
   ============================================================ */

function criarCardCarreta(carreta) {
  const div = document.createElement('div');
  const statusCss = carreta.status.toLowerCase();
  div.className = `card-carreta borda-${statusCss}`;

  const meta = [];
  meta.push(carreta.condicao === CONDICAO.CARREGADA ? 'CARREGADA' : 'VAZIA');
  if (carreta.status === STATUS.NA_DOCA && carreta.doca) {
    meta.push(`Doca ${carreta.doca}`);
  }
  const desde = carreta.ultimaMovimentacaoTimestamp || carreta.chegadaTimestamp;
  meta.push(`Desde ${formatarHora(desde)}`);

  div.innerHTML = `
    <div class="info-principal">
      <div class="placa">${carreta.placa}</div>
      <div class="meta">${meta.join(' · ')}</div>
    </div>
    <div class="lado-direito">
      <span class="badge badge-${statusCss}">${STATUS_LABEL[carreta.status]}</span>
    </div>
  `;
  div.addEventListener('click', () => abrirDetalhes(carreta.placa));
  return div;
}

/* ============================================================
   TELA PÁTIO
   ============================================================ */

function renderPatio(carretas) {
  const grupos = {
    [STATUS.DISPONIVEL]: document.getElementById('lista-disponiveis'),
    [STATUS.NA_DOCA]: document.getElementById('lista-na-doca'),
    [STATUS.AGUARDANDO]: document.getElementById('lista-aguardando'),
    [STATUS.INDISPONIVEL]: document.getElementById('lista-indisponiveis'),
  };

  Object.values(grupos).forEach((el) => (el.innerHTML = ''));

  Object.keys(grupos).forEach((status) => {
    const lista = carretas
      .filter((c) => c.status === status)
      .sort((a, b) => (b.ultimaMovimentacaoTimestamp || 0) - (a.ultimaMovimentacaoTimestamp || 0));
    const container = grupos[status];
    if (lista.length === 0) {
      container.innerHTML = '<div class="vazio-msg">Nenhuma carreta.</div>';
    } else {
      lista.forEach((c) => container.appendChild(criarCardCarreta(c)));
    }
  });
}

/* ============================================================
   TELA DOCAS
   ============================================================ */

function renderDocas(carretas) {
  const grid = document.getElementById('docas-grid');
  grid.innerHTML = '';

  const ocupantesPorDoca = {};
  carretas
    .filter((c) => c.status === STATUS.NA_DOCA && c.doca)
    .forEach((c) => {
      ocupantesPorDoca[String(c.doca).toUpperCase()] = c;
    });

  for (let i = 1; i <= configQuantidadeDocas; i++) {
    const numero = String(i).padStart(2, '0');
    const ocupante = ocupantesPorDoca[numero] || ocupantesPorDoca[String(i)];
    const div = document.createElement('div');
    div.className = `card-doca ${ocupante ? 'ocupada' : 'livre'}`;
    div.innerHTML = `
      <div class="doca-numero">DOCA ${numero}</div>
      <div class="doca-ocupante">${ocupante ? ocupante.placa : 'LIVRE'}</div>
    `;
    if (ocupante) {
      div.addEventListener('click', () => abrirDetalhes(ocupante.placa));
    }
    grid.appendChild(div);
  }
}

/* ============================================================
   AÇÕES PRINCIPAIS (HOME)
   ============================================================ */

function ligarAcoesPrincipais() {
  document.getElementById('btn-registrar-chegada').addEventListener('click', () => abrirModalChegada());
  document.getElementById('btn-registrar-saida').addEventListener('click', () => abrirModalSaida());
  document.getElementById('btn-ver-patio').addEventListener('click', () => trocarTela('tela-patio'));
}

/* ============================================================
   MODAL — REGISTRAR CHEGADA
   ============================================================ */

function abrirModalChegada(placaPredefinida) {
  document.getElementById('chegada-placa').value = placaPredefinida || '';
  document.getElementById('chegada-placa-cavalo').value = '';
  document.getElementById('chegada-motorista').value = '';
  document.getElementById('chegada-obs').value = '';
  document.getElementById('chegada-doca-numero').value = '';
  document.getElementById('chegada-doca-wrap').style.display = 'none';
  document.getElementById('chegada-aviso-duplicidade').innerHTML = '';
  selecaoChegadaCondicao = null;
  selecaoChegadaLocalizacao = null;
  document.querySelectorAll('#chegada-condicao .opcao-btn').forEach((b) => b.classList.remove('selecionado'));
  document.querySelectorAll('#chegada-localizacao .opcao-btn').forEach((b) => b.classList.remove('selecionado'));
  abrirOverlay('overlay-chegada');
}

function ligarModalChegada() {
  const placaInput = document.getElementById('chegada-placa');
  placaInput.addEventListener('input', () => {
    placaInput.value = normalizarPlaca(placaInput.value);
    verificarDuplicidadeChegada();
  });

  document.querySelectorAll('#chegada-condicao .opcao-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#chegada-condicao .opcao-btn').forEach((b) => b.classList.remove('selecionado'));
      btn.classList.add('selecionado');
      selecaoChegadaCondicao = btn.dataset.valor;
    });
  });

  document.querySelectorAll('#chegada-localizacao .opcao-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#chegada-localizacao .opcao-btn').forEach((b) => b.classList.remove('selecionado'));
      btn.classList.add('selecionado');
      selecaoChegadaLocalizacao = btn.dataset.valor;
      document.getElementById('chegada-doca-wrap').style.display =
        selecaoChegadaLocalizacao === 'DOCA' ? 'block' : 'none';
    });
  });

  document.getElementById('btn-confirmar-chegada').addEventListener('click', onConfirmarChegada);
}

async function verificarDuplicidadeChegada() {
  const placa = normalizarPlaca(document.getElementById('chegada-placa').value);
  const avisoEl = document.getElementById('chegada-aviso-duplicidade');
  avisoEl.innerHTML = '';
  if (placa.length < 6) return;

  const existente = await DB.carretaBuscarPorPlaca(placa);
  if (existente && existente.status !== STATUS.FORA_DO_PATIO) {
    avisoEl.innerHTML = `
      <div class="aviso-box">
        Esta carreta já consta no pátio.<br />
        Placa: <strong>${existente.placa}</strong><br />
        Status atual: <strong>${STATUS_LABEL[existente.status]}</strong><br />
        Última movimentação: <strong>${formatarDataHora(existente.ultimaMovimentacaoTimestamp || existente.chegadaTimestamp)}</strong>
      </div>
      <button type="button" class="btn btn-outline btn-bloco" id="btn-ver-carreta-duplicada" style="margin-bottom:14px;">VER CARRETA</button>
    `;
    document.getElementById('btn-ver-carreta-duplicada').addEventListener('click', () => {
      fecharOverlay('overlay-chegada');
      abrirDetalhes(existente.placa);
    });
  }
}

async function onConfirmarChegada() {
  const placa = normalizarPlaca(document.getElementById('chegada-placa').value);
  if (!placa) {
    toast('Informe a placa da carreta.');
    return;
  }
  if (!selecaoChegadaCondicao) {
    toast('Selecione a condição.');
    return;
  }
  if (!selecaoChegadaLocalizacao) {
    toast('Selecione a localização inicial.');
    return;
  }

  const existente = await DB.carretaBuscarPorPlaca(placa);
  if (existente && existente.status !== STATUS.FORA_DO_PATIO) {
    toast('Esta carreta já consta no pátio.');
    return;
  }

  let docaNumero = normalizarPlaca(document.getElementById('chegada-doca-numero').value);
  if (selecaoChegadaLocalizacao === 'DOCA' && !docaNumero) {
    toast('Informe o número da doca.');
    return;
  }

  const finalizar = async () => {
    const agora = Date.now();
    const status =
      selecaoChegadaLocalizacao === 'DOCA'
        ? STATUS.NA_DOCA
        : selecaoChegadaLocalizacao === 'AGUARDANDO'
        ? STATUS.AGUARDANDO
        : STATUS.DISPONIVEL;

    const carreta = {
      placa,
      placaCavalo: normalizarPlaca(document.getElementById('chegada-placa-cavalo').value),
      motorista: document.getElementById('chegada-motorista').value.trim(),
      condicao: selecaoChegadaCondicao,
      status,
      doca: status === STATUS.NA_DOCA ? docaNumero : '',
      motivoIndisponivel: '',
      observacao: document.getElementById('chegada-obs').value.trim(),
      destino: '',
      chegadaTimestamp: agora,
      ultimaMovimentacaoTimestamp: agora,
      saidaTimestamp: null,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    await DB.carretaSalvar(carreta);
    await DB.movimentacaoRegistrar({
      placa,
      tipo: TIPO_MOVIMENTO.CHEGADA,
      detalhe: `Chegada — ${selecaoChegadaCondicao === CONDICAO.CARREGADA ? 'CARREGADA' : 'VAZIA'}${
        status === STATUS.NA_DOCA ? ` — Doca ${docaNumero}` : ''
      }`,
      timestamp: agora,
      doca: status === STATUS.NA_DOCA ? docaNumero : '',
      condicao: selecaoChegadaCondicao,
    });

    fecharOverlay('overlay-chegada');
    toast('Chegada registrada.');
    await atualizarTudo();
  };

  if (status_localizacaoOcupaDoca(selecaoChegadaLocalizacao)) {
    const ocupante = await encontrarOcupanteDaDoca(docaNumero, placa);
    if (ocupante) {
      abrirConfirm(
        'Doca Ocupada',
        `A doca ${docaNumero} já está ocupada pela carreta ${ocupante.placa}. Deseja continuar mesmo assim?`,
        finalizar
      );
      return;
    }
  }

  await finalizar();
}

function status_localizacaoOcupaDoca(localizacao) {
  return localizacao === 'DOCA';
}

async function encontrarOcupanteDaDoca(numeroDoca, placaIgnorar) {
  const carretas = await DB.carretaListarTodas();
  return (
    carretas.find(
      (c) => c.status === STATUS.NA_DOCA && c.doca === numeroDoca && c.placa !== placaIgnorar
    ) || null
  );
}

/* ============================================================
   MODAL — REGISTRAR SAÍDA
   ============================================================ */

function abrirModalSaida(placaPredefinida) {
  document.getElementById('saida-placa').value = placaPredefinida || '';
  document.getElementById('saida-placa-cavalo').value = '';
  document.getElementById('saida-motorista').value = '';
  document.getElementById('saida-destino').value = '';
  document.getElementById('saida-aviso').innerHTML = '';
  selecaoSaidaCondicao = null;
  document.querySelectorAll('#saida-condicao .opcao-btn').forEach((b) => b.classList.remove('selecionado'));
  abrirOverlay('overlay-saida');
}

function ligarModalSaida() {
  const placaInput = document.getElementById('saida-placa');
  placaInput.addEventListener('input', () => {
    placaInput.value = normalizarPlaca(placaInput.value);
  });

  document.querySelectorAll('#saida-condicao .opcao-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#saida-condicao .opcao-btn').forEach((b) => b.classList.remove('selecionado'));
      btn.classList.add('selecionado');
      selecaoSaidaCondicao = btn.dataset.valor;
    });
  });

  document.getElementById('btn-confirmar-saida').addEventListener('click', onConfirmarSaida);
}

async function onConfirmarSaida() {
  const placa = normalizarPlaca(document.getElementById('saida-placa').value);
  if (!placa) {
    toast('Informe a placa da carreta.');
    return;
  }
  if (!selecaoSaidaCondicao) {
    toast('Selecione a condição.');
    return;
  }

  const existente = await DB.carretaBuscarPorPlaca(placa);

  const finalizarSaida = async () => {
    const agora = Date.now();
    const placaCavalo = normalizarPlaca(document.getElementById('saida-placa-cavalo').value);
    const motorista = document.getElementById('saida-motorista').value.trim();
    const destino = document.getElementById('saida-destino').value.trim();

    const carreta = existente || {
      placa,
      placaCavalo: '',
      motorista: '',
      condicao: selecaoSaidaCondicao,
      status: STATUS.FORA_DO_PATIO,
      doca: '',
      motivoIndisponivel: '',
      observacao: '',
      destino: '',
      chegadaTimestamp: null,
      criadoEm: agora,
    };

    carreta.status = STATUS.FORA_DO_PATIO;
    carreta.condicao = selecaoSaidaCondicao;
    if (placaCavalo) carreta.placaCavalo = placaCavalo;
    if (motorista) carreta.motorista = motorista;
    carreta.destino = destino;
    carreta.doca = '';
    carreta.saidaTimestamp = agora;
    carreta.ultimaMovimentacaoTimestamp = agora;
    carreta.atualizadoEm = agora;

    await DB.carretaSalvar(carreta);
    await DB.movimentacaoRegistrar({
      placa,
      tipo: TIPO_MOVIMENTO.SAIDA,
      detalhe: `Saída — ${selecaoSaidaCondicao === CONDICAO.CARREGADA ? 'CARREGADA' : 'VAZIA'}${
        destino ? ` — ${destino}` : ''
      }`,
      timestamp: agora,
      doca: '',
      condicao: selecaoSaidaCondicao,
    });

    fecharOverlay('overlay-saida');
    fecharOverlay('overlay-detalhes');
    toast('Saída registrada.');
    await atualizarTudo();
  };

  if (!existente || existente.status === STATUS.FORA_DO_PATIO) {
    abrirConfirm(
      'Carreta Fora do Pátio',
      `A carreta ${placa} não consta como estando no pátio no momento. Deseja registrar a saída mesmo assim?`,
      finalizarSaida
    );
    return;
  }

  await finalizarSaida();
}

/* ============================================================
   MODAL — DETALHES DA CARRETA
   ============================================================ */

async function abrirDetalhes(placa) {
  const carreta = await DB.carretaBuscarPorPlaca(placa);
  if (!carreta) {
    toast('Carreta não encontrada.');
    return;
  }
  contextoDetalhesPlaca = placa;

  document.getElementById('detalhes-titulo').textContent = carreta.placa;

  const linhas = [
    ['Placa', carreta.placa],
    ['Condição', carreta.condicao === CONDICAO.CARREGADA ? 'CARREGADA' : 'VAZIA'],
    ['Status', STATUS_LABEL[carreta.status]],
    ['Localização', carreta.status === STATUS.NA_DOCA ? `Doca ${carreta.doca}` : STATUS_LABEL[carreta.status]],
  ];
  if (carreta.doca) linhas.push(['Doca', carreta.doca]);
  if (carreta.chegadaTimestamp) linhas.push(['Chegada', formatarDataHora(carreta.chegadaTimestamp)]);
  linhas.push([
    'Última Movimentação',
    formatarDataHora(carreta.ultimaMovimentacaoTimestamp || carreta.chegadaTimestamp || carreta.criadoEm),
  ]);
  if (carreta.placaCavalo) linhas.push(['Placa do Cavalo', carreta.placaCavalo]);
  if (carreta.motorista) linhas.push(['Motorista', carreta.motorista]);
  if (carreta.destino) linhas.push(['Destino', carreta.destino]);
  if (carreta.motivoIndisponivel) linhas.push(['Motivo Indisponibilidade', carreta.motivoIndisponivel]);
  if (carreta.observacao) linhas.push(['Observação', carreta.observacao]);

  document.getElementById('detalhes-conteudo').innerHTML = linhas
    .map(
      ([rotulo, valor]) =>
        `<div class="detalhes-linha"><span class="rotulo">${rotulo}</span><span class="valor">${valor}</span></div>`
    )
    .join('');

  const acoesEl = document.getElementById('detalhes-acoes');
  acoesEl.innerHTML = '';

  const criarBotaoAcao = (texto, classe, handler) => {
    const btn = document.createElement('button');
    btn.className = `btn ${classe}`;
    btn.textContent = texto;
    btn.addEventListener('click', handler);
    acoesEl.appendChild(btn);
  };

  if (carreta.status !== STATUS.FORA_DO_PATIO) {
    if (carreta.status !== STATUS.DISPONIVEL) {
      criarBotaoAcao('TORNAR DISPONÍVEL', 'btn-outline', () => acaoTornarDisponivel(carreta.placa));
    }
    if (carreta.status !== STATUS.NA_DOCA) {
      criarBotaoAcao('MANDAR PARA DOCA', 'btn-outline', () => acaoAbrirDocaNumero(carreta.placa));
    }
    if (carreta.status !== STATUS.AGUARDANDO) {
      criarBotaoAcao('COLOCAR EM AGUARDANDO', 'btn-outline', () => acaoColocarAguardando(carreta.placa));
    }
    if (carreta.status !== STATUS.INDISPONIVEL) {
      criarBotaoAcao('TORNAR INDISPONÍVEL', 'btn-outline', () => acaoAbrirIndisponivel(carreta.placa));
    }
    criarBotaoAcao('REGISTRAR SAÍDA', 'btn-secundario', () => {
      fecharOverlay('overlay-detalhes');
      abrirModalSaida(carreta.placa);
    });
  }

  criarBotaoAcao('EDITAR', 'btn-outline', () => acaoAbrirEditar(carreta.placa));
  criarBotaoAcao('VER HISTÓRICO', 'btn-outline', () => acaoVerHistoricoIndividual(carreta.placa));

  abrirOverlay('overlay-detalhes');
}

function ligarModalDetalhes() {
  // ações ligadas dinamicamente em abrirDetalhes()
}

/* ---------- ações a partir dos detalhes ---------- */

function acaoTornarDisponivel(placa) {
  abrirConfirm('Tornar Disponível', `Confirmar que a carreta ${placa} está DISPONÍVEL?`, async () => {
    const carreta = await DB.carretaBuscarPorPlaca(placa);
    const agora = Date.now();
    carreta.status = STATUS.DISPONIVEL;
    carreta.doca = '';
    carreta.ultimaMovimentacaoTimestamp = agora;
    carreta.atualizadoEm = agora;
    await DB.carretaSalvar(carreta);
    await DB.movimentacaoRegistrar({
      placa,
      tipo: TIPO_MOVIMENTO.DISPONIVEL,
      detalhe: 'Disponível',
      timestamp: agora,
      doca: '',
      condicao: carreta.condicao,
    });
    fecharOverlay('overlay-detalhes');
    toast('Carreta disponível.');
    await atualizarTudo();
  });
}

function acaoColocarAguardando(placa) {
  (async () => {
    const carreta = await DB.carretaBuscarPorPlaca(placa);
    const agora = Date.now();
    carreta.status = STATUS.AGUARDANDO;
    carreta.doca = '';
    carreta.ultimaMovimentacaoTimestamp = agora;
    carreta.atualizadoEm = agora;
    await DB.carretaSalvar(carreta);
    await DB.movimentacaoRegistrar({
      placa,
      tipo: TIPO_MOVIMENTO.AGUARDANDO,
      detalhe: 'Aguardando',
      timestamp: agora,
      doca: '',
      condicao: carreta.condicao,
    });
    fecharOverlay('overlay-detalhes');
    toast('Carreta em aguardando.');
    await atualizarTudo();
  })();
}

function acaoAbrirDocaNumero(placa) {
  contextoDocaPlaca = placa;
  document.getElementById('doca-numero-input').value = '';
  fecharOverlay('overlay-detalhes');
  abrirOverlay('overlay-doca-numero');
}

function ligarModalDocaNumero() {
  const input = document.getElementById('doca-numero-input');
  input.addEventListener('input', () => {
    input.value = normalizarPlaca(input.value);
  });

  document.getElementById('btn-confirmar-doca').addEventListener('click', async () => {
    const numero = normalizarPlaca(input.value);
    if (!numero) {
      toast('Informe o número da doca.');
      return;
    }
    const placa = contextoDocaPlaca;

    const finalizar = async () => {
      const carreta = await DB.carretaBuscarPorPlaca(placa);
      const agora = Date.now();
      carreta.status = STATUS.NA_DOCA;
      carreta.doca = numero;
      carreta.ultimaMovimentacaoTimestamp = agora;
      carreta.atualizadoEm = agora;
      await DB.carretaSalvar(carreta);
      await DB.movimentacaoRegistrar({
        placa,
        tipo: TIPO_MOVIMENTO.DOCA,
        detalhe: `Movida para Doca ${numero}`,
        timestamp: agora,
        doca: numero,
        condicao: carreta.condicao,
      });
      fecharOverlay('overlay-doca-numero');
      toast(`Carreta enviada para Doca ${numero}.`);
      await atualizarTudo();
    };

    const ocupante = await encontrarOcupanteDaDoca(numero, placa);
    if (ocupante) {
      abrirConfirm(
        'Doca Ocupada',
        `A doca ${numero} já está ocupada pela carreta ${ocupante.placa}. Deseja continuar mesmo assim?`,
        finalizar
      );
      return;
    }
    await finalizar();
  });
}

function acaoAbrirIndisponivel(placa) {
  contextoIndisponivelPlaca = placa;
  selecaoIndisponivelMotivo = null;
  document.querySelectorAll('#indisponivel-motivos .opcao-btn').forEach((b) => b.classList.remove('selecionado'));
  document.getElementById('indisponivel-outro-wrap').style.display = 'none';
  document.getElementById('indisponivel-outro-texto').value = '';
  fecharOverlay('overlay-detalhes');
  abrirOverlay('overlay-indisponivel');
}

function ligarModalIndisponivel() {
  document.querySelectorAll('#indisponivel-motivos .opcao-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#indisponivel-motivos .opcao-btn').forEach((b) => b.classList.remove('selecionado'));
      btn.classList.add('selecionado');
      selecaoIndisponivelMotivo = btn.dataset.valor;
      document.getElementById('indisponivel-outro-wrap').style.display =
        selecaoIndisponivelMotivo === 'OUTRO' ? 'block' : 'none';
    });
  });

  document.getElementById('btn-confirmar-indisponivel').addEventListener('click', async () => {
    if (!selecaoIndisponivelMotivo) {
      toast('Selecione o motivo.');
      return;
    }
    let motivo = selecaoIndisponivelMotivo;
    if (motivo === 'OUTRO') {
      const texto = document.getElementById('indisponivel-outro-texto').value.trim();
      if (!texto) {
        toast('Descreva o motivo.');
        return;
      }
      motivo = texto;
    }

    const placa = contextoIndisponivelPlaca;
    const carreta = await DB.carretaBuscarPorPlaca(placa);
    const agora = Date.now();
    carreta.status = STATUS.INDISPONIVEL;
    carreta.motivoIndisponivel = motivo;
    carreta.doca = '';
    carreta.ultimaMovimentacaoTimestamp = agora;
    carreta.atualizadoEm = agora;
    await DB.carretaSalvar(carreta);
    await DB.movimentacaoRegistrar({
      placa,
      tipo: TIPO_MOVIMENTO.INDISPONIVEL,
      detalhe: `Indisponível — ${motivo}`,
      timestamp: agora,
      doca: '',
      condicao: carreta.condicao,
      motivo,
    });

    fecharOverlay('overlay-indisponivel');
    toast('Carreta indisponível.');
    await atualizarTudo();
  });
}

function acaoAbrirEditar(placa) {
  contextoEditarPlaca = placa;
  DB.carretaBuscarPorPlaca(placa).then((carreta) => {
    document.getElementById('editar-placa-cavalo').value = carreta.placaCavalo || '';
    document.getElementById('editar-motorista').value = carreta.motorista || '';
    document.getElementById('editar-obs').value = carreta.observacao || '';
    fecharOverlay('overlay-detalhes');
    abrirOverlay('overlay-editar');
  });
}

function ligarModalEditar() {
  const placaCavaloInput = document.getElementById('editar-placa-cavalo');
  placaCavaloInput.addEventListener('input', () => {
    placaCavaloInput.value = normalizarPlaca(placaCavaloInput.value);
  });

  document.getElementById('btn-confirmar-editar').addEventListener('click', async () => {
    const placa = contextoEditarPlaca;
    const carreta = await DB.carretaBuscarPorPlaca(placa);
    const agora = Date.now();
    carreta.placaCavalo = normalizarPlaca(document.getElementById('editar-placa-cavalo').value);
    carreta.motorista = document.getElementById('editar-motorista').value.trim();
    carreta.observacao = document.getElementById('editar-obs').value.trim();
    carreta.atualizadoEm = agora;
    await DB.carretaSalvar(carreta);
    await DB.movimentacaoRegistrar({
      placa,
      tipo: TIPO_MOVIMENTO.EDICAO,
      detalhe: 'Dados editados',
      timestamp: agora,
      doca: carreta.doca || '',
      condicao: carreta.condicao,
    });
    fecharOverlay('overlay-editar');
    toast('Carreta atualizada.');
    await atualizarTudo();
  });
}

async function acaoVerHistoricoIndividual(placa) {
  fecharOverlay('overlay-detalhes');
  filtroHistoricoAtivo = 'TODAS';
  filtroHistoricoPlaca = placa;
  document.getElementById('filtro-busca-placa').value = placa;
  document.querySelectorAll('.filtro-chip').forEach((c) => c.classList.toggle('ativo', c.dataset.filtro === 'TODAS'));
  await trocarTela('tela-historico');
}

/* ============================================================
   HISTÓRICO
   ============================================================ */

function ligarHistorico() {
  document.querySelectorAll('.filtro-chip').forEach((chip) => {
    chip.addEventListener('click', async () => {
      document.querySelectorAll('.filtro-chip').forEach((c) => c.classList.remove('ativo'));
      chip.classList.add('ativo');
      filtroHistoricoAtivo = chip.dataset.filtro;
      await renderHistorico();
    });
  });

  document.getElementById('filtro-busca-placa').addEventListener('input', async (e) => {
    filtroHistoricoPlaca = normalizarPlaca(e.target.value);
    await renderHistorico();
  });
}

async function renderHistorico() {
  const container = document.getElementById('lista-historico');
  let movs = await DB.movimentacaoListarTodas();

  if (filtroHistoricoAtivo === 'HOJE') {
    movs = movs.filter((m) => ehHoje(m.timestamp));
  } else if (filtroHistoricoAtivo === 'ONTEM') {
    movs = movs.filter((m) => ehOntem(m.timestamp));
  }

  if (filtroHistoricoPlaca) {
    movs = movs.filter((m) => normalizarPlaca(m.placa).includes(filtroHistoricoPlaca));
  }

  container.innerHTML = '';

  if (movs.length === 0) {
    container.innerHTML = '<div class="vazio-msg">Nenhuma movimentação encontrada.</div>';
    return;
  }

  movs.forEach((m) => {
    const div = document.createElement('div');
    div.className = 'item-historico';
    div.innerHTML = `
      <div class="hora">${formatarHora(m.timestamp)}</div>
      <div class="conteudo">
        <div class="placa">${m.placa}</div>
        <div class="descricao">${m.detalhe || TIPO_MOVIMENTO_LABEL[m.tipo] || m.tipo}</div>
      </div>
    `;
    div.addEventListener('click', () => abrirDetalhes(m.placa));
    container.appendChild(div);
  });
}

/* ============================================================
   PASSAGEM DE TURNO
   ============================================================ */

function ligarTurno() {
  document.getElementById('btn-copiar-resumo').addEventListener('click', async () => {
    const texto = document.getElementById('resumo-turno-texto').textContent;
    const ok = await copiarParaAreaTransferencia(texto);
    toast(ok ? 'Resumo copiado.' : 'Não foi possível copiar.');
  });
}

async function renderResumoTurno() {
  const carretas = await DB.carretaListarTodas();
  const noPatio = carretas.filter((c) => c.status !== STATUS.FORA_DO_PATIO);
  const disponiveis = noPatio.filter((c) => c.status === STATUS.DISPONIVEL);
  const naDoca = noPatio.filter((c) => c.status === STATUS.NA_DOCA);
  const aguardando = noPatio.filter((c) => c.status === STATUS.AGUARDANDO);
  const indisponiveis = noPatio.filter((c) => c.status === STATUS.INDISPONIVEL);
  const chegadasHoje = carretas.filter((c) => c.chegadaTimestamp && ehHoje(c.chegadaTimestamp));
  const saidasHoje = carretas.filter(
    (c) => c.status === STATUS.FORA_DO_PATIO && c.saidaTimestamp && ehHoje(c.saidaTimestamp)
  );

  const agora = Date.now();
  const linhas = [];
  linhas.push('LEMAR — CONTROLE DE PÁTIO');
  if (configUnidade) linhas.push(configUnidade);
  linhas.push(formatarDataHora(agora));
  linhas.push('');
  linhas.push(`Carretas no pátio: ${noPatio.length}`);
  linhas.push(`Disponíveis: ${disponiveis.length}`);
  linhas.push(`Na doca: ${naDoca.length}`);
  linhas.push(`Aguardando: ${aguardando.length}`);
  linhas.push(`Indisponíveis: ${indisponiveis.length}`);
  linhas.push(`Entradas do dia: ${chegadasHoje.length}`);
  linhas.push(`Saídas do dia: ${saidasHoje.length}`);

  if (indisponiveis.length > 0) {
    linhas.push('');
    linhas.push('CARRETAS INDISPONÍVEIS');
    indisponiveis.forEach((c) => {
      linhas.push(`${c.placa} — ${c.motivoIndisponivel || 'Sem motivo informado'}`);
    });
  }

  if (naDoca.length > 0) {
    linhas.push('');
    linhas.push('CARRETAS EM DOCA');
    naDoca.forEach((c) => {
      linhas.push(`${c.placa} — Doca ${c.doca}`);
    });
  }

  document.getElementById('resumo-turno-texto').textContent = linhas.join('\n');
}

/* ============================================================
   CONFIGURAÇÕES
   ============================================================ */

function ligarConfig() {
  document.getElementById('btn-salvar-config').addEventListener('click', async () => {
    const unidade = document.getElementById('config-unidade').value.trim();
    const docas = parseInt(document.getElementById('config-docas').value, 10) || 10;
    await DB.configSalvar('unidade', unidade);
    await DB.configSalvar('quantidadeDocas', docas);
    configUnidade = unidade;
    configQuantidadeDocas = docas;
    document.getElementById('header-unidade').textContent = unidade || 'LEMAR LOGÍSTICA';
    toast('Configurações salvas.');
    await atualizarTudo();
  });

  document.getElementById('btn-exportar-backup').addEventListener('click', async () => {
    const dados = await DB.backupExportarDados();
    const dataStr = new Date().toISOString().slice(0, 10);
    const nomeArquivo = `lemar-patio-backup-${dataStr}.json`;
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Backup exportado.');
  });

  const inputArquivo = document.getElementById('input-restaurar-backup');
  document.getElementById('btn-restaurar-backup').addEventListener('click', () => inputArquivo.click());

  inputArquivo.addEventListener('change', () => {
    const arquivo = inputArquivo.files[0];
    if (!arquivo) return;
    abrirConfirm(
      'Restaurar Backup',
      'A restauração substituirá os dados atuais deste dispositivo. Deseja continuar?',
      async () => {
        try {
          const texto = await arquivo.text();
          const dados = JSON.parse(texto);
          await DB.backupRestaurarDados(dados);
          await carregarConfiguracoes();
          await atualizarTudo();
          toast('Backup restaurado com sucesso.');
        } catch (e) {
          toast('Arquivo de backup inválido ou corrompido.');
        } finally {
          inputArquivo.value = '';
        }
      },
      'RESTAURAR'
    );
  });
}

/* ============================================================
   PWA — INSTALAÇÃO
   ============================================================ */

let deferredInstallPrompt = null;

function ligarInstalacaoPWA() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });

  document.getElementById('btn-instalar-app').addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const resultado = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if (resultado.outcome === 'accepted') {
        toast('Aplicativo instalado.');
      }
    } else {
      toast('Use o menu do navegador: "Adicionar à tela inicial".');
    }
  });
}

/* ============================================================
   SERVICE WORKER
   ============================================================ */

function registrarServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      /* funcionamento offline não disponível — segue normalmente */
    });
  }
}
