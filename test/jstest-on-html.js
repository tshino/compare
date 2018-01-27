var jsTestOnHTML = (function() {
  var testFunctions = [];
  var fallback = false, testCount = 0, errorCount = 0, warnCount = 0;
  var log = function(type, text) {
    $('#output').append($('<p>').addClass(type).text(text));
  };
  var defineTest = function(name /* [, opt], func */) {
    if (typeof arguments[1] == 'function') {
      testFunctions.push({ name: name, opt: {}, func: arguments[1] });
    } else {
      testFunctions.push({ name: name, opt: arguments[1], func: arguments[2] });
    }
  };
  var getStackTrace = function(testerName) {
    var stack;
    try {
      throw new Error('');
    } catch (e) {
      stack = e.stack;
    }
    if (stack === undefined) {
      stack = 'See console for details; press F12';
      fallback = true;
    }
    stack = stack.split('\n');
    var regexpTester = new RegExp('\\b' + testerName + '\\b');
    for (var i = 0; i < stack.length; i += 1) {
      if (null !== stack[i].match(regexpTester)) {
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
    stack = '  ' + stack.map(
      function(s) { return s.trim(); }
    ).filter(
      function(s) { return s !== ''; }
    ).join('\n  ');
    return stack;
  };
  var REPORT_ERROR = function(testerName, message) {
    errorCount += 1;
    var stack = getStackTrace(testerName);
    log('error', '#' + errorCount + ' ' + message + '\n' + stack);
  };
  var ERROR_IMPL = function(message) {
    testCount += 1;
    REPORT_ERROR('ERROR_IMPL', message + ':');
  };
  var WARN_IMPL = function(message) {
    warnCount += 1;
    log('warn', 'W#' + warnCount + ' ' + message);
  };
  var EXPECT_IMPL = function(expr, desc) {
    testCount += 1;
    if (!expr) {
      REPORT_ERROR('EXPECT_IMPL', 'Test Failed:' + (desc || ''));
    }
  };
  var EXPECT_EQ_IMPL = function(expected, actual, desc) {
    testCount += 1;
    if (!(expected === actual)) {
      var values =
          '    expected: ' + expected + '\n' +
          '    actual: ' + actual;
      REPORT_ERROR('EXPECT_EQ_IMPL', 'Test Failed: ' + (desc || '') + '\n' + values);
    }
  };
  var initialLoop = true;
  var loopStarted = false;
  var loopCount = 0;
  var waitingDoneID = 0;
  var CONTINUE_TESTS = function(doneID) {
    if (doneID !== waitingDoneID) {
      return;
    }
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
        try {
          func();
        } catch(e) {
          loopCount += 1;
          errorCount += 1;
          log('error', '#' + errorCount + ' ' + e.name + ': ' + e.message + '\n' + e.stack );
          CONTINUE_TESTS(waitingDoneID);
          return;
        }
      } else {
        loopCount += 1;
        var doneID = waitingDoneID;
        var timeout = test.opt.timeout === undefined ? 2000 : test.opt.timeout;
        window.setTimeout(function() {
          if (doneID === waitingDoneID) {
            errorCount += 1;
            log('error', '#' + errorCount + ' Timeout ' + timeout + 'msec');
            CONTINUE_TESTS(waitingDoneID);
            return;
          }
        }, timeout);
        func(function() { CONTINUE_TESTS(doneID); });
        return;
      }
    }
    loopStarted = false;
    if (initialLoop) {
      initialLoop = false;
      if (warnCount !== 0) {
        log('yellow', warnCount + ' WARNINGS REPORTED');
      }
      if (errorCount === 0) {
        log('green', testCount + ' TESTS PASSED!  (no error)');
      } else {
        log('red', errorCount + ' TESTS FAILED!  (' + (testCount - errorCount) + ' tests passed)');
      }
    }
    if (fallback) {
      ERROR = console.error;
      WARN = console.warn;
      EXPECT = console.assert;
      EXPECT_EQ = function(a, b, desc) { if (!(a === b)) throw new Error('EXPECT_EQ failed (' + (desc || '') + ')'); };
      CONTINUE_TESTS(waitingDoneID);
      return;
    }
  };
  var START_TESTS = function() {
    log('info', 'TEST STARTED!');
    initialLoop = true;
    loopStarted = false;
    CONTINUE_TESTS(waitingDoneID);
    return;
  };
  return {
    log: log,
    defineTest: defineTest,
    error: ERROR_IMPL,
    warn: WARN_IMPL,
    expect: EXPECT_IMPL,
    expectEQ: EXPECT_EQ_IMPL,
    startTests: START_TESTS
  };
})();

var TEST = jsTestOnHTML.defineTest;

var LOG = jsTestOnHTML.log;
var WARN = jsTestOnHTML.warn;
var ERROR = jsTestOnHTML.error;
var EXPECT = jsTestOnHTML.expect;
var EXPECT_EQ = jsTestOnHTML.expectEQ;

var START_TESTS = jsTestOnHTML.startTests;
