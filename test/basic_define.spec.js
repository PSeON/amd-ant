const { installMocks, requireAsync } = require('./utils');

test('Basic define', async function () {
  installMocks({});

  const [require] = await requireAsync(window.require, ['require']);

  expect(typeof window.define.amd).toBe('object');
});
