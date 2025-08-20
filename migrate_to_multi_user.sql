-- Migration script: Single-user to Multi-user Architecture
-- Run this script to migrate existing single-user data to multi-user structure

-- Step 1: Check if we're migrating from single-user structure
DO $$
BEGIN
    -- Check if the old single-user structure exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'receipt_items' 
        AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'receipt_items' 
            AND column_name = 'user_id'
        )
    ) THEN
        RAISE NOTICE 'Detected single-user structure. Starting migration...';
        
        -- Step 2: Create users table if it doesn't exist
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE,
            full_name VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Step 3: Create a default user for existing data
        INSERT INTO users (username, email, full_name) VALUES
            ('default_user', 'default@example.com', 'Default User')
        ON CONFLICT (username) DO NOTHING;
        
        -- Step 4: Add user_id column to receipt_items
        ALTER TABLE receipt_items ADD COLUMN IF NOT EXISTS user_id INTEGER;
        
        -- Step 5: Update existing records to belong to default user
        UPDATE receipt_items 
        SET user_id = (SELECT id FROM users WHERE username = 'default_user')
        WHERE user_id IS NULL;
        
        -- Step 6: Make user_id NOT NULL and add foreign key constraint
        ALTER TABLE receipt_items ALTER COLUMN user_id SET NOT NULL;
        
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_receipt_items_user'
        ) THEN
            ALTER TABLE receipt_items 
            ADD CONSTRAINT fk_receipt_items_user 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
        
        -- Step 7: Add additional columns for enhanced functionality
        ALTER TABLE receipt_items ADD COLUMN IF NOT EXISTS receipt_id VARCHAR(255);
        ALTER TABLE receipt_items ADD COLUMN IF NOT EXISTS category VARCHAR(100);
        ALTER TABLE receipt_items ADD COLUMN IF NOT EXISTS store_name VARCHAR(255);
        ALTER TABLE receipt_items ADD COLUMN IF NOT EXISTS purchase_date DATE;
        ALTER TABLE receipt_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- Step 8: Add constraints
        ALTER TABLE receipt_items ADD CONSTRAINT IF NOT EXISTS check_quantity_positive 
            CHECK (quantity > 0);
        ALTER TABLE receipt_items ADD CONSTRAINT IF NOT EXISTS check_price_non_negative 
            CHECK (price >= 0);
        
        -- Step 9: Create computed column for total_amount
        ALTER TABLE receipt_items ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2);
        UPDATE receipt_items SET total_amount = quantity * price WHERE total_amount IS NULL;
        ALTER TABLE receipt_items ALTER COLUMN total_amount SET NOT NULL;
        
        -- Step 10: Create indexes
        CREATE INDEX IF NOT EXISTS idx_receipt_items_user ON receipt_items(user_id);
        CREATE INDEX IF NOT EXISTS idx_receipt_items_category ON receipt_items(category);
        CREATE INDEX IF NOT EXISTS idx_receipt_items_store ON receipt_items(store_name);
        CREATE INDEX IF NOT EXISTS idx_receipt_items_purchase_date ON receipt_items(purchase_date);
        CREATE INDEX IF NOT EXISTS idx_receipt_items_price_range ON receipt_items(price);
        
        -- Step 11: Create triggers for updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        DROP TRIGGER IF EXISTS update_receipt_items_updated_at ON receipt_items;
        CREATE TRIGGER update_receipt_items_updated_at 
            BEFORE UPDATE ON receipt_items
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        -- Step 12: Create user statistics view
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
        
        -- Step 13: Create helper function
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
        
        RAISE NOTICE 'Migration completed successfully!';
        RAISE NOTICE 'Existing data has been assigned to user: default_user';
        RAISE NOTICE 'You can now create additional users and reassign data as needed.';
        
    ELSE
        RAISE NOTICE 'Multi-user structure already exists. No migration needed.';
    END IF;
END $$;

-- Step 14: Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shikhar;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO shikhar;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO shikhar;
GRANT EXECUTE ON FUNCTION get_user_receipt_summary(VARCHAR) TO shikhar;

-- Step 15: Show migration summary
SELECT 
    'Migration Summary' as info,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(ri.id) as total_items,
    SUM(ri.total_amount) as total_value
FROM users u
LEFT JOIN receipt_items ri ON u.id = ri.user_id;
