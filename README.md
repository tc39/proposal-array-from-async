# Hack pipe operator for JavaScript
ECMAScript Stage-0 Proposal. J. S. Choi, 2021.

* **[Specification][]**
* **Babel plugin**: [Planned for v7.15][Babel 7.15]. See [preview Babel documentation][].

This explainer was adapted from an [essay by Tab Atkins][] with permission.

(This document presumptively uses `?`
as the placeholder token for the topic reference.
This [choice of token is not a final decision][token bikeshedding];
`?` could instead be `%`, `@`, `#`, or many other tokens.)

[specification]: http://jschoi.org/21/es-hack-pipes/
[Babel 7.15]: https://github.com/babel/babel/pull/13413
[preview Babel documentation]: https://deploy-preview-2541--babel.netlify.app/docs/en/babel-plugin-proposal-pipeline-operator
[essay by Tab Atkins]: https://gist.github.com/tabatkins/1261b108b9e6cdab5ad5df4b8021bcb5
[token bikeshedding]: https://github.com/tc39/proposal-pipeline-operator/issues/91

## Why a pipe operator
In the State of JS 2020 survey, the **fourth top answer** to
[“What do you feel is currently missing from
JavaScript?”](https://2020.stateofjs.com/en-US/opinions/?missing_from_js)
was the **pipe operator**.

When we perform **consecutive operations** (e.g., function calls)
on a **value** in JavaScript,
there are currently two fundamental ways to do so:
* passing the value as an argument to the operation
  (**nesting** the operations if there are multiple operations),
* or calling the function as a method on the value
  (**chaining** more method calls if there are multiple methods).

That is, `three(two(one(value)))` versus `value.one().two().three()`.

### Deep nesting is hard to read
The first style, **nesting**, is generally applicable –
it works for any sequence of operations:
function calls, arithmetic, array/object literals, `await` and `yield`, etc.

However, nesting is **difficult to read** when it becomes deep:
the flow of execution moves **right to left**,
rather than the left-to-right reading of normal code.
If there are **multiple arguments** at some levels,
reading even bounces **back and forth**:
our eyes must **jump left** to find a function name,
and then they must **jump right** to find additional arguments.
Additionally, **editing** the code afterwards can be fraught:
we must find the correct **place to insert** new arguments
among **many nested parentheses**.

<details>
<summary>Real-world example</summary>

Consider this [real-world code from React][react/scripts/jest/jest-cli.js].

```js
console.log(
  chalk.dim(
    `$ ${Object.keys(envars)
      .map(envar =>
        `${envar}=${envars[envar]}`,
      ).join(' ')
    }`,
    'node',
    args.join(' '),
  )
);
```

This real-world code is made of **deeply nested expressions**.
In order to read its flow of data, a human’s eyes must first:

1. Find the **initial data** (the innermost expression, `envars`).
2. And then scan **back and forth** repeatedly from **inside out**
   for each data transformation,
   each one either an easily missed prefix operator on the left
   or a suffix operators on the right:

   1. `Object.keys()` (left side),
   2. `.map()` (right side),
   3. `.join()` (right side),
   4. A template literal (both sides),
   5. `chalk.dim()` (left side), then
   6. `console.log()` (left side).

</details>

### Method chaining is limited
The second style, **chaining**, is **only** usable
if the value has the functions designated as **methods** for its class.
This **limits** its applicability, but **when** it applies,
it’s generally more usable and **easier** to read and write:
Code execution flows **left to right**.
The deeply nested expressions are **untangled**.
All the arguments for a given function are **grouped** with the function name.
And editing the code later to **insert or delete** more method calls is trivial,
since we would just have to put our cursor in one spot,
then start typing or deleting one **contiguous** run of characters.

Indeed, the benefits of method chaining are **so attractive**
that some **popular libraries contort** their code structure
*specifically* to allow **more method chaining**.
The most prominent example is **[jQuery][]**, which is
*still* the most popular JS library in the world.
jQuery’s core design is a single über-object with dozens of methods on it,
all of which return the same object type so that we can continue chaining.
There is even a name for this style of programming:
[fluent interfaces][].

[jQuery]: https://jquery.com/
[fluent interfaces]: https://en.wikipedia.org/wiki/Fluent_interface

Unfortunately, for all of its fluency,
method chaining alone cannot accomodate JavaScript’s other syntaxes:
function calls, arithmetic, array/object literals, `await` and `yield`, etc.
In this way, method chaining remains limited in its applicability.

### Pipe operators combine both worlds
The pipe operator attempts to marry the **convenience** and ease of **method chaining**
with the wide **applicability** of **expression nesting**.

The general structure of all the pipe operators is
`value |> ` <var>e1</var> `|>` <var>e2</var> `|>` <var>e3</var>,
where <var>e1</var>, <var>e2</var>, e3 <var>three</var>
are all expressions that take consecutive values as their parameters.
The `|>` operator then does some degree of magic to “pipe” `value`
from the lefthand side into the righthand side.

<details>
<summary>Real-world example, continued</summary>

Continuing this deeply nested [real-world code from React][react/scripts/jest/jest-cli.js]:

```js
console.log(
  chalk.dim(
    `$ ${Object.keys(envars)
      .map(envar =>
        `${envar}=${envars[envar]}`,
      ).join(' ')
    }`,
    'node',
    args.join(' '),
  )
);
```

…we can **untangle** it as such using a pipe operator
and a placeholder token (`?`) standing in for the previous operation’s value:

```js
envars
 |> Object.keys(?)
 |> ?.map(envar =>
    `${envar}=${envars[envar]}`,
  )
 |> ?.join(' ')
 |> `$ ${?}`
 |> chalk.dim(?, 'node', args.join(' '))
 |> console.log(?);
```

Now, the human reader can **rapidly find** the **initial data**
(what had been the most innermost expression, `envars`),
then **linearly** read, from **left to right**,
each transformation on the data.

</details>

### Temporary variables are often tedious
One could argue that using **temporary variables**
should be the only way to untangle deeply nested code.
Explicitly naming every step’s variable
causes something similar to method chaining to happen,
with similar benefits to reading and writing code.

<details>
<summary>Real-world example, continued</summary>

For example, using our previous modified
[real-world example from React][react/scripts/jest/jest-cli.js]:

```js
envars
 |> Object.keys(?)
 |> ?.map(envar =>
    `${envar}=${envars[envar]}`,
  )
 |> ?.join(' ')
 |> `$ ${?}`
 |> chalk.dim(?, 'node', args.join(' '))
 |> console.log(?);
```

…a version using temporary variables would look like this:

```js
const envarKeys = Object.keys(envars)
const envarPairs = envarKeys.map(envar =>
  `${envar}=${envars[envar]}`,
);
const envarString = envarPairs.join(' ');
const consoleText = `$ ${envarString}`;
const coloredConsoleText = chalk.dim(consoleText, 'node', args.join(' '));
console.log(coloredConsoleText);
```

</details>

But there are reasons why we encounter deeply nested expressions
in each other’s code **all the time in the real world**,
**rather than** lines of temporary variables.
And there are reasons why the **method-chain-based [fluent interfaces][]**
of jQuery, Mocha, and so on are still **popular**.

It is often simply too **tedious and wordy** to **write**
code with a long sequence of temporary, single-use variables.
It is arguably even tedious and visually noisy for a human to **read**, too.

If [naming is one of the **most difficult tasks** in programming][naming hard],
then programmers will **inevitably avoid naming** variables
when they perceive their benefit to be relatively small.

[naming hard]: https://martinfowler.com/bliki/TwoHardThings.html

## Why the Hack pipe operator
There are **two competing proposals** for the pipe operator: Hack pipes and F# pipes.
The two pipe proposals just differ slightly on what the “magic” is,
and thus on precisely how we spell our code when using `|>`.
(There **was** a [third proposal for a “smart mix” of the first two proposals][smart mix],
but it has been withdrawn,
since its syntax is strictly a superset of one of the proposals’.)

[smart mix]: https://github.com/js-choi/proposal-smart-pipelines/

### This proposal: Hack pipes
In the **Hack language**’s pipe syntax,
the righthand side of the pipe is an **expression** containing a special **placeholder**,
which is evaluated with the placeholder bound to the lefthand side’s value.
That is, we write `value |> one(?) |> two(?) |> three(?)`
to pipe `value` through the three functions.

**Pro:** The righthand side can be **any expression**,
and the placeholder can go anywhere any normal variable identifier could go,
so we can pipe to any code we want **without any special rules**:

* `value |> one(?)` for function calls,
* `value |> one(1, ?)` for multi-argument function calls,
* `value |> ?.foo()` for method calls
  (or `value |> obj.foo(?)`, for the other side),
* `value |> ? + 1` for arithmetic,
* `value |> new Foo(?)` for constructing objects,
* `value |> await ?` for awaiting promises,
* `value |> import(?)` for calling function-like keywords,
* etc.

**Con:** If **all** we’re doing is piping through **already-defined unary functions**,
Hack pipes are **slightly** more verbose than F# pipes,
since we need to **actually write** the function-call syntax
by adding a `(?)` to it.

### Alternative proposal: F# pipes
In the [**F# language**’s pipe syntax][F# pipes],
the righthand side of the pipe is an expression that must **evaluate into a function**,
which is then **tacitly called** with the lefthand side’s value as its **sole argument**.
That is, we write `value |> one |> two |> three` to pipe `value`
through the three functions.
`left |> right` becomes `right(left)`.
This is called [tacit programming or point-free style][tacit].

[F# pipes]: https://github.com/tc39/proposal-pipeline-operator/
[tacit]: https://en.wikipedia.org/wiki/Tacit_programming

<details>
<summary>Real-world example, continued</summary>

For example, using our previous modified
[real-world example from React][react/scripts/jest/jest-cli.js]:

```js
envars
 |> Object.keys(?)
 |> ?.map(envar =>
    `${envar}=${envars[envar]}`,
  )
 |> ?.join(' ')
 |> `$ ${?}`
 |> chalk.dim(?, 'node', args.join(' '))
 |> console.log(?);
```

…a version using F# pipes instead of Hack pipes would look like this:

```js
envars
 |> Object.keys
 |> x => x.map(envar =>
    `${envar}=${envars[envar]}`,
  )
 |> x => x.join(' ')
 |> x => `$ ${x}`
 |> x => chalk.dim(x, 'node', args.join(' '))
 |> console.log;
```

</details>

**Pro:** The restriction that the righthand side *must* resolve to a function
lets us write very terse pipes
**when** the operation we want to perform is **already a unary function**.

**Con:** The restriction means that **any operations**
that are performed by **other syntax**
must be done by **wrapping** the operation in a unary **arrow function**:\
`value |> x=>x[0]`,\
`value |> x=>x.foo()`,\
`value |> x=>x+1`,\
`value |> x=>new Foo(x)`,\
`value |> x=>import(x)`,\
etc.\
Even calling **named functions requires wrapping**
when we need to pass **more than one argument**:\
`value |> x=>f(1, x)`.

**Con:** The **`yield` and `await`** operations are scoped
to their containing function,
and thus can’t be handled by the arrow-function workaround
from the previous paragraph.
If we want to integrate them into a pipe expression
(rather than requiring the pipe to be parenthesis-wrapped and prefixed with `await`),
[`await` and `yield` need to be handled as **special syntax cases**][enhanced F# pipes]:
`value |> await |> one` to simulate `one(await value)`, etc.

[enhanced F# pipes]: https://github.com/valtech-nyc/proposal-fsharp-pipelines/

### Hack pipes favor more-common use cases
**Both** Hack pipes and F# pipes respectively impose
a small **syntax tax** on different cases:\
**Hack pipes** tax only **unary functions**;\
**F# pipes** tax **everything besides unary functions**.

The case of “unary function” is in general **less common**
than “**everything besides** unary functions”,
so it may make more sense to impose a tax on the former rather than the latter.

In particular, **method** calling and **non-unary function** calling
will **always** be **popular**.
Those two cases **alone** equal or exceed
unary function calling in frequency,
let alone other syntaxes such as **array/object literals** and **arithmetic operations**.

Several other proposed **new syntaxes**,
such as **[extension][]** calling,
**[do expressions][]**,
and **[record/tuple literals][]**,
will also likely become common in the future.
And **arithmetic** operations would become even more common
if TC39 standardized **[operator overloading][]**.
All of these syntaxes would be better accommodated by Hack pipes.

[extension]: https://github.com/tc39/proposal-extensions/
[do expressions]: https://github.com/tc39/proposal-do-expressions/
[record/tuple literals]: https://github.com/tc39/proposal-record-tuple/
[operator overloading]: https://github.com/tc39/proposal-operator-overloading/

### Hack pipes might be simpler to use
The syntax tax of Hack pipes on unary function calls
(i.e., the `(?)` to invoke the righthand side’s unary function)
is **not a special case**:
it’s just **writing ordinary code** in **the way we normally would** without a pipe.

On the other hand, **F# pipes require** us to **distinguish**
between “code that resolves to an unary function”
versus **“anything else”** –
and to remember to add the arrow-function wrapper around the latter case.

For example, with Hack pipes, `value |> someFunction + 1`
is **invalid syntax** and will **fail early**.
There is no need to recognize that `someFunction + 1`
will not evaluate into a unary function.
But with F# pipes, `value |> someFunction + 1` is **still valid syntax** –
it’ll just **fail late** at **runtime**,
because `someFunction + 1` isn’t callable.

## Description
(A [formal draft specification][specification] is available.)

The **topic reference** `?` is a **nullary operator**.
It acts as a placeholder for a **topic value**,
and it is **lexically scoped** and **immutable**.

The precise [token for the topic reference is not final][token bikeshedding].
`?` could instead be `%`, `@`, or many other tokens.
We plan to [bikeshed what actual token to use][token bikeshedding]
later, if TC39 advances this proposal.

The **pipe operator** `|>` is a bidirectionally **associative infix operator**
that forms a **pipe expression** (also called a **pipeline**).
It evaluates its lefthand side (the **pipe head** or **pipe input**),
immutably **binds** the resulting value to the topic reference,
then evaluates its righthand side (the **pipe body**) with that binding.
The resulting value of the righthand side
becomes the whole pipe expression’s **final value** or **pipe output**.

The pipe operator’s [precedence][] is **looser**
than all operators **other than**:
* the function arrow `=>`;
* the assignment operators `=`, `+=`, etc.;
* the generator operators `yield` and `yield *`;
* and the comma operator `,`.

For example, `v => v |> ? == null |> foo(?, 0)`\
would group into `v => (v |> (? == null) |> foo(?, 0))`,\
which in turn is equivalent to `v => foo(v == null, 0)`.

A pipe body **must** use its topic reference at least once.
For example, `value |> foo + 1` is **invalid syntax**,
because it does not contain `?`.
This design is because omission of the topic reference from a pipe expression’s body
is almost certainly an accidental programmer error.

Likewise, a topic reference **must** be in a pipe body.
Using a topic reference outside of a pipe body
is also **invalid syntax**.

Lastly, topic bindings **inside dynamically compiled** code
(e.g., with `eval` or `new Function`)
**cannot** be used **outside** of that code.
For example, `v |> eval('% + 1')` will throw a syntax error
when the `eval` expression is evaluated at runtime.

There are **no other special rules**.

If we need to interpose a **side effect**
in the middle of a chain of pipe expressions,
without modifying the data being piped through,
we could use a **comma expression**,
such as with `value |> (sideEffect(), ?)`.
As usual, the comma expression will evaluate to its righthand side `?`,
essentially passing through the topic value without modifying it.
This is especially useful for quick debugging: `value |> (console.log(?), ?)`.

[precedence]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence

## Real-world examples
Only minor formatting changes have been made to the status-quo examples.

<table>
<thead>
<tr>
<th>Status quo
<th>With Hack pipes

<tbody>
<tr>
<td>

```js
var minLoc = Object.keys(
  grunt.config(
    'uglify.all.files',
  )
)[0];
```
From [jquery/build/tasks/sourceMap.js][].

<td>

```js
var minLoc = 'uglify.all.files'
 |> grunt.config(?)
 |> Object.keys(?)[0];
```

<tr>
<td>

```js
const json =
  await npmFetch.json(
    npa(pkgs[0]).escapedName,
    opts,
  );
```
From [node/deps/npm/lib/unpublish.js][].

<td>

```js
const json = pkgs[0]
 |> npa(?).escapedName
 |> await npmFetch.json(?, opts);
```

<tr>
<td>

```js
function listCacheHas (key) {
  return assocIndexOf(this.__data__, key)
    > -1;
}
```
From [lodash.js][].

<td>

```js
function listCacheHas (key) {
  return this.__data__
   |> assocIndexOf(?, key)
   |> ? > -1;
}
```

<tr>
<td>

```js
return _.filter(obj,
  _.negate(cb(pred)),
  context,
);
```
From [underscore.js][].

<td>

```js
return pred
 |> cb(?)
 |> _.negate(?)
 |> _.filter(obj, ?, context);
```

<tr>
<td>

```js
parsed = buildFragment(
  [ data ], context, scripts,
);
return jQuery.merge(
  [], parsed.childNodes,
);
```
From [jquery/src/core/parseHTML.js][].

<td>

```js
return data
 |> buildFragment([?], context, scripts)
 |> ?.childNodes
 |> jQuery.merge([], ?);
```

<tr>
<td>

```js
const entries =
  Object.entries(
    require('shared/ReactSymbols'),
  ).filter(([key]) =>
    key !== 'REACT_ASYNC_MODE_TYPE',
  );
expectToBeUnique(entries);
```
From [react/scripts/jest/jest-cli.js][].

<td>

```js
require('shared/ReactSymbols')
 |> Object.entries(?)
 |> ?.filter(([key]) =>
    key !== 'REACT_ASYNC_MODE_TYPE',
  )
 |> expectToBeUnique(?);
```

<tr>
<td>

```js
return this.set('Link',
  link
  + Object.keys(links)
    .map(function (rel) {
      return '<' + links[rel] + '>; rel="'
        + rel + '"';
    })
    .join(', '),
);
```
From [express/lib/response.js][].

<td>

```js
return links
 |> Object.keys(?)
 |> ?.map(function (rel) {
    return '<' + links[rel] + '>; rel="'
      + rel + '"';
  })
 |> link + ?.join(', ')
 |> this.set('Link', ?);
```

<tr>
<td>

```js
console.log(
  chalk.dim(
    `$ ${Object.keys(envars)
      .map(envar =>
        `${envar}=${envars[envar]}`,
      ).join(' ')
    }`,
    'node',
    args.join(' '),
  )
);
```
From [react/scripts/jest/jest-cli.js][].

<td>

```js
envars
 |> Object.keys(?)
 |> ?.map(envar =>
    `${envar}=${envars[envar]}`,
  )
 |> ?.join(' ')
 |> `$ ${?}`
 |> chalk.dim(?, 'node', args.join(' '))
 |> console.log(?);
```

<tr>
<td>

```js
if (isFunction(this[match])) {
  this[match](context[match]);
} else
  this.attr(match, context[match]);
}
```
From [jquery/src/core/init.js][].

<td>

```js
match
 |> context[?]
 |> isFunction(this[match])
  ? this[match](?);
  : this.attr(match, ?);
```

<tr>
<td>

```js
var result = srcFn.apply(self, args);
if (_.isObject(result)) return result;
return self;
```
From [underscore.js][].

<td>

```js
return self
 |> srcFn.apply(?, args)
 |> _.isObject(?) ? ? : self;
```

<tr>
<td>

```js
if (obj == null) return 0;
return isArrayLike(obj)
  ? obj.length
  : _.keys(obj).length;
```
From [underscore.js][].

<td>

```js
return obj
 |> ? == null
    ? 0
    : isArrayLike(?)
    ? ?.length
    : _.keys(?).length;
```

<tr>
<td>

```js
jQuery.merge(
  this, jQuery.parseHTML(
    match[1],
    context && context.nodeType
      ? context.ownerDocument || context
      : document,
    true,
  )
);
```
From [jquery/src/core/init.js][].

<td>

```js
context
 |> ? && ?.nodeType
  ? ?.ownerDocument || ?
  : document
 |> jQuery.parseHTML(match[1], ?, true)
 |> jQuery.merge(?);
```

<tr>
<td>

```js
// Handle $(expr, $(...))
if (!context || context.jquery)
  return (context || root).find(selector);
// Handle $(expr, context)
else
  return this.constructor(context)
    .find(selector);
```
From [jquery/src/core/init.js][].

<td>

```js
return context
 |> !? || ?.jquery
  // Handle $(expr, $(...))
  ? ? || root
  // Handle $(expr, context)
  : this.constructor(?)
 |> ?.find(selector);
```

</table>

[node/deps/npm/lib/unpublish.js]: https://github.com/nodejs/node/blob/v16.x/deps/npm/lib/unpublish.js
[node/deps/v8/test/mjsunit/regress/regress-crbug-158185.js]: https://github.com/nodejs/node/blob/v16.x/deps/v8/test/mjsunit/regress/regress-crbug-158185.js
[express/lib/response.js]: https://github.com/expressjs/express/blob/5.0/lib/response.js
[react/scripts/jest/jest-cli.js]: https://github.com/facebook/react/blob/17.0.2/scripts/jest/jest-cli.js
[jquery/build/tasks/sourceMap.js]: https://github.com/jquery/jquery/blob/2.2-stable/build/tasks/sourcemap.js
[jquery/src/core/parseHTML.js]: https://github.com/jquery/jquery/blob/2.2-stable/src/core/parseHTML.js
[jquery/src/core/init.js]: https://github.com/jquery/jquery/blob/2.2-stable/src/core/init.js
[underscore.js]: https://underscorejs.org/docs/underscore-esm.html
[lodash.js]: https://www.runpkg.com/?lodash@4.17.20/lodash.js

## Possible future extensions

### Hack-pipe functions
If Hack pipes are added to JavaScript,
then they could also elegantly handle
**partial function application** in the future
with a syntax inspired by
[Clojure’s `#(+ %1 %2)` function literals][Clojure function literals].

[Clojure function literals]: https://clojure.org/reference/reader#_dispatch

There is **already** a [proposed special syntax
for partial function application (PFA) with `?` placeholders][PFA]
(abbreviated here as ***`?`-PFA**).
Both `?`-PFA and Hack pipes address a **similar problem** –
binding values to **placeholder tokens** –
but they address it in different ways.

With **`?`-PFA**, `?` placeholders are valid
only directly within function-call expressions,
and **each consecutive** `?` placeholder in an expression
refers to a **different** argument **value**.
This is in contrast to **Hack pipes**,
in which every `?` token in an expression
refers to the **same value**.
`?`-PFA’s design integrates well with **F# pipes**,
rather than Hack pipes.

[PFA]: https://github.com/tc39/proposal-partial-application/

| `?`-PFA with F# pipes      | Hack pipes                 |
| -------------------------- | -------------------------- |
|`x \|> y=> y + 1`           |`x \|> ? + 1`               |
|`x \|> f(?, 0)`             |`x \|> f(?, 0)`             |
|`a.map(x=> x + 1)`          |`a.map(x=> x + 1)`          |
|`a.map(f(?, 0))`            |`a.map(x=> f(x, 0))`        |
|`a.map(x=> x + x)`          |`a.map(x=> ? + ?)`          |
|`a.map(x=> f(x, x))`        |`a.map(x=> f(?, ?)`         |
|`a.sort((x,y)=> x - y)`     |`a.sort((x,y)=> x - y)`     |
|`a.sort(f(?, ?, 0))`        |`a.sort((x,y)=> f(x, y, 0))`|

The PFA proposal could instead **switch from `?` placeholders**
to **Hack-pipe topic references**.
It could do so by combining the Hack pipe `|>`
with the arrow function `=>`
into a **topic-function** operator `+>`,
which would use the same general rules as `|>`.

`+>` would be a **prefix operator** that **creates a new function**,
which in turn **binds its argument(s)** to the topic reference `?`.
**Non-unary functions** would be created
by including topic references with **numbers** (`?0`, `?1`, `?2`, etc.) or `...`.
`?0` (equivalent to plain `?`) would be bound to the **zeroth argument**,
`?1` would be bound to the next argument, and so on.
`?...` would be bound to an array of **rest arguments**.
And just as with `|>`, `+>` would require its body
to contain at least one topic reference
in order to be syntactically valid.

| `?`-PFA                    | Hack pipe functions        |
| ---------------------------| -------------------------- |
|`a.map(x=> x + 1)`          |`a.map(+> ? + 1)`           |
|`a.map(f(?, 0))`            |`a.map(+> f(?, 0))`         |
|`a.sort((x,y)=> x - y)`     |`a.sort(+> ?0 - ?1)`        |
|`a.sort(f(?, ?, 0))`        |`a.sort(+> f(?0, ?1, 0))`   |

Pipe functions would **avoid** the `?`-PFA syntax’s **[garden-path problem][]**.
When we read the expression **from left to right**,
the `+>` prefix operator makes it readily apparent
that the expression is **creating a new function** from `f`,
rather than **calling** `f` **immediately**.
In contrast, `?`-PFA would require us
to **check every function call for a `?` placeholder**
in order to determine whether it is actually an immediate function call.

[garden-path problem]: https://en.wikipedia.org/wiki/Garden-path_sentence

In addition, pipe functions wouldn’t help only partial function application.
Their **flexibility** would allow for **partial expression application**,
concisely creating functions from other kinds of expressions
in ways that would not be possible with `?`-PFA.

| `?`-PFA                    | Hack pipe functions        |
| -------------------------- | -------------------------- |
|`a.map(x=> x + 1)`          |`a.map(+> ? + 1)`           |
|`a.map(x=> x + x)`          |`a.map(+> ? + ?)`           |
|`a.sort((x,y)=> x - y)`     |`a.sort(+> ?0 - ?1)`        |

### Hack-pipe syntax for `if`, `catch`, and `for`–`of`
Many **`if`, `catch`, and `for` statements** could become pithier
if they gained **“pipe syntax”** that bound the topic reference.

`if () |>` would bind its condition value to `?`,\
`catch |>` would bind its caught error to `?`,\
and `for (of) |>` would consecutively bind each of its iterator’s values to `?`.

| Status quo                  | Hack-pipe statement syntax |
| --------------------------- | -------------------------- |
|`const c = f(); if (c) g(c);`|`if (f()) |> b(?);`         |
|`catch (e) f(e);`            |`catch |> f(?);`            |
|`for (const v of f()) g(v);` |`for (f()) |> g(?);`        |

### Optional Hack pipes
A **short-circuiting** optional-pipe operator `|?>` could also be useful,
much in the way `?.` is useful for optional method calls.

(This would probably require that
the [placeholder token for the topic reference
be something other than `?`][token bikeshedding].
We will use `%` in these examples.)

For example, `value |> % ?? await foo(%) |> % ?? % + 1`\
would be equivalent to `value |?> await foo(%) |?> % + 1`.

### Tacit unary function application
**Tacit unary function application** – that is, F# pipes –
could still be added to the language with **another pipe operator** `|>>` –
similarly to how [Clojure has multiple pipe macros][Clojure pipes]
`->`, `->>`, and `as->`.

[Clojure pipes]: https://clojure.org/guides/threading_macros

For example, `value |> ? + 1 |>> f |> g(?, 0)`\
would mean `value |> ? + 1 |> f(?) |> g(?, 0)`.

There was an [informal proposal for such a **split mix** of two pipe operators][split mix],
which was set aside in favor of single-operator proposals.

[split mix]: https://github.com/tc39/proposal-pipeline-operator/wiki#proposal-3-split-mix
