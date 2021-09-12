const { MAX_SAFE_INTEGER } = Number;

function isConstructor (obj) {
  const prox = new Proxy(obj, {
    construct () {
      return prox;
    },
  });
  try {
    new prox;
    return true;
  } catch (err) {
    return false;
  }
}

Array.fromAsync = Array.fromAsync || async function fromAsync (items, mapfn, thisArg) {
  const result = isConstructor(this)
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
