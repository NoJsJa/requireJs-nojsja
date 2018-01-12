/* ------------------- module D which deps are E and F ------------------- */
Require.define(['moduleE', 'moduleF'], function (e, f) {

  return {
    log: function () {
      e.log();
      f.log();
      console.log('Module D');
    }
  };

}, 'moduleD');
