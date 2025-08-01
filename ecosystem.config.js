module.exports = {
  apps: [
    {
      name: 'deno-backend',
      script: './start-backend.sh',
      interpreter: '/bin/bash', // ✅ Use bash to run .sh scripts
      watch: true
    },
    {
      name: 'vite-frontend',
      script: './start-frontend.sh',
      interpreter: '/bin/bash', // ✅ Use bash to run .sh scripts
      watch: true
    }
  ]
}
