var jsTestUtil = (function() {
  var readFileUnavailable = false;
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
  var makeSelfTest = function(done) {
    var run = function() {
      readFile('data/hello.txt', {
        onsuccess: function(response) {
          var view = new Uint8Array(response);
          EXPECT_EQ( 14, view.length );
          EXPECT_EQ( 72 /* H */, view[0] );
          EXPECT_EQ( 33 /* ! */, view[12] );
          EXPECT_EQ( 10 /* \n */, view[13] );
          var datauri = dataURIFromArrayBuffer(response);
          var binary = compareUtil.binaryFromDataURI(datauri);
          EXPECT_EQ( 14, binary.length );
          EXPECT_EQ( 72 /* H */, binary.at(0) );
          EXPECT_EQ( 33 /* ! */, binary.at(12) );
          EXPECT_EQ( 10 /* \n */, binary.at(13) );
          done();
        },
        onfail: function(message) {
          WARN(message);
          WARN('Since XHR seems to be unavailable, all tests using data files will be skipped.');
          readFileUnavailable = true;
          done();
        }
      });
    };
    return { run: run };
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
      if (readFileUnavailable) {
        return;
      }
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
      if (readFileUnavailable) {
        WARN('skipped');
        done();
        return;
      }
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
    makeSelfTest: makeSelfTest,
    makeFileBasedTestRunner: makeFileBasedTestRunner
  };
})();
