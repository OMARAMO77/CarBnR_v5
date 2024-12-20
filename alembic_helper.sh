#!/usr/bin/env bash

# ANSI color codes for output messages
GREEN='\033[0;32m'  # Green for success
RED='\033[0;31m'    # Red for error
YELLOW='\033[0;33m' # Yellow for usage instructions
NC='\033[0m'        # No color

# Function to print colored messages
print_message() {
    local msg="$1"
    local color="$2"
    echo -e "${color}${msg}${NC}"
}

# Check if the correct number of arguments is provided
if [ "$#" -eq 1 ]; then
    # Handle the case argument (1, 2 or 3)
    case "$1" in
        1)
            # Create a new migration script
            if alembic revision --autogenerate -m "Migration message"; then
                print_message "Migration script created successfully!" "$GREEN"
            else
                print_message "Error: Failed to create migration script." "$RED"
                exit 1
            fi
            ;;
        2)
            # Upgrade the database to the latest migration
            if alembic upgrade head; then
                print_message "Database upgraded to the latest migration successfully!" "$GREEN"
            else
                print_message "Error: Failed to upgrade the database." "$RED"
                exit 1
            fi
            ;;
        3)
            # Downgrade the database by one migration
            if alembic downgrade -1; then
                print_message "Database downgraded by one migration successfully!" "$GREEN"
            else
                print_message "Error: Failed to downgrade the database." "$RED"
                exit 1
            fi
            ;;
        *)
            # Invalid option
            print_message "Invalid option: $1" "$RED"
            print_message "Usage: $0 {1|2|3}" "$YELLOW"
            ;;
    esac
else
    # Display help message for invalid or missing arguments
    print_message "Usage Instructions:" "$YELLOW"
    print_message "  To create a migration script: $0 1" "$YELLOW"
    print_message "  To upgrade the database:       $0 2" "$YELLOW"
    print_message "  To downgrade the database:     $0 3" "$YELLOW"
fi
