/**
 * Converts 2D screen coordinates to 3D world coordinates.
 *
 * @param {number} x - The x-coordinate of the cursor on the screen.
 * @param {number} y - The y-coordinate of the cursor on the screen.
 * @param {BABYLON.Engine} engine - The Babylon.js engine instance used in the scene.
 * @param {BABYLON.Scene} scene - The Babylon.js scene in which the conversion will be performed.
 *
 * @returns {BABYLON.Vector3} - A Vector3 object representing the resulting 3D world coordinates.
 */
export const unproject = ({ x, y, engine, scene }) =>
BABYLON.Vector3.Unproject(
    new BABYLON.Vector3(x, y, 0),
    engine.getRenderWidth(),
    engine.getRenderHeight(),
    BABYLON.Matrix.Identity(),
    scene.getViewMatrix(),
    scene.getProjectionMatrix()
);