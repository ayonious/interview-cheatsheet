---
id: SQL
title: SQL
sidebar_label: SQL
---

## SQL Interview Questions & Common Patterns

### Common JOIN Problems

#### Sample Tables

```sql
-- Employees Table
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    department_id INT,
    manager_id INT,
    salary DECIMAL(10, 2)
);

-- Departments Table
CREATE TABLE departments (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    location VARCHAR(100)
);

-- Projects Table
CREATE TABLE projects (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    budget DECIMAL(12, 2)
);

-- Employee_Projects Table (Many-to-Many)
CREATE TABLE employee_projects (
    employee_id INT,
    project_id INT,
    hours_worked INT,
    PRIMARY KEY (employee_id, project_id)
);
```

#### 1. INNER JOIN - Find employees with their department names

```sql
SELECT
    e.name AS employee_name,
    d.name AS department_name,
    e.salary
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;
```

**Result:** Only employees who have a valid department.

#### 2. LEFT JOIN - Find all employees, including those without departments

```sql
SELECT
    e.name AS employee_name,
    COALESCE(d.name, 'No Department') AS department_name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;
```

**Result:** All employees; NULL department names shown as 'No Department'.

#### 3. Self JOIN - Find employees with their managers

```sql
SELECT
    e.name AS employee_name,
    m.name AS manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

**Result:** Each employee paired with their manager's name.

#### 4. Multiple JOINs - Employees with projects and departments

```sql
SELECT
    e.name AS employee_name,
    d.name AS department_name,
    p.name AS project_name,
    ep.hours_worked
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN employee_projects ep ON e.id = ep.employee_id
LEFT JOIN projects p ON ep.project_id = p.id
ORDER BY e.name, p.name;
```

#### 5. Find employees NOT working on any project

```sql
SELECT e.name
FROM employees e
LEFT JOIN employee_projects ep ON e.id = ep.employee_id
WHERE ep.employee_id IS NULL;
```

### Grouping and Aggregation

#### 6. Count employees per department

```sql
SELECT
    d.name AS department_name,
    COUNT(e.id) AS employee_count
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name
ORDER BY employee_count DESC;
```

#### 7. Average salary per department

```sql
SELECT
    d.name AS department_name,
    AVG(e.salary) AS avg_salary,
    MIN(e.salary) AS min_salary,
    MAX(e.salary) AS max_salary
FROM departments d
INNER JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name
HAVING AVG(e.salary) > 50000;
```

#### 8. Find departments with more than 5 employees

```sql
SELECT
    d.name AS department_name,
    COUNT(e.id) AS employee_count
FROM departments d
INNER JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name
HAVING COUNT(e.id) > 5;
```

#### 9. Total hours worked per project

```sql
SELECT
    p.name AS project_name,
    COUNT(DISTINCT ep.employee_id) AS employee_count,
    SUM(ep.hours_worked) AS total_hours
FROM projects p
LEFT JOIN employee_projects ep ON p.id = ep.project_id
GROUP BY p.id, p.name
ORDER BY total_hours DESC;
```

### Array Aggregation and String Functions

#### 10. Concatenate employee names per department (PostgreSQL)

```sql
SELECT
    d.name AS department_name,
    STRING_AGG(e.name, ', ' ORDER BY e.name) AS employee_list
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name;
```

**MySQL version:**
```sql
SELECT
    d.name AS department_name,
    GROUP_CONCAT(e.name ORDER BY e.name SEPARATOR ', ') AS employee_list
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name;
```

#### 11. Array of project IDs per employee (PostgreSQL)

```sql
SELECT
    e.name AS employee_name,
    ARRAY_AGG(p.id ORDER BY p.id) AS project_ids,
    ARRAY_AGG(p.name ORDER BY p.name) AS project_names
FROM employees e
LEFT JOIN employee_projects ep ON e.id = ep.employee_id
LEFT JOIN projects p ON ep.project_id = p.id
GROUP BY e.id, e.name;
```

#### 12. JSON aggregation of employee details per department (PostgreSQL)

```sql
SELECT
    d.name AS department_name,
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'name', e.name,
            'salary', e.salary
        ) ORDER BY e.name
    ) AS employees
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name;
```

### Advanced Patterns

#### 13. Window Functions - Rank employees by salary within department

```sql
SELECT
    e.name,
    d.name AS department_name,
    e.salary,
    RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS salary_rank
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;
```

#### 14. Running total of salaries

```sql
SELECT
    e.name,
    e.salary,
    SUM(e.salary) OVER (ORDER BY e.id) AS running_total
