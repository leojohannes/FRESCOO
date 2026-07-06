(function () {
  const products = window.FRESCOO_PRODUCTS || [];
  const storageKey = "frescoo-cart";
  const money = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  });

  let cart = loadCart();

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function formatPrice(value) {
    return money.format(value);
  }

  function getProduct(id) {
    return products.find((product) => product.id === id);
  }

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch {
      return {};
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
      // Le panier reste utilisable pendant la session si le stockage local est bloqué.
    }
  }

  function getCartLines() {
    return Object.entries(cart)
      .map(([id, quantity]) => ({ product: getProduct(id), quantity }))
      .filter((line) => line.product && line.quantity > 0);
  }

  function getCartTotals() {
    const lines = getCartLines();
    const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const delivery = subtotal === 0 ? 0 : 4.9;
    return {
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal,
      delivery,
      total: subtotal + delivery
    };
  }

  function updateCartCount() {
    const { count } = getCartTotals();
    $$(".cart-count").forEach((node) => {
      node.textContent = count;
    });
  }

  function addToCart(id) {
    const product = getProduct(id);
    if (!product) return;
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    updateCartCount();
    renderCartPage();
    showToast(`${product.name} ajouté au panier.`);
  }

  function setQuantity(id, quantity) {
    if (quantity <= 0) {
      delete cart[id];
    } else {
      cart[id] = quantity;
    }
    saveCart();
    updateCartCount();
    renderCartPage();
  }

  function productCard(product) {
    const silentLabel = product.silent ? "Silencieux" : "Performance";
    return `
      <article class="product-card">
        <a class="product-media" href="produit.html?id=${product.id}" aria-label="Voir ${product.name}">
          <img src="${product.image}" alt="${product.name}" loading="lazy" />
          <span class="badge badge-floating">${product.badge}</span>
        </a>
        <div class="product-body">
          <div class="product-meta">
            <span>${product.type}</span>
            <span class="rating">★ ${product.rating.toFixed(1)} (${product.reviewsCount})</span>
          </div>
          <h3>${product.name}</h3>
          <p>${product.short}</p>
          <div class="feature-tags">
            <span class="feature-tag">${product.silent ? "🔇" : "💨"} ${silentLabel}</span>
            <span class="feature-tag">⚡ ${product.power} W</span>
            <span class="feature-tag">💬 ${product.noise} dB</span>
          </div>
          <div class="price-line">
            <span class="price">${formatPrice(product.price)}</span>
            <span class="old-price">${formatPrice(product.oldPrice)}</span>
          </div>
          <div class="product-actions">
            <a class="btn btn-secondary" href="produit.html?id=${product.id}">Fiche</a>
            <button class="btn btn-primary" type="button" data-add-to-cart="${product.id}">Ajouter</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderBestSellers() {
    const grid = $("#bestSellerGrid");
    if (!grid) return;
    grid.innerHTML = products.map(productCard).join("");
  }

  function renderCatalogPage() {
    const grid = $("#productGrid");
    if (!grid) return;

    const selectedTypes = new Set($$("[data-type-filter]:checked").map((input) => input.value));
    const maxPrice = Number($("#priceRange")?.value || 150);
    const minPower = Number($("#powerRange")?.value || 0);
    const silentOnly = Boolean($("#silentOnly")?.checked);
    const sort = $("#sortSelect")?.value || "featured";

    let filtered = products.filter((product) => {
      const matchesType = selectedTypes.has(product.type);
      const matchesPrice = product.price <= maxPrice;
      const matchesPower = product.power >= minPower;
      const matchesSilent = !silentOnly || product.silent;
      return matchesType && matchesPrice && matchesPower && matchesSilent;
    });

    const sorters = {
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      "power-desc": (a, b) => b.power - a.power,
      "rating-desc": (a, b) => b.rating - a.rating,
      featured: (a, b) => products.indexOf(a) - products.indexOf(b)
    };

    filtered = filtered.sort(sorters[sort] || sorters.featured);
    grid.innerHTML = filtered.map(productCard).join("");

    const empty = $("#emptyState");
    if (empty) empty.classList.toggle("is-visible", filtered.length === 0);

    const resultCount = $("#resultCount");
    if (resultCount) resultCount.textContent = `${filtered.length} produit${filtered.length > 1 ? "s" : ""}`;

    const priceValue = $("#priceValue");
    if (priceValue) priceValue.textContent = `${maxPrice} €`;

    const powerValue = $("#powerValue");
    if (powerValue) powerValue.textContent = `${minPower} W`;
  }

  function bindCatalogPage() {
    if (!$("#productGrid")) return;
    $$("[data-type-filter], #priceRange, #powerRange, #silentOnly, #sortSelect").forEach((input) => {
      input.addEventListener("input", renderCatalogPage);
      input.addEventListener("change", renderCatalogPage);
    });

    $("#clearFilters")?.addEventListener("click", () => {
      $$("[data-type-filter]").forEach((input) => {
        input.checked = true;
      });
      $("#priceRange").value = 150;
      $("#powerRange").value = 0;
      $("#silentOnly").checked = false;
      $("#sortSelect").value = "featured";
      renderCatalogPage();
      showToast("Filtres réinitialisés.");
    });
  }

  function getProductFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return getProduct(params.get("id")) || products[2] || products[0];
  }

  function renderProductPage() {
    const detail = $("#productDetail");
    if (!detail) return;
    const product = getProductFromUrl();
    document.title = `${product.name} - FRESCOO`;

    detail.innerHTML = `
      <div class="detail-gallery">
        <div class="detail-image">
          <img src="${product.image}" alt="${product.name}" />
        </div>
        <div class="thumbnail-row" aria-label="Changer de modèle">
          ${products.map((item) => `
            <a class="thumb-link ${item.id === product.id ? "is-active" : ""}" href="produit.html?id=${item.id}" aria-label="Voir ${item.name}">
              <img src="${item.image}" alt="" loading="lazy" />
              <span>${item.name.replace("FRESCOO ", "")}</span>
            </a>
          `).join("")}
        </div>
      </div>
      <div class="detail-content">
        <div class="detail-topline">
          <span class="badge">${product.type}</span>
          <span class="badge">${product.silent ? "🔇 Silencieux" : "💨 Puissant"}</span>
          <span class="badge">★ ${product.rating.toFixed(1)} / 5</span>
        </div>
        <h2>${product.name}</h2>
        <p class="detail-description">${product.description}</p>
        <div class="feature-tags" aria-label="Caractéristiques rapides">
          ${product.features.map((feature) => `<span class="feature-tag">${feature}</span>`).join("")}
        </div>
        <div class="spec-grid">
          ${product.specs.map(([label, value]) => `
            <div class="spec">
              <span>${label}</span>
              <strong>${value}</strong>
            </div>
          `).join("")}
        </div>
        <div class="price-line">
          <span class="price">${formatPrice(product.price)}</span>
          <span class="old-price">${formatPrice(product.oldPrice)}</span>
        </div>
        <div class="detail-actions">
          <button class="btn btn-primary" type="button" data-add-to-cart="${product.id}">Ajouter au panier</button>
          <a class="btn btn-secondary" href="catalogue.html">Retour catalogue</a>
        </div>
        <div class="reviews" aria-label="Avis clients">
          ${product.reviews.map(([name, text]) => `
            <div class="review">
              <strong>★ ★ ★ ★ ★ ${name}</strong>
              <p>${text}</p>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    const relatedGrid = $("#relatedGrid");
    if (relatedGrid) {
      relatedGrid.innerHTML = products
        .filter((item) => item.id !== product.id)
        .map(productCard)
        .join("");
    }
  }

  function renderCartPage() {
    const cartItems = $("#cartItems");
    if (!cartItems) return;

    const lines = getCartLines();
    const totals = getCartTotals();
    $("#subtotalAmount").textContent = formatPrice(totals.subtotal);
    $("#deliveryAmount").textContent = formatPrice(totals.delivery);
    $("#totalAmount").textContent = formatPrice(totals.total);

    if (totals.subtotal === 0) {
      $("#deliveryNote").textContent = "Ajoutez un ventilateur pour commencer.";
    } else {
      $("#deliveryNote").textContent = "Livraison standard calculée dans le total.";
    }

    if (lines.length === 0) {
      cartItems.innerHTML = `<div class="cart-empty">Votre panier est vide. Choisissez un modèle dans le catalogue.</div>`;
    } else {
      cartItems.innerHTML = lines.map(({ product, quantity }) => `
        <div class="cart-row">
          <img src="${product.image}" alt="${product.name}" />
          <div>
            <h3>${product.name}</h3>
            <p>${product.type} - ${formatPrice(product.price)} l'unité</p>
          </div>
          <div class="cart-row-actions">
            <div class="qty-controls" aria-label="Quantité ${product.name}">
              <button type="button" data-qty-action="decrement" data-id="${product.id}" aria-label="Retirer une unité">−</button>
              <span>${quantity}</span>
              <button type="button" data-qty-action="increment" data-id="${product.id}" aria-label="Ajouter une unité">+</button>
            </div>
            <strong>${formatPrice(product.price * quantity)}</strong>
            <button class="remove-btn" type="button" data-qty-action="remove" data-id="${product.id}">Supprimer</button>
          </div>
        </div>
      `).join("");
    }

    const recommendations = $("#cartRecommendations");
    if (recommendations) recommendations.innerHTML = products.map(productCard).join("");
  }

  function bindCartPage() {
    $("#checkoutButton")?.addEventListener("click", () => {
      const totals = getCartTotals();
      if (totals.count === 0) {
        showToast("Ajoutez au moins un ventilateur avant de simuler la commande.");
        return;
      }
      showToast(`Commande simulée : ${formatPrice(totals.total)}. Aucun paiement réel n'a été lancé.`);
    });

    $("#clearCartButton")?.addEventListener("click", () => {
      cart = {};
      saveCart();
      updateCartCount();
      renderCartPage();
      showToast("Panier vidé.");
    });
  }

  function bindContactPage() {
    const form = $("#contactForm");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      $("#formMessage").textContent = "Message reçu. Notre équipe vous répondra bientôt.";
      form.reset();
    });
  }

  function bindGlobalActions() {
    document.addEventListener("click", (event) => {
      const addButton = event.target.closest("[data-add-to-cart]");
      if (addButton) {
        addToCart(addButton.dataset.addToCart);
      }

      const qtyButton = event.target.closest("[data-qty-action]");
      if (qtyButton) {
        const id = qtyButton.dataset.id;
        const current = cart[id] || 0;
        if (qtyButton.dataset.qtyAction === "increment") setQuantity(id, current + 1);
        if (qtyButton.dataset.qtyAction === "decrement") setQuantity(id, current - 1);
        if (qtyButton.dataset.qtyAction === "remove") setQuantity(id, 0);
      }
    });
  }

  function markActivePage() {
    const page = document.body.dataset.page;
    $$(`.nav-link[data-page="${page}"]`).forEach((link) => {
      link.classList.add("is-active");
    });
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  markActivePage();
  updateCartCount();
  bindGlobalActions();
  bindCatalogPage();
  bindCartPage();
  bindContactPage();
  renderBestSellers();
  renderCatalogPage();
  renderProductPage();
  renderCartPage();
})();
