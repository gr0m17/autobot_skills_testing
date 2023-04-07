class Path {
  constructor() {
    this.radius = 20;
    this.points = [];
  }
  addPoint(x, y) {
    let point = createVector(x, y);
    this.points.push(point);
  }
  show() {
    strokeJoin(ROUND);

    // Draw thick line for radius
    stroke(175, 175, 175, 150);
    strokeWeight(this.radius * 2);
    noFill();
    beginShape();
    for (let v of this.points) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
    // Draw thin line for center of path
    stroke(0);
    strokeWeight(1);
    noFill();
    beginShape();
    for (let v of this.points) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
  }
}
function newPath() {
  // A path is a series of connected points
  // A more sophisticated path might be a curve
  let path = new Path();
  let offset = 200;
  path.addPoint(offset, offset);
  path.addPoint(width / 2, offset - offset * 0.5);
  path.addPoint(width - offset, offset);

  path.addPoint(width - offset, height - offset);
  path.addPoint(width / 2, height - offset * 0.5);

  path.addPoint(offset, height - offset);
  return path;
}
function parkingPattern(station) {
  // A path is a series of connected points
  // A more sophisticated path might be a curve
  let path = new Path();
  let offset = 100;
  //make a 8 pointed polygon around the station
  path.addPoint(station.pos.x - offset, station.pos.y - offset);
  path.addPoint(station.pos.x - offset, station.pos.y + offset);
  path.addPoint(station.pos.x + offset, station.pos.y + offset);
  path.addPoint(station.pos.x + offset, station.pos.y - offset);

  return path;
}
