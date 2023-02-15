---
draft: true
date: 2023-02-15T17:06:57+01:00
lastmod: null
title: "Lecture Notes: Distributed Systems"
summary: 'Lecture notes about and summaries of the "Distributed Systems" lecture at TUM.'
tags: ['university', 'distributed systems']
---

This is a summary of the [Distributed Systems](https://web.archive.org/web/20230215161635/https://campus.tum.de/tumonline/WBMODHB.wbShowMHBReadOnly?pKnotenNr=756837) course, taken in the winter semester 2022/2023. These is only a condensed version of the topics covered in the actual lecture and, if used for studying, should therefore not be used as a supplement to the actual material.

## Abbreviations

This summary uses the following abbreviations:

* **DS**: Distributed System
* **FP**: Functional Programming
* **IDL**: Interface Definition Language
* **KV**: Key-Value
* **RPC**: Remote Procedure Call

## Terminology

The lecture and this summary assume the following meaning behind these terms:

* **Distributed System (DS)**: An application running on multiple different machines (hereafter called _nodes_) communicating via the _network_ while trying to achieve a common _task_.
* **Node**: Any kind of machine that is communicating with others within a DS.
* **Message**: Data sent from one node to another.
* **Fault**: Indicates that _some part_ of the DS is malfunctioning.  
* **Failure**: Indicates that the entire DS malfunctions.  
* **Fault Tolerance**: A DS continues working, despite one or multiple _faults_ occurring.
* **Latency**: The time until a message arrives (i.e., the "time in transit") (e.g., 10ms).
* **Bandwidth**: The data volume that can be sent over a certain period of time (e.g., 1 Mbit/s).
* **Availability**: A synonym for "uptime", i.e., the fraction of time that a DS is working correctly (from the perspective of a user).
* **(Un-)marshalling**: A synonym for (de-)serializing a data structure so that it can be sent over the network.
* **Interface Definition Language (IDL)**: A format defining type signatures in a (programming) language-independent way.

## Distributed Systems - Motivation

{{< figure src="./client-server.png" caption="The simplest possible DS, consisting of two nodes sending a message to each other." >}}

There are many possible reasons for choosing to architecting a system in a distributed way:

* The system could, by its very nature, be distributed.
* A DS is typically more reliable.
* A DS might bring better performance (e.g., for geographic reasons).
* A DS can help with data limitations.
* ...

In summary, a DS might overcome typical challenges that would otherwise occur with a non-distributed, single-machine system. However, as a tradeoff, any DS will have to overcome new challenges that are not present in a non-distributed system:

* It must be *fault-tolerant*.
* It must be *available*.
* It must be able to *recover* in the case of faults or failures.
* It must be *consistent*.
* It must be able to *scale*.
* It must be *performant*.
* It must be *secure*.

## Concept: RPC (Remote Procedure Call)

RPC is a concept that leverages a DS to execute a function (or _procedure_) on a _remote_ machine. This is hidden from the caller of the function (**location transparency**).

A prominent example is a transaction of money:

```js
// At the client:
let result = processPayment({
  card: '123456',
  amount: 13.00,
});

log('Result: ' + result.ok);
```

In the above example, the `processPayment` function is not executed locally on the client, but instead on another node. Both the function's argument and the result are (un-)marshalled before/after being sent/received over the network.

{{< figure src="./rpc.png" caption="The internals of the RPC request/response flow." >}}

RPCs are very common in todays applications. Examples of prominent RPC frameworks/technologies are:

* gRPC
* REST
* Java RMI

## Concept: Leases



## Case Study: MapReduce

MapReduce is a model/library introduced by Google. It provides an abstraction for processing large amounts of data on multiple distributed machines. It provides a slim API to application developers, inspired by FP concepts:

* `map(key, value): (key, value)`
* `reduce(key, value): (key, value)`

Application developers only need to implement these two functions when using MapReduce. MapReduce itself then handles the entire complexity of that come with distributed data processing: _parallelization_, _communication_, _load balancing_, _fault tolerance_, _synchronization_, _scheduling_, ...

Internally, MapReduce processes data in three phases: **Map**, **Shuffle** and **Reduce**:

* **Map**: User-provided. Maps a KV pair to another KV pair. Essentially transforms the data.
* **Shuffle**: Handled by MapReduce. Groups all results of the _Map_ phase by the resulting keys.
* **Reduce**: User-provided. Aggregates/Reduces the values of a single key (i.e., a group returned by the _Shuffle_ phase) into _one_ final result.

A simple demo use-case is counting the amount of words in documents. Here, we can define the following Map/Reduce functions, resulting in the following MapReduce flow:

```ts
map(key: string, value: string) {
  foreach (word of value.split(" "))
    yield return (word, 1);
}

reduce(key: string, value: Iterator<string>) {
  return (key, value.cast<Int>().sum().cast<string>());
}
```

{{< figure src="./map-reduce.png" caption="The MapReduce flow for counting words in documents." >}}

Internally, MapReduce uses a master/slave architecture and a distributed file system (GFS/HDFS). The **master node** takes care of job tracking (i.e., task assignment) while the **slave nodes** are the _workers_ executing the Map/Reduce tasks.

## Case Study: (Apache) Pig

MapReduce is powerful, but is a lower-level abstraction that, while handling the complexity of a DS, leaves a lot of work remaining for the application developer. Many common tasks, especially in the area of data analysis (_filter_, _join_, _group_, ...) is missing in MapReduce.

Pig is a framework which _builds upon MapReduce_ and provides these operations via the **Pig Latin** language. Pig Latin is an SQL-like, imperative language that is **compiled** into several _MapReduce steps_. This compilation process enables optimizations and simplifications in otherwise complex and potentially slow MapReduce applications.

The Pig compiler uses the following transformation structure: **Logical plan** ➡️ **Physical plan** ➡️ **MapReduce plan**. The last plan, MapReduce, is a sequence of multiple MapReduce programs that represent the initial Pig program. The following image shows the tiered compilation process:

{{< figure src="./pig-plans.png" caption="Pig's plan transformation." attr="Source" attrlink="http://infolab.stanford.edu/~olston/publications/vldb09.pdf" >}}
