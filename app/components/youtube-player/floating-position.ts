export type FloatingPosition = {x: number; y: number};
const MARGIN = 12;
export function clampFloatingPosition(position: FloatingPosition, viewportWidth: number, viewportHeight: number, playerWidth: number, playerHeight: number): FloatingPosition {
  return {
    x: Math.min(Math.max(MARGIN, position.x), Math.max(MARGIN, viewportWidth - playerWidth - MARGIN)),
    y: Math.min(Math.max(MARGIN + 32, position.y), Math.max(MARGIN + 32, viewportHeight - playerHeight - MARGIN)),
  };
}
export function snapFloatingPosition(position: FloatingPosition, viewportWidth: number, viewportHeight: number, playerWidth: number, playerHeight: number): FloatingPosition {
  const clamped = clampFloatingPosition(position, viewportWidth, viewportHeight, playerWidth, playerHeight);
  return {...clamped, x: position.x + playerWidth / 2 < viewportWidth / 2 ? MARGIN : Math.max(MARGIN, viewportWidth - playerWidth - MARGIN)};
}
