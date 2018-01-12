/* -----------------------------------------------------------------------------
  主模块main：
  1. 配置模块路径
  2. 引用模块
----------------------------------------------------------------------------- */

/* ------------------- 配置 ------------------- */
Require.config({
  // baseUrl: '/javascripts/',
  paths: {
    /*   引用测试1配置   */
    'moduleA': './moduleA.js',  // 相对于当前目录
    'moduleB': '/javascripts/moduleB.js',  // 不使用baseUrl
    'moduleC': 'moduleC.js',

    /*   引用测试2配置   */
    'moduleD': {
      url: 'moduleD.js',
      deps: ['moduleE', 'moduleF'],
    },
    'moduleE': 'moduleE.js',
    'moduleF': {
      url: 'moduleF.js',
      deps: ['moduleG'],
    },
    'moduleG': 'moduleG.js',
  },
  shim: {
    /*   引用测试3配置   */
    'moduleH': {
      url: 'moduleH.js',
      exports: 'log',
    },
  }
});

/* ------------------- console wrapper ------------------- */
var Console = {
  log: window.console.log.bind(window),
  error: window.console.error.bind(window),
  index: 1,
  consoleDom: document.querySelector('.console-wrapper > textarea'),
};
Console.consoleDom.value = '';

window.console.log = function (info) {
  Console.consoleDom.style = '';
  Console.log(info);
  Console.consoleDom.value =
    Console.consoleDom.value + '\r\n' + '[' + Console.index + '] ' + info;
  Console.index ++;
};

window.console.error = function (info) {

  console.log(info);
  Console.consoleDom.style.color = "#e9471c";
};

/* ************************* main ************************* */

/* ------------------- require test 1 ------------------- */
Require.require(['moduleA', 'moduleB', 'moduleC'], function (a, b, c) {
  console.log('-------- require test 1 --------');
  a.log();
  b.log();
  c.log();
  // console.trace(a);
});

/* ------------------- require test 2 ------------------- */
Require.require(['moduleD'], function (d) {
  console.log('-------- require test 2 --------');
  d.log();
});

/* ------------------- require test 3 ------------------- */
Require.require(['moduleH'], function (h) {
  console.log('-------- require test 3 --------');
  h.log();
});
