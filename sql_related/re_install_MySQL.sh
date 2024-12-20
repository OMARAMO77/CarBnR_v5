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

# Function to check if MySQL is installed
is_mysql_installed() {
    dpkg -l | grep -q mysql-server
}

# Stop the MySQL service if MySQL is installed
if is_mysql_installed; then
    print_message "MySQL is installed. Stopping MySQL service..." "$GREEN"
    if ! sudo service mysql stop; then
        print_message "Failed to stop MySQL service." "$RED"
        exit 1
    fi

    # Remove MySQL and its configuration
    print_message "Purging MySQL packages..." "$GREEN"
    if ! sudo apt-get -y purge mysql-server mysql-client mysql-common mysql-server-core-* mysql-client-core-*; then
        print_message "Failed to purge MySQL packages." "$RED"
        exit 1
    fi

    # Remove MySQL data directories
    print_message "Removing MySQL directories..." "$GREEN"
    if ! sudo rm -rf /etc/mysql/ /var/lib/mysql/; then
        print_message "Failed to remove MySQL directories." "$RED"
        exit 1
    fi

    # Clean up unused packages and cache
    print_message "Cleaning up packages..." "$GREEN"
    if ! sudo apt-get -y autoremove || ! sudo apt-get -y autoclean; then
        print_message "Failed to clean up packages." "$RED"
        exit 1
    fi
else
    print_message "MySQL is not installed. Proceeding with installation..." "$GREEN"
fi

# Update package list
print_message "Updating package list..." "$GREEN"
if ! sudo apt-get -y update; then
    print_message "Failed to update package list." "$RED"
    exit 1
fi

# Reinstall MySQL server and client
print_message "Installing MySQL server and client..." "$GREEN"
if ! sudo apt-get -y install mysql-server mysql-client; then
    print_message "Failed to install MySQL server and client." "$RED"
    exit 1
fi

# Optionally secure MySQL installation
print_message "MySQL installation complete. It's recommended to secure the installation by running 'sudo mysql_secure_installation'." "$GREEN"

# Start the MySQL service
print_message "Starting MySQL service..." "$GREEN"
if ! sudo service mysql start; then
    print_message "Failed to start MySQL service." "$RED"
    exit 1
fi

# Check MySQL service status
print_message "Checking MySQL service status..." "$GREEN"
sudo service mysql status
