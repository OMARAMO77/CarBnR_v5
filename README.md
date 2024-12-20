# CarBnR - Car Booking and Renting Web App

## Introduction

Welcome to CarBnR, the ultimate web app for hassle-free car browsing and booking. Designed with simplicity in mind, you can explore available cars without the need to sign up initially. Only when you decide to book a car will you be prompted to create an account or log in, choose your rental dates, and confirm the booking.

- **Deployed Site:** [CarBnR Web App](https://www.eromo.tech)
- **Final Project Blog Article:** [CarBnR Blog](https://github.com/OMARAMO77/Blog-Post-Portfolio?tab=readme-ov-file#carbnr---car-booking-and-renting-web-app)
- **Author(s) LinkedIn:**
  - [Omar ACHKIR](https://www.linkedin.com/in/OMARAMO77/)

![CarBnR Screenshot](https://github.com/OMARAMO77/CarBnR_v3/blob/master/web-app3.png)

## Installation

To get started with CarBnR, follow these steps:

1. Clone the repository: `git clone https://github.com/OMARAMO77/CarBnR.git`
2. Navigate to the project directory: `cd CarBnR`
3. Set up the MySQL database: `mysql -u username -p < schema.sql`
4. Configure Nginx for CarBnR: Example configuration file in `/nginx-config/carbnr.conf`.
5. Set up your Python virtual environment: `python -m venv venv`
6. Activate the virtual environment: `source venv/bin/activate` (Linux)
7. Install Python dependencies: `pip install -r requirements.txt`
8. Start the Python application: `python3 carbnr/app.py`

## Tech Stack

CarBnR leverages the following technologies:

- **Linux:** The operating system providing a robust and secure environment.
- **Nginx:** The web server ensuring efficient handling of HTTP requests.
- **MySQL:** The relational database for storing user data, car information, and booking details.
- **Python:** The programming language used for backend development.

## Usage

CarBnR offers a straightforward process for users:

1. **Browse Cars:** Explore the available cars without the need to sign up initially.
2. **Book a Car:** Sign up or log in when ready to book, choose your rental dates, and confirm the booking.
3. **User Profiles:** Create and manage your user profile, including rental history.

---

## The CarBnR Story

### Inspiration

CarBnR was conceived to simplify the car booking process. We wanted users to have the freedom to explore available cars before committing to the booking process, creating a user-centric experience.

### Technical Details

We chose the Nginx and Python stack for its flexibility and efficiency. The primary technical challenge revolved around developing a seamless booking system that maintains a user-friendly flow, allowing users to engage only when ready to confirm a booking.

### Challenges Faced

The main challenge was refining the booking system to ensure a smooth transition from browsing to booking. Overcoming this challenge required careful consideration of user experience and database management.

### Vision for the Future

Looking forward, CarBnR aims to further enhance the booking system, refine the user interface, and explore additional features. As a prototype, there's room for growth and expansion, and we invite the community to contribute to shaping the future of CarBnR.

Thank you for being part of the CarBnR journey!
