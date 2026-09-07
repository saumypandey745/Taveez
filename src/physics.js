/**
 * Taveez — Real Pendulum Physics Engine & Canvas Renderer
 * 
 * Differential Equation:
 *   alpha = -(g / L) * sin(theta) - damping * omega + windForce
 */

export class Pendulum {
  constructor(id, emoji, originX, originY, length = 160, mass = 1.0) {
    this.id = id;
    this.emoji = emoji;
    this.originX = originX;
    this.originY = originY;
    this.length = length; // String length in pixels
    this.mass = mass;

    // Physics State
    this.theta = 0;       // Angle in radians (0 = straight down)
    this.omega = 0;       // Angular velocity (rad/s)
    this.alpha = 0;       // Angular acceleration (rad/s^2)

    // Parameters
    this.g = 9.81 * 80;   // Gravitational constant scaled to canvas pixels
    this.damping = 1.2;   // Air resistance damping factor
    this.bobRadius = 32;  // Collision radius around the emoji bob

    // Drag State
    this.isDragging = false;
    this.pointerTrail = []; // [{x, y, time}]
    this.scale = 1.0;     // Ritual pulsation scale
  }

  update(dt, windForce = 0) {
    if (this.isDragging) return;

    // Formula: angularAccel = -(g/L)*sin(theta) - damping*omega + windForce
    this.alpha = -(this.g / this.length) * Math.sin(this.theta) - (this.damping * this.omega) + windForce;
    
    // Euler-Cromer Numerical Integration
    this.omega += this.alpha * dt;
    this.theta += this.omega * dt;

    // Cap extreme angles to prevent inverted looping
    const maxAngle = Math.PI * 0.85;
    if (this.theta > maxAngle) {
      this.theta = maxAngle;
      this.omega = -this.omega * 0.3;
    } else if (this.theta < -maxAngle) {
      this.theta = -maxAngle;
      this.omega = -this.omega * 0.3;
    }

    // Gentle pulse decay if scaled from ritual
    if (this.scale > 1.0) {
      this.scale = Math.max(1.0, this.scale - dt * 0.8);
    }
  }

  getBobPosition() {
    return {
      x: this.originX + this.length * Math.sin(this.theta),
      y: this.originY + this.length * Math.cos(this.theta)
    };
  }

  nudge(impulseOmega) {
    this.omega += impulseOmega;
  }

  triggerRitualPulse() {
    this.scale = 1.35;
    this.nudge((Math.random() > 0.5 ? 1 : -1) * 1.5);
  }

  startDrag(px, py) {
    this.isDragging = true;
    this.pointerTrail = [{ x: px, y: py, time: performance.now() }];
    this.setAngleFromPointer(px, py);
  }

  dragMove(px, py) {
    if (!this.isDragging) return;
    const now = performance.now();
    this.pointerTrail.push({ x: px, y: py, time: now });
    if (this.pointerTrail.length > 6) {
      this.pointerTrail.shift();
    }
    this.setAngleFromPointer(px, py);
  }

  endDrag() {
    if (!this.isDragging) return;
    this.isDragging = false;

    // Calculate release velocity vector from recent pointer samples
    if (this.pointerTrail.length >= 2) {
      const oldest = this.pointerTrail[0];
      const newest = this.pointerTrail[this.pointerTrail.length - 1];
      const dt = (newest.time - oldest.time) / 1000;

      if (dt > 0.005) {
        const vx = (newest.x - oldest.x) / dt; // pixels per second
        // Tangential velocity component along pendulum arc
        const tangentX = Math.cos(this.theta);
        const tangentialVel = vx * tangentX;
        
        // Convert linear tangential velocity to angular velocity omega = v / L
        const flickOmega = tangentialVel / this.length;
        const maxFlick = 12.0;
        this.omega = Math.max(-maxFlick, Math.min(maxFlick, flickOmega * 0.4));
      }
    }
    this.pointerTrail = [];
  }

  setAngleFromPointer(px, py) {
    const dx = px - this.originX;
    const dy = py - this.originY;
    // Calculate angle relative to vertical down
    let angle = Math.atan2(dx, dy);
    const maxAngle = Math.PI * 0.75;
    this.theta = Math.max(-maxAngle, Math.min(maxAngle, angle));
    this.omega = 0;
  }
}

