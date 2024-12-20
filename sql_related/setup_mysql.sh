#!/usr/bin/env bash

# ANSI color codes for output messages
GREEN='\033[0;32m'  # Green for success
RED='\033[0;31m'    # Red for error
NC='\033[0m'        # No color

# Function to print colored messages
print_message() {
    local msg="$1"
    local color="$2"
    echo -e "${color}${msg}${NC}"
}

# Check if MySQL is running
if sudo service mysql status > /dev/null 2>&1; then
    print_message "MySQL service is running." "$GREEN"
else
    print_message "MySQL service is not running. Attempting to start MySQL..." "$RED"
    if sudo service mysql start; then
        print_message "MySQL service started successfully." "$GREEN"
    else
        print_message "Failed to start MySQL service. Please check the logs." "$RED"
        exit 1
    fi
fi

# Check if SQL files exist
if [ ! -f setup_mysql_dev.sql ]; then
    print_message "setup_mysql_dev.sql not found." "$RED"
    exit 1
else
    print_message "Found setup_mysql_dev.sql." "$GREEN"
fi

if [ ! -f setup_mysql_test.sql ]; then
    print_message "setup_mysql_test.sql not found." "$RED"
    exit 1
else
    print_message "Found setup_mysql_test.sql." "$GREEN"
fi

# Execute SQL scripts
print_message "Running setup_mysql_dev.sql..." "$GREEN"
if cat setup_mysql_dev.sql | mysql; then
    print_message "setup_mysql_dev.sql executed successfully." "$GREEN"
else
    print_message "Error executing setup_mysql_dev.sql." "$RED"
    exit 1
fi

print_message "Running setup_mysql_test.sql..." "$GREEN"
if cat setup_mysql_test.sql | mysql; then
    print_message "setup_mysql_test.sql executed successfully." "$GREEN"
else
    print_message "Error executing setup_mysql_test.sql." "$RED"
    exit 1
fi

print_message "SQL scripts executed successfully." "$GREEN"

echo "SHOW DATABASES;" | mysql
