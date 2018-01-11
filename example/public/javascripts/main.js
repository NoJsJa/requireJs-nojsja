/* -----------------------------------------------------------------------------
  主模块main：
  1. 配置模块路径
  2. 引用模块
----------------------------------------------------------------------------- */

/* ------------------- 配置 ------------------- */
Require.config({
  paths: {
    'A': '/javascripts/moduleA.js',
    'B': '/javascripts/moduleB.js',
    'C': '/javascripts/moduleC.js',
    'D': {
      url: '/javascripts/moduleD.js',
      deps: ['E', 'F'],
    },
    'E': '/javascripts/moduleE.js',
    'F': '/javascripts/moduleF.js',
  }
});

/* ------------------- 引用测试1 ------------------- */
Require.require(['A', 'B', 'C'], function (a, b, c) {
  a.log();
  b.log();
  c.log();
  // console.trace(a);
});

/* ------------------- 引用测试2 ------------------- */
Require.require(['D'], function (d) {

  d.log();
});
