const validLaunchId = id => typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id);
function launchIdFrom(args) {
  const index = args.indexOf('--launch-id');
  const combined = args.find(arg => arg.startsWith('--launch-id='));
  const id = index >= 0 ? args[index + 1] : combined?.slice('--launch-id='.length);
  return validLaunchId(id) ? id : null;
}
module.exports = { validLaunchId, launchIdFrom };
