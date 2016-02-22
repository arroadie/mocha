'use strict';

var Thread = function(data, opts) {
  this.id = 'test';
  this.timestamp = Date.now();

  this.user_id = data.user_id || null;
  this.user_name = data.user_name || null;
  this.message = data.message || '';

  this.parent_id = opts.parent_id || null;
  this.type = opts.type || null;
  this.has_children = opts.has_children || false;
};

Thread.prototype.constructor = Thread;

module.exports = Thread;
