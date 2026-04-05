"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReporter = getReporter;
const creevey_js_1 = require("./creevey.js");
const junit_js_1 = require("./junit.js");
const teamcity_js_1 = require("./teamcity.js");
function getReporter(reporter) {
    if (reporter === 'creevey')
        return creevey_js_1.CreeveyReporter;
    if (reporter === 'teamcity')
        return teamcity_js_1.TeamcityReporter;
    if (reporter === 'junit')
        return junit_js_1.JUnitReporter;
    return reporter;
}
//# sourceMappingURL=index.js.map