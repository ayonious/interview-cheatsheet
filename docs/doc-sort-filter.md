---
id: doc-sort-filter
title: Sort and Filter
sidebar_label: Sort and Filter
---

import useBaseUrl from '@docusaurus/useBaseUrl';

## Sort

This is an optional param. Pass the sort function that will be used on each row to sort them. This sort function is simple Array element sort function

```javascript
const { Table } = require("console-table-printer");

const p = new Table({
  columns: [{ name: "index" }, { name: "text" }, { name: "value" }],
  // highlight-next-line
  sort: (row1, row2) => +row2.value - +row1.value, // desc sorting order of rows (optional),
});

p.addRow({ index: 1, text: "red wine", value: 11 }, { color: "green" });
p.addRow({ index: 2, text: "green gemuse", value: 21 });
p.addRow({ index: 3, text: "gelb bananen", value: 10 });
p.addRow({ index: 3, text: "rosa hemd wie immer", value: 13 });

p.addRow({ index: 4, text: "some more shit", value: 20 }, { color: "cyan" });

p.printTable();
```

<img alt="Screenshot" src={useBaseUrl('img/examples/doc-sort-filter/sort.png')}/>

## Filter

This is an optional param. Pass the filter function that will be used on each row to filter them

```javascript
const { Table } = require("console-table-printer");

const p = new Table({
  columns: [{ name: "index" }, { name: "text" }, { name: "value" }],
  // highlight-next-line
  filter: (row) => +row.value < 20, // filter rows with value < 20
});

p.addRow({ index: 1, text: "red wine", value: 11 }, { color: "green" });
p.addRow({ index: 2, text: "green gemuse", value: 21 });
p.addRow({ index: 3, text: "gelb bananen", value: 10 });
p.addRow({ index: 3, text: "rosa hemd wie immer", value: 13 });

p.addRow({ index: 4, text: "some more shit", value: 20 }, { color: "cyan" });

p.printTable();
```

<img alt="Screenshot" src={useBaseUrl('img/examples/doc-sort-filter/filter.png')}/>
