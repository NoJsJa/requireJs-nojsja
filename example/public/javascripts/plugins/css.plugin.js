__RequirePlugins__.css = function (url, callback) {
  var that = this;

  __RequirePlugins__.__request('POST', url, null, function (rspData) {
    if (rspData) {
      var linkDom = document.createElement('style');
      linkDom.setAttribute('type', 'text/css');
      linkDom.innerHTML = rspData;
      document.head.appendChild(linkDom);
      callback(true);
    }else {
      console.error('plugin loading error: ', url);
      callback(false);
    }
  });
};
