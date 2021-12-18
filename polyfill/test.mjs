import fromAsync from './index.mjs';

import test from 'tape-promise/tape.js';

test('creates promise', async t => {
  const outputPromise = fromAsync([]);
  t.equal(outputPromise.constructor, Promise);
});

test('creates new array in promise', async t => {
  const expected = [ 0, 1, 2 ];
  const output = await fromAsync(expected);
  t.equal(output.constructor, Array);
  t.notEqual(output, expected);
});

test('creates new array-like in promise', async t => {
  class C {}

  const input = [ 0, 1, 2 ];
  const output = await fromAsync.call(C, input);
  t.equal(output.constructor, C);
  t.equal(output.length, 3);
  t.equal(output[0], 0);
  t.equal(output[1], 1);
  t.equal(output[2], 2);
  t.equal(output[3], undefined);
});

test('resorts to creating array if dynamic-this is not constructor', async t => {
  const expected = [ 0, 1, 2 ];
  const arrowFn = () => {};
  const output = await fromAsync.call(arrowFn, expected);
  t.equal(output.constructor, Array);
  t.deepEqual(output, expected);
});

test('does not resort to creating array if constructor throws', async t => {
  class SpecialError extends Error {}

  class C {
    constructor () {
      throw new SpecialError;
    }
  }

  const input = [ 0, 1, 2 ];
  const outputPromise = fromAsync.call(C, input);
  await t.rejects(outputPromise, SpecialError);
});

test('ordinary-iterable input', async t => {
  t.test('is dumped', async t => {
    const expected = [ 0, 1, 2 ];
    const output = await fromAsync(expected);
    t.deepEqual(output, expected);
  });

  t.test('sync mapped', async t => {
    t.test('with default undefined this', async t => {
      const expected = [ [ 0, undefined ], [ 2, undefined ], [ 4, undefined ] ];
      const input = [ 0, 1, 2 ];
      const output = await fromAsync(input, function (v) {
        return [ v * 2, this ];
      });
      t.deepEqual(output, expected);
    });

    t.test('with given this', async t => {
      const thisValue = {};
      const expected = [ [ 0, thisValue ], [ 2, thisValue ], [ 4, thisValue ] ];
      const input = [ 0, 1, 2 ];
      const output = await fromAsync(input, function (v) {
        return [ v * 2, this ];
      }, thisValue);
      t.deepEqual(output, expected);
    });
  });

  t.test('async mapped', async t => {
    t.test('with default undefined this', async t => {
      const expected = [ [ 0, undefined ], [ 2, undefined ], [ 4, undefined ] ];
      const input = [ 0, 1, 2 ];
      const output = await fromAsync(input, async function (v) {
        return [ v * 2, this ];
      });
      t.deepEqual(output, expected);
    });

    t.test('with given this', async t => {
      const thisValue = {};
      const expected = [ [ 0, thisValue ], [ 2, thisValue ], [ 4, thisValue ] ];
      const input = [ 0, 1, 2 ];
      const output = await fromAsync(input, async function (v) {
        return [ v * 2, this ];
      }, thisValue);
      t.deepEqual(output, expected);
    });
  });
});

test('async-iterable input', async t => {
  t.test('is dumped', async t => {
    const expected = [ 0, 1, 2 ];

    async function* generateInput () {
      yield* expected;
    }

    const input = generateInput();
    const output = await fromAsync(input);
    t.deepEqual(output, expected);
  });

  t.test('sync mapped', async t => {
    t.test('with default undefined this', async t => {
      const expected = [ [ 0, 0, undefined ], [ 2, 1, undefined ], [ 4, 2, undefined ] ];

      async function* generateInput () {
        yield* [ 0, 1, 2 ];
      }

      const input = generateInput();
      const output = await fromAsync(input, function (v, i) {
        return [ v * 2, i, this ];
      });
      t.deepEqual(output, expected);
    });

    t.test('with given this', async t => {
      const thisValue = {};
      const expected = [ [ 0, 0, thisValue ], [ 2, 1, thisValue ], [ 4, 2, thisValue ] ];

      async function* generateInput () {
        yield* [ 0, 1, 2 ];
      }

      const input = generateInput();
      const output = await fromAsync(input, function (v, i) {
        return [ v * 2, i, this ];
      }, thisValue);
      t.deepEqual(output, expected);
    });
  });

  t.test('async mapped', async t => {
    t.test('with default undefined this', async t => {
      const expected = [ [ 0, 0, undefined ], [ 2, 1, undefined ], [ 4, 2, undefined ] ];

      async function* generateInput () {
        yield* [ 0, 1, 2 ];
      }

      const input = generateInput();
      const output = await fromAsync(input, async function (v, i) {
        return [ v * 2, i, this ];
      });
      t.deepEqual(output, expected);
    });

    t.test('with given this', async t => {
      const thisValue = {};
      const expected = [ [ 0, 0, thisValue ], [ 2, 1, thisValue ], [ 4, 2, thisValue ] ];

      async function* generateInput () {
        yield* [ 0, 1, 2 ];
      }

      const input = generateInput();
      const output = await fromAsync(input, async function (v, i) {
        return [ v * 2, i, this ];
      }, thisValue);
      t.deepEqual(output, expected);
    });
  });
});
