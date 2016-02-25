'use strict';
let http = require('http');

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
      req.on('response', function(response) {
        response.on('data', function(chunk) {
          var msg = chunk.toString();

          console.log(JSON.parse(msg));
          if (response.statusCode === 200) {
            resolve({status: 200, response: JSON.parse(msg)});
          } else {
            msg = msg.replace("\n", " ");
            reject({status: response.statusCode, response: msg});
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
      return request(path, 'GET');
    },
    put: function(path, data) {
      return request(path, 'PUT', data);
    }
  }
})();

module.exports = Http;