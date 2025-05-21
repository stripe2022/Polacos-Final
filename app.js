let guardarCliente, obtenerCliente, obtenerTodos, borrarCliente, sincronizarConSupabase;

async function cargarModulos() {
  try {
    const mod = await import('./db.js');
    guardarCliente = mod.guardarCliente;
    obtenerCliente = mod.obtenerCliente;
    obtenerTodos = mod.obtenerTodos;
    borrarCliente = mod.borrarCliente;
    sincronizarConSupabase = mod.sincronizarConSupabase;
    console.log("Módulos cargados correctamente");
  } catch (error) {
    console.error("Error al cargar módulos nb.js:", error);
    alert("No se pudo cargar nb.js. Verifica que el archivo existe y esté correctamente exportado.");
  }
}

window.addEventListener("DOMContentLoaded", cargarModulos);

// Mostrar/Ocultar secciones
function mostrarSeccion(id) {
  document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById("main-buttons").classList.add("hidden");
  document.getElementById(id).classList.remove("hidden");

  const form = document.getElementById("member-form");
  const titulo = document.querySelector("#add-member h2");

  if (id === "add-member") {
    if (form.dataset.editandoId) {
      titulo.textContent = "Editar Miembro";
    } else {
      titulo.textContent = "Añadir Miembro";
      form.reset();
      delete form.dataset.editandoId;
      document.getElementById("preview").innerHTML = "";
      document.getElementById("libras").textContent = "";
      document.getElementById("sexo").dispatchEvent(new Event("change")); // Importante
    }
  } else {
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

    // ✅ Desbloquear fecha si quedó en modo solo lectura desde edición
    document.getElementById("fecha").removeAttribute("readonly");
    document.getElementById("sexo").dispatchEvent(new Event("change"));
    
  }

  
  document.getElementById("preview").innerHTML = "";
  document.getElementById("libras").textContent = "";
  document.getElementById("imc-valor").textContent = "--";


  limpiarBusqueda();
}

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
  const kg = parseFloat(this.value);
  const lb = !isNaN(kg) ? (kg * 2.20462).toFixed(2) : "";
  document.getElementById("libras").textContent = lb ? `${lb} lb` : "";
});

// IMC automático
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

// Mostrar secciones antropométricas dinámicamente
document.getElementById("sexo").addEventListener("change", function () {
  const sexo = this.value;
  document.getElementById("antropometria-femenino").classList.toggle("hidden", sexo !== "Femenino");
  document.getElementById("antropometria-masculino").classList.toggle("hidden", sexo !== "Masculino");
});

// Previsualización de imagen
document.getElementById("foto").addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  const reader = new FileReader();

  reader.onload = function (ev) {
    img.src = ev.target.result;
  };

  img.onload = function () {
    const MAX_DIMENSION = 600;

    let width = img.width;
    let height = img.height;

    if (width > height && width > MAX_DIMENSION) {
      height *= MAX_DIMENSION / width;
      width = MAX_DIMENSION;
    } else if (height > MAX_DIMENSION) {
      width *= MAX_DIMENSION / height;
      height = MAX_DIMENSION;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    const optimizedBase64 = canvas.toDataURL("image/jpeg", 0.9); // 90% calidad

    document.getElementById("preview").innerHTML = `<img src="${optimizedBase64}" alt="Foto redimensionada" />`;
  };

  reader.readAsDataURL(file);
});


document.getElementById("btn-foto").addEventListener("click", () => {
  document.getElementById("foto").click();
});

// Asegúrate de tener esta función antes del submit
function getFechaLocalISO(fecha = new Date()) {
  return fecha.toLocaleDateString('en-CA'); // Devuelve "YYYY-MM-DD" sin UTC
}



