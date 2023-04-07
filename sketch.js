let probes = []; //array to hold all the probes
let autobots = []; //array to hold all the autobots (everything)
let targets = []; //array to hold all the targets
let shipPriority = "Closest"; //or "Highest Value"
let stations = []; //array to hold all the stations
// let allTargets = [];
let numberOfTargets = 75;
let armySize = 24;
let path;
let patrolPath;
let follow = undefined;
let deletionList = [];

function setup() {
  //create canvas 20 pixels smaller than the window
  createCanvas(windowWidth - 20, windowHeight - 20);
  if (width < 500 || height < 500) {
    numberOfTargets = 25;
  }
  // createCanvas();

  //make the stations, if they are here
  stations.push(new Station(width / 2, height / 4));
  for (station of stations) {
    station.angle = random(-3.14, 3.14);
  }

  for (let i = 0; i < armySize; i++) {
    // spawn the drones
    //if there is a station, spawn the drones around it
    if (stations.length > 0) {
      let station = stations[0];
      let angle = random(-3.14, 3.14);
      let x = station.pos.x + cos(angle) * station.r * 2;
      let y = station.pos.y + sin(angle) * station.r * 2;
      autobots.push(new Drone(x, y));
    } else {
      autobots.push(new Drone(random(width), random(height)));
    }

    // add sensors to the drones
    autobots[i].addRadar(75, 0.1, 0.5);
    autobots[i].addRadar(250, 1, 0.0055);
    //
  }

  // path = newPath();
  path = parkingPattern(stations[0]);
  generateTargets();
}
function generateTargets() {
  let offset = 100;
  while (targets.length < numberOfTargets) {
    targets.push(
      new Target(
        random(offset, width - offset),
        random(offset, height - offset)
      )
    );
  }
  // //make 20 high value targets
  // for (let i = 0; i < 1; i++) {
  //   let target = new Target(random(width), random(height));
  //   target.value = 100;
  //   targets.push(target);
  // }
}
function draw() {
  if (targets.length < 1) {
    generateTargets();
  }

  background(220);
  for (station of stations) {
    //if any targets are within the radius of the station, slice them out of the targets array
    // for (let i = 0; i < targets.length; i++) {
    //   if (
    //     dist(station.pos.x, station.pos.y, targets[i].pos.x, targets[i].pos.y) <
    //     station.r * 4
    //   ) {
    //     targets.splice(i, 1);
    //     targets.push(new Target(random(width), random(height)));
    //   }
    // }

    station.show();
    //if there are any stations within r * 6 of each other, move them away from each other
    for (let i = 0; i < stations.length; i++) {
      for (let j = 0; j < stations.length; j++) {
        if (i !== j) {
          if (
            dist(
              stations[i].pos.x,
              stations[i].pos.y,
              stations[j].pos.x,
              stations[j].pos.y
            ) <
            stations[i].r * 6
          ) {
            stations[i].flee(stations[j]);
          }
        }
      }
    }
    station.edgesBounce();
    station.update();
  } //station management
  for (probe of probes) {
    probe.probeManagment(targets, autobots);
  }
  for (autobot of autobots) {
    autobot.droneManagement(targets, [...autobots, ...stations]);
  }
  for (target of targets) {
    target.show();
    target.update();
    // enables targets to move
  }

  //roof of the station
  for (station of stations) {
    station.showTop();
  }
  //if you click a station with the mouse, you can draw it around
  if (mouseIsPressed) {
    let stationSelected = false;
    for (station of stations) {
      if (stationSelected == false) {
        if (
          dist(station.pos.x, station.pos.y, mouseX, mouseY) <
          station.r * 2
        ) {
          station.pos.x = mouseX;
          station.pos.y = mouseY;
          stationSelected = true;
          path = parkingPattern(stations[0]);
        }
      }
    }
  }

  bufferManagement(autobots, targets);
  // drawInterface();
  //draw a rectangle across the bottom of the screen to show
  function drawInterface() {
    fill(200, 200, 200, 100);
    rect(0, height - autobots.length * 12 - 20, width, height);
    textSize(12);
    fill(0, 0, 0, 255);

    for (let i = 0; i < autobots.length; i++) {
      strokeWeight(0);
      stroke(0, 0, 0, 255);
      fill(0, 0, 0, 255);
      text(
        autobots[i].name + ": " + autobots[i].minedValue.toFixed(2),
        10,
        height - i * 12 - 10
      );
      text(autobots[i].status, 100, height - i * 12 - 10);
      let currentText = "current target:" + autobots[i].currentTarget;
      let currentValue = ", value:" + autobots[i].currentTargetValue.toFixed(3);
      if (autobots[i].currentTarget == "No Target") {
        currentValue = "";
      }

      strokeWeight(0);
      // text("Ship Priority: \n" + shipPriority, width - 290, height - 50);
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
        }
      }

      text(currentText + currentValue, 250, height - i * 12 - 10);
      //text with autobots[i].dockingStatus
      text(autobots[i].dockingStatus, 500, height - i * 12 - 10);
      //show station name and station status
    }
    text(
      stations[0].name + " " + floor(stations[0].minedValue),
      width - 300,
      height - 110
    );
    for (let j = 0; j < stations[0].ports.length; j++) {
      text(
        "port status:" + stations[0].ports[j].status,
        width - 300,
        height - j * 12 + 12 - 50
      );
    }
  }
  if (path) {
    // path.show();
  }
}
