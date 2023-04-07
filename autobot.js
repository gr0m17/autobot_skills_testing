function findProjection(pos, a, b) {
  let v1 = p5.Vector.sub(a, pos);
  let v2 = p5.Vector.sub(b, pos);
  v2.normalize();
  let sp = v1.dot(v2);
  v2.mult(sp);
  v2.add(pos);
  return v2;
}
function findClosest(ship, targets) {
  let closest = undefined;
  let distance = Infinity;
  for (let i = 0; i < targets.length; i++) {
    let d = dist(ship.pos.x, ship.pos.y, targets[i].pos.x, targets[i].pos.y);
    // console.log("distance:", d, " station:", targets[i].name);
    if (d < distance) {
      closest = targets[i];
      distance = d;
    }
  }
  return closest;
}
function getNormalPoint(p, a, b) {
  // Vector from a to p
  let ap = p5.Vector.sub(p, a);
  // Vector from a to b
  let ab = p5.Vector.sub(b, a);
  ab.normalize(); // Normalize the line
  // Project vector "diff" onto line by using the dot product
  ab.mult(ap.dot(ab));
  let normalPoint = p5.Vector.add(a, ab);
  return normalPoint;
}
class Drone {
  constructor(x, y) {
    this.name = "Drone" + floor(random(0, 100));
    this.status = "idle";
    this.miningRate = 0.1429;
    this.color = [random(255), random(255), random(255)];
    this.sensorColor = [...this.color, 30];
    this.maxspeed = 4;
    this.maxforce = 0.4;
    this.debug = false;
    this.drawLines = true;
    this.r = 10;
    this.minedValue = 0;
    this.minedCapacity = 49.91;
    this.unloading = false;
    //
    //
    this.dockingStatus = "ready";
    this.dockingStation = undefined;
    this.dockingPort = undefined;

    //
    //
    //targeting priority
    this.priority = "Closest";
    // this.priority = "Most Valuable";

    this.wanderTheta = PI / 2;
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);

