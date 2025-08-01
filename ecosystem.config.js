module.exports = {
  apps: [
    {
      name: 'deno-backend',
      script: './start-backend.sh',
      watch: true
    },
    {
      name: 'vite-frontend',
      script: './start-frontend.sh',
      watch: true
    }
  ]
}
