Require.define(['E', 'F'], function (e, f) {

  return {
    log: function () {
      e.log();
      f.log();
    }
  };

}, 'D');