    //for drawLines
    this.currentPath = [];
    this.paths = [this.currentPath];
    this.pathLength = 50;
    this.lineFrameLimiter = 1;
    //sensorManagement
    this.sensors = [];
    this.activeSensor = -1;
    //counter for consumed targets
    this.kills = 0;
    this.currentTarget = undefined;
    this.currentTargetValue = 0;
    //race conditions
    // this.lap = 0;
    // this.nextLap = 1;
    // this.startTime = 0;
  }

  //
  //
  //
  unload(ship) {
    // console.log("unloading");
    ship.dockingStation.minedValue += ship.minedValue;
    ship.minedValue = 0;
    ship.unloading = false;
    this.dockingStatus = "ready";

    ship.dockingStation.dockingComplete(ship, ship.dockingPort);
  }

  droneManagement(targets, traffic) {
    let ship = this;
    let followForce = createVector(0, 0);
    if (ship.status == "docked") {
      //
      let dockPosition = ship.dockingStation.ports[ship.dockingPort].pos.copy();
      let stationPosition = ship.dockingStation.pos.copy();

      this.angle += 0.001;
      rotate(this.angle);
      ship.pos.position = dockPosition;
      // console.log("docked!");
      if (ship.unloading == false) {
        if (
          ship.dockingStation.minedCapacity > ship.dockingStation.minedValue
        ) {
          ship.unloading = true;
          setTimeout(function () {
            ship.unload(ship);
          }, 15000);
        }
      }
    }
    //draw the ship

    //update the ships position
    ship.update();
    //manage edge collisions for some reason
    ship.edgesBounce();
    //refactor this into the autobot class: sensorScan(eligibleTargets)
    if (ship.sensors.length > 0) {
      //if any sensors are attached to the ship
      //if the sensor is active, run the sensor's update function
      for (let i = 0; i < ship.sensors.length; i++) {
        if (ship.sensors[i].active) {
          if (ship.sensors[i].bufferActive) {
            ship.sensors[i].targetBuffer(
              ship.sensors[i].scan(targets),
              ship.sensors[i].bufferDuration
            );
          }
          if (ship.status != "docked") {
            ship.sensors[i].show();
            ship.status = "scanning";
          }
        }
      }
    }

    function closestTarget(listOfTargets) {
      let nearestTarget = undefined;
      let closestDistance = Infinity;
      for (let i = 0; i < listOfTargets.length; i++) {
        let distance = dist(
          ship.pos.x,
          ship.pos.y,
          listOfTargets[i].pos.x,
          listOfTargets[i].pos.y
        );
        if (distance < closestDistance) {
          nearestTarget = listOfTargets[i];
          closestDistance = distance;
        }
      }
      if (nearestTarget == undefined) {
        // console.log("no target found");
        ship.currentTarget = undefined;
        ship.currentTargetValue = 0;
      } else {
        // console.log("currnet target: " + nearestTarget.name);
        // nearestTarget.show();
      }
      ship.currentTarget = nearestTarget.name;
      ship.currentTargetValue = nearestTarget.value;
      return nearestTarget;
    }
    function highestValueTarget(listOfTargets) {
      let highValueTarget = undefined;
      let highestValue = 0;
      for (let i = 0; i < listOfTargets.length; i++) {
        let value = 0;
        if (listOfTargets[i].value) {
          value = listOfTargets[i].value;
        }

        if (value > highestValue) {
          highValueTarget = listOfTargets[i];
          highestValue = value;
        }
      }
      if (highValueTarget == undefined) {
        // console.log("no target found");
        ship.currentTarget = undefined;
        ship.currentTargetValue = 0;
      } else {
        // console.log(highValueTarget);
        // console.log("currnet target: " + highValueTarget.name);
        ship.currentTarget = highValueTarget.name;
        ship.currentTargetValue = highValueTarget.value;
        // highValueTarget.show();
      }
      return highValueTarget;
    }

    //decision making area

    let bufferCollector = [];
    ship.currentTarget = "No Target";
    ship.status = "No Target";

    if (ship.status != "atCapacity") {
      if (ship.minedValue >= ship.minedCapacity) {
        ship.status = "atCapacity";
      }
    }
    if (ship.status != "atCapacity") {
      for (let i = 0; i < ship.sensors.length; i++) {
        if (ship.sensors[i].buffer.length > 0) {
          // console.log(ship.sensors[i].buffer[0]);

          bufferCollector = [...bufferCollector, ...ship.sensors[i].buffer];
          //filter the bufferCollector to remove any targets with a distnance greater than the sensor's range
          // console.log(bufferCollector);
          for (let j = 0; j < bufferCollector.length; j++) {
            if (bufferCollector[j].pos && ship.pos) {
              if (
                dist(
                  ship.pos.x,
                  ship.pos.y,
                  bufferCollector[j].pos.x,
                  bufferCollector[j].pos.y
                ) > ship.sensors[i].range
              ) {
                bufferCollector.splice(j, 1);
              }
            }
          } // console.log(bufferCollector);
        }
      }
      if (bufferCollector.length > 0) {
        // console.log(bufferCollector);
        if (ship.priority == "Closest") {
          ship.status = "approaching target";

          followForce.add(ship.consume(closestTarget(bufferCollector)));
          closestTarget(bufferCollector).showTargeted();
          // closestTarget(bufferCollector).show();
        }
        if (ship.priority == "Most Valuable") {
          ship.status = "approaching target";
          followForce.add(ship.consume(highestValueTarget(bufferCollector)));
        }
      }
      // console.log(bufferCollector);
      if (ship.status == "consuming") {
        if (traffic.length > 0) {
          followForce.add(ship.separate(traffic, ship.r * 2).mult(4));
        }
      }
      if (
        ship.status != "approaching target" &&
        ship.status != "consuming" &&
        ship.status != "atCapacity"
      ) {
        if (patrolPath) {
          ship.status = "following patrol path";

          followForce.add(ship.followPath(path));
        } else {
          ship.status = "wandering";
          followForce.add(ship.wander());
        }
        //seperate from traffic
        if (traffic.length > 0) {
          followForce.add(ship.separate(traffic, ship.r * 9).mult(4));
        }
      }
    }
    if (ship.status == "atCapacity") {
      //the ship is at capacity and should request a landing port
      if (ship.dockingStatus == "ready") {
        ship.dockingStatus = this + " requesting docking";
        let closestStation = findClosest(ship, stations);

        ship.requestDocking(closestStation);
        console.log(ship.name + ship.dockingStatus);
      }

      //if the ship is queued for docking, follow the ship in front of you in the queue
      // if (ship.dockingPort == "queued") {
      //   //find my position in the queue
      //   let myPosition = 0;
      //   for (let i = 0; i < ship.dockingStation.dockingQueue.length; i++) {
      //     if (ship.dockingStation.dockingQueue[i] == ship) {
      //       myPosition = i;
      //     }
      //   }
      //   //find the ship in front of me in the queue
      //   let nextShip = ship.dockingStation.dockingQueue[myPosition + 1];
      //   if (nextShip) {
      //     followForce.add(ship.follow(nextShip));
      //   } else {
      //     //follow a position ship.dockingStation.pos.x + ship.dockingStation.r, ship.dockingStation.pos.y + ship.dockingStation.r
      //     //make a vector ship.dockingStation.r * 4 + ship.dockingStation.pos
      //     target.pos = createVector(
      //       ship.dockingStation.pos.x + ship.dockingStation.r * 5,
      //       ship.dockingStation.pos.y + ship.dockingStation.r * 5
      //     );
      //     circle(target.x, target.y, ship.dockingStation.r * 5);
      //     let traffic = [
      //       ...ship.dockingStation.dockingQueue,
      //       ship.dockingStation,
      //     ];
      //     followForce.add(ship.separate(traffic));
      //     parkingPattern(ship.dockingStation);
      //     followForce.add(ship.followPath(path));
      //   }
      // } // follow circle around docking station
      if (ship.dockingPort == "queued") {
        let traffic = [
          ...ship.dockingStation.dockingQueue,
          ship.dockingStation,
        ];
        followForce.add(ship.separate(traffic));
        // parkingPattern(ship.dockingStation);
        followForce.add(ship.followPath(path));
      }

      //if ship.dockingPort is a number, it means the ship is cleared to dock
      //so do it!
      if (ship.dockingPort != undefined && ship.dockingPort != "queued") {
        let dockPosition =
          ship.dockingStation.ports[ship.dockingPort].pos.copy();
        let stationPosition = ship.dockingStation.pos.copy();

        dockPosition.add(stationPosition);
        followForce.add(ship.arrive(stationPosition, 20));
        //if the ship is at the dock position, dock
        if (
          dist(ship.pos.x, ship.pos.y, stationPosition.x, stationPosition.y) <
          ship.r * 2
        ) {
          ship.dock();
        }
      }
    }

    //draw a line from ship to followForce
    // console.log(followForce);
    // line(
    //   ship.pos.x,
    //   ship.pos.y,
    //   followForce.x * 100 + ship.pos.x,
    //   followForce.y * 100 + ship.pos.y
    // );
    // console.log(this.status);
    // followForce.setMag(ship.maxspeed);
    ship.applyForce(followForce);
    ship.show();
  }
  dock() {
    this.status = "docked";
    this.dockingStatus = "docked";
    this.pos.parent = this.dockingStation.pos;
    this.dockingStation.ports[this.dockingPort].status =
      "docked with " + this.name;
  }
  requestDocking(station) {
    console.log(this.name + "requesting docking:" + station.name);

    let request = station.dockingRequest(this);
    if (request == "queued") {
      this.status = "queued";
      this.dockingStatus = "queued for docking at " + station.name;
    } else {
      this.dockingStatus = "docking at " + station.name + " port: " + request;
      this.status = "docking";
    }
    this.dockingStation = station;
    this.dockingPort = request;
    // console.log(this.name + "docking port: " + this.dockingPort);
    return request;
  }
  //
  //
  //
  consume(target) {
    //add a cool down on the consume ability

    if (dist(this.pos.x, this.pos.y, target.pos.x, target.pos.y) > this.r * 4) {
      return this.seek(target, false); //if not in range, move towards target
    }
    //if in range, consume the target
    else {
      this.status = "consuming";
      //once consuming has stopped for more than 1 second, set the this.consumeCooldown == this.cooldown, then set a timer to tick down the cooldown

      //draw a line from the ship to the target
      strokeWeight(8);
      stroke(255, 0, 0);
      line(this.pos.x, this.pos.y, target.pos.x, target.pos.y);
      strokeWeight(1);
      target.value -= this.miningRate;
      target.r -= this.miningRate;
      this.minedValue += this.miningRate;
      if (target.value <= 0) {
        target.value = 0;
        target.consumed = true;
      }
      return this.seek(target, true, 50); //if not in range, move towards target
      //create a vector the exact opposite of this heading
      // return this.seek(target, false, 5);
    }
  }

  addRadar(range = 150, scanWidthInDegrees = 5, scanSpeed = 0.15) {
    this.sensors.push(new Radar(this, range, scanWidthInDegrees, scanSpeed));
  }
  addPing(
    range = 75,
    frequency = 50,
    scanWidthInDegrees = 30,
    debug = false,
    targetFiltering = true
  ) {
    this.sensors.push(
      new Sensor(
        this,
        range,
        frequency,
        scanWidthInDegrees,
        debug,
        targetFiltering
      )
    );
  }
  clearPath() {
    this.currentPath = [];

    this.paths = [this.currentPath];
  }
  trimPath() {
    //take off the oldest entry of this.paths
    this.paths.shift();
  }
  wander() {
    let wanderPoint = this.vel.copy();
    let displaceRange = 0.3;

    wanderPoint.setMag(100);
    wanderPoint.add(this.pos);
    let wanderRadius = 50;
    if (this.debug) {
      fill(255, 0, 0);
      circle(wanderPoint.x, wanderPoint.y, 8);
      noFill();
      stroke(255);
      circle(wanderPoint.x, wanderPoint.y, wanderRadius * 2);
      line(this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);
    }
    let theta = this.wanderTheta + this.vel.heading();

    let x = wanderRadius * cos(theta);
    let y = wanderRadius * sin(theta);
    wanderPoint.add(x, y);

    if (this.debug) {
      fill(0, 255, 0);
      noStroke();
      circle(wanderPoint.x, wanderPoint.y, 16);
      stroke(255);
      line(this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);
    }

    let steer = wanderPoint.sub(this.pos);
    steer.setMag(this.maxforce);
    this.applyForce(steer);
    this.wanderTheta += random(-displaceRange, displaceRange);
    // let force = p5.Vector.random2D();
    // this.applyForce(force);
  }

  separate(traffic, desiredseparation = this.r * 2) {
    let steer = createVector(0, 0, 0);
    let count = 0;
    // For every vehicle in the system, check if it's too close
    for (let i = 0; i < traffic.length; i++) {
      let other = traffic[i];
      let d = p5.Vector.dist(this.pos, other.pos);
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if (d > 0 && d < desiredseparation + other.r * 2) {
        // Calculate vector pointing away from neighbor
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d); // Weight by distance
        steer.add(diff);
        count++; // Keep track of how many
      }
    }
    // Average -- divide by how many
    if (count > 0) {
      steer.div(count);
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
      // Implement Reynolds: Steering = Desired - Velocity
      steer.normalize();
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }
    return steer;
  }
  flee(target) {
    return this.seek(target).mult(-1);
  }

  pursuit(targetVehicle) {
    let speedRatio = targetVehicle.vel.mag() / this.maxspeed;
    let targetAngle = targetVehicle.vel.angleBetween(
      p5.Vector.sub(this.pos, targetVehicle.pos)
    );
    let myAngle = asin(sin(targetAngle) / speedRatio);
    let dist = this.pos.dist(targetVehicle.pos);
    let prediction = (dist * sin(myAngle)) / sin(PI - myAngle - targetAngle);
    let target = targetVehicle.pos.copy();
    target.setMag(prediction);
    target.add(targetVehicle.pos);
    // let target = targetVehicle.pos.copy();
    // let prediction = targetVehicle.vel.copy();
    // let lookaheadFactor = 1;
    // let distance = p5.Vector.dist(this.pos, target);

    // prediction.setMag(distance);
    // prediction.mult(lookaheadFactor);
    // target.add(prediction);
    // push();
    // fill(0, 255, 0);
    // circle(target.x, target.y, 10);
    // pop();
    return this.seek(target);
  }
  follow(targetVehicle) {
    let newTarget = targetVehicle.pos.copy();
    let follow = targetVehicle.vel.copy();
    newTarget.sub(follow.mult(5));
    // push();
    // fill(0, 255, 0);
    // circle(newTarget.x, newTarget.y, 10);
    // pop();
    return this.arrive(newTarget);
  }
  followPath(path) {
    // Predict pos 25 (arbitrary choice) frames ahead
    let predict = this.vel.copy();
    predict.normalize();
    predict.mult(25);
    let predictpos = p5.Vector.add(this.pos, predict);

    // Now we must find the normal to the path from the predicted pos
    // We look at the normal for each line segment and pick out the closest one
    let normal = null;
    let target = null;
    let worldRecord = 1000000; // Start with a very high worldRecord distance that can easily be beaten

    // Loop through all points of the path
    for (let i = 0; i < path.points.length; i++) {
      // Look at a line segment
      let a = path.points[i];
      let b = path.points[(i + 1) % path.points.length]; // Note Path has to wraparound

      // Get the normal point to that line
      let normalPoint = getNormalPoint(predictpos, a, b);

      // Check if normal is on line segment
      let dir = p5.Vector.sub(b, a);
      // If it's not within the line segment, consider the normal to just be the end of the line segment (point b)
      //if (da + db > line.mag()+1) {
      if (
        normalPoint.x < min(a.x, b.x) ||
        normalPoint.x > max(a.x, b.x) ||
        normalPoint.y < min(a.y, b.y) ||
        normalPoint.y > max(a.y, b.y)
      ) {
        normalPoint = b.copy();
        // If we're at the end we really want the next line segment for looking ahead
        a = path.points[(i + 1) % path.points.length];
        b = path.points[(i + 2) % path.points.length]; // Path wraps around
        dir = p5.Vector.sub(b, a);
      }

      // How far away are we from the path?
      let d = p5.Vector.dist(predictpos, normalPoint);
      // Did we beat the worldRecord and find the closest line segment?
      if (d < worldRecord) {
        worldRecord = d;
        normal = normalPoint;

        // Look at the direction of the line segment so we can seek a little bit ahead of the normal
        dir.normalize();
        // This is an oversimplification
        // Should be based on distance to path & velocity
        dir.mult(25);
        target = normal.copy();
        target.add(dir);
      }
    }

    // Draw the debugging stuff
    if (this.debug) {
      // Draw predicted future pos
      stroke(0);
      fill(0);
      line(this.pos.x, this.pos.y, predictpos.x, predictpos.y);
      ellipse(predictpos.x, predictpos.y, 4, 4);

      // Draw normal pos
      stroke(0);
      fill(0);
      ellipse(normal.x, normal.y, 4, 4);
      // Draw actual target (red if steering towards it)
      line(predictpos.x, predictpos.y, target.x, target.y);
      if (worldRecord > path.radius) fill(255, 0, 0);
      noStroke();
      ellipse(target.x, target.y, 8, 8);
    }

    // Only if the distance is greater than the path's radius do we bother to steer
    if (worldRecord > path.radius) {
      return this.seek(target);
    } else {
      return createVector(0, 0);
    }
  }
  evade(target) {
    return this.pursuit(target).mult(-1);
  }
  arrive(target, r) {
    return this.seek(target, true, r);
  }
  seek(target, arrival = false, r = this.r * 5) {
    let pos = undefined;
    if (target.pos) {
      pos = target.pos;
    } else {
      pos = target;
    }
    let desired = p5.Vector.sub(pos, this.pos);
    let desiredSpeed = this.maxspeed;
    if (arrival) {
      let d = desired.mag();

      if (d < r) {
        desiredSpeed = map(d, 0, r * 2, 0, this.maxspeed);
      }
    }
    if (desiredSpeed < 2) {
      let heading = desired.heading();

      desired = createVector(0, 0);
    }
    desired.setMag(desiredSpeed);
    desired.sub(this.vel);
    desired.limit(this.maxforce);
    return desired;
  }

  applyForce(force) {
    this.acc.add(force);
  }
  update() {
    //remember the angle of the vehicle
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.vel.limit(this.maxspeed);
    this.acc.mult(0);
    if (frameCount % this.lineFrameLimiter == 0 && this.drawLines) {
      this.currentPath.push(this.pos.copy());
    }
  }

  edges() {
    let hitEdge = false;
    if (this.pos.x < 0) {
      this.pos.x = width;
      hitEdge = true;
    } else if (this.pos.x > width) {
      this.pos.x = 0;
      hitEdge = true;
    }
    if (this.pos.y < 0) {
      this.pos.y = height;
      hitEdge = true;
    } else if (this.pos.y > height) {
      this.pos.y = 0;
      hitEdge = true;
    }
    if (hitEdge) {
      this.currentPath = [];
      this.paths.push(this.currentPath);
    }
  }

  edgesBounce() {
    if (this.pos.x < 0) {
      this.pos.x = 0;
      this.vel.x *= -1;
    } else if (this.pos.x > width) {
      this.pos.x = width - this.r;
      this.vel.x *= -1;
    }
    if (this.pos.y < 0) {
      this.pos.y = 0;
      this.vel.y *= -1;
    } else if (this.pos.y > height) {
      this.pos.y = height - this.r;
      this.vel.y *= -1;
    }
  }

  show() {
    fill(this.color);
    stroke(0);
    strokeWeight(1);
    //draw a triangle
    push();
    if (this.status == "docked") {
      let target = this.dockingStation.pos.copy();
      let current = this.pos.copy();

      translate(this.dockingStation.pos.x, this.dockingStation.pos.y);
      rotate(this.dockingStation.angle);
      translate(
        this.dockingStation.ports[this.dockingPort].pos.x,
        this.dockingStation.ports[this.dockingPort].pos.y
      );
      // console.log(this.dockingStation.angle);
    } else {
      translate(this.pos.x, this.pos.y);
    }
    rotate(this.vel.heading());
    triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
    pop();
    // console.log(this.currentPath);
    //if this.drawLines is true, draw the path
    //let path counter start
    let pathCounter = 0;
    for (let path of this.paths) {
      beginShape();
      noFill();
      stroke(this.color);
      for (let p of path) {
        pathCounter++;
        if (pathCounter > this.pathLength) {
          path.shift();
        } else {
          vertex(p.x, p.y);
        }
      }
      endShape();
    }
  }
}

