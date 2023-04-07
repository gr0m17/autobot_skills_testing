if (globalDeploymentStatus == true) {
  // console.log(numToDeploy);
  if (this.status != "deploying drones") {
    this.status = "deploying drones";
    //timeout for deploying drones
    // let numToDeploy = armySize - autobots.length;

    setTimeout(
      (() => {
        this.status = "idle";
      },
      10 * numToDeploy)
    );
    for (let i = 0; i < numToDeploy; i++) {
      console.log("deploying");
      setTimeout(() => {
        if (globalDeploymentStatus) {
          //make an array of all the inactive autobots
          let inactiveAutobots = autobots.filter((autobot) => {
            return autobot.active == false;
          });
          // console.log(inactiveAutobots);
          if (inactiveAutobots.length > 0) {
            inactiveAutobots[0].dockingPort = undefined;
            inactiveAutobots[0].status = "idle";
            // inactiveAutobots[0].dockingStation = undefined;
            inactiveAutobots[0].dockingStatus = "ready";
            inactiveAutobots[0].active = true;
            inactiveAutobots.shift();
          }
        }
      }, 0);
    }
  }
  //if autobots.length > armySize, then recall drones
  if (autobots.length > armySize) {
    let recallNumber = autobots.length - armySize;
    this.status = "recalling " + recallNumber + " drones";
    for (let i = 0; i < recallNumber; i++) {
      autobots[i].deploymentMode = false;
      autobots[i].status = "recalling";
      autobots[i].target = createVector(0, 0);
    }

    //

    this.status = "idle";
  }
}
