# `spawnteract`

# v5.1.0

### Allow opt-out of automatic connection file removal on process exit

- To disable, set `cleanupConnectionFile` to `false` in the `spawnOptions`:
  ```js
  launch(kernelName, { cleanupConnectionFile: false });
  ```
- Otherwise, the default will still be to remove the connection file on process exit

---

# v5.0.0

### Replaced `child_process.spawn` with [`execa`](https://github.com/sindresorhus/execa#execafile-arguments-options)

- In order to improve kernel process cleanup

- `execa` is built on top of `child_process` in a backward compatible fashion and returns a `ChildProcess` instance, so you will most likely not need to change anything to upgrade from `v4.0.0`

- Usage and arguments are backward compatible:

```
launch(kernelName, specs, spawnOptions)
launchSpec(kernelSpec, spawnOptions)
launchSpecFromConnectionInfo(kernelSpec, config, connectionFile, spawnOptions)
```

The differences are:

- `spawnOptions` will support [`execa` options](https://github.com/sindresorhus/execa#options), a superset of [`child_process` options](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options), adding functionality outlined in the `execa` API docs.

- While the `spawnResults` object is still an instance of [`ChildProcess`](https://nodejs.org/api/child_process.html#child_process_class_childprocess), `execa` adds some additional properties, which may or may not ever be useful for kernel processes.

From the docs, `execa`:

> returns a `ChildProcess` instance, which is enhanced to also be a Promise for a result Object with stdout and stderr properties.

### Automatic connection file cleanup:

- Once a kernel launched with `spawnteract` exits or errors out, `spawnteract` will attempt to delete that kernel's connection file.
- This will fail silently if the connection file is missing or any other potential problem prevents the file from being found and removed.
