const expect = require("chai").expect;
const fs = require("fs");

const launch = require("../").launch;
const kernelspecs = require("kernelspecs");

describe("launch", () => {
  let spawnResult;
  it("spawns a kernel", done => {
    kernelspecs
      .findAll()
      .then(kernels => {
        const kernel = kernels.python2 || kernels.python3;
        return launch(kernel.name);
      })
      .then(c => {
        spawnResult = c;
        expect(c).to.not.be.null;
        expect(c.spawn).to.not.be.null;
        expect(fs.existsSync(c.connectionFile)).to.be.true;
        c.spawn.kill();
        done();
      });
  });

  it("cleans up connection files", () => {
    const { connectionFile } = spawnResult;
    expect(fs.existsSync(connectionFile)).to.be.false;
  });
});
