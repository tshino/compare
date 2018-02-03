var jsTestUtil = (function() {
  var expectEqualArray = function(a, b, label) {
    label = label !== undefined ? ' (' + label + ')' : '';
    EXPECT( undefined !== a.length );
    EXPECT( undefined !== b.length );
    EXPECT_EQ( a.length, b.length, 'the lengths of the arrays' + label + ' are different');
    if (a.length === b.length) {
      for (var i = 0; i < a.length; i++) {
        EXPECT_EQ( a[i], b[i], 'the value of ' + (i + 1) + 'th element of the arrays' + label + ' are different');
      }
    }
  };
  var makeSequentialTest = function(tests) {
    return function(done) {
      var runRest = done;
      for (var i = tests.length; i-- > 0; ) {
        runRest = (function(func, runRest) {
          return function() {
            if (func.length === 0) {
              func();
              runRest();
            } else {
              func(runRest);
            }
          };
        })(tests[i], runRest);
      }
      runRest();
    };
  };
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
    var str = '';
    for (var i = 0; i < array.length; ++i) {
      str += String.fromCharCode(array[i]);
    }
    return 'data:application/octet-stream;base64,' + btoa(str);
  };
  var makeSelfTest = function() {
    var expectEqualArrayTest = function() {
      var backup = { e: EXPECT, eq: EXPECT_EQ };
      var result = true;
      EXPECT = function(e) {
        if (!e) result = false;
      };
      EXPECT_EQ = function(a, b) {
        if (a !== b) result = false;
      };

      result = true; expectEqualArray([], []);
      backup.eq( true, result );
      result = true; expectEqualArray([1, 2], [1, 2]);
      backup.eq( true, result );
      result = true; expectEqualArray([3, 4], [1, 2]);
      backup.eq( false, result );
      result = true; expectEqualArray([1, 2, 3, 4], [1, 2]);
      backup.eq( false, result );
      result = true; expectEqualArray([1, 2], [1, 2, 3, 4]);
      backup.eq( false, result );
      result = true; expectEqualArray([0], []);
      backup.eq( false, result );
      result = true; expectEqualArray([1, 2], []);
      backup.eq( false, result );
      result = true; expectEqualArray([], [0]);
      backup.eq( false, result );
      result = true; expectEqualArray([], [1, 2]);
      backup.eq( false, result );
      result = true; expectEqualArray({}, {});
      backup.eq( false, result );
      result = true; expectEqualArray(1, 1);
      backup.eq( false, result );

      EXPECT = backup.e;
      EXPECT_EQ = backup.eq;
    };
    var asyncTestTest = function(done) {
      window.setTimeout(function() {
        EXPECT( true );
        //EXPECT( false );
        done();
      }, 0);
    };
    var counter = 0;
    var sequentialTestTest = function(done) {
      var seq = makeSequentialTest([
        function() {
          EXPECT_EQ( 0, counter );
          counter = 1;
        },
        function(done) {
          EXPECT_EQ( 1, counter );
          counter = 2;
          done();
        },
        function(done) {
          window.setTimeout(
            function() {
              EXPECT_EQ( 2, counter );
              counter = 3;
              done();
            },
            10
          );
        },
        function() {
          EXPECT_EQ( 3, counter );
          counter = 0;
        }
      ]);
      seq(done);
    };
    var readFileTest = function(done) {
      readFile('data/hello.txt', {
        onsuccess: function(response) {
          var view = new Uint8Array(response);
          EXPECT_EQ( 14, view.length );
          EXPECT_EQ( 72 /* H */, view[0] );
          EXPECT_EQ( 33 /* ! */, view[12] );
          EXPECT_EQ( 10 /* \n */, view[13] );
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
    var dataURIFromArrayBufferTest = function() {
      var ab = new ArrayBuffer(14);
      var u8 = new Uint8Array(ab);
      // 'Hello, world!\n'
      u8[0] = 72;
      u8[1] = 101;
      u8[2] = 108;
      u8[3] = 108;
      u8[4] = 111;
      u8[5] = 44;
      u8[6] = 32;
      u8[7] = 119;
      u8[8] = 111;
      u8[9] = 114;
      u8[10] = 108;
      u8[11] = 100;
      u8[12] = 33;
      u8[13] = 10;
      var datauri = dataURIFromArrayBuffer(ab);
      EXPECT_EQ( 'data:application/octet-stream;base64,SGVsbG8sIHdvcmxkIQo=', datauri );
    };
    return makeSequentialTest([
      expectEqualArrayTest,
      asyncTestTest,
      sequentialTestTest,
      readFileTest,
      dataURIFromArrayBufferTest,
    ]);
  };
  var makeFileBasedTestRunner = function() {
    var tests = [];
    var readFileAndTest = function(url, callback) {
      var test = function(done) {
        readFile(url, {
          onsuccess : function(response) {
            callback(response, done);
          },
          onfail: function(message) {
            ERROR('File cannot be read (' + message + '): "' + url + '" ');
            done();
          }
        });
      };
      tests.push(test);
    };
    var run = function(done) {
      if (readFileUnavailable) {
        WARN('skipped');
        done();
        return;
      }
      var allTests = makeSequentialTest(tests);
      allTests(done);
    };
    return {
      readFileAndTest: readFileAndTest,
      run: run
    };
  };
  return {
    expectEqualArray: expectEqualArray,
    makeSequentialTest: makeSequentialTest,
    readFile: readFile,
    dataURIFromArrayBuffer: dataURIFromArrayBuffer,
    makeSelfTest: makeSelfTest,
    makeFileBasedTestRunner: makeFileBasedTestRunner
  };
})();

TEST( 'jsTestUtil self test', jsTestUtil.makeSelfTest() );
