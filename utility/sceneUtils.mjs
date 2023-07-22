/**
 * Sets up the lighting for the scene.
 *
 * @param {BABYLON.Scene} scene - The Babylon.js scene to set up the lighting for.
 * @returns {void}
 */
export function setupLights(scene) {
    // ambient light for I octant
    const ambientLight1 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 1), scene);
    ambientLight1.diffuse = new BABYLON.Color3(1, 1, 1);
    ambientLight1.intensity = 0.5;

    // ambient light for VII octant
    const ambientLight2 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(-1,-1,-1), scene);
    ambientLight2.diffuse = new BABYLON.Color3(1, 1, 1);
    ambientLight2.intensity = 0.75;

    // point light for I quadrant in the XY plane
    const light = new BABYLON.PointLight("light", new BABYLON.Vector3(6,3,0), scene);
    light.diffuse = new BABYLON.Color3(1, 1, 1);
    light.intensity = 1;
}

/**
 * Draws axes of the specified size in the scene.
 *
 * @param {number} size - The size of the axes to be drawn.
 * @param {BABYLON.Scene} scene - The Babylon.js scene to draw the axes in.
 * @returns {void}
 */
export function drawAxes(size, scene) {
    var axisX = BABYLON.Mesh.CreateLines("axisX", [
        new BABYLON.Vector3(-size, 0, 0), new BABYLON.Vector3(size, 0, 0)], scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    axisX.isPickable = false; 

    var axisY = BABYLON.Mesh.CreateLines("axisY", [
        new BABYLON.Vector3(0, -size, 0), new BABYLON.Vector3(0, size, 0)], scene);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    axisY.isPickable = false; 

    var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
        new BABYLON.Vector3(0, 0, -size), new BABYLON.Vector3(0, 0, size)], scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);
    axisZ.isPickable = false; 
}