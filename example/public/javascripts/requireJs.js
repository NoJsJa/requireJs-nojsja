/* -----------------------------------------------------------------------------
  Require模块说明：
  1.config 配置模块函数
    所有可配置属性：
    1) baseUrl - 配置Require下载js文件的根路径
    2) paths - 配置遵循Require规范的模块声明
        - - { // 完整配置
              module_name: {
                 url: 'http://www.xxx.xxx.js',  // 模块地址
                 deps: ['a', 'b'],  // 该模块的所有依赖模块
              }
            }

        - - { // 简写配置 - 只配置url
              module_name: 'http://www.xxx.xxx.js'
            }


    3) shim - 配置不遵循Require规范的模块声明
        - - { // 完整配置
              module_name_shim: {
                url: 'http://www.xxx.xxx.js',  // 模块地址
                export: exports.name,  // 该模块暴露给全局window的变量名
                deps: ['a', 'b'],  // 该模块的所有依赖模块
              }
            }

        - - { // 简写配置 - 只配置url
              module_name_shim: 'http://www.xxx.xxx.js'
            }

  2.define 自定义模块
    1) 依赖其它模块
    define([deps1, deps2], function(d1, d2){
      ...
      return {
        do1: do1,
        do2: do2,
        do3: do3
      }
    }, module_name);
    2) 无其它依赖模块
    define(function() {
      ...
      return {
        do1: do1,
        do2: do2,
        do3: do3
      }
    }, module_name)

  3.require 引用模块
    require([module1, module2, module3], function(m1, m2, m3) {
      ...
    });

  4.modules模块存储的配置信息
    - - - {
            module_name: {
              url: 'http://www.xxx.xxx.js',  // 远程地址
              deps: [dep1, dep2],  // 依赖
              main: (function(){})(),  // 模块的引用
            }
          }
----------------------------------------------------------------------------- */

/* ------------------- Tree树型数据 ------------------- */
var Tree = function (name) {
  this.name = name;
  this.children = [];
  this.father = null;
};

/* 添加子节点 */
Tree.prototype.add = function (tree) {
  if ( !(tree instanceof Tree) ) {
    throw(new Error('the param of func Tree.add must be an instance of Tree'));
  }
  tree.setFather(this);
  this.add(tree);
};

/* 设置节点名 */
Tree.prototype.setFather = function (father) {
  if ( !(father instanceof Tree) ) {
    throw(new Error('the param of func Tree.setFather must be an instance of Tree'));
  }
  this.father = father;
};

/* 删除子节点 */
Tree.prototype.delete = function (tree) {
  if ( !(tree instanceof Tree) ) {
    throw(new Error('the param of func Tree.delete must be an instance of Tree'));
  }
  this.children.map(function (child, i) {
    if (child === tree) {
      this.children.splice(i, 1);
      tree.setFather(null);
    }
  })

};

/* 清空子节点 */
Tree.prototype.wipe = function () {
  this.children.map(function (child) {
    child.setFather(null);
  });
  this.children = [];
};


