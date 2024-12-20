CREATE DATABASE IF NOT EXISTS carbnr_dev_db;
CREATE USER IF NOT EXISTS 'carbnr_dev'@'localhost' IDENTIFIED BY 'carbnr_dev_pwd';
GRANT ALL PRIVILEGES ON `carbnr_dev_db`.* TO 'carbnr_dev'@'localhost';
GRANT SELECT ON `performance_schema`.* TO 'carbnr_dev'@'localhost';
FLUSH PRIVILEGES;
