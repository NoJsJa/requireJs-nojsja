### requireJs-nojsja
____________________

>This is a Javascript module loader for in-browser use, imitating the main function  of popular lib - RequireJs.   
>writted by es2015 and at first I use it to solve the problem of module loading in my own singlePage web project called nojsja-website.

#### How To Use ?
______________

__1. config 配置一个模块的基本信息(main.js中使用)__  

  所有可配置属性：  
  * baseUrl - address of remote root catalog    
  > 1) Default baseUrl is null, so requireJs will search all modules in the catalog where requireJs.js is when it's null.  
  > 2) After configuring baseUrl, all module-url is base on baseUrl, e.g. if baseUrl is ' / ' and moduleA url is ' js/a.js ', finally the real url will be ' /js/a.js '.  
  > 3) When you configured baseUrl, but in the situation that module url begin with ' / ' or url protocol like ' http/https ', requireJs will also search module by only module url you configured before, baseUrl will be ignored.

    ```js
      Require.config({
        baseUrl: '/'
      });
    ```

  * paths - module satisfying AMD standard  
    ```js
       // complete
       Require.config({
          module_name: {
             url: 'http://www.xxx.xxx.js',  // remote url
             deps: ['a', 'b'],  // all depends the module needs
          }
       });

        // just configure url
       Require.config({
         module_name: 'http://www.xxx.xxx.js'
       });
    ```

  * shim - module not satisfying AMD standard
    ```js
        Require.config({
          module_name: {
            url: 'http://www.xxx.xxx.js',  // remote url
            export: exports.name  // module-name export to requireJs
          }
        });
    ```

__2. define 自定义模块(在配置后，按照配置信息声明define方法即可定义一个模块)__  

  * module with depends  
  ```js
    Require.define([deps1, deps2], function(dep1, dep2){
      ...
      return {
        do1: do1,
        do2: do2,
      };
    }, module_name);
  ```

  * module without depends  
  ```js
    Require.define(function() {
      ...
      return {
        do1: do1,
        do2: do2,
      };
    }, module_name);
  ```

__3. require 引用模块(依赖的未初始化的模块，Require会自动初始化，自动解决依赖问题)__   
  ```js
    Require.require([module1, module2, module3], function(m1, m2, m3) {
      m1.doSomething();
      m2.doSomething();
      m3.doAnother();
    });
  ```

__4. 存储的各个模块配置信息 R_modules-info__  
  ```js
    {
      module_name: {
        url: 'http://www.xxx.xxx.js',  // 远程地址
        deps: [dep1, dep2],  // 依赖
        main: (function(){...})(),  // 模块的引用
      }
    }
  ```

#### Example
______________

__1. index.html__  

```html
  <head>
    <!-- import -->
    <script type="text/javascript" src="/javascripts/requireJs.js"></script>
  </head>

  <body>
    <div>...</div>
  </body>

  <!-- main entrance -->
  <script type="text/javascript" src="/javascripts/main.js"></script>
```

__2. main.js__  

```js
  /* ------------------- config at fist ------------------- */
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

  /* ------------------- require demo1 ------------------- */
  Require.require(['A', 'B', 'C'], function (a, b, c) {
    // check browser console
    a.log();
    b.log();
    c.log();
    // console.trace(a);
  });

  /* ------------------- require demo2 ------------------- */
  Require.require(['D'], function (d) {
    // check browser console
    d.log();
    // console.trace(d);
  });
```

__3. module.js__  

```js
/* ------------------- module A define ------------------- */
  Require.define([], function () {

    return {
      log: function () {
        console.log('Module A');
      }
    };
  }, 'A');

/* ------------------- module D define ------------------- */
  Require.define(['E', 'F'], function (e, f) {

    return {
      log: function () {
        e.log();
        f.log();
      }
    };

  }, 'D');
```
