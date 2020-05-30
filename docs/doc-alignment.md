---
id: doc-alignment
title: Alignment
sidebar_label: Alignment
---

import useBaseUrl from '@docusaurus/useBaseUrl';

You can put properties for alignment

```javascript
const { Table } = require("console-table-printer");

const p = new Table({
  columns: [
    // highlight-start
    { name: "index", alignment: "left" },
    { name: "text", alignment: "right" },
    { name: "is_priority_today", alignment: "center" },
    // highlight-end
  ],
});

p.addRow({ index: 1, text: "red wine", value: 10.212 }, { color: "green" });
p.addRow({ index: 2, text: "green gemuse", value: 20.0 });
p.addRow(
  { index: 3, text: "gelb bananen", value: 100, is_priority_today: "Y" },
  { color: "yellow" }
);
p.addRow(
  { index: 3, text: "rosa hemd wie immer", value: 100 },
  { color: "cyan" }
);
p.printTable();
```

<img alt="Screenshot" src={useBaseUrl('img/examples/doc-alignment/screenshot.png')}/>

## possible `alignment` values for columns

- left
- right
- center
