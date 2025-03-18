For my own sake, I've added type checking with TSDoc stuff. If you don't have the typescript LSP, the `.js` files should still work just fine. If you have the typescript LSP, the comments at the top of each `.js` file,

```js
// @ts-check
/// <reference ...>
/// ...
```

tell the LSP what types to expect by looking at the ones declared in the `lib_types` folder I made. I made the types folder separate so that the original `lib` folder is unchanged. This *only* helps the LSP type-checking, it has zero effect on how the code is actually executed in the browser. The javascript runtime sees these as ordinary, meaningless comments and the `.d.ts` files are never read.

___

My shader source code is all in the `shaders.js` file. The file defines string constants that contains shader source code for each of the programs, and the script is loaded in the HTML document to set those constants.
