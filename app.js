// === Inicializar IndexedDB ===
let db;
const request = indexedDB.open("ClientesDB", 1);

request.onerror = (e) => {
  console.error("Error al abrir IndexedDB:", e);
};

request.onsuccess = (e) => {
  db = e.target.result;
  console.log("Base de datos abierta correctamente");
};

request.onupgradeneeded = (e) => {
  db = e.target.result;
  const store = db.createObjectStore("clientes", {
    keyPath: "id",
    autoIncrement: true
  });
  store.createIndex("nombre", "nombre", { unique: false });
  store.createIndex("telefono", "telefono", { unique: false });
};

// === Guardar Cliente ===
function guardarCliente(data, fotoBlob) {
  const transaccion = db.transaction(["clientes"], "readwrite");
  const store = transaccion.objectStore("clientes");

  const cliente = {
    nombre: data.nombre,
    apellido: data.apellido,
    telefono: data.telefono,
    fecha: data.fecha,
    pesoKg: data.pesoKg,
    pesoLb: data.pesoLb,
    comentario: data.comentario || "",
    foto: fotoBlob || null
  };

  const request = store.add(cliente);

  request.onsuccess = () => {
    console.log("Cliente guardado correctamente");
  };

  request.onerror = (e) => {
    console.error("Error al guardar cliente:", e);
  };
}

// === Guardar Datos del Formulario ===
function guardarDatos() {
  const form = document.getElementById('registroForm');
  const nombre = form.nombre.value.trim();
  const apellido = form.apellido.value.trim();
  const telefono = form.telefono.value.trim();

  if (!nombre || !apellido || !telefono) {
    alert("Por favor, completa nombre, apellido y teléfono.");
    return;
  }

  const comentario = document.getElementById('comentario')?.value || "";
  const fecha = form.fecha.value;
  const pesoKg = form.pesoKg.value;
  const pesoLb = form.pesoLb.value;
  const fotoInput = document.getElementById('foto');
  const fotoFile = fotoInput.files[0];

  if (fotoFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const fotoBlob = new Blob([e.target.result], { type: fotoFile.type });

      const data = { nombre, apellido, telefono, fecha, pesoKg, pesoLb, comentario };
      guardarCliente(data, fotoBlob);

      limpiarFormulario();
    };
    reader.readAsArrayBuffer(fotoFile);
  } else {
    const data = { nombre, apellido, telefono, fecha, pesoKg, pesoLb, comentario };
    guardarCliente(data, null);

    limpiarFormulario();
  }
}

function limpiarFormulario() {
  const form = document.getElementById('registroForm');
  form.reset();
  document.getElementById('comentario').value = "";
  document.getElementById('formulario').style.display = 'none';
}

// === Buscar Cliente por nombre o teléfono ===
function buscarCliente() {
  const filtro = document.getElementById('busquedaInput').value.toLowerCase();
  const resultadoContainer = document.getElementById('resultadoBusqueda');
  resultadoContainer.innerHTML = "";

  const transaccion = db.transaction(["clientes"], "readonly");
  const store = transaccion.objectStore("clientes");

  store.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      const cliente = cursor.value;
      const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
      const telefono = cliente.telefono.toLowerCase();

      if (nombreCompleto.includes(filtro) || telefono.includes(filtro)) {
        const card = document.createElement("div");
        card.style.border = "1px solid #444";
        card.style.borderRadius = "10px";
        card.style.padding = "1rem";
        card.style.marginBottom = "1rem";
        card.style.backgroundColor = "#1a1a1a";
        card.style.color = "#fff";
        card.innerHTML = `
          <strong>${cliente.nombre} ${cliente.apellido}</strong><br>
          Tel: ${cliente.telefono}<br>
          Fecha: ${cliente.fecha}<br>
          Peso: ${cliente.pesoKg} kg / ${cliente.pesoLb} lb<br>
          Comentario: ${cliente.comentario || "N/A"}<br><br>
        `;

        if (cliente.foto) {
          const img = document.createElement("img");
          img.style.maxWidth = "100%";
          img.style.borderRadius = "8px";
          img.src = URL.createObjectURL(cliente.foto);
          card.appendChild(img);
        }

        resultadoContainer.appendChild(card);
      }
      cursor.continue();
    }
  };
}