class Target extends Drone {
  constructor(x, y) {
    super(x, y);
    let m = floor(random(0, 2));
    if (m == 0) {
      this.vel = createVector(0, 0);
    } else {
      this.vel = createVector(random(-1, 1), random(-1, 1));
    }
    this.maxspeed = 2;
    // this.r = 3;
    this.consumed = false;
    this.r = random(3, 50);
    this.debug = false;
    this.color = [random(255), random(255), random(255), 128];
    this.name = "Target" + floor(random(1000, 9999));
    this.value = this.r;
    this.killvalue = this.value;
  }
  show() {
    push();
    noStroke();
    fill(this.color);
    translate(this.pos.x, this.pos.y);
    circle(0, 0, this.r * 2);
    pop();
  }
  showTargeted() {
    push();
    color(this.color);
    // stroke(0);
    strokeWeight(1);
    //draw a triangle
    translate(this.pos.x, this.pos.y);
    // rotate(this.vel.heading());
    //draw a triangle that has even sides that enclose the circle
    //draw a square around the circle
    noFill();
    rect(-this.r / 3, -this.r / 3, (this.r / 3) * 2, (this.r / 3) * 2);
    // triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
    pop();
  }
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.vel.limit(this.maxspeed);
    this.acc.mult(0);
    this.edgesBounce();
  }
  edgesBounce() {
    if (this.pos.x - this.r < 0) {
      this.pos.x = 0 + this.r;
      this.vel.x *= -1;
    } else if (this.pos.x + this.r > width) {
      this.pos.x = width - this.r;
      this.vel.x *= -1;
    }
    if (this.pos.y - this.r < 0) {
      this.pos.y = 0 + this.r;
      this.vel.y *= -1;
    } else if (this.pos.y + this.r > height) {
      this.pos.y = height - this.r;
      this.vel.y *= -1;
    }
  }
}
class Probe extends Drone {
  constructor(x, y, target) {
    super(x, y, target);
    this.vel = createVector(random(-6, 10), random(-6, 10));
    this.maxspeed = 5;
    this.debug = true;
    this.target = target;
    this.sensors = [new Radar(this, 300, 22.5, -0.01)];
    this.color = [random(255), random(255), random(255)];

    // console.log("sensors:", this.sensors);
  }
  probeManagment(targets, traffic) {
    let ship = this;
    let followForce = createVector(0, 0);
    //draw the ship
    ship.show();
    //update the ships position
    ship.update();
    //manage edge collisions for some reason
    ship.edgesBounce();
    //refactor this into the autobot class: sensorScan(eligibleTargets)
    if (ship.sensors.length > 0) {
      let scannerReturns = [];
      // ship.status = "scanning";
      //if any sensors are attached to the ship
      //if the sensor is active, run the sensor's update function
      for (let i = 0; i < ship.sensors.length; i++) {
        if (ship.sensors[i].active) {
          if (ship.sensors[i].bufferActive) {
            ship.sensors[i].targetBuffer(
              ship.sensors[i].scan(targets),
              ship.sensors[i].bufferDuration
            );
          } else {
            scannerReturns = ship.sensors[i].scan(targets);

            if (scannerReturns.length > 0) {
              ship.status = "approaching target";
              // followForce.add(ship.arrive(scannerReturns[0]));
            }
            // console.log("scanner returns:", ship.sensors[i].scan(targets));
            // ship.sensors[i].scan(targets)
            // ship.sensors[i].scan(targets);
          }

          ship.sensors[i].show();
        }
      }
    }

    function closestTarget(listOfTargets) {
      let nearestTarget = undefined;
      let closestDistance = Infinity;
      for (let i = 0; i < listOfTargets.length; i++) {
        let distance = dist(
          ship.pos.x,
          ship.pos.y,
          listOfTargets[i].pos.x,
          listOfTargets[i].pos.y
        );
        if (distance < closestDistance) {
          nearestTarget = listOfTargets[i];
          closestDistance = distance;
        }
      }
      if (nearestTarget == undefined) {
        // console.log("no target found");
      } else {
        // console.log("currnet target: " + nearestTarget.name);
        // nearestTarget.show();
      }
      return nearestTarget;
    }

    //decision making area
    //if there's no targets in the buffer, follow the path
    // for (let i = 0; i < ship.sensors.length; i++) {
    //   if (ship.sensors[i].buffer.length == 0) {
    //     follow = path;
    //   } else {
    //     //if there's a target in the buffer, follow it
    //     follow = ship.sensors[i].buffer[0];
    //   }
    // }
    for (let i = 0; i < ship.sensors.length; i++) {
      if (ship.sensors[i].buffer.length > 0) {
        // console.log(ship.sensors[i].buffer[0]);
        ship.status = "approaching target";
        //multiply the followForce by maxspeed
      }
    }
    if (ship.status != "approaching target" && ship.status != "consuming") {
      if (path) {
        ship.status = "following path";

        // followForce.add(ship.followPath(path));
      } else {
        ship.status = "wandering";
        // followForce.add(ship.wander());
      }
      //seperate from traffic
      if (traffic.length > 0) {
        // followForce.add(ship.separate(traffic, ship.r * 10).mult(2));
      }
    }

    ship.applyForce(followForce);
  }
  // probeManagment(targets, traffic) {
  //   this.show();
  //   if (this.sensors.length > 0) {
  //     let scannerReturns = [];
  //     //if any sensors are attached to the this
  //     //if the sensor is active, run the sensor's update function
  //     for (let i = 0; i < this.sensors.length; i++) {
  //       if (this.sensors[i].active) {
  //         if (this.sensors[i].bufferActive) {
  //           this.sensors[i].targetBuffer(
  //             this.sensors[i].scan(targets),
  //             this.sensors[i].bufferDuration
  //           );
  //           // console.log(this.sensors[i].buffer);
  //         } else {
  //           scannerReturns = this.sensors[i].scan(targets);

