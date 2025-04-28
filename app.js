// Base de datos local con IndexedDB
let db;
const request = indexedDB.open('PolacosGymDB', 1);

request.onerror = (event) => {
  console.error('Database error:', event.target.errorCode);
};

request.onupgradeneeded = (event) => {
  db = event.target.result;
  const objectStore = db.createObjectStore('clientes', { keyPath: 'id', autoIncrement: true });
};

request.onsuccess = (event) => {
  db = event.target.result;
  mostrarClientes();
};

document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const fechaInscripcion = document.getElementById('fechaInscripcion').value;
  const telefono = document.getElementById('telefono').value.trim();
  const peso = parseFloat(document.getElementById('peso').value);

  const fechaVencimiento = calcularVencimiento(fechaInscripcion);

  const cliente = { nombre, apellido, fechaInscripcion, telefono, peso, fechaVencimiento };

  const transaction = db.transaction(['clientes'], 'readwrite');
  const objectStore = transaction.objectStore('clientes');
  objectStore.add(cliente);

  transaction.oncomplete = () => {
    document.getElementById('registerForm').reset();
    document.getElementById('registerForm').style.display = 'none';
    mostrarClientes();
  };
});

function calcularVencimiento(fechaInscripcion) {
  const fecha = new Date(fechaInscripcion);
  fecha.setDate(fecha.getDate() + 30);
  return fecha.toISOString().split('T')[0];
}

function mostrarClientes() {
  const clientesDiv = document.getElementById('clientes');
  clientesDiv.innerHTML = '';

  const transaction = db.transaction(['clientes'], 'readonly');
  const objectStore = transaction.objectStore('clientes');

  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const cliente = cursor.value;
      const clienteCard = document.createElement('div');
      clienteCard.className = 'cliente-card';
      
      clienteCard.innerHTML = `
        <h3>${cliente.nombre} ${cliente.apellido}</h3>
        <p>Tel: ${cliente.telefono}</p>
        <p>Peso: ${cliente.peso} kg</p>
        <p>Vence: <span style="color:${isVencido(cliente.fechaVencimiento) ? 'red' : 'white'}">${cliente.fechaVencimiento}</span></p>
        <button onclick="editarCliente(${cliente.id})">Editar</button>
        <button onclick="confirmarPago(${cliente.id})">Pagar</button>
        <button onclick="confirmarBorrar(${cliente.id})">Borrar</button>
      `;
      clientesDiv.appendChild(clienteCard);

      cursor.continue();
    }
  };
}

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
    document.getElementById('nombre').value = cliente.nombre;
    document.getElementById('apellido').value = cliente.apellido;
    document.getElementById('fechaInscripcion').value = cliente.fechaInscripcion;
    document.getElementById('telefono').value = cliente.telefono;
    document.getElementById('peso').value = cliente.peso;

    document.getElementById('registerForm').style.display = 'block';

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
document.getElementById('buscar').addEventListener('input', (e) => {
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
// Mostrar/ocultar el formulario de registro al tocar el botón
const btnRegistrar = document.getElementById('btnRegistrar');

btnRegistrar.addEventListener('click', () => {
  if (registerForm.style.display === 'none' || registerForm.style.display === '') {
    registerForm.style.display = 'block';
  } else {
    registerForm.style.display = 'none';
  }
});
