# Database Setup Instructions

## Prerequisites
- MySQL Server installed and running
- MySQL Workbench or command-line access

## Step-by-Step Setup

### 1. Configure Environment Variables

1. Navigate to the `Backend` directory
2. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
3. Edit `.env` file with your MySQL credentials:
   ```
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your_actual_mysql_password
   MYSQL_DBNAME=university_management
   
   JWT_SECRET=your_secure_random_string_here
   JWT_EXPIRATION=7d
   
   PORT=5000
   ```

### 2. Create Database and Tables

**Option A: Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your MySQL server
3. File → Open SQL Script → Select `schema.sql`
4. Click the lightning bolt icon to execute

**Option B: Using Command Line**
```bash
# Login to MySQL
mysql -u root -p

# Run the schema file
source path/to/Backend/schema.sql

# Or in one command:
mysql -u root -p < Backend/schema.sql
```

**Option C: Using PowerShell (Windows)**
```powershell
# Navigate to Backend directory
cd Backend

# Execute schema
Get-Content schema.sql | mysql -u root -p
```

### 3. Verify Database Setup

```sql
-- Login to MySQL and run:
USE university_management;
SHOW TABLES;

-- You should see:
-- - entities
-- - attributes
-- - entity_attribute

-- Check if default attributes are created:
SELECT * FROM attributes;
```

### 4. Restart Backend Server

After configuring the `.env` file:
```bash
# Stop the current server (Ctrl+C)
# Start it again
npm start
```

## Troubleshooting

### Error: "Access denied for user"
- Check your MySQL username and password in `.env`
- Make sure MySQL server is running
- Verify user has permission to create databases

### Error: "Database does not exist"
- Run the `schema.sql` file first
- Make sure database name in `.env` matches the one created

### Error: "Table doesn't exist"
- Ensure all three tables were created (entities, attributes, entity_attribute)
- Re-run the `schema.sql` file

## Email Domains for Registration

The system uses email domains to determine user types:
- Students: `username@ums-student.com`
- Doctors: `username@ums-doctor.com`
- Admins: `username@admin.com` (signup blocked, must be created manually)

## Next Steps

After setup, you can:
1. Test the signup endpoint with a student or doctor email
2. Check the database to see the EAV structure in action
3. Add more attributes as needed for your use case
