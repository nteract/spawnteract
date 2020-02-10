const expect = require("chai").expect;
const fs = require("fs");

const launch = require("../").launch;
const computeSpawnOptionsEnv = require("../").computeSpawnOptionsEnv;
const kernelspecs = require("kernelspecs");

function cleanup(connectionFile) {
  // cleanup after our test, fail silently if the test failed
  try {
    fs.unlinkSync(connectionFile);
  } catch (e) {
    return;
  }
}

// don't launch this, just for testing
const fakeKernelspec = {
  name: "myPython3",
  files: ["/usr/local/share/kernels/python3/kernel.json"],
  resources_dir: "/usr/local/share/kernels/python3",
  spec: {
    display_name: "My Python 3",
    argv: ["/usr/bin/python3", "-m", "ipykernel", "-f", "{connection_file}"],
    language: "python",
    env: {
      MyVar: "123"
    }
  }
};

describe("launch", () => {
  let spawnResult;
  let spawnResultNoCleanup;
  let kernelName;
  it("spawns a kernel", done => {
    kernelspecs
      .findAll()
      .then(kernels => {
        const kernel = kernels.python2 || kernels.python3;
        kernelName = kernel.name;
        return launch(kernelName);
      })
      .then(c => {
        spawnResult = c;
        expect(c).to.not.be.null;
        expect(c.spawn).to.not.be.null;
        expect(fs.existsSync(c.connectionFile)).to.be.true;
        c.spawn.kill();
        return launch(kernelName, { cleanupConnectionFile: false });
      })
      .then(c => {
        spawnResultNoCleanup = c;
        spawnResultNoCleanup.spawn.kill();
        done();
      });
  });

  it("cleans up connection files", done => {
    const { connectionFile } = spawnResult;
    setTimeout(() => {
      expect(fs.existsSync(connectionFile)).to.be.false;
      done();
    }, 100);
  });

  it("won't clean up connection file if opt out", done => {
    const { connectionFile } = spawnResultNoCleanup;
    setTimeout(() => {
      expect(fs.existsSync(connectionFile)).to.be.true;
      cleanup(connectionFile);
      done();
    }, 100);
  });

  it("processes env variables", done => {
    kernelspecs
      .findAll()
      .then(kernels => {
        const kernel = kernels.python2 || kernels.python3;
        kernelName = kernel.name;
        return launch(kernelName, { env: { FOOBAR: "BAZ" } });
      })
      .then(c => {
        // console.log(c.spawn.pid);
        c.spawn.kill();
        done();
      });
  });

  it("computes spawn options environment variables correctly", done => {
    kernelspecs.findAll().then(kernels => {
      const kernelSpec = kernels.python3 || kernels.python2;
      const so1 = { env: { FOOBAR: "BAZ" } };

      const env1 = computeSpawnOptionsEnv(kernelSpec, so1);
      expect(env1.FOOBAR == "BAZ").to.be.true;
      expect(env1.PATH.length > 0).to.be.true;

      const env2 = computeSpawnOptionsEnv(kernelSpec, {});
      expect(env2.PWD.indexOf("spawnteract") >= 0).to.be.true;
      expect(env2.PATH.length > 0).to.be.true;

      // testing merging
      const env3 = computeSpawnOptionsEnv(fakeKernelspec, so1);
      expect(env3.FOOBAR == "BAZ").to.be.true;
      expect(env3.MyVar == "123").to.be.true;

      // also test overriding
      const so2 = { env: { MyVar: "99" } };
      const env4 = computeSpawnOptionsEnv(fakeKernelspec, so2);
      expect(env4.MyVar == "99").to.be.true;

      done();
    });
  });
});
