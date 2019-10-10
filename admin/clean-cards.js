const { exec } = require("child_process");
const prompts = require("prompts");

main();

async function main() {
  const questions = [
    {
      type: "confirm",
      name: "delete",
      message: "Delete admin card?",
      initial: true
    }
  ];

  const response = await prompts(questions);
  const deleteAdmin = response.delete;

  let listCardsRes;
  listCardsRes = await execAwait(
    "composer card list | grep @tendering | awk '{print $2}'"
  );
  const cards = listCardsRes.stdout
    .trim()
    .split("\n")
    .filter(v => v != "");

  await asyncForEach(cards, async c => {
    if (c.includes("admin") && !deleteAdmin) {
      return;
    }
    console.log(`Deleting ${c}...`);
    const { stdout, stderr } = await execAwait(`composer card delete -c ${c}`);
    if (stderr) {
      console.log(stderr);
    } else {
      console.log(stdout);
    }
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
