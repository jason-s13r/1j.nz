---
title: "WebSocketRpc.js"
date: 2014-12-18T04:29:14Z
tags: ["gist"]
draft: false
---
[gist link](https://gist.github.com/0ac511e0a3ec0cd5cf4a)


WebSocket RPC


| Attachment | Type | Size |
| - | - | - |
| [WebSocketRpc.js](https://gist.githubusercontent.com/master5o1/0ac511e0a3ec0cd5cf4a/raw/242aff878b0c1736788e89c14ca67fec6a58cbb5/WebSocketRpc.js) | application/javascript | 7.4KiB |
| [index.html](https://gist.githubusercontent.com/master5o1/0ac511e0a3ec0cd5cf4a/raw/c6d7194451487aa18a0163fcac7f420cf377cbc2/index.html) | text/html | 2.4KiB |
***

### [WebSocketRpc.js](https://gist.githubusercontent.com/master5o1/0ac511e0a3ec0cd5cf4a/raw/242aff878b0c1736788e89c14ca67fec6a58cbb5/WebSocketRpc.js) -- application/javascript, 7.4KiB
```javascript
function WebSocketRpc(url, batchOperationsDisabled) {
  'use strict';
  var self = this;
  var socket = null;
  var queue = [];
  var history = {};
  var methods = {};
  var noop = function () {};
  var noopFactory = function () {
    return noop;
  };

  var eventHandlers = {
    error: noop,
    ready: noop,
    close: noop,
    notification: noop,
    message: noop
  };

  var exceptions = {
    ParseError: {
      code: -32700,
      message: 'Parse error'
    },
    MethodNotFound: {
      code: -32601,
      message: 'Method not found'
    }
  };

  init();

  function init() {
    self.call = function () {
      queue.push([].slice.call(arguments));
      return self;
    };
    self.batch = function () {
      if (batchOperationsDisabled) {
        throw new Error('Batch Operations Disabled');
      }
      queue = queue.concat([].slice.call(arguments));
      return self;
    };

    self.connect = connect;
    self.expose = expose;
    self.exceptions = exceptions;
  }

  function connect() {
    socket = new WebSocket(url);
    self.ws = socket;
    socket.onopen = opened;
    socket.onerror = error;
    socket.onmessage = handler;
    socket.onclose = onclose;
    return self;
  }

  function opened(event) {
    eventHandlers.ready.call(self, event);

    if (batchOperationsDisabled) {
      while (queue.length > 0) {
        call.apply(self, queue.shift());
      }
    } else {
      batch.apply(self, queue);
    }

    self.call = call;
    self.batch = batch;
    self.connect = noop;
  }

  function error(event) {
    eventHandlers.error.call(self, event);
  }

  function handler(event) {
    eventHandlers.message.call(self, event);
    var data;
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      console.error(e);
      var request = formatResponse(exceptions.ParseError, null, {
        id: null
      });
      socket.send(JSON.stringify(request));
    }
    if (!data) {
      return;
    }
    if (Object.prototype.toString.call(data) === '[object Array]') {
      new Batched(data, event).handle();
      return;
    }
    new Single(data, event).handle();
  }

  function onclose(event) {
    eventHandlers.close.call(self, event);
  }

  function Batched(responses, event) {
    var _self = this;
    var batchRequest = [];
    var batchNofications = [];
    _self.handle = handle;

    function trySend() {
      var combined = batchRequest.length + batchNofications.length;
      if (combined >= responses.length) {
        socket.send(JSON.stringify(batchRequest));
        return;
      }
    }

    function next(res) {
      return function (error, result) {
        var request = formatResponse(error, result, res);
        batchRequest.push(request);
        trySend();
      };
    }

    function notify(res) {
      return function (error, result) {
        batchNofications.push(res);
      };
    }

    function handle() {
      responses.forEach(function (response) {
        new Single(response, event, next, notify).handle();
      });
      return _self;
    }

    return _self;
  }

  function Single(response, event, _next, _nextNoop) {
    var _self = this;
    _nextNoop = _nextNoop || noopFactory;
    _self.next = next;
    _self.handle = handle;
    _self.method = method;
    _self.notification = notification;
    _self.results = results;

    function next(res) {
      return function (error, result) {
        var request = formatResponse(error, result, res);
        socket.send(JSON.stringify(request));
      };
    }

    function handle() {
      if (response.method !== undefined && response.params !== undefined) {
        return !!method(response, event);
      }
      if (response.id === null) {
        return !!notification(response, event);
      }
      results(response, event);
      return _self;
    }

    function method(response, event) {
      var cb = methods[response.method] || rpcException(exceptions.MethodNotFound);
      var n = _next || next;
      if (response.id === null) {
        n = _nextNoop || noopFactory;
      }
      cb.call(self, response.params, n(response), response, response.id === null);
      return _self;
    }

    function notification(response, event) {
      response.id = response.error === undefined ? response.id : response.error.id;
      response.id = response.id || null;
      if (response.id === null) {
        console.log('notification:', response);
        eventHandlers.notification.call(self, response.error, response.result, response, event);
        return _self;
      }
      handle(response, event);
      return _self;
    }

    function results(response, event) {
      var item = history[response.id] || {};
      item.response = response;
      item.callback.call(self, item.response.error, item.response.result, item.response, item.request, event);
      return _self;
    }
    return _self;
  }

  function formatResponse(error, result, response) {
    var request = {
      jsonrpc: '2.0',
      id: response.id || null
    };
    if ( !! error) {
      request.error = error;
    }
    if ( !! result) {
      request.result = result;
    }
    return request;
  }

  function onErrorCallback(error) {
    return function (params, callback, response, isNotification) {
      callback(error);
      var cb = onError || noop;
      cb.call(self, error);
    };
  }

  function rpcException(error) {
    return function (params, callback, response, isNotification) {
      callback(error);
    };
  }

  function send(id) {
    var request = collateRequest(id);
    socket.send(JSON.stringify(request));
  }

  function collateRequest(id) {
    var ids = id;
    if (typeof id === 'string') {
      return prepareRequest(id);
    }
    return ids.map(prepareRequest);
  }

  function prepareRequest(id) {
    var item = history[id];
    if (typeof item.callback !== 'function') {
      item.request.id = null;
    }
    return item.request;
  }

  function identity(size, v) {
    v = new Array(size || 20).join('.').split('').map(function () {
      return Math.round(Math.random() * 100);
    }).join('');
    return (1 * v).toString(36);
  }

  function createRequest(method, parameters, callback, id) {
    id = id || identity();
    var request = {
      jsonrpc: '2.0',
      id: id || null,
      method: method,
      params: parameters
    };
    history[id] = {
      method: method,
      request: request,
      callback: callback,
      response: null
    };
    return id;
  }

  function call(method, parameters, callback, id) {
    id = createRequest(method, parameters, callback, id);
    send(id);
    return self;
  }

  function batch(requests) {
    if (batchOperationsDisabled) {
      throw new Error('Batch Operations Disabled');
    }
    requests = [].slice.call(arguments);
    if (requests.length === 1) {
      call.apply(self, requests[0]);
      return;
    }
    var ids = requests.map(function (request) {
      return createRequest.apply(self, request);
    });
    send(ids);
    return self;
  }

  function expose(method, fn) {
    if (typeof fn !== 'function') {
      Object.keys(fn).forEach(function (key) {
        methods[method + '.' + key] = fn[key];
      }, methods);
    }
    methods[method] = fn;
    return self;
  }

  function on(eventName, handler) {
    eventHandlers[eventName] = handler;
    return self;
  }

  function off(eventName) {
    eventHandlers[eventName] = noop;
    return self;
  }

  function close() {
    if (socket !== null) {
      socket.close();
    }
  }

  self.close = close;
  self.on = on;
  self.off = off;
  self.ws = socket;

  return self;
}
```
***
### [index.html](https://gist.githubusercontent.com/master5o1/0ac511e0a3ec0cd5cf4a/raw/c6d7194451487aa18a0163fcac7f420cf377cbc2/index.html) -- text/html, 2.4KiB
```html
<html>
  <head>
    <script src="WebSocketRpc.js"></script>
    <script>

    // Setup RPC
    var rpc = new WebSocketRpc('ws://echo.websocket.org'/*, true */); // pass true to disable sending batched calls.
    
    // Want to do stuff on open, error and close.
    rpc.on('ready', function(event){ console.log('socket is ready'); })
       .on('error', function(event){ console.log('oh my an error occurred', event); })
       .on('close', function(event){ console.log('socket is closed'); })
       
    // We'll use this for handling JSON-RPC 2.0 notification result/error messages.
    rpc.on('notification', function(error, results, response, event){
      if (error) {
        console.error('what, an error notification?', error);
        return;
      }
      console.log('oh good, a notification', results);
    })

    // Let's set up a method that the server can call for the client to do.
    rpc.expose('add', function(params, callback) {
      console.log('exposed add:', params);
      var result = params[0] + params[1];
      callback(null, result);
    });

    // Let's set up another one, which we'll use as a notification.
    rpc.expose('notification', function(params, callback){
      console.log('exposed notification:', params);
      callback();
    });

    // Can also set up a namedspaced object of methods.
    rpc.expose('math', {
      add: function(params, callback) {
        callback(null, params[0] + params[1]);
      },
      subtract: function(params, callback) {
        callback(null, params[0] - params[1]);
      },
      multiply: function(params, callback) {
        callback(null, params[0] * params[1]);
      }
    });

    // Call a method on the server.
    rpc.call('add', [5, 10], function(error, result, response, request, event){
      console.log(arguments);
    });

    // Send the notification to the server.
    rpc.call('notification', 'Still Alive');

    // Call a namespaced method.
    rpc.call('math.multiply', [21, 34], function(error, results){
      console.log('math.multiply', results);
    });

    rpc.batch(['math.subtract', [5, 3], function(error, result) {
      console.log('subtract', result);
    }], ['math.divide', [5, 3], function(error, result) {
      if (error) {
        console.error('divide', error);
        return;
      }
      console.log('divide', result);
    }]);

    rpc.connect();

    </script>
  </head>
  <body>
    Look in the JS console.
  </body>
</html>
```

