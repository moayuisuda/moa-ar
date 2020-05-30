import extend from "./third/ARHelper";
import * as THREE from "three";

const ARController = extend();
function init() {
  ARController.getUserMediaThreeScene({
    // maxARVideoSize: 320,
    cameraParam: "./data/camera_para.dat",
    onSuccess: function (arScene, arController) {
      document.body.className = arController.orientation;
      
      var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      if (arController.orientation === "portrait") {
        var w = (window.innerWidth / arController.videoHeight) * arController.videoWidth;
        var h = window.innerWidth;
        renderer.setSize(w, h);
        renderer.domElement.style.paddingBottom = w - h + "px";
      } else {
        if (/Android|mobile|iPad|iPhone/i.test(navigator.userAgent)) {
          renderer.setSize(window.innerWidth, (window.innerWidth / arController.videoWidth) * arController.videoHeight);
        } else {
          renderer.setSize(arController.videoWidth, arController.videoHeight);
          document.body.className += " desktop";
        }
      }

      document.body.insertBefore(renderer.domElement, document.body.firstChild);

      var rotationV = 0;
      var rotationTarget = 0;

      renderer.domElement.addEventListener(
        "click",
        function (ev) {
          ev.preventDefault();
          rotationTarget += 1;
        },
        false
      );

      var sphere = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshNormalMaterial());
      sphere.position.z = 0.5;

      arController.loadMarker("./data/patt.hiro", function (markerId) {
        var markerRoot = arController.createThreeMarker(markerId);
        markerRoot.add(sphere);
        arScene.scene.add(markerRoot);
      });

      var tick = function () {
        arScene.process();

        rotationV += (rotationTarget - sphere.rotation.z) * 0.05;
        sphere.rotation.z += rotationV;
        console.log(sphere.rotation.z);
        rotationV *= 0.8;

        arScene.renderOn(renderer);
        requestAnimationFrame(tick);
      };

      tick();
    },
  });
}

init()