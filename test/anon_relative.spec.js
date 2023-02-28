const { installMocks, requireAsync } = require('./utils');

test('Anonymous relative', async () => {
  const modules = {
    'util.js'() {
      window.define({ name: 'util' });
    },
    'impl/array.js'() {
      window.define(['./util', 'util'], (dotUtil, util) => ({
        name: 'impl/array',
        dotUtilName: dotUtil.name,
        utilName: util.name,
      }));
    },
    'impl/util.js'() {
      window.define({ name: 'impl/util' });
    },
  };

  installMocks({
    modules,
  });

  const [require, array] = await requireAsync(window.require, ['require', 'impl/array']);

  expect(array.name).toBe('impl/array');
  expect(array.dotUtilName).toBe('impl/util');
  expect(array.utilName).toBe('util');
});
