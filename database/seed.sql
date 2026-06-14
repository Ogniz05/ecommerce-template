-- ============================================
-- ECOMMERCE TEMPLATE - SEED DATA
-- 50 products, 3 warehouses, sample users
-- ============================================
USE ecommerce_template;

-- Admin User (password: Admin@123456)
INSERT INTO users (email, password, first_name, last_name, role, is_verified, is_active) VALUES
('admin@yourcompany.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewrT9zHnHFHGRqOm', 'Admin', 'User', 'admin', 1, 1),
('mario@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewrT9zHnHFHGRqOm', 'Mario', 'Rossi', 'customer', 1, 1),
('giulia@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewrT9zHnHFHGRqOm', 'Giulia', 'Ferrari', 'customer', 1, 1),
('luca@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewrT9zHnHFHGRqOm', 'Luca', 'Bianchi', 'customer', 1, 1);

-- Categories
INSERT INTO categories (name, name_en, description, description_en, slug, sort_order) VALUES
('Abbigliamento', 'Clothing', 'Capi di abbigliamento di alta qualità', 'High quality clothing items', 'abbigliamento', 1),
('Scarpe', 'Shoes', 'Calzature per ogni occasione', 'Footwear for every occasion', 'scarpe', 2),
('Accessori', 'Accessories', 'Accessori moda e lifestyle', 'Fashion and lifestyle accessories', 'accessori', 3),
('Tecnologia', 'Technology', 'Gadget e dispositivi tech', 'Tech gadgets and devices', 'tecnologia', 4),
('Casa & Arredo', 'Home & Decor', 'Articoli per la casa', 'Home furnishing items', 'casa-arredo', 5),
('Sport & Fitness', 'Sport & Fitness', 'Attrezzature e abbigliamento sportivo', 'Sports equipment and clothing', 'sport-fitness', 6),
('Bellezza & Cura', 'Beauty & Care', 'Prodotti per la cura personale', 'Personal care products', 'bellezza-cura', 7),
('Libri & Arte', 'Books & Art', 'Libri, arte e cultura', 'Books, art and culture', 'libri-arte', 8);

-- Subcategories
INSERT INTO categories (name, name_en, parent_id, slug, sort_order) VALUES
('T-Shirt', 'T-Shirts', 1, 't-shirt', 1),
('Felpe', 'Hoodies', 1, 'felpe', 2),
('Pantaloni', 'Pants', 1, 'pantaloni', 3),
('Sneakers', 'Sneakers', 2, 'sneakers', 1),
('Borse', 'Bags', 3, 'borse', 1),
('Orologi', 'Watches', 3, 'orologi', 2),
('Smartphone', 'Smartphones', 4, 'smartphone', 1),
('Cuffie', 'Headphones', 4, 'cuffie', 2);

-- Warehouses
INSERT INTO warehouses (name, code, address, city, postal_code, country, is_default) VALUES
('Magazzino Principale - Milano', 'MIL-01', 'Via della Logistica 45', 'Milano', '20100', 'IT', 1),
('Magazzino Sud - Roma', 'ROM-01', 'Via del Commercio 12', 'Roma', '00100', 'IT', 0),
('Magazzino Nord - Torino', 'TOR-01', 'Corso Industria 78', 'Torino', '10100', 'IT', 0);

-- Shipping Methods
INSERT INTO shipping_methods (name, name_en, description, price, free_above, estimated_days_min, estimated_days_max, sort_order) VALUES
('Spedizione Standard', 'Standard Shipping', 'Consegna in 3-5 giorni lavorativi', 4.99, 49.00, 3, 5, 1),
('Spedizione Express', 'Express Shipping', 'Consegna in 1-2 giorni lavorativi', 9.99, 99.00, 1, 2, 2),
('Corriere Prioritario', 'Priority Courier', 'Consegna il giorno successivo', 14.99, NULL, 1, 1, 3),
('Ritiro in Negozio', 'Store Pickup', 'Ritira gratuitamente nel nostro negozio', 0.00, NULL, 0, 0, 4);

-- Coupons
INSERT INTO coupons (code, description, discount_type, discount_value, minimum_order, max_uses, valid_until) VALUES
('WELCOME10', 'Sconto benvenuto 10%', 'percentage', 10.00, 0.00, 500, DATE_ADD(NOW(), INTERVAL 1 YEAR)),
('SAVE20', 'Risparmia 20% su ordini sopra 100€', 'percentage', 20.00, 100.00, 200, DATE_ADD(NOW(), INTERVAL 6 MONTH)),
('FLAT15', 'Sconto fisso 15€', 'fixed', 15.00, 50.00, 100, DATE_ADD(NOW(), INTERVAL 3 MONTH)),
('SUMMER25', 'Offerta estate 25%', 'percentage', 25.00, 75.00, 150, DATE_ADD(NOW(), INTERVAL 2 MONTH));

-- Settings
INSERT INTO settings (`key`, `value`, `type`, `group_name`) VALUES
('store_name', 'YOUR NAME Store', 'string', 'general'),
('store_email', 'info@yourcompany.com', 'string', 'general'),
('store_phone', '+39 02 1234567', 'string', 'general'),
('store_address', 'Via Roma 1, 20100 Milano, Italia', 'string', 'general'),
('currency', 'EUR', 'string', 'general'),
('currency_symbol', '€', 'string', 'general'),
('tax_rate', '22', 'number', 'tax'),
('tax_included', 'true', 'boolean', 'tax'),
('vat_number', 'IT12345678901', 'string', 'tax'),
('free_shipping_above', '49', 'number', 'shipping'),
('maintenance_mode', 'false', 'boolean', 'system');

