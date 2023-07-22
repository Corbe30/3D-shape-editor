import { unproject } from "./mathUtils.mjs";

/**
 * Changes the color of a selected face of the mesh box.
 *
 * @param {BABYLON.PickingInfo} pickResult - The picking result containing information about the selected face.
 * @param {BABYLON.Mesh} box - The 3D mesh box.
 * @param {BABYLON.Color4} clr - The color to set for the selected face.
 * @param {number} selectedFace - The index of the selected face to modify.
 * @returns {void}
 */
export function changeColor(pickResult, box, clr, selectedFace) { 
    var face = pickResult.faceId / 2;
    var facet = 2 * Math.floor(face);
    var indices = box.getIndices();

    selectedFace = facet;
    
    var positions = box.getVerticesData(BABYLON.VertexBuffer.PositionKind);

    var nbVertices = positions.length / 3;
    var colors = new Array(4 * nbVertices);
    colors = colors.fill(1);
    var vertex;
    for (var i = 0; i < 6; i++) {
        vertex = indices[3 * facet + i];
        colors[4 * vertex] = clr.r;
        colors[4 * vertex + 1] = clr.g;
        colors[4 * vertex + 2] = clr.b;
        colors[4 * vertex + 3] = clr.a;
    }
    box.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors, true);
}

/**
 * Resets the colors of all faces of the mesh box to their default values.
 *
 * @param {BABYLON.Mesh} box - The 3D mesh box.
 * @param {number} selectedFace - The index of the selected face (not used in this function).
 * @returns {void}
 */
export function resetSelectedFaces(box, selectedFace) {
    var positions = box.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    if(positions == null) return;
    var nbVertices = positions.length / 3;
    var colors = new Array(4 * nbVertices);
    colors = colors.fill(1);
    box.updateVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
    selectedFace = -1;
}

/**
 * Resets the mesh box to its original geometry and rotation.
 *
 * @param {BABYLON.Mesh} box - The 3D mesh box.
 * @param {object} extrusionDetails - The extrusion details object containing details about selected mesh.
 * @param {BABYLON.GUI.TextBlock} cursorText - text that follows the cursor on scaling/extrusion
 * @param {Float32Array} resetGeometry - The original geometry data to reset the mesh.
 * @param {BABYLON.Quaternion} resetRotation - The original rotation quaternion to reset the mesh.
 * @returns {void}
 */
export function resetMesh(box, extrusionDetails, cursorText, resetGeometry, resetRotation) {
    nullifyExtrusionDetails(extrusionDetails, cursorText);
    box.setVerticesData(BABYLON.VertexBuffer.PositionKind, resetGeometry, true);
    box.rotationQuaternion = resetRotation;
    box.enableEdgesRendering();
}

/**
 * Undoes the transformation of the mesh box and resets it to its original state.
 *
 * @param {BABYLON.Mesh} box - The 3D mesh box.
 * @param {object} extrusionDetails - The extrusion details object containing details about selected mesh.
 * @param {BABYLON.GUI.TextBlock} cursorText - text that follows the cursor on scaling/extrusion
 * @returns {void}
 */
export function undoMesh(box, extrusionDetails, cursorText) {
    if(extrusionDetails.originalGeometry != null)
        box.setVerticesData(BABYLON.VertexBuffer.PositionKind, extrusionDetails.originalGeometry, true);
    if(extrusionDetails.originalRotation != null)
        box.rotationQuaternion = extrusionDetails.originalRotation;
    nullifyExtrusionDetails(extrusionDetails, cursorText);
}


/**
 * Rotates the mesh box based on mouse movement
 *
 * @param {object} extrusionDetails - The extrusion details object containing details about selected mesh.
 * @param {BABYLON.GUI.TextBlock} cursorText - text that follows the cursor on scaling/extrusion
 * @param {BABYLON.Engine} engine - The Babylon.js engine instance.
 * @param {BABYLON.Scene} scene - The Babylon.js scene.
 * @returns {void}
 */
