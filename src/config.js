const { config: startEnv } = require("dotenv");

startEnv();

const devToolsEnabled = process.env.DEV_TOOLS == "true";
const pyDistFolder = process.env.PY_DIST_FOLDER || "dist";
const pyFolder = process.env.PY_FOLDER || "backend";
const pyModule = process.env.PY_MODULE || "main";
const pyPort = process.env.PY_PORT || "4949";
const pyBin = process.env.PYTHON_BIN || "python";

module.exports = {
    devToolsEnabled, pyDistFolder, 
    pyFolder, pyModule, pyPort, pyBin
};