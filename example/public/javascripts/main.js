/* -----------------------------------------------------------------------------
  主模块main：
  1. 配置模块路径
  2. 引用模块
----------------------------------------------------------------------------- */

/* ------------------- config ------------------- */
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
    'moduleG': {
      url: 'moduleG.js',
      deps: [],
    },
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
    Console.consoleDom.value + '\r\n' + info;
  Console.index ++;
};

window.console.error = function (info) {

  console.log(info);
  Console.consoleDom.style.color = "#e9471c";
};


/* ************************* main ************************* */

/* ------------------- module require test 1 ------------------- */
Require.require(['moduleA', 'moduleB', 'moduleC'], function (a, b, c) {
  console.log('-------- module require test 1 --------');
  console.log('');
  a.log();
  b.log();
  c.log();
  console.log('');
});

/* ------------------- module require test 2 ------------------- */
Require.require(['moduleD'], function (d) {
  console.log('-------- module require test 2 --------');
  console.log('');
  d.log();
  console.log('');
});

/* ------------------- module require test 3 ------------------- */
Require.require(['moduleH'], function (h) {
  console.log('-------- module require test 3 --------');
  console.log('');
  h.log();
  console.log('');
});

/* ------------------- image require test 4 ------------------- */
Require.require(['image!/favicon.ico'], function (image) {
  console.log('-------- image require test 4 --------');
  console.log('');
  image ? console.log('image load success! look at left-top corner.') : console.log('image load error!');
  image && document.body.appendChild(image);
  console.log('');
});

/* ------------------- css require test 5 ------------------- */
Require.require(['css!/css/test.css'], function (result) {
  console.log('-------- css require test 5 --------');
  console.log('');
  result ? console.log('css load success!') : console.log('image load error!');
  console.log('');
});
