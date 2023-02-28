const { installMocks, remotePromise, requireAsync } = require('./utils');

test('Nested define and require', async () => {
  const [promise, resolve, reject] = remotePromise();

  const modules = {
    'a.js'() {
      window.define(['require'], require => {
        window.define('b', ['exports'], exports => {
          exports.getValue = () => 'value_b';
        });

        require(['b'], b => {
          expect(b.getValue()).toBe('value_b');
          resolve();
        });
      });
    },
  };

  installMocks({
    modules,
  });

  await requireAsync(window.require, ['a']);
  await promise;
});
