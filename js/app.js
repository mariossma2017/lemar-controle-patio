/* LEMAR Controle de Pátio — lógica da aplicação */

let configUnidade = '';
let configQuantidadeDocas = 10;

/* seleções ativas nos formulários */
let selecaoChegadaSituacao = null;
let selecaoChegadaInsumo = null;
let selecaoChegadaTemCavalo = null;
let selecaoChegadaLocalizacao = null;

let selecaoAlterarSituacao = null;
let selecaoAlterarSituacaoInsumo = null;
let selecaoAlterarCavalo = null;
let selecaoAlterarLocalizacao = null;
let selecaoCavaloAvulsoLocalizacao = null;

/* contextos (placa em edição) */
let contextoDetalhesPlaca = null;
let contextoDetalhesTipo = 'carreta';
let contextoSaidaPlaca = null;
let contextoEditarPlaca = null;
let contextoAlterarSituacaoPlaca = null;
let contextoAlterarCavaloPlaca = null;
let contextoLocalizacaoAlvo = { placa: null, tipo: 'carreta' };

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
  ligarModalAlterarSituacao();
  ligarModalAlterarCavalo();
  ligarModalAlterarLocalizacao();
  ligarModalSaida();
  ligarModalEditar();
  ligarModalCavaloAvulso();
  ligarModalConfirm();
  ligarFechamentoOverlays();
  ligarHistorico();
  ligarAtualizacaoPatio();
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
  const cavalosAvulsos = await DB.cavaloAvulsoListarTodos();
  atualizarDashboard(carretas);
  renderPatio(carretas, cavalosAvulsos);
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
  if (idTela === 'tela-atualizacao') {
    await renderAtualizacaoPatio();
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
   PICKERS GENÉRICOS (botões de opção)
   ============================================================ */

function configurarPickerSimples(containerId, aoSelecionar) {
  document.querySelectorAll(`#${containerId} .opcao-btn`).forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(`#${containerId} .opcao-btn`).forEach((b) => b.classList.remove('selecionado'));
      btn.classList.add('selecionado');
      aoSelecionar(btn.dataset.valor);
    });
  });
}

function selecionarOpcao(containerId, valor) {
  document.querySelectorAll(`#${containerId} .opcao-btn`).forEach((b) => {
    b.classList.toggle('selecionado', b.dataset.valor === valor);
  });
}

function configurarPickerSituacao(containerId, insumoWrapId, aoSelecionar) {
  configurarPickerSimples(containerId, (valor) => {
    document.getElementById(insumoWrapId).style.display = valor === 'INSUMOS' ? 'block' : 'none';
    aoSelecionar(valor);
  });
}

function configurarPickerInsumo(containerId, outroInputId, aoSelecionar) {
  configurarPickerSimples(containerId, (valor) => {
    document.getElementById(outroInputId).style.display = valor === 'OUTRO' ? 'block' : 'none';
    aoSelecionar(valor);
  });
}

function configurarPickerLocalizacao(containerId, docaWrapId, outroWrapId, aoSelecionar) {
  configurarPickerSimples(containerId, (valor) => {
    document.getElementById(docaWrapId).style.display = valor === 'DOCA' ? 'block' : 'none';
    document.getElementById(outroWrapId).style.display = valor === 'OUTRO' ? 'block' : 'none';
    aoSelecionar(valor);
  });
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function atualizarDashboard(carretas) {
  const ativas = carretas.filter((c) => c.presente);

  const contar = (pred) => ativas.filter(pred).length;

  document.getElementById('stat-total-patio').textContent = ativas.length;
  document.getElementById('stat-em-doca').textContent = contar((c) => c.localizacao === LOCALIZACAO.DOCA);
  document.getElementById('stat-vazias').textContent = contar((c) => c.situacao === SITUACAO.VAZIA);
  document.getElementById('stat-carregadas').textContent = contar((c) => c.situacao === SITUACAO.CARREGADA);
  document.getElementById('stat-carregando').textContent = contar((c) => c.situacao === SITUACAO.CARREGANDO);
  document.getElementById('stat-insumos').textContent = contar((c) => c.situacao === SITUACAO.INSUMOS);
  document.getElementById('stat-com-cavalo').textContent = contar((c) => c.temCavalo);
  document.getElementById('stat-sem-cavalo').textContent = contar((c) => !c.temCavalo);
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

    const carretas = (await DB.carretaListarTodas()).filter((c) => c.presente);
    const cavalosAvulsos = await DB.cavaloAvulsoListarTodos();

    const porPlacaCarreta = carretas.filter((c) => c.placa.includes(termo));
    const porCavaloNaCarreta = carretas.filter(
      (c) => c.temCavalo && c.placaCavalo.includes(termo) && !porPlacaCarreta.includes(c)
    );
    const porCavaloAvulso = cavalosAvulsos.filter((c) => c.placa.includes(termo));

    const encontrados = [...porPlacaCarreta, ...porCavaloNaCarreta].slice(0, 6);
    const encontradosCavalos = porCavaloAvulso.slice(0, 4);

    if (encontrados.length === 0 && encontradosCavalos.length === 0) {
      resultadosEl.innerHTML = '<div class="vazio-msg">Nenhum resultado encontrado.</div>';
      return;
    }

    encontrados.forEach((c) => resultadosEl.appendChild(criarCardCarreta(c)));
    encontradosCavalos.forEach((c) => resultadosEl.appendChild(criarCardCavaloAvulso(c)));
  });
}

/* ============================================================
   CARDS
   ============================================================ */

