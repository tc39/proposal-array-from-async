# `Array.fromAsync` for JavaScript
ECMAScript Stage-2 Proposal. J. S. Choi, 2021.

* **[Specification][]** available
* Polyfills:
  * **[array-from-async][]**
  * **[core-js][]**

[specification]: http://jschoi.org/21/es-array-async-from/
[core-js]: https://github.com/zloirock/core-js#arrayfromasync
[array-from-async]: https://www.npmjs.com/package/array-from-async

## Why an `Array.fromAsync` method
Since its standardization in JavaScript,
**[`Array.from`][]** has become one of `Array`’s
most frequently used built-in methods.
However, no similar functionality exists for async iterators.

[`Array.from`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from

Such functionality would be useful
for **dumping** the entirety of an **async iterator**
into a **single data structure**,
especially in **unit tests** or in **command-line** interfaces.
(Several real-world examples are included in a following section.)

There is an [it-all][] NPM library that performs only this task
and which gets about 50,000 weekly downloads daily.
This of course does **not** include any code
that uses ad-hoc `for await`–`of` loops with empty arrays:
```js
const arr = [];
for await (const item of asyncItems) {
  arr.push(item);
}
```
Further demonstrating the demand for such functionality,
several [Stack Overflow questions][Stack Overflow] have been asked
by various developers, asking how to convert async iterators to arrays.

There are several [real-world examples](#real-world-examples) listed
later in this explainer.

[it-all]: https://www.npmjs.com/package/it-all
[Stack Overflow]: https://stackoverflow.com/questions/58668361/how-can-i-convert-an-async-iterator-to-an-array

## Description
(A [formal draft specification][specification] is available.)

### Async-iterable inputs
Similarly to **[`Array.from`][]**,
**`Array.fromAsync`** would be a **static method**
of the `Array` built-in class, with **one required argument**
and **two optional arguments**: `(items, mapfn, thisArg)`.

But instead of converting an **array-like object** or **iterable** to an array,
it converts an **async iterable** (or array-like object or iterable)
to a **promise** that will resolve to an array.

```js
async function * asyncGen (n) {
  for (let i = 0; i < n; i++)
    yield i * 2;
}
// arr will be [0, 2, 4, 6].
const arr = [];
for await (const v of asyncGen(4)) {
  arr.push(v);
}
// This is equivalent.
const arr = await Array.fromAsync(asyncGen(4));
```

### Sync-iterable inputs
If the argument is a sync iterable (and not an async iterable), then the return value is still a promise that will resolve to an array.
If the sync iterator yields promises, then each yielded promise is awaited before its value is added to the new array. (Values that are not promises are also awaited for one microtick to prevent Zalgo.)
This matches the behavior of `for await`.

Like `Array.from`, `Array.fromAsync` also works on non-iterable **array-like objects**
(i.e., objects with a length property and indexed elements).
As with sync-iterable objects, any element that is a promise must settle first,
and the value to which it resolves (if any) will be what is added to the resulting array.

```js
function * genPromises (n) {
  for (let i = 0; i < n; i++)
    yield Promise.resolve(i * 2);
}
// arr will be [0, 2, 4, 6].
const arr = [];
for await (const v of genPromises(4)) {
  arr.push(v);
}
// This is equivalent.
const arr = await Array.fromAsync(genPromises(4));
```

### Non-iterable array-like inputs
Array.fromAsync’s valid inputs are a superset of Array.from’s valid inputs. This includes non-iterable array-likes: objects that have a length property as well as indexed elements.
The return value is still a promise that will resolve to an array.
If the array-like object’s elements are promises, then each accessed promise is awaited before its value is added to the new array.
One TC39 representative’s opinion: “[Array-likes are] very much not obsolete, and it’s very nice that things aren’t forced to implement the iterator protocol to be transformable into an Array.”

```js
const arrLike = {
  length: 4,
  0: Promise.resolve(0),
  1: Promise.resolve(2),
  2: Promise.resolve(4),
  3: Promise.resolve(6),
}
// arr will be [0, 2, 4, 6].
const arr = [];
for await (const v of Array.from(arrLike)) {
  arr.push(v);
}
// This is equivalent.
const arr = await Array.fromAsync(arrLike);
See issue #7. Previously discussed at 2021-11 plenary without objections.
```

### Generic factory method
Array.fromAsync is a generic factory method. It does not require that its this receiver be the Array constructor.
fromAsync can be transferred to or inherited by any other constructor with a single numeric parameter. In that case, the final result will be the data structure created by that constructor (with 0 as its argument), and with each value yielded by the input being assigned to the data structure’s numeric properties.
(Symbol.species is not involved at all.)
If the this receiver is not a constructor, then fromAsync creates an array as usual.
This matches the behavior of Array.from.

```js
async function * asyncGen (n) {
  for (let i = 0; i < n; i++)
    yield i * 2;
}
function Data (n) {}
Data.from = Array.from;
Data.fromAsync = Array.fromAsync;
// d will be a new Data(0), with
// 0 assigned to 0, 1 assigned to 2, etc.
const d = new Data(0); let i = 0;
for await (const v of asyncGen(4)) {
  d[i] = v;
}
// This is equivalent.
const d = await Data.fromAsync(asyncGen(4));
```

### Optional parameters
Array.fromAsync has two optional parameters.
The first optional parameter is a mapping callback, which is called on each value yielded from the input – the result of which is awaited then added to the array.
Unlike `Array.from`, `mapfn` may be an async function.)
By default, this is essentially an identity function.
The second optional parameter is a this value for the mapping callback. By default, this is undefined.
These optional parameters match the behavior of Array.from. Their exclusion would be surprising to developers who are already used to Array.from.

```js
async function * asyncGen (n) {
  for (let i = 0; i < n; i++)
    yield i * 2;
}
// arr will be [0, 4, 16, 36].
const arr = [];
for await (const v of asyncGen(4)) {
  arr.push(v ** 2);
}
// This is equivalent.
const arr = await Array.fromAsync(asyncGen(4),
  v => v ** 2);
```

### Errors
Like other promise-based APIs, Array.fromAsync will always immediately return a promise. It will never synchronously throw an error and summon Zalgo.
If its input throws an error while creating its async or sync iterator, then its promise will reject with that error.
If its input’s iterator throws an error while yielding a value, then its promise will reject with that error.
If its this receiver’s constructor throws an error, then its promise will reject to that error.
If its mapping callback throws an error when given an input value, then its promise will reject with that error.
If its input is null or undefined, or if its mapping callback is neither undefined nor callable, then its promise will reject with a TypeError.

```js
const err = new Error;
const badIterable = { [Symbol.iterator] () { throw err; } };
function * genError () { throw err; }
function * genRejection () { yield Promise.reject(err); }
function badCallback () { throw err; }
function BadConstructor () { throw err; }
// These create promises that will reject with err.
Array.fromAsync(badIterable);
Array.fromAsync(genError());
Array.fromAsync(genRejection());
Array.fromAsync(genErrorAsync());
Array.fromAsync([1], badCallback);
BadConstructor.call(Array.fromAsync, []);
// These create promises that will reject with TypeErrors.
Array.fromAsync(null);
Array.fromAsync([], 1);
```

## Other proposals

### Relationship with iterator-helpers
The [iterator-helpers][] proposal has toArray, which works with both sync and async iterables.

```js
Array.from(gen())
gen().toArray()
Array.fromAsync(asyncGen())
asyncGen().toArray()
```

toArray overlaps with both Array.from and Array.fromAsync. This is okay. They can coexist.
If we have to choose between having toArray and having fromAsync, then we should choose fromAsync. We already have Array.from. We should match the existing language precedent.

See [tc39/proposal-iterator-helpers#156](https://github.com/tc39/proposal-iterator-helpers/issues/156).
A co-champion of iterable-helpers seems to agree that we should have both or that we should prefer Array.fromAsync:
“I remembered why it’s better for a buildable structure to consume an iterable than for an iterable to consume a buildable protocol. Sometimes building something one element at a time is the same as building it [more than one] element at a time, but sometimes it could be slow to build that way or produce a structure with equivalent semantics but different performance properties.”

[iterator-helpers]: https://github.com/tc39/proposal-iterator-helpers

### TypedArray.fromAsync, Set.fromAsync, etc.
The following built-ins also resemble Array.from:
```js
TypedArray.from
new Set
Object.fromEntries
new Map
```
We are deferring any async versions of these methods to future proposals.
See [issue #8](https://github.com/tc39/proposal-array-from-async/issues/8) and [proposal-setmap-offrom](https://github.com/tc39/proposal-setmap-offrom).

### Async spread operator
In the future, standardizing an async spread operator (like `[ 0, await ...v ]`)
may be useful. This proposal leaves that idea to a **separate** proposal.

### Records and tuples
The **[record/tuple] proposal** puts forward two new data types
with APIs that respectively **resemble** those of **`Array` and `Object`**.
The `Tuple` constructor, too, would probably need an `fromAsync` method.
Whether the `Record` constructor gets a `fromEntriesAsync` method
depends on [whether `Object` gets `fromEntriesAsync`](#objectfromentriesasync).

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
