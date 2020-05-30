---
id: doc-table-instance-creation
title: Create Table Instance
sidebar_label: Create Table Instance
---

import useBaseUrl from '@docusaurus/useBaseUrl';

You can also create a new Table instance and print it like this

```javascript
const { Table } = require("console-table-printer");

//Create a table
const p = new Table();

//add rows with color
p.addRow(
  { index: 1, text: "red wine please", value: 10.212 },
  { color: "red" }
);
p.addRow(
  { index: 2, text: "green gemuse please", value: 20.0 },
  { color: "green" }
);
p.addRows([
  //adding multiple rows are possible
  { index: 3, text: "gelb bananen bitte", value: 100 },
  { index: 4, text: "update is working", value: 300 },
]);

//print
p.printTable();
```

<img alt="Screenshot" src={useBaseUrl('img/examples/doc-table-instance-creation/screenshot.png')}/>

## Table instance creation

There are 3 ways for Table Instance creation

### 1. Simplest way

```javascript
new Table();
```

### 2. Only with column names

```javascript
new Table(["column1", "column2", "column3"]);
```

### 3. More Complex way

```javascript
new Table({
  style: "fatBorder", //style of border of the table, (optional)
  columns: [
    { name: "column1", alignment: "left", color: "red" }, //with alignment and color
    { name: "column2", alignment: "right" },
    { name: "column3" },
  ],
  sort: (row1, row2) => row2.column1 - row1.column1, // sorting order of rows (optional)
  filter: (row) => row.column1 < 3, // filtering rows (optional)
});
```

## Functions of table instance

- `addRow(rowObjet, options)` adding single row.
- `addRows(rowObjets)` adding multiple rows. array of row object. This case options will be applied to all the objects in row
- `addColumn(columnObject)` adding single column
- `addColumns(columnObjects)` adding multiple columns
- `printTable()` Prints the table on your console
