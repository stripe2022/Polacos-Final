// IndexedDB variables
let db;
const nombreDB = "PolacosGymDB";
const versionDB = 1;

// Verificación inicial para evitar errores por stores faltantes
const verificacion = indexedDB.open(nombreDB, versionDB);
verificacion.onsuccess = function (e) {
  const tempDB = e.target.result;
  if (!tempDB.objectStoreNames.contains("clientes")) {
    tempDB.close();
    indexedDB.deleteDatabase(nombreDB).onsuccess = () => {
      console.warn("Base de datos reiniciada. Recarga la página.");
      location.reload();
    };
  } else {
    tempDB.close();
    abrirBaseDeDatos(); // Todo correcto, abrir base normalmente
  }
};

verificacion.onupgradeneeded = function (event) {
  const db = event.target.result;
  if (!db.objectStoreNames.contains("clientes")) {
    db.createObjectStore("clientes", { keyPath: "id", autoIncrement: true });
  }
};

function abrirBaseDeDatos() {
  const request = indexedDB.open(nombreDB, versionDB);

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains("clientes")) {
      db.createObjectStore("clientes", {
        keyPath: "id",
        autoIncrement: true,
      });
    }
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    document.getElementById("busquedaInput").addEventListener("input", buscarCliente);
    document.querySelector(".save-btn").disabled = false;
  };

  request.onerror = function (event) {
    console.error("Error al abrir IndexedDB", event);
  };
}
function toggleBusqueda() {
  const inputBusqueda = document.getElementById("busquedaInput");
  const formulario = document.getElementById("formulario");

  if (inputBusqueda.style.display === "none" || inputBusqueda.style.display === "") {
    inputBusqueda.style.display = "block";
    formulario.style.display = "none"; // Ocultar formulario
  } else {
    inputBusqueda.style.display = "none";
    inputBusqueda.value = ""; // Limpiar texto al ocultar
    document.getElementById("resultadoBusqueda").innerHTML = ""; // Limpiar resultados
  }
}
function toggleFormulario() {
  const form = document.getElementById("formulario");
  form.style.display = form.style.display === "none" || form.style.display === "" ? "block" : "none";
  if (form.style.display === "block") {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    const fechaLocal = `${anio}-${mes}-${dia}`;
    if (!document.getElementById("fecha").value) {
      document.getElementById("fecha").value = fechaLocal;
    }
    form.scrollIntoView({ behavior: "smooth" });
  }
}

function convertirKgLb() {
  const kg = parseFloat(document.getElementById("pesoKg").value);
  if (!isNaN(kg)) {
    document.getElementById("pesoLb").value = (kg * 2.20462).toFixed(2);
  }
}

function convertirLbKg() {
  const lb = parseFloat(document.getElementById("pesoLb").value);
  if (!isNaN(lb)) {
    document.getElementById("pesoKg").value = (lb / 2.20462).toFixed(2);
  }
}

function cancelarRegistro() {
  const form = document.getElementById("registroForm");
  form.reset(); // Limpia los campos del formulario

  // Oculta el formulario
  document.getElementById("formulario").style.display = "none";

  // Reiniciar input de foto correctamente
  const fotoInput = document.getElementById("foto");
  if (fotoInput) {
    fotoInput.type = "text"; // Cambiar tipo para forzar reinicio
    fotoInput.type = "file"; // Volver al tipo original
    fotoInput.value = "";
  }

  // Ocultar miniatura
  const vistaPrevia = document.getElementById("vistaPrevia");
  if (vistaPrevia) {
    vistaPrevia.src = "";
    vistaPrevia.style.display = "none";
  }
}

