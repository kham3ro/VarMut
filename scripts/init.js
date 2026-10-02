const appRoot = require('app-root-path');
const rootDir = appRoot.toString().replaceAll("\\", "/");
const fs = require('fs')

const varmutconfig =
    `module.exports = {  
      buildDir: "auto",
      contractsDir: "auto",
      testDir: "auto",
      skipContracts: ["interfaces", "mock", "test"],
      skipTests: [],
      testingFramework: "auto",
      minimalOperators: false,
      randomSampling: false,
      randomMutants: 100,
      testingTimeOutInSec: 500  
}`;

if (!fs.existsSync(rootDir + "/varmut-config.js")) {
    fs.writeFileSync(rootDir + "/varmut-config.js", varmutconfig)
}