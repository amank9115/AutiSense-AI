const { spawnSync } = require('child_process');
const path = require('path');

const backendDir = path.join('C:', 'Users', 'user', 'project', '5532537c', 'backend');
const prismaCmd = path.join(backendDir, 'node_modules', '.bin', 'prisma.cmd');

console.log('Backend dir:', backendDir);
console.log('Prisma cmd:', prismaCmd);

const result = spawnSync(
  prismaCmd,
  ['migrate', 'dev', '--name', 'saas-multi-tenancy'],
  {
    cwd: backendDir,
    encoding: 'utf8',
    shell: false,
    timeout: 90000,
    env: { ...process.env }
  }
);
console.log('STDOUT:', result.stdout || '(empty)');
console.log('STDERR:', result.stderr || '(empty)');
if (result.error) console.log('ERROR:', result.error.message);
console.log('Exit code:', result.status);
