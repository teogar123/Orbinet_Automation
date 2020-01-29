var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var convertTimestamp = function (timestamp) {
    var d = new Date(timestamp),
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2),
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    } else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    } else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};

//</editor-fold>

app.controller('ScreenshotReportController', ['$scope', '$http', 'TitleService', function ($scope, $http, titleService) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    this.warningTime = 1400;
    this.dangerTime = 1900;
    this.totalDurationFormat = clientDefaults.totalDurationFormat;
    this.showTotalDurationIn = clientDefaults.showTotalDurationIn;

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
        if (initialColumnSettings.warningTime) {
            this.warningTime = initialColumnSettings.warningTime;
        }
        if (initialColumnSettings.dangerTime) {
            this.dangerTime = initialColumnSettings.dangerTime;
        }
    }


    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };
    this.hasNextScreenshot = function (index) {
        var old = index;
        return old !== this.getNextScreenshotIdx(index);
    };

    this.hasPreviousScreenshot = function (index) {
        var old = index;
        return old !== this.getPreviousScreenshotIdx(index);
    };
    this.getNextScreenshotIdx = function (index) {
        var next = index;
        var hit = false;
        while (next + 2 < this.results.length) {
            next++;
            if (this.results[next].screenShotFile && !this.results[next].pending) {
                hit = true;
                break;
            }
        }
        return hit ? next : index;
    };

    this.getPreviousScreenshotIdx = function (index) {
        var prev = index;
        var hit = false;
        while (prev > 0) {
            prev--;
            if (this.results[prev].screenShotFile && !this.results[prev].pending) {
                hit = true;
                break;
            }
        }
        return hit ? prev : index;
    };

    this.convertTimestamp = convertTimestamp;


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };

    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.totalDuration = function () {
        var sum = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.duration) {
                sum += result.duration;
            }
        }
        return sum;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };


    var results = [
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "57a72b8149619f391d8d195a1322bb26",
        "instanceId": 23976,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: toUploadPhoto is not defined"
        ],
        "trace": [
            "ReferenceError: toUploadPhoto is not defined\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:70:50)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2974:25\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00c5008d-006d-0066-00f4-007600010084.png",
        "timestamp": 1580185500054,
        "duration": 17
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "bf2daabd778c75a16c99d85f290fc362",
        "instanceId": 24021,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: helper.fillInputFieldWithFileWhenPresent is not a function"
        ],
        "trace": [
            "TypeError: helper.fillInputFieldWithFileWhenPresent is not a function\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:69:16)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2974:25\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00e100c0-0034-0000-00c2-00d1002500fd.png",
        "timestamp": 1580185563112,
        "duration": 23
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "c4dbdef3bf99442da4b5d7f78bdcf2a8",
        "instanceId": 24071,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580185757718,
        "duration": 26902
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "2526d33020d4dd830c77dc86b9e96a22",
        "instanceId": 24113,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580185822333,
        "duration": 36733
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "7761d4b246dd24e5974e270c21a7a3dd",
        "instanceId": 24161,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: element not interactable\n  (Session info: chrome=79.0.3945.130)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'MBP-de-Itexico', ip: 'fe80:0:0:0:105d:69cc:fc8b:2109%en0', os.name: 'Mac OS X', os.arch: 'x86_64', os.version: '10.14.6', java.version: '1.8.0_211'\nDriver info: driver.version: unknown"
        ],
        "trace": [
            "WebDriverError: element not interactable\n  (Session info: chrome=79.0.3945.130)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'MBP-de-Itexico', ip: 'fe80:0:0:0:105d:69cc:fc8b:2109%en0', os.name: 'Mac OS X', os.arch: 'x86_64', os.version: '10.14.6', java.version: '1.8.0_211'\nDriver info: driver.version: unknown\n    at Object.checkLegacyResponse (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/error.js:546:15)\n    at parseHttpResponse (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/http.js:509:13)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:89:5)\nFrom: Task: WebElement.sendKeys()\n    at thenableWebDriverProxy.schedule (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:807:17)\n    at WebElement.schedule_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:2010:25)\n    at WebElement.sendKeys (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:2174:19)\n    at actionFn (/usr/local/lib/node_modules/protractor/built/element.js:89:44)\n    at Array.map (<anonymous>)\n    at /usr/local/lib/node_modules/protractor/built/element.js:461:65\n    at ManagedPromise.invokeCallback_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2927:27Error\n    at ElementArrayFinder.applyAction_ (/usr/local/lib/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (/usr/local/lib/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (/usr/local/lib/node_modules/protractor/built/element.js:831:22)\n    at Object.uploadFileIntoInputField (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/inputFieldInteractions.js:26:15)\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:69:16)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "006500ea-00d8-00fe-00a0-008100b9004c.png",
        "timestamp": 1580186122621,
        "duration": 16782
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "af5442465033044554b70bec6bf96546",
        "instanceId": 24209,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580186297091,
        "duration": 26819
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "d237faaae528280cb1b8fcb2e8b6579e",
        "instanceId": 24241,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: element with locator 'By(xpath, //button[contains(@class,'btn button outline btnPicture')])' is not present.\nWait timed out after 5006ms"
        ],
        "trace": [
            "TimeoutError: element with locator 'By(xpath, //button[contains(@class,'btn button outline btnPicture')])' is not present.\nWait timed out after 5006ms\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2201:17\n    at ManagedPromise.invokeCallback_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:89:5)\nFrom: Task: element with locator 'By(xpath, //button[contains(@class,'btn button outline btnPicture')])' is not present.\n    at scheduleWait (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2188:20)\n    at ControlFlow.wait (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2517:12)\n    at thenableWebDriverProxy.wait (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:934:29)\n    at run (/usr/local/lib/node_modules/protractor/built/browser.js:59:33)\n    at ProtractorBrowser.to.<computed> [as wait] (/usr/local/lib/node_modules/protractor/built/browser.js:67:16)\n    at Object.waitForElementPresence (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/waiters.js:10:11)\n    at Object.uploadFileIntoInputField (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/inputFieldInteractions.js:25:11)\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:69:16)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "000e00cb-0064-00ec-00d1-0037008d00cc.png",
        "timestamp": 1580186376772,
        "duration": 22773
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "f887233895f6b1776abe05ac70e1dbae",
        "instanceId": 24275,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580186409730,
        "duration": 26924
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "19b0d502fea5c2fc74d9666ba82682ce",
        "instanceId": 24666,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: element not interactable\n  (Session info: chrome=79.0.3945.130)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'MBP-de-Itexico', ip: 'fe80:0:0:0:105d:69cc:fc8b:2109%en0', os.name: 'Mac OS X', os.arch: 'x86_64', os.version: '10.14.6', java.version: '1.8.0_211'\nDriver info: driver.version: unknown"
        ],
        "trace": [
            "WebDriverError: element not interactable\n  (Session info: chrome=79.0.3945.130)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'MBP-de-Itexico', ip: 'fe80:0:0:0:105d:69cc:fc8b:2109%en0', os.name: 'Mac OS X', os.arch: 'x86_64', os.version: '10.14.6', java.version: '1.8.0_211'\nDriver info: driver.version: unknown\n    at Object.checkLegacyResponse (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/error.js:546:15)\n    at parseHttpResponse (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/http.js:509:13)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:89:5)\nFrom: Task: WebElement.sendKeys()\n    at thenableWebDriverProxy.schedule (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:807:17)\n    at WebElement.schedule_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:2010:25)\n    at WebElement.sendKeys (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:2174:19)\n    at actionFn (/usr/local/lib/node_modules/protractor/built/element.js:89:44)\n    at Array.map (<anonymous>)\n    at /usr/local/lib/node_modules/protractor/built/element.js:461:65\n    at ManagedPromise.invokeCallback_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2927:27Error\n    at ElementArrayFinder.applyAction_ (/usr/local/lib/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (/usr/local/lib/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (/usr/local/lib/node_modules/protractor/built/element.js:831:22)\n    at Object.uploadFileIntoInputField (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/inputFieldInteractions.js:26:15)\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:69:16)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00da0022-00ab-00ba-003d-004700cf00e5.png",
        "timestamp": 1580255021309,
        "duration": 16858
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "25f41db34d6bfce57797207895438ae2",
        "instanceId": 24712,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580255258978,
        "duration": 26871
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "dbce139227105674ff5a679ff8a613a3",
        "instanceId": 24756,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580255315065,
        "duration": 22826
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "df7e214a865c9351012fcced7801b75e",
        "instanceId": 24790,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580255350551,
        "duration": 23180
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "764d112b327d373a904b0409c1c1e1db",
        "instanceId": 24833,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: invalid selector: Unable to locate an element with the xpath expression div.content div.register div.panel.panel:nth-child(5) div.content div.form div.picture div.pictureImage:nth-child(4) > div.pictureFrame because of the following error:\nSyntaxError: Failed to execute 'evaluate' on 'Document': The string 'div.content div.register div.panel.panel:nth-child(5) div.content div.form div.picture div.pictureImage:nth-child(4) > div.pictureFrame' is not a valid XPath expression.\n  (Session info: chrome=79.0.3945.130)\nFor documentation on this error, please visit: https://www.seleniumhq.org/exceptions/invalid_selector_exception.html\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'MBP-de-Itexico', ip: 'fe80:0:0:0:105d:69cc:fc8b:2109%en0', os.name: 'Mac OS X', os.arch: 'x86_64', os.version: '10.14.6', java.version: '1.8.0_211'\nDriver info: driver.version: unknown"
        ],
        "trace": [
            "InvalidSelectorError: invalid selector: Unable to locate an element with the xpath expression div.content div.register div.panel.panel:nth-child(5) div.content div.form div.picture div.pictureImage:nth-child(4) > div.pictureFrame because of the following error:\nSyntaxError: Failed to execute 'evaluate' on 'Document': The string 'div.content div.register div.panel.panel:nth-child(5) div.content div.form div.picture div.pictureImage:nth-child(4) > div.pictureFrame' is not a valid XPath expression.\n  (Session info: chrome=79.0.3945.130)\nFor documentation on this error, please visit: https://www.seleniumhq.org/exceptions/invalid_selector_exception.html\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'MBP-de-Itexico', ip: 'fe80:0:0:0:105d:69cc:fc8b:2109%en0', os.name: 'Mac OS X', os.arch: 'x86_64', os.version: '10.14.6', java.version: '1.8.0_211'\nDriver info: driver.version: unknown\n    at Object.checkLegacyResponse (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/error.js:546:15)\n    at parseHttpResponse (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/http.js:509:13)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:89:5)\nFrom: Task: WebDriver.findElements(By(xpath, div.content div.register div.panel.panel:nth-child(5) div.content div.form div.picture div.pictureImage:nth-child(4) > div.pictureFrame))\n    at thenableWebDriverProxy.schedule (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:807:17)\n    at thenableWebDriverProxy.findElements (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:1048:19)\n    at /usr/local/lib/node_modules/protractor/built/element.js:159:44\n    at ManagedPromise.invokeCallback_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\nFrom: Task: <anonymous>\n    at pollCondition (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2195:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2191:7\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2190:22\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\nFrom: Task: element with locator 'By(xpath, div.content div.register div.panel.panel:nth-child(5) div.content div.form div.picture div.pictureImage:nth-child(4) > div.pictureFrame)' is not present.\n    at scheduleWait (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2188:20)\n    at ControlFlow.wait (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2517:12)\n    at thenableWebDriverProxy.wait (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:934:29)\n    at run (/usr/local/lib/node_modules/protractor/built/browser.js:59:33)\n    at ProtractorBrowser.to.<computed> [as wait] (/usr/local/lib/node_modules/protractor/built/browser.js:67:16)\n    at Object.waitForElementPresence (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/waiters.js:10:11)\n    at Object.uploadFileIntoInputField (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/inputFieldInteractions.js:25:11)\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:69:16)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00bc00c7-005a-0027-00aa-001100c400db.png",
        "timestamp": 1580255483565,
        "duration": 13227
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "fd615dc7bd4160c5db8af5d85233a98b",
        "instanceId": 24871,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: element not interactable\n  (Session info: chrome=79.0.3945.130)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'MBP-de-Itexico', ip: 'fe80:0:0:0:105d:69cc:fc8b:2109%en0', os.name: 'Mac OS X', os.arch: 'x86_64', os.version: '10.14.6', java.version: '1.8.0_211'\nDriver info: driver.version: unknown"
        ],
        "trace": [
            "WebDriverError: element not interactable\n  (Session info: chrome=79.0.3945.130)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'MBP-de-Itexico', ip: 'fe80:0:0:0:105d:69cc:fc8b:2109%en0', os.name: 'Mac OS X', os.arch: 'x86_64', os.version: '10.14.6', java.version: '1.8.0_211'\nDriver info: driver.version: unknown\n    at Object.checkLegacyResponse (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/error.js:546:15)\n    at parseHttpResponse (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/http.js:509:13)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:89:5)\nFrom: Task: WebElement.sendKeys()\n    at thenableWebDriverProxy.schedule (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:807:17)\n    at WebElement.schedule_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:2010:25)\n    at WebElement.sendKeys (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:2174:19)\n    at actionFn (/usr/local/lib/node_modules/protractor/built/element.js:89:44)\n    at Array.map (<anonymous>)\n    at /usr/local/lib/node_modules/protractor/built/element.js:461:65\n    at ManagedPromise.invokeCallback_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2927:27Error\n    at ElementArrayFinder.applyAction_ (/usr/local/lib/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (/usr/local/lib/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (/usr/local/lib/node_modules/protractor/built/element.js:831:22)\n    at Object.uploadFileIntoInputField (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/inputFieldInteractions.js:26:15)\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:69:16)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00b700cb-00cf-00e4-000a-006e00f6003a.png",
        "timestamp": 1580255523258,
        "duration": 12768
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "5892fc28eb30a3eb819ee4ebfa944bf4",
        "instanceId": 24997,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580255758941,
        "duration": 27862
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "8c3f3e5280467a2cea484922ff7209e1",
        "instanceId": 25100,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580256272483,
        "duration": 55885
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "f62756ca00e0b3a02cf99ddb9bff465a",
        "instanceId": 25150,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580256416417,
        "duration": 27807
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "a74c0185596bca096c0c3d139b679fd9",
        "instanceId": 25189,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: element with locator 'By(css selector, btn.button.outline.btnPicture)' is not present.\nWait timed out after 5000ms"
        ],
        "trace": [
            "TimeoutError: element with locator 'By(css selector, btn.button.outline.btnPicture)' is not present.\nWait timed out after 5000ms\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2201:17\n    at ManagedPromise.invokeCallback_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:89:5)\nFrom: Task: element with locator 'By(css selector, btn.button.outline.btnPicture)' is not present.\n    at scheduleWait (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2188:20)\n    at ControlFlow.wait (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2517:12)\n    at thenableWebDriverProxy.wait (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:934:29)\n    at run (/usr/local/lib/node_modules/protractor/built/browser.js:59:33)\n    at ProtractorBrowser.to.<computed> [as wait] (/usr/local/lib/node_modules/protractor/built/browser.js:67:16)\n    at Object.waitForElementPresence (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/waiters.js:10:11)\n    at Object.uploadFileIntoInputField (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/inputFieldInteractions.js:25:11)\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:69:16)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00510081-004c-007c-003b-001a00400019.png",
        "timestamp": 1580256643690,
        "duration": 17733
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "e03b66629db82e9ad7e690f3c34bfb94",
        "instanceId": 25232,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: element with locator 'By(css selector, .btn button outline btnPicture)' is not present.\nWait timed out after 5000ms"
        ],
        "trace": [
            "TimeoutError: element with locator 'By(css selector, .btn button outline btnPicture)' is not present.\nWait timed out after 5000ms\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2201:17\n    at ManagedPromise.invokeCallback_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:89:5)\nFrom: Task: element with locator 'By(css selector, .btn button outline btnPicture)' is not present.\n    at scheduleWait (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2188:20)\n    at ControlFlow.wait (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2517:12)\n    at thenableWebDriverProxy.wait (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:934:29)\n    at run (/usr/local/lib/node_modules/protractor/built/browser.js:59:33)\n    at ProtractorBrowser.to.<computed> [as wait] (/usr/local/lib/node_modules/protractor/built/browser.js:67:16)\n    at Object.waitForElementPresence (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/waiters.js:10:11)\n    at Object.uploadFileIntoInputField (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/inputFieldInteractions.js:25:11)\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:69:16)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "003f0015-0036-007c-003b-000d00d300ac.png",
        "timestamp": 1580256694762,
        "duration": 17697
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "0606a01749cd56e587fadca66e9e5831",
        "instanceId": 25273,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580256754648,
        "duration": 27834
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "fc29e7ef4e6f37e2061f1a6427a88db8",
        "instanceId": 25320,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: element not interactable\n  (Session info: chrome=79.0.3945.130)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'MBP-de-Itexico', ip: 'fe80:0:0:0:105d:69cc:fc8b:2109%en0', os.name: 'Mac OS X', os.arch: 'x86_64', os.version: '10.14.6', java.version: '1.8.0_211'\nDriver info: driver.version: unknown"
        ],
        "trace": [
            "WebDriverError: element not interactable\n  (Session info: chrome=79.0.3945.130)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'MBP-de-Itexico', ip: 'fe80:0:0:0:105d:69cc:fc8b:2109%en0', os.name: 'Mac OS X', os.arch: 'x86_64', os.version: '10.14.6', java.version: '1.8.0_211'\nDriver info: driver.version: unknown\n    at Object.checkLegacyResponse (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/error.js:546:15)\n    at parseHttpResponse (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/http.js:509:13)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:89:5)\nFrom: Task: WebElement.sendKeys()\n    at thenableWebDriverProxy.schedule (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:807:17)\n    at WebElement.schedule_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:2010:25)\n    at WebElement.sendKeys (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:2174:19)\n    at actionFn (/usr/local/lib/node_modules/protractor/built/element.js:89:44)\n    at Array.map (<anonymous>)\n    at /usr/local/lib/node_modules/protractor/built/element.js:461:65\n    at ManagedPromise.invokeCallback_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2927:27Error\n    at ElementArrayFinder.applyAction_ (/usr/local/lib/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (/usr/local/lib/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (/usr/local/lib/node_modules/protractor/built/element.js:831:22)\n    at Object.uploadFileIntoInputField (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/inputFieldInteractions.js:26:15)\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:69:16)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "0023001c-00df-006b-00e8-00e400200091.png",
        "timestamp": 1580257089582,
        "duration": 12799
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "70333ca88774e0e450646441a210df81",
        "instanceId": 25359,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: element not interactable\n  (Session info: chrome=79.0.3945.130)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'MBP-de-Itexico', ip: 'fe80:0:0:0:105d:69cc:fc8b:2109%en0', os.name: 'Mac OS X', os.arch: 'x86_64', os.version: '10.14.6', java.version: '1.8.0_211'\nDriver info: driver.version: unknown"
        ],
        "trace": [
            "WebDriverError: element not interactable\n  (Session info: chrome=79.0.3945.130)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'MBP-de-Itexico', ip: 'fe80:0:0:0:105d:69cc:fc8b:2109%en0', os.name: 'Mac OS X', os.arch: 'x86_64', os.version: '10.14.6', java.version: '1.8.0_211'\nDriver info: driver.version: unknown\n    at Object.checkLegacyResponse (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/error.js:546:15)\n    at parseHttpResponse (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/http.js:509:13)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:89:5)\nFrom: Task: WebElement.sendKeys()\n    at thenableWebDriverProxy.schedule (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:807:17)\n    at WebElement.schedule_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:2010:25)\n    at WebElement.sendKeys (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:2174:19)\n    at actionFn (/usr/local/lib/node_modules/protractor/built/element.js:89:44)\n    at Array.map (<anonymous>)\n    at /usr/local/lib/node_modules/protractor/built/element.js:461:65\n    at ManagedPromise.invokeCallback_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2927:27Error\n    at ElementArrayFinder.applyAction_ (/usr/local/lib/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (/usr/local/lib/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (/usr/local/lib/node_modules/protractor/built/element.js:831:22)\n    at Object.uploadFileIntoInputField (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/inputFieldInteractions.js:26:15)\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:69:16)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "008a00ff-00bd-009c-0029-000200e60035.png",
        "timestamp": 1580257248559,
        "duration": 12764
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "ba53b80e356431da8785d4a327ac5a92",
        "instanceId": 25400,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: element not interactable\n  (Session info: chrome=79.0.3945.130)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'MBP-de-Itexico', ip: 'fe80:0:0:0:105d:69cc:fc8b:2109%en0', os.name: 'Mac OS X', os.arch: 'x86_64', os.version: '10.14.6', java.version: '1.8.0_211'\nDriver info: driver.version: unknown"
        ],
        "trace": [
            "WebDriverError: element not interactable\n  (Session info: chrome=79.0.3945.130)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'MBP-de-Itexico', ip: 'fe80:0:0:0:105d:69cc:fc8b:2109%en0', os.name: 'Mac OS X', os.arch: 'x86_64', os.version: '10.14.6', java.version: '1.8.0_211'\nDriver info: driver.version: unknown\n    at Object.checkLegacyResponse (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/error.js:546:15)\n    at parseHttpResponse (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/http.js:509:13)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:89:5)\nFrom: Task: WebElement.sendKeys()\n    at thenableWebDriverProxy.schedule (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:807:17)\n    at WebElement.schedule_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:2010:25)\n    at WebElement.sendKeys (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:2174:19)\n    at actionFn (/usr/local/lib/node_modules/protractor/built/element.js:89:44)\n    at Array.map (<anonymous>)\n    at /usr/local/lib/node_modules/protractor/built/element.js:461:65\n    at ManagedPromise.invokeCallback_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2927:27Error\n    at ElementArrayFinder.applyAction_ (/usr/local/lib/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (/usr/local/lib/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (/usr/local/lib/node_modules/protractor/built/element.js:831:22)\n    at Object.uploadFileIntoInputField (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/inputFieldInteractions.js:26:15)\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:69:16)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00b60092-0010-006e-0059-004f006e000c.png",
        "timestamp": 1580257294551,
        "duration": 12702
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "f9759c0890459aed153447f8128cd0f8",
        "instanceId": 25441,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580257339373,
        "duration": 27803
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "8b03dc390a84b43d7884d0ee6e8dd7f8",
        "instanceId": 25490,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580257805155,
        "duration": 27844
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "594b1d53a1d66cb311b0380f764d1029",
        "instanceId": 25568,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: element with locator 'By(css selector, input.file-input)' is not present.\nWait timed out after 3000ms"
        ],
        "trace": [
            "TimeoutError: element with locator 'By(css selector, input.file-input)' is not present.\nWait timed out after 3000ms\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2201:17\n    at ManagedPromise.invokeCallback_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2927:27\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:89:5)\nFrom: Task: element with locator 'By(css selector, input.file-input)' is not present.\n    at scheduleWait (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2188:20)\n    at ControlFlow.wait (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2517:12)\n    at thenableWebDriverProxy.wait (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/webdriver.js:934:29)\n    at run (/usr/local/lib/node_modules/protractor/built/browser.js:59:33)\n    at ProtractorBrowser.to.<computed> [as wait] (/usr/local/lib/node_modules/protractor/built/browser.js:67:16)\n    at Object.waitForElementPresence (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/waiters.js:10:11)\n    at Object.uploadFileIntoInputField (/Users/teodoropulos/orbinet2/node_modules/protractor-helper/src/inputFieldInteractions.js:25:11)\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:77:26)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "008300b1-001f-001d-0054-00dc00a800ff.png",
        "timestamp": 1580258337256,
        "duration": 15766
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "540ffe13eaa58f4d3e8edeca7a9ba72c",
        "instanceId": 25608,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580258394361,
        "duration": 27880
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "0c0b17609ec597b0ade1d49a4cddddae",
        "instanceId": 25655,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580258466390,
        "duration": 27745
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "c8e79816bb64246dd4248561846891ce",
        "instanceId": 25725,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: driver is not defined"
        ],
        "trace": [
            "ReferenceError: driver is not defined\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:71:26)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2974:25\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00cb0051-008a-0024-006c-00ec00110023.png",
        "timestamp": 1580259087489,
        "duration": 18
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "fc3050f538af278645b175dfa2f119ec",
        "instanceId": 25768,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: driver is not defined"
        ],
        "trace": [
            "ReferenceError: driver is not defined\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:74:9)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2974:25\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00930083-0010-0069-0027-0064000100e9.png",
        "timestamp": 1580259165327,
        "duration": 19
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "03da1ad5bda48c440e2eafc3150c5fad",
        "instanceId": 25807,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: executeScript is not defined"
        ],
        "trace": [
            "ReferenceError: executeScript is not defined\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:74:9)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2974:25\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00800077-0091-00da-00d8-001c00b4009a.png",
        "timestamp": 1580259188828,
        "duration": 24
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "8d84b46c5c96aa60636d2c4b309bc817",
        "instanceId": 25860,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: WebDriver is not defined"
        ],
        "trace": [
            "ReferenceError: WebDriver is not defined\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:73:10)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2974:25\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00460061-00dd-00f4-0005-006c00bf0056.png",
        "timestamp": 1580259254093,
        "duration": 27
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "a0de2183e6c88be82c79db49e8b14013",
        "instanceId": 25930,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: driver.executeScript is not a function"
        ],
        "trace": [
            "TypeError: driver.executeScript is not a function\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:75:17)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2974:25\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "008a00e6-0060-004e-00ad-008b002700d6.png",
        "timestamp": 1580259350685,
        "duration": 22
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "1e69191bfd3813cce0f53ae3577e9641",
        "instanceId": 26012,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: driver.executeScript is not a function"
        ],
        "trace": [
            "TypeError: driver.executeScript is not a function\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:75:17)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2974:25\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00f00011-00e9-0029-00e7-005300780048.png",
        "timestamp": 1580259564519,
        "duration": 20
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "a3d210f25f490f8ed470976bfeebcead",
        "instanceId": 26051,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580259607514,
        "duration": 27798
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "53ebf54f69fd68975885c9cc1101d94d",
        "instanceId": 26098,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580259768096,
        "duration": 27699
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "757202246eb9bfbeaf556a9a071ac1ce",
        "instanceId": 26138,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580259839206,
        "duration": 27648
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "e2337dbb4071385b0ded352e109012e2",
        "instanceId": 26191,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: WebDriver is not defined"
        ],
        "trace": [
            "ReferenceError: WebDriver is not defined\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:76:13)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2974:25\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "0099001f-00e1-00fb-00d6-006500fb00c3.png",
        "timestamp": 1580259910813,
        "duration": 19
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": false,
        "pending": false,
        "os": "mac os x",
        "sessionId": "e45f4c9fb25b91bd1ae6af558715177a",
        "instanceId": 26233,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": [
            "Failed: driver.executeScript is not a function"
        ],
        "trace": [
            "TypeError: driver.executeScript is not a function\n    at LoginPage.loginToOrbiNetworkPlattform (/Users/teodoropulos/orbinet2/page_objects/LoginPage.js:76:20)\n    at UserContext.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:18:19)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2974:25\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\nFrom: Task: Run it(\"Test Start\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:16:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/teodoropulos/orbinet2/tests/LoginTest.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:774:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:785:10)\n    at Module.load (internal/modules/cjs/loader.js:641:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:556:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00410010-009f-00dd-00a9-009900fa0076.png",
        "timestamp": 1580259926931,
        "duration": 14
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "c82a2505b98adbc5838517d507eeef86",
        "instanceId": 26405,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580260567012,
        "duration": 17157
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "eac8c87cc8a827097725950cf8c05d9b",
        "instanceId": 26451,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580260627251,
        "duration": 22118
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "f2aaa38a05656198787b70b38570f89a",
        "instanceId": 26535,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580260907089,
        "duration": 23150
    },
    {
        "description": "Test Start|Login to OrbinetWork",
        "passed": true,
        "pending": false,
        "os": "mac os x",
        "sessionId": "0fe3f0ad1031304f1e33645e009e891c",
        "instanceId": 26631,
        "browser": {
            "name": "chrome",
            "version": "79.0.3945.130"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1580261454084,
        "duration": 24085
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});

    };

    this.setTitle = function () {
        var title = $('.report-title').text();
        titleService.setTitle(title);
    };

    // is run after all test data has been prepared/loaded
    this.afterLoadingJobs = function () {
        this.sortSpecs();
        this.setTitle();
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    } else {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.afterLoadingJobs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.afterLoadingJobs();
    }

}]);

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