export function rotateMesh(extrusionDetails, cursorText, engine, scene) {
    var mesh = extrusionDetails.mesh;
    var facet = extrusionDetails.face;
    var position = extrusionDetails.position;

    // Get the mesh's geometry
    var facet = 2 * Math.floor(facet / 2);
    var indices = mesh.getIndices();
    var geometry = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);

    // Calculate the offset vector from the mouse position to the clicked position
    const mousePosition = unproject({
        x: scene.pointerX,
        y: scene.pointerY,
        engine, scene
    });
    var offset = (mousePosition.subtract(position)).scale(14);

    // If the indices list for the selected face is not yet created, initialize it
    if(extrusionDetails.indicesList == null) {
        extrusionDetails.indicesList = new Set();
        extrusionDetails.indicesList.add(indices[facet * 3]);
        extrusionDetails.indicesList.add(indices[facet * 3 + 1]);
        extrusionDetails.indicesList.add(indices[facet * 3 + 2]);
        extrusionDetails.indicesList.add(indices[(facet + 1) * 3]);
        extrusionDetails.indicesList.add(indices[(facet + 1) * 3 + 1]);
        extrusionDetails.indicesList.add(indices[(facet + 1) * 3 + 2]);
    }
    
    // Create a set to store the unique vertices of the selected face
    var verticlesList = new Set();
    extrusionDetails.indicesList.forEach( index => {
        var v = BABYLON.Vector3.FromArray(geometry, index * 3);
    verticlesList.add(v);
    });
    
    // If the center vertex of the selected face is not yet calculated, calculate & initialize it
    if(extrusionDetails.centerVertex == null) {
        var centerVertex = new BABYLON.Vector3(0,0,0);
        verticlesList.forEach( vertex => {
            centerVertex.x += vertex.x;
            centerVertex.y += vertex.y;
            centerVertex.z += vertex.z;
        })
        centerVertex.x = centerVertex.x/verticlesList.size;
        centerVertex.y = centerVertex.y/verticlesList.size;
        centerVertex.z = centerVertex.z/verticlesList.size;
        extrusionDetails.centerVertex = centerVertex;
    }

    // If the face normal of the selected face is not yet calculated, calculate & set it
    if(extrusionDetails.faceNormal == null) {
        var [v0, v1, v2] = Array.from(verticlesList);
        var faceNormal = BABYLON.Vector3.Cross(
            v2.subtract(v0), 
            v1.subtract(v0)
        );
        faceNormal.normalize();
        faceNormal.x =  Math.abs(faceNormal.x);
        faceNormal.y =  Math.abs(faceNormal.y);
        faceNormal.z =  Math.abs(faceNormal.z);
        extrusionDetails.faceNormal = faceNormal;
    }

    // Update cursor position to adjust help-text on each mouse move
    var width = engine.getRenderWidth();
    var height = engine.getRenderHeight();
    cursorText.leftInPixels = scene.pointerX - (width / 2.0) + 55;
    cursorText.topInPixels = scene.pointerY - (height / 2.0) + 15;

    // Calculate & apply the rotation quaternion based on the face normal and offset
    var rotationQuaternion = BABYLON.Quaternion.RotationAxis(extrusionDetails.faceNormal, offset.length());
    mesh.rotationQuaternion = rotationQuaternion;
}


/**
 * Transforms (scaling/extruding) the selected face of the mesh box based on mouse movement
 *
 * @param {object} extrusionDetails - The extrusion details object containing details about selected mesh.
 * @param {boolean} allowScaling - A flag indicating whether to scale or not.
 * @param {BABYLON.GUI.TextBlock} cursorText - text that follows the cursor on scaling/extrusion
 * @param {BABYLON.Engine} engine - The Babylon.js engine instance.
 * @param {BABYLON.Scene} scene - The Babylon.js scene.
 * @returns {void}
 */