function criarCardCarreta(carreta) {
  const div = document.createElement('div');
  const situacaoCss = carreta.situacao.toLowerCase();
  div.className = `card-carreta borda-${situacaoCss}`;

  const meta = [];
  if (carreta.temCavalo && carreta.placaCavalo) {
    meta.push(`Cavalo: ${carreta.placaCavalo}`);
  } else {
    meta.push('Sem cavalo');
  }
  meta.push(localizacaoTextoTela(carreta));
  const desde = carreta.ultimaMovimentacaoTimestamp || carreta.chegadaTimestamp;
  meta.push(`Desde ${formatarHora(desde)}`);

  div.innerHTML = `
    <div class="info-principal">
      <div class="placa">${carreta.placa}</div>
      <div class="meta">${meta.join(' · ')}</div>
    </div>
    <div class="lado-direito">
      <span class="badge badge-${situacaoCss}">${SITUACAO_LABEL[carreta.situacao]}</span>
    </div>
  `;
  div.addEventListener('click', () => abrirDetalhes(carreta.placa, 'carreta'));
  return div;
}

function criarCardCavaloAvulso(cavalo) {
  const div = document.createElement('div');
  div.className = 'card-carreta borda-avulso';

  const meta = [localizacaoTextoTela(cavalo), `Desde ${formatarHora(cavalo.ultimaMovimentacaoTimestamp || cavalo.criadoEm)}`];

  div.innerHTML = `
    <div class="info-principal">
      <div class="placa">${cavalo.placa}</div>
      <div class="meta">${meta.join(' · ')}</div>
    </div>
    <div class="lado-direito">
      <span class="badge badge-avulso">CAVALO</span>
    </div>
  `;
  div.addEventListener('click', () => abrirDetalhes(cavalo.placa, 'cavalo'));
  return div;
}

/* ============================================================
   TELA PÁTIO
   ============================================================ */

function renderPatio(carretas, cavalosAvulsos) {
  const listaCarretas = document.getElementById('lista-carretas-patio');
  const listaCavalos = document.getElementById('lista-cavalos-patio');

  const ativas = carretas
    .filter((c) => c.presente)
    .sort((a, b) => (b.ultimaMovimentacaoTimestamp || 0) - (a.ultimaMovimentacaoTimestamp || 0));

  listaCarretas.innerHTML = '';
  if (ativas.length === 0) {
    listaCarretas.innerHTML = '<div class="vazio-msg">Nenhuma carreta no pátio.</div>';
  } else {
    ativas.forEach((c) => listaCarretas.appendChild(criarCardCarreta(c)));
  }

  const cavalosOrdenados = [...cavalosAvulsos].sort(
    (a, b) => (b.ultimaMovimentacaoTimestamp || 0) - (a.ultimaMovimentacaoTimestamp || 0)
  );
  listaCavalos.innerHTML = '';
  if (cavalosOrdenados.length === 0) {
    listaCavalos.innerHTML = '<div class="vazio-msg">Nenhum cavalo avulso no pátio.</div>';
  } else {
    cavalosOrdenados.forEach((c) => listaCavalos.appendChild(criarCardCavaloAvulso(c)));
  }
}

/* ============================================================
   TELA DOCAS
   ============================================================ */

function renderDocas(carretas) {
  const grid = document.getElementById('docas-grid');
  grid.innerHTML = '';

  const ocupantesPorDoca = {};
  carretas
    .filter((c) => c.presente && c.localizacao === LOCALIZACAO.DOCA && c.doca)
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
      div.addEventListener('click', () => abrirDetalhes(ocupante.placa, 'carreta'));
    }
    grid.appendChild(div);
  }
}

/* ============================================================
   AÇÕES PRINCIPAIS (HOME)
   ============================================================ */

function ligarAcoesPrincipais() {
  document.getElementById('btn-nova-chegada').addEventListener('click', () => abrirModalChegada('Nova Chegada'));
  document.getElementById('btn-ver-patio').addEventListener('click', () => trocarTela('tela-patio'));
  document.getElementById('btn-atualizacao-patio').addEventListener('click', () => trocarTela('tela-atualizacao'));
  document
    .getElementById('btn-cadastro-carreta')
    .addEventListener('click', () => abrirModalChegada('Cadastro da Carreta'));
  document.getElementById('btn-cavalo-no-patio').addEventListener('click', () => abrirModalCavaloAvulso());
}

/* ============================================================
   MODAL — NOVA CHEGADA / CADASTRO DA CARRETA
   ============================================================ */

function abrirModalChegada(titulo) {
  document.getElementById('chegada-titulo').textContent = titulo || 'Nova Chegada';
  document.getElementById('chegada-placa').value = '';
  document.getElementById('chegada-placa-cavalo').value = '';
  document.getElementById('chegada-doca-numero').value = '';
  document.getElementById('chegada-localizacao-outro-texto').value = '';
  document.getElementById('chegada-insumo-outro-texto').value = '';
  document.getElementById('chegada-insumo-outro-texto').style.display = 'none';
  document.getElementById('chegada-insumo-wrap').style.display = 'none';
  document.getElementById('chegada-placa-cavalo-wrap').style.display = 'none';
  document.getElementById('chegada-doca-wrap').style.display = 'none';
  document.getElementById('chegada-localizacao-outro-wrap').style.display = 'none';
  document.getElementById('chegada-aviso-duplicidade').innerHTML = '';
  document.getElementById('chegada-aviso-cavalo').innerHTML = '';

  selecaoChegadaSituacao = null;
  selecaoChegadaInsumo = null;
  selecaoChegadaTemCavalo = null;
  selecaoChegadaLocalizacao = null;

  ['chegada-situacao', 'chegada-insumo-opcoes', 'chegada-tem-cavalo', 'chegada-localizacao'].forEach((id) => {
    document.querySelectorAll(`#${id} .opcao-btn`).forEach((b) => b.classList.remove('selecionado'));
  });

  abrirOverlay('overlay-chegada');
}

