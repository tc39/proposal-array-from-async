# Hack pipe operator for JavaScript
ECMAScript Stage-0 Proposal. Living Document. J. S. Choi, 2021-03.

This explainer was adapted from an [essay by Tab Atkins][] with permission.

(This document presumptively uses `?`
as the placeholder token for the topic reference.
This choice of token is not a final decision;
`?` could instead be `%`, `@`, `#`, or many other tokens.)

[essay by Tab Atkins]: https://gist.github.com/tabatkins/1261b108b9e6cdab5ad5df4b8021bcb5

## Why a pipe operator
In the State of JS 2020 survey, the **fourth top answer** to
[“What do you feel is currently missing from
JavaScript?”](https://2020.stateofjs.com/en-US/opinions/?missing_from_js)
was the **pipe operator**.

When you call a JavaScript function on a value,
there are currently two fundamental ways to do so:
* passing the value as an argument
  (**nesting** the functions if there are multiple calls),
* or calling the function as a method on the value
  (**chaining** more method calls if there are multiple).

That is, `three(two(one(value)))` versus `value.one().two().three()`.

The first style, **nesting**, is generally applicable –
it works for any function and any value.
However, it’s **difficult** to read as the nesting increases:
the flow of execution moves **right to left**,
rather than the left-to-right reading of normal code execution.
If there are **multiple arguments** at some levels it even bounces **back and forth**,
as your eyes jump right to find a function name and left to find the additional arguments;
and editing the code afterwards can be fraught
as you have to find the correct **place to insert** new arguments
among many difficult-to-distinguish parentheses.

The second style, **chaining**, is **only** usable
if the value has the functions designated as **methods** for its class.
This **limits** its applicability,
but **when** it applies,
it’s generally more usable and **easier** to read and write:
execution flows **left to right**;
all the arguments for a given function are **grouped** with the function name;
and editing the code later to insert or delete more function calls is trivial,
since you just have to put your cursor in one spot and start typing
or delete one **contiguous run of characters** with a clear separator.

The benefits of method chaining are so attractive
that some popular libraries contort their code structure
*specifically* to allow more method chaining.
The most prominent example is [jQuery][],
*still* the most popular JS library in the world:
its core design is a single über-object with dozens of methods on it,
all of which return the same object type so you can continue chaining.)

[jQuery]: https://jquery.com/

The pipe operator attempts to marry the **convenience** and ease of **method chaining**
with the wide **applicability** of **function nesting**.

The general structure of all the pipe operators is
`value |> ` <var>one</var> `|>` <var>two</var> `|>` <var>three</var>,
where <var>one</var>, <var>two</var>, and <var>three</var>
are all expressions that take the value as an argument.
The `|>` operator then does some degree of magic to “pipe” `value`
from the lefthand side into the righthand side.

## Why the Hack pipe operator
There are **two competing proposals** for the pipe operator: Hack pipes and F# pipes.
The proponents of each haven’t been convinced by the others yet.
The two pipe proposals just differ slightly on what the “magic” is,
and thus on precisely how you spell your code when using `|>`.
(There **was** a [third proposal for a “smart mix” of the first two proposals][smart mix],
but it has been withdrawn,
since its syntax is strictly a superset of one of the proposals’.)

[smart mix]: https://github.com/js-choi/proposal-smart-pipelines/

### This proposal: Hack pipes
In the **Hack language**’s pipe syntax,
the RHS of the pipe is an **expression** containing a special **placeholder**,
which is evaluated with the placeholder bound to the lefthand side’s value.
That is, you write `value |> one(?) |> two(?) |> three(?)`
to pipe `value` through the three functions.

**Pro:** The RHS can be **any expression**,
and the placeholder can go anywhere any normal variable identifier could go,
so you can pipe to any code you want **without any special rules**:

* `value |> one(?)` for functions,
* `value |> one(1, ?)` for multi-argument functions,
* `value |> ?.foo()` for method calls
(or `value |> obj.foo(?)`, for the other side),
* `value |> ? + 1` for arithmetic,
* `value |> new Foo(?)` for constructing objects,
* `value |> await ?` for awaiting promises,
* etc.