//formats millseconds to h m s
app.filter('timeFormat', function () {
    return function (tr, fmt) {
        if(tr == null){
            return "NaN";
        }

        switch (fmt) {
            case 'h':
                var h = tr / 1000 / 60 / 60;
                return "".concat(h.toFixed(2)).concat("h");
            case 'm':
                var m = tr / 1000 / 60;
                return "".concat(m.toFixed(2)).concat("min");
            case 's' :
                var s = tr / 1000;
                return "".concat(s.toFixed(2)).concat("s");
            case 'hm':
            case 'h:m':
                var hmMt = tr / 1000 / 60;
                var hmHr = Math.trunc(hmMt / 60);
                var hmMr = hmMt - (hmHr * 60);
                if (fmt === 'h:m') {
                    return "".concat(hmHr).concat(":").concat(hmMr < 10 ? "0" : "").concat(Math.round(hmMr));
                }
                return "".concat(hmHr).concat("h ").concat(hmMr.toFixed(2)).concat("min");
            case 'hms':
            case 'h:m:s':
                var hmsS = tr / 1000;
                var hmsHr = Math.trunc(hmsS / 60 / 60);
                var hmsM = hmsS / 60;
                var hmsMr = Math.trunc(hmsM - hmsHr * 60);
                var hmsSo = hmsS - (hmsHr * 60 * 60) - (hmsMr*60);
                if (fmt === 'h:m:s') {
                    return "".concat(hmsHr).concat(":").concat(hmsMr < 10 ? "0" : "").concat(hmsMr).concat(":").concat(hmsSo < 10 ? "0" : "").concat(Math.round(hmsSo));
                }
                return "".concat(hmsHr).concat("h ").concat(hmsMr).concat("min ").concat(hmsSo.toFixed(2)).concat("s");
            case 'ms':
                var msS = tr / 1000;
                var msMr = Math.trunc(msS / 60);
                var msMs = msS - (msMr * 60);
                return "".concat(msMr).concat("min ").concat(msMs.toFixed(2)).concat("s");
        }

        return tr;
    };
});


function PbrStackModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;
    ctrl.convertTimestamp = convertTimestamp;
    ctrl.isValueAnArray = isValueAnArray;
    ctrl.toggleSmartStackTraceHighlight = function () {
        var inv = !ctrl.rootScope.showSmartStackTraceHighlight;
        ctrl.rootScope.showSmartStackTraceHighlight = inv;
    };
    ctrl.applySmartHighlight = function (line) {
        if ($rootScope.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return '';
    };
}


app.component('pbrStackModal', {
    templateUrl: "pbr-stack-modal.html",
    bindings: {
        index: '=',
        data: '='
    },
    controller: PbrStackModalController
});

function PbrScreenshotModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;

    /**
     * Updates which modal is selected.
     */
    this.updateSelectedModal = function (event, index) {
        var key = event.key; //try to use non-deprecated key first https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/keyCode
        if (key == null) {
            var keyMap = {
                37: 'ArrowLeft',
                39: 'ArrowRight'
            };
            key = keyMap[event.keyCode]; //fallback to keycode
        }
        if (key === "ArrowLeft" && this.hasPrevious) {
            this.showHideModal(index, this.previous);
        } else if (key === "ArrowRight" && this.hasNext) {
            this.showHideModal(index, this.next);
        }
    };

    /**
     * Hides the modal with the #oldIndex and shows the modal with the #newIndex.
     */
    this.showHideModal = function (oldIndex, newIndex) {
        const modalName = '#imageModal';
        $(modalName + oldIndex).modal("hide");
        $(modalName + newIndex).modal("show");
    };

}