function ligarModalChegada() {
  const placaInput = document.getElementById('chegada-placa');
  placaInput.addEventListener('input', () => {
    placaInput.value = normalizarPlaca(placaInput.value);
    verificarDuplicidadeChegada();
  });

  configurarPickerSituacao('chegada-situacao', 'chegada-insumo-wrap', (valor) => {
    selecaoChegadaSituacao = valor;
  });

  configurarPickerInsumo('chegada-insumo-opcoes', 'chegada-insumo-outro-texto', (valor) => {
    selecaoChegadaInsumo = valor;
  });

  configurarPickerSimples('chegada-tem-cavalo', (valor) => {
    selecaoChegadaTemCavalo = valor;
    document.getElementById('chegada-placa-cavalo-wrap').style.display = valor === 'SIM' ? 'block' : 'none';
  });

  const placaCavaloInput = document.getElementById('chegada-placa-cavalo');
  placaCavaloInput.addEventListener('input', async () => {
    placaCavaloInput.value = normalizarPlaca(placaCavaloInput.value);
    const avisoEl = document.getElementById('chegada-aviso-cavalo');
    avisoEl.innerHTML = '';
    const placaCavalo = placaCavaloInput.value;
    if (placaCavalo.length < 6) return;
    const conflito = await encontrarCarretaComCavalo(placaCavalo, null);
    if (conflito) {
      avisoEl.innerHTML = `<div class="aviso-box">Este cavalo já está vinculado à carreta ${conflito.placa}.</div>`;
    }
  });

  configurarPickerLocalizacao('chegada-localizacao', 'chegada-doca-wrap', 'chegada-localizacao-outro-wrap', (valor) => {
    selecaoChegadaLocalizacao = valor;
  });

  document.getElementById('btn-confirmar-chegada').addEventListener('click', onConfirmarChegada);
}

async function verificarDuplicidadeChegada() {
  const placa = normalizarPlaca(document.getElementById('chegada-placa').value);
  const avisoEl = document.getElementById('chegada-aviso-duplicidade');
  avisoEl.innerHTML = '';
  if (placa.length < 6) return;

  const existente = await DB.carretaBuscarPorPlaca(placa);
  if (existente && existente.presente) {
    avisoEl.innerHTML = `
      <div class="aviso-box">
        Esta carreta já consta no pátio.<br />
        Placa: <strong>${existente.placa}</strong><br />
        Situação: <strong>${SITUACAO_LABEL[existente.situacao]}</strong><br />
        Localização: <strong>${localizacaoTextoTela(existente)}</strong>
      </div>
      <button type="button" class="btn btn-outline btn-bloco" id="btn-ver-carreta-duplicada" style="margin-bottom:14px;">VER CARRETA</button>
    `;
    document.getElementById('btn-ver-carreta-duplicada').addEventListener('click', () => {
      fecharOverlay('overlay-chegada');
      abrirDetalhes(existente.placa, 'carreta');
    });
  }
}

async function encontrarCarretaComCavalo(placaCavalo, placaIgnorar) {
  const carretas = await DB.carretaListarTodas();
  return (
    carretas.find(
      (c) => c.presente && c.temCavalo && c.placaCavalo === placaCavalo && c.placa !== placaIgnorar
    ) || null
  );
}

async function encontrarOcupanteDaDoca(numeroDoca, placaIgnorar) {
  const carretas = await DB.carretaListarTodas();
  return (
    carretas.find(
      (c) => c.presente && c.localizacao === LOCALIZACAO.DOCA && c.doca === numeroDoca && c.placa !== placaIgnorar
    ) || null
  );
}

