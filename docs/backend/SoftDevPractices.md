---
id: SoftDevPractices
title: SoftDevPractices
sidebar_label: SoftDevPractices
---

# TDD

- Requirements of a development is divided into short test cases
- THen each case is made to solve separately.
- This is more like creating unit tests fisrt and then making the tests success to finish a target

# BDD

- Similar to TDD but in more bigger scope.
- Here the behaviour of the entire system is tested instead of each function one by one
- Example is the cucumber tests

```
Scenario: Creating a user

When: I create a user
Then: I expect user to exist
And: User can see his info
```

# DDD (Domain driven developemnet)

- All the names of class/modules should match what the domain is about.
- For example if you are making a payment system class could be VoidPayment/CapturePayment
