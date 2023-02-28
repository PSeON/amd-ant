(function (window, document, consoleError) {
  type AnyFunction = (...args: unknown[]) => unknown;
  type FactoryFn = (...args: unknown[]) => void;
  type ErrorFn = (reason: unknown) => void;

  type ModuleDescriptor = {
    id_: string;
    dependencies_: string[];
    factory_: unknown;
    moduleModule_: { id: string; exports: unknown };
    onload_: null[];
    onerror_: null[];
  };

  type InitializationQueue = (string | null | ((success?: unknown, error?: unknown) => void))[];

  function doNothing() {
    // Do nothing
  }

  function createDictionary() {
    return Object.create(null);
  }

  function throwError() {
    throw new Error(moduleLoadingError);
  }

  function isArray(value: unknown): value is unknown[] {
    return value instanceof Array;
  }

  function isFunction(value: unknown): value is AnyFunction {
    return typeof value == 'function';
  }

  function isString(value: unknown): value is string {
    return typeof value == 'string';
  }

  function isSpecialImport(id: string) {
    return defaultSpecialImports.indexOf(id) >= 0;
  }

  const moduleLoadingError = 'Module loading error';

  const specialImportRequire = 'require';
  const specialImportExports = 'exports';
  const specialImportModule = 'module';

  const defaultSpecialImports = [specialImportRequire, specialImportExports, specialImportModule];

  const anonymousModulesQueue: { dependencies_: string[]; factory_: unknown }[] = [];
  const requestedModules: Record<string, boolean> = createDictionary();
  const definedModules: Record<string, ModuleDescriptor> = createDictionary();
  const initializedModules: Record<string, ModuleDescriptor> = createDictionary();
  let initializationQueues: InitializationQueue[] = [];

  function createModuleDescriptor(
    id_: string,
    dependencies_: string[],
    factory_: unknown,
  ): ModuleDescriptor {
    return {
      id_,
      dependencies_,
      factory_,
      moduleModule_: { id: id_, exports: {} },
      onload_: [],
      onerror_: [],
    };
  }

  function resolvePath(base: string, path: string): string {
    const pathSegments = path.split('/');
    if (pathSegments[0] != '.' && pathSegments[0] != '..') {
      return path;
    }
    const rawSegments = !base ? pathSegments : base.split('/').concat(pathSegments);
    const segments = rawSegments.filter((value, index) => (value && value != '.') || !index);
    for (let i = 0; i < segments.length - 1; i++) {
      if (segments[i] && segments[i] != '..' && segments[i + 1] == '..') {
        segments.splice(i, 2);
        i -= i ? 2 : 1;
      }
    }
    return segments.join('/');
  }

  function cancelInitializationQueues(id: string, reason: unknown) {
    return initializationQueues.forEach(initializationQueue => {
      const callback = initializationQueue[initializationQueue.length - 1];
      if (initializationQueue.some(item => item === id)) {
        initializationQueue.length = 0;
        try {
          (callback as (success?: unknown, error?: unknown) => void)(null, reason);
        } catch {
          // Do nothing
        }
      }
    });
  }

  function downloadModule(id: string) {
    let defineObj;

    const el = document.createElement('script');
    el.src = globalRequire.toUrl(id) + '.js';

    requestedModules[id] = true;

    // "onload" and "onerror" takes less space then "addEventListener"
    el.onload = () => {
      if (definedModules[id]) {
        // Module has already defined itself, do nothing
      } else if ((defineObj = anonymousModulesQueue.shift())) {
        internalDefine(id, defineObj.dependencies_, defineObj.factory_);
      } else {
        cancelInitializationQueues(id, new Error(moduleLoadingError));
      }
    };

    // TODO Make sure we are getting a meaninful reason in this case
    el.onerror = e => cancelInitializationQueues(id, e);
    document.head.appendChild(el);
  }

  function downloadModules(ids: string[]) {
    return ids.forEach(id => {
      if (!isSpecialImport(id) && !requestedModules[id]) {
        downloadModule(id);
      }
    });
  }

  function initializeModule(mod: ModuleDescriptor) {
    const parentPath = resolvePath(mod.id_, '..');
    const moduleObj = mod.moduleModule_;

    const localRequire = (id: string | string[], resolve?: FactoryFn, reject?: ErrorFn) => {
      return globalRequire(
        isString(id) ? resolvePath(parentPath, id) : id.map(mod => resolvePath(parentPath, mod)),
        resolve,
        reject,
      );
    };

    const deps = mod.dependencies_.map(dep => {
      if (dep == specialImportRequire) {
        return localRequire;
      } else if (dep == specialImportExports) {
        return moduleObj.exports;
      } else if (dep == specialImportModule) {
        return moduleObj;
      } else {
        return definedModules[dep].moduleModule_.exports;
      }
    });

    const factory = mod.factory_;

    localRequire.toUrl = (url: string) => globalRequire.toUrl(resolvePath(parentPath, url));

    try {
      if (isFunction(factory)) {
        const returnValue = factory(...deps);
        if (returnValue) {
          moduleObj.exports = returnValue;
        }
      } else {
        moduleObj.exports = factory;
      }

      initializedModules[mod.id_] = mod;
    } catch (e) {
      cancelInitializationQueues(mod.id_, e);
    }
  }

  function isCircularDependency(id: string, queue: InitializationQueue) {
    return queue.some((item, index) => item == id && index && queue[index - 1] === null);
  }

  function runInitializationLoop() {
    // "runInitializationLoop" can be called from "define" and "require"
    // and "define" and "require" can be called from a module factory function
    // it leads to a recursion with creates issues, so "setTimeout" is used to avoid this recursion
    return setTimeout(() => {
      initializationQueues.forEach(initializationQueue => {
        for (;;) {
          const id = initializationQueue[0];
          let mod: ModuleDescriptor;
          if (isString(id)) {
            if (isSpecialImport(id) || initializedModules[id]) {
              initializationQueue.shift();
            } else if ((mod = definedModules[id])) {
              if (
                mod.dependencies_.every(
                  dep =>
                    initializedModules[dep] ||
                    isSpecialImport(dep) ||
                    isCircularDependency(dep, initializationQueue),
                )
              ) {
                initializeModule(mod);
                initializationQueue.shift();
              } else {
                initializationQueue.unshift(null);
                initializationQueue.unshift(...mod.dependencies_);
                downloadModules(mod.dependencies_);
              }
            } else {
              // Module is still downloading, need to wait
              return;
            }
          } else if (id === null) {
            initializationQueue.shift();
          } else if (!id) {
            // End of queue
            return;
          } else {
            initializationQueue.shift();
            id(true);
          }
        }
      });
      initializationQueues = initializationQueues.filter(
        initializationQueue => initializationQueue.length,
      );
    });
  }

  function internalDefine(id: string, dependencies: string[], factory: unknown) {
    requestedModules[id] = true;
    definedModules[id] = createModuleDescriptor(
      id,
      dependencies.map(dep =>
        isSpecialImport(dep) ? dep : resolvePath(resolvePath(id, '..'), dep),
      ),
      factory,
    );
    runInitializationLoop();
  }

  function globalRequire(
    id: string | string[],
    resolve: (...exports: unknown[]) => void = doNothing,
    reject: (reason: unknown) => void = consoleError,
  ) {
    if (isString(id)) {
      const moduleObj = initializedModules[id];
      if (id == specialImportRequire) {
        return globalRequire;
      } else if (moduleObj) {
        return moduleObj.moduleModule_.exports;
      } else {
        return throwError();
      }
    }
    if (!isArray(id)) {
      throwError();
    }
    initializationQueues.push(
      (id as InitializationQueue).concat([
        (success, error) => {
          if (success) {
            resolve(...id.map(item => globalRequire(item)));
          } else {
            reject(error);
          }
        },
      ]),
    );
    downloadModules(id);
    runInitializationLoop();
  }

  function globalDefine(id: string, dependencies?: unknown, factory?: unknown) {
    if (!isString(id)) {
      factory = dependencies;
      dependencies = id;
      id = '';
    }
    if (!isArray(dependencies)) {
      factory = dependencies;
      dependencies = defaultSpecialImports;
    }
    if (id) {
      internalDefine(id, dependencies as string[], factory);
    } else {
      anonymousModulesQueue.push({ dependencies_: dependencies as string[], factory_: factory });
    }
  }

  globalRequire.rootPath = '';
  globalRequire.toUrl = (url: string) =>
    globalRequire.rootPath ? resolvePath(globalRequire.rootPath, './' + url) : url;

  globalDefine.amd = {};

  window.define = globalDefine;
  window.require = globalRequire;
})(window as any, document, console.error);
