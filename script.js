/* ==========================================================================
   TOYNEXX — Application Script
   Vanilla JS, no dependencies. Cart & wishlist are saved to localStorage,
   so they persist across reloads and are shared with cart.html, product.html
   and checkout.html. Checkout itself happens on checkout.html, which takes
   a real payment through Razorpay (see /toynexx-backend for the server).
   Login/auth and the admin panel remain demo-only (no backend for those yet).
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. DEMO DATA
     ------------------------------------------------------------------ */
  const CATEGORIES = [
    { id: 'superhero', name: 'Superhero Icons', glyph: '&#9670;', count: '18 Figures' },
    { id: 'anime',     name: 'Anime Legends',   glyph: '&#9671;', count: '24 Figures' },
    { id: 'mecha',     name: 'Mecha Series',    glyph: '&#9672;', count: '11 Figures' },
    { id: 'limited',   name: 'Limited Edition', glyph: '&#9673;', count: '7 Figures'  }
  ];

 

  const CATEGORY_STRIP = [
    { name: 'Anime Action Figure',    filter: 'Anime Legends' },
    { name: 'Katana Collection',      filter: 'Anime Legends' },
    { name: 'Die Cast | Hot Wheels',  filter: 'Mecha Series' },
    { name: 'Keychains | Watches',    filter: 'all' },
    { name: 'Bobblehead | Q Posket',  filter: 'all' },
    { name: 'Marvel | DC',            filter: 'Superhero Icons' },
    { name: 'Nostalgia Collection',   filter: 'all' },
    { name: 'Other Trending Products',filter: 'all' },
    { name: 'All Products',           filter: 'all' }
  ];

  /* ------------------------------------------------------------------
     2. STATE (in-memory only — see note at top of file)
     ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------
     BUG FIX: the cart used to live only in a JS variable, which reset
     every time the page reloaded AND was completely separate from the
     cart used on cart.html / product.html / checkout.html. Loading it
     from (and saving it to) localStorage means "Add to Cart" here
     actually shows up in your real cart and checkout pages.
     ------------------------------------------------------------------ */
  function loadCartData(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      console.error('Could not read ' + key + ' from storage:', error);
      return fallback;
    }
  }

  function saveCart() {
    try { localStorage.setItem('cart', JSON.stringify(state.cart)); }
    catch (error) { console.error('Could not save cart:', error); }
  }

  function saveWishlist() {
    try { localStorage.setItem('wishlist', JSON.stringify(state.wishlist)); }
    catch (error) { console.error('Could not save wishlist:', error); }
  }

  const state = {
    cart: loadCartData('cart', []),           // { id, qty }
    wishlist: loadCartData('wishlist', []),   // [id, ...]
    filter: 'all',
    sort: 'newest',
    quickViewId: null,
    checkoutStep: 1,
    coupon: null,
    loggedIn: false,
    orders: []      // { id, items:[{name,qty}], total, status }
  };

  const money = (n) => '₹' + n.toLocaleString('en-IN');
  const findProduct = (id) => PRODUCTS.find(p => p.id === id);

  /* ------------------------------------------------------------------
     3. FIGURE THUMBNAIL (shared clip-path silhouette used everywhere)
     ------------------------------------------------------------------ */
  function figureThumb(extraClass) {
    return `<div class="pc-figure ${extraClass || ''}"></div>`;
  }

  /* ------------------------------------------------------------------
     4. RENDER: CATEGORIES
     ------------------------------------------------------------------ */
  function renderCategories() {
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = CATEGORIES.map(c => `
      <div class="category-card reveal" data-category="${c.name}">
        <div class="cc-glyph">${c.glyph}</div>
        <div class="cc-arrow">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="8 5 19 5 19 16"/></svg>
        </div>
        <div class="cc-info">
          <span class="cc-count">${c.count}</span>
          <div class="cc-name">${c.name}</div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', () => {
        state.filter = card.dataset.category;
        applyFilter();
        document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
        syncFilterPills();
      });
    });
    observeReveals();
  }

  /* ------------------------------------------------------------------
     4b. RENDER: INFINITE CATEGORY STRIP
     ------------------------------------------------------------------ */
  function renderCategoryStrip() {
    const track = document.getElementById('catStripTrack');
    const strip = document.getElementById('catStrip');
    const chip = (c) => `<button class="cat-chip" data-filter="${c.filter}"><span class="cc-dot"></span>${c.name}</button>`;
    // duplicated once for a seamless infinite loop (track animates -50%)
    track.innerHTML = CATEGORY_STRIP.map(chip).join('') + CATEGORY_STRIP.map(chip).join('');

    track.querySelectorAll('.cat-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        if (strip.dataset.dragged === '1') return; // ignore click right after a drag
        state.filter = btn.dataset.filter;
        syncFilterPills();
        applyFilter();
        document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
      });
    });

    // pause on hover
    strip.addEventListener('mouseenter', () => strip.classList.add('paused'));
    strip.addEventListener('mouseleave', () => strip.classList.remove('paused'));

    // drag on desktop, swipe on mobile — pause CSS animation and pan via transform
    let isDown = false, startX = 0, currentX = 0, baseOffset = 0;
    const getOffset = () => {
      const t = window.getComputedStyle(track).transform;
      if (t === 'none') return 0;
      return parseFloat(t.split(',')[4]) || 0;
    };
    const start = (x) => {
      isDown = true; strip.dataset.dragged = '0';
      startX = x; baseOffset = getOffset();
      strip.classList.add('dragging');
      track.style.animation = 'none';
      track.style.transform = `translateX(${baseOffset}px)`;
    };
    const move = (x) => {
      if (!isDown) return;
      currentX = x;
      const delta = currentX - startX;
      if (Math.abs(delta) > 6) strip.dataset.dragged = '1';
      track.style.transform = `translateX(${baseOffset + delta}px)`;
    };
    const end = () => {
      if (!isDown) return;
      isDown = false;
      strip.classList.remove('dragging');
      // resume the infinite CSS animation from a fresh cycle
      track.style.transition = 'none';
      track.style.animation = '';
      setTimeout(() => { strip.dataset.dragged = '0'; }, 50);
    };

    strip.addEventListener('mousedown', (e) => start(e.clientX));
    window.addEventListener('mousemove', (e) => move(e.clientX));
    window.addEventListener('mouseup', end);
    strip.addEventListener('touchstart', (e) => start(e.touches[0].clientX), { passive: true });
    strip.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true });
    strip.addEventListener('touchend', end);
  }

  /* ------------------------------------------------------------------
     5. RENDER: PRODUCT GRID
     ------------------------------------------------------------------ */
  function renderProducts(list) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = list.map(p => `
      <div class="product-card reveal" data-id="${p.id}">
        <div class="pc-media">
          ${p.tag ? `<span class="pc-badge">${p.tag}</span>` : ''}
          <span class="pc-edition">Edition<b>${p.edition}/${p.total}</b></span>
          <div class="pc-image">
           <img src="${p.image}" alt="${p.name}" loading="lazy">
             </div>
          <div class="pc-quick">
            <button class="pc-icon-btn pc-quickview" title="Quick View" aria-label="Quick View">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
            </button>
            <button class="pc-icon-btn pc-wish" title="Wishlist" aria-label="Add to wishlist">
              <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.3C0.4 8.5 2 5 5.6 5c2 0 3.4 1 4.4 2.4C11 6 12.4 5 14.4 5 18 5 19.6 8.5 18 11.7 15.5 16.4 12 21 12 21z"/></svg>
            </button>
            <button class="pc-icon-btn pc-compare" title="Compare" aria-label="Compare">
              <svg viewBox="0 0 24 24"><path d="M8 3v14M8 17l-4-4M8 17l4-4M16 21V7M16 7l4 4M16 7l-4 4"/></svg>
            </button>
          </div>
        </div>
        <div class="pc-body">
          <span class="pc-category">${p.category}</span>
          <h3 class="pc-name">${p.name}</h3>
          <div class="pc-bottom">
            <span class="pc-price">${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ''}${money(p.price)}</span>
            <button class="pc-add" data-id="${p.id}" aria-label="Add ${p.name} to cart">
              <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.product-card').forEach(card => {
      const id = card.dataset.id;

      card.addEventListener("click", (e) => {

    // Agar Quick View ya Cart ya Wishlist button dabaya hai to page open mat karo
    if (e.target.closest(".pc-icon-btn") || e.target.closest(".pc-add")) {
        return;
    }

    window.location.href = `product.html?id=${id}`;

});

      card.querySelector('.pc-quickview').addEventListener('click', () => openQuickView(id));
      card.querySelector('.pc-add').addEventListener('click', (e) => addToCart(id, 1, e.currentTarget));
      card.querySelector('.pc-compare').addEventListener('click', () => showToast('Added to compare list'));
      const wishBtn = card.querySelector('.pc-wish');
      wishBtn.addEventListener('click', () => toggleWishlist(id));
      if (state.wishlist.includes(id)) wishBtn.classList.add('active');

      applyTilt(card);
    });

    observeReveals();
  }

  function sortProducts(list) {
    const sorted = [...list];
    switch (state.sort) {
      case 'price-asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price-desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'rating': sorted.sort((a, b) => b.rating - a.rating); break;
      case 'popular': sorted.sort((a, b) => b.sold - a.sold); break;
      case 'newest':
      default: sorted.sort((a, b) => a.added - b.added); break;
    }
    return sorted;
  }

  function applyFilter() {
    let list = state.filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === state.filter);
    list = sortProducts(list);
    renderProducts(list);
  }

  function syncFilterPills() {
    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === state.filter);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.filter = btn.dataset.filter;
        syncFilterPills();
        applyFilter();
      });
    });
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        state.sort = sortSelect.value;
        applyFilter();
      });
    }
  });

  /* ------------------------------------------------------------------
     6. 3D TILT + MAGNETIC HOVER (product cards)
     ------------------------------------------------------------------ */
  function applyTilt(card) {
    const media = card.querySelector('.pc-media');
    let raf = null;
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `perspective(1000px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateY(-4px)`;
        media.style.transform = `translate(${(x * 6).toFixed(1)}px, ${(y * 6).toFixed(1)}px)`;
      });
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      media.style.transform = '';
    });
  }

  /* ------------------------------------------------------------------
     7. SCROLL REVEAL
     ------------------------------------------------------------------ */
  let revealObserver = null;
  function observeReveals() {
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
    }
    document.querySelectorAll('.reveal:not(.in-view)').forEach(el => revealObserver.observe(el));
  }

  /* ------------------------------------------------------------------
     8. NAVBAR SCROLL STATE + MOBILE MENU
     ------------------------------------------------------------------ */
  const navbar = document.getElementById('navbar');

  const navBurger = document.getElementById("navBurger");
  const navLinks = document.getElementById("navLinks");


  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

