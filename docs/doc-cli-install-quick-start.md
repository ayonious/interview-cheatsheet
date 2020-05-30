---
id: doc-cli-install-quick-start
title: Quick Start
sidebar_label: Quick Start
---

import useBaseUrl from '@docusaurus/useBaseUrl';

## Synopsis

Printing Simple Table on your bash terminal. Its useful when you want to present some tables on console.

## Installation

```bash npm2yarn
npm install table-printer-cli -g
```

## Basic Example

Try this on your terminal.

```bash
ctp -i '[{ "id":3, "text":"like" }, {"id":4, "text":"tea"}]'
```

Output:

<img alt="Screenshot" src={useBaseUrl('img/examples/doc-cli-install-quick-start/quick-print.v3.png')}/>

You can also pipe the input from stdin

```bash
echo '[{ "id":3, "text":"like" }, {"id":4, "text":"tea"}]' | ctp -s
```

## Detailed usage

```text
Usage: ctp [options]

Options:
  -i, --input <value>  input string
  -s, --stdin          read input from stdin
  -h, --help           display help for command
```
