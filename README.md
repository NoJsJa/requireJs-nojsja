### requireJs-nojsja
____________________

>This is a Javascript module loader for in-browser use, imitating the main function  of popular lib - RequireJs.   
>writted by es2015 and at first I use it to solve the problem of module loading in my own singlePage web project called nojsja-website.

#### How To Use ?
______________

__1. config module info in main.js__  

  all configable attributes：  
  * baseUrl - address of remote root catalog  

  > (1) default baseUrl is null, so requireJs will search all modules in the catalog where requireJs.js is when it's null.  
  > (2) after configuring baseUrl, all module-url is base on baseUrl, e.g. if baseUrl is ' / ' and moduleA url is ' js/a.js ', finally the real url will be ' /js/a.js '.  
  > (3) when you configured baseUrl, but in the situation that module url begin with ' / ' or url protocol like ' http/https ', requireJs will also search module by only module url you configured before, baseUrl will be ignored.

  ```js
    Require.config({
      baseUrl: '/javascripts'
    });
  ```

  * paths - module satisfying AMD standard  

    ```js
       // complete
       Require.config({
          module_name: {
             url: 'xxx/xxx/js',  // remote url
             deps: ['a', 'b'],  // all depends the module needs
          }
       });

        // just configure url
       Require.config({
         module_name: 'xxx/xxx/js',
       });
    ```

  * shim - module not satisfying AMD standard

    ```js
        Require.config({
          module_name: {
            url: 'xxx/xxx/js',  // remote url
            exports: exports-name  // module-name export to requireJs
          }
        });
    ```

__2. define a module__  

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

__3. use a module__   

  ```js
    Require.require([module1, module2, module3], function(m1, m2, m3) {
      m1.doSomething();
      m2.doSomething();
      m3.doAnother();
    });
  ```

__4. module info__  

  ```js
    {
      module_name: {
        url: 'http://xxx/xxx.js',  // real url
        deps: [dep1, dep2],  // depends
        main: (function(){...})(),  // stored in memory
      }
    }
  ```

#### Example
______________

```bash
  # 1.clone code
  git clone https://github.com:NoJsJa/requireJs-nojsja.git
  # 2.cd example root directory
  cd example;
  # 3.install all packages
  npm install;
  # 4.run the demo
  npm start;
  # 5.open browser and check console
  open the page 'http://localhost:3000/index';
```

__1. index.html__  

```html
  <head>
    <!-- import -->
    <!-- you can specify data-main as main-entrance in requireJs script -->
    <script type="text/javascript" src="/javascripts/requireJs.js" data-main="/javascripts/main.js"></script>
  </head>

  <body>
    <div>...</div>
  </body>

  <!-- specify main-entrance if it's not be declared in requireJs script -->
  <!-- <script type="text/javascript" src="/javascripts/main.js"></script> -->
```

__2. main.js__  

```js
  /* ------------------- config at fist ------------------- */
    Require.config({
      baseUrl: 'javascripts',
      paths: {
        /*   config test 1   */
        'moduleA': './moduleA.js',  // 相对于当前目录
        'moduleB': '/javascripts/moduleB.js',  // 不使用baseUrl
        'moduleC': 'moduleC.js',

        /*   config test 2   */
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
          deps: ['moduleF'],
        },
      },
      shim: {
        /*   config test 3   */
        'moduleH': {
          url: 'moduleH.js',
          exports: 'log',
        },
      }
    });

  /* ------------------- require demo1 ------------------- */
    Require.require(['moduleA', 'moduleB', 'moduleC'], function (a, b, c) {
      console.log('-------- require test 1 --------');
      a.log();
      b.log();
      c.log();
      // console.trace(a);
    });

    /* ------------------- require demo2 ------------------- */
    Require.require(['moduleD'], function (d) {
      console.log('-------- require test 2 --------');
      d.log();
    });

    /* ------------------- require demo3 ------------------- */
    Require.require(['moduleH'], function (h) {
      console.log('-------- require test 3 --------');
      h.log();
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
    }
  }, 'moduleA');

/* ------------------- module D define ------------------- */
  Require.define(['moduleE', 'moduleF'], function (e, f) {

    return {
      log: function () {
        e.log();
        f.log();
        console.log('Module D');
      }
    };

  }, 'moduleD');
  ...
```