export function transformFace(extrusionDetails, allowScaling, cursorText, engine, scene) {
    var mesh = extrusionDetails.mesh;
    var facet = extrusionDetails.face;
    var position = extrusionDetails.position;
    var originalGeometry = extrusionDetails.originalGeometry;

    // Get the mesh's geometry
    var facet = 2 * Math.floor(facet / 2);
    var indices = mesh.getIndices();
    var geometry = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);

    // Calculate the offset vector from the mouse position to the clicked position
    const mousePosition = unproject({
        x: scene.pointerX,
        y: scene.pointerY,
        engine, scene
    });
    var offset = (mousePosition.subtract(position)).scale(14);

    // If the indices list for the selected face is not yet created, initialize it
    if(extrusionDetails.indicesList == null) {
        extrusionDetails.indicesList = new Set();
        extrusionDetails.indicesList.add(indices[facet * 3]);
        extrusionDetails.indicesList.add(indices[facet * 3 + 1]);
        extrusionDetails.indicesList.add(indices[facet * 3 + 2]);
        extrusionDetails.indicesList.add(indices[(facet + 1) * 3]);
        extrusionDetails.indicesList.add(indices[(facet + 1) * 3 + 1]);
        extrusionDetails.indicesList.add(indices[(facet + 1) * 3 + 2]);
    }
    
    // Create a set to store the unique vertices of the selected face
    var verticlesList = new Set();
    extrusionDetails.indicesList.forEach( index => {
        var v = BABYLON.Vector3.FromArray(geometry, index * 3);
    verticlesList.add(v);
    });

    // If the center vertex of the selected face is not yet calculated, calculate it
    if(extrusionDetails.centerVertex == null) {
        var centerVertex = new BABYLON.Vector3(0,0,0);
        verticlesList.forEach( vertex => {
            centerVertex.x += vertex.x;
            centerVertex.y += vertex.y;
            centerVertex.z += vertex.z;
        })
        centerVertex.x = centerVertex.x/verticlesList.size;
        centerVertex.y = centerVertex.y/verticlesList.size;
        centerVertex.z = centerVertex.z/verticlesList.size;
        extrusionDetails.centerVertex = centerVertex;
    }

    // If the face normal of the selected face is not yet calculated, calculate it
    if(extrusionDetails.faceNormal == null) {
        var [v0, v1, v2] = Array.from(verticlesList);
        var faceNormal = BABYLON.Vector3.Cross(
            v2.subtract(v0), 
            v1.subtract(v0)
        );
        faceNormal.normalize();
        faceNormal.x =  Math.abs(faceNormal.x);
        faceNormal.y =  Math.abs(faceNormal.y);
        faceNormal.z =  Math.abs(faceNormal.z);
        extrusionDetails.faceNormal = faceNormal;
    }

    // Update cursor position to adjust help-text on each mouse move
    var width = engine.getRenderWidth();
    var height = engine.getRenderHeight();
    cursorText.leftInPixels = scene.pointerX - (width / 2.0) + 55;
    cursorText.topInPixels = scene.pointerY - (height / 2.0) + 15;

    // Loop through all relevant vertices to apply transformation to the selected face
    for(var i = 0; i < geometry.length / 3; i++){
        var v = BABYLON.Vector3.FromArray(geometry, i*3);
        verticlesList.forEach( vertex => {
            if(vertex.equals(v)) {
                modifyDistance(geometry, i, extrusionDetails.faceNormal, offset, originalGeometry, allowScaling, extrusionDetails.centerVertex, cursorText);
            }
        })
    }

    mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, Array.from(geometry), true);
}

/**
 * performs mathematical calculations for extrusion or scaling on mesh
 *
 * @param {Float32Array} geometry - The geometry data of the mesh box.
 * @param {number} i - The index of the vertex to modify.
 * @param {BABYLON.Vector3} faceNormal - The normal vector of the selected face
 * @param {BABYLON.Vector3} offset - The offset vector to apply to the vertex during extrusion/scaling (equals to cursor offset)
 * @param {Float32Array} originalGeometry - The original geometry data of the mesh box.
 * @param {boolean} allowScaling - A flag indicating whether scaling is allowed during extrusion
 * @param {BABYLON.Vector3} centerVertex - The center vertex used for scaling
 * @param {BABYLON.GUI.TextBlock} cursorText - text that follows the cursor on scaling/extrusion
 * @returns {void}
 */
function modifyDistance(geometry, i, faceNormal, offset, originalGeometry, allowScaling, centerVertex, cursorText) {
    if(!allowScaling) {
        geometry[3 * i + 0] = originalGeometry[3 * i + 0] + (faceNormal.x * offset.x);
        geometry[3 * i + 1] = originalGeometry[3 * i + 1] + (faceNormal.y * offset.y);
        geometry[3 * i + 2] = originalGeometry[3 * i + 2] + (faceNormal.z * offset.z);
        cursorText.text = `[${(faceNormal.x * offset.x).toFixed(2)}, ${(faceNormal.y * offset.y).toFixed(2)}, ${(faceNormal.z * offset.z).toFixed(2)}]`;
    }
    else {
        geometry[3 * i + 0] = ((originalGeometry[3 * i + 0] - centerVertex.x) * (1 + offset.length())) + centerVertex.x;
        geometry[3 * i + 1] = ((originalGeometry[3 * i + 1] - centerVertex.y) * (1 + offset.length())) + centerVertex.y;
        geometry[3 * i + 2] = ((originalGeometry[3 * i + 2] - centerVertex.z) * (1 + offset.length())) + centerVertex.z;
        cursorText.text = `${(1 + offset.length()).toFixed(2)}`;
    }
}

/**
 * Resets the mesh details and clears cursor text information.
 *
 * @param {object} extrusionDetails - The extrusion details object to reset.
 * @param {BABYLON.GUI.TextBlock} cursorText - text that follows the cursor on scaling/extrusion
 * @returns {void}
 */
export function nullifyExtrusionDetails(extrusionDetails, cursorText) {
    extrusionDetails.allow = false;
    extrusionDetails.mesh = null;
    extrusionDetails.face = null;
    extrusionDetails.position = null;
    extrusionDetails.centerVertex = null;
    extrusionDetails.faceNormal = null;
    extrusionDetails.indicesList = null;
    cursorText.text = "";
}
