'use strict';

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _send = require('../send');

var _send2 = _interopRequireDefault(_send);

var _actions = require('../actions');

var _defaultCommit = require('../defaults/defaultCommit');

var _defaultCommit2 = _interopRequireDefault(_defaultCommit);

var _defaultRollback = require('../defaults/defaultRollback');

var _defaultRollback2 = _interopRequireDefault(_defaultRollback);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DELAY = 1000;
var completedMeta = {
  meta: expect.objectContaining({ completed: expect.any(Boolean) })
};

function setup(partialConfig) {
  var defaultConfig = {
    effect: jest.fn(function () {
      return _promise2.default.resolve();
    }),
    discard: function discard() {
      return false;
    },
    retry: function retry() {
      return DELAY;
    },
    defaultCommit: _defaultCommit2.default,
    defaultRollback: _defaultRollback2.default
  };

  return {
    action: {
      type: 'REQUEST',
      meta: {
        offline: {
          effect: { url: '/api/resource', method: 'get' },
          commit: { type: 'COMMIT' },
          rollback: { type: 'ROLLBACK' }
        }
      }
    },
    config: (0, _extends3.default)({}, defaultConfig, partialConfig),
    dispatch: jest.fn()
  };
}

test('dispatches busy action', function () {
  var _setup = setup(),
      action = _setup.action,
      config = _setup.config,
      dispatch = _setup.dispatch;

  (0, _send2.default)(action, dispatch, config);
  expect(dispatch).toBeCalledWith((0, _actions.busy)(true));
});

test('requests resource using effects reconciler', function () {
  var _setup2 = setup(),
      action = _setup2.action,
      config = _setup2.config,
      dispatch = _setup2.dispatch;

  (0, _send2.default)(action, dispatch, config);
  expect(config.effect).toBeCalledWith(action.meta.offline.effect, action);
});

describe('when request succeeds', function () {
  test('dispatches complete action', function () {
    var effect = function effect() {
      return _promise2.default.resolve();
    };

    var _setup3 = setup({ effect: effect }),
        action = _setup3.action,
        config = _setup3.config,
        dispatch = _setup3.dispatch;

    var promise = (0, _send2.default)(action, dispatch, config);

    var commit = action.meta.offline.commit;

    expect.assertions(2);
    return promise.then(function () {
      expect(dispatch).toBeCalledWith(expect.objectContaining(commit));
      expect(dispatch).toBeCalledWith(expect.objectContaining(completedMeta));
    });
  });
});

describe('when request fails', function () {
  test('dispatches schedule retry action', function () {
    var effect = function effect() {
      return _promise2.default.reject();
    };

    var _setup4 = setup({ effect: effect }),
        action = _setup4.action,
        config = _setup4.config,
        dispatch = _setup4.dispatch;

    var promise = (0, _send2.default)(action, dispatch, config);

    expect.assertions(1);
    return promise.then(function () {
      expect(dispatch).toBeCalledWith((0, _actions.scheduleRetry)(DELAY));
    });
  });

  test('dispatches complete action on discard', function () {
    var effect = function effect() {
      return _promise2.default.reject();
    };
    var discard = function discard() {
      return true;
    };

    var _setup5 = setup({ effect: effect, discard: discard }),
        action = _setup5.action,
        config = _setup5.config,
        dispatch = _setup5.dispatch;

    var promise = (0, _send2.default)(action, dispatch, config);

    var rollback = action.meta.offline.rollback;

    expect.assertions(2);
    return promise.then(function () {
      expect(dispatch).toBeCalledWith(expect.objectContaining(rollback));
      expect(dispatch).toBeCalledWith(expect.objectContaining(completedMeta));
    });
  });

  test('dispatches complete action with promised discard', function () {
    var effect = function effect() {
      return _promise2.default.reject();
    };
    var discard = function discard() {
      return _promise2.default.resolve(true);
    };

    var _setup6 = setup({ effect: effect, discard: discard }),
        action = _setup6.action,
        config = _setup6.config,
        dispatch = _setup6.dispatch;

    var promise = (0, _send2.default)(action, dispatch, config);

    var rollback = action.meta.offline.rollback;

    expect.assertions(2);
    return promise.then(function () {
      expect(dispatch).toBeCalledWith(expect.objectContaining(rollback));
      expect(dispatch).toBeCalledWith(expect.objectContaining(completedMeta));
    });
  });

  test('dispatches complete action when discard throw an exception', function () {
    var effect = function effect() {
      return _promise2.default.reject();
    };
    var discard = function discard() {
      throw new Error();
    };

    var _setup7 = setup({ effect: effect, discard: discard }),
        action = _setup7.action,
        config = _setup7.config,
        dispatch = _setup7.dispatch;

    var promise = (0, _send2.default)(action, dispatch, config);

    var rollback = action.meta.offline.rollback;

    expect.assertions(2);
    return promise.then(function () {
      expect(dispatch).toBeCalledWith(expect.objectContaining(rollback));
      expect(dispatch).toBeCalledWith(expect.objectContaining(completedMeta));
    });
  });
});

describe('when request succeeds and commit is undefined', function () {
  test('dispatches default commit action', function () {
    var effect = function effect() {
      return _promise2.default.resolve();
    };

    var action = {
      type: 'REQUEST',
      meta: {
        offline: {
          effect: { type: 'MOCK' }
        }
      }
    };

    var _setup8 = setup({ effect: effect }),
        config = _setup8.config,
        dispatch = _setup8.dispatch;

    var promise = (0, _send2.default)(action, dispatch, config);

    return promise.then(function () {
      expect(dispatch).toBeCalledWith(expect.objectContaining(_defaultCommit2.default));
      expect(dispatch).toBeCalledWith(expect.objectContaining(completedMeta));
    });
  });
});

describe('when request is to be discarded and rollback is undefined', function () {
  test('dispatches default rollback action', function () {
    var effect = function effect() {
      return _promise2.default.reject();
    };
    var discard = function discard() {
      return true;
    };

    var action = {
      type: 'REQUEST',
      meta: {
        offline: {
          effect: { type: 'MOCK' }
        }
      }
    };

    var _setup9 = setup({ effect: effect, discard: discard }),
        config = _setup9.config,
        dispatch = _setup9.dispatch;

    var promise = (0, _send2.default)(action, dispatch, config);

    return promise.then(function () {
      expect(dispatch).toBeCalledWith(expect.objectContaining(_defaultRollback2.default));
      expect(dispatch).toBeCalledWith(expect.objectContaining(completedMeta));
    });
  });
});