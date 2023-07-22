import { unproject } from "./mathUtils.mjs";

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

export function resetSelectedFaces(box, selectedFace) {
    var positions = box.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    if(positions == null) return;
    var nbVertices = positions.length / 3;
    var colors = new Array(4 * nbVertices);
    colors = colors.fill(1);
    box.updateVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
    selectedFace = -1;
}

export function resetMesh(box, extrusionDetails, cursorText, resetGeometry, resetRotation) {
    nullifyExtrusionDetails(extrusionDetails, cursorText);
    box.setVerticesData(BABYLON.VertexBuffer.PositionKind, resetGeometry, true);
    box.rotationQuaternion = resetRotation;
    // box.dispose();
    // box = BABYLON.MeshBuilder.CreateBox("box", {size: 2}, scene);
    box.enableEdgesRendering();
}

export function undoMesh(box, extrusionDetails, cursorText) {
    if(extrusionDetails.originalGeometry != null)
        box.setVerticesData(BABYLON.VertexBuffer.PositionKind, extrusionDetails.originalGeometry, true);
    if(extrusionDetails.originalRotation != null)
        box.rotationQuaternion = extrusionDetails.originalRotation;
    nullifyExtrusionDetails(extrusionDetails, cursorText);
}

export function rotateMesh(extrusionDetails, cursorText, engine, scene) {
    var mesh = extrusionDetails.mesh;
    var facet = extrusionDetails.face;
    var position = extrusionDetails.position;

    // Get the mesh's geometry
    var facet = 2 * Math.floor(facet / 2);
    var indices = mesh.getIndices();
    var geometry = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);

    const mousePosition = unproject({
        x: scene.pointerX,
        y: scene.pointerY,
        engine, scene
    });
    var offset = (mousePosition.subtract(position)).scale(14);

    if(extrusionDetails.indicesList == null) {
        extrusionDetails.indicesList = new Set();
        extrusionDetails.indicesList.add(indices[facet * 3]);
        extrusionDetails.indicesList.add(indices[facet * 3 + 1]);
        extrusionDetails.indicesList.add(indices[facet * 3 + 2]);
        extrusionDetails.indicesList.add(indices[(facet + 1) * 3]);
        extrusionDetails.indicesList.add(indices[(facet + 1) * 3 + 1]);
        extrusionDetails.indicesList.add(indices[(facet + 1) * 3 + 2]);
    }
        
    var verticlesList = new Set();
        extrusionDetails.indicesList.forEach( index => {
            var v = BABYLON.Vector3.FromArray(geometry, index * 3);
        verticlesList.add(v);
        });
    
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

    var width = engine.getRenderWidth();
    var height = engine.getRenderHeight();
    cursorText.leftInPixels = scene.pointerX - (width / 2.0) + 55;
    cursorText.topInPixels = scene.pointerY - (height / 2.0) + 15;

    var rotationQuaternion = BABYLON.Quaternion.RotationAxis(extrusionDetails.faceNormal, offset.length());
    mesh.rotationQuaternion = rotationQuaternion;
}

export function extrudeFace(extrusionDetails, isKeyPressed, cursorText, engine, scene) {
    var mesh = extrusionDetails.mesh;
    var facet = extrusionDetails.face;
    var position = extrusionDetails.position;
    var originalGeometry = extrusionDetails.originalGeometry;

    // Get the mesh's geometry
    var facet = 2 * Math.floor(facet / 2);
    var indices = mesh.getIndices();
    var geometry = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);

    const mousePosition = unproject({
        x: scene.pointerX,
        y: scene.pointerY,
        engine, scene
    });
    var offset = (mousePosition.subtract(position)).scale(14);

    if(extrusionDetails.indicesList == null) {
        extrusionDetails.indicesList = new Set();
        extrusionDetails.indicesList.add(indices[facet * 3]);
        extrusionDetails.indicesList.add(indices[facet * 3 + 1]);
        extrusionDetails.indicesList.add(indices[facet * 3 + 2]);
        extrusionDetails.indicesList.add(indices[(facet + 1) * 3]);
        extrusionDetails.indicesList.add(indices[(facet + 1) * 3 + 1]);
        extrusionDetails.indicesList.add(indices[(facet + 1) * 3 + 2]);
    }
        
    var verticlesList = new Set();
        extrusionDetails.indicesList.forEach( index => {
            var v = BABYLON.Vector3.FromArray(geometry, index * 3);
        verticlesList.add(v);
        });

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

    var width = engine.getRenderWidth();
    var height = engine.getRenderHeight();
    cursorText.leftInPixels = scene.pointerX - (width / 2.0) + 55;
    cursorText.topInPixels = scene.pointerY - (height / 2.0) + 15;

    for(var i = 0; i < geometry.length / 3; i++){
        var v = BABYLON.Vector3.FromArray(geometry, i*3);
        verticlesList.forEach( vertex => {
            if(vertex.equals(v)) {
                modifyDistance(geometry, i, extrusionDetails.faceNormal, offset, originalGeometry, isKeyPressed, extrusionDetails.centerVertex, cursorText);
            }
        })
    }

    mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, Array.from(geometry), true);
}

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
