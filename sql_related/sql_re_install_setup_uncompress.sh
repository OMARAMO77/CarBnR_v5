#!/usr/bin/env bash

# Color variables
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ensure an argument is passed for the backup file
if [ -z "$1" ]; then
  echo -e "${RED}Error: No SQL backup file provided.${NC}"
  echo -e "${YELLOW}Usage: $0 <backup_file.sql.gz>${NC}"
  exit 1
fi

# Navigate to the SQL-related folder
cd /CarBnR_v4/sql_related || { echo -e "${RED}Failed to navigate to directory!${NC}"; exit 1; }

# Reinstall MySQL
echo -e "${GREEN}Reinstalling MySQL...${NC}"
./re_install_MySQL.sh

# Setup MySQL databases
echo -e "${GREEN}Setting up MySQL databases...${NC}"
./setup_mysql.sh

# Uncompress and load the specified backup file
echo -e "${GREEN}Uncompressing and loading backup file: $1...${NC}"
./uncompressAndLoad.sh "$1"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Backup loaded successfully!${NC}"
else
  echo -e "${RED}Error loading the backup file.${NC}"
  exit 1
fi
