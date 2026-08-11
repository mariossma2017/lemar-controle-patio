/* LEMAR Controle de Pátio — utilitários */

const SITUACAO = {
  VAZIA: 'VAZIA',
  CARREGADA: 'CARREGADA',
  CARREGANDO: 'CARREGANDO',
  INSUMOS: 'INSUMOS',
};

const SITUACAO_LABEL = {
  VAZIA: 'VAZIA',
  CARREGADA: 'CARREGADA',
  CARREGANDO: 'CARREGANDO',
  INSUMOS: 'INSUMOS',
};

const LOCALIZACAO = {
  PATIO: 'PATIO',
  DOCA: 'DOCA',
  DOCA_MORTA: 'DOCA_MORTA',
  LATERAL: 'LATERAL',
  OBLIQUO: 'OBLIQUO',
  LATERAL_OBLIQUO: 'LATERAL_OBLIQUO',
  BOLSAO: 'BOLSAO',
  OUTRO: 'OUTRO',
};

const LOCALIZACAO_LABEL = {
  PATIO: 'PÁTIO',
  DOCA: 'DOCA',
  DOCA_MORTA: 'DOCA MORTA',
  LATERAL: 'LATERAL',
  OBLIQUO: 'OBLÍQUO',
  LATERAL_OBLIQUO: 'LATERAL OBLÍQUO',
  BOLSAO: 'BOLSÃO',
  OUTRO: 'OUTRO',
};

const LOCALIZACAO_TEXTO_MENSAGEM = {
  PATIO: 'pátio',
  DOCA_MORTA: 'doca morta',
  LATERAL: 'lateral',
  OBLIQUO: 'oblíquo',
  LATERAL_OBLIQUO: 'lateral oblíquo',
  BOLSAO: 'bolsão',
};

const TIPO_MOVIMENTO = {
  CHEGADA: 'CHEGADA',
  SITUACAO: 'SITUACAO',
  LOCALIZACAO: 'LOCALIZACAO',
  CAVALO: 'CAVALO',
  SAIDA: 'SAIDA',
  EDICAO: 'EDICAO',
  CAVALO_AVULSO: 'CAVALO_AVULSO',
};

function normalizarPlaca(valor) {
  return (valor || '')
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

function formatarData(timestamp) {
  const d = new Date(timestamp);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function formatarHora(timestamp) {
  const d = new Date(timestamp);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatarDataHora(timestamp) {
  return `${formatarData(timestamp)} ${formatarHora(timestamp)}`;
}

function ehHoje(timestamp) {
  const hoje = new Date();
  const d = new Date(timestamp);
  return (
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear()
  );
}

/* texto de localização usado na tela (ex.: "Doca 12", "Lateral", "Outro: Fundos") */
function localizacaoTextoTela(entidade) {
  if (entidade.localizacao === LOCALIZACAO.DOCA) {
    return `Doca ${entidade.doca}`;
  }
  if (entidade.localizacao === LOCALIZACAO.OUTRO) {
    return entidade.localizacaoOutroTexto ? entidade.localizacaoOutroTexto : 'Outro';
  }
  return LOCALIZACAO_LABEL[entidade.localizacao] || entidade.localizacao;
}

/* texto de localização usado na mensagem de Atualização Pátio (ex.: "doca 12", "bolsão") */
function localizacaoTextoMensagem(entidade) {
  if (entidade.localizacao === LOCALIZACAO.DOCA) {
    return `doca ${entidade.doca}`;
  }
  if (entidade.localizacao === LOCALIZACAO.OUTRO) {
    return (entidade.localizacaoOutroTexto || 'outro').toLowerCase();
  }
  return LOCALIZACAO_TEXTO_MENSAGEM[entidade.localizacao] || '';
}

async function copiarParaAreaTransferencia(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (e) {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(textarea);
    return ok;
  }
}
