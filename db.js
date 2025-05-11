// --- Supabase config ---
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Reemplaza con tus valores
const SUPABASE_URL = 'https://TUSUPABASEURL.supabase.co';
const SUPABASE_KEY = 'TU_CLAVE_PUBLICA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

// Guardar o actualizar cliente (marca como no sincronizado)
async function guardarCliente(cliente) {
  cliente.sincronizado = false;
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

// Obtener los clientes que no se han sincronizado
async function obtenerNoSincronizados() {
  const todos = await obtenerTodos();
  return todos.filter(c => !c.sincronizado);
}

// Sincronizar clientes con Supabase cuando haya conexión
async function sincronizarConSupabase() {
  const pendientes = await obtenerNoSincronizados();

  for (const cliente of pendientes) {
    const { error } = await supabase.from('clientes').insert({
      id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      // agrega más campos si tienes más
    });

    if (!error) {
      cliente.sincronizado = true;
      await guardarCliente(cliente);
    } else {
      console.error("Error al subir a Supabase:", error);
    }
  }
}

// Escuchar conexión restaurada
window.addEventListener('online', () => {
  console.log("🟢 Conexión restaurada. Sincronizando con Supabase...");
  sincronizarConSupabase();
});

// Exportar funciones
export {
  guardarCliente,
  obtenerCliente,
  obtenerTodos,
  borrarCliente,
  sincronizarConSupabase
};
