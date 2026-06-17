-- Seed: accounts + 1 product per category

-- Categories
INSERT INTO categories (name, name_en, slug, sort_order, is_active) VALUES
('Abbigliamento', 'Clothing', 'abbigliamento', 1, TRUE),
('Scarpe', 'Shoes', 'scarpe', 2, TRUE),
('Accessori', 'Accessories', 'accessori', 3, TRUE),
('Elettronica', 'Electronics', 'elettronica', 4, TRUE),
('Casa & Cucina', 'Home & Kitchen', 'casa-cucina', 5, TRUE);

-- Users
INSERT INTO users (email, password, first_name, last_name, role, is_active, is_verified) VALUES
('admin@store.com', '$2a$10$J1eGUu43XEIu84w9iNiJpeR/xQ1Lh96050ZaqJ09fnkqDQNHDmTo2', 'Admin', 'Store', 'admin', TRUE, TRUE),
('mod@store.com', '$2a$10$53jCFqoqnyBxQSnVxq9Lee6Lfcnhzgqs0xc0gicOrhRsOPGqBPVZu', 'Marco', 'Moderatore', 'moderator', TRUE, TRUE),
('cliente@esempio.com', '$2a$10$JbDXrTH.YBD4AeZf0IzcAOzeLtrHR6N08Coxqf9DqlIJ.GxroTc3e', 'Luca', 'Rossi', 'customer', TRUE, TRUE);

-- Products (1 per category)
INSERT INTO products (name, slug, description, price, sku, category_id, is_active, is_featured) VALUES
('T-Shirt Basic', 't-shirt-basic', 'T-shirt in cotone 100%, vestibilita regular.', 29.99, 'CLOTH-001', 1, TRUE, TRUE),
('Sneaker Urban', 'sneaker-urban', 'Sneaker casual in pelle sintetica, suola in gomma.', 89.99, 'SHOES-001', 2, TRUE, FALSE),
('Cintura in Pelle', 'cintura-pelle', 'Cintura in vera pelle con fibbia argentata.', 39.99, 'ACC-001', 3, TRUE, FALSE),
('Cuffie Wireless', 'cuffie-wireless', 'Cuffie Bluetooth 5.0, autonomia 30h, noise cancelling.', 129.99, 'ELEC-001', 4, TRUE, TRUE),
('Set Padelle Antiaderenti', 'set-padelle', 'Set 3 padelle antiaderenti in granito, compatibili induzione.', 59.99, 'HOME-001', 5, TRUE, FALSE);

-- Warehouse default
INSERT INTO warehouses (name, code, is_active, is_default) VALUES
('Magazzino Principale', 'MAIN', TRUE, TRUE);

-- Inventory (50 pezzi per prodotto)
INSERT INTO inventory (product_id, warehouse_id, quantity, low_stock_threshold)
SELECT p.id, w.id, 50, 5
FROM products p, warehouses w
WHERE w.code = 'MAIN';
