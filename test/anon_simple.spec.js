const { installMocks, requireAsync } = require('./utils');

test('Anonymous simple', async () => {
  const modules = {
    'a.js'() {
      window.define({ name: 'a' });
    },
    'b.js'() {
      window.define(['sub/c'], c => ({ name: 'b', cName: c.name }));
    },
    'sub/c.js'() {
      window.define(() => ({ name: 'c' }));
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
