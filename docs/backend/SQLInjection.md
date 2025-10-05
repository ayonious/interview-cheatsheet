---
id: SQLInjection
title: SQL Injection
sidebar_label: SQL Injection
---

## What is SQL Injection?

SQL Injection is a security vulnerability that allows attackers to interfere with database queries by injecting malicious SQL code through user input. It occurs when an application incorporates untrusted data into SQL queries without proper validation or escaping.

### Example of Vulnerable Code

```javascript
// VULNERABLE - DO NOT USE
const username = req.body.username;
const password = req.body.password;
const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
db.query(query);
```

If an attacker inputs `admin' OR '1'='1` as the username, the query becomes:

```sql
SELECT * FROM users WHERE username = 'admin' OR '1'='1' AND password = ''
```

This returns all users since `'1'='1'` is always true, bypassing authentication.

### Common Attack Patterns

1. **Authentication Bypass**
   ```sql
   ' OR '1'='1
   admin'--
   admin' #
   ```

2. **Data Extraction**
   ```sql
   ' UNION SELECT username, password FROM users--
   ```

3. **Data Modification/Deletion**
   ```sql
   '; DROP TABLE users;--
   '; UPDATE users SET password='hacked' WHERE '1'='1
   ```

4. **Blind SQL Injection** (when errors aren't shown)
   ```sql
   ' AND SLEEP(5)--
   ' AND (SELECT COUNT(*) FROM users) > 10--
   ```

## How to Prevent SQL Injection

### 1. Parameterized Queries (Prepared Statements)

The most effective defense against SQL injection.

#### Node.js with PostgreSQL (pg)
```javascript
// SAFE
const query = 'SELECT * FROM users WHERE username = $1 AND password = $2';
const values = [username, password];
const result = await client.query(query, values);
```

#### Node.js with MySQL (mysql2)
```javascript
// SAFE
const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
const result = await connection.execute(query, [username, password]);
```

#### Python with SQLite
```python
# SAFE
cursor.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, password))
```

#### Python with PostgreSQL (psycopg2)
```python
# SAFE
cursor.execute('SELECT * FROM users WHERE username = %s AND password = %s', (username, password))
```

#### Java with JDBC
```java
// SAFE
String query = "SELECT * FROM users WHERE username = ? AND password = ?";
PreparedStatement stmt = connection.prepareStatement(query);
stmt.setString(1, username);
stmt.setString(2, password);
ResultSet rs = stmt.executeQuery();
```

#### PHP with PDO
```php
// SAFE
$stmt = $pdo->prepare('SELECT * FROM users WHERE username = :username AND password = :password');
$stmt->execute(['username' => $username, 'password' => $password]);
```

### 2. ORM/Query Builders

Modern ORMs automatically handle parameterization:

```javascript
// Sequelize (Node.js)
User.findOne({
  where: {
    username: username,
    password: password
  }
});

// TypeORM (Node.js/TypeScript)
userRepository.findOne({
  where: { username, password }
});

// SQLAlchemy (Python)
session.query(User).filter_by(username=username, password=password).first()

// Hibernate (Java)
session.createQuery("FROM User WHERE username = :username AND password = :password")
       .setParameter("username", username)
       .setParameter("password", password)
       .uniqueResult();
```

### 3. Input Validation

While not sufficient alone, validation adds an extra layer:

```javascript
// Whitelist allowed characters
const isValidUsername = /^[a-zA-Z0-9_]{3,20}$/.test(username);

// Validate email format
const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Reject if validation fails
if (!isValidUsername) {
  throw new Error('Invalid username format');
}
```

### 4. Least Privilege Principle

Database users should have minimal permissions:

```sql
-- Create read-only user for reporting
CREATE USER report_user WITH PASSWORD 'password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO report_user;

-- Create limited user for application
CREATE USER app_user WITH PASSWORD 'password';
GRANT SELECT, INSERT, UPDATE ON specific_tables TO app_user;
-- Do NOT grant DROP, CREATE, or admin privileges
```

### 5. Escape User Input (Last Resort)

Only if parameterization is impossible:

```javascript
// Node.js with mysql
const mysql = require('mysql');
const escapedUsername = mysql.escape(username);
// Still vulnerable to certain attacks - use parameterized queries instead
```

## Why Parameterization Prevents SQL Injection

### The Problem with String Concatenation

When you build SQL queries using string concatenation:

```javascript
const query = `SELECT * FROM users WHERE username = '${username}'`;
```

The database receives and parses this as **executable SQL code**. If `username` contains SQL syntax (like `' OR '1'='1`), the database interprets it as part of the query structure.

### How Parameterized Queries Work

With parameterized queries:

```javascript
const query = 'SELECT * FROM users WHERE username = $1';
const values = [username];
```

**What happens under the hood:**

1. **Separation of Query Structure and Data**
   - The SQL query structure is sent to the database first: `SELECT * FROM users WHERE username = $1`
   - The database parses and compiles this structure
   - The query structure is locked at this point

2. **Parameter Binding**
   - User input (`username`) is sent separately as data
   - The database treats the entire value as a **string literal**, not executable code
   - No parsing or interpretation of SQL syntax occurs in the parameter

3. **Type Safety**
   - Parameters are typed (string, integer, date, etc.)
   - The database ensures the parameter matches the expected type
   - Special characters are automatically handled correctly

### Visual Comparison

#### String Concatenation (Vulnerable)
```
Developer: "SELECT * FROM users WHERE id = " + userInput
Database receives: "SELECT * FROM users WHERE id = 1 OR 1=1"
                     ↑─── entire thing parsed as SQL ───↑
```

#### Parameterized Query (Safe)
```
Developer sends:
  Structure: "SELECT * FROM users WHERE id = ?"
  Parameter: "1 OR 1=1"

Database processing:
  Step 1: Parse "SELECT * FROM users WHERE id = ?"
          ↑─── structure is locked ───↑
  Step 2: Bind parameter "1 OR 1=1" as a string literal
          ↑─── treated as data, not code ───↑

Final query: SELECT * FROM users WHERE id = '1 OR 1=1'
             (looks for literal string "1 OR 1=1", finds nothing)
```

### Technical Implementation

Different databases handle this differently, but the principle is the same:

#### PostgreSQL (with libpq)
- Uses the extended query protocol
- Sends `Parse`, `Bind`, and `Execute` messages separately
- Parameters are transmitted in binary format with type information

#### MySQL (with prepared statements)
- Uses `COM_STMT_PREPARE` command to prepare the statement
- Uses `COM_STMT_EXECUTE` with parameter data
- Parameters are sent with type information

#### Example Protocol Flow (PostgreSQL)
```
Client → Server: Parse "SELECT * FROM users WHERE username = $1"
Server → Client: Parse Complete (query plan created)

Client → Server: Bind [parameter: "admin' OR '1'='1"]
Server: Treats "admin' OR '1'='1" as string literal value
        NOT as SQL syntax

Client → Server: Execute
Server → Client: Results (searches for username exactly matching "admin' OR '1'='1")
```

## Why String Escaping Is Not Enough

Escaping (like `mysql_real_escape_string()`) tries to neutralize special characters:

```javascript
// Escaping approach (NOT RECOMMENDED)
const escaped = username.replace(/'/g, "\\'");
const query = `SELECT * FROM users WHERE username = '${escaped}'`;
```

**Problems:**
1. **Context-dependent**: Different contexts need different escaping rules
2. **Easy to forget**: Developers must remember to escape every input
3. **Encoding issues**: Character encoding attacks can bypass escaping (e.g., UTF-8 multi-byte characters)
4. **LIMIT clause vulnerability**: Escaping doesn't help in numeric contexts
   ```sql
   LIMIT ${userInput}  -- Can't escape numbers meaningfully
   ```

**Parameterized queries solve all these issues** by separating code from data at the protocol level.

## Additional Security Measures

### 1. Stored Procedures
```sql
CREATE PROCEDURE GetUser(IN p_username VARCHAR(50))
BEGIN
    SELECT * FROM users WHERE username = p_username;
END;
```

Call with parameters:
```javascript
await connection.query('CALL GetUser(?)', [username]);
```

### 2. Web Application Firewall (WAF)
- Detects and blocks common SQL injection patterns
- Examples: ModSecurity, AWS WAF, Cloudflare WAF

### 3. Database Activity Monitoring
- Log all database queries
- Alert on suspicious patterns (multiple failed queries, UNION statements, etc.)

### 4. Regular Security Audits
- Use tools like SQLMap to test your application
- Perform code reviews focusing on database interactions
- Static analysis tools (e.g., SonarQube, Semgrep)

## Testing for SQL Injection

### Manual Testing Inputs
```
'
''
' OR '1'='1
' OR '1'='1'--
' OR '1'='1'/*
admin'--
admin' #
1' UNION SELECT NULL--
1' AND SLEEP(5)--
```

### Automated Tools
- **SQLMap**: Automated SQL injection testing
- **Burp Suite**: Web application security testing
- **OWASP ZAP**: Security scanning

## Summary Checklist

✅ **Always use parameterized queries/prepared statements**
✅ **Use ORMs that handle parameterization automatically**
✅ **Validate and sanitize user input (defense in depth)**
✅ **Apply least privilege to database users**
✅ **Never trust user input**
✅ **Avoid dynamic SQL query construction**
✅ **Use stored procedures where appropriate**
✅ **Enable database query logging and monitoring**
✅ **Regular security testing and code reviews**
✅ **Keep frameworks and database drivers up to date**

## References

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [PostgreSQL Extended Query Protocol](https://www.postgresql.org/docs/current/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY)