/**
 * Multi-Charm Collision Engine
 * Check and resolve 2D circle collisions between charms in Garland mode
 */
export function checkCollisions(pendulums, onCollision) {
  if (pendulums.length < 2) return;

  for (let i = 0; i < pendulums.length; i++) {
    for (let j = i + 1; j < pendulums.length; j++) {
      const p1 = pendulums[i];
      const p2 = pendulums[j];

      const pos1 = p1.getBobPosition();
      const pos2 = p2.getBobPosition();

      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const dist = Math.hypot(dx, dy);
      const minDist = p1.bobRadius + p2.bobRadius;

      if (dist < minDist && dist > 0) {
        // Elastic impulse exchange based on relative tangential angular velocities
        const deltaOmega = p1.omega - p2.omega;
        const restitution = 0.75; // Bounciness factor

        p1.omega -= deltaOmega * 0.5 * (1 + restitution);
        p2.omega += deltaOmega * 0.5 * (1 + restitution);

        // Nudge theta apart slightly to prevent overlap sticking
        const overlap = (minDist - dist) / p1.length;
        const sign = dx > 0 ? 1 : -1;
        p1.theta -= sign * overlap * 0.4;
        p2.theta += sign * overlap * 0.4;

        if (onCollision) {
          onCollision(p1, p2);
        }
      }
    }
  }
}

/**
 * Ambient Wind Generator
 * Produces slow, organic low-magnitude force using sine combinations
 */
export class AmbientWind {
  constructor() {
    this.time = 0;
  }

  getForce(dt) {
    this.time += dt;
    // Combine two slow sine waves for natural wind variance
    const w1 = Math.sin(this.time * 0.5) * 0.08;
    const w2 = Math.cos(this.time * 1.3) * 0.04;
    return w1 + w2;
  }
}

/**
 * Pendulum Canvas Renderer
 */
export function renderPendulum(ctx, pendulum, options = {}) {
  const { isDark = true, isFocused = false } = options;
  const bobPos = pendulum.getBobPosition();

  ctx.save();

  // 1. Draw Woven Thread / Metallic String
  ctx.beginPath();
  ctx.moveTo(pendulum.originX, pendulum.originY);
  ctx.lineTo(bobPos.x, bobPos.y);

  ctx.strokeStyle = isDark ? '#dfb76c' : '#a3821a';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 4;
  ctx.stroke();

  // Draw thread weave details (dots along string)
  ctx.beginPath();
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = isDark ? '#91751d' : '#634f0d';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Draw Brass Ring Connector at Top & Bottom
  // Top Rail Ring
  ctx.beginPath();
  ctx.arc(pendulum.originX, pendulum.originY + 6, 6, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? '#f3d798' : '#d4af37';
  ctx.fill();
  ctx.strokeStyle = '#634f0d';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Bottom Charm Ring
  ctx.beginPath();
  ctx.arc(bobPos.x, bobPos.y - pendulum.bobRadius + 8, 5, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? '#f3d798' : '#d4af37';
  ctx.fill();
  ctx.stroke();

  // 3. Focus Ring if Keyboard Focus
  if (isFocused) {
    ctx.beginPath();
    ctx.arc(bobPos.x, bobPos.y, pendulum.bobRadius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = '#3a86ff';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // 4. Draw Charm Emoji Bob & Glow
  ctx.save();
  ctx.translate(bobPos.x, bobPos.y);

  // Rotate slightly matching the pendulum angle
  ctx.rotate(pendulum.theta * 0.4);

  // Apply scale if ritual triggered
  ctx.scale(pendulum.scale, pendulum.scale);

  // Soft aura glow
  if (pendulum.scale > 1.0) {
    const glowGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, pendulum.bobRadius * 1.5);
    glowGradient.addColorStop(0, 'rgba(212, 175, 55, 0.8)');
    glowGradient.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, pendulum.bobRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Emoji Text
  ctx.font = `${pendulum.bobRadius * 1.6}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillText(pendulum.emoji, 0, 0);

  ctx.restore();
  ctx.restore();
}
