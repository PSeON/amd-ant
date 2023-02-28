const { installMocks, remotePromise } = require('./utils');

test('"require" rejects when module factory throws', async () => {
  const [promise, resolve, reject] = remotePromise();

  const resolveFn = jest.fn(() => {
    resolve();
  });

  const modules = {
    'a.js'() {
      window.define(resolveFn);
    },
  };

  installMocks({
    modules,
  });

  window.require(['a']);

  await promise;

  expect(resolveFn).toHaveBeenCalledTimes(1);
});