async function onConfirmarChegada() {
  const placa = normalizarPlaca(document.getElementById('chegada-placa').value);
  if (!placa) {
    toast('Informe a placa da carreta.');
    return;
  }
  if (!selecaoChegadaSituacao) {
    toast('Selecione a situação.');
    return;
  }
  if (!selecaoChegadaTemCavalo) {
    toast('Informe se está com cavalo.');
    return;
  }

  const existente = await DB.carretaBuscarPorPlaca(placa);
  if (existente && existente.presente) {
    toast('Esta carreta já consta no pátio.');
    return;
  }

  let placaCavalo = '';
  if (selecaoChegadaTemCavalo === 'SIM') {
    placaCavalo = normalizarPlaca(document.getElementById('chegada-placa-cavalo').value);
    if (!placaCavalo) {
      toast('Informe a placa do cavalo.');
      return;
    }
    const conflito = await encontrarCarretaComCavalo(placaCavalo, null);
    if (conflito) {
      toast(`Este cavalo já está vinculado à carreta ${conflito.placa}.`);
      return;
    }
  }

  if (!selecaoChegadaLocalizacao) {
    toast('Selecione a localização.');
    return;
  }

  let docaNumero = '';
  if (selecaoChegadaLocalizacao === 'DOCA') {
    docaNumero = normalizarPlaca(document.getElementById('chegada-doca-numero').value);
    if (!docaNumero) {
      toast('Informe o número da doca.');
      return;
    }
  }

  let localizacaoOutroTexto = '';
  if (selecaoChegadaLocalizacao === 'OUTRO') {
    localizacaoOutroTexto = document.getElementById('chegada-localizacao-outro-texto').value.trim();
    if (!localizacaoOutroTexto) {
      toast('Descreva a localização.');
      return;
    }
  }

  let insumoDetalhe = '';
  if (selecaoChegadaSituacao === 'INSUMOS' && selecaoChegadaInsumo) {
    insumoDetalhe =
      selecaoChegadaInsumo === 'OUTRO'
        ? document.getElementById('chegada-insumo-outro-texto').value.trim()
        : selecaoChegadaInsumo;
  }

  const finalizar = async () => {
    const agora = Date.now();

    const carreta = {
      placa,
      situacao: selecaoChegadaSituacao,
      insumoDetalhe,
      temCavalo: selecaoChegadaTemCavalo === 'SIM',
      placaCavalo,
      localizacao: selecaoChegadaLocalizacao,
      localizacaoOutroTexto,
      doca: docaNumero,
      presente: true,
      destino: '',
      chegadaTimestamp: agora,
      ultimaMovimentacaoTimestamp: agora,
      saidaTimestamp: null,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    await DB.carretaSalvar(carreta);

    if (placaCavalo) {
      const avulso = await DB.cavaloAvulsoBuscarPorPlaca(placaCavalo);
      if (avulso) await DB.cavaloAvulsoExcluir(placaCavalo);
    }

    await DB.movimentacaoRegistrar({
      placa,
      tipo: TIPO_MOVIMENTO.CHEGADA,
      detalhe: `${SITUACAO_LABEL[selecaoChegadaSituacao]} — ${localizacaoTextoTela(carreta)}`,
      timestamp: agora,
      doca: docaNumero,
    });

    fecharOverlay('overlay-chegada');
    toast('Carreta registrada.');
    await atualizarTudo();
  };

  if (selecaoChegadaLocalizacao === 'DOCA') {
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

/* ============================================================
   MODAL — DETALHES / AÇÕES RÁPIDAS
   ============================================================ */

async function abrirDetalhes(placa, tipo) {
  contextoDetalhesPlaca = placa;
  contextoDetalhesTipo = tipo;

  if (tipo === 'cavalo') {
    const cavalo = await DB.cavaloAvulsoBuscarPorPlaca(placa);
    if (!cavalo) {
      toast('Cavalo não encontrado.');
      return;
    }
    document.getElementById('detalhes-titulo').textContent = cavalo.placa;
    const linhas = [
      ['Placa', cavalo.placa],
      ['Tipo', 'Cavalo avulso'],
      ['Localização', localizacaoTextoTela(cavalo)],
      ['Desde', formatarDataHora(cavalo.ultimaMovimentacaoTimestamp || cavalo.criadoEm)],
    ];
    document.getElementById('detalhes-conteudo').innerHTML = linhas
      .map(
        ([rotulo, valor]) =>
          `<div class="detalhes-linha"><span class="rotulo">${rotulo}</span><span class="valor">${valor}</span></div>`
      )
      .join('');

    const acoesEl = document.getElementById('detalhes-acoes');
    acoesEl.innerHTML = '';
    criarBotaoAcao(acoesEl, 'ALTERAR LOCALIZAÇÃO', 'btn-outline', () => acaoAbrirAlterarLocalizacao(placa, 'cavalo'));
    criarBotaoAcao(acoesEl, 'REMOVER DO PÁTIO', 'btn-perigo', () => acaoRemoverCavaloAvulso(placa));

    abrirOverlay('overlay-detalhes');
    return;
  }

  const carreta = await DB.carretaBuscarPorPlaca(placa);
  if (!carreta) {
    toast('Carreta não encontrada.');
    return;
  }

  document.getElementById('detalhes-titulo').textContent = carreta.placa;

  const linhas = [
    ['Placa', carreta.placa],
    ['Situação', SITUACAO_LABEL[carreta.situacao]],
  ];
  if (carreta.situacao === 'INSUMOS' && carreta.insumoDetalhe) linhas.push(['Insumo', carreta.insumoDetalhe]);
  linhas.push(['Cavalo', carreta.temCavalo && carreta.placaCavalo ? carreta.placaCavalo : 'Sem cavalo']);
  linhas.push(['Localização', localizacaoTextoTela(carreta)]);
  if (carreta.presente) {
    linhas.push(['Chegada', formatarDataHora(carreta.chegadaTimestamp)]);
  } else {
    linhas.push(['Saída', formatarDataHora(carreta.saidaTimestamp)]);
    if (carreta.destino) linhas.push(['Destino', carreta.destino]);
  }
  linhas.push(['Última Movimentação', formatarDataHora(carreta.ultimaMovimentacaoTimestamp)]);

  document.getElementById('detalhes-conteudo').innerHTML = linhas
    .map(
      ([rotulo, valor]) =>
        `<div class="detalhes-linha"><span class="rotulo">${rotulo}</span><span class="valor">${valor}</span></div>`
    )
    .join('');

  const acoesEl = document.getElementById('detalhes-acoes');
  acoesEl.innerHTML = '';

  if (carreta.presente) {
    criarBotaoAcao(acoesEl, 'ALTERAR SITUAÇÃO', 'btn-outline', () => acaoAbrirAlterarSituacao(carreta.placa));
    criarBotaoAcao(acoesEl, 'ALTERAR CAVALO', 'btn-outline', () => acaoAbrirAlterarCavalo(carreta.placa));
    criarBotaoAcao(acoesEl, 'ALTERAR LOCALIZAÇÃO', 'btn-outline', () =>
      acaoAbrirAlterarLocalizacao(carreta.placa, 'carreta')
    );
    criarBotaoAcao(acoesEl, 'REGISTRAR SAÍDA', 'btn-secundario', () => acaoAbrirSaida(carreta.placa));
    criarBotaoAcao(acoesEl, 'EDITAR', 'btn-outline', () => acaoAbrirEditar(carreta.placa));
  }

  abrirOverlay('overlay-detalhes');
}

function criarBotaoAcao(container, texto, classe, handler) {
  const btn = document.createElement('button');
  btn.className = `btn ${classe}`;
  btn.textContent = texto;
  btn.addEventListener('click', handler);
  container.appendChild(btn);
}

/* ============================================================
   ALTERAR SITUAÇÃO
   ============================================================ */

async function acaoAbrirAlterarSituacao(placa) {
  contextoAlterarSituacaoPlaca = placa;
  const carreta = await DB.carretaBuscarPorPlaca(placa);

  document.getElementById('alterar-situacao-insumo-outro-texto').value = '';
  document.getElementById('alterar-situacao-insumo-outro-texto').style.display = 'none';
  selecaoAlterarSituacao = carreta.situacao;
  selecaoAlterarSituacaoInsumo = null;

  selecionarOpcao('alterar-situacao-opcoes', carreta.situacao);
  document.getElementById('alterar-situacao-insumo-wrap').style.display =
    carreta.situacao === 'INSUMOS' ? 'block' : 'none';

  document.querySelectorAll('#alterar-situacao-insumo-opcoes .opcao-btn').forEach((b) => b.classList.remove('selecionado'));
  if (carreta.situacao === 'INSUMOS' && carreta.insumoDetalhe) {
    const conhecido = ['Paletes', 'Caixa amarela'].includes(carreta.insumoDetalhe);
    selecaoAlterarSituacaoInsumo = conhecido ? carreta.insumoDetalhe : 'OUTRO';
    selecionarOpcao('alterar-situacao-insumo-opcoes', selecaoAlterarSituacaoInsumo);
    if (!conhecido) {
      document.getElementById('alterar-situacao-insumo-outro-texto').style.display = 'block';
      document.getElementById('alterar-situacao-insumo-outro-texto').value = carreta.insumoDetalhe;
    }
  }

  fecharOverlay('overlay-detalhes');
  abrirOverlay('overlay-alterar-situacao');
}

function ligarModalAlterarSituacao() {
  configurarPickerSituacao('alterar-situacao-opcoes', 'alterar-situacao-insumo-wrap', (valor) => {
    selecaoAlterarSituacao = valor;
  });
  configurarPickerInsumo('alterar-situacao-insumo-opcoes', 'alterar-situacao-insumo-outro-texto', (valor) => {
    selecaoAlterarSituacaoInsumo = valor;
  });

  document.getElementById('btn-confirmar-alterar-situacao').addEventListener('click', async () => {
    if (!selecaoAlterarSituacao) {
      toast('Selecione a situação.');
      return;
    }
    let insumoDetalhe = '';
    if (selecaoAlterarSituacao === 'INSUMOS' && selecaoAlterarSituacaoInsumo) {
      insumoDetalhe =
        selecaoAlterarSituacaoInsumo === 'OUTRO'
          ? document.getElementById('alterar-situacao-insumo-outro-texto').value.trim()
          : selecaoAlterarSituacaoInsumo;
    }

    const placa = contextoAlterarSituacaoPlaca;
    const carreta = await DB.carretaBuscarPorPlaca(placa);
    const agora = Date.now();
    carreta.situacao = selecaoAlterarSituacao;
    carreta.insumoDetalhe = insumoDetalhe;
    carreta.ultimaMovimentacaoTimestamp = agora;
    carreta.atualizadoEm = agora;
    await DB.carretaSalvar(carreta);
    await DB.movimentacaoRegistrar({
      placa,
      tipo: TIPO_MOVIMENTO.SITUACAO,
      detalhe: `${SITUACAO_LABEL[selecaoAlterarSituacao]}${insumoDetalhe ? ' — ' + insumoDetalhe : ''}`,
      timestamp: agora,
      doca: carreta.doca || '',
    });

    fecharOverlay('overlay-alterar-situacao');
    toast('Situação atualizada.');
    await atualizarTudo();
  });
}

/* ============================================================
   ALTERAR CAVALO
   ============================================================ */

async function acaoAbrirAlterarCavalo(placa) {
  contextoAlterarCavaloPlaca = placa;
  const carreta = await DB.carretaBuscarPorPlaca(placa);

  document.getElementById('alterar-cavalo-aviso').innerHTML = '';
  selecaoAlterarCavalo = carreta.temCavalo ? 'COM' : 'SEM';
  selecionarOpcao('alterar-cavalo-opcoes', selecaoAlterarCavalo);
  document.getElementById('alterar-cavalo-placa-wrap').style.display = carreta.temCavalo ? 'block' : 'none';
  document.getElementById('alterar-cavalo-placa').value = carreta.placaCavalo || '';

  fecharOverlay('overlay-detalhes');
  abrirOverlay('overlay-alterar-cavalo');
}

function ligarModalAlterarCavalo() {
  configurarPickerSimples('alterar-cavalo-opcoes', (valor) => {
    selecaoAlterarCavalo = valor;
    document.getElementById('alterar-cavalo-placa-wrap').style.display = valor === 'COM' ? 'block' : 'none';
  });

  const placaInput = document.getElementById('alterar-cavalo-placa');
  placaInput.addEventListener('input', async () => {
    placaInput.value = normalizarPlaca(placaInput.value);
    const avisoEl = document.getElementById('alterar-cavalo-aviso');
    avisoEl.innerHTML = '';
    if (placaInput.value.length < 6) return;
    const conflito = await encontrarCarretaComCavalo(placaInput.value, contextoAlterarCavaloPlaca);
    if (conflito) {
      avisoEl.innerHTML = `<div class="aviso-box">Este cavalo já está vinculado à carreta ${conflito.placa}.</div>`;
    }
  });

  document.getElementById('btn-confirmar-alterar-cavalo').addEventListener('click', async () => {
    const placa = contextoAlterarCavaloPlaca;
    const carreta = await DB.carretaBuscarPorPlaca(placa);
    const agora = Date.now();
    let detalhe;
    let placaCavaloVinculada = '';

    if (selecaoAlterarCavalo === 'COM') {
      const placaCavalo = normalizarPlaca(document.getElementById('alterar-cavalo-placa').value);
      if (!placaCavalo) {
        toast('Informe a placa do cavalo.');
        return;
      }
      const conflito = await encontrarCarretaComCavalo(placaCavalo, placa);
      if (conflito) {
        toast(`Este cavalo já está vinculado à carreta ${conflito.placa}.`);
        return;
      }
      carreta.temCavalo = true;
      carreta.placaCavalo = placaCavalo;
      placaCavaloVinculada = placaCavalo;
      detalhe = `Com cavalo ${placaCavalo}`;
    } else {
      carreta.temCavalo = false;
      carreta.placaCavalo = '';
      detalhe = 'Sem cavalo';
    }

    carreta.ultimaMovimentacaoTimestamp = agora;
    carreta.atualizadoEm = agora;
    await DB.carretaSalvar(carreta);

    if (placaCavaloVinculada) {
      const avulso = await DB.cavaloAvulsoBuscarPorPlaca(placaCavaloVinculada);
      if (avulso) await DB.cavaloAvulsoExcluir(placaCavaloVinculada);
    }

    await DB.movimentacaoRegistrar({
      placa,
      tipo: TIPO_MOVIMENTO.CAVALO,
      detalhe,
      timestamp: agora,
      doca: carreta.doca || '',
    });

    fecharOverlay('overlay-alterar-cavalo');
    toast('Cavalo atualizado.');
    await atualizarTudo();
  });
}

/* ============================================================
   ALTERAR LOCALIZAÇÃO (carreta ou cavalo avulso)
   ============================================================ */

async function acaoAbrirAlterarLocalizacao(placa, tipo) {
  contextoLocalizacaoAlvo = { placa, tipo };
  const entidade =
    tipo === 'cavalo' ? await DB.cavaloAvulsoBuscarPorPlaca(placa) : await DB.carretaBuscarPorPlaca(placa);

  document.getElementById('alterar-localizacao-doca-numero').value = entidade.doca || '';
  document.getElementById('alterar-localizacao-outro-texto').value = entidade.localizacaoOutroTexto || '';
  selecaoAlterarLocalizacao = entidade.localizacao;
  selecionarOpcao('alterar-localizacao-opcoes', entidade.localizacao);
  document.getElementById('alterar-localizacao-doca-wrap').style.display =
    entidade.localizacao === 'DOCA' ? 'block' : 'none';
  document.getElementById('alterar-localizacao-outro-wrap').style.display =
    entidade.localizacao === 'OUTRO' ? 'block' : 'none';

  fecharOverlay('overlay-detalhes');
  abrirOverlay('overlay-alterar-localizacao');
}

function ligarModalAlterarLocalizacao() {
  configurarPickerLocalizacao(
    'alterar-localizacao-opcoes',
    'alterar-localizacao-doca-wrap',
    'alterar-localizacao-outro-wrap',
    (valor) => {
      selecaoAlterarLocalizacao = valor;
    }
  );

  document.getElementById('btn-confirmar-alterar-localizacao').addEventListener('click', async () => {
    if (!selecaoAlterarLocalizacao) {
      toast('Selecione a localização.');
      return;
    }
    let docaNumero = '';
    if (selecaoAlterarLocalizacao === 'DOCA') {
      docaNumero = normalizarPlaca(document.getElementById('alterar-localizacao-doca-numero').value);
      if (!docaNumero) {
        toast('Informe o número da doca.');
        return;
      }
    }
    let outroTexto = '';
    if (selecaoAlterarLocalizacao === 'OUTRO') {
      outroTexto = document.getElementById('alterar-localizacao-outro-texto').value.trim();
      if (!outroTexto) {
        toast('Descreva a localização.');
        return;
      }
    }

    const { placa, tipo } = contextoLocalizacaoAlvo;

    const finalizar = async () => {
      const agora = Date.now();
      if (tipo === 'cavalo') {
        const cavalo = await DB.cavaloAvulsoBuscarPorPlaca(placa);
        cavalo.localizacao = selecaoAlterarLocalizacao;
        cavalo.doca = docaNumero;
        cavalo.localizacaoOutroTexto = outroTexto;
        cavalo.ultimaMovimentacaoTimestamp = agora;
        await DB.cavaloAvulsoSalvar(cavalo);
        await DB.movimentacaoRegistrar({
          placa,
          tipo: TIPO_MOVIMENTO.CAVALO_AVULSO,
          detalhe: `Cavalo — ${localizacaoTextoTela(cavalo)}`,
          timestamp: agora,
          doca: docaNumero,
        });
      } else {
        const carreta = await DB.carretaBuscarPorPlaca(placa);
        carreta.localizacao = selecaoAlterarLocalizacao;
        carreta.doca = docaNumero;
        carreta.localizacaoOutroTexto = outroTexto;
        carreta.ultimaMovimentacaoTimestamp = agora;
        carreta.atualizadoEm = agora;
        await DB.carretaSalvar(carreta);
        await DB.movimentacaoRegistrar({
          placa,
          tipo: TIPO_MOVIMENTO.LOCALIZACAO,
          detalhe: localizacaoTextoTela(carreta),
          timestamp: agora,
          doca: docaNumero,
        });
      }

      fecharOverlay('overlay-alterar-localizacao');
      toast('Localização atualizada.');
      await atualizarTudo();
    };

    if (selecaoAlterarLocalizacao === 'DOCA' && tipo === 'carreta') {
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
  });
}

/* ============================================================
   REGISTRAR SAÍDA
   ============================================================ */

async function acaoAbrirSaida(placa) {
  contextoSaidaPlaca = placa;
  const carreta = await DB.carretaBuscarPorPlaca(placa);

  document.getElementById('saida-placa-texto').textContent = carreta.placa;
  document.getElementById('saida-destino').value = '';

  const cavaloLinha = document.getElementById('saida-cavalo-linha');
  if (carreta.temCavalo && carreta.placaCavalo) {
    cavaloLinha.style.display = 'flex';
    document.getElementById('saida-cavalo-texto').textContent = carreta.placaCavalo;
  } else {
    cavaloLinha.style.display = 'none';
  }

  fecharOverlay('overlay-detalhes');
  abrirOverlay('overlay-saida');
}

function ligarModalSaida() {
  document.getElementById('btn-confirmar-saida').addEventListener('click', async () => {
    const placa = contextoSaidaPlaca;
    const carreta = await DB.carretaBuscarPorPlaca(placa);
    const agora = Date.now();
    const destino = document.getElementById('saida-destino').value.trim();

    carreta.presente = false;
    carreta.destino = destino;
    carreta.saidaTimestamp = agora;
    carreta.ultimaMovimentacaoTimestamp = agora;
    carreta.atualizadoEm = agora;
    await DB.carretaSalvar(carreta);

    await DB.movimentacaoRegistrar({
      placa,
      tipo: TIPO_MOVIMENTO.SAIDA,
      detalhe: `SAÍDA${destino ? ' — ' + destino : ''}`,
      timestamp: agora,
      doca: '',
    });

    fecharOverlay('overlay-saida');
    toast('Saída registrada.');
    await atualizarTudo();
  });
}

/* ============================================================
   EDITAR
   ============================================================ */

async function acaoAbrirEditar(placa) {
  contextoEditarPlaca = placa;
  const carreta = await DB.carretaBuscarPorPlaca(placa);

  const insumoWrap = document.getElementById('editar-insumo-wrap');
  const outroWrap = document.getElementById('editar-localizacao-outro-wrap');

  insumoWrap.style.display = carreta.situacao === 'INSUMOS' ? 'block' : 'none';
  document.getElementById('editar-insumo-texto').value = carreta.insumoDetalhe || '';

  outroWrap.style.display = carreta.localizacao === 'OUTRO' ? 'block' : 'none';
  document.getElementById('editar-localizacao-outro-texto').value = carreta.localizacaoOutroTexto || '';

  fecharOverlay('overlay-detalhes');
  abrirOverlay('overlay-editar');
}

function ligarModalEditar() {
  document.getElementById('btn-confirmar-editar').addEventListener('click', async () => {
    const placa = contextoEditarPlaca;
    const carreta = await DB.carretaBuscarPorPlaca(placa);
    const agora = Date.now();

    if (carreta.situacao === 'INSUMOS') {
      carreta.insumoDetalhe = document.getElementById('editar-insumo-texto').value.trim();
    }
    if (carreta.localizacao === 'OUTRO') {
      carreta.localizacaoOutroTexto = document.getElementById('editar-localizacao-outro-texto').value.trim();
    }
    carreta.atualizadoEm = agora;
    await DB.carretaSalvar(carreta);
    await DB.movimentacaoRegistrar({
      placa,
      tipo: TIPO_MOVIMENTO.EDICAO,
      detalhe: 'Dados editados',
      timestamp: agora,
      doca: carreta.doca || '',
    });

    fecharOverlay('overlay-editar');
    toast('Carreta atualizada.');
    await atualizarTudo();
  });
}

/* ============================================================
   CAVALO NO PÁTIO (avulso)
   ============================================================ */

function abrirModalCavaloAvulso() {
  document.getElementById('cavalo-avulso-placa').value = '';
  document.getElementById('cavalo-avulso-doca-numero').value = '';
  document.getElementById('cavalo-avulso-outro-texto').value = '';
  document.getElementById('cavalo-avulso-doca-wrap').style.display = 'none';
  document.getElementById('cavalo-avulso-outro-wrap').style.display = 'none';
  document.getElementById('cavalo-avulso-aviso').innerHTML = '';
  selecaoCavaloAvulsoLocalizacao = null;
  document.querySelectorAll('#cavalo-avulso-localizacao .opcao-btn').forEach((b) => b.classList.remove('selecionado'));
  abrirOverlay('overlay-cavalo-avulso');
}

function ligarModalCavaloAvulso() {
  const placaInput = document.getElementById('cavalo-avulso-placa');
  placaInput.addEventListener('input', async () => {
    placaInput.value = normalizarPlaca(placaInput.value);
    const avisoEl = document.getElementById('cavalo-avulso-aviso');
    avisoEl.innerHTML = '';
    if (placaInput.value.length < 6) return;
    const conflito = await encontrarCarretaComCavalo(placaInput.value, null);
    if (conflito) {
      avisoEl.innerHTML = `<div class="aviso-box">Este cavalo já está vinculado à carreta ${conflito.placa}.</div>`;
    }
  });

  configurarPickerLocalizacao(
    'cavalo-avulso-localizacao',
    'cavalo-avulso-doca-wrap',
    'cavalo-avulso-outro-wrap',
    (valor) => {
      selecaoCavaloAvulsoLocalizacao = valor;
    }
  );

  document.getElementById('btn-confirmar-cavalo-avulso').addEventListener('click', async () => {
    const placa = normalizarPlaca(document.getElementById('cavalo-avulso-placa').value);
    if (!placa) {
      toast('Informe a placa do cavalo.');
      return;
    }
    const conflito = await encontrarCarretaComCavalo(placa, null);
    if (conflito) {
      toast(`Este cavalo já está vinculado à carreta ${conflito.placa}.`);
      return;
    }
    if (!selecaoCavaloAvulsoLocalizacao) {
      toast('Selecione a localização.');
      return;
    }
    let docaNumero = '';
    if (selecaoCavaloAvulsoLocalizacao === 'DOCA') {
      docaNumero = normalizarPlaca(document.getElementById('cavalo-avulso-doca-numero').value);
      if (!docaNumero) {
        toast('Informe o número da doca.');
        return;
      }
    }
    let outroTexto = '';
    if (selecaoCavaloAvulsoLocalizacao === 'OUTRO') {
      outroTexto = document.getElementById('cavalo-avulso-outro-texto').value.trim();
      if (!outroTexto) {
        toast('Descreva a localização.');
        return;
      }
    }

    const agora = Date.now();
    const cavalo = {
      placa,
      localizacao: selecaoCavaloAvulsoLocalizacao,
      doca: docaNumero,
      localizacaoOutroTexto: outroTexto,
      criadoEm: agora,
      ultimaMovimentacaoTimestamp: agora,
    };
    await DB.cavaloAvulsoSalvar(cavalo);
    await DB.movimentacaoRegistrar({
      placa,
      tipo: TIPO_MOVIMENTO.CAVALO_AVULSO,
      detalhe: `Cavalo no pátio — ${localizacaoTextoTela(cavalo)}`,
      timestamp: agora,
      doca: docaNumero,
    });

    fecharOverlay('overlay-cavalo-avulso');
    toast('Cavalo registrado.');
    await atualizarTudo();
  });
}

async function acaoRemoverCavaloAvulso(placa) {
  abrirConfirm('Remover do Pátio', `Remover o cavalo ${placa} do pátio?`, async () => {
    await DB.cavaloAvulsoExcluir(placa);
    await DB.movimentacaoRegistrar({
      placa,
      tipo: TIPO_MOVIMENTO.CAVALO_AVULSO,
      detalhe: 'Removido do pátio',
      timestamp: Date.now(),
      doca: '',
    });
    fecharOverlay('overlay-detalhes');
    toast('Cavalo removido.');
    await atualizarTudo();
  });
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
        <div class="descricao">${m.detalhe || m.tipo}</div>
      </div>
    `;
    div.addEventListener('click', async () => {
      const carreta = await DB.carretaBuscarPorPlaca(m.placa);
      if (carreta) {
        abrirDetalhes(m.placa, 'carreta');
      } else {
        const cavalo = await DB.cavaloAvulsoBuscarPorPlaca(m.placa);
        if (cavalo) abrirDetalhes(m.placa, 'cavalo');
      }
    });
    container.appendChild(div);
  });
}

/* ============================================================
   ATUALIZAÇÃO PÁTIO
   ============================================================ */

function ligarAtualizacaoPatio() {
  document.getElementById('btn-copiar-atualizacao').addEventListener('click', async () => {
    const texto = document.getElementById('resumo-atualizacao-texto').textContent;
    const ok = await copiarParaAreaTransferencia(texto);
    toast(ok ? 'Atualização copiada.' : 'Não foi possível copiar.');
  });
}

async function renderAtualizacaoPatio() {
  const carretas = await DB.carretaListarTodas();
  const ativas = carretas.filter((c) => c.presente);
  const cavalosAvulsos = await DB.cavaloAvulsoListarTodos();

  const linhaComCavalo = (c) => `${c.placa} com cavalo ${c.placaCavalo} ${localizacaoTextoMensagem(c)}`;
  const linhaSemCavalo = (c) => `${c.placa} ${localizacaoTextoMensagem(c)}`;
  const linhaInsumo = (c) => `${c.placa} ${(c.insumoDetalhe || 'insumos').toLowerCase()}`;
  const linhaCavaloAvulso = (c) => `${c.placa} ${localizacaoTextoMensagem(c)}`;

  const secoes = [
    ['Carretas vazias com cavalo', ativas.filter((c) => c.situacao === 'VAZIA' && c.temCavalo).map(linhaComCavalo)],
    ['Carretas vazias sem cavalo', ativas.filter((c) => c.situacao === 'VAZIA' && !c.temCavalo).map(linhaSemCavalo)],
    [
      'Carretas carregadas com cavalo',
      ativas.filter((c) => c.situacao === 'CARREGADA' && c.temCavalo).map(linhaComCavalo),
    ],
    [
      'Carretas carregadas sem cavalo',
      ativas.filter((c) => c.situacao === 'CARREGADA' && !c.temCavalo).map(linhaSemCavalo),
    ],
    [
      'Carretas carregando sem cavalo',
      ativas.filter((c) => c.situacao === 'CARREGANDO' && !c.temCavalo).map(linhaSemCavalo),
    ],
    [
      'Carretas carregando com cavalo',
      ativas.filter((c) => c.situacao === 'CARREGANDO' && c.temCavalo).map(linhaComCavalo),
    ],
    ['Carretas com insumos', ativas.filter((c) => c.situacao === 'INSUMOS').map(linhaInsumo)],
    ['Cavalo no pátio', cavalosAvulsos.map(linhaCavaloAvulso)],
  ];

  const linhas = ['Atualização Pátio', ''];
  secoes.forEach(([titulo, itens]) => {
    if (itens.length === 0) return;
    linhas.push(titulo);
    linhas.push(...itens);
    linhas.push('');
  });
  while (linhas.length && linhas[linhas.length - 1] === '') linhas.pop();

  document.getElementById('resumo-atualizacao-texto').textContent = linhas.join('\n');
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
