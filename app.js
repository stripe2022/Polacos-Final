// app.js

// ==================== IndexedDB ====================
let db;
const request = indexedDB.open('gimnasioDB', 1);

request.onerror = () => {
  console.error('Error al abrir la base de datos');
};

request.onsuccess = (event) => {
  db = event.target.result;
  mostrarClientes();
};

request.onupgradeneeded = (event) => {
  db = event.target.result;
  const objectStore = db.createObjectStore('clientes', { keyPath: 'id', autoIncrement: true });
  objectStore.createIndex('nombre', 'nombre', { unique: false });
  objectStore.createIndex('apellido', 'apellido', { unique: false });
};

// ==================== Utilidades ====================

// Mostrar mensajes temporales
function mostrarMensaje(texto, tipo = 'exito') {
  const message = document.getElementById('message');
  message.textContent = texto;
  message.style.backgroundColor = tipo === 'error' ? '#dc3545' : '#0d6efd';
  message.classList.remove('hidden');
  
  setTimeout(() => {
    message.classList.add('hidden');
  }, 3000);
}

// Convertir kilogramos a libras
function kgToLbs(kg) {
  return (kg * 2.20462).toFixed(2);
}

// Calcular fecha de vencimiento (+30 días)
function calcularVencimiento(fechaInscripcion) {
  const fecha = new Date(fechaInscripcion);
  fecha.setDate(fecha.getDate() + 30);
  return fecha;
}

// Formatear fecha para mostrar
function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-ES');
}

// ==================== Funciones principales ====================

// Agregar cliente
function agregarCliente(cliente) {
  const transaction = db.transaction(['clientes'], 'readwrite');
  const objectStore = transaction.objectStore('clientes');
  objectStore.add(cliente);

  transaction.oncomplete = () => {
    mostrarMensaje('Cliente agregado');
    mostrarClientes();
  };

  transaction.onerror = () => {
    mostrarMensaje('Error al agregar cliente', 'error');
  };
}

// Mostrar clientes
function mostrarClientes() {
  const container = document.getElementById('clientesContainer');
  container.innerHTML = '';

  const transaction = db.transaction(['clientes'], 'readonly');
  const objectStore = transaction.objectStore('clientes');

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const cliente = cursor.value;
      const vencimiento = calcularVencimiento(cliente.fechaInscripcion);
      const hoy = new Date();

      const tarjeta = document.createElement('div');
      tarjeta.classList.add('card');

      tarjeta.innerHTML = `
        ${cliente.foto ? `<img src="${cliente.foto}" alt="Foto de ${cliente.nombre}">` : ''}
        <h2>${cliente.nombre} ${cliente.apellido}</h2>
        <p>Tel: ${cliente.telefono}</p>
        <p>Peso: ${cliente.peso} kg (${kgToLbs(cliente.peso)} lb)</p>
        <p class="${vencimiento < hoy ? 'expired' : ''}">
          Vence: ${formatearFecha(vencimiento)}
        </p>
        <button onclick="editarCliente(${cliente.id})">Editar</button>
        <button onclick="extenderInscripcion(${cliente.id})">Extender</button>
        <button onclick="eliminarCliente(${cliente.id})">Eliminar</button>
      `;

      container.appendChild(tarjeta);
      cursor.continue();
    }
  };
}

// Eliminar cliente
function eliminarCliente(id) {
  const transaction = db.transaction(['clientes'], 'readwrite');
  const objectStore = transaction.objectStore('clientes');
  objectStore.delete(id);

  transaction.oncomplete = () => {
    mostrarMensaje('Cliente eliminado');
    mostrarClientes();
  };

  transaction.onerror = () => {
    mostrarMensaje('Error al eliminar', 'error');
  };
}

// Editar cliente (simple, reemplazando datos)
function editarCliente(id) {
  const nombre = prompt('Nuevo nombre:');
  const apellido = prompt('Nuevo apellido:');
  const telefono = prompt('Nuevo teléfono:');
  const peso = prompt('Nuevo peso (kg):');

  if (nombre && apellido && telefono && peso) {
    const transaction = db.transaction(['clientes'], 'readwrite');
    const objectStore = transaction.objectStore('clientes');
    const request = objectStore.get(id);

    request.onsuccess = () => {
      const cliente = request.result;
      cliente.nombre = nombre;
      cliente.apellido = apellido;
      cliente.telefono = telefono;
      cliente.peso = peso;

      const updateRequest = objectStore.put(cliente);
      updateRequest.onsuccess = () => {
        mostrarMensaje('Cliente actualizado');
        mostrarClientes();
      };
    };
  } else {
    mostrarMensaje('Datos incompletos', 'error');
  }
}

// Extender inscripción (+30 días desde hoy)
function extenderInscripcion(id) {
  const transaction = db.transaction(['clientes'], 'readwrite');
  const objectStore = transaction.objectStore('clientes');
  const request = objectStore.get(id);

  request.onsuccess = () => {
    const cliente = request.result;
    cliente.fechaInscripcion = new Date().toISOString().split('T')[0];

    const updateRequest = objectStore.put(cliente);
    updateRequest.onsuccess = () => {
      mostrarMensaje('Inscripción extendida');
      mostrarClientes();
    };
  };
}

// ==================== Eventos ====================

// Mostrar/ocultar formulario
const toggleFormBtn = document.getElementById('toggleFormBtn');
const formSection = document.getElementById('formSection');
toggleFormBtn.addEventListener('click', () => {
  formSection.classList.toggle('hidden');
});

// Registrar cliente
const clientForm = document.getElementById('clientForm');
clientForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const apellido = document.getElementById('apellido').value;
  const fechaInscripcion = document.getElementById('fechaInscripcion').value;
  const telefono = document.getElementById('telefono').value;
  const peso = document.getElementById('peso').value;
  const fotoInput = document.getElementById('foto');

  const reader = new FileReader();
  if (fotoInput.files.length > 0) {
    reader.readAsDataURL(fotoInput.files[0]);
    reader.onload = () => {
      const cliente = {
        nombre,
        apellido,
        fechaInscripcion,
        telefono,
        peso,
        foto: reader.result
      };
      agregarCliente(cliente);
      clientForm.reset();
      formSection.classList.add('hidden');
    };
  } else {
    const cliente = {
      nombre,
      apellido,
      fechaInscripcion,
      telefono,
      peso,
      foto: null
    };
    agregarCliente(cliente);
    clientForm.reset();
    formSection.classList.add('hidden');
  }
});

// Buscar clientes en tiempo real
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', () => {
  const searchText = searchInput.value.toLowerCase();
  const cards = document.querySelectorAll('.card');

  cards.forEach(card => {
    const nombre = card.querySelector('h2').textContent.toLowerCase();
    if (nombre.includes(searchText)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
});

// ==================== PWA: Service Worker ====================

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(registration => {
      console.log('Service Worker registrado:', registration.scope);
    })
    .catch(error => {
      console.error('Error registrando Service Worker:', error);
    });
}