if (navBurger && navLinks) {

    navBurger.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        navBurger.setAttribute('aria-expanded', isOpen);
    });

    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => navLinks.classList.remove('open'));
    });

}

  /* ------------------------------------------------------------------
     9. SEARCH OVERLAY
     ------------------------------------------------------------------ */
  const searchOverlay = document.getElementById('searchOverlay');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  let searchFilter = 'all';

  if (
    searchOverlay &&
    searchInput &&
    searchResults &&
    document.getElementById('searchBtn') &&
    document.getElementById('searchClose')
) {

    document.getElementById('searchBtn').addEventListener('click', () => {
        searchOverlay.classList.add('open');
        setTimeout(() => searchInput.focus(), 300);
        runSearch();
    });

    document.getElementById('searchClose').addEventListener('click', () =>
        searchOverlay.classList.remove('open')
    );

    searchInput.addEventListener('input', runSearch);

    document.querySelectorAll('.search-filters .chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.search-filters .chip')
                .forEach(c => c.classList.remove('active'));

            chip.classList.add('active');
            searchFilter = chip.dataset.filter;
            runSearch();
        });
    });

}

  function runSearch() {
    const q = searchInput.value.trim().toLowerCase();
    let results = PRODUCTS.filter(p => {
      const matchesFilter = searchFilter === 'all' || p.category === searchFilter;
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
    searchResults.innerHTML = results.length ? results.map(p => `
      <div class="sr-item" data-id="${p.id}">
        <div>
          <div class="sr-name">${p.name}</div>
          <div class="sr-meta">${p.category} &middot; Edition ${p.edition}/${p.total}</div>
        </div>
        <div class="sr-meta">${money(p.price)}</div>
      </div>
    `).join('') : `<div class="sr-empty">No figures match your search.</div>`;

    searchResults.querySelectorAll('.sr-item').forEach(item => {
      item.addEventListener('click', () => {
        searchOverlay.classList.remove('open');
        openQuickView(item.dataset.id);
      });
    });
  }

  /* ------------------------------------------------------------------
     10. CART LOGIC
     ------------------------------------------------------------------ */
  const cartDrawer = document.getElementById('cartDrawer');
  const wishlistDrawer = document.getElementById('wishlistDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');

  function openDrawer(drawer) {
    closeAllDrawers();
    drawer.classList.add('open');
    drawerOverlay.classList.add('open');
  }
  function closeAllDrawers() {
    cartDrawer.classList.remove('open');
    wishlistDrawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
  }
  drawerOverlay.addEventListener('click', closeAllDrawers);
  document.getElementById('cartClose').addEventListener('click', closeAllDrawers);
  document.getElementById('wishlistClose').addEventListener('click', closeAllDrawers);
  document.getElementById('cartBtn').addEventListener('click', () => openDrawer(cartDrawer));
  document.getElementById('wishlistBtn').addEventListener('click', () => openDrawer(wishlistDrawer));
  document.getElementById('cartEmptyShop').addEventListener('click', () => { closeAllDrawers(); document.getElementById('shop').scrollIntoView({behavior:'smooth'}); });
  document.getElementById('wishlistEmptyShop').addEventListener('click', () => { closeAllDrawers(); document.getElementById('shop').scrollIntoView({behavior:'smooth'}); });

  function addToCart(id, qty, sourceEl) {
    const product = findProduct(id);
    if (!product) return;
    const existing = state.cart.find(c => c.id === id);
    const currentQty = existing ? existing.qty : 0;

    // Stock validation against numbered edition size
    if (currentQty + qty > product.total) {
      showToast(`Only ${product.total} pieces exist in this edition`);
      return;
    }

    if (existing) existing.qty += qty;
    else state.cart.push({ id, qty });

    saveCart();
    renderCart();
    pulseBadge('cartBadge');
    showToast(`${product.name} added to cart`);
    if (sourceEl) flyToCart(sourceEl);
  }

  function removeFromCart(id) {
    state.cart = state.cart.filter(c => c.id !== id);
    saveCart();
    renderCart();
  }

  function changeQty(id, delta) {
    const item = state.cart.find(c => c.id === id);
    if (!item) return;
    const product = findProduct(id);
    item.qty += delta;
    if (item.qty > product.total) item.qty = product.total;
    if (item.qty <= 0) return removeFromCart(id);
    saveCart();
    renderCart();
  }

  function cartSubtotal() {
    return state.cart.reduce((sum, c) => sum + findProduct(c.id).price * c.qty, 0);
  }

  function renderCart() {
    const itemsEl = document.getElementById('cartItems');
    const emptyEl = document.getElementById('cartEmpty');
    const footerEl = document.getElementById('cartFooter');
    const badge = document.getElementById('cartBadge');
    const totalQty = state.cart.reduce((s, c) => s + c.qty, 0);

    badge.textContent = totalQty;
    badge.classList.toggle('show', totalQty > 0);

    if (!state.cart.length) {
      itemsEl.innerHTML = '';
      emptyEl.classList.add('show');
      footerEl.classList.add('hide');
      return;
    }
    emptyEl.classList.remove('show');
    footerEl.classList.remove('hide');

    itemsEl.innerHTML = state.cart.map(c => {
      const p = findProduct(c.id);
      return `
        <div class="cart-item" data-id="${p.id}">
          <div class="ci-thumb">${figureThumb()}</div>
          <div class="ci-info">
            <h4 class="ci-name">${p.name}</h4>
            <span class="ci-cat">${p.category}</span>
            <div class="ci-row">
              <div class="qty-mini">
                <button class="qty-dec" aria-label="Decrease quantity">&minus;</button>
                <span>${c.qty}</span>
                <button class="qty-inc" aria-label="Increase quantity">+</button>
              </div>
              <span class="ci-price">${money(p.price * c.qty)}</span>
            </div>
            <button class="ci-remove">Remove</button>
          </div>
        </div>
      `;
    }).join('');

    itemsEl.querySelectorAll('.cart-item').forEach(row => {
      const id = row.dataset.id;
      row.querySelector('.qty-inc').addEventListener('click', () => changeQty(id, 1));
      row.querySelector('.qty-dec').addEventListener('click', () => changeQty(id, -1));
      row.querySelector('.ci-remove').addEventListener('click', () => removeFromCart(id));
    });

    document.getElementById('cartSubtotal').textContent = money(cartSubtotal());
  }

  /* ------------------------------------------------------------------
     11. WISHLIST LOGIC
     ------------------------------------------------------------------ */
  function toggleWishlist(id) {
    const idx = state.wishlist.indexOf(id);
    const product = findProduct(id);
    if (idx > -1) {
      state.wishlist.splice(idx, 1);
      showToast(`${product.name} removed from wishlist`);
    } else {
      state.wishlist.push(id);
      showToast(`${product.name} added to wishlist`);
      pulseBadge('wishlistBadge');
    }
    document.querySelectorAll(`.product-card[data-id="${id}"] .pc-wish`).forEach(btn => btn.classList.toggle('active'));
    saveWishlist();
    renderWishlist();
  }

  function renderWishlist() {
    const itemsEl = document.getElementById('wishlistItems');
    const emptyEl = document.getElementById('wishlistEmpty');
    const badge = document.getElementById('wishlistBadge');

    badge.textContent = state.wishlist.length;
    badge.classList.toggle('show', state.wishlist.length > 0);

    if (!state.wishlist.length) {
      itemsEl.innerHTML = '';
      emptyEl.classList.add('show');
      return;
    }
    emptyEl.classList.remove('show');

    itemsEl.innerHTML = state.wishlist.map(id => {
      const p = findProduct(id);
      return `
        <div class="cart-item" data-id="${p.id}">
          <div class="ci-thumb">${figureThumb()}</div>
          <div class="ci-info">
            <h4 class="ci-name">${p.name}</h4>
            <span class="ci-cat">${p.category}</span>
            <div class="ci-row">
              <span class="ci-price">${money(p.price)}</span>
              <button class="btn btn-ghost wl-move" style="padding:8px 14px;">Move to Cart</button>
            </div>
            <button class="ci-remove">Remove</button>
          </div>
        </div>
      `;
    }).join('');

    itemsEl.querySelectorAll('.cart-item').forEach(row => {
      const id = row.dataset.id;
      row.querySelector('.wl-move').addEventListener('click', () => { addToCart(id, 1); toggleWishlist(id); });
      row.querySelector('.ci-remove').addEventListener('click', () => toggleWishlist(id));
    });
  }

  function pulseBadge(id) {
    const badge = document.getElementById(id);
    badge.classList.remove('pulse');
    void badge.offsetWidth;
    badge.classList.add('pulse');
  }

  /* ------------------------------------------------------------------
     12. FLY-TO-CART ANIMATION
     ------------------------------------------------------------------ */
  function flyToCart(sourceEl) {
    const ghost = document.getElementById('flyGhost');
    const cartBtn = document.getElementById('cartBtn');
    const startRect = sourceEl.getBoundingClientRect();
    const endRect = cartBtn.getBoundingClientRect();

    ghost.style.transition = 'none';
    ghost.style.left = startRect.left + 'px';
    ghost.style.top = startRect.top + 'px';
    ghost.style.opacity = '1';
    ghost.classList.remove('flying');
    void ghost.offsetWidth;

    requestAnimationFrame(() => {
      ghost.classList.add('flying');
      ghost.style.left = endRect.left + 'px';
      ghost.style.top = endRect.top + 'px';
      ghost.style.transform = 'scale(0.2)';
      ghost.style.opacity = '0.3';
    });

    setTimeout(() => {
      ghost.style.opacity = '0';
      ghost.style.transform = 'scale(1)';
    }, 820);
  }

  /* ------------------------------------------------------------------
     13. TOAST
     ------------------------------------------------------------------ */
  let toastTimer = null;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  /* ------------------------------------------------------------------
     14. QUICK VIEW MODAL
     ------------------------------------------------------------------ */
  const qvOverlay = document.getElementById('quickViewOverlay');
  let qvQty = 1;

  function openQuickView(id) {
    const p = findProduct(id);
    state.quickViewId = id;
    qvQty = 1;
    document.getElementById('qvCategory').textContent = p.category;
    document.getElementById('qvName').textContent = p.name;
    document.getElementById('qvPrice').textContent = money(p.price);
    document.getElementById('qvDesc').textContent = p.desc;

   document.getElementById('qvImage').innerHTML = `
    <img
        src="${p.image}"
        alt="${p.name}"
        class="qv-main-image"
    >
`;

const thumbs = document.getElementById("qvThumbs");

thumbs.innerHTML = "";

(p.gallery || [p.image]).forEach((img, index) => {

    thumbs.innerHTML += `
        <img
            src="${img}"
            class="qv-thumb ${index===0 ? "active" : ""}"
            data-img="${img}"
        >
    `;

});

thumbs.querySelectorAll(".qv-thumb").forEach(thumb=>{

    thumb.addEventListener("click",()=>{

        document.querySelector(".qv-main-image").src = thumb.dataset.img;

        thumbs.querySelectorAll(".qv-thumb")
              .forEach(t=>t.classList.remove("active"));

        thumb.classList.add("active");

    });

});

    document.getElementById('qvEdition').innerHTML = `Numbered Edition<b>${p.edition} / ${p.total}</b>`;
    document.getElementById('qvQty').textContent = qvQty;
    qvOverlay.classList.add('open');
  }
  document.getElementById('quickViewClose').addEventListener('click', () => qvOverlay.classList.remove('open'));
  qvOverlay.addEventListener('click', (e) => { if (e.target === qvOverlay) qvOverlay.classList.remove('open'); });

  document.getElementById('qvQtyPlus').addEventListener('click', () => {
    const p = findProduct(state.quickViewId);
    if (qvQty < p.total) qvQty++;
    document.getElementById('qvQty').textContent = qvQty;
  });
  document.getElementById('qvQtyMinus').addEventListener('click', () => {
    if (qvQty > 1) qvQty--;
    document.getElementById('qvQty').textContent = qvQty;
  });
  document.getElementById('qvAddToCart').addEventListener('click', (e) => {
    addToCart(state.quickViewId, qvQty, e.currentTarget);
    qvOverlay.classList.remove('open');
  });
  document.getElementById('qvWishlist').addEventListener('click', () => toggleWishlist(state.quickViewId));
  document.getElementById('qvBuyNow').addEventListener('click', () => {
    localStorage.setItem('buyNowProduct', JSON.stringify({ id: state.quickViewId, qty: qvQty }));
    localStorage.setItem('checkoutType', 'buyNow');
    window.location.href = 'checkout.html';
  });

  /* ------------------------------------------------------------------
     15. AUTH MODAL (demo only — no data persisted or transmitted)
     ------------------------------------------------------------------ */
  const authOverlay = document.getElementById('authOverlay');
  document.getElementById('accountBtn').addEventListener('click', () => {
    if (state.loggedIn) openDashboard();
    else authOverlay.classList.add('open');
  });
  document.getElementById('authClose').addEventListener('click', () => authOverlay.classList.remove('open'));
  authOverlay.addEventListener('click', (e) => { if (e.target === authOverlay) authOverlay.classList.remove('open'); });

  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
    });
  });
  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    authOverlay.classList.remove('open');
    state.loggedIn = true;
    showToast('Logged in successfully');
  });
  document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    authOverlay.classList.remove('open');
    state.loggedIn = true;
    showToast('Account created — welcome to TOYNEXX');
  });
  document.getElementById('forgotLink').addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Password reset link sent (demo)');
  });

  /* ---- Account dashboard ---- */
  const dashboardOverlay = document.getElementById('dashboardOverlay');
  function openDashboard() {
    renderOrderHistory();
    renderDashWishlist();
    dashboardOverlay.classList.add('open');
  }
  document.getElementById('dashboardClose').addEventListener('click', () => dashboardOverlay.classList.remove('open'));
  dashboardOverlay.addEventListener('click', (e) => { if (e.target === dashboardOverlay) dashboardOverlay.classList.remove('open'); });
  document.querySelectorAll('.dash-tab[data-dtab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.dash-tab[data-dtab]').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('dash' + tab.dataset.dtab[0].toUpperCase() + tab.dataset.dtab.slice(1)).classList.add('active');
    });
  });
  document.getElementById('logoutBtn').addEventListener('click', () => {
    state.loggedIn = false;
    dashboardOverlay.classList.remove('open');
    showToast('Logged out');
  });

  function renderOrderHistory() {
    const el = document.getElementById('orderHistoryList');
    if (!state.orders.length) { el.innerHTML = '<p class="oh-empty">No orders yet — your collection starts here.</p>'; return; }
    el.innerHTML = state.orders.map(o => `
      <div class="oh-row">
        <span class="oh-id">${o.id}</span>
        <span>${o.items.length} item${o.items.length > 1 ? 's' : ''}</span>
        <span>${money(o.total)}</span>
        <span class="oh-status">${o.status}</span>
      </div>
    `).join('');
  }

  function renderDashWishlist() {
    const el = document.getElementById('dashWishlistList');
    if (!state.wishlist.length) { el.innerHTML = '<p class="oh-empty">Your wishlist is empty.</p>'; return; }
    el.innerHTML = state.wishlist.map(id => {
      const p = findProduct(id);
      return `<div class="oh-row"><span>${p.name}</span><span>${money(p.price)}</span></div>`;
    }).join('');
  }

  /* ------------------------------------------------------------------
     16. CHECKOUT FLOW

     BUG FIX: this used to open a fake in-page "Place Order" modal
     that never charged anyone and never talked to Razorpay. The
     site now has one single, real checkout (checkout.html) that
     takes actual payments. Clicking "Checkout" here sends the
     shopper there with their cart, exactly like cart.html does.
     ------------------------------------------------------------------ */
  function goToCheckout() {
    if (!state.cart.length) { showToast('Your cart is empty'); return; }
    localStorage.setItem('checkoutType', 'cart');
    window.location.href = 'checkout.html';
  }
  document.getElementById('checkoutBtn').addEventListener('click', goToCheckout);

  /* ------------------------------------------------------------------
     17. NEWSLETTER (demo submit)
     ------------------------------------------------------------------ */
  document.getElementById('newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('newsletterNote').textContent = "You're on the list — watch your inbox.";
    e.target.reset();
  });

  /* ------------------------------------------------------------------
     18. COUNTDOWN TIMER (limited drop)
     ------------------------------------------------------------------ */
  function startCountdown() {
    const end = Date.now() + (1000 * 60 * 60 * 11) + (1000 * 60 * 42); // demo: ~11h42m from load
    function tick() {
      const diff = Math.max(0, end - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      document.getElementById('cdH').textContent = String(h).padStart(2, '0');
      document.getElementById('cdM').textContent = String(m).padStart(2, '0');
      document.getElementById('cdS').textContent = String(s).padStart(2, '0');
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ------------------------------------------------------------------
     19. HERO PARALLAX ON POINTER MOVE
     ------------------------------------------------------------------ */
  function initHeroParallax() {
    const heroFigures = document.getElementById('heroFigures');
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.querySelector('.hero').addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      heroFigures.style.transform = `translate(${x * -10}px, ${y * -8}px)`;
    });
  }

  /* ------------------------------------------------------------------
     20. ADMIN PANEL (demo — in-memory CRUD, no backend)
     ------------------------------------------------------------------ */
  const adminOverlay = document.getElementById('adminOverlay');
  document.getElementById('adminLink').addEventListener('click', (e) => {
    e.preventDefault();
    adminOverlay.classList.add('open');
    renderAdminProducts();
    renderAdminOrders();
    renderAdminStats();
  });
  document.getElementById('adminBack').addEventListener('click', () => adminOverlay.classList.remove('open'));

  document.querySelectorAll('.admin-nav-btn[data-apanel]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-btn[data-apanel]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('apanel-' + btn.dataset.apanel).classList.add('active');
    });
  });

  function renderAdminStats() {
    const revenue = state.orders.reduce((s, o) => s + o.total, 0);
    document.getElementById('statRevenue').textContent = money(revenue);
    document.getElementById('statOrders').textContent = state.orders.length;
    document.getElementById('statProducts').textContent = PRODUCTS.length;
  }

  function renderAdminProducts() {
    const body = document.getElementById('adminProductBody');
    body.innerHTML = PRODUCTS.map(p => `
      <tr data-id="${p.id}">
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${money(p.price)}</td>
        <td>${p.edition}/${p.total}</td>
        <td><button class="row-del">Delete</button></td>
      </tr>
    `).join('');
    body.querySelectorAll('.row-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('tr').dataset.id;
        const idx = PRODUCTS.findIndex(p => p.id === id);
        if (idx > -1) PRODUCTS.splice(idx, 1);
        renderAdminProducts();
        renderAdminStats();
        applyFilter();
        showToast('Product removed from catalog');
      });
    });
  }

  function renderAdminOrders() {
    const body = document.getElementById('adminOrderBody');
    if (!state.orders.length) {
      body.innerHTML = `<tr><td colspan="4" style="color:var(--steel);">No orders placed yet.</td></tr>`;
      return;
    }
    body.innerHTML = state.orders.map(o => `
      <tr><td>${o.id}</td><td>${o.items.map(i => i.name + ' x' + i.qty).join(', ')}</td><td>${money(o.total)}</td><td>${o.status}</td></tr>
    `).join('');
  }

  document.getElementById('adminAddProduct').addEventListener('click', () => {
    const n = PRODUCTS.length + 1;
    const id = 'p' + String(n).padStart(2, '0') + '-' + Date.now().toString().slice(-4);
    PRODUCTS.push({
      id, name: 'New Collectible ' + n, category: 'Anime Legends', price: 4999, oldPrice: null,
      edition: 1, total: 500, tag: 'New', rating: 4.0, sold: 0, added: 0,
      desc: 'A newly added collectible awaiting a full description.'
    });
    renderAdminProducts();
    renderAdminStats();
    applyFilter();
    showToast('Product added to catalog');
  });

  /* ------------------------------------------------------------------
     20b. INIT
     ------------------------------------------------------------------ */
  function init() {
    document.getElementById('year').textContent = new Date().getFullYear();
    renderCategories();
    renderCategoryStrip();
    applyFilter();
    renderCart();
    renderWishlist();
    startCountdown();
    initHeroParallax();    observeReveals();

    window.addEventListener('load', () => {
      setTimeout(() => document.getElementById('preloader').classList.add('done'), 400);
    });
  }

  init();
})();

/* ===========================
   Galaxy Stars
=========================== */

const stars = document.getElementById("stars");

for(let i=0;i<120;i++){

const star=document.createElement("span");

star.classList.add("star");

const r=Math.random();

if(r>0.8){

star.classList.add("big");

}
else if(r>0.55){

star.classList.add("medium");

}

star.style.left=Math.random()*100+"%";

star.style.top=Math.random()*100+"%";

star.style.animationDuration=(6+Math.random()*8)+"s";

star.style.animationDelay=Math.random()*6+"s";

stars.appendChild(star);

}