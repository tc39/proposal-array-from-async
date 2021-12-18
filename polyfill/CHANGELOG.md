# array-from-async changelog

## v2.0.0 (2021-12-17)
The library was changed to be a standalone implementation that exports a single
default function and which does not monkey-patch the global Array constructor.

The license was also changed from MIT to BSD-3 in order to match the rest of
TC39’s code.

## v1.0.5 (2021-09-21)
The polyfill was updated to correctly throw a TypeError when its `this` receiver
is not a constructor.

## v1.0.0–1.0.4 (2021-09)
This was the original version. It was a polyfill that mutated the global Array
constructor. All subsequent patch versions were documentation changes.
