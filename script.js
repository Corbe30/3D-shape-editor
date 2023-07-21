const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true);
var startTime = new Date().getTime();
var resetGeometry = null;
var pressedDownOnFace = false;
var allowScaling = false;
var selectedFace = -1;
var extrusionDetails = {
    allow: false,
    mesh: null,
    face: null,
    position: null,
    originalGeometry: null,
    centerVertex: null
};

const unproject = ({ x, y }) =>
BABYLON.Vector3.Unproject(
    new BABYLON.Vector3(x, y, 0),
    engine.getRenderWidth(),
    engine.getRenderHeight(),
    BABYLON.Matrix.Identity(),
    scene.getViewMatrix(),
    scene.getProjectionMatrix()
);

// Add your code here matching the playground format
const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.95, 0.95, 0.95, 1);
    
    var cursorText = new BABYLON.GUI.TextBlock();
    cursorText.text = "";
    cursorText.color = "black";
    cursorText.fontSize = 12;
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    advancedTexture.addControl(cursorText);

    var box = BABYLON.MeshBuilder.CreateBox("box", {size: 2}, scene);
    box.material = new BABYLON.StandardMaterial("boxMaterial", scene);
    box.material.backFaceCulling = false;
    resetGeometry = box.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    extrusionDetails.originalGeometry = resetGeometry;

    box.rotation.x = Math.PI/6;

    box.isPickable = true;
    box.enableEdgesRendering();
    box.edgesWidth = 0;
    box.edgesColor = new BABYLON.Color4(0, 0, 0, 1);

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2.5, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0));
    camera.attachControl(canvas, true);
    
    setupLights(scene);
    drawAxes(100, scene);

    // Register the onKeyboardObservable to listen for keyboard events
    scene.onKeyboardObservable.add((kbInfo) => {
        if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
            if (kbInfo.event.key === 'd') {
                undoMesh(box, extrusionDetails, cursorText);
            }
            else if(kbInfo.event.key === 'r') {
                resetMesh(box, extrusionDetails, cursorText);
            }
            else if(kbInfo.event.key === 's') {
                allowScaling = true;
            }
        }
        if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
            allowScaling = false;
        }
    });

    scene.onPointerMove = function (event) {
        
        var pickResult = scene.pick(scene.pointerX, scene.pointerY);
        if(extrusionDetails.allow == true){
            extrusionDetails.mesh.enableEdgesRendering();
            extrudeFace(extrusionDetails, allowScaling, cursorText);
        }
        // Check if a mesh was picked
        if (pickResult.hit && pickResult.pickedMesh === box){
            changeColor(pickResult, box, new BABYLON.Color4(0.77,0.81,0.93, 1));
        }
        else {
            resetSelectedFaces(box);
        }
    };

    scene.onPointerDown = function (event, pickResult) {
        if (pickResult.hit && pickResult.pickedMesh === box) {
            pressedDownOnFace = true;
        }
    }

    scene.onPointerUp = function (event, pickResult) {
        // Check if a mesh was picked
        if(pressedDownOnFace == true){
            if(extrusionDetails.allow == true) {
                nullifyExtrusionDetails(extrusionDetails, cursorText);
                pressedDownOnFace = false;
            }
            else {
                if (pickResult.hit && pickResult.pickedMesh === box) {
                    // TODO: CREATE NEW CUBE TO REPLACE OLD CUBE
                    extrusionDetails.allow = true;
                    extrusionDetails.mesh = box;
                    extrusionDetails.face = 2*Math.floor(pickResult.faceId/2);
                    extrusionDetails.position = unproject({x:scene.pointerX, y:scene.pointerY});
                    extrusionDetails.originalGeometry = box.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                }
            }
        }
    };

    return scene;
};

const scene = createScene(); //Call the createScene function

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    // const box = scene.getMeshByName("box");
    // box.rotation.y += 0.01;
    scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
  engine.resize();
});

function changeColor(pickResult, box, clr) { 
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

function drawAxes(size, scene) {

    
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

function resetSelectedFaces(box) {
    var positions = box.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    var nbVertices = positions.length / 3;
    var colors = new Array(4 * nbVertices);
    colors = colors.fill(1);
    box.updateVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
    selectedFace = -1;
}

function resetMesh(box, extrusionDetails, cursorText) {
    nullifyExtrusionDetails(extrusionDetails, cursorText);
    box.setVerticesData(BABYLON.VertexBuffer.PositionKind, resetGeometry, true);
    box.enableEdgesRendering();
}

function undoMesh(box, extrusionDetails, cursorText) {
    box.setVerticesData(BABYLON.VertexBuffer.PositionKind, extrusionDetails.originalGeometry, true);
    nullifyExtrusionDetails(extrusionDetails, cursorText);
}

function extrudeFace(extrusionDetails, isKeyPressed, cursorText) {
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
    });
    var offset = (mousePosition.subtract(position)).scale(14);

    var indicesList = new Set();
    indicesList.add(indices[facet * 3]);
    indicesList.add(indices[facet * 3 + 1]);
    indicesList.add(indices[facet * 3 + 2]);
    indicesList.add(indices[(facet + 1) * 3]);
    indicesList.add(indices[(facet + 1) * 3 + 1]);
    indicesList.add(indices[(facet + 1) * 3 + 2]);
    
    var verticlesList = new Set();
    indicesList.forEach( index => {
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

    var [v0, v1, v2] = Array.from(verticlesList);

    var faceNormal = BABYLON.Vector3.Cross(
        v2.subtract(v0), 
        v1.subtract(v0)
    );
    faceNormal.normalize();
    faceNormal.x =  Math.abs(faceNormal.x);
    faceNormal.y =  Math.abs(faceNormal.y);
    faceNormal.z =  Math.abs(faceNormal.z);

    var width = engine.getRenderWidth();
    var height = engine.getRenderHeight();
    cursorText.leftInPixels = scene.pointerX - (width / 2.0) + 55;
    cursorText.topInPixels = scene.pointerY - (height / 2.0) + 15;

    for(var i = 0; i < geometry.length / 3; i++){
        var v = BABYLON.Vector3.FromArray(geometry, i*3);
        verticlesList.forEach( vertex => {
            if(vertex.equals(v)) {
                modifyDistance(geometry, i, faceNormal, offset, originalGeometry, isKeyPressed, extrusionDetails.centerVertex, cursorText);
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
        cursorText.text = `${(1 + offset.length())}`;
    }
    
}

function nullifyExtrusionDetails(extrusionDetails, cursorText) {
    extrusionDetails.allow = false;
    extrusionDetails.mesh = null;
    extrusionDetails.face = null;
    extrusionDetails.position = null;
    extrusionDetails.centerVertex = null;
    // extrusionDetails.originalGeometry = null;
    cursorText.text = "";
}

function setupLights(scene) {
    const ambientLight1 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 1), scene);
    ambientLight1.diffuse = new BABYLON.Color3(1, 1, 1);
    ambientLight1.intensity = 0.5;

    const ambientLight2 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(-1,-1,-1), scene);
    ambientLight2.diffuse = new BABYLON.Color3(1, 1, 1);
    ambientLight2.intensity = 0.5;

    const light = new BABYLON.PointLight("light", new BABYLON.Vector3(6,3,0), scene);
    light.diffuse = new BABYLON.Color3(1, 1, 1);
    light.intensity = 1;
}