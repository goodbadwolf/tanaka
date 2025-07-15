export function getConfig() {
  return {
    serverUrl: process.env.SERVER_URL ?? "http://localhost:3000",
  }
}
