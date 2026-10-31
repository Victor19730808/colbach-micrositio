(function () {
  if (location.hash === "#ruta-alternativa") history.replaceState(null, "", location.pathname + location.search + "#ruta");
  document.querySelectorAll(".hoja").forEach(function (hoja) {
    if (hoja.querySelector(":scope > .marco")) return;
    var marco = document.createElement("div");
    marco.className = "marco";
    while (hoja.firstChild) marco.appendChild(hoja.firstChild);
    hoja.appendChild(marco);
  });

  function alturaBarra() {
    var filete = document.querySelector(".filete");
    var barraEl = document.querySelector(".site-header");
    return (filete ? filete.offsetHeight : 0) + (barraEl ? barraEl.offsetHeight : 0);
  }

  function ajustarHojas() {
    var root = document.documentElement;
    root.style.setProperty("--case-header", alturaBarra() + "px");
    if (window.innerWidth < 960) {
      root.style.removeProperty("--barra");
      return;
    }
    root.style.setProperty("--barra", alturaBarra() + "px");
  }

  function casoDe(el) {
    if (!el) return null;
    if (el.classList.contains("expediente")) return el;
    return el.closest(".expediente");
  }

  function mostrarCaso(caso) {
    document.querySelectorAll(".expediente").forEach(function (item) {
      item.classList.toggle("is-open", item === caso);
    });
  }

  function abrirFuente(dialog) {
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add("fuente-modal-open");
  }
  document.querySelectorAll("[data-source-dialog]").forEach(function (button) {
    button.addEventListener("click", function () {
      abrirFuente(document.getElementById(button.dataset.sourceDialog));
    });
  });
  document.querySelectorAll(".fuente-dialog").forEach(function (dialog) {
    dialog.querySelector("[data-close-source]").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("close", function () { document.documentElement.classList.remove("fuente-modal-open"); });
  });

  function irAHoja(id, inmediato) {
    var destino = document.getElementById(id);
    if (!destino) return;
    var dialogFuente = destino.closest(".fuente-dialog");
    if (dialogFuente) {
      abrirFuente(dialogFuente);
      var panelFuente = dialogFuente.querySelector(".fuente-dialog-body");
      panelFuente.scrollTop += destino.getBoundingClientRect().top - panelFuente.getBoundingClientRect().top;
      return;
    }
    var caso = casoDe(destino);
    var abierto = document.querySelector(".expediente.is-open");
    var cambia = caso !== abierto;
    mostrarCaso(caso);
    var behavior = inmediato || cambia ? "instant" : "smooth";
    function colocar() {
      var top = destino.getBoundingClientRect().top + window.scrollY - alturaBarra();
      if (caso && destino !== caso) {
        var barraCaso = caso.querySelector(".exp-bar");
        if (barraCaso) top -= barraCaso.offsetHeight;
      }
      window.scrollTo({ top: Math.max(0, top), behavior: behavior });

      if (typeof actualizarPasos === "function") actualizarPasos();
    }
    var raiz = document.documentElement;
    var snap = raiz.style.scrollSnapType;
    raiz.style.scrollSnapType = "none";
    colocar();
    window.requestAnimationFrame(colocar);
    window.setTimeout(function () {
      raiz.style.scrollSnapType = snap;
    }, behavior === "smooth" ? 700 : 80);
  }

  ajustarHojas();
  window.addEventListener("resize", ajustarHojas);

  document.querySelectorAll('a[href^="#"]').forEach(function (enlace) {
    enlace.addEventListener("click", function (event) {
      var id = enlace.getAttribute("href").slice(1);
      if (!document.getElementById(id)) return;
      event.preventDefault();
      irAHoja(id);
      history.pushState(null, "", "#" + id);
    });
  });

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-puntos");
  var nav = document.querySelector(".site-nav");
  var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-tab]"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".ficha"));
  var filters = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));

  function setStuck() {
    header.classList.toggle("is-stuck", window.scrollY > 8);
  }

  setStuck();
  window.addEventListener("scroll", setStuck, { passive: true });

  function cerrarNav() {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", function (event) {
    event.stopPropagation();
    var open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  nav.addEventListener("click", function (event) {
    if (event.target.closest("a")) cerrarNav();
  });

  document.addEventListener("click", function (event) {
    if (toggle.contains(event.target) || nav.contains(event.target)) return;
    cerrarNav();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      cerrarNav();
      toggle.focus();
    }
  });

  function activate(id, scroll) {
    var panel = document.getElementById(id);
    if (!panel) return;

    var selectedTab = tabs.find(function (tab) {
      return tab.getAttribute("data-tab") === id;
    });
    if (selectedTab && selectedTab.hidden) applyFilter("todos");

    tabs.forEach(function (tab) {
      var on = tab.getAttribute("data-tab") === id;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
    });

    panels.forEach(function (item) {
      item.classList.toggle("is-active", item.id === id);
    });

    if (selectedTab) {
      var list = selectedTab.parentElement;
      if (list.scrollWidth > list.clientWidth) {
        list.scrollLeft += selectedTab.getBoundingClientRect().left - list.getBoundingClientRect().left;
      }
    }

    if (scroll) {
      var destino = panel.closest(".hoja") || panel;
      var top = destino.getBoundingClientRect().top + window.scrollY - alturaBarra();
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }

    if (location.hash !== "#" + id) {
      history.replaceState(null, "", "#" + id);
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      activate(tab.getAttribute("data-tab"), true);
    });
  });

  document.querySelectorAll("[data-open]").forEach(function (button) {
    button.addEventListener("click", function () {
      activate(button.getAttribute("data-open"), true);
    });
  });

  function applyFilter(name) {
    filters.forEach(function (filter) {
      filter.setAttribute("aria-pressed", filter.getAttribute("data-filter") === name ? "true" : "false");
    });

    var visible = [];
    tabs.forEach(function (tab) {
      var show = name === "todos" || tab.getAttribute("data-priority") === name;
      tab.hidden = !show;
      if (show) visible.push(tab.getAttribute("data-tab"));
    });

    var active = document.querySelector(".ficha.is-active");
    if (!active || (name !== "todos" && active.getAttribute("data-priority") !== name)) {
      if (visible[0]) activate(visible[0], false);
    }
  }

  filters.forEach(function (filter) {
    filter.addEventListener("click", function () {
      applyFilter(filter.getAttribute("data-filter"));
    });
  });

  var tablist = document.querySelector("[role='tablist']");
  if (tablist) {
    tablist.addEventListener("keydown", function (event) {
      var keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
      if (keys.indexOf(event.key) === -1) return;
      var visibleTabs = tabs.filter(function (tab) { return !tab.hidden; });
      var index = visibleTabs.findIndex(function (tab) {
        return tab.getAttribute("aria-selected") === "true";
      });
      var next = index;
      if (event.key === "ArrowRight") next = (index + 1) % visibleTabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + visibleTabs.length) % visibleTabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = visibleTabs.length - 1;
      event.preventDefault();
      visibleTabs[next].focus();
      activate(visibleTabs[next].getAttribute("data-tab"), true);
    });
  }

  function abrirDesdeHash(inmediato) {
    var id = location.hash.replace("#", "");
    if (!id) {
      mostrarCaso(null);
      return;
    }
    if (!document.getElementById(id)) return;
    irAHoja(id, inmediato);
  }

  var initial = location.hash.replace("#", "");
  var inicial = document.getElementById(initial);
  if (inicial && inicial.classList.contains("ficha")) activate(initial, false);
  else if (inicial) abrirDesdeHash(true);

  window.addEventListener("load", function () { abrirDesdeHash(true); });

  window.addEventListener("popstate", function () {
    abrirDesdeHash(true);
  });

  var links = Array.prototype.slice.call(document.querySelectorAll(".site-nav a[href^='#']"));
  var atras = document.getElementById("nav-atras");
  var adelante = document.getElementById("nav-adelante");
  var home = document.querySelector(".nav-home");
  var accesoCasos = document.querySelector(".nav-casos");
  var grupos = {};

  function menuIdDe(el) {
    if (!el) return null;
    if (casoDe(el)) return "casos";
    var hoja = el.classList.contains("hoja") ? el : el.closest(".hoja");
    if (!hoja) return null;
    if (grupos[hoja.id]) return grupos[hoja.id];
    var enMenu = links.some(function (enlace) {
      return enlace.getAttribute("href") === "#" + hoja.id;
    });
    return enMenu ? hoja.id : null;
  }

  // La secuencia principal sigue el DOM; un expediente abierto añade sus seis hojas.
  function secuenciaActual() {
    var pasos = [];
    document.querySelectorAll('.hoja[id], .exp-section[id]').forEach(function (hoja) {
      var caso = casoDe(hoja);
      if (!caso || caso.classList.contains('is-open')) pasos.push(hoja);
    });
    return pasos;
  }

  function hojaEnPantalla() {
    var mejor = null;
    var distancia = Infinity;
    secuenciaActual().forEach(function (hoja) {
      var rect = hoja.getBoundingClientRect();
      if (!rect.height || rect.bottom <= alturaBarra()) return;
      var caso = casoDe(hoja);
      var offset = alturaBarra() + (caso ? caso.querySelector('.exp-bar').offsetHeight : 0);
      var d = Math.abs(rect.top - offset);
      if (d < distancia) { distancia = d; mejor = hoja; }
    });
    return mejor;
  }

  function nombrePaso(hoja) {
    var enlace = links.find(function (a) { return a.hash === '#' + hoja.id; });
    if (enlace) return enlace.textContent.trim();
    var caso = casoDe(hoja);
    var interno = caso && caso.querySelector('.exp-nav a[href="#' + hoja.id + '"]');
    return (caso ? caso.id.toUpperCase() + ' · ' : '') + (interno ? interno.textContent.trim() : hoja.id);
  }

  function actualizarPasos() {
    if (!links || !links.length) return;
    var actual = hojaEnPantalla();
    var id = menuIdDe(actual);
    links.forEach(function (enlace) {
      var activo = enlace.getAttribute("href") === "#" + id;
      enlace.classList.toggle("is-current", activo);
      if (activo) enlace.setAttribute("aria-current", "page");
      else enlace.removeAttribute("aria-current");
    });
    if (home) home.classList.toggle("is-aqui", id === "inicio");
    if (accesoCasos) accesoCasos.classList.toggle("is-aqui", id === "casos");
    var pasos = secuenciaActual();
    var posicion = pasos.indexOf(actual);
    var previo = pasos[posicion - 1];
    var siguiente = pasos[posicion + 1];
    if (atras) {
      atras.disabled = !previo;
      atras.setAttribute("aria-label", previo ? "Anterior: " + nombrePaso(previo) : "Anterior");
    }
    if (adelante) {
      adelante.disabled = !siguiente;
      adelante.setAttribute("aria-label", siguiente ? "Siguiente: " + nombrePaso(siguiente) : "Siguiente");
    }
  }

  function irPaso(delta) {
    var pasos = secuenciaActual();
    var destino = pasos[pasos.indexOf(hojaEnPantalla()) + delta];
    if (!destino) return;
    var id = destino.id;
    irAHoja(id, true);
    history.pushState(null, "", "#" + id);
    cerrarNav();
  }

  if (atras) atras.addEventListener("click", function () { irPaso(-1); });
  if (adelante) adelante.addEventListener("click", function () { irPaso(1); });
  window.addEventListener("scroll", actualizarPasos, { passive: true });
  actualizarPasos();

  function actualizarExpediente() {
    var expediente = document.querySelector(".expediente.is-open");
    document.querySelectorAll(".expediente .exp-nav a").forEach(function (a) {
      a.removeAttribute("aria-current");
    });
    if (!expediente) return;
    var actual = null;
    expediente.querySelectorAll(".exp-section").forEach(function (section) {
      if (section.getBoundingClientRect().top <= window.innerHeight * 0.4) actual = section.id;
    });
    expediente.querySelectorAll(".exp-nav a").forEach(function (a) {
      if (a.getAttribute("href") === "#" + actual) a.setAttribute("aria-current", "location");
    });
  }
  window.addEventListener("scroll", actualizarExpediente, { passive: true });
  actualizarExpediente();

  var temaBotones = Array.prototype.slice.call(document.querySelectorAll(".temas button"));
  var alias = { verde: "tb", oscuro: "os", firma: "ht" };
  var colores = { tb: "#008876", os: "#141210", ht: "#d97013", db: "#12242a" };

  function aplicarTema(nombre) {
    nombre = alias[nombre] || nombre || "tb";
    if (nombre === "tb") document.documentElement.removeAttribute("data-tema");
    else document.documentElement.setAttribute("data-tema", nombre);
    temaBotones.forEach(function (boton) {
      boton.setAttribute("aria-pressed", boton.getAttribute("data-tema") === nombre ? "true" : "false");
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta && colores[nombre]) meta.setAttribute("content", colores[nombre]);
    try { localStorage.setItem("tema", nombre); } catch (error) {}
  }

  var temaInicial = document.documentElement.getAttribute("data-tema") || "tb";
  aplicarTema(temaInicial);
  temaBotones.forEach(function (boton) {
    boton.addEventListener("click", function () {
      aplicarTema(boton.getAttribute("data-tema"));
    });
  });
  // Vincular las dos entradas al mismo expediente, también mediante teclado.
  var caseLinks = Array.from(document.querySelectorAll('#casos [data-case]'));
  function resaltarCaso(id) {
    caseLinks.forEach(function (link) { link.classList.toggle('is-related', link.dataset.case === id); });
  }
  caseLinks.forEach(function (link) {
    link.addEventListener('pointerenter', function () { resaltarCaso(link.dataset.case); });
    link.addEventListener('pointerleave', function () { resaltarCaso(document.activeElement && document.activeElement.dataset.case); });
    link.addEventListener('focus', function () { resaltarCaso(link.dataset.case); });
    link.addEventListener('blur', function () { resaltarCaso(null); });
  });
  var datosHoja = document.querySelector('#datos');
  var motionButton = document.querySelector('.datos-movimiento');
  if (datosHoja && motionButton) {
    var datosVisible = false;
    function actualizarMovimientoDatos() {
      datosHoja.classList.toggle('datos-en-vista', datosVisible && !document.hidden);
    }
    new IntersectionObserver(function(entries) {
      datosVisible = entries[0].isIntersecting;
      actualizarMovimientoDatos();
    }, {threshold:0.2}).observe(datosHoja);
    document.addEventListener('visibilitychange', actualizarMovimientoDatos);
    motionButton.addEventListener('click', function() {
      var paused = datosHoja.classList.toggle('datos-pausados');
      motionButton.setAttribute('aria-pressed', String(paused));
      motionButton.setAttribute('aria-label', paused ? 'Reanudar animación del diagrama' : 'Pausar animación del diagrama');
      motionButton.textContent = paused ? 'Reanudar movimiento' : 'Pausar movimiento';
    });
  }
})();
