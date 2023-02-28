const { installMocks, requireAsync } = require('./utils');

test('Basic require', async () => {
  const modules = {
    'a.js'() {
      window.define('a', { name: 'a' });
    },
    'b.js'() {
      window.define('b', [], () => {
        return { name: 'b' };
      });
    },
    'c.js'() {
      window.define('c', ['require'], function (require) {
        return {
          name: 'c',
          url: require.toUrl('./c/templates/first.txt'),
        };
      });
    },
  };

  installMocks({
    modules,
  });

  const [require] = await requireAsync(window.require, ['require', 'a']);
  const [b, c] = await requireAsync(require, ['b', 'c']);

  expect(require('a').name).toBe('a');
  expect(b.name).toBe('b');
  expect(c.name).toBe('c');
  expect(/c\/templates\/first\.txt$/.test(c.url)).toBe(true);
});
