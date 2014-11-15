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
