#!/bin/bash

# Replace these variables with your actual database credentials
DB_NAME="carbnr_dev_db"
BACKUP_DIR="."

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create a timestamp for the backup file
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Check if mysqldump command is available
if ! command -v mysqldump &> /dev/null; then
    echo -e "${RED}Error: mysqldump command not found. Please install MySQL client utilities.${NC}" >&2
    exit 1
fi

# Perform the database backup
echo -e "${YELLOW}Starting backup for database: $DB_NAME${NC}"
if mysqldump -u root "$DB_NAME" > "$BACKUP_FILE"; then
    echo -e "${GREEN}Backup successful! File saved as: $BACKUP_FILE${NC}"
else
    echo -e "${RED}Error: Failed to back up the database. Check database credentials and permissions.${NC}" >&2
    exit 1
fi

# Optionally, compress the backup file
if gzip "$BACKUP_FILE"; then
    echo -e "${GREEN}Backup compressed successfully! File saved as: ${BACKUP_FILE}.gz${NC}"
else
    echo -e "${RED}Error: Failed to compress the backup file.${NC}" >&2
    exit 1
fi
