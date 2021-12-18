# `Array.fromAsync` polyfill
TC39 is considering a new standard [**`Array.fromAsync`** convenience
method][Array.fromAsync]. This is a standalone polyfill for that.

[Array.fromAsync]: https://github.com/tc39/proposal-array-from-async

## Requirements
This polyfill requires ES 2018 (which must include [support for async
iterators][]).

[support for async iterators]: https://kangax.github.io/compat-table/es2016plus/#test-Asynchronous_Iterators

## Installation
In Node:
```bash
npm install array-from-async
```
…then:
```js
import fromAsync from 'array-from-async';
```

In web browsers or Deno:
```
import fromAsync from '//unpkg.com/array-from-async';
```

## Description
This is a **standalone implementation** of the proposed `Array.fromAsync`
function. Unlike typical polyfills/shims, it does not mutate the global Array
constructor; instead, it exports an equivalent function.

Similarly to **[`Array.from`][]**,
**`fromAsync`** would be a **static method**
of the `Array` built-in class, with **one required argument**
and **two optional arguments**: `(items, mapfn, thisArg)`.

But instead of converting an **iterable** to an array,
it converts an **async iterable** to a **promise**
that will resolve to an array.

```js
async function * f () {
  for (let i = 0; i < 4; i++)
    yield i * 2;
}

// Resolves to `[0, 2, 4, 6]`.
await fromAsync(f());
```

[`Array.from`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from

For more information, see the [Array.fromAsync][] explainer.
