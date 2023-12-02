# Array.fromAsync for JavaScript
ECMAScript Stage-3 (conditional on editor review) Proposal. J. S. Choi, 2021.

* **[Specification][]** available
* **Experimental polyfills** (do **not** use in production code yet):
  * **[array-from-async][]**
  * **[core-js][]**

[specification]: https://tc39.es/proposal-array-from-async/
[core-js]: https://github.com/zloirock/core-js#arrayfromasync
[array-from-async]: https://www.npmjs.com/package/array-from-async
[§ Errors]: #errors
[§ Sync-iterable inputs]: #sync-iterable-inputs

## Why an Array.fromAsync method
Since its standardization in JavaScript, **[Array.from][]** has become one of
`Array`’s most frequently used built-in methods. However, no similar
functionality exists for async iterators.

```js
const arr = [];
for (const v of iterable) {
  arr.push(v);
}

// This does the same thing.
const arr = Array.from(iterable);
```

[Array.from]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from

Such functionality would also be useful for **dumping** the entirety of an
**async iterator** into a **single data structure**, especially in **unit
tests** or in **command-line** interfaces. (Several real-world examples are
included in a following section.)

```js
const arr = [];
for await (const v of asyncIterable) {
  arr.push(v);
}

// We should add something that does the same thing.
const arr = await ??????????(asyncIterable);
```

There is an [it-all][] NPM library that performs only this task
and which gets about 50,000 weekly downloads.
This of course does **not** include any code
that uses ad-hoc `for await`–`of` loops with empty arrays.
Further demonstrating the demand for such functionality,
several [Stack Overflow questions][Stack Overflow] have been asked
by various developers, asking how to convert async iterators to arrays.

