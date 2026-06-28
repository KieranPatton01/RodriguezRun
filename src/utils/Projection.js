// =============================================================
// Projection.js — Pseudo-3D (2.5D) coordinate projection
// Converts 3D world space (X, Y, Z) to 2D screen space
// =============================================================

import { CONFIG } from '../config.js';

export class Projection {
  /**
   * Projects 3D coordinates into 2D screen space based on camera depth and FOV.
   * @param {number} worldX - Horizontal position (0 is center, negative is left)
   * @param {number} worldY - Vertical altitude (0 is ground level)
   * @param {number} worldZ - Depth into the screen (0 is player plane)
   * @param {number} screenW - Current screen width
   * @param {number} screenH - Current screen height
   * @returns {Object} { x, y, scale } for the 2D sprite
   */
  static getHorizonY(screenW, screenH) {
    const screenScale = Math.max(screenW / 480, screenH / 854);
    const camH = CONFIG.CAMERA.HEIGHT;
    const fov = CONFIG.CAMERA.FOV;
    const camZ = CONFIG.CAMERA.Z || 0;
    
    // Calculate depth scale exactly at the player's plane (Z=0)
    const distAtZero = 0 - camZ;
    const depthScaleAtZero = fov / (fov + distAtZero);

    // Ground (Z=0) should be at 85% of screen height.
    let horizonY = (screenH * 0.85) - (camH * depthScaleAtZero * screenScale);
    return Math.max(screenH * 0.1, Math.min(horizonY, screenH * 0.75));
  }

  static project(worldX, worldY, worldZ, screenW, screenH) {
    const fov = CONFIG.CAMERA.FOV;
    const camZ = CONFIG.CAMERA.Z || 0;
    
    // Scale factor based on distance from camera
    const dist = worldZ - camZ;
    // Don't let distance go behind the camera to avoid negative scale inversion
    // Clamp the distance so scale maxes out at ~4x normal size before the object is despawned
    const safeDist = Math.max(-fov + 100, dist);
    let depthScale = fov / (fov + safeDist);
    
    // Hard cap just in case to prevent infinite scaling/zipping off screen
    if (depthScale > 4.0) depthScale = 4.0;

    // Responsive scaling: make sure the world fills the screen.
    const screenScale = Math.max(screenW / 480, screenH / 854);
    const finalScale = depthScale * screenScale;

    // Dynamic vanishing point
    const centerX = screenW / 2;
    const horizonY = this.getHorizonY(screenW, screenH);
    
    // Fixed camera height from config for consistent perspective
    const camH = CONFIG.CAMERA.HEIGHT;
    
    // So actual relative Y distance is (worldY - camH)
    const relativeY = worldY - camH;

    // Apply projection scale
    const screenX = centerX + (worldX * finalScale);
    const screenY = horizonY - (relativeY * finalScale);

    return { x: screenX, y: screenY, scale: finalScale };
  }
}