-- Products (50 products with varied categories)
INSERT INTO products (name, name_en, slug, description, description_en, short_description, short_description_en, price, compare_price, category_id, image_url, is_featured, sku, avg_rating, review_count) VALUES
-- Abbigliamento (Cat 1 & subcats)
('T-Shirt Premium Fucsia', 'Premium Fuchsia T-Shirt', 'tshirt-premium-fucsia', 'T-shirt premium in cotone 100% pettinato con logo YOUR NAME ricamato. Vestibilità regolare, perfetta per ogni occasione casual.', 'Premium 100% combed cotton t-shirt with embroidered YOUR NAME logo. Regular fit, perfect for any casual occasion.', 'T-shirt 100% cotone premium, logo ricamato', '100% premium cotton t-shirt, embroidered logo', 29.99, 39.99, 9, 'https://picsum.photos/seed/prod1/600/600', TRUE, 'TSH-PRE-FUC-001', 4.5, 23),
('Felpa con Cappuccio Urban', 'Urban Hoodie', 'felpa-cappuccio-urban', 'Felpa con cappuccio in cotone garzato pesante 380g. Tasca kanguro, coulisse regolabile, polsini elasticizzati. Disponibile in taglia S-XXL.', 'Heavy brushed cotton hoodie 380g. Kangaroo pocket, adjustable drawstring, elasticated cuffs. Available in sizes S-XXL.', 'Felpa pesante 380g con cappuccio', 'Heavy 380g hoodie', 59.99, 79.99, 10, 'https://picsum.photos/seed/prod2/600/600', TRUE, 'FEL-URB-001', 4.7, 45),
('Pantaloni Jogger Eleganti', 'Elegant Jogger Pants', 'pantaloni-jogger-eleganti', 'Pantaloni jogger in tessuto tecnico stretch. Vestibilità slim, elastico in vita con coulisse, tasche laterali e posteriori.', 'Stretch technical fabric jogger pants. Slim fit, elastic waistband with drawstring, side and back pockets.', 'Jogger stretch slim fit', 'Slim fit stretch jogger', 49.99, 65.00, 11, 'https://picsum.photos/seed/prod3/600/600', FALSE, 'PAN-JOG-ELE-001', 4.3, 18),
('Giacca Bomber Premium', 'Premium Bomber Jacket', 'giacca-bomber-premium', 'Giacca bomber in nylon resistente con fodera in pile. Chiusura lampo principale, tasche laterali con zip, maniche regolabili.', 'Resistant nylon bomber jacket with fleece lining. Main zip closure, zip side pockets, adjustable sleeves.', 'Bomber nylon con fodera pile', 'Nylon bomber with fleece lining', 89.99, 129.99, 1, 'https://picsum.photos/seed/prod4/600/600', TRUE, 'GIA-BOM-PRE-001', 4.8, 67),
('Camicia Oxford Classica', 'Classic Oxford Shirt', 'camicia-oxford-classica', 'Camicia in tessuto Oxford 100% cotone. Colletto classico, polsini con bottoni, vestibilità regular. Lavaggio in lavatrice a 40°.', 'Oxford fabric 100% cotton shirt. Classic collar, button cuffs, regular fit. Machine washable at 40°.', 'Camicia Oxford 100% cotone', '100% cotton Oxford shirt', 44.99, 59.99, 1, 'https://picsum.photos/seed/prod5/600/600', FALSE, 'CAM-OXF-CLA-001', 4.2, 31),

-- Scarpe (Cat 2 & subcats)
('Sneakers Runner Pro', 'Runner Pro Sneakers', 'sneakers-runner-pro', 'Sneakers da running con suola in gomma EVA ammortizzante. Upper in mesh traspirante, tomaia rinforzata, soletta estraibile.', 'Running sneakers with EVA rubber sole. Breathable mesh upper, reinforced toecap, removable insole.', 'Sneakers running suola EVA', 'Running sneakers EVA sole', 79.99, 99.99, 12, 'https://picsum.photos/seed/prod6/600/600', TRUE, 'SNE-RUN-PRO-001', 4.6, 89),
('Stivali Chelsea Vintage', 'Vintage Chelsea Boots', 'stivali-chelsea-vintage', 'Stivali Chelsea in vera pelle bovina con elastici laterali. Suola in gomma antiscivolo, punta arrotondata, altezza caviglia.', 'Chelsea boots in genuine cowhide with side elastics. Non-slip rubber sole, rounded toe, ankle height.', 'Chelsea boots vera pelle', 'Genuine leather Chelsea boots', 139.99, 180.00, 2, 'https://picsum.photos/seed/prod7/600/600', TRUE, 'STI-CHE-VIN-001', 4.4, 42),
('Sandali Estivi Comfort', 'Summer Comfort Sandals', 'sandali-estivi-comfort', 'Sandali estivi in pelle sintetica con suola in gomma EVA. Regolazione con velcro, plantare anatomico, resistente allacqua.', 'Synthetic leather summer sandals with EVA rubber sole. Velcro adjustment, anatomical footbed, water resistant.', 'Sandali estivi pelle sintetica', 'Synthetic leather summer sandals', 39.99, 55.00, 2, 'https://picsum.photos/seed/prod8/600/600', FALSE, 'SAN-EST-COM-001', 4.1, 27),
('Mocassini in Pelle', 'Leather Loafers', 'mocassini-pelle', 'Mocassini classici in pelle pieno fiore conciata al vegetale. Suola in cuoio, fodera in pelle, fabbricazione artigianale italiana.', 'Classic full-grain vegetable-tanned leather loafers. Leather sole, leather lining, Italian artisan craftsmanship.', 'Mocassini artigianali italiani', 'Italian artisan loafers', 119.99, 155.00, 2, 'https://picsum.photos/seed/prod9/600/600', FALSE, 'MOC-PEL-001', 4.7, 53),
('Scarpe da Ginnastica Classic', 'Classic Gym Shoes', 'scarpe-ginnastica-classic', 'Scarpe da ginnastica stile retro con upper in tela vulcanizzata. Suola in gomma piatta, punta rinforzata, linguetta imbottita.', 'Retro style gym shoes with vulcanized canvas upper. Flat rubber sole, reinforced toe, padded tongue.', 'Ginnastica canvas vulcanizzata', 'Vulcanized canvas gym shoes', 59.99, 74.99, 12, 'https://picsum.photos/seed/prod10/600/600', FALSE, 'GIN-CLA-001', 4.3, 38),

