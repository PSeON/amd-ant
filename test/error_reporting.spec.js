const { installMocks, remotePromise } = require('./utils');

test('"require" with a string throws for not initialized modules', async () => {
  const modules = {
    'a.js'() {
      window.define(['exports'], exports => {
        exports.getValue = () => 'value';
      });
    },
  };

  installMocks({
    modules,
  });

  const act = () => window.require('a');

  expect(act).toThrow('Module loading error');
});

test('"require" without ids throws', async () => {
  installMocks({});

  const act = () => window.require(null, () => {});

  expect(act).toThrow('Module loading error');
});

test('"require" rejects when downloaded modules don\'t define anything', async () => {
  const modules = {
    'a.js'() {
      // Do nothing
    },
  };

  installMocks({
    modules,
  });

  const [promise, resolve, reject] = remotePromise();
  const resolveFn = jest.fn();
  const rejectFn = jest.fn(e => {
    expect(e.message).toBe('Module loading error');
    resolve();
  });
  window.require(['a'], resolveFn, rejectFn);

  await promise;

  expect(resolveFn).toHaveBeenCalledTimes(0);
  expect(rejectFn).toHaveBeenCalledTimes(1);
});

test('"require" rejects when module factory throws', async () => {
  const modules = {
    'a.js'() {
      window.define(() => {
        throw new Error('Initialization error');
      });
    },
  };

  installMocks({
    modules,
  });

  const [promise, resolve, reject] = remotePromise();
  const resolveFn = jest.fn();
  const rejectFn = jest.fn(e => {
    expect(e.message).toBe('Initialization error');
    resolve();
  });
  window.require(['a'], resolveFn, rejectFn);

  await promise;

  expect(resolveFn).toHaveBeenCalledTimes(0);
  expect(rejectFn).toHaveBeenCalledTimes(1);
});

test('"require" rejects on network errors', async () => {
  installMocks({
    onScriptAdd(src, onload, onerror) {
      onerror(new Error('Network error'));
    },
  });

  const [promise, resolve, reject] = remotePromise();
  const resolveFn = jest.fn();
  const rejectFn = jest.fn(e => {
    expect(e.message).toBe('Network error');
    resolve();
  });
  window.require(['a'], resolveFn, rejectFn);

  await promise;

  expect(resolveFn).toHaveBeenCalledTimes(0);
  expect(rejectFn).toHaveBeenCalledTimes(1);
});

test('"require" rejects when module factory throws with parallel calls', async () => {
  const modules = {
    'a.js'() {
      window.define(() => {
        throw new Error('Initialization error');
      });
    },
    'b.js'() {
      window.define(() => ({ value: 'value' }));
    },
  };

  installMocks({
    modules,
  });

  const [promise1, resolve1, reject1] = remotePromise();
  const resolveFn1 = jest.fn();
  const rejectFn1 = jest.fn(e => {
    expect(e.message).toBe('Initialization error');
    resolve1();
  });
  window.require(['a'], resolveFn1, rejectFn1);

  const [promise2, resolve2, reject2] = remotePromise();
  const resolveFn2 = jest.fn(b => {
    expect(b.value).toBe('value');
    resolve2();
  });
  const rejectFn2 = jest.fn();
  window.require(['b'], resolveFn2, rejectFn2);

  await Promise.all([promise1, promise2]);

  expect(resolveFn1).toHaveBeenCalledTimes(0);
  expect(rejectFn1).toHaveBeenCalledTimes(1);

  expect(resolveFn2).toHaveBeenCalledTimes(1);
  expect(rejectFn2).toHaveBeenCalledTimes(0);
});
