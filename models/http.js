'use strict';
let http = require('http');
let Log = require('./log');

const hostname = 'geekon32.snc1';
const port = 8080;

var Http = (function(){
  var request = function(path, method, data) {
    data = data ? JSON.stringify(data) : {};

    var options = {
      hostname: hostname,
      port: port,
      method: method,
      path: path,
      headers: {
        'Content-Type': 'application/json',
      }
    }
    if (method === 'DELETE') {
      options.headers['Content-Length'] = 0;
    }

    var promise = new Promise(function(resolve, reject) {

      var req = http.request(options);
      var msg = '';
      req.on('response', function(response) {
        response.on('data', function(chunk) {
          msg += chunk;
        });

        response.on('end', function() {
          try {
            msg = JSON.parse(msg);
          } catch(e) {
            msg = msg.replace("\n", " ");
          }
          if (response.statusCode === 200) {
            resolve(msg);
          } else {
            reject(msg);
          }
        });
      });

      if (data.length > 0) req.write(data);
      req.end();
    });

    return promise;
  };

  return {
    get: function(path) {
      Log.srv(`GET ${path}`);
      return request(path, 'GET');
    },
    put: function(path, data) {
      Log.srv(`PUT ${path}`);
      return request(path, 'PUT', data);
    },
    delete: function(path) {
      Log.srv(`DELETE ${path}`);
      return request(path, 'DELETE');
    }
  }
})();

module.exports = Http;
