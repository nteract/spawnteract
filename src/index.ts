/**
 * This module contains methods that allow you to spawn Jupyter kernels.  You
 * can spawn kernels either by name or by a kernelSpec object (see the
 * `kernelspecs` npm package for more information).
 *
 * Usage example:
 * ```js
 * var spawnResults = require('spawnteract').launch('python3');
 *
 * // Print the ip address and port for the shell channel
 * console.log(spawnResults.config.ip + ':' + spawnResults.config.shell_port);
 * ```
 *
 * You'll need to close `spawnResults.spawn` yourself as well as delete
 * `spawnResults.connectionFile` from disk when finished.
 *
 * @module spawnteract
 */

/* eslint camelcase: 0 */
// ^--- #justjupyterthings
import * as path from "path";
import * as fs from "fs";
import * as kernelspecs from "kernelspecs";
import * as jp from "jupyter-paths";
import { v4 as uuidv4 } from "uuid";
import { getPorts, PortFinderOptions } from "portfinder";
import * as jsonfile from "jsonfile";
import * as execa from "execa";
import * as mkdirp from "mkdirp";

function cleanup(connectionFile: string) {
  try {
    fs.unlinkSync(connectionFile);
  } catch (e) {
    return;
  }
}

type PortsArray = [number, number, number, number, number];

type ConnectionInfo = {
  version: 5;
  key: string;
  signature_scheme: string;
  transport: "tcp" | "ipc";
  ip: string;
  hb_port: number;
  control_port: number;
  shell_port: number;
  stdin_port: number;
  iopub_port: number;
};

/**
 * Creates a connectionInfo object given an array of ports
 */
function createConnectionInfo(ports: PortsArray): ConnectionInfo {
  return {
    version: 5,
    key: uuidv4(),
    signature_scheme: "hmac-sha256",
    transport: "tcp",
    ip: "127.0.0.1",
    hb_port: ports[0],
    control_port: ports[1],
    shell_port: ports[2],
    stdin_port: ports[3],
    iopub_port: ports[4]
  };
}

type ConnectionFileResponse = {
  config: ConnectionInfo;
  connectionFile: string;
};

/**
 * Write a connection file to disk with found ports
 */
function writeConnectionFile(
  portFinderOptions?: PortFinderOptions
): Promise<ConnectionFileResponse> {
  const options = Object.assign({}, portFinderOptions);
  options.port = options.port || 9000;
  options.host = options.host || "127.0.0.1";

  return new Promise((resolve, reject) => {
    getPorts(5, options, (err: Error, ports: PortsArray) => {
      if (err) {
        reject(err);
      } else {
        // Make sure the kernel runtime dir exists before trying to write the
        // kernel file.
        const runtimeDir = jp.runtimeDir();
        mkdirp(runtimeDir);

        // Write the kernel connection file.
        const config = createConnectionInfo(ports);
        const connectionFile = path.join(
          jp.runtimeDir(),
          `kernel-${uuidv4()}.json`
        );
        jsonfile.writeFile(connectionFile, config, jsonErr => {
          if (jsonErr) {
            reject(jsonErr);
          } else {
            resolve({
              config,
              connectionFile
            });
          }
        });
      }
    });
  });
}

/**
 * Launch a kernel for a given kernelSpec
 */
async function launchSpec(kernelSpec, spawnOptions) {
  const { config, connectionFile } = await writeConnectionFile();
  return launchSpecFromConnectionInfo(
    kernelSpec,
    config,
    connectionFile,
    spawnOptions
  );
}

/**
 * Launch a kernel for a given kernelSpec and connection info
 */
function launchSpecFromConnectionInfo(
  kernelSpec,
  config: ConnectionInfo,
  connectionFile: string,
  spawnOptions
) {
  const argv = kernelSpec.argv.map(x =>
    x === "{connection_file}" ? connectionFile : x
  );

  const defaultSpawnOptions = {
    stdio: "ignore"
  };
  const env = Object.assign({}, process.env, kernelSpec.env);
  const fullSpawnOptions = Object.assign(
    {},
    defaultSpawnOptions,
    { env: env },
    spawnOptions
  );

  const runningKernel = execa(argv[0], argv.slice(1), fullSpawnOptions);

  runningKernel.on("exit", (code, signal) => cleanup(connectionFile));
  runningKernel.on("error", (code, signal) => cleanup(connectionFile));

  return {
    spawn: runningKernel,
    connectionFile,
    config,
    kernelSpec
  };
}

/**
 * Launch a kernel by name
 */
function launch(kernelName: string, spawnOptions, specs) {
  // Let them pass in a cached specs file
  if (!specs) {
    return kernelspecs
      .findAll()
      .then(sp => launch(kernelName, spawnOptions, sp));
  }
  if (!specs[kernelName]) {
    return Promise.reject(new Error(`No spec available for ${kernelName}`));
  }
  const spec = specs[kernelName].spec;
  return launchSpec(spec, spawnOptions);
}

module.exports = {
  launch,
  launchSpec,
  launchSpecFromConnectionInfo
};