FROM employees e
ORDER BY e.id;
```

#### 15. Find the nth highest salary

```sql
-- 2nd highest salary
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;

-- Using window function
SELECT DISTINCT salary
FROM (
    SELECT
        salary,
        DENSE_RANK() OVER (ORDER BY salary DESC) AS rank
    FROM employees
) ranked
WHERE rank = 2;
```

#### 16. Employees earning more than their department average

```sql
SELECT
    e.name,
    e.salary,
    dept_avg.avg_salary
FROM employees e
INNER JOIN (
    SELECT
        department_id,
        AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
) dept_avg ON e.department_id = dept_avg.department_id
WHERE e.salary > dept_avg.avg_salary;
```

#### 17. Find departments with no employees

```sql
SELECT d.name
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
WHERE e.id IS NULL;
```

#### 18. Complex aggregation with CASE

```sql
SELECT
    d.name AS department_name,
    COUNT(e.id) AS total_employees,
    COUNT(CASE WHEN e.salary > 60000 THEN 1 END) AS high_earners,
    COUNT(CASE WHEN e.salary BETWEEN 40000 AND 60000 THEN 1 END) AS mid_earners,
    COUNT(CASE WHEN e.salary < 40000 THEN 1 END) AS low_earners
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name;
```

### Common Table Expressions (CTE)

#### 19. Find managers who manage more than 3 employees

```sql
WITH manager_counts AS (
    SELECT
        manager_id,
        COUNT(*) AS direct_reports
    FROM employees
    WHERE manager_id IS NOT NULL
    GROUP BY manager_id
)
SELECT
    e.name AS manager_name,
    mc.direct_reports
FROM manager_counts mc
INNER JOIN employees e ON mc.manager_id = e.id
WHERE mc.direct_reports > 3;
```

#### 20. Recursive CTE - Organizational hierarchy

```sql
WITH RECURSIVE employee_hierarchy AS (
    -- Base case: top-level managers
    SELECT
        id,
        name,
        manager_id,
        1 AS level,
        name AS path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive case
    SELECT
        e.id,
        e.name,
        e.manager_id,
        eh.level + 1,
        eh.path || ' > ' || e.name
    FROM employees e
    INNER JOIN employee_hierarchy eh ON e.manager_id = eh.id
)
SELECT * FROM employee_hierarchy
ORDER BY path;
```

## Key Concepts to Remember

### JOIN Types
- **INNER JOIN**: Returns only matching rows from both tables
- **LEFT JOIN**: Returns all rows from left table, matching rows from right (NULL if no match)
- **RIGHT JOIN**: Returns all rows from right table, matching rows from left (NULL if no match)
- **FULL OUTER JOIN**: Returns all rows from both tables (NULL where no match)
- **CROSS JOIN**: Cartesian product of both tables

### Aggregation Functions
- **COUNT()**: Count rows
- **SUM()**: Sum numeric values
- **AVG()**: Average of numeric values
- **MIN()/MAX()**: Minimum/maximum values
- **STRING_AGG()/GROUP_CONCAT()**: Concatenate strings
- **ARRAY_AGG()**: Aggregate into array (PostgreSQL)
- **JSON_AGG()**: Aggregate into JSON array (PostgreSQL)

### Important Clauses
- **GROUP BY**: Group rows with same values
- **HAVING**: Filter groups (use WHERE for row filtering before grouping)
- **ORDER BY**: Sort results
- **LIMIT/OFFSET**: Pagination
- **DISTINCT**: Remove duplicates

### Performance Tips
1. Use indexes on JOIN columns and WHERE clauses
2. Avoid SELECT * - specify only needed columns
3. Use EXPLAIN to analyze query plans
4. Consider denormalization for read-heavy workloads
5. Use appropriate JOIN types (INNER vs LEFT)
6. Filter early with WHERE before JOIN when possible
7. Use EXISTS instead of IN for large subqueries
