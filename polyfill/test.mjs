import './index.mjs';

import test from 'tape';

test('creates promise', async t => {
  const outputPromise = Array.fromAsync([]);
  t.equal(outputPromise.constructor, Promise);
});

test('creates new array in promise', async t => {
  const expected = [ 0, 1, 2 ];
  const output = await Array.fromAsync(expected);
  t.equal(output.constructor, Array);
  t.notEqual(output, expected);
});

test('ordinary-iterable input', async t => {
  t.test('is dumped', async t => {
    const expected = [ 0, 1, 2 ];
    const output = await Array.fromAsync(expected);
    t.deepEqual(output, expected);
  });

  t.test('sync mapped', async t => {
    t.test('with default undefined this', async t => {
      const expected = [ [ 0, undefined ], [ 2, undefined ], [ 4, undefined ] ];
      const input = [ 0, 1, 2 ];
      const output = await Array.fromAsync(input, function (v) {
        return [ v * 2, this ];
      });
      t.deepEqual(output, expected);
    });

    t.test('with given this', async t => {
      const thisValue = {};
      const expected = [ [ 0, thisValue ], [ 2, thisValue ], [ 4, thisValue ] ];
      const input = [ 0, 1, 2 ];
      const output = await Array.fromAsync(input, function (v) {
        return [ v * 2, this ];
      }, thisValue);
      t.deepEqual(output, expected);
    });
  });

  t.test('async mapped', async t => {
    t.test('with default undefined this', async t => {
      const expected = [ [ 0, undefined ], [ 2, undefined ], [ 4, undefined ] ];
      const input = [ 0, 1, 2 ];
      const output = await Array.fromAsync(input, async function (v) {
        return [ v * 2, this ];
      });
      t.deepEqual(output, expected);
    });

    t.test('with given this', async t => {
      const thisValue = {};
      const expected = [ [ 0, thisValue ], [ 2, thisValue ], [ 4, thisValue ] ];
      const input = [ 0, 1, 2 ];
      const output = await Array.fromAsync(input, async function (v) {
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
    const output = await Array.fromAsync(input);
    t.deepEqual(output, expected);
  });

  t.test('sync mapped', async t => {
    t.test('with default undefined this', async t => {
      const expected = [ [ 0, 0, undefined ], [ 2, 1, undefined ], [ 4, 2, undefined ] ];

      async function* generateInput () {
        yield* [ 0, 1, 2 ];
      }

      const input = generateInput();
      const output = await Array.fromAsync(input, function (v, i) {
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
      const output = await Array.fromAsync(input, function (v, i) {
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
      const output = await Array.fromAsync(input, async function (v, i) {
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
      const output = await Array.fromAsync(input, async function (v, i) {
        return [ v * 2, i, this ];
      }, thisValue);
      t.deepEqual(output, expected);
    });
  });
});
