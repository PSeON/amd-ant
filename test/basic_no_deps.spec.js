const { installMocks, requireAsync } = require('./utils');

test('Basic no dependencies', async () => {
  installMocks({});

  const [require] = await requireAsync(window.require, ['require']);

  // tests if there are NO dependencies, the default
  // values of "require, exports, module" are used
  window.define('noDeps', (require, exports, module) => {
    expect(typeof require).toBe('function');
    expect(typeof exports).toBe('object');
    expect(typeof module).toBe('object');
  });

  await new Promise((resolve, reject) => {
    require(['noDeps'], () => {
      // TODO Test that module is actually loaded
      resolve();
    }, reject);
  });
});
