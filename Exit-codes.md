**Info**: Github Wiki is just a mirror of our [online](https://karafka.io/docs) documentation.

We highly recommend using our website [docs](https://karafka.io/docs) due to Github Wiki limitations. Only some illustrations, links, screencasts, and code examples will work here.

Please use [https://karafka.io/docs](https://karafka.io/docs).

---


Karafka supports three exit statuses:

- ```0``` - in case shutdown was smooth and everything was as expected (all the work was done, consumers stopped, etc.).
- ```1``` - Ruby exit code for syntax errors and any other boot problems.
- ```2``` - in case there was a forceful shutdown in which not all consumers finished their work. This can happen when you set up ```shutdown_timeout``` but your processing takes longer than that.
