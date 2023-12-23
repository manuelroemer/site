---
date: 2023-02-16T19:54:00+01:00
lastmod: null
title: 'Lecture Notes: Distributed Systems'
summary: 'Lecture notes about and summaries of the "Distributed Systems" lecture at TUM.'
tags: ['university', 'distributed systems']
toc: true
---

## Summary

This is a summary of the [Distributed Systems](https://web.archive.org/web/20230215161635/https://campus.tum.de/tumonline/WBMODHB.wbShowMHBReadOnly?pKnotenNr=756837) course, taken in the winter semester 2022/2023. This is only a condensed version of the topics covered in the actual lecture and, if used for studying, should therefore not be used as a replacement of the actual material.

## Abbreviations

This summary uses the following abbreviations:

- **2PC**: 2 Phase Commit
- **2PL**: 2 Phase Locking
- **ACID**: Atomic, Consistent, Isolated & Durable
- **API**: Application Programming Interface
- **CAS**: Compare-and-Swap
- **DB**: Database
- **DS**: Distributed System
- **FP**: Functional Programming
- **FS**: File System
- **GFS**: Google File System
- **HDFS**: Hadoop Distributed File System
- **IDL**: Interface Definition Language
- **KV**: Key-Value
- **LSM**: Log Structured Merge-Tree
- **NTP**: Network Time Protocol
- **RPC**: Remote Procedure Call
- **RW**: Read-Write
- **SMR**: State Machine Replication
- **TX**: Transaction
- **ZAB**: Zookeeper Atomic Broadcast

## Terminology

The lecture and this summary assume the following meaning behind these terms:

- **Distributed System (DS)**: An application running on multiple different machines (hereafter called _nodes_) communicating via the _network_ while trying to achieve a common _task_.
- **Node**: Any kind of machine that is communicating with others within a DS.
- **Message**: Data sent from one node to another.
- **Fault**: Indicates that _some part_ of the DS is malfunctioning.
- **Failure**: Indicates that the entire DS malfunctions.
- **Fault Tolerance**: A DS continues working, despite one or multiple _faults_ occurring.
- **Failure Detector**: An algorithm that detects whether a node is faulty. Typically done via message timeouts.
- **Network Partition**: Some links between nodes dropping/delaying messages for an extended period of time.
- **Latency**: The time until a message arrives (i.e., the "time in transit") (e.g., 10ms).
- **Bandwidth**: The data volume that can be sent over a certain period of time (e.g., 1 Mbit/s).
- **Availability**: A synonym for "uptime", i.e., the fraction of time that a DS is working correctly (from the perspective of a user).
- **(Un-)marshalling**: A synonym for (de-)serializing a data structure so that it can be sent over the network.
- **Interface Definition Language (IDL)**: A format defining type signatures in a (programming) language-independent way.
- **Happens-Before Relation**: An event _a_ _happens before_ an event _b_ if:

  - _a_ and _b_ occur at the same node _and_ _a_ occured before _b_.
  - _a_ is the sending of a message and _b_ is the receiving of that message.
  - an event _c_ exists where _a_ -> _c_ and _c_ -> _b_.

  The inverse is a concurrent event (_a || b_).

- **Causality**: Essentially, what _caused_ an event? An event _a_ concurrent to _b_ cannot have caused _b_. If _a_ happened before _b_, it might have.
- **Quorum**: A majority of entities (here, nodes) confirms an operation. Typically `(n + 1) / 2`. Failure to reach quorum indicates an issue.
- **Local-first Software**: Software, where a local device is a fully-functional replica and servers are just for backup.
- **Microkernel**: An approach to design a (operating) system. In contrast to a monolithic approach, features are not part of the kernel, but "separate modules" in user space.
- **Idempotence**: A function `f(x)` is _idempotent_ if `f(x) = f(f(x))`, i.e., if it can be invoked multiple times without causing duplication.  
  In a DS, idempotence may have an influence on retry semantics:
  - **At-most-once**: Send request _once_, don't retry. Updates are _allowed_.
  - **At-least-once**: Send request _until acknowledged_. Updates can _be repeated_.
  - **Exactly-once**: Request can be _retried infinitely_ because they are _idempotent_ (or deduplicated).
- **2 Phase Locking (2PL)**: A flow where locks are acquired in two phases:
  - _Expanding phase_ (locks are being acquired until all required locks are held, i.e., until the _lock point_ is reached).
  - _Shrinking phase_ (all previously acquired locks are released).
- **2 Phase Commit (2PC)**: An atomic commitment protocol consisting of two phases:
  - _Commit request phase_: A coordinator attempts to prepare all processes for a TX; other process can _commit_ or _abort_ that TX.
  - _Commit phase_: If all process voted to _commit_, the TX is commited; otherwise _aborted_.
- **Paxos**: A distributed _consensus_ algorithm (similar to Raft).

## Distributed Systems - Motivation

{{< figure src="./client-server.png" caption="The simplest possible DS, consisting of two nodes sending a message to each other." >}}

There are many possible reasons for choosing to architecting a system in a distributed way:

- The system could, by its very nature, be distributed.
- A DS is typically more reliable.
- A DS might bring better performance (e.g., for geographic reasons).
- A DS can help with data limitations.
- ...

In summary, a DS might overcome typical challenges that would otherwise occur with a non-distributed, single-machine system. However, as a tradeoff, any DS will have to overcome new challenges that are not present in a non-distributed system:

- It must be _fault-tolerant_.
- It must be _available_.
- It must be able to _recover_ in the case of faults or failures.
- It must be _consistent_.
- It must be able to _scale_.
- It must be _performant_.
- It must be _secure_.

## Concept: System Models

Assuming a bi-directional point-to-point communication between two nodes, the following system model can be derived:

| Part        | Option 1    | Option 2              | Option 3     |
| ----------- | ----------- | --------------------- | ------------ |
| **Network** | reliable    | fair-loss             | arbitrary    |
| **Nodes**   | crash-stop  | crash-recovery        | byzantine    |
| **Timing**  | synchronous | partially synchronous | asynchronous |

The options have the following meaning:

- **Network**:
  - **reliable**: A message is received if, and only if, it is sent.
  - **fair-loss**: Messages may be lost, deduplicated or reordered. If retrying long enough, it will eventually get through.
  - **arbitrary**: A malicious adversary may interfere with messages.
- **Nodes**:
  - **crash-stop**: A node is faulty if it crashes. Crashed nodes stop forever.
  - **crash-recovery**: A node may crash at any moment, but may resume eventually. Persisted data survives.
  - **byzantine**: A node is faulty if it deviates from the algorithm. Faulty nodes may do _anything_, including malicious behavior (e.g., dropping all messages).
- **Timing**:
  - **synchronous**: Message latency has a known upper bound. Nodes execute at a known speed.
  - **partially synchronous**: The system is asynchronous for some finite, unknown time, but synchronous otherwise.
  - **asynchronous**: Messages can be delayed arbitrarily. Nodes can pause arbitrarily. No timing guarantees exist.

The further right the option is in the table, the harder it becomes. Algorithms choose 1 option out of each row that they can handle (e.g., an algorithm could function in a _fair-loss_ network with _crash-stop_ nodes and _asynchronous_ timing).

## Concept: Timing and Clocks

Measuring the current time is essential to a DS, e.g., for **ordering messages**. It is, also, a very hard problem. Time is measured by clocks.
We firstly distinguish between these clocks:

1. **Time-of-day clock**: Time since a fixed date.
2. **Monotonic clock**: Time since an arbitrary point in time (e.g., when a machine was started).

In a DS, clocks must be synchronized to adjust/fix a local clock's _drift_ (deviation). Here, multiple protocols/algorithms exist.  
One of them is the **Network Time Protocol (NTP)** which synchronizes time by sending a request to an NTP server. The server answers with its current time. That + the duration of the request and response allow the client to update its local time.

We can further differentiate between the following clocks:

1. **Physical clocks**: Count the number of seconds elapsed since a given point in time.
2. **Logical clocks**: Count _events_ (e.g., number of messages sent). Designed for capturing _causal dependencies_. Here, we look at two variants:
   1. **Lamport clock**
   2. **Vector clock**

The **Lamport clock** uses the following algorithm. Notably, it maintains an **event counter t** internally that is incremented whenever an _event occurs_. The counter is **attached** to any **message sent**. Sending/Receiving a message is an event itself and _increases the counter_. Nodes receiving a message always **update** their internal counter to the highest known counter.

```
on initialisation do
  t := 0 // each node has its own local variable t
end on

on any event occurring at the local node do
  t := t + 1
end on

on request to send message m do
  t := t + 1
  send (t, m) via the underlying network link
end on

on receiving (t', m) via the underlying network link do
  t := max(t, t') + 1
  deliver m to the application
end on
```

A **Vector clock**, on the other hand, maintains a **counter for every node** inside a _vector_ (array). The entire vector is delivered with a message:

```
on initialisation at node i do
  T := (0, 0, ... , 0) // local variable at node N i
end on

on any event occurring at node i do
  T[i] := T[i] + 1
end on

on request to send message m at node i do
  T[i] := T [i] + 1
  send (T, m) via network
end on

on receiving (T', m) at node i via the network do
  T[j] := max(T[j], T'[j]) for every j in {1, ... , n}
  T[i] := T[i] + 1
  deliver m to the application
end on
```

Vector clocks, in contrast to Lamport clocks, provide information about causality, i.e., which event may have caused another.

## Concept: Broadcasts

Broadcasting means delivering a message from one node to all others. Broadcasts build upon [System Models](#concept-system-models). A broadcast can be **best-effort** (may drop messages), **reliable** (non-faulty nodes deliver every message, via retries) with either an **asynchronous** or **partially synchronous** timing model.

The following _reliable broadcasts_ were presented:

- **FIFO broadcast**: If one node delivers _m1_ and _m2_ and _broadcast(m1)_ happens before _broadcast(m2)_, then _m1_ must be delivered before _m2_.  
  FIFO broadcast can easily be implemented via TCP.
- **Causal broadcast**: If _broadcast(m1)_ happens before _broadcast(m2)_, then _m1_ must be delivered before _m2_.
- **Total order broadcast**: If _m1_ is delivered before _m2_ on _any_ node, then _m2_ must be delivered before _m2_ on _all_ nodes. There are approaches to a total order broadcast:
  - **Single leader approach**: One node is a leader. Every message goes through the leader.
  - **Lamport clock approach**: Every message has a Lamport clock timestamp attached. A message cannot be delivered before all previous messages have been delivered. Nodes must therefore store newer messages until all previous ones have been received.
- **FIFO total order broadcast**: FIFO + total order broadcast.

**FIFO broadcast algorithm**:

```
on initialisation do
  sendSeq := 0
  delivered := (0, ..., 0)
  buffer := {}
end on

on request to broadcast m at node i do
  deps := delivered
  deps[i] := sendSeq
  send (i, deps, m) via reliable broadcast
  sendSeq := sendSeq + 1
end on

on receiving msg from reliable broadcast at node i do
  buffer := buffer ∪ {msg}

  while ∃(sender, deps, m) 2 buffer.deps <= delivered do
    deliver m to the application
    buffer := buffer \ {(sender, deps, m)}
    delivered[sender] := delivered[sender] + 1
  end while
end on
```

**Causal broadcast algorithm**:

```
on initialisation do
  sendSeq := 0
  delivered := (0, ..., 0)
  buffer := {}
end on

on request to broadcast m at node i do
  deps := delivered
  deps[i] := sendSeq
  send (i, deps, m) via reliable broadcast
  sendSeq := sendSeq + 1
end on

on receiving msg from reliable broadcast at node i do
  buffer := buffer ∪ {msg}

  while ∃(sender, deps, m) ∈ buffer.deps <= delivered do
    deliver m to the application
    buffer := buffer \ {(sender, deps, m)}
    delivered[sender] := delivered[sender] + 1
  end while
end on
```

## Concept: Replication

**Replication** is the process of keeping _multiple copies_ of data on _multiple machines_. Replicas are, due to the distributed nature, frequently **out of sync** and must **reconcile** (i.e., synchronize their states). This can become troublesome when clients read/write concurrently on different out-of-sync replicas, e.g., because two clients might read different values.  
**Concurrent writes** can be solved via two approaches: **Last writer wins** or **Multi-value register** (timestamps with partial order, where two concurrent values can both be kept).
**Read after write concurrency** (i.e., after _writing_ to one replica, reading the _same value_ from a _different_ replica) can be solved via **quorums**.

**State Machine Replication (SMR)** is an approach to make replicas fault tolerance. It builds upon the fact that **state machines** are deterministic: For a given input, a state machine will always produce a given output. Applied to a DS, it is possible to make each replica a state machine. By observing the output of each other, replicas notice when another replica becomes faulty (this is the case when the output of a replica deviates from the expected output).  
SMR uses **FIFO total order broadcast** for every _update_ on all replicas. Applying an update is _deterministic_.

```
on request to perform update u do
  send u via FIFO-total order broadcast
end on

on delivering u through FIFO-total order broadcast do
  update state using arbitrary deterministic logic
end on
```

## Concept: Linearizability

**Linearizability** is a _strong correctness_/_strong consistency_ condition, where a _set of concurrent operations_ on _multiple machines_ can be reordered/executed in a way, as if they were running _on a single machine_. Every operation takes effect _atomically_ sometime after started and ended.

Linearizability is not present by default, but can, in many cases, be achieved via specific approaches or algorithms. An example is the **ABD algorithm**:

{{< figure src="./abd.png" caption="ABD algorithm. (Source: Lecture Slides)" >}}

The part highlighted in green ensures linearizability. Without it, client 3 would **not** read the value written by client 1, despite a quorum (because the replicas from which client 3 reads haven't received notice of the change yet).

It's even possible to write a linearized compare-and-swap (CAS) operation in a DS:

```
on request to perform get(x) do
  total order broadcast (get, x) and wait for delivery
end on

on request to perform CAS(x, old, new) do
  total order broadcast (CAS, x, old, new) and wait for delivery
end on

on delivering (get, x) by total order broadcast do
  return localState[x] as result of operation get(x)
end on

on delivering (CAS, x, old, new) by total order broadcast do
  success := false

  if localState[x] = old then
    localState[x] := new
    success := true
  end if

  return success as result of operation CAS(x, old, new)
end on
```

## Concept: Consensus

Motivation: For a _fault-tolerant total order broadcast_ using a _leader_, it's required to be able to automatically **elect a new leader**. This requires **consensus** among the nodes.  
Consensus generally means having multiple nodes **agree on a single value**. This can be used for **leader election**.

One algorithm for leader election is **Raft**. Raft elects **one leader** per **term**. A **new term** is started when the old leader becomes faulty. Raft **can only guarantee one leader per term**, but must allow multiple leaders from different terms at a given point in time. In Raft, nodes may take on the following states:

{{< figure src="./raft-states.png" caption="Raft node state transitions. (Source: Lecture Slides)" >}}

```
on initialisation do
  currentTerm := 0
  votedFor := null
  log := ()
  commitLength := 0
  currentRole := follower
  currentLeader := null
  votesReceived := {}
  sentLength := ()
  ackedLength := ()
end on

on recovery from crash do
  currentRole := follower
  currentLeader := null
  votesReceived := {}
  sentLength := ()
  ackedLength := ()
end on

on node nodeId suspects leader has failed, or on election timeout do
  currentTerm := currentTerm + 1
  currentRole := candidate
  votedFor := nodeId
  votesReceived := {nodeId }
  lastTerm := 0

  if log.length > 0 then
    lastTerm := log[log.length - 1].term
  end if

  msg := (VoteRequest, nodeId, currentTerm, log.length, lastTerm)

  for each node of nodes
    send msg to node
  end for each

  start election timer
end on

on receiving (VoteRequest, cId, cTerm, cLogLength, cLogTerm) at node nodeId do
  if cTerm > currentTerm then
    currentTerm := cTerm
    currentRole := follower
    votedFor := null
  end if

  lastTerm := 0

  if log.length > 0 then
    lastTerm := log[log.length - 1].term
  endif

  logOk := (cLogTerm > lastTerm) ||
    (cLogTerm = lastTerm && cLogLength >= log.length)

  if cTerm = currentTerm && logOk && votedFor in {cId null} then
    votedFor := cId
    send (VoteResponse, nodeId, currentTerm, true) to node cId
  else
    send (VoteResponse, nodeId, currentTerm, false) to node cId
  end if
end on

on receiving (VoteResponse, voterId, term, granted) at nodeId do
  if currentRole = candidate && term = currentTerm && granted then
    votesReceived := votesReceived union {voterId}

    // Quorum reached?
    if |votesReceived| >= ceil((|nodes| + 1) / 2) then
      currentRole := leader
      currentLeader := nodeId
      cancel election timer

      for each follower in nodes \ {nodeId} do
        sentLength[follower] := log.length
        ackedLength[follower] := 0
        ReplicateLog(nodeId, follower)
      end for each
    end if
  else if term > currentTerm then
    currentTerm := term
    currentRole := follower
    votedFor := null
    cancel election timer
  end if
end on

on request to broadcst msg at node nodeId do
  if currentRole = leader then
    append the record (msg : msg, term : currentTerm) to log
    ackedLength[nodeId] := log.length

    for each follower in nodes \ {nodeId} do
      ReplicateLog(nodeId, follower)
    end for each
  else
    forward the request to currentLeader via FIFO link
  end if
end on

periodically at node nodeId do
  if currentRole = leader then
    for each follower in nodes \ {nodeId} do
      ReplicateLog(nodeId, follower)
    end for each
  end if
end do

// Only called on leader whenever there is a new message in the log + periodically.
function ReplicateLog(leaderId, followerId)
  prefixLen := sentLength[followerId]
  suffix := (log[prefixLen], log[prefixLen + 1], ..., log[log.length - 1])
  prefixTerm := 0

  if prefixLen > 0 then
    prefixTerm := log[prefixLen - 1].term
  end if

  send (LogRequest, leaderId, currentTerm, prefixLen, prefixTerm, commitLength, suffix) to followerId
end function

// follower receiving messages
on receiving (LogRequest, leaderId, term, prefixLen, prefixTerm, leaderCommit, suffix) at node nodeId do
  if term > currentTerm then
    currentTerm := term
    voedFor := null
    cancel election timer
  end if

  if term = currentTerm then
    currentRole := follower
    currentLeader := leaderId
  end if

  logOk := (log.length >= prefixLen) && (prefixLen = 0 || log[prefixLen - 1].term = prefixTerm)

  if (term = currentTerm && logOk then
    AppendEntries(prefixLen, leaderCommit, suffix)
    ack := prefixLen + suffix.length
    send (LogResponse, nodeId, currentTerm, ack, true) to leaderId
  else
    send (LogResponse, nodeId, currentTerm, 0, false) to leaderId
  end if
end on

// update followers' logs
function AppendEntries(prefixLen, leaderCommit, suffix)
  if suffix.length > 0 && log.length > prefixLen then
    index := min min(log.length, prefixLen + suffix.length) - 1

    if log[index].term != suffix[index - prefixLen].term then
      log := (log[0], log[1], ..., log[prefixLen - 1])
    end if
  end if

  if prefixLen + suffix.length > log.length then
    for i := log.length - prefixLen to suffix.length - 1 do
      append suffix[k] to log
    end for
  end if

  if leaderCommit > commitLength then
    for i := commitLength to leaderCommit - 1 do
      deliver log[i].msg to the application
    end for

    commitLength := leaderCommit
  end if
end function

// leader receiving acks
on receiving (LogResponse, follower, term, ack, success) at nodeId do
  if term = currentTerm && currentRole = leader then
    if success && ack >= ackedLength[follower] then
      sentLength[follower] := ack
      ackedLength[follower] := ack
      CommitLogEntries()
    else if sentLength[follower] > 0 then
      sentLength[follower] := sentLength[follower] - 1
      ReplicateLog(nodeId, follower)
    end if
  else if term > currentTerm then
    currentTerm := term
    currentRole := follower
    votedFor := null
    cancel election timer
  end if
end on

// leader committing log entries
define acks(length) = |{n in nodes | ackedLength[n] >= length}|

function CommitLogEntries()
  minAcks := ceil((|nodes| + 1) / 2)
  ready := {len in {1, ..., log.length} | acks(len) >= minAcks}

  if ready != {} && max(ready) > commitLength && log[max(ready) - 1].term = currentTerm then
    for i := commitLength to max(ready) - 1 do
      deliver log[i].msg to the application
    end for

    commitLength := max(ready)
  end if
end function
```

## Concept: Eventual Consistency

While [Linearizability](#concept-linearizability) is a strong model, it has disadvantages in the form of _performance_, _scalability_ and _availability_. Sometimes, weaker models are enough for a DS. One such model is **eventual consistency**. It states that **if there are no more updates**, then all replicas will **eventually** be in the same state.  
**Strong eventual consistency** improves on the "no more updates" part via the following points:

- **Eventual delivery**: Every update made to _one_ non-faulty replica is eventually processed by _every_ non-faulty replica.
- **Convergence**: Any replicas which have processed the _same updates_ are in the _same state_.

## Concept: RPC (Remote Procedure Call)

RPC is a concept that leverages a DS to execute a function (or _procedure_) on a _remote_ machine. This is hidden from the caller of the function (**location transparency**).

A prominent example is a transaction of money:

```js
// At the client:
let result = processPayment({
  card: '123456',
  amount: 13.0,
});

log('Result: ' + result.ok);
```

In the above example, the `processPayment` function is not executed locally on the client, but instead on another node. Both the function's argument and the result are (un-)marshalled before/after being sent/received over the network.

{{< figure src="./rpc.png" caption="The internals of the RPC request/response flow." >}}

RPCs are very common in todays applications. Examples of prominent RPC frameworks/technologies are:

- gRPC
- REST
- Java RMI

## Concept: Leases

**📄 Papers**: [1](https://web.stanford.edu/class/cs240/readings/89-leases.pdf)

Leases address the general issue of acquiring exclusive read- or write-access to a resource. They solve a problem of traditional locks applied to a DS: That any node which acquired a lock can crash or have a network failure, resulting in the lock never being released.  
Leases address this underlying problem by applying a **timeout**. A client can request a lease ("lock") for a resource for a limited amount of time and, if required, **renew** that lease. Once the lease **expires**, the resource is usable by other nodes again.

There are, typically, two types of leases:

1. **Read** leases (allows _many concurrent_ readers).
2. **Write** leases (allows _one single_ writer).

Servers may further forcibly **evict** clients holding a lease if required.

## Concept: Key-Value (KV) Stores

KV stores are NoSQL-like, distributed systems which are able to store massive amounts of **values** indexed by a **key**. At their core, they have a very slim API surface:

```js
get(key);
put(key, value);
delete key;
```

This simple API brings a lot of benefits in a distributed world: **Reliability**, **high availability**, **high performance**, **horizontal scalability**, etc. The tradeoff being made is the lack of a data schema (which becomes apparent when comparing a KV store with a fully-fledged SQL database).

Prominent examples of KV stores are:

- BigTable
- Apache HBase
- Apache Cassandra
- Redis
- Amazon Dynamo

KV stores typically build upon a concept called [**consistent hashing**](#concept-consistent-hashing).

KV stores typically **replicate** values. KV pairs can be read from any replica.

For a real-life example, see [Cassandra](#case-study-cassandra).

## Concept: Consistent Hashing

Consistent hashing addresses the problem of _mapping objects to caches_. Given a number of caches, each cache should hold an equal share of cachable objects. Clients need to know which cache to contact to avoid cache misses. The key issue to be solved here is how to partition the objects in a _non-skewed distribution_, i.e., in a way where object identifiers are evenly mapped to the available caches. Given a uniformly distributed hash function, **hashing** is one way to solve this.

The problem with using "normal hashing" is that, on failure of a cache node, other nodes would have to repopulate their internal cache. This would cause a lot of inefficient cache misses:

{{< figure src="./consistent-hashing-problem.png" caption="The problem of not using consistent hashing." >}}

Consistent hashing solves the issue by **allowing the addition/removal** of cache nodes **without (much) disruption**. Consistent hashing is implemented via a key ring and a hash function that uniformly distributes the results over an interval `[0, M]` where `M` indicates the number of cache nodes. Each cache node is placed at a certain position of the key ring. A node is responsible for every key <= its position. When new nodes are _added_, they take over the responsibility for their new key ring section from the node that previously handled them. When nodes _fail_, the successor node takes over the failed nodes responsibilities. Node addition/removal can be coordinated via _gossiping_ or a _central coordinator_ service. The following image shows an example:

{{< figure src="./consistent-hashing-ring.png" caption="Consistent hashing applied." >}}

When a client wants to do a **lookup**, he needs to fetch the information about which cache node is responsible for the (hashed) key. He can then (depending on the system, of course) directly contact that node. The cache lookup data structure can be implemented as a **binary tree** for `O(log n)` lookups (but other solutions exist as well).

## Concept: Log Structured Merge-Trees (LSM)

LSMs are a data structure which became popular for NoSQL systems. It combines the benefits of RAM and hard drives (i.e., **fast access** and **persistence**). They provide a very simple API:

```js
get(key);
put(key, value);
```

LSMs leverage three key data structures:

- **MemTable**: A KV data structure kept entirely in-memory. Uses a Skip list for fast value access.
- **SSTable**: A persistent, disk-based data structure. Stores **immutable** KV pairs.
- **WAL**: Append-only log file for fault tolerance (supports UNDO And REDO logs).

In practice, these data structures work together like this:

{{< figure src="./lsm-architecture.png" caption="LSM Architecture." attr="Source" attrlink="https://medium.com/@qiaojialinwolf/lsm-tree-the-underlying-design-of-nosql-database-cf30218e82f3" >}}

1. New KV pairs are **immediately** added to the WAL (allows recovery).
2. KV pair is added to MemTable.
3. Once MemTable runs **out of space**: It is made **immutable**. A new MemTable is created.
4. Immutable MemTables can be **stored on disk**. Here, multiple **layers** exist, continuously increasing in size. _Newer_ entries are stored in the _upper_ layers. Lookups go through the layers, in order.

LSMs use a **compaction phase** (i.e., "garbage collection") in the background to merge SSTables from different layers (older keys are updated with newer values - the old values are discarded).

LSMs don't support "traditional" deletes. Instead, deleted KV pairs are marked with a tombstone (and can be removed in the upcoming compaction phases).

## Case Study: MapReduce

**📄 Papers**: [1](https://www.usenix.org/legacy/events/osdi04/tech/full_papers/dean/dean.pdf)

MapReduce is a model/library introduced by Google. It provides an abstraction for processing large amounts of data on multiple distributed machines. It provides a slim API to application developers, inspired by FP concepts:

- `map(key, value): (key, value)`
- `reduce(key, value): (key, value)`

Application developers only need to implement these two functions when using MapReduce. MapReduce itself then handles the entire complexity of that come with distributed data processing: _parallelization_, _communication_, _load balancing_, _fault tolerance_, _synchronization_, _scheduling_, ...

Internally, MapReduce processes data in three phases: **Map**, **Shuffle** and **Reduce**:

- **Map**: User-provided. Maps a KV pair to another KV pair. Essentially transforms the data.
- **Shuffle**: Handled by MapReduce. Groups all results of the _Map_ phase by the resulting keys.
- **Reduce**: User-provided. Aggregates/Reduces the values of a single key (i.e., a group returned by the _Shuffle_ phase) into _one_ final result.

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

## Case Study: Zookeeper

**📄Papers**: [1](https://www.usenix.org/legacy/event/atc10/tech/full_papers/Hunt.pdf)

Zookeeper is a microkernel-like application which, as a kernel, provides a foundation for other distributed systems. It provides a slim API surface which can be used for common tasks/challenges like _configuration_, _naming_, _synchronization_, _discovery_, _group services_, ... Internally, Zookeeper uses a cluster of servers with one leader to serve an arbitrary number of clients.  
Zookeeper uses/guarantees **FIFO-ordering** for clients, **Linearizable writes** and a **wait-free API**.  
Each Zookeeper server keeps a **full copy** of the state **in-memory**.

{{< figure src="./zookeeper-architecture.jpg" caption="Zookeeper Architecture." attr="Source" attrlink="https://zookeeper.apache.org/doc/r3.8.1/zookeeperOver.html" >}}

Zookeeper stores data in a **hierarchy**. The nodes are called **znodes**. These can store arbitrary data. A znode can be **regular** (persistent, client-managed) or **ephemeral** (deleted once the session of the creator client expires). A znode can also be **flagged** as **sequential** (resulting in increasing counters) and/or as **watch**ed (clients will be notified about changes). These foundations result in the following API:

```js
create(path, data, flags);
delete (path, version); // Version is used for conditional updates.
exists(path, watch);
getData(path, watch);
setData(path, data, version); // Version is used for conditional updates.
getChildren(path, watch);
sync(); // To flush() changes.
```

{{< figure src="./zookeeper-hierarchy.jpg" caption="A Zookeeper znode hierarchy." attr="Source" attrlink="https://zookeeper.apache.org/doc/r3.8.1/zookeeperOver.html" >}}

### Zookeeper: Practical Examples

**Configuration**: Get/Set shared settings.

```js
// Get config and be notified about changes:
let currentConfig = getData('.../config/settings', true)

// Update config:
setData('.../config/settings', newConfig)

// Update local config value on change:
onConfigChanged() {
  getData('.../config/settings', true)
}
```

**Group Membership**: Register clients as znodes which persist while the client is alive. Get all currently active clients as a leader.

```js
// Register myself in the "worker" group:
create('.../workers/myClient', myClientInfo, EPHEMERAL);

// Leader: get group members (and be notified about changes):
let members = getChildren('.../workers', true);
```

**Leader Election**: Find the leader or try to become the leader if no leader exists.

```js
let leader;
while (!leader) {
  leader = getData('.../workers/leader', true) || create('.../workers/leader', myClientInfo, EPHEMERAL);
}
```

**Mutex**: Create a single mutex.

```js
if (create('.../mutex', EPHEMERAL)) {
  // Mutex acquired!
} else {
  // Wait for release:
  getData('.../mutex', true);
}
```

### Zookeeper Atomic Broadcast (ZAB)

**📄 Papers**: [1](https://marcoserafini.github.io/papers/zab.pdf)

ZAB is a **crash-recovery** **atomic** **broadcast** algorithm used internally by Zookeeper. It guarantees **at-least-once** semantics (state changes are _idempotent_). Zookeeper **assumes fair-lossy links** and uses **TCP** to ensure FIFO order. Internally, Zookeeper uses a **primary-backup scheme** to maintain a consistent replica state. Here, a single **primary process** receives **all client requests** and forwards them, **in order**, to replicas via _ZAB_. The flow is depicted in the following image:

{{< figure src="./zab-flow.png" caption="ZAB flow for read/write requests." >}}

ZAB is used for crash recovery. When a _primary crashes_, other process first agree upon a _common state_ and then elect a _new primary_ via a _quorum_. There can only ever be _one_ active primary.

State changes are called _transactions (TX)_. Each TX is identified by a tuple `(zxid, value)` , where **zxid** is another tuple `(epoch, counter)`, where `epoch` is a counter that increases whenever the primary changes and `counter` is a number that increases with each new transaction. Therefore, zxid tuples can be ordered (first by the epoch, then by the counter).

Zookeeper requires the following **safety properties** to work properly:

- **Integrity**: In order to deliver a message, a process must have received that very same message.
- **Total order/Primary order**: If a message a is delivered before message b by a process, all other process must also deliver a before b.
- **Agreement**: Any two processes deliver the same message.
- **Primary integrity**: A primary broadcasts only once it has delivered the TXs of previous epochs (for recovery).

As mentioned before, a process in ZAB can be assigned two **roles**: **leader** and **follower**. To determine the current leader, ZAB uses three phases: **discovery**, **synchronization** and **broadcast**. Each process, independent of its current phase, has an internal **leader oracle** telling which process is currently supposed to be the leader (a process can reference itself here). Note that this information may not be accurate - to become a leader, all three phases have to be run through. Zookeeper **discovers failures** via **heartbeats**. On failure, the **discovery phase** is started with a leader election. The full ZAB algorithm plays out like this:

{{< figure src="./zab-phases.png" caption="The ZAB protocol, running through the three ZAB phases." attr="Source" attrlink="https://marcoserafini.github.io/papers/zab.pdf" >}}

The above image shows the entire algorithm. The three phases can be explained in a more simplified manner like this:

{{< figure src="./zab-phases-simplified.png" caption="The ZAB protocol, running through the three ZAB phases (simplified)." >}}

## Case Study: Cassandra

Cassandra is an **eventually consistent** [KV Store](#concept-key-value-kv-stores) developed by Facebook. It's based on Amazon Dynamo (a closed-source variant). Cassandra uses a **decentralized** architecture (i.e., no master assignment) and [consistent hashing](#concept-consistent-hashing). Information is exchanged via **gossiping**.

Internally, Cassandra is architected and processes reads/writes like this:

{{< figure src="./cassandra.png" caption="Cassandra internals and read/write behavior." >}}

## Case Study: Google's BigTable

**📄 Papers**: [1](https://web.archive.org/web/20180505034128/https://static.googleusercontent.com/media/research.google.com/en/archive/bigtable-osdi06.pdf)

BigTable is a distributed DB for storing **structured data**. It focuses on being **scalable**, **efficient**, and **self-managing**. Google introduced it to solve their high data demands.

One "BigTable" is a _sparse, distributed, persistent multi-dimensional sorted map_. Values can be accessed via the following lookup function: `lookup(key: (row, column, time)): value`.  
BigTable organizes data via **rows**, **columns** + **column families** (e.g., for access control) and **multiple values** _versioned_ by _UNIX timestamps_.  
For distributing and load-balancing, a _range of rows_ is organized into a **tablet**.

In summary, a BigTable is structured like this:

|         | **Column Family 1** |           |           | **Column Family 2** |           |
| ------- | ------------------- | --------- | --------- | ------------------- | --------- |
| **Row** | **Col 1**           | **Col 2** | **Col 3** | **Col 1**           | **Col 2** |
| 1       | V1 @ T1             | V2 @ T1   | V3 @ T1   | V4 @ T1             | V5 @ T1   |
|         | V1 @ T2             |           |           |                     |           |
| 2       | ...                 |           |           |                     |           |

BigTable offers the following (sketched out) API:

```js
// Table management:
createTable()
deleteTable()
...

// CRUD:
createRow()
readRow()
updateRowAtomic()
updateRowConditionally()
deleteRow()
singleRowTx()

// Scan:
rowIterator()
```

BigTable uses the following architecture:

{{< figure src="./bigtable-architecture.png" caption="BigTable architecture." >}}

Here, the nodes have the following responsibilities:

- **Master**:
  - Assigns tablets to tablet servers.
  - Detects faulty servers.
  - Handles garbage collection of deleted tablets.
  - Coordination (metadata, schema updates, ...).
  - **DOES NOT** provide locations of tablets.
- **Tablet server**:
  - Handles R/W requests of clients.
  - Splits large tablets.
  - Manages tablets on GFS.
  - Caches frequently accessed data.
  - **DOES NOT** hold any state - this is done entirely by GFS (which then also takes care of fault tolerance).
- **Chubby**:
  - Stores system metadata.
  - Handles tablet location.

## Case Study: Google's Spanner

**📄 Papers**: [1](https://www.usenix.org/system/files/conference/osdi12/osdi12-final-16.pdf)

Spanner is a _globally-distributed, scalable, multi-version_ DB developed by Google. A key point of interest is that it supports **externally-consistent, linearizable, distributed transactions**. Distributed transactions with strong semantics are, fundamentally, a very hard problem to solve.  
Spanner thus "competes" with [BigTable](#case-study-googles-bigtable), though they solve different goals: BigTable has _weak semantics_ (specifically, no transaction support beyond one row), while Spanner provides _strong semantics_ (distributed multi-row transactions).

Spanner builds upon the following techniques to achieve its goal:

- State Machine Replication within a shard (via Paxos)
- 2PL for serialization
- 2PC for distributed transactions
- Multi-version DB systems
- Snapshot isolation

Spanner introduced a novel concept: **Global wall-clock time** / **TrueTime**. Previous systems assumed that a global time was not possible. Spanner introduces such a global time _that is respected by every timestamp inside the system_ (resulting in `timestampOrder == commitOrder`). The **TrueTime** API exposes time as an _interval_ `[earliest, latest]` and **not** as a fixed timestamp. The interval is based on an error term **ε**, where `latest - earliest == ε`, i.e., `interval.length == ε`. ε is calculated based on time values provided by different servers.

{{< figure src="./spanner-truetime-timestamp.png" caption="TrueTime timestamp assignment." >}}

The above image shows how a timestamp is assigned using TrueTime. Notably, after acquiring all locks, a timestamp `s` is picked as the **latest** possible TrueTime. Afterwards, the system waits until `s < TrueTime.now().earliest` before releasing the locks. This guarantees that enough time has passed for the timestamp `s` to be valid. The waiting time is called **commit wait**.

_During_ the **commit wait**, the various servers _inside a Paxos group_ (i.e., one _shard_) also run Paxos to **achieve consensus** between the different replicas. _After_ the locks are released by the _leader_, all _follower_ nodes are notified about the TX (to incorporate the changes).

In reality, there are many different Paxos groups (shards). These also need to synchronize. One key aspect here is that the commit timestamp `s` needs to be picked from a variety of shards. Here, the **latest `s`** is picked to ensure consistency. The flow is depicted in the following picture:

{{< figure src="./spanner-sharded.png" caption="Sharded TX. Each TX takes place on a different shard. `T_c` leads the TX." >}}

Finally, Spanner's architecture is shown in the following images:

{{< figure src="./spanner-server-organization.png" caption="Spanner server organization." attr="Source" attrlink="https://www.usenix.org/system/files/conference/osdi12/osdi12-final-16.pdf" >}}

{{< figure src="./spanner-spanserver.png" caption="Spanserver software stack. Colussus is similar to GFS. The lock table is used for 2PL. The participant leader(s) run 2PC." attr="Source" attrlink="https://www.usenix.org/system/files/conference/osdi12/osdi12-final-16.pdf" >}}
