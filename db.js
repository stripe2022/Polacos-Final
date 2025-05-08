const dbNombre = "PolacosGymDB";
const storeNombre = "clientes";

// Inicializa DB
function abrirDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbNombre, 1);

    request.onerror = () => reject("Error al abrir IndexedDB");

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(storeNombre)) {
        const store = db.createObjectStore(storeNombre, { keyPath: "id" });
        store.createIndex("nombre", "nombre", { unique: false });
        store.createIndex("telefono", "telefono", { unique: false });
        // Puedes añadir más índices si necesitas buscar por otros campos
      }
    };
  });
}

// Guardar o actualizar cliente
async function guardarCliente(cliente) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNombre, "readwrite");
    const store = tx.objectStore(storeNombre);
    const req = store.put(cliente);

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject("Error al guardar cliente");
  });
}

// Obtener todos los clientes
async function obtenerTodos() {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNombre, "readonly");
    const store = tx.objectStore(storeNombre);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Error al obtener clientes");
  });
}

// Obtener cliente por ID
async function obtenerCliente(id) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNombre, "readonly");
    const store = tx.objectStore(storeNombre);
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Error al obtener cliente");
  });
}

// Borrar cliente por ID
async function borrarCliente(id) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNombre, "readwrite");
    const store = tx.objectStore(storeNombre);
    const req = store.delete(id);

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject("Error al borrar cliente");
  });
}
