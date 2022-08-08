let probes = [];
let autobots = [];
let targets = [];
let shipPriority = "Closest";
// let ship;
let uniqueDeletionList;
let allTargets = [];
let numberOfTargets = 500;
let armySize = 5;
let path;
let follow = undefined;
let deletionList = [];

function setup() {
  //make a p5 button
  createCanvas(1000, 700);
  let button = createButton("toggle patrol / wander");
  button.mousePressed(togglePath);
  button.position(width - 200, height - 60);

  //create button to toggle priority
  let button2 = createButton("toggle priority");
  button2.mousePressed(togglePriority);
  button2.position(width - 300, height - 30);

  //make a p5 slider to adjust path.radius
  let slider = createSlider(10, 200, 20);
  slider.position(width - 180, height - 25);
  slider.style("width", "100px");
  slider.input(changeRadius);
  //slider label
  let label = createP("set patrol radius");
  label.position(width - 180, height - 55);

  function changeRadius() {
    path.radius = slider.value();
  }
  function togglePath() {
    if (path) {
      path = undefined;
    } else {
      newPath();
    }
  }
  function togglePriority() {
    if (shipPriority === "Most Valuable") {
      shipPriority = "Closest";
    } else {
      shipPriority = "Most Valuable";
    }
  }

  for (let i = 0; i < armySize; i++) {
    autobots.push(new Drone(random(width), random(height)));
  }
  for (let i = 0; i < autobots.length; i++) {
    autobots[i].addRadar(75, 2, 0.5);
    autobots[i].addRadar(250, 1, 0.005);
    // autobots[i].addRadar(300, 1, 1);
    // autobots[i].addPing(
    //   (range = 50),
    //   (frequency = 10),
    //   (scanWidthInDegrees = 30),
    //   (debug = false),
    //   (targetFiltering = true)
    // );
  }

  // newPath();
  generateTargets();
}
function generateTargets() {
  while (targets.length < numberOfTargets) {
    targets.push(new Target(random(width), random(height)));
  }
  //make 20 high value targets
  for (let i = 0; i < 20; i++) {
    let target = new Target(random(width), random(height));
    target.value = 100;
    targets.push(target);
  }
}
function draw() {
  if (targets.length < 1) {
    generateTargets();
  }
  //
  //
  //
  //
  //

  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //

  background(220);

  for (probe of probes) {
    probe.probeManagment(targets, autobots);
  }
  for (autobot of autobots) {
    autobot.droneManagement(targets, autobots);
  }
  for (target of targets) {
    target.show();
  }
  //target deletion management
  //for each autobot check if it is within the radius of a target

  //if an autobot is within r*2 of a target, add it to the deletionList
  function bufferManagement() {
    for (let i = 0; i < autobots.length; i++) {
      for (let j = 0; j < targets.length; j++) {
        if (
          dist(
            autobots[i].pos.x,
            autobots[i].pos.y,
            targets[j].pos.x,
            targets[j].pos.y
          ) <=
          autobots[i].r * 2
        ) {
          let killvalue = floor(targets[j].value);
          deletionList.push(targets[j].name);
          autobots[i].kills += killvalue;
        }
      }
    }
    // console.log("deletion list:", deletionList);
    //remove duplicates from deletionList
    uniqueDeletionList = [];
    for (let i = 0; i < deletionList.length; i++) {
      if (!uniqueDeletionList.includes(deletionList[i])) {
        uniqueDeletionList.push(deletionList[i]);
      }
      deletionList = [];
    }
    // console.log(uniqueDeletionList);
    //check all the sensor buffers for targets with the names in uniqueDeletionList
    for (let i = 0; i < autobots.length; i++) {
      for (let j = 0; j < autobots[i].sensors.length; j++) {
        for (let k = 0; k < autobots[i].sensors[j].buffer.length; k++) {
          if (
            uniqueDeletionList.includes(autobots[i].sensors[j].buffer[k].name)
          ) {
            autobots[i].sensors[j].buffer.splice(k, 1);
          }
          if (!targets.includes(autobots[i].sensors[j].buffer[k])) {
            autobots[i].sensors[j].buffer.splice(k, 1);
          }
        }
      }
    }
    // console.log("scan for targets in probes");
    for (let i = 0; i < probes.length; i++) {
      for (let j = 0; j < probes[i].sensors.length; j++) {
        for (let k = 0; k < probes[i].sensors[j].buffer.length; k++) {
          if (
            uniqueDeletionList.includes(probes[i].sensors[j].buffer[k].name)
          ) {
            probes[i].sensors[j].buffer.splice(k, 1);
          }
          // if (!targets.includes(probes[i].sensors[j].buffer[k])) {
          //   probes[i].sensors[j].buffer.splice(k, 1);
          // }
          // if (probes[i].sensors[j].buffer[k]?.timeOut < 0) {
          //   probes[i].sensors[j].buffer.splice(k, 1);
          // }
        }
      }
    }
    //remove targets from the targets array whose name is in uniqueDeletionList
    for (let j = 0; j < targets.length; j++) {
      if (uniqueDeletionList.includes(targets[j].name)) {
        targets.splice(j, 1);
      }
    }
  }
  bufferManagement();

  //draw a rectangle across the bottom of the screen to show
  fill(200, 200, 200, 200);
  rect(0, 690 - autobots.length * 12, width, height);
  textSize(12);
  fill(0, 0, 0, 255);

  for (let i = 0; i < autobots.length; i++) {
    strokeWeight(0);
    stroke(0, 0, 0, 255);
    fill(0, 0, 0, 255);
    text(autobots[i].name + ": " + autobots[i].kills, 10, 645 + i * 12);
    text(autobots[i].status, 100, 645 + i * 12);
    let currentText = "current target:" + autobots[i].currentTarget;
    let currentValue = ", value:" + autobots[i].currentTargetValue.toFixed(3);
    if (autobots[i].currentTarget == "No Target") {
      currentValue = "";
    }

    strokeWeight(0);
    text("Ship Priority: \n" + shipPriority, width - 290, height - 50);
    //find the targets index in the targets array
    let targetIndex = targets.findIndex(function (target) {
      return target.name == autobots[i].currentTarget;
    });
    //draw a sqauare around the current target
    if (autobots[i].currentTarget != "No Target") {
      strokeWeight(1);
      stroke(255, 0, 0, 128);
      fill(255, 0, 0, 100);
      if (targets[targetIndex]?.pos) {
        rect(
          targets[targetIndex].pos.x - targets[targetIndex].r,
          targets[targetIndex].pos.y - targets[targetIndex].r,
          targets[targetIndex].r * 2,
          targets[targetIndex].r * 2
        );
        // draw a line from the current target to the current autobot
        // stroke(0, 0, 0, 255);
        // line(
        //   autobots[i].pos.x,
        //   autobots[i].pos.y,
        //   targets[targetIndex].pos.x,
        //   targets[targetIndex].pos.y
        // );
      }
    }

    text(currentText + currentValue, 250, 645 + i * 12);
  }
  if (path) {
    path.show();
  }
}

function newPath() {
  // A path is a series of connected points
  // A more sophisticated path might be a curve
  path = new Path();
  let offset = 200;
  path.addPoint(offset, offset);
  path.addPoint(width / 2, offset - offset * 0.5);
  path.addPoint(width - offset, offset);

  path.addPoint(width - offset, height - offset);
  path.addPoint(width / 2, height - offset * 0.5);

  path.addPoint(offset, height - offset);
}
