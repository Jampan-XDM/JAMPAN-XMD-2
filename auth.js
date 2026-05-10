const fs = require("fs")

function ensureSession(path) {

    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true })
    }

}

module.exports = {
    ensureSession
}