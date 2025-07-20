# Object-Oriented Programming (OOP)

## Overview

Object-Oriented Programming is a programming paradigm based on the concept of "objects" that contain data (attributes/properties) and code (methods/functions). OOP organizes software design around data, or objects, rather than functions and logic.

## Core Principles of OOP

### 1. Encapsulation

**Definition**: Bundling data and methods that operate on that data within a single unit (class/object) and restricting access to internal details.

**Benefits**:
- Data hiding and protection
- Reduced complexity
- Improved maintainability
- Better code organization

### 2. Inheritance

**Definition**: Mechanism where a new class (child/derived) inherits properties and methods from an existing class (parent/base).

**Benefits**:
- Code reusability
- Hierarchical classification
- Method overriding
- Polymorphic behavior

### 3. Polymorphism

**Definition**: Ability of objects of different types to be treated as instances of the same type through a common interface.

**Types**:
- **Method Overriding**: Same method name, different implementations
- **Method Overloading**: Same method name, different parameters
- **Interface Implementation**: Multiple classes implementing the same interface

### 4. Abstraction

**Definition**: Hiding complex implementation details while exposing only essential features and functionality.

**Benefits**:
- Simplified interface
- Reduced complexity
- Focus on what an object does rather than how it does it
- Better modularity

## OOP Language Categories

### Fully Object-Oriented Languages
- **Everything is an object**: Smalltalk, Ruby
- **Class-based with primitives**: Java, C#, C++

### Multi-Paradigm Languages
- **Support OOP but not exclusively**: JavaScript, TypeScript, Python, C++

### Prototype-Based OOP
- **Objects inherit directly from other objects**: JavaScript (pre-ES6 classes)

## Language-Specific OOP Implementation

### Java

**OOP Classification**: Fully Object-Oriented (class-based)

**Key Features**:
```java
// Class definition with encapsulation
public class Animal {
    private String name;  // Encapsulated field
    protected int age;    // Protected for inheritance
    
    // Constructor
    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    // Encapsulated method
    public String getName() {
        return name;
    }
    
    // Method for polymorphism
    public void makeSound() {
        System.out.println("Some generic animal sound");
    }
}

// Inheritance
public class Dog extends Animal {
    private String breed;
    
    public Dog(String name, int age, String breed) {
        super(name, age);  // Call parent constructor
        this.breed = breed;
    }
    
    // Polymorphism - method overriding
    @Override
    public void makeSound() {
        System.out.println("Woof!");
    }
    
    // Method overloading
    public void makeSound(int volume) {
        System.out.println("Woof! at volume " + volume);
    }
}
```

**OOP Characteristics**:
- **Strong encapsulation**: private, protected, public access modifiers
- **Single inheritance**: extends one class, implements multiple interfaces
- **Strong typing**: compile-time type checking
- **Abstract classes and interfaces**: for abstraction
- **Method overloading and overriding**: full polymorphism support

### JavaScript

**OOP Classification**: Multi-paradigm with Prototype-based OOP (ES6+ adds class syntax)

**Traditional Prototype-based OOP**:
```javascript
// Constructor function (pre-ES6)
function Animal(name, age) {
    this.name = name;
    this.age = age;
}

// Method on prototype
Animal.prototype.makeSound = function() {
    console.log("Some generic animal sound");
};

// Inheritance through prototype chain
function Dog(name, age, breed) {
    Animal.call(this, name, age);  // Call parent constructor
    this.breed = breed;
}

// Set up inheritance
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

// Override method
Dog.prototype.makeSound = function() {
    console.log("Woof!");
};
```

**ES6+ Class Syntax**:
```javascript
// Modern class syntax
class Animal {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }
    
    makeSound() {
        console.log("Some generic animal sound");
    }
    
    // Getter for encapsulation-like behavior
    get info() {
        return `${this.name} is ${this.age} years old`;
    }
}

// Inheritance
class Dog extends Animal {
    constructor(name, age, breed) {
        super(name, age);
        this.breed = breed;
    }
    
    // Polymorphism
    makeSound() {
        console.log("Woof!");
    }
    
    // Additional method
    wagTail() {
        console.log(`${this.name} is wagging tail`);
    }
}
```

