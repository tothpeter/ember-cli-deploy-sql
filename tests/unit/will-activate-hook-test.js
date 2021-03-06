/*eslint-env node*/
'use strict';

const subject = require('../../index');
const assert = require('../helpers/assert');
const Bluebird = require('bluebird');

describe('DeployPlugin | willActivate hook', function() {
  const mockUi = {
    verbose: true,
    messages: [],
    write: function() {},
    writeLine: function(message) {
      this.messages.push(message);
    }
  };

  it('fetches the activated revision', function() {
    const instance = subject.createDeployPlugin({
      name: 'sql'
    });

    const context = {
      ui: mockUi,
      distDir: 'tests',
      config: {
        sql: {
          client: 'mock',
          deployClient: () => ({
            activeRevisionKey() {
              return Bluebird.resolve('123abc');
            }
          }),
          tableName: 'foo'
        }
      }
    };

    instance.beforeHook(context);
    instance.configure(context);

    return instance.willActivate(context)
      .then((result) => {
        assert.nestedPropertyVal(result, 'revisionData.previousRevisionKey', '123abc');
      });
  });

  it('rejects if an error is thrown while fetching', function() {
    const instance = subject.createDeployPlugin({
      name: 'sql'
    });

    const context = {
      ui: mockUi,
      distDir: 'tests',
      config: {
        sql: {
          client: 'mock',
          deployClient: () => ({
            activeRevisionKey() {
              return Bluebird.reject('some-error');
            }
          }),
          tableName: 'foo'
        }
      }
    };

    instance.beforeHook(context);
    instance.configure(context);

    let promise = instance.willActivate(context);

    return assert.isRejected(promise)
      .then(() => {
        assert.include(mockUi.messages.pop(), 'some-error');
      });
  });
});
