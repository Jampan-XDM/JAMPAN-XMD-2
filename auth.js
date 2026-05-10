const fs = require("fs")

function ensureSessionFolder(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true })
    }
}

module.exports = { ensureSessionFolder }