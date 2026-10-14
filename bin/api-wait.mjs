import http from "http"

const startDelay = Number(process.env.START_DELAY_SECONDS) || 20
const failThrough = Number(process.env.FAILTHROUGH_AFTER_SECONDS) || 180
const intervalMilliseconds = 2000

console.log("Checking if API is already up...")
http
  .get("http://api:3000/_status", (res) => {
    if (res.statusCode === 200) {
      console.log("API is ready (immediate check)")
      process.exit(0)
    }
    startNormalCheck()
  })
  .on("error", () => {
    startNormalCheck()
  })

function startNormalCheck() {
  setTimeout(() => {
    console.log("Waiting for API service...")
    const start = Date.now()

    const tick = () => {
      http
        .get("http://api:3000/_status", (res) => {
          if (res.statusCode === 200) {
            console.log("API is ready")
            process.exit(0)
          }
          retry()
        })
        .on("error", retry)
    }

    const retry = () => {
      const elapsed = (Date.now() - start) / 1000
      if (elapsed >= failThrough) {
        console.log(`API is ready (fail-through after ${failThrough}s)`)
        process.exit(0)
      }

      console.log(`API is not ready (${Math.floor(elapsed)}s/${failThrough}s)`)
      setTimeout(tick, intervalMilliseconds)
    }

    tick()
  }, startDelay * 1000)
}
