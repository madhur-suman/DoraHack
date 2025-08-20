-- User Management Utilities for Multi-User Receipt System
-- This script provides administrative functions for managing users and their data

-- Function to create a new user
CREATE OR REPLACE FUNCTION create_user(
    p_username VARCHAR,
    p_email VARCHAR DEFAULT NULL,
    p_full_name VARCHAR DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    new_user_id INTEGER;
BEGIN
    INSERT INTO users (username, email, full_name)
    VALUES (p_username, p_email, p_full_name)
    RETURNING id INTO new_user_id;
    
    RAISE NOTICE 'User "%" created with ID: %', p_username, new_user_id;
    RETURN new_user_id;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'User "%" already exists', p_username;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to deactivate a user (soft delete)
CREATE OR REPLACE FUNCTION deactivate_user(p_username VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE users 
    SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE username = p_username;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows > 0 THEN
        RAISE NOTICE 'User "%" has been deactivated', p_username;
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'User "%" not found', p_username;
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to reactivate a user
CREATE OR REPLACE FUNCTION reactivate_user(p_username VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE users 
    SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE username = p_username;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows > 0 THEN
        RAISE NOTICE 'User "%" has been reactivated', p_username;
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'User "%" not found', p_username;
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to transfer all items from one user to another
CREATE OR REPLACE FUNCTION transfer_user_data(
    p_from_username VARCHAR,
    p_to_username VARCHAR
) RETURNS INTEGER AS $$
DECLARE
    from_user_id INTEGER;
    to_user_id INTEGER;
    transferred_count INTEGER;
BEGIN
    -- Get user IDs
    SELECT id INTO from_user_id FROM users WHERE username = p_from_username AND is_active = TRUE;
    SELECT id INTO to_user_id FROM users WHERE username = p_to_username AND is_active = TRUE;
    
    IF from_user_id IS NULL THEN
        RAISE EXCEPTION 'Source user "%" not found or inactive', p_from_username;
    END IF;
    
    IF to_user_id IS NULL THEN
        RAISE EXCEPTION 'Target user "%" not found or inactive', p_to_username;
    END IF;
    
    -- Transfer the data
    UPDATE receipt_items 
    SET user_id = to_user_id, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = from_user_id;
    
    GET DIAGNOSTICS transferred_count = ROW_COUNT;
    
    RAISE NOTICE 'Transferred % items from user "%" to user "%"', 
                 transferred_count, p_from_username, p_to_username;
    
    RETURN transferred_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user details and statistics
CREATE OR REPLACE FUNCTION get_user_details(p_username VARCHAR)
RETURNS TABLE (
    user_id INTEGER,
    username VARCHAR,
    email VARCHAR,
    full_name VARCHAR,
    is_active BOOLEAN,
    total_items BIGINT,
    total_spent NUMERIC,
    avg_item_price NUMERIC,
    last_purchase_date TIMESTAMP,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.is_active,
        COUNT(ri.id)::BIGINT,
        COALESCE(SUM(ri.total_amount), 0),
        COALESCE(AVG(ri.price), 0),
        MAX(ri.created_at),
        u.created_at
    FROM users u
    LEFT JOIN receipt_items ri ON u.id = ri.user_id
    WHERE u.username = p_username
    GROUP BY u.id, u.username, u.email, u.full_name, u.is_active, u.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to list all users with their statistics
CREATE OR REPLACE FUNCTION list_all_users()
RETURNS TABLE (
    user_id INTEGER,
    username VARCHAR,
    email VARCHAR,
    full_name VARCHAR,
    is_active BOOLEAN,
    total_items BIGINT,
    total_spent NUMERIC,
    avg_item_price NUMERIC,
    last_purchase_date TIMESTAMP,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.is_active,
        COUNT(ri.id)::BIGINT,
        COALESCE(SUM(ri.total_amount), 0),
        COALESCE(AVG(ri.price), 0),
        MAX(ri.created_at),
        u.created_at
    FROM users u
    LEFT JOIN receipt_items ri ON u.id = ri.user_id
    GROUP BY u.id, u.username, u.email, u.full_name, u.is_active, u.created_at
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's recent purchases
CREATE OR REPLACE FUNCTION get_user_recent_purchases(
    p_username VARCHAR,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    item_name VARCHAR,
    quantity INTEGER,
    price NUMERIC,
    total_amount NUMERIC,
    store_name VARCHAR,
    purchase_date DATE,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ri.item_name,
        ri.quantity,
        ri.price,
        ri.total_amount,
        ri.store_name,
        ri.purchase_date,
        ri.created_at
    FROM users u
    JOIN receipt_items ri ON u.id = ri.user_id
    WHERE u.username = p_username AND u.is_active = TRUE
    ORDER BY ri.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's spending by category
CREATE OR REPLACE FUNCTION get_user_spending_by_category(p_username VARCHAR)
RETURNS TABLE (
    category VARCHAR,
    total_items BIGINT,
    total_spent NUMERIC,
    avg_item_price NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ri.category, 'Uncategorized') as category,
        COUNT(ri.id)::BIGINT,
        COALESCE(SUM(ri.total_amount), 0),
        COALESCE(AVG(ri.price), 0)
    FROM users u
    JOIN receipt_items ri ON u.id = ri.user_id
    WHERE u.username = p_username AND u.is_active = TRUE
    GROUP BY ri.category
    ORDER BY total_spent DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's spending by store
CREATE OR REPLACE FUNCTION get_user_spending_by_store(p_username VARCHAR)
RETURNS TABLE (
    store_name VARCHAR,
    total_items BIGINT,
    total_spent NUMERIC,
    avg_item_price NUMERIC,
    last_visit_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ri.store_name, 'Unknown Store') as store_name,
        COUNT(ri.id)::BIGINT,
        COALESCE(SUM(ri.total_amount), 0),
        COALESCE(AVG(ri.price), 0),
        MAX(ri.purchase_date)
    FROM users u
    JOIN receipt_items ri ON u.id = ri.user_id
    WHERE u.username = p_username AND u.is_active = TRUE
    GROUP BY ri.store_name
    ORDER BY total_spent DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_user(VARCHAR, VARCHAR, VARCHAR) TO shikhar;
GRANT EXECUTE ON FUNCTION deactivate_user(VARCHAR) TO shikhar;
GRANT EXECUTE ON FUNCTION reactivate_user(VARCHAR) TO shikhar;
GRANT EXECUTE ON FUNCTION transfer_user_data(VARCHAR, VARCHAR) TO shikhar;
GRANT EXECUTE ON FUNCTION get_user_details(VARCHAR) TO shikhar;
GRANT EXECUTE ON FUNCTION list_all_users() TO shikhar;
GRANT EXECUTE ON FUNCTION get_user_recent_purchases(VARCHAR, INTEGER) TO shikhar;
GRANT EXECUTE ON FUNCTION get_user_spending_by_category(VARCHAR) TO shikhar;
GRANT EXECUTE ON FUNCTION get_user_spending_by_store(VARCHAR) TO shikhar;

-- Example usage queries:
-- SELECT * FROM create_user('john_doe', 'john@example.com', 'John Doe');
-- SELECT * FROM get_user_details('alice');
-- SELECT * FROM list_all_users();
-- SELECT * FROM get_user_recent_purchases('alice', 5);
-- SELECT * FROM get_user_spending_by_category('alice');
-- SELECT * FROM get_user_spending_by_store('alice');
-- SELECT * FROM transfer_user_data('default_user', 'alice');
