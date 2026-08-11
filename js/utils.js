/* LEMAR Controle de Pátio — utilitários */

const STATUS = {
  DISPONIVEL: 'DISPONIVEL',
  NA_DOCA: 'NA_DOCA',
  AGUARDANDO: 'AGUARDANDO',
  INDISPONIVEL: 'INDISPONIVEL',
  FORA_DO_PATIO: 'FORA_DO_PATIO',
};

const STATUS_LABEL = {
  DISPONIVEL: 'DISPONÍVEL',
  NA_DOCA: 'NA DOCA',
  AGUARDANDO: 'AGUARDANDO',
  INDISPONIVEL: 'INDISPONÍVEL',
  FORA_DO_PATIO: 'FORA DO PÁTIO',
};

const CONDICAO = {
  VAZIA: 'VAZIA',
  CARREGADA: 'CARREGADA',
};

const TIPO_MOVIMENTO = {
  CHEGADA: 'CHEGADA',
  SAIDA: 'SAIDA',
  DISPONIVEL: 'DISPONIVEL',
  DOCA: 'DOCA',
  AGUARDANDO: 'AGUARDANDO',
  INDISPONIVEL: 'INDISPONIVEL',
  EDICAO: 'EDICAO',
};

const TIPO_MOVIMENTO_LABEL = {
  CHEGADA: 'CHEGADA',
  SAIDA: 'SAÍDA',
  DISPONIVEL: 'DISPONÍVEL',
  DOCA: 'MOVIDA PARA DOCA',
  AGUARDANDO: 'AGUARDANDO',
  INDISPONIVEL: 'INDISPONÍVEL',
  EDICAO: 'EDITADA',
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

function ehOntem(timestamp) {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const d = new Date(timestamp);
  return (
    d.getDate() === ontem.getDate() &&
    d.getMonth() === ontem.getMonth() &&
    d.getFullYear() === ontem.getFullYear()
  );
}

function gerarId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
