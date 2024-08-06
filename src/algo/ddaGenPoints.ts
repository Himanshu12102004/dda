function ddaGenPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  height: number
): Array<number> {
  let dx = x2 - x1;
  let dy = y2 - y1;
  let absDx = Math.abs(dx);
  let absDy = Math.abs(dy);
  let steps = Math.max(absDx, absDy);
  let xInc = dx / steps;
  let yInc = dy / steps;
  let x = x1;
  let y = y1;
  let points: Array<number> = [];
  for (let i = 0; i < steps; ++i) {
    points.push(x / width);
    points.push(y / height);
    x += xInc;
    y += yInc;
  }
  points.push(x2, y2);
  return points;
}
export default ddaGenPoints;