app.component('pbrScreenshotModal', {
    templateUrl: "pbr-screenshot-modal.html",
    bindings: {
        index: '=',
        data: '=',
        next: '=',
        previous: '=',
        hasNext: '=',
        hasPrevious: '='
    },
    controller: PbrScreenshotModalController
});

app.factory('TitleService', ['$document', function ($document) {
    return {
        setTitle: function (title) {
            $document[0].title = title;
        }
    };
}]);


app.run(
    function ($rootScope, $templateCache) {
        //make sure this option is on by default
        $rootScope.showSmartStackTraceHighlight = true;
        
  $templateCache.put('pbr-screenshot-modal.html',
    '<div class="modal" id="imageModal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="imageModalLabel{{$ctrl.index}}" ng-keydown="$ctrl.updateSelectedModal($event,$ctrl.index)">\n' +
    '    <div class="modal-dialog modal-lg m-screenhot-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="imageModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="imageModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <img class="screenshotImage" ng-src="{{$ctrl.data.screenShotFile}}">\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <div class="pull-left">\n' +
    '                    <button ng-disabled="!$ctrl.hasPrevious" class="btn btn-default btn-previous" data-dismiss="modal"\n' +
    '                            data-toggle="modal" data-target="#imageModal{{$ctrl.previous}}">\n' +
    '                        Prev\n' +
    '                    </button>\n' +
    '                    <button ng-disabled="!$ctrl.hasNext" class="btn btn-default btn-next"\n' +
    '                            data-dismiss="modal" data-toggle="modal"\n' +
    '                            data-target="#imageModal{{$ctrl.next}}">\n' +
    '                        Next\n' +
    '                    </button>\n' +
    '                </div>\n' +
    '                <a class="btn btn-primary" href="{{$ctrl.data.screenShotFile}}" target="_blank">\n' +
    '                    Open Image in New Tab\n' +
    '                    <span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>\n' +
    '                </a>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

  $templateCache.put('pbr-stack-modal.html',
    '<div class="modal" id="modal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="stackModalLabel{{$ctrl.index}}">\n' +
    '    <div class="modal-dialog modal-lg m-stack-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="stackModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="stackModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <div ng-if="$ctrl.data.trace.length > 0">\n' +
    '                    <div ng-if="$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer" ng-repeat="trace in $ctrl.data.trace track by $index"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                    <div ng-if="!$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in $ctrl.data.trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '                <div ng-if="$ctrl.data.browserLogs.length > 0">\n' +
    '                    <h5 class="modal-title">\n' +
    '                        Browser logs:\n' +
    '                    </h5>\n' +
    '                    <pre class="logContainer"><div class="browserLogItem"\n' +
    '                                                   ng-repeat="logError in $ctrl.data.browserLogs track by $index"><div><span class="label browserLogLabel label-default"\n' +
    '                                                                                                                             ng-class="{\'label-danger\': logError.level===\'SEVERE\', \'label-warning\': logError.level===\'WARNING\'}">{{logError.level}}</span><span class="label label-default">{{$ctrl.convertTimestamp(logError.timestamp)}}</span><div ng-repeat="messageLine in logError.message.split(\'\\\\n\') track by $index">{{ messageLine }}</div></div></div></pre>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <button class="btn btn-default"\n' +
    '                        ng-class="{active: $ctrl.rootScope.showSmartStackTraceHighlight}"\n' +
    '                        ng-click="$ctrl.toggleSmartStackTraceHighlight()">\n' +
    '                    <span class="glyphicon glyphicon-education black"></span> Smart Stack Trace\n' +
    '                </button>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

    });
