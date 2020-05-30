---
id: doc-install-quick-start
title: Install and Quick start
sidebar_label: Install and Quick start
---

import useBaseUrl from '@docusaurus/useBaseUrl';

## Installation

```bash npm2yarn
npm install console-table-printer --save
```

## Basic Example

```javascript
const { printTable } = require("console-table-printer");

//Create a table
const testCases = [
  { index: 3, text: "I would like some gelb bananen bitte", value: 100 },
  { index: 4, text: "I hope batch update is working", value: 300 },
];

//print
printTable(testCases);
```

Output:

<img alt="Screenshot" src={useBaseUrl('img/examples/doc-install-quick-start/quick-print.png')}/>
