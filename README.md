# amd-ant

Tiny AMD.js loader, similar to requirejs but with basic functionality only.

It passes all anonymous and basic tests of [amdjs-tests](https://github.com/amdjs/amdjs-tests).

Test coverage is 100%.

Four variants are available:

| File name           | Description                                 |
| ------------------- | ------------------------------------------- |
| `amdant.es5.js`     | ES5 syntax for older browsers               |
| `amdant.es5.min.js` | Optimized and minified version of the above |
| `amdant.es6.js`     | ES6 syntax for modern browsers              |
| `amdant.es6.min.js` | Optimized and minified version of the above |

## Example usage

Example HTML document which uses this loader might look like the following:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>AMD.js loader</title>
    <link rel="preload" href="/dist/amdant.es5.min.js" as="script" />
    <link rel="preload" href="/dist/index.js" as="script" />
  </head>
  <body>
    <script src="/dist/amdant.es5.min.js"></script>
    <script>
      require(['/dist/index']);
    </script>
  </body>
</html>
```

Example usage with Rollup might look like the following:

```js
import * as fs from 'fs';

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: 'src/index.js',
  output: [
    {
      dir: 'dist',
      format: 'amd',
      sourcemap: true,
    },
  ],
  plugins: [
    {
      name: 'copy-loader',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'amdant.es5.min.js',
          source: fs.readFileSync(require.resolve('amd-ant/amdant.es5.min.js')),
        });
      },
    },
  ],
};

export default config;
```

## License

ISC
