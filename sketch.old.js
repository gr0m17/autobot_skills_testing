let probes = [];
let autobots = [];
let targets = [];
let ship;
let allTargets = [];
let numberOfTargets = 1;
let armySize = 1;
let path;
let follow = undefined;
// function probeManagement() {
//   for (let i = 0; i < probes.length; i++) {
//     console.log("updating probe" + i);
//     probes[i].show();
//     probes[i].update();

// seperation.mult(probes[i].maxspeed); //this should be inside the probe update function
// seperation.sub(probes[i].velocity);
// seperation.limit(probes[i].maxforce);
// probes[i].applyForce(seperation.mag(probes[i].maxspeed));
// } //end for loop
// }
// function targetManagment() {
//   if (targets.length > 0) {
//     for (let i = 0; i < targets.length; i++) {
//       if (
//         dist(
//           autobots[0].pos.x,
//           autobots[0].pos.y,
//           targets[i].pos.x,
//           targets[i].pos.y
//         ) <=
//         autobots[0].r * 2
//       ) {
//         targets.splice(i, 1);
//       }
//     }
//   }
// }
function setup() {
  createCanvas(400, 700);
  ship = new Drone(width / 2, height / 2);
  newPath();

  while (targets.length < numberOfTargets) {
    targets.push(new Target(random(width), random(height)));
  }

  // drone = new Drone(100, 100);
  // drone.vel.x = 1;
  while (autobots.length < armySize) {
    autobots.push(new Drone(random(width), random(height)));
  }
  //equip autobot[0] with a sensor
  autobots[0].sensors[0] = new Radar(autobots[0], 400);
  autobots[0].sensors[1] = new Sensor(autobots[0], 400, 50, 7.5, true, true);
  autobots[0].activeSensor = 1;
  console.log(autobots[0].sensors);
  // autobots[0].debug = true;
  //set all autobots to velocity of 1
  for (let i = 0; i < autobots.length; i++) {
    autobots[i].vel.x = 1;
  }
}

function newPath() {
  // A path is a series of connected points
  // A more sophisticated path might be a curve
  path = new Path();
  let offset = 100;
  path.addPoint(offset, offset);
  path.addPoint(width - offset, offset);
  path.addPoint(width * 0.85, height * 0.45);
  path.addPoint(width - offset, height * 0.8 - offset);
  path.addPoint(width * 0.5, height * 0.79 - offset);
  path.addPoint(offset, height * 0.8 - offset);
  path.addPoint(offset, height * 0.6 - offset);
}
function updateSpeeds() {
  let val2 = vehicleTurnSpeed.value();
  let val = vehicleSpeed.value();
  text(val, width - 50, 20);
  for (let i = 0; i < autobots.length; i++) {
    autobots[i].maxspeed = val;
    autobots[i].maxforce = val2;
  }
}
function frameToTime(frames) {
  //divide by 60 to get seconds
  //if more than 60 seconds, increment minutes
  //if more than 60 minutes, increment hours
  let seconds = frames / 60;
  let minutes = seconds / 60;

  let time = "";

  if (minutes > 0) {
    time +=
      Math.floor(minutes % 60) > 9
        ? Math.floor(minutes % 60) + ":"
        : "0" + Math.floor(minutes % 60) + ":";
    // console.log(time);
  }
  time +=
    Math.floor(seconds % 60) > 9
      ? Math.floor(seconds % 60)
      : "0" + Math.floor(seconds % 60);

  time += "." + Math.floor(((frames % 60) / 60) * 100);
  return time;
}
function updateSensorRange() {
  for (let i = 0; i < autobots.length; i++) {
    if (autobots[i].sensors[0]) {
      autobots[i].sensors[0].range = sensorRange.value();
      autobots[i].sensors[0].scanAngleIncrement = scanSpeedSlider.value();
      autobots[i].sensors[0].scanWidthInDegrees = scanWidthSlider.value() / 2;
      autobots[i].sensors[0].scanWidthInRadians =
        (autobots[i].sensors[0].scanWidthInDegrees * Math.PI) / 180;
    }
    if (autobots[i].sensors[1]) {
      autobots[i].sensors[1].range = sensorRange1.value();
      autobots[i].sensors[1].frequency = sensor1frequency.value();
    }
  }
}
//

//

//

//

//

