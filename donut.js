(function () {
  let _onload = function () {
    let canvastag = document.getElementById("canvas-donut");
    let tmr2 = undefined;
    let A = 1;
    let B = 1;
    let R1 = 1;
    let R2 = 2;
    let K1 = 150;
    let K2 = 5;
    let canvasframe = function () {
      let ctx = canvastag.getContext("2d");
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      A += 0.07;
      B += 0.03;
      // precompute cosines and sines of A, B, theta, phi, same as before
      let cA = Math.cos(A),
        sA = Math.sin(A),
        cB = Math.cos(B),
        sB = Math.sin(B);
      for (let j = 0; j < 6.28; j += 0.3) {
        // j <=> theta
        let ct = Math.cos(j),
          st = Math.sin(j); // cosine theta, sine theta
        for (i = 0; i < 6.28; i += 0.1) {
          // i <=> phi
          let sp = Math.sin(i),
            cp = Math.cos(i); // cosine phi, sine phi
          let ox = R2 + R1 * ct, // object x, y = (R2,0,0) + (R1 cos theta, R1 sin theta, 0)
            oy = R1 * st;
          let x = ox * (cB * cp + sA * sB * sp) - oy * cA * sB; // final 3D x coordinate
          let y = ox * (sB * cp - sA * cB * sp) + oy * cA * cB; // final 3D y
          let ooz = 1 / (K2 + cA * ox * sp + sA * oy); // one over z
          let xp = 160 + K1 * ooz * x; // x' = screen space coordinate, translated and scaled to fit our 320x240 canvas element
          let yp = 120 - K1 * ooz * y; // y' (it's negative here because in our output, positive y goes down but in our 3D space, positive y goes up)
          // luminance, scaled back to 0 to 1
          let L =
            0.7 *
            (cp * ct * sB -
              cA * ct * sp -
              sA * st +
              cB * (cA * st - ct * sA * sp));
          if (L > 0) {
            ctx.fillStyle = "rgba(255,255,255," + L + ")";
            ctx.fillRect(xp, yp, 2, 2);
          }
        }
      }
    };

    window.anim2 = function () {
      if (tmr2 === undefined) {
        tmr2 = setInterval(canvasframe, 50);
      } else {
        clearInterval(tmr2);
        tmr2 = undefined;
      }
    };
    canvasframe();
  };

  if (document.all) window.attachEvent("onload", _onload);
  else window.addEventListener("load", _onload, false);
})();
