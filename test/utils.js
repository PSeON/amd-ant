const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const remotePromise = () => {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return [promise, resolve, reject];
};

class FakeScriptTag {
  constructor() {
    this.src = '';
    this.onload = null;
    this.onerror = null;
  }

  async _onAppend(hooks) {
    const scriptAddHook = hooks.onScriptAdd;
    const modules = hooks.modules;
    if (scriptAddHook) {
      scriptAddHook(this.src, this.onload, this.onerror);
    } else if (modules) {
      await delay();
      const module = modules[this.src];
      if (module) {
        module();
        await delay();
        if (this.onload) {
          this.onload();
        }
      } else {
        if (this.onerror) {
          this.onerror(new Error(`Module "${this.src}" not found`));
        }
      }
    }
  }
}

exports.delay = delay;
exports.remotePromise = remotePromise;

exports.requireAsync = (requireFn, module) => {
  return new Promise((promiseResolve, promiseReject) => {
    requireFn(module, (...args) => promiseResolve(args), promiseReject);
  });
};

exports.installMocks = hooks => {
  jest.resetModules();
  window = {};
  document = {
    hooks,
    createElement(tagName) {
      if (tagName === 'script') {
        return new FakeScriptTag();
      } else {
        throw new Error('Unsupported tag name');
      }
    },
    head: {
      appendChild(element) {
        if (element && element._onAppend) {
          element._onAppend(hooks);
        }
      },
    },
  };
  require('../amdant.es6');
};
