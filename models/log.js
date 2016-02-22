'use strict';

var Log = (function() {
  return {
    log: function(app, message) {
      let timestamp = Date.now();
      console.log(`[${timestamp} :: ${app}] ${message}`);
    },

    web: function(message) {
      this.log.bind(this, 'WebApp')(message);
    },

    srv: function(message) {
      this.log.bind(this, 'Server')(message);
    }
  }
})();

module.exports = Log;
