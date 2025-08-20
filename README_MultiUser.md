# Multi-User Receipt OCR Handler

A comprehensive receipt processing system that supports multiple users with isolated data and enhanced features.

## 🏗️ Architecture Overview

### Multi-Tenant Database Design
- **User Isolation**: Each user has their own isolated data
- **Enhanced Schema**: Rich metadata tracking (store names, categories, purchase dates)
- **Scalable**: Supports unlimited users with efficient indexing
- **Secure**: Data isolation enforced at database level

### Key Features
- 📤 **Receipt Upload & OCR**: Extract text from receipt images
- 🏗️ **Structured Data Extraction**: AI-powered item parsing
- 💾 **Multi-User Storage**: Isolated data per user
- 📊 **Advanced Analytics**: Spending by category, store, time
- 🔍 **Smart Queries**: Natural language questions about your data
- 👥 **User Management**: Create, manage, and transfer user data

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Receipt Items Table
```sql
CREATE TABLE receipt_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    receipt_id VARCHAR(255),
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    total_amount NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * price) STORED,
    category VARCHAR(100),
    store_name VARCHAR(255),
    purchase_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_receipt_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🚀 Quick Start

### 1. Fresh Installation
```bash
# Clone the repository
git clone <your-repo>
cd DoraHack

# Start with Docker Compose
docker compose up --build
```

### 2. Migration from Single-User
If you have existing single-user data:

```bash
# Connect to your PostgreSQL database
psql -h localhost -U shikhar -d receipt_db

# Run the migration script
\i migrate_to_multi_user.sql
```

The migration will:
- Create the `users` table
- Add `user_id` column to existing data
- Assign existing data to a `default_user`
- Add enhanced fields and constraints
- Create indexes for performance

## 👥 User Management

### Creating Users
```sql
-- Using the helper function
SELECT create_user('john_doe', 'john@example.com', 'John Doe');

-- Or direct SQL
INSERT INTO users (username, email, full_name) 
VALUES ('jane_smith', 'jane@example.com', 'Jane Smith');
```

### User Operations
```sql
-- Get user details and statistics
SELECT * FROM get_user_details('alice');

-- List all users
SELECT * FROM list_all_users();

-- Deactivate a user (soft delete)
SELECT deactivate_user('inactive_user');

-- Reactivate a user
SELECT reactivate_user('reactivated_user');

-- Transfer data between users
SELECT transfer_user_data('old_user', 'new_user');
```

### User Analytics
```sql
-- Recent purchases
SELECT * FROM get_user_recent_purchases('alice', 10);

-- Spending by category
SELECT * FROM get_user_spending_by_category('alice');

-- Spending by store
SELECT * FROM get_user_spending_by_store('alice');
```

## 🎯 Usage Examples

### Streamlit App
1. **Set Username**: In the sidebar, enter your username
2. **Upload Receipt**: Drag & drop or select receipt image
3. **Extract Text**: Click "Extract Text (OCR)" to get raw text
4. **Parse Data**: Click "Extract Structured Data" to get items
5. **Add Metadata**: Optionally add store name, purchase date
6. **Save**: Click "Save to Database" to store your data
7. **Query**: Ask questions about your spending patterns

### API Usage
```bash
# Process a receipt
curl -X POST "http://localhost:8000/process_receipt" \
  -F "file=@receipt.jpg"

# Save items with metadata
curl -X POST "http://localhost:8000/save_items" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"item_name": "Milk", "quantity": 1, "price": 3.49}
    ],
    "username": "alice",
    "receipt_id": "RCPT001",
    "store_name": "Fresh Market",
    "purchase_date": "2024-01-15"
  }'
```

## 📊 Enhanced Features

### Receipt Metadata
- **Receipt ID**: Unique identifier for each receipt
- **Store Name**: Track spending by store
- **Purchase Date**: Time-based analytics
- **Categories**: Automatic or manual categorization

### Analytics & Insights
- **Spending Patterns**: By category, store, time period
- **Budget Tracking**: Monitor expenses over time
- **Store Preferences**: See where you shop most
- **Item Analysis**: Most/least purchased items

### Data Integrity
- **Constraints**: Positive quantities, non-negative prices
- **Computed Fields**: Automatic total amount calculation
- **Timestamps**: Track creation and updates
- **Soft Deletes**: Deactivate users without losing data

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://shikhar:shikhar@localhost/receipt_db

# Ollama (for AI processing)
OLLAMA_BASE_URL=http://ollama:11434

# Default user
APP_USERNAME=alice
```

### Docker Compose Services
- **PostgreSQL**: Database with multi-user schema
- **Ollama**: AI model for text processing
- **Streamlit**: Web interface
- **FastAPI**: REST API (optional)

## 📈 Performance Optimization

### Database Indexes
- `idx_receipt_items_user`: Fast user data retrieval
- `idx_receipt_items_category`: Category-based queries
- `idx_receipt_items_store`: Store-based analytics
- `idx_receipt_items_purchase_date`: Time-based queries
- `idx_receipt_items_price_range`: Price-based filtering

### Query Optimization
- **User Views**: Pre-filtered data for each user
- **Computed Columns**: Automatic total calculations
- **Efficient Joins**: Optimized user-item relationships

## 🔒 Security & Privacy

### Data Isolation
- **User-Scoped Queries**: All queries filtered by user_id
- **Foreign Key Constraints**: Enforce data relationships
- **Cascade Deletes**: Clean up when users are removed

### Access Control
- **Username-Based**: Simple but effective user identification
- **Active Status**: Soft delete capability
- **Audit Trail**: Creation and update timestamps

## 🛠️ Troubleshooting

### Common Issues

1. **Migration Errors**
   ```sql
   -- Check if migration is needed
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'receipt_items' AND column_name = 'user_id';
   ```

2. **User Not Found**
   ```sql
   -- Check user status
   SELECT username, is_active FROM users WHERE username = 'your_username';
   ```

3. **Data Isolation Issues**
   ```sql
   -- Verify user data isolation
   SELECT COUNT(*) FROM receipt_items WHERE user_id = 
     (SELECT id FROM users WHERE username = 'your_username');
   ```

### Performance Issues
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes WHERE tablename = 'receipt_items';

-- Analyze table statistics
ANALYZE receipt_items;
```

## 🚀 Future Enhancements

### Planned Features
- **Authentication**: Secure login system
- **Role-Based Access**: Admin vs regular users
- **Data Export**: CSV, PDF, Excel export
- **Advanced Analytics**: Machine learning insights
- **Mobile App**: Native mobile interface
- **Real-time Sync**: Multi-device synchronization

### Scalability Improvements
- **Database Sharding**: Horizontal scaling
- **Caching Layer**: Redis for performance
- **Microservices**: Service-oriented architecture
- **API Rate Limiting**: Prevent abuse

## 📞 Support

### Getting Help
1. Check the troubleshooting section
2. Review database logs: `docker logs receipt-postgres`
3. Check application logs: `docker logs receipt-streamlit`
4. Verify database connectivity
5. Ensure all services are running

### Useful Commands
```bash
# Check service status
docker compose ps

# View logs
docker compose logs -f streamlit-app

# Database backup
docker exec receipt-postgres pg_dump -U shikhar receipt_db > backup.sql

# Database restore
docker exec -i receipt-postgres psql -U shikhar receipt_db < backup.sql
```

---

**Happy Multi-User Receipt Processing! 🧾👥✨**
