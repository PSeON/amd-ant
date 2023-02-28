const { installMocks, requireAsync } = require('./utils');

test('Basic simple', async () => {
  const modules = {
    'a.js'() {
      window.define('a', { name: 'a' });
    },
    'b.js'() {
      window.define('b', ['sub/c'], c => {
        return { name: 'b', cName: c.name };
      });
    },
    'sub/c.js'() {
      window.define('sub/c', () => {
        return { name: 'c' };
      });
    },
  };

  installMocks({
    modules,
  });

  const [a, b] = await requireAsync(window.require, ['a', 'b']);
  expect(a.name).toBe('a');
  expect(b.name).toBe('b');
  expect(b.cName).toBe('c');
});