There are several [real-world examples](#real-world-examples) listed
later in this explainer.

[it-all]: https://www.npmjs.com/package/it-all
[Stack Overflow]: https://stackoverflow.com/questions/58668361/how-can-i-convert-an-async-iterator-to-an-array

## Description
(A [formal draft specification][specification] is available.)

**Array.fromAsync is to `for await`**\
as **Array.from is to `for`.**

Similarly to [Array.from][], Array.fromAsync would be a static method of the
`Array` built-in class, with one required argument and two optional arguments:
`(items, mapfn, thisArg)`.

### Async-iterable inputs
But, instead of converting a sync iterable to an array, Array.fromAsync can
convert an async iterable to a **promise** that (if everything goes well) will
resolve to a new array. Before the promise resolves, it will create an async
iterator from the input, lazily iterate over it, and add each yielded value to
the new array. (The promise is immediately returned after the Array.fromAsync
function call, no matter what.)

```js
async function * asyncGen (n) {
  for (let i = 0; i < n; i++)
    yield i * 2;
}

// `arr` will be `[0, 2, 4, 6]`.
const arr = [];
for await (const v of asyncGen(4)) {
  arr.push(v);
}

// This is equivalent.
const arr = await Array.fromAsync(asyncGen(4));
```

### Sync-iterable inputs
If the argument is a sync iterable (and not an async iterable), then the return
value is still a promise that will resolve to an array. If the sync iterator
yields promises, then each yielded promise is awaited before its value is added
to the new array. (Values that are not promises are also awaited to
[prevent Zalgo][Zalgo].) All of this matches the behavior of `for await`.

[Zalgo]: https://blog.izs.me/2013/08/designing-apis-for-asynchrony/

```js
function * genPromises (n) {
  for (let i = 0; i < n; i++)
    yield Promise.resolve(i * 2);
}

// `arr` will be `[ 0, 2, 4, 6 ]`.
const arr = [];
for await (const v of genPromises(4)) {
  arr.push(v);
}

// This is equivalent.
const arr = await Array.fromAsync(genPromises(4));
```

Like `for await`, Array.fromAsync **lazily** iterates over a sync-but-not-async
input. Whenever a developer needs to dump a synchronous input that yields
promises into an array, the developer needs to choose carefully between
Array.fromAsync and Promise.all, which have complementary control flows:

<table>
  <thead>
    <tr>
      <th></th>
      <th>Parallel awaiting</th>
      <th>Sequential awaiting</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>Lazy iteration</th>
      <td>Impossible</td>
      <td><code>await Array.fromAsync(input)</code></td>
    </tr>
    <tr>
      <th>Eager iteration</th>
      <td><code>await Promise.all(Array.from(input))</code></td>
      <td>Useless</td>
    </tr>
  </tbody>
</table>

Also like `for await`, when given a sync-but-not-async iterable input, then
Array.fromAsync will catch **only** the first rejection that its iteration
reaches, and only if that rejection does **not** occur in a microtask before
the iteration reaches and awaits for it. For more information, see
[§ Errors][].

```js
// `arr` will be `[ 0, 2, 4, 6 ]`.
// `genPromises(4)` is lazily iterated,
// and its four yielded promises are awaited in sequence.
const arr = await Array.fromAsync(genPromises(4));

// `arr` will also be `[ 0, 2, 4, 6 ]`.
// However, `genPromises(4)` is eagerly iterated
// (into an array of four promises),
// and the four promises are awaited in parallel.
const arr = await Promise.all(Array.from(genPromises(4)));
```

### Non-iterable array-like inputs
Array.fromAsync’s valid inputs are a superset of Array.from’s valid inputs.
This includes non-iterable array-likes: objects that have a length property as
well as indexed elements (similarly to Array.prototype.values). The return
value is still a promise that will resolve to an array. If the array-like
object’s elements are promises, then each accessed promise is awaited before
its value is added to the new array.

One [TC39 representative’s opinion][issue #7 comment]: “[Array-likes are] very
much not obsolete, and it’s very nice that things aren’t forced to implement
the iterator protocol to be transformable into an Array.”

[issue #7 comment]: https://github.com/tc39/proposal-array-from-async/issues/7#issuecomment-920299880

```js
const arrLike = {
  length: 4,
  0: Promise.resolve(0),
  1: Promise.resolve(2),
  2: Promise.resolve(4),
  3: Promise.resolve(6),
}

// `arr` will be `[ 0, 2, 4, 6 ]`.
const arr = [];
for await (const v of Array.from(arrLike)) {
  arr.push(v);
}

// This is equivalent.
const arr = await Array.fromAsync(arrLike);
```

As it does with sync-but-not-async iterable inputs, Array.fromAsync lazily
iterates over the values of array-like inputs, and it awaits each value.
The developer must choose between using Array.fromAsync and Promise.all (see
[§ Sync-iterable inputs](#sync-iterable-inputs) and [§ Errors][]).

### Generic factory method
Array.fromAsync is a generic factory method. It does not require that its this
receiver be the Array constructor. fromAsync can be transferred to or inherited
by any other constructor. In that case, the final result will be the data
structure created by that constructor (with no arguments), and with each value
yielded by the input being assigned to the data structure’s numeric properties.
(Symbol.species is not involved at all.) If the this receiver is not a
constructor, then fromAsync creates an array as usual. This matches the
behavior of Array.from.

```js
async function * asyncGen (n) {
  for (let i = 0; i < n; i++)
    yield i * 2;
}
function Data (n) {}
Data.from = Array.from;
Data.fromAsync = Array.fromAsync;

// d will be a `new Data(0)`, with its `0` property assigned to `0`, its `1`
// property assigned to `2`, etc.
const d = new Data(0); let i = 0;
for await (const v of asyncGen(4)) {
  d[i] = v;
}

// This is equivalent.
const d = await Data.fromAsync(asyncGen(4));
```

### Optional parameters
Array.fromAsync has two optional parameters: `mapfn` and `thisArg`.

`mapfn` is an optional mapping callback, which is called on each value yielded
from the input (and awaited if it came from a synchronous input), along with
its index integer (starting from 0). Each result of the mapping callback is, in
turn, awaited then added to the array.

(Without the optional mapping callback, each value yielded from asynchronous
inputs is not awaited, and each value yielded from synchronous inputs is
awaited only once, before the value is added to the result array. This matches
the behavior of `for await`.)

`thisArg` is a `this`-binding receiver value for the mapping callback. By
default, this is undefined. These optional parameters match the behavior of
Array.from. Their exclusion would be surprising to developers who are already
used to Array.from.

```js
async function * asyncGen (n) {
  for (let i = 0; i < n; i++)
    yield i * 2;
}

// `arr` will be `[ 0, 4, 16, 36 ]`.
const arr = [];
for await (const v of asyncGen(4)) {
  arr.push(await (v ** 2));
}

// This is equivalent.
const arr = await Array.fromAsync(asyncGen(4), v =>
  v ** 2);
```

### Errors
Like other promise-based APIs, Array.fromAsync will always immediately return a
promise. Array.fromAsync will never synchronously throw an error and [summon
Zalgo][Zalgo].

When Array.fromAsync’s input throws an error while creating its async or sync
iterator, then Array.fromAsync’s returned promise will reject with that error.

```js
const err = new Error;
const badIterable = { [Symbol.iterator] () { throw err; } };

// This returns a promise that will reject with `err`.
Array.fromAsync(badIterable);
```

When Array.fromAsync’s input is iterable but the input’s iterator throws while
iterating, then Array.fromAsync’s returned promise will reject with that error.

```js
const err = new Error;
async function * genErrorAsync () { throw err; }

// This returns a promise that will reject with `err`.
Array.fromAsync(genErrorAsync());
```

```js
const err = new Error;
function * genError () { throw err; }

// This returns a promise that will reject with `err`.
Array.fromAsync(genError());
```

When Array.fromAsync’s input is synchronous only (i.e., the input is not an
async iterable), and when one of the input’s values is a promise that
eventually rejects or has rejected, then iteration stops and Array.fromAsync’s
returned promise will reject with the first such error.

In this case, Array.fromAsync will catch and handle that first input rejection
**only if** that rejection does **not** occur in a microtask before the
iteration reaches and awaits for it.

```js
const err = new Error;
function * genRejection () {
  yield Promise.reject(err);
}

// This returns a promise that will reject with `err`. There is **no**
// unhandled promise rejection, because the rejection occurs in the same
// microtask.
Array.fromAsync(genZeroThenRejection());
```

Just like with `for await`, Array.fromAsync will **not** catch any rejections
by the input’s promises whenever those rejections occur **before** the ticks in
which Array.fromAsync’s iteration reaches those promises.

This is because – like `for await` – Array.fromAsync **lazily** iterates over
its input and **sequentially** awaits each yielded value. Whenever a developer
needs to dump a synchronous input that yields promises into an array, the
developer needs to choose carefully between Array.fromAsync and Promise.all,
which have complementary control flows (see [§ Sync-iterable
inputs](#sync-iterable-inputs)).

For example, when a synchronous input contains two promises, the latter of
which will reject before the former promise resolves, then Array.fromAsync will
not catch that rejection, because it lazily reaches the rejecting promise only
after it already has rejected.

```js
const numOfMillisecondsPerSecond = 1000;
const slowError = new Error;
const fastError = new Error;

function waitThenReject (value) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(value), numOfMillisecondsPerSecond);
  });
}

function * genRejections () {
  // Slow promise.
  yield waitAndReject(slowError);
  // Fast promise.
  yield Promise.reject(fastError);
}

// This returns a promise that will reject with `slowError`. There is **no**
// unhandled promise rejection: the iteration is lazy and will stop early at the
// slow promise, so the fast promise will never be created.
Array.fromAsync(genSlowRejectThenFastReject());

// This returns a promise that will reject with `slowError`. There **is** an
// unhandled promise rejection with `fastError`: the iteration eagerly creates
// and dumps both promises into an array, but Array.fromAsync will
// **sequentially** handle only the slow promise.
Array.fromAsync([ ...genSlowRejectThenFastReject() ]);

// This returns a promise that will reject with `fastError`. There is **no**
// unhandled promise rejection: the iteration eagerly creates and dumps both
// promises into an array, but Promise.all will handle both promises **in
// parallel**.
Promise.all([ ...genSlowRejectThenFastReject() ]);
```

When Array.fromAsync’s input has at least one value, and when Array.fromAsync’s
mapping callback throws an error when given any of those values, then
Array.fromAsync’s returned promise will reject with the first such error.

```js
const err = new Error;
function badCallback () { throw err; }

// This returns a promise that will reject with `err`.
Array.fromAsync([ 0 ], badCallback);
```

When Array.fromAsync’s input is null or undefined, or when Array.fromAsync’s
mapping callback is neither undefined nor callable, then Array.fromAsync’s
returned promise will reject with a TypeError.

```js
// These return promises that will reject with TypeErrors.
Array.fromAsync(null);
Array.fromAsync([], 1);
```

### Closing sync iterables?
Array.fromAsync tries to match `for await`’s behavior as much as possible.

This includes how `for await` currently does not close sync iterables when it
yields a rejected promise.

```js
function * createIter() {
  try {
    yield Promise.resolve(console.log("a"));
    yield Promise.reject("x");
  } finally {
    console.log("finalized");
  }
}

// Prints "a" and then prints "finalized".
// There is an uncaught "x" rejection.
for (const x of createIter()) {
  console.log(await x);
}

// Prints "a" and then prints "finalized".
// There is an uncaught "x" rejection.
Array.from(createIter());

// Prints "a" and does *not* print "finalized".
// There is an uncaught "x" rejection.
for await (const x of createIter()) {
  console.log(x);
}

// Prints "a" and does *not* print "finalized".
// There is an uncaught "x" rejection.
Array.fromAsync(createIter());
```

TC39 has agreed to change `for await`’s behavior here. In the future, `for await` will
close sync iterators when async wrappers yield rejections (see [tc39/ecma262#2600][]).
When that behavior changes for `for await`, then it will also change for `Array.fromAsync`
at the same time.

[tc39/ecma262#2600]: https://github.com/tc39/ecma262/pull/2600

## Other proposals

### Relationship with iterator-helpers
The [iterator-helpers][] and [async-iterator-helpers][] proposal define
Iterator.toArray  and AsyncIterator.toArray. The following pairs of lines are
equivalent:

[iterator-helpers]: https://github.com/tc39/proposal-iterator-helpers
[async-iterator-helpers]: https://github.com/tc39/proposal-async-iterator-helpers

```js
// Array.from

Array.from(iterable)
Iterator(iterable).toArray()

Array.from(iterable, mapfn)
Iterator(iterable).map(mapfn).toArray()

// Array.fromAsync

Array.fromAsync(asyncIterable)
AsyncIterator(asyncIterable).toArray()

Array.fromAsync(asyncIterable, mapfn)
AsyncIterator(asyncIterable).map(mapfn).toArray()
```

Iterator.toArray overlaps with Array.from, and AsyncIterator.toArray overlaps
with Array.fromAsync. This is okay: they all can coexist.

A [co-champion of iterable-helpers agrees][tc39/proposal-iterator-helpers#156]
that we should have both or that we should prefer Array.fromAsync: “I
remembered why it’s better for a buildable structure to consume an iterable
than for an iterable to consume a buildable protocol. Sometimes building
something one element at a time is the same as building it [more than one]
element at a time, but sometimes it could be slow to build that way or produce
a structure with equivalent semantics but different performance properties.”

[tc39/proposal-iterator-helpers#156]: https://github.com/tc39/proposal-iterator-helpers/issues/156.

### TypedArray.fromAsync, Set.fromAsync, Object.fromEntriesAsync, etc.
The following built-ins also resemble Array.from:
```js
TypedArray.from()
new Set
Object.fromEntries()
new Map
```
We are deferring any async versions of these methods to future proposals.
See [issue #8][] and [proposal-setmap-offrom][].

[issue #8]: https://github.com/tc39/proposal-array-from-async/issues/8
[proposal-setmap-offrom]: https://github.com/tc39/proposal-setmap-offrom

### Async spread operator
In the future, standardizing an async spread operator (like `[ 0, await ...v
]`) may be useful. This proposal leaves that idea to a **separate** proposal.

### Records and tuples
The **[record/tuple] proposal** puts forward two new data types with APIs that
respectively **resemble** those of **`Array` and `Object`**. The `Tuple`
constructor, too, would probably need an `fromAsync` method. Whether the
`Record` constructor gets a `fromEntriesAsync` method will depend on whether
`Object.fromEntriesAsync` will also be added in a separate proposal.

[record/tuple]: https://github.com/tc39/proposal-record-tuple

## Real-world examples
Only minor formatting changes have been made to the status-quo examples.

<table>
<thead>
<tr>
<th>Status quo
<th>With Array.fromAsync

<tbody>
<tr>
<td>

```js
const all = require('it-all');

// Add the default assets to the repo.
const results = await all(
  addAll(
    globSource(initDocsPath, {
      recursive: true,
    }),
    { preload: false },
  ),
);
const dir = results
  .filter(file =>
    file.path === 'init-docs')
  .pop()
print('to get started, enter:\n');
print(
  `\tjsipfs cat` +
  `/ipfs/${dir.cid}/readme\n`,
);
```
From [ipfs-core/src/runtime/init-assets-nodejs.js][].

<td>

```js
// Add the default assets to the repo.
const results = await Array.fromAsync(
  addAll(
    globSource(initDocsPath, {
      recursive: true,
    }),
    { preload: false },
  ),
);
const dir = results
  .filter(file =>
    file.path === 'init-docs')
  .pop()
print('to get started, enter:\n');
print(
  `\tjsipfs cat` +
  `/ipfs/${dir.cid}/readme\n`,
);
```

<tr>
<td>

```js
const all = require('it-all');

const results = await all(
  node.contentRouting
    .findProviders('a cid'),
);
expect(results)
  .to.be.an('array')
  .with.lengthOf(1)
  .that.deep.equals([result]);
```
From [js-libp2p/test/content-routing/content-routing.node.js][].

<td>

```js
const results = await Array.fromAsync(
  node.contentRouting
    .findProviders('a cid'),
);
expect(results)
  .to.be.an('array')
  .with.lengthOf(1)
  .that.deep.equals([result]);
```

<tr>
<td>

```js
async function toArray(items) {
  const result = [];
  for await (const item of items) {
    result.push(item);
  }
  return result;
}

it('empty-pipeline', async () => {
  const pipeline = new Pipeline();
  const result = await toArray(
    pipeline.execute(
      [ 1, 2, 3, 4, 5 ]));
  assert.deepStrictEqual(
    result,
    [ 1, 2, 3, 4, 5 ],
  );
});
```

From [node-httptransfer/test/generator/pipeline.test.js][].

<td>

```js
it('empty-pipeline', async () => {
  const pipeline = new Pipeline();
  const result = await Array.fromAsync(
    pipeline.execute(
      [ 1, 2, 3, 4, 5 ]));
  assert.deepStrictEqual(
    result,
    [ 1, 2, 3, 4, 5 ],
  );
});
```

</table>

[ipfs-core/src/runtime/init-assets-nodejs.js]: https://github.com/ipfs/js-ipfs/blob/release/v0.54.x/packages/ipfs-core/src/runtime/init-assets-nodejs.js
[js-libp2p/test/content-routing/content-routing.node.js]: https://github.com/libp2p/js-libp2p/blob/13cf4761489d59b22924bb8ec2ec6dbe207b280c/test/content-routing/content-routing.node.js
[node-httptransfer/test/generator/pipeline.test.js]: https://github.com/adobe/node-httptransfer/blob/22a32e72df89ce40e77a1dae5575a07654a0851f/test/generator/pipeline.test.js