-- Accessori (Cat 3 & subcats)
('Borsa Tote in Canvas', 'Canvas Tote Bag', 'borsa-tote-canvas', 'Borsa tote in canvas resistente con manici in pelle vera. Tasca interna con zip, fondo rinforzato, capacità 20 litri.', 'Resistant canvas tote bag with genuine leather handles. Internal zip pocket, reinforced bottom, 20 litre capacity.', 'Tote canvas con manici in pelle', 'Canvas tote with leather handles', 49.99, 65.00, 13, 'https://picsum.photos/seed/prod11/600/600', TRUE, 'BOR-TOT-CAN-001', 4.5, 76),
('Zaino Urban Explorer', 'Urban Explorer Backpack', 'zaino-urban-explorer', 'Zaino urban in nylon ripstop con scomparto laptop fino a 15.6". Tasca frontale organizzata, imbragatura ergonomica, volume 25L.', 'Urban ripstop nylon backpack with laptop compartment up to 15.6". Organized front pocket, ergonomic harness, 25L volume.', 'Zaino nylon 25L con tasca laptop', 'Nylon 25L backpack with laptop pocket', 79.99, 100.00, 13, 'https://picsum.photos/seed/prod12/600/600', TRUE, 'ZAI-URB-EXP-001', 4.6, 92),
('Orologio Minimalista Nero', 'Black Minimalist Watch', 'orologio-minimalista-nero', 'Orologio con cassa in acciaio inox 316L, quadrante nero sunray, cinturino in pelle italiana. Movimento giapponese Miyota. Water resistant 5ATM.', 'Watch with 316L stainless steel case, black sunray dial, Italian leather strap. Japanese Miyota movement. Water resistant 5ATM.', 'Orologio acciaio movimento giapponese', 'Steel watch Japanese movement', 149.99, 199.99, 14, 'https://picsum.photos/seed/prod13/600/600', TRUE, 'ORL-MIN-NER-001', 4.8, 134),
('Portafoglio Slim in Pelle', 'Slim Leather Wallet', 'portafoglio-slim-pelle', 'Portafoglio sottile in pelle bovina conciata al vegetale. 8 tasche carte, scomparto banconote, slot SIM/SD, RFID blocking.', 'Slim wallet in vegetable-tanned cowhide. 8 card slots, banknote compartment, SIM/SD slot, RFID blocking.', 'Portafoglio pelle RFID blocking', 'Leather wallet RFID blocking', 35.99, 49.99, 3, 'https://picsum.photos/seed/prod14/600/600', FALSE, 'POR-SLI-PEL-001', 4.4, 58),
('Cintura in Pelle Nera', 'Black Leather Belt', 'cintura-pelle-nera', 'Cintura in pelle pieno fiore di prima scelta. Fibbia in acciaio inox lucido, larghezza 35mm, lunghezze da 90 a 120cm.', 'Full-grain first-choice leather belt. Polished stainless steel buckle, 35mm width, lengths from 90 to 120cm.', 'Cintura pelle pieno fiore 35mm', 'Full-grain leather belt 35mm', 44.99, 59.99, 3, 'https://picsum.photos/seed/prod15/600/600', FALSE, 'CIN-PEL-NER-001', 4.3, 29),

-- Tecnologia (Cat 4 & subcats)
('Cuffie Wireless Pro', 'Pro Wireless Headphones', 'cuffie-wireless-pro', 'Cuffie over-ear con cancellazione attiva del rumore ANC. Driver da 40mm, batteria 40 ore, ricarica rapida USB-C, pieghevoli.', 'Over-ear headphones with active noise cancellation ANC. 40mm drivers, 40-hour battery, fast USB-C charging, foldable.', 'Cuffie ANC 40h batteria USB-C', 'ANC headphones 40h battery USB-C', 129.99, 179.99, 16, 'https://picsum.photos/seed/prod16/600/600', TRUE, 'CUF-WIR-PRO-001', 4.7, 187),
('Speaker Bluetooth Waterproof', 'Waterproof Bluetooth Speaker', 'speaker-bluetooth-waterproof', 'Speaker portatile impermeabile IPX7. Batteria 24 ore, True Wireless Stereo, frequenza 60-20000Hz, ricarica USB-C.', 'IPX7 waterproof portable speaker. 24-hour battery, True Wireless Stereo, 60-20000Hz frequency, USB-C charging.', 'Speaker IPX7 24h TWS', 'IPX7 speaker 24h TWS', 69.99, 89.99, 4, 'https://picsum.photos/seed/prod17/600/600', FALSE, 'SPE-BLU-WAT-001', 4.4, 93),
('Smart Watch Fitness', 'Fitness Smart Watch', 'smartwatch-fitness', 'Smartwatch con monitoraggio salute completo: frequenza cardiaca, SpO2, stress, sonno. GPS integrato, 5ATM, autonomia 14 giorni.', 'Smartwatch with comprehensive health monitoring: heart rate, SpO2, stress, sleep. Built-in GPS, 5ATM, 14-day battery.', 'Smartwatch GPS 5ATM 14 giorni', 'GPS smartwatch 5ATM 14 days', 179.99, 229.99, 15, 'https://picsum.photos/seed/prod18/600/600', TRUE, 'SMA-WAT-FIT-001', 4.5, 256),
('Caricatore GaN 65W', '65W GaN Charger', 'caricatore-gan-65w', 'Caricatore multi-porta GaN 65W totali. 2x USB-C PD 65W, 1x USB-A QC3.0. Tecnologia GaN di seconda generazione, 30% più piccolo.', 'Multi-port GaN charger 65W total. 2x USB-C PD 65W, 1x USB-A QC3.0. Second generation GaN technology, 30% smaller.', 'Caricatore GaN 65W 3 porte', 'GaN 65W 3-port charger', 39.99, 54.99, 4, 'https://picsum.photos/seed/prod19/600/600', FALSE, 'CAR-GAN-65W-001', 4.6, 141),
('Supporto Laptop Ergonomico', 'Ergonomic Laptop Stand', 'supporto-laptop-ergonomico', 'Supporto laptop regolabile in alluminio. 6 angoli di inclinazione, compatibile 10-17", peso massimo 8kg, ventilazione ottimizzata.', 'Adjustable aluminum laptop stand. 6 tilt angles, compatible 10-17", max weight 8kg, optimized ventilation.', 'Stand laptop alluminio 6 angoli', 'Aluminum laptop stand 6 angles', 34.99, 45.00, 4, 'https://picsum.photos/seed/prod20/600/600', FALSE, 'SUP-LAP-ERG-001', 4.3, 72),

