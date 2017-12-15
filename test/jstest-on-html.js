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
        if (null !== stack[i].match(/\b(START_TESTS|CONTINUE_TESTS)\b/)) {
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
  var initialLoop = true;
  var loopStarted = false;
  var loopCount = 0;
  var waitingDoneID = 0;
  var CONTINUE_TESTS = function() {
    waitingDoneID += 1;
    if (!loopStarted) {
      loopStarted = true;
      fallback = false;
      loopCount = 0;
    }
    for (; loopCount < testFunctions.length; loopCount += 1) {
      var test = testFunctions[loopCount];
      if (initialLoop) {
        log('section', test.name + '...');
      }
      var func = test.func;
      if (func.length === 0) {
        func();
      } else {
        var done = CONTINUE_TESTS;
        loopCount += 1;
        var doneID = waitingDoneID;
        func(done);
        var timeout = 2000;
        window.setTimeout(function() {
          if (doneID === waitingDoneID) {
            errorCount += 1;
            log('error', '#' + errorCount + ' Timeout ' + timeout + 'msec');
            CONTINUE_TESTS();
            return;
          }
        }, timeout);
        return;
      }
    }
    loopStarted = false;
    if (initialLoop) {
      initialLoop = false;
      if (errorCount === 0) {
        log('green', testCount + ' TESTS PASSED!  (no error)');
      } else {
        log('red', errorCount + ' TESTS FAILED!  (' + (testCount - errorCount) + ' tests passed)');
      }
    }
    if (fallback) {
      EXPECT = console.assert;
      CONTINUE_TESTS();
      return;
    }
  };
  var START_TESTS = function() {
    log('info', 'TEST STARTED!');
    initialLoop = true;
    loopStarted = false;
    CONTINUE_TESTS();
    return;
  };
  return {
    log: log,
    defineTest: defineTest,
    expect: EXPECT_IMPL,
    runAllTests: START_TESTS
  };
})();

var LOG = jsTestOnHTML.log;
var TEST = jsTestOnHTML.defineTest;
var EXPECT = jsTestOnHTML.expect;
var START_TESTS = jsTestOnHTML.runAllTests;
