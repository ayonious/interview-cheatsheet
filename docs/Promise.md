---
id: Promise
title: Promise
sidebar_label: Promise
---

## Basic

### Creation of Promise

```js
const promise = new Promise((res, rej) => {
  // do some stuffs
  if() {
    //highlight-next-line
    res("holy cow"); // param of res will be returned
  } else {
    //highlight-next-line
    rej({message: 'something', code:'404'}); // param of rej will be returned + exception will be throwed
  }
});
```

### Resolve

There are 2 ways of waiting on a promise.

### awaiting on Promise

Make sure you call it from an asyn function

```js
try {
  const val = await promise;
  //highlight-next-line
  console.log(val); // "holy cow"
} catch (exc) {
  //highlight-next-line
  console.log(exc.message); // "something"
}
```

### awaiting on Promise

Make sure you call it from an asyn function

```js
promise
  .then((data) => {
    //highlight-next-line
    console.log(data); // "holy cow"
  })
  .catch((data) => {
    //highlight-next-line
    console.log(data.message); // "something"
  });
```
