/* ------------------- module A without deps ------------------- */
Require.define([], function () {

  return {
    log: function () {
      console.log('Module A');
    }
  }
}, 'moduleA');