//
function draw() {
  background(220);

  function drawGUI(targetVehicle) {
    let rectX = targetVehicle.pos.x - targetVehicle.r;
    let rectY = targetVehicle.pos.y - targetVehicle.r;
    let rectW = targetVehicle.r * 2;
    let rectH = targetVehicle.r * 2;
    noFill();
    stroke(0);

    rect(rectX, rectY, rectW, rectH);
    //draw a line from the rectangle to a rectangle at the bottom of the screen
    line(
      targetVehicle.pos.x - targetVehicle.r,
      targetVehicle.pos.y + targetVehicle.r,
      50,
      height - 20
    );
    //text showing the speed of the autobot
    text(
      "speed: " +
        Math.abs(targetVehicle.vel.x + targetVehicle.vel.y).toFixed(3),
      45,
      height - 10
    );
    //text showing the time since targetVehicle.startFrame
    if (targetVehicle.startFrame !== undefined) {
      text(
        "time: " + frameToTime(frameCount - targetVehicle.startFrame),
        45,
        height - 30
      );
    }
  }

  function droneManagment() {
    //
    //
    //
    drawGUI(autobots[0]);
    //make

    //if target filtering is off, add all vehicles to allTargets array
    for (let i = 1; i < autobots.length; i++) {
      allTargets.push(autobots[i]);
    }
  }

  //add all targets to allTargets array (if target filtering is off targets will have drones and targets)
  for (let i = 0; i < targets.length; i++) {
    allTargets.push(targets[i]);
  }

  autobots[0].sensors[autobots[0].activeSensor].scan(allTargets);
  bufferedTargets = autobots[0].sensors[autobots[0].activeSensor].targetBuffer(
    autobots[0].sensors[autobots[0].activeSensor].targets
  );

  let closestTarget = undefined;
  let closestDistance = Infinity;
  for (target of bufferedTargets) {
    //measure dist between autobot and target
    let distance = dist(
      autobots[0].pos.x,
      autobots[0].pos.y,
      target.pos.x,
      target.pos.y
    );
    if (distance < closestDistance) {
      closestTarget = target;
      closestDistance = distance;
    }
  }

  //autobot[0] pursuit closestTarget

  for (let i = 0; i < bufferedTargets.length; i++) {
    if (bufferedTargets[i] !== undefined) {
      //draw a red square around the autobot
      if (bufferedTargets[i] instanceof Target) {
        fill(bufferedTargets[i].color);
      } else {
        fill(255, 0, 0);
      }
      stroke(255, 0, 0);
      strokeWeight(1);
      rect(
        bufferedTargets[i].bufferedPos.x - bufferedTargets[i].r,
        bufferedTargets[i].bufferedPos.y - bufferedTargets[i].r,
        bufferedTargets[i].r * 2,
        bufferedTargets[i].r * 2
      );
    }
  }
  //draw a square around the targets in the targetBuffer

  // autobots[0].sensors[autobots[0].activeSensor].show();

  //basic behavior of the drones
  for (let i = 0; i < autobots.length; i++) {
    autobots[i].update();

    autobots[i].show();
  }

  autobots[0].show();

  //draw a green square around the closest target
  if (closestTarget !== undefined) {
    fill(0, 255, 0, 150);
    stroke(0, 255, 0);
    strokeWeight(1);
    rect(
      closestTarget.bufferedPos.x - closestTarget.r,
      closestTarget.bufferedPos.y - closestTarget.r,
      closestTarget.r * 2,
      closestTarget.r * 2
    );
  }

  //apply forces at the end
  for (let i = 0; i < autobots.length; i++) {
    let pathFollowing = autobots[i].followPath(path);
    let separation = autobots[i].separate(autobots);
    let pursuitVector = undefined;
    if (i == 0) {
      if (closestTarget != undefined) {
        pursuitVector = autobots[i].seek(closestTarget, true);
      } else {
        pursuitVector = pathFollowing;
      }
    }
    let force = createVector(0, 0);
    //combine path following and separation forces at a ratio of 2:1
    if (i == 0) {
      force = pathFollowing.add(separation).mult(0.5);
      if (follow !== undefined) {
        follow = follow.mult(0.1);
        force = force.add(follow);
      }
    }
    if (i != 0) {
      force = pathFollowing.add(separation).mult(0.5);
      if (follow !== undefined) {
        follow = follow.mult(0.1);
        force = force.add(follow);
      }
    }
    //if the pursuit vector is defined, add it to the force

    if (i == 0) {
      if (pursuitVector.mag() > 0) {
        pursuitVector.mult(0.05);
        force.add(pursuitVector);
      }

      autobots[i].applyForce(force);

      //
      //draw a line from autobot[0] to a rectangle at the bottom of the screen

      //draw a rectangle at the last point in the path
    }
    if (i != 0) {
      autobots[i].applyForce(force);
    }
  }

  droneManagment();
  targetManagment();
  path.show();
  function targetManagment() {
    for (let i = 0; i < targets.length; i++) {
      // targets[i].update();
      targets[i].show();

      for (target of targets) {
        let distance = dist(
          autobots[0].pos.x,
          autobots[0].pos.y,
          target.pos.x,
          target.pos.y
        );
        if (distance < target.r * 2) {
          //splice it out of the array
          targets.splice(targets.indexOf(target), 1);
          targets.push(new Target(random(width), random(height)));
        }
      }
    }
  }
}
