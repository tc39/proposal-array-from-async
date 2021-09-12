# `Array.fromAsync` for JavaScript
ECMAScript Stage-1 Proposal. J. S. Choi, 2021.

* **[Specification][]** available
* **[Polyfill][]** available

[specification]: http://jschoi.org/21/es-array-async-from/
[polyfill]: https://www.npmjs.com/package/array-from-async

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

[it-all]: https://www.npmjs.com/package/it-all
[Stack Overflow]: https://stackoverflow.com/questions/58668361/how-can-i-convert-an-async-iterator-to-an-array

## Description
(A [formal draft specification][specification] is available.)

Similarly to **[`Array.from`][]**,
**`Array.fromAsync`** would be a **static method**
of the `Array` built-in class, with **one required argument**
and **two optional arguments**: `(items, mapfn, thisArg)`.

But instead of converting an **iterable** to an array,
it converts an **async iterable** to a **promise**
that will resolve to an array.

```js
async function * f () {
  for (let i = 0; i < 4; i++)
    yield i;
}

// Resolves to [0, 1, 2, 3].
await Array.fromAsync(f());
```

`mapfn` is an optional function to call on every item value.
(Unlike `Array.from`, `mapfn` may be an **async function**.
Whenever `mapfn` returns a promise, that promise will be awaited,
and the value it resolves to is what is added
to the final returned promise’s array.
If `mapfn`’s promise rejects,
then the final returned promise
will also reject with that error.)

`thisArg` is an optional value with which to call `mapfn`
(or `undefined` by default).

Like `Array.from`, `Array.fromAsync` is a **generic factory method**.
It does not require that its `this` value be the `Array` constructor,
and it can be transferred to or inherited by any other constructors
that may be called with a single numeric argument.

## Other proposals

### `Object.fromEntriesAsync`
In the future, a complementary method could be added to `Object`.

Type    | Sync method  | Async method
------- | ------------ | ------------------
`Array` | `from`       | `fromAsync`
`Object`| `fromEntries`| `fromEntriesAsync`?

It is **uncertain** whether `Object.fromEntriesAsync`
should be **piggybacked** onto this proposal
or left to a **separate** proposal.

### Async spread operator
In the future, standardizing an async spread operator (like `[ 0, await ...v ]`)
may be useful. This proposal leaves that idea to a **separate** proposal.

### Iterator helpers
The **[iterator-helpers][] proposal** puts forward, among other methods,
a **`toArray` method** for async iterators (as well as synchronous iterators).
We **could** consider `Array.fromAsync` to be **redundant** with `toArray`.

However, **`Array.from` already** exists,
and `Array.fromAsync` would **parallel** it.
If we **had to choose** between `asyncIterator.toArray` and `Array.fromAsync`,
we should **prefer** `Array.fromAsync` to `asyncIterator.toArray`
for its **parallelism** with what already exists.

In addition, the `iterator.toArray` method **already would duplicate** `Array.from`
for **synchronous iterators**.
We consider **duplication** with an `Array` method as **okay** anyway.
If duplication between `syncIterator.toArray` and `Array.from` is already okay,
then duplication between `asyncIterator.toArray` and `Array.fromAsync` should also be okay.

[iterator-helpers]: https://github.com/tc39/proposal-iterator-helpers

### Records and tuples
The **[record/tuple] proposal** puts forward two new data types
with APIs that respectively **resemble** those of **`Array` and `Object`**.
The `Tuple` constructor, too, would probably need an `fromAsync` method.
Whether the `Record` constructor gets a `fromEntriesAsync` method
depends on [whether `Object` gets `fromEntriesAsync`](#objectfromentriesasync).

[record/tuple]: https://github.com/tc39/proposal-record-tuple

### Set and Map
There is a [proposal for `Set.from` and `Map.from` methods][setmap-offrom].
If this proposal is accepted before that proposal,
then that proposal could also add corresponding `fromAsync` methods.

[setmap-offrom]: https://github.com/tc39/proposal-setmap-offrom

## Real-world examples
Only minor formatting changes have been made to the status-quo examples.

<table>
<thead>
<tr>
<th>Status quo
<th>With binding

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