/* ***************** 用于解决页面依赖混乱和异步加载js ******************* */
var Require = (function () {

  /*   Require配置文件   */
  var R_config = {
    baseUrl: '/',  // 默认根目录
    paths: { },
    shim: { },
    configable: ['baseUrl', 'paths', 'shim'],  // 可配置属性
  };

  /*   自动更新的模块信息   */
  var R_modules = {};

  /* ------------------- 工具函数 ------------------- */
  var Utils = {

    /*   发送请求   */
    request: function (method, url, data, callback) {

      var objXMLHttp = this.getXMLHttpRequest();
      if (!objXMLHttp) return;

      objXMLHttp.open(method, url, true);
      method = method.toUpperCase();
      if(method == ("POST")){
          objXMLHttp.setRequestHeader('Content-type', 'application/json; charset=utf-8');
          objXMLHttp.send(data);

      }
      if(method == ("GET")){
          objXMLHttp.send(null);
      }

      //设置状态改变的回调函数
      objXMLHttp.onreadystatechange = function () {
          if(objXMLHttp.readyState == 4 &&
              (objXMLHttp.status == 200 || objXMLHttp.status == 304)){
              callback.call(null, objXMLHttp.responseText);
          }
      };
    },

    /*   创建ajax对象   */
    getXMLHttpRequest: function () {
      var that = this;
      // 惰性载入获取XHR对象
      this.getXMLHttpRequest = function() {

        if (typeof XMLHttpRequest != "undefined") {
          that.getXMLHttpRequest = function () {
            return new XMLHttpRequest();
          };

        } else if (typeof ActiveXObject !== "undefined") {

          that.getXMLHttpRequest = function () {
            if (typeof arguments.callee.activeXString != "string") {
              var versions = [
                "MSXML2.XMLHttp.6.0", "MSXML2.XMLHttp.3.0",
                "MSXML2.XMLHttp"
              ], i, len;

              for (i = 0, len = versions.length; i < len; i++) {
                try {
                  new ActiveXObject(versions[i]);
                  arguments.callee.activeXString = versions[i];
                  break;
                } catch (e) {

                } finally {

                }
              }
            }

            return new ActiveXObject(arguments.callee.activeXString);
          };

        } else {
          that.getXMLHttpRequest = function () {
            console.error("No XML object avaliable");
            return null;
          };
        }
      };
    }

  };

  /* ------------------- 请求和解析js文件 ------------------- */

  /**
   * [evalRequest 采用递归来解决下载依赖 - 依赖可能还有依赖的情况可以出现 - 核心算法]
   * @param  {Array}   deps [所有依赖模块]
   * @param  {Function} callback  [回调函数]
   */
  var evalRequest = function (pathArray, callback) {
    var requestFlag = {};
    var _name;

    /*   js代码编译   */
    var jsParser = function (jstring, isShim, name) {
      if (isShim) {
        eval(
          "Require.define(" + R_config.shim[name].deps +", function() {" +
            jstring +
            "console.log('pppp')" +
            "return {" +
              R_config.shim[name].exports + ":" +
              R_config.shim[name].exports +
            "};" +

          "}, "+ name + ");"
        );
      }else {
        eval(jstring);
      }
    };

    /*   检查是否下载了所有依赖   */
    var checkDeps = function (rFlag) {
      console.log('check:', rFlag);
      if (Object.keys(rFlag).length == pathArray.length) {
        callback();
      }
    };

    checkDeps(requestFlag);

    /*   下载所有依赖   */
    pathArray.map(function (path) {

      // 满足AMD规范 //
      if (R_config.paths[path]) {
        _name = path;
        path = (typeof R_config.paths[path]) == 'string' ?
                {url: R_config.paths[path], deps: []} : R_config.paths[path];
        path.name = _name;

        // 如果模块已经被下载
        if (R_modules[path.name]) {
          // 记录请求
          requestFlag[path.name] = R_modules[path.name].main;
          checkDeps(requestFlag);
        }else {
          evalRequest(path.deps, function (rspData) {

            Utils.request('get', path.url, null, function (rspData) {

              /* ------------------- 大错误！这个paser是异步的 ------------------- */
              /* -----------------------------------------------------------------------------
                解决办法：
                因为每个模块在定义之前都已经config了，所以依赖关系实现已经明确，在evalRequest方法
                里不应该采用递归的方法来解决依赖，因为paserJs方法本身解析出来的js代码可能也是异步的。
                所以只需要在evalRequest里分析依赖构建依赖树(dependsAnalysis)，然后根据树来挨个下载依赖，
                所有依赖构建成功后再以回调函数的方式来使主程序继续运行。
              ----------------------------------------------------------------------------- */
              jsParser(rspData, false);
              // 记录请求
              requestFlag[path.name] = R_modules[path.name];
              checkDeps(requestFlag);
            });
          });
        }
      }

      // 需要包装成AMD的脚本 //
      if (R_config.shim[path]) {
        _name = path;
        path = (typeof R_config.shim[path]) == 'string' ?
                {url: path, deps: []} : R_config.shim[path];
        path.name = _name;

        // 如果模块已经被下载
        if (R_modules[path.name]) {
          // 记录请求
          requestFlag[path.name] = R_modules[path.name].main;
          checkDeps(requestFlag);
        }else {

          evalRequest(path.deps, function () {

            Utils.request('get', path.url, null, function (rspData2) {

              jsParser(rspData, true, path.name);
              // 记录请求
              requestFlag[path.name] = R_modules[path.name];
              checkDeps(requestFlag);
            });
          });
        }
      }

    });

  };

  /* ------------------- 模块依赖分析 构建模块依赖树 ------------------- */
  var dependsAnalysis = (function () {
    // 各个依赖又分为符合规范的自定义模块和不符合规范的第三方模块
    // 自定义模块可能自身还有依赖
    // 第三方模块没有模块, 例如jQuery

    /*   判断是否规范   */
    var isShim = function (d) {
      if (R_config.paths[d])
        return false;
      return true;
    };

    /*   判断是否有其它依赖   */
    var hasDepends = function (d) {
      if (typeof R_config.paths[d] == 'string')
        return false;
      if (R_config.paths[d] && R_config.paths[d].deps.length > 0)
        return true;
      return false;
    };

    /* 改变树 */
    var setTree = function (name, nodes) {

    };

    /* 根据依赖情况设置属性 */
    var setDepends = function (name, deps, dependsTree) {
      if (!isShim(depend)) {
        dependsTree.add(new Tree(depend));
      }else {
        if (!hasDepends(depend)) {
          dependsTree.add(new Tree(depend));
        }else {
          // 存在依赖的情况
          setDepends(depend, R_config.paths[depend].deps, dependsTree);
        }
      }

    };


    return function (depends) {
      var dependsTree = new Tree('dependsTree');
      // 没有依赖的模块优先放到第一层树
      // 有依赖的模块根据依赖情况放到各个层级
      depends.map(function (depend) {
        s
      });

    };
  })();

  /* ------------------- 定义模块 ------------------- */

  /**
   * [define 定义模块]
   * @param  { Array }    deps [模块依赖]
   * @param  { String }   name [模块名]
   * @param  { Function } done [包裹作用域的回调函数]
   * @param  { String }   name [模块名]
   */
  var define = function (deps, done, name) {
    console.log(deps, done, name);
    var _deps = [], _done, _name, _configType;

    if (arguments.length < 2) {
      throw (new Error('params count in func "define" is incorrect!'));
    }

    /*   判断是否符合标准   */
    if (R_config.paths[name]) {
      _configType = 'paths';
    }else if (R_config.shim[name]) {
      _configType = 'shim';
    }else {
      throw new Error('module: ' + name + 'should be configure before define it!');
    }

    /*   判断是否有依赖模块   */
    if (arguments.length == 2) {
      // 直接把模块记录到配置文件
      _done = deps, _name = done;
      R_modules[name] = {
        url: R_config[_configType][_name].url || R_config[_configType][_name].url,
        deps: [],
        main: (_done)()
      };
    }else {
      // 递归解决依赖再记录
      evalRequest(deps, function () {
        R_modules[name] = {
          url: R_config[_configType][name].url || R_config[_configType][name],
          deps: deps,
          main: (done)()
        };
      });
    }
  };

  /* ------------------- 配置 ------------------- */

  /**
   * [config 配置一个模块的属性]
   * @param  { Object } object [配置对象]
   */
  var config = function (object) {
    if (!object || typeof object !== 'object')
      throw(new Error('params must be an object in func config'));

    Object.keys(object).map(function (key) {
      if (!object[key] || R_config.configable.indexOf(key) < 0) return;
      Object.keys(object[key]).map(function (ikey) {
        R_config[key][ikey] = object[key][ikey];
      });
    });
    console.log('config: ', R_config);
  };

  /* ------------------- 引入模块 ------------------- */

  /**
   * [require 引用一个模块]
   * @param  { Array }    deps     [当前模块的所有依赖]
   * @param  { Function } callback [包裹作用域的回调函数]
   */
  var require = function (deps, callback) {
    /*   引用依赖模块   */
    var getDeps = function (dp) {
      return dp.map( (function (d) {
        return R_modules[d].main;
      }) );
    };

    evalRequest(deps, function () {
      callback.applay(null, getDeps(deps) );
    });
  };


  /* ------------------- 返回调用接口 ------------------- */
  return {
    define: define,
    config: config,
    require: require
  };

})();
