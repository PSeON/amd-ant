const { installMocks, requireAsync } = require('./utils');

test('Basic circular', async () => {
  const modules = {
    'funcFour.js'() {
      window.define('funcFour', ['require', 'funcThree'], require => {
        const four = arg => 'FOUR called with ' + arg;

        four.suffix = () => require('funcThree').suffix();

        return four;
      });
    },
    'funcOne.js'() {
      window.define('funcOne', ['require', 'funcTwo'], require => {
        const one = function (name) {
          this.name = name;
        };

        one.prototype.getName = function () {
          const inst = new (require('funcTwo'))('-NESTED');
          return this.name + inst.name;
        };

        return one;
      });
    },
    'funcThree.js'() {
      window.define('funcThree', ['require', 'funcFour'], (require, four) => {
        const three = arg => arg + '-' + require('funcFour').suffix();

        three.suffix = () => 'THREE_SUFFIX';

        return three;
      });
    },
    'funcTwo.js'() {
      window.define('funcTwo', ['require', 'funcOne'], require => {
        const two = function (name) {
          this.name = name;
          this.one = new (require('funcOne'))('ONE');
        };

        two.prototype.oneName = function () {
          return this.one.getName();
        };

        return two;
      });
    },
    'one.js'() {
      window.define('one', ['require', 'exports', 'module', 'two'], (require, exports, module) => {
        exports.size = 'large';
        exports.module = module;
        exports.doSomething = () => require('two');
      });
    },
    'two.js'() {
      window.define('two', ['require', 'one'], (require, one) => ({
        size: 'small',
        color: 'redtwo',
        doSomething: () => one.doSomething(),
        getOneModule: () => one.module,
      }));
    },
  };

  installMocks({
    modules,
  });

  const [require, two, funcTwo, funcThree] = await requireAsync(window.require, [
    'require',
    'two',
    'funcTwo',
    'funcThree',
  ]);

  const args = two.doSomething();
  const twoInst = new funcTwo('TWO');
  const oneMod = two.getOneModule();

  expect(args.size).toBe('small');
  expect(args.color).toBe('redtwo');
  expect(oneMod.id).toBe('one');
  expect(twoInst.name).toBe('TWO');
  expect(twoInst.oneName()).toBe('ONE-NESTED');
  expect(funcThree('THREE')).toBe('THREE-THREE_SUFFIX');
});
