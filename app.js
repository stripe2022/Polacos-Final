if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}

const dbName = "PolacosGymDB";
let db;
let editingClientId = null;

const request = indexedDB.open(dbName, 1);

request.onupgradeneeded = (event) => {
  db = event.target.result;
  const objectStore = db.createObjectStore("clients", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = (event) => {
  db = event.target.result;
  loadClients();
};

function loadClients(search = "") {
  const transaction = db.transaction(["clients"], "readonly");
  const store = transaction.objectStore("clients");
  const request = store.getAll();

  request.onsuccess = (e) => {
    const list = document.getElementById('clients-list');
    list.innerHTML = '';

    e.target.result
      .filter(client => search && (client.name.includes(search) || client.phone.includes(search)))
      .forEach(client => {
        const clientDiv = document.createElement('div');
        clientDiv.className = 'client-card';
        clientDiv.innerHTML = `
          <div class="client-info">
            <img class="client-photo" src="${client.photo || 'https://via.placeholder.com/50'}">
            <div>
              <div>${client.name} ${client.lastname}</div>
              <div class="${isExpired(client.expiry) ? 'vencido' : ''}">Vence: ${client.expiry}</div>
            </div>
          </div>
          <div>
            <button onclick="showQR(${client.id})">QR</button>
            <button onclick="editClient(${client.id})">Editar</button>
            <button onclick="deleteClient(${client.id})">Borrar</button>
          </div>
        `;
        list.appendChild(clientDiv);
      });
  };
}

function isExpired(expiryDate) {
  return new Date(expiryDate) < new Date();
}

document.getElementById('add-client-btn').addEventListener('click', () => {
  editingClientId = null;
  document.getElementById('form-title').innerText = "Nuevo Cliente";
  document.getElementById('client-form').reset();
  document.getElementById('form-section').classList.remove('hidden');
});

document.getElementById('client-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('first-name').value;
  const lastname = document.getElementById('last-name').value;
  const phone = document.getElementById('phone').value;
  const registrationDate = document.getElementById('registration-date').value;
  const weightKg = document.getElementById('weight-kg').value;
  const weightLb = (weightKg * 2.20462).toFixed(2);
  const expiryDate = new Date(new Date(registrationDate).setDate(new Date(registrationDate).getDate() + 30)).toISOString().split('T')[0];

  const photoInput = document.getElementById('photo-input');
  const reader = new FileReader();

  reader.onloadend = function() {
    const photo = reader.result;

    const transaction = db.transaction(["clients"], "readwrite");
    const store = transaction.objectStore("clients");

    if (editingClientId) {
      store.put({ id: editingClientId, name, lastname, phone, registrationDate, weightKg, weightLb, expiry: expiryDate, photo });
    } else {
      store.add({ name, lastname, phone, registrationDate, weightKg, weightLb, expiry: expiryDate, photo });
    }

    document.getElementById('client-form').reset();
    document.getElementById('form-section').classList.add('hidden');
    loadClients();
  };

  if (photoInput.files[0]) {
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    reader.onloadend();
  }
});

document.getElementById('weight-kg').addEventListener('input', (e) => {
  const kg = e.target.value;
  document.getElementById('weight-lb').value = (kg * 2.20462).toFixed(2);
});

document.getElementById('search-input').addEventListener('input', (e) => {
  loadClients(e.target.value);
});

function showQR(id) {
  const transaction = db.transaction(["clients"], "readonly");
  const store = transaction.objectStore("clients");
  const request = store.get(id);

  request.onsuccess = (e) => {
    const client = e.target.result;
    if (client) {
      const qrImage = document.getElementById('qr-image');
      QRCode.toDataURL(JSON.stringify(client)).then(url => {
        qrImage.src = url;
        document.getElementById('qr-view').classList.remove('hidden');
      });
    }
  };
}

document.getElementById('close-qr-btn').addEventListener('click', () => {
  document.getElementById('qr-view').classList.add('hidden');
});

function editClient(id) {
  const transaction = db.transaction(["clients"], "readonly");
  const store = transaction.objectStore("clients");
  const request = store.get(id);

  request.onsuccess = (e) => {
    const client = e.target.result;
    if (client) {
      editingClientId = client.id;
      document.getElementById('first-name').value = client.name;
      document.getElementById('last-name').value = client.lastname;
      document.getElementById('phone').value = client.phone;
      document.getElementById('registration-date').value = client.registrationDate;
      document.getElementById('weight-kg').value = client.weightKg;
      document.getElementById('weight-lb').value = client.weightLb;
      document.getElementById('form-title').innerText = "Editar Cliente";
      document.getElementById('form-section').classList.remove('hidden');
    }
  };
}

function deleteClient(id) {
  const transaction = db.transaction(["clients"], "readwrite");
  const store = transaction.objectStore("clients");
  store.delete(id);
  loadClients();
}

let html5QrCode;

document.getElementById('scan-qr-btn').addEventListener('click', () => {
  document.getElementById('qr-reader').classList.remove('hidden');
  html5QrCode = new Html5Qrcode("qr-reader-box");

  Html5Qrcode.getCameras().then(cameras => {
    if (cameras && cameras.length) {
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          alert(`Código Escaneado: ${decodedText}`);
          html5QrCode.stop();
          document.getElementById('qr-reader').classList.add('hidden');
        },
        (errorMessage) => {}
      );
    }
  });
});

document.getElementById('cancel-qr-btn').addEventListener('click', () => {
  if (html5QrCode) {
    html5QrCode.stop();
  }
  document.getElementById('qr-reader').classList.add('hidden');
});
