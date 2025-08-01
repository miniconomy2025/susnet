module.exports = {
  apps: [
    {
      name: 'deno-backend',
      script: 'deno task dev',
      interpreter: 'deno',
      watch: true
    },
    {
      name: 'vite-frontend',
      script: 'deno task fe',
      interpreter: 'deno',
      watch: true
    }
  ]
}
