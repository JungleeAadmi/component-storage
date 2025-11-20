-- Initial database schema
-- This file is applied during first setup

-- Storage Containers Table
CREATE TABLE IF NOT EXISTS storage_containers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('type1_dual', 'type2_uniform', 'custom')),
  top_rows INTEGER,
  top_cols INTEGER,
  bottom_rows INTEGER,
  bottom_cols INTEGER,
  rows INTEGER,
  cols INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Components Table
CREATE TABLE IF NOT EXISTS components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  category TEXT,
  custom_category TEXT,
  specifications TEXT,
  package_type TEXT,
  value TEXT,
  manufacturer TEXT,
  part_number TEXT,
  purchase_link TEXT,
  price TEXT,
  datasheet_url TEXT,
  notes TEXT,
  image_path TEXT,
  container_id INTEGER,
  tray_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (container_id) REFERENCES storage_containers(id) ON DELETE SET NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_components_category ON components(category);
CREATE INDEX IF NOT EXISTS idx_components_container ON components(container_id);
CREATE INDEX IF NOT EXISTS idx_components_tray ON components(tray_address);
CREATE INDEX IF NOT EXISTS idx_components_name ON components(name);
CREATE INDEX IF NOT EXISTS idx_components_part_number ON components(part_number);
CREATE INDEX IF NOT EXISTS idx_storage_containers_type ON storage_containers(type);

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_storage_containers_timestamp 
AFTER UPDATE ON storage_containers
BEGIN
  UPDATE storage_containers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_components_timestamp 
AFTER UPDATE ON components
BEGIN
  UPDATE components SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
