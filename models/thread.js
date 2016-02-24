'use strict';

var Thread = function(data, opts) {
  opts = opts || {};

  //this.id = 'zzz' + Date.now() + 'xxx' + getRandomInt(100, 999);
  this.id = 0;
  this.timestamp = Date.now();
  this.datetime = new Date(this.timestamp).toISOString();

  this.user_id = data.user_id || 1;
  this.user_name = data.user_name || null;
  this.message = data.message || '';
  this.parent_id = parseInt(data.parent_id) || null;

  this.type = opts.type || null;
  this.has_children = opts.has_children || false;
};

Thread.prototype.constructor = Thread;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = Thread;
