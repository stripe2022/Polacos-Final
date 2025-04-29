let db;
const request = indexedDB.open("ClientesDB", 1);

request.onerror = (e) => console.error("Error al abrir IndexedDB:", e);
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

function toggleFormulario() {
  const form = document.getElementById('formulario');
  form.style.display = (form.style.display === 'none' || form.style.display === '') ? 'block' : 'none';
  if (form.style.display === 'block') {
    const hoy = new Date();
    const fechaLocal = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    document.getElementById('fecha').value = fechaLocal;
    form.scrollIntoView({ behavior: 'smooth' });
  }
}

function convertirKgLb() {
  const kg = parseFloat(document.getElementById('pesoKg').value);
  if (!isNaN(kg)) {
    document.getElementById('pesoLb').value = (kg * 2.20462).toFixed(2);
  }
}

function convertirLbKg() {
  const lb = parseFloat(document.getElementById('pesoLb').value);
  if (!isNaN(lb)) {
    document.getElementById('pesoKg').value = (lb / 2.20462).toFixed(2);
  }
}

function guardarCliente(data, fotoBlob) {
  const transaccion = db.transaction(["clientes"], "readwrite");
  const store = transaccion.objectStore("clientes");
  const cliente = { ...data, foto: fotoBlob || null };
  const request = store.add(cliente);
  request.onsuccess = () => console.log("Cliente guardado correctamente");
  request.onerror = (e) => console.error("Error al guardar cliente:", e);
}

function guardarDatos() {
  const form = document.getElementById('registroForm');
  const nombre = form.nombre.value.trim();
  const apellido = form.apellido.value.trim();
  const telefono = form.telefono.value.trim();

  if (!nombre || !apellido || !telefono) {
    alert("Por favor, completa nombre, apellido y teléfono.");
    return;
  }

  const data = {
    nombre,
    apellido,
    telefono,
    fecha: form.fecha.value,
    pesoKg: form.pesoKg.value,
    pesoLb: form.pesoLb.value,
    comentario: document.getElementById('comentario').value || ""
  };

  const fotoInput = document.getElementById('foto');
  const fotoFile = fotoInput.files[0];

  if (fotoFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const fotoBlob = new Blob([e.target.result], { type: fotoFile.type });
      guardarCliente(data, fotoBlob);
      limpiarFormulario();
    };
    reader.readAsArrayBuffer(fotoFile);
  } else {
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

function mostrarBusqueda() {
  document.getElementById('busquedaInput').style.display = 'block';
  document.getElementById('formulario').style.display = 'none';
  document.querySelector('button[onclick="toggleFormulario()"]').style.display = 'none';
  document.getElementById('cancelarBusquedaBtn').style.display = 'block';
}

function cancelarBusqueda() {
  document.getElementById('busquedaInput').value = "";
  document.getElementById('busquedaInput').style.display = 'none';
  document.getElementById('resultadoBusqueda').innerHTML = "";
  document.querySelector('button[onclick="toggleFormulario()"]').style.display = 'block';
  document.getElementById('cancelarBusquedaBtn').style.display = 'none';
      }
