'use strict';
let http = require('http');
let Log = require('./log');

const hostname = 'geekon32.snc1';
const port = 8080;

var Http = (function(){
  var request = function(path, method, data) {
    var options = {
      hostname: hostname,
      port: port,
      method: method,
      path: path,
      headers: {
        'Content-Type': 'application/json'
      }
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

      if (data) {
        req.write(JSON.stringify(data));
      }
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
    }
  }
})();

module.exports = Http;