-- Casa & Arredo (Cat 5)
('Candela Profumata Premium', 'Premium Scented Candle', 'candela-profumata-premium', 'Candela in cera di soia premium con fragranza lavanda e vaniglia. Stoppino in cotone, durata 60 ore, contenitore in vetro riutilizzabile.', 'Premium soy wax candle with lavender and vanilla fragrance. Cotton wick, 60-hour burn time, reusable glass container.', 'Candela soia 60h lavanda-vaniglia', 'Soy candle 60h lavender-vanilla', 24.99, 34.99, 5, 'https://picsum.photos/seed/prod21/600/600', FALSE, 'CAN-PRO-PRE-001', 4.7, 84),
('Cuscino Decorativo Velluto', 'Velvet Decorative Cushion', 'cuscino-decorativo-velluto', 'Cuscino decorativo in velluto con imbottitura in piuma d\'oca artificiale. Zip nascosta, lavabile in lavatrice, 45x45cm.', 'Velvet decorative cushion with artificial down filling. Hidden zip, machine washable, 45x45cm.', 'Cuscino velluto 45x45 imbottito', 'Velvet cushion 45x45 padded', 29.99, 39.99, 5, 'https://picsum.photos/seed/prod22/600/600', FALSE, 'CUS-DEC-VEL-001', 4.2, 37),
('Diffusore Aromi Ultrasuoni', 'Ultrasonic Aroma Diffuser', 'diffusore-aromi-ultrasuoni', 'Diffusore aromaterapeuta a ultrasuoni in legno di bambu. 7 colori LED, timer programmabile, spegnimento automatico, silenziossimo <25dB.', 'Bamboo wood ultrasonic aromatherapy diffuser. 7 LED colors, programmable timer, auto shut-off, ultra-quiet <25dB.', 'Diffusore ultrasuoni bambù 7 LED', 'Bamboo ultrasonic diffuser 7 LED', 44.99, 59.99, 5, 'https://picsum.photos/seed/prod23/600/600', FALSE, 'DIF-ARO-ULT-001', 4.5, 118),
('Plaid in Cashmere Misto', 'Mixed Cashmere Throw', 'plaid-cashmere-misto', 'Plaid in misto cashmere 30% cashmere 70% lana merino. Bordi rifiniti, ultra morbido, 130x170cm, confezionato in scatola regalo.', 'Mixed cashmere throw 30% cashmere 70% merino wool. Finished edges, ultra soft, 130x170cm, gift box packaged.', 'Plaid cashmere-merino 130x170cm', 'Cashmere-merino throw 130x170cm', 89.99, 120.00, 5, 'https://picsum.photos/seed/prod24/600/600', TRUE, 'PLA-CAS-MIS-001', 4.8, 63),
('Vaso in Ceramica Artistica', 'Artistic Ceramic Vase', 'vaso-ceramica-artistica', 'Vaso in ceramica fatto a mano con smalto reattivo. Design unico, ogni pezzo è irripetibile. Altezza 35cm, ideale per fiori freschi.', 'Handmade ceramic vase with reactive glaze. Unique design, each piece is unrepeatable. Height 35cm, ideal for fresh flowers.', 'Vaso ceramica fatto a mano 35cm', 'Handmade ceramic vase 35cm', 54.99, 74.99, 5, 'https://picsum.photos/seed/prod25/600/600', FALSE, 'VAS-CER-ART-001', 4.6, 45),

-- Sport & Fitness (Cat 6)
('Tappetino Yoga Premium 6mm', 'Premium 6mm Yoga Mat', 'tappetino-yoga-premium', 'Tappetino yoga in TPE ecologico 6mm. Doppio strato, antiscivolo su entrambi i lati, strap di trasporto incluso, 183x61cm.', 'Ecological TPE yoga mat 6mm. Double layer, non-slip on both sides, transport strap included, 183x61cm.', 'Tappetino TPE 6mm antiscivolo', 'TPE 6mm non-slip yoga mat', 39.99, 54.99, 6, 'https://picsum.photos/seed/prod26/600/600', FALSE, 'TAP-YOG-PRE-001', 4.5, 203),
('Kettlebell 12kg Ghisa', '12kg Cast Iron Kettlebell', 'kettlebell-12kg', 'Kettlebell in ghisa 12kg con rivestimento in polvere antiruggine. Manico ergonomico levigato, base piatta anti-rotolamento.', '12kg cast iron kettlebell with anti-rust powder coating. Smooth ergonomic handle, flat anti-rolling base.', 'Kettlebell ghisa 12kg', 'Cast iron kettlebell 12kg', 34.99, 49.99, 6, 'https://picsum.photos/seed/prod27/600/600', FALSE, 'KET-12K-GHI-001', 4.4, 89),
('Borsone Sportivo 40L', '40L Sports Bag', 'borsone-sportivo-40l', 'Borsone sportivo in poliestere resistente 40L. Scomparto scarpe separato, tasca umidità-proof, tracolla regolabile.', 'Resistant 40L polyester sports bag. Separate shoe compartment, moisture-proof pocket, adjustable shoulder strap.', 'Borsone 40L con scomparto scarpe', '40L sports bag with shoe compartment', 49.99, 69.99, 6, 'https://picsum.photos/seed/prod28/600/600', FALSE, 'BOR-SPO-40L-001', 4.3, 67),
('Fascia Corsa GPS', 'GPS Running Band', 'fascia-corsa-gps', 'Fascia per il braccio running in neoprene con tasca per smartphone fino a 6.7". Porta cuffie, riflettente, taglia unica regolabile.', 'Neoprene running arm band with pocket for smartphones up to 6.7". Headphone port, reflective, one size adjustable.', 'Fascia running neoprene 6.7"', 'Neoprene running armband 6.7"', 14.99, 19.99, 6, 'https://picsum.photos/seed/prod29/600/600', FALSE, 'FAS-COR-GPS-001', 4.1, 142),
('Corda per Saltare Pro', 'Pro Jump Rope', 'corda-saltare-pro', 'Corda per saltare professionale con cuscinetti a sfera. Manici ergonomici in alluminio, lunghezza regolabile 2.7-3.5m, counter integrato.', 'Professional jump rope with ball bearings. Aluminum ergonomic handles, adjustable length 2.7-3.5m, integrated counter.', 'Corda salto professionale con counter', 'Pro jump rope with counter', 24.99, 34.99, 6, 'https://picsum.photos/seed/prod30/600/600', FALSE, 'COR-SAL-PRO-001', 4.4, 95),

