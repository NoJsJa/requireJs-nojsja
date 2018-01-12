/* ------------------- module C without deps ------------------- */
Require.define([], function () {

  var log = function () {
    console.log('Module C');
  };

  return {
    log: log
  }
}, 'moduleC');