function guardarDatos() {
  if (!db) {
    mostrarMensaje("Base de datos no está lista. Intenta de nuevo.", true);
    return;
  }

  const nombreInput = document.getElementById("nombre");
  const apellidoInput = document.getElementById("apellido");
  const telefonoInput = document.getElementById("telefono");
  const fechaInput = document.getElementById("fecha");
  const pesoKgInput = document.getElementById("pesoKg");
  const pesoLbInput = document.getElementById("pesoLb");
  const comentarioInput = document.getElementById("comentario");
  const fotoInput = document.getElementById("foto");

  const nombre = nombreInput.value.trim();
  const apellido = apellidoInput.value.trim();
  const telefono = telefonoInput.value.trim();
  const fecha = fechaInput.value;
  const pesoKg = pesoKgInput.value.trim();
  const pesoLb = pesoLbInput.value.trim();
  const comentario = comentarioInput.value.trim();
  const archivoFoto = fotoInput.files[0];

  // Validación
  nombreInput.style.border = "";
  apellidoInput.style.border = "";
  telefonoInput.style.border = "";

  let valid = true;
  if (!nombre) {
    nombreInput.style.border = "2px solid red";
    valid = false;
  }
  if (!apellido) {
    apellidoInput.style.border = "2px solid red";
    valid = false;
  }
  if (!telefono || !/^\d{7,15}$/.test(telefono)) {
    telefonoInput.style.border = "2px solid red";
    valid = false;
  }
  if (!valid) {
    mostrarMensaje("Por favor completa correctamente los campos obligatorios.", true);
    return;
  }

  const guardarEnDB = (fotoBase64) => {
    const cliente = {
      nombre,
      apellido,
      telefono,
      fecha,
      pesoKg,
      pesoLb,
      comentario,
      foto: fotoBase64 || null
    };

    const transaction = db.transaction(["clientes"], "readwrite");
    const store = transaction.objectStore("clientes");
    store.add(cliente);

    transaction.oncomplete = function () {
  document.getElementById("registroForm").reset();
  document.getElementById("formulario").style.display = "none";

  // Reiniciar input de foto correctamente
  const fotoInput = document.getElementById("foto");
  fotoInput.type = "text"; // Cambiar tipo para reiniciar
  fotoInput.type = "file"; // Volver a tipo original
  fotoInput.value = "";

  // Ocultar miniatura
  const vistaPrevia = document.getElementById("vistaPrevia");
  vistaPrevia.src = "";
  vistaPrevia.style.display = "none";

  mostrarMensaje("Cliente guardado exitosamente.");
};
transaction.onerror = function () {
  mostrarMensaje("Error al guardar el cliente.", true);
};
transaction.onerror = function () {
  mostrarMensaje("Error al guardar el cliente.", true);
};
    transaction.onerror = function () {
      mostrarMensaje("Error al guardar el cliente.", true);
    };
  };

  if (archivoFoto) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const fotoBase64 = event.target.result;
      guardarEnDB(fotoBase64);
    };
    reader.readAsDataURL(archivoFoto);
  } else {
    guardarEnDB(null);
  }
}

function mostrarMensaje(texto, esError = false) {
  const mensaje = document.getElementById("mensajeExito");
  mensaje.textContent = texto;
  mensaje.style.backgroundColor = esError ? "#f44336" : "#4CAF50";
  mensaje.style.display = "block";
  setTimeout(() => {
    mensaje.style.display = "none";
  }, 3000);
}

function buscarCliente() {
  const busqueda = document.getElementById("busquedaInput").value.toLowerCase();
  const resultadoDiv = document.getElementById("resultadoBusqueda");
  resultadoDiv.innerHTML = "";

  const transaction = db.transaction(["clientes"], "readonly");
  const store = transaction.objectStore("clientes");

  store.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      const cliente = cursor.value;
      const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
      if (nombreCompleto.includes(busqueda)) {
        const div = document.createElement("div");
        div.innerHTML = `
          <p><strong>${cliente.nombre} ${cliente.apellido}</strong></p>
          <p>Tel: ${cliente.telefono} | Fecha: ${cliente.fecha}</p>
          <p>Peso: ${cliente.pesoKg} kg / ${cliente.pesoLb} lb</p>
          <p>${cliente.comentario}</p>
          ${cliente.foto ? `<img src="${cliente.foto}" style="max-width:100px;border-radius:8px;">` : ''}
          <hr>
        `;
        resultadoDiv.appendChild(div);
      }
      cursor.continue();
    }
  };
                       }
function verClientes() {
  const transaction = db.transaction(['clientes'], 'readonly');
  const store = transaction.objectStore('clientes');
  const request = store.getAll();

  request.onsuccess = () => {
    console.log("Clientes:", request.result);
  };
}
document.getElementById("foto").addEventListener("change", function () {
  const archivo = this.files[0];
  if (archivo) {
    const lector = new FileReader();
    lector.onload = function (e) {
      const img = document.getElementById("vistaPrevia");
      img.src = e.target.result;
      img.style.display = "block";

      // Asegurar que el formulario está visible antes del scroll
      const formulario = document.getElementById("formulario");
      if (formulario.style.display === "none") {
        formulario.style.display = "block";
      }

      // Esperar un momento antes de hacer scroll
      setTimeout(() => {
        const botones = document.querySelector(".form-buttons");
        if (botones) {
          botones.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200); // 200 ms de espera
    };
    lector.readAsDataURL(archivo);
  }
});