-- Bellezza & Cura (Cat 7)
('Siero Vitamina C 20%', '20% Vitamin C Serum', 'siero-vitamina-c-20', 'Siero viso con vitamina C stabilizzata al 20% + Vitamina E + Acido Ialuronico. Antiossidante, illuminante, 30ml, vegan e cruelty-free.', 'Face serum with 20% stabilized vitamin C + Vitamin E + Hyaluronic Acid. Antioxidant, brightening, 30ml, vegan and cruelty-free.', 'Siero vitamina C 20% illuminante 30ml', 'Vitamin C 20% brightening serum 30ml', 34.99, 49.99, 7, 'https://picsum.photos/seed/prod31/600/600', TRUE, 'SIE-VIT-C20-001', 4.7, 289),
('Crema Idratante SPF50', 'SPF50 Moisturizing Cream', 'crema-idratante-spf50', 'Crema idratante viso con protezione solare SPF50. Formula leggera non grassa, idratazione 24h, anti-age, senza parabeni, 50ml.', 'Face moisturizer with SPF50 sun protection. Lightweight non-greasy formula, 24h hydration, anti-aging, paraben-free, 50ml.', 'Crema SPF50 idratante 24h 50ml', 'SPF50 moisturizer 24h 50ml', 29.99, 42.00, 7, 'https://picsum.photos/seed/prod32/600/600', FALSE, 'CRE-IDR-SP5-001', 4.5, 178),
('Olio Argan Puro 100ml', 'Pure Argan Oil 100ml', 'olio-argan-puro-100ml', 'Olio di argan puro pressato a freddo dal Marocco. Multiuso per viso, corpo, capelli. Ricco di vitamina E, acidi grassi, antiossidanti.', 'Cold-pressed pure argan oil from Morocco. Multi-purpose for face, body, hair. Rich in vitamin E, fatty acids, antioxidants.', 'Olio argan puro pressato freddo 100ml', 'Pure cold-pressed argan oil 100ml', 22.99, 32.99, 7, 'https://picsum.photos/seed/prod33/600/600', FALSE, 'OLI-ARG-PUR-001', 4.6, 156),
('Set Pennelli Trucco 12pz', '12-Piece Makeup Brush Set', 'set-pennelli-trucco-12pz', 'Set professionale 12 pennelli trucco in pelo sintetico premium. Manico in legno laccato nero, astuccio rigido incluso, vegan.', 'Professional set of 12 makeup brushes in premium synthetic bristles. Lacquered black wooden handle, hard case included, vegan.', 'Set 12 pennelli makeup professionali', 'Professional 12 makeup brush set', 44.99, 65.00, 7, 'https://picsum.photos/seed/prod34/600/600', FALSE, 'SET-PEN-TRU-001', 4.4, 203),
('Maschera Viso Notturna', 'Night Face Mask', 'maschera-viso-notturna', 'Maschera viso da notte con retinolo 0.5% + peptidi + niacinamide. Rinnova la pelle durante il sonno, 50ml, testata dermatologicamente.', 'Night face mask with retinol 0.5% + peptides + niacinamide. Renews skin during sleep, 50ml, dermatologically tested.', 'Maschera notte retinolo 0.5% 50ml', 'Night mask retinol 0.5% 50ml', 38.99, 54.99, 7, 'https://picsum.photos/seed/prod35/600/600', TRUE, 'MAS-VIS-NOT-001', 4.7, 167),

-- Libri & Arte (Cat 8)
('Taccuino Dotted Premium A5', 'A5 Premium Dotted Notebook', 'taccuino-dotted-premium-a5', 'Taccuino premium con carta Clairefontaine 100g/m2 puntinata. Copertina rigida in tela, 192 pagine, segnalibro, pocket posteriore.', 'Premium notebook with Clairefontaine 100g/m2 dot grid paper. Hardcover linen cover, 192 pages, bookmark, back pocket.', 'Taccuino dotted A5 192 pagine', 'Dotted A5 notebook 192 pages', 19.99, 26.99, 8, 'https://picsum.photos/seed/prod36/600/600', FALSE, 'TAC-DOT-A5-001', 4.8, 334),
('Set Acquerelli 36 Colori', '36 Color Watercolor Set', 'set-acquerelli-36-colori', 'Set acquerelli professionali 36 colori in mezzo pan. Colori altamente pigmentati, lightfast, incluso pennello con serbatoio dacqua.', 'Professional watercolor set 36 colors in half pan. Highly pigmented colors, lightfast, water brush with reservoir included.', 'Acquerelli 36 colori professionali', 'Professional watercolors 36 colors', 39.99, 55.00, 8, 'https://picsum.photos/seed/prod37/600/600', FALSE, 'ACQ-36C-PRO-001', 4.6, 122),
('Matite Colorate 48 pezzi', '48-Piece Colored Pencils', 'matite-colorate-48pz', 'Matite colorate professionali con mina morbida 3.8mm. Set 48 colori vivaci, anima resistente alla rottura, fusto esagonale.', 'Professional colored pencils with soft 3.8mm lead. Set of 48 vibrant colors, break-resistant core, hexagonal barrel.', 'Matite colorate 48pz mina 3.8mm', 'Colored pencils 48pcs 3.8mm lead', 29.99, 39.99, 8, 'https://picsum.photos/seed/prod38/600/600', FALSE, 'MAT-COL-48P-001', 4.5, 189),
('Cornice Foto 20x30 Legno', '20x30 Wood Photo Frame', 'cornice-foto-20x30-legno', 'Cornice portafoto in legno massello di pino. Vetro cristallo, retro in MDF, supporto da tavolo e appenditoio, formato 20x30cm.', 'Solid pine wood photo frame. Crystal glass, MDF back, table stand and hanging hook, 20x30cm format.', 'Cornice legno massello 20x30cm', 'Solid wood frame 20x30cm', 24.99, 34.99, 8, 'https://picsum.photos/seed/prod39/600/600', FALSE, 'COR-FOT-20X-001', 4.3, 78),
('Libro Illustrato Design 2025', 'Illustrated Design Book 2025', 'libro-illustrato-design-2025', 'Raccolta delle migliori opere di design contemporaneo 2025. 320 pagine a colori, carta patinata lucida, formato 28x28cm, rilegatura rigida.', 'Collection of the best contemporary design works 2025. 320 color pages, glossy coated paper, 28x28cm format, hardcover.', 'Libro design contemporaneo 320 pagine', 'Contemporary design book 320 pages', 54.99, 72.00, 8, 'https://picsum.photos/seed/prod40/600/600', TRUE, 'LIB-ILL-DES-001', 4.7, 91),

