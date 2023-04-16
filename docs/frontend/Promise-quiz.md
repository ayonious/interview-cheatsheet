---
id: Promise-quiz
title: Promise Quiz
sidebar_label: Promise quiz
---

## Q1

What is the output of this?

```js
let promise = (data) =>
  new Promise((res, rej) => {
    if (data) {
      res("resolved");
    } else {
      rej("rejected");
    }
  });

async function some() {
  const data = await promise(true);
  console.log(1);
  console.log(data);
}

promise(true).then((data) => {
  console.log(2);
  console.log(data);
});

console.log("start");
some();
console.log("end");
```

```bash
start
end
2
resolved
1
resolved
```

## Q2

What is the output of this?

```js
let promise = (data) =>
  new Promise((res, rej) => {
    if (data) {
      res("resolved");
    } else {
      rej("rejected");
    }
  });

promise(true)
  .then((data) => {
    console.log("1");
    console.log(data);
    return promise(true);
  })
  .then((data) => {
    console.log("2");
    console.log(data);
    return promise(false);
  })
  .then((data) => {
    console.log("3");
    console.log(data);
    return promise(false);
  })
  .catch((data) => {
    console.log("4");
    console.log(data);
    return promise(true);
  })
  .catch((data) => {
    console.log("5");
    console.log(data);
    return promise(true);
  })
  .catch((data) => {
    console.log("6");
    console.log(data);
    return promise(true);
  })
  .catch((data) => {
    console.log("7");
    console.log(data);
    return promise(true);
  })
  .then((data) => {
    console.log("8");
    console.log(data);
    return promise(false);
  })
  .then(
    (data) => {
      console.log("9.1");
      console.log(data);
    },
    (data) => {
      console.log("9.2");
      console.log(data);
    }
  )
  .catch((data) => {
    console.log("10");
    console.log(data);
  });
```

```bash
1
resolved
2
resolved
4
rejected
8
resolved
9.2
rejected
```
