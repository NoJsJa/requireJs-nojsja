__RequirePlugins__.image = function (pluginStr, callback) {
  var that = this;

  __RequirePlugins__.__request('POST', url, null, function (rspData) {
    if (rspData) {
      try {
        var imageDom = document.createElement('img');
        var FileReader = new FileReader();
        FileReader.onloadend = function (e) {
          imageDom.src = e.target.result;
          callback(imageDom);
        };
        FileReader.readAsDataURL(rspData);

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