-- More products mix
('Profumo Eau de Parfum 100ml', 'Eau de Parfum 100ml', 'profumo-eau-parfum-100ml', 'Eau de Parfum con note di apertura di bergamotto e limone, cuore di rosa e gelsomino, fondo di sandalo e muschio. 100ml.', 'Eau de Parfum with bergamot and lemon opening notes, rose and jasmine heart, sandalwood and musk base. 100ml.', 'EDP bergamotto-rosa-sandalo 100ml', 'EDP bergamot-rose-sandalwood 100ml', 79.99, 110.00, 7, 'https://picsum.photos/seed/prod41/600/600', TRUE, 'PRO-EDP-100-001', 4.6, 156),
('Occhiali da Sole Polarizzati', 'Polarized Sunglasses', 'occhiali-sole-polarizzati', 'Occhiali da sole con lenti polarizzate categoria 3. Montatura in acetato premium, protezione UV400, custodia rigida inclusa.', 'Sunglasses with category 3 polarized lenses. Premium acetate frame, UV400 protection, hard case included.', 'Occhiali polarizzati UV400 acetato', 'Polarized UV400 acetate sunglasses', 89.99, 125.00, 3, 'https://picsum.photos/seed/prod42/600/600', FALSE, 'OCC-SOL-POL-001', 4.4, 87),
('Sciarpa in Lana Merino', 'Merino Wool Scarf', 'sciarpa-lana-merino', 'Sciarpa in lana merino extrafine 100%. Leggera e morbidissima, anti-pilling, 30x180cm, lavabile a mano in acqua fredda.', 'Extra-fine 100% merino wool scarf. Light and ultra-soft, anti-pilling, 30x180cm, hand washable in cold water.', 'Sciarpa merino 30x180cm anti-pilling', 'Merino scarf 30x180cm anti-pilling', 49.99, 69.99, 1, 'https://picsum.photos/seed/prod43/600/600', FALSE, 'SCI-LAM-MER-001', 4.7, 113),
('Spilla Bluetooth Magnetica', 'Magnetic Bluetooth Pin', 'spilla-bluetooth-magnetica', 'Spilla magnetica con speaker Bluetooth integrato. Design minimalista, batteria 8 ore, controlli touch, multipoint 2 dispositivi.', 'Magnetic pin with integrated Bluetooth speaker. Minimalist design, 8-hour battery, touch controls, multipoint 2 devices.', 'Spilla magnetica speaker BT 8h', 'Magnetic pin BT speaker 8h', 59.99, 79.99, 4, 'https://picsum.photos/seed/prod44/600/600', FALSE, 'SPI-BLU-MAG-001', 4.2, 43),
('Guanti Pelle Invernali', 'Winter Leather Gloves', 'guanti-pelle-invernali', 'Guanti in pelle nappa con fodera in cashmerino. Dita touch-screen compatible, polso con bottone, taglie XS-XL.', 'Nappa leather gloves with cashmere lining. Touch-screen compatible fingers, wrist button, sizes XS-XL.', 'Guanti nappa cashmerino touch XS-XL', 'Nappa cashmere touch gloves XS-XL', 59.99, 79.99, 3, 'https://picsum.photos/seed/prod45/600/600', FALSE, 'GUA-PEL-INV-001', 4.5, 67),
('Cappello Beanie in Lana', 'Wool Beanie Hat', 'cappello-beanie-lana', 'Cappello beanie in lana merino 100% a maglia fine. Taglia unica, interno in pile antivento, logo ricamato YOUR NAME.', '100% merino wool fine knit beanie hat. One size, windproof fleece lining, embroidered YOUR NAME logo.', 'Beanie merino 100% con interno pile', '100% merino beanie with fleece lining', 34.99, 44.99, 1, 'https://picsum.photos/seed/prod46/600/600', FALSE, 'CAP-BEA-LAM-001', 4.6, 98),
('Portachiavi in Pelle Inciso', 'Engraved Leather Keychain', 'portachiavi-pelle-inciso', 'Portachiavi in pelle vegetale con incisione laser personalizzabile. Moschettone in acciaio, perfetto come regalo, confezione elegante.', 'Vegetable leather keychain with customizable laser engraving. Steel carabiner, perfect as a gift, elegant packaging.', 'Portachiavi pelle incisione laser', 'Leather keychain laser engraving', 19.99, 27.99, 3, 'https://picsum.photos/seed/prod47/600/600', FALSE, 'POR-PEL-INC-001', 4.7, 234),
('Bottiglia Termica 500ml', 'Thermal Bottle 500ml', 'bottiglia-termica-500ml', 'Bottiglia termica in acciaio inox 304 a doppia parete. Mantiene il caldo 12h, freddo 24h. Tappo ermetico, senza BPA, 500ml.', '304 stainless steel double-wall thermal bottle. Keeps hot 12h, cold 24h. Hermetic cap, BPA-free, 500ml.', 'Bottiglia termica inox 500ml 12/24h', 'Stainless thermal bottle 500ml 12/24h', 29.99, 39.99, 6, 'https://picsum.photos/seed/prod48/600/600', FALSE, 'BOT-TER-50M-001', 4.5, 312),
('Porta Documenti Pelle A4', 'A4 Leather Document Holder', 'porta-documenti-pelle-a4', 'Porta documenti A4 in pelle PU premium. Scomparto principale + 6 tasche carte + tasca tablet, chiusura con bottone magnetico.', 'A4 premium PU leather document holder. Main compartment + 6 card pockets + tablet pocket, magnetic button closure.', 'Porta documenti pelle A4 con tablet', 'A4 leather document holder with tablet', 42.99, 59.99, 3, 'https://picsum.photos/seed/prod49/600/600', FALSE, 'POR-DOC-A4P-001', 4.4, 56),
('Kit Cura Barba Premium', 'Premium Beard Care Kit', 'kit-cura-barba-premium', 'Kit completo cura barba: olio barba 30ml, balsamo modellante 75ml, pettine in legno, pennello in cinghiale. In scatola regalo.', 'Complete beard care kit: beard oil 30ml, styling balm 75ml, wooden comb, boar brush. In gift box.', 'Kit barba olio+balsamo+pettine+pennello', 'Beard kit oil+balm+comb+brush', 49.99, 69.99, 7, 'https://picsum.photos/seed/prod50/600/600', TRUE, 'KIT-BAR-PRE-001', 4.6, 189);

