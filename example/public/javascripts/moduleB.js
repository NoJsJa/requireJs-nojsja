/* ------------------- module B without deps ------------------- */
Require.define([], function () {

  return {
    log: function () {
      console.log('Module B');
    }
  }
}, 'moduleB');
