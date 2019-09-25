# Fold Functions

![build status](https://travis-ci.org/robballou/atom-fold-functions.svg)

Folds functions within your code. Currently comes with a toggle, fold, and unfold option that will look for functions marked with 'meta.function'. Handy because it won't fold things like comments associated with functions.

![screenshot](http://robballou.com/i/fold.gif)

*Note: this currently folds only those functions it finds at a single indentation (e.g. it will fold the top level functions)*

Heavily inspired/influenced by [Fold Comments](https://atom.io/packages/fold-comments). This package uses the "scopes" defined by a language instead of things like ctags.

## Autofolding

You can turn on the auto-folding feature with the following in your configuration file:

```coffescript
"fold-functions":
    autofold: true
    shortfileCutoff: 42
    autofoldGrammars: []
    autofoldIgnoreGrammars: ['SQL', 'CSV', 'JSON', 'CSON', 'Plain Text']
    skipAutofoldWhenNotFirstLine: true
    skipAutofoldWhenOnlyOneFunction: true
```

By default, this is setup to ignore files that are under 42 lines. This can be configured by changing the `shortfileCutoff` option to a larger or smaller number. If you wish to fold all files, even short ones, you can change this option to `0`.

Autofolding also has the following options:

1. `autofoldGrammars` allows you to specify grammar names for grammars you *want* to autofold. An empty list (which is the default), means everything is fair game to fold. That is except...
2. `autofoldIgnoreGrammars` allows you to specify grammar names for grammars you *do not want to autofold*. This fires after `autofoldGrammars` and does have a default value (see above).
3. `skipAutofoldWhenNotFirstLine` will stop autofolding if the line cursor is not the first line in the buffer. This will help with searching finding a line and folding it out-of-sight.
4. `skipAutofoldWhenOnlyOneFunction` will stop autofolding if there is only one top-level function in a file. Handy for JavaScript!

## Configurable Scopes (NEW!)

This module uses level language scopes to define what constitutes a function. Since this varies greatly by language, the package now exposes options for specifying scopes including *by language*!

```coffescript
"*":
  "fold-functions":
    foldScopes: ['meta.function']
"source.php":
  "fold-functions":
    foldScopes: ['meta.something']
```

By default, this package folds on:

```coffescript
[
  'meta.function',
  'meta.method',
  'storage.type.arrow',
  'entity.name.function',
  'support.function'
]
```