// GUARDAR CLIENTE
document.getElementById("member-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const idEditando = this.dataset.editandoId;
  const nuevo = !idEditando;

  // Validación básica obligatoria
  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const edad = parseInt(document.getElementById("edad").value);
  if (!nombre || !apellido || isNaN(edad)) {
    alert("Por favor completa nombre, apellido y edad válidos.");
    return;
  }

  // Calcular fecha de vencimiento
  /*const fechaVencimiento = nuevo
    ? getFechaLocalISO(sumarMesesConDiaFijo(new Date(), 1))
    : getFechaLocalISO(new Date(document.getElementById("fecha").value));*/
  //const fechaSeleccionada = new Date(document.getElementById("fecha").value);
  const fechaSeleccionada = (() => {
  const [año, mes, dia] = document.getElementById("fecha").value.split("-").map(Number);
  return new Date(año, mes - 1, dia); // ← usa fecha local directamente
})();

  const fechaVencimiento = getFechaLocalISO(sumarMesesConDiaFijo(fechaSeleccionada, 1));

  // Reflejar la fecha visualmente si es nuevo
  if (nuevo) {
    document.getElementById("fecha").value = fechaVencimiento;
  }

  const cliente = {
    id: nuevo ? Date.now() : parseInt(idEditando),
    nombre,
    apellido,
    fecha: fechaVencimiento,
    ultimoPago: getFechaLocalISO(),
    //registro: getFechaLocalISO(), // <- ✅ fecha de registro original
    registro: getFechaLocalISO(fechaSeleccionada),

    telefono: document.getElementById("telefono").value.trim(),
    peso: parseFloat(document.getElementById("peso").value) || 0,
    talla: parseFloat(document.getElementById("talla").value) || 0,
    grasa: parseFloat(document.getElementById("grasa").value) || 0,
    imc: document.getElementById("imc-valor").textContent,
    comentarios: document.getElementById("comentarios").value.trim(),
    observaciones: document.getElementById("observaciones").value.trim(),
    ci: document.getElementById("ci").value.trim(),
    edad,
    sexo: document.getElementById("sexo").value,
    tipoAtencion: document.getElementById("tipo-atencion").value,
    foto: document.getElementById("preview").querySelector("img")?.src || "",
    antropometria: {}
  };

  // ANTROPOMETRÍA DINÁMICA
  if (cliente.sexo === "Femenino") {
    cliente.antropometria = {
      biceps: parseFloat(document.getElementById("biceps-f").value) || 0,
      abdominal: parseFloat(document.getElementById("abdominal-f").value) || 0,
      gluteo: parseFloat(document.getElementById("gluteo").value) || 0,
      muslos: parseFloat(document.getElementById("muslos-f").value) || 0,
    };
  } else if (cliente.sexo === "Masculino") {
    cliente.antropometria = {
      toraxInterno: parseFloat(document.getElementById("torax-interno").value) || 0,
      toraxExterno: parseFloat(document.getElementById("torax-externo").value) || 0,
      gastronemio: parseFloat(document.getElementById("gastronemio").value) || 0,
      biceps: parseFloat(document.getElementById("biceps-m").value) || 0,
      abdominal: parseFloat(document.getElementById("abdominal-m").value) || 0,
      muslos: parseFloat(document.getElementById("muslos-m").value) || 0,
    };
  }

  console.log("Cliente a guardar:", cliente); // Debug opcional

  await guardarCliente(cliente);

  alert(nuevo ? "Miembro guardado" : "Cambios guardados");

  this.reset();
  document.getElementById("fecha").readOnly = false;
  delete this.dataset.editandoId;
  document.getElementById("preview").innerHTML = "";
  document.getElementById("libras").textContent = "";
  document.getElementById("sexo").dispatchEvent(new Event("change"));
  volverInicio();
});


function sumarMesesConDiaFijo(fecha, cantidadMeses) {
  let dia = fecha.getDate();

  // Reglas de negocio:
  if (dia === 31) dia = 30; // Nunca usamos 31

  const nuevaFecha = new Date(fecha);
  nuevaFecha.setDate(1); // Evita errores al sumar mes
  nuevaFecha.setMonth(nuevaFecha.getMonth() + cantidadMeses);

  const ultimoDiaMes = new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth() + 1, 0).getDate();
  nuevaFecha.setDate(Math.min(dia, ultimoDiaMes));

  return nuevaFecha;
}

// 🧠 ESTADO INACTIVO
function parseFechaLocal(iso) {
  const [año, mes, dia] = iso.split("-").map(Number);
  return new Date(año, mes - 1, dia); // ← evita UTC
}

function estaInactivo(cliente) {
  const venc = parseFechaLocal(cliente.fecha);
  venc.setDate(venc.getDate() + 10); // margen de gracia de 10 días

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return hoy > venc;
}


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

function parseFechaLocal(isoString) {
  const [año, mes, dia] = isoString.split("-").map(Number);
  return new Date(año, mes - 1, dia); // <- evita desfase por UTC
}

