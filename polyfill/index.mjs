const { MAX_SAFE_INTEGER } = Number;

Array.fromAsync = Array.fromAsync || async function fromAsync (items, mapfn, thisArg) {
  // Note: This does not exactly match the spec.
  // If `this` is a non-constructor function (i.e., arrow functions or `class` methods),
  // then this line will incorrectly throw a TypeError
  // rather than correctly creating an empty array.
  const result = typeof this === 'function'
    ? new this
    : Array(0);
  let i = 0;
  for await (const v of items) {
    if (i > MAX_SAFE_INTEGER)
      throw TypeError('Input is too long and exceeded Number.MAX_SAFE_INTEGER times.');
    if (mapfn) {
      result[i] = await mapfn.call(thisArg, v, i);
    } else {
      result[i] = v;
    }

    i++;
  }

  result.length = i;
  return result;
};