-- Product Variants for first 10 products (size, color, etc)
INSERT INTO product_variants (product_id, name, type, value, color_hex, sku, price_adjustment, sort_order) VALUES
-- T-Shirt sizes
(1, 'Taglia S', 'size', 'S', NULL, 'TSH-PRE-FUC-001-S', 0, 1),
(1, 'Taglia M', 'size', 'M', NULL, 'TSH-PRE-FUC-001-M', 0, 2),
(1, 'Taglia L', 'size', 'L', NULL, 'TSH-PRE-FUC-001-L', 0, 3),
(1, 'Taglia XL', 'size', 'XL', NULL, 'TSH-PRE-FUC-001-XL', 0, 4),
-- Felpa sizes and colors
(2, 'Taglia S - Grigio', 'size_color', 'S-Grigio', '#2C2E39', 'FEL-URB-001-S-GR', 0, 1),
(2, 'Taglia M - Grigio', 'size_color', 'M-Grigio', '#2C2E39', 'FEL-URB-001-M-GR', 0, 2),
(2, 'Taglia L - Grigio', 'size_color', 'L-Grigio', '#2C2E39', 'FEL-URB-001-L-GR', 0, 3),
(2, 'Taglia M - Nero', 'size_color', 'M-Nero', '#1a1a1a', 'FEL-URB-001-M-NE', 0, 4),
-- Sneakers sizes
(6, 'EU 38', 'size', '38', NULL, 'SNE-RUN-PRO-001-38', 0, 1),
(6, 'EU 39', 'size', '39', NULL, 'SNE-RUN-PRO-001-39', 0, 2),
(6, 'EU 40', 'size', '40', NULL, 'SNE-RUN-PRO-001-40', 0, 3),
(6, 'EU 41', 'size', '41', NULL, 'SNE-RUN-PRO-001-41', 0, 4),
(6, 'EU 42', 'size', '42', NULL, 'SNE-RUN-PRO-001-42', 0, 5),
(6, 'EU 43', 'size', '43', NULL, 'SNE-RUN-PRO-001-43', 0, 6),
-- Orologio colors
(13, 'Cinturino Nero', 'color', 'Nero', '#1a1a1a', 'ORL-MIN-NER-001-NE', 0, 1),
(13, 'Cinturino Marrone', 'color', 'Marrone', '#8B4513', 'ORL-MIN-NER-001-BR', 10.00, 2),
(13, 'Cinturino Alluminio', 'color', 'Alluminio', '#C0C0C0', 'ORL-MIN-NER-001-AL', 20.00, 3),
-- Cuffie wireless colors
(16, 'Nero', 'color', 'Nero', '#1a1a1a', 'CUF-WIR-PRO-001-NE', 0, 1),
(16, 'Bianco', 'color', 'Bianco', '#F5F5F5', 'CUF-WIR-PRO-001-WH', 0, 2),
(16, 'Fucsia', 'color', 'Fucsia', '#D8125B', 'CUF-WIR-PRO-001-FU', 5.00, 3);

