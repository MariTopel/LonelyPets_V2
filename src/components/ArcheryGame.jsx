// src/components/ArcheryGame.jsx
import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useCoins } from "../contexts/CoinContext";
import "./ArcheryGame.css";

gsap.registerPlugin(MotionPathPlugin);

export default function ArcheryGame() {
  const svgRef = useRef(null);
  const arrowsRef = useRef(null);
  const { addCoins } = useCoins();

  const [shots, setShots] = useState(0);
  const [score, setScore] = useState(0);
  const maxShots = 5;

  useEffect(() => {
    const svg = svgRef.current;
    const arrows = arrowsRef.current;
    const cursorPt = svg.createSVGPoint();
    let randomAngle = 0;

    const pivot = { x: 100, y: 250 };
    const target = { x: 900, y: 249.5 };
    const lineSegment = { x1: 875, y1: 280, x2: 925, y2: 220 };

    function getMouseSVG(e) {
      cursorPt.x = e.clientX;
      cursorPt.y = e.clientY;
      return cursorPt.matrixTransform(svg.getScreenCTM().inverse());
    }

    function aim(e) {
      const pt = getMouseSVG(e);
      pt.x = Math.min(pt.x, pivot.x - 7);
      pt.y = Math.max(pt.y, pivot.y + 7);

      const dx = pt.x - pivot.x;
      const dy = pt.y - pivot.y;
      const angle = Math.atan2(dy, dx) + randomAngle;
      const bowAngle = angle - Math.PI;
      const distance = Math.min(Math.hypot(dx, dy), 50);
      const scale = Math.min(Math.max(distance / 30, 1), 2);

      // animate bow rotation
      gsap.to("#bow", {
        duration: 0.3,
        scaleX: scale,
        rotation: bowAngle + "rad",
        transformOrigin: "right center",
      });
      // animate arrow angle group
      gsap.to(".arrow-angle", {
        duration: 0.3,
        rotation: bowAngle + "rad",
        svgOrigin: `${pivot.x} ${pivot.y}`,
      });
      // pull arrow
      gsap.to(".arrow-angle use", { duration: 0.3, x: -distance });

      // update arc
      const radius = distance * 9;
      const offsetX = Math.cos(bowAngle) * radius;
      const offsetY = Math.sin(bowAngle) * radius;
      const arcW = offsetX * 3;
      gsap.to("#arc", {
        duration: 0.3,
        attr: {
          d: `M100,250c${offsetX},${offsetY},${arcW - offsetX},${
            offsetY + 50
          },${arcW},50`,
        },
        autoAlpha: distance / 60,
      });
    }

    function loose() {
      window.removeEventListener("mousemove", aim);
      window.removeEventListener("mouseup", loose);

      gsap.to("#bow", {
        duration: 0.4,
        scaleX: 1,
        transformOrigin: "right center",
        ease: "elastic.out(1,0.4)",
      });

      const newArrow = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "use"
      );
      newArrow.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#arrow");
      arrows.appendChild(newArrow);

      let hit = false;
      gsap.to(newArrow, {
        duration: 0.5,
        ease: "none",
        motionPath: { path: "#arc", align: "#arc", autoRotate: true },
        onUpdate: function () {
          const t = this.targets()[0];
          const x = gsap.getProperty(t, "x");
          const y = gsap.getProperty(t, "y");
          const rot = gsap.getProperty(t, "rotation");
          const rad = (rot * Math.PI) / 180;
          const seg = {
            x1: x,
            y1: y,
            x2: x + Math.cos(rad) * 60,
            y2: y + Math.sin(rad) * 60,
          };
          const inter = getIntersection(seg, lineSegment);
          if (inter?.segment1 && inter?.segment2) {
            hit = true;
            this.pause();
            const dist = Math.hypot(inter.x - target.x, inter.y - target.y);
            setScore((s) => s + (dist < 7 ? 50 : 30));
            setShots((n) => n + 1);
            showMessage(dist < 7 ? ".bullseye" : ".hit");
          }
        },
        onComplete: function () {
          if (!hit) showMessage(".miss");
          gsap.to("#arc", { duration: 0.3, autoAlpha: 0 });
          gsap.set(".arrow-angle use", { opacity: 0 });
        },
      });
    }

    function draw(e) {
      if (shots >= maxShots) return;
      randomAngle = Math.random() * Math.PI * 0.03 - 0.015;
      gsap.to(".arrow-angle use", { duration: 0.3, opacity: 1 });
      window.addEventListener("mousemove", aim);
      window.addEventListener("mouseup", loose);
      aim(e);
    }

    function showMessage(sel) {
      gsap.set(sel, { autoAlpha: 1, scale: 0, transformOrigin: "center" });
      gsap.to(sel, { scale: 1, ease: "back.out(1.7)", duration: 0.5 });
      gsap.to(sel, {
        delay: 2,
        scale: 0,
        autoAlpha: 0,
        ease: "back.in(1.7)",
        duration: 0.3,
      });
    }

    function getIntersection(s1, s2) {
      const dx1 = s1.x2 - s1.x1;
      const dy1 = s1.y2 - s1.y1;
      const dx2 = s2.x2 - s2.x1;
      const dy2 = s2.y2 - s2.y1;
      const cx = s1.x1 - s2.x1;
      const cy = s1.y1 - s2.y1;
      const denom = dy2 * dx1 - dx2 * dy1;
      if (!denom) return null;
      const ua = (dx2 * cy - dy2 * cx) / denom;
      const ub = (dx1 * cy - dy1 * cx) / denom;
      return {
        x: s1.x1 + ua * dx1,
        y: s1.y1 + ua * dy1,
        segment1: ua >= 0 && ua <= 1,
        segment2: ub >= 0 && ub <= 1,
      };
    }

    svg.addEventListener("mousedown", draw);
    return () => svg.removeEventListener("mousedown", draw);
  }, [shots]);

  return (
    <div id="archery-game">
      <svg
        ref={svgRef}
        viewBox="0 0 1000 500"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ArcGradient">
            <stop offset="0" stopColor="#fff" stopOpacity=".2" />
            <stop offset="50%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <g id="arrow" filter="url(#shadow)">
            <line x2="60" fill="none" stroke="#888" strokeWidth="2" />
            <polygon fill="#888" points="64 0 58 2 56 0 58 -2" />
            <polygon fill="#88ce02" points="2 -3 -4 -3 -1 0 -4 3 2 3 5 0" />
          </g>
        </defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="4"
            flood-color="rgba(0,0,0,0.5)"
          />
        </filter>
        <g className="arrows" ref={arrowsRef} />
        <polyline
          id="bow"
          filter="url(#shadow)"
          points="88,200 88,250 88,300"
          fill="none"
          stroke="#333"
          strokeWidth={4}
        />
        <path
          id="arc"
          fill="none"
          stroke="url(#ArcGradient)"
          strokeWidth={4}
          pointerEvents="none"
          d="M100,250c250-400,550-400,800,0"
        />
        <g id="target">
          {[75, 60, 45, 30, 15].map((r, i) => (
            <circle
              key={i}
              cx={900}
              cy={249.5}
              r={r}
              fill="none"
              stroke={["#666", "#999", "#bbb", "#ddd", "#fff"][i]}
              strokeWidth={i === 0 ? 4 : i === 1 ? 3 : 2}
            />
          ))}
        </g>
        <g className="hit" fill="#ff0" opacity={0} transform="translate(0,100)">
          <text x="500" y="300" textAnchor="middle" fontSize={48}>
            Hit!
          </text>
        </g>
        <g
          className="bullseye"
          fill="#f00"
          opacity={0}
          transform="translate(0,100)"
        >
          <text x="500" y="300" textAnchor="middle" fontSize={48}>
            Bullseye!
          </text>
        </g>
        <g
          className="miss"
          fill="#aaa"
          opacity={0}
          transform="translate(0,100)"
        >
          <text x="500" y="300" textAnchor="middle" fontSize={48}>
            Miss!
          </text>
        </g>
        <g className="arrow-angle">
          <use xlinkHref="#arrow" filter="url(#shadow)" x={100} y={250} />
        </g>
      </svg>
      <div className="stats">
        <p>
          Shots: {shots} / {maxShots} — Score: {score}
        </p>
        {shots >= maxShots && (
          <button onClick={() => addCoins(Math.floor(score / 10))}>
            Finish & Earn {Math.floor(score / 10)} Coins
          </button>
        )}
      </div>
    </div>
  );
}
