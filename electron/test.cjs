const { exec } = require('child_process')
exec('python voip.py', (_, stdout, stderr) => {
  console.log(stdout)
  console.log(stderr)
}) 