/* LEMAR Controle de Pátio — camada de dados (IndexedDB) */

const DB_NAME = 'lemarPatioDB';
const DB_VERSION = 2;

const STORE_CARRETAS = 'carretas';
const STORE_CAVALOS_AVULSOS = 'cavalosAvulsos';
const STORE_MOVIMENTACOES = 'movimentacoes';
const STORE_CONFIG = 'config';

let dbInstance = null;

function abrirBanco() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (db.objectStoreNames.contains(STORE_CARRETAS)) {
        db.deleteObjectStore(STORE_CARRETAS);
      }
      const carretas = db.createObjectStore(STORE_CARRETAS, { keyPath: 'placa' });
      carretas.createIndex('presente', 'presente', { unique: false });

      if (!db.objectStoreNames.contains(STORE_CAVALOS_AVULSOS)) {
        db.createObjectStore(STORE_CAVALOS_AVULSOS, { keyPath: 'placa' });
      }

      if (!db.objectStoreNames.contains(STORE_MOVIMENTACOES)) {
        const movimentacoes = db.createObjectStore(STORE_MOVIMENTACOES, {
          keyPath: 'id',
          autoIncrement: true,
        });
        movimentacoes.createIndex('placa', 'placa', { unique: false });
        movimentacoes.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_CONFIG)) {
        db.createObjectStore(STORE_CONFIG, { keyPath: 'chave' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function transacao(storeNames, modo) {
  return abrirBanco().then((db) => db.transaction(storeNames, modo));
}

/* ---------- CARRETAS ---------- */

async function carretaSalvar(carreta) {
  const tx = await transacao(STORE_CARRETAS, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = tx.objectStore(STORE_CARRETAS).put(carreta);
    req.onsuccess = () => resolve(carreta);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function carretaBuscarPorPlaca(placa) {
  const tx = await transacao(STORE_CARRETAS, 'readonly');
  return new Promise((resolve, reject) => {
    const req = tx.objectStore(STORE_CARRETAS).get(placa);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function carretaListarTodas() {
  const tx = await transacao(STORE_CARRETAS, 'readonly');
  return new Promise((resolve, reject) => {
    const req = tx.objectStore(STORE_CARRETAS).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

/* ---------- CAVALOS AVULSOS ---------- */

async function cavaloAvulsoSalvar(cavalo) {
  const tx = await transacao(STORE_CAVALOS_AVULSOS, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = tx.objectStore(STORE_CAVALOS_AVULSOS).put(cavalo);
    req.onsuccess = () => resolve(cavalo);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function cavaloAvulsoBuscarPorPlaca(placa) {
  const tx = await transacao(STORE_CAVALOS_AVULSOS, 'readonly');
  return new Promise((resolve, reject) => {
    const req = tx.objectStore(STORE_CAVALOS_AVULSOS).get(placa);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function cavaloAvulsoListarTodos() {
  const tx = await transacao(STORE_CAVALOS_AVULSOS, 'readonly');
  return new Promise((resolve, reject) => {
    const req = tx.objectStore(STORE_CAVALOS_AVULSOS).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function cavaloAvulsoExcluir(placa) {
  const tx = await transacao(STORE_CAVALOS_AVULSOS, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = tx.objectStore(STORE_CAVALOS_AVULSOS).delete(placa);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

/* ---------- MOVIMENTAÇÕES ---------- */

async function movimentacaoRegistrar(mov) {
  const tx = await transacao(STORE_MOVIMENTACOES, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = tx.objectStore(STORE_MOVIMENTACOES).add(mov);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function movimentacaoListarTodas() {
  const tx = await transacao(STORE_MOVIMENTACOES, 'readonly');
  return new Promise((resolve, reject) => {
    const req = tx.objectStore(STORE_MOVIMENTACOES).getAll();
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.timestamp - a.timestamp));
    req.onerror = (e) => reject(e.target.error);
  });
}

/* ---------- CONFIG ---------- */

async function configSalvar(chave, valor) {
  const tx = await transacao(STORE_CONFIG, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = tx.objectStore(STORE_CONFIG).put({ chave, valor });
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

async function configBuscar(chave, padrao = null) {
  const tx = await transacao(STORE_CONFIG, 'readonly');
  return new Promise((resolve, reject) => {
    const req = tx.objectStore(STORE_CONFIG).get(chave);
    req.onsuccess = () => resolve(req.result ? req.result.valor : padrao);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function configListarTodas() {
  const tx = await transacao(STORE_CONFIG, 'readonly');
  return new Promise((resolve, reject) => {
    const req = tx.objectStore(STORE_CONFIG).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

/* ---------- BACKUP / RESTAURAÇÃO ---------- */

async function backupExportarDados() {
  const [carretas, cavalosAvulsos, movimentacoes, config] = await Promise.all([
    carretaListarTodas(),
    cavaloAvulsoListarTodos(),
    movimentacaoListarTodas(),
    configListarTodas(),
  ]);
  return {
    app: 'lemar-controle-patio',
    versao: DB_VERSION,
    geradoEm: Date.now(),
    carretas,
    cavalosAvulsos,
    movimentacoes,
    config,
  };
}

function backupValidar(dados) {
  if (!dados || typeof dados !== 'object') return false;
  if (dados.app !== 'lemar-controle-patio') return false;
  if (!Array.isArray(dados.carretas)) return false;
  if (!Array.isArray(dados.movimentacoes)) return false;
  if (!Array.isArray(dados.config)) return false;
  return true;
}

async function backupRestaurarDados(dados) {
  if (!backupValidar(dados)) {
    throw new Error('Arquivo de backup inválido ou incompatível.');
  }
  const db = await abrirBanco();
  const tx = db.transaction(
    [STORE_CARRETAS, STORE_CAVALOS_AVULSOS, STORE_MOVIMENTACOES, STORE_CONFIG],
    'readwrite'
  );

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);

    const carretasStore = tx.objectStore(STORE_CARRETAS);
    const cavalosStore = tx.objectStore(STORE_CAVALOS_AVULSOS);
    const movStore = tx.objectStore(STORE_MOVIMENTACOES);
    const configStore = tx.objectStore(STORE_CONFIG);

    carretasStore.clear();
    cavalosStore.clear();
    movStore.clear();
    configStore.clear();

    dados.carretas.forEach((c) => carretasStore.put(c));
    (dados.cavalosAvulsos || []).forEach((c) => cavalosStore.put(c));
    dados.movimentacoes.forEach((m) => movStore.put(m));
    dados.config.forEach((c) => configStore.put(c));
  });
}

const DB = {
  carretaSalvar,
  carretaBuscarPorPlaca,
  carretaListarTodas,
  cavaloAvulsoSalvar,
  cavaloAvulsoBuscarPorPlaca,
  cavaloAvulsoListarTodos,
  cavaloAvulsoExcluir,
  movimentacaoRegistrar,
  movimentacaoListarTodas,
  configSalvar,
  configBuscar,
  configListarTodas,
  backupExportarDados,
  backupRestaurarDados,
};
