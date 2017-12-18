var jsTestUtil = (function() {
  var readFile = function(url, callbacks) {
    var onsuccess = callbacks.onsuccess || function() {};
    var onfail = callbacks.onfail || function() {};
    try {
      var xhr = new XMLHttpRequest();
      xhr.onload = function() {
        if (xhr.status === 200) {
          onsuccess(xhr.response);
        } else {
          onfail('XHR failed: ' + xhr.statusText);
        }
      };
      xhr.onerror = function() {
        onfail('XHR error occurred');
      };
      xhr.onabort = function() {
        onfail('XHR aborted');
      };
      xhr.open('GET', url);
      xhr.responseType = 'arraybuffer';
      xhr.send();
    } catch (e) {
      onfail('XHR failed to start');
    }
  };
  var dataURIFromArrayBuffer = function(ab) {
    var array = new Uint8Array(ab);
    var str = Array.from(
        array,
        function(code) { return String.fromCharCode(code); }
    ).join('');
    return 'data:application/octet-stream;base64,' + btoa(str);
  };
  var makeFileBasedTestRunner = function(done) {
    var totalXHR = 0;
    var doneXHR = 0;
    var failXHR = 0;
    var startedXHR = false;
    var checkFinish = function() {
      if (startedXHR && totalXHR === doneXHR) {
        done();
      }
    };
    var readFileAndTest = function(url, callback) {
      totalXHR += 1;
      readFile(url, {
        onsuccess : function(response) {
          callback(response, function() {
            doneXHR += 1;
            checkFinish();
          });
        },
        onfail: function(message) {
          ERROR('File cannot be read (' + message + '): "' + url + '" ');
          failXHR += 1;
          doneXHR += 1;
          checkFinish();
        }
      });
    };
    var run = function() {
      startedXHR = true;
      checkFinish();
    };
    return {
      readFileAndTest: readFileAndTest,
      run: run
    };
  };
  return {
    readFile: readFile,
    dataURIFromArrayBuffer: dataURIFromArrayBuffer,
    makeFileBasedTestRunner: makeFileBasedTestRunner
  };
})();
