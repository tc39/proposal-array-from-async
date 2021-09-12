const { MAX_SAFE_INTEGER } = Number;

Array.fromAsync = Array.fromAsync || async function fromAsync (items, mapfn, thisArg) {
  const result = [];
  let i = 0;
  for await (const v of items) {
    if (i > MAX_SAFE_INTEGER)
      throw TypeError('Input is too long and exceeded Number.MAX_SAFE_INTEGER times.');
    if (mapfn) {
      result.push(await mapfn.call(thisArg, v, i));
    } else {
      result.push(v);
    }

    i++;
  }
  return result;
};
