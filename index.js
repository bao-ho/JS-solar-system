(function () {
  const cavasElement = document.getElementById("canvas-solar-system");
  let timer = undefined;
  let lightSource = "parallel";
  const ctx = cavasElement.getContext("2d");
  const { width, height } = ctx.canvas;
  let solarSystem;
  let traces = false;
  let moon = false;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  const homeDataView = {
    xMin: -width / 2,
    yMin: -height / 2,
    xMax: width / 2,
    yMax: height / 2,
  };
  const viewState = {
    scale: 1,
    minScale: 2 ** -5.1,
    maxScale: 1.01,
    homeDataView,
    dataView: homeDataView,
  };

  // HAMMER JS FOR PANNING
  const myElement = document.getElementById("canvas-solar-system");
  const mc = new Hammer(myElement);
  mc.get("pan").set({ direction: Hammer.DIRECTION_ALL });
  mc.on("panleft panright panup pandown tap press", function (ev) {
    switch (ev.type) {
      case "panup":
        solarSystem.rotateAroundXAxis(0.02);
        break;
      case "pandown":
        solarSystem.rotateAroundXAxis(-0.02);
        break;
      default:
        break;
    }
  });

  // WHEEL FOR ZOOMING
  const ZOOM_SCALE = 2 ** (1 / 8);
  function zoom1D(normPosition, start, end, factor) {
    const range = end - start;
    const value = start + range * normPosition;
    const newStart = value - range * normPosition * factor;
    const newEnd = newStart + range * factor;
    return [newStart, newEnd];
  }

  function zoom({ e, viewState }) {
    const { scale, maxScale, minScale } = viewState;
    const zoomFactor = e.deltaY > 0 ? ZOOM_SCALE : 1 / ZOOM_SCALE;
    console.log(e.deltaY);
    const newScale = zoomFactor * scale;
    if (newScale > maxScale || newScale < minScale) {
      return;
    }
    const p = { x: e.x - 8, y: e.y - 8 }; // body.margin = 8
    const { xMin, xMax, yMin, yMax } = viewState.dataView;
    const [xMinNew, xMaxNew] = zoom1D(p.x / width, xMin, xMax, zoomFactor);
    const [yMaxNew, yMinNew] = zoom1D(p.y / height, yMax, yMin, zoomFactor);
    viewState.dataView = {
      xMin: xMinNew,
      xMax: xMaxNew,
      yMin: yMinNew,
      yMax: yMaxNew,
    };
    viewState.scale = newScale;
  }

  // BUTTONS' CALLBACK FUNCTIONS
  myElement.onwheel = (e) => {
    e.preventDefault();
    zoom({ e, viewState });
  };

  window.toggleAnimation = function () {
    if (timer === undefined) {
      timer = setInterval(solarSystem.render, 50);
    } else {
      clearInterval(timer);
      timer = undefined;
    }
  };

  window.toggleLightSource = function () {
    if (lightSource === "parallel") {
      lightSource = "point";
    } else {
      lightSource = "parallel";
    }
  };

  window.toggleTraces = function () {
    traces = !traces;
  };

  window.showMoon = function () {
    moon = !moon;
  };

  window.zoomExtent = function () {
    viewState.scale = 1;
    viewState.dataView = homeDataView;
  };

  // GRAPHICS

  // Rotate p around y axis, translate X along x axis, rotate D around y axis, rotate A around x axis
  const transform = ({
    x0,
    y0,
    X = 0,
    p,
    rotationAroundYAxis,
    rotationAroundXAxis,
    Dm,
  }) => {
    const sp = Math.sin(p);
    const cp = Math.cos(p);
    const x1 = x0 * cp + X;
    const y1 = y0;
    const z1 = x0 * sp;

    const cd = Math.cos(rotationAroundYAxis);
    const sd = Math.sin(rotationAroundYAxis);
    const x2 = x1 * cd - z1 * sd;
    const y2 = y1;
    const z2 = x1 * sd + z1 * cd;

    const ca = Math.cos(rotationAroundXAxis);
    const sa = Math.sin(rotationAroundXAxis);
    let x = x2;
    const y = y2 * ca - z2 * sa;
    let z = y2 * sa + z2 * ca;

    // Only to create moon
    if (Dm) {
      x += Dm * Math.cos(rotationAroundYAxis);
      z += Dm * Math.sin(rotationAroundYAxis);
    }

    return { x, y, z };
  };

  const createSphere = ({
    name,
    color,
    radius,
    eyeToScreen,
    eyeToSphere,
    X,
    deltaC,
    resolutionAroundYAxis,
  }) => {
    let rotationAroundXAxis = -Math.PI / 4;
    let C = 0;
    let rotationAroundYAxis = 0;
    const render = () => {
      for (let j = -1.57; j <= 1.57; j += 0.2) {
        // j <=> theta
        const ct = Math.cos(j);
        const st = Math.sin(j);
        for (i = 0; i < 6.28; i += 0.2) {
          // i <=> phi
          const ox = radius * ct;
          const oy = radius * st;
          const point = transform({
            x0: ox,
            y0: oy,
            X,
            p: i + C,
            rotationAroundYAxis,
            rotationAroundXAxis,
          });
          const ooz = 1 / (eyeToSphere + point.z); // one over z
          const { xMin, xMax, yMin, yMax } = viewState.dataView;
          const u =
            (width * (eyeToScreen * ooz * point.x - 0.5 * (xMax + xMin))) /
            (xMax - xMin);
          const v =
            (height * (eyeToScreen * ooz * point.y - 0.5 * (yMax + yMin))) /
            (yMax - yMin);
          const xp = u + width / 2;
          const yp = height / 2 - v;
          const normalVector = transform({
            x0: ct,
            y0: st,
            p: i + C,
            rotationAroundYAxis,
            rotationAroundXAxis,
          });
          let L;
          if (name === "Sun" || lightSource === "parallel") {
            L = normalVector.y - normalVector.z;
          } else {
            const normDistance = Math.sqrt(
              point.x * point.x + point.y * point.y + point.z * point.z
            );
            L =
              -(
                normalVector.x * point.x +
                normalVector.y * point.y +
                normalVector.z * point.z
              ) / normDistance;
          }
          if (L > 0) {
            ctx.fillStyle = color + L + ")";
            ctx.fillRect(xp, yp, 2, 2);
          }

          // Moon
          if (name === "Earth" && moon) {
            // i <=> phi
            const ox = (radius / 2) * ct;
            const oy = (radius / 2) * st;
            const point = transform({
              x0: ox,
              y0: oy,
              X,
              p: i + C,
              rotationAroundYAxis,
              rotationAroundXAxis,
              Dm: X / 5,
            });
            const ooz = 1 / (eyeToSphere + point.z); // one over z
            const { xMin, xMax, yMin, yMax } = viewState.dataView;
            const u =
              (width * (eyeToScreen * ooz * point.x - 0.5 * (xMax + xMin))) /
              (xMax - xMin);
            const v =
              (height * (eyeToScreen * ooz * point.y - 0.5 * (yMax + yMin))) /
              (yMax - yMin);
            const xp = u + width / 2;
            const yp = height / 2 - v;
            const normalVector = transform({
              x0: ct,
              y0: st,
              p: i + C,
              rotationAroundYAxis,
              rotationAroundXAxis,
            });

            // TODO: fix calculation of L
            let L;
            if (name === "Sun" || lightSource === "parallel") {
              L = normalVector.y - normalVector.z;
            } else {
              const normDistance = Math.sqrt(
                point.x * point.x + point.y * point.y + point.z * point.z
              );
              L =
                -(
                  normalVector.x * point.x +
                  normalVector.y * point.y +
                  normalVector.z * point.z
                ) / normDistance;
            }
            if (L > 0) {
              ctx.fillStyle = "rgba(255,255,255," + L + ")";
              ctx.fillRect(xp, yp, 2, 2);
            }
          }
        }
      }
    };
    const api = {
      name,
      render,
      rotateAroundXAxis(deltaA) {
        rotationAroundXAxis += deltaA;
        render();
      },
      animate() {
        C += deltaC ? deltaC : 0;
        rotationAroundYAxis += resolutionAroundYAxis
          ? resolutionAroundYAxis
          : 0;
        render();
      },
      drawTrace() {
        for (let E = 0; E < Math.PI * 2; E += 0.1) {
          const point = transform({
            x0: X,
            y0: 0,
            p: E,
            rotationAroundYAxis: 0,
            rotationAroundXAxis,
          });
          const ooz = 1 / (eyeToSphere + point.z); // one over z
          const { xMin, xMax, yMin, yMax } = viewState.dataView;
          const u =
            (width * (eyeToScreen * ooz * point.x - 0.5 * (xMax + xMin))) /
            (xMax - xMin);
          const v =
            (height * (eyeToScreen * ooz * point.y - 0.5 * (yMax + yMin))) /
            (yMax - yMin);
          const xp = u + width / 2;
          const yp = height / 2 - v;
          ctx.fillStyle = color + 075 + ")";
          ctx.fillRect(xp, yp, 2, 2);
        }
      },
    };
    return api;
  };

  const createSolarSystem = (specs) => {
    const spheres = specs.map((spec) => createSphere(spec));
    const api = {
      render() {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);
        spheres.forEach((sphere) => {
          if (sphere.name !== "Sun" && traces !== false) {
            sphere.drawTrace();
          }
          sphere.animate();
        });
      },
      rotateAroundXAxis(deltaA) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);
        spheres.forEach((sphere) => {
          if (sphere.name !== "Sun" && traces !== false) {
            sphere.drawTrace();
          }
          sphere.rotateAroundXAxis(deltaA);
        });
      },
    };
    return api;
  };

  specs = [
    {
      name: "Earth",
      color: "rgba(28,163,236,", //blue
      radius: 50,
      eyeToScreen: 5000,
      eyeToSphere: 6000,
      X: 450,
      deltaC: 0.01,
      resolutionAroundYAxis: 0.01,
    },
    {
      name: "Sun",
      color: "rgba(255,240,100,", //bright yellow
      radius: 100,
      eyeToScreen: 5000,
      eyeToSphere: 6000,
      X: 0,
    },
    {
      name: "Mars",
      color: "rgba(253,166,0,", //bright orange
      radius: 35,
      eyeToScreen: 5000,
      eyeToSphere: 6000,
      X: -550,
      deltaC: 0.01,
      resolutionAroundYAxis: 0.005,
    },
  ];

  solarSystem = createSolarSystem(specs);
  solarSystem.render();
})();
