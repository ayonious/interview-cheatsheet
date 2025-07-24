---
id: Databases
title: Databases
sidebar_label: Databases
---

## SQL vs NoSQL: When to Use Each

### SQL Databases

SQL (Structured Query Language) databases are relational databases that store data in structured tables with predefined schemas.

**Characteristics:**
- Data stored in tables with rows and columns
- ACID compliance (Atomicity, Consistency, Isolation, Durability)
- Predefined schema with strict data types
- Strong consistency guarantees
- Mature ecosystem with standardized query language

**When to Use SQL:**
- Complex queries with multiple joins are required
- Strong consistency and ACID properties are critical
- Well-defined, stable data structure
- Financial systems, banking, or accounting applications
- Applications requiring complex transactions
- When you need standardized query language (SQL)
- Regulatory compliance requirements
- Small to medium-scale applications with predictable growth

**Advantages:**
- ACID compliance ensures data integrity
- Mature technology with extensive tooling
- Standardized SQL query language
- Strong consistency guarantees
- Excellent for complex queries and joins
- Well-established best practices
- Strong community support and documentation

**Disadvantages:**
- Rigid schema makes changes difficult
- Vertical scaling can be expensive
- Performance can degrade with very large datasets
- Less suitable for unstructured data
- Can become bottleneck in distributed systems

### NoSQL Databases

NoSQL databases are non-relational databases designed for flexibility, scalability, and handling unstructured data.

**Types of NoSQL:**
- **Document** (MongoDB, CouchDB): JSON-like documents
- **Key-Value** (Redis, DynamoDB): Simple key-value pairs
- **Column-family** (Cassandra, HBase): Wide column stores
- **Graph** (Neo4j, Amazon Neptune): Node and edge relationships

**When to Use NoSQL:**
- Rapid development with changing requirements
- Large-scale applications requiring horizontal scaling
- Unstructured or semi-structured data
- Real-time applications (gaming, IoT, social media)
- Big data analytics and data warehousing
- Content management systems
- Caching and session storage
- When eventual consistency is acceptable

**Advantages:**
- Flexible schema allows easy data model changes
- Excellent horizontal scalability
- High performance for simple queries
- Better suited for distributed systems
- Can handle various data types (JSON, binary, etc.)
- Often more cost-effective for large-scale applications
- Built for modern web applications

**Disadvantages:**
- Limited query capabilities compared to SQL
- Eventual consistency can lead to data inconsistencies
- Less mature ecosystem and tooling
- Lack of standardization across different NoSQL databases
- Limited support for complex transactions
- Potential for data duplication

### Decision Matrix

| Factor | SQL | NoSQL |
|--------|-----|-------|
| **Data Structure** | Structured, relational | Flexible, various formats |
| **Scalability** | Vertical (expensive) | Horizontal (cost-effective) |
| **Consistency** | Strong (ACID) | Eventual (BASE) |
| **Query Complexity** | Complex joins, aggregations | Simple queries, limited joins |
| **Schema Changes** | Difficult, requires migrations | Easy, flexible |
| **Performance** | Excellent for complex queries | Excellent for simple operations |
| **Use Cases** | Financial, ERP, CRM | Social media, IoT, gaming |

## ACID

### Atomicity

Series of Database operation such that all operations occur at the same time or none occur at all. At end of making a transaction either the changes Abort or Commits.

### Consistency

Before and after Transaction the DB should be consistent.

### Isolation

Means multiple transactions can happen without interrupting each other.

### Durability

Means even if DB crashes the Data should not die. THey should still be retrievable. More keywords similar to this: Persistent Database.
