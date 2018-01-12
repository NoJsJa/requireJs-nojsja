/* -----------------------------------------------------------------------------
  主模块main：
  1. 配置模块路径
  2. 引用模块
----------------------------------------------------------------------------- */

/* ------------------- 配置 ------------------- */
Require.config({
  baseUrl: '/',
  paths: {
    /*   引用测试1配置   */
    'moduleA': './javascripts/moduleA.js',  // 相对于当前目录
    'moduleB': '/javascripts/moduleB.js',  // 不使用baseUrl
    'moduleC': 'javascripts/moduleC.js',

    /*   引用测试2配置   */
    'moduleD': {
      url: './javascripts/moduleD.js',
      deps: ['moduleE', 'moduleF'],
    },
    'moduleE': 'javascripts/moduleE.js',
    'moduleF': {
      url: 'javascripts/moduleF.js',
      deps: ['moduleG'],
    },
    'moduleG': 'javascripts/moduleG.js',
  }
});

/* ------------------- console wrapper ------------------- */
var Console = {
  log: window.console.log.bind(window),
  error: window.console.error.bind(window),
  index: 1,
  consoleDom: document.querySelector('.console-wrapper > textarea'),
};

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

try {
  /* ------------------- 引用测试1 ------------------- */
  Require.require(['moduleA', 'moduleB', 'moduleC'], function (a, b, c) {
    console.log('-------- require test 1 --------');
    a.log();
    b.log();
    c.log();
    // console.trace(a);
  });

  /* ------------------- 引用测试2 ------------------- */
  Require.require(['moduleD'], function (d) {
    console.log('-------- require test 2 --------');
    d.log();
  });

} catch (e) {
  console.error(e);
}
