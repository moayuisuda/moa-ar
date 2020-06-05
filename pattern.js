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

      var renderer = new THREE.WebGLRenderer({ antialias: true });
      if (arController.orientation === "portrait") {
        alert("portrait");
        // 短边拉满全屏，类似于background的cover模式
        var w = (window.innerWidth / arController.videoHeight) * arController.videoWidth;
        var h = window.innerWidth;
        if (w < window.innerHeight) {
          w = window.innerHeight;
          h = (window.innerHeight / arController.videoWidth) * arController.videoHeight;
        }
        renderer.setSize(w, h);
        arScene.video.style.width = h;
        arScene.video.style.height = w;
        renderer.domElement.style.paddingBottom = w - h + "px";
      } else {
        alert("请旋转手机");
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

      let markerRoot;
      // 加载标记，加载完毕会得到一个标记id，用这个id生成一个会自动变化矩阵的根元素，用这个根元素来装场景内的元素
      arController.loadMarker("./data/patt.hiro", function (markerId) {
        markerRoot = arController.createThreeMarker(markerId);
        markerRoot.add(sphere);
        markerRoot.add(cube);
        arScene.scene.add(pointLight);
        markerRoot.add(axesHelper);
        arScene.scene.add(markerRoot, axesHelper);
      });

      var tick = function () {
        // 检测标记并根据标记更新根元素的矩阵，并让markerroot不可见
        arScene.process();

        // 动画
        rotationV += (rotationTarget - sphere.rotation.z) * 0.05;
        sphere.rotation.z += rotationV;
        rotationV *= 0.8;

        // 更新画布
        arScene.renderOn(renderer);
        if (markerRoot) console.log(markerRoot.visible);
        requestAnimationFrame(tick);
      };

      tick();
    },
  });
}

init();
