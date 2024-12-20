CREATE DATABASE IF NOT EXISTS carbnr_test_db;
CREATE USER IF NOT EXISTS 'carbnr_test'@'localhost' IDENTIFIED BY 'carbnr_test_pwd';
GRANT ALL PRIVILEGES ON `carbnr_test_db`.* TO 'carbnr_test'@'localhost';
GRANT SELECT ON `performance_schema`.* TO 'carbnr_test'@'localhost';
FLUSH PRIVILEGES;
