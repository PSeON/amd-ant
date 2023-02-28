const { installMocks, requireAsync } = require('./utils');

test('Basic empty dependencies', async () => {
  installMocks({});

  const [require] = await requireAsync(window.require, ['require']);

  // tests if there are NO dependencies, the default
  // values of "require, exports, module" are used
  window.define('emptyDeps', [], function () {
    expect(arguments.length).toBe(0);
  });

  await new Promise((resolve, reject) => {
    require(['emptyDeps'], () => {
      // TODO Test that module is actually loaded
      resolve();
    }, reject);
  });
});
