var jsTestOnHTML = (function() {
  var testFunctions = [];
  var fallback = false, testCount = 0, errorCount = 0;
  var log = function(type, text) {
    $('#output').append($('<p>').addClass(type).text(text));
  };
  var defineTest = function(name, func) {
    testFunctions.push({ name: name, func: func });
  };
  var EXPECT_IMPL = function(expr) {
    testCount += 1;
    if (!expr) {
      errorCount += 1;
      var stack;
      if (typeof Error.captureStackTrace == 'function') {
        Error.captureStackTrace(this, EXPECT_IMPL);
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
        if (null !== stack[i].match(/\bEXPECT_IMPL\b/)) {
          stack.splice(0, i + 1);
          break;
        }
      }
      for (var i = 0; i < stack.length; i += 1) {
        if (null !== stack[i].match(/\bRUN_ALL_TESTS\b/)) {
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
  var RUN_ALL_TESTS = function() {
    log('info', 'TEST STARTED!');
    var initialLoop = true;
    for (;;) {
      fallback = false;
      for (var i = 0; i < testFunctions.length; ++i) {
        var test = testFunctions[i];
        if (initialLoop) {
          log('section', test.name + '...');
        }
        var func = test.func;
        func();
      }
      if (fallback) {
        EXPECT = console.assert;
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
    defineTest: defineTest,
    expect: EXPECT_IMPL,
    runAllTests: RUN_ALL_TESTS
  };
})();

var LOG = jsTestOnHTML.log;
var TEST = jsTestOnHTML.defineTest;
var EXPECT = jsTestOnHTML.expect;
var RUN_ALL_TESTS = jsTestOnHTML.runAllTests;
