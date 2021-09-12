# `Array.fromAsync` polyfill
TC39 is considering a new standard
[**`Array.fromAsync`** convenience method][Array.fromAsync].
This is the polyfill for that.

[Array.fromAsync]: https://github.com/tc39/proposal-array-from-async

## Requirements
This polyfill requires ES 2018 (which must include [support for async iterators][]).

[support for async iterators]: https://kangax.github.io/compat-table/es2016plus/#test-Asynchronous_Iterators

## Installation
In Node:
```bash
npm install array-from-async
```
…then:
```js
import 'array-from-async';
```

In web browsers or Deno:
```
import 'https://unpkg.com/array-from-async';
```

## Description
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

[`Array.from`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from

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

## Polyfill limitations
The polyfill cannot exactly match the spec in one way.
If it is attached to a **non-constructor function**
(i.e., arrow functions or `class` methods),
then `fromAsync` will incorrectly throw a TypeError,
rather than correctly creating an array.

This is because there is [no current way
to test whether a function is not a constructor][no isConstructor].

[no isConstructor]: https://stackoverflow.com/a/40922715