-- Inventory (assign stock to warehouses)
INSERT INTO inventory (product_id, variant_id, warehouse_id, quantity, reserved) VALUES
-- Products without variants in warehouse 1
(3, NULL, 1, 45, 2), (4, NULL, 1, 28, 1), (5, NULL, 1, 62, 0),
(7, NULL, 1, 18, 3), (8, NULL, 1, 34, 0), (9, NULL, 1, 25, 1),
(10, NULL, 1, 40, 2), (11, NULL, 1, 55, 3), (12, NULL, 1, 37, 1),
(14, NULL, 1, 89, 0), (15, NULL, 1, 74, 0), (17, NULL, 1, 43, 2),
(18, NULL, 1, 31, 1), (19, NULL, 1, 95, 5), (20, NULL, 1, 68, 0),
(21, NULL, 1, 120, 0), (22, NULL, 1, 87, 0), (23, NULL, 1, 56, 2),
(24, NULL, 1, 29, 1), (25, NULL, 1, 41, 0), (26, NULL, 1, 78, 4),
(27, NULL, 1, 34, 0), (28, NULL, 1, 52, 1), (29, NULL, 1, 145, 8),
(30, NULL, 1, 67, 3), (31, NULL, 1, 193, 12), (32, NULL, 1, 156, 7),
(33, NULL, 1, 234, 15), (34, NULL, 1, 87, 2), (35, NULL, 1, 143, 9),
(36, NULL, 1, 289, 18), (37, NULL, 1, 76, 1), (38, NULL, 1, 134, 6),
(39, NULL, 1, 92, 0), (40, NULL, 1, 48, 2), (41, NULL, 1, 63, 3),
(42, NULL, 1, 45, 1), (43, NULL, 1, 71, 2), (44, NULL, 1, 38, 0),
(45, NULL, 1, 54, 1), (46, NULL, 1, 98, 4), (47, NULL, 1, 187, 11),
(48, NULL, 1, 213, 14), (49, NULL, 1, 62, 0), (50, NULL, 1, 94, 3),
-- Variants inventory
(1, 1, 1, 25, 1), (1, 2, 1, 45, 3), (1, 3, 1, 38, 2), (1, 4, 1, 19, 0),
(2, 5, 1, 22, 1), (2, 6, 1, 34, 2), (2, 7, 1, 28, 1), (2, 8, 1, 15, 0),
(6, 9, 1, 12, 1), (6, 10, 1, 18, 2), (6, 11, 1, 24, 3), (6, 12, 1, 20, 1),
(6, 13, 1, 16, 0), (6, 14, 1, 8, 1),
(13, 15, 1, 20, 1), (13, 16, 1, 15, 0), (13, 17, 1, 10, 2),
(16, 18, 1, 35, 2), (16, 19, 1, 28, 1), (16, 20, 1, 12, 0),
-- Warehouse 2 stock
(3, NULL, 2, 20, 0), (6, 11, 2, 10, 0), (7, NULL, 2, 8, 1),
(11, NULL, 2, 25, 1), (13, 15, 2, 8, 0), (18, NULL, 2, 15, 0),
-- Warehouse 3 stock
(1, 2, 3, 15, 0), (4, NULL, 3, 10, 0), (16, 18, 3, 20, 1);

-- Reviews for products
INSERT INTO reviews (product_id, user_id, rating, title, content, is_verified) VALUES
(1, 2, 5, 'Qualità ottima!', 'T-shirt davvero premium. Il cotone è morbidissimo e il logo ricamato è fatto benissimo. Taglia fedele.', 1),
(1, 3, 4, 'Bella ma attenzione alle taglie', 'Bella t-shirt, colore vivace. La taglia è un po stretta, consiglio di prendere una taglia in più.', 1),
(2, 2, 5, 'Felpa perfetta per linverno', 'Pesante al punto giusto, molto calda. Il tessuto è di qualità superiore. Sono al terzo lavaggio e non si è ritirata.', 1),
(4, 3, 5, 'Giacca fantastica', 'Ho ricevuto la giacca in anticipo rispetto ai tempi previsti. Qualità eccellente, la fodera in pile è caldissima.', 1),
(6, 4, 5, 'Sneakers comodissime', 'Le porto al lavoro ogni giorno da 3 mesi. Zero problemi, ammortizzano bene e non si sono consumate.', 1),
(13, 2, 5, 'Orologio bellissimo', 'Arrivato in perfetta condizione, confezionamento curato. Quadrante elegante, movimento preciso.', 1),
(16, 3, 4, 'Ottima qualità audio', 'La cancellazione del rumore è davvero efficace. Le porto nel metrò tutti i giorni. Batteria che dura veramente 40 ore.', 1),
(31, 4, 5, 'Siero miracoloso!', 'Uso questo siero da 2 mesi e la mia pelle è visibilmente più luminosa. Lo consiglio a tutti.', 1),
(36, 2, 5, 'Il miglior taccuino che abbia mai usato', 'La carta è fantastica, la penna non bavagli mai. La copertina rigida è robusta. 10/10', 1),
(48, 3, 5, 'Bottiglia eccellente', 'Il caffè rimane caldo per tutta la mattina. Design bello, facile da pulire. Acquisto consigliato.', 1);

-- Orders (sample)
INSERT INTO orders (user_id, order_number, status, subtotal, shipping_cost, tax_amount, total_amount, shipping_address, billing_address, payment_method, payment_status) VALUES
(2, 'ORD-2025-001', 'delivered', 89.98, 4.99, 19.80, 114.77, '{"first_name":"Mario","last_name":"Rossi","address_line1":"Via Roma 1","city":"Milano","postal_code":"20100","country":"IT"}', '{"first_name":"Mario","last_name":"Rossi","address_line1":"Via Roma 1","city":"Milano","postal_code":"20100","country":"IT"}', 'stripe', 'paid'),
(3, 'ORD-2025-002', 'shipped', 129.99, 0.00, 28.60, 158.59, '{"first_name":"Giulia","last_name":"Ferrari","address_line1":"Corso Vittorio 15","city":"Roma","postal_code":"00100","country":"IT"}', '{"first_name":"Giulia","last_name":"Ferrari","address_line1":"Corso Vittorio 15","city":"Roma","postal_code":"00100","country":"IT"}', 'paypal', 'paid'),
(4, 'ORD-2025-003', 'processing', 49.98, 4.99, 11.00, 65.97, '{"first_name":"Luca","last_name":"Bianchi","address_line1":"Via Garibaldi 7","city":"Torino","postal_code":"10100","country":"IT"}', '{"first_name":"Luca","last_name":"Bianchi","address_line1":"Via Garibaldi 7","city":"Torino","postal_code":"10100","country":"IT"}', 'stripe', 'paid');

INSERT INTO order_items (order_id, product_id, variant_id, product_name, quantity, unit_price, total_price) VALUES
(1, 1, 2, 'T-Shirt Premium Fucsia - Taglia M', 2, 29.99, 59.98),
(1, 14, NULL, 'Portafoglio Slim in Pelle', 1, 35.99, 35.99),
(2, 16, 18, 'Cuffie Wireless Pro - Nero', 1, 129.99, 129.99),
(3, 26, NULL, 'Tappetino Yoga Premium 6mm', 1, 39.99, 39.99),
(3, 48, NULL, 'Bottiglia Termica 500ml', 1, 29.99, 29.99);
