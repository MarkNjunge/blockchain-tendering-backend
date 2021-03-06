const { exec } = require("child_process");
const semver = require("semver");

(async () => {
  const all = process.argv[2] ? true : false;
  await removeContainers(all);
  await removeImages(all);
})();

async function removeContainers(removeAll) {
  let listContainersRes;
  try {
    listContainersRes = await execAwait(
      "docker ps -a | awk '{print $1 \" \" $2}' | grep dev-peer0.org1.example.com-tendering"
    );
  } catch (e) {
    // This will fail if there are no valid containers
    return;
  }

  // Get the stale verions
  let containers = listContainersRes.stdout
    .split("\n")
    .map(v => {
      return {
        containerId: v.split(" ")[0],
        version: v
          .split(" ")[1]
          .split(/dev-peer0\.org1\.example\.com-tendering-/)[1]
          .split(/-.*/)[0]
      };
    })
    .sort((a, b) => semver.rcompare(a.version, b.version)); // Sort the versions

  if (!removeAll) {
    containers = [containers.pop()]; // Remove the latest (at the end of the array)
  }

  await asyncForEach(containers, async c => {
    console.log(`Stopping ${c.containerId}...`);
    const { stdout, stderr } = await execAwait(
      `docker stop ${c.containerId} && docker rm ${c.containerId}`
    );
    console.log(stdout);
    console.log(stderr);
  });
}

async function removeImages(removeAll) {
  let res;
  try {
    res = await execAwait(
      "docker images | awk '{print $1 \" \" $3}' | grep dev-peer0.org1.example.com-tendering"
    );
  } catch (e) {
    // This will fail if there are no valid containers
    return;
  }

  // Get the stale verions
  let images = res.stdout
    .split("\n")
    .map(v => {
      return {
        imageId: v.split(" ")[1],
        version: v
          .split(" ")[0]
          .split(/dev-peer0\.org1\.example\.com-tendering-/)[1]
          .split(/-.*/)[0]
      };
    })
    .sort((a, b) => semver.rcompare(a.version, b.version)); // Sort the versions

  if (!removeAll) {
    images = [images.pop()]; // Remove the latest (at the end of the array)
  }

  await asyncForEach(images, async c => {
    console.log(`Stopping ${c.imageId}...`);
    const { stdout, stderr } = await execAwait(`docker rmi ${c.imageId}`);
    console.log(stdout);
    console.log(stderr);
  });
}

function execAwait(command) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ stdout: stdout.trim(), stderr });
    });
  });
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
