// Variables principales
const buscarInput = document.getElementById('buscar');
const registerForm = document.getElementById('registerForm');
const clientesDiv = document.getElementById('clientes');
const nombreInput = document.getElementById('nombre');
const apellidoInput = document.getElementById('apellido');
const fechaInput = document.getElementById('fechaInscripcion');
const telefonoInput = document.getElementById('telefono');
const pesoInput = document.getElementById('peso');
const pesoLbInput = document.getElementById('pesoLb');
const fotoInput = document.getElementById('foto');
const btnRegistrar = document.getElementById('btnRegistrar');

// Conversión automática de peso
pesoInput.addEventListener('input', () => {
  const pesoKg = parseFloat(pesoInput.value);
  if (!isNaN(pesoKg)) {
    pesoLbInput.value = (pesoKg * 2.20462).toFixed(2);
  } else {
    pesoLbInput.value = '';
  }
});

// Mostrar/ocultar formulario de registro
btnRegistrar.addEventListener('click', () => {
  if (registerForm.style.display === 'none' || registerForm.style.display === '') {
    registerForm.style.display = 'block';
  } else {
    registerForm.style.display = 'none';
  }
});

// IndexedDB configuración
let db;
const request = indexedDB.open('PolacosGymDB', 1);

request.onerror = (event) => {
  console.error('Database error:', event.target.errorCode);
};

request.onupgradeneeded = (event) => {
  db = event.target.result;
  db.createObjectStore('clientes', { keyPath: 'id', autoIncrement: true });
};

request.onsuccess = (event) => {
  db = event.target.result;
  mostrarClientes();
};

// Función para registrar cliente
registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const nombre = nombreInput.value.trim();
  const apellido = apellidoInput.value.trim();
  const fechaInscripcion = fechaInput.value;
  const telefono = telefonoInput.value.trim();
  const peso = parseFloat(pesoInput.value);
  const fechaVencimiento = calcularVencimiento(fechaInscripcion);

  const file = fotoInput.files[0];
  
  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      const fotoData = evt.target.result;
      guardarCliente({ nombre, apellido, fechaInscripcion, telefono, peso, fechaVencimiento, foto: fotoData });
    };
    reader.readAsDataURL(file);
  } else {
    guardarCliente({ nombre, apellido, fechaInscripcion, telefono, peso, fechaVencimiento, foto: '' });
  }
});

function guardarCliente(cliente) {
  const transaction = db.transaction(['clientes'], 'readwrite');
  const objectStore = transaction.objectStore('clientes');
  objectStore.add(cliente);

  transaction.oncomplete = () => {
    registerForm.reset();
    registerForm.style.display = 'none';
    mostrarClientes();
  };
}

function calcularVencimiento(fechaInscripcion) {
  const fecha = new Date(fechaInscripcion);
  fecha.setDate(fecha.getDate() + 30);
  return fecha.toISOString().split('T')[0];
}

// Función para mostrar los clientes
function mostrarClientes() {
  clientesDiv.innerHTML = '';

  const transaction = db.transaction(['clientes'], 'readonly');
  const objectStore = transaction.objectStore('clientes');

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const cliente = cursor.value;
      const clienteCard = document.createElement('div');
      clienteCard.className = 'cliente-card';
      
      const vencido = isVencido(cliente.fechaVencimiento);
      clienteCard.innerHTML = `
        ${cliente.foto ? `<img src="${cliente.foto}" alt="Foto de ${cliente.nombre}" class="foto-cliente">` : ''}
        <h3>${escapeHTML(cliente.nombre)} ${escapeHTML(cliente.apellido)}</h3>
        <p>Tel: ${escapeHTML(cliente.telefono)}</p>
        <p>Peso: ${cliente.peso} kg</p>
        <p>Vence: <span style="color:${vencido ? 'red' : 'white'}">${cliente.fechaVencimiento}</span></p>
        <button onclick="editarCliente(${cliente.id})">Editar</button>
        <button onclick="confirmarPago(${cliente.id})">Pagar</button>
        <button onclick="confirmarBorrar(${cliente.id})">Borrar</button>
      `;
      clientesDiv.appendChild(clienteCard);

      cursor.continue();
    }
  };
}

// Función para evitar inyección de HTML
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Funciones auxiliares
function isVencido(fechaVencimiento) {
  const hoy = new Date().toISOString().split('T')[0];
  return fechaVencimiento < hoy;
}

function editarCliente(id) {
  const transaction = db.transaction(['clientes'], 'readonly');
  const objectStore = transaction.objectStore('clientes');
  const request = objectStore.get(id);

  request.onsuccess = (event) => {
    const cliente = event.target.result;
    nombreInput.value = cliente.nombre;
    apellidoInput.value = cliente.apellido;
    fechaInput.value = cliente.fechaInscripcion;
    telefonoInput.value = cliente.telefono;
    pesoInput.value = cliente.peso;

    registerForm.style.display = 'block';
    
    db.transaction(['clientes'], 'readwrite').objectStore('clientes').delete(id);
  };
}

function confirmarPago(id) {
  if (confirm('¿Estás seguro que quieres pagar y extender 30 días más?')) {
    const transaction = db.transaction(['clientes'], 'readwrite');
    const objectStore = transaction.objectStore('clientes');
    const request = objectStore.get(id);

    request.onsuccess = (event) => {
      const cliente = event.target.result;
      const nuevaFecha = new Date(cliente.fechaVencimiento);
      nuevaFecha.setDate(nuevaFecha.getDate() + 30);
      cliente.fechaVencimiento = nuevaFecha.toISOString().split('T')[0];
      objectStore.put(cliente);
      mostrarClientes();
    };
  }
}

function confirmarBorrar(id) {
  if (confirm('¿Estás seguro de borrar este cliente?')) {
    const transaction = db.transaction(['clientes'], 'readwrite');
    const objectStore = transaction.objectStore('clientes');
    objectStore.delete(id);
    transaction.oncomplete = () => {
      mostrarClientes();
    };
  }
}

// Búsqueda dinámica
buscarInput.addEventListener('input', (e) => {
  const texto = e.target.value.toLowerCase();
  const clientes = document.querySelectorAll('.cliente-card');
  clientes.forEach(cliente => {
    const nombre = cliente.querySelector('h3').innerText.toLowerCase();
    const telefono = cliente.querySelector('p').innerText.toLowerCase();
    if (nombre.includes(texto) || telefono.includes(texto)) {
      cliente.style.display = 'block';
    } else {
      cliente.style.display = 'none';
    }
  });
});
