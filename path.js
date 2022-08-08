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
