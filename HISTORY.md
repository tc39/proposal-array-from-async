# 2021-08
Presented to [plenary meeting for Stage 2 on 2021-08-31][2021-08-31]. Was accepted.

# 2021-10
Presented to [plenary meeting as an update on 2021-10-26][2021-10-26].

# 2021-12
Presented to [plenary meeting for Stage 2 on 2021-12-14][2021-12-14].
Was rejected due to need to clarify `await`ing semantics
with and without mapping-function arguments.

# 2022-07
Discussion occurred about `await`ing semantics and mapping functions in [issue
#19][]. It was eventually decided to match `for await` and the proposed
[AsyncIterator.prototype.toArray][iterator-helpers] by `await`ing values from
input sync iterators once, `await`ing values from input async iterators not at
all, and `await`ing results returned by mapping functions once.

# 2022-09
The [plenary advances this proposal to Stage 3][2022-09], conditional on editor review.

# 2023-05
The [plenary discusses double construction of the `this` value][2023-05] ([pull request #41][]) and resolves to merge the pull request that fixes it.

[2021-08-31]: https://github.com/tc39/notes/blob/HEAD/meetings/2021-08/aug-31.md
[2021-10-26]: https://github.com/tc39/notes/blob/HEAD/meetings/2021-10/oct-26.md#arrayfromasync-update
[2021-12-14]: https://github.com/tc39/notes/blob/HEAD/meetings/2021-12/dec-14.md#arrayfromasync-for-stage-2
[issue #19]: https://github.com/tc39/proposal-array-from-async/issues/19
[iterator-helpers]: https://github.com/tc39/proposal-iterator-helpers
[iterator-helpers#168]: https://github.com/tc39/proposal-iterator-helpers/issues/168
[2022-09]: https://github.com/tc39/notes/blob/HEAD/meetings/2022-09/sep-14.md#conclusionresolution-1
[2023-05]: https://github.com/tc39/notes/blob/main/meetings/2023-05/may-15.md#arrayfromasync-41-avoid-double-construction-of-this-value
[pull request #41]: https://github.com/tc39/proposal-array-from-async/pull/41
