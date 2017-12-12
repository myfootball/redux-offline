'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _effect = require('../../defaults/effect');

var _effect2 = _interopRequireDefault(_effect);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function fetch(body) {
  return _promise2.default.resolve({
    ok: true,
    headers: { get: jest.fn(function () {
        return 'application/json';
      }) },
    text: jest.fn(function () {
      return _promise2.default.resolve(body);
    })
  });
}

var globalFetch = void 0;

beforeAll(function () {
  globalFetch = global.fetch;
});
afterAll(function () {
  global.fetch = globalFetch;
});

test('effector accept JSON stringified object', function () {
  var body = {
    email: 'email@example.com',
    password: 'p4ssw0rd'
  };

  global.fetch = jest.fn(function (url, options) {
    expect(options.headers['content-type']).toEqual('application/json');
    expect(JSON.parse(options.body)).toEqual(body);

    return fetch('');
  });

  return (0, _effect2.default)({ body: (0, _stringify2.default)(body) }).then(function (body2) {
    expect(body2).toEqual(null);
  });
});

test('effector receive JSON and response objects', function () {
  var body = { id: 1234 };

  global.fetch = jest.fn(function () {
    return fetch((0, _stringify2.default)(body));
  });

  return (0, _effect2.default)({}).then(function (body2) {
    expect(body2).toEqual(body);
  });
});