'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _middleware = require('../middleware');

var _actions = require('../actions');

var _constants = require('../constants');

var _send = require('../send');

var _send2 = _interopRequireDefault(_send);

var _offlineStateLens = require('../defaults/offlineStateLens');

var _offlineStateLens2 = _interopRequireDefault(_offlineStateLens);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var offlineAction = {
  type: 'OFFLINE_ACTION_REQUEST',
  meta: {
    offline: {
      effect: { url: '/api/endpoint', method: 'POST' },
      commit: { type: 'OFFLINE_ACTION_COMMIT' },
      rollback: { type: 'OFFLINE_ACTION_ROLLBACK' }
    }
  }
};

var defaultOfflineState = {
  busy: false,
  lastTransaction: 0,
  online: true,
  outbox: [offlineAction],
  receipts: [],
  retryToken: 0,
  retryCount: 0,
  retryScheduled: false,
  netInfo: {
    isConnectionExpensive: null,
    reach: 'NONE'
  }
};

function setup() {
  var offlineState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var state = {
    offline: (0, _extends3.default)({}, defaultOfflineState, offlineState)
  };
  return {
    config: {
      rehydrate: false,
      persist: null,
      detectNetwork: null,
      batch: jest.fn(function (outbox) {
        return outbox.slice(0, 1);
      }),
      effect: jest.fn(),
      retry: jest.fn(),
      discard: jest.fn(),
      offlineStateLens: _offlineStateLens2.default
    },
    store: {
      getState: jest.fn(function () {
        return state;
      }),
      dispatch: jest.fn()
    },
    next: jest.fn(function (action) {
      return { actions: [action] };
    }),
    action: { type: 'NOT_OFFLINE_ACTION' }
  };
}

// NOTE: there is not currently an action creator for this
function offlineSend() {
  return { type: _constants.OFFLINE_SEND };
}

jest.mock('../send', function () {
  return jest.fn(function () {
    return _promise2.default.resolve();
  });
});
beforeEach(_send2.default.mockClear);

test('creates middleware', function () {
  var _setup = setup(),
      config = _setup.config,
      store = _setup.store,
      next = _setup.next,
      action = _setup.action;

  var middleware = (0, _middleware.createOfflineMiddleware)(config);

  var result = middleware(store)(next)(action);
  expect(next).toBeCalled();
  expect(result).toEqual(next(action));
});

describe('on any action', function () {
  it('processes outbox when idle', function () {
    var _setup2 = setup(),
        config = _setup2.config,
        store = _setup2.store,
        next = _setup2.next,
        action = _setup2.action;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(action);
    expect(_send2.default).toBeCalled();
  });

  it('does not process outbox when busy', function () {
    var _setup3 = setup({ busy: true }),
        config = _setup3.config,
        store = _setup3.store,
        next = _setup3.next,
        action = _setup3.action;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(action);
    expect(_send2.default).not.toBeCalled();
  });

  it('does not process outbox when retry scheduled', function () {
    var _setup4 = setup({ retryScheduled: true }),
        config = _setup4.config,
        store = _setup4.store,
        next = _setup4.next,
        action = _setup4.action;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(action);
    expect(_send2.default).not.toBeCalled();
  });

  it('does not process outbox when offline', function () {
    var _setup5 = setup({ online: false }),
        config = _setup5.config,
        store = _setup5.store,
        next = _setup5.next,
        action = _setup5.action;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(action);
    expect(_send2.default).not.toBeCalled();
  });
});

// TODO: test for double dispatch
describe('on OFFLINE_SEND', function () {
  it('processes outbox when idle', function () {
    var _setup6 = setup(),
        config = _setup6.config,
        store = _setup6.store,
        next = _setup6.next;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(offlineSend());
    expect(_send2.default).toBeCalled();
  });

  it('does not process outbox when busy', function () {
    var _setup7 = setup({ busy: true }),
        config = _setup7.config,
        store = _setup7.store,
        next = _setup7.next;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(offlineSend());
    expect(_send2.default).not.toBeCalled();
  });

  it('processes outbox when retry scheduled', function () {
    var _setup8 = setup({ retryScheduled: true }),
        config = _setup8.config,
        store = _setup8.store,
        next = _setup8.next;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(offlineSend());
    expect(_send2.default).toBeCalled();
  });

  it('processes outbox when offline', function () {
    var _setup9 = setup({ online: false }),
        config = _setup9.config,
        store = _setup9.store,
        next = _setup9.next;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(offlineSend());
    expect(_send2.default).toBeCalled();
  });
});

// FIXME: completeRetry is supposed to be called with an action
// TODO: wrapping `setTimeout()` in a promise in `after()` is pointless
describe('on OFFLINE_SCHEDULE_RETRY', function () {
  jest.useFakeTimers();
  var delay = 15000;

  test('dispatches COMPLETE_RETRY after delay', function () {
    var _setup10 = setup(),
        config = _setup10.config,
        store = _setup10.store,
        next = _setup10.next;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)((0, _actions.scheduleRetry)(delay));
    jest.runTimersToTime(delay);

    expect.assertions(1);
    var nextAction = store.getState().offline.outbox[0];
    return _promise2.default.resolve().then(function () {
      return expect(store.dispatch).toBeCalledWith((0, _actions.completeRetry)(nextAction));
    });
  });
});