**Con:** If **all** you’re doing is piping through **already-defined unary functions**,
Hack pipes are **slightly** more verbose than F# pipes,
since you need to **actually write** the function-call syntax
by adding a `(?)` to it.

### Alternative proposal: F# pipes
In the [**F# language**’s pipe syntax][F# pipes],
the RHS of the pipe is an expression that must resolve to a function,
which is then called with the lefthand side’s value as its sole argument.
That is, you write `value |> one |> two |> three` to pipe `value`
through the three functions.
`left |> right` becomes `right(left)`.

[F# pipes]: https://github.com/valtech-nyc/proposal-fsharp-pipelines/

**Pro:** The restriction that the RHS *must* resolve to a function
lets you write very terse pipes
**when** the operation you want to perform is **already a named function**.

**Con:** The restriction means that **any operations**
that are performed by **other syntax**
must be done by **wrapping** the operation in an **arrow function**:\
`value |> x=>x[0]`,\
`value |> x=>x.foo()`,\
`value |> x=>x+1`,\
`value |> x=>new Foo(x)`,\
etc.\
Even calling a **named function requires wrapping**
if you need to pass **more than one argument**:\
`value |> x=>f(1, x)`.

**Con:** The **`yield` and `await`** operations are scoped
to their containing function,
and thus can’t be handled by the arrow-function workaround
from the previous paragraph.
If you want to integrate them into a pipe expression
(rather than requiring the pipe to be parenthesis-wrapped and prefixed with `await`),
they need to be handled as **special syntax cases**:
`value |> await |> one` to simulate `one(await value)`, etc.

### Hack pipes favor more-common use cases
Both Hack pipes and F# pipes put a **syntax tax** on different cases.
Hack pipes put a syntax tax only on unary functions.
F# pipes put a syntax tax on everything besides unary functions.

The case of “unary function” is in general be **less common**
than “**everything besides** unary functions”,
so it makes more sense to put a tax on the former rather than the latter.

In particular, **method** calling and **non-unary function** calling
will **always** be **popular**.
Those two cases **on their own** equal or exceed
unary function calling in frequency,
even without **all the other syntax** that Hack pipes can do without a tax.

### Hack pipes may be simpler to use
The syntax tax of Hack pipes on unary function calls
(i.e., the `(?)` to invoke the RHS’s unary function)
**isn’t a special case**:
it’s just **writing ordinary code** in **the way you normally would** without a pipe.

On the other hand, **F# pipes require** you to **distinguish**
between “code that resolves to an unary function”
versus **“anything else”** –
and to remember to add the arrow-function wrapper around the latter case.

With Hack pipes, `value |> someFunction + 1`
is **invalid syntax** and will **fail early**.
There is no need to recognize that `someFunction + 1`
will not evaluate into a unary function.

But with F# pipes, `value |> someFunction + 1` is **still valid syntax** –
it’ll just **fail late** at **runtime**,
because `someFunction + 1` isn’t callable.
You can avoid having to make this recognition
by *always* wrapping the RHS in an arrow function
(e.g., `value |> x=>someFunction(x) + 1`),
but then you’re paying the tax 100% of the time
and effectively just writing more-verbose Hack pipes anyway.

## Description
The **topic reference** `?` is a **nullary operator**.
It acts as an immutable **placeholder** for a **topic value**.

The precise token for the topic reference is not final.
`?` could instead be `%`, `@`, or many other tokens.

The **pipe operator** `|>` is an associative **infix operator**.
It evaluates its lefthand-side expression (the **head**),
immutably binds the resulting value to the topic reference,
then evaluates its righthand-side expression (the **body**) with that binding,
which in turn becomes the value of the whole **pipeline** expression.

The pipe operator’s [precedence][] is **looser**
than all operators **other than**:
* the function arrow `=>`;
* the assignment operators `=`, `+=`, etc.;
* the generator operators `yield` and `yield *`;
* and the comma operator `,`.

For example, `value => value |> ? == null |> foo(?, 0)`\
would group into `value => (value |> (? == null) |> foo(?, 0))`,\
which is equivalent to `value => foo(value == null, 0)`.

If you need to interpose a side effect
in the middle of a pipeline expression,
without modifying the data being piped through,
you could use a comma expression instead,
such as with `value |> (sideEffect(), ?)`.
This is especially useful for quick debugging
with `value |> (console.log(?), ?)`.

There are two syntactic restrictions
that help **prevent unintentional errors early**,
at compilation time:

1. A pipeline’s body **must** use its topic reference.
   `value |> foo + 1` is an early syntax error,
   because it does not contain `?`.
   This design is because omission of the topic reference from a pipeline body
   is almost certainly an accidental error.

2. A `yield` expression **must** have parentheses.
   `value |> yield ? |> ? + 1` is an early syntax error,
   which can be fixed into `value |> (yield ?) |> ? + 1`.
   This design is because the `yield` operator has a very loose [precedence][],
   and it is likely that omitting the parentheses
   (equivalent to `value |> (yield ? |> ? + 1)`)
   is an accidental error.

There are no other special rules.

[precedence]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence

## Real-world examples

<table>
<thead>
<tr>
<th>Status quo
<th>With Hack pipes

<tbody>
<tr>
<td>

```js
parsed = buildFragment(
  [ data ], context, scripts
);
return jQuery.merge(
  [], parsed.childNodes
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
function listCacheHas (key) {
  return assocIndexOf(this.__data__, key)
    > -1;
}
```
From [lodash.js version 4.17.20][].

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
context
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
      ? context.ownerDocument
        || context
      : document,
    true
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
  ? ? || root // Handle $(expr, $(...))
  : this.constructor(?) // Handle $(expr, context)
 |> ?.find(selector);
```

</table>

[jquery/src/core/parseHTML.js]: https://github.com/jquery/jquery/blob/2.2-stable/src/core/parseHTML.js
[jquery/src/core/init.js]: https://github.com/jquery/jquery/blob/2.2-stable/src/core/init.js
[underscore.js]: https://underscorejs.org/docs/underscore-esm.html
[lodash.js version 4.17.20]: https://www.runpkg.com/?lodash@4.17.20/lodash.js

## Possible future extensions

### Pipe functions
If Hack pipes are added to JavaScript,
then they could also elegantly handle
**partial function application** in the future.

Instead of the [proposed special syntax for partial function application],
there could be a **topic-function** operator `+>`
that would combine Hack pipes `|>` with arrow functions `=>`,
performing **partial expression application**,
and which would use the same general rules as `|>`.

[proposed special syntax for partial function application]: https://github.com/tc39/proposal-partial-application/

For example, instead of the proposed `example.map(foo(?, 0))`,\
to mean `example.map(x => foo(x, 0))`,\
one would write `example.map(+> foo(?, 0))`.\
This would **avoid the garden-path problem** in that,
when reading the expression from left to right,
it is immediately apparent that it creates a new function,
rather than calling `foo` directly.

But additionally, `example.map(+> foo(?, ?)`\
would mean `example.map(x => foo(x, x))`,\
and `example.map(+> ? + 1)`\
would mean `example.map(x => x + 1)`.\
**Neither** of these examples would be possible with the proposed `?` token.

Creating non-unary functions could be done
by adding numbers to topic references,
such as `?0` (equivalent to plain `?`), `?1`, `?2`, etc.\
For instance, `example.sort(+> ?0 - ?1)`\
would mean `example.sort((x, y) => x - y)`.

### Pipe syntax for `catch` and `for`
Many `catch` and `for` statements could become pithier
if they gained “pipe syntax” that bound the topic reference.

For example, `catch (err) { err.code |> foo(?, 0) |> console.error(?); }`\
might become `catch |> ?.code |> foo(?, 0) |> console.error(?);`,\
and `for (const val of arr) { val.foo() |> bar(?, 0); }`\
might become `for (arr) |> ?.foo() |> bar(?, 0);`.

### “Smart-mix” pipes
In the future, **tacit function application** might also be added,
which would resemble **F# pipes**.\
For example, `value |> ? + 1 |> foo`\
would mean `value |> ? + 1 |> foo(?)`.\
Tacit function application (F# style) would have to be somehow distinguishable
from expressions that use topic references (Hack style).

This proposal would be **forward compatible**
with such a [“smart mix” of topic expressions,
which was initially proposed but then withdrawn][smart mix]
in favor of this simpler Hack-pipes proposal.
(The F#-pipe proposal, as is, would **not** be forward compatible.)
