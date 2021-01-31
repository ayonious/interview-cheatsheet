---
id: AsyncVsThreading
title: AsyncVsThreading
sidebar_label: AsyncVsThreading
---

This can also be mentioned as the main difference between frameworks of Other programming languages and Nodejs.

## Threading

Lets assume you are using Some standard Programming language Like: Java. That has lots of threads (10) in one Process. And serving lots of Requests parallel. But is it really parallel if all these threads are actually using same process? There will be lots of race conditions you need to take care of in this regard. One Thread making a call to one entry and then another again making the same thing. You always need to make sure there is no collision.

- Good thing: Nice code readability
- Bad thing: Waste of resource
- Bad thing: race conditions

## Async

Now lets look at Async which is the main feature of Nodejs. It has a single Thread(not exactly but kind of) and so you don't need to think about any kind of collisions. As the thread is actually busy doing a network/io call this thread starts to process another requests or something based on the queue. So this way you are saving resources and also making things fast.

- Bad thing: Bad code readability. But with Async/Await this Problem is solved now
- Good thing: Utilizing resource
- Good thing: No race conditions

The Good examples of this async behaviour is Clicking on a button in browser while waiting for response. This does not bloc the whole browser and you can still do other things while response is being fetched from server.
