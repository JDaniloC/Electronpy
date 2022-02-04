const { config: startEnv } = require("dotenv");

startEnv();

const indexFolder = process.env.INDEX_FOLDER || "frontend";
const pyDistFolder = process.env.PY_DIST_FOLDER || "dist";
const devToolsEnabled = process.env.DEV_TOOLS == "true";
const pyFolder = process.env.PY_FOLDER || "backend";
const pyModule = process.env.PY_MODULE || "main";
const pyBin = process.env.PYTHON_BIN || "python";
const pyPort = process.env.PY_PORT || "4949";

module.exports = {
    devToolsEnabled, indexFolder, pyDistFolder, 
    pyFolder, pyModule, pyPort, pyBin
};