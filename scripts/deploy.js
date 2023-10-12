// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const path = require("path");

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  // Deploy and save EventCreator contract 
  const EventCreator = await ethers.getContractFactory("EventCreator");
  const eventCreator = await EventCreator.deploy();
  await eventCreator.deployed();
  console.log("EventCreator address:", eventCreator.address);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(token, eventCreator);
}

function saveFrontendFiles(token, eventCreator) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ Token: token.address, EventCreator: eventCreator.address }, undefined, 2)
  );

  const TokenArtifact = artifacts.readArtifactSync("Token");
  const EventCreatorArtifact = artifacts.readArtifactSync("EventCreator");
  const EventArtifact = artifacts.readArtifactSync("Event");

  fs.writeFileSync(
    path.join(contractsDir, "Token.json"),
    JSON.stringify(TokenArtifact, null, 2)
  );
  fs.writeFileSync(
    path.join(contractsDir, "EventCreator.json"),
    JSON.stringify(EventCreatorArtifact, null, 2)
  );
  fs.writeFileSync(
    path.join(contractsDir, "Event.json"),
    JSON.stringify(EventArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
