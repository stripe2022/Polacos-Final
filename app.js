// Inicializar IndexedDB let db; const request = indexedDB.open("PolacosGymDB", 1);

request.onupgradeneeded = function (event) { db = event.target.result; const objectStore = db.createObjectStore("clientes", { keyPath: "id", autoIncrement: true }); objectStore.createIndex("nombre", "nombre", { unique: false }); objectStore.createIndex("apellido", "apellido", { unique: false }); };

request.onsuccess = function (event) { db = event.target.result; };

request.onerror = function (event) { console.error("Error al abrir IndexedDB:", event.target.errorCode); };

// Mostrar formulario con scroll y zoom document.getElementById("btnAnadirMiembro").addEventListener("click", () => { const formulario = document.getElementById("formulario"); formulario.style.display = "block"; document.getElementById("busquedaInput").style.display = "none"; document.getElementById("cancelarBusqueda").style.display = "none"; document.getElementById("resultadoBusqueda").innerHTML = "";

// Reiniciar animación de zoom formulario.classList.remove("zoom-in"); void formulario.offsetWidth; // Forzar reflow formulario.classList.add("zoom-in");

// Hacer scroll al formulario formulario.scrollIntoView({ behavior: "smooth", block: "start" }); });

// Mostrar campo de búsqueda document.getElementById("btnBusquedaCliente").addEventListener("click", () => { document.getElementById("formulario").style.display = "none"; document.getElementById("busquedaInput").style.display = "block"; document.getElementById("cancelarBusqueda").style.display = "block"; document.getElementById("busquedaInput").focus(); });

// Cancelar búsqueda document.getElementById("cancelarBusqueda").addEventListener("click", () => { document.getElementById("busquedaInput").value = ""; document.getElementById("busquedaInput").style.display = "none"; document.getElementById("cancelarBusqueda").style.display = "none"; document.getElementById("resultadoBusqueda").innerHTML = ""; });

// Buscar cliente document.getElementById("busquedaInput").addEventListener("input", () => { const query = document.getElementById("busquedaInput").value.toLowerCase(); const transaction = db.transaction(["clientes"], "readonly"); const objectStore = transaction.objectStore("clientes"); const request = objectStore.getAll();

request.onsuccess = function () { const resultados = request.result.filter(cliente => cliente.nombre.toLowerCase().includes(query) || cliente.apellido.toLowerCase().includes(query) );

mostrarResultadosBusqueda(resultados);

}; });

function mostrarResultadosBusqueda(resultados) { const contenedor = document.getElementById("resultadoBusqueda"); contenedor.innerHTML = "";

if (resultados.length === 0) { contenedor.innerHTML = "<p>No se encontraron resultados.</p>"; return; }

resultados.forEach(cliente => { const div = document.createElement("div"); div.textContent = ${cliente.nombre} ${cliente.apellido} - ${cliente.telefono}; contenedor.appendChild(div); }); }

// Guardar datos function guardarDatos() { const form = document.getElementById("registroForm"); const datos = { nombre: form.nombre.value.trim(), apellido: form.apellido.value.trim(), telefono: form.telefono.value.trim(), fecha: form.fecha.value, pesoKg: form.pesoKg.value, pesoLb: form.pesoLb.value, comentario: document.getElementById("comentario").value.trim(), };

const transaction = db.transaction(["clientes"], "readwrite"); const objectStore = transaction.objectStore("clientes"); const request = objectStore.add(datos);

request.onsuccess = function () { alert("Cliente añadido correctamente"); form.reset(); document.getElementById("formulario").style.display = "none"; };

request.onerror = function () { alert("Error al guardar datos"); }; }

// Cancelar formulario function cancelarRegistro() { document.getElementById("registroForm").reset(); document.getElementById("formulario").style.display = "none"; }

// Conversión de peso function convertirKgLb() { const kg = parseFloat(document.querySelector("input[name='pesoKg']").value); if (!isNaN(kg)) { document.querySelector("input[name='pesoLb']").value = (kg * 2.20462).toFixed(2); } }

function convertirLbKg() { const lb = parseFloat(document.querySelector("input[name='pesoLb']").value); if (!isNaN(lb)) { document.querySelector("input[name='pesoKg']").value = (lb / 2.20462).toFixed(2); } }
