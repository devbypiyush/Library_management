SELECT VERSION();

CREATE DATABASE IF NOT EXISTS libraria;
USE libraria;
SHOW TABLES;

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(30) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    total_copies INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CHECK (total_copies >= 0),
    CHECK (available_copies >= 0),
    CHECK (available_copies <= total_copies)
);

CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30),

    membership_type ENUM(
        'Student',
        'Faculty',
        'Staff',
        'Premium'
    ) NOT NULL DEFAULT 'Student',

    membership_status ENUM(
        'Active',
        'Suspended',
        'Expired'
    ) NOT NULL DEFAULT 'Active',

    joined_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    issue_limit INT NOT NULL DEFAULT 3,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issues (
    id INT AUTO_INCREMENT PRIMARY KEY,

    book_id INT NOT NULL,
    member_id INT NOT NULL,

    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE NULL,

    status ENUM(
        'Issued',
        'Returned',
        'Overdue'
    ) NOT NULL DEFAULT 'Issued',

    fine DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (book_id)
        REFERENCES books(id)
        ON UPDATE CASCADE,

    FOREIGN KEY (member_id)
        REFERENCES members(id)
        ON UPDATE CASCADE,

    INDEX idx_issue_status (status),
    INDEX idx_issue_member (member_id),
    INDEX idx_issue_book (book_id)
);

CREATE TABLE IF NOT EXISTS returns_log (
    id INT AUTO_INCREMENT PRIMARY KEY,

    issue_id INT NOT NULL UNIQUE,

    return_date DATE NOT NULL,
    late_days INT NOT NULL DEFAULT 0,
    fine DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (issue_id)
        REFERENCES issues(id)
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,

    book_id INT NOT NULL,
    member_id INT NOT NULL,

    reservation_date DATE NOT NULL,
    expiry_date DATE NOT NULL,

    status ENUM(
        'Pending',
        'Fulfilled',
        'Cancelled',
        'Expired'
    ) NOT NULL DEFAULT 'Pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (book_id)
        REFERENCES books(id)
        ON UPDATE CASCADE,

    FOREIGN KEY (member_id)
        REFERENCES members(id)
        ON UPDATE CASCADE,

    INDEX idx_reservation_status (status)
);

SHOW TABLES;

INSERT INTO books
(title, author, isbn, category, total_copies, available_copies)
VALUES
('Clean Code',
 'Robert C. Martin',
 '9780132350884',
 'Technology',
 18,
 18),

('The Alchemist',
 'Paulo Coelho',
 '9780062315007',
 'Fiction',
 24,
 24),

('Atomic Habits',
 'James Clear',
 '9780735211292',
 'Business',
 32,
 32),

('The Great Gatsby',
 'F. Scott Fitzgerald',
 '9780743273565',
 'Fiction',
 14,
 14),

('A Brief History of Time',
 'Stephen Hawking',
 '9780553380163',
 'Science',
 12,
 12),

('Sapiens',
 'Yuval Noah Harari',
 '9780062316097',
 'History',
 8,
 8);
 
 SELECT * FROM books;
 
 SELECT
    i.id,
    b.title AS book,
    m.name AS member,
    i.issue_date,
    i.due_date,
    i.status
FROM issues i
JOIN books b
    ON i.book_id = b.id
JOIN members m
    ON i.member_id = m.id;
    
    