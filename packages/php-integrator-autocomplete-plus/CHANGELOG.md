## 1.1.5
### Bugs fixed
* Rename the package and repository.

## 1.1.4
### Bugs fixed
* Fix not being able to navigate to the PHP documentation for built-in classes with longer FQCN's, such as classes from MongoDB.
* Fix built-in classes sometimes navigating to the wrong page, e.g. `DateTime` was navigating to the overview page instead of the class documentation page.

## 1.1.3
### Bugs fixed
* Fix the parameter list itself also being inserted for class methods calls.

## 1.1.2
### Bugs fixed
* Fix incorrect styling on the parameter list for functions and methods. Unfortunately this meant removing the styling for the parameter list, see also [this ticket](https://github.com/atom/autocomplete-plus/issues/764).

## 1.1.1
### Bugs fixed
* Fix constants being added to the suggestions twice, resulting in some information such as deprecation information getting lost.

## 1.1.0
### Features and improvements
* Make the timeout before refreshing global data adjustable via the settings panel.

### Bugs fixed
* Trait suggestions will now be shown after the `use` keyword occurs in a class.

## 1.0.4
### Bugs fixed
* Fixed `@inheritDoc` being missing from docblock tag suggestions (thanks to [squio](https://github.com/squio)).

## 1.0.3
### Bugs fixed
* Fixed error with member autocompletion when there was no current class.

## 1.0.2
### Bugs fixed
* Global function names with upper cased letters were not being autocompleted.

## 1.0.1
### Bugs fixed
* Add a sanity check for providers on package deactivation.

## 1.0.0 (base 1.0.0)
### Features and improvements
* Only interfaces will now be listed after the `implements` keyword.
* Only appropriate classes or interfaces will now be listed after the `extends` keyword.
* The default value for function and method parameters that have one will now be shown during autocompletion.
* "Branched" member autocompletion is now supported. This means that if a structural element returns multiple types, all of their members will be listed, for example:

```php
/**
 * @return \IteratorAggregate|\Countable
 */
public function foo()
{
    $this->foo()-> // Will list members for both Countable and IteratorAggregate.
}
```

### Bugs fixed
* Global constants will now also show their type in the left column.
* Global constants will now properly show their short description instead of just "Global PHP constant".
* Fix the FQCN not properly being completed in some cases when starting with a leading slash (only the last part was completed).
* The ellipsis for variadic parameters is now shown at the front instead of the back of the parameter, consistent with PHP's syntax.
* Global constants will no longer show after a backslash. It would always result in a syntax error and puts the class list up front, which is more likely to be what you're looking for.
* Class suggestions will now be shown without having to type the first letter. An exception is the class list that is shown without any keyword (such as `new`, `extends`, ...), because it constantly pops up when writing regular code, accidentally triggering the completion whenever you want to move to the next line.

## 0.8.1
### Bugs fixed
* Fixed the `class` suggestion being shown for classlikes that didn't exist.

## 0.8.0 (base 0.9.0)
### Features and improvements
* Added a setting that allows disabling the automatic adding of use statements.
* Added a new docblock annotation provider that will list classes that are usable as annotation (i.e. have the `@Annotation` tag in their docblock) after the `@` sign in docblocks (used by e.g. Doctrine and Symfony).

### Bugs fixed
* Fix traits not having a different icon in the class suggestion list.

## 0.7.0 (base 0.8.0)
### Features and enhancements
* Also show `$argv` and `$argv` in the autocompletion suggestions.
* Also show new variable suggestions without first typing the dollar sign for fluency.
* Tweaked the ordering of suggestions, which seems to improve overall relevancy of suggestions.
* Fetching class members is now even more asynchronous, improving responsiveness of autocompletion.
* Fetching class list, global function and global constant suggestions is now cached. This should further improve responsiveness of autocompletion.
  * The suggestions change fairly rarely and fetching them is expensive because PHP processes are spawned constantly due to the changing contents of the buffer (the base service only caches the results until the next reindex, which happens when the buffer stops changing). Instead, these three lists are refreshed after a couple of seconds after the last successful reindex, (i.e. a couple of seconds after the editor stops changing instead of a couple hundred milliseconds, assuming the code in the editor is valid).

### Bugs fixed
* Fixed no local variables being suggested after keywords suchas `return`.
* Fixed new variable names were being suggested after keywords such as `return`.

## 0.6.0 (base 0.7.0)
### Features and enhancements
* Magic constants will now also be suggested.
* Superglobal names will now also be suggested.
* Local variables will now be fetched asynchronously, improving responsiveness.
* New variable names will now be suggested after a type hint, for example typing `FooBarInterface $` will suggest `$fooBar` and `$fooBarInterface`.
* Due to changes to the way variables are fetched in the base service, you will notice some changes when local variable names are suggested:
  * Variables outside current the scope will no longer be suggested. This previously only applied to variables outside the active function scope. Now, after you exit a statement such as an if statement, the variables contained in it will no longer be suggested:
    ```php
    $a = 1;

    if (condition) {
        $a = 2;
        $b = 3;
    } else {
        $a = 4;
        $c = 5;
    }

    $ // Autocompletion will not list $b and $c, only $a.
    ```
    Even though they technically remain available in PHP afterwards, their presence is not guaranteed and the absence of them during autocompletion will guard you for mistakes.
  * Variables in other statements will no longer incorrectly be listed (for example, in the example above, `$b` will no longer show up inside the else block).
  * `$this` will no longer be suggested in global functions and outside class, interface or trait scopes. It will still be suggested inside closures as they can have a `$this` context.

### Bugs fixed
* Local variables will no longer be suggested after type hints.

## 0.5.3
### Bugs fixed
* Use statements will no longer be added when typing a namespace name. (Existing items will still be suggested for convenience.)

## 0.5.2 (base 0.6.0)
### Bugs fixed
* Use statements will no longer be added for classes in the same namespace. This was previously only done for the current class. This will also work for relative imports if the import is relative to the current namespace (i.e. use statements will not be added).

## 0.5.1 (base 0.5.0)
### Bugs fixed
* Fixed a rare TypeError in the Utility file.
* Fixed the `yield` keyword not being suggested.
* Fixed the `class` keyword introduced in PHP 5.5 not being completed after two dots.

## 0.5.0 (base 0.5.0)
### Features and enhancements
* Only (non-abstract) classes will be suggested after the new keyword.
* A new keyword provider will also show autocompletion for PHP keywords.
* The parameter list for methods will now be displayed in a different style for better visual recognition.
* A new snippet provider will now suggest a few useful snippets such as for `isset`, `unset`, `catch`, and more.
* When autocompleting use statements, the suggestions will now have a different icon to indicate that it is an import.
* Traits will now receive the 'mixin' type (which by default has the same icon as a 'class') to allow for separate styling.
* Parameters for functions and methods will still be shown during completion, but will no longer actually be completed anymore. Instead, your cursor will be put between the parentheses. As a replacement, please consider using the [php-integrator-call-tips](https://github.com/Gert-dev/php-integrator-call-tips) package (if you're not already), which can now provide call tips instead. Call tips are an improvement as there is no longer a need to remove parameters you don't want and jump around using tab.

### Bugs fixed
* Fixed autocompletion not properly completing and working with static class property access, such as `static::$foo->bar()`.
* Autocompletion will now also trigger on a backslash for class names (i.e. `My\Namespace\` didn't trigger any autocompletion before, whilst `My\Namespace\A` did).

## 0.4.0 (base 0.4.0)
### Features and enhancements
* The placement of use statements has been improved.
* Added a new autocompletion provider that will provide snippets for tags in docblocks.
* The class provider will now show a documentation URL for built-in classes, interfaces and traits.
* Added a new command that sorts use statements according to the same algorithm that manages adding them.
* The class provider will now show the type of the structural element (trait, interface or class) in the left label.
* We no longer depend on fuzzaldrin directly. Filtering suggestions is now handled by the base autocomplete-plus package, allowing your configurations there to also take effect in this package.
* $this will now always list private and protected members, which allows files that are being require-d inside classes to define a type override annotation for $this and still be able to access private and protected members there.
* The order in which providers are registered has slightly changed; this results in things that are more interesting being shown first, such as members, class names and variable names. Global constants and functions are 'less important' and are shown further down the list. Note that this only applies if, after filtering (fuzzy matching), there are suggestions present from multiple providers.

### Bugs fixed
* Fixed use statements ending up at an incorrect location in some situations.
* Fixed a use statement still being added when starting a class name with a leading slash.
* Fixed duplicate use statements being added in some cases with certain (unformatted) sorting combinations.
* Fixed an unnecessary use statement being added when selecting the current class name during autocompletion.
* When the base package service is not available, autocompletion will silently fail instead of spawning errors.

## 0.3.0
### Features and enhancements
* Documentation for classes will now be shown during autocompletion.

### Bugs fixed
* Fixed variables containing numbers not being suggested.
* Use statements were still added if one was already present with a leading slash.
* An error would sometimes be shown when trying to autocomplete a class that did not exist.
* The partial name of the variable being autocompleted is now no longer included in the suggestions.

## 0.2.1
### Bugs fixed
* Global functions inside namespaces were not being autocompleted properly.
* Class names that start with a lower case letter will now also be autocompleted.
* Class names were not being completed in some locations such as inside if statements.
* Added a new configuration option that disables the built-in PHP autocompletion provider (enabled by default). `[1]`

`[1]` This will solve the problem where built-in functions such as `array_walk` were showing up twice, once from this package and once from Atom's PHP support itself.

## 0.2.0
### Features and enhancements
* Autocompletion now works inside double quoted strings `[1]`.
* When autocompleting variable names, their type is now displayed, if possible.
* Where possible, autocompletion is now asynchronous (using promises), improving performance.
* The right label of class members in the autocompletion window will now display the originating structure (i.e. class, interface or trait).
* The way use statements are added and class names are completed was drastically improved.
  * Multiple cursors are now properly supported.
  * The appropriate namespace will now be added if you are trying to do a relative import:

```php
<?php

// Select My\Foo\FooClass as suggestion.
Foo\FooClass

// The result (before):
use My\Foo\FooClass;

FooClass

// The result (after):
use My\Foo;

Foo\FooClass
```

`[1]` This might also complete in a few rare erroneous cases as well (e.g. `{SomeClass::test}` instead of `{${SomeClass::test}}`), but it's better to have autocompletion for common used cases and in a few rare erroneous cases than no autocompletion at all.

### Bugs fixed
* Autocompletion of class names inside comments will now no longer work.
* Class autocompletion will now work when the cursor is at the start of a line.
* Restrictions for function and constant autocompletion is now more relaxed. You will now receive autocompletion after `if (!` for built-in PHP functions and constants.

## 0.1.0
* Initial release.
