// === Inicializar IndexedDB ===
let db;
const request = indexedDB.open("ClientesDB", 1);

request.onerror = (e) => console.error("Error al abrir IndexedDB:", e);
request.onsuccess = (e) => {
  db = e.target.result;
  console.log("Base de datos abierta correctamente");
};
request.onupgradeneeded = (e) => {
  db = e.target.result;
  const store = db.createObjectStore("clientes", { keyPath: "id", autoIncrement: true });
  store.createIndex("nombre", "nombre", { unique: false });
  store.createIndex("telefono", "telefono", { unique: false });
};

// === Conversión peso ===
function convertirKgLb() {
  const kg = parseFloat(document.querySelector('[name="pesoKg"]').value);
  if (!isNaN(kg)) document.querySelector('[name="pesoLb"]').value = (kg * 2.20462).toFixed(2);
}
function convertirLbKg() {
  const lb = parseFloat(document.querySelector('[name="pesoLb"]').value);
  if (!isNaN(lb)) document.querySelector('[name="pesoKg"]').value = (lb / 2.20462).toFixed(2);
}

// === Guardar datos ===
function guardarDatos() {
  if (!db) {
    console.error("La base de datos aún no está lista.");
    alert("Base de datos no disponible. Intenta de nuevo en unos segundos.");
    return;
  }

  const form = document.getElementById("registroForm");
  const data = {
    nombre: form.nombre.value.trim(),
    apellido: form.apellido.value.trim(),
    telefono: form.telefono.value.trim(),
    fecha: form.fecha.value,
    pesoKg: parseFloat(form.pesoKg.value) || null,
    pesoLb: parseFloat(form.pesoLb.value) || null,
    comentario: document.getElementById("comentario").value.trim()
  };

  if (!data.nombre || !data.apellido || !data.telefono) {
    alert("Completa nombre, apellido y teléfono.");
    return;
  }

  const fotoInput = document.getElementById("foto");
  const fotoFile = fotoInput.files[0];

  if (fotoFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const arrayBuffer = e.target.result;
      const fotoBlob = new Blob([arrayBuffer], { type: fotoFile.type });
      guardarCliente(data, fotoBlob);
      limpiarFormulario();
    };
    reader.readAsArrayBuffer(fotoFile);
  } else {
    guardarCliente(data, null);
    limpiarFormulario();
  }
}

function guardarCliente(data, fotoBlob) {
  const transaccion = db.transaction(["clientes"], "readwrite");
  const store = transaccion.objectStore("clientes");

  store.add({ ...data, foto: fotoBlob || null }).onsuccess = () =>
    console.log("Cliente guardado correctamente");
}

function limpiarFormulario() {
  const form = document.getElementById("registroForm");
  form.reset();
  document.getElementById("comentario").value = "";
  document.getElementById("formulario").style.display = "none";
  document.getElementById("btnAnadirMiembro").style.display = "block";
}

// === Cancelar formulario ===
function cancelarRegistro() {
  limpiarFormulario();
}

// === Buscar cliente ===
function buscarCliente() {
  const filtro = document.getElementById("busquedaInput").value.toLowerCase();
  const resultado = document.getElementById("resultadoBusqueda");
  resultado.innerHTML = "";

  const transaccion = db.transaction(["clientes"], "readonly");
  const store = transaccion.objectStore("clientes");

  store.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const c = cursor.value;
      const nombreCompleto = `${c.nombre} ${c.apellido}`.toLowerCase();
      const telefono = (c.telefono + "").toLowerCase();

      if (nombreCompleto.includes(filtro) || telefono.includes(filtro)) {
        const card = document.createElement("div");
        card.style.cssText = "border:1px solid #444; border-radius:10px; padding:1rem; margin-bottom:1rem; background:#1a1a1a; color:#fff;";
        
        const contenido = document.createElement("div");
        contenido.innerHTML = `
          <strong>${c.nombre} ${c.apellido}</strong><br>
          Tel: ${c.telefono}<br>
          Fecha: ${c.fecha}<br>
          Peso: ${c.pesoKg || "N/A"} kg / ${c.pesoLb || "N/A"} lb<br>
          Comentario: ${c.comentario || "N/A"}<br><br>
        `;

        card.appendChild(contenido);

        if (c.foto) {
          const img = document.createElement("img");
          img.style.maxWidth = "100%";
          img.style.borderRadius = "8px";
          img.src = URL.createObjectURL(c.foto);
          card.appendChild(img);
        }

        resultado.appendChild(card);
      }
      cursor.continue();
    }
  };
}

// === Interacciones de botones ===
document.addEventListener("DOMContentLoaded", () => {
  const btnBuscar = document.getElementById("btnBusquedaCliente");
  const btnAnadir = document.getElementById("btnAnadirMiembro");
  const busquedaInput = document.getElementById("busquedaInput");
  const cancelarBusqueda = document.getElementById("cancelarBusqueda");

  btnBuscar.addEventListener("click", () => {
    document.getElementById("formulario").style.display = "none";
    btnAnadir.style.display = "none";
    busquedaInput.style.display = "block";
    cancelarBusqueda.style.display = "block";
    busquedaInput.focus();
  });

  cancelarBusqueda.addEventListener("click", () => {
    busquedaInput.value = "";
    busquedaInput.style.display = "none";
    cancelarBusqueda.style.display = "none";
    btnAnadir.style.display = "block";
    document.getElementById("resultadoBusqueda").innerHTML = "";
  });

  btnAnadir.addEventListener("click", () => {
    document.getElementById("formulario").style.display = "block";
    btnAnadir.style.display = "none";
    const hoy = new Date();
    const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    document.querySelector('[name="fecha"]').value = fecha;
  });

  busquedaInput.addEventListener("input", buscarCliente);
});
