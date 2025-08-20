-- Initialize the receipt_db database
-- Create the receipt_items table

CREATE TABLE IF NOT EXISTS receipt_items (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_receipt_items_name ON receipt_items(item_name);
CREATE INDEX IF NOT EXISTS idx_receipt_items_created_at ON receipt_items(created_at);

-- Insert some sample data (optional)
INSERT INTO receipt_items (item_name, quantity, price) VALUES
    ('Sample Apple', 2, 1.50),
    ('Sample Bread', 1, 2.99),
    ('Sample Milk', 1, 3.49)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shikhar;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO shikhar;
