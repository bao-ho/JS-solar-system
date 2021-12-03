(function () {
  let _onload = function () {
    let canvastag = document.getElementById("canvas-donut");
    let tmr2 = undefined;
    let ctx = canvastag.getContext("2d");
    const { width, height } = ctx.canvas;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    let sun;
    const createSphere = ({ R1, R2, K1, K2, A0, B, X }) => {
      let C = 0;
      const render = function () {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);
        for (let j = -1.57; j <= 1.57; j += 0.2) {
          // j <=> theta
          let ct = Math.cos(j),
            st = Math.sin(j); // cosine theta, sine theta
          for (i = 0; i < 6.28; i += 0.2) {
            // i <=> phi
            let sp = Math.sin(i + C),
              cp = Math.cos(i + C); // cosine phi, sine phi
            let ox = R1 * ct, // object x, y = (R2,0,0) + (R1 cos theta, R1 sin theta, 0)
              oy = R1 * st;
            // let x = ox * cp + X; // final 3D x coordinate
            // let y = oy; // final 3D y
            // let ooz = 1 / (K2 + ox * sp); // one over z
            let x = ox * cp + X; // final 3D x coordinate
            let y = oy; // final 3D y
            let ooz = 1 / (K2 + ox * sp); // one over z
            let xp = width / 2 + K1 * ooz * x; // x' = screen space coordinate, translated and scaled to fit our 320x240 canvas element
            let yp = height / 2 - K1 * ooz * y; // y' (it's negative here because in our output, positive y goes down but in our 3D space, positive y goes up)
            // luminance, scaled back to 0 to 1
            const L = 0.7 * (st - ct * sp);
            if (L > 0) {
              ctx.fillStyle = "rgba(255,255,255," + L + ")";
              ctx.fillRect(xp, yp, 2, 2);
            }
          }
        }
      };
      const api = {
        render,
        rotateAroundXAxis(deltaA) {
          A += deltaA;
          this.render();
        },
        rotateAroundYAxis(deltaC) {
          C += deltaC;
          render();
        },
      };
      return api;
    };

    // HAMMER JS
    var myElement = document.getElementById("canvas-donut");
    var mc = new Hammer(myElement);
    mc.get("pan").set({ direction: Hammer.DIRECTION_ALL });
    mc.on("panleft panright panup pandown tap press", function (ev) {
      switch (ev.type) {
        case "panup":
          earth.rotateAroundXAxis(0.2);
          break;
        case "pandown":
          earth.rotateAroundXAxis(-0.2);
          break;
        case "panleft":
          earth.rotateAroundYAxis(0.017);
          break;
        case "panright":
          earth.rotateAroundYAxis(-0.017);
          break;
        default:
          break;
      }
    });

    window.anim2 = function () {
      if (tmr2 === undefined) {
        tmr2 = setInterval(earth.rotateAroundYAxis, 50, 0.03);
      } else {
        clearInterval(tmr2);
        tmr2 = undefined;
      }
    };
    // sun = createSphere({ R1: 100, R2: 0, K1: 150, K2: 300, B: 0, X: 0 });
    // sun.render();
    earth = createSphere({ R1: 100, R2: 0, K1: 2500, K2: 3000, B: 0, X: 300 });
    earth.render();
  };

  if (document.all) window.attachEvent("onload", _onload);
  else window.addEventListener("load", _onload, false);
})();
