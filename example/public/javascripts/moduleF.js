/* ------------------- module F which deps is G ------------------- */
Require.define(['moduleG'], function (g) {

  return {
    log: function () {
      g.log();
      console.log('Module F');
    }
  }
}, 'moduleF');
