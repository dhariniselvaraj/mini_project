/* SURYA TRADERS - single source of truth for the product catalogue.
   Add, rename or hide a product here and every page updates.
   Optional fields (only add them when they are real business data):
     unit  : e.g. "kg"                       -> shown in the product details
     price : { amount: 123, per: "kg" }      -> shown in details + calculator estimate
   `active: false` hides a product everywhere. */
(function(){
  'use strict';

  window.SURYA_CATEGORIES = [
    { id: 'dry-fruits', label: 'Dry Fruits', page: 'dry-fruits.html' },
    { id: 'seeds',      label: 'Seeds',      page: 'seeds.html' },
    { id: 'spices',     label: 'Spices',     page: 'spices.html' }
  ];

  var PEXELS = function(id, w){ return 'https://images.pexels.com/photos/' + id + '/pexels-photo-' + id + '.jpeg?auto=compress&cs=tinysrgb&w=' + (w || 600); };

  window.SURYA_PRODUCTS = [
    /* ---- Dry Fruits ---- */
    { id: 'almonds',    name: 'Almonds',          categories: ['dry-fruits'], image: PEXELS(57042),    alt: 'Premium whole almonds',      description: 'Premium quality whole almonds, rich in flavour and nutrition.', active: true },
    { id: 'cashews',    name: 'Cashews',          categories: ['dry-fruits'], image: PEXELS(18876239), alt: 'Premium whole cashew nuts',  description: 'Creamy, whole cashew nuts sourced for freshness and taste.', active: true },
    { id: 'pistachios', name: 'Pistachios',       categories: ['dry-fruits'], image: PEXELS(1799307),  alt: 'Roasted pistachios',         description: 'Roasted pistachios with a distinctive, satisfying crunch.', active: true },
    { id: 'walnuts',    name: 'Walnuts',          categories: ['dry-fruits'], image: PEXELS(32107065), alt: 'Fresh walnut halves',        description: 'Fresh walnut halves, a wholesome everyday snacking choice.', active: true },
    { id: 'raisins',    name: 'Raisins',          categories: ['dry-fruits'], image: PEXELS(6085951),  alt: 'Sun-dried raisins',          description: 'Naturally sweet, sun-dried raisins for cooking and snacking.', active: true },
    { id: 'dates',      name: 'Dates',            categories: ['dry-fruits'], image: PEXELS(17923889), alt: 'Soft dates',                 description: 'Soft, delicious dates \u2014 a natural source of energy.', active: true },
    { id: 'figs',       name: 'Figs (Anjeer)',    categories: ['dry-fruits'], image: PEXELS(17743620), alt: 'Dried figs (anjeer)',        description: 'Premium dried figs, prized for their taste and health benefits.', active: true },
    { id: 'mixed-dry-fruits', name: 'Mixed Dry Fruits', categories: ['dry-fruits'], image: PEXELS(7412090), alt: 'Assorted mixed dry fruits', description: 'A hand-picked assortment of our finest dry fruits in one pack.', active: true },
    { id: 'apricot',    name: 'Apricot',          categories: ['dry-fruits'], image: PEXELS(10111994), alt: 'Dried apricots',             description: 'Naturally sweet dried apricots, rich in flavour and nutrients.', active: true },

    /* ---- Seeds ---- */
    { id: 'chia-seeds',      name: 'Chia Seeds',          categories: ['seeds'], image: PEXELS(5988042),  alt: 'Chia seeds',                  description: 'Tiny nutrient-dense seeds, perfect for smoothies and healthy diets.', active: true },
    { id: 'flax-seeds',      name: 'Flax Seeds',          categories: ['seeds'], image: PEXELS(9974505),  alt: 'Flax seeds',                  description: 'Rich in omega-3 and fibre, great for daily wellness.', active: true },
    { id: 'sunflower-seeds', name: 'Sunflower Seeds',     categories: ['seeds'], image: PEXELS(10111951), alt: 'Sunflower seeds',             description: 'Crunchy roasted sunflower seeds, packed with nutrition.', active: true },
    { id: 'pumpkin-seeds',   name: 'Pumpkin Seeds',       categories: ['seeds'], image: PEXELS(4753633),  alt: 'Pumpkin seeds',               description: 'Wholesome pumpkin seeds, a favourite healthy snacking option.', active: true },
    { id: 'sesame-seeds',    name: 'Sesame Seeds',        categories: ['seeds'], image: PEXELS(8951049),  alt: 'Sesame seeds',                description: 'Fine quality sesame seeds for cooking, baking and garnishing.', active: true },
    { id: 'watermelon-seeds',name: 'Watermelon Seeds',    categories: ['seeds'], image: PEXELS(4869139),  alt: 'Watermelon seeds (magaz)',    description: 'Nutritious watermelon seeds (magaz), popular in Indian snacking.', active: true },
    { id: 'basil-seeds',     name: 'Basil Seeds (Sabja)', categories: ['seeds'], image: 'images/basil.png', alt: 'Basil seeds (sabja)',       description: 'Cooling sabja seeds that swell in water, loved in falooda and summer drinks.', active: true },
    { id: 'hemp-seeds',      name: 'Hemp Seeds',          categories: ['seeds'], image: 'images/hemp.jpg',  alt: 'Hulled hemp seeds',         description: 'Soft, nutty hulled hemp seeds rich in plant protein and healthy fats.', active: true },
    { id: 'quinoa',          name: 'Quinoa',              categories: ['seeds'], image: 'images/quinoa.jpg',alt: 'Quinoa grains',             description: 'Gluten-free, protein-rich quinoa grains for salads, bowls and porridge.', active: true },
    { id: 'poppy-seeds',     name: 'Poppy Seeds',         categories: ['seeds'], image: 'images/poppy.jpg', alt: 'Poppy seeds',               description: 'Fine, nutty poppy seeds for curries, gravies, sweets and baking.', active: true },
    /* Mustard seeds are listed under both Seeds and Spices (as on the original pages) */
    { id: 'mustard-seeds',   name: 'Mustard Seeds',       categories: ['seeds', 'spices'], image: PEXELS(12992319), alt: 'Mustard seeds',   description: 'Essential tempering seeds with a distinctive pungent flavour.', active: true },

    /* ---- Spices ---- */
    { id: 'star-anise',      name: 'Star Anise',      categories: ['spices'], image: 'https://burst.shopifycdn.com/photos/macro-photo-of-star-anise.jpg?width=600&format=pjpg&exif=0&iptc=0', alt: 'Star anise pods', description: 'Star-shaped pods with a sweet, liquorice-like aroma for biryani and masala.', active: true },
    { id: 'bay-leaves',      name: 'Bay Leaves',      categories: ['spices'], image: 'images/bayleaves.jpg', alt: 'Dried bay leaves',     description: 'Dried, fragrant bay leaves that add depth to rice, curries and stews.', active: true },
    { id: 'saffron',         name: 'Saffron',         categories: ['spices'], image: 'images/saffron.jpg',   alt: 'Saffron threads',      description: 'Premium saffron threads for rich colour, aroma and festive dishes.', active: true },
    { id: 'cumin',           name: 'Cumin',           categories: ['spices'], image: 'images/cumin.png',     alt: 'Whole cumin seeds',    description: 'Warm, earthy whole cumin seeds, essential for tempering and spice blends.', active: true },
    { id: 'fennel',          name: 'Fennel',          categories: ['spices'], image: 'images/fennel.jpg',    alt: 'Fennel seeds',         description: 'Sweet, cooling fennel seeds for cooking and as a natural mouth freshener.', active: true },
    { id: 'cloves',          name: 'Cloves',          categories: ['spices'], image: 'images/cloves.jpg',    alt: 'Whole cloves',         description: 'Intensely aromatic whole cloves for biryani, chai and garam masala.', active: true },
    { id: 'black-pepper',    name: 'Black Pepper',    categories: ['spices'], image: PEXELS(2294291),  alt: 'Whole black peppercorns', description: 'Whole black peppercorns with a bold, warming aroma.', active: true },
    { id: 'cardamom',        name: 'Cardamom',        categories: ['spices'], image: PEXELS(6086300),  alt: 'Green cardamom pods',     description: 'Fragrant green cardamom, a staple in teas, sweets and curries.', active: true },
    { id: 'cinnamon-sticks', name: 'Cinnamon Sticks', categories: ['spices'], image: PEXELS(5475177),  alt: 'Cinnamon sticks',         description: 'Naturally sweet, aromatic cinnamon sticks for cooking and chai.', active: true },
    { id: 'coriander-seeds', name: 'Coriander Seeds', categories: ['spices'], image: PEXELS(10487771), alt: 'Whole coriander seeds',   description: 'Whole coriander seeds, a foundational spice for Indian masalas.', active: true }
  ];
})();
