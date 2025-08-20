-- Initialize the receipt_db database
-- Create multi-tenant schema with users and per-user receipt_items

-- Enable UUID extension for better user identification
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with enhanced fields
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receipt items table with user isolation and enhanced fields
CREATE TABLE IF NOT EXISTS receipt_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    receipt_id VARCHAR(255), -- Optional receipt identifier
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    total_amount NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * price) STORED,
    category VARCHAR(100), -- Optional item category
    store_name VARCHAR(255), -- Optional store information
    purchase_date DATE, -- Optional purchase date
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_receipt_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create comprehensive indexes for better performance
CREATE INDEX IF NOT EXISTS idx_receipt_items_user ON receipt_items(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_name ON receipt_items(item_name);
CREATE INDEX IF NOT EXISTS idx_receipt_items_created_at ON receipt_items(created_at);
CREATE INDEX IF NOT EXISTS idx_receipt_items_category ON receipt_items(category);
CREATE INDEX IF NOT EXISTS idx_receipt_items_store ON receipt_items(store_name);
CREATE INDEX IF NOT EXISTS idx_receipt_items_purchase_date ON receipt_items(purchase_date);
CREATE INDEX IF NOT EXISTS idx_receipt_items_price_range ON receipt_items(price);

-- Create a view for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(ri.id) as total_items,
    SUM(ri.total_amount) as total_spent,
    AVG(ri.price) as avg_item_price,
    MAX(ri.created_at) as last_purchase_date
FROM users u
LEFT JOIN receipt_items ri ON u.id = ri.user_id
WHERE u.is_active = TRUE
GROUP BY u.id, u.username;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipt_items_updated_at BEFORE UPDATE ON receipt_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed sample users with more realistic data
INSERT INTO users (username, email, full_name) VALUES
    ('alice', 'alice@example.com', 'Alice Johnson'),
    ('bob', 'bob@example.com', 'Bob Smith'),
    ('charlie', 'charlie@example.com', 'Charlie Brown'),
    ('diana', 'diana@example.com', 'Diana Prince')
ON CONFLICT (username) DO NOTHING;

-- Insert sample data with more realistic receipt information
INSERT INTO receipt_items (user_id, receipt_id, item_name, quantity, price, category, store_name, purchase_date) VALUES
    ((SELECT id FROM users WHERE username = 'alice'), 'RCPT001', 'Organic Apples', 2, 1.50, 'Fruits', 'Fresh Market', CURRENT_DATE - INTERVAL '2 days'),
    ((SELECT id FROM users WHERE username = 'alice'), 'RCPT001', 'Whole Grain Bread', 1, 2.99, 'Bakery', 'Fresh Market', CURRENT_DATE - INTERVAL '2 days'),
    ((SELECT id FROM users WHERE username = 'alice'), 'RCPT002', 'Greek Yogurt', 3, 1.25, 'Dairy', 'Super Foods', CURRENT_DATE - INTERVAL '5 days'),
    ((SELECT id FROM users WHERE username = 'bob'), 'RCPT003', 'Organic Milk', 1, 3.49, 'Dairy', 'Health Store', CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM users WHERE username = 'bob'), 'RCPT003', 'Bananas', 1, 0.99, 'Fruits', 'Health Store', CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM users WHERE username = 'charlie'), 'RCPT004', 'Chicken Breast', 2, 8.99, 'Meat', 'Butcher Shop', CURRENT_DATE - INTERVAL '3 days'),
    ((SELECT id FROM users WHERE username = 'diana'), 'RCPT005', 'Quinoa', 1, 4.99, 'Grains', 'Organic Market', CURRENT_DATE - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shikhar;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO shikhar;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO shikhar;

-- Create a function to get user's receipt summary
CREATE OR REPLACE FUNCTION get_user_receipt_summary(p_username VARCHAR)
RETURNS TABLE (
    total_items BIGINT,
    total_spent NUMERIC,
    avg_item_price NUMERIC,
    last_purchase_date TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(ri.id)::BIGINT,
        COALESCE(SUM(ri.total_amount), 0),
        COALESCE(AVG(ri.price), 0),
        MAX(ri.created_at)
    FROM users u
    LEFT JOIN receipt_items ri ON u.id = ri.user_id
    WHERE u.username = p_username AND u.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_receipt_summary(VARCHAR) TO shikhar;
