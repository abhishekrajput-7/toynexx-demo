 window.PRODUCTS = [

   {
    id: "dbz001",

    name: "Goku Super Saiyan 2 with White Stand Action Figure",

    category: "Anime Legends",

    price: 499,

    oldPrice: null,

    edition: 1,

    total: 100,

    tag: "New",

    rating: 5,

    sold: 0,

    added: 12,

    image: "Images/Dragon Ball Z/goku-ssj2-white-stand-1.png",

    gallery: [
    "Images/Dragon Ball Z/goku-ssj2-white-stand-1.png",
    "Images/Dragon Ball Z/goku-ssj2-white-stand-2.png",
    "Images/Dragon Ball Z/goku-ssj2-white-stand-3.png",
    "Images/Dragon Ball Z/goku-ssj2-white-stand-4.png",
    "Images/Dragon Ball Z/goku-ssj2-white-stand-5.png",
    "Images/Dragon Ball Z/goku-ssj2-white-stand-6.png"
    ],

   desc: "Premium Dragon Ball Z Goku Super Saiyan 2 action figure with white display stand.",

longDesc:
"Official Dragon Ball Z collectible made with premium PVC material. Features anime-accurate sculpting, vibrant paintwork, durable finish, and a premium display stand. Perfect for collectors and anime fans.",

reviews: 128,

stock: 24,

badge: "Limited Edition",

discount: 0

},



    { id: 'p02', name: 'Void Ronin',        category: 'Anime Legends',   price: 5299, oldPrice: null, edition: 112, total: 800, tag: null,        rating: 4.3, sold: 540,  added: 9,  desc: 'A lone blade-wielder frozen in a decisive stance, finished with a weathered steel palette.' },
    { id: 'p03', name: 'Iron Marshal',      category: 'Superhero Icons', price: 8999, oldPrice: null, edition: 9,   total: 250, tag: 'Bestseller',rating: 4.9, sold: 890,  added: 3,  desc: 'Heavy-plated armor sculpt with articulated joints and illuminated chest core detailing.' },
    { id: 'p04', name: 'Solar Guardian',    category: 'Anime Legends',   price: 4799, oldPrice: 5499, edition: 233, total: 1000,tag: 'Sale',      rating: 4.1, sold: 610,  added: 11, desc: 'Radiant energy aura base included. A fan-favorite pose recreated in premium PVC.' },
    { id: 'p05', name: 'Titan Breaker MK-7',category: 'Mecha Series',    price: 11999,oldPrice: null, edition: 3,   total: 150, tag: 'Limited',   rating: 4.8, sold: 140,  added: 1,  desc: 'Full diecast mecha frame with swappable weapon arms and LED eye module.' },
    { id: 'p06', name: 'Shadow Ninetails',  category: 'Anime Legends',   price: 5999, oldPrice: null, edition: 66,  total: 600, tag: null,        rating: 4.4, sold: 410,  added: 8,  desc: 'Nine-tail sculpt with translucent resin effects, mounted on a lacquered display base.' },
    { id: 'p07', name: 'Thunder Fist',      category: 'Superhero Icons', price: 7299, oldPrice: null, edition: 21,  total: 400, tag: null,        rating: 4.2, sold: 260,  added: 7,  desc: 'Dynamic impact pose capturing peak kinetic energy, finished in a satin-matte coat.' },
    { id: 'p08', name: 'Phantom Blade',     category: 'Limited Edition', price: 13499,oldPrice: 15999,edition: 2,   total: 100, tag: 'Vault',     rating: 5.0, sold: 98,   added: 2,  desc: 'Vault-exclusive sculpt with a numbered brass certificate plate and velvet display case.' },
    { id: 'p09', name: 'Storm King',        category: 'Mecha Series',    price: 9499, oldPrice: null, edition: 58,  total: 300, tag: null,        rating: 4.5, sold: 205,  added: 6,  desc: 'Storm-forged armor plating with hand-weathered detailing across every panel.' },
    { id: 'p10', name: 'Neon Reaper',       category: 'Anime Legends',   price: 6299, oldPrice: null, edition: 140, total: 700, tag: 'New',       rating: 4.0, sold: 470,  added: 13, desc: 'Cel-shaded paint technique brings the signature neon-edge style to life on the shelf.' },
    { id: 'p11', name: 'Ashfall Vanguard',  category: 'Superhero Icons', price: 8299, oldPrice: null, edition: 34,  total: 350, tag: null,        rating: 4.3, sold: 190,  added: 5,  desc: 'Battle-worn cape sculpt with fabric-textured resin finish and dynamic wind physics.' },
    { id: 'p12', name: 'Obsidian Wraith',   category: 'Limited Edition', price: 15999,oldPrice: null, edition: 1,   total: 50,  tag: 'Vault',     rating: 4.95,sold: 50,   added: 4,  desc: 'The rarest cast in the vault line. One-of-fifty, individually hand-signed by the sculptor.' }
  ];

  /* ============================================================
     NORMALIZE PRODUCTS

     BUG FIX: only the first product ("dbz001") had an image,
     gallery, stock, badge, longDesc and reviews count set.
     Every other product was missing these fields, which caused
     broken/blank images and "In Stock (0 left)" everywhere else
     on the site. This fills in safe defaults for any product
     that doesn't already define them, without touching the
     real data you already set.
     ============================================================ */

  window.PRODUCTS = window.PRODUCTS.map(function (p) {

      const placeholderImage =
          "https://placehold.co/700x700/141414/ffb703?text=" +
          encodeURIComponent(p.name || "TOYNEXX");

      const defaults = {
          oldPrice: null,
          tag: null,
          rating: 4.5,
          sold: 0,
          added: 1,
          reviews: 24,
          stock: 50,
          badge: "Premium",
          discount: 0,
          image: placeholderImage,
          gallery: [placeholderImage],
          longDesc: p.desc
      };

      const merged = Object.assign({}, defaults, p);

      // If a product only sets "image" but not "gallery",
      // make sure the gallery still shows that real image.
      if (!merged.gallery || !merged.gallery.length) {
          merged.gallery = [merged.image];
      }

      return merged;
  });