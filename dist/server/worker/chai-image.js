"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const logger_1 = require("../logger");
function default_1(matchImage, matchImages) {
    let isWarningShown = false;
    return function chaiImage({ Assertion }, utils) {
        utils.addMethod(Assertion.prototype, 'matchImage', async function (imageName) {
            if (!isWarningShown) {
                (0, logger_1.logger)().warn('`expect(...).to.matchImage()` is deprecated and will be removed in the next major release. Please use `context.matchImage()` instead.');
                isWarningShown = true;
            }
            const image = utils.flag(this, 'object');
            await matchImage(image, imageName);
        });
        utils.addMethod(Assertion.prototype, 'matchImages', async function () {
            if (!isWarningShown) {
                (0, logger_1.logger)().warn('`expect(...).to.matchImages()` is deprecated and will be removed in the next major release. Please use `context.matchImages()` instead.');
                isWarningShown = true;
            }
            const images = utils.flag(this, 'object');
            await matchImages(images);
        });
    };
}
//# sourceMappingURL=chai-image.js.map