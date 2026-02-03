// Demo subjects with topics for study
export const demoSubjects = [
  {
    id: 'demo-react',
    name: 'React Fundamentals',
    emoji: '⚛️',
    gradient: 'from-blue-500 to-blue-600',
    content: `React is a JavaScript library for building user interfaces. It uses a component-based architecture with Virtual DOM for efficient updates.`,
    topics: [
      {
        id: 'react-intro',
        title: 'Introduction to React',
        description: 'What is React and why use it',
        content: `React is a JavaScript library for building user interfaces, developed by Facebook. It follows a component-based architecture where UIs are built using reusable, self-contained components.

Key Concepts:
- Virtual DOM: React uses a virtual representation of the DOM for efficient updates
- JSX: A syntax extension that allows writing HTML-like code in JavaScript
- One-way data flow: Data flows from parent to child components via props
- Component lifecycle: Components go through mounting, updating, and unmounting phases`
      },
      {
        id: 'react-components',
        title: 'Components and Props',
        description: 'Building blocks of React apps',
        content: `Components are the building blocks of React applications. They can be functional or class-based.

Functional Components:
- Simple JavaScript functions that return JSX
- Can use hooks for state and side effects
- Preferred approach in modern React

Props:
- Short for properties
- Read-only data passed from parent to child
- Can be any JavaScript value including functions`
      },
      {
        id: 'react-hooks',
        title: 'State and Hooks',
        description: 'Managing state in React',
        content: `State represents data that can change over time within a component.

useState Hook:
- Declares state variables in functional components
- Returns current state and setter function
- Triggers re-render when state changes

useEffect Hook:
- Handles side effects like API calls, subscriptions
- Runs after every render by default
- Cleanup function prevents memory leaks`
      },
      {
        id: 'react-events',
        title: 'Event Handling',
        description: 'Handling user interactions',
        content: `React handles events using camelCase syntax and passes functions as event handlers.

Common Events:
- onClick, onChange, onSubmit
- Event objects contain information about the event
- Prevent default behavior with e.preventDefault()`
      },
      {
        id: 'react-conditional',
        title: 'Conditional Rendering',
        description: 'Rendering based on conditions',
        content: `React allows rendering different UI based on conditions.

Techniques:
- Ternary operators for inline conditions
- Logical && for conditional display
- Early returns for component-level conditions`
      }
    ]
  },
  {
    id: 'demo-python',
    name: 'Python Basics',
    emoji: '🐍',
    gradient: 'from-cyan-500 to-cyan-600',
    content: `Python is a high-level, interpreted programming language known for its readability and versatility.`,
    topics: [
      {
        id: 'python-intro',
        title: 'Getting Started with Python',
        description: 'Introduction to Python programming',
        content: `Python is a high-level, interpreted programming language known for its readability and versatility.

Features:
- Dynamic typing
- Automatic memory management
- Extensive standard library
- Cross-platform compatibility`
      },
      {
        id: 'python-types',
        title: 'Variables and Data Types',
        description: 'Python data types and variables',
        content: `Python supports multiple data types without explicit declaration.

Basic Types:
- int: Integer numbers (42, -7)
- float: Decimal numbers (3.14, -0.5)
- str: Text strings ("Hello", 'World')
- bool: Boolean values (True, False)

Collections:
- list: Ordered, mutable [1, 2, 3]
- tuple: Ordered, immutable (1, 2, 3)
- dict: Key-value pairs {"key": "value"}
- set: Unique values {1, 2, 3}`
      },
      {
        id: 'python-control',
        title: 'Control Flow',
        description: 'Conditionals and loops',
        content: `Python uses indentation to define code blocks.

If Statements:
if condition:
    # code
elif another_condition:
    # code
else:
    # code

Loops:
- for loop: Iterates over sequences
- while loop: Repeats while condition is true
- break: Exits loop
- continue: Skips iteration`
      },
      {
        id: 'python-functions',
        title: 'Functions',
        description: 'Defining and using functions',
        content: `Functions are reusable blocks of code defined with def keyword.

Parameters:
- Positional arguments
- Keyword arguments
- Default values
- *args and **kwargs for variable arguments`
      },
      {
        id: 'python-oop',
        title: 'Object-Oriented Programming',
        description: 'Classes and objects in Python',
        content: `Python supports OOP with classes and objects.

Class Definition:
class ClassName:
    def __init__(self, params):
        self.attribute = params
    
    def method(self):
        return self.attribute`
      }
    ]
  },
  {
    id: 'demo-ml',
    name: 'Machine Learning',
    emoji: '🤖',
    gradient: 'from-purple-500 to-purple-600',
    content: `Machine Learning is a subset of AI that enables systems to learn and improve from experience.`,
    topics: [
      {
        id: 'ml-intro',
        title: 'What is Machine Learning?',
        description: 'Introduction to ML concepts',
        content: `Machine Learning is a subset of AI that enables systems to learn and improve from experience without explicit programming.

Types of Learning:
- Supervised Learning: Learning from labeled data
- Unsupervised Learning: Finding patterns in unlabeled data
- Reinforcement Learning: Learning through reward/punishment`
      },
      {
        id: 'ml-supervised',
        title: 'Supervised Learning',
        description: 'Learning from labeled data',
        content: `The algorithm learns from labeled training data to make predictions.

Regression:
- Predicts continuous values
- Linear Regression, Polynomial Regression
- Metrics: MSE, RMSE, R-squared

Classification:
- Predicts categorical labels
- Logistic Regression, Decision Trees, SVM
- Metrics: Accuracy, Precision, Recall, F1-Score`
      },
      {
        id: 'ml-unsupervised',
        title: 'Unsupervised Learning',
        description: 'Finding patterns without labels',
        content: `Discovers hidden patterns without labeled data.

Clustering:
- K-Means: Groups data into k clusters
- Hierarchical: Creates tree of clusters
- DBSCAN: Density-based clustering

Dimensionality Reduction:
- PCA: Principal Component Analysis
- t-SNE: Visualization technique`
      },
      {
        id: 'ml-neural',
        title: 'Neural Networks',
        description: 'Deep learning fundamentals',
        content: `Inspired by biological neurons, these form the basis of deep learning.

Components:
- Input Layer: Receives data
- Hidden Layers: Process information
- Output Layer: Produces predictions
- Activation Functions: ReLU, Sigmoid, Softmax`
      },
      {
        id: 'ml-evaluation',
        title: 'Model Evaluation',
        description: 'Testing and validating models',
        content: `Proper evaluation ensures model reliability.

Techniques:
- Train/Test Split
- Cross-Validation
- Confusion Matrix
- ROC Curves`
      }
    ]
  }
]

// Legacy export for backward compatibility
export const demoDocuments = demoSubjects
