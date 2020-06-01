import extend from "./third/ARHelper";
import * as THREE from "three";

// 扩展原生artoolkit的ARController方法，返回拓展后的ARController
const ARController = extend();

function init() {
  ARController.getUserMediaThreeScene({
    // 现在的浏览器兼容性很难用webrtc拿到想要的分辨率，一般都是手动全屏
    cameraParam: "./data/camera_para.dat",
    onSuccess: function (arScene, arController) {
      document.body.className = arController.orientation;

      alert(JSON.stringify({ w: window.innerWidth, h: window.innerHeight }));
      var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      if (window.innerWidth < window.innerHeight) {
        alert('phone');
        const w = window.innerWidth;
        const h = (window.innerWidth / arController.videoWidth) * arController.videoHeight;
        renderer.setSize(w, h);
        arScene.video.style.width = w;
        arScene.video.style.height = h;
      } else {
        alert("desktop");
        renderer.setSize(arController.videoWidth, arController.videoHeight);
        document.body.className += " desktop";
      }

      document.body.appendChild(renderer.domElement);

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

      var axesHelper = new THREE.AxesHelper(5);

      var sphere = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshNormalMaterial({ transparent: false, side: THREE.BackSide }));
      sphere.position.z = 0.5;

      const pointLight = new THREE.PointLight(0xffffff, 1, 50);
      pointLight.position.set(0, 5, 10);

      const geometry = new THREE.SphereGeometry(0.2, 64, 64);
      const cube = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: 0xffffff, shading: THREE.FlatShading }));
      cube.position.z = 0.5;

      arController.loadMarker("./data/patt.hiro", function (markerId) {
        var markerRoot = arController.createThreeMarker(markerId);
        markerRoot.add(sphere);
        markerRoot.add(cube);
        arScene.scene.add(pointLight);
        markerRoot.add(axesHelper);
        arScene.scene.add(markerRoot, axesHelper);
      });

      var tick = function () {
        // 检测标记并根据标记更新根元素的矩阵
        arScene.process();

        // 动画
        rotationV += (rotationTarget - sphere.rotation.z) * 0.05;
        sphere.rotation.z += rotationV;
        console.log(sphere.rotation.z);
        rotationV *= 0.8;

        // 更新画布
        var ac = renderer.autoClear;
        renderer.autoClear = false;
        renderer.clear();
        // renderer.render(this.videoScene, this.videoCamera);
        renderer.render(arScene.scene, arScene.camera);
        renderer.autoClear = ac;

        requestAnimationFrame(tick);
      };

      tick();
    },
  });
}

init();
