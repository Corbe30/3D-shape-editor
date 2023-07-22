import { transparentBlack, alertRed, babylonColor } from "./utility/colorUtils.mjs";
import { changeColor, resetSelectedFaces, resetMesh, undoMesh, rotateMesh, extrudeFace, nullifyExtrusionDetails } from "./utility/meshUtils.mjs";
import { setupLights, drawAxes } from "./utility/sceneUtils.mjs";
import { unproject } from "./utility/mathUtils.mjs";

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

var resetGeometry = null;
var resetRotation = null;
var pressedDownOnFace = false;
var allowScaling = false;
var allowRotation = false;
var selectedFace = -1;
var extrusionDetails = {
    allow: false,
    mesh: null,
    face: null,
    position: null,
    originalGeometry: null,
    originalRotation: null,
    centerVertex: null,
    indicesList: null
};

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

    var guideLine = BABYLON.Mesh.CreateLines("guideLine", [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 0)], scene);

    var box = BABYLON.MeshBuilder.CreateBox("box", {size: 2}, scene);
    box.material = new BABYLON.StandardMaterial("boxMaterial", scene);
    box.material.backFaceCulling = false;
    
    resetGeometry = box.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    extrusionDetails.originalGeometry = resetGeometry;

    resetRotation = BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 0, 0), 0);
    extrusionDetails.originalRotation = resetRotation;

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
                extrusionDetails.originalGeometry = null;
                extrusionDetails.originalRotation = null;
                guideLine.dispose();
                
            }
            else if(kbInfo.event.key === 'x') {
                resetMesh(box, extrusionDetails, cursorText, resetGeometry, resetRotation);
                guideLine.dispose();
            }
            else if(kbInfo.event.key === 's') {
                if(allowScaling == false) {
                    allowScaling = true;
                    allowRotation = false;
                    document.getElementById("scale").style.backgroundColor = alertRed;
                    document.getElementById("rotate").style.backgroundColor = transparentBlack;
                }
                else {
                    allowScaling = false;
                    document.getElementById("scale").style.backgroundColor = transparentBlack;
                }
            }
            else if(kbInfo.event.key === 'r') {
                if(allowRotation == false) {
                    allowRotation = true;
                    allowScaling = false;
                    document.getElementById("scale").style.backgroundColor = transparentBlack;
                    document.getElementById("rotate").style.backgroundColor = alertRed;
                }
                else {
                    allowRotation = false;
                    document.getElementById("rotate").style.backgroundColor = transparentBlack;
                }
            }
        }
    });

    scene.onPointerMove = function (event) {
        
        var pickResult = scene.pick(scene.pointerX, scene.pointerY);
        if(extrusionDetails.allow == true){
            extrusionDetails.mesh.enableEdgesRendering();
            
            const mousePosition = unproject({
                x: scene.pointerX,
                y: scene.pointerY,
                engine, scene
            });
            
            guideLine.dispose();
            guideLine = BABYLON.Mesh.CreateLines("guideLine", [mousePosition, extrusionDetails.position], scene);
            guideLine.color = babylonColor.black;

            if(!allowRotation)
                extrudeFace(extrusionDetails, allowScaling, cursorText, engine, scene);
            else
                rotateMesh(extrusionDetails, cursorText, engine, scene);

        }
        // Check if a mesh was picked
        if (pickResult.hit && pickResult.pickedMesh === box){
            changeColor(pickResult, box, babylonColor.hoverBlue, selectedFace);
        }
        else {
            if(box != null && selectedFace != null)
                resetSelectedFaces(box, selectedFace);
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
                guideLine.dispose();
                pressedDownOnFace = false;
            }
            else {
                if (pickResult.hit && pickResult.pickedMesh === box) {
                    // TODO: CREATE NEW CUBE TO REPLACE OLD CUBE
                    extrusionDetails.allow = true;
                    extrusionDetails.mesh = box;
                    extrusionDetails.face = 2*Math.floor(pickResult.faceId/2);
                    extrusionDetails.position = unproject({x:scene.pointerX, y:scene.pointerY, engine, scene});
                    extrusionDetails.originalGeometry = box.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                    extrusionDetails.originalRotation = box.rotationQuaternion;
                }
            }
        }
    };

    return scene;
};

const scene = createScene();

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
  engine.resize();
});