  //           if (scannerReturns.length > 0) {
  //             this.status = "targets in range.";
  //           }
  //           // console.log("scanner returns:", this.sensors[i].scan(targets));
  //           // this.sensors[i].scan(targets)
  //           // this.sensors[i].scan(targets);
  //         }

  //         this.sensors[i].show();
  //         this.status = "scanning";
  //       }
  //     }
  //   }
  // }
  update() {
    // this.applyForce(this.arrive(this.target));
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.vel.limit(this.maxspeed);
    this.acc.mult(0);
    this.debug = true;
    // console.log("updating probe:");
    //if any sensors equipped, update them
    for (let sensor of this.sensors) {
      // sensor.scan(targets);
      // sensor.show();
    }
    //seek this.target

    // let force = this.arrive(this.target)

    // this.applyForce(force);
  }
  show() {
    noStroke();
    // console.log("target:", this.target);
    fill(255, 255, 50, 128);
    push();
    translate(this.pos.x, this.pos.y);
    circle(0, 0, this.r * 3);
    circle(0, 0, this.r * 2);
    circle(0, 0, this.r * 1);
    pop();
  }
}
class Station extends Drone {
  constructor(x, y) {
    super(x, y);
    this.name = "Station" + floor(random(0, 100));
    this.r = 35;
    this.maxspeed = 0.5;
    this.maxforce = 0.05;
    this.status = "idle";
    this.sensors = [];
    this.angle = 0;
    this.minedCapacity = 1000000;
    this.portSizeH = 10;
    this.portSizeW = 20;
    this.ports = [
      {
        pos: createVector(this.r / 2, 0),
        dock: [],
        status: "idle",
      },
      {
        pos: createVector(-this.r / 2, 0),
        dock: [],
        status: "idle",
      },
      {
        pos: createVector(this.r / 2, this.portSizeW),
        dock: [],
        status: "idle",
      },
      {
        pos: createVector(-this.r / 2, -this.portSizeW),
        dock: [],
        status: "idle",
      },
      {
        pos: createVector(-this.r / 2, this.portSizeW),
        dock: [],
        status: "idle",
      },
      {
        pos: createVector(this.r / 2, -this.portSizeW),
        dock: [],
        status: "idle",
      },
    ];

    this.dockingQueue = [];
  }
  dockingRequest(dockingShip) {
    for (let i = 0; i < this.ports.length; i++) {
      if (this.ports[i].dock.length < 1) {
        this.ports[i].dock.push(dockingShip);
        this.ports[i].status = "Waiting for " + dockingShip.name;
        return i;
      }
    }
    //if there are no empty ports, add the ship to the docking queue
    this.dockingQueue.push(dockingShip);
    return "queued";
  }
  dockingComplete(dockingShip, port) {
    for (let i = 0; i < this.ports.length; i++) {
      if (this.ports[i].dock.length > 0) {
        // console.log(this.ports[i].dock[0]);
        if (this.ports[i].dock[0] == dockingShip) {
          // console.log("idle?:", this.ports[i].status);
          this.ports[i].status = "idle";
          // console.log("idle?:", this.ports[i].status);
          this.ports[i].dock.shift();
          //check if there are any ships in the queue
          if (this.dockingQueue.length > 0) {
            // console.log(this.dockingQueue);
            let nextship = this.dockingQueue.shift();
            // console.log("port status: " + this.ports[i].status);
            this.ports[i].status = "queueing " + nextship.name;
            nextship.requestDocking(this);

            // this.ports[i].dock[0].dockingPort = i;
          } else {
            this.ports[i].status = "idle";
          }
          return i;
        }
      }
    }
  }
  show() {
    noStroke();
    // console.log("target:", this.target);
    push();
    translate(this.pos.x, this.pos.y);
    rectMode(CENTER);
    this.angle += 0.005;
    rotate(this.angle);
    // circle(0, 0, this.r * 5);
    fill(255, 255, 50, 255);
    square(0, 0, this.r * 2);
    fill(255, 0, 50, 100);
    circle(0, 0, this.r * 2);
    circle(0, 0, this.r * 1);

    if (this.ports) {
      for (let i = 0; i < this.ports.length; i++) {
        fill(100, 50, 255, 255);
        rect(
          this.ports[i].pos.x,
          this.ports[i].pos.y,
          this.portSizeW,
          this.portSizeH
        );
      }
    }
    pop();
  }
  showTop() {
    noStroke();
    // console.log("target:", this.target);
    push();
    translate(this.pos.x, this.pos.y);
    fill(255, 20, 255, 255);
    text(this.name, 40, 40);
    text("stored minerals:" + this.minedValue.toFixed(2), 40, 52);
    rectMode(CENTER);
    rotate(this.angle);
    // circle(0, 0, this.r * 5);
    // fill(255, 255, 255, 100);
    // square(0, 0, this.r * 2);
    fill(255, 0, 50, 100);
    //
    if (this.ports) {
      for (let i = 0; i < this.ports.length; i++) {
        let fillColor = [100, 100, 200, 100];
        if (this.ports[i].dock[0]) {
          fillColor = [...this.ports[i].dock[0].color, 200];
          fill(fillColor);
        }
        rect(
          this.ports[i].pos.x - this.r / 8,
          this.ports[i].pos.y,
          this.portSizeW * 0.5,
          this.portSizeH * 1.5
        );
      }
    }
    pop();
  }
}
function bufferManagement(autobots, targets) {
  for (let i = 0; i < autobots.length; i++) {
    for (let j = 0; j < targets.length; j++) {
      if (targets[j].consumed == true) {
        let killvalue = floor(target.killvalue);
        deletionList.push(targets[j].name);
        autobots[i].kills += killvalue;
      }
    }
  }

  let uniqueDeletionList = [];
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
        if (uniqueDeletionList.includes(probes[i].sensors[j].buffer[k].name)) {
          probes[i].sensors[j].buffer.splice(k, 1);
        }
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
