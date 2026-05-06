const canvas = document.getElementById("guideParticles");
const ctx = canvas.getContext("2d");

const points = Array.from({ length: 70 }, () => ({
  x: Math.random(),
  y: Math.random(),
  vx: (Math.random() - 0.5) * 0.0004,
  vy: (Math.random() - 0.5) * 0.0004,
  r: Math.random() * 1.8 + 0.6,
}));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(153, 198, 255, 0.8)";

  points.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > 1) p.vx *= -1;
    if (p.y < 0 || p.y > 1) p.vy *= -1;

    const px = p.x * canvas.width;
    const py = p.y * canvas.height;
    ctx.beginPath();
    ctx.arc(px, py, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const a = points[i];
      const b = points[j];
      const dx = (a.x - b.x) * canvas.width;
      const dy = (a.y - b.y) * canvas.height;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ctx.strokeStyle = `rgba(125, 177, 255, ${0.12 - dist / 1200})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
        ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(draw);
}

resize();
draw();
window.addEventListener("resize", resize);
