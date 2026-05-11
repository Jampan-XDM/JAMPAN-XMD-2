const express = require("express")
const app = express()

const {
  getPairCode,
  startJampan
} = require("./pair")

app.get("/", (req, res) => {
  res.send("JAMPAN XMD ONLINE ✅")
})

app.get("/code", async (req, res) => {

  const number = req.query.number

  if (!number) {
    return res.send("Enter number")
  }

  const data = await getPairCode(number)

  if (!data.status) {
    return res.send(data.message)
  }

  res.send(data.code || data.message)
})

const PORT =
  process.env.PORT || 3000

app.listen(PORT, async () => {

  console.log(
    `✅ SERVER RUNNING ON ${PORT}`
  )

  await startJampan()
})