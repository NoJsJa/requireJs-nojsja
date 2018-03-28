/* -----------------------------------------------------------------------------
  1.错误记录：
      第一次编写时忘记了jsParser里面的代码也可能是异步的，当时采用了递归的方法来写evalRequest。
    解决办法：
      因为每个模块在定义之前都已经config了，所以依赖关系实现已经明确，在evalRequest方法
      里不应该采用递归的方法来解决依赖，因为jsPaser方法本身解析出来的js代码可能也是异步的，
      所以只需要在evalRequest方法里预先分析依赖 构建依赖树(dependsAnalysis)，然后异步下载
      所有依赖，依赖下载完成后再按照依赖分析树的顺序解析js即可，此时jsParser内部解析的代码可以
      保证都是同步的代码。
----------------------------------------------------------------------------- */


/* ***************** 用于解决页面依赖混乱和异步加载js ******************* */
var Require = (function () {

  /* ------------------- Require配置文件 ------------------- */
  var R_config = {
    baseUrl: null,  // 默认根目录
    paths: { },
    shim: { },
    configable: ['baseUrl', 'paths', 'shim'],  // 可配置属性
  };

  /* ------------------- 模块信息配置文件 ------------------- */
  var R_modules = {
     // module_name: {
     //   url: '/xxx/xx.js',
     //   main: {},
     // }
  };

  /* ------------------- Tree树型数据 ------------------- */
  var Tree = function (name) {
    var that = this;
    this.name = name;  // 节点名
    this.children = [];  // 所有子节点
    this.father = null;  // 父节点
    this.data = null;  // 节点携带的数据

    /* 添加子节点 */
    this.add = function (tree) {
      if ( !(tree instanceof Tree) ) {
        throw(new Error('the param of func Tree.add must be an instance of Tree'));
        return;
      }
      tree.setFather(this);
      that.children.push(tree);
    };

    /* 设置节点名 */
    this.setFather = function (father) {
      if ( !(father instanceof Tree) ) {
        throw(new Error('the param of func Tree.setFather must be an instance of Tree'));
        return;
      }
      that.father = father;
    };

    /* 删除子节点 */
    this.delete = function (tree) {
      if ( !(tree instanceof Tree) ) {
        throw(new Error('the param of func Tree.delete must be an instance of Tree'));
        return;
      }
      that.children.map(function (child, i) {
        if (child === tree) {
          that.children.splice(i, 1);
          tree.setFather(null);
        }
      })

    };

    /* 清空子节点 */
    this.wipe = function () {
      that.children.map(function (child) {
        child.setFather(null);
      });
      that.children = [];
    };

    /* 保存数据 */
    this.setData = function (data) {
      that.data = data;
    };

    /* 判断是否有子节点 */
    this.hasChild = function () {
      if (that.children && that.children.length) return true;
      return false;
    }
  };

  /* ------------------- 工具函数 ------------------- */
  var Utils = {

    /*   发送请求   */
    request: function (method, url, data, callback, header, responseType) {

      var objXMLHttp = this.getXMLHttpRequest();
      var timer;
      if (!objXMLHttp) return;

      objXMLHttp.open(method, url, true);
      method = method.toUpperCase();

      // 设置请求头
      header && Object.keys(header).forEach(function (key) {
        objXMLHttp.setRequestHeader(key, header[key]);
      });

      // 设置响应值类型
      responseType && (objXMLHttp.responseType = responseType);

      if(method == "POST"){
          objXMLHttp.setRequestHeader('Content-type', 'application/json; charset=utf-8');
          objXMLHttp.send(data);
      }else {
        objXMLHttp.send(null);
      }

      // 5秒延时
      timer = setTimeout(function () { callback(null);}, 10000);

      //设置状态改变的回调函数
      objXMLHttp.onreadystatechange = function () {
          if(objXMLHttp.readyState == 4 &&
              (objXMLHttp.status == 200 || objXMLHttp.status == 304)){
              clearTimeout(timer);
              callback.call(null, objXMLHttp.responseText);
          }
      };
    },

    /*   创建ajax对象   */
    getXMLHttpRequest: function () {
      var that = this;
      // 惰性载入获取XHR对象
      if (typeof XMLHttpRequest != "undefined") {
        that.getXMLHttpRequest = function () {
          return new XMLHttpRequest();
        };
        return that.getXMLHttpRequest();

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
              } catch (e) { }
            }
          }
          return new ActiveXObject(arguments.callee.activeXString);
        };
        return that.getXMLHttpRequest();

      } else {
        throw(new Error('No XML object avaliable'));
      }
    }
  };

  /* ------------------- 请求和解析js文件 ------------------- */

  /**
   * [evalRequest 分析依赖 => 同时异步下载所有依赖 => 按顺序解析依赖 => 回调函数 - 核心算法]
   * @param  { Array }    deps [所有依赖模块]
   * @param  { Function } callback  [回调函数]
   * @param  { String }   name  [模块名]
   */
  var evalRequest = function (pathArray, callback, name) {
    // 指示插件和依赖是否下载完毕
    var requestFlag = {},
        pluginFlag = {};
    // 筛选插件
    var pluginsArray = pluginsAnalysis(pathArray);
    // 排好顺序的依赖数组
    var dependsArray = dependsAnalysis(pathArray, name);

    /*   js代码转译   */
    var jsParser = function (jstring, isShim, name) {
      var htm = '',
          $script = document.createElement('script');

      $script.setAttribute('type', 'text/javascript');

      if (typeof jstring === 'string') {
        if (isShim) {
          htm =
            " Require.define(" + JSON.stringify(R_config.shim[name].deps) +", function() { " +
              jstring +
              " return { " +
                R_config.shim[name].exports + ":" + R_config.shim[name].exports +
              " }; " +

            " }, '"+ name + "' ); ";
        }else {
          htm = jstring;
        }

        $script.innerHTML = htm;
        document.head.appendChild($script);

      }
    };

    /*   检查是否下载了所有依赖   */
    var checkDeps = function (rFlag, pFlag) {
      // 所有依赖处理完成
      if (Object.keys(rFlag).length !== dependsArray.length ||
          Object.keys(pFlag).length !== pluginsArray.length) {
          return;
      }

      dependsArray.map(function (key, i) {
        // 这个方法是同步的因为所有依赖是按依赖的特定顺序解析的
        jsParser(rFlag[key].main, rFlag[key].isShim, key);
      });

      // 所有插件处理完成
      Object.keys(pFlag).forEach(function (pf, i) {
        pluginsArray[i] = pFlag[pf];
      });

      callback(pluginsArray);
    };

    // 第一次检查依赖
    checkDeps(requestFlag, pluginFlag);

    // 下载所有依赖
    dependsArray.map(function (path) {
      var _name;
      // 满足AMD规范 //
      if (R_config.paths[path]) {
        _name = path;
        path = (typeof R_config.paths[path]) == 'string' ?
                {url: R_config.paths[path], deps: []} : R_config.paths[path];
        path.name = _name;

        // 如果模块已经被下载
        if (R_modules[path.name]) {
          // 记录请求
          requestFlag[path.name] = {
            main: R_modules[path.name].main,
            isShim: false,
          };
          checkDeps(requestFlag, pluginFlag);
        }else {
          Utils.request('get', path.url, null, function (rspData) {
            // 记录请求
            requestFlag[path.name] = {
              main: rspData,
              isShim: false,
            };
            // 检查是否下载完成
            checkDeps(requestFlag, pluginFlag);
          });
        }
      }

      // 需要包装成AMD的脚本 //
      else if (R_config.shim[path]) {
        _name = path;
        path = (typeof R_config.shim[path]) == 'string' ?
                {url: R_config.shim[path], deps: []} : R_config.shim[path];
        path.name = _name;

        // 如果模块已经被下载
        if (R_modules[path.name]) {
          // 记录请求
          requestFlag[path.name] = {
            main: R_modules[path.name].main,
            isShim: true,
          };
          checkDeps(requestFlag, pluginFlag);
        }else {

          Utils.request('get', path.url, null, function (rspData) {
            // 记录请求
            requestFlag[path.name] = {
              main: rspData,
              isShim: true,
            };
            checkDeps(requestFlag, pluginFlag);
          });
        }

      } else {
        throw(new Error('eval deps error!'));
      }

    });

    // 下载所有插件并处理指定url的文件
    pluginsArray.map(function (pluginStr, i) {

      var plugin = pluginStr.split('!')[0];
      var tUrl = pluginStr.split('!')[1], oUrl;
      // 占位数据
      pluginFlag[plugin] = tUrl;

      // 内置插件
      if (__RequirePlugins__.__pluginMap[plugin]) {
        oUrl = R_config.baseUrl + '/' + __RequirePlugins__.__pluginMap[plugin];
        oUrl = oUrl.replace('//', '/');
        // 插件已经加载
        if (__RequirePlugins__[plugin]) {
          __RequirePlugins__[plugin](tUrl, function (pData) {
           pluginFlag[plugin] =  pData;
           checkDeps(requestFlag, pluginFlag);
         });
        // 未加载则先加载插件
        }else {
          Utils.request('POST', oUrl, null, function (rspData) {
            if (rspData) {
              // 解析插件
              eval(rspData);
              // 使用插件处理指定url的数据
              __RequirePlugins__[plugin] && __RequirePlugins__[plugin](tUrl, function (pData) {
                pluginFlag[plugin] = pData;
                checkDeps(requestFlag, pluginFlag);
              });
            }else {
              checkDeps(requestFlag, pluginFlag);
            }
          });
        }

      // 自定义插件
      }else {
        oUrl = R_config.baseUrl + '/' + oUrl;
        oUrl = oUrl.replace('//', '/');
        // 获取插件名
        plugin = plugin.split('/').pop().split('.').shift();
        Utils.request('POST', oUrl, null, function (rspData) {
          if (rspData) {
            // 解析插件
            eval(rspData);
            // 使用插件处理指定url的数据
            __RequirePlugins__[plugin] ?
              __RequirePlugins__[plugin](tUrl, function (pData) {
                pluginFlag[plugin] =  pData;
                checkDeps(requestFlag, pluginFlag);
              }) :
              checkDeps(requestFlag, pluginFlag);
          }else {
            checkDeps(requestFlag, pluginFlag);
          }
        });
      }

    });

  };

  /* ------------------- 模块插件筛选 ------------------- */
  var pluginsAnalysis = function (depends) {
    if (!depends || !depends.length) return [];

    var pluginsArray = [];

    for (var i = 0; i < depends.length; i++) {
      if (depends[i].indexOf('!') !== -1) {
        pluginsArray.push(depends[i]);
        depends.splice(i, 1);
        i--;
      }
    }

    return pluginsArray;
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
      if (R_config.shim[d])
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

    /* 根据依赖情况设置属性 */
    var setDepends = function (deps, dependsTree) {
      if (!deps || !deps.length) return;

      deps.map(function (depend) {
        var _tree =  new Tree(depend);

        if (isShim(depend)) {
          dependsTree.add(_tree);
        }else {
          if (!hasDepends(depend)) {
            dependsTree.add(_tree);
          }else {
            // 存储引用、递归依赖
            dependsTree.add(_tree);
            setDepends(R_config.paths[depend].deps, _tree);
          }
        }
      });
    };

    /* 按照深度优先遍历依赖树 */
    var sortDepends = function (dependsArray, dependsTree) {
      if (dependsTree.hasChild()) {
        dependsTree.children.map(function (child) {
          dependsArray.unshift(child.name);
          sortDepends(dependsArray, child);
        });
      }
    };

    /* array 去重保留第一个重复项 */
    var arrayFilter = function (array) {
      var flag = {};
      for (var i = 0; i < array.length; i++) {
        if ( flag[ array[i] ] ) {
          array.splice(i, 1);
          i--;
        }else {
          flag[ array[i] ] = true;
        }
      }

      return array;
    };

    return function (depends, name) {
      var dependsTree = new Tree('dependsTree');
      var dependsArray = [];
      var dependsFlag = {};  // 解决循环依赖

      // 构建依赖分析树
      setDepends(depends, dependsTree);
      // 确定依赖后深度优先遍历依赖树按照顺序把所有依赖放进数组，按照顺序解析所有代码
      sortDepends(dependsArray, dependsTree);
      // 数组依赖去重
      arrayFilter(dependsArray);

      return dependsArray;
    };

  })();

  /* ------------------- 模块定义函数 ------------------- */

  /**
   * [define 定义模块]
   * @param  { Array }    deps [模块依赖]
   * @param  { Function } done [包裹作用域的回调函数]
   * @param  { String }   name [模块名]
   */
  var define = function (deps, done, name) {

    var _configType;

    // 获取依赖
    var getDeps = function (dp) {
      return dp.map( (function (d) {
        return R_modules[d] ? R_modules[d].main : null;
      }) );
    };

    if (arguments.length < 2) {
      throw (new Error('params count in func "define" is incorrect!'));
      return;
    }

    if (arguments.length == 2) {
      name = done;
      done = deps;
      deps = [];
    }

    /*   判断是否符合标准   */
    if (R_config.paths[name]) {
      _configType = 'paths';
    }else if (R_config.shim[name]) {
      _configType = 'shim';
    }else {
      throw new Error('module: ' + name + ' should be configure before define it!');
      return;
    }

    /*   检查模块是否已经创建   */
    if (R_modules[name]) return

    // 解决依赖
    evalRequest(deps, function () {
      R_modules[name] = {
        url: R_config[_configType][name].url || R_config[_configType][name],
        deps: deps,
        main: typeof done === 'function' ?
                done.apply(null, getDeps(deps)) : done
      };
    }, name);
  };

  /* ------------------- 配置 ------------------- */

  /**
   * [config 配置一个模块的属性]
   * @param  { Object } object [配置对象]
   */
  var config = function (object) {
    if (!object || typeof object !== 'object') {
      throw(new Error('params must be an object in func config'));
      return;
    }

    // 获取真实路径
    var getUrl = function (_object, _url) {
      var baseUrl = _object.baseUrl || R_config.baseUrl || '';

      if (baseUrl) {
        if (baseUrl[baseUrl.length - 1] != '/')
          baseUrl = baseUrl + '/';
      }
      if (_url) {
        if (_url.indexOf('http') !== -1) {
          baseUrl = '';
        }else if (_url[0] === '/')
          baseUrl = '';
        else if(_url.slice(0, 2) === './')
          _url = _url.slice(2);
      }

      return baseUrl + _url;
    };

    Object.keys(object).map(function (key) {
      if (!object[key] || R_config.configable.indexOf(key) < 0) return;
      // 路径处理
      if (key === 'paths' || key === 'shim') {
        Object.keys(object[key]).map(function (ikey) {
          if (typeof object[key][ikey] === 'object') {
            object[key][ikey].url = getUrl(object, object[key][ikey].url);
            object[key][ikey].deps =
              object[key][ikey].deps ? object[key][ikey].deps : [];
            R_config[key][ikey] = object[key][ikey];
          }else {
            R_config[key][ikey] = getUrl(object, object[key][ikey]);
          }
        });

      }else {
         R_config[key] = object[key];
      }
    });

  };

  /* ------------------- 引入模块-允许使用!加载插件 ------------------- */

  /**
   * [require 引用一个模块]
   * @param  { Array }    deps     [当前模块的所有依赖]
   * @param  { Function } callback [包裹作用域的回调函数]
   */
  var require = function (deps, callback) {
    if (!deps) {
      throw(new Error('the type of param deps must be array in func require!'));
      return;
    }
    /*   引用依赖模块   */
    var getDeps = function (dp) {
      return dp.map(function (d) {
        return R_modules[d] ? R_modules[d].main : null;
      });
    };

    evalRequest(deps, function () {
      callback.apply(null, getDeps(deps) );
    });
  };

  /* ------------------- requireJs插件 ------------------- */
  window.__RequirePlugins__ = {
    __request: Utils.request.bind(this),
    __getXMLHttpRequest: Utils.getXMLHttpRequest.bind(this),
    __pluginMap: {
      css: 'plugins/css.plugin.js',
      image: 'plugins/image.plugin.js',
    }
  };

  /* ------------------- 框架初始化时的方法 ------------------- */
  (function init() {
    /*   自动设置baseUrl   */
    var scriptDom =  document.querySelectorAll('script');
    if (scriptDom.length === 1) {
      scriptDom = scriptDom[0];
    }else {
      for (var i = 0; i < scriptDom.length; i++) {
        if (scriptDom[i].getAttribute('data-type') === 'require') {
          scriptDom = scriptDom[i];
          break;
        }
        if (i === scriptDom.length - 1) {
          scriptDom = scriptDom[0];
        }
      }
    }
    // e.g. http://localhost:3000/javascripts/requireJs.js
    var scriptUrl = scriptDom.src;
    var url = scriptUrl.split('/');
    url.pop();
    url = url.join('/');
    R_config.baseUrl = url;

    /*   尝试寻找主入口文件并执行   */
    var main = scriptDom.getAttribute('data-main') || null;
    if (main) {
      Utils.request('get', main, null, function (rspData) {
        /*   解析主程序   */
        eval(rspData);
      });
    }
  })();

  /* ------------------- 返回Require调用接口 ------------------- */
  return {
    define: define,  // 定义模块
    config: config,  // 配置paths, shim, baseUrl
    require: require,  // 引用一个模块
  };

})();