// 🧾 RENDER CLIENTES
function renderClientes(lista, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  contenedor.innerHTML = "";

  const hoy = new Date();

  for (let c of lista) {
    
    const vencimiento = parseFechaLocal(c.fecha);
    vencimiento.setHours(0, 0, 0, 0); // <- 🔥 aquí está la clave
    const vencido = hoy > vencimiento;
    c.inactivo = estaInactivo(c);

    const vencStr = vencimiento.toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).replace(/ de /g, " ");

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-left">
        <img src="${c.foto || '/Polacos-Final/icons/pic.png'}" alt="Foto del cliente" onclick="abrirModal('${c.foto || 'https://via.placeholder.com/140'}')" />
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



// MODAL FOTO  <button class="guardar" onclick="pagar(${c.id})">Pagar</button>
function abrirModal(src) {
  document.getElementById("modal-img").src = src;
  document.getElementById("img-modal").classList.remove("hidden");
}
function cerrarModal() {
  document.getElementById("img-modal").classList.add("hidden");
}



async function pagar(id, cantidadMeses = 1) {
  if (!confirm(`¿Seguro que deseas añadir ${cantidadMeses} mes(es) de membresía?`)) return;

  try {
    const cliente = await obtenerCliente(id);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const vencimientoActual = parseFechaLocal(cliente.fecha);
    vencimientoActual.setHours(0, 0, 0, 0);

    // 🔍 Definimos la base desde la cual sumaremos
    let nuevaBase;
    if (hoy <= vencimientoActual) {
      // Cliente al día o adelantado
      nuevaBase = vencimientoActual;
    } else {
      // Cliente vencido
      nuevaBase = hoy;
    }

    // ✅ Aplicamos lógica personalizada de renovación
    const nuevaFecha = sumarMesesConDiaFijo(nuevaBase, cantidadMeses);

    // ✅ Actualizamos cliente
    cliente.fecha = getFechaLocalISO(nuevaFecha);         // Fecha de vencimiento nueva
    cliente.ultimoPago = getFechaLocalISO(hoy);           // Fecha de pago
    if (hoy > vencimientoActual) {
      cliente.registro = getFechaLocalISO(hoy);           // Nueva activación si estaba vencido
    }

    await guardarCliente(cliente);
    alert("Membresía renovada con éxito");
    buscarClientes();
    mostrarDeudores();
  } catch (error) {
    console.error("Error al renovar la membresía:", error);
    alert("Ocurrió un error al renovar la membresía.");
  }
}






async function mostrarDeudores() {
  const lista = await obtenerTodos();
  const hoy = getFechaLocalISO(); // Devuelve "YYYY-MM-DD"

  const deudores = lista.filter(c => c.fecha < hoy && !estaInactivo(c));
  renderClientes(deudores, "lista-deudores");
}

// BUSCAR
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

// EDITAR
async function editar(id) {
  const c = await obtenerCliente(id);
  const form = document.getElementById("member-form"); // 👈 añade esta línea primero
  form.reset(); // 💥 Limpia vínculos previos
  
  const inputFecha = document.getElementById("fecha");
  if (inputFecha) {
  inputFecha.value = c.registro || c.fecha;
  inputFecha.readOnly = true;
}


  

document.getElementById("preview").innerHTML = "";
document.getElementById("libras").textContent = "";


  document.getElementById("nombre").value = c.nombre;
  document.getElementById("apellido").value = c.apellido;
  document.getElementById("fecha").readOnly = true;
  document.getElementById("telefono").value = c.telefono;
  document.getElementById("peso").value = c.peso || "";
  document.getElementById("talla").value = c.talla || "";
  document.getElementById("grasa").value = c.grasa || "";
  document.getElementById("imc-valor").textContent = c.imc || "--";
  document.getElementById("comentarios").value = c.comentarios || "";
  document.getElementById("observaciones").value = c.observaciones || "";
  document.getElementById("ci").value = c.ci || "";
  document.getElementById("edad").value = c.edad || "";
  document.getElementById("sexo").value = c.sexo || "";
  document.getElementById("tipo-atencion").value = c.tipoAtencion || "";
  document.getElementById("sexo").dispatchEvent(new Event("change"));

  if (c.sexo === "Femenino" && c.antropometria) {
    document.getElementById("biceps-f").value = c.antropometria.biceps || "";
    document.getElementById("abdominal-f").value = c.antropometria.abdominal || "";
    document.getElementById("gluteo").value = c.antropometria.gluteo || "";
    document.getElementById("muslos-f").value = c.antropometria.muslos || "";
  } else if (c.sexo === "Masculino" && c.antropometria) {
    document.getElementById("torax-interno").value = c.antropometria.toraxInterno || "";
    document.getElementById("torax-externo").value = c.antropometria.toraxExterno || "";
    document.getElementById("gastronemio").value = c.antropometria.gastronemio || "";
    document.getElementById("biceps-m").value = c.antropometria.biceps || "";
    document.getElementById("abdominal-m").value = c.antropometria.abdominal || "";
    document.getElementById("muslos-m").value = c.antropometria.muslos || "";
  }

  if (c.foto) {
    document.getElementById("preview").innerHTML = `<img src="${c.foto}" alt="Foto" />`;
  } else {
    document.getElementById("preview").innerHTML = "";
  }

  document.getElementById("member-form").dataset.editandoId = id;
  mostrarSeccion("add-member");
}

// ELIMINAR
async function eliminar(id) {
  if (confirm("¿Eliminar este cliente?")) {
    await borrarCliente(id);
    buscarClientes();
    mostrarDeudores();
  }
                 }
document.getElementById("mes-reporte").addEventListener("change", generarReporteMensual);

// Copia de Seguridad
function toggleBackupMenu() {
  const menu = document.getElementById("backup-menu");
  menu.classList.toggle("hidden");
}

async function exportarBackup() {
  const clientes = await obtenerTodos();
  const blob = new Blob([JSON.stringify(clientes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clientes_backup_${getFechaLocalISO()}.json`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
  alert("✅ Backup exportado.");
}

document.getElementById("input-backup").addEventListener("change", async function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) return alert("❌ Archivo no válido.");
      if (!confirm(`¿Importar ${data.length} clientes y borrar los existentes?`)) return;

      await borrarTodosLosClientes();
      for (const cliente of data) {
        await guardarCliente(cliente);
      }
      alert("✅ Backup importado.");
      buscarClientes();
    } catch (err) {
      alert("❌ Error al importar.");
      console.error(err);
    }
  };

  reader.readAsText(file);
  document.getElementById("input-backup").value = null;

});
async function borrarTodosLosClientes() {
  const todos = await obtenerTodos();
  for (const c of todos) {
    await borrarCliente(c.id);
  }
}


document.getElementById("mes-reporte").addEventListener("change", generarReporteMensual);

async function generarReporteMensual() {
  const mesSeleccionado = document.getElementById("mes-reporte").value;
  if (!mesSeleccionado) return;

  const [anio, mes] = mesSeleccionado.split("-");
  const clientes = await obtenerTodos();
  const hoy = new Date();

  // RANGO MES
  const desde = new Date(anio, mes - 1, 1);
  const hasta = new Date(anio, mes, 0);

  let total = clientes.length;
  let activos = 0, deudores = 0, inactivos = 0;
  let nuevos = 0, renovados = 0;
  let sexo = { Masculino: 0, Femenino: 0 };
  let edad = { "<18": 0, "18-30": 0, "31-45": 0, "46-60": 0, "60+": 0 };

  for (let c of clientes) {
    const fecha = new Date(c.fecha);
    const ultimoPago = new Date(c.ultimoPago || 0);
    const creado = new Date(c.createdAt || c.ultimoPago); // fallback si no hay createdAt
    const venc = new Date(c.fecha);
    venc.setDate(venc.getDate() + 31);

    // Estado actual
    const hoyISO = getFechaLocalISO();
if (c.fecha > hoyISO) {
  activos++;
} else if (!estaInactivo(c)) {
  deudores++;
} else {
  inactivos++;
}


    // Nuevos registros este mes
    if (creado >= desde && creado <= hasta) nuevos++;

    // Renovaciones este mes
    if (ultimoPago >= desde && ultimoPago <= hasta) renovados++;

    // Sexo
    if (sexo[c.sexo] !== undefined) sexo[c.sexo]++;

    // Edad
    const e = parseInt(c.edad);
    if (e < 18) edad["<18"]++;
    else if (e <= 30) edad["18-30"]++;
    else if (e <= 45) edad["31-45"]++;
    else if (e <= 60) edad["46-60"]++;
    else edad["60+"]++;
  }

  // Retención = renovados / (activos + renovados previos)
  const retencion = total > 0 ? Math.round((renovados / (renovados + nuevos || 1)) * 100) : 0;




  // Render
  document.getElementById("total-clientes").textContent = total;
  document.getElementById("activos").textContent = activos;
  document.getElementById("deudores-count").textContent = deudores;
  document.getElementById("inactivos").textContent = inactivos;
  document.getElementById("nuevos").textContent = nuevos;
  document.getElementById("renovados").textContent = renovados;
  document.getElementById("retencion").textContent = retencion + "%";
  document.getElementById("sexo-m").textContent = sexo.Masculino;
  document.getElementById("sexo-f").textContent = sexo.Femenino;
  document.getElementById("edad-1").textContent = edad["<18"];
  document.getElementById("edad-2").textContent = edad["18-30"];
  document.getElementById("edad-3").textContent = edad["31-45"];
  document.getElementById("edad-4").textContent = edad["46-60"];
  document.getElementById("edad-5").textContent = edad["60+"];
}
