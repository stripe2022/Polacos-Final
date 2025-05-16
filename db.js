// --- IndexedDB setup ---
const dbNombre = "PolacosGymDB";
const storeNombre = "clientes";

// Inicializa IndexedDB
function abrirDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbNombre, 1);
    request.onerror = () => reject("Error al abrir IndexedDB");

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      const store = db.createObjectStore(storeNombre, { keyPath: "id" });
      store.createIndex("nombre", "nombre", { unique: false });
      store.createIndex("telefono", "telefono", { unique: false });
    };
  });
}

// Guardar o actualizar cliente
async function guardarCliente(cliente) {
  const db = await abrirDB();
  const tx = db.transaction(storeNombre, "readwrite");
  const store = tx.objectStore(storeNombre);
  store.put(cliente);
  return tx.complete;
}

// Obtener todos los clientes
async function obtenerTodos() {
  const db = await abrirDB();
  const tx = db.transaction(storeNombre, "readonly");
  const store = tx.objectStore(storeNombre);
  return new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });
}

// Obtener un cliente por ID
async function obtenerCliente(id) {
  const db = await abrirDB();
  const tx = db.transaction(storeNombre, "readonly");
  const store = tx.objectStore(storeNombre);
  return new Promise((resolve) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
  });
}

// Borrar cliente
async function borrarCliente(id) {
  const db = await abrirDB();
  const tx = db.transaction(storeNombre, "readwrite");
  const store = tx.objectStore(storeNombre);
  store.delete(id);
  return tx.complete;
}

// Exportar funciones
export {
  guardarCliente,
  obtenerCliente,
  obtenerTodos,
  borrarCliente
};
