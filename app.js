document.addEventListener("DOMContentLoaded", () => {
  // === TU CÓDIGO ORIGINAL AQUÍ ABAJO, SIN CAMBIOS ===

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
        delete form.dataset.createdAt;
        document.getElementById("preview").innerHTML = "";
        document.getElementById("libras").textContent = "";
        document.getElementById("sexo").dispatchEvent(new Event("change"));
      }
    } else {
      delete form.dataset.editandoId;
      delete form.dataset.createdAt;
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
      delete form.dataset.createdAt;
    }
    document.getElementById("preview").innerHTML = "";
    document.getElementById("libras").textContent = "";

    limpiarBusqueda();
  }

  function limpiarBusqueda() {
    const input = document.getElementById("search-input");
    if (input) input.value = "";
    const resultados = document.getElementById("resultados");
    if (resultados) resultados.innerHTML = "";
  }

  document.getElementById("fecha").valueAsDate = new Date();

  document.getElementById("peso").addEventListener("input", function () {
    const kg = parseFloat(this.value);
    const lb = !isNaN(kg) ? (kg * 2.20462).toFixed(2) : "";
    document.getElementById("libras").textContent = lb ? `${lb} lb` : "";
  });

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

  document.getElementById("sexo").addEventListener("change", function () {
    const sexo = this.value;
    document.getElementById("antropometria-femenino").classList.toggle("hidden", sexo !== "Femenino");
    document.getElementById("antropometria-masculino").classList.toggle("hidden", sexo !== "Masculino");
  });

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

  document.getElementById("btn-foto").addEventListener("click", () => {
    document.getElementById("foto").click();
  });

  // Tu código continúa aquí como antes...

  // Al final: REGISTRO DEL SERVICE WORKER
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/Polacos-Final/service-worker.js')
        .then(reg => console.log('[SW] Registrado correctamente:', reg))
        .catch(err => console.error('[SW] Error al registrar:', err));
    });
  }
});
