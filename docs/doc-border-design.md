---
id: doc-border-design
title: Border Design
sidebar_label: Border Design
---

import useBaseUrl from '@docusaurus/useBaseUrl';

You can configure the border of the table by passing style in Table constructor

```js
const { Table } = require("console-table-printer");

const p = new Table({
  // highlight-next-line
  style: "fatBorder", //style of border of the table
  columns: [{ name: "index" }, { name: "text" }, { name: "value" }],
});

p.addRow({ index: 1, text: "red wine", value: 10.212 });
p.addRow({ index: 2, text: "green gemuse", value: 20.0 });
p.printTable();
```

<img alt="Screenshot" src={useBaseUrl('img/examples/doc-border-design/fat.png')}/>

## Possible values of Border style

- thinBorder (default)
- fatBorder
