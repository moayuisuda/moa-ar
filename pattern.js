import extend from "./third/ARHelper";
import {
  WebGLRenderer,
  Mesh,
  BoxGeometry,
  MeshNormalMaterial,
  AnimationMixer,
  Clock,
  BackSide,
  AxesHelper,
  MeshLambertMaterial,
  MeshBasicMaterial,
  PointLight,
  SphereGeometry,
  PointLightHelper,
} from "three";
import { GLTFLoader } from "./third/GLTFLoader.js";
import { DRACOLoader } from "./third/DRACOLoader.js";

// 扩展原生artoolkit的ARController方法，返回拓展后的ARController
const ARController = extend();

function init() {
  ARController.getUserMediaThreeScene({
    // 现在的浏览器兼容性很难用webrtc拿到想要的分辨率，一般是手动全屏
    cameraParam: "./data/camera_para.dat",
    onSuccess: function (arScene, arController) {
      // 竖屏适配
      document.body.className = arController.orientation;
      let renderer = new WebGLRenderer({ antialias: true });
      if (arController.orientation === "portrait") {
        alert("portrait");
        // 短边拉满全屏，类似于background的cover模式
        let w = (window.innerWidth / arController.videoHeight) * arController.videoWidth;
        let h = window.innerWidth;
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

      // 加载模型
      let dracoLoader = new DRACOLoader();
      // 模型解码器路径
      dracoLoader.setDecoderPath("third/draco/gltf/");

      let loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);

      let model;
      let mixer;
      function loadModel() {
        return new Promise((resolve) => {
          loader.load(
            "data/LittlestTokyo.glb",
            function (gltf) {
              model = gltf.scene;
              model.position.z = 50;
              model.position.y = 100;
              model.position.x = 100;
              model.scale.set(0.1, 0.1, 0.1);

              mixer = new AnimationMixer(model);
              mixer.clipAction(gltf.animations[0]).play();

              resolve(model);
            },
            (p) => {
              console.log(p);
            },
            function (e) {
              console.error(e);
            }
          );
          // var geometry = new SphereGeometry(50, 32, 32);
          // var material = new MeshLambertMaterial({ color: 0xffff00 });
          // model = new Mesh(geometry, material);

          // resolve(model);
        });
      }

      // 加载标记，加载完毕会得到一个标记id，用这个id生成一个会自动根据标记变化矩阵的根元素，用这个根元素来装其他的元素
      function loadController() {
        return new Promise((resolve) => {
          // 标记文件对应"./data/markers.jpg"图片
          arController.loadMultiMarker("./data/markers.mrk", function (markerId) {
            let markerRoot = arController.createThreeMultiMarker(markerId);
            let axesHelper = new AxesHelper(50);
            markerRoot.add(axesHelper);
            resolve(markerRoot);
          });
        });
      }

      renderer.domElement.addEventListener(
        "click",
        function (ev) {
          ev.preventDefault();
          rotationTarget += 1;
        },
        false
      );

      let rotationV = 0;
      let rotationTarget = 0;
      let tick = function () {
        // 检测标记并根据标记更新根元素的变化矩阵
        arScene.process();

        let delta = clock.getDelta();
        // mixer.update(delta);

        // 简单交互
        rotationV += (rotationTarget - model.rotation.y) * 0.05;
        model.rotation.y += rotationV;
        rotationV *= 0.8;
        // 更新画布
        arScene.renderOn(renderer);
        requestAnimationFrame(tick);
      };

      // 动画时钟
      let offset = [0, 0, 50];
      let clock;
      // 模型和标记都加载完毕
      Promise.all([loadController(), loadModel()]).then((res) => {
        const [markerRoot, model] = res;

        var light = new PointLight(0xffffff);
        light.position.set(400, 400, 400);
        arScene.scene.add(light, new PointLightHelper(light, 50));

        var light = new PointLight(0xff8800);
        light.position.set(-400, -200, -300);
        arScene.scene.add(light, new PointLightHelper(light, 50));

        let box = new Mesh(new BoxGeometry(100, 100, 100), new MeshLambertMaterial({ color: 0xffffff, side: BackSide }));
        model.position.set(...offset);
        box.position.set(...offset);

        arScene.scene.add(markerRoot);
        markerRoot.add(model);
        clock = new Clock();
        tick();
      });
    },
  });
}

init();
