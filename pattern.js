import extend from "./third/ARHelper";
import {
  WebGLRenderer,
  Mesh,
  BoxGeometry,
  AnimationMixer,
  Clock,
  BackSide,
  AxesHelper,
  MeshLambertMaterial,
  PointLight,
  PointLightHelper,
  Box3
} from "three";
import { GLTFLoader } from "./third/GLTFLoader.js";
import { DRACOLoader } from "./third/DRACOLoader.js";

// 扩展原生artoolkit的ARController方法，返回拓展后的ARController
const ARController = extend();

function init() {
  const container = document.querySelector('.app');
  ARController.getUserMediaThreeScene({
    // 现在的浏览器兼容性很难用webrtc拿到想要的分辨率，一般是手动全屏
    cameraParam: "./data/camera_para.dat",
    onSuccess: function (arScene, arController) {
      // 竖屏适配
      document.querySelector('.app').classList.add(arController.orientation);
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
        container.classList.add('desktop');
      }

      container.appendChild(renderer.domElement);

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
              model.rotateX(90 * Math.PI / 180);
              var box = new Box3().setFromObject( model );
              const dis = {
                x: box.max.x - box.min.x,
                y: box.max.y - box.min.y,
                z: box.max.z - box.min.z
              }
              model.scale.set(5 / dis.x, 5 / dis.y, 5 / dis.y);

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
          arController.loadMultiMarker("./data/markerSet.mrk", function (markerId) {
            let markerRoot = arController.createThreeMultiMarker(markerId);
            arController.eventMap.set(markerRoot, [
              {
                target: {"0":0.998875081539154,"1":-0.03429223969578743,"2":0.03275034949183464,"3":0,"4":0.03305353969335556,"5":0.9987444281578064,"6":0.037643130868673325,"7":0,"8":-0.03400009870529175,"9":-0.03651827201247215,"10":0.9987544417381287,"11":0,"12":0.22713792324066162,"13":-0.9001671671867371,"14":-6.122226715087891,"15":1},
                threshold: 0.01, // 方差误差范围
                cb: function() {  // 回调
                  alert("it's there");
                }
              }
            ]);
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
        mixer.update(delta);

        // 简单交互
        rotationV += (rotationTarget - model.rotation.y) * 0.05;
        model.rotation.y += rotationV;
        rotationV *= 0.8;
        // 更新画布
        arScene.renderOn(renderer);
        requestAnimationFrame(tick);
      };

      let offset = [1, 1, 0.5];
      // 动画时钟
      let clock;
      let markerRoot;
      // 模型和标记都加载完毕
      Promise.all([loadController(), loadModel()]).then((res) => {
        markerRoot = res[0];
        let model = res[1];

        var light = new PointLight(0xffffff);
        light.position.set(500, 500, 400);
        arScene.scene.add(light, new PointLightHelper(light, 100));

        var light = new PointLight(0xff8800);
        light.position.set(-300, -100, -300);
        arScene.scene.add(light, new PointLightHelper(light, 100));

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
