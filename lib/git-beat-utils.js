'use strict';
var utils = module.exports = {};

utils.zipArray = function (arr) {
  var obj = {};
  for (var i = 0; i < arr.length; i++) {
    obj[arr[i]] = arr[i + 1];
    i++;
  }
  return obj;
};

utils.sortCommits = function (arr, on) {
  on = on || 'committerDate';
  return arr.sort(function (a, b) {
    return (a[on] || null) > (b[on] || null);
  });
};

var trimExp = /^\s+|\s+$/g;
utils.trim = function (str) {
  return (str || '').replace(trimExp, '');
};
