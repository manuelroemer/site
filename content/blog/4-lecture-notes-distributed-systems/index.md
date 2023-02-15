---
draft: true
date: 2023-02-15T17:06:57+01:00
lastmod: null
title: "Lecture Notes: Distributed Systems"
summary: 'Lecture notes about and summaries of the "Distributed Systems" lecture at TUM.'
tags: ['university', 'distributed systems']
---

This is a summary of the [Distributed Systems](https://web.archive.org/web/20230215161635/https://campus.tum.de/tumonline/WBMODHB.wbShowMHBReadOnly?pKnotenNr=756837) course, taken in the winter semester 2022/2023. This is only a condensed version of the topics covered in the actual lecture and, if used for studying, should therefore not be used as a replacement of the actual material.

## Abbreviations

This summary uses the following abbreviations:

* **DS**: Distributed System
* **FP**: Functional Programming
* **FS**: File System
* **GFS**: Google File System
* **HDFS**: Hadoop Distributed File System
* **IDL**: Interface Definition Language
* **KV**: Key-Value
* **RPC**: Remote Procedure Call
* **RW**: Read-Write

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

**📄 Papers**: [1](https://web.stanford.edu/class/cs240/readings/89-leases.pdf)

Leases address the general issue of acquiring exclusive read- or write-access to a resource. They solve a problem of traditional locks applied to a DS: That any node which acquired a lock can crash or have a network failure, resulting in the lock never being released.  
Leases address this underlying problem by applying a **timeout**. A client can request a lease ("lock") for a resource for a limited amount of time and, if required, **renew** that lease. Once the lease **expires**, the resource is usable by other nodes again.

There are, typically, two types of leases:
1. **Read** leases (allows _many concurrent_ readers).
2. **Write** leases (allows _one single_ writer).

Servers may further forcibly **evict** clients holding a lease if required.

## Case Study: MapReduce

**📄 Papers**: [1](https://www.usenix.org/legacy/events/osdi04/tech/full_papers/dean/dean.pdf)

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

**📄 Papers**: [1](http://infolab.stanford.edu/~olston/publications/sigmod08.pdf), [2](http://infolab.stanford.edu/~olston/publications/vldb09.pdf)

MapReduce is powerful, but is a lower-level abstraction that, while handling the complexity of a DS, leaves a lot of work remaining for the application developer. Many common tasks, especially in the area of data analysis (_filter_, _join_, _group_, ...) is missing in MapReduce.

Pig is a framework which _builds upon MapReduce_ and provides these operations via the **Pig Latin** language. Pig Latin is an SQL-like, imperative language that is **compiled** into several _MapReduce steps_. This compilation process enables optimizations and simplifications in otherwise complex and potentially slow MapReduce applications.

The Pig compiler uses the following transformation structure: **Logical plan** ➡️ **Physical plan** ➡️ **MapReduce plan**. The last plan, MapReduce, is a sequence of multiple MapReduce programs that represent the initial Pig program. The following image shows the tiered compilation process:

{{< figure src="./pig-plans.png" caption="Pig's plan transformation." attr="Source" attrlink="http://infolab.stanford.edu/~olston/publications/vldb09.pdf" >}}

## Case Study: Google File System (GFS) / Hadoop Distributed File System (HDFS)

**📄 Papers**: [1](https://static.googleusercontent.com/media/research.google.com/en//archive/gfs-sosp2003.pdf)

Distributed file systems provide a FS spread out over various machines. Users of the FS do not necessarily notice this and may interact with the FS as if it was provided by the local device. Making a file system distributed massively increases the amount of storeable data and bandwidth, while, as a tradeoff, bringing all of the complexities of a DS.  
A distributed FS is often the very **bottom layer** of a DS, because reading/writing files is typically a core requirement of any application. As such, it is, for example, typical to see MapReduce applications written on top of a distributed FS.

GFS/HDFS are distributed FS implementations. GFS specifically was invented by Google to address internal requirements like large files, large streaming reads, concurrent appends, high bandwidth, etc. HDFS was introduced in the lecture as the open-source variant of GFS. In the following, details of GFS are described.

### GFS: Architecture Overview

{{< figure src="./gfs-architecture.png" caption="GFS Architecture." >}}

GFS typically has a **master/coordinator node** which provides **metadata** information to clients about **data nodes**. **Data nodes** (also called _chunk servers_) are responsible for storing the actual FS data. Here, they use the machine's local FS for storage. The _master node_ is made aware of the available _data nodes_ via **heartbeats**. Due to the master node being **centralized**, clients will try to minimize the time spent interacting with it. Generally, clients will talk to data nodes _directly_. They do have to contact the master node for getting the data node metadata though (and for acquiring a lease on that node):

{{< figure src="./gfs-access.png" caption="GFS data access." >}}

GFS structures files into various chunks (with a length of 64MB). These chunks are replicated accross multiple data nodes. When clients want to _read/write a chunk_, they talk to the master node which provides the chunk location. Clients are then free to choose any replica holding the chunk (and will typically choose the closest).

{{< figure src="./gfs-chunking.png" caption="Chunks in GFS. Note that the file is spread over different data nodes/replicas." >}}

### GFS: Reading and Writing Data

_Reading_ data is straightforward: The client contacts the data node containing the chunk of interest. _Writing_ data is, however, more complex. The following image shows the required steps. Briefly, the following happens:

1. The client retrieves the data node locations from the master.
2. The client pushes the data to **all replicas**.  
   Note that the client only makes one request: The replicas **forward** the request to the nearest, next replica.
3. The client asks the primary replica to finalize the write. The primary forwards this request to the secondary replicas.
4. If everything succeeded, the client is notified. If not, he will retry.

{{< figure src="./gfs-write.png" caption="Writing data in GFS." attr="Source" attrlink="https://static.googleusercontent.com/media/research.google.com/en//archive/gfs-sosp2003.pdf" >}}

Writes in GFS are **consistent**, but **undefined**. This is the case because it's possible for file regions to end up containing mingled fragments from different clients. _"Consistent"_, in this case, means that all clients will see the same _results_. This result may not be what the client _wrote_. In contrast, a chunk/region is called _"defined"_, if the result is exactly what the client wrote. See the following table for overall consistency guarantees:

{{< figure src="./gfs-consistency.png" caption="GFS Consistency Guarantees." attr="Source" attrlink="https://static.googleusercontent.com/media/research.google.com/en//archive/gfs-sosp2003.pdf" >}}
