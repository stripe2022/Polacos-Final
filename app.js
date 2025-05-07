// Mostrar/Ocultar secciones
function mostrarSeccion(id) {
  document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById("main-buttons").classList.add("hidden");
  document.getElementById(id).classList.remove("hidden");

  const form = document.getElementById("member-form");
  const titulo = document.querySelector("#add-member h2");

  // Si vamos a sección de añadir miembro
  if (id === "add-member") {
    if (form.dataset.editandoId) {
      titulo.textContent = "Editar Miembro";
    } else {
      titulo.textContent = "Añadir Miembro";
      form.reset();
      delete form.dataset.editandoId;
      document.getElementById("preview").innerHTML = "";
      document.getElementById("libras").textContent = "";
    }
  } else {
    // Al cambiar a otra sección, salir del modo edición si aplica
    delete form.dataset.editandoId;
  }

  limpiarBusqueda();

  if (id === "deudores") {
    mostrarDeudores();
  }
}

function volverInicio() {
  document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById("main-buttons").classList.remove("hidden");

  const form = document.getElementById("member-form");
  if (form) {
    form.reset();
    delete form.dataset.editandoId;
  }
  document.getElementById("preview").innerHTML = "";
  document.getElementById("libras").textContent = "";

  limpiarBusqueda();
}

function limpiarFormularios() {
  const form = document.getElementById("member-form");
  // Solo limpiamos si NO estamos editando
  if (form && !form.dataset.editandoId) {
    form.reset();
    document.getElementById("preview").innerHTML = "";
    document.getElementById("libras").textContent = "";
  }
}

// LIMPIAR BÚSQUEDA
function limpiarBusqueda() {
  const input = document.getElementById("search-input");
  if (input) input.value = "";
  const resultados = document.getElementById("resultados");
  if (resultados) resultados.innerHTML = "";
}

// Fecha por defecto
document.getElementById("fecha").valueAsDate = new Date();

// Peso en libras
document.getElementById("peso").addEventListener("input", function () {
  let kg = parseFloat(this.value);
  if (!isNaN(kg)) {
    let lb = (kg * 2.20462).toFixed(2);
    document.getElementById("libras").textContent = `${lb} lb`;
  } else {
    document.getElementById("libras").textContent = "";
  }
});

// Previsualización de imagen
document.getElementById("foto").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      document.getElementById("preview").innerHTML = `<img src="${ev.target.result}" alt="Foto" />`;
    };
    reader.readAsDataURL(file);
  }
});
// Botón personalizado para subir imagen
document.getElementById("btn-foto").addEventListener("click", function () {
  document.getElementById("foto").click();
});

/*// Guardar nuevo miembro
document.getElementById("member-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const cliente = {
    id: Date.now(),
    nombre: document.getElementById("nombre").value.trim(),
    apellido: document.getElementById("apellido").value.trim(),
    fecha: document.getElementById("fecha").value,
    telefono: document.getElementById("telefono").value.trim(),
    peso: parseFloat(document.getElementById("peso").value),
    comentarios: document.getElementById("comentarios").value.trim(),
    foto: document.getElementById("preview").querySelector("img")?.src || "",
  };
  await guardarCliente(cliente);
  alert("Miembro guardado");
  this.reset();
  document.getElementById("preview").innerHTML = "";
  volverInicio();
});*/
document.getElementById("member-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const idEditando = this.dataset.editandoId;
  const nuevo = !idEditando;

  const cliente = {
    id: nuevo ? Date.now() : parseInt(idEditando),
    nombre: document.getElementById("nombre").value.trim(),
    apellido: document.getElementById("apellido").value.trim(),
    fecha: document.getElementById("fecha").value,
    telefono: document.getElementById("telefono").value.trim(),
    peso: parseFloat(document.getElementById("peso").value),
    comentarios: document.getElementById("comentarios").value.trim(),
    foto: document.getElementById("preview").querySelector("img")?.src || "",
  };

  await guardarCliente(cliente);

  alert(nuevo ? "Miembro guardado" : "Cambios guardados");

  this.reset();
  delete this.dataset.editandoId; // limpia el modo edición
  document.getElementById("preview").innerHTML = "";
  volverInicio();
});

// Buscar clientes
async function buscarClientes() {
  const q = document.getElementById("search-input").value.toLowerCase();
  const lista = await obtenerTodos();
  const coincidencias = lista.filter(c =>
    c.nombre.toLowerCase().includes(q) ||
    c.apellido.toLowerCase().includes(q) ||
    c.telefono.includes(q)
  );
  renderClientes(coincidencias, "resultados");
}

