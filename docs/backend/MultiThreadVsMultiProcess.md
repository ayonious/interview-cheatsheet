---
id: MultiThreadVsMultiProcess
title: MultiThreadVsMultiProcess
sidebar_label: MultiThreadVsMultiProcess
---

## MultiThread

- All threads are part of the same process
- Sharing same physical resources
- Good: Easy to spin one thread.
- Bad: Writing thread safe code is hard.
- Bad: Can't be scaled, more scaling will put into more races.

## MultiProcess

- Physically separate
- Good: Can be scaled as much possible
- Bad: Expensive