**OOP Characteristics**:
- **Flexible encapsulation**: closures, symbols, private fields (#field)
- **Prototype-based inheritance**: objects inherit from other objects
- **Dynamic typing**: runtime type checking
- **Duck typing**: if it looks like a duck and quacks like a duck...
- **First-class functions**: methods can be reassigned

### TypeScript

**OOP Classification**: Multi-paradigm with Enhanced Class-based OOP

**Enhanced Features over JavaScript**:
```typescript
// Interface for abstraction
interface Animal {
    name: string;
    age: number;
    makeSound(): void;
}

// Abstract class
abstract class Mammal implements Animal {
    constructor(public name: string, public age: number) {}
    
    abstract makeSound(): void;  // Must be implemented by subclasses
    
    // Concrete method
    breathe(): void {
        console.log(`${this.name} is breathing`);
    }
}

// Class with access modifiers
class Dog extends Mammal {
    private _breed: string;  // Private field
    
    constructor(name: string, age: number, breed: string) {
        super(name, age);
        this._breed = breed;
    }
    
    // Getter/Setter for encapsulation
    get breed(): string {
        return this._breed;
    }
    
    set breed(value: string) {
        if (value.length > 0) {
            this._breed = value;
        }
    }
    
    // Implementation of abstract method
    makeSound(): void {
        console.log("Woof!");
    }
    
    // Method overloading (with different signatures)
    fetch(): void;
    fetch(item: string): void;
    fetch(item?: string): void {
        if (item) {
            console.log(`Fetching ${item}`);
        } else {
            console.log("Fetching");
        }
    }
}

// Generic class for advanced OOP
class Container<T> {
    private items: T[] = [];
    
    add(item: T): void {
        this.items.push(item);
    }
    
    get(index: number): T | undefined {
        return this.items[index];
    }
}
```

**OOP Characteristics**:
- **Strong encapsulation**: private, protected, public, readonly modifiers
- **Interface contracts**: explicit interface implementation
- **Abstract classes**: enforced implementation requirements
- **Static typing**: compile-time type safety
- **Generics**: type-safe collections and methods
- **Method overloading**: multiple signatures for same method

## Comparison Summary

| Feature | Java | JavaScript | TypeScript |
|---------|------|------------|------------|
| **Type System** | Static, Strong | Dynamic, Weak | Static, Strong |
| **Inheritance** | Single class, Multiple interface | Prototype chain | Single class, Multiple interface |
| **Encapsulation** | Access modifiers | Closures, Private fields | Access modifiers |
| **Polymorphism** | Method overriding/overloading | Duck typing, Method override | Method overriding/overloading |
| **Abstraction** | Abstract classes, Interfaces | No native support | Abstract classes, Interfaces |
| **Runtime** | JVM | JavaScript Engine | Compiles to JavaScript |

## Benefits of OOP

1. **Modularity**: Code organization into logical units
2. **Reusability**: Inheritance and composition enable code reuse
3. **Maintainability**: Encapsulation makes code easier to modify
4. **Scalability**: Large applications benefit from OOP structure
5. **Collaboration**: Clear interfaces help team development

## Common OOP Design Patterns

1. **Singleton**: Ensure single instance of a class
2. **Factory**: Create objects without specifying exact classes
3. **Observer**: Define dependency between objects
4. **Strategy**: Define family of algorithms and make them interchangeable
5. **Decorator**: Add behavior to objects dynamically

## When to Use OOP

**Good for**:
- Large, complex applications
- Team development projects
- GUI applications
- Systems requiring code reuse
- Applications with clear domain models

**Consider alternatives for**:
- Simple scripts or utilities
- Functional programming problems
- Performance-critical code
- Mathematical computations 