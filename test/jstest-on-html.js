var jsTestOnHTML = (function() {
  var testFunctions = [];
  var fallback = false, testCount = 0, errorCount = 0;
  var log = function(type, text) {
    $('#output').append($('<p>').addClass(type).text(text));
  };
  var defTest = function(name, test) {
    testFunctions.push({ name: name, test: test });
  };
  var TEST_IMPL = function(expr) {
    testCount += 1;
    if (!expr) {
      errorCount += 1;
      var stack;
      if (typeof Error.captureStackTrace == 'function') {
        Error.captureStackTrace(this, TEST_IMPL);
        stack = this.stack;
      } else {
        try {
          throw new Error('');
        } catch (e) {
          stack = e.stack;
        }
      }
      if (stack === undefined) {
        stack = 'See console for details; press F12';
        fallback = true;
      }
      stack = stack.split('\n');
      for (var i = 0; i < stack.length; i += 1) {
        if (null !== stack[i].match(/\bTEST_IMPL\b/)) {
          stack.splice(0, i + 1);
          break;
        }
      }
      for (var i = 0; i < stack.length; i += 1) {
        if (null !== stack[i].match(/\RUN_TESTS\b/)) {
          stack.splice(i);
          break;
        }
      }
      stack = stack.filter(function(s) {
        return s.trim() !== '';
      }).join('\n');
      log('error', '#' + errorCount + ' Test Failed:' + stack);
    }
  };
  var RUN_TESTS = function() {
    log('info', 'TEST STARTED!');
    var initialLoop = true;
    for (;;) {
      fallback = false;
      for (var i = 0; i < testFunctions.length; ++i) {
        var test = testFunctions[i];
        if (initialLoop) {
          log('section', test.name + '...');
        }
        var func = test.test;
        func();
      }
      if (fallback) {
        TEST = console.assert;
        initialLoop = false;
        continue;
      }
      break;
    }
    if (errorCount === 0) {
      log('green', testCount + ' TESTS PASSED!  (no error)');
    } else {
      log('red', errorCount + ' TESTS FAILED!  (' + (testCount - errorCount) + ' tests passed)');
    }
  };
  return {
    log: log,
    defTest: defTest,
    test: TEST_IMPL,
    runTests: RUN_TESTS
  };
})();

var LOG = jsTestOnHTML.log;
var DEF_TEST = jsTestOnHTML.defTest;
var TEST = jsTestOnHTML.test;
var RUN_TESTS = jsTestOnHTML.runTests;
