/* ------------------- module E without deps ------------------- */
Require.define([], function () {

  return {
    log: function () {
      console.log('Module E');
    }
  }
}, 'moduleE');
