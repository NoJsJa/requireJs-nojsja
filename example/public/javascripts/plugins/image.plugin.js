__RequirePlugins__.image = function (url, callback) {
  var that = this;

  __RequirePlugins__.request('GET', url, null, function (rspData) {
    if (rspData) {
      try {
        var imageDom = document.createElement('img');
        imageDom.src = URL.createObjectURL(rspData);
        callback(imageDom);
      } catch (e) {
        console.error('plugin loading error: ', e);
        callback(false);
      }

    }else {
      console.error('plugin loading error: ', url);
      callback(false);
    }
  }, {}, 'blob');
};
