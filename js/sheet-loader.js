function loadSheet (url) {
    return new Promise((resolve, reject) => {
        var promisedData =  loadGoogleSpreadsheet(url);
        promisedData.then(function(result){
            resolve(result);
        })
        .catch(function(e){
            reject(new Error('Unable to load the sheet'));
        });
    });

    function loadGoogleSpreadsheet(url){
        return new Promise((resolve, reject) => {
          Tabletop.init({
              key: url,
              callback: function(data) {
                resolve(data);
              },
              simpleSheet: false
          });
      });
    }
}
