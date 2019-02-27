// import Mocha from "mocha";
// import fs from "fs";
// import path from "path";

process.on("message", message => console.log(message));

// function addTests(mocha: Mocha, testDir: string) {
//   fs.readdirSync(testDir).forEach(function(file) {
//     mocha.addFile(path.join(testDir, file));
//   });
// }

// // creevey(config);
// const mocha = new Mocha();
// addTests(mocha, config.testDir);
