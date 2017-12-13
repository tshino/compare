var jsTestOnHTML = (function() {
  var testFunctions = [];
  var fallback = false, testCount = 0, errorCount = 0;
  var LOG = function(type, text) {
    $('#output').append($('<p>').addClass(type).text(text));
  };
  var DEF_TEST = function(name, test) {
    testFunctions.push({ name: name, test: test });
  };
  var TEST = function(expr) {
    testCount += 1;
    if (!expr) {
      errorCount += 1;
      var stack;
      if (typeof Error.captureStackTrace == 'function') {
        Error.captureStackTrace(this, TEST);
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
        if (null !== stack[i].match(/\bTEST\b/)) {
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
      LOG('error', '#' + errorCount + ' Test Failed:' + stack);
    }
  };
  var RUN_TESTS = function() {
    LOG('info', 'TEST STARTED!');
    var initialLoop = true;
    for (;;) {
      fallback = false;
      for (var i = 0; i < testFunctions.length; ++i) {
        var test = testFunctions[i];
        if (initialLoop) {
          LOG('section', test.name + '...');
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
      LOG('green', testCount + ' TESTS PASSED!  (no error)');
    } else {
      LOG('red', errorCount + ' TESTS FAILED!  (' + (testCount - errorCount) + ' tests passed)');
    }
  };
  return {
    LOG: LOG,
    DEF_TEST: DEF_TEST,
    TEST: TEST,
    RUN_TESTS: RUN_TESTS
  };
})();

var LOG = jsTestOnHTML.LOG;
var DEF_TEST = jsTestOnHTML.DEF_TEST;
var TEST = jsTestOnHTML.TEST;
var RUN_TESTS = jsTestOnHTML.RUN_TESTS;