/*// Mostrar clientes
function renderClientes(lista, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  contenedor.innerHTML = "";

  for (let c of lista) {
    const vencimiento = new Date(c.fecha);
    vencimiento.setDate(vencimiento.getDate() + 31);
    const vencStr = vencimiento.toLocaleDateString('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}).replace(/ de /g, " ");
    const vencido = new Date() > vencimiento;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-left">
        <img src="${c.foto || 'https://via.placeholder.com/140'}" alt="Foto del cliente" onclick="abrirModal('${c.foto || 'https://via.placeholder.com/140'}')" />
        <div class="info">
          <div><strong>${c.nombre} ${c.apellido}</strong></div>
          <div>Tel: ${c.telefono}</div>
          <div>Vence: <span class="${vencido ? 'status-red' : 'status-green'}">${vencStr}</span></div>
        </div>
      </div>
      <div class="card-buttons">
        <button class="guardar" onclick="pagar(${c.id})">Pagar</button>
        <button class="editar" onclick="editar(${c.id})">Editar</button>
        <button class="cancelar" onclick="eliminar(${c.id})">Borrar</button>
      </div>
    `;

    contenedor.appendChild(card);
  }
}*/
function renderClientes(lista, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  contenedor.innerHTML = "";

  for (let c of lista) {
    const fechaRegistro = new Date(c.fecha);
    const hoy = new Date();

    const vencimiento = new Date(fechaRegistro);
    vencimiento.setDate(vencimiento.getDate() + 31);

    const vencStr = vencimiento.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).replace(/ de /g, " ");

    const vencido = hoy > vencimiento;
    c.inactivo = (hoy - fechaRegistro) > (61 * 24 * 60 * 60 * 1000);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-left">
        <img src="${c.foto || 'https://via.placeholder.com/140'}" alt="Foto del cliente" onclick="abrirModal('${c.foto || 'https://via.placeholder.com/140'}')" />
        <div class="info">
          <div><strong>${c.nombre} ${c.apellido}</strong></div>
          <div>Tel: ${c.telefono}</div>
          <div>Vence: <span class="${vencido ? 'status-red' : 'status-green'}">${vencStr}</span></div>
          ${c.inactivo ? `<div><span class="status-red"><strong>Inactivo</strong></span></div>` : ""}
        </div>
      </div>
      <div class="card-buttons">
        <button class="guardar" onclick="pagar(${c.id})">Pagar</button>
        <button class="editar" onclick="editar(${c.id})">Editar</button>
        <button class="cancelar" onclick="eliminar(${c.id})">Borrar</button>
      </div>
    `;

    contenedor.appendChild(card);
  }
}
//Modal
function abrirModal(src) {
  document.getElementById("modal-img").src = src;
  document.getElementById("img-modal").classList.remove("hidden");
}

function cerrarModal() {
  document.getElementById("img-modal").classList.add("hidden");
}

// Pagar: añade 31 días a fecha actual
/*async function pagar(id) {
  const cliente = await obtenerCliente(id);
  const nuevaFecha = new Date();
  cliente.fecha = nuevaFecha.toISOString().split("T")[0];
  await guardarCliente(cliente);
  alert("Pago registrado. Fecha actualizada.");
  buscarClientes();
  mostrarDeudores();
}*/
async function pagar(id) {
  const confirmar = confirm("¿Seguro que deseas añadir 1 mes de membresía?");
  if (!confirmar) return;

  const cliente = await obtenerCliente(id);

  // Tomar la fecha original y sumarle 31 días
  const fechaOriginal = new Date(cliente.fecha);
  fechaOriginal.setDate(fechaOriginal.getDate() + 31);
  cliente.fecha = fechaOriginal.toISOString().split("T")[0];

  await guardarCliente(cliente);
  alert("Membresía Renovada");
  buscarClientes();
  mostrarDeudores();
}

// Deudores
async function mostrarDeudores() {
  const lista = await obtenerTodos();
  /*const deudores = lista.filter(c => {
    const venc = new Date(c.fecha);
    venc.setDate(venc.getDate() + 31);
    return venc < new Date();
  });*/
  const deudores = lista.filter(c => {
  const fechaRegistro = new Date(c.fecha);
  const hoy = new Date();

  const venc = new Date(fechaRegistro);
  venc.setDate(venc.getDate() + 31);

  const inactivo = (hoy - fechaRegistro) > (61 * 24 * 60 * 60 * 1000);

  return venc < hoy && !inactivo;
});
  renderClientes(deudores, "lista-deudores");
}

// Editar 
async function editar(id) {
  const cliente = await obtenerCliente(id);

  document.getElementById("nombre").value = cliente.nombre;
  document.getElementById("apellido").value = cliente.apellido;
  document.getElementById("fecha").value = cliente.fecha;
  document.getElementById("telefono").value = cliente.telefono;
  document.getElementById("peso").value = cliente.peso || "";
  document.getElementById("comentarios").value = cliente.comentarios || "";

  if (cliente.foto) {
    document.getElementById("preview").innerHTML = `<img src="${cliente.foto}" alt="Foto" />`;
  } else {
    document.getElementById("preview").innerHTML = "";
  }

  // Guardamos el ID actual para editar
  document.getElementById("member-form").dataset.editandoId = id;

  mostrarSeccion("add-member");
}
// Mostrar secciones antropométricas dinámicamente
document.getElementById("sexo").addEventListener("change", function () {
  const sexo = this.value;
  document.getElementById("antropometria-femenino").classList.toggle("hidden", sexo !== "Femenino");
  document.getElementById("antropometria-masculino").classList.toggle("hidden", sexo !== "Masculino");
});

// Cálculo automático de IMC
function calcularIMC() {
  const peso = parseFloat(document.getElementById("peso").value);
  const talla = parseFloat(document.getElementById("talla").value) / 100;
  const imcSpan = document.getElementById("imc-valor");
  if (!isNaN(peso) && !isNaN(talla) && talla > 0) {
    const imc = (peso / (talla * talla)).toFixed(2);
    imcSpan.textContent = imc;
  } else {
    imcSpan.textContent = "--";
  }
}
document.getElementById("peso").addEventListener("input", calcularIMC);
document.getElementById("talla").addEventListener("input", calcularIMC);

// Eliminar
async function eliminar(id) {
  if (confirm("¿Eliminar este cliente?")) {
    await borrarCliente(id);
    buscarClientes();
    mostrarDeudores();
  }
  
    }
