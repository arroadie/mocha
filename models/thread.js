'use strict';

var Thread = function(data, opts) {
  opts = opts || {};

  this.id = 'zzz' + Date.now() + 'xxx';
  this.timestamp = Date.now();

  this.user_id = data.user_id || null;
  this.user_name = data.user_name || null;
  this.message = data.message || '';
  this.parent_id = data.parent_id || null;

  this.type = opts.type || null;
  this.has_children = opts.has_children || false;
};

Thread.prototype.constructor = Thread;

module.exports = Thread;
