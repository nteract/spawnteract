const expect = require("chai").expect;
const fs = require("fs");

const launch = require("../").launch;
const kernelspecs = require("kernelspecs");

function cleanup(connectionFile) {
  // cleanup after our test, fail silently if the test failed
  try {
    fs.unlinkSync(connectionFile);
  } catch (e) {
    return;
  }
}

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
});
