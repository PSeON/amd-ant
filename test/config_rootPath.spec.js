const { installMocks, requireAsync } = require('./utils');

test('Config: rootPath', async () => {
  const modules = {
    '/static/sub/a.js'() {
      window.define(['require'], require => {
        expect(require.toUrl('test')).toBe('/static/test');
        expect(require.toUrl('./test')).toBe('/static/sub/test');

        return { name: 'a' };
      });
    },
  };

  installMocks({
    modules,
  });

  window.require.rootPath = '/static';

  expect(window.require.toUrl('test')).toBe('/static/test');
  expect(window.require.toUrl('./test')).toBe('/static/test');

  const [a] = await requireAsync(window.require, ['sub/a']);
  expect(a.name).toBe('a');
});
