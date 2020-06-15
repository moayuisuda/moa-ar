/* js ARToolKit integration */
import { PlaneBufferGeometry, MeshBasicMaterial, OrthographicCamera, Scene, Camera, Object3D, LinearFilter, VideoTexture, Mesh, BackSide } from "three";

// 主函数同来拓展artoolkit的ARController方法
const eventMap = new Map();

const extendARController = function () {
  ARController.getUserMediaThreeScene = function (userConfig) {
    let config = {};
    for (let i in userConfig) {
      config[i] = userConfig[i];
    }
    let onSuccess = userConfig.onSuccess;

    // artoolkit的onSucess方法
    config.onSuccess = function (arController, arCameraParam) {
      let arScene = arController.createThreeScene();
      // 用户定义的onSucess方法
      arController.eventMap = eventMap;
      onSuccess(arScene, arController, arCameraParam);
    };

    // config作为artoolkit原生函数的配置参数传入
    let video = this.getUserMediaARController(config);
    return video;
  };

  ARController.prototype.createThreeScene = function (video) {
    video = video || this.image;
    this.setupThree();

    // ios的safari如果video没有显示在dom上(包括display:none或者没appendChild到body的情况)，则videoTexture不会渲染
    document.body.appendChild(video);
    video.style.position = "absolute";

    let videoTex = new VideoTexture(video);
    videoTex.minFilter = LinearFilter;
    // 取消读取纹理时默认的左右颠倒行为
    videoTex.flipY = false;

    let plane = new Mesh(new PlaneBufferGeometry(2, 2), new MeshBasicMaterial({ map: videoTex, side: BackSide }));
    plane.material.depthTest = false;
    plane.material.depthWrite = false;

    // webgl的uv坐标和图片/视频的像素坐标是上下颠倒的，将相机上设置为-1，下设置为1来反转
    let videoCamera = new OrthographicCamera(-1, 1, -1, 1, -1, 1);
    let videoScene = new Scene();
    videoScene.add(plane);
    videoScene.add(videoCamera);

    // 当artoolkit检测到为portrait模式(肖像模式，可理解为手机竖屏的情况)，会将画布旋转来让相机正常工作(因为此时video会自动长宽对调，但库提供的是640*480的相机内参)，相机平面也需要旋转来匹配
    if (this.orientation === "portrait") {
      plane.rotation.z = Math.PI / 2;
    }

    let scene = new Scene();
    let camera = new Camera();
    camera.matrixAutoUpdate = false;
    setProjectionMatrix(camera.projectionMatrix, this.getCameraMatrix());

    scene.add(camera);

    let self = this;

    return {
      scene: scene,
      camera: camera,
      videoScene: videoScene,
      videoCamera: videoCamera,
      arController: this,
      video: video,
      // 先将所有的markerRoot设置为不可见，如果检测到标记则设置为可见
      process: function () {
        for (let i in self.threePatternMarkers) {
          self.threePatternMarkers[i].visible = false;
        }
        for (let i in self.threeNFTMarkers) {
          self.threeNFTMarkers[i].visible = false;
        }
        for (let i in self.threeBarcodeMarkers) {
          self.threeBarcodeMarkers[i].visible = false;
        }
        for (let i in self.threeMultiMarkers) {
          self.threeMultiMarkers[i].visible = false;
          for (let j = 0; j < self.threeMultiMarkers[i].markers.length; j++) {
            if (self.threeMultiMarkers[i].markers[j]) {
              self.threeMultiMarkers[i].markers[j].visible = false;
            }
          }
        }

        // 调用原生的process方法，检测标记，检测到会触发getMarker事件
        self.process(video);
      },

      renderOn: function (renderer) {
        videoTex.needsUpdate = true;

        let ac = renderer.autoClear;
        renderer.autoClear = false;
        renderer.clear();
        renderer.render(this.videoScene, this.videoCamera);
        renderer.render(this.scene, this.camera);
        renderer.autoClear = ac;
      },
    };
  };

  ARController.prototype.createThreeMarker = function (markerUID, markerWidth) {
    this.setupThree();
    let obj = new Object3D();
    obj.markerTracker = this.trackPatternMarkerId(markerUID, markerWidth);
    obj.matrixAutoUpdate = false;
    this.threePatternMarkers[markerUID] = obj;
    return obj;
  };

  ARController.prototype.createThreeMultiMarker = function (markerUID) {
    this.setupThree();
    let obj = new Object3D();
    obj.matrixAutoUpdate = false;
    obj.markers = [];
    this.threeMultiMarkers[markerUID] = obj;
    return obj;
  };

  // 初始化所有的标记检测监听器，只需执行一次
  let ifSetup = false;
  ARController.prototype.setupThree = function () {
    if (ifSetup) {
      return;
    }
    ifSetup = true;

    this.addEventListener("getMarker", function (ev) {
      let marker = ev.data.marker;
      let obj;

      if (ev.data.type === artoolkit.PATTERN_MARKER) {
        obj = this.threePatternMarkers[marker.idPatt];
      }
      if (obj) {
        setProjectionMatrix(obj.matrix, ev.data.matrixGL_RH);
        obj.visible = true;
      }
    });

    this.addEventListener("lostMarker", function (ev) {
      console.log("lost");
    });

    function variance(source, target) {
      let sum = 0;
      for (let i in source) {
        sum += Math.pow(source[i] - target[i], 2);
      }

      return sum / 15;
    }

    this.addEventListener("getMultiMarker", function (ev) {
      let obj = this.threeMultiMarkers[ev.data.multiMarkerId];
      matrix = JSON.stringify(ev.data.matrixGL_RH);
      if (obj) {
        obj.matrix.fromArray(ev.data.matrixGL_RH);

        let events;
        if(events = eventMap.get(obj)) {
          for(let event of events) {
            let offset = variance(ev.data.matrixGL_RH, event.target);
            console.log(offset);
            if (offset < event.threshold) event.cb();
          }
        }

        obj.visible = true;
      }
    });

    this.threePatternMarkers = {};
    this.threeMultiMarkers = {};
  };

  return ARController;
};

let matrix;
let result = document.querySelector('.matrix_result');
document.querySelector('.matrix').addEventListener('click', () => {
  if(matrix) result.innerHTML = matrix;
})

const setProjectionMatrix = function (projectionMatrix, value) {
  if (typeof projectionMatrix.elements.set === "function") {
    projectionMatrix.elements.set(value);
  } else {
    projectionMatrix.elements = [].slice.call(value);
  }
};

export default extendARController;
