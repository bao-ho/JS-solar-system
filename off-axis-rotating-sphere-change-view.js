(function () {
  const canvastag = document.getElementById("canvas-donut");
  let timer = undefined;
  let lightSource = "parallel";
  const ctx = canvastag.getContext("2d");
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
  // Rotate p around Oy, translate X along Ox, rotate D around Oy, rotate A around Ox
  const transform = ({ x0, y0, X = 0, p, D, A, Dm }) => {
    const sp = Math.sin(p);
    const cp = Math.cos(p);
    const x1 = x0 * cp + X;
    const y1 = y0;
    const z1 = x0 * sp;

    const cd = Math.cos(D);
    const sd = Math.sin(D);
    const x2 = x1 * cd - z1 * sd;
    const y2 = y1;
    const z2 = x1 * sd + z1 * cd;

    const ca = Math.cos(A);
    const sa = Math.sin(A);
    let x = x2;
    const y = y2 * ca - z2 * sa;
    let z = y2 * sa + z2 * ca;

    // Only to create moon
    if (Dm) {
      x += Dm * Math.cos(D * 2);
      z += Dm * Math.sin(D * 2);
    }

    return { x, y, z };
  };
  const createSphere = ({ name, color, R1, K1, K2, X, deltaC, deltaD }) => {
    let A = -Math.PI / 4;
    let C = 0;
    let D = 0;
    const render = function () {
      for (let j = -1.57; j <= 1.57; j += 0.2) {
        // j <=> theta
        const ct = Math.cos(j);
        const st = Math.sin(j);
        for (i = 0; i < 6.28; i += 0.2) {
          // i <=> phi
          const ox = R1 * ct;
          const oy = R1 * st;
          const point = transform({ x0: ox, y0: oy, X, p: i + C, D, A });
          const ooz = 1 / (K2 + point.z); // one over z
          const { xMin, xMax, yMin, yMax } = viewState.dataView;
          const u =
            (width * (K1 * ooz * point.x - 0.5 * (xMax + xMin))) /
            (xMax - xMin);
          const v =
            (height * (K1 * ooz * point.y - 0.5 * (yMax + yMin))) /
            (yMax - yMin);
          const xp = u + width / 2;
          const yp = height / 2 - v;
          const normalVector = transform({ x0: ct, y0: st, p: i + C, D, A });
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
            const ox = (R1 / 2) * ct;
            const oy = (R1 / 2) * st;
            const point = transform({
              x0: ox,
              y0: oy,
              X,
              p: i + C,
              D,
              A,
              Dm: X / 5,
            });
            const ooz = 1 / (K2 + point.z); // one over z
            const { xMin, xMax, yMin, yMax } = viewState.dataView;
            const u =
              (width * (K1 * ooz * point.x - 0.5 * (xMax + xMin))) /
              (xMax - xMin);
            const v =
              (height * (K1 * ooz * point.y - 0.5 * (yMax + yMin))) /
              (yMax - yMin);
            const xp = u + width / 2;
            const yp = height / 2 - v;
            const normalVector = transform({ x0: ct, y0: st, p: i + C, D, A });

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
        A += deltaA;
        render();
      },
      rotateAroundYAxis(deltaC) {
        C += deltaC;
        render();
      },
      animate() {
        C += deltaC ? deltaC : 0;
        D += deltaD ? deltaD : 0;
        render();
      },
      drawTrace() {
        ctx.fillStyle = color + 075 + ")";
        for (let E = 0; E < Math.PI * 2; E += 0.1) {
          const point = transform({ x0: X, y0: 0, p: E, D: 0, A });
          const ooz = 1 / (K2 + point.z); // one over z
          const { xMin, xMax, yMin, yMax } = viewState.dataView;
          const u =
            (width * (K1 * ooz * point.x - 0.5 * (xMax + xMin))) /
            (xMax - xMin);
          const v =
            (height * (K1 * ooz * point.y - 0.5 * (yMax + yMin))) /
            (yMax - yMin);
          const xp = u + width / 2;
          const yp = height / 2 - v;
          ctx.fillRect(xp, yp, 2, 2);
        }
      },
    };
    return api;
  };

  // HAMMER JS
  const myElement = document.getElementById("canvas-donut");
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

  // WHEEL
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

  window.resetToHomeView = function () {
    viewState.scale = 1;
    viewState.dataView = homeDataView;
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
      R1: 50,
      K1: 5000,
      K2: 6000,
      X: 500,
      deltaC: 0.01,
      deltaD: 0.01,
    },
    {
      name: "Sun",
      color: "rgba(255,240,100,", //bright yellow
      R1: 100,
      K1: 5000,
      K2: 6000,
      X: 0,
    },
    {
      name: "Mars",
      color: "rgba(253,166,0,", //bright orange
      R1: 35,
      K1: 5000,
      K2: 6000,
      X: -650,
      deltaC: 0.01,
      deltaD: 0.005,
    },
  ];
  solarSystem = createSolarSystem(specs);
  solarSystem.render();
})();
