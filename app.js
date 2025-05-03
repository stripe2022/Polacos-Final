// Mostrar/Ocultar secciones
function mostrarSeccion(id) {
  document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById("main-buttons").classList.add("hidden");
  document.getElementById(id).classList.remove("hidden");

  if (id === "deudores") {
    mostrarDeudores();
  }
}

function volverInicio() {
  document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById("main-buttons").classList.remove("hidden");
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

// Guardar nuevo miembro
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

// Mostrar clientes
function renderClientes(lista, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  contenedor.innerHTML = "";
  for (let c of lista) {
    const vencimiento = new Date(c.fecha);
    vencimiento.setDate(vencimiento.getDate() + 31);
    const vencStr = vencimiento.toISOString().split("T")[0];
    const vencido = new Date() > vencimiento;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${c.foto || 'https://via.placeholder.com/60'}" alt="Foto"/>
      <div class="info">
        <div><strong>${c.nombre} ${c.apellido}</strong></div>
        <div>Tel: ${c.telefono}</div>
        <div>Vence: <span class="${vencido ? 'status-red' : 'status-green'}">${vencStr}</span></div>
      </div>
      <div>
        <button onclick="pagar(${c.id})">Pagar</button>
        <button onclick="editar(${c.id})">Editar</button>
        <button onclick="eliminar(${c.id})">Borrar</button>
      </div>
    `;
    contenedor.appendChild(card);
  }
}

// Pagar: añade 31 días a fecha actual
async function pagar(id) {
  const cliente = await obtenerCliente(id);
  const nuevaFecha = new Date();
  cliente.fecha = nuevaFecha.toISOString().split("T")[0];
  await guardarCliente(cliente);
  alert("Pago registrado. Fecha actualizada.");
  buscarClientes();
  mostrarDeudores();
}

// Deudores
async function mostrarDeudores() {
  const lista = await obtenerTodos();
  const deudores = lista.filter(c => {
    const venc = new Date(c.fecha);
    venc.setDate(venc.getDate() + 31);
    return venc < new Date();
  });
  renderClientes(deudores, "lista-deudores");
}

// Editar (incompleto para la v1)
function editar(id) {
  alert("Función editar aún no implementada.");
}

// Eliminar
async function eliminar(id) {
  if (confirm("¿Eliminar este cliente?")) {
    await borrarCliente(id);
    buscarClientes();
    mostrarDeudores();
  }
      }
