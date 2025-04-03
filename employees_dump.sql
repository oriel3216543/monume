-- Create users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    name TEXT,
    role TEXT CHECK(role IN ('admin', 'manager', 'employee')),
    location TEXT
);

-- Insert initial data into users table
INSERT INTO users (username, password, email, name, role, location) VALUES
('admin', 'adminpass', 'admin@example.com', 'Admin User', 'admin', 'Head Office'),
('manager', 'managerpass', 'manager@example.com', 'Manager User', 'manager', 'Branch Office'),
('employee', 'employeepass', 'employee@example.com', 'Employee User', 'employee', 'Store 1');

-- Create employee_responses table
CREATE TABLE employee_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date TEXT DEFAULT CURRENT_DATE,
    opal_demos INTEGER,
    opal_sales INTEGER,
    scan_demos INTEGER,
    scan_sold INTEGER,
    net_sales REAL,
    hours_worked REAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create locations table
CREATE TABLE locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_name TEXT,
    mall TEXT
);

-- Insert initial data into locations table
INSERT INTO locations (location_name, mall) VALUES
('Main Store', 'Central Mall'),
('Branch Store', 'West Mall');
