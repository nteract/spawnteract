# Spawnteract

Spawn yourself a Jupyter kernel backend.

```
npm install --save spawnteract
```

## Usage

```javascript
const spawnteract = require('spawnteract')

spawnteract.launch('python3').then(kernel => {
  // Returns
  // kernel.spawn <-- The running process, from child_process.spawn(...)
  // kernel.connectionFile <-- Connection file path
  // kernel.config <-- Connection information from the file

  // Print the ip address and port for the shell channel
   console.log(kernel.config.ip + ':' + kernel.config.shell_port);
})
```

`spawnteract` will automatically delete the connection file after the kernel
process exits or errors out.

To disable this feature, set `cleanupConnectionFile` to `false` in the `spawnOptions`:

  ```js
  launch(kernelName, { cleanupConnectionFile: false });
  ```

You'll should close `kernel.spawn` when a user shuts down the kernel. If you disabled automatic cleanup, you will need to delete `kernel.connectionFile` from disk when finished:

```js
function cleanup(kernel) {
  kernel.spawn.kill();
  // Only do this second part if you opted out of automatic cleanup:
  fs.unlink(kernel.connectionFile);
}
```

*For more info, see our [changelog](https://github.com/nteract/spawnteract/blob/master/CHANGELOG.md) 
or open an issue with questions*

You will probably end up wanting to use this with [enchannel-zmq-backend](https://github.com/nteract/enchannel-zmq-backend).
