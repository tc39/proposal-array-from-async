# `Array.asyncFrom` for JavaScript
ECMAScript Stage-0 Proposal. J. S. Choi, 2021.

* **[Specification][]**
* **Babel plugin**: Not yet

[specification]: http://jschoi.org/21/es-array-async-from/

## Why an `Array.asyncFrom` method
Since its standardization in JavaScript,
`Array.from` has become one of `Array`’s
most frequently used built-in methods.
However, no similar functionality exists for async iterators.

Such functionality would be useful
for dumping the entirety of an async iterator
into a single data structure,
especially in unit tests or in command-line interfaces.
(Several real-world examples are included in a following section.)

There is an [it-all][] NPM library that performs only this task
and which gets about 50,000 weekly downloads daily.
This of course does not include any code
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
**`Array.asyncFrom`** would be a **static method**
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
await Array.asyncFrom(f());
```

[`Array.from`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from

`mapfn` is an optional function to call on every item value,
and `thisArg` is an optional value to (or `undefined` by default).

Also similarly to `Array.from`, `Array.asyncFrom` is a **generic factory method**.
It does not require that its `this` value be the `Array` constructor,
and it can be transferred to or inherited by any other constructors
that may be called with a single numeric argument.

In the future, standardizing an async spread operator (like `[ 0, await ...v ]`)
may also be useful. This proposal leaves that idea to a separate proposal.

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
const results = await Array.asyncFrom(
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
const results = await Array.asyncFrom(
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
  const result = await Array.asyncFrom(
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
