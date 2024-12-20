#!/usr/bin/env bash

# ANSI color codes for output messages
GREEN='\033[0;32m'  # Green for success
RED='\033[0;31m'    # Red for error
YELLOW='\033[0;33m'
NC='\033[0m'        # No color

# Function to print colored messages
print_message() {
    local msg="$1"
    local color="$2"
    echo -e "${color}${msg}${NC}"
}

# Function to install pip on Linux
install_pip_linux() {
    print_message "pip is not installed. Installing pip..." "$RED"
    sudo apt update && sudo apt install -y python3-pip
    if [ $? -eq 0 ]; then
        print_message "pip installed successfully!" "$GREEN"
    else
        print_message "Error: Failed to install pip. Please try manually." "$RED"
        exit 1
    fi
}

# Check if pip is installed, install it if not found
if ! command -v pip &> /dev/null; then
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        install_pip_linux
    else
        print_message "Error: Unsupported platform. Please install pip manually." "$RED"
        exit 1
    fi
fi

# Check if the correct number of arguments is provided
if [ "$#" -eq 1 ]; then
    # Handle the case argument (1 or 2)
    case "$1" in
        1)
            # Write installed packages and versions to requirements.txt
            if pip freeze > requirements.txt; then
                print_message "Packages and versions written to requirements.txt" "$GREEN"
            else
                print_message "Error: Failed to write to requirements.txt" "$RED"
                exit 1
            fi
            ;;
        2)
            # Check if requirements.txt exists before attempting to install
            if [ -f requirements.txt ]; then
                if pip install -r requirements.txt; then
                    print_message "Packages from requirements.txt installed successfully" "$GREEN"
                else
                    print_message "Error: Failed to install packages from requirements.txt" "$RED"
                    exit 1
                fi
            else
                print_message "Error: requirements.txt file not found" "$RED"
                exit 1
            fi
            ;;
        *)
            # Invalid option
            print_message "Usage: $0 {1|2}" "$RED"
            ;;
    esac
else
    # Help message for invalid or missing arguments
	print_message "To write installed packages of the environment to requirements.txt: Usage: $0 1" "$YELLOW"
	print_message "To install packages from requirements.txt: Usage: $0 2" "$YELLOW"
fi
