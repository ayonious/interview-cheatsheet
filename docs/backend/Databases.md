---
id: Databases
title: Databases
sidebar_label: Databases
---

## SQL

- Data stored as form of Tables

## NoSQL

- Data stored as form of objects (probably JSON)

## When SQL Better than NOSQL

- SQL is easy to setup
- SQL is very fast for small amount of data
- SQL databases are meant to be joined together to get a bigger amount of data. This linking is done really good in SQL

## When noSQL Better than SQL

- Scaling up noSQL is lot better
- Adding a new column does not require much effort. Its just a new field in json object

## ACID

### Atomicity

Series of Database operation such that all operations occur at the same time or none occur at all. At end of making a transaction either the changes Abort or Commits.

### Consistency

Before and after Transaction the DB should be consistent.

### Isolation

Means multiple transactions can happen without interrupting each other.

### Durability

Means even if DB crashes the Data should not die. THey should still be retrievable. More keywords similar to this: Persistent Database.
