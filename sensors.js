class Sensor {
  constructor(
    vehicle,
    range = 50,
    frequency = 50,
    scanWidthInDegrees = 30,
    debug = false,
    targetFiltering = true
  ) {
    this.active = true;
    this.vehicle = vehicle;
    this.range = range;
    this.frequency = frequency;
    this.targets = [];
    this.debug = debug;
    this.scanWidthInDegrees = scanWidthInDegrees;
    this.targetFiltering = targetFiltering;
    this.bufferDuration = 1000;
    this.buffer = [];
    this.bufferActive = true;
    //convert scanWidthInDegrees to radians
    this.scanWidthInRadians = (this.scanWidthInDegrees * Math.PI) / 180;
  }
  targetBuffer(targets, duration) {
    // console.log("targets coming into buffer", targets);
    for (let target of targets) {
      target.timeOut = duration;

      // target.bufferedPos = target.pos.copy();

      this.buffer = this.buffer.filter((target) => target.timeOut > 0);

      if (!this.buffer.includes(target)) {
        this.buffer.push(target);
      }
    }
    // console.log(this.buffer);
    return targets;
  }

  scan(targetlist) {
    this.targets = [];

    if (frameCount % this.frequency == 0) {
      //DRAW A CIRCLE AROUND THE SENSOR
      push();
      fill(255, 0, 0, 100);
      circle(this.vehicle.pos.x, this.vehicle.pos.y, this.range * 2);
      pop();
    }
    //check the distance between this.vehicle and each target in targetlist
    if (targetlist !== undefined) {
      for (let i = 0; i < targetlist.length; i++) {
        let target = targetlist[i];
        let distance = this.vehicle.pos.dist(target.pos);
        //if the distance is less than this.range, add the target to this.targets
        if (distance < this.range) {
          this.targets.push(target);
        }
      }
    }
    if (this.targets === undefined) {
      this.targets = [];
    }

    return this.targets;
  }
  show() {
    // for (let i = 0; i < this.targets.length; i++) {
    //   push();
    //   //if this.targets[i] is a Target, fill it with red
    //   if (this.targets[i] instanceof Target && this.targetFiltering) {
    //     fill(255, 255, 0, 100);
    //   } else {
    //     fill(255, 0, 0, 100);
    //   }
    //   circle(this.targets[i].pos.x, this.targets[i].pos.y, 100);
    //   pop();
    this.radarBufferPulse();
    // }
  }
  radarBufferPulse() {
    for (let target of this.buffer) {
      target.timeOut -= 1;
    }
  }
}
class Radar extends Sensor {
  constructor(vehicle, range = 50, scanWidthInDegrees = 5, scanSpeed = 0.05) {
    super(vehicle, range, scanSpeed, scanWidthInDegrees);
    this.scanWidthInDegrees = scanWidthInDegrees;
    this.scanAngle = random(-PI, PI);
    this.scanAngleIncrement = scanSpeed;
    this.bufferDuration = 1000;
  }
  scan(targetlist) {
    if (targetlist === undefined) {
      targetlist = [];
    }

    if (this.debug) {
    }

    this.targets = [];
    this.scanAngle += this.scanAngleIncrement;
    if (this.scanAngle > PI) {
      this.scanAngle = -PI;
    }

    //
    //
    //

    //convert the scan angle to degrees
    let scanAngleDegrees = (this.scanAngle * 180) / PI;

    //draw a line representing the scan angle - 5 degrees on each side
    push();
    stroke(0, 255, 0, 200);
    //stroke thickness = 4
    strokeWeight(4);
    line(
      this.vehicle.pos.x,
      this.vehicle.pos.y,
      this.vehicle.pos.x +
        this.range * cos(this.scanAngle - this.scanWidthInRadians),
      this.vehicle.pos.y +
        this.range * sin(this.scanAngle - this.scanWidthInRadians)
    );
    line(
      this.vehicle.pos.x,
      this.vehicle.pos.y,
      this.vehicle.pos.x +
        this.range * cos(this.scanAngle + this.scanWidthInRadians),

      this.vehicle.pos.y +
        this.range * sin(this.scanAngle + this.scanWidthInRadians)
    );
    pop();
    //
    //
    //
    for (let target of targetlist) {
      //first check if the target is within the range of the radar
      let d = this.vehicle.pos.dist(target.pos);
      if (d < this.range) {
        //check what the angle between the vehicle and the target is
        //use atan2 to get the angle between the vehicle and the target

        // let angle = this.vehicle.pos.angleBetween(target.pos);
        //convert the angle to degrees
        let angle = atan2(
          target.pos.y - this.vehicle.pos.y,
          target.pos.x - this.vehicle.pos.x
        );
        // console.log("angle: " + angle);
        let angleDegrees = (angle * 180) / PI;
        if (
          angleDegrees < scanAngleDegrees + this.scanWidthInDegrees &&
          angleDegrees > scanAngleDegrees - this.scanWidthInDegrees
        ) {
          // console.log("in angle range!");
          this.targets.push(target);
        }
      }
    }
    if (this.targets === undefined) {
      this.targets = [];
    }
    return this.targets;
  }
}
