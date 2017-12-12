"use strict";

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _redux = require("redux");

var _constants = require("redux-persist/lib/constants");

var _reduxPersistNodeStorage = require("redux-persist-node-storage");

var _reduxDevtoolsInstrument = require("redux-devtools-instrument");

var _reduxDevtoolsInstrument2 = _interopRequireDefault(_reduxDevtoolsInstrument);

var _index = require("../index");

var _config = require("../config");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var storage = new _reduxPersistNodeStorage.AsyncNodeStorage("/tmp/storageDir");
var storageKey = _constants.KEY_PREFIX + "offline";
function noop() {}

beforeEach(function () {
  return storage.removeItem(storageKey, noop);
});

var defaultConfig = (0, _config.applyDefaults)({
  effect: jest.fn(function () {
    return _promise2.default.resolve();
  }),
  persistOptions: { storage: storage }
});

function defaultReducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    offline: {
      busy: false,
      lastTransaction: 0,
      online: true,
      outbox: [],
      receipts: [],
      retryToken: 0,
      retryCount: 0,
      retryScheduled: false,
      netInfo: {
        isConnectionExpensive: null,
        reach: 'none'
      }
    }
  };

  return state;
}

test("offline() creates storeEnhancer", function () {
  var storeEnhancer = (0, _index.offline)(defaultConfig);

  var store = storeEnhancer(_redux.createStore)(defaultReducer);
  expect(store.dispatch).toEqual(expect.any(Function));
  expect(store.getState).toEqual(expect.any(Function));
});

test("createOffline() creates storeEnhancer", function () {
  var _createOffline = (0, _index.createOffline)(defaultConfig),
      middleware = _createOffline.middleware,
      enhanceReducer = _createOffline.enhanceReducer,
      enhanceStore = _createOffline.enhanceStore;

  var reducer = enhanceReducer(defaultReducer);
  var store = (0, _redux.createStore)(reducer, (0, _redux.compose)((0, _redux.applyMiddleware)(middleware), enhanceStore));
  expect(store.dispatch).toEqual(expect.any(Function));
  expect(store.getState).toEqual(expect.any(Function));
});

// see https://github.com/redux-offline/redux-offline/issues/31
test("supports HMR by overriding `replaceReducer()`", function () {
  var store = (0, _index.offline)(defaultConfig)(_redux.createStore)(defaultReducer);
  store.replaceReducer(defaultReducer);
  store.dispatch({ type: "SOME_ACTION" });
  expect(store.getState()).toHaveProperty("offline");
});

// see https://github.com/redux-offline/redux-offline/issues/4
test("restores offline outbox when rehydrates", function () {
  var actions = [{
    type: "SOME_OFFLINE_ACTION",
    meta: { offline: { effect: {} } }
  }];
  storage.setItem(storageKey, (0, _stringify2.default)({ outbox: actions }), noop);

  expect.assertions(1);
  return new _promise2.default(function (resolve) {
    var store = (0, _index.offline)((0, _extends3.default)({}, defaultConfig, {
      persistCallback: function persistCallback() {
        var _store$getState = store.getState(),
            outbox = _store$getState.offline.outbox;

        expect(outbox).toEqual(actions);
        resolve();
      }
    }))(_redux.createStore)(defaultReducer);
  });
});

// see https://github.com/jevakallio/redux-offline/pull/91
test("works with devtools store enhancer", function () {
  var monitorReducer = function monitorReducer(state) {
    return state;
  };
  var store = (0, _redux.createStore)(defaultReducer, (0, _redux.compose)((0, _index.offline)(defaultConfig), (0, _reduxDevtoolsInstrument2.default)(monitorReducer)));

  expect(function () {
    store.dispatch({ type: "SOME_ACTION" });
  }).not.toThrow();
});