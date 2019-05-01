
* authenticated
* virtualized
* heterogenous
* self-organizing

---


* should people share information they haven't reviewed?
* gossip on demand
  * don't sync 3 hops unless the first hop has been reviewed
* assign a lifetime to data
  * votes in aether

---

scale of 1 - 5

1. human driver
2.
3. autonomous driving on highways
4.
5. perfectly safe AI driver

---

scale of 1 - 5

1. centralized banking
2. redimentary cryptocurrencies
3. high throughput and scale
4. 
5. low latency, fully decentralized, highly usable

---

Deploying software is hard.

Let's try a service oriented architecture, where services have public keys which are validated as RPCs.
As long as authentication is implemented in clients, and we have a suitable p2p routing system, then we don't need to worry about MitM attacks, or implementing fragile glue code between RPCs.

Where nodes can look like any of:

* native
  * http server
  * (web)socket server
  * command line client
* browser
  * sharedWorker
  * webworker
  * main thread in a browser
  * another domain in an iframe
* virtual
  * a distinct service with its own identity
    * but run within the memory of another service
    * or spawned by a service through some API



Thereby abstracting the problem of network traversal as a key distribution scheme.

This architecture could support:

* Group messaging
* Log replication (a la scuttlebutt)

---

## User stories

* I want this identity to have this piece of information:
  * whenever it's convenient for it to be sent
    * we are on the same network
    * when it costs me nothing
    * when the network is not congested
  * as soon as possible
  * more urgently than anything else I have scheduled
* I want to have a piece of information
  * located in a particular place
  * bearing these qualities
    * search
      * by content
      * by relation
      * by author
  * with this hash
    * content addressed
* I want to create a new identity which is:
  * a special-interest variation of my primary identity
  * completely anonymous
  * reasonably anonymous but requiring considerably
    * low latency
    * high throughput
* I want to store this information for myself at a later time
* I want to publish information which only I can modify
* I want to publish information that anyone can edit
* I want to modify some information I have already declared
  * with minimal bandwidth requirements for an audience
* I want to collaboratively edit a document with any number of peers
  * with an audience that cannot edit the document
* I want to review information before
  * I delete it
  * I pass it on to my friends
* I prefer to
  * view recent content
  * keep all content
* I don't want to download new content
  * until I have reviewed my old content
* I want to assign a lifetime
  * for a piece of data
  * for a class of data
  * for an identity
* I want to share something ephemeral
* I want to share something permanently
* I want to be able to
  * invite a member to a group
  * remove a member from a group
    * unless they outrank me?
  * define rules for what I see and share:
    * only things which nobody has flagged as inappropriate
    * everything
    * some things, no matter their status
    * only things which certain people have no flagged as inappropriate
  * appoint a member of a group as a moderator
  * choose which moderator I want to listen to?
    - will this fork the group?
  * choose who can see my IP address
  * introduce myself
  * introduce someone else
  * block someone
  * privately block someone
  * mute someone (replicate but don't view)



## Questions

* What is a group